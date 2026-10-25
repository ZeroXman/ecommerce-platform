import { createSlice, nanoid } from '@reduxjs/toolkit';

const initialState = {
  toasts: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    pushToast: {
      reducer(state, action) {
        state.toasts.push(action.payload);
      },
      prepare({ message, type = 'info' }) {
        return { payload: { id: nanoid(), message, type } };
      },
    },
    dismissToast(state, action) {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
    },
  },
});

export const { pushToast, dismissToast } = uiSlice.actions;

export const selectToasts = (state) => state.ui.toasts;

export default uiSlice.reducer;
