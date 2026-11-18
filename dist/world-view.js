import {drawBattleEffects} from './battle-effects.js';
// Lightweight 384px stage: layered pixel art, no physics engine or continuous DOM writes.
import {reducedMotion} from './cinematics.js';
import {phaseName} from './engine.js';
import {routeView} from './route-runtime.js';
import {drawRoadside} from './roadside-art.js';
import {biomeAt,tripPose,enemyLayout,lightingAt,mixHex,ease,clamp01} from './journey-view-model.js';
const W=384,H=240,images=new Map();let reduced=reducedMotion();
let canvas,ctx,state,assets,encounters,lastFrame=0,lastTime=0,clock=0,roadTravel=0,eventAt=0,key='',actionAt=-10,feedback=[],actionKind='',travelAt=0,tripDuration=12000,speed=1,viewZoom=.84,viewCarX=24,displayMinute=-1,selectedTarget=null,lightMinute=null,beat=null,beatAt=0,playback=false;
function img(path){if(!path)return null;if(!images.has(path)){const i=new Image();i.src='assets/'+path;images.set(path,i)}const i=images.get(path);return i.complete&&i.naturalWidth?i:null}
function paint(path,x,y,w,h){const i=img(path);if(i)ctx.drawImage(i,Math.round(x),Math.round(y),w,h)}
function paintEnemy(key,x,y,w,h){const a=assets.enemyAtlas?.[key],p=a&&img(a.image);if(p){const [, ,sw,sh]=a.rect,scale=Math.min(w/sw,h/sh),dw=sw*scale,dh=sh*scale;ctx.drawImage(p,...a.rect,Math.round(x+(w-dw)/2),Math.round(y+h-dh),dw,dh);}else paint(assets.enemies[key]?.image,x,y,w,h);}
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h)}
function poly(points,c){ctx.fillStyle=c;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill()}
function text(s,x,y,col='#e9d6a3',size=8){ctx.font=`bold ${size}px monospace`;ctx.textAlign='left';ctx.fillStyle='#13242c';ctx.fillText(s,x+1,y+1);ctx.fillStyle=col;ctx.fillText(s,x,y)}
function rnd(i){return ((Math.sin(i*127.1+41.7)*43758.5453)%1+1)%1}
const quietLandscapes=new Map();
function panorama(b,x=0,y=0,w=W,h=174,alpha=1){const id=b.id||b,region=assets.worlds?.[id],picture=region&&img(region.image);ctx.save();ctx.globalAlpha=alpha;
 if(picture){let quiet=quietLandscapes.get(id);if(!quiet){quiet=document.createElement('canvas');quiet.width=768;quiet.height=340;const q=quiet.getContext('2d');q.imageSmoothingEnabled=false;q.filter='saturate(0.4) contrast(0.85) brightness(0.85)';q.drawImage(picture,...region.rect,0,0,768,340);q.filter='none';q.fillStyle='#29374233';q.fillRect(0,0,768,340);quietLandscapes.set(id,quiet);}ctx.drawImage(quiet,x,y,w,h);}
 else{rect(x,y,w,h,'#344452');paint(assets.scenes[(id==='city'?'city':id==='forest'?'forest':'alien')+'_morning'],x,y,w,h);}ctx.restore();}
