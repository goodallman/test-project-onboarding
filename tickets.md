# Pre-requisites
- Node.js v20+
- pnpm installed [https://pnpm.io/installation] (we are using pnpm instead of classic npm for performance and compatibility)
- Git (Desktop or CLI) [https://desktop.github.com/download/]

# Project instalation
- Clone the repo (GitHub Desktop or `git clone <repo-url>` in terminal)
- cd into the project folder
- Run `pnpm install` to install dependencies
- Copy `example.env.local` to `.env` and adjust any environment variables as needed (e.g., `PAYLOAD_SECRET`, `SERVER_URL`)
- Run `pnpm run seed` to populate the database with sample data (this uses Sqlite for simplicity)
- Run `pnpm run dev` to start the development server
- Open http://localhost:3000/admin and log in

## Good to know
- The admin credentials are in the seed script, you have to navigate the script and find them.
- The project uses Sqlite for local development, so no external database setup is needed.
- PayloadCMS documentation: [https://payloadcms.com/docs]
- Nextjs 15 documentation: [https://nextjs.org/docs]
---

## Requirements
- Everything has to be done in TypeScript and has to be type-safe.
- Don't use any external services or databases, everything has to run locally.
- Everything has to be done inside of the PayloadCMS admin, no custom frontends (under the app directory).
- You have to solve all tickets below. Each ticket should have it's own
git branch, named after the ticket (e.g., TKT-001) or with descriptive name.
- In the end, each ticket should have it's README.md file with a brief
description of what was done and how did you test it.


# Tickets to solve


Below are realistic reports from our internal users. Each ticket includes steps to reproduce, expected vs. actual, and acceptance criteria. Assume a clean checkout, local Sqlite, and `.env` copied from `example.env.local`.


---


## TKT-001 — Draft posts are visible to the public
**Reporter**: Marketing


**Summary**: Unauthenticated visitors can retrieve draft posts from the API.


**Environment**: Dev, fresh seed (`pnpm run seed`), logged out


**Steps to Reproduce**
1) Start the server: `pnpm run dev`
2) In a new terminal, run:
```bash
curl 'http://localhost:3000/api/posts?limit=50'
```
3) Observe that some results include `"_status": "draft"`.


**Expected**: Logged-out users only receive posts with `_status = published`.
**Actual**: Draft posts appear in the REST listing.


**Acceptance Criteria**
- Unauthenticated `GET /api/posts` never returns drafts.
- Admin/editor behavior unchanged (they can read both draft and published).
- Add/adjust a testable filter and document where it lives (access rule).


---


## TKT-002 — Can’t schedule future publish date for drafts
**Reporter**: Editors


**Summary**: Editors drafting articles with a future `publishedAt` date are blocked by validation unless they immediately set status to "published".


**Environment**: Dev, logged in as `editor@example.com`


**Steps to Reproduce**
1) In Admin → Posts → Create New
2) Fill out required fields, set `_status = draft`.
3) Set `publishedAt` to a future date (e.g., +7 days) and save.


**Expected**: Drafts may have a future `publishedAt` (used for scheduling); only **published** posts should be rejected if the date is in the future.
**Actual**: Save fails with a validation message about future dates.


**Acceptance Criteria**
- Validation only rejects future dates when `_status === 'published'`.
- Drafts (and autosave) succeed with future dates.


---


## TKT-003 — Comments visibility rules are confusing to stakeholders
**Reporter**: Support


**Summary**: Public can see unapproved comments on some endpoints; other times editors cannot see pending comments.


**Environment**: Dev, mix of logged-out and editor sessions


**Steps to Reproduce**
1) Seed data, then as logged-out user query `GET /api/comments`.
2) Create a new comment via Admin (leave `approved = false`).
3) Re-fetch comments as public and as `editor@example.com`.


**Expected**:
- Public: only `approved: true` comments are listed.
- Editor/Admin: can see **all** comments.
- Users: can update **their own** comments; others cannot.
**Actual**: Behavior doesn’t consistently match expectations.


**Acceptance Criteria**
- Reconfirm and codify access rules so they match the above expectations.
- Add a brief note in README describing the final behavior.


---


## TKT-004 — Read-only Admin role for Users (field-limited visibility)
**Reporter**: Support


**Summary**: Stakeholders need a way to let certain end users access the Admin UI for browsing content, but with strictly read-only permissions across all collections and limited visibility of sensitive fields. Create a new role dedicated to this "users-only admin" experience.


**Environment**: Dev; Admin UI; REST/GraphQL APIs; logged in as a special read-only role user


**Steps to Reproduce**
1) Seed data and ensure a user exists with the new read-only admin role (e.g., `viewer@example.com` / `test123`), capable of logging into the Admin UI.
2) Log in to Admin as this user and:
	- Browse lists for Posts, Comments, Authors, Media, and Users.
	- Open a document view for each collection.
	- Confirm that form controls are read-only and Save/Delete actions are not available (or result in a permission error if forced via URL/API).
3) With the same user, call the APIs:
	- `GET /api/posts`, `GET /api/comments`, `GET /api/authors`, `GET /api/media`, `GET /api/users` should succeed (200) subject to field-level visibility.
	- Attempts to `POST`, `PATCH`, or `DELETE` on any of the above should be rejected (403/401 as appropriate).
4) Comments-specific checks:
	- Public (logged-out) `GET /api/comments` only returns `approved: true`.
	- Read-only admin user can see all comments in Admin (approved and unapproved) for moderation awareness, but still cannot modify them.
5) Field-level visibility checks (candidate’s choice, but must demonstrate):
	- At least three sensitive fields across any collections are hidden or read-only for the read-only role (examples: Users.email, Users.role, Posts._status, Posts.publishedAt, Comments.ipAddress, Media.filename, etc.).
	- Verify those fields are not editable in Admin and are omitted or masked from API responses for this role.


**Expected**:
- A new role (name up to candidate, e.g., `viewer` or `readonly`) that can log into Admin.
- This role has read-only access across all collections: Posts, Comments, Authors, Media, and Users.
- The Admin UI reflects read-only state: no create/edit/delete actions; detail views are non-editable.
- The API enforces the same rules: reads allowed; creates/updates/deletes denied.
- Field-level visibility limitations in place for the new role (at least 3 concrete fields chosen and documented by the candidate), affecting both Admin UI and API responses for that role.
- Comments behavior remains consistent with business rules: public sees only approved, privileged users (Editor/Admin/read-only admin) can see all; only Editor/Admin may change approval.


**Actual**: No dedicated read-only admin role exists; current roles either cannot access Admin or have editing capabilities. Field-level restrictions are not consistently enforced for a read-only persona.


**Acceptance Criteria**
- Introduce a new read-only Admin role limited to viewing data across all collections.
- Enforce read-only at the access-control level for both Admin UI and API (REST and GraphQL if enabled).
- Implement field-level visibility rules for this role and document exactly which fields are restricted (minimum 3 across any collections).
- Seed a sample user for this role (e.g., `viewer@example.com` with a default password) to ease verification.
- Ensure comments rules align with prior tickets: public sees only `approved: true`; read-only admin can see all but cannot modify.
- Add a brief note in `README.md` describing the new role, how to customize field visibility, and how to test it.


---
