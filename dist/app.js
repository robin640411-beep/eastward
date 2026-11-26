import {ALERT_MS,createEncounterCue,encounterScene,readingDelay} from './encounter-cue.js';
import {horizonPostcard} from './horizon-art.js';
import {concealAttitudeLabels} from './npc-presentation.js';
import {originPages} from './origin-runtime.js';
import {vehicleStats,vehicleArt} from './vehicle-runtime.js';
import {vehiclePanel,garagePanel} from './vehicle-ui.js';
import {battleSlots,bustRole,enemyTargetRegions,commandPage,BEAT_MS,IMPACT_MS} from './battle-presentation.js';
import {encounterCommands} from './encounter-commands.js';
import {automaticDecision,automaticStep,canContinueDriving,declineRest,alternateDriver,syncMessageContext,appendMessage} from './automatic-journey.js';
import {mountMessageScroll,stopMessageScroll,resetMessageScroll,focusMessagesAfter,isMessageReadingPaused,hasMessageOverflow,advanceManualPage,setContinueCue,selectVisibleMessage} from './message-scroll.js';
import {destinationAt,remainingKm,JOURNEY_DISTANCES,DEFAULT_DISTANCE_KM,totalProgressFor} from './route-runtime.js';
import {tripDuration, journalEntry} from './journey-ui.js';
import {characterPanel,inventoryPanel,peoplePicker,inspectedPerson,comparisonCard} from './ui-panels.js';
import {equipmentPreview,itemBonuses} from './equipment-model.js';
import {mountWorld,extendTravelDuration,captureVisual,animateResult,playBattleBeat,clearBattleBeat} from './world-view.js';
import {applyBattleFrame,transitionFor} from './motion-model.js';
import {sceneTransition,waitForBeat,reducedMotion,toggleMotion} from './cinematics.js';
import {enemyLayout,biomeAt,BIOMES} from './journey-view-model.js';
import {Game,ITEMS,MODS,learned,display,phase,phaseName} from './engine.js';
import {COMBAT_BOSS_NAMES} from './combat-art.js';
import {personRaceName,personJobName,proceduralPortraitDataUri} from './procedural-npc.js';
import {storybookEpilogue,selectEnding,heroShortName,partyLabel} from './storybook.js';
import {moralityLabel,isWanted,wantedStars} from './morality-runtime.js';
const root=document.getElementById('app'),KEY='eastward.save.v1',ENDINGS_KEY='eastward.endings.v1';let data,g,panel=null,timer=null,automaticTimer=null,sound=false,travelStarted=0,travelLength=12000,selectedEnemy=null,pendingCommand=null,combatMenu='root',presentation=null,busy=false,playbackController=null,playbackLabel='',playbackStep=null,playbackPhase=null,titleState=null;
function loadUnlockedEndings(){try{const arr=JSON.parse(localStorage.getItem(ENDINGS_KEY));return Array.isArray(arr)?new Set(arr):new Set();}catch{return new Set();}}
function recordUnlockedEnding(id){if(!id)return loadUnlockedEndings();const set=loadUnlockedEndings();if(!set.has(id)){set.add(id);try{localStorage.setItem(ENDINGS_KEY,JSON.stringify([...set]))}catch{}}return set;}
const OUTCOME_LABEL={win:'抵達樂園',stranded:'半途改道',death:'旅途殞落'};
function getTitleState(){if(!titleState){const tg=new Game(data);tg.start({seed:2036,race:'human',profession:'driver'});tg.s.mode='driving';tg.s.titleDrive=true;tg.s.vehicle={model:'sedan',hp:30,maxHp:30,mods:[]};titleState=tg.s;}return titleState;}
const ui={personId:null,slot:'全部',itemId:null,shopItemId:null,watchId:null,picker:null,feedback:'',scrollCompare:false,commandPage:0,commandKey:'',distanceKm:DEFAULT_DISTANCE_KM};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const img=(path,alt='',cls='')=>`<img src="${String(path).startsWith('data:')?esc(path):'assets/'+esc(path)}" alt="${esc(alt)}" class="${cls}">`;
const btn=(label,action,args='',cls='',disabled=false)=>`<button class="${cls}" data-action="${action}" ${action==='choicePage'?`aria-label="${esc(label)}"`:''} data-args="${esc(args)}" ${disabled?'disabled':''}>${esc(label)}</button>`;
const nameOf=(kind,id)=>data.catalog[kind].find(x=>x.id===id)?.name||id;
const portrait=p=>proceduralPortraitDataUri(p)||data.assets.portraits[p.race];
const currentCue=()=>g.s?.journeyFlow?.encounterCue;
const shownState=()=>presentation||(currentCue()?encounterScene(g.s,currentCue()):g.s);
let focusEventMessage=false;
const bar=(v,max,type='')=>`<div class="bar ${type}"><i style="width:${Math.max(0,Math.min(100,v/max*100))}%"></i></div>`;
function save(){if(g?.s){try{localStorage.setItem(KEY,JSON.stringify(g.s))}catch{g.s.notice='瀏覽器儲存空間不足，請匯出存檔。'}}}
function audio(){if(!sound)return;try{const ctx=new AudioContext(),o=ctx.createOscillator(),a=ctx.createGain();o.type='triangle';o.frequency.value=190;a.gain.setValueAtTime(.03,ctx.currentTime);a.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.1);o.connect(a);a.connect(ctx.destination);o.start();o.stop(ctx.currentTime+.12);o.onended=()=>ctx.close()}catch{}}
async function boot(){const files=['assets/manifest.json','data/npc-catalog.json','data/oracles.json','data/events.json','data/building-events.json','data/traits.json','assets/encounters.json','data/endings.json','data/d12-events.json'];const v=await Promise.all(files.map(f=>fetch(f+new URL(import.meta.url).search).then(r=>{if(!r.ok)throw Error(f);return r.json()})));data={assets:v[0],catalog:v[1],oracles:v[2],events:v[3],buildings:v[4],traits:v[5],encounters:v[6],endings:v[7],d12Events:v[8]};g=new Game(data);g.recordVisuals=true;render()}
function car(v,party,classes=''){const a=vehicleArt(data.assets,v);return `<div class="vehicle ${classes}">${a.windows.map((w,i)=>party[i]?`<img class="passenger" src="${String(portrait(party[i])).startsWith('data:')?esc(portrait(party[i])):'assets/'+esc(portrait(party[i]))}" alt="${esc(display(party[i]))}" style="left:${w.x/160*100}%;top:${w.y/72*100}%;width:${Math.min(w.width,w.height)/160*100}%">`:'').join('')}${img(a.image,a.name,'body')}${v.mods?.filter(x=>x==='gun'||x==='lamp').slice(0,1).map(x=>img(data.assets.mods[x],MODS[x].name,'mod')).join('')}</div>`}
function worldPicture(id,road=false){
 const name=BIOMES.find(b=>b.id===id)?.name||id;
 return horizonPostcard(data.assets.worlds[id],esc(name)+' · 外星佔領區',road);
}
function intro(){let saved=null;try{saved=JSON.parse(localStorage.getItem(KEY))}catch{}const unlocked=loadUnlockedEndings().size,total=data?.endings?.endings?.length||100;const distPicker=`<div class="distance-picker" role="group" aria-label="選擇旅程距離"><span class="distance-label">旅程距離</span><div class="distance-options">${JOURNEY_DISTANCES.map(km=>`<button class="${ui.distanceKm===km?'primary':'quiet'}" data-action="selectDistance" data-args="${km}" aria-pressed="${ui.distanceKm===km}">${km.toLocaleString('en-US')} 公里</button>`).join('')}</div></div>`;return `<div class="intro"><div class="eyebrow">A POST-APOCALYPTIC ROAD STORYBOOK</div><h1>一路向東</h1><blockquote class="storybook-opening">「很久很久以後，曾經有一個人，駕駛著一輛車。」</blockquote><div class="intro-scene world-stage driving"><canvas id="world-canvas" width="384" height="240" role="img" aria-label="很久很久以後，曾經有一個人，駕駛著一輛車向東行駛"></canvas><span class="compass">E →</span></div><p class="author-note">至於我為什麼要寫下這本破爛公路故事書——畢竟外星人統治地球都滿十年了，總得有個倒楣鬼替大家踩下油門，去東邊看看傳說中的「樂園」到底長什麼模樣。</p>${distPicker}<div class="actions">${btn(`翻開這本故事書（${ui.distanceKm.toLocaleString('en-US')} km）`,'start','','primary')}${saved?btn(`翻回上次的書籤 · 第 ${Math.floor(saved.minutes/1440)+1} 天`,'load'):''}${btn(`結局圖鑑 · 已收集 ${unlocked} / ${total}`,'panel','endings','quiet')}</div><div class="footer-note">單人互動故事書 · 12 類 1,200 種公路事件 · 自動保存在此瀏覽器<br><a href="art.html" target="_blank">像素圖鑑</a></div></div>`;}
function partyStrip(battle=false){const s=shownState(),actor=battle&&!presentation?g.commandActor():null,allyTarget=pendingCommand?.allies,clickable=allyTarget||!battle,people=battleSlots(s.party);
 return `<div class="party-strip ${battle?'battle-party':'travel-party'}" aria-label="${battle?'我方隊員':'同行者狀態'}">${people.map((p,index)=>{if(!p)return `<div class="battle-slot empty-slot" data-slot="${index}" aria-label="空隊伍欄位 ${index+1}"><div class="member empty-member"></div></div>`;
 const order=s.battle?.orders?.[p.id],orderName={attack:'攻擊',defend:'防禦',medicine:'藥品',escape:'逃跑',psi:'超能力'}[order?.type],pose=battle&&presentation?bustRole(playbackStep,p.id):null;
 const poseText=pose==='attack'?'出手中':pose?(playbackPhase==='windup'?'迎擊':{hit:'受擊',evade:'閃避',guard:'擋下'}[pose]):'';
 const card=`<${clickable?'button':'div'} data-person="${p.id}" aria-label="${esc(display(p))}，生命 ${p.hp}/${p.maxHp}，體力 ${p.st}/${p.maxSt}，ESP ${p.esp}/${p.maxEsp}" title="${esc(display(p))}" class="member ${p.id===actor?.id?'active':''} ${p.hp<=0?'fallen':''} ${allyTarget?'ally-target':''}" ${clickable?`data-action="${allyTarget?'targetAlly':'openPerson'}" data-args="${p.id}" ${allyTarget&&p.hp<=0?'disabled':''}`:''}><div class="member-identity">${img(portrait(p),'')}<span><strong>${esc(p.name)}</strong><small>${p.hp<=0?'倒下':p.asleep?'睡眠中':p.id===s.driver&&!battle?(s.mode==='driving'?'駕駛中':'駕駛')+' · Lv. '+p.level:'Lv. '+p.level+' · '+personJobName(p,data.catalog)}</small></span></div><div class="member-vitals">${[['生命',p.hp,p.maxHp,'hp'],['體力',p.st,p.maxSt,'st'],['ESP',p.esp,p.maxEsp,'esp']].map(([name,v,max,k])=>`<div><span>${name}<b>${v}<small>/${max}</small></b></span>${bar(v,max,k)}</div>`).join('')}</div>${battle?`<span class="order-state">${poseText||(p.hp<=0?'倒下':p.asleep?'睡眠':orderName?'✓ '+orderName:p.id===actor?.id?'▸ 指令':'等待')}</span>`:''}</${clickable?'button':'div'}>`;
 return `<div class="battle-slot ${pose==='attack'?'acting':pose?'targeted':''}" data-slot="${index}" ${pose?`data-pose="${pose}" data-phase="${playbackPhase}"`:''}>${card}</div>`;
 }).join('')}</div>`;
}
function routeBar(){return `<header class="route-hud">${routeHeader()}</header>`;}
function vehicleHud(){
 const s=shownState(),v=vehicleStats(data.assets,s.vehicle),fuel=s.resources.fuel,reserve=s.resources.fuelReserve||0;
 const metrics=[['油箱',fuel+'/'+v.capacity,'fuel'],['車況',s.vehicle.hp+'/'+s.vehicle.maxHp,'condition'],['裝甲',v.armor,'armor']];
 return `<section class="vehicle-hud" aria-label="玩家車輛狀態"><div class="vehicle-readouts">${metrics.map(([label,value,id])=>`<span class="vehicle-stat ${id}"><small>${label}</small><b>${value}</b></span>`).join('')}<span class="vehicle-stat velocity"><b id="journey-speed">0</b><small>km/h</small></span></div><div class="vehicle-meta"><span>${esc(v.name)} · ${s.party.length}/${Math.min(4,v.seats)} 席${reserve?' · 備用油 '+reserve:''}</span><span id="journey-time">第 ${Math.floor(s.minutes/1440)+1} 天 · ${phaseName(s.minutes)}</span></div></section>`;
}
function routeHeader(){const s=shownState(),totalKm=s.totalKm||1000,km=remainingKm(s.progress,totalKm),destination=destinationAt(s),wanted=isWanted(s)?`<span class="wanted-pill">🚨 通緝 ${'★'.repeat(wantedStars(s))}</span>`:'';return `<div class="route-header" aria-label="旅程位置"><strong id="journey-place">${esc(biomeAt(s.progress,s.seed,s.route).name)}${wanted}</strong><div class="destination-readout"><span>距離 ${esc(destination.name)}</span><span>還剩 <b id="journey-distance">${km.toLocaleString('en-US')}</b> 公里</span></div><div class="route-track" role="img" aria-label="距離樂園還剩 ${km} 公里"><i id="journey-progress" style="width:${(1-km/totalKm)*100}%"></i></div></div>`;}
function enemyTargets(){const s=shownState();if(!s.battle)return '';const enemies=s.battle.enemies,isVeh=s.battle.mode==='vehicle',regions=enemyTargetRegions(enemies,enemyLayout(enemies.length,enemies));return enemies.map((e,i)=>{const r=regions[i],statsLine=isVeh?`車況 ${e.hp}/${e.maxHp} · 裝甲 ${e.armor??e.defense??0} · ${e.hasWeapon?'武裝':'衝撞'}`:`HP ${e.hp}/${e.maxHp}`;return `<button class="world-target ${e.hp<=0?'defeated':''} ${selectedEnemy===e.id?'selected':''} ${pendingCommand&&!pendingCommand.allies?'await-target':''}" style="left:${r.left/384*100}%;width:${r.width/384*100}%;--caption-x:${r.caption/ r.width*100}%" data-enemy-id="${e.id}" ${e.hp<=0?'disabled aria-hidden="true"':''} data-action="targetEnemy" data-args="${e.id}" aria-label="${pendingCommand&&!pendingCommand.allies?'對':'鎖定'}${esc(e.name)}" aria-pressed="${selectedEnemy===e.id}"><span class="enemy-caption"><span>${esc(e.name)}</span><small>${statsLine}</small>${bar(e.hp,e.maxHp,'hp')}</span></button>`;}).join('');}
function scene(){const s=shownState(),title=s.battle?(s.battle.finalBoss?'樂園前的決戰':s.battle.mode==='vehicle'?'公路追逐':'遭遇戰')+' · 第 '+s.battle.round+' 回合':s.mode==='driving'?'向東行駛':s.current?.inside||s.frames?.at(-1)?.kind==='building'?(s.current?.place?.name||'建築內部'):(s.current?.place?.name||'公路旁');const compass=!s.battle||s.battle.mode==='vehicle'?'<span class="compass">E →</span>':'';return `<section class="scene world-stage ${s.mode==='driving'?'driving':''} ${s.battle?'battle-stage':''} ${s.battle?.mode==='vehicle'?'vehicle-battle':''}"><canvas id="world-canvas" width="384" height="240" role="img" aria-label="公路遊戲場景"></canvas><div class="scene-badge">${esc(title)}</div>${compass}<div class="world-targets">${enemyTargets()}</div></section>`}

