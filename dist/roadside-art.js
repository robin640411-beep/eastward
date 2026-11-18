import {ROADSIDE_PROFILES,roadsideItems,roadsideTraffic,sceneryRandom} from './roadside-model.js';
const sprites=new Map();
const facades=new Map();
function quietFacade(kind,asset,picture){if(facades.has(kind))return facades.get(kind);const c=document.createElement('canvas');c.width=216;c.height=140;const q=c.getContext('2d');q.imageSmoothingEnabled=false;q.filter='saturate(0.35) brightness(0.84)';q.drawImage(picture,...asset.rect,0,0,216,140);facades.set(kind,c);return c;}
// Small, cached pixel cutouts. Only positions are recomputed while driving.
function sprite(type,biome,variant){variant%=3;const key=type+':'+biome+':'+variant;if(sprites.has(key))return sprites.get(key);const p=ROADSIDE_PROFILES[biome]||ROADSIDE_PROFILES.salt,c=document.createElement('canvas');c.width=112;c.height=112;const q=c.getContext('2d');q.imageSmoothingEnabled=false;
 const r=(x,y,w,h,col)=>{q.fillStyle=col;q.fillRect(x,y,w,h);},line=(points,col,width=1)=>{q.strokeStyle=col;q.lineWidth=width;q.beginPath();points.forEach(([x,y],i)=>i?q.lineTo(x,y):q.moveTo(x,y));q.stroke();},wall=p.wall,trim=p.trim,dark='#25373d',shade='#39494b',accent=p.accent,ground=106;
 r(12,ground,85,3,'#172a303d');
 if(type==='pole'){r(53,10,5,96,shade);r(53,10,2,96,trim);r(34,22,44,4,wall);r(39,17,5,6,trim);r(68,17,5,6,trim);r(48,35,15,19,wall);r(48,36,15,2,trim);for(let y=40;y<51;y+=3)r(50,y,10,1,dark);line([[0,29],[29,34],[42,25],[76,31],[112,24]],'#2b383c');line([[0,33],[30,38],[70,25],[112,28]],'#455154');r(52,79,7,12,accent);r(52,86,7,4,dark);}
 if(type==='sign'){r(28,50,4,56,shade);r(80,50,4,56,shade);r(17,34,77,33,dark);r(18,33,75,2,trim);r(20,37,69,25,wall);r(23,40,62,1,trim);r(27,47,24,3,accent);r(27,53,38,2,trim);line([[73,47],[80,51],[73,55]],trim,2);r(71,50,8,2,trim);r(55,39,2,9,shade);r(48,58,27,4,dark);r(61,63,10,6,shade);if(variant%2)r(20,37,10,14,shade);}
 if(type==='lamp'){r(60,20,3,86,wall);r(60,20,1,84,trim);line([[62,23],[54,12],[37,12]],trim,3);r(30,12,17,5,shade);r(33,17,12,2,'#c3b585');r(58,95,7,11,shade);r(58,47,7,9,accent);if(variant%2){line([[62,32],[78,22],[87,22]],wall,2);r(83,22,11,5,shade);r(85,27,8,2,accent);}}
 if(type==='shelter'){r(14,48,83,7,dark);r(16,45,78,4,trim);r(22,55,4,48,wall);r(86,55,4,48,wall);r(27,57,57,39,'#4f696b');r(29,59,21,32,'#637d7a');r(53,57,3,39,trim);r(29,62,3,19,'#a1b4a044');r(32,85,48,4,trim);r(34,89,3,14,shade);r(74,89,3,14,shade);r(20,102,75,4,wall);r(69,61,11,16,accent);r(71,65,7,2,shade);r(71,70,7,1,shade);}
 if(type==='rail'){for(let x=8;x<108;x+=28){r(x,80,4,26,shade);r(x,80,1,23,trim);}r(3,81,105,7,wall);r(3,81,105,2,trim);r(3,89,105,3,shade);for(let x=13;x<108;x+=28)r(x,84,2,2,dark);if(variant%2){r(49,81,9,11,dark);line([[49,82],[57,75],[72,77]],trim,2);}}
 if(type==='barrier'){r(15,77,78,25,wall);r(14,100,83,6,shade);r(19,76,68,3,trim);for(let x=21;x<88;x+=17){line([[x,97],[x+10,80]],accent,7);}r(47,65,7,10,shade);r(49,63,3,4,'#b18e63');r(28,93,10,2,shade);r(78,87,8,3,shade);if(variant%2){r(93,95,8,11,accent);r(95,91,4,4,accent);r(91,104,12,2,dark);}}
 if(type==='container'){r(10,56,89,48,shade);r(10,54,85,47,wall);r(12,55,81,2,trim);r(13,98,80,2,dark);for(let x=17;x<92;x+=8){r(x,59,1,36,trim);r(x+1,59,2,36,shade);}r(57,55,2,44,shade);r(54,63,2,31,dark);r(64,63,2,31,dark);r(61,73,16,9,accent);r(64,76,10,2,shade);r(16,88,7,5,accent);r(89,57,4,6,shade);}
 if(type==='tower'){for(const x of [34,73]){r(x,58,4,48,shade);r(x,59,1,47,trim);}line([[36,65],[75,102],[75,65],[36,102]],wall,2);r(23,23,65,36,wall);r(27,19,57,5,trim);r(24,28,63,2,trim);r(24,49,63,3,shade);r(29,58,53,4,shade);r(28,34,3,10,trim);r(58,23,2,35,shade);r(87,33,3,65,shade);for(let y=36;y<98;y+=7)r(81,y,10,1,trim);r(47,13,15,7,shade);}
 // Regional wear changes the same familiar structures without busy effects.
 if(p.weather==='snow'){const pixels=q.getImageData(0,0,112,112).data;q.globalCompositeOperation='source-atop';for(let x=0;x<112;x++){for(let y=0;y<99;y++)if(pixels[(y*112+x)*4+3]>100){r(x,y,1,2,'#d1d5c7');break;}}q.globalCompositeOperation='source-over';r(23,103,60,3,'#bbc7bf');}
 if(['vine','alien'].includes(p.weather)){const col=p.weather==='alien'?'#8c9b87':'#59705d';for(let i=0;i<5;i++){const x=26+Math.floor(sceneryRandom(variant,i,8)*58),y=75+i*6;r(x,y,2,106-y,col);r(x-3,y+4,7,3,col);}if(p.weather==='alien'){r(49,45,18,11,dark);r(52,48,12,2,'#a3b5aa');r(57,46,2,7,'#a3b5aa');}}
 if(p.weather==='occupied'){r(47,71,12,17,dark);r(50,75,6,1,accent);r(52,73,2,11,accent);}
 if(['dust','salt','rust'].includes(p.weather)){q.globalCompositeOperation='source-atop';for(let i=0;i<16;i++){r(Math.floor(sceneryRandom(variant,i,7)*100)+6,Math.floor(sceneryRandom(variant,i,11)*64)+40,2+i%4,1,i%2?accent:trim);}q.globalCompositeOperation='source-over';}
 if(sprites.size>=96)sprites.delete(sprites.keys().next().value);sprites.set(key,c);return c;
}
export function drawRoadside(ctx,{seed,region,travel,seconds,assets,image}){const p=ROADSIDE_PROFILES[region.id]||ROADSIDE_PROFILES.salt;
 for(const item of roadsideItems(seed,region,travel)){const {type,x,variant,scale}=item;ctx.save();ctx.globalAlpha*=.94;
  if(type==='building'){const kind=p.facades[variant%p.facades.length],a=assets.facilities[kind],picture=a&&image(a.image),w=(kind==='warehouse'?110:96)*scale,h=w*350/543;
   if(picture){ctx.drawImage(quietFacade(kind,a,picture),Math.round(x),Math.round(169-h),w,h);ctx.fillStyle='#2a3a3d26';ctx.fillRect(Math.round(x+8),Math.round(165-h/2),w-16,h/2-4);if(p.weather==='snow'){ctx.fillStyle='#bbc7bf';ctx.fillRect(Math.round(x+19),Math.round(169-h*.77),w*.61,2);}if(p.weather==='vine'){ctx.fillStyle='#61765b';ctx.fillRect(Math.round(x+15),153,3,15);ctx.fillRect(Math.round(x+11),157,10,3);}}
  }else if(type==='vehicle'){const model=p.vehicles[variant%p.vehicles.length],picture=image(assets.vehicles[model].image),w=78*scale;if(picture){ctx.drawImage(picture,Math.round(x),Math.round(176-w*72/160),w,w*72/160);ctx.fillStyle='#34454633';ctx.fillRect(Math.round(x+6),165,w-12,8);}}
  else {const size=type==='pole'?106*scale:type==='tower'?99*scale:91*scale;ctx.drawImage(sprite(type,region.id,variant),Math.round(x),Math.round(172-size*106/112),size,size);}
  ctx.restore();
 }
 for(const car of roadsideTraffic(seed,region,travel,seconds)){const picture=image(assets.vehicles[car.vehicle].image);if(!picture)continue;const w=83,h=w*72/160;ctx.save();ctx.translate(Math.round(car.x+w),181-h);ctx.scale(-1,1);ctx.drawImage(picture,0,0,w,h);ctx.restore();}
}
