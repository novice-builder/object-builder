from pathlib import Path
import json,struct,copy,hashlib,shutil
ROOT=Path('/workspace/work/asset-research'); OUT=ROOT/'ready'; OUT.mkdir(exist_ok=True)
def glb(j,b):
 js=json.dumps(j,separators=(',',':')).encode();js+=b' '*((-len(js))%4); b+=b'\0'*((-len(b))%4)
 return struct.pack('<III',0x46546c67,2,12+8+len(js)+8+len(b))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(b),0x004e4942)+b

def pack(p,out):
 j=json.loads(p.read_text());blob=bytearray();offsets=[]
 for bu in j['buffers']:
  blob.extend(b'\0'*((-len(blob))%4));offsets.append(len(blob));blob.extend((p.parent/bu['uri']).read_bytes())
 for v in j.get('bufferViews',[]):v['byteOffset']=v.get('byteOffset',0)+offsets[v['buffer']];v['buffer']=0
 for im in j.get('images',[]):
  if 'uri'in im:
   blob.extend(b'\0'*((-len(blob))%4));data=(p.parent/im.pop('uri')).read_bytes();im['bufferView']=len(j['bufferViews']);j['bufferViews'].append({'buffer':0,'byteOffset':len(blob),'byteLength':len(data)});blob.extend(data)
 j['buffers']=[{'byteLength':len(blob)}];out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(glb(j,bytes(blob)));return j

def trim_character(p,out):
 b=p.read_bytes();jl=struct.unpack_from('<I',b,12)[0];j=json.loads(b[20:20+jl]);bin_start=20+jl+8;blob=b[bin_start:]
 keep=['Idle','Walking_A','Walking_B','Walking_Backwards','Running_A','Running_B','Running_Strafe_Left','Running_Strafe_Right','Cheer','Interact','Jump_Start','Jump_Idle','Jump_Land']
 j['animations']=[a for a in j['animations'] if a['name']in keep]
 # Detach weapons/accessories; retain their bone nodes so animation track bindings remain valid.
 for n in j['nodes']:
  if n.get('name') in ['Knife_Offhand','1H_Crossbow','2H_Crossbow','Knife','Throwable']: n.pop('mesh',None)
 used_acc=set()
 for m in j['meshes']:
  for pr in m['primitives']:
   used_acc.update(pr.get('attributes',{}).values())
   if 'indices'in pr:used_acc.add(pr['indices'])
   for t in pr.get('targets',[]):used_acc.update(t.values())
 for s in j.get('skins',[]):
  if 'inverseBindMatrices'in s:used_acc.add(s['inverseBindMatrices'])
 for a in j['animations']:
  for s in a['samplers']:used_acc.add(s['input']);used_acc.add(s['output'])
 accmap={old:new for new,old in enumerate(sorted(used_acc))};j['accessors']=[j['accessors'][old]for old in sorted(used_acc)]
 for m in j['meshes']:
  for pr in m['primitives']:
   pr['attributes']={k:accmap[v]for k,v in pr.get('attributes',{}).items()}
   if 'indices'in pr:pr['indices']=accmap[pr['indices']]
   for t in pr.get('targets',[]):
    for k,v in t.items():t[k]=accmap[v]
 for s in j.get('skins',[]):
  if 'inverseBindMatrices'in s:s['inverseBindMatrices']=accmap[s['inverseBindMatrices']]
 for a in j['animations']:
  for s in a['samplers']:s['input']=accmap[s['input']];s['output']=accmap[s['output']]
 used_views=set(a['bufferView']for a in j['accessors']if 'bufferView'in a);used_views.update(im['bufferView']for im in j.get('images',[])if 'bufferView'in im)
 viewmap={old:new for new,old in enumerate(sorted(used_views))};newblob=bytearray();newviews=[]
 for old in sorted(used_views):
  v=copy.deepcopy(j['bufferViews'][old]);newblob.extend(b'\0'*((-len(newblob))%4));start=v.get('byteOffset',0);v['byteOffset']=len(newblob);v['buffer']=0;newblob.extend(blob[start:start+v['byteLength']]);newviews.append(v)
 for a in j['accessors']:
  if 'bufferView'in a:a['bufferView']=viewmap[a['bufferView']]
 for im in j.get('images',[]):
  if 'bufferView'in im:im['bufferView']=viewmap[im['bufferView']]
 j['bufferViews']=newviews;j['buffers']=[{'byteLength':len(newblob)}];out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(glb(j,bytes(newblob)));return j

