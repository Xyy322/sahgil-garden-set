/**
 * Appointment interface
 */
export interface Appointment {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress?: string;
  date: string;
  time: string;
  serviceType: string;
  description: string;
  status: "pending" | "approved" | "rejected" | "completed" | "cancelled";
  lockDates?: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

/**
 * TIME SLOTS
 */
export const TIME_SLOTS = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
];

/**
 * ONLINE BOOKING DAYS
 *
 * JavaScript day numbers:
 * 0 = Sunday
 * 1 = Monday
 * 2 = Tuesday
 * 3 = Wednesday
 * 4 = Thursday
 * 5 = Friday
 * 6 = Saturday
 */
export const ALLOWED_BOOKING_DAY_NUMBERS = [1, 3, 5];

export const ALLOWED_BOOKING_DAYS_LABEL = "Monday, Wednesday, and Friday";

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
 * CHECK IF DATE IS TODAY OR PAST
 *
 * Today is intentionally treated as unavailable to give the admin time
 * to review appointment requests.
 */
export function isTodayOrPast(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const compare = new Date(date);
  compare.setHours(0, 0, 0, 0);

  return compare <= today;
}

/**
 * CHECK IF DATE IS AN ALLOWED ONLINE BOOKING DAY
 */
export function isAllowedBookingDay(date: Date): boolean {
  return ALLOWED_BOOKING_DAY_NUMBERS.includes(date.getDay());
}

/**
 * BLOCKED DATES
 *
 * New business rule:
 * Only the selected appointment date is locked.
 * Tuesday, Thursday, Saturday, and Sunday are disabled by weekday rule,
 * not by creating permanent Firestore lock records.
 */
export function getBlockedDates(baseDate: Date): string[] {
  if (Number.isNaN(baseDate.getTime())) {
    return [];
  }

  return [formatDateKey(baseDate)];
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
      if (Array.isArray(a.lockDates) && a.lockDates.length > 0) {
        a.lockDates
          .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
          .forEach((date) => blocked.add(date));
        return;
      }

      const base = parseDateKey(a.date);

      if (Number.isNaN(base.getTime())) {
        return;
      }

      getBlockedDates(base).forEach((date) => blocked.add(date));
    });

  return Array.from(blocked);
}

/**
 * DATE AVAILABILITY CHECK
 */
export function isDateAvailable(date: Date, blockedDates: string[]): boolean {
  const dateKey = formatDateKey(date);

  if (isTodayOrPast(date)) {
    return false;
  }

  if (!isAllowedBookingDay(date)) {
    return false;
  }

  return !blockedDates.includes(dateKey);
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

  if (isTodayOrPast(date)) {
    return {
      valid: false,
      message:
        "Same-day appointment booking is not allowed. Please choose a future available schedule.",
    };
  }

  if (!isAllowedBookingDay(date)) {
    return {
      valid: false,
      message: `Online booking is only available every ${ALLOWED_BOOKING_DAYS_LABEL}. For urgent or same-day consultations, please contact the admin directly.`,
    };
  }

  if (blockedDates.includes(dateStr)) {
    return {
      valid: false,
      message: "This date is already reserved. Please choose another date.",
    };
  }

  if (!isTimeSlotAvailable(date, time, appointments)) {
    return {
      valid: false,
      message: "This time slot is already booked.",
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
export function compareAppointmentsByDate(a: Appointment, b: Appointment) {
  const aDate = parseDateKey(a.date);
  const bDate = parseDateKey(b.date);

  const aTime = Number.isNaN(aDate.getTime())
    ? Number.MAX_SAFE_INTEGER
    : aDate.getTime();

  const bTime = Number.isNaN(bDate.getTime())
    ? Number.MAX_SAFE_INTEGER
    : bDate.getTime();

  const diff = aTime - bTime;

  if (diff !== 0) return diff;

  return (a.time || "").localeCompare(b.time || "");
}