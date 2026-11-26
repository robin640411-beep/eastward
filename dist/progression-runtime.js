import {GROWTH} from './progression-catalog.js';
import {regionIndex,totalProgressFor} from './route-runtime.js';
import {enemyAttackStyle} from './battle-presentation.js';
import {appendMessage} from './automatic-journey.js';
import {partyLabel,rollBattleAuthorQuip} from './storybook.js';
import {xpToNext,XP_REWARDS,tierBossDefinition,milestoneBossPlan} from './xp-boss-catalog.js';
export const MAX_LEVEL=18;

export function bossDefinition(s){
 if(!s)return null;
 const plan=s.bossPlan;
 if(plan?.finaleTier==='mid'&&plan.finaleBossId){
  const mid=tierBossDefinition(plan.finaleBossId);
  if(mid){
   const sc=plan.finaleScale||1;
   return {
    ...mid,
    hp:Math.round(mid.hp*sc),
    attack:Math.round(mid.attack*sc),
    defense:Math.round(mid.defense*sc),
    rumors:[`聽說在東方入口擋路的是一頭叫「${mid.name}」的狠角色，沒點裝備千萬別硬闖。`],
    companion:[[`快到終點了，你聽過「${mid.name}」的名號嗎？`,'管他多硬，我們開了幾千公里可不是來掉頭的。']]
   };
  }
 }
 return GROWTH.bosses.find(b=>b.id===s.finalBoss?.id)||GROWTH.bosses[0];
}

export const ENEMY_PSI_RACE={
 raider:'human',soldier:'alien',sentinel:'alien',mutant:'mutant',
 infected:'mycelial',nest:'mycelial',swarm:'chitin',brute:'chitin',
 crawler:'amphibian',hound:'uplift',lurker:'mimic',parasite:'symbiote',
 wing:'lumen',drone:'synth',turret:'synth',worker:'synth',
 sniper:'human',pyro:'mutant',mech_hound:'synth',spore_giant:'mycelial',
 crystal_golem:'crystal',harvester:'synth',mire_toad:'amphibian',
 sand_worm:'chitin',wraith:'lumen',biker:'human'
};
export const BOSS_PSI_RACE={
 overseer:'alien',broodmother:'mycelial',zero_core:'synth',
 graft_colossus:'mutant',fallen_angel:'crystal',
 mini_highway_baron:'human',mini_spore_warden:'mycelial',mini_drone_matriarch:'synth',
 mini_sand_leviathan:'chitin',mini_bounty_marshal:'human',
 mid_siege_walker:'synth',mid_blood_warlord:'human',mid_crystal_archon:'crystal',
 mid_plague_behemoth:'mutant',mid_orbital_inquisitor:'alien'
};

const clampLevel=n=>Math.max(1,Math.min(MAX_LEVEL,n));
export function setLevel(p,level,keepXp=false){const next=clampLevel(level),delta=next-p.level;p.level=next;if(!keepXp)p.xp=0;
 for(const [key,max,step] of [['hp','maxHp',3],['st','maxSt',1],['esp','maxEsp',2]]){p[max]=Math.max(1,p[max]+delta*step);p[key]=Math.max(0,Math.min(p[max],p[key]+(key==='hp'&&p.hp<=0?0:delta*step)));}return delta;
}
export function normalizeProgression(s){if(!s)return;
 if(!s.finalBoss){let hash=2166136261;for(const c of 'eastward-boss:'+s.seed)hash=Math.imul(hash^c.charCodeAt(0),16777619);const roll=(hash>>>0)%100+1;s.finalBoss={id:GROWTH.bosses[Math.floor((roll-1)/20)].id,roll,encountered:false,defeated:false,hp:null};if(s.travel)delete s.travel.preview;}
 const km=s.totalKm||s.route?.totalKm||1000;
 if(!s.bossPlan||s.bossPlan.km!==km){s.bossPlan={...milestoneBossPlan(km,s.seed),km};}
 s.defeatedMilestones??=[];
 s.rewardedStops??=[];s.bossRumors??=[];
 for(const p of [...s.party,...(s.departed||[]),...(s.pending||[]).map(f=>f.actor),...(s.current?.npc?[s.current.npc]:[])]){
  if(typeof p.xp!=='number'||!Number.isFinite(p.xp))p.xp=0;
  if(p.level>MAX_LEVEL)setLevel(p,MAX_LEVEL);
 }
}

