import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  archiveNotification,
  deleteNotification,
} from '../../api/notification.api';

export const fetchNotifications = createAsyncThunk(
  'notifications/fetch',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await getNotifications(params);
      const data = res.data.data || res.data;
      return {
        notifications: data.notifications || [],
        unreadCount:   data.unreadCount   || 0,
      };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const markOneRead = createAsyncThunk('notifications/markOneRead', async (id) => {
  await markNotificationRead(id);
  return id;
});

export const markAllRead = createAsyncThunk('notifications/markAllRead', async () => {
  await markAllNotificationsRead();
});

export const archiveOne = createAsyncThunk('notifications/archiveOne', async (id) => {
  await archiveNotification(id);
  return id;
});

export const deleteOne = createAsyncThunk('notifications/deleteOne', async (id) => {
  await deleteNotification(id);
  return id;
});

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: { items: [], unreadCount: 0, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(fetchNotifications.fulfilled, (s, a) => {
        s.loading = false;
        s.items = a.payload.notifications;
        s.unreadCount = a.payload.unreadCount;
      })
      .addCase(fetchNotifications.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(markOneRead.fulfilled, (s, a) => {
        const n = s.items.find(x => x._id === a.payload);
        if (n && !n.isRead) { n.isRead = true; s.unreadCount = Math.max(0, s.unreadCount - 1); }
      })
      .addCase(markAllRead.fulfilled, (s) => {
        s.items.forEach(n => { n.isRead = true; });
        s.unreadCount = 0;
      })
      .addCase(archiveOne.fulfilled, (s, a) => {
        s.items = s.items.filter(n => n._id !== a.payload);
      })
      .addCase(deleteOne.fulfilled, (s, a) => {
        s.items = s.items.filter(n => n._id !== a.payload);
      });
  },
});

export default notificationsSlice.reducer;
export const selectNotifications  = (s) => s.notifications.items;
export const selectUnreadCount    = (s) => s.notifications.unreadCount;
export const selectNotifLoading   = (s) => s.notifications.loading;
