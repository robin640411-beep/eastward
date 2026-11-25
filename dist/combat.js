import {battleFrame,frameEffects} from './motion-model.js';
import {actionVisual} from './battle-presentation.js';
import {appendMessage} from './automatic-journey.js';
import {rollBattleAuthorQuip} from './storybook.js';
const hasVehicleWeapon=vStats=>!!(vStats?.weapon&&vStats.weapon.bonus>0&&vStats.weapon.style!=='ram');
// Each awake traveller commits one command. In vehicle combat, the vehicle itself acts once per round.
export function installCombat(Game,{learned,POWERS,ITEMS,clamp,display}) {
 const battleRoster=game=>game.s.battle?.mode==='vehicle'?(game.driver()?[game.driver().id]:game.alive().slice(0,1).map(p=>p.id)):game.alive().filter(p=>!p.asleep).map(p=>p.id);
 const begin=Game.prototype.beginCombat;
 Game.prototype.beginCombat=function(...args){begin.apply(this,args);if(this.s.battle){this.s.battle.orders={};this.s.battle.guardIds=[];this.s.battle.roster=battleRoster(this);this.s.battle.startMsgId=this.s.messageSerial||0;}};
 Game.prototype.commandActor=function(){const b=this.s.battle;if(!b)return null;b.orders??={};b.roster??=battleRoster(this);return this.alive().find(p=>b.roster.includes(p.id)&&!p.asleep&&!b.orders[p.id])};

 Game.prototype.applyVehicleLoss=function(){
  const v=this.s.vehicle,vStats=this.vehicleStats(),losses=[];
  const gunIdx=v.mods.indexOf('gun');
  if(gunIdx>=0||hasVehicleWeapon(vStats))losses.push('weapon');
  const armorIdx=v.mods.indexOf('armor');
  if(armorIdx>=0||vStats.armor>0)losses.push('armor');
  if(this.availableFuel()>1)losses.push('fuel');
  if(!losses.length||this.roll()>35)return '';
  const pick=this.pick(losses);
  if(pick==='weapon'){
   if(gunIdx>=0){v.mods.splice(gunIdx,1);return ' 車載機槍被打飛了！';}
   v.weaponDamaged=true;return ' 車載武器受損失效，只能改為車體衝撞！';
  }
  if(pick==='armor'){
   if(armorIdx>=0){v.mods.splice(armorIdx,1);return ' 外掛裝甲板被轟落一塊！';}
   v.armorDamaged=(v.armorDamaged||0)+1;return ' 車身裝甲凹陷剝落（裝甲 −1）！';
  }
  const leak=Math.min(this.availableFuel()-1,2+(this.roll(3)-1));
  this.add('fuel',-leak);
  return ` 油箱被擊穿，漏出 ${leak} 點汽油！`;
 };

 Game.prototype.enemyAvailablePowers=function(e){
  const race=e?.npc?.race||e?.psiRace;
  if(!race||!POWERS[race]||!(e.esp>0))return [];
  const lvl=e.psiLevel||e.npc?.level||1;
  const b=this.s.battle;
  return POWERS[race]
   .map(([name,type],i)=>({id:i,name,type,level:[1,3,5][i],cost:[3,4,7][i],psiRace:race}))
   .filter(pw=>lvl>=pw.level&&e.esp>=pw.cost)
   .filter(pw=>pw.type!=='heal'||b?.enemies?.some(x=>x.hp>0&&x.hp<=x.maxHp*0.75))
   .filter(pw=>pw.type!=='shield'||!b?.enemyShield);
 };

 Game.prototype.enemyCastPsi=function(e,power){
  const b=this.s.battle;if(!b||!power||e.esp<power.cost)return false;
  e.esp-=power.cost;
  const psyche=e.psyche||(e.npc?this.stat(e.npc,'psyche'):5);
  this.lastEnemyCommand={type:'psi',power:power.id,psiRace:power.psiRace||e.npc?.race||e.psiRace||'alien'};
  b.roundEnemyPsi=true;
  if(power.type==='heal'){
   const ally=b.enemies.filter(x=>x.hp>0).sort((a,z)=>a.hp/a.maxHp-z.hp/z.maxHp)[0]||e;
   this.actionTarget=ally.id;
   const gain=Math.min(ally.maxHp-ally.hp,psyche+5);
   ally.hp+=gain;
   this.log(e.name,`施放超能力「${power.name}」，${ally.id===e.id?'自身':ally.name}恢復 ${gain} 點生命。`);
  }else if(power.type==='shield'){
   this.actionTarget=e.id;
   b.enemyShield=2;
   this.log(e.name,`施放超能力「${power.name}」，展開敵方精神屏障！`);
  }else if(power.type==='burst'){
   const targets=this.alive();
   this.actionTarget=targets[0]?.id||null;
   this.log(e.name,`施放超能力「${power.name}」，精神風暴席捲全隊！`);
   for(const q of targets){
    const dmg=Math.max(1,Math.floor(psyche*0.85)+1-Math.floor(this.stat(q,'psyche')/2)-(b.shield||0));
    this.hurt(q,dmg,['psi','attack']);
   }
  }else{
   const target=this.pick(this.alive());if(!target)return true;
   this.actionTarget=target.id;
   const dmg=Math.max(1,psyche+(power.type==='strike'?2:0)-Math.floor(this.stat(target,'psyche')/2)-(b.shield||0));
   if(power.type==='stun'){target.st=Math.max(0,target.st-2);target.startled=true;}
   this.log(e.name,`施放超能力「${power.name}」${power.type==='stun'?'震懾心神':''}！`);
   this.hurt(target,dmg,['psi','attack']);
  }
  this.checkAlive();
  return true;
 };

 Game.prototype.enemyAction=function(e){const b=this.s.battle;if(!b||e.hp<=0)return;if(e.stun>0){e.stun--;return;}
  if(b.mode==='vehicle'){
   this.actionTarget='vehicle';
   const vStats=this.vehicleStats(),armor=vStats.armor/2,mech=this.alive().some(q=>q.profession==='mechanic')?1:0;
   const guarding=b.guardIds.includes(this.driver()?.id);
   const eHasWeapon=e.hasWeapon??(['armored','bus','rover'].includes(e.vehicle));
   e.attackStyle=eHasWeapon?(['armored','bus'].includes(e.vehicle)?'cannon':'burst_fire'):'ram';
   const damage=Math.max(1,e.attack-Math.floor(armor*2)-mech-(guarding?3:0));
   this.s.vehicle.hp=Math.max(0,this.s.vehicle.hp-damage);
   const lossMsg=this.applyVehicleLoss();
   if(eHasWeapon){
    this.log(e.name,`以車載武器開火！我方${vStats.name}受到 ${damage} 傷害。${lossMsg}`);
   }else{
    const recoil=Math.max(1,2+Math.floor(vStats.armor/2));
    e.hp=Math.max(0,e.hp-recoil);
    this.log(e.name,`沒有武裝，直接加速猛撞我方車身！我方受到 ${damage} 傷害，敵車也因互撞自損 ${recoil} 點。${lossMsg}`);
   }
  }
  else {
   // Enemies & bosses in character battles can unleash psychic powers when roll > threshold
   if(!b.sleepAttack&&(e.esp||0)>=3){
    const powers=this.enemyAvailablePowers(e);
    const threshold=e.bossId?52:68;
    if(powers.length&&this.roll()>threshold){
     const chosen=this.pick(powers);
     if(this.enemyCastPsi(e,chosen))return;
    }
   }
   const target=this.pick(this.alive());if(!target)return;this.actionTarget=target.id;let attack=e.attack;if(e.npc){const n=e.npc,ranged=ITEMS[n.gear.武器]?.ranged;if(this.roll()>90-(ranged&&n.flaw==='unsteady'?10:0)){b.roundMissed=true;this.log(e.name,'攻擊落空。');return;}attack+=(n.profession==='soldier'?1:0)-(n.flaw==='weak_grip'&&!ranged?1:0)-(n.flaw==='timid'&&b.round===1?1:0);if(n.profession==='hunter'&&!e.hunterUsed&&target.race!=='synth'){attack+=2;e.hunterUsed=true;}}let damage=Math.max(1,attack-Math.floor(this.stat(target,'defense')/2)-(b.guardIds.includes(target.id)?2:0)-(b.shield||0));if(target.profession==='guard'&&b.watchId===target.id&&!target.asleep&&!b.guardUsed.includes(target.id)){damage=Math.max(0,damage-3);b.guardUsed.push(target.id)}if(target.profession==='scout'&&(b.ambush||b.sleepAttack)&&!target.asleep&&b.round===1)damage=Math.max(0,damage-2);this.hurt(target,damage,['physical','attack']);}this.checkAlive();
 };
 Game.prototype.enemyTurn=function(){const b=this.s.battle;if(!b)return;b.guardIds??=[];for(const e of b.enemies){this.enemyAction(e);if(this.s.mode==='ending')break;}if(this.s.battle){b.roster=battleRoster(this);b.orders={};}};
 Game.prototype.combatRound=function(command){const b=this.s.battle;if(!b||this.s.mode!=='combat')return false;const p=this.commandActor();if(p){
  if(!['attack','defend','escape','medicine','psi'].includes(command.type))return false;
  if(command.type==='psi'){const pow=learned(p).find(x=>x.id===Number(command.power));if(!pow||p.esp<pow.cost)return false;}
  if(command.type==='medicine'&&this.s.resources.medicine<=Object.values(b.orders).filter(c=>c.type==='medicine').length)return false;
  const allies=['medicine'].includes(command.type)||(command.type==='psi'&&learned(p).find(x=>x.id===Number(command.power))?.type==='heal');
  if(command.target&&!(allies?this.alive():b.enemies.filter(e=>e.hp>0)).some(q=>q.id===command.target))return false;
  b.orders[p.id]={...command};if(this.commandActor())return true;
 }
 b.guardIds=[];b.roundEnemyPsi=false;b.roundMissed=false;
 const turns=[...this.alive().filter(q=>b.orders[q.id]).map(q=>({unit:q,ally:true,speed:this.stat(q,'speed')})),...b.enemies.filter(e=>e.hp>0).map(e=>({unit:e,ally:false,speed:e.speed}))].map((t,i)=>({...t,tie:this.roll(100),index:i})).sort((a,z)=>z.speed-a.speed||z.tie-a.tie||a.index-z.index);
 for(const t of turns){if(t.unit.hp<=0)continue;if(t.ally){if(t.unit.asleep)continue;this.partyAction(t.unit,b.orders[t.unit.id]);}else this.enemyAction(t.unit);
  if(this.s.battle!==b||this.s.mode==='ending')return true;
  if(b.enemies.every(e=>e.hp<=0)){
   const region=Math.max(1,Math.min(10,Math.floor(((this.s.progress||1)-1)/10)+1));
   const scav=this.alive().some(q=>q.profession==='scavenger')?1:0;
   const scrap=2+Math.floor(region/3)+scav;
   this.add('scrap',scrap);
   let loot=`戰鬥勝利：我方擊敗了所有敵人，取得 ${scrap} 份廢料。`;
   const dropRoll=this.roll();
   if(dropRoll<=25){
    if(dropRoll<=10){this.add('medicine',1);loot+=' 另搜出 1 份藥品。';}
    else if(dropRoll<=18){const f=3+Math.floor(region/4);this.add('fuel',f);loot+=` 另抽出 ${f} 點汽油。`;}
    else{const eq=this.oracle('equipment').value;if(ITEMS[eq]){this.s.inventory.push(eq);loot+=` 另繳獲裝備：${ITEMS[eq].name}！`;}}
   }
   const winQuip=rollBattleAuthorQuip(this.s,'win');
   if(winQuip)loot+=`\n${winQuip}`;
   this.log('戰鬥結束（我方勝利）',loot);
   this.s.notice=loot;
   this.finishCombat(true);return true;
  }
  if(b.mode==='vehicle'&&this.s.vehicle.hp<=0){
   const msg='車戰失利：我方車輛失去行駛能力，敵方車輛趁機揚長而去。';
   this.log('戰鬥結束（車輛受損）',msg);
   this.s.notice=msg;
   this.finishCombat(false);return true;
  }
 }
 this.s.notice=this.s.logs.slice(0,Math.min(turns.length,4)).reverse().map(l=>l.title+'：'+l.text).join('\n');
 const lowHp=this.alive().some(q=>q.hp<=Math.max(6,Math.floor(q.maxHp*0.28)));
 const roundQuip=rollBattleAuthorQuip(this.s,'round',{enemyPsi:b.roundEnemyPsi,missed:b.roundMissed,lowHp});
 if(roundQuip)appendMessage(this.s,'作者吐槽',roundQuip);
 if(b.enemyShield>0)b.enemyShield--;
 if(b.round%3===0)this.s.minutes+=5;b.round++;b.orders={};b.roster=battleRoster(this);return true;
 };
 Game.prototype.partyAction=function(p,c){const b=this.s.battle;let e=b.enemies.find(e=>e.id===c.target&&e.hp>0)||b.enemies.find(e=>e.hp>0);if(!e)return;
 const vStats=this.vehicleStats(),isVeh=b.mode==='vehicle',actorLabel=isVeh?vStats.name:display(p);
 const target=this.alive().find(q=>q.id===c.target)||this.alive().slice().sort((a,z)=>a.hp/a.maxHp-z.hp/z.maxHp)[0];this.actionTarget=(c.type==='medicine'||c.type==='psi'&&learned(p).find(x=>x.id===Number(c.power))?.type==='heal')?target?.id:e.id;
 if(c.type==='defend'){b.guardIds.push(p.id);this.log(actorLabel,isVeh?'急打方向盤閃避甩尾，降低下一次受擊傷害。':'採取防禦姿態。');return;}
 const gearSum=key=>Object.values(p.gear||{}).reduce((s,id)=>s+(ITEMS[id]?.[key]||0),0);
 if(c.type==='escape'){const chance=clamp(45+this.stat(p,'speed')*2+(b.mode==='character'&&p.race==='mimic'?15:0)+(b.mode==='character'?gearSum('escapeBonus'):0)-(b.mode==='character'&&p.flaw==='noisy'?10:0),5,95);if(this.roll()<=chance){const foes=b.enemies.filter(x=>x.hp>0).map(x=>x.name).join('、')||'敵人';const escQuip=rollBattleAuthorQuip(this.s,'escape');const msg=isVeh?`我方撤離：${vStats.name}猛踩油門甩開了${foes}，成功脫離追逐！`:`我方撤離：${display(p)}抓準空檔帶著隊伍成功逃離戰鬥，甩開了${foes}。`;this.log('戰鬥結束（我方逃跑）',msg);this.s.notice=msg+(escQuip?'\n'+escQuip:'');if(escQuip)appendMessage(this.s,'作者吐槽',escQuip);this.finishCombat(false);}else this.log(actorLabel,isVeh?'試圖加速甩開敵車，但被對方死死咬住（逃跑失敗）！':'試圖逃離戰鬥，但被敵人截住了退路（逃跑失敗）！');return;}
 if(c.type==='medicine'){if(this.s.resources.medicine<1)return;this.add('medicine',-1);target.hp=clamp(target.hp+8+(p.profession==='medic'?2:0)+(p.profession==='chemist'?1:0)+gearSum('healBonus')-(target.flaw==='slow_healing'?1:0),0,target.maxHp);this.log(display(p),`為${display(target)}使用藥品。`);return;}
 const shieldCut=b.enemyShield?1:0;
 if(c.type==='psi'){const power=learned(p).find(x=>x.id===Number(c.power));if(!power||p.esp<power.cost)return;p.esp-=power.cost;const psiBonus=p.profession==='researcher'?1:0;
  if(power.type==='heal'){target.hp=clamp(target.hp+this.stat(p,'psyche')+5+psiBonus,0,target.maxHp);this.log(power.name,display(target)+'恢復生命。');}
  else if(power.type==='shield'){b.shield=3;this.log(power.name,'展開隊伍屏障。');}
  else {for(const enemy of power.type==='burst'?b.enemies.filter(x=>x.hp>0):[e]){const d=Math.max(1,this.stat(p,'psyche')+(power.type==='burst'?3:2)+psiBonus-shieldCut);enemy.hp=Math.max(0,enemy.hp-d);if(power.type==='stun')enemy.stun=1;}this.log(power.name,'超能力擊中了敵人。');}return;
 }
 // Vehicle combat: vehicle fires mounted weapon OR rams enemy car (trading armor/hull)!
 if(isVeh){
  const armed=hasVehicleWeapon(vStats);
  const enemyArmor=e.armor??e.defense??0;
  if(armed){
   if(this.roll()>92){b.roundMissed=true;this.log(vStats.name,`${vStats.weapon.name}開火落空！`);return;}
   const dmg=Math.max(2,vStats.weapon.bonus+Math.floor(this.stat(p,'attack')/2)-Math.floor(enemyArmor/2));
   e.hp=Math.max(0,e.hp-dmg);
   let subMsg='';
   if(e.hp>0&&this.roll()<=30){
    if(e.hasWeapon){e.hasWeapon=false;e.attackStyle='ram';subMsg=' 擊毀了敵車武裝，對方只能改用衝撞！';}
    else if(enemyArmor>0){e.armor=Math.max(0,enemyArmor-1);e.defense=e.armor;subMsg=' 打穿敵車裝甲（敵方裝甲 −1）！';}
    else{e.hp=Math.max(0,e.hp-2);subMsg=' 擊中敵車油箱引發爆燃（額外 −2）！';}
   }
   this.log(vStats.name,`以${vStats.weapon.name}開火，對${e.name}造成 ${dmg} 傷害。${subMsg}`);
  }else{
   const dmg=Math.max(2,3+vStats.armor+Math.floor(this.stat(p,'attack')/3)-Math.floor(enemyArmor/2));
   e.hp=Math.max(0,e.hp-dmg);
   if(e.hp>0&&enemyArmor>0&&this.roll()<=35){e.armor=Math.max(0,enemyArmor-1);e.defense=e.armor;}
   const selfDmg=Math.max(1,2+Math.floor(enemyArmor/2)-Math.floor(vStats.armor/3));
   this.s.vehicle.hp=Math.max(0,this.s.vehicle.hp-selfDmg);
   let armorMsg='';
   if(vStats.armor>0&&this.roll()<=30){
    const idx=this.s.vehicle.mods.indexOf('armor');
    if(idx>=0){this.s.vehicle.mods.splice(idx,1);armorMsg=' 互撞震落一塊外掛裝甲板！';}
    else{this.s.vehicle.armorDamaged=(this.s.vehicle.armorDamaged||0)+1;armorMsg=' 互撞造成我方裝甲受損（裝甲 −1）！';}
   }
   this.log(vStats.name,`沒有車載武器，直接加速衝撞${e.name}！造成 ${dmg} 傷害，我方車體也因互撞受損 ${selfDmg} 點。${armorMsg}`);
  }
  return;
 }
 const ranged=!!ITEMS[p.gear.武器]?.ranged;if(this.roll()>90-(ranged&&p.flaw==='unsteady'?10:0)){b.roundMissed=true;this.log(display(p),'攻擊落空。');return;}
 const isMachine=!!(e.machine??this.d.assets.enemies[e.key]?.machine);
 const effDef=Math.max(0,e.defense-(p.profession==='demolition'&&(e.defense>=2||isMachine)?1:0));
 let damage=Math.max(1,this.stat(p,'attack')-effDef)+(p.profession==='soldier'?1:0)-(p.flaw==='weak_grip'&&!ranged?1:0)-(p.flaw==='timid'&&b.round===1?1:0)-(p.startled?1:0)-shieldCut;p.startled=false;
 if(isMachine)damage+=gearSum('vsMachine')+({engineer:2,hacker:2,electrician:1}[p.profession]||0);
 if(p.profession==='hunter'&&!b.usedHunter.includes(p.id)&&!isMachine){damage+=2;b.usedHunter.push(p.id)}
 if(e.npc?.race==='chitin')damage--;e.hp=Math.max(0,e.hp-Math.max(0,damage));this.log(display(p),`對${e.name}造成 ${Math.max(0,damage)} 傷害。`);
 };
 // Record the actual initiative sequence for the view, including enemy psychic powers & vehicle weapons/ramming.
 for(const [method,side] of [['partyAction','party'],['enemyAction','enemies']]){const action=Game.prototype[method];Game.prototype[method]=function(unit,command){
  if(!this.recordVisuals||!this.s.battle||unit.hp<=0)return action.call(this,unit,command);
  this.visualSteps??=[];if(!this.visualSteps.length)this.visualStart=structuredClone(this.s);
  const b=this.s.battle,before=battleFrame(this.s,b),lastLog=this.s.logs[0],stunned=side==='enemies'&&unit.stun>0;
  const vStats=this.vehicleStats(),armedBefore=hasVehicleWeapon(vStats);
  const intended=command?.target||(side==='party'?b.enemies.find(e=>e.hp>0)?.id:null);
  this.actionTarget=null;if(side==='enemies')this.lastEnemyCommand=null;
  const result=action.call(this,unit,command),after=battleFrame(this.s,b),effects=frameEffects(before,after);
  const effCmd=side==='enemies'?this.lastEnemyCommand:command;
  const psiTuple=effCmd?.type==='psi'?POWERS[effCmd.psiRace||unit.race]?.[Number(effCmd.power)]:null;
  const power=psiTuple?{name:psiTuple[0],type:psiTuple[1]}:null;
  const kind=stunned?'stun':effCmd?.type||'attack';
  const visualUnit=effCmd?.psiRace?{...unit,race:effCmd.psiRace}:unit;
  const label=this.s.logs[0]!==lastLog?this.s.logs[0].text:stunned?'暫時無法行動。':'採取行動。';
  const vehStyle=armedBefore?vStats.weapon.style:'ram';
  const stepName=side==='party'?(b.mode==='vehicle'?vStats.name:display(unit)):unit.name;
  this.visualSteps.push({side,actor:unit.id,name:stepName,kind,power:power?.type,powerName:power?.name,visual:actionVisual(visualUnit,effCmd,{...b,vehicleGun:armedBefore,vehicleStyle:vehStyle},side,this.s.driver),ranged:b.mode==='vehicle'?(side==='party'?armedBefore:unit.attackStyle!=='ram'):(side==='party'&&!!ITEMS[unit.gear.武器]?.ranged),target:this.actionTarget||intended,effects,after,label});
  return result;
 };}
 // Inventory changes cannot bypass the turn or move characters out of a moving car.
 for(const method of ['dismiss','equip','useMedicine','replaceVehicle','recruit']){const original=Game.prototype[method];Game.prototype[method]=function(...args){if(!['ready','event'].includes(this.s.mode))return false;return original.apply(this,args)}}
}
