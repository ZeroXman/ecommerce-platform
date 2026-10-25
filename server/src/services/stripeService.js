import Stripe from 'stripe';
import { env } from '../config/env.js';

let client = null;

export function stripeEnabled() {
  return Boolean(env.stripe.secretKey);
}

export function isDemoMode() {
  return env.payments.demo || !stripeEnabled();
}

export function getStripe() {
  if (!stripeEnabled()) return null;

  if (!client) {
    client = new Stripe(env.stripe.secretKey);
  }

  return client;
}

export function toCents(amount) {
  return Math.round(Number(amount) * 100);
}
