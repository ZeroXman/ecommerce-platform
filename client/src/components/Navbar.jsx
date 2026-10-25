import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectCartCount } from '../features/cart/cartSlice.js';
import { logoutUser, selectUser } from '../features/auth/authSlice.js';
import { pushToast } from '../features/ui/uiSlice.js';

export default function Navbar() {
  const user = useSelector(selectUser);
  const cartCount = useSelector(selectCartCount);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    dispatch(pushToast({ message: 'Sesión cerrada.', type: 'info' }));
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="brand">
          <span className="brand__mark">N</span>
          <span className="brand__text">NovaShop</span>
        </Link>

        <nav className="navbar__links">
          <Link to="/">Inicio</Link>
          <Link to="/productos">Productos</Link>
          {user && <Link to="/pedidos">Mis pedidos</Link>}
          {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
        </nav>

        <div className="navbar__actions">
          <Link to="/carrito" className="cart-button" aria-label="Carrito">
            Carrito
            {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
          </Link>

          {user ? (
            <div className="user-menu">
              <Link to="/perfil" className="user-chip">
                <span className="user-chip__avatar">{user.name.charAt(0).toUpperCase()}</span>
                <span className="user-chip__name">{user.name.split(' ')[0]}</span>
              </Link>
              <button type="button" className="btn btn--ghost btn--sm" onClick={handleLogout}>
                Salir
              </button>
            </div>
          ) : (
            <div className="navbar__auth">
              <Link to="/login" className="btn btn--ghost btn--sm">Entrar</Link>
              <Link to="/registro" className="btn btn--primary btn--sm">Crear cuenta</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