function landscape(b,alpha=1){
 // Mirrored adjacent panels meet at the same edge; the horizon never stops scrolling.
 const span=512,offset=roadTravel*.14,first=Math.floor(offset/span);
 for(let i=first;i<=first+1;i++){const x=i*span-offset;ctx.save();if(i%2){ctx.translate(x+span,0);ctx.scale(-1,1);panorama(b,0,-20,span,200,alpha);}else panorama(b,x,-20,span,200,alpha);ctx.restore();}
}
function roadside(b){const spacing=128,offset=roadTravel*3.6,first=Math.floor(offset/spacing),ground=237;
 for(let j=first-1;j<=first+4;j++){const x=j*spacing-offset,c=b.id==='snow'?'#a7afa8':b.id==='salt'?'#868c7b':'#5c685b';
  poly([[x,ground],[x+5,ground-7],[x+6,ground],[x+12,ground-10],[x+12,ground],[x+22,ground-4],[x+30,ground+3]],c);
  rect(x+57,ground-2,13,4,'#4b5551');rect(x+61,ground-3,7,2,'#88907e');
 }
}
let transitionLayer=null;
function blendedLandscape(from,to,blend){
 landscape(from);if(from.id===to.id||blend<=0)return;
 if(blend>=1){landscape(to);return;}
 // New terrain enters from the right through a broad, soft edge. One small
 // offscreen buffer avoids duplicating the panorama work for every feather strip.
 if(!transitionLayer){transitionLayer=document.createElement('canvas');transitionLayer.width=W;transitionLayer.height=180;}
 const main=ctx,q=transitionLayer.getContext('2d');ctx=q;q.clearRect(0,0,W,180);q.imageSmoothingEnabled=false;landscape(to);
 const edge=W+96-blend*(W+192),mask=q.createLinearGradient(edge-96,0,edge+96,0);mask.addColorStop(0,'#0000');mask.addColorStop(1,'#000');q.globalCompositeOperation='destination-in';q.fillStyle=mask;q.fillRect(0,0,W,180);q.globalCompositeOperation='source-over';ctx=main;ctx.drawImage(transitionLayer,0,0);
}
function road(from,to,blend,light){blendedLandscape(from,to,blend);
 // Atmospheric separation calms the artwork and puts the vehicle on a readable road.
 const haze=ctx.createLinearGradient(0,95,0,175);haze.addColorStop(0,'#38494c00');haze.addColorStop(1,'#485454bb');ctx.fillStyle=haze;ctx.fillRect(0,95,W,80);
 rect(0,165,W,75,'#303c43');rect(0,165,W,5,'#6c7569');rect(0,170,W,2,'#222f38');rect(0,174,W,1,'#8c907b');
 const scenery=b=>drawRoadside(ctx,{seed:state.seed,region:b,travel:roadTravel,seconds:clock,assets,image:img});
 if(from.id===to.id)scenery(from);else{ctx.globalAlpha=1-blend;scenery(from);ctx.globalAlpha=blend;scenery(to);ctx.globalAlpha=1;}

 for(let i=-1;i<8;i++){const x=i*96-roadTravel*3.7%96;rect(x,223,48,3,'#c7bd92');rect(x+3,224,39,1,'#aaa68c');poly([[x+31,184],[x+39,189],[x+35,194],[x+50,201]],'#222d35');}
 for(let i=0;i<62;i++){const x=(i*71-roadTravel*(2.4+rnd(i)*1.2)%440+440)%440;rect(x,178+rnd(i+46)*57,2+i%4,1,i%3?'#465157':'#626d6a');}
 rect(0,234,W,2,'#949680');rect(0,236,W,4,'#525f57');
 const marker=490-roadTravel*.85%930;paint(assets.occupation.pylon,marker,87,27,72);
 if(light.night){ctx.globalAlpha=.35;for(let i=0;i<16;i++)rect(rnd(i)*W,rnd(i+91)*45,1,1,'#c0c9cf');ctx.globalAlpha=1;}
}
function room(){const eventKind=encounters[state.current?.event.id]?.kind,raw=({gas:'garage',clinic:'clinic',pharmacy:'clinic',motel:'hotel',stall:'shop',market:'shop',nest:'nest',eggs:'nest',spores:'nest'}[eventKind]||state.frames?.at(-1)?.scene||'warehouse'),kind=({gas:'garage',pharmacy:'clinic',motel:'hotel',market:'shop',stall:'shop',nest:'nest'}[raw]||raw),valid=['warehouse','clinic','garage','shop','hotel','laboratory','ruin','nest'],scene=valid.includes(kind)?kind:'warehouse';paint(assets.scenes[scene],0,0,W,H);
 if(assets.interiors?.[scene]){const a=assets.interiors[scene],p=img(a.image);if(p){let [sx,sy,sw,sh]=a.rect;const cw=sh*W/H;sx+=(sw-cw)/2;sw=cw;ctx.drawImage(p,sx,sy,sw,sh,0,0,W,H);}}
 rect(0,0,W,H,'#26313c2b');const pulse=.07+Math.sin(clock*1.6)*.025;ctx.globalAlpha=pulse;poly([[166,35],[194,35],[264,197],[83,197]],'#f3c48c');ctx.globalAlpha=1;
}
function vehicle(v,party,x,y,w,rolling=false){const base=assets.vehicles[v.model],a={...base,...base.variants?.[base.seats+(v.mods||[]).filter(m=>m==='seat').length]},scale=w/160,bump=rolling&&!reduced?Math.round(Math.sin(roadTravel*.14)+Math.sin(roadTravel*.3)*.35)*scale*.55:0,h=w*72/160;y+=bump;
 rect(x+10,y+h-5,w-15,4,'#1d2c31');a.windows.forEach((win,i)=>{if(party[i])paint(assets.portraits[party[i].race],x+win.x*scale,y+win.y*scale,Math.min(win.width,win.height)*scale,Math.min(win.width,win.height)*scale)});paint(a.image,x,y,w,h);
 if(rolling&&!reduced)for(const wx of [36,124]){const cx=x+wx*scale,cy=y+59*scale;ctx.save();ctx.translate(cx,cy);ctx.rotate(roadTravel*.32);rect(-3*scale,-1*scale,6*scale,2*scale,'#b4b9a6');rect(-1*scale,-3*scale,2*scale,6*scale,'#7b8d89');ctx.restore()}
 (v.mods||[]).filter(m=>m==='gun'||m==='lamp').slice(0,1).forEach(m=>paint(assets.mods[m],x+w*.36,y-11*scale,w*.3,w*.3));
 if(rolling)for(let i=0;i<5;i++){const k=(roadTravel*.065+i*.21)%1;rect(x+7-k*35,y+h-7-k*8,3+k*9,2+k*4,`rgba(194,177,139,${.24*(1-k)})`)}
}
function person(p,x,y,h=48,walk=false){const t=walk&&!reduced?Math.floor(Math.sin(clock*17))*2:Math.floor(Math.sin(clock*2+p.level))*1;paint(assets.characters[p.race+'_'+p.profession],x,y+t,h*2/3,h);rect(x+3,y+h+1,h*.6,2,'#172a32');}
function particles(effect,t){const kind=effect||'none';if(kind==='none')return;
 for(let i=0;i<30;i++){const a=rnd(i+4),b=rnd(i+91),v=(t*(.2+b*.3)+a)%1;
 if(['fire','smoke','gas','spores'].includes(kind)){const x=244+Math.sin(i+t)*25+a*52,y=166-v*94;const color=kind==='fire'?(i%2?'#ecb451':'#d27642'):kind==='spores'?'#a7b679':kind==='gas'?'#b1b577':'#88918a';ctx.globalAlpha=(1-v)*.65;rect(x,y,kind==='spores'?2:5+v*12,kind==='spores'?2:7+v*10,color)}
 if(['rain','storm','drip'].includes(kind)){const x=(a*480-t*28)%430,y=(b*240+t*150)%240;rect(x,y,1,8,kind==='rain'?'#b7c89b':'#a3c0bf');}
 if(['fog','dust'].includes(kind)){ctx.globalAlpha=.12;rect((a*580-t*18+580)%580-90,b*200,70,11,kind==='dust'?'#d6bd83':'#bac7c1');}
 if(kind==='water'){rect(177+a*155,178+b*32+Math.sin(t*3+i)*2,10,1,'#a5c1bd');}
 if(kind==='sparks'&&Math.sin(t*9+i)> .6)rect(236+a*63,110+b*75,2,5,'#e9db85');
 if(kind==='signal'&&i<3){ctx.strokeStyle='#8ec6ae';ctx.globalAlpha=(1-v)*.7;ctx.strokeRect(265-v*25,97-v*19,v*50,v*38)}ctx.globalAlpha=1;
 }if(kind==='storm'&&Math.sin(t*.9)>.996){rect(0,0,W,H,'#c6d6ce88')}
}
function battle(){const b=state.battle;if(!b)return;const enemies=b.enemies,layout=enemyLayout(enemies.length,enemies),vehicleFight=b.mode==='vehicle',age=(performance.now()-beatAt)/1000;
 if(!vehicleFight){if(state.current?.inside||state.frames?.at(-1)?.kind==='building')room();else panorama(biomeAt(state.progress,state.seed,state.route),0,0,W,H);rect(0,0,W,H,'#0e192bc7');
  const glow=ctx.createRadialGradient(192,140,10,192,140,210);glow.addColorStop(0,'#415c5e55');glow.addColorStop(1,'#121c2b00');ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
 }
 enemies.forEach((e,i)=>{const l=layout[i],struck=beat?.effects.some(f=>f.side==='enemies'&&f.id===e.id&&f.amount<0),attacking=beat?.side==='enemies'&&beat.actor===e.id&&beat.kind==='attack',impact=age>=.36&&age<.82;
  const recoil=struck&&impact&&!reduced?Math.sin((age-.36)*42)*5*(1-(age-.36)/.46):0,lunge=attacking&&age<.4&&!reduced?Math.sin(age/.4*Math.PI)*12:0;
  const y=l.cy-l.h/2+lunge+(reduced?0:Math.sin(clock*1.8+i));
  ctx.save();ctx.translate(recoil,0);ctx.globalAlpha=e.hp<=0?(struck&&age<.9?Math.max(0,1-(age-.36)/.54):0):struck&&impact&&Math.floor(age*35)%2?.4:1;
  rect(l.cx-l.w*.36,l.cy+l.h/2+4,l.w*.72,4,'#101b2b88');
  if(vehicleFight){const width=enemies.length>1?106:175;vehicle({model:e.vehicle||'armored',mods:[]},[],l.cx-width/2,112+lunge,width,true);}else e.image?paint(e.image,l.cx-l.w/2,y,l.w,l.h):e.npc?paint(assets.characters[e.npc.race+'_'+e.npc.profession],l.cx-l.h/3,y,l.h*2/3,l.h):paintEnemy(e.key,l.cx-l.w/2-7,y,l.w+14,l.h);
  ctx.restore();
 });
 if(vehicleFight)vehicle(state.vehicle,state.party,14,171,113,true);
 drawBattleEffects(ctx,{beat,age,enemies,layout,party:state.party,soft:reduced});
}
function encounterArt(current){let a=encounters[current?.event?.id];if(current?.inside&&a&&!a.interior){const inner={gas:'019',garage:'020',clinic:'021',motel:'022',pharmacy:'017',market:'016',stall:'016',cars:'025',warehouse:'001'}[a.kind];if(inner)a=encounters['building_'+inner];}return a;}
function drawEncounter(current,x,interior=false,preview=false){const a=encounterArt(current);if(!a)return;const collected=!current?.event.options?.length&&!current?.dialogue&&['crate','luggage','toolbox','medicalbox','bag','cache','gift'].includes(a.kind);if(collected)ctx.globalAlpha=.45;const facade=!interior&&assets.facilities?.[a.kind],sheet=facade&&img(facade.image);if(sheet){const height=203*facade.rect[3]/facade.rect[2];ctx.drawImage(sheet,...facade.rect,x,196-height,203,height);}else paint(a.image,x,interior?68:54,interior?195:203,interior?136:142);ctx.globalAlpha=1;
 if(current.place&&!current.place.inherited){const label=current.place.name;if(!interior){rect(x+22,133,3,20,'#7b837a');rect(x+179,133,3,20,'#7b837a');}rect(x+8,interior?45:110,187,24,'#142d36');rect(x+10,interior?47:112,183,1,'#b8b28c');text(label,x+18,interior?62:127,'#ece1b9',Math.min(13,166/label.length));}
 if(collected)text('已搜索',x+65,145,'#d4c28b',10);
 ctx.save();ctx.translate(x-174,0);particles(a.effect,clock);ctx.restore();
 (a.creatures||[]).forEach((k,i)=>paintEnemy(k,x+23+i*37,131+Math.sin(clock*2+i)*2,50,58));
 if(current.npc)person(current.npc,x+(interior?104:114),interior?147:153,interior?54:43);
 if(!preview&&(interior||current.dialogue)){const actor=state.party.find(p=>p.id===state.actorId&&p.hp>0)||state.party.find(p=>p.hp>0);if(actor)person(actor,interior?48:134,interior?157:166,interior?49:38,clock-eventAt<1.5)}
}
function updateReadouts(minutes,pose,view,driving){const biome=view.current;const minute=Math.floor(minutes),stamp=minute+':'+Math.round(pose.speed)+':'+biome.name+':'+driving+':'+view.remainingKm;if(stamp===displayMinute)return;displayMinute=stamp;const time=document.getElementById('journey-time'),speedEl=document.getElementById('journey-speed'),place=document.getElementById('journey-place');if(time)time.textContent=`第 ${Math.floor(minute/1440)+1} 天 · ${phaseName(minute)} ${String(Math.floor(minute/60)%24).padStart(2,'0')}:${String(minute%60).padStart(2,'0')}`;if(speedEl)speedEl.textContent=driving?Math.round(pose.speed):0;if(place)place.textContent=biome.name;const distance=document.getElementById('journey-distance'),progress=document.getElementById('journey-progress');if(distance)distance.textContent=view.remainingKm.toLocaleString('en-US');if(progress){progress.style.width=(100-view.remainingKm/10)+'%';progress.parentElement.setAttribute('aria-label','距離樂園還剩 '+view.remainingKm+' 公里');}}
function frame(time){requestAnimationFrame(frame);if(!canvas?.isConnected||document.hidden){lastTime=time;return}if(time-lastFrame<33)return;const dt=Math.min((time-lastTime)/1000,.08)||.033;lastTime=time;lastFrame=time;clock+=dt;reduced=reducedMotion();
 const s=state,driving=s.mode==='driving',carFight=s.battle?.mode==='vehicle',u=driving?clamp01((time-travelAt)/tripDuration):1,pose=tripPose(u),interior=s.current?.inside||s.frames?.at(-1)?.kind==='building';
 // Both travelling and stopped use this camera, including the very last frame.
 const settle=1-Math.exp(-dt*8);viewZoom+=(pose.zoom-viewZoom)*settle;viewCarX+=(pose.carX-viewCarX)*settle;
 if(driving||carFight)roadTravel+=dt*(carFight?60:pose.speed)*speed;
 const minute=s.minutes+(driving?60*u:0);if(lightMinute===null||Math.abs(minute-lightMinute)>120)lightMinute=minute;else lightMinute+=(minute-lightMinute)*(1-Math.exp(-dt*5));const light=lightingAt(lightMinute);
 const view=routeView(s,u),{from,to,blend}=view;ctx.clearRect(0,0,W,H);
 if(interior&&!driving&&!s.battle)room();else road(from,to,blend,light);
 if(s.battle)battle();else if(interior&&!driving)drawEncounter(s.current,153,true);else{ctx.save();ctx.translate(0,220*(1-viewZoom));ctx.scale(viewZoom,viewZoom);
  const current=driving?s.travel.preview?.current:s.current;drawEncounter(current,driving?pose.eventX:210,false,driving);
  if(driving&&s.travel.preview?.battle&&(!current||current.finalGate)){const e=s.travel.preview.battle.enemies[0];if(e){if(e.image)paint(e.image,pose.eventX+25,70,132,132);else if(e.npc)paint(assets.characters[e.npc.race+'_'+e.npc.profession],pose.eventX+53,125,45,67);else paintEnemy(e.key,pose.eventX+53,125,55,67);}}
  vehicle(s.vehicle,s.party,viewCarX,140,190,driving&&pose.speed>2);ctx.restore();
 }
 if(!interior&&(!s.battle||carFight)){if(from.id===to.id)roadside(from);else{ctx.globalAlpha=1-blend;roadside(from);ctx.globalAlpha=blend;roadside(to);ctx.globalAlpha=1;}}
 if(!s.battle||carFight){ctx.globalAlpha=(1-light.light)*.72;rect(0,0,W,H,'#07152c');ctx.globalAlpha=1;
 if(light.light<.68&&!interior){const x=(viewCarX+184)*viewZoom,y=185*viewZoom+220*(1-viewZoom);ctx.globalAlpha=(.68-light.light)*.55;poly([[x,y],[W,y-29],[W,y+18]],'#ffdf99');ctx.globalAlpha=1;rect(x-3,y-2,4,3,'#f3d894');}}
 const elapsed=clock-actionAt;if(elapsed<1.3)feedback.forEach((f,i)=>text(f.text,f.x,104+i*17-elapsed*20,f.color,13));
 ctx.globalAlpha=.018;for(let y=0;y<H;y+=3)rect(0,y,W,1,'#101d25');ctx.globalAlpha=1;updateReadouts(minute,pose,view,driving);
}
requestAnimationFrame(frame);
export function mountWorld(el,s,a,eventArt,{duration=12000,travelStart=performance.now(),travelSpeed=1,target=null,playback:playing=false}={}){canvas=el;ctx=canvas.getContext('2d',{alpha:false});ctx.imageSmoothingEnabled=false;state=s;assets=a;encounters=eventArt;tripDuration=duration;travelAt=travelStart;speed=travelSpeed;selectedTarget=target;playback=playing;displayMinute=-1;
 const next=s.current?.instance+':'+s.mode+':'+!!s.current?.inside;if(next!==key){eventAt=clock;key=next}
 // Warm actual approaching art so it is already on screen before stopping.
 const current=s.mode==='driving'?s.travel?.preview?.current:s.current;img(encounterArt(current)?.image);const facade=assets.facilities?.[encounterArt(current)?.kind];if(facade){img(facade.image);img(assets.interiors?.warehouse?.image);}img(assets.worlds?.[biomeAt(s.progress,s.seed,s.route).id]?.image);if(s.travel)img(assets.worlds?.[biomeAt(s.progress+s.travel.n,s.seed,s.route).id]?.image);if(s.current?.inside&&assets.interiors)Object.values(assets.interiors).slice(0,1).forEach(a=>img(a.image));if(s.mode==='driving')for(const e of s.travel.preview?.battle?.enemies||[])img(e.image|| (e.npc?assets.characters[e.npc.race+'_'+e.npc.profession]:assets.enemyAtlas?.[e.key]?.image||assets.enemies[e.key]?.image));
 for(const e of s.battle?.enemies||[])if(e.image)img(e.image);
 canvas.setAttribute('aria-label',s.mode==='driving'?'車輛向東行駛，沿途景色向後流動':s.battle?'敵人在中央，我方隊員在下方，指令在上方訊息窗':encounters[s.current?.event.id]?.title||'公路旁的車輛');}
