// The event and any opening round have already been rolled once. Resume the
// presentation from the save without replaying the action that produced them.
export const ALERT_MS=1250;
const inside=s=>!!(s?.current?.inside||s?.frames?.at(-1)?.kind==='building');

export function createEncounterCue(before,after,{action,start,steps=[],display}){
 if(!before||!after||before.battle||['load','explicitFight','attackNpc'].includes(action))return null;
 const incoming=start?.battle?start:after,battle=incoming.battle,event=incoming.current;
 const priorFrame=before.frames?.at(-1),nextFrame=incoming.frames?.at(-1);
 const changed=event&&event.instance!==before.current?.instance;
 const chained=changed&&before.stop===incoming.stop&&priorFrame?.kind===nextFrame?.kind&&nextFrame?.count>priorFrame?.count;
 const arrival=before.mode==='driving';
 if(!battle&&!(event&&(arrival||chained||(changed&&action==='explore'))))return null;

 const preview=before.travel?.preview?.current;
 const prior=arrival?(preview?{...preview,rewardReceipt:null,approaching:true}:null):before.current;
 const npc=battle?.enemies.find(e=>e.npc)?.npc;
 const foes=[...new Set(battle?.enemies.map(e=>e.name)||[])].join('、');
 const sleep=battle?.sleepAttack;
 const title=sleep?'夜裡的動靜':event?.place?.name||event?.event?.title||(battle?.mode==='vehicle'?'公路追逐':'路旁遇襲');
 let text=sleep?(battle.watchId?'守夜的同伴聽見響動，看見有敵人正摸向營地。':'車旁響起腳步聲。全隊都在睡夢中，敵人搶先出手。'):
  (event?.event?.text||'').replaceAll('{npc.display_name}',event?.npc?display(event.npc):'旅人');
 let threat='';
 if(battle){
  if(sleep)threat=foes+'已經靠近了營地。';
  else if(battle.finalBoss)threat=foes+'攔在通往樂園的最後一段路上。';
  else if(npc){
   if(/願意加入|想搭車|請求搭乘/.test(text)){
    text=display(npc)+(inside(incoming)?'在門旁':'在路旁')+'放下行李，抬手示意想搭一程。';
    threat='你們剛靠近，對方就越過行李，猛地朝你們撲來。';
   }else threat=display(npc)+'突然逼近，朝你們出手了。';
  }
  else if(battle.mode==='vehicle')threat=foes+'正從側面逼近。駕駛握緊方向盤，準備接戰。';
  else threat=foes+'擋住了去路，隊伍準備迎戰。';
 }
 return {key:[after.stop,event?.instance,after.serial,action].join('/'),phase:'alert',combat:!!battle,
  title,text,threat,button:battle?.mode==='vehicle'?'迎戰敵車':battle?.finalBoss?'迎戰首領':'迎戰',
  alert:sleep?'夜裡傳來一陣異響。':inside(before)&&!arrival?'駕駛停下腳步，留意著四周。':'駕駛察覺了動靜。',
  previous:prior||null,previousInside:inside(before)&&!arrival,previousRoom:priorFrame?.scene,
  // A first strike may already have changed HP or even ended the fight.
  opening:steps.length?{start,steps}:null};
}
export function encounterScene(state,cue){
 const pending=cue.opening?.start||state;
 const alert=cue.phase==='alert',indoors=alert?cue.previousInside:inside(pending);
 return {...pending,mode:'event',travel:null,battle:null,current:alert?cue.previous:pending.current,
  frames:indoors?[{kind:'building',scene:alert?cue.previousRoom:pending.frames?.at(-1)?.scene}]:[]};
}
export function readingDelay(s){
 const description=s.current?.event?.text||'',result=s.notice||'';
 const length=(description===result?result:description+result).length;
 return Math.min(12000,Math.max(4000,1200+length*115));
}
