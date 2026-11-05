"""Pack the verified Standard FREE Quaternius modules with a mobile flat palette.

Usage: python3 prepare_modular.py --source /path/to/medieval-village/glTF --output /path/to/modular
Source repository/commit and per-file hashes: modular-source-verification.json.
Authored geometry/index buffers are retained exactly. No paid content is needed.
"""
import argparse,json,struct,pathlib
p=argparse.ArgumentParser();p.add_argument('--source',type=pathlib.Path,required=True);p.add_argument('--output',type=pathlib.Path,required=True);a=p.parse_args();a.output.mkdir(parents=True,exist_ok=True)
palette={'MI_WoodTrim':[.28,.12,.055,1],'MI_WoodTrim_Wear':[.25,.10,.045,1],'MI_Plaster':[.72,.64,.49,1],'MI_RockTrim':[.28,.32,.29,1],'MI_RoundTiles':[.025,.22,.34,1],'MI_MetalOrnaments':[.12,.14,.13,1]}
for index,name in enumerate(['Wall_Plaster_Straight','Wall_Plaster_Door_Flat','Floor_WoodDark','Door_4_Flat','Roof_RoundTiles_4x6','Roof_Front_Brick4']):
 j=json.loads((a.source/(name+'.gltf')).read_text());blob=(a.source/j['buffers'][0]['uri']).read_bytes();j['buffers']=[{'byteLength':len(blob)}]
 for mat in j.get('materials',[]):
  col=palette.get(mat['name'],[.3,.2,.1,1]);mat.clear();mat.update({'name':name+'_'+str(index),'pbrMetallicRoughness':{'baseColorFactor':col,'roughnessFactor':1,'metallicFactor':0}})
 for key in ['images','textures','samplers']:j.pop(key,None)
 js=json.dumps(j,separators=(',',':')).encode();js+=b' '*(-len(js)%4);blob+=b'\0'*(-len(blob)%4)
 data=struct.pack('<III',0x46546c67,2,28+len(js)+len(blob))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(blob),0x004e4942)+blob
 (a.output/(name+'.glb')).write_bytes(data)
