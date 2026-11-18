import {ROADSIDE_PROFILES,roadsideItems,roadsideTraffic,sceneryRandom} from './roadside-model.js';
import {ROADSIDE_ATLAS} from './roadside-atlas.js';
import {groundShadow,drawFacade} from './volume-light.js';
import {drawVehicleVolume} from './vehicle-volume.js';

// All 16 silhouettes are authored transparent images. Region weather is a small
// cached material overlay, not a replacement for the painted object's lighting.
const cachedProps=new Map(),MAX_CACHED_PROPS=64;
const DIMENSIONS={pole:[54,108],sign:[89,74],lamp:[63,107],shelter:[111,82],rail:[116,41],barrier:[102,45],container:[112,77],tower:[83,112]};
const DEFAULT_REGION={id:'salt'};

/** Stable source-art interface shared by decorative scenery and oracle events.
 * rect is [sourceX,sourceY,width,height]; ground is normalized within that crop.
 * All paths are relative to assets/, like the main game manifest.
 */
export function roadsideAsset(type,variant=0){const entries=ROADSIDE_ATLAS[type];return entries?.[((Math.trunc(variant)%entries.length)+entries.length)%entries.length]||null;}

function regionSprite(type,variant,region,image){const a=roadsideAsset(type,variant);if(!a)return null;const picture=image(a.image);if(!picture)return null;
 const id=typeof region==='string'?region:region?.id||'salt',p=ROADSIDE_PROFILES[id]||ROADSIDE_PROFILES.salt,key=type+':'+id+':'+(variant%6);
 if(cachedProps.has(key))return {picture:cachedProps.get(key),asset:a};
 const sourceW=a.rect[2],sourceH=a.rect[3],ratio=Math.min(1,208/Math.max(sourceW,sourceH)),w=Math.max(1,Math.round(sourceW*ratio)),h=Math.max(1,Math.round(sourceH*ratio));
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const q=canvas.getContext('2d');q.imageSmoothingEnabled=true;q.imageSmoothingQuality='high';q.drawImage(picture,...a.rect,0,0,w,h);
 // Salt bloom, desert dust, sea corrosion and cold moisture remain restrained.
 const tint={salt:['#ded7bb',.12],dust:['#bf9462',.1],rust:['#9c6a4f',.08],vine:['#567866',.08],alien:['#7c708c',.06],snow:['#b7c8d2',.1],occupied:['#526b74',.025]}[p.weather];
 q.globalCompositeOperation='source-atop';if(tint){q.globalAlpha=tint[1];q.fillStyle=tint[0];q.fillRect(0,0,w,h);q.globalAlpha=1;}
 // Local patina sits on solid pixels, so it never creates square sprite borders.
 for(let i=0;i<9;i++){const x=Math.floor(sceneryRandom(variant,i,19)*w),y=Math.floor(h*(.28+sceneryRandom(variant,i,20)*.65));q.fillStyle=i%2?p.trim:p.wall;q.globalAlpha=.16;q.fillRect(x,y,1+i%3,1);}q.globalAlpha=1;q.globalCompositeOperation='source-over';
 if(p.weather==='snow'){
  const alpha=q.getImageData(0,0,w,h).data;q.globalAlpha=.72;q.fillStyle='#dae1d9';
  for(let x=1;x<w-1;x+=2){for(let y=0;y<h-3;y++){if(alpha[(y*w+x)*4+3]>160){q.fillRect(x,y,2,Math.max(1,Math.round(h*.008)));break;}}}q.globalAlpha=1;
 }
 if(p.weather==='vine'||p.weather==='alien'){
  q.globalCompositeOperation='source-atop';q.fillStyle=p.weather==='alien'?'#8e9980':'#58725a';q.globalAlpha=.56;
  for(let i=0;i<4;i++){const x=Math.floor(w*(.21+sceneryRandom(variant,i,35)*.58)),bottom=Math.floor(h*a.ground),y=Math.floor(h*(.73+i*.035));q.fillRect(x,y,1,bottom-y);q.fillRect(x-1,y+2,4,2);}q.globalAlpha=1;q.globalCompositeOperation='source-over';
 }
 if(cachedProps.size>=MAX_CACHED_PROPS)cachedProps.delete(cachedProps.keys().next().value);cachedProps.set(key,canvas);return {picture:canvas,asset:a};
}

/** Paint one shared roadside/event prop. x=box left, y=ground baseline.
 * width/height are maximum destination bounds; the painted silhouette keeps its
 * aspect ratio and is centered within width. Returns the actual drawn bounds.
 */
export function drawRoadsideProp(ctx,{type,variant=0,region=DEFAULT_REGION,image,x,y,width,height,minute=480,storm=0,shadow=true}){
 const rendered=regionSprite(type,variant,region,image);if(!rendered)return null;const {picture,asset}=rendered,nominal=DIMENSIONS[type]||[96,96];width??=nominal[0];height??=width*nominal[1]/nominal[0];
 const scale=Math.min(width/picture.width,height/(picture.height*asset.ground)),w=picture.width*scale,h=picture.height*scale,left=x+(width-w)/2,top=y-h*asset.ground,rect=[0,0,picture.width,picture.height];
 if(shadow)groundShadow(ctx,{x:left,y,w,h:h*asset.ground,minute,storm,kind:type==='shelter'||type==='tower'||type==='container'?'structure':'prop',picture,rect});
 ctx.drawImage(picture,Math.round(left),Math.round(top),w,h);return {x:left,y:top,w,h,ground:y,asset};
}

/** Decorative distribution stays stateless; these calls never consume game RNG. */
export function drawRoadside(ctx,{seed,region,travel,seconds,assets,image,minute=480,storm=0}){const p=ROADSIDE_PROFILES[region.id]||ROADSIDE_PROFILES.salt;
 for(const item of roadsideItems(seed,region,travel)){const {type,x,variant,scale}=item;ctx.save();ctx.globalAlpha*=.96;
  if(type==='building'){
   const kind=p.facades[variant%p.facades.length],a=assets.facilities?.[kind],picture=a&&image(a.image),w=(kind==='warehouse'?112:99)*scale;
   if(picture){const h=w*a.rect[3]/a.rect[2];drawFacade(ctx,{asset:a,picture,x,y:169,w,h,minute,storm,kind});}
  }else if(type==='vehicle'){
   const model=p.vehicles[variant%p.vehicles.length],w=78*scale,h=w*72/160;
   drawVehicleVolume(ctx,{assets,vehicle:{model,mods:[]},party:[],image,x,y:176-h,width:w,
    onGround:foot=>groundShadow(ctx,{...foot,minute,storm,kind:'vehicle'})});
  }else{
   const [w,h]=DIMENSIONS[type]||[96,96];drawRoadsideProp(ctx,{type,variant,region,image,x,y:172,width:w*scale,height:h*scale,minute,storm});
  }ctx.restore();
 }
 for(const car of roadsideTraffic(seed,region,travel,seconds)){
  const w=83,h=w*72/160;
  ctx.save();ctx.translate(Math.round(car.x+w),181-h);ctx.scale(-1,1);
  drawVehicleVolume(ctx,{assets,vehicle:{model:car.vehicle,mods:[]},party:[],image,x:0,y:0,width:w,travel:seconds*20,rolling:true,
   onGround:foot=>groundShadow(ctx,{...foot,minute,storm,kind:'vehicle',mirrored:true})});
  ctx.restore();
 }
}
