# 《一路向東》（Eastward）完整資料、架構與邏輯參考手冊

> **專案路徑**：`/Users/robin/Documents/Codex/2026-11-17/new-chat-2/eastward`  
> **現行版本**：`v=27-encounter-cue`（`active_presentation.mode = "classic_pixel"`）  
> **文件用途**：作為理解、維護與擴充《一路向東》之單一權威技術參考文件。

---

## 1. 專案總覽與技術定位

- **遊戲類型**：手機直向 16-bit 像素公路 RPG（外星佔領十週年題材），單人本機遊玩。
- **核心設計原則**：
  - **純前端、零外部依賴**：無 npm 套件、無 bundler，以瀏覽器原生 ES Modules + `<script type="importmap">` 執行，完全不呼叫 AI 或外部 API。
  - **確定性狀態機（Deterministic State Machine）**：遊戲邏輯由單一 `seed` 驅動的 32-bit Xorshift RNG 控制；所有視覺／呈現隨機性（天氣、路邊裝飾、行車時長、路線地名、首領抽選、NPC 神情）皆使用獨立的無狀態雜湊流，**絕不消耗主遊戲 RNG**。
  - **本機存檔**：存於 `localStorage`（鍵值 `eastward.save.v1`），支援匯出 JSON（`一路向東-旅程存檔.json`），具向後相容自動遷移機制。
- **常用指令**：
  ```sh
  # 本機啟動遊玩（開啟 http://localhost:8765）
  python3 -m http.server 8765 --directory dist

  # 執行全部自動化單元測試（Node 原生 test runner，28 檔 / 217 項測試）
  node --test tests/*.test.mjs

  # 同步 spec/ 資料至 dist/data/
  python3 tools/sync_data.py

  # 完整重建美術資產並驗證
  python3 tools/rebuild_art.py
  python3 tools/check_art.py

  # 產生本機 QA 夾具頁（發布前必須刪除 dist/qa.html）
  node tools/make-qa.mjs
  ```

---

## 2. 專案目錄與檔案地圖

```text
eastward/
├── README.md                  # 專案說明與歷代版本紀錄
├── package.json               # type: "module"，零依賴，僅定義 test script
├── progress.json              # 專案總進度、資產統計、里程碑與部署日誌
├── spec/                      # 21 份設計規格與原始資料 JSON（Source of Truth）
├── dist/                      # 可直接靜態部署的完整前端執行期目錄
│   ├── index.html             # 遊戲主入口（含 40 個模組的 importmap 與版本 query）
│   ├── art.html               # 獨立像素美術圖鑑檢視頁
│   ├── *.js                   # 46 支原生 ES Module（引擎、邏輯、UI、渲染、型錄）
│   ├── *.css                  # 5 支樣式表（style / ui / journey-ui / portrait-layout / vehicle-volume）
│   ├── data/                  # 8 份執行期 JSON（與 spec/ 同名檔案完全一致）
│   └── assets/                # 靜態圖像與索引（manifest.json、encounters.json、SVG/PNG/WebP）
├── tools/                     # 26 支 Python / Node.js 資料同步、美術生成、接地量測與 QA 腳本
├── art-direction/             # 離線美術規範、生成提示詞、圖集裁切佈局與審閱拼圖（不進執行期）
├── tests/                     # 28 份 *.test.mjs 自動化測試（共 217 項測試）
└── qa/                        # 各版本實機預覽截圖與 verification.json 證據
```

---

## 3. 資料層與神諭系統（`spec/` 與 `dist/data/`）

### 3.1 `spec/` 與 `dist/data/` 對應關係

- **直接同步至 `dist/data/`（由 `tools/sync_data.py` 複製，執行期透過 `fetch` 載入）**：
  1. `oracles.json`（232 KB）：30 張神諭骰表與同伴對話核心設定。
  2. `events.json`（93 KB）：100 個公路主事件 + 2 個歷史人物重逢後續模板（共 102 項）。
  3. `building-events.json`（86 KB）：100 種通用建築內部事件。
  4. `traits.json`（19 KB）：32 項優勢（12 種族 + 20 職業）、20 項缺點與結算規則。
  5. `event-spec.json`（8.4 KB）：事件欄位契約、17 種允許的 effect 操作、自動獎勵與遭遇提示規格。
  6. `roadside-scenery.json`（6.8 KB）：12 地貌路邊物件裝飾規格。
  7. `npc-catalog.json`（6.5 KB）：12 種族與 20 職業定義及組合規則。
  8. `npc-spec.json`（3.5 KB）：NPC 生成、6 種態度規則、4 人隊伍上限與口述對話規格。
