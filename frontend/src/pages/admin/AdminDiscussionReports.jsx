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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-neutral-400 mb-2">Pending Review</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none tracking-tight tabular-nums">{pendingCount}</p>
        </div>

        <div className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-neutral-400 mb-2">Under Review</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none tracking-tight tabular-nums">{reviewingCount}</p>
        </div>

        <div className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-neutral-400 mb-2">Resolved</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none tracking-tight tabular-nums">{resolvedCount}</p>
        </div>

        <div className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-neutral-400 mb-2">Total Reports</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none tracking-tight tabular-nums">{totalCount}</p>
        </div>
      </div>

      {/* Filter & Search Bar (Unified Toolbar) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 rounded-lg shadow-sm flex-1 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-white/10">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reports by user, reason, note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-none pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-slate-400 focus:ring-0 focus:outline-none"
            />
          </div>
          <div className="w-44 shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-transparent border-none px-4 py-2.5 text-sm text-slate-700 dark:text-neutral-300 focus:ring-0 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="reviewing">Reviewing</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Dismissed</option>
            </select>
          </div>
          <div className="w-48 shrink-0">
            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className="w-full bg-transparent border-none px-4 py-2.5 text-sm text-slate-700 dark:text-neutral-300 focus:ring-0 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="">All Reasons</option>
              <option value="spam">Spam</option>
              <option value="harassment">Harassment</option>
              <option value="abusive_language">Abusive Language</option>
              <option value="inappropriate_content">Inappropriate Content</option>
              <option value="misinformation">Misinformation</option>
              <option value="plagiarism">Plagiarism</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => fetchReports(false)}
          disabled={isRefreshing}
          className="p-1.5 bg-white dark:bg-[#181818] hover:bg-slate-50 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 rounded-md text-slate-600 dark:text-neutral-300 transition-colors shadow-sm shrink-0 cursor-pointer"
          title="Refresh reports"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-purple-600' : ''}`} />
        </button>
      </div>

      {/* Reports Table */}
      {loading ? (
        <SkeletonTable rows={6} cols={6} />
      ) : (
        <div className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#202020]">
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Target</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Report Reason</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reported By</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Target Author</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-sm text-slate-500">
                    No discussion reports found.
                  </td>
                </tr>
              ) : (
                reports.map((report) => {
                  const reporterName = report.reporter?.fullName || report.reporter?.name || 'Student';
                  const targetAuthorName = report.targetAuthor?.fullName || report.targetAuthor?.name || 'Author';
                  const targetType = report.targetType || 'discussion';
                  const reason = (report.reason || 'other').replace(/_/g, ' ');
                  const status = report.status || 'pending';

                  const getStatusDetails = (s) => {
                    switch (s) {
                      case 'pending': return { color: 'bg-amber-500', label: 'Pending' };
                      case 'reviewing': return { color: 'bg-blue-500', label: 'Reviewing' };
                      case 'resolved': return { color: 'bg-emerald-500', label: 'Resolved' };
                      case 'rejected': return { color: 'bg-slate-400', label: 'Dismissed' };
                      default: return { color: 'bg-slate-400', label: 'Unknown' };
                    }
                  };
                  
                  const statusDetails = getStatusDetails(status);

                  return (
                    <tr key={report._id} className="hover:bg-slate-50/50 dark:hover:bg-[#202020]/30 transition-colors group bg-white dark:bg-[#181818]">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-slate-100 dark:bg-[#202020] text-slate-700 dark:text-neutral-300">
                            {targetType}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-neutral-400 font-mono tabular-nums">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold capitalize bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
                          {reason}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-sm text-slate-700 dark:text-neutral-300 font-medium">
                        {reporterName}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-gray-900 dark:text-white font-medium">
                        {targetAuthorName}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${statusDetails.color}`} />
                          <span className="text-sm text-gray-900 dark:text-white capitalize">{statusDetails.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="inline-flex items-center gap-2 justify-end">
                          <button
                            onClick={() => setSelectedReport(report)}
                            className="px-3 py-1.5 bg-white dark:bg-[#202020] hover:bg-slate-50 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 rounded-md text-xs font-medium text-slate-700 dark:text-neutral-300 transition-colors shadow-sm inline-flex items-center gap-1.5"
                            title="Inspect details"
                          >
                            <Eye className="w-3.5 h-3.5" /> Inspect
                          </button>

                          {status === 'pending' && (
                            <button
                              onClick={() => handleStartReview(report._id)}
                              className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-md text-xs font-semibold transition-colors"
                            >
                              Review
                            </button>
                          )}

                          {['pending', 'reviewing'].includes(status) && (
                            <button
                              onClick={() => openResolveModal(report)}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-xs font-semibold transition-colors shadow-sm"
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
      )}

      {/* Inspect Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#181818] rounded-xl max-w-lg w-full p-6 border border-slate-200 dark:border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" /> Report Details
              </h3>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-[#202020] border border-slate-200 dark:border-white/10 p-4 rounded-md text-sm font-mono space-y-3">
              <p><span className="text-slate-500 dark:text-neutral-400">Target Type:</span> {selectedReport.targetType}</p>
              <p><span className="text-slate-500 dark:text-neutral-400">Target ID:</span> {selectedReport.targetId}</p>
              <p><span className="text-slate-500 dark:text-neutral-400">Reason:</span> {selectedReport.reason}</p>
              <p><span className="text-slate-500 dark:text-neutral-400">Reporter:</span> {selectedReport.reporter?.fullName || selectedReport.reporter?.name} ({selectedReport.reporter?.email || 'N/A'})</p>
              <p><span className="text-slate-500 dark:text-neutral-400">Target Author:</span> {selectedReport.targetAuthor?.fullName || selectedReport.targetAuthor?.name} ({selectedReport.targetAuthor?.email || 'N/A'})</p>
              <p><span className="text-slate-500 dark:text-neutral-400">Description / Note:</span></p>
              <p className="text-gray-800 dark:text-neutral-300 bg-white dark:bg-[#111111] p-3 rounded-md border border-slate-200 dark:border-white/10 text-xs">
                {selectedReport.description || 'No additional note provided by reporter.'}
              </p>
              {selectedReport.resolutionNote && (
                <>
                  <p className="text-slate-500 dark:text-neutral-400 mt-4">Resolution Note:</p>
                  <p className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-md border border-emerald-200 dark:border-emerald-800/50 text-xs">
                    {selectedReport.resolutionNote}
                  </p>
                </>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 bg-white dark:bg-[#202020] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-white/5 rounded-md text-sm font-medium transition shadow-sm cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve / Moderation Action Modal */}
      {resolveModalOpen && activeReport && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#181818] rounded-xl max-w-md w-full p-6 border border-slate-200 dark:border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-purple-600 dark:text-purple-400" /> Resolve Report
              </h3>
              <button
                onClick={() => setResolveModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block font-medium text-slate-700 dark:text-neutral-300 mb-1.5">
                  Resolution Decision *
                </label>
                <select
                  required
                  value={resolveStatus}
                  onChange={(e) => setResolveStatus(e.target.value)}
                  className="w-full border border-slate-200 dark:border-white/10 rounded-md px-3 py-2 text-sm bg-white dark:bg-[#111111] text-gray-900 dark:text-white focus:ring-1 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="resolved">Resolved (Violation Found & Handled)</option>
                  <option value="rejected">Dismissed (No Violation / Invalid Report)</option>
                </select>
              </div>

              {resolveStatus === 'resolved' && (
                <div>
                  <label className="block font-medium text-slate-700 dark:text-neutral-300 mb-1.5">
                    Moderation Action *
                  </label>
                  <select
                    required
                    value={moderationAction}
                    onChange={(e) => setModerationAction(e.target.value)}
                    className="w-full border border-slate-200 dark:border-white/10 rounded-md px-3 py-2 text-sm bg-white dark:bg-[#111111] text-gray-900 dark:text-white focus:ring-1 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="hide_content">Hide / Remove Content</option>
                    <option value="delete_content">Permanently Delete Content</option>
                    <option value="lock_discussion">Lock Discussion Thread</option>
                    <option value="none">None (Record Only)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700 dark:text-neutral-300 mb-1.5">
                  Resolution Note (Internal)
                </label>
                <textarea
                  rows={3}
                  placeholder="Record justification or notes on moderation decision..."
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  className="w-full border border-slate-200 dark:border-white/10 rounded-md p-3 text-sm bg-white dark:bg-[#111111] text-gray-900 dark:text-white focus:ring-1 focus:ring-purple-500 focus:outline-none placeholder:text-slate-400"
                  maxLength={1000}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setResolveModalOpen(false)}
                  className="px-4 py-2 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-[#202020] text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-white/5 font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium transition disabled:opacity-50 inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
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
