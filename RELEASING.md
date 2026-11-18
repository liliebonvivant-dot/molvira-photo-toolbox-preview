# Release identification

Each deployment of the public site must correspond to a public, tagged source version.

1. Before deploying, confirm the working tree is clean and tests pass (`bunx vitest run`).
2. Tag the exact commit: `photo-vYYYY.MM.DD[-N]` (e.g. `photo-v2026.11.18`).
3. Push the tag to the public repository, then deploy that same commit.
4. Set `sourceCodeUrl` in `src/lib/photo/source-code.ts` to the public repository address
   (https only). The footer, About and Privacy pages show the link only when it is set.
5. Keep internal reports, `.lovable/`, experiments and editor metadata out of the public snapshot.
