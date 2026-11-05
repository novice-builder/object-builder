"""Single-context, fixed-view submission counters. No physical-device FPS claim."""
import argparse,json,pathlib,subprocess,hashlib
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2];OUT=ROOT/'docs/adventures-v3';a=argparse.ArgumentParser();a.add_argument('--phase',required=True);args=a.parse_args();result={'phase':args.phase,'repositoryHead':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'environment':'Managed Chromium ANGLE SwiftShader. Fixed camera render submission counters and CPU wall time, not hardware FPS. Main animation loop stopped for isolated explicit renders.','views':{}}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']);g=b.new_page(viewport={'width':1280,'height':800});g.set_default_timeout(120000);g.goto('http://127.0.0.1:5175/adventures.html?test=1');g.wait_for_function('window.adventure?.ready');g.locator('#enter').click();g.evaluate("window.requestAnimationFrame=()=>0;adventure.game.setQuality('gentle')");g.wait_for_timeout(500)
 for name in ['centre','woodland','road','hamlet']:
  g.evaluate('(name)=>adventure.view(name)',name)
  row=g.evaluate("""()=>{const g=adventure.game,trials=[];for(let i=0;i<5;i++){const start=performance.now();g.renderer.render(g.scene,g.camera);trials.push(performance.now()-start);}let bytes=0;const seen=new Set();g.scene.traverse(o=>{if(o.geometry&&!seen.has(o.geometry.uuid)){seen.add(o.geometry.uuid);for(const a of Object.values(o.geometry.attributes))bytes+=a.array.byteLength;if(o.geometry.index)bytes+=o.geometry.index.array.byteLength;}});return{...g.stats(),submissionCpuMs:trials,sceneGeometryBufferBytes:bytes};}""");result['views'][name]=row;g.screenshot(path=str(OUT/'screenshots'/f'cost-{name}-{args.phase}.png'));print(name,row,flush=True)
 result['renderer']=g.evaluate("{const gl=adventure.game.renderer.getContext(),e=gl.getExtension('WEBGL_debug_renderer_info');e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):'unknown'}");b.close()
result['sourceFileHashes']={str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in (ROOT/'src/adventures').glob('*.ts')}
(OUT/f'profile-{args.phase}.json').write_text(json.dumps(result,indent=2)+'\n')