function encounterNotice(c){
 const reading=c.phase==='reading',driver=g.s.party.find(p=>p.id===g.s.driver);
 const name=reading?c.title:driver?display(driver):'駕駛';
 const message=reading?[c.text,c.threat].filter(Boolean):[c.alert];
 const receipt=!reading&&c.previous?.rewardReceipt;
 return `<section class="message-window encounter-notice" data-phase="${c.phase}" aria-label="旅途訊息視窗"><div class="message-heading"><span>${reading?'迎戰之前':'停靠片刻'}</span></div>
  <div class="encounter-copy" role="log" aria-live="polite" tabindex="0"><strong class="msg-title ${reading?'':'msg-char-name msg-speaker'}">${esc(name)}</strong>${message.map(line=>`<p class="msg-body">${esc(line)}</p>`).join('')}</div>
  ${reading?`<div class="message-actions">${btn(c.button,'ackEncounter','','primary')}</div>`:''}</section>`;
}
function speakerRole(m,s){
 if(!m?.title)return 'event';
 if(m.speakerKind)return m.speakerKind;
 if(m.personId&&s.party.some(q=>q.id===m.personId))return 'party';
 if(s.party.some(q=>m.title===display(q)||m.title===q.name))return 'party';
 const npc=s.current?.npc;
 if(npc&&(m.title===display(npc)||m.title===npc.name))return 'npc';
 if(/^「[^」]+」/.test(m.title)&&!m.title.startsWith('電台'))return 'npc';
 return 'event';
}
function formatMessageParts(text,authorNotes=[],s=null){
 const lines=concealAttitudeLabels(text||'').split('\n').map(l=>l.trim()).filter(Boolean);
 const npc=s?.current?.npc,npcDisp=npc?display(npc):'';
 const html=lines.map(line=>{
  const isAuthor=line.startsWith('（')&&line.endsWith('）');
  if(isAuthor)return `<p class="msg-author">${esc(line)}</p>`;
  if(npcDisp&&line.startsWith(npcDisp)){
   const rest=line.slice(npcDisp.length);
   if(rest.startsWith(' · ')||rest.startsWith('（'))return `<p class="msg-npc-line"><span class="msg-npc-name">${esc(npcDisp)}</span>${esc(rest)}</p>`;
   if(rest)return `<p class="msg-npc-line"><span class="msg-npc-name">${esc(npcDisp)}</span></p><p class="msg-body">${esc(rest.replace(/^[：:]/,''))}</p>`;
   return `<p class="msg-npc-line"><span class="msg-npc-name">${esc(npcDisp)}</span></p>`;
  }
  return `<p class="msg-body">${esc(line)}</p>`;
 });
 for(const note of authorNotes||[]){
  if(note)html.push(`<p class="msg-author">${esc(note)}</p>`);
 }
 return html.join('');
}
function messageWindow(){if(currentCue()&&!presentation)return encounterNotice(currentCue());const s=shownState(),decision=presentation?'wait':automaticDecision(g);let prompt='',actions='';
 if(decision==='rest'){const p=g.driver(),other=alternateDriver(g);prompt=`${display(p)}的體力只剩 ${p.st}，眼皮重得快黏在方向盤上了。${canContinueDriving(g)?'我是覺得該讓他停車睡一覺，還是硬撐著再開一段？':'再硬開下去就要把車開進溝裡了，非得休息或換人接手不可。'}`;actions=btn('靠邊停車休息','restBegin','','primary')+btn('硬著頭皮再開一段','keepDriving','','',!canContinueDriving(g))+(other?btn('換 '+other.name+' 接手方向盤','restSwap'): '');}
 if(decision==='restSetup'){const guard=g.s.party.find(p=>p.id===ui.watchId&&p.st>0&&p.hp>0);if(!guard)ui.watchId=null;prompt=guard?`由${display(guard)}負責守夜，其餘人睡四小時。`:`整車人打算倒頭大睡四小時，連個守夜的都不留——要是半夜被摸上來挨揍可別怪我沒提醒。`;actions=btn('守夜：'+(guard?.name||'無人')+' ▸','cycleWatch')+btn('熄燈睡覺','sleep','','primary')+btn('算了，先不睡','restCancel');}
 if(decision==='stranded'){prompt=s.resources.fuel<=0?`${partyLabel(s)}把油箱燒得一滴不剩了。現在不是去附近翻點油出來，就是乾脆換台車。`:`這輛破車終於徹底罷工了。${partyLabel(s)}得在附近找點修車料或替代車輛才行。`;actions=btn('下車到附近翻找出路','search','','primary');}
 if(decision==='vehicle'){prompt=`路邊居然停著一輛還能發動的車，${heroShortName(s)}正盯著它盤算要不要換車。`;actions=btn('查看這輛車','panel','offer','primary')+btn('繼續開原本的破車','passVehicle');}
 if(decision==='blocked'){prompt=`車廂座位塞不下了，${heroShortName(s)}得先決定誰留在車上。`;actions=btn('整理同行隊伍','panel','party','primary');}
 const events=encounterCommands(g,display),commandKey=[s.mode,s.current?.instance,s.current?.event?.id,events.map(c=>c.action+':'+c.args).join(',')].join('|');if(ui.commandKey!==commandKey){ui.commandKey=commandKey;ui.commandPage=0;}
 let controls='',vInfo=vehicleStats(data.assets,s.vehicle),heading=s.battle?(presentation?'戰況':s.battle.mode==='vehicle'?`座駕 · ${vInfo.name} · 公路追逐`:display(g.commandActor()||s.party[0])+' · 選擇指令'):s.mode==='driving'?'車內 · 沿途片刻':s.current?.place?.name||s.current?.event?.title||'旅途訊息';
 if(s.battle)controls=`<div class="message-commands battle-message-commands" aria-label="戰鬥指令">${presentation?btn('略過本輪動畫 ›','skipPlayback','','quiet'):combatBody()}</div>`;
 else if(actions)controls=`<div class="message-actions">${actions}</div>`;
 else if(events.length){const page=commandPage(events,ui.commandPage);controls=`<div class="message-commands" aria-label="事件選項"><div class="event-choice-grid">${page.items.map(c=>btn(c.label,c.action,c.args,c.style,c.disabled)).join('')}</div>${page.pages>1?`<div class="choice-pagination">${btn('‹ 上一頁','choicePage',page.page-1,'quiet',page.page===0)}<span>${page.page+1} / ${page.pages}</span>${btn('更多選項 ›','choicePage',page.page+1,'quiet',page.page===page.pages-1)}</div>`:''}</div>`;}
 let messages=presentation?[{id:0,title:playbackStep?.visual?.name||'戰況',text:playbackLabel||'準備行動…'}]:(s.messages||[]);
 if(s.battle&&!presentation){
  const startId=s.battle.startMsgId||0;
  const battleMsgs=messages.filter(m=>m.id>startId);
  messages=battleMsgs.length?battleMsgs:[{id:0,title:s.battle.mode==='vehicle'?'公路追逐':'遭遇戰',text:s.notice||(s.battle.mode==='vehicle'?'公路追逐開始，選擇座駕的下一步行動。':'遭遇戰開始，選擇下一步行動。')}];
 }
 const isPrologue=s.mode==='prologue';
 if(isPrologue){
  const hero=s.party.find(p=>p.id===s.protagonistId)||s.party[0];
  heading=`序章 · ${hero?display(hero):'出發之前'}`;
  messages=originPages(g).map((pg,idx)=>({id:idx+1,...pg,personId:idx===0?s.protagonistId:null}));
  controls='';
 }
 const {current:activeMsg,hasNext}=selectVisibleMessage(messages,{battle:!!s.battle,prologue:isPrologue,transient:!!presentation});
 const visibleMessages=activeMsg?[activeMsg]:[];
 const msgTools=`<div class="message-tools"><button class="message-tool-btn" data-action="panel" data-args="messages">展開紀錄</button></div>`;
 const cornerArrow='<span class="manual-next-cue" aria-hidden="true">▼</span>';
 const continueCue=!s.battle&&isPrologue&&!hasNext?'<div class="manual-continue-cue" aria-hidden="true">▸ 點擊畫面發動引擎上路</div>':'';
 return `<section class="message-window ${prompt?'has-prompt':''} ${controls?'has-commands':''}" aria-label="旅途訊息視窗"><div class="message-heading"><span>${esc(heading)}</span>${msgTools}</div><div class="message-scroll-wrap"><div class="message-scroll" role="log" aria-label="訊息與對話" aria-live="polite" tabindex="0">${visibleMessages.map(m=>{const p=s.party.find(p=>p.id===m.personId),role=speakerRole(m,s),titleCls=role==='npc'?'msg-title msg-npc-name msg-speaker':role==='party'?'msg-title msg-char-name msg-speaker':'msg-title';return `<article class="message-line ${p?'has-person':''}" data-message-id="${m.id}">${p?img(portrait(p),''):''}<div>${m.title?`<strong class="${titleCls}">${esc(m.title)}</strong>`:''}${p?`<small>${personRaceName(p,data.catalog)} · ${personJobName(p,data.catalog)}</small>`:''}${formatMessageParts(m.text,m.authorNotes,s)}</div></article>`;}).join('')}${prompt?`<p class="travel-prompt">${esc(prompt)}</p>`:''}</div>${cornerArrow}</div>${continueCue}${controls}</section>`;
}

