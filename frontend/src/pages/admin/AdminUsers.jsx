import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchUsersAnalytics,
  fetchAdminUsersList,
  setUserRole,
  setUserStatus,
  selectAdminUsers,
  selectAdminUsersAnalytics,
  selectAdminUsersLoading,
} from '../../store/slices/admin/usersSlice';
import {
  Users, UserCheck, UserX, Shield, Search, Plus, Check, X, ChevronDown, UserPlus, GraduationCap, UserCog
} from 'lucide-react';
import { register as registerApi } from '../../api/auth.api';
import { SkeletonTable } from '../../components/ui/Spinner';
import AdminLayout from '../../components/admin/AdminLayout';
import toast from 'react-hot-toast';

const ROLE_COLORS = {
  admin:      { bg: 'rgba(108,92,231,0.1)', text: '#6C5CE7', border: 'rgba(108,92,231,0.2)' },
  instructor: { bg: 'rgba(0,184,148,0.1)',  text: '#00856a', border: 'rgba(0,184,148,0.2)' },
  student:    { bg: 'rgba(9,132,227,0.1)',  text: '#0760a8', border: 'rgba(9,132,227,0.2)' },
};

const STATUS_COLORS = {
  active:    { bg: 'rgba(0,184,148,0.1)',  text: '#00856a' },
  inactive:  { bg: 'rgba(148,163,184,0.1)', text: '#6b7280' },
  suspended: { bg: 'rgba(214,48,49,0.1)',   text: '#d63031' },
};

