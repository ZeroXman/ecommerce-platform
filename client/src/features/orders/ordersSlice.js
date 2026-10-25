import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { errorMessage } from '../../api/client.js';

export const createOrder = createAsyncThunk('orders/createOrder', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/orders', payload);
    return data.order;
  } catch (error) {
    return rejectWithValue(errorMessage(error));
  }
});

export const fetchMyOrders = createAsyncThunk('orders/fetchMyOrders', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/orders/mine');
    return data.orders;
  } catch (error) {
    return rejectWithValue(errorMessage(error));
  }
});

export const fetchOrderById = createAsyncThunk('orders/fetchOrderById', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/orders/${id}`);
    return data.order;
  } catch (error) {
    return rejectWithValue(errorMessage(error));
  }
});

export const createPaymentIntent = createAsyncThunk('orders/createPaymentIntent', async (orderId, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/payments/create-intent', { orderId });
    return data;
  } catch (error) {
    return rejectWithValue(errorMessage(error));
  }
});

export const confirmOrderPayment = createAsyncThunk('orders/confirmPayment', async ({ orderId, paymentIntentId }, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/orders/${orderId}/pay`, { paymentIntentId });
    return data.order;
  } catch (error) {
    return rejectWithValue(errorMessage(error));
  }
});

export const cancelOrder = createAsyncThunk('orders/cancelOrder', async (orderId, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/orders/${orderId}/cancel`);
    return data.order;
  } catch (error) {
    return rejectWithValue(errorMessage(error));
  }
});

const initialState = {
  list: [],
  current: null,
  payment: null,
  status: 'idle',
  checkoutStatus: 'idle',
  error: null,
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearCurrentOrder(state) {
      state.current = null;
      state.payment = null;
      state.checkoutStatus = 'idle';
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(createOrder.pending, (state) => {
        state.checkoutStatus = 'loading';
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.checkoutStatus = 'succeeded';
        state.current = action.payload;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.checkoutStatus = 'failed';
        state.error = action.payload;
      })
      .addCase(createPaymentIntent.fulfilled, (state, action) => {
        state.payment = action.payload;
      })
      .addCase(createPaymentIntent.rejected, (state, action) => {
        state.error = action.payload;
        state.checkoutStatus = 'failed';
      })
      .addCase(confirmOrderPayment.fulfilled, (state, action) => {
        state.current = action.payload;
        state.checkoutStatus = 'succeeded';
        state.list = state.list.map((order) => (order._id === action.payload._id ? action.payload : order));
      })
      .addCase(fetchMyOrders.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload;
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.current = action.payload;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.current = action.payload;
        state.list = state.list.map((order) => (order._id === action.payload._id ? action.payload : order));
      });
  },
});

export const { clearCurrentOrder, clearError } = ordersSlice.actions;

export default ordersSlice.reducer;
