"""Preserve the exact original files corresponding to the selected, redistributable CC0 models."""
import json,pathlib,zipfile,hashlib
ROOT=pathlib.Path(__file__).resolve().parents[2];SOURCES=pathlib.Path('/workspace/work/asset-research');OUT=ROOT/'artifacts/adventures-v1'
OUT.mkdir(parents=True,exist_ok=True);target=OUT/'BlockWorld-Adventures-Source-Assets-01.zip'
if target.exists():raise SystemExit('Refusing to overwrite versioned source archive')
files={}
for item in json.loads((ROOT/'public/adventures/inventory.json').read_text()):
 if item['source']=='kaykit-medieval':
  base=SOURCES/'kaykit-village/addons/kaykit_medieval_hexagon_pack/Assets/gltf';p=next(base.rglob(item['id']+'.gltf'));j=json.loads(p.read_text());needed=[p]+[p.parent/b['uri']for b in j['buffers']if 'uri'in b]+[p.parent/im['uri']for im in j.get('images',[])if 'uri'in im]
 elif item['source']=='kaykit-adventurers':needed=[SOURCES/'kaykit-adventures/addons/kaykit_character_pack_adventures/Characters/gltf/Rogue.glb']
 else:needed=[SOURCES/'kenney-library/packs/nature-kit'/pathlib.Path(item['path']).name]
 for f in needed:files[str(f.relative_to(SOURCES))]=f
for folder,name in [('kaykit-village','LICENSE.txt'),('kaykit-adventures','LICENSE.txt'),('kenney-library','LICENSE')]:files[folder+'/'+name]=SOURCES/folder/name
manifest={n:hashlib.sha256(f.read_bytes()).hexdigest()for n,f in sorted(files.items())}
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=9)as z:
 for n,f in sorted(files.items()):z.write(f,n)
 z.writestr('SHA256.json',json.dumps(manifest,indent=2));z.writestr('README.txt','Original selected CC0 source files. No geometry changes or animation pruning. Exact source commits and licences are recorded in the runtime PROVENANCE.md. The original Rogue includes its original accessories and all supplied animation clips.\n')
print(target,target.stat().st_size)
