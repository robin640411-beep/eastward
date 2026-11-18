import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SCENERY_GROUND_DATA} from '../dist/scenery-ground-data.js';
import {ROAD_GROUND,groundMetric,groundRatio,groundedBox,propGround} from '../dist/scenery-ground.js';
import {BIOMES} from '../dist/route-catalog.js';
import {ROADSIDE_PROFILES,roadsideItems,roadsideTraffic} from '../dist/roadside-model.js';
import {drawRoadside} from '../dist/roadside-art.js';
const assets=JSON.parse(readFileSync(new URL('../dist/assets/manifest.json',import.meta.url)));

test('visible foundations and tires, rather than transparent image borders, meet the road',()=>{
 assert.equal(groundRatio(assets.occupation.pylon),120/128);
 assert.equal(groundRatio(assets.vehicles.compact),69/72);
 for(const facade of Object.values(assets.facilities))assert.equal(groundRatio(facade),122/128);
 const pylon=groundedBox(assets.occupation.pylon,100,ROAD_GROUND.pylon,27,72);
 assert(Math.abs(pylon.contact-ROAD_GROUND.pylon)<=.5);
 assert(pylon.y>87,'the old position left the pylon floating above the road');
 for(const [key,metric] of Object.entries(SCENERY_GROUND_DATA)){
  const [image,source]=key.split('#'),asset={image,...(source?{rect:source.split(',').map(Number)}:{})};
  assert(metric[2]>0&&metric[2]<=metric[1],key);
  for(const width of [30,78,96,190,203]){
   const box=groundedBox(asset,12.5,196,width);
   assert(Math.abs(box.contact-196)<=.5,key+' must touch its ground plane');
   assert(Math.abs(box.width/box.height-metric[0]/metric[1])<1e-10,key+' must keep its native shape');
  }
 }
});

test('every travelling character, starter, vehicle variant and facade has measured alpha bounds',()=>{
 const checked=new Set();
 const check=a=>{assert(groundMetric(a),a.image);checked.add(a.image);};
 for(const a of [...Object.values(assets.vehicles),...Object.values(assets.starters)]){check(a);Object.values(a.variants||{}).forEach(check);}
 Object.values(assets.characters).forEach(image=>check({image}));
 Object.values(assets.facilities).forEach(check);
 assert(checked.size>=300);
 // Flying craft are not assigned a ground plane or moved down to the road.
 assert.equal(groundMetric(assets.occupation.carrier),null);
 assert.equal(groundMetric(assets.occupation.drone),null);
});

test('road layers leave room for distant foundations, roadside furniture and both traffic lanes',()=>{
 const ordered=['terrain','pylon','building','prop','parked','traffic','encounter','player','foreground'];
 for(let i=1;i<ordered.length;i++)assert(ROAD_GROUND[ordered[i]]>ROAD_GROUND[ordered[i-1]]);
 assert.equal(propGround('container'),104/112);
 assert.equal(propGround('pole'),106/112);
 const car=assets.vehicles.compact,h=190*72/160,contact=groundedBox(car,24,ROAD_GROUND.player,190,h).contact;
 for(const zoom of [.70,.84,1])assert(Math.abs((contact-220)*zoom+220-ROAD_GROUND.player)<.5,'zoom must pivot at the tire contact');
});

test('the actual roadside renderer grounds every kind across all twelve biomes',()=>{
 const originalDocument=globalThis.document;
 globalThis.document={createElement(){const canvas={width:0,height:0};canvas.getContext=()=>new Proxy({getImageData:()=>({data:new Uint8ClampedArray(112*112*4)})},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});return canvas;}};
 try{
  for(const b of BIOMES){
   const region={...b,index:3},profile=ROADSIDE_PROFILES[b.id],seen=new Set();
   for(let travel=0;travel<18000;travel+=600){
    const records=[],stack=[];let tx=0,ty=0,sx=1,sy=1;
    const ctx={globalAlpha:1,save(){stack.push({tx,ty,sx,sy,alpha:this.globalAlpha});},restore(){const p=stack.pop();({tx,ty,sx,sy}=p);this.globalAlpha=p.alpha;},translate(x,y){tx+=x*sx;ty+=y*sy;},scale(x,y){sx*=x;sy*=y;},fillRect(){},drawImage(image,...args){const [x,y,w,h]=args.slice(-4);records.push({image,x:tx+(sx<0?x+w:x)*sx,y:ty+y*sy,w:Math.abs(w*sx),h:h*sy});}};
    drawRoadside(ctx,{seed:445,region,travel,seconds:75,assets,image:path=>({path})});
    const depth=i=>i.type==='building'?ROAD_GROUND.building:i.type==='vehicle'?ROAD_GROUND.parked:ROAD_GROUND.prop;
    const items=roadsideItems(445,region,travel).sort((a,b)=>depth(a)-depth(b));
    assert.equal(records.length,items.length+roadsideTraffic(445,region,travel,75).length);
    items.forEach((item,i)=>{
     seen.add(item.type);let ratio;
     if(item.type==='building')ratio=groundRatio(assets.facilities[profile.facades[item.variant%profile.facades.length]]);
     else if(item.type==='vehicle')ratio=groundRatio(assets.vehicles[profile.vehicles[item.variant%profile.vehicles.length]]);
     else ratio=propGround(item.type);
     assert(Math.abs(records[i].y+records[i].h*ratio-depth(item))<=.5,b.id+'/'+item.type+' floats');
    });
    for(const r of records.slice(items.length))assert(Math.abs(r.y+r.h*groundRatio({image:r.image.path})-ROAD_GROUND.traffic)<=.5,b.id+' moving car floats');
    assert.equal(stack.length,0);
   }
   assert.equal(seen.size,10,b.id+' checks all roadside kinds');
  }
 }finally{globalThis.document=originalDocument;}
});

