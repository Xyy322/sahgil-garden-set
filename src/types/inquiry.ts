

export interface Message {
  content: string;
  sender: "customer" | "admin";
  senderName: string;
  timestamp: unknown;
}

export interface Inquiry {
  id: string;

  userId?: string;
  customerType?: "guest" | "registered";

  firstName: string;
  lastName: string;
  fullName?: string;

  email: string;
  phone?: string;

  inquiryType: string;
  message?: string;
  messages?: Message[];

  // Legacy only. Do not use this for read/unread anymore.
  status?: "responded" | "closed" | "pending";

  adminRead?: boolean;
  adminReadAt?: unknown;

  createdAt?: unknown;
  updatedAt?: unknown;
}