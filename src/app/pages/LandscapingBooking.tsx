"use client";

import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";
import { useNavigate } from "react-router-dom";
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
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";

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

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function LandscapingBooking() {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [authEmail, setAuthEmail] = useState("");

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

  // ✅ FIXED AUTH (single source of truth)
  useEffect(() => {
    const auth = getAuth();

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthEmail(firebaseUser?.email || "");

      // Pre-fill form from Firestore profile
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setFormData((prev) => ({
              ...prev,
              fullName: data.fullName || "",
              phone: data.phoneNumber || "",
            }));
          }
        } catch {
          // silently ignore — form stays empty, user fills it in
        }
      }
    });

    return () => unsub();
  }, []);

  // LOAD APPOINTMENTS
  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, "appointments"));

        const data: Appointment[] = snap.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            ...(d as Omit<Appointment, "id">),
          };
        });

        setAppointments(data);
        setBlockedDates(getAllBlockedDates(data));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedDate || !selectedTime) {
      setError("Please select date and time");
      return;
    }

    if (!user) {
      setError("Please login first");
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
  userId: user?.uid || "guest",

  customerName: formData.fullName,
  customerEmail: authEmail,
  customerPhone: formData.phone,

  date: dateKey,
  time: selectedTime,
  serviceType: "landscaping-consultation",
  description: formData.description,

  status: "pending",

  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
};

      const docRef = await addDoc(
        collection(db, "appointments"),
        appointmentData
      );

      await createNotification({
        userId: user.uid,
        title: "Appointment created",
        message: `Scheduled on ${dateKey} at ${selectedTime}`,
        type: "appointment",
        statusRefId: docRef.id,
      });

      setStep("success");
    } catch (err) {
      console.error(err);
      setError("Failed to book appointment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Loading...</p>;

 if (step === "success") {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-stone-100 p-10 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-stone-900 mb-2">Appointment Booked!</h1>
        <p className="text-stone-500 mb-6">Your landscaping consultation has been submitted.</p>

        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-6 text-left space-y-2">
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-3">Booking Details</p>
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">Date</span>
            <span className="font-medium text-stone-800">
              {selectedDate ? formatDisplayDate(toDateKey(selectedDate)) : "—"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">Time</span>
            <span className="font-medium text-stone-800">
              {selectedTime ? formatTime(selectedTime) : "—"}
            </span>
          </div>
          {formData.fullName && (
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Name</span>
              <span className="font-medium text-stone-800">{formData.fullName}</span>
            </div>
          )}
        </div>

        <p className="text-sm text-stone-400 mb-8">We will confirm your appointment within 24 hours.</p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate("/dashboard/customer")}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => {
              setStep("booking");
              setSelectedDate(undefined);
              setSelectedTime("");
              setFormData({ fullName: "", phone: "", description: "" });
            }}
            className="w-full py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-medium transition-colors"
          >
            Book Another Appointment
          </button>
        </div>
      </div>
    </div>
  );
}

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-stone-900">Book a Landscaping Consultation</h1>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Calendar & Time Selection */}
          <Card className="p-6 h-fit">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-stone-900">
                  <CalendarIcon className="w-5 h-5 text-emerald-600" />
                  Select Date
                </h2>
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => {
                      const now = new Date();
                      now.setHours(0, 0, 0, 0);
                      return date < now || blockedDates.includes(toDateKey(date));
                    }}
                    className="rounded-lg border border-stone-200"
                  />
                </div>
              </div>

              {selectedDate && (
                <div>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-stone-900">
                    <Clock3 className="w-5 h-5 text-emerald-600" />
                    Select Time
                  </h2>
                  <div className="grid grid-cols-2 gap-2">
                    {TIME_SLOTS.map((time) => {
                      const available = isTimeSlotAvailable(
                        selectedDate,
                        time,
                        appointments
                      );
                      return (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          disabled={!available}
                          className={`p-3 rounded-lg font-medium transition-all ${
                            selectedTime === time
                              ? "bg-emerald-600 text-white shadow-md"
                              : available
                                ? "bg-stone-100 text-stone-900 hover:bg-stone-200"
                                : "bg-stone-50 text-stone-400 cursor-not-allowed"
                          }`}
                        >
                          {formatTime(time)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedDate && selectedTime && (
                <Alert className="bg-emerald-50 border-emerald-200">
                  <AlertDescription className="text-emerald-900">
                    ✓ Scheduled for {formatDisplayDate(toDateKey(selectedDate))} at {formatTime(selectedTime)}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </Card>

          {/* Booking Form */}
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-stone-900">
                  <UserRound className="w-5 h-5 text-emerald-600" />
                  Your Information
                </h2>
              </div>

              {error && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-900">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="fullname">Full Name</Label>
                <Input
                  id="fullname"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  required
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
                  className="min-h-[120px]"
                />
              </div>

              <Button 
                type="submit"
                disabled={submitting || !selectedDate || !selectedTime}
                className="w-full"
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