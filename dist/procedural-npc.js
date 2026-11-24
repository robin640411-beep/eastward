// Deterministic real-time procedural NPC generator (lineages, callings, appearance prose & pixel SVGs).
// Uses FNV-1a hash stream keyed by seed + person id; never consumes main gameplay RNG.

function hash32(str){
 let h=2166136261;
 for(let i=0;i<str.length;i++)h=Math.imul(h^str.charCodeAt(i),16777619);
 return h>>>0||1;
}
function makeRng(key){
 let x=hash32(key);
 return (n=100)=>{x^=x<<13;x^=x>>>17;x^=x<<5;x=x>>>0||1;return (x%n);};
}

// 24 NPC-exclusive wasteland races/lineages mapped to closest base race for mechanics
export const EXTRA_NPC_RACES=[
 {id:'iron_lung',name:'鐵肺礦裔',base:'mutant',palette:['#b89b8c','#856b5e','#d46a4c']},
 {id:'ash_nomad',name:'灰霧流民',base:'human',palette:['#c9b5a0','#8e7d6c','#d4b880']},
 {id:'ark_orphan',name:'星艦遺孤',base:'alien',palette:['#8c7ca8','#5c4d78','#f0b254']},
 {id:'half_amber',name:'琥珀半晶人',base:'crystal',palette:['#d9a85b','#9c6a28','#ffe49e']},
 {id:'abyss_diver',name:'深海潛裔',base:'amphibian',palette:['#6fa3ad','#446e78','#9ef0e6']},
 {id:'net_ghost',name:'舊網幽靈',base:'synth',palette:['#95a6b5','#596978','#73e8ff']},
 {id:'rust_cyborg',name:'鏽骨改造人',base:'synth',palette:['#b58367','#784e38','#ff945c']},
 {id:'dune_walker',name:'沙海游牧族',base:'human',palette:['#cca47c','#8f6947','#ffd27d']},
 {id:'stitched',name:'縫合再生者',base:'symbiote',palette:['#a39c93','#6b635b','#d9778a']},
 {id:'twin_pupil',name:'雙瞳觀星族',base:'lumen',palette:['#cfc8e8','#8b82ad','#fff0a6']},
 {id:'silent_kin',name:'靜默修道裔',base:'human',palette:['#d6cfc7','#948c84','#b5c9d6']},
 {id:'acid_born',name:'酸雨適應種',base:'mutant',palette:['#9ab88a','#607d52','#c8ff7a']},
 {id:'scrap_shell',name:'廢鐵寄居族',base:'chitin',palette:['#8b8f94','#55595e','#e0a958']},
 {id:'storm_sense',name:'磁暴感應族',base:'lumen',palette:['#9bbbd9','#5c7b99','#99f3ff']},
 {id:'vent_dweller',name:'地熱穴居人',base:'chitin',palette:['#9e7368','#66443b','#ff8859']},
 {id:'frost_stalker',name:'霜原獵裔',base:'uplift',palette:['#c7d8e6','#7e94a6','#a8f0ff']},
 {id:'violet_hybrid',name:'黑紫混血裔',base:'alien',palette:['#9a82ab','#5f4870','#e8a448']},
 {id:'echo_blind',name:'聲波盲獵族',base:'uplift',palette:['#bda999','#7d6a5c','#c4f0d5']},
 {id:'glass_bloom',name:'溫室花裔',base:'mycelial',palette:['#9ec7a3','#5d8763','#ffd1dc']},
 {id:'ridge_glider',name:'高空滑翔族',base:'mimic',palette:['#b2bcc7','#707b87','#ffe099']},
 {id:'tar_lurker',name:'瀝青潛行種',base:'mimic',palette:['#6e7078','#3f4147','#c99bff']},
 {id:'coral_bone',name:'珊瑚骨族',base:'amphibian',palette:['#d49b94','#945e58','#aee8e0']},
 {id:'mirage_kin',name:'折光蜃樓裔',base:'lumen',palette:['#dfd4eb','#9b8dab','#ffe9b3']},
 {id:'cryo_sleeper',name:'永凍休眠者',base:'human',palette:['#cbd9e6','#8699ab','#8ce6ff']}
];

