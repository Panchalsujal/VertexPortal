import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getInstructorAnnouncements,
  createAnnouncement as createAnnouncementApi,
  updateAnnouncement as updateAnnouncementApi,
  updateAnnouncementStatus as updateAnnouncementStatusApi,
  deleteAnnouncement as deleteAnnouncementApi,
} from '../../../api/instructor.api';

const norm = (res) => {
  const raw = res.data.announcements || res.data.data?.announcements || res.data.data || [];
  return Array.isArray(raw) ? raw : [];
};

export const fetchInstructorAnnouncements = createAsyncThunk(
  'instructorAnnouncements/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return norm(await getInstructorAnnouncements());
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch announcements');
    }
  }
);

export const createAnnouncement = createAsyncThunk(
  'instructorAnnouncements/create',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await createAnnouncementApi(payload);
      return res.data.announcement || res.data.data?.announcement || res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to create announcement');
    }
  }
);

export const updateAnnouncement = createAsyncThunk(
  'instructorAnnouncements/update',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await updateAnnouncementApi(id, payload);
      return res.data.announcement || res.data.data?.announcement || res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to update announcement');
    }
  }
);

export const updateAnnouncementStatus = createAsyncThunk(
  'instructorAnnouncements/updateStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const res = await updateAnnouncementStatusApi(id, { status });
      return res.data.announcement || res.data.data?.announcement || res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to update announcement status');
    }
  }
);

export const deleteAnnouncement = createAsyncThunk(
  'instructorAnnouncements/delete',
  async (id, { rejectWithValue }) => {
    try {
      await deleteAnnouncementApi(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to delete announcement');
    }
  }
);

const instructorAnnouncementsSlice = createSlice({
  name: 'instructorAnnouncements',
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInstructorAnnouncements.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(fetchInstructorAnnouncements.fulfilled, (s, a) => { s.loading = false; s.items = a.payload; })
      .addCase(fetchInstructorAnnouncements.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(createAnnouncement.fulfilled, (s, a) => {
        if (a.payload) s.items.unshift(a.payload);
      })
      .addCase(updateAnnouncement.fulfilled, (s, a) => {
        if (!a.payload) return;
        const idx = s.items.findIndex(x => x._id === a.payload._id);
        if (idx !== -1) s.items[idx] = { ...s.items[idx], ...a.payload };
      })
      .addCase(updateAnnouncementStatus.fulfilled, (s, a) => {
        if (!a.payload) return;
        const idx = s.items.findIndex(x => x._id === a.payload._id);
        if (idx !== -1) s.items[idx] = { ...s.items[idx], ...a.payload };
      })
      .addCase(deleteAnnouncement.fulfilled, (s, a) => {
        s.items = s.items.filter(x => x._id !== a.payload);
      });
  },
});

export default instructorAnnouncementsSlice.reducer;
export const selectInstructorAnnouncements        = (s) => s.instructorAnnouncements.items;
export const selectInstructorAnnouncementsLoading = (s) => s.instructorAnnouncements.loading;