export default function AdminUsers() {
  const dispatch  = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const roleFromUrl = searchParams.get('role') || '';

  const users     = useAppSelector(selectAdminUsers);
  const analytics = useAppSelector(selectAdminUsersAnalytics);
  const loading   = useAppSelector(selectAdminUsersLoading);

  const [search, setSearch]           = useState('');
  const [roleFilter, setRoleFilter]   = useState(roleFromUrl);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm]   = useState({ fullName: '', email: '', password: '', role: 'instructor' });
  const [creating, setCreating]       = useState(false);

  useEffect(() => {
    if (roleFromUrl !== roleFilter) {
      setRoleFilter(roleFromUrl);
    }
  }, [roleFromUrl]);

  useEffect(() => {
    dispatch(fetchUsersAnalytics());
    dispatch(fetchAdminUsersList({ search, role: roleFilter, status: statusFilter }));
  }, [dispatch, search, roleFilter, statusFilter]);

  const handleRoleFilterChange = (newRole) => {
    setRoleFilter(newRole);
    if (newRole) {
      setSearchParams({ role: newRole });
    } else {
      setSearchParams({});
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await dispatch(setUserRole({ userId, role: newRole })).unwrap();
      toast.success('User role updated successfully');
    } catch (err) {
      toast.error(err || 'Failed to update role');
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await dispatch(setUserStatus({ userId, status: newStatus })).unwrap();
      toast.success('User status updated');
    } catch (err) {
      toast.error(err || 'Failed to update status');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!createForm.fullName || !createForm.email || !createForm.password) {
      return toast.error('Please fill in all required fields');
    }
    if (createForm.password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setCreating(true);
    try {
      await registerApi(createForm);
      toast.success(`${createForm.role.charAt(0).toUpperCase() + createForm.role.slice(1)} account created!`);
      setShowCreateModal(false);
      setCreateForm({ fullName: '', email: '', password: '', role: 'instructor' });
      dispatch(fetchUsersAnalytics());
      dispatch(fetchAdminUsersList({ search, role: roleFilter, status: statusFilter }));
    } catch (err) {
      toast.error(err.message || 'Failed to create account');
    } finally {
      setCreating(false);
    }
  };

  const totalUsers        = analytics?.totalUsers         ?? analytics?.overview?.totalUsers        ?? 0;
  const activeUsers       = analytics?.activeUsers        ?? analytics?.statusBreakdown?.active      ?? 0;
  const suspendedUsers    = analytics?.suspendedUsers     ?? analytics?.statusBreakdown?.suspended   ?? 0;
  const instructorsAdmins = (analytics?.roleBreakdown?.instructor ?? 0) + (analytics?.roleBreakdown?.admin ?? 0);

  return (
    <AdminLayout
      title="User Management & Role Delegation"
      subtitle="Manage platform registered users, assign roles (Student, Instructor, Admin), and update access statuses"
      actions={
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-all hover:opacity-90 cursor-pointer shrink-0"
          style={{ background: 'linear-gradient(135deg, #6C5CE7 0%, #5046d4 100%)' }}
        >
          <UserPlus size={15} /> Add User
        </button>
      }
    >
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-5">
        {[
          { icon: <Users className="w-4 h-4 sm:w-5 sm:h-5" />, color: '#6C5CE7', bg: 'rgba(108,92,231,0.1)', label: 'Total Users', val: totalUsers },
          { icon: <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />, color: '#00b894', bg: 'rgba(0,184,148,0.1)', label: 'Active Users', val: activeUsers },
          { icon: <UserX className="w-4 h-4 sm:w-5 sm:h-5" />, color: '#d63031', bg: 'rgba(214,48,49,0.1)', label: 'Suspended', val: suspendedUsers },
          { icon: <Shield className="w-4 h-4 sm:w-5 sm:h-5" />, color: '#0984e3', bg: 'rgba(9,132,227,0.1)', label: 'Instructors/Admins', val: instructorsAdmins },
        ].map((c) => (
          <div key={c.label} className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800 p-3 sm:p-4.5 flex items-center gap-2.5 sm:gap-4 shadow-sm">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: c.bg }}>
              <span style={{ color: c.color }}>{c.icon}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium truncate">{c.label}</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">{c.val.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-3 sm:p-4 flex flex-col sm:flex-row gap-2.5 sm:gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-2 sm:py-2.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          />
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-3 min-w-0 max-w-full">
          <select
            value={roleFilter}
            onChange={(e) => handleRoleFilterChange(e.target.value)}
            className="w-full sm:w-auto min-w-0 max-w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition cursor-pointer truncate"
          >
            <option value="">All Roles</option>
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
            <option value="admin">Admin</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto min-w-0 max-w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition cursor-pointer truncate"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* User Table */}
      {loading ? (
        <SkeletonTable rows={6} cols={5} />
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden w-full max-w-full min-w-0">
          <div className="overflow-x-auto w-full max-w-full">
            <table className="w-full min-w-[620px] text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                  <th className="px-4 sm:px-5 py-3 sm:py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                  <th className="px-4 sm:px-5 py-3 sm:py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                  <th className="px-4 sm:px-5 py-3 sm:py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 sm:px-5 py-3 sm:py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joined</th>
                  <th className="px-4 sm:px-5 py-3 sm:py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800 text-sm">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-400">
                      <Users className="w-10 h-10 mx-auto mb-2 opacity-50 text-purple-400" />
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No users found</p>
                    </td>
                  </tr>
                ) : (
                users.map((u) => {
                  const roleStyle   = ROLE_COLORS[u.role]   || ROLE_COLORS.student;
                  const statusStyle = STATUS_COLORS[u.status || 'active'] || STATUS_COLORS.active;
                  const initials    = u.fullName ? u.fullName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() : 'U';

                  return (
                    <tr key={u._id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
                            style={{ background: 'linear-gradient(135deg, #6C5CE7, #a29bfe)' }}
                          >
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white leading-tight">{u.fullName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          className="text-xs font-bold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none transition-colors"
                          style={{
                            backgroundColor: roleStyle.bg,
                            color: roleStyle.text,
                            borderColor: roleStyle.border,
                          }}
                        >
                          <option value="student">Student</option>
                          <option value="instructor">Instructor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>

                      <td className="px-5 py-4">
                        <select
                          value={u.status || 'active'}
                          onChange={(e) => handleStatusChange(u._id, e.target.value)}
                          className="text-xs font-bold px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none capitalize"
                          style={{
                            backgroundColor: statusStyle.bg,
                            color: statusStyle.text,
                          }}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </td>

                      <td className="px-5 py-4 text-xs text-gray-500 dark:text-gray-400">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleStatusChange(u._id, u.status === 'suspended' ? 'active' : 'suspended')}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                            u.status === 'suspended'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100'
                              : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 hover:bg-red-100'
                          }`}
                        >
                          {u.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
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

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-gray-100 dark:border-gray-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Create New User</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm((f) => ({ ...f, fullName: e.target.value }))}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={createForm.password}
                  onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Initial Role</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold"
                >
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #6C5CE7 0%, #5046d4 100%)' }}
                >
                  {creating ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
