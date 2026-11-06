"""Generate catalogue PNGs by rendering the actual licensed GLBs in the game renderer."""
import pathlib,json,base64,hashlib
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2];OUT=ROOT/'public/adventures/thumbnails';OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright()as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 page=browser.new_page();page.set_default_timeout(60000);page.goto('http://127.0.0.1:5175/adventures.html?test=1');page.wait_for_function('window.adventure?.ready')
 choices=['furniture-bedsingle','furniture-cabinetbed'];inventory={'furniture-'+a['id']:a for a in json.loads((ROOT/'public/adventures/inventory-v10.json').read_text())['assets']};manifest=[]
 for asset in choices:
  data=page.evaluate('(id)=>adventure.thumbnail(id)',asset);assert data.startswith('data:image/png;base64,');png=base64.b64decode(data.split(',',1)[1]);file=OUT/(asset+'.png');assert not file.exists(),'Never overwrite previous thumbnails';file.write_bytes(png)
  manifest.append({'asset':asset,'file':file.name,'sha256':hashlib.sha256(png).hexdigest(),'bytes':len(png),'sourceModelSha256':inventory[asset]['sha256'],'width':256,'height':192,'licence':'CC0-1.0'})
 browser.close()
(OUT/'manifest-v10.json').write_text(json.dumps({'generator':'Actual GLB render via renderCatalogueThumbnail; no remote image service','entries':manifest},indent=2)+'\n');print('Generated',len(manifest),'catalogue thumbnails,',sum(e['bytes']for e in manifest),'bytes')
