import {npcDemeanor} from './npc-presentation.js';
import {journalEntry} from './journey-ui.js';
export function normalizeFlow(s){if(!s)return;s.journeyFlow??={declined:null,restSetup:false};s.messages??=[];s.messageSerial??=0;}
export function appendMessage(s,title,text,personId=null){normalizeFlow(s);if(!text)return;const last=s.messages.at(-1);if(last?.text===text&&last.title===title)return;const message={id:++s.messageSerial,title,text,personId};s.messages.push(message);s.messages=s.messages.slice(-60);return message;}
const restKey=g=>[g.s.stop,g.driver()?.id,g.driver()?.st].join(':');
export function canContinueDriving(g){if(!g.canDrive())return false;const cost=g.travelCost(1,g.driver());return cost.fuel<=Math.min(g.vehicleStats().capacity,g.availableFuel())&&cost.st<=g.driver().st;}
export function alternateDriver(g){return g.alive().filter(p=>p.id!==g.s.driver&&p.st>0&&!p.asleep).sort((a,b)=>b.st-a.st)[0];}
export function automaticDecision(g){const s=g.s;if(!s||s.rosterReview||s.battle||['ending','prologue'].includes(s.mode))return 'wait';
 if(s.journeyFlow?.restSetup)return 'restSetup';
 if(s.mode==='ready'){
  if(s.offerVehicle)return 'vehicle';
  if(g.availableFuel()<=0||s.vehicle.hp<=0)return 'stranded';
  const driver=g.driver();if(!driver||s.party.length>g.partyLimit())return 'blocked';
  if(driver.st<5&&(s.journeyFlow?.declined!==restKey(g)||!canContinueDriving(g)))return 'rest';
  return canContinueDriving(g)?'drive':'rest';
 }
 const c=s.current;if(s.mode!=='event'||!c||c.resolved||c.finalGate||c.building||c.dialogue||c.service||s.offerVehicle||g.options().length)return 'wait';
 if(c.inside&&!c.explored)return 'wait';
 return s.strandedSearch?'resolveSearch':'finish';
}
export function declineRest(g){if(automaticDecision(g)!=='rest'||!canContinueDriving(g))return false;normalizeFlow(g.s);g.s.journeyFlow.declined=restKey(g);return true;}
export function automaticStep(g){const decision=automaticDecision(g);if(decision==='drive')return g.depart();if(decision==='finish'){g.finishEvent();return true;}if(decision==='resolveSearch'){g.resolveSearch();return true;}return false;}
export function syncMessageContext(g,display){const s=g.s;if(!s)return;normalizeFlow(s);const c=s.current;
 if(c?.event){const key=[s.stop,c.instance,c.event.id,c.inside].join(':');if(s.journeyFlow.sceneKey!==key){s.journeyFlow.sceneKey=key;if(!c.rewardReceipt){const identity=c.npc?'\n'+display(c.npc)+' · '+(g.d.catalog.races.find(r=>r.id===c.npc.race)?.name||c.npc.race)+' · '+(g.d.catalog.professions.find(r=>r.id===c.npc.profession)?.name||c.npc.profession)+(s.battle?'':'\n'+npcDemeanor(c.npc,{seed:s.seed})):'';appendMessage(s,c.place?.name||c.event.title,c.event.text.replace('{npc.display_name}',c.npc?display(c.npc):'旅人')+identity);}}}
 if(s.mode!=='driving'&&s.notice&&s.journeyFlow.notice!==s.notice){s.journeyFlow.notice=s.notice;const recent=s.messages.slice(-12),covered=recent.some(m=>m.text===s.notice)||s.notice.split('\n').filter(Boolean).every(line=>recent.some(m=>m.text===line||`${m.title}：${m.text}`===line));if(!covered)appendMessage(s,c?.conversation?.title||'旅途片刻',s.notice);}
}
export function installAutomaticJourney(Game,{display}){
 const start=Game.prototype.start;Game.prototype.start=function(...args){const s=start.apply(this,args);normalizeFlow(s);return s;};
 Game.prototype.startRandom=function(seed=Date.now()){const s=this.start({seed,race:null,profession:null}),p=s.party[0],name=(kind,id)=>this.d.catalog[kind].find(x=>x.id===id)?.name||id;appendMessage(s,display(p),`${name('races',p.race)} · ${name('professions',p.profession)}。你坐進駕駛座，車頭朝向東方。`,p.id);return s;};
 const recruit=Game.prototype.recruit;Game.prototype.recruit=function(){const ok=recruit.call(this);if(ok&&!this.s.current?.npc)this.s.current.service=null;return ok;};
 const log=Game.prototype.log;Game.prototype.log=function(title,text){log.call(this,title,text);const entry=journalEntry({title,text});if(entry)appendMessage(this.s,entry.title,entry.text);};
 const ambient=Game.prototype.ambient;Game.prototype.ambient=function(){const text=ambient.call(this),v=this.s.travel?.voices;if(v)for(const line of v.lines)appendMessage(this.s,v.kind==='radio'?'電台 · '+line.speaker:line.speaker,line.text,line.personId);return text;};
}
