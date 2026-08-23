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
import CustomSelect from '../../components/ui/CustomSelect';
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

  const totalUsers        = analytics?.totalUsers         ?? analytics?.overview?.totalUsers        ?? 0;
  const activeUsers       = analytics?.activeUsers        ?? analytics?.statusBreakdown?.active      ?? 0;
  const suspendedUsers    = analytics?.suspendedUsers     ?? analytics?.statusBreakdown?.suspended   ?? 0;
  const instructorsAdmins = (analytics?.roleBreakdown?.instructor ?? 0) + (analytics?.roleBreakdown?.admin ?? 0);

  return (
    <AdminLayout
      title="User Management"
      subtitle="Manage registered users, assign roles, and control access"
      actions={
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 text-[13px] font-semibold transition-colors shrink-0"
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
          <div key={c.label} className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-sm p-4">
            <p className="text-[13px] font-medium text-gray-500 dark:text-neutral-400 mb-2">{c.label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none tracking-tight">{c.val.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-sm pl-9 pr-3 py-1.5 text-[13px] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-gray-400 dark:focus:border-neutral-600 transition-colors"
          />
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3 min-w-0">
          <div className="w-full sm:w-36 min-w-0">
            <CustomSelect
              size="sm"
              value={roleFilter}
              onChange={(val) => handleRoleFilterChange(val)}
              options={[
                { value: '', label: 'All Roles' },
                { value: 'student', label: 'Student' },
                { value: 'instructor', label: 'Instructor' },
                { value: 'admin', label: 'Admin' },
              ]}
              placeholder="All Roles"
            />
          </div>
          <div className="w-full sm:w-36 min-w-0">
            <CustomSelect
              size="sm"
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'suspended', label: 'Suspended' },
              ]}
              placeholder="All Statuses"
            />
          </div>
        </div>
      </div>

      {/* User Table */}
      {loading ? (
        <SkeletonTable rows={6} cols={5} />
      ) : (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-sm overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-200 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-800/30">
                <th className="px-4 py-3 text-[12px] font-semibold text-gray-600 dark:text-neutral-400 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-[12px] font-semibold text-gray-600 dark:text-neutral-400 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-[12px] font-semibold text-gray-600 dark:text-neutral-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-[12px] font-semibold text-gray-600 dark:text-neutral-400 uppercase tracking-wider">Joined</th>
                <th className="px-4 py-3 text-[12px] font-semibold text-gray-600 dark:text-neutral-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800/80">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-[13px] text-gray-500">
                    No users found matching your criteria
                  </td>
                </tr>
              ) : (
              users.map((u) => {
                const isSuspended = u.status === 'suspended';
                return (
                  <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-[13px] font-semibold text-gray-900 dark:text-white leading-tight">{u.fullName || 'User'}</span>
                        <span className="text-[11px] text-gray-500 dark:text-neutral-400">{u.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className="text-[11px] font-semibold px-2 py-1 rounded-sm border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-700 dark:text-neutral-300 focus:outline-none focus:border-gray-400 cursor-pointer"
                      >
                        <option value="student">Student</option>
                        <option value="instructor">Instructor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.status || 'active'}
                        onChange={(e) => handleStatusChange(u._id, e.target.value)}
                        className={`text-[11px] font-semibold px-2 py-1 rounded-sm border focus:outline-none cursor-pointer ${
                          isSuspended
                            ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400'
                            : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-gray-500 dark:text-neutral-400 font-mono">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleStatusChange(u._id, isSuspended ? 'active' : 'suspended')}
                        className={`text-[11px] font-semibold px-2 py-1 rounded-sm border transition-colors ${
                          isSuspended
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-400 dark:hover:bg-emerald-900/50'
                            : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-900/50'
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-md border border-gray-200 dark:border-neutral-800 w-full max-w-sm shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between">
              <h3 className="text-[14px] font-bold text-gray-900 dark:text-white">New User</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-5 space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 dark:text-neutral-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Jane Doe"
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm((f) => ({ ...f, fullName: e.target.value }))}
                  className="w-full bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-sm px-3 py-2 text-[13px] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-gray-500"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 dark:text-neutral-300 mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  placeholder="jane@example.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-sm px-3 py-2 text-[13px] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-gray-500"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 dark:text-neutral-300 mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={createForm.password}
                  onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-sm px-3 py-2 text-[13px] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-gray-500"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 dark:text-neutral-300 mb-1.5">Role</label>
                <CustomSelect
                  value={createForm.role}
                  onChange={(val) => setCreateForm((f) => ({ ...f, role: val }))}
                  options={[
                    { value: 'student', label: 'Student' },
                    { value: 'instructor', label: 'Instructor' },
                    { value: 'admin', label: 'Admin' },
                  ]}
                  placeholder="Select Role"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 rounded-sm border border-gray-300 dark:border-neutral-700 text-[13px] font-semibold text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2 rounded-sm bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-[13px] font-semibold text-white dark:text-gray-900 transition-colors disabled:opacity-50"
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
