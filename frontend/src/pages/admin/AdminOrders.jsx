import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchOrderAnalytics, fetchAdminOrders, cancelOrder, refundOrder,
  selectAdminOrders, selectAdminOrdersAnalytics, selectAdminOrdersLoading,
} from '../../store/slices/admin/ordersSlice';
import { ShoppingBag, DollarSign, Clock, RefreshCw, Search, CheckCircle } from 'lucide-react';
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Order Management (Admin)</h1>
        <p className="text-sm text-gray-500">Track and manage platform sales and transactions</p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><ShoppingBag className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Total Orders</p>
            <p className="text-xl font-bold text-gray-900">{overview.totalOrders ?? analytics?.totalOrders ?? 0}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg"><DollarSign className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Total Revenue</p>
            <p className="text-xl font-bold text-gray-900">₹{(revenue.totalRevenue ?? analytics?.totalRevenue ?? 0).toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><Clock className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Pending Orders</p>
            <p className="text-xl font-bold text-gray-900">{overview.pendingOrders ?? analytics?.pendingOrders ?? 0}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><CheckCircle className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Paid Orders</p>
            <p className="text-xl font-bold text-gray-900">{overview.paidOrders ?? analytics?.paidOrders ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by Order ID or User..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="p-4">Order ID</th>
              <th className="p-4">Student</th>
              <th className="p-4">Courses</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">Loading orders...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">No orders found</td></tr>
            ) : (
              orders.map((o) => {
                const status = o.orderStatus || o.paymentStatus || o.status || 'pending';
                const studentName = o.student?.fullName || o.user?.name || 'Student';
                const studentEmail = o.student?.email || o.user?.email || '';
                const courseTitle = o.courses?.[0]?.title || o.course?.title || 'Course';

                return (
                  <tr key={o._id} className="hover:bg-gray-50/50">
                    <td className="p-4 font-semibold text-gray-900 font-mono text-xs">{o._id}</td>
                    <td className="p-4">
                      <div className="font-semibold text-gray-900">{studentName}</div>
                      <div className="text-xs text-gray-500">{studentEmail}</div>
                    </td>
                    <td className="p-4 text-xs font-medium text-gray-700 max-w-[200px] truncate">
                      {courseTitle} {o.courses?.length > 1 ? `+${o.courses.length - 1} more` : ''}
                    </td>
                    <td className="p-4 font-bold text-gray-900">₹{o.totalAmount ?? o.amount ?? 0}</td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                        status === 'paid' || status === 'completed' ? 'bg-green-100 text-green-700' :
                        status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        status === 'refunded' ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {(status === 'paid' || status === 'completed') && (
                        <button
                          onClick={() => handleRefund(o._id)}
                          className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium px-2.5 py-1 rounded"
                        >
                          Refund
                        </button>
                      )}
                      {status === 'pending' && (
                        <button
                          onClick={() => handleCancel(o._id)}
                          className="text-xs bg-red-50 hover:bg-red-100 text-red-700 font-medium px-2.5 py-1 rounded"
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
    </div>
  );
}
