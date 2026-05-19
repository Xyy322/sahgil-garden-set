"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar } from "../components/ui/calendar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Card } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  CheckCircle,
  AlertCircle,
  Calendar as CalendarIcon,
  Clock3,
  UserRound,
  ArrowLeft,
  ShieldCheck,
  LogIn,
} from "lucide-react";

import { db } from "../../utils/firebase/config";
import {
  collection,
  getDocs,
  serverTimestamp,
  doc,
  query,
  where,
  writeBatch,
} from "firebase/firestore";

import { createNotification } from "../../utils/createNotification";
import { useAuth } from "../context/AuthContext";

import {
  Appointment,
  TIME_SLOTS,
  getAllBlockedDates,
  isTimeSlotAvailable,
  formatTime,
  formatDisplayDate,
  validateAppointment,
  getBlockedDates,
  parseDateKey,
} from "../../utils/appointmentUtils";

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isValidDateKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function hasLockConflict(dateKey: string, blockedDates: string[]) {
  const requestedLockDates = getBlockedDates(parseDateKey(dateKey));
  return requestedLockDates.some((date) => blockedDates.includes(date));
}

function normalizeAppointment(id: string, data: any): Appointment {
  return {
    id,
    userId: typeof data.userId === "string" ? data.userId : "",
    customerName: typeof data.customerName === "string" ? data.customerName : "",
    customerEmail:
      typeof data.customerEmail === "string" ? data.customerEmail : "",
    customerPhone:
      typeof data.customerPhone === "string" ? data.customerPhone : "",
    date: isValidDateKey(data.date) ? data.date : "",
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
      ? data.lockDates.filter(isValidDateKey)
      : [],
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

export function LandscapingBooking() {
  const navigate = useNavigate();
  const { user, profile, role, loading: authLoading } = useAuth();

  const [step, setStep] = useState<"booking" | "success">("booking");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    description: "",
  });

  const authEmail = user?.email || profile?.email || "";

  const defaultFormData = useMemo(
    () => ({
      fullName: profile?.fullName || user?.displayName || "",
      phone: profile?.phoneNumber || "",
      description: "",
    }),
    [profile?.fullName, profile?.phoneNumber, user?.displayName]
  );

  const selectedDateKey = selectedDate ? toDateKey(selectedDate) : "";
  const selectedLockDates = selectedDateKey
    ? getBlockedDates(parseDateKey(selectedDateKey))
    : [];

    const availableTimeSlots = useMemo(() => {
  if (!selectedDate) {
    return [];
  }

  return TIME_SLOTS.filter((time) =>
    isTimeSlotAvailable(selectedDate, time, appointments)
  );
}, [selectedDate, appointments]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user || role !== "customer") {
      setLoading(false);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      fullName: prev.fullName || defaultFormData.fullName,
      phone: prev.phone || defaultFormData.phone,
    }));
  }, [authLoading, user, role, defaultFormData]);

  useEffect(() => {
    const loadAvailability = async () => {
      if (authLoading) {
        return;
      }

      if (!user || role !== "customer") {
        setAppointments([]);
        setBlockedDates([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const approvedAppointmentsQuery = query(
          collection(db, "appointments"),
          where("status", "==", "approved")
        );

        const activeLocksQuery = query(
          collection(db, "appointmentLocks"),
          where("status", "in", ["pending", "approved"])
        );

        const [appointmentsSnap, locksSnap] = await Promise.all([
          getDocs(approvedAppointmentsQuery),
          getDocs(activeLocksQuery),
        ]);

        const approvedAppointments = appointmentsSnap.docs.map((document) =>
          normalizeAppointment(document.id, document.data())
        );

        const lockedDates = locksSnap.docs
          .map((lockDoc) => lockDoc.id)
          .filter(isValidDateKey);

        setAppointments(approvedAppointments);
        setBlockedDates(
          Array.from(
            new Set([
              ...lockedDates,
              ...getAllBlockedDates(approvedAppointments),
            ])
          )
        );
      } catch (err) {
        console.error("Availability loading error:", err);
        setError("Unable to load appointment availability.");
      } finally {
        setLoading(false);
      }
    };

    loadAvailability();
  }, [authLoading, user, role]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (authLoading) {
      setError("Please wait while your account is being verified.");
      return;
    }

    if (!user || role !== "customer") {
      setError("Please log in as a customer first.");
      return;
    }

    if (!selectedDate || !selectedTime) {
      setError("Please select date and time.");
      return;
    }

    const today = new Date();
today.setHours(0, 0, 0, 0);

const selected = new Date(selectedDate);
selected.setHours(0, 0, 0, 0);

if (selected <= today) {
  setError("Same-day appointment booking is not allowed. Please choose a date starting tomorrow.");
  return;
}

    const cleanName = formData.fullName.trim();
    const cleanPhone = formData.phone.trim();
    const cleanDescription = formData.description.trim();

    if (!cleanName) {
      setError("Please enter your full name.");
      return;
    }

    if (!cleanPhone) {
      setError("Please enter your phone number.");
      return;
    }

    const validation = validateAppointment(
      selectedDate,
      selectedTime,
      blockedDates,
      appointments
    );

    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    const dateKey = toDateKey(selectedDate);
    const lockDates = getBlockedDates(parseDateKey(dateKey));
    const conflictingDate = lockDates.find((date) =>
      blockedDates.includes(date)
    );

    if (conflictingDate) {
      setError(
        `Selected schedule is unavailable because ${conflictingDate} is already reserved. Please choose another date.`
      );
      return;
    }

    try {
      setSubmitting(true);

      const appointmentRef = doc(collection(db, "appointments"));
      const batch = writeBatch(db);

      batch.set(appointmentRef, {
        userId: user.uid,

        customerName: cleanName,
        customerEmail: authEmail,
        customerPhone: cleanPhone,

        date: dateKey,
        time: selectedTime,
        serviceType: "landscaping-consultation",
        description: cleanDescription,

        status: "pending",
        lockDates,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      lockDates.forEach((date) => {
        const lockRef = doc(db, "appointmentLocks", date);

        batch.set(lockRef, {
          date,
          appointmentId: appointmentRef.id,
          userId: user.uid,
          status: "pending",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();

      await createNotification({
        userId: user.uid,
        title: "Appointment created",
        message: `Your appointment on ${dateKey} at ${selectedTime} was created.`,
        type: "appointment",
        statusRefId: appointmentRef.id,
      });

      await createNotification({
        userId: "admin",
        title: "New appointment request",
        message: `${cleanName} booked an appointment on ${dateKey} at ${selectedTime}.`,
        type: "appointment",
        statusRefId: appointmentRef.id,
      });

      setBlockedDates((prev) => Array.from(new Set([...prev, ...lockDates])));
      setStep("success");
    } catch (err) {
      console.error("Appointment booking error:", err);
      setError(
        "Selected date is no longer available. Please choose another date."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9f7f4] px-4 py-10">
        <div className="rounded-2xl border border-stone-100 bg-white p-8 text-center text-stone-600 shadow-sm">
          Loading appointment form...
        </div>
      </div>
    );
  }

  if (!user || role !== "customer") {
    return (
      <div className="page-fade-in flex min-h-screen items-center justify-center bg-[#f9f7f4] px-4">
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]" />

        <div className="relative z-50 w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <LogIn className="h-7 w-7" />
          </div>

          <h2 className="text-xl font-bold text-stone-900">Login Required</h2>

          <p className="mt-4 text-sm leading-relaxed text-stone-600">
            Please log in as a customer first before booking a landscaping
            appointment.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => navigate("/services")}
              className="button-press rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/login", {
                  state: { from: "/landscaping/booking" },
                })
              }
              className="button-press rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-stone-100 bg-white p-7 text-center shadow-sm sm:p-10">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle className="h-10 w-10 text-emerald-600" />
          </div>

          <h1 className="mb-2 text-2xl font-bold text-stone-900">
            Appointment Booked!
          </h1>

          <p className="mb-6 text-stone-500">
            Your landscaping consultation has been submitted and is now pending
            admin confirmation.
          </p>

          <div className="mb-6 space-y-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-left">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Booking Details
            </p>

            <div className="flex justify-between gap-4 text-sm">
              <span className="text-stone-500">Date</span>
              <span className="text-right font-medium text-stone-800">
                {selectedDate
                  ? formatDisplayDate(toDateKey(selectedDate))
                  : "—"}
              </span>
            </div>

            <div className="flex justify-between gap-4 text-sm">
              <span className="text-stone-500">Time</span>
              <span className="font-medium text-stone-800">
                {selectedTime ? formatTime(selectedTime) : "—"}
              </span>
            </div>

            {formData.fullName && (
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-stone-500">Name</span>
                <span className="text-right font-medium text-stone-800">
                  {formData.fullName}
                </span>
              </div>
            )}
          </div>

          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left">
            <p className="text-sm font-semibold text-amber-800">
              Schedule reservation note
            </p>
            <p className="mt-1 text-xs leading-relaxed text-amber-700">
              The selected date and the next two days are reserved to prevent
              overlapping landscaping appointments.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => navigate("/dashboard/customer")}
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700"
            >
              Go to Dashboard
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setStep("booking");
                setSelectedDate(undefined);
                setSelectedTime("");
                setFormData(defaultFormData);
              }}
              className="w-full rounded-xl"
            >
              Book Another Appointment
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-fade-in min-h-screen bg-[#f9f7f4] px-4 py-8 md:py-12">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => navigate("/services")}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-emerald-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to services
        </button>

        <div className="mb-8 rounded-3xl border border-stone-100 bg-white p-5 shadow-sm md:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Landscaping Appointment
          </p>

          <h1 className="mt-1 text-3xl font-bold text-stone-900 md:text-4xl">
            Book a Landscaping Consultation
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-stone-600 md:text-base">
            Choose an available schedule and provide your contact details. Same-day
appointments are not allowed, and the system checks the full 3-day service
window to avoid overlapping landscaping bookings.
          </p>

          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
            <div>
              <p className="text-sm font-semibold text-emerald-900">
                3-day schedule lock
              </p>
              <p className="mt-1 text-xs leading-relaxed text-emerald-800">
                Customers may book starting tomorrow only. Once a date is booked, that date
and the next two days are reserved while the appointment is pending or approved.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-900">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-8">
          <Card className="h-fit rounded-3xl border-stone-100 bg-white p-5 shadow-sm sm:p-6 md:p-7">
            <div className="space-y-6">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-stone-900">
                  <CalendarIcon className="h-5 w-5 text-emerald-600" />
                  Select Date
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  Dates that conflict with existing 3-day schedules are
                  disabled.
                </p>

                <div className="mt-5 flex justify-center overflow-x-auto">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      setSelectedTime("");
                      setError("");
                    }}
                    disabled={(date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selected = new Date(date);
  selected.setHours(0, 0, 0, 0);

  const dateKey = toDateKey(date);

  return selected <= today || hasLockConflict(dateKey, blockedDates);
}}
                    className="rounded-2xl border border-stone-200 bg-white p-2"
                  />
                </div>
              </div>

              {selectedDate && (
  <div>
    <h2 className="flex items-center gap-2 text-lg font-bold text-stone-900">
      <Clock3 className="h-5 w-5 text-emerald-600" />
      Select Time
    </h2>

    <p className="mt-1 text-sm text-stone-500">
      Choose your preferred consultation time from 7:00 AM to 4:00 PM.
    </p>

    <div className="mt-4">
      <select
        value={selectedTime}
        onChange={(e) => {
          setSelectedTime(e.target.value);
          setError("");
        }}
        className="h-12 w-full rounded-xl border border-stone-200 bg-white px-4 text-sm font-medium text-stone-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
      >
        <option value="">Select available time</option>

        {TIME_SLOTS.map((time) => {
          const available = availableTimeSlots.includes(time);

          return (
            <option key={time} value={time} disabled={!available}>
              {formatTime(time)}
              {!available ? " - Unavailable" : ""}
            </option>
          );
        })}
      </select>

      {availableTimeSlots.length === 0 && (
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          No available time slots for the selected date. Please choose another
          date.
        </p>
      )}
    </div>
  </div>
)}

              {selectedDate && (
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <p className="text-sm font-semibold text-stone-900">
                    Selected schedule
                  </p>

                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-stone-500">Date</span>
                      <span className="text-right font-medium text-stone-800">
                        {formatDisplayDate(toDateKey(selectedDate))}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-stone-500">Time</span>
                      <span className="font-medium text-stone-800">
                        {selectedTime
                          ? formatTime(selectedTime)
                          : "Not selected"}
                      </span>
                    </div>
                  </div>

                  {selectedLockDates.length > 0 && (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                      <p className="text-xs font-semibold text-amber-800">
                        Dates to be reserved:
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {selectedLockDates.map((date) => (
                          <span
                            key={date}
                            className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-amber-800"
                          >
                            {date}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          <Card className="rounded-3xl border-stone-100 bg-white p-5 shadow-sm sm:p-6 md:p-7">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-stone-900">
                  <UserRound className="h-5 w-5 text-emerald-600" />
                  Your Information
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  These details will be used to contact you about your booking.
                </p>
              </div>

              <div>
                <Label htmlFor="fullname">Full Name</Label>
                <Input
                  id="fullname"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="09XX XXXX XXX"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="description">Description / Inquiry</Label>
                <Textarea
                  id="description"
                  placeholder="Tell us about your landscaping needs..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="mt-2 min-h-[130px]"
                />
              </div>

              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <p className="text-sm font-semibold text-stone-900">
                  Before submitting
                </p>
                <p className="mt-1 text-xs leading-relaxed text-stone-500">
                  Your appointment will be saved as pending. The admin will
                  review and confirm or reject the request.
                </p>
              </div>

              <Button
                type="submit"
                disabled={submitting || !selectedDate || !selectedTime}
                className="h-12 w-full rounded-xl bg-emerald-600 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Book Appointment"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}