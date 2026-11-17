// Lightweight 384px stage: layered pixel art, no physics engine or continuous DOM writes.
import {phaseName} from './engine.js';
import {biomeAt,tripPose,enemyLayout,lightingAt,mixHex,ease,clamp01} from './journey-view-model.js';
const W=384,H=240,images=new Map(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let canvas,ctx,state,assets,encounters,lastFrame=0,lastTime=0,clock=0,roadTravel=0,eventAt=0,key='',actionAt=-10,feedback=[],actionKind='',travelAt=0,tripDuration=12000,speed=1,viewZoom=.84,viewCarX=24,displayMinute=-1,selectedTarget=null,lightMinute=null;
function img(path){if(!path)return null;if(!images.has(path)){const i=new Image();i.src='assets/'+path;images.set(path,i)}const i=images.get(path);return i.complete&&i.naturalWidth?i:null}
function paint(path,x,y,w,h){const i=img(path);if(i)ctx.drawImage(i,Math.round(x),Math.round(y),w,h)}
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h)}
function poly(points,c){ctx.fillStyle=c;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill()}
function text(s,x,y,col='#e9d6a3',size=8){ctx.font=`bold ${size}px monospace`;ctx.textAlign='left';ctx.fillStyle='#13242c';ctx.fillText(s,x+1,y+1);ctx.fillStyle=col;ctx.fillText(s,x,y)}
function rnd(i){return ((Math.sin(i*127.1+41.7)*43758.5453)%1+1)%1}
const palettes={salt:['#b7b59b','#8e9d97','#c5c6ae'],canyon:['#bd795c','#915b50','#b3916a'],forest:['#637b70','#405950','#758568'],city:['#6b8588','#425965','#83918a'],coast:['#668e9c','#3d677b','#96b6ae'],industrial:['#8f8176','#555f65','#8d8d75'],marsh:['#64877b','#3c655d','#8d9a72'],desert:['#d1aa72','#b58859','#d9bd83'],farmland:['#9b9c70','#697a58','#b4ac79'],snow:['#bdd0d3','#8ca7b5','#e0e2d4'],alien:['#8b819e','#535f82','#849690'],oasis:['#83a17f','#4c7c67','#b4bd85']};
function sky(light){rect(0,0,W,H,light.sky);for(let i=0;i<12;i++)rect(0,i*13,W,14,mixHex(light.sky,light.horizon,i/13));
 if(light.night){for(let i=0;i<42;i++)rect(rnd(i)*W,rnd(i+79)*98,1+i%2,1,'#b3c8d6');rect(302,32,16,16,light.sun);rect(298,29,15,16,light.sky);}else{const sy=34+Math.abs(light.hour-12)*6;rect(302,sy,19,19,light.sun);rect(299,sy+4,25,11,light.sun)}
 for(let i=0;i<4;i++){const x=(i*117-clock*1.4+520)%520-80,y=23+i%3*19;rect(x,y,43,4,mixHex(light.sky,light.horizon,.48));rect(x+9,y-4,24,4,mixHex(light.sky,light.horizon,.48));}}
