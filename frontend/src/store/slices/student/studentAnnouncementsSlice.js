import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getStudentAnnouncements, markAnnouncementRead } from '../../../api/student.api';

export const fetchStudentAnnouncements = createAsyncThunk(
  'studentAnnouncements/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getStudentAnnouncements();
      const raw = res.data.announcements || res.data.data?.announcements || res.data.data || [];
      return Array.isArray(raw) ? raw : [];
    } catch (err) { return rejectWithValue(err.message); }
  }
);

export const markRead = createAsyncThunk(
  'studentAnnouncements/markRead',
  async (id, { rejectWithValue }) => {
    try {
      await markAnnouncementRead(id);
      return id;
    } catch (err) { return rejectWithValue(err.message); }
  }
);

const studentAnnouncementsSlice = createSlice({
  name: 'studentAnnouncements',
  initialState: { items: [], loading: false, error: null, _snapshots: {} },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudentAnnouncements.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(fetchStudentAnnouncements.fulfilled, (s, a) => { s.loading = false; s.items = a.payload; })
      .addCase(fetchStudentAnnouncements.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })

      // Optimistic mark read
      .addCase(markRead.pending, (s, a) => {
        const id = a.meta.arg;
        const item = s.items.find(x => x._id === id);
        if (item) {
          s._snapshots[`read_${id}`] = item.isRead;
          item.isRead = true;
        }
      })
      .addCase(markRead.fulfilled, (s, a) => {
        delete s._snapshots[`read_${a.payload}`];
      })
      .addCase(markRead.rejected, (s, a) => {
        const id = a.meta.arg;
        const wasRead = s._snapshots[`read_${id}`];
        if (wasRead !== undefined) {
          const item = s.items.find(x => x._id === id);
          if (item) item.isRead = wasRead;
          delete s._snapshots[`read_${id}`];
        }
      });
  },
});

export default studentAnnouncementsSlice.reducer;
export const selectStudentAnnouncements        = (s) => s.studentAnnouncements.items;
export const selectStudentAnnouncementsLoading = (s) => s.studentAnnouncements.loading;
