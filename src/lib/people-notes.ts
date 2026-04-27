const ROLE_PREFIX = "Rol principal:";
const SECONDARY_ROLE_PREFIX = "Rol adicional 1:";
const TERTIARY_ROLE_PREFIX = "Rol adicional 2:";
const CITY_PREFIX = "Ciudad:";
const COVERAGE_PREFIX = "Equipos que cubre:";

export type PersonNotesMeta = {
  role: string;
  roles: string[];
  city: string;
  coverage: string;
  notes: string;
};

function normalizePersonRoles(values: Array<string | null | undefined>) {
  return values
    .map((value) => value?.trim() ?? "")
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index)
    .slice(0, 3);
}

export function parsePersonNotesMeta(value?: string | null): PersonNotesMeta {
  if (!value) {
    return { role: "", roles: [], city: "", coverage: "", notes: "" };
  }

  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trimEnd());

  const roles: string[] = [];
  let city = "";
  let coverage = "";

  const freeLines = lines.filter((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      return false;
    }

    if (trimmed.startsWith(ROLE_PREFIX)) {
      roles.push(trimmed.replace(ROLE_PREFIX, "").trim());
      return false;
    }

    if (trimmed.startsWith(SECONDARY_ROLE_PREFIX)) {
      roles.push(trimmed.replace(SECONDARY_ROLE_PREFIX, "").trim());
      return false;
    }

    if (trimmed.startsWith(TERTIARY_ROLE_PREFIX)) {
      roles.push(trimmed.replace(TERTIARY_ROLE_PREFIX, "").trim());
      return false;
    }

    if (trimmed.startsWith(CITY_PREFIX)) {
      city = trimmed.replace(CITY_PREFIX, "").trim();
      return false;
    }

    if (trimmed.startsWith(COVERAGE_PREFIX)) {
      coverage = trimmed.replace(COVERAGE_PREFIX, "").trim();
      return false;
    }

    return true;
  });

  const normalizedRoles = normalizePersonRoles(roles);

  return {
    role: normalizedRoles[0] ?? "",
    roles: normalizedRoles,
    city,
    coverage,
    notes: freeLines.join("\n").trim(),
  };
}

export function buildPersonNotesMeta(input: {
  role?: string | null;
  roles?: Array<string | null | undefined>;
  city?: string | null;
  coverage?: string | null;
  notes?: string | null;
}) {
  const roles = normalizePersonRoles(input.roles ?? [input.role]);
  const city = input.city?.trim() ?? "";
  const coverage = input.coverage?.trim() ?? "";
  const notes = input.notes?.trim() ?? "";
  const lines: string[] = [];

  if (roles[0]) {
    lines.push(`${ROLE_PREFIX} ${roles[0]}`);
  }

  if (roles[1]) {
    lines.push(`${SECONDARY_ROLE_PREFIX} ${roles[1]}`);
  }

  if (roles[2]) {
    lines.push(`${TERTIARY_ROLE_PREFIX} ${roles[2]}`);
  }

  if (city) {
    lines.push(`${CITY_PREFIX} ${city}`);
  }

  if (coverage) {
    lines.push(`${COVERAGE_PREFIX} ${coverage}`);
  }

  if (notes) {
    if (lines.length) {
      lines.push("");
    }

    lines.push(notes);
  }

  return lines.join("\n").trim() || null;
}

export function getPersonRoleValues(
  meta: PersonNotesMeta,
  fallbackRole?: string | null,
) {
  if (meta.roles.length) {
    return meta.roles;
  }

  const normalizedFallback = fallbackRole?.trim() ?? "";
  return normalizedFallback ? [normalizedFallback] : [];
}