async function runAutomaticDecision(decision){
 if(!g?.s||panel||busy||presentation||document.hidden||automaticDecision(g)!==decision)return false;
 clearTimeout(automaticTimer);automaticTimer=null;
 const before=structuredClone(g.s),prevSerial=g.s.messageSerial||0;resetVisuals();
 try{automaticStep(g);if((g.s?.messageSerial||0)>prevSerial||g.s?.notice!==before.notice)focusMessagesAfter(prevSerial);await presentChange(before,decision);return true;}
 catch(error){console.error(error);g.s.notice='行動暫停：'+error.message;render();return false;}
}

function scheduleAutomatic(afterManualFlip=false){clearTimeout(automaticTimer);automaticTimer=null;if(!g.s||panel||presentation||busy||document.hidden)return;const cue=currentCue();
 if(cue){
  if(cue.phase==='alert')automaticTimer=setTimeout(()=>{
   if(document.hidden||busy||currentCue()!==cue)return;
   if(cue.combat)cue.phase='reading';
   else {delete g.s.journeyFlow.encounterCue;focusEventMessage=true;}
   render();
  },ALERT_MS);
  return;
 }
 const decision=automaticDecision(g),continuable=['drive','finish','resolveSearch'].includes(decision);
 setContinueCue(continuable);
 if(!continuable)return;
 // While text overflows in manual mode, never auto-advance — wait for the player to flip pages.
 if(hasMessageOverflow())return;
 const waitMs=afterManualFlip?2400:(decision==='drive'?2600:Math.min(4800,Math.max(2600,readingDelay(g.s)*0.35)));
 automaticTimer=setTimeout(()=>{
  automaticTimer=null;
  if(hasMessageOverflow())return;
  runAutomaticDecision(decision);
 },waitMs);
}
function navigation(){const paths={party:'M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 21v-2a6 6 0 0 1 12 0v2M16 5a4 4 0 0 1 0 7M17 15a5 5 0 0 1 5 5v1',bag:'M7 7V5a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v2M4 7h16v14H4ZM4 13h16M10 11v5h4v-5',vehicle:'M3 15l2-8h14l2 8v5h-3v-3H6v3H3ZM4 13h16M7 16h2m6 0h2',journal:'M4 3h12l4 4v14H4ZM8 8h5m-5 5h8m-8 4h6',menu:'M4 6h16M4 12h16M4 18h16'};return `<nav class="nav" aria-label="旅程選單">${[['party','隊伍'],['bag','背包'],['vehicle','車輛'],['journal','紀錄'],['menu','選單']].map(([id,label])=>`<button data-action="panel" data-args="${id}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[id]}"/></svg><span>${label}</span></button>`).join('')}</nav>`}
function combatBody(){const s=g.s,p=g.commandActor(),orders=Object.keys(s.battle.orders||{}),reserved=Object.values(s.battle.orders||{}).filter(o=>o.type==='medicine').length,isVeh=s.battle.mode==='vehicle',vStats=isVeh?vehicleStats(data.assets,s.vehicle):null,armedVeh=isVeh&&vStats?.weapon?.bonus>0&&vStats.weapon.style!=='ram';let commands='';
 if(!p)commands=btn('等待敵方行動','combat','defend','primary');
 else if(pendingCommand)commands=`<p class="target-hint">${pendingCommand.allies?'點選上方隊員，選擇治療對象':isVeh?'選擇目標敵車，也可以直接點敵車':'選擇目標，也可以直接點敵人'}</p>${pendingCommand.allies?'':`<div class="enemy-choices" aria-label="選擇攻擊目標">${s.battle.enemies.filter(e=>e.hp>0).map(e=>btn(e.name,'targetEnemy',e.id)).join('')}</div>`}${btn('返回指令','cancelCommand','','quiet')}`;
 else if(combatMenu==='psi')commands=`<div class="psi-list">${learned(p).map(pow=>btn(pow.name+' · '+pow.cost+' ESP','psi',pow.id,'',p.esp<pow.cost)).join('')}${btn('返回指令','cancelCommand','','quiet')}</div>`;
 else if(isVeh)commands=`<div class="command-grid">${btn(armedVeh?'⚔ 車載開火':'⚔ 車體衝撞','combat','attack','primary')}${btn('◇ 閃避甩尾','combat','defend')}${btn('✚ 藥品 '+(s.resources.medicine-reserved),'combat','medicine','',s.resources.medicine<=reserved)}${btn('↗ 加速甩開','combat','escape')}</div>`;
 else commands=`<div class="command-grid">${btn('⚔ 攻擊','combat','attack','primary')}${btn('✧ 超能力','psiMenu','','',!learned(p).length)}${btn('✚ 藥品 '+(s.resources.medicine-reserved),'combat','medicine','',s.resources.medicine<=reserved)}${btn('◇ 防禦','combat','defend')}${btn('↗ 逃跑','combat','escape')}${btn('↶ 上一人','undoOrder','','quiet',!orders.length)}</div>`;
 return commands}
