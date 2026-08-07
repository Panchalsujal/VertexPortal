import { useState, useEffect } from 'react';
import { getAllCategories, createCategory, updateCategory, deleteCategory } from '../../api/category.api';
import { getAllCoupons, createCoupon, updateCoupon, toggleCouponStatus, deleteCoupon } from '../../api/coupon.api';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { FolderPlus, Tag, Edit3, Trash2, ToggleLeft, ToggleRight, Plus, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('categories');

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

  useEffect(() => {
    if (activeTab === 'categories') fetchCategories();
    else fetchCoupons();
  }, [activeTab]);

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

  const handleToggleCoupon = async (id) => {
    try {
      await toggleCouponStatus(id);
      toast.success('Coupon status updated');
      fetchCoupons();
    } catch (err) {
      toast.error(err.message);
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

  return (
    <div className="page-wrapper">
      <div style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)', padding: '2.5rem 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={28} color="var(--color-primary-light)" /> Admin Panel
            </h1>
            <p>Manage system categories, coupons, and global configurations</p>
          </div>
          {activeTab === 'categories' ? (
            <button className="btn btn-primary" onClick={() => { setActiveCat(null); setCatForm({ name: '', description: '' }); setCatModalOpen(true); }}>
              <FolderPlus size={18} /> Add Category
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => { setActiveCoupon(null); setCouponForm({ code: '', discountType: 'percentage', discountValue: 10, maxDiscountAmount: '', minOrderAmount: 0, usageLimit: 100, expiresAt: '' }); setCouponModalOpen(true); }}>
              <Plus size={18} /> Create Coupon
            </button>
          )}
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        {/* Tabs */}
        <div className="tabs">
          <button className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>
            Categories ({categories.length})
          </button>
          <button className={`tab-btn ${activeTab === 'coupons' ? 'active' : ''}`} onClick={() => setActiveTab('coupons')}>
            Coupons ({coupons.length})
          </button>
        </div>

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div>
            {catLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Spinner /></div>
            ) : categories.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {categories.map(cat => (
                  <div key={cat._id} className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>{cat.name}</h3>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{cat.description || 'No description'}</p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
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
              <div className="empty-state">
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
              <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Spinner /></div>
            ) : coupons.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                {coupons.map(cop => (
                  <div key={cop._id} className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.125rem', letterSpacing: '0.05em', color: 'var(--color-primary-light)' }}>
                          {cop.code}
                        </span>
                        <span className={`badge ${cop.isActive ? 'badge-success' : 'badge-warning'}`}>
                          {cop.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.9375rem', fontWeight: 600 }}>
                        {cop.discountType === 'percentage' ? `${cop.discountValue}% OFF` : `₹${cop.discountValue} OFF`}
                      </p>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        <div>Min Order: ₹{cop.minOrderAmount || 0}</div>
                        {cop.usageLimit && <div>Limit: {cop.timesUsed || 0} / {cop.usageLimit}</div>}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleToggleCoupon(cop._id)}>
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
              <div className="empty-state">
                <div className="empty-state-icon"><Tag size={48} /></div>
                <h3>No coupons created</h3>
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
              <select className="input-field" value={couponForm.discountType} onChange={e => setCouponForm(f => ({ ...f, discountType: e.target.value }))}>
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
          <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>Save Coupon</button>
        </form>
      </Modal>
    </div>
  );
}
