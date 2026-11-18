import test from 'node:test';
import assert from 'node:assert/strict';
import {drawBattleEffects,effectTargets,EFFECT_SHAPES} from '../dist/battle-effects.js';
import {ATTACK_STYLES,POWER_STYLES,IMPACT_MS,BEAT_MS} from '../dist/battle-presentation.js';

const party=['p0','p1','p2','p3'].map(id=>({id,hp:30}));
const enemies=[{id:'e0',hp:0},{id:'e1',hp:30},{id:'e2',hp:30}];
const layout=[{cx:87,cy:122},{cx:192,cy:122},{cx:297,cy:122}];
const partyY=287,vehicleTarget={cx:102,cy:206};
const attack=(shape='bullet',more={})=>({kind:'attack',side:'enemies',actor:'e1',target:'p2',visual:{shape,color:'#d6bfa0'},effects:[{side:'party',id:'p2',amount:-7}],...more});
function render(beat,age=.56,options={}){
 const rectangles=[],texts=[];let saves=0;
 const ctx={globalAlpha:1,fillStyle:'',save(){saves++;},restore(){saves--;},
  fillRect(x,y,w,h){for(const n of [x,y,w,h,this.globalAlpha])assert(Number.isFinite(n));assert(w>0&&h>0);assert([x,y,w,h].every(Number.isInteger));rectangles.push({x,y,w,h,color:this.fillStyle,alpha:this.globalAlpha});},
  fillText(label,x,y){assert(Number.isFinite(x)&&Number.isFinite(y));texts.push({label,x,y,color:this.fillStyle,alpha:this.globalAlpha});}
 };
 drawBattleEffects(ctx,{beat,age,enemies,layout,party,partyY,...options});
 assert.equal(saves,0,'canvas state is restored');
 return {rectangles,texts};
}

test('recorded recipients retain their slot and use the visible chest height',()=>{
 const beat=attack('claw',{target:'p0'});
 assert.deepEqual(effectTargets(beat,enemies,layout,party,{partyY}),[{cx:240,cy:partyY}]);
 assert.deepEqual(effectTargets(attack('claw',{effects:[],target:'unknown'}),enemies,layout,party,{partyY}),[]);
 assert.deepEqual(effectTargets(attack('claw',{side:'party',target:'e2',effects:[{side:'enemies',id:'e2',amount:-1}]}),enemies,layout,party,{partyY}),[layout[2]]);
 const deadParty=party.map(p=>p.id==='p2'?{...p,hp:0}:p);
 assert.deepEqual(effectTargets(beat,enemies,layout,deadParty,{partyY}),[{cx:240,cy:partyY}]);
});

test('vehicle hits use only the explicit car anchor and never the first traveller',()=>{
 const beat=attack('cannon',{target:'vehicle',effects:[{side:'vehicle',id:'vehicle',amount:-5}]});
 assert.deepEqual(effectTargets(beat,enemies,layout,party,{partyY}),[]);
 assert.deepEqual(render(beat),{rectangles:[],texts:[]});
 assert.deepEqual(effectTargets(beat,enemies,layout,party,{partyY,vehicleTarget}),[vehicleTarget]);
 const result=render(beat,.56,{vehicleTarget});
 assert(result.rectangles.length>0);
 assert(result.rectangles.every(r=>Math.abs(r.x-vehicleTarget.cx)<40&&Math.abs(r.y-vehicleTarget.cy)<40));
 assert.equal(result.texts.at(-1).x,vehicleTarget.cx);
 assert(render(attack('bullet',{actor:'unknown',side:'party',target:'e1',effects:[]}),.1,{vehicleTarget}).rectangles.length===0);
});

test('misses, zero damage and an unknown victim never generate contact artwork',()=>{
 const damaging=[...EFFECT_SHAPES].filter(s=>!['heal','medicine','shield','escape'].includes(s));
 for(const shape of damaging)for(const soft of [false,true]){
  const miss=render(attack(shape,{effects:[],label:'攻擊落空。'}),.56,{soft});
  assert.equal(miss.rectangles.length,0,shape+' must not hit on a miss');
  assert.equal(miss.texts.length,1);assert.equal(miss.texts[0].label,'MISS');
  const zero=render(attack(shape,{effects:[{side:'party',id:'p2',amount:0}],label:'造成 0 傷害。'}),.56,{soft});
  assert.deepEqual(zero,{rectangles:[],texts:[]});
  const unknown=render(attack(shape,{target:'unknown',effects:[{side:'party',id:'unknown',amount:-2}]}),.56,{soft});
  assert.deepEqual(unknown,{rectangles:[],texts:[]});
 }
});

