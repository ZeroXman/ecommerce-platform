import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api, { errorMessage } from '../../api/client.js';
import { Spinner, EmptyState } from '../../components/Feedback.jsx';
import { pushToast } from '../../features/ui/uiSlice.js';
import { formatDateShort } from '../../utils/format.js';

export default function AdminUsersPage() {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const { data } = await api.get(`/admin/users?search=${encodeURIComponent(search)}`);
      setUsers(data.users);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const run = async (action, message) => {
    try {
      await action();
      dispatch(pushToast({ message, type: 'success' }));
      load();
    } catch (err) {
      dispatch(pushToast({ message: errorMessage(err), type: 'error' }));
    }
  };

  if (loading && users.length === 0) return <Spinner label="Cargando usuarios..." />;
  if (error) return <EmptyState title="Error al cargar usuarios" description={error} />;

  return (
    <div className="admin-page">
      <div className="admin-toolbar">
        <input
          type="search"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Registro</th>
              <th>Último acceso</th>
              <th>Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isSelf = user._id === currentUser?._id;

              return (
                <tr key={user._id}>
                  <td>
                    <div className="table-user">
                      <span className="user-chip__avatar">{user.name.charAt(0).toUpperCase()}</span>
                      <div>
                        <strong>{user.name}</strong>
                        <br />
                        <span className="muted">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${user.role === 'admin' ? 'badge--info' : 'badge--neutral'}`}>
                      {user.role === 'admin' ? 'Administrador' : 'Cliente'}
                    </span>
                  </td>
                  <td>{formatDateShort(user.createdAt)}</td>
                  <td>{user.lastLoginAt ? formatDateShort(user.lastLoginAt) : '—'}</td>
                  <td>
                    <span className={`badge ${user.isActive ? 'badge--success' : 'badge--danger'}`}>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="row-actions">
                    <button
                      type="button"
                      className="icon-btn"
                      disabled={isSelf}
                      onClick={() =>
                        run(
                          () => api.put(`/admin/users/${user._id}/role`, { role: user.role === 'admin' ? 'user' : 'admin' }),
                          'Rol actualizado.'
                        )
                      }
                    >
                      {user.role === 'admin' ? 'Quitar admin' : 'Hacer admin'}
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      disabled={isSelf}
                      onClick={() =>
                        run(() => api.put(`/admin/users/${user._id}/toggle`), 'Estado actualizado.')
                      }
                    >
                      {user.isActive ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      type="button"
                      className="icon-btn icon-btn--danger"
                      disabled={isSelf}
                      onClick={() => {
                        if (window.confirm(`¿Eliminar a ${user.name}?`)) {
                          run(() => api.delete(`/admin/users/${user._id}`), 'Usuario eliminado.');
                        }
                      }}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {users.length === 0 && <EmptyState title="Sin resultados" description="Ningún usuario coincide con la búsqueda." />}
    </div>
  );
}
