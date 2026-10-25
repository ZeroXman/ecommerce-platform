import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { errorMessage } from '../../api/client.js';

export const fetchProducts = createAsyncThunk('products/fetchProducts', async (params = {}, { rejectWithValue }) => {
  try {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null)
    ).toString();

    const { data } = await api.get(`/products${query ? `?${query}` : ''}`);
    return data;
  } catch (error) {
    return rejectWithValue(errorMessage(error));
  }
});

export const fetchFeatured = createAsyncThunk('products/fetchFeatured', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/products/featured');
    return data;
  } catch (error) {
    return rejectWithValue(errorMessage(error));
  }
});

export const fetchProductBySlug = createAsyncThunk('products/fetchProductBySlug', async (slug, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/products/${slug}`);
    return data;
  } catch (error) {
    return rejectWithValue(errorMessage(error));
  }
});

export const fetchCategories = createAsyncThunk('products/fetchCategories', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/categories');
    return data;
  } catch (error) {
    return rejectWithValue(errorMessage(error));
  }
});

export const createReview = createAsyncThunk('products/createReview', async ({ productId, rating, comment }, { rejectWithValue, dispatch }) => {
  try {
    await api.post(`/products/${productId}/reviews`, { rating, comment });
    return true;
  } catch (error) {
    return rejectWithValue(errorMessage(error));
  }
});

const initialState = {
  items: [],
  featured: [],
  categories: [],
  product: null,
  reviews: [],
  related: [],
  page: 1,
  pages: 1,
  total: 0,
  status: 'idle',
  detailStatus: 'idle',
  error: null,
};

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearProduct(state) {
      state.product = null;
      state.reviews = [];
      state.related = [];
      state.detailStatus = 'idle';
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.products;
        state.page = action.payload.page;
        state.pages = action.payload.pages;
        state.total = action.payload.total;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchFeatured.fulfilled, (state, action) => {
        state.featured = action.payload.products;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload.categories;
      })
      .addCase(fetchProductBySlug.pending, (state) => {
        state.detailStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchProductBySlug.fulfilled, (state, action) => {
        state.detailStatus = 'succeeded';
        state.product = action.payload.product;
        state.reviews = action.payload.reviews;
        state.related = action.payload.related;
      })
      .addCase(fetchProductBySlug.rejected, (state, action) => {
        state.detailStatus = 'failed';
        state.error = action.payload;
      });
  },
});

export const { clearProduct, clearError } = productsSlice.actions;

export default productsSlice.reducer;
