import React, { useEffect, useState } from 'react';
import { getAuditLogs } from '../../api/admin.api';
import { ShieldAlert, Search, Activity, User, Clock, FileText, Eye } from 'lucide-react';
import { SkeletonTable } from '../../components/ui/Spinner';
import AdminLayout from '../../components/admin/AdminLayout';
import toast from 'react-hot-toast';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await getAuditLogs({ search, action: actionFilter });
      const logData = res.data.auditLogs || res.data.logs || res.data.data?.auditLogs || res.data.data || [];
      setLogs(Array.isArray(logData) ? logData : []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search, actionFilter]);

  const totalLogs = logs.length;
  const userActions = logs.filter(l => (l.action || l.resourceType || '').toLowerCase().includes('user')).length;
  const courseActions = logs.filter(l => (l.action || l.resourceType || '').toLowerCase().includes('course')).length;
  const couponActions = logs.filter(l => (l.action || l.resourceType || '').toLowerCase().includes('coupon')).length;

  return (
    <AdminLayout
      title="Admin Audit & Activity Logs"
      subtitle="Track and inspect system-wide administrative actions and security events"
    >
      {/* Analytics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Audit Events</p>
            <p className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">{totalLogs}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">User Operations</p>
            <p className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">{userActions}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Course Operations</p>
            <p className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">{courseActions}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Coupon & Promos</p>
            <p className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">{couponActions}</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit logs by admin name, action, or resource..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
        >
          <option value="">All Actions & Resources</option>
          <option value="user">User Management</option>
          <option value="course">Course Actions</option>
          <option value="coupon">Coupons & Promos</option>
          <option value="certificate">Certificates</option>
        </select>
      </div>

      {/* Audit Log Table */}
      {loading ? (
        <SkeletonTable rows={8} cols={5} />
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Admin / Performer</th>
                <th className="px-5 py-3.5">Action</th>
                <th className="px-5 py-3.5">Resource</th>
                <th className="px-5 py-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800 text-sm">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    <ShieldAlert className="w-10 h-10 mx-auto mb-2 opacity-50 text-purple-400" />
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No audit log entries recorded</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const adminName = log.admin?.fullName || log.user?.fullName || log.performer || 'System Admin';
                  const adminEmail = log.admin?.email || log.user?.email || '';
                  const action = log.action || log.event || 'Action';
                  const resource = log.resourceType || log.target || 'System';
                  const dateStr = log.createdAt ? new Date(log.createdAt).toLocaleString() : 'N/A';

                  return (
                    <tr key={log._id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-5 py-4 text-xs font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">{dateStr}</td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900 dark:text-white">{adminName}</p>
                        {adminEmail && <p className="text-xs text-gray-500 dark:text-gray-400">{adminEmail}</p>}
                      </td>
                      <td className="px-5 py-4 font-semibold text-purple-600 dark:text-purple-400">{action}</td>
                      <td className="px-5 py-4 text-xs text-gray-600 dark:text-gray-400 font-mono">{resource}</td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-3 py-1.5 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 hover:bg-purple-100 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Inspect
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full p-6 border border-gray-100 dark:border-gray-800 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Audit Log Details</h3>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl text-xs font-mono overflow-x-auto space-y-2">
              <p><span className="text-gray-400">ID:</span> {selectedLog._id}</p>
              <p><span className="text-gray-400">Action:</span> {selectedLog.action}</p>
              <p><span className="text-gray-400">Resource:</span> {selectedLog.resourceType}</p>
              <p><span className="text-gray-400">IP:</span> {selectedLog.ipAddress || '127.0.0.1'}</p>
              <p><span className="text-gray-400">Timestamp:</span> {new Date(selectedLog.createdAt).toISOString()}</p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition"
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
