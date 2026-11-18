import {ITEMS} from './engine.js';
export const STATS=[['attack','攻擊'],['defense','防禦'],['speed','速度'],['psyche','精神']];
export const SLOTS=['武器','防具','配件'];
export const ITEM_DESCRIPTIONS={club:'近戰武器。結實的舊球棒，適合貼身反擊。',pistol:'遠程武器。提高攻擊，命中仍會受到角色缺點影響。',coat:'厚實布料提供基本防護。',vest:'加厚防護板，提供較高的防禦。',tools:'隨身工具組。此裝備提供防禦加成。',charm:'與心靈產生共鳴，提升精神屬性。'};
export function itemBonuses(id){const it=ITEMS[id];return it?STATS.filter(([k])=>it[k]).map(([k,name])=>`${name} +${it[k]}`).join(' · '):'尚未裝備';}
export function equipmentPreview(game,person,itemId){const item=ITEMS[itemId];if(!person||!item)return null;
 const previous=person.gear[item.slot]||null,next={...person,gear:{...person.gear,[item.slot]:itemId}};
 const stats=STATS.map(([key,name])=>{const before=game.stat(person,key),after=game.stat(next,key);return {key,name,before,after,delta:after-before};});
 const notes=[];
 if(item.slot==='武器'){const old=ITEMS[previous];if(!!old?.ranged!==!!item.ranged)notes.push(`攻擊方式：${old?.ranged?'遠程':'近戰'} → ${item.ranged?'遠程':'近戰'}`);
  if(person.flaw==='unsteady')notes.push(item.ranged?'手不穩：此武器的命中率會額外降低 10 個百分點。':'此武器為近戰，不受「手不穩」的遠程命中懲罰影響。');
  if(person.flaw==='weak_grip')notes.push(item.ranged?'此武器為遠程，不受「握力不足」的近戰傷害懲罰影響。':'握力不足：近戰傷害會額外減少 1。');
 }
 return {itemId,item,previous,stats,notes,same:previous===itemId,owned:game.s.inventory.includes(itemId)};
}
