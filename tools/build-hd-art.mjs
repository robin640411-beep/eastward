import {createRequire} from 'node:module';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

const moduleRoot=process.env.EASTWARD_ART_NODE_MODULES;
const require=createRequire(moduleRoot?resolve(moduleRoot,'../package.json'):import.meta.url);
const sharp=require('sharp');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const source='art-direction/hd2d/',dir='dist/assets/hd2d/';
const read=file=>JSON.parse(readFileSync(file,'utf8'));
const {races,professions}=read('dist/data/npc-catalog.json');
const base=read('dist/assets/manifest.json');
const catalog={characters:{},portraits:{},vehicles:{},starters:{},worlds:{}};
mkdirSync(dir,{recursive:true});

function sheetCells({width,height},columns,rows){
  return Array.from({length:columns*rows},(_,index)=>{
    const x=index%columns,y=Math.floor(index/columns);
    const left=Math.round(x*width/columns),top=Math.round(y*height/rows);
    return {left,top,width:Math.round((x+1)*width/columns)-left,height:Math.round((y+1)*height/rows)-top};
  });
}
async function cropSprite(file,cell,whiteMatte=false){
  const {data,info:{width,height}}=await sharp(file).extract(cell).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  // The figures sheet came back with an off-white matte. Remove the light neutral
  // background connected to the edges, preserving white highlights inside figures.
  if(whiteMatte){
    const visited=new Uint8Array(width*height),queue=[];
    function add(pos){
      if(visited[pos])return;
      visited[pos]=1;
      const i=pos*4,low=Math.min(data[i],data[i+1],data[i+2]),high=Math.max(data[i],data[i+1],data[i+2]);
      if(low>=208&&high-low<=23){data[i+3]=0;queue.push(pos);}
    }
    for(let x=0;x<width;x++){add(x);add((height-1)*width+x);}
    for(let y=0;y<height;y++){add(y*width);add(y*width+width-1);}
    for(let index=0;index<queue.length;index++){
      const pos=queue[index],col=pos%width;
      if(col>0)add(pos-1);
      if(col<width-1)add(pos+1);
      if(pos>=width)add(pos-width);
      if(pos<width*(height-1))add(pos+width);
    }
  }
  let x0=width,y0=height,x1=-1,y1=-1;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const i=(y*width+x)*4+3;
    if(data[i]>(whiteMatte?170:135)){
      x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);
      data[i]=whiteMatte?255:data[i];
    }else data[i]=0;
  }
  if(x1-x0<30||y1-y0<30)throw Error('Empty sprite cell: '+file+' '+JSON.stringify(cell));
  const w=x1-x0+1,h=y1-y0+1;
  const cropped=await sharp(data,{raw:{width,height,channels:4}}).extract({left:x0,top:y0,width:w,height:h}).png().toBuffer();
  return {image:await loadImage(cropped),w,h,x:cell.left+x0,y:cell.top+y0};
}
function save(canvas,path){writeFileSync(dir+path,canvas.toBuffer('image/png'));return 'hd2d/'+path;}
const jobs=[
  ['#b9a16b','wheel'],['#b17948','tool'],['#c5c9b0','cross'],['#899171','plate'],
  ['#a3af9f','lens'],['#c69d54','pouch'],['#a98872','pack'],['#5f9fa1','tool'],
  ['#82a8b9','lens'],['#74ad9d','screen'],['#a28d68','quiver'],['#7e8e9c','plate'],
  ['#c79367','pouch'],['#9e8eaa','pin'],['#a58f75','book'],['#c9b67c','keys'],
  ['#aa6a59','pack'],['#92aa80','vial'],['#bfb484','coil'],['#b18497','pin']
];
function costume(ctx,x,y,index){
  const [color,gear]=jobs[index],dark='#27323b',light='#e2d2a7';
  const box=(dx,dy,w,h,paint)=>{ctx.fillStyle=paint;ctx.fillRect(x+dx,y+dy,w,h);};
  if(['pouch','pack','book','screen','plate'].includes(gear)){
    box(-2,-1,21,21,dark);box(0,0,17,17,color);box(2,1,13,3,light);box(3,12,11,2,dark);
    if(gear==='pack')box(-5,4,4,13,color);
    if(gear==='screen')box(3,6,10,5,'#b0ddd0');
    if(gear==='plate')box(6,6,5,11,dark);
  }else{
    box(-1,0,17,15,dark);box(1,1,13,11,color);
    if(gear==='cross'){box(6,2,3,9,'#a64945');box(3,5,9,3,'#a64945');}
    if(gear==='tool'){box(6,-2,3,17,light);box(3,-3,9,4,light);}
    if(gear==='vial'){box(5,-2,6,14,light);box(6,4,4,6,'#5a9b83');}
    if(gear==='lens'||gear==='wheel'||gear==='coil'){box(4,3,7,7,dark);box(5,4,5,5,light);}
    if(gear==='keys'||gear==='quiver'){box(4,2,3,15,light);box(9,3,3,13,dark);}
    if(gear==='pin'){box(6,2,4,7,light);box(4,4,8,3,light);}
  }
}
const people=source+'people.png',peopleCells=sheetCells(await sharp(people).metadata(),4,3);
for(const [index,race] of races.entries()){
  const body=await cropSprite(people,peopleCells[index],true);
  const portrait=createCanvas(72,72),p=portrait.getContext('2d');
  const head=body.h*(index===6?.39:index===5?.36:.32),portraitWidth=Math.min(body.w,head*1.18),srcX=body.w-portraitWidth;
  const scale=Math.min(66/portraitWidth,66/head),w=portraitWidth*scale,h=head*scale;
  p.imageSmoothingEnabled=false;p.drawImage(body.image,srcX,0,portraitWidth,head,(72-w)/2,(72-h)/2,w,h);
  catalog.portraits[race.id]=save(portrait,'portrait-'+race.id+'.png');
  for(const [job,profession] of professions.entries()){
    const art=createCanvas(144,216),ctx=art.getContext('2d');
    const zoom=Math.min(136/body.w,208/body.h),w=body.w*zoom,h=body.h*zoom,x=(144-w)/2,y=213-h;
    ctx.imageSmoothingEnabled=false;ctx.drawImage(body.image,x,y,w,h);
    costume(ctx,Math.round(x+w*.51),Math.round(y+h*.52),job);
    catalog.characters[race.id+'_'+profession.id]=save(art,race.id+'-'+profession.id+'.png');
  }
}

