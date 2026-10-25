import { env } from '../config/env.js';

export function round(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function calculateTotals(itemsPrice) {
  const { taxRate, shippingCost, freeShippingThreshold } = env.payments;
  const subtotal = round(itemsPrice);
  const shippingPrice = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : round(shippingCost);
  const taxPrice = round(subtotal * taxRate);
  const totalPrice = round(subtotal + shippingPrice + taxPrice);

  return { itemsPrice: subtotal, shippingPrice, taxPrice, totalPrice };
}

export function generateOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${stamp}-${random}`;
}
