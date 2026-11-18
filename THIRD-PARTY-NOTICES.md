# Third-party notices

MOLVIRA PHOTO as a whole is distributed under AGPL-3.0 (see LICENSE). It includes or loads the
components below, each under its own license. Full license texts ship in each package under
`node_modules/<package>/` after `bun install`, and at the listed sources.

## Copyleft components
| Component | Version | License | Use | Source |
|---|---|---|---|---|
| @imgly/background-removal | 1.7.0 | AGPL-3.0 | Background removal (browser) | https://github.com/imgly/background-removal-js |
| @imgly/background-removal-data (model/runtime assets, fetched at runtime) | matches 1.7.0 | Declared by IMG.LY; see "ISNET model" | Segmentation model files | https://staticimgly.com/@imgly/background-removal-data/ |
| heic-to (bundles libheif / libde265 builds) | 1.6.7 | LGPL-3.0 | HEIC/HEIF decoding, on-demand worker | https://github.com/hoppergee/heic-to |

LGPL-3.0 note: heic-to is loaded as a separate, replaceable module; its source is available at the
link above and this whole project's source is public, so users can modify or replace it.

## ISNET model
IMG.LY's `ThirdPartyLicenses.json` declares the ISNET model as MIT, source https://github.com/xuebinqin/DIS.
The DIS repository's license covers code; no explicit license file for the pretrained weights was found,
and the DIS5K training dataset carries non-commercial terms. Status: **unresolved — pending legal review**.

## Permissive runtime components (non-exhaustive, major)
- onnxruntime-web 1.21.0-dev — MIT, © Microsoft Corporation
- lodash-es, ndarray, zod — MIT (bundled by @imgly/background-removal)
- react, react-dom — MIT, © Meta Platforms, Inc.
- @tanstack/react-router, @tanstack/react-start, @tanstack/react-query — MIT, © Tanner Linsley
- @radix-ui/* — MIT, © WorkOS
- react-image-crop — ISC; lucide-react — ISC; sonner, clsx, tailwind-merge, cmdk, vaul — MIT
- tailwindcss — MIT

## Build-only tools (not shipped to visitors)
- lightningcss — MPL-2.0; caniuse-lite — CC-BY-4.0 (Browserslist data, © Alexis Deveria / caniuse.com)

The complete dependency list with versions is in `package.json` and `bun.lock`.
