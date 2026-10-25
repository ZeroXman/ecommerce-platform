import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
  clearCart,
  removeFromCart,
  selectCartItems,
  selectCartSubtotal,
  updateQuantity,
} from '../features/cart/cartSlice.js';
import { EmptyState } from '../components/Feedback.jsx';
import { formatCurrency } from '../utils/format.js';

const FREE_SHIPPING_THRESHOLD = 100;
const SHIPPING_COST = 9.99;
const TAX_RATE = 0.18;

export default function CartPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartSubtotal);

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_COST;
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = Math.round((subtotal + shipping + tax) * 100) / 100;

  if (items.length === 0) {
    return (
      <div className="page container">
        <EmptyState
          title="Tu carrito está vacío"
          description="Añade productos del catálogo para continuar con la compra."
          action={<Link to="/productos" className="btn btn--primary">Ir al catálogo</Link>}
        />
      </div>
    );
  }

  return (
    <div className="page container">
      <header className="page-head page-head--row">
        <div>
          <h1>Carrito</h1>
          <p>{items.length} producto(s) en tu carrito</p>
        </div>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => dispatch(clearCart())}>
          Vaciar carrito
        </button>
      </header>

      <div className="cart-layout">
        <ul className="cart-list">
          {items.map(({ product, quantity }) => (
            <li key={product._id} className="cart-item">
              <img src={product.images?.[0]} alt={product.name} />
              <div className="cart-item__info">
                <Link to={`/producto/${product.slug}`} className="cart-item__title">{product.name}</Link>
                <span className="muted">{product.brand}</span>
                <span className="cart-item__price">{formatCurrency(product.price)}</span>
              </div>

              <div className="cart-item__qty">
                <button
                  type="button"
                  onClick={() => dispatch(updateQuantity({ productId: product._id, quantity: quantity - 1 }))}
                  aria-label="Reducir cantidad"
                >
                  −
                </button>
                <span>{quantity}</span>
                <button
                  type="button"
                  onClick={() => dispatch(updateQuantity({ productId: product._id, quantity: quantity + 1 }))}
                  aria-label="Aumentar cantidad"
                >
                  +
                </button>
              </div>

              <div className="cart-item__total">{formatCurrency(product.price * quantity)}</div>

              <button
                type="button"
                className="cart-item__remove"
                onClick={() => dispatch(removeFromCart(product._id))}
                aria-label={`Quitar ${product.name}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>

        <aside className="summary card">
          <h2>Resumen</h2>
          <dl className="summary__list">
            <div><dt>Subtotal</dt><dd>{formatCurrency(subtotal)}</dd></div>
            <div>
              <dt>Envío</dt>
              <dd>{shipping === 0 ? 'Gratis' : formatCurrency(shipping)}</dd>
            </div>
            <div><dt>IGV (18%)</dt><dd>{formatCurrency(tax)}</dd></div>
            <div className="summary__total"><dt>Total</dt><dd>{formatCurrency(total)}</dd></div>
          </dl>

          {subtotal < FREE_SHIPPING_THRESHOLD && (
            <p className="muted small">
              Añade {formatCurrency(FREE_SHIPPING_THRESHOLD - subtotal)} más para envío gratis.
            </p>
          )}

          <button type="button" className="btn btn--primary btn--block" onClick={() => navigate('/checkout')}>
            Finalizar compra
          </button>
          <Link to="/productos" className="link link--center">Seguir comprando</Link>
        </aside>
      </div>
    </div>
  );
}
