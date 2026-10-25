import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../../api/client.js';
import { Spinner, EmptyState } from '../../components/Feedback.jsx';
import { formatCurrency, ORDER_STATUS_LABELS } from '../../utils/format.js';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/stats')
      .then(({ data }) => setStats(data.stats))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  if (error) return <EmptyState title="No se pudieron cargar las métricas" description={error} />;
  if (!stats) return <Spinner label="Cargando métricas..." />;

  const cards = [
    { label: 'Ingresos', value: formatCurrency(stats.revenue), accent: 'success' },
    { label: 'Pedidos pagados', value: stats.paidOrders, accent: 'info' },
    { label: 'Pedidos totales', value: stats.orders, accent: '' },
    { label: 'Productos', value: stats.products, accent: '' },
  ];

  return (
    <div className="admin-page">
      <div className="stat-cards">
        {cards.map((card) => (
          <div key={card.label} className={`stat-card stat-card--${card.accent}`}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <section className="panel">
          <div className="panel__head">
            <h2>Ventas por mes</h2>
            <Link className="link" to="/admin/pedidos">Ver pedidos</Link>
          </div>

          {stats.monthly.length === 0 ? (
            <p className="muted">Aún no hay ventas registradas.</p>
          ) : (
            <ul className="mini-bars">
              {stats.monthly.map((entry) => {
                const max = Math.max(...stats.monthly.map((m) => m.revenue), 1);
                const height = Math.max(8, Math.round((entry.revenue / max) * 100));

                return (
                  <li key={`${entry._id.year}-${entry._id.month}`}>
                    <div className="mini-bars__bar" style={{ height: `${height}%` }} title={formatCurrency(entry.revenue)} />
                    <span>{entry._id.month}/{String(entry._id.year).slice(2)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="panel">
          <h2>Productos más vendidos</h2>
          {stats.topProducts.length === 0 ? (
            <p className="muted">Sin ventas todavía.</p>
          ) : (
            <ul className="rank-list">
              {stats.topProducts.map((product, index) => (
                <li key={product._id}>
                  <span className="rank-list__pos">{index + 1}</span>
                  <span className="rank-list__name">{product.name}</span>
                  <span className="rank-list__qty">{product.quantity} u.</span>
                  <strong>{formatCurrency(product.revenue)}</strong>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid-2">
        <section className="panel">
          <h2>Pedidos por estado</h2>
          <div className="chips">
            {stats.statusBreakdown.length === 0 && <span className="muted">Sin pedidos.</span>}
            {stats.statusBreakdown.map((entry) => (
              <span key={entry.status} className="chip">
                {ORDER_STATUS_LABELS[entry.status] || entry.status}: <strong>{entry.count}</strong>
              </span>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Stock bajo (≤ 5)</h2>
          {stats.lowStock.length === 0 ? (
            <p className="muted">Todos los productos tienen stock suficiente.</p>
          ) : (
            <ul className="rank-list">
              {stats.lowStock.map((product) => (
                <li key={product._id}>
                  <span className="rank-list__name">{product.name}</span>
                  <span className={`badge ${product.stock === 0 ? 'badge--danger' : 'badge--warning'}`}>
                    {product.stock} uds
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
