import {partyAnchor,BEAT_MS,IMPACT_MS} from './battle-presentation.js';
const clamp=x=>Math.max(0,Math.min(1,x));
export const EFFECT_SHAPES=new Set(['impact','club','slash','claw','bite','slam','tentacle','bullet','burst_fire','cannon','acid','spores','shock','saw','dive','cross_slash','swarm','psychic','force','heal','shield','stars','silence','storm','rupture','eruption','pulse','overload','sonic','howl','shards','crush','sleep_mist','crystal','shatter','water','phantom','confuse','beam','aurora','medicine','escape']);
export function effectTargets(beat,enemies,layout,party){const ally=beat.side==='enemies'||['heal','medicine','shield'].includes(beat.visual?.shape),side=ally?'party':'enemies',ids=beat.effects.filter(e=>e.side===side).map(e=>e.id);
 if(beat.kind==='defend')return [partyAnchor(party,beat.actor)];
 if(beat.power==='shield')return party.filter(p=>p.hp>0).map(p=>partyAnchor(party,p.id));
 if(!ids.length)ids.push(beat.target|| (ally?party[0]?.id:enemies.find(e=>e.hp>0)?.id));
 return [...new Set(ids)].map(id=>ally?partyAnchor(party,id):layout[enemies.findIndex(e=>e.id===id)]).filter(Boolean);
}
export function drawBattleEffects(ctx,{beat,age,enemies,layout,party,soft=false}){if(!beat||beat.kind==='stun'||age<0||age>BEAT_MS/1000)return;
 const v=beat.visual||{shape:'impact',color:'#e5d1a7'},shape=v.shape,col=v.color,variant=v.variant||0,impact=age>=IMPACT_MS/1000,t=clamp(age/(IMPACT_MS/1000)),u=clamp((age-IMPACT_MS/1000)/((BEAT_MS-IMPACT_MS)/1000)),fade=1-u;
 const source=beat.side==='party'?partyAnchor(party,beat.actor):layout[enemies.findIndex(e=>e.id===beat.actor)]||{cx:192,cy:120},targets=effectTargets(beat,enemies,layout,party),hit=targets[0]||{cx:192,cy:120};
 const r=(x,y,w,h,c=col)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h);},line=(pts,c=col,w=2)=>{ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();},ring=(x,y,radius,c=col,w=2,ratio=1)=>{ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.ellipse(x,y,Math.max(1,radius),Math.max(1,radius*ratio),0,0,Math.PI*2);ctx.stroke();},diamond=(x,y,size,c=col)=>{line([[x,y-size],[x+size*.5,y],[x,y+size],[x-size*.5,y],[x,y-size]],c,2);},star=(x,y,size)=>{r(x-size,y-1,size*2,2);r(x-1,y-size,2,size*2);};
 const burst=(x,y,n=8,radius=24)=>{for(let i=0;i<n;i++){const a=i/n*Math.PI*2;line([[x+Math.cos(a)*radius*.45,y+Math.sin(a)*radius*.45],[x+Math.cos(a)*radius,y+Math.sin(a)*radius]],col,2);}};
 ctx.save();ctx.globalAlpha=impact?fade:.85;
 if(soft){for(const p of targets){if(impact){ring(p.cx,p.cy,17+u*10);star(p.cx,p.cy,5);}else r(source.cx-2,source.cy-14,4,7);}ctx.restore();return;}
 // Physical projectiles have distinct silhouettes and impacts; melee occurs at the target.
 if(['bullet','burst_fire','cannon','acid','spores','swarm'].includes(shape)&&!impact){const n=shape==='burst_fire'?3:shape==='spores'||shape==='swarm'?9:shape==='acid'?5:1;
  for(let i=0;i<n;i++){const k=clamp(t*1.35-i*.065),x=source.cx+(hit.cx-source.cx)*k,y=source.cy+(hit.cy-source.cy)*k-(shape==='cannon'||shape==='acid'?Math.sin(k*Math.PI)*44:0)+(shape==='spores'||shape==='swarm'?Math.sin(i*4+t*8)*11:0);
   if(shape==='cannon'){r(x-5,y-4,10,8,'#6d858f');r(x-3,y-3,5,2,col);}else if(shape==='acid'){r(x-2,y-2,5,6);r(x-1,y+4,2,5);}else if(shape==='spores'){ring(x,y,2+i%3,col,1);}else if(shape==='swarm'){r(x-3,y,6,2);line([[x-4,y-3],[x,y],[x+4,y-3]],col,1);}else{r(x-2,y-2,4,4);if(i===0)burst(source.cx,source.cy-5,5,8);}
  }
 }
 if(shape==='beam'&&!impact){ctx.globalAlpha=.25;line([[source.cx,source.cy],[source.cx+(hit.cx-source.cx)*t,source.cy+(hit.cy-source.cy)*t]],col,10);ctx.globalAlpha=.9;line([[source.cx,source.cy],[source.cx+(hit.cx-source.cx)*t,source.cy+(hit.cy-source.cy)*t]],'#fff2cd',2);}
 if(shape==='shock'||shape==='overload'){if(t>.35){const pts=[];for(let i=0;i<=9;i++){const k=i/9;pts.push([source.cx+(hit.cx-source.cx)*k+(i&&i<9?Math.sin(i*11+age*40)*14:0),source.cy+(hit.cy-source.cy)*k]);}line(pts,col,3);line(pts,'#e5f2e7',1);}}
 if(shape==='tentacle'){const reach=impact?1-u*.6:t,pts=[];for(let i=0;i<=16;i++){const k=i/16*reach;pts.push([source.cx+(hit.cx-source.cx)*k+Math.sin(k*12-age*8)*13,source.cy+(hit.cy-source.cy)*k]);}line(pts,'#5c5269',8);line(pts,col,3);}
 for(const p of targets){const x=p.cx,y=p.cy,rad=8+t*18;
  if(!impact){
   if(['impact','club','slam','crush','rupture'].includes(shape)){const lift=(1-t)*30;line([[x-8,y-20-lift],[x+8,y-25-lift]],col,shape==='club'?7:3);}
   if(['slash','claw','cross_slash','phantom','dive'].includes(shape)){ctx.globalAlpha=t*.65;line([[x-22,y+22],[x-5+t*29,y+5-t*29]],col,2);}
   if(shape==='bite'){line([[x-20,y-18-(1-t)*12],[x-8,y-10],[x,y-18],[x+8,y-10],[x+20,y-18-(1-t)*12]],col,3);line([[x-18,y+18+(1-t)*12],[x,y+12],[x+18,y+18+(1-t)*12]],col,3);}
   if(['force','pulse','sonic','howl','psychic','silence','confuse'].includes(shape)){ring(x,y,32-t*17,col,2,shape==='sonic'||shape==='howl'?.5:1);ring(x,y,42-t*14,col,1);}
   if(['crystal','shards','shatter','stars'].includes(shape))for(let i=0;i<5;i++){const a=i*1.26;diamond(x+Math.cos(a)*rad,y+Math.sin(a)*rad,3+t*5);}
   if(['storm','eruption','aurora'].includes(shape))for(let i=0;i<5;i++){const px=x-28+i*14;r(px,y-50+t*28,3,9+i%2*6);}
   if(shape==='water'){for(let i=0;i<3;i++)ring(x,y+14,rad+i*9,col,2,.3);}
   if(shape==='sleep_mist'){ctx.globalAlpha=.2+t*.3;for(let i=0;i<5;i++)r(x-30+i*12,y-12+Math.sin(i+age*7)*6,23,9);}
  }else{
   if(shape==='club'||shape==='impact'){burst(x,y,7,14+u*23);r(x-4,y-5,8,10,'#f0dfbe');}
   if(['slash','claw','cross_slash','dive','phantom'].includes(shape)){const n=shape==='claw'?3:shape==='cross_slash'?4:shape==='phantom'?2:1;for(let i=0;i<n;i++){const shift=(i-(n-1)/2)*9;if(i%2&&shape==='cross_slash')line([[x-24,y-28],[x+24,y+22]],col,3);else line([[x-23+shift+u*9,y+23],[x+24+shift,y-28+u*9]],col,3);}if(shape==='dive')burst(x,y,6,28);}
   if(shape==='bite'){for(const direction of [-1,1])for(let i=0;i<4;i++)line([[x-20+i*12,y+direction*(20-u*10)],[x-16+i*12,y+direction*7],[x-12+i*12,y+direction*(20-u*10)]],col,2);}
   if(['slam','crush','rupture','eruption'].includes(shape)){ring(x,y+16,12+u*45,col,3,.25);for(let i=0;i<6;i++){const a=i*Math.PI/3;line([[x,y+10],[x+Math.cos(a)*20,y+10+Math.sin(a)*11],[x+Math.cos(a)*37,y+10+Math.sin(a)*19]],col,2);r(x-26+i*10,y-10-Math.sin(u*Math.PI)*20,4,6);}}
   if(['bullet','burst_fire','shock','overload','beam'].includes(shape)){burst(x,y,shape==='burst_fire'?9:6,9+u*18);if(shape==='overload')for(let i=0;i<3;i++)ctx.strokeRect(x-22+i*5,y-20+i*4,35,32);}
   if(shape==='cannon'){ctx.globalAlpha=fade*.45;ring(x,y,9+u*39,'#c59c79',10);ctx.globalAlpha=fade;burst(x,y,10,14+u*35);r(x-6,y-6,12,12,'#f3d5a0');}
   if(shape==='acid'){for(let i=0;i<9;i++){const a=i*2.4;r(x+Math.cos(a)*(8+u*23),y+Math.sin(a)*17+u*13,3,5);}ring(x,y+18,12+u*15,col,2,.3);}
   if(['spores','swarm','sleep_mist'].includes(shape)){for(let i=0;i<14;i++){const a=i*2.4,px=x+Math.cos(a)*(8+u*32),py=y+Math.sin(a)*24-u*10;if(shape==='swarm'){line([[px-4,py-3],[px,py],[px+4,py-3]],col,1);r(px-2,py,4,3);}else{ctx.globalAlpha=fade*(shape==='sleep_mist'?.25:.75);ring(px,py,shape==='sleep_mist'?11:3+i%3,col,shape==='sleep_mist'?6:1);}}}
   if(['force','pulse','sonic','howl','psychic','silence','confuse'].includes(shape)){for(let i=0;i<3;i++)ring(x+(shape==='confuse'?Math.sin(age*10+i)*12:0),y,6+u*35+i*9,col,2,shape==='sonic'||shape==='howl'?.45:1);if(shape==='silence')line([[x-18,y-18],[x+18,y+18]],col,4);if(shape==='pulse')for(let i=0;i<4;i++)r(x-24+i*16,y-2,6,4);}
   if(['crystal','shards','shatter','stars'].includes(shape)){for(let i=0;i<8;i++){const a=i*Math.PI/4,px=x+Math.cos(a)*(8+u*33),py=y+Math.sin(a)*(8+u*33);if(shape==='stars')star(px,py,4);else diamond(px,py,4+i%3*2);}}
   if(shape==='water'){for(let i=0;i<4;i++)ring(x,y+16-i*5,15+u*34+i*6,col,2,.3);for(let i=0;i<8;i++)r(x-28+i*8,y-10-Math.sin(u*Math.PI)*22,2,5);}
   if(shape==='storm'||shape==='aurora'){for(let i=0;i<6;i++){const px=x-36+i*14;if(shape==='storm')line([[px,y-45],[px-7,y-15],[px+4,y-23],[px-3,y+15]],col,2);else{ctx.globalAlpha=fade*.35;line([[px,y-53],[px+Math.sin(age*7+i)*12,y-17],[px-4,y+22]],i%2?'#a9d0bd':col,5);}}}
  }
  if(shape==='saw'){const rot=age*26,R=impact?21:10+t*12;for(let i=0;i<12;i++){const a=i*Math.PI/6+rot;line([[x+Math.cos(a)*R*.6,y+Math.sin(a)*R*.6],[x+Math.cos(a+.2)*R,y+Math.sin(a+.2)*R]],col,3);}ring(x,y,R*.55,col,3);}
  if(shape==='heal'||shape==='medicine'){ctx.globalAlpha=impact?fade:.3+t*.5;for(let i=0;i<7;i++){const px=x-24+i*8,py=y-((age*50+i*11)%48);if(shape==='medicine'||variant===0)star(px,py,3);else if(variant===4)ring(px,py,3,col,1);else if(variant===5)line([[px-3,py+4],[px+3,py-4]],col,2);else if(variant===6)star(px,py,2+i%2*2);else{r(px-3,py,6,3);r(px,py-3,2,5);}}ring(x,y+13,15+t*12,col,1,.25);if(variant===3)line([[x-24,y+6],[x-11,y-14],[x,y-4],[x+13,y-23],[x+25,y-5]],col,1);}
  if(shape==='shield'){const R=20+t*8;if(variant===4)ring(x,y-5,R,col,2,1.15);else if(variant===3){diamond(x,y-5,R);diamond(x,y-5,R*.65);}else{const n=variant===1?6:variant===2?8:5,pts=[];for(let i=0;i<=n;i++){const a=i/n*Math.PI*2-Math.PI/2;pts.push([x+Math.cos(a)*R,y-5+Math.sin(a)*R]);}line(pts,col,2);if(variant===5||variant===6)ring(x+(variant===6?-8:8),y-5,R*.75,col,1);} }
 }
 if(shape==='escape')for(let i=0;i<3;i++)line([[source.cx-24-i*7,source.cy-8-i*5],[source.cx-10-i*7,source.cy-8-i*5]],col,2);
 // Damage numbers stay with their original enemy slot or actual struck traveller.
 if(impact){ctx.globalAlpha=fade;ctx.font='bold 16px monospace';ctx.textAlign='center';for(const f of beat.effects){const p=f.side==='enemies'?layout[enemies.findIndex(e=>e.id===f.id)]:partyAnchor(party,f.id==='vehicle'?party[0]?.id:f.id);if(!p)continue;ctx.fillStyle='#162532';const label=f.amount>0?'+'+f.amount:String(f.amount);ctx.fillText(label,p.cx+1,p.cy-24-u*16+1);ctx.fillStyle=f.amount>0?'#b8e1bc':'#fff0ca';ctx.fillText(label,p.cx,p.cy-24-u*16);}if(!beat.effects.length&&['attack','psi'].includes(beat.kind)&&!['shield','heal'].includes(shape)){ctx.fillStyle='#d1dbd4';ctx.fillText(beat.label.includes('落空')?'MISS':'',hit.cx,hit.cy-20-u*10);}}
 ctx.restore();
}
