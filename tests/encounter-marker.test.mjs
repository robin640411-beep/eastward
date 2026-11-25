import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {vehicleDriverAnchor,encounterBubbleBox,drawEncounterCue} from '../dist/encounter-marker.js';
import {vehicleArt,vehicleStats,STARTER_VEHICLES,starterVehicle} from '../dist/vehicle-runtime.js';
import {groundRatio} from '../dist/scenery-ground.js';
const read=p=>JSON.parse(readFileSync(new URL('../dist/'+p,import.meta.url)));
const assets=read('assets/manifest.json');
const roster=Array.from({length:4},(_,i)=>({id:'p'+i,race:['human','alien','mutant','synth'][i],profession:'driver',hp:30}));

test('every vehicle and seat upgrade anchors the selected driver to their actual window',()=>{
 const fleet=[...Object.keys(assets.vehicles).map(model=>({model,mods:[]})),...STARTER_VEHICLES.map(v=>starterVehicle(v.roll))];
 for(const vehicle of fleet)for(let added=0;added<=Math.min(vehicleStats(assets,vehicle).limit,Math.max(0,4-vehicleStats(assets,vehicle).seats));added++){
  const v={...vehicle,mods:Array(added).fill('seat')},a=vehicleArt(assets,v),party=roster.slice(0,Math.min(4,vehicleStats(assets,v).seats));
  for(let slot=0;slot<party.length;slot++)for(const zoom of [.7,.84,1]){
   const state={vehicle:v,party,driver:party[slot].id},saved=structuredClone(state),geometry={x:24,y:140,width:190,ground:220,zoom};
   const anchor=vehicleDriverAnchor(assets,state,geometry),win=a.windows[slot],scale=190/160,bodyY=220-190*72/160*groundRatio(a);
   const headX=Math.round(24+win.x*scale)+Math.min(win.width,win.height)*scale/2;
   assert.equal(anchor.id,party[slot].id);
   assert.equal(anchor.cx,headX*zoom);
   assert.equal(anchor.cy,220+(Math.round(bodyY+win.y*scale)-220)*zoom);
   const bubble=encounterBubbleBox(anchor,{age:1,width:384});
   assert(bubble.x>=0&&bubble.x+bubble.w<=384);
   assert(bubble.y+bubble.h+5<anchor.cy,'bubble should clear the visible head');
   assert.deepEqual(state,saved,'presentation cannot reorder or change the party');
  }
 }
});

test('driver changes follow the new portrait and unknown people do not borrow a seat',()=>{
 const state={vehicle:{model:'armored',mods:[]},party:roster,driver:'p0'},geo={x:24,y:140,width:190,ground:220,zoom:.84};
 const first=vehicleDriverAnchor(assets,state,geo);state.driver='p3';const last=vehicleDriverAnchor(assets,state,geo);
 assert(first.cx>last.cx+60);assert.equal(last.id,'p3');
 state.driver='missing';assert.equal(vehicleDriverAnchor(assets,state,geo),null);
 state.driver='p3';state.vehicle={model:'compact',mods:[]};assert.equal(vehicleDriverAnchor(assets,state,geo),null);
});

test('the marker pops once, holds still, and reduced motion has no size or position changes',()=>{
 const anchor={cx:128,cy:160};
 const initial=encounterBubbleBox(anchor,{age:0}),held=encounterBubbleBox(anchor,{age:.14});
 assert(initial.w<held.w&&initial.h<held.h);
 for(const age of [.2,1,20])assert.deepEqual(encounterBubbleBox(anchor,{age}),held);
 for(const age of [0,.03,.1,10])assert.deepEqual(encounterBubbleBox(anchor,{age,soft:true}),held);
 assert.equal(encounterBubbleBox(null),null);
});

test('the red pixel mark is opaque and bounded even at viewport edges and at night',()=>{
 for(const anchor of [{cx:1,cy:20},{cx:383,cy:20},{cx:180,cy:170}]){
  const draws=[],stack=[],ctx={globalAlpha:.1,save(){stack.push(this.globalAlpha);},restore(){this.globalAlpha=stack.pop();},fillRect(x,y,w,h){draws.push({x,y,w,h,color:this.fillStyle,alpha:this.globalAlpha});}};
  drawEncounterCue(ctx,anchor,{age:1,top:0,width:384});
  assert(draws.some(r=>r.color==='#bd4752'));
  assert(draws.every(r=>r.alpha===1&&[r.x,r.y,r.w,r.h].every(Number.isInteger)));
  assert(draws.every(r=>r.x>=0&&r.x+r.w<=384&&r.y>=0));
  assert.equal(ctx.globalAlpha,.1);
 }
});

