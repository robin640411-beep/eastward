import {PARTICLE_LIMITS,particlePool,lightningAt} from './weather-model.js';
const pools=new Map(),wrap=(n,span)=>((n%span)+span)%span;
const colors={leaf:['#d49a52','#c46d4e','#7ca376'],petal:['#e9c6c1','#efdbd0','#cfa9b8'],snow:['#e4e9e6','#c9d9df','#adbecb'],dust:['#bda77e','#c8b490','#9b9378'],ash:['#9a9c9b','#b4b4a8','#7d8991'],spore:['#9eafbc','#b6bc8e','#b5a2c7']};
const path=(ctx,points)=>{ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(Math.round(x),Math.round(y)):ctx.moveTo(Math.round(x),Math.round(y)));};
function drawPixelPuff(ctx,cx,cy,rx,ry,color){
 const rxi=Math.max(2,Math.round(rx)),ryi=Math.max(2,Math.round(ry));
 ctx.fillStyle=color;
 for(let dy=-ryi;dy<=ryi;dy+=2){
  const span=Math.round(rxi*Math.sqrt(Math.max(0,1-(dy*dy)/(ryi*ryi))));
  if(span>0)ctx.fillRect(Math.round(cx-span),Math.round(cy+dy),span*2,2);
 }
}
function drawStormCloud(ctx,cx,cy,scale,storm,flash){
 const s=scale,lit=flash>.12;
 const rimCol=lit?`rgba(168,196,226,${.72*storm})`:`rgba(72,88,108,${.72*storm})`;
 const midCol=lit?`rgba(98,122,150,${.86*storm})`:`rgba(38,50,67,${.88*storm})`;
 const darkCol=lit?`rgba(62,78,100,${.88*storm})`:`rgba(22,31,45,${.9*storm})`;
 // Sculpted multi-lobe cumulonimbus silhouette (5 overlapping billowing domes)
 const lobes=[[-26,4,18,10],[-11,-3,22,13],[8,-5,24,14],[26,1,19,11],[38,6,13,7]];
 // 1. Soft upper rim / lightning-lit tops
 for(const [ox,oy,rx,ry] of lobes)drawPixelPuff(ctx,cx+ox*s,cy+(oy-1.5)*s,rx*s,ry*s,rimCol);
 // 2. Dense storm cloud body
 for(const [ox,oy,rx,ry] of lobes)drawPixelPuff(ctx,cx+ox*s,cy+(oy+1)*s,rx*s*.96,ry*s*.92,midCol);
 // 3. Heavy dark rain-laden belly + wispy underside
 drawPixelPuff(ctx,cx+4*s,cy+8*s,34*s,7*s,darkCol);
 drawPixelPuff(ctx,cx-18*s,cy+9*s,20*s,5*s,darkCol);
 drawPixelPuff(ctx,cx+26*s,cy+9*s,18*s,5*s,darkCol);
}
// Called in screen space, outside the event object's camera transform.
export function drawWeatherSky(ctx,{seed,seconds,storm,soft=false}){if(storm<=.01)return;ctx.save();
 const cloud=ctx.createLinearGradient(0,0,0,170);cloud.addColorStop(0,`rgba(16,24,38,${.65*storm})`);cloud.addColorStop(.55,`rgba(28,39,54,${.3*storm})`);cloud.addColorStop(1,'rgba(28,39,54,0)');ctx.fillStyle=cloud;ctx.fillRect(0,0,384,170);
 // Sculpted billowing 16-bit pixel storm clouds drifting across the upper sky
 const bolt=lightningAt(seed,seconds,soft);
 const flashBoost=bolt&&!soft?bolt.alpha*.35:0;
 const drift=seconds*(soft?2:4.8);
 const banks=[[0,14,1.15,.65],[92,22,.92,.85],[188,12,1.25,.6],[286,20,1.0,.78],[380,16,.88,.92]];
 for(const [bx,by,sc,spd] of banks){
  const cx=wrap(bx-drift*spd,500)-60;
  drawStormCloud(ctx,cx,by,sc,storm,flashBoost);
 }
 if(bolt){
  if(bolt.glow){const [x]=bolt.main[0],glow=ctx.createRadialGradient(x,20,2,x,20,220);glow.addColorStop(0,`rgba(202,224,248,${bolt.glow*storm})`);glow.addColorStop(1,'rgba(202,224,248,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,384,174);}
  ctx.lineJoin='miter';ctx.globalAlpha=bolt.alpha*storm;
  for(const [width,color] of [[6,'#a3bdd955'],[3,'#bed6f4'],[1,'#f8f9f0']]){ctx.lineWidth=width;ctx.strokeStyle=color;path(ctx,bolt.main);ctx.stroke();}
  ctx.lineWidth=1;ctx.strokeStyle='#cfe2f7';for(const fork of bolt.forks){path(ctx,fork);ctx.stroke();}
 }ctx.restore();}
export function drawWeatherParticles(ctx,{seed,seconds,travel=0,layers,soft=false,light=1}){
 if(!pools.has(seed)){if(pools.size>=8)pools.delete(pools.keys().next().value);pools.set(seed,particlePool(seed));}const pool=pools.get(seed),t=seconds*(soft?.65:1);
 ctx.save();for(const {kind,density} of layers){const count=Math.ceil(PARTICLE_LIMITS[kind]*density*(soft?.55:1));
  for(let i=0;i<count;i++){const p=pool[i],d=p.depth,wind=(kind==='rain'?43:kind==='snow'?13:24)*d;
   const x=wrap(p.x-t*wind-travel*d*.035+Math.sin(t*.8+p.phase)*p.sway,424)-20;
   const fall=kind==='rain'?170:kind==='snow'?18:kind==='dust'?5:kind==='spore'?-8:11;
   const y=wrap(p.y+t*fall*d,280)-20;
   ctx.globalAlpha=(.34+d*.5)*(soft?.8:1)*(.6+light*.4);
   if(kind==='rain'){ctx.strokeStyle='#b9ccd5';ctx.lineWidth=1;path(ctx,[[x,y],[x-3*d,y+8*d]]);ctx.stroke();continue;}
   ctx.fillStyle=colors[kind][i%3];
   if(kind==='snow'){const size=d>.78?3:d>.5?2:1;ctx.fillRect(Math.round(x),Math.round(y),size,size);if(d>.82){ctx.fillRect(Math.round(x)-1,Math.round(y)+1,5,1);ctx.fillRect(Math.round(x)+1,Math.round(y)-1,1,5);}continue;}
   if(kind==='dust'||kind==='ash'||kind==='spore'){ctx.fillRect(Math.round(x),Math.round(y),kind==='dust'?3:2,1+(i%2));continue;}
   // Small tumbling silhouettes, not opaque rectangular particles.
   const a=t*(1+p.spin)+p.phase,sx=Math.cos(a)*(2+d*2),sy=Math.sin(a)*(2+d*2);
   path(ctx,[[x-sx,y-sy],[x-sy*.5,y+sx*.5],[x+sx,y+sy],[x+sy*.3,y-sx*.3]]);ctx.closePath();ctx.fill();
   if(kind==='leaf'&&d>.75){ctx.strokeStyle='#586452';ctx.lineWidth=1;path(ctx,[[x-sx*.7,y-sy*.7],[x+sx*.7,y+sy*.7]]);ctx.stroke();}
  }
 }
 // A few short rain splashes anchor the downpour to the road.
 const rain=layers.find(l=>l.kind==='rain')?.density||0;if(rain>.35&&!soft){for(let i=0;i<8;i++){const p=pool[i],k=wrap(t*2+p.phase,1);if(k>.25)continue;ctx.globalAlpha=(1-k/.25)*rain*.45;ctx.strokeStyle='#b2c4c9';ctx.lineWidth=1;const x=wrap(p.x-travel*.05,384),y=180+p.y%52;path(ctx,[[x-3,y],[x,y-2],[x+3,y]]);ctx.stroke();}}
 ctx.restore();
}
