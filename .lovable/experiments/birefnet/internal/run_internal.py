import asyncio,json,time,os
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path('/dev-server'); OUT=Path('/tmp/browser/birefnet-internal'); TMP=Path('/tmp/birefnet-internal')
FILES={
 'worker.mjs':ROOT/'.lovable/experiments/birefnet/internal/worker.mjs',
 'geometry.mjs':ROOT/'.lovable/experiments/birefnet/internal/geometry.mjs',
 'math.mjs':TMP/'math.mjs','matte.mjs':TMP/'matte.mjs',
 'ort.mjs':ROOT/'node_modules/ort-birefnet/dist/ort.wasm.bundle.min.mjs',
 'runtime.mjs':ROOT/'node_modules/ort-birefnet/dist/ort-wasm-simd-threaded.mjs',
 'runtime.wasm':ROOT/'node_modules/ort-birefnet/dist/ort-wasm-simd-threaded.wasm',
 'model.onnx':TMP/'model.onnx'}
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True)
  context=await browser.new_context(viewport={'width':1280,'height':1800})
  page=await context.new_page(); errors=[]; requests=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on("requestfailed",lambda r:print("request_failed",r.url,r.failure))
  page.on("console",lambda m:print("console_error",m.text) if m.type=="error" else None)
  async def intercept(route):
   name=route.request.url.split('/')[-1]; path=FILES.get(name)
   if name=="model.onnx":
    requests.append(name);await route.continue_(url="http://localhost:8765/model.onnx");return
   if path:
    requests.append(name)
    await route.fulfill(path=str(path),content_type='application/wasm' if name.endswith('.wasm') else 'application/octet-stream' if name.endswith('.onnx') else 'text/javascript')
   else: await route.abort()
  await context.route('**/__internal-birefnet/**',intercept)
  await page.goto('http://localhost:8080/en',wait_until='networkidle')
  await page.screenshot(path=str(OUT/'normal-home.png'))
  print('normal_home_experimental_requests',requests)
  # No app route: the worker runs in an isolated loopback document through interception only.
  await page.goto("http://localhost:8765/internal.html")
  await page.evaluate('''() => {
   window.biStages=[]; window.biWorker=new Worker('/__internal-birefnet/worker.mjs',{type:'module'});
   window.biWorker.onerror=(e)=>{window.biFailure=e.message;};
   window.runBi=(w,h)=>new Promise((resolve)=>{
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
    const ctx=canvas.getContext('2d'); ctx.fillStyle='rgb(235,235,235)';ctx.fillRect(0,0,w,h);
    ctx.fillStyle='rgb(30,155,75)';ctx.fillRect(w*.3,h*.15,w*.4,h*.7);
    const rgba=ctx.getImageData(0,0,w,h).data;
    window.biWorker.onmessage=async({data})=>{
     if(data.stage){window.biStages.push(data.stage);return;}
     if(data.blob){const b=await createImageBitmap(data.blob);const c=document.createElement('canvas');c.width=b.width;c.height=b.height;
      const x=c.getContext('2d');x.drawImage(b,0,0);const a=x.getImageData(0,0,c.width,c.height).data;
      let min=255,max=0,partial=0;for(let i=3;i<a.length;i+=4){min=Math.min(min,a[i]);max=Math.max(max,a[i]);if(a[i]>0&&a[i]<255)partial++;}
      data.alpha={min,max,partial};data.png=c.toDataURL('image/png');b.close();
     }resolve(data);
    };window.biWorker.postMessage({width:w,height:h,rgba:rgba.buffer},[rgba.buffer]);
   });
  }''')
  # Oversized dimensions fail before any model request, no actual 48 MP allocation.
  guard=await page.evaluate('''() => new Promise(resolve=>{window.biWorker.onmessage=({data})=>resolve(data);window.biWorker.postMessage({width:8064,height:6048,rgba:new ArrayBuffer(0)});})''')
  print('size_guard',guard,'requests',requests)
  max_rss=0; stop=False
  async def sample():
   nonlocal max_rss
   while not stop:
    total=0
    for d in Path('/proc').iterdir():
     if not d.name.isdigit():continue
     try:
      cmd=(d/'cmdline').read_bytes()
      if b'--type=renderer' not in cmd or b'chrom' not in cmd:continue
      for l in (d/'status').read_text().splitlines():
       if l.startswith('VmRSS:'):total+=int(l.split()[1])*1024
     except (OSError,ValueError):pass
    max_rss=max(max_rss,total);await asyncio.sleep(.25)
  sampler=asyncio.create_task(sample())
  result=await asyncio.wait_for(page.evaluate('() => window.runBi(768,512)'),timeout=180)
  stop=True;await sampler
  png=result.pop('png',None)
  if png:
   import base64
   (OUT/'synthetic-output.png').write_bytes(base64.b64decode(png.split(',')[1]))
  result['renderer_rss_sum_peak_bytes']=max_rss
  result['stages']=await page.evaluate('window.biStages');result['requests']=requests.copy();result['page_errors']=errors
  print('internal_result',json.dumps(result));(OUT/'result.json').write_text(json.dumps(result,indent=2))
  second=await asyncio.wait_for(page.evaluate('() => window.runBi(512,768)'),timeout=90)
  second.pop('png',None)
  print('portrait_reuse',json.dumps(second));(OUT/'portrait-result.json').write_text(json.dumps(second,indent=2))
  assert second.get('metrics',{}).get('reused') is True
  assert requests.count('model.onnx')==1
  await page.evaluate('window.biWorker.terminate()')
  normal_requests=[]
  page.on('request',lambda r:normal_requests.append(r.url))
  await page.goto('http://localhost:8080/en',wait_until='networkidle')
  urls=await page.locator('a.tool-card').evaluate_all('(els)=>els.map(e=>e.href)')
  if not urls:
   urls=await page.locator('a').evaluate_all('(els)=>[...new Set(els.map(e=>e.href).filter(u=>/localhost:8080\/en\//.test(u)&&!/about|contact|privacy|terms|cookies/.test(u)))]')
  checked=[]
  for url in urls:
   response=await page.goto(url,wait_until='networkidle');checked.append({'url':url,'status':response.status})
  await page.set_viewport_size({'width':491,'height':967})
  await page.goto('http://localhost:8080/en',wait_until='networkidle')
  await page.screenshot(path=str(OUT/'mobile-home.png'))
  denied=await page.request.get('http://localhost:8080/experimental/birefnet')
  internal_denied=await page.request.get('http://localhost:8080/__internal-birefnet/worker.mjs')
  experimental=[u for u in normal_requests if any(t in u for t in ['birefnet','ort-birefnet','experimental'])]
  summary={'pages':checked,'normal_experimental_requests':experimental,'experimental_status':denied.status,'internal_harness_status':internal_denied.status,'page_errors':errors}
  print('preservation',json.dumps(summary));(OUT/'preservation.json').write_text(json.dumps(summary,indent=2))
  await page.screenshot(path=str(OUT/'home-after-internal.png'))
  await browser.close()
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
import threading
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**k):super().__init__(*a,directory=str(TMP),**k)
 def end_headers(self):self.send_header("Access-Control-Allow-Origin","*");super().end_headers()
 def log_message(self,*a):pass
server=ThreadingHTTPServer(("127.0.0.1",8765),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
try:asyncio.run(main())
finally:server.shutdown()
