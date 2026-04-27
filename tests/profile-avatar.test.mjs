import test from "node:test";
import assert from "node:assert/strict";

import avatar from "../.codex-temp/test-dist/lib/profile-avatar.js";

test("getAvatarStorageKey prefers user id over email and full name", () => {
  assert.equal(
    avatar.getAvatarStorageKey({
      userId: "user-123",
      email: "person@example.com",
      fullName: "Persona Operativa",
    }),
    "basket-production-avatar:user-123",
  );
});

test("getAvatarStorageKey falls back across identity fields", () => {
  assert.equal(
    avatar.getAvatarStorageKey({
      userId: null,
      email: "person@example.com",
      fullName: "Persona Operativa",
    }),
    "basket-production-avatar:person@example.com",
  );

  assert.equal(
    avatar.getAvatarStorageKey({
      userId: null,
      email: null,
      fullName: "Persona Operativa",
    }),
    "basket-production-avatar:Persona Operativa",
  );
});

