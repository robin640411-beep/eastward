import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {enemyTargetRegions} from '../dist/battle-presentation.js';
import {enemyLayout} from '../dist/journey-view-model.js';
import {Game} from '../dist/engine.js';
const read=p=>JSON.parse(readFileSync(new URL('../dist/'+p,import.meta.url)));
const data={assets:read('assets/manifest.json'),catalog:read('data/npc-catalog.json'),oracles:read('data/oracles.json'),events:read('data/events.json'),buildings:read('data/building-events.json'),traits:read('data/traits.json')};
test('large solo enemies and vehicle ends are selectable across their visible width',()=>{
 for(const enemy of [{id:'e0',bossId:'overseer'},{id:'e0',scale:1.35},{id:'e0',vehicle:'ambulance'}]){const targets=enemyTargetRegions([enemy],enemyLayout(1,[enemy])),r=targets[0];for(const x of [88,125,192,260,296])assert(x>=r.left&&x<r.left+r.width);}
});
test('enemy lanes never overlap, and defeated slots do not redirect taps onto survivors',()=>{
 for(let n=1;n<=3;n++){const enemies=Array.from({length:n},(_,i)=>({id:'e'+i,hp:100})),layout=enemyLayout(n,enemies),before=enemyTargetRegions(enemies,layout);for(let x=.5;x<384;x++){assert.equal(before.filter(r=>x>=r.left&&x<r.left+r.width).length,1);}enemies[Math.floor(n/2)].hp=0;assert.deepEqual(enemyTargetRegions(enemies,enemyLayout(n,enemies)),before);}
});
test('character battle steady frames draw only a cached arena plus enemies, with no hidden road work',async()=>{
 const previous={document:globalThis.document,localStorage:globalThis.localStorage,matchMedia:globalThis.matchMedia,Image:globalThis.Image,requestAnimationFrame:globalThis.requestAnimationFrame};let nextFrame,draws=0,allocations=0;
 const context=()=>new Proxy({globalAlpha:1,drawImage(){draws++;},createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:()=>{}});
 const canvas=()=>{const ctx=context();return {isConnected:true,width:384,height:240,getContext:()=>ctx,setAttribute(){}}};
 globalThis.document={hidden:false,documentElement:{dataset:{}},getElementById:()=>null,querySelector:()=>null,createElement:()=>{allocations++;return canvas();}};globalThis.localStorage={getItem:()=>null};globalThis.matchMedia=()=>({matches:false});globalThis.Image=class{complete=true;naturalWidth=768;set src(value){this.path=value;this.onload?.();}};globalThis.requestAnimationFrame=fn=>{nextFrame=fn;};
 try{const {mountWorld}=await import('../dist/world-view.js');const g=new Game(data);g.start({seed:445});g.beginCombat();const base=g.s.battle.enemies[0];g.s.battle.enemies=Array.from({length:3},(_,i)=>({...base,id:'e'+i}));mountWorld(canvas(),g.s,data.assets,{});for(let i=1;i<=5;i++)nextFrame(i*40);const beforeAllocations=allocations;draws=0;for(let i=6;i<=25;i++)nextFrame(i*40);assert.equal(draws,20*4,'each frame uses one arena image and three enemy images');assert.equal(allocations,beforeAllocations,'no per-frame canvas creation');}
 finally{Object.assign(globalThis,previous);}
});
