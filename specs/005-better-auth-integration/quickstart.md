# Quickstart Validation Guide: Better Auth & Multi-Tenant Organization Integration

**Feature**: `005-better-auth-integration`
**Date**: 2026-11-11

This guide provides testable end-to-end validation steps for Better Auth authentication and multi-tenant organization song isolation.

---

## 1. Automated Integration Test Execution

Run the automated integration test suite for Better Auth and organizations:
```bash
bun test tests/integration/auth-organization.test.ts
```

Expected output:
- 100% tests passing.
- Validated scenarios:
  1. User signup and login via credentials on Cloudflare D1.
  2. Organization creation and owner membership assignment.
  3. Setting active organization in user session.
  4. Scoped song query: Org A songs are completely invisible to Org B.
  5. Cross-tenant mutation rejection (attempting to update Org A's song from Org B returns 404/403).

---

## 2. Interactive UI Validation: Multi-Tenant Switching

1. Start development server:
   ```bash
   bun run dev
   ```
2. Navigate to `http://localhost:5173/login`.
3. Sign in with seeded admin:
   - Email: `admin@worshipflow.local`
   - Password: `admin-password-123`
4. In the top navbar, observe the new **Organization Switcher**:
   - Default active: `"WorshipFlow Central"`
   - Catalog displays seeded songs for WorshipFlow Central.
5. Click the Organization Switcher and select **"+ Nueva Organización"**:
   - Name: `Ministerio Juvenil`
   - Slug: `ministerio-juvenil`
   - Submit creation.
6. The active organization immediately switches to `Ministerio Juvenil`:
   - The catalog (`/`) now reflects an empty repertory for the new ministry.
7. Click **"Nueva Canción"** and create a song:
   - Title: `Rey de Reyes`
   - Artist: `Hillsong`
   - Save song.
8. Switch back to `"WorshipFlow Central"` via the Organization Switcher:
   - The catalog reloads and displays the original songs. `Rey de Reyes` is NOT present here.
9. Switch back to `"Ministerio Juvenil"`:
   - `Rey de Reyes` is present. Tenant isolation is verified end-to-end.

---

## 3. Architecture & Quality Gates

Verify zero architectural boundary violations:
```bash
bun run check:arch
bun run check
bun test
bun run build
```
All four commands must exit with code 0.
