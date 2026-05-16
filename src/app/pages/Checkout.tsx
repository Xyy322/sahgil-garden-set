import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useCart, type CartItem } from "../components/CartContext";
import { db } from "../../utils/firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Card } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";

export function Checkout() {
  const { items, clearCart } = useCart();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [user, setUser] = useState<User | null>(null);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    paymentMethod: "cash",
  });

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // ✅ FIXED AUTH HANDLING (stable for hosting builds)
  useEffect(() => {
    const auth = getAuth();

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      setError("Your cart is empty");
      return;
    }

    if (!user) {
      setError("Please log in to place an order");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const orderData = {
  userId: user.uid,

  items: items.map(item => ({
    id: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    image: item.image,
  })),

  shippingInfo: {
    fullName: form.fullName,
    phone: form.phone,
    address: form.address,
    city: form.city,
    postalCode: form.postalCode,
  },

  total,

  paymentMethod: form.paymentMethod,

  status: "pending",

  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
};

      await addDoc(collection(db, "orders"), orderData);

      clearCart();
      navigate("/dashboard/customer");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to place order";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen py-12 px-4 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md w-full">
          <div className="mb-6 flex justify-center">
            <div className="p-4 rounded-full bg-stone-100">
              <AlertCircle className="w-8 h-8 text-stone-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-stone-900 mb-3">Checkout</h1>
          <p className="text-stone-600 mb-6">Your cart is empty.</p>
          <Button 
            onClick={() => navigate("/")}
            className="w-full"
          >
            Continue Shopping
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 bg-stone-50">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-stone-900">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ORDER SUMMARY */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 text-stone-900">Order Summary</h2>
              <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-start text-sm border-b border-stone-100 pb-3 gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-stone-900 truncate">{item.name}</div>
                      <div className="text-xs text-stone-500">Qty: {item.quantity}</div>
                    </div>
                    <span className="font-semibold text-stone-900 whitespace-nowrap">
                      ₱{(item.price * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-stone-200 pt-4">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-bold text-stone-900">Total:</span>
                  <span className="font-bold text-emerald-600 text-xl">
                    ₱{total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* CHECKOUT FORM */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-900">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <div>
                  <h3 className="text-lg font-semibold mb-4 text-stone-900">Shipping Information</h3>
                </div>

                <div>
                  <Label htmlFor="fullname">Full Name</Label>
                  <Input
                    id="fullname"
                    placeholder="John Doe"
                    value={form.fullName}
                    onChange={(e) =>
                      setForm({ ...form, fullName: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="09XX XXXX XXX"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="Street address"
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="Manila"
                      value={form.city}
                      onChange={(e) =>
                        setForm({ ...form, city: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="postalcode">Postal Code</Label>
                    <Input
                      id="postalcode"
                      placeholder="1000"
                      value={form.postalCode}
                      onChange={(e) =>
                        setForm({ ...form, postalCode: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4 text-stone-900">Payment Method</h3>
                  <div>
                    <Label htmlFor="payment">Select Payment Method</Label>
                    <Select value={form.paymentMethod} onValueChange={(value) =>
                      setForm({ ...form, paymentMethod: value })
                    }>
                      <SelectTrigger id="payment">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash on Delivery</SelectItem>
                        <SelectItem value="card">Card Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 text-base"
                >
                  {loading ? "Placing Order..." : "Place Order"}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}