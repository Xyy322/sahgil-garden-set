import {
  Package,
  Calendar,
  MapPin,
  Search,
  ChevronDown,
  ChevronUp,
  Truck,
  CheckCircle,
  Package as PackageIcon,
  CreditCard,
  AlertCircle,
  Leaf,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { db } from "../../utils/firebase/config";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

import { useCart } from "../components/CartContext";
import { Cart } from "../components/Cart";
import {
  Appointment,
  formatTime,
  formatDisplayDate,
  getBlockedDates,
  parseDateKey,
} from "../../utils/appointmentUtils";
import { useAuth } from "../context/AuthContext";
import { createNotification } from "../../utils/createNotification";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";

type Order = {
  id: string;
  userId: string;
  shippingInfo: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
  };
  total: number;
  status: string;
  paymentMethod: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  createdAt: unknown;
};

const ORDER_STEPS = [
  { key: "Pending", label: "Order Placed", icon: PackageIcon },
  { key: "Processing", label: "Processing", icon: PackageIcon },
  { key: "Shipped", label: "Shipped", icon: Truck },
  { key: "Delivered", label: "Delivered", icon: CheckCircle },
];

function getStatusStep(status: string): number {
  const index = ORDER_STEPS.findIndex(
    (step) => step.key.toLowerCase() === status?.toLowerCase()
  );

  return index >= 0 ? index : 0;
}

