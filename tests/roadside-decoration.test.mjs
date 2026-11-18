import test from 'node:test';
import assert from 'node:assert/strict';
import {roadsideSprite,ROADSIDE_MOUNTS} from '../dist/roadside-art.js';
import {propGround} from '../dist/scenery-ground.js';

// A small alpha raster for these fillRect/line sprites. It lets the test inspect
// real connected pixel regions, including source-atop masks, without a browser.
function canvas(){
 const c={width:112,height:112},data=new Uint8ClampedArray(112*112*4);
 const q={fillStyle:'#000000',strokeStyle:'#000000',lineWidth:1,globalCompositeOperation:'source-over',points:[],
  put(x,y,color){if(x<0||x>=112||y<0||y>=112)return;const index=(y*112+x)*4,alpha=color.length===9?parseInt(color.slice(7,9),16):255,old=data[index+3];if(this.globalCompositeOperation==='source-atop'){if(old)data[index+3]=old;}else data[index+3]=Math.round(alpha+old*(1-alpha/255));},
  fillRect(x,y,w,h){for(let yy=Math.ceil(y);yy<y+h;yy++)for(let xx=Math.ceil(x);xx<x+w;xx++)this.put(xx,yy,this.fillStyle);},
  beginPath(){this.points=[];},moveTo(x,y){this.points.push([x,y]);},lineTo(x,y){this.points.push([x,y]);},
  stroke(){for(let i=1;i<this.points.length;i++){const [ax,ay]=this.points[i-1],[bx,by]=this.points[i],dx=bx-ax,dy=by-ay,l2=dx*dx+dy*dy,r=this.lineWidth/2;
   for(let y=Math.floor(Math.min(ay,by)-r);y<=Math.ceil(Math.max(ay,by)+r);y++)for(let x=Math.floor(Math.min(ax,bx)-r);x<=Math.ceil(Math.max(ax,bx)+r);x++){const t=l2?Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/l2)):0;if(Math.hypot(x-ax-t*dx,y-ay-t*dy)<=r+.1)this.put(x,y,this.strokeStyle);}
  }},getImageData(){return {data:data.slice()};}
 };
 c.getContext=()=>q;c.pixels=data;return c;
}
function opaque(sprite){return Uint8Array.from({length:112*112},(_,i)=>sprite.pixels[i*4+3]>=128?1:0);}
function components(mask){
 const seen=new Uint8Array(mask.length),regions=[];
 for(let start=0;start<mask.length;start++){if(!mask[start]||seen[start])continue;const region=[],pending=[start];seen[start]=1;
  for(let at=0;at<pending.length;at++){const n=pending[at],x=n%112,y=Math.floor(n/112);region.push(n);for(const [xx,yy] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){if(xx<0||xx>=112||yy<0||yy>=112)continue;const next=yy*112+xx;if(mask[next]&&!seen[next]){seen[next]=1;pending.push(next);}}}
  regions.push(region);
 }return regions;
}

test('occupation plaques attach to existing panels, including short rails and barriers',()=>{
 const previous=globalThis.document;globalThis.document={createElement:canvas};
 try{for(const [type,[x,y,w,h]] of Object.entries(ROADSIDE_MOUNTS))for(let variant=0;variant<3;variant++){
  const base=opaque(roadsideSprite(type,'salt',variant)),occupied=opaque(roadsideSprite(type,'city',variant));let attached=0;
  for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)attached+=base[yy*112+xx];
  assert(attached/(w*h)>=.9,type+' has no structure to carry its plaque');
  assert.deepEqual(occupied,base,type+' plaque must not create detached pixels');
 }}finally{globalThis.document=previous;}
});

test('alien growth, vines, snow and weather wear cannot add floating decorations',()=>{
 const previous=globalThis.document;globalThis.document={createElement:canvas};
 try{for(const type of Object.keys(ROADSIDE_MOUNTS))for(let variant=0;variant<3;variant++){
  const base=opaque(roadsideSprite(type,'salt',variant)),ground=propGround(type)*112;
  for(const biome of ['alien','city','forest','marsh','farmland','oasis','snow','coast','industrial','desert','canyon']){
   const sprite=opaque(roadsideSprite(type,biome,variant));
   for(const region of components(sprite)){
    const attached=region.some(i=>base[i]),rooted=region.some(i=>Math.floor(i/112)>=ground-1);
    assert(attached||rooted,`${biome}/${type}/${variant} has a floating component near ${region[0]%112},${Math.floor(region[0]/112)}`);
   }
  }
 }}finally{globalThis.document=previous;}
});
