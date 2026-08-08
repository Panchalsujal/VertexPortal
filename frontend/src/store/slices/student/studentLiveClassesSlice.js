import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getStudentLiveClasses } from '../../../api/student.api';

export const fetchStudentLiveClasses = createAsyncThunk(
  'studentLiveClasses/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getStudentLiveClasses();
      const raw = res.data.liveClasses || res.data.data?.liveClasses || res.data.data || [];
      return Array.isArray(raw) ? raw : [];
    } catch (err) { return rejectWithValue(err.message); }
  }
);

const studentLiveClassesSlice = createSlice({
  name: 'studentLiveClasses',
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudentLiveClasses.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(fetchStudentLiveClasses.fulfilled, (s, a) => { s.loading = false; s.items = a.payload; })
      .addCase(fetchStudentLiveClasses.rejected,  (s, a) => { s.loading = false; s.error = a.payload; });
  },
});

export default studentLiveClassesSlice.reducer;
export const selectStudentLiveClasses        = (s) => s.studentLiveClasses.items;
export const selectStudentLiveClassesLoading = (s) => s.studentLiveClasses.loading;
