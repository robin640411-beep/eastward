import {installNpcs} from './npc-runtime.js';
import {installTraits} from './traits-runtime.js';
import {installCombat} from './combat.js';
// 一路向東 — deterministic state machine. No network or AI in gameplay.
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const clone=x=>JSON.parse(JSON.stringify(x));
export const phase=m=>{const h=Math.floor(m/60)%24;return h<5||h>=18?'night':h<8?'dawn':h<12?'morning':'afternoon'};
export const phaseName=m=>({night:'夜晚',dawn:'清晨',morning:'上午',afternoon:'下午'}[phase(m)]);
export const display=p=>`「${p.nickname}」${p.name}`;
export const ITEMS={club:{name:'球棒',slot:'武器',attack:2,price:3},pistol:{name:'舊手槍',slot:'武器',attack:4,price:7,ranged:true},coat:{name:'厚外套',slot:'防具',defense:1,price:3},vest:{name:'防護背心',slot:'防具',defense:3,price:8},tools:{name:'工具組',slot:'配件',defense:1,price:4},charm:{name:'共鳴石',slot:'配件',psyche:2,price:6}};
export const MODS={gun:{name:'車載機槍',price:7},armor:{name:'外掛裝甲',price:5},seat:{name:'額外座位',price:4},lamp:{name:'車頂探照燈',price:4}};
export const BUILDING_ROADS=new Set([1,2,3,4,5,14,15,21,25,26,28,29,34,35,36,37,38,39,40,44,45,48]);
export const POWERS={
 human:[['念力推擊','strike'],['心靈復原','heal'],['意志屏障','shield']],alien:[['星芒','strike'],['靜默波','stun'],['腦域風暴','burst']],mutant:[['異變衝擊','strike'],['再生','heal'],['畸變爆發','burst']],synth:[['脈衝','strike'],['反應護盾','shield'],['系統震盪','stun']],uplift:[['野性共鳴','strike'],['生命回聲','heal'],['心靈嚎叫','burst']],chitin:[['碎甲念波','strike'],['甲殼屏障','shield'],['鎮壓','stun']],mycelial:[['孢子念波','strike'],['菌網修復','heal'],['眠霧','stun']],crystal:[['晶芒','strike'],['折射屏障','shield'],['共振崩解','burst']],amphibian:[['潮汐衝擊','strike'],['潮生修復','heal'],['深水屏障','shield']],mimic:[['幻影刺擊','strike'],['感官錯置','stun'],['幻象屏障','shield']],symbiote:[['共生鞭擊','strike'],['生命縫合','heal'],['雙重意識','shield']],lumen:[['光束','strike'],['溫光','heal'],['極光爆發','burst']]};
