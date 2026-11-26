// Radio event forecasts, wildly exaggerated gear/consumable infomercials,
// and terribly unfunny companion cold jokes & alien puns.

function pickHash(arr,seed,salt=0){
 let h=2166136261;
 for(const ch of `${seed}:${salt}`)h=Math.imul(h^ch.charCodeAt(0),16777619);
 return arr[(h>>>0)%arr.length];
}

const FORECASTS_BY_D12={
 1:[
  '東行路況快報：前方幾十公里還有亮著燈的補給據點在營業，油箱快見底的車主可以準備靠邊討價還價了。',
  '廢土商會廣播：前頭路段的加油站或雜貨鋪今天有開門，帶點廢料過去說不定能換到好貨！'
 ],
 2:[
  '公路互助網提醒：前方路段有不少獨行旅人與營火出沒，想找人搭話、換物資或招同伴的駕駛請放慢車速。',
  '夜間頻段回報：前面路肩有人在招手搭便車，至於對方是好人還是麻煩精，就看各位的眼光了。'
 ],
 3:[
  '拾荒者秘密頻道：前方廢墟和廢棄倉庫看起來還沒被搬空，想碰運氣翻裝備或零件的可以下去摸兩把。',
  '公路電台情報：剛才經過的貨車說前面有幾處塌了一半的舊建築和貨櫃殘骸，裡面八成還留著戰前物資。'
 ],
 4:[
  '緊急治安插播！前方路段剛接獲飛車黨與攔路劫匪活動通報，請各位駕駛把武器上膛、油門踩緊！',
  '公路警報：前面幾公里疑似有私設路障與伏擊圈，不想交過路費的車主最好先做好硬仗準備！'
 ],
 5:[
  '異星威脅預警！雷達偵測到前方有外星偵察機或高危變異生物活動，建議備妥抗機械武器與急救藥品。',
  '民防緊急頻道：前方空域出現異常脈衝訊號，外星先遣隊或菌絲巢穴可能就在下個彎道後頭！'
 ],
 6:[
  '末日氣象台警報：前方氣壓急劇驟降，酸雨、沙塵暴或乾雷隨時可能砸下來，請檢查雨刷與車頂狀況！',
  '天氣速報：地平線那頭雲層顏色不對勁，開過去八成會撞上極端異常天候，能躲就躲！'
 ],
 7:[
  '路政殘部廣播：前方路面狀況極差，可能有斷橋、塌方或翻覆巨車堵路，請預留繞道汽油與補胎廢料！',
  '老司機互通訊息：前面那段柏油路爛得像月球表面，輪胎跟避震器快撐不住的記得先心理準備。'
 ],
 8:[
  '歷史保存電台：前方路段仍留著十年前外星降臨時的舊報攤或遺跡，對舊世界真相有興趣的旅人別錯過。',
  '文化殘響頻道：據說前面路邊還立著戰前的紀念牆與檔案殘骸，停下來翻翻或許能拼出更多線索。'
 ],
 9:[
  '靈異與異常現象播報：前方路段指南針會亂轉、收音機也會自己唱歌，感官敏銳的駕駛請穩住心神！',
  '神秘頻段雜訊：……滋滋……前面出現不明能量共鳴與海市蜃樓，別相信你眼睛看到的第一個東西……'
 ],
 10:[
  '公路良心熱線：前方似乎有人受困或正在發生爭執，至於要伸出援手積功德還是趁火打劫，全看各位良心。',
  '互助頻段消息：前面路段傳來斷續的求救訊號，做好事能贏得名聲，但末日裡善意總是要付點代價。'
 ],
 11:[
  '治安快訊：前方設有民兵檢查站或外星執法掃描門！身上背著通緝令的駕駛請提早想好對策！',
  '邊境盤查通報：前面有巡邏隊在臨檢過往車輛，乖乖受檢還是衝卡火併，趁現在先商量好。'
 ],
 12:[
  '幸運星電台：今天風向特別好！聽說前方有沒被撿走的空投補給或秘境好康，手腳快的旅人有福了！',
  '公路好消息：前頭那段路罕見地平靜又順暢，甚至可能撞見好心的老技師或意外寶藏！'
 ]
};

