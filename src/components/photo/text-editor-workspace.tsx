import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { ChevronRight, ImagePlus, Type, BadgeDollarSign, Stamp, Undo2, Redo2, Copy, Trash2, BringToFront, SendToBack, Bold, Italic, LoaderCircle, ShieldCheck, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { copy, langIndex, type Language, type Tool } from '@/lib/photo/content';
import { textEditorCopy } from '@/lib/photo/text-editor-copy';
import { clamp, commitLayers, currencies, drawEditor, duplicateLayer, editorFilename, editorFonts, editorLimits, encodeEditor, hitLayer, layerText, newLayer, redoLayers, reorderLayer, undoLayers, type EditorHistory, type EditorLayer, type LayerRect } from '@/lib/photo/text-editor';
import { inspectImage, type ImageFormat } from '@/lib/photo/resize';
import { loadWatermarkSource, releaseWatermarkSource, watermarkReduceOffer, type WatermarkSource } from '@/lib/photo/watermark-source';
import type { ReduceOffer, Size } from '@/lib/photo/large-image';
import { Shell, ReservedSpace } from './shell';
import { ToolIcon } from './tool-card';
import { ReducePrompt, ResolutionNote } from './reduce-prompt';
import { FileSaving } from './file-saving';

type ErrorCode = 'fileType' | 'fileSize' | 'inputLimit' | 'decode' | 'exportError' | 'limit';
const emptyHistory = (): EditorHistory => ({ past: [], present: [], future: [] });
export function TextEditorWorkspace({ tool, lang, slug }: { tool: Tool; lang: Language; slug: string }) {
  const c = copy[lang], r = textEditorCopy[lang];
  const photoInput = useRef<HTMLInputElement>(null), logoInput = useRef<HTMLInputElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const owned = useRef<{ photo?: WatermarkSource; logos: Map<string, WatermarkSource> }>({ logos: new Map() });
  const controller = useRef<AbortController | undefined>(undefined), sequence = useRef(0), alive = useRef(true);
  const [source, setSource] = useState<WatermarkSource>(), [history, setHistory] = useState<EditorHistory>(emptyHistory), [selected, setSelected] = useState<string>();
  const [format, setFormat] = useState<ImageFormat>('image/png'), [quality, setQuality] = useState(95), [loading, setLoading] = useState(false), [busy, setBusy] = useState(false);
  const [error, setError] = useState<ErrorCode>(), [pending, setPending] = useState<{ offer: ReduceOffer; kind: 'photo' | 'logo'; replace?: string | undefined; preserve?: boolean }>();
  const [result, setResult] = useState<{ blob: Blob; url: string; key: string }>();
  const replace = useRef<string | undefined>(undefined), output = useRef<string | undefined>(undefined);
  const drag = useRef<{ pointer: number; startX: number; startY: number; before: EditorHistory; layer: EditorLayer; rect: LayerRect; resize: boolean } | undefined>(undefined);
  const rects = useRef<{ id: string; rect: LayerRect }[]>([]);
  const layers = history.present, active = layers.find(l => l.id === selected);
  const key = JSON.stringify([source?.url, layers, format, quality]);
  const current = result?.key === key && !loading && !pending ? result : undefined;
  const id = () => `element-${++sequence.current}`;
  const logos = () => new Map([...owned.current.logos].map(([key, value]) => [key, value.image]));
  function discardResult() { if (output.current) URL.revokeObjectURL(output.current); output.current = undefined; setResult(undefined); }
  function change(next: EditorLayer[]) { setError(undefined); setHistory(h => commitLayers(h, next)); }
  function update(patch: Partial<EditorLayer>) { if (active) change(layers.map(l => l.id === active.id ? { ...l, ...patch } : l)); }
  useEffect(() => { alive.current = true; return () => { alive.current = false; controller.current?.abort(); releaseWatermarkSource(owned.current.photo); for (const logo of owned.current.logos.values()) releaseWatermarkSource(logo); if (output.current) URL.revokeObjectURL(output.current); }; }, []);
  // Keep logo assets referenced by undo/redo, release everything else.
  useEffect(() => {
    const used = new Set([...history.past.flat(), ...layers, ...history.future.flat()].map(l => l.asset));
    for (const [key, logo] of owned.current.logos) if (!used.has(key)) { releaseWatermarkSource(logo); owned.current.logos.delete(key); }
  }, [history, layers]);
  async function load(file: File | undefined, kind: 'photo' | 'logo', target?: Size, replacing?: string, preserve = false) {
    if (!file || loading || busy) return;
    controller.current?.abort(); const request = new AbortController(); controller.current = request;
    setLoading(true); setError(undefined); setPending(undefined);
    try {
      const header = await inspectImage(file);
      if (kind === 'logo' && header.format === 'image/jpeg') throw new Error('fileType');
      if (kind === 'logo') {
        const total = [...owned.current.logos.values()].reduce((sum, logo) => sum + logo.width * logo.height, 0);
        if (total + header.width * header.height > editorLimits.logoPixels || (!replacing && layers.length >= editorLimits.elements)) throw new Error('limit');
      }
      const decoded = await loadWatermarkSource(file, request.signal, target);
      if (request.signal.aborted) { if ('image' in decoded) releaseWatermarkSource(decoded); return; }
      if (!('image' in decoded)) { setPending({ offer: decoded, kind, replace: replacing, preserve }); return; }
      discardResult();
      if (kind === 'photo') {
        releaseWatermarkSource(owned.current.photo);
        if (!preserve) { for (const logo of owned.current.logos.values()) releaseWatermarkSource(logo); owned.current.logos.clear(); setHistory(emptyHistory()); setSelected(undefined); }
        owned.current.photo = decoded; setSource(decoded);
      } else {
        const asset = id(); owned.current.logos.set(asset, decoded);
        if (replacing) { change(layers.map(l => l.id === replacing ? { ...l, asset } : l)); setSelected(replacing); }
        else { const layer = newLayer(id(), 'logo', asset); change([...layers, layer]); setSelected(layer.id); }
      }
    } catch (e) {
      if (!request.signal.aborted) {
        const message = e instanceof Error ? e.message : 'decode';
        if (!target && !['fileType', 'fileSize', 'inputLimit', 'limit'].includes(message)) {
          const header = await inspectImage(file).catch(() => undefined);
          if (request.signal.aborted) return;
          const offer = header ? watermarkReduceOffer(file, header.width, header.height, true) : undefined;
          if (offer) setPending({ offer, kind, replace: replacing, preserve }); else setError('decode');
        } else setError(['fileType', 'fileSize', 'inputLimit', 'limit'].includes(message) ? message as ErrorCode : 'decode');
      }
    } finally { if (!request.signal.aborted) setLoading(false); }
  }
  useEffect(() => {
    const stage = canvas.current; if (!stage || !source) return;
    const scale = Math.min(1, 1200 / source.width, 800 / source.height);
    stage.width = Math.max(1, Math.round(source.width * scale)); stage.height = Math.max(1, Math.round(source.height * scale));
    const ctx = stage.getContext('2d'); if (!ctx) return;
    ctx.setTransform(stage.width / source.width, 0, 0, stage.height / source.height, 0, 0);
    rects.current = drawEditor(ctx, source.image, source.width, source.height, layers, logos(), format);
    const selectedRect = rects.current.find(l => l.id === selected)?.rect;
    if (selectedRect) {
      const box = selectedRect, unit = source.width / stage.getBoundingClientRect().width;
      ctx.strokeStyle = getComputedStyle(stage).getPropertyValue('--primary'); ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = 2 * unit;
      ctx.strokeRect(box.x, box.y, box.width, box.height); ctx.fillRect(box.x + box.width - 7 * unit, box.y + box.height - 7 * unit, 14 * unit, 14 * unit);
    }
  }, [source, layers, selected, format, lang]);
  function add(kind: 'text' | 'price') { if (layers.length >= editorLimits.elements) { setError('limit'); return; } const layer = newLayer(id(), kind); change([...layers, layer]); setSelected(layer.id); }
  function point(e: PointerEvent<HTMLCanvasElement>) { const box = e.currentTarget.getBoundingClientRect(); return { x: (e.clientX - box.left) / box.width * (source?.width ?? 1), y: (e.clientY - box.top) / box.height * (source?.height ?? 1) }; }
  function down(e: PointerEvent<HTMLCanvasElement>) {
    if (!source || busy || loading) return; const p = point(e), selectedRect = rects.current.find(l => l.id === selected)?.rect;
    const tolerance = 22 * source.width / e.currentTarget.getBoundingClientRect().width;
    const resize = !!selectedRect && Math.abs(p.x - selectedRect.x - selectedRect.width) < tolerance && Math.abs(p.y - selectedRect.y - selectedRect.height) < tolerance;
    const hit = resize ? selected : hitLayer(rects.current, p.x, p.y); setSelected(hit);
    const layer = layers.find(l => l.id === hit), rect = rects.current.find(l => l.id === hit)?.rect;
    if (!layer || !rect) return; e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { pointer: e.pointerId, startX: p.x, startY: p.y, before: history, layer, rect, resize };
  }
  function move(e: PointerEvent<HTMLCanvasElement>) {
    const d = drag.current; if (!d || d.pointer !== e.pointerId || !source) return; const p = point(e);
    const patch = d.resize ? { size: clamp(d.layer.size * (d.rect.width + p.x - d.startX) / d.rect.width, .5, 100) } : { x: clamp((d.rect.x + p.x - d.startX) / source.width * 100, 0, 100), y: clamp((d.rect.y + p.y - d.startY) / source.height * 100, 0, 100) };
    setHistory({ ...d.before, present: d.before.present.map(l => l.id === d.layer.id ? { ...l, ...patch } : l) });
  }
  function finish(cancel = false) { const d = drag.current; if (!d) return; drag.current = undefined; setHistory(h => cancel ? d.before : commitLayers(d.before, h.present)); }
  async function prepare() {
    if (!source || loading || busy || pending) return; setBusy(true); setError(undefined); discardResult();
    try {
      const blob = await encodeEditor(source.image, source.width, source.height, layers, logos(), format, format === 'image/png' ? 100 : quality);
      if (!alive.current) return; const url = URL.createObjectURL(blob); output.current = url; setResult({ blob, url, key });
    } catch { if (alive.current) { const offer = !source.reduced ? watermarkReduceOffer(source.file, source.width, source.height, true) : undefined; if (offer) setPending({ offer, kind: 'photo', preserve: true }); else setError('exportError'); } }
    finally { if (alive.current) setBusy(false); }
  }
  const iconButton = (label: string, icon: ReactNode, action: () => void, disabled = false) => <Button variant="outline" size="icon" title={label} aria-label={label} onClick={action} disabled={disabled}>{icon}</Button>;
  const slider = (name: 'size' | 'opacity' | 'x' | 'y', label: string, min: number, max: number) => active && <label className="setting-field"><span>{label}<small>{Math.round(active[name] * 10) / 10}%</small></span><input aria-label={label} type="range" min={min} max={max} step={.5} value={active[name]} onChange={e => update({ [name]: Number(e.target.value) })}/></label>;
  const layerName = (l: EditorLayer) => l.kind === 'logo' ? r.logoName : l.text.trim() ? layerText(l) : l.kind === 'price' ? r.priceName : r.textName;
  return <Shell lang={lang} slug={slug}><main id="main" className="content-width tool-page resize-page text-editor-page">
    <nav className="breadcrumbs"><Link to="/$lang" params={{ lang }}>{c.home}</Link><ChevronRight size={13}/><span>{tool.titles[langIndex(lang)]}</span></nav>
    <div className="tool-page-heading"><ToolIcon tool={tool}/><div><h1>{tool.titles[langIndex(lang)]}</h1><p>{tool.descriptions[langIndex(lang)]}</p></div></div>
    <div className="phase-notice"><ShieldCheck size={18}/><p>{r.local}</p></div>
    <div className="workspace"><div className="workspace-main">
      <section className="upload-area" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); void load(e.dataTransfer.files[0], 'photo'); }}><ImagePlus size={32}/><h2>{c.upload}</h2><p>{c.drop}</p>
        <input ref={photoInput} type="file" className="sr-only" aria-label={c.choose} accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" disabled={loading || busy} onChange={e => { void load(e.target.files?.[0], 'photo'); e.target.value = ''; }}/>
        <Button size="lg" disabled={loading || busy} onClick={() => photoInput.current?.click()}>{loading ? <LoaderCircle className="animate-spin"/> : <ImagePlus/>}{source ? r.another : c.choose}</Button><small>{r.formats}</small>
      </section>
      {pending && <ReducePrompt offer={pending.offer} lang={lang} onCancel={() => setPending(undefined)} onReduce={() => void load(pending.offer.file, pending.kind, pending.offer.reduced, pending.replace, pending.preserve)}/>}
      <section className="preview-section"><h2>{r.preview}</h2>
        <div className="editor-toolbar"><Button variant="outline" disabled={!source || loading || busy} onClick={() => add('text')}><Type/>{r.addText}</Button><Button variant="outline" disabled={!source || loading || busy} onClick={() => add('price')}><BadgeDollarSign/>{r.addPrice}</Button><Button variant="outline" disabled={!source || loading || busy} onClick={() => { replace.current = undefined; logoInput.current?.click(); }}><Stamp/>{r.addLogo}</Button>
          {iconButton(r.undo, <Undo2/>, () => setHistory(undoLayers), !history.past.length || busy || loading)}{iconButton(r.redo, <Redo2/>, () => setHistory(redoLayers), !history.future.length || busy || loading)}</div>
        <input ref={logoInput} type="file" className="sr-only" aria-label={r.logoUpload} accept="image/png,image/webp,.png,.webp" onChange={e => { void load(e.target.files?.[0], 'logo', undefined, replace.current); e.target.value = ''; }}/>
        <div className="editor-stage">{source ? <canvas ref={canvas} aria-label={r.preview} tabIndex={0} onPointerDown={down} onPointerMove={move} onPointerUp={() => finish()} onPointerCancel={() => finish(true)} onLostPointerCapture={() => finish()} onKeyDown={e => { if (!active || busy || loading) return; const directions: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }; const direction = directions[e.key]; if (direction) { e.preventDefault(); update({ x: clamp(active.x + direction[0], 0, 100), y: clamp(active.y + direction[1], 0, 100) }); } }}/> : <div className="resize-empty"><Type size={40}/><p>{r.empty}</p></div>}</div>
        {source && <><ResolutionNote source={source} lang={lang}/><p className="resize-filename">{source.file.name}</p></>}
        <p role="status" aria-live="polite" className="editor-status settings-hint">{loading || busy ? r.processing : '\u00a0'}</p>
      </section>
    </div><aside className="settings-panel"><h2>{r.layers}</h2>
      <div className="editor-layers" role="listbox" aria-label={r.layers}>{layers.length ? [...layers].reverse().map(l => <Button key={l.id} role="option" aria-selected={selected === l.id} variant={selected === l.id ? 'default' : 'outline'} disabled={busy || loading} onClick={() => setSelected(l.id)}>{l.kind === 'logo' ? <Stamp/> : l.kind === 'price' ? <BadgeDollarSign/> : <Type/>}<span>{layerName(l)}</span></Button>) : <p className="settings-hint">{r.noLayers}</p>}</div>
      <fieldset className="resize-fields" disabled={!source || busy || loading}>
        {active && <><div className="editor-toolbar">{iconButton(r.front, <BringToFront/>, () => change(reorderLayer(layers, active.id, 'front')))}{iconButton(r.back, <SendToBack/>, () => change(reorderLayer(layers, active.id, 'back')))}{iconButton(r.duplicate, <Copy/>, () => { const nextId = id(); const next = duplicateLayer(layers, active.id, nextId); change(next); if (next !== layers) setSelected(nextId); else setError('limit'); })}{iconButton(r.remove, <Trash2/>, () => { change(layers.filter(l => l.id !== active.id)); setSelected(undefined); })}</div>
          {active.kind === 'logo' ? <Button variant="outline" className="resize-restore" onClick={() => { replace.current = active.id; logoInput.current?.click(); }}><ImagePlus/>{r.replaceLogo}</Button> : <>
            <label className="setting-field"><span>{active.kind === 'price' ? r.value : r.content}</span><textarea aria-label={active.kind === 'price' ? r.value : r.content} value={active.text} maxLength={500} rows={3} onChange={e => update({ text: e.target.value })}/></label>
            {active.kind === 'price' && <><label className="setting-field"><span>{r.currency}</span><select aria-label={r.currency} value={active.currency} onChange={e => update({ currency: e.target.value as EditorLayer['currency'] })}>{currencies.map(value => <option key={value}>{value}</option>)}</select></label><div className="editor-toolbar" role="group" aria-label={r.presentation}><Button variant={active.tag ? 'outline' : 'default'} aria-pressed={!active.tag} onClick={() => update({ tag: false })}>{r.simple}</Button><Button variant={active.tag ? 'default' : 'outline'} aria-pressed={active.tag} onClick={() => update({ tag: true })}>{r.tag}</Button></div>{active.tag && <label className="setting-field"><span>{r.tagColor}</span><input type="color" aria-label={r.tagColor} value={active.tagColor} onChange={e => update({ tagColor: e.target.value })}/></label>}</>}
            <label className="setting-field"><span>{r.font}</span><select aria-label={r.font} value={active.font} onChange={e => update({ font: e.target.value })}>{editorFonts.map(f => <option key={f}>{f}</option>)}</select></label>
            <div className="editor-toolbar"><Button variant={active.bold ? 'default' : 'outline'} size="icon" title={r.bold} aria-label={r.bold} aria-pressed={active.bold} onClick={() => update({ bold: !active.bold })}><Bold/></Button><Button variant={active.italic ? 'default' : 'outline'} size="icon" title={r.italic} aria-label={r.italic} aria-pressed={active.italic} onClick={() => update({ italic: !active.italic })}><Italic/></Button></div>
            <label className="setting-field"><span>{r.color}</span><input type="color" aria-label={r.color} value={active.color} onChange={e => update({ color: e.target.value })}/></label>
          </>}
          {slider('size', r.size, .5, 100)}{slider('opacity', r.opacity, 0, 100)}{slider('x', r.horizontal, 0, 100)}{slider('y', r.vertical, 0, 100)}
        </>}
        <label className="setting-field"><span>{c.output}</span><select aria-label={c.output} value={format} onChange={e => { setError(undefined); setFormat(e.target.value as ImageFormat); }}><option value="image/png">PNG</option><option value="image/jpeg">JPG</option><option value="image/webp">WebP</option></select></label>
        {format !== 'image/png' && <label className="setting-field"><span>{r.quality}<small>{quality}%</small></span><input aria-label={r.quality} type="range" min={1} max={100} value={quality} onChange={e => setQuality(Number(e.target.value))}/></label>}
      </fieldset><p className="settings-hint">{r.jpg}</p>{error && <p className="resize-error" role="alert">{r[error]}</p>}
      <Button className="resize-download mt-5" variant="outline" disabled={!source || loading || busy || !!pending} onClick={() => void prepare()}>{busy ? <LoaderCircle className="animate-spin"/> : <Wand2/>}{busy ? r.processing : r.prepare}</Button>
      <FileSaving lang={lang} result={current} filename={editorFilename(source?.file.name ?? 'image', format)} title={c.export} label={r.download} processing={r.processing} busy={busy || loading} disabled={!current || !!pending || !!error} mode="auto"/>
    </aside></div><ReservedSpace lang={lang}/>
  </main></Shell>;
}