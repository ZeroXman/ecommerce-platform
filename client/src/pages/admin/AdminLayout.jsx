import { NavLink, Outlet } from 'react-router-dom';

const TABS = [
  { to: '/admin', end: true, label: 'Dashboard' },
  { to: '/admin/productos', label: 'Productos' },
  { to: '/admin/pedidos', label: 'Pedidos' },
  { to: '/admin/usuarios', label: 'Usuarios' },
];

export default function AdminLayout() {
  return (
    <div className="page container">
      <header className="page-head">
        <h1>Panel de administración</h1>
        <p>Gestión de catálogo, pedidos y usuarios</p>
      </header>

      <nav className="tabs">
        {TABS.map((tab) => (
          <NavLink key={tab.to} to={tab.to} end={tab.end} className={({ isActive }) => (isActive ? 'tab is-active' : 'tab')}>
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}
