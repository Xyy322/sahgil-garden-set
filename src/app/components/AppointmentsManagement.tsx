import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  doc,
  query,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import {
  CalendarDays,
  Check,
  CheckCircle,
  Clock,
  Eye,
  Mail,
  MapPin,
  Phone,
  Search,
  User,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { db } from "../../utils/firebase/config";
import { createNotification } from "../../utils/createNotification";
import {
  Appointment,
  formatTime,
  formatDisplayDate,
  getBlockedDates,
  parseDateKey,
} from "../../utils/appointmentUtils";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { useAuth } from "../context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

type AppointmentStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "completed"
  | "cancelled";

type AdminAppointment = Appointment & {
  customerAddress: string;
  status: AppointmentStatus;
};

type FilterStatus = "all" | AppointmentStatus;

const VALID_STATUSES: AppointmentStatus[] = [
  "pending",
  "approved",
  "rejected",
  "completed",
  "cancelled",
];

const FILTER_OPTIONS: FilterStatus[] = [
  "all",
  "pending",
  "approved",
  "completed",
  "rejected",
  "cancelled",
];

const APPOINTMENTS_PER_PAGE = 5;

function isValidStatus(status: unknown): status is AppointmentStatus {
  return VALID_STATUSES.includes(status as AppointmentStatus);
}

function normalizeAppointment(
  id: string,
  data: Record<string, any>
): AdminAppointment {
  return {
    id,
    userId: typeof data.userId === "string" ? data.userId : "",

    customerName:
      typeof data.customerName === "string" && data.customerName.trim()
        ? data.customerName
        : "Unknown customer",

    customerEmail:
      typeof data.customerEmail === "string" && data.customerEmail.trim()
        ? data.customerEmail
        : "No email provided",

    customerPhone:
      typeof data.customerPhone === "string" && data.customerPhone.trim()
        ? data.customerPhone
        : "No phone provided",

    customerAddress:
      typeof data.customerAddress === "string" && data.customerAddress.trim()
        ? data.customerAddress
        : typeof data.address === "string" && data.address.trim()
        ? data.address
        : "No address provided",

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

    status: isValidStatus(data.status) ? data.status : "pending",

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

function safeAppointmentSort(a: AdminAppointment, b: AdminAppointment) {
  const dateA = a.date || "9999-12-31";
  const dateB = b.date || "9999-12-31";

  const dateCompare = dateA.localeCompare(dateB);

  if (dateCompare !== 0) {
    return dateCompare;
  }

  return (a.time || "").localeCompare(b.time || "");
}

function statusBadge(status: AppointmentStatus) {
  switch (status) {
    case "approved":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "rejected":
      return "border-red-200 bg-red-50 text-red-700";
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "cancelled":
      return "border-stone-200 bg-stone-100 text-stone-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function formatStatus(status: unknown) {
  const value = typeof status === "string" && status.trim() ? status : "pending";

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getReservedDates(appointment: AdminAppointment) {
  if (appointment.lockDates && appointment.lockDates.length > 0) {
    return appointment.lockDates;
  }

  if (!appointment.date) {
    return [];
  }

  return getBlockedDates(parseDateKey(appointment.date));
}

export function AppointmentsManagement() {
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AdminAppointment | null>(null);

  const { user, role, loading: authLoading } = useAuth();

  const selectedLiveAppointment = selectedAppointment
    ? appointments.find((apt) => apt.id === selectedAppointment.id) ||
      selectedAppointment
    : null;

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setAppointments([]);
      setError("You must be logged in as admin to view appointments.");
      setLoading(false);
      return;
    }

    if (role !== "admin") {
      setAppointments([]);
      setError("Access denied. Only administrators can view all appointments.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const q = query(collection(db, "appointments"));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        try {
          const apts = snap.docs
            .map((document) =>
              normalizeAppointment(document.id, document.data())
            )
            .sort(safeAppointmentSort);

          setAppointments(apts);
          setError("");
        } catch (parseError) {
          console.error("Appointment parsing error:", parseError);
          setError(
            "Some appointment records contain invalid data. Please check the appointments collection."
          );
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error("Appointments listener error:", err);
        setAppointments([]);
        setError(err.message || "Failed to load appointments.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [authLoading, user, role]);

  const handleStatusChange = async (id: string, newStatus: AppointmentStatus) => {
    try {
      const appointment = appointments.find((apt) => apt.id === id);

      if (!appointment) return;
      if (appointment.status === newStatus) return;

      setUpdatingId(id);
      setError("");

      const lockDates = getReservedDates(appointment);

      const batch = writeBatch(db);

      batch.update(doc(db, "appointments", id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      lockDates.forEach((date) => {
        const lockRef = doc(db, "appointmentLocks", date);

        const shouldReleaseLock =
          newStatus === "rejected" ||
          newStatus === "cancelled" ||
          newStatus === "completed";

        if (shouldReleaseLock) {
          batch.delete(lockRef);
        } else {
          batch.set(
            lockRef,
            {
              date,
              appointmentId: id,
              userId: appointment.userId || "",
              status: newStatus,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
      });

      await batch.commit();

      if (appointment.userId) {
        await createNotification({
          userId: appointment.userId,
          title: "Appointment updated",
          message: `Your appointment (${appointment.date || "No date"} ${
            appointment.time || "No time"
          }) is now ${newStatus}.`,
          type: "appointment",
          statusRefId: id,
        });
      }

      toast.success("Appointment updated", {
        description: `Appointment is now ${newStatus}.`,
      });
    } catch (err) {
      console.error("Appointment status update error:", err);

      const message =
        err instanceof Error ? err.message : "Failed to update appointment";

      setError(message);

      toast.error("Failed to update appointment", {
        description: message,
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredAppointments = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return appointments.filter((appointment) => {
      const matchesStatus = filter === "all" || appointment.status === filter;

      const searchableText = [
        appointment.customerName,
        appointment.customerEmail,
        appointment.customerPhone,
        appointment.customerAddress,
        appointment.date,
        appointment.time,
        appointment.status,
        appointment.description,
        appointment.id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !keyword || searchableText.includes(keyword);

      return matchesStatus && matchesSearch;
    });
  }, [appointments, filter, searchTerm]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAppointments.length / APPOINTMENTS_PER_PAGE)
  );

  const pageStartIndex = (currentPage - 1) * APPOINTMENTS_PER_PAGE;
  const pageEndIndex = Math.min(
    pageStartIndex + APPOINTMENTS_PER_PAGE,
    filteredAppointments.length
  );

  const paginatedAppointments = filteredAppointments.slice(
    pageStartIndex,
    pageEndIndex
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm]);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const stats = {
    total: appointments.length,
    pending: appointments.filter((a) => a.status === "pending").length,
    approved: appointments.filter((a) => a.status === "approved").length,
    completed: appointments.filter((a) => a.status === "completed").length,
    rejected: appointments.filter((a) => a.status === "rejected").length,
  };

  if (loading || authLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-muted-foreground">
        Loading appointments...
      </div>
    );
  }

  return (
    <div className="page-fade-in space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Appointment Management
        </p>

        <h1 className="mt-1 text-2xl font-bold text-card-foreground md:text-3xl">
          Landscaping Appointments
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Manage customer appointment requests, approval status, address details,
          and 3-day schedule reservations.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        <SummaryCard
          label="Total"
          value={stats.total}
          icon={<CalendarDays className="h-5 w-5" />}
        />
        <SummaryCard
          label="Pending"
          value={stats.pending}
          icon={<Clock className="h-5 w-5" />}
          highlight
        />
        <SummaryCard
          label="Approved"
          value={stats.approved}
          icon={<Check className="h-5 w-5" />}
        />
        <SummaryCard
          label="Completed"
          value={stats.completed}
          icon={<CheckCircle className="h-5 w-5" />}
        />
        <SummaryCard
          label="Rejected"
          value={stats.rejected}
          icon={<XCircle className="h-5 w-5" />}
        />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-card-foreground">
              Appointment Requests
            </h2>

            <p className="text-sm text-muted-foreground">
              Showing{" "}
              {filteredAppointments.length === 0
                ? "0"
                : `${pageStartIndex + 1}-${pageEndIndex}`}{" "}
              of {filteredAppointments.length} filtered appointment
              {filteredAppointments.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-3xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search customer, email, phone, address, date, or details..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as FilterStatus)}
              className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              aria-label="Filter appointments by status"
            >
              {FILTER_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status === "all" ? "All Status" : formatStatus(status)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-sm text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {filteredAppointments.length === 0 ? (
          <div className="rounded-xl border border-border bg-background py-10 text-center text-sm text-muted-foreground">
            No appointments found.
          </div>
        ) : (
          <div className="max-h-[720px] space-y-3 overflow-y-auto pr-2">
            {paginatedAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="rounded-2xl border border-border bg-background p-4 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">
                        {appointment.date
                          ? formatDisplayDate(appointment.date)
                          : "No date provided"}
                      </p>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge(
                          appointment.status
                        )}`}
                      >
                        {formatStatus(appointment.status)}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {appointment.time
                        ? formatTime(appointment.time)
                        : "No time provided"}{" "}
                      • {appointment.customerName || "Unknown customer"}
                    </p>

                    <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                      {appointment.customerAddress || "No address provided"}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    {appointment.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() =>
                            handleStatusChange(appointment.id || "", "approved")
                          }
                          disabled={updatingId === appointment.id}
                        >
                          <Check className="mr-1 h-4 w-4" />
                          Approve
                        </Button>

                        <Button
                          size="sm"
                          onClick={() =>
                            handleStatusChange(appointment.id || "", "rejected")
                          }
                          disabled={updatingId === appointment.id}
                          variant="secondary"
                        >
                          <X className="mr-1 h-4 w-4" />
                          Reject
                        </Button>
                      </>
                    )}

                    {appointment.status === "approved" && (
                      <Button
                        size="sm"
                        onClick={() =>
                          handleStatusChange(appointment.id || "", "completed")
                        }
                        disabled={updatingId === appointment.id}
                      >
                        Mark Complete
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedAppointment(appointment)}
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      View
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredAppointments.length > APPOINTMENTS_PER_PAGE && (
          <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              >
                Previous
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={!!selectedAppointment}
        onOpenChange={(open) => {
          if (!open) setSelectedAppointment(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {selectedLiveAppointment && (
            <>
              <DialogHeader>
                <DialogTitle>Appointment Details</DialogTitle>
              </DialogHeader>

              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <DetailItem
                    icon={<CalendarDays className="h-4 w-4" />}
                    label="Date"
                    value={
                      selectedLiveAppointment.date
                        ? formatDisplayDate(selectedLiveAppointment.date)
                        : "No date provided"
                    }
                  />

                  <DetailItem
                    icon={<Clock className="h-4 w-4" />}
                    label="Time"
                    value={
                      selectedLiveAppointment.time
                        ? formatTime(selectedLiveAppointment.time)
                        : "No time provided"
                    }
                  />

                  <DetailItem
                    icon={<User className="h-4 w-4" />}
                    label="Customer"
                    value={selectedLiveAppointment.customerName}
                  />

                  <DetailItem
                    icon={<Mail className="h-4 w-4" />}
                    label="Email"
                    value={selectedLiveAppointment.customerEmail}
                  />

                  <DetailItem
                    icon={<Phone className="h-4 w-4" />}
                    label="Phone"
                    value={selectedLiveAppointment.customerPhone}
                  />

                  <DetailItem
                    icon={<MapPin className="h-4 w-4" />}
                    label="Address"
                    value={selectedLiveAppointment.customerAddress}
                  />
                </div>

                <div className="rounded-2xl border border-border bg-background p-4">
                  <p className="mb-2 text-sm font-semibold text-foreground">
                    Project Description
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {selectedLiveAppointment.description ||
                      "No project details provided."}
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-background p-4">
                  <p className="mb-2 text-sm font-semibold text-foreground">
                    Reserved Dates
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {getReservedDates(selectedLiveAppointment).length > 0 ? (
                      getReservedDates(selectedLiveAppointment).map((date) => (
                        <span
                          key={date}
                          className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
                        >
                          {date}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        No reserved dates recorded.
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  {selectedLiveAppointment.status === "pending" && (
                    <>
                      <Button
                        type="button"
                        onClick={() =>
                          handleStatusChange(
                            selectedLiveAppointment.id || "",
                            "approved"
                          )
                        }
                        disabled={updatingId === selectedLiveAppointment.id}
                      >
                        Approve
                      </Button>

                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() =>
                          handleStatusChange(
                            selectedLiveAppointment.id || "",
                            "rejected"
                          )
                        }
                        disabled={updatingId === selectedLiveAppointment.id}
                      >
                        Reject
                      </Button>
                    </>
                  )}

                  {selectedLiveAppointment.status === "approved" && (
                    <Button
                      type="button"
                      onClick={() =>
                        handleStatusChange(
                          selectedLiveAppointment.id || "",
                          "completed"
                        )
                      }
                      disabled={updatingId === selectedLiveAppointment.id}
                    >
                      Mark Complete
                    </Button>
                  )}
                </div>
              </div>
            </>
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
  highlight = false,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${
        highlight
          ? "border-amber-200 bg-amber-50"
          : "border-border bg-card"
      }`}
    >
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-primary">
        {icon}
      </div>

      <p className="text-sm text-muted-foreground">{label}</p>
      <h3 className="mt-1 text-2xl font-bold text-card-foreground">{value}</h3>
    </div>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>

      <p className="break-words text-sm font-semibold text-foreground">
        {value || "Not provided"}
      </p>
    </div>
  );
}