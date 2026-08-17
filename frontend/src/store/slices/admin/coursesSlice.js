import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getAdminCourseAnalytics, getAdminCoursesList, getAdminCourseDetail,
  publishAdminCourse, unpublishAdminCourse, activateAdminCourse,
  deactivateAdminCourse, archiveAdminCourse,
} from '../../../api/adminCourses.api';

export const fetchCourseAnalytics = createAsyncThunk('adminCourses/fetchAnalytics', async (_, { rejectWithValue }) => {
  try {
    const r = await getAdminCourseAnalytics();
    return r.data.analytics || r.data.data || r.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to fetch course analytics');
  }
});

export const fetchAdminCourses = createAsyncThunk('adminCourses/fetchList', async (params, { rejectWithValue }) => {
  try {
    const r = await getAdminCoursesList(params);
    return r.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to fetch courses');
  }
});

export const fetchAdminCourse = createAsyncThunk('adminCourses/fetchDetail', async (courseId, { rejectWithValue }) => {
  try {
    const r = await getAdminCourseDetail(courseId);
    return r.data.course || r.data.data?.course || r.data.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to fetch course detail');
  }
});

export const publishCourse = createAsyncThunk('adminCourses/publish', async (courseId, { dispatch, rejectWithValue }) => {
  try {
    await publishAdminCourse(courseId);
    dispatch(fetchCourseAnalytics());
    dispatch(fetchAdminCourses());
    return courseId;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to publish course');
  }
});

export const unpublishCourse = createAsyncThunk('adminCourses/unpublish', async (courseId, { dispatch, rejectWithValue }) => {
  try {
    await unpublishAdminCourse(courseId);
    dispatch(fetchCourseAnalytics());
    dispatch(fetchAdminCourses());
    return courseId;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to unpublish course');
  }
});

export const archiveCourse = createAsyncThunk('adminCourses/archive', async (courseId, { dispatch, rejectWithValue }) => {
  try {
    await archiveAdminCourse(courseId);
    dispatch(fetchCourseAnalytics());
    dispatch(fetchAdminCourses());
    return courseId;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to archive course');
  }
});