function buildBossEnemy(def,scale=1,savedHp=null){
 const hp=Math.round((def.hp||100)*scale);
 const psiRace=def.psiRace||BOSS_PSI_RACE[def.id]||'alien';
 const e={
  ...def,
  id:'e0',
  bossId:def.id,
  bossTier:def.tier||'final',
  hp:savedHp??hp,
  maxHp:hp,
  attack:Math.round((def.attack||12)*scale),
  defense:Math.round((def.defense||6)*scale),
  speed:def.speed||10,
  esp:def.esp??30,
  maxEsp:def.esp??30,
  psyche:def.psyche??12,
  psiRace,
  psiLevel:def.psiLevel??5,
  stun:0,
  scale:def.tier==='mini'?1.2:def.tier==='mid'?1.3:1.4
 };
 e.attackStyle=def.attackStyle||enemyAttackStyle(e);
 return e;
}

export function installProgression(Game,{display,learned}){
 Game.prototype.protagonistLevel=function(){return (this.s.party.find(p=>p.id===this.s.protagonistId)||this.s.party[0])?.level||1;};
 const person=Game.prototype.person;Game.prototype.person=function(...args){const p=person.apply(this,args);if(this.s.party.length){p.joinOffset=this.roll(3)-2;setLevel(p,this.protagonistLevel()+p.joinOffset);const hi=p.level>=7;p.gear={武器:this.pick(hi?['pistol','machete','arc_baton','shotgun']:['club','pistol','machete']),防具:this.pick(hi?['vest','hazmat','stealth_cloak','scrap_plate']:['coat','vest','hazmat']),配件:this.pick(hi?[null,'tools','charm','booster_boots','med_scanner','emp_module']:[null,'tools','charm','booster_boots'])};}return p;};
 const recruit=Game.prototype.recruit;Game.prototype.recruit=function(){const p=this.s.current?.npc,ok=recruit.call(this);if(ok){p.joinOffset??=Math.max(-1,Math.min(1,p.level-this.protagonistLevel()));setLevel(p,this.protagonistLevel()+p.joinOffset);}return ok;};

 Game.prototype.grantPartyXp=function(amount,reason=''){
  const gain=Math.max(0,Math.round(Number(amount)||0));
  if(!gain)return [];
  const leveled=[];
  for(const p of this.s.party){
   if(p.level>=MAX_LEVEL){p.xp=0;continue;}
   p.xp=(p.xp||0)+gain;
   const from=p.level,known=learned(p).map(x=>x.id);
   while(p.level<MAX_LEVEL){
    const need=xpToNext(p.level);
    if(p.xp<need)break;
    p.xp-=need;
    setLevel(p,p.level+1,true);
   }
   if(p.level>=MAX_LEVEL)p.xp=0;
   if(p.level>from){
    const powers=learned(p).filter(x=>!known.includes(x.id)).map(x=>x.name);
    leveled.push({id:p.id,name:display(p),from,to:p.level,powers});
    this.log('等級提升',`${display(p)}升至 Lv.${p.level}！${powers.length?'學會 '+powers.join('、')+'。':''}`);
   }
  }
  if(reason&&!leveled.length)this.log('旅途歷練',`${reason}：全隊獲得 ${gain} 點經驗。`);
  return leveled;
 };

 Game.prototype.completeStop=function(token='road:'+this.s.stop){
  if(this.s.rewardedStops.includes(token))return false;
  this.s.rewardedStops.push(token);
  const km=this.s.totalKm||this.s.route?.totalKm||1000;
  if(km>=3000){
   const people=this.grantPartyXp(XP_REWARDS.stop,'完成停靠');
   if(people.length)this.s.levelUp={stop:this.s.stop,token,people};
   return true;
  }
  const people=[];for(const p of this.s.party){const from=p.level,known=learned(p).map(x=>x.id);if(from>=MAX_LEVEL)continue;setLevel(p,from+1);const powers=learned(p).filter(x=>!known.includes(x.id)).map(x=>x.name);people.push({id:p.id,name:display(p),from,to:p.level,powers});this.log('等級提升',`${display(p)}升至 ${p.level} 級。${powers.length?'學會 '+powers.join('、')+'。':''}`);}
  this.s.levelUp={stop:this.s.stop,token,people};return true;
 };

 const finish=Game.prototype.finishEvent;Game.prototype.finishEvent=function(){if(this.s.current?.finalGate)return false;return finish.call(this);};
 const search=Game.prototype.searchStranded;Game.prototype.searchStranded=function(...args){const ok=search.apply(this,args);if(ok)this.s.searchRewardKey='search:'+(++this.s.serial);return ok;};
 const resolve=Game.prototype.resolveSearch;Game.prototype.resolveSearch=function(){const eligible=this.s.strandedSearch&&!this.s.resourceBlock,token=this.s.searchRewardKey;const result=resolve.call(this);if(eligible&&this.s.mode==='ready'&&token)this.completeStop(token);return result;};
 Game.prototype.recordBossRumor=function(p,text,source){const entry={bossId:bossDefinition(this.s)?.id||this.s.finalBoss.id,speaker:display(p),text,source,minutes:this.s.minutes};this.s.bossRumors.unshift(entry);this.s.bossRumors=this.s.bossRumors.slice(0,30);return text;};
 Game.prototype.bossRumor=function(p){if(!bossDefinition(this.s)||!this.oracle('boss_rumor').value)return '';const boss=bossDefinition(this.s),text=GROWTH.rumors.attitude_prefix[p.attitude]+this.pick(boss.rumors);this.recordBossRumor(p,text,'npc');return '\n'+text;};
 Game.prototype.companionBossExchange=function(lead,p){const boss=bossDefinition(this.s);let index=this.roll(boss.companion.length)-1;if(p.lastBossRumor===index)index=(index+1)%boss.companion.length;p.lastBossRumor=index;const [question,reply]=boss.companion[index];this.recordBossRumor(p,question+'\n'+reply,'companion');return {focus:'boss',bossId:boss.id,subject:p.id,lines:[{speaker:display(lead),personId:lead.id,text:question},{speaker:display(p),personId:p.id,text:reply}]};};

 Game.prototype.beginMilestoneBoss=function(m){
  const def=tierBossDefinition(m.bossId);
  if(!def)return false;
  const key=`${m.tier}:${m.progress}`,label=m.tier==='mid'?'中 BOSS 關卡':'小 BOSS 攔截';
  const desc=def.authorQuip?`${def.description}\n${def.authorQuip}`:def.description;
  this.s.current={
   instance:++this.s.serial,
   milestoneBoss:{...m,key},
   milestoneBossId:def.id,
   event:{id:'milestone_'+def.id,title:`${label} · ${def.name}`,text:desc,options:[]},
   resolved:false
  };
  this.s.mode='event';
  this.beginCombat('character','milestoneBoss');
  return true;
 };

 const origNextEvent=Game.prototype.nextEvent;
 Game.prototype.nextEvent=function(){
  const frame=this.s.frames?.at(-1);
  if(frame?.kind==='road'&&this.s.bossPlan?.milestones?.length){
   const nextM=this.s.bossPlan.milestones.find(m=>m.progress<=this.s.progress&&!this.s.defeatedMilestones.includes(`${m.tier}:${m.progress}`));
   if(nextM){
    frame.count++;
    this.beginMilestoneBoss(nextM);
    return;
   }
  }
  return origNextEvent.call(this);
 };

 Game.prototype.beginFinale=function(){
  const boss=bossDefinition(this.s);
  this.s.finalBoss.encountered=true;
  const gateTitle=this.s.bossPlan?.finaleTier==='mid'?`終點關卡（中 BOSS）· ${boss.name}`:`樂園之前（最終 BOSS）· ${boss.name}`;
  this.s.current={instance:++this.s.serial,finalGate:true,milestoneBossId:boss.id,event:{id:'final_gate',title:gateTitle,text:boss.description,options:[]},resolved:false};
  this.s.frames=[];this.s.mode='event';
  this.beginCombat('character','finalBoss');
 };

 const begin=Game.prototype.beginCombat;Game.prototype.beginCombat=function(mode='character',category=null,npc=null){
  begin.call(this,mode,category,npc);
  const b=this.s.battle;if(!b)return;
  if(category==='finalBoss'){
   const boss=bossDefinition(this.s);
   b.finalBoss=true;b.bossTier=this.s.bossPlan?.finaleTier||'final';b.resume='event';
   b.enemies=[buildBossEnemy(boss,1,this.s.finalBoss.hp)];
   this.s.notice=boss.description;
  }else if(category==='milestoneBoss'){
   const m=this.s.current?.milestoneBoss,def=m&&tierBossDefinition(m.bossId);
   if(def){
    b.milestoneBoss=m;b.bossTier=m.tier;b.resume='event';
    b.enemies=[buildBossEnemy(def,m.scale||1,null)];
    this.s.notice=def.description;
   }
  }
  const quip=rollBattleAuthorQuip(this.s,'start');if(quip)appendMessage(this.s,'作者吐槽',quip);
 };

 const choose=Game.prototype.choose;Game.prototype.choose=function(id){if(this.s.mode==='event'&&this.s.current?.finalGate&&id==='challenge'){this.beginFinale();return true;}return choose.call(this,id);};

 const endCombat=Game.prototype.finishCombat;Game.prototype.finishCombat=function(win){
  const b=this.s.battle;if(!b)return;
  const final=b.finalBoss,gate=this.s.current?.finalGate,milestone=b.milestoneBoss,enemyCount=b.enemies?.length||1;
  if(final){
   this.s.finalBoss.hp=Math.max(0,b.enemies[0].hp);
   if(win&&b.enemies.every(e=>e.hp<=0)){
    this.s.finalBoss.defeated=true;
    endCombat.call(this,win);
    if(this.s.mode!=='ending'){
     if((this.s.totalKm||1000)>=3000)this.grantPartyXp(b.bossTier==='mid'?XP_REWARDS.midBoss:XP_REWARDS.finalBoss,'擊敗終點守門者');
     this.completeStop('final');
     this.end(true,`${partyLabel(this.s)}越過了${bossDefinition(this.s).name}倒下的地方。道路盡頭，樹蔭與清水迎接著活下來的旅人，樂園終於不再只是傳聞。`);
    }
    return;
   }
  }
  endCombat.call(this,win);
  if(win&&milestone&&this.s.mode!=='ending'){
   if(!this.s.defeatedMilestones.includes(milestone.key))this.s.defeatedMilestones.push(milestone.key);
   const xp=milestone.tier==='mid'?XP_REWARDS.midBoss:XP_REWARDS.miniBoss;
   this.grantPartyXp(xp,milestone.tier==='mid'?'擊敗中 BOSS':'擊敗小 BOSS');
   this.add('scrap',milestone.tier==='mid'?6:4);
   this.add('fuel',milestone.tier==='mid'?5:3);
   this.tell(`擊敗了攔路的「${tierBossDefinition(milestone.bossId)?.name||'強敵'}」！戰利品：廢料 +${milestone.tier==='mid'?6:4}、汽油 +${milestone.tier==='mid'?5:3}，全隊獲得 ${xp} 經驗！`);
  }else if(win&&!final&&!milestone&&this.s.mode!=='ending'&&(this.s.totalKm||1000)>=3000){
   const xp=XP_REWARDS.combatBase+enemyCount*XP_REWARDS.combatPerEnemy;
   this.grantPartyXp(xp,'戰鬥勝利');
  }
  if(gate&&this.s.mode!=='ending'){
   this.s.mode='event';this.s.current.resolved=false;
   this.s.current.event.options=[{id:'challenge',label:'重新迎戰 '+bossDefinition(this.s).name,requires:[],effects:[]}];
   this.s.notice=`${partyLabel(this.s)}暫時退回車旁喘口氣。入口仍被堵死，得先整理好裝備與隊伍再上。`;
  }
 };
}

