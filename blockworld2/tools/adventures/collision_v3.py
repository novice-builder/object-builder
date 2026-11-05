"""Rendered/collision regression checks for cached footprints and close-range camera movement."""
import pathlib,json
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2];OUT=ROOT/'docs/adventures-v3';result={'checks':[]}
def check(name,value,detail=None):
 assert value,(name,detail);result['checks'].append({'name':name,'passed':True,'detail':detail});print('PASS',name,flush=True)
with sync_playwright()as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']);page=b.new_page(viewport={'width':1280,'height':800});page.set_default_timeout(60000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://127.0.0.1:5175/adventures.html?test=1');page.wait_for_function('window.adventure?.ready');page.locator('#enter').click();page.evaluate("adventure.game.setQuality('gentle')")
 check('unchanged collision queries reuse one view',page.evaluate('adventure.game.obstacles()===adventure.game.obstacles()'))
 page.evaluate("adventure.session.create('meadow')");page.evaluate("{const s=adventure.snapshot();s.world.adventure.layout=2;adventure.game.apply(s);}")
 move=page.evaluate("""()=>{const g=adventure.game;g.data.objects=[{id:'a',asset:'wheelbarrow',x:10,z:20,yaw:0,scale:4},{id:'b',asset:'barrel',x:15,z:22,yaw:0,scale:4}];g.renderObjects();const before=g.obstacles(),oldX=before.find(b=>b.ownerId==='a').minX;g.data.objects[0].x=25;g.renderObjects();const after=g.obstacles();return{changed:before!==after,newX:after.find(b=>b.ownerId==='a').minX,oldX,retiredStable:before.find(b=>b.ownerId==='a').minX===oldX};}""")
 check('object edits replace footprints and retain retired views safely',move['changed'] and move['newX']>24 and move['retiredStable'],move)
 exclusion=page.evaluate("""()=>{const g=adventure.game;g.moving='a';const moving=g.obstacles(),stable=moving===g.obstacles();g.cancelEdit();return{stable,excluded:!moving.some(b=>b.ownerId==='a'),retained:moving.some(b=>b.ownerId==='b'),restored:g.obstacles().some(b=>b.ownerId==='a')};}""")
 check('move exclusion is cached and restored on cancel',all(exclusion.values()),exclusion)
 rotation=page.evaluate("""()=>{const g=adventure.game,p=g.data.objects[0];g.selection=p.id;g.refreshSelection();const before=g.obstacles().find(b=>b.ownerId===p.id).minX;document.getElementById('editRotate').click();return{yaw:p.yaw,minX:g.obstacles().find(b=>b.ownerId===p.id).minX,before};}""")
 check('successful rotation refreshes the collision cache',abs(rotation['yaw']-.7853981634)<.0001 and abs(rotation['minX']-rotation['before'])>.01,rotation)
 page.evaluate("adventure.session.create('woodland')");check('world switching drops all previous user footprints',page.evaluate('!adventure.game.obstacles().some(b=>b.ownerId)'))
 page.evaluate("adventure.session.create('village')")
 near=page.evaluate("""()=>{const g=adventure.game;Object.assign(g.player,{x:0,z:-17.2,y:0});g.cameraYaw=Math.PI;g.cameraPosition.set(0,0,0);g.cameraUpdate(1/60);g.debugCamera=true;g.renderer.render(g.scene,g.camera);return{z:g.camera.position.z,distance:g.camera.position.distanceTo(g.actor.position),visible:g.actor.visible};}""")
 check('camera remains outside the inn at close walking distance',near['z']>-17.4078,near);page.screenshot(path=str(OUT/'screenshots/camera-close-wall.png'))
 corner=page.evaluate("""()=>{const g=adventure.game;g.debugCamera=false;Object.assign(g.player,{x:-5.2,z:-16.8,y:0});g.cameraYaw=-Math.PI/2;g.cameraPosition.set(6,4,-19);g.cameraUpdate(1/60);const c=g.camera.position;return{camera:{x:c.x,y:c.y,z:c.z},inside:g.obstacles().some(b=>c.x>b.minX&&c.x<b.maxX&&c.z>b.minZ&&c.z<b.maxZ&&c.y<b.height)};}""")
 check('camera interpolation cannot cut through a building corner',not corner['inside'],corner)
 check('collision pass has no runtime errors',not errors,errors);b.close()
(OUT/'collision-checks.json').write_text(json.dumps(result,indent=2)+'\n');print('CHECKS',len(result['checks']))