- **編譯成 JS 型錄或僅供規格／工具參考（僅存於 `spec/`）**：
  - `origins.json` → 編譯至 `dist/origin-catalog.js`（`tools/build-origins.mjs`）
  - `progression-combat.json` → 對應 `dist/progression-catalog.js` 並寫入 `oracles.json`（`tools/build-progression.mjs`）
  - `route-regions.json` → 對應 `dist/route-catalog.js` 並寫入 `oracles.json`（`tools/build-route.mjs`）
  - `starter-vehicles.json` → 對應 `dist/vehicle-catalog.js`
  - `occupation-dialogue.json`（119 KB，100 題佔領十年間口述歷史與行車語音）→ 驗證並寫入 `oracles.json`（`tools/build-dialogue.mjs`）
  - `companion-dialogue.json`（25 KB）→ 整合至 `oracles.json` 與 `companion-dialogue.js`
  - 純規格文件：`game-design.json`、`automatic-journey.json`、`battle-presentation.json`、`npc-presentation.json`、`atmosphere.json`、`weather.json`、`hd2d.json`。

### 3.2 30 張神諭骰表總覽（`oracles.json`）

| 分類 | 骰表 ID | 骰面 | 項目數 | 用途 |
| :--- | :--- | :--- |---:| :--- |
| **主要事件** | `road_event` | D100 | 100 | 公路停靠主事件（好壞各 50%） |
| | `building_event` | D100 | 100 | 建築內部探索事件（含無事發生） |
| **資源與遭遇** | `supplies` / `salvage` / `equipment` / `vehicle` / `enemy` | D100 | 3–4 | 物資、受困求生、裝備、替代車、敵群判定 |
| | `enemy_group_size` | D3 | 3 | 每次遭遇敵人數量（1–3 體） |
| | `reunion` / `departure_fate` / `stranded_ending` | D100 | 3–4 | 離隊命運、重逢態度、受困結局 |
| | `history_seed` / `invasion_history` | D100 | 4 | 世界背景與佔領史揭露 |
| **角色與 NPC** | `npc_name` / `npc_nickname` | D100 | 100 | 100 姓名與 100 外號 |
| | `npc_race` / `npc_profession` / `npc_flaw` | D100 | 12 / 20 / 20 | 12 種族、20 職業、20 缺點 |
| | `npc_attitude` | D100 | 6 | 6 種態度（友善/同情/戒備/冷淡/敵對/掠奪） |
| **路線與地名** | `route_terrain` | D12 | 12 | 10 區段地貌抽選（可重複） |
| | `location_name` | D100 | 100 | 區域、商店、建築與終點樂園名稱 |
| **對話與行車** | `occupation_dialogue` | D100 | 100 | 佔領十年間口述歷史主題 |
| | `companion_focus` | D100 | 4 | 同伴閒聊主題權重（種族/職業/樂園/首領） |
| | `driving_channel` | D100 | 3 | 行車語音頻道分流（電台/靜默/同伴或獨白） |
| | `driving_solo` / `driving_companions` / `driving_radio` / `driving_quiet` | D100 | 20 / 20 / 20 / 4 | 行車環境語音池 |
| **終局首領** | `final_boss` | D100 | 5 | 5 位終極首領抽選 |
| | `boss_rumor` | D100 | 2 | 20% 機率附帶首領傳聞 |

---

## 4. 核心引擎與邏輯架構（`dist/engine.js` 與 8 層 Mixin）

### 4.1 Prototype Mixin 掛載順序

`engine.js` 定義基礎 `class Game`，並依嚴格相依順序將 8 個執行期模組掛載至 `Game.prototype`：

```mermaid
flowchart LR
  E["engine.js (class Game)"] --> M1["1. combat.js"]
  M1 --> M2["2. traits-runtime.js"]
  M2 --> M3["3. npc-runtime.js"]
  M3 --> M4["4. dialogue-runtime.js"]
  M4 --> M5["5. progression-runtime.js"]
  M5 --> M6["6. automatic-journey.js"]
  M6 --> M7["7. vehicle-runtime.js"]
  M7 --> M8["8. origin-runtime.js"]
```

