import { configureStore, combineReducers } from '@reduxjs/toolkit';

// ─── Always-needed slices (loaded on every page) ─────────────────────────────
import authReducer          from './slices/authSlice';
import coursesReducer       from './slices/coursesSlice';
import notificationsReducer from './slices/notificationsSlice';
import certificatesReducer  from './slices/certificatesSlice';

// ─── Feature slices loaded upfront (needed for page routing state) ────────────
// Student feature slices
import studentAssignmentsReducer   from './slices/student/studentAssignmentsSlice';
import studentLiveClassesReducer   from './slices/student/studentLiveClassesSlice';
import studentQuizzesReducer       from './slices/student/studentQuizzesSlice';
import studentAnnouncementsReducer from './slices/student/studentAnnouncementsSlice';

// Instructor feature slices
import instructorAssignmentsReducer   from './slices/instructor/assignmentsSlice';
import instructorLiveClassesReducer   from './slices/instructor/liveClassesSlice';
import instructorQuizzesReducer       from './slices/instructor/quizzesSlice';
import instructorAnnouncementsReducer from './slices/instructor/announcementsSlice';

// Shared feature slices
import discussionsReducer from './slices/discussionsSlice';
import notesReducer       from './slices/notesSlice';
import aiReducer          from './slices/aiSlice';

// ─── Admin slices (heavy, only needed on /admin/* routes) ─────────────────────
import adminCertificatesReducer from './slices/admin/certificatesSlice';
import adminUsersReducer        from './slices/admin/usersSlice';
import adminOrdersReducer       from './slices/admin/ordersSlice';
import adminCoursesReducer      from './slices/admin/coursesSlice';

export const store = configureStore({
  reducer: {
    // Core
    auth:          authReducer,
    courses:       coursesReducer,
    notifications: notificationsReducer,
    certificates:  certificatesReducer,

    // Student
    studentAssignments:   studentAssignmentsReducer,
    studentLiveClasses:   studentLiveClassesReducer,
    studentQuizzes:       studentQuizzesReducer,
    studentAnnouncements: studentAnnouncementsReducer,

    // Instructor
    instructorAssignments:   instructorAssignmentsReducer,
    instructorLiveClasses:   instructorLiveClassesReducer,
    instructorQuizzes:       instructorQuizzesReducer,
    instructorAnnouncements: instructorAnnouncementsReducer,

    // Feature
    discussions: discussionsReducer,
    notes:       notesReducer,
    ai:          aiReducer,

    // Admin
    adminCertificates: adminCertificatesReducer,
    adminUsers:        adminUsersReducer,
    adminOrders:       adminOrdersReducer,
    adminCourses:      adminCoursesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Disable serializable check for performance (avoids costly checks on large payloads)
      serializableCheck: false,
    }),
});