// 30 NPC-exclusive wasteland callings/occupations
export const EXTRA_NPC_JOBS=[
 {id:'bell_keeper',name:'巡塔守鐘人',base:'guard'},
 {id:'car_undertaker',name:'荒路葬車師',base:'mechanic'},
 {id:'spore_diver',name:'孢子採珠客',base:'scavenger'},
 {id:'film_projectionist',name:'舊片放映師',base:'performer'},
 {id:'water_broker',name:'黑市換水人',base:'merchant'},
 {id:'bridge_ferry',name:'斷橋擺渡客',base:'driver'},
 {id:'ship_watcher',name:'母艦觀測員',base:'scout'},
 {id:'plate_smith',name:'廢鐵鑄甲匠',base:'engineer'},
 {id:'beast_healer',name:'流浪獸醫',base:'medic'},
 {id:'memory_scribe',name:'記憶抄寫員',base:'historian'},
 {id:'radio_tuner',name:'電台修頻師',base:'electrician'},
 {id:'salt_sailor',name:'鹽原風帆手',base:'courier'},
 {id:'cave_grower',name:'地底種菇人',base:'chemist'},
 {id:'relic_courier',name:'遺物送還人',base:'courier'},
 {id:'mire_trapper',name:'酸沼捕手',base:'hunter'},
 {id:'star_salvager',name:'軌道拾星客',base:'scavenger'},
 {id:'field_cook',name:'戰地廚師',base:'medic'},
 {id:'limb_tuner',name:'義體調音師',base:'mechanic'},
 {id:'sign_painter',name:'路牌彩繪師',base:'courier'},
 {id:'ash_guide',name:'灰燼送行者',base:'diplomat'},
 {id:'amber_cutter',name:'琥珀切石匠',base:'researcher'},
 {id:'book_binder',name:'舊書裝幀師',base:'historian'},
 {id:'mill_warden',name:'風車守望人',base:'engineer'},
 {id:'water_filterer',name:'淨水濾匠',base:'chemist'},
 {id:'hound_tamer',name:'獵犬馴師',base:'hunter'},
 {id:'hull_painter',name:'車體彩繪師',base:'performer'},
 {id:'cipher_carver',name:'暗號刻石人',base:'locksmith'},
 {id:'cellar_brewer',name:'地下釀造師',base:'merchant'},
 {id:'ruin_listener',name:'廢墟測音員',base:'scout'},
 {id:'road_bard',name:'流浪說書客',base:'performer'}
];

const COATS=[
 ['#3b4d5e','#24313d','#d4b880','沾滿鹽霜的舊帆布長衣'],
 ['#5c4338','#382720','#c99b68','補滿鐵片的厚重皮大衣'],
 ['#3d5245','#25332a','#a8cfa0','褪色的戰前防風斗篷'],
 ['#4a3b59','#2c2238','#e3a348','縫著異星甲殼碎片的披肩'],
 ['#6b5839','#423621','#f0d48a','黃銅扣環的廢土工裝外套'],
 ['#2f4a52','#1b2d33','#7be0d6','防水耐酸的潛行風衣'],
 ['#5e3840','#381f25','#e69da8','暗紅雙排扣的舊制服大衣'],
 ['#525861','#31363d','#9ec4e6','焊著護肩板的技師連身服']
];
const HEADGEAR=[
 ['hood','戴著壓低帽簷的防塵兜帽'],
 ['hat','頭戴寬簷廢土遮陽帽'],
 ['goggles','額前掛著裂開一角的黃銅護目鏡'],
 ['mask','下半臉罩著改裝濾毒呼吸器'],
 ['antenna','耳側裝著微微閃爍的短波接收天線'],
 ['horns','頭頂生著一對暗色角質突起'],
 ['halo','腦後浮著一圈微弱的冷光環'],
 ['wrap','頭上纏著防沙與止血用的舊布巾']
];
const PROPS=[
 ['lantern','腰間掛著一盞暖黃色的小提燈'],
 ['pack','背上揹著鼓鼓囊囊的鐵框行囊與水壺'],
 ['radio','肩上斜揹著一台不斷微響的舊收音機'],
 ['staff','手裡拄著一根纏滿銅線的探路鐵杖'],
 ['wrench','後腰插著一把磨得發亮的巨型扳手'],
 ['jar','手邊提著一只封存微光孢子的玻璃罐'],
 ['case','懷裡護著一只上鎖的舊世界鐵皮文書箱'],
 ['rifle','背後斜挎著一把纏著布條的老式長槍']
];
const EYES=[
 '眼神像熬過無數守夜班一樣銳利而疲憊',
 '左眼嵌著一枚發出琥珀微光的單片鏡',
 '雙瞳在陰影底下泛著淡淡的螢光',
 '眉骨到臉頰留著一道早已癒合的舊燒傷',
 '鏡片後的目光總是先掃過你的車輪與油箱',
 '神色平靜得像已經走過十次這條荒路'
];

