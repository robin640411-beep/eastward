// Lightweight 384px stage: layered pixel art, no physics engine or continuous DOM writes.
import {reducedMotion} from './cinematics.js';
import {phaseName} from './engine.js';
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
function roadside(b,near=false){const depth=near?3.6:1.45,spacing=near?128:164,offset=roadTravel*depth,first=Math.floor(offset/spacing),ground=near?237:172;
 for(let j=first-1;j<=first+4;j++){const x=j*spacing-offset,seed=j+state.seed*3;
  if(near){
   // Close scrub, stones and broken verge race past underneath the car.
   const c=b.id==='snow'?'#a7afa8':b.id==='salt'?'#868c7b':'#5c685b';
   poly([[x,ground],[x+5,ground-7],[x+6,ground],[x+12,ground-10],[x+12,ground],[x+22,ground-4],[x+30,ground+3]],c);
   rect(x+57,ground-2,13,4,'#4b5551');rect(x+61,ground-3,7,2,'#88907e');
  }else{
   // Alternating posts and vegetation form a continuous midground, behind the vehicle.
   rect(x,ground-25,4,26,'#9f9e86');rect(x,ground-21,4,8,'#c2b36f');rect(x,ground-12,4,7,'#3b4747');rect(x-2,ground,9,2,'#252f32');
   const t=rnd(seed+12);if(['city','industrial'].includes(b.id)){
    rect(x+49,ground-36,29,36,'#36474c');rect(x+51,ground-34,25,4,'#63706b');rect(x+54,ground-25,8,11,'#1b2d35');rect(x+68,ground-23,5,8,'#a3906555');
   }else if(['forest','marsh','alien'].includes(b.id)){
    poly([[x+80,ground],[x+85,ground-74],[x+88,ground-92],[x+91,ground],[x+89,ground]],'#344548');
    poly([[x+86,ground-43],[x+61,ground-65],[x+66,ground-66],[x+88,ground-50],[x+108,ground-73],[x+111,ground-72],[x+89,ground-38]],'#344548');
   }else{poly([[x+58,ground],[x+68,ground-7-t*12],[x+77,ground-11],[x+91,ground]],b.id==='snow'?'#a2aba5':'#616c61');}
   if(j%4===0){rect(x+118,ground-41,3,41,'#6c7772');rect(x+104,ground-44,31,17,'#243c3d');rect(x+106,ground-42,27,1,'#839383');text('E →',x+109,ground-32,'#bbbc98',8);}
  }
 }
}
function road(from,to,blend,light){landscape(from);if(from.id!==to.id)landscape(to,blend);
 // Atmospheric separation calms the artwork and puts the vehicle on a readable road.
 const haze=ctx.createLinearGradient(0,95,0,175);haze.addColorStop(0,'#38494c00');haze.addColorStop(1,'#485454bb');ctx.fillStyle=haze;ctx.fillRect(0,95,W,80);
 rect(0,165,W,75,'#303c43');rect(0,165,W,5,'#6c7569');rect(0,170,W,2,'#222f38');rect(0,174,W,1,'#8c907b');
 roadside(blend>.5?to:from);
 if(['city','coast','industrial'].includes((blend>.5?to:from).id)){for(let i=-1;i<12;i++){const x=i*40-roadTravel*1.8%40;rect(x,158,3,15,'#74817b');rect(x,155,40,3,'#9c9f8a');rect(x,158,40,2,'#48575a');}}

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
function battle(){const b=state.battle;if(!b)return;const enemies=playback?b.enemies:b.enemies.filter(e=>e.hp>0),layout=enemyLayout(enemies.length),vehicleFight=b.mode==='vehicle',age=(performance.now()-beatAt)/1000;
 if(!vehicleFight){if(state.current?.inside||state.frames?.at(-1)?.kind==='building')room();else panorama(biomeAt(state.progress,state.seed),0,0,W,H);rect(0,0,W,H,'#0e192bc7');
  const glow=ctx.createRadialGradient(192,140,10,192,140,210);glow.addColorStop(0,'#415c5e55');glow.addColorStop(1,'#121c2b00');ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
 }
 enemies.forEach((e,i)=>{const l=layout[i],struck=beat?.effects.some(f=>f.side==='enemies'&&f.id===e.id&&f.amount<0),attacking=beat?.side==='enemies'&&beat.actor===e.id&&beat.kind==='attack',impact=age>=.22&&age<.56;
  const recoil=struck&&impact&&!reduced?Math.sin((age-.22)*42)*6*(1-(age-.22)/.34):0,lunge=attacking&&age<.4&&!reduced?Math.sin(age/.4*Math.PI)*12:0;
  const y=l.cy-l.h/2+lunge+(reduced?0:Math.sin(clock*1.8+i));
  ctx.save();ctx.translate(recoil,0);ctx.globalAlpha=e.hp<=0?(struck&&age<.62?Math.max(0,1-(age-.22)/.4):0):struck&&impact&&Math.floor(age*35)%2?.4:1;
  rect(l.cx-l.w*.36,l.cy+l.h/2+4,l.w*.72,4,'#101b2b88');
  if(vehicleFight){const width=enemies.length>1?106:175;vehicle({model:e.vehicle||'armored',mods:[]},[],l.cx-width/2,112+lunge,width,true);}else e.npc?paint(assets.characters[e.npc.race+'_'+e.npc.profession],l.cx-l.h/3,y,l.h*2/3,l.h):paintEnemy(e.key,l.cx-l.w/2-7,y,l.w+14,l.h);
  ctx.restore();
 });
 if(vehicleFight)vehicle(state.vehicle,state.party,14,171,113,true);
 drawBattleBeat(enemies,layout,vehicleFight,age);
}
function drawBattleBeat(enemies,layout,vehicleFight,age){if(!beat||age<0||age>.72)return;const b=beat,impact=age>=.22,t=clamp01(age/.22),hitT=clamp01((age-.22)/.4);
 const targetIds=b.effects.filter(f=>f.side==='enemies').map(f=>f.id),index=enemies.findIndex(e=>e.id===(targetIds[0]||b.target)),l=layout[index]||layout[0]||{cx:192,cy:122};
 const actor=state.party.find(p=>p.id===b.actor),enemyIndex=enemies.findIndex(e=>e.id===b.actor),origin=layout[enemyIndex]||l;
 const healing=b.kind==='medicine'||b.power==='heal',support=healing||b.kind==='defend'||b.power==='shield',color=healing?'#a1d6ac':b.kind==='psi'?'#bcb6ef':'#f4d39d';
 if(actor&&!vehicleFight&&b.kind!=='stun'){
  ctx.globalAlpha=age>.5?Math.max(0,(.68-age)/.18):1;
  const advance=support?0:Math.sin(clamp01(age/.48)*Math.PI)*17;
  paint(assets.characters[actor.race+'_'+actor.profession],45+advance,153-advance*.35,38,57);ctx.globalAlpha=1;
 }
 if(b.kind==='attack'||(b.kind==='psi'&&!support)){
  const enemy=b.side==='enemies',sx=enemy?origin.cx:vehicleFight?40:77,sy=enemy?origin.cy+25:186,ex=enemy?192:l.cx,ey=enemy?234:l.cy;
  if(!impact){
   const x=sx+(ex-sx)*t,y=sy+(ey-sy)*t;ctx.strokeStyle=color;ctx.lineWidth=b.kind==='psi'?4:2;ctx.beginPath();ctx.moveTo(sx+(ex-sx)*Math.max(0,t-.25),sy+(ey-sy)*Math.max(0,t-.25));ctx.lineTo(x,y);ctx.stroke();
   if(b.kind==='psi'){ctx.strokeStyle='#ddd8f4';ctx.strokeRect(x-5,y-5,10,10);}else if(b.ranged){rect(sx-4,sy-4,8,8,'#f7dfa1');rect(x-3,y-1,6,2,'#fff0c1');}
  }else if(hitT<.8&&b.effects.some(f=>f.amount<0)){const points=enemy?[{cx:192,cy:218}]:b.power==='burst'?layout:[l];
   for(const p of points){ctx.save();ctx.translate(p.cx,p.cy);ctx.globalAlpha=1-hitT;ctx.strokeStyle=color;ctx.lineWidth=3;
    if(b.kind==='psi'){const r=9+hitT*42;ctx.beginPath();for(let i=0;i<8;i++){const angle=i*Math.PI/4+hitT;const x=Math.cos(angle)*r,y=Math.sin(angle)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.stroke();}
    else{ctx.beginPath();ctx.moveTo(-21+hitT*7,24);ctx.lineTo(24,-26+hitT*5);ctx.stroke();ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-27,9);ctx.lineTo(17,-27);ctx.stroke();}
    for(let i=0;i<6;i++){const angle=i*Math.PI/3;rect(Math.cos(angle)*(10+hitT*28),Math.sin(angle)*(10+hitT*28),3,3,color);}ctx.restore();
   }
  }
 }else if(support){ctx.globalAlpha=1-hitT*.7;const x=actor?64:192,y=180;
  if(healing){for(let i=0;i<5;i++){const px=x-22+i*11,py=y-((age*65+i*9)%48);rect(px-3,py,7,2,color);rect(px,py-3,2,8,color);}}
  else{ctx.strokeStyle='#aac9d9';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-19,y-27);ctx.lineTo(x+19,y-27);ctx.lineTo(x+16,y+2);ctx.lineTo(x,y+13);ctx.lineTo(x-16,y+2);ctx.closePath();ctx.stroke();}ctx.globalAlpha=1;
 }
 if(impact){
  for(const f of b.effects){let p={cx:192,cy:211};if(f.side==='enemies')p=layout[enemies.findIndex(e=>e.id===f.id)]||l;else if(f.side==='party'){const n=state.party.findIndex(p=>p.id===f.id);p={cx:55+(n%3)*122,cy:213};}
   const amount=f.amount>0?'+'+f.amount:String(f.amount);text(amount,p.cx-amount.length*5,p.cy-10-hitT*25,f.amount>0?'#b9e8bc':'#fff0c3',18);
  }
  if(!b.effects.length&&['attack','psi'].includes(b.kind)&&!support)text(b.label.includes('落空')?'MISS':'格擋',l.cx-18,l.cy-10-hitT*18,'#c1c9cc',12);
 }
}
function encounterArt(current){let a=encounters[current?.event?.id];if(current?.inside&&a&&!a.interior){const inner={gas:'019',garage:'020',clinic:'021',motel:'022',pharmacy:'017',market:'016',stall:'016',cars:'025',warehouse:'001'}[a.kind];if(inner)a=encounters['building_'+inner];}return a;}
function drawEncounter(current,x,interior=false,preview=false){const a=encounterArt(current);if(!a)return;const collected=!current?.event.options?.length&&!current?.dialogue&&['crate','luggage','toolbox','medicalbox','bag','cache','gift'].includes(a.kind);if(collected)ctx.globalAlpha=.45;const facade=!interior&&assets.facilities?.[a.kind],sheet=facade&&img(facade.image);if(sheet){const height=203*facade.rect[3]/facade.rect[2];ctx.drawImage(sheet,...facade.rect,x,196-height,203,height);}else paint(a.image,x,interior?68:54,interior?195:203,interior?136:142);ctx.globalAlpha=1;
 if(collected)text('已搜索',x+65,145,'#d4c28b',10);
 ctx.save();ctx.translate(x-174,0);particles(a.effect,clock);ctx.restore();
 (a.creatures||[]).forEach((k,i)=>paintEnemy(k,x+23+i*37,131+Math.sin(clock*2+i)*2,50,58));
 if(current.npc)person(current.npc,x+(interior?104:114),interior?147:153,interior?54:43);
 if(!preview&&(interior||current.dialogue)){const actor=state.party.find(p=>p.id===state.actorId&&p.hp>0)||state.party.find(p=>p.hp>0);if(actor)person(actor,interior?48:134,interior?157:166,interior?49:38,clock-eventAt<1.5)}
}
function updateReadouts(minutes,pose,biome,driving){const minute=Math.floor(minutes),stamp=minute+':'+Math.round(pose.speed)+':'+biome.id+':'+driving;if(stamp===displayMinute)return;displayMinute=stamp;const time=document.getElementById('journey-time'),speedEl=document.getElementById('journey-speed'),place=document.getElementById('journey-place'),status=document.getElementById('drive-status');if(time)time.textContent=`第 ${Math.floor(minute/1440)+1} 天 · ${phaseName(minute)} ${String(Math.floor(minute/60)%24).padStart(2,'0')}:${String(minute%60).padStart(2,'0')}`;if(speedEl)speedEl.textContent=driving?Math.round(pose.speed):0;if(place)place.textContent=biome.name;if(status)status.textContent=pose.approach>.65?'前方有動靜，正在減速靠近…':'沿著公路，繼續向東';}
function frame(time){requestAnimationFrame(frame);if(!canvas?.isConnected||document.hidden){lastTime=time;return}if(time-lastFrame<33)return;const dt=Math.min((time-lastTime)/1000,.08)||.033;lastTime=time;lastFrame=time;clock+=dt;reduced=reducedMotion();
 const s=state,driving=s.mode==='driving',carFight=s.battle?.mode==='vehicle',u=driving?clamp01((time-travelAt)/tripDuration):1,pose=tripPose(u),interior=s.current?.inside||s.frames?.at(-1)?.kind==='building';
 // Both travelling and stopped use this camera, including the very last frame.
 const settle=1-Math.exp(-dt*8);viewZoom+=(pose.zoom-viewZoom)*settle;viewCarX+=(pose.carX-viewCarX)*settle;
 if(driving||carFight)roadTravel+=dt*(carFight?60:pose.speed)*speed;
 const minute=s.minutes+(driving?60*u:0);if(lightMinute===null||Math.abs(minute-lightMinute)>120)lightMinute=minute;else lightMinute+=(minute-lightMinute)*(1-Math.exp(-dt*5));const light=lightingAt(lightMinute);
 const from=biomeAt(s.progress,s.seed),to=biomeAt(s.progress+(driving?s.travel.n:0),s.seed);ctx.clearRect(0,0,W,H);
 if(interior&&!driving&&!s.battle)room();else road(from,to,ease(u),light);
 if(s.battle)battle();else if(interior&&!driving)drawEncounter(s.current,153,true);else{ctx.save();ctx.translate(0,220*(1-viewZoom));ctx.scale(viewZoom,viewZoom);
  const current=driving?s.travel.preview?.current:s.current;drawEncounter(current,driving?pose.eventX:210,false,driving);
  if(driving&&s.travel.preview?.battle&&!current){const e=s.travel.preview.battle.enemies[0];if(e){if(e.npc)paint(assets.characters[e.npc.race+'_'+e.npc.profession],pose.eventX+53,125,45,67);else paintEnemy(e.key,pose.eventX+53,125,55,67);}}
  vehicle(s.vehicle,s.party,viewCarX,140,190,driving&&pose.speed>2);ctx.restore();
 }
 if(!interior&&(!s.battle||carFight)){roadside(ease(u)>.5?to:from,true);}
 if(!s.battle||carFight){ctx.globalAlpha=(1-light.light)*.72;rect(0,0,W,H,'#07152c');ctx.globalAlpha=1;
 if(light.light<.68&&!interior){const x=(viewCarX+184)*viewZoom,y=185*viewZoom+220*(1-viewZoom);ctx.globalAlpha=(.68-light.light)*.55;poly([[x,y],[W,y-29],[W,y+18]],'#ffdf99');ctx.globalAlpha=1;rect(x-3,y-2,4,3,'#f3d894');}}
 const elapsed=clock-actionAt;if(elapsed<1.3)feedback.forEach((f,i)=>text(f.text,f.x,104+i*17-elapsed*20,f.color,13));
 ctx.globalAlpha=.018;for(let y=0;y<H;y+=3)rect(0,y,W,1,'#101d25');ctx.globalAlpha=1;updateReadouts(minute,pose,ease(u)>.5?to:from,driving);
}
requestAnimationFrame(frame);
export function mountWorld(el,s,a,eventArt,{duration=12000,travelStart=performance.now(),travelSpeed=1,target=null,playback:playing=false}={}){canvas=el;ctx=canvas.getContext('2d',{alpha:false});ctx.imageSmoothingEnabled=false;state=s;assets=a;encounters=eventArt;tripDuration=duration;travelAt=travelStart;speed=travelSpeed;selectedTarget=target;playback=playing;displayMinute=-1;
 const next=s.current?.instance+':'+s.mode+':'+!!s.current?.inside;if(next!==key){eventAt=clock;key=next}
 // Warm actual approaching art so it is already on screen before stopping.
 const current=s.mode==='driving'?s.travel?.preview?.current:s.current;img(encounterArt(current)?.image);const facade=assets.facilities?.[encounterArt(current)?.kind];if(facade){img(facade.image);img(assets.interiors?.warehouse?.image);}img(assets.worlds?.[biomeAt(s.progress,s.seed).id]?.image);if(s.travel)img(assets.worlds?.[biomeAt(s.progress+s.travel.n,s.seed).id]?.image);if(s.current?.inside&&assets.interiors)Object.values(assets.interiors).slice(0,1).forEach(a=>img(a.image));if(s.mode==='driving')for(const e of s.travel.preview?.battle?.enemies||[])img(e.npc?assets.characters[e.npc.race+'_'+e.npc.profession]:assets.enemyAtlas?.[e.key]?.image||assets.enemies[e.key]?.image);
 canvas.setAttribute('aria-label',s.mode==='driving'?'向東行駛，鏡頭隨前方事件逐漸拉遠，減速停靠':s.battle?'敵人在中央，隊伍狀態與指令在下方':encounters[s.current?.event.id]?.title||'公路旁的車輛');}
