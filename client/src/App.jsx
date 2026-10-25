import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Outlet, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Toaster from './components/Toaster.jsx';
import { getAccessToken } from './api/client.js';
import { loadSession, sessionCleared } from './features/auth/authSlice.js';
import { pushToast } from './features/ui/uiSlice.js';
import HomePage from './pages/HomePage.jsx';
import CatalogPage from './pages/CatalogPage.jsx';
import ProductPage from './pages/ProductPage.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import MyOrdersPage from './pages/MyOrdersPage.jsx';
import OrderDetailPage from './pages/OrderDetailPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx';
import AdminProductsPage from './pages/admin/AdminProductsPage.jsx';
import AdminOrdersPage from './pages/admin/AdminOrdersPage.jsx';
import AdminUsersPage from './pages/admin/AdminUsersPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

function Layout() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    if (getAccessToken()) {
      dispatch(loadSession());
    } else {
      dispatch(sessionCleared());
    }

    const onExpired = () => {
      dispatch(sessionCleared());
      dispatch(pushToast({ message: 'Tu sesión expiró, vuelve a iniciar sesión.', type: 'error' }));
    };

    window.addEventListener('auth:expired', onExpired);

    return () => window.removeEventListener('auth:expired', onExpired);
  }, [dispatch]);

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="productos" element={<CatalogPage />} />
          <Route path="producto/:slug" element={<ProductPage />} />
          <Route path="carrito" element={<CartPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="registro" element={<RegisterPage />} />

          <Route path="checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="pedidos" element={<ProtectedRoute><MyOrdersPage /></ProtectedRoute>} />
          <Route path="pedidos/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
          <Route path="perfil" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          <Route
            path="admin"
            element={(
              <ProtectedRoute adminOnly>
                <AdminLayout />
              </ProtectedRoute>
            )}
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="productos" element={<AdminProductsPage />} />
            <Route path="pedidos" element={<AdminOrdersPage />} />
            <Route path="usuarios" element={<AdminUsersPage />} />
          </Route>

          <Route
            path="*"
            element={(
              <NotFoundPage />
            )}
          />
        </Route>
      </Routes>
      <Toaster />
    </>
  );
}
