# Stride dashboard

Performance overview for Stride Admin, built from the v2 Figma design with Next.js 16, Base UI, Hugeicons (1.25 stroke) and Postgres.

## Stack

- **Next.js 16** (App Router, Server Components, Server Actions)
- **Base UI** for menus, popovers, dialogs, tooltips and toggle groups
- **Drizzle ORM** on **Neon Postgres** (Vercel Marketplace)
- **Tailwind CSS 4** with tokens copied from the Figma frame

## Getting started

```bash
npm install
```

### With the Neon database

1. Connect the Neon integration to the Vercel project, then pull its env vars:
   ```bash
   npx vercel env pull .env.local
   ```
2. Create the tables and load demo data:
   ```bash
   npm run db:push
   npm run db:seed
   ```
3. Start the app:
   ```bash
   npm run dev
   ```

### Without a cloud database

PGlite runs Postgres in-process for local development:

```bash
PGLITE_DIR=.pglite npx drizzle-kit push --force
PGLITE_DIR=.pglite node --import tsx scripts/seed.ts
npm run dev:local   # http://localhost:3100
```

## Project layout

| Path | What lives there |
| --- | --- |
| `app/page.tsx` | Performance overview (reads URL state, fetches data on the server) |
| `app/actions.ts` | Server Actions: pin legs, mark notifications read, messages, invites, settings |
| `app/api/legs/[id]` | Team detail JSON for the modal |
| `app/api/export` | CSV export for a leg and date range |
| `components/ui` | Design-system components mirroring the Figma component set |
| `components/dashboard` | Dashboard sections: header menus, date picker, KPIs, chart, table, modal |
| `components/shell` | Sidebar, workspace switcher, top bar, notifications, dialogs |
| `lib/queries.ts` | All SQL for the dashboard |
| `lib/db/schema.ts` | Drizzle schema |
| `scripts/seed.ts` | Deterministic demo data (3 workspaces, Jan 2025 → Sep 2026) |

## Notes

- There is no sign-in yet. Server Actions validate input but anyone with the URL can change demo data.
- Dashboard filters live in the URL (`range`, `cmp`, `pct`, `tab`, `chart`, `sort`, `dir`, `ws`, `team`), so every view is shareable.
