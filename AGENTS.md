<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Application architecture
- Use a shared localized catalog and validated language/slug routes for all tool and institutional pages so language switching preserves page identity.
- Keep unapproved tool workspaces presentation-only; resize and crop/rotate are the only approved local processors.
- Isolate resize UI, localization and native Canvas logic; validate encoded headers before decoding and release object URLs and canvas memory after use.
- Use react-image-crop for touch/keyboard selection and numeric affine transforms with clipping polygons for crop history; render from the original once to avoid cumulative quality loss and bound history to 30 steps.
- Store only the language preference in browser storage; image data must not be persisted by this preview.
- Keep international metadata on content leaves and exclude development pages from indexing; resolve sitemap locations to the approved absolute domain before launch.
