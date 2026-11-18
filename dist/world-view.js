// Lightweight 384px stage: layered pixel art, no physics engine or continuous DOM writes.
import {phaseName} from './engine.js';
import {biomeAt,tripPose,enemyLayout,lightingAt,mixHex,ease,clamp01} from './journey-view-model.js';
const W=384,H=240,images=new Map(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let canvas,ctx,state,assets,encounters,lastFrame=0,lastTime=0,clock=0,roadTravel=0,eventAt=0,key='',actionAt=-10,feedback=[],actionKind='',travelAt=0,tripDuration=12000,speed=1,viewZoom=.84,viewCarX=24,displayMinute=-1,selectedTarget=null,lightMinute=null;
function img(path){if(!path)return null;if(!images.has(path)){const i=new Image();i.src='assets/'+path;images.set(path,i)}const i=images.get(path);return i.complete&&i.naturalWidth?i:null}
function paint(path,x,y,w,h){const i=img(path);if(i)ctx.drawImage(i,Math.round(x),Math.round(y),w,h)}
function paintEnemy(key,x,y,w,h){const a=assets.enemyAtlas?.[key],p=a&&img(a.image);if(p){const [, ,sw,sh]=a.rect,scale=Math.min(w/sw,h/sh),dw=sw*scale,dh=sh*scale;ctx.drawImage(p,...a.rect,Math.round(x+(w-dw)/2),Math.round(y+h-dh),dw,dh);}else paint(assets.enemies[key]?.image,x,y,w,h);}
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h)}
function poly(points,c){ctx.fillStyle=c;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill()}
function text(s,x,y,col='#e9d6a3',size=8){ctx.font=`bold ${size}px monospace`;ctx.textAlign='left';ctx.fillStyle='#13242c';ctx.fillText(s,x+1,y+1);ctx.fillStyle=col;ctx.fillText(s,x,y)}
function rnd(i){return ((Math.sin(i*127.1+41.7)*43758.5453)%1+1)%1}
const scenicOrigins=new Map();
function panorama(b,x=0,y=0,w=W,h=174,alpha=1){const region=assets.worlds?.[b.id||b],picture=region&&img(region.image);ctx.save();ctx.globalAlpha=alpha;if(picture){const [sx,sy,sw,sh]=region.rect;ctx.drawImage(picture,sx,sy,sw,sh,x,y,w,h);}else{rect(x,y,w,h,'#344452');paint(assets.scenes[(b.id==='city'?'city':b.id==='forest'?'forest':'alien')+'_morning'],x,y,w,h);}ctx.restore();}
function landscape(b,alpha=1){if(!scenicOrigins.has(b.id))scenicOrigins.set(b.id,roadTravel);const shift=Math.min(32,(roadTravel-scenicOrigins.get(b.id))*.018);panorama(b,-shift,-5,416,182,alpha);}
function road(from,to,blend,light){landscape(from);if(from.id!==to.id)landscape(to,blend);
 // A distant occupation world and a separately scrolling, tactile road foreground.
 rect(0,166,W,74,'#28333e');rect(0,166,W,3,'#666d68');rect(0,170,W,2,'#1a2633');rect(0,176,W,1,'#414d55');rect(0,229,W,3,'#777c6b');rect(0,234,W,6,'#3e4949');
 for(let i=-1;i<9;i++){const x=i*64-roadTravel*2%64;rect(x,211,29,3,'#c6b88c');rect(x+3,212,7,1,'#8d8b72');rect(x+19,184,18,1,'#18242e');poly([[x+33,187],[x+41,190],[x+47,187],[x+54,192]],'#172532');}
 for(let i=0;i<90;i++){const x=(i*29-roadTravel*2.3%440+440)%440;rect(x,173+rnd(i+46)*64,1+i%3,1,i%3?'#485357':'#667069');}
 // Alien sentries and roadside hardware move at a different depth from the panorama.
 const marker=440-roadTravel*.8%650;paint(assets.occupation.pylon,marker,83,31,83);if(light.light<.6){ctx.globalAlpha=.09;poly([[marker+14,110],[marker-56,174],[marker+77,174]],'#f3c580');ctx.globalAlpha=1;}
 const droneX=(clock*5+state.progress*11)%480-48,droneY=38+Math.sin(clock*.5)*4;paint(assets.occupation.drone,droneX,droneY,35,24);
 if(!reduced){ctx.globalAlpha=.08;rect((clock*7)%500-90,139,91,4,'#b0b5a0');ctx.globalAlpha=1;}
 if(light.night){ctx.globalAlpha=.55;for(let i=0;i<23;i++)rect(rnd(i)*W,rnd(i+91)*52,1,1,'#d0d2d3');ctx.globalAlpha=1;}
}
function room(){const eventKind=encounters[state.current?.event.id]?.kind,raw=({gas:'garage',clinic:'clinic',pharmacy:'clinic',motel:'hotel',stall:'shop',market:'shop',nest:'nest',eggs:'nest',spores:'nest'}[eventKind]||state.frames?.at(-1)?.scene||'warehouse'),kind=({gas:'garage',pharmacy:'clinic',motel:'hotel',market:'shop',stall:'shop',nest:'nest'}[raw]||raw),valid=['warehouse','clinic','garage','shop','hotel','laboratory','ruin','nest'],scene=valid.includes(kind)?kind:'warehouse';paint(assets.scenes[scene],0,0,W,H);
 if(assets.interiors?.[scene]){const a=assets.interiors[scene],p=img(a.image);if(p){let [sx,sy,sw,sh]=a.rect;const cw=sh*W/H;sx+=(sw-cw)/2;sw=cw;ctx.drawImage(p,sx,sy,sw,sh,0,0,W,H);}}
 const pulse=.1+Math.sin(clock*1.6)*.05;ctx.globalAlpha=pulse;poly([[166,35],[194,35],[264,197],[83,197]],'#f3c48c');ctx.globalAlpha=1;
}
function vehicle(v,party,x,y,w,rolling=false){const base=assets.vehicles[v.model],a={...base,...base.variants?.[base.seats+(v.mods||[]).filter(m=>m==='seat').length]},scale=w/160,bump=rolling&&!reduced?Math.floor(Math.sin(clock*27))*scale:0,h=w*72/160;y+=bump;
 rect(x+10,y+h-5,w-15,4,'#1d2c31');a.windows.forEach((win,i)=>{if(party[i])paint(assets.portraits[party[i].race],x+win.x*scale,y+win.y*scale,Math.min(win.width,win.height)*scale,Math.min(win.width,win.height)*scale)});paint(a.image,x,y,w,h);
 if(rolling&&!reduced)for(const wx of [36,124]){const cx=x+wx*scale,cy=y+59*scale;ctx.save();ctx.translate(cx,cy);ctx.rotate(clock*17);rect(-3*scale,-1*scale,6*scale,2*scale,'#b4b9a6');rect(-1*scale,-3*scale,2*scale,6*scale,'#7b8d89');ctx.restore()}
 (v.mods||[]).filter(m=>m==='gun'||m==='lamp').slice(0,1).forEach(m=>paint(assets.mods[m],x+w*.36,y-11*scale,w*.3,w*.3));
 if(rolling)for(let i=0;i<5;i++){const k=(clock*3+i*.21)%1;rect(x+7-k*35,y+h-7-k*8,3+k*9,2+k*4,`rgba(194,177,139,${.24*(1-k)})`)}
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
function battle(){const b=state.battle;if(!b)return;const enemies=b.enemies.filter(e=>e.hp>0),layout=enemyLayout(enemies.length),vehicleFight=b.mode==='vehicle';
 if(!vehicleFight){if(state.current?.inside||state.frames?.at(-1)?.kind==='building')room();else panorama(biomeAt(state.progress,state.seed),0,0,W,H);rect(0,0,W,H,'#0b1326aa');
  // Quiet, original psychic ripples leave the new enemy silhouettes readable.
  const glow=ctx.createRadialGradient(192,132,12,192,132,184);glow.addColorStop(0,'#426d6b88');glow.addColorStop(.55,'#403e6555');glow.addColorStop(1,'#0b132944');ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
  for(let i=0;i<5;i++){ctx.globalAlpha=.12;ctx.strokeStyle=i%2?'#bb8c9f':'#8db5aa';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(192,139,58+i*36,24+i*17,reduced?0:Math.sin(clock*.24+i)*.08,0,Math.PI*2);ctx.stroke();}ctx.globalAlpha=1;
 }

 enemies.forEach((e,i)=>{const l=layout[i],x=l.cx-l.w/2,y=l.cy-l.h/2+(reduced?0:Math.sin(clock*2+i)*2),hit=clock-actionAt<.35&&actionKind!=='none';rect(l.cx-l.w*.4,l.cy+l.h/2+4,l.w*.8,5,'#101b2b66');
  if(vehicleFight){const width=enemies.length>1?106:190;vehicle({model:e.vehicle||'armored',mods:[]},[],l.cx-width/2,112,width,true);}else{ctx.globalAlpha=hit&&Math.floor(clock*20)%2?.45:1;e.npc?paint(assets.characters[e.npc.race+'_'+e.npc.profession],l.cx-l.h/3,y,l.h*2/3,l.h):paintEnemy(e.key,x-7,y,l.w+14,l.h);ctx.globalAlpha=1;}
 });
 const elapsed=clock-actionAt;if(elapsed<.65&&!reduced&&['psi','attack'].includes(actionKind)){const l=layout.find((_,i)=>enemies[i].id===selectedTarget)||layout[0];if(l){ctx.strokeStyle=actionKind==='psi'?'#c0aeef':'#f8dc9b';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(l.cx-22,l.cy+25);ctx.lineTo(l.cx+23,l.cy-24);ctx.stroke();if(actionKind==='psi'){ctx.strokeRect(l.cx-30-elapsed*25,l.cy-25-elapsed*25,60+elapsed*50,50+elapsed*50);}}}
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
function frame(time){requestAnimationFrame(frame);if(!canvas?.isConnected||document.hidden){lastTime=time;return}if(time-lastFrame<33)return;const dt=Math.min((time-lastTime)/1000,.08)||.033;lastTime=time;lastFrame=time;clock+=dt;
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
 if(!s.battle||carFight){ctx.globalAlpha=(1-light.light)*.72;rect(0,0,W,H,'#07152c');ctx.globalAlpha=1;
 if(light.light<.68&&!interior){const x=(viewCarX+184)*viewZoom,y=185*viewZoom+220*(1-viewZoom);ctx.globalAlpha=(.68-light.light)*.55;poly([[x,y],[W,y-29],[W,y+18]],'#ffdf99');ctx.globalAlpha=1;rect(x-3,y-2,4,3,'#f3d894');}}
 const elapsed=clock-actionAt;if(elapsed<1.3)feedback.forEach((f,i)=>text(f.text,f.x,104+i*17-elapsed*20,f.color,13));
 ctx.globalAlpha=.018;for(let y=0;y<H;y+=3)rect(0,y,W,1,'#101d25');ctx.globalAlpha=1;updateReadouts(minute,pose,ease(u)>.5?to:from,driving);
}
requestAnimationFrame(frame);
export function mountWorld(el,s,a,eventArt,{duration=12000,travelStart=performance.now(),travelSpeed=1,target=null}={}){canvas=el;ctx=canvas.getContext('2d',{alpha:false});ctx.imageSmoothingEnabled=false;state=s;assets=a;encounters=eventArt;tripDuration=duration;travelAt=travelStart;speed=travelSpeed;selectedTarget=target;displayMinute=-1;
 const next=s.current?.instance+':'+s.mode+':'+!!s.current?.inside;if(next!==key){eventAt=clock;key=next}
 // Warm actual approaching art so it is already on screen before stopping.
 const current=s.mode==='driving'?s.travel?.preview?.current:s.current;img(encounterArt(current)?.image);const facade=assets.facilities?.[encounterArt(current)?.kind];if(facade){img(facade.image);img(assets.interiors?.warehouse?.image);}img(assets.worlds?.[biomeAt(s.progress,s.seed).id]?.image);if(s.travel)img(assets.worlds?.[biomeAt(s.progress+s.travel.n,s.seed).id]?.image);if(s.current?.inside&&assets.interiors)Object.values(assets.interiors).slice(0,1).forEach(a=>img(a.image));if(s.mode==='driving')for(const e of s.travel.preview?.battle?.enemies||[])img(e.npc?assets.characters[e.npc.race+'_'+e.npc.profession]:assets.enemyAtlas?.[e.key]?.image||assets.enemies[e.key]?.image);
 canvas.setAttribute('aria-label',s.mode==='driving'?'向東行駛，鏡頭隨前方事件逐漸拉遠，減速停靠':s.battle?'敵人在中央，隊伍狀態與指令在下方':encounters[s.current?.event.id]?.title||'公路旁的車輛');}
export function captureVisual(s){return {party:Object.fromEntries(s.party.map(p=>[p.id,p.hp])),hp:s.party.reduce((n,p)=>n+p.hp,0),vehicle:s.vehicle.hp,enemies:s.battle?.enemies.reduce((n,e)=>n+e.hp,0)||0,fuel:s.resources.fuel,scrap:s.resources.scrap,medicine:s.resources.medicine,round:s.battle?.round,mode:s.mode}}
export function animateResult(before,s,type){const after=captureVisual(s);for(const p of s.party){const el=document.querySelector(`[data-person="${p.id}"]`),diff=p.hp-(before.party?.[p.id]??p.hp);if(el&&diff){el.classList.add(diff<0?'was-hit':'was-healed');}}feedback=[];for(const [key,label,x,col] of [['hp','HP',45,'#e58d79'],['vehicle','車況',48,'#e58d79'],['enemies','',174,'#f0d38e'],['fuel','汽油',176,'#a8d0b8'],['scrap','廢料',176,'#d9bc79'],['medicine','藥品',176,'#a8d0b8']]){const diff=after[key]-before[key];if(diff)feedback.push({text:`${label} ${diff>0?'+':''}${diff}`,x,color:col})}if(feedback.length||before.round!==after.round||type==='psi'){actionAt=clock;actionKind=after.enemies<before.enemies?(type==='psi'?'psi':'attack'):'none'}}
