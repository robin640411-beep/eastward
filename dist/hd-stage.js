import {mixHex} from './journey-view-model.js';

const WIDTH=384,HEIGHT=240;
export function sizeStage(canvas){
  const width=canvas.clientWidth,height=canvas.clientHeight;
  if(!width||!height)return {scale:1,top:0,bottom:0};
  const pixelRatio=Math.min(2,globalThis.devicePixelRatio||1);
  const w=Math.round(width*pixelRatio),h=Math.round(height*pixelRatio);
  if(canvas.width!==w)canvas.width=w;
  if(canvas.height!==h)canvas.height=h;
  const scale=w/WIDTH,extra=Math.max(0,h/scale-HEIGHT),top=Math.round(extra*.55);
  canvas.parentElement.style.setProperty('--viewport-top',top*scale/h*100+'%');
  canvas.parentElement.style.setProperty('--viewport-height',Math.min(100,HEIGHT*scale/h*100)+'%');
  return {scale,top,bottom:extra-top,verticalScale:Math.min(scale,h/HEIGHT)};
}

export function stageMargins(ctx,stage,{light,interior,battle,travel=0}){
  if(stage.top&&(interior||battle)){
    ctx.fillStyle='#141d25';ctx.fillRect(0,-stage.top-1,WIDTH,stage.top+1);
  }
  if(stage.bottom){
    const floor=ctx.createLinearGradient(0,HEIGHT-1,0,HEIGHT+stage.bottom);
    floor.addColorStop(0,interior||battle?'#17232d':'#53554c');floor.addColorStop(1,'#151f21');
    ctx.fillStyle=floor;ctx.fillRect(0,HEIGHT-1,WIDTH,stage.bottom+2);
    if(!interior&&!battle){
      paintRoadGrit(ctx,travel,HEIGHT,stage.bottom);
      paintForeground(ctx,travel,stage.bottom);
    }
  }
}

let roadTexture;
function paintRoadGrit(ctx,travel,y,height){
  if(!roadTexture){
    roadTexture=document.createElement('canvas');roadTexture.width=256;roadTexture.height=64;
    const brush=roadTexture.getContext('2d');
    for(let n=0;n<680;n++){
      const hash=Math.imul(n+17,0x9e3779b1)>>>0;
      brush.fillStyle=n%3?'#c6b7a21c':'#09182030';
      brush.fillRect(hash%256,(hash>>>11)%64,1+(n%3),n%6?1:2);
    }
  }
  const offset=((travel*3.7)%256+256)%256;
  for(let i=0;i<3;i++)ctx.drawImage(roadTexture,i*256-offset,y,256,height);
}

function paintForeground(ctx,travel,height){
  const offset=travel*4.6%91,base=240+height*.84;
  for(let i=-1;i<6;i++){
    const x=i*91-offset,tip=base-height*(.24+i%3*.06);
    ctx.fillStyle='#17252185';
    ctx.beginPath();ctx.moveTo(x-22,base);ctx.lineTo(x-35,tip+15);
    ctx.lineTo(x-16,tip+10);ctx.lineTo(x-13,tip);
    ctx.lineTo(x-4,tip+17);ctx.lineTo(x+8,tip+4);
    ctx.lineTo(x+6,base);ctx.closePath();ctx.fill();
  }
}

export function paintRoadPlane(ctx,{travel,light,storm}){
  const surface=ctx.createLinearGradient(0,162,0,240);
  surface.addColorStop(0,mixHex(light.horizon,'#384249',.65));
  surface.addColorStop(.30,'#3c464b');surface.addColorStop(1,'#252f39');
  ctx.fillStyle=surface;ctx.fillRect(0,162,WIDTH,78);
  paintRoadGrit(ctx,travel,163,77);
  if(storm>.02){
    const gloss=ctx.createLinearGradient(0,164,0,236);
    gloss.addColorStop(0,'#d4dde231');gloss.addColorStop(1,'#8498a000');
    ctx.globalAlpha=storm;ctx.fillStyle=gloss;ctx.fillRect(0,164,WIDTH,76);ctx.globalAlpha=1;
  }
  for(const [y,gap,width,depth] of [[181,74,32,1.7],[223,112,54,3.7]]){
    const offset=travel*depth%gap;
    ctx.fillStyle=y===181?'#b9af8e60':'#dfc99bca';
    for(let i=-1;i<8;i++){
      const x=i*gap-offset;
      ctx.beginPath();ctx.moveTo(x+4,y);ctx.lineTo(x+width-3,y);
      ctx.lineTo(x+width,y+2);ctx.lineTo(x,y+2);ctx.closePath();ctx.fill();
    }
  }
  ctx.fillStyle='#b8b0a388';ctx.fillRect(0,163,WIDTH,1);
  ctx.fillStyle='#9c948589';ctx.fillRect(0,234,WIDTH,2);
  ctx.fillStyle='#53554c';ctx.fillRect(0,236,WIDTH,4);
}

export function contactShadow(ctx,x,y,width,height){
  ctx.save();ctx.translate(x,y);ctx.scale(width,height);
  const shade=ctx.createRadialGradient(0,0,.18,0,0,1);
  shade.addColorStop(0,'#060a11db');shade.addColorStop(1,'#060a1100');
  ctx.fillStyle=shade;ctx.fillRect(-1,-1,2,2);ctx.restore();
}

export function stageLight(ctx,{stage,light,interior,battle,sun,storm}){
  const top=-stage.top,bottom=240+stage.bottom;
  ctx.save();
  const lens=ctx.createRadialGradient(195,124,85,195,124,263);
  lens.addColorStop(0,'#09162400');lens.addColorStop(1,'#0b17256b');
  ctx.fillStyle=lens;ctx.fillRect(0,top,WIDTH,bottom-top);
  if(!battle&&light.light>.55){
    const x=sun?.x??290,y=interior?20:sun?.y??26;
    const bounce=ctx.createRadialGradient(x,y,3,x,y,175);
    bounce.addColorStop(0,'#f7c18033');bounce.addColorStop(1,'#f7c18000');
    ctx.globalAlpha=(1-storm)*light.light*(interior?.45:1);
    ctx.fillStyle=bounce;ctx.fillRect(0,top,WIDTH,bottom-top);
  }
  ctx.restore();
}
