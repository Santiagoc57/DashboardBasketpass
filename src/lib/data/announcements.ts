import type { AnnouncementRow } from "@/lib/database.types";
import { getLinkedPersonForUserContext } from "@/lib/people-link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserContext } from "@/lib/types";

export type AnnouncementSummary = Pick<
  AnnouncementRow,
  | "id"
  | "title"
  | "body"
  | "active"
  | "eyebrow_label"
  | "dismiss_label"
  | "starts_at"
  | "ends_at"
  | "audience_type"
  | "target_role_names"
  | "target_person_ids"
  | "updated_at"
  | "created_at"
>;

const ANNOUNCEMENT_SELECT =
  "id, title, body, active, eyebrow_label, dismiss_label, starts_at, ends_at, audience_type, target_role_names, target_person_ids, updated_at, created_at";

function isAnnouncementVisibleNow(announcement: AnnouncementSummary) {
  const now = Date.now();
  const startsAt = announcement.starts_at
    ? new Date(announcement.starts_at).getTime()
    : null;
  const endsAt = announcement.ends_at
    ? new Date(announcement.ends_at).getTime()
    : null;

  if (startsAt && startsAt > now) {
    return false;
  }

  if (endsAt && endsAt < now) {
    return false;
  }

  return true;
}

function normalizeAnnouncementRoleName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isPhotographerRole(value: string) {
  const normalized = normalizeAnnouncementRoleName(value);
  return normalized.includes("camara") || normalized.includes("fotografo");
}

async function matchesAnnouncementAudience(
  announcement: AnnouncementSummary,
  user: UserContext,
) {
  const audienceType = announcement.audience_type || "all";

  if (audienceType === "all") {
    return true;
  }

  if (!user.userId) {
    return false;
  }

  const linkedPerson = await getLinkedPersonForUserContext(user);
  const linkedRoles = (linkedPerson?.roles ?? []).map(normalizeAnnouncementRoleName);
  const targetRoles = (announcement.target_role_names ?? []).map(
    normalizeAnnouncementRoleName,
  );

  if (audienceType === "photographers") {
    const targetPersonIds = announcement.target_person_ids ?? [];
    if (targetPersonIds.length) {
      return Boolean(
        linkedPerson?.id && targetPersonIds.includes(linkedPerson.id),
      );
    }

    return linkedRoles.some(isPhotographerRole);
  }

  if (audienceType === "roles") {
    return linkedRoles.some((role) => targetRoles.includes(role));
  }

  if (audienceType === "people") {
    return Boolean(
      linkedPerson?.id &&
      (announcement.target_person_ids ?? []).includes(linkedPerson.id),
    );
  }

  return false;
}

async function fetchActiveAnnouncementQuery(user: UserContext) {
  try {
    const supabase = await createSupabaseServerClient();
    const result = await supabase
      .from("announcements")
      .select(ANNOUNCEMENT_SELECT)
      .eq("active", true)
      .order("updated_at", { ascending: false })
      .limit(20);

    // Announcements are optional for the dashboard shell. If the table,
    // policies, or feature wiring are not available yet, fail closed and
    // keep the rest of the app interactive without noisy overlays.
    if (result.error) {
      return null;
    }

    const announcements = (result.data as AnnouncementSummary[] | null) ?? [];
    for (const announcement of announcements) {
      if (!isAnnouncementVisibleNow(announcement)) {
        continue;
      }

      if (await matchesAnnouncementAudience(announcement, user)) {
        return announcement;
      }
    }

    return null;
  } catch {
    return null;
  }
}

async function fetchLatestAnnouncementQuery() {
  try {
    const supabase = await createSupabaseServerClient();
    const result = await supabase
      .from("announcements")
      .select(ANNOUNCEMENT_SELECT)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (result.error) {
      return null;
    }

    return (result.data as AnnouncementSummary | null) ?? null;
  } catch {
    return null;
  }
}

export async function getActiveAnnouncement(user: UserContext) {
  return fetchActiveAnnouncementQuery(user);
}

export async function getLatestAnnouncement() {
  return fetchLatestAnnouncementQuery();
}
