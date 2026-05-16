import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import {
  PackageSearch,
  CalendarCheck,
  Clock,
  CheckCircle,
} from "lucide-react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  Timestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "../../utils/firebase/config";
import { createNotification } from "../../utils/createNotification";
import type { Product } from "../../types/product";
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis, Bar, BarChart } from "recharts";
import { ChartContainer, ChartTooltipContent } from "../components/ui/chart";
import { Appointment } from "../../utils/appointmentUtils";

type OrderStatus = "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";

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

export function AdminDashboard() {
  const navigate = useNavigate();

  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderData[]>([]);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState("");

  const [role, setRole] = useState<"admin" | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        setRole(userDoc.data().role as "admin");
      }
    });
    return () => unsub();
  }, [navigate]);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const mapped: OrderData[] = snap.docs.map((d) => {
          const data = d.data() as Omit<OrderData, "id">;
          return {
            id: d.id,
            ...data,
            items: normalizeItems(data.items),
          };
        });
        setOrders(mapped);
        setLoadingOrders(false);
        setOrdersError("");
      },
      (error) => {
        setOrdersError(error.message || "Failed to load orders");
        setLoadingOrders(false);
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "appointments"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const mapped: Appointment[] = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Appointment[];
        setAppointments(mapped);
        setLoadingAppointments(false);
        setAppointmentsError("");
      },
      (error) => {
        setAppointmentsError(error.message || "Failed to load appointments");
        setLoadingAppointments(false);
      }
    );
    return () => unsub();
  }, []);

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

  const pendingOrders = useMemo(
    () => orders.filter((o) => o.status === "Pending").length,
    [orders]
  );

  const dailyCurrentOrders = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return orders.filter((order) => {
      const orderDate = order.createdAt instanceof Timestamp
        ? order.createdAt.toDate()
        : order.createdAt instanceof Date
          ? order.createdAt
          : null;
      if (!orderDate) return false;
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    }).length;
  }, [orders]);

  const pendingAppointments = useMemo(
    () => appointments.filter((a) => a.status === "pending").length,
    [appointments]
  );

  const activeAppointments = useMemo(
    () => appointments.filter((a) => a.status === "approved").length,
    [appointments]
  );

  const ordersByDay = useMemo(() => {
    const grouped = new Map<
      string,
      { label: string; orders: number; timestamp: number }
    >();

    orders.forEach((order) => {
      const rawDate = order.createdAt;
      const date =
        rawDate instanceof Date
          ? rawDate
          : rawDate && "toDate" in rawDate
            ? rawDate.toDate()
            : null;

      if (!date) return;

      const isoDate = date.toISOString().slice(0, 10);
      const label = date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      const existing = grouped.get(isoDate);

      if (existing) {
        existing.orders += 1;
      } else {
        grouped.set(isoDate, {
          label,
          orders: 1,
          timestamp: date.getTime(),
        });
      }
    });

    return Array.from(grouped.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(({ label, orders }) => ({ date: label, orders }));
  }, [orders]);

  const appointmentsByDay = useMemo(() => {
    const grouped = new Map<
      string,
      { label: string; appointments: number; timestamp: number }
    >();

    appointments.forEach((appointment) => {
      const rawDate = (appointment as any).date;
      const date = rawDate instanceof Date ? rawDate : null;

      if (!date) return;

      const isoDate = date.toISOString().slice(0, 10);
      const label = date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      const existing = grouped.get(isoDate);

      if (existing) {
        existing.appointments += 1;
      } else {
        grouped.set(isoDate, {
          label,
          appointments: 1,
          timestamp: date.getTime(),
        });
      }
    });

    return Array.from(grouped.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(({ label, appointments }) => ({ date: label, appointments }));
  }, [appointments]);

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return;
      if (order.status === newStatus) return;

      setUpdatingOrderId(orderId);
      await updateDoc(doc(db, "orders", orderId), {
        status: newStatus,
        updatedAt: new Date(),
      });

      if (order.userId) {
        await createNotification({
          userId: order.userId,
          title: "Order status updated",
          message: `Your order ${order.orderNumber || order.id} is now ${newStatus}.`,
          type: "order",
          statusRefId: orderId,
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update status";
      setOrdersError(message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleLogout = async () => {
    await signOut(getAuth());
    navigate("/login");
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background text-primary">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pending Orders</p>
            <h3 className="text-2xl font-bold text-card-foreground">{pendingOrders}</h3>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background text-primary">
            <PackageSearch className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Daily Current Orders</p>
            <h3 className="text-2xl font-bold text-card-foreground">{dailyCurrentOrders}</h3>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background text-primary">
            <CalendarCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pending Appointments</p>
            <h3 className="text-2xl font-bold text-card-foreground">{pendingAppointments}</h3>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background text-primary">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Active Appointments</p>
            <h3 className="text-2xl font-bold text-card-foreground">{activeAppointments}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Orders Trend</p>
              <h3 className="text-lg font-semibold text-card-foreground">Daily Orders</h3>
            </div>
            <div className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground">
              Total {orders.length} orders
            </div>
          </div>
          <ChartContainer
            config={{ orders: { label: "Orders", color: "hsl(var(--primary))" } }}
            className="h-[320px] w-full min-w-0"
          >
            <BarChart data={ordersByDay} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} />
              <YAxis
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                domain={[0, "dataMax"]}
                interval={0}
              />
              <Tooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="orders"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Appointments Trend</p>
              <h3 className="text-lg font-semibold text-card-foreground">Daily Appointments</h3>
            </div>
            <div className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground">
              Total {appointments.length} appointments
            </div>
          </div>
          <ChartContainer
            config={{ appointments: { label: "Appointments", color: "hsl(var(--primary))" } }}
            className="h-[320px]"
          >
            <AreaChart data={appointmentsByDay} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="appointmentsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} />
              <YAxis
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                domain={[0, "dataMax"]}
                interval={0}
              />
              <Tooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="appointments"
                stroke="hsl(var(--primary))"
                fill="url(#appointmentsGradient)"
                strokeWidth={3}
                fillOpacity={1}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}
