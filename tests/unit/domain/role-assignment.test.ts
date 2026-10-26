import { describe, expect, test } from "bun:test";
import { ValidationError } from "@/core/domain/errors";
import {
  createInstrumentName,
  createPracticeStatus,
  createRoleAssignment,
  createRoleType,
  roleUniquenessKey,
} from "@/core/domain/role-assignment";

describe("role assignments", () => {
  test("role types and statuses enforced", () => {
    expect(createRoleType("INSTRUMENT")).toBe("INSTRUMENT");
    expect(createPracticeStatus("READY")).toBe("READY");
    expect(() => createRoleType("LEAD")).toThrow(ValidationError);
    expect(() => createPracticeStatus("DONE")).toThrow(ValidationError);
  });

  test("INSTRUMENT needs name, vocals forbid it", () => {
    expect(createInstrumentName("INSTRUMENT", "Keys")).toBe("Keys");
    expect(createInstrumentName("FIRST_VOICE", null)).toBeNull();
    expect(() => createInstrumentName("INSTRUMENT", "X")).toThrow(
      ValidationError,
    );
    expect(() => createInstrumentName("INSTRUMENT", null)).toThrow(
      ValidationError,
    );
    expect(() => createInstrumentName("FIRST_VOICE", "Guitar")).toThrow(
      ValidationError,
    );
  });

  test("uniqueness tuple key", () => {
    const a = createRoleAssignment({
      id: "r1",
      songId: "s",
      userId: "u",
      roleType: "SECOND_VOICE",
      practiceStatus: "PENDING",
    });
    expect(a.practiceStatus).toBe("PENDING");
    expect(roleUniquenessKey(a)).toBe("s|u|SECOND_VOICE|");
    const inst = createRoleAssignment({
      id: "r2",
      songId: "s",
      userId: "u",
      roleType: "INSTRUMENT",
      instrumentName: "Keys",
    });
    expect(roleUniquenessKey(inst)).toBe("s|u|INSTRUMENT|Keys");
  });
});
