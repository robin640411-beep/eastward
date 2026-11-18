import {clamp01,ease,mixHex} from './journey-view-model.js';
import {visualHash} from './weather-model.js';

// Presentation only: one small cached backdrop per biome, never gameplay dice.
export const SKY_PROFILES={
 salt:{cloud:.48,mist:.20},canyon:{cloud:.34,mist:.16},forest:{cloud:.65,mist:.28},
 city:{cloud:.62,mist:.26},coast:{cloud:.64,mist:.25},industrial:{cloud:.78,mist:.32},
 marsh:{cloud:.72,mist:.34},desert:{cloud:.24,mist:.21},farmland:{cloud:.43,mist:.18},
 snow:{cloud:.72,mist:.32},alien:{cloud:.62,mist:.29},oasis:{cloud:.40,mist:.19}
};
export function skyState({minutes,from,to=from,blend=0,storm=0}){
 const a=SKY_PROFILES[from.id]||SKY_PROFILES.salt,b=SKY_PROFILES[to.id]||a,t=clamp01(blend),s=clamp01(storm),hour=((minutes/60)%24+24)%24;
 const day=hour>=5&&hour<19,phase=day?(hour-5)/14:((hour+5)%24)/10;
 // East is to the right: sunrise on the right, sunset on the left.
 return {hour,day,x:day?340-phase*296:58+phase*272,y:67-Math.sin(phase*Math.PI)*48,
  visibility:ease(phase/.10)*ease((1-phase)/.10)*(1-s*.95),
  cloud:(a.cloud*(1-t)+b.cloud*t)*(1-s)+s,
  mist:Math.min(.5,a.mist*(1-t)+b.mist*t+s*.12),storm:s};
}
export function cloudLayout(seed,seconds,travel=0,soft=false){
 const drift=seconds*(soft?.22:.65)+travel*.018,wrap=(v,n)=>((v%n)+n)%n;
 return Array.from({length:7},(_,i)=>{const h=visualHash(seed+':cloud:'+i);return {
  x:wrap(i*93+(h%43)-drift*(.65+i%3*.2),650)-130,
  y:5+(h>>>8)%34,w:60+(h>>>16)%49,h:12+(h>>>24)%13,variant:i%3,
  alpha:.32+(h%19)/100
 };});
}

// Downsample distant detail before filtering. No live full-screen CSS blur.
// Temporary canvases are released; the caller retains only the 512 × 224 result.
export function distantPanorama(picture,region,{fadeSky=false}={}){
 const make=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
 const small=make(160,70),s=small.getContext('2d');s.imageSmoothingEnabled=true;
 s.drawImage(picture,...region.rect,0,0,160,70);
 const result=make(512,224),q=result.getContext('2d');q.imageSmoothingEnabled=true;
 q.filter='blur(0.7px) saturate(0.48) contrast(0.72) brightness(1.02)';
 q.drawImage(small,-2,-1,516,226);q.filter='none';
 const air=q.createLinearGradient(0,0,0,224);air.addColorStop(0,'#a0adb538');air.addColorStop(.55,'#9baab04a');air.addColorStop(1,'#788b9620');q.fillStyle=air;q.fillRect(0,0,512,224);
 if(fadeSky){const mask=q.createLinearGradient(0,0,0,86);mask.addColorStop(0,'#0000');mask.addColorStop(.45,'#0006');mask.addColorStop(1,'#000');q.globalCompositeOperation='destination-in';q.fillStyle=mask;q.fillRect(0,0,512,224);q.globalCompositeOperation='source-over';}
 return result;
}

const cloudSprites=new Map();
function cloudSprite(variant,top,bottom){
 const key=[variant,top,bottom].join(':');if(cloudSprites.has(key))return cloudSprites.get(key);
 const c=document.createElement('canvas');c.width=96;c.height=36;const q=c.getContext('2d');
 // Stepped, overlapping lobes keep clouds in the game's pixel vocabulary.
 const shapes=[[[5,19,82,9],[13,12,66,13],[22,7,24,16],[37,3,23,22],[57,11,23,14]],[[2,22,90,7],[12,16,70,10],[23,11,25,14],[45,7,25,19],[64,16,21,10]],[[7,21,80,8],[17,14,64,12],[27,5,30,21],[51,11,24,16]]][variant];
 q.fillStyle=bottom;for(const r of shapes)q.fillRect(...r);
 q.fillStyle=top;for(const [x,y,w,h] of shapes.slice(1))q.fillRect(x,y,w,Math.max(3,h-6));
 if(cloudSprites.size>=18)cloudSprites.delete(cloudSprites.keys().next().value);cloudSprites.set(key,c);return c;
}
function disc(ctx,x,y,r,color){ctx.fillStyle=color;for(let dy=-r;dy<=r;dy++){const dx=Math.floor(Math.sqrt(r*r-dy*dy));ctx.fillRect(Math.round(x)-dx,Math.round(y)+dy,dx*2+1,1);}}

export function drawJourneySky(ctx,{seed,seconds,travel,minutes,from,to=from,blend=0,light,storm=0,soft=false}){
 const sky=skyState({minutes,from,to,blend,storm}),top=mixHex(light.sky,'#344654',sky.storm*.7),horizon=mixHex(light.horizon,'#72818a',sky.storm*.65);
 ctx.save();const gradient=ctx.createLinearGradient(0,0,0,174);gradient.addColorStop(0,top);gradient.addColorStop(1,horizon);ctx.fillStyle=gradient;ctx.fillRect(0,0,384,180);
 if(!sky.day){ctx.fillStyle='#d2dad8';ctx.globalAlpha=.65*(1-sky.cloud*.6);for(let i=0;i<24;i++){const h=visualHash(seed+':star:'+i);ctx.fillRect(h%384,(h>>>12)%65,1,1);}}
 const glow=ctx.createRadialGradient(sky.x,sky.y,3,sky.x,sky.y,sky.day?35:20);glow.addColorStop(0,light.sun+'70');glow.addColorStop(1,light.sun+'00');ctx.globalAlpha=sky.visibility;ctx.fillStyle=glow;ctx.fillRect(sky.x-36,sky.y-36,72,72);
 disc(ctx,sky.x,sky.y,sky.day?9:7,sky.day?light.sun:'#d5dfdd');
 if(!sky.day){disc(ctx,sky.x+3,sky.y-2,6,top);}
 // Three palette buckets avoid rebuilding a cloud sprite for every minute.
 const palette=sky.storm>.5?['#a4afb4','#697c8a']:!sky.day?['#66758b','#3c506a']:light.light<.8?['#e6c1a6','#b99ca3']:['#e2e4dc','#adbfc6'];
 for(const c of cloudLayout(seed,seconds,travel,soft)){ctx.globalAlpha=c.alpha*(.45+sky.cloud*.7);ctx.drawImage(cloudSprite(c.variant,...palette),Math.round(c.x),c.y,c.w,c.h);}
 ctx.restore();return sky;
}
export function drawDistanceMist(ctx,{light,mist}){
 ctx.save();const haze=ctx.createLinearGradient(0,62,0,178);haze.addColorStop(0,light.horizon+'00');haze.addColorStop(.57,light.horizon+Math.round(mist*255).toString(16).padStart(2,'0'));haze.addColorStop(1,light.horizon+'08');ctx.fillStyle=haze;ctx.fillRect(0,62,384,116);ctx.restore();
}
