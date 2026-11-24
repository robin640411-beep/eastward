import {enrichProceduralNpc,personRaceName,personJobName} from './procedural-npc.js';

const JOB_TRADE_ITEMS={
 soldier:'shotgun',hunter:'machete',guard:'vest',demolition:'scrap_plate',
 medic:'med_scanner',chemist:'hazmat',researcher:'amber_core',historian:'charm',
 hacker:'emp_module',electrician:'arc_baton',scout:'stealth_cloak',courier:'booster_boots',
 driver:'tools',mechanic:'tools',engineer:'emp_module',merchant:'vest',
 scavenger:'machete',locksmith:'tools',diplomat:'charm',performer:'stealth_cloak'
};

export function npcFavorInfo(p){
 if(!p)return null;
 const job=p.profession;
 if(['mechanic','engineer','electrician'].includes(job))return {label:'請對方路邊檢修車身 · 10 分鐘',kind:'repair'};
 if(['medic','chemist'].includes(job))return {label:'請對方替傷員包紮清毒 · 10 分鐘',kind:'heal'};
 if(['driver','courier','scout'].includes(job))return {label:'請教省油路線與暗記 · 10 分鐘',kind:'fuel'};
 if(['performer','diplomat','historian'].includes(job))return {label:'圍坐閒聊提振全隊士氣 · 10 分鐘',kind:'morale'};
 if(['scavenger','locksmith','hacker','merchant'].includes(job))return {label:'結伴搜查附近暗格 · 10 分鐘',kind:'scavenge'};
 return {label:'切磋荒路防身心得 · 10 分鐘',kind:'drill'};
}

