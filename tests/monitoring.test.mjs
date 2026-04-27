import test from "node:test";
import assert from "node:assert/strict";

import monitoring from "../.codex-temp/test-dist/lib/monitoring.js";

test("buildHealthStatus reports overall failure when a critical check fails", () => {
  const status = monitoring.buildHealthStatus({
    configured: true,
    serviceRoleConfigured: true,
    databaseOk: true,
    databaseMessage: "Conectado.",
    storageOk: false,
    storageMessage: "Bucket faltante",
  });

  assert.equal(status.ok, false);
  assert.equal(status.database.ok, true);
  assert.equal(status.storage.ok, false);
  assert.equal(status.storage.message, "Bucket faltante");
});

test("formatOperationalAlertText renders readable alert lines", () => {
  const text = monitoring.formatOperationalAlertText({
    severity: "warning",
    area: "teams",
    message: "Nuevo reporte de equipo desde la pantalla de Teams.",
    details: {
      teamDisplayName: "Atenas (Córdoba)",
      reason: "Escudo incorrecto",
      detail: "prueba",
    },
    timestamp: "2026-04-22T01:33:56.280Z",
  });

  assert.match(text, /\[warning\] teams/);
  assert.match(text, /Team Display Name: Atenas \(Córdoba\)/);
  assert.match(text, /Reason: Escudo incorrecto/);
  assert.match(text, /Detail: prueba/);
  assert.match(text, /Timestamp: 2026-04-22T01:33:56.280Z/);
});
