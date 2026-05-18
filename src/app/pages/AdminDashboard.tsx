import { useEffect, useMemo, useState } from "react";
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
  query,
  updateDoc,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
} from "recharts";

import { useAuth } from "../context/AuthContext";
import { db } from "../../utils/firebase/config";
import { createNotification } from "../../utils/createNotification";
import { ChartContainer, ChartTooltipContent } from "../components/ui/chart";
import type { Appointment } from "../../utils/appointmentUtils";

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
  total?: number;
  status?: OrderStatus;
  notes?: string;
  paymentMethod?: string;
  createdAt?: Timestamp | Date | string | null;
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

function normalizeAppointment(id: string, data: any): Appointment {
  return {
    id,
    userId: typeof data.userId === "string" ? data.userId : "",
    date: typeof data.date === "string" ? data.date : "",
    time: typeof data.time === "string" ? data.time : "",
    status:
      data.status === "pending" ||
      data.status === "approved" ||
      data.status === "rejected" ||
      data.status === "completed" ||
      data.status === "cancelled"
        ? data.status
        : "pending",
  } as Appointment;
}

export function AdminDashboard() {
  const { user, role, loading: authLoading } = useAuth();

  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [orders, setOrders] = useState<OrderData[]>([]);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState("");

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
      setOrdersError("Only administrators can view orders.");
      setLoadingOrders(false);
      return;
    }

    setLoadingOrders(true);
    setOrdersError("");

    const q = query(collection(db, "orders"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const mapped: OrderData[] = snapshot.docs.map((document) => {
            const data = document.data() as Omit<OrderData, "id">;

            return {
              id: document.id,
              ...data,
              items: normalizeItems(data.items),
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
          console.error("Admin dashboard order parsing error:", error);
          setOrders([]);
          setOrdersError("Some order records contain invalid data.");
        } finally {
          setLoadingOrders(false);
        }
      },
      (error) => {
        console.error("Admin dashboard orders listener error:", error);
        setOrders([]);
        setOrdersError(error.message || "Failed to load orders.");
        setLoadingOrders(false);
      }
    );

    return () => unsubscribe();
  }, [authLoading, user, role]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setAppointments([]);
      setAppointmentsError(
        "You must be logged in as admin to view appointments."
      );
      setLoadingAppointments(false);
      return;
    }

    if (role !== "admin") {
      setAppointments([]);
      setAppointmentsError("Only administrators can view appointments.");
      setLoadingAppointments(false);
      return;
    }

    setLoadingAppointments(true);
    setAppointmentsError("");

    const q = query(collection(db, "appointments"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const mapped = snapshot.docs.map((document) =>
            normalizeAppointment(document.id, document.data())
          );

          setAppointments(mapped);
          setAppointmentsError("");
        } catch (error) {
          console.error("Admin dashboard appointment parsing error:", error);
          setAppointments([]);
          setAppointmentsError("Some appointment records contain invalid data.");
        } finally {
          setLoadingAppointments(false);
        }
      },
      (error) => {
        console.error("Admin dashboard appointments listener error:", error);
        setAppointments([]);
        setAppointmentsError(error.message || "Failed to load appointments.");
        setLoadingAppointments(false);
      }
    );

    return () => unsubscribe();
  }, [authLoading, user, role]);

  const pendingOrders = useMemo(
    () => orders.filter((order) => order.status === "Pending").length,
    [orders]
  );

  const dailyCurrentOrders = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return orders.filter((order) => {
      const millis = getTimestampMillis(order.createdAt);
      if (!millis) return false;

      const orderDate = new Date(millis);
      orderDate.setHours(0, 0, 0, 0);

      return orderDate.getTime() === today.getTime();
    }).length;
  }, [orders]);

  const pendingAppointments = useMemo(
    () =>
      appointments.filter((appointment) => appointment.status === "pending")
        .length,
    [appointments]
  );

  const activeAppointments = useMemo(
    () =>
      appointments.filter((appointment) => appointment.status === "approved")
        .length,
    [appointments]
  );

  const ordersByDay = useMemo(() => {
    const grouped = new Map<
      string,
      { label: string; orders: number; timestamp: number }
    >();

    orders.forEach((order) => {
      const millis = getTimestampMillis(order.createdAt);
      if (!millis) return;

      const date = new Date(millis);
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
      const rawDate = appointment.date;

      if (
        typeof rawDate !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(rawDate)
      ) {
        return;
      }

      const date = new Date(`${rawDate}T00:00:00`);

      if (Number.isNaN(date.getTime())) {
        return;
      }

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

  const updateOrderStatus = async (
    orderId: string,
    newStatus: OrderStatus
  ) => {
    try {
      const order = orders.find((item) => item.id === orderId);

      if (!order) return;
      if (order.status === newStatus) return;

      await updateDoc(doc(db, "orders", orderId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      if (order.userId) {
        await createNotification({
          userId: order.userId,
          title: "Order status updated",
          message: `Your order ${
            order.orderNumber || order.id
          } is now ${newStatus}.`,
          type: "order",
          statusRefId: orderId,
        });
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to update status";
      setOrdersError(message);
    }
  };

  if (authLoading || loadingOrders || loadingAppointments) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-border bg-card p-10 text-muted-foreground">
        Loading dashboard...
      </div>
    );
  }

  if (ordersError || appointmentsError) {
    return (
      <div className="space-y-3">
        {ordersError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            {ordersError}
          </div>
        )}

        {appointmentsError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            {appointmentsError}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background text-primary">
            <Clock className="h-6 w-6" />
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Pending Orders
            </p>
            <h3 className="text-2xl font-bold text-card-foreground">
              {pendingOrders}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background text-primary">
            <PackageSearch className="h-6 w-6" />
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Daily Current Orders
            </p>
            <h3 className="text-2xl font-bold text-card-foreground">
              {dailyCurrentOrders}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background text-primary">
            <CalendarCheck className="h-6 w-6" />
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Pending Appointments
            </p>
            <h3 className="text-2xl font-bold text-card-foreground">
              {pendingAppointments}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background text-primary">
            <CheckCircle className="h-6 w-6" />
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Active Appointments
            </p>
            <h3 className="text-2xl font-bold text-card-foreground">
              {activeAppointments}
            </h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Orders Trend</p>
              <h3 className="text-lg font-semibold text-card-foreground">
                Daily Orders
              </h3>
            </div>

            <div className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground">
              Total {orders.length} orders
            </div>
          </div>

          <ChartContainer
            config={{
              orders: { label: "Orders", color: "hsl(var(--primary))" },
            }}
            className="h-[320px] w-full min-w-0"
          >
            {ordersByDay.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No order data yet.
              </div>
            ) : (
              <BarChart
                data={ordersByDay}
                margin={{ top: 10, right: 12, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
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
            )}
          </ChartContainer>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Appointments Trend
              </p>
              <h3 className="text-lg font-semibold text-card-foreground">
                Daily Appointments
              </h3>
            </div>

            <div className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground">
              Total {appointments.length} appointments
            </div>
          </div>

          <ChartContainer
            config={{
              appointments: {
                label: "Appointments",
                color: "hsl(var(--primary))",
              },
            }}
            className="h-[320px]"
          >
            {appointmentsByDay.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No appointment data yet.
              </div>
            ) : (
              <AreaChart
                data={appointmentsByDay}
                margin={{ top: 10, right: 24, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="appointmentsGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
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
            )}
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}