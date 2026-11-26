import {BIOMES,PLACE_NAMES} from './route-catalog.js';
export {BIOMES};
export const JOURNEY_DISTANCES=[3000,5000,10000];
export const DEFAULT_DISTANCE_KM=3000;
export const normalizeDistanceKm=km=>{const n=Number(km);return [1000,3000,5000,10000].includes(n)?n:1000;};
export const totalProgressFor=kmOrState=>{const km=typeof kmOrState==='object'&&kmOrState!==null?(kmOrState.totalKm||kmOrState.route?.totalKm||1000):(kmOrState||1000);return Math.max(100,Math.round(normalizeDistanceKm(km)/10));};
export const regionCountFor=km=>Math.max(10,Math.round(normalizeDistanceKm(km)/100));
export const regionIndex=(distance,totalRegions=10)=>Math.max(0,Math.min(totalRegions-1,Math.floor((distance-1)/10)));
function hash(text){let h=2166136261;for(const ch of String(text)){h=Math.imul(h^ch.charCodeAt(0),16777619);}return h>>>0||1;}
function stream(seed){let x=hash(seed);return sides=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)%sides+1;};}
export function createDestination(seed,roll=stream('eastward-paradise:'+seed)){const nameRoll=roll(100);return {nameRoll,name:PLACE_NAMES[nameRoll-1]+'樂園'};}
export const remainingKm=(distance,totalKm=1000)=>{const km=normalizeDistanceKm(totalKm),maxProg=totalProgressFor(km);return Math.round(Math.max(0,Math.min(1,(maxProg-distance)/(maxProg-1)))*km);};
export const destinationAt=state=>state.route?.destination||createDestination(state.seed);
export function createRoute(seed,roll=stream('eastward-route:'+seed),totalKm=1000){
 const km=normalizeDistanceKm(totalKm),count=regionCountFor(km);
 return {version:3,totalKm:km,destination:createDestination(seed),regions:Array.from({length:count},(_,index)=>{const terrainRoll=roll(BIOMES.length),nameRoll=roll(100),b=BIOMES[terrainRoll-1];return {index,start:index*10+1,end:(index+1)*10,terrainRoll,nameRoll,id:b.id,kind:b.name,name:PLACE_NAMES[nameRoll-1]+b.name};})};
}
const cache=new Map();
export function biomeAt(distance,seed=0,route=null){if(!route){if(!cache.has(seed)){if(cache.size>=32)cache.delete(cache.keys().next().value);cache.set(seed,createRoute(seed));}route=cache.get(seed);}return route.regions[regionIndex(distance,route.regions.length)];}
export function normalizeRoute(state){if(!state)return;state.totalKm=normalizeDistanceKm(state.totalKm||state.route?.totalKm||1000);const need=regionCountFor(state.totalKm);if(!state.route||state.route.regions?.length!==need){state.route=createRoute(state.seed,undefined,state.totalKm);if(state.travel)delete state.travel.preview;}state.route.totalKm=state.totalKm;state.route.destination??=createDestination(state.seed);state.route.version=3;if(state.current)nameEncounter(state);}
const ROAD_PLACES={1:'加油站',2:'旅館',3:'雜貨店',4:'修車廠',5:'藥品攤',14:'求助亭',15:'急救站',21:'回收場',23:'橋',24:'避難所',25:'軍用庫房',26:'隧道管理室',28:'書車',29:'報攤',30:'紀念牆',33:'卸貨站',34:'裝備市場',35:'二手車行',36:'改裝店',37:'修車棚',38:'診所',39:'休息庭院',40:'驛站',44:'藥房',45:'校車',48:'倉庫',52:'收費站',56:'大橋',72:'檢查站',74:'隧道',88:'大橋'};
const ROOM_PLACES={16:'雜貨店',17:'藥房',18:'裝備交換所',19:'燃料站',20:'工坊',21:'診所',22:'客房',23:'零件鋪',25:'車行',89:'商店'};
export function nameEncounter(state){
 const c=state.current;if(!c||c.place)return;
 const parent=state.frames?.at(-1)?.parent;if(parent&&!parent.place)nameEncounter({...state,current:parent,frames:[]});
 const id=c.event?.id||'',n=Number(id.split('_')[1]),suffix=c.event?.placeSuffix||(id.startsWith('road_')?ROAD_PLACES[n]:id.startsWith('building_')?ROOM_PLACES[n]:null);
 if(!suffix){if(parent?.place)c.place={...parent.place,inherited:true};return;}
 const roll=stream(`eastward-place:${state.seed}:${state.stop}:${c.instance??state.serial}:${id}`)(100);
 c.place={name:PLACE_NAMES[roll-1]+suffix,nameRoll:roll,kind:suffix};
}
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
export function routeView(state,u=1){
 const totalKm=normalizeDistanceKm(state.totalKm||state.route?.totalKm||1000),maxProg=totalProgressFor(totalKm),lastBoundary=maxProg-9;
 const distance=state.progress+(state.mode==='driving'?(state.travel?.n||0)*smooth(u):0),route=state.route;
 const current=biomeAt(distance,state.seed,route),nextBoundary=Math.round((distance-1)/10)*10+1;
 let from=current,to=current,blend=0;
 if(nextBoundary>1&&nextBoundary<=lastBoundary&&Math.abs(distance-nextBoundary)<1.2){from=biomeAt(nextBoundary-1,state.seed,route);to=biomeAt(nextBoundary,state.seed,route);blend=smooth((distance-nextBoundary+1.2)/2.4);}
 return {distance,current,from,to,blend,remainingKm:remainingKm(distance,totalKm),totalKm};
}
