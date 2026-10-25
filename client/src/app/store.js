import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice.js';
import cartReducer from '../features/cart/cartSlice.js';
import productsReducer from '../features/products/productsSlice.js';
import ordersReducer from '../features/orders/ordersSlice.js';
import uiReducer from '../features/ui/uiSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    products: productsReducer,
    orders: ordersReducer,
    ui: uiReducer,
  },
  devTools: import.meta.env.DEV,
});

export default store;
