from playwright.sync_api import sync_playwright
import json,pathlib
with sync_playwright()as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 page=b.new_page(viewport={'width':1000,'height':700});errors=[];bad=[];external=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('response',lambda r:bad.append(r.url)if r.status>=400 else None)
 page.on('request',lambda r:external.append(r.url)if r.url.startswith(('http://','https://')) and not r.url.startswith('http://127.0.0.1:5176/') else None)
 page.goto('http://127.0.0.1:5176/adventures.html?test=1');page.wait_for_function('window.adventure?.ready',timeout=60000);page.locator('#enter').click();page.evaluate("adventure.game.setQuality('gentle')");assert page.locator('#placeName').inner_text()=='Willowmere';page.locator('#places').click();page.locator('[data-scene="woodland"]').click();page.wait_for_function("adventure.game.data.scene==='woodland'&&!adventure.game.busy");assert page.locator('#placeName').inner_text()=='Whispering Wood'
 page.goto('http://127.0.0.1:5176/gallery.html');page.locator('img').evaluate_all("imgs=>imgs.forEach(i=>i.loading='eager')");page.wait_for_function("Array.from(document.querySelectorAll('figure img')).every(i=>i.complete&&i.naturalWidth>0)");assert page.locator('figure').count()==12;page.locator('[data-filter="mobile"]').click();assert page.locator('figure:visible').count()==3;page.locator('figure:visible .zoom').first.click();assert page.locator('dialog').is_visible();page.locator('dialog button').click();assert not page.locator('dialog').is_visible();assert not errors,errors;assert not bad,bad;assert not external,external
 result={'archive':'BlockWorld-Adventures-Preview-01.zip','sourceCommit':'5eb28540a788737e660cca559fc2aa8df57d708d','passed':['CRC and per-file manifest hashes','packaged entrypoint loads all models','packaged world switching','12 gallery images resolve','gallery filter and accessible zoom dialog','no runtime errors, missing assets or external requests'],'errors':errors,'missing':bad,'externalRequests':external}
 pathlib.Path('/workspace/work/package-verification.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result));b.close()
