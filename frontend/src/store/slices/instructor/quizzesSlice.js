import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getInstructorQuizzes,
  createQuiz as createQuizApi,
  updateQuiz as updateQuizApi,
  deleteQuiz as deleteQuizApi,
} from '../../../api/instructor.api';

const norm = (res) => {
  const raw = res.data.quizzes || res.data.data?.quizzes || res.data.data || [];
  return Array.isArray(raw) ? raw : [];
};

export const fetchInstructorQuizzes = createAsyncThunk(
  'instructorQuizzes/fetch',
  async (_, { rejectWithValue }) => {
    try { return norm(await getInstructorQuizzes()); }
    catch (err) { return rejectWithValue(err.message); }
  }
);

export const createQuiz = createAsyncThunk(
  'instructorQuizzes/create',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await createQuizApi(payload);
      return res.data.quiz || res.data.data?.quiz || res.data.data;
    } catch (err) { return rejectWithValue(err.message); }
  }
);

export const updateQuiz = createAsyncThunk(
  'instructorQuizzes/update',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await updateQuizApi(id, payload);
      return res.data.quiz || res.data.data?.quiz || res.data.data;
    } catch (err) { return rejectWithValue(err.message); }
  }
);

export const deleteQuiz = createAsyncThunk(
  'instructorQuizzes/delete',
  async (id, { rejectWithValue }) => {
    try { await deleteQuizApi(id); return id; }
    catch (err) { return rejectWithValue(err.message); }
  }
);

const instructorQuizzesSlice = createSlice({
  name: 'instructorQuizzes',
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInstructorQuizzes.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(fetchInstructorQuizzes.fulfilled, (s, a) => { s.loading = false; s.items = a.payload; })
      .addCase(fetchInstructorQuizzes.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(createQuiz.fulfilled, (s, a) => {
        if (a.payload) s.items.unshift(a.payload);
      })
      .addCase(updateQuiz.fulfilled, (s, a) => {
        if (!a.payload) return;
        const idx = s.items.findIndex(x => x._id === a.payload._id);
        if (idx !== -1) s.items[idx] = { ...s.items[idx], ...a.payload };
      })
      .addCase(deleteQuiz.fulfilled, (s, a) => {
        s.items = s.items.filter(x => x._id !== a.payload);
      });
  },
});

export default instructorQuizzesSlice.reducer;
export const selectInstructorQuizzes        = (s) => s.instructorQuizzes.items;
export const selectInstructorQuizzesLoading = (s) => s.instructorQuizzes.loading;
