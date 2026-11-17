// Lightweight 384px stage: layered pixel art, no physics engine or continuous DOM writes.
import {phase,display} from './engine.js';
const W=384,H=240,images=new Map(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let canvas,ctx,state,assets,encounters,lastFrame=0,lastTime=0,clock=0,roadTravel=0,eventAt=0,key='',actionAt=-10,feedback=[],actionKind='',travelAt=0,tripDuration=12000,speed=1;
function img(path){if(!path)return null;if(!images.has(path)){const i=new Image();i.src='assets/'+path;images.set(path,i)}const i=images.get(path);return i.complete&&i.naturalWidth?i:null}
function paint(path,x,y,w,h){const i=img(path);if(i)ctx.drawImage(i,Math.round(x),Math.round(y),w,h)}
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h)}
function poly(points,c){ctx.fillStyle=c;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill()}
function text(s,x,y,col='#e9d6a3',size=8){ctx.font=`bold ${size}px monospace`;ctx.textAlign='left';ctx.fillStyle='#13242c';ctx.fillText(s,x+1,y+1);ctx.fillStyle=col;ctx.fillText(s,x,y)}
function rnd(i){return ((Math.sin(i*127.1+41.7)*43758.5453)%1+1)%1}
function phaseColors(){const p=phase(state.minutes);return p==='night'?['#14232e','#283c48','#34434b','#758e98']:p==='dawn'?['#b59182','#847b7d','#586e73','#ecce9b']:p==='afternoon'?['#aeae8a','#7d9290','#586e70','#edcd88']:['#8bafb4','#7c9894','#526e72','#f2dea0']}
function road(moving){const c=phaseColors();rect(0,0,W,H,c[0]);rect(302,29,15,15,c[3]);
 const d=roadTravel;
 for(let j=0;j<2;j++){let offset=d*(j?.13:.045)%W;for(let i=-1;i<2;i++){const x=i*W-offset;poly([[x,143],[x+43,95-j*12],[x+92,126],[x+166,69+j*21],[x+218,116],[x+285,96],[x+W,143]],c[j+1]);}}
 rect(0,137,W,41,'#626e62');
 const alien=state.progress>70,urban=state.progress>25&&state.progress<50;
 for(let i=-1;i<8;i++){const x=i*76-(d*.28%76),n=i+Math.floor(d*.28/76),h=18+rnd(n)*38;if(urban){rect(x,135-h,38,h,'#3e5357');for(let y=141-h;y<130;y+=9)rect(x+6,y,5,3,'#9c9c79');}else if(alien){poly([[x,142],[x+12,74-h/2],[x+20,110],[x+33,143]],'#444f62');rect(x+12,110,3,13,'#7bb7b0')}else{rect(x+16,119-h/2,4,h/2+28,'#495c56');rect(x+3,111-h/2,29,15,'#566b60');}}
 for(let i=-1;i<4;i++){const x=i*170-(d*.65%170);rect(x,56,4,103,'#3b4c4c');rect(x-17,67,38,3,'#344346');rect(x-11,62,3,9,'#6e817b');rect(x+10,62,3,9,'#6e817b');ctx.strokeStyle='#4a5d5b';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+2,70);ctx.quadraticCurveTo(x+85,94,x+172,70);ctx.stroke();}
 rect(0,164,W,76,'#303e43');rect(0,164,W,3,'#a69e78');rect(0,168,W,3,'#56645d');rect(0,228,W,3,'#8e9077');
 for(let i=-1;i<9;i++){const x=i*64-(d*2%64);rect(x,211,29,3,'#d2bd80');rect(x+23,184,6,1,'#26363c');}
 for(let i=0;i<16;i++){const x=(i*31-d*2.7%496+496)%496;rect(x,233+i%5,4+i%7,2,'#7a7965')}
 if(phase(state.minutes)==='night'){poly([[110,195],[384,176],[384,211]],'#d8d1a51a');for(let i=0;i<20;i++)rect(rnd(i)*384,rnd(i+50)*61,1,1,'#b4b9a4')}
 if(moving){const pass=(clock*31)%560;rect(425-pass,133,3,28,'#273a3e');rect(413-pass,128,39,17,'#568979');text('EAST →',416-pass,140,'#e0d8b8',7)}
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
function battle(){const b=state.battle;if(!b)return;const carFight=b.mode==='vehicle';if(carFight){vehicle(state.vehicle,state.party,8,139,160,true);b.enemies.filter(e=>e.hp>0).forEach((e,i)=>vehicle({model:e.vehicle||'armored',mods:[]},[],213+i*30,112,148,true));}else{state.party.filter(p=>p.hp>0).slice(0,4).forEach((p,i)=>person(p,19+i*26+(clock-actionAt<.65&&actionKind==='attack'?Math.sin((clock-actionAt)/.65*Math.PI)*16:0),154+i%2*15,49,false));b.enemies.filter(e=>e.hp>0).forEach((e,i)=>{const x=231+i*56,y=128+Math.sin(clock*2+i)*2;paint(e.npc?assets.characters[e.npc.race+'_'+e.npc.profession]:assets.enemies[e.key].image,x,y,58,69);rect(x,y-9,49,4,'#1c2d35');rect(x,y-9,49*e.hp/e.maxHp,4,'#d87863')})}
 const elapsed=clock-actionAt;if(elapsed<.8&&!reduced&&['psi','attack'].includes(actionKind)){const psi=actionKind==='psi';if(elapsed<.3){ctx.strokeStyle=psi?'#a7b9ec':'#f2ce7c';ctx.lineWidth=psi?4:2;ctx.beginPath();ctx.moveTo(92,168);ctx.lineTo(277,146);ctx.stroke();}if(elapsed<.5){ctx.globalAlpha=1-elapsed*2;rect(258-elapsed*10,130-elapsed*10,20+elapsed*20,20+elapsed*20,psi?'#b1b8ed':'#e3a267');ctx.globalAlpha=1}}
}
function frame(time){requestAnimationFrame(frame);if(!canvas?.isConnected||document.hidden)return;if(time-lastFrame<33)return;const dt=Math.min((time-lastTime)/1000,.08)||.033;lastTime=time;lastFrame=time;clock+=dt;
 const s=state,driving=s.mode==='driving',carFight=s.battle?.mode==='vehicle',enter=Math.min(1,(clock-eventAt)/1.4),interior=s.current?.inside||s.frames?.at(-1)?.kind==='building';
 if(driving||carFight)roadTravel+=dt*65*speed;else if(enter<1)roadTravel+=dt*65*(1-enter);
 ctx.clearRect(0,0,W,H);if(interior&&!carFight)room();else road(driving||carFight);
 let encounter=encounters[s.current?.event.id];if(interior&&encounter&&!encounter.interior){const inner={gas:'019',garage:'020',clinic:'021',motel:'022',pharmacy:'017',market:'016',stall:'016',cars:'025',warehouse:'001'}[encounter.kind];if(inner)encounter=encounters['building_'+inner];}
 if(encounter&&!driving&&!s.battle){const x=interior?153:174+(1-enter)**3*230;const collected=!s.current?.event.options?.length&&!s.current?.dialogue&&['crate','luggage','toolbox','medicalbox','bag','cache','gift'].includes(encounter.kind);if(collected)ctx.globalAlpha=.45;paint(encounter.image,x,interior?68:62,interior?195:203,interior?136:142);ctx.globalAlpha=1;if(collected)text('已搜索',x+65,145,'#d4c28b',10);particles(encounter.effect,clock);(encounter.creatures||[]).forEach((k,i)=>paint(assets.enemies[k].image,x+23+i*37,131+Math.sin(clock*2+i)*2,50,58));
  if(!interior)vehicle(s.vehicle,s.party,6,150,139,enter<1);
  if(interior||s.current?.dialogue){const actor=s.party.find(p=>p.id===s.actorId&&p.hp>0)||s.party.find(p=>p.hp>0);if(actor)person(actor,interior?48:70+Math.min(1,(clock-eventAt)/2.2)*60,interior?157:166,interior?49:38,clock-eventAt<2.2)}
  if(s.current?.npc)person(s.current.npc,interior?257:294,interior?147:153,interior?54:43);
 }else if(!s.battle){const p=driving?Math.min(1,(time-travelAt)/tripDuration):1;vehicle(s.vehicle,s.party,driving?54+Math.sin(p*Math.PI)*19:16,140,190,driving);if(driving){rect(14,223,356,2,'#445958');rect(14,223,356*p,2,'#d1bd86');text(`${Math.floor(p*100)}%`,340,218,'#b3c8bd',8)}}
 if(s.battle){if(encounter&&!carFight){paint(encounter.image,172,44,170,119);particles(encounter.effect,clock);}battle();}
 const elapsed=clock-actionAt;if(elapsed<1.3){feedback.forEach((f,i)=>text(f.text,f.x,130+i*12-elapsed*20,f.color,12));}
 // Near-ground dust and scanlines tie sprites to the same low resolution world.
 ctx.globalAlpha=.06;for(let y=0;y<H;y+=3)rect(0,y,W,1,'#101d25');ctx.globalAlpha=1;
}
requestAnimationFrame(frame);
export function mountWorld(el,s,a,eventArt,{duration=12000,travelStart=performance.now(),travelSpeed=1}={}){canvas=el;ctx=canvas.getContext('2d',{alpha:false});ctx.imageSmoothingEnabled=false;state=s;assets=a;encounters=eventArt;tripDuration=duration;travelAt=travelStart;speed=travelSpeed;
 const next=s.current?.instance+':'+s.mode+':'+!!s.current?.inside;if(next!==key){eventAt=clock;key=next}canvas.setAttribute('aria-label',s.mode==='driving'?'車輛向東行駛，遠景與公路持續後退':s.battle?'戰鬥場景':encounters[s.current?.event.id]?.title||'公路旁的車輛');}
export function captureVisual(s){return {hp:s.party.reduce((n,p)=>n+p.hp,0),vehicle:s.vehicle.hp,enemies:s.battle?.enemies.reduce((n,e)=>n+e.hp,0)||0,fuel:s.resources.fuel,scrap:s.resources.scrap,medicine:s.resources.medicine,round:s.battle?.round,mode:s.mode}}
export function animateResult(before,s,type){const after=captureVisual(s);feedback=[];for(const [key,label,x,col] of [['hp','HP',45,'#e58d79'],['vehicle','車況',48,'#e58d79'],['enemies','',264,'#f0d38e'],['fuel','汽油',176,'#a8d0b8'],['scrap','廢料',176,'#d9bc79'],['medicine','藥品',176,'#a8d0b8']]){const diff=after[key]-before[key];if(diff)feedback.push({text:`${label} ${diff>0?'+':''}${diff}`,x,color:col})}if(feedback.length||before.round!==after.round||type==='psi'){actionAt=clock;actionKind=after.enemies<before.enemies?(type==='psi'?'psi':'attack'):'none'}}