inv=[]
def record(name,p,j,source,scale=1):
 mins=[1e9]*3;maxs=[-1e9]*3;tris=0
 for m in j['meshes']:
  for pr in m['primitives']:
   a=j['accessors'][pr['attributes']['POSITION']]
   if 'min'in a:
    mins=[min(x,y)for x,y in zip(mins,a['min'])];maxs=[max(x,y)for x,y in zip(maxs,a['max'])]
   if 'indices'in pr:tris+=j['accessors'][pr['indices']]['count']//3
 inv.append({'id':name,'path':str(p.relative_to(OUT)),'source':source,'licence':'CC0-1.0','sizeBytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'meshLocalBounds':{'min':mins,'max':maxs},'suggestedScale':scale,'triangles':tris,'animations':[a['name']for a in j.get('animations',[])]})

vbase=ROOT/'kaykit-village/addons/kaykit_medieval_hexagon_pack/Assets/gltf'
for color in ['green','blue']:
 for name in ['home_A','home_B','tavern','market','windmill','well','church','watermill','blacksmith','lumbermill','tower_A']:
  n=f'building_{name}_{color}';p=OUT/'village'/f'{n}.glb';j=pack(vbase/f'buildings/{color}/{n}.gltf',p);record(n,p,j,'kaykit-medieval',10)
for n in ['building_bridge_A','building_bridge_B','fence_wood_straight','fence_wood_straight_gate','fence_stone_straight','fence_stone_straight_gate']:
 p=OUT/'village'/f'{n}.glb';j=pack(vbase/f'buildings/neutral/{n}.gltf',p);record(n,p,j,'kaykit-medieval',10)
for n in ['tree_single_A','tree_single_B','rock_single_A','rock_single_B','hill_single_A','hills_A','mountain_A_grass','waterlily_A','waterplant_A','cloud_big','cloud_small']:
 p=OUT/'village'/f'{n}.glb';j=pack(vbase/f'decoration/nature/{n}.gltf',p);record(n,p,j,'kaykit-medieval',10)
for n in ['barrel','crate_A_small','crate_open','sack','wheelbarrow','tent','flag_green']:
 p=OUT/'village'/f'{n}.glb';j=pack(vbase/f'decoration/props/{n}.gltf',p);record(n,p,j,'kaykit-medieval',10)
for n in ['tree-oak','tree-detailed','tree-pinedefaulta','tree-pinedefaultb','tree-fat','plant-bush','plant-bushsmall','flower-purplea','flower-reda','flower-yellowa','grass','grass-large','mushroom-red','rock-largea','rock-largeb','rock-smalla','stone-talla','log','stump-round','campfire-stones','tent-smallopen','fence-planks','sign','lily-small']:
 p=OUT/'nature'/f'{n}.glb';p.parent.mkdir(exist_ok=True);shutil.copyfile(ROOT/f'kenney-library/packs/nature-kit/{n}.glb',p);b=p.read_bytes();j=json.loads(b[20:20+struct.unpack_from('<I',b,12)[0]]);record(n,p,j,'kenney-nature',3)
p=OUT/'character/Explorer.glb';j=trim_character(ROOT/'kaykit-adventures/addons/kaykit_character_pack_adventures/Characters/gltf/Rogue.glb',p);record('Explorer',p,j,'kaykit-adventurers',1)
lic=OUT/'licences';lic.mkdir(exist_ok=True)
for src,n in [('kaykit-village/LICENSE.txt','KayKit-Medieval-CC0.txt'),('kaykit-adventures/LICENSE.txt','KayKit-Adventurers-CC0.txt'),('kenney-library/LICENSE','Kenney-CC0.txt'),('medieval-village/LICENSE','Quaternius-Medieval-CC0.txt')]:shutil.copyfile(ROOT/src,lic/n)
(OUT/'inventory.json').write_text(json.dumps(inv,indent=2))
print(f'{len(inv)} assets, {sum(a["sizeBytes"]for a in inv)/1024/1024:.2f} MB')
print('Explorer',p.stat().st_size,'bytes')
for a in inv[:11]+[inv[28],inv[-1]]:print(a['id'],a['meshLocalBounds'],a['triangles'])
