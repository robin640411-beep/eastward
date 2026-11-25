import {npcDemeanor} from './npc-presentation.js';
import {VEHICLE_MODS,normalizeVehicleState,installVehicles} from './vehicle-runtime.js';
import {installOrigins} from './origin-runtime.js';
import { normalizeFlow,installAutomaticJourney,appendMessage } from './automatic-journey.js';
import {normalizeProgression,installProgression,makeRegionalEnemies} from './progression-runtime.js';
import {normalizeRoute,nameEncounter} from './route-runtime.js';
import {MAX_PARTY,normalizeJourney,installDialogue} from './dialogue-runtime.js';
import {installNpcs} from './npc-runtime.js';
import {installTraits} from './traits-runtime.js';
import {installCombat} from './combat.js';
import {fillStory,heroShortName,partyLabel,rollBattleAuthorQuip,rollMoralityAuthorQuip} from './storybook.js';
import {installMorality,isSaint} from './morality-runtime.js';
// 一路向東 — deterministic state machine. No network or AI in gameplay.
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const clone=x=>JSON.parse(JSON.stringify(x));
export const phase=m=>{const h=Math.floor(m/60)%24;return h<5||h>=18?'night':h<8?'dawn':h<12?'morning':'afternoon'};
export const phaseName=m=>({night:'夜晚',dawn:'清晨',morning:'上午',afternoon:'下午'}[phase(m)]);
export const display=p=>`「${p.nickname}」${p.name}`;
export const ITEMS={
 club:{name:'球棒',slot:'武器',attack:2,price:3},
 machete:{name:'鋼刃開山刀',slot:'武器',attack:4,speed:1,price:6},
 pistol:{name:'舊手槍',slot:'武器',attack:4,price:7,ranged:true},
 arc_baton:{name:'電弧警棍',slot:'武器',attack:5,psyche:1,vsMachine:3,price:11},
 shotgun:{name:'廢土霰彈槍',slot:'武器',attack:6,defense:1,price:12,ranged:true},
 amber_rifle:{name:'琥珀脈衝槍',slot:'武器',attack:8,psyche:2,vsMachine:2,price:18,ranged:true},
 coat:{name:'厚外套',slot:'防具',defense:1,price:3},
 vest:{name:'防護背心',slot:'防具',defense:3,price:8},
 hazmat:{name:'抗孢子防護衣',slot:'防具',defense:2,psyche:1,antiPollution:2,price:9},
 stealth_cloak:{name:'光學迷彩披風',slot:'防具',defense:2,speed:3,escapeBonus:10,price:12},
 scrap_plate:{name:'焊鐵重甲',slot:'防具',defense:5,speed:-1,price:13},
 chitin_armor:{name:'鐮刀甲殼戰甲',slot:'防具',defense:6,attack:1,price:19},
 tools:{name:'工具組',slot:'配件',defense:1,price:4},
 charm:{name:'共鳴石',slot:'配件',psyche:2,price:6},
 booster_boots:{name:'強化助跑靴',slot:'配件',speed:3,price:7},
 med_scanner:{name:'戰地生命儀',slot:'配件',defense:1,psyche:1,healBonus:2,price:9},
 emp_module:{name:'電磁干擾模組',slot:'配件',attack:1,defense:1,vsMachine:2,price:10},
 amber_core:{name:'穩定琥珀晶核',slot:'配件',psyche:4,attack:1,price:16}
};
export const RACE_BONUSES={
 human:{},
 alien:{attack:1,psyche:1},
 mutant:{maxHp:4,attack:1},
 synth:{defense:2,maxSt:4},
 uplift:{speed:2,attack:1},
 chitin:{maxHp:4,defense:2},
 mycelial:{psyche:1,maxEsp:3},
 crystal:{psyche:2,maxEsp:4},
 amphibian:{maxSt:4,speed:1},
 mimic:{speed:2},
 symbiote:{maxHp:4},
 lumen:{psyche:1,speed:1,maxEsp:2}
};
export const JOB_BONUSES={
 driver:{speed:1},
 mechanic:{defense:1},
 medic:{psyche:1},
 soldier:{attack:2},
 scout:{speed:2},
 merchant:{speed:1},
 scavenger:{maxSt:3},
 engineer:{defense:1},
 researcher:{psyche:2},
 hacker:{psyche:1,speed:1},
 hunter:{attack:1,speed:1},
 guard:{maxHp:4,defense:2},
 courier:{maxSt:4,speed:2},
 diplomat:{psyche:1},
 historian:{psyche:1,maxEsp:2},
 locksmith:{speed:1},
 demolition:{attack:2},
 chemist:{psyche:1},
 electrician:{defense:1},
 performer:{psyche:1,speed:1}
};
export const MODS={...VEHICLE_MODS,lamp:{name:'車頂探照燈',price:4}};
export const BUILDING_ROADS=new Set([1,2,3,4,5,14,15,21,26,28,29,34,35,36,37,38,39,40,44,45,48]);
export const POWERS={
 human:[['念力推擊','strike'],['心靈復原','heal'],['意志屏障','shield']],alien:[['星芒','strike'],['靜默波','stun'],['腦域風暴','burst']],mutant:[['異變衝擊','strike'],['再生','heal'],['畸變爆發','burst']],synth:[['脈衝','strike'],['反應護盾','shield'],['系統震盪','stun']],uplift:[['野性共鳴','strike'],['生命回聲','heal'],['心靈嚎叫','burst']],chitin:[['碎甲念波','strike'],['甲殼屏障','shield'],['鎮壓','stun']],mycelial:[['孢子念波','strike'],['菌網修復','heal'],['眠霧','stun']],crystal:[['晶芒','strike'],['折射屏障','shield'],['共振崩解','burst']],amphibian:[['潮汐衝擊','strike'],['潮生修復','heal'],['深水屏障','shield']],mimic:[['幻影刺擊','strike'],['感官錯置','stun'],['幻象屏障','shield']],symbiote:[['共生鞭擊','strike'],['生命縫合','heal'],['雙重意識','shield']],lumen:[['光束','strike'],['溫光','heal'],['極光爆發','burst']]};