function panelHtml(){if(!panel)return '';const s=g.s;let title='',content='';
 if(panel==='endings'){const list=data?.endings?.endings||[],unlocked=loadUnlockedEndings();title=`結局圖鑑 · ${unlocked.size} / ${list.length}`;content=`<p class="panel-explanation">收錄 100 種旅途終章（60 種抵達樂園、20 種半途改道、20 種旅途殞落）。每次走到故事盡頭都會自動珍藏對應結局與插畫。</p><div class="endings-grid">${list.map(e=>{const open=unlocked.has(e.id),num=String(e.roll).padStart(3,'0');return `<article class="ending-card ${open?'unlocked':'locked'}"><div class="ending-card-head"><span>#${num}</span><small>${OUTCOME_LABEL[e.outcome]||e.outcome}</small></div>${open?`<img class="ending-thumb" src="assets/${esc(e.image)}" alt="${esc(e.title)}" loading="lazy"><strong>${esc(e.title)}</strong>`:`<div class="ending-thumb-locked" aria-hidden="true">?</div><strong>???</strong>`}</article>`;}).join('')}</div>`;return `<div class="panel-back" data-panel="${esc(panel)}"><section class="panel game-panel" role="dialog" aria-modal="true" aria-labelledby="panel-title"><div class="panel-header"><div><small>EASTWARD / 100 ENDINGS</small><h2 id="panel-title" tabindex="-1">${title}</h2></div>${btn('關閉','close','','quiet')}</div>${content}</section></div>`;}
 if(!s)return '';
 if(panel==='party'){title='角色與裝備';content=characterPanel(g,data,ui);}
 if(panel?.startsWith('dismiss:')){const p=s.party.find(p=>p.id===panel.split(':')[1]);title='讓同伴離開';content=`<p>確定讓 ${esc(display(p))} 離開？他會帶走身上的裝備。將來也許還會在路上再度相遇。</p><div class="actions">${btn('讓他離開','dismiss',p.id,'danger')}${btn('留下','panel','party')}</div>`}
 if(panel==='bag'){title='裝備與背包';content=inventoryPanel(g,data,ui);}
 if(panel==='vehicle'){title='旅途中的座駕';content=vehiclePanel(g,data,{img,bar,display,esc,btn});}
 if(panel==='offer'){title='替代車輛';const o=s.offerVehicle;if(o){const v=data.assets.vehicles[o.model];content=`${img(v.image,v.name)}<h3>${v.name}</h3><p>${v.seats} 席 · 車況 ${o.hp}/${o.maxHp} · 剩餘汽油 ${o.fuel}</p><p class="event-text">換車時公共背包保留，舊車固定改裝不轉移。</p>${s.party.length>Math.min(4,v.seats)?`<p class="notice">需要先遣散 ${s.party.length-Math.min(4,v.seats)} 名同伴。</p>${btn('管理同伴','panel','party')}`:btn('換上這輛車','replace','','primary')}`}}
 if(panel==='menu'){const unlocked=loadUnlockedEndings().size,total=data?.endings?.endings?.length||100,m=s.morality||0,maxProg=totalProgressFor(s);title='旅程選單';content=`<div class="menu-summary"><span class="window-label">THE JOURNEY</span><h3>第 ${Math.floor(s.minutes/1440)+1} 天 · ${phaseName(s.minutes)}</h3><p>走過 ${s.progress} / ${maxProg}（${(s.totalKm||1000).toLocaleString('en-US')} 公里路線）· ${s.stop} 次停靠 · 道德值 ${m>0?'+':''}${m}（${moralityLabel(m)}）</p></div><div class="actions system-actions">${btn('休息與守夜','panel','sleep','',!['ready','event'].includes(s.mode))}${btn('整理隊伍與裝備','panel','party')}${btn(`結局圖鑑 (${unlocked}/${total})`,'panel','endings')}${btn(reducedMotion()?'動畫：柔和':'動畫：完整','motion')}${btn('匯出旅程存檔','export')}</div><p class="panel-explanation">旅程會自動保存在此瀏覽器。</p>`;}
 if(panel==='journal'){const m=s.morality||0;title='旅途紀錄';const origin=s.party.find(p=>p.id===s.protagonistId)?.origin;content=(origin?`<details class="oral-archive"><summary>來時的路</summary><h3>${esc(origin.past.title)}</h3><p>${esc(origin.past.text)}</p><h3>${esc(origin.motive.title)}</h3><p>${esc(origin.motive.text)}</p></details>`:'')+`<div class="history-era"><span>外星統治 · 第十年 · 道德 ${m>0?'+':''}${m}（${moralityLabel(m)}）</span><strong>${s.world.currentYear} 年</strong><small>佔領始於 ${s.world.year} 年 · ${esc(s.world.faction)}</small></div><details class="oral-archive"><summary>東方的傳聞 <span>${s.bossRumors?.length||0} 則</span></summary>${(s.bossRumors||[]).map(r=>`<article><small>${esc(r.speaker)}</small><p>${esc(r.text)}</p></article>`).join('')||'<p>還沒有聽過東方入口的消息。</p>'}</details><details class="oral-archive"><summary>旅人口述 <span>${s.oralHistory?.length||0} 則</span></summary><p class="tiny">記下旅人說過的話；傳聞與個人記憶未必等同完整史實。</p>${(s.oralHistory||[]).map(h=>`<article><small>佔領第 ${h.year} 年 · ${esc(h.speaker)}</small><h3>${esc(h.title)}</h3><p>${esc(h.text)}</p></article>`).join('')||'<p>還沒有聽到旅人的故事。</p>'}</details><div class="card"><h3>${s.world.archive}</h3><p class="tiny">這一局的世界，正在透過你的發現逐漸成形。</p>${s.history.map(t=>`<p class="event-text">${esc(t)}</p>`).join('')||'<p class="tiny">尚未取得歷史紀錄。</p>'}</div>${s.logs.map(journalEntry).filter(Boolean).map(l=>`<div class="log"><small>第 ${Math.floor(l.minutes/1440)+1} 天 · ${esc(l.title)}</small><p>${esc(l.text)}</p></div>`).join('')}`}
 if(panel==='messages'){title='訊息全文';const list=[...(s.mode==='prologue'?originPages(g).map((pg,idx)=>({id:'origin-'+idx,...pg,personId:idx===0?s.protagonistId:null})):(s.messages||[]))].reverse();content=`<p class="panel-explanation">關閉此視窗後才會繼續旅程。由最新到最舊排列：</p><div class="full-messages-list">${list.map(m=>{const p=s.party.find(q=>q.id===m.personId);return `<article class="full-message-card ${p?'has-person':''}">${p?img(portrait(p),''):''}<div><strong>${esc(m.title)}</strong>${p?`<small>${personRaceName(p,data.catalog)} · ${personJobName(p,data.catalog)}</small>`:''}<p>${esc(concealAttitudeLabels(m.text))}</p></div></article>`;}).join('')||'<p class="tiny">目前沒有訊息。</p>'}</div>`;}
 if(panel==='shop'){title='交易與服務';const shop=s.current?.service;const items=[];if(shop==='npc_trade'){const npc=s.current.npc,stock=npc.stock||{fuel:1,medicine:1,item:1};if(stock.fuel)items.push(['10 點汽油 · '+g.price(3)+' 廢料','fuel:']);if(stock.medicine)items.push(['1 份藥品 · '+g.price(2)+' 廢料','medicine:']);const item=npc.tradeItem||'tools';if(stock.item)items.push([ITEMS[item].name+' · '+g.price(ITEMS[item].price)+' 廢料','item:'+item]);}if(['fuel_shop','general_shop'].includes(shop))items.push(['10 點汽油 · '+g.price(3)+' 廢料','fuel:']);if(['pharmacy','general_shop','clinic'].includes(shop))items.push(['1 份藥品 · '+g.price(2)+' 廢料','medicine:']);if(['general_shop','equipment_shop'].includes(shop))Object.entries(ITEMS).forEach(([id,it])=>items.push([it.name+' · '+g.price(it.price)+' 廢料','item:'+id]));if(shop==='clinic')items.push(['治療全隊 · 2 廢料','heal:']);if(shop==='hotel')items.push(['安全住宿 · 3 廢料','hotel:']);if(shop==='vehicle_shop')Object.entries(data.assets.vehicles).forEach(([id,v])=>items.push([v.name+' · '+g.price(10+v.seats*2)+' 廢料','vehicle:'+id]));content=`<p class="shop-wallet">持有 <b>${s.resources.scrap}</b> 廢料 · 交易者 ${esc(display(g.actor()))}</p>${items.some(([,a])=>a.startsWith('item:'))?peoplePicker(g,data,inspectedPerson(g,ui).id,'inspectPerson','裝備比較對象'):''}${ui.shopItemId?comparisonCard(g,data,ui,ui.shopItemId,{shop:true}):''}<div class="actions shop-items">${items.map(([l,a])=>a.startsWith('item:')?`<button class="shop-equipment" data-action="inspectShopItem" data-args="${a.split(':')[1]}"><strong>${esc(l)}</strong><small>${itemBonuses(a.split(':')[1])}</small><span>查看裝備比較 ›</span></button>`:btn(l,'buy',a)).join('')}</div>`;if(shop==='garage')content=garagePanel(g,{btn,img});}
 return `<div class="panel-back" data-panel="${esc(panel)}"><section class="panel game-panel" role="dialog" aria-modal="true" aria-labelledby="panel-title"><div class="panel-header"><div><small>EASTWARD / TRAVELLERS</small><h2 id="panel-title" tabindex="-1">${title}</h2></div>${btn('關閉','close','','quiet')}</div>${ui.feedback?`<div class="panel-feedback" role="status">${esc(ui.feedback)}</div>`:''}${content}</section></div>`}
function render(){if(!data)return;clearTimeout(automaticTimer);automaticTimer=null;stopMessageScroll();if(!g.s||g.s.mode!=='driving'){clearTimeout(timer);timer=null;}if(g.s&&!presentation&&!currentCue())syncMessageContext(g,display);const oldDialog=root.querySelector('.panel-back'),oldPanel=oldDialog?.dataset.panel,oldScroll=oldDialog?.scrollTop||0;if(!g.s){const oldIntroCanvas=root.querySelector('.intro-scene #world-canvas');root.className='';root.innerHTML=intro()+panelHtml();if(oldIntroCanvas)root.querySelector('#world-canvas')?.replaceWith(oldIntroCanvas);const introCanvas=document.getElementById('world-canvas');if(introCanvas)mountWorld(introCanvas,getTitleState(),data.assets,data.encounters,{duration:12000,travelStart:performance.now()});restoreDialog(oldPanel,oldScroll);return;}const s=shownState();root.className='game-shell mode-'+s.mode+(s.mode==='combat'?' in-combat':'')+(presentation?' is-playing':'');
 if(s.mode!=='combat'){pendingCommand=null;combatMenu='root';}
 if(s.rosterReview&&s.party.length>4){root.innerHTML=`<div class="panel-back" data-panel="roster-review"><section class="panel game-panel" role="dialog" aria-modal="true" aria-labelledby="review-title"><div class="panel-header"><h2 id="review-title" tabindex="-1">調整同行隊伍</h2></div><p class="panel-explanation">隊伍上限為主角與 3 位同伴。舊存檔的角色與裝備都已保留，請選擇讓 ${s.party.length-4} 位同伴離隊，再繼續旅程。</p>${s.party.filter(p=>p.id!==s.protagonistId).map(p=>`<div class="legacy-companion">${img(portrait(p),'')}<div><strong>${esc(display(p))}</strong><small>${nameOf('races',p.race)} · ${nameOf('professions',p.profession)}</small></div>${btn('讓他離隊','reviewDismiss',p.id,'danger')}</div>`).join('')}<p class="panel-explanation">離隊者會帶著穿戴的裝備，將來仍可能再度相遇。公共背包保留。</p></section></div>`;restoreDialog(oldPanel,oldScroll);save();return;}
 if(s.mode==='ending'){const destName=destinationAt(s).name,bossName=COMBAT_BOSS_NAMES[s.finalBoss?.id]||'終點守門者',ending=selectEnding(s,data.endings?.endings),unlocked=recordUnlockedEnding(ending?.id),total=data.endings?.endings?.length||100,pages=storybookEpilogue(s,data.catalog,display,destName,bossName,ending),num=ending?String(ending.roll).padStart(3,'0'):'000',outcomeLabel=OUTCOME_LABEL[ending?.outcome]||(s.end.win?'抵達樂園':'車輪停駐之處');root.innerHTML=`<div class="ending"><span class="label">END OF THE ROAD · 旅程終章</span>${ending?`<div class="ending-badge"><span>ENDING #${num} / ${total}</span><b>${esc(outcomeLabel)}</b></div>`:''}<h1>${ending?esc(ending.title):(s.end.win?'抵達'+esc(destName):'車輪停駐之處')}</h1>${ending?`<img class="ending-art" src="assets/${esc(ending.image)}" alt="${esc(ending.title)}">`:worldPicture(s.end.win?'oasis':'salt')}<div class="storybook-epilogue">${pages.map(para=>`<p>${esc(para)}</p>`).join('')}</div><p class="muted">走過 ${s.progress}/${totalProgressFor(s)} 里程（${(s.totalKm||1000).toLocaleString('en-US')} km）· ${s.stop} 次停靠 · ${new Set(s.seen).size} 處旅途見聞 · 已收集 ${unlocked.size}/${total} 種結局</p><div class="actions">${btn(`結局圖鑑 (${unlocked.size}/${total})`,'panel','endings')}${btn('翻閱旅途手記','panel','journal')}${btn('翻開下一本旅程','new','','primary')}${btn('珍藏這段旅程 (JSON)','export')}</div></div>${panelHtml()}`;restoreDialog(oldPanel,oldScroll);save();return;}
 if(s.mode==='driving'&&!s.travel.preview)s.travel.preview=g.previewArrival();
 const previousCanvas=root.querySelector('#world-canvas');
 root.classList.add('portrait-layout');if(currentCue())root.classList.add('has-encounter-cue');
 root.innerHTML=routeBar()+scene()+messageWindow()+partyStrip(!!s.battle)+vehicleHud()+navigation()+panelHtml();
 if(previousCanvas)root.querySelector('#world-canvas')?.replaceWith(previousCanvas);
 const event=s.current;
 const focusTitle=focusEventMessage&&(event?.rewardReceipt?event.event.title:event?.place?.name||event?.event.title);
 const dec=automaticDecision(g),continuable=!presentation&&!currentCue()&&(s.mode==='prologue'||['drive','finish','resolveSearch'].includes(dec));
 const keepRevealed=['rest','restSetup','stranded','vehicle','blocked'].includes(dec);
 const hasCommands=!!root.querySelector('.message-window .message-commands');
 mountMessageScroll(root.querySelector('.message-scroll'),{transient:!!presentation,focusTitle,continuable,battle:!!s.battle,keepRevealed,hasCommands});
 focusEventMessage=false;

 restoreDialog(oldPanel,oldScroll);save();if(s.mode==='driving'&&!timer){travelStarted=performance.now();travelLength=tripDuration(s);const tryArrive=()=>{if(g.s?.mode!=='driving'){timer=null;return;}if(panel==='messages'||hasMessageOverflow()){travelLength=Math.max(travelLength,performance.now()-travelStarted+2200);extendTravelDuration(travelLength);timer=setTimeout(tryArrive,800);return;}timer=null;const before=structuredClone(g.s),prevSerial=g.s.messageSerial||0;resetVisuals();if(panel!=='messages')panel=null;g.arrive();focusMessagesAfter(prevSerial,{waitForTap:true});presentChange(before,'arrive').catch(console.error)};timer=setTimeout(tryArrive,travelLength);}mountWorld(document.getElementById('world-canvas'),s,data.assets,data.encounters,{duration:travelLength,travelStart:travelStarted,target:selectedEnemy,playback:!!presentation,encounterCue:currentCue()?{key:currentCue().key,phase:currentCue().phase,inside:!!(s.current?.inside||s.frames?.at(-1)?.kind==='building')}:null});
 if(currentCue())root.querySelectorAll('button:not([data-action="ackEncounter"])').forEach(el=>el.disabled=true);
 if(presentation){root.querySelectorAll('button:not([data-action="skipPlayback"]),select').forEach(el=>el.disabled=true);}
 scheduleAutomatic();}
function restoreDialog(previous,scroll){const modal=root.querySelector('.panel-back');document.body.classList.toggle('has-dialog',!!modal);for(const el of root.children)el.inert=!!modal&&el!==modal;
 if(!modal)return;modal.scrollTop=modal.dataset.panel===previous?scroll:0;
 if(modal.dataset.panel!==previous)modal.querySelector('h2')?.focus({preventScroll:true});
 for(const track of modal.querySelectorAll('.people-picker')){const selected=track.querySelector('.selected');if(selected)track.scrollLeft=Math.max(0,selected.offsetLeft-track.offsetLeft-12);}
 if(ui.scrollTop){modal.scrollTop=0;ui.scrollTop=false;}
 if(ui.scrollCompare){ui.scrollCompare=false;modal.querySelector('#equipment-comparison')?.scrollIntoView({block:'nearest',behavior:'instant'});}
}
root.addEventListener('keydown',e=>{const modal=root.querySelector('[role="dialog"]');if(!modal)return;if(e.key==='Escape'){e.preventDefault();panel=null;ui.picker=null;render();return;}if(e.key==='Tab'){const focus=[...modal.querySelectorAll('button:not(:disabled),[tabindex="0"],summary')];if(!focus.length)return;const first=focus[0],last=focus.at(-1);if(e.shiftKey&&(document.activeElement===first||!focus.includes(document.activeElement))){e.preventDefault();last.focus();}else if(!e.shiftKey&&(document.activeElement===last||!focus.includes(document.activeElement))){e.preventDefault();first.focus();}}});
function resetVisuals(){g.visualSteps=[];g.visualStart=null;}
// During a beat the canvas and the skip button stay mounted through contact.
function refreshBattleBeat(phase){
 playbackPhase=phase;
 root.querySelector('.battle-party').outerHTML=partyStrip(true);
 const line=root.querySelector('.message-line');
 line.querySelector('strong').textContent=playbackStep.visual?.name||'戰況';
 line.querySelector('p').textContent=playbackLabel;
 const canvas=root.querySelector('#world-canvas');
 if(phase==='windup'){
  const targets=presentation.party.filter(p=>bustRole(playbackStep,p.id));
  const subjects=targets.map(p=>display(p)).join('、');
  canvas.setAttribute('aria-label',subjects?(playbackStep.side==='party'?subjects+'正在出手':playbackStep.name+'攻向'+subjects):playbackLabel);
 }else{
  root.querySelector('.world-targets').innerHTML=enemyTargets();
  root.querySelectorAll('.world-target').forEach(button=>button.disabled=true);
  if(playbackStep.effects.some(f=>f.side==='vehicle'))root.querySelector('.vehicle-hud').outerHTML=vehicleHud();
 }
}
async function presentChange(before,effectType){
 if(currentCue()){render();return;}
 if(g.s?.current?.carePending)g.collectReward();
 const steps=g.visualSteps||[],start=g.visualStart,transition=transitionFor(before,g.s),visualBefore=before?captureVisual(before):null;
 resetVisuals();
 const cue=createEncounterCue(before,g.s,{action:effectType,start,steps,display});
 if(cue){
  if(cue.combat&&!cue.opening?.start?.battle?.sleepAttack&&g.s.current&&g.s.battle?.enemies.some(e=>e.npc)){
   g.s.current.observedText=[cue.text,cue.threat].filter(Boolean).join('\n');
  }
  g.s.journeyFlow.encounterCue=cue;panel=null;selectedEnemy=null;pendingCommand=null;combatMenu='root';
  render();return;
 }
 save();
 if(!steps.length&&!transition){render();if(visualBefore&&g.s)animateResult(visualBefore,g.s,effectType);return;}
 await playChange(steps,start,transition);
}
async function playChange(steps,start,transition,acknowledging=false){
 busy=true;pendingCommand=null;combatMenu='root';panel=null;
 const reveal=()=>{
  if(acknowledging){delete g.s.journeyFlow.encounterCue;save();}
  if(steps.length)presentation=start;
  render();
 };
 try{
  if(steps.length){
   playbackLabel='準備行動…';playbackController=new AbortController();
   await sceneTransition(transition,transition==='battle'?'遭遇戰':'走進建築',reveal);
   for(const step of steps){
    if(playbackController.signal.aborted)break;
    playbackStep=step;playbackLabel=step.name+' · '+(step.kind==='stun'?'無法行動':step.visual?.name||'行動');
    const started=playBattleBeat(step);
    refreshBattleBeat('windup');
    await waitForBeat(Math.max(0,started+IMPACT_MS-performance.now()),playbackController.signal);
    if(playbackController.signal.aborted)break;
    applyBattleFrame(presentation,step.after);
    playbackLabel=step.name+'：'+step.label;
    refreshBattleBeat('contact');
    await waitForBeat(Math.max(0,started+BEAT_MS-performance.now()),playbackController.signal);
   }
  }else await sceneTransition(transition,transition==='battle'?'遭遇戰':transition==='leave'?'回到公路':g.s.current?.event.title||'走進建築',reveal);
 }finally{presentation=null;playbackStep=null;playbackPhase=null;playbackController=null;clearBattleBeat();busy=false;render();}
}
function updateBattleControls(){
 stopMessageScroll();root.querySelector('.message-window').outerHTML=messageWindow();root.querySelector('.world-targets').innerHTML=enemyTargets();root.querySelector('.battle-party').outerHTML=partyStrip(true);mountMessageScroll(root.querySelector('.message-scroll'),{battle:true,keepRevealed:true});
}
function browseCombat(action,args){if(!g.s?.battle||presentation||panel)return false;
 if(action==='combat'&&['attack','medicine'].includes(args))pendingCommand={type:args,allies:args==='medicine'};
 else if(action==='psiMenu')combatMenu='psi';
 else if(action==='cancelCommand'){pendingCommand=null;combatMenu='root';}
 else if(action==='targetEnemy'&&!pendingCommand){selectedEnemy=args;}
 else if(action==='psi'){const power=learned(g.commandActor()).find(p=>p.id===Number(args));if(!power||['shield','burst'].includes(power.type))return false;pendingCommand={type:'psi',power:args,allies:power.type==='heal'};}
 else return false;
 updateBattleControls();return true;
}
function commitCommand(target){if(!pendingCommand)return;const {allies,...command}=pendingCommand;if(g.combatRound({...command,target})){pendingCommand=null;combatMenu='root';}}
root.addEventListener('click',async e=>{if(e.target.classList.contains('panel-back')&&!busy){panel=null;ui.picker=null;render();return;}const b=e.target.closest('button[data-action]');if(!b){if(!panel&&!busy&&!presentation&&!e.target.closest('button,a,summary,input,select')){const copy=root.querySelector('.encounter-copy');const adv=advanceManualPage();if(adv){audio();if(adv==='next')render();else scheduleAutomatic(true);return;}if(copy&&advanceManualPage(copy)){audio();scheduleAutomatic(true);return;}if(g.s?.mode==='prologue'){audio();const before=structuredClone(g.s);resetVisuals();while(g.s.mode==='prologue')g.advancePrologue();resetMessageScroll();if(g.canDrive())g.depart();await presentChange(before,'depart');return;}const decision=automaticDecision(g);if(!currentCue()&&['drive','finish','resolveSearch'].includes(decision)){audio();await runAutomaticDecision(decision);return;}}return;}if(b.disabled)return;const {action:a,args:x}=b.dataset;if(a==='skipPlayback'){playbackController?.abort();return;}if(busy)return;
 if(currentCue()){
  const cue=currentCue();
  if(a==='ackEncounter'&&cue.phase==='reading'){
   if(cue.combat)await playChange(cue.opening?.steps||[],cue.opening?.start,'battle',true);
   else {delete g.s.journeyFlow.encounterCue;render();}
  }
  return;
 }
 if(browseCombat(a,x))return;if(g.s?.rosterReview&&g.s.party.length>4&&a!=='reviewDismiss')return;try{const before=g.s?structuredClone(g.s):null,prevSerial=g.s?.messageSerial||0,prevNotice=g.s?.notice;resetVisuals();const effectType=pendingCommand?.type==='psi'||Object.values(g.s?.battle?.orders||{}).some(o=>o.type==='psi')?'psi':a==='combat'?x:a==='choose'&&['fight','refuse','challenge'].includes(x)?'explicitFight':a;audio();switch(a){case 'reviewDismiss':g.reviewParty(x);break;case 'motion':toggleMotion();break;case 'prologueNext':g.advancePrologue();resetMessageScroll();break;case 'prologueBack':if(g.s.mode==='prologue'&&g.s.prologue.step>0)g.s.prologue.step--;resetMessageScroll();break;case 'selectDistance':ui.distanceKm=Number(x)||DEFAULT_DISTANCE_KM;break;case 'start':ui.personId=null;ui.feedback='';resetMessageScroll();g.startRandom(undefined,ui.distanceKm);break;case 'load':{const s=JSON.parse(localStorage.getItem(KEY));if(s?.version!==1)throw Error('存檔版本不相容');resetMessageScroll();g=new Game(data,s);g.recordVisuals=true;break;}case 'new':resetMessageScroll();g.s=null;panel=null;break;case 'panel':if(x==='sleep'){g.s.journeyFlow.restSetup=true;ui.watchId=null;panel=null;break;}panel=x;ui.feedback='';ui.shopItemId=null;if(x==='bag'){ui.slot='全部';ui.itemId=null;}if(x==='sleep')ui.watchId=null;break;case 'close':panel=null;ui.feedback='';break;case 'depart':g.depart();break;case 'choicePage':ui.commandPage=Number(x);break;case 'cycleActor':{const people=g.alive().filter(p=>!p.asleep),i=people.findIndex(p=>p.id===g.actor()?.id);if(people.length)g.selectActor(people[(i+1)%people.length].id);break;}case 'choose':if(x==='__rest'){g.s.journeyFlow.restSetup=true;ui.watchId=null;}else g.choose(x);break;case 'explore':g.exploreBuilding();break;case 'finish':g.s.offerVehicle=null;g.s.strandedSearch?g.resolveSearch():g.finishEvent();break;case 'talk':g.talk();break;case 'npcStory':g.npcStory();break;case 'npcIntel':g.npcIntel();break;case 'npcGift':g.npcGift();break;case 'npcFavor':g.npcFavor();break;case 'trait':g.traitAction(x);break;case 'recruit':g.recruit();break;case 'robNpc':g.robNpc();break;case 'stealNpc':g.stealNpc();break;case 'giveCharity':g.giveCharity();break;case 'attackNpc':g.attackCurrentNpc();break;case 'driver':g.changeDriver(x);ui.feedback=g.s.notice;break;case 'heal':g.useMedicine(x);ui.feedback=g.s.notice;break;case 'dismissAsk':panel='dismiss:'+x;break;case 'dismiss':g.dismiss(x);panel='party';break;case 'openPerson':ui.personId=x;panel='party';ui.feedback='';break;case 'inspectPerson':ui.personId=x;ui.feedback='';break;case 'selectActor':g.selectActor(x);break;
case 'gearSlot':panel='bag';ui.slot=x;ui.itemId=null;ui.feedback='';break;case 'gearFilter':ui.slot=x;ui.itemId=null;ui.feedback='';break;
case 'inspectItem':ui.itemId=x;ui.feedback='';ui.scrollCompare=true;break;case 'inspectShopItem':ui.shopItemId=x;ui.feedback='';ui.scrollCompare=true;break;
case 'confirmEquip':{const p=inspectedPerson(g,ui),preview=equipmentPreview(g,p,x);if(preview?.owned&&!preview.same&&p.hp>0&&g.equip(p.id,x)){const changes=preview.stats.filter(v=>v.delta).map(v=>`${v.name} ${v.before} → ${v.after}`).join('、');ui.feedback=`${display(p)}已換上${ITEMS[x].name}。${changes}。${preview.previous?ITEMS[preview.previous].name+'已放回公共背包。':''}`;ui.itemId=null;ui.scrollTop=true;}else ui.feedback='目前無法更換這件裝備。';break;}
case 'watch':ui.watchId=x||null;break;
case 'buy':{const [kind,id]=x.split(':');if(!g.buy(kind,id))g.tell('物資不足、改裝格已滿，或目前不能使用這項服務。');ui.feedback=g.s.notice;if(kind==='mod')ui.scrollTop=true;if(kind==='item'&&ui.feedback==='交易完成。'){ui.feedback='已購買'+ITEMS[id].name+'，存放在公共背包。';ui.shopItemId=null;}if(g.s.offerVehicle)panel='offer';break;}case 'replace':g.replaceVehicle();panel=null;break;case 'restBegin':g.s.journeyFlow.restSetup=true;ui.watchId=null;break;case 'restCancel':g.s.journeyFlow.restSetup=false;break;case 'keepDriving':declineRest(g);break;case 'restSwap':{const p=alternateDriver(g);if(p)g.changeDriver(p.id);break;}case 'cycleWatch':{const ids=[null,...g.alive().filter(p=>p.st>0).map(p=>p.id)];ui.watchId=ids[(ids.indexOf(ui.watchId)+1)%ids.length];break;}case 'passVehicle':g.s.offerVehicle=null;break;case 'sleep':g.s.journeyFlow.restSetup=false;g.sleep(ui.watchId);panel=null;break;case 'search':g.searchStranded();break;case 'targetEnemy':selectedEnemy=x;if(pendingCommand&&!pendingCommand.allies)commitCommand(x);break;case 'targetAlly':if(pendingCommand?.allies)commitCommand(x);break;case 'cancelCommand':pendingCommand=null;combatMenu='root';break;case 'undoOrder':{const ids=Object.keys(g.s.battle.orders||{});if(ids.length)delete g.s.battle.orders[ids.at(-1)];pendingCommand=null;combatMenu='root';break;}case 'psiMenu':combatMenu='psi';break;case 'combat':if(['defend','escape'].includes(x)){g.combatRound({type:x});combatMenu='root';}else pendingCommand={type:x,allies:x==='medicine'};break;case 'psi':{const pow=learned(g.commandActor()).find(p=>p.id===Number(x));if(!pow)break;if(['shield','burst'].includes(pow.type)){g.combatRound({type:'psi',power:x});combatMenu='root';}else pendingCommand={type:'psi',power:x,allies:pow.type==='heal'};break;}case 'export':{const blob=new Blob([JSON.stringify(g.s,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='一路向東-旅程存檔.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);break;}}if(g.s&&!['panel','close','choicePage','motion','export','inspectPerson','inspectItem','inspectShopItem','gearSlot','gearFilter','watch','cycleWatch'].includes(a)&&((g.s.messageSerial||0)>prevSerial||g.s.notice!==prevNotice||g.s.current?.instance!==before?.current?.instance)){const waitForTap=['choose','talk','npcStory','npcIntel','npcGift','npcFavor','robNpc','stealNpc','giveCharity','recruit','trait','explore','search'].includes(a)&&!g.s.battle&&g.s.mode==='event';focusMessagesAfter(prevSerial,{waitForTap});}await presentChange(before,effectType)}catch(err){console.error(err);if(g.s){g.s.notice='操作未完成：'+err.message;render()}}});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&g?.s)render();else {clearTimeout(automaticTimer);automaticTimer=null;}});
boot().catch(e=>{root.innerHTML=`<div class="error">資料載入失敗，請重新整理。<br>${esc(e.message)}</div>`;console.error(e)});
