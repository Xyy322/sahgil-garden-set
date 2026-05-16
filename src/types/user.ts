export interface User {
  uid: string;
  email: string;
  role: 'customer' | 'admin';
  fullName: string; // 2+ characters
  username?: string; // 3-20 alphanumeric (a-zA-Z0-9_)
  phoneNumber?: string; // Starts with '+63', followed by up to 11 digits (e.g. +639171234567)
  address?: string; // 5+ characters
  hasPassword: boolean;
  createdAt?: any; // Firestore timestamp
  updatedAt?: Date;
}