const RADIO_AUTHOR_QUIPS={
 ad:[
  '（聽聽就好，這家電台連過期十年的罐頭都能吹成米其林三星。）',
  '（我敢打賭這段廣告詞，是某個存貨賣不出去的廢土商人自己錄的。）',
  '（如果真像他說的那麼神，播音員自己怎麼不帶一件衝去樂園？）',
  '（每次聽到這家電台，我都懷疑收音機其實連到了外星詐騙機房。）',
  '（順帶一提，本故事書作者絕不替這家電台的誇大療效背書。）'
 ],
 forecast:[
  '（這家電台的路況預報準歸準，問題是聽完你還是得往那裡開。）',
  '（謝謝電台好心提醒，雖然現在踩煞車掉頭大概也來不及了。）',
  '（真希望這家電台偶爾也能預告一下哪裡有免費熱水澡可以洗。）',
  '（連播音員語氣都比車上所有人還緊張，看來前頭確實不太妙。）'
 ],
 radio:[
  '（末日十年了，沒想到還能收到這麼多廢話連篇的廣播頻道。）',
  '（外星人佔領了天空，卻沒人想過把這些吵人的電台一起關掉。）',
  '（聽著沙沙的電流聲，我都忍不住想寫信去點一首老歌了。）'
 ]
};

export function rollRadioAuthorQuip(kind='radio',seed=1,stop=0){
 let h=2166136261;
 for(const ch of `radio-quip:${kind}:${seed}:${stop}`)h=Math.imul(h^ch.charCodeAt(0),16777619);
 const roll=(h>>>0)%100;
 const chance=kind==='ad'?48:kind==='forecast'?42:35;
 if(roll>=chance)return '';
 const pool=RADIO_AUTHOR_QUIPS[kind]||RADIO_AUTHOR_QUIPS.radio;
 return pool[((h>>>8)>>>0)%pool.length];
}

export function radioEventForecast(state,seed=1){
 const boss=state?.travel?.upcomingBoss;
 const quip=rollRadioAuthorQuip('forecast',seed,state?.stop||0);
 if(boss){
  const tierText=boss.tier==='mini'?'高危小頭目':boss.tier==='mid'?'重裝中階強敵':'終極守門巨獸';
  return {
   station:'東行緊急警報 FM 104.7',
   text:`全頻段最高警報！偵測到前方里程節點出現${tierText}「${boss.name}」的強烈熱源反應！請立刻檢查生命值、裝備與藥品，這場硬仗躲不掉了！${quip?'\n'+quip:''}`
  };
 }
 const up=state?.travel?.upcomingEvent;
 if(!up||!FORECASTS_BY_D12[up.d12])return null;
 return {
  station:'東行路況預告 FM 98.5',
  text:pickHash(FORECASTS_BY_D12[up.d12],seed,(state.stop||0)*17+up.d12)+(quip?'\n'+quip:'')
 };
}

export function radioExaggeratedItemAd(items,consumables,seed=1,stop=0){
 const allGear=Object.entries(items||{}).map(([id,it])=>({kind:'gear',id,it}));
 const allCons=Object.entries(consumables||{}).map(([id,c])=>({kind:'consumable',id,c}));
 const pool=[...allGear,...allCons];
 if(!pool.length)return null;
 const pick=pickHash(pool,seed,stop*31+7);
 const quip=rollRadioAuthorQuip('ad',seed,stop);
 if(pick.kind==='gear'){
  const {it}=pick;
  const pitch=it.slot==='武器'
   ? `還在拿生鏽扳手敲怪獸嗎？快換上「${it.name}」（攻擊 +${it.attack||0}${it.vsMachine?`、對機械 +${it.vsMachine}`:''}）！一出手連外星母艦都得打雙黃燈靠邊讓路！市價只要 ${it.price} 份廢料，買到賺到，打不中恕不退貨！`
   : it.slot==='防具'
    ? `怕被路邊劫匪打成蜂窩？穿上「${it.name}」（防禦 +${it.defense||0}${it.antiPollution?`、抗污染 -${it.antiPollution}`:''}）！據說連隕石砸頭都只會彈出清脆音效！只要 ${it.price} 份廢料，立刻升級成廢土移動堡壘！`
    : `旅途總是差臨門一腳？掛上「${it.name}」就對了！老司機一致見證戴上去瞬間氣場暴漲三百倍，連紅綠燈壞掉都會自動替你亮綠燈！超值價 ${it.price} 份廢料，各雜貨鋪熱賣中！`;
  return {station:'廢土深夜購物台 AM 666',text:pitch+(quip?'\n'+quip:'')};
 }
 const {c}=pick;
 const pitch=c.hp>0&&c.st===0
  ? `快斷氣了嗎？快試試「${c.name}」（生命 +${c.hp}）！號稱只要還剩一口氣就能把你從鬼門關硬拽回駕駛座，痛到流淚代表藥效正在發揮！只要 ${c.price} 份廢料！`
  : c.esp>0&&c.hp===0
   ? `超能力放不出來超尷尬？灌一瓶「${c.name}」（ESP +${c.esp}${c.st?`、體力 +${c.st}`:''}）！喝完不只大腦發光，據說晚上車頭燈壞了還能張嘴照路！特價 ${c.price} 份廢料！`
   : `餓到連方向盤都像甜甜圈？來一份「${c.name}」（體力 +${c.st}${c.hp?`、生命 +${c.hp}`:''}）！保存期限只是一個參考數字，打開沒爆炸就代表營養百分百鎖鮮！只要 ${c.price} 份廢料！`;
 return {station:'廢土深夜購物台 AM 666',text:pitch+(quip?'\n'+quip:'')};
}

