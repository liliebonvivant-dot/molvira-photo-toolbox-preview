import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { ChevronRight, ImagePlus, Grid2X2, Undo2, Redo2, Trash2, ArrowLeft, ArrowRight, LoaderCircle, ShieldCheck, Wand2, Eraser } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { copy, langIndex, type Language, type Tool } from '@/lib/photo/content';
import { collageCopy } from '@/lib/photo/collage-copy';
import { clampCollage, collageCells, collageFilename, collageLayouts, collageLimits, collageOutputError, collageOutputReduction, commitCollage, drawCollage, encodeCollage, initialCollage, loadCollageSource, moveCollagePhoto, newCollagePhoto, photoPlacement, redoCollage, releaseCollageSource, sourceAllowance, undoCollage, type CollageHistory, type CollageLayout, type CollagePhoto, type CollageSource, type CollageState } from '@/lib/photo/collage';
import { inspectImage, dimensionError, type ImageFormat } from '@/lib/photo/resize';
import { reducedDimensions } from '@/lib/photo/convert';
import type { ReduceOffer, Size } from '@/lib/photo/large-image';
import { Shell, ReservedSpace } from './shell';
import { ToolIcon } from './tool-card';
import { ReducePrompt } from './reduce-prompt';
import { FileSaving } from './file-saving';

