// Time-based travel duration and percentage recovery system.
// 1 progress unit = 10 km; average cruise = 60 km/h -> 10 minutes per progress unit.
// 3,000 km = 50 h driving + 3 nights x 6 h sleep + ~8-12 h stops ≈ 76-80 h (4 days, 3 nights).
export const KM_PER_PROGRESS=10;
export const CRUISE_KMH=60;
export const SLEEP_HOURS_OPTIONS=[4,6,8];
export const DEFAULT_SLEEP_HOURS=6;

export const RECOVERY_RATES={
 sleepSafe:{st:.15,hp:.10,esp:.25},
 sleepWild:{st:.12,hp:.08,esp:.20},
 guard:{st:-.04,hp:0,esp:0},
 passenger:{st:.06,hp:.03,esp:.08}
};

export function minutesForProgress(n){
 const units=Math.max(0,Number(n)||0);
 if(!units)return 0;
 return Math.max(10,Math.round((units*KM_PER_PROGRESS/CRUISE_KMH)*60));
}

export function dayIndex(minutes=0){
 return Math.floor(Math.max(0,Number(minutes)||0)/1440);
}

export function hourOfDay(minutes=0){
 return Math.floor(((Number(minutes)||0)%1440+1440)%1440/60);
}

export function isMidnightWindow(minutes=0){
 const m=Number(minutes)||0;
 // Only prompt after crossing Day 1 midnight (minutes >= 1440) during 00:00..04:59.
 return m>=1440&&hourOfDay(m)>=0&&hourOfDay(m)<5;
}

export function shouldPromptMidnightRest(state){
 if(!state)return false;
 if(!isMidnightWindow(state.minutes))return false;
 return state.journeyFlow?.midnightDeclinedDay!==dayIndex(state.minutes);
}

export function sleepPreviewPercentages(hours=DEFAULT_SLEEP_HOURS,safe=false){
 const r=safe?RECOVERY_RATES.sleepSafe:RECOVERY_RATES.sleepWild;
 return {
  hpPct:Math.min(100,Math.round(r.hp*hours*100)),
  stPct:Math.min(100,Math.round(r.st*hours*100)),
  espPct:Math.min(100,Math.round(r.esp*hours*100))
 };
}

export function applyTimedRecovery(person,minutes,rates,{clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),sleep=false}={}){
 if(!person||person.hp<=0||!minutes||minutes<=0||!rates)return {hpGain:0,stGain:0,espGain:0};
 const hours=minutes/60;
 person.regenCarry??={hp:0,st:0,esp:0};
 const applyStat=(key,maxKey,rate)=>{
  if(!rate)return 0;
  const raw=person[maxKey]*rate*hours;
  if(raw>=0){
   const total=(person.regenCarry[key]||0)+raw;
   const whole=Math.floor(total);
   person.regenCarry[key]=total-whole;
   const before=person[key];
   person[key]=clamp(before+whole,0,person[maxKey]);
   return person[key]-before;
  }
  const loss=Math.max(1,Math.round(Math.abs(raw)));
  const before=person[key];
  person[key]=clamp(before-loss,0,person[maxKey]);
  return person[key]-before;
 };
 let hpGain=applyStat('hp','maxHp',rates.hp);
 let stGain=applyStat('st','maxSt',rates.st);
 let espGain=applyStat('esp','maxEsp',rates.esp);
 if(sleep){
  if(person.flaw==='restless'&&stGain>1){person.st=Math.max(0,person.st-1);stGain-=1;}
  if(person.race==='symbiote'&&person.hp<person.maxHp){const before=person.hp;person.hp=clamp(person.hp+2,0,person.maxHp);hpGain+=person.hp-before;}
 }
 return {hpGain,stGain,espGain};
}
