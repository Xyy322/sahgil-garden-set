import { addDays } from "date-fns";

/**
 * Appointment interface
 */
export interface Appointment {
  id: string;
  userId: string;

  customerName: string;
  customerEmail: string;
  customerPhone: string;

  date: string;
  time: string;

  serviceType: "landscaping-consultation";
  description: string;

  status: "pending" | "approved" | "rejected" | "completed" | "cancelled";

  createdAt: any;
  updatedAt: any;

  lockDates?: string[];
}

/**
 * TIME SLOTS
 */
export const TIME_SLOTS = [
  "09:00", "10:00", "11:00", "12:00", "13:00",
  "14:00", "15:00", "16:00", "17:00", "18:00",
  "19:00", "20:00", "21:00",
];

/**
 * FORMAT DATE → YYYY-MM-DD (LOCAL SAFE)
 */
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * PARSE YYYY-MM-DD → LOCAL DATE (SAFE, NO UTC SHIFT)
 */
export function parseDateKey(dateStr: string): Date {
  if (
    typeof dateStr !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)
  ) {
    return new Date(NaN);
  }

  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * BLOCKED DATES (selected day + next 2 days)
 */
export function getBlockedDates(baseDate: Date): string[] {
  const blocked: string[] = [];

  for (let i = 0; i <= 2; i++) {
    const d = addDays(baseDate, i);
    blocked.push(formatDateKey(d));
  }

  return blocked;
}

/**
 * ALL BLOCKED FROM APPOINTMENTS
 */
export function getAllBlockedDates(appointments: Appointment[]): string[] {
  const blocked = new Set<string>();

  appointments
    .filter((a) => {
      return (
        (a.status === "approved" || a.status === "pending") &&
        typeof a.date === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(a.date)
      );
    })
    .forEach((a) => {
      const base = parseDateKey(a.date);

      if (Number.isNaN(base.getTime())) {
        return;
      }

      getBlockedDates(base).forEach((d) => blocked.add(d));
    });

  return Array.from(blocked);
}

/**
 * DATE AVAILABILITY CHECK
 */
export function isDateAvailable(date: Date, blockedDates: string[]): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const compare = new Date(date);
  compare.setHours(0, 0, 0, 0);

  if (compare < today) return false;

  return !blockedDates.includes(formatDateKey(date));
}

/**
 * SLOT AVAILABILITY CHECK
 */
export function isTimeSlotAvailable(
  date: Date,
  time: string,
  appointments: Appointment[]
): boolean {
  const dateStr = formatDateKey(date);

  return !appointments.some(
    (a) =>
      a.date === dateStr &&
      a.time === time &&
      (a.status === "approved" || a.status === "pending")
  );
}

/**
 * VALIDATION
 */
export function validateAppointment(
  date: Date,
  time: string,
  blockedDates: string[],
  appointments: Appointment[]
): { valid: boolean; message: string } {
  const dateStr = formatDateKey(date);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const compare = new Date(date);
  compare.setHours(0, 0, 0, 0);

  if (compare < today) {
    return { valid: false, message: "Cannot book past dates" };
  }

  if (blockedDates.includes(dateStr)) {
    return {
      valid: false,
      message: "This date is unavailable",
    };
  }

  if (!isTimeSlotAvailable(date, time, appointments)) {
    return {
      valid: false,
      message: "This time slot is already booked",
    };
  }

  return { valid: true, message: "Available" };
}

/**
 * FORMAT TIME → 12H
 */
export function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = Number(h);

  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 || 12;

  return `${display}:${m} ${ampm}`;
}

/**
 * DISPLAY DATE
 */
export function formatDisplayDate(dateStr: string): string {
  const date = parseDateKey(dateStr);

  if (Number.isNaN(date.getTime())) {
    return "No date provided";
  }

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * SORT HELPERS
 */
export function compareAppointmentsByDate(
  a: Appointment,
  b: Appointment
) {
  const aDate = parseDateKey(a.date);
  const bDate = parseDateKey(b.date);

  const aTime = Number.isNaN(aDate.getTime()) ? Number.MAX_SAFE_INTEGER : aDate.getTime();
  const bTime = Number.isNaN(bDate.getTime()) ? Number.MAX_SAFE_INTEGER : bDate.getTime();

  const diff = aTime - bTime;

  if (diff !== 0) return diff;

  return (a.time || "").localeCompare(b.time || "");
}