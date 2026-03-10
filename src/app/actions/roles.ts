"use server";

import { revalidatePath } from "next/cache";

import {
  getRedirectTarget,
  redirectWithNotice,
  rethrowNavigationError,
} from "@/app/actions/helpers";
import { requireEditor } from "@/lib/auth";
import { normalizeRoleCategoryInput, normalizeRoleNameInput } from "@/lib/display";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureErrorMessage } from "@/lib/utils";

export async function upsertRoleAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, "/roles");
  await requireEditor();

  const payload = {
    name: normalizeRoleNameInput(String(formData.get("name") ?? "")),
    category: normalizeRoleCategoryInput(
      String(formData.get("category") ?? "Produccion"),
    ),
    sort_order: Number(formData.get("sortOrder") ?? 0),
    active: String(formData.get("active") ?? "") !== "off",
  };

  try {
    const supabase = await createSupabaseServerClient();
    const roleId = String(formData.get("roleId") ?? "");
    const result = roleId
      ? await supabase.from("roles").update(payload).eq("id", roleId)
      : await supabase.from("roles").insert(payload);

    if (result.error) {
      throw result.error;
    }

    revalidatePath("/roles");
    revalidatePath("/grid");
    redirectWithNotice({
      redirectTo,
      intent: "success",
      notice: roleId ? "Rol actualizado." : "Rol creado.",
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

export async function deleteRoleAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, "/roles");
  await requireEditor();

  try {
    const supabase = await createSupabaseServerClient();
    const result = await supabase
      .from("roles")
      .delete()
      .eq("id", String(formData.get("roleId") ?? ""));

    if (result.error) {
      throw result.error;
    }

    revalidatePath("/roles");
    revalidatePath("/grid");
    redirectWithNotice({
      redirectTo,
      intent: "success",
      notice: "Rol eliminado.",
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
