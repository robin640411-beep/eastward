import {concealAttitudeLabels} from './npc-presentation.js';
// Presentation timing uses its own hash, never the gameplay random stream.
export function tripDuration(state){
 let x=((state.seed>>>0)^Math.imul((state.stop||0)+1,2654435761)^Math.imul(state.minutes||0,2246822519))>>>0;
 x=Math.imul(x^(x>>>16),2246822507)>>>0;x=Math.imul(x^(x>>>13),3266489909)>>>0;
 return 10000+((x^(x>>>16))>>>0)%7001;
}
// Old saves keep their original records; only their player-facing view is adapted.
export function journalEntry(entry){
 if(entry.title==='停靠判定')return null;
 if(entry.title==='行車結算')return {...entry,title:'向東行駛',text:entry.text.replace(/^D10\s+\d+，前進\s+\d+，/,'又走過一段公路。')};
 return {...entry,text:concealAttitudeLabels(entry.text)};
}