- **順序相依關鍵**：
  - `startRandom` 由 `automatic-journey.js` 建立，再由 `origin-runtime.js` 包裹加入雙 D100 身世/動機、D10 起始座駕與 3 頁序幕。
  - `beginCombat` 依序被 `combat.js` → `dialogue-runtime.js`（戰前喊話）→ `progression-runtime.js`（區域敵群與首領數值）包裹。

### 4.2 核心遊戲狀態結構（`Game.prototype.s`）

| 欄位 | 型別 / 範圍 | 說明 |
| :--- | :--- | :--- |
| `version` | `1` | 存檔結構版本號 |
| `rng` / `seed` / `serial` | `Number` | 32-bit Xorshift 狀態、初始種子、全域遞增序號 |
| `progress` / `minutes` / `stop` | `1..100` / `>=480` / `Number` | 東行進度（1 起步，100 決戰）、世界分鐘（480 = 第 1 天 08:00）、停靠次數 |
| `mode` | `'prologue'\|'ready'\|'driving'\|'event'\|'combat'\|'ending'` | 主狀態機模式 |
| `protagonistId` / `driver` / `actorId` | `String` | 主角 ID、駕駛 ID、目前事件執行者 ID |
| `party` / `departed` | `Person[]` | 現有隊伍（上限 `MAX_PARTY = 4`）與已離隊成員 |
| `resources` | `{ fuel, fuelReserve, scrap, medicine }` | 主油箱汽油、公共背包備用汽油、廢料、藥品 |
| `inventory` | `itemId[]` | 公共背包（無容量與負重上限） |
| `vehicle` / `offerVehicle` | `Vehicle` / `Vehicle\|null` | 現行載具與待比較／可更換之候選載具 |
| `frames` | `{ kind, count, scene, parent? }[]` | 事件堆疊（支援 `road` 內嵌 `building` 探索） |
| `current` | `Object\|null` | 當前事件實例（事件本體、NPC、建築進出狀態、服務、獎勵收據、特性使用紀錄等） |
| `battle` | `Object\|null` | 戰鬥狀態（`character`/`vehicle`、敵陣、回合、先手指令、屏障、守夜、首領旗標） |
| `world` / `route` / `finalBoss` | `Object` | 佔領十年世界史、10 區段路線與樂園名、本局鎖定首領與殘餘血量 |
| `pending` / `usedStory` | `Array` | 離隊重逢佇列（`former_companion`）與本停靠已觸發後續 ID |
| `rewardedStops` / `levelUp` | `Array` / `Object` | 防止重複升級的停靠權杖與最近升級紀錄 |
| `logs` / `oralHistory` / `bossRumors` / `messages` | `Array` | 旅程日誌（100）、口述史（100）、首領傳聞（30）、訊息窗（60） |
| `travel` / `journeyFlow` / `prologue` | `Object` | 行車狀態與 `preview`、自動推進與 `encounterCue`、3 頁序幕進度 |

**`Person` 核心欄位**：`id`、`name`、`nickname`、`race`、`profession`、`attitude`、`flaw`、`level`（1–18）、`hp/maxHp`（初始 24）、`st/maxSt`（初始 24）、`esp/maxEsp`（初始 10）、`asleep`、`startled`、`gear: { 武器, 防具, 配件 }`、`memories`、`stock`、`tradeItem`、`joinOffset`、`recentTopics`、`chatterLast`、`aspirations`、`origin`。

### 4.3 確定性 RNG、日夜時間與主迴圈

- **主 RNG（`roll(sides = 100)`）**：32-bit Xorshift（`x ^= x<<13; x ^= x>>>17; x ^= x<<5;`），永遠回傳 `1..sides`。
- **日夜階段（`phase(minutes)`）**：以 `h = floor(minutes / 60) % 24` 分界：
  - `18–04`：`night`（夜晚）｜`05–07`：`dawn`（清晨）｜`08–11`：`morning`（上午）｜`12–17`：`afternoon`（下午）。
- **四維能力值（`stat(p, k)`）**：`base({attack:5, defense:2, speed:5, psyche:5}) + (level - 1) + 裝備加成 - (speed 且 slow_reflex ? 1 : 0)`，下限 `1`。
- **行車消耗（`travelCost(n, driver)`）**：
  - `fuel = n + (wasteful_driver ? 1 : 0)`
  - `st = max(1, n * (night ? 2 : 1) + (night_strain && night ? 1 : 0) + (poor_driver ? 1 : 0) - (driver 職業 ? 1 : 0))`
