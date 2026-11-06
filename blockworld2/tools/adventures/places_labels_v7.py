"""Phone/tablet saved-record edition labels and long imported names remain usable."""
import pathlib,json,argparse
from playwright.sync_api import sync_playwright
OUT=pathlib.Path(__file__).resolve().parents[2]/'docs/adventures-v7';parser=argparse.ArgumentParser();parser.add_argument('--phase',choices=['before','after'],required=True);a=parser.parse_args();result={'phase':a.phase,'checks':[],'environment':'Managed Chromium touch viewport emulation; isolated records/long imported-name fixture, no physical-device result.'}
def check(name,ok,detail=None):
 result['checks'].append({'name':name,'passed':bool(ok),'detail':detail});(OUT/f'places-labels-{a.phase}.json').write_text(json.dumps(result,indent=2)+'\n');print('PASS'if ok else'REPRODUCED',name,detail or '',flush=True)
 if a.phase=='after':assert ok,name
with sync_playwright()as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for name,size in [('phone',{'width':390,'height':844}),('phone-landscape',{'width':844,'height':390}),('tablet',{'width':1024,'height':768})]:
  g=b.new_page(viewport=size,has_touch=True,is_mobile=True);g.set_default_timeout(120000);g.add_init_script("localStorage.setItem('blockworld-adventures-controls-v2',JSON.stringify({quality:'gentle'}))");g.goto('http://127.0.0.1:5175/adventures.html?test=1');g.wait_for_function('window.adventure?.ready');g.locator('#enter').click();old_id=g.evaluate('async()=>{const s=adventure.game.snapshot();s.world.adventure.layout=4;return(await adventure.session.store.create("W".repeat(60),s)).id}');g.locator('#places').click();g.locator('.newPlaces').evaluate('(e)=>e.open=true');g.screenshot(path=str(OUT/'screenshots'/f'places-{name}-{a.phase}.png'));bounds=g.locator('#modal section').evaluate('(e)=>({width:e.clientWidth,scroll:e.scrollWidth,buttons:[...e.querySelectorAll("#savedRows button")].map(b=>({text:b.textContent,left:b.getBoundingClientRect().left,right:b.getBoundingClientRect().right}))})');check(name+' long saved names and edition labels stay within the modal',bounds['scroll']<=bounds['width']+1,bounds);check(name+' saved rows distinguish Alderwick from retained earlier scenery',g.evaluate('Array.from(document.querySelectorAll("#savedRows button")).some(b=>b.textContent.includes("Alderwick"))&&Array.from(document.querySelectorAll("#savedRows button")).some(b=>b.textContent.includes("earlier scenery"))'))
  if a.phase=='after':
   g.locator('#savedRows button').filter(has_text='W'*60).click();g.wait_for_function('!adventure.game.busy');check(name+' retained record remains selectable with unchanged layout',g.evaluate('(id)=>adventure.session.current.id===id&&adventure.game.data.layout===4&&!adventure.game.landscape.landmarks.some(l=>l.id==="alderwick")',old_id))
  g.close()
 b.close()
