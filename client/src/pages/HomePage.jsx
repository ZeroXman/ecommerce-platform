import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchFeatured, fetchCategories } from '../features/products/productsSlice.js';
import ProductCard from '../components/ProductCard.jsx';
import { Spinner } from '../components/Feedback.jsx';

export default function HomePage() {
  const dispatch = useDispatch();
  const featured = useSelector((state) => state.products.featured);
  const categories = useSelector((state) => state.products.categories);

  useEffect(() => {
    dispatch(fetchFeatured());
    dispatch(fetchCategories());
  }, [dispatch]);

  return (
    <div className="page">
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__content">
            <span className="hero__tag">Envío gratis desde $100</span>
            <h1>Tecnología y estilo para tu día a día</h1>
            <p>
              Catálogo completo de electrónica, ropa, hogar y deportes con pago seguro,
              seguimiento de pedidos y gestión de usuarios en tiempo real.
            </p>
            <div className="hero__actions">
              <Link to="/productos" className="btn btn--primary">Ver catálogo</Link>
              <Link to="/productos?sort=popular" className="btn btn--ghost">Más vendidos</Link>
            </div>
          </div>
          <div className="hero__art" aria-hidden="true">
            <img src="https://picsum.photos/seed/novashop-hero/720/720" alt="" />
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="section__head">
          <h2>Categorías</h2>
          <Link to="/productos" className="link">Ver todo</Link>
        </div>
        <div className="category-grid">
          {categories.map((category) => (
            <Link key={category._id} to={`/productos?category=${category.slug}`} className="category-card">
              <strong>{category.name}</strong>
              <span>{category.productCount} productos</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="section__head">
          <h2>Destacados</h2>
          <Link to="/productos" className="link">Explorar más</Link>
        </div>

        {featured.length === 0 ? (
          <Spinner label="Cargando destacados..." />
        ) : (
          <div className="product-grid">
            {featured.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      <section className="container section">
        <div className="features">
          <div className="feature">
            <h3>Pago seguro</h3>
            <p>Integración con Stripe Payment Intents y modo demo para pruebas.</p>
          </div>
          <div className="feature">
            <h3>Autenticación JWT</h3>
            <p>Access token de corta duración y refresh token en cookie httpOnly.</p>
          </div>
          <div className="feature">
            <h3>Panel de administración</h3>
            <p>Gestión de productos, pedidos, usuarios y métricas de ventas.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