const adminCoursesSlice = createSlice({
  name: 'adminCourses',
  initialState: { list: [], analytics: null, current: null, total: 0, loading: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b
      .addCase(fetchCourseAnalytics.fulfilled, (s, a) => {
        s.analytics = a.payload;
      })
      .addCase(fetchAdminCourses.pending, (s) => { s.loading = true; })
      .addCase(fetchAdminCourses.fulfilled, (s, a) => {
        s.loading = false;
        s.list = a.payload.courses || a.payload.data?.courses || [];
        s.total = a.payload.pagination?.totalCourses || a.payload.total || s.list.length;
      })
      .addCase(fetchAdminCourses.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchAdminCourse.fulfilled, (s, a) => { s.current = a.payload; })
      // Optimistic publish
      .addCase(publishCourse.pending, (s, a) => {
        const courseId = a.meta.arg;
        if (!s._snapshots) s._snapshots = {};
        const c = s.list.find(x => x._id === courseId);
        if (c) {
          s._snapshots[`pub_${courseId}`] = { isPublished: c.isPublished, status: c.status };
          c.isPublished = true;
          c.status = 'published';
        }
        if (s.current?._id === courseId) {
          s._snapshots[`curr_pub_${courseId}`] = { isPublished: s.current.isPublished, status: s.current.status };
          s.current.isPublished = true;
          s.current.status = 'published';
        }
      })
      .addCase(publishCourse.fulfilled, (s, a) => {
        if (s._snapshots) {
          delete s._snapshots[`pub_${a.payload}`];
          delete s._snapshots[`curr_pub_${a.payload}`];
        }
      })
      .addCase(publishCourse.rejected, (s, a) => {
        const courseId = a.meta.arg;
        if (s._snapshots?.[`pub_${courseId}`]) {
          const c = s.list.find(x => x._id === courseId);
          if (c) Object.assign(c, s._snapshots[`pub_${courseId}`]);
          delete s._snapshots[`pub_${courseId}`];
        }
        if (s._snapshots?.[`curr_pub_${courseId}`] && s.current?._id === courseId) {
          Object.assign(s.current, s._snapshots[`curr_pub_${courseId}`]);
          delete s._snapshots[`curr_pub_${courseId}`];
        }
      })

      // Optimistic unpublish
      .addCase(unpublishCourse.pending, (s, a) => {
        const courseId = a.meta.arg;
        if (!s._snapshots) s._snapshots = {};
        const c = s.list.find(x => x._id === courseId);
        if (c) {
          s._snapshots[`unpub_${courseId}`] = { isPublished: c.isPublished, status: c.status };
          c.isPublished = false;
          c.status = 'draft';
        }
        if (s.current?._id === courseId) {
          s._snapshots[`curr_unpub_${courseId}`] = { isPublished: s.current.isPublished, status: s.current.status };
          s.current.isPublished = false;
          s.current.status = 'draft';
        }
      })
      .addCase(unpublishCourse.fulfilled, (s, a) => {
        if (s._snapshots) {
          delete s._snapshots[`unpub_${a.payload}`];
          delete s._snapshots[`curr_unpub_${a.payload}`];
        }
      })
      .addCase(unpublishCourse.rejected, (s, a) => {
        const courseId = a.meta.arg;
        if (s._snapshots?.[`unpub_${courseId}`]) {
          const c = s.list.find(x => x._id === courseId);
          if (c) Object.assign(c, s._snapshots[`unpub_${courseId}`]);
          delete s._snapshots[`unpub_${courseId}`];
        }
        if (s._snapshots?.[`curr_unpub_${courseId}`] && s.current?._id === courseId) {
          Object.assign(s.current, s._snapshots[`curr_unpub_${courseId}`]);
          delete s._snapshots[`curr_unpub_${courseId}`];
        }
      })

      // Optimistic archive
      .addCase(archiveCourse.pending, (s, a) => {
        const courseId = a.meta.arg;
        if (!s._snapshots) s._snapshots = {};
        const c = s.list.find(x => x._id === courseId);
        if (c) {
          s._snapshots[`arch_${courseId}`] = { isPublished: c.isPublished, status: c.status };
          c.status = 'archived';
          c.isPublished = false;
        }
        if (s.current?._id === courseId) {
          s._snapshots[`curr_arch_${courseId}`] = { isPublished: s.current.isPublished, status: s.current.status };
          s.current.status = 'archived';
          s.current.isPublished = false;
        }
      })
      .addCase(archiveCourse.fulfilled, (s, a) => {
        if (s._snapshots) {
          delete s._snapshots[`arch_${a.payload}`];
          delete s._snapshots[`curr_arch_${a.payload}`];
        }
      })
      .addCase(archiveCourse.rejected, (s, a) => {
        const courseId = a.meta.arg;
        if (s._snapshots?.[`arch_${courseId}`]) {
          const c = s.list.find(x => x._id === courseId);
          if (c) Object.assign(c, s._snapshots[`arch_${courseId}`]);
          delete s._snapshots[`arch_${courseId}`];
        }
        if (s._snapshots?.[`curr_arch_${courseId}`] && s.current?._id === courseId) {
          Object.assign(s.current, s._snapshots[`curr_arch_${courseId}`]);
          delete s._snapshots[`curr_arch_${courseId}`];
        }
      });
  },
});

export const selectAdminCoursesList = (s) => s.adminCourses.list;
export const selectAdminCoursesAnalytics = (s) => s.adminCourses.analytics;
export const selectAdminCourseDetail = (s) => s.adminCourses.current;
export const selectAdminCoursesLoading = (s) => s.adminCourses.loading;
export default adminCoursesSlice.reducer;
