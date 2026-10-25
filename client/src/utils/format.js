export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: currency.toUpperCase(),
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

export function formatDate(value) {
  if (!value) return '—';

  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatDateShort(value) {
  if (!value) return '—';

  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' }).format(new Date(value));
}

export const ORDER_STATUS_LABELS = {
  pending: 'Pendiente',
  paid: 'Pagado',
  processing: 'En proceso',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

export function statusClass(status) {
  if (['paid', 'delivered'].includes(status)) return 'badge badge--success';
  if (['processing', 'shipped'].includes(status)) return 'badge badge--info';
  if (status === 'cancelled') return 'badge badge--danger';
  return 'badge badge--warning';
}
