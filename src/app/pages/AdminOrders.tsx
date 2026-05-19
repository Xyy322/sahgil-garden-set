import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../utils/firebase/config";
import { createNotification } from "../../utils/createNotification";
import { useAuth } from "../context/AuthContext";

type OrderStatus = "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";

function normalizeOrderStatus(status: unknown): OrderStatus {
  if (typeof status !== "string") return "Pending";

  const normalized = status.trim().toLowerCase();

  if (normalized === "pending") return "Pending";
  if (normalized === "processing") return "Processing";
  if (normalized === "shipped") return "Shipped";
  if (normalized === "delivered") return "Delivered";
  if (normalized === "cancelled" || normalized === "canceled") return "Cancelled";

  return "Pending";
}

function toFirestoreOrderStatus(status: OrderStatus): string {
  return status.toLowerCase();
}

function normalizePaymentMethod(method: unknown): string {
  if (typeof method !== "string") return "Cash on Delivery";

  const normalized = method.trim().toLowerCase();

  if (normalized === "cash" || normalized === "cod" || normalized === "cash on delivery") {
    return "Cash on Delivery";
  }

  return method;
} 

interface OrderItem {
  name?: string;
  quantity?: number;
  price?: number;
}

interface OrderData {
  id: string;
  orderNumber?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  userId?: string;
  address?: string;
  items?: OrderItem[];
  itemSummary?: string;
  total?: number;
  status?: OrderStatus;
  notes?: string;
  paymentMethod?: string;
  createdAt?: Timestamp | Date | null;
  // ADD inside the OrderData interface:
shippingInfo?: {
  fullName?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
};
}

const STATUS_OPTIONS: OrderStatus[] = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

