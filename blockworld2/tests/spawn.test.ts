import {test} from 'node:test';import assert from 'node:assert/strict';import {safeGround} from '../src/world/spawn';import {collides} from '../src/legacy06/core.js';
test('occupied arrival points resolve to clear ground',()=>{const solids=[{minX:-1,maxX:1,minY:0,maxY:3,minZ:-1,maxZ:1}];const pose=safeGround({x:0,z:0},solids);assert.equal(collides(pose,solids),false);assert.equal(pose.y,0);});
test('no available arrival throws instead of selecting a colliding position',()=>{assert.throws(()=>safeGround({x:0,z:0},[{minX:-30,maxX:30,minY:0,maxY:3,minZ:-30,maxZ:30}]));});