- **出發與到達預演（`depart()` / `previewArrival()` / `arrive()`）**：
  1. `depart()` 擲 D10 得前進格數 `n = min(die, 100 - progress)`，依油量與駕駛體力自動縮減至可負擔最大值。
  2. 以 `clone(this.s)` 建立臨時 `Game` 呼叫 `future.arrive()`，將未來的遭遇場景與敵人資訊暫存於 `s.travel.preview`，供畫布在行車接近期間提前繪製建築與目標，**絕不改動正式 RNG 或資源**。
  3. `arrive()` 正式扣油與駕駛體力，**其餘存活乘客恢復 `n` 點體力**，`progress += n`、`minutes += 60`。若 `progress >= 100` 進入 `beginFinale()`；否則 `stop++` 並進入事件抽籤。
- **事件鏈與建築探索（`nextEvent()` / `finishEvent()`）**：
  - 15% 機率檢查 `pending` 觸發舊識重逢（`followup`）。
  - 21 個 `BUILDING_ROADS` 事件可選擇下車進入並推入 `building` frame 探索；同 frame 結束後依序以 **75% → 50% → 25%** 機率追加獨立事件（最多 4 次）。
  - 遭遇敵對／掠奪態度 NPC（非門外狀態）立即轉入戰鬥，不因有利事件分類或商店模板而繞過。
  - 外層 `road` frame 結束時呼叫 `completeStop()` 讓全隊升級並回到 `ready`。
- **商店議價（`price(base)`）**：`max(1, ceil(base * (1 + (bad_bargain ? 0.1 : 0) - (merchant ? 0.1 : 0))))`。
  - 固定價服務：修車廠維修（2 廢料 → +10/+13 車況）、診所治療（2 廢料 → 全隊 +8 HP）、旅館住宿（3 廢料 → 安全睡眠）。
- **睡眠與夜襲（`sleep(watchId, safe)`）**：
  - 時間 `+240` 分鐘（4 小時）；非守夜者 `asleep = true`、體力 `+16`（`restless` 減 1）、ESP 回滿、`symbiote` 額外 `+2 HP`；守夜者保持清醒但體力 `-4`。
  - 非安全睡眠有 **30%** 機率遭夜襲開戰；**無人守夜時敵方立刻免費先攻一輪**。
- **受困求生與結局**：無油或車毀時可進行一次 `searchStranded()`（`+60` 分鐘，查 `salvage` 表）；若仍無法脫困，查 `stranded_ending` 表進入敗北結局。全員陣亡亦觸發敗北。

---

## 5. 各子系統規則與數值詳解

### 5.1 戰鬥系統（`combat.js`）

- **回合機制**：全隊清醒存活者先逐一提交指令（`attack`、`defend`、`escape`、`medicine`、`psi`），收齊後將敵我全員合併，依 **`speed` 降冪 → D100 同速判定降冪 → 索引升冪** 依序執行；每 3 回合推進世界時間 `+5` 分鐘。
- **核心公式**：
  - **命中率**：基礎 90%；非車載遠程攻擊具 `unsteady` 缺點降為 80%。
  - **我方普攻傷害**：`max(1, stat(p,'attack') - e.defense) + (soldier ? 1 : 0) - (weak_grip && 近戰 ? 1 : 0) - (timid && 第1回合 ? 1 : 0) - (startled ? 1 : 0) + (hunter首擊非機械 ? 2 : 0) + (車戰駕駛 ? weapon.bonus : 0) - (敵方chitin ? 1 : 0)`。
  - **敵方人物戰傷害**：`max(1, e.attack - floor(stat(t,'defense')/2) - (防禦 ? 2 : 0) - (shield || 0))`，守夜 `guard` 首擊 `-3`、伏擊/夜襲首回合 `scout` `-2`、`chitin` 物理 `-1`。
  - **敵方車輛戰傷害**：`max(1, e.attack - vehicleStats().armor - (駕駛防禦 ? 3 : 0))`。
  - **逃跑率**：`clamp(45 + speed * 2 + (mimic ? 15 : 0) - (noisy ? 10 : 0), 5, 95)`%。
  - **睡眠驚醒**：睡夢中遭擊中立即 `asleep = false`；具 `startled_awake` 缺點則標記 `startled = true`（下次攻擊 -1 傷）。
  - **超能力（36 招）**：12 種族各 3 招，Lv 1 / Lv 3 / Lv 5 解鎖，消耗 3 / 4 / 7 ESP；類型分 `strike`（`psyche+2`）、`heal`（`psyche+5`）、`shield`（全隊常駐減傷 3）、`stun`（`psyche+2` + 暈 1 回合）、`burst`（全體 `psyche+3`）。
  - **勝利獎勵**：殲滅敵群獲 **2 份廢料**（戰鬥本身不給經驗值）。

