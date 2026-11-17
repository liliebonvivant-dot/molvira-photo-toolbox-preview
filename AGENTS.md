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
- Keep unapproved tool workspaces presentation-only; resize, crop/rotate, conversion and compression are approved local processors; watermark is implemented for owner practical validation.
- Isolate compression UI and localization; reuse HEIF decoding, canvas encoding, device budgets and delivery, and optimize native PNG by removing only text/time metadata without changing pixel or orientation chunks so lossless claims remain truthful.
- Compression compares uploaded file bytes against encoded output regardless of format; within the estimated device budget try actual encoding without a canvas preflight, and offer explicit meaningful reduction after failure to avoid probe-induced one-pixel resizing.
- Isolate conversion UI and localization from header validation and Canvas encoding that preserves dimensions unless the user explicitly picks the offered proportional reduction (device pixel-budget + canvas probe decide); use an on-demand, owned HEIF worker with timeout and termination to avoid blocking the interface or retaining decoder memory.
- All approved processors share bounded Canvas Blob encoding and gesture-triggered delivery with truthful feedback and manual open/share alternatives; preserve resize/crop primary anchor downloads, while conversion prefers native file sharing on supported touch devices, because browsers cannot confirm a saved download.
- Isolate resize UI, localization and native Canvas logic; validate encoded headers before decoding and release object URLs and canvas memory after use.
- Resize and crop share large-image decoding (large-image.ts + reduce-prompt.tsx) built on the conversion pixel-budget/canvas probe; a reduced working copy is created only after explicit user choice, and export failures offer that reduction instead of failing silently.
- Use react-image-crop for touch/keyboard selection and numeric affine transforms with clipping polygons for crop history; render from the original once to avoid cumulative quality loss and bound history to 30 steps.
- Store only the language preference in browser storage; image data must not be persisted by this preview.
- Keep international metadata on content leaves and exclude development pages from indexing; resolve sitemap locations to the approved absolute domain before launch.

- Isolate watermark UI, source lifecycle, localization and native Canvas composition; reuse HEIF decoding, explicit reduction and untouched file delivery, with a bounded display canvas and original-resolution export.

- Isolate background removal in an owned, terminable worker using quantized ISNet/ONNX on CPU; request explicit working-copy reduction, preserve source alpha, fetch only model/runtime assets externally, and review AGPL obligations before launch.
- Refine background masks with bounded RGB-guided interpolation and straight-alpha multiplication; avoid erosion, component pruning or recoloring to preserve fine strands, separate subjects and partial transparency without introducing matte halos.
- Keep BiRefNet source detached from the route import graph and deny its route at the server entry and router until private access is explicitly approved; noindex and sitemap/catalog exclusion are supplementary, not authorization, and existing public asset URLs are not private storage. This prevents public execution and experimental runtime bundling without touching the six processors.
- Isolate White Background processing and localization; inspect PNG/WebP alpha headers, composite straight-alpha pixels in bounded strips at native dimensions, and reuse bounded encoding and gesture-triggered delivery. This preserves the existing processors and avoids segmentation dependencies or automatic resizing.
- Isolate the text/price/logo editor with source-pixel Canvas composition shared by preview and export, bounded layer/history/unique-logo budgets, and history-aware resource ownership; encode only on request to avoid repeated full-resolution work while editing and never import segmentation libraries.

- Isolate collage UI/localization and output-coordinate Canvas composition; bound unique photo memory including undo assets, load sequentially with explicit source/output reduction, and reuse bounded encoding and gesture delivery to preserve existing processors.

- Isolate Instagram UI/localization and output-coordinate rotation/framing composition shared by preview/export; reuse validated source decoding, explicit memory reductions and gesture delivery without segmentation imports to preserve existing tools.

- WhatsApp uses the configurable Instagram editor and output renderer with isolated presets/copy; overlay the circular profile guide outside Canvas so shared controls stay consistent and exports never contain it.

- Isolate Product Ad UI/copy and output-coordinate Canvas composition; reuse local validation, explicit source reductions and delivery, retain photo/logo assets only while bounded history references them, and render native preset pixels in preview for PNG fidelity without touching prior editors.
- Isolate E-commerce UI/copy and margin-clipped output composition; reuse social placement, source budgets, bounded encoding and delivery without changing existing editors, and bound previews to 4 MP so exact preset pixels remain inspectable without unbounded custom allocations.
- Dispatch catalog tools through a typed workspace registry now that every tool has a local processor; this removes unreachable presentation-only fallbacks without changing individual editors.
