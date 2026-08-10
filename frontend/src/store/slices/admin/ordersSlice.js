import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getAdminOrderAnalytics, getAdminOrdersList, getAdminOrderDetail,
  cancelAdminOrder, markAdminOrderFailed, markAdminOrderRefunded,
} from '../../../api/adminOrders.api';

export const fetchOrderAnalytics = createAsyncThunk('adminOrders/fetchAnalytics', async (_, { rejectWithValue }) => {
  try {
    const r = await getAdminOrderAnalytics();
    return r.data.analytics || r.data.data || r.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to fetch analytics');
  }
});

export const fetchAdminOrders = createAsyncThunk('adminOrders/fetchList', async (params, { rejectWithValue }) => {
  try {
    const r = await getAdminOrdersList(params);
    return r.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to fetch orders');
  }
});

export const fetchAdminOrder = createAsyncThunk('adminOrders/fetchDetail', async (orderId, { rejectWithValue }) => {
  try {
    const r = await getAdminOrderDetail(orderId);
    return r.data.order || r.data.data?.order || r.data.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to fetch order detail');
  }
});

export const cancelOrder = createAsyncThunk('adminOrders/cancel', async (orderId, { dispatch, rejectWithValue }) => {
  try {
    await cancelAdminOrder(orderId);
    dispatch(fetchOrderAnalytics());
    dispatch(fetchAdminOrders());
    return orderId;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to cancel order');
  }
});

export const refundOrder = createAsyncThunk('adminOrders/refund', async (orderId, { dispatch, rejectWithValue }) => {
  try {
    await markAdminOrderRefunded(orderId);
    dispatch(fetchOrderAnalytics());
    dispatch(fetchAdminOrders());
    return orderId;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to mark refund');
  }
});

const adminOrdersSlice = createSlice({
  name: 'adminOrders',
  initialState: { list: [], analytics: null, current: null, total: 0, loading: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b
      .addCase(fetchOrderAnalytics.fulfilled, (s, a) => {
        s.analytics = a.payload;
        if (s.list.length === 0 && a.payload?.recentOrders) {
          s.list = a.payload.recentOrders;
        }
      })
      .addCase(fetchAdminOrders.pending, (s) => { s.loading = true; })
      .addCase(fetchAdminOrders.fulfilled, (s, a) => {
        s.loading = false;
        s.list = a.payload.orders || a.payload.data?.orders || a.payload.recentOrders || s.list;
        s.total = a.payload.pagination?.totalOrders || a.payload.total || s.list.length;
      })
      .addCase(fetchAdminOrders.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchAdminOrder.fulfilled, (s, a) => { s.current = a.payload; })
      .addCase(cancelOrder.fulfilled, (s, a) => {
        const o = s.list.find(x => x._id === a.payload);
        if (o) { o.orderStatus = 'cancelled'; o.status = 'cancelled'; }
        if (s.current?._id === a.payload) { s.current.orderStatus = 'cancelled'; s.current.status = 'cancelled'; }
      })
      .addCase(refundOrder.fulfilled, (s, a) => {
        const o = s.list.find(x => x._id === a.payload);
        if (o) { o.orderStatus = 'refunded'; o.status = 'refunded'; }
        if (s.current?._id === a.payload) { s.current.orderStatus = 'refunded'; s.current.status = 'refunded'; }
      });
  },
});

export const selectAdminOrders = (s) => s.adminOrders.list;
export const selectAdminOrdersAnalytics = (s) => s.adminOrders.analytics;
export const selectAdminOrderDetail = (s) => s.adminOrders.current;
export const selectAdminOrdersLoading = (s) => s.adminOrders.loading;
export default adminOrdersSlice.reducer;
