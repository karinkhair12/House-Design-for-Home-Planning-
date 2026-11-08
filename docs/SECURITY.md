# Security and Privacy

## Public repository policy

This repository is public. Treat every committed file, image, configuration value, issue, and commit as publicly accessible.

Never commit:
- API keys, access tokens, passwords, private keys, cookies, session exports, or production credentials.
- `.env`, `.env.local`, or environment-specific secret files.
- Personal home plans, exact addresses, floor-plan exports, family details, private screenshots, or user-generated design files unless the owner has explicitly approved publication.
- Google AI Studio temporary media, planning artifacts, or generated workspace metadata that is not required to build or run the app.

## Environment variables

- Keep real secrets in the hosting provider's secret manager or local untracked environment files.
- Use `.env.example` only for variable names and obvious placeholder values.
- Never expose a secret through a `VITE_*` variable. Vite-prefixed variables are bundled into client-side code and are public to users.
- If a credential was ever committed or exposed, revoke/rotate it immediately. Removing the file in a later commit does not make the old credential safe.

## User design data

Floor plans can reveal sensitive information about a home and its occupants. Treat designs, room labels, dimensions, furniture placement, photos, addresses, and shared design URLs as private user data.

- Do not commit real user projects or sample plans copied from private homes.
- Explain clearly when designs are stored in browser storage or embedded in shareable URLs.
- Validate imported or shared design payloads before using them.
- Avoid logging user-provided design content or personal details.
- Provide users with a way to clear locally stored project data.

## AI integrations

- Keep Gemini credentials server-side.
- Do not place API keys in browser code, HTML, source maps, client bundles, or public runtime configuration.
- Validate and constrain user input before sending it to AI services.
- Do not send private floor plans or personal information to external AI services without clear user awareness and consent.

## Before publishing

1. Review the complete file tree, including hidden files.
2. Scan the working tree and Git history for secrets.
3. Review images, PDFs, screenshots, sample data, and exported files manually.
4. Confirm that every public asset is owned, licensed, or explicitly cleared for redistribution.
5. Run secret scanning and dependency/security checks.
6. If a secret was exposed, rotate it; if sensitive data was committed, assess whether history rewriting and cache removal are needed.

## Scope and disclaimer

This document describes repository hygiene expectations. It is not proof that the repository or application has passed a complete security audit.
