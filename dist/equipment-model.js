import {ITEMS} from './engine.js';
export const STATS=[['attack','攻擊'],['defense','防禦'],['speed','速度'],['psyche','精神']];
export const SLOTS=['武器','防具','配件'];
export const ITEM_DESCRIPTIONS={
 club:'近戰武器。結實的舊球棒，適合貼身反擊。',
 crowbar:'近戰武器。厚實鋼製撬棍，既能砸開箱鎖也能格擋反擊。',
 machete:'近戰武器。廢土鍛造的鋼刃開山刀，輕巧銳利且提升出手速度。',
 pistol:'遠程武器。可靠的老式舊手槍，命中仍會受到角色缺點影響。',
 crossbow:'遠程武器。安靜又輕快的改裝複合弩，極適合先手壓制。',
 arc_baton:'近戰武器。改裝自無人機線圈的電弧警棍，對機械敵人額外造成 3 點傷害。',
 shotgun:'遠程武器。重型廢土霰彈槍，近中距離火力驚人並附帶壓制防護。',
 plasma_cutter:'近戰武器。重工業電漿切割器，切開機械外殼如切奶油（對機械 +4）。',
 amber_rifle:'遠程武器。拆自佔領軍哨兵的高階琥珀脈衝槍，對機械敵人額外造成 2 點傷害。',
 vibro_blade:'近戰武器。通電後高速震動的長刃，大幅提升攻擊與出手速度。',
 rail_sniper:'遠程武器。精密磁軌狙擊槍，超高穿透火力並對機械 +2。',
 star_cannon:'遠程武器。佔領軍重型手提星軌光砲，火力毀滅性且附帶靈能增幅。',
 coat:'厚實帆布與內襯，提供基本防護。',
 leather_jacket:'防風耐磨的公路皮衣，輕便靈活並略微提升速度。',
 vest:'加厚防彈插板，提供穩定的軀幹防禦。',
 hazmat:'密封過濾抗孢子防護衣，降低 2 點污染與毒霧傷害。',
 nomad_mantle:'沙海游牧族縫製的輕盈斗篷，提升速度並使人物戰逃跑率 +8%。',
 riot_suit:'舊時代警用鎮暴護甲，兼顧全身防禦與基礎防毒過濾。',
 stealth_cloak:'拆解自光學偽裝組件的披風，大幅提升速度並使人物戰逃跑率 +10%。',
 scrap_plate:'以報廢裝甲片焊接而成的重甲，防禦極高但會略微降低速度。',
 exo_frame:'液壓輔助輕型外骨骼，同時強化防禦、近遠程攻擊與機動性。',
 chitin_armor:'以佔領軍黑紫鐮刀甲殼重製的高階戰甲，兼顧極致防禦與進攻輔助。',
 aegis_coat:'織入異星晶絲的抗能長大衣，高防禦同時大幅強化精神力與抗污染。',
 titan_plate:'拆自星門守衛的重裝動力甲，頂尖防護力與抗污染能力。',
 tools:'隨身維修工具組，提供額外防禦加成。',
 lucky_dice:'老司機掛在後照鏡上的幸運骰，提升速度並使人物戰逃跑率 +12%。',
 charm:'與異星能量產生微弱共鳴的石塊，提升精神屬性。',
 silver_locket:'裝著舊世界照片的銀懷錶，安定心神並帶來額外防禦與精神。',
 booster_boots:'加裝彈簧與輕量支撐架的助跑靴，顯著提升行動速度。',
 bandolier:'俐落分裝彈匣與刀鞘的戰術背帶，提升攻擊與出手速度。',
 med_scanner:'舊世界戰地生命掃描儀，使用藥品時額外恢復 2 點生命。',
 emp_module:'隨身電磁干擾模組，攻擊機械類敵人時額外造成 2 點傷害。',
 auto_injector:'感應外傷自動施藥的腕環，使用藥品時額外恢復 4 點生命。',
 amber_core:'經過穩定的高純度琥珀晶核，大幅強化超能力所需的精神力與攻擊。',
 psi_circlet:'外星靈能增幅頭環，極大幅度提升精神屬性與出招速度。',
 chrono_compass:'能微調感官節奏的星軌校準羅盤，全屬性 +2 並使逃跑率 +10%。'
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
