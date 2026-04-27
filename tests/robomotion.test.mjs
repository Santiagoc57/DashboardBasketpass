import test from "node:test";
import assert from "node:assert/strict";

import robomotion from "../.codex-temp/test-dist/lib/robomotion.js";

test("normalizeRobomotionWhatsAppRequest normalizes and deduplicates phones", () => {
  const result = robomotion.normalizeRobomotionWhatsAppRequest({
    action: "todos",
    phones: ["+57 300 123 4567", "573001234567", "  "],
    message: "Hola equipo",
  });

  assert.deepEqual(result, {
    ok: true,
    data: {
      action: "todos",
      phone: "573001234567",
      phones: ["573001234567"],
      message: "Hola equipo",
      recipientName: null,
      matchLabel: null,
    },
  });
});

test("normalizeRobomotionWhatsAppRequest accepts individual phone fallback", () => {
  const result = robomotion.normalizeRobomotionWhatsAppRequest({
    action: "individual",
    phones: ["+54 11 5555 1234"],
    message: "Hola",
    recipientName: "Santiago",
  });

  assert.deepEqual(result, {
    ok: true,
    data: {
      action: "individual",
      phone: "541155551234",
      phones: ["541155551234"],
      message: "Hola",
      recipientName: "Santiago",
      matchLabel: null,
    },
  });
});

test("normalizeRobomotionWhatsAppRequest rejects empty phone lists", () => {
  const result = robomotion.normalizeRobomotionWhatsAppRequest({
    action: "todos",
    phones: [],
    message: "Hola",
  });

  assert.deepEqual(result, {
    ok: false,
    error: "Debes indicar al menos un teléfono válido para WhatsApp.",
  });
});
