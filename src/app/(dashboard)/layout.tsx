import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getUserContext } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = isSupabaseConfigured ? await getUserContext() : null;

  if (isSupabaseConfigured && !user?.userId) {
    redirect("/login");
  }

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
