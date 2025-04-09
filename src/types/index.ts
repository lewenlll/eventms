export interface User {
  id: string;
  name: string;
  chineseName: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: string;
  email: string;
  phoneNumber: string;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  fee: number;
  startDateTime: string;
  endDateTime: string;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}

export interface Participant {
  userId: string;
  user: User;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  joinedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
} 