import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { cancelOrder, clearCurrentOrder, fetchOrderById } from '../features/orders/ordersSlice.js';
import { pushToast } from '../features/ui/uiSlice.js';
import { PageLoader, EmptyState } from '../components/Feedback.jsx';
import { formatCurrency, formatDate, statusClass, ORDER_STATUS_LABELS } from '../utils/format.js';

export default function OrderDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { current, error } = useSelector((state) => state.orders);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dispatch(clearCurrentOrder());
    dispatch(fetchOrderById(id)).finally(() => setLoading(false));

    return () => dispatch(clearCurrentOrder());
  }, [dispatch, id]);

  if (loading) return <PageLoader />;

  if (!current) {
    return (
      <div className="page container">
        <EmptyState title="Pedido no encontrado" description={error} action={<Link to="/pedidos" className="btn btn--primary">Mis pedidos</Link>} />
      </div>
    );
  }

  const handleCancel = async () => {
    const action = await dispatch(cancelOrder(current._id));

    if (cancelOrder.fulfilled.match(action)) {
      dispatch(pushToast({ message: 'Pedido cancelado.', type: 'info' }));
    } else {
      dispatch(pushToast({ message: action.payload || 'No se pudo cancelar.', type: 'error' }));
    }
  };

  const itemCount = current.items.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="page container">
      <nav className="breadcrumbs">
        <Link to="/pedidos">Mis pedidos</Link>
        <span>/</span>
        <span>{current.orderNumber}</span>
      </nav>

      <header className="page-head page-head--row">
        <div>
          <h1>{current.orderNumber}</h1>
          <p>Realizado el {formatDate(current.createdAt)}</p>
        </div>
        <span className={statusClass(current.status)}>{ORDER_STATUS_LABELS[current.status]}</span>
      </header>

      <div className="order-layout">
        <div className="order-main">
          <section className="panel">
            <h2>Productos</h2>
            <ul className="order-items">
              {current.items.map((item, index) => (
                <li key={`${item.product}-${index}`}>
                  <img src={item.image} alt={item.name} />
                  <div className="order-items__info">
                    <Link to={`/producto/${item.slug}`}>{item.name}</Link>
                    <span className="muted">{item.quantity} × {formatCurrency(item.price)}</span>
                  </div>
                  <strong>{formatCurrency(item.price * item.quantity)}</strong>
                </li>
              ))}
            </ul>
          </section>

          <div className="grid-2">
            <section className="panel">
              <h2>Envío</h2>
              <p>
                <strong>{current.shippingAddress.fullName}</strong><br />
                {current.shippingAddress.address}<br />
                {current.shippingAddress.city}, {current.shippingAddress.postalCode}<br />
                {current.shippingAddress.country}
                {current.shippingAddress.phone && (<><br />Tel: {current.shippingAddress.phone}</>)}
              </p>
              {current.notes && <p className="muted">Notas: {current.notes}</p>}
            </section>

            <section className="panel">
              <h2>Pago</h2>
              <dl className="summary__list">
                <div><dt>Artículos ({itemCount})</dt><dd>{formatCurrency(current.itemsPrice)}</dd></div>
                <div><dt>Envío</dt><dd>{current.shippingPrice === 0 ? 'Gratis' : formatCurrency(current.shippingPrice)}</dd></div>
                <div><dt>IGV (18%)</dt><dd>{formatCurrency(current.taxPrice)}</dd></div>
                <div className="summary__total"><dt>Total</dt><dd>{formatCurrency(current.totalPrice)}</dd></div>
              </dl>
              <p className="muted small">
                Método: {current.paymentMethod === 'demo' ? 'Pago simulado (demo)' : current.paymentMethod}
                {current.isPaid && <><br />Pagado el {formatDate(current.paidAt)}</>}
              </p>
            </section>
          </div>
        </div>

        <aside className="order-sidebar">
          <section className="panel">
            <h2>Seguimiento</h2>
            <ol className="timeline">
              <li className={current.status !== 'cancelled' ? 'is-done' : 'is-cancelled'}>
                Pedido realizado <span>{formatDate(current.createdAt)}</span>
              </li>
              <li className={current.isPaid ? 'is-done' : ''}>
                Pago confirmado <span>{current.paidAt ? formatDate(current.paidAt) : 'Pendiente'}</span>
              </li>
              <li className={['shipped', 'delivered'].includes(current.status) ? 'is-done' : ''}>
                Enviado <span>{current.shippedAt ? formatDate(current.shippedAt) : '—'}</span>
              </li>
              <li className={current.status === 'delivered' ? 'is-done' : ''}>
                Entregado <span>{current.deliveredAt ? formatDate(current.deliveredAt) : '—'}</span>
              </li>
            </ol>

            {current.status === 'pending' && (
              <button type="button" className="btn btn--danger btn--block" onClick={handleCancel}>
                Cancelar pedido
              </button>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