export function captureVisual(s){return {party:Object.fromEntries(s.party.map(p=>[p.id,p.hp])),hp:s.party.reduce((n,p)=>n+p.hp,0),vehicle:s.vehicle.hp,enemies:s.battle?.enemies.reduce((n,e)=>n+e.hp,0)||0,fuel:s.resources.fuel,scrap:s.resources.scrap,medicine:s.resources.medicine,round:s.battle?.round,mode:s.mode}}
export function animateResult(before,s,type){const after=captureVisual(s);for(const p of s.party){const el=document.querySelector(`[data-person="${p.id}"]`),diff=p.hp-(before.party?.[p.id]??p.hp);if(el&&diff){el.classList.add(diff<0?'was-hit':'was-healed');}}feedback=[];for(const [key,label,x,col] of [['hp','HP',45,'#e58d79'],['vehicle','車況',48,'#e58d79'],['enemies','',174,'#f0d38e'],['fuel','汽油',176,'#a8d0b8'],['scrap','廢料',176,'#d9bc79'],['medicine','藥品',176,'#a8d0b8']]){const diff=after[key]-before[key];if(diff)feedback.push({text:`${label} ${diff>0?'+':''}${diff}`,x,color:col})}if(feedback.length||before.round!==after.round||type==='psi'){actionAt=clock;actionKind=after.enemies<before.enemies?(type==='psi'?'psi':'attack'):'none'}}

export function playBattleBeat(step){beat=step;beatAt=performance.now();feedback=[];actionAt=-10;}
export function clearBattleBeat(){beat=null;}
