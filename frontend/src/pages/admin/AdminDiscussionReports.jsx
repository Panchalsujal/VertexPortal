import React, { useEffect, useState, useCallback } from 'react';
import {
  getAdminDiscussionReports,
  startDiscussionReportReview,
  resolveDiscussionReport,
} from '../../api/adminDiscussionReport.api';
import {
  ShieldAlert, Search, Filter, AlertTriangle, CheckCircle, XCircle,
  Eye, Clock, Trash2, Shield, User, MessageSquare, RefreshCw, X
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import CustomSelect from '../../components/ui/CustomSelect';
import { SkeletonTable } from '../../components/ui/Spinner';
import { useAdminGuard } from '../../hooks/useAdminGuard';
import { useInactivityLogout } from '../../hooks/useInactivityLogout';
import toast from 'react-hot-toast';

export default function AdminDiscussionReports() {
  useAdminGuard();
  useInactivityLogout();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [reasonFilter, setReasonFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modals state
  const [selectedReport, setSelectedReport] = useState(null);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [activeReport, setActiveReport] = useState(null);
  const [resolveStatus, setResolveStatus] = useState('resolved');
  const [moderationAction, setModerationAction] = useState('hide_content');
  const [resolutionNote, setResolutionNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchReports = useCallback(async (showFullLoader = false) => {
    if (showFullLoader) setLoading(true);
    else setIsRefreshing(true);

    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (reasonFilter) params.reason = reasonFilter;
      if (search) params.search = search;

      const res = await getAdminDiscussionReports(params);
      const data = res.data?.reports || res.data?.data?.reports || res.data?.data || [];
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      if (showFullLoader) {
        toast.error(err.response?.data?.message || 'Failed to fetch discussion reports');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [statusFilter, reasonFilter, search]);

  useEffect(() => {
    fetchReports(true);
  }, [fetchReports]);

  // Handle Start Review
  const handleStartReview = async (reportId) => {
    try {
      await startDiscussionReportReview(reportId);
      toast.success('Report moved to In Review status');
      fetchReports(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start review');
    }
  };

  // Open Resolve Modal
  const openResolveModal = (report) => {
    setActiveReport(report);
    setResolveStatus('resolved');
    setModerationAction('hide_content');
    setResolutionNote('');
    setResolveModalOpen(true);
  };

  // Submit Resolution
  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!activeReport?._id) return;
    setIsProcessing(true);

    try {
      await resolveDiscussionReport(activeReport._id, {
        status: resolveStatus,
        moderationAction: resolveStatus === 'resolved' ? moderationAction : 'none',
        resolutionNote: resolutionNote.trim(),
      });
      toast.success(`Report marked as ${resolveStatus}`);
      setResolveModalOpen(false);
      setActiveReport(null);
      fetchReports(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resolve report');
    } finally {
      setIsProcessing(false);
    }
  };

  // Analytics Metrics
  const totalCount = reports.length;
  const pendingCount = reports.filter((r) => r.status === 'pending').length;
  const reviewingCount = reports.filter((r) => r.status === 'reviewing').length;
  const resolvedCount = reports.filter((r) => r.status === 'resolved').length;

  return (
    <AdminLayout
      title="Discussion Moderation & Reports"
      subtitle="Review and resolve flagged community discussions and user-reported content"
    >
      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-5">
        <div className="bg-white dark:bg-gray-900 p-3.5 sm:p-4.5 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs text-gray-500 font-medium truncate">Pending Review</p>
            <p className="text-lg sm:text-2xl font-extrabold text-amber-600 leading-tight">{pendingCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-3.5 sm:p-4.5 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0">
            <Eye className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs text-gray-500 font-medium truncate">Under Review</p>
            <p className="text-lg sm:text-2xl font-extrabold text-blue-600 leading-tight">{reviewingCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-3.5 sm:p-4.5 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs text-gray-500 font-medium truncate">Resolved</p>
            <p className="text-lg sm:text-2xl font-extrabold text-emerald-600 leading-tight">{resolvedCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-3.5 sm:p-4.5 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs text-gray-500 font-medium truncate">Total Reports</p>
            <p className="text-lg sm:text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">{totalCount}</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-gray-900 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs mb-5 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-1 w-full md:w-auto items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reports by user, reason, note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            />
          </div>

          <div className="w-36 sm:w-44 shrink-0">
            <CustomSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'pending', label: 'Pending' },
                { value: 'reviewing', label: 'Reviewing' },
                { value: 'resolved', label: 'Resolved' },
                { value: 'rejected', label: 'Dismissed' },
              ]}
              placeholder="All Statuses"
            />
          </div>

          <div className="w-40 sm:w-48 shrink-0">
            <CustomSelect
              value={reasonFilter}
              onChange={(val) => setReasonFilter(val)}
              options={[
                { value: '', label: 'All Reasons' },
                { value: 'spam', label: 'Spam' },
                { value: 'harassment', label: 'Harassment' },
                { value: 'abusive_language', label: 'Abusive Language' },
                { value: 'inappropriate_content', label: 'Inappropriate Content' },
                { value: 'misinformation', label: 'Misinformation' },
                { value: 'plagiarism', label: 'Plagiarism' },
                { value: 'other', label: 'Other' },
              ]}
              placeholder="All Reasons"
            />
          </div>
        </div>

        <button
          onClick={() => fetchReports(false)}
          disabled={isRefreshing}
          className="p-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 transition shrink-0"
          title="Refresh reports"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-purple-600' : ''}`} />
        </button>
      </div>

      {/* Reports Table */}
      {loading ? (
        <SkeletonTable rows={6} cols={6} />
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[760px] text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-3.5">Target</th>
                  <th className="px-4 py-3.5">Report Reason</th>
                  <th className="px-4 py-3.5">Reported By</th>
                  <th className="px-4 py-3.5">Target Author</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800 text-sm">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400">
                      <ShieldAlert className="w-10 h-10 mx-auto mb-2 opacity-50 text-purple-400" />
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No discussion reports found</p>
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => {
                    const reporterName = report.reporter?.fullName || report.reporter?.name || 'Student';
                    const targetAuthorName = report.targetAuthor?.fullName || report.targetAuthor?.name || 'Author';
                    const targetType = report.targetType || 'discussion';
                    const reason = (report.reason || 'other').replace(/_/g, ' ');
                    const status = report.status || 'pending';

                    const statusStyles = {
                      pending: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300',
                      reviewing: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300',
                      resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300',
                      rejected: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400',
                    }[status] || 'bg-gray-50 text-gray-600';

                    return (
                      <tr key={report._id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase font-mono bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                              {targetType}
                            </span>
                            <span className="text-xs text-gray-500 font-mono">
                              {new Date(report.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="px-2.5 py-1 rounded-md text-xs font-bold capitalize bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-900/50">
                            {reason}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-700 dark:text-gray-300 font-medium">
                          {reporterName}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-900 dark:text-white font-semibold">
                          {targetAuthorName}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize border ${statusStyles}`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <button
                              onClick={() => setSelectedReport(report)}
                              className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 transition inline-flex items-center gap-1"
                              title="Inspect details"
                            >
                              <Eye className="w-3.5 h-3.5" /> Inspect
                            </button>

                            {status === 'pending' && (
                              <button
                                onClick={() => handleStartReview(report._id)}
                                className="px-2.5 py-1 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 hover:bg-blue-100 rounded-lg text-xs font-bold transition"
                              >
                                Review
                              </button>
                            )}

                            {['pending', 'reviewing'].includes(status) && (
                              <button
                                onClick={() => openResolveModal(report)}
                                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                              >
                                Resolve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspect Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full p-6 border border-gray-100 dark:border-gray-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" /> Report Details
              </h3>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl text-xs font-mono space-y-2">
              <p><span className="text-gray-400">Target Type:</span> {selectedReport.targetType}</p>
              <p><span className="text-gray-400">Target ID:</span> {selectedReport.targetId}</p>
              <p><span className="text-gray-400">Reason:</span> {selectedReport.reason}</p>
              <p><span className="text-gray-400">Reporter:</span> {selectedReport.reporter?.fullName || selectedReport.reporter?.name} ({selectedReport.reporter?.email || 'N/A'})</p>
              <p><span className="text-gray-400">Target Author:</span> {selectedReport.targetAuthor?.fullName || selectedReport.targetAuthor?.name} ({selectedReport.targetAuthor?.email || 'N/A'})</p>
              <p><span className="text-gray-400">Description / Note:</span></p>
              <p className="text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700">
                {selectedReport.description || 'No additional note provided by reporter.'}
              </p>
              {selectedReport.resolutionNote && (
                <>
                  <p className="text-gray-400 mt-2">Resolution Note:</p>
                  <p className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    {selectedReport.resolutionNote}
                  </p>
                </>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve / Moderation Action Modal */}
      {resolveModalOpen && activeReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-gray-100 dark:border-gray-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-purple-600" /> Resolve Report
              </h3>
              <button
                onClick={() => setResolveModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Resolution Decision *
                </label>
                <select
                  required
                  value={resolveStatus}
                  onChange={(e) => setResolveStatus(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="resolved">Resolved (Violation Found & Handled)</option>
                  <option value="rejected">Dismissed (No Violation / Invalid Report)</option>
                </select>
              </div>

              {resolveStatus === 'resolved' && (
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Moderation Action *
                  </label>
                  <select
                    required
                    value={moderationAction}
                    onChange={(e) => setModerationAction(e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="hide_content">Hide / Remove Content</option>
                    <option value="delete_content">Permanently Delete Content</option>
                    <option value="warn_user">Warn Target User</option>
                    <option value="ban_user">Suspend / Ban User Account</option>
                    <option value="none">None (Record Only)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Resolution Note (Internal)
                </label>
                <textarea
                  rows={3}
                  placeholder="Record justification or notes on moderation decision..."
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-xs bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  maxLength={1000}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setResolveModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition disabled:opacity-50 inline-flex items-center gap-1.5 shadow-sm"
                >
                  {isProcessing ? 'Processing...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
