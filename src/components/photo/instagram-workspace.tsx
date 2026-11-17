import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { ChevronRight, ImagePlus, Instagram, Undo2, Redo2, RotateCw, RotateCcw, Trash2, LoaderCircle, ShieldCheck, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { copy, langIndex, type Language, type Tool } from '@/lib/photo/content';
import { instagramCopy } from '@/lib/photo/instagram-copy';
import { clampInstagram, commitInstagram, drawInstagram, encodeInstagram, initialInstagram, instagramFilename, instagramOutputError, instagramOutputReduction, instagramPresets, loadInstagramSource, redoInstagram, releaseInstagramSource, undoInstagram, type InstagramHistory, type InstagramPreset, type InstagramSource, type InstagramState } from '@/lib/photo/instagram';
import { inspectImage, dimensionError, type ImageFormat } from '@/lib/photo/resize';
import { reducedDimensions, safePixelBudget } from '@/lib/photo/convert';
import type { ReduceOffer, Size } from '@/lib/photo/large-image';
import { Shell, ReservedSpace } from './shell';
import { ToolIcon } from './tool-card';
import { ReducePrompt } from './reduce-prompt';
import { FileSaving } from './file-saving';

type ErrorCode = 'fileType' | 'fileSize' | 'inputLimit' | 'decode' | 'exportError' | 'memory' | 'dimensions' | 'outputLimit';
const errorCode = (e: unknown): ErrorCode => { const code = e instanceof Error ? e.message : 'decode'; return ['fileType', 'fileSize', 'inputLimit', 'decode', 'exportError', 'memory', 'dimensions', 'outputLimit'].includes(code) ? code as ErrorCode : 'decode'; };
type Point = { x: number; y: number };
export function InstagramWorkspace({ tool, lang, slug }: { tool: Tool; lang: Language; slug: string }) {
  const c = copy[lang], r = instagramCopy[lang];
  const input = useRef<HTMLInputElement>(null), canvas = useRef<HTMLCanvasElement>(null), owned = useRef<InstagramSource | undefined>(undefined), alive = useRef(true), locked = useRef(false), output = useRef<string | undefined>(undefined), generation = useRef(0);
  const [source, setSource] = useState<InstagramSource>();
  const [history, setHistory] = useState<InstagramHistory>(() => ({ past: [], present: initialInstagram(), future: [] }));
  const state = history.present, latest = useRef(state); latest.current = state;
  const [format, setFormat] = useState<ImageFormat>('image/png'), [quality, setQuality] = useState(95);
  const [loading, setLoading] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState<ErrorCode>(), [pending, setPending] = useState<ReduceOffer>(), [outputOffer, setOutputOffer] = useState<Size>();
  const [result, setResult] = useState<{ blob: Blob; url: string; key: string }>();
  const key = JSON.stringify([generation.current, state, format, quality]);
  const current = result?.key === key && !loading && !pending && !outputOffer && !error ? result : undefined;
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<{ before: InstagramHistory; base: InstagramState; center: Point; distance: number } | undefined>(undefined);
  function discard() { if (output.current) URL.revokeObjectURL(output.current); output.current = undefined; setResult(undefined); }
  function change(next: InstagramState) { if (locked.current || pending || gesture.current) return; discard(); setError(undefined); setOutputOffer(undefined); latest.current = next; setHistory(h => commitInstagram(h, next)); }
  function patch(p: Partial<InstagramState>) { change({ ...state, ...p }); }
  function travel(action: (h: InstagramHistory) => InstagramHistory) { discard(); setError(undefined); setOutputOffer(undefined); setHistory(h => { const next = action(h); latest.current = next.present; return next; }); }
  function remove() { discard(); if (owned.current) releaseInstagramSource(owned.current); owned.current = undefined; generation.current++; setSource(undefined); setPending(undefined); setError(undefined); setOutputOffer(undefined); const next = initialInstagram(); latest.current = next; setHistory({ past: [], present: next, future: [] }); }
  useEffect(() => { alive.current = true; return () => { alive.current = false; if (owned.current) releaseInstagramSource(owned.current); owned.current = undefined; if (output.current) URL.revokeObjectURL(output.current); const stage = canvas.current; if (stage) { stage.width = 0; stage.height = 0; } }; }, []);
  async function add(file?: File, target?: Size) {
    if (!file || locked.current || gesture.current) return;
    locked.current = true; setLoading(true); setError(undefined); setPending(undefined); setOutputOffer(undefined); discard();
    try {
      await inspectImage(file);
      if (!alive.current) return;
      if (owned.current) releaseInstagramSource(owned.current); owned.current = undefined; setSource(undefined); generation.current++;
      const loaded = await loadInstagramSource(file, initialInstagram(), target);
      if (!alive.current) { if ('image' in loaded) releaseInstagramSource(loaded); return; }
      if (!('image' in loaded)) { setPending(loaded); return; }
      owned.current = loaded; setSource(loaded); const next = initialInstagram(); latest.current = next; setHistory({ past: [], present: next, future: [] });
    } catch (e) {
      if (!alive.current) return;
      const code = errorCode(e);
      if (!target && (code === 'decode' || code === 'exportError')) {
        const h = await inspectImage(file).catch(() => undefined);
        if (!alive.current) return;
        if (h && h.width * h.height > 1) { const defaults = initialInstagram(); setPending({ file, ...h, reduced: reducedDimensions(h.width, h.height, Math.max(1, Math.min(safePixelBudget() - defaults.width * defaults.height, Math.floor(h.width * h.height / 2)))) }); return; }
      }
      setError(code);
    } finally { locked.current = false; if (alive.current) setLoading(false); }
  }
  useEffect(() => {
    const stage = canvas.current; if (!stage || !source) return;
    const size = dimensionError(state.width, state.height) ? { width: 1080, height: 1080 } : state;
    const scale = Math.min(1, 1200 / size.width, 800 / size.height); stage.width = Math.max(1, Math.round(size.width * scale)); stage.height = Math.max(1, Math.round(size.height * scale));
    const ctx = stage.getContext('2d'); if (!ctx) return;
    ctx.setTransform(stage.width / size.width, 0, 0, stage.height / size.height, 0, 0); drawInstagram(ctx, source, { ...state, ...size }, format);
  }, [state, source, format, lang]);
  function point(e: PointerEvent<HTMLCanvasElement>) { const b = e.currentTarget.getBoundingClientRect(); return { x: (e.clientX - b.left) / b.width * state.width, y: (e.clientY - b.top) / b.height * state.height }; }
  function geometry() { const a = [...pointers.current.values()], p = a[0], q = a[1]; return !p ? undefined : { center: q ? { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 } : p, distance: q ? Math.hypot(q.x - p.x, q.y - p.y) : 0 }; }
  function down(e: PointerEvent<HTMLCanvasElement>) {
    if (locked.current || pending || !source || dimensionError(state.width, state.height) || pointers.current.size >= 2) return;
    e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); pointers.current.set(e.pointerId, point(e)); const g = geometry(); if (!g) return;
    gesture.current = { before: gesture.current?.before ?? history, base: latest.current, ...g }; discard(); setError(undefined); setOutputOffer(undefined);
  }
  function move(e: PointerEvent<HTMLCanvasElement>) {
    const d = gesture.current; if (!d || !pointers.current.has(e.pointerId)) return; e.preventDefault(); pointers.current.set(e.pointerId, point(e)); const g = geometry(); if (!g) return;
    const zoom = clampInstagram(d.distance > 0 && g.distance > 0 ? d.base.zoom * g.distance / d.distance : d.base.zoom, .1, 4), ratio = zoom / d.base.zoom;
    const cx = d.base.width * (.5 + d.base.x / 100), cy = d.base.height * (.5 + d.base.y / 100);
    const next = { ...d.base, zoom, x: clampInstagram((g.center.x + (cx - d.center.x) * ratio - d.base.width / 2) / d.base.width * 100, -100, 100), y: clampInstagram((g.center.y + (cy - d.center.y) * ratio - d.base.height / 2) / d.base.height * 100, -100, 100) };
    latest.current = next; setHistory({ ...d.before, present: next });
  }
  function finish(id: number, cancel = false) {
    const d = gesture.current; if (!d || !pointers.current.has(id)) return;
    pointers.current.delete(id);
    if (cancel) pointers.current.clear();
    const g = geometry();
    if (g) { gesture.current = { before: d.before, base: latest.current, ...g }; return; }
    gesture.current = undefined; const next = cancel ? d.before : commitInstagram(d.before, latest.current); latest.current = next.present; setHistory(next);
  }
  async function prepare() {
    if (locked.current || pending || !source || gesture.current) return; setError(undefined); discard();
    const issue = instagramOutputError(state, source);
    if (issue) { setError(issue); if (issue === 'memory') setOutputOffer(instagramOutputReduction(state, source)); return; }
    locked.current = true; setBusy(true);
    try { const blob = await encodeInstagram(source, state, format, format === 'image/png' ? 100 : quality); if (!alive.current) return; const url = URL.createObjectURL(blob); output.current = url; setResult({ blob, url, key }); }
    catch { if (alive.current) { setError('exportError'); setOutputOffer(instagramOutputReduction(state, source, true)); } }
    finally { locked.current = false; if (alive.current) setBusy(false); }
  }
  const disabled = loading || busy || !!pending;
  const icon = (label: string, node: ReactNode, action: () => void, off = false) => <Button variant="outline" size="icon" title={label} aria-label={label} disabled={disabled || off} onClick={action}>{node}</Button>;
  const slider = (label: string, value: number, min: number, max: number, action: (v: number) => void, unit = '', step = 1) => <label className="setting-field"><span>{label}<small>{Math.round(value * 100) / 100}{unit}</small></span><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={e => action(Number(e.target.value))}/></label>;
  return <Shell lang={lang} slug={slug}><main id="main" className="content-width tool-page resize-page instagram-page">
    <nav className="breadcrumbs"><Link to="/$lang" params={{ lang }}>{c.home}</Link><ChevronRight size={13}/><span>{tool.titles[langIndex(lang)]}</span></nav>
    <div className="tool-page-heading"><ToolIcon tool={tool}/><div><h1>{tool.titles[langIndex(lang)]}</h1><p>{tool.descriptions[langIndex(lang)]}</p></div></div>
    <div className="phase-notice"><ShieldCheck size={18}/><p>{r.local}</p></div>
    <div className="workspace"><div className="workspace-main">
      <section className="upload-area" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (!pending) void add(e.dataTransfer.files[0]); }}><ImagePlus size={32}/><h2>{r.upload}</h2><p>{r.drop}</p>
        <input ref={input} type="file" className="sr-only" aria-label={r.choose} accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" disabled={disabled} onChange={e => { void add(e.target.files?.[0]); e.target.value = ''; }}/>
        <Button size="lg" disabled={disabled} onClick={() => input.current?.click()}>{loading ? <LoaderCircle className="animate-spin"/> : <ImagePlus/>}{source ? r.replace : r.choose}</Button><small>{r.formats}</small>
      </section>
      {pending && <ReducePrompt offer={pending} lang={lang} onCancel={() => setPending(undefined)} onReduce={() => void add(pending.file, pending.reduced)}/>}
      {source && <p className="resize-filename">{source.file.name} · {r.original}: {source.originalWidth} × {source.originalHeight} px{source.reduced ? ` · ${r.reduced}: ${source.width} × ${source.height} px` : ''}</p>}
      <section className="preview-section"><h2>{r.preview} · {state.width} × {state.height} px</h2>
        <div className="instagram-toolbar">{icon(r.undo, <Undo2/>, () => travel(undoInstagram), !history.past.length)}{icon(r.redo, <Redo2/>, () => travel(redoInstagram), !history.future.length)}{icon(r.rotate, <RotateCw/>, () => patch({ rotation: (state.rotation + 90) % 360 }), !source)}{icon(r.reset, <RotateCcw/>, () => change(initialInstagram()), !source)}{icon(r.remove, <Trash2/>, remove, !source)}</div>
        <div className="instagram-stage">{source ? <canvas ref={canvas} aria-label={r.preview} tabIndex={0} onPointerDown={down} onPointerMove={move} onPointerUp={e => finish(e.pointerId)} onPointerCancel={e => finish(e.pointerId, true)} onLostPointerCapture={e => finish(e.pointerId)} onKeyDown={e => { if (disabled) return; const axis = ['ArrowLeft', 'ArrowRight'].includes(e.key) ? 'x' : ['ArrowUp', 'ArrowDown'].includes(e.key) ? 'y' : undefined; if (axis) { e.preventDefault(); patch({ [axis]: clampInstagram(state[axis] + (['ArrowLeft', 'ArrowUp'].includes(e.key) ? -1 : 1), -100, 100) }); } }}/> : <div className="resize-empty"><Instagram size={40}/><p>{r.empty}</p></div>}</div>
        <p role="status" className="instagram-status settings-hint">{loading || busy ? r.processing : '\u00a0'}</p><p className="settings-hint">{r.reference}</p>
      </section>
    </div><aside className="settings-panel"><h2>{c.settings}</h2><fieldset className="resize-fields" disabled={disabled}>
      <label className="setting-field"><span>{r.preset}</span><select aria-label={r.preset} value={state.preset} onChange={e => { const preset = e.target.value as InstagramPreset; patch({ preset, ...(preset === 'custom' ? {} : instagramPresets[preset]) }); }}><option value="custom">{r.custom}</option>{(Object.keys(instagramPresets) as (keyof typeof instagramPresets)[]).map(p => <option key={p} value={p}>{r[p]}</option>)}</select></label>
      <div className="settings-two">{(['width', 'height'] as const).map(axis => <label key={axis} className="setting-field"><span>{r[axis]}</span><input aria-label={r[axis]} type="number" min={1} max={12000} step={1} value={state[axis]} onChange={e => patch({ preset: 'custom', [axis]: Number(e.target.value) })}/></label>)}</div>
      <div className="instagram-fit" role="group" aria-label={r.framing}><Button variant={state.fit === 'cover' ? 'default' : 'outline'} aria-pressed={state.fit === 'cover'} onClick={() => patch({ fit: 'cover', zoom: 1 })}>{r.cover}</Button><Button variant={state.fit === 'contain' ? 'default' : 'outline'} aria-pressed={state.fit === 'contain'} onClick={() => patch({ fit: 'contain', zoom: 1 })}>{r.contain}</Button></div>
      {slider(r.zoom, state.zoom, .1, 4, zoom => patch({ zoom }), '×', .01)}{slider(r.x, state.x, -100, 100, x => patch({ x }), '%')}{slider(r.y, state.y, -100, 100, y => patch({ y }), '%')}
      <label className="setting-field"><span>{r.background}</span><input aria-label={r.background} type="color" value={state.color} onChange={e => patch({ color: e.target.value })}/></label>
      <label className="setting-check"><input type="checkbox" checked={state.transparent} onChange={e => patch({ transparent: e.target.checked })}/>{r.transparent}</label>
      <label className="setting-field"><span>{c.output}</span><select aria-label={c.output} value={format} onChange={e => { discard(); setError(undefined); setOutputOffer(undefined); setFormat(e.target.value as ImageFormat); }}><option value="image/png">PNG</option><option value="image/jpeg">JPG</option><option value="image/webp">WebP</option></select></label>
      {format !== 'image/png' && slider(r.quality, quality, 1, 100, v => { discard(); setQuality(v); }, '%')}
    </fieldset><p className="settings-hint">{r.jpg}</p>{error && <p role="alert" className="resize-error">{r[error]}</p>}
      {outputOffer && <div className="instagram-output-offer"><h3>{r.reduceTitle}</h3><p>{state.width} × {state.height} → {outputOffer.width} × {outputOffer.height} px</p><Button variant="outline" onClick={() => change({ ...state, ...outputOffer, preset: 'custom' })}>{r.reduce}</Button><Button variant="ghost" onClick={() => setOutputOffer(undefined)}>{r.cancel}</Button></div>}
      <Button className="resize-download mt-5" variant="outline" disabled={!source || disabled} onClick={() => void prepare()}>{busy ? <LoaderCircle className="animate-spin"/> : <Wand2/>}{busy ? r.processing : r.prepare}</Button>
      <FileSaving lang={lang} result={current} filename={instagramFilename(format)} title={c.export} label={r.download} processing={r.processing} busy={busy || loading} disabled={!current || !!pending || !!error} mode="auto"/>
    </aside></div><ReservedSpace lang={lang}/>
  </main></Shell>;
}
