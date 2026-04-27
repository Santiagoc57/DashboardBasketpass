import type { PersonRow } from "@/lib/database.types";
import { getPersonRoleValues, parsePersonNotesMeta } from "@/lib/people-notes";
import type { UserContext } from "@/lib/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LinkedPersonSummary = Pick<
  PersonRow,
  "id" | "full_name" | "email" | "phone" | "active" | "notes"
> & {
  roles: string[];
};

async function findLinkedPersonByEmailOrName(params: {
  email: string | null;
  displayName: string;
}) {
  const supabase = await createSupabaseServerClient();
  let linkedPerson: Pick<
    PersonRow,
    "id" | "full_name" | "email" | "phone" | "active" | "notes"
  > | null = null;

  if (params.email) {
    const linkedByEmail = await supabase
      .from("people")
      .select("id, full_name, email, phone, active, notes")
      .eq("email", params.email)
      .maybeSingle();

    if (!linkedByEmail.error) {
      linkedPerson = linkedByEmail.data ?? null;
    }
  }

  if (!linkedPerson && params.displayName) {
    const linkedByName = await supabase
      .from("people")
      .select("id, full_name, email, phone, active, notes")
      .eq("full_name", params.displayName)
      .maybeSingle();

    if (!linkedByName.error) {
      linkedPerson = linkedByName.data ?? null;
    }
  }

  if (!linkedPerson) {
    return null;
  }

  const meta = parsePersonNotesMeta(linkedPerson.notes);

  return {
    ...linkedPerson,
    roles: getPersonRoleValues(meta),
  } satisfies LinkedPersonSummary;
}

export async function getLinkedPersonForUser(params: {
  email: string | null;
  displayName: string;
}) {
  return findLinkedPersonByEmailOrName(params);
}

export async function getLinkedPersonForUserContext(user: UserContext) {
  const displayName =
    user.profile?.full_name?.trim() || user.email?.split("@")[0] || "Usuario";

  return findLinkedPersonByEmailOrName({
    email: user.email,
    displayName,
  });
}
