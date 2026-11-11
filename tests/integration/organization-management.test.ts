import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { convertV4MiniflareOptions, Miniflare } from "miniflare";
import {
  AcceptInvitationUseCase,
  CreateOrganizationUseCase,
  InviteMemberUseCase,
  ListUserOrganizationsUseCase,
} from "@/core/application/use-cases/organizations";
import { ForbiddenError } from "@/core/domain/errors";
import { type Db, getDb } from "@/infrastructure/db/client";
import { user } from "@/infrastructure/db/schema";
import { DrizzleOrganizationRepository } from "@/infrastructure/repositories/DrizzleOrganizationRepository";

interface Fixture {
  db: Db;
  mf: Miniflare;
  orgs: DrizzleOrganizationRepository;
}

async function setup(): Promise<Fixture> {
  const mf = new Miniflare(
    convertV4MiniflareOptions({
      workers: [
        {
          name: "test",
          compatibilityDate: "2026-10-26",
          modules: true,
          script: "export default { fetch() { return new Response('ok'); } }",
          d1Databases: ["DB"],
        },
      ],
    }),
  );
  const db = await getDb(await mf.getD1Database("DB"));
  const orgs = new DrizzleOrganizationRepository(db);
  return { db, mf, orgs };
}

let fx: Fixture;

beforeEach(async () => {
  fx = await setup();
});

afterEach(async () => {
  await fx.mf.dispose();
});

describe("Organization Management Use Cases", () => {
  test("Creates organization and automatically assigns creator as owner", async () => {
    await fx.db.insert(user).values({
      id: "user-leader",
      name: "Leader",
      email: "leader@worship.local",
      role: "ADMIN",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const createOrg = new CreateOrganizationUseCase(fx.orgs);
    const listUserOrgs = new ListUserOrganizationsUseCase(fx.orgs);

    const { organization } = await createOrg.execute({
      actor: {
        sub: "user-leader",
        username: "leader",
        role: "ADMIN",
      },
      name: "Iglesia Esperanza Viva",
      slug: "iglesia-esperanza-viva",
    });

    expect(organization.id).toBeDefined();
    expect(organization.name).toBe("Iglesia Esperanza Viva");
    expect(organization.slug).toBe("iglesia-esperanza-viva");

    const userOrgs = await listUserOrgs.execute({
      actor: { sub: "user-leader", username: "leader", role: "ADMIN" },
    });

    expect(userOrgs.organizations.length).toBe(1);
    expect(userOrgs.organizations[0].organization.id).toBe(organization.id);
    expect(userOrgs.organizations[0].role).toBe("owner");
  });

  test("Invites member and accepts invitation", async () => {
    await fx.db.insert(user).values([
      {
        id: "user-admin",
        name: "Admin",
        email: "admin@worship.local",
        role: "ADMIN",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "user-bassist",
        name: "Bassist",
        email: "bassist@church.org",
        role: "MEMBER",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    const createOrg = new CreateOrganizationUseCase(fx.orgs);
    const inviteMember = new InviteMemberUseCase(fx.orgs);
    const acceptInvite = new AcceptInvitationUseCase(fx.orgs);

    const { organization } = await createOrg.execute({
      actor: { sub: "user-admin", username: "admin", role: "ADMIN" },
      name: "Campus Norte",
      slug: "campus-norte",
    });

    // Admin sends invitation
    const { invitation } = await inviteMember.execute({
      actor: { sub: "user-admin", username: "admin", role: "ADMIN" },
      organizationId: organization.id,
      email: "bassist@church.org",
      role: "member",
    });

    expect(invitation.email).toBe("bassist@church.org");
    expect(invitation.status).toBe("pending");

    // Volunteer accepts invitation
    const { member } = await acceptInvite.execute({
      actor: {
        sub: "user-bassist",
        username: "bassist",
        role: "MEMBER",
      },
      invitationId: invitation.id,
    });

    expect(member.organizationId).toBe(organization.id);
    expect(member.userId).toBe("user-bassist");
    expect(member.role).toBe("member");

    // Re-accepting should fail
    await expect(
      acceptInvite.execute({
        actor: { sub: "user-bassist", username: "bassist", role: "MEMBER" },
        invitationId: invitation.id,
      }),
    ).rejects.toThrow();
  });

  test("Unauthorized member cannot send invitations", async () => {
    await fx.db.insert(user).values([
      {
        id: "user-owner",
        name: "Owner",
        email: "owner@worship.local",
        role: "ADMIN",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "user-volunteer",
        name: "Volunteer",
        email: "volunteer@worship.local",
        role: "MEMBER",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    const createOrg = new CreateOrganizationUseCase(fx.orgs);
    const inviteMember = new InviteMemberUseCase(fx.orgs);

    const { organization } = await createOrg.execute({
      actor: { sub: "user-owner", username: "owner", role: "ADMIN" },
      name: "Sede Sur",
      slug: "sede-sur",
    });

    // Regular member without org admin/owner role attempts to invite
    await expect(
      inviteMember.execute({
        actor: {
          sub: "user-volunteer",
          username: "volunteer",
          role: "MEMBER",
          organizationRole: "member",
        },
        organizationId: organization.id,
        email: "friend@church.org",
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
