"""Validate the extracted immutable Preview-02 package on the local package server."""
import pathlib,json,zipfile,hashlib
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2];OUT=ROOT/'artifacts/adventures-v2';archive=OUT/'BlockWorld-Adventures-Preview-02.zip';result={'archive':archive.name,'checks':[]}
def check(name,value):
 assert value,name;result['checks'].append({'name':name,'passed':True});print('PASS',name,flush=True)
with zipfile.ZipFile(archive)as z:
 check('archive CRC',z.testzip()is None);manifest=json.loads(z.read('BUILD.json'));result['sourceCommit']=manifest['sourceCommit'];result['manifestFiles']=len(manifest['files'])
 check('all build-manifest hashes',all(hashlib.sha256(z.read(n)).hexdigest()==v['sha256']for n,v in manifest['files'].items()))
with sync_playwright()as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']);page=browser.new_page(viewport={'width':1280,'height':800});page.set_default_timeout(60000);errors=[];bad=[];external=[]
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('response',lambda r:bad.append(r.url)if r.status>=400 else None);page.on('request',lambda r:external.append(r.url)if r.url.startswith(('http://','https://'))and not r.url.startswith('http://127.0.0.1:5176/')else None)
 page.goto('http://127.0.0.1:5176/adventures.html?test=1');page.wait_for_function('window.adventure?.ready');page.locator('#enter').click();page.evaluate("adventure.game.setQuality('gentle')");check('packaged game opens Willowmere',page.locator('#placeName').inner_text()=='Willowmere')
 page.locator('#build').click();page.locator('.assetGrid img').evaluate_all("imgs=>imgs.forEach(i=>i.loading='eager')");page.wait_for_function("Array.from(document.querySelectorAll('.assetGrid img')).every(i=>i.complete&&i.naturalWidth===256)");check('all 15 packaged catalogue images load',page.locator('.assetGrid img').count()==15);page.locator('.closeModal').click()
 page.locator('#places').click();page.locator('.newPlaces').evaluate('(e)=>e.open=true');page.locator('[data-new-scene="woodland"]').click();page.wait_for_function("adventure.game.data.scene==='woodland'&&!adventure.game.busy");check('packaged fresh-world UI loads layout 2',page.evaluate('adventure.game.data.layout===2'))
 page.goto('http://127.0.0.1:5176/gallery.html');page.locator('figure img').evaluate_all("imgs=>imgs.forEach(i=>i.loading='eager')");page.wait_for_function("Array.from(document.querySelectorAll('figure img')).every(i=>i.complete&&i.naturalWidth>0)");check('all 16 packaged gallery views load',page.locator('figure').count()==16)
 page.locator('[data-filter="comparison"]').click();check('before-after gallery filter',page.locator('figure:visible').count()==2);page.locator('figure:visible .zoom').first.click();check('gallery zoom opens',page.locator('dialog').is_visible());page.locator('dialog button').click();check('gallery zoom closes',not page.locator('dialog').is_visible());check('no runtime errors, missing files or external requests',not errors and not bad and not external);browser.close()
result['errors']=errors;result['missing']=bad;result['externalRequests']=external;(OUT/'PACKAGE-VERIFICATION.json').write_text(json.dumps(result,indent=2)+'\n');print('CHECKS',len(result['checks']))