export function learned(p){return POWERS[p.race].map(([name,type],i)=>({id:i,name,type,level:[1,3,5][i],cost:[3,4,7][i]})).filter(x=>p.level>=x.level)}
export class Game{
 constructor(data,state=null){this.d=data;this.s=state;}
 roll(sides=100){let x=this.s.rng>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;this.s.rng=x>>>0||1;return (this.s.rng%sides)+1;}
 pick(arr){return arr[this.roll(arr.length)-1]}
 oracle(id){const t=this.d.oracles.tables.find(t=>t.id===id);if(!t)throw Error('Missing oracle '+id);const n=this.roll();const r=t.rows.find(r=>n>=r.min&&n<=r.max);return {...clone(r),roll:n}}
 person(race=null,job=null){const p={id:'p'+(++this.s.serial),name:this.oracle('npc_name').value,nickname:this.oracle('npc_nickname').value,race:race||this.oracle('npc_race').value,profession:job||this.oracle('npc_profession').value,attitude:this.oracle('npc_attitude').value,flaw:this.oracle('npc_flaw').value,level:1,xp:0,asleep:false,gear:{武器:'club',防具:'coat',配件:null}};p.maxHp=24+(p.flaw==='frail'?-2:0);p.maxSt=24+(p.flaw==='low_endurance'?-2:0);p.maxEsp=10;p.hp=p.maxHp;p.st=p.maxSt;p.esp=p.maxEsp;return p;}
 start({seed=Date.now(),race='human',profession='driver'}={}){this.s={version:1,rng:Number(seed)>>>0||1,seed:Number(seed),serial:0,progress:1,minutes:480,stop:0,mode:'ready',party:[],driver:null,resources:{fuel:24,scrap:8,medicine:3},inventory:['pistol','tools'],vehicle:{model:'compact',hp:24,maxHp:24,mods:[]},departed:[],pending:[],frames:[],current:null,battle:null,logs:[],history:[],seen:[],dice:null,travel:null,notice:'旅程從這裡開始。向東，直到看見綠洲。',end:null};const p=this.person(race,profession);p.attitude='友善';this.s.party=[p];this.s.driver=p.id;const hist=this.oracle('invasion_history').value;this.s.world={...hist,year:2070+this.roll(30),faction:this.pick(['先遣聯軍','軌道議會','遠征監督局','星門軍團']),archive:this.pick(['灰塔紀錄','最後的民防日誌','失落電台檔案','撤離列車手記'])};this.log('開始旅程',`${display(p)}踏上了往東的路。`);return this.s;}
 alive(){return this.s.party.filter(p=>p.hp>0)}
 actor(){return this.alive().find(p=>!p.asleep)||this.alive()[0]}
 driver(){return this.alive().find(p=>p.id===this.s.driver)||this.alive()[0]}
 seats(){return this.d.assets.vehicles[this.s.vehicle.model].seats+this.s.vehicle.mods.filter(x=>x==='seat').length}
 stat(p,k){let n={attack:5,defense:2,speed:5,psyche:5}[k]+p.level-1;for(const id of Object.values(p.gear))n+=ITEMS[id]?.[k]||0;if(k==='speed'&&p.flaw==='slow_reflex')n--;return Math.max(1,n)}
 log(title,text){this.s.logs.unshift({title,text,minutes:this.s.minutes,progress:this.s.progress});this.s.logs=this.s.logs.slice(0,100)}
 tell(text){this.s.notice=text;this.log('旅途紀錄',text)}
 afford(req){return req.every(r=>r.free_seats?this.s.party.length+r.free_seats<=this.seats():this.s.resources[r.resource]>=r.minimum)}
 add(key,n){this.s.resources[key]=Math.max(0,(this.s.resources[key]||0)+n)}
 travelCost(n,p=this.driver()){if(!n)return {fuel:0,st:0};let st=n*(phase(this.s.minutes)==='night'?2:1)+(p.flaw==='night_strain'&&phase(this.s.minutes)==='night'?1:0)+(p.flaw==='poor_driver'?1:0)-(p.profession==='driver'?1:0);return {fuel:n+(p.flaw==='wasteful_driver'?1:0),st:Math.max(1,st)}}
 canDrive(){const p=this.driver();return this.s.mode==='ready'&&p&&p.st>0&&this.s.resources.fuel>0&&this.s.vehicle.hp>0&&this.s.party.length<=this.seats()}
 depart(){if(!this.canDrive())return false;const die=this.roll(10);let n=Math.min(die,100-this.s.progress);const p=this.driver();while(n>0){const c=this.travelCost(n,p);if(c.fuel<=this.s.resources.fuel&&c.st<=p.st)break;n--;}
 if(!n){this.tell('現有燃料或駕駛體力不足以再前進一步。');return false;}const cost=this.travelCost(n,p);this.s.travel={die,n,cost,driver:p.id};this.s.mode='driving';this.s.dice={kind:'D10',value:die};this.s.notice=this.ambient();return true;}
 ambient(){const lines=this.s.party.length>1?['「下一個有燈的地方，我們就看看。」','「等到了東邊，你最想做什麼？」','車裡的人聊起了災難之前的生活。','同伴看著窗外，誰也沒有說話。']:['「再往前一點。」','收音機只傳來斷續的雜音。','你想起了很久以前的一段路。','引擎聲填滿了車內的安靜。'];return this.pick(lines)}
 previewArrival(){if(this.s.mode!=='driving')return null;const copy=clone(this.s);delete copy.travel.preview;const future=new Game(this.d,copy);future.arrive();return {current:clone(future.s.current),battle:clone(future.s.battle),ending:clone(future.s.end),progress:future.s.progress,minutes:future.s.minutes};}
 arrive(){if(this.s.mode!=='driving')return;const t=this.s.travel,p=this.s.party.find(p=>p.id===t.driver);this.add('fuel',-t.cost.fuel);p.st=Math.max(0,p.st-t.cost.st);this.s.party.forEach(q=>{if(q.id!==p.id&&q.hp>0)q.st=clamp(q.st+t.n,0,q.maxSt)});this.s.progress+=t.n;this.s.minutes+=60;this.s.travel=null;this.log('向東行駛',`又走過一段公路。汽油 −${t.cost.fuel}，駕駛體力 −${t.cost.st}。`);if(this.s.progress>=100){this.end(true,'道路盡頭，樹蔭與清水出現在眼前。你終於抵達末日綠洲。');return;}this.s.stop++;this.s.usedStory=[];this.s.frames=[{kind:'road',count:0,scene:null}];this.nextEvent();}
 end(win,text){this.s.mode='ending';this.s.end={win,text};this.s.battle=null;this.log(win?'抵達綠洲':'旅程結束',text)}
 nextEvent(){const frame=this.s.frames.at(-1);if(!frame){this.s.mode='ready';this.s.current=null;this.s.searched=false;this.s.notice='整理好隊伍，準備繼續向東。';return;}frame.count++;const tab=frame.kind==='building'?'building_event':'road_event';const draw=this.oracle(tab);let e=clone((frame.kind==='building'?this.d.buildings:this.d.events).events.find(e=>e.id===draw.event));let npc=null;
 if(frame.kind==='road'||frame.kind==='building'){
 const pending=this.s.pending.filter(x=>x.after<=this.s.stop&&!this.s.usedStory.includes(x.id));
 if(pending.length&&this.roll()<=15){const f=this.pick(pending);e={id:f.event,title:'再度相遇',text:`${display(f.actor)}在路邊認出了你的車。${f.actor.memories?.at(-1)||'你記得這位曾經相遇的旅人。'}`,kind:'followup',options:[]};npc=clone(f.actor);npc.attitude=f.hostile?'敵對':'同情';this.s.usedStory.push(f.id);this.s.pending=this.s.pending.filter(x=>x.id!==f.id);}
 }
 if(!npc&&e.bindings?.npc)npc=this.person();const building=frame.kind==='road'&&BUILDING_ROADS.has(e.d100);this.s.current={instance:++this.s.serial,event:e,npc,resolved:false,building,entered:false,service:null,dialogue:e.kind==='followup'&&npc&&!['敵對','掠奪'].includes(npc.attitude),giftGiven:false,frame:frame.kind};this.s.mode='event';this.s.dice={kind:'D100',value:draw.roll};this.s.seen.push(e.id);this.s.notice=e.text.replace('{npc.display_name}',npc?display(npc):'旅人');
 if(npc&&!building&&['敵對','掠奪'].includes(npc.attitude))this.beginCombat('character',null,npc);
 }
 finishEvent(){if(this.s.mode!=='event'||this.s.current?.resolved)return;if(this.s.current?.event.options?.length&&!this.s.current.dialogue)return;this.s.current.resolved=true;this.gainXp(2);const frame=this.s.frames.at(-1);if(!frame){this.s.current=null;this.s.mode='ready';return;}const threshold=[75,50,25][frame.count-1];const roll=threshold?this.roll():100;this.s.dice={kind:'追加 D100',value:roll};this.log('停靠片刻',threshold&&roll<=threshold?'準備離開時，你們又有了新的發現。':'整理好行囊，這裡的事情已經告一段落。');if(threshold&&roll<=threshold){this.nextEvent();return;}this.s.frames.pop();if(frame.kind==='building'){const parent=frame.parent;this.s.current=parent;this.s.current.entered=true;this.s.current.resolved=false;this.s.current.building=false;this.s.current.inside=false;this.s.mode='event';this.s.notice='你們回到車旁。這棟建築的探索已結束。';}else{this.s.current=null;this.s.mode='ready';this.s.searched=false;this.s.notice='這次停靠已結束。'} }
 enterBuilding(){const c=this.s.current;if(this.s.mode!=='event'||!c?.building||c.entered)return false;c.entered=true;c.building=false;c.inside=true;this.s.notice='你們下車進入'+c.event.title+'。';if(c.npc&&['敵對','掠奪'].includes(c.npc.attitude))this.beginCombat('character',null,c.npc);return true}
 exploreBuilding(){const c=this.s.current;if(this.s.mode!=='event'||!c?.inside||c.explored||c.event.options?.length)return false;c.explored=true;this.s.frames.push({kind:'building',count:0,scene:this.buildingScene(c.event),parent:clone(c)});this.nextEvent();return true}
 buildingScene(e){const t=e.title;return /醫|藥|診/.test(t)?'clinic':/修|車/.test(t)?'garage':/旅|客|休|驛/.test(t)?'hotel':/商|店|攤|市場/.test(t)?'shop':/研究|實驗/.test(t)?'laboratory':'warehouse'}
 currentScene(){if(this.s.current?.inside&&!this.s.battle)return this.buildingScene(this.s.current.event);if(this.s.battle)return this.s.battle.mode==='vehicle'?'road':this.s.frames.at(-1)?.scene||'ruin';if(this.s.frames.at(-1)?.kind==='building')return this.s.frames.at(-1).scene;return 'road'}
 options(){const c=this.s.current;if(!c)return [];if(c.building)return [{id:'enter',label:'下車進入建築',requires:[],effects:[]},{id:'pass',label:'留在車上，略過此處',requires:[],effects:[]}];return c.event.options||[]}
 choose(id){if(this.s.mode!=='event')return false;const c=this.s.current;if(c.resolved)return false;if(c.building){if(id==='enter')return this.enterBuilding();if(id==='pass'){c.building=false;c.event.options=[];this.finishEvent();return true;}}
 const o=c.event.options?.find(x=>x.id===id);if(!o||!this.afford(o.requires))return false;if(o.requires?.some(x=>x.free_seats)&&this.s.party.length>=this.seats())return false;
 // Resolve each option exactly once; service / battle owns the continuation.
 c.event.options=[];this.s.notice=/試玩|草案|依選項結算|依所選事件/.test(o.result_text||'')?'你們完成了這次行動。':o.result_text||'';for(const f of o.effects){this.effect(f);if(this.s.mode==='ending')break;}
 if(!o.effects.length)this.tell(o.label.includes('離開')||o.id==='skip'?'你們沒有停留。':'這裡沒有更多發現。');if(this.s.mode==='event'&&!c.service&&!c.dialogue)this.s.notice+='\n處理完畢，可以繼續。';return true;
 }
 effect(f){const p=this.actor();if(!p){this.end(false,'車內再也沒有人能繼續旅程。');return;}
 switch(f.op){
 case 'resource':{let n=f.amount;if(f.key==='scrap'&&n>0){if(p.profession==='scavenger')n++;if(p.flaw==='distracted')n=Math.max(0,n-1)}this.add(f.key,n);this.tell(`${{fuel:'汽油',scrap:'廢料',medicine:'藥品'}[f.key]} ${n>=0?'+':''}${n}`);break;}
 case 'resource_loss':this.add(f.key,-f.amount);this.tell(`損失 ${f.amount} 點${f.key==='fuel'?'汽油':'物資'}。`);break;
 case 'world_minutes':this.s.minutes+=f.amount;break;
 case 'open_service':this.openService(f.service);break;
 case 'npc_interaction':this.interact(f.service);break;
 case 'recruit':case 'offer_recruit':this.recruit();break;
 case 'reveal_history':this.reveal();break;
 case 'oracle':{const r=this.oracle(f.table);if(r.effects)r.effects.forEach(x=>this.effect(x));else if(f.table==='equipment'){this.s.inventory.push(r.value.id);this.tell('獲得 '+r.value.name)}else if(f.table==='vehicle'){const model=this.d.assets.vehicles[r.value.id]?r.value.id:'sedan';this.s.offerVehicle={model,hp:r.value.max_health,maxHp:r.value.max_health,mods:[],fuel:r.value.fuel};this.tell('發現可以行駛的'+r.value.name+'。可以選擇換車。')}else if(f.table==='reunion')r.effects?.forEach(x=>this.effect(x));else if(r.value)this.tell(typeof r.value==='string'?r.value:'有所發現。');if(r.text)this.tell(r.text);break;}
 case 'combat':this.beginCombat(f.mode,f.enemy_category);break;
 case 'attempt_escape':this.beginCombat(f.mode);this.combatRound({type:'escape'});break;
 case 'damage':{const targets=['party','exploring_party'].includes(f.target)?this.alive():f.target==='vehicle'?[]:[p];if(f.target==='vehicle'){this.s.vehicle.hp=Math.max(0,this.s.vehicle.hp-f.amount);this.tell(`車輛損傷 ${f.amount}。`)}else targets.forEach(q=>this.hurt(q,f.amount,f.tags||[]));break;}
 case 'heal':if(f.target==='vehicle'){this.s.vehicle.hp=clamp(this.s.vehicle.hp+f.amount,0,this.s.vehicle.maxHp);this.tell('車輛得到修復。')}else{p.hp=clamp(p.hp+f.amount,0,p.maxHp);this.tell(display(p)+'恢復了生命。')}break;
 case 'stamina_cost':p.st=Math.max(0,p.st-f.amount);break;
 case 'travel_cost':this.add('fuel',-f.fuel);this.tell('為了繞行消耗了額外汽油。');break;
 case 'schedule_followup':this.schedule(this.s.current.npc,false);break;
 case 'event_check':{const special={mechanical_lock:'locksmith',electric:'electrician',explosive:'demolition',dark_search:'lumen',alarm:'scout'}[f.check];const skilled=this.alive().some(q=>!q.asleep&&(q.profession===special||q.race===special));const ok=this.roll()<= (skilled?90:55);this.tell(ok?'處理成功。':'處理失敗。');(ok?f.success_effects:f.failure_effects||[]).forEach(x=>this.effect(x));break;}
 default:throw Error('Unimplemented effect '+f.op);
 }this.checkAlive();}
 interact(service=null){const c=this.s.current;if(!c.npc)c.npc=this.person();if(['敵對','掠奪'].includes(c.npc.attitude)){this.beginCombat('character',null,c.npc);return;}c.dialogue=true;c.service=service||null;this.s.notice=`${display(c.npc)}看著你。態度：${c.npc.attitude}。`;}
 openService(service){this.interact(service)}
 talk(){const c=this.s.current;if(!c?.npc||!c.dialogue)return;this.s.minutes+=5;const p=c.npc;if(p.attitude==='同情'&&!c.giftGiven){c.giftGiven=true;if(this.roll()<=60-(this.actor()?.flaw==='abrasive'?10:0)){this.add('medicine',1);this.tell(`${display(p)}把一份藥品交給你：「路上小心。」`);return;}}
 this.tell(this.pick([`「${this.s.world.faction}來的那天，我也在路上。」`,'「東邊的人還在維持電台，我想那地方是真的。」','「我見過很多車開過去，有些再也沒有回來。」','「休息時找個人守夜，別拿命賭運氣。」']));}
 recruit(){const c=this.s.current,p=c?.npc;if(!p)return false;if(this.s.party.some(q=>q.id===p.id))return false;if(this.s.party.length>=this.seats()){this.tell('沒有空座位，無法邀請同行。');return false;}if(['敵對','掠奪'].includes(p.attitude)){this.beginCombat('character',null,p);return false;}this.s.party.push(p);c.npc=null;c.dialogue=false;this.tell(display(p)+'加入了隊伍。');return true;}
 schedule(p,hostile=false){if(!p)return;this.s.pending.push({id:'f'+(++this.s.serial),event:'former_companion',actor:clone(p),hostile,after:this.s.stop+1})}
 dismiss(id){if(this.s.party.length<=1)return false;const p=this.s.party.find(p=>p.id===id);if(!p)return false;this.s.party=this.s.party.filter(q=>q.id!==id);this.s.departed.push(p);const roll=this.roll();if(roll<=80)this.schedule(p,roll>55);if(this.s.driver===id)this.s.driver=this.alive()[0]?.id;this.tell(`${display(p)}帶著身上的裝備離開。${roll>80?'從此失去消息。':'往後也許會再次相遇。'}`);return true;}
 changeDriver(id){if(!['ready','event'].includes(this.s.mode)||this.s.battle)return false;const p=this.s.party.find(p=>p.id===id&&p.hp>0&&p.st>0);if(!p)return false;this.s.driver=id;this.tell(display(p)+'接手駕駛。');return true;}
 reveal(){const w=this.s.world;const texts=[`${w.year} 年，${w.faction}出現在天空。${w.process}。`,w.trace,`《${w.archive}》記載：部分先遣族拒絕繼續執行佔領命令。`,`變種人最早出現在改造物質散布區。變異並不意味著效忠入侵者。`,`最後的廣播把東方的水源地稱為「末日綠洲」。`];const t=texts.find(x=>!this.s.history.includes(x));if(t){this.s.history.push(t);this.tell(t)}else this.tell('這段文字印證了你已知的歷史。');}
 useMedicine(id){const p=this.s.party.find(q=>q.id===id);if(!p||p.hp<=0||p.hp>=p.maxHp||this.s.resources.medicine<1)return false;this.add('medicine',-1);const medic=this.actor()?.profession==='medic';p.hp=clamp(p.hp+8+(medic?2:0)-(p.flaw==='slow_healing'?1:0),0,p.maxHp);this.tell(display(p)+'使用藥品恢復生命。');return true;}
 equip(id,item){if(this.s.battle)return false;const p=this.s.party.find(q=>q.id===id),ix=this.s.inventory.indexOf(item),it=ITEMS[item];if(!p||!it||ix<0)return false;this.s.inventory.splice(ix,1);if(p.gear[it.slot])this.s.inventory.push(p.gear[it.slot]);p.gear[it.slot]=item;return true;}
 price(base){const p=this.actor();return Math.max(1,Math.ceil(base*(1+(p?.flaw==='bad_bargain'?.1:0)-(p?.profession==='merchant'?.1:0))))}
 buy(kind,id){const c=this.s.current;if(!c?.service||!c.dialogue||this.s.mode!=='event')return false;const shop=c.service;let price=0;
 if(kind==='fuel'&&['fuel_shop','general_shop'].includes(shop))price=this.price(3);
 if(kind==='medicine'&&['pharmacy','general_shop','clinic'].includes(shop))price=this.price(2);
 if(kind==='item'&&['equipment_shop','general_shop'].includes(shop)&&ITEMS[id])price=this.price(ITEMS[id].price);
 if(kind==='repair'&&shop==='garage')price=2;
 if(kind==='mod'&&shop==='garage'&&MODS[id]){if(this.s.vehicle.mods.length>=this.d.assets.vehicles[this.s.vehicle.model].modSlots)return false;price=MODS[id].price;}
 if(kind==='heal'&&shop==='clinic')price=2;
 if(kind==='hotel'&&shop==='hotel')price=3;
 if(kind==='vehicle'&&shop==='vehicle_shop'&&this.d.assets.vehicles[id])price=this.price(10+this.d.assets.vehicles[id].seats*2);
 if(!price||this.s.resources.scrap<price)return false;this.add('scrap',-price);
 if(kind==='fuel')this.add('fuel',10);if(kind==='medicine')this.add('medicine',1);if(kind==='item')this.s.inventory.push(id);if(kind==='repair')this.s.vehicle.hp=clamp(this.s.vehicle.hp+10+(this.actor()?.profession==='mechanic'?3:0),0,this.s.vehicle.maxHp);if(kind==='mod')this.s.vehicle.mods.push(id);if(kind==='heal')this.alive().forEach(p=>p.hp=clamp(p.hp+8,0,p.maxHp));if(kind==='hotel')this.sleep(null,true);if(kind==='vehicle'){const v=this.d.assets.vehicles[id];this.s.offerVehicle={model:id,hp:v.maxHealth,maxHp:v.maxHealth,mods:[],fuel:8};}this.tell('交易完成。');return true;}
 replaceVehicle(){const offer=this.s.offerVehicle;if(!offer)return false;const seats=this.d.assets.vehicles[offer.model].seats;if(this.s.party.length>seats){this.tell(`新車只有 ${seats} 席，請先遣散多出的同伴。`);return false;}this.s.vehicle={model:offer.model,hp:offer.hp,maxHp:offer.maxHp,mods:[]};this.add('fuel',offer.fuel);this.s.offerVehicle=null;this.tell('換上新車。舊車的固定改裝留在原車上。');return true;}
 searchStranded(forced=false){if(this.s.mode!=='ready'||this.s.searched&&!forced)return false;if(!forced&&this.s.resources.fuel>0&&this.s.vehicle.hp>0)return false;this.s.searched=true;this.s.minutes+=60;const r=this.oracle('salvage');this.s.dice={kind:'求生 D100',value:r.roll};this.s.mode='event';this.s.current={event:{title:'尋找出路',text:r.text,options:[]},resolved:false,npc:null};r.effects?.forEach(f=>this.effect(f));this.tell(r.text);this.s.strandedSearch=true;return true;}
 resolveSearch(){if(!this.s.strandedSearch)return;this.s.strandedSearch=false;if(this.s.resourceBlock){const original=this.s.resourceBlock;this.s.resourceBlock=null;this.s.current=original;if(original.event.options.some(o=>this.canChoose(o))){this.s.mode='event';this.tell('找到的物資讓你們能繼續處理路障。');}else this.end(false,this.oracle('stranded_ending').value);return;}this.s.current=null;if(this.s.resources.fuel<=0||this.s.vehicle.hp<=0)this.end(false,this.oracle('stranded_ending').value);else this.s.mode='ready';}
 sleep(watchId=null,safe=false){if(!['ready','event'].includes(this.s.mode)||this.s.battle)return false;const guard=this.s.party.find(p=>p.id===watchId&&p.st>0&&p.hp>0);const can=this.alive();if(!can.length)return false;const before=this.s.mode;this.s.minutes+=240;can.forEach(p=>{p.asleep=p!==guard;if(p!==guard){p.st=clamp(p.st+16-(p.flaw==='restless'?1:0),0,p.maxSt);p.esp=p.maxEsp;if(p.race==='symbiote')p.hp=clamp(p.hp+2,0,p.maxHp)}else p.st=Math.max(0,p.st-4)});
 this.log('睡眠',guard?`${display(guard)}守夜，其他人休息四小時。`:'全員睡了四小時，沒有人守夜。');
 if(!safe&&this.roll()<=30){this.beginCombat('character');this.s.battle.resume=before;this.s.battle.sleepAttack=true;this.s.battle.watchId=guard?.id;if(!guard)this.enemyTurn(true);this.s.notice=guard?'守夜者察覺了敵人！':'睡夢中遭遇襲擊，敵方先攻一輪！';}else{can.forEach(p=>p.asleep=false);this.tell('這段休息平安度過。')}return true;}
 gainXp(n){for(const p of this.alive()){p.xp+=n;while(p.xp>=p.level*10){p.xp-=p.level*10;p.level++;p.maxHp+=3;p.hp=Math.min(p.maxHp,p.hp+3);p.maxSt++;p.st=Math.min(p.maxSt,p.st+1);p.maxEsp+=2;p.esp=Math.min(p.maxEsp,p.esp+2);this.log('等級提升',`${display(p)}升至 ${p.level} 級。`);}}}
 hurt(p,n,tags=[]){let v=n;if(tags.includes('pollution'))v+= (p.race==='mutant'?-2:0)+(p.flaw==='chemical_sensitive'?1:0);if(tags.includes('physical')&&p.race==='chitin')v--;p.hp=Math.max(0,p.hp-Math.max(0,v));if(tags.includes('attack')){if(p.asleep&&p.flaw==='startled_awake')p.startled=true;p.asleep=false;}this.log('受傷',`${display(p)}受到 ${Math.max(0,v)} 傷害${p.hp<=0?'，倒下了':''}。`);}
 checkAlive(){if(!this.alive().length)this.end(false,'最後一位旅人倒下了。車停在公路上，東方的燈仍在遠處。');}
 beginCombat(mode='character',category=null,npc=null){const p=this.actor();if(!p)return;const lvl=Math.max(1,Math.floor(this.s.progress/25)+1);const keys=Object.keys(this.d.assets.enemies).filter(k=>category==='machine'?this.d.assets.enemies[k].machine:!this.d.assets.enemies[k].machine);const period=phase(this.s.minutes);const pool=keys.filter(k=>period==='night'?['lurker','infected','crawler','parasite','hound','swarm','drone','sentinel'].includes(k):period==='dawn'?['hound','wing','worker','scout','raider','mutant'].includes(k):period==='morning'?['soldier','raider','turret','worker','brute','nest'].includes(k):['mutant','brute','wing','sentinel','drone','soldier'].includes(k));const title=this.s.current?.event.title||'';const matched=/巢|孵化|寄生/.test(title)?'parasite':/殭屍|感染/.test(title)?'infected':/巨獸|守衛/.test(title)?'brute':/食腐/.test(title)?'hound':/蟲群/.test(title)?'swarm':/防衛機/.test(title)?'turret':/機械工/.test(title)?'worker':/敵軍/.test(title)?'soldier':/掠奪|搶匪|伏兵|摩托幫/.test(title)?'raider':null;const key=matched||this.pick(pool.length?pool:keys);const n=mode==='vehicle'||npc?1:1+(this.roll()<=25?1:0);const enemies=Array.from({length:n},(_,i)=>({id:'e'+i,key,name:npc?display(npc):this.d.assets.enemies[key].name,hp:mode==='vehicle'?22+lvl*4:10+lvl*3,maxHp:mode==='vehicle'?22+lvl*4:10+lvl*3,attack:3+lvl,defense:1+lvl,speed:4+lvl,stun:0,npc:npc?clone(npc):null}));if(mode==='vehicle')for(const e of enemies){e.vehicle=this.pick(Object.keys(this.d.assets.vehicles));e.name='敵方'+this.d.assets.vehicles[e.vehicle].name;}if(npc&&mode==='character')for(const e of enemies){e.hp=npc.hp;e.maxHp=npc.maxHp;e.attack=this.stat(npc,'attack');e.defense=this.stat(npc,'defense');e.speed=this.stat(npc,'speed');}this.s.battle={mode,enemies,ambush:/伏|突襲|狙擊/.test(this.s.current?.event.title||''),round:1,defend:false,resume:this.s.mode==='ready'?'ready':'event',usedHunter:[],guardUsed:[],shield:0};this.s.mode='combat';this.s.notice=mode==='vehicle'?'車輛戰鬥開始。':'人物戰鬥開始。';}
 finishCombat(win){const b=this.s.battle;this.s.battle=null;this.s.mode=b.resume||'event';this.s.party.forEach(p=>p.asleep=false);if(this.s.current&&!b.sleepAttack){this.s.current.event.options=[];this.s.current.dialogue=false;this.s.current.service=null;}this.checkAlive();}
}

installCombat(Game,{learned,ITEMS,clamp,display});

installTraits(Game,{clamp,display,clone});

installNpcs(Game,{clone,display,ITEMS});
