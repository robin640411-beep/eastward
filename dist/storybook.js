// Storybook narrative layer: third-person hero naming, ubiquitous dice-rolled first-person ("我")
// sardonic authorial commentary (stops, combat, knockouts, player death, endings),
// rolled single NPC vignette choice, companion field whispers, and personalized epilogue.
// Uses dedicated FNV-1a / author dice rolls so gameplay seed RNG is never perturbed.
import {personRaceName,personJobName} from './procedural-npc.js';

function hash32(str){
 let h=2166136261;
 for(let i=0;i<str.length;i++)h=Math.imul(h^str.charCodeAt(i),16777619);
 return h>>>0||1;
}

// Dedicated D100 roll (1..100) for deciding whether and what the Author chimes in with.
export function authorD100(s,tag){
 const h=hash32(`author-d100:${s?.seed||1}:${s?.stop||0}:${s?.progress||1}:${s?.minutes||0}:${tag}`);
 return (h%100)+1;
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
 if((h%100)>=60)return '';
 const speaker=companions[(h>>>4)%companions.length];
 const jobLines=JOB_WHISPERS[speaker.profession];
 const raceLine=RACE_WHISPERS[speaker.race];
 const line=(raceLine&&(h%3===0))?raceLine:jobLines?jobLines[(h>>>8)%jobLines.length]:'大家小心點，確認完狀況就繼續往東吧。';
 return `\n\n${display(speaker)}望了望四周，低聲說：「${line}」`;
}

// 3. Rolled Author Commentary on Stops (not every time: 52% roll!)
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
 const roll=authorD100(s,`stop:${c.instance}:${e.id}`);
 // Rolled ~52% chance so author commentary feels lively and unpredictable, not guaranteed every time
 if(roll>52)return '';
 const h=hash32(`aside-pick:${s.seed}:${s.stop}:${c.instance}:${e.id}`);
 const hero=heroShortName(s);
 const cat=e.category||'';
 let line='';
 if(cat==='empty'){
  line=AUTHOR_EMPTY_ASIDES[h%AUTHOR_EMPTY_ASIDES.length](hero);
 }else if(c.npc){
  const npcName=display?display(c.npc):c.npc.name;
  const isShop=e.options?.some(o=>o.effects?.some(f=>f.op==='open_service'||f.service));
  line=isShop&&(h%2===0)
   ?AUTHOR_SHOP_ASIDES[(h>>>4)%AUTHOR_SHOP_ASIDES.length](hero)
   :AUTHOR_NPC_ASIDES[(h>>>4)%AUTHOR_NPC_ASIDES.length](hero,npcName);
 }else if(e.options?.some(o=>o.effects?.some(f=>f.op==='combat'))){
  line=AUTHOR_COMBAT_ASIDES[h%AUTHOR_COMBAT_ASIDES.length](hero);
 }else if(e.options?.some(o=>o.effects?.some(f=>f.op==='reveal_history'))){
  line=AUTHOR_HISTORY_ASIDES[h%AUTHOR_HISTORY_ASIDES.length](hero);
 }else if(e.polarity==='bad'||['damage','electric','pollution','alarm','explosive','clear','wade','crawl','dark'].includes(cat)){
  line=AUTHOR_HAZARD_ASIDES[h%AUTHOR_HAZARD_ASIDES.length](hero);
 }else{
  line=AUTHOR_LOOT_ASIDES[h%AUTHOR_LOOT_ASIDES.length](hero);
 }
 return `\n\n${line}`;
}

// 4. Rolled Combat & Death Author Snark (戰鬥中、倒下、全滅死亡皆可擲骰觸發吐槽)
const BATTLE_START_QUIPS=[
 (hero,foe)=>`（一言不合就開打！老實說我很不想寫動作戲，分鏡很累人的，偏偏${foe}跟${hero}看起來誰也不打算講道理。）`,
 (hero,foe)=>`（看著${foe}氣勢洶洶衝上來的樣子，我默默翻了一下${hero}目前的裝備欄……嗯，祝他好運。）`,
 (hero)=>`（戰鬥開始了！雖然這本書主打公路旅行，但偶爾讓${hero}活動一下筋骨，免得大家以為他只會坐著踩油門。）`,
 (hero,foe)=>`（在荒郊野外跟${foe}大打出手，贏了沒獎盃、輸了變路邊野狗的宵夜——末日的社交禮儀就是這麼樸實無華。）`
];

