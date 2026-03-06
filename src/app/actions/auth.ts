"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureErrorMessage } from "@/lib/utils";
import {
  getRedirectTarget,
  redirectWithNotice,
  rethrowNavigationError,
} from "@/app/actions/helpers";

export async function loginAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, "/grid");
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirectWithNotice({
      redirectTo: "/login",
      intent: "error",
      notice: "Email y password son obligatorios.",
    });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const result = await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      throw result.error;
    }

    redirect(redirectTo);
  } catch (error) {
    rethrowNavigationError(error);
    redirectWithNotice({
      redirectTo: "/login",
      intent: "error",
      notice: ensureErrorMessage(error),
    });
  }
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
