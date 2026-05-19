import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import {
  AlertCircle,
  CalendarDays,
  CreditCard,
  Eye,
  Mail,
  MapPin,
  Package,
  PackageCheck,
  Phone,
  Search,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { db } from "../../utils/firebase/config";
import { createNotification } from "../../utils/createNotification";
import { useAuth } from "../context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

type OrderStatus =
  | "Pending"
  | "Processing"
  | "Shipped"
  | "Delivered"
  | "Cancelled";

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
  productSubtotal?: number;
deliveryFee?: number | null;
finalTotal?: number | null;
total?: number;
deliveryNote?: string;
  status?: OrderStatus;
  notes?: string;
  paymentMethod?: string;
  createdAt?: Timestamp | Date | string | null;
  shippingInfo?: {
    fullName?: string;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
  };
}

const STATUS_OPTIONS: OrderStatus[] = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

const ORDERS_PER_PAGE = 5;

function normalizeOrderStatus(status: unknown): OrderStatus {
  if (typeof status !== "string") return "Pending";

  const normalized = status.trim().toLowerCase();

  if (normalized === "pending") return "Pending";
  if (normalized === "processing") return "Processing";
  if (normalized === "shipped") return "Shipped";
  if (normalized === "delivered") return "Delivered";
  if (normalized === "cancelled" || normalized === "canceled") {
    return "Cancelled";
  }

  return "Pending";
}

function toFirestoreOrderStatus(status: OrderStatus): string {
  return status.toLowerCase();
}

function normalizePaymentMethod(method: unknown): string {
  if (typeof method !== "string") return "Cash on Delivery";

  const normalized = method.trim().toLowerCase();

  if (
    normalized === "cash" ||
    normalized === "cod" ||
    normalized === "cash on delivery"
  ) {
    return "Cash on Delivery";
  }

  return method;
}

function normalizeItems(raw: unknown): OrderItem[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => ({
      name: typeof item?.name === "string" ? item.name : "Unnamed item",
      quantity: Number(item?.quantity) || 1,
      price: Number(item?.price) || 0,
    }));
  }

  if (raw && typeof raw === "object") {
    const values = Object.values(raw as Record<string, unknown>);

    if (values.every((value) => typeof value === "object" && value !== null)) {
      return values.map((item: any) => ({
        name: typeof item?.name === "string" ? item.name : "Unnamed item",
        quantity: Number(item?.quantity) || 1,
        price: Number(item?.price) || 0,
      }));
    }
  }

  return [];
}

