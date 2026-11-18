import {vehicleArt,STARTER_VEHICLES,VEHICLE_WEAPONS} from './vehicle-runtime.js';

// Near-side art, people and wheel hubs all remain in the original 160 × 72 space.
// Only the upper and forward silhouette is extruded, exposing real roof/bonnet/front faces.
const surfaces=new Map();
let canvasFactory=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
export function setVehicleCanvasFactory(factory){canvasFactory=factory;surfaces.clear();}
export const VEHICLE_WEAPON_ART=Object.fromEntries(Object.keys(VEHICLE_WEAPONS).map(id=>[id,'vehicle-weapons/'+id+'.svg']));
export function vehicleWeaponVisual(v){const starter=STARTER_VEHICLES.find(c=>c.id===v.starterId&&c.model===v.model);let key=starter?.weapon||v.baseWeapon||'bumper';if(!VEHICLE_WEAPONS[key])key='bumper';if(key==='bumper'&&v.mods?.includes('gun'))key='gun';return {key,image:VEHICLE_WEAPON_ART[key],front:key==='bumper'||key==='ram',level:(v.mods||[]).filter(k=>k==='gun').length};}
const tone=(c,warm=0,dark=0)=>`rgb(${c.map((v,i)=>Math.max(0,Math.min(255,Math.round(v*(1-dark)+warm*[1,.76,.35][i])))).join(',')})`;
function polygon(q,points,color){q.fillStyle=color;q.beginPath();points.forEach(([x,y],i)=>i?q.lineTo(x,y):q.moveTo(x,y));q.closePath();q.fill();}
// A front attachment follows the nose at its own height, never the widest pixel
// elsewhere on a sloping bonnet. Its steel tongue overlaps the near-side body.
export function vehicleFrontMount(edge,bounds,windowBottom){
 let y=Math.round(Math.min(bounds.bottom-13,windowBottom+12));
 y=Math.max(bounds.top,Math.min(bounds.bottom,y));
 if(edge[y]==null){let distance=1;while(distance<72&&edge[y-distance]==null&&edge[y+distance]==null)distance++;y=edge[y-distance]!=null?y-distance:y+distance;}
 const x=edge[y]??bounds.right;
 return {x,y,contact:{x:x-5,y},end:{x:x+3,y}};
}
export function vehicleGroundFootprint(bounds,{x=0,y=0,width=160}={}){const scale=width/160;return {x:x+bounds.left*scale,y:y+(bounds.bottom+1)*scale,w:(bounds.right-bounds.left+1)*scale,h:(bounds.bottom-bounds.top+1)*scale};}
function skin(a,picture){
 if(surfaces.has(a.image))return surfaces.get(a.image);
 const scan=canvasFactory(160,72),q=scan.getContext('2d');q.imageSmoothingEnabled=false;q.drawImage(picture,0,0,160,72);const rgba=q.getImageData(0,0,160,72).data;
 const solid=(x,y)=>x>=0&&x<160&&y>=0&&y<72&&rgba[(y*160+x)*4+3]>90;
 // Ignore isolated source-sheet marks without moving any passenger or wheel coordinate.
 const visited=new Uint8Array(160*72);let largest=[];
 for(let i=0;i<visited.length;i++){if(visited[i]||rgba[i*4+3]<=90)continue;const component=[i];visited[i]=1;for(let n=0;n<component.length;n++){const p=component[n],x=p%160,y=Math.floor(p/160);for(const [xx,yy]of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){const index=yy*160+xx;if(solid(xx,yy)&&!visited[index]){visited[index]=1;component.push(index);}}}if(component.length>largest.length)largest=component;}
 const points=largest.length?largest:[0,159+71*160],xs=points.map(n=>n%160),ys=points.map(n=>Math.floor(n/160));const bounds={left:Math.min(...xs),right:Math.max(...xs),top:Math.min(...ys),bottom:Math.max(...ys)};
 const mask=new Uint8Array(160*72);points.forEach(i=>mask[i]=1);
 const inside=(x,y)=>x>=bounds.left&&x<=bounds.right&&y>=bounds.top&&y<=bounds.bottom&&!!mask[y*160+x];
 const color=(x,y,fallback=[114,120,112])=>{for(let k=0;k<9;k++){const yy=Math.min(71,Math.max(0,Math.round(y+k))),xx=Math.min(159,Math.max(0,Math.round(x))),i=(yy*160+xx)*4;if(rgba[i+3]>100&&Math.max(rgba[i],rgba[i+1],rgba[i+2])>55)return [rgba[i],rgba[i+1],rgba[i+2]];}return fallback;};
 const dx=7,dy=6,layer=canvasFactory(184,96),v=layer.getContext('2d'),ox=6,oy=16;v.imageSmoothingEnabled=false;
 const roof=[];for(let x=bounds.left;x<=bounds.right;x++){let y=bounds.top;while(y<=bounds.bottom&&(!inside(x,y)||!inside(Math.min(x+1,bounds.right),y)))y++;roof[x]=y<=bounds.bottom?y:null;}
 // Clustered metal shading on the exposed upper face, with a shared painted material.
 const topColor=x=>{let values=[];for(let n=-3;n<=3;n++){const xx=Math.max(bounds.left,Math.min(bounds.right,x+n)),yy=roof[xx];if(yy!=null)values.push(color(xx,yy+2));}return values.length?[0,1,2].map(k=>values.reduce((a,c)=>a+c[k],0)/values.length):[106,117,114];};
 for(let x=bounds.left;x<bounds.right;x++){const y=roof[x],next=roof[x+1];if(y==null||next==null)continue;const base=topColor(x);for(let strip=5;strip>=0;strip--){const a0=strip/6,a1=(strip+1)/6;polygon(v,[[ox+x+dx*a0,oy+y-dy*a0],[ox+x+1+dx*a0,oy+next-dy*a0],[ox+x+1+dx*a1,oy+next-dy*a1],[ox+x+dx*a1,oy+y-dy*a1]],tone(base,strip===5?21:10,strip%3===0?.035:0));}
  if(x%7===0){const t=((x*13)%4+1)/6;v.fillStyle=tone(base,22,0);v.fillRect(Math.round(ox+x+dx*t),Math.round(oy+y-dy*t),2,1);}
 }
 // The forward face is a cooler, darker plane. It meets the upper plane at the silhouette.
 const front=[];for(let y=bounds.top;y<=bounds.bottom;y++){let x=bounds.right;while(x>=bounds.left&&!inside(x,y))x--;front[y]=x>=bounds.left?x:null;}
 for(let y=bounds.top;y<bounds.bottom-4;y++){const x=front[y],next=front[y+1];if(x==null||next==null)continue;const base=color(x-3,y);polygon(v,[[ox+x,oy+y],[ox+x+dx,oy+y-dy],[ox+next+dx,oy+y+1-dy],[ox+next,oy+y+1]],tone(base,0,.28));if(y%9===0)polygon(v,[[ox+x+2,oy+y-1],[ox+x+dx-1,oy+y-dy+1],[ox+x+dx-1,oy+y-dy+2],[ox+x+2,oy+y]],tone(base,8,.12));}
 const allWindows=Object.values(a.variants||{}).flatMap(v=>v.windows||[]);const panes=allWindows.length?allWindows:a.windows;const roofLeft=Math.min(...panes.map(p=>p.x)),roofRight=Math.max(...panes.map(p=>p.x+p.width)),roofMid=Math.round((roofLeft+roofRight)/2);const mountX=Math.min(bounds.right-22,Math.max(bounds.left+22,roofMid+dx*.45));
 let mountRoof=roof[Math.min(bounds.right,Math.max(bounds.left,Math.round(mountX-dx*.45)))];if(mountRoof==null)mountRoof=Math.min(...panes.map(p=>p.y))-5;
 const frontMount=vehicleFrontMount(front,bounds,Math.max(...panes.map(p=>p.y+p.height)));
 const mount={x:mountX,y:mountRoof-dy*.45};
 const feet=[-5,5].map(offset=>{const x=mountX+offset,at=Math.min(bounds.right,Math.max(bounds.left,Math.round(x-dx*.45)));return {x,y:(roof[at]??mountRoof)-dy*.45+1};});
 mount.y=Math.min(mount.y,...feet.map(p=>p.y));
 // Cached complete body silhouette for shadows; no suspension offset enters it.
 const shadow=canvasFactory(184,96),sq=shadow.getContext('2d');sq.imageSmoothingEnabled=false;sq.drawImage(layer,0,0);sq.save();sq.beginPath();sq.rect(ox+bounds.left,oy+bounds.top,bounds.right-bounds.left+1,bounds.bottom-bounds.top+1);sq.clip();sq.drawImage(picture,ox,oy,160,72);sq.restore();
 const groundBounds={left:bounds.left,right:bounds.right+dx,top:bounds.top-dy,bottom:bounds.bottom};
 const shadowRect=[ox+groundBounds.left,oy+groundBounds.top,groundBounds.right-groundBounds.left+1,groundBounds.bottom-groundBounds.top+1];
 const result={layer,ox,oy,bounds,dx,dy,mount,feet,front:frontMount,roof,shadow,shadowRect,groundBounds};surfaces.set(a.image,result);return result;
}
export function vehicleAttachmentPlan(assets,vehicle){const a=vehicleArt(assets,vehicle),weapon=vehicleWeaponVisual(vehicle);return {image:a.image,windows:a.windows,wheels:a.wheels||[[36,59],[124,59]],weapon};}
export function drawVehicleVolume(ctx,{assets,vehicle,party=[],image,x=0,y=0,width=160,travel=0,rolling=false,reduced=false,weapons=true,onGround,onLamp}){
 const a=vehicleArt(assets,vehicle),picture=image(a.image);if(!picture)return false;const scale=width/160,mesh=skin(a,picture),wheels=a.wheels||[[36,59],[124,59]],bump=rolling&&!reduced?Math.round(Math.sin(travel*.14)+Math.sin(travel*.3)*.35)*.3:0;
 onLamp?.({x:x+(mesh.front.x+2)*scale,y:y+(mesh.front.y-4+bump)*scale});
 onGround?.({...vehicleGroundFootprint(mesh.groundBounds,{x,y,width}),picture:mesh.shadow,rect:mesh.shadowRect});
 ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.imageSmoothingEnabled=false;
 // One coordinate transform carries body, face, equipment and wheel hubs together.
 ctx.translate(0,bump);ctx.drawImage(mesh.layer,-mesh.ox,-mesh.oy);
 const drawSide=()=>{ctx.save();ctx.beginPath();ctx.rect(mesh.bounds.left-1,mesh.bounds.top-1,mesh.bounds.right-mesh.bounds.left+3,mesh.bounds.bottom-mesh.bounds.top+3);ctx.clip();ctx.drawImage(picture,0,0,160,72);ctx.restore();};
 if(a.glazing)drawSide();
 a.windows.forEach((win,i)=>{const portrait=party[i]&&image(assets.portraits[party[i].race]);if(!portrait)return;const size=Math.min(win.width,win.height),wx=win.x+(win.width-size)/2,wy=win.y+win.height-size;ctx.save();ctx.beginPath();ctx.rect(win.x,win.y,win.width,win.height);ctx.clip();ctx.globalAlpha*=.9;ctx.drawImage(portrait,wx,wy,size,size);ctx.restore();});
 if(!a.glazing)drawSide();
 // Foreground window lip hides the bottom pixel of the portrait inside the cabin.
 for(const win of a.windows){ctx.fillStyle='#28343d88';ctx.fillRect(win.x,win.y+win.height-.6,win.width,.7);}
 if(vehicle.mods?.includes('armor')){const px=(wheels[0][0]+wheels[1][0])*.5,py=Math.min(...wheels.map(w=>w[1]))-10;polygon(ctx,[[px-14,py],[px+13,py-1],[px+16,py+8],[px-15,py+9]],'#4b5355');polygon(ctx,[[px-14,py],[px+13,py-1],[px+13,py+1],[px-14,py+2]],'#a2a38b');ctx.fillStyle='#c7b78f';for(const dx of [-12,12])ctx.fillRect(px+dx,py+2,1.5,1.5);}
 if(vehicle.mods?.includes('tank')){const tx=wheels[0][0]+13,ty=wheels[0][1]-15;ctx.fillStyle='#28373b';ctx.fillRect(tx,ty,12,13);ctx.fillStyle='#837e65';ctx.fillRect(tx+1,ty+1,10,10);ctx.fillStyle='#b0a484';ctx.fillRect(tx+2,ty+1,8,1);ctx.fillStyle='#3f4947';ctx.fillRect(tx+3,ty,2,12);ctx.fillRect(tx+8,ty,2,12);}
 if(rolling&&!reduced){for(const [wx,wy]of wheels){ctx.save();ctx.translate(wx,wy);ctx.rotate(travel*.32);ctx.globalAlpha*=.58;ctx.fillStyle='#b7b8a3';ctx.fillRect(-2.1,-.6,4.2,1.2);ctx.fillStyle='#566569';ctx.fillRect(-.6,-2.1,1.2,4.2);ctx.restore();}}
 if(weapons){const visual=vehicleWeaponVisual(vehicle),weapon=image(visual.image),mount=visual.front?mesh.front:mesh.mount;if(weapon){if(visual.front){ctx.fillStyle='#26373b';ctx.fillRect(mount.contact.x,mount.y-2,mount.end.x-mount.contact.x,5);ctx.fillStyle='#a5a18a';ctx.fillRect(mount.contact.x,mount.y-2,mount.end.x-mount.contact.x,1);ctx.fillStyle='#c3b89a';ctx.fillRect(mount.contact.x+1,mount.y,1,1);}else{for(const foot of mesh.feet){ctx.fillStyle='#26373b';ctx.fillRect(foot.x-1,mount.y,3,Math.max(2,foot.y-mount.y+2));ctx.fillStyle='#929789';ctx.fillRect(foot.x-1,mount.y,1,Math.max(1,foot.y-mount.y+1));}polygon(ctx,[[mount.x-7,mount.y],[mount.x+7,mount.y],[mount.x+4,mount.y+2],[mount.x-8,mount.y+2]],'#283b40');ctx.fillStyle='#9d9f8b';ctx.fillRect(mount.x-5,mount.y,9,.7);}const weaponScale=visual.front?.52:.7,anchor=visual.front?[10,22]:[18,34];ctx.drawImage(weapon,mount.x-anchor[0]*weaponScale,mount.y-anchor[1]*weaponScale,64*weaponScale,40*weaponScale);if(visual.level){ctx.fillStyle='#b6a477';for(let i=0;i<Math.min(3,visual.level);i++)ctx.fillRect(mount.x-4+i*3,mount.y-2,2,2);}}}
 if(vehicle.mods?.includes('lamp')){const lx=mesh.mount.x-14,ly=mesh.mount.y-1;ctx.fillStyle='#34484c';ctx.fillRect(lx,ly-7,2,8);ctx.fillStyle='#c5b997';ctx.fillRect(lx-3,ly-8,8,4);ctx.fillStyle='#f1de9c';ctx.fillRect(lx+3,ly-7,2,2);}
 ctx.restore();return true;
}

