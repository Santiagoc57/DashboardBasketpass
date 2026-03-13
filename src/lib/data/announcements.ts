import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AnnouncementRow } from "@/lib/database.types";

export type AnnouncementSummary = Pick<
  AnnouncementRow,
  "id" | "title" | "body" | "active" | "updated_at" | "created_at"
>;

function isMissingAnnouncementsTable(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "42P01"
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
    if (isMissingAnnouncementsTable(result.error)) {
      return null;
    }

    throw result.error;
  }

  return (result.data as AnnouncementSummary | null) ?? null;
}

export async function getActiveAnnouncement() {
  return fetchLatestAnnouncementQuery(true);
}

export async function getLatestAnnouncement() {
  return fetchLatestAnnouncementQuery(false);
}
