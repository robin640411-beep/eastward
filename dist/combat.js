import {battleFrame,frameEffects} from './motion-model.js';
import {actionVisual} from './battle-presentation.js';
// Each awake traveller commits one command. Only then does initiative resolve.
export function installCombat(Game,{learned,ITEMS,clamp,display}) {
 const begin=Game.prototype.beginCombat;
 Game.prototype.beginCombat=function(...args){begin.apply(this,args);if(this.s.battle){this.s.battle.orders={};this.s.battle.guardIds=[];this.s.battle.roster=this.alive().filter(p=>!p.asleep).map(p=>p.id)}};
 Game.prototype.commandActor=function(){const b=this.s.battle;if(!b)return null;b.orders??={};b.roster??=this.alive().filter(p=>!p.asleep).map(p=>p.id);return this.alive().find(p=>b.roster.includes(p.id)&&!p.asleep&&!b.orders[p.id])};
 Game.prototype.enemyAction=function(e){const b=this.s.battle;if(!b||e.hp<=0)return;if(e.stun>0){e.stun--;return;}
  if(b.mode==='vehicle'){this.actionTarget='vehicle';const armor=this.vehicleStats().armor/2,mech=this.alive().some(q=>q.profession==='mechanic')?1:0;const damage=Math.max(1,e.attack-armor*2-mech-(b.guardIds.includes(this.driver()?.id)?3:0));this.s.vehicle.hp=Math.max(0,this.s.vehicle.hp-damage);this.log('敵方攻擊',`車輛受到 ${damage} 傷害。`)}
  else {const target=this.pick(this.alive());if(!target)return;this.actionTarget=target.id;let attack=e.attack;if(e.npc){const n=e.npc,ranged=ITEMS[n.gear.武器]?.ranged;if(this.roll()>90-(ranged&&n.flaw==='unsteady'?10:0)){this.log(e.name,'攻擊落空。');return;}attack+=(n.profession==='soldier'?1:0)-(n.flaw==='weak_grip'&&!ranged?1:0)-(n.flaw==='timid'&&b.round===1?1:0);if(n.profession==='hunter'&&!e.hunterUsed&&target.race!=='synth'){attack+=2;e.hunterUsed=true;}}let damage=Math.max(1,attack-Math.floor(this.stat(target,'defense')/2)-(b.guardIds.includes(target.id)?2:0)-(b.shield||0));if(target.profession==='guard'&&b.watchId===target.id&&!target.asleep&&!b.guardUsed.includes(target.id)){damage=Math.max(0,damage-3);b.guardUsed.push(target.id)}if(target.profession==='scout'&&(b.ambush||b.sleepAttack)&&!target.asleep&&b.round===1)damage=Math.max(0,damage-2);this.hurt(target,damage,['physical','attack']);}this.checkAlive();
 };
 Game.prototype.enemyTurn=function(){const b=this.s.battle;if(!b)return;b.guardIds??=[];for(const e of b.enemies){this.enemyAction(e);if(this.s.mode==='ending')break;}if(this.s.battle){b.roster=this.alive().filter(p=>!p.asleep).map(p=>p.id);b.orders={};}};
 Game.prototype.combatRound=function(command){const b=this.s.battle;if(!b||this.s.mode!=='combat')return false;const p=this.commandActor();if(p){
  if(!['attack','defend','escape','medicine','psi'].includes(command.type))return false;
  if(command.type==='psi'){const pow=learned(p).find(x=>x.id===Number(command.power));if(!pow||p.esp<pow.cost)return false;}
  if(command.type==='medicine'&&this.s.resources.medicine<=Object.values(b.orders).filter(c=>c.type==='medicine').length)return false;
  const allies=['medicine'].includes(command.type)||(command.type==='psi'&&learned(p).find(x=>x.id===Number(command.power))?.type==='heal');
  if(command.target&&!(allies?this.alive():b.enemies.filter(e=>e.hp>0)).some(q=>q.id===command.target))return false;
  b.orders[p.id]={...command};if(this.commandActor())return true;
 }
 b.guardIds=[];
 const turns=[...this.alive().filter(q=>b.orders[q.id]).map(q=>({unit:q,ally:true,speed:this.stat(q,'speed')})),...b.enemies.filter(e=>e.hp>0).map(e=>({unit:e,ally:false,speed:e.speed}))].map((t,i)=>({...t,tie:this.roll(100),index:i})).sort((a,z)=>z.speed-a.speed||z.tie-a.tie||a.index-z.index);
 for(const t of turns){if(t.unit.hp<=0)continue;if(t.ally){if(t.unit.asleep)continue;this.partyAction(t.unit,b.orders[t.unit.id]);}else this.enemyAction(t.unit);
  if(this.s.battle!==b||this.s.mode==='ending')return true;
  if(b.enemies.every(e=>e.hp<=0)){
   const region=Math.max(1,Math.min(10,Math.floor(((this.s.progress||1)-1)/10)+1));
   const scav=this.alive().some(q=>q.profession==='scavenger')?1:0;
   const scrap=2+Math.floor(region/3)+scav;
   this.add('scrap',scrap);
   let loot=`戰鬥勝利，取得 ${scrap} 份廢料。`;
   const dropRoll=this.roll();
   if(dropRoll<=25){
    if(dropRoll<=10){this.add('medicine',1);loot+=' 另搜出 1 份藥品。';}
    else if(dropRoll<=18){const f=3+Math.floor(region/4);this.add('fuel',f);loot+=` 另抽出 ${f} 點汽油。`;}
    else{const eq=this.oracle('equipment').value;if(ITEMS[eq]){this.s.inventory.push(eq);loot+=` 另繳獲裝備：${ITEMS[eq].name}！`;}}
   }
   this.tell(loot);this.finishCombat(true);return true;
  }
  if(b.mode==='vehicle'&&this.s.vehicle.hp<=0){this.tell('車輛失去行駛能力，敵人離去。');this.finishCombat(false);return true;}
 }
 this.s.notice=this.s.logs.slice(0,Math.min(turns.length,4)).reverse().map(l=>l.title+'：'+l.text).join('\n');if(b.round%3===0)this.s.minutes+=5;b.round++;b.orders={};b.roster=this.alive().filter(q=>!q.asleep).map(q=>q.id);return true;
 };
 Game.prototype.partyAction=function(p,c){const b=this.s.battle;let e=b.enemies.find(e=>e.id===c.target&&e.hp>0)||b.enemies.find(e=>e.hp>0);if(!e)return;
 const target=this.alive().find(q=>q.id===c.target)||this.alive().slice().sort((a,z)=>a.hp/a.maxHp-z.hp/z.maxHp)[0];this.actionTarget=(c.type==='medicine'||c.type==='psi'&&learned(p).find(x=>x.id===Number(c.power))?.type==='heal')?target?.id:e.id;
 if(c.type==='defend'){b.guardIds.push(p.id);this.log(display(p),'採取防禦姿態。');return;}
 const gearSum=key=>Object.values(p.gear||{}).reduce((s,id)=>s+(ITEMS[id]?.[key]||0),0);
 if(c.type==='escape'){const chance=clamp(45+this.stat(p,'speed')*2+(b.mode==='character'&&p.race==='mimic'?15:0)+(b.mode==='character'?gearSum('escapeBonus'):0)-(b.mode==='character'&&p.flaw==='noisy'?10:0),5,95);if(this.roll()<=chance){this.tell('成功脫離戰鬥。');this.finishCombat(false);}else this.log(display(p),'逃跑失敗。');return;}
 if(c.type==='medicine'){if(this.s.resources.medicine<1)return;this.add('medicine',-1);target.hp=clamp(target.hp+8+(p.profession==='medic'?2:0)+(p.profession==='chemist'?1:0)+gearSum('healBonus')-(target.flaw==='slow_healing'?1:0),0,target.maxHp);this.log(display(p),`為${display(target)}使用藥品。`);return;}
 if(c.type==='psi'){const power=learned(p).find(x=>x.id===Number(c.power));if(!power||p.esp<power.cost)return;p.esp-=power.cost;const psiBonus=p.profession==='researcher'?1:0;
  if(power.type==='heal'){target.hp=clamp(target.hp+this.stat(p,'psyche')+5+psiBonus,0,target.maxHp);this.log(power.name,display(target)+'恢復生命。');}
  else if(power.type==='shield'){b.shield=3;this.log(power.name,'展開隊伍屏障。');}
  else {for(const enemy of power.type==='burst'?b.enemies.filter(x=>x.hp>0):[e]){enemy.hp=Math.max(0,enemy.hp-this.stat(p,'psyche')-(power.type==='burst'?3:2)-psiBonus);if(power.type==='stun')enemy.stun=1;}this.log(power.name,'超能力擊中了敵人。');}return;
 }
 const vehicleWeapon=b.mode==='vehicle'&&p.id===this.driver()?.id;const ranged=vehicleWeapon||ITEMS[p.gear.武器]?.ranged;if(this.roll()>90-(ranged&&!vehicleWeapon&&p.flaw==='unsteady'?10:0)){this.log(display(p),'攻擊落空。');return;}
 const isMachine=!!(e.machine??this.d.assets.enemies[e.key]?.machine);
 const effDef=Math.max(0,e.defense-(p.profession==='demolition'&&(e.defense>=2||isMachine)?1:0));
 let damage=Math.max(1,this.stat(p,'attack')-effDef)+(p.profession==='soldier'&&(b.mode==='character'||p.id!==this.driver()?.id)?1:0)-(p.flaw==='weak_grip'&&!ranged?1:0)-(b.mode==='character'&&p.flaw==='timid'&&b.round===1?1:0)-(p.startled?1:0);p.startled=false;
 if(isMachine)damage+=gearSum('vsMachine')+({engineer:2,hacker:2,electrician:1}[p.profession]||0);
 if(b.mode==='character'&&p.profession==='hunter'&&!b.usedHunter.includes(p.id)&&!isMachine){damage+=2;b.usedHunter.push(p.id)}
 if(b.mode==='vehicle'&&p.id===this.driver()?.id)damage+=this.vehicleStats().weapon.bonus;
 if(e.npc?.race==='chitin'&&b.mode==='character')damage--;e.hp=Math.max(0,e.hp-Math.max(0,damage));this.log(display(p),`對${e.name}造成 ${Math.max(0,damage)} 傷害。`);
 };
 // Record the actual initiative sequence for the view, including a final lethal hit.
 // Recording is opt-in, does not roll dice, and is separate from the persisted state.
 for(const [method,side] of [['partyAction','party'],['enemyAction','enemies']]){const action=Game.prototype[method];Game.prototype[method]=function(unit,command){
  if(!this.recordVisuals||!this.s.battle||unit.hp<=0)return action.call(this,unit,command);
  this.visualSteps??=[];if(!this.visualSteps.length)this.visualStart=structuredClone(this.s);
  const b=this.s.battle,before=battleFrame(this.s,b),lastLog=this.s.logs[0],stunned=side==='enemies'&&unit.stun>0;
  const power=command?.type==='psi'?learned(unit).find(p=>p.id===Number(command.power)):null;
  const kind=stunned?'stun':command?.type||'attack';
  const intended=command?.target||(side==='party'?b.enemies.find(e=>e.hp>0)?.id:null);
  this.actionTarget=null;const result=action.call(this,unit,command),after=battleFrame(this.s,b),effects=frameEffects(before,after);
  const label=this.s.logs[0]!==lastLog?this.s.logs[0].text:stunned?'暫時無法行動。':'採取行動。';
  this.visualSteps.push({side,actor:unit.id,name:side==='party'?display(unit):unit.name,kind,power:power?.type,powerName:power?.name,visual:actionVisual(unit,command,{...b,vehicleGun:this.s.vehicle.mods.includes('gun'),vehicleStyle:this.vehicleStats().weapon.style},side,this.s.driver),ranged:b.mode==='vehicle'||(side==='party'&&!!ITEMS[unit.gear.武器]?.ranged),target:this.actionTarget||intended,effects,after,label});
  return result;
 };}
 // Inventory changes cannot bypass the turn or move characters out of a moving car.
 for(const method of ['dismiss','equip','useMedicine','replaceVehicle','recruit']){const original=Game.prototype[method];Game.prototype[method]=function(...args){if(!['ready','event'].includes(this.s.mode))return false;return original.apply(this,args)}}
}
