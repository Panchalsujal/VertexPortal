import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getAllCourses } from '../../api/course.api';

export const fetchAllCourses = createAsyncThunk('courses/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await getAllCourses();
    const raw = res.data.courses || res.data.data?.courses || res.data.data || [];
    return Array.isArray(raw) ? raw : [];
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const coursesSlice = createSlice({
  name: 'courses',
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllCourses.pending,    (s) => { s.loading = true; s.error = null; })
      .addCase(fetchAllCourses.fulfilled,  (s, a) => { s.loading = false; s.items = a.payload; })
      .addCase(fetchAllCourses.rejected,   (s, a) => { s.loading = false; s.error = a.payload; });
  },
});

export default coursesSlice.reducer;
export const selectCourses        = (s) => s.courses.items;
export const selectCoursesLoading = (s) => s.courses.loading;