export function learned(p){return POWERS[p.race].map(([name,type],i)=>({id:i,name,type,level:[1,3,5][i],cost:[3,4,7][i]})).filter(x=>p.level>=x.level)}
export class Game{
 constructor(data,state=null){this.d=data;this.s=state;if(state&&Array.isArray(state.inventory))state.inventory=state.inventory.filter(id=>ITEMS[id]);normalizeJourney(state);normalizeRoute(state);normalizeProgression(state);normalizeFlow(state);normalizeVehicleState(state,data.assets);
  if(state?.mode==='event'&&state.current){
   const c=state.current,e=c.event;
   // A pending v24 choice is identifiable by its original option. An empty list
   // means the old save already took or passed it, even without a receipt.
   if(e?.options?.length&&!e.automatic_reward){
    const catalog=e.id?.startsWith('building_')?data.buildings:data.events;
    const def=catalog?.events.find(row=>row.id===e.id);
    if(def?.automatic_reward&&e.options.some(o=>o.id===def.automatic_reward)){
     e.automatic_reward=def.automatic_reward;e.reward_alternative=def.reward_alternative;
     e.options=e.options.filter(o=>o.id===def.automatic_reward);
    }
   }
   if(c.building&&!c.entered&&e?.id==='road_025')c.building=false;
   this.collectReward();
  }
 }
 roll(sides=100){let x=this.s.rng>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;this.s.rng=x>>>0||1;return (this.s.rng%sides)+1;}
 pick(arr){return arr[this.roll(arr.length)-1]}
 oracle(id){const t=this.d.oracles.tables.find(t=>t.id===id);if(!t)throw Error('Missing oracle '+id);const n=this.roll(Number(t.die?.slice(1))||100);const r=t.rows.find(r=>n>=r.min&&n<=r.max);return {...clone(r),roll:n}}
 person(race=null,job=null){const p={id:'p'+(++this.s.serial),name:this.oracle('npc_name').value,nickname:this.oracle('npc_nickname').value,race:race||this.oracle('npc_race').value,profession:job||this.oracle('npc_profession').value,attitude:this.oracle('npc_attitude').value,flaw:this.oracle('npc_flaw').value,level:1,xp:0,asleep:false,gear:{武器:'club',防具:'coat',配件:null}};const rb=RACE_BONUSES[p.race]||{},jb=JOB_BONUSES[p.profession]||{};p.maxHp=24+(rb.maxHp||0)+(jb.maxHp||0)+(p.flaw==='frail'?-2:0);p.maxSt=24+(rb.maxSt||0)+(jb.maxSt||0)+(p.flaw==='low_endurance'?-2:0);p.maxEsp=10+(rb.maxEsp||0)+(jb.maxEsp||0);p.hp=p.maxHp;p.st=p.maxSt;p.esp=p.maxEsp;return p;}
 start({seed=Date.now(),race='human',profession='driver'}={}){this.s={version:1,rng:Number(seed)>>>0||1,seed:Number(seed),serial:0,progress:1,minutes:480,stop:0,mode:'ready',party:[],driver:null,resources:{fuel:24,scrap:8,medicine:3},inventory:['pistol','tools'],vehicle:{model:'compact',hp:24,maxHp:24,mods:[]},departed:[],pending:[],frames:[],current:null,battle:null,logs:[],history:[],seen:[],dice:null,travel:null,notice:'故事從這裡翻開第一頁。車頭朝東，至於能不能活著看見綠洲，連寫這本書的我也不敢打包票。',end:null};const p=this.person(race,profession);p.attitude='友善';this.s.party=[p];this.s.driver=p.id;const hist=this.oracle('invasion_history').value;this.s.world={...hist,year:2070+this.roll(30),faction:this.pick(['先遣聯軍','軌道議會','遠征監督局','星門軍團']),archive:this.pick(['灰塔紀錄','最後的民防日誌','失落電台檔案','撤離列車手記'])};normalizeJourney(this.s);normalizeRoute(this.s);normalizeProgression(this.s);this.log('開始旅程',`${display(p)}踏上了往東的路。`);return this.s;}
 alive(){return this.s.party.filter(p=>p.hp>0)}
 actor(){return this.alive().find(p=>!p.asleep)||this.alive()[0]}
 driver(){return this.alive().find(p=>p.id===this.s.driver)||this.alive()[0]}
 partyLimit(){return Math.min(MAX_PARTY,this.seats())}
 canRecruit(){return this.s.party.length<this.partyLimit()}
 seats(){return this.d.assets.vehicles[this.s.vehicle.model].seats+this.s.vehicle.mods.filter(x=>x==='seat').length}
 stat(p,k){let n={attack:5,defense:2,speed:5,psyche:5}[k]+p.level-1+(RACE_BONUSES[p.race]?.[k]||0)+(JOB_BONUSES[p.profession]?.[k]||0)+(p.race==='human'?Math.floor((p.level-1)/3):0);for(const id of Object.values(p.gear))n+=ITEMS[id]?.[k]||0;if(k==='speed'&&p.flaw==='slow_reflex')n--;return Math.max(1,n)}
 log(title,text){this.s.logs.unshift({title,text,minutes:this.s.minutes,progress:this.s.progress});this.s.logs=this.s.logs.slice(0,100)}
 tell(text){this.s.notice=text;this.log('旅途紀錄',text)}
 afford(req){return req.every(r=>r.free_seats?this.s.party.length+r.free_seats<=this.partyLimit():(r.resource==='fuel'?this.availableFuel():this.s.resources[r.resource])>=r.minimum)}
 add(key,n){this.s.resources[key]=Math.max(0,(this.s.resources[key]||0)+n)}
 travelCost(n,p=this.driver()){if(!n)return {fuel:0,st:0};let st=n*(phase(this.s.minutes)==='night'?2:1)+(p.flaw==='night_strain'&&phase(this.s.minutes)==='night'?1:0)+(p.flaw==='poor_driver'?1:0)-(p.profession==='driver'?1:0);return {fuel:n+(p.flaw==='wasteful_driver'?1:0),st:Math.max(1,st)}}
 canDrive(){const p=this.driver();return this.s.mode==='ready'&&p&&p.st>0&&this.s.resources.fuel>0&&this.s.vehicle.hp>0&&this.s.party.length<=this.partyLimit()}
 depart(){if(!this.canDrive())return false;const die=this.roll(10);let n=Math.min(die,100-this.s.progress);const p=this.driver();while(n>0){const c=this.travelCost(n,p);if(c.fuel<=this.s.resources.fuel&&c.st<=p.st)break;n--;}
 if(!n){this.tell('現有燃料或駕駛體力不足以再前進一步。');return false;}const cost=this.travelCost(n,p);this.s.travel={die,n,cost,driver:p.id};this.s.mode='driving';this.s.dice={kind:'D10',value:die};this.s.notice=this.ambient();return true;}
 previewArrival(){if(this.s.mode!=='driving')return null;const copy=clone(this.s);delete copy.travel.preview;const future=new Game(this.d,copy);future.arrive();return {current:clone(future.s.current),battle:clone(future.s.battle),ending:clone(future.s.end),progress:future.s.progress,minutes:future.s.minutes};}
 arrive(){if(this.s.mode!=='driving')return;const t=this.s.travel,p=this.s.party.find(p=>p.id===t.driver);this.add('fuel',-t.cost.fuel);p.st=Math.max(0,p.st-t.cost.st);this.s.party.forEach(q=>{if(q.id!==p.id&&q.hp>0)q.st=clamp(q.st+t.n,0,q.maxSt)});this.s.progress+=t.n;this.s.minutes+=60;this.s.travel=null;this.log('向東行駛',`又走過一段公路。汽油 −${t.cost.fuel}，駕駛體力 −${t.cost.st}。`);if(this.s.progress>=100){this.beginFinale();return;}this.s.stop++;this.s.usedStory=[];this.s.frames=[{kind:'road',count:0,scene:null}];this.nextEvent();}
 end(win,text){this.s.mode='ending';this.s.end={win,text};this.s.battle=null;this.log(win?'抵達綠洲':'旅程結束',text)}
 nextEvent(){const frame=this.s.frames.at(-1);if(!frame){this.s.mode='ready';this.s.current=null;this.s.searched=false;this.s.notice='整理好隊伍，準備繼續向東。';return;}frame.count++;const tab=frame.kind==='building'?'building_event':'road_event';const draw=this.oracle(tab);let e=clone((frame.kind==='building'?this.d.buildings:this.d.events).events.find(e=>e.id===draw.event));let npc=null;
 if(frame.kind==='road'||frame.kind==='building'){
 const pending=this.s.pending.filter(x=>x.after<=this.s.stop&&!this.s.usedStory.includes(x.id));
 if(pending.length&&this.roll()<=15){const f=this.pick(pending);e={id:f.event,title:'再度相遇',text:`${display(f.actor)}在路邊認出了${heroShortName(this.s)}的車。${f.actor.memories?.at(-1)||'這位曾經同路的旅人還記得當初分別時的事。'}`,kind:'followup',options:[]};npc=clone(f.actor);npc.attitude=f.hostile?'敵對':'同情';this.s.usedStory.push(f.id);this.s.pending=this.s.pending.filter(x=>x.id!==f.id);}
 }
 if(!npc&&e.bindings?.npc)npc=this.person();const building=frame.kind==='road'&&BUILDING_ROADS.has(e.d100);this.s.current={instance:++this.s.serial,event:e,npc,resolved:false,building,entered:false,service:null,dialogue:e.kind==='followup'&&npc&&!['敵對','掠奪'].includes(npc.attitude),giftGiven:false,frame:frame.kind};nameEncounter(this.s);this.s.mode='event';this.s.dice={kind:'D100',value:draw.roll};this.s.seen.push(e.id);this.s.notice=fillStory(e.text,this.s,display);
 if(npc&&!building&&['敵對','掠奪'].includes(npc.attitude)){
  if(isSaint(this.s)){
   npc.sparedByReputation=true;this.s.current.dialogue=true;this.s.current.service='npc_trade';
   const q=rollMoralityAuthorQuip(this.s,'saint_spare');
   this.s.notice+=`\n${display(npc)}原本握緊武器準備動手，認出${heroShortName(this.s)}在公路上的善名後卻緩緩放下了手，願意坐下來好好談一談。`;
   if(q)appendMessage(this.s,'作者吐槽',q);
  }else this.beginCombat('character',null,npc);
 }
 else this.collectReward();
 }
 finishEvent(){if(this.s.mode!=='event'||this.s.current?.resolved)return;if(this.s.current?.event.options?.length&&!this.s.current.dialogue)return;this.s.current.resolved=true;const frame=this.s.frames.at(-1);if(!frame){this.completeStop();this.s.current=null;this.s.mode='ready';return;}const threshold=[75,50,25][frame.count-1];const roll=threshold?this.roll():100;this.s.dice={kind:'追加 D100',value:roll};this.log('停靠片刻',threshold&&roll<=threshold?`正準備發車時，${partyLabel(this.s)}又撞見了新的狀況。`:'收拾好行囊，這一站的小插曲總算翻篇了。');if(threshold&&roll<=threshold){this.nextEvent();return;}this.s.frames.pop();if(frame.kind==='building'){const parent=frame.parent;this.s.current=parent;this.s.current.entered=true;this.s.current.resolved=false;this.s.current.building=false;this.s.current.inside=false;this.s.mode='event';this.s.notice=`${partyLabel(this.s)}回到車旁。這棟建築的翻找已經告一段落。`;}else{this.completeStop();this.s.current=null;this.s.mode='ready';this.s.searched=false;this.s.notice='這次停靠已結束。'} }
 enterBuilding(){const c=this.s.current;if(this.s.mode!=='event'||!c?.building||c.entered)return false;c.entered=true;c.building=false;c.inside=true;this.s.notice=`${partyLabel(this.s)}推門走進`+(c.place?.name||c.event.title)+'。';if(c.npc&&['敵對','掠奪'].includes(c.npc.attitude)){if(isSaint(this.s)){c.npc.sparedByReputation=true;c.dialogue=true;c.service='npc_trade';this.s.notice+=`\n裡頭的${display(c.npc)}原本戒心滿滿，認出${heroShortName(this.s)}的好名聲後竟收起武器點頭致意。`;}else this.beginCombat('character',null,c.npc);}else this.collectReward();return true}
 exploreBuilding(){const c=this.s.current;if(this.s.mode!=='event'||!c?.inside||c.explored||c.event.options?.length)return false;c.explored=true;this.s.frames.push({kind:'building',count:0,scene:this.buildingScene(c.event),parent:clone(c)});this.nextEvent();return true}
 buildingScene(e){const t=e.title;return /醫|藥|診/.test(t)?'clinic':/修|車/.test(t)?'garage':/旅|客|休|驛/.test(t)?'hotel':/商|店|攤|市場/.test(t)?'shop':/研究|實驗/.test(t)?'laboratory':'warehouse'}
 currentScene(){if(this.s.current?.inside&&!this.s.battle)return this.buildingScene(this.s.current.event);if(this.s.battle)return this.s.battle.mode==='vehicle'?'road':this.s.frames.at(-1)?.scene||'ruin';if(this.s.frames.at(-1)?.kind==='building')return this.s.frames.at(-1).scene;return 'road'}
 options(){const c=this.s.current;if(!c)return [];
 if(c.carePending)return this.alive().filter(p=>p.hp<p.maxHp).map(p=>({id:'care_'+p.id,label:p.name+' · 生命 '+p.hp+'/'+p.maxHp,requires:[],effects:[]}));
 if(c.building)return [{id:'enter',label:'下車進入建築',requires:[],effects:[]},{id:'pass',label:'留在車上，略過此處',requires:[],effects:[]}];return c.event.options||[]}
 choose(id){if(this.s.mode!=='event')return false;const c=this.s.current;if(c.resolved)return false;
 if(id==='reward_specialist'&&!c.building&&c.event.options?.length){
  const p=this.rewardSpecialist();return !!p&&this.selectActor(p.id)&&this.traitAction(c.event.reward_alternative);
 }
 if(!c.building&&id===c.event.automatic_reward)return this.collectReward(null,true);if(c.carePending)return id.startsWith('care_')&&this.collectReward(id.slice(5));if(c.building){if(id==='enter')return this.enterBuilding();if(id==='pass'){c.building=false;c.event.options=[];this.finishEvent();return true;}}
 const o=c.event.options?.find(x=>x.id===id);if(!o||!this.afford(o.requires))return false;if(o.requires?.some(x=>x.free_seats)&&this.s.party.length>=this.partyLimit())return false;
 // Resolve each option exactly once; service / battle owns the continuation.
 c.event.options=[];this.s.notice=/試玩|草案|依選項結算|依所選事件/.test(o.result_text||'')?`${partyLabel(this.s)}處理完了眼前的狀況。`:fillStory(o.result_text||'',this.s,display);for(const f of o.effects){this.effect(f);if(this.s.mode==='ending')break;}
 if(!o.effects.length)this.tell(o.label.includes('離開')||o.id==='skip'?`${partyLabel(this.s)}沒有多作停留。`:'這裡沒有更多發現。');if(this.s.mode==='event'&&!c.service&&!c.dialogue)this.s.notice+=`\n${partyLabel(this.s)}拍拍灰塵收拾好行囊。`;return true;
 }
 rewardSpecialist(){
  const job=this.s.current?.event?.reward_alternative;
  return job&&this.alive().find(p=>!p.asleep&&p.profession===job);
 }
 collectReward(recipientId=null,chosen=false){
  const s=this.s,c=s?.current;
  if(s?.mode!=='event'||!c||c.resolved||c.building||c.rewardReceipt)return false;
  const key=c.event?.automatic_reward;
  const option=key&&c.event.options?.find(o=>o.id===key);
  if(!option)return false;
  // A specialist may use time for a different or guaranteed result.
  if(!chosen&&this.rewardSpecialist())return false;
  let recipient=null;
  if(option.effects.some(f=>f.op==='heal'&&f.target!=='vehicle')){
   const injured=this.alive().filter(p=>p.hp<p.maxHp);
   if(recipientId){recipient=injured.find(p=>p.id===recipientId);if(!recipient)return false;}
   else if(injured.length>1){c.carePending=true;s.notice='有好幾位隊員受傷，想讓誰接受治療？';return false;}
   else recipient=injured[0];
  }
  c.event.options=[];delete c.carePending;
  c.searching=!c.npc&&(/search|take|open|salvage/.test(key)||/搜|回收/.test(option.label));
  const result=option.effects.map(f=>this.rewardResult(f,recipient)).join('');
  c.rewardReceipt=result;
  const greeting=c.npc?display(c.npc)+' · '+npcDemeanor(c.npc,{seed:s.seed})+'\n':'';
  s.notice=greeting+result;this.log(c.event.title,s.notice);
  return true;
 }
 // Produce the receipt from the same values that enter inventory or restore HP.
 rewardResult(f,recipient){
  if(f.op==='resource'){
   const key=f.key||f.resource;
   let n=f.amount;
   if(key==='scrap'&&this.s.current?.searching){
    const p=this.actor();n=Math.max(0,n+(p?.profession==='scavenger'?1:0)-(p?.flaw==='distracted'?1:0));
   }
   this.add(key,n);
   const name={fuel:'汽油',scrap:'廢料',medicine:'藥品'}[key]||'物資';
   return n?'獲得'+name+' ×'+n+'。':'沒有找到可用的'+name+'。';
  }
  if(f.op==='heal'){
   const vehicle=f.target==='vehicle',target=vehicle?this.s.vehicle:recipient;
   if(!target)return '全隊生命值已滿，無須治療。';
   const restored=Math.min(f.amount,target.maxHp-target.hp);target.hp+=restored;
   if(vehicle)return restored?'免費修復車況 +'+restored+'（'+target.hp+'/'+target.maxHp+'）。':'車況完好，無須維修。';
   return display(target)+'恢復 '+restored+' 點生命（'+target.hp+'/'+target.maxHp+'）。';
  }
  if(f.op==='event_check'){
   const {effects}=this.checkEffects(f);
   return effects.length?effects.map(effect=>this.rewardResult(effect,recipient)).join(''):'衣櫃的鎖沒能打開，沒有取得物品。';
  }
  const row=this.oracle(f.table);
  if(f.table==='supplies')return row.effects.map(effect=>this.rewardResult(effect,recipient)).join('');
  if(f.table==='equipment'){
   const eqId=typeof row.value==='string'?row.value:row.value?.id;
   const item=ITEMS[eqId];
   if(item){
    this.s.inventory.push(eqId);
    return '獲得'+item.name+' ×1。';
   }
   this.add('scrap',2);
   return '獲得廢料 ×2。';
  }
  if(f.table==='vehicle'){
   const v=row.value,model=this.d.assets.vehicles[v.id]?v.id:'sedan';
   this.s.offerVehicle={model,hp:v.max_health,maxHp:v.max_health,mods:[],fuel:v.fuel};
   return '發現可以行駛的'+v.name+'，車內還有 '+v.fuel+' 點汽油。';
  }
  throw Error('Unknown reward table '+f.table);
 }
 effect(f){const p=this.actor();if(!p){this.end(false,'車內再也沒有人能繼續旅程。');return;}
 switch(f.op){
 case 'resource':{const n=f.amount;if(n>0){this.tell(this.rewardResult(f));break;}this.add(f.key,n);this.tell(`${{fuel:'汽油',scrap:'廢料',medicine:'藥品'}[f.key]} ${n>=0?'+':''}${n}`);break;}
 case 'resource_loss':this.add(f.key,-f.amount);this.tell(`損失 ${f.amount} 點${f.key==='fuel'?'汽油':'物資'}。`);break;
 case 'world_minutes':this.s.minutes+=f.amount;break;
 case 'open_service':this.openService(f.service);break;
 case 'npc_interaction':this.interact(f.service);break;
 case 'recruit':case 'offer_recruit':this.recruit();break;
 case 'reveal_history':this.reveal();break;
 case 'oracle':{if(['equipment','supplies','vehicle'].includes(f.table)){this.tell(this.rewardResult(f));break;}const r=this.oracle(f.table);if(r.effects)r.effects.forEach(x=>this.effect(x));else if(f.table==='reunion')r.effects?.forEach(x=>this.effect(x));else if(r.value)this.tell(typeof r.value==='string'?r.value:'有所發現。');if(r.text)this.tell(r.text);break;}
 case 'combat':this.beginCombat(f.mode,f.enemy_category);break;
 case 'attempt_escape':{const escP=this.actor();const chance=clamp(45+(escP?this.stat(escP,'speed')*2:10),5,95);if(this.roll()<=chance){const msg=`我方撤離：${partyLabel(this.s)}趁敵人尚未合圍，搶先拉開距離成功脫離現場。`;this.log('成功撤離',msg);this.s.notice=msg;if(this.s.current){this.s.current.event.options=[];this.s.current.dialogue=false;this.s.current.service=null;}}else{this.log('撤離失敗',`${partyLabel(this.s)}試圖搶先脫離，但被敵人攔住了去路，被迫迎戰！`);this.beginCombat(f.mode);}break;}
 case 'damage':{const targets=['party','exploring_party'].includes(f.target)?this.alive():f.target==='vehicle'?[]:[p];if(f.target==='vehicle'){this.s.vehicle.hp=Math.max(0,this.s.vehicle.hp-f.amount);this.tell(`車輛損傷 ${f.amount}。`)}else targets.forEach(q=>this.hurt(q,f.amount,f.tags||[]));break;}
 case 'heal':if(f.target==='vehicle'){this.s.vehicle.hp=clamp(this.s.vehicle.hp+f.amount,0,this.s.vehicle.maxHp);this.tell('車輛得到修復。')}else{p.hp=clamp(p.hp+f.amount,0,p.maxHp);this.tell(display(p)+'恢復了生命。')}break;
 case 'stamina_cost':p.st=Math.max(0,p.st-f.amount);break;
 case 'travel_cost':this.add('fuel',-f.fuel);this.tell('為了繞行消耗了額外汽油。');break;
 case 'schedule_followup':this.schedule(this.s.current.npc,false);break;
 case 'event_check':{
  const {success,effects}=this.checkEffects(f);
  this.tell(success?'處理成功。':'處理失敗。');effects.forEach(effect=>this.effect(effect));break;
 }
 default:throw Error('Unimplemented effect '+f.op);
 }this.checkAlive();}
 interact(service=null){const c=this.s.current;if(!c.npc)c.npc=this.person();if(['敵對','掠奪'].includes(c.npc.attitude)){this.beginCombat('character',null,c.npc);return;}c.dialogue=true;c.service=service||null;this.s.notice=`${display(c.npc)}
${npcDemeanor(c.npc,{seed:this.s.seed})}`;}
 openService(service){this.interact(service)}
 recruit(){const c=this.s.current,p=c?.npc;if(!p)return false;if(this.s.party.some(q=>q.id===p.id))return false;if(this.s.party.length>=this.partyLimit()){this.tell(this.s.party.length>=MAX_PARTY?'隊伍最多 4 人，無法再邀請同伴。':'沒有空座位，無法邀請同行。');return false;}if(['敵對','掠奪'].includes(p.attitude)){this.beginCombat('character',null,p);return false;}this.s.party.push(p);c.npc=null;c.dialogue=false;this.tell(display(p)+'加入了隊伍。');return true;}
 schedule(p,hostile=false){if(!p)return;this.s.pending.push({id:'f'+(++this.s.serial),event:'former_companion',actor:clone(p),hostile,after:this.s.stop+1})}
 dismiss(id){if(id===this.s.protagonistId||this.s.party.length<=1)return false;const p=this.s.party.find(p=>p.id===id);if(!p)return false;this.s.party=this.s.party.filter(q=>q.id!==id);this.s.departed.push(p);const roll=this.roll();if(roll<=80)this.schedule(p,roll>55);if(this.s.driver===id)this.s.driver=this.alive()[0]?.id;this.tell(`${display(p)}帶著身上的裝備離開。${roll>80?'從此失去消息。':'往後也許會再次相遇。'}`);return true;}
 changeDriver(id){if(!['ready','event'].includes(this.s.mode)||this.s.battle)return false;const p=this.s.party.find(p=>p.id===id&&p.hp>0&&p.st>0);if(!p)return false;this.s.driver=id;this.tell(display(p)+'接手駕駛。');return true;}
 reveal(){const w=this.s.world;const texts=[`現在是 ${w.currentYear} 年，外星統治的第十年。${w.year} 年，${w.faction}出現在天空。${w.process}。`,w.trace,`《${w.archive}》記載：部分先遣族拒絕繼續執行佔領命令。`,`變種人最早出現在改造物質散布區。變異並不意味著效忠入侵者。`,`最後的廣播把東方的水源地稱為「末日綠洲」。`];const t=texts.find(x=>!this.s.history.includes(x));if(t){this.s.history.push(t);this.tell(t)}else this.tell('這段文字印證了你已知的歷史。');}
 useMedicine(id){const p=this.s.party.find(q=>q.id===id);if(!p||p.hp<=0||p.hp>=p.maxHp||this.s.resources.medicine<1)return false;this.add('medicine',-1);const actor=this.actor(),medic=actor?.profession==='medic',chem=actor?.profession==='chemist',gearBonus=Object.values(actor?.gear||{}).reduce((s,g)=>s+(ITEMS[g]?.healBonus||0),0);p.hp=clamp(p.hp+8+(medic?2:0)+(chem?1:0)+gearBonus-(p.flaw==='slow_healing'?1:0),0,p.maxHp);this.tell(display(p)+'使用藥品恢復生命。');return true;}
 equip(id,item){if(this.s.battle)return false;const p=this.s.party.find(q=>q.id===id),ix=this.s.inventory.indexOf(item),it=ITEMS[item];if(!p||!it||ix<0)return false;this.s.inventory.splice(ix,1);if(p.gear[it.slot])this.s.inventory.push(p.gear[it.slot]);p.gear[it.slot]=item;return true;}
 price(base){const p=this.actor();const disc=p?.profession==='merchant'?.1:p?.profession==='diplomat'?.05:0;return Math.max(1,Math.ceil(base*(1+(p?.flaw==='bad_bargain'?.1:0)-disc)))}
 buy(kind,id){const c=this.s.current;if(!c?.service||!c.dialogue||this.s.mode!=='event')return false;const shop=c.service;let price=0;
 if(kind==='fuel'&&['fuel_shop','general_shop'].includes(shop))price=this.price(3);
 if(kind==='medicine'&&['pharmacy','general_shop','clinic'].includes(shop))price=this.price(2);
 if(kind==='item'&&['equipment_shop','general_shop'].includes(shop)&&ITEMS[id])price=this.price(ITEMS[id].price);
 if(kind==='repair'&&shop==='garage')price=2;
 if(kind==='mod'&&shop==='garage'&&MODS[id]){if(id==='seat'&&this.seats()>=MAX_PARTY)return false;if(this.s.vehicle.mods.length>=this.d.assets.vehicles[this.s.vehicle.model].modSlots)return false;price=MODS[id].price;}
 if(kind==='heal'&&shop==='clinic')price=2;
 if(kind==='hotel'&&shop==='hotel')price=3;
 if(kind==='vehicle'&&shop==='vehicle_shop'&&this.d.assets.vehicles[id])price=this.price(10+this.d.assets.vehicles[id].seats*2);
 if(!price||this.s.resources.scrap<price)return false;this.add('scrap',-price);
 if(kind==='fuel')this.add('fuel',10);if(kind==='medicine')this.add('medicine',1);if(kind==='item')this.s.inventory.push(id);if(kind==='repair'){this.s.vehicle.hp=clamp(this.s.vehicle.hp+10+(this.actor()?.profession==='mechanic'?3:0),0,this.s.vehicle.maxHp);this.s.vehicle.weaponDamaged=false;this.s.vehicle.armorDamaged=0;}if(kind==='mod')this.s.vehicle.mods.push(id);if(kind==='heal')this.alive().forEach(p=>p.hp=clamp(p.hp+8,0,p.maxHp));if(kind==='hotel')this.sleep(null,true);if(kind==='vehicle'){const v=this.d.assets.vehicles[id];this.s.offerVehicle={model:id,hp:v.maxHealth,maxHp:v.maxHealth,mods:[],fuel:8};}this.tell('交易完成。');return true;}
 replaceVehicle(){const offer=this.s.offerVehicle;if(!offer)return false;const seats=Math.min(MAX_PARTY,this.d.assets.vehicles[offer.model].seats);if(this.s.party.length>seats){this.tell(`新車只有 ${seats} 席，請先遣散多出的同伴。`);return false;}this.s.vehicle={model:offer.model,hp:offer.hp,maxHp:offer.maxHp,mods:[]};this.add('fuel',offer.fuel);this.s.offerVehicle=null;this.tell('換上新車。舊車的固定改裝留在原車上。');return true;}
 searchStranded(forced=false){if(this.s.mode!=='ready'||this.s.searched&&!forced)return false;if(!forced&&this.s.resources.fuel>0&&this.s.vehicle.hp>0)return false;this.s.searched=true;this.s.minutes+=60;const r=this.oracle('salvage');this.s.dice={kind:'求生 D100',value:r.roll};this.s.mode='event';this.s.current={event:{id:'stranded_search',title:'尋找出路',text:r.text,options:[]},resolved:false,npc:null};r.effects?.forEach(f=>this.effect(f));this.tell(r.text);this.s.strandedSearch=true;return true;}
 resolveSearch(){if(!this.s.strandedSearch)return;this.s.strandedSearch=false;if(this.s.resourceBlock){const original=this.s.resourceBlock;this.s.resourceBlock=null;this.s.current=original;if(original.event.options.some(o=>this.canChoose(o))){this.s.mode='event';this.tell(`剛搜刮來的物資剛好夠${partyLabel(this.s)}回頭處理眼前的路障。`);}else this.end(false,fillStory(this.oracle('stranded_ending').value,this.s,display));return;}this.s.current=null;if(this.s.resources.fuel<=0||this.s.vehicle.hp<=0)this.end(false,fillStory(this.oracle('stranded_ending').value,this.s,display));else this.s.mode='ready';}
 sleep(watchId=null,safe=false){if(!['ready','event'].includes(this.s.mode)||this.s.battle)return false;const guard=this.s.party.find(p=>p.id===watchId&&p.st>0&&p.hp>0);const can=this.alive();if(!can.length)return false;const before=this.s.mode;this.s.minutes+=240;can.forEach(p=>{p.asleep=p!==guard;if(p!==guard){p.st=clamp(p.st+16-(p.flaw==='restless'?1:0),0,p.maxSt);p.esp=p.maxEsp;if(p.race==='symbiote')p.hp=clamp(p.hp+2,0,p.maxHp)}else p.st=Math.max(0,p.st-4)});
 this.log('睡眠',guard?`${display(guard)}守夜，其他人休息四小時。`:'全員睡了四小時，沒有人守夜。');
 if(!safe&&this.roll()<=30){this.beginCombat('character');this.s.battle.resume=before;this.s.battle.sleepAttack=true;this.s.battle.watchId=guard?.id;if(!guard)this.enemyTurn(true);this.s.notice=guard?'守夜者察覺了敵人！':'睡夢中遭遇襲擊，敵方先攻一輪！';}else{can.forEach(p=>p.asleep=false);this.tell('這段休息平安度過。')}return true;}

