import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { errorMessage, setAccessToken } from '../../api/client.js';

export const registerUser = createAsyncThunk('auth/register', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', payload);
    return data;
  } catch (error) {
    return rejectWithValue(errorMessage(error));
  }
});

export const loginUser = createAsyncThunk('auth/login', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', payload);
    return data;
  } catch (error) {
    return rejectWithValue(errorMessage(error));
  }
});

export const loadSession = createAsyncThunk('auth/loadSession', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/me');
    return data;
  } catch (error) {
    return rejectWithValue(errorMessage(error));
  }
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.put('/auth/profile', payload);
    return data;
  } catch (error) {
    return rejectWithValue(errorMessage(error));
  }
});

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    // Ignoramos errores al cerrar sesión.
  }

  setAccessToken(null);
  return true;
});

const initialState = {
  user: null,
  accessToken: null,
  initialized: false,
  status: 'idle',
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    sessionCleared(state) {
      state.user = null;
      state.accessToken = null;
      state.initialized = true;
    },
  },
  extraReducers(builder) {
    const pending = (state) => {
      state.status = 'loading';
      state.error = null;
    };

    builder
      .addCase(registerUser.pending, pending)
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.initialized = true;
        setAccessToken(action.payload.accessToken);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(loginUser.pending, pending)
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.initialized = true;
        setAccessToken(action.payload.accessToken);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(loadSession.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.initialized = true;
        state.status = 'succeeded';
      })
      .addCase(loadSession.rejected, (state) => {
        state.user = null;
        state.initialized = true;
        state.status = 'idle';
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload.user;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.status = 'idle';
      });
  },
});

export const { clearError, sessionCleared } = authSlice.actions;

export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => Boolean(state.auth.user);

export default authSlice.reducer;
