import {npcDemeanor} from './npc-presentation.js';
import {companionExchange} from './companion-dialogue.js';
import {radioEventForecast,radioExaggeratedItemAd,companionColdJokeExchange,rollRadioAuthorQuip} from './radio-banter.js';
import {ITEMS} from './engine.js';
import {CONSUMABLES} from './consumables-catalog.js';
export const MAX_PARTY=4;
export function normalizeJourney(s){
 if(!s)return;
 s.protagonistId??=s.party[0]?.id;
 s.oralHistory??=[];
 if(s.world){s.world.occupationYears=10;s.world.currentYear=s.world.year+10;}
 // Preserve every old companion and their gear; the player chooses who leaves.
 if(s.party.length>MAX_PARTY){s.rosterReview=true;if(s.mode==='driving'){s.mode='ready';s.travel=null;}}
}
export function fillWorld(text,world){return text.replace(/\{(year|currentYear|faction|process|trace)\}/g,(_,key)=>String(world[key]??''));}
export function installDialogue(Game,{display}){
 Game.prototype.dialogueTopic=function(p){
  const drawn=this.oracle('occupation_dialogue'),rows=this.d.oracles.tables.find(t=>t.id==='occupation_dialogue').rows;
  let index=rows.findIndex(r=>r.value.id===drawn.value.id),recent=p.recentTopics||[];
  for(let step=0;step<rows.length&&recent.includes(rows[index].value.id);step++)index=(index+1)%rows.length;
  const topic=rows[index].value;p.recentTopics=[...recent,topic.id].slice(-6);return topic;
 };
 Game.prototype.talk=function(){
  const c=this.s.current,p=c?.npc;if(this.s.mode!=='event'||!c?.dialogue||!p||['敵對','掠奪'].includes(p.attitude))return false;
  const topic=this.dialogueTopic(p),text=fillWorld(topic.responses[p.attitude]||topic.responses['冷淡'],this.s.world)+this.bossRumor(p);
  this.s.minutes+=5;
  let reunion='';if(c.event.kind==='followup'&&!c.recalled){c.recalled=true;reunion=`「又見面了。${p.memories?.at(-1)||'我還記得我們一起走過的路。'}」\n`;}
  let gift='';if(p.attitude==='同情'&&!c.giftGiven){c.giftGiven=true;if(this.roll()<=60-(this.actor()?.flaw==='abrasive'?10:0)){this.add('medicine',1);const rec=(this.actor()||this.s.party[0])?.name||'旅人';gift=`\n對方從行囊中取出一份藥品塞進${rec}手裡：「這個留著，路上用得上。」`;}}
  c.conversation={npcId:p.id,title:topic.title,topicId:topic.id,attitude:p.attitude,year:topic.year};
  this.tell(`${display(p)}：\n${reunion}「${text}」${gift}`);c.conversation.notice=this.s.notice;
  this.s.oralHistory??=[];this.s.oralHistory.unshift({topicId:topic.id,title:topic.title,year:topic.year,speaker:display(p),attitude:p.attitude,text,minutes:this.s.minutes});this.s.oralHistory=this.s.oralHistory.slice(0,100);
  this.remember(p,`我們聊過「${topic.title}」，那是佔領第 ${topic.year} 年的事。`);return true;
 };
 const begin=Game.prototype.beginCombat;Game.prototype.beginCombat=function(mode='character',category=null,npc=null){
  begin.call(this,mode,category,npc);if(!npc||!this.s.battle)return;
  const topic=this.dialogueTopic(npc),attitude=npc.attitude==='掠奪'?'掠奪':'敵對';
  this.s.notice=`${npcDemeanor(npc,{seed:this.s.seed,confronted:true})}\n${display(npc)}：\n「${fillWorld(topic.responses[attitude],this.s.world)+this.bossRumor(npc)}」`;
  this.log('戰前喊話',this.s.notice);
 };
 Game.prototype.ambient=function(){
  const channel=this.oracle('driving_channel').value,s=this.s,awake=this.alive().filter(p=>!p.asleep),driver=awake.find(p=>p.id===s.driver)||awake[0],lead=awake.find(p=>p.id===s.protagonistId)||driver,others=awake.filter(p=>p.id!==lead?.id);
  const pickBucket=Math.abs(((s.seed|0)*31+(s.stop|0)*17+(s.minutes|0)*7))%100;
  let kind=channel,speaker='',lines=[],conversation={};
  if(s.travel?.upcomingBoss&&channel==='radio'){
   const fc=radioEventForecast(s,s.seed);
   speaker=fc.station;lines=[{speaker:fc.station,text:fc.text}];
  }else if(channel==='radio'){
   const fc=(s.travel?.upcomingEvent&&pickBucket<50)?radioEventForecast(s,s.seed):null;
   if(fc){speaker=fc.station;lines=[{speaker:fc.station,text:fc.text}];}
   else if(s.travel?.die&&pickBucket<85){const ad=radioExaggeratedItemAd(ITEMS,CONSUMABLES,s.seed,s.stop);speaker=ad.station;lines=[{speaker:ad.station,text:ad.text}];}
   else{const r=this.oracle('driving_radio').value,rq=s.travel?.die?rollRadioAuthorQuip('radio',s.seed,s.stop):'';speaker=r.station;lines=[{speaker:r.station,text:fillWorld(r.text,s.world)+(rq?'\n'+rq:'')}];}
  }
  else if(channel==='quiet'||!lead){kind='quiet';speaker='車內';lines=[{speaker,text:this.oracle('driving_quiet').value}];}
  else if(others.length){
   kind='companions';speaker='車內閒聊';const partner=this.pick(others);
   if((s.stop||0)>=1&&pickBucket<35){conversation=companionColdJokeExchange(lead,partner,display,s.seed,s.stop);}
   else{conversation=companionExchange(this,lead,partner,display);}
   lines=conversation.lines;
  }
  else{kind='solo';speaker='自言自語';lines=this.oracle('driving_solo').value.map(text=>({speaker:display(lead),personId:lead.id,text}));}
  if(s.travel)s.travel.voices={...conversation,kind,speaker,lines};return lines.map(l=>kind==='quiet'?l.text:`${l.speaker}：「${l.text}」`).join('\n');
 };
 Game.prototype.reviewParty=function(id){
  if(!this.s.rosterReview||this.s.party.length<=MAX_PARTY||id===this.s.protagonistId)return false;
  const mode=this.s.mode;this.s.mode='ready';let ok=false;
  try{ok=this.dismiss(id);}finally{this.s.mode=mode;}
  if(ok&&this.s.battle){const b=this.s.battle;delete b.orders?.[id];for(const key of ['roster','guardIds','usedHunter','guardUsed'])if(b[key])b[key]=b[key].filter(x=>x!==id);}
  if(this.s.party.length<=MAX_PARTY)this.s.rosterReview=false;return ok;
 };
}
