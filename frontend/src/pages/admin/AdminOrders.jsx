import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchOrderAnalytics, fetchAdminOrders, cancelOrder, refundOrder,
  selectAdminOrders, selectAdminOrdersAnalytics, selectAdminOrdersLoading,
} from '../../store/slices/admin/ordersSlice';
import {
  ShoppingBag, DollarSign, Clock, Search, CheckCircle,
  Eye, X, Copy, Check, BookOpen, User, CreditCard,
  Calendar, ShieldCheck
} from 'lucide-react';
import { SkeletonTable } from '../../components/ui/Spinner';
import AdminLayout from '../../components/admin/AdminLayout';
import CustomSelect from '../../components/ui/CustomSelect';
import toast from 'react-hot-toast';

export default function AdminOrders() {
  const dispatch = useAppDispatch();
  const orders = useAppSelector(selectAdminOrders);
  const analytics = useAppSelector(selectAdminOrdersAnalytics);
  const loading = useAppSelector(selectAdminOrdersLoading);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    dispatch(fetchOrderAnalytics());
    dispatch(fetchAdminOrders({ search, status: statusFilter }));
  }, [dispatch, search, statusFilter]);

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Copied ${fieldName} to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      await dispatch(cancelOrder(id)).unwrap();
      toast.success('Order cancelled successfully');
      if (selectedOrder?._id === id) {
        setSelectedOrder((prev) => prev ? { ...prev, orderStatus: 'cancelled', status: 'cancelled' } : null);
      }
    } catch (err) {
      toast.error(err || 'Failed to cancel order');
    }
  };

  const handleRefund = async (id) => {
    if (!window.confirm('Mark this order as refunded? (Note: External Razorpay refund must be initiated first)')) return;
    try {
      await dispatch(refundOrder(id)).unwrap();
      toast.success('Order marked as refunded');
      if (selectedOrder?._id === id) {
        setSelectedOrder((prev) => prev ? { ...prev, orderStatus: 'refunded', status: 'refunded', paymentStatus: 'refunded' } : null);
      }
    } catch (err) {
      toast.error(err || 'Failed to mark refund');
    }
  };

  const overview = analytics?.overview || analytics || {};
  const revenue = analytics?.revenue || {};

  const getStatusBadge = (status) => {
    const normalized = (status || 'pending').toLowerCase();
    switch (normalized) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Paid
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            Refunded
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Cancelled
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Pending
          </span>
        );
    }
  };

  return (
    <AdminLayout
      title="Order Management & Transactions"
      subtitle="Track platform sales, view user enrollments, and manage order statuses"
    >
      {/* Analytics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-5">
        <div className="bg-white dark:bg-gray-900 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium truncate">Total Orders</p>
            <p className="text-base sm:text-2xl font-extrabold text-gray-900 dark:text-white leading-tight truncate">
              {overview.totalOrders ?? analytics?.totalOrders ?? orders.length}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium truncate">Total Revenue</p>
            <p className="text-base sm:text-2xl font-extrabold text-gray-900 dark:text-white leading-tight truncate">
              ₹{(revenue.totalRevenue ?? analytics?.totalRevenue ?? 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium truncate">Pending Orders</p>
            <p className="text-base sm:text-2xl font-extrabold text-gray-900 dark:text-white leading-tight truncate">
              {overview.pendingOrders ?? analytics?.pendingOrders ?? 0}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium truncate">Paid Orders</p>
            <p className="text-base sm:text-2xl font-extrabold text-gray-900 dark:text-white leading-tight truncate">
              {overview.paidOrders ?? analytics?.paidOrders ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white dark:bg-gray-900 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm mb-5 flex flex-col sm:flex-row gap-2.5 sm:gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Order ID, User, Email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-2 sm:py-2.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          />
        </div>
        <div className="w-full sm:w-44 min-w-0">
          <CustomSelect
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'paid', label: 'Paid' },
              { value: 'pending', label: 'Pending' },
              { value: 'cancelled', label: 'Cancelled' },
              { value: 'refunded', label: 'Refunded' },
              { value: 'failed', label: 'Failed' },
            ]}
            placeholder="All Statuses"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonTable rows={6} cols={7} />
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden w-full max-w-full min-w-0">
          <div className="overflow-x-auto w-full max-w-full">
            <table className="w-full min-w-[700px] text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="px-4 sm:px-5 py-3 sm:py-3.5">Order ID</th>
                  <th className="px-4 sm:px-5 py-3 sm:py-3.5">User</th>
                  <th className="px-4 sm:px-5 py-3 sm:py-3.5">Courses</th>
                  <th className="px-4 sm:px-5 py-3 sm:py-3.5">Amount</th>
                  <th className="px-4 sm:px-5 py-3 sm:py-3.5">Status</th>
                  <th className="px-4 sm:px-5 py-3 sm:py-3.5">Date</th>
                  <th className="px-4 sm:px-5 py-3 sm:py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800 text-sm">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-50 text-purple-400" />
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No orders found</p>
                    <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filter parameters</p>
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const student = o.student || o.user || {};
                  const userName = student.fullName || student.name || o.userName || 'N/A';
                  const userEmail = student.email || o.userEmail || '';
                  const userAvatar = student.avatarUrl || student.avatar;
                  const status = o.orderStatus || o.paymentStatus || o.status || 'pending';
                  const dateStr = o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  }) : 'N/A';
                  const coursesCount = o.courses?.length || 0;
                  const primaryCourseTitle = o.courses?.[0]?.title || 'Enrolled Course';

                  const initials = userName !== 'N/A'
                    ? userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                    : 'U';

                  return (
                    <tr
                      key={o._id}
                      className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
                      onClick={() => setSelectedOrder(o)}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-purple-600 dark:text-purple-400 font-mono text-xs">
                            {o._id?.slice(-8) || o._id}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(o._id, `Order ID (${o._id})`);
                            }}
                            className="text-gray-400 hover:text-purple-600 transition p-1 rounded"
                            title="Copy full Order ID"
                          >
                            {copiedField === `Order ID (${o._id})` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {userAvatar && userAvatar !== 'https://ik.imagekit.io/Sujalpanchal/default.avif' ? (
                            <img
                              src={userAvatar}
                              alt={userName}
                              className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-gray-700 shrink-0"
                            />
                          ) : (
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
                              style={{ background: 'linear-gradient(135deg, #6C5CE7, #a29bfe)' }}
                            >
                              {initials}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">{userName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{userEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 max-w-[200px]">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate" title={primaryCourseTitle}>
                            {primaryCourseTitle}
                          </p>
                        </div>
                        {coursesCount > 1 && (
                          <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300">
                            +{coursesCount - 1} more course{coursesCount > 2 ? 's' : ''}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-gray-900 dark:text-white">
                          ₹{(o.totalAmount ?? o.amount ?? 0).toLocaleString()}
                        </div>
                        {o.discountAmount > 0 && (
                          <div className="text-[11px] text-emerald-600 font-medium line-through">
                            ₹{(o.subtotal || 0).toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {getStatusBadge(status)}
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-500 dark:text-gray-400">
                        {dateStr}
                      </td>
                      <td className="px-5 py-4 text-right space-x-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(o)}
                          className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/40 dark:hover:text-purple-300 font-semibold px-2.5 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
                          title="View Order Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Details
                        </button>
                        {status === 'paid' && (
                          <button
                            type="button"
                            onClick={() => handleRefund(o._id)}
                            className="text-xs bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 hover:bg-purple-100 font-bold px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            Refund
                          </button>
                        )}
                        {status !== 'cancelled' && status !== 'refunded' && status !== 'paid' && (
                          <button
                            type="button"
                            onClick={() => handleCancel(o._id)}
                            className="text-xs bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 hover:bg-red-100 font-bold px-2.5 py-1.5 rounded-lg transition-colors"
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
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-gray-800 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 min-w-0">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2 bg-gradient-to-r from-purple-50/50 to-white dark:from-purple-950/20 dark:to-gray-900 shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shrink-0">
                  <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">Order Details</h2>
                    {getStatusBadge(selectedOrder.orderStatus || selectedOrder.paymentStatus || selectedOrder.status)}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                    <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
                      ID: {selectedOrder._id}
                    </p>
                    <button
                      onClick={() => copyToClipboard(selectedOrder._id, 'Order ID')}
                      className="text-gray-400 hover:text-purple-600 transition shrink-0 cursor-pointer"
                      title="Copy Order ID"
                    >
                      {copiedField === 'Order ID' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 min-w-0 flex-1">
              {/* Customer / Student Information */}
              <div className="bg-gray-50 dark:bg-gray-800/60 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-700/60 min-w-0">
                <p className="text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-purple-500" /> Customer Information
                </p>
                {(() => {
                  const student = selectedOrder.student || selectedOrder.user || {};
                  const userName = student.fullName || student.name || selectedOrder.userName || 'N/A';
                  const userEmail = student.email || selectedOrder.userEmail || 'N/A';
                  const userAvatar = student.avatarUrl || student.avatar;
                  const initials = userName !== 'N/A'
                    ? userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                    : 'U';

                  return (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {userAvatar && userAvatar !== 'https://ik.imagekit.io/Sujalpanchal/default.avif' ? (
                          <img
                            src={userAvatar}
                            alt={userName}
                            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-purple-200 dark:border-purple-800 shrink-0"
                          />
                        ) : (
                          <div
                            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold shrink-0 shadow-sm"
                            style={{ background: 'linear-gradient(135deg, #6C5CE7, #a29bfe)' }}
                          >
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm truncate">{userName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{userEmail}</p>
                          {student._id && (
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">User ID: {student._id}</p>
                          )}
                        </div>
                      </div>
                      <div className="self-start sm:self-auto shrink-0">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold capitalize bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {student.role || 'Student'}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Purchased Courses */}
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-purple-500" /> Purchased Courses ({selectedOrder.courses?.length || 0})
                </p>
                <div className="space-y-2.5 min-w-0">
                  {selectedOrder.courses && selectedOrder.courses.length > 0 ? (
                    selectedOrder.courses.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 sm:p-3.5 bg-white dark:bg-gray-800/80 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm min-w-0 gap-2.5"
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                          {item.course?.thumbnailUrl ? (
                            <img
                              src={item.course.thumbnailUrl}
                              alt={item.title}
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl object-cover border border-gray-100 dark:border-gray-700 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center shrink-0">
                              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                              {item.title || item.course?.title || 'Course'}
                            </p>
                            {item.instructor && (
                              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
                                Instructor: {item.instructor.fullName || item.instructor.name || 'Instructor'}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white">
                            ₹{(item.finalPrice ?? item.originalPrice ?? 0).toLocaleString()}
                          </p>
                          {item.originalPrice > item.finalPrice && (
                            <p className="text-[10px] sm:text-xs text-gray-400 line-through">
                              ₹{(item.originalPrice || 0).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic">No courses recorded with this order.</p>
                  )}
                </div>
              </div>

              {/* Payment & Transaction Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 min-w-0">
                <div className="bg-gray-50 dark:bg-gray-800/60 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-700/60 space-y-2 text-xs min-w-0">
                  <p className="text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-purple-500" /> Payment Details
                  </p>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400 shrink-0">Payment Gateway:</span>
                    <span className="font-semibold text-gray-900 dark:text-white capitalize truncate">
                      {selectedOrder.paymentMethod || 'Razorpay'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400 shrink-0">Payment Status:</span>
                    <span className="font-semibold capitalize text-purple-600 dark:text-purple-400 truncate">
                      {selectedOrder.paymentStatus || 'Paid'}
                    </span>
                  </div>
                  {selectedOrder.razorpayOrderId && (
                    <div className="flex justify-between items-center gap-2 min-w-0">
                      <span className="text-gray-500 dark:text-gray-400 shrink-0">Razorpay Order:</span>
                      <div className="flex items-center gap-1 font-mono text-[11px] min-w-0 flex-1 justify-end">
                        <span className="truncate">{selectedOrder.razorpayOrderId}</span>
                        <button
                          onClick={() => copyToClipboard(selectedOrder.razorpayOrderId, 'Razorpay Order ID')}
                          className="text-gray-400 hover:text-purple-600 transition shrink-0 cursor-pointer"
                          title="Copy"
                        >
                          {copiedField === 'Razorpay Order ID' ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  {selectedOrder.razorpayPaymentId && (
                    <div className="flex justify-between items-center gap-2 min-w-0">
                      <span className="text-gray-500 dark:text-gray-400 shrink-0">Payment ID:</span>
                      <div className="flex items-center gap-1 font-mono text-[11px] min-w-0 flex-1 justify-end">
                        <span className="truncate">{selectedOrder.razorpayPaymentId}</span>
                        <button
                          onClick={() => copyToClipboard(selectedOrder.razorpayPaymentId, 'Razorpay Payment ID')}
                          className="text-gray-400 hover:text-purple-600 transition shrink-0 cursor-pointer"
                          title="Copy"
                        >
                          {copiedField === 'Razorpay Payment ID' ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Timeline / Dates */}
                <div className="bg-gray-50 dark:bg-gray-800/60 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-700/60 space-y-2 text-xs min-w-0">
                  <p className="text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-purple-500" /> Timeline
                  </p>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400 shrink-0">Order Placed:</span>
                    <span className="font-semibold text-gray-900 dark:text-white truncate">
                      {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400 shrink-0">Payment Completed:</span>
                    <span className="font-semibold text-gray-900 dark:text-white truncate">
                      {selectedOrder.paidAt ? new Date(selectedOrder.paidAt).toLocaleDateString() : (selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleDateString() : 'N/A')}
                    </span>
                  </div>
                  {selectedOrder.coupon && (
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-gray-500 dark:text-gray-400 shrink-0">Coupon Used:</span>
                      <span className="font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded truncate">
                        {selectedOrder.coupon?.code || 'COUPON'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="bg-purple-50/50 dark:bg-purple-950/20 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-purple-100 dark:border-purple-900/50 space-y-2 text-xs sm:text-sm min-w-0">
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>Subtotal</span>
                  <span>₹{(selectedOrder.subtotal ?? selectedOrder.totalAmount ?? 0).toLocaleString()}</span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                    <span>Discount Applied</span>
                    <span>- ₹{(selectedOrder.discountAmount).toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t border-purple-200 dark:border-purple-800 pt-2 flex justify-between items-center font-extrabold text-sm sm:text-base text-gray-900 dark:text-white">
                  <span>Total Amount Paid</span>
                  <span className="text-purple-600 dark:text-purple-400">
                    ₹{(selectedOrder.totalAmount ?? selectedOrder.amount ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                {(selectedOrder.orderStatus === 'paid' || selectedOrder.paymentStatus === 'paid') && (
                  <button
                    onClick={() => handleRefund(selectedOrder._id)}
                    className="text-xs bg-purple-600 text-white hover:bg-purple-700 font-bold px-3.5 sm:px-4 py-2 rounded-xl transition shadow-sm cursor-pointer"
                  >
                    Mark as Refunded
                  </button>
                )}
                {selectedOrder.orderStatus !== 'cancelled' && selectedOrder.orderStatus !== 'refunded' && selectedOrder.orderStatus !== 'paid' && (
                  <button
                    onClick={() => handleCancel(selectedOrder._id)}
                    className="text-xs bg-red-600 text-white hover:bg-red-700 font-bold px-3.5 sm:px-4 py-2 rounded-xl transition shadow-sm cursor-pointer"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-xs font-semibold px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition cursor-pointer ml-auto"
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
