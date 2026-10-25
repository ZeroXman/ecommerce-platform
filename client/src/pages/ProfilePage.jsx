import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile } from '../features/auth/authSlice.js';
import { pushToast } from '../features/ui/uiSlice.js';
import api, { errorMessage } from '../api/client.js';

const EMPTY_ADDRESS = {
  label: 'Casa',
  fullName: '',
  phone: '',
  address: '',
  city: '',
  postalCode: '',
  country: 'Perú',
  isDefault: false,
};

export default function ProfilePage() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [address, setAddress] = useState({ ...EMPTY_ADDRESS, fullName: user?.name || '' });

  useEffect(() => {
    if (user) {
      setName(user.name);
      setAddress((prev) => ({ ...prev, fullName: prev.fullName || user.name }));
    }
  }, [user]);

  const saveName = async (event) => {
    event.preventDefault();
    setSaving(true);

    const action = await dispatch(updateProfile({ name }));

    setSaving(false);

    if (updateProfile.fulfilled.match(action)) {
      dispatch(pushToast({ message: 'Perfil actualizado.', type: 'success' }));
    }
  };

  const addAddress = async (event) => {
    event.preventDefault();

    const action = await dispatch(updateProfile({ addresses: [...(user.addresses || []), address] }));

    if (updateProfile.fulfilled.match(action)) {
      dispatch(pushToast({ message: 'Dirección guardada.', type: 'success' }));
      setAddress({ ...EMPTY_ADDRESS, fullName: user.name });
    } else {
      dispatch(pushToast({ message: action.payload || 'No se pudo guardar la dirección.', type: 'error' }));
    }
  };

  const removeAddress = async (addressId) => {
    const remaining = (user.addresses || []).filter((entry) => entry._id !== addressId);
    const action = await dispatch(updateProfile({ addresses: remaining }));

    if (updateProfile.fulfilled.match(action)) {
      dispatch(pushToast({ message: 'Dirección eliminada.', type: 'info' }));
    } else {
      dispatch(pushToast({ message: action.payload || 'No se pudo eliminar la dirección.', type: 'error' }));
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();

    try {
      await api.put('/auth/password', passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '' });
      dispatch(pushToast({ message: 'Contraseña actualizada.', type: 'success' }));
    } catch (error) {
      dispatch(pushToast({ message: errorMessage(error), type: 'error' }));
    }
  };

  return (
    <div className="page container">
      <header className="page-head">
        <h1>Mi perfil</h1>
        <p>{user?.email} · Rol: {user?.role === 'admin' ? 'Administrador' : 'Cliente'}</p>
      </header>

      <div className="grid-2">
        <section className="panel">
          <h2>Datos personales</h2>
          <form className="form" onSubmit={saveName}>
            <label className="field">
              <span>Nombre</span>
              <input value={name} required minLength={2} onChange={(event) => setName(event.target.value)} />
            </label>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>

          <h2 className="mt">Cambiar contraseña</h2>
          <form className="form" onSubmit={changePassword}>
            <label className="field">
              <span>Contraseña actual</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={passwordForm.currentPassword}
                onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })}
              />
            </label>
            <label className="field">
              <span>Nueva contraseña</span>
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={passwordForm.newPassword}
                onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })}
              />
            </label>
            <button type="submit" className="btn btn--ghost">Actualizar contraseña</button>
          </form>
        </section>

        <section className="panel">
          <h2>Direcciones guardadas</h2>

          {(user?.addresses || []).length === 0 && <p className="muted">Aún no tienes direcciones guardadas.</p>}

          <ul className="address-list">
            {(user?.addresses || []).map((entry) => (
              <li key={entry._id} className="address-item">
                <div>
                  <strong>{entry.label}</strong> {entry.isDefault && <span className="badge badge--info">Principal</span>}
                  <p>{entry.fullName} · {entry.address}, {entry.city} {entry.postalCode}, {entry.country}</p>
                  {entry.phone && <p className="muted">{entry.phone}</p>}
                </div>
                <button type="button" className="icon-btn" onClick={() => removeAddress(entry._id)}>Eliminar</button>
              </li>
            ))}
          </ul>

          <h3 className="mt">Nueva dirección</h3>
          <form className="form form-grid" onSubmit={addAddress}>
            <label className="field">
              <span>Etiqueta</span>
              <input value={address.label} onChange={(e) => setAddress({ ...address, label: e.target.value })} />
            </label>
            <label className="field">
              <span>Nombre completo</span>
              <input required value={address.fullName} onChange={(e) => setAddress({ ...address, fullName: e.target.value })} />
            </label>
            <label className="field">
              <span>Teléfono</span>
              <input value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} />
            </label>
            <label className="field">
              <span>Dirección</span>
              <input required value={address.address} onChange={(e) => setAddress({ ...address, address: e.target.value })} />
            </label>
            <label className="field">
              <span>Ciudad</span>
              <input required value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
            </label>
            <label className="field">
              <span>Código postal</span>
              <input required value={address.postalCode} onChange={(e) => setAddress({ ...address, postalCode: e.target.value })} />
            </label>
            <label className="field">
              <span>País</span>
              <input required value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} />
            </label>
            <div className="field field--full">
              <button type="submit" className="btn btn--primary">Guardar dirección</button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
