// XP progression curve (cap Lv.18, reachable on 10,000 km, unreachable on 3,000/5,000 km)
// and 3-tier Boss catalog: 5 Mini-Bosses, 5 Mid-Bosses, plus the 5 Grand Final Bosses.
export const XP_LEVEL_CAP=18;

export function xpToNext(level=1){
 const lv=Math.max(1,Math.min(XP_LEVEL_CAP,Math.floor(level)));
 if(lv>=XP_LEVEL_CAP)return 0;
 return 20+(lv-1)*18;
}

export function totalXpToMax(){
 let sum=0;
 for(let lv=1;lv<XP_LEVEL_CAP;lv++)sum+=xpToNext(lv);
 return sum;
}

export const XP_REWARDS={
 stop:10,
 explore:15,
 combatBase:15,
 combatPerEnemy:4,
 miniBoss:45,
 midBoss:85,
 finalBoss:120
};

export const MINI_BOSSES=[
 {
  id:'mini_highway_baron',tier:'mini',name:'鋼鐵暴君「鐵齒男爵」',key:'raider',
  hp:64,attack:10,defense:5,speed:8,esp:14,psyche:6,psiRace:'human',psiLevel:3,
  machine:false,attackStyle:'burst_fire',
  description:'一輛焊滿尖刺的改裝重卡攔在公路中央，身穿釘甲的「鐵齒男爵」扛著雙管散彈砲跳下車斗：「這一段柏油路歸我收稅——要麼留車，要麼留命！」',
  authorQuip:'（看他肩膀上那兩根鐵角就知道，這傢伙平常過涵洞肯定老是卡住。）'
 },
 {
  id:'mini_spore_warden',tier:'mini',name:'腐林巨蕈「菌核守望者」',key:'spore_giant',
  hp:70,attack:9,defense:6,speed:6,esp:18,psyche:8,psiRace:'mycelial',psiLevel:3,
  machine:false,attackStyle:'spore_burst',
  description:'路面裂縫裡緩緩升起一尊三公尺高的發光巨蕈，數條粗壯菌絲像觸手般抽打柏油，空氣裡瞬間瀰漫起令人暈眩的螢光毒霧！',
  authorQuip:'（我一直懷疑這東西切下來能不能煮火鍋，但眼下還是別拿命做實驗比較好。）'
 },
 {
  id:'mini_drone_matriarch',tier:'mini',name:'星軌母機「蜂巢中繼器」',key:'drone',
  hp:60,attack:11,defense:6,speed:10,esp:18,psyche:8,psiRace:'synth',psiLevel:3,
  machine:true,attackStyle:'pulse_beam',
  description:'低空傳來刺耳的高頻蜂鳴，一台銀灰色外星母機展開環形機翼懸停在車頭前方，藍白色的掃描網瞬間封鎖整條車道！',
  authorQuip:'（外星人的掃地機器人進化成這樣，難怪地球人打不贏。）'
 },
 {
  id:'mini_sand_leviathan',tier:'mini',name:'赤沙巨顎「裂地蠕蟲王」',key:'sand_worm',
  hp:74,attack:11,defense:5,speed:7,esp:14,psyche:6,psiRace:'chitin',psiLevel:3,
  machine:false,attackStyle:'heavy_slam',
  description:'整條公路猛地向上拱起碎裂，一頭環節甲殼泛著金屬光澤的巨型蠕蟲王破土而出，張開滿布利齒的環形巨口！',
  authorQuip:'（保險公司要是還在，絕對會拒保「被地下巨蟲啃掉底盤」這一條。）'
 },
 {
  id:'mini_bounty_marshal',tier:'mini',name:'荒原處刑官「冷血警長」',key:'sniper',
  hp:58,attack:12,defense:5,speed:11,esp:16,psyche:7,psiRace:'human',psiLevel:3,
  machine:false,attackStyle:'precision_shot',
  description:'頭戴寬簷帽、右眼泛著紅光的義體警長橫槍立在路中央，長管磁軌步槍緩緩舉平：「公路上不缺亡命徒，讓我看看你們有沒有資格繼續往東。」',
  authorQuip:'（穿風衣在荒原耍帥是很帥啦，就是不知道他裡面到底塞了幾塊防彈板。）'
 }
];

