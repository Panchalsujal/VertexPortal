import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getInstructorLiveClasses,
  createLiveClass   as createLiveClassApi,
  updateLiveClass   as updateLiveClassApi,
  cancelLiveClass   as cancelLiveClassApi,
  updateLiveClassStatus as updateLiveClassStatusApi,
} from '../../../api/instructor.api';

const norm = (res) => {
  const raw = res.data.liveClasses || res.data.data?.liveClasses || res.data.data || [];
  return Array.isArray(raw) ? raw : [];
};

export const fetchLiveClasses = createAsyncThunk(
  'instructorLiveClasses/fetch',
  async (_, { rejectWithValue }) => {
    try { return norm(await getInstructorLiveClasses()); }
    catch (err) { return rejectWithValue(err.message); }
  }
);

export const createLiveClass = createAsyncThunk(
  'instructorLiveClasses/create',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await createLiveClassApi(payload);
      return res.data.liveClass || res.data.data?.liveClass || res.data.data;
    } catch (err) { return rejectWithValue(err.message); }
  }
);

export const updateLiveClass = createAsyncThunk(
  'instructorLiveClasses/update',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await updateLiveClassApi(id, payload);
      return res.data.liveClass || res.data.data?.liveClass || res.data.data;
    } catch (err) { return rejectWithValue(err.message); }
  }
);

export const cancelLiveClass = createAsyncThunk(
  'instructorLiveClasses/cancel',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      await cancelLiveClassApi(id, data);
      return id;
    } catch (err) { return rejectWithValue(err.message); }
  }
);

export const updateLiveClassStatus = createAsyncThunk(
  'instructorLiveClasses/updateStatus',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await updateLiveClassStatusApi(id, data);
      return res.data.liveClass || res.data.data?.liveClass || res.data.data;
    } catch (err) { return rejectWithValue(err.message); }
  }
);

const liveClassesSlice = createSlice({
  name: 'instructorLiveClasses',
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLiveClasses.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(fetchLiveClasses.fulfilled, (s, a) => { s.loading = false; s.items = a.payload; })
      .addCase(fetchLiveClasses.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(createLiveClass.fulfilled, (s, a) => {
        if (a.payload) s.items.unshift(a.payload);
      })
      .addCase(updateLiveClass.fulfilled, (s, a) => {
        if (!a.payload) return;
        const idx = s.items.findIndex(x => x._id === a.payload._id);
        if (idx !== -1) s.items[idx] = { ...s.items[idx], ...a.payload };
      })
      .addCase(cancelLiveClass.fulfilled, (s, a) => {
        const item = s.items.find(x => x._id === a.payload);
        if (item) item.status = 'cancelled';
      })
      .addCase(updateLiveClassStatus.fulfilled, (s, a) => {
        if (!a.payload) return;
        const idx = s.items.findIndex(x => x._id === a.payload._id);
        if (idx !== -1) s.items[idx] = { ...s.items[idx], ...a.payload };
      });
  },
});

export default liveClassesSlice.reducer;
export const selectLiveClasses        = (s) => s.instructorLiveClasses.items;
export const selectLiveClassesLoading = (s) => s.instructorLiveClasses.loading;
export const selectLiveClassesError   = (s) => s.instructorLiveClasses.error;
