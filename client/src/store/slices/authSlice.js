import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/api'

export const login = createAsyncThunk('auth/login', async (creds, { rejectWithValue }) => {
  try { const { data } = await api.post('/auth/login', creds); return data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Login failed'); }
})

export const getMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try { const { data } = await api.get('/auth/me'); return data; }
  catch (e) { return rejectWithValue(e.response?.data?.message); }
})

const token = localStorage.getItem('token')
const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, token: token || null, loading: false, error: null },
  reducers: {
    logout(state) { state.user = null; state.token = null; localStorage.removeItem('token'); },
    clearError(state) { state.error = null; }
  },
  extraReducers: b => {
    b.addCase(login.pending, s => { s.loading = true; s.error = null; })
     .addCase(login.fulfilled, (s, a) => { s.loading = false; s.token = a.payload.token; s.user = a.payload.user; localStorage.setItem('token', a.payload.token); })
     .addCase(login.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
     .addCase(getMe.fulfilled, (s, a) => { s.user = a.payload.user; })
  }
})
export const { logout, clearError } = authSlice.actions
export default authSlice.reducer
