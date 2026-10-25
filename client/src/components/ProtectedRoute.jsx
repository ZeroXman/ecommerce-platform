import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { selectUser } from '../features/auth/authSlice.js';
import { PageLoader } from './Feedback.jsx';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const user = useSelector(selectUser);
  const initialized = useSelector((state) => state.auth.initialized);
  const location = useLocation();

  if (!initialized) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}