function getTimestampMillis(value: unknown): number {
  if (!value) return 0;

  if (value instanceof Timestamp) {
    return value.toMillis();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof (value as any)?.toMillis === "function") {
    return (value as any).toMillis();
  }

  if (typeof (value as any)?.toDate === "function") {
    return (value as any).toDate().getTime();
  }

  const parsed = new Date(value as string).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatDate(value: unknown): string {
  const millis = getTimestampMillis(value);

  if (!millis) return "N/A";

  return new Date(millis).toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMoney(value?: number): string {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "₱0.00";
  }

  return `₱${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function statusBadge(status?: OrderStatus): string {
  switch (status) {
    case "Processing":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Shipped":
      return "border-purple-200 bg-purple-50 text-purple-700";
    case "Delivered":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Cancelled":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function getProductSubtotal(order: OrderData): number {
  return Number(order.productSubtotal ?? order.total) || 0;
}

function getDeliveryFeeLabel(order: OrderData): string {
  if (typeof order.deliveryFee === "number" && Number.isFinite(order.deliveryFee)) {
    return formatMoney(order.deliveryFee);
  }

  return "To be confirmed";
}

function getFinalTotalLabel(order: OrderData): string {
  if (typeof order.finalTotal === "number" && Number.isFinite(order.finalTotal)) {
    return formatMoney(order.finalTotal);
  }

  if (
    typeof order.deliveryFee === "number" &&
    Number.isFinite(order.deliveryFee)
  ) {
    return formatMoney(getProductSubtotal(order) + order.deliveryFee);
  }

  return "To be confirmed";
}

function getDeliveryAddress(order: OrderData): string {
  if (order.shippingInfo?.address) {
    return `${order.shippingInfo.address}, ${order.shippingInfo.city || ""} ${
      order.shippingInfo.postalCode || ""
    }`.trim();
  }

  return order.address || "N/A";
}

export function AdminOrders() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | OrderStatus>("All");
const [currentPage, setCurrentPage] = useState(1);
const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);

  const { user, role, loading: authLoading } = useAuth();

  const selectedLiveOrder = selectedOrder
    ? orders.find((order) => order.id === selectedOrder.id) || selectedOrder
    : null;

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

    const ordersQuery = query(collection(db, "orders"));

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        try {
          const mapped: OrderData[] = snapshot.docs.map((document) => {
            const data = document.data() as Omit<OrderData, "id">;

            return {
              id: document.id,
              ...data,
              status: normalizeOrderStatus(data.status),
              paymentMethod: normalizePaymentMethod(data.paymentMethod),
              items: normalizeItems(data.items),
              productSubtotal: Number(data.productSubtotal ?? data.total) || 0,

deliveryFee:
  typeof data.deliveryFee === "number" && Number.isFinite(data.deliveryFee)
    ? data.deliveryFee
    : null,

finalTotal:
  typeof data.finalTotal === "number" && Number.isFinite(data.finalTotal)
    ? data.finalTotal
    : null,

// Legacy total means product subtotal only.
total: Number(data.productSubtotal ?? data.total) || 0,
            };
          });

          mapped.sort(
            (a, b) =>
              getTimestampMillis(b.createdAt) -
              getTimestampMillis(a.createdAt)
          );

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

    return () => unsubscribe();
  }, [authLoading, user, role]);

  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "All" || order.status === statusFilter;

      const itemText =
        order.items
          ?.map((item) => `${item.name || ""} ${item.quantity || ""}`)
          .join(" ") || "";

      const shippingText = [
        order.shippingInfo?.fullName,
        order.shippingInfo?.phone,
        order.shippingInfo?.address,
        order.shippingInfo?.city,
        order.shippingInfo?.postalCode,
      ]
        .filter(Boolean)
        .join(" ");

      const searchableText = [
        order.orderNumber,
        order.customerName,
        order.customerEmail,
        order.customerPhone,
        order.itemSummary,
        order.paymentMethod,
        order.status,
        order.address,
        order.id,
        shippingText,
        itemText,
        formatMoney(getProductSubtotal(order)),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !term || searchableText.includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [orders, searchTerm, statusFilter]);

  const totalPages = Math.max(
  1,
  Math.ceil(filteredOrders.length / ORDERS_PER_PAGE)
);

const pageStartIndex = (currentPage - 1) * ORDERS_PER_PAGE;
const pageEndIndex = Math.min(
  pageStartIndex + ORDERS_PER_PAGE,
  filteredOrders.length
);

const paginatedOrders = filteredOrders.slice(pageStartIndex, pageEndIndex);

useEffect(() => {
  setCurrentPage(1);
}, [searchTerm, statusFilter]);

useEffect(() => {
  setCurrentPage((prev) => Math.min(prev, totalPages));
}, [totalPages]);

  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter((order) => order.status === "Pending").length,
      processing: orders.filter((order) => order.status === "Processing")
        .length,
      delivered: orders.filter((order) => order.status === "Delivered").length,
      revenue: orders
  .filter((order) => order.status !== "Cancelled")
  .reduce((sum, order) => sum + getProductSubtotal(order), 0),
    };
  }, [orders]);

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const order = orders.find((item) => item.id === orderId);

      if (!order) return;
      if (order.status === newStatus) return;

      setUpdatingOrderId(orderId);
      setOrdersError("");

      await updateDoc(doc(db, "orders", orderId), {
        status: toFirestoreOrderStatus(newStatus),
        updatedAt: serverTimestamp(),
      });

      if (order.userId) {
        await createNotification({
          userId: order.userId,
          title: "Order Update",
          message: `Your order is now ${newStatus}.`,
          type: "order",
          statusRefId: orderId,
        });
      }
      toast.success("Order status updated", {
  description: `Order is now ${newStatus}.`,
});
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update status";
      setOrdersError(message);

toast.error("Failed to update order", {
  description: message,
});
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (authLoading || loadingOrders) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-muted-foreground">
        Loading orders...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Order Management
        </p>

        <h1 className="mt-1 text-2xl font-bold text-card-foreground md:text-3xl">
          Customer Orders
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Review customer purchases, delivery details, payment method, and order
          status.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        <SummaryCard
          label="Total Orders"
          value={stats.total}
          icon={<Package className="h-5 w-5" />}
        />
        <SummaryCard
          label="Pending"
          value={stats.pending}
          icon={<CalendarDays className="h-5 w-5" />}
        />
        <SummaryCard
          label="Processing"
          value={stats.processing}
          icon={<PackageCheck className="h-5 w-5" />}
        />
        <SummaryCard
          label="Delivered"
          value={stats.delivered}
          icon={<PackageCheck className="h-5 w-5" />}
        />
        <SummaryCard
          label="Product Sales"
          value={formatMoney(stats.revenue)}
          icon={<CreditCard className="h-5 w-5" />}
        />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-card-foreground">
              Recent Orders
            </h2>
            <p className="text-sm text-muted-foreground">
              Showing{" "}
{filteredOrders.length === 0
  ? "0"
  : `${pageStartIndex + 1}-${pageEndIndex}`}{" "}
of {filteredOrders.length} filtered order
{filteredOrders.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search order, customer, item, phone, address..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "All" | OrderStatus)
              }
              className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              aria-label="Filter orders by status"
            >
              <option value="All">All Status</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {ordersError && (
          <div className="mb-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{ordersError}</span>
          </div>
        )}

        {filteredOrders.length === 0 ? (
          <div className="rounded-xl border border-border bg-background py-10 text-center text-sm text-muted-foreground">
            No orders found.
          </div>
        ) : (
          <div className="max-h-[720px] space-y-3 overflow-y-auto pr-2">
            {paginatedOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-border bg-background p-4 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">
                        {order.orderNumber || `Order #${order.id.slice(0, 8)}`}
                      </p>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge(
                          order.status
                        )}`}
                      >
                        {order.status || "Pending"}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {order.shippingInfo?.fullName ||
                        order.customerName ||
                        "Unknown Customer"}{" "}
                      • {formatDate(order.createdAt)}
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {order.items?.length || 0} item
                      {(order.items?.length || 0) === 1 ? "" : "s"} •{" "}
                      {formatMoney(getProductSubtotal(order))}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <select
                      className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                      value={order.status || "Pending"}
                      disabled={updatingOrderId === order.id}
                      onChange={(event) =>
                        updateOrderStatus(
                          order.id,
                          event.target.value as OrderStatus
                        )
                      }
                      aria-label="Update order status"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
                    </div>
        )}

        {filteredOrders.length > ORDERS_PER_PAGE && (
          <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              <button
                type="button"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={!!selectedOrder}
        onOpenChange={(open) => {
          if (!open) setSelectedOrder(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Complete information about the selected customer order.
            </DialogDescription>
          </DialogHeader>

          {selectedLiveOrder && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-border bg-background p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Order</p>
                    <h3 className="text-lg font-bold text-foreground">
                      {selectedLiveOrder.orderNumber ||
                        `Order #${selectedLiveOrder.id.slice(0, 8)}`}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Created: {formatDate(selectedLiveOrder.createdAt)}
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge(
                      selectedLiveOrder.status
                    )}`}
                  >
                    {selectedLiveOrder.status || "Pending"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <InfoBox
                  title="Customer"
                  icon={<UserRound className="h-4 w-4" />}
                >
                  <InfoRow
                    label="Name"
                    value={
                      selectedLiveOrder.shippingInfo?.fullName ||
                      selectedLiveOrder.customerName ||
                      "N/A"
                    }
                  />
                  <InfoRow
                    label="Email"
                    value={selectedLiveOrder.customerEmail || "N/A"}
                    icon={<Mail className="h-4 w-4" />}
                  />
                  <InfoRow
                    label="Phone"
                    value={
                      selectedLiveOrder.shippingInfo?.phone ||
                      selectedLiveOrder.customerPhone ||
                      "N/A"
                    }
                    icon={<Phone className="h-4 w-4" />}
                  />
                </InfoBox>

                <InfoBox
                  title="Delivery"
                  icon={<MapPin className="h-4 w-4" />}
                >
                  <p className="text-sm leading-relaxed text-foreground">
                    {getDeliveryAddress(selectedLiveOrder)}
                  </p>
                </InfoBox>

                <InfoBox
                  title="Payment"
                  icon={<CreditCard className="h-4 w-4" />}
                >
                  <InfoRow
                    label="Method"
                    value={selectedLiveOrder.paymentMethod || "N/A"}
                  />
                  <InfoRow
  label="Product Subtotal"
  value={formatMoney(getProductSubtotal(selectedLiveOrder))}
  strong
/>

<InfoRow
  label="Delivery Fee"
  value={getDeliveryFeeLabel(selectedLiveOrder)}
/>

<InfoRow
  label="Final Total"
  value={getFinalTotalLabel(selectedLiveOrder)}
/>
                </InfoBox>

              </div>
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-800">
  Delivery fee is not automatically computed because it depends on the
  customer’s location. The displayed amount is the product subtotal only until
  the admin confirms the delivery fee.
</div>
              {Array.isArray(selectedLiveOrder.items) &&
                selectedLiveOrder.items.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-semibold text-foreground">
                      Items
                    </p>

                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className="w-full min-w-[520px] text-sm">
                        <thead>
                          <tr className="border-b border-border bg-card text-left text-muted-foreground">
                            <th className="px-3 py-3">Name</th>
                            <th className="px-3 py-3">Qty</th>
                            <th className="px-3 py-3 text-right">
                              Unit Price
                            </th>
                            <th className="px-3 py-3 text-right">Subtotal</th>
                          </tr>
                        </thead>

                        <tbody>
                          {selectedLiveOrder.items.map((item, index) => {
                            const quantity = Number(item.quantity) || 1;
                            const price = Number(item.price) || 0;

                            return (
                              <tr
                                key={`${selectedLiveOrder.id}-${index}`}
                                className="border-b border-border last:border-b-0"
                              >
                                <td className="px-3 py-3 text-foreground">
                                  {item.name || "Unnamed item"}
                                </td>
                                <td className="px-3 py-3 text-foreground">
                                  {quantity}
                                </td>
                                <td className="px-3 py-3 text-right text-foreground">
                                  {formatMoney(price)}
                                </td>
                                <td className="px-3 py-3 text-right font-semibold text-foreground">
                                  {formatMoney(price * quantity)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-primary">
        {icon}
      </div>

      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <h3 className="mt-1 break-words text-xl font-bold leading-tight text-card-foreground md:text-2xl">
        {value}
      </h3>
    </div>
  );
}

function InfoBox({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-card-foreground">
        <span className="text-primary">{icon}</span>
        {title}
      </div>

      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon,
  strong = false,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </span>

      <span
        className={`text-right ${
          strong ? "font-bold text-primary" : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}