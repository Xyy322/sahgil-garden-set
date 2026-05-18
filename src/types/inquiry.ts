import { Timestamp } from "firebase/firestore";

export interface Message {
  sender: 'admin' | 'customer';
  content: string;
  timestamp: Timestamp; // ALWAYS Firestore Timestamp
  senderName?: string;
}

export interface Inquiry {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  inquiryType: string;
  message: string;
  status: 'pending' | 'responded' | 'closed';
  messages?: Message[];
  createdAt?: Timestamp;
}


