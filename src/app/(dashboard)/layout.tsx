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
  const user = isSupabaseConfigured ? await getUserContext() : null;
  const announcement =
    isSupabaseConfigured && user?.userId
      ? await getActiveAnnouncement()
      : null;

  if (isSupabaseConfigured && !user?.userId && !appEnv.allowGuestMiJornadaAccess) {
    redirect("/login");
  }

  return (
    <DashboardShell user={user} announcement={announcement}>
      {children}
    </DashboardShell>
  );
}
