const ROLE_PREFIX = "Rol principal:";
const CITY_PREFIX = "Ciudad:";
const COVERAGE_PREFIX = "Equipos que cubre:";

export type PersonNotesMeta = {
  role: string;
  city: string;
  coverage: string;
  notes: string;
};

export function parsePersonNotesMeta(value?: string | null): PersonNotesMeta {
  if (!value) {
    return { role: "", city: "", coverage: "", notes: "" };
  }

  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trimEnd());

  let role = "";
  let city = "";
  let coverage = "";

  const freeLines = lines.filter((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      return false;
    }

    if (trimmed.startsWith(ROLE_PREFIX)) {
      role = trimmed.replace(ROLE_PREFIX, "").trim();
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

  return {
    role,
    city,
    coverage,
    notes: freeLines.join("\n").trim(),
  };
}

export function buildPersonNotesMeta(input: {
  role?: string | null;
  city?: string | null;
  coverage?: string | null;
  notes?: string | null;
}) {
  const role = input.role?.trim() ?? "";
  const city = input.city?.trim() ?? "";
  const coverage = input.coverage?.trim() ?? "";
  const notes = input.notes?.trim() ?? "";
  const lines: string[] = [];

  if (role) {
    lines.push(`${ROLE_PREFIX} ${role}`);
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
