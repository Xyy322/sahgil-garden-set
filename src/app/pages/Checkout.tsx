// The Checkout page handles the order placement process for users.
// It directly affects the system by creating new orders in the database and clearing the user's cart.
// This file integrates with Firebase for authentication and Firestore for order storage.
import { useState } from "react";
import { useNavigate } from "react-router";
import { useCart, type CartItem } from "../components/CartContext";
import { db } from "../../utils/firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";

export function Checkout() {
  // Access cart items and clearCart function from context.
  // This allows the checkout page to read the user's cart and clear it after a successful order.
  const { items, clearCart } = useCart();
  const navigate = useNavigate();
  // Loading and error state for async order placement.
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state for collecting shipping and payment details.
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    paymentMethod: "cash",
  });

  // Calculate the total price of all items in the cart.
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Handles form submission and order placement.
  // This function creates a new order in Firestore and clears the cart.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setError("Your cart is empty");
      return;
    }
    setLoading(true);
    setError("");

    try {
      // Wait for authentication state to resolve.
      const auth = getAuth();
const user = auth.currentUser;

if (!user) {
  setError("Please log in to place an order");
  setLoading(false);
  return;
}

// Prepare order data for Firestore
const orderData = {
  customerId: user.uid, // ✅ REQUIRED
  customerEmail: user.email,

  customerName: form.fullName,
  customerPhone: form.phone,

  shippingAddress: {
    street: form.address,
    city: form.city,
    postalCode: form.postalCode,
  },

  items: items.map((item: CartItem) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    image: item.image,
  })),

  total,
  status: "Pending",
  paymentMethod: form.paymentMethod,
  createdAt: serverTimestamp(),
  notes: "",
};

      // Add the order to Firestore.
      await addDoc(collection(db, "orders"), orderData);
      // Clear the cart after successful order.
      clearCart();
      // Redirect to customer dashboard.
      navigate("/dashboard/customer");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to place order";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#f9f7f4] py-12 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-4 text-center bg-white rounded-2xl shadow-sm border border-stone-100 p-8">
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Checkout</h1>
          <p className="text-stone-600 mb-6">Your cart is empty.</p>
          <button
            onClick={() => navigate("/")}
            className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f7f4] py-8 md:py-12">
      <div className="max-w-4xl mx-auto px-2 md:px-4">
        <h1 className="text-3xl font-bold text-stone-900 mb-6 md:mb-8">Checkout</h1>
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {/* Order Summary */}
          <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-stone-100 h-fit flex flex-col gap-4">
            <h2 className="text-lg md:text-xl font-bold text-stone-800 mb-2">Order Summary</h2>
            <ul className="divide-y divide-stone-100 mb-2">
              {items.map((item) => (
                <li key={item.id} className="py-3 flex justify-between items-center">
                  <div className="min-w-0">
                    <div className="font-medium text-stone-800 truncate">{item.name}</div>
                    <div className="text-xs text-stone-500">Qty: {item.quantity}</div>
                  </div>
                  <div className="font-semibold text-stone-900">₱{item.price * item.quantity}</div>
                </li>
              ))}
            </ul>
            <div className="border-t border-stone-100 pt-4 flex justify-between items-center">
              <span className="text-base font-bold">Total</span>
              <span className="text-xl font-bold text-emerald-600">₱{total}</span>
            </div>
          </div>
          {/* Shipping Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-stone-100 flex flex-col gap-4">
            <h2 className="text-lg md:text-xl font-bold text-stone-800 mb-2">Shipping Information</h2>
            {error && (
              <div className="mb-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
            )}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="John Doe"
                  autoComplete="name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="09xx xxx xxxx"
                  autoComplete="tel"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Address</label>
                <input
                  type="text"
                  required
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="123 Main St"
                  autoComplete="street-address"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="City"
                    autoComplete="address-level2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Postal Code</label>
                  <input
                    type="text"
                    required
                    value={form.postalCode}
                    onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Postal Code"
                    autoComplete="postal-code"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Payment Method</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={form.paymentMethod === "cash"}
                      onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-stone-700">Cash on Delivery</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={form.paymentMethod === "card"}
                      onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-stone-700">Card Payment</span>
                  </label>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-emerald-600 text-white rounded-lg font-bold text-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                aria-busy={loading}
              >
                {loading ? 'Placing Order...' : `Place Order - ₱${total}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
