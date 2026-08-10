import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchUsersAnalytics, fetchAdminUsersList, setUserRole, setUserStatus,
  selectAdminUsers, selectAdminUsersAnalytics, selectAdminUsersLoading,
} from '../../store/slices/admin/usersSlice';
import { register as registerApi } from '../../api/auth.api';
import { Users, Shield, UserX, UserCheck, Search, Plus, UserPlus } from 'lucide-react';
import { SkeletonTable } from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const dispatch = useAppDispatch();
  const users = useAppSelector(selectAdminUsers);
  const analytics = useAppSelector(selectAdminUsersAnalytics);
  const loading = useAppSelector(selectAdminUsersLoading);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Create User / Instructor Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'instructor',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    dispatch(fetchUsersAnalytics());
    dispatch(fetchAdminUsersList({ search, role: roleFilter, status: statusFilter }));
  }, [dispatch, search, roleFilter, statusFilter]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await dispatch(setUserRole({ userId, role: newRole })).unwrap();
      toast.success('User role updated');
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
      toast.success(`${createForm.role.toUpperCase()} account created successfully!`);
      setShowCreateModal(false);
      setCreateForm({ fullName: '', email: '', password: '', role: 'instructor' });
      dispatch(fetchUsersAnalytics());
      dispatch(fetchAdminUsersList({ search, role: roleFilter, status: statusFilter }));
    } catch (err) {
      toast.error(err.message || 'Failed to create user account');
    } finally {
      setCreating(false);
    }
  };

  const totalUsers = analytics?.totalUsers ?? analytics?.overview?.totalUsers ?? 0;
  const activeUsers = analytics?.activeUsers ?? analytics?.statusBreakdown?.active ?? 0;
  const suspendedUsers = analytics?.suspendedUsers ?? analytics?.statusBreakdown?.suspended ?? 0;
  const instructorsAndAdmins = (analytics?.roleBreakdown?.instructor ?? 0) + (analytics?.roleBreakdown?.admin ?? 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management (Admin)</h1>
          <p className="text-sm text-gray-500">Manage user roles, status, and system access</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition shadow-sm"
        >
          <UserPlus className="w-4 h-4" /> Create Instructor / User
        </button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Users className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Total Users</p>
            <p className="text-xl font-bold text-gray-900">{totalUsers}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg"><UserCheck className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Active Users</p>
            <p className="text-xl font-bold text-gray-900">{activeUsers}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg"><UserX className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Suspended Users</p>
            <p className="text-xl font-bold text-gray-900">{suspendedUsers}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><Shield className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Instructors / Admins</p>
            <p className="text-xl font-bold text-gray-900">{instructorsAndAdmins}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Roles</option>
          <option value="student">Student</option>
          <option value="instructor">Instructor</option>
          <option value="admin">Admin</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonTable rows={6} cols={4} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {users.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-500">No users found</td></tr>
              ) : (
                users.map((u) => {
                  const name = u.fullName || u.name || 'User';
                  const email = u.email || '';
                  const role = u.role || 'student';
                  const status = u.status || (u.isActive === false ? 'inactive' : 'active');

                  return (
                    <tr key={u._id} className="hover:bg-gray-50/50">
                      <td className="p-4">
                        <div className="font-semibold text-gray-900">{name}</div>
                        <div className="text-xs text-gray-500">{email}</div>
                      </td>
                      <td className="p-4">
                        <select
                          value={role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          className={`border rounded px-2.5 py-1 text-xs font-semibold bg-white ${
                            role === 'admin' ? 'border-purple-300 text-purple-700 bg-purple-50/50' :
                            role === 'instructor' ? 'border-blue-300 text-blue-700 bg-blue-50/50' : 'border-gray-200 text-gray-700'
                          }`}
                        >
                          <option value="student">Student</option>
                          <option value="instructor">Instructor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                          status === 'active' ? 'bg-green-100 text-green-700' :
                          status === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <select
                          value={status}
                          onChange={(e) => handleStatusChange(u._id, e.target.value)}
                          className="border border-gray-200 rounded px-2 py-1 text-xs font-medium bg-white"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="suspended">Suspend</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Instructor / User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" /> Create Instructor / User Account
              </h2>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Account Role *</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                >
                  <option value="instructor">Instructor (Create & Publish Courses)</option>
                  <option value="student">Student (Learn & Enroll)</option>
                  <option value="admin">Admin (System Manager)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Instructor Name"
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm((f) => ({ ...f, fullName: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="instructor@vertexportal.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={createForm.password}
                  onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg shadow-sm"
                >
                  {creating ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
