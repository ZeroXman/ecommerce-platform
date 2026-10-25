import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToCart } from '../features/cart/cartSlice.js';
import { pushToast } from '../features/ui/uiSlice.js';
import { Stars } from './Feedback.jsx';
import { formatCurrency } from '../utils/format.js';

export default function ProductCard({ product }) {
  const dispatch = useDispatch();

  const handleAdd = () => {
    if (product.stock <= 0) return;

    dispatch(addToCart({ product, quantity: 1 }));
    dispatch(pushToast({ message: `"${product.name}" añadido al carrito.`, type: 'success' }));
  };

  const discount = product.compareAtPrice > product.price
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  return (
    <article className="product-card">
      <Link to={`/producto/${product.slug}`} className="product-card__media">
        <img src={product.images?.[0] || 'https://picsum.photos/seed/placeholder/600/600'} alt={product.name} loading="lazy" />
        {discount > 0 && <span className="product-card__discount">-{discount}%</span>}
        {product.stock <= 0 && <span className="product-card__out">Agotado</span>}
      </Link>

      <div className="product-card__body">
        <span className="product-card__brand">{product.brand}</span>
        <Link to={`/producto/${product.slug}`} className="product-card__title">
          {product.name}
        </Link>

        <Stars rating={product.rating} count={product.numReviews} />

        <div className="product-card__footer">
          <div className="price">
            <span className="price__now">{formatCurrency(product.price)}</span>
            {discount > 0 && <span className="price__old">{formatCurrency(product.compareAtPrice)}</span>}
          </div>
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={handleAdd}
            disabled={product.stock <= 0}
          >
            {product.stock > 0 ? 'Añadir' : 'Sin stock'}
          </button>
        </div>
      </div>
    </article>
  );
}
