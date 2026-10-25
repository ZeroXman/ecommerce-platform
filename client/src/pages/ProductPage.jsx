import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { fetchProductBySlug, clearProduct, createReview } from '../features/products/productsSlice.js';
import { addToCart } from '../features/cart/cartSlice.js';
import { pushToast } from '../features/ui/uiSlice.js';
import ProductCard from '../components/ProductCard.jsx';
import { PageLoader, EmptyState, Stars } from '../components/Feedback.jsx';
import { formatCurrency, formatDateShort } from '../utils/format.js';

export default function ProductPage() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const { product, reviews, related, detailStatus, error } = useSelector((state) => state.products);
  const user = useSelector((state) => state.auth.user);

  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    dispatch(fetchProductBySlug(slug));
    setActiveImage(0);
    setQuantity(1);

    return () => dispatch(clearProduct());
  }, [dispatch, slug]);

  if (detailStatus === 'loading' && !product) {
    return <PageLoader />;
  }

  if (detailStatus === 'failed') {
    return (
      <div className="page container">
        <EmptyState
          title="Producto no encontrado"
          description={error}
          action={<Link to="/productos" className="btn btn--primary">Volver al catálogo</Link>}
        />
      </div>
    );
  }

  if (!product) return null;

  const handleAddToCart = () => {
    dispatch(addToCart({ product, quantity }));
    dispatch(pushToast({ message: `${quantity} × "${product.name}" en el carrito.`, type: 'success' }));
  };

  const handleReview = async (event) => {
    event.preventDefault();

    const action = await dispatch(
      createReview({ productId: product._id, rating: Number(reviewForm.rating), comment: reviewForm.comment })
    );

    if (createReview.fulfilled.match(action)) {
      dispatch(pushToast({ message: '¡Gracias por tu reseña!', type: 'success' }));
      setReviewForm({ rating: 5, comment: '' });
      dispatch(fetchProductBySlug(slug));
    } else {
      dispatch(pushToast({ message: action.payload || 'No se pudo publicar la reseña.', type: 'error' }));
    }
  };

  const discount = product.compareAtPrice > product.price
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  return (
    <div className="page container">
      <nav className="breadcrumbs">
        <Link to="/">Inicio</Link>
        <span>/</span>
        <Link to="/productos">Productos</Link>
        {product.category && (
          <>
            <span>/</span>
            <Link to={`/productos?category=${product.category.slug}`}>{product.category.name}</Link>
          </>
        )}
      </nav>

      <div className="product-detail">
        <div className="product-detail__gallery">
          <img
            className="product-detail__main"
            src={product.images?.[activeImage] || 'https://picsum.photos/seed/placeholder/800/800'}
            alt={product.name}
          />
          {product.images?.length > 1 && (
            <div className="product-detail__thumbs">
              {product.images.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  className={index === activeImage ? 'is-active' : ''}
                  onClick={() => setActiveImage(index)}
                >
                  <img src={image} alt={`${product.name} ${index + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-detail__info">
          <span className="product-detail__brand">{product.brand}</span>
          <h1>{product.name}</h1>

          <div className="product-detail__meta">
            <Stars rating={product.rating} count={product.numReviews} />
            <span className={product.stock > 0 ? 'badge badge--success' : 'badge badge--danger'}>
              {product.stock > 0 ? `${product.stock} en stock` : 'Agotado'}
            </span>
          </div>

          <div className="product-detail__price">
            <span className="price__now price__now--lg">{formatCurrency(product.price)}</span>
            {discount > 0 && (
              <>
                <span className="price__old">{formatCurrency(product.compareAtPrice)}</span>
                <span className="badge badge--danger">-{discount}%</span>
              </>
            )}
          </div>

          <p className="product-detail__short">{product.shortDescription}</p>

          <div className="product-detail__buy">
            <label className="qty">
              <span>Cantidad</span>
              <input
                type="number"
                min="1"
                max={Math.max(product.stock, 1)}
                value={quantity}
                onChange={(event) => setQuantity(Math.max(1, Math.min(Number(event.target.value) || 1, product.stock || 1)))}
              />
            </label>
            <button
              type="button"
              className="btn btn--primary btn--lg"
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
            >
              Añadir al carrito
            </button>
          </div>

          <dl className="product-detail__specs">
            <div><dt>Marca</dt><dd>{product.brand}</dd></div>
            <div><dt>SKU</dt><dd>{product.sku || '—'}</dd></div>
            <div><dt>Categoría</dt><dd>{product.category?.name || '—'}</dd></div>
            <div><dt>Vendidos</dt><dd>{product.sold}</dd></div>
          </dl>
        </div>
      </div>

      <section className="panel">
        <h2>Descripción</h2>
        <p className="product-description">{product.description}</p>

        {product.tags?.length > 0 && (
          <div className="tags">
            {product.tags.map((tag) => (
              <Link key={tag} to={`/productos?search=${tag}`} className="tag">#{tag}</Link>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Reseñas ({product.numReviews})</h2>

        {reviews.length === 0 ? (
          <p className="muted">Todavía no hay reseñas. Sé el primero en opinar.</p>
        ) : (
          <ul className="reviews">
            {reviews.map((review) => (
              <li key={review._id} className="review">
                <div className="review__head">
                  <strong>{review.name}</strong>
                  <Stars rating={review.rating} />
                  <span className="muted">{formatDateShort(review.createdAt)}</span>
                </div>
                <p>{review.comment}</p>
              </li>
            ))}
          </ul>
        )}

        {user ? (
          <form className="review-form" onSubmit={handleReview}>
            <h3>Escribe tu reseña</h3>
            <label className="field">
              <span>Puntuación</span>
              <select
                value={reviewForm.rating}
                onChange={(event) => setReviewForm({ ...reviewForm, rating: event.target.value })}
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>{value} estrella{value > 1 ? 's' : ''}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Comentario</span>
              <textarea
                rows="3"
                required
                minLength={3}
                maxLength={1000}
                value={reviewForm.comment}
                onChange={(event) => setReviewForm({ ...reviewForm, comment: event.target.value })}
                placeholder="¿Qué te pareció el producto?"
              />
            </label>
            <button type="submit" className="btn btn--primary">Publicar reseña</button>
          </form>
        ) : (
          <p className="muted">
            <Link to="/login" className="link">Inicia sesión</Link> para escribir una reseña.
          </p>
        )}
      </section>

      {related.length > 0 && (
        <section className="section">
          <div className="section__head">
            <h2>También te puede interesar</h2>
          </div>
          <div className="product-grid">
            {related.map((item) => (
              <ProductCard key={item._id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
