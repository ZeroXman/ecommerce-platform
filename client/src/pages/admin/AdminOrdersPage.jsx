import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import api, { errorMessage } from '../../api/client.js';
import { Spinner, EmptyState } from '../../components/Feedback.jsx';
import { pushToast } from '../../features/ui/uiSlice.js';
import { formatCurrency, formatDateShort, statusClass, ORDER_STATUS_LABELS } from '../../utils/format.js';

const STATUSES = ['processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrdersPage() {
  const dispatch = useDispatch();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const { data } = await api.get(`/admin/orders${filter ? `?status=${filter}` : ''}`);
      setOrders(data.orders);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (orderId, status) => {
    try {
      const { data } = await api.put(`/admin/orders/${orderId}/status`, { status });
      setOrders((prev) => prev.map((order) => (order._id === orderId ? { ...order, ...data.order } : order)));
      dispatch(pushToast({ message: `Estado actualizado: ${ORDER_STATUS_LABELS[status]}.`, type: 'success' }));
    } catch (err) {
      dispatch(pushToast({ message: errorMessage(err), type: 'error' }));
    }
  };

  if (loading) return <Spinner label="Cargando pedidos..." />;
  if (error) return <EmptyState title="Error al cargar pedidos" description={error} />;

  return (
    <div className="admin-page">
      <div className="admin-toolbar">
        <select value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="">Todos los estados</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>{ORDER_STATUS_LABELS[status]}</option>
          ))}
        </select>
        <button type="button" className="btn btn--ghost" onClick={load}>Actualizar</button>
      </div>

      {orders.length === 0 && <EmptyState title="Sin pedidos" description="No hay pedidos con ese filtro." />}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Artículos</th>
              <th>Total</th>
              <th>Pago</th>
              <th>Cambiar estado</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <td><strong>{order.orderNumber}</strong></td>
                <td>
                  <strong>{order.shippingAddress?.fullName || order.user?.name}</strong>
                  <br />
                  <span className="muted">{order.user?.email}</span>
                </td>
                <td>{formatDateShort(order.createdAt)}</td>
                <td>{order.items.reduce((total, item) => total + item.quantity, 0)}</td>
                <td>{formatCurrency(order.totalPrice)}</td>
                <td>
                  <span className={statusClass(order.status)}>{ORDER_STATUS_LABELS[order.status]}</span>
                  <br />
                  <span className="muted small">{order.isPaid ? 'Pagado' : 'Sin pagar'}</span>
                </td>
                <td>
                  <select
                    value={STATUSES.includes(order.status) ? order.status : ''}
                    disabled={order.status === 'cancelled'}
                    onChange={(event) => event.target.value && changeStatus(order._id, event.target.value)}
                  >
                    <option value="" disabled>Cambiar a...</option>
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>{ORDER_STATUS_LABELS[status]}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
