# Application Architecture

## Overview

Griya is a browser-based home layout and renovation planning application. Its current feature areas include:

- Interactive 2D floor-plan editing.
- Real-time 3D / dollhouse visualization.
- Architectural rules and preliminary design checks.
- Design alternatives and comparison.
- Construction cost estimation and phased renovation planning.
- Technical diagrams, site analysis, and printable reports.

## Technology

The repository currently uses React, TypeScript, Vite, Three.js, Tailwind CSS, Lucide React, Motion, and the Google GenAI SDK. Bun is used for dependency management.

## Source layout

- `src/App.tsx`: application composition, navigation, and top-level state.
- `src/components/`: feature views and interactive UI components.
- `src/utils/`: geometry, architecture data, rules, cost estimation, persistence, and evaluation logic.
- `public/`: static assets that are intentionally approved for public distribution.
- `docs/`: project architecture and security documentation.

## Engineering principles

1. Keep geometry and business calculations in testable utility modules, separate from presentation components.
2. Keep a single source of truth for room dimensions, floor areas, and cost quantities.
3. Derive 2D and 3D views from the same validated design model.
4. Make editor tools contextual and preserve keyboard, mouse, and touch accessibility.
5. Treat imported and shared design data as untrusted input.
6. Label estimates and rule-based checks as preliminary unless independently validated.
7. Preserve existing behavior when refactoring; add regression tests for geometry, calculations, and state persistence.

## Known engineering risks to validate

- The interactive floor-plan editor is a large component and may benefit from incremental decomposition.
- Area totals, extension areas, BOQ quantities, phase totals, and contingency must be calculated from a shared model.
- 3D camera framing and helper geometry should respond predictably to design changes.
- Mobile editing needs touch-first controls rather than a scaled-down desktop toolbar.
- Structural safety cannot be certified by a UI score or simplified rule engine. Professional engineering review is required.

## Validation

Run the available scripts from `package.json`:

- `bun run lint`
- `bun run build`

Automated tests should also be executed using the project's configured test runner. Do not claim test coverage or successful validation unless the commands have actually been run.
