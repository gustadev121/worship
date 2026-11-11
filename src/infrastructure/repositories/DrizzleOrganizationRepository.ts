import { eq } from "drizzle-orm";
import type { IOrganizationRepository } from "@/core/application/ports";
import { ConflictError, NotFoundError } from "@/core/domain/errors";
import type {
  Organization,
  OrganizationInvitation,
  OrganizationMember,
  OrganizationRole,
} from "@/core/domain/organization";
import type { User } from "@/core/domain/user";
import { type Db, isUniqueViolation } from "../db/client";
import { invitation, member, organization, user } from "../db/schema";

export class DrizzleOrganizationRepository implements IOrganizationRepository {
  constructor(private readonly db: Db) {}

  async findById(id: string): Promise<Organization | null> {
    const rows = await this.db
      .select()
      .from(organization)
      .where(eq(organization.id, id));
    const r = rows[0];
    if (!r) return null;
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      logo: r.logo,
      createdAt: r.createdAt,
      metadata: r.metadata,
    };
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    const rows = await this.db
      .select()
      .from(organization)
      .where(eq(organization.slug, slug));
    const r = rows[0];
    if (!r) return null;
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      logo: r.logo,
      createdAt: r.createdAt,
      metadata: r.metadata,
    };
  }

  async listByUser(
    userId: string,
  ): Promise<{ organization: Organization; role: OrganizationRole }[]> {
    const rows = await this.db
      .select({
        org: organization,
        memberRole: member.role,
      })
      .from(member)
      .innerJoin(organization, eq(member.organizationId, organization.id))
      .where(eq(member.userId, userId));

    return rows.map((r) => ({
      organization: {
        id: r.org.id,
        name: r.org.name,
        slug: r.org.slug,
        logo: r.org.logo,
        createdAt: r.org.createdAt,
        metadata: r.org.metadata,
      },
      role: r.memberRole as OrganizationRole,
    }));
  }

  async create(
    org: Organization,
    creatorUserId: string,
  ): Promise<Organization> {
    try {
      await this.db.insert(organization).values({
        id: org.id,
        name: org.name,
        slug: org.slug,
        logo: org.logo,
        createdAt: org.createdAt,
        metadata: org.metadata,
      });

      const memberId = crypto.randomUUID();
      await this.db.insert(member).values({
        id: memberId,
        organizationId: org.id,
        userId: creatorUserId,
        role: "owner",
        createdAt: new Date().toISOString(),
      });

      return org;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError("Organization slug already taken");
      }
      throw error;
    }
  }

  async addMember(m: OrganizationMember): Promise<OrganizationMember> {
    await this.db.insert(member).values({
      id: m.id,
      organizationId: m.organizationId,
      userId: m.userId,
      role: m.role,
      createdAt: m.createdAt,
    });
    return m;
  }

  async listMembers(
    organizationId: string,
  ): Promise<{ member: OrganizationMember; user: User }[]> {
    const rows = await this.db
      .select({
        mem: member,
        usr: user,
      })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .where(eq(member.organizationId, organizationId));

    return rows.map((r) => ({
      member: {
        id: r.mem.id,
        organizationId: r.mem.organizationId,
        userId: r.mem.userId,
        role: r.mem.role as OrganizationRole,
        createdAt: r.mem.createdAt,
      },
      user: {
        id: r.usr.id,
        username: r.usr.name,
        email: r.usr.email,
        passwordHash: "",
        role: r.usr.role as "ADMIN" | "MEMBER",
        createdAt: r.usr.createdAt,
        updatedAt: r.usr.updatedAt,
      },
    }));
  }

  async createInvitation(
    inv: OrganizationInvitation,
  ): Promise<OrganizationInvitation> {
    await this.db.insert(invitation).values({
      id: inv.id,
      organizationId: inv.organizationId,
      email: inv.email,
      role: inv.role,
      status: inv.status,
      expiresAt: inv.expiresAt,
      inviterId: inv.inviterId,
      createdAt: inv.createdAt,
    });
    return inv;
  }

  async findInvitationById(id: string): Promise<OrganizationInvitation | null> {
    const rows = await this.db
      .select()
      .from(invitation)
      .where(eq(invitation.id, id));
    const r = rows[0];
    if (!r) return null;
    return {
      id: r.id,
      organizationId: r.organizationId,
      email: r.email,
      role: r.role as OrganizationRole,
      status: r.status as OrganizationInvitation["status"],
      expiresAt: r.expiresAt,
      inviterId: r.inviterId,
      createdAt: r.createdAt,
    };
  }

  async acceptInvitation(
    invitationId: string,
    userId: string,
  ): Promise<OrganizationMember> {
    const inv = await this.findInvitationById(invitationId);
    if (!inv) {
      throw new NotFoundError("Invitación no encontrada");
    }
    await this.db
      .update(invitation)
      .set({ status: "accepted" })
      .where(eq(invitation.id, invitationId));

    const newMember: OrganizationMember = {
      id: crypto.randomUUID(),
      organizationId: inv.organizationId,
      userId,
      role: inv.role,
      createdAt: new Date().toISOString(),
    };
    return this.addMember(newMember);
  }
}