const attr=s=>String(s??'').replace(/[&"<>]/g,c=>({'&':'&amp;','"':'&quot;','<':'&lt;','>':'&gt;'}[c]));
export function vehiclePreviewMarkup(v,label='',className=''){return `<canvas class="vehicle-volume-preview ${attr(className)}" width="640" height="320" data-car-model="${attr(v.model)}" data-car-starter="${attr(v.starterId||'')}" data-car-mods="${attr((v.mods||[]).join(','))}" data-car-weapon="${attr(v.baseWeapon||'')}" role="img" aria-label="${attr(label)}"></canvas>`;}
const previewImages=new Map();
export function mountVehiclePreviews(root,assets,party=[]){for(const canvas of root.querySelectorAll('.vehicle-volume-preview')){const v={model:canvas.dataset.carModel,starterId:canvas.dataset.carStarter||undefined,mods:canvas.dataset.carMods?canvas.dataset.carMods.split(','):[],baseWeapon:canvas.dataset.carWeapon||undefined};if(!assets.vehicles[v.model])continue;const q=canvas.getContext('2d');let pending=false;
 const render=()=>{if(!canvas.isConnected)return;pending=false;q.clearRect(0,0,canvas.width,canvas.height);drawVehicleVolume(q,{assets,vehicle:v,party,image:get,x:12,y:42,width:578,reduced:true});};
 const get=path=>{if(!path)return null;let item=previewImages.get(path);if(!item){const picture=new Image();item={picture,listeners:new Set()};picture.onload=()=>{for(const fn of item.listeners)fn();item.listeners.clear();};picture.src='assets/'+path;previewImages.set(path,item);}if(item.picture.complete&&item.picture.naturalWidth)return item.picture;item.listeners.add(()=>{if(!pending){pending=true;requestAnimationFrame(render);}});return null;};render();}}
