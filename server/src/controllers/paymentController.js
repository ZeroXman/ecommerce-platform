import crypto from 'node:crypto';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';
import { getStripe, isDemoMode, stripeEnabled, toCents } from '../services/stripeService.js';

export const getPaymentConfig = asyncHandler(async (req, res) => {
  res.json({
    ok: true,
    demoMode: isDemoMode(),
    provider: stripeEnabled() ? 'stripe' : 'demo',
    publishableKey: env.stripe.publishableKey,
    currency: env.payments.currency,
  });
});

export const createPaymentIntent = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  const order = await Order.findById(orderId);

  if (!order) {
    throw ApiError.notFound('Pedido no encontrado.');
  }

  if (order.user.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Este pedido no te pertenece.');
  }

  if (order.isPaid) {
    throw ApiError.conflict('Este pedido ya está pagado.');
  }

  if (order.status === 'cancelled') {
    throw ApiError.conflict('Este pedido está cancelado.');
  }

  if (isDemoMode()) {
    const demoId = `demo_${crypto.randomBytes(12).toString('hex')}`;
    order.paymentMethod = 'demo';
    order.paymentResult = { id: demoId, status: 'requires_payment_method', provider: 'demo', paidAt: null };
    await order.save();

    return res.json({
      ok: true,
      demo: true,
      clientSecret: `${demoId}_secret_demo`,
      amount: order.totalPrice,
      currency: env.payments.currency,
      message: 'Modo demo activo: no se realizará ningún cargo real.',
    });
  }

  const stripe = getStripe();

  const intent = await stripe.paymentIntents.create({
    amount: toCents(order.totalPrice),
    currency: env.payments.currency,
    automatic_payment_methods: { enabled: true },
    metadata: {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      userId: req.user._id.toString(),
    },
  });

  order.paymentMethod = 'stripe';
  order.paymentResult = { id: intent.id, status: intent.status, provider: 'stripe', paidAt: null };
  await order.save();

  res.json({
    ok: true,
    demo: false,
    clientSecret: intent.client_secret,
    amount: order.totalPrice,
    currency: env.payments.currency,
  });
});

async function decrementStock(order) {
  for (const item of order.items) {
    const result = await Product.updateOne(
      { _id: item.product, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity, sold: item.quantity } }
    );

    if (result.modifiedCount === 0) {
      throw ApiError.conflict(`Sin stock suficiente para "${item.name}" al confirmar el pago.`);
    }
  }
}

async function markOrderAsPaid(order, { id, status, provider }) {
  if (order.isPaid) return order;

  await decrementStock(order);

  order.isPaid = true;
  order.paidAt = new Date();
  order.status = 'paid';
  order.paymentResult = { id, status, provider, paidAt: new Date() };

  await order.save();
  return order;
}

export const confirmPayment = asyncHandler(async (req, res) => {
  const { paymentIntentId } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    throw ApiError.notFound('Pedido no encontrado.');
  }

  if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw ApiError.forbidden('Este pedido no te pertenece.');
  }

  if (order.isPaid) {
    return res.json({ ok: true, order, message: 'El pedido ya estaba pagado.' });
  }

  const intentId = paymentIntentId || order.paymentResult?.id || '';

  if (isDemoMode()) {
    if (!intentId.startsWith('demo_')) {
      throw ApiError.badRequest('En modo demo el identificador de pago debe empezar por "demo_".');
    }

    const paid = await markOrderAsPaid(order, { id: intentId, status: 'succeeded', provider: 'demo' });

    return res.json({ ok: true, order: paid, demo: true, message: 'Pago simulado confirmado.' });
  }

  const stripe = getStripe();
  const intent = await stripe.paymentIntents.retrieve(intentId);

  if (intent.status !== 'succeeded') {
    throw ApiError.badRequest(`El pago no se completó (estado: ${intent.status}).`);
  }

  if (intent.metadata?.orderId && intent.metadata.orderId !== order._id.toString()) {
    throw ApiError.badRequest('El pago no corresponde a este pedido.');
  }

  if (intent.amount_received < toCents(order.totalPrice) && intent.amount < toCents(order.totalPrice)) {
    throw ApiError.badRequest('El importe pagado no coincide con el total del pedido.');
  }

  const paid = await markOrderAsPaid(order, {
    id: intent.id,
    status: intent.status,
    provider: 'stripe',
  });

  res.json({ ok: true, order: paid, demo: false });
});

export const stripeWebhook = asyncHandler(async (req, res) => {
  const stripe = getStripe();

  if (!stripe || !env.stripe.webhookSecret) {
    return res.status(400).json({ ok: false, error: 'Webhook no configurado.' });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      env.stripe.webhookSecret
    );
  } catch (error) {
    return res.status(400).json({ ok: false, error: `Firma inválida: ${error.message}` });
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    const order = await Order.findById(intent.metadata?.orderId);

    if (order && !order.isPaid) {
      try {
        await markOrderAsPaid(order, {
          id: intent.id,
          status: intent.status,
          provider: 'stripe',
        });
      } catch (error) {
        console.error('[webhook] No se pudo marcar el pedido como pagado:', error.message);
      }
    }
  }

  res.json({ received: true });
});
