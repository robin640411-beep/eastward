import {ROADSIDE_PROFILES,roadsideItems,roadsideTraffic,sceneryRandom} from './roadside-model.js';
import {ROAD_GROUND,groundedBox,groundShadow,propGround} from './scenery-ground.js';
const sprites=new Map();
// Plaques attach to a real panel, rail or post. Low structures have low mounts.
export const ROADSIDE_MOUNTS=Object.freeze({pole:[49,38,13,14],sign:[62,42,16,15],lamp:[58,47,7,9],shelter:[68,61,12,17],rail:[60,81,14,7],barrier:[48,81,14,16],container:[62,72,16,12],tower:[47,32,14,17]});
// Small, cached pixel cutouts. Only positions are recomputed while driving.
export function roadsideSprite(type,biome,variant){variant%=6;const key=type+':'+biome+':'+variant;if(sprites.has(key))return sprites.get(key);const p=ROADSIDE_PROFILES[biome]||ROADSIDE_PROFILES.salt,c=document.createElement('canvas');c.width=112;c.height=112;const q=c.getContext('2d');q.imageSmoothingEnabled=false;
 const r=(x,y,w,h,col)=>{q.fillStyle=col;q.fillRect(x,y,w,h);},line=(points,col,width=1)=>{q.strokeStyle=col;q.lineWidth=width;q.beginPath();points.forEach(([x,y],i)=>i?q.lineTo(x,y):q.moveTo(x,y));q.stroke();},wall=p.wall,trim=p.trim,dark='#25373d',shade='#39494b',accent=p.accent,ground=propGround(type)*112;
 r(12,ground,85,3,'#172a303d');
 if(type==='pole'){
  if(variant===3){
   // Biome tree / cactus / alien crystal spire grounded cleanly
   if(['desert','canyon','salt'].includes(biome)){r(52,32,8,74,'#5c7a52');r(52,32,3,74,'#7a9c69');r(38,48,14,6,'#5c7a52');r(38,36,6,18,'#5c7a52');r(60,56,14,6,'#5c7a52');r(68,42,6,20,'#5c7a52');}
   else if(biome==='alien'){r(48,20,16,86,'#4a3560');r(51,24,10,82,'#6e4d8c');r(54,30,4,48,'#9ce0d2');r(38,62,10,44,'#3c2950');r(64,54,10,52,'#3c2950');}
   else{const leaf=biome==='snow'?'#8ca6a8':biome==='oasis'?'#5c9468':biome==='farmland'?'#b58b4e':'#4a6e54';const hi=biome==='farmland'?'#d9ad64':'#6d9170';r(52,58,8,48,'#5c4738');r(52,58,3,48,'#785e4b');r(32,42,48,22,leaf);r(38,28,36,18,leaf);r(44,18,24,14,hi);r(36,46,12,8,hi);}
  }else if(variant===4){
   // Alien amber scanner pylon / radio mast
   r(51,14,10,92,shade);r(53,14,4,92,trim);r(44,24,24,6,dark);r(47,26,18,2,'#e8b86d');r(46,42,20,16,wall);r(49,46,14,4,'#7cc4c4');r(43,96,26,10,dark);
  }else if(variant===5){
   // Double timber utility pole with hanging transformer & sagging wires
   r(40,14,5,92,shade);r(66,14,5,92,shade);r(32,24,48,4,wall);r(46,36,19,20,dark);r(48,38,15,16,wall);r(52,42,7,4,accent);line([[0,28],[40,26],[66,26],[112,32]],'#2b383c');
  }else{
   r(53,10,5,96,shade);r(53,10,2,96,trim);r(34,22,44,4,wall);r(39,17,5,6,trim);r(68,17,5,6,trim);r(48,35,15,19,wall);r(48,36,15,2,trim);for(let y=40;y<51;y+=3)r(50,y,10,1,dark);line([[0,29],[29,34],[42,25],[76,31],[112,24]],'#2b383c');line([[0,33],[30,38],[70,25],[112,28]],'#455154');r(52,79,7,12,accent);r(52,86,7,4,dark);
  }
 }
 if(type==='sign'){
  if(variant>=4){
   // Tall retro diner / motel neon billboard
   r(34,54,5,52,shade);r(73,54,5,52,shade);r(14,18,84,38,dark);r(17,21,78,32,wall);r(21,25,70,24,'#263440');r(25,30,44,5,accent);r(25,39,58,3,'#8fd4c4');r(74,28,12,12,'#e8b86d');
  }else if(variant===3){
   // Highway mileage gantry & rusted warning triangle
   r(22,28,6,78,shade);r(84,28,6,78,shade);r(18,24,76,20,'#2b4c47');r(20,26,72,16,'#3c665d');r(26,31,42,3,'#eef2ea');r(26,37,26,2,'#f0cf82');r(74,30,10,8,'#f0cf82');
  }else{
   r(28,50,4,56,shade);r(80,50,4,56,shade);r(17,34,77,33,dark);r(18,33,75,2,trim);r(20,37,69,25,wall);r(23,40,62,1,trim);r(27,47,24,3,accent);r(27,53,38,2,trim);line([[73,47],[80,51],[73,55]],trim,2);r(71,50,8,2,trim);r(55,39,2,9,shade);r(48,58,27,4,dark);r(61,63,10,6,shade);if(variant%2)r(20,37,10,14,shade);
  }
 }
 if(type==='lamp'){
  if(variant>=4){
   // Solar-panel streetlight with battery box
   r(56,22,4,84,wall);r(56,22,2,84,trim);r(44,14,28,6,'#284664');r(46,15,24,4,'#4d7fa8');r(52,44,12,16,dark);r(54,46,8,12,accent);r(50,94,16,12,shade);
  }else{
   r(60,20,3,86,wall);r(60,20,1,84,trim);line([[62,23],[54,12],[37,12]],trim,3);r(30,12,17,5,shade);r(33,17,12,2,'#c3b585');r(58,95,7,11,shade);r(58,47,7,9,accent);if(variant%2){line([[62,32],[78,22],[87,22]],wall,2);r(83,22,11,5,shade);r(85,27,8,2,accent);}
  }
 }
 if(type==='shelter'){
  if(variant===4){
   // Roadside nomad canvas tent + crates
   r(18,62,76,44,'#6d5a46');r(24,52,64,14,'#8c745a');r(34,44,44,10,'#a68b6b');r(44,68,24,38,dark);r(14,84,18,22,wall);r(80,82,18,24,accent);
  }else if(variant===5){
   // Old twin gas pumps under a rusted canopy
   r(14,38,84,8,dark);r(16,40,80,4,accent);r(22,46,5,60,shade);r(85,46,5,60,shade);r(36,68,14,38,'#b55444');r(38,72,10,10,'#e8dec2');r(62,68,14,38,'#b55444');r(64,72,10,10,'#e8dec2');
  }else{
   r(14,48,83,7,dark);r(16,45,78,4,trim);r(22,55,4,48,wall);r(86,55,4,48,wall);r(27,57,57,39,'#4f696b');r(29,59,21,32,'#637d7a');r(53,57,3,39,trim);r(29,62,3,19,'#a1b4a044');r(32,85,48,4,trim);r(34,89,3,14,shade);r(74,89,3,14,shade);r(20,102,75,4,wall);r(69,61,11,16,accent);r(71,65,7,2,shade);r(71,70,7,1,shade);
  }
 }
 if(type==='rail'){
  if(variant>=4){
   // Wooden farm fence + milepost stone
   for(let x=10;x<106;x+=22)r(x,76,5,30,'#6c513e');r(6,80,100,4,'#8a6a52');r(6,92,100,4,'#785a44');r(82,72,14,34,'#9aa39c');r(85,78,8,3,dark);
  }else{
   for(let x=8;x<108;x+=28){r(x,80,4,26,shade);r(x,80,1,23,trim);}r(3,81,105,7,wall);r(3,81,105,2,trim);r(3,89,105,3,shade);for(let x=13;x<108;x+=28)r(x,84,2,2,dark);if(variant%2){r(49,81,9,11,dark);line([[49,82],[57,75],[72,77]],trim,2);}
  }
 }
 if(type==='barrier'){
  if(variant>=4){
   // Sandbag barricade & rusted oil drums
   for(let bx=14;bx<76;bx+=14){r(bx,88,13,10,'#8d7c63');r(bx+2,80,12,9,'#a39175');}r(78,76,16,30,'#8c4a3e');r(78,84,16,3,trim);r(78,94,16,3,trim);
  }else{
   r(15,77,78,25,wall);r(14,100,83,6,shade);r(19,76,68,3,trim);for(let x=21;x<88;x+=17){line([[x,97],[x+10,80]],accent,7);}r(47,65,7,10,shade);r(49,63,3,4,'#b18e63');r(28,93,10,2,shade);r(78,87,8,3,shade);if(variant%2){r(93,95,8,11,accent);r(95,91,4,4,accent);r(91,104,12,2,dark);}
  }
 }
 if(type==='container'){
  if(variant>=4){
   // Double stacked shipping containers / scrap yard pile
   r(12,64,86,40,shade);r(12,62,82,38,wall);r(22,34,62,28,'#4f6d7a');r(24,36,58,24,'#648694');for(let x=28;x<80;x+=8)r(x,38,2,20,'#3b535e');r(56,70,18,12,accent);
  }else{
   r(10,56,89,48,shade);r(10,54,85,47,wall);r(12,55,81,2,trim);r(13,98,80,2,dark);for(let x=17;x<92;x+=8){r(x,59,1,36,trim);r(x+1,59,2,36,shade);}r(57,55,2,44,shade);r(54,63,2,31,dark);r(64,63,2,31,dark);r(61,73,16,9,accent);r(64,76,10,2,shade);r(16,88,7,5,accent);r(89,57,4,6,shade);
  }
 }
 if(type==='tower'){
  if(variant===3||variant===4){
   // Tall wind turbine tower with angled blades
   r(52,32,8,74,wall);r(53,32,3,74,trim);r(46,96,20,10,shade);r(49,28,14,10,dark);r(52,30,8,6,accent);
   line([[56,33],[56,6]],trim,4);line([[56,33],[82,47]],trim,4);line([[56,33],[30,47]],trim,4);
  }else if(variant===5){
   // Giant satellite dish / communication tower
   r(48,54,16,52,shade);r(52,54,8,52,wall);r(34,96,44,10,dark);r(26,24,60,26,trim);r(32,28,48,18,wall);r(48,18,16,12,dark);r(54,12,4,14,accent);
  }else{
   for(const x of [34,73]){r(x,58,4,48,shade);r(x,59,1,47,trim);}line([[36,65],[75,102],[75,65],[36,102]],wall,2);r(23,23,65,36,wall);r(27,19,57,5,trim);r(24,28,63,2,trim);r(24,49,63,3,shade);r(29,58,53,4,shade);r(28,34,3,10,trim);r(58,23,2,35,shade);r(87,33,3,65,shade);for(let y=36;y<98;y+=7)r(81,y,10,1,trim);r(47,13,15,7,shade);
  }
 }
 // Regional wear changes the same familiar structures without busy effects.
 if(p.weather==='snow'){const pixels=q.getImageData(0,0,112,112).data;q.globalCompositeOperation='source-atop';for(let x=0;x<112;x++){for(let y=0;y<99;y++)if(pixels[(y*112+x)*4+3]>100){r(x,y,1,2,'#d1d5c7');break;}}q.globalCompositeOperation='source-over';r(23,ground-3,60,3,'#bbc7bf');}
 if(['vine','alien'].includes(p.weather)){const col=p.weather==='alien'?'#8c9b87':'#59705d';for(let i=0;i<5;i++){const x=26+Math.floor(sceneryRandom(variant,i,8)*58),y=75+i*6;r(x,y,2,ground-y,col);r(x-3,Math.min(y+4,ground-3),7,3,col);}}
 if(['alien','occupied'].includes(p.weather)&&ROADSIDE_MOUNTS[type]){
  const [x,y,w,h]=ROADSIDE_MOUNTS[type],signal=p.weather==='alien'?'#a3b5aa':accent;
  q.globalCompositeOperation='source-atop';
  r(x,y,w,h,dark);r(x+2,y+Math.floor(h/2),Math.max(1,w-4),1,signal);r(x+Math.floor(w/2),y+2,1,Math.max(1,h-4),signal);
  q.globalCompositeOperation='source-over';
 }
 if(['dust','salt','rust'].includes(p.weather)){q.globalCompositeOperation='source-atop';for(let i=0;i<16;i++){r(Math.floor(sceneryRandom(variant,i,7)*100)+6,Math.floor(sceneryRandom(variant,i,11)*64)+40,2+i%4,1,i%2?accent:trim);}q.globalCompositeOperation='source-over';}
 if(sprites.size>=96)sprites.delete(sprites.keys().next().value);sprites.set(key,c);return c;
}
export function drawRoadside(ctx,{seed,region,travel,seconds,assets,image}){const p=ROADSIDE_PROFILES[region.id]||ROADSIDE_PROFILES.salt;
 const depth=item=>item.type==='building'?ROAD_GROUND.building:item.type==='vehicle'?ROAD_GROUND.parked:ROAD_GROUND.prop;
 for(const item of roadsideItems(seed,region,travel).sort((a,b)=>depth(a)-depth(b))){const {type,x,variant,scale}=item;ctx.save();ctx.globalAlpha*=.94;
  if(type==='building'){const kind=p.facades[variant%p.facades.length],a=assets.facilities[kind],picture=a&&image(a.image),w=(kind==='warehouse'?110:96)*scale;
   if(picture){const box=groundedBox(a,x,ROAD_GROUND.building,w);groundShadow(ctx,a,box);ctx.drawImage(picture,...a.rect,box.x,box.y,box.width,box.height);}
  }else if(type==='vehicle'){const model=p.vehicles[variant%p.vehicles.length],a=assets.vehicles[model],picture=image(a.image),w=78*scale;if(picture){const box=groundedBox(a,x,ROAD_GROUND.parked,w,w*72/160);groundShadow(ctx,a,box,.4);ctx.drawImage(picture,box.x,box.y,box.width,box.height);}}
  else {const size=type==='pole'?106*scale:type==='tower'?99*scale:91*scale,box=groundedBox({ground:propGround(type)},x,ROAD_GROUND.prop,size,size);ctx.drawImage(roadsideSprite(type,region.id,variant),box.x,box.y,box.width,box.height);}
  ctx.restore();
 }
 for(const car of roadsideTraffic(seed,region,travel,seconds)){const a=assets.vehicles[car.vehicle],picture=image(a.image);if(!picture)continue;const w=83,h=w*72/160,box=groundedBox(a,car.x,ROAD_GROUND.traffic,w,h);groundShadow(ctx,a,box,.4);ctx.save();ctx.translate(box.x+w,box.y);ctx.scale(-1,1);ctx.drawImage(picture,0,0,w,h);ctx.restore();}
}
