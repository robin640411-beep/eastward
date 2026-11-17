export function installNpcs(Game,{clone,display,ITEMS}){
 const person=Game.prototype.person;Game.prototype.person=function(...args){const p=person.apply(this,args);p.memories=[];p.stock={fuel:1,medicine:1,item:1};p.tradeItem=['soldier','hunter','guard'].includes(p.profession)?'pistol':['medic','researcher','chemist'].includes(p.profession)?'charm':'tools';return p};
 const interact=Game.prototype.interact;Game.prototype.interact=function(service=null){interact.call(this,service);const c=this.s.current;if(this.s.mode==='event'&&c?.dialogue&&!c.service)c.service='npc_trade'};
 const next=Game.prototype.nextEvent;Game.prototype.nextEvent=function(){next.call(this);const c=this.s.current;if(c?.dialogue&&!c.service)c.service='npc_trade'};
 Game.prototype.remember=function(p,text){if(!p)return;p.memories??=[];if(!p.memories.includes(text))p.memories.push(text);p.memories=p.memories.slice(-8)};
 const schedule=Game.prototype.schedule;Game.prototype.schedule=function(p,hostile=false){if(!p||this.s.pending.some(f=>f.actor.id===p.id))return;this.remember(p,`在進度 ${this.s.progress} 的停靠與你分別。`);schedule.call(this,p,hostile)};
 const recruit=Game.prototype.recruit;Game.prototype.recruit=function(){const p=this.s.current?.npc;const ok=recruit.call(this);if(ok){this.remember(p,`在進度 ${this.s.progress} 加入你的車隊。`);this.s.pending=this.s.pending.filter(f=>f.actor.id!==p.id);this.s.departed=this.s.departed.filter(q=>q.id!==p.id)}return ok};
 const talk=Game.prototype.talk;Game.prototype.talk=function(){if(this.s.mode!=='event'||!this.s.current?.dialogue)return false;const p=this.s.current.npc;if(!p)return false;if(this.s.current.event.kind==='followup'&&!this.s.current.recalled){this.s.current.recalled=true;this.s.minutes+=5;this.tell(`${display(p)}說：「${p.memories?.at(-1)||'我還記得我們曾一起走過的路。'}」`);return true;}talk.call(this);this.remember(p,`你們曾在進度 ${this.s.progress} 聊起東方的綠洲。`);return true};
 const buy=Game.prototype.buy;Game.prototype.buy=function(kind,id){const c=this.s.current;if(this.s.mode!=='event'||!c?.dialogue)return false;
  if(c.service!=='npc_trade'){if(kind==='vehicle'&&this.s.offerVehicle){this.tell('請先處理目前可用的車輛，再購買另一輛。');return false;}return buy.call(this,kind,id)}
  const p=c.npc;if(!p||['敵對','掠奪'].includes(p.attitude))return false;p.stock??={fuel:1,medicine:1,item:1};p.tradeItem??='tools';
  if(!['fuel','medicine','item'].includes(kind)||p.stock[kind]<=0||kind==='item'&&id!==p.tradeItem)return false;
  const price=this.price(kind==='fuel'?3:kind==='medicine'?2:ITEMS[id].price);if(this.s.resources.scrap<price)return false;
  this.add('scrap',-price);p.stock[kind]--;if(kind==='fuel')this.add('fuel',10);if(kind==='medicine')this.add('medicine',1);if(kind==='item')this.s.inventory.push(id);this.remember(p,`你們曾在進度 ${this.s.progress} 交換物資。`);this.tell(`${display(p)}把物資交給你。`);return true;
 };
}
