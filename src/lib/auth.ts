import { redirect } from "next/navigation";

import type { AppRole, ProfileRow } from "@/lib/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getUserContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      userId: null,
      email: null,
      profile: null,
      role: "viewer" as AppRole,
      canEdit: false,
    };
  }

  let profile: ProfileRow | null = null;
  const profileQuery = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileQuery.error) {
    throw profileQuery.error;
  }

  profile = (profileQuery.data as ProfileRow | null) ?? null;

  if (!profile) {
    const insert = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        full_name:
          (user.user_metadata?.full_name as string | undefined) ??
          (user.email?.split("@")[0] ?? "Usuario"),
      })
      .select("*")
      .single();

    if (insert.error) {
      throw insert.error;
    }

    profile = insert.data as ProfileRow;
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    profile,
    role: profile.role,
    canEdit: profile.role === "admin" || profile.role === "editor",
  };
}

export async function requireUserContext() {
  const context = await getUserContext();

  if (!context.userId) {
    redirect("/login");
  }

  return context;
}

export async function requireEditor() {
  const context = await requireUserContext();

  if (!context.canEdit) {
    throw new Error("No tenes permisos para editar.");
  }

  return context;
}
