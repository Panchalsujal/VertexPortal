import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getInstructorAssignments,
  createAssignment as createAssignmentApi,
  updateAssignment as updateAssignmentApi,
  deleteAssignment as deleteAssignmentApi,
} from '../../../api/instructor.api';

const norm = (res) => {
  const raw = res.data.assignments || res.data.data?.assignments || res.data.data || [];
  return Array.isArray(raw) ? raw : [];
};

export const fetchInstructorAssignments = createAsyncThunk(
  'instructorAssignments/fetch',
  async (_, { rejectWithValue }) => {
    try { return norm(await getInstructorAssignments()); }
    catch (err) { return rejectWithValue(err.message); }
  }
);

export const createAssignment = createAsyncThunk(
  'instructorAssignments/create',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await createAssignmentApi(payload);
      return res.data.assignment || res.data.data?.assignment || res.data.data;
    } catch (err) { return rejectWithValue(err.message); }
  }
);

export const updateAssignment = createAsyncThunk(
  'instructorAssignments/update',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await updateAssignmentApi(id, payload);
      return res.data.assignment || res.data.data?.assignment || res.data.data;
    } catch (err) { return rejectWithValue(err.message); }
  }
);

export const deleteAssignment = createAsyncThunk(
  'instructorAssignments/delete',
  async (id, { rejectWithValue }) => {
    try { await deleteAssignmentApi(id); return id; }
    catch (err) { return rejectWithValue(err.message); }
  }
);

const instructorAssignmentsSlice = createSlice({
  name: 'instructorAssignments',
  initialState: { items: [], loading: false, error: null },
  reducers: {
    optimisticRemove(state, action) {
      state.items = state.items.filter(a => a._id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInstructorAssignments.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(fetchInstructorAssignments.fulfilled, (s, a) => { s.loading = false; s.items = a.payload; })
      .addCase(fetchInstructorAssignments.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(createAssignment.fulfilled, (s, a) => {
        if (a.payload) s.items.unshift(a.payload);
      })
      .addCase(updateAssignment.fulfilled, (s, a) => {
        if (!a.payload) return;
        const idx = s.items.findIndex(x => x._id === a.payload._id);
        if (idx !== -1) s.items[idx] = { ...s.items[idx], ...a.payload };
      })
      .addCase(deleteAssignment.fulfilled, (s, a) => {
        s.items = s.items.filter(x => x._id !== a.payload);
      });
  },
});

export const { optimisticRemove } = instructorAssignmentsSlice.actions;
export default instructorAssignmentsSlice.reducer;
export const selectInstructorAssignments        = (s) => s.instructorAssignments.items;
export const selectInstructorAssignmentsLoading = (s) => s.instructorAssignments.loading;
export const selectInstructorAssignmentsError   = (s) => s.instructorAssignments.error;
