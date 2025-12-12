export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  speciality?: string;
  location?: string;
  registration_date: string;
  last_login_date: string;
  device?: string;
  topic_filters?: string[];
}

export interface Subscription {
  id: string;
  user: Pick<User, 'id' | 'name' | 'mobile' | 'email'>;
  package_name: string;
  package_start_date: string;
  package_end_date: string;
  plan_type: string;
  payment_name: string;
  payment_date: string;
  payment_time: string;
  currency_type: string;
  payment_method: string;
  payment_id: string;
}

export interface Payment {
  id: string;
  user: Pick<User, 'id' | 'name' | 'mobile' | 'email'>;
  course_name: string;
  payment_date: string;
  payment_time: string;
  transaction_id: string;
  currency_type: string;
  payment_source: string;
  amount: number;
}

export type InboxStatus = 'read' | 'unread' | 'started' | 'resolved' | 'pending' | 'escalated';

export interface Inbox {
  id: string;
  user: Pick<User, 'id' | 'name' | 'email' | 'mobile'>;
  preview: string;
  status: InboxStatus;
  resolved_count: number;
  whatsapp_count: number;
  email_count: number;
  source: 'whatsapp' | 'email';
  isInitiated: boolean;
  query_types: string[];
  whatsapp24HourWindowStartDateTime?: string;
  updated_at: string;
  created_at: string;
}

export type MessageSource = 'whatsapp' | 'email';
export type MessageType = 'template' | 'body';

export interface Message {
  id: string;
  from: string;
  to: string;
  subject?: string;
  body: string;
  source: MessageSource;
  type: MessageType;
  template?: string;
  inReplyTo?: string;
  internetMessageId?: string;
  messageId: string;
  created_at: string;
  inbox_id: string;
}

export interface View {
  id: string;
  user_id: string;
  course_name: string;
  subcourse_name?: string;
  watch_date: string;
  watch_time: string;
  duration: number;
  percentage_video_watched: number;
  device: string;
}

export interface Note {
  id: string;
  user: Pick<User, 'id' | 'name' | 'email' | 'mobile'>;
  body: string;
  due_date: string;
  created_at: string;
}

export interface QueryType {
  id: string;
  name: string;
}

export interface DashboardStats {
  read: number;
  unread: number;
  resolved: number;
  pending: number;
  escalated: number;
  queryTypeStats: Record<string, number>;
  whatsappResolved: number;
  emailResolved: number;
}
