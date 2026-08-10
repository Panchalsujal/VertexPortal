import { configureStore } from '@reduxjs/toolkit';
import authReducer               from './slices/authSlice';
import coursesReducer            from './slices/coursesSlice';
import notificationsReducer      from './slices/notificationsSlice';
import certificatesReducer       from './slices/certificatesSlice';
import adminCertificatesReducer  from './slices/admin/certificatesSlice';
import instructorAssignmentsReducer from './slices/instructor/assignmentsSlice';
import instructorLiveClassesReducer from './slices/instructor/liveClassesSlice';
import instructorQuizzesReducer     from './slices/instructor/quizzesSlice';
import instructorAnnouncementsReducer from './slices/instructor/announcementsSlice';
import studentAssignmentsReducer from './slices/student/studentAssignmentsSlice';
import studentLiveClassesReducer from './slices/student/studentLiveClassesSlice';
import studentQuizzesReducer     from './slices/student/studentQuizzesSlice';
import studentAnnouncementsReducer from './slices/student/studentAnnouncementsSlice';

// New Slices
import discussionsReducer        from './slices/discussionsSlice';
import notesReducer              from './slices/notesSlice';
import aiReducer                 from './slices/aiSlice';
import adminUsersReducer         from './slices/admin/usersSlice';
import adminOrdersReducer        from './slices/admin/ordersSlice';
import adminCoursesReducer       from './slices/admin/coursesSlice';

export const store = configureStore({
  reducer: {
    auth:                    authReducer,
    courses:                 coursesReducer,
    notifications:           notificationsReducer,
    certificates:            certificatesReducer,
    adminCertificates:       adminCertificatesReducer,
    instructorAssignments:   instructorAssignmentsReducer,
    instructorLiveClasses:   instructorLiveClassesReducer,
    instructorQuizzes:       instructorQuizzesReducer,
    instructorAnnouncements: instructorAnnouncementsReducer,
    studentAssignments:      studentAssignmentsReducer,
    studentLiveClasses:      studentLiveClassesReducer,
    studentQuizzes:          studentQuizzesReducer,
    studentAnnouncements:    studentAnnouncementsReducer,
    
    // Naye Redux Slices
    discussions:             discussionsReducer,
    notes:                   notesReducer,
    ai:                      aiReducer,
    adminUsers:              adminUsersReducer,
    adminOrders:             adminOrdersReducer,
    adminCourses:            adminCoursesReducer,
  },
});