export const COLD_JOKES=[
 ['欸，你知道外星人來地球十年，為什麼最討厭吃自助餐嗎？','……為什麼？','因為他們都吃「飛碟」——碟子自己飛走了。','……你再講一句，我現在就把你丟在路肩。'],
 ['我剛想到一個問題，外星母艦如果違規停車，會被開什麼罰單？','超速？','不是，是「母湯」啦，太母湯了！','車廂裡的冷氣是不是突然開到最強了……'],
 ['你知道為什麼外星先遣軍每次進攻都遲到嗎？','因為地球路況太爛？','不是，因為他們還在「先遣」……先去簽到。','（默默把收音機音量轉大蓋過沉默）'],
 ['問你喔，變種人談戀愛最怕遇到什麼事？','被輻射照到？','最怕對方「變」心！','這笑話爛到連外星監控衛星都轉頭不看了。'],
 ['你知道星門為什麼總是關不起來嗎？','能量過載？','因為它跟大家「星門」不合，喔不，是「心門」打太開。','拜託你專心看路牌就好，真的。'],
 ['欸，如果我們在路上遇到一隻會講笑話的菌絲怪，你猜牠會說什麼？','不想猜。','牠會拍胸脯說：「免驚，『孢』在我身上！」','……車窗搖下來透個氣，我快窒息了。'],
 ['你知道外星人學中文最先學會哪個成語嗎？','弱肉強食？','是「束手無策」——因為他們老愛射光「束」啊！','這冷度大概可以把前方的沙漠變成冰原。'],
 ['問你一個，為什麼廢土上的流浪商人都很有禮貌？','怕被打劫？','因為他們最講究「外星人情味」……雖然大部分都是異星味。','我寧願聽輪胎壓過碎玻璃的聲音。'],
 ['你知道軌道砲發射前為什麼都要先深呼吸嗎？','散熱？','因為怕自己「脫軌」演出！','下一個休息站我決定換你睡車頂。'],
 ['猜猜看，外星無人機如果沒電了會去哪裡？','回基地充電？','去「無」人「機」場躺平啊！','……連引擎都差點被你冷到熄火。'],
 ['你知道為什麼我們一路向東都不會迷路嗎？','因為有指南針？','因為「東」西南北，只有「東」有東西吃！','這什麼小學一年級等級的冷笑話……'],
 ['欸，如果有一隻外星觸手怪去開理髮店，生意會好嗎？','應該會把客人嚇跑吧。','不會啦，人家可是「觸」類旁通的設計師！','我開始懷念一個人開車的安靜時光了。'],
 ['你知道外星人為什麼都不穿破洞牛仔褲嗎？','不合身？','因為他們怕「星」光外洩！','你再這樣，下次守夜全包給你。'],
 ['問你喔，沙蟲平常在地底下都在幹嘛？','鑽洞找吃的？','在「沙」時間啊！','……外面溫度四十度，車內體感零下五度。'],
 ['你知道為什麼外星執法機器人從來不說謊嗎？','程式設定？','因為他們全身上下都是「實鐵」證據！','求求你喝口水閉嘴五分鐘好不好。'],
 ['欸，如果晶體怪獸感冒了會怎樣？','會碎掉嗎？','會變成「結」晶鼻涕，喔不，是「晶」神不濟！','前面要是有劫匪，我第一個把你交出去抵過路費。']
];

export function companionColdJokeExchange(lead,partner,display,seed=1,stop=0){
 const [setup,reply,punch,groan]=pickHash(COLD_JOKES,seed,stop*23+11);
 return {
  focus:'cold_joke',
  subject:partner.id,
  lines:[
   {speaker:display(partner),personId:partner.id,text:setup},
   {speaker:display(lead),personId:lead.id,text:reply},
   {speaker:display(partner),personId:partner.id,text:punch},
   {speaker:display(lead),personId:lead.id,text:groan}
  ]
 };
}
