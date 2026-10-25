import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="page container">
      <div className="not-found">
        <span className="not-found__code">404</span>
        <h1>Página no encontrada</h1>
        <p className="muted">La ruta que buscas no existe o fue movida.</p>
        <div className="hero__actions">
          <Link to="/" className="btn btn--primary">Volver al inicio</Link>
          <Link to="/productos" className="btn btn--ghost">Ver catálogo</Link>
        </div>
      </div>
    </div>
  );
}
