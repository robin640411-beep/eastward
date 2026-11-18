// Decorative scenery has its own stateless hash: it never rolls game events.
export const ROADSIDE_TYPES=['building','vehicle','pole','sign','lamp','shelter','rail','barrier','container','tower'];
export const ROADSIDE_NAMES=['沿路建築','路上車輛','電線桿','招牌','路燈','候車亭','護欄','路障','貨櫃','水塔'];
const profile=(density,wall,trim,accent,weather,facades,vehicles,weights)=>({density,wall,trim,accent,weather,facades,vehicles,weights});
export const ROADSIDE_PROFILES={
 salt:profile(.86,'#888e82','#bdbaa2','#8f7855','salt',['warehouse','garage'],['pickup','rover'],[9,10,15,8,3,5,9,8,8,12]),
 canyon:profile(.83,'#8b786a','#b7a18b','#786d50','dust',['garage','checkpoint'],['pickup','rover'],[7,9,12,11,4,3,20,14,5,6]),
 forest:profile(.94,'#5a6d62','#8b9b87','#9c8c63','vine',['motel','shop'],['compact','van'],[12,9,14,8,5,10,8,7,3,5]),
 city:profile(1.32,'#6c7c7d','#b0b8a8','#a38b62','occupied',['shop','motel','clinic'],['sedan','bus','van'],[20,14,11,15,13,10,8,7,5,4]),
 coast:profile(1.08,'#748b88','#b7beb0','#a79369','rust',['shop','warehouse'],['van','pickup'],[10,11,10,10,8,9,15,5,17,6]),
 industrial:profile(1.24,'#677779','#a1aba0','#bd9f69','rust',['warehouse','garage'],['pickup','armored','van'],[15,12,15,8,7,4,8,10,18,14]),
 marsh:profile(.83,'#586d68','#8d9c89','#958f65','vine',['warehouse','shop'],['rover','pickup'],[6,6,16,6,3,6,10,8,7,13]),
 desert:profile(.74,'#a18e71','#c6b79a','#8c7756','dust',['gas','garage'],['rover','pickup'],[6,11,14,13,3,5,4,9,9,17]),
 farmland:profile(.97,'#7e8170','#b6b49a','#99775a','vine',['warehouse','shop'],['pickup','van'],[14,10,17,7,3,8,5,7,6,20]),
 snow:profile(.81,'#7d8c8e','#c5ceca','#919b87','snow',['motel','checkpoint'],['rover','ambulance'],[9,10,12,13,6,9,16,8,5,5]),
 alien:profile(.90,'#606e72','#93a29a','#9ca98e','alien',['checkpoint','warehouse'],['armored','rover'],[7,7,12,10,9,4,5,18,10,13]),
 oasis:profile(1.03,'#738778','#b0bd9e','#b1a270','vine',['shop','motel'],['compact','van','sedan'],[17,10,13,10,8,10,7,5,5,9])
};
export function sceneryRandom(seed,index,salt=0){let n=(Math.imul(seed|0,374761393)+Math.imul(index|0,668265263)+Math.imul(salt+1,1442695041))|0;n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;}
export function roadsideItems(seed,region,travel,width=384){const p=ROADSIDE_PROFILES[region.id]||ROADSIDE_PROFILES.salt,spacing=145/p.density,offset=travel*1.32,first=Math.floor(offset/spacing),worldSeed=seed+region.index*997,total=p.weights.reduce((a,b)=>a+b,0),items=[];
 for(let i=first-1;i<=Math.ceil((offset+width+110)/spacing);i++){let choice=sceneryRandom(worldSeed,i)*total,n=0;while(n<p.weights.length-1&&choice>=p.weights[n])choice-=p.weights[n++];const jitter=sceneryRandom(worldSeed,i,1)*26,x=i*spacing+jitter-offset;items.push({id:i,type:ROADSIDE_TYPES[n],x,variant:Math.floor(sceneryRandom(worldSeed,i,2)*6),scale:.83+sceneryRandom(worldSeed,i,3)*.2,seed:worldSeed});}return items;
}
export function roadsideTraffic(seed,region,travel,seconds,width=384){const p=ROADSIDE_PROFILES[region.id]||ROADSIDE_PROFILES.salt,spacing=1050/p.density,offset=travel*1.55+seconds*22,first=Math.floor(offset/spacing),items=[];for(let i=first;i<=first+1;i++){const x=(i+1)*spacing-offset-120;if(x>-120&&x<width+120)items.push({id:i,x,vehicle:p.vehicles[Math.floor(sceneryRandom(seed,i,28)*p.vehicles.length)],reverse:true});}return items;}
