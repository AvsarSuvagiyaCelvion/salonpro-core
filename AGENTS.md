<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Working rules

- **CRITICAL TAILWIND V4 & BUILD RULE**: NEVER alter `"build": "next build"` in `package.json` to `--webpack`. Tailwind CSS v4 in this repository is strictly bound to Turbopack (`@tailwindcss/turbopack`). Adding `--webpack` strips all Tailwind CSS classes during production build and produces raw unstyled HTML in live deployments (Vercel).
- Before any task, read `docs/SHARED_CORE.md` and the relevant panel MD (`docs/CUSTOMER_PANEL.md`, `docs/OWNER_PANEL.md`, or `docs/ADMIN_PANEL.md`); use them to locate files instead of exploring the whole repo.
- After finishing any task, update the affected MD (routes, tables, flows, new migration number) in the same change.
- New migrations: check the latest number in `docs/SHARED_CORE.md` first.
- Never trust `salon_id` or `customer_id` from the request body; follow the auth rules in `docs/SHARED_CORE.md`.
