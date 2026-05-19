import { useEffect, useMemo, useState, type ReactNode } from "react";
import { collection, onSnapshot, query, Timestamp } from "firebase/firestore";
import {
  CalendarDays,
  ClipboardList,
  PackageCheck,
  Printer,
  TrendingUp,
} from "lucide-react";

import { db } from "../../utils/firebase/config";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";

type OrderStatus =
  | "Pending"
  | "Processing"
  | "Shipped"
  | "Delivered"
  | "Cancelled";

interface ReportOrder {
  id: string;

  productSubtotal?: number;
  deliveryFee?: number | null;
  finalTotal?: number | null;

  // Legacy field. In this system, this means product subtotal only.
  total: number;

  status: OrderStatus;
  createdAt?: unknown;
}

interface ReportAppointment {
  id: string;
  status: "pending" | "approved" | "rejected" | "completed" | "cancelled";
  date?: string;
  createdAt?: unknown;
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

function normalizeAppointmentStatus(
  status: unknown
): ReportAppointment["status"] {
  if (status === "approved") return "approved";
  if (status === "rejected") return "rejected";
  if (status === "completed") return "completed";
  if (status === "cancelled") return "cancelled";
  return "pending";
}

function formatMoney(value: number): string {
  return `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getProductSubtotal(order: ReportOrder): number {
  return Number(order.productSubtotal ?? order.total) || 0;
}


function formatDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

function getMonthInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");

  return `${y}-${m}`;
}

function dateKeyFromUnknown(value: unknown): string {
  const millis = getTimestampMillis(value);
  if (!millis) return "";

  return formatDateInput(new Date(millis));
}

function monthKeyFromUnknown(value: unknown): string {
  const millis = getTimestampMillis(value);
  if (!millis) return "";

  return getMonthInput(new Date(millis));
}

export function AdminReports() {
  const { user, role, loading: authLoading } = useAuth();

  const today = new Date();

  const [orders, setOrders] = useState<ReportOrder[]>([]);
  const [appointments, setAppointments] = useState<ReportAppointment[]>([]);

  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(true);

  const [ordersError, setOrdersError] = useState("");
  const [appointmentsError, setAppointmentsError] = useState("");

  const [selectedDate, setSelectedDate] = useState(formatDateInput(today));
  const [selectedMonth, setSelectedMonth] = useState(getMonthInput(today));

  useEffect(() => {
    if (authLoading) return;

    if (!user || role !== "admin") {
      setOrders([]);
      setOrdersError("Only administrators can view reports.");
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
          const mapped: ReportOrder[] = snapshot.docs.map((document) => {
            const data = document.data();

            const productSubtotal = Number(data.productSubtotal ?? data.total) || 0;

            return {
              id: document.id,

              productSubtotal,

              deliveryFee:
                typeof data.deliveryFee === "number" &&
                Number.isFinite(data.deliveryFee)
                  ? data.deliveryFee
                  : null,

              finalTotal:
                typeof data.finalTotal === "number" &&
                Number.isFinite(data.finalTotal)
                  ? data.finalTotal
                  : null,

              // Legacy total means product subtotal only.
              total: productSubtotal,

              status: normalizeOrderStatus(data.status),
              createdAt: data.createdAt ?? null,
            };
          });

          setOrders(mapped);
          setOrdersError("");
        } catch (error) {
          console.error("Reports orders parsing error:", error);
          setOrders([]);
          setOrdersError("Some order records contain invalid data.");
        } finally {
          setLoadingOrders(false);
        }
      },
      (error) => {
        console.error("Reports orders listener error:", error);
        setOrders([]);
        setOrdersError(error.message || "Failed to load order reports.");
        setLoadingOrders(false);
      }
    );

    return () => unsubscribe();
  }, [authLoading, user, role]);

  useEffect(() => {
    if (authLoading) return;

    if (!user || role !== "admin") {
      setAppointments([]);
      setAppointmentsError("Only administrators can view reports.");
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
          const mapped: ReportAppointment[] = snapshot.docs.map((document) => {
            const data = document.data();

            return {
              id: document.id,
              status: normalizeAppointmentStatus(data.status),
              date: typeof data.date === "string" ? data.date : "",
              createdAt: data.createdAt ?? null,
            };
          });

          setAppointments(mapped);
          setAppointmentsError("");
        } catch (error) {
          console.error("Reports appointments parsing error:", error);
          setAppointments([]);
          setAppointmentsError("Some appointment records contain invalid data.");
        } finally {
          setLoadingAppointments(false);
        }
      },
      (error) => {
        console.error("Reports appointments listener error:", error);
        setAppointments([]);
        setAppointmentsError(
          error.message || "Failed to load appointment reports."
        );
        setLoadingAppointments(false);
      }
    );

    return () => unsubscribe();
  }, [authLoading, user, role]);

  const reportData = useMemo(() => {
    const dailyOrders = orders.filter(
      (order) => dateKeyFromUnknown(order.createdAt) === selectedDate
    );

    const monthlyOrders = orders.filter(
      (order) => monthKeyFromUnknown(order.createdAt) === selectedMonth
    );

    const dailyAppointments = appointments.filter((appointment) => {
      if (appointment.date) return appointment.date === selectedDate;
      return dateKeyFromUnknown(appointment.createdAt) === selectedDate;
    });

    const monthlyAppointments = appointments.filter((appointment) => {
      if (appointment.date) return appointment.date.startsWith(selectedMonth);
      return monthKeyFromUnknown(appointment.createdAt) === selectedMonth;
    });

    const dailyProductSales = dailyOrders
      .filter((order) => order.status !== "Cancelled")
      .reduce((sum, order) => sum + getProductSubtotal(order), 0);

    const monthlyProductSales = monthlyOrders
      .filter((order) => order.status !== "Cancelled")
      .reduce((sum, order) => sum + getProductSubtotal(order), 0);


    const countOrdersByStatus = (list: ReportOrder[], status: OrderStatus) =>
      list.filter((order) => order.status === status).length;

    const countAppointmentsByStatus = (
      list: ReportAppointment[],
      status: ReportAppointment["status"]
    ) => list.filter((appointment) => appointment.status === status).length;

    return {
      dailyOrders,
      monthlyOrders,
      dailyAppointments,
      monthlyAppointments,

      dailyProductSales,
monthlyProductSales,

      dailyPendingOrders: countOrdersByStatus(dailyOrders, "Pending"),
      dailyDeliveredOrders: countOrdersByStatus(dailyOrders, "Delivered"),
      monthlyPendingOrders: countOrdersByStatus(monthlyOrders, "Pending"),
      monthlyDeliveredOrders: countOrdersByStatus(monthlyOrders, "Delivered"),

      dailyPendingAppointments: countAppointmentsByStatus(
        dailyAppointments,
        "pending"
      ),
      dailyApprovedAppointments: countAppointmentsByStatus(
        dailyAppointments,
        "approved"
      ),
      dailyRejectedAppointments: countAppointmentsByStatus(
        dailyAppointments,
        "rejected"
      ),

      monthlyPendingAppointments: countAppointmentsByStatus(
        monthlyAppointments,
        "pending"
      ),
      monthlyApprovedAppointments: countAppointmentsByStatus(
        monthlyAppointments,
        "approved"
      ),
      monthlyRejectedAppointments: countAppointmentsByStatus(
        monthlyAppointments,
        "rejected"
      ),
      monthlyCompletedAppointments: countAppointmentsByStatus(
        monthlyAppointments,
        "completed"
      ),
    };
  }, [orders, appointments, selectedDate, selectedMonth]);

  if (authLoading || loadingOrders || loadingAppointments) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-muted-foreground">
        Loading reports...
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
    <div className="page-fade-in space-y-8 print:bg-white">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between print:border-none print:shadow-none">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Admin Reports
          </p>

          <h1 className="text-2xl font-bold text-card-foreground md:text-3xl">
            Daily and Monthly Report Summary
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Monitor orders, product sales, and landscaping appointment activity.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => window.print()}
          className="w-full gap-2 md:w-auto print:hidden"
        >
          <Printer className="h-4 w-4" />
          Print Report
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm md:grid-cols-2 print:border print:shadow-none">
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Daily Report Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Monthly Report
          </label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-800">
  Product Sales are based on product subtotals only. Delivery fees are excluded
  from product sales because they are treated as delivery-related charges for
  logistics expenses such as transportation, fuel, and labor. The customer final
  total may include a delivery fee, but sales reports focus only on actual
  product sales.
</div>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Daily Report</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ReportCard
            title="Daily Orders"
            value={reportData.dailyOrders.length}
            icon={<PackageCheck className="h-5 w-5" />}
          />

          <ReportCard
            title="Daily Product Sales"
            value={formatMoney(reportData.dailyProductSales)}
            icon={<TrendingUp className="h-5 w-5" />}
          />

          <ReportCard
            title="Daily Appointments"
            value={reportData.dailyAppointments.length}
            icon={<ClipboardList className="h-5 w-5" />}
          />

          <ReportCard
            title="Pending Appointments"
            value={reportData.dailyPendingAppointments}
            icon={<CalendarDays className="h-5 w-5" />}
          />
        </div>

        <ReportTable
  title="Daily Summary"
  rows={[
    ["Pending Orders", reportData.dailyPendingOrders],
    ["Delivered Orders", reportData.dailyDeliveredOrders],
    ["Product Sales", formatMoney(reportData.dailyProductSales)],
    ["Pending Appointments", reportData.dailyPendingAppointments],
    ["Approved Appointments", reportData.dailyApprovedAppointments],
    ["Rejected Appointments", reportData.dailyRejectedAppointments],
  ]}
/>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Monthly Report</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ReportCard
            title="Monthly Orders"
            value={reportData.monthlyOrders.length}
            icon={<PackageCheck className="h-5 w-5" />}
          />

          <ReportCard
            title="Monthly Product Sales"
            value={formatMoney(reportData.monthlyProductSales)}
            icon={<TrendingUp className="h-5 w-5" />}
          />

          <ReportCard
            title="Monthly Appointments"
            value={reportData.monthlyAppointments.length}
            icon={<ClipboardList className="h-5 w-5" />}
          />

          <ReportCard
            title="Completed Appointments"
            value={reportData.monthlyCompletedAppointments}
            icon={<CalendarDays className="h-5 w-5" />}
          />
        </div>

        <ReportTable
  title="Monthly Summary"
  rows={[
    ["Pending Orders", reportData.monthlyPendingOrders],
    ["Delivered Orders", reportData.monthlyDeliveredOrders],
    ["Product Sales", formatMoney(reportData.monthlyProductSales)],
    ["Pending Appointments", reportData.monthlyPendingAppointments],
    ["Approved Appointments", reportData.monthlyApprovedAppointments],
    ["Rejected Appointments", reportData.monthlyRejectedAppointments],
    ["Completed Appointments", reportData.monthlyCompletedAppointments],
  ]}
/>
      </section>
    </div>
  );
}

function ReportCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm print:shadow-none">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-primary">
        {icon}
      </div>

      <p className="text-sm text-muted-foreground">{title}</p>
      <h3 className="mt-1 text-2xl font-bold text-card-foreground">{value}</h3>
    </div>
  );
}

function ReportTable({
  title,
  rows,
}: {
  title: string;
  rows: Array<[string, string | number]>;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm print:shadow-none">
      <div className="border-b border-border px-5 py-4">
        <h3 className="font-semibold text-card-foreground">{title}</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-left">
          <tbody>
            {rows.map(([label, value]) => (
              <tr
                key={label}
                className="border-b border-border last:border-b-0"
              >
                <td className="px-5 py-3 text-sm text-muted-foreground">
                  {label}
                </td>
                <td className="px-5 py-3 text-right text-sm font-semibold text-card-foreground">
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}