const BOSS_START_QUIPS=[
 (hero,boss)=>`（喔豁，終於撞上守門大頭目「${boss}」了！老實交代，我當初設計它血條的時候手滑多填了好幾格，希望${hero}別恨我。）`,
 (hero,boss)=>`（百里路的最後一關就是「${boss}」。我把整本書最貴的特效預算都砸在這傢伙身上了，${hero}你可千萬別一回合就躺平啊！）`
];

const BATTLE_ROUND_MISS_QUIPS=[
 hero=>`（剛才那一下揮得虎虎生風，結果連根毛都沒擦到——我都開始懷疑是不是我忘了給${hero}畫視力表了。）`,
 ()=>`（打歪得這麼離譜，連旁邊觀戰的我都尷尬得想把這一行塗掉重寫。）`,
 ()=>`（空氣受到了高達一百點的致命傷害！可惜對面的敵人毫髮無傷。）`
];

const BATTLE_ROUND_ENEMY_PSI_QUIPS=[
 hero=>`（連對面的敵人都會放超能力了！反觀${hero}剛才被轟得一臉茫然的樣子，場面真是令人鼻酸。）`,
 ()=>`（沒錯，是我允許敵人也用超能力的——總不能全地球只有主角車隊會發光吧？講點基本公平好嗎！）`,
 ()=>`（剛才那道超能力特效閃得我眼睛都花了，看來這年頭在廢土混，沒點精神力還真不好意思出門攔路。）`
];

const BATTLE_ROUND_LOWHP_QUIPS=[
 hero=>`（血條都快見底了還在那裡硬撐！我好心提醒一句，背包裡的藥品留到全滅也是不會生利息的，${hero}！）`,
 ()=>`（看著隊伍搖搖欲墜的生命值，我連訃聞草稿都已經在旁邊偷偷擬好兩行了。）`
];

const BATTLE_ROUND_GENERAL_QUIPS=[
 hero=>`（雖然我很努力想把這回合寫成熱血沸騰的生死決鬥，但${hero}左閃右躲的姿勢看起來實在太像在躲蜜蜂了。）`,
 ()=>`（你一拳我一腳，毫無武術指導可言的泥巴仗正在激烈上演中。）`,
 ()=>`（打到現在雙方都還沒分出勝負，連我手裡的爆米花都快吃完了。）`,
 ()=>`（這場架要是放在舊時代動作片裡早就被剪掉了，偏偏在我的書裡每一滴血都算數。）`
];

const BATTLE_WIN_QUIPS=[
 hero=>`（剛打贏就立刻蹲下來熟練地搜刮破銅爛鐵，${hero}這種勤儉持家的拾荒精神真是令我這個作者熱淚盈眶。）`,
 ()=>`（總算打完了！我差點以為這場鬧劇要拖到天亮，趕緊把廢料收一收繼續上路吧。）`,
 hero=>`（看著${hero}喘著粗氣站在勝利現場的模樣——雖然狼狽了點，但好歹沒讓我提前完結這本書。）`
];

const BATTLE_ESCAPE_QUIPS=[
 hero=>`（三十六計走為上策！看著${hero}溜得比兔子還快的背影，身為作者我給予高度肯定：畢竟死要面子的人通常活不過三章。）`,
 ()=>`（戰術性撤退！翻譯成白話文就是打不過落跑了，但別在意，活著才有資格翻下一頁。）`
];

const ALLY_DOWN_QUIPS=[
 name=>`（啪嘰一聲，${name}就這麼華麗地躺平了！頂著那麼響亮的稱號，結果倒在路邊的姿勢跟曬乾的鹹魚沒兩樣。）`,
 name=>`（${name}倒下了！別用那種眼神看我，敵人又不是我親手操縱去扁他的……好吧，數值確實是我填的。）`,
 name=>`（看著${name}不省人事地趴在地上，我只能安慰自己：至少接下來幾回合少寫一個人的動作戲。）`
];

const WIPE_QUIPS=[
 hero=>`（全滅！連半個活著幫我踩油門翻到下一頁的人都沒剩下！早知道${hero}這麼不耐揍，我第一章就該改寫《廢土仙人掌養殖手冊》的。）`,
 hero=>`（看著${hero}直挺挺躺在荒路中央數星星的模樣，我花了三頁鋪陳的感人背景故事瞬間變成了冷笑話。）`,
 hero=>`（就這樣團滅了？我的大綱才寫到一半耶！${hero}你這種隨便死在半路的敬業態度，會害我很難跟讀者交代的！）`
];