function landscape(b,light,alpha=1){ctx.save();ctx.globalAlpha=alpha;const id=b.id,c=palettes[id],d=roadTravel;
 for(let j=0;j<2;j++){const offset=d*(j?.12:.035)%W;for(let i=-1;i<2;i++){const x=i*W-offset;poly([[x,151],[x+42,105-j*15],[x+90,124],[x+157,65+j*24],[x+218,117],[x+284,89],[x+W,151]],c[j]);if(id==='snow')poly([[x+157,65+j*24],[x+128,97+j*14],[x+147,92+j*16],[x+166,101+j*13],[x+180,94+j*15]],'#e2e6dd');}}
 rect(0,140,W,43,c[2]);
 if(['coast','marsh'].includes(id)){rect(0,129,W,36,id==='coast'?'#528897':'#4c7776');for(let i=0;i<14;i++)rect((i*53-d*.1%53)%W,134+i%5*6,23,1,'#99b9b3');}
 for(let i=-1;i<9;i++){const x=i*63-(d*.3%63),n=i+Math.floor(d*.3/63),h=24+rnd(n)*38;
 if(id==='city'){rect(x,142-h,45,h,c[1]);rect(x+9,136-h,23,8,c[1]);for(let yy=149-h;yy<137;yy+=10)for(let xx=6;xx<40;xx+=11)rect(x+xx,yy,5,4,light.night?'#c5a16a':'#829da0');rect(x+22,128,13,15,'#324951');}
 else if(id==='industrial'){rect(x,107,44,37,'#646e69');rect(x+8,80-h/3,9,38+h/3,'#526465');rect(x+7,80-h/3,12,4,'#b88c6b');for(let k=0;k<3;k++)rect(x+4+k*14,114,9,8,'#b3ab83');ctx.globalAlpha=alpha*.3;rect(x+9+Math.sin(clock+n)*5,59-h/3,17,18,'#c3bdab');ctx.globalAlpha=alpha;}
 else if(id==='canyon'){poly([[x,146],[x+8,87-h/2],[x+32,87-h/2],[x+44,146]],'#a36b50');rect(x+10,113-h/4,25,4,'#d09b6f');rect(x+10,130-h/4,30,3,'#78534b');}
 else if(id==='forest'||id==='oasis'){rect(x+24,92-h/3,5,65,'#4a5750');poly([[x+26,103-h/3],[x+3,82-h/3],[x+6,80-h/3],[x+27,94-h/3],[x+39,71-h/3],[x+42,73-h/3],[x+29,110]],'#4a5750');if(id==='oasis'){rect(x+7,77-h/3,38,20,'#46785d');rect(x+15,66-h/3,22,18,'#659167');}else{rect(x+5,80-h/3,13,5,'#72846b');}}
 else if(id==='alien'){poly([[x,150],[x+13,75-h/2],[x+23,105],[x+40,150]],'#545b79');rect(x+13,101,4,19,'#7ac5af');rect(x+24,130,7,3,'#b19ac5');}
 else if(id==='farmland'){rect(x,151,52,2,'#776c4e');for(let k=0;k<4;k++){rect(x+k*12,142,2,13,'#857b56');rect(x+k*12-2,140,6,4,'#bab578');}if(n%4===0){rect(x,117,37,28,'#916b55');poly([[x-4,117],[x+17,101],[x+41,117]],'#64564d');rect(x+13,129,12,16,'#433f38');}}
 else if(id==='snow'){poly([[x,151],[x+14,112],[x+30,151]],'#6c8d93');poly([[x+4,137],[x+14,112],[x+24,137]],'#dae1d8');}
 else if(id==='desert'){poly([[x,153],[x+21,135-h/4],[x+63,153]],'#c49765');if(n%3===0){rect(x+38,119,4,34,'#77846a');rect(x+31,127,8,4,'#77846a');rect(x+30,119,3,11,'#77846a');}}
 else if(id==='marsh'){for(let k=0;k<5;k++){rect(x+k*8,145-k%3*4,2,16,'#486957');rect(x+k*8-1,141-k%3*4,4,7,'#8e8f61');}}
 else if(id==='coast'){if(n%4===0){poly([[x,144],[x+32,144],[x+24,151],[x+6,151]],'#506568');rect(x+17,118,2,28,'#506568');poly([[x+19,121],[x+32,141],[x+19,141]],'#aebcac');}}
 else{rect(x+4,150,24,2,'#eef0d2');rect(x+25,142,12,7,'#949b8b');}
 }
 // Landmarks punctuate the route, rather than repeating the same trees everywhere.
 const poleGap=['city','industrial','farmland'].includes(id)?155:310;
 for(let i=-1;i<4;i++){const x=i*poleGap-d*.58%poleGap;rect(x,74,3,88,'#394e51');rect(x-13,82,30,3,'#485b58');ctx.strokeStyle='#526963';ctx.beginPath();ctx.moveTo(x,84);ctx.quadraticCurveTo(x+poleGap/2,108,x+poleGap,84);ctx.stroke();}
 ctx.restore();}