export const MID_BOSSES=[
 {
  id:'mid_siege_walker',tier:'mid',name:'重裝步行機「鐵幕攻城獸」',key:'sentinel',
  hp:118,attack:15,defense:8,speed:8,esp:24,psyche:10,psiRace:'synth',psiLevel:5,
  machine:true,attackStyle:'cannon',
  description:'六條液壓鋼足踏碎水泥路基，外星先遣軍遺留的重裝攻城步行機緩緩轉動雙聯主砲，火控雷射鎖死了整條東行通道！',
  authorQuip:'（這玩意兒的腳掌比我們整輛車還寬，硬撞的話大概只會幫它搔癢。）'
 },
 {
  id:'mid_blood_warlord',tier:'mid',name:'公路軍閥「焦土大公」',key:'brute',
  hp:124,attack:16,defense:7,speed:10,esp:20,psyche:8,psiRace:'human',psiLevel:5,
  machine:false,attackStyle:'burst_fire',
  description:'身披暗紅動力重甲的「焦土大公」從燃燒的車陣後大步走出，雙臂改裝重火器噴出橘紅火舌：「能開到這裡算你們有本事——把車鑰匙和命都交出來！」',
  authorQuip:'（末日之後誰都能自封大公，可惜他手裡的火砲可不是封著玩的。）'
 },
 {
  id:'mid_crystal_archon',tier:'mid',name:'晶脈執政官「紫晶仲裁者」',key:'crystal_golem',
  hp:112,attack:14,defense:8,speed:11,esp:30,psyche:13,psiRace:'crystal',psiLevel:5,
  machine:false,attackStyle:'pulse_beam',
  description:'半空中浮現數十枚旋轉的紫藍晶體碎片，身披能量光袍的異星執政官低聲宣告：「未獲授權的碳基旅人，此處即為你們的終點。」',
  authorQuip:'（外星高官講話總是文縐縐的，翻譯成白話就是「我要把你們轟成渣」。）'
 },
 {
  id:'mid_plague_behemoth',tier:'mid',name:'生化巨獸「疫霧吞噬者」',key:'mutant',
  hp:132,attack:15,defense:7,speed:8,esp:22,psyche:9,psiRace:'mutant',psiLevel:5,
  machine:false,attackStyle:'heavy_slam',
  description:'如小山般的變異縫合巨獸從毒霧中緩緩起身，背上鼓脹著發光的酸液囊泡，一聲咆哮震得車窗玻璃嗡嗡作響！',
  authorQuip:'（這已經不是生物演化了，根本是外星實驗室把剩菜全倒進同一鍋煮出來的。）'
 },
 {
  id:'mid_orbital_inquisitor',tier:'mid',name:'軌道審判官「白銀肅清者」',key:'soldier',
  hp:114,attack:16,defense:9,speed:12,esp:28,psyche:12,psiRace:'alien',psiLevel:5,
  machine:false,attackStyle:'pulse_beam',
  description:'白銀色流線戰甲在陽光下刺眼無比，軌道審判官手持高能戰戟落地攔路，周圍空氣因高壓電漿而劇烈扭曲！',
  authorQuip:'（能把盔甲擦得這麼亮，想必平常不是在肅清人類，就是在打蠟。）'
 }
];

export const ALL_TIER_BOSSES=[...MINI_BOSSES,...MID_BOSSES];

export function tierBossDefinition(id){
 return ALL_TIER_BOSSES.find(b=>b.id===id)||null;
}

function seededPickOrder(list,seed,salt){
 let h=2166136261;
 for(const ch of `${seed}:${salt}`)h=Math.imul(h^ch.charCodeAt(0),16777619);
 const next=()=>{h^=h<<13;h^=h>>>17;h^=h<<5;return (h>>>0)/4294967296;};
 const arr=[...list];
 for(let i=arr.length-1;i>0;i--){
  const j=Math.floor(next()*(i+1));
  [arr[i],arr[j]]=[arr[j],arr[i]];
 }
 return arr;
}

export function milestoneBossPlan(totalKm=1000,seed=1){
 const minis=seededPickOrder(MINI_BOSSES,seed,'mini-bosses');
 const mids=seededPickOrder(MID_BOSSES,seed,'mid-bosses');
 const km=Number(totalKm)||1000;
 if(km===3000){
  return {
   milestones:[{progress:150,km:1500,tier:'mini',bossId:minis[0].id,scale:0.95}],
   finaleTier:'mid',
   finaleBossId:mids[0].id,
   finaleScale:0.92
  };
 }
 if(km===5000){
  return {
   milestones:[
    {progress:150,km:1500,tier:'mini',bossId:minis[0].id,scale:0.95},
    {progress:320,km:3200,tier:'mini',bossId:minis[1].id,scale:1.12}
   ],
   finaleTier:'mid',
   finaleBossId:mids[0].id,
   finaleScale:1.15
  };
 }
 if(km===10000){
  return {
   milestones:[
    {progress:200,km:2000,tier:'mini',bossId:minis[0].id,scale:1.0},
    {progress:400,km:4000,tier:'mini',bossId:minis[1].id,scale:1.18},
    {progress:580,km:5800,tier:'mid',bossId:mids[0].id,scale:1.05},
    {progress:800,km:8000,tier:'mid',bossId:mids[1].id,scale:1.22}
   ],
   finaleTier:'final',
   finaleBossId:null, // Uses the 5 Grand Final Bosses (overseer, broodmother, zero_core, graft_colossus, fallen_angel)
   finaleScale:1.0
  };
 }
 return {milestones:[],finaleTier:'final',finaleBossId:null,finaleScale:1.0};
}