### 5.2 特性系統（`traits-runtime.js`）

- **行動規則**：只採當前執行者（`actorId`）的特性，不疊加全隊同類特性；睡眠者不可提供主動選項；若所有選項均無法負擔，自動補上保底選項（`__rest` 休息或 `__supplies` 受困搜尋）。
- **事件檢定**：黑暗搜尋且已照明（含 `lumen` 種族）為 **100%**；符合專家職業（`locksmith`/`electrician`/`demolition`/`scout`）為 **90%**；一般為 **55%**。
- **12 種族優勢**：`human`（民用提示）、`alien`（解讀命令）、`mutant`（污染傷 -2）、`synth`（終端復原／免疫獵人首擊）、`uplift`（嗅聞藏匿）、`chitin`（物理傷 -1）、`mycelial`（辨識孢子）、`crystal`（感應能源）、`amphibian`（涉水體力 -1）、`mimic`（逃跑 +15%）、`symbiote`（睡眠 +2 HP）、`lumen`（常駐照明與照亮房間）。
- **20 職業優勢**：`driver`（駕駛耗體 -1）、`mechanic`（修車 +3）、`medic`（用藥 +2）、`soldier`（攻擊 +1）、`scout`（反伏擊 -2／警報 90%）、`merchant`（議價 -10%）、`scavenger`（搜尋廢料 +1）、`engineer`（修設施揭史）、`researcher`（樣本分析）、`hacker`（電子鎖開裝）、`hunter`（非機械首擊 +2）、`guard`（守夜首擊 -3）、`courier`（解讀路標）、`diplomat`（交涉換情報）、`historian`（史料比對）、`locksmith`（機械鎖開裝／90%）、`demolition`（拆彈 90%）、`chemist`（鑑定化學）、`electrician`（隔離電源／90%）、`performer`（停靠講故事回體 +1）。
- **20 項缺點**：`frail`（HP上限-2）、`low_endurance`（體力上限-2）、`restless`（睡眠回體-1）、`slow_healing`（用藥-1）、`night_strain`（夜駕耗體+1）、`poor_driver`（駕駛耗體+1）、`wasteful_driver`（駕駛耗油+1）、`claustrophobic`（窄處耗體+1）、`dark_fear`（未照明暗處耗體+1）、`unsteady`（遠程命中-10%）、`weak_grip`（近戰傷-1）、`timid`（首回合傷-1）、`slow_reflex`（速度-1）、`noisy`（逃跑-10%）、`bad_bargain`（購物+10%）、`abrasive`（同情贈藥-10%）、`distracted`（搜廢料-1）、`mechanical_clumsy`（修理多花10分）、`chemical_sensitive`（污染傷+1）、`startled_awake`（驚醒後下次攻擊-1）。

### 5.3 成長、10 區段難度與 5 位終極首領（`progression-runtime.js`）

- **升級制度**：上限 **Lv 18**；外層公路停靠完成（或受困求生成功）全隊升 1 級。每級 `maxHp +3`、`maxSt +1`、`maxEsp +2`、四維各 `+1`（不復活倒下成員）。
- **新同伴**：初始等級為 `主角等級 + (-1 / 0 / +1)`，附隨機裝備；離隊重逢保留原裝備。
- **10 區段難度曲線**（每 10 進度一區）：
  - Region 1（進度 1–10）：HP 12 / ATK 5 / DEF 1 / SPD 4 / 體型縮放 `0.68`
  - 逐區線性成長至 Region 10（進度 91–100）：HP 48 / ATK 23 / DEF 5 / SPD 13 / 體型縮放 `1.175`
  - 重型敵（`brute`/`nest`/`sentinel`）額外 `HP +5, ATK +1`；車輛戰額外 `HP +8`；日夜各有偏好敵池（權重 ×2）。
