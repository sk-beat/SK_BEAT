import { supabase } from "../../../utils/supabase";

export type AdminNotification = {
  notification_id: number;
  notification_key: string | null;
  type: string;
  title: string;
  message: string;
  related_user_id: string | null;
  related_event_id: number | null;
  related_survey_id: number | null;
  related_feedback_id: number | null;
  metadata: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
};

export async function getAdminNotifications(limit = 20) {
  const { data, error } = await supabase.rpc("get_admin_notifications", {
    p_limit: limit,
  });

  return { data: (data ?? []) as AdminNotification[], error };
}

export async function getAdminUnreadNotificationCount() {
  const { data, error } = await supabase.rpc("get_admin_unread_notification_count");
  return { data: Number(data ?? 0), error };
}

export async function markAdminNotificationRead(notificationId: number) {
  return supabase.rpc("mark_admin_notification_read", {
    p_notification_id: notificationId,
  });
}

export async function markAllAdminNotificationsRead() {
  return supabase.rpc("mark_all_admin_notifications_read");
}