function road(from,to,blend,light){sky(light);landscape(from,light);if(from.id!==to.id)landscape(to,light,blend);
 rect(0,165,W,75,'#34444a');rect(0,165,W,3,'#a6a68b');rect(0,170,W,2,'#182e39');rect(0,231,W,3,'#a7a78a');
 for(let i=-1;i<9;i++){const x=i*64-roadTravel*2%64;rect(x,211,30,3,'#d7c392');rect(x+17,183,8,1,'#26363c');}
 for(let i=0;i<18;i++)rect((i*31-roadTravel*2.7%558+558)%558,235+i%5,4+i%7,2,'#7f8a76');
 const x=450-roadTravel*.68%680;rect(x,127,3,37,'#435b5c');rect(x-10,119,43,22,'#3d7669');text('EAST →',x-7,133,'#f2dfab',8);
}
function room(){rect(0,0,W,H,'#25393e');rect(0,0,W,150,'#3a5053');for(let y=0;y<150;y+=20){rect(0,y,W,1,'#2c4348');for(let x=(y%40?0:26);x<W;x+=52)rect(x,y,1,20,'#31474b')}
 rect(20,25,63,71,'#24363e');rect(24,29,55,61,'#78958e');rect(48,26,3,68,'#1e333c');rect(22,57,60,3,'#1e333c');poly([[23,90],[80,90],[157,176],[60,176]],'#d9cc9a0d');rect(286,29,62,124,'#1d2e35');rect(290,32,54,118,'#283e43');rect(331,92,4,5,'#b1ac88');rect(0,149,W,5,'#172b31');rect(0,154,W,86,'#334449');for(let i=0;i<6;i++){rect(0,157+i*i*3,W,1,'#52605c');poly([[192,154],[i*92-76,240],[i*92-74,240]],'#4e5f5d')}
 rect(164,0,2,30,'#192b31');rect(151,29,29,5,'#adad87');rect(155,34,21,3,Math.sin(clock*4)>.96?'#5d716c':'#d7c596');
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
 if(!vehicleFight){rect(0,0,W,H,'#1b293e');for(let y=-16;y<H+16;y+=12){const wave=reduced?0:Math.sin(y*.055+clock*.7)*17;for(let x=-30;x<W+30;x+=32){const color=(Math.floor(x/32)+Math.floor(y/12))%2?'#314751':'#29374d';rect(x+wave,y,30,11,color);}}for(let j=0;j<4;j++){ctx.strokeStyle=['#526969','#75647a','#526969','#476179'][j];ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(192,120,70+j*42,38+j*25,reduced?0:Math.sin(clock*.25)*.12,0,Math.PI*2);ctx.stroke();}}
 enemies.forEach((e,i)=>{const l=layout[i],x=l.cx-l.w/2,y=l.cy-l.h/2+(reduced?0:Math.sin(clock*2+i)*2),hit=clock-actionAt<.35&&actionKind!=='none';rect(l.cx-l.w*.4,l.cy+l.h/2+4,l.w*.8,5,'#101b2b66');
  if(vehicleFight){const width=enemies.length>1?106:190;vehicle({model:e.vehicle||'armored',mods:[]},[],l.cx-width/2,112,width,true);}else{ctx.globalAlpha=hit&&Math.floor(clock*20)%2?.45:1;paint(e.npc?assets.characters[e.npc.race+'_'+e.npc.profession]:assets.enemies[e.key].image,x,y,l.w,l.h);ctx.globalAlpha=1;}
 });
 const elapsed=clock-actionAt;if(elapsed<.65&&!reduced&&['psi','attack'].includes(actionKind)){const l=layout.find((_,i)=>enemies[i].id===selectedTarget)||layout[0];if(l){ctx.strokeStyle=actionKind==='psi'?'#c0aeef':'#f8dc9b';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(l.cx-22,l.cy+25);ctx.lineTo(l.cx+23,l.cy-24);ctx.stroke();if(actionKind==='psi'){ctx.strokeRect(l.cx-30-elapsed*25,l.cy-25-elapsed*25,60+elapsed*50,50+elapsed*50);}}}
}
function encounterArt(current){let a=encounters[current?.event?.id];if(current?.inside&&a&&!a.interior){const inner={gas:'019',garage:'020',clinic:'021',motel:'022',pharmacy:'017',market:'016',stall:'016',cars:'025',warehouse:'001'}[a.kind];if(inner)a=encounters['building_'+inner];}return a;}
function drawEncounter(current,x,interior=false,preview=false){const a=encounterArt(current);if(!a)return;const collected=!current?.event.options?.length&&!current?.dialogue&&['crate','luggage','toolbox','medicalbox','bag','cache','gift'].includes(a.kind);if(collected)ctx.globalAlpha=.45;paint(a.image,x,interior?68:54,interior?195:203,interior?136:142);ctx.globalAlpha=1;
 if(collected)text('已搜索',x+65,145,'#d4c28b',10);
 ctx.save();ctx.translate(x-174,0);particles(a.effect,clock);ctx.restore();
 (a.creatures||[]).forEach((k,i)=>paint(assets.enemies[k].image,x+23+i*37,131+Math.sin(clock*2+i)*2,50,58));
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
  if(driving&&s.travel.preview?.battle&&!current){const e=s.travel.preview.battle.enemies[0];if(e)paint(e.npc?assets.characters[e.npc.race+'_'+e.npc.profession]:assets.enemies[e.key]?.image,pose.eventX+53,125,55,67);}
  vehicle(s.vehicle,s.party,viewCarX,140,190,driving&&pose.speed>2);ctx.restore();
 }
 if(!s.battle||carFight){ctx.globalAlpha=(1-light.light)*.52;rect(0,0,W,H,'#07152c');ctx.globalAlpha=1;
 if(light.light<.68&&!interior){const x=(viewCarX+184)*viewZoom,y=185*viewZoom+220*(1-viewZoom);ctx.globalAlpha=(.68-light.light)*.55;poly([[x,y],[W,y-29],[W,y+18]],'#ffdf99');ctx.globalAlpha=1;rect(x-3,y-2,4,3,'#f3d894');}}
 const elapsed=clock-actionAt;if(elapsed<1.3)feedback.forEach((f,i)=>text(f.text,f.x,104+i*17-elapsed*20,f.color,13));
 ctx.globalAlpha=.045;for(let y=0;y<H;y+=3)rect(0,y,W,1,'#101d25');ctx.globalAlpha=1;updateReadouts(minute,pose,ease(u)>.5?to:from,driving);
}
requestAnimationFrame(frame);
export function mountWorld(el,s,a,eventArt,{duration=12000,travelStart=performance.now(),travelSpeed=1,target=null}={}){canvas=el;ctx=canvas.getContext('2d',{alpha:false});ctx.imageSmoothingEnabled=false;state=s;assets=a;encounters=eventArt;tripDuration=duration;travelAt=travelStart;speed=travelSpeed;selectedTarget=target;displayMinute=-1;
 const next=s.current?.instance+':'+s.mode+':'+!!s.current?.inside;if(next!==key){eventAt=clock;key=next}
 // Warm actual approaching art so it is already on screen before stopping.
 const current=s.mode==='driving'?s.travel?.preview?.current:s.current;img(encounterArt(current)?.image);if(s.mode==='driving')for(const e of s.travel.preview?.battle?.enemies||[])img(e.npc?assets.characters[e.npc.race+'_'+e.npc.profession]:assets.enemies[e.key]?.image);
 canvas.setAttribute('aria-label',s.mode==='driving'?'向東行駛，鏡頭隨前方事件逐漸拉遠，減速停靠':s.battle?'敵人在中央，隊伍狀態與指令在下方':encounters[s.current?.event.id]?.title||'公路旁的車輛');}
