import {clamp01,ease,mixHex} from './journey-view-model.js';
import {visualHash} from './weather-model.js';

// Presentation only: one small cached backdrop per biome, never gameplay dice.
export const SKY_PROFILES={
 salt:{cloud:.48,mist:.20},canyon:{cloud:.34,mist:.16},forest:{cloud:.65,mist:.28},
 city:{cloud:.62,mist:.26},coast:{cloud:.64,mist:.25},industrial:{cloud:.78,mist:.32},
 marsh:{cloud:.72,mist:.34},desert:{cloud:.24,mist:.21},farmland:{cloud:.43,mist:.18},
 snow:{cloud:.72,mist:.32},alien:{cloud:.62,mist:.29},oasis:{cloud:.40,mist:.19},
 wasteland:{cloud:.36,mist:.22},volcano:{cloud:.82,mist:.38},glacier:{cloud:.68,mist:.30},
 suburb:{cloud:.58,mist:.24},quarry:{cloud:.44,mist:.23},prairie:{cloud:.46,mist:.17},
 harbor:{cloud:.70,mist:.31},crystal:{cloud:.52,mist:.27}
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

// Each row is drawn directly on the same square grid as the character sprites.
const clouds=[
 [
  '             hhhh',
  '          hhhaaaahh',
  '         haaaaaaaaah  hh',
  '    hhhhhhaaaaaaaaaahhaah',
  '   haaaaaaaaaaaaaaaaaaaaahhh',
  ' hhaaaabbbaaaaaaaaaaaaaaaaaahh',
  'haaaabbbbbbaaaaabbbaaaaaaaaaaah',
  ' bbbbbbbbbbbbbbbbbbaaaaaabbbbb',
  '    bbbbbbbbbbbbbbbbbbbbbbb'
 ],[
  '                    hhh',
  '                  hhaaah',
  '               hhhaaaaaah',
  '       hhh    haaaaaaaaahh',
  '    hhhaaahhhhaaaaaaaaaaaahh',
  ' hhaaaaaabaaaaaaaaaaaaabbaaaahh',
  'haaaaaabbbbbbaaaaaaaabbbbbbaaaah',
  ' bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  '     bbbbbbbbbbb   bbbbbbb'
 ],[
  '        hhhh',
  '      hhaaaahh',
  '   hhhaaaaaaaah  hhh',
  ' hhaaaaabaaaaaahhaaah',
  'haaaaabbbaaaaaaaaaaaahhhhh',
  ' bbabbbbbbaaaaaabbaaaaaaaahh',
  '   bbbbbbbbbbbbbbbbbbbbbbb',
  '       bbbbbbbbbbb'
 ]
].map(rows=>rows.flatMap((row,y)=>Array.from(row.matchAll(/h+|a+|b+/g),m=>[m.index,y,m[0].length,m[0][0]])));

export function cloudPixels(variant){return clouds[variant];}

export function skyBands(light,storm=0,above=0){
 const top=mixHex(light.sky,'#344654',storm*.7);
 const horizon=mixHex(light.horizon,'#72818a',storm*.65);
 const zenith=above?mixHex(top,'#28374c',.23):top;
 const stops=[];
 for(let i=0;i<4;i++)stops.push([-above+Math.round(above*i/4),mixHex(zenith,top,i/4)]);
 for(let i=0;i<=12;i++)stops.push([i*12,mixHex(top,horizon,i/12)]);
 stops.push([180,horizon]);
 return stops.slice(0,-1).map(([y,color],i)=>({y,h:stops[i+1][0]-y,color})).filter(b=>b.h>0);
}

// A four-pixel repeat softens the boundaries between palette bands. Bake it
// only when the sky colours change, independently of the moving clouds.
const skies=new WeakMap();
function fillSky(ctx,light,storm,above){
 const strength=Math.round(storm*16)/16,key=[light.sky,light.horizon,strength,above].join(':');
 let cached=skies.get(ctx);
 if(cached?.key!==key){
  const strip=cached?.strip||document.createElement('canvas');
  strip.width=4;strip.height=180+above;
  const q=strip.getContext('2d'),bands=skyBands(light,strength,above);
  for(const [index,{y,h,color}] of bands.entries()){
   const top=y+above;q.fillStyle=color;q.fillRect(0,top,4,h);
   if(index>0){
    q.fillRect(0,top-2,1,1);q.fillRect(2,top-1,1,1);
    q.fillStyle=bands[index-1].color;q.fillRect(1,top,1,1);q.fillRect(3,top+1,1,1);
   }
  }
  cached={key,strip,pattern:ctx.createPattern(strip,'repeat-x')};skies.set(ctx,cached);
 }
 ctx.save();ctx.translate(0,-above);ctx.fillStyle=cached.pattern;
 ctx.fillRect(0,0,384,180+above);ctx.restore();
}

export function cloudPalette(day,storm,light){
 if(storm>.5)return {h:'#bac0be',a:'#a0acae',b:'#758693'};
 if(!day)return {h:'#788698',a:'#5f7286',b:'#43566b'};
 if(light<.8)return {h:'#efd4ac',a:'#dbb297',b:'#b38e90'};
 return {h:'#f0e8cb',a:'#dedfcf',b:'#b0c2c2'};
}

const cloudSprites=new Map();
function cloudSprite(variant,palette){
 const key=variant+palette.h;
 if(cloudSprites.has(key))return cloudSprites.get(key);
 const c=document.createElement('canvas');c.width=32;c.height=9;
 const q=c.getContext('2d');
 for(const [x,y,width,shade] of cloudPixels(variant)){
  q.fillStyle=palette[shade];q.fillRect(x,y,width,1);
 }
 cloudSprites.set(key,c);
 return c;
}

function drawOrb(ctx,sky,light){
 const radius=sky.day?9:7,cx=Math.round(sky.x),cy=Math.round(sky.y);
 ctx.fillStyle=sky.day?light.sun:'#d5dfdd';
 for(let dy=-radius;dy<=radius;dy++){
  const dx=Math.floor(Math.sqrt(radius*radius-dy*dy));
  let right=dx;
  if(!sky.day&&Math.abs(dy+2)<=6){
   right=Math.min(right,3-Math.floor(Math.sqrt(36-(dy+2)**2))-1);
  }
  if(right>=-dx)ctx.fillRect(cx-dx,cy+dy,dx+right+1,1);
 }
}

export function drawJourneySky(ctx,{seed,seconds,travel,minutes,from,to=from,blend=0,light,storm=0,soft=false,above=0}){
 const sky=skyState({minutes,from,to,blend,storm});
 ctx.save();
 fillSky(ctx,light,sky.storm,above);
 if(!sky.day){ctx.fillStyle='#d2dad8';ctx.globalAlpha=.65*(1-sky.cloud*.6);for(let i=0;i<24;i++){const h=visualHash(seed+':star:'+i);ctx.fillRect(h%384,(h>>>12)%Math.ceil(65+above)-above,1,1);}}
 ctx.globalAlpha=sky.visibility;drawOrb(ctx,sky,light);
 const palette=cloudPalette(sky.day,sky.storm,light.light);
 for(const c of cloudLayout(seed,seconds,travel,soft)){
  const sprite=cloudSprite(c.variant,palette);
  ctx.globalAlpha=c.alpha*(.62+sky.cloud*.68);
  ctx.drawImage(sprite,Math.round(c.x),c.y,c.w,c.h);
  if(above>28&&c.variant!==1){
   ctx.globalAlpha*=.72;
   ctx.drawImage(sprite,Math.round(c.x+25),Math.round(c.y-above*.86),Math.round(c.w*1.3),Math.round(c.h*1.25));
  }
 }
 ctx.restore();return sky;
}