export function installNpcs(Game,{clone,display,ITEMS}){
 const person=Game.prototype.person;
 Game.prototype.person=function(race=null,job=null){
  const p=person.call(this,race,job);
  p.memories=[];p.stock={fuel:1,medicine:1,item:1};
  const preferred=JOB_TRADE_ITEMS[p.profession]||'tools';
  p.tradeItem=ITEMS[preferred]?preferred:'tools';
  if(this.s?.party?.length>=1&&race===null&&job===null)enrichProceduralNpc(p,this.s.seed,this.d.catalog);
  return p;
 };
 const interact=Game.prototype.interact;
 Game.prototype.interact=function(service=null){
  interact.call(this,service);
  const c=this.s.current;
  if(this.s.mode==='event'&&c?.dialogue&&!c.service)c.service='npc_trade';
  if(this.s.mode==='event'&&c?.dialogue&&c.npc?.procedural?.appearance&&!this.s.notice.includes(c.npc.procedural.appearance)){
   this.s.notice=`${display(c.npc)}（${personRaceName(c.npc,this.d.catalog)} · ${personJobName(c.npc,this.d.catalog)}）\n${c.npc.procedural.appearance}\n${this.s.notice.split('\n').slice(1).join('\n')}`;
  }
 };
 const next=Game.prototype.nextEvent;
 Game.prototype.nextEvent=function(){next.call(this);const c=this.s.current;if(c?.dialogue&&!c.service)c.service='npc_trade'};
 Game.prototype.remember=function(p,text){if(!p)return;p.memories??=[];if(!p.memories.includes(text))p.memories.push(text);p.memories=p.memories.slice(-8)};
 const schedule=Game.prototype.schedule;
 Game.prototype.schedule=function(p,hostile=false){if(!p||this.s.pending.some(f=>f.actor.id===p.id))return;this.remember(p,`在進度 ${this.s.progress} 的停靠與你分別。`);schedule.call(this,p,hostile)};
 const recruit=Game.prototype.recruit;
 Game.prototype.recruit=function(){const p=this.s.current?.npc;const ok=recruit.call(this);if(ok){this.remember(p,`在進度 ${this.s.progress} 加入你的車隊。`);this.s.pending=this.s.pending.filter(f=>f.actor.id!==p.id);this.s.departed=this.s.departed.filter(q=>q.id!==p.id)}return ok};

 // 1. Ask NPC about their race/profession background & Paradise wish; can warm up wary/cold NPCs.
 Game.prototype.npcStory=function(){
  const c=this.s.current,p=c?.npc;
  if(this.s.mode!=='event'||!c?.dialogue||!p||['敵對','掠奪'].includes(p.attitude))return false;
  this.s.minutes+=5;
  const cd=this.d.oracles.companion_dialogue;
  const rObj=cd?.races?.[p.race],jObj=cd?.professions?.[p.profession];
  const rName=personRaceName(p,this.d.catalog);
  const jName=personJobName(p,this.d.catalog);
  const ex=(rObj?.exchanges?.length&&this.roll(2)===1)?this.pick(rObj.exchanges):jObj?.exchanges?.length?this.pick(jObj.exchanges):null;
  const wish=(rObj?.wishes?.length&&this.roll(2)===1)?this.pick(rObj.wishes):jObj?.wishes?.length?this.pick(jObj.wishes):'只是想活著看到沒有母艦的天空。';
  const lines=[`${display(p)}（${rName} · ${jName}）停下手邊的事，和你聊起自己的來歷：`];
  if(ex)lines.push(`「${ex[1]}」`);
  lines.push(`「${wish}」`);
  if(['戒備','冷淡'].includes(p.attitude)){
   const actor=this.actor();
   const chance=['diplomat','performer'].includes(actor?.profession)?90:65;
   if(this.roll()<=chance){
    p.attitude='友善';
    lines.push('對方聽你認真聽完自己的經歷，眼神明顯柔和了下來（態度轉為友善，現在可以進一步請對方幫忙或打聽情報）。');
    this.remember(p,'你曾耐心聽過他的過往與願望，雙方卸下了戒心。');
   }else{
    lines.push('對方說完後又收斂起神情，顯然還需要一點時間或誠意才會完全信任你。');
   }
  }else{
   this.remember(p,'你們曾在荒路旁聊過彼此的出身與樂園願望。');
  }
  c.storyShared=true;
  this.tell(lines.join('\n'));
  return true;
 };

 // 2. Ask NPC for road intel, boss rumors, or world history (once per encounter).
 Game.prototype.npcIntel=function(){
  const c=this.s.current,p=c?.npc;
  if(this.s.mode!=='event'||!c?.dialogue||!p||['敵對','掠奪'].includes(p.attitude)||c.intelShared)return false;
  this.s.minutes+=5;
  if(['戒備','冷淡'].includes(p.attitude)){
   this.tell(`${display(p)}掃了你一眼，沒有多透露前方的情報：「我們還不熟，這種能保命的消息可不能隨便說。」（先聊聊出身或分享物資結交，也許對方會願意開口）`);
   return true;
  }
  c.intelShared=true;
  const parts=[`${display(p)}壓低聲音，和你交換了沿途打聽到的情報：`];
  const boss=this.d.oracles.tables.find(t=>t.id==='final_boss')&&this.s.finalBoss;
  if(boss&&this.roll()<=65){
   const oldRumor=this.s.bossRumors?.length||0;
   const origOracle=this.oracle.bind(this);
   this.oracle=id=>id==='boss_rumor'?{value:true,roll:1}:origOracle(id);
   let rumor='';
   try{rumor=this.bossRumor?.(p)||'';}finally{this.oracle=origOracle;}
   if(rumor)parts.push(rumor.trim());
   if((this.s.bossRumors?.length||0)===oldRumor)this.reveal();
  }else{
   const beforeLen=this.s.history.length;
   this.reveal();
   if(this.s.history.length>beforeLen)parts.push(this.s.history.at(-1));
  }
  if(['scout','courier','driver'].includes(p.profession)){this.add('fuel',3);parts.push('對方還在地圖上圈出一段避開掃描柱的省油捷徑（汽油 +3）。');}
  else if(['scavenger','merchant','locksmith'].includes(p.profession)){this.add('scrap',2);parts.push('對方順手告訴你附近一處沒人翻過的鐵箱位置（廢料 +2）。');}
  else if(['medic','chemist'].includes(p.profession)){const hurt=this.alive().sort((a,z)=>a.hp/a.maxHp-z.hp/z.maxHp)[0];if(hurt&&hurt.hp<hurt.maxHp){hurt.hp=Math.min(hurt.maxHp,hurt.hp+3);parts.push(`對方順手替${display(hurt)}處理了小傷口（生命 +3）。`);}}
  else{this.alive().forEach(q=>q.st=Math.min(q.maxSt,q.st+2));parts.push('掌握前方路況後，全隊心情踏實了不少（全員體力 +2）。');}
  this.remember(p,`在進度 ${this.s.progress} 與你分享了東行情報。`);
  this.tell(parts.join('\n'));
  return true;
 };

 // 3. Share 1 scrap to befriend NPC (turns wary/cold -> friendly, or earns a profession gift if already friendly/sympathetic).
 Game.prototype.npcGift=function(){
  const c=this.s.current,p=c?.npc;
  if(this.s.mode!=='event'||!c?.dialogue||!p||['敵對','掠奪'].includes(p.attitude)||c.giftedNpc||this.s.resources.scrap<1)return false;
  this.add('scrap',-1);c.giftedNpc=true;
  if(['戒備','冷淡'].includes(p.attitude)){
   p.attitude='友善';
   this.remember(p,'你在荒路上大方分給他 1 份廢料，贏得了他的信任。');
   this.tell(`你分出 1 份廢料交給${display(p)}。對方愣了一下，收起防備點頭致意：「謝了，這年頭肯先釋出善意的人不多。」（態度轉為友善）`);
   return true;
  }
  const job=p.profession;
  let reply='';
  if(['mechanic','engineer','electrician'].includes(job)){this.s.vehicle.hp=Math.min(this.s.vehicle.maxHp,this.s.vehicle.hp+6);reply='對方笑著拿出焊槍替你把車身薄弱處補強了一番（車況 +6）。';}
  else if(['medic','chemist'].includes(job)){this.alive().forEach(q=>q.hp=Math.min(q.maxHp,q.hp+5));reply='對方從隨身箱裡分出幾劑消毒藥劑幫全隊處理舊傷（全員生命 +5）。';}
  else if(['driver','courier','scout'].includes(job)){this.add('fuel',6);reply='對方爽快地從備用桶裡倒了些油進你的油箱（汽油 +6）。';}
  else if(['performer','diplomat','historian'].includes(job)){this.alive().forEach(q=>q.st=Math.min(q.maxSt,q.st+4));reply='對方拉著大家聊起荒路趣聞，緊繃的氣氛頓時輕鬆不少（全員體力 +4）。';}
  else{const eq=this.oracle('equipment').value;if(ITEMS[eq]){this.s.inventory.push(eq);reply=`對方翻出自己多帶的裝備回贈給你：獲得 ${ITEMS[eq].name}！`;}else{this.add('medicine',1);reply='對方回贈了你 1 份急救藥品。';}}
  this.remember(p,'你們在路上互相分享物資，成了信得過的朋友。');
  this.tell(`你分出 1 份廢料與${display(p)}結交。\n${reply}`);
  return true;
 };

 // 4. Ask a friendly/sympathetic NPC for a profession-specific non-combat favor (once per encounter).
 Game.prototype.npcFavor=function(){
  const c=this.s.current,p=c?.npc;
  if(this.s.mode!=='event'||!c?.dialogue||!p||['敵對','掠奪'].includes(p.attitude)||c.favorDone)return false;
  if(['戒備','冷淡'].includes(p.attitude)){
   this.tell(`${display(p)}搖了搖頭：「我還信不過你們，沒空替陌生人白忙。」（先聊聊出身或分享 1 份廢料把態度轉為友善）`);
   return true;
  }
  const info=npcFavorInfo(p);if(!info)return false;
  this.s.minutes+=10;c.favorDone=true;
  let result='';
  if(info.kind==='repair'){this.s.vehicle.hp=Math.min(this.s.vehicle.maxHp,this.s.vehicle.hp+8);result=`${display(p)}熟練地鑽進車底替你鎖緊大樑與管線（車況 +8）。`;}
  else if(info.kind==='heal'){const hurt=this.alive().sort((a,z)=>a.hp/a.maxHp-z.hp/z.maxHp)[0];if(hurt){hurt.hp=Math.min(hurt.maxHp,hurt.hp+8);result=`${display(p)}仔細替${display(hurt)}清創換藥，傷勢穩定許多（生命 +8）。`;}else result='大家都還健康，對方替你們檢查了藥包。';}
  else if(info.kind==='fuel'){this.add('fuel',5);result=`${display(p)}帶你繞到路旁一處隱蔽儲油閥，順利抽出備用油料（汽油 +5）。`;}
  else if(info.kind==='morale'){this.alive().forEach(q=>{q.st=Math.min(q.maxSt,q.st+4);q.esp=Math.min(q.maxEsp,q.esp+3);});result=`${display(p)}和大家圍坐在車旁交換故事與笑話，旅途的疲憊一掃而空（全員體力 +4、靈能 +3）。`;}
  else if(info.kind==='scavenge'){if(this.roll()<=45){const eq=this.oracle('equipment').value;if(ITEMS[eq]){this.s.inventory.push(eq);result=`你和${display(p)}聯手撬開附近廢墟的暗格，找到裝備：${ITEMS[eq].name}！`;}}if(!result){this.add('scrap',3);result=`你和${display(p)}合作翻查周邊殘骸，分到 3 份優質廢料。`;}}
  else{this.alive().forEach(q=>q.st=Math.min(q.maxSt,q.st+2));this.add('medicine',1);result=`${display(p)}和你切磋荒路防身與應變經驗，臨走前還多塞給你 1 份急救藥品（全員體力 +2、藥品 +1）。`;}
  this.remember(p,`曾在進度 ${this.s.progress} 伸出援手幫過你的車隊。`);
  this.tell(result);
  return true;
 };

 const buy=Game.prototype.buy;
 Game.prototype.buy=function(kind,id){const c=this.s.current;if(this.s.mode!=='event'||!c?.dialogue)return false;
  if(c.service!=='npc_trade'){if(kind==='vehicle'&&this.s.offerVehicle){this.tell('請先處理目前可用的車輛，再購買另一輛。');return false;}return buy.call(this,kind,id)}
  const p=c.npc;if(!p||['敵對','掠奪'].includes(p.attitude))return false;p.stock??={fuel:1,medicine:1,item:1};p.tradeItem??='tools';
  if(!['fuel','medicine','item'].includes(kind)||p.stock[kind]<=0||kind==='item'&&id!==p.tradeItem)return false;
  const price=this.price(kind==='fuel'?3:kind==='medicine'?2:ITEMS[id].price);if(this.s.resources.scrap<price)return false;
  this.add('scrap',-price);p.stock[kind]--;if(kind==='fuel')this.add('fuel',10);if(kind==='medicine')this.add('medicine',1);if(kind==='item')this.s.inventory.push(id);this.remember(p,`你們曾在進度 ${this.s.progress} 交換物資。`);this.tell(`${display(p)}把物資交給你。`);return true;
 };
}
