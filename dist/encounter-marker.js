import {vehicleArt} from './vehicle-runtime.js';
import {groundRatio} from './scenery-ground.js';

// Match the exact portrait placement used by world-view's vehicle renderer.
// Unknown/missing drivers never silently acquire the first passenger's bubble.
export function vehicleDriverAnchor(assets,state,{x,y,width,ground=null,zoom=1,pivotY=220}={}){
 const slot=state.party.findIndex(p=>p.id===state.driver);
 if(slot<0)return null;
 const art=vehicleArt(assets,state.vehicle),window=art.windows?.[slot];
 if(!window)return null;
 const scale=width/160,height=width*72/160;
 const bodyTop=ground===null?y:ground-height*groundRatio(art);
 const portrait=Math.min(window.width,window.height)*scale;
 const cx=Math.round(x+window.x*scale)+portrait/2;
 const cy=Math.round(bodyTop+window.y*scale);
 return {cx:cx*zoom,cy:pivotY+(cy-pivotY)*zoom,id:state.driver};
}

export function encounterBubbleBox(anchor,{age=1,soft=false,top=0,width=384}={}){
 if(!anchor||!Number.isFinite(anchor.cx)||!Number.isFinite(anchor.cy))return null;
 const pop=soft?1:Math.max(0,Math.min(1,age/.14));
 const w=18+Math.round(pop*4),h=22+Math.round(pop*4),rise=soft?0:Math.round(3*(1-pop)**2);
 const x=Math.max(3,Math.min(width-w-3,Math.round(anchor.cx-w/2)));
 const y=Math.max(Math.ceil(top)+3,Math.round(anchor.cy-h-9+rise));
 return {x,y,w,h,tip:Math.max(x+4,Math.min(x+w-5,Math.round(anchor.cx)))};
}

export function drawEncounterCue(ctx,anchor,options){
 const box=encounterBubbleBox(anchor,options);if(!box)return;
 const {x,y,w,h,tip}=box,r=(xx,yy,ww,hh,color)=>{ctx.fillStyle=color;ctx.fillRect(xx,yy,ww,hh);};
 ctx.save();ctx.globalAlpha=1;
 // Opaque cream paper and a cool one-pixel edge remain readable after night tint.
 r(x+3,y+2,w-4,h,'#111b2c');
 r(x+2,y,w-4,h,'#30364e');r(x,y+3,w,h-6,'#30364e');
 r(x+3,y+2,w-6,h-4,'#fff0d5');r(x+2,y+4,w-4,h-8,'#fff0d5');
 r(x+4,y+2,w-8,1,'#fff7e9');
 r(tip-2,y+h-1,5,2,'#30364e');r(tip-1,y+h+1,3,2,'#30364e');r(tip,y+h+3,1,2,'#30364e');
 r(tip-1,y+h-2,3,2,'#fff0d5');r(tip,y+h,1,2,'#fff0d5');
 // The mark is pixel geometry, independent of system fonts or device glyphs.
 const mid=x+Math.floor(w/2);
 r(mid-2,y+5,4,10,'#bd4752');r(mid-1,y+5,1,8,'#e67a74');
 r(mid-1,y+15,2,1,'#bd4752');r(mid-2,y+h-7,4,4,'#bd4752');
 ctx.restore();
}
