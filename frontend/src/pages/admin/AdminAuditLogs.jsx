import React, { useEffect, useState, useRef, useCallback } from 'react';
import { getAuditLogs } from '../../api/admin.api';
import {
  ShieldAlert, Search, Activity, User, Clock, FileText, Eye,
  RefreshCw, Radio, Globe, Laptop, ShieldCheck, CheckCircle2, X
} from 'lucide-react';
import { SkeletonTable } from '../../components/ui/Spinner';
import AdminLayout from '../../components/admin/AdminLayout';
import CustomSelect from '../../components/ui/CustomSelect';
import { useAdminGuard } from '../../hooks/useAdminGuard';
import { useInactivityLogout } from '../../hooks/useInactivityLogout';
import toast from 'react-hot-toast';

export default function AdminAuditLogs() {
  // Layer 7: Server-side admin verification | Layer 9: Inactivity timeout
  useAdminGuard();
  useInactivityLogout();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [isLive, setIsLive] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const pollIntervalRef = useRef(null);

  const fetchLogs = useCallback(async (showFullLoader = false) => {
    if (showFullLoader) setLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await getAuditLogs({ search, action: actionFilter, limit: 50 });
      const logData = res.data.auditLogs || res.data.logs || res.data.data?.auditLogs || res.data.data || [];
      setLogs(Array.isArray(logData) ? logData : []);
      setLastUpdated(new Date());
    } catch (err) {
      if (showFullLoader) {
        toast.error(err.response?.data?.message || 'Failed to fetch audit logs');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [search, actionFilter]);

  // Initial load & search/filter change
  useEffect(() => {
    fetchLogs(true);
  }, [fetchLogs]);

  // Live Auto-Polling every 5 seconds when isLive is ON
  useEffect(() => {
    if (!isLive) {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      return;
    }

    pollIntervalRef.current = setInterval(() => {
      fetchLogs(false);
    }, 5000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isLive, fetchLogs]);

  const totalLogs = logs.length;
  const userActions = logs.filter(l => (l.action || l.resourceType || '').toLowerCase().includes('user') || (l.action || '').toLowerCase().includes('student')).length;
  const courseActions = logs.filter(l => (l.action || l.resourceType || '').toLowerCase().includes('course')).length;
  const securityActions = logs.filter(l => (l.action || '').toLowerCase().includes('status') || (l.action || '').toLowerCase().includes('delete') || (l.action || '').toLowerCase().includes('role')).length;

  return (
    <AdminLayout
      title="Admin Audit & Activity Logs"
      subtitle="Real-time live audit trail of administrative actions, mutations, and security events"
    >
      {/* Analytics Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-5">
        <div className="bg-white dark:bg-gray-900 p-3 sm:p-4.5 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs flex items-center gap-2.5 sm:gap-4">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium truncate">Total Recorded</p>
            <p className="text-lg sm:text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">{totalLogs}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-3 sm:p-4.5 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs flex items-center gap-2.5 sm:gap-4">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium truncate">User & Student Ops</p>
            <p className="text-lg sm:text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">{userActions}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-3 sm:p-4.5 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs flex items-center gap-2.5 sm:gap-4">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium truncate">Course & Content</p>
            <p className="text-lg sm:text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">{courseActions}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-3 sm:p-4.5 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs flex items-center gap-2.5 sm:gap-4">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium truncate">Security Events</p>
            <p className="text-lg sm:text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">{securityActions}</p>
          </div>
        </div>
      </div>

      {/* Live Status & Filter Bar */}
      <div className="bg-white dark:bg-gray-900 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs mb-5 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-1 w-full md:w-auto items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by action, performer, IP, resource..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            />
          </div>
          <div className="w-44 sm:w-56 shrink-0">
            <CustomSelect
              value={actionFilter}
              onChange={(val) => setActionFilter(val)}
              options={[
                { value: '', label: 'All Operations' },
                { value: 'user', label: 'User Operations' },
                { value: 'student', label: 'Student Operations' },
                { value: 'course', label: 'Course Actions' },
                { value: 'coupon', label: 'Coupons & Promos' },
                { value: 'certificate', label: 'Certificates' },
                { value: 'status', label: 'Status Changes' },
              ]}
              placeholder="All Operations"
            />
          </div>
        </div>

        {/* Live Controls */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end shrink-0">
          <button
            onClick={() => setIsLive((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
              isLive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
            {isLive ? 'Live Stream (5s)' : 'Live Paused'}
          </button>

          <button
            onClick={() => fetchLogs(false)}
            disabled={isRefreshing}
            className="p-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 transition"
            title="Refresh now"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-purple-600' : ''}`} />
          </button>

          <span className="text-[11px] text-gray-400 hidden lg:inline-block font-mono">
            {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Audit Log Table */}
      {loading ? (
        <SkeletonTable rows={8} cols={6} />
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs overflow-hidden w-full max-w-full min-w-0">
          <div className="overflow-x-auto w-full max-w-full">
            <table className="w-full min-w-[700px] text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-3.5">Timestamp</th>
                  <th className="px-4 py-3.5">Performer (Actor)</th>
                  <th className="px-4 py-3.5">Action Event</th>
                  <th className="px-4 py-3.5">Resource</th>
                  <th className="px-4 py-3.5">Client IP</th>
                  <th className="px-4 py-3.5 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800 text-sm">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400">
                      <ShieldAlert className="w-10 h-10 mx-auto mb-2 opacity-50 text-purple-400" />
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No audit log entries found</p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const actorName = log.actor?.fullName || log.admin?.fullName || log.user?.fullName || log.performer || 'Admin User';
                    const actorEmail = log.actor?.email || log.admin?.email || log.user?.email || '';
                    const action = log.action || log.event || 'Action';
                    const resource = log.resourceType || log.target || 'System';
                    const ip = log.ipAddress || '127.0.0.1';
                    const dateStr = log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Just now';

                    return (
                      <tr key={log._id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-3.5 text-xs font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {dateStr}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm">{actorName}</p>
                          {actorEmail && <p className="text-[11px] text-gray-400">{actorEmail}</p>}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="px-2.5 py-1 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded-md text-xs font-bold font-mono">
                            {action}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-600 dark:text-gray-400 font-mono font-medium">
                          {resource}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-500 dark:text-gray-400 font-mono">
                          <span className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                            <Globe className="w-3 h-3 text-gray-400" />
                            {ip}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="px-3 py-1.5 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> Details
                          </button>
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

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-xl w-full p-6 border border-gray-100 dark:border-gray-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Audit Event Details</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/80 p-4 rounded-xl text-xs font-mono space-y-2.5 overflow-x-auto">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-400">Action:</span>
                <span className="col-span-2 text-purple-600 dark:text-purple-400 font-bold">{selectedLog.action}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-400">Performer:</span>
                <span className="col-span-2 text-gray-900 dark:text-white">
                  {selectedLog.actor?.fullName || 'Admin'} ({selectedLog.actor?.email || 'N/A'})
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-400">Resource:</span>
                <span className="col-span-2 text-gray-800 dark:text-gray-200">{selectedLog.resourceType} (ID: {selectedLog.resourceId || 'N/A'})</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-400">Client IP:</span>
                <span className="col-span-2 text-gray-800 dark:text-gray-200">{selectedLog.ipAddress || '127.0.0.1'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-400">User-Agent:</span>
                <span className="col-span-2 text-gray-600 dark:text-gray-300 break-all text-[11px]">{selectedLog.userAgent || 'Browser Client'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-400">Timestamp:</span>
                <span className="col-span-2 text-gray-800 dark:text-gray-200">{new Date(selectedLog.createdAt).toUTCString()}</span>
              </div>

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-gray-400 mb-1">Metadata Snapshot:</p>
                  <pre className="p-2 bg-gray-100 dark:bg-gray-900 rounded text-[11px] overflow-x-auto text-emerald-600 dark:text-emerald-400">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
