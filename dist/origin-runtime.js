import {ORIGINS} from './origin-catalog.js';
import {STARTER_VEHICLES,starterVehicle} from './vehicle-runtime.js';
import {destinationAt} from './route-runtime.js';
import {appendMessage} from './automatic-journey.js';
export function originPages(g){const p=g.s.party.find(p=>p.id===g.s.protagonistId)||g.s.party[0],o=p.origin;if(!o)return [];const v=g.vehicleStats();return [
 {title:'曾經的你 · '+o.past.title,text:o.past.text},
 {title:'為什麼向東 · '+o.motive.title,text:o.motive.text},
 {title:'這段旅程的座駕 · '+v.name,text:`${v.seats} 席 · 汽油 ${g.s.resources.fuel} / ${v.capacity} · 車況 ${g.s.vehicle.hp} / ${g.s.vehicle.maxHp}\n裝甲 ${v.armor} · ${v.weapon.name}（傷害加成 +${v.weapon.bonus}）\n還能改裝 ${v.limit-v.used} 次。你帶著這些，踏上往${destinationAt(g.s).name}的路。`}
 ];}
export function installOrigins(Game){
 const random=Game.prototype.startRandom;Game.prototype.startRandom=function(seed){const s=random.call(this,seed),p=s.party[0],pastRoll=this.roll(100),motiveRoll=this.roll(100),vehicleRoll=this.roll(10),render=r=>({...r,text:r.text.replaceAll('{paradise}',destinationAt(s).name)});
  p.origin={pastRoll,motiveRoll,past:render(ORIGINS.past.rows[pastRoll-1]),motive:render(ORIGINS.motive.rows[motiveRoll-1])};s.startingVehicleRoll=vehicleRoll;s.vehicle=starterVehicle(vehicleRoll);s.resources.fuel=STARTER_VEHICLES[vehicleRoll-1].fuel;s.resources.fuelReserve=0;s.prologue={step:0};s.mode='prologue';const page=originPages(this)[0];appendMessage(s,page.title,page.text,p.id);return s;
 };
 Game.prototype.advancePrologue=function(){if(this.s.mode!=='prologue')return false;const pages=originPages(this),step=this.s.prologue.step;if(step<pages.length-1){this.s.prologue.step++;const p=pages[step+1];appendMessage(this.s,p.title,p.text);}else{this.s.prologue.completed=true;this.s.mode='ready';this.s.notice='你發動引擎，開始向東。';}return true;};
}
