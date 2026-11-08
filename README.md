<div align="center">

# Griya
### House Design & Renovation Planner

**Plan the layout. Explore the space. Compare renovation ideas.**

[Open the live application](https://house-plan-v-3.ai.studio/)

A browser-based workspace for residential floor-plan design, 3D visualization, rule-based design reviews, and preliminary renovation cost planning.

[![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)](https://vite.dev/)
[![Three.js](https://img.shields.io/badge/3D-Three.js-black?logo=threedotjs&logoColor=white)](https://threejs.org/)

</div>

---

> **Project status:** Active development / portfolio project. The live application is available through Google AI Studio. The public repository intentionally excludes private project plans, temporary AI Studio artifacts, and unverified personal image assets.

## At a glance

Griya is a home-planning application built to help explore residential layouts and renovation possibilities in one place. It brings together a 2D floor-plan editor, a 3D view, design-checking utilities, and early-stage cost-planning tools.

The project grew from a practical home-renovation planning need: make it easier to test layout ideas, understand spatial trade-offs, and organize design discussions before making real-world construction decisions.

## Explore the features

| Workspace | What it helps with |
|---|---|
| **2D Floor Plan Editor** | Create and edit room layouts, adjust polygon vertices, work with dimensions and alignment guides, and place doors, windows, and furniture. |
| **3D Visualization** | Explore the designed layout in a Three.js-powered 3D view. |
| **Design Alternatives** | Keep and compare different layout options and understand their trade-offs. |
| **Rule-based Design Review** | Check selected geometric, circulation, architectural, ventilation, and planning constraints implemented in the application. |
| **Technical Diagrams** | Review supporting architectural and building-detail visualizations. |
| **Preliminary Cost Planning** | Explore indicative material, labour, and construction-phase cost estimates. |
| **Site Analysis & Reports** | Organize site assumptions and prepare a printable design summary. |
| **Design Persistence & Sharing** | Continue working with browser-stored designs and use import/export or share workflows where supported. |

## Screenshots

Screenshots of the current application interface will be added here after a final visual review. This keeps the project page focused on genuine application captures rather than illustrative images that may not represent the current UI.

<!-- Suggested captures:
1. Main application dashboard
2. 2D floor-plan editor with room dimensions and editing tools
3. 3D visualization
4. Design comparison or preliminary cost-planning view
-->

## Technology

- **Frontend:** React 19, TypeScript
- **Build tooling:** Vite
- **3D:** Three.js
- **Styling:** Tailwind CSS 4
- **Icons:** Lucide React
- **Motion:** Motion
- **Package manager:** Bun
- **AI integration dependency:** Google GenAI SDK

## Run locally

### Requirements

- [Bun](https://bun.sh/) installed
- A modern browser
- WebGL support for the 3D workspace

### 1. Clone the repository

```bash
git clone https://github.com/karinkhair12/House-Design-for-Home-Planning-.git
cd House-Design-for-Home-Planning-
```

### 2. Install dependencies

```bash
bun install
```

### 3. Configure environment variables

If your local runtime requires environment variables, copy the example file:

```bash
cp .env.example .env.local
```

Replace placeholders with values provided through a secure environment-variable manager. Never commit `.env.local`, API keys, access tokens, or credentials.

**Security note:** Variables prefixed with `VITE_` are exposed to browser code. Never put a private Gemini API key or another secret in a Vite client-side variable. Configure credentials through Google AI Studio Secrets or a suitable server-side secret manager.

### 4. Start the development server

```bash
bun run dev
```

Vite is configured to use port `3000`. Open the local URL printed in the terminal.

### 5. Check and build

```bash
bun run lint
bun run build
bun run preview
```

The current package scripts provide TypeScript checking through `lint` and a Vite production build. Test files exist in `src/utils/`, but a dedicated test script is not currently defined in `package.json`.

## Project structure

```text
.
├── public/
│   └── assets/              # Static assets used by the application
├── src/
│   ├── components/          # Application views and UI components
│   ├── utils/               # Geometry, design data, evaluation and cost logic
│   ├── App.tsx              # Application shell and top-level state
│   ├── index.css
│   └── main.tsx
├── docs/
│   ├── ARCHITECTURE.md      # High-level codebase guide
│   └── SECURITY.md          # Secret-handling and privacy notes
├── .env.example
├── .gitignore
├── metadata.json           # Google AI Studio app metadata
├── package.json
└── bun.lock
```

## Important limitations

Griya is a **design-planning aid**, not a professional engineering or regulatory approval tool.

- Design checks are rule-based and limited to the conditions implemented in the code.
- A positive score or passed check does **not** certify structural safety or building-code compliance.
- Structural decisions, load paths, foundations, reinforcement, and construction details must be reviewed by qualified professionals.
- Cost estimates are indicative. Actual costs depend on location, date, quantities, specifications, labour rates, and project scope.
- Site assumptions and dimensions must be checked against the actual property.
- The application has not been presented as a substitute for a site survey, architect, structural engineer, licensed building professional, or official permit review.

## Privacy and security

House plans, room dimensions, site layouts, and renovation photographs can reveal sensitive information about a household.

- Do not publish private addresses, contact details, access information, or identifiable household data.
- Browser `localStorage` is browser-specific and is not encrypted secret storage or a cloud backup.
- Treat shared URLs and exported design files as potentially accessible to anyone who receives them.
- Treat imported JSON and URL payloads as untrusted input.
- Never commit credentials or real environment files.

See [Security Notes](docs/SECURITY.md) for more details.

## Developer documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [Security Notes](docs/SECURITY.md)

## Roadmap

Potential engineering improvements as the project evolves:

- [ ] Add reviewed screenshots and a public demo link.
- [ ] Break the large floor-plan editor into smaller components and hooks.
- [ ] Add schema validation for imported and shared design data.
- [ ] Expand regression tests for geometry editing, snapping, undo/redo, doors/windows, and 2D/3D synchronization.
- [ ] Add a repeatable automated test command and CI checks.
- [ ] Document the source, location, and date of architectural assumptions and cost rates.

## License

No repository-level license has been selected. Until a license is added, the project should be treated as **all rights reserved**. Source-file SPDX comments do not by themselves replace a repository-level license or establish redistribution rights for third-party assets.
