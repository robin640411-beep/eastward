// Storybook narrative layer: third-person hero naming, first-person ("我") sardonic authorial voice,
// rolled single NPC vignette choice, companion field whispers, and personalized epilogue.
// Deterministic FNV-1a hash; zero main RNG consumption.
import {personRaceName,personJobName} from './procedural-npc.js';

function hash32(str){
 let h=2166136261;
 for(let i=0;i<str.length;i++)h=Math.imul(h^str.charCodeAt(i),16777619);
 return h>>>0||1;
}

export function heroOf(s){
 return s?.party?.find(p=>p.id===s.protagonistId)||s?.party?.[0]||null;
}

export function heroShortName(s){
 return heroOf(s)?.name||'那位旅人';
}

export function partyLabel(s){
 const hero=heroOf(s),name=hero?.name||'旅人';
 const aliveCount=(s?.party||[]).filter(p=>p.hp>0).length;
 return aliveCount>1?`${name}一行人`:name;
}

export function fillStory(text,s,display){
 if(!text)return '';
 const c=s?.current;
 const npcText=c?.npc?(display?display(c.npc):c.npc.name):'那名旅人';
 return String(text)
  .replaceAll('{npc.display_name}',npcText)
  .replaceAll('{hero}',heroShortName(s))
  .replaceAll('{party}',partyLabel(s));
}

// Prologue first-person ("我") author commentary
const AUTHOR_PAST_QUIPS=[
 (p,r,j)=>`（我是寫這本書的人。老實說，光看「${p.nickname}」這個羞恥度爆表的外號，任誰看了大概都以為${p.name}是什麼拯救世界的英雄；其實他只是個勉強活過十年的${r}${j}，連下一頓在哪都還沒著落。）`,
 (p,r,j)=>`（別問我為什麼主角偏偏是個頂著「${p.nickname}」頭銜的${r}${j}。我翻開草稿本時${p.name}就已經站在那裡了，滿身風霜，口袋比我的稿費帳戶還乾淨。）`,
 (p,r,j)=>`（寫到這裡連我自己都忍不住嘆氣：外星人統治地球整整十年，高樓塌了、秩序沒了，偏偏${p.name}這種自封「${p.nickname}」的中二靈魂卻頑強地存活了下來。）`,
 (p,r,j)=>`（身為作者，我本來想給${p.name}安排一點更體面的出場，但看看他這身${r}${j}的破爛行頭——算了，在廢土上能喘氣就已經贏過八成人口了。）`
];

const AUTHOR_MOTIVE_QUIPS=[
 (p,dest)=>`（說真的，連把這本故事書編出來的我自己，都不太確定一千公里外的「${dest}」到底有沒有乾淨自來水；但${p.name}既然鐵了心要往東開，我也只好硬著頭皮陪他寫下去了。）`,
 (p,dest)=>`（為了一個聽起來像房地產詐騙廣告的「${dest}」橫穿整片外星佔領區？換作是我早就找個地窖躺平了，偏偏${p.name}這種人就是不撞南牆不回頭。）`,
 (p,dest)=>`（我在大綱裡寫下「${dest}」這個名字的時候，其實只是隨手選了個好聽的詞。希望${p.name}千辛萬苦開到終點時，不會氣得想從書頁裡爬出來揍我。）`,
 (p,dest)=>`（外星母艦在頭頂飄了十年，地上到處是發光香菇跟搶匪，而${p.name}居然相信東邊有座歲月靜好的「${dest}」——這種盲目的樂觀連我都佩服得五體投地。）`
];

const AUTHOR_VEHICLE_QUIPS=[
 (p,v)=>`（別用那種眼神怪我小氣！在佔領區第十年能替${p.name}湊出這輛還會動的「${v.name}」，我已經把作者權限用到極限了，總不能開場就送他一艘外星母艦吧？）`,
 (p,v)=>`（看著${p.name}拍打這台「${v.name}」引擎蓋的模樣，我心裡其實挺虛的——這破銅爛鐵連冷氣都是壞的，真希望別在第三章就散架在路中間。）`,
 (p,v)=>`（沒錯，這輛「${v.name}」就是全部的家當了。我知道它看起來像剛從廢鐵壓縮機裡搶救出來的，但公路故事嘛，車太好開反而沒戲唱。）`,
 (p,v)=>`（老實交代，把這台「${v.name}」交給${p.name}的時候，我順手幫油箱多畫了幾格油。至於能不能撐過接下來的爛路，就看他自己的造化囉。）`
];

