import { createSlice } from '@reduxjs/toolkit';

const STORAGE_KEY = 'novashop_cart';

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function persist(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    // Almacenamiento no disponible.
  }
}

const initialState = {
  items: loadCart(),
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart(state, action) {
      const { product, quantity = 1 } = action.payload;
      const existing = state.items.find((item) => item.product._id === product._id);

      if (existing) {
        existing.quantity = Math.min(existing.quantity + quantity, Math.max(product.stock || 99, 1));
      } else {
        state.items.push({ product, quantity: Math.min(quantity, Math.max(product.stock || 99, 1)) });
      }

      persist(state.items);
    },
    updateQuantity(state, action) {
      const { productId, quantity } = action.payload;
      const item = state.items.find((entry) => entry.product._id === productId);

      if (item) {
        item.quantity = Math.max(1, Math.min(quantity, item.product.stock || 99));
      }

      persist(state.items);
    },
    removeFromCart(state, action) {
      state.items = state.items.filter((item) => item.product._id !== action.payload);
      persist(state.items);
    },
    clearCart(state) {
      state.items = [];
      persist(state.items);
    },
  },
});

export const { addToCart, updateQuantity, removeFromCart, clearCart } = cartSlice.actions;

export const selectCartItems = (state) => state.cart.items;
export const selectCartCount = (state) => state.cart.items.reduce((total, item) => total + item.quantity, 0);
export const selectCartSubtotal = (state) =>
  state.cart.items.reduce((total, item) => total + item.product.price * item.quantity, 0);
export const selectCartPayload = (state) =>
  state.cart.items.map((item) => ({ product: item.product._id, quantity: item.quantity }));

export default cartSlice.reducer;