test('indoor cues render the actual driver once without encounter art, and road cues stay in the car',async()=>{
 const old={document:globalThis.document,localStorage:globalThis.localStorage,matchMedia:globalThis.matchMedia,Image:globalThis.Image,requestAnimationFrame:globalThis.requestAnimationFrame};
 let nextFrame,time=0;const draws=[],fills=[],attributes={};
 const context=(main=false)=>new Proxy({globalAlpha:1,fillStyle:'',drawImage(image,...args){if(main)draws.push({path:image.path,args});},fillRect(...args){if(main)fills.push({color:this.fillStyle,args,alpha:this.globalAlpha});},createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),getImageData:()=>({data:new Uint8ClampedArray(112*112*4)})},{get:(o,k)=>k in o?o[k]:()=>{}});
 const q=context(true),canvas={isConnected:true,width:384,height:240,getContext:()=>q,setAttribute(k,v){attributes[k]=v;}};
 globalThis.document={hidden:false,documentElement:{dataset:{}},getElementById:()=>null,querySelector:()=>null,createElement:()=>({width:112,height:112,getContext:()=>context()})};
 globalThis.localStorage={getItem:()=>null};globalThis.matchMedia=()=>({matches:true});globalThis.Image=class{complete=true;naturalWidth=768;set src(value){this.path=value;this.onload?.();}};globalThis.requestAnimationFrame=fn=>{nextFrame=fn;};
 try{
  const {Game}=await import('../dist/engine.js'),{mountWorld}=await import('../dist/world-view.js');
  const data={assets,catalog:read('data/npc-catalog.json'),oracles:read('data/oracles.json'),events:read('data/events.json'),buildings:read('data/building-events.json'),traits:read('data/traits.json')};
  const g=new Game(data);g.start({seed:445,race:'human',profession:'driver'});g.s.party.push(g.person('alien','medic'));g.s.driver=g.s.party[1].id;g.s.actorId=g.s.party[0].id;g.s.mode='event';g.s.battle=null;g.s.current=null;g.s.vehicle={model:'bus',mods:[],hp:50};g.s.minutes=1380;
  const cue={key:'inside-test',phase:'reading',inside:true};
  mountWorld(canvas,g.s,assets,{}, {encounterCue:cue});nextFrame(time+=40);
  const driverPath='assets/'+assets.characters.alien_medic,actorPath='assets/'+assets.characters.human_driver;
  assert.equal(draws.filter(d=>d.path===driverPath).length,1);
  assert.equal(draws.filter(d=>d.path===actorPath).length,0);
  assert.equal(attributes['aria-label'],'駕駛察覺異狀');
  assert.equal(fills.at(-1).color,'#bd4752');
  draws.length=0;fills.length=0;
  // A preceding dialogue scene must not pull the driver out of the car.
  g.s.current={event:{id:'road_014',options:[]},dialogue:true,npc:g.s.party[1]};
  mountWorld(canvas,g.s,assets,{road_014:{kind:'npc',effect:'none'}},{encounterCue:{key:'road-test',phase:'reading',inside:false}});nextFrame(time+=40);
  assert.equal(draws.filter(d=>d.path===driverPath||d.path===actorPath).length,0);
  assert(draws.some(d=>d.path==='assets/'+assets.portraits.alien));
  const tint=fills.findIndex(r=>r.color==='#07152c'),mark=fills.findIndex(r=>r.color==='#bd4752');assert(mark>tint&&tint>=0,'night tint must not dim the red marker');
  assert.equal(fills[mark].alpha,1);
  draws.length=0;fills.length=0;
  mountWorld(canvas,g.s,assets,{},{});nextFrame(time+=40);
  assert(!fills.some(r=>r.color==='#bd4752'),'omitting the cue removes it');
 }finally{Object.assign(globalThis,old);}
});