export function authorProloguePast(p,catalog){
 const rName=personRaceName(p,catalog),jName=personJobName(p,catalog);
 const h=hash32(`past:${p.id}:${p.name}:${p.nickname}`);
 return AUTHOR_PAST_QUIPS[h%AUTHOR_PAST_QUIPS.length](p,rName,jName);
}

export function authorPrologueMotive(p,destName){
 const h=hash32(`motive:${p.id}:${destName}`);
 return AUTHOR_MOTIVE_QUIPS[h%AUTHOR_MOTIVE_QUIPS.length](p,destName);
}

export function authorPrologueVehicle(p,v){
 const h=hash32(`veh:${p.id}:${v.name}`);
 return AUTHOR_VEHICLE_QUIPS[h%AUTHOR_VEHICLE_QUIPS.length](p,v);
}

// 1. Deterministically roll ONE contextual storybook interaction per NPC encounter
export function rolledNpcVignette(s,npc,favor){
 if(!s||!npc)return null;
 const h=hash32(`vignette:${s.seed}:${s.stop}:${s.current?.instance}:${npc.id}`);
 const pool=[];
 if(!s.current?.storyShared)pool.push({label:'聽對方聊聊來歷與願望 · 5 分鐘',action:'npcStory',style:'special-command'});
 if(!s.current?.intelShared)pool.push({label:'打聽前方公路的風聲 · 5 分鐘',action:'npcIntel',style:'special-command'});
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
 soldier:['掩體位置我都看過了，真有動靜就往車門後撤。','太安靜的地方反而危險，別離車太遠。'],
 guard:['我在外圍盯著風吹草動，要搜要聊儘管放心。','門窗角度我都瞄過了，沒有埋伏的死角。'],
 hunter:['地上的痕跡是舊的，大型掠食者這兩天沒來過。','風是迎面吹來的，就算有怪物也聞不到車子的機油味。'],
 scout:['兩百公尺內沒有巡邏機的熱源，有一小段安全空檔。','看地上的腳印與車轍，前不久才有人在這裡停過。'],
 scavenger:['這種不起眼的角落最常藏著被人漏掉的好貨。','別光看檯面上，櫃子底下跟夾層才是寶庫。'],
 locksmith:['鎖孔沒有被暴力砸爛的痕跡，裡頭多半還有東西。','這種老式門栓我熟得很，有需要隨時叫我。'],
 hacker:['附近的監控訊號很弱，不會立刻觸發母艦定位。','終端機的指示燈居然還閃著微光，真難得。'],
 demolition:['樑柱承重還行，只要別亂動引信就不會塌下來。','這地形要是真被堵住，一發爆破就能清出路來。'],
 driver:['車頭已經先調成隨時能衝出去的角度了。','路面還算硬實，待會發動應該不會打滑。'],
 courier:['牆角那道粉筆痕是同行留的，代表這兒能短暫歇腳。','再往東走一段就進下個地貌區了，趁現在喘口氣吧。'],
 merchant:['看這擺設，以前來往的人肯定不少，說不定能撿點便宜。','把用不上的廢鐵收收好，下個驛站都能換成救命油。'],
 diplomat:['要是裡頭有活人，讓我先開口，沒必要平白結仇。','荒路上多一個肯點頭的旅人，總比多一場死鬥划算。'],
 historian:['牆上還留著十年前的生活痕跡……真想把它記下來。','每經過一處這種舊遺址，就更明白為什麼非往東走不可。'],
 researcher:['這裡的侵蝕程度比想像中輕，值得多觀察兩眼。','注意那些發微光的菌斑，別讓車輪直接輾過去。'],
 performer:['呼——總算能伸個懶腰了，這段路可把骨頭都顛散啦。','別繃著臉嘛，能平安停下來的每一站都算好站！']
};

const RACE_WHISPERS={
 alien:'母艦的掃描波在這一帶很微弱，暫時不會有哨兵追來。',
 synth:'環境電磁雜訊正常，我的感測器沒有偵測到鎖定訊號。',
 uplift:'風裡沒有血腥味，也沒有爬行者的酸臭，暫時安全。',
 mycelial:'地底的菌絲很安靜，附近沒有寄生母巢在活動。',
 crystal:'地脈的頻率很平穩，沒有抽取塔那種刺耳的震動。',
 lumen:'暗處的輪廓我都照清楚了，小心腳下碎鐵。'
};

