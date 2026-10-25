import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import {
  createOrder,
  createPaymentIntent,
  confirmOrderPayment,
  clearCurrentOrder,
} from '../features/orders/ordersSlice.js';
import { selectCartItems, selectCartPayload, selectCartSubtotal, clearCart } from '../features/cart/cartSlice.js';
import { pushToast } from '../features/ui/uiSlice.js';
import api from '../api/client.js';
import { formatCurrency } from '../utils/format.js';
import { Spinner } from '../components/Feedback.jsx';

const FREE_SHIPPING_THRESHOLD = 100;
const SHIPPING_COST = 9.99;
const TAX_RATE = 0.18;

function StripeCheckoutForm({ orderId, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const dispatch = useDispatch();
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);
    setMessage('');

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (error) {
      setMessage(error.message || 'No se pudo procesar el pago.');
      setProcessing(false);
      return;
    }

    const action = await dispatch(
      confirmOrderPayment({ orderId, paymentIntentId: paymentIntent?.id })
    );

    setProcessing(false);

    if (confirmOrderPayment.fulfilled.match(action)) {
      onSuccess(action.payload);
    } else {
      setMessage(action.payload || 'El pago se realizó pero no se pudo registrar el pedido.');
    }
  };

  return (
    <form className="stripe-form" onSubmit={handleSubmit}>
      <PaymentElement />
      {message && <p className="alert alert--error">{message}</p>}
      <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={!stripe || processing}>
        {processing ? 'Procesando...' : 'Pagar ahora'}
      </button>
    </form>
  );
}

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const items = useSelector(selectCartItems);
  const payload = useSelector(selectCartPayload);
  const subtotal = useSelector(selectCartSubtotal);
  const { current, payment, checkoutStatus, error } = useSelector((state) => state.orders);

  const [paymentConfig, setPaymentConfig] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);
  const [step, setStep] = useState('shipping');
  const [processing, setProcessing] = useState(false);
  const [form, setForm] = useState({
    fullName: user?.name || '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Perú',
    notes: '',
  });

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_COST;
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = Math.round((subtotal + shipping + tax) * 100) / 100;

  useEffect(() => {
    dispatch(clearCurrentOrder());

    api.get('/payments/config')
      .then(({ data }) => {
        setPaymentConfig(data);

        if (!data.demoMode && data.publishableKey) {
          setStripePromise(loadStripe(data.publishableKey));
        }
      })
      .catch(() => setPaymentConfig({ demoMode: true }));
  }, [dispatch]);

  useEffect(() => {
    if (items.length === 0 && !current) {
      navigate('/carrito');
    }
  }, [items.length, current, navigate]);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const startPayment = async (event) => {
    event.preventDefault();
    setProcessing(true);

    const orderAction = await dispatch(
      createOrder({
        items: payload,
        shippingAddress: {
          fullName: form.fullName,
          phone: form.phone,
          address: form.address,
          city: form.city,
          postalCode: form.postalCode,
          country: form.country,
        },
        notes: form.notes,
      })
    );

    if (!createOrder.fulfilled.match(orderAction)) {
      dispatch(pushToast({ message: orderAction.payload || 'No se pudo crear el pedido.', type: 'error' }));
      setProcessing(false);
      return;
    }

    const orderId = orderAction.payload._id;
    const intentAction = await dispatch(createPaymentIntent(orderId));

    if (!createPaymentIntent.fulfilled.match(intentAction)) {
      dispatch(pushToast({ message: intentAction.payload || 'No se pudo iniciar el pago.', type: 'error' }));
      setProcessing(false);
      return;
    }

    setStep('payment');
    setProcessing(false);
  };

  const payDemo = async () => {
    setProcessing(true);

    const paymentId = payment.clientSecret.split('_secret')[0];
    const action = await dispatch(confirmOrderPayment({ orderId: current._id, paymentIntentId: paymentId }));

    setProcessing(false);

    if (confirmOrderPayment.fulfilled.match(action)) {
      dispatch(clearCart());
      dispatch(pushToast({ message: '¡Pago simulado confirmado! Pedido pagado.', type: 'success' }));
      navigate(`/pedidos/${current._id}`);
    } else {
      dispatch(pushToast({ message: action.payload || 'No se pudo confirmar el pago.', type: 'error' }));
    }
  };

  const handleSuccess = (order) => {
    dispatch(clearCart());
    dispatch(pushToast({ message: '¡Pago confirmado! Gracias por tu compra.', type: 'success' }));
    navigate(`/pedidos/${order._id}`);
  };

  if (items.length === 0 && !current) return null;

  return (
    <div className="page container">
      <header className="page-head">
        <h1>Finalizar compra</h1>
        <p>{step === 'shipping' ? 'Paso 1: dirección de envío' : 'Paso 2: método de pago'}</p>
      </header>

      <div className="checkout-layout">
        <div className="checkout-main">
          {step === 'shipping' && (
            <form className="card form" onSubmit={startPayment}>
              <h2>Datos de envío</h2>

              <div className="form-grid">
                <label className="field">
                  <span>Nombre completo *</span>
                  <input name="fullName" required value={form.fullName} onChange={handleChange} />
                </label>
                <label className="field">
                  <span>Teléfono</span>
                  <input name="phone" value={form.phone} onChange={handleChange} />
                </label>
                <label className="field field--full">
                  <span>Dirección *</span>
                  <input name="address" required value={form.address} onChange={handleChange} placeholder="Av. Ejemplo 123, Dpto 401" />
                </label>
                <label className="field">
                  <span>Ciudad *</span>
                  <input name="city" required value={form.city} onChange={handleChange} />
                </label>
                <label className="field">
                  <span>Código postal *</span>
                  <input name="postalCode" required value={form.postalCode} onChange={handleChange} />
                </label>
                <label className="field field--full">
                  <span>País *</span>
                  <input name="country" required value={form.country} onChange={handleChange} />
                </label>
                <label className="field field--full">
                  <span>Notas del pedido</span>
                  <textarea name="notes" rows="2" value={form.notes} onChange={handleChange} />
                </label>
              </div>

              {error && <p className="alert alert--error">{error}</p>}

              <button type="submit" className="btn btn--primary btn--lg" disabled={processing}>
                {processing ? 'Creando pedido...' : 'Continuar al pago'}
              </button>
            </form>
          )}

          {step === 'payment' && (
            <div className="card">
              <h2>Método de pago</h2>
              <p className="muted">
                Pedido <strong>{current?.orderNumber}</strong> · Total <strong>{formatCurrency(current?.totalPrice || total)}</strong>
              </p>

              {!payment && <Spinner label="Preparando pago..." />}

              {payment?.demo && (
                <div className="demo-payment">
                  <div className="alert alert--info">
                    Modo demo activo: no se realizará ningún cargo real. El pedido se marcará como pagado.
                  </div>
                  <button type="button" className="btn btn--primary btn--lg btn--block" onClick={payDemo} disabled={processing}>
                    {processing ? 'Confirmando...' : `Pagar ${formatCurrency(payment.amount)} (simulado)`}
                  </button>
                </div>
              )}

              {payment && !payment.demo && stripePromise && (
                <Elements stripe={stripePromise} options={{ clientSecret: payment.clientSecret }}>
                  <StripeCheckoutForm orderId={current._id} onSuccess={handleSuccess} />
                </Elements>
              )}

              {payment && !payment.demo && !stripePromise && (
                <p className="alert alert--error">
                  Stripe no está configurado correctamente (falta la clave publicable).
                </p>
              )}

              {checkoutStatus === 'failed' && error && <p className="alert alert--error">{error}</p>}
            </div>
          )}
        </div>

        <aside className="summary card">
          <h2>Tu pedido</h2>
          <ul className="checkout-items">
            {items.map(({ product, quantity }) => (
              <li key={product._id}>
                <span>{quantity} × {product.name}</span>
                <span>{formatCurrency(product.price * quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="summary__list">
            <div><dt>Subtotal</dt><dd>{formatCurrency(subtotal)}</dd></div>
            <div><dt>Envío</dt><dd>{shipping === 0 ? 'Gratis' : formatCurrency(shipping)}</dd></div>
            <div><dt>IGV (18%)</dt><dd>{formatCurrency(tax)}</dd></div>
            <div className="summary__total"><dt>Total</dt><dd>{formatCurrency(total)}</dd></div>
          </dl>
          {step === 'payment' && (
            <button type="button" className="btn btn--ghost btn--block btn--sm" onClick={() => setStep('shipping')}>
              Volver a la dirección
            </button>
          )}
          <Link to="/carrito" className="link link--center">Editar carrito</Link>
        </aside>
      </div>
    </div>
  );
}