- **5 位終極首領**（開局以種子雜湊鎖定 1 位，進度 100 登場，撤退保留首領剩餘血量，擊敗才通關）：
  1. `overseer`（星門監督官）：HP 124 / ATK 24 / DEF 9 / SPD 18
  2. `broodmother`（孵界母體）：HP 150 / ATK 22 / DEF 8 / SPD 12
  3. `zero_core`（歸零主機，機械）：HP 130 / ATK 25 / DEF 11 / SPD 15
  4. `graft_colossus`（接骨巨像）：HP 144 / ATK 28 / DEF 8 / SPD 11
  5. `fallen_angel`（失落天使）：HP 116 / ATK 26 / DEF 9 / SPD 22

### 5.4 身世序章、車輛系統與裝備（`origin-*` / `vehicle-*` / `equipment-model.js`）

- **身世與序章（`origin-runtime.js`）**：開局獨立擲 D100 過去、D100 動機（含 `{paradise}` 佔位符）與 D10 起始座駕，透過 3 頁序章（`mode = 'prologue'`）呈現並存檔。
- **載具（`vehicle-runtime.js`）**：
  - 8 種基礎車型（`compact`/`sedan`/`van`/`pickup`/`bus`/`armored`/`rover`/`ambulance`）與 20 種加座變體；10 種 D10 起始座駕（含 33 種座位變體）。
  - 7 種車載武器（`bumper` +0 ～ `coil`/`harpoon`/`gun`/`spore` +3）。
  - 4 種修車廠限定改裝（共用該車 `limit` 槽位）：`seat`（4 廢料，座位 +1，上限 4）、`armor`（5 廢料，裝甲 +2）、`tank`（4 廢料，容量 +12 並贈 12 油）、`gun`（7 廢料，武器傷害 +4）。
  - 溢出油量自動存入 `fuelReserve`（公共背包備用油），自動補滿主油箱；換車保留全部汽油，但不繼承舊車改裝。
- **6 件裝備（`engine.js:ITEMS` / `equipment-model.js`）**：
  - 武器：`club`（球棒，ATK +2，3 廢料）、`pistol`（舊手槍，ATK +4，遠程，7 廢料）
  - 防具：`coat`（厚外套，DEF +1，3 廢料）、`vest`（防護背心，DEF +3，8 廢料）
  - 配件：`tools`（工具組，DEF +1，4 廢料）、`charm`（共鳴石，PSY +2，6 廢料）

### 5.5 路線、NPC 對話與自動旅程

- **路線（`route-runtime.js`）**：獨立雜湊生成目的地（`[D100地名]樂園`）與 10 區段地貌（12 種生態：`salt`/`canyon`/`forest`/`city`/`coast`/`industrial`/`marsh`/`desert`/`farmland`/`snow`/`alien`/`oasis`）。進度 1→100 對應 `1,000 km → 0 km`，跨區邊界 `±1.2` 平滑過渡。
- **NPC 與對話（`npc-runtime.js` / `dialogue-runtime.js` / `companion-dialogue.js`）**：
  - 每位 NPC 附有限交易庫存（油、藥、職業專屬裝備各 1 份）與 8 筆記憶；對話消耗 5 分鐘，收入 `oralHistory`，同情態度首談有 60%（`abrasive` 50%）贈藥，20% 附首領傳聞。
  - 隊伍閒聊依種族、職業、樂園願望（永久保存至 `partner.aspirations`）與首領傳聞分流。
- **自動旅程與遭遇提示（`automatic-journey.js` / `encounter-cue.js`）**：
  - 自動決策機在無須玩家抉擇時自動發車與結束事件，但在體力 `< 5`（詢問休息）、無油/車毀、發現新車、未決選項、建築/商店與戰鬥時停下交給玩家。
  - `encounterCue` 採 `alert`（1250ms 驚嘆號氣泡）→ `reading`（4–12 秒動態閱讀延遲或等待迎戰確認）兩階段，且將已擲完的先攻演出封存於存檔避免重擲。

---

## 6. 前端 UI 與視覺渲染管線（`dist/app.js`、`world-view.js` 與 CSS）

### 6.1 五列直向版面與 UI 編排

