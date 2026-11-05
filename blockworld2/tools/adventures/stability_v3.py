"""Batch source equivalence and repeated combined-world GPU resource probe."""
import json,pathlib
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2];OUT=ROOT/'docs/adventures-v3';result={'checks':[],'environment':'Managed Chromium SwiftShader; limited repeatability probe, not a physical-device soak test.'}
def check(name,ok,detail=None):
 result['checks'].append({'name':name,'passed':bool(ok),'detail':detail});(OUT/'stability-checks.json').write_text(json.dumps(result,indent=2)+'\n');print('PASS' if ok else 'FAIL',name,detail or '',flush=True);assert ok,name
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']);g=b.new_page(viewport={'width':640,'height':400});g.set_default_timeout(120000);errors=[];g.on('pageerror',lambda e:errors.append(str(e)));g.add_init_script("localStorage.setItem('blockworld-adventures-controls-v2',JSON.stringify({quality:'gentle',running:false}))");g.goto('http://127.0.0.1:5175/adventures.html?test=1');g.wait_for_function('window.adventure?.ready');g.locator('#enter').click();g.evaluate('window.requestAnimationFrame=()=>0');g.wait_for_timeout(100)
 equiv=g.evaluate("""()=>{const lib=adventure.game.library,bad=[];for(const [id,baked] of lib.batchSources){const source=lib.models.get(id);if(source===baked)continue;const signature=root=>{root.updateMatrixWorld(true);let triangles=0;const points=[];root.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.getAttribute('position'),ix=o.geometry.index;triangles+=(ix?ix.count:p.count)/3;for(let i=0;i<p.count;i++){const v=new o.position.constructor(p.getX(i),p.getY(i),p.getZ(i)).applyMatrix4(o.matrixWorld);points.push(v.x,v.y,v.z);}});return{triangles,points};};const a=signature(source),b=signature(baked);let delta=0;if(a.points.length===b.points.length)for(let i=0;i<a.points.length;i++)delta=Math.max(delta,Math.abs(a.points[i]-b.points[i]));else delta=Infinity;if(a.triangles!==b.triangles||delta>1e-5)bad.push({id,a:a.triangles,b:b.triangles,delta});}return{models:lib.batchSources.size,bad};}""");check('real batched models retain all transformed vertices and triangles',not equiv['bad'] and equiv['models']>=8,equiv)
 # Every fully hidden static bound is beyond the fog range; near meshes must stay visible.
 fog=g.evaluate("""()=>{const g=adventure.game,l=g.landscape;g.qaView('road');return l.visibility.filter(({mesh,sphere})=>!mesh.visible&&sphere.center.distanceTo(g.camera.position)-sphere.radius<149.99).length;}""");check('culling hides only fully fogged static bounds',fog==0,fog)
 samples=[]
 for i,scene in enumerate(['vale','woodland','vale','meadow','vale','village']*4):
  g.evaluate('(scene)=>adventure.session.create(scene)',scene);g.evaluate("adventure.view('centre')");samples.append({'switch':i+1,**g.evaluate('adventure.stats()')})
 result['switches']=samples
 vals=[s for s in samples if s['scene']=='vale'];warm=[s for s in vals if s['switch']>6];result['warmup']='Original and baked asset buffers become resident during the first full template cycle. Compare the plateau after that cycle, retaining all raw counts.';check('24 world replacements plateau after one template warmup cycle',max(s['geometries'] for s in warm)==min(s['geometries'] for s in warm) and max(s['textures'] for s in vals)<=16,[(s['switch'],s['geometries'],s['textures'])for s in vals])
 check('each repeat keeps a valid native save and independent records',g.evaluate("adventure.session.store.list().then(r=>r.length===25&&adventure.game.snapshot().schema===3)"))
 check('repeated replacement and batching have no runtime errors',not errors,errors);b.close()
(OUT/'stability-checks.json').write_text(json.dumps(result,indent=2)+'\n')
