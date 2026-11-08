# Security Notes

This project is a browser-based home-planning application. Repository hygiene and runtime security both matter, especially because design files may contain private information about a real home.

## Secrets and environment variables

- Never commit real `.env` files, API keys, passwords, OAuth tokens, private keys, or service credentials.
- Keep `.env.example` limited to variable names and clearly fake placeholders.
- Do not place secrets in `public/`, frontend source code, screenshots, URLs, or client-side storage.
- Vite variables prefixed with `VITE_` are exposed to client-side code. Never use that prefix for secrets.
- Configure Gemini credentials through Google AI Studio Secrets or another server-side secret manager, not in browser code.
- If a credential is ever committed or exposed, revoke/rotate it immediately. Removing it in a later commit does not erase it from Git history.

## Private home and design data

Floor plans, room dimensions, site layouts, photos, addresses, and renovation notes may reveal sensitive information.

- Do not commit a real household's address, names, contact information, access details, or private photographs unless the owner has explicitly approved publication.
- Review images and exported design files before adding them to the repository.
- Browser `localStorage` is not encrypted secret storage. Do not store API keys or credentials there.
- Treat share URLs as potentially public. Do not include personal or sensitive data in shared payloads.

## Imported data and rendering

- Treat JSON files and URL share payloads as untrusted input.
- Validate types, dimensions, coordinate ranges, object counts, and identifiers before using imported data.
- Avoid rendering untrusted strings as raw HTML.
- Apply resource limits to large imported plans to reduce the risk of browser hangs or excessive memory use.

## Repository hygiene

The repository ignores common environment files, build output, logs, local databases, private key files, and Google AI Studio temporary planning artifacts. Ignore rules do not remove files that were already tracked; tracked files must be removed from the Git index/history separately.

Before publishing:
1. Review the complete file tree.
2. Search source and commit history for credentials and personal data.
3. Review all images and exported design files.
4. Confirm that third-party assets may be redistributed.
5. Rotate any secret that may previously have been exposed.

## Scope

These notes are practical safeguards, not a formal security audit or guarantee. The application has not undergone penetration testing or a complete dependency vulnerability review.
