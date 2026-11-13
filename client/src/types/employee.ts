export interface PublicPhoto {
  id: number;
  photo_url: string;
}

export interface EmployeeCard {
  id: number;
  full_name: string;
  nickname: string;
  photo_url: string | null;
  initials: string;
}

export interface EmployeeMemoryItem {
  id: number;
  title: string;
  event_date: string;
}

export interface EmployeeMessageItem {
  id: number;
  sender_employee_id: number;
  sender_name: string;
  sender_initials: string;
  recipient_employee_id: number;
  recipient_name: string;
  recipient_initials: string;
  message: string;
  impression: string | null;
  created_at: string;
}

export interface EmployeeDetail {
  id: number;
  full_name: string;
  nickname: string;
  hometown: string | null;
  hobby: string | null;
  contact: string | null;
  favorite_quote: string | null;
  photo_url: string | null;
  initials: string;
  memories: EmployeeMemoryItem[];
  messages: EmployeeMessageItem[];
}

