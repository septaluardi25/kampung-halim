export interface MessageItem {
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
  updated_at: string;
}

