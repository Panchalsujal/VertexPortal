import React, { useEffect, useState } from 'react';
import { getAuditLogs } from '../../api/admin.api';
import { ShieldAlert, Search, Activity, User, Clock, FileText, Eye } from 'lucide-react';
import { SkeletonTable } from '../../components/ui/Spinner';
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-blue-600 dark:text-blue-400" /> Admin Audit Logs
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Track and inspect system-wide administrative actions and security events</p>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg"><Activity className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Audit Events</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{totalLogs}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-lg"><User className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">User Operations</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{userActions}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 rounded-lg"><FileText className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Course Operations</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{courseActions}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg"><Clock className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Coupon & Promos</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{couponActions}</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search audit logs by admin name, action, or resource..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Actions & Resources</option>
          <option value="user">User Management</option>
          <option value="course">Course Actions</option>
          <option value="coupon">Coupons & Promos</option>
          <option value="certificate">Certificates</option>
          <option value="order">Orders & Payments</option>
        </select>
      </div>

      {/* Audit Logs Table */}
      {loading ? (
        <SkeletonTable rows={8} cols={6} />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-800/60 border-b border-gray-200 dark:border-slate-800 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="p-4">Admin User</th>
                <th className="p-4">Action</th>
                <th className="p-4">Resource</th>
                <th className="p-4">Description</th>
                <th className="p-4">Timestamp</th>
                <th className="p-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60 text-sm text-gray-900 dark:text-white">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No audit log records found matching search filters
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const adminName = log.actor?.fullName || log.admin?.fullName || log.adminName || 'System Admin';
                  const adminEmail = log.actor?.email || log.admin?.email || log.adminEmail || 'admin@vertexportal.com';
                  const actionName = log.action || log.event || 'System Action';
                  const resource = log.resourceType || log.targetType || 'System';
                  const description = log.description || log.details?.description || 'Administrative Action';
                  const timeStr = log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Recent';

                  return (
                    <tr key={log._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition">
                      <td className="p-4">
                        <div className="font-semibold text-gray-900 dark:text-white">{adminName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{adminEmail}</div>
                      </td>
                      <td className="p-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 uppercase tracking-wide">
                          {actionName.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-xs text-gray-600 dark:text-gray-300 capitalize">
                        {resource}
                      </td>
                      <td className="p-4 text-xs text-gray-700 dark:text-gray-300 max-w-xs truncate">
                        {description}
                      </td>
                      <td className="p-4 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {timeStr}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
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

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-6 border border-gray-200 dark:border-slate-800 shadow-xl space-y-4 text-gray-900 dark:text-white">
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Audit Log Event Payload
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-gray-500 dark:text-gray-400 font-medium">Action Event:</span>
                <p className="font-bold text-sm text-blue-600 dark:text-blue-400">{selectedLog.action || selectedLog.event}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400 font-medium">Performed By:</span>
                <p className="font-medium">{selectedLog.actor?.fullName || selectedLog.admin?.fullName || 'Admin User'} ({selectedLog.actor?.email || 'admin@vertexportal.com'})</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400 font-medium">Resource Type:</span>
                <p className="font-mono capitalize">{selectedLog.resourceType || 'System'}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400 font-medium">Description:</span>
                <p className="text-gray-800 dark:text-gray-200">{selectedLog.description || 'No description provided'}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400 font-medium">Timestamp:</span>
                <p className="font-mono">{new Date(selectedLog.createdAt).toString()}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400 font-medium">Raw Metadata Payload (JSON):</span>
                <pre className="mt-1 p-3 bg-gray-50 dark:bg-slate-950 rounded-lg font-mono text-[11px] overflow-x-auto text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-slate-800">
                  {JSON.stringify(selectedLog.metadata || selectedLog.after || selectedLog, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
