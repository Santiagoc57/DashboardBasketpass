# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, adapted to the current workflow of this repository.

## [Unreleased]

### Changed

- Redesigned the dashboard shell to a light editorial system with Manrope typography, refined header/sidebar navigation, quick-create drawer, and a consistent surface/token palette across grid, login, people, roles, match detail, group actions, and history panels.
- Reworked the login page into a two-column editorial access screen and added a production sheet documenting typography, colors, surfaces, and component rules.
- Added a structured basketball club catalog and wired suggestions for competition, local team, and away team in match creation and editing flows.
- Rebuilt the match detail view around a hero summary, operational two-column layout, conflict-aware assignment cards, camera/transmission sections, and a cleaner activity timeline inspired by the new product direction.
- Reworked the grid match cards into wide work-order summaries with production metadata, role-grouped assignment blocks, and direct edit access aligned with the new operational visual language.
- Renamed the product shell to `Basket Production`, constrained production modes to `Encoder`, `Offtube Remoto`, and `Cancha`, and redesigned the quick-create rail into a denser light card aligned with the new basketball operations brand.
- Reframed `/people` as `Personal`, added a richer staffing table with real assignment-derived status and role context, and rebuilt the CRUD screen around a cleaner quick-create plus focused edit workflow.
- Added a server-side team logo resolver that matches club names against the files in `public/Logos`, including tolerant aliases for uneven filenames, and wired it into the grid cards and match detail hero.

### Fixed

- Fixed the audit trigger function so `roles` and `people` inserts no longer fail by incorrectly referencing `match_id` on unrelated tables.

### Added

- Added a contributor workflow with `CONTRIBUTING.md`, `.editorconfig`, CI, and PR checklist to enforce a more production-ready development process.
- Added explicit quality scripts: `npm run typecheck` and `npm run check`.

## [0.1.0] - 2026-03-05

### Added

- Created the initial Next.js 16 dashboard scaffold with Tailwind CSS 4 and App Router.
- Integrated Supabase SSR foundations for auth, server-side sessions, and protected dashboard navigation.
- Added the operational screens: `/login`, `/grid`, `/match/[id]`, `/people`, `/roles`, and `/api/health`.
- Implemented CRUD flows with Server Actions for matches, assignments, people, and roles.
- Added SQL migration and seed files for `profiles`, `matches`, `people`, `roles`, `assignments`, and `audit_log`.
- Implemented row-level security policies for `admin`, `editor`, and `viewer`.
- Added audit triggers and automatic row metadata management in Postgres.
- Implemented Google Calendar link generation, WhatsApp roster utilities, and assignment overlap warnings.
- Added a CSV importer for loading matches and role assignments from spreadsheet exports.
