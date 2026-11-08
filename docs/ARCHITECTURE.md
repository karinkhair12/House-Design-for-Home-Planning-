# Architecture Overview

This document describes the current high-level structure. It is intentionally an overview rather than a promise that every feature is isolated into a dedicated module.

## Application flow

```text
Browser
  |
  v
src/main.tsx
  |
  v
src/App.tsx
  |-- top-level navigation and active view
  |-- working design state and saved alternatives
  |-- browser persistence / share-link hydration
  |
  +--> 2D floor-plan editor
  +--> 3D visualization (Three.js)
  +--> architectural rules and technical diagrams
  +--> design alternatives and comparison
  +--> site analysis
  +--> construction cost view
  +--> report / print interface
```

## Main code areas

### `src/components/`

Contains the primary application views and interactive UI. The main editor currently lives in `InteractiveFloorPlanEditor.tsx` and is a large module. It owns substantial editor interaction logic and is a candidate for incremental decomposition into smaller components and hooks.

Other major views include:

- `ThreeDView.tsx` — 3D scene and visualization.
- `CadFloorPlanViewer.tsx` — CAD-style floor-plan presentation.
- `ArchitecturalRulesView.tsx` — rule and standards-oriented review.
- `DesignAlternativesView.tsx` and `DesignComparisonView.tsx` — alternative layouts and comparison.
- `ConstructionCostView.tsx` — preliminary cost presentation.
- `SiteAnalysisView.tsx` — site assumptions and analysis.
- `TechnicalDiagramsView.tsx` — technical diagrams.
- `ReportPrintModal.tsx` — report and print workflow.

### `src/utils/`

Contains reusable domain logic and data:

- `architectureData.ts` — baseline room, site, and design data.
- `houseDesignStore.ts` — design-state types, presets, and related helpers.
- `geometryMath.ts` — polygon, point, and geometry calculations.
- `architecturalStandards.ts` — rule-based checks and regional profiles.
- `doorsAndStairs.ts` — door, opening, and staircase calculations.
- `designEvaluator.ts` — rule-based design evaluation and score breakdown.
- `costEstimator.ts` and `costSimulator.ts` — indicative cost and budget calculations.
- `usabilitySimulator.ts` — simplified usability and clearance checks.

Test files are also located in this directory.

## State and persistence

The top-level application currently hydrates working designs from URL share parameters and browser `localStorage`, then persists working designs and saved alternatives. This is browser-local persistence, not a hosted database or account-based synchronization service.

Treat imported or shared design data as untrusted input. Validate its shape, numeric ranges, identifiers, and collection sizes before using it in geometry or rendering code.

## External libraries

- React and TypeScript for the UI and application logic.
- Vite for development and production builds.
- Three.js for 3D rendering.
- Tailwind CSS for styling.
- Lucide React for icons.
- Motion for interface animation.
- Google GenAI SDK is included as a dependency; configure credentials through a secure server-side runtime.

## Suggested engineering direction

1. Extract persistence and share-link parsing from `App.tsx` into dedicated hooks/services.
2. Decompose the large floor-plan editor by responsibility without changing behavior in one large rewrite.
3. Introduce schema validation for imported/shared design payloads.
4. Expand regression tests around geometry editing, undo/redo, doors/windows, and 2D/3D consistency.
5. Add a test script and CI checks for type-checking, tests, and production builds.
6. Document the source and date of architectural assumptions and cost rates.
