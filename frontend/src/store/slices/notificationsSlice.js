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

export const markOneRead = createAsyncThunk('notifications/markOneRead', async (id, { rejectWithValue }) => {
  try {
    await markNotificationRead(id);
    return id;
  } catch (err) {
    return rejectWithValue({ id, message: err.message || 'Failed to mark read' });
  }
});

export const markAllRead = createAsyncThunk('notifications/markAllRead', async (_, { rejectWithValue }) => {
  try {
    await markAllNotificationsRead();
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to mark all read');
  }
});

export const archiveOne = createAsyncThunk('notifications/archiveOne', async (id, { rejectWithValue }) => {
  try {
    await archiveNotification(id);
    return id;
  } catch (err) {
    return rejectWithValue({ id, message: err.message || 'Failed to archive' });
  }
});

export const deleteOne = createAsyncThunk('notifications/deleteOne', async (id, { rejectWithValue }) => {
  try {
    await deleteNotification(id);
    return id;
  } catch (err) {
    return rejectWithValue({ id, message: err.message || 'Failed to delete' });
  }
});

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    unreadCount: 0,
    loading: false,
    error: null,
    // Snapshots for rollback
    _snapshots: {},
  },
  reducers: {
    setNotificationsSnapshot: (s, a) => {
      if (a.payload.items !== undefined) s.items = a.payload.items;
      if (a.payload.unreadCount !== undefined) s.unreadCount = a.payload.unreadCount;
    },
    optimisticRestoreNotification: (s, a) => {
      const notif = a.payload;
      if (notif && !s.items.some(x => x._id === notif._id)) {
        s.items.unshift(notif);
        if (!notif.isRead) s.unreadCount += 1;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchNotifications.fulfilled, (s, a) => {
        s.loading = false;
        s.items = a.payload.notifications;
        s.unreadCount = a.payload.unreadCount;
      })
      .addCase(fetchNotifications.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      // Optimistic mark one read
      .addCase(markOneRead.pending, (s, a) => {
        const id = a.meta.arg;
        const n = s.items.find(x => x._id === id);
        if (n) {
          s._snapshots[`markOne_${id}`] = { wasRead: n.isRead, prevUnread: s.unreadCount };
          if (!n.isRead) {
            n.isRead = true;
            s.unreadCount = Math.max(0, s.unreadCount - 1);
          }
        }
      })
      .addCase(markOneRead.rejected, (s, a) => {
        const id = a.meta.arg;
        const snap = s._snapshots[`markOne_${id}`];
        if (snap) {
          const n = s.items.find(x => x._id === id);
          if (n) n.isRead = snap.wasRead;
          s.unreadCount = snap.prevUnread;
          delete s._snapshots[`markOne_${id}`];
        }
      })
      .addCase(markOneRead.fulfilled, (s, a) => {
        delete s._snapshots[`markOne_${a.payload}`];
      })

      // Optimistic mark all read
      .addCase(markAllRead.pending, (s) => {
        s._snapshots.markAll = {
          items: s.items.map(x => ({ _id: x._id, isRead: x.isRead })),
          unreadCount: s.unreadCount,
        };
        s.items.forEach(n => { n.isRead = true; });
        s.unreadCount = 0;
      })
      .addCase(markAllRead.rejected, (s) => {
        const snap = s._snapshots.markAll;
        if (snap) {
          const readMap = new Map(snap.items.map(x => [x._id, x.isRead]));
          s.items.forEach(n => {
            if (readMap.has(n._id)) n.isRead = readMap.get(n._id);
          });
          s.unreadCount = snap.unreadCount;
          delete s._snapshots.markAll;
        }
      })
      .addCase(markAllRead.fulfilled, (s) => {
        delete s._snapshots.markAll;
      })

      // Optimistic archive one
      .addCase(archiveOne.pending, (s, a) => {
        const id = a.meta.arg;
        const item = s.items.find(x => x._id === id);
        if (item) {
          s._snapshots[`archive_${id}`] = { item: { ...item }, unreadCount: s.unreadCount };
          s.items = s.items.filter(n => n._id !== id);
          if (!item.isRead) s.unreadCount = Math.max(0, s.unreadCount - 1);
        }
      })
      .addCase(archiveOne.rejected, (s, a) => {
        const id = a.meta.arg;
        const snap = s._snapshots[`archive_${id}`];
        if (snap) {
          s.items.unshift(snap.item);
          s.unreadCount = snap.unreadCount;
          delete s._snapshots[`archive_${id}`];
        }
      })
      .addCase(archiveOne.fulfilled, (s, a) => {
        delete s._snapshots[`archive_${a.payload}`];
      })

      // Optimistic delete one
      .addCase(deleteOne.pending, (s, a) => {
        const id = a.meta.arg;
        const item = s.items.find(x => x._id === id);
        if (item) {
          s._snapshots[`delete_${id}`] = { item: { ...item }, unreadCount: s.unreadCount };
          s.items = s.items.filter(n => n._id !== id);
          if (!item.isRead) s.unreadCount = Math.max(0, s.unreadCount - 1);
        }
      })
      .addCase(deleteOne.rejected, (s, a) => {
        const id = a.meta.arg;
        const snap = s._snapshots[`delete_${id}`];
        if (snap) {
          s.items.unshift(snap.item);
          s.unreadCount = snap.unreadCount;
          delete s._snapshots[`delete_${id}`];
        }
      })
      .addCase(deleteOne.fulfilled, (s, a) => {
        delete s._snapshots[`delete_${a.payload}`];
      });
  },
});

export const { setNotificationsSnapshot, optimisticRestoreNotification } = notificationsSlice.actions;
export default notificationsSlice.reducer;
export const selectNotifications  = (s) => s.notifications.items;
export const selectUnreadCount    = (s) => s.notifications.unreadCount;
export const selectNotifLoading   = (s) => s.notifications.loading;
