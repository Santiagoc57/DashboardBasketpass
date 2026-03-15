import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AnnouncementRow } from "@/lib/database.types";

export type AnnouncementSummary = Pick<
  AnnouncementRow,
  "id" | "title" | "body" | "active" | "updated_at" | "created_at"
>;

function isAnnouncementsUnavailable(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const code = "code" in error ? error.code : null;
  const message =
    "message" in error && typeof error.message === "string"
      ? error.message.toLowerCase()
      : "";

  return (
    code === "42P01" ||
    code === "42501" ||
    message.includes("permission denied") ||
    message.includes("row-level security")
  );
}

async function fetchLatestAnnouncementQuery(activeOnly: boolean) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("announcements")
    .select("id, title, body, active, updated_at, created_at")
    .order("updated_at", { ascending: false })
    .limit(1);

  if (activeOnly) {
    query = query.eq("active", true);
  }

  const result = await query.maybeSingle();

  if (result.error) {
    if (!isAnnouncementsUnavailable(result.error)) {
      console.error("[announcements] failed to load announcement", result.error);
    }
    return null;
  }

  return (result.data as AnnouncementSummary | null) ?? null;
}

export async function getActiveAnnouncement() {
  return fetchLatestAnnouncementQuery(true);
}

export async function getLatestAnnouncement() {
  return fetchLatestAnnouncementQuery(false);
}
