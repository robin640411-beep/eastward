// Presentation records contain no dice rolls and never enter the saved game.
export function battleFrame(s,b=s.battle){return {
 party:s.party.map(p=>({id:p.id,hp:p.hp,st:p.st,esp:p.esp,asleep:p.asleep})),
 enemies:(b?.enemies||[]).map(e=>({id:e.id,hp:e.hp,stun:e.stun||0})),
 vehicle:s.vehicle.hp,resources:{...s.resources}
};}
export function frameEffects(before,after){const effects=[];
 for(const side of ['party','enemies'])for(const p of after[side]){const old=before[side].find(q=>q.id===p.id);if(old&&old.hp!==p.hp)effects.push({side,id:p.id,amount:p.hp-old.hp});}
 if(after.vehicle!==before.vehicle)effects.push({side:'vehicle',id:'vehicle',amount:after.vehicle-before.vehicle});
 return effects;
}
export function applyBattleFrame(s,f){for(const side of ['party','enemies'])for(const unit of side==='party'?s.party:s.battle.enemies){const change=f[side].find(q=>q.id===unit.id);if(change)Object.assign(unit,change);}s.vehicle.hp=f.vehicle;s.resources={...f.resources};}
export function transitionFor(before,after){if(!before||!after)return null;
 const inside=s=>!!(s.current?.inside||s.frames?.at(-1)?.kind==='building');
 if(after.mode==='combat'&&before.mode!=='combat')return 'battle';
 if(inside(before)!==inside(after)&&after.mode!=='ending')return inside(after)?'enter':'leave';
 return null;
}