// Coordinates refer to the visible side windows and wheel hubs on the source sheets.
const baseVehicles=[
 ['wagon',[[270,151,46,32],[202,150,43,33],[109,153,54,30]],[[137,267],[401,267]]],
 ['pickup',[[776,135,52,37]],[[651,266],[905,267]]],
 ['compact',[[1341,137,50,39],[1243,138,65,38]],[[1173,268],[1407,266]]],
 ['sedan',[[256,480,54,35],[190,478,44,36],[166,483,19,31]],[[130,597],[404,596]]],
 ['rover',[[774,463,48,34],[705,462,38,35]],[[647,595],[894,593]]],
 ['van',[[1370,460,43,39],[1286,460,39,39],[1229,460,34,39],[1170,460,34,39]],[[1149,596],[1437,596]]],
 ['armored',[[280,800,30,29],[225,800,32,29],[175,800,28,29],[121,800,29,29]],[[110,937],[389,935]]],
 ['bus',[[874,812,40,37],[818,812,39,37],[759,812,40,37],[702,812,40,37]],[[631,941],[890,941]]],
 ['ambulance',[[1325,819,43,34],[1251,818,37,36],[1191,818,31,34]],[[1161,934],[1413,934]]]
];
const starters=[
 ['courier',[[159,174,69,39]],[[95,303],[285,303]]],
 ['sweeper',[[576,164,55,47]],[[492,304],[688,304]]],
 ['scout',[[947,165,42,35],[870,165,31,34]],[[872,303],[1066,302]]],
 ['coupe',[[1347,178,53,39],[1279,186,42,27]],[[1277,303],[1471,303]]],
 ['salvager',[[1772,164,48,38]],[[1667,304],[1880,302]]],
 ['taxi',[[175,569,52,38],[120,570,30,35]],[[96,694],[297,698]]],
 ['clinic',[[582,567,66,42]],[[480,696],[671,697]]],
 ['radio',[[996,567,65,43]],[[870,696],[1091,696]]],
 ['patrol',[[1355,567,52,35],[1309,575,21,28]],[[1268,695],[1472,696]]],
 ['sporevan',[[1812,570,47,35],[1677,567,33,28],[1639,567,30,28]],[[1681,697],[1887,698]]]
];
function splitWindows(glass,seats){
  const panes=glass.map(w=>({...w,occupants:0}));
  for(let i=0;i<seats;i++){
    const pane=i<panes.length?panes[i]:panes.reduce((a,b)=>a.width/(a.occupants+1)>=b.width/(b.occupants+1)?a:b);
    pane.occupants++;
  }
  return panes.flatMap(({x,y,width,height,occupants:n})=>Array.from({length:n},(_,i)=>({x:x+width*i/n,y,width:width/n,height})));
}
for(const [key,entries,cols,rows] of [['vehicles',baseVehicles,3,3],['starters',starters,5,2]]){
  const file=source+key+'.png',cells=sheetCells(await sharp(file).metadata(),cols,rows);
  for(const [index,[id,windows,wheels]] of entries.entries()){
    if(!base[key][id])continue;
    const sprite=await cropSprite(file,cells[index]);
    const car=createCanvas(320,144),ctx=car.getContext('2d');
    const fit=Math.min(308/sprite.w,128/sprite.h),left=(320-sprite.w*fit)/2,top=140-sprite.h*fit;
    const project=(x,y)=>[left+(x-sprite.x)*fit,top+(y-sprite.y)*fit];
    const panes=windows.map(([x,y,w,h])=>{
      const [px,py]=project(x,y);
      return {x:px/2,y:py/2,width:w*fit/2,height:h*fit/2};
    });
    if(key==='starters'){
      ctx.fillStyle='#101f2c';
      // Fill the open cabin behind the doors and glazing, leaving the outer silhouette transparent.
      for(const pane of panes.slice(0,1)){ctx.fillRect(pane.x*2-3,pane.y*2-3,pane.width*2+8,pane.height*2+7);}
    }
    ctx.imageSmoothingEnabled=false;ctx.drawImage(sprite.image,left,top,sprite.w*fit,sprite.h*fit);
    const image=save(car,key+'-'+id+'.png'),variants={};
    for(let seats=1;seats<=Math.max(4,Object.keys(base[key][id].variants||{}).reduce((n,v)=>Math.max(n,Number(v)),0));seats++){
      variants[seats]={image,windows:splitWindows(panes,Math.min(4,seats))};
    }
    catalog[key][id]={image,windows:splitWindows(panes,Math.min(4,base[key][id].seats)),variants,glazing:true,wheels:wheels.map(([x,y])=>project(x,y).map(v=>v/2))};
  }
}
const road=source+'road.png',size=await sharp(road).metadata();
await sharp(road).webp({quality:91}).toFile(dir+'salt-road.webp');
catalog.worlds.salt={image:'hd2d/salt-road.webp',rect:[0,0,size.width,size.height],size:[size.width,size.height]};
writeFileSync(dir+'catalog.json',JSON.stringify(catalog,null,2)+'\n');
console.log('Wrote',Object.keys(catalog.characters).length,'role sprites,',Object.keys(catalog.portraits).length,'portraits and',Object.keys(catalog.vehicles).length+Object.keys(catalog.starters).length,'vehicles.');