type ErrorCode = 'fileType' | 'fileSize' | 'inputLimit' | 'decode' | 'exportError' | 'memory' | 'limit' | 'dimensions' | 'outputLimit';
const errorCode = (e: unknown): ErrorCode => { const code = e instanceof Error ? e.message : 'decode'; return ['fileType', 'fileSize', 'inputLimit', 'decode', 'exportError', 'memory', 'limit', 'dimensions', 'outputLimit'].includes(code) ? code as ErrorCode : 'decode'; };
export function CollageWorkspace({ tool, lang, slug }: { tool: Tool; lang: Language; slug: string }) {
  const c = copy[lang], r = collageCopy[lang];
  const input = useRef<HTMLInputElement>(null), canvas = useRef<HTMLCanvasElement>(null), owned = useRef(new Map<string, CollageSource>()), sequence = useRef(0), alive = useRef(true), locked = useRef(false), output = useRef<string | undefined>(undefined);
  const [history, setHistory] = useState<CollageHistory>(() => ({ past: [], present: initialCollage(), future: [] }));
  const state = history.present, latest = useRef(state); latest.current = state;
  const [selected, setSelected] = useState<string>(), [format, setFormat] = useState<ImageFormat>('image/png'), [quality, setQuality] = useState(95);
  const [loading, setLoading] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState<ErrorCode>(), [issues, setIssues] = useState<{ name: string; code: ErrorCode }[]>([]);
  const [pending, setPending] = useState<{ offer: ReduceOffer; rest: File[] }>(), [outputOffer, setOutputOffer] = useState<Size>();
  const [result, setResult] = useState<{ blob: Blob; url: string; key: string }>();
  const drag = useRef<{ pointer: number; x: number; y: number; before: CollageHistory; photo: CollagePhoto; dx: number; dy: number } | undefined>(undefined);
  const active = state.photos.find(p => p.id === selected), key = JSON.stringify([state, format, quality]);
  const ratio = state.width === state.height ? 'square' : state.width * 5 === state.height * 4 ? 'portrait' : state.width * 16 === state.height * 9 ? 'story' : state.width * 9 === state.height * 16 ? 'landscape' : 'custom';
  const current = result?.key === key && !loading && !pending && !outputOffer ? result : undefined;
  const held = () => [...owned.current.values()].reduce((sum, s) => sum + s.width * s.height, 0);
  function discard() { if (output.current) URL.revokeObjectURL(output.current); output.current = undefined; setResult(undefined); }
  function change(next: CollageState) { if (locked.current) return; discard(); setError(undefined); setOutputOffer(undefined); latest.current = next; setHistory(h => commitCollage(h, next)); }
  function patch(p: Partial<CollageState>) { change({ ...state, ...p }); }
  function update(p: Partial<CollagePhoto>) { if (active) patch({ photos: state.photos.map(photo => photo.id === active.id ? { ...photo, ...p } : photo) }); }
  useEffect(() => { alive.current = true; return () => { alive.current = false; for (const s of owned.current.values()) releaseCollageSource(s); owned.current.clear(); if (output.current) URL.revokeObjectURL(output.current); }; }, []);
  useEffect(() => {
    const used = new Set([...history.past, state, ...history.future].flatMap(s => s.photos.map(p => p.id)));
    for (const [id, s] of owned.current) if (!used.has(id)) { releaseCollageSource(s); owned.current.delete(id); }
  }, [history, state]);
  async function add(files: File[], target?: Size) {
    if (!files.length || locked.current) return;
    locked.current = true; setLoading(true); setError(undefined); setOutputOffer(undefined); setPending(undefined); discard();
    if (!target) setIssues([]);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]; if (!file || !alive.current) break;
        if (latest.current.photos.length >= collageLimits.photos) { setError('limit'); break; }
        const allowance = sourceAllowance(held(), latest.current);
        try {
          const source = await loadCollageSource(file, allowance, i === 0 ? target : undefined);
          if (!alive.current) { if ('image' in source) releaseCollageSource(source); break; }
          if (!('image' in source)) { setPending({ offer: source, rest: files.slice(i + 1) }); break; }
          const id = `photo-${++sequence.current}`; owned.current.set(id, source);
          const next = { ...latest.current, photos: [...latest.current.photos, newCollagePhoto(id)] }; latest.current = next;
          setHistory(h => commitCollage(h, next)); setSelected(id);
        } catch (e) {
          if (!alive.current) break;
          const code = errorCode(e);
          if (!target && code === 'decode' && allowance > 1) {
            const h = await inspectImage(file).catch(() => undefined);
            if (!alive.current) break;
            if (h && h.width * h.height > 1) { setPending({ offer: { file, ...h, reduced: reducedDimensions(h.width, h.height, Math.min(allowance, Math.floor(h.width * h.height / 2))) }, rest: files.slice(i + 1) }); break; }
          }
          setIssues(old => [...old, { name: file.name, code }]);
        }
      }
    } finally { locked.current = false; if (alive.current) setLoading(false); }
  }
  useEffect(() => {
    const stage = canvas.current; if (!stage || !state.photos.length) return;
    const width = Math.max(1, Number.isFinite(state.width) ? state.width : 1), height = Math.max(1, Number.isFinite(state.height) ? state.height : 1);
    const scale = Math.min(1, 1200 / width, 800 / height); stage.width = Math.max(1, Math.round(width * scale)); stage.height = Math.max(1, Math.round(height * scale));
    const ctx = stage.getContext('2d'); if (!ctx) return;
    ctx.setTransform(stage.width / width, 0, 0, stage.height / height, 0, 0);
    drawCollage(ctx, { ...state, width, height }, owned.current, format);
  }, [state, format, lang]);
  function point(e: PointerEvent<HTMLCanvasElement>) { const box = e.currentTarget.getBoundingClientRect(); return { x: (e.clientX - box.left) / box.width * state.width, y: (e.clientY - box.top) / box.height * state.height }; }
  function down(e: PointerEvent<HTMLCanvasElement>) {
    if (locked.current || dimensionError(state.width, state.height)) return;
    const p = point(e), cells = collageCells(state.photos.length, state), index = cells.findIndex(cell => p.x >= cell.x && p.x <= cell.x + cell.width && p.y >= cell.y && p.y <= cell.y + cell.height);
    const photo = state.photos[index], cell = cells[index]; if (!photo || !cell) return;
    const source = owned.current.get(photo.id); if (!source) return;
    const dest = photoPlacement(source, cell, photo); setSelected(photo.id); e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { pointer: e.pointerId, x: p.x, y: p.y, before: history, photo, dx: cell.width - dest.width, dy: cell.height - dest.height }; discard();
  }
  function move(e: PointerEvent<HTMLCanvasElement>) {
    const d = drag.current; if (!d || d.pointer !== e.pointerId) return; e.preventDefault(); const p = point(e);
    const next = { ...d.before.present, photos: d.before.present.photos.map(photo => photo.id === d.photo.id ? { ...photo, x: Math.abs(d.dx) < 1 ? photo.x : clampCollage(d.photo.x + (p.x - d.x) / d.dx * 100, 0, 100), y: Math.abs(d.dy) < 1 ? photo.y : clampCollage(d.photo.y + (p.y - d.y) / d.dy * 100, 0, 100) } : photo) };
    latest.current = next; setHistory({ ...d.before, present: next });
  }
  function finish(cancel = false) { const d = drag.current; if (!d) return; drag.current = undefined; setHistory(h => { const next = cancel ? d.before : commitCollage(d.before, h.present); latest.current = next.present; return next; }); }
  async function prepare() {
    if (locked.current || pending || state.photos.length < 2) return; setError(undefined); discard();
    const issue = collageOutputError(state, held());
    if (issue) { setError(issue as ErrorCode); if (issue === 'memory') setOutputOffer(collageOutputReduction(state, held())); return; }
    locked.current = true; setBusy(true);
    try { const blob = await encodeCollage(state, owned.current, format, format === 'image/png' ? 100 : quality); if (!alive.current) return; const url = URL.createObjectURL(blob); output.current = url; setResult({ blob, url, key }); }
    catch { if (alive.current) { setError('exportError'); setOutputOffer(collageOutputReduction(state, held(), true)); } }
    finally { locked.current = false; if (alive.current) setBusy(false); }
  }
  const icon = (label: string, node: ReactNode, action: () => void, disabled = false) => <Button variant="outline" size="icon" title={label} aria-label={label} disabled={disabled || loading || busy || !!pending} onClick={action}>{node}</Button>;
  const slider = (label: string, value: number, min: number, max: number, action: (v: number) => void, unit = '', step = 1) => <label className="setting-field"><span>{label}<small>{Math.round(value * 100) / 100}{unit}</small></span><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={e => action(Number(e.target.value))}/></label>;
  function travel(action: (h: CollageHistory) => CollageHistory) { discard(); setError(undefined); setOutputOffer(undefined); setHistory(h => { const next = action(h); latest.current = next.present; return next; }); }
  return <Shell lang={lang} slug={slug}><main id="main" className="content-width tool-page resize-page collage-page">
    <nav className="breadcrumbs"><Link to="/$lang" params={{ lang }}>{c.home}</Link><ChevronRight size={13}/><span>{tool.titles[langIndex(lang)]}</span></nav>
    <div className="tool-page-heading"><ToolIcon tool={tool}/><div><h1>{tool.titles[langIndex(lang)]}</h1><p>{tool.descriptions[langIndex(lang)]}</p></div></div>
    <div className="phase-notice"><ShieldCheck size={18}/><p>{r.local}</p></div>
    <div className="workspace"><div className="workspace-main">
      <section className="upload-area" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (!pending) void add([...e.dataTransfer.files]); }}><ImagePlus size={32}/><h2>{r.upload}</h2><p>{r.drop}</p>
        <input ref={input} type="file" multiple className="sr-only" aria-label={r.choose} accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" disabled={loading || busy || !!pending} onChange={e => { void add([...(e.target.files ?? [])]); e.target.value = ''; }}/>
        <Button size="lg" disabled={loading || busy || !!pending} onClick={() => input.current?.click()}>{loading ? <LoaderCircle className="animate-spin"/> : <ImagePlus/>}{state.photos.length ? r.add : r.choose}</Button><small>{r.formats}</small>
      </section>
      {pending && <ReducePrompt offer={pending.offer} lang={lang} onCancel={() => { const rest = pending.rest; setPending(undefined); void add(rest); }} onReduce={() => void add([pending.offer.file, ...pending.rest], pending.offer.reduced)}/>}
      {issues.map((issue, i) => <p key={i} role="alert" className="resize-error">{r.skipped}: {issue.name} — {r[issue.code]}</p>)}
      <section className="preview-section"><h2>{r.preview} · {state.width} × {state.height} px</h2>
        <div className="collage-toolbar">{icon(r.undo, <Undo2/>, () => travel(undoCollage), !history.past.length)}{icon(r.redo, <Redo2/>, () => travel(redoCollage), !history.future.length)}{icon(r.clear, <Eraser/>, () => travel(h => ({ ...h, past: [], future: [] })), !history.past.length && !history.future.length)}</div>
        <div className="collage-stage">{state.photos.length ? <canvas ref={canvas} aria-label={r.preview} tabIndex={0} onPointerDown={down} onPointerMove={move} onPointerUp={() => finish()} onPointerCancel={() => finish(true)} onLostPointerCapture={() => finish()} onKeyDown={e => { if (!active || locked.current) return; const axis = e.key === 'ArrowLeft' || e.key === 'ArrowRight' ? 'x' : e.key === 'ArrowUp' || e.key === 'ArrowDown' ? 'y' : undefined; if (axis) { e.preventDefault(); update({ [axis]: clampCollage(active[axis] + (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1), 0, 100) }); } }}/> : <div className="resize-empty"><Grid2X2 size={40}/><p>{r.empty}</p></div>}</div>
        <p role="status" className="collage-status settings-hint">{loading || busy ? r.processing : state.photos.length < 2 ? r.minimum : '\u00a0'}</p>
      </section>
      <section className="collage-photos"><h2>{r.photos} · {state.photos.length}/12</h2><div className="collage-thumbnails">{state.photos.map((photo, i) => { const source = owned.current.get(photo.id); return <div className="collage-photo" key={photo.id}>
        <Button variant={selected === photo.id ? 'default' : 'outline'} className="collage-thumb" aria-label={`${r.photo} ${i + 1}`} aria-pressed={selected === photo.id} disabled={loading || busy || !!pending} onClick={() => setSelected(photo.id)}>{source && <img src={source.url} alt={source.file.name}/>}<span>{i + 1}</span></Button>
        <p title={source?.file.name}>{source?.file.name}</p><small>{source?.width} × {source?.height}{source?.reduced ? ` · ${r.reduced} (${source.originalWidth} × ${source.originalHeight})` : ''}</small>
        <div className="collage-toolbar">{icon(`${r.before} ${i + 1}`, <ArrowLeft/>, () => patch({ photos: moveCollagePhoto(state.photos, photo.id, -1) }), i === 0)}{icon(`${r.after} ${i + 1}`, <ArrowRight/>, () => patch({ photos: moveCollagePhoto(state.photos, photo.id, 1) }), i === state.photos.length - 1)}{icon(`${r.remove} ${i + 1}`, <Trash2/>, () => { patch({ photos: state.photos.filter(p => p.id !== photo.id) }); if (selected === photo.id) setSelected(undefined); })}</div>
      </div>; })}</div></section>
    </div><aside className="settings-panel"><h2>{c.settings}</h2><fieldset className="resize-fields" disabled={loading || busy || !!pending}>
      <label className="setting-field"><span>{r.layout}</span><select aria-label={r.layout} value={state.layout} onChange={e => patch({ layout: e.target.value as CollageLayout })}>{collageLayouts.map(layout => <option key={layout} value={layout}>{r[layout]}</option>)}</select></label>
      <label className="setting-field"><span>{r.ratio}</span><select aria-label={r.ratio} value={ratio} onChange={e => { const ratios: Record<string, Size> = { square: { width: 1080, height: 1080 }, portrait: { width: 1080, height: 1350 }, story: { width: 1080, height: 1920 }, landscape: { width: 1920, height: 1080 } }; const size = ratios[e.target.value]; if (size) patch(size); }}><option value="custom">{r.custom}</option>{(['square', 'portrait', 'story', 'landscape'] as const).map(ratio => <option key={ratio} value={ratio}>{r[ratio]}</option>)}</select></label>
      <div className="settings-two">{(['width', 'height'] as const).map(axis => <label key={axis} className="setting-field"><span>{r[axis]}</span><input aria-label={r[axis]} type="number" min={1} max={12000} step={1} value={state[axis]} onChange={e => patch({ [axis]: Number(e.target.value) })}/></label>)}</div>
      {slider(r.spacing, state.gap, 0, 200, gap => patch({ gap }), ' px')}{slider(r.radius, state.radius, 0, 200, radius => patch({ radius }), ' px')}
      <label className="setting-field"><span>{r.background}</span><input aria-label={r.background} type="color" value={state.color} onChange={e => patch({ color: e.target.value })}/></label>
      <label className="setting-check"><input type="checkbox" checked={state.transparent} onChange={e => patch({ transparent: e.target.checked })}/>{r.transparent}</label>
      {active && <><h3 className="collage-framing">{r.framing} · {state.photos.indexOf(active) + 1}</h3><div className="collage-fit" role="group" aria-label={r.framing}><Button variant={active.fit === 'cover' ? 'default' : 'outline'} aria-pressed={active.fit === 'cover'} onClick={() => update({ fit: 'cover' })}>{r.cover}</Button><Button variant={active.fit === 'contain' ? 'default' : 'outline'} aria-pressed={active.fit === 'contain'} onClick={() => update({ fit: 'contain', zoom: 1 })}>{r.contain}</Button></div>
        {slider(r.zoom, active.zoom, 1, 4, zoom => update({ zoom }), '×', .01)}{slider(r.x, active.x, 0, 100, x => update({ x }), '%')}{slider(r.y, active.y, 0, 100, y => update({ y }), '%')}
      </>}
      <label className="setting-field"><span>{c.output}</span><select aria-label={c.output} value={format} onChange={e => { discard(); setError(undefined); setFormat(e.target.value as ImageFormat); }}><option value="image/png">PNG</option><option value="image/jpeg">JPG</option><option value="image/webp">WebP</option></select></label>
      {format !== 'image/png' && slider(r.quality, quality, 1, 100, v => { discard(); setQuality(v); }, '%')}
    </fieldset><p className="settings-hint">{r.jpg}</p>{error && <p role="alert" className="resize-error">{r[error]}</p>}
    {outputOffer && <div className="collage-output-offer"><h3>{r.reduceTitle}</h3><p>{state.width} × {state.height} → {outputOffer.width} × {outputOffer.height} px</p><Button variant="outline" onClick={() => change({ ...state, ...outputOffer })}>{r.reduce}</Button><Button variant="ghost" onClick={() => setOutputOffer(undefined)}>{r.cancel}</Button></div>}
    <Button className="resize-download mt-5" variant="outline" disabled={state.photos.length < 2 || loading || busy || !!pending} onClick={() => void prepare()}>{busy ? <LoaderCircle className="animate-spin"/> : <Wand2/>}{busy ? r.processing : r.prepare}</Button>
    <FileSaving lang={lang} result={current} filename={collageFilename(format)} title={c.export} label={r.download} processing={r.processing} busy={busy || loading} disabled={!current || !!pending || !!error} mode="auto"/>
    </aside></div><ReservedSpace lang={lang}/>
  </main></Shell>;
}
