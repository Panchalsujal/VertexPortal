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
import {
  FolderPlus, Tag, Edit3, Trash2, ToggleLeft, ToggleRight, Plus, Shield,
  Award, Download, RefreshCw, XCircle, RotateCcw, Send, Star
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
// Layer 7: Server-side admin guard | Layer 9: Inactivity auto-logout
import { useAdminGuard } from '../../hooks/useAdminGuard';
import { useInactivityLogout } from '../../hooks/useInactivityLogout';

export default function AdminPanel() {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'categories');

  // ── Layer 7: Server-side admin role re-verification ──────────
  useAdminGuard();
  // ── Layer 9: 30-min idle auto-logout ─────────────────────────
  useInactivityLogout();

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
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-md font-semibold text-sm text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-sm cursor-pointer shrink-0"
              onClick={() => { setActiveCat(null); setCatForm({ name: '', description: '' }); setCatModalOpen(true); }}
            >
              <FolderPlus size={16} /> Add Category
            </button>
          )}
          {activeTab === 'coupons' && (
            <button
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-md font-semibold text-sm text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-sm cursor-pointer shrink-0"
              onClick={() => { setActiveCoupon(null); setCouponForm({ code: '', discountType: 'percentage', discountValue: 10, maxDiscountAmount: '', minOrderAmount: 0, usageLimit: 100, expiresAt: '' }); setCouponModalOpen(true); }}
            >
              <Plus size={16} /> Create Coupon
            </button>
          )}
          {activeTab === 'certificates' && (
            <div className="flex items-center gap-3 flex-wrap">
              <button
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-md text-sm font-medium border border-slate-200 dark:border-white/10 bg-white dark:bg-[#181818] text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer shadow-sm"
                onClick={handleRetryBulk}
                title="Retry Failed Issuances"
              >
                <RotateCcw size={16} /> Bulk Retry
              </button>
              <button
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-md font-semibold text-sm text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-sm cursor-pointer shrink-0"
                onClick={() => { setIssueForm({ courseId: '', userEmail: '', enrollmentId: '' }); setIssueModalOpen(true); }}
              >
                <Award size={16} /> Issue Certificate
              </button>
            </div>
          )}
        </div>
      }
    >
      <div className="w-full max-w-full min-w-0 overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar whitespace-nowrap pb-3 mb-6 border-b border-slate-200 dark:border-white/10 w-full max-w-full">
          <button className={`shrink-0 font-medium text-sm transition-colors cursor-pointer border-b-2 ${activeTab === 'categories' ? 'text-purple-600 dark:text-purple-400 border-purple-600 dark:border-purple-400' : 'text-slate-500 dark:text-neutral-400 border-transparent hover:text-slate-800 dark:hover:text-white'}`} onClick={() => handleTabChange('categories')}>
            Categories ({categories.length})
          </button>
          <button className={`shrink-0 font-medium text-sm transition-colors cursor-pointer border-b-2 ${activeTab === 'coupons' ? 'text-purple-600 dark:text-purple-400 border-purple-600 dark:border-purple-400' : 'text-slate-500 dark:text-neutral-400 border-transparent hover:text-slate-800 dark:hover:text-white'}`} onClick={() => handleTabChange('coupons')}>
            Coupons ({coupons.length})
          </button>
          <button className={`shrink-0 font-medium text-sm transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${activeTab === 'certificates' ? 'text-purple-600 dark:text-purple-400 border-purple-600 dark:border-purple-400' : 'text-slate-500 dark:text-neutral-400 border-transparent hover:text-slate-800 dark:hover:text-white'}`} onClick={() => handleTabChange('certificates')}>
            <Award size={16} /> Certificates ({certificates.length})
          </button>
          <button className={`shrink-0 font-medium text-sm transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${activeTab === 'reviews' ? 'text-purple-600 dark:text-purple-400 border-purple-600 dark:border-purple-400' : 'text-slate-500 dark:text-neutral-400 border-transparent hover:text-slate-800 dark:hover:text-white'}`} onClick={() => handleTabChange('reviews')}>
            <Star size={16} className="text-amber-400 fill-amber-400" /> Reviews ({adminReviews.length})
          </button>
        </div>

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="w-full min-w-0 max-w-full">
            {catLoading ? (
              <SkeletonFeed count={3} />
            ) : categories.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 min-w-0 max-w-full">
                {categories.map(cat => (
                  <div key={cat._id} className="bg-white dark:bg-[#181818] p-5 flex flex-col justify-between rounded-lg border border-slate-200 dark:border-white/10 shadow-sm min-w-0 max-w-full">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1.5 truncate">{cat.name}</h3>
                      <p className="text-sm text-slate-500 dark:text-neutral-400 line-clamp-3 break-words">{cat.description || 'No description'}</p>
                    </div>
                    <div className="flex justify-end items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-white/10">
                      <button className="px-3 py-1.5 bg-white dark:bg-[#202020] hover:bg-slate-50 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 rounded-md text-xs font-medium text-slate-700 dark:text-neutral-300 transition-colors shadow-sm inline-flex items-center gap-1.5 cursor-pointer" onClick={() => { setActiveCat(cat); setCatForm({ name: cat.name, description: cat.description || '' }); setCatModalOpen(true); }}>
                        <Edit3 size={14} /> Edit
                      </button>
                      <button className="px-3 py-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-md text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer" onClick={() => handleDeleteCategory(cat._id)}>
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
          <div className="w-full min-w-0 max-w-full">
            {couponLoading ? (
              <SkeletonFeed count={3} />
            ) : coupons.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 min-w-0 max-w-full">
                {coupons.map(cop => (
                  <div key={cop._id} className="bg-white dark:bg-[#181818] p-5 flex flex-col justify-between rounded-lg border border-slate-200 dark:border-white/10 shadow-sm min-w-0 max-w-full">
                    <div className="min-w-0">
                      <div className="flex justify-between items-center mb-3 gap-2">
                        <span className="font-bold text-base tracking-wider text-purple-600 dark:text-purple-400 truncate">
                          {cop.code}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cop.isActive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50'}`}>
                          {cop.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
                        {cop.discountType === 'percentage' ? `${cop.discountValue}% OFF` : `₹${cop.discountValue} OFF`}
                      </p>
                      <div className="text-xs text-slate-500 dark:text-neutral-400 mt-2 space-y-1 tabular-nums">
                        <div>Min Order: ₹{cop.minOrderAmount || 0}</div>
                        {cop.usageLimit && <div>Limit: {cop.timesUsed || 0} / {cop.usageLimit}</div>}
                      </div>
                    </div>

                    <div className="flex justify-end items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-white/10">
                      <button className="px-3 py-1.5 bg-white dark:bg-[#202020] hover:bg-slate-50 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 rounded-md text-xs font-medium text-slate-700 dark:text-neutral-300 transition-colors shadow-sm inline-flex items-center gap-1.5 cursor-pointer" onClick={() => handleToggleCoupon(cop._id, cop.isActive)}>
                        {cop.isActive ? <ToggleRight size={16} className="text-emerald-500" /> : <ToggleLeft size={16} className="text-slate-400" />} {cop.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button className="px-3 py-1.5 bg-white dark:bg-[#202020] hover:bg-slate-50 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 rounded-md text-xs font-medium text-slate-700 dark:text-neutral-300 transition-colors shadow-sm inline-flex items-center gap-1.5 cursor-pointer" onClick={() => { setActiveCoupon(cop); setCouponForm({ code: cop.code, discountType: cop.discountType, discountValue: cop.discountValue, maxDiscountAmount: cop.maxDiscountAmount || '', minOrderAmount: cop.minOrderAmount || 0, usageLimit: cop.usageLimit || '', expiresAt: cop.expiresAt ? cop.expiresAt.split('T')[0] : '' }); setCouponModalOpen(true); }}>
                        <Edit3 size={14} /> Edit
                      </button>
                      <button className="px-3 py-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-md text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer" onClick={() => handleDeleteCoupon(cop._id)}>
                        <Trash2 size={14} /> Delete
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
          <div className="w-full min-w-0 max-w-full">
            {certLoading ? (
              <SkeletonFeed count={4} />
            ) : certificates.length > 0 ? (
              <div className="flex flex-col gap-4 min-w-0 max-w-full">
                {certificates.map(cert => (
                  <div key={cert._id} className="bg-white dark:bg-[#181818] p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 rounded-lg border border-slate-200 dark:border-white/10 shadow-sm min-w-0 max-w-full overflow-hidden">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap min-w-0">
                        <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50 break-words max-w-full">
                          {cert.course?.title || cert.courseTitle || 'Course'}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider shrink-0 ${
                          cert.isRevoked ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cert.isRevoked ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                          {cert.isRevoked ? 'Revoked' : 'Active'}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {cert.user?.fullName || cert.userEmail || cert.userName || 'Student'}
                      </h4>
                      <div className="text-xs text-slate-500 dark:text-neutral-400 mt-1.5 space-y-1 min-w-0 tabular-nums">
                        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                          <span className="shrink-0 text-slate-400 dark:text-neutral-500">Code:</span>
                          <code className="text-purple-600 dark:text-purple-400 font-semibold font-mono text-[11px] break-all">
                            {cert.verificationCode || cert._id}
                          </code>
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-neutral-500">
                          Issued: {new Date(cert.issuedAt || cert.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-white/10">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-slate-200 dark:border-white/10 bg-white dark:bg-[#202020] text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors shadow-sm cursor-pointer" onClick={() => handleDownloadAdminPdf(cert._id, cert.course?.title)} title="Download PDF">
                        <Download size={14} /> PDF
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-slate-200 dark:border-white/10 bg-white dark:bg-[#202020] text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors shadow-sm cursor-pointer" onClick={() => handleRegeneratePdf(cert._id)} title="Regenerate PDF">
                        <RefreshCw size={14} /> Refresh
                      </button>
                      {cert.isRevoked ? (
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 transition-colors shadow-sm cursor-pointer" onClick={() => handleRestore(cert._id)}>
                          <RotateCcw size={14} /> Restore
                        </button>
                      ) : (
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border border-rose-200 dark:border-rose-800/50 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors shadow-sm cursor-pointer" onClick={() => { setSelectedCert(cert); setRevokeReason(''); setRevokeModalOpen(true); }}>
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
              <div className="bg-white dark:bg-[#181818] rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm overflow-x-auto">
                <table className="w-full min-w-[700px] text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#202020] border-b border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="px-4 py-2.5">Student</th>
                      <th className="px-4 py-2.5">Course</th>
                      <th className="px-4 py-2.5">Rating</th>
                      <th className="px-4 py-2.5">Comment</th>
                      <th className="px-4 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm text-gray-900 dark:text-white">
                    {adminReviews.map((rev) => (
                      <tr key={rev._id} className="hover:bg-slate-50/50 dark:hover:bg-[#202020]/30 transition-colors bg-white dark:bg-[#181818]">
                        <td className="px-4 py-2.5">
                          <div className="font-medium text-sm text-gray-900 dark:text-white">{rev.student?.fullName || rev.user?.fullName || 'Student'}</div>
                          <div className="text-xs text-slate-500 dark:text-neutral-400">{rev.student?.email || rev.user?.email || 'N/A'}</div>
                        </td>
                        <td className="px-4 py-2.5 text-xs font-medium text-purple-600 dark:text-purple-400">
                          {rev.course?.title || rev.courseTitle || 'Course'}
                        </td>
                        <td className="px-4 py-2.5">
                          <StarRating rating={rev.rating || 5} size={14} />
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-700 dark:text-neutral-300 max-w-xs sm:max-w-sm truncate">
                          {rev.comment || rev.content || 'No review comment text'}
                        </td>
                        <td className="px-4 py-2.5 text-right">
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
                            className="px-3 py-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-md text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                            title="Delete Review"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
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
              <select
                value={couponForm.discountType}
                onChange={(e) => setCouponForm((f) => ({ ...f, discountType: e.target.value }))}
                className="input-field"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
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
            <select
              value={issueForm.courseId}
              onChange={(e) => setIssueForm((f) => ({ ...f, courseId: e.target.value }))}
              className="input-field"
            >
              <option value="">-- Select Course --</option>
              {allCourses.map((c) => (
                <option key={c._id} value={c._id}>{c.title}</option>
              ))}
            </select>
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
