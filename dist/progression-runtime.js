import {GROWTH} from './progression-catalog.js';
import {regionIndex,totalProgressFor} from './route-runtime.js';
import {enemyAttackStyle} from './battle-presentation.js';
import {appendMessage} from './automatic-journey.js';
import {partyLabel,rollBattleAuthorQuip} from './storybook.js';
export const MAX_LEVEL=18;
export const bossDefinition=s=>GROWTH.bosses.find(b=>b.id===s.finalBoss?.id);

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
 graft_colossus:'mutant',fallen_angel:'crystal'
};

const clampLevel=n=>Math.max(1,Math.min(MAX_LEVEL,n));
export function setLevel(p,level){const next=clampLevel(level),delta=next-p.level;p.level=next;p.xp=0;
 for(const [key,max,step] of [['hp','maxHp',3],['st','maxSt',1],['esp','maxEsp',2]]){p[max]=Math.max(1,p[max]+delta*step);p[key]=Math.max(0,Math.min(p[max],p[key]+(key==='hp'&&p.hp<=0?0:delta*step)));}return delta;
}
export function normalizeProgression(s){if(!s)return;
 if(!s.finalBoss){let hash=2166136261;for(const c of 'eastward-boss:'+s.seed)hash=Math.imul(hash^c.charCodeAt(0),16777619);const roll=(hash>>>0)%100+1;s.finalBoss={id:GROWTH.bosses[Math.floor((roll-1)/20)].id,roll,encountered:false,defeated:false,hp:null};if(s.travel)delete s.travel.preview;}
 s.rewardedStops??=[];s.bossRumors??=[];
 for(const p of [...s.party,...(s.departed||[]),...(s.pending||[]).map(f=>f.actor),...(s.current?.npc?[s.current.npc]:[])])if(p.level>MAX_LEVEL)setLevel(p,MAX_LEVEL);
}
export function installProgression(Game,{display,learned}){
 Game.prototype.protagonistLevel=function(){return (this.s.party.find(p=>p.id===this.s.protagonistId)||this.s.party[0])?.level||1;};
 const person=Game.prototype.person;Game.prototype.person=function(...args){const p=person.apply(this,args);if(this.s.party.length){p.joinOffset=this.roll(3)-2;setLevel(p,this.protagonistLevel()+p.joinOffset);const hi=p.level>=7;p.gear={武器:this.pick(hi?['pistol','machete','arc_baton','shotgun']:['club','pistol','machete']),防具:this.pick(hi?['vest','hazmat','stealth_cloak','scrap_plate']:['coat','vest','hazmat']),配件:this.pick(hi?[null,'tools','charm','booster_boots','med_scanner','emp_module']:[null,'tools','charm','booster_boots'])};}return p;};
 const recruit=Game.prototype.recruit;Game.prototype.recruit=function(){const p=this.s.current?.npc,ok=recruit.call(this);if(ok){p.joinOffset??=Math.max(-1,Math.min(1,p.level-this.protagonistLevel()));setLevel(p,this.protagonistLevel()+p.joinOffset);}return ok;};
 Game.prototype.completeStop=function(token='road:'+this.s.stop){if(this.s.rewardedStops.includes(token))return false;this.s.rewardedStops.push(token);
 const people=[];for(const p of this.s.party){const from=p.level,known=learned(p).map(x=>x.id);if(from>=MAX_LEVEL)continue;setLevel(p,from+1);const powers=learned(p).filter(x=>!known.includes(x.id)).map(x=>x.name);people.push({id:p.id,name:display(p),from,to:p.level,powers});this.log('等級提升',`${display(p)}升至 ${p.level} 級。${powers.length?'學會 '+powers.join('、')+'。':''}`);}
 this.s.levelUp={stop:this.s.stop,token,people};return true;
 };
 const finish=Game.prototype.finishEvent;Game.prototype.finishEvent=function(){if(this.s.current?.finalGate)return false;return finish.call(this);};
 const search=Game.prototype.searchStranded;Game.prototype.searchStranded=function(...args){const ok=search.apply(this,args);if(ok)this.s.searchRewardKey='search:'+(++this.s.serial);return ok;};
 const resolve=Game.prototype.resolveSearch;Game.prototype.resolveSearch=function(){const eligible=this.s.strandedSearch&&!this.s.resourceBlock,token=this.s.searchRewardKey;const result=resolve.call(this);if(eligible&&this.s.mode==='ready'&&token)this.completeStop(token);return result;};
 Game.prototype.recordBossRumor=function(p,text,source){const entry={bossId:this.s.finalBoss.id,speaker:display(p),text,source,minutes:this.s.minutes};this.s.bossRumors.unshift(entry);this.s.bossRumors=this.s.bossRumors.slice(0,30);return text;};
 Game.prototype.bossRumor=function(p){if(!bossDefinition(this.s)||!this.oracle('boss_rumor').value)return '';const boss=bossDefinition(this.s),text=GROWTH.rumors.attitude_prefix[p.attitude]+this.pick(boss.rumors);this.recordBossRumor(p,text,'npc');return '\n'+text;};
 Game.prototype.companionBossExchange=function(lead,p){const boss=bossDefinition(this.s);let index=this.roll(boss.companion.length)-1;if(p.lastBossRumor===index)index=(index+1)%boss.companion.length;p.lastBossRumor=index;const [question,reply]=boss.companion[index];this.recordBossRumor(p,question+'\n'+reply,'companion');return {focus:'boss',bossId:boss.id,subject:p.id,lines:[{speaker:display(lead),personId:lead.id,text:question},{speaker:display(p),personId:p.id,text:reply}]};};
 Game.prototype.beginFinale=function(){const boss=bossDefinition(this.s);this.s.finalBoss.encountered=true;this.s.current={instance:++this.s.serial,finalGate:true,event:{id:'final_gate',title:'樂園之前 · '+boss.name,text:boss.description,options:[]},resolved:false};this.s.frames=[];this.s.mode='event';this.beginCombat('character','finalBoss');};
 const begin=Game.prototype.beginCombat;Game.prototype.beginCombat=function(mode='character',category=null,npc=null){begin.call(this,mode,category,npc);const b=this.s.battle;if(!b)return;
  if(category==='finalBoss'){const boss=bossDefinition(this.s),psiRace=BOSS_PSI_RACE[boss.id]||'alien';b.finalBoss=true;b.resume='event';b.enemies=[{...boss,id:'e0',bossId:boss.id,hp:this.s.finalBoss.hp??boss.hp,maxHp:boss.hp,esp:30,maxEsp:30,psyche:12,psiRace,psiLevel:5,stun:0,scale:1.4}];b.enemies[0].attackStyle=enemyAttackStyle(b.enemies[0]);this.s.notice=boss.description;}
  const quip=rollBattleAuthorQuip(this.s,'start');if(quip)appendMessage(this.s,'作者吐槽',quip);
 };
 const choose=Game.prototype.choose;Game.prototype.choose=function(id){if(this.s.mode==='event'&&this.s.current?.finalGate&&id==='challenge'){this.beginFinale();return true;}return choose.call(this,id);};
 const endCombat=Game.prototype.finishCombat;Game.prototype.finishCombat=function(win){const b=this.s.battle;if(!b)return;const final=b.finalBoss,gate=this.s.current?.finalGate;
  if(final){this.s.finalBoss.hp=Math.max(0,b.enemies[0].hp);if(win&&b.enemies.every(e=>e.hp<=0)){this.s.finalBoss.defeated=true;endCombat.call(this,win);if(this.s.mode!=='ending'){this.completeStop('final');this.end(true,`${partyLabel(this.s)}越過了${bossDefinition(this.s).name}倒下的地方。道路盡頭，樹蔭與清水迎接著活下來的旅人，樂園終於不再只是傳聞。`);}return;}}
  endCombat.call(this,win);if(gate&&this.s.mode!=='ending'){this.s.mode='event';this.s.current.resolved=false;this.s.current.event.options=[{id:'challenge',label:'重新迎戰 '+bossDefinition(this.s).name,requires:[],effects:[]}];this.s.notice=`${partyLabel(this.s)}暫時退回車旁喘口氣。入口仍被堵死，得先整理好裝備與隊伍再上。`;}
 };
}
export function regionEnemyPool(s){const maxProg=totalProgressFor(s),normProg=1+(Math.max(0,(s.progress||1)-1)/Math.max(1,maxProg-1))*99;return GROWTH.regions[regionIndex(normProg,GROWTH.regions.length)];}
export function makeRegionalEnemies(game,mode,npc,helpers,category=null){const {clone,display}=helpers,region=regionEnemyPool(game.s),count=npc?1:game.oracle('enemy_group_size').value;
 const candidates=category==='machine'?region.enemies.filter(k=>game.d.assets.enemies[k].machine):region.enemies;const hour=Math.floor(game.s.minutes/60)%24,night=hour<5||hour>=18,preferred=night?['crawler','lurker','parasite','swarm','drone']:['soldier','worker','sentinel','hound','turret'];const pool=[...candidates,...candidates.filter(k=>preferred.includes(k))];
 return Array.from({length:count},(_,i)=>{const key=npc?'raider':game.pick(pool),art=game.d.assets.enemies[key],heavy=['brute','nest','sentinel'].includes(key),hp=region.health+(heavy?5:0);
  const psiRace=npc?npc.race:(ENEMY_PSI_RACE[key]||'alien'),esp=npc?(npc.esp??10):(6+region.region*2),psyche=npc?game.stat(npc,'psyche'):(3+Math.floor(region.region*0.9));
  const e={id:'e'+i,key,name:npc?display(npc):art.name,hp,maxHp:hp,attack:region.attack+(heavy?1:0),defense:region.defense,speed:region.speed,esp,maxEsp:esp,psyche,psiRace,psiLevel:npc?npc.level:Math.min(5,1+Math.floor(region.region/2)*2),scale:region.body_scale,region:region.region,machine:art.machine,stun:0,npc:npc?clone(npc):null};
  if(mode==='vehicle'){const vArmor={compact:0,sedan:1,pickup:2,van:2,rover:3,ambulance:3,bus:4,armored:5};e.vehicle=game.pick(Object.keys(game.d.assets.vehicles));e.hasWeapon=['armored','bus','rover'].includes(e.vehicle)||e.attack>=7;e.armor=(vArmor[e.vehicle]??1)+Math.floor((region.region-1)/3);e.defense=e.armor;e.name='敵方'+game.d.assets.vehicles[e.vehicle].name+' · '+art.name;e.hp=e.maxHp=hp+8;}
  if(npc&&mode==='character')Object.assign(e,{hp:npc.hp,maxHp:npc.maxHp,attack:game.stat(npc,'attack'),defense:game.stat(npc,'defense'),speed:game.stat(npc,'speed'),scale:1});e.attackStyle=mode==='vehicle'?(e.hasWeapon?(['armored','bus'].includes(e.vehicle)?'cannon':'burst_fire'):'ram'):enemyAttackStyle(e,mode);return e;});
}
