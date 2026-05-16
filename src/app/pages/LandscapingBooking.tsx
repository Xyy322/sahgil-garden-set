"use client";

import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router";
import { Calendar } from "../components/ui/calendar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Card } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  CheckCircle,
  AlertCircle,
  Calendar as CalendarIcon,
  Clock3,
  UserRound,
  FileText,
  Info,
} from "lucide-react";

import { db } from "../../utils/firebase/config";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { auth } from "../../utils/firebase/config";
import { createNotification } from "../../utils/createNotification";

import {
  Appointment,
  TIME_SLOTS,
  getAllBlockedDates,
  isDateAvailable,
  isTimeSlotAvailable,
  formatTime,
  formatDisplayDate,
  validateAppointment,
} from "../../utils/appointmentUtils";

/** FIX: consistent YYYY-MM-DD generator (avoids timezone shift bugs) */
function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function LandscapingBooking() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [step, setStep] = useState<"booking" | "success">("booking");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  const [formData, setFormData] = useState({
    fullName: user?.displayName || "",
    phone: "",
    description: "",
  });

  const [authEmail, setAuthEmail] = useState(user?.email || "");

  /** AUTH LISTENER */
  useEffect(() => {
    const authInstance = getAuth();
    const unsub = authInstance.onAuthStateChanged((firebaseUser) => {
      setAuthEmail(firebaseUser?.email || "");
    });
    return () => unsub();
  }, []);

  /** LOAD APPOINTMENTS */
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const snapshot = await getDocs(collection(db, "appointments"));

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Appointment[];

        setAppointments(data);
        setBlockedDates(getAllBlockedDates(data));
      } catch (err) {
        console.error("Failed loading appointments:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, []);

  /** SUBMIT BOOKING */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedDate || !selectedTime) {
      setError("Please select both date and time");
      return;
    }

    if (!formData.fullName || !authEmail || !formData.phone) {
      setError("Please fill in all required fields");
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

    try {
      setSubmitting(true);

      const dateKey = toDateKey(selectedDate);

      const appointmentData = {
        customerId: user?.uid || "guest",
        customerName: formData.fullName,
        customerEmail: authEmail,
        customerPhone: formData.phone,
        appointmentDate: dateKey,
        appointmentTime: selectedTime,
        serviceType: "landscaping-consultation",
        description: formData.description,
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docRef = await addDoc(
        collection(db, "appointments"),
        appointmentData
      );

      if (user?.uid) {
        await createNotification({
          userId: user.uid,
          title: "Appointment created",
          message: `Your appointment on ${dateKey} at ${selectedTime} was created.`,
          type: "appointment",
          statusRefId: docRef.id,
        });
      }

      const updated = [
        ...appointments,
        { id: docRef.id, ...appointmentData } as Appointment,
      ];

      setAppointments(updated);
      setBlockedDates(getAllBlockedDates(updated));

      setStep("success");
    } catch (err) {
      console.error(err);
      setError("Failed to book appointment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /** LOADING */
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading appointment system...</p>
      </div>
    );
  }

  /** SUCCESS SCREEN */
  if (step === "success") {
    return (
      <div className="min-h-screen bg-background px-4 py-8 md:px-6 md:py-10">
        <div className="mx-auto max-w-5xl">
          <Card className="mx-auto w-full max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h2 className="text-2xl font-semibold text-card-foreground">
              Appointment Request Submitted
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your request is now pending admin review.
            </p>

            <div className="mt-5 rounded-xl border border-border bg-background px-4 py-3">
              <p className="text-sm text-foreground">
                {selectedDate && formatDisplayDate(toDateKey(selectedDate))}
              </p>
              <p className="text-sm font-medium text-primary">
                {formatTime(selectedTime)}
              </p>
            </div>

            <Button
              onClick={() => navigate("/")}
              className="mt-6 h-11 w-full rounded-lg bg-primary text-primary-foreground hover:opacity-90"
            >
              Return to Home
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const availableTimes = selectedDate
    ? TIME_SLOTS.filter((t) =>
        isTimeSlotAvailable(selectedDate, t, appointments)
      )
    : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <header className="mb-6 md:mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Landscaping Consultation Booking
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">
            Schedule your consultation, submit service details, and track approval updates through the appointment workflow.
          </p>
        </header>

        {/* Inline error state */}
        {error && (
          <Alert className="mb-6 rounded-xl border border-red-200 bg-red-50 text-red-800">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid items-start gap-8 lg:grid-cols-3">
          <Card className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-8 lg:col-span-2">
            <h2 className="text-xl font-bold text-card-foreground mb-2">Book Appointment</h2>
            <p className="mb-4 text-sm text-muted-foreground">Complete each section to request an appointment.</p>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Date & Time Selection */}
              <section className="rounded-xl border border-border bg-background p-4 md:p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarIcon className="h-4 w-4 text-primary" />
                  <h3 className="text-base font-semibold text-foreground">1) Schedule</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-2">Select an available date and preferred consultation time.</p>
                <div className="rounded-2xl border border-[#DAD7CD] bg-white p-3">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(d) => !isDateAvailable(d, blockedDates)}
                    aria-label="Select appointment date"
                  />
                </div>
                <div>
                  {selectedDate ? (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock3 className="h-4 w-4 text-primary" />
                        <h4 className="text-sm font-semibold text-foreground">Step 2: Select Time</h4>
                      </div>
                      <Label className="text-sm font-medium text-foreground" htmlFor="timeSlot">Time Slot</Label>
                      <Select value={selectedTime} onValueChange={setSelectedTime}>
                        <SelectTrigger id="timeSlot" className="h-11 rounded-xl border-[#DAD7CD] bg-white text-foreground">
                          <SelectValue placeholder="Select consultation time" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-[#DAD7CD] bg-white text-foreground">
                          {availableTimes.map((t) => (
                            <SelectItem key={t} value={t}>{formatTime(t)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {availableTimes.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No time slots are available for the selected date.</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Select the time that best fits your schedule.</p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-xl border border-dashed border-[#DAD7CD] bg-[#F5F0E6] px-4 py-3 text-xs text-muted-foreground">
                      Step 2 (Time selection) will appear after selecting a date.
                    </div>
                  )}
                  {selectedDate && (
                    <div className="mt-4 rounded-xl border border-[#DAD7CD] bg-[#F5F0E6] px-3 py-2 text-sm text-foreground">
                      Selected date: {formatDisplayDate(toDateKey(selectedDate))}
                    </div>
                  )}
                </div>
              </section>

              {/* Customer Info */}
              <section className="rounded-xl border border-border bg-background p-4 md:p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-2">
                  <UserRound className="h-4 w-4 text-primary" />
                  <h3 className="text-base font-semibold text-foreground">2) Customer Information</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-2">These details are used for admin verification and service communication.</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium text-foreground">Full Name</Label>
                    <Input
                      id="fullName"
                      className={`h-11 rounded-lg border-border bg-card ${!formData.fullName && error ? 'border-red-400' : ''}`}
                      placeholder="Enter your complete name"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      aria-invalid={!formData.fullName && !!error}
                      aria-describedby="fullName-error"
                    />
                    {!formData.fullName && error && (
                      <span id="fullName-error" className="text-xs text-red-600">Full name is required.</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-foreground">Account Email</Label>
                    <Input
                      id="email"
                      className="h-11 rounded-lg border-border bg-muted text-muted-foreground"
                      value={authEmail}
                      disabled
                      aria-readonly
                    />
                    <p className="text-xs text-muted-foreground">Email is linked to your signed-in account.</p>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-foreground">Contact Number</Label>
                    <Input
                      id="phone"
                      className={`h-11 rounded-lg border-border bg-card ${!formData.phone && error ? 'border-red-400' : ''}`}
                      placeholder="Enter mobile number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      aria-invalid={!formData.phone && !!error}
                      aria-describedby="phone-error"
                    />
                    {!formData.phone && error && (
                      <span id="phone-error" className="text-xs text-red-600">Contact number is required.</span>
                    )}
                  </div>
                </div>
              </section>

              {/* Service Details */}
              <section className="rounded-xl border border-border bg-background p-4 md:p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <h3 className="text-base font-semibold text-foreground">3) Service Details</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-2">Provide project goals, site context, and concerns to help our team prepare.</p>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-foreground">Project Description / Notes</Label>
                  <Textarea
                    id="description"
                    className="min-h-[120px] rounded-lg border-border bg-card"
                    placeholder="Tell us about your landscaping requirements, preferred style, or current site condition."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Include lot size, preferred schedule window, and specific requests if available.</p>
                </div>
              </section>

              {/* Confirmation Summary */}
              <section className="rounded-xl border border-[#DAD7CD] bg-white p-4 md:p-6 flex flex-col gap-4">
                <h3 className="text-base font-semibold text-foreground">Final Confirmation Summary</h3>
                <p className="text-sm text-muted-foreground">Review your booking details before submission.</p>
                <div className="mt-2 grid gap-3 text-sm md:grid-cols-2">
                  <div className="rounded-xl border border-[#DAD7CD] bg-[#F5F0E6] p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Selected Date</p>
                    <p className="mt-1 font-medium text-foreground">{selectedDate ? formatDisplayDate(toDateKey(selectedDate)) : "Not selected"}</p>
                  </div>
                  <div className="rounded-xl border border-[#DAD7CD] bg-[#F5F0E6] p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Selected Time</p>
                    <p className="mt-1 font-medium text-foreground">{selectedTime ? formatTime(selectedTime) : "Not selected"}</p>
                  </div>
                  <div className="rounded-xl border border-[#DAD7CD] bg-[#F5F0E6] p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Customer Name</p>
                    <p className="mt-1 font-medium text-foreground">{formData.fullName || "Not provided"}</p>
                  </div>
                  <div className="rounded-xl border border-[#DAD7CD] bg-[#F5F0E6] p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
                    <p className="mt-1 font-medium text-foreground">{authEmail || "Not available"}</p>
                  </div>
                  <div className="rounded-xl border border-[#DAD7CD] bg-[#F5F0E6] p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Phone</p>
                    <p className="mt-1 font-medium text-foreground">{formData.phone || "Not provided"}</p>
                  </div>
                  <div className="rounded-xl border border-[#DAD7CD] bg-[#F5F0E6] p-3 md:col-span-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Description</p>
                    <p className="mt-1 font-medium text-foreground">{formData.description || "No description provided"}</p>
                  </div>
                </div>
              </section>

              <Button
                type="submit"
                disabled={!selectedDate || !selectedTime || submitting}
                className="h-11 w-full rounded-xl mt-2"
                aria-disabled={!selectedDate || !selectedTime || submitting}
              >
                {submitting ? "Submitting Appointment..." : "Submit Appointment Request"}
              </Button>
            </form>
          </Card>

          {/* System Info Card */}
          <div className="space-y-6">
            <Card className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
              <div className="mb-4 flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                <h2 className="text-lg font-semibold text-card-foreground">System Information & Guidelines</h2>
              </div>
              <p className="mb-5 text-sm text-muted-foreground">Review the operating guidelines for appointments and order-related updates.</p>
              <div className="space-y-4">
                <section className="rounded-lg border border-border bg-background p-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    1) Appointment Guidelines
                  </h3>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                    <li>Provide complete contact details for verification.</li>
                    <li>Select only available dates and time slots.</li>
                    <li>Include clear project notes for better consultation prep.</li>
                  </ul>
                </section>

                <section className="rounded-lg border border-border bg-background p-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    2) Order & Appointment Flow
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Requests enter <span className="font-medium text-foreground">Pending</span>,
                    then move to <span className="font-medium text-foreground">Approved</span>,
                    and finally to <span className="font-medium text-foreground">Completed</span> or{" "}
                    <span className="font-medium text-foreground">Rejected</span> based on admin review.
                  </p>
                </section>

                <section className="rounded-lg border border-border bg-background p-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    3) Availability Rules
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Blocked dates and unavailable slots are automatically enforced by the scheduling
                    system to prevent overlapping service commitments.
                  </p>
                </section>

                <section className="rounded-lg border border-border bg-background p-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    4) System Notes
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    You will receive in-system notifications when appointment status changes.
                    Final scheduling remains subject to admin approval and operational capacity.
                  </p>
                </section>
              </div>
            </Card>

            <Card className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
              <h2 className="text-base font-semibold text-card-foreground">
                Selected Schedule Snapshot
              </h2>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarIcon className="h-4 w-4" />
                  <span>
                    {selectedDate
                      ? formatDisplayDate(toDateKey(selectedDate))
                      : "No date selected"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock3 className="h-4 w-4" />
                  <span>{selectedTime ? formatTime(selectedTime) : "No time selected"}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
