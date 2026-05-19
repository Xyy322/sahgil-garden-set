import { useEffect, useMemo, useState, Children, type ReactNode } from "react";
import {
  collection,
  onSnapshot,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import {
  CalendarDays,
  Mail,
  MapPin,
  Package,
  Phone,
  Search,
  UserRound,
} from "lucide-react";

import { db } from "../../utils/firebase/config";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

interface CustomerRecord {
  id: string;
  uid: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  address: string;
  createdAt?: unknown;
}

interface CustomerOrder {
  id: string;
  total: number;
  status: string;
  paymentMethod: string;
  createdAt?: unknown;
}

interface CustomerAppointment {
  id: string;
  date: string;
  time: string;
  status: string;
  serviceType: string;
  createdAt?: unknown;
}

interface CustomerInquiry {
  id: string;
  inquiryType: string;
  message: string;
  adminRead?: boolean;
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

function formatDate(value: unknown): string {
  const millis = getTimestampMillis(value);

  if (!millis) return "No date";

  return new Date(millis).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatMoney(value: number): string {
  return `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function normalizeCustomer(id: string, data: any): CustomerRecord {
  return {
    id,
    uid: typeof data.uid === "string" ? data.uid : id,
    email: typeof data.email === "string" ? data.email : "No email",
    fullName:
      typeof data.fullName === "string" && data.fullName.trim()
        ? data.fullName
        : "Unnamed customer",
    phoneNumber:
      typeof data.phoneNumber === "string" && data.phoneNumber.trim()
        ? data.phoneNumber
        : "No phone",
    address:
      typeof data.address === "string" && data.address.trim()
        ? data.address
        : "No address",
    createdAt: data.createdAt ?? null,
  };
}

function normalizeOrder(id: string, data: any): CustomerOrder {
  return {
    id,
    total: Number(data.total) || 0,
    status: typeof data.status === "string" ? data.status : "Pending",
    paymentMethod:
      typeof data.paymentMethod === "string"
        ? data.paymentMethod
        : "Cash on Delivery",
    createdAt: data.createdAt ?? null,
  };
}

function normalizeAppointment(id: string, data: any): CustomerAppointment {
  return {
    id,
    date: typeof data.date === "string" ? data.date : "",
    time: typeof data.time === "string" ? data.time : "",
    status: typeof data.status === "string" ? data.status : "pending",
    serviceType:
      typeof data.serviceType === "string"
        ? data.serviceType
        : "landscaping-consultation",
    createdAt: data.createdAt ?? null,
  };
}

function normalizeInquiry(id: string, data: any): CustomerInquiry {
  return {
    id,
    inquiryType:
      typeof data.inquiryType === "string" ? data.inquiryType : "General",
    message: typeof data.message === "string" ? data.message : "",
    adminRead: data.adminRead === true,
    createdAt: data.createdAt ?? null,
  };
}

function statusBadgeClass(status: string) {
  const value = status.toLowerCase();

  if (value === "pending") return "bg-amber-100 text-amber-700";
  if (value === "approved" || value === "processing")
    return "bg-blue-100 text-blue-700";
  if (value === "delivered" || value === "completed")
    return "bg-emerald-100 text-emerald-700";
  if (value === "rejected" || value === "cancelled" || value === "canceled")
    return "bg-red-100 text-red-700";

  return "bg-stone-100 text-stone-700";
}

export function AdminUsers() {
  const { user, role, loading: authLoading } = useAuth();

  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerRecord | null>(null);

  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [appointments, setAppointments] = useState<CustomerAppointment[]>([]);
  const [inquiries, setInquiries] = useState<CustomerInquiry[]>([]);

  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user || role !== "admin") {
      setCustomers([]);
      setError("Only administrators can view customer records.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const q = query(collection(db, "users"), where("role", "==", "customer"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const mapped = snapshot.docs
            .map((document) => normalizeCustomer(document.id, document.data()))
            .sort(
              (a, b) =>
                getTimestampMillis(b.createdAt) -
                getTimestampMillis(a.createdAt)
            );

          setCustomers(mapped);
          setError("");
        } catch (err) {
          console.error("Customer records parsing error:", err);
          setCustomers([]);
          setError("Some customer records contain invalid data.");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error("Customer records listener error:", err);
        setCustomers([]);
        setError(err.message || "Failed to load customer records.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [authLoading, user, role]);

  useEffect(() => {
    if (!selectedCustomer) {
      setOrders([]);
      setAppointments([]);
      setInquiries([]);
      setDetailsError("");
      setDetailsLoading(false);
      return;
    }

    setDetailsLoading(true);
    setDetailsError("");

    let loadedOrders = false;
    let loadedAppointments = false;
    let loadedInquiries = false;

    const finishLoading = () => {
      if (loadedOrders && loadedAppointments && loadedInquiries) {
        setDetailsLoading(false);
      }
    };

    const ordersQuery = query(
      collection(db, "orders"),
      where("userId", "==", selectedCustomer.uid)
    );

    const appointmentsQuery = query(
      collection(db, "appointments"),
      where("userId", "==", selectedCustomer.uid)
    );

    const inquiriesQuery = query(
      collection(db, "inquiries"),
      where("userId", "==", selectedCustomer.uid)
    );

    const unsubscribeOrders = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const mapped = snapshot.docs
          .map((document) => normalizeOrder(document.id, document.data()))
          .sort(
            (a, b) =>
              getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt)
          );

        setOrders(mapped);
        loadedOrders = true;
        finishLoading();
      },
      (err) => {
        console.error("Customer order records error:", err);
        setDetailsError(err.message || "Failed to load customer orders.");
        loadedOrders = true;
        finishLoading();
      }
    );

    const unsubscribeAppointments = onSnapshot(
      appointmentsQuery,
      (snapshot) => {
        const mapped = snapshot.docs
          .map((document) =>
            normalizeAppointment(document.id, document.data())
          )
          .sort(
            (a, b) =>
              getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt)
          );

        setAppointments(mapped);
        loadedAppointments = true;
        finishLoading();
      },
      (err) => {
        console.error("Customer appointment records error:", err);
        setDetailsError(
          err.message || "Failed to load customer appointments."
        );
        loadedAppointments = true;
        finishLoading();
      }
    );

    const unsubscribeInquiries = onSnapshot(
      inquiriesQuery,
      (snapshot) => {
        const mapped = snapshot.docs
          .map((document) => normalizeInquiry(document.id, document.data()))
          .sort(
            (a, b) =>
              getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt)
          );

        setInquiries(mapped);
        loadedInquiries = true;
        finishLoading();
      },
      (err) => {
        console.error("Customer inquiry records error:", err);
        setDetailsError(err.message || "Failed to load customer inquiries.");
        loadedInquiries = true;
        finishLoading();
      }
    );

    return () => {
      unsubscribeOrders();
      unsubscribeAppointments();
      unsubscribeInquiries();
    };
  }, [selectedCustomer]);

  const filteredCustomers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return customers.filter((item) => {
      return (
        !keyword ||
        item.fullName.toLowerCase().includes(keyword) ||
        item.email.toLowerCase().includes(keyword) ||
        item.phoneNumber.toLowerCase().includes(keyword) ||
        item.address.toLowerCase().includes(keyword)
      );
    });
  }, [customers, searchTerm]);

  if (authLoading || loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-muted-foreground">
        Loading customer records...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Customer Records
        </p>

        <h1 className="mt-1 text-2xl font-bold text-card-foreground md:text-3xl">
          Customer Record Monitoring
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          View customer profile details and related records in one place. This
          module is read-only for account security.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Total Customers" value={customers.length} />
        <SummaryCard
          label="With Phone Number"
          value={
            customers.filter((item) => item.phoneNumber !== "No phone").length
          }
        />
        <SummaryCard
          label="With Address"
          value={
            customers.filter((item) => item.address !== "No address").length
          }
        />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search customer name, email, phone, or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
          No customer records found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {filteredCustomers.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-primary">
                    <UserRound className="h-6 w-6" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-semibold text-card-foreground">
                      {item.fullName}
                    </h3>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Registered: {formatDate(item.createdAt)}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedCustomer(item)}
                  className="w-full sm:w-auto"
                >
                  View Details
                </Button>
              </div>

              <div className="mt-5 space-y-3 rounded-xl border border-border bg-background p-4 text-sm">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="break-all text-foreground">{item.email}</span>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-foreground">{item.phoneNumber}</span>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-foreground">{item.address}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={!!selectedCustomer}
        onOpenChange={(open) => {
          if (!open) setSelectedCustomer(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Customer Record Details</DialogTitle>
            <DialogDescription>
              Read-only view of this customer’s profile, orders, appointments,
              and inquiries.
            </DialogDescription>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-background p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-primary">
                    <UserRound className="h-6 w-6" />
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground">
                      {selectedCustomer.fullName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedCustomer.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedCustomer.phoneNumber}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedCustomer.address}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <SummaryCard label="Orders" value={orders.length} />
                <SummaryCard label="Appointments" value={appointments.length} />
                <SummaryCard label="Inquiries" value={inquiries.length} />
              </div>

              {detailsError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {detailsError}
                </div>
              )}

              {detailsLoading ? (
                <div className="rounded-xl border border-border bg-card p-6 text-muted-foreground">
                  Loading customer records...
                </div>
              ) : (
                <>
                  <RecordSection
                    title="Order History"
                    icon={<Package className="h-5 w-5" />}
                    emptyText="No orders found for this customer."
                  >
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="rounded-xl border border-border bg-background p-4"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-semibold text-foreground">
                              Order #{order.id.slice(0, 8).toUpperCase()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(order.createdAt)}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(
                                order.status
                              )}`}
                            >
                              {order.status}
                            </span>

                            <span className="font-bold text-primary">
                              {formatMoney(order.total)}
                            </span>
                          </div>
                        </div>

                        <p className="mt-2 text-sm text-muted-foreground">
                          Payment: {order.paymentMethod}
                        </p>
                      </div>
                    ))}
                  </RecordSection>

                  <RecordSection
                    title="Appointment History"
                    icon={<CalendarDays className="h-5 w-5" />}
                    emptyText="No appointments found for this customer."
                  >
                    {appointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="rounded-xl border border-border bg-background p-4"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-semibold text-foreground">
                              {appointment.date || "No date"}{" "}
                              {appointment.time ? `at ${appointment.time}` : ""}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {appointment.serviceType}
                            </p>
                          </div>

                          <span
                            className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(
                              appointment.status
                            )}`}
                          >
                            {appointment.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </RecordSection>

                  <RecordSection
                    title="Inquiry History"
                    icon={<Mail className="h-5 w-5" />}
                    emptyText="No inquiries found for this customer."
                  >
                    {inquiries.map((inquiry) => (
                      <div
                        key={inquiry.id}
                        className="rounded-xl border border-border bg-background p-4"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-semibold text-foreground">
                              {inquiry.inquiryType}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(inquiry.createdAt)}
                            </p>
                          </div>

                          <span
  className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
    inquiry.adminRead
      ? "bg-stone-100 text-stone-700"
      : "bg-red-100 text-red-700"
  }`}
>
  {inquiry.adminRead ? "Read by Admin" : "Unread"}
</span>
                        </div>

                        <p className="mt-3 rounded-lg bg-card p-3 text-sm text-muted-foreground">
                          {inquiry.message || "No message provided."}
                        </p>
                      </div>
                    ))}
                  </RecordSection>
                </>
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
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <h3 className="mt-1 text-2xl font-bold text-card-foreground">{value}</h3>
    </div>
  );
}

function RecordSection({
  title,
  icon,
  emptyText,
  children,
}: {
  title: string;
  icon: ReactNode;
  emptyText: string;
  children: ReactNode;
}) {
  const hasItems = Children.count(children) > 0;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="text-primary">{icon}</div>
        <h4 className="font-semibold text-foreground">{title}</h4>
      </div>

      {hasItems ? (
        <div className="space-y-3">{children}</div>
      ) : (
        <div className="rounded-xl border border-border bg-background p-5 text-sm text-muted-foreground">
          {emptyText}
        </div>
      )}
    </section>
  );
}