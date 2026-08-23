import React, { useEffect, useState, useRef, useCallback } from 'react';
import { getAuditLogs } from '../../api/admin.api';
import {
  ShieldAlert, Search, Activity, User, Clock, FileText, Eye,
  RefreshCw, Radio, Globe, Laptop, ShieldCheck, CheckCircle2, X
} from 'lucide-react';
import { SkeletonTable } from '../../components/ui/Spinner';
import AdminLayout from '../../components/admin/AdminLayout';
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-neutral-400 mb-2">Total Recorded</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none tracking-tight tabular-nums">{totalLogs}</p>
        </div>

        <div className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-neutral-400 mb-2">User & Student Ops</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none tracking-tight tabular-nums">{userActions}</p>
        </div>

        <div className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-neutral-400 mb-2">Course & Content</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none tracking-tight tabular-nums">{courseActions}</p>
        </div>

        <div className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-neutral-400 mb-2">Security Events</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none tracking-tight tabular-nums">{securityActions}</p>
        </div>
      </div>

      {/* Live Status & Filter Bar (Unified Toolbar) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 rounded-lg shadow-sm flex-1 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-white/10">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by action, performer, IP, resource..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-none pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-slate-400 focus:ring-0 focus:outline-none"
            />
          </div>
          <div className="w-56 shrink-0">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full bg-transparent border-none px-4 py-2.5 text-sm text-slate-700 dark:text-neutral-300 focus:ring-0 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="">All Operations</option>
              <option value="user">User Operations</option>
              <option value="student">Student Operations</option>
              <option value="course">Course Actions</option>
              <option value="coupon">Coupons & Promos</option>
              <option value="certificate">Certificates</option>
              <option value="status">Status Changes</option>
            </select>
          </div>
        </div>

        {/* Live Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsLive((prev) => !prev)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-2 border ${
              isLive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-[#202020] dark:text-emerald-400 dark:border-white/10'
                : 'bg-white text-slate-600 border-slate-200 dark:bg-[#181818] dark:text-neutral-400 dark:border-white/10'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            {isLive ? 'Live Stream (5s)' : 'Live Paused'}
          </button>

          <button
            onClick={() => fetchLogs(false)}
            disabled={isRefreshing}
            className="p-1.5 bg-white dark:bg-[#181818] hover:bg-slate-50 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 rounded-md text-slate-600 dark:text-neutral-300 transition-colors shadow-sm cursor-pointer"
            title="Refresh now"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-purple-600' : ''}`} />
          </button>

          <span className="text-xs text-slate-400 hidden lg:inline-block font-mono tabular-nums">
            {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Audit Log Table */}
      {loading ? (
        <SkeletonTable rows={8} cols={6} />
      ) : (
        <div className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#202020]">
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Performer (Actor)</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action Event</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Resource</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Client IP</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-sm text-slate-500">
                    No audit log entries found.
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
                    <tr key={log._id} className="hover:bg-slate-50/50 dark:hover:bg-[#202020]/30 transition-colors group bg-white dark:bg-[#181818]">
                      <td className="px-4 py-2.5 text-xs font-mono text-slate-500 dark:text-neutral-400 tabular-nums whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{actorName}</p>
                        {actorEmail && <p className="text-xs text-slate-500 dark:text-neutral-400">{actorEmail}</p>}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 bg-slate-50 dark:bg-[#202020] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-neutral-300 rounded-md text-xs font-semibold font-mono">
                          {action}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-600 dark:text-neutral-300 font-mono">
                        {resource}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-500 dark:text-neutral-400 font-mono tabular-nums">
                        <span className="inline-flex items-center gap-1.5">
                          <Globe className="w-3 h-3 text-slate-400" />
                          {ip}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-3 py-1.5 bg-white dark:bg-[#202020] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-neutral-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-50 dark:hover:bg-[#202020]/50 rounded-md text-xs font-medium transition-colors shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
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
      )}

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#181818] rounded-xl max-w-xl w-full p-6 border border-slate-200 dark:border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Audit Event Details</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-[#202020] border border-slate-200 dark:border-white/10 p-4 rounded-md text-sm font-mono space-y-3 overflow-x-auto">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500 dark:text-neutral-400">Action:</span>
                <span className="col-span-2 text-purple-600 dark:text-purple-400 font-bold">{selectedLog.action}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500 dark:text-neutral-400">Performer:</span>
                <span className="col-span-2 text-gray-900 dark:text-white">
                  {selectedLog.actor?.fullName || 'Admin'} ({selectedLog.actor?.email || 'N/A'})
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500 dark:text-neutral-400">Resource:</span>
                <span className="col-span-2 text-gray-800 dark:text-neutral-300">{selectedLog.resourceType} (ID: {selectedLog.resourceId || 'N/A'})</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500 dark:text-neutral-400">Client IP:</span>
                <span className="col-span-2 text-gray-800 dark:text-neutral-300 tabular-nums">{selectedLog.ipAddress || '127.0.0.1'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500 dark:text-neutral-400">User-Agent:</span>
                <span className="col-span-2 text-slate-600 dark:text-neutral-400 break-all text-xs">{selectedLog.userAgent || 'Browser Client'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500 dark:text-neutral-400">Timestamp:</span>
                <span className="col-span-2 text-gray-800 dark:text-neutral-300 tabular-nums">{new Date(selectedLog.createdAt).toUTCString()}</span>
              </div>

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div className="pt-3 mt-3 border-t border-slate-200 dark:border-white/10">
                  <p className="text-slate-500 dark:text-neutral-400 mb-2">Metadata Snapshot:</p>
                  <pre className="p-3 bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded text-xs overflow-x-auto text-emerald-600 dark:text-emerald-400">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-white dark:bg-[#202020] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-white/5 rounded-md text-sm font-medium transition shadow-sm cursor-pointer"
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
