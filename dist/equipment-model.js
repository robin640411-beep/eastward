import {ITEMS} from './engine.js';
export const STATS=[['attack','攻擊'],['defense','防禦'],['speed','速度'],['psyche','精神']];
export const SLOTS=['武器','防具','配件'];
export const ITEM_DESCRIPTIONS={
 club:'近戰武器。結實的舊球棒，適合貼身反擊。',
 machete:'近戰武器。廢土鍛造的鋼刃開山刀，輕巧銳利且提升出手速度。',
 pistol:'遠程武器。可靠的老式舊手槍，命中仍會受到角色缺點影響。',
 arc_baton:'近戰武器。改裝自無人機線圈的電弧警棍，對機械敵人額外造成 3 點傷害。',
 shotgun:'遠程武器。重型廢土霰彈槍，近中距離火力驚人並附帶壓制防護。',
 amber_rifle:'遠程武器。拆自佔領軍哨兵的高階琥珀脈衝槍，對機械敵人額外造成 2 點傷害。',
 coat:'厚實帆布與內襯，提供基本防護。',
 vest:'加厚防彈插板，提供穩定的軀幹防禦。',
 hazmat:'密封過濾抗孢子防護衣，降低 2 點污染與毒霧傷害。',
 stealth_cloak:'拆解自光學偽裝組件的披風，大幅提升速度並使人物戰逃跑率 +10%。',
 scrap_plate:'以報廢裝甲片焊接而成的重甲，防禦極高但會略微降低速度。',
 chitin_armor:'以佔領軍黑紫鐮刀甲殼重製的高階戰甲，兼顧極致防禦與進攻輔助。',
 tools:'隨身維修工具組，提供額外防禦加成。',
 charm:'與異星能量產生微弱共鳴的石塊，提升精神屬性。',
 booster_boots:'加裝彈簧與輕量支撐架的助跑靴，顯著提升行動速度。',
 med_scanner:'舊世界戰地生命掃描儀，使用藥品時額外恢復 2 點生命。',
 emp_module:'隨身電磁干擾模組，攻擊機械類敵人時額外造成 2 點傷害。',
 amber_core:'經過穩定的高純度琥珀晶核，大幅強化超能力所需的精神力與攻擊。'
};
export function itemBonuses(id){
 const it=ITEMS[id];if(!it)return '尚未裝備';
 const parts=STATS.filter(([k])=>it[k]).map(([k,name])=>`${name} ${it[k]>0?'+':''}${it[k]}`);
 if(it.vsMachine)parts.push(`對機械 +${it.vsMachine}`);
 if(it.antiPollution)parts.push(`抗污染 -${it.antiPollution}`);
 if(it.healBonus)parts.push(`用藥 +${it.healBonus}`);
 if(it.escapeBonus)parts.push(`逃跑 +${it.escapeBonus}%`);
 return parts.join(' · ')||'無屬性加成';
}
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
