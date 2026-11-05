/** Explicit opt-in publishing command. Never targets object-builder or its Pages. */
import {execFileSync} from 'node:child_process';import {mkdtemp,cp,writeFile} from 'node:fs/promises';import {tmpdir} from 'node:os';import path from 'node:path';
const target='novice-builder/blockworld-2-preview';
if(process.argv[2]!=='--publish-test-preview')throw Error('Read docs/PREVIEW.md; explicit --publish-test-preview is required');
execFileSync('gh',['auth','status'],{stdio:'inherit'});
try{execFileSync('gh',['repo','view',target,'--json','nameWithOwner'],{stdio:'pipe'});}catch{execFileSync('gh',['repo','create',target,'--public','--description','BlockWorld 2.0 development preview only','--disable-issues','--disable-wiki'],{stdio:'inherit'});}
execFileSync('npm',['run','build'],{stdio:'inherit'});
const folder=await mkdtemp(path.join(tmpdir(),'bw2-preview-'));await cp('dist',folder,{recursive:true});await writeFile(path.join(folder,'.nojekyll'),'');
const git=args=>execFileSync('git',args,{cwd:folder,stdio:'inherit'});
git(['init','-b','gh-pages']);git(['add','.']);git(['-c','user.name=BlockWorld Preview','-c','user.email=251833594+novice-builder@users.noreply.github.com','commit','-m','Publish isolated development preview']);git(['remote','add','origin',`https://github.com/${target}.git`]);
// A new repository is expected. Never force-replace an existing preview branch.
git(['push','origin','HEAD:refs/heads/gh-pages']);
execFileSync('gh',['api','--method','POST',`repos/${target}/pages`,'-f','source[branch]=gh-pages','-f','source[path]=/'],{stdio:'inherit'});
console.log('Preview target: https://novice-builder.github.io/blockworld-2-preview/');
