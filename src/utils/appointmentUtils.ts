// appointmentUtils provides utility functions and types for managing landscaping appointments.
// FIXED: Fully timezone-safe (NO UTC usage anywhere)

import { addDays, isBefore, endOfDay } from "date-fns";

/**
 * Appointment interface defines the structure of an appointment record.
 */
export interface Appointment {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  appointmentDate: string; // YYYY-MM-DD (STRICT LOCAL DATE STRING)
  appointmentTime: string; // HH:mm
  serviceType: "landscaping-consultation";
  description: string;
  status: "pending" | "approved" | "rejected" | "completed" | "cancelled";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * TIME SLOTS
 */
export const TIME_SLOTS = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00",
  "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"
];

export const OPERATING_HOURS = {
  start: 9,
  end: 22
};

//
// ============================
// SAFE DATE HELPERS (CORE FIX)
// ============================
//

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateKey(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

//
// ============================
// BLOCKING LOGIC
// ============================
//

export function getBlockedDates(appointmentDate: Date): string[] {
  const blocked: string[] = [];

  // selected day + next 2 days
  for (let i = 0; i <= 2; i++) {
    const date = addDays(appointmentDate, i);
    blocked.push(formatDateKey(date));
  }

  return blocked;
}

export function getAllBlockedDates(appointments: Appointment[]): string[] {
  const blocked = new Set<string>();

  appointments
    .filter(a => a.status === "approved" || a.status === "pending")
    .forEach(a => {
      const date = parseDateKey(a.appointmentDate);
      getBlockedDates(date).forEach(d => blocked.add(d));
    });

  return Array.from(blocked);
}

//
// ============================
// AVAILABILITY LOGIC
// ============================
//

export function isDateAvailable(date: Date, blockedDates: string[]): boolean {
  const dateStr = formatDateKey(date);

  if (isBefore(endOfDay(date), new Date())) {
    return false;
  }

  return !blockedDates.includes(dateStr);
}

export function isTimeSlotAvailable(
  date: Date,
  time: string,
  appointments: Appointment[]
): boolean {
  const dateStr = formatDateKey(date);

  return !appointments.some(
    a =>
      a.appointmentDate === dateStr &&
      a.appointmentTime === time &&
      (a.status === "approved" || a.status === "pending")
  );
}

export function validateAppointment(
  date: Date,
  time: string,
  blockedDates: string[],
  appointments: Appointment[]
): { valid: boolean; message: string } {
  const dateStr = formatDateKey(date);

  if (isBefore(endOfDay(date), new Date())) {
    return { valid: false, message: "Cannot book appointments in the past" };
  }

  if (blockedDates.includes(dateStr)) {
    return {
      valid: false,
      message: "This date is unavailable due to existing appointment"
    };
  }

  if (!isTimeSlotAvailable(date, time, appointments)) {
    return { valid: false, message: "This time slot is already booked" };
  }

  return { valid: true, message: "Appointment available" };
}

//
// ============================
// DISPLAY HELPERS
// ============================
//

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);

  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;

  return `${displayHour}:${minutes} ${ampm}`;
}

export function formatDisplayDate(dateStr: string): string {
  const date = parseDateKey(dateStr);

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}