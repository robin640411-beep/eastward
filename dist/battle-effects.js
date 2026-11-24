import {partyAnchor,BEAT_MS,IMPACT_MS} from './battle-presentation.js';
const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>{n=clamp(n);return n*n*(3-2*n);};
const lerp=(a,b,t)=>a+(b-a)*t;
const LIGHT='#fff0cc',INK='#23303e';
export const EFFECT_SHAPES=new Set(['impact','club','slash','claw','bite','slam','tentacle','bullet','burst_fire','cannon','acid','spores','shock','saw','dive','cross_slash','swarm','psychic','force','heal','shield','stars','silence','storm','rupture','eruption','pulse','overload','sonic','howl','shards','crush','sleep_mist','crystal','shatter','water','phantom','confuse','beam','aurora','medicine','escape']);
const PROJECTILES=new Set(['bullet','burst_fire','cannon','acid','spores','swarm','shock','saw','dive','stars','shards','crystal','beam']);
const MELEE=new Set(['impact','club','slash','claw','bite','slam','tentacle','cross_slash']);
const HEALING=new Set(['heal','medicine']);
const validPoint=p=>p&&Number.isFinite(p.cx)&&Number.isFinite(p.cy);
function allyAnchor(party,id,{partyY,vehicleTarget}={}){
 if(id==='vehicle')return validPoint(vehicleTarget)?vehicleTarget:null;
 if(!party.some(p=>p.id===id))return null;
 const p=partyAnchor(party,id,partyY);return validPoint(p)?{...p,cy:Number.isFinite(partyY)?partyY:p.cy}:null;
}
function targetAnchor(side,id,enemies,layout,party,options){
 if(side==='vehicle'||id==='vehicle')return allyAnchor(party,'vehicle',options);
 if(side==='party')return allyAnchor(party,id,options);
 const index=enemies.findIndex(e=>e.id===id);return index>=0&&validPoint(layout[index])?layout[index]:null;
}
function recipients(beat,enemies,layout,party,options={},actualOnly=false){
 if(!beat)return [];
 const shape=beat.visual?.shape,heal=HEALING.has(shape),shield=shape==='shield';
 const side=(heal||shield)?beat.side:(beat.side==='enemies'?'party':'enemies');
 if(beat.kind==='defend')return actualOnly?[]:[{side:'party',id:beat.actor,point:allyAnchor(party,beat.actor,options)}].filter(r=>r.point);
 if(shield&&beat.power==='shield')return actualOnly?[]:(beat.side==='enemies'?enemies.filter(e=>e.hp>0).map(e=>({side:'enemies',id:e.id,point:targetAnchor('enemies',e.id,enemies,layout,party,options)})):party.filter(p=>p.hp>0).map(p=>({side:'party',id:p.id,point:allyAnchor(party,p.id,options)}))).filter(r=>r.point);
 const effects=(beat.effects||[]).filter(f=>(f.side===side||(side==='party'&&f.side==='vehicle'))&&(heal?f.amount>0:f.amount<0));
 const records=effects.map(f=>({...f,point:targetAnchor(f.side,f.id,enemies,layout,party,options)})).filter(r=>r.point);
 if(!records.length&&!actualOnly&&beat.target){const targetSide=beat.target==='vehicle'?'vehicle':side;const point=targetAnchor(targetSide,beat.target,enemies,layout,party,options);if(point)records.push({side:targetSide,id:beat.target,point});}
 return records.filter((r,i,a)=>a.findIndex(x=>x.side===r.side&&x.id===r.id)===i);
}
// Explicit IDs only. Unknown actors/victims never become the first party slot.
export function effectTargets(beat,enemies,layout,party,options={}){return recipients(beat,enemies,layout,party,options).map(r=>r.point);}

