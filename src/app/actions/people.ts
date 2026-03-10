"use server";

import { revalidatePath } from "next/cache";

import {
  getRedirectTarget,
  redirectWithNotice,
  rethrowNavigationError,
} from "@/app/actions/helpers";
import { requireEditor } from "@/lib/auth";
import { buildPersonNotesMeta } from "@/lib/people-notes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureErrorMessage, maybeNull } from "@/lib/utils";

export async function upsertPersonAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, "/people");
  await requireEditor();
  const hasActiveField = formData.has("active");

  const payload = {
    full_name: String(formData.get("fullName") ?? "").trim(),
    phone: maybeNull(String(formData.get("phone") ?? "")),
    email: maybeNull(String(formData.get("email") ?? "")),
    notes: buildPersonNotesMeta({
      role: maybeNull(String(formData.get("roleName") ?? "")),
      coverage: maybeNull(String(formData.get("coverageTeams") ?? "")),
      notes: maybeNull(String(formData.get("notes") ?? "")),
    }),
    active: hasActiveField
      ? String(formData.get("active") ?? "") !== "off"
      : true,
  };

  try {
    const supabase = await createSupabaseServerClient();
    const personId = String(formData.get("personId") ?? "");
    const result = personId
      ? await supabase.from("people").update(payload).eq("id", personId)
      : await supabase.from("people").insert(payload);

    if (result.error) {
      throw result.error;
    }

    revalidatePath("/people");
    redirectWithNotice({
      redirectTo,
      intent: "success",
      notice: personId ? "Registro de personal actualizado." : "Registro de personal creado.",
    });
  } catch (error) {
    rethrowNavigationError(error);
    redirectWithNotice({
      redirectTo,
      intent: "error",
      notice: ensureErrorMessage(error),
    });
  }
}

export async function deletePersonAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, "/people");
  await requireEditor();

  try {
    const supabase = await createSupabaseServerClient();
    const result = await supabase
      .from("people")
      .delete()
      .eq("id", String(formData.get("personId") ?? ""));

    if (result.error) {
      throw result.error;
    }

    revalidatePath("/people");
    redirectWithNotice({
      redirectTo,
      intent: "success",
      notice: "Registro de personal eliminado.",
    });
  } catch (error) {
    rethrowNavigationError(error);
    redirectWithNotice({
      redirectTo,
      intent: "error",
      notice: ensureErrorMessage(error),
    });
  }
}
