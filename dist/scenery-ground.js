import {SCENERY_GROUND_DATA} from './scenery-ground-data.js';

// Depth increases down the road. Airborne art is deliberately outside this system.
export const ROAD_GROUND=Object.freeze({terrain:165,pylon:168,building:169,prop:172,parked:177,traffic:185,encounter:196,player:220,foreground:237});
export function groundMetric(asset){
 const image=typeof asset==='string'?asset:asset?.image;
 const rect=typeof asset==='object'?asset?.rect:null;
 return SCENERY_GROUND_DATA[image+(rect?'#'+rect.join(','):'')]||null;
}
export function groundRatio(asset){
 if(Number.isFinite(asset?.ground))return asset.ground;
 const metric=groundMetric(asset);return metric?metric[2]/metric[1]:1;
}
export function groundedBox(asset,x,ground,width,height){
 const metric=groundMetric(asset),rect=asset?.rect;
 height??=width*(rect?rect[3]/rect[2]:metric?metric[1]/metric[0]:1);
 const ratio=groundRatio(asset);
 return {x:Math.round(x),y:Math.round(ground-height*ratio),width,height,ground,contact:Math.round(ground-height*ratio)+height*ratio};
}
export function propGround(type){return (type==='container'?104:106)/112;}

export function groundShadow(ctx,asset,box,opacity=.25){
 const metric=groundMetric(asset),left=metric?metric[3]/metric[0]:.1,right=metric?metric[4]/metric[0]:.9;
 ctx.save();ctx.globalAlpha*=opacity;ctx.fillStyle='#18272e';
 ctx.fillRect(Math.round(box.x+box.width*left),Math.round(box.ground-1),Math.max(2,Math.round(box.width*(right-left))),2);
 ctx.restore();
}
