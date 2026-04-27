import test from "node:test";
import assert from "node:assert/strict";

import confirmation from "../.codex-temp/test-dist/lib/assignment-confirmation.js";

test("getAssignmentConfirmationPresentation maps pending, accepted and declined", () => {
  assert.deepEqual(
    confirmation.getAssignmentConfirmationPresentation("pending", false),
    {
      status: "pending",
      label: "Pendiente",
      shortLabel: "?",
      tone: "neutral",
    },
  );
  assert.equal(
    confirmation.getAssignmentConfirmationPresentation("accepted", false).label,
    "Confirmado",
  );
  assert.equal(
    confirmation.getAssignmentConfirmationPresentation("declined", true).label,
    "No asiste",
  );
});

test("getAssignmentConfirmationUpdate preserves confirmed compatibility", () => {
  assert.deepEqual(confirmation.getAssignmentConfirmationUpdate("yes"), {
    status: "accepted",
    confirmed: true,
  });
  assert.deepEqual(confirmation.getAssignmentConfirmationUpdate("no"), {
    status: "declined",
    confirmed: false,
  });
  assert.equal(confirmation.getAssignmentConfirmationUpdate("maybe"), null);
});

test("buildAssignmentConfirmationLinks builds public yes and no links", () => {
  assert.deepEqual(
    confirmation.buildAssignmentConfirmationLinks({
      appUrl: "https://dashboard.example.com/",
      token: "abc 123",
    }),
    {
      yes: "https://dashboard.example.com/confirmar-asistencia?token=abc%20123&response=yes",
      no: "https://dashboard.example.com/confirmar-asistencia?token=abc%20123&response=no",
    },
  );
});

test("buildAssignmentConfirmationLinks normalizes localhost to explicit http loopback", () => {
  assert.deepEqual(
    confirmation.buildAssignmentConfirmationLinks({
      appUrl: "localhost:3000",
      token: "abc",
    }),
    {
      yes: "http://127.0.0.1:3000/confirmar-asistencia?token=abc&response=yes",
      no: "http://127.0.0.1:3000/confirmar-asistencia?token=abc&response=no",
    },
  );
});
