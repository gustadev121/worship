import { describe, expect, test } from "bun:test";
import { ValidationError } from "@/core/domain/errors";
import {
  createEmail,
  createPassword,
  createUser,
  createUsername,
  createUserRole,
  updateUser,
} from "@/core/domain/user";

function expectInvalid(fn: () => unknown) {
  expect(fn).toThrow(ValidationError);
}

describe("user factories", () => {
  test("accepts valid username shapes", () => {
    expect(createUsername("sarah.lead")).toBe("sarah.lead");
    expect(createUsername("a-1_2")).toBe("a-1_2");
  });

  test("rejects bad usernames", () => {
    for (const bad of [
      "ab",
      "UPPER",
      "has space",
      "a".repeat(33),
      "",
      42,
      null,
    ]) {
      expectInvalid(() => createUsername(bad));
    }
  });

  test("rejects bad emails", () => {
    for (const bad of ["no-at", "a@b", "@x.com", "", 7]) {
      expectInvalid(() => createEmail(bad));
    }
    expect(createEmail("Admin@Church.ORG")).toBe("admin@church.org");
  });

  test("password length 8-128", () => {
    expect(createPassword("ChangeMe123!")).toBe("ChangeMe123!");
    expectInvalid(() => createPassword("short7"));
    expectInvalid(() => createPassword("x".repeat(129)));
  });

  test("role is ADMIN or MEMBER", () => {
    expect(createUserRole("ADMIN")).toBe("ADMIN");
    expectInvalid(() => createUserRole("OWNER"));
  });

  test("createUser defaults role MEMBER and updates it", () => {
    const u = createUser({
      id: "u1",
      username: "sarah.lead",
      email: "s@s.io",
      passwordHash: "h",
    });
    expect(u.role).toBe("MEMBER");
    const admin = updateUser(u, { role: "ADMIN" });
    expect(admin.role).toBe("ADMIN");
    expect(admin.updatedAt >= u.updatedAt).toBe(true);
    expectInvalid(() => updateUser(u, { username: "BAD NAME" }));
  });
});
