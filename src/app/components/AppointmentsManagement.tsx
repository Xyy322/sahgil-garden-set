import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  doc,
  query,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { Check, X, Clock, User, Mail, Phone } from "lucide-react";

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

type AppointmentStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "completed"
  | "cancelled";

const VALID_STATUSES: AppointmentStatus[] = [
  "pending",
  "approved",
  "rejected",
  "completed",
  "cancelled",
];

function isValidStatus(status: unknown): status is AppointmentStatus {
  return VALID_STATUSES.includes(status as AppointmentStatus);
}

function normalizeAppointment(id: string, data: Record<string, any>): Appointment {
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

function safeAppointmentSort(a: Appointment, b: Appointment) {
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
      return "border-[#7A9E7E] bg-[#A3B18A]/35 text-[#1F4D2E]";
    case "rejected":
      return "border-[#A3B18A] bg-[#EDE6DA] text-[#2F6B3F]";
    case "completed":
      return "border-[#2F6B3F]/40 bg-[#7A9E7E]/30 text-[#1F4D2E]";
    case "cancelled":
      return "border-[#A3B18A]/80 bg-[#F6F1E6] text-[#7A9E7E]";
    default:
      return "border-[#A3B18A] bg-[#EDE6DA] text-[#2F6B3F]";
  }
}

