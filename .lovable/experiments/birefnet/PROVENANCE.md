# BiRefNet-lite experimental export

Not approved for replacement or publication. Route `/experimental/birefnet` is unlisted and noindex, not an access-control boundary. No photographs are hosted or uploaded.

## Files and licenses
- Official source and weights: https://huggingface.co/ZhengPeng7/BiRefNet_lite/tree/aa62cd87eafb9cc43056d08ef3615a14628b831d — MIT. Author explicitly covers code and weights: https://github.com/ZhengPeng7/BiRefNet/issues/316 and https://huggingface.co/ZhengPeng7/BiRefNet/discussions/23 . Dataset/backbone rights remain a separate review.
- Working ONNX: own export, FP32, fixed 512×512 input, opset22 native DeformConv; strict official checkpoint load, no retraining. SHA256 `dff37bed4e94479a6a8f6b0e64d69030557bdcb79d53c9993b277f5c0cee4c93`, 180638623 bytes.
- Failed baseline ONNX: https://huggingface.co/onnx-community/BiRefNet_lite-ONNX/tree/de15b22ba131738a16dff04aab8bdf8dc32e3ac1 — MIT declaration. SHA256 `5600024376f572a557870a5eb0afb1e5961636bef4e1e22132025467d0f03333`, 224005088 bytes. Never loaded by final prototype; retain pointer as experimental provenance only.
- Runtime alias `ort-birefnet` is `onnxruntime-web@1.31.1` (MIT), WASM-only, one thread, dedicated terminable worker; existing runtime/package unchanged.
- Runtime transitive declarations: onnxruntime-common/platform MIT; long/flatbuffers Apache-2.0; protobufjs/@protobufjs modules BSD-3-Clause; guid-typescript ISC. Full locked versions in bun.lock. Notices included in public/experimental/birefnet. No IMG.LY imports in experimental dependency graph.

## Reproduction
Use a Python environment outside the application. Install CPU torch, torchvision, transformers, timm, einops, kornia, safetensors, onnx, onnxscript. Download official `birefnet.py`, `BiRefNet_config.py`, and `model.safetensors` at the revision above to `/tmp/birefnet`. Change only its relative `from .BiRefNet_config` import to `from BiRefNet_config` for standalone execution. Run `export_512.py`. This exports fixed dimensions; it is not a dynamic-size graph. Export tools are not shipped as app dependencies.

ONNX vs PyTorch logits on a seeded 512×512 normal random input: max absolute difference 0.0000762939453125; mean 0.000012859138223575428. This is a single synthetic fidelity check, not universal equivalence proof.

## Results 2026-11-17
Owner dog/watch/woman originals: 1536×1024 outputs, actual PNG alpha. Desktop Chromium: 28.37/16.36/17.86 seconds total; inference 15.52/15.90/17.13 seconds. First model read 4.45s, session 7.35s; next two reuse session without model requests. Max renderer RSS sampled each second: 1675735040/1710960640/1563111424 bytes (not model-exclusive or full-browser memory; peaks may be missed). Worker JS heap API absent.

1024 baseline failed with std::bad_alloc for all three inputs, ~65–67s and ~4.4GiB renderer RSS. Working 512 export is visually better for woman, modest difference for watch, introduces gray residuals on dog. Does not reconstruct transparent stand colors or guarantee hair fidelity.

138 tests passed; invalid file, explicit reduction/initially disabled processing, cancellation, worker release, real downloads, partial alpha (max128), 491×967 and 375×812 no overflow, no non-GET requests. Current woman result reprocessed unchanged, pixel-identical to prior baseline. Mobile-emulated woman pixel-identical to desktop. No physical Apple/Android or Safari execution validated. Do not substitute yet.