export function captureVisual(s){return {party:Object.fromEntries(s.party.map(p=>[p.id,p.hp])),hp:s.party.reduce((n,p)=>n+p.hp,0),vehicle:s.vehicle.hp,enemies:s.battle?.enemies.reduce((n,e)=>n+e.hp,0)||0,fuel:s.resources.fuel,scrap:s.resources.scrap,medicine:s.resources.medicine,round:s.battle?.round,mode:s.mode}}
export function animateResult(before,s,type){const after=captureVisual(s);for(const p of s.party){const el=document.querySelector(`[data-person="${p.id}"]`),diff=p.hp-(before.party?.[p.id]??p.hp);if(el&&diff){el.classList.add(diff<0?'was-hit':'was-healed');}}feedback=[];for(const [key,label,x,col] of [['hp','HP',45,'#e58d79'],['vehicle','車況',48,'#e58d79'],['enemies','',174,'#f0d38e'],['fuel','汽油',176,'#a8d0b8'],['scrap','廢料',176,'#d9bc79'],['medicine','藥品',176,'#a8d0b8']]){const diff=after[key]-before[key];if(diff)feedback.push({text:`${label} ${diff>0?'+':''}${diff}`,x,color:col})}if(feedback.length||before.round!==after.round||type==='psi'){actionAt=clock;actionKind=after.enemies<before.enemies?(type==='psi'?'psi':'attack'):'none'}}

export function playBattleBeat(step){beat=step;beatAt=performance.now();feedback=[];actionAt=-10;}
export function clearBattleBeat(){beat=null;}
