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
      .addCase(setUserRole.pending, (s, a) => {
        const { userId, role } = a.meta.arg;
        if (!s._snapshots) s._snapshots = {};
        const u = s.list.find(x => x._id === userId);
        if (u) {
          s._snapshots[`role_${userId}`] = u.role;
          u.role = role;
        }
        if (s.current?._id === userId) {
          s._snapshots[`curr_role_${userId}`] = s.current.role;
          s.current.role = role;
        }
      })
      .addCase(setUserRole.fulfilled, (s, a) => {
        if (s._snapshots) {
          delete s._snapshots[`role_${a.payload.userId}`];
          delete s._snapshots[`curr_role_${a.payload.userId}`];
        }
      })
      .addCase(setUserRole.rejected, (s, a) => {
        const { userId } = a.meta.arg;
        if (s._snapshots?.[`role_${userId}`]) {
          const u = s.list.find(x => x._id === userId);
          if (u) u.role = s._snapshots[`role_${userId}`];
          delete s._snapshots[`role_${userId}`];
        }
        if (s._snapshots?.[`curr_role_${userId}`] && s.current?._id === userId) {
          s.current.role = s._snapshots[`curr_role_${userId}`];
          delete s._snapshots[`curr_role_${userId}`];
        }
      })

      .addCase(setUserStatus.pending, (s, a) => {
        const { userId, status } = a.meta.arg;
        if (!s._snapshots) s._snapshots = {};
        const u = s.list.find(x => x._id === userId);
        if (u) {
          s._snapshots[`status_${userId}`] = u.status;
          u.status = status;
        }
        if (s.current?._id === userId) {
          s._snapshots[`curr_status_${userId}`] = s.current.status;
          s.current.status = status;
        }
      })
      .addCase(setUserStatus.fulfilled, (s, a) => {
        if (s._snapshots) {
          delete s._snapshots[`status_${a.payload.userId}`];
          delete s._snapshots[`curr_status_${a.payload.userId}`];
        }
      })
      .addCase(setUserStatus.rejected, (s, a) => {
        const { userId } = a.meta.arg;
        if (s._snapshots?.[`status_${userId}`]) {
          const u = s.list.find(x => x._id === userId);
          if (u) u.status = s._snapshots[`status_${userId}`];
          delete s._snapshots[`status_${userId}`];
        }
        if (s._snapshots?.[`curr_status_${userId}`] && s.current?._id === userId) {
          s.current.status = s._snapshots[`curr_status_${userId}`];
          delete s._snapshots[`curr_status_${userId}`];
        }
      });
  },
});

export const selectAdminUsers = (s) => s.adminUsers.list;
export const selectAdminUsersAnalytics = (s) => s.adminUsers.analytics;
export const selectAdminUserDetail = (s) => s.adminUsers.current;
export const selectAdminUsersLoading = (s) => s.adminUsers.loading;
export default adminUsersSlice.reducer;
