// Storybook narrative layer: rolled single NPC vignette choice, companion field whispers,
// and personalized end-of-road storybook epilogue. Deterministic hash; zero main RNG consumption.
import {personRaceName,personJobName} from './procedural-npc.js';

function hash32(str){
 let h=2166136261;
 for(let i=0;i<str.length;i++)h=Math.imul(h^str.charCodeAt(i),16777619);
 return h>>>0||1;
}

// 1. Deterministically roll ONE contextual storybook interaction per NPC encounter
export function rolledNpcVignette(s,npc,favor){
 if(!s||!npc)return null;
 const h=hash32(`vignette:${s.seed}:${s.stop}:${s.current?.instance}:${npc.id}`);
 const pool=[];
 if(!s.current?.storyShared)pool.push({label:'聽他聊聊來歷與願望 · 5 分鐘',action:'npcStory',style:'special-command'});
 if(!s.current?.intelShared)pool.push({label:'向他打聽前方的風聲 · 5 分鐘',action:'npcIntel',style:'special-command'});
 if(!s.current?.giftedNpc)pool.push({label:'分出 1 廢料結個善緣',action:'npcGift',style:'special-command',disabled:(s.resources?.scrap||0)<1});
 if(favor&&!s.current?.favorDone)pool.push({label:favor.label,action:'npcFavor',style:'special-command'});
 if(!pool.length)return null;
 return pool[h%pool.length];
}

// 2. Companion field whisper appended to scene descriptions (zero buttons added)
const JOB_WHISPERS={
 mechanic:['這地方的鐵件還沒全爛，留神看看有沒有能補車身的料。','聽這附近的金屬回音，結構還算穩，動作快一點就行。'],
 engineer:['舊管線被人改接過了，別亂碰還在發熱的閥門。','這套結構雖然老，但比佔領軍那些活體管線順眼多了。'],
 electrician:['小心腳下的裸線，先確認斷電再伸手。','空氣裡有股臭氧味，附近八成還有殘餘電流。'],
 medic:['大家把袖口紮緊，別讓灰塵和孢子沾上傷口。','但願能在這兒翻到幾包還沒受潮的乾淨敷料。'],
 chemist:['這股氣味不太對勁，別用嘴呼吸，拿布遮一下口鼻。','地上那層殘留物帶腐蝕性，繞著乾的地方走。'],
 soldier:['掩體位置我都看過了，真有動靜就往車門後撤。','太安靜的地方反而危險，大家別離車太遠。'],
 guard:['我在外圍替你們盯著風吹草動，要搜要聊儘管放心。','門窗角度我都瞄過了，沒有埋伏的死角。'],
 hunter:['地上的痕跡是舊的，大型掠食者這兩天沒來過。','風是迎面吹來的，就算有怪物也聞不到我們的機油味。'],
 scout:['兩百公尺內沒有巡邏機的熱源，我們有一小段安全空檔。','看地上的腳印與車轍，前不久才有人在這裡停過。'],
 scavenger:['這種不起眼的角落最常藏著被人漏掉的好貨。','別光看檯面上，櫃子底下跟夾層才是寶庫。'],
 locksmith:['鎖孔沒有被暴力砸爛的痕跡，裡頭多半還有東西。','這種老式門栓我熟得很，有需要隨時叫我。'],
 hacker:['附近的監控訊號很弱，不會立刻觸發母艦定位。','終端機的指示燈居然還閃著微光，真難得。'],
 demolition:['樑柱承重還行，只要別亂動引信就不會塌下來。','這地形要是真被堵住，一發爆破就能清出路來。'],
 driver:['車頭我已經先調成隨時能衝出去的角度了。','路面還算硬實，待會發動應該不會打滑。'],
 courier:['牆角那道粉筆痕是同行留的，代表這兒能短暫歇腳。','再往東走一段就進下個地貌區了，趁現在喘口氣吧。'],
 merchant:['看這擺設，以前來往的人肯定不少，說不定能撿點便宜。','把用不上的廢鐵收收好，下個驛站都能換成救命油。'],
 diplomat:['要是裡頭有活人，讓我先開口，沒必要平白結仇。','荒路上多一個肯點頭的旅人，總比多一場死鬥划算。'],
 historian:['牆上還留著十年前的生活痕跡……真想把它記下來。','每經過一處這種舊遺址，就更明白我們為什麼非往東走不可。'],
 researcher:['這裡的侵蝕程度比想像中輕，值得多觀察兩眼。','注意那些發微光的菌斑，別讓車輪直接輾過去。'],
 performer:['呼——總算能伸個懶腰了，這段路可把骨頭都顛散啦。','別繃著臉嘛，能平安停下來的每一站都算好站！']
};

const RACE_WHISPERS={
 alien:'母艦的掃描波在這一帶很微弱，暫時不會有哨兵追來。',
 synth:'環境電磁雜訊正常，我的感測器沒有偵測到鎖定訊號。',
 uplift:'風裡沒有血腥味，也沒有爬行者的酸臭，暫時安全。',
 mycelial:'地底的菌絲很安靜，附近沒有寄生母巢在活動。',
 crystal:'地脈的頻率很平穩，沒有抽取塔那種刺耳的震動。',
 lumen:'暗處的輪廓我都替你們照清楚了，小心腳下碎鐵。'
};

