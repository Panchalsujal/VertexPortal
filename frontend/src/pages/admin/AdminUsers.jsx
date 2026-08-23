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
  Users, UserCheck, UserX, Shield, Search, UserPlus, X
} from 'lucide-react';
import { register as registerApi } from '../../api/auth.api';
import { SkeletonTable } from '../../components/ui/Spinner';
import AdminLayout from '../../components/admin/AdminLayout';
import toast from 'react-hot-toast';

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

  const totalUsers        = analytics?.overview?.totalUsers ?? analytics?.totalUsers ?? 0;
  const activeUsers       = analytics?.overview?.activeUsers ?? analytics?.activeUsers ?? 0;
  const suspendedUsers    = analytics?.overview?.suspendedUsers ?? analytics?.suspendedUsers ?? 0;
  const instructorsAdmins = (analytics?.overview?.instructors ?? 0) + (analytics?.overview?.admins ?? 0);

  return (
    <AdminLayout
      title="User Management"
      subtitle="Manage registered users, assign roles, and control access"
      actions={
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium shadow-sm transition-colors shrink-0"
        >
          <UserPlus size={14} /> Add User
        </button>
      }
    >
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Users', val: totalUsers },
          { label: 'Active Users', val: activeUsers },
          { label: 'Suspended', val: suspendedUsers },
          { label: 'Instructors/Admins', val: instructorsAdmins },
        ].map((c) => (
          <div key={c.label} className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 rounded-lg p-5 shadow-sm">
            <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-neutral-400 mb-2">{c.label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none tracking-tight tabular-nums">{c.val.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Filters (Unified Toolbar) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 rounded-lg shadow-sm mb-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-white/10">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-none pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-slate-400 focus:ring-0 focus:outline-none"
          />
        </div>
        <div className="flex flex-row divide-x divide-slate-200 dark:divide-white/10">
          <div className="w-40">
            <select
              value={roleFilter}
              onChange={(e) => handleRoleFilterChange(e.target.value)}
              className="w-full bg-transparent border-none px-4 py-2.5 text-sm text-slate-700 dark:text-neutral-300 focus:ring-0 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="">All Roles</option>
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="w-40">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-transparent border-none px-4 py-2.5 text-sm text-slate-700 dark:text-neutral-300 focus:ring-0 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* User Table */}
      {loading ? (
        <SkeletonTable rows={6} cols={5} />
      ) : (
        <div className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#202020]">
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-sm text-slate-500">
                    No users found matching your criteria
                  </td>
                </tr>
              ) : (
              users.map((u) => {
                const isSuspended = u.status === 'suspended';
                return (
                  <tr key={u._id} className="hover:bg-slate-50/50 dark:hover:bg-[#202020]/30 transition-colors group bg-white dark:bg-[#181818]">
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{u.fullName || 'User'}</span>
                        <span className="text-xs text-slate-500 dark:text-neutral-400">{u.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className="text-xs font-medium px-2 py-1 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-[#202020] text-slate-700 dark:text-neutral-300 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                      >
                        <option value="student">Student</option>
                        <option value="instructor">Instructor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-2.5">
                      <select
                        value={u.status || 'active'}
                        onChange={(e) => handleStatusChange(u._id, e.target.value)}
                        className={`text-xs font-medium px-2 py-1 rounded-md border focus:outline-none cursor-pointer ${
                          isSuspended
                            ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400'
                            : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-500 dark:text-neutral-400 tabular-nums">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => handleStatusChange(u._id, isSuspended ? 'active' : 'suspended')}
                        className={`text-xs font-medium px-3 py-1.5 rounded-md border transition-colors shadow-sm ${
                          isSuspended
                            ? 'bg-white dark:bg-[#202020] border-slate-200 dark:border-white/10 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
                            : 'bg-white dark:bg-[#202020] border-slate-200 dark:border-white/10 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30'
                        }`}
                      >
                        {isSuspended ? 'Restore' : 'Suspend'}
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

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#181818] rounded-xl border border-slate-200 dark:border-white/10 w-full max-w-sm shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">New User</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Jane Doe"
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm((f) => ({ ...f, fullName: e.target.value }))}
                  className="w-full bg-white dark:bg-[#202020] border border-slate-200 dark:border-white/10 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900/50 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  placeholder="jane@example.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full bg-white dark:bg-[#202020] border border-slate-200 dark:border-white/10 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900/50 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={createForm.password}
                  onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full bg-white dark:bg-[#202020] border border-slate-200 dark:border-white/10 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900/50 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1.5">Role</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full bg-white dark:bg-[#202020] border border-slate-200 dark:border-white/10 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900/50 focus:border-purple-500"
                >
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-white/10 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 rounded-md border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-[#202020] transition-colors shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2 rounded-md bg-purple-600 hover:bg-purple-700 text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-50"
                >
                  {creating ? 'Saving...' : 'Save User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
