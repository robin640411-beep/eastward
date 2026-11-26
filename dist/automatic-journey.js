import {npcDemeanor,concealAttitudeLabels} from './npc-presentation.js';
import {journalEntry} from './journey-ui.js';
import {personRaceName,personJobName} from './procedural-npc.js';
import {companionWhisperEntry,authorAside,fillStory} from './storybook.js';
export function normalizeFlow(s){if(!s)return;s.journeyFlow??={declined:null,restSetup:false};s.messages??=[];s.messageSerial??=0;}
export function appendMessage(s,title,text,personId=null,speakerKind=null){normalizeFlow(s);if(!text)return;const last=s.messages.at(-1);if(last?.text===text&&last.title===title)return;const message={id:++s.messageSerial,title,text,personId,speakerKind};s.messages.push(message);s.messages=s.messages.slice(-60);return message;}
const restKey=g=>[g.s.stop,g.driver()?.id,g.driver()?.st].join(':');
export function canContinueDriving(g){if(!g.canDrive())return false;const cost=g.travelCost(1,g.driver());return cost.fuel<=Math.min(g.vehicleStats().capacity,g.availableFuel())&&cost.st<=g.driver().st;}
export function alternateDriver(g){return g.alive().filter(p=>p.id!==g.s.driver&&p.st>0&&!p.asleep).sort((a,b)=>b.st-a.st)[0];}
export function automaticDecision(g){const s=g.s;if(!s||s.journeyFlow?.encounterCue||s.rosterReview||s.battle||['ending','prologue'].includes(s.mode))return 'wait';
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
 if(c?.event){const key=[s.stop,c.instance,c.event.id,c.inside].join(':');if(s.journeyFlow.sceneKey!==key){s.journeyFlow.sceneKey=key;if(!c.rewardReceipt){
  // Page 1: Event title (top, yellow) + event text + optional author aside (green) ONLY.
  const aside=s.battle?'':authorAside(g,display);
  appendMessage(s,c.place?.name||c.event.title,(c.observedText||fillStory(c.event.text,s,display))+aside,null,'event');
  // Page 2: NPC gets their own page with blue NPC name+nickname at the very top.
  if(c.npc){
   const meta=`${personRaceName(c.npc,g.d.catalog)} · ${personJobName(c.npc,g.d.catalog)}`;
   const begLine=c.begRequest&&!c.charityGiven?c.begRequest.line:'';
   const npcBody=[meta,c.npc.procedural?.appearance||'',s.battle?'':npcDemeanor(c.npc,{seed:s.seed,morality:s.morality||0}),begLine].filter(Boolean).join('\n');
   appendMessage(s,display(c.npc),npcBody,null,'npc');
  }
  // Page 3: Companion whisper gets its own page with yellow companion name+nickname at the very top.
  if(!s.battle){
   const w=companionWhisperEntry(g,display);
   if(w)appendMessage(s,w.title,w.text,w.personId,'party');
  }
 }}}
 if(s.mode!=='driving'&&s.mode!=='prologue'&&s.notice&&s.journeyFlow.notice!==s.notice){s.journeyFlow.notice=s.notice;const cleanNotice=concealAttitudeLabels(s.notice),recent=s.messages.slice(-12),covered=recent.some(m=>m.text===s.notice||m.text===cleanNotice||m.text.startsWith(s.notice+'\n')||m.text.startsWith(cleanNotice+'\n'))||cleanNotice.split('\n').filter(Boolean).every(line=>recent.some(m=>m.text===line||m.text.includes(line)||`${m.title}：${m.text}`===line||m.title===line||(m.title&&line.startsWith(m.title+' · ')&&m.text.includes(line.slice(m.title.length+3)))));if(!covered){
  const npcDisp=c?.npc?display(c.npc):'';
  if(npcDisp&&cleanNotice.startsWith(npcDisp)){
   const lines=cleanNotice.split('\n');
   const firstRest=lines[0].slice(npcDisp.length).replace(/^\s*[·：:]\s*/,'');
   const body=[firstRest,...lines.slice(1)].filter(Boolean).join('\n');
   appendMessage(s,npcDisp,body||cleanNotice,null,'npc');
  }else{
   appendMessage(s,c?.conversation?.title||'旅途片刻',s.notice);
  }
 }}
}
export function installAutomaticJourney(Game,{display}){
 const start=Game.prototype.start;Game.prototype.start=function(...args){const s=start.apply(this,args);normalizeFlow(s);return s;};
 Game.prototype.startRandom=function(seed=Date.now()){const s=this.start({seed,race:null,profession:null});return s;};
 const recruit=Game.prototype.recruit;Game.prototype.recruit=function(){const ok=recruit.call(this);if(ok&&!this.s.current?.npc)this.s.current.service=null;return ok;};
 const log=Game.prototype.log;Game.prototype.log=function(title,text){log.call(this,title,text);const entry=journalEntry({title,text});if(entry){const npc=this.s.current?.npc,npcDisp=npc?display(npc):'';if(entry.title==='旅途紀錄'&&npcDisp&&entry.text.startsWith(npcDisp)){const lines=entry.text.split('\n');const firstRest=lines[0].slice(npcDisp.length).replace(/^\s*[·：:]\s*/,'');const body=[firstRest,...lines.slice(1)].filter(Boolean).join('\n');appendMessage(this.s,npcDisp,body||entry.text,null,'npc');}else appendMessage(this.s,entry.title,entry.text);}};
 const ambient=Game.prototype.ambient;Game.prototype.ambient=function(){const text=ambient.call(this),v=this.s.travel?.voices;if(v)for(const line of v.lines)appendMessage(this.s,v.kind==='radio'?'電台 · '+line.speaker:line.speaker,line.text,line.personId);return text;};
}