- **CSS 階層**：`style.css`（設計系統與轉場）→ `ui.css`（全螢幕彈窗與裝備比較表）→ `journey-ui.css`（JRPG 訊息窗與 4 格戰鬥列）→ `portrait-layout.css`（現行鎖定 `100dvh` 五列 Grid）。
- **主畫面五列結構（`app.js:render()`）**：
  1. **車輛與路線 HUD**：地名、距離、進度條、油箱/車況/裝甲/車速、車名/席次/時間。
  2. **4 格固定隊伍列（`partyStrip`）**：無隊員留空框；戰鬥時顯示指令狀態或出擊/受擊/閃避/格擋標示。
  3. **像素主舞台（`<canvas id="world-canvas">`）**：**每次 `render()` 重寫 DOM 後將既有 `canvas` 節點 `replaceWith` 回填**，避免中斷 rAF 動畫；上方覆蓋不重疊的敵人觸控區 `.world-targets`。
  4. **固定高度訊息與指令窗（`messageWindow`）**：整合自動捲動訊息流（`message-scroll.js`）與每頁 4 格的行動按鈕；戰鬥純介面瀏覽透過 `browseCombat()` 局部更新，不重建畫布也不觸發存檔。
  5. **底部 5 格導覽列**：隊伍（`ui-panels.js`）、背包（含即時 4 屬性比較卡）、車輛（`vehicle-ui.js`）、紀錄（`journey-ui.js`）、選單。彈窗開啟時自動對背景設 `inert = true` 並鎖定焦點。

### 6.2 現行 `classic_pixel` 像素舞台管線（`world-view.js`）

- **畫布規格**：邏輯寬度固定 `384px`、基準高度 `240px`，由 `ResizeObserver` 自適應直向高度（`imageSmoothingEnabled = false`），節流至 ~30 FPS，隱藏分頁時暫停。
- **離屏快取**：
  - `transitionLayer` / `incomingLandscape`（`384×180`）：跨地貌以互補遮罩 `destination-in` + `lighter` 避免天空重疊變濃。
  - `arenaCanvas`（`384×stageHeight`）：人物戰背景快取，穩態不重繪公路。
- **戶外單幀 12 層繪製順序**：
  1. 天空色帶、星月、東升西落太陽與 7 朵像素雲（`atmosphere.js`）
  2. 視差捲動地平線全景（`horizon-art.js`，12 地貌原生像素圖集）
  3. 柏油路面、車道標線與下方路肩
  4. 遠端佔領電塔
  5. 沿路 10 類結構、建築與對向車流（`roadside-model.js` / `roadside-art.js`，LRU 96 張快取）
  6. 暴雨雲幕與隨機分岔閃電（`weather-art.js`）
  7. 鏡頭縮放層（`journey-view-model.js`）：設施外觀／事件物件／NPC 與玩家車輛（含透明車窗頭像與車輪揚塵）
  8. 近景路肩草石
  9. 日夜暗化遮罩與夜間車頭燈光錐
  10. 環境天氣粒子（7 種粒子，上限 72 顆）與雨滴濺水
  11. 浮動回饋文字與駕駛頭頂驚嘆號氣泡（`encounter-marker.js`）
  12. 節流 DOM 讀數更新（時間／車速／地名／公里數）
- **9 層精準接地系統（`scenery-ground.js` + `scenery-ground-data.js`）**：依離線預先量測的 alpha 可見底緣，將 `terrain(165)` 到 `foreground(237)` 共 9 層物件精準貼地並繪製接觸影。

### 6.3 戰鬥演出與 NPC 呈現

- **原生戰鬥圖集（`combat-art.js`）**：`dist/assets/combat/` 下共 **741 張**原生像素 PNG（720 張 `64×96` 旅人〔12 種族 × 20 職業 × 3 武器〕+ 16 張 `96×96` 敵人 + 5 張 `128×128` 首領）。
- **節奏與半身像（`battle-presentation.js`）**：單拍 `BEAT_MS = 980ms`、命中瞬間 `IMPACT_MS = 360ms`；出手與受擊隊員從底緣依所屬隊伍欄探出腰部以上半身像並以 4px 水平條紋呈現傾斜，柔和模式改為靜止淡入淡出。
- **像素特效引擎（`battle-effects.js`）**：支援 42 種純整數網格特效形狀（13 彈道、8 近戰、治療、36 種超能力變體），分為蓄力 → 飛行/揮擊 → 命中接觸三階段；**未命中或 0 傷害不繪製誤導性火花**。
- **隱性態度敘事（`npc-presentation.js`）**：6 態度 × 8 句神情描述（48 句）+ 12 種族迎客動作，不在介面直接暴露「友善/敵對」系統標籤，並於顯示舊存檔時即時遮蔽。

