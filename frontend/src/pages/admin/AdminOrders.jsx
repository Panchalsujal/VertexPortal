import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchOrderAnalytics, fetchAdminOrders, cancelOrder, refundOrder,
  selectAdminOrders, selectAdminOrdersAnalytics, selectAdminOrdersLoading,
} from '../../store/slices/admin/ordersSlice';
import { ShoppingBag, DollarSign, Clock, RefreshCw, Search, CheckCircle } from 'lucide-react';
import { SkeletonTable } from '../../components/ui/Spinner';
import AdminLayout from '../../components/admin/AdminLayout';
import toast from 'react-hot-toast';

export default function AdminOrders() {
  const dispatch = useAppDispatch();
  const orders = useAppSelector(selectAdminOrders);
  const analytics = useAppSelector(selectAdminOrdersAnalytics);
  const loading = useAppSelector(selectAdminOrdersLoading);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    dispatch(fetchOrderAnalytics());
    dispatch(fetchAdminOrders({ search, status: statusFilter }));
  }, [dispatch, search, statusFilter]);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this order?')) return;
    try {
      await dispatch(cancelOrder(id)).unwrap();
      toast.success('Order cancelled');
    } catch (err) {
      toast.error(err || 'Failed to cancel order');
    }
  };

  const handleRefund = async (id) => {
    if (!window.confirm('Mark order as refunded?')) return;
    try {
      await dispatch(refundOrder(id)).unwrap();
      toast.success('Order marked refunded');
    } catch (err) {
      toast.error(err || 'Failed to mark refund');
    }
  };

  const overview = analytics?.overview || analytics || {};
  const revenue = analytics?.revenue || {};

  return (
    <AdminLayout
      title="Order Management & Transactions"
      subtitle="Track platform sales, view user enrollments, and manage order statuses"
    >
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Orders</p>
            <p className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">{overview.totalOrders ?? analytics?.totalOrders ?? orders.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Revenue</p>
            <p className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">₹{(revenue.totalRevenue ?? analytics?.totalRevenue ?? 0).toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Pending Orders</p>
            <p className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">{overview.pendingOrders ?? analytics?.pendingOrders ?? 0}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Paid Orders</p>
            <p className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">{overview.paidOrders ?? analytics?.paidOrders ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Order ID, User, or Email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
        >
          <option value="">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonTable rows={6} cols={6} />
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="px-5 py-3.5">Order ID</th>
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800 text-sm">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-50 text-purple-400" />
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No orders found</p>
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const userName = o.user?.fullName || o.userName || 'N/A';
                  const userEmail = o.user?.email || '';
                  const status = o.status || 'paid';
                  const dateStr = o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'N/A';

                  return (
                    <tr key={o._id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-5 py-4 font-bold text-purple-600 dark:text-purple-400 font-mono text-xs">{o._id}</td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900 dark:text-white">{userName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{userEmail}</p>
                      </td>
                      <td className="px-5 py-4 font-bold text-gray-900 dark:text-white">₹{o.totalAmount ?? o.amount ?? 0}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                          status === 'paid' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' :
                          status === 'refunded' ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300' :
                          status === 'cancelled' ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full fill-current" />
                          {status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-500 dark:text-gray-400">{dateStr}</td>
                      <td className="px-5 py-4 text-right space-x-2">
                        {status === 'paid' && (
                          <button
                            onClick={() => handleRefund(o._id)}
                            className="text-xs bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 hover:bg-purple-100 font-bold px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Refund
                          </button>
                        )}
                        {status !== 'cancelled' && status !== 'refunded' && (
                          <button
                            onClick={() => handleCancel(o._id)}
                            className="text-xs bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 hover:bg-red-100 font-bold px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