export function regionEnemyPool(s){
 const km=s?.totalKm||s?.route?.totalKm||1000;
 if(km>=3000){
  // Scale ordinary enemies smoothly by actual kilometres travelled: +1 tier every 1,000 km (up to Tier 10 at 9,000-10,000 km).
  const kmTraveled=Math.max(0,(s.progress||1)-1)*10;
  const idx=Math.max(0,Math.min(GROWTH.regions.length-1,Math.floor(kmTraveled/1000)));
  return GROWTH.regions[idx];
 }
 return GROWTH.regions[regionIndex(s.progress,GROWTH.regions.length)];
}

export function makeRegionalEnemies(game,mode,npc,helpers,category=null){const {clone,display}=helpers,region=regionEnemyPool(game.s),count=npc?1:game.oracle('enemy_group_size').value;
 const candidates=category==='machine'?region.enemies.filter(k=>game.d.assets.enemies[k].machine):region.enemies;const hour=Math.floor(game.s.minutes/60)%24,night=hour<5||hour>=18,preferred=night?['crawler','lurker','parasite','swarm','drone']:['soldier','worker','sentinel','hound','turret'];const pool=[...candidates,...candidates.filter(k=>preferred.includes(k))];
 return Array.from({length:count},(_,i)=>{const key=npc?'raider':game.pick(pool),art=game.d.assets.enemies[key],heavy=['brute','nest','sentinel'].includes(key),hp=region.health+(heavy?5:0);
  const psiRace=npc?npc.race:(ENEMY_PSI_RACE[key]||'alien'),esp=npc?(npc.esp??10):(6+region.region*2),psyche=npc?game.stat(npc,'psyche'):(3+Math.floor(region.region*0.9));
  const e={id:'e'+i,key,name:npc?display(npc):art.name,hp,maxHp:hp,attack:region.attack+(heavy?1:0),defense:region.defense,speed:region.speed,esp,maxEsp:esp,psyche,psiRace,psiLevel:npc?npc.level:Math.min(5,1+Math.floor(region.region/2)*2),scale:region.body_scale,region:region.region,machine:art.machine,stun:0,npc:npc?clone(npc):null};
  if(mode==='vehicle'){const vArmor={compact:0,sedan:1,pickup:2,van:2,rover:3,ambulance:3,bus:4,armored:5};e.vehicle=game.pick(Object.keys(game.d.assets.vehicles));e.hasWeapon=['armored','bus','rover'].includes(e.vehicle)||e.attack>=7;e.armor=(vArmor[e.vehicle]??1)+Math.floor((region.region-1)/3);e.defense=e.armor;e.name='敵方'+game.d.assets.vehicles[e.vehicle].name+' · '+art.name;e.hp=e.maxHp=hp+8;}
  if(npc&&mode==='character')Object.assign(e,{hp:npc.hp,maxHp:npc.maxHp,attack:game.stat(npc,'attack'),defense:game.stat(npc,'defense'),speed:game.stat(npc,'speed'),scale:1});e.attackStyle=mode==='vehicle'?(e.hasWeapon?(['armored','bus'].includes(e.vehicle)?'cannon':'burst_fire'):'ram'):enemyAttackStyle(e,mode);return e;});
}