### 6.4 歷史保留視覺模組（未啟用但保留測試）

`hd-art.js`、`hd-stage.js`、`volume-light.js`、`volume-events.js`、`vehicle-volume.js`、`vehicle-volume.css`、`roadside-atlas.js` 屬於曾探索過的 HD2D 與 2.5D Volume 實驗管線，目前未由 `index.html` 載入，但仍保留於 repo 並受 3 支測試檔保護。

---

## 7. 工具鏈、美術資產與測試體系

### 7.1 `tools/` 腳本分類（26 支）

- **資料同步／編譯（5 支）**：`sync_data.py`、`build-dialogue.mjs`、`build-origins.mjs`、`build-progression.mjs`、`build-route.mjs`。
- **美術總控與驗證（3 支）**：
  - `rebuild_art.py`：一鍵串接 13 支生成／重繪／圖集連結／接地量測／檢查腳本。
  - `check_art.py`：驗證全部 `manifest.json` 檔案存在、數量正確、SVG `crispEdges`、PNG 合法性與全部車輛/變體 `windows.length === seats`。
  - `measure_scenery_ground.mjs`：以 `sharp` 離線掃描 alpha 邊界產出 `dist/scenery-ground-data.js`。
- **像素美術與圖集生成（14 支）**：`make_art.py`、`make_event_art.py`、`redraw_characters.py`、`redraw_vehicles.py`、`redraw_scenery.py`、`build-starters.mjs`、`build_combat_art.py`、`build_pixel_horizons.py`、`build_pixel_interiors.py`、`build_pixel_facilities.py`、`make-vehicle-weapons.mjs`、`link_painted_art.py`、`link_npc_battle_art.py`；以及歷史管線 `build-hd-art.mjs`、`build-road-event-art.mjs`、`build_volume_buildings.py/.mjs`。
- **QA 除錯（1 支）**：`make-qa.mjs`（產生多組確定性狀態夾具頁 `dist/qa.html`）。

### 7.2 測試套件（`tests/`，28 檔 / 217 項測試）

- **核心引擎與規則（8 檔，114 項）**：`engine`、`progression-combat`、`origins-vehicles`、`automatic-journey`、`route-regions`、`equipment`、`event-rewards`、`journey-ui`。
- **對話與敘事（3 檔，21 項）**：`dialogue`、`companion-dialogue`、`npc-presentation`。
- **戰鬥呈現、特效與輸入（5 檔，31 項）**：`battle-presentation`、`battle-effects`、`motion`、`combat-art`、`battle-input`。
- **舞台、天空、天氣、路邊與遭遇提示（9 檔，41 項）**：`encounter-cue`、`encounter-marker`、`atmosphere`、`journey-view`、`weather`、`visual-content`、`roadside`、`scenery-ground`、`roadside-decoration`。
- **歷史視覺管線回歸保護（3 檔，10 項）**：`vehicle-volume`、`volume-events`、`hd-art`。

---

## 8. 開發與修改守則（核心不變量）

未來修改或擴充本專案時，必須遵守以下架構不變量：

1. **主 RNG 隔離**：任何視覺表現、天氣、路邊裝飾、行車時長、預演（`previewArrival`）與演出錄製（`recordVisuals`）都**嚴禁**呼叫主 `game.roll()`，否則會破壞確定性與存檔重播。
2. **資料單一來源**：修改事件、神諭、特性或 NPC 規則時，應先改 `spec/*.json` 再執行 `python3 tools/sync_data.py`（或對應 `tools/build-*.mjs`），切勿只改 `dist/data/`。
3. **版本快取控制**：修改 `dist/*.js` 或 `dist/*.css` 後，若要部署更新，需同步更新 `dist/index.html` 中 `<script type="importmap">` 與 `<link>` 的 `?v=` 版本字串。
4. **核心遊戲規則不變量**：不引入食物／負重／裝備耐久；所有種族皆需睡眠；車輛改裝限修車廠；隊伍上限固定 4 人且受車位限制；有利事件仍可能抽到敵對 NPC 且必須先判定敵對戰鬥。
5. **存檔向後相容**：新增狀態欄位須在 `Game` 建構子的 `normalize*` 流程補預設值，不得要求清除舊存檔。
6. **美術與發布檢核**：動到圖檔後務必執行 `python3 tools/check_art.py` 與 `node --test tests/*.test.mjs`；發布前確認已刪除 `dist/qa.html`。
