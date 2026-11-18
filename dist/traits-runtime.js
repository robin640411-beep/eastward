export const EVENT_FEATURES={
 building_001:['civilian'],building_005:['civilian','mechanical_lock'],building_010:['electronic_lock'],building_011:['hidden_life'],building_027:['hidden_life'],building_030:['alien_message'],building_036:['book'],building_037:['civilian','book'],building_038:['terminal','alien_message'],building_040:['book'],building_041:['sample','book'],building_042:['route'],building_044:['route'],building_045:['machine','energy','civilian'],building_052:['electric','water'],building_053:['electric'],building_054:['chemical'],building_055:['spores'],building_056:['chemical'],building_059:['explosive'],building_060:['explosive'],building_062:['water'],building_064:['narrow'],building_065:['dark'],building_066:['hidden_life'],building_067:['sample','hidden_life'],building_071:['spores','hidden_life'],building_073:['energy'],building_098:['route'],building_099:['book']};
export function installTraits(Game,{clamp,display,clone}){
 Game.prototype.actor=function(){const awake=this.alive().filter(p=>!p.asleep);return awake.find(p=>p.id===this.s.actorId)||awake[0]||this.alive()[0]};
 Game.prototype.selectActor=function(id){if(this.s.mode!=='event'||!this.alive().some(p=>p.id===id&&!p.asleep))return false;this.s.actorId=id;return true};
 Game.prototype.features=function(){return EVENT_FEATURES[this.s.current?.event.id]||[]};
 Game.prototype.lit=function(){return this.s.current?.illuminated||this.actor()?.race==='lumen'};
 Game.prototype.traitActions=function(){const c=this.s.current,p=this.actor();if(!c||this.s.mode!=='event'||c.building||!p||p.asleep)return [];const f=this.features(),a=[];const add=(id,label)=>{if(!c.traitsUsed?.includes(id))a.push({id,label})};
  if(p.race==='human'&&f.includes('civilian'))add('human','依操作標示取得提示');
  if(p.race==='alien'&&f.includes('alien_message'))add('alien','解讀先遣命令');
  if(p.race==='synth'&&f.includes('terminal'))add('synth','恢復已刪除紀錄');
  if(p.race==='uplift'&&f.includes('hidden_life'))add('uplift','嗅聞藏匿生物');
  if(p.race==='mycelial'&&f.includes('spores'))add('mycelial','辨識孢子危害');
  if(p.race==='crystal'&&f.includes('energy'))add('crystal','感應供能裝置');
  if(p.race==='lumen'&&f.includes('dark'))add('lumen','照亮房間');
  if(p.profession==='researcher'&&f.includes('sample'))add('researcher','分析未知樣本');
  if(p.profession==='chemist'&&f.includes('chemical'))add('chemist','鑑定化學品');
  if(p.profession==='courier'&&f.includes('route'))add('courier','解讀信使路標');
  if(p.profession==='historian'&&f.includes('book')&&this.s.history.length)add('historian','交叉比對既有史料');
  if(p.profession==='diplomat'&&c.dialogue&&c.npc&&!['敵對','掠奪'].includes(c.npc.attitude))add('diplomat','交換情報 · 5 分鐘');
  if(p.profession==='performer'&&this.s.performerReady?.includes(p.id)&&this.s.storyStop!==this.s.stop&&this.alive().some(q=>q.id!==p.id&&!q.asleep&&q.st<q.maxSt))add('performer','講述旅途故事 · 同伴體力 +1');
  if(c.event.options?.length){if(p.profession==='engineer'&&f.includes('machine'))add('engineer','修復設施 · 2 廢料、10 分鐘');if(p.profession==='hacker'&&f.includes('electronic_lock'))add('hacker','繞過電子門禁 · 5 分鐘');if(p.profession==='locksmith'&&f.includes('mechanical_lock'))add('locksmith','巧手開鎖 · 5 分鐘');if(p.profession==='electrician'&&f.includes('electric'))add('electrician','隔離電源 · 5 分鐘');if(p.profession==='demolition'&&f.includes('explosive'))add('demolition','拆除引信 · 5 分鐘；失敗受 3 傷害');}
  return a;
 };
 Game.prototype.traitAction=function(id){if(!this.traitActions().some(a=>a.id===id))return false;const c=this.s.current,p=this.actor();if(id==='engineer'&&this.s.resources.scrap<2)return false;c.traitsUsed??=[];c.traitsUsed.push(id);
 const hints={human:'操作標示仍清楚：先確認電源，再開啟容器；機械鎖無法用電子識別碼解除。',alien:`命令識別碼屬於${this.s.world.faction}；部隊接獲封鎖水源的指示。`,synth:`刪除紀錄：${this.s.world.year} 年，撤離者沿東向公路運送廣播設備。`,uplift:c.npc?'附近有一名藏匿的旅人。':this.features().includes('sample')||/066|071/.test(c.event.id)?'深處有生物活動，空氣中帶著巢穴的氣味。':'夾層只有陳舊氣味，沒有活物。',mycelial:'這裡的孢子有害；直接接觸會造成污染傷害。',crystal:'側牆後的供能匣仍在發熱；有能量不代表設備已安全停機。',researcher:'樣本含有會寄生的外星組織，不能當作藥品。',chemist:'液體屬刺激性工業毒物，不能直接服用。',courier:'箭頭與三道短線代表東行補給聯絡點，路標沒有承諾道路安全。',historian:`這份紀錄與《${this.s.world.archive}》的撤離時間相符：${this.s.history[0]}`};
 if(hints[id]){this.tell(hints[id]);return true;}
 if(id==='lumen'){c.illuminated=true;this.tell('柔和微光照出貨架，現在可以辨認物資。');return true;}
 if(id==='diplomat'){this.s.minutes+=5;this.reveal();return true;}
 if(id==='performer'){const q=this.alive().find(q=>q.id!==p.id&&!q.asleep&&q.st<q.maxSt);q.st++;this.s.storyStop=this.s.stop;this.tell(`${display(p)}講了一個故事，${display(q)}恢復 1 體力。`);return true;}
 c.event.options=[];this.s.minutes+=id==='engineer'?10:5;
 if(id==='engineer'){this.add('scrap',-2);if(p.flaw==='mechanical_clumsy')this.s.minutes+=10;this.reveal();this.tell('廣播設備恢復運作，留下的錄音已記入旅途紀錄。');}
 if(id==='hacker'||id==='locksmith')this.effect({op:'oracle',table:'equipment'});
 if(id==='electrician')this.tell('電源已隔離，安全通過帶電區域。');
 if(id==='demolition'){if(this.roll()<=90)this.tell('引信成功拆除。');else {this.hurt(p,3,['physical']);this.checkAlive();}}
 return true;
 };
 const arrive=Game.prototype.arrive;Game.prototype.arrive=function(){const eligible=this.alive().filter(p=>!p.asleep&&p.profession==='performer').map(p=>p.id);const result=arrive.call(this);this.s.performerReady=eligible;return result};
 Game.prototype.preparedOption=function(o){const copy=clone(o),p=this.actor(),f=this.features();if(!p)return copy;
 const active=(copy.effects||[]).length>0&&!copy.effects.every(e=>['open_service','npc_interaction','reveal_history','world_minutes'].includes(e.op));
 if(active){const extra=(p.flaw==='claustrophobic'&&f.includes('narrow')?1:0)+(p.flaw==='dark_fear'&&f.includes('dark')&&!this.lit()?1:0);if(extra)copy.effects.unshift({op:'stamina_cost',amount:extra});}
 function adapt(e){if(e.op==='stamina_cost'&&e.tags?.includes('wade')&&p.race==='amphibian')e.amount=Math.max(0,e.amount-1);for(const k of ['success_effects','failure_effects'])e[k]?.forEach(adapt)}copy.effects?.forEach(adapt);return copy;
 };
 Game.prototype.optionCosts=function(o){const costs={};const add=(k,v)=>costs[k]=(costs[k]||0)+v;for(const e of o.effects||[]){if(e.op==='resource'&&e.amount<0)add(e.key,-e.amount);if(e.op==='travel_cost')add('fuel',e.fuel);if(e.op==='stamina_cost')add('stamina',e.amount);}return costs};
 Game.prototype.canChoose=function(o){const prepared=this.preparedOption(o);return this.afford(o.requires||[])&&Object.entries(this.optionCosts(prepared)).every(([k,v])=>(k==='stamina'?this.actor()?.st:k==='fuel'?this.availableFuel():this.s.resources[k])>=v)};
 const options=Game.prototype.options;Game.prototype.options=function(){const list=options.call(this);if(this.s.mode==='event'&&!this.s.current?.building&&list.length&&!list.some(o=>this.canChoose(o))){const staminaOnly=list.some(o=>Object.entries(this.optionCosts(this.preparedOption(o))).every(([k,v])=>k==='stamina'||(k==='fuel'?this.availableFuel():this.s.resources[k])>=v));return [...list,{id:staminaOnly?'__rest':'__supplies',label:staminaOnly?'體力不足，原地休息':'物資不足，尋找燃料或替代車輛',requires:[],effects:[]}]}return list};
 const choose=Game.prototype.choose;Game.prototype.choose=function(id){const c=this.s.current;if(this.s.mode!=='event'||!c)return false;if(id==='__rest'&&this.options().some(o=>o.id===id))return this.sleep();if(id==='__supplies'&&this.options().some(o=>o.id===id)){this.s.resourceBlock=clone(c);this.s.mode='ready';return this.searchStranded(true);}const o=c.event.options?.find(o=>o.id===id);if(o&&!c.building){if(!this.canChoose(o))return false;const ix=c.event.options.indexOf(o);c.event.options[ix]=this.preparedOption(o);c.searching=/search|take|open|salvage/.test(id)||/搜|回收/.test(o.label);}return choose.call(this,id)};
 Game.prototype.checkEffects=function(f){
  const specialist={mechanical_lock:'locksmith',electric:'electrician',explosive:'demolition',alarm:'scout'}[f.check];
  const chance=f.check==='dark_search'&&this.lit()?100:this.actor()?.profession===specialist?90:55;
  const success=this.roll()<=chance;
  return {success,effects:(success?f.success_effects:f.failure_effects)||[]};
 };

}
