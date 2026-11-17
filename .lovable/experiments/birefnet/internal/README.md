# Internal-only reproduction

No application endpoint serves these files. Do not add route imports or move them into public/.

The runner requires existing Bun, Python Playwright/Chromium and `ort-birefnet@1.31.1`. It launches and shuts down a temporary loopback server. It uses a synthetic fixture only; it is not the owner-photo comparison.

Prepare `/tmp/birefnet-internal/model.onnx` from the existing 512 export pointer once, verifying SHA256 `dff37bed4e94479a6a8f6b0e64d69030557bdcb79d53c9993b277f5c0cee4c93`; reuse it rather than downloading repeatedly. The runner verifies integrity again in the worker.

From project root, prepare the browser-safe shared routines and temporary document without building the application:

```sh
mkdir -p /tmp/birefnet-internal /tmp/browser/birefnet-internal
bun -e "import { readFileSync,writeFileSync } from 'node:fs';const t=new Bun.Transpiler({loader:'ts',target:'browser'});for(const [i,o] of [['src/lib/photo/birefnet-math.ts','math.mjs'],['src/lib/photo/background-matte.ts','matte.mjs']])writeFileSync('/tmp/birefnet-internal/'+o,t.transformSync(readFileSync(i,'utf8')));"
printf '<!doctype html><title>Internal BiRefNet verification</title><p>Internal synthetic fixture</p>' > /tmp/birefnet-internal/internal.html
python3 .lovable/experiments/birefnet/internal/run_internal.py
```

Outputs remain in `/tmp/browser/birefnet-internal`; JSON copies in this directory are recorded results, not regenerated app assets. Reported RSS sums all Chromium renderer processes and is not model-exclusive. The runner is environment-specific (`/dev-server`, dev port 8080, loopback port 8765). No quantization dependencies are installed by it.