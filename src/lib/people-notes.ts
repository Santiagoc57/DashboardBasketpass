const ROLE_PREFIX = "Rol principal:";
const COVERAGE_PREFIX = "Equipos que cubre:";

export type PersonNotesMeta = {
  role: string;
  coverage: string;
  notes: string;
};

export function parsePersonNotesMeta(value?: string | null): PersonNotesMeta {
  if (!value) {
    return { role: "", coverage: "", notes: "" };
  }

  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trimEnd());

  let role = "";
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

    if (trimmed.startsWith(COVERAGE_PREFIX)) {
      coverage = trimmed.replace(COVERAGE_PREFIX, "").trim();
      return false;
    }

    return true;
  });

  return {
    role,
    coverage,
    notes: freeLines.join("\n").trim(),
  };
}

export function buildPersonNotesMeta(input: {
  role?: string | null;
  coverage?: string | null;
  notes?: string | null;
}) {
  const role = input.role?.trim() ?? "";
  const coverage = input.coverage?.trim() ?? "";
  const notes = input.notes?.trim() ?? "";
  const lines: string[] = [];

  if (role) {
    lines.push(`${ROLE_PREFIX} ${role}`);
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
