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

// Hook response type
export interface UseInquiryChatReturn {
  inquiry: Inquiry | null;
  inquiries: Inquiry[];
  selectedInquiryId: string | null;
  selectInquiry: (id: string) => void;
  messages: Message[];
  sendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
  isClosed: boolean;
  refetch: () => void;
}
