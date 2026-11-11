# Contracts: Better Auth & Multi-Tenant Organization Interface

**Feature**: `005-better-auth-integration`
**Date**: 2026-11-11
**Module**: `src/infrastructure/auth/better-auth.ts` & `src/app/api/auth/[...all]/route.ts`

## 1. Better Auth HTTP API Endpoints (`/api/auth/*`)

All requests under `/api/auth/*` are handled by `auth.handler(req)`.

### Authentication Endpoints
- `POST /api/auth/sign-in/email`
  - Body: `{ email: string, password: string }`
  - Response: `{ user: User, session: Session }` + Sets `better-auth.session_token` cookie
- `POST /api/auth/sign-up/email`
  - Body: `{ name: string, email: string, password: string }`
  - Response: `{ user: User, session: Session }`
- `POST /api/auth/sign-out`
  - Body: `{}`
  - Response: `{ success: true }` + Clears session cookie
- `GET /api/auth/get-session`
  - Headers: Cookie
  - Response: `{ user: User, session: Session & { activeOrganizationId?: string } } | null`

### Organization Multi-Tenancy Endpoints
- `POST /api/auth/organization/create`
  - Body: `{ name: string, slug: string, logo?: string }`
  - Response: `Organization` (assigns current user as `owner`)
- `POST /api/auth/organization/set-active`
  - Body: `{ organizationId: string }`
  - Response: `Session` (updates active organization in session cookie and database)
- `GET /api/auth/organization/list`
  - Response: `Array<Organization & { role: "owner" | "admin" | "member" }>`
- `POST /api/auth/organization/invite-member`
  - Body: `{ email: string, role: "admin" | "member", organizationId: string }`
  - Response: `Invitation`
- `POST /api/auth/organization/accept-invitation`
  - Body: `{ invitationId: string }`
  - Response: `Member`

---

## 2. Application Layer Ports & Session Contract (`src/core/application/ports.ts`)

```typescript
export interface SessionPayload {
  readonly sub: string;                  // User ID
  readonly username: string;             // User name / identifier
  readonly email: string;
  readonly role: "ADMIN" | "MEMBER";     // Global system role
  readonly activeOrganizationId: string | null;
  readonly organizationRole: "owner" | "admin" | "member" | null;
}

export interface SongFilter {
  readonly organizationId?: string;      // Strict multi-tenant scope
  readonly query?: string;
  readonly labelIds?: readonly string[];
  readonly practiceKey?: string;
  readonly memberId?: string;
  readonly roleType?: string;
}
```

---

## 3. UI Organization Switcher Contract (`src/presentation/components/layout/organization-switcher.tsx`)

```typescript
export interface OrganizationSwitcherProps {
  readonly currentOrganizationId: string | null;
  readonly organizations: readonly {
    id: string;
    name: string;
    slug: string;
    role: string;
  }[];
  readonly onSelectOrganization: (organizationId: string) => Promise<void>;
  readonly onCreateOrganization: () => void;
}
```
