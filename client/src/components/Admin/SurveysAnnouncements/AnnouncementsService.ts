import { supabase } from "@/lib/supabase";

export type Announcement = {
  announcement_id: number;
  title: string;
  content: string;
  category: string | null;
  priority: number;
  is_published: boolean;
  publish_at: string;
  expires_at: string | null;
  image_path: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type AnnouncementPayload = {
  announcement_id?: number;
  title: string;
  content: string;
  category: string | null;
  priority: number;
  is_published: boolean;
  publish_at: string;
  expires_at: string | null;
  image_path: string | null;
};

const announcementColumns =
  "announcement_id,title,content,category,priority,is_published,publish_at,expires_at,image_path,created_by,created_at,updated_at";

export async function getAdminAnnouncements() {
  const { data, error } = await supabase
    .from("announcements")
    .select(announcementColumns)
    .order("priority", { ascending: false })
    .order("publish_at", { ascending: false });

  return { data: (data ?? []) as Announcement[], error };
}

export async function getVisibleAnnouncements(limit?: number) {
  let query = supabase
    .from("announcements")
    .select(announcementColumns)
    .order("priority", { ascending: false })
    .order("publish_at", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  return { data: (data ?? []) as Announcement[], error };
}

export async function saveAnnouncement(payload: AnnouncementPayload) {
  const row = {
    category: payload.category,
    content: payload.content,
    expires_at: payload.expires_at,
    image_path: payload.image_path,
    is_published: payload.is_published,
    priority: payload.priority,
    publish_at: payload.publish_at,
    title: payload.title,
  };

  if (payload.announcement_id) {
    return supabase
      .from("announcements")
      .update(row)
      .eq("announcement_id", payload.announcement_id)
      .select(announcementColumns)
      .single();
  }

  return supabase.from("announcements").insert(row).select(announcementColumns).single();
}

export async function deleteAnnouncement(announcementId: number) {
  return supabase
    .from("announcements")
    .delete()
    .eq("announcement_id", announcementId);
}

