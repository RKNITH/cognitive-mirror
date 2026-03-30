import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api.js';

export const loginUser = createAsyncThunk('auth/login', async (creds, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', creds);
    localStorage.setItem('cm_token', data.token);
    return data;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Login failed'); }
});

export const registerUser = createAsyncThunk('auth/register', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', payload);
    return data;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Registration failed'); }
});

export const verifyOTP = createAsyncThunk('auth/verifyOTP', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/verify-otp', payload);
    localStorage.setItem('cm_token', data.token);
    return data;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'OTP verification failed'); }
});

export const fetchMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/me');
    return data;
  } catch (e) { return rejectWithValue(e.response?.data?.message); }
});

const slice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('cm_token'),
    isAuthenticated: false,
    loading: false,
    error: null,
    pendingUserId: null,
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.pendingUserId = null;
      localStorage.removeItem('cm_token');
    },
    clearError(state) { state.error = null; },
    updateUser(state, { payload }) { if (state.user) Object.assign(state.user, payload); },
    setPendingUser(state, { payload }) { state.pendingUserId = payload; },
  },
  extraReducers: (b) => {
    b
      .addCase(loginUser.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(loginUser.fulfilled, (s, { payload }) => { s.loading = false; s.user = payload.user; s.token = payload.token; s.isAuthenticated = true; })
      .addCase(loginUser.rejected, (s, { payload }) => { s.loading = false; s.error = payload; })
      .addCase(registerUser.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(registerUser.fulfilled, (s, { payload }) => { s.loading = false; s.pendingUserId = payload.userId; })
      .addCase(registerUser.rejected, (s, { payload }) => { s.loading = false; s.error = payload; })
      .addCase(verifyOTP.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(verifyOTP.fulfilled, (s, { payload }) => { s.loading = false; s.user = payload.user; s.token = payload.token; s.isAuthenticated = true; s.pendingUserId = null; })
      .addCase(verifyOTP.rejected, (s, { payload }) => { s.loading = false; s.error = payload; })
      .addCase(fetchMe.fulfilled, (s, { payload }) => { s.user = payload.user; s.isAuthenticated = true; })
      .addCase(fetchMe.rejected, (s) => { s.token = null; s.isAuthenticated = false; localStorage.removeItem('cm_token'); });
  },
});

export const { logout, clearError, updateUser, setPendingUser } = slice.actions;
export default slice.reducer;
