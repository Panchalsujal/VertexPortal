import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import toast from 'react-hot-toast';
import { getAllCategories, createCategory, updateCategory, deleteCategory } from '../../api/category.api';
import { getAllCoupons, createCoupon, updateCoupon, toggleCouponStatus, deleteCoupon } from '../../api/coupon.api';
import { getAllCourses } from '../../api/course.api';
import { getAdminCoursesList } from '../../api/adminCourses.api';
import {
  fetchAdminCertificates,
  issueCertificate,
  revokeCertificate,
  restoreCertificate,
  regeneratePdf,
  retryBulkCertificates,
  selectAdminCertificates,
  selectAdminCertificatesLoading,
} from '../../store/slices/admin/certificatesSlice';
import { adminDownloadCertificate } from '../../api/certificate.api';
import { getAdminReviews } from '../../api/admin.api';
import { deleteReview, getCourseReviews } from '../../api/review.api';
import { StarRating } from '../../components/ui/StarRating';
import { Modal } from '../../components/ui/Modal';
import { Spinner, SkeletonTable, SkeletonFeed } from '../../components/ui/Spinner';
import CustomSelect from '../../components/ui/CustomSelect';
import {
  FolderPlus, Tag, Edit3, Trash2, ToggleLeft, ToggleRight, Plus, Shield,
  Award, Download, RefreshCw, XCircle, RotateCcw, Send, Star
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';

export default function AdminPanel() {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'categories');

  useEffect(() => {
    if (tabFromUrl && ['categories', 'coupons', 'certificates', 'reviews'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    } else if (!tabFromUrl) {
      setActiveTab('categories');
    }
  }, [tabFromUrl]);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setSearchParams({ tab: tabKey });
  };

  // Category state
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(true);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [activeCat, setActiveCat] = useState(null);
  const [catForm, setCatForm] = useState({ name: '', description: '' });

  // Coupon state
  const [coupons, setCoupons] = useState([]);
  const [couponLoading, setCouponLoading] = useState(true);
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [activeCoupon, setActiveCoupon] = useState(null);
  const [couponForm, setCouponForm] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: 10,
    maxDiscountAmount: '',
    minOrderAmount: 0,
    usageLimit: 100,
    expiresAt: '',
  });

  // Course list for certificate modal & review fallback
  const [allCourses, setAllCourses] = useState([]);

  // Reviews state
  const [adminReviews, setAdminReviews] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);

  // Certificate state
  const certificates = useAppSelector(selectAdminCertificates);
  const certLoading = useAppSelector(selectAdminCertificatesLoading);
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [issueForm, setIssueForm] = useState({ courseId: '', userEmail: '', enrollmentId: '' });
  const [issuing, setIssuing] = useState(false);

  // Revoke Modal State
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);
  const [revokeReason, setRevokeReason] = useState('');

  const fetchCategories = async () => {
    setCatLoading(true);
    try {
      const res = await getAllCategories();
      setCategories(res.data.categories || res.data.data?.categories || res.data.data || []);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setCatLoading(false);
    }
  };

  const fetchCoupons = async () => {
    setCouponLoading(true);
    try {
      const res = await getAllCoupons();
      setCoupons(res.data.coupons || res.data.data?.coupons || res.data.data || []);
    } catch {
      toast.error('Failed to load coupons');
    } finally {
      setCouponLoading(false);
    }
  };

  const fetchAdminReviews = async () => {
    setReviewLoading(true);
    try {
      const res = await getAdminReviews();
      const list = res.data.reviews || res.data.data?.reviews || res.data.data || [];
      setAdminReviews(Array.isArray(list) ? list : []);
    } catch {
      try {
        const allRev = await Promise.all(
          allCourses.map(c => getCourseReviews(c._id).catch(() => ({ data: { reviews: [] } })))
        );
        const combined = allRev.flatMap(r => r.data?.reviews || r.data?.data?.reviews || []);
        setAdminReviews(combined);
      } catch {
        setAdminReviews([]);
      }
    } finally {
      setReviewLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchCoupons();
    fetchAdminReviews();
    dispatch(fetchAdminCertificates());

    const loadCourses = async () => {
      try {
        const res = await getAdminCoursesList({ limit: 100 });
        const list = res.data.courses || res.data.data?.courses || res.data.data || [];
        if (list.length > 0) {
          setAllCourses(list);
          return;
        }
      } catch {
        /* fallback */
      }
      try {
        const pRes = await getAllCourses({ limit: 100 });
        setAllCourses(pRes.data.courses || pRes.data.data?.courses || pRes.data.data || []);
      } catch {
        /* ignore */
      }
    };
    loadCourses();
  }, [dispatch]);

  useEffect(() => {
    if (activeTab === 'categories') fetchCategories();
    else if (activeTab === 'coupons') fetchCoupons();
    else if (activeTab === 'certificates') dispatch(fetchAdminCertificates());
  }, [activeTab, dispatch]);

  // Category Handlers
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catForm.name.trim()) return;
    try {
      if (activeCat) {
        await updateCategory(activeCat._id, catForm);
        toast.success('Category updated');
      } else {
        await createCategory(catForm);
        toast.success('Category created');
      }
      setCatModalOpen(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await deleteCategory(id);
      toast.success('Category deleted');
      fetchCategories();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Coupon Handlers
  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!couponForm.code.trim()) return;
    try {
      const payload = {
        ...couponForm,
        code: couponForm.code.toUpperCase(),
        discountValue: Number(couponForm.discountValue),
        minOrderAmount: Number(couponForm.minOrderAmount),
        maxDiscountAmount: couponForm.maxDiscountAmount ? Number(couponForm.maxDiscountAmount) : null,
        usageLimit: couponForm.usageLimit ? Number(couponForm.usageLimit) : null,
        expiresAt: couponForm.expiresAt ? new Date(couponForm.expiresAt).toISOString() : null,
      };

      if (activeCoupon) {
        await updateCoupon(activeCoupon._id, payload);
        toast.success('Coupon updated');
      } else {
        await createCoupon(payload);
        toast.success('Coupon created');
      }
      setCouponModalOpen(false);
      fetchCoupons();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleToggleCoupon = async (id, currentIsActive) => {
    // Optimistically update UI
    setCoupons(prev => prev.map(c => c._id === id ? { ...c, isActive: !currentIsActive } : c));
    try {
      await toggleCouponStatus(id, !currentIsActive);
      toast.success(`Coupon ${!currentIsActive ? 'activated' : 'deactivated'}`);
    } catch (err) {
      // Revert on failure
      setCoupons(prev => prev.map(c => c._id === id ? { ...c, isActive: currentIsActive } : c));
      toast.error(err.response?.data?.message || err.message || 'Failed to toggle coupon');
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await deleteCoupon(id);
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Certificate Handlers
  const handleIssueCertificate = async (e) => {
    e.preventDefault();
    setIssuing(true);
    const res = await dispatch(issueCertificate(issueForm));
    setIssuing(false);
    if (issueCertificate.fulfilled.match(res)) {
      toast.success('Certificate issued successfully!');
      setIssueModalOpen(false);
    } else {
      toast.error(res.payload || 'Failed to issue certificate');
    }
  };

  const handleRevoke = async (e) => {
    e.preventDefault();
    if (!revokeReason.trim()) return;
    const res = await dispatch(revokeCertificate({ id: selectedCert._id, reason: revokeReason }));
    if (revokeCertificate.fulfilled.match(res)) {
      toast.success('Certificate revoked');
      setRevokeModalOpen(false);
    } else {
      toast.error(res.payload || 'Failed to revoke certificate');
    }
  };

  const handleRestore = async (id) => {
    const res = await dispatch(restoreCertificate(id));
    if (restoreCertificate.fulfilled.match(res)) toast.success('Certificate restored');
    else toast.error(res.payload || 'Failed to restore certificate');
  };

  const handleRegeneratePdf = async (id) => {
    toast.loading('Regenerating PDF...', { id: 'pdf-regen' });
    const res = await dispatch(regeneratePdf(id));
    if (regeneratePdf.fulfilled.match(res)) toast.success('PDF regenerated!', { id: 'pdf-regen' });
    else toast.error(res.payload || 'PDF regeneration failed', { id: 'pdf-regen' });
  };

  const handleDownloadAdminPdf = async (certId, title) => {
    try {
      const res = await adminDownloadCertificate(certId);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Certificate-${title || certId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Downloaded!');
    } catch (err) {
      toast.error(err.message || 'Download failed');
    }
  };

  const handleRetryBulk = async () => {
    const res = await dispatch(retryBulkCertificates());
    if (retryBulkCertificates.fulfilled.match(res)) {
      toast.success(res.payload?.message || 'Bulk retry completed');
      dispatch(fetchAdminCertificates());
    } else {
      toast.error(res.payload || 'Retry failed');
    }
  };

  return (
    <AdminLayout
      title="System Categories, Coupons & Certificates"
      subtitle="Manage global platform configurations, categories, promotional coupons, and student certificates"
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          {activeTab === 'categories' && (
            <button
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-all hover:opacity-90 cursor-pointer shrink-0"
              style={{ background: 'linear-gradient(135deg, #6C5CE7 0%, #5046d4 100%)' }}
              onClick={() => { setActiveCat(null); setCatForm({ name: '', description: '' }); setCatModalOpen(true); }}
            >
              <FolderPlus size={15} /> Add Category
            </button>
          )}
          {activeTab === 'coupons' && (
            <button
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-all hover:opacity-90 cursor-pointer shrink-0"
              style={{ background: 'linear-gradient(135deg, #6C5CE7 0%, #5046d4 100%)' }}
              onClick={() => { setActiveCoupon(null); setCouponForm({ code: '', discountType: 'percentage', discountValue: 10, maxDiscountAmount: '', minOrderAmount: 0, usageLimit: 100, expiresAt: '' }); setCouponModalOpen(true); }}
            >
              <Plus size={15} /> Create Coupon
            </button>
          )}
          {activeTab === 'certificates' && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-purple-50 hover:text-purple-600 transition cursor-pointer"
                onClick={handleRetryBulk}
                title="Retry Failed Issuances"
              >
                <RotateCcw size={14} /> Bulk Retry
              </button>
              <button
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-all hover:opacity-90 cursor-pointer shrink-0"
                style={{ background: 'linear-gradient(135deg, #6C5CE7 0%, #5046d4 100%)' }}
                onClick={() => { setIssueForm({ courseId: '', userEmail: '', enrollmentId: '' }); setIssueModalOpen(true); }}
              >
                <Award size={15} /> Issue Certificate
              </button>
            </div>
          )}
        </div>
      }
    >
      <div>
        {/* Tabs */}
        <div className="tabs no-scrollbar overflow-x-auto whitespace-nowrap flex-nowrap pb-1">
          <button className={`tab-btn shrink-0 ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => handleTabChange('categories')}>
            Categories ({categories.length})
          </button>
          <button className={`tab-btn shrink-0 ${activeTab === 'coupons' ? 'active' : ''}`} onClick={() => handleTabChange('coupons')}>
            Coupons ({coupons.length})
          </button>
          <button className={`tab-btn shrink-0 ${activeTab === 'certificates' ? 'active' : ''}`} onClick={() => handleTabChange('certificates')}>
            <Award size={15} /> Certificates ({certificates.length})
          </button>
          <button className={`tab-btn shrink-0 ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => handleTabChange('reviews')}>
            <Star size={15} className="fill-amber-400 text-amber-400 inline" /> Reviews & Ratings ({adminReviews.length})
          </button>
        </div>

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div>
            {catLoading ? (
              <SkeletonFeed count={3} />
            ) : categories.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
                {categories.map(cat => (
                  <div key={cat._id} className="glass-card p-4 sm:p-5 flex flex-col justify-between rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1.5">{cat.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-3">{cat.description || 'No description'}</p>
                    </div>
                    <div className="flex justify-end items-center gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                      <button className="btn btn-ghost btn-sm" onClick={() => { setActiveCat(cat); setCatForm({ name: cat.name, description: cat.description || '' }); setCatModalOpen(true); }}>
                        <Edit3 size={14} /> Edit
                      </button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-error)' }} onClick={() => handleDeleteCategory(cat._id)}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state p-8 sm:p-12">
                <div className="empty-state-icon"><FolderPlus size={48} /></div>
                <h3>No categories yet</h3>
              </div>
            )}
          </div>
        )}

        {/* Coupons Tab */}
        {activeTab === 'coupons' && (
          <div>
            {couponLoading ? (
              <SkeletonFeed count={3} />
            ) : coupons.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
                {coupons.map(cop => (
                  <div key={cop._id} className="glass-card p-4 sm:p-5 flex flex-col justify-between rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-extrabold text-base tracking-wider text-purple-600 dark:text-purple-400">
                          {cop.code}
                        </span>
                        <span className={`badge ${cop.isActive ? 'badge-success' : 'badge-warning'}`}>
                          {cop.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                        {cop.discountType === 'percentage' ? `${cop.discountValue}% OFF` : `₹${cop.discountValue} OFF`}
                      </p>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 space-y-0.5">
                        <div>Min Order: ₹{cop.minOrderAmount || 0}</div>
                        {cop.usageLimit && <div>Limit: {cop.timesUsed || 0} / {cop.usageLimit}</div>}
                      </div>
                    </div>

                    <div className="flex justify-end items-center gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                      <button className="btn btn-ghost btn-sm" onClick={() => handleToggleCoupon(cop._id, cop.isActive)}>
                        {cop.isActive ? <ToggleRight size={18} color="var(--color-success)" /> : <ToggleLeft size={18} />}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setActiveCoupon(cop); setCouponForm({ code: cop.code, discountType: cop.discountType, discountValue: cop.discountValue, maxDiscountAmount: cop.maxDiscountAmount || '', minOrderAmount: cop.minOrderAmount || 0, usageLimit: cop.usageLimit || '', expiresAt: cop.expiresAt ? cop.expiresAt.split('T')[0] : '' }); setCouponModalOpen(true); }}>
                        <Edit3 size={14} />
                      </button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-error)' }} onClick={() => handleDeleteCoupon(cop._id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state p-8 sm:p-12">
                <div className="empty-state-icon"><Tag size={48} /></div>
                <h3>No coupons created</h3>
              </div>
            )}
          </div>
        )}

        {/* Certificates Tab */}
        {activeTab === 'certificates' && (
          <div>
            {certLoading ? (
              <SkeletonFeed count={4} />
            ) : certificates.length > 0 ? (
              <div className="flex flex-col gap-3 sm:gap-4">
                {certificates.map(cert => (
                  <div key={cert._id} className="glass-card p-4 sm:p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="badge badge-primary">{cert.course?.title || cert.courseTitle || 'Course'}</span>
                        <span className={`badge ${cert.isRevoked ? 'badge-danger' : 'badge-success'}`}>
                          {cert.isRevoked ? 'Revoked' : 'Active'}
                        </span>
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">{cert.user?.fullName || cert.userEmail || cert.userName || 'Student'}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Code: <code className="text-purple-600 dark:text-purple-400 font-semibold">{cert.verificationCode || cert._id}</code>
                        {' · '} Issued: {new Date(cert.issuedAt || cert.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button className="btn btn-secondary btn-sm" onClick={() => handleDownloadAdminPdf(cert._id, cert.course?.title)} title="Download PDF">
                        <Download size={14} /> PDF
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleRegeneratePdf(cert._id)} title="Regenerate PDF">
                        <RefreshCw size={14} />
                      </button>
                      {cert.isRevoked ? (
                        <button className="btn btn-secondary btn-sm" onClick={() => handleRestore(cert._id)}>
                          <RotateCcw size={14} /> Restore
                        </button>
                      ) : (
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-error)' }} onClick={() => { setSelectedCert(cert); setRevokeReason(''); setRevokeModalOpen(true); }}>
                          <XCircle size={14} /> Revoke
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state p-8 sm:p-12">
                <div className="empty-state-icon"><Award size={48} /></div>
                <h3>No certificates found</h3>
                <p>Certificates earned by students will appear here.</p>
              </div>
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div>
            {reviewLoading ? (
              <SkeletonTable rows={5} cols={5} />
            ) : adminReviews.length > 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs overflow-x-auto">
                <table className="w-full min-w-[620px] text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-800/60 border-b border-gray-200 dark:border-slate-800 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <th className="p-3.5 sm:p-4">Student</th>
                      <th className="p-3.5 sm:p-4">Course</th>
                      <th className="p-3.5 sm:p-4">Rating</th>
                      <th className="p-3.5 sm:p-4">Comment</th>
                      <th className="p-3.5 sm:p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60 text-sm text-gray-900 dark:text-white">
                    {adminReviews.map((rev) => (
                      <tr key={rev._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3.5 sm:p-4">
                          <div className="font-semibold text-gray-900 dark:text-white">{rev.student?.fullName || rev.user?.fullName || 'Student'}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{rev.student?.email || rev.user?.email || 'N/A'}</div>
                        </td>
                        <td className="p-3.5 sm:p-4 text-xs font-medium text-purple-600 dark:text-purple-400">
                          {rev.course?.title || rev.courseTitle || 'Course'}
                        </td>
                        <td className="p-3.5 sm:p-4">
                          <StarRating rating={rev.rating || 5} size={14} />
                        </td>
                        <td className="p-3.5 sm:p-4 text-xs text-gray-700 dark:text-gray-300 max-w-xs sm:max-w-sm truncate">
                          {rev.comment || rev.content || 'No review comment text'}
                        </td>
                        <td className="p-3.5 sm:p-4 text-right">
                          <button
                            onClick={async () => {
                              if (window.confirm('Delete this student review?')) {
                                try {
                                  await deleteReview(rev._id);
                                  toast.success('Review deleted');
                                  fetchAdminReviews();
                                } catch (err) {
                                  toast.error(err.message || 'Failed to delete review');
                                }
                              }
                            }}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition cursor-pointer"
                            title="Delete Review"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="glass-card text-center py-10 sm:py-12 p-4 text-gray-500 dark:text-gray-400 rounded-xl sm:rounded-2xl">
                <Star className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-amber-400" />
                <p className="font-semibold text-sm">No Course Ratings &amp; Reviews Found</p>
                <p className="text-xs mt-1">Student reviews will appear here once submitted on course pages.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category Modal */}
      <Modal isOpen={catModalOpen} onClose={() => setCatModalOpen(false)} title={activeCat ? 'Edit Category' : 'Create Category'}>
        <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label className="input-label">Category Name *</label>
            <input type="text" className="input-field" value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="input-group">
            <label className="input-label">Description</label>
            <textarea className="input-field" rows={3} value={catForm.description} onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>Save Category</button>
        </form>
      </Modal>

      {/* Coupon Modal */}
      <Modal isOpen={couponModalOpen} onClose={() => setCouponModalOpen(false)} title={activeCoupon ? 'Edit Coupon' : 'Create Coupon'}>
        <form onSubmit={handleSaveCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label className="input-label">Coupon Code *</label>
            <input type="text" className="input-field" placeholder="e.g. SUMMER50" value={couponForm.code} onChange={e => setCouponForm(f => ({ ...f, code: e.target.value }))} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Discount Type</label>
              <CustomSelect
                value={couponForm.discountType}
                onChange={(val) => setCouponForm((f) => ({ ...f, discountType: val }))}
                options={[
                  { value: 'percentage', label: 'Percentage (%)' },
                  { value: 'fixed', label: 'Fixed Amount (₹)' },
                ]}
                placeholder="Discount Type"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Discount Value *</label>
              <input type="number" min="1" className="input-field" value={couponForm.discountValue} onChange={e => setCouponForm(f => ({ ...f, discountValue: e.target.value }))} required />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Min Order Amount (₹)</label>
              <input type="number" min="0" className="input-field" value={couponForm.minOrderAmount} onChange={e => setCouponForm(f => ({ ...f, minOrderAmount: e.target.value }))} />
            </div>
            <div className="input-group">
              <label className="input-label">Max Usage Limit</label>
              <input type="number" min="1" className="input-field" placeholder="Unlimited" value={couponForm.usageLimit} onChange={e => setCouponForm(f => ({ ...f, usageLimit: e.target.value }))} />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Expiry Date</label>
            <input type="date" className="input-field" value={couponForm.expiresAt} onChange={e => setCouponForm(f => ({ ...f, expiresAt: e.target.value }))} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>Save Coupon</button>
        </form>
      </Modal>

      {/* Manual Issue Certificate Modal */}
      <Modal isOpen={issueModalOpen} onClose={() => !issuing && setIssueModalOpen(false)} title="Manually Issue Certificate">
        <form onSubmit={handleIssueCertificate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label className="input-label">Select Course *</label>
            <CustomSelect
              value={issueForm.courseId}
              onChange={(val) => setIssueForm((f) => ({ ...f, courseId: val }))}
              options={allCourses.map((c) => ({ value: c._id, label: c.title }))}
              placeholder="-- Select Course --"
            />
          </div>
          <div className="input-group">
            <label className="input-label">User Email *</label>
            <input type="email" className="input-field" placeholder="student@example.com" value={issueForm.userEmail} onChange={e => setIssueForm(f => ({ ...f, userEmail: e.target.value }))} required />
          </div>
          <div className="input-group">
            <label className="input-label">Enrollment ID (Optional)</label>
            <input type="text" className="input-field" placeholder="MongoDB Enrollment ObjectId" value={issueForm.enrollmentId} onChange={e => setIssueForm(f => ({ ...f, enrollmentId: e.target.value }))} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }} disabled={issuing}>
            {issuing ? <><Spinner size={16} /> Issuing…</> : <><Send size={16} /> Issue Certificate</>}
          </button>
        </form>
      </Modal>

      {/* Revoke Modal */}
      <Modal isOpen={revokeModalOpen} onClose={() => setRevokeModalOpen(false)} title={`Revoke Certificate: ${selectedCert?.verificationCode || selectedCert?._id}`}>
        <form onSubmit={handleRevoke} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label className="input-label">Revocation Reason *</label>
            <textarea className="input-field" rows={3} placeholder="Reason for revoking this certificate..." value={revokeReason} onChange={e => setRevokeReason(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ background: 'var(--color-error)', borderColor: 'var(--color-error)', justifyContent: 'center' }}>
            Confirm Revocation
          </button>
        </form>
      </Modal>
    </AdminLayout>
  );
}