function normalizeCustomerOrderStatus(status: unknown): string {
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

function normalizeCustomerPaymentMethod(method: unknown): string {
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

function getTimeMillis(value: any): number {
  if (!value) return 0;

  if (typeof value?.toMillis === "function") {
    return value.toMillis();
  }

  if (typeof value?.toDate === "function") {
    return value.toDate().getTime();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function normalizeOrderItem(item: any) {
  return {
    id: typeof item?.id === "string" ? item.id : crypto.randomUUID(),
    name: typeof item?.name === "string" ? item.name : "Unnamed Item",
    price: Number(item?.price) || 0,
    quantity: Number(item?.quantity) || 1,
    image: typeof item?.image === "string" ? item.image : "",
  };
}

function normalizeOrder(id: string, data: any): Order {
  const shippingInfo = data.shippingInfo || {};

  return {
    id,
    userId: typeof data.userId === "string" ? data.userId : "",
    shippingInfo: {
      fullName:
        typeof shippingInfo.fullName === "string"
          ? shippingInfo.fullName
          : typeof data.customerName === "string"
          ? data.customerName
          : "",
      phone:
        typeof shippingInfo.phone === "string"
          ? shippingInfo.phone
          : typeof data.customerPhone === "string"
          ? data.customerPhone
          : "",
      address:
        typeof shippingInfo.address === "string"
          ? shippingInfo.address
          : typeof data.address === "string"
          ? data.address
          : "",
      city: typeof shippingInfo.city === "string" ? shippingInfo.city : "",
      postalCode:
        typeof shippingInfo.postalCode === "string"
          ? shippingInfo.postalCode
          : "",
    },
    total: Number(data.total) || 0,
    status: normalizeCustomerOrderStatus(data.status),
    paymentMethod: normalizeCustomerPaymentMethod(data.paymentMethod),
    items: Array.isArray(data.items) ? data.items.map(normalizeOrderItem) : [],
    createdAt: data.createdAt ?? null,
  };
}

function normalizeAppointment(id: string, data: any): Appointment {
  return {
    id,
    userId: typeof data.userId === "string" ? data.userId : "",
    customerName:
      typeof data.customerName === "string" ? data.customerName : "",
    customerEmail:
      typeof data.customerEmail === "string" ? data.customerEmail : "",
    customerPhone:
      typeof data.customerPhone === "string" ? data.customerPhone : "",
    date:
      typeof data.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data.date)
        ? data.date
        : "",
    time:
      typeof data.time === "string" && /^\d{2}:\d{2}$/.test(data.time)
        ? data.time
        : "",
    serviceType: "landscaping-consultation",
    description: typeof data.description === "string" ? data.description : "",
    status:
      data.status === "pending" ||
      data.status === "approved" ||
      data.status === "rejected" ||
      data.status === "completed" ||
      data.status === "cancelled"
        ? data.status
        : "pending",
    lockDates: Array.isArray(data.lockDates)
      ? data.lockDates.filter(
          (date: unknown) =>
            typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)
        )
      : [],
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

function getStatusClass(status: string) {
  const normalized = status.trim().toLowerCase();

  if (normalized === "pending") {
    return "bg-amber-100 text-amber-700";
  }

  if (normalized === "processing") {
    return "bg-blue-100 text-blue-700";
  }

  if (normalized === "shipped") {
    return "bg-purple-100 text-purple-700";
  }

  if (normalized === "delivered") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (normalized === "cancelled" || normalized === "canceled") {
    return "bg-red-100 text-red-700";
  }

  return "bg-stone-100 text-stone-700";
}

function getAppointmentStatusClass(status: unknown) {
  if (status === "pending") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  if (status === "approved") {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }

  if (status === "completed") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  if (status === "rejected") {
    return "bg-red-50 text-red-700 border-red-200";
  }

  if (status === "cancelled") {
    return "bg-stone-100 text-stone-600 border-stone-200";
  }

  return "bg-stone-100 text-stone-700 border-stone-200";
}

function formatStatus(status: unknown) {
  const value = typeof status === "string" && status.trim() ? status : "pending";

  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function CustomerDashboard() {
  const { addItem } = useCart();
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(true);

  const [ordersError, setOrdersError] = useState("");
  const [appointmentsError, setAppointmentsError] = useState("");

  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [expandedAppointment, setExpandedAppointment] = useState<string | null>(
    null
  );

  const [cancelAppointmentId, setCancelAppointmentId] = useState<string | null>(
    null
  );
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user || role !== "customer") {
      setOrders([]);
      setAppointments([]);
      setLoadingOrders(false);
      setLoadingAppointments(false);
    }
  }, [authLoading, user, role]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user?.uid || role !== "customer") {
      setOrders([]);
      setLoadingOrders(false);
      return;
    }

    setLoadingOrders(true);
    setOrdersError("");

    const q = query(collection(db, "orders"), where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const fetchedOrders = snapshot.docs
            .map((docSnap) => normalizeOrder(docSnap.id, docSnap.data()))
            .sort((a, b) => getTimeMillis(b.createdAt) - getTimeMillis(a.createdAt));

          setOrders(fetchedOrders);
          setOrdersError("");
        } catch (error) {
          console.error("Customer order parsing error:", error);
          setOrders([]);
          setOrdersError("Some order records contain invalid data.");
        } finally {
          setLoadingOrders(false);
        }
      },
      (error) => {
        console.error("Error fetching orders:", error);
        setOrders([]);
        setOrdersError(error.message || "Failed to load orders.");
        setLoadingOrders(false);
      }
    );

    return () => unsubscribe();
  }, [authLoading, user?.uid, role]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user?.uid || role !== "customer") {
      setAppointments([]);
      setLoadingAppointments(false);
      return;
    }

    setLoadingAppointments(true);
    setAppointmentsError("");

    const q = query(
      collection(db, "appointments"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const fetchedAppointments = snapshot.docs
            .map((docSnap) =>
              normalizeAppointment(docSnap.id, docSnap.data())
            )
            .sort((a, b) => {
              const dateA = typeof a.date === "string" ? a.date : "";
              const dateB = typeof b.date === "string" ? b.date : "";

              return dateB.localeCompare(dateA);
            });

          setAppointments(fetchedAppointments);
          setAppointmentsError("");
        } catch (error) {
          console.error("Customer appointment parsing error:", error);
          setAppointments([]);
          setAppointmentsError("Some appointment records contain invalid data.");
        } finally {
          setLoadingAppointments(false);
        }
      },
      (error) => {
        console.error("Error fetching appointments:", error);
        setAppointments([]);
        setAppointmentsError(error.message || "Failed to load appointments.");
        setLoadingAppointments(false);
      }
    );

    return () => unsubscribe();
  }, [authLoading, user?.uid, role]);

  const handleConfirmCancel = async () => {
    if (!cancelAppointmentId) return;

    const appointment = appointments.find(
      (item) => item.id === cancelAppointmentId
    );

    if (!appointment) {
      setCancelAppointmentId(null);
      return;
    }

    setCancelling(true);
    setAppointmentsError("");

    try {
      const lockDates =
        appointment.lockDates && appointment.lockDates.length > 0
          ? appointment.lockDates
          : appointment.date
          ? getBlockedDates(parseDateKey(appointment.date))
          : [];

      const batch = writeBatch(db);

      batch.update(doc(db, "appointments", cancelAppointmentId), {
        status: "cancelled",
        updatedAt: serverTimestamp(),
      });

      lockDates.forEach((date) => {
        batch.delete(doc(db, "appointmentLocks", date));
      });

      await batch.commit();

      if (user?.uid) {
        await createNotification({
          userId: user.uid,
          title: "Appointment Update",
          message: "Your appointment has been cancelled.",
          type: "appointment",
          statusRefId: cancelAppointmentId,
        });
      }

      setCancelAppointmentId(null);
      setExpandedAppointment(null);
    } catch (error) {
      console.error("Cancel appointment error:", error);
      setAppointmentsError(
        error instanceof Error
          ? error.message
          : "Failed to cancel appointment."
      );
    } finally {
      setCancelling(false);
    }
  };

  const userName = user?.email ? user.email.split("@")[0] : "Customer";

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-stone-600">
        Loading dashboard...
      </div>
    );
  }

  if (!user || role !== "customer") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9f7f4] px-4">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
          Only logged-in customers can view this dashboard.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f9f7f4] min-h-screen py-12 relative z-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-stone-800">
              Welcome back, {userName}!
            </h1>
            <p className="text-stone-600 mt-1">
              Manage your orders and landscaping appointments.
            </p>
          </div>
        </div>

        {(ordersError || appointmentsError) && (
          <div className="mb-6 space-y-3">
            {ordersError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {ordersError}
              </div>
            )}

            {appointmentsError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {appointmentsError}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-stone-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-600" />
                  Recent Furniture Orders
                </h2>
              </div>

              <div className="space-y-5">
                {loadingOrders ? (
                  <div className="text-center py-8 text-stone-500">
                    Loading orders...
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8 text-stone-500">
                    No orders yet. Start shopping to see your orders here!
                  </div>
                ) : (
                  orders.slice(0, 5).map((order) => {
                    const currentStep = getStatusStep(order.status);
                    const isExpanded = expandedOrder === order.id;

                    return (
                      <div
                        key={order.id}
                        className="border border-stone-100 rounded-2xl overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedOrder(isExpanded ? null : order.id)
                          }
                          className="w-full text-left p-4 bg-stone-50 hover:bg-stone-100 transition-colors"
                          aria-expanded={isExpanded}
                          aria-controls={`order-details-${order.id}`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                <PackageIcon className="w-6 h-6 text-emerald-600" />
                              </div>

                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-bold text-stone-800">
                                    Order #{order.id.slice(0, 8)}
                                  </h3>

                                  <span
                                    className={`px-3 py-1 text-xs font-bold rounded-full ${getStatusClass(
                                      order.status
                                    )}`}
                                  >
                                    {order.status || "Pending"}
                                  </span>

                                  {isExpanded ? (
                                    <ChevronUp className="w-5 h-5 text-stone-400" />
                                  ) : (
                                    <ChevronDown className="w-5 h-5 text-stone-400" />
                                  )}
                                </div>

                                <p className="text-sm text-stone-500 mt-1">
                                  {order.items.length} item
                                  {order.items.length > 1 ? "s" : ""}
                                </p>
                              </div>
                            </div>

                            <div className="flex justify-between items-end mt-4 sm:mt-0">
                              <span className="font-bold text-stone-800">
                                ₱
                                {order.total.toLocaleString("en-PH", {
                                  minimumFractionDigits: 2,
                                })}
                              </span>
                            </div>
                          </div>
                        </button>

                        {isExpanded && (
                          <div
                            id={`order-details-${order.id}`}
                            className="border-t border-stone-100 p-4 bg-stone-50"
                          >
                            <div className="mb-6">
                              <h4 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
                                <Truck className="w-4 h-4" />
                                Order Tracking
                              </h4>

                              <div className="overflow-x-auto pb-2">
                                <div className="flex items-center justify-between min-w-[400px]">
                                  {ORDER_STEPS.map((step, index) => {
                                    const StepIcon = step.icon;
                                    const isCompleted = index <= currentStep;
                                    const isCurrent = index === currentStep;

                                    return (
                                      <div
                                        key={step.key}
                                        className="flex flex-col items-center flex-1 relative"
                                      >
                                        {index > 0 && (
                                          <div
                                            className={`absolute top-4 sm:top-5 -left-1/2 w-full h-0.5 ${
                                              index <= currentStep
                                                ? "bg-emerald-500"
                                                : "bg-stone-200"
                                            }`}
                                          />
                                        )}

                                        <div
                                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center z-10 ${
                                            isCompleted
                                              ? "bg-emerald-500 text-white"
                                              : "bg-stone-200 text-stone-400"
                                          }`}
                                        >
                                          <StepIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </div>

                                        <span
                                          className={`text-xs mt-2 text-center ${
                                            isCurrent
                                              ? "font-bold text-emerald-600"
                                              : isCompleted
                                              ? "text-stone-600"
                                              : "text-stone-400"
                                          }`}
                                        >
                                          {step.label}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-white p-4 rounded-xl">
                                <h4 className="font-bold text-stone-800 mb-2 flex items-center gap-2">
                                  <MapPin className="w-4 h-4" />
                                  Shipping Address
                                </h4>
                                <p className="text-sm text-stone-600">
                                  {order.shippingInfo.fullName || "No name"}
                                  <br />
                                  {order.shippingInfo.address || "No address"}
                                  <br />
                                  {order.shippingInfo.city}
                                  {order.shippingInfo.city &&
                                  order.shippingInfo.postalCode
                                    ? ", "
                                    : ""}
                                  {order.shippingInfo.postalCode}
                                </p>
                              </div>

                              <div className="bg-white p-4 rounded-xl">
                                <h4 className="font-bold text-stone-800 mb-2 flex items-center gap-2">
                                  <CreditCard className="w-4 h-4" />
                                  Payment Method
                                </h4>
                                <p className="text-sm text-stone-600">
                                  {order.paymentMethod || "Cash on Delivery"}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 bg-white p-4 rounded-xl">
                              <h4 className="font-bold text-stone-800 mb-3">
                                Order Items
                              </h4>

                              <div className="space-y-3">
                                {order.items.map((item, idx) => (
                                  <div
                                    key={`${item.id}-${idx}`}
                                    className="flex items-center justify-between gap-4"
                                  >
                                    <div className="flex items-center gap-3">
                                      {item.image && (
                                        <img
                                          src={item.image}
                                          alt={item.name}
                                          className="w-12 h-12 rounded-lg object-cover"
                                        />
                                      )}

                                      <div>
                                        <p className="font-medium text-stone-800">
                                          {item.name}
                                        </p>
                                        <p className="text-sm text-stone-500">
                                          Qty: {item.quantity}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                      <span className="font-medium">
                                        ₱
                                        {(item.price * item.quantity).toLocaleString(
                                          "en-PH",
                                          {
                                            minimumFractionDigits: 2,
                                          }
                                        )}
                                      </span>

                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          addItem({
                                            id: item.id,
                                            name: item.name,
                                            price: item.price,
                                            image: item.image,
                                            quantity: 1,
                                          });
                                        }}
                                        className="text-sm font-medium text-emerald-700 bg-emerald-100 px-3 py-1 rounded hover:bg-emerald-200 transition-colors"
                                      >
                                        Add
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="mt-4 pt-3 border-t border-stone-100 flex justify-between items-center">
                                <span className="font-bold text-stone-800">
                                  Total
                                </span>
                                <span className="font-bold text-lg text-emerald-600">
                                  ₱
                                  {order.total.toLocaleString("en-PH", {
                                    minimumFractionDigits: 2,
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-stone-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  Landscaping Appointments
                </h2>

                <button
                  onClick={() => navigate("/landscaping/booking")}
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                >
                  Book New
                </button>
              </div>

              {loadingAppointments ? (
                <div className="text-center py-8 text-stone-500">
                  Loading appointments...
                </div>
              ) : appointments.length === 0 ? (
                <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200 text-center">
                  <Leaf className="w-12 h-12 text-amber-600 mx-auto mb-2" />
                  <p className="text-stone-700 font-medium mb-2">
                    No appointments scheduled
                  </p>
                  <p className="text-stone-600 text-sm mb-4">
                    Book your landscaping consultation to get started
                  </p>
                  <button
                    onClick={() => navigate("/landscaping/booking")}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                  >
                    Schedule Now
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.map((apt) => {
                    const appointmentId = apt.id || "";
                    const isExpanded = expandedAppointment === appointmentId;

                    return (
                      <div
                        key={appointmentId}
                        className="border border-stone-100 rounded-2xl overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedAppointment(
                              isExpanded ? null : appointmentId
                            )
                          }
                          className="w-full text-left p-4 bg-stone-50 hover:bg-stone-100 transition-colors"
                          aria-expanded={isExpanded}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-emerald-600" />
                              </div>

                              <div>
                                <h3 className="font-bold text-stone-800">
                                  {apt.date
                                    ? formatDisplayDate(apt.date)
                                    : "No date provided"}{" "}
                                  at{" "}
                                  {apt.time
                                    ? formatTime(apt.time)
                                    : "No time provided"}
                                </h3>

                                <p className="text-sm text-stone-500">
                                  Landscaping Consultation
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`px-3 py-1 text-xs font-bold rounded-full border ${getAppointmentStatusClass(
                                  apt.status
                                )}`}
                              >
                                {formatStatus(apt.status)}
                              </span>

                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-stone-400" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-stone-400" />
                              )}
                            </div>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="border-t border-stone-100 p-4 bg-stone-50">
                            {apt.status === "pending" && (
                              <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200 flex gap-2">
                                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-amber-800">
                                    Pending Approval
                                  </p>
                                  <p className="text-xs text-amber-700">
                                    The admin will review and confirm your
                                    appointment within 24 hours.
                                  </p>
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-white p-4 rounded-xl">
                                <h4 className="font-bold text-stone-800 mb-2">
                                  Appointment Details
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <span className="font-medium text-stone-800">
                                      {apt.date
                                        ? formatDisplayDate(apt.date)
                                        : "No date provided"}
                                    </span>
                                  </div>

                                  <div>
                                    <span className="font-medium text-stone-800">
                                      {apt.time
                                        ? formatTime(apt.time)
                                        : "No time provided"}
                                    </span>
                                  </div>

                                  <div className="flex justify-between">
                                    <span className="text-stone-600">Type:</span>
                                    <span className="font-medium text-stone-800">
                                      Consultation
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-white p-4 rounded-xl">
                                <h4 className="font-bold text-stone-800 mb-2">
                                  Your Information
                                </h4>
                                <div className="space-y-2 text-sm text-stone-600">
                                  <div>
                                    {apt.customerName || "No name provided"}
                                  </div>
                                  <div>
                                    {apt.customerEmail || "No email provided"}
                                  </div>
                                  <div>
                                    {apt.customerPhone || "No phone provided"}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {apt.description && (
                              <div className="mt-4 bg-white p-4 rounded-xl">
                                <h4 className="font-bold text-stone-800 mb-2">
                                  Project Description
                                </h4>
                                <p className="text-sm text-stone-600">
                                  {apt.description}
                                </p>
                              </div>
                            )}

                            {apt.status === "pending" && (
                              <div className="mt-4 flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCancelAppointmentId(appointmentId);
                                  }}
                                  className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors"
                                >
                                  Cancel Appointment
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <Cart />

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100">
              <h3 className="font-bold text-stone-800 mb-4">
                Account Summary
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-stone-100">
                  <span className="text-stone-600">Total Orders</span>
                  <span className="font-bold text-stone-800">
                    {orders.length}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-stone-100">
                  <span className="text-stone-600">Active Consultations</span>
                  <span className="font-bold text-stone-800">
                    {
                      appointments.filter(
                        (appointment) =>
                          appointment.status === "approved" ||
                          appointment.status === "pending"
                      ).length
                    }
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-stone-100">
                  <span className="text-stone-600">
                    Completed Consultations
                  </span>
                  <span className="font-bold text-stone-800">
                    {
                      appointments.filter(
                        (appointment) => appointment.status === "completed"
                      ).length
                    }
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-stone-900 rounded-3xl p-6 text-white relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="font-bold text-lg mb-2">Need Help?</h3>
                <p className="text-stone-400 text-sm mb-4">
                  Have questions about an order or your upcoming appointment?
                </p>

                <div className="flex flex-col gap-2">
                  <button
                    className="w-full py-2.5 bg-white text-stone-900 rounded-xl font-bold hover:bg-stone-100 transition-colors shadow-sm"
                    onClick={() => navigate("/contact")}
                  >
                    Contact Support
                  </button>

                  <button
                    className="w-full py-2.5 bg-emerald-700 text-white rounded-xl font-bold hover:bg-emerald-800 transition-colors shadow-sm"
                    onClick={() => navigate("/dashboard/customer/inquiries")}
                  >
                    My Inquiries
                  </button>
                </div>
              </div>

              <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
                <Search className="w-32 h-32" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog
        open={!!cancelAppointmentId}
        onOpenChange={(open) => {
          if (!open && !cancelling) {
            setCancelAppointmentId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this appointment? This will free
              the reserved appointment dates.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>
              Keep Appointment
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={handleConfirmCancel}
              disabled={cancelling}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {cancelling ? "Cancelling..." : "Yes, Cancel It"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}