# Griya — House Design & Renovation Planner

A browser-based planning workspace for exploring residential floor plans, comparing renovation alternatives, reviewing basic architectural constraints, visualizing a house in 3D, and preparing preliminary construction cost estimates.

This project began as a practical tool to help a family think through a home renovation before construction decisions are made. It combines interactive drawing tools with rule-based checks and planning references.

> **Important:** This application is a design-planning aid, not a substitute for an architect, structural engineer, licensed building professional, official permit review, or a site inspection. All dimensions, structural assumptions, regulatory interpretations, and cost estimates must be independently verified before construction.

## What it can do

- **Interactive 2D floor-plan editor** — create and adjust room layouts, edit polygon vertices, work with dimensions and alignment guides, and manage doors, windows, and furniture.
- **3D visualization** — inspect the proposed layout through a Three.js-based view.
- **Design alternatives** — compare different layout options and review their trade-offs.
- **Rule-based design checks** — evaluate selected geometric, circulation, architectural, ventilation, and planning constraints.
- **Technical diagrams** — review supporting architectural and building-detail visualizations.
- **Preliminary cost planning** — explore indicative material, labour, and construction-phase estimates.
- **Site analysis and reporting** — review site assumptions and prepare a printable design summary.
- **Local project persistence** — keep working designs in browser storage and export/import design data where supported by the application.

The exact checks and calculations are limited to the rules and assumptions implemented in the source code. A positive application result is not a structural safety certification.

## Technology

- React 19
- TypeScript
- Vite
- Three.js
- Tailwind CSS 4
- Lucide React
- Motion
- Bun (lockfile: `bun.lock`)
- Google GenAI SDK dependency (AI Studio integration)

## Getting started

### Requirements

- [Bun](https://bun.sh/) installed
- A modern browser with WebGL support for the 3D view

### Install dependencies

```bash
bun install
```

### Configure environment

Copy `.env.example` to `.env.local` only if your local runtime requires these variables, then replace placeholders with values supplied through a secure environment-variable manager.

```bash
cp .env.example .env.local
```

Never commit `.env.local`, real API keys, access tokens, or credentials. The example file contains placeholders only. Do not expose a Gemini API key through a client-side variable such as `VITE_GEMINI_API_KEY`: Vite-prefixed variables are bundled for browser access.

When running through Google AI Studio, follow its Secrets configuration for server-side credentials. Do not copy secrets into source files or public assets.

### Run locally

```bash
bun run dev
```

Vite is configured to listen on port `3000`. Open the local URL printed by Vite in your terminal.

### Type-check

```bash
bun run lint
```

### Production build

```bash
bun run build
bun run preview
```

The current package scripts do not define a dedicated test command. Test files are present under `src/utils/*.test.ts`; a repeatable test script and CI workflow should be added after confirming the preferred runner and runtime.

## Repository structure

```text
.
├── public/
│   └── assets/             # Images and static assets used by the app
├── src/
│   ├── components/         # Main application views and UI components
│   ├── utils/              # Geometry, design data, evaluation and cost logic
│   ├── App.tsx             # Application shell and top-level state
│   ├── index.css
│   └── main.tsx
├── docs/
│   ├── ARCHITECTURE.md     # High-level codebase guide
│   └── SECURITY.md         # Secret-handling and security notes
├── .env.example
├── .gitignore
├── metadata.json          # Google AI Studio app metadata
├── package.json
└── bun.lock
```

## Design data and privacy

Working designs are stored in the browser's `localStorage`. This is convenient for a single-browser workflow, but it is not a cloud backup or a secure multi-user database. Clearing browser data can remove locally stored work. Use the application's export/backup capability where available and store exported files somewhere private.

Sharing data through URLs can expose the encoded design to anyone who receives or can access that URL. Avoid putting addresses, names, contact details, or other sensitive information into shared design payloads.

See [docs/SECURITY.md](docs/SECURITY.md) for repository and runtime security guidance.

## Current limitations

- Design checks are rule-based and cover only the conditions implemented in the application.
- Structural calculations are not a replacement for engineering analysis, structural drawings, or professional sign-off.
- Cost figures are indicative and depend on the rates, location, date, scope, and assumptions encoded in the application.
- Browser storage is device/browser-specific unless the user exports or shares a design.
- A complete automated test and continuous-integration workflow has not yet been configured.

## Development notes

The application has a broad feature set. Some UI modules, especially the interactive floor-plan editor, are large and would benefit from incremental refactoring into smaller components and hooks. Refactoring should be accompanied by regression tests for geometry editing, snapping, undo/redo, import/export, doors/windows, and 2D/3D synchronization.

## Contributing

For changes that affect geometry, dimensions, design evaluation, or cost calculations:

1. Keep calculations deterministic and document assumptions.
2. Add or update tests for edge cases and regression scenarios.
3. Avoid presenting heuristic checks as certified engineering conclusions.
4. Run type-checking and a production build before submitting changes.
5. Never commit secrets, private house information, temporary AI artifacts, or generated build output.

## License

No repository-level license has been selected yet. Unless and until a license is added, the project should be treated as **all rights reserved**. The SPDX headers in source files do not by themselves replace a repository-level license or establish the licensing status of third-party assets.
