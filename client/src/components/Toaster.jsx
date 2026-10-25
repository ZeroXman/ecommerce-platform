import { useDispatch, useSelector } from 'react-redux';
import { dismissToast, selectToasts } from '../features/ui/uiSlice.js';

const ICONS = { success: '✓', error: '✕', info: 'i' };

function Toast({ toast, onClose }) {
  return (
    <div className={`toast toast--${toast.type}`} role="status">
      <span className="toast__icon">{ICONS[toast.type] || 'i'}</span>
      <span className="toast__message">{toast.message}</span>
      <button type="button" className="toast__close" onClick={onClose} aria-label="Cerrar">
        ×
      </button>
    </div>
  );
}

export default function Toaster() {
  const toasts = useSelector(selectToasts);
  const dispatch = useDispatch();

  if (toasts.length === 0) return null;

  return (
    <div className="toaster">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={() => dispatch(dismissToast(toast.id))} />
      ))}
    </div>
  );
}
