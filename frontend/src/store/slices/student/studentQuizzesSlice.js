import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getStudentQuizzes } from '../../../api/student.api';

export const fetchStudentQuizzes = createAsyncThunk(
  'studentQuizzes/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getStudentQuizzes();
      const raw = res.data.quizzes || res.data.data?.quizzes || res.data.data || [];
      return Array.isArray(raw) ? raw : [];
    } catch (err) { return rejectWithValue(err.message); }
  }
);

const studentQuizzesSlice = createSlice({
  name: 'studentQuizzes',
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudentQuizzes.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(fetchStudentQuizzes.fulfilled, (s, a) => { s.loading = false; s.items = a.payload; })
      .addCase(fetchStudentQuizzes.rejected,  (s, a) => { s.loading = false; s.error = a.payload; });
  },
});

export default studentQuizzesSlice.reducer;
export const selectStudentQuizzes        = (s) => s.studentQuizzes.items;
export const selectStudentQuizzesLoading = (s) => s.studentQuizzes.loading;
