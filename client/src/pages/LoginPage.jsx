import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clearError, loginUser } from '../features/auth/authSlice.js';
import { pushToast } from '../features/ui/uiSlice.js';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { status, error, user } = useSelector((state) => state.auth);

  const [form, setForm] = useState({ email: '', password: '' });
  const redirectTo = location.state?.from || '/';

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (user) navigate(redirectTo, { replace: true });
  }, [user, navigate, redirectTo]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const action = await dispatch(loginUser(form));

    if (loginUser.fulfilled.match(action)) {
      dispatch(pushToast({ message: `¡Bienvenido, ${action.payload.user.name}!`, type: 'success' }));
    }
  };

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <h1>Iniciar sesión</h1>
        <p className="muted">Accede para ver tus pedidos y completar compras.</p>

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
        </label>

        <label className="field">
          <span>Contraseña</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
          />
        </label>

        {error && <p className="alert alert--error">{error}</p>}

        <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={status === 'loading'}>
          {status === 'loading' ? 'Entrando...' : 'Entrar'}
        </button>

        <p className="auth-card__footer">
          ¿No tienes cuenta? <Link to="/registro" className="link">Créala aquí</Link>
        </p>

        <div className="demo-credentials">
          <strong>Credenciales de prueba</strong>
          <span>Admin: admin@shop.com / Admin123!</span>
          <span>Cliente: demo@shop.com / Demo123!</span>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => setForm({ email: 'demo@shop.com', password: 'Demo123!' })}
          >
            Rellenar cliente demo
          </button>
        </div>
      </form>
    </div>
  );
}
