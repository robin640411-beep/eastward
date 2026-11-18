// Road coordinates use a fixed side camera. East and the morning sun are on the right.
// Relief and cast shadows are projected on the CPU; cached masks are shared by parked
// scenery and encounters and are never recomputed as the clock advances.
const silhouettes=new WeakMap();
const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
export function roadSun(minute=720){
  const hour=(((minute??720)/60)%24+24)%24;
  const t=clamp((hour-5)/14,0,1),altitude=hour>5&&hour<19?Math.sin(Math.PI*t):0;
  return {offset:-Math.cos(Math.PI*t)*(.74-.28*altitude),
    depth:.12+.08*altitude,strength:Math.min(1,altitude*5),altitude};
}
function inkMask(picture,rect){
  let cells=silhouettes.get(picture);
  if(!cells){cells=new Map();silhouettes.set(picture,cells);}
  const key=rect.join(',');
  if(cells.has(key))return cells.get(key);
  const mask=document.createElement('canvas'),scale=Math.min(1,192/Math.max(rect[2],rect[3]));
  mask.width=Math.max(1,Math.round(rect[2]*scale));mask.height=Math.max(1,Math.round(rect[3]*scale));
  const brush=mask.getContext('2d');brush.drawImage(picture,...rect,0,0,mask.width,mask.height);
  brush.globalCompositeOperation='source-in';brush.fillStyle='#132335';brush.fillRect(0,0,mask.width,mask.height);
  cells.set(key,mask);return mask;
}
export function groundShadow(ctx,{x,y,w,h,minute,kind='prop',picture,rect,storm=0,mirrored=false}){
  const sun=roadSun(minute);
  ctx.save();
  // The foot of the silhouette stays fixed as its top moves across the ground.
  ctx.translate(x,y);ctx.save();
  ctx.transform(1,0,mirrored?sun.offset:-sun.offset,-sun.depth,0,0);
  ctx.globalAlpha*=sun.strength*(1-.8*storm)*.38;
  if(picture&&rect)ctx.drawImage(inkMask(picture,rect),0,-h,w,h);
  else{
    ctx.fillStyle='#182332';ctx.beginPath();
    ctx.moveTo(w*.1,0);ctx.lineTo(w*.05,-h*.45);ctx.lineTo(w*.28,-h*.8);
    ctx.lineTo(w*.66,-h*.86);ctx.lineTo(w*.94,-h*.44);ctx.lineTo(w*.90,0);ctx.fill();
  }
  ctx.restore();
  const spread=kind==='vehicle'?.46:kind==='structure'?.48:.35;
  ctx.translate(w*.5,0);ctx.scale(Math.max(1,w*spread),Math.max(1,Math.min(h*.072,7)));
  const shade=ctx.createRadialGradient(0,0,.12,0,0,1);
  shade.addColorStop(0,'#121c26ab');shade.addColorStop(1,'#17212b00');
  ctx.fillStyle=shade;ctx.fillRect(-1,-1,2,2);ctx.restore();
}

// Two textured vertical planes meet at the nearest corner. The original art is
// painted at the neutral camera angle. Rotating its two ground-plane vectors as
// a building passes keeps the corner continuous and exposes more or less end wall.
const profile={
  gas:[.77,.26],garage:[.76,.34],motel:[.78,.32],clinic:[.75,.30],
  warehouse:[.68,.41],shop:[.73,.29],checkpoint:[.70,.25],toll:[.75,.23],
  bridge:[.70,.11],tunnel:[.75,.14],memorial:[.84,.12],solar:[.68,.20],
  camp:[.73,.17],scrapyard:[.75,.17],market:[.76,.20]
};
const lamps={gas:[.45,.50],garage:[.45,.58],shop:[.50,.51],clinic:[.57,.53],motel:[.48,.49],
  checkpoint:[.57,.56],toll:[.64,.52],market:[.48,.56],pharmacy:[.48,.55]};
function lamplight(ctx,x,y,w,h,minute,kind){
  const source=lamps[kind];
  if(!source)return;
  const hour=((minute/60)%24+24)%24;
  const amount=hour>16?clamp((hour-16)/3,0,1):clamp((7-hour)/2,0,1);
  if(!amount)return;
  const lampX=x+w*source[0],lampY=y-h+h*source[1];
  ctx.save();ctx.globalAlpha*=amount*.77;
  ctx.translate(lampX,y+1);ctx.scale(Math.max(1,w*.25),Math.max(1,h*.075));
  const pool=ctx.createRadialGradient(0,0,.05,0,0,1);
  pool.addColorStop(0,'#ffcb775c');pool.addColorStop(1,'#f1bc7300');
  ctx.fillStyle=pool;ctx.fillRect(-1,-1,2,2);ctx.restore();
  ctx.save();ctx.globalAlpha*=amount;
  const r=Math.max(3,w*.054),halo=ctx.createRadialGradient(lampX,lampY,0,lampX,lampY,r);
  halo.addColorStop(0,'#ffe6a9');halo.addColorStop(.18,'#ffcf809e');halo.addColorStop(1,'#efac6500');
  ctx.fillStyle=halo;ctx.fillRect(lampX-r,lampY-r,r*2,r*2);ctx.restore();
}
export function facadeProjection(kind,x,w){
  const [corner,depth]=profile[kind]||[.73,.28];
  const yaw=clamp((x+w/2-192)/384,-1,1)*.19;
  const project=(u,z)=>w*(.5+(u-.5)*Math.cos(yaw)+z*Math.sin(yaw));
  return {corner,left:project(0,.08),joint:project(corner,0),right:project(1,depth)};
}
export function drawFacade(ctx,{asset,picture,x,y,w,h,minute,kind,storm=0}){
  const [sx,sy,sw,sh]=asset.rect;
  groundShadow(ctx,{x,y,w,h,minute,kind:'structure',picture,rect:asset.rect,storm});
  const {corner,left,joint,right}=facadeProjection(kind,x,w);
  const cut=Math.max(1,Math.min(sw-1,Math.round(corner*sw)));
  const top=y-h;
  ctx.drawImage(picture,sx,sy,cut,sh,x+left,top,joint-left+.25,h);
  ctx.drawImage(picture,sx+cut,sy,sw-cut,sh,x+joint,top,right-joint,h);
  // Afternoon light comes from the west. Only pixels occupied by the receding
  // wall receive this shade; transparent sky and door openings stay transparent.
  const sun=roadSun(minute),alpha=(.10+.18*sun.offset)*sun.strength;
  if(alpha>.01){
    const mask=inkMask(picture,asset.rect),split=Math.round(corner*mask.width);
    if(split<mask.width){ctx.save();ctx.globalAlpha*=alpha;
      ctx.drawImage(mask,split,0,mask.width-split,mask.height,x+joint,top,right-joint,h);
      ctx.restore();}
  }
  lamplight(ctx,x,y,w,h,minute,kind);
}
