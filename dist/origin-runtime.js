import {ORIGINS} from './origin-catalog.js';
import {STARTER_VEHICLES,starterVehicle} from './vehicle-runtime.js';
import {destinationAt} from './route-runtime.js';
import {authorProloguePast,authorPrologueMotive,authorPrologueVehicle} from './storybook.js';

function prologueSnarkChance(seed,pageIdx){
 let h=2166136261;
 for(const ch of `prologue-snark:${seed}:${pageIdx}`)h=Math.imul(h^ch.charCodeAt(0),16777619);
 return ((h>>>0)%100)<45;
}

export function originPages(g){
 const p=g.s.party.find(p=>p.id===g.s.protagonistId)||g.s.party[0],o=p?.origin;
 if(!o)return [];
 const v=g.vehicleStats(),dest=destinationAt(g.s).name,seed=g.s.seed||1;
 const pastQuip=prologueSnarkChance(seed,0)?`\n\n${authorProloguePast(p,g.d.catalog)}`:'';
 const motiveQuip=prologueSnarkChance(seed,1)?`\n\n${authorPrologueMotive(p,dest)}`:'';
 const vehicleQuip=prologueSnarkChance(seed,2)?`\n\n${authorPrologueVehicle(p,v)}`:'';
 return [
  {title:`背景 · ${o.past.title}`,text:`${o.past.text}${pastQuip}`},
  {title:`動機 · ${o.motive.title}`,text:`${o.motive.text}${motiveQuip}`},
  {title:`座駕 · ${v.name}`,text:`${p.name}清點著這輛「${v.name}」的家當：${v.seats} 席座艙 · 汽油 ${g.s.resources.fuel} / ${v.capacity} · 車況 ${g.s.vehicle.hp} / ${g.s.vehicle.maxHp}\n裝甲 ${v.armor} · ${v.weapon.name}（傷害加成 +${v.weapon.bonus}）\n車體還能改裝 ${v.limit-v.used} 次。${p.name}就帶著這點少得可憐的本錢，準備發動引擎前往${dest}。${vehicleQuip}`}
 ];
}

export function installOrigins(Game){
 const random=Game.prototype.startRandom;
 Game.prototype.startRandom=function(seed,totalKm){
  const s=random.call(this,seed,totalKm),p=s.party[0],pastRoll=this.roll(100),motiveRoll=this.roll(100),vehicleRoll=this.roll(10);
  const render=r=>({...r,text:r.text.replaceAll('{paradise}',destinationAt(s).name).replaceAll('{hero}',p.name)});
  p.origin={pastRoll,motiveRoll,past:render(ORIGINS.past.rows[pastRoll-1]),motive:render(ORIGINS.motive.rows[motiveRoll-1])};
  s.startingVehicleRoll=vehicleRoll;s.vehicle=starterVehicle(vehicleRoll);
  s.resources.fuel=STARTER_VEHICLES[vehicleRoll-1].fuel;s.resources.fuelReserve=0;
  s.prologue={step:0};s.mode='prologue';
  // Keep s.messages clean during prologue so opening pages are never repeated once driving begins.
  s.messages=[];s.messageSerial=0;s.journeyFlow.notice=s.notice;
  return s;
 };
 Game.prototype.advancePrologue=function(){
  if(this.s.mode!=='prologue')return false;
  const pages=originPages(this),step=this.s.prologue.step,hero=this.s.party[0];
  if(step<pages.length-1){
   this.s.prologue.step++;
  }else{
   this.s.prologue.completed=true;this.s.mode='ready';
   this.s.notice=`${hero?.name||'主角'}擰開電門發動引擎，破車噴出一團黑煙開始向東——而我也只好翻開稿紙，開始記錄這趟不靠譜的遠行。`;
  }
  return true;
 };
}