export function enrichProceduralNpc(p,seed=1,catalog=null){
 if(!p||p.procedural)return p;
 const rnd=makeRng(`npc:${seed}:${p.id}:${p.name}:${p.race}:${p.profession}`);
 // 72% chance to use an expanded wasteland race/calling, 28% keep classic label with unique procedural look
 const useExtraRace=rnd(100)<72;
 const useExtraJob=rnd(100)<75;
 const matchingRaces=EXTRA_NPC_RACES.filter(r=>r.base===p.race);
 const extraRace=useExtraRace?(matchingRaces.length&&rnd(100)<65?matchingRaces[rnd(matchingRaces.length)]:EXTRA_NPC_RACES[rnd(EXTRA_NPC_RACES.length)]):null;
 const matchingJobs=EXTRA_NPC_JOBS.filter(j=>j.base===p.profession);
 const extraJob=useExtraJob?(matchingJobs.length&&rnd(100)<65?matchingJobs[rnd(matchingJobs.length)]:EXTRA_NPC_JOBS[rnd(EXTRA_NPC_JOBS.length)]):null;

 const basePalettes={
  human:['#d6ad92','#9e745b','#e0c28b'],alien:['#8a73a6','#54416e','#eba344'],
  mutant:['#a7bd8c','#6b8252','#d8ff80'],synth:['#9aaab8','#5d6d7a','#6ee7ff'],
  uplift:['#b89472','#7a5b3e','#f2c879'],chitin:['#7c6c82','#4a3e50','#e39b4f'],
  mycelial:['#9ec2a8','#5e8268','#f2b6c6'],crystal:['#b6b2e6','#736fa6','#aeeeff'],
  amphibian:['#76b0b5','#45767a','#a6f5e6'],mimic:['#b3a6c9','#6f6285','#e6c6ff'],
  symbiote:['#b598a6','#755866','#f09cb0'],lumen:['#e6dcb8','#a69b76','#fff5b8']
 };
 const skin=extraRace?extraRace.palette:(basePalettes[p.race]||basePalettes.human);
 const coat=COATS[rnd(COATS.length)];
 const head=HEADGEAR[rnd(HEADGEAR.length)];
 const prop=PROPS[rnd(PROPS.length)];
 const eyeText=EYES[rnd(EYES.length)];

 const baseRaceName=catalog?.races?.find(r=>r.id===p.race)?.name||p.race;
 const baseJobName=catalog?.professions?.find(j=>j.id===p.profession)?.name||p.profession;

 p.procedural={
  raceName:extraRace?extraRace.name:baseRaceName,
  jobName:extraJob?extraJob.name:baseJobName,
  skin,
  coat:coat.slice(0,3),
  head:head[0],
  prop:prop[0],
  eyeGlow:skin[2],
  tall:rnd(3), // 0 compact, 1 normal, 2 tall
  appearance:`身穿${coat[3]}，${head[1]}，${prop[1]}，${eyeText}。`
 };
 return p;
}

export function personRaceName(p,catalog){
 return p?.procedural?.raceName||catalog?.races?.find(r=>r.id===p?.race)?.name||p?.race||'旅人';
}
export function personJobName(p,catalog){
 return p?.procedural?.jobName||catalog?.professions?.find(j=>j.id===p?.profession)?.name||p?.profession||'流亡者';
}

function r(x,y,w,h,fill){return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;}

export function proceduralPortraitDataUri(p){
 const pr=p?.procedural;if(!pr)return null;
 const [skin,skinDark,glow]=pr.skin,[coat,coatDark,trim]=pr.coat;
 const parts=[r(0,0,32,32,'#16222e')];
 // Shoulders & collar
 parts.push(r(5,22,22,10,coat),r(5,25,22,7,coatDark),r(11,22,10,3,trim));
 // Head & neck
 parts.push(r(13,19,6,4,skinDark),r(9,8,14,12,skin),r(9,17,14,3,skinDark));
 // Eyes
 parts.push(r(11,13,3,2,'#141a21'),r(18,13,3,2,'#141a21'),r(12,13,1,1,glow),r(19,13,1,1,glow));
 // Headgear variants
 if(pr.head==='hood'){parts.push(r(7,6,18,5,coat),r(7,9,3,11,coatDark),r(22,9,3,11,coatDark));}
 else if(pr.head==='hat'){parts.push(r(4,7,24,3,coatDark),r(9,4,14,4,coat),r(9,7,14,1,trim));}
 else if(pr.head==='goggles'){parts.push(r(9,6,14,3,coatDark),r(9,9,14,3,'#4a3b28'),r(10,9,5,3,glow),r(17,9,5,3,glow));}
 else if(pr.head==='mask'){parts.push(r(9,6,14,3,coatDark),r(10,15,12,6,'#3a4652'),r(12,16,8,3,trim));}
 else if(pr.head==='antenna'){parts.push(r(9,6,14,3,coatDark),r(23,3,2,9,'#8ca0ad'),r(22,2,4,2,glow));}
 else if(pr.head==='horns'){parts.push(r(7,4,3,5,skinDark),r(22,4,3,5,skinDark),r(6,2,2,3,glow),r(24,2,2,3,glow));}
 else if(pr.head==='halo'){parts.push(r(8,3,16,2,glow),r(7,4,2,3,glow),r(23,4,2,3,glow));}
 else{parts.push(r(8,6,16,4,trim),r(22,9,3,5,coatDark));}
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" shape-rendering="crispEdges">${parts.join('')}</svg>`;
 return 'data:image/svg+xml;utf8,'+encodeURIComponent(svg);
}

