import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { clearError, registerUser } from '../features/auth/authSlice.js';
import { pushToast } from '../features/ui/uiSlice.js';

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, user } = useSelector((state) => state.auth);

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError('');

    if (form.password !== form.confirm) {
      setLocalError('Las contraseñas no coinciden.');
      return;
    }

    if (form.password.length < 6) {
      setLocalError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    const action = await dispatch(registerUser({ name: form.name, email: form.email, password: form.password }));

    if (registerUser.fulfilled.match(action)) {
      dispatch(pushToast({ message: '¡Cuenta creada con éxito!', type: 'success' }));
    }
  };

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <h1>Crear cuenta</h1>
        <p className="muted">Regístrate en segundos y empieza a comprar.</p>

        <label className="field">
          <span>Nombre</span>
          <input
            type="text"
            required
            minLength={2}
            autoComplete="name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
        </label>

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
            minLength={6}
            autoComplete="new-password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
          />
        </label>

        <label className="field">
          <span>Repetir contraseña</span>
          <input
            type="password"
            required
            autoComplete="new-password"
            value={form.confirm}
            onChange={(event) => setForm({ ...form, confirm: event.target.value })}
          />
        </label>

        {(error || localError) && <p className="alert alert--error">{localError || error}</p>}

        <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={status === 'loading'}>
          {status === 'loading' ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>

        <p className="auth-card__footer">
          ¿Ya tienes cuenta? <Link to="/login" className="link">Inicia sesión</Link>
        </p>
      </form>
    </div>
  );
}