export function companionWhisper(game,display){
 const s=game?.s,c=s?.current;
 if(!s||s.mode!=='event'||!c?.event||c.finalGate)return '';
 const heroId=s.protagonistId||s.party?.[0]?.id;
 const companions=(s.party||[]).filter(p=>p.id!==heroId&&p.hp>0&&!p.asleep);
 if(!companions.length)return '';
 const h=hash32(`whisper:${s.seed}:${s.stop}:${c.instance}:${c.event.id}`);
 // Trigger about 65% of stops so it feels natural and unforced
 if((h%100)>=65)return '';
 const speaker=companions[(h>>>4)%companions.length];
 const jobLines=JOB_WHISPERS[speaker.profession];
 const raceLine=RACE_WHISPERS[speaker.race];
 const line=(raceLine&&(h%3===0))?raceLine:jobLines?jobLines[(h>>>8)%jobLines.length]:'我們小心點，確認完狀況就繼續往東吧。';
 return `\n\n${display(speaker)}望了望四周，低聲說：「${line}」`;
}

// 3. Personalized Storybook Epilogue tying Prologue (past + motive) + Route + Companions together
export function storybookEpilogue(s,catalog,display,destinationName,bossName='守門者'){
 if(!s?.end)return [];
 const hero=s.party?.find(p=>p.id===s.protagonistId)||s.party?.[0];
 const heroName=hero?display(hero):'無名旅人';
 const days=Math.floor((s.minutes||480)/1440)+1;
 const visitedIdx=Math.min(9,Math.max(0,Math.floor(((s.progress||1)-1)/10)));
 const regions=(s.route?.regions||[]).slice(0,visitedIdx+1).map(r=>r.name).filter(Boolean);
 const uniqueRegions=[...new Set(regions)];
 const trailText=uniqueRegions.length>3?`${uniqueRegions[0]}、${uniqueRegions[Math.floor(uniqueRegions.length/2)]}與${uniqueRegions.at(-1)}`:uniqueRegions.join('、')||'漫長荒路';
 const aliveCompanions=(s.party||[]).filter(p=>p.id!==hero?.id&&p.hp>0);
 const fallenCompanions=(s.party||[]).filter(p=>p.id!==hero?.id&&p.hp<=0);
 const origin=hero?.origin;

 const paragraphs=[];
 // Paragraph 1: Echoing Prologue Past & Motive
 if(origin?.past&&origin?.motive){
  paragraphs.push(`出發之前，${heroName}不過是個背負著「${origin.past.title}」過往的流亡者，懷裡揣著「${origin.motive.title}」的執念發動了引擎。那時候，黑紫色的鐮刀母艦仍死死壓在西方的天幕上，一千公里外的${destinationName}聽起來就像電台雜訊裡一戳即破的幻影。`);
 }else{
  paragraphs.push(`佔領第十年的那個清晨，${heroName}把全部家當塞進後車廂，朝著傳聞中的${destinationName}踩下了油門。`);
 }

 // Paragraph 2: The Road & Stops
 paragraphs.push(`整整 ${days} 個晝夜、${s.stop||0} 次停靠，這輛滿身補丁與焊痕的座駕輾過了${trailText}的碎礫與風沙。收音機裡的求救與廣播一段段擦身而過，路旁遇見的異族旅人有人分出一口乾淨的藥與油，也有人在荒原的風裡永遠留在了後照鏡後方。`);

 // Paragraph 3: Victory or Stranded Resolution + Companions' Wishes
 if(s.end.win){
  paragraphs.push(`當橫擋在百里終點前的「${bossName}」終於轟然倒下，道路盡頭不再有琥珀掃描柱的嗡鳴，也沒有遮蔽日光的母艦陰影。清澈的溪水穿過沒被孢子污染的綠蔭，微風裡第一次只有泥土與青草的氣息——${s.end.text}`);
  if(aliveCompanions.length){
   const companionLines=aliveCompanions.map(p=>{
    const rName=personRaceName(p,catalog),jName=personJobName(p,catalog);
    const wish=p.aspirations?.raceWish||p.aspirations?.professionWish||'終於能卸下防備，好好睡上一覺。';
    return `${display(p)}（${rName}・${jName}）走下車門，望著眼前的綠地輕聲說，${wish.replace(/^到了樂園，|^我希望樂園裡|^我想在樂園/,'自己總算能')}`;
   });
   paragraphs.push(`同車抵達終點的夥伴們並肩站在晨光裡：${companionLines.join('；')}。`);
  }else{
   paragraphs.push(`${heroName}獨自推開車門，替一路上沒能走完這段路的人們，深深吸了一口自由的空氣。`);
  }
  if(fallenCompanions.length){
   paragraphs.push(`車門內側靜靜刻著${fallenCompanions.map(p=>display(p)).join('、')}的名字——他們沒能親眼看見最後的風景，卻早已成為這段旅程不可分割的一頁。`);
  }
  paragraphs.push(`這本寫在鏽鐵、汽油與星光上的向東之書，終於在${destinationName}翻到了溫暖的最後一頁。`);
 }else{
  paragraphs.push(`然而荒路從不許諾每一場出發都有歸途。在推進至第 ${s.progress}/100 里處時，${s.end.text}`);
  if(aliveCompanions.length){
   paragraphs.push(`車廂旁，${aliveCompanions.map(p=>display(p)).join('、')}沉默地收拾起剩餘的行囊。雖然車輪在此停駐，但只要還有人記得${destinationName}的方向，這段未完的故事就會由下一輛向東駛來的車繼續寫下去。`);
  }else{
   paragraphs.push(`風沙慢慢掩過冷卻的輪胎印，只把這段曾經向東奔馳過的軌跡，留給下一位經過此處的旅人。`);
  }
 }
 return paragraphs;
}
