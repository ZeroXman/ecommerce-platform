import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchMyOrders } from '../features/orders/ordersSlice.js';
import { EmptyState, Spinner } from '../components/Feedback.jsx';
import { formatCurrency, formatDateShort, statusClass, ORDER_STATUS_LABELS } from '../utils/format.js';

export default function MyOrdersPage() {
  const dispatch = useDispatch();
  const { list, status } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchMyOrders());
  }, [dispatch]);

  if (status === 'loading') return <div className="page container"><Spinner label="Cargando pedidos..." /></div>;

  if (list.length === 0) {
    return (
      <div className="page container">
        <EmptyState
          title="Todavía no tienes pedidos"
          description="Cuando hagas tu primera compra, aparecerá aquí."
          action={<Link to="/productos" className="btn btn--primary">Explorar productos</Link>}
        />
      </div>
    );
  }

  return (
    <div className="page container">
      <header className="page-head">
        <h1>Mis pedidos</h1>
        <p>{list.length} pedido(s)</p>
      </header>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Fecha</th>
              <th>Artículos</th>
              <th>Total</th>
              <th>Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.map((order) => (
              <tr key={order._id}>
                <td><strong>{order.orderNumber}</strong></td>
                <td>{formatDateShort(order.createdAt)}</td>
                <td>{order.itemCount ?? order.items.reduce((t, i) => t + i.quantity, 0)}</td>
                <td>{formatCurrency(order.totalPrice)}</td>
                <td><span className={statusClass(order.status)}>{ORDER_STATUS_LABELS[order.status]}</span></td>
                <td><Link className="link" to={`/pedidos/${order._id}`}>Ver detalle</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