export function AppointmentsManagement() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { user, role, loading: authLoading } = useAuth();

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "completed"
  >("pending");

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
            .map((document) => normalizeAppointment(document.id, document.data()))
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

      const lockDates =
        appointment.lockDates && appointment.lockDates.length > 0
          ? appointment.lockDates
          : appointment.date
          ? getBlockedDates(parseDateKey(appointment.date))
          : [];

      const batch = writeBatch(db);

      batch.update(doc(db, "appointments", id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      lockDates.forEach((date) => {
        const lockRef = doc(db, "appointmentLocks", date);

        if (newStatus === "rejected" || newStatus === "cancelled") {
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
    } catch (err) {
      console.error("Appointment status update error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update appointment"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (filter === "all") return true;
    return apt.status === filter;
  });

  const stats = {
    pending: appointments.filter((a) => a.status === "pending").length,
    approved: appointments.filter((a) => a.status === "approved").length,
    total: appointments.length,
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-[#A3B18A]/60 bg-[#F6F1E6] p-6 shadow-[0_12px_30px_rgba(31,77,46,0.14)]">
        <p className="text-sm text-[#2F6B3F]">Loading appointments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-3xl bg-gradient-to-b from-[#F6F1E6] via-[#F6F1E6] to-[#EDE6DA]/70 p-1">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-[#A3B18A]/60 bg-[#F6F1E6] p-5 shadow-[0_10px_24px_rgba(31,77,46,0.12)]">
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.16em] text-[#7A9E7E]">
            Total Appointments
          </p>
          <h3 className="text-2xl font-semibold text-[#1F4D2E]">
            {stats.total}
          </h3>
        </div>

        <div className="rounded-3xl border border-[#A3B18A]/60 bg-[#F6F1E6] p-5 shadow-[0_10px_24px_rgba(31,77,46,0.12)]">
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.16em] text-[#7A9E7E]">
            Pending Approval
          </p>
          <h3 className="text-2xl font-semibold text-[#1F4D2E]">
            {stats.pending}
          </h3>
        </div>

        <div className="rounded-3xl border border-[#A3B18A]/60 bg-[#F6F1E6] p-5 shadow-[0_10px_24px_rgba(31,77,46,0.12)]">
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.16em] text-[#7A9E7E]">
            Approved
          </p>
          <h3 className="text-2xl font-semibold text-[#1F4D2E]">
            {stats.approved}
          </h3>
        </div>
      </div>

      <div className="rounded-3xl border border-[#A3B18A]/60 bg-[#F6F1E6] p-5 shadow-[0_14px_34px_rgba(31,77,46,0.14)] md:p-7">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-wide text-[#1F4D2E]">
              Appointment Requests
            </h2>
            <p className="text-sm leading-relaxed text-[#2F6B3F]">
              Manage appointment lifecycle and customer scheduling status.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(["all", "pending", "approved", "completed"] as const).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-500 ${
                    filter === status
                      ? "border-[#2F6B3F] bg-gradient-to-r from-[#1F4D2E] to-[#2F6B3F] text-[#F6F1E6] shadow-[0_8px_18px_rgba(31,77,46,0.2)]"
                      : "border-[#A3B18A] bg-[#EDE6DA] text-[#1F4D2E] hover:-translate-y-0.5 hover:bg-[#F6F1E6]"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              )
            )}
          </div>
        </div>

        {error && (
          <Alert className="mb-6 border-[#A3B18A] bg-[#EDE6DA]">
            <AlertDescription className="text-sm text-[#1F4D2E]">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {filteredAppointments.length === 0 ? (
          <div className="rounded-2xl border border-[#A3B18A]/70 bg-[#EDE6DA]/70 py-10 text-center text-sm text-[#2F6B3F]">
            No {filter !== "all" ? filter : ""} appointments found.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((apt) => (
              <div
                key={apt.id}
                className="rounded-3xl border border-[#A3B18A]/60 bg-[#F6F1E6] p-4 shadow-[0_8px_22px_rgba(31,77,46,0.1)] sm:p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="rounded-xl border border-[#A3B18A]/70 bg-[#EDE6DA] p-2">
                        <Clock className="h-5 w-5 text-[#2F6B3F]" />
                      </div>

                      <div>
                        <p className="font-semibold text-[#1F4D2E]">
                          {apt.date
                            ? formatDisplayDate(apt.date)
                            : "No date provided"}
                        </p>
                        <p className="text-sm text-[#2F6B3F]">
                          {apt.time ? formatTime(apt.time) : "No time provided"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${statusBadge(
                          apt.status as AppointmentStatus
                        )}`}
                      >
                        {(apt.status || "pending").charAt(0).toUpperCase() +
                          (apt.status || "pending").slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 rounded-2xl border border-[#A3B18A]/70 bg-[#EDE6DA]/80 p-3">
                    <p className="mb-2 text-sm font-semibold text-[#1F4D2E]">
                      Customer Details
                    </p>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center gap-2 text-[#1F4D2E]">
                        <User className="h-4 w-4 flex-shrink-0 text-[#2F6B3F]" />
                        <span>{apt.customerName || "Unknown customer"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#2F6B3F]">
                        <Mail className="h-4 w-4 flex-shrink-0 text-[#7A9E7E]" />
                        <span className="truncate">
                          {apt.customerEmail || "No email provided"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[#2F6B3F]">
                        <Phone className="h-4 w-4 flex-shrink-0 text-[#7A9E7E]" />
                        <span>{apt.customerPhone || "No phone provided"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1">
                    {apt.description && (
                      <div className="mb-3 rounded-2xl border border-[#A3B18A]/70 bg-[#EDE6DA]/70 p-3">
                        <p className="mb-1 text-sm font-semibold text-[#1F4D2E]">
                          Project Details
                        </p>
                        <p className="text-sm leading-relaxed text-[#2F6B3F] line-clamp-3">
                          {apt.description}
                        </p>
                      </div>
                    )}

                    {apt.status === "pending" && (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            handleStatusChange(apt.id || "", "approved")
                          }
                          disabled={updatingId === apt.id}
                          className="h-9 w-full bg-primary text-primary-foreground hover:opacity-90"
                        >
                          <Check className="mr-1 h-4 w-4" />
                          Approve
                        </Button>

                        <Button
                          size="sm"
                          onClick={() =>
                            handleStatusChange(apt.id || "", "rejected")
                          }
                          disabled={updatingId === apt.id}
                          variant="secondary"
                          className="h-9 w-full"
                        >
                          <X className="mr-1 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    )}

                    {apt.status === "approved" && (
                      <Button
                        size="sm"
                        onClick={() =>
                          handleStatusChange(apt.id || "", "completed")
                        }
                        disabled={updatingId === apt.id}
                        className="h-9 w-full bg-primary text-primary-foreground hover:opacity-90"
                      >
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </div>

                {(apt.status === "approved" || apt.status === "completed") &&
                  apt.date && (
                    <div className="mt-4 border-t border-[#A3B18A]/60 pt-4">
                      <p className="mb-2 text-xs text-[#2F6B3F]">
                        Blocked dates (selected date + next 2 days):
                      </p>

                      <div className="flex flex-wrap gap-1.5">
                        {getBlockedDates(parseDateKey(apt.date)).map(
                          (date: string, index: number) => (
                            <span
                              key={`${apt.id}-blocked-${date}-${index}`}
                              className="rounded-full border border-[#A3B18A] bg-[#EDE6DA] px-2.5 py-1 text-xs text-[#1F4D2E]"
                            >
                              {date}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}