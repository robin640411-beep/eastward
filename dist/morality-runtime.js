import {appendMessage} from './automatic-journey.js';
import {heroShortName,partyLabel,rollMoralityAuthorQuip} from './storybook.js';
import {personRaceName,personJobName} from './procedural-npc.js';

export function normalizeMorality(s){
 if(!s)return;
 if(typeof s.morality!=='number'||!Number.isFinite(s.morality))s.morality=0;
 s.morality=Math.max(-100,Math.min(100,Math.round(s.morality)));
}

export function isWanted(s){return (s?.morality??0)<=-30;}
export function isSaint(s){return (s?.morality??0)>=30;}
export function wantedStars(s){
 const m=s?.morality??0;
 if(m<=-60)return 3;
 if(m<=-45)return 2;
 if(m<=-30)return 1;
 return 0;
}

export function moralityLabel(m=0){
 if(m<=-60)return '頭號通緝犯 ★★★';
 if(m<=-45)return '公路通緝犯 ★★';
 if(m<=-30)return '通緝中 ★';
 if(m<=-10)return '惡名昭彰';
 if(m<10)return '無名過客';
 if(m<30)return '口碑良好';
 return '荒野聖人';
}

const BEG_TYPES=[
 {kind:'medicine',amount:1,label:'1 份藥品',line:'「咳咳……拜託，我這傷口一直發炎，能施捨 1 份藥品給我嗎？」'},
 {kind:'fuel',amount:4,label:'4 點汽油',line:'「車子跟發電機都徹底乾了……好心人，能施捨 4 點汽油嗎？」'},
 {kind:'scrap',amount:2,label:'2 份廢料',line:'「手頭連換口糧的鐵片都沒有了……能施捨 2 份廢料應急嗎？」'},
 {kind:'item',amount:1,label:'1 件裝備',line:'「在這條路上赤手空拳根本活不過今晚……背包裡要是有多餘裝備，能施捨一件給我嗎？」'}
];

function hash32(str){
 let h=2166136261;
 for(const ch of String(str))h=Math.imul(h^ch.charCodeAt(0),16777619);
 return h>>>0;
}

export function npcBegRequest(s,npc){
 if(!s||!npc||['敵對','掠奪'].includes(npc.attitude))return null;
 const h=hash32(`beg:${s.seed}:${s.stop}:${npc.id}:${npc.name}`);
 if((h%100)>=48)return null;
 return BEG_TYPES[(h>>>4)%BEG_TYPES.length];
}

export function wantedRadioBroadcast(s){
 const hero=heroShortName(s),stars=wantedStars(s);
 const starStr='★'.repeat(stars);
 const h=hash32(`wanted-radio:${s.seed}:${s.stop}:${s.minutes}:${s.morality}`);
 const lines=[
  `各位仍在向東行駛的聽眾請注意！治安頻道剛剛發布 ${starStr} 級公路通緝令：駕駛破車的「${hero}」涉嫌多起荒野打劫與襲擊商旅案件！沿途警力與軌道執法隊已全面攔檢，遇到此人請立刻鎖緊車門！`,
  `緊急插播！別管什麼生髮水廣告了——通緝犯「${hero}」（懸賞等級 ${starStr}）正往東邊流竄！人類治安聯隊與外星巡邏隊難得聯手設卡抓人，看到那台滿身焊痕的車請立刻繞道！`,
  `公路通緝快報 ${starStr}：惡名昭彰的「${hero}」再度被目擊出沒！多名商人哭訴貨架被洗劫一空。警方提醒民眾千萬別跟對方攀談，免得連褲袋裡的螺絲都被順手摸走！`
 ];
 return {
  kind:'radio',
  lines:[{speaker:'⚡ 緊急插播 · 公路通緝新聞',text:lines[h%lines.length],personId:null}]
 };
}

