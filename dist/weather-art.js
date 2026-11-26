import {PARTICLE_LIMITS,particlePool,lightningAt} from './weather-model.js';
const pools=new Map(),wrap=(n,span)=>((n%span)+span)%span;
const colors={leaf:['#d49a52','#c46d4e','#7ca376'],petal:['#e9c6c1','#efdbd0','#cfa9b8'],snow:['#e4e9e6','#c9d9df','#adbecb'],dust:['#bda77e','#c8b490','#9b9378'],ash:['#9a9c9b','#b4b4a8','#7d8991'],spore:['#9eafbc','#b6bc8e','#b5a2c7']};
const path=(ctx,points)=>{ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(Math.round(x),Math.round(y)):ctx.moveTo(Math.round(x),Math.round(y)));};
// Called in screen space, outside the event object's camera transform.
export function drawWeatherSky(ctx,{seed,seconds,storm,soft=false}){if(storm<=.01)return;ctx.save();
 const cloud=ctx.createLinearGradient(0,0,0,170);cloud.addColorStop(0,`rgba(16,24,38,${.68*storm})`);cloud.addColorStop(.55,`rgba(28,39,54,${.34*storm})`);cloud.addColorStop(1,'rgba(28,39,54,0)');ctx.fillStyle=cloud;ctx.fillRect(0,0,384,170);
 // Billowing 16-bit pixel dark storm clouds drifting across the sky!
 const bolt=lightningAt(seed,seconds,soft);
 const flashBoost=bolt&&!soft?bolt.alpha*.35:0;
 const drift=seconds*(soft?2.2:5.5);
 for(let i=0;i<7;i++){
  const cw=78+(i%3)*26,ch=18+(i%2)*8;
  const cx=wrap(i*64-drift*(.7+(i%3)*.22),460)-76;
  const cy=4+(i%3)*11;
  ctx.fillStyle=flashBoost>.12?`rgba(96,118,144,${.78*storm})`:`rgba(26,35,48,${.82*storm})`;
  ctx.fillRect(Math.round(cx),Math.round(cy+4),cw,ch);
  ctx.fillRect(Math.round(cx+10),Math.round(cy),cw-20,6);
  ctx.fillStyle=flashBoost>.12?`rgba(148,176,204,${.55*storm})`:`rgba(46,58,74,${.68*storm})`;
  ctx.fillRect(Math.round(cx+6),Math.round(cy+ch),cw-12,4);
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
