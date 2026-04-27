import test from "node:test";
import assert from "node:assert/strict";

import notes from "../.codex-temp/test-dist/lib/people-notes.js";

test("parsePersonNotesMeta extracts structured fields from free text", () => {
  const parsed = notes.parsePersonNotesMeta(
    [
      "Rol principal: Producción",
      "Rol adicional 1: Relatos",
      "Ciudad: Bogotá",
      "Equipos que cubre: Nacional y Metro",
      "",
      "Observaciones libres",
    ].join("\n"),
  );

  assert.deepEqual(parsed.roles, ["Producción", "Relatos"]);
  assert.equal(parsed.role, "Producción");
  assert.equal(parsed.city, "Bogotá");
  assert.equal(parsed.coverage, "Nacional y Metro");
  assert.equal(parsed.notes, "Observaciones libres");
});

test("buildPersonNotesMeta round-trips structured notes", () => {
  const built = notes.buildPersonNotesMeta({
    role: "Producción",
    roles: ["Producción", "Relatos", "Soporte"],
    city: "Córdoba",
    coverage: "Liga Nacional",
    notes: "Disponible por la tarde",
  });

  assert.equal(
    built,
    [
      "Rol principal: Producción",
      "Rol adicional 1: Relatos",
      "Rol adicional 2: Soporte",
      "Ciudad: Córdoba",
      "Equipos que cubre: Liga Nacional",
      "",
      "Disponible por la tarde",
    ].join("\n"),
  );

  const parsed = notes.parsePersonNotesMeta(built);
  assert.deepEqual(parsed.roles, ["Producción", "Relatos", "Soporte"]);
});

test("getPersonRoleValues falls back to the profile role", () => {
  assert.deepEqual(
    notes.getPersonRoleValues({ role: "", roles: [], city: "", coverage: "", notes: "" }, "Editor"),
    ["Editor"],
  );
});

