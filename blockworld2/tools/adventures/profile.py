import json,pathlib,time
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2]
with sync_playwright()as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 c=b.new_context(viewport={'width':1280,'height':800},has_touch=True,is_mobile=True,device_scale_factor=1)
 page=c.new_page();start=time.monotonic();page.goto('http://127.0.0.1:5175/adventures.html?test=1');page.wait_for_function('window.adventure?.ready',timeout=60000);page.locator('#enter').click()
 initial=page.evaluate("""()=>{const g=adventure.game,gl=g.renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info'),textures=new Map();for(const root of [...g.library.models.values(),g.actor])root.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])for(const k of ['map','normalMap','roughnessMap','metalnessMap','emissiveMap']){const t=m[k];if(t&&t.image)textures.set(t.uuid,{name:t.name,width:t.image.width,height:t.image.height});}});const values=[...textures.values()];return{renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),textures:values,estimatedAssetTextureRGBA8Bytes:values.reduce((n,t)=>n+t.width*t.height*4*4/3,0),resources:performance.getEntriesByType('resource').map(r=>({name:r.name.split('/').pop(),encodedBytes:r.encodedBodySize}))};}""")
 result={'environment':'Managed Chromium software rendering, 1280x800 touch emulation, DPR1. This is not a physical Lenovo or iPhone benchmark. Frame samples include browser/automation scheduling and cannot predict hardware FPS.','readyMs':round((time.monotonic()-start)*1000),'assets':initial,'samples':[]}
 for quality in ['gentle','balanced']:
  page.evaluate('(q)=>adventure.game.setQuality(q)',quality);page.wait_for_timeout(1000);page.evaluate('adventure.game.fpsSamples=[]')
  page.wait_for_timeout(6000);result['samples'].append(page.evaluate('adventure.stats()'))
 (ROOT/'docs/adventures-v1/profile.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2));b.close()