function statusBadge(status?: string): string {
  switch (status) {
    case "Processing":
      return "bg-accent text-accent-foreground border-border";
    case "Shipped":
      return "bg-secondary text-secondary-foreground border-border";
    case "Delivered":
      return "bg-primary/10 text-primary border-border";
    case "Cancelled":
      return "bg-destructive/10 text-destructive border-border";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function normalizeItems(raw: unknown): OrderItem[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const values = Object.values(raw as Record<string, unknown>);
    if (values.every((v) => typeof v === "object" && v !== null)) {
      return values as OrderItem[];
    }
  }
  return [];
}

function formatDate(value: OrderData["createdAt"]): string {
  if (!value) return "N/A";
  if (value instanceof Timestamp) return value.toDate().toLocaleString();
  if (value instanceof Date) return value.toLocaleString();
  return "N/A";
}

function formatMoney(value?: number): string {
  if (typeof value !== "number") return "N/A";
  return `₱${value.toFixed(2)}`;
}

export function AdminOrders() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const { user, role, loading: authLoading } = useAuth();

  useEffect(() => {
  if (authLoading) {
    return;
  }

  if (!user) {
    setOrders([]);
    setOrdersError("You must be logged in as admin to view orders.");
    setLoadingOrders(false);
    return;
  }

  if (role !== "admin") {
    setOrders([]);
    setOrdersError("Access denied. Only administrators can view all orders.");
    setLoadingOrders(false);
    return;
  }

  setLoadingOrders(true);
  setOrdersError("");

  const q = query(collection(db, "orders"));

  const unsub = onSnapshot(
    q,
    (snap) => {
      try {
        const mapped: OrderData[] = snap.docs.map((d) => {
          const data = d.data() as Omit<OrderData, "id">;

          return {
  id: d.id,
  ...data,
  status: normalizeOrderStatus(data.status),
  paymentMethod: normalizePaymentMethod(data.paymentMethod),
  items: normalizeItems(data.items),
};
        });

        mapped.sort((a, b) => {
          const aTime =
            a.createdAt instanceof Timestamp
              ? a.createdAt.toDate().getTime()
              : a.createdAt instanceof Date
              ? a.createdAt.getTime()
              : 0;

          const bTime =
            b.createdAt instanceof Timestamp
              ? b.createdAt.toDate().getTime()
              : b.createdAt instanceof Date
              ? b.createdAt.getTime()
              : 0;

          return bTime - aTime;
        });

        setOrders(mapped);
        setOrdersError("");
      } catch (error) {
        console.error("Order parsing error:", error);
        setOrdersError("Some order records contain invalid data.");
      } finally {
        setLoadingOrders(false);
      }
    },
    (error) => {
      console.error("Orders listener error:", error);
      setOrders([]);
      setOrdersError(error.message || "Failed to load orders.");
      setLoadingOrders(false);
    }
  );

  return () => unsub();
}, [authLoading, user, role]);

  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return orders;
    return orders.filter((o) =>
      [
        o.orderNumber,
        o.customerName,
        o.customerEmail,
        o.customerPhone,
        o.itemSummary,
        o.status,
        o.id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [orders, searchTerm]);

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return;
      if (order.status === newStatus) return;

      setUpdatingOrderId(orderId);

      await updateDoc(doc(db, "orders", orderId), {
  status: toFirestoreOrderStatus(newStatus),
  updatedAt: serverTimestamp(),
});

      if (order.userId && newStatus !== order.status) {
        await createNotification({
          userId: order.userId,
          title: "Order Update",
          message: `Your order is now ${newStatus}`,
          type: "order",
          statusRefId: orderId,
        });
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update status";
      setOrdersError(message);
    } finally {
      setUpdatingOrderId(null);
    }
  };


  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-card-foreground">Recent Orders</h2>
            <p className="text-sm text-muted-foreground">Review and update customer order lifecycle statuses.</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            />
          </div>
        </div>

        {ordersError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 font-medium">
            {ordersError}
          </div>
        )}
        {loadingOrders && <div className="text-sm text-muted-foreground">Loading orders…</div>}
        {!loadingOrders && filteredOrders.length === 0 && (
          <div className="rounded-xl border border-border bg-background py-8 text-center text-sm text-muted-foreground">No orders found.</div>
        )}

        {!loadingOrders && filteredOrders.length > 0 && (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <div key={order.id} className="rounded-2xl border border-border bg-background p-4 sm:p-6 flex flex-col gap-4 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">{order.orderNumber || order.id}</p>
                    <h3 className="text-lg font-semibold text-foreground">{order.customerName || "Unknown Customer"}</h3>
                    <p className="text-sm text-muted-foreground">{order.customerEmail || "No email provided"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${statusBadge(order.status)}`}>{order.status || "Pending"}</span>
                    <select
                      className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                      value={order.status || "Pending"}
                      disabled={updatingOrderId === order.id}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                      aria-label="Update order status"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                  <div className="rounded-xl border border-border bg-card p-3 flex flex-col gap-1">
                    <p className="mb-1 font-semibold text-card-foreground">Order Details</p>
                    <p><span className="text-muted-foreground">Items:</span> <span className="text-foreground">{order.items && order.items.length > 0 ? order.items.map(i => `${i.name} x${i.quantity}`).join(', ') : "N/A"}</span></p>
                    <p><span className="text-muted-foreground">Total:</span> <span className="text-foreground">{formatMoney(order.total)}</span></p>
                    <p><span className="text-muted-foreground">Payment:</span> <span className="text-foreground">{order.paymentMethod || "N/A"}</span></p>
                    <p><span className="text-muted-foreground">Created:</span> <span className="text-foreground">{formatDate(order.createdAt)}</span></p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-3 flex flex-col gap-1">
                    <p className="mb-1 font-semibold text-card-foreground">Customer Details</p>
                    <p><span className="text-muted-foreground">Name:</span> <span className="text-foreground">{order.shippingInfo?.fullName || order.customerName || "N/A"}</span></p>
<p><span className="text-muted-foreground">Phone:</span> <span className="text-foreground">{order.shippingInfo?.phone || order.customerPhone || "N/A"}</span></p>
<p><span className="text-muted-foreground">Address:</span> <span className="text-foreground">{order.shippingInfo?.address ? `${order.shippingInfo.address}, ${order.shippingInfo.city} ${order.shippingInfo.postalCode}` : order.address || "N/A"}</span></p>
                  </div>
                </div>

                {Array.isArray(order.items) && order.items.length > 0 && (
                  <div className="mt-2">
                    <p className="mb-2 text-sm font-semibold text-foreground">Items</p>
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-card text-left text-muted-foreground">
                            <th className="px-3 py-2">Name</th>
                            <th className="px-3 py-2">Qty</th>
                            <th className="px-3 py-2 text-right">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item, idx) => (
                            <tr key={`${order.id}-${idx}`} className="border-b border-border last:border-b-0">
                              <td className="px-3 py-2 text-foreground">{item.name || "Unnamed item"}</td>
                              <td className="px-3 py-2 text-foreground">{item.quantity ?? "-"}</td>
                              <td className="px-3 py-2 text-right text-foreground">{formatMoney(item.price)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex justify-end border-t border-border pt-3 mt-2">
  <span className="text-xs text-muted-foreground">
    {order.createdAt instanceof Object && 'toDate' in order.createdAt
      ? order.createdAt.toDate().toLocaleDateString()
      : 'N/A'}
  </span>
</div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}