export function captureVisual(s){return {party:Object.fromEntries(s.party.map(p=>[p.id,p.hp])),hp:s.party.reduce((n,p)=>n+p.hp,0),vehicle:s.vehicle.hp,enemies:s.battle?.enemies.reduce((n,e)=>n+e.hp,0)||0,fuel:s.resources.fuel,scrap:s.resources.scrap,medicine:s.resources.medicine,round:s.battle?.round,mode:s.mode}}
export function animateResult(before,s,type){const after=captureVisual(s);for(const p of s.party){const el=document.querySelector(`[data-person="${p.id}"]`),diff=p.hp-(before.party?.[p.id]??p.hp);if(el&&diff){el.classList.add(diff<0?'was-hit':'was-healed');}}feedback=[];for(const [key,label,x,col] of [['hp','HP',45,'#e58d79'],['vehicle','車況',48,'#e58d79'],['enemies','',174,'#f0d38e'],['fuel','汽油',176,'#a8d0b8'],['scrap','廢料',176,'#d9bc79'],['medicine','藥品',176,'#a8d0b8']]){const diff=after[key]-before[key];if(diff)feedback.push({text:`${label} ${diff>0?'+':''}${diff}`,x,color:col})}if(feedback.length||before.round!==after.round||type==='psi'){actionAt=clock;actionKind=after.enemies<before.enemies?(type==='psi'?'psi':'attack'):'none'}}
