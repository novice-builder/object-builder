"""Consolidate current passing evidence and verify preserved files; no deployment."""
from pathlib import Path
import hashlib, html, json, re, subprocess

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/adventures-v10'
BASE = 'accdf371bc8d768798fc02965c7cfe5a125ccfa3'
phases = ['reedbank.json','compat-checks.json','bridge-surface-aligned.json','render-cost.json','bedrooms.json','bedroom-compat.json','furniture-edit-after.json','bedroom-cost.json']
checks = []
for name in phases:
    phase = json.loads((OUT / name).read_text())
    assert phase['checks'] and all(c['passed'] for c in phase['checks']), name
    checks.extend({**c, 'evidence': name} for c in phase['checks'])
unit = (OUT / 'unit-tests.txt').read_text()
count = re.search(r'ℹ tests (\d+)', unit)
assert count and re.search(r'ℹ pass (\d+)', unit)[1] == count[1]
assert re.search(r'ℹ fail (\d+)', unit)[1] == '0'
protected = []
tree = subprocess.check_output(['git', 'ls-tree', '-rz', BASE], cwd=ROOT.parent)
prefixes = ['blockworld2/artifacts/', 'blockworld2/public/', 'blockworld2/src/persistence/'] + [f'blockworld2/docs/adventures-v{n}/' for n in range(1, 10)]
for entry in tree.split(b'\0'):
    if not entry:
        continue
    meta, raw = entry.split(b'\t', 1)
    name = raw.decode()
    if '/' in name and not any(name.startswith(p) for p in prefixes) and not (name.startswith('blockworld2/src/') and not name.startswith('blockworld2/src/adventures/')):
        continue
    if name == 'blockworld2/public/adventures/PROVENANCE.md':
        original = subprocess.check_output(['git','show',BASE+':'+name],cwd=ROOT.parent)
        assert (ROOT.parent/name).read_bytes().startswith(original), 'Earlier provenance must remain intact'
        continue
    expected = meta.split()[2].decode()
    data = (ROOT.parent / name).read_bytes()
    actual = hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
    assert actual == expected, 'Protected file changed: ' + name
    protected.append({'path': name, 'gitBlob': expected, 'bytes': len(data)})
(OUT / 'preservation.json').write_text(json.dumps({'base': BASE, 'files': protected}, indent=2) + '\n')
gallery = [
 ('reedbank-overview.png','World','Reedbank: a woodland river hamlet, smithy yard, cottages and mill.'),
 ('reedbank-street.png','World','Cottage-scale street and crossing approach, rendered at player height.'),
 ('mill-riverside.png','World','The mill wheel faces the river; its courtyard lane stays clear.'),
 ('north-bridge-walking.png','Bridges','Actual aligned bridge and matching walkable deck, in the continuous valley.'),
 ('reedbank-phone.png','Touch','Phone exploration in the new hamlet with existing uncluttered controls.'),
 ('reedbank-map-phone.png','Maps','Actual world map shows the new settlement and connected northern route.'),
 ('cottage-phone-upper.png','Rooms','Human-scale bedroom above a physically walkable staircase.'),
 ('inn-tablet-upper.png','Rooms','The inn’s guest beds, timber furniture and clear landing.'),
 ('mill-phone-upper.png','Rooms','The enterable mill has a separate upper store room and real stairs.'),
 ('inn-tablet-upper-headboard-before.png','Comparison','Inspection caught reversed headboards; the final guest-room image shows the correction.'),
]
cards = ''.join(f'<figure data-tag="{tag}"><button class="zoom" aria-label="Enlarge {html.escape(caption)}"><img loading="lazy" src="screenshots/{name}" alt="{html.escape(caption)}"></button><figcaption>{html.escape(caption)}</figcaption></figure>' for name, tag, caption in gallery)
page = '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BlockWorld Adventures — Preview 10 evidence</title>
<style>*{box-sizing:border-box}body{margin:0;background:#f5f1e5;color:#24463c;font:16px system-ui}main{max-width:1200px;margin:auto;padding:24px}h1{font:38px Georgia}p{max-width:75ch;line-height:1.55}nav{display:flex;gap:8px;flex-wrap:wrap;margin:24px 0}button,a{font:inherit}nav button,dialog button{border:1px solid #648275;border-radius:20px;padding:10px 18px;background:#fffdf5;color:inherit;min-height:44px}nav button[aria-pressed=true]{background:#24463c;color:#fffdf5}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}figure{margin:0;background:#fffdf5;border:1px solid #dedacb;border-radius:16px;overflow:hidden}figure[hidden]{display:none}.zoom{border:0;padding:0;background:#dae0cd;width:100%;display:block;cursor:zoom-in}figure img{display:block;width:100%;height:320px;object-fit:contain}figcaption{padding:16px;line-height:1.4}dialog{max-width:96vw;max-height:96vh;border:0;background:#f5f1e5;padding:12px;border-radius:12px}dialog img{max-width:90vw;max-height:80vh;display:block}dialog button{margin:8px 0}@media(max-width:650px){main{padding:16px}.grid{grid-template-columns:1fr}h1{font-size:30px}}</style>
<main><small>BLOCKWORLD ADVENTURES · DEVELOPMENT PREVIEW 10</small><h1>Follow the river. Find a place to stay.</h1><p>Actual managed Chromium renders. A riverside hamlet, aligned northern crossing, connected countryside route, bedrooms, enterable mill and safer furniture editing. Retained saves stay intact. Physical Lenovo, iPhone, Safari and Xbox/Bluetooth testing remains unverified.</p><p><a href="adventures.html">Open the local preview</a> · <a href="review/REPORT.md">Development report</a></p><nav aria-label="Filter evidence">''' + ''.join(f'<button aria-pressed="{str(tag=="All").lower()}" data-filter="{tag}">{tag}</button>' for tag in ['All','World','Bridges','Rooms','Maps','Touch','Comparison']) + '</nav><div class="grid">' + cards + '''</div></main><dialog aria-label="Enlarged screenshot"><button>Close</button><img alt=""></dialog><script>
for(const b of document.querySelectorAll('[data-filter]'))b.onclick=()=>{for(const n of document.querySelectorAll('[data-filter]'))n.setAttribute('aria-pressed',String(n===b));for(const f of document.querySelectorAll('figure'))f.hidden=b.dataset.filter!=='All'&&f.dataset.tag!==b.dataset.filter};const d=document.querySelector('dialog');for(const b of document.querySelectorAll('.zoom'))b.onclick=()=>{const i=b.querySelector('img'),large=d.querySelector('img');large.src=i.src;large.alt=i.alt;d.showModal()};d.querySelector('button').onclick=()=>d.close();</script></html>'''
(OUT / 'gallery.html').write_text(page)
digest = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
summary = {'deterministicTests': int(count[1]), 'checks': checks, 'protectedFiles': len(protected), 'verifiedRemoteCheckpoint': BASE, 'physicalDevicesVerified': False, 'newAssets': 2, 'galleryImages': len(gallery), 'runtimeSourceHashes': {str(p.relative_to(ROOT)): digest(p) for p in (ROOT / 'src/adventures').rglob('*') if p.is_file()}, 'runtimeBuildHashes': {str(p.relative_to(ROOT / 'adventures-dist')): digest(p) for p in (ROOT / 'adventures-dist').rglob('*') if p.is_file()}}
(OUT / 'summary.json').write_text(json.dumps(summary, indent=2) + '\n')
print('PASS', summary['deterministicTests'], 'deterministic tests;', len(checks), 'browser checks;', len(protected), 'preserved files;', len(gallery), 'gallery images')
