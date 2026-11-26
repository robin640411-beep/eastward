// Consumable supplies: HP medkits, ST food, ESP energy drinks, and full-recovery rations.
export const CONSUMABLES={
 bandage:{id:'bandage',name:'無菌急救繃帶',kind:'藥品',hp:10,st:0,esp:0,price:2,desc:'快速止血包紮，恢復 10 點生命。'},
 antibiotics:{id:'antibiotics',name:'戰地抗生素',kind:'藥品',hp:18,st:0,esp:0,price:4,desc:'處理發炎與重傷感染，恢復 18 點生命。'},
 regen_shot:{id:'regen_shot',name:'異星再生針劑',kind:'藥品',hp:32,st:0,esp:0,price:7,desc:'逆向合成的細胞修復針，大幅恢復 32 點生命。'},
 canned_ration:{id:'canned_ration',name:'戰前罐頭口糧',kind:'食物',hp:0,st:10,esp:0,price:2,desc:'雖然過期三年但沒脹罐，吃下去恢復 10 點體力。'},
 jerky_pack:{id:'jerky_pack',name:'煙燻荒原肉乾',kind:'食物',hp:0,st:16,esp:0,price:3,desc:'耐嚼高熱量的公路零嘴，恢復 16 點體力。'},
 military_mre:{id:'military_mre',name:'濃縮野戰軍糧',kind:'食物',hp:4,st:26,esp:0,price:5,desc:'內附發熱包的完整軍用口糧，恢復 26 點體力與 4 點生命。'},
 neon_soda:{id:'neon_soda',name:'霓虹能量汽水',kind:'能量飲',hp:0,st:3,esp:8,price:2,desc:'喝起來像發光電池的提神汽水，恢復 8 點 ESP 與 3 點體力。'},
 psi_coffee:{id:'psi_coffee',name:'超感特濃黑咖啡',kind:'能量飲',hp:0,st:5,esp:14,price:4,desc:'廢土老司機最愛，瞬間提神並恢復 14 點 ESP 與 5 點體力。'},
 crystal_elixir:{id:'crystal_elixir',name:'液態晶核濃縮飲',kind:'能量飲',hp:0,st:0,esp:24,price:6,desc:'高純度異星晶體萃取液，大幅恢復 24 點 ESP。'},
 hot_stew:{id:'hot_stew',name:'驛站熱騰騰雜燴湯',kind:'綜合補給',hp:14,st:14,esp:8,price:6,desc:'暖胃又暖心的豪華湯鍋，同時恢復 14 生命、14 體力、8 ESP。'}
};

export const CONSUMABLE_IDS=Object.keys(CONSUMABLES);

export function starterConsumables(){
 return {bandage:1,canned_ration:2,neon_soda:1};
}

export function consumableEffectText(id){
 const c=CONSUMABLES[id];if(!c)return '';
 const parts=[];
 if(c.hp)parts.push(`生命 +${c.hp}`);
 if(c.st)parts.push(`體力 +${c.st}`);
 if(c.esp)parts.push(`ESP +${c.esp}`);
 return parts.join(' · ');
}

export function shopConsumables(shop){
 if(shop==='pharmacy'||shop==='clinic')return ['bandage','antibiotics','regen_shot','crystal_elixir'];
 if(shop==='general_shop')return ['bandage','canned_ration','jerky_pack','military_mre','neon_soda','psi_coffee','hot_stew'];
 if(shop==='npc_trade')return ['canned_ration','jerky_pack','neon_soda','bandage'];
 return [];
}
