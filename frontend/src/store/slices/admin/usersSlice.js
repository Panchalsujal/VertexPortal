import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getAdminUsersAnalytics, getAdminUsers, getAdminUser,
  updateAdminUserStatus, updateAdminUserRole,
} from '../../../api/adminUsers.api';

export const fetchUsersAnalytics = createAsyncThunk('adminUsers/fetchAnalytics', async (_, { rejectWithValue }) => {
  try {
    const r = await getAdminUsersAnalytics();
    return r.data.analytics || r.data.data || r.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to fetch user analytics');
  }
});

export const fetchAdminUsersList = createAsyncThunk('adminUsers/fetchList', async (params, { rejectWithValue }) => {
  try {
    const r = await getAdminUsers(params);
    return r.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to fetch users');
  }
});

export const fetchAdminUserDetail = createAsyncThunk('adminUsers/fetchDetail', async (userId, { rejectWithValue }) => {
  try {
    const r = await getAdminUser(userId);
    return r.data.user || r.data.data?.user || r.data.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to fetch user detail');
  }
});

export const setUserRole = createAsyncThunk('adminUsers/setRole', async ({ userId, role }, { dispatch, rejectWithValue }) => {
  try {
    await updateAdminUserRole(userId, { role });
    dispatch(fetchUsersAnalytics());
    dispatch(fetchAdminUsersList());
    return { userId, role };
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to update role');
  }
});

export const setUserStatus = createAsyncThunk('adminUsers/setStatus', async ({ userId, status }, { dispatch, rejectWithValue }) => {
  try {
    await updateAdminUserStatus(userId, { status });
    dispatch(fetchUsersAnalytics());
    dispatch(fetchAdminUsersList());
    return { userId, status };
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to update status');
  }
});

const adminUsersSlice = createSlice({
  name: 'adminUsers',
  initialState: { list: [], analytics: null, current: null, total: 0, loading: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b
      .addCase(fetchUsersAnalytics.fulfilled, (s, a) => {
        s.analytics = a.payload;
      })
      .addCase(fetchAdminUsersList.pending, (s) => { s.loading = true; })
      .addCase(fetchAdminUsersList.fulfilled, (s, a) => {
        s.loading = false;
        s.list = a.payload.users || a.payload.data?.users || [];
        s.total = a.payload.pagination?.totalUsers || a.payload.total || s.list.length;
      })
      .addCase(fetchAdminUsersList.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchAdminUserDetail.fulfilled, (s, a) => { s.current = a.payload; })
      .addCase(setUserRole.fulfilled, (s, a) => {
        const u = s.list.find(x => x._id === a.payload.userId);
        if (u) u.role = a.payload.role;
        if (s.current?._id === a.payload.userId) s.current.role = a.payload.role;
      })
      .addCase(setUserStatus.fulfilled, (s, a) => {
        const u = s.list.find(x => x._id === a.payload.userId);
        if (u) u.status = a.payload.status;
        if (s.current?._id === a.payload.userId) s.current.status = a.payload.status;
      });
  },
});

export const selectAdminUsers = (s) => s.adminUsers.list;
export const selectAdminUsersAnalytics = (s) => s.adminUsers.analytics;
export const selectAdminUserDetail = (s) => s.adminUsers.current;
export const selectAdminUsersLoading = (s) => s.adminUsers.loading;
export default adminUsersSlice.reducer;
