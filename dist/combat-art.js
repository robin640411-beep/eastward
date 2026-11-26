// Fixed-resolution pixel PNGs. This module is pure presentation data: no network,
// random rolls, canvas work or eager image loading. Each NPC loads one small PNG.
export const COMBAT_RACES=Object.freeze(['human','alien','mutant','synth','uplift','chitin','mycelial','crystal','amphibian','mimic','symbiote','lumen']);
export const COMBAT_JOBS=Object.freeze(['driver','mechanic','medic','soldier','scout','merchant','scavenger','engineer','researcher','hacker','hunter','guard','courier','diplomat','historian','locksmith','demolition','chemist','electrician','performer']);
export const COMBAT_WEAPONS=Object.freeze(['none','club','pistol']);
export const COMBAT_ENEMIES=Object.freeze(['raider','soldier','mutant','infected','crawler','hound','nest','swarm','drone','turret','worker','sentinel','lurker','brute','wing','parasite','sniper','pyro','mech_hound','spore_giant','crystal_golem','harvester','mire_toad','sand_worm','wraith','biker']);
export const COMBAT_BOSSES=Object.freeze(['overseer','broodmother','zero_core','graft_colossus','fallen_angel','mini_highway_baron','mini_spore_warden','mini_drone_matriarch','mini_sand_leviathan','mini_bounty_marshal','mid_siege_walker','mid_blood_warlord','mid_crystal_archon','mid_plague_behemoth','mid_orbital_inquisitor']);
export const COMBAT_BOSS_NAMES=Object.freeze({overseer:'星門監督官',broodmother:'孵界母體',zero_core:'歸零主機',graft_colossus:'接骨巨像',fallen_angel:'失落天使',mini_highway_baron:'鋼鐵暴君「鐵齒男爵」',mini_spore_warden:'腐林巨蕈「菌核守望者」',mini_drone_matriarch:'星軌母機「蜂巢中繼器」',mini_sand_leviathan:'赤沙巨顎「裂地蠕蟲王」',mini_bounty_marshal:'荒原處刑官「冷血警長」',mid_siege_walker:'重裝步行機「鐵幕攻城獸」',mid_blood_warlord:'公路軍閥「焦土大公」',mid_crystal_archon:'晶脈執政官「紫晶仲裁者」',mid_plague_behemoth:'生化巨獸「疫霧吞噬者」',mid_orbital_inquisitor:'軌道審判官「白銀肅清者」'});
const descriptor=(kind,key,width,height,extra={})=>({image:`assets/combat/${kind}/${key}.png`,width,height,kind:kind==='npcs'?'npc':kind==='bosses'?'boss':'enemy',key,...extra});

// Current person state uses race, profession and gear.武器. Unknown equipment is
// shown as an empty hand rather than silently inventing a gun or other weapon.
export function npcCombatArt(npc={}){
 const race=COMBAT_RACES.includes(npc?.race)?npc.race:'human';
 const profession=COMBAT_JOBS.includes(npc?.profession)?npc.profession:'driver';
 const equipped=npc?.gear?.武器;
 const weapon=COMBAT_WEAPONS.includes(equipped)?equipped:'none';
 return descriptor('npcs',`${race}_${profession}_${weapon}`,64,96,{race,profession,weapon});
}

// A named hostile NPC preserves their actual race, profession and equipment.
// bossId takes precedence over the ordinary archetype key inherited by bosses.
export function enemyCombatArt(enemy={}){
 if(enemy?.npc)return npcCombatArt(enemy.npc);
 const boss=enemy?.bossId||enemy?.id;
 if(COMBAT_BOSSES.includes(boss))return descriptor('bosses',boss,128,128);
 const candidate=typeof enemy==='string'?enemy:enemy?.key;
 const key=COMBAT_ENEMIES.includes(candidate)?candidate:'raider';
 return descriptor('enemies',key,96,96);
}
export function combatSprite(entity={}){
 if(entity?.npc)return npcCombatArt(entity.npc);
 if(entity?.bossId||COMBAT_BOSSES.includes(entity?.id))return enemyCombatArt(entity);
 return entity?.race||entity?.profession?npcCombatArt(entity):enemyCombatArt(entity);
}
export const combatSpritePath=entity=>combatSprite(entity).image;

// For offline coverage checks and the optional gallery. The game never needs to
// call this or download the whole set; file size is about 1.2 MB for all 741 PNGs.
export function combatArtCatalog(){
 return [
  ...COMBAT_RACES.flatMap(race=>COMBAT_JOBS.flatMap(profession=>COMBAT_WEAPONS.map(weapon=>npcCombatArt({race,profession,gear:{武器:weapon}})))),
  ...COMBAT_ENEMIES.map(key=>enemyCombatArt({key})),
  ...COMBAT_BOSSES.map(bossId=>enemyCombatArt({bossId}))
 ];
}
