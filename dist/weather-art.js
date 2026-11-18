import {PARTICLE_LIMITS,particlePool,lightningAt} from './weather-model.js';
const pools=new Map(),wrap=(n,span)=>((n%span)+span)%span;
const colors={leaf:['#a4ac72','#c3a16b','#7c9b77'],petal:['#e9c6c1','#efdbd0','#cfa9b8'],snow:['#e4e9e6','#c9d9df','#adbecb'],dust:['#bda77e','#c8b490','#9b9378'],ash:['#9a9c9b','#b4b4a8','#7d8991'],spore:['#9eafbc','#b6bc8e','#b5a2c7']};
const path=(ctx,points)=>{ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(Math.round(x),Math.round(y)):ctx.moveTo(Math.round(x),Math.round(y)));};
// Called in screen space, outside the event object's camera transform.
export function drawWeatherSky(ctx,{seed,seconds,storm,soft=false}){if(storm<=.01)return;ctx.save();
 const cloud=ctx.createLinearGradient(0,0,0,170);cloud.addColorStop(0,`rgba(20,30,45,${.58*storm})`);cloud.addColorStop(.6,`rgba(34,47,62,${.23*storm})`);cloud.addColorStop(1,'rgba(34,47,62,0)');ctx.fillStyle=cloud;ctx.fillRect(0,0,384,170);
 const bolt=lightningAt(seed,seconds,soft);if(bolt){
  if(bolt.glow){const [x]=bolt.main[0],glow=ctx.createRadialGradient(x,20,2,x,20,220);glow.addColorStop(0,`rgba(192,213,237,${bolt.glow*storm})`);glow.addColorStop(1,'rgba(192,213,237,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,384,174);}
  ctx.lineJoin='miter';ctx.globalAlpha=bolt.alpha*storm;
  for(const [width,color] of [[6,'#a3bdd94d'],[3,'#afc7e7'],[1,'#f2f4e9']]){ctx.lineWidth=width;ctx.strokeStyle=color;path(ctx,bolt.main);ctx.stroke();}
  ctx.lineWidth=1;ctx.strokeStyle='#bfd4eb';for(const fork of bolt.forks){path(ctx,fork);ctx.stroke();}
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