export function rollBattleAuthorQuip(s,kind,ctx={}){
 if(!s)return '';
 const b=s.battle;
 const tag=`battle:${kind}:${s.stop}:${b?.round||0}:${s.logs?.length||0}:${ctx.who||''}`;
 const roll=authorD100(s,tag);
 const hero=heroShortName(s);
 const h=hash32(`bpick:${s.seed}:${tag}`);
 if(kind==='start'){
  const isBoss=!!b?.finalBoss;
  if(roll>(isBoss?75:38))return '';
  const foe=b?.enemies?.[0]?.name||'敵人';
  return isBoss?BOSS_START_QUIPS[h%BOSS_START_QUIPS.length](hero,foe):BATTLE_START_QUIPS[h%BATTLE_START_QUIPS.length](hero,foe);
 }
 if(kind==='round'){
  if(roll>35)return '';
  if(ctx.enemyPsi)return BATTLE_ROUND_ENEMY_PSI_QUIPS[h%BATTLE_ROUND_ENEMY_PSI_QUIPS.length](hero);
  if(ctx.missed)return BATTLE_ROUND_MISS_QUIPS[h%BATTLE_ROUND_MISS_QUIPS.length](hero);
  if(ctx.lowHp)return BATTLE_ROUND_LOWHP_QUIPS[h%BATTLE_ROUND_LOWHP_QUIPS.length](hero);
  return BATTLE_ROUND_GENERAL_QUIPS[h%BATTLE_ROUND_GENERAL_QUIPS.length](hero);
 }
 if(kind==='win'){
  if(roll>38)return '';
  return BATTLE_WIN_QUIPS[h%BATTLE_WIN_QUIPS.length](hero);
 }
 if(kind==='escape'){
  if(roll>48)return '';
  return BATTLE_ESCAPE_QUIPS[h%BATTLE_ESCAPE_QUIPS.length](hero);
 }
 if(kind==='down'){
  if(roll>72)return '';
  return ALLY_DOWN_QUIPS[h%ALLY_DOWN_QUIPS.length](ctx.who||hero);
 }
 if(kind==='wipe'){
  if(roll>85)return '';
  return WIPE_QUIPS[h%WIPE_QUIPS.length](hero);
 }
 return '';
}

