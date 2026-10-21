# People & Co.

A responsive HR web app built with React, TypeScript, and Vite.

- **People:** searchable employee directory, department and status filters, sorting,
  pagination, list/card views, and CSV export of the filtered results.
- **Profiles:** add, edit, and remove employees; validate required fields and
  prevent duplicate email addresses. Removal includes confirmation and removes
  associated leave requests.
- **Overview:** department headcounts, recent starters, and pending requests.
- **Time off:** submit requests, validate date ranges, and approve or decline
  requests. Employee statuses are managed separately in their profiles.

## Development

Use Node.js 24 (the tested version is pinned in `.node-version`) and npm.

```sh
cd /workspace/hrPlatformTest
npm ci
npm run dev -- --port 5173 --strictPort
```

The development server listens on port 5173. Use the existing checkout: each cloud
task already has an isolated environment, so an additional Git worktree is
unnecessary unless explicitly requested.

In the managed cloud environment, npm's default home cache is not writable. Use
this installation command instead:

```sh
npm_config_cache=/workspace/.cache/npm npm ci
```

## Validation

```sh
npm run build  # TypeScript check and production bundle in dist/
npm test       # Build, then desktop and mobile browser integration tests
```

Tests use `/usr/bin/chromium` when available. Set `CHROMIUM_PATH` to use another
Chromium executable. On machines without a system browser, install Playwright's
Chromium with `npx playwright install chromium` first. Linux may also require
`npx playwright install-deps chromium` with system package installation privileges.

The suite serves the production bundle on port 4173 and exercises directory
filters, pagination, profile changes and persistence, duplicate email validation,
removal, leave decisions, CSV downloads, dialog keyboard behavior, mobile layout,
and recovery from invalid stored data. It does not reuse another server on 4173.

```sh
npm run preview -- --port 4173 --strictPort
```

Use the preview command above to serve an existing production build manually.

## Data and scope

This is a frontend starter with fictional sample employees, not a production HR
system. Data is stored in this browser's `localStorage` under `people-and-co.v1`
after a change. Reloading preserves changes; a separate browser has separate data.
Clearing that key restores the sample workspace. Storage failures show a warning.

There is no backend, authentication, authorization, shared database, or email
delivery yet. The displayed admin identity is a placeholder. Use sample data
while those capabilities are being developed. No credentials or external
services are required to run the current app.

Keep credentials out of Git. Use environment settings for secrets and commit only
example configuration containing non-secret placeholders.

## Source map

- `src/App.tsx`: views, employee forms, profile dialogs, and leave workflow.
- `src/data.ts`: typed data, sample workspace, and persisted-data validation.
- `src/styles.css`: responsive styles with reduced-motion support.
- `tests/app.spec.ts`: browser integration tests.
