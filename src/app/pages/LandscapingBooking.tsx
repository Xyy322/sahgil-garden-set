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
  runTransaction,
} from "firebase/firestore";

import { createNotification } from "../../utils/createNotification";
import { useAuth } from "../context/AuthContext";

import {
  TIME_SLOTS,
  ALLOWED_BOOKING_DAYS_LABEL,
  formatTime,
  formatDisplayDate,
  validateAppointment,
  formatDateKey,
  isAllowedBookingDay,
  isTodayOrPast,
} from "../../utils/appointmentUtils";

function isValidDateKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function hasLockConflict(dateKey: string, blockedDates: string[]) {
  return blockedDates.includes(dateKey);
}

function isSameCalendarDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isTodayDate(date: Date) {
  return isSameCalendarDay(date, new Date());
}

function isPastOnly(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const compare = new Date(date);
  compare.setHours(0, 0, 0, 0);

  return compare < today;
}

function isAvailableBookingDate(date: Date, blockedDates: string[]) {
  const dateKey = formatDateKey(date);

  return (
    !isTodayOrPast(date) &&
    isAllowedBookingDay(date) &&
    !blockedDates.includes(dateKey)
  );
}

function isReservedBookingDate(date: Date, blockedDates: string[]) {
  return blockedDates.includes(formatDateKey(date));
}

function isUnavailableWeekday(date: Date) {
  return !isTodayOrPast(date) && !isAllowedBookingDay(date);
}

function getDisabledDateReason(date: Date, blockedDates: string[]) {
  const dateKey = formatDateKey(date);

  if (isTodayOrPast(date)) {
    return "Same-day and past appointments are disabled.";
  }

  if (!isAllowedBookingDay(date)) {
    return `Online appointments are only available every ${ALLOWED_BOOKING_DAYS_LABEL}.`;
  }

  if (blockedDates.includes(dateKey)) {
    return "This date is already reserved.";
  }

  return "";
}

