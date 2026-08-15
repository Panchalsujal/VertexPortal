import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getMyCart, removeFromCart, clearCart } from '../api/cart.api';
import { checkoutPreview, createPaymentOrder, verifyPayment } from '../api/order.api';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui/Spinner';
import {
  ShoppingCart, Trash2, Tag, ArrowRight, BookOpen,
  ShieldCheck, Sparkles, CheckCircle2, X
} from 'lucide-react';
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
    } catch (err) { toast.error(err.message || 'Failed to remove item'); }
  };

  const handleClear = async () => {
    try {
      await clearCart();
      setCartItems([]);
      setCartSummary(null);
      setPreview(null);
      toast.success('Cart cleared');
    } catch (err) { toast.error(err.message || 'Failed to clear cart'); }
  };

  const handlePreview = async () => {
    if (!couponCode.trim()) return;
    setPreviewLoading(true);
    try {
      const res = await checkoutPreview({ couponCode: couponCode.trim() });
      setPreview(res.data.checkout);
      toast.success('Coupon applied successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Invalid coupon code');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setPreview(null);
    toast.success('Coupon removed');
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
        theme: { color: '#6C5CE7' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Checkout failed');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const subtotal = cartSummary?.subtotal ?? cartItems.reduce((s, item) => {
    const price = item.currentPrice ?? item.course?.discountPrice ?? item.course?.price ?? 0;
    return s + price;
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-[Inter,sans-serif] py-8 text-gray-900 dark:text-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 animate-pulse">
          <div className="flex items-center gap-3.5 pb-6 border-b border-gray-200 dark:border-gray-800">
            <div className="w-11 h-11 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
            <div className="space-y-2">
              <div className="h-7 bg-gray-200 dark:bg-gray-800 rounded-xl w-36" />
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-lg w-24" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 xl:col-span-8 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-28 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-4" />
              ))}
            </div>
            <div className="lg:col-span-5 xl:col-span-4 h-80 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 space-y-4" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-[Inter,sans-serif] py-8 text-gray-900 dark:text-gray-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-xs">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                Shopping Cart
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {cartItems.length} course{cartItems.length !== 1 ? 's' : ''} ready for checkout
              </p>
            </div>
          </div>

          {cartItems.length > 0 && (
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <Link
                to="/courses"
                className="text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition inline-flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                <BookOpen className="w-4 h-4" /> Continue Shopping
              </Link>
              <button
                onClick={handleClear}
                id="clear-cart-btn"
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear Cart
              </button>
            </div>
          )}
        </div>

        {/* Empty State */}
        {cartItems.length === 0 ? (
          <div className="py-16 sm:py-20 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 shadow-xs max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Your cart is empty</h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1.5 max-w-sm mx-auto">
              Looks like you haven&apos;t added any courses yet. Discover top-rated courses and start learning today!
            </p>
            <Link
              to="/courses"
              className="mt-6 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm inline-flex items-center gap-2 shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5"
            >
              Browse Courses <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          /* Main Cart Content Grid */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Cart Items List */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-4">
              {cartItems.map((item) => {
                const course = item.course || item;
                const price = item.currentPrice ?? course?.discountPrice ?? course?.price ?? 0;
                const originalPrice = course?.price;
                const hasDiscount = originalPrice && price < originalPrice;
                const courseId = course?._id || item._id;
                // category may be a populated object { _id, name, slug } or a plain string
                const categoryName = course?.category
                  ? typeof course.category === 'object' ? course.category.name : course.category
                  : null;
                // instructor may be a populated object or a plain string
                const instructorName = course?.instructor
                  ? typeof course.instructor === 'object'
                    ? (course.instructor.fullName || course.instructor.name || 'Instructor')
                    : course.instructor
                  : 'Instructor';

                return (
                  <div
                    key={item._id || courseId}
                    className="group bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl border border-gray-200/90 dark:border-gray-800/90 p-4 sm:p-5 shadow-xs hover:border-purple-200 dark:hover:border-purple-900/50 transition flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5"
                  >
                    {/* Thumbnail */}
                    <div className="w-full sm:w-36 h-36 sm:h-24 rounded-xl sm:rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0 relative">
                      {course?.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title || 'Course'}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-600/20 to-indigo-600/20 flex items-center justify-center">
                          <BookOpen className="w-7 h-7 text-purple-500/70" />
                        </div>
                      )}
                    </div>

                    {/* Course Details */}
                    <div className="flex-1 min-w-0 space-y-1.5 w-full">
                      {categoryName && (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/40 uppercase tracking-wider">
                          {categoryName}
                        </span>
                      )}
                      <Link
                        to={`/courses/${course?.slug || courseId}`}
                        className="block text-sm sm:text-base font-bold text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition line-clamp-2"
                      >
                        {course?.title || 'Untitled Course'}
                      </Link>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        By <span className="font-medium text-gray-700 dark:text-gray-300">{instructorName}</span>
                      </p>
                      {item.priceChanged && (
                        <div className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                          Price updated since added
                        </div>
                      )}
                    </div>

                    {/* Price & Remove Action */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-800/80 gap-2 flex-shrink-0">
                      <div className="text-left sm:text-right">
                        <div className="text-base sm:text-lg font-black text-gray-900 dark:text-white tracking-tight">
                          {price === 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400">Free</span>
                          ) : (
                            `₹${price.toLocaleString()}`
                          )}
                        </div>
                        {hasDiscount && (
                          <div className="text-xs text-gray-400 dark:text-gray-500 line-through">
                            ₹{originalPrice.toLocaleString()}
                          </div>
                        )}
                      </div>

                      <button
                        className="p-2 rounded-xl text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        onClick={() => handleRemove(courseId)}
                        id={`remove-${item._id}-btn`}
                        title="Remove course from cart"
                        aria-label="Remove course"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary Card */}
            <div className="lg:col-span-5 xl:col-span-4 w-full">
              <div className="lg:sticky lg:top-24 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/90 dark:border-gray-800/90 p-6 shadow-sm space-y-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Order Summary
                </h3>

                {/* Coupon Code Input */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400">
                    Promotional Code
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Tag className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        className="w-full pl-9 pr-3 py-2 text-xs uppercase font-medium bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-gray-900 dark:text-white placeholder-gray-400"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value.toUpperCase())}
                        id="coupon-input"
                      />
                    </div>
                    <button
                      className="px-4 py-2 bg-gray-100 hover:bg-purple-50 dark:bg-gray-800 dark:hover:bg-purple-950/50 text-gray-700 hover:text-purple-600 dark:text-gray-300 dark:hover:text-purple-400 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-800 rounded-xl text-xs font-bold transition flex items-center justify-center min-w-[70px] disabled:opacity-50 cursor-pointer"
                      onClick={handlePreview}
                      disabled={previewLoading || !couponCode.trim()}
                      id="apply-coupon-btn"
                    >
                      {previewLoading ? <Spinner size="sm" /> : 'Apply'}
                    </button>
                  </div>

                  {preview && (
                    <div className="flex items-center justify-between mt-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50 rounded-xl text-xs text-purple-700 dark:text-purple-300">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        Coupon applied: <strong>{preview.coupon?.code || couponCode}</strong>
                      </span>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-gray-400 hover:text-rose-500 transition p-0.5"
                        title="Remove coupon"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Pricing Breakdown */}
                <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    <span>Subtotal ({cartItems.length} item{cartItems.length !== 1 ? 's' : ''})</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-200">
                      ₹{(preview ? (preview.pricing?.subtotal ?? 0) : subtotal).toLocaleString()}
                    </span>
                  </div>

                  {preview?.pricing?.discountAmount > 0 && (
                    <div className="flex justify-between text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Discount ({preview.coupon?.code || couponCode})
                      </span>
                      <span>−₹{preview.pricing.discountAmount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-baseline">
                    <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">Total</span>
                    <span className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400">
                      ₹{(preview ? (preview.pricing?.totalAmount ?? 0) : subtotal).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5 disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  id="checkout-btn"
                >
                  {checkoutLoading ? (
                    <Spinner size="sm" className="text-white" />
                  ) : (
                    <>
                      Proceed to Checkout <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Guarantee & Security Badges */}
                <div className="pt-2 text-center space-y-1.5">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1.5 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    Secure payment powered by Razorpay
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">
                    Instant lifetime access upon successful payment
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