export function companionWhisper(game,display){
 const s=game?.s,c=s?.current;
 if(!s||s.mode!=='event'||!c?.event||c.finalGate)return '';
 const heroId=s.protagonistId||s.party?.[0]?.id;
 const companions=(s.party||[]).filter(p=>p.id!==heroId&&p.hp>0&&!p.asleep);
 if(!companions.length)return '';
 const h=hash32(`whisper:${s.seed}:${s.stop}:${c.instance}:${c.event.id}`);
 if((h%100)>=65)return '';
 const speaker=companions[(h>>>4)%companions.length];
 const jobLines=JOB_WHISPERS[speaker.profession];
 const raceLine=RACE_WHISPERS[speaker.race];
 const line=(raceLine&&(h%3===0))?raceLine:jobLines?jobLines[(h>>>8)%jobLines.length]:'大家小心點，確認完狀況就繼續往東吧。';
 return `\n\n${display(speaker)}望了望四周，低聲說：「${line}」`;
}

// 3. First-person ("我") sardonic & self-deprecating Author commentary on events, NPCs & setting
const AUTHOR_EMPTY_ASIDES=[
 hero=>`（空的，連根生鏽鐵釘都沒剩。別怪身為作者的我太摳門，外星人都統治十年了，要是每間廢棄房間都塞滿全新補給，我自己寫起來都會心虛。）`,
 hero=>`（看著${hero}一臉不死心地翻找灰塵的背影，我差點動了惻隱之心想偷塞一罐藥進去——但想了想，還是讓廢墟保持它應有的貧窮吧。）`,
 hero=>`（我知道這一段看起來很像我在騙字數，但前幾批逃難的人手腳實在太俐落了，只留給${hero}一屋子極具文學氣息的空氣。）`,
 hero=>`（什麼也沒有。頂著華麗外號的主角千里迢迢停下車，結果只參觀了一間十年前的空房間——這就是我最愛寫的寫實派公路文學。）`
];

const AUTHOR_NPC_ASIDES=[
 (hero,npc)=>`（老實招認，這位${npc}是我剛才隨手抓幾個廢土詞彙湊出來的路人，結果行頭跟氣場看起來居然比主角${hero}還像見過大場面的人。）`,
 (hero,npc)=>`（外星母艦還在頭頂飄，${npc}卻能淡定地在荒郊野外討生活。有時候連我都懷疑，這本書裡最不適應末日的人其實是${hero}。）`,
 (hero,npc)=>`（看看${npc}那身充滿故事感的打扮，再看看灰頭土臉下車的${hero}——要不是封面已經寫好主角是誰了，我還真想臨時換人寫。）`,
 (hero,npc)=>`（別問我為什麼荒無人煙的公路旁總能剛好遇見${npc}這種怪人；要是整本書只有${hero}一個人對著方向盤發呆，讀者早就睡著了。）`,
 (hero,npc)=>`（我給${npc}設定的身世其實比表面上複雜得多，不過看${hero}那副只想著汽油跟廢料的世俗眼神，大概也沒空深究人家的內心戲。）`
];

const AUTHOR_SHOP_ASIDES=[
 hero=>`（末日第十年居然還有人堅持擺攤收廢鐵換物資。別深究他的批發貨源是哪來的，問就是我怕${hero}半路餓死特別開的作者後門。）`,
 hero=>`（在沒有消保官的佔領區買東西，沒被當場拔槍洗劫就已經算是五星級好評店家了，希望${hero}掏廢料時懂得感恩。）`,
 hero=>`（我一直覺得廢土商人比外星高等文明還可怕——母艦好歹只會轟炸，商人卻連${hero}褲袋裡最後一塊爛鐵片都能精準榨乾。）`
];

const AUTHOR_HAZARD_ASIDES=[
 hero=>`（我發誓這段爛路絕對不是我故意整${hero}的……好吧，其實有一半是。畢竟一路順風開到終點的故事書，通常賣不出半本。）`,
 hero=>`（所謂跨星系的高等外星統治者，接管地球十年居然連條國道的坑洞跟落石都不修——看來宇宙級官僚主義跟地球上也沒什麼兩樣。）`,
 hero=>`（看著${hero}對著前方路況嘆氣的模樣，我手邊的咖啡都喝得特別香。加油啊大冒險家，離東邊也不過還剩幾百個這種鬼地方而已。）`,
 hero=>`（老舊座駕配破爛公路，簡直是災難文學的絕配。我已經在草稿紙旁邊畫好修車廠的伏筆了，前提是${hero}得先活著撐過去。）`
];

