import {drawJourneySky} from './atmosphere.js';
import {paintHorizon} from './horizon-art.js';
import {npcCombatArt,enemyCombatArt} from './combat-art.js';
import {proceduralPortraitDataUri,proceduralCharacterDataUri} from './procedural-npc.js';
import {BEAT_MS,IMPACT_MS,bustRole,bustPose,partyAnchor} from './battle-presentation.js';
import {vehicleArt,vehicleStats} from './vehicle-runtime.js';
import {weatherLayers,ambientStormAt} from './weather-model.js';
import {drawWeatherSky,drawWeatherParticles} from './weather-art.js';
import {drawBattleEffects} from './battle-effects.js';
// Lightweight 384px stage: layered pixel art, no physics engine or continuous DOM writes.
import {reducedMotion} from './cinematics.js';
import {phaseName} from './engine.js';
import {routeView} from './route-runtime.js';
import {drawRoadside} from './roadside-art.js';
import {ROAD_GROUND,groundedBox,groundRatio,groundShadow} from './scenery-ground.js';
import {vehicleDriverAnchor,drawEncounterCue} from './encounter-marker.js';
import {biomeAt,tripPose,enemyLayout,lightingAt,mixHex,ease,clamp01} from './journey-view-model.js';
const W=384,H=240,images=new Map();let imageRevision=0;let reduced=reducedMotion(),stormStrength=0,stormStarted=0,stormKey='';
let canvas,ctx,state,assets,encounters,lastFrame=0,lastTime=0,clock=0,roadTravel=0,eventAt=0,key='',actionAt=-10,feedback=[],actionKind='',travelAt=0,tripDuration=12000,speed=1,viewZoom=.84,viewCarX=24,displayMinute=-1,selectedTarget=null,lightMinute=null,beat=null,beatAt=0,playback=false;
let encounterCue=null,cueKey=null,cueStartedAt=0,cueAnchor=null;
// Keep the original sprite grid. A taller screen reveals more sky and shoulder.
let stageTop=0,stageHeight=H,observedCanvas;
function fitPixelStage(){
 if(!canvas?.isConnected||!canvas.clientWidth||!canvas.clientHeight)return;
 stageHeight=Math.max(1,Math.round(W*canvas.clientHeight/canvas.clientWidth));
 stageTop=stageHeight<H?Math.max(stageHeight-238,Math.round((stageHeight-H)*.8)):Math.round((stageHeight-H)*.55);
 if(canvas.height!==stageHeight)canvas.height=stageHeight;
 ctx.setTransform(1,0,0,1,0,stageTop);
 ctx.imageSmoothingEnabled=false;
 const style=canvas.parentElement.style;
 style.setProperty('--viewport-top',(stageTop/stageHeight*100)+'%');
 style.setProperty('--viewport-height',(H/stageHeight*100)+'%');
}
const stageResize=globalThis.ResizeObserver?new ResizeObserver(fitPixelStage):null;
if(!stageResize)globalThis.addEventListener?.('resize',fitPixelStage);
function img(path){if(!path)return null;if(!images.has(path)){const i=new Image();i.onload=()=>imageRevision++;i.src=path.startsWith('data:')?path:'assets/'+path;images.set(path,i)}const i=images.get(path);return i.complete&&i.naturalWidth?i:null}
function paint(path,x,y,w,h){const i=img(path);if(i)ctx.drawImage(i,Math.round(x),Math.round(y),w,h)}
// These sprites are baked on their native pixel grid and loaded only when encountered.
function combatPicture(art){return art?img(art.image.replace(/^assets\//,'')):null;}
function paintCombatant(art,x,y,w,h){
 const picture=combatPicture(art);
 if(!picture)return;
 const scale=Math.min(w/art.width,h/art.height);
 const width=Math.round(art.width*scale),height=Math.round(art.height*scale);
 ctx.drawImage(picture,Math.round(x+(w-width)/2),Math.round(y+h-height),width,height);
}
function paintEnemy(key,x,y,w,h){paintCombatant(enemyCombatArt({key}),x,y,w,h);}
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h)}
function poly(points,c){ctx.fillStyle=c;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill()}
function text(s,x,y,col='#e9d6a3',size=8){ctx.font=`bold ${size}px monospace`;ctx.textAlign='left';ctx.fillStyle='#13242c';ctx.fillText(s,x+1,y+1);ctx.fillStyle=col;ctx.fillText(s,x,y)}
function rnd(i){return ((Math.sin(i*127.1+41.7)*43758.5453)%1+1)%1}
function panorama(b,x,y,scale){
 const region=assets.worlds[b.id],sheet=region&&img(region.image);
 if(sheet)paintHorizon(ctx,sheet,region,x,y,scale);
}
function landscape(b){
 // Mirrored panels share the edge pixel; integer placement keeps it crisp in motion.
 const span=512,offset=Math.round(roadTravel*.14),first=Math.floor(offset/span);
 for(let i=first;i<=first+1;i++){
  const x=i*span-offset;
  ctx.save();
  if(i%2){ctx.translate(x+span,0);ctx.scale(-1,1);panorama(b,0,28,2);}
  else panorama(b,x,28,2);
  ctx.restore();
 }
}
function roadside(b){const spacing=128,offset=roadTravel*3.6,first=Math.floor(offset/spacing),ground=ROAD_GROUND.foreground;
 for(let j=first-1;j<=first+4;j++){const x=j*spacing-offset,c=b.id==='snow'?'#a7afa8':b.id==='salt'?'#868c7b':'#5c685b';
  poly([[x,ground],[x+5,ground-7],[x+6,ground],[x+12,ground-10],[x+12,ground],[x+22,ground-4],[x+30,ground+3]],c);
  rect(x+57,ground-2,13,4,'#4b5551');rect(x+61,ground-3,7,2,'#88907e');
 }
}
let transitionLayer=null,incomingLandscape=null;
function blendedLandscape(from,to,blend){
 if(from.id===to.id||blend<=0){landscape(from);return;}
 if(blend>=1){landscape(to);return;}
 // Composite complementary masks before painting over the sky. This prevents
 // translucent upper horizons doubling in opacity halfway through a transition.
 const layer=()=>{const c=document.createElement('canvas');c.width=W;c.height=180;return c;};
 if(!transitionLayer){transitionLayer=layer();incomingLandscape=layer();}
 const main=ctx,edge=W+96-blend*(W+192);
 try{
  for(const [target,biome,incoming] of [[transitionLayer,from,false],[incomingLandscape,to,true]]){
   const q=target.getContext('2d');ctx=q;q.clearRect(0,0,W,180);q.imageSmoothingEnabled=false;landscape(biome);
   const mask=q.createLinearGradient(edge-96,0,edge+96,0);mask.addColorStop(0,incoming?'#0000':'#000');mask.addColorStop(1,incoming?'#000':'#0000');q.globalCompositeOperation='destination-in';q.fillStyle=mask;q.fillRect(0,0,W,180);q.globalCompositeOperation='source-over';
  }
  const q=transitionLayer.getContext('2d');q.globalCompositeOperation='lighter';q.drawImage(incomingLandscape,0,0);q.globalCompositeOperation='source-over';
 }finally{ctx=main;}ctx.drawImage(transitionLayer,0,0);
}
function road(from,to,blend,light){
 const sky=drawJourneySky(ctx,{seed:state.seed,seconds:clock,travel:roadTravel,minutes:lightMinute,from,to,blend,light,storm:stormStrength,soft:reduced,above:Math.max(0,stageTop)});
 // Let the sky colour show through the terrain very slightly on hazy days.
 ctx.save();ctx.globalAlpha=1-sky.mist*.35;blendedLandscape(from,to,blend);ctx.restore();
 rect(0,165,W,75,'#303c43');rect(0,165,W,5,'#6c7569');rect(0,170,W,2,'#222f38');rect(0,174,W,1,'#8c907b');
 for(let i=-1;i<8;i++){const x=i*96-roadTravel*3.7%96;rect(x,223,48,3,'#c7bd92');rect(x+3,224,39,1,'#aaa68c');poly([[x+31,184],[x+39,189],[x+35,194],[x+50,201]],'#222d35');}
 for(let i=0;i<62;i++){const x=(i*71-roadTravel*(2.4+rnd(i)*1.2)%440+440)%440;rect(x,178+rnd(i+46)*57,2+i%4,1,i%3?'#465157':'#626d6a');}
 rect(0,234,W,2,'#949680');rect(0,236,W,4,'#525f57');
 const below=stageHeight-stageTop-H;
 if(below>0){
  rect(0,H,W,below,'#525f57');
  for(let i=0;i<26;i++){
   const x=(i*71-(roadTravel*3.8)%473+473)%473-40,y=H+Math.floor(rnd(i+8)*below);
   rect(x,y,4+i%12,1,i%3?'#626d60':'#424e4c');
  }
 }
 // Finish the asphalt before placing any grounded silhouettes. The pylon stands
 // on the far verge; props and traffic can occlude it as they pass in front.
 const marker=490-roadTravel*.85%930,pylon=assets.occupation.pylon,base=groundedBox(pylon,marker,ROAD_GROUND.pylon,27,72);
 groundShadow(ctx,pylon,base);paint(pylon,base.x,base.y,base.width,base.height);
 const scenery=b=>drawRoadside(ctx,{seed:state.seed,region:b,travel:roadTravel,seconds:clock,assets,image:img});
 if(from.id===to.id)scenery(from);else{ctx.globalAlpha=1-blend;scenery(from);ctx.globalAlpha=blend;scenery(to);ctx.globalAlpha=1;}
}
const roomForEvent={
 gas:'garage',garage:'garage',motel:'hotel',clinic:'clinic',pharmacy:'clinic',
 stall:'shop',market:'shop',shop:'shop',nest:'nest',eggs:'nest',spores:'nest',pit:'ruin',rocks:'ruin'
};
function room(top=0,height=H){
 const eventKind=encounters[state.current?.event?.id]?.kind;
 const frameKind=state.frames?.at(-1)?.scene;
 const kind=roomForEvent[eventKind]||roomForEvent[frameKind]||frameKind;
 const scene=assets.interiors[kind]?kind:'warehouse';
 const a=assets.interiors[scene],sheet=img(a.image);
 if(sheet){
  const [sx,sy,sw,sh]=a.rect,scale=W/sw,h=sh*scale,y=top+Math.round((height-h)*.55);
  // Extra portrait height continues the ceiling and floor, keeping doors and desks in frame.
  if(y>top)ctx.drawImage(sheet,sx,sy,sw,1,0,top,W,y-top);
  const floor=y+h;
  if(floor<top+height)ctx.drawImage(sheet,sx,sy+sh-1,sw,1,0,floor,W,top+height-floor);
  ctx.drawImage(sheet,sx,sy,sw,sh,0,y,W,h);
 }else rect(0,top,W,height,'#2b3b49');
}
function vehicle(v,party,x,y,w,rolling=false,ground=null){const a=vehicleArt(assets,v),scale=w/160,bump=rolling&&!reduced&&ground===null?Math.round(Math.sin(roadTravel*.14)+Math.sin(roadTravel*.3)*.35)*scale*.55:0,h=w*72/160;y=ground===null?y+bump:ground-h*groundRatio(a);
 rect(x+10,ground===null?y+h-5:ground-1,w-15,ground===null?4:2,'#1d2c31');a.windows.forEach((win,i)=>{if(party[i])paint(proceduralPortraitDataUri(party[i])||assets.portraits[party[i].race],x+win.x*scale,y+win.y*scale,Math.min(win.width,win.height)*scale,Math.min(win.width,win.height)*scale)});paint(a.image,x,y,w,h);
 if(rolling&&!reduced)for(const wx of [36,124]){const cx=x+wx*scale,cy=y+59*scale;ctx.save();ctx.translate(cx,cy);ctx.rotate(roadTravel*.32);rect(-3*scale,-1*scale,6*scale,2*scale,'#b4b9a6');rect(-1*scale,-3*scale,2*scale,6*scale,'#7b8d89');ctx.restore()}
 (vehicleStats(assets,v).weapon.bonus>0&&vehicleStats(assets,v).weapon.style!=='ram'?['gun']:(v.mods||[]).filter(m=>m==='lamp').slice(0,1)).forEach(m=>paint(assets.mods[m],x+w*.36,y-11*scale,w*.3,w*.3));
 if(rolling)for(let i=0;i<5;i++){const k=(roadTravel*.065+i*.21)%1;rect(x+7-k*35,y+h-7-k*8,3+k*9,2+k*4,`rgba(194,177,139,${.24*(1-k)})`)}
}
function person(p,x,y,h=48,walk=false){const picture=proceduralCharacterDataUri(p)||assets.characters[p.race+'_'+p.profession],ground=y+h,sway=walk&&!reduced?Math.round(Math.sin(clock*17)*.6):0,bob=!reduced?Math.round(Math.sin(clock*2.8+x*.13)*.6):0,box=groundedBox(picture,x+sway,ground,h*2/3,h);groundShadow(ctx,picture,box,.5);paint(picture,box.x,box.y+bob,box.width,box.height);return {cx:box.x+box.width/2,cy:box.y+bob,id:p.id};}
function cueDriver(){
 const driver=state.party.find(p=>p.id===state.driver);
 if(driver)cueAnchor=person(driver,48,157,49);
}
function particles(effect,t){const kind=effect||'none';if(kind==='none')return;
 for(let i=0;i<30;i++){const a=rnd(i+4),b=rnd(i+91),v=(t*(.2+b*.3)+a)%1;
 if(['fire','smoke','gas','spores'].includes(kind)){const x=244+Math.sin(i+t)*25+a*52,y=166-v*94;const color=kind==='fire'?(i%2?'#ecb451':'#d27642'):kind==='spores'?'#a7b679':kind==='gas'?'#b1b577':'#88918a';ctx.globalAlpha=(1-v)*.65;rect(x,y,kind==='spores'?2:5+v*12,kind==='spores'?2:7+v*10,color)}
 if(['rain','drip'].includes(kind)){const x=(a*480-t*28)%430,y=(b*240+t*150)%240;rect(x,y,1,8,kind==='rain'?'#b7c89b':'#a3c0bf');}
 if(['fog','dust'].includes(kind)){ctx.globalAlpha=.12;rect((a*580-t*18+580)%580-90,b*200,70,11,kind==='dust'?'#d6bd83':'#bac7c1');}
 if(kind==='water'){rect(177+a*155,178+b*32+Math.sin(t*3+i)*2,10,1,'#a5c1bd');}
 if(kind==='sparks'&&Math.sin(t*9+i)> .6)rect(236+a*63,110+b*75,2,5,'#e9db85');
 if(kind==='signal'&&i<3){ctx.strokeStyle='#8ec6ae';ctx.globalAlpha=(1-v)*.7;ctx.strokeRect(265-v*25,97-v*19,v*50,v*38)}
 if(kind==='lantern'){if(i===0){const pulse=.16+Math.sin(t*4.5)*.05;ctx.globalAlpha=pulse;rect(246,118,52,44,'#f0c472');}else if(i<12){ctx.globalAlpha=(1-v)*.7;rect(242+a*62+Math.sin(t*2+i)*6,162-v*58,2,2,i%2?'#f6da8a':'#df9852');}}
 if(kind==='glint'&&i<10){const phase=(t*1.6+a*4)%1;if(phase<.35){const gx=218+a*110,gy=112+b*66,s=phase<.18?3:1;ctx.globalAlpha=.85;rect(gx-s,gy,s*2+1,1,'#f8ecc2');rect(gx,gy-s,1,s*2+1,'#f8ecc2');}}
 if(kind==='weld'&&i<14){const burst=Math.sin(t*11+i*1.7);if(burst>.55){const wx=252+a*42,wy=128+b*34;ctx.globalAlpha=.9;rect(wx,wy,2,2,i%3?'#b5ecff':'#fff6cc');rect(wx+(a-.5)*14,wy+(b-.2)*14,1,2,'#f0b868');}}
 if(kind==='motes'&&i<16){ctx.globalAlpha=.28+Math.sin(t*1.8+i)*.14;rect(200+a*140+Math.sin(t*.7+i)*8,88+b*96+Math.cos(t*.5+i)*4,2,2,i%2?'#ded8ba':'#a9b8b4');}
 if(kind==='rubble'&&i<12){const ry=(t*(.45+b*.35)+a)%1;ctx.globalAlpha=(1-ry)*.75;rect(215+a*110,92+ry*92,2+(i%3),2,'#9c9484');}
 if(kind==='frost'&&i<16){ctx.globalAlpha=.45+Math.sin(t*3+i)*.25;rect(202+a*138,118+b*70+Math.sin(t+i)*2,3,1,'#d6eef2');if(i%3===0)rect(203+a*138,117+b*70,1,3,'#ffffff');}
 if(kind==='alert'){if(i<3){ctx.strokeStyle='#e57f68';ctx.globalAlpha=(1-v)*.65;ctx.strokeRect(268-v*28,116-v*18,v*56,v*36);}else if(i<10&&Math.sin(t*8+i)>.4){ctx.globalAlpha=.8;rect(226+a*88,124+b*48,3,2,'#f29b6b');}}
 ctx.globalAlpha=1;
 }
}
let arenaCanvas=null,arenaKey='';
function outdoorArena(biome){
 const light=lightingAt(state.minutes);
 ctx.save();ctx.translate(0,stageTop);
 drawJourneySky(ctx,{seed:state.seed,seconds:0,travel:0,minutes:state.minutes,from:biome,light,above:Math.max(0,stageTop)});
 panorama(biome,-64,17,2);
 rect(0,164,W,Math.max(0,stageHeight-stageTop-164),'#3b494d');
 rect(0,164,W,4,'#677373');rect(0,168,W,2,'#4a5659');
 for(let i=0;i<25;i++)rect((i*71)%W,176+(i*43)%107,4+i%8,1,'#536063');
 ctx.globalAlpha=(1-light.light)*.72;rect(0,-stageTop,W,stageHeight,'#07152c');
 ctx.restore();
}
function battleBackground(){const indoors=state.current?.inside||state.frames?.at(-1)?.kind==='building',biome=biomeAt(state.progress,state.seed,state.route),next=[indoors,biome.id,state.current?.event?.id,state.frames?.at(-1)?.scene,state.seed,state.minutes,imageRevision,stageHeight].join(':');
 if(!arenaCanvas){arenaCanvas=document.createElement('canvas');arenaCanvas.width=W;}
 if(arenaCanvas.height!==stageHeight){arenaCanvas.height=stageHeight;arenaKey='';}
 if(next!==arenaKey){const main=ctx;try{ctx=arenaCanvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,W,stageHeight);if(indoors)room(0,stageHeight);else outdoorArena(biome);
  rect(0,0,W,stageHeight,indoors?'#0e192b64':'#0e192b82');arenaKey=next;
 }finally{ctx=main;}}
 ctx.drawImage(arenaCanvas,0,-stageTop);
}
const carAnchor={cx:170,cy:196};
let formation,liveVehicleAnchor={cx:170,cy:196},liveVehiclePoints=[];
function battleFormation(b){
 if(formation?.enemies===b.enemies&&formation.mode===b.mode)return formation;
 const enemies=b.enemies,layout=enemyLayout(enemies.length,enemies);
 const art=enemies.map(enemyCombatArt);
 // Match the centre of mass inside the fitted sprite, including short quadrupeds
 // and the low profile of a vehicle. Formation lanes remain stable for aiming.
 const points=layout.map((lane,i)=>{
  if(b.mode==='vehicle')return {...lane,cy:112+(enemies.length>1?106:175)*.23};
  const sprite=art[i],scale=Math.min((lane.w+14)/sprite.width,lane.h/sprite.height);
  const lowBody=['hound','crawler','brute','turret'].includes(sprite.key);
  return {...lane,cy:Math.round(lane.cy+lane.h/2-sprite.height*scale*(lowBody ? .40 : .51))};
 });
 formation={enemies,mode:b.mode,layout,art,points};
 return formation;
}
function paintBattleBusts(age,layout,bottom){
 if(state.battle?.mode==='vehicle')return;
 const foeId=beat.side==='party'?beat.target:beat.actor;
 const foe=layout[state.battle.enemies.findIndex(e=>e.id===foeId)];
 for(const p of state.party){
  const role=bustRole(beat,p.id);
  if(!role)continue;
  const anchor=partyAnchor(state.party,p.id,bottom-29);
  if(!anchor)continue;
  const direction=(foe?.cx??192)>=anchor.cx?1:-1;
  const pose=bustPose(role,age*1000,direction,reduced);
  if(!pose||pose.height<1)continue;
  const picture=combatPicture(npcCombatArt(p));
  if(!picture)continue;
  const width=88,scale=width/picture.width;
  const top=bottom-pose.height+pose.y,left=anchor.cx-width/2+pose.x;
  // Draw down to the waist only. Integer scan bands keep the recoil on the pixel grid.
  const waist=Math.round(picture.height*.61);
  ctx.save();ctx.globalAlpha=pose.alpha;
  // The drawn weapon points left. Face the opponent without changing lanes.
  if(direction>0){ctx.translate(left*2+width,0);ctx.scale(-1,1);}
  if(!pose.lean){
   ctx.drawImage(picture,0,0,picture.width,waist,left,top,width,Math.round(waist*scale));
  }else{
   for(let row=0;row<waist;row+=4){
    const h=Math.min(4,waist-row),dy=Math.round(row*scale),end=Math.round((row+h)*scale);
    const shift=Math.round(pose.lean*(1-row/waist))*(direction>0?-1:1);
    ctx.drawImage(picture,0,row,picture.width,h,left+shift,top+dy,width,end-dy);
   }
  }
  ctx.restore();
 }
}
function drawVehicleExplosion(cx,cy,u){
 const t=clamp01(u),fade=1-t;
 // Rising dark smoke plume
 for(let i=0;i<6;i++){
  const a=i*1.05+t*1.2,r=6+t*26+(i%2)*8,sz=Math.round((8+t*10)*fade+2);
  ctx.globalAlpha=fade*.75;
  rect(cx+Math.cos(a)*r-sz/2,cy-t*22+Math.sin(a)*r*.5-sz/2,sz,sz,i%2?'#323742':'#4e5461');
 }
 // Layered 16-bit pixel fireball (outer crimson -> mid orange -> white-hot core)
 if(t<.85){
  const k=clamp01(t/.35),shrink=1-clamp01((t-.35)/.5);
  const r1=Math.round((10+k*20)*shrink),r2=Math.round((7+k*13)*shrink),r3=Math.round((4+k*7)*shrink);
  ctx.globalAlpha=Math.min(1,shrink*1.2);
  if(r1>1)rect(cx-r1,cy-r1*.75,r1*2,r1*1.5,'#d65a4f');
  if(r2>1)rect(cx-r2,cy-r2*.75,r2*2,r2*1.5,'#f4a261');
  if(r3>1&&t<.55)rect(cx-r3,cy-r3*.75,r3*2,r3*1.5,'#fff4cc');
 }
 // Flying pixel sparks & metal debris shards
 ctx.globalAlpha=fade;
 for(let i=0;i<12;i++){
  const a=i*0.523+0.3,dist=8+t*44*(0.7+(i%3)*.25),gx=cx+Math.cos(a)*dist,gy=cy+Math.sin(a)*dist*.65+t*t*18;
  rect(gx,gy,i%3?3:4,i%2?2:3,i%3===0?'#fff3c4':i%3===1?'#f4a261':'#7d8694');
 }
 ctx.globalAlpha=1;
}
function vehicleChase(){
 const b=state.battle,enemies=b.enemies,age=(performance.now()-beatAt)/1000,since=age*1000-IMPACT_MS;
 const isRam=beat?.kind==='attack'&&(beat.visual?.id==='ram'||!beat.ranged);
 const playerW=120,enemyW=enemies.length>1?106:132;
 // Player cruises along foreground highway lane; enemies dynamically surge ahead and fall behind!
 const motionScale=reduced?.6:1;
 const basePX=120+Math.round((Math.sin(clock*1.05)*24+Math.cos(clock*.55)*10)*motionScale),basePY=168;
 const enemyBases=enemies.map((e,i)=>({
  x:126+Math.round((Math.sin(clock*1.45+i*2.15)*96+Math.cos(clock*.72+i*1.3)*26)*motionScale),
  y:116+(i%2)*8+Math.round(Math.cos(clock*2.1+i)*2*motionScale)
 }));
 let px=basePX,py=basePY;
 const exs=enemyBases.map(p=>p.x),eys=enemyBases.map(p=>p.y);
 // Real physical ramming & weapon recoil choreography on live moving vehicles
 if(beat&&age>=0&&age<=BEAT_MS/1000){
  const lunge=clamp01(age/(IMPACT_MS/1000)),recoil=since>=0?1-clamp01(since/280):0;
  const shudder=since>=0&&since<240?Math.round(Math.sin(since*.09)*4*recoil):0;
  if(beat.side==='party'&&beat.kind==='attack'){
   const ti=Math.max(0,enemies.findIndex(e=>e.id===beat.target));
   if(isRam){
    // Player car physically accelerates & swerves directly into the enemy car's chassis!
    const reach=since<0?Math.pow(lunge,1.6):recoil*0.25;
    px=Math.round(basePX+(enemyBases[ti].x-basePX)*reach+shudder);
    py=Math.round(basePY+(enemyBases[ti].y+6-basePY)*reach+(since>=0?recoil*12:0));
    if(since>=0){
     exs[ti]+=Math.round((enemyBases[ti].x>=basePX?1:-1)*recoil*22-shudder);
     eys[ti]-=Math.round(recoil*14);
    }
   }else{
    // Weapon fire kickback
    px=basePX-Math.round(recoil*6);
    if(since>=0)exs[ti]+=Math.round(recoil*8+shudder);
   }
  }else if(beat.side==='enemies'&&beat.kind==='attack'){
   const ai=Math.max(0,enemies.findIndex(e=>e.id===beat.actor));
   if(isRam){
    // Enemy car physically swerves & slams directly into the player car's chassis!
    const reach=since<0?Math.pow(lunge,1.6):recoil*0.25;
    exs[ai]=Math.round(enemyBases[ai].x+(basePX-enemyBases[ai].x)*reach+shudder);
    eys[ai]=Math.round(enemyBases[ai].y+(basePY-6-enemyBases[ai].y)*reach-(since>=0?recoil*12:0));
    if(since>=0){
     px+=Math.round((basePX>=enemyBases[ai].x?1:-1)*recoil*20-shudder);
     py+=Math.round(recoil*12);
    }
   }else{
    exs[ai]=enemyBases[ai].x-Math.round(recoil*6);
    if(since>=0)py+=Math.round(recoil*6+shudder);
   }
  }
 }
 // Speed lines to emphasize continuous highway chase
 ctx.globalAlpha=.22;
 for(let i=0;i<6;i++){const sx=W-((roadTravel*2.6+i*73)%(W+48));rect(sx,108+i*18,24+(i%3)*10,1,'#e8dec2');}
 ctx.globalAlpha=1;
 liveVehiclePoints=[];
 for(const [i,e] of enemies.entries()){
  const struck=beat?.effects.some(f=>f.side==='enemies'&&f.id===e.id&&f.amount<0);
  const knockout=e.hp<=0;
  const koDrift=knockout&&struck&&since>=0?Math.round(since*.11):0;
  const koShake=knockout&&struck&&since>=0&&since<240?Math.round(Math.sin(since*.12)*3):0;
  const ex=Math.max(4,Math.min(W-enemyW-4,exs[i]-koDrift+koShake)),ey=eys[i];
  const ec={cx:Math.round(ex+enemyW/2),cy:Math.round(ey+enemyW*72/160*0.5)};
  liveVehiclePoints.push(ec);
  if(knockout&&(!struck||since>=580))continue;
  ctx.save();
  if(knockout&&struck&&since>=0){
   // Rapid flicker before exploding into 16-bit fireballs & debris
   if(since<240){
    const blink=Math.floor(since/45)%2===0;
    ctx.globalAlpha=blink?.28:1;
    vehicle({model:e.vehicle||'armored',mods:e.hasWeapon?['gun']:[]},[],ex,ey,enemyW,true);
    ctx.globalAlpha=.9;
    rect(ec.cx-8+koShake,ec.cy-8,4,4,'#f4a261');
    rect(ec.cx+6-koShake,ec.cy-10,5,5,'#3a3f4a');
   }
   if(since>=160){
    drawVehicleExplosion(ec.cx,ec.cy,(since-160)/420);
   }
  }else{
   vehicle({model:e.vehicle||'armored',mods:e.hasWeapon?['gun']:[]},[],ex,ey,enemyW,true);
  }
  ctx.restore();
 }
 const finalPX=Math.max(4,Math.min(W-playerW-4,px));
 liveVehicleAnchor={cx:Math.round(finalPX+playerW/2),cy:Math.round(py+playerW*72/160*0.5)};
 vehicle(state.vehicle,state.party,finalPX,py,playerW,true);
 // Crisp metallic collision sparks right between colliding bumpers during a ram impact
 if(beat&&isRam&&since>=0&&since<300){
  const u=since/300,ti=Math.max(0,enemies.findIndex(e=>e.id===(beat.side==='party'?beat.target:beat.actor)));
  const ep=liveVehiclePoints[ti]||liveVehicleAnchor;
  const mx=Math.round((liveVehicleAnchor.cx+ep.cx)/2),my=Math.round((liveVehicleAnchor.cy+ep.cy)/2);
  if(u<.28)rect(mx-5,my-3,10,6,'#fff4cc');
  for(let k=0;k<12;k++){const a=k*0.523+u*1.8,r=5+u*28;rect(mx+Math.cos(a)*r,my+Math.sin(a)*r,k%2?3:2,2,k%3?'#fff0cc':'#f0a050');}
 }
}
function battle(){
 const b=state.battle;if(!b)return;
 if(b.mode==='vehicle'){vehicleChase();return;}
 const {enemies,layout,art}=battleFormation(b);
 const age=(performance.now()-beatAt)/1000,since=age*1000-IMPACT_MS;
 battleBackground();
 for(const [i,e] of enemies.entries()){
  const l=layout[i],struck=beat?.effects.some(f=>f.side==='enemies'&&f.id===e.id&&f.amount<0);
  const knockout=e.hp<=0;
  if(knockout&&(!struck||since>=580))continue;
  const attacking=beat?.side==='enemies'&&beat.actor===e.id&&['attack','psi'].includes(beat.kind);
  const victim=partyAnchor(state.party,beat?.target);
  const direction=(victim?.cx??l.cx)>=l.cx?1:-1;
  const push=attacking&&!reduced?clamp01((age-.22)/.12)*(1-clamp01((age-.40)/.18)):0;
  const recoil=struck&&since>=0&&!reduced?1-clamp01((since-60)/160):0;
  const actor=partyAnchor(state.party,beat?.actor);
  const away=l.cx>=(actor?.cx??l.cx)?1:-1;
  const dx=Math.round(push*6*direction+away*recoil*5);
  const y=l.cy-l.h/2+Math.round(push*9-recoil*3+(reduced||knockout?0:Math.sin(clock*1.8+i)));
  ctx.save();
  if(knockout&&struck&&since>=0){
   const floating=['drone','wing','swarm'].includes(e.key)||e.bossId==='fallen_angel';
   const fade=1-clamp01((since-220)/360);
   const blink=since>=180?(Math.floor(since/52)%2===0?.15:1):1;
   ctx.globalAlpha=fade*blink;
   if(floating){
    // Aerial enemy shudders, drops, and bursts with pixel sparks as it flickers out
    const drop=Math.round(clamp01(since/320)*18),sh=Math.round(Math.sin(since*.14)*3);
    paintCombatant(art[i],l.cx-l.w/2-7+sh,y+drop,l.w+14,l.h);
    if(since<360){
     const u=since/360;
     for(let k=0;k<6;k++){const a=k*1.05+u,r=5+u*22;rect(l.cx+Math.cos(a)*r,l.cy+drop+Math.sin(a)*r,2,2,k%2?'#fff0cc':'#f0a050');}
    }
   }else{
    // Grounded enemy topples sideways 90deg onto the ground, kicks up dust, then flickers out!
    const fall=ease(clamp01(since/220)),dir=i%2===0?1:-1;
    const pivX=l.cx,pivY=l.cy+l.h/2;
    rect(l.cx-l.w*.42,pivY+3,l.w*.84,4,'#101b2b66');
    ctx.save();
    ctx.translate(pivX,pivY);
    ctx.rotate(dir*Math.PI*0.48*fall);
    paintCombatant(art[i],-l.w/2-7,-l.h,l.w+14,l.h);
    ctx.restore();
    if(since>=160&&since<380){
     const du=(since-160)/220;ctx.globalAlpha=(1-du)*.65;
     for(let k=0;k<5;k++)rect(pivX+dir*(10+k*8+du*12),pivY-2-du*10+(k%2)*3,3,2,'#c7bfa8');
    }
   }
  }else{
   rect(l.cx-l.w*.36,l.cy+l.h/2+4,l.w*.72,4,'#101b2b88');
   paintCombatant(art[i],l.cx-l.w/2-7+dx,y,l.w+14,l.h);
  }
  ctx.restore();
 }
}
function battleForeground(){
 if(!beat)return;
 const age=(performance.now()-beatAt)/1000;
 if(age<0||age>BEAT_MS/1000)return;
 const b=state.battle,{enemies,layout,points}=battleFormation(b);
 const bottom=stageHeight-stageTop;
 paintBattleBusts(age,layout,bottom);
 const isVeh=b.mode==='vehicle';
 const fromCar=isVeh&&(beat.side==='enemies'||beat.kind==='attack'||beat.kind==='defend'||beat.kind==='escape');
 drawBattleEffects(ctx,{beat,age,enemies,layout:isVeh&&liveVehiclePoints.length?liveVehiclePoints:points,party:state.party,partyY:bottom-29,vehicleTarget:fromCar?(isVeh?liveVehicleAnchor:carAnchor):null,soft:reduced});
}
function encounterArt(current){
 if(!current?.event)return null;
 const id=current.event.id;
 let a=encounters[id];
 if(!a){
  if(id==='police_human')return {image:encounters.road_072?.image,kind:'checkpoint',effect:'alert',title:'人類警察臨檢路障',interior:false,empty:false,creatures:['soldier','soldier']};
  if(id==='police_alien')return {image:encounters.road_072?.image,kind:'checkpoint',effect:'alert',title:'外星執法巡邏攔檢',interior:false,empty:false,creatures:['sentinel','drone']};
  if(id==='final_gate'||current.finalGate)return {image:encounters.road_072?.image,kind:'checkpoint',effect:'alert',title:current.event.title||'樂園之前',interior:false,empty:false,creatures:[],bossId:state?.finalBoss?.id};
  if(id==='stranded_search'||current.event.title==='尋找出路')return {image:encounters.road_013?.image,kind:'toolbox',effect:'glint',title:'尋找出路',interior:false,empty:false,creatures:[]};
  return {image:encounters.road_011?.image,kind:'crate',effect:'motes',title:current.event.title||'路旁片刻',interior:false,empty:false,creatures:[]};
 }
 if(current?.inside&&a&&!a.interior){const inner={gas:'019',garage:'020',clinic:'021',motel:'022',pharmacy:'017',market:'016',stall:'016',cars:'025',warehouse:'001'}[a.kind];if(inner)a=encounters['building_'+inner];}
 return a;
}
function drawEncounter(current,x,interior=false,preview=false){const a=encounterArt(current);if(!a)return;const collected=!preview&&!current?.event.options?.length&&!current?.dialogue&&['crate','luggage','toolbox','medicalbox','bag','cache','gift'].includes(a.kind);if(collected)ctx.globalAlpha=.45;const facade=!interior&&assets.facilities?.[a.kind],sheet=facade&&img(facade.image);if(sheet){const box=groundedBox(facade,x,ROAD_GROUND.encounter,203);groundShadow(ctx,facade,box,.35);ctx.drawImage(sheet,...facade.rect,box.x,box.y,box.width,box.height);}else paint(a.image,x,interior?68:54,interior?195:203,interior?136:142);ctx.globalAlpha=1;
 if(current.place&&!current.place.inherited){const label=current.place.name;if(!interior){rect(x+22,133,3,ROAD_GROUND.encounter-133,'#7b837a');rect(x+179,133,3,ROAD_GROUND.encounter-133,'#7b837a');}rect(x+8,interior?45:110,187,24,'#142d36');rect(x+10,interior?47:112,183,1,'#b8b28c');text(label,x+18,interior?62:127,'#ece1b9',Math.min(13,166/label.length));}
 if(collected)text('已搜索',x+65,145,'#d4c28b',10);
 if(a.effect!=='storm'){ctx.save();ctx.translate(x-174,0);particles(a.effect,clock);ctx.restore();}
 if(a.bossId){const floatBoss=a.bossId==='fallen_angel',by=floatBoss?74+Math.sin(clock*2)*3:ROAD_GROUND.encounter-124;paintCombatant(enemyCombatArt({bossId:a.bossId}),x+34,by,124,124);}
 (a.creatures||[]).forEach((k,i)=>{const floating=['drone','wing','swarm'].includes(k),left=x+23+i*37,idle=!reduced?Math.round(Math.sin(clock*(floating?3.2:2.4)+i*1.7)*(floating?3:1)):0;if(!floating&&!interior)rect(left+10,ROAD_GROUND.encounter-1,30,2,'#172a3280');paintEnemy(k,left,(floating||interior?131:ROAD_GROUND.encounter-58)+idle,50,58);});
 if(current.npc&&!(encounterCue&&current.npc.id===state.driver))person(current.npc,x+(interior?104:114),interior?147:153,interior?54:43);
 if(!preview&&!encounterCue&&(interior||current.dialogue)){const actor=state.party.find(p=>p.id===state.actorId&&p.hp>0)||state.party.find(p=>p.hp>0);if(actor)person(actor,interior?48:134,interior?157:166,interior?49:38,clock-eventAt<1.5)}
}
function updateReadouts(minutes,pose,view,driving){const biome=view.current;const minute=Math.floor(minutes),stamp=minute+':'+Math.round(pose.speed)+':'+biome.name+':'+driving+':'+view.remainingKm;if(stamp===displayMinute)return;displayMinute=stamp;const time=document.getElementById('journey-time'),speedEl=document.getElementById('journey-speed'),place=document.getElementById('journey-place');if(time)time.textContent=`第 ${Math.floor(minute/1440)+1} 天 · ${phaseName(minute)} ${String(Math.floor(minute/60)%24).padStart(2,'0')}:${String(minute%60).padStart(2,'0')}`;if(speedEl)speedEl.textContent=driving?Math.round(pose.speed):0;if(place)place.textContent=biome.name;const distance=document.getElementById('journey-distance'),progress=document.getElementById('journey-progress');if(distance)distance.textContent=view.remainingKm.toLocaleString('en-US');if(progress){progress.style.width=(100-view.remainingKm/10)+'%';progress.parentElement.setAttribute('aria-label','距離樂園還剩 '+view.remainingKm+' 公里');}}
function frame(time){requestAnimationFrame(frame);if(!canvas?.isConnected||document.hidden){lastTime=time;return}if(time-lastFrame<33)return;const dt=Math.min((time-lastTime)/1000,.08)||.033;lastTime=time;lastFrame=time;clock+=dt;reduced=reducedMotion();
 cueAnchor=null;
 const s=state,titleDrive=!!s.titleDrive,driving=s.mode==='driving'||titleDrive,carFight=s.battle?.mode==='vehicle',u=titleDrive?.5:driving?clamp01((time-travelAt)/tripDuration):1,pose=tripPose(u),interior=!titleDrive&&(encounterCue?.inside??(s.current?.inside||s.frames?.at(-1)?.kind==='building'));
 // Both travelling and stopped use this camera, including the very last frame.
 const settle=1-Math.exp(-dt*8);viewZoom+=(pose.zoom-viewZoom)*settle;viewCarX+=(pose.carX-viewCarX)*settle;
 if(driving||carFight)roadTravel+=dt*(carFight?88:pose.speed)*speed;
 const minute=titleDrive?(s.minutes+clock*12)%1440:s.minutes+(driving?60*u:0);if(lightMinute===null||Math.abs(minute-lightMinute)>120)lightMinute=minute;else lightMinute+=(minute-lightMinute)*(1-Math.exp(-dt*5));const light=lightingAt(lightMinute);
 const view=routeView(titleDrive?{...s,progress:1+(clock*.35)%98}:s,u),{from,to,blend}=view;ctx.clearRect(0,-stageTop,W,stageHeight);
 const outdoors=!(interior&&!driving)&&(!s.battle||carFight),currentWeather=driving?s.travel?.preview?.current:s.current;
 const eventStorm=encounters[currentWeather?.event?.id]?.effect==='storm'?(driving?ease((u-.15)/.5):1):0;
 const ambientStorm=outdoors?ambientStormAt({seed:s.seed,biomeId:from.id,progress:s.progress||1,seconds:clock}):0;
 const stormTarget=outdoors?Math.max(eventStorm,ambientStorm):0;
 const weatherKey=s.seed+':'+(eventStorm>0?(currentWeather?.instance??s.stop):from.id)+':storm';if(stormTarget>.12&&weatherKey!==stormKey){stormKey=weatherKey;stormStarted=clock;}
 stormStrength+=(stormTarget-stormStrength)*(1-Math.exp(-dt*2));
 const weather=outdoors?{seed:s.seed,seconds:clock,travel:roadTravel,layers:weatherLayers({seed:s.seed,from,to,blend,seconds:clock,storm:stormStrength}),soft:reduced,light:light.light}:null;
 if(!s.battle||carFight){if(interior&&!driving&&!s.battle)room(-stageTop,stageHeight);else road(from,to,blend,light);}
 if(outdoors)drawWeatherSky(ctx,{seed:stormKey,seconds:clock-stormStarted,storm:stormStrength,soft:reduced});
 if(s.battle)battle();else if(interior&&!driving){drawEncounter(s.current,153,true);if(encounterCue)cueDriver();}else{ctx.save();ctx.translate(0,220*(1-viewZoom));ctx.scale(viewZoom,viewZoom);
  const current=driving?s.travel?.preview?.current:s.current;drawEncounter(current,driving?pose.eventX:210,false,driving||!!current?.approaching);
  if(driving&&s.travel?.preview?.battle&&(!current||current.finalGate)){const e=s.travel.preview.battle.enemies[0];if(e){const floating=['drone','wing','swarm'].includes(e.key)||e.bossId==='fallen_angel',left=pose.eventX+(e.bossId?25:53),width=e.bossId?132:55,height=e.bossId?132:67;if(!floating)rect(left+width*.2,ROAD_GROUND.encounter-1,width*.6,2,'#172a3280');if(e.npc)person(e.npc,left,ROAD_GROUND.encounter-height,height);else paintCombatant(enemyCombatArt(e),left,floating?(e.bossId?70:125):ROAD_GROUND.encounter-height,width,height);}}
  vehicle(s.vehicle,s.party,viewCarX,140,190,driving&&pose.speed>2,ROAD_GROUND.player);ctx.restore();
  if(encounterCue)cueAnchor=vehicleDriverAnchor(assets,s,{x:viewCarX,y:140,width:190,ground:ROAD_GROUND.player,zoom:viewZoom});
 }
 if(!interior&&(!s.battle||carFight)){if(from.id===to.id)roadside(from);else{ctx.globalAlpha=1-blend;roadside(from);ctx.globalAlpha=blend;roadside(to);ctx.globalAlpha=1;}}
 if(!s.battle||carFight){ctx.globalAlpha=(1-light.light)*.72;rect(0,-stageTop,W,stageHeight,'#07152c');ctx.globalAlpha=1;
 if(light.light<.68&&!interior){const x=(viewCarX+184)*viewZoom,y=185*viewZoom+220*(1-viewZoom);ctx.globalAlpha=(.68-light.light)*.55;poly([[x,y],[W,y-29],[W,y+18]],'#ffdf99');ctx.globalAlpha=1;rect(x-3,y-2,4,3,'#f3d894');}}
 if(outdoors)drawWeatherParticles(ctx,weather);
 if(s.battle)battleForeground();
 const elapsed=clock-actionAt;if(elapsed<1.3)feedback.forEach((f,i)=>text(f.text,f.x,104+i*17-elapsed*20,f.color,13));
 if(encounterCue)drawEncounterCue(ctx,cueAnchor,{age:(performance.now()-cueStartedAt)/1000,soft:reduced,top:-stageTop,width:W});
 updateReadouts(minute,carFight?{...pose,speed:Math.round(78+Math.sin(clock*1.4)*12)}:pose,view,driving||carFight);
}
requestAnimationFrame(frame);
export function mountWorld(el,s,a,eventArt,{duration=12000,travelStart=performance.now(),travelSpeed=1,target=null,playback:playing=false,encounterCue:nextCue=null}={}){canvas=el;ctx=canvas.getContext('2d',{alpha:false});ctx.imageSmoothingEnabled=false;state=s;assets=a;encounters=eventArt;tripDuration=duration;travelAt=travelStart;speed=travelSpeed;selectedTarget=target;playback=playing;displayMinute=-1;
 if(nextCue&&nextCue.key!==cueKey)cueStartedAt=nextCue.phase==='reading'?performance.now()-1000:performance.now();
 encounterCue=nextCue?{...nextCue}:null;cueKey=nextCue?.key??null;
 if(observedCanvas!==canvas){stageResize?.disconnect();stageResize?.observe(canvas);observedCanvas=canvas;}
 fitPixelStage();
 const next=s.current?.instance+':'+s.mode+':'+!!s.current?.inside;if(next!==key){eventAt=clock;key=next}
 // Warm actual approaching art so it is already on screen before stopping.
 const current=s.mode==='driving'?s.travel?.preview?.current:s.current;img(encounterArt(current)?.image);const facade=assets.facilities?.[encounterArt(current)?.kind];if(facade){img(facade.image);img(assets.interiors?.warehouse?.image);}img(assets.worlds?.[biomeAt(s.progress,s.seed,s.route).id]?.image);if(s.travel)img(assets.worlds?.[biomeAt(s.progress+s.travel.n,s.seed,s.route).id]?.image);if(s.current?.inside&&assets.interiors)Object.values(assets.interiors).slice(0,1).forEach(a=>img(a.image));
 if(current?.npc)combatPicture(npcCombatArt(current.npc));
 if(encounterCue){const driver=s.party.find(p=>p.id===s.driver);if(driver){img(a.portraits[driver.race]);img(a.characters[driver.race+'_'+driver.profession]);}}
 const upcoming=s.battle||s.travel?.preview?.battle;
 if(upcoming){
  if(upcoming.mode!=='vehicle')for(const e of upcoming.enemies)combatPicture(enemyCombatArt(e));
  for(const p of s.party)combatPicture(npcCombatArt(p));
 }
 canvas.setAttribute('aria-label',encounterCue?'駕駛察覺異狀':s.mode==='driving'?'車輛向東行駛，沿途景色向後流動':s.battle?'敵人在中央，隊伍在上方，戰鬥指令在下方訊息窗':encounters[s.current?.event.id]?.title||'公路旁的車輛');}
