import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { AlertCircle, CheckCircle, ShoppingBag } from "lucide-react";

import { db } from "../../utils/firebase/config";
import { createNotification } from "../../utils/createNotification";
import { useCart } from "../components/CartContext";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";

export function Checkout() {
  const { items, clearCart } = useCart();
  const navigate = useNavigate();
  const { user, profile, role, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [orderId, setOrderId] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
  });

  const total = items.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
    0
  );

  useEffect(() => {
    if (authLoading || !user || role !== "customer") {
      return;
    }

    setForm((prev) => ({
      ...prev,
      fullName: prev.fullName || profile?.fullName || user.displayName || "",
      phone: prev.phone || profile?.phoneNumber || "",
      address: prev.address || profile?.address || "",
    }));
  }, [authLoading, user, role, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (authLoading) {
      setError("Please wait while your account is being verified.");
      return;
    }

    if (!user || role !== "customer") {
      setError("Only logged-in customers can place orders.");
      return;
    }

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    const cleanFullName = form.fullName.trim();
    const cleanPhone = form.phone.trim();
    const cleanAddress = form.address.trim();
    const cleanCity = form.city.trim();
    const cleanPostalCode = form.postalCode.trim();

    if (
      !cleanFullName ||
      !cleanPhone ||
      !cleanAddress ||
      !cleanCity ||
      !cleanPostalCode
    ) {
      setError("Please complete all shipping information.");
      return;
    }

    if (!Number.isFinite(total) || total <= 0) {
      setError("Invalid order total.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const orderData = {
        userId: user.uid,
        orderNumber: `SGS-${Date.now()}`,

        customerName: cleanFullName,
        customerEmail: user.email || profile?.email || "",
        customerPhone: cleanPhone,
        address: `${cleanAddress}, ${cleanCity} ${cleanPostalCode}`,

        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 1,
          image: item.image || "",
        })),

        shippingInfo: {
          fullName: cleanFullName,
          phone: cleanPhone,
          address: cleanAddress,
          city: cleanCity,
          postalCode: cleanPostalCode,
        },

        total,
        paymentMethod: "Cash on Delivery",
        status: "Pending",

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const orderRef = await addDoc(collection(db, "orders"), orderData);

      await createNotification({
        userId: user.uid,
        title: "Order placed",
        message: "Your order has been placed successfully.",
        type: "order",
        statusRefId: orderRef.id,
      });

      await createNotification({
        userId: "admin",
        title: "New order received",
        message: `${cleanFullName} placed a new order.`,
        type: "order",
        statusRefId: orderRef.id,
      });

      clearCart();
      setOrderId(orderRef.id);
      setOrderSuccess(true);
    } catch (err) {
      console.error("Checkout error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to place order. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 text-stone-600">
        Loading checkout...
      </div>
    );
  }

  if (!user || role !== "customer") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
        <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
          Only logged-in customers can access checkout.
        </div>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen py-12 px-4 flex items-center justify-center bg-stone-50">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-stone-100 p-10 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>

          <h1 className="text-2xl font-bold text-stone-900 mb-2">
            Order Placed!
          </h1>

          <p className="text-stone-500 mb-2">Thank you for your order.</p>

          <p className="text-xs text-stone-400 font-mono bg-stone-50 rounded-lg px-4 py-2 mb-8 border border-stone-100">
            Order ID: {orderId.slice(0, 8).toUpperCase()}
          </p>

          <div className="bg-stone-50 rounded-2xl p-4 mb-8 text-left border border-stone-100">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">
              Order Summary
            </p>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Delivering to</span>
                <span className="font-medium text-stone-800">
                  {form.fullName}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-stone-500">City</span>
                <span className="font-medium text-stone-800">{form.city}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Payment</span>
                <span className="font-medium text-stone-800">
                  Cash on Delivery
                </span>
              </div>

              <div className="flex justify-between text-sm border-t border-stone-200 pt-2 mt-2">
                <span className="font-semibold text-stone-800">Total</span>
                <span className="font-bold text-emerald-600">
                  ₱
                  {total.toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate("/dashboard/customer")}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors"
            >
              View My Orders
            </button>

            <button
              onClick={() => navigate("/services")}
              className="w-full py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-medium transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen py-12 px-4 flex items-center justify-center bg-stone-50">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-stone-100 p-10 text-center">
          <ShoppingBag className="w-14 h-14 text-stone-300 mx-auto mb-4" />

          <h1 className="text-2xl font-bold text-stone-900 mb-2">
            Your Cart is Empty
          </h1>

          <p className="text-stone-500 mb-6">
            Add products to your cart before checking out.
          </p>

          <Button onClick={() => navigate("/services")} className="w-full">
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f7f4] py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-900">Checkout</h1>
          <p className="text-stone-600 mt-1">
            Complete your shipping details to place your order.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm({ ...form, fullName: e.target.value })
                  }
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="09XX XXX XXXX"
                  required
                />
              </div>

              <div>
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  placeholder="House no., street, barangay"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="City"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={form.postalCode}
                    onChange={(e) =>
                      setForm({ ...form, postalCode: e.target.value })
                    }
                    placeholder="Postal code"
                    required
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <p className="text-sm font-semibold text-stone-800">
                  Payment Method
                </p>
                <p className="text-sm text-stone-600 mt-1">
                  Cash on Delivery
                </p>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Placing Order..." : "Place Order"}
              </Button>
            </form>
          </Card>

          <Card className="p-6 h-fit">
            <h2 className="text-lg font-bold text-stone-900 mb-4">
              Order Summary
            </h2>

            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-xl border border-stone-100"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-stone-100 flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-stone-400" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-800 truncate">
                      {item.name}
                    </p>
                    <p className="text-sm text-stone-500">
                      Qty: {item.quantity}
                    </p>
                    <p className="text-sm font-semibold text-stone-800">
                      ₱
                      {(Number(item.price) * Number(item.quantity)).toLocaleString(
                        "en-PH",
                        { minimumFractionDigits: 2 }
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-stone-200 mt-5 pt-5">
              <div className="flex justify-between text-base font-bold text-stone-900">
                <span>Total</span>
                <span>
                  ₱
                  {total.toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}