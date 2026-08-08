import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getStudentAssignments } from '../../../api/student.api';

export const fetchStudentAssignments = createAsyncThunk(
  'studentAssignments/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getStudentAssignments();
      const raw = res.data.assignments || res.data.data?.assignments || res.data.data || [];
      return Array.isArray(raw) ? raw : [];
    } catch (err) { return rejectWithValue(err.message); }
  }
);

const studentAssignmentsSlice = createSlice({
  name: 'studentAssignments',
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudentAssignments.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(fetchStudentAssignments.fulfilled, (s, a) => { s.loading = false; s.items = a.payload; })
      .addCase(fetchStudentAssignments.rejected,  (s, a) => { s.loading = false; s.error = a.payload; });
  },
});

export default studentAssignmentsSlice.reducer;
export const selectStudentAssignments        = (s) => s.studentAssignments.items;
export const selectStudentAssignmentsLoading = (s) => s.studentAssignments.loading;
