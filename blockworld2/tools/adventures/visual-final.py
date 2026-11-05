"""Focused follow-up after the rendered pass: bank-following trail and exposed bridge deck."""
from playwright.sync_api import sync_playwright
import json,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[2];OUT=ROOT/'docs/adventures-v1';j=json.loads((OUT/'qa-results.json').read_text());j['checks']=[c for c in j['checks']if not c['name'].endswith('trails stay on dry banks and the bridge')]
with sync_playwright()as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 page=b.new_page(viewport={'width':1440,'height':900});page.set_default_timeout(60000);page.goto('http://127.0.0.1:5175/adventures.html?test=1');page.wait_for_function('window.adventure?.ready');page.locator('#enter').click()
 for scene in ['village','woodland']:
  page.evaluate('(scene)=>adventure.session.create(scene)',scene)
  bad=page.evaluate("""()=>{const g=adventure.game,bad=[];for(const path of g.landscape.paths)for(let i=1;i<path.points.length;i++){const a=path.points[i-1],b=path.points[i],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*3);for(let k=0;k<=n;k++){const x=a[0]+(b[0]-a[0])*k/n,z=a[1]+(b[1]-a[1])*k/n;if(Math.abs(x-(30+Math.sin(z*.055)*2.5))<2.65&&Math.abs(z-8)>2)bad.push({x,z});}}return bad;}""")
  assert not bad,(scene,bad);j['checks'].append({'name':scene+' trails stay on dry banks and the bridge','passed':True,'detail':{'samplesAtMostMetresApart':1/3}})
  for view,name in ([('bridge','bridge')]if scene=='village'else[('centre','woodland')]):
   page.evaluate('(view)=>adventure.view(view)',view);page.wait_for_timeout(150);page.screenshot(path=str(OUT/'screenshots'/f'{name}.png'))
 b.close()
(OUT/'qa-results.json').write_text(json.dumps(j,indent=2)+'\n');print('PASS final bank-trail scan and bridge/woodland renders')