const AUTHOR_COMBAT_ASIDES=[
 hero=>`（大老遠蹲在荒郊廢墟裡埋伏過路破車，搶贏了也不過分到兩塊生鏽鐵片——說真的，這幫傢伙的時薪大概比我寫這本書的稿費還慘。）`,
 hero=>`（堂堂星際帝國引以為傲的改造生物與巡邏兵，解決問題的方式居然還是撲上來物理互毆；寫到這裡連我都替外星人的科技樹感到臉紅。）`,
 hero=>`（氣氛突然熱血了起來！雖然按照我對${hero}的了解，這場架打起來多半沒什麼英雄史詩感，比較像菜市場搶特價品。）`
];

const AUTHOR_LOOT_ASIDES=[
 hero=>`（十年前沒人拿走的物資居然還沒爛掉——請各位暫時把保存期限這種掃興的科學常識丟進垃圾桶，當作是我偷偷塞給${hero}的慰問品吧。）`,
 hero=>`（看著堂堂主角蹲在角落翻箱倒櫃撿破爛時露出的欣慰表情，我深刻體會到什麼叫做「末日讓人學會知足」。）`,
 hero=>`（每次寫到路邊白撿物資的橋段我都很掙扎，既怕寵壞${hero}，又怕不塞點油跟藥，這本書下一頁就得提前寫訃聞。）`
];

const AUTHOR_HISTORY_ASIDES=[
 hero=>`（我花了不少心思把舊時代的碎片塞進這些角落裡，希望${hero}翻看的時候能稍微醞釀一點感傷，別滿腦子只計算這疊紙能不能拿去燒水。）`,
 hero=>`（十年前的人類總以為外星人降臨時會像電影一樣壯烈，結果留下的紀錄全是停水、塞車跟沒寄出去的信——連我寫著都覺得既荒謬又真實。）`
];

export function authorAside(game,display){
 const s=game?.s,c=s?.current,e=c?.event;
 if(!s||s.mode!=='event'||!e||c.finalGate)return '';
 const h=hash32(`author:${s.seed}:${s.stop}:${c.instance}:${e.id}`);
 // Trigger ~78% of stops so the author's voice is a signature presence without feeling mechanical
 if((h%100)>=78)return '';
 const hero=heroShortName(s);
 const cat=e.category||'';
 let line='';
 if(cat==='empty'){
  line=AUTHOR_EMPTY_ASIDES[(h>>>4)%AUTHOR_EMPTY_ASIDES.length](hero);
 }else if(c.npc){
  const npcName=display?display(c.npc):c.npc.name;
  const isShop=e.options?.some(o=>o.effects?.some(f=>f.op==='open_service'||f.service));
  line=isShop&&(h%2===0)
   ?AUTHOR_SHOP_ASIDES[(h>>>5)%AUTHOR_SHOP_ASIDES.length](hero)
   :AUTHOR_NPC_ASIDES[(h>>>5)%AUTHOR_NPC_ASIDES.length](hero,npcName);
 }else if(e.options?.some(o=>o.effects?.some(f=>f.op==='combat'))){
  line=AUTHOR_COMBAT_ASIDES[(h>>>4)%AUTHOR_COMBAT_ASIDES.length](hero);
 }else if(e.options?.some(o=>o.effects?.some(f=>f.op==='reveal_history'))){
  line=AUTHOR_HISTORY_ASIDES[(h>>>4)%AUTHOR_HISTORY_ASIDES.length](hero);
 }else if(e.polarity==='bad'||['damage','electric','pollution','alarm','explosive','clear','wade','crawl','dark'].includes(cat)){
  line=AUTHOR_HAZARD_ASIDES[(h>>>4)%AUTHOR_HAZARD_ASIDES.length](hero);
 }else{
  line=AUTHOR_LOOT_ASIDES[(h>>>4)%AUTHOR_LOOT_ASIDES.length](hero);
 }
 return `\n\n${line}`;
}