 hurt(p,n,tags=[]){const wasAlive=p.hp>0;let v=n;const antiPoll=Object.values(p.gear||{}).reduce((s,g)=>s+(ITEMS[g]?.antiPollution||0),0);if(tags.includes('pollution'))v+=(p.race==='mutant'?-2:0)+(p.profession==='chemist'?-1:0)-antiPoll+(p.flaw==='chemical_sensitive'?1:0);if(tags.includes('physical')&&p.race==='chitin')v--;p.hp=Math.max(0,p.hp-Math.max(0,v));if(tags.includes('attack')){if(p.asleep&&p.flaw==='startled_awake')p.startled=true;p.asleep=false;}this.log('受傷',`${display(p)}受到 ${Math.max(0,v)} 傷害${p.hp<=0?'，倒下了':''}。`);if(wasAlive&&p.hp<=0&&this.alive().length>0){const q=rollBattleAuthorQuip(this.s,'down',{who:display(p)});if(q)appendMessage(this.s,'作者吐槽',q);}}
 checkAlive(){if(!this.alive().length){const q=rollBattleAuthorQuip(this.s,'wipe');const base='最後一位旅人也倒下了。破車孤零零停在公路中央，看來我這本向東的故事書只能寫到這一頁了。';this.end(false,q?`${base}\n${q}`:base);}}
 beginCombat(mode='character',category=null,npc=null){const p=this.actor();if(!p)return;const enemies=category==='finalBoss'?[]:makeRegionalEnemies(this,mode,npc,{clone,display},category);this.s.battle={mode,enemies,ambush:/伏|突襲|狙擊/.test(this.s.current?.event.title||''),round:1,defend:false,resume:this.s.mode==='ready'?'ready':'event',usedHunter:[],guardUsed:[],shield:0};this.s.mode='combat';this.s.notice=mode==='vehicle'?'車輛戰鬥開始。':'人物戰鬥開始。';}
 finishCombat(win){const b=this.s.battle;this.s.battle=null;this.s.mode=b.resume||'event';this.s.party.forEach(p=>p.asleep=false);if(this.s.current&&!b.sleepAttack){this.s.current.event.options=[];this.s.current.dialogue=false;this.s.current.service=null;}this.checkAlive();}
}

installCombat(Game,{learned,POWERS,ITEMS,clamp,display});

installTraits(Game,{clamp,display,clone});

installNpcs(Game,{clone,display,ITEMS});

installDialogue(Game,{display});

installProgression(Game,{display,learned});

installAutomaticJourney(Game,{display});

installVehicles(Game);
installOrigins(Game);
installMorality(Game,{ITEMS,clamp,display,clone});