test('every single-recipient impact stays local, including the largest PSI attacks',()=>{
 for(const shape of EFFECT_SHAPES){
  if(['heal','medicine','shield','escape'].includes(shape))continue;
  const {rectangles}=render(attack(shape));
  assert(rectangles.length>0,shape+' needs recognizable contact artwork');
  for(const r of rectangles){
   assert(r.x>=240-52&&r.x+r.w<=240+52,shape+' crosses into another party slot');
   assert(r.y>=partyY-52&&r.y+r.h<=partyY+52,shape+' creates an area flash');
   assert(r.w<48&&r.h<48,shape+' uses an oversized flash rectangle');
  }
 }
});

test('contact artwork holds for reading, then breaks up and disappears within the beat',()=>{
 assert.equal(IMPACT_MS,360);assert.equal(BEAT_MS,980);
 for(const shape of ['bullet','slash','claw','bite','cannon','force','storm']){
  const beat=attack(shape),atContact=render(beat,.36).rectangles,held=render(beat,.48).rectangles;
  assert.deepEqual(held,atContact,shape+' should hold its contact silhouette for 120 ms');
  assert(atContact.length>0);
  assert(render(beat,.56).rectangles.some(r=>r.alpha>.9),shape+' should remain legible 200 ms after contact');
  assert.notDeepEqual(render(beat,.79).rectangles,atContact);
  assert.deepEqual(render(beat,.99),{rectangles:[],texts:[]});
 }
});

test('reduced motion retains each attack silhouette, held still with only a fade',()=>{
 const signatures=[];
 const geometry=rs=>rs.map(({alpha,color,...r})=>r);
 for(const shape of EFFECT_SHAPES){
  if(['heal','medicine','shield','escape'].includes(shape))continue;
  const beat=attack(shape),early=render(beat,.36,{soft:true}),late=render(beat,.79,{soft:true});
  assert(early.rectangles.length>0);
  assert.deepEqual(geometry(late.rectangles),geometry(early.rectangles),shape+' must remain still');
  assert(late.rectangles[0].alpha<early.rectangles[0].alpha);
  signatures.push(JSON.stringify(geometry(early.rectangles)));
 }
 assert.equal(new Set(signatures).size,signatures.length,'different attacks cannot collapse to one generic spark');
});

test('traveller numbers sit beside the bust, retain short upward movement and remain inside the screen',()=>{
 for(let i=0;i<party.length;i++){
  const beat=attack('bullet',{target:party[i].id,effects:[{side:'party',id:party[i].id,amount:-17}]});
  const early=render(beat,.36).texts.at(-1),late=render(beat,.8).texts.at(-1),cx=48+i*96;
  assert.equal(Math.abs(early.x-cx),28);
  assert(early.x>=22&&early.x<=362);
  assert.equal(early.y,partyY-32);
  assert(early.y-late.y>0&&early.y-late.y<=10);
 }
});

test('healing variants have their own geometry, while shielding targets only living allies',()=>{
 const signatures=[];
 for(const visual of Object.values(POWER_STYLES).flat().filter(v=>v.shape==='heal')){
  const beat=attack('heal',{side:'party',actor:'p0',kind:'psi',power:'heal',target:'p2',effects:[{side:'party',id:'p2',amount:8}],visual:{...visual,color:'#bbccaa'}});
  const {rectangles,texts}=render(beat);
  signatures.push(JSON.stringify(rectangles.map(({color,alpha,...r})=>r)));
  assert(rectangles.every(r=>Math.abs(r.x-240)<32));
  assert.equal(texts.at(-1).label,'+8');
 }
 assert.equal(new Set(signatures).size,7);
 const shielding=attack('shield',{side:'party',actor:'p1',kind:'psi',power:'shield',effects:[]});
 const roster=party.map((p,i)=>i===2?{...p,hp:0}:p);
 assert.deepEqual(effectTargets(shielding,enemies,layout,roster,{partyY}),[{cx:48,cy:partyY},{cx:144,cy:partyY},{cx:336,cy:partyY}]);
 assert.deepEqual(effectTargets({...shielding,kind:'defend'},enemies,layout,roster,{partyY}),[{cx:144,cy:partyY}]);
});

test('all player, enemy and PSI styles render integer geometry throughout their action',()=>{
 for(const visual of [...Object.values(ATTACK_STYLES),...Object.values(POWER_STYLES).flat()]){
  for(const age of [.01,.12,.23,.35,.36,.48,.56,.82,.97])for(const side of ['party','enemies']){
   const healing=['heal','medicine'].includes(visual.shape),support=healing||visual.shape==='shield';
   const targetSide=support||side==='enemies'?'party':'enemies';
   render(attack(visual.shape,{side,kind:'psi',power:visual.shape==='shield'?'shield':undefined,actor:side==='party'?'p1':'e1',visual,target:targetSide==='party'?'p2':'e2',effects:support&&!healing?[]:[{side:targetSide,id:targetSide==='party'?'p2':'e2',amount:healing?6:-4}]}),age);
  }
 }
});
