import type { Timestamp } from "firebase/firestore";

export interface Inquiry {
  id: string;
  userId?: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  phone?: string;
  inquiryType: string;
  message: string;
  status: "pending" | "responded" | "closed";
  createdAt?: Timestamp | string | null;
  updatedAt?: Timestamp | string | null;
}