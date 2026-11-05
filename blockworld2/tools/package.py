"""Package a CLEAN built commit. Refuse overwriting any previous package folder."""
from pathlib import Path
import sys,json,hashlib,zipfile,subprocess
out=Path(sys.argv[1] if len(sys.argv)>1 else 'artifacts/run3')
release=json.loads(Path('dist/release.json').read_text())
head=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
assert release['sourceCommit']==head and not release['sourceDirty'], 'Build from the clean committed source first'
assert not subprocess.check_output(['git','status','--porcelain'],text=True).strip(), 'Commit source before packaging'
assert not out.exists(), 'Never overwrite a historical package folder'
standalone=Path('standalone/BlockWorld_2_Run3_Standalone.html').read_bytes()
assert head.encode() in standalone and release['build'].encode() in standalone
for e in release['files']:
    assert hashlib.sha256(Path('dist',e['url'][2:]).read_bytes()).hexdigest()==e['sha256']
out.mkdir(parents=True)
website=out/'BlockWorld_2_Run3_Website.zip'
with zipfile.ZipFile(website,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
    for p in sorted(Path('dist').rglob('*')):
        if p.is_file():
            info=zipfile.ZipInfo('BlockWorld_2_Run3_Website/'+str(p.relative_to('dist')),(2026,11,5,0,0,0))
            info.create_system=3;info.external_attr=0o100644<<16;info.compress_type=zipfile.ZIP_DEFLATED
            z.writestr(info,p.read_bytes(),compresslevel=9)
with zipfile.ZipFile(website) as z:
    assert z.testzip() is None
    for p in Path('dist').rglob('*'):
        if p.is_file():assert z.read('BlockWorld_2_Run3_Website/'+str(p.relative_to('dist')))==p.read_bytes()
html=out/'BlockWorld_2_Run3_Standalone.html';html.write_bytes(standalone)
packages={p.name:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in [website,html]}
metadata={'sourceCommit':head,'sourceDirty':False,'buildId':release['build'],'lockfileSha256':release['lockfileSha256'],'packages':packages,'verified':{'zipCrc':True,'exactDistBytes':True,'releaseManifestHashes':True,'sameEmbeddedSourceAndBuild':True},'deployed':False,'qa':'../../docs/RUN3-QA.md'}
(out/'BUILD.json').write_text(json.dumps(metadata,indent=2)+'\n')
(out/'README.md').write_text('''# BlockWorld 2 Run 3 downloadable builds

These packages are development builds. Nothing is deployed or published. BUILD.json identifies the exact clean source and package hashes; CHECKSUMS.sha256 covers all companion files. Test results and limitations are in ../../docs/RUN3-QA.md and ../../docs/RUN3-DISTRIBUTION.md.

Website: extract the ZIP, enter BlockWorld_2_Run3_Website and run `python -m http.server 8080`, then open http://localhost:8080. No npm installation is needed for the prebuilt package. Future tablet PWA installation requires suitable HTTPS hosting outside the Neighborhood 06 scope. Do not change existing Pages/website/workers.

Standalone: download the HTML and open it in a compatible browser. It embeds the same compiled game, CSS, icons and license credits. It has no service worker requirement. Local-file storage/launch behaviour depends on browser and device; keep portable backups and read the measured compatibility record. File and website storage may be separate; transfer creations using backups.

Both packages contain application files only, with no player saves or credentials. Browser storage can be cleared or evicted. Existing original/foundation/Run 1 archives remain available. Run 3 initial and final folders are separate and never overwritten.
''')
(out/'CHECKSUMS.sha256').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.name+'\n' for p in sorted(out.iterdir()) if p.is_file()))
print(json.dumps(metadata,indent=2))
