import test from "node:test";
import assert from "node:assert/strict";

import integrations from "../.codex-temp/test-dist/lib/integrations.js";

const match = {
  away_team: "Visitante",
  competition: "Liga Test",
  home_team: "Local",
  kickoff_at: "2026-05-01T20:00:00.000Z",
  production_mode: "Full",
  timezone: "America/Bogota",
  venue: "Cancha 1",
};

test("buildMatchNotificationMessage includes personalized confirmation links", () => {
  const message = integrations.buildMatchNotificationMessage({
    match,
    personName: "Maria Gomez",
    roleNames: ["Realizador"],
    confirmationLinks: {
      yes: "https://dashboard.example.com/confirmar-asistencia?token=abc&response=yes",
      no: "https://dashboard.example.com/confirmar-asistencia?token=abc&response=no",
    },
  });

  assert.match(message, /Confirmar SI: https:\/\/dashboard\.example\.com\/confirmar-asistencia\?token=abc&response=yes/);
  assert.match(message, /No puedo asistir: https:\/\/dashboard\.example\.com\/confirmar-asistencia\?token=abc&response=no/);
});
