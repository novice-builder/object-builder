"""Consolidate current passing evidence and verify preserved files; no deployment."""
from pathlib import Path
import hashlib, html, json, re, subprocess

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/adventures-v5'
BASE = '8ad0ddf448e908fd6bde9135f22be6b96a198558'
phases = ['map-targets-after.json', 'touch-release-after.json', 'instance-checks.json', 'roads-after.json']
checks = []
for name in phases:
    phase = json.loads((OUT / name).read_text())
    assert phase['checks'] and all(c['passed'] for c in phase['checks']), name
    checks.extend({**c, 'evidence': name} for c in phase['checks'])
cost = json.loads((OUT / 'instance-cost-after.json').read_text())
for name, view in cost['views'].items():
    assert view['pixelsDifferentFromFullBatches'] == 0, name
    checks.append({'name': name + ' compaction matches full-batch rendered pixels', 'passed': True, 'evidence': 'instance-cost-after.json'})
unit = (OUT / 'unit-tests.txt').read_text()
count = re.search(r'ℹ tests (\d+)', unit)
assert count and re.search(r'ℹ pass (\d+)', unit)[1] == count[1]
assert re.search(r'ℹ fail (\d+)', unit)[1] == '0'
protected = []
tree = subprocess.check_output(['git', 'ls-tree', '-rz', BASE], cwd=ROOT.parent)
prefixes = ['blockworld2/artifacts/', 'blockworld2/public/', 'blockworld2/src/persistence/'] + [f'blockworld2/docs/adventures-v{n}/' for n in range(1, 5)]
for entry in tree.split(b'\0'):
    if not entry:
        continue
    meta, raw = entry.split(b'\t', 1)
    name = raw.decode()
    if '/' in name and not any(name.startswith(p) for p in prefixes):
        continue
    expected = meta.split()[2].decode()
    data = (ROOT.parent / name).read_bytes()
    actual = hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
    assert actual == expected, 'Protected file changed: ' + name
    protected.append({'path': name, 'gitBlob': expected, 'bytes': len(data)})
(OUT / 'preservation.json').write_text(json.dumps({'base': BASE, 'files': protected}, indent=2) + '\n')
gallery = [
    ('instance-centre-after.png', 'World', 'Willowmere market square — premade buildings and connected countryside.'),
    ('instance-woodland-after.png', 'World', 'Whispering Wood — continuous roads, camp and river.'),
    ('instance-campScale-after.png', 'World', 'Standing-height camp tent and woodland cottages.'),
    ('instance-lodge-after.png', 'World', 'Meadow Lodge — existing functional entrance retained.'),
    ('roads-brookside-before.png', 'Comparison', 'Before: Brookside coplanar driveway shimmer (preserved Preview 04).'),
    ('roads-brookside-after.png', 'Comparison', 'After: shared earth texture and stable road priority.'),
    ('roads-street-after.png', 'World', 'Brookside residential street and player scale.'),
    ('map-phone-after.png', 'Maps', '390×844 phone map fit view: measured labels are tappable.'),
    ('map-tablet-after.png', 'Maps', '1024×768 full map generated from actual scene geometry.'),
    ('touch-phone-after.png', 'Touch', 'Phone portrait exploration controls.'),
    ('touch-phone-landscape-after.png', 'Touch', 'Phone landscape controls after touch interruption checks.'),
    ('roads-phone-after.png', 'Touch', 'Phone view of the polished Brookside road junction.'),
]
cards = ''.join(f'<figure data-tag="{tag}"><button class="zoom" aria-label="Enlarge {html.escape(caption)}"><img loading="lazy" src="screenshots/{name}" alt="{html.escape(caption)}"></button><figcaption>{html.escape(caption)}</figcaption></figure>' for name, tag, caption in gallery)
page = '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BlockWorld Adventures — Preview 05 evidence</title>
<style>*{box-sizing:border-box}body{margin:0;background:#f5f1e5;color:#24463c;font:16px system-ui}main{max-width:1200px;margin:auto;padding:24px}h1{font:38px Georgia}p{max-width:75ch;line-height:1.55}nav{display:flex;gap:8px;flex-wrap:wrap;margin:24px 0}button,a{font:inherit}nav button,dialog button{border:1px solid #648275;border-radius:20px;padding:10px 18px;background:#fffdf5;color:inherit;min-height:44px}nav button[aria-pressed=true]{background:#24463c;color:#fffdf5}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}figure{margin:0;background:#fffdf5;border:1px solid #dedacb;border-radius:16px;overflow:hidden}figure[hidden]{display:none}.zoom{border:0;padding:0;background:#dae0cd;width:100%;display:block;cursor:zoom-in}figure img{display:block;width:100%;height:320px;object-fit:contain}figcaption{padding:16px;line-height:1.4}dialog{max-width:96vw;max-height:96vh;border:0;background:#f5f1e5;padding:12px;border-radius:12px}dialog img{max-width:90vw;max-height:80vh;display:block}dialog button{margin:8px 0}@media(max-width:650px){main{padding:16px}.grid{grid-template-columns:1fr}h1{font-size:30px}}</style>
<main><small>BLOCKWORLD ADVENTURES · DEVELOPMENT PREVIEW 05</small><h1>A more comfortable journey through the Vale.</h1><p>Actual managed Chromium renders. Map label targets, interrupted touch handling, conservative scenery culling and Brookside road polish. Physical Lenovo, iPhone, Safari and Xbox/Bluetooth testing remains unverified.</p><p><a href="adventures.html">Open the local preview</a> · <a href="review/REPORT.md">Development report</a></p><nav aria-label="Filter evidence">''' + ''.join(f'<button aria-pressed="{str(tag=="All").lower()}" data-filter="{tag}">{tag}</button>' for tag in ['All','World','Maps','Touch','Comparison']) + '</nav><div class="grid">' + cards + '''</div></main><dialog aria-label="Enlarged screenshot"><button>Close</button><img alt=""></dialog><script>
for(const b of document.querySelectorAll('[data-filter]'))b.onclick=()=>{for(const n of document.querySelectorAll('[data-filter]'))n.setAttribute('aria-pressed',String(n===b));for(const f of document.querySelectorAll('figure'))f.hidden=b.dataset.filter!=='All'&&f.dataset.tag!==b.dataset.filter};const d=document.querySelector('dialog');for(const b of document.querySelectorAll('.zoom'))b.onclick=()=>{const i=b.querySelector('img'),large=d.querySelector('img');large.src=i.src;large.alt=i.alt;d.showModal()};d.querySelector('button').onclick=()=>d.close();</script></html>'''
(OUT / 'gallery.html').write_text(page)
digest = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
summary = {'deterministicTests': int(count[1]), 'checks': checks, 'protectedFiles': len(protected), 'verifiedRemoteCheckpoint': 'd7ef98d786b4ba7bbfdb3b0efef1a5cf8bba1d3b', 'physicalDevicesVerified': False, 'newAssets': 0, 'galleryImages': len(gallery), 'runtimeSourceHashes': {str(p.relative_to(ROOT)): digest(p) for p in (ROOT / 'src/adventures').rglob('*') if p.is_file()}, 'runtimeBuildHashes': {str(p.relative_to(ROOT / 'adventures-dist')): digest(p) for p in (ROOT / 'adventures-dist').rglob('*') if p.is_file()}}
(OUT / 'summary.json').write_text(json.dumps(summary, indent=2) + '\n')
print('PASS', summary['deterministicTests'], 'deterministic tests;', len(checks), 'browser checks;', len(protected), 'preserved files;', len(gallery), 'gallery images')
