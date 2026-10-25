import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { calculateTotals, generateOrderNumber } from '../utils/pricing.js';

const ADMIN_ACTIONS = {
  processing: {},
  shipped: { shippedAt: new Date() },
  delivered: { deliveredAt: new Date(), isPaid: true },
  cancelled: {},
};

async function buildOrderItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw ApiError.badRequest('El pedido debe incluir al menos un producto.');
  }

  const ids = [...new Set(rawItems.map((item) => String(item.product)))];

  const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));

  if (validIds.length !== ids.length) {
    throw ApiError.badRequest('Uno de los productos no es válido.');
  }

  const products = await Product.find({ _id: { $in: validIds }, isActive: true });
  const byId = new Map(products.map((product) => [product._id.toString(), product]));

  return rawItems.map((item) => {
    const product = byId.get(String(item.product));

    if (!product) {
      throw ApiError.badRequest('Un producto del carrito ya no está disponible.');
    }

    const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));

    if (product.stock < quantity) {
      throw ApiError.conflict(`Stock insuficiente para "${product.name}". Disponible: ${product.stock}.`);
    }

    return {
      product: product._id,
      name: product.name,
      slug: product.slug,
      image: product.images?.[0] || '',
      price: product.price,
      quantity,
    };
  });
}

export const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod = 'stripe', notes = '' } = req.body;

  if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.address) {
    throw ApiError.badRequest('La dirección de envío está incompleta.');
  }

  const orderItems = await buildOrderItems(items);
  const itemsPrice = orderItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const totals = calculateTotals(itemsPrice);

  const order = await Order.create({
    user: req.user._id,
    orderNumber: generateOrderNumber(),
    items: orderItems,
    shippingAddress,
    paymentMethod,
    notes,
    ...totals,
  });

  res.status(201).json({ ok: true, order });
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ ok: true, orders });
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (!order) {
    throw ApiError.notFound('Pedido no encontrado.');
  }

  const isOwner = order.user._id.toString() === req.user._id.toString();

  if (!isOwner && req.user.role !== 'admin') {
    throw ApiError.forbidden('No puedes ver este pedido.');
  }

  res.json({ ok: true, order });
});

export const listAllOrders = asyncHandler(async (req, res) => {
  const { status = '', page = 1, limit = 20 } = req.query;
  const filter = {};

  if (status) filter.status = status;

  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit),
    Order.countDocuments(filter),
  ]);

  res.json({ ok: true, orders, page: safePage, pages: Math.ceil(total / safeLimit) || 1, total });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!Object.keys(ADMIN_ACTIONS).includes(status)) {
    throw ApiError.badRequest(`Estado inválido. Opciones: ${Object.keys(ADMIN_ACTIONS).join(', ')}.`);
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    throw ApiError.notFound('Pedido no encontrado.');
  }

  if (order.status === 'cancelled') {
    throw ApiError.conflict('Un pedido cancelado no puede cambiar de estado.');
  }

  order.status = status;
  Object.assign(order, ADMIN_ACTIONS[status]);
  await order.save();

  res.json({ ok: true, order });
});

export const cancelMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw ApiError.notFound('Pedido no encontrado.');
  }

  if (order.user.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('No puedes cancelar este pedido.');
  }

  if (order.isPaid || order.status !== 'pending') {
    throw ApiError.conflict('Solo puedes cancelar pedidos pendientes de pago.');
  }

  order.status = 'cancelled';
  await order.save();

  res.json({ ok: true, order });
});

export const getDashboardStats = asyncHandler(async (req, res) => {
  const [totals, byStatus, topProducts, monthly] = await Promise.all([
    Order.aggregate([
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          revenue: { $sum: { $cond: ['$isPaid', '$totalPrice', 0] } },
          paidOrders: { $sum: { $cond: ['$isPaid', 1, 0] } },
        },
      },
    ]),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { isPaid: true } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { quantity: -1 } },
      { $limit: 5 },
    ]),
    Order.aggregate([
      { $match: { isPaid: true } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: '$totalPrice' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
    ]),
  ]);

  const productCount = await Product.countDocuments();
  const lowStock = await Product.find({ isActive: true, stock: { $lte: 5 } }).select('name stock');

  res.json({
    ok: true,
    stats: {
      orders: totals[0]?.orders || 0,
      paidOrders: totals[0]?.paidOrders || 0,
      revenue: Math.round((totals[0]?.revenue || 0) * 100) / 100,
      products: productCount,
      statusBreakdown: byStatus.map((entry) => ({ status: entry._id, count: entry.count })),
      topProducts,
      monthly,
      lowStock,
    },
  });
});
