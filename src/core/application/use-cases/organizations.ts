import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../domain/errors";
import {
  createOrganization,
  createOrganizationInvitation,
  type Organization,
  type OrganizationInvitation,
  type OrganizationMember,
  type OrganizationRole,
} from "../../domain/organization";
import type { User } from "../../domain/user";
import type { IOrganizationRepository, SessionPayload } from "../ports";

function newId(): string {
  return crypto.randomUUID();
}

export class CreateOrganizationUseCase {
  constructor(private readonly orgs: IOrganizationRepository) {}

  async execute(input: {
    actor: SessionPayload;
    name: string;
    slug?: string;
    logo?: string | null;
  }): Promise<{ organization: Organization }> {
    const org = createOrganization({
      id: newId(),
      name: input.name,
      slug: input.slug,
      logo: input.logo,
    });
    const created = await this.orgs.create(org, input.actor.sub);
    return { organization: created };
  }
}

export class ListUserOrganizationsUseCase {
  constructor(private readonly orgs: IOrganizationRepository) {}

  async execute(input: { actor: SessionPayload }): Promise<{
    organizations: { organization: Organization; role: OrganizationRole }[];
  }> {
    const list = await this.orgs.listByUser(input.actor.sub);
    return { organizations: list };
  }
}

export class InviteMemberUseCase {
  constructor(private readonly orgs: IOrganizationRepository) {}

  async execute(input: {
    actor: SessionPayload;
    organizationId: string;
    email: string;
    role?: OrganizationRole;
  }): Promise<{ invitation: OrganizationInvitation }> {
    // Only admins or org members with owner/admin role can invite
    if (
      input.actor.role !== "ADMIN" &&
      input.actor.organizationRole !== "owner" &&
      input.actor.organizationRole !== "admin"
    ) {
      throw new ForbiddenError(
        "Solo administradores de la organización pueden invitar miembros",
      );
    }

    const org = await this.orgs.findById(input.organizationId);
    if (!org) {
      throw new NotFoundError("Organización no encontrada");
    }

    // 7 days expiration window
    const expiresAt = new Date(Date.now() + 7 * 86400 * 1000).toISOString();
    const inv = createOrganizationInvitation({
      id: newId(),
      organizationId: input.organizationId,
      email: input.email,
      role: input.role || "member",
      expiresAt,
      inviterId: input.actor.sub,
    });

    const created = await this.orgs.createInvitation(inv);
    return { invitation: created };
  }
}

export class AcceptInvitationUseCase {
  constructor(private readonly orgs: IOrganizationRepository) {}

  async execute(input: {
    actor: SessionPayload;
    invitationId: string;
  }): Promise<{ member: OrganizationMember }> {
    const inv = await this.orgs.findInvitationById(input.invitationId);
    if (!inv) {
      throw new NotFoundError("Invitación no encontrada");
    }
    if (inv.status !== "pending") {
      throw new ValidationError(
        `La invitación ya fue ${inv.status === "accepted" ? "aceptada" : "cancelada"}`,
      );
    }
    if (new Date(inv.expiresAt).getTime() < Date.now()) {
      throw new ValidationError("La invitación ha expirado");
    }

    const member = await this.orgs.acceptInvitation(
      input.invitationId,
      input.actor.sub,
    );
    return { member };
  }
}

export class ListOrganizationMembersUseCase {
  constructor(private readonly orgs: IOrganizationRepository) {}

  async execute(input: {
    actor: SessionPayload;
    organizationId: string;
  }): Promise<{ members: { member: OrganizationMember; user: User }[] }> {
    const org = await this.orgs.findById(input.organizationId);
    if (!org) {
      throw new NotFoundError("Organización no encontrada");
    }
    const list = await this.orgs.listMembers(input.organizationId);
    return { members: list };
  }
}