// 5. Personalized Storybook Epilogue in third-person + rolled Author commentary (including player death!)
export function storybookEpilogue(s,catalog,display,destinationName,bossName='守門者'){
 if(!s?.end)return [];
 const hero=heroOf(s);
 const heroName=hero?display(hero):'無名旅人';
 const shortName=hero?.name||'那位旅人';
 const heroDead=!hero||hero.hp<=0;
 const anyAlive=(s.party||[]).some(p=>p.hp>0);
 const allDead=!anyAlive;
 const days=Math.floor((s.minutes||480)/1440)+1;
 const visitedIdx=Math.min(9,Math.max(0,Math.floor(((s.progress||1)-1)/10)));
 const regions=(s.route?.regions||[]).slice(0,visitedIdx+1).map(r=>r.name).filter(Boolean);
 const uniqueRegions=[...new Set(regions)];
 const trailText=uniqueRegions.length>3?`${uniqueRegions[0]}、${uniqueRegions[Math.floor(uniqueRegions.length/2)]}與${uniqueRegions.at(-1)}`:uniqueRegions.join('、')||'漫長荒路';
 const aliveCompanions=(s.party||[]).filter(p=>p.id!==hero?.id&&p.hp>0);
 const fallenCompanions=(s.party||[]).filter(p=>p.id!==hero?.id&&p.hp<=0);
 const origin=hero?.origin;
 const endRoll=authorD100(s,'epilogue-snark');

 const paragraphs=[];
 // Paragraph 1: Fairy-tale echo + Prologue Past & Motive in 3rd person
 if(origin?.past&&origin?.motive){
  paragraphs.push(`很久很久以後，偶爾還有人翻開${heroName}這段荒唐的紀錄。出發之前，${shortName}不過是個背負著「${origin.past.title}」過往的倒楣鬼，懷裡揣著「${origin.motive.title}」的執念就敢發動引擎。`);
 }else{
  paragraphs.push(`佔領第十年的那個清晨，${heroName}把少得可憐的家當塞進後車廂，朝著傳聞中的${destinationName}踩下了油門。`);
 }

 // Paragraph 2: The Road & Stops
 paragraphs.push(`整整 ${days} 個晝夜、${s.stop||0} 次停靠，這輛滿身焊痕的破車顛簸著輾過了${trailText}的風沙，伴隨著收音機裡那些沒人想買的末日商業廣告一路向東。`);

 // Paragraph 3+: Victory, Total Party Wipe (Death), or Stranded Ending + Rolled Author Snark
 if(s.end.win){
  paragraphs.push(`當橫擋在百里終點前的「${bossName}」終於轟然倒下，道路盡頭第一次沒有琥珀掃描柱的嗡鳴，也沒有母艦遮住日光——${fillStory(s.end.text,s,display)}`);
  if(heroDead&&aliveCompanions.length){
   paragraphs.push(`（身為作者我實在忍不住吐槽：這本書原本的主角${shortName}居然在半路就先領便當躺平了，最後硬是靠同車夥伴把車開進終點——我寫故事這麼多年，還沒見過這麼愛偷懶的主角！）`);
  }
  if(aliveCompanions.length){
   const companionLines=aliveCompanions.map(p=>{
    const rName=personRaceName(p,catalog),jName=personJobName(p,catalog);
    const wish=p.aspirations?.raceWish||p.aspirations?.professionWish||'終於能卸下防備，好好睡上一覺。';
    return `${display(p)}（${rName}・${jName}）推開車門望著綠地，輕聲說${wish.replace(/^到了樂園，|^我希望樂園裡|^我想在樂園/,'自己總算能')}`;
   });
   paragraphs.push(`同車撐到最後一頁的夥伴們並肩站在晨光裡：${companionLines.join('；')}。`);
  }else if(!heroDead){
   paragraphs.push(`${shortName}獨自推開車門，替一路上沒能走完這段路的人們，結結實實地吸了一大口不用戴濾毒面罩的空氣。`);
  }
  if(fallenCompanions.length){
   paragraphs.push(`車門內側靜靜刻著${fallenCompanions.map(p=>display(p)).join('、')}的名字——他們沒能親眼看見最後的風景，卻陪這輛車走過了最黑的夜路。`);
  }
  if(endRoll<=70){
   paragraphs.push(`（至於我這個寫書的人？既然車真的開進了${destinationName}，害我事先擬好的三套淒涼悲劇結尾全成了廢紙，我也只好心甘情願地闔上稿本，承認這群傻瓜確實創造了一點小小的奇蹟。）`);
  }else{
   paragraphs.push(`這本寫在鏽鐵、汽油與星光上的向東之書，終於在${destinationName}翻到了最後一頁。`);
  }
 }else if(allDead){
  paragraphs.push(`然而在第 ${s.progress}/100 里的荒路上，${fillStory(s.end.text,s,display)}`);
  if(endRoll<=80){
   const h=hash32(`wipe-epilogue:${s.seed}:${s.progress}:${s.stop}`);
   const deathSnarks=[
    `（沒錯，全軍覆沒，死得透透的。我當初好不容易幫${shortName}編了那麼帥的外號跟身世，結果連${destinationName}的大門長什麼樣都沒摸到就全躺平了——這本書的頁數薄得連拿去墊桌腳都嫌矮！）`,
    `（身為作者，看著${shortName}一行人整整齊齊倒在路邊餵食腐獸，我的心情十分複雜：一方面替他們難過三秒鐘，另一方面又覺得終於不用再幫這台破車算油耗了。）`,
    `（這就是不把血條當回事的下場！${shortName}用生命向各位證明了：在末日公路上，光靠一腔熱血是擋不住子彈跟超能力的。等我喝口水削好鉛筆，下一本再換個命硬一點的倒楣鬼上路吧。）`
   ];
   paragraphs.push(deathSnarks[h%deathSnarks.length]);
  }else{
   paragraphs.push(`風沙慢慢蓋過冷卻的車輪印，只留下一本還沒寫完就被迫闔上的公路故事書。`);
  }
 }else{
  paragraphs.push(`然而荒路從不保證每次出發都有體面的收尾。在推進至第 ${s.progress}/100 里處時，${fillStory(s.end.text,s,display)}`);
  if(heroDead&&aliveCompanions.length){
   paragraphs.push(`（更尷尬的是，連主角${shortName}都在半路先一步躺進土裡了，只剩${aliveCompanions.map(p=>display(p)).join('、')}站在拋錨的破車旁面面相覷。）`);
  }else if(aliveCompanions.length){
   paragraphs.push(`車廂旁，${aliveCompanions.map(p=>display(p)).join('、')}沉默地收拾起剩餘的行囊，準備在沒有車的日子裡另謀生路。`);
  }
  if(endRoll<=70){
   paragraphs.push(`（沒死成，但也沒開到終點——老實說這種因為沒油或破車罷工而半途散夥的結局，比壯烈犧牲還要讓我這個作者沒面子。算了，留得青山在，下一本故事書再重新發車吧。）`);
  }else{
   paragraphs.push(`只要東邊的電台還在胡說八道，總有一天會有下一輛車順著這道輪胎印繼續往東開去。`);
  }
 }
 return paragraphs;
}