function makePoliceEvent(game,alien){
 const hero=heroShortName(game.s),stars=wantedStars(game.s);
 const fineScrap=3+stars*2,fineFuel=4+stars*2;
 return {
  id:alien?'police_alien':'police_human',
  title:alien?'外星執法巡邏攔檢':'人類警察臨檢路障',
  text:alien
   ?`刺耳的紫色能量警笛劃破公路！兩輛印著軌道執法徽記的外星警用載具閃著冷光攔在${hero}車前，全息擴音器冷冰冰地唸出通緝編號：「通緝目標 ${hero}，立刻熄火接受拘捕！」`
   :`紅藍警燈在前方沙塵中猛烈閃爍！一輛拼裝的人類廢土治安警車橫擋在路中央，幾名穿著舊時代警用防彈衣的警員舉起擴音器大喊：「前面那台車！電台通緝犯 ${hero}，立刻停車繳納罰金或束手就擒！」`,
  police:alien?'alien':'human',
  options:[
   {id:'police_bribe',label:`乖乖繳罰金保釋 · ${fineScrap} 廢料`,requires:[{resource:'scrap',minimum:fineScrap}],effects:[{op:'police_settle',resource:'scrap',amount:fineScrap}]},
   {id:'police_fuel_bribe',label:`交出油料和解 · ${fineFuel} 汽油`,requires:[{resource:'fuel',minimum:fineFuel}],effects:[{op:'police_settle',resource:'fuel',amount:fineFuel}]},
   {id:'police_fight',label:'強行拒捕・下車開火',requires:[],effects:[{op:'police_combat',mode:'character',police:alien?'alien':'human'}]},
   {id:'police_chase',label:'猛踩油門・警匪公路追逐',requires:[],effects:[{op:'police_combat',mode:'vehicle',police:alien?'alien':'human'}]}
  ]
 };
}