export function LandscapingBooking() {
  const navigate = useNavigate();
  const { user, profile, role, loading: authLoading } = useAuth();

  const [step, setStep] = useState<"booking" | "success">("booking");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");

  const [blockedDates, setBlockedDates] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    description: "",
  });

  const authEmail = user?.email || profile?.email || "";

  const defaultFormData = useMemo(
    () => ({
      fullName: profile?.fullName || user?.displayName || "",
      phone: profile?.phoneNumber || "",
      address: profile?.address || "",
      description: "",
    }),
    [
      profile?.fullName,
      profile?.phoneNumber,
      profile?.address,
      user?.displayName,
    ]
  );

  const selectedDateKey = selectedDate ? formatDateKey(selectedDate) : "";
  const selectedLockDates = selectedDateKey ? [selectedDateKey] : [];

  const selectedDateDisabledReason = selectedDate
    ? getDisabledDateReason(selectedDate, blockedDates)
    : "";

  const availableTimeSlots = useMemo(() => {
    if (!selectedDate) {
      return [];
    }

    if (selectedDateDisabledReason) {
      return [];
    }

    return TIME_SLOTS;
  }, [selectedDate, selectedDateDisabledReason]);

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
      address: prev.address || defaultFormData.address,
    }));
  }, [authLoading, user, role, defaultFormData]);

  useEffect(() => {
    const loadAvailability = async () => {
      if (authLoading) {
        return;
      }

      if (!user || role !== "customer") {
        setBlockedDates([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const activeLocksQuery = query(
          collection(db, "appointmentLocks"),
          where("status", "in", ["pending", "approved"])
        );

        const locksSnap = await getDocs(activeLocksQuery);

        const lockedDates = locksSnap.docs
          .map((lockDoc) => {
            const data = lockDoc.data();
            return typeof data.date === "string" ? data.date : lockDoc.id;
          })
          .filter(isValidDateKey);

        setBlockedDates(Array.from(new Set(lockedDates)));
      } catch (err) {
        console.error("Availability loading error:", err);
        setError(
          "Unable to load appointment availability. Please refresh the page or contact the admin."
        );
      } finally {
        setLoading(false);
      }
    };

    loadAvailability();
  }, [authLoading, user, role]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (submitting) {
      return;
    }

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

    const dateKey = formatDateKey(selectedDate);

    if (isTodayOrPast(selectedDate)) {
      setError(
        "Same-day appointment booking is not allowed. Please choose a future available schedule."
      );
      return;
    }

    if (!isAllowedBookingDay(selectedDate)) {
      setError(
        `Online appointment booking is only available every ${ALLOWED_BOOKING_DAYS_LABEL}. For urgent or same-day onsite consultations, please contact the admin directly.`
      );
      return;
    }

    if (hasLockConflict(dateKey, blockedDates)) {
      setError(
        "Selected date is already reserved. Please choose another available date."
      );
      return;
    }

    const cleanName = formData.fullName.trim();
    const cleanPhone = formData.phone.trim();
    const cleanAddress = formData.address.trim();
    const cleanDescription = formData.description.trim();

    if (!cleanName) {
      setError("Please enter your full name.");
      return;
    }

    if (!cleanPhone) {
      setError("Please enter your phone number.");
      return;
    }

    if (!cleanAddress) {
      setError("Please enter your address.");
      return;
    }

    const validation = validateAppointment(
      selectedDate,
      selectedTime,
      blockedDates,
      []
    );

    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    const lockDates = [dateKey];

    try {
      setSubmitting(true);

      const appointmentRef = doc(collection(db, "appointments"));

      await runTransaction(db, async (transaction) => {
        const lockRefs = lockDates.map((date) => ({
          date,
          ref: doc(db, "appointmentLocks", date),
        }));

        for (const lockItem of lockRefs) {
          const lockSnap = await transaction.get(lockItem.ref);

          if (lockSnap.exists()) {
            throw new Error(
              `Selected schedule is unavailable because ${lockItem.date} is already reserved.`
            );
          }
        }

        transaction.set(appointmentRef, {
          userId: user.uid,

          customerName: cleanName,
          customerEmail: authEmail,
          customerPhone: cleanPhone,
          customerAddress: cleanAddress,
          address: cleanAddress,

          date: dateKey,
          time: selectedTime,
          serviceType: "landscaping-consultation",
          description: cleanDescription,

          status: "pending",
          lockDates,

          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        lockRefs.forEach((lockItem) => {
          transaction.set(lockItem.ref, {
            date: lockItem.date,
            appointmentId: appointmentRef.id,
            userId: user.uid,
            status: "pending",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        });
      });

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

      const message =
        err instanceof Error
          ? err.message
          : "Selected date is no longer available. Please choose another date.";

      setError(message);
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
                  ? formatDisplayDate(formatDateKey(selectedDate))
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

            {formData.address && (
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-stone-500">Address</span>
                <span className="text-right font-medium text-stone-800">
                  {formData.address}
                </span>
              </div>
            )}
          </div>

          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left">
            <p className="text-sm font-semibold text-amber-800">
              Appointment review note
            </p>
            <p className="mt-1 text-xs leading-relaxed text-amber-700">
              Same-day bookings are disabled to give the admin enough time to
              review appointment requests. For urgent onsite consultation,
              please contact the business directly.
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
            Online appointments are available every{" "}
            {ALLOWED_BOOKING_DAYS_LABEL}. Same-day appointments are disabled so
            the admin has enough time to review and confirm requests. For urgent
            onsite consultation, please contact the business directly.
          </p>

          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
            <div>
              <p className="text-sm font-semibold text-emerald-900">
                Business availability schedule
              </p>
              <p className="mt-1 text-xs leading-relaxed text-emerald-800">
                Customers may only book future appointments on Monday,
                Wednesday, and Friday. Once a date is booked, that selected date
                becomes unavailable to prevent duplicate appointment requests.
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
                  Only future Monday, Wednesday, and Friday schedules are
                  available for online booking.
                </p>

                <div className="mt-5 flex justify-center overflow-x-auto rounded-3xl bg-stone-50 p-4 sm:p-5">
  <Calendar
    mode="single"
    selected={selectedDate}
    onSelect={(date) => {
      setSelectedDate(date);
      setSelectedTime("");
      setError("");
    }}
    disabled={(date) => {
      const dateKey = formatDateKey(date);

      return (
        isTodayOrPast(date) ||
        !isAllowedBookingDay(date) ||
        hasLockConflict(dateKey, blockedDates)
      );
    }}
    modifiers={{
      available: (date) =>
        isAvailableBookingDate(date, blockedDates),
      reserved: (date) =>
        isReservedBookingDate(date, blockedDates),
      unavailableWeekday: (date) =>
        isUnavailableWeekday(date),
      todayBlocked: (date) => isTodayDate(date),
      pastBlocked: (date) => isPastOnly(date),
    }}
    modifiersClassNames={{
  available:
    "!bg-emerald-200 !text-emerald-950 !border !border-emerald-400 !font-bold !opacity-100 hover:!bg-emerald-300",
  reserved:
    "!bg-red-200 !text-red-950 !border !border-red-400 !font-bold !line-through !opacity-100",
  unavailableWeekday:
    "!bg-stone-200 !text-stone-700 !border !border-stone-400 !font-semibold !opacity-100",
  todayBlocked:
    "!bg-amber-200 !text-amber-950 !border !border-amber-400 !font-bold !opacity-100",
  pastBlocked:
    "!bg-stone-100 !text-stone-500 !border !border-stone-300 !font-medium !opacity-100",
}}
    className="w-full max-w-[430px] rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
    classNames={{
      months: "flex w-full flex-col",
      month: "w-full space-y-5",
      caption: "relative flex items-center justify-center pt-2 text-lg font-bold text-stone-900",
      caption_label: "text-lg font-bold",
      nav: "flex items-center gap-1",
      nav_button:
        "h-10 w-10 rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-100",
      nav_button_previous: "absolute left-2",
      nav_button_next: "absolute right-2",
      table: "w-full border-collapse space-y-2",
      head_row: "grid grid-cols-7 gap-2",
      head_cell:
        "flex h-10 items-center justify-center rounded-lg text-sm font-semibold text-stone-500",
      row: "mt-2 grid grid-cols-7 gap-2",
      cell:
        "relative flex h-12 w-full items-center justify-center rounded-xl p-0 text-center text-sm focus-within:relative focus-within:z-20 sm:h-14",
      day:
        "h-12 w-full rounded-xl p-0 text-sm font-semibold hover:bg-emerald-50 sm:h-14",
      day_selected:
        "!bg-emerald-600 !text-white hover:!bg-emerald-700 focus:!bg-emerald-700",
      day_today: "",
      day_outside: "text-stone-300 opacity-50",
      day_disabled: "cursor-not-allowed opacity-100",
      day_hidden: "invisible",
    }}
  />
</div>

                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-xs text-stone-700">
                    <span className="h-4 w-4 rounded border border-emerald-200 bg-emerald-100" />
                    <span>Available booking day</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-stone-700">
                    <span className="h-4 w-4 rounded border border-red-200 bg-red-100" />
                    <span>Already reserved</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-stone-700">
                    <span className="h-4 w-4 rounded border border-stone-200 bg-stone-100" />
                    <span>Not available for online booking</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-stone-700">
                    <span className="h-4 w-4 rounded border border-amber-200 bg-amber-100" />
                    <span>Today (disabled for review)</span>
                  </div>
                </div>
              </div>

              {selectedDate && selectedDateDisabledReason && (
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    {selectedDateDisabledReason}
                  </AlertDescription>
                </Alert>
              )}

              {selectedDate && !selectedDateDisabledReason && (
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-bold text-stone-900">
                    <Clock3 className="h-5 w-5 text-emerald-600" />
                    Select Time
                  </h2>

                  <p className="mt-1 text-sm text-stone-500">
                    Choose your preferred consultation time from 7:00 AM to 4:00
                    PM.
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
                        No available time slots for the selected date. Please
                        choose another date.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {selectedDate && !selectedDateDisabledReason && (
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <p className="text-sm font-semibold text-stone-900">
                    Selected schedule
                  </p>

                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-stone-500">Date</span>
                      <span className="text-right font-medium text-stone-800">
                        {formatDisplayDate(formatDateKey(selectedDate))}
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
                        Date to be reserved:
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
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  placeholder="Enter your complete address or project location"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  required
                  className="mt-2 min-h-[90px]"
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
                  review and confirm or reject the request. Same-day requests
                  should be handled by directly contacting the business.
                </p>
              </div>

              <Button
                type="submit"
                disabled={
                  submitting ||
                  !selectedDate ||
                  !selectedTime ||
                  Boolean(selectedDateDisabledReason)
                }
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