// 4. Personalized Storybook Epilogue in third-person + first-person ("我") authorial closing
export function storybookEpilogue(s,catalog,display,destinationName,bossName='守門者'){
 if(!s?.end)return [];
 const hero=heroOf(s);
 const heroName=hero?display(hero):'無名旅人';
 const shortName=hero?.name||'那位旅人';
 const days=Math.floor((s.minutes||480)/1440)+1;
 const visitedIdx=Math.min(9,Math.max(0,Math.floor(((s.progress||1)-1)/10)));
 const regions=(s.route?.regions||[]).slice(0,visitedIdx+1).map(r=>r.name).filter(Boolean);
 const uniqueRegions=[...new Set(regions)];
 const trailText=uniqueRegions.length>3?`${uniqueRegions[0]}、${uniqueRegions[Math.floor(uniqueRegions.length/2)]}與${uniqueRegions.at(-1)}`:uniqueRegions.join('、')||'漫長荒路';
 const aliveCompanions=(s.party||[]).filter(p=>p.id!==hero?.id&&p.hp>0);
 const fallenCompanions=(s.party||[]).filter(p=>p.id!==hero?.id&&p.hp<=0);
 const origin=hero?.origin;

 const paragraphs=[];
 // Paragraph 1: Fairy-tale echo + Prologue Past & Motive in 3rd person
 if(origin?.past&&origin?.motive){
  paragraphs.push(`很久很久以後，人們偶爾還會提起${heroName}的故事。出發之前，${shortName}不過是個背負著「${origin.past.title}」過往的倒楣鬼，懷裡揣著「${origin.motive.title}」的固執念頭就敢踩下油門。老實說，我在第一章寫下這個開場的時候，壓根沒賭他真能開出多遠。`);
 }else{
  paragraphs.push(`佔領第十年的那個清晨，${heroName}把少得可憐的家當塞進後車廂，朝著傳聞中的${destinationName}發動了引擎——而我則提著筆，半信半疑地跟在車屁股後頭記下了這一路的荒唐事。`);
 }

 // Paragraph 2: The Road & Stops
 paragraphs.push(`整整 ${days} 個晝夜、${s.stop||0} 次停靠，這輛被我塞了無數爛路與壞天氣考驗的破車，硬是顛簸著輾過了${trailText}的風沙。收音機裡那些沒人想買的末日廣告還在荒原上空瞎轉，沿途撞見的怪人有的分出一口藥與油，有的則成了後照鏡裡逐漸縮小的剪影。`);

 // Paragraph 3+: Victory or Stranded Resolution + Companions' Wishes + Author Sign-off
 if(s.end.win){
  paragraphs.push(`當橫擋在百里終點前的「${bossName}」終於在硝煙裡轟然倒下，道路盡頭第一次聽不見琥珀掃描柱的嗡鳴，也沒有母艦遮住太陽。清澈溪水穿過沒長半朵毒香菇的草坡——${fillStory(s.end.text,s,display)}`);
  if(aliveCompanions.length){
   const companionLines=aliveCompanions.map(p=>{
    const rName=personRaceName(p,catalog),jName=personJobName(p,catalog);
    const wish=p.aspirations?.raceWish||p.aspirations?.professionWish||'終於能卸下防備，好好睡上一覺。';
    return `${display(p)}（${rName}・${jName}）推開車門望著綠地，輕聲說${wish.replace(/^到了樂園，|^我希望樂園裡|^我想在樂園/,'自己總算能')}`;
   });
   paragraphs.push(`同車撐到最後一頁的夥伴們並肩站在晨光裡：${companionLines.join('；')}。`);
  }else{
   paragraphs.push(`${shortName}獨自推開車門，替一路上沒能走完這段路的人們，結結實實地吸了一大口不用戴濾毒面罩的空氣。`);
  }
  if(fallenCompanions.length){
   paragraphs.push(`車門內側靜靜刻著${fallenCompanions.map(p=>display(p)).join('、')}的名字——身為作者，我很抱歉沒能讓他們全員下車，但他們確實陪${shortName}走過了最黑的幾段夜路。`);
  }
  paragraphs.push(`至於我？既然${shortName}真的把車開進了${destinationName}，害我準備好的悲劇結尾全都派不上用場，我也只好心甘情願地闔上稿紙，替這本破爛公路故事書畫下句點。`);
 }else{
  paragraphs.push(`然而就像我一開始警告過的那樣，荒路從不保證每次出發都有體面的收尾。在推進至第 ${s.progress}/100 里處時，${fillStory(s.end.text,s,display)}`);
  if(aliveCompanions.length){
   paragraphs.push(`車廂旁，${aliveCompanions.map(p=>display(p)).join('、')}沉默地收拾起所剩無幾的行囊。雖然${shortName}的車輪停在了這裡，但只要東邊的電台還在胡說八道，總會有下一個傻瓜撿起車鑰匙繼續往下開。`);
  }else{
   paragraphs.push(`風沙慢慢蓋過冷卻的輪胎印。我嘆了口氣，把${shortName}沒走完的這一頁輕輕折起——別灰心，等我削好鉛筆，下一本故事書隨時都能重新發車。`);
  }
 }
 return paragraphs;
}
