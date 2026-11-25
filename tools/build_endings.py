#!/usr/bin/env python3
"""Generate spec/endings.json (100 unique endings) and 100 crisp 16-bit pixel-art SVGs."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC_OUT = ROOT / "spec" / "endings.json"
ART_DIR = ROOT / "dist" / "assets" / "endings"

# 100 unique endings:
#   001..060: win (60)
#   061..080: stranded (20)
#   081..100: death (20)
# Format: (outcome, title, text, author_quip, sky, ground, subject, accent, weather)
RAW_ENDINGS = [
    # ==================== 60 WIN ENDINGS (001-060) ====================
    ("win", "海風修理廠",
     "穿過{paradise}的防風林後，{party}把陪伴百里的破車改成了海岸第一家修理廠。每天都有新來的旅人推著冒煙的引擎上門，{hero}總會先遞上一杯冰水再開始敲扳手。",
     "（開了一百里破車，結果到了樂園還繼續天天摸機油——我看{hero}這輩子大概是跟黑手黨……不對，是跟黑手師傅的命運鎖死了。）",
     "dawn", "coast", "garage", "#d5b176", "clouds"),
    ("win", "溫室裡的番茄王國",
     "{party}在{paradise}的廢棄玻璃穹頂裡翻出半包十年前的番茄種子。三年後，整座海灣都飄著酸甜的羅勒與番茄湯香氣，{hero}成了方圓百里最難預約的農夫。",
     "（打贏{boss}的英雄跑去種番茄，聽起來很田園詩意；但我賭{hero}第一季肯定把肥料跟機油搞混過。）",
     "noon", "meadow", "greenhouse", "#e06d53", "sun"),
    ("win", "不再播廣告的燈塔電台",
     "{hero}爬上{paradise}最高的紅白燈塔，把整座發射台改裝成全波段廣播站。從此東方傳回荒野的不再是沒人買的生髮水廣告，而是真正能指引迷途車隊的路況預報。",
     "（連我最愛寫的末日爛廣告都被{hero}砍掉了！看來下一本書我得自己兼職去念工商服務才行。）",
     "sunset", "coast", "lighthouse", "#f0c36d", "seagulls"),
    ("win", "偷開走外星穿梭機",
     "擊倒{boss}後，{party}在{paradise}的秘密停機坪發現一艘忘了拔鑰匙的外星小型穿梭機。{hero}拍了拍儀表板，決定把這場公路旅行直接升級成太陽系自駕遊。",
     "（我好不容易畫完一百里的柏油路，{hero}居然直接給我開太空船飛走了？下集難道要改名叫《一路向火星》嗎！）",
     "aurora", "crater", "shuttle", "#7ce2d4", "stars"),
    ("win", "廢土大排檔",
     "{party}拆下破車的引擎蓋當作超大鐵板，在{paradise}的碼頭邊開起深夜大排檔。無論是人類、變異體還是迷路的機器人，只要交兩顆螺絲就能換一碗熱騰騰的乾拌麵。",
     "（拿引擎蓋煎蛋聽起來衛生局絕對不會過關，好在{paradise}沒有衛生局，只有餓了十年的食客。）",
     "dusk", "harbor", "market", "#f39c6b", "lanterns"),
    ("win", "百里公路圖書館",
     "{hero}把沿途撿到的破舊日記、地圖與口述錄音全搬進{paradise}的舊車站，成立了一座誰都能借閱的公路圖書館。那段外星佔領十年的荒唐歲月，終於有人好好替它留底。",
     "（居然把我的草稿也抄進去當館藏了！拜託記得在扉頁幫我註明「暢銷作家著」，版稅用兩箱乾淨礦泉水結算就行。）",
     "dawn", "meadow", "library", "#d5b176", "clouds"),
    ("win", "無照風力發電鎮長",
     "{party}靠著沿路搜刮的廢料，在{paradise}的山坡立起十二座嘎吱作響的風車。居民為了感謝終於能吹上電風扇，半推半就地把{hero}選成了第一任鎮長。",
     "（連自己車子的漏油都修不好的傢伙居然當上了鎮長，我替{paradise}的財政預算捏一把冷汗。）",
     "noon", "hill", "windmill", "#9ad1c2", "clouds"),
    ("win", "露天汽車電影院",
     "{hero}在{paradise}的沙灘旁掛起巨大的降落傘布，用老舊放映機循環播放十年前的B級科幻片。每到週末，數十輛拼裝破車並排按喇叭，笑聲比海浪還響。",
     "（外星人真來了十年，結果大家在樂園裡最愛看的還是外星人入侵爛片——人類的黑色幽默果然連母艦都轟不爛。）",
     "night", "coast", "cinema", "#f2d08a", "stars"),
    ("win", "跨物種相親事務所",
     "因為一路上見過太多奇形怪狀的旅人，{hero}乾脆在{paradise}開了家媒人茶館。沒過兩年，海灣裡到處都是半機械人牽著孢子族散步的奇特風景。",
     "（我本來以為這是部硬派末日公路片，怎麼最後被{hero}玩成了荒野戀愛實境秀？）",
     "sunset", "meadow", "teahouse", "#e88da3", "fireflies"),
    ("win", "把破車種成花圃",
     "抵達{paradise}的隔天，那輛立下大功的座駕終於壽終正寢。{party}沒捨得拆它，反而把車廂填滿黑土種滿向日葵，讓它成了海角最醒目的地標。",
     "（一台陪你撞飛過變異野狗的破車，最後的歸宿居然是當特大號花盆——說真的，這結局比我預期得還浪漫那麼一點點。）",
     "noon", "meadow", "car_garden", "#f4c95d", "petals"),
    ("win", "海岸觀星天文台",
     "{party}修好了{paradise}山頂的圓頂望遠鏡。從此每個無雲的夜晚，{hero}都會對著天上的母艦殘骸喝一口麥茶，順便教鎮上的孩子認出哪顆才是真正的北極星。",
     "（用望遠鏡偷看外星母艦有沒有再派兵，順便假裝自己在搞浪漫天文學，{hero}這招實在高明。）",
     "night", "snow", "observatory", "#8ecae6", "stars"),
    ("win", "廢料爵士樂團",
     "抵達{paradise}後，{party}用消音管、汽油桶與生鏽輪框組了支打擊樂團。雖然每個音都不太準，但每晚碼頭邊依然擠滿了跟著拍手跳舞的倖存者。",
     "（如果外星母艦哪天突然撤離地球，我敢保證八成是被{hero}這支走音樂團吵到受不了。）",
     "dusk", "harbor", "stage", "#f4a261", "lanterns"),
    ("win", "太陽能澡堂老闆",
     "{hero}在{paradise}的溫泉裂谷架起一整排反光板，開出佔領區十年來第一家二十四小時熱水澡堂。據說排隊洗去十年的灰塵，比打贏{boss}還讓人想哭。",
     "（寫了整本書都沒讓{hero}洗過一次澡，結局總算讓他泡進熱水裡了，我這個作者也算仁至義盡。）",
     "dawn", "canyon", "bathhouse", "#a8dadc", "steam"),
    ("win", "跨海帆船遠征隊",
     "在{paradise}休養半年後，{hero}望著東邊更遠的水平線又開始手癢。{party}把引擎裝上雙體帆船，決定去看看大海另一頭是不是還有另一個傳說。",
     "（剛到終點沒幾天就又想出海，{hero}你是不是只要在同一個地方待超過三個月就會全身發癢？）",
     "noon", "coast", "sailboat", "#74c0fc", "seagulls"),
    ("win", "舊時代漫畫重印社",
     "{party}在{paradise}地下室挖出一台老式油印機，開始憑記憶手繪重印十年前的熱血漫畫。雖然畫風歪七扭八，卻讓整座海灣的小孩每週搶破頭。",
     "（畫得歪七扭八居然還有人搶著看？早知道我也去{paradise}開出版社，稿費一定比現在高。）",
     "dawn", "meadow", "printshop", "#e9c46a", "clouds"),
    ("win", "蜂蜜與孢子釀酒廠",
     "{hero}把旅途中收集的發光菌菇與海灣野花蜜混在一起發酵，意外釀出喝一口就會暫時忘記外星人的奇蹟果酒，{paradise}的酒館從此夜夜爆滿。",
     "（拿路邊不明發光蘑菇釀酒居然沒把全鎮送進醫院，{hero}的運氣值絕對偷偷灌過水。）",
     "dusk", "forest", "brewery", "#d4a373", "fireflies"),
    ("win", "環島觀光巴士司機",
     "厭倦了槍林彈雨後，{hero}把破車刷上亮黃色油漆，在{paradise}開起收費環灣巴士。每次經過當年大戰{boss}的彈坑，都會用麥克風誇張地吹噓半小時。",
     "（而且我保證{hero}每講一次，{boss}的身高就會多長高三公尺，這就是傳說誕生的真相。）",
     "noon", "coast", "bus_stop", "#f4d35e", "clouds"),
    ("win", "海岸郵差與信鴿隊",
     "{party}在{paradise}馴養了一群認得海岸線的信鴿，開始替分散各地的倖存者傳遞家書。每一封平安抵達的薄紙，都比十桶高辛烷值汽油還要珍貴。",
     "（在連衛星都被外星人沒收的年代，靠鴿子送信反而成了最穩定的通訊協定，科技樹真是諷刺啊。）",
     "dawn", "coast", "dovecote", "#cfe1b9", "seagulls"),
    ("win", "機器人退休養老院",
     "{hero}在{paradise}的山谷開了一間專門幫老舊合成人與作業機具上油換電池的院子。每天下午，滿院子都是曬著太陽發出呼嚕聲的鐵殼老頭。",
     "（連機器人都有養老院了，反觀我這個作者還在熬夜趕稿寫第一百個結局，真是人不如鐵。）",
     "sunset", "meadow", "workshop", "#8bbfb0", "clouds"),
    ("win", "無人島貓咪保護區",
     "穿過{paradise}的潮間帶後，{party}發現一座外星掃描儀照不到的礁石小島，上頭住著上百隻流浪貓。{hero}從此每天划船送魚乾，成了名副其實的貓島國王。",
     "（打倒終極魔王、穿越百里死地，結果人生巔峰是當鏟屎官——老實說，這可能是全書最划算的結局。）",
     "noon", "coast", "cat_island", "#f4a261", "seagulls"),
    ("win", "地下鐵道觀光列車",
     "{party}把{paradise}廢棄的海岸隧道重新通電，修好一節只剩兩張長椅的老式電聯車。每天傍晚，全鎮的人都會搭著它繞海灣一圈，假裝世界從沒壞過。",
     "（坐著哐當作響的破電車假裝還在十年前的通勤路上——沒想到末日之後大家最懷念的竟然是搭電車。）",
     "sunset", "coast", "train", "#e76f51", "clouds"),
    ("win", "高空熱氣球偵察隊",
     "{hero}用帆布與瓦斯爐拼出巨型熱氣球，從{paradise}升空俯瞰整片東方大地。第一次從雲端看見沒有母艦陰影的藍海時，{party}在吊籃裡安靜了整整十分鐘。",
     "（用拼裝瓦斯爐飛上三百公尺高空，我這個作者在地面看著都替他們腿軟。）",
     "dawn", "hill", "balloon", "#e63946", "clouds"),
    ("win", "廢土最高法院法官",
     "因為{hero}一路上調停過太多荒唐的公路糾紛，{paradise}的居民乾脆請他坐在舊公車亭裡當調解官。所有爭吵只要喝完他泡的苦茶，多半都能握手言和。",
     "（不是因為{hero}判案特別公正，純粹是因為那壺茶難喝到原告跟被告都想趕快和解逃跑。）",
     "noon", "meadow", "courthouse", "#d5b176", "clouds"),
    ("win", "鹽田與冰棒工坊",
     "{party}在{paradise}的淺灘曬出潔白海鹽，又用太陽能壓縮機做出全海岸第一批海鹽檸檬冰棒。酷暑午後，連曾經最凶狠的雇傭兵都會乖乖排隊舔冰棍。",
     "（誰能想到終結末日暴戾之氣的秘密武器，不是雷射槍，而是一根賣兩顆螺絲的海鹽冰棒。）",
     "noon", "coast", "salt_flat", "#90e0ef", "sun"),
    ("win", "地下種子銀行守護者",
     "在{paradise}的岩洞深處，{party}找到一座保存完好的低溫種子庫。{hero}決定留下來守著這扇厚重鐵門，每年春天挑出十種新植物，慢慢把世界重新種綠。",
     "（這個結局正經得連我都捨不得吐槽了……好吧，只吐槽一句：{hero}記得別把種子標籤貼反啊！）",
     "twilight", "canyon", "vault", "#81b29a", "fireflies"),
    ("win", "外星古董黑市鑑定師",
     "因為拆過太多外星殘骸與{boss}的裝甲，{hero}成了{paradise}最懂辨別真假外星零件的鑑定師。想拿生鏽電鍋冒充能量核心的騙子，現在連港區都不敢靠近。",
     "（從被商人坑廢料的冤大頭，一路修煉成專門拆穿騙子的老狐狸，這才叫真正的角色成長曲線。）",
     "dusk", "harbor", "antique", "#c77dff", "lanterns"),
    ("win", "海崖茶屋與舊唱片",
     "{party}在{paradise}面海的懸崖搭起一間木造茶屋，角落裡那台手搖留聲機永遠播著刮花的爵士黑膠。旅人來來去去，總有人在這裡把眼淚留給海風。",
     "（一杯熱茶、一張老唱片、一片藍海——我突然很想把這台鍵盤摔了，也買張單程票去{hero}店裡蹭茶喝。）",
     "sunset", "coast", "cliff_cafe", "#e9c46a", "seagulls"),
    ("win", "重組公路救援聯隊",
     "記起自己在荒野差點斷油的慘狀，{hero}在{paradise}號召了一批老司機組成免費救援隊。只要電台傳來求救訊號，他們就開著改裝拖吊車衝回西邊救人。",
     "（當年自己開到拋錨時罵得要死，現在卻主動開車回去撈別人的破車——{hero}這傢伙果然是個嘴硬心軟的笨蛋。）",
     "dawn", "canyon", "convoy", "#f4a261", "dust"),
    ("win", "海灣夜校的語文老師",
     "{hero}在{paradise}的舊禮堂掛起一塊裂成兩半的黑板，每晚教在佔領區長大的孩子識字、看地圖與分辨哪種罐頭已經膨罐不能吃。",
     "（教小孩分辨膨罐罐頭，這門課的實用程度絕對輾壓舊時代所有的微積分。）",
     "twilight", "meadow", "school", "#f2cc8f", "fireflies"),
    ("win", "百里馬拉松創辦人",
     "為了紀念那趟荒唐的百里長征，{hero}在{paradise}發起一年一度的「向東徒步賽」。第一名沒有金牌，只有一罐完整無缺的舊時代水蜜桃罐頭。",
     "（自己開了四個輪子過來，卻叫別人用兩條腿跑，{hero}你這個主辦單位是不是有點缺德？）",
     "noon", "coast", "archway", "#e76f51", "clouds"),
    ("win", "螢光蕈菇森林園丁",
     "{party}把一路上帶來的變異孢子種進{paradise}背陰的濕潤山谷。三年後，整座山谷入夜便化作發光的藍色童話森林，照亮了迷途旅人的最後一哩路。",
     "（把末日變異菌種成打卡聖地，{hero}的商業頭腦要是放在十年前肯定能上市。）",
     "night", "forest", "mushroom", "#64dfdf", "spores"),
    ("win", "水上漂浮市集大亨",
     "{hero}用報廢油桶與廢船木板，在{paradise}的平靜港灣搭起一座隨潮汐起伏的漂浮市集。想買乾淨淡水、修車扳手或一首走音情歌，這裡全都找得到。",
     "（海平面還沒漲起來，{hero}就先把威尼斯給蓋出來了，真是超前部署。）",
     "sunset", "harbor", "floating", "#f4a261", "lanterns"),
    ("win", "專寫實話的公路史官",
     "抵達{paradise}後，{hero}買了滿滿一箱空白筆記本，一字不漏地把這趟旅途的蠢事、悲傷與奇蹟寫成厚厚三冊，成了海灣最暢銷的手抄故事書。",
     "（喂喂喂，寫故事是我的工作耶！{hero}你把作家的飯碗搶走了，我接下來要去哪裡領稿費啊！）",
     "dawn", "meadow", "desk", "#d5b176", "clouds"),
    ("win", "舊時代鐘錶修復師",
     "{party}在{paradise}的鐘樓住下，專門替旅人修好停擺十年的機械錶與鬧鐘。當生鏽的齒輪再次滴答走動，大家才突然想起時間原來還在前進。",
     "（在末日修好鬧鐘聽起來很詩意，直到星期一早上六點它真的響起來為止。）",
     "sunset", "hill", "clocktower", "#e9c46a", "clouds"),
    ("win", "與外星逃兵合開咖啡館",
     "在{paradise}的防波堤旁，{hero}遇見一名厭倦星際軍紀的外星逃兵。兩人一拍即合開了家咖啡館，一個負責烤焦咖啡豆，一個負責用反重力端盤子。",
     "（跨星系飲食合作！希望那位外星店員別再把客人點的拿鐵誤加成液態甲烷了。）",
     "dusk", "coast", "alien_cafe", "#9d4edd", "stars"),
    ("win", "懸崖風箏節發起人",
     "每個起風的十月，{party}都會在{paradise}的懸崖放飛用舊地圖縫成的巨型風箏。那些曾被佔領區困住的名字，終於乘著海風飛過了當年的封鎖線。",
     "（用舊地圖當風箏，飛上天那一刻確實挺帥的——前提是別把唯一的補給點座標也一起放飛了。）",
     "noon", "coast", "kites", "#e63946", "clouds"),
    ("win", "廢棄潛艇改造旅社",
     "{party}把擱淺在{paradise}礁岩上的舊時代潛艇清乾淨，改成全海岸隔音最好、也最潮濕的特色民宿。{hero}當櫃檯，標榜「絕對防外星掃描」。",
     "（確實防掃描，就是翻個身頭會撞到魚雷管，差評率大概只有三成。）",
     "twilight", "coast", "submarine", "#457b9d", "seagulls"),
    ("win", "海鹽麵包烘焙屋",
     "{hero}用紅磚在{paradise}壘起一座柴燒窯，每天清晨五點出爐第一批剛烤好的海鹽麵包。香氣飄過整條海濱公路，成了比鬧鐘更準時的早安信號。",
     "（寫到這裡我自己都餓了。{hero}你要是有良心，記得留一條剛出爐的麵包在稿紙旁邊。）",
     "dawn", "meadow", "bakery", "#f4a261", "steam"),
    ("win", "破車博物館館長",
     "{party}把陪伴百里的戰車完整停進{paradise}的廣場玻璃屋，旁邊寫滿每道彈孔與刮痕的由來。後來每個抵達樂園的新旅人，都會先來摸摸它的保險桿求好運。",
     "（連左前門那個被路邊山羊頂出來的凹痕都被寫成「英勇戰損」，博物館文案的水分果然古今皆然。）",
     "noon", "meadow", "museum", "#d5b176", "clouds"),
    ("win", "東岸氣象觀測員",
     "{hero}修好了{paradise}山頭的氣象雷達，每天準時手繪隔天的風向與降雨圖貼在公告欄。靠海吃飯的漁民說，這比外星母艦的廣播可靠一萬倍。",
     "（就算偶爾報錯把晴天報成暴雨，大家也只會笑笑說「至少不是外星酸雨」，門檻真好混啊。）",
     "dawn", "hill", "radar", "#8ecae6", "clouds"),
    ("win", "免費單車共享站",
     "厭倦了滿世界找汽油的日子，{party}把沿途搜集來的廢棄腳踏車全數翻新，在{paradise}的林蔭道擺出整排免費單車。風吹過鈴鐺的聲音，成了樂園的新節奏。",
     "（終於不用再算油耗跟油箱容量了！我這個作者雙手雙腳贊成全面改騎腳踏車！）",
     "noon", "meadow", "bicycles", "#52b788", "petals"),
    ("win", "極光下的雪地木屋",
     "抵達{paradise}後，{party}繼續往東北的雪線推進了半天車程，在能看見極光的針葉林旁蓋起暖呼呼的木屋。壁爐裡的松木噼啪作響，外頭的世界彷彿遠在另一個世紀。",
     "（千辛萬苦到了海邊樂園，結果又自己跑去零下十度看極光——{hero}你對「享受退休」的定義還真是硬派。）",
     "aurora", "snow", "cabin", "#72efdd", "snow"),
    ("win", "海洋聲學錄音師",
     "{hero}用報廢收音機與防水麥克風，在{paradise}的海底錄下鯨魚重新回到東岸的歌聲。當這捲錄音帶在廣場播放時，連最硬漢的拾荒者都紅了眼眶。",
     "（連鯨魚都回來了，看來這顆星球還是有救的——難得讓我這本嘴賤的故事書也正經感動一回。）",
     "twilight", "coast", "whale", "#48cae4", "stars"),
    ("win", "廢土拼裝賽車冠軍",
     "在{paradise}的鹽沼賽道上，{hero}開著陪伴百里的老座駕橫掃所有改裝車手，拿下第一屆東岸盃冠軍。領獎台上，他舉起的是一罐沒開封的機油。",
     "（開著一台隨時會解體的破車還能拿冠軍，其他參賽者大概都忙著在半路撿自己掉下來的輪胎吧。）",
     "sunset", "salt", "racetrack", "#e63946", "dust"),
    ("win", "跨星系和平談判代表",
     "因為{party}擊敗{boss}的傳聞傳進軌道，外星駐軍派來一位禮貌得過分的使節。{hero}穿著補丁外套在海邊塑膠椅上跟對方談判，硬是替{paradise}談下五十年非軍事區。",
     "（穿著破夾克坐在紅色塑膠椅上跟星際帝國簽停戰協定，這畫面要是印進歷史課本，後代一定以為是惡搞圖。）",
     "dawn", "coast", "diplomacy", "#a8dadc", "clouds"),
    ("win", "無人機果園守護者",
     "{party}把從{boss}殘骸拆下的核心改寫成自動灑水系統，讓{paradise}的柑橘園一年四季結實纍纍。曾經用來殺人的科技，最後全都學會了照顧橘子樹。",
     "（外星帝國花費數億星幣研發的戰鬥核心，最終職務是「幫橘子樹澆水」——我給這個結局打一百分。）",
     "noon", "meadow", "orchard", "#f77f00", "sun"),
    ("win", "午夜靈異故事茶座",
     "每逢滿月，{hero}就會在{paradise}的廢棄燈塔下生起營火，講述自己這一路撞見的詭異廢墟與發光怪物。沒人分得清哪句是真、哪句是瞎編，但大家都聽得津津有味。",
     "（照我對{hero}的了解，十句裡面大概有三句是真的、七句是自己加戲，還順便把我寫的劇情改得面目全非。）",
     "night", "coast", "campfire", "#f4a261", "stars"),
    ("win", "太陽能玻璃吹製工坊",
     "{party}利用聚光鏡把{paradise}的白沙燒成晶瑩剔透的玻璃杯與彩繪窗。每當陽光穿透教堂廢墟的新窗戶，整座小鎮就像掉進萬花筒裡一樣閃亮。",
     "（從廢土求生一路點滿藝術技能樹，{hero}你下一步是不是打算去開個人畫展？）",
     "noon", "coast", "glassworks", "#90e0ef", "sun"),
    ("win", "老橋守門人與通行詩",
     "{hero}接手看守通往{paradise}的最後一座吊橋。他不收過路費，只要求每個想進城的新旅人留下一句旅途中最難忘的話，寫在橋頭那塊越掛越長的木板上。",
     "（希望沒有哪個沒良心的旅人在木板上寫「這本故事書的作者話太多」，不然我會記仇的。）",
     "sunset", "canyon", "bridge", "#d5b176", "clouds"),
    ("win", "地下黑膠唱片行",
     "{party}把一路撿來的數百張舊唱片整理分類，在{paradise}開了間只換不賣的唱片行。用一首沒聽過的旋律換另一段回憶，成了海灣最浪漫的交易。",
     "（如果有人拿末日電台的生髮水廣告黑膠去換，拜託{hero}直接把他轟出去。）",
     "dusk", "meadow", "vinyl", "#e07a5f", "lanterns"),
    ("win", "海岸消防與急救站",
     "經歷過太多險些喪命的夜晚，{party}在{paradise}建起設備齊全的急救站。無論是燙傷、舊傷復發還是吃錯野果，這裡的燈永遠為旅人亮著。",
     "（隊伍裡以前老是有人把藥品留到快全滅才肯吃，現在開急救站總算懂得及時止血了。）",
     "dawn", "meadow", "clinic", "#e63946", "clouds"),
    ("win", "懸浮結晶能源工坊",
     "{party}從{boss}的殘骸裡提取出穩定的微光結晶，替{paradise}點亮一整條不用燒油的夜間步道。淡藍色的燈火倒映在海面上，美得讓人忘了十年前的浩劫。",
     "（既環保又省油，還能順便炫耀自己打贏過大頭目，這波戰利品利用得堪稱模範。）",
     "night", "coast", "crystal", "#72efdd", "stars"),
    ("win", "荒野繪本插畫家",
     "{hero}用炭筆與植物汁液，把自己一路遇見的怪異旅人、破車與日落全畫成童話繪本。{paradise}的孩子們睡前最愛聽的，正是這段有點蠢卻很溫柔的向東冒險。",
     "（畫得比我這套 16-bit 像素風還精緻的話，我可是會吃醋的喔，{hero}。）",
     "dawn", "meadow", "easel", "#f4a261", "petals"),
    ("win", "無盡公路的新地圖繪師",
     "抵達{paradise}三個月後，{hero}發現現有的東方地圖全是錯的。於是{party}重新加滿油箱，決定沿著海岸線往南北繼續測繪，替後人畫出第一份真正準確的末日地圖。",
     "（剛把這本書翻到最後一頁就立刻幫續集埋伏筆，{hero}你簡直比出版社編輯還會催更。）",
     "noon", "coast", "compass", "#8bbfb0", "clouds"),
    ("win", "海崖蜂蜜鬆餅攤",
     "{party}在{paradise}看日出的崖邊推起一輛改裝餐車，專賣淋滿野花蜜的熱鬆餅。很多人走了上百里荒路，最後卻是因為一口鬆餅決定留在這裡定居。",
     "（說真的，如果我走了一百里吃沙喝髒水，看到剛煎好的蜂蜜鬆餅我也會當場宣布退休。）",
     "dawn", "coast", "foodtruck", "#f4c95d", "seagulls"),
    ("win", "舊時代棒球場重啟",
     "{hero}帶著全鎮居民拔掉雜草、用白灰重新畫線，在{paradise}舉辦了十年來第一場九局棒球賽。當木棒擊出全壘打飛進海灣時，全場歡呼得像世界重獲新生。",
     "（雖然九局下來有五顆球被變異海鷗叼走，但規則書早就燒光了，裁判說算分就算分！）",
     "noon", "meadow", "baseball", "#e76f51", "clouds"),
    ("win", "潮汐發電與星光碼頭",
     "{party}修好{paradise}的潮汐發電機，讓整座老碼頭在夜裡亮起溫暖的琥珀燈串。漁船歸港的汽笛聲，從此取代了當年外星巡邏艇的警報。",
     "（同樣是琥珀色光線，以前看到要立刻踩油門逃命，現在看到卻代表有烤魚可以吃，時代真的變了。）",
     "dusk", "harbor", "pier", "#f4a261", "lanterns"),
    ("win", "山谷溫泉與慢生活協會",
     "擊敗{boss}的隔週，{hero}正式宣布成立「什麼都不幹協會」，每天的行程只有泡溫泉、曬太陽與幫破車擦灰塵。申請入會的名單短短一個月就排到港外。",
     "（奮鬥了一百里，最後的終極夢想是合法躺平——我打從心底佩服{hero}的覺悟。）",
     "dawn", "canyon", "hotspring", "#a8dadc", "steam"),
    ("win", "靜默海灣的造船匠",
     "{party}拜一位隱居在{paradise}的老船匠為師，親手刨木頭打造出一艘純木造雙桅帆船。船頭刻著一路上同行過的每個名字，準備迎向沒有終點的藍海。",
     "（從修破車一路進階到造帆船，{hero}的雙手大概是全末日最值錢的萬用工具箱。）",
     "sunset", "harbor", "shipyard", "#d5b176", "seagulls"),
    ("win", "真的只是好好睡了一覺",
     "抵達{paradise}的那天晚上，沒有守夜、沒有警報、沒有壞掉的引擎。{party}把車停在聽得見海浪的草地上，蓋著舊毯子一覺睡到隔天中午，醒來時陽光正好。",
     "（沒有稱王、沒有發財、沒有驚天動地的史詩番外——就只是安安穩穩睡了一覺。說來慚愧，這竟然是我寫完一百個結局裡最羨慕的一個。）",
     "dawn", "meadow", "sleeping_car", "#f2cc8f", "clouds"),

    # ==================== 20 STRANDED ENDINGS (061-080) ====================
    ("stranded", "路邊鐵皮休息站",
     "車子在荒野徹底罷工後，{party}索性把報廢的車身當成櫃檯，就地蓋起一間鐵皮休息站。雖然沒能看見{paradise}，卻成了無數向東旅人最溫暖的中繼點。",
     "（去不了樂園，乾脆在半路開起收費休息站賺後續旅人的廢料——{hero}這招轉型速度連我都甘拜下風。）",
     "sunset", "desert", "roadside_inn", "#e9c46a", "dust"),
    ("stranded", "改造成沙漠書屋的破車",
     "耗盡最後一滴油後，{hero}把熄火的座駕推到樹蔭下，拆掉座椅釘滿木架。路過的人只要留下一本舊書或一則傳聞，就能在車廂裡免費躲過最毒辣的正午太陽。",
     "（既然開不動了，就地轉職成荒野圖書館長，至少不用再擔心半路爆胎。）",
     "noon", "desert", "car_library", "#d5b176", "sun"),
    ("stranded", "加入流浪商隊的護衛",
     "被困在荒路中央的第三天，一支綿延半里的駱駝與改裝車商隊經過。{party}把破車折價換成兩袋乾糧，從此跟著商隊在各大佔領區之間跑起長途生意。",
     "（主角光環沒了不要緊，至少跟著商隊每天有熱湯喝，比自己盲目亂開靠譜多了。）",
     "sunset", "desert", "caravan", "#f4a261", "dust"),
    ("stranded", "廢墟裡的無線電幽靈",
     "沒能繼續向東的{hero}爬上附近廢棄的轉播塔，靠太陽能板搭起一間小小電台。每天傍晚，公路上的司機都會聽到一個自稱「半路拋錨者」的毒舌DJ在報路況。",
     "（等等，該不會一路上那些亂報新聞又播怪廣告的末日電台，全都是以前拋錨在半路的前輩開的吧？！）",
     "twilight", "ruin", "radio_tower", "#8ecae6", "stars"),
    ("stranded", "沙漠仙人掌農夫",
     "車子再也發不動的那天，{party}在路邊發現一口半乾的舊水井。{hero}乾脆卸下行囊學著種起耐旱仙人掌與甜瓜，過上了離{paradise}很遠、卻意外平靜的日子。",
     "（早知道種仙人掌也能活得這麼滋潤，當初何必花那麼多廢料幫那台破車換裝甲呢。）",
     "noon", "desert", "cactus_farm", "#81b29a", "sun"),
    ("stranded", "峽谷吊橋的收費員",
     "在油箱徹底見底的峽谷旁，{party}修好了一座搖搖欲墜的舊木橋。往後路過的旅人只要給半罐油或兩根螺絲就能安全通行，{hero}就這樣成了峽谷最有信用的人。",
     "（此山是我開，此橋是我修——不過{hero}收費還算公道，比那些路邊攔路打劫的強盜體面多了。）",
     "sunset", "canyon", "toll_bridge", "#d5b176", "dust"),
    ("stranded", "把破車改建成兩房一廳",
     "既然哪裡也去不了，{party}索性用廢鐵皮與舊帆布把報廢座駕擴建成一棟歪歪扭扭的兩層小屋。門牌上還倔強地寫著「距離{paradise}只差一點點」。",
     "（違章建築蓋在廢土上最大的好處，就是絕對不會有建管處的人來貼拆除通知單。）",
     "dusk", "desert", "scrap_house", "#e07a5f", "lanterns"),
    ("stranded", "廢土地下修車黑市",
     "{hero}把拋錨車上的可用零件一一拆解，在高速公路高架橋下擺起了流動修車攤。因為手藝過於熟練，半年後連外星巡邏隊的後勤兵都會偷偷跑來請他換輪胎。",
     "（連敵軍都變成老主顧了，我看{hero}乾脆別去什麼樂園了，就在橋下把分店開滿全國吧。）",
     "twilight", "ruin", "underpass", "#f4a261", "sparks"),
    ("stranded", "跟變異野狗群和解",
     "斷油受困的第七天，原本虎視眈眈的變異犬群居然因為{hero}分出去的半塊肉乾而坐下來搖尾巴。{party}從此成了這片荒原上唯一沒人敢招惹的馴犬部落。",
     "（沒到達樂園，卻意外收編了一支百犬軍團——下次誰敢在這條路上攔劫，大概會先被舔到懷疑人生。）",
     "sunset", "desert", "hound_camp", "#e9c46a", "dust"),
    ("stranded", "舊加油站的夜間守望者",
     "{party}搬進一座早就抽不出油的老加油站，靠著收集雨水與替過路車隊指路換取物資。每個深夜，霓虹燈殘存的那半個「E」字依然固執地替東行者指方向。",
     "（自己開不到東邊，卻替後來的人把路燈點亮——我承認，這句話讓我寫的時候鼻頭有點酸。）",
     "night", "desert", "gas_station", "#f4a261", "stars"),
    ("stranded", "荒野古生物化石獵人",
     "在等待救援的無聊日子裡，{hero}拿鐵撬在路旁岩壁敲出一整具史前巨獸化石。沒多久，各路怪人學者紛紛帶著罐頭上門參觀，破車旁竟長出一座迷你自然史博物館。",
     "（開往樂園失敗，結果轉行當起考古權威——命運這本劇本果然連我都猜不透。）",
     "noon", "canyon", "fossil", "#d5b176", "dust"),
    ("stranded", "半路轉頭往西走",
     "盯著徹底報廢的引擎看了半小時後，{hero}突然大笑一聲，背起背包朝著來時的西方邁開大步。既然東邊的門暫時進不去，不如回去把當年沒說完的再見補齊。",
     "（書名明明叫《一路向東》，你最後居然給我掉頭往西走！編輯看到這頁絕對會氣到吐血。）",
     "sunset", "desert", "westward", "#e76f51", "clouds"),
    ("stranded", "被外星觀光艇誤當景點",
     "{party}把報廢車塗成鮮豔螢光色當作求救信號，不料引來幾艘愛看熱鬧的外星觀光飛艇。對方每天定時空投乾淨罐頭，只為了拍他們在沙漠裡生火煮泡麵的畫面。",
     "（堂堂末日旅人淪為宇宙級實境秀主角，不過看在對方空投的是高級牛肉罐頭的份上，這波不虧。）",
     "alien", "desert", "ufo_tour", "#c77dff", "stars"),
    ("stranded", "鹽湖邊的風帆滑車手",
     "沒有汽油又怎樣？{hero}拆下報廢車的輪子與帳篷布，拼出三輛靠風力奔馳的鹽湖滑車。雖然爬不上往{paradise}的陡坡，卻在無邊白鹽上跑出了前所未有的自由。",
     "（沒油就改用風帆，人類為了不想走路真是什麼怪點子都想得出來。）",
     "noon", "salt", "land_yacht", "#90e0ef", "clouds"),
    ("stranded", "地鐵廢站裡的蘑菇公社",
     "為了躲避沙塵暴，{party}棄車躲進一處地下車站，意外加入住在裡頭的友善蘑菇農民公社。頭頂是外星人的世界，腳下卻有著溫暖的菇湯與永遠熄不滅的營火。",
     "（雖然離藍海樂園差了十萬八千里，但至少不用再付停車費，也不用被砂石刮臉了。）",
     "twilight", "ruin", "subway", "#64dfdf", "spores"),
    ("stranded", "荒漠觀星隱士",
     "車子徹底沉進流沙後，{hero}搬進山壁上的天然岩洞，用撿來的鏡片自製望遠鏡。往後十年，路過商隊口中都流傳著一位能靠星象預知外星掃描路線的怪老頭。",
     "（別人是開到樂園成傳說，{hero}是拋錨到變仙人，也算另類修成正果。）",
     "night", "canyon", "hermit", "#8ecae6", "stars"),
    ("stranded", "廢棄遊樂園的維修工",
     "{party}把破車推到路旁一座荒廢的摩天輪下，乾脆住進售票亭。閒來無事便把旋轉木馬接上手搖發電機，成了荒原裡唯一一個晚上會亮起暖黃燈光的地方。",
     "（荒野裡突然傳來走音的旋轉木馬音樂，雖然有點像恐怖片開場，但實際上裡面只住著幾個沒油的可憐旅人。）",
     "dusk", "ruin", "ferris", "#f4a261", "lanterns"),
    ("stranded", "把遺憾寄給下一輛車",
     "明知這台車再也到不了{paradise}，{hero}在車門上仔細寫下沿途所有暗坑與補給點，把剩下的地圖與工具掛在後照鏡上，自己則帶著同伴步行前往最近的綠洲聚落。",
     "（把攻略本留給下一位玩家，{hero}你這種前人種樹的精神，值得我在片尾名單給你加粗字體。）",
     "dawn", "desert", "note_car", "#d5b176", "clouds"),
    ("stranded", "廢土牌局傳奇莊家",
     "在路邊小鎮等零件一等就是三年，{hero}靠著一副缺了紅心七的撲克牌成了鎮上酒館最受歡迎的莊家。偶爾喝醉時，還是會指著門外生鏽的破車說「那台當年差點就到樂園了」。",
     "（每家末日酒館裡好像都需要這麼一個吹噓當年勇的老司機，恭喜{hero}正式接班。）",
     "dusk", "ruin", "saloon", "#e76f51", "lanterns"),
    ("stranded", "在半路遇見真正想留下的理由",
     "沒能開進{paradise}的{party}在無名河谷停了下來，幫忙重建一場風暴後的聚落。多年後有人問起東邊的樂園，{hero}望著炊煙裊裊的屋頂笑道：「這裡其實就挺好的。」",
     "（好啦，我承認這結局挺治癒的——原來樂園不一定在地圖最東邊，有時候引擎熄火的地方就是家。）",
     "dawn", "meadow", "valley_home", "#9ad1c2", "clouds"),

    # ==================== 20 DEATH ENDINGS (081-100) ====================
    ("death", "無名公路紀念碑",
     "路過的商隊在荒路旁發現了早已冷卻的座駕，將{party}安葬在面朝東方的小土丘上，並用扭曲的車頭保險桿立起一座無名碑。每當東風吹過，鐵片仍會發出輕微鳴響。",
     "（連個像樣的墓誌銘都沒來得及刻，只好由我這個作者在書頁空白處補寫一句：「此處長眠著一位差點就能看到結局的倒楣鬼」。）",
     "dusk", "desert", "memorial", "#d5b176", "dust"),
    ("death", "成為外星自然史館展品",
     "全軍覆沒的隔天，外星巡邏艇將{hero}的破車與背包整套打包運回軌道母艦，標上「佔領區原生遷徙生物樣本 #404」放進玻璃展示櫃，每天供外星小學生隔著玻璃指指點點。",
     "（生前沒出名，死後居然當上了外星博物館的鎮館標本——{hero}你這輩子也算另類衝出地球了。）",
     "alien", "crater", "alien_case", "#9d4edd", "stars"),
    ("death", "被拾荒者繼承的破車",
     "風沙掩埋了{party}的足跡三週後，一名年輕拾荒者修好了這輛滿身彈孔的車，在手套箱裡讀完了{hero}的日記，擦乾眼淚坐上駕駛座，替他們繼續踩下往東的油門。",
     "（主角領完便當，結果裝備跟車子全被路人免費繼承——這就是末日最殘酷也最溫柔的接力賽。）",
     "dawn", "desert", "heir_car", "#f4a261", "dust"),
    ("death", "電台DJ的三秒鐘悼念",
     "不知從哪裡聽說了{hero}客死半路的消息，那個總愛胡說八道的末日電台DJ破天荒收起笑聲，替{party}放了半首刮花的鋼琴曲，接著馬上插播了一則防水棺材特賣廣告。",
     "（連悼念詞都能順便接業配廣告，看來我把末日電台的節操寫得還是太高估他們了。）",
     "twilight", "ruin", "radio_grave", "#8ecae6", "rain"),
    ("death", "長滿發光蘑菇的車骸",
     "多年以後，那輛永遠停在半路的車廂裡長出了成片散發淡藍微光的變異菌菇。夜裡經過的迷途旅人總會借這抹幽光辨認方向，卻沒人知道底下曾載過誰的夢想。",
     "（人沒走到終點，屍骨跟破車倒是成了免費路燈——這算不算一種環保永續的悲劇美學？）",
     "night", "forest", "spore_wreck", "#64dfdf", "spores"),
    ("death", "禿鷹與鏽鐵的午後",
     "烈日炙烤著沉默的柏油路，幾隻變異禿鷹停在歪斜的後照鏡上打盹。{hero}懷裡那張寫著{paradise}方向的皺巴巴地圖，被一陣熱風捲起，越飄越遠，最終消失在東邊地平線。",
     "（人死在半路，結果地圖自己隨風先到了東方——真是全書最諷刺的嘲笑。）",
     "noon", "desert", "vulture", "#e76f51", "dust"),
    ("death", "被寫進路邊酒館的警世笑話",
     "往後幾年，西邊的旅人們在酒館喝酒時總會提起{hero}的蠢事：「千萬別像那個傢伙一樣，血條見底還硬要往前衝！」大家笑完之後，卻還是默默舉杯敬了東方一口。",
     "（能死到成為全公路的反面教材，也算變相名留青史了。下次開局記得多帶兩份藥品好嗎！）",
     "dusk", "ruin", "tavern_toast", "#f4a261", "lanterns"),
    ("death", "暴雨沖刷過的輪胎印",
     "一場罕見的傾盆酸雨在{party}倒下後整整下了三天。當雲層終於散去，泥地上的車轍與血跡全都被沖得一乾二淨，彷彿這趟向東的旅程從來只是一場沒有證人的夢。",
     "（連一點痕跡都沒留下，害我這個作者看著空蕩蕩的泥巴地，突然覺得剛才寫的那幾千字全白忙了。）",
     "storm", "ruin", "rain_road", "#6c757d", "rain"),
    ("death", "機器鳥守著熄火的引擎",
     "一隻不知從哪裡飛來的老舊偵察機械鳥停在{hero}的車頂，反覆播放著早已失真的「系統正常、歡迎登車」提示音，直到電池在某個寒冬徹底耗盡。",
     "（連台破機器都比{hero}還會撐場面，至少人家撐到冬天才斷電。）",
     "storm", "snow", "robo_bird", "#8ecae6", "snow"),
    ("death", "半頁未完的旅途手記",
     "幾年後有旅人在車廂地板撿到{hero}被風吹散的筆記本，最後一頁只寫到一半便被暗紅污漬蓋住。沒人知道最後究竟發生了什麼，只知道他們曾拼命想往東看一眼。",
     "（我知道發生了什麼，但我不想說——反正絕對跟某人低估敵人火力脫不了關係。）",
     "twilight", "desert", "open_book", "#d5b176", "dust"),
    ("death", "沙丘吞沒的最後一哩",
     "連綿的沙暴緩緩推平了這段公路，把{party}與座駕溫柔地封存在金黃沙丘之下。也許一千年後會有人挖出這台破車，驚嘆十年前的人類居然敢開這種鐵盒挑戰世界。",
     "（一千年後的考古學家大概會把這台破車命名為「早期自殺式自駕工具」，希望{hero}在天之靈別生氣。）",
     "sunset", "desert", "buried_car", "#e9c46a", "dust"),
    ("death", "倒在終點大門前的身影",
     "最殘忍的是，從{party}倒下的山坡抬頭望去，其實已經隱約能看見{paradise}那抹遙遠的海色。他們走完了幾乎全部的苦路，卻只差最後一口氣就能推開門。",
     "（這大概是全書最讓人拳頭硬起來的死法了……我都替{hero}覺得虧，乾脆立刻重開一局報仇吧！）",
     "dawn", "coast", "distant_gate", "#f4a261", "clouds"),
    ("death", "外星掃描柱下的靜默",
     "高空的琥珀色掃描光柱緩緩掠過靜止的車殼，確認再也沒有任何生命訊號後便漠然離去。荒原重新歸於死寂，只剩收音機裡還卡著半句沒播完的防曬乳廣告。",
     "（人都沒了，收音機居然還在推銷防曬乳——這大概是末日最沒人性的黑色喜劇。）",
     "alien", "crater", "scan_beam", "#f4a261", "stars"),
    ("death", "野花開滿的方向盤",
     "隔年春天，一株頑強的野牽牛從碎裂的擋風玻璃縫隙鑽出來，把生鏽的方向盤纏得滿滿當當。{party}沒能抵達開滿鮮花的樂園，春天卻自己跑來覆蓋了他們。",
     "（算了，這畫面美得我連吐槽都說不出口。晚安了，{hero}，這趟車開得夠累的了。）",
     "dawn", "meadow", "flower_wheel", "#e88da3", "petals"),
    ("death", "被雪封存的向東雕像",
     "一場突如其來的寒潮將這段荒路凍成銀白世界。覆滿白霜的座駕靜靜停在路中央，車燈彷彿還凝視著東方，成了一座永遠不會融化的冰冷路標。",
     "（開著沒暖氣的破車衝進暴風雪，這結果老實說並不意外，但我還是替{party}披上一句文字毛毯吧。）",
     "storm", "snow", "frozen_car", "#a8dadc", "snow"),
    ("death", "海市蜃樓裡的幻影樂園",
     "在意識模糊的最後一秒，{hero}彷彿真的聽見了{paradise}的海浪聲與笑聲，甚至覺得引擎又奇蹟般發動了。事實上，那只是正午沙漠裡晃動的一片熱浪。",
     "（至少在最後三秒鐘裡，{hero}以為自己真的贏了——這種善意的幻覺，也算老天爺最後的一點慈悲吧。）",
     "noon", "desert", "mirage", "#90e0ef", "sun"),
    ("death", "散落公路的舊照片",
     "強風掀開了破碎的後車廂，十幾張褪色的舊時代照片與旅途剪影在荒原上翻滾飛舞，最後掛在遠處的鐵絲網上。那是{party}曾經存在於這個世界的最後證明。",
     "（每一張飛走的照片都是我精心寫好的伏筆耶！全滅害我的伏筆全都隨風飄散了！）",
     "sunset", "ruin", "photos", "#d5b176", "dust"),
    ("death", "野營火堆旁的最後一晚",
     "沒能撐過那個酷寒的夜晚，營火的餘燼在黎明前徹底熄滅。{party}靠在彼此肩上睡著了，再也沒有醒來面對明天那條永無止盡的破爛公路。",
     "（這本書在這裡被迫提早收尾。別難過，把眼淚擦一擦，下一輪我一定多塞兩罐藥品在路邊草叢裡。）",
     "night", "canyon", "dead_fire", "#6c757d", "stars"),
    ("death", "成為傳說中的幽靈破車",
     "自從{party}消逝在迷霧路段後，常有夜行司機發誓看見一輛開著遠光燈、滿身焊痕的破車與自己擦肩而過，車窗裡還傳出模糊的廣播笑聲，轉眼卻不見蹤影。",
     "（死了都不肯放棄繼續往東開，{hero}你這執念簡直比我拖稿的毅力還要驚人！）",
     "night", "ruin", "ghost_car", "#72efdd", "spores"),
    ("death", "作者被迫撕掉大綱重寫",
     "隨著最後一名同伴倒下，這輛向東的車徹底靜止在無邊荒野中。遠方的{paradise}依舊在海風裡沉睡，等待著下一個比{hero}更命硬、也更懂得及時踩煞車的旅人。",
     "（好了，全劇終！我現在要去倒杯咖啡、把這疊寫壞的草稿揉成紙球，等你按下「翻開下一本旅程」，我們再重新換個倒楣鬼發車！）",
     "twilight", "desert", "crumpled_page", "#e63946", "stars"),
]

assert len(RAW_ENDINGS) == 100, f"Expected 100 endings, got {len(RAW_ENDINGS)}"
assert sum(1 for e in RAW_ENDINGS if e[0] == "win") == 60
assert sum(1 for e in RAW_ENDINGS if e[0] == "stranded") == 20
assert sum(1 for e in RAW_ENDINGS if e[0] == "death") == 20
assert len({e[1] for e in RAW_ENDINGS}) == 100, "Duplicate ending titles!"

# ==================== 16-BIT PIXEL ART SVG RENDERER (256x112) ====================
SKIES = {
    "dawn":     ["#273452", "#475171", "#8d6a6c", "#d6946b", "#efc189"],
    "noon":     ["#2d5b88", "#4881b0", "#6da6cc", "#9bc6dd", "#c6dfea"],
    "sunset":   ["#242442", "#513558", "#94485c", "#d06d55", "#f0a967"],
    "dusk":     ["#181f38", "#2d3559", "#51486f", "#815c74", "#b57a74"],
    "twilight": ["#101829", "#1c2842", "#2c3c5c", "#3e5375", "#5a6e8d"],
    "night":    ["#0a0f1d", "#111a2e", "#192640", "#223352", "#2d4266"],
    "aurora":   ["#0c1424", "#12243b", "#184152", "#2d7a78", "#59b59e"],
    "alien":    ["#170f29", "#2a1b47", "#462866", "#6c3980", "#955499"],
    "storm":    ["#1b222c", "#2b3542", "#3e4b5b", "#556475", "#718192"],
}

GROUNDS = {
    "coast":   ("#284c68", "#3b6c8c", "#c8b288", "#a48e66"),
    "meadow":  ("#375a42", "#4c7853", "#679160", "#2c4635"),
    "harbor":  ("#203a52", "#2e516e", "#5b554e", "#3d3833"),
    "crater":  ("#362b40", "#4b3c57", "#645170", "#271f2e"),
    "hill":    ("#3b5245", "#516e59", "#6d8a6f", "#2c3e34"),
    "canyon":  ("#693b2e", "#8a4f3b", "#ad6a4c", "#4d2a21"),
    "forest":  ("#1d332d", "#2a493e", "#3b6150", "#14241f"),
    "snow":    ("#8da5ba", "#b2c7d9", "#d6e4ef", "#667d91"),
    "salt":    ("#9fb0bd", "#c2d0da", "#e1e9ef", "#7b8d9c"),
    "desert":  ("#8c5e3c", "#b07b4f", "#cfa06e", "#6b452b"),
    "ruin":    ("#3a3b42", "#51525c", "#6b6c75", "#292a30"),
}

def rect(x, y, w, h, fill, op=None):
    if op is not None:
        return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}" fill-opacity="{op}"/>'
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}"/>'

def draw_car(out, cx, cy, body="#c97b4b", broken=False, flowers=False, spores=False, ghost=False):
    op = "0.55" if ghost else None
    # shadow
    out.append(rect(cx - 2, cy + 12, 42, 3, "#141821", "0.55"))
    # body
    tilt = 2 if broken else 0
    out.append(rect(cx, cy + 4 + tilt, 38, 8, body, op))
    out.append(rect(cx + 6, cy + tilt, 22, 6, body, op))
    # windows
    win = "#7ce2d4" if ghost else "#243447"
    out.append(rect(cx + 8, cy + 1 + tilt, 8, 4, win, op))
    out.append(rect(cx + 18, cy + 1 + tilt, 8, 4, win, op))
    # bumper & lights
    out.append(rect(cx + 36, cy + 6 + tilt, 3, 3, "#f4d35e", op))
    out.append(rect(cx - 1, cy + 7 + tilt, 3, 3, "#d65a4f", op))
    # wheels
    out.append(rect(cx + 5, cy + 10, 7, 5, "#191c24", op))
    out.append(rect(cx + 7, cy + 12, 3, 2, "#8c939e", op))
    out.append(rect(cx + 25, cy + 10, 7, 5, "#191c24", op))
    out.append(rect(cx + 27, cy + 12, 3, 2, "#8c939e", op))
    if flowers:
        for fx, fy, fc in [(cx+4,cy-2,"#f4c95d"),(cx+12,cy-4,"#e88da3"),(cx+22,cy-3,"#f4c95d"),(cx+30,cy+1,"#81b29a"),(cx+16,cy-2,"#81b29a")]:
            out.append(rect(fx, fy, 4, 4, fc))
    if spores:
        for sx, sy in [(cx+6,cy-3),(cx+14,cy-5),(cx+24,cy-4),(cx+31,cy+1)]:
            out.append(rect(sx+1, sy+3, 2, 4, "#3b6150"))
            out.append(rect(sx, sy, 4, 3, "#64dfdf"))

def draw_person(out, px, py, coat="#d5b176", hat=False):
    out.append(rect(px, py + 9, 4, 5, "#1f2430"))
    out.append(rect(px, py + 4, 4, 5, coat))
    out.append(rect(px + 1, py + 1, 3, 3, "#eac096"))
    if hat:
        out.append(rect(px, py, 5, 1, "#5c4033"))

def draw_subject(out, subj, acc, seed):
    """Draw a rich, recognizable 16-bit pixel-art centerpiece on the 256x112 canvas."""
    # Ground horizon is y=72
    if subj in ("garage", "workshop", "printshop", "bakery", "clinic", "antique", "vinyl", "roadside_inn", "scrap_house", "saloon", "foodtruck"):
        bx = 104 + (seed % 18) - 9
        out.append(rect(bx, 42, 76, 34, "#4b4540"))
        out.append(rect(bx - 4, 38, 84, 6, "#2c313d"))
        out.append(rect(bx + 6, 48, 28, 28, "#232833"))  # bay/door
        out.append(rect(bx + 42, 48, 24, 14, acc))        # glowing window
        out.append(rect(bx + 44, 50, 20, 10, "#f5dfa6"))
        out.append(rect(bx + 10, 32, 56, 6, acc))         # sign board
        if subj in ("bakery", "clinic", "foodtruck"):
            for i in range(0, 72, 8):
                out.append(rect(bx + 2 + i, 44, 4, 4, "#f4f1de" if i % 16 == 0 else acc))
        draw_car(out, bx - 52, 66, body=acc, broken=(subj in ("roadside_inn", "scrap_house")))
        draw_person(out, bx + 20, 64, coat=acc)
    elif subj in ("lighthouse", "clocktower", "radio_tower", "radio_grave", "radar"):
        tx = 152 + (seed % 16) - 8
        if subj in ("radio_tower", "radio_grave"):
            out.append(rect(tx + 8, 18, 4, 58, "#5c6473"))
            for y in range(26, 74, 8):
                w = 8 + (y - 26) // 3
                out.append(rect(tx + 10 - w // 2, y, w, 2, "#7f8999"))
            out.append(rect(tx + 7, 14, 6, 4, acc))
            out.append(rect(tx + 3, 12, 14, 2, acc, "0.45"))
        else:
            out.append(rect(tx, 26, 22, 50, "#d8d4c8"))
            for y in range(34, 72, 12):
                out.append(rect(tx, y, 22, 5, "#b84a39" if subj == "lighthouse" else "#4b5563"))
            out.append(rect(tx - 2, 22, 26, 5, "#2b303a"))
            out.append(rect(tx + 4, 14, 14, 8, acc))
            out.append(rect(tx + 2, 11, 18, 4, "#2b303a"))
            # light beam
            out.append(rect(tx - 80, 14, 82, 6, acc, "0.25"))
            out.append(rect(tx + 18, 15, 76, 5, acc, "0.22"))
        if subj == "radio_grave":
            draw_car(out, 66, 68, body="#6c757d", broken=True)
        else:
            draw_car(out, 54, 68, body=acc)
            draw_person(out, 108, 66, coat="#e9c46a")
    elif subj in ("greenhouse", "observatory", "vault", "museum", "alien_case"):
        gx = 96
        out.append(rect(gx, 46, 84, 30, "#2f3d4c"))
        out.append(rect(gx + 8, 34, 68, 14, "#4b6b82"))
        out.append(rect(gx + 20, 26, 44, 10, "#6d94ad"))
        for x in range(gx + 12, gx + 76, 12):
            out.append(rect(x, 34, 2, 42, "#d8e2dc", "0.55"))
        if subj == "greenhouse":
            for x in range(gx + 8, gx + 76, 10):
                out.append(rect(x, 58, 6, 14, "#40916c"))
                out.append(rect(x + 2, 60, 2, 2, "#e06d53"))
        elif subj == "alien_case":
            out.append(rect(gx + 16, 40, 52, 30, "#9d4edd", "0.28"))
            draw_car(out, gx + 22, 56, body="#c97b4b", broken=True)
        elif subj == "observatory":
            out.append(rect(gx + 54, 16, 18, 6, "#d8e2dc"))
        else:
            draw_car(out, gx + 22, 58, body=acc)
        draw_person(out, gx - 20, 64, coat=acc)
    elif subj in ("shuttle", "ufo_tour", "scan_beam"):
        sx = 112
        if subj == "shuttle":
            out.append(rect(sx + 10, 32, 42, 16, "#cfd8dc"))
            out.append(rect(sx + 2, 42, 58, 10, "#90a4ae"))
            out.append(rect(sx + 22, 26, 18, 8, acc))
            out.append(rect(sx + 12, 52, 6, 12, "#455a64"))
            out.append(rect(sx + 44, 52, 6, 12, "#455a64"))
            out.append(rect(sx + 24, 52, 14, 18, acc, "0.45"))
            draw_person(out, sx - 18, 64, coat="#f4a261")
        else:
            # hovering alien craft + beam
            out.append(rect(sx, 20, 48, 8, "#6c757d"))
            out.append(rect(sx + 12, 14, 24, 6, acc))
            out.append(rect(sx + 10, 28, 28, 48, acc, "0.28"))
            out.append(rect(sx + 16, 28, 16, 48, "#ffffff", "0.18"))
            draw_car(out, sx + 4, 66, body="#8d6a6c", broken=(subj == "scan_beam"))
    elif subj in ("market", "floating", "pier", "shipyard", "harbor", "stage", "cinema", "teahouse", "cliff_cafe", "alien_cafe"):
        # boardwalk / stalls / lantern string
        out.append(rect(24, 72, 208, 6, "#5c4738"))
        for i, bx in enumerate((48, 106, 164)):
            out.append(rect(bx, 46, 42, 26, "#3b3532"))
            out.append(rect(bx - 3, 42, 48, 6, acc if i % 2 == 0 else "#d65a4f"))
            out.append(rect(bx + 6, 52, 30, 10, "#f2d08a" if subj != "cinema" else "#e0fbfc"))
        if subj == "cinema":
            out.append(rect(84, 22, 92, 38, "#eef4ed"))
            out.append(rect(88, 26, 84, 30, "#243447"))
            out.append(rect(114, 34, 32, 14, acc))
            draw_car(out, 52, 72, body="#d65a4f")
            draw_car(out, 152, 72, body="#4895ef")
        else:
            draw_person(out, 88, 64, coat=acc)
            draw_person(out, 146, 64, coat="#8bbfb0")
    elif subj in ("windmill", "kites", "balloon"):
        if subj == "windmill":
            for wx in (76, 134, 192):
                out.append(rect(wx, 34, 4, 42, "#d8e2dc"))
                out.append(rect(wx - 12, 32, 28, 3, acc))
                out.append(rect(wx + 1, 20, 3, 28, acc))
        elif subj == "balloon":
            for bx, by, bc in [(92, 16, acc), (162, 26, "#f4a261")]:
                out.append(rect(bx + 6, by, 18, 22, bc))
                out.append(rect(bx + 2, by + 4, 26, 14, bc))
                out.append(rect(bx + 10, by + 4, 10, 14, "#f4f1de"))
                out.append(rect(bx + 11, by + 26, 8, 6, "#6c4f3d"))
                out.append(rect(bx + 12, by + 22, 1, 4, "#ccc"))
                out.append(rect(bx + 17, by + 22, 1, 4, "#ccc"))
        else:
            for kx, ky, kc in [(74, 22, acc), (128, 16, "#f4c95d"), (178, 28, "#72efdd")]:
                out.append(rect(kx, ky, 10, 10, kc))
                out.append(rect(kx + 4, ky + 10, 2, 18, "#f4f1de", "0.6"))
        draw_car(out, 46, 70, body="#c97b4b")
        draw_person(out, 118, 66, coat=acc)
    elif subj in ("car_garden", "flower_wheel", "spore_wreck", "buried_car", "frozen_car", "note_car", "heir_car", "ghost_car", "sleeping_car", "car_library"):
        draw_car(
            out, 106, 64 if subj != "buried_car" else 70,
            body="#8da5ba" if subj == "frozen_car" else acc,
            broken=(subj in ("spore_wreck", "buried_car", "frozen_car", "note_car")),
            flowers=(subj in ("car_garden", "flower_wheel")),
            spores=(subj == "spore_wreck"),
            ghost=(subj == "ghost_car"),
        )
        if subj == "buried_car":
            out.append(rect(86, 74, 90, 14, "#cfa06e"))
            out.append(rect(98, 70, 62, 6, "#b07b4f"))
        if subj == "sleeping_car":
            out.append(rect(120, 50, 8, 2, "#f4f1de"))
            out.append(rect(130, 44, 6, 2, "#f4f1de"))
        if subj in ("heir_car", "note_car", "car_library"):
            draw_person(out, 86, 66, coat="#d5b176")
    elif subj in ("sailboat", "whale", "submarine", "cat_island", "salt_flat", "land_yacht"):
        # water shimmer
        for y in range(74, 104, 6):
            out.append(rect(12 + (y * 7) % 40, y, 56, 2, "#ffffff", "0.22"))
        if subj == "sailboat" or subj == "land_yacht":
            out.append(rect(112, 64, 44, 10, "#6c4f3d"))
            out.append(rect(132, 28, 3, 36, "#d8d4c8"))
            out.append(rect(135, 30, 22, 28, "#f4f1de"))
            out.append(rect(116, 36, 16, 22, acc))
        elif subj == "whale":
            out.append(rect(86, 62, 66, 14, "#264653"))
            out.append(rect(148, 54, 14, 10, "#264653"))
            out.append(rect(100, 46, 4, 16, "#a8dadc", "0.7"))
            out.append(rect(94, 44, 16, 4, "#a8dadc", "0.5"))
        elif subj == "submarine":
            out.append(rect(76, 56, 104, 18, "#354f52"))
            out.append(rect(118, 42, 22, 14, "#2f3e46"))
            for wx in range(88, 168, 16):
                out.append(rect(wx, 62, 6, 6, "#f4d35e"))
        else:
            # island / cats / salt pools
            out.append(rect(84, 64, 88, 14, "#8d7b68"))
            out.append(rect(96, 56, 64, 10, "#a4907c"))
            for cx in (104, 118, 134, 146):
                out.append(rect(cx, 52, 6, 4, "#2b2d42" if cx % 4 == 0 else "#f4a261"))
                out.append(rect(cx, 50, 2, 2, "#2b2d42" if cx % 4 == 0 else "#f4a261"))
    elif subj in ("train", "bus_stop", "convoy", "caravan", "racetrack", "bicycles"):
        # track / road stripe
        out.append(rect(0, 82, 256, 14, "#343a40"))
        for x in range(8, 256, 24):
            out.append(rect(x, 88, 12, 2, "#f4d35e"))
        if subj == "train":
            out.append(rect(44, 52, 168, 24, acc))
            out.append(rect(44, 50, 168, 4, "#2b303a"))
            for wx in range(54, 200, 22):
                out.append(rect(wx, 58, 14, 8, "#f5dfa6"))
        elif subj == "bicycles":
            for bx in (72, 118, 164):
                out.append(rect(bx, 68, 8, 8, "#1b263b"))
                out.append(rect(bx + 16, 68, 8, 8, "#1b263b"))
                out.append(rect(bx + 4, 64, 16, 3, acc))
                out.append(rect(bx + 10, 58, 3, 10, acc))
        else:
            draw_car(out, 44, 68, body=acc)
            draw_car(out, 118, 68, body="#4895ef")
            draw_car(out, 186, 68, body="#e9c46a")
    elif subj in ("bridge", "toll_bridge", "archway", "distant_gate", "underpass"):
        # pillars + span
        out.append(rect(0, 54, 256, 6, "#5c6473"))
        out.append(rect(44, 24, 10, 56, "#495057"))
        out.append(rect(202, 24, 10, 56, "#495057"))
        for x in range(54, 202, 12):
            h = abs(128 - x) // 4 + 6
            out.append(rect(x, 54 - h, 2, h, acc))
        if subj == "distant_gate":
            out.append(rect(108, 42, 40, 32, acc, "0.35"))
            draw_car(out, 46, 72, body="#6c757d", broken=True)
        else:
            draw_car(out, 108, 44 if subj != "underpass" else 70, body=acc)
    elif subj in ("mushroom", "orchard", "cactus_farm", "subway"):
        if subj == "mushroom" or subj == "subway":
            for mx, mw, mh in [(56, 26, 26), (112, 36, 34), (176, 28, 28)]:
                out.append(rect(mx + mw // 2 - 4, 76 - mh, 8, mh, "#d8e2dc"))
                out.append(rect(mx, 76 - mh - 10, mw, 12, acc))
                out.append(rect(mx + 4, 76 - mh - 14, mw - 8, 6, acc))
                out.append(rect(mx + 6, 76 - mh - 8, 4, 4, "#ffffff", "0.65"))
        else:
            for tx in range(42, 220, 32):
                out.append(rect(tx + 6, 56, 5, 20, "#5c4033"))
                out.append(rect(tx, 40, 18, 18, "#40916c"))
                out.append(rect(tx + 4, 44, 3, 3, acc))
                out.append(rect(tx + 11, 48, 3, 3, acc))
        draw_person(out, 124, 66, coat="#d5b176")
    elif subj in ("cabin", "bathhouse", "hotspring", "valley_home", "school", "library", "courthouse", "dovecote", "brewery"):
        hx = 94
        out.append(rect(hx, 44, 68, 32, "#7f5539"))
        out.append(rect(hx - 6, 38, 80, 8, "#4a3326"))
        out.append(rect(hx + 8, 30, 52, 8, "#4a3326"))
        out.append(rect(hx + 48, 22, 8, 12, "#5c6473"))  # chimney
        out.append(rect(hx + 12, 52, 16, 12, "#f4d35e"))
        out.append(rect(hx + 40, 52, 16, 12, "#f4d35e"))
        out.append(rect(hx + 28, 56, 10, 20, "#3b281e"))
        if subj in ("bathhouse", "hotspring"):
            out.append(rect(34, 74, 72, 16, "#90e0ef", "0.75"))
            for sx in (48, 66, 84):
                out.append(rect(sx, 60, 4, 12, "#ffffff", "0.45"))
        draw_person(out, hx - 16, 64, coat=acc)
    elif subj in ("campfire", "dead_fire", "hound_camp", "hermit", "ferris"):
        if subj == "ferris":
            out.append(rect(124, 18, 4, 58, "#adb5bd"))
            out.append(rect(98, 24, 56, 4, acc))
            out.append(rect(98, 56, 56, 4, acc))
            out.append(rect(98, 24, 4, 36, acc))
            out.append(rect(150, 24, 4, 36, acc))
            for gx, gy in [(100,24),(148,24),(100,54),(148,54),(124,18)]:
                out.append(rect(gx, gy, 6, 6, "#f4d35e"))
        else:
            out.append(rect(118, 72, 20, 5, "#5c4033"))
            if subj != "dead_fire":
                out.append(rect(122, 62, 12, 10, "#f77f00"))
                out.append(rect(125, 56, 6, 12, "#f4d35e"))
            else:
                out.append(rect(124, 68, 8, 4, "#495057"))
                out.append(rect(126, 60, 3, 8, "#adb5bd", "0.45"))
            draw_car(out, 46, 68, body="#6c757d", broken=(subj == "dead_fire"))
            if subj != "dead_fire":
                draw_person(out, 148, 64, coat=acc)
    elif subj in ("memorial", "vulture", "rain_road", "robo_bird", "open_book", "mirage", "photos", "crumpled_page", "tavern_toast", "westward", "fossil", "gas_station"):
        # poignant / roadside tableau
        if subj == "memorial":
            out.append(rect(114, 64, 28, 12, "#6b452b"))
            out.append(rect(125, 42, 6, 26, "#8d99ae"))
            out.append(rect(117, 48, 22, 5, "#8d99ae"))
            draw_car(out, 42, 68, body="#5c6473", broken=True)
        elif subj == "gas_station":
            out.append(rect(72, 36, 112, 6, "#d65a4f"))
            out.append(rect(82, 42, 6, 34, "#ced4da"))
            out.append(rect(168, 42, 6, 34, "#ced4da"))
            out.append(rect(116, 54, 14, 22, acc))
            draw_car(out, 136, 66, body="#6c757d", broken=True)
        elif subj == "open_book" or subj == "crumpled_page" or subj == "photos":
            out.append(rect(92, 54, 34, 22, "#f4f1de"))
            out.append(rect(128, 54, 34, 22, "#e9e3cc"))
            for ly in (59, 64, 69):
                out.append(rect(96, ly, 24, 2, "#6c757d"))
                out.append(rect(132, ly, 22, 2, "#6c757d"))
            out.append(rect(138, 66, 10, 6, "#d65a4f", "0.7"))
        elif subj == "fossil":
            for rx in range(74, 184, 14):
                out.append(rect(rx, 46, 5, 28, "#e9e3cc"))
            out.append(rect(70, 56, 120, 6, "#d8d4c8"))
            draw_person(out, 52, 64, coat=acc)
        else:
            draw_car(out, 98, 66, body="#6c757d", broken=(subj != "westward"))
            if subj == "westward":
                draw_person(out, 56, 64, coat=acc, hat=True)
            if subj in ("vulture", "robo_bird"):
                out.append(rect(114, 58, 10, 6, "#2b2d42" if subj == "vulture" else "#8ecae6"))
                out.append(rect(122, 56, 4, 3, acc))
            if subj == "mirage":
                out.append(rect(86, 42, 84, 20, "#90e0ef", "0.32"))
                out.append(rect(116, 34, 24, 16, "#40916c", "0.35"))
    else:
        # desk, easel, compass, baseball, crystal, diplomacy
        out.append(rect(94, 48, 68, 28, "#3d405b"))
        out.append(rect(102, 54, 52, 16, acc))
        draw_person(out, 74, 64, coat=acc)
        draw_person(out, 174, 64, coat="#8bbfb0")


def build_svg(idx, ending):
    sky_key, ground_key, subj, acc, weather = ending["scene"].values()
    bands = SKIES[sky_key]
    g1, g2, g3, g4 = GROUNDS[ground_key]
    seed = int(hashlib.sha256(f"{ending['id']}:{ending['title']}".encode()).hexdigest()[:8], 16)

    out = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 112" shape-rendering="crispEdges">',
    ]
    # 1. Sky gradient bands
    for i, col in enumerate(bands):
        out.append(rect(0, i * 15, 256, 16, col))

    # 2. Celestial body (sun / moon / aurora / ringed planet)
    cx = 28 + (seed % 180)
    cy = 10 + ((seed >> 4) % 24)
    if sky_key in ("dawn", "noon", "sunset"):
        out.append(rect(cx, cy, 18, 18, "#f9e3a8"))
        out.append(rect(cx - 2, cy + 3, 22, 12, "#f9e3a8", "0.5"))
    elif sky_key in ("night", "twilight", "dusk"):
        out.append(rect(cx, cy, 12, 12, "#eef4ed"))
        out.append(rect(cx + 4, cy + 2, 8, 8, bands[0]))
    elif sky_key == "aurora":
        for i in range(6):
            ax = (i * 44 + (seed % 20)) % 240
            out.append(rect(ax, 8 + (i % 3) * 6, 36, 12, "#72efdd" if i % 2 == 0 else "#52b788", "0.35"))
    elif sky_key == "alien":
        out.append(rect(cx, cy, 20, 20, "#c77dff"))
        out.append(rect(cx - 8, cy + 8, 36, 4, "#e0aaff", "0.6"))

    # 3. Weather / sky particles
    if weather in ("stars", "spores", "fireflies"):
        for i in range(18):
            sx = (seed * (i + 3) * 17) % 252
            sy = (seed * (i + 5) * 11) % (62 if weather == "stars" else 96)
            col = "#f4f1de" if weather == "stars" else (acc if weather == "spores" else "#f4d35e")
            out.append(rect(sx, sy, 2, 2, col, "0.85"))
    elif weather in ("clouds", "seagulls"):
        for i in range(4):
            clx = (20 + i * 62 + (seed % 25)) % 220
            cly = 10 + (i % 2) * 14
            out.append(rect(clx, cly, 28, 6, "#ffffff", "0.28"))
            out.append(rect(clx + 6, cly - 4, 16, 4, "#ffffff", "0.24"))
        if weather == "seagulls":
            for i in range(4):
                bx = (40 + i * 48 + (seed % 19)) % 230
                by = 18 + (i % 3) * 8
                out.append(rect(bx, by, 3, 1, "#f4f1de"))
                out.append(rect(bx + 3, by + 1, 2, 1, "#f4f1de"))
                out.append(rect(bx + 5, by, 3, 1, "#f4f1de"))
    elif weather in ("rain", "snow", "dust", "petals"):
        col = {"rain": "#90e0ef", "snow": "#f8f9fa", "dust": "#e9c46a", "petals": "#ffb3c6"}[weather]
        h = 6 if weather == "rain" else 2
        w = 1 if weather == "rain" else 2
        for i in range(22):
            px = (seed * (i + 7) * 13) % 254
            py = (seed * (i + 2) * 19) % 102
            out.append(rect(px, py, w, h, col, "0.65"))

    # 4. Distant mountain / ridge silhouette (varied per ending seed)
    for i in range(16):
        mh = 6 + ((seed >> (i % 12)) + i * 5) % 16
        out.append(rect(i * 16, 72 - mh, 16, mh, g4))

    # 5. Ground layers
    out.append(rect(0, 72, 256, 12, g1))
    out.append(rect(0, 84, 256, 14, g2))
    out.append(rect(0, 98, 256, 14, g3))

    # 6. Centerpiece narrative subject
    draw_subject(out, subj, acc, seed)

    # 7. Subtle bottom-right ending index stamp (2px pixel bars unique per index)
    for bit in range(7):
        if (idx >> bit) & 1:
            out.append(rect(248 - bit * 3, 108, 2, 2, acc, "0.55"))

    # 8. Crisp frame border
    out.append('<rect x="0" y="0" width="256" height="112" fill="none" stroke="#141c29" stroke-width="2"/>')
    out.append("</svg>")
    return "\n".join(out)


def main():
    ART_DIR.mkdir(parents=True, exist_ok=True)
    endings = []
    digests = set()
    for i, (outcome, title, text, quip, sky, ground, subj, acc, weather) in enumerate(RAW_ENDINGS, start=1):
        eid = f"ending_{i:03d}"
        rel_img = f"endings/{eid}.svg"
        entry = {
            "id": eid,
            "roll": i,
            "outcome": outcome,
            "title": title,
            "text": text,
            "author_quip": quip,
            "image": rel_img,
            "scene": {
                "sky": sky,
                "ground": ground,
                "subject": subj,
                "accent": acc,
                "weather": weather,
            },
        }
        endings.append(entry)
        svg = build_svg(i, entry)
        digest = hashlib.sha256(svg.encode()).hexdigest()
        assert digest not in digests, f"Duplicate SVG digest at {eid}"
        digests.add(digest)
        (ART_DIR / f"{eid}.svg").write_text(svg, encoding="utf-8")

    payload = {
        "version": 1,
        "count": len(endings),
        "endings": endings,
    }
    SPEC_OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    total_kb = sum(p.stat().st_size for p in ART_DIR.glob("ending_*.svg")) / 1024
    print(f"Generated {len(endings)} endings in {SPEC_OUT.name} and 100 unique SVGs ({total_kb:.1f} KB total).")


if __name__ == "__main__":
    main()
