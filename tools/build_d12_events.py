#!/usr/bin/env python3
"""Build 12 event categories x 100 D100 situations = 1,200 unique road events."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SPEC_OUT = ROOT / "spec" / "d12-events.json"
DIST_OUT = ROOT / "dist" / "data" / "d12-events.json"

NPC_BINDING = {
    "npc": {
        "name": "npc_name",
        "nickname": "npc_nickname",
        "attitude": "npc_attitude",
        "race": "npc_race",
        "profession": "npc_profession",
        "flaw": "npc_flaw",
    }
}

def opt(oid, label, effects, result_text, requires=None):
    return {
        "id": oid,
        "label": label,
        "requires": requires or [],
        "effects": effects,
        "result_text": result_text,
    }

def check_eff(stat, difficulty, success, failure):
    return {
        "op": "event_check",
        "stat": stat,
        "difficulty": difficulty,
        "success": success,
        "failure": failure,
    }

# 12 Categories, each with 10 sub-archetypes x 10 concrete settings = 100 unique events
CATEGORIES = [
    {
        "d12": 1,
        "id": "cat_01",
        "name": "據點補給與交易",
        "desc": "公路沿線仍亮著燈火的加油站、雜貨鋪、診所、修車廠與廢土市集。",
        "archetypes": [
            {
                "artRef": "road_001", "building": True, "placeSuffix": "加油站", "npc": True, "polarity": "good",
                "places": ["紅鐵皮", "斜頂", "雙泵", "舊國道", "斷霓虹", "白線", "風蝕", "碎玻璃", "鏽桶", "高架下"],
                "noun": "加油站",
                "intro": "褪色的雨棚下還掛著手寫油價木牌，{place}加油站的地下儲槽顯然還存著戰前餘油，站主提著油管在陰影裡打量來車。",
                "options": lambda p: [
                    opt("service", "靠邊停車，詢問油價與補給", [{"op": "open_service", "service": "fuel_shop"}], f"{{party}}把車停進{p}加油站，準備和站主談一筆加油買賣。"),
                    opt("leave", "鳴笛致意，直接開過去", [], "{party}沒有停留，沿著公路繼續向東。"),
                ],
            },
            {
                "artRef": "road_003", "building": True, "placeSuffix": "雜貨店", "npc": True, "polarity": "good",
                "places": ["木板", "鐵門", "角樓", "貨櫃", "綠棚", "灰磚", "老郵局", "轉角", "鐵皮屋", "長廊"],
                "noun": "雜貨鋪",
                "intro": "{place}雜貨鋪的櫥窗用鐵網封了半邊，櫃檯後堆著罐頭、零件與乾糧，掌櫃正拿抹布擦拭著一盞煤油燈。",
                "options": lambda p: [
                    opt("service", "進門看看貨架上的物資", [{"op": "open_service", "service": "general_shop"}], f"{{party}}推開{p}雜貨鋪的門，木門上的銅鈴噹啷作響。"),
                    opt("leave", "暫不採買，繼續上路", [], "{party}記下這間店的位置，踩下油門離開。"),
                ],
            },
            {
                "artRef": "road_004", "building": True, "placeSuffix": "修車廠", "npc": True, "polarity": "good",
                "places": ["千斤頂", "齒輪", "機油漬", "雙柱", "鐵鍊", "焊花", "輪胎牆", "黑手", "高棚", "鋼架"],
                "noun": "修車廠",
                "intro": "{place}修車廠的捲門拉起一半，裡頭傳來氣動扳手與電焊聲，技師把護目鏡推到額頭上，朝這輛風塵僕僕的車招了招手。",
                "options": lambda p: [
                    opt("service", "把車開進維修區檢修改裝", [{"op": "open_service", "service": "garage"}], f"{{party}}將車緩緩駛入{p}修車廠，請技師檢視底盤與裝甲。"),
                    opt("leave", "車況還行，揮手道別", [], "{party}確認儀表板正常，轉向回到主幹道。"),
                ],
            },
            {
                "artRef": "road_005", "building": True, "placeSuffix": "藥房", "npc": True, "polarity": "good",
                "places": ["白十字", "玻璃瓶", "薄荷", "舊診間", "消毒水", "草藥", "鐵櫃", "藍燈", "廊道", "紅磚"],
                "noun": "藥品攤",
                "intro": "{place}藥品攤散發著濃烈的酒精與草藥味，攤主在帆布下整齊碼放著繃帶、抗生素與自製止痛粉。",
                "options": lambda p: [
                    opt("service", "上前查看藥品與急救包", [{"op": "open_service", "service": "pharmacy"}], f"{{party}}走近{p}藥品攤，挑選旅途上最救命的藥品。"),
                    opt("leave", "藥箱還夠，繼續趕路", [], "{party}點頭致意後回到車上。"),
                ],
            },
            {
                "artRef": "road_002", "building": True, "placeSuffix": "旅館", "npc": True, "polarity": "good",
                "places": ["缺字霓虹", "二樓陽台", "柏油庭院", "星光", "鐵梯", "舊汽車", "紅地毯", "走廊", "木窗", "守夜"],
                "noun": "路邊旅館",
                "intro": "{place}路邊旅館的外牆彈孔已經補上了水泥，大廳亮著暖黃燈泡，櫃檯後掛著一排沉甸甸的銅製鑰匙牌。",
                "options": lambda p: [
                    opt("service", "詢問過夜與安全歇腳", [{"op": "open_service", "service": "hotel"}], f"{{party}}走進{p}路邊旅館，打聽今晚是否能安穩睡上一覺。"),
                    opt("leave", "天色還早，繼續趕路", [], "{party}看了看手錶，決定再多開一段。"),
                ],
            },
            {
                "artRef": "road_038", "building": True, "placeSuffix": "診所", "npc": True, "polarity": "good",
                "places": ["戰地", "帆布", "鐵屋", "銀灰", "燈箱", "路標", "急救", "清泉", "淨水", "白布"],
                "noun": "公路診所",
                "intro": "{place}公路診所外頭停著一輛報廢救護車充當發電機房，值班醫護正替路過的商隊清創包紮。",
                "options": lambda p: [
                    opt("service", "進診所治療傷勢或買藥", [{"op": "open_service", "service": "clinic"}], f"{{party}}走進{p}公路診所，請醫護人員檢查隊員的傷口。"),
                    opt("leave", "沒人受傷，先行離開", [], "{party}向醫護致謝後轉身回到車上。"),
                ],
            },
            {
                "artRef": "road_034", "building": True, "placeSuffix": "裝備市場", "npc": True, "polarity": "good",
                "places": ["黑鐵", "帆布頂", "廢車陣", "高架橋", "舊車站", "貨場", "廣場", "鐵網", "砂石場", "集市"],
                "noun": "裝備市集",
                "intro": "{place}裝備市集裡擠滿了拾荒者與傭兵，長桌上排開改造武器、防彈背心與各種舊世界儀器。",
                "options": lambda p: [
                    opt("service", "逛逛攤位挑件趁手裝備", [{"op": "open_service", "service": "equipment_shop"}], f"{{party}}走進{p}裝備市集，仔細比對各攤位的武器與護具。"),
                    opt("leave", "怕被宰客，直接開走", [], "{party}在市集外圍繞了一圈便離開了。"),
                ],
            },
            {
                "artRef": "road_035", "building": True, "placeSuffix": "二手車行", "npc": True, "polarity": "good",
                "places": ["鏽鐵坪", "大招牌", "碎石場", "拖車", "車庫", "鐵柵", "高燈柱", "試車道", "坡道", "老廠房"],
                "noun": "二手車行",
                "intro": "{place}二手車行的空地上整齊停著幾輛重新拼裝過的車輛，老闆叼著螺絲起子拍著引擎蓋兜售。",
                "options": lambda p: [
                    opt("service", "下車看看待售車輛", [{"op": "open_service", "service": "vehicle_shop"}], f"{{party}}走進{p}二手車行，打量每一輛車的座位與裝甲。"),
                    opt("leave", "還是開原本這台順手", [], "{party}謝絕了推銷，發動引擎上路。"),
                ],
            },
            {
                "artRef": "road_040", "building": True, "placeSuffix": "驛站", "npc": True, "polarity": "good",
                "places": ["東行", "風車", "水塔", "鐵道旁", "紅土", "舊收費", "長椅", "爐火", "哨塔", "木棚"],
                "noun": "補給驛站",
                "intro": "{place}補給驛站升起一縷炊煙，幾個旅人正圍著鐵桶取暖交換物資，站長在黑板上寫滿了最新路況。",
                "options": lambda p: [
                    opt("service", "進驛站採買與打聽消息", [{"op": "open_service", "service": "general_shop"}], f"{{party}}把車停進{p}補給驛站，順道打聽東邊的傳聞。"),
                    opt("rest", "趁機整理行囊歇口氣（消耗 30 分鐘）", [{"op": "world_minutes", "amount": 30}, {"op": "heal", "target": "party", "amount": 2}], f"{{party}}在{p}補給驛站喝了杯熱茶，精神稍微恢復了一些。"),
                ],
            },
            {
                "artRef": "road_015", "building": True, "placeSuffix": "補給點", "npc": True, "polarity": "good",
                "places": ["民間", "互助", "志工", "流動", "橋頭", "隧道口", "山坳", "廢校", "碼頭", "水壩"],
                "noun": "互助補給站",
                "intro": "{place}互助補給站由附近倖存者輪流看守，門口寫著「以物易物，不問來歷」，氣氛比大城鎮平和得多。",
                "options": lambda p: [
                    opt("trade", "與駐點旅人交談交易", [{"op": "npc_interaction", "service": "npc_trade"}], f"{{party}}走向{p}互助補給站的看守者，聊聊近況並看看能換些什麼。"),
                    opt("donate", "捐出 2 份廢料支援補給站", [{"op": "resource", "key": "scrap", "amount": -2}, {"op": "morality", "delta": 8}, {"op": "heal", "target": "party", "amount": 3}], "{party}留下兩份廢料，看守者感激地替大家包紮了傷口。", [{"resource": "scrap", "minimum": 2}]),
                    opt("leave", "點頭致意後離開", [], "{party}揮揮手，繼續向東行駛。"),
                ],
            },
        ],
    },
    {
        "d12": 2,
        "id": "cat_02",
        "name": "旅人與同行者",
        "desc": "公路上形形色色的流浪者、營火、搭便車客與可能並肩同行的夥伴。",
        "archetypes": [
            {
                "artRef": "road_016", "building": False, "npc": True, "polarity": "good",
                "places": ["路肩", "里程碑旁", "枯樹下", "涵洞口", "巴士站", "鐵軌邊", "沙丘頂", "破看板下", "水溝旁", "岔路口"],
                "noun": "搭便車旅人",
                "intro": "{place}站著一名背著大帆布包的旅人，聽到引擎聲便急忙舉起寫著「往東」的厚紙板，鞋底早已磨得發白。",
                "options": lambda p: [
                    opt("talk", "減速靠邊，和對方聊聊", [{"op": "npc_interaction", "service": "npc_trade"}], "{party}踩下煞車，搖下車窗打量這名風塵僕僕的旅人。"),
                    opt("leave", "不敢輕信陌生人，加速通過", [], "{party}沒有停車，從後照鏡看著對方慢慢變小。"),
                ],
            },
            {
                "artRef": "road_017", "building": False, "npc": True, "polarity": "good",
                "places": ["乾河床", "石牆後", "廢橋墩", "矮丘", "碎石灘", "防風林", "空地", "舊營地", "岩洞前", "高架下"],
                "noun": "獨行營火",
                "intro": "{place}燃著一堆小小的柴火，鐵鍋裡正咕嘟咕嘟煮著罐頭湯，營火旁的旅人抬頭看了過來，手自然地搭在膝蓋旁。",
                "options": lambda p: [
                    opt("talk", "停下車過去烤火聊天", [{"op": "npc_interaction", "service": "npc_trade"}], "{party}走近營火堆，彼此交換一路向東的見聞。"),
                    opt("share", "分出 1 份藥品結交對方", [{"op": "resource", "key": "medicine", "amount": -1}, {"op": "morality", "delta": 6}, {"op": "npc_interaction", "service": "npc_trade"}], "{party}遞上一份藥品，對方的戒備立刻鬆懈下來。", [{"resource": "medicine", "minimum": 1}]),
                    opt("leave", "不打擾對方，安靜繞行", [], "{party}熄掉遠光燈，靜靜駛離營火。"),
                ],
            },
            {
                "artRef": "road_018", "building": False, "npc": True, "polarity": "neutral",
                "places": ["修車溝", "破卡車旁", "貨櫃側", "加油島", "報廢車堆", "鐵棚下", "斜坡上", "碎柏油路", "輪胎堆", "工具車旁"],
                "noun": "拋錨旅人",
                "intro": "{place}停著一輛冒著白煙的破車，車主滿手黑油地敲著水箱蓋，嘴裡不停咒罵著這條見鬼的公路。",
                "options": lambda p: [
                    opt("help", "遞出 2 份廢料幫忙應急", [{"op": "resource", "key": "scrap", "amount": -2}, {"op": "morality", "delta": 8}, {"op": "oracle", "table": "supplies"}], "{party}拿出廢料替對方補好管線，對方感激地回贈了一包物資。", [{"resource": "scrap", "minimum": 2}]),
                    opt("talk", "下車打招呼聊聊狀況", [{"op": "npc_interaction", "service": "npc_trade"}], "{party}停在路肩上前寒暄，看看對方有沒有情報或物資可換。"),
                    opt("leave", "自顧不暇，直接開走", [], "{party}沒有停下，留下一陣煙塵。"),
                ],
            },
            {
                "artRef": "road_019", "building": False, "npc": True, "polarity": "good",
                "places": ["廢戲院前", "舊月台", "鐵橋頭", "水塔陰影", "街角", "廣場邊", "破教堂前", "公路休息區", "石階上", "空車廂"],
                "noun": "流浪樂手",
                "intro": "{place}傳來斷斷續續的口琴與吉他聲，一名流浪樂手坐在行李箱上彈著戰前的老情歌，腳邊擺著一隻空鐵盒。",
                "options": lambda p: [
                    opt("listen", "停下來聽完一首曲子（消耗 20 分鐘）", [{"op": "world_minutes", "amount": 20}, {"op": "heal", "target": "party", "amount": 2}, {"op": "npc_interaction", "service": "npc_trade"}], "久違的旋律讓緊繃的神經舒緩下來，一曲終了後雙方聊了起來。"),
                    opt("tip", "丟進 1 份廢料當打賞", [{"op": "resource", "key": "scrap", "amount": -1}, {"op": "morality", "delta": 5}, {"op": "reveal_history"}], "樂手笑著收下零件，順口唱了一段關於外星登陸那年的民間歌謠。", [{"resource": "scrap", "minimum": 1}]),
                    opt("leave", "匆匆駛過", [], "歌聲在車窗外迅速淡去。"),
                ],
            },
            {
                "artRef": "road_020", "building": False, "npc": True, "polarity": "neutral",
                "places": ["高地", "電塔下", "斷崖邊", "廢屋頂", "路燈下", "界碑旁", "沙堤", "舊哨口", "鐵欄邊", "山腰"],
                "noun": "巡路斥候",
                "intro": "{place}有位拿著雙筒望遠鏡的斥候正記錄遠方的動靜，筆記本裡畫滿了密密麻麻的怪物出沒標記。",
                "options": lambda p: [
                    opt("talk", "上前攀談交換情報", [{"op": "npc_interaction", "service": "npc_trade"}], "{party}放慢腳步靠近，向斥候打聽前方路段的危險。"),
                    opt("trade_fuel", "用 2 點汽油換取秘藏補給", [{"op": "resource", "key": "fuel", "amount": -2}, {"op": "oracle", "table": "equipment"}], "斥候收下汽油，從背包深處翻出一件保養良好的裝備交給{party}。", [{"resource": "fuel", "minimum": 2}]),
                    opt("leave", "不想惹麻煩，繞道離開", [], "{party}保持距離駛離了這片高地。"),
                ],
            },
            {
                "artRef": "road_016", "building": False, "npc": True, "polarity": "good",
                "places": ["商隊尾端", "貨車棚", "驢車旁", "腳踏車隊", "手推車旁", "帳篷區", "油桶陣", "路邊攤", "長桌旁", "遮陽帆布"],
                "noun": "行腳商販",
                "intro": "{place}停著一名推著改裝手推車的行腳商販，車斗裡叮叮噹噹掛滿水壺、彈匣、繃帶與小零件。",
                "options": lambda p: [
                    opt("trade", "停下來看看行腳商販的貨", [{"op": "npc_interaction", "service": "npc_trade"}], "{party}靠邊停下，翻看商販從各地搜羅來的雜貨。"),
                    opt("leave", "沒打算花廢料，繼續上路", [], "{party}朝商販揮揮手，重新加速。"),
                ],
            },
            {
                "artRef": "road_017", "building": False, "npc": True, "polarity": "neutral",
                "places": ["枯井邊", "儲水塔下", "山泉口", "舊水管旁", "雨棚下", "水泥槽", "鐵桶旁", "溪谷", "蓄水池", "淨水器旁"],
                "noun": "取水旅人",
                "intro": "{place}有位旅人正用布條過濾混濁的雨水，見有車開過來，立刻警覺地護住手裡的水壺。",
                "options": lambda p: [
                    opt("talk", "舉起雙手示意無害並交談", [{"op": "npc_interaction", "service": "npc_trade"}], "{party}慢慢停下車輛表明善意，對方這才放鬆肩膀。"),
                    opt("leave", "不驚動對方，直接離開", [], "{party}默默開過，沒去打擾對方取水。"),
                ],
            },
            {
                "artRef": "road_018", "building": False, "npc": True, "polarity": "good",
                "places": ["舊校門口", "郵筒旁", "圖書館階梯", "紀念碑下", "車站長椅", "鐘樓下", "醫院後門", "公園涼亭", "書店外", "廣場噴泉"],
                "noun": "流浪學者",
                "intro": "{place}坐著一名抱著厚重活頁夾的流浪學者，正用半截鉛筆臨摹牆上的舊時代塗鴉與公告。",
                "options": lambda p: [
                    opt("talk", "停下來聽聽他的研究", [{"op": "reveal_history"}, {"op": "npc_interaction", "service": "npc_trade"}], "學者眼睛一亮，滔滔不絕地講起外星佔領初期的秘辛。"),
                    opt("leave", "沒空聽長篇大論，繼續趕路", [], "{party}禮貌地點點頭便發車離開。"),
                ],
            },
            {
                "artRef": "road_019", "building": False, "npc": True, "polarity": "neutral",
                "places": ["鐵絲網外", "舊軍營", "靶場邊", "瞭望台下", "掩體旁", "機庫外", "補給線", "裝甲殘骸旁", "崗哨旁", "彈藥箱上"],
                "noun": "退役傭兵",
                "intro": "{place}靠著一名身穿磨損戰術背心的退役傭兵，正慢條斯理地擦拭武器，眼神像老獵犬般銳利。",
                "options": lambda p: [
                    opt("talk", "上前打招呼試探口風", [{"op": "npc_interaction", "service": "npc_trade"}], "{party}走近這名身經百戰的傭兵，聊聊前方的戰況與去處。"),
                    opt("spar", "請教實戰訣竅（消耗 2 點體力）", [{"op": "stamina_cost", "amount": 2}, {"op": "oracle", "table": "equipment"}], "傭兵點撥了幾招保命手法，還順手把一件多餘裝備丟給{party}。"),
                    opt("leave", "保持距離駛過", [], "{party}默默踩下油門，沒去招惹這號人物。"),
                ],
            },
            {
                "artRef": "road_020", "building": False, "npc": True, "polarity": "good",
                "places": ["十字路口", "東向路牌", "分岔橋", "山道口", "荒原界線", "沙路盡頭", "高架匝道", "舊省道", "海岸轉彎", "林道出口"],
                "noun": "尋夢朝聖者",
                "intro": "{place}站著一名把行囊捆得整整齊齊的旅人，正望著東方地平線喃喃自語，顯然也是衝著「樂園」傳說而來。",
                "options": lambda p: [
                    opt("talk", "停車問問對方要不要同行或交換消息", [{"op": "npc_interaction", "service": "npc_trade"}], "{party}靠邊停下，兩個同樣往東走的靈魂在公路上交換了彼此的故事。"),
                    opt("leave", "各走各的路，繼續前行", [], "{party}按了聲短喇叭當作祝福，繼續向東。"),
                ],
            },
        ],
    },
    {
        "d12": 3,
        "id": "cat_03",
        "name": "廢墟探索與拾荒",
        "desc": "荒廢的倉庫、回收場、翻覆貨櫃與藏著舊世界物資的危險角落。",
        "archetypes": [
            {
                "artRef": "road_048", "building": True, "placeSuffix": "倉庫", "npc": False, "polarity": "good",
                "places": ["物流", "冷凍", "鐵皮", "紅磚", "港口", "農機", "五金", "建材", "軍需", "空運"],
                "noun": "廢棄倉庫",
                "intro": "{place}廢棄倉庫的大門半掩著，陽光從破洞屋頂斜射進滿地灰塵的貨架，隱約能看見幾只尚未拆封的木箱。",
                "options": lambda p: [
                    opt("search", "小心翼翼地翻找貨架（消耗 1 點體力）", [{"op": "stamina_cost", "amount": 1}, {"op": "oracle", "table": "supplies"}], f"{{party}}在{p}廢棄倉庫裡翻找一番，清出還能使用的補給。"),
                    opt("deep", "撬開深處上鎖的鐵櫃", [check_eff("speed", 55, [{"op": "oracle", "table": "equipment"}], [{"op": "damage", "target": "actor", "amount": 3}])], "{party}嘗試撬開生鏽的鎖頭。"),
                    opt("leave", "裡面太陰森，直接離開", [], "{party}沒有冒險，轉身回到公路。"),
                ],
            },
            {
                "artRef": "road_021", "building": True, "placeSuffix": "回收場", "npc": False, "polarity": "good",
                "places": ["壓扁車", "廢鐵山", "吊車", "磁鐵", "舊輪胎", "零件坑", "鏽鋼", "拆車", "黑煙", "高牆"],
                "noun": "廢車回收場",
                "intro": "{place}廢車回收場堆滿三層樓高的報廢車殼，在風裡發出金屬摩擦的嘎吱聲，對懂車的人來說這裡簡直是寶庫。",
                "options": lambda p: [
                    opt("salvage", "拆解還能用的零件與廢料", [{"op": "resource", "key": "scrap", "amount": 3}, {"op": "world_minutes", "amount": 30}], "{party}揮汗拆下一批完好的鋼板與螺絲。"),
                    opt("repair", "順手用現場材料補強車體", [{"op": "heal", "target": "vehicle", "amount": 5}, {"op": "stamina_cost", "amount": 2}], "{party}找來厚鐵板焊在車身上，車況明顯好轉。"),
                    opt("leave", "不想浪費時間，離開", [], "{party}繞過碎玻璃堆繼續前進。"),
                ],
            },
            {
                "artRef": "road_033", "building": False, "npc": False, "polarity": "good",
                "places": ["翻覆", "生鏽", "彈孔", "半埋", "傾斜", "漆黑", "掉漆", "脫節", "斷軸", "封條"],
                "noun": "貨櫃殘骸",
                "intro": "路旁躺著一只{place}貨櫃殘骸，門鎖已經斷了一半，裡頭散落著防震泡棉與印有模糊編號的塑膠箱。",
                "options": lambda p: [
                    opt("loot", "鑽進去清點物資", [{"op": "oracle", "table": "supplies"}], "{party}撥開泡棉，把還能帶走的物資全部收進後車廂。"),
                    opt("gear", "翻找深處的金屬工具箱", [check_eff("speed", 50, [{"op": "oracle", "table": "equipment"}], [{"op": "resource", "key": "scrap", "amount": 2}])], "{party}費力把沉重的工具箱拖了出來。"),
                    opt("leave", "擔心是陷阱，略過", [], "{party}保持警惕，沒有靠近貨櫃。"),
                ],
            },
            {
                "artRef": "road_025", "building": False, "npc": False, "polarity": "neutral",
                "places": ["偽裝網", "砂袋", "鐵門", "地下", "前線", "彈藥", "通訊", "雷達", "野戰", "裝甲"],
                "noun": "軍用庫房",
                "intro": "{place}軍用庫房的防爆門斜斜卡死在門框上，裡頭漆黑一片，但牆上的軍規編號暗示裡面可能還留著好東西。",
                "options": lambda p: [
                    opt("raid", "硬闖進去搜索軍用裝備", [check_eff("defense", 55, [{"op": "oracle", "table": "equipment"}, {"op": "resource", "key": "scrap", "amount": 2}], [{"op": "damage", "target": "party", "amount": 4}, {"op": "resource", "key": "scrap", "amount": 1}])], "{party}小心避開絆線，伸手摸進漆黑的庫房。"),
                    opt("quick", "只拿門口散落的物資", [{"op": "resource", "key": "fuel", "amount": 3}], "{party}在入口處拎走幾桶軍用油罐便迅速撤退。"),
                    opt("leave", "軍用設施太危險，離開", [], "{party}不想踩到舊地雷，直接開走。"),
                ],
            },
            {
                "artRef": "road_045", "building": True, "placeSuffix": "校車", "npc": False, "polarity": "good",
                "places": ["黃色", "斜停", "長草", "泥陷", "斷輪", "破窗", "塗鴉", "焦黑", "翻側", "路溝"],
                "noun": "廢棄巴士",
                "intro": "一輛{place}廢棄巴士橫在路肩草叢裡，車廂內塞滿撤離時期留下的書包、毛毯與沒帶走的乾糧盒。",
                "options": lambda p: [
                    opt("search", "上車翻找可用的醫藥與物資", [{"op": "resource", "key": "medicine", "amount": 1}, {"op": "resource", "key": "scrap", "amount": 2}], "{party}在座椅底下找到一個還沒開封的急救盒與零件。"),
                    opt("siphon", "抽乾巴士油箱的殘油", [{"op": "resource", "key": "fuel", "amount": 4}, {"op": "world_minutes", "amount": 25}], "{party}用軟管耐心抽出油箱底部的剩餘汽油。"),
                    opt("leave", "保持原狀，安靜離開", [], "{party}看了一眼車窗上的小手印，默默發車。"),
                ],
            },
            {
                "artRef": "road_011", "building": False, "npc": False, "polarity": "good",
                "places": ["軍綠", "橘紅", "銀鋁", "木條", "防水", "空投", "編號", "鐵箍", "塑膠", "密封"],
                "noun": "路旁物資箱",
                "intro": "雜草堆裡露出一只{place}路旁物資箱的邊角，箱體沾滿泥巴，但扣環依然緊密，像是從某輛顛簸的貨車上摔下來的。",
                "options": lambda p: [
                    opt("open", "撬開扣環檢查內容物", [{"op": "oracle", "table": "supplies"}], "{party}用力撬開扣環，清點裡面的物資。"),
                    opt("leave", "怕有詭雷，不碰為妙", [], "{party}繞過物資箱繼續向東。"),
                ],
            },
            {
                "artRef": "road_024", "building": False, "npc": False, "polarity": "neutral",
                "places": ["防空", "民防", "山壁", "地窖", "捷運", "地下室", "水閘", "混凝土", "鐵蓋", "通風井"],
                "noun": "封閉避難所",
                "intro": "{place}封閉避難所的厚重鐵門上噴著「已撤離」的白漆，但通風口裡飄出一股乾燥的機油與藥水氣味。",
                "options": lambda p: [
                    opt("enter", "撬開側門進去探查", [check_eff("psyche", 50, [{"op": "oracle", "table": "equipment"}, {"op": "resource", "key": "medicine", "amount": 1}], [{"op": "combat", "mode": "character"}])], "{party}打著手電筒走進陰暗的避難所通道。"),
                    opt("leave", "別驚動裡頭的東西，離開", [], "{party}關掉手電筒，退回車上。"),
                ],
            },
            {
                "artRef": "road_013", "building": False, "npc": False, "polarity": "good",
                "places": ["紅鐵", "雙層", "電工", "汽修", "軍規", "帆布", "防水", "重型", "焊接", "精密"],
                "noun": "遺落工具箱",
                "intro": "護欄旁邊孤零零躺著一只{place}遺落工具箱，旁邊還有幾道急煞車留下的黑印，顯然原主人走得非常倉促。",
                "options": lambda p: [
                    opt("take", "收進後車廂並整理零件", [{"op": "resource", "key": "scrap", "amount": 3}], "{party}清點工具箱裡的扳手與備料，全數收入囊中。"),
                    opt("fix", "趁手邊有工具順道保養車輛", [{"op": "heal", "target": "vehicle", "amount": 4}], "{party}用這批順手的工具替車子鎖緊了鬆動的零件。"),
                ],
            },
            {
                "artRef": "road_035", "building": False, "npc": False, "polarity": "good",
                "places": ["車庫角落", "樹叢後方", "斷橋下", "穀倉裡", "工地旁", "加油站後", "空廠房", "隧道口", "荒村邊", "修車場旁"],
                "noun": "無主車輛",
                "intro": "{place}停著一輛積滿灰塵卻外觀完整的無主車輛，輪胎還沒完全漏氣，鑰匙甚至還插在電門上。",
                "options": lambda p: [
                    opt("inspect", "檢查車況看能不能換開這台車", [{"op": "oracle", "table": "vehicle"}], "{party}拉開車門試轉電門，發動機居然真的咳嗽了兩聲！"),
                    opt("siphon", "不換車，只抽汽油跟拆零件", [{"op": "resource", "key": "fuel", "amount": 4}, {"op": "resource", "key": "scrap", "amount": 2}], "{party}把車上的汽油和堪用零件搜刮一空。"),
                ],
            },
            {
                "artRef": "road_044", "building": True, "placeSuffix": "藥房", "npc": False, "polarity": "neutral",
                "places": ["碎窗", "荒廢", "鐵捲門", "舊社區", "斜巷", "轉角", "二樓", "紅字", "醫院旁", "老街"],
                "noun": "廢棄藥局",
                "intro": "{place}廢棄藥局的貨架大多已經翻倒，但櫃檯後的處方冷藏櫃還鎖著，裡頭也許還留著沒過期的救命藥。",
                "options": lambda p: [
                    opt("open", "撬開處方櫃搜刮藥品", [{"op": "resource", "key": "medicine", "amount": 2}, {"op": "stamina_cost", "amount": 1}], "{party}撬開鐵櫃，找到兩份保存完好的急救藥品。"),
                    opt("leave", "玻璃渣太多，不冒險", [], "{party}退回門外，發車離開。"),
                ],
            },
        ],
    },
    {
        "d12": 4,
        "id": "cat_04",
        "name": "公路伏擊與掠奪",
        "desc": "攔路強盜、公路飛車黨、狙擊埋伏與真假難辨的求救陷阱。",
        "archetypes": [
            {
                "artRef": "road_065", "building": False, "npc": False, "polarity": "bad",
                "places": ["鏽油桶", "燃燒輪胎", "廢車橫堵", "釘板", "鐵絲網", "沙包", "木柵", "碎石堆", "路牌陣", "貨車架"],
                "noun": "劫匪路障",
                "intro": "前方路面被人用{place}堵死，幾名蒙面劫匪舉著土製步槍從兩側土坡鑽出，敲著車頭吼道：「留下過路費，不然車和命都留下！」",
                "options": lambda p: [
                    opt("pay", "交出 3 份廢料買路", [{"op": "resource", "key": "scrap", "amount": -3}], "{party}把廢料丟出窗外，劫匪冷笑著拉開路障放行。", [{"resource": "scrap", "minimum": 3}]),
                    opt("fight", "拔出武器正面擊退劫匪", [{"op": "combat", "mode": "character"}], "{party}推開車門迎戰這群公路劫匪！"),
                    opt("escape", "猛打方向盤強行衝出包圍", [{"op": "attempt_escape", "mode": "vehicle"}], "{party}把油門踩到底，試圖衝破路障！"),
                ],
            },
            {
                "artRef": "road_068", "building": False, "npc": False, "polarity": "bad",
                "places": ["沙塵暴裡", "下坡彎道", "長直道", "高架橋上", "峽谷出口", "荒原公路", "黃昏逆光", "斷橋前", "工業區外", "鐵道並行線"],
                "noun": "飛車黨追擊",
                "intro": "{place}的後照鏡裡突然炸起刺耳的排氣管轟鳴！幾輛焊滿尖刺的改裝車正左右包抄逼近，車窗探出晃動的槍口！",
                "options": lambda p: [
                    opt("fight", "咬牙迎戰，展開公路追逐戰", [{"op": "combat", "mode": "vehicle"}], "引擎怒吼，雙方在高速行駛的公路上展開搏命追逐！"),
                    opt("escape", "急轉切入側道甩開追兵", [{"op": "attempt_escape", "mode": "vehicle"}], "{party}猛拉手煞車切進顛簸便道，試圖擺脫飛車黨。"),
                ],
            },
            {
                "artRef": "road_066", "building": False, "npc": False, "polarity": "bad",
                "places": ["天橋上", "廣告牌後", "水塔頂", "斷樓窗口", "山脊線", "電塔架", "看板後", "高架墩", "屋簷下", "廢煙囪"],
                "noun": "狙擊手埋伏",
                "intro": "一顆子彈突然擦過車頂迸出火星！{place}閃過一道瞄準鏡反光，有人正把這段公路當成私人狩獵場！",
                "options": lambda p: [
                    opt("rush", "停車找掩護反擊狙擊手", [{"op": "combat", "mode": "character"}], "{party}立刻壓低身子衝向掩體，反手壓制高處的槍手！"),
                    opt("speed", "伏低身子猛踩油門衝過射界", [check_eff("speed", 55, [{"op": "resource", "key": "fuel", "amount": -1}], [{"op": "damage", "target": "vehicle", "amount": 5}])], "{party}死命趴低方向盤，踩盡油門衝出火力範圍。"),
                ],
            },
            {
                "artRef": "road_067", "building": False, "npc": False, "polarity": "bad",
                "places": ["假傷員", "冒煙破車", "倒地油桶", "呼救旗", "假商隊", "翻倒嬰兒車", "閃爍求救燈", "假路障", "假修車工", "哭喊聲"],
                "noun": "誘餌陷阱",
                "intro": "路邊的{place}看起來格外可疑——剛減速靠近，兩側草叢裡就同時傳出拉動槍栓的清脆聲響！這根本是設計好的埋伏！",
                "options": lambda p: [
                    opt("fight", "搶先開火打破埋伏圈", [{"op": "combat", "mode": "character"}], "{party}早有防備，先發制人朝草叢展開反擊！"),
                    opt("escape", "立刻倒車急轉撤離", [{"op": "attempt_escape", "mode": "character"}], "{party}猛掛倒檔，輪胎冒煙試圖衝出埋伏圈。"),
                ],
            },
            {
                "artRef": "road_052", "building": False, "npc": False, "polarity": "bad",
                "places": ["鏽蝕", "塗鴉", "鐵門", "私設", "武裝", "荒橋", "峽谷", "鐵道", "山道", "廢城"],
                "noun": "私設收費站",
                "intro": "{place}私設收費站掛著骷髏旗，幾個叼著菸的幫派打手擋在升降桿前：「過去這條線，要麼留下汽油，要麼留下車胎！」",
                "options": lambda p: [
                    opt("pay_fuel", "交出 3 點汽油花錢消災", [{"op": "resource", "key": "fuel", "amount": -3}], "{party}忍氣吞聲抽出三點汽油，升降桿這才慢吞吞升起。", [{"resource": "fuel", "minimum": 3}]),
                    opt("fight", "掀翻收費站硬闖過去", [{"op": "combat", "mode": "character"}], "{party}拒絕向地頭蛇低頭，直接開戰！"),
                    opt("detour", "調頭繞行偏僻小路（耗油 2）", [{"op": "travel_cost", "fuel": 2}], "{party}懶得跟這群流氓糾纏，繞遠路避開了收費站。", [{"resource": "fuel", "minimum": 2}]),
                ],
            },
            {
                "artRef": "road_065", "building": False, "npc": False, "polarity": "bad",
                "places": ["濃煙", "火瓶", "鐵鍊", "破貨車", "油漆桶", "路燈桿", "輪胎牆", "鐵板車", "焦土", "廢橋"],
                "noun": "縱火掠奪團",
                "intro": "一夥揮舞燃燒瓶的掠奪者從{place}後方湧了出來，瘋狂大笑著朝車道逼近，打算把這輛車烤成廢鐵再搜刮！",
                "options": lambda p: [
                    opt("fight", "正面迎戰這群瘋子", [{"op": "combat", "mode": "character"}], "{party}躲過飛來的燃燒瓶，舉起武器迎擊！"),
                    opt("ram", "全速衝撞殺出血路", [{"op": "combat", "mode": "vehicle"}], "{party}踩緊油門，打算靠車身裝甲撞開包圍！"),
                ],
            },
            {
                "artRef": "road_068", "building": False, "npc": False, "polarity": "bad",
                "places": ["沙塵中", "鐵橋上", "峽道內", "荒村外", "夜幕下", "油田旁", "廢機場", "鹽灘上", "斷垣邊", "泥濘道"],
                "noun": "奪油車隊",
                "intro": "{place}衝出一輛裝著鐵撞角的奪油改裝車，車斗上的武裝分子正揮舞鐵鉤，企圖鉤住車尾強行逼停！",
                "options": lambda p: [
                    opt("fight", "進入高速車輛攻防戰", [{"op": "combat", "mode": "vehicle"}], "{party}猛打方向盤躲開鐵鉤，與奪油車隊展開高速對決！"),
                    opt("bribe", "甩出 2 點汽油引開他們", [{"op": "resource", "key": "fuel", "amount": -2}], "{party}把備用油桶滾出車外，奪油匪徒立刻急煞搶油，趁機脫身。", [{"resource": "fuel", "minimum": 2}]),
                ],
            },
            {
                "artRef": "road_066", "building": False, "npc": False, "polarity": "bad",
                "places": ["廢加油站", "舊貨場", "枯樹林", "鐵皮棚", "涵洞", "山坡", "殘牆", "乾溝", "空車庫", "舊車站"],
                "noun": "拾荒黑幫",
                "intro": "{place}鑽出一支裝備整齊的拾荒黑幫，他們顯然盯上這輛車的改裝零件已久，二話不說便包抄上來！",
                "options": lambda p: [
                    opt("fight", "打退這群黑幫", [{"op": "combat", "mode": "character"}], "{party}背靠車身擺好陣勢，與黑幫展開近身火併！"),
                    opt("intimidate", "亮出武器威嚇逼退", [check_eff("attack", 60, [{"op": "morality", "delta": -2}], [{"op": "combat", "mode": "character"}])], "{party}拉響槍栓冷冷盯著帶頭老大。"),
                ],
            },
            {
                "artRef": "road_067", "building": False, "npc": False, "polarity": "bad",
                "places": ["夜色裡", "霧氣中", "廢屋側", "招牌後", "車陣間", "橋陰影", "巷口", "堤防邊", "土堆後", "樹影下"],
                "noun": "暗巷扒手團",
                "intro": "車剛在{place}放慢速度，就有幾個動作俐落的身影貼上車尾，伸手去撬後車廂的物資鎖扣！",
                "options": lambda p: [
                    opt("catch", "立刻下車逮人教訓一頓", [{"op": "combat", "mode": "character"}], "{party}一把推開車門喝止這群偷油賊！"),
                    opt("floor", "直接大腳油門甩掉他們", [check_eff("speed", 45, [], [{"op": "resource_loss", "key": "scrap", "amount": 2}])], "{party}猛踩油門甩開扒手，回頭確認後車廂是否失竊。"),
                ],
            },
            {
                "artRef": "road_065", "building": False, "npc": False, "polarity": "bad",
                "places": ["高地哨所", "鐵橋中央", "隧道出口", "山道轉彎", "荒原公路", "工廠大門", "乾河渡口", "舊市區", "廢農莊", "高架下"],
                "noun": "流寇攔劫",
                "intro": "一群衣衫襤褸卻眼神兇狠的流寇從{place}殺了出來，揮舞撬棍與土槍企圖搶走車上所有食物與藥品！",
                "options": lambda p: [
                    opt("fight", "迎戰流寇守住物資", [{"op": "combat", "mode": "character"}], "{party}握緊武器擋在車前，絕不讓物資落入流寇手中！"),
                    opt("toss", "丟出 1 份藥品換取安全通過", [{"op": "resource", "key": "medicine", "amount": -1}], "流寇搶到藥品後互相推擠著退進廢墟，{party}趁機通過。", [{"resource": "medicine", "minimum": 1}]),
                ],
            },
        ],
    },
    {
        "d12": 5,
        "id": "cat_05",
        "name": "異星與變異威脅",
        "desc": "外星巡邏機、變異怪獸、毒孢子巢穴與佔領軍的自動化獵殺兵器。",
        "archetypes": [
            {
                "artRef": "road_080", "building": False, "npc": False, "polarity": "bad",
                "places": ["紫霧裡", "低空掠過", "電塔上方", "荒原上空", "高架橋側", "斷崖前", "廢城上空", "鹽灘上", "鐵道上方", "雲層下"],
                "noun": "外星偵察無人機",
                "intro": "{place}響起冰冷的高頻嗡鳴，數台銀灰色外星偵察無人機降下探照紅光，掃描光束瞬間鎖定了這輛車！",
                "options": lambda p: [
                    opt("fight", "擊落這些機械眼線", [{"op": "combat", "mode": "character", "enemy_category": "machine"}], "{party}趁無人機還沒傳回座標前先發制人開火！"),
                    opt("hide", "熄火滑進陰影躲避掃描", [check_eff("speed", 55, [{"op": "world_minutes", "amount": 20}], [{"op": "combat", "mode": "character", "enemy_category": "machine"}])], "{party}迅速熄掉引擎，屏住呼吸等掃描光束掠過。"),
                ],
            },
            {
                "artRef": "road_081", "building": False, "npc": False, "polarity": "bad",
                "places": ["裂縫中", "廢井裡", "排水溝", "泥潭裡", "沙層下", "塌屋內", "樹根下", "橋洞裡", "隧道側", "碎石堆"],
                "noun": "變異獸群",
                "intro": "{place}竄出幾頭皮膚泛著螢光紫紋的變異野獸，喉嚨裡發出低沉嘶鳴，顯然把這輛鐵盒子當成了移動罐頭！",
                "options": lambda p: [
                    opt("fight", "迎戰變異獸群", [{"op": "combat", "mode": "character"}], "{party}舉起武器與撲上來的變異獸群展開死鬥！"),
                    opt("escape", "猛按喇叭加速衝過去", [{"op": "attempt_escape", "mode": "character"}], "{party}拉響長喇叭試圖嚇退獸群並強行突圍。"),
                ],
            },
            {
                "artRef": "road_082", "building": False, "npc": False, "polarity": "bad",
                "places": ["腐爛公路", "潮濕涵洞", "倒塌溫室", "廢醫院外", "濕地邊緣", "陰暗林道", "積水隧道", "舊公園", "生苔牆角", "泥沼旁"],
                "noun": "菌絲孢子巢",
                "intro": "{place}佈滿脈動著的暗綠色菌絲囊腫，空氣中漂浮著嗆鼻的螢光孢子，幾隻被寄生的身影正僵硬地轉過頭來！",
                "options": lambda p: [
                    opt("burn", "衝過去清剿孢子威脅", [{"op": "combat", "mode": "character"}], "{party}掩住口鼻，準備清出一條生路！"),
                    opt("detour", "緊閉車窗繞道避開毒霧（耗油 2）", [{"op": "travel_cost", "fuel": 2}], "{party}立刻關閉外循環空調，耗油繞過整片孢子區。", [{"resource": "fuel", "minimum": 2}]),
                ],
            },
            {
                "artRef": "road_083", "building": False, "npc": False, "polarity": "bad",
                "places": ["結晶岩壁", "紫晶坑", "礦場外", "隕石溝", "電弧谷", "石英灘", "反光路", "廢變電所", "裂谷底", "碎晶坡"],
                "noun": "晶體哨兵",
                "intro": "{place}矗立著一具由外星晶礦構成的沉重輪廓，在引擎震動傳過去的瞬間，它胸口的冷藍核心驟然亮起！",
                "options": lambda p: [
                    opt("fight", "摧毀這具異星守護者", [{"op": "combat", "mode": "character"}], "晶體發出玻璃摩擦般的尖嘯，{party}立刻進入戰鬥！"),
                    opt("escape", "趁它剛啟動迅速撤離", [{"op": "attempt_escape", "mode": "character"}], "{party}不想跟一塊會走路的礦石硬碰硬，趕緊踩油門撤退。"),
                ],
            },
            {
                "artRef": "road_084", "building": False, "npc": False, "polarity": "bad",
                "places": ["高架殘段", "軍管邊界", "訊號塔下", "舊機場", "星門遺跡", "軌道殘骸", "封鎖線", "工業港", "發電廠外", "荒漠哨站"],
                "noun": "外星先遣小隊",
                "intro": "{place}正有一支全副武裝的外星先遣巡邏隊行軍經過，他們的脈衝步槍微微泛著藍光，空氣裡瀰漫著臭氧味！",
                "options": lambda p: [
                    opt("fight", "先發制人伏擊巡邏隊", [{"op": "combat", "mode": "character"}], "{party}搶在對方列陣前率先發動攻擊！"),
                    opt("stealth", "關燈熄火靜靜等他們走遠", [check_eff("psyche", 55, [{"op": "world_minutes", "amount": 30}], [{"op": "combat", "mode": "character"}])], "{party}把車躲進殘垣陰影裡，連大氣都不敢喘一口。"),
                ],
            },
            {
                "artRef": "road_085", "building": False, "npc": False, "polarity": "bad",
                "places": ["路邊機堡", "橋頭柱", "牆角支架", "舊哨亭", "鐵塔基座", "大門兩側", "高台", "廢車頂", "隧道頂", "檢疫口"],
                "noun": "失控自動機槍塔",
                "intro": "{place}架設的舊時代自動機槍塔突然轉動砲管，紅外線感應器發出「嗶嗶」急促警報，槍口正慢慢對準車頭！",
                "options": lambda p: [
                    opt("destroy", "打爆這座失控機槍塔", [{"op": "combat", "mode": "character", "enemy_category": "machine"}], "{party}立刻翻滾找掩護，瞄準機槍塔的感應核心反擊！"),
                    opt("hack", "趁掃描空檔切斷電源線", [check_eff("psyche", 58, [{"op": "resource", "key": "scrap", "amount": 3}], [{"op": "damage", "target": "vehicle", "amount": 5}])], "{party}抓準砲塔轉向的瞬間衝向配電箱。"),
                ],
            },
            {
                "artRef": "road_081", "building": False, "npc": False, "polarity": "bad",
                "places": ["沙丘下", "乾裂鹽田", "鬆軟土坡", "荒漠公路", "乾涸河道", "碎石荒原", "裂縫帶", "紅土溝", "枯草坡", "舊礦道"],
                "noun": "地底巨蟲震動",
                "intro": "{place}的柏油路面忽然劇烈隆起，碎石像沸水般跳動，一頭長滿環節甲殼的巨型沙蟲破土而出！",
                "options": lambda p: [
                    opt("fight", "迎擊這頭地底怪物", [{"op": "combat", "mode": "character"}], "沙塵漫天，{party}舉起武器死守車身！"),
                    opt("escape", "全速蛇行衝出震動區", [{"op": "attempt_escape", "mode": "vehicle"}], "{party}猛踩油門在裂開的路面間蛇行逃離！"),
                ],
            },
            {
                "artRef": "road_080", "building": False, "npc": False, "polarity": "bad",
                "places": ["高速直道", "鹽湖公路", "高架路段", "沙海通道", "工業大道", "海岸線", "廢城外環", "丘陵坡道", "礦區運路", "荒原主線"],
                "noun": "外星獵殺艇追擊",
                "intro": "一架貼地飛行的外星輕型獵殺艇在{place}後方低空壓進，推進器捲起碎石與火星，顯然把這輛車列為了清除目標！",
                "options": lambda p: [
                    opt("fight", "在公路上展開載具纏鬥", [{"op": "combat", "mode": "vehicle"}], "{party}緊抓方向盤，在高速行進中與異星獵殺艇正面交鋒！"),
                    opt("escape", "鑽進廢墟小路擺脫鎖定", [{"op": "attempt_escape", "mode": "vehicle"}], "{party}急轉駛入狹窄殘垣，試圖甩脫空中的追擊！"),
                ],
            },
            {
                "artRef": "road_082", "building": False, "npc": False, "polarity": "bad",
                "places": ["腐化沼澤", "廢水廠", "酸液池", "化工場", "死水潭", "地下水道", "排污口", "爛泥溝", "毒霧谷", "沉陷路面"],
                "noun": "酸液變異體",
                "intro": "{place}冒出一串墨綠色氣泡，幾頭渾身滴落腐蝕黏液的變異生物爬上路肩，所過之處柏油滋滋作響！",
                "options": lambda p: [
                    opt("fight", "拉開距離消滅變異體", [{"op": "combat", "mode": "character"}], "{party}避免被黏液濺到，舉起武器展開清理！"),
                    opt("detour", "立刻倒車繞開毒沼（耗油 2）", [{"op": "travel_cost", "fuel": 2}], "{party}不敢讓輪胎沾上腐蝕黏液，趕緊繞路而行。", [{"resource": "fuel", "minimum": 2}]),
                ],
            },
            {
                "artRef": "road_083", "building": False, "npc": False, "polarity": "bad",
                "places": ["斷電市區", "霧鎖大橋", "荒廢墓園", "高壓電站", "裂隙邊緣", "古舊隧道", "發光石陣", "磁暴區", "廢棄實驗室", "白霜原野"],
                "noun": "幽靈能體襲擊",
                "intro": "{place}的空氣驟然降溫，車內收音機爆出刺耳雜訊，幾道半透明的發光幽影穿透車窗撲面而來！",
                "options": lambda p: [
                    opt("fight", "迎戰這些異常能量體", [{"op": "combat", "mode": "character"}], "{party}穩住心神，對準飄忽不定的幽影發動反擊！"),
                    opt("resist", "集中意志硬扛精神衝擊並突圍", [check_eff("psyche", 55, [{"op": "world_minutes", "amount": 15}], [{"op": "damage", "target": "party", "amount": 4}])], "{party}咬緊牙關抵擋腦海裡的低語，加速衝出異常區。"),
                ],
            },
        ],
    },
    {
        "d12": 6,
        "id": "cat_06",
        "name": "天災與異常天候",
        "desc": "酸雨、沙塵暴、乾雷、濃霧、冰雹與外星改造留下的劇烈異常氣候。",
        "archetypes": [
            {
                "artRef": "road_060", "building": False, "npc": False, "polarity": "bad",
                "places": ["黃褐色", "墨綠色", "刺鼻", "硫磺味", "細密", "傾盆", "灰濛", "灼人", "油膩", "冰冷"],
                "noun": "酸雨驟降",
                "intro": "天空轉眼壓低，一場{place}酸雨狠狠砸在擋風玻璃上，雨刷才刮了兩下就開始冒出白煙，車漆發出細微的滋滋聲。",
                "options": lambda p: [
                    opt("shelter", "立刻找高架橋下躲雨（消耗 45 分鐘）", [{"op": "world_minutes", "amount": 45}], "{party}把車躲進水泥橋底，等酸雨雲團飄走後才重新上路。"),
                    opt("push", "硬著頭皮衝過去（車況受損）", [{"op": "damage", "target": "vehicle", "amount": 3}], "{party}顧不得車漆被腐蝕，踩緊油門強行穿過酸雨帶。"),
                ],
            },
            {
                "artRef": "road_061", "building": False, "npc": False, "polarity": "bad",
                "places": ["遮天蔽日", "赤紅", "捲石", "尖嘯", "黃沙", "鐵鏽粉", "狂暴", "雙旋", "低壓", "滾滾"],
                "noun": "沙塵暴",
                "intro": "地平線升起一堵{place}沙塵暴高牆，能見度瞬間掉到三公尺以內，狂風把砂礫狠狠拍打在車窗上！",
                "options": lambda p: [
                    opt("wait", "拉手煞車熄火原地等待（消耗 60 分鐘）", [{"op": "world_minutes", "amount": 60}, {"op": "stamina_cost", "amount": 1}], "{party}用布條塞住車門縫，在搖晃的車廂裡熬過了沙塵暴。"),
                    opt("drive", "憑方向感慢慢摸黑前進", [check_eff("speed", 55, [{"op": "resource", "key": "fuel", "amount": -1}], [{"op": "damage", "target": "vehicle", "amount": 4}, {"op": "resource", "key": "fuel", "amount": -2}])], "{party}打起雙黃燈，死盯著路肩白線一點點往前挪。"),
                ],
            },
            {
                "artRef": "road_062", "building": False, "npc": False, "polarity": "bad",
                "places": ["紫藍", "連環", "落地", "低空", "球狀", "磁暴", "靜電", "劈裂", "無雨", "密集"],
                "noun": "乾雷風暴",
                "intro": "烏雲在頭頂翻滾卻一滴雨也沒落，一道道{place}乾雷接連劈在路旁電線桿上，整輛車的金屬外殼都開始滋滋放電！",
                "options": lambda p: [
                    opt("ground", "遠離高大鐵塔慢慢繞行（耗油 1）", [{"op": "travel_cost", "fuel": 1}, {"op": "world_minutes", "amount": 25}], "{party}避開高壓電線與鐵塔，有驚無險地繞過雷擊區。", [{"resource": "fuel", "minimum": 1}]),
                    opt("dash", "全速衝過雷雲籠罩區", [check_eff("speed", 55, [], [{"op": "damage", "target": "vehicle", "amount": 4}, {"op": "damage", "target": "actor", "amount": 2}])], "{party}在閃電交織的公路上狂飆突圍！"),
                ],
            },
            {
                "artRef": "road_063", "building": False, "npc": False, "polarity": "bad",
                "places": ["乳白", "死寂", "腥臭", "冰寒", "螢光", "鐵鏽味", "厚重", "低垂", "無風", "粘稠"],
                "noun": "異常濃霧",
                "intro": "前方公路突然被一片{place}異常濃霧吞沒，車燈打出去只剩一片白茫茫的回光，連儀表板上的指南針都開始亂轉。",
                "options": lambda p: [
                    opt("slow", "放慢車速小心探路（消耗 40 分鐘）", [{"op": "world_minutes", "amount": 40}, {"op": "stamina_cost", "amount": 1}], "{party}派人探頭盯著路緣，花了不少時間才平安穿出濃霧。"),
                    opt("sense", "憑直覺與超感判斷方向", [check_eff("psyche", 50, [{"op": "oracle", "table": "supplies"}], [{"op": "damage", "target": "vehicle", "amount": 3}])], "{party}屏息感應霧中的氣流與路況。"),
                ],
            },
            {
                "artRef": "road_060", "building": False, "npc": False, "polarity": "bad",
                "places": ["拳頭大", "尖銳", "突如其來", "夾風", "密如子彈", "灰白", "帶泥", "狂砸", "暴烈", "轟鳴"],
                "noun": "冰雹風暴",
                "intro": "氣溫在三分鐘內暴跌，{place}冰雹噼里啪啦砸在車頂上，震耳欲聾的撞擊聲讓擋風玻璃出現了蛛網般的細紋！",
                "options": lambda p: [
                    opt("cover", "衝進路旁破雨棚躲避（消耗 35 分鐘）", [{"op": "world_minutes", "amount": 35}], "{party}及時把車塞進鏽蝕雨棚，保住了擋風玻璃。"),
                    opt("endure", "硬扛冰雹繼續趕路", [{"op": "damage", "target": "vehicle", "amount": 4}], "車頂被砸出滿坑滿谷的凹痕，好在引擎沒熄火。"),
                ],
            },
            {
                "artRef": "road_061", "building": False, "npc": False, "polarity": "bad",
                "places": ["炙熱", "火星紛飛", "焦味", "乾裂", "灼風", "熱浪", "滾燙", "枯草焚燒", "塵火", "高溫"],
                "noun": "焚風熱浪",
                "intro": "{place}焚風熱浪從乾燥山谷席捲而來，車內像蒸籠般令人窒息，水溫表指針一路飆向紅區！",
                "options": lambda p: [
                    opt("cool", "停車掀開引擎蓋散熱（消耗 30 分鐘）", [{"op": "world_minutes", "amount": 30}, {"op": "stamina_cost", "amount": 2}], "{party}找了片岩壁陰影替引擎降溫，眾人也趁機喘口氣。"),
                    opt("push", "無視高溫硬撐開出去", [{"op": "damage", "target": "vehicle", "amount": 3}, {"op": "stamina_cost", "amount": 2}], "水箱一路發出危險的嘶嘶聲，總算熬出了熱浪帶。"),
                ],
            },
            {
                "artRef": "road_064", "building": False, "npc": False, "polarity": "bad",
                "places": ["餘震", "斷層", "低鳴", "裂地", "山體滑動", "橋柱晃動", "土石滾落", "地殼呻吟", "路面龜裂", "劇烈搖晃"],
                "noun": "突發地震",
                "intro": "車身忽然像開在波浪上般左右劇烈甩動，{place}讓整條公路發出沉悶轟鳴，山坡上的碎石嘩啦啦滾向車道！",
                "options": lambda p: [
                    opt("dodge", "急打方向盤閃避落石", [check_eff("speed", 52, [], [{"op": "damage", "target": "vehicle", "amount": 5}])], "{party}在顛簸的柏油路上死命閃躲滾落的巨石！"),
                    opt("stop", "立刻停在開闊處護頭等待（消耗 25 分鐘）", [{"op": "world_minutes", "amount": 25}], "{party}把車停在無遮蔽的空地，平安撐過這波餘震。"),
                ],
            },
            {
                "artRef": "road_063", "building": False, "npc": False, "polarity": "bad",
                "places": ["灰白火山灰", "冷灰燼", "焦黑碎屑", "飄雪般", "厚積", "遮眼", "嗆人", "綿密", "沉重", "陰暗"],
                "noun": "灰燼降落",
                "intro": "天空中飄下{place}灰燼，很快把路面蓋成一片死寂的灰白色，空氣濾芯隨時可能被徹底堵死。",
                "options": lambda p: [
                    opt("clean", "停車包布清理進氣口（消耗 30 分鐘）", [{"op": "world_minutes", "amount": 30}, {"op": "stamina_cost", "amount": 1}], "{party}拿舊衣紮住進氣濾網，避免引擎吸入過多灰燼。"),
                    opt("push", "直接開過去（耗油 2）", [{"op": "travel_cost", "fuel": 2}], "進氣不順讓油耗暴增，好在車子順利穿出了灰燼區。", [{"resource": "fuel", "minimum": 2}]),
                ],
            },
            {
                "artRef": "road_060", "building": False, "npc": False, "polarity": "bad",
                "places": ["暴漲山洪", "潰堤積水", "泥石流", "暴雨淹道", "濁流漫橋", "急流沖刷", "涵洞倒灌", "低窪淹水", "河水倒流", "溪暴漲"],
                "noun": "暴雨洪流",
                "intro": "{place}瞬間淹過半個車輪高度，混濁的泥水夾著斷木橫掃路面，排氣管一旦進水整輛車就會徹底報銷！",
                "options": lambda p: [
                    opt("high", "繞上高處山路避水（耗油 2）", [{"op": "travel_cost", "fuel": 2}, {"op": "world_minutes", "amount": 30}], "{party}及時轉上高地便道，看著洪水在下方奔騰。", [{"resource": "fuel", "minimum": 2}]),
                    opt("ford", "保持高轉速強行涉水", [check_eff("speed", 55, [], [{"op": "damage", "target": "vehicle", "amount": 5}])], "{party}一鼓作氣踩住油門，激起兩道高高水花衝過洪流！"),
                ],
            },
            {
                "artRef": "road_062", "building": False, "npc": False, "polarity": "neutral",
                "places": ["紫紅極光", "綠帶天幕", "靜電微風", "彩虹塵霧", "雙日幻影", "磁場微震", "銀白霜降", "高空流星", "暖風驟起", "雲海裂縫"],
                "noun": "異象天幕",
                "intro": "外星大氣改造器偶爾會留下奇異的副產物——頭頂綻放出{place}，讓這片荒涼公路短暫美得像另一個星球。",
                "options": lambda p: [
                    opt("watch", "靠邊停下欣賞片刻（消耗 15 分鐘）", [{"op": "world_minutes", "amount": 15}, {"op": "heal", "target": "party", "amount": 2}], "難得一見的奇景讓{party}緊繃的心情獲得了片刻喘息。"),
                    opt("collect", "趁微光檢視路旁是否落下異常晶屑", [check_eff("psyche", 45, [{"op": "resource", "key": "scrap", "amount": 2}], [])], "{party}在路邊細心搜尋，撿起幾塊泛著微光的殘片。"),
                ],
            },
        ],
    },
    {
        "d12": 7,
        "id": "cat_07",
        "name": "路況與車輛事故",
        "desc": "斷橋、塌方隧道、爆胎、泥沼陷車、翻覆卡車與考驗駕駛技術的險路。",
        "archetypes": [
            {
                "artRef": "road_056", "building": False, "npc": False, "polarity": "bad",
                "places": ["峽谷", "鐵道", "河口", "高架", "懸索", "拱形", "雙層", "舊省道", "山澗", "運河"],
                "noun": "斷橋阻路",
                "intro": "橫跨前方的{place}大橋在十年前的轟炸中攔腰折斷，裸露鋼筋在風裡低鳴，車隊只能尋找其他過河辦法。",
                "options": lambda p: [
                    opt("detour", "沿河岸便道繞遠路（耗油 3）", [{"op": "travel_cost", "fuel": 3}, {"op": "world_minutes", "amount": 40}], "{party}調轉車頭順著顛簸河岸繞了一大圈，終於回到對岸主路。", [{"resource": "fuel", "minimum": 3}]),
                    opt("bridge", "用廢料臨時鋪木板硬過窄墩", [{"op": "resource", "key": "scrap", "amount": -2}, {"op": "stamina_cost", "amount": 2}], "{party}汗流浹背搭出臨時跳板，驚險把車開過斷口。", [{"resource": "scrap", "minimum": 2}]),
                ],
            },
            {
                "artRef": "road_074", "building": False, "npc": False, "polarity": "bad",
                "places": ["山腹", "海濱", "舊鐵路", "雙向", "積水", "焦黑", "落石", "無燈", "坍塌", "長程"],
                "noun": "塌方隧道",
                "intro": "{place}隧道口堆滿塌落的水泥塊與變形車架，只剩一條勉強能塞進車身的窄縫，頭頂碎石還在偶爾掉落。",
                "options": lambda p: [
                    opt("clear", "下車合力搬開碎石清路（消耗 2 點體力）", [{"op": "stamina_cost", "amount": 2}, {"op": "world_minutes", "amount": 35}], "{party}同心協力挪開擋路巨石，平安穿過了隧道。"),
                    opt("detour", "改走翻山舊道（耗油 2）", [{"op": "travel_cost", "fuel": 2}], "{party}不想被活埋在隧道裡，耗油翻過了山頭。", [{"resource": "fuel", "minimum": 2}]),
                ],
            },
            {
                "artRef": "road_055", "building": False, "npc": False, "polarity": "bad",
                "places": ["鏽鐵釘", "碎玻璃帶", "廢鋼筋", "彈殼堆", "尖石陣", "破鐵皮", "報廢齒輪", "鐵絲圈", "碎磚路", "破路障"],
                "noun": "爆胎危機",
                "intro": "「砰！」一聲悶響，車輪壓過藏在灰塵裡的{place}，方向盤猛地往右一扯，右前輪瞬間癟了下去！",
                "options": lambda p: [
                    opt("patch", "用 1 份廢料補胎換備胎", [{"op": "resource", "key": "scrap", "amount": -1}, {"op": "world_minutes", "amount": 30}], "{party}支起千斤頂手腳麻利地換好輪胎。", [{"resource": "scrap", "minimum": 1}]),
                    opt("limp", "沒有材料，硬撐著慢開磨損底盤", [{"op": "damage", "target": "vehicle", "amount": 4}, {"op": "world_minutes", "amount": 40}], "輪框一路磨出火星，車況又掉了一截。"),
                ],
            },
            {
                "artRef": "road_057", "building": False, "npc": False, "polarity": "bad",
                "places": ["黑泥沼", "流沙帶", "積水爛泥", "崩塌土方", "腐殖泥坑", "鹽鹼軟泥", "油污泥窪", "暴雨土路", "乾裂泥潭", "河灘軟沙"],
                "noun": "陷車泥濘",
                "intro": "輪胎忽然一沉，整輛車陷進了偽裝在乾硬表土下的{place}，油門越踩輪子打滑得越厲害！",
                "options": lambda p: [
                    opt("push", "下車墊石頭合力推車（消耗 2 點體力）", [{"op": "stamina_cost", "amount": 2}, {"op": "world_minutes", "amount": 30}], "{party}渾身濺滿泥點，總算把車推回硬地。"),
                    opt("rev", "猛轟油門硬衝脫困（耗油 2）", [{"op": "travel_cost", "fuel": 2}], "引擎咆哮著噴出大片黑煙，總算甩開泥漿衝了出來。", [{"resource": "fuel", "minimum": 2}]),
                ],
            },
            {
                "artRef": "road_058", "building": False, "npc": False, "polarity": "bad",
                "places": ["油罐車", "貨櫃聯結車", "水泥車", "軍用卡車", "雙層巴士", "吊臂工程車", "砂石車", "裝甲運兵車", "垃圾車", "冷凍貨車"],
                "noun": "翻覆巨車堵道",
                "intro": "一輛生鏽的{place}側翻在公路正中央，把雙向車道堵得嚴嚴實實，車體旁還散落著各種雜物。",
                "options": lambda p: [
                    opt("squeeze", "貼著路肩慢速硬擠過去", [check_eff("speed", 50, [{"op": "resource", "key": "scrap", "amount": 1}], [{"op": "damage", "target": "vehicle", "amount": 3}])], "{party}收起後照鏡，小心翼翼貼著邊緣磨過去。"),
                    opt("loot_detour", "順手翻找殘骸再繞路（耗油 1）", [{"op": "travel_cost", "fuel": 1}, {"op": "oracle", "table": "supplies"}], "{party}先從車頭翻出點物資，再繞道而行。", [{"resource": "fuel", "minimum": 1}]),
                ],
            },
            {
                "artRef": "road_059", "building": False, "npc": False, "polarity": "bad",
                "places": ["水箱開鍋", "皮帶鬆脫", "火星塞積碳", "油管微漏", "離合器打滑", "煞車過熱", "軸承異響", "電瓶接觸不良", "排氣管脫落", "方向機卡頓"],
                "noun": "車輛突發故障",
                "intro": "引擎蓋下忽然傳來不祥的金屬敲擊聲，原來是{place}！要是不趁現在處理，車子隨時可能半路拋錨。",
                "options": lambda p: [
                    opt("fix", "花 1 份廢料徹底修好", [{"op": "resource", "key": "scrap", "amount": -1}, {"op": "heal", "target": "vehicle", "amount": 3}, {"op": "world_minutes", "amount": 25}], "{party}掀開引擎蓋敲敲打打，把毛病徹底排除，車況反而更順了。", [{"resource": "scrap", "minimum": 1}]),
                    opt("patch", "只靠手邊工具勉強應急（消耗 1 點體力）", [{"op": "stamina_cost", "amount": 1}, {"op": "damage", "target": "vehicle", "amount": 2}], "{party}拿鐵絲臨時綁牢，勉強還能繼續開。"),
                ],
            },
            {
                "artRef": "road_056", "building": False, "npc": False, "polarity": "bad",
                "places": ["天坑", "地陷", "彈坑群", "管線爆裂", "路基掏空", "裂谷", "沉降帶", "焦坑", "崩崖", "斷層溝"],
                "noun": "路面塌陷",
                "intro": "前方柏油路憑空缺了一大塊，露出黑漆漆的{place}，要不是煞車踩得夠快，整輛車差點直接栽下去！",
                "options": lambda p: [
                    opt("detour", "倒車尋找支線繞行（耗油 2）", [{"op": "travel_cost", "fuel": 2}], "{party}倒退幾百公尺轉進小路，安全繞過塌陷區。", [{"resource": "fuel", "minimum": 2}]),
                    opt("edge", "貼著僅剩的狹窄路沿慢行", [check_eff("speed", 55, [], [{"op": "damage", "target": "vehicle", "amount": 4}])], "輪胎離懸崖只剩半個手掌寬，{party}冷汗直流地開了過去。"),
                ],
            },
            {
                "artRef": "road_058", "building": False, "npc": False, "polarity": "neutral",
                "places": ["連環追撞", "撤離車陣", "焦黑殘骸", "廢棄車隊", "堵死匝道", "塞爆隧道口", "荒廢收費廣場", "橋面車海", "十字路口殘骸", "高架塞車帶"],
                "noun": "末日塞車陣",
                "intro": "十年前人們逃離城市時留下的{place}至今仍綿延數百公尺，一輛輛空車像石化的甲蟲般佔滿整條公路。",
                "options": lambda p: [
                    opt("weave", "耐著性子在車縫間繞行（消耗 30 分鐘）", [{"op": "world_minutes", "amount": 30}], "{party}左拐右彎穿過死寂的車海，總算重見開闊路面。"),
                    opt("scavenge", "順手搜刮幾輛車的油箱與置物箱", [{"op": "resource", "key": "fuel", "amount": 2}, {"op": "resource", "key": "scrap", "amount": 2}, {"op": "world_minutes", "amount": 40}], "{party}在幾輛無主車裡翻出殘油與零散工具。"),
                ],
            },
            {
                "artRef": "road_057", "building": False, "npc": False, "polarity": "bad",
                "places": ["盤山髮夾彎", "碎石陡坡", "結冰下坡", "無護欄崖道", "單線木橋", "塌邊山路", "滑石斜坡", "積沙急彎", "顛簸石板道", "泥滑長坡"],
                "noun": "險峻路段",
                "intro": "公路進入一段極其難纏的{place}，輪胎抓地力明顯不足，稍有閃失就會滑下深溝。",
                "options": lambda p: [
                    opt("careful", "掛低速檔一步步慢慢開（消耗 35 分鐘）", [{"op": "world_minutes", "amount": 35}, {"op": "stamina_cost", "amount": 1}], "{party}全神貫注控制油門與煞車，穩穩通過險段。"),
                    opt("fast", "靠老練車技俐落切過", [check_eff("speed", 55, [], [{"op": "damage", "target": "vehicle", "amount": 3}])], "{party}抓準角度俐落過彎，省下不少時間。"),
                ],
            },
            {
                "artRef": "road_055", "building": False, "npc": False, "polarity": "neutral",
                "places": ["濃密荊棘", "倒塌電桿", "吹落鐵皮", "枯倒巨樹", "破廣告架", "傾倒路牌", "亂石堆", "鐵絲圍欄", "倒塌鷹架", "斷裂橋欄"],
                "noun": "雜物擋路",
                "intro": "昨晚的怪風把{place}整個掀翻在馬路中間，想開過去非得先清理出一條通道不可。",
                "options": lambda p: [
                    opt("clear", "下車動手搬開雜物（消耗 1 點體力）", [{"op": "stamina_cost", "amount": 1}, {"op": "resource", "key": "scrap", "amount": 1}], "{party}清出車道，還順手挑了塊好鐵皮收進車裡。"),
                    opt("ram", "直接用保險桿慢慢頂開", [{"op": "damage", "target": "vehicle", "amount": 2}], "車頭刮出幾道白痕，總算把障礙推到路邊。"),
                ],
            },
        ],
    },
    {
        "d12": 8,
        "id": "cat_08",
        "name": "舊世界遺跡與歷史",
        "desc": "報攤、書車、紀念牆、廣播站與記錄外星降臨那年真相的殘存碎片。",
        "archetypes": [
            {
                "artRef": "road_029", "building": True, "placeSuffix": "報攤", "npc": False, "polarity": "good",
                "places": ["焚風", "鐵皮", "車站", "老街", "紅頂", "斷電", "風化", "轉角", "高架下", "木架"],
                "noun": "舊報攤",
                "intro": "{place}舊報攤的玻璃櫃裡還壓著十年前最後一期的頭版報紙，斗大的鉛字記錄著外星母艦遮蔽天空的那個早晨。",
                "options": lambda p: [
                    opt("read", "拂去灰塵，細讀留下的紀錄", [{"op": "reveal_history"}], "{party}翻開泛黃的報紙與手寫筆記，拼湊出一段失落的歷史。"),
                    opt("leave", "放下手邊發現，轉身離開", [], "{party}沒有多作停留，回到車上繼續向東。"),
                ],
            },
            {
                "artRef": "road_028", "building": True, "placeSuffix": "書車", "npc": False, "polarity": "good",
                "places": ["巡迴", "市立", "褪色藍", "童書", "鄉村", "鐵皮", "老舊", "翻斜", "林間", "廣場"],
                "noun": "行動書車",
                "intro": "{place}行動書車的側門敞開著，書架上東倒西歪散落著地圖集、百科全書與夾滿書籤的舊日記。",
                "options": lambda p: [
                    opt("read", "翻閱裡頭保存的紀錄與地圖", [{"op": "reveal_history"}, {"op": "world_minutes", "amount": 20}], "{party}從夾頁裡找到一段詳實的災變手記。"),
                    opt("loot", "順手帶走實用的維修手冊與零件", [{"op": "resource", "key": "scrap", "amount": 2}], "{party}在駕駛座底下翻出實用的零件包。"),
                ],
            },
            {
                "artRef": "road_030", "building": False, "npc": False, "polarity": "good",
                "places": ["尋人啟事", "粉筆", "照片", "紅磚", "候車亭", "高架柱", "醫院外", "鐵柵", "廣場", "車站"],
                "noun": "紀念牆",
                "intro": "{place}紀念牆上貼滿褪色照片與歪斜字跡，寫著「我們往東走了」、「若還活著請去綠洲」，風吹得紙角沙沙作響。",
                "options": lambda p: [
                    opt("read", "駐足辨認牆上的留言", [{"op": "reveal_history"}, {"op": "morality", "delta": 3}], "{party}靜靜讀完這些十年前留下的牽掛，心裡多了幾分重量。"),
                    opt("leave", "默哀片刻後繼續上路", [], "{party}輕聲關上車門，朝著牆上指明的東方駛去。"),
                ],
            },
            {
                "artRef": "road_026", "building": True, "placeSuffix": "廣播站", "npc": False, "polarity": "good",
                "places": ["緊急民防", "山頭", "路況", "地方", "氣象", "海岸", "鐵道", "校區", "地下", "轉播"],
                "noun": "廢棄廣播站",
                "intro": "{place}廢棄廣播站的發射塔已經折斷半截，但錄音室裡的盤式磁帶機旁邊還放著幾卷標記著「最後播報」的磁帶。",
                "options": lambda p: [
                    opt("play", "接上車用電瓶試聽殘存錄音", [{"op": "reveal_history"}], "沙沙的電流雜音裡傳出十年前播音員微微顫抖卻堅定的聲音。"),
                    opt("salvage", "拆下完好的電子零件", [{"op": "resource", "key": "scrap", "amount": 3}], "{party}拆下一批精密線圈與開關。"),
                ],
            },
            {
                "artRef": "road_027", "building": False, "npc": False, "polarity": "good",
                "places": ["不鏽鋼", "學校操場", "市政府前", "公園樹下", "鐵箱", "防水筒", "基座下", "雕像旁", "廣場磚下", "鐘樓底"],
                "noun": "時光膠囊",
                "intro": "翻開的石板下露出一只{place}時光膠囊，銘牌上刻著「給未來的市民」，顯然原本沒打算在這種世道被打開。",
                "options": lambda p: [
                    opt("open", "打開膠囊看看舊世界的禮物", [{"op": "reveal_history"}, {"op": "oracle", "table": "supplies"}], "裡面除了手寫信與舊照片，還意外塞著當時的防災補給包。"),
                    opt("leave", "替它蓋回石板", [{"op": "morality", "delta": 2}], "{party}把石板輕輕放回原位，留給下一個有緣人。"),
                ],
            },
            {
                "artRef": "road_029", "building": False, "npc": False, "polarity": "good",
                "places": ["火車站", "客運總站", "港口碼頭", "航空站", "地鐵口", "體育館", "展覽館", "市政廳", "舊郵局", "大劇院"],
                "noun": "撤離公告欄",
                "intro": "{place}外的撤離公告欄仍釘著發黃的疏散路線圖與軍管通告，紅筆畫出的箭頭一路指向遙遠的東方。",
                "options": lambda p: [
                    opt("study", "抄錄地圖上的歷史註記", [{"op": "reveal_history"}], "{party}從泛黃通告裡讀出了當年撤離行動失敗的真正原因。"),
                    opt("leave", "看過一眼便上路", [], "{party}記下方向，繼續沿公路東行。"),
                ],
            },
            {
                "artRef": "road_028", "building": False, "npc": False, "polarity": "neutral",
                "places": ["傾倒", "破敗", "生鏽", "焦黑", "長滿藤蔓", "半埋沙中", "反光", "彈孔累累", "歪斜", "蒙塵"],
                "noun": "舊時代廣告牌",
                "intro": "一塊巨大的{place}舊時代廣告牌立在荒原上，微笑的模特兒正舉著早就不復存在的汽水，下方有人用紅漆寫了段長長的控訴。",
                "options": lambda p: [
                    opt("read", "停下來讀完紅漆留言", [{"op": "reveal_history"}], "那段字跡揭露了外星佔領初期某座城市反抗軍的最後去向。"),
                    opt("salvage", "拆下支架上的鋼索與螺絲", [{"op": "resource", "key": "scrap", "amount": 2}], "{party}順手拆走幾根結實的鋼索。"),
                ],
            },
            {
                "artRef": "road_026", "building": False, "npc": False, "polarity": "good",
                "places": ["廢棄警局", "消防分隊", "氣象局", "水利署", "電力公司", "海關大樓", "大學檔案室", "報社印刷廠", "醫院病歷室", "研究分站"],
                "noun": "殘存檔案櫃",
                "intro": "{place}坍塌的外牆旁露出一排防潮鐵櫃，散落的文件夾裡夾著關於外星物種與變異現象的早期調查報告。",
                "options": lambda p: [
                    opt("read", "翻閱早期調查報告", [{"op": "reveal_history"}], "{party}讀到了當年科學家在淪陷前夜留下的珍貴紀錄。"),
                    opt("search", "翻找櫃子底層的應急裝備", [{"op": "oracle", "table": "equipment"}], "{party}在鐵櫃最下層摸到一件還沒拆封的舊世界裝備！"),
                ],
            },
            {
                "artRef": "road_030", "building": False, "npc": False, "polarity": "good",
                "places": ["石碑", "銅像", "無名墓", "殘翼戰機", "裝甲車碑", "和平鐘", "燈塔", "火炬台", "鐵十字", "防波堤"],
                "noun": "戰役紀念地",
                "intro": "{place}至今仍留著十年前抵抗戰役的焦痕，幾束早已乾枯的野花被人仔細壓在石塊底下。",
                "options": lambda p: [
                    opt("honor", "下車致意並閱讀碑文", [{"op": "reveal_history"}, {"op": "morality", "delta": 4}], "{party}讀完斑駁的銘文，帶著前人的意志繼續上路。"),
                    opt("leave", "鳴笛致敬後緩緩駛過", [], "短促的喇叭聲在空曠公路上迴盪。"),
                ],
            },
            {
                "artRef": "road_027", "building": False, "npc": False, "polarity": "good",
                "places": ["公共電話亭", "郵筒", "自動販賣機", "路邊長椅", "投幣望遠鏡", "候車亭", "派報箱", "舊遊樂場", "露天電影幕", "加油島亭"],
                "noun": "舊世界日常殘片",
                "intro": "荒涼公路邊居然完整保留著一座{place}，彷彿時間在災變前一秒突然按下了暫停鍵，旁邊放著一只防水鐵盒。",
                "options": lambda p: [
                    opt("open", "打開鐵盒看看裡面的東西", [{"op": "reveal_history"}, {"op": "resource", "key": "scrap", "amount": 2}], "鐵盒裡放著一捲家書、幾枚舊硬幣和堪用的小工具。"),
                    opt("leave", "不去驚擾這份寧靜", [], "{party}輕輕發動車子，把這片舊日剪影留在後照鏡裡。"),
                ],
            },
        ],
    },
    {
        "d12": 9,
        "id": "cat_09",
        "name": "怪奇現象與超能力",
        "desc": "發光巨石、海市蜃樓、時間錯位、神秘訊號與激發心靈潛能的詭異奇景。",
        "archetypes": [
            {
                "artRef": "road_083", "building": False, "npc": False, "polarity": "neutral",
                "places": ["黑曜", "浮空", "低鳴", "六角", "藍紋", "琥珀", "雙生", "裂縫", "冰冷", "發光"],
                "noun": "異星方尖碑",
                "intro": "公路旁無端矗立著一根{place}異星方尖碑，表面流淌著像水銀般的符號，靠近時太陽穴隱隱傳來共振！",
                "options": lambda p: [
                    opt("touch", "伸手感應方尖碑的能量波動", [check_eff("psyche", 52, [{"op": "heal", "target": "party", "amount": 5}, {"op": "reveal_history"}], [{"op": "damage", "target": "actor", "amount": 3}])], "{party}屏息將掌心貼近發光的碑面。"),
                    opt("leave", "這東西太邪門，踩油門快走", [], "{party}不想跟外星石碑談戀愛，立刻加速離開。"),
                ],
            },
            {
                "artRef": "road_063", "building": False, "npc": False, "polarity": "neutral",
                "places": ["霓虹小鎮", "繁華大街", "綠洲湖泊", "戰前樂園", "雪白城堡", "燈火港口", "金色麥田", "空中列車", "舊日家園", "微笑人群"],
                "noun": "公路海市蜃樓",
                "intro": "熱浪扭曲的地平線上浮現出一座栩栩如生的{place}，甚至能隱約聽見熙攘人聲，可車越開越近，影像卻像水墨般化開。",
                "options": lambda p: [
                    opt("focus", "集中精神識破幻象尋找實物", [check_eff("psyche", 50, [{"op": "oracle", "table": "supplies"}], [{"op": "world_minutes", "amount": 30}])], "{party}穩住心神穿過扭曲光影，仔細分辨真假。"),
                    opt("ignore", "無視幻象，盯緊柏油路往前開", [], "{party}搖搖頭甩開恍惚感，專心看路。"),
                ],
            },
            {
                "artRef": "road_026", "building": False, "npc": False, "polarity": "neutral",
                "places": ["倒播人聲", "摩斯電碼", "童謠旋律", "未來預報", "太空雜音", "重複座標", "心跳節拍", "陌生呼救", "金屬共鳴", "低語廣播"],
                "noun": "幽靈電台訊號",
                "intro": "車載收音機明明沒開，喇叭卻自己亮起綠燈，傳出一段詭異的{place}，頻率隨著車速快慢忽高忽低！",
                "options": lambda p: [
                    opt("trace", "循著訊號最強處查看路旁", [check_eff("psyche", 48, [{"op": "oracle", "table": "equipment"}], [{"op": "stamina_cost", "amount": 2}])], "{party}順著訊號方向在路邊荒草裡仔細搜索。"),
                    opt("off", "一把拔掉收音機保險絲", [], "車廂立刻恢復安靜，{party}鬆了口氣繼續上路。"),
                ],
            },
            {
                "artRef": "road_062", "building": False, "npc": False, "polarity": "neutral",
                "places": ["懸浮碎石", "倒流雨滴", "無重落葉", "飄起鐵罐", "失重沙礫", "反重力水窪", "漂浮路標", "浮空枯枝", "慢動作塵埃", "扭曲光柱"],
                "noun": "重力異常帶",
                "intro": "前方五十公尺的公路出現了詭異的{place}，整輛車開進去時輪胎輕飄飄得像踩在棉花上！",
                "options": lambda p: [
                    opt("grab", "趁機撈起飄在半空的物資箱", [check_eff("speed", 52, [{"op": "oracle", "table": "supplies"}], [{"op": "damage", "target": "vehicle", "amount": 3}])], "{party}探出車窗伸手去抓那只慢悠悠旋轉的箱子！"),
                    opt("crawl", "穩住方向盤低速滑出異常區", [{"op": "world_minutes", "amount": 20}], "{party}不敢亂動方向盤，緩緩滑出了重力異常帶。"),
                ],
            },
            {
                "artRef": "road_030", "building": False, "npc": False, "polarity": "neutral",
                "places": ["重疊里程碑", "同一棵枯樹", "重複彎道", "倒走時鐘", "靜止飛鳥", "無盡直道", "雙重影子", "回音山谷", "停擺紅綠燈", "似曾相識的站牌"],
                "noun": "時間迴圈錯覺",
                "intro": "明明已經開了十分鐘，窗外卻第三次出現了{place}——儀表板上的電子鐘更是在同一分鐘之間反覆跳動！",
                "options": lambda p: [
                    opt("break", "以心靈意志鎖定真實方向突圍", [check_eff("psyche", 50, [{"op": "reveal_history"}], [{"op": "travel_cost", "fuel": 2}])], "{party}閉上眼憑直覺踩下油門，試圖撕破這層詭異的空間摺疊。"),
                    opt("wait", "原地熄火等空間異常消散（消耗 45 分鐘）", [{"op": "world_minutes", "amount": 45}], "一陣微風拂過，前方的公路終於恢復正常延伸。"),
                ],
            },
            {
                "artRef": "road_083", "building": False, "npc": False, "polarity": "good",
                "places": ["琥珀", "星塵", "翠綠", "冰藍", "紫霧", "銀光", "金紋", "虹彩", "暖光", "月白"],
                "noun": "心靈共鳴晶簇",
                "intro": "路肩岩縫長出一叢散發溫熱微光的{place}共鳴晶簇，靠近時腦海裡的疲憊竟然像被溫水沖淡了一樣。",
                "options": lambda p: [
                    opt("meditate", "靠在車旁吸收共鳴能量（消耗 20 分鐘）", [{"op": "world_minutes", "amount": 20}, {"op": "heal", "target": "party", "amount": 4}], "柔和的光暈包裹著{party}，傷勢與疲勞都減輕了不少。"),
                    opt("harvest", "敲下一塊晶體當作交易廢料", [{"op": "resource", "key": "scrap", "amount": 3}], "{party}小心敲下幾塊閃亮結晶收進背包。"),
                ],
            },
            {
                "artRef": "road_024", "building": False, "npc": False, "polarity": "neutral",
                "places": ["半透明身影", "戰前派對", "無聲餐館", "舊日車站", "光影孩童", "幽藍車燈", "殘影商隊", "雨中撐傘人", "空蕩舞廳", "老式電車"],
                "noun": "殘影重播",
                "intro": "公路旁的廢墟裡突然浮現出十年前的{place}全息殘影，像壞掉的投影機般無聲重播著災變前最後的日常。",
                "options": lambda p: [
                    opt("watch", "仔細觀察殘影藏著的線索", [{"op": "reveal_history"}], "殘影消散前，{party}看清了背景裡隱藏的一段關鍵真相。"),
                    opt("search", "順著殘影指的方向翻找遺物", [{"op": "resource", "key": "scrap", "amount": 2}], "{party}在殘影消失的角落翻出了幾件保存完好的舊物。"),
                ],
            },
            {
                "artRef": "road_082", "building": False, "npc": False, "polarity": "neutral",
                "places": ["發光蒲公英", "玻璃花海", "銀葉灌木", "會呼吸的苔蘚", "夜光蘑菇圈", "懸浮種子", "金屬紋藤蔓", "星點水草", "鳴響蘆葦", "晶化樹林"],
                "noun": "異變植物園",
                "intro": "公路兩旁長滿了地球原本絕不存在的{place}，在風裡發出風鈴般清脆的響聲，既美麗又透著說不出的詭異。",
                "options": lambda p: [
                    opt("sample", "採集無害汁液製成急救藥", [check_eff("psyche", 48, [{"op": "resource", "key": "medicine", "amount": 2}], [{"op": "damage", "target": "actor", "amount": 2}])], "{party}小心翼翼辨別無毒植株並採集汁液。"),
                    opt("leave", "遠觀就好，別亂碰外星植物", [], "{party}緊閉車窗駛離這片奇異花海。"),
                ],
            },
            {
                "artRef": "road_062", "building": False, "npc": False, "polarity": "neutral",
                "places": ["高壓鐵塔", "廢變電站", "磁力隕石", "藍弧球體", "金屬風鈴陣", "發光線圈", "雷擊樹樁", "異星中繼站", "舊雷達碟", "磁暴裂縫"],
                "noun": "磁場奇點",
                "intro": "{place}正發出低沉的電磁嗡鳴，車上所有金屬鑰匙和工具都微微顫動，連車燈亮度都變得忽明忽暗。",
                "options": lambda p: [
                    opt("charge", "利用磁場替車輛與設備充能", [check_eff("defense", 50, [{"op": "heal", "target": "vehicle", "amount": 4}, {"op": "resource", "key": "scrap", "amount": 2}], [{"op": "damage", "target": "vehicle", "amount": 3}])], "{party}抓準磁脈衝間隙調校線路。"),
                    opt("pass", "迅速駛離干擾範圍", [], "{party}猛踩油門衝出磁場圈，儀表板立刻恢復正常。"),
                ],
            },
            {
                "artRef": "road_027", "building": False, "npc": False, "polarity": "neutral",
                "places": ["未拆封快遞", "發光懷錶", "無字黑書", "異星魔方", "舊音樂盒", "星圖羅盤", "銀色護符", "神秘鑰匙", "透明沙漏", "微溫石球"],
                "noun": "路中奇物",
                "intro": "空蕩蕩的馬路正中央端正擺著一件{place}，四周沒有任何腳印或輪胎痕，簡直像是專門放在這裡等{hero}經過一樣。",
                "options": lambda p: [
                    opt("take", "停車撿起來研究一番", [check_eff("psyche", 46, [{"op": "oracle", "table": "equipment"}], [{"op": "stamina_cost", "amount": 2}])], "{party}把這件奇物捧在手裡細細端詳。"),
                    opt("leave", "來路不明的東西少碰為妙", [], "{party}繞過路中央的奇物，頭也不回地開走。"),
                ],
            },
        ],
    },
    {
        "d12": 10,
        "id": "cat_10",
        "name": "救援、抉擇與道德",
        "desc": "受困倖存者、正在發生的搶劫、乞討與考驗良心或冷血的公路抉擇。",
        "archetypes": [
            {
                "artRef": "road_014", "building": False, "npc": True, "polarity": "good",
                "places": ["塌屋下", "翻覆車內", "涵洞裡", "斷橋下", "鐵網後", "乾井底", "貨櫃內", "山坡溝", "廢工場", "碎石堆"],
                "noun": "受困倖存者",
                "intro": "{place}傳來微弱的敲擊與呼救聲！一名旅人被重物壓住了腳踝，見有人經過便拼命揮手求救。",
                "options": lambda p: [
                    opt("save", "立刻下車搬開重物救人（消耗 2 點體力）", [{"op": "stamina_cost", "amount": 2}, {"op": "morality", "delta": 10}, {"op": "npc_interaction", "service": "npc_trade"}], "{party}費盡力氣把人拖了出來，對方熱淚盈眶地緊握著雙手道謝！"),
                    opt("loot", "趁人之危搜走對方的物資", [{"op": "morality", "delta": -15}, {"op": "oracle", "table": "supplies"}], "{party}冷冷拿走對方的背包後轉身離開，背後只剩絕望的怒罵。"),
                    opt("leave", "不想惹麻煩，假裝沒聽見", [{"op": "morality", "delta": -4}], "{party}調高引擎轉速蓋過呼救聲，加速駛離。"),
                ],
            },
            {
                "artRef": "road_065", "building": False, "npc": True, "polarity": "neutral",
                "places": ["空地旁", "破加油站", "橋頭下", "貨車邊", "荒村口", "路肩", "休息區", "倉庫外", "市場邊", "岔道口"],
                "noun": "公路搶劫現場",
                "intro": "{place}正上演一場明目張膽的搶劫——幾名持刀掠奪者把一名無助的旅人逼在牆角，正準備搶走他的全部家當！",
                "options": lambda p: [
                    opt("intervene", "拔刀相助擊退掠奪者", [{"op": "morality", "delta": 12}, {"op": "combat", "mode": "character"}], "{party}一聲喝斥衝上前去，替受害者擋下刀鋒！"),
                    opt("join", "趁亂分一杯羹搶走物資", [{"op": "morality", "delta": -18}, {"op": "resource", "key": "scrap", "amount": 4}, {"op": "resource", "key": "fuel", "amount": 2}], "{party}趁亂撈走大批物資揚長而去，道德底線又往下掉了一截。"),
                    opt("ignore", "事不關己，踩油門繞過", [{"op": "morality", "delta": -3}], "{party}目不斜視地開過現場。"),
                ],
            },
            {
                "artRef": "road_016", "building": False, "npc": True, "polarity": "neutral",
                "places": ["路邊石階", "枯樹陰影", "破棚下", "廢巴士站", "橋墩旁", "乾涸水塔", "殘牆下", "沙丘邊", "舊診所外", "鐵道口"],
                "noun": "重傷乞藥旅人",
                "intro": "{place}蜷縮著一名發高燒的旅人，額頭燙得嚇人，顫抖著伸出手懇求分給他一份藥品救命。",
                "options": lambda p: [
                    opt("give", "慷慨贈送 1 份藥品", [{"op": "resource", "key": "medicine", "amount": -1}, {"op": "morality", "delta": 12}, {"op": "oracle", "table": "equipment"}], "旅人服下藥後氣色漸穩，將自己珍藏的一件裝備硬塞給{party}作為報答。", [{"resource": "medicine", "minimum": 1}]),
                    opt("rob", "趁他虛弱搜刮他的口袋", [{"op": "morality", "delta": -15}, {"op": "resource", "key": "scrap", "amount": 3}], "{party}翻走了對方僅存的廢料，連頭都沒回。"),
                    opt("leave", "藥品緊缺，婉拒離開", [{"op": "morality", "delta": -2}], "{party}低聲致歉後轉身上車。"),
                ],
            },
            {
                "artRef": "road_018", "building": False, "npc": True, "polarity": "neutral",
                "places": ["荒原路肩", "上坡半腰", "鹽灘邊", "峽谷直道", "廢城外", "鐵橋頭", "高架下", "沙路旁", "林道口", "收費亭旁"],
                "noun": "斷油求援家庭",
                "intro": "{place}停著一輛熄火的舊休旅車，車主焦急地揮著空油桶，後座還坐著兩名滿臉灰塵的旅伴。",
                "options": lambda p: [
                    opt("share", "分出 3 點汽油幫他們脫困", [{"op": "resource", "key": "fuel", "amount": -3}, {"op": "morality", "delta": 10}, {"op": "resource", "key": "scrap", "amount": 3}], "車主連聲道謝，拿出車上的備用零件回贈{party}。", [{"resource": "fuel", "minimum": 3}]),
                    opt("extort", "趁機敲竹槓收重金才肯給油", [{"op": "resource", "key": "fuel", "amount": -2}, {"op": "resource", "key": "scrap", "amount": 5}, {"op": "morality", "delta": -10}], "對方咬牙掏出全部家當換來這點救命油。", [{"resource": "fuel", "minimum": 2}]),
                    opt("leave", "油箱也不寬裕，直接開走", [], "{party}默默踩下油門駛過。"),
                ],
            },
            {
                "artRef": "road_017", "building": False, "npc": True, "polarity": "neutral",
                "places": ["隱蔽涵洞", "廢棄貨倉", "夜色山道", "枯林深處", "斷壁後方", "舊碼頭", "地下車庫", "荒廢農舍", "鐵皮棚", "砂石堆"],
                "noun": "黑市走私客",
                "intro": "{place}停著一輛沒掛牌照的廂型車，一名戴著墨鏡的走私客壓低聲音問道：「想不想低價收一批『來路不明』的好貨？」",
                "options": lambda p: [
                    opt("buy", "花 3 份廢料買下走私裝備", [{"op": "resource", "key": "scrap", "amount": -3}, {"op": "morality", "delta": -6}, {"op": "oracle", "table": "equipment"}], "{party}不問出處完成了這筆見不得光的交易。", [{"resource": "scrap", "minimum": 3}]),
                    opt("refuse", "拒絕黑貨並勸他收手", [{"op": "morality", "delta": 4}], "走私客嗤笑一聲關上車門，雙方各自離去。"),
                    opt("rob", "黑吃黑直接搶走他的貨", [{"op": "morality", "delta": -14}, {"op": "combat", "mode": "character"}], "{party}拔出武器打算連貨帶人一起吞下！"),
                ],
            },
            {
                "artRef": "road_011", "building": False, "npc": False, "polarity": "neutral",
                "places": ["醫院標記", "孤兒院字樣", "避難所編號", "互助會封條", "紅十字漆印", "村落公用", "救災專送", "民防補給", "義診專用", "難民營標示"],
                "noun": "標記補給箱",
                "intro": "路旁木架上放著一只印有「{place}」的物資箱，顯然是附近弱勢聚落約好來取的救命物資，四周目前沒人看守。",
                "options": lambda p: [
                    opt("steal", "管不了那麼多，整箱搬上車", [{"op": "morality", "delta": -14}, {"op": "oracle", "table": "supplies"}, {"op": "resource", "key": "medicine", "amount": 1}], "{party}把救命物資全數搜刮上車，心裡沉甸甸的。"),
                    opt("add", "不但不拿，還多留 1 份廢料幫忙", [{"op": "resource", "key": "scrap", "amount": -1}, {"op": "morality", "delta": 10}], "{party}在箱子旁多放了一份零件，祝願來取貨的人平安。", [{"resource": "scrap", "minimum": 1}]),
                    opt("leave", "原封不動留在原地", [{"op": "morality", "delta": 3}], "{party}克制住念頭，轉身離開。"),
                ],
            },
            {
                "artRef": "road_019", "building": False, "npc": True, "polarity": "neutral",
                "places": ["岔路口", "廢校旁", "橋頭", "荒原邊", "舊市集", "油站外", "鐵道旁", "山腳下", "破旅店", "水塔旁"],
                "noun": "逃亡通緝犯",
                "intro": "{place}衝出一名氣喘吁吁、滿臉泥灰的逃亡者，聲稱自己被腐敗治安隊誣陷，懇求{hero}載他一程或給點藏身物資。",
                "options": lambda p: [
                    opt("help", "給他 2 份廢料助他逃亡", [{"op": "resource", "key": "scrap", "amount": -2}, {"op": "morality", "delta": 5}, {"op": "reveal_history"}], "對方感激涕零，臨走前說出了一個關於東方封鎖線的秘密。", [{"resource": "scrap", "minimum": 2}]),
                    opt("talk", "先仔細盤問他的來歷", [{"op": "npc_interaction", "service": "npc_trade"}], "{party}決定先聽聽這名逃亡者的說詞再作打算。"),
                    opt("leave", "不想捲入是非，立刻開走", [], "{party}關上車窗迅速駛離。"),
                ],
            },
            {
                "artRef": "road_020", "building": False, "npc": True, "polarity": "good",
                "places": ["枯草地", "碎石坡", "舊車庫", "鐵橋下", "路肩溝", "營地旁", "廢屋角", "沙丘側", "林緣", "貨櫃後"],
                "noun": "迷途幼獸",
                "intro": "{place}躲著一隻腳掌受傷的流浪犬型變異幼獸，眼神裡沒有敵意，只是發抖著舔舐傷口。",
                "options": lambda p: [
                    opt("treat", "花 1 份藥品替牠包紮傷口", [{"op": "resource", "key": "medicine", "amount": -1}, {"op": "morality", "delta": 9}, {"op": "oracle", "table": "supplies"}], "小傢伙包紮完後開心地搖尾巴，竟從草叢裡叼出一袋無主補給報答{party}！", [{"resource": "medicine", "minimum": 1}]),
                    opt("feed", "留點乾糧摸摸牠的頭", [{"op": "morality", "delta": 4}], "小傢伙蹭了蹭掌心，目送車子向東駛去。"),
                ],
            },
            {
                "artRef": "road_014", "building": False, "npc": True, "polarity": "neutral",
                "places": ["十字路", "廢驛站", "修車棚外", "水源地", "市集口", "橋邊", "營火旁", "舊貨場", "油站旁", "山坳口"],
                "noun": "物資爭執",
                "intro": "{place}有兩名旅人為了半桶乾淨汽油爭得面紅耳赤，眼看雙方就要拔刀見血！",
                "options": lambda p: [
                    opt("mediate", "出面調停並分出 1 點汽油平息爭端", [{"op": "resource", "key": "fuel", "amount": -1}, {"op": "morality", "delta": 10}, {"op": "npc_interaction", "service": "npc_trade"}], "雙方在{party}勸說下收起武器，其中一人主動上前致謝並願意交談。", [{"resource": "fuel", "minimum": 1}]),
                    opt("steal", "趁兩人扭打時偷偷提走汽油", [{"op": "morality", "delta": -12}, {"op": "resource", "key": "fuel", "amount": 4}], "{party}神不知鬼不覺把那桶油拎上車揚長而去。"),
                    opt("leave", "別插手別人家的紛爭", [], "{party}繞過爭執現場繼續趕路。"),
                ],
            },
            {
                "artRef": "road_015", "building": False, "npc": True, "polarity": "good",
                "places": ["破校舍", "臨時帳棚", "水壩旁", "廢車站", "高架橋底", "紅磚教堂", "山谷空地", "舊農莊", "海邊燈塔", "礦工宿舍"],
                "noun": "義診與互助營",
                "intro": "{place}聚集了一批照顧老弱的民間志工，物資捉襟見肘，卻仍堅持替路過的旅人提供免費熱水。",
                "options": lambda p: [
                    opt("donate_med", "捐出 1 份藥品支援營地", [{"op": "resource", "key": "medicine", "amount": -1}, {"op": "morality", "delta": 12}, {"op": "heal", "target": "party", "amount": 4}], "志工感動得眼眶泛紅，替{party}徹底整理傷口並送上祝福。", [{"resource": "medicine", "minimum": 1}]),
                    opt("donate_scrap", "捐出 2 份廢料幫忙修補帳棚", [{"op": "resource", "key": "scrap", "amount": -2}, {"op": "morality", "delta": 8}], "營地的破洞總算補了起來，{party}帶著滿心踏實上路。", [{"resource": "scrap", "minimum": 2}]),
                    opt("leave", "道謝喝口熱水後上路", [], "{party}喝完熱水，揮別志工繼續向東。"),
                ],
            },
        ],
    },
    {
        "d12": 11,
        "id": "cat_11",
        "name": "治安、盤查與通緝",
        "desc": "民兵檢查站、外星執法掃描、賞金獵人攔截與戰時宵禁巡邏。",
        "archetypes": [
            {
                "artRef": "road_072", "building": False, "npc": True, "polarity": "neutral",
                "places": ["省界", "大橋", "隧道前", "峽谷口", "工業區", "舊關口", "鐵道旁", "山道", "廢城外", "運河邊"],
                "noun": "民兵檢查站",
                "intro": "{place}民兵檢查站拉起了拒馬，幾名戴著紅臂章的治安隊員舉手示意停車：「例行臨檢！熄火，出示車上物資！」",
                "options": lambda p: [
                    opt("comply", "配合受檢並繳納 1 份廢料通行費", [{"op": "resource", "key": "scrap", "amount": -1}, {"op": "morality", "delta": 3}], "民兵核對完畢，敬了個不怎麼標準的禮便放行了。", [{"resource": "scrap", "minimum": 1}]),
                    opt("bluff", "憑口才周旋免去通行費", [check_eff("psyche", 55, [], [{"op": "resource_loss", "key": "scrap", "amount": 2}])], "{party}鎮定地向隊長說明這趟東行的正當理由。"),
                    opt("break", "拒檢！強行硬闖檢查站", [{"op": "morality", "delta": -15}, {"op": "combat", "mode": "character"}], "哨聲大作！治安隊員舉槍攔截，現場立刻爆發槍戰！"),
                ],
            },
            {
                "artRef": "road_072", "building": False, "npc": False, "polarity": "bad",
                "places": ["藍光拱門", "軌道掃描門", "外星哨塔", "晶石閘口", "懸浮路障", "淨化關卡", "先遣站點", "銀灰檢疫站", "封鎖光幕", "脈衝閘門"],
                "noun": "外星執法掃描",
                "intro": "前方架設著一座{place}，外星執法機器人發出冰冷的合成語音：「所有地面載具停駛接受生物與違禁品掃描。」",
                "options": lambda p: [
                    opt("scan", "老實停下接受掃描（消耗 20 分鐘）", [{"op": "world_minutes", "amount": 20}, {"op": "morality", "delta": 2}], "刺眼的藍光掃過車廂，確認無異狀後光幕緩緩打開。"),
                    opt("run", "不等掃描直接衝卡！", [{"op": "morality", "delta": -12}, {"op": "combat", "mode": "vehicle"}], "警報器瞬間爆鳴，外星執法艇呼嘯著追了上來！"),
                ],
            },
            {
                "artRef": "road_065", "building": False, "npc": True, "polarity": "bad",
                "places": ["加油站外", "長直道", "休息亭", "斷牆邊", "砂石路", "鐵橋頭", "荒村", "山腳", "舊市集", "隧道外"],
                "noun": "賞金獵人盤查",
                "intro": "{place}站著一名披著長風衣的賞金獵人，手裡捏著一疊通緝畫像，鷹隼般的目光來回掃視著車內每張臉孔。",
                "options": lambda p: [
                    opt("talk", "鎮定下車與賞金獵人周旋", [{"op": "npc_interaction", "service": "npc_trade"}], "{party}坦然推開車門，看看這位獵人究竟在找誰。"),
                    opt("bribe", "塞給他 2 份廢料打聽通緝情報", [{"op": "resource", "key": "scrap", "amount": -2}, {"op": "reveal_history"}], "獵人收下廢料，冷冷吐露了幾條關於治安勢力的內幕。", [{"resource": "scrap", "minimum": 2}]),
                    opt("fight", "先下手為強解決這傢伙", [{"op": "morality", "delta": -14}, {"op": "combat", "mode": "character"}], "{party}不想留後患，搶先拔出武器開火！"),
                ],
            },
            {
                "artRef": "road_072", "building": False, "npc": False, "polarity": "neutral",
                "places": ["夜間", "霧區", "邊境", "高架", "港區", "礦場", "鐵道", "廢城", "水壩", "機場"],
                "noun": "宵禁巡邏隊",
                "intro": "{place}宵禁巡邏隊的探照燈在公路上來回掃射，擴音器不斷重複著「非特許車輛立即停靠接受盤問」！",
                "options": lambda p: [
                    opt("wait", "熄燈靠邊裝作廢棄車輛（消耗 35 分鐘）", [{"op": "world_minutes", "amount": 35}], "{party}躲在陰影裡一動不動，直到巡邏車尾燈消失在彎道後。"),
                    opt("bribe", "交出 2 點汽油換取臨時通行證", [{"op": "resource", "key": "fuel", "amount": -2}], "巡邏隊長滿意地收下油桶，隨手簽了張皺巴巴的通行條。", [{"resource": "fuel", "minimum": 2}]),
                    opt("escape", "直接踩油門甩掉巡邏車", [{"op": "morality", "delta": -8}, {"op": "attempt_escape", "mode": "vehicle"}], "{party}猛踩油門衝出探照燈範圍！"),
                ],
            },
            {
                "artRef": "road_052", "building": False, "npc": False, "polarity": "neutral",
                "places": ["聯邦殘部", "商會護衛", "自治鎮", "鐵路工會", "水源管理署", "公路協會", "民間自衛隊", "港口委員會", "醫護聯盟", "東行互助會"],
                "noun": "勢力過境稅站",
                "intro": "{place}在這裡設立了正規過境站，雖然要收點過路費，但據說能保這一段路免受匪徒騷擾。",
                "options": lambda p: [
                    opt("pay", "繳交 2 份廢料換取平安護送", [{"op": "resource", "key": "scrap", "amount": -2}, {"op": "morality", "delta": 4}, {"op": "heal", "target": "vehicle", "amount": 2}], "守衛替車胎打了氣並指引最安全的路況。", [{"resource": "scrap", "minimum": 2}]),
                    opt("detour", "改走未維護的繞行便道（耗油 2）", [{"op": "travel_cost", "fuel": 2}], "{party}不想繳稅，選擇耗油繞開收費區。", [{"resource": "fuel", "minimum": 2}]),
                ],
            },
            {
                "artRef": "road_072", "building": False, "npc": False, "polarity": "bad",
                "places": ["軍火查緝", "藥品管制", "燃料徵收", "違禁品搜索", "黑市清剿", "逃犯搜捕", "晶礦查封", "外星零件檢查", "車輛牌照核驗", "身份識別"],
                "noun": "突擊臨檢",
                "intro": "轉過彎道正好撞上一場{place}突擊臨檢，路中央閃著紅藍警示燈，執法人員示意所有車輛排隊受檢！",
                "options": lambda p: [
                    opt("cooperate", "乖乖排隊受檢（消耗 30 分鐘）", [{"op": "world_minutes", "amount": 30}, {"op": "morality", "delta": 3}], "雖然耽誤了半小時，但總算平安過關沒惹出大事。"),
                    opt("resist", "一腳油門撞開警示錐", [{"op": "morality", "delta": -16}, {"op": "combat", "mode": "vehicle"}], "紅藍警燈在後視鏡裡狂閃，警車立刻緊追不捨！"),
                ],
            },
            {
                "artRef": "road_030", "building": False, "npc": False, "polarity": "neutral",
                "places": ["佈告欄", "電線桿", "加油站牆", "橋柱", "鐵門上", "候車亭", "路牌背面", "驛站門口", "貨櫃側", "市場入口"],
                "noun": "通緝令公告",
                "intro": "{place}貼滿了最新一批公路通緝令，上面列著幾個臭名昭彰的劫匪頭目與高額廢料懸賞。",
                "options": lambda p: [
                    opt("hunt", "順路去附近清剿其中一名懸賞劫匪", [{"op": "morality", "delta": 10}, {"op": "combat", "mode": "character"}], "{party}循著公告上的線索找到了劫匪窩點，拔出武器替公路除害！"),
                    opt("read", "記下通緝犯長相以免吃虧", [{"op": "reveal_history"}], "{party}把幾個危險人物的特徵記在心裡，繼續上路。"),
                ],
            },
            {
                "artRef": "road_068", "building": False, "npc": False, "polarity": "neutral",
                "places": ["武裝車隊", "運囚車", "物資護送隊", "民兵巡邏車", "裝甲宣傳車", "工程搶修隊", "商會鏢車", "聯軍斥候車", "醫療護衛隊", "彈藥補給車"],
                "noun": "偶遇巡邏車隊",
                "intro": "對向車道緩緩駛來一支{place}，砲塔雖然朝天，但車窗裡緊握步槍的隊員們顯然處於高度戒備。",
                "options": lambda p: [
                    opt("salute", "減速閃燈禮讓通行", [{"op": "morality", "delta": 4}], "對方車長從天窗探身回禮，兩支車隊和平錯身而過。"),
                    opt("ambush", "大膽攔劫這支車隊！", [{"op": "morality", "delta": -20}, {"op": "combat", "mode": "vehicle"}], "{party}猛轉方向盤截斷車隊去路，引爆激烈的公路追逐戰！"),
                ],
            },
            {
                "artRef": "road_072", "building": False, "npc": True, "polarity": "neutral",
                "places": ["廢警亭", "邊哨", "鐵塔下", "高架入口", "橋頭堡", "舊收費站", "防線掩體", "沙包陣", "檢查亭", "崗樓"],
                "noun": "孤守老警員",
                "intro": "{place}裡竟然還留著一位穿著洗得發白制服的老警員，即便舊政府早已瓦解十年，他仍在固執地指揮著寥寥無幾的交通。",
                "options": lambda p: [
                    opt("chat", "停下來陪老警員聊兩句", [{"op": "morality", "delta": 5}, {"op": "npc_interaction", "service": "npc_trade"}], "老警員挺直腰桿回禮，分享了不少實用的公路安全忠告。"),
                    opt("gift", "送他 1 份藥品或補給致敬", [{"op": "resource", "key": "medicine", "amount": -1}, {"op": "morality", "delta": 10}, {"op": "reveal_history"}], "老警員眼角泛光，翻出一本舊警務日誌交給{party}。", [{"resource": "medicine", "minimum": 1}]),
                    opt("leave", "輕按喇叭致意後離開", [], "老警員站在後照鏡裡揮手目送。"),
                ],
            },
            {
                "artRef": "road_066", "building": False, "npc": False, "polarity": "bad",
                "places": ["稅吏幫", "偽裝巡警", "冒牌民兵", "黑警殘黨", "勒索哨站", "假檢疫官", "偽造路政隊", "假安全官", "腐敗稽查員", "黑哨隊"],
                "noun": "腐敗稽查勒索",
                "intro": "幾名穿著拼湊制服的{place}攔下車頭，嘴上喊著維護秩序，眼神卻直勾勾盯著後車廂裡的汽油與裝備！",
                "options": lambda p: [
                    opt("expose", "拆穿這群冒牌貨並開打", [{"op": "morality", "delta": 8}, {"op": "combat", "mode": "character"}], "被戳破謊言的冒牌貨惱羞成怒，雙方立刻交火！"),
                    opt("pay", "塞 2 份廢料打發走這群蛀蟲", [{"op": "resource", "key": "scrap", "amount": -2}], "對方嘿嘿一笑收起廢料，隨手揮開路障。", [{"resource": "scrap", "minimum": 2}]),
                ],
            },
        ],
    },
    {
        "d12": 12,
        "id": "cat_12",
        "name": "公路奇遇與幸運",
        "desc": "意外的綠洲泉水、完整空投箱、熱心老技師、歡樂馬戲車隊與難得的末日好運。",
        "archetypes": [
            {
                "artRef": "road_011", "building": False, "npc": False, "polarity": "good",
                "places": ["掛在樹梢", "落進沙丘", "斜靠橋柱", "降落空地", "卡在屋頂", "漂在淺灘", "落在草坡", "倚在里程碑", "停在路肩", "埋進雪堆"],
                "noun": "完好空投補給",
                "intro": "一只橘白色的降落傘正{place}，底下垂掛著完好無損的急救空投箱，顯然還沒被其他拾荒者發現！",
                "options": lambda p: [
                    opt("claim", "迅速拆箱帶走全套物資", [{"op": "oracle", "table": "supplies"}, {"op": "resource", "key": "medicine", "amount": 1}], "{party}喜出望外地把降落傘割斷，將滿滿的補給搬上車！"),
                ],
            },
            {
                "artRef": "road_039", "building": False, "npc": False, "polarity": "good",
                "places": ["山澗清泉", "露天溫泉", "棕櫚小池", "石窟冷泉", "舊公園噴泉", "地下湧泉", "樹蔭溪畔", "瀑布水潭", "白石水井", "苔蘚泉眼"],
                "noun": "秘境甘泉",
                "intro": "轉過一處不起眼的土坡，竟然藏著一泓清澈見底的{place}！沒有輻射味也沒有孢子，簡直像老天爺偷偷開的小灶。",
                "options": lambda p: [
                    opt("rest", "痛快洗把臉並休整片刻（消耗 30 分鐘）", [{"op": "world_minutes", "amount": 30}, {"op": "heal", "target": "party", "amount": 6}], "清涼泉水洗去了滿身塵土與疲憊，全隊頓時神清氣爽！"),
                ],
            },
            {
                "artRef": "road_035", "building": False, "npc": False, "polarity": "good",
                "places": ["私人車庫", "展示間裡", "帆布罩下", "地下停車場", "豪宅車道", "倉庫深處", "農莊穀倉", "山洞隱蔽處", "試車場邊", "修車行後院"],
                "noun": "塵封完好座駕",
                "intro": "掀開{place}厚厚的防塵布，裡頭居然停著一輛保養得像新車一樣的座駕，連油箱裡都還留著半桶好油！",
                "options": lambda p: [
                    opt("vehicle", "試著發動並查看這輛夢幻好車", [{"op": "oracle", "table": "vehicle"}], "引擎一轉即發，低沉的排氣聲聽得{party}眼睛發亮！"),
                    opt("fuel", "留著原本的愛車，把好油抽光帶走", [{"op": "resource", "key": "fuel", "amount": 6}], "{party}抽走滿滿六點清澈汽油，心滿意足地上路。"),
                ],
            },
            {
                "artRef": "road_037", "building": False, "npc": True, "polarity": "good",
                "places": ["路旁涼棚", "老修車台", "改裝餐車旁", "大樹下", "油桶堆邊", "水塔旁", "舊車庫前", "山腰空地", "橋下空場", "驛站外"],
                "noun": "豪爽老技師",
                "intro": "{place}有位滿頭白髮的老技師正哼著老搖滾，一眼看出這輛車的引擎雜音，笑呵呵地抄起扳手說：「順手幫你們調一下，不收錢！」",
                "options": lambda p: [
                    opt("accept", "感激地請老技師免費修車", [{"op": "heal", "target": "vehicle", "amount": 8}, {"op": "world_minutes", "amount": 20}], "老技師三兩下就讓引擎恢復輕快運轉，車況大幅提升！"),
                    opt("chat", "修完車再順便跟老技師聊聊", [{"op": "heal", "target": "vehicle", "amount": 5}, {"op": "npc_interaction", "service": "npc_trade"}], "修好車後，兩人靠在車頭天南地北地聊了起來。"),
                ],
            },
            {
                "artRef": "road_019", "building": False, "npc": True, "polarity": "good",
                "places": ["彩旗貨車", "燈串營地", "木偶戲車", "音樂巴士", "煙火車隊", "雜耍馬戲團", "流動電影車", "塗鴉卡車", "街頭劇團", "節慶商隊"],
                "noun": "公路嘉年華車隊",
                "intro": "荒涼的末日公路上竟然迎面開來一支掛滿彩燈的{place}！他們免費分送烤餅與熱湯，笑稱「世界都這樣了，不找樂子怎麼活」。",
                "options": lambda p: [
                    opt("join", "停下來喝碗熱湯同樂片刻（消耗 30 分鐘）", [{"op": "world_minutes", "amount": 30}, {"op": "heal", "target": "party", "amount": 5}, {"op": "morality", "delta": 3}], "笑聲與歌聲驅散了連日陰霾，{party}帶著滿滿元氣重新出發！"),
                    opt("trade", "順便跟車隊成員交換稀奇裝備", [{"op": "npc_interaction", "service": "npc_trade"}], "{party}和這群樂天派旅人聊得不亦樂乎。"),
                ],
            },
            {
                "artRef": "road_013", "building": False, "npc": False, "polarity": "good",
                "places": ["軍用保險箱", "密封裝備盒", "墜落補給艙", "戰術旅行袋", "舊保全運鈔車", "獵人藏寶洞", "工坊樣品箱", "實驗室試作櫃", "傭兵遺留箱", "探險隊背囊"],
                "noun": "意外裝備寶庫",
                "intro": "路旁不起眼的岩縫裡藏著一只{place}，鎖扣早已鬆開，裡面靜靜躺著一件幾乎全新的精良裝備！",
                "options": lambda p: [
                    opt("take", "毫不客氣收下這份大禮", [{"op": "oracle", "table": "equipment"}], "{party}擦去裝備上的灰塵，今天運氣簡直好得不像話！"),
                ],
            },
            {
                "artRef": "road_001", "building": False, "npc": False, "polarity": "good",
                "places": ["隱蔽地下槽", "完好油罐車", "軍用油桶堆", "廢農場油槽", "機庫備油庫", "工程車儲油箱", "發電機油槽", "碼頭殘留桶", "貨運油車", "礦場燃料庫"],
                "noun": "無主滿油桶",
                "intro": "雜草後方藏著一排還沒被動過的{place}，搖起來沉甸甸的，裡頭全是清澈未變質的高辛烷值汽油！",
                "options": lambda p: [
                    opt("fill", "把油箱與備用桶一次加好加滿", [{"op": "resource", "key": "fuel", "amount": 7}], "{party}痛痛快快灌進七點汽油，油表指針瞬間回血！"),
                ],
            },
            {
                "artRef": "road_015", "building": False, "npc": False, "polarity": "good",
                "places": ["戰地急救箱", "紅十字冷藏盒", "墜機醫藥包", "藥廠樣品箱", "救護車藥櫃", "探險醫護盒", "防潮藥桶", "空投醫療包", "軍醫隨身箱", "診所備藥盒"],
                "noun": "完整醫藥箱",
                "intro": "在乾燥的混凝土掩體裡，{party}發現了一只密封完好的{place}，裡頭的抗生素與止血繃帶全都乾燥如新！",
                "options": lambda p: [
                    opt("take", "小心收好這批救命藥品", [{"op": "resource", "key": "medicine", "amount": 2}, {"op": "heal", "target": "party", "amount": 3}], "{party}當場替大家換了新繃帶，還多收進兩份藥品！"),
                ],
            },
            {
                "artRef": "road_021", "building": False, "npc": False, "polarity": "good",
                "places": ["高強度鋼板", "軍規零件箱", "完整工具牆", "精品五金櫃", "未拆封改裝件", "精密軸承箱", "合金廢料堆", "焊接耗材箱", "航太鋁材", "舊工廠庫存"],
                "noun": "頂級廢料寶藏",
                "intro": "誰能想到這片荒蕪路邊居然堆著一批{place}？在這個時代，這些東西可比黃金硬通貨還值錢！",
                "options": lambda p: [
                    opt("collect", "全部搬上後車廂", [{"op": "resource", "key": "scrap", "amount": 6}], "{party}喜滋滋地收進六份優質廢料，夠買不少好貨了。"),
                ],
            },
            {
                "artRef": "road_040", "building": False, "npc": False, "polarity": "good",
                "places": ["順風直道", "完好柏油段", "夕陽海堤", "林蔭大道", "筆直高原路", "微風山谷", "平整鹽道", "金黃草原路", "清朗晨道", "星光夜路"],
                "noun": "難得的順遂好路",
                "intro": "接下來好幾公里都是意外平整的{place}，沒有劫匪、沒有坑洞、也沒有怪獸，只有微風吹過車窗與輕快的引擎聲。",
                "options": lambda p: [
                    opt("enjoy", "趁著好心情穩穩前進並小憩片刻", [{"op": "heal", "target": "party", "amount": 3}, {"op": "heal", "target": "vehicle", "amount": 2}, {"op": "resource", "key": "fuel", "amount": 2}], "難得的順風與好路況讓油耗省下不少，全隊也恢復了精神。"),
                ],
            },
        ],
    },
]

SNARKS = [
    "（寫到這裡我都懷疑這條公路是不是其實繞著地球轉圈圈。）",
    "（外星人佔領十年了，結果路邊招牌還是比某些人的承諾撐得久。）",
    "（別看我，是命運決定讓這輛破車撞上這件事的，可不是我故意刁難。）",
    "（要是這本書賣得出去，這一段我一定會要求出版社配張全彩插畫。）",
    "（末日公路定律第一條：看起來越像好運的東西，通常越考驗人品。）",
    "（連寫稿的我都在替這台車的避震器捏把冷汗。）",
    "（真佩服他們，這種世道還能一路往東開而不掉頭回家。）",
    "（如果這段順利過關，記得在心裡替作者鼓個掌。）",
]

def build():
    out_cats = []
    seen_titles = set()
    total = 0
    for cat in CATEGORIES:
        events = []
        d100 = 1
        for arch_idx, arch in enumerate(cat["archetypes"]):
            for place_idx, place in enumerate(arch["places"]):
                eid = f"{cat['id']}_{d100:03d}"
                title = f"{place}{arch['noun']}"
                assert title not in seen_titles, f"Duplicate title: {title}"
                seen_titles.add(title)
                body = arch["intro"].replace("{place}", place)
                # Add rolled-style author snark to ~15% of entries deterministically
                if (cat["d12"] * 31 + d100 * 17) % 7 == 0:
                    snark = SNARKS[(cat["d12"] + d100) % len(SNARKS)]
                    body = f"{body}\n{snark}"
                ev = {
                    "id": eid,
                    "title": title,
                    "text": body,
                    "kind": "normal",
                    "category": cat["id"],
                    "categoryName": cat["name"],
                    "d12": cat["d12"],
                    "d100": d100,
                    "polarity": arch["polarity"],
                    "artRef": arch["artRef"],
                    "building": bool(arch.get("building", False)),
                    "bindings": NPC_BINDING if arch.get("npc") else {},
                    "options": arch["options"](place),
                }
                if arch.get("placeSuffix"):
                    ev["placeSuffix"] = arch["placeSuffix"]
                events.append(ev)
                d100 += 1
                total += 1
        assert len(events) == 100, f"{cat['id']} has {len(events)} events, expected 100"
        out_cats.append({
            "d12": cat["d12"],
            "id": cat["id"],
            "name": cat["name"],
            "desc": cat["desc"],
            "events": events,
        })
    assert len(out_cats) == 12, f"Expected 12 categories, got {len(out_cats)}"
    assert total == 1200, f"Expected 1200 events, got {total}"
    payload = {
        "version": "1.0",
        "totalCategories": 12,
        "eventsPerCategory": 100,
        "totalEvents": total,
        "categories": out_cats,
    }
    text = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    SPEC_OUT.write_text(text, encoding="utf-8")
    DIST_OUT.write_text(text, encoding="utf-8")
    print(f"Built {len(out_cats)} categories x 100 = {total} unique events ({len(text):,} bytes).")

if __name__ == "__main__":
    build()
