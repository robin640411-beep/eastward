import test from 'node:test';
import assert from 'node:assert/strict';
import {createEncounterCue,encounterScene,readingDelay} from '../dist/encounter-cue.js';
import {automaticDecision} from '../dist/automatic-journey.js';

function stop(instance,count,kind='road'){
 return {stop:3,serial:instance,mode:'event',frames:[{kind,count,scene:kind==='building'?'garage':null}],
  current:{instance,event:{title:'旅人',text:'一個人望向車窗。'}},party:[{hp:20}]};
}
const show=(before,after,action,opening={})=>createEncounterCue(before,after,{action,display:p=>p.name,...opening});

test('同一停靠抽到獨立事件才提示，原地交談與返回父事件不提示',()=>{
 const before=stop(11,1),after=stop(12,2);
 assert.ok(show(before,after,'finish'));
 assert.equal(show(before,before,'talk'),null);
 assert.equal(show(before,before,'explore'),null);
 assert.equal(show(stop(12,2,'building'),before,'finish'),null);
 assert.equal(show(before,after,'load'),null);
});
test('停車預覽只顯示遠方看到的物件，拾取結果在驚嘆號結束後顯示',()=>{
 const after=stop(15,1);after.current.rewardReceipt='獲得厚外套 ×1。';
 const before={...stop(14,0),mode:'driving',travel:{preview:{current:structuredClone(after.current)}}};
 const cue=show(before,after,'arrive'),scene=encounterScene(after,cue);
 assert.equal(scene.current.rewardReceipt,null);
 assert.equal(scene.current.approaching,true);
 assert.equal(cue.combat,false);
 assert.equal(before.travel.preview.current.rewardReceipt,'獲得厚外套 ×1。');
 assert.equal(after.current.rewardReceipt,'獲得厚外套 ×1。');
});
test('敵對搭車者先表明來意再出手，等待期間無戰鬥目標且重新讀檔可繼續',()=>{
 const before=stop(11,1),after=stop(12,2);
 after.current.event.text='老司機提著行李，願意加入你的旅程。';
 after.battle={mode:'character',enemies:[{name:'曾溪',npc:{name:'曾溪'}}]};
 const cue=show(before,after,'finish');
 assert.equal(encounterScene(after,cue).current.instance,11);
 cue.phase='reading';after.journeyFlow={encounterCue:cue};
 const loaded=JSON.parse(JSON.stringify(after));
 assert.equal(automaticDecision({s:loaded}),'wait');
 assert.equal(encounterScene(loaded,loaded.journeyFlow.encounterCue).battle,null);
 assert.equal(encounterScene(loaded,cue).current.instance,12);
 assert.match(cue.text,/搭一程/);assert.match(cue.threat,/撲來/);
 assert.equal(cue.button,'迎戰');
});
test('主動迎戰不重複確認，意外車戰才提示迎戰敵車',()=>{
 const before=stop(21,1),after=stop(21,1);after.battle={mode:'vehicle',enemies:[{name:'追獵車'}]};
 assert.equal(show(before,after,'explicitFight'),null);
 assert.equal(show(before,after,'attackNpc'),null);
 assert.equal(show(before,after,'choose').button,'迎戰敵車');
});
test('室內接連遇敵時駕駛仍在房間，夜襲開場保留受傷前狀態及敵人先攻',()=>{
 const before=stop(10,1,'building'),start=stop(11,2,'building'),after=structuredClone(start);
 start.battle={mode:'character',sleepAttack:true,enemies:[{name:'追蹤獸'}]};after.party[0].hp=6;
 const steps=[{side:'enemy',effects:[{damage:14}]}],cue=show(before,after,'sleep',{start,steps});
 const saved=JSON.parse(JSON.stringify(cue));saved.phase='reading';
 assert.equal(encounterScene(after,saved).party[0].hp,20);
 assert.equal(encounterScene(after,saved).frames[0].scene,'garage');
 assert.deepEqual(saved.opening.steps,steps);assert.match(cue.text,/先/);
 assert.equal(after.party[0].hp,6);
});
test('一般事件留出閱讀時間，長文分配更多時間',()=>{
 const short=stop(1,1),long=stop(1,1);long.current.event.text='長'.repeat(180);
 assert.ok(readingDelay(short)>=4000);assert.ok(readingDelay(long)>readingDelay(short));
});
