import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  CreditCard,
  MapPin,
  PackageCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";

import { db } from "../../utils/firebase/config";
import { createNotification } from "../../utils/createNotification";
import { useCart } from "../components/CartContext";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";

type CheckoutForm = {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
};

type PlacedOrderSummary = {
  id: string;
  fullName: string;
  city: string;
  total: number;
};

function formatMoney(value: number): string {
  return `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function Checkout() {
  const { items, clearCart } = useCart();
  const navigate = useNavigate();
  const { user, profile, role, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [orderSuccess, setOrderSuccess] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrderSummary | null>(
    null
  );

  const [form, setForm] = useState<CheckoutForm>({
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

  const updateField = (field: keyof CheckoutForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
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
      const productSubtotal = total;

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

        productSubtotal,
        deliveryFee: null,
        finalTotal: null,

        // Legacy field kept for existing pages. This means product subtotal only.
        total: productSubtotal,

        paymentMethod: "Cash on Delivery",
        deliveryNote:
          "Delivery fee is not included and will be confirmed by the admin based on customer location.",
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

      setPlacedOrder({
        id: orderRef.id,
        fullName: cleanFullName,
        city: cleanCity,
        total: productSubtotal,
      });

      clearCart();

      toast.success("Order placed successfully", {
        description:
          "Your order was submitted. The delivery fee will be confirmed by the admin.",
      });

      setOrderSuccess(true);
    } catch (err) {
      console.error("Checkout error:", err);

      const message =
        err instanceof Error
          ? err.message
          : "Failed to place order. Please try again.";

      setError(message);

      toast.error("Checkout failed", {
        description: message,
      });
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

  if (orderSuccess && placedOrder) {
    return (
      <div className="min-h-screen bg-stone-50 px-4 py-10 flex items-center justify-center">
        <div className="max-w-md w-full rounded-3xl border border-stone-100 bg-white p-7 sm:p-10 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle className="h-10 w-10 text-emerald-600" />
          </div>

          <h1 className="mb-2 text-2xl font-bold text-stone-900">
            Order Placed!
          </h1>

          <p className="mb-2 text-stone-500">
            Thank you. Your order has been submitted successfully.
          </p>

          <p className="mb-8 rounded-lg border border-stone-100 bg-stone-50 px-4 py-2 font-mono text-xs text-stone-500">
            Order ID: {placedOrder.id.slice(0, 8).toUpperCase()}
          </p>

          <div className="mb-8 rounded-2xl border border-stone-100 bg-stone-50 p-4 text-left">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-500">
              Order Summary
            </p>

            <div className="space-y-2">
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-stone-500">Delivering to</span>
                <span className="text-right font-medium text-stone-800">
                  {placedOrder.fullName}
                </span>
              </div>

              <div className="flex justify-between gap-4 text-sm">
                <span className="text-stone-500">City</span>
                <span className="font-medium text-stone-800">
                  {placedOrder.city}
                </span>
              </div>

              <div className="flex justify-between gap-4 text-sm">
                <span className="text-stone-500">Payment</span>
                <span className="font-medium text-stone-800">
                  Cash on Delivery
                </span>
              </div>

              <div className="mt-2 flex justify-between gap-4 border-t border-stone-200 pt-3 text-sm">
                <span className="font-semibold text-stone-800">
                  Product Subtotal
                </span>

                <span className="font-bold text-emerald-600">
                  {formatMoney(placedOrder.total)}
                </span>
              </div>

              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
                Delivery fee is not included in the product subtotal. The admin
                will confirm the delivery fee based on your location.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => navigate("/dashboard/customer")}
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700"
            >
              View My Orders
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate("/services")}
              className="w-full rounded-xl"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50 px-4 py-10 flex items-center justify-center">
        <div className="max-w-md w-full rounded-3xl border border-stone-100 bg-white p-8 sm:p-10 text-center shadow-sm">
          <ShoppingBag className="mx-auto mb-4 h-14 w-14 text-stone-300" />

          <h1 className="mb-2 text-2xl font-bold text-stone-900">
            Your Cart is Empty
          </h1>

          <p className="mb-6 text-stone-500">
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
    <div className="min-h-screen bg-[#f9f7f4] px-4 py-8 md:py-12">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => navigate("/services")}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-emerald-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to products
        </button>

        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Checkout
          </p>

          <h1 className="mt-1 text-3xl font-bold text-stone-900 md:text-4xl">
            Complete Your Order
          </h1>

          <p className="mt-2 max-w-2xl text-stone-600">
            Review your order and provide your delivery information before
            placing your request.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <Card className="order-2 rounded-3xl border-stone-100 bg-white p-5 shadow-sm sm:p-7 md:p-8 lg:order-1 lg:col-span-2">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <MapPin className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-stone-900">
                  Shipping Information
                </h2>
                <p className="text-sm text-stone-500">
                  Please make sure your details are accurate.
                </p>
              </div>
            </div>

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
                  onChange={(e) => updateField("fullName", e.target.value)}
                  placeholder="Enter your full name"
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="09XX XXX XXXX"
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  placeholder="House no., street, barangay"
                  required
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    placeholder="City"
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={form.postalCode}
                    onChange={(e) => updateField("postalCode", e.target.value)}
                    placeholder="Postal code"
                    required
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <div className="flex items-start gap-3">
                  <CreditCard className="mt-0.5 h-5 w-5 text-emerald-700" />

                  <div>
                    <p className="text-sm font-semibold text-stone-800">
                      Payment Method
                    </p>
                    <p className="mt-1 text-sm text-stone-600">
                      Cash on Delivery. Payment will be settled upon delivery.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-xl bg-emerald-600 font-semibold hover:bg-emerald-700"
              >
                {loading ? "Placing Order..." : "Place Order"}
              </Button>
            </form>
          </Card>

          <Card className="order-1 h-fit rounded-3xl border-stone-100 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-28 lg:order-2">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100 text-stone-700">
                <PackageCheck className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-stone-900">
                  Order Summary
                </h2>
                <p className="text-sm text-stone-500">
                  {items.length} item{items.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            <div className="max-h-[360px] space-y-4 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-16 w-16 shrink-0 rounded-xl border border-stone-100 object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-stone-100">
                      <ShoppingBag className="h-6 w-6 text-stone-400" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-stone-800">
                      {item.name}
                    </p>

                    <p className="text-sm text-stone-500">
                      Qty: {item.quantity}
                    </p>

                    <p className="text-sm font-semibold text-stone-800">
                      {formatMoney(
                        Number(item.price) * Number(item.quantity || 1)
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 border-t border-stone-200 pt-5">
              <div className="mb-3 flex items-center gap-2 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-800">
                <Truck className="h-4 w-4 shrink-0" />
                <span>
                  Delivery fee is not included and will be confirmed by the shop
                  based on your location.
                </span>
              </div>

              <div className="flex justify-between text-base font-bold text-stone-900">
                <span>Product Subtotal</span>
                <span>{formatMoney(total)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}