export function installMorality(Game,{ITEMS,clamp,display,clone}){
 const start=Game.prototype.start;
 Game.prototype.start=function(...args){
  const s=start.apply(this,args);
  normalizeMorality(s);
  return s;
 };

 Game.prototype.changeMorality=function(delta){
  normalizeMorality(this.s);
  const before=this.s.morality;
  this.s.morality=clamp(before+delta,-100,100);
  if(before>-30&&this.s.morality<=-30){
   const q=rollMoralityAuthorQuip(this.s,'wanted');
   appendMessage(this.s,'⚡ 通緝令發布',`惡名傳遍了這段公路！${heroShortName(this.s)}已被列為公路通緝犯，電台開始播報通緝新聞，警方巡邏隊也盯上了這輛車。`);
   if(q)appendMessage(this.s,'作者吐槽',q);
  }
  return this.s.morality;
 };

 // Build merchant loot table when attacking a merchant or shopkeeper
 Game.prototype.collectMerchantStock=function(c,npc){
  const shop=c?.service;
  const loot={scrap:3+this.roll(4),fuel:0,medicine:0,items:[]};
  if(shop==='npc_trade'||!shop){
   const st=npc?.stock||{fuel:1,medicine:1,item:1};
   if(st.fuel)loot.fuel+=10;
   if(st.medicine)loot.medicine+=1;
   if(st.item&&npc?.tradeItem&&ITEMS[npc.tradeItem])loot.items.push(npc.tradeItem);
  }else{
   if(['fuel_shop','general_shop'].includes(shop))loot.fuel+=14;
   if(['pharmacy','general_shop','clinic'].includes(shop))loot.medicine+=2;
   if(['general_shop','equipment_shop'].includes(shop)){
    const keys=Object.keys(ITEMS);
    loot.items.push(this.pick(keys),this.pick(keys));
   }
  }
  return loot;
 };

 Game.prototype.attackCurrentNpc=function(){
  const c=this.s.current,npc=c?.npc;
  if(this.s.mode!=='event'||!c||!npc)return false;
  const isMerchant=!!(c.service||npc.profession==='merchant');
  const merchantLoot=isMerchant?this.collectMerchantStock(c,npc):null;
  this.changeMorality(isMerchant?-25:-20);
  this.beginCombat('character',null,npc);
  if(this.s.battle&&merchantLoot){
   this.s.battle.merchantLoot=merchantLoot;
   this.s.battle.merchantName=display(npc);
  }
  return true;
 };

 // Rob NPC (morality -15; intimidate or fight)
 Game.prototype.robNpc=function(){
  const c=this.s.current,npc=c?.npc;
  if(this.s.mode!=='event'||!c?.dialogue||!npc)return false;
  this.s.minutes+=5;
  this.changeMorality(-15);
  const partyAtk=this.alive().reduce((n,p)=>n+this.stat(p,'attack'),0);
  const chance=clamp(42+partyAtk*2,25,85);
  if(this.roll()<=chance){
   const scrap=2+this.roll(3),fuel=this.roll(4)+1;
   this.add('scrap',scrap);this.add('fuel',fuel);
   let extra='';
   if(this.roll()<=40){this.add('medicine',1);extra='、1 份藥品';}
   const q=rollMoralityAuthorQuip(this.s,'rob');
   const msg=`${partyLabel(this.s)}亮出武器威脅${display(npc)}交出隨身財物！對方嚇得臉色發白，丟下 ${scrap} 份廢料、${fuel} 點汽油${extra}後倉皇逃進廢墟。`;
   c.npc=null;c.dialogue=false;c.service=null;
   this.log('打劫得手',msg);this.s.notice=msg;
   if(q)appendMessage(this.s,'作者吐槽',q);
  }else{
   const msg=`${display(npc)}被逼急了，怒吼一聲拔出武器反抗！`;
   this.log('打劫反遭迎擊',msg);
   const merchantLoot=c.service?this.collectMerchantStock(c,npc):null;
   this.beginCombat('character',null,npc);
   if(this.s.battle&&merchantLoot){this.s.battle.merchantLoot=merchantLoot;this.s.battle.merchantName=display(npc);}
  }
  return true;
 };

 // Steal from NPC (morality -10; stealth check or caught into combat)
 Game.prototype.stealNpc=function(){
  const c=this.s.current,npc=c?.npc;
  if(this.s.mode!=='event'||!c?.dialogue||!npc||c.stoleFromNpc)return false;
  this.s.minutes+=5;
  this.changeMorality(-10);
  const actor=this.actor()||this.s.party[0];
  const chance=clamp(45+this.stat(actor,'speed')*3+(actor.race==='mimic'?15:0),20,90);
  if(this.roll()<=chance){
   c.stoleFromNpc=true;
   const roll=this.roll(3);
   let got='';
   if(roll===1){this.add('scrap',3);got='3 份廢料';}
   else if(roll===2){this.add('medicine',1);got='1 份藥品';}
   else if(npc.tradeItem&&ITEMS[npc.tradeItem]){this.s.inventory.push(npc.tradeItem);got=ITEMS[npc.tradeItem].name;}
   else{this.add('fuel',4);got='4 點汽油';}
   const q=rollMoralityAuthorQuip(this.s,'steal');
   const msg=`趁著${display(npc)}轉身整理行囊的空檔，${actor.name}神不知鬼不覺地順走了${got}。`;
   this.log('順手牽羊',msg);this.s.notice=msg;
   if(q)appendMessage(this.s,'作者吐槽',q);
  }else{
   this.changeMorality(-5);
   const msg=`${actor.name}伸手摸向對方背包時當場被抓個正著！${display(npc)}氣得拔出武器：「小偷！把命留下！」`;
   this.log('行竊敗露',msg);
   const merchantLoot=c.service?this.collectMerchantStock(c,npc):null;
   this.beginCombat('character',null,npc);
   if(this.s.battle&&merchantLoot){this.s.battle.merchantLoot=merchantLoot;this.s.battle.merchantName=display(npc);}
  }
  return true;
 };

 // Give charity when NPC begs for medicine, fuel, scrap, or an item (morality +14)
 Game.prototype.giveCharity=function(){
  const c=this.s.current,npc=c?.npc,req=c?.begRequest;
  if(this.s.mode!=='event'||!c?.dialogue||!npc||!req||c.charityGiven)return false;
  if(req.kind==='medicine'){if(this.s.resources.medicine<req.amount)return false;this.add('medicine',-req.amount);}
  else if(req.kind==='fuel'){if(this.availableFuel()<req.amount)return false;this.add('fuel',-req.amount);}
  else if(req.kind==='scrap'){if(this.s.resources.scrap<req.amount)return false;this.add('scrap',-req.amount);}
  else if(req.kind==='item'){if(!this.s.inventory.length)return false;this.s.inventory.shift();}
  c.charityGiven=true;
  npc.attitude='友善';
  this.changeMorality(14);
  const q=rollMoralityAuthorQuip(this.s,'charity');
  const msg=`${display(npc)}雙手接過${req.label}，眼眶微紅地向${partyLabel(this.s)}連聲道謝：「願東方的風保佑你們一路平安，我會把你們的好心傳給這條路上的每個人。」`;
  this.log(display(npc),msg);
  this.s.notice=msg;
  if(q)appendMessage(this.s,'作者吐槽',q);
  return true;
 };

 // Wrap npcGift so gifting also improves morality
 const origGift=Game.prototype.npcGift;
 if(origGift){
  Game.prototype.npcGift=function(...args){
   const ok=origGift.apply(this,args);
   if(ok)this.changeMorality(10);
   return ok;
  };
 }

 // Wrap talk/npcStory/npcIntel/recruit so wanted players get shunned even by friendly NPCs
 for(const fn of ['talk','npcStory','npcIntel','recruit']){
  const orig=Game.prototype[fn];
  if(!orig)continue;
  Game.prototype[fn]=function(...args){
   const c=this.s.current,npc=c?.npc;
   if(this.s.mode==='event'&&c?.dialogue&&npc&&isWanted(this.s)&&this.roll()<=65){
    const msg=`「別靠過來……電台剛播過${heroShortName(this.s)}的通緝新聞，就算我平常再好說話也不想惹上警察！」\n對方緊緊抱著行囊退開兩步，拒絕跟你們深談。`;
    this.log(display(npc),msg);
    this.s.notice=msg;
    const q=rollMoralityAuthorQuip(this.s,'wanted_refuse');
    if(q)appendMessage(this.s,'作者吐槽',q);
    return true;
   }
   return orig.apply(this,args);
  };
 }

 // Wrap finishCombat to grant ALL merchant goods when defeating a merchant!
 const origFinish=Game.prototype.finishCombat;
 Game.prototype.finishCombat=function(win){
  const b=this.s.battle,loot=win?b?.merchantLoot:null,mName=b?.merchantName;
  origFinish.call(this,win);
  if(loot&&this.s.mode!=='ending'){
   const parts=[];
   if(loot.scrap){this.add('scrap',loot.scrap);parts.push(`${loot.scrap} 份廢料`);}
   if(loot.fuel){this.add('fuel',loot.fuel);parts.push(`${loot.fuel} 點汽油`);}
   if(loot.medicine){this.add('medicine',loot.medicine);parts.push(`${loot.medicine} 份藥品`);}
   if(loot.items?.length){
    for(const id of loot.items)if(ITEMS[id])this.s.inventory.push(id);
    parts.push(loot.items.map(id=>ITEMS[id]?.name||id).join('、'));
   }
   const msg=`擊倒商人${mName||''}後，${partyLabel(this.s)}把對方的全部商品洗劫一空：奪得 ${parts.join('、')}！`;
   this.log('洗劫商人貨架',msg);
   this.s.notice=msg;
   const q=rollMoralityAuthorQuip(this.s,'merchant_loot');
   if(q)appendMessage(this.s,'作者吐槽',q);
  }
 };

 // Wrap effect() to handle police event options
 const origEffect=Game.prototype.effect;
 Game.prototype.effect=function(f){
  if(f.op==='police_settle'){
   this.add(f.resource,-f.amount);
   this.changeMorality(15);
   const msg=`${partyLabel(this.s)}忍痛交出 ${f.amount} ${f.resource==='fuel'?'點汽油':'份廢料'}作為罰金。警員清點完畢後揮手放行，這趟通緝風波暫時壓了下去。`;
   this.log('繳罰金保釋',msg);this.s.notice=msg;
   if(this.s.current)this.s.current.event.options=[];
   return;
  }
  if(f.op==='police_combat'){
   const isAlien=f.police==='alien';
   this.beginCombat(f.mode);
   if(this.s.battle){
    this.s.battle.policeBattle=f.police;
    this.s.battle.enemies=this.s.battle.enemies.slice(0,2).map((e,i)=>({
     ...e,
     key:isAlien?'sentinel':'soldier',
     name:f.mode==='vehicle'
      ?(isAlien?`外星軌道警用攔截車 #${i+1}`:`人類廢土警車 #${i+1}`)
      :(isAlien?`外星執法警官 #${i+1}`:`人類治安警察 #${i+1}`),
     vehicle:f.mode==='vehicle'?(isAlien?'armored':'sedan'):e.vehicle,
     hasWeapon:true,
     armor:f.mode==='vehicle'?(isAlien?4:2):e.armor,
     defense:f.mode==='vehicle'?(isAlien?4:2):e.defense
    }));
   }
   return;
  }
  return origEffect.call(this,f);
 };

 // Wrap ambient() to inject GTA wanted breaking news when morality <= -30
 const origAmbient=Game.prototype.ambient;
 Game.prototype.ambient=function(){
  if(isWanted(this.s)&&this.roll()<=55){
   const b=wantedRadioBroadcast(this.s);
   if(this.s.travel)this.s.travel.voices=b;
   for(const line of b.lines)appendMessage(this.s,line.speaker,line.text,line.personId);
   return b.lines[0].text;
  }
  return origAmbient.call(this);
 };

 // Wrap nextEvent() to trigger GTA human/alien police interception when wanted, and attach NPC beg requests!
 const origNext=Game.prototype.nextEvent;
 Game.prototype.nextEvent=function(){
  const frame=this.s.frames?.at(-1);
  if(frame?.kind==='road'&&isWanted(this.s)&&this.roll()<=(this.s.morality<=-60?45:30)){
   frame.count++;
   const alien=this.roll(2)===1;
   const ev=makePoliceEvent(this,alien);
   this.s.current={instance:++this.s.serial,event:ev,npc:null,resolved:false,building:false,entered:false,service:null,dialogue:false,giftGiven:false,frame:'road'};
   this.s.mode='event';
   this.s.notice=ev.text;
   const q=rollMoralityAuthorQuip(this.s,'police');
   if(q)appendMessage(this.s,'作者吐槽',q);
   return;
  }
  origNext.call(this);
  const c=this.s.current;
  if(c?.npc&&c.dialogue&&!c.begRequest){
   c.begRequest=npcBegRequest(this.s,c.npc);
  }
 };
}
