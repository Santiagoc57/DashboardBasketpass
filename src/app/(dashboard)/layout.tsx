import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getUserContext } from "@/lib/auth";
import { getActiveAnnouncement } from "@/lib/data/announcements";
import { appEnv, isSupabaseConfigured } from "@/lib/env";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-pathname") ?? "";
  const user = isSupabaseConfigured ? await getUserContext() : null;
  const announcement =
    isSupabaseConfigured && user?.userId
      ? await getActiveAnnouncement()
      : null;
  const allowsGuestMiJornada =
    appEnv.allowGuestMiJornadaAccess && pathname === "/mi-jornada";

  if (isSupabaseConfigured && !user?.userId && !allowsGuestMiJornada) {
    redirect("/login");
  }

  return (
    <DashboardShell user={user} announcement={announcement}>
      {children}
    </DashboardShell>
  );
}
