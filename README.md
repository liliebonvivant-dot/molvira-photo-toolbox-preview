# MOLVIRA PHOTO

Free online image tools — Easy · Free · Private. Images are processed locally in the browser.
13 tools: resize, crop & rotate, convert, compress, watermark, background removal, white background,
text/prices/logos, collage, Instagram, WhatsApp, product ad and e-commerce images. EN / PT / ES.

## Requirements
- [Bun](https://bun.sh) 1.x (or Node.js 20+ with npm)

## Install, run and build
```sh
bun install          # uses bun.lock for reproducible versions
bun run dev          # development server
bun run build        # production build
bunx vitest run      # automated tests
```

## Notes
- Background removal uses `@imgly/background-removal` (AGPL-3.0). Its model/runtime files are
  downloaded at use time from the IMG.LY asset host (`staticimgly.com`); images are not uploaded.
- HEIC/HEIF decoding uses `heic-to` (LGPL-3.0), loaded on demand in a separate worker.
- No credentials or secrets are required to build or run this project.

## License
GNU Affero General Public License v3.0 — see [LICENSE](LICENSE).
Third-party licenses: [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
Name and logo: [TRADEMARKS.md](TRADEMARKS.md). Release identification: [RELEASING.md](RELEASING.md).
