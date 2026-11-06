"""Strict Adventures build with an input/output receipt; prevents evidence from describing a stale build."""
import argparse,pathlib,hashlib,subprocess,json,datetime
ROOT=pathlib.Path(__file__).resolve().parents[2]
p=argparse.ArgumentParser();p.add_argument('--version',type=int,required=True);a=p.parse_args()
if a.version<12:raise SystemExit('Accepted earlier previews are immutable; use a new active version.')
out=ROOT/f'docs/adventures-v{a.version}'
if not out.is_dir():raise SystemExit('Create the new QA folder first.')
def inputs():
 files={f for directory in ['src','tests','public/adventures']for f in (ROOT/directory).rglob('*')if f.is_file()}
 files.update(f for pattern in ['package*.json','tsconfig*.json','adventures.html','vite.adventures.config.ts']for f in ROOT.glob(pattern))
 return{str(f.relative_to(ROOT)):hashlib.sha256(f.read_bytes()).hexdigest()for f in sorted(files)}
before=inputs();run=subprocess.run(['npm','run','build:adventures'],cwd=ROOT,capture_output=True,text=True);log=run.stdout+run.stderr;(out/'build.txt').write_text(log);print(log,flush=True)
if run.returncode:raise SystemExit(run.returncode)
if before!=inputs():raise SystemExit('Build inputs changed during compilation; refusing a receipt.')
dist=ROOT/'adventures-dist';outputs={str(f.relative_to(dist)):hashlib.sha256(f.read_bytes()).hexdigest()for f in sorted(dist.rglob('*'))if f.is_file()}
receipt={'command':'npm run build:adventures','returncode':0,'atUtc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'headAtBuild':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'inputs':before,'outputs':outputs}
(out/'BUILD-RECEIPT.json').write_text(json.dumps(receipt,indent=2)+'\n');print('Verified build receipt:',len(before),'inputs;',len(outputs),'outputs.')
