import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getMyCart, removeFromCart, clearCart } from '../api/cart.api';
import { checkoutPreview, createPaymentOrder, verifyPayment } from '../api/order.api';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui/Spinner';
import { ShoppingCart, Trash2, Tag, ArrowRight, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Cart() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [cartSummary, setCartSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const fetchCart = () => {
    setLoading(true);
    getMyCart()
      .then(r => {
        const cartData = r.data.cart;
        if (cartData) {
          setCartItems(cartData.items || []);
          setCartSummary(cartData);
        } else {
          const items = r.data.cartItems || r.data.data?.cartItems || [];
          setCartItems(items);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCart(); }, []);

  const handleRemove = async (courseId) => {
    try {
      await removeFromCart(courseId);
      toast.success('Removed from cart');
      fetchCart();
      setPreview(null);
    } catch (err) { toast.error(err.message); }
  };

  const handleClear = async () => {
    try {
      await clearCart();
      setCartItems([]);
      setCartSummary(null);
      setPreview(null);
      toast.success('Cart cleared');
    } catch (err) { toast.error(err.message); }
  };

  const handlePreview = async () => {
    setPreviewLoading(true);
    try {
      const res = await checkoutPreview({ couponCode: couponCode.trim() || null });
      setPreview(res.data.checkout);
    } catch (err) { toast.error(err.message); }
    finally { setPreviewLoading(false); }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        toast.error('Payment gateway failed to load. Please check your network connection.');
        setCheckoutLoading(false);
        return;
      }

      const orderRes = await createPaymentOrder({ couponCode: couponCode.trim() || null });
      // Backend response: { success, order: { id, subtotal, totalAmount }, razorpay: { keyId, orderId, amount, currency } }
      const { order: dbOrder, razorpay: rzpData } = orderRes.data;

      const options = {
        key: rzpData.keyId,
        amount: rzpData.amount,
        currency: rzpData.currency,
        name: 'Vertex Portal',
        description: 'Course Purchase',
        order_id: rzpData.orderId,
        handler: async function (response) {
          try {
            // Backend verifyPaymentController expects these exact field names
            await verifyPayment({
              databaseOrderId: dbOrder.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success('Payment successful! You are now enrolled.', { duration: 5000 });
            navigate('/my-learning');
          } catch (err) {
            toast.error('Payment verification failed: ' + (err.response?.data?.message || err.message));
          }
        },
        prefill: { name: user?.fullName || '', email: user?.email || '' },
        theme: { color: '#2563eb' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) { toast.error(err.response?.data?.message || err.message); }
    finally { setCheckoutLoading(false); }
  };

  const subtotal = cartSummary?.subtotal ?? cartItems.reduce((s, item) => {
    const price = item.currentPrice ?? item.course?.discountPrice ?? item.course?.price ?? 0;
    return s + price;
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-[Inter,sans-serif] py-8 text-gray-900 dark:text-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-xl w-36" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-28 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-4" />
              ))}
            </div>
            <div className="h-64 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 space-y-4" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="container">
          <h1>My Cart</h1>
          <p>{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        {cartItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><ShoppingCart size={48} /></div>
            <h3>Your cart is empty</h3>
            <p>Add some courses to get started</p>
            <Link to="/courses" className="btn btn-primary" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>
              Browse Courses
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem', alignItems: 'start' }}>
            {/* Cart Items */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <button className="btn btn-danger btn-sm" onClick={handleClear} id="clear-cart-btn">
                  <Trash2 size={14} /> Clear All
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {cartItems.map(item => {
                  const course = item.course || item;
                  const price = item.currentPrice ?? course?.discountPrice ?? course?.price ?? 0;
                  const courseId = course?._id || item._id;

                  return (
                    <div key={item._id} style={{
                      display: 'flex', gap: '1rem', alignItems: 'center',
                      padding: '1.25rem',
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-lg)',
                    }}>
                      <div style={{ width: 100, height: 65, borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0 }}>
                        {course?.thumbnailUrl ? (
                          <img src={course.thumbnailUrl} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: 'rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <BookOpen size={24} color="rgba(255,255,255,0.4)" />
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Link to={`/courses/${course?.slug}`} style={{ fontWeight: 600, fontSize: '0.9375rem', display: 'block', marginBottom: '0.25rem' }}>
                          {course?.title}
                        </Link>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>by {course?.instructor?.fullName || 'Instructor'}</p>
                        {item.priceChanged && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-warning)' }}>
                            Price updated since added
                          </span>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                          {price === 0 ? <span style={{ color: 'var(--color-success)' }}>Free</span> : `₹${price}`}
                        </div>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--color-error)' }}
                          onClick={() => handleRemove(courseId)}
                          id={`remove-${item._id}-btn`}
                          title="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Summary */}
            <div style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.5rem',
              position: 'sticky', top: 90,
            }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Order Summary</h3>

              {/* Coupon */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Coupon Code
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Enter code"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    id="coupon-input"
                  />
                  <button className="btn btn-secondary btn-sm" onClick={handlePreview} disabled={previewLoading} id="apply-coupon-btn">
                    {previewLoading ? <div className="spinner spinner-sm" /> : <Tag size={14} />}
                  </button>
                </div>
              </div>

              <div className="divider" />

              {/* Pricing */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
                  <span>Subtotal</span>
                  <span>₹{preview ? preview.pricing?.subtotal : subtotal}</span>
                </div>
                {preview?.pricing?.discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9375rem', color: 'var(--color-success)' }}>
                    <span>Discount ({preview.coupon?.code})</span>
                    <span>−₹{preview.pricing.discountAmount}</span>
                  </div>
                )}
                <div className="divider" style={{ margin: '0.25rem 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.125rem' }}>
                  <span>Total</span>
                  <span>₹{preview ? preview.pricing?.totalAmount : subtotal}</span>
                </div>
              </div>

              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={handleCheckout}
                disabled={checkoutLoading}
                id="checkout-btn"
              >
                {checkoutLoading ? <div className="spinner spinner-sm" /> : <><ArrowRight size={18} /> Proceed to Checkout</>}
              </button>

              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1rem' }}>
                Secure payment powered by Razorpay
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
