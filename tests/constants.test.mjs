import test from "node:test";
import assert from "node:assert/strict";

import constants from "../.codex-temp/test-dist/lib/constants.js";

test("resolveDashboardAccessRole keeps strong backoffice roles over collaborator metadata", () => {
  assert.equal(
    constants.resolveDashboardAccessRole({
      profileRole: "editor",
      appMetadata: { bp_access_role: "collaborator" },
    }),
    "editor",
  );

  assert.equal(
    constants.resolveDashboardAccessRole({
      profileRole: "viewer",
      appMetadata: { bp_access_role: "collaborator" },
    }),
    "collaborator",
  );
});

test("resolveDashboardAccessRole falls back to profile role or viewer", () => {
  assert.equal(
    constants.resolveDashboardAccessRole({
      profileRole: "coordinator",
      appMetadata: { bp_access_role: "unknown" },
    }),
    "coordinator",
  );

  assert.equal(
    constants.resolveDashboardAccessRole({
      profileRole: null,
      appMetadata: null,
    }),
    "viewer",
  );
});

test("role helpers separate full access from limited access", () => {
  assert.equal(constants.hasFullDashboardAccessRole("admin"), true);
  assert.equal(constants.hasFullDashboardAccessRole("viewer"), false);
  assert.equal(constants.hasCollaboratorOperationalAccess("collaborator"), true);
  assert.equal(constants.hasCollaboratorOperationalAccess("viewer"), false);
  assert.equal(constants.isCollaboratorLimitedRole("collaborator"), true);
  assert.equal(constants.isCollaboratorLimitedRole("editor"), false);
});

test("dashboard path helper limits limited roles to the collaborator surface", () => {
  assert.equal(constants.isDashboardPathAllowedForRole("/grid", "admin"), true);
  assert.equal(constants.isDashboardPathAllowedForRole("/mi-jornada", "viewer"), true);
  assert.equal(constants.isDashboardPathAllowedForRole("/people", "viewer"), false);
});

test("default dashboard href points to the correct landing page", () => {
  assert.equal(constants.getDefaultDashboardHrefForRole("admin"), "/grid");
  assert.equal(constants.getDefaultDashboardHrefForRole("collaborator"), "/mi-jornada");
});

test("production mode and commentary plan normalize common labels", () => {
  assert.equal(constants.normalizeProductionMode("cancha"), "En Cancha");
  assert.equal(constants.normalizeProductionMode("encoder"), "Encoder");
  assert.equal(constants.normalizeCommentaryPlan("offtube remoto"), "Offtube Remoto");
  assert.equal(constants.normalizeCommentaryPlan(""), "");
});
