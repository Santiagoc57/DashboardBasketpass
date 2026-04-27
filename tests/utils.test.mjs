import test from "node:test";
import assert from "node:assert/strict";

import utils from "../.codex-temp/test-dist/lib/utils.js";

test("sanitizePhone removes non numeric characters", () => {
  assert.equal(utils.sanitizePhone("+54 (11) 5555-1234"), "541155551234");
  assert.equal(utils.sanitizePhone(null), "");
});

test("buildWhatsAppUrl returns an empty string without a phone", () => {
  assert.equal(utils.buildWhatsAppUrl(undefined), "");
  assert.equal(utils.buildWhatsAppUrl("11 5555 1234"), "https://wa.me/1155551234");
});

test("normalizeText strips accents and casing", () => {
  assert.equal(utils.normalizeText("  Producción Técnica  "), "produccion tecnica");
});

test("pickFirstString returns the first meaningful string", () => {
  assert.equal(utils.pickFirstString([null, "", "   ", "  Hola  ", "Mundo"]), "Hola");
});

test("maybeNull converts blank values to null", () => {
  assert.equal(utils.maybeNull("  "), null);
  assert.equal(utils.maybeNull("  listo "), "listo");
});

test("toTitleCase uppercases token initials", () => {
  assert.equal(utils.toTitleCase("control de calidad"), "Control De Calidad");
});

test("ensureErrorMessage prefers known error shapes", () => {
  assert.equal(
    utils.ensureErrorMessage({ hint: "Revisar credenciales" }),
    "Revisar credenciales",
  );
});

