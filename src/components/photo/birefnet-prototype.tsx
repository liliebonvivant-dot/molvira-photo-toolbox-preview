import { useEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ImagePlus, FlaskConical, LoaderCircle, X, Trash2 } from 'lucide-react';
import { Brand } from './brand';
import { Button } from '@/components/ui/button';
import { FileSaving } from './file-saving';
import { inspectImage } from '@/lib/photo/resize';
import { birefnetTarget } from '@/lib/photo/birefnet-math';
import { BiRefnetClient, type BiMetrics } from '@/lib/photo/birefnet-client';
export function BiRefnetPrototype() {
  const client = useRef<BiRefnetClient | undefined>(undefined), abort = useRef<AbortController | undefined>(undefined), input = useRef<HTMLInputElement>(null), generation = useRef(0);
  const urls = useRef<string[]>([]);
  const [source, setSource] = useState<{ file: File; url: string; width: number; height: number }>();
  const [baseline, setBaseline] = useState<string>();
  const [result, setResult] = useState<{ blob: Blob; url: string; key: string }>();
  const [metrics, setMetrics] = useState<BiMetrics>();
  const [busy, setBusy] = useState(false), [reading, setReading] = useState(false), [stage, setStage] = useState(''), [error, setError] = useState(''), [reduce, setReduce] = useState(false);
  useEffect(() => () => { generation.current++; client.current?.dispose(); for (const url of urls.current) URL.revokeObjectURL(url); }, []);
  function url(blob: Blob) { const value = URL.createObjectURL(blob); urls.current.push(value); return value; }
  async function load(file?: File) {
    if (!file || busy || reading) return;
    setReading(true); setError('');
    try {
      const header = await inspectImage(file);
      for (const value of urls.current) URL.revokeObjectURL(value); urls.current = [];
      setSource({ file, url: url(file), width: header.width, height: header.height }); setResult(undefined); setMetrics(undefined); setBaseline(undefined); setReduce(false);
    } catch { setError('Arquivo inválido. Use JPG, PNG ou WebP de até 20 MiB, 50 MP e 12.000 px por lado.'); }
    finally { setReading(false); }
  }
  async function run() {
    if (!source || busy) return;
    const target = birefnetTarget(source.width, source.height);
    if ((target.width !== source.width || target.height !== source.height) && !reduce) return;
    const id = ++generation.current; const controller = new AbortController(); abort.current = controller;
    client.current ??= new BiRefnetClient(); setBusy(true); setError(''); setResult(undefined); setMetrics(undefined);
    try {
      const output = await client.current.run(source.file, target, controller.signal, setStage);
      if (id !== generation.current) return;
      setResult({ blob: output.blob, url: url(output.blob), key: String(id) }); setMetrics(output.metrics); setStage('Pronto para salvar.');
    } catch (e) { if (id === generation.current) setError(`Não foi possível concluir: ${e instanceof Error ? e.message : 'process'}. Você pode tentar novamente ou liberar o modelo.`); }
    finally { if (id === generation.current) setBusy(false); }
  }
  function cancel() { generation.current++; abort.current?.abort(); setBusy(false); setStage('Cancelado.'); }
  const target = source ? birefnetTarget(source.width, source.height) : undefined;
  const needsReduction = !!source && !!target && (target.width !== source.width || target.height !== source.height);
  const stages: Record<string, string> = { download: 'Baixando modelo…', session: 'Preparando modelo…', process: 'Removendo fundo…', encode: 'Gerando PNG…' };
  return <><header className="site-header"><div className="content-width flex flex-wrap items-center justify-between gap-4 py-3"><Brand/><Button variant="outline" asChild><Link to="/$lang" params={{ lang: 'pt' }}>Voltar ao catálogo</Link></Button></div></header>
    <main className="content-width tool-page resize-page background-page">
      <div className="tool-page-heading"><FlaskConical size={32}/><div><h1>BiRefNet-lite · Protótipo</h1><p>MOLVIRA PHOTO — avaliação experimental</p></div></div>
      <div className="phase-notice"><p>Não aprovado para publicação. Fotos permanecem no aparelho. Modelo: 172,27 MiB, baixado somente ao iniciar. Inferência experimental de 512 px; saída de até 2 MP. A ferramenta atual permanece intacta.</p></div>
      <div className="workspace"><div className="workspace-main">
        <section className="upload-area"><ImagePlus size={32}/><h2>Fotografia original</h2><input className="sr-only" ref={input} type="file" accept="image/png,image/jpeg,image/webp" aria-label="Fotografia original" disabled={busy || reading} onChange={e => { void load(e.target.files?.[0]); e.target.value = ''; }}/><Button disabled={busy || reading} onClick={() => input.current?.click()}><ImagePlus/>{reading ? 'Lendo…' : 'Escolher imagem'}</Button></section>
        <div className="background-comparison mt-5">{[{ title: 'Original', image: source?.url }, { title: 'BiRefNet-lite', image: result?.url }, { title: 'Modelo atual · PNG importado', image: baseline }].map(item => <section className="preview-section" key={item.title}><h2>{item.title}</h2><div className="resize-image-frame">{item.image ? <img src={item.image} alt={item.title}/> : <ImagePlus size={32}/>}</div></section>)}</div>
        <label className="setting-field mt-5">PNG da ferramenta atual<input type="file" accept="image/png" aria-label="PNG da ferramenta atual" disabled={busy || reading} onChange={e => { const file = e.target.files?.[0]; if (file) setBaseline(url(file)); }}/></label>
        <p role="status" aria-live="polite" className="background-progress settings-hint">{busy ? stages[stage] ?? stage : stage || '\u00a0'}</p>
      </div><aside className="settings-panel"><h2>Avaliação local</h2>
        {source && target && <div className="settings-hint mt-4"><p>Original: {source.width} × {source.height} px</p><p>Saída: {target.width} × {target.height} px</p>{needsReduction && <label className="flex items-start gap-2 mt-3"><input type="checkbox" checked={reduce} onChange={e => setReduce(e.target.checked)} disabled={busy}/>Aceito esta cópia reduzida para o protótipo.</label>}</div>}
        <Button className="resize-download mt-5" disabled={!source || busy || reading || (needsReduction && !reduce)} onClick={() => void run()}>{busy ? <LoaderCircle className="animate-spin"/> : <FlaskConical/>}Processar com BiRefNet-lite</Button>
        {busy && <Button className="resize-download mt-3" variant="outline" onClick={cancel}><X/>Cancelar</Button>}
        <Button className="resize-download mt-3" variant="outline" disabled={busy} onClick={() => { client.current?.dispose(); client.current = undefined; setStage('Modelo liberado da memória.'); }}><Trash2/>Liberar modelo</Button>
        {error && <p role="alert" className="resize-error">{error}</p>}
        {metrics && <dl className="settings-hint mt-5 break-words" data-testid="metrics">{Object.entries({ 'Modelo': `${(metrics.modelBytes / 1048576).toFixed(2)} MiB`, 'Download nesta execução': metrics.reused ? '0 B · sessão reutilizada' : `${(metrics.downloadMs / 1000).toFixed(2)} s`, 'Preparação': `${(metrics.sessionMs / 1000).toFixed(2)} s`, 'Inferência': `${(metrics.inferenceMs / 1000).toFixed(2)} s`, 'Total': `${(metrics.totalMs / 1000).toFixed(2)} s`, 'Pico JS observado': metrics.heapPeak ? `${(metrics.heapPeak / 1048576).toFixed(1)} MiB · não é memória total` : 'Não disponível neste navegador', 'Tensores de entrada/saída': `${(metrics.tensorBytes / 1048576).toFixed(1)} MiB · exclui modelo e intermediários` }).map(([k, v]) => <div className="mt-2" key={k}><dt className="font-semibold">{k}</dt><dd>{v}</dd></div>)}</dl>}
        <FileSaving lang="pt" result={result} filename={`${source?.file.name.replace(/\.[^.]+$/, '') ?? 'image'}-birefnet.png`} title="PNG transparente" label="Salvar PNG" processing="Processando…" busy={busy || reading} disabled={!result} mode="auto"/>
      </aside></div>
      <section className="mt-6 settings-hint"><h2>Origem e licenças</h2><p>BiRefNet-lite: MIT · ONNX Runtime Web 1.31.1: MIT. Revisão oficial aa62cd87eafb9cc43056d08ef3615a14628b831d; exportação própria FP32, ONNX opset 22, entrada 512 × 512, sem retreinamento. Revisão dos direitos de treinamento e validação em aparelhos físicos permanecem pendentes.</p><div className="flex flex-wrap gap-4 mt-3"><a className="text-primary underline" href="https://huggingface.co/ZhengPeng7/BiRefNet/discussions/23" target="_blank" rel="noreferrer">Autorização dos pesos</a><a className="text-primary underline" href="/experimental/birefnet/BiRefNet-LICENSE.txt">Licença BiRefNet</a><a className="text-primary underline" href="/experimental/birefnet/ONNX-RUNTIME-LICENSE.txt">Licença ONNX Runtime</a></div></section>
    </main></>;
}