import { describe, expect, it } from "bun:test";
import { ValidationError } from "@/core/domain/errors";
import {
  createInvitationStatus,
  createOrganization,
  createOrganizationInvitation,
  createOrganizationMember,
  createOrganizationName,
  createOrganizationRole,
  createOrganizationSlug,
} from "@/core/domain/organization";

describe("Organization domain entity & value objects", () => {
  it("validates and normalizes organization name", () => {
    expect(createOrganizationName("  Iglesia Central  ")).toBe(
      "Iglesia Central",
    );
    expect(() => createOrganizationName("")).toThrow(ValidationError);
    expect(() => createOrganizationName("   ")).toThrow(ValidationError);
    expect(() => createOrganizationName("a".repeat(101))).toThrow(
      ValidationError,
    );
  });

  it("validates and normalizes slug", () => {
    expect(createOrganizationSlug("Iglesia Central")).toBe("iglesia-central");
    expect(createOrganizationSlug("Ministerio Joven 2026")).toBe(
      "ministerio-joven-2026",
    );
    expect(() => createOrganizationSlug("a")).toThrow(ValidationError);
    expect(() => createOrganizationSlug("!@#$%^")).toThrow(ValidationError);
  });

  it("validates organization roles", () => {
    expect(createOrganizationRole("owner")).toBe("owner");
    expect(createOrganizationRole("admin")).toBe("admin");
    expect(createOrganizationRole("member")).toBe("member");
    expect(() => createOrganizationRole("superuser")).toThrow(ValidationError);
  });

  it("validates invitation statuses", () => {
    expect(createInvitationStatus("pending")).toBe("pending");
    expect(createInvitationStatus("accepted")).toBe("accepted");
    expect(createInvitationStatus("rejected")).toBe("rejected");
    expect(createInvitationStatus("canceled")).toBe("canceled");
    expect(() => createInvitationStatus("unknown")).toThrow(ValidationError);
  });

  it("creates a valid Organization entity", () => {
    const org = createOrganization({
      id: "org-1",
      name: "WorshipFlow Central",
      slug: "worshipflow-central",
      logo: "https://example.com/logo.png",
    });
    expect(org.id).toBe("org-1");
    expect(org.name).toBe("WorshipFlow Central");
    expect(org.slug).toBe("worshipflow-central");
    expect(org.logo).toBe("https://example.com/logo.png");
    expect(org.createdAt).toBeDefined();
  });

  it("creates a valid OrganizationMember entity", () => {
    const member = createOrganizationMember({
      id: "mem-1",
      organizationId: "org-1",
      userId: "u-1",
      role: "admin",
    });
    expect(member.id).toBe("mem-1");
    expect(member.organizationId).toBe("org-1");
    expect(member.userId).toBe("u-1");
    expect(member.role).toBe("admin");
  });

  it("creates a valid OrganizationInvitation entity", () => {
    const invite = createOrganizationInvitation({
      id: "inv-1",
      organizationId: "org-1",
      email: "Volunteer@Church.org",
      role: "member",
      expiresAt: "2026-12-31T23:59:59.000Z",
      inviterId: "u-admin",
    });
    expect(invite.email).toBe("volunteer@church.org");
    expect(invite.status).toBe("pending");
    expect(invite.role).toBe("member");
  });
});
