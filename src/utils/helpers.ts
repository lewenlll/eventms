import { format } from 'date-fns';

export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const formatDateTime = (date: string | Date): string => {
  return format(new Date(date), 'yyyy-MM-dd HH:mm');
};

export const formatDate = (date: string | Date): string => {
  return format(new Date(date), 'yyyy-MM-dd');
};

export const isValidDateTimeRange = (start: string, end: string): boolean => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return startDate < endDate;
};

export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhoneNumber = (phone: string): boolean => {
  const re = /^\+?[\d\s-]{8,}$/;
  return re.test(phone);
}; 