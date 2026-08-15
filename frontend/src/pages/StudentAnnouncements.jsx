import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchStudentAnnouncements,
  markRead,
  selectStudentAnnouncements,
  selectStudentAnnouncementsLoading,
} from '../store/slices/student/studentAnnouncementsSlice';
import { SkeletonFeed } from '../components/ui/Spinner';
import { Megaphone, ArrowLeft, Calendar, Bell, Sparkles } from 'lucide-react';

export default function StudentAnnouncements() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const announcements = useAppSelector(selectStudentAnnouncements);
  const loading = useAppSelector(selectStudentAnnouncementsLoading);

  useEffect(() => {
    dispatch(fetchStudentAnnouncements());
  }, [dispatch]);

  const handleRead = (id) => {
    dispatch(markRead(id));
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-[#0b0f17] font-[Inter,sans-serif] py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => {
                if (window.history.length > 1 && window.history.state?.idx > 0) {
                  navigate(-1);
                } else {
                  navigate('/dashboard');
                }
              }}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/40 transition cursor-pointer"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <Megaphone className="w-6 h-6 text-purple-600 dark:text-purple-400" /> Course Announcements
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Important updates, schedule changes, and news from your course instructors
              </p>
            </div>
          </div>
        </div>

        {/* Announcements Stream */}
        <div>
          {loading ? (
            <SkeletonFeed count={3} />
          ) : announcements.length > 0 ? (
            <div className="space-y-4">
              {announcements.map((ann) => (
                <div
                  key={ann._id}
                  onClick={() => !ann.isRead && handleRead(ann._id)}
                  className={`bg-white dark:bg-gray-900 rounded-3xl p-5 sm:p-6 border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md ${
                    !ann.isRead
                      ? 'border-purple-300 dark:border-purple-800/80 bg-purple-50/20 dark:bg-purple-950/20'
                      : 'border-gray-100 dark:border-gray-800'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                      <Bell className="w-3.5 h-3.5 text-purple-600" />
                      {ann.course?.title || 'Course Announcement'}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(ann.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {ann.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {ann.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-12 text-center shadow-sm">
              <div className="w-16 h-16 rounded-3xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center mx-auto mb-4 text-purple-600 dark:text-purple-400 shadow-sm">
                <Megaphone className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                No announcements yet
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                Your course instructors haven't posted any announcements yet. Check back here for updates.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