// All artwork is stamped on the logical pixel grid. There are no blurred circles,
// full-screen damage flashes, gradient glows, or shared beam substitutes.
function pixels(ctx,col){
 const box=(x,y,w=2,h=w,c=col)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));};
 const stroke=(a,b,c=col,width=2)=>{const dx=b[0]-a[0],dy=b[1]-a[1],steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/2));for(let i=0;i<=steps;i++)box(a[0]+dx*i/steps-width/2,a[1]+dy*i/steps-width/2,width,width,c);};
 const path=(points,c=col,width=2)=>{for(let i=1;i<points.length;i++)stroke(points[i-1],points[i],c,width);};
 const arc=(x,y,rx,ry,start,end,c=col,width=2,steps=16)=>{let last=null;for(let i=0;i<=steps;i++){const a=lerp(start,end,i/steps),p=[x+Math.cos(a)*rx,y+Math.sin(a)*ry];if(last)stroke(last,p,c,width);last=p;}};
 const diamond=(x,y,r,c=col,width=2)=>path([[x,y-r],[x+r*.6,y],[x,y+r],[x-r*.6,y],[x,y-r]],c,width);
 const star=(x,y,r=4,c=LIGHT)=>{box(x-r,y-1,r*2+1,2,c);box(x-1,y-r,2,r*2+1,c);box(x-2,y-2,4,4,col);box(x,y,1,1,c);};
 const flecks=(x,y,u,n=7,r=24,c=col)=>{for(let i=0;i<n;i++){const a=i*2.399,reach=3+u*r,px=x+Math.cos(a)*reach,py=y+Math.sin(a)*reach+u*u*9;stroke([px,py],[px+Math.cos(a)*4,py+Math.sin(a)*4],i%3?c:LIGHT,i%3?2:3);}};
 const plus=(x,y,size=4,c=col)=>{box(x-size,y-1,size*2+1,3,c);box(x-1,y-size,3,size*2+1,c);};
 return {box,stroke,path,arc,diamond,star,flecks,plus};
}
function charge(p,source,shape,t,col,variant=0){
 const {cx:x,cy:y}=source;
 if(MELEE.has(shape)){
  if(shape==='club'){p.stroke([x+5,y-2],[x+11-8*t,y-28],INK,8);p.stroke([x+5,y-2],[x+11-8*t,y-28],'#b38c63',5);p.box(x+5,y-3,4,7,'#d7b984');}
  else if(shape==='bite'){for(const d of [-1,1])p.path([[x-9,y+d*10],[x-3,y+d*5],[x+3,y+d*10],[x+9,y+d*5]],col,2);}
  else if(shape==='tentacle'){p.path([[x-7,y+5],[x-13,y-6],[x-6,y-16],[x+5,y-10],[x+4,y-2]],col,3);}
  else if(shape==='slam'){p.path([[x-11,y-5-t*10],[x-11,y-17-t*10],[x+9,y-17-t*10]],col,4);p.stroke([x-18,y+1],[x-18,y-8-t*9],col,2);}
  else if(shape==='impact'){p.box(x+4,y-15,10,8,INK);p.box(x+6,y-16,8,7,col);p.box(x+5,y-9,4,4,'#aa8769');}
  else {p.stroke([x-8,y+3],[x+8,y-22],INK,5);p.stroke([x-8,y+3],[x+8,y-22],col,3);p.stroke([x-12,y-1],[x-4,y+5],'#b59b71',3);}
 }else if(['bullet','burst_fire','cannon'].includes(shape)){
  p.box(x-8,y-7,16,6,INK);p.box(x-6,y-7,12,3,'#95a4a5');p.box(x-5,y-1,4,6,'#6d6e61');if(t>.7)p.box(x+8,y-6,3,3,col);
 }else if(shape==='shock'||shape==='overload'){
  p.path([[x-12,y-9],[x-6,y-16],[x-1,y-9],[x+6,y-18],[x+12,y-8]],col,2);p.box(x-2,y-6,4,4,LIGHT);
 }else if(shape==='acid'||shape==='spores'||shape==='sleep_mist'){
  for(let i=0;i<3;i++)p.box(x-7+i*7,y-10-(i%2)*5,3+t*3,4,col);
 }else if(shape==='swarm'){
  for(let i=0;i<3;i++){const xx=x-9+i*8;p.path([[xx-4,y-9],[xx,y-5],[xx+4,y-10]],col,2);}
 }else if(shape==='saw'){
  gear(p,x,y-10,9+t*3,t*5,col);
 }else if(['crystal','shards','shatter','stars'].includes(shape)){
  for(let i=0;i<3;i++){const a=-Math.PI/2+i*2.09;p.diamond(x+Math.cos(a)*13,y-5+Math.sin(a)*13,3+t*3,col,2);}
 }else if(shape==='water'){
  p.arc(x,y+7,9+t*10,3,0,Math.PI*2,col,2,12);p.box(x-2,y-11+t*4,4,6,col);
 }else if(shape==='sonic'||shape==='howl'){
  for(let i=0;i<2;i++)p.arc(x,y-7,8+i*8,5+i*4,-2.7,-.4,col,2,10);
 }else if(shape==='beam'||shape==='aurora'){
  p.star(x,y-10,3+t*4,LIGHT);p.box(x-12,y-8,4,2,col);p.box(x+9,y-8,4,2,col);
 }else if(shape==='rupture'||shape==='eruption'||shape==='crush'){
  for(let i=0;i<3;i++)p.path([[x-12+i*11,y+3],[x-10+i*11,y-9-i%2*5],[x-7+i*11,y-4]],col,2);
 }else{
  p.diamond(x,y-7,6+t*8,col,2);if(variant%2)p.box(x-2,y-12,4,8,LIGHT);else p.box(x-4,y-9,8,3,LIGHT);
 }
}
function gear(p,x,y,r,rotation,col){
 for(let i=0;i<10;i++){const a=i*Math.PI/5+rotation;p.path([[x+Math.cos(a)*r*.65,y+Math.sin(a)*r*.65],[x+Math.cos(a)*r,y+Math.sin(a)*r],[x+Math.cos(a+.27)*r*.85,y+Math.sin(a+.27)*r*.85]],i%2?col:'#61717c',3);}
 p.diamond(x,y,r*.35,LIGHT,2);
}
function flight(p,source,target,shape,k,age,col,miss=false){
 const end={cx:target.cx+(miss?35:0),cy:target.cy-(miss?22:0)},x=lerp(source.cx,end.cx,k),y=lerp(source.cy,end.cy,k),dx=end.cx-source.cx,dy=end.cy-source.cy,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len;
 if(['bullet','burst_fire','cannon'].includes(shape)){
  const count=shape==='burst_fire'?3:1;
  for(let i=0;i<count;i++){const kk=clamp(k*(1+i*.12)-i*.12),xx=lerp(source.cx,end.cx,kk),yy=lerp(source.cy,end.cy,kk)-(shape==='cannon'?Math.sin(kk*Math.PI)*22:0);
   if(shape==='cannon'){p.box(xx-5,yy-4,10,8,'#55636e');p.box(xx-3,yy-3,6,3,col);p.box(xx-5-ux*6,yy-uy*6,3,3,'#a57f66');}
   else{p.stroke([xx-ux*10,yy-uy*10],[xx,yy],col,3);p.box(xx-1,yy-1,3,3,LIGHT);}
  }
  if(k<.27){p.star(source.cx+ux*11,source.cy+uy*11,6,col);p.box(source.cx-ux*5+4,source.cy-uy*5+k*25,3,2,'#a69a77');}
 }else if(shape==='acid'){
  const yy=y-Math.sin(k*Math.PI)*27;p.box(x-3,yy-5,7,8,col);p.box(x-1,yy-7,3,3,'#d6dfa3');p.box(x-ux*8,yy-uy*8,3,4,col);
 }else if(shape==='spores'||shape==='swarm'){
  for(let i=0;i<7;i++){const a=i*2.4,xx=x+Math.cos(a)*(5+k*8),yy=y+Math.sin(a)*(4+k*7);if(shape==='swarm'){p.box(xx-1,yy,3,4,'#655f45');p.path([[xx-4,yy-3],[xx,yy+1],[xx+4,yy-3]],col,1);}else{p.box(xx,yy,3+i%2,3+i%2,col);p.box(xx-1,yy+1,1,2,'#d9dfb8');}}
 }else if(shape==='shock'){
  const span=18;p.path([[x-ux*span,y-uy*span],[x-ux*12-uy*6,y-uy*12+ux*6],[x-ux*7+uy*5,y-uy*7-ux*5],[x,y]],col,3);p.box(x-1,y-1,3,3,LIGHT);
 }else if(shape==='saw')gear(p,x,y,13,age*37,col);
 else if(['stars','shards','crystal'].includes(shape)){
  for(let i=0;i<3;i++){const offset=(i-1)*9,xx=x-uy*offset-ux*i*5,yy=y+ux*offset-uy*i*5;if(shape==='stars')p.star(xx,yy,4+i%2,col);else p.diamond(xx,yy,shape==='crystal'?8:5,col,2);}
 }else if(shape==='beam'){
  // Lumen's light beam is the only straight continuous energy ray.
  p.stroke([source.cx,source.cy],[x,y],col,5);p.stroke([source.cx,source.cy],[x,y],LIGHT,2);p.star(source.cx,source.cy,4,col);
 }else if(shape==='dive'){
  p.path([[x-ux*18-uy*8,y-uy*18+ux*8],[x,y],[x-ux*18+uy*8,y-uy*18-ux*8]],col,3);p.stroke([x-ux*27,y-uy*27],[x-ux*8,y-uy*8],'#75838b',2);
 }
}
function approach(p,source,target,shape,k,age,col){
 const x=target.cx,y=target.cy;
 if(PROJECTILES.has(shape)){flight(p,source,target,shape,k,age,col);return;}
 if(shape==='tentacle'){
  const reach=ease(k),points=[];for(let i=0;i<=12;i++){const f=i/12*reach,side=Math.sin(f*12-age*12)*10*Math.sin(i/12*Math.PI);points.push([lerp(source.cx,x,f)+side,lerp(source.cy,y,f)]);}p.path(points,'#58445b',7);p.path(points,col,3);return;
 }
 if(MELEE.has(shape)){
  if(k<.52)return;const q=(k-.52)/.48;
  if(shape==='bite'){for(const d of [-1,1])p.path([[x-18,y+d*(26-q*10)],[x-9,y+d*(18-q*7)],[x,y+d*(24-q*10)],[x+9,y+d*(18-q*7)],[x+18,y+d*(26-q*10)]],col,2);}
  else if(shape==='slam'){p.path([[x-21,y-35+q*8],[x-21,y-43+q*8],[x+21,y-43+q*8],[x+21,y-35+q*8]],col,4);}
  else p.arc(x-5,y+2,29,25,-2.5,-2.5+q*.8,col,shape==='club'?5:2,8);
  return;
 }
 if(['sonic','howl','force','pulse'].includes(shape)){
  const xx=lerp(source.cx,x,k),yy=lerp(source.cy,y,k);if(shape==='pulse'){p.path([[xx-9,yy-7],[xx-3,yy-7],[xx-3,yy+7],[xx+4,yy+7],[xx+4,yy-3],[xx+10,yy-3]],col,2);}else if(shape==='force')p.path([[xx-10,yy+8],[xx,yy-2],[xx+10,yy+8]],col,3);else for(let i=0;i<2;i++)p.arc(xx,yy,10+i*7,6+i*4,-2.7,-.4,col,2,10);
 }else if(['psychic','silence','confuse'].includes(shape)){
  const r=22-k*6;for(let i=0;i<3;i++){const a=i*2.09+k*3;p.diamond(x+Math.cos(a)*r,y-10+Math.sin(a)*r,3,col,1);}if(k>.65)p.path([[x-10,y-22],[x,y-28],[x+10,y-22]],col,2);
 }else if(['storm','overload','aurora'].includes(shape)){
  for(let i=0;i<3;i++){const xx=x+(i-1)*15;p.box(xx,y-48+k*13,3,5+i%2*4,col);}if(k>.65)p.path([[x-18,y-36],[x-7,y-39],[x+4,y-35],[x+19,y-39]],col,2);
 }else if(['rupture','eruption','crush'].includes(shape)){
  for(let d of [-1,1])p.path([[x+d*(26-k*8),y+13],[x+d*(29-k*8),y-4],[x+d*(22-k*7),y-14]],col,3);
 }else if(['shatter','phantom'].includes(shape)){
  for(let i=0;i<3;i++){const a=i*2.09-k*2,xx=x+Math.cos(a)*(30-k*13),yy=y+Math.sin(a)*(24-k*8);if(shape==='shatter')p.diamond(xx,yy,5,col,2);else p.stroke([xx-5,yy+8],[xx+5,yy-8],col,2);}
 }else if(shape==='water'){
  p.arc(x,y+17,12+k*14,4,0,Math.PI*2,col,2,14);p.path([[x-17,y+11],[x-12,y-2-k*8],[x-8,y+6]],col,3);
 }else if(shape==='sleep_mist'){
  for(let i=0;i<4;i++)p.path([[x-20+i*12,y+10],[x-23+i*12,y-k*16],[x-17+i*12,y-5-k*15]],col,2);
 }
}
function slash(p,x,y,u,col,count=1,cross=false){
 const grow=ease(clamp(u/.2)),fade=1-clamp((u-.24)/.76);
 for(let i=0;i<count;i++){const shift=(i-(count-1)/2)*7,flip=cross&&i%2?-1:1;
  p.path([[x-22+shift,y+flip*22],[x-8+shift,y+flip*10],[x+lerp(-8,23,grow)+shift,y+flip*lerp(10,-24,grow)]],col,Math.max(1,4*fade));
  if(u<.3)p.stroke([x-8+shift,y+flip*9],[x+13+shift,y-flip*13],LIGHT,2);
 }
}
function contact(p,x,y,shape,u,col){
 const quick=clamp(u/.38),late=clamp((u-.2)/.8);
 switch(shape){
  case 'impact':case 'club':
   if(u<.24){p.box(x-7,y-5,14,10,col);p.box(x-3,y-3,6,6,LIGHT);}p.flecks(x,y,quick,shape==='club'?9:6,shape==='club'?27:19);break;
  case 'slash':case 'claw':case 'cross_slash':case 'phantom':case 'dive':
   slash(p,x,y,u,col,shape==='claw'?3:shape==='cross_slash'?4:shape==='phantom'?2:1,shape==='cross_slash');if(shape==='dive'&&u<.5)p.flecks(x,y,quick,5,18);break;
  case 'bite':
   for(const d of [-1,1])for(let i=0;i<4;i++){const xx=x-18+i*11;p.path([[xx,y+d*(15+late*5)],[xx+4,y+d*6],[xx+8,y+d*(15+late*5)]],col,3);}if(u<.2)p.box(x-2,y-2,4,4,LIGHT);break;
  case 'slam':case 'crush':case 'rupture':case 'eruption':
   p.arc(x,y+15,8+quick*23,2+quick*6,0,Math.PI*2,col,2,16);
   for(let i=0;i<5;i++){const xx=x-22+i*11,hh=(shape==='eruption'?31:17)*(1-late),yy=y+12-Math.sin(quick*Math.PI)*hh;p.box(xx,yy,3+i%2,5+i%3,col);}
   if(shape==='crush')for(const d of [-1,1])p.path([[x+d*(19+late*5),y-19],[x+d*(10+late*9),y],[x+d*(19+late*5),y+18]],col,4);
   else if(shape==='rupture')p.path([[x-13,y-12],[x-5,y-3],[x+3,y-9],[x+12,y+9]],col,4);
   else if(shape==='eruption')for(let i=0;i<3;i++)p.path([[x-12+i*12,y+10],[x-17+i*12,y-7-quick*9],[x-9+i*12,y-4]],i%2?LIGHT:col,3);
   break;
  case 'bullet':case 'burst_fire':{
   const n=shape==='burst_fire'?3:1;
   for(let i=0;i<n;i++){const q=(u-i*.12)/.45;if(q>=0&&q<1){p.flecks(x+(i-1)*3,y-i%2*5,q,5,13);if(q<.6)p.star(x+(i-1)*3,y-i%2*5,5,LIGHT);}}break;}
  case 'cannon':
   if(u<.25){p.box(x-9,y-7,18,14,'#a97750');p.box(x-5,y-5,10,10,col);p.box(x-2,y-3,5,6,LIGHT);}for(let i=0;i<7;i++){const a=i*2.4,xx=x+Math.cos(a)*(8+quick*20),yy=y+Math.sin(a)*(8+quick*17);p.box(xx,yy,7-late*4,6-late*4,i%2?col:'#7a776f');}break;
  case 'acid':
   for(let i=0;i<8;i++){const a=i*2.4;p.box(x+Math.cos(a)*(5+quick*19),y+Math.sin(a)*10+u*16,3,4+i%2,col);}p.arc(x,y+17,7+quick*14,3,0,Math.PI*2,col,2,12);break;
  case 'spores':case 'swarm':case 'sleep_mist':
   for(let i=0;i<9;i++){const a=i*2.4,xx=x+Math.cos(a)*(7+quick*20),yy=y+Math.sin(a)*16-u*10;if(shape==='swarm'){p.path([[xx-4,yy-3],[xx,yy],[xx+4,yy-3]],col,1);p.box(xx,yy,2,4,'#7e815a');}else if(shape==='sleep_mist'){p.arc(xx,yy,4+i%2*3,3+i%2,-2.9,1,col,2,7);}else p.plus(xx,yy,2,col);}break;
  case 'shock':case 'overload':
   for(let i=0;i<(shape==='overload'?4:2);i++){const xx=x-16+i*11;p.path([[xx,y-19],[xx+7,y-10],[xx-2,y-3],[xx+7,y+9],[xx+2,y+17]],col,2);}if(u<.26)p.star(x,y,5,LIGHT);if(shape==='overload'&&u>.18)p.flecks(x,y,late,7,23,'#849fa5');break;
  case 'saw':gear(p,x,y,16-u*5,u*35,col);p.flecks(x+7,y+3,quick,7,24);break;
  case 'tentacle':
   p.path([[x-16,y-17],[x-4,y-3],[x+8,y+8],[x+20,y+10]],'#635166',6);p.path([[x-16,y-17],[x-4,y-3],[x+8,y+8],[x+20,y+10]],col,2);if(u<.3)p.star(x,y,5,LIGHT);break;
  case 'force':case 'pulse':
   if(shape==='force')for(let i=0;i<3;i++)p.diamond(x,y,7+quick*17+i*6,col,i?1:3);else for(let i=0;i<3;i++){const yy=y-12+i*12;p.path([[x-22-quick*4,yy],[x-10,yy],[x-5,yy-7],[x+4,yy+7],[x+10,yy],[x+22+quick*4,yy]],col,2);}break;
  case 'sonic':case 'howl':
   for(let i=0;i<(shape==='howl'?4:3);i++)p.arc(x,y,8+quick*21+i*5,5+quick*10+i*3,-2.8,-.35,col,i===0?3:1,10);break;
  case 'psychic':case 'silence':case 'confuse':
   if(shape==='psychic'){p.path([[x-19,y-7],[x-8,y-16],[x+8,y-16],[x+19,y-7],[x+8,y+2],[x-8,y+2],[x-19,y-7]],col,2);p.diamond(x,y-7,6,LIGHT,2);}
   else if(shape==='silence'){p.arc(x,y-6,17,17,.2,5.5,col,2,20);p.stroke([x-15,y-21],[x+15,y+9],col,3);}
   else for(let i=0;i<3;i++){const a=i*2.09+u*4;p.diamond(x+Math.cos(a)*20,y-10+Math.sin(a)*13,5,col,2);}
   break;
  case 'stars':case 'shards':case 'crystal':case 'shatter':
   for(let i=0;i<(shape==='shatter'?8:5);i++){const a=i*2.4,rr=5+quick*(shape==='shatter'?27:19),xx=x+Math.cos(a)*rr,yy=y+Math.sin(a)*rr;if(shape==='stars')p.star(xx,yy,3+i%2,col);else p.diamond(xx,yy,3+i%3,col,2);}if(shape==='crystal'&&u<.38)p.diamond(x,y,13-u*8,LIGHT,2);break;
  case 'water':
   for(let i=0;i<3;i++)p.arc(x,y+14-i*4,7+quick*24+i*4,3+i,0,Math.PI*2,col,2,16);for(let i=0;i<6;i++)p.box(x-21+i*8,y+7-Math.sin(quick*Math.PI)*(14+i%2*8),3,5,col);break;
  case 'storm':
   for(let i=0;i<3;i++){const xx=x+(i-1)*17;p.path([[xx+4,y-37],[xx-4,y-18],[xx+5,y-22],[xx-3,y+9]],col,2);if(u<.18)p.box(xx-2,y+8,5,3,LIGHT);}break;
  case 'beam':
   p.diamond(x,y,6+quick*14,col,2);if(u<.3)p.star(x,y,8,LIGHT);p.flecks(x,y,quick,6,19,col);break;
  case 'aurora':
   for(let i=0;i<4;i++){const xx=x-20+i*13;p.path([[xx,y-31],[xx+6,y-13],[xx-4,y+3],[xx+2,y+18]],i%2?'#a8d4c0':col,3);}if(u<.3)for(let i=0;i<3;i++)p.star(x-13+i*13,y-7+i%2*12,3,LIGHT);break;
 }
}
function support(p,source,targets,shape,age,t,u,col,variant){
 const delivered=age>=IMPACT_MS/1000;
 if(shape==='escape'){if(!source)return;for(let i=0;i<3;i++){const x=source.cx-8-i*7,y=source.cy-8+i*5;p.stroke([x-14*(1-t),y],[x-3,y],col,2);}return;}
 for(const point of targets){const {cx:x,cy:y}=point;
  if(shape==='shield'){
   const grow=delivered?1:ease(t),r=22*grow;
   if(variant===3){p.diamond(x,y-3,r,col,2);p.diamond(x,y-3,r*.58,LIGHT,1);}
   else if(variant===4){p.arc(x,y-4,r,r*1.15,0,Math.PI*2,col,2,20);p.arc(x-3,y-7,r*.73,r*.83,3.1,4.8,LIGHT,1,9);}
   else {const n=variant===1?6:variant===2?8:5,pts=[];for(let i=0;i<=n;i++){const a=i/n*Math.PI*2-Math.PI/2;pts.push([x+Math.cos(a)*r,y-4+Math.sin(a)*r]);}p.path(pts,col,2);p.path([[x-r*.4,y-8],[x,y+r*.4],[x+r*.5,y-r*.5]],LIGHT,1);if(variant>=5)p.diamond(x+(variant===6?-8:8),y-4,r*.55,col,1);}
  }else{
   if(!delivered){const raise=12*t;p.plus(x,y+8-raise,3,col);if(shape==='medicine'){p.box(x-5,y+15-raise,10,13,'#d6d4b1');p.box(x-3,y+12-raise,6,3,'#8b9c94');p.plus(x,y+21-raise,2,'#8cae9c');}}
   else for(let i=0;i<6;i++){
    const xx=x-20+i*8,yy=y+15-((u*40+i*9)%44);
    if(variant===1){p.path([[xx-3,yy-5],[xx+3,yy],[xx-3,yy+5]],col,2);p.path([[xx+3,yy-5],[xx-3,yy],[xx+3,yy+5]],col,1);p.stroke([xx-2,yy],[xx+2,yy],LIGHT,1);}
    else if(variant===2){p.arc(xx,yy,4,3,-2.8,-.3,col,1,8);p.arc(xx,yy-3,6,4,-2.8,-.3,col,1,8);}
    else if(variant===3)p.path([[xx-3,yy+5],[xx,yy],[xx-3,yy-4],[xx,yy],[xx+4,yy-4]],col,1);
    else if(variant===4)p.arc(xx,yy,3,3,0,Math.PI*2,col,1,8);
    else if(variant===5)p.path([[xx-2,yy+4],[xx+3,yy-4],[xx+1,yy],[xx+5,yy+3]],col,2);
    else if(variant===6)p.star(xx,yy,2+i%2,col);
    else p.plus(xx,yy,2+(i%2),col);
   }
  }
 }
}
function numbers(ctx,beat,age,enemies,layout,party,options){
 if(age<IMPACT_MS/1000)return;const u=clamp((age-IMPACT_MS/1000)/((BEAT_MS-IMPACT_MS)/1000));
 ctx.globalAlpha=1-u;ctx.font='bold 16px monospace';ctx.textAlign='center';
 const labelX=(p,ally)=>ally?Math.max(22,Math.min(362,p.cx+(p.cx<192?28:-28))):p.cx;
 for(const f of beat.effects||[]){
  if(!f.amount)continue;const p=targetAnchor(f.side,f.id,enemies,layout,party,options);if(!p)continue;
  const ally=f.side==='party',x=labelX(p,ally),label=f.amount>0?'+'+f.amount:String(f.amount),y=p.cy-(ally?32:28)-u*(ally?10:17);
  ctx.fillStyle=INK;ctx.fillText(label,Math.round(x+1),Math.round(y+1));ctx.fillStyle=f.amount>0?'#b8e1bc':LIGHT;ctx.fillText(label,Math.round(x),Math.round(y));
 }
 if(!(beat.effects||[]).some(f=>f.amount<0)&&/落空|未命中|\bmiss\b/i.test(beat.label||''))for(const p of effectTargets(beat,enemies,layout,party,options)){
  const ally=beat.side==='enemies'&&beat.target!=='vehicle';ctx.fillStyle='#c4d0ce';ctx.fillText('MISS',Math.round(labelX(p,ally)),Math.round(p.cy-(ally?32:27)-u*10));
 }
}
export function drawBattleEffects(ctx,{beat,age,enemies=[],layout=[],party=[],soft=false,partyY,vehicleTarget}={}){
 if(!beat||beat.kind==='stun'||!Number.isFinite(age)||age<0||age>BEAT_MS/1000)return;
 const {shape='impact',color:col='#e5d1a7',variant=0}=beat.visual||{},options={partyY,vehicleTarget};
 const actor=beat.side==='party'?allyAnchor(party,beat.actor,options):targetAnchor('enemies',beat.actor,enemies,layout,party,options);
 const source=beat.side==='party'&&actor&&validPoint(vehicleTarget)?vehicleTarget:actor;
 const targets=effectTargets(beat,enemies,layout,party,options),contacts=recipients(beat,enemies,layout,party,options,true).filter(r=>r.amount<0),impact=age>=IMPACT_MS/1000,t=clamp(age/(IMPACT_MS/1000)),u=clamp((age-IMPACT_MS/1000)/((BEAT_MS-IMPACT_MS)/1000));
 const utility=HEALING.has(shape)||shape==='shield'||shape==='escape',p=pixels(ctx,col);
 ctx.save();
 try{
  // Hold the complete contact mark for 130 ms before it breaks into fragments.
  const decay=clamp((age-IMPACT_MS/1000-.13)/((BEAT_MS-IMPACT_MS)/1000-.13));
  ctx.globalAlpha=impact?1-Math.pow(decay,1.4):.9;
  if(utility){support(p,source,targets,shape,age,soft ? .75 : t,soft ? .18 : u,col,variant);}
  else if(soft){
   // Reduced motion retains the attack's own silhouette, held still and faded.
   if(!impact&&source)charge(p,source,shape,.75,col,variant);
   if(impact)for(const r of contacts)contact(p,r.point.cx,r.point.cy,shape,.18,col);
  }else if(!impact){
   if(source&&t<.5)charge(p,source,shape,t*2,col,variant);
   if(source&&t>.3)for(const target of targets){const q=ease((t-.3)/.7),landed=contacts.some(r=>r.point===target||r.point.cx===target.cx&&r.point.cy===target.cy),aim=landed?target:{cx:target.cx+35,cy:target.cy-22};approach(p,source,aim,shape,q,age,col);}
  }else{
   // Only actual HP loss gets contact artwork, exactly at the recorded recipient.
   // Misses and zero-damage actions have no flashes, hit sparks, or area effects.
   for(const r of contacts)contact(p,r.point.cx,r.point.cy,shape,.18+ease(decay)*.82,col);
  }
  numbers(ctx,beat,age,enemies,layout,party,options);
 }finally{ctx.restore();}
}
