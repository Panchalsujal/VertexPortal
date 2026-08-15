import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { getMe, logout as logoutApi } from '../../api/auth.api';

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const res = await getMe();
    return res.data.data.user;
  } catch {
    return rejectWithValue(null);
  }
});

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try {
    localStorage.removeItem('token');
    await logoutApi();
  } catch {
    /* ignore */
  }
  return null;
});

// ─── Slice ───────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    loading: true,   // true on first load so ProtectedRoute waits
    error: null,
  },
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
      state.loading = false;
    },
    clearUser(state) {
      state.user = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchMe
      .addCase(fetchMe.pending,    (state) => { state.loading = true; })
      .addCase(fetchMe.fulfilled,  (state, action) => { state.loading = false; state.user = action.payload; })
      .addCase(fetchMe.rejected,   (state) => { state.loading = false; state.user = null; })
      // logout
      .addCase(logoutUser.fulfilled, (state) => { state.user = null; state.loading = false; });
  },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectUser      = (s) => s.auth.user;
export const selectAuthLoading = (s) => s.auth.loading;
export const selectUserRole  = (s) => s.auth.user?.role;

// ─── Compatibility hook (drop-in replacement for useAuth) ────────────────────
export function useAuth() {
  const dispatch = useDispatch();
  const user     = useSelector(selectUser);
  const loading  = useSelector(selectAuthLoading);
  return {
    user,
    loading,
    login:       (userData) => dispatch(setUser(userData)),
    logout:      ()         => dispatch(logoutUser()),
    refreshUser: ()         => dispatch(fetchMe()),
  };
}