export function proceduralCharacterDataUri(p){
 const pr=p?.procedural;if(!pr)return null;
 const [skin,skinDark,glow]=pr.skin,[coat,coatDark,trim]=pr.coat;
 const dy=pr.tall===0?4:pr.tall===2?-2:0;
 const parts=[];
 // Back prop
 if(pr.prop==='pack')parts.push(r(16,34+dy,8,24,coatDark),r(17,36+dy,6,6,trim));
 if(pr.prop==='radio')parts.push(r(15,32+dy,9,22,'#3c4c59'),r(17,18+dy,2,15,'#9db4c4'),r(16,16+dy,4,3,glow));
 if(pr.prop==='rifle')parts.push(r(15,24+dy,4,36,'#525f6b'),r(14,20+dy,4,6,'#7a5238'));
 // Legs & boots (bottom strictly touches y=96 for pixel-perfect ground alignment)
 parts.push(r(24,66+dy,7,22-dy,'#2a3540'),r(34,66+dy,7,22-dy,'#232d36'));
 parts.push(r(23,88,9,8,'#1b2229'),r(33,88,9,8,'#1b2229'),r(23,88,9,2,trim),r(33,88,9,2,trim));
 // Torso & coat
 parts.push(r(20,34+dy,25,34,coat),r(20,54+dy,25,14,coatDark),r(30,34+dy,5,30,trim));
 // Arms
 parts.push(r(15,36+dy,6,22,coatDark),r(44,36+dy,6,22,coatDark),r(15,56+dy,5,5,skin),r(45,56+dy,5,5,skin));
 // Head
 parts.push(r(28,30+dy,9,5,skinDark),r(23,14+dy,19,17,skin),r(23,27+dy,19,4,skinDark));
 parts.push(r(26,21+dy,4,3,'#141a21'),r(35,21+dy,4,3,'#141a21'),r(27,21+dy,2,2,glow),r(36,21+dy,2,2,glow));
 // Headgear
 if(pr.head==='hood'){parts.push(r(20,11+dy,25,6,coat),r(20,16+dy,4,16,coatDark),r(41,16+dy,4,16,coatDark));}
 else if(pr.head==='hat'){parts.push(r(14,13+dy,37,4,coatDark),r(22,7+dy,21,7,coat),r(22,12+dy,21,2,trim));}
 else if(pr.head==='goggles'){parts.push(r(22,11+dy,21,4,coatDark),r(23,16+dy,19,4,glow));}
 else if(pr.head==='mask'){parts.push(r(22,11+dy,21,4,coatDark),r(24,24+dy,17,8,'#3a4652'),r(27,26+dy,11,3,trim));}
 else if(pr.head==='antenna'){parts.push(r(22,11+dy,21,4,coatDark),r(43,5+dy,2,14,'#9db4c4'),r(42,3+dy,4,3,glow));}
 else if(pr.head==='horns'){parts.push(r(20,7+dy,4,8,skinDark),r(41,7+dy,4,8,skinDark),r(19,4+dy,3,4,glow),r(43,4+dy,3,4,glow));}
 else if(pr.head==='halo'){parts.push(r(21,5+dy,23,3,glow));}
 else{parts.push(r(21,11+dy,23,5,trim));}
 // Hand prop
 if(pr.prop==='lantern')parts.push(r(47,60+dy,6,9,'#423624'),r(48,62+dy,4,5,'#ffd875'));
 else if(pr.prop==='staff')parts.push(r(48,18+dy,3,74,'#7a5a3a'),r(47,15+dy,5,5,glow));
 else if(pr.prop==='wrench')parts.push(r(47,48+dy,4,18,'#9aaab8'),r(45,44+dy,8,5,'#c7d4dc'));
 else if(pr.prop==='jar')parts.push(r(46,58+dy,7,10,'#7bc7d4'),r(48,61+dy,3,5,glow));
 else if(pr.prop==='case')parts.push(r(45,58+dy,10,9,'#6e583f'),r(48,61+dy,4,2,trim));
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 96" width="64" height="96" shape-rendering="crispEdges">${parts.join('')}</svg>`;
 return 'data:image/svg+xml;utf8,'+encodeURIComponent(svg);
}
