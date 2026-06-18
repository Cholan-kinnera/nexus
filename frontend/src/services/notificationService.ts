import api from "../api/client";

export interface NotificationResponse {
  id: number;
  user_id: number;
  title: string;
  message: string;
  is_read: boolean;
  notification_metadata: Record<string, any> | null;
  created_at: string;
}

export interface NotificationCountResponse {
  unread_count: number;
}

export interface NotificationReadResponse {
  success: boolean;
  message: string;
  updated_count: number;
}

export const getNotifications = async (
  limit = 50,
  offset = 0
): Promise<NotificationResponse[]> => {
  const response = await api.get("/notifications", {
    params: { limit, offset },
  });
  return response.data.items ?? [];
};

export const getUnreadNotifications = async (
  limit = 50,
  offset = 0
): Promise<NotificationResponse[]> => {
  const response = await api.get("/notifications/unread", {
    params: { limit, offset },
  });
  return response.data.items ?? [];
};

export const getUnreadCount = async (): Promise<NotificationCountResponse> => {
  const response = await api.get("/notifications/count");
  return response.data;
};

export const markAsRead = async (
  notificationId: number
): Promise<NotificationResponse> => {
  const response = await api.put(`/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllAsRead = async (): Promise<NotificationReadResponse> => {
  const response = await api.post("/notifications/read-all");
  return response.data;
};

// Utility function to format notification created_at timestamps into relative time labels
export const formatRelativeTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    if (isNaN(diffMs) || diffMs < 0) {
      return "just now";
    }
    
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  } catch (e) {
    return "some time ago";
  }
};