export function captureVisual(s){return {party:Object.fromEntries(s.party.map(p=>[p.id,p.hp])),hp:s.party.reduce((n,p)=>n+p.hp,0),vehicle:s.vehicle.hp,enemies:s.battle?.enemies.reduce((n,e)=>n+e.hp,0)||0,fuel:s.resources.fuel,scrap:s.resources.scrap,medicine:s.resources.medicine,round:s.battle?.round,mode:s.mode}}
export function animateResult(before,s,type){const after=captureVisual(s);for(const p of s.party){const el=document.querySelector(`[data-person="${p.id}"]`),diff=p.hp-(before.party?.[p.id]??p.hp);if(el&&diff){el.classList.add(diff<0?'was-hit':'was-healed');}}feedback=[];for(const [key,label,x,col] of [['hp','HP',45,'#e58d79'],['vehicle','車況',48,'#e58d79'],['enemies','',174,'#f0d38e'],['fuel','汽油',176,'#a8d0b8'],['scrap','廢料',176,'#d9bc79'],['medicine','藥品',176,'#a8d0b8']]){const diff=after[key]-before[key];if(diff)feedback.push({text:`${label} ${diff>0?'+':''}${diff}`,x,color:col})}if(feedback.length||before.round!==after.round||type==='psi'){actionAt=clock;actionKind=after.enemies<before.enemies?(type==='psi'?'psi':'attack'):'none'}}

export function extendTravelDuration(ms){if(Number.isFinite(ms)&&ms>tripDuration)tripDuration=ms;}
export function playBattleBeat(step){beat=step;beatAt=performance.now();feedback=[];actionAt=-10;return beatAt;}
export function clearBattleBeat(){beat=null;}
