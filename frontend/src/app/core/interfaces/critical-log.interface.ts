export interface CriticalLog {
  timestamp: string;
  userId: string;
  sessionId: string;
  event: string;
  page: string;
  data?: any;
  userAgent: string;
}
