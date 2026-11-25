// Attack identity is deterministic presentation data, not an additional combat roll.
export const ATTACK_STYLES={
 punch:{name:'拳擊',shape:'impact',color:'#edc79a'},club:{name:'揮棒',shape:'club',color:'#deb782'},
 blade:{name:'刃擊',shape:'slash',color:'#dbe5db'},claw:{name:'爪擊',shape:'claw',color:'#e9baa3'},
 bite:{name:'撕咬',shape:'bite',color:'#e4c1a1'},slam:{name:'重壓',shape:'slam',color:'#c8ad8a'},
 tentacle:{name:'觸手鞭擊',shape:'tentacle',color:'#b7a1bd'},bullet:{name:'手槍射擊',shape:'bullet',color:'#e6c38c'},
 burst_fire:{name:'連發射擊',shape:'burst_fire',color:'#e3ca98'},cannon:{name:'砲擊',shape:'cannon',color:'#e3a978'},
 ram:{name:'車體衝撞',shape:'ram',color:'#f0b868'},acid:{name:'酸液噴吐',shape:'acid',color:'#b3c476'},
 spores:{name:'孢子噴散',shape:'spores',color:'#a2bd9a'},shock:{name:'電弧放電',shape:'shock',color:'#9bcfdf'},
 saw:{name:'旋刃切割',shape:'saw',color:'#c4d1d2'},dive:{name:'俯衝撲擊',shape:'dive',color:'#d2beb0'},
 cross_slash:{name:'四臂斬擊',shape:'cross_slash',color:'#d9cfac'},swarm:{name:'蟲群湧出',shape:'swarm',color:'#b6b88a'},
 psychic:{name:'精神侵入',shape:'psychic',color:'#c5addf'}
};
export const ENEMY_ATTACKS={raider:'bullet',soldier:'burst_fire',mutant:'slam',infected:'claw',crawler:'acid',hound:'bite',nest:'acid',swarm:'spores',drone:'shock',turret:'cannon',worker:'saw',sentinel:'blade',lurker:'claw',brute:'slam',wing:'dive',parasite:'tentacle'};
export const BOSS_ATTACKS={overseer:'cross_slash',broodmother:'swarm',zero_core:'cannon',graft_colossus:'slam',fallen_angel:'psychic'};
const fx=(name,shape,color,variant=0)=>({name,shape,color,variant});
export const POWER_STYLES={
 human:[fx('念力推擊','force','#b9c5ec'),fx('心靈復原','heal','#abd7b7'),fx('意志屏障','shield','#b9c5ec')],
 alien:[fx('星芒','stars','#ded1a6'),fx('靜默波','silence','#b7b5dd'),fx('腦域風暴','storm','#beb4ec')],
 mutant:[fx('異變衝擊','rupture','#c8a2ad'),fx('再生','heal','#b3cf92',1),fx('畸變爆發','eruption','#c6a182')],
 synth:[fx('脈衝','pulse','#a1d2d6'),fx('反應護盾','shield','#a1d2d6',1),fx('系統震盪','overload','#bfd8ee')],
 uplift:[fx('野性共鳴','sonic','#d6ba8c'),fx('生命回聲','heal','#b6cf97',2),fx('心靈嚎叫','howl','#dec49d')],
 chitin:[fx('碎甲念波','shards','#d4c1a1'),fx('甲殼屏障','shield','#b7bf98',2),fx('鎮壓','crush','#c8c4a9')],
 mycelial:[fx('孢子念波','spores','#afd0a1'),fx('菌網修復','heal','#a4c79a',3),fx('眠霧','sleep_mist','#bcc7ba')],
 crystal:[fx('晶芒','crystal','#c4c0e9'),fx('折射屏障','shield','#cad2e9',3),fx('共振崩解','shatter','#c3cfea')],
 amphibian:[fx('潮汐衝擊','water','#91c4d0'),fx('潮生修復','heal','#9bcfcd',4),fx('深水屏障','shield','#a3d1d8',4)],
 mimic:[fx('幻影刺擊','phantom','#c1afd8'),fx('感官錯置','confuse','#c8b5cd'),fx('幻象屏障','shield','#c7b6d9',5)],
 symbiote:[fx('共生鞭擊','tentacle','#bba2b8'),fx('生命縫合','heal','#d3afb4',5),fx('雙重意識','shield','#c5aabd',6)],
 lumen:[fx('光束','beam','#f1dba5'),fx('溫光','heal','#efdbab',6),fx('極光爆發','aurora','#d5d6b3')]
};
const weaponStyle=p=>({pistol:'bullet',club:'club',machete:'blade',shotgun:'burst_fire',arc_baton:'shock',amber_rifle:'cannon'}[p.gear?.武器]||'punch');
export function enemyAttackStyle(e,mode='character'){if(mode==='vehicle')return ['armored','bus'].includes(e.vehicle)?'cannon':'ram';if(e.npc)return weaponStyle(e.npc);return BOSS_ATTACKS[e.bossId]||ENEMY_ATTACKS[e.key]||'claw';}
export function actionVisual(unit,command,battle,side,driver){
 if(command?.type==='psi')return {...(POWER_STYLES[unit.race]?.[Number(command.power)]||POWER_STYLES.human[0]),kind:'psi'};
 if(command?.type==='medicine')return fx('使用藥品','medicine','#b8d7be');
 if(command?.type==='defend')return fx('防禦','shield','#b0c7d2');
 if(command?.type==='escape')return fx('脫離戰鬥','escape','#bdc8cb');
 const id=side==='enemies'?(unit.attackStyle||enemyAttackStyle(unit,battle.mode)):battle.mode==='vehicle'&&unit.id===driver?(battle.vehicleStyle||(battle.vehicleGun?'burst_fire':'ram')):weaponStyle(unit);
 return {...ATTACK_STYLES[id],id};
}
export const battleSlots=party=>Array.from({length:4},(_,i)=>party[i]||null);
export function partyAnchor(party,id,cy=225){
 const slot=party.findIndex(p=>p?.id===id);
 return slot>=0&&slot<4 ? {cx:48+slot*96,cy} : null;
}
export function commandPage(items,page=0,size=4){const pages=Math.max(1,Math.ceil(items.length/size)),index=Math.max(0,Math.min(pages-1,page));return {items:items.slice(index*size,(index+1)*size),page:index,pages};}
export const BEAT_MS=980;
export const IMPACT_MS=360;

