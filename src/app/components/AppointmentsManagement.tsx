// AppointmentsManagement handles the admin interface for managing all landscaping appointments.
// It directly affects the system by allowing admins to approve, reject, or update appointments in Firestore.
// This file integrates with Firebase for real-time updates and uses utility functions for formatting and filtering.
import { useEffect, useState } from "react";
import { collection, onSnapshot, updateDoc, doc, query } from "firebase/firestore";
import { db } from "../../utils/firebase/config";
import { createNotification } from "../../utils/createNotification";
import {
  Appointment,
  formatTime,
  formatDisplayDate,
  getBlockedDates,
  parseDateKey,
} from "../../utils/appointmentUtils";
import { Check, X, Clock, User, Mail, Phone } from "lucide-react";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { compareAppointmentsByDate } from "../../utils/appointmentUtils";

// AppointmentStatus defines the possible states for an appointment.
type AppointmentStatus = "pending" | "approved" | "rejected" | "completed" | "cancelled";

// Returns the appropriate CSS classes for a status badge.
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

// Main admin appointments management component.
// Handles real-time fetching, filtering, and status updates for all appointments.
export function AppointmentsManagement() {
  // State for appointments, loading, error, and UI controls.
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "completed">("pending");

  // On mount, subscribe to real-time updates from Firestore for all appointments.
  useEffect(() => {
    const q = query(collection(db, "appointments"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const apts = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Appointment[];

        // Sort appointments by date for easier management.
        apts.sort(compareAppointmentsByDate);

        setAppointments(apts);
        setLoading(false);
        setError("");
      },
      (err) => {
        setError(err.message || "Failed to load appointments");
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // Handles status changes for an appointment (approve, reject, etc.).
  // This function updates the appointment status in Firestore and triggers a UI update.
  const handleStatusChange = async (id: string, newStatus: AppointmentStatus) => {
    try {
      const appointment = appointments.find((apt) => apt.id === id);
      if (!appointment) return;
      if (appointment.status === newStatus) return;

      setUpdatingId(id);
      await updateDoc(doc(db, "appointments", id), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });

      if (appointment.userId) {
        await createNotification({
          userId: appointment.userId,
          title: "Appointment updated",
          message: `Your appointment (${appointment.date} ${appointment.time}) is now ${newStatus}.`,
          type: "appointment",
          statusRefId: id,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update appointment");
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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-[#A3B18A]/60 bg-[#F6F1E6] p-5 shadow-[0_10px_24px_rgba(31,77,46,0.12)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(31,77,46,0.16)]">
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.16em] text-[#7A9E7E]">
            Total Appointments
          </p>
          <h3 className="text-2xl font-semibold text-[#1F4D2E]">{stats.total}</h3>
        </div>
        <div className="rounded-3xl border border-[#A3B18A]/60 bg-[#F6F1E6] p-5 shadow-[0_10px_24px_rgba(31,77,46,0.12)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(31,77,46,0.16)]">
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.16em] text-[#7A9E7E]">
            Pending Approval
          </p>
          <h3 className="text-2xl font-semibold text-[#1F4D2E]">{stats.pending}</h3>
        </div>
        <div className="rounded-3xl border border-[#A3B18A]/60 bg-[#F6F1E6] p-5 shadow-[0_10px_24px_rgba(31,77,46,0.12)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(31,77,46,0.16)]">
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.16em] text-[#7A9E7E]">
            Approved
          </p>
          <h3 className="text-2xl font-semibold text-[#1F4D2E]">{stats.approved}</h3>
        </div>
      </div>

      {/* Management Section */}
      <div className="rounded-3xl border border-[#A3B18A]/60 bg-[#F6F1E6] p-5 shadow-[0_14px_34px_rgba(31,77,46,0.14)] md:p-7">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-wide text-[#1F4D2E]">Appointment Requests</h2>
            <p className="text-sm leading-relaxed text-[#2F6B3F]">
              Manage appointment lifecycle and customer scheduling status.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["all", "pending", "approved", "completed"] as const).map((status) => (
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
            ))}
          </div>
        </div>

        {error && (
          <Alert className="mb-6 border-[#A3B18A] bg-[#EDE6DA]">
            <AlertDescription className="text-sm text-[#1F4D2E]">{error}</AlertDescription>
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
                className="rounded-3xl border border-[#A3B18A]/60 bg-[#F6F1E6] p-4 shadow-[0_8px_22px_rgba(31,77,46,0.1)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(31,77,46,0.16)] sm:p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  {/* Left: DateTime & Status */}
                  <div className="flex-1">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="rounded-xl border border-[#A3B18A]/70 bg-[#EDE6DA] p-2">
                        <Clock className="h-5 w-5 text-[#2F6B3F]" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#1F4D2E]">
                          {formatDisplayDate(apt.date)}
                        </p>
                        <p className="text-sm text-[#2F6B3F]">
                          {formatTime(apt.time)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${statusBadge(
                          apt.status
                        )}`}
                      >
                        {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Middle: Customer Info */}
                  <div className="flex-1 rounded-2xl border border-[#A3B18A]/70 bg-[#EDE6DA]/80 p-3">
                    <p className="mb-2 text-sm font-semibold text-[#1F4D2E]">Customer Details</p>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center gap-2 text-[#1F4D2E]">
                        <User className="h-4 w-4 flex-shrink-0 text-[#2F6B3F]" />
                        <span>{apt.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#2F6B3F]">
                        <Mail className="h-4 w-4 flex-shrink-0 text-[#7A9E7E]" />
                        <span className="truncate">{apt.customerEmail}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#2F6B3F]">
                        <Phone className="h-4 w-4 flex-shrink-0 text-[#7A9E7E]" />
                        <span>{apt.customerPhone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Description & Actions */}
                  <div className="flex-1">
                    {apt.description && (
                      <div className="mb-3 rounded-2xl border border-[#A3B18A]/70 bg-[#EDE6DA]/70 p-3">
                        <p className="mb-1 text-sm font-semibold text-[#1F4D2E]">Project Details</p>
                        <p className="text-sm leading-relaxed text-[#2F6B3F] line-clamp-3">{apt.description}</p>
                      </div>
                    )}

                    {apt.status === "pending" && (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(apt.id, "approved")}
                          disabled={updatingId === apt.id}
                          className="h-9 w-full bg-primary text-primary-foreground hover:opacity-90"
                        >
                          <Check className="mr-1 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(apt.id, "rejected")}
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
                        onClick={() => handleStatusChange(apt.id, "completed")}
                        disabled={updatingId === apt.id}
                        className="h-9 w-full bg-primary text-primary-foreground hover:opacity-90"
                      >
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </div>

                {/* Blocked Dates Info */}
                {apt.status === "approved" && (
                  <div className="mt-4 border-t border-[#A3B18A]/60 pt-4">
                    <p className="mb-2 text-xs text-[#2F6B3F]">
  Blocked dates (selected date + next 2 days):
</p>
                    <div className="flex flex-wrap gap-1.5">
                      {getBlockedDates(parseDateKey(apt.date)).map(
                        (date: string) => (
                          <span
                            key={date}
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