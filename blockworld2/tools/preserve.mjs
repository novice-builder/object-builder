import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base='1ffd35ed971afa7820734cf10a3287ab546f6306';
const files=execFileSync('git',['ls-tree','-r','--name-only',base],{cwd:'..',encoding:'utf8'}).trim().split('\n');
for(const file of files){const original=execFileSync('git',['show',`${base}:${file}`],{cwd:'..',maxBuffer:20*1024*1024});const current=await readFile('../'+file);if(!original.equals(current))throw Error(`Protected artifact changed: ${file}`);}
const changed=execFileSync('git',['diff','--name-only',base],{cwd:'..',encoding:'utf8'}).trim().split('\n').filter(Boolean);
if(changed.some(p=>!p.startsWith('blockworld2/')))throw Error('Changes outside blockworld2/');
console.log(`PASS: ${files.length} existing files match ${base}; package-only changes`);