// Read the resolved action. A traveller can still be shown after a lethal hit.
export function bustRole(beat,id){
 if(!beat)return null;
 if(beat.side==='party')return beat.actor===id&&['attack','psi'].includes(beat.kind)?'attack':null;
 if(beat.kind!=='attack')return null;
 if(beat.effects.some(f=>f.side==='party'&&f.id===id&&f.amount<0))return 'hit';
 if(beat.target===id)return beat.label?.includes('落空')?'evade':'guard';
 return null;
}

const unit=x=>Math.max(0,Math.min(1,x));
export function bustPose(role,ms,direction,soft=false){
 if(!role||ms<=0||ms>=BEAT_MS)return null;
 const rise=unit(ms/230),sink=unit((ms-700)/(BEAT_MS-700));
 const visible=(1-(1-rise)**3)*(1-sink*sink);
 if(soft)return {height:Math.round(69+7*visible),x:0,y:0,lean:0,alpha:visible};
 const since=ms-IMPACT_MS;
 // Briefly hold contact, then let the body settle before sliding below the frame.
 const recoil=since<0?0:1-unit((since-62)/190);
 const windup=unit((ms-155)/125)*(1-unit((ms-295)/65));
 let x=0,y=0,lean=0;
 if(role==='attack'){x=direction*(-3*windup+5*recoil);y=3*windup-3*recoil;lean=direction*(-2*windup+4*recoil);}
 if(role==='hit'){x=-direction*6*recoil;y=5*recoil;lean=-direction*8*recoil;}
 if(role==='guard'){y=4*Math.max(windup,recoil);lean=-direction*2*recoil;}
 if(role==='evade'){x=-direction*10*Math.max(windup,recoil);lean=-direction*6*Math.max(windup,recoil);}
 return {height:Math.round(76*visible),x:Math.round(x)||0,y:Math.round(y)||0,lean:Math.round(lean)||0,alpha:1};
}

// Each enemy owns a disjoint stage lane; dead slots stay reserved.
// Large bodies, heads and vehicle ends must remain tappable on narrow phones.
export function enemyTargetRegions(enemies,layout){return enemies.map((_,i)=>{const left=i?(layout[i-1].cx+layout[i].cx)/2:0,right=i<layout.length-1?(layout[i].cx+layout[i+1].cx)/2:384;return {left,width:right-left,caption:layout[i].cx-left};});}
