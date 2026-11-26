import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {combatArtCatalog,npcCombatArt,enemyCombatArt,combatSprite,combatSpritePath,COMBAT_RACES,COMBAT_JOBS,COMBAT_BOSSES} from '../dist/combat-art.js';
import {GROWTH} from '../dist/progression-catalog.js';
const dist=fileURLToPath(new URL('../dist/',import.meta.url));
const catalog=JSON.parse(readFileSync(dist+'data/npc-catalog.json'));
const manifest=JSON.parse(readFileSync(dist+'assets/manifest.json'));

test('Every catalog race/job/equipment combination has a distinct native-size PNG',()=>{
 assert.deepEqual(COMBAT_RACES,catalog.races.map(r=>r.id));
 assert.deepEqual(COMBAT_JOBS,catalog.professions.map(p=>p.id));
 const descriptors=combatArtCatalog();
 assert.equal(descriptors.length,761);
 const digests=new Set();let bytes=0;
 for(const a of descriptors){
  assert.ok(existsSync(dist+a.image),a.image);
  const png=readFileSync(dist+a.image);bytes+=png.length;
  assert.equal(png.subarray(1,4).toString(),'PNG',a.image);
  assert.equal(png.readUInt32BE(16),a.width,a.image);
  assert.equal(png.readUInt32BE(20),a.height,a.image);
  assert.equal(png[25],6,'RGBA image: '+a.image);
  digests.add(createHash('sha256').update(png).digest('hex'));
 }
 assert.equal(digests.size,761,'Every race, job, equipment and enemy/boss identity stays distinct');
 assert.ok(bytes<2_000_000,'All optional combat assets should remain a small download');
});

test('Hostile NPC art retains race, profession and the actually equipped weapon',()=>{
 const npc={race:'mycelial',profession:'medic',gear:{武器:'pistol'},id:'p94'};
 const before=JSON.stringify(npc);
 assert.equal(enemyCombatArt({key:'raider',npc}).image,'assets/combat/npcs/mycelial_medic_pistol.png');
 assert.equal(combatSpritePath(npc),enemyCombatArt({npc}).image);
 assert.notEqual(npcCombatArt(npc).image,npcCombatArt({...npc,gear:{武器:'club'}}).image);
 assert.equal(npcCombatArt({...npc,gear:{武器:null}}).weapon,'none');
 assert.equal(JSON.stringify(npc),before);
});

test('Every boss replaces its ordinary archetype and obsolete HD image path',()=>{
 assert.deepEqual(COMBAT_BOSSES.slice(0,5),GROWTH.bosses.map(b=>b.id));
 assert.equal(COMBAT_BOSSES.length,15);
 for(const boss of GROWTH.bosses){
  const art=enemyCombatArt({...boss,id:'e0',bossId:boss.id});
  assert.equal(art.kind,'boss');
  assert.equal(art.image,`assets/combat/bosses/${boss.id}.png`);
  assert.notEqual(art.image,enemyCombatArt({key:boss.key}).image);
  assert.equal(combatSprite(boss).image,art.image);
 }
});

test('All live ordinary enemy pools resolve without a fallback and unknown saves are safe',()=>{
 const keys=new Set([...Object.keys(manifest.enemies),...GROWTH.regions.flatMap(r=>r.enemies)]);
 for(const key of keys)assert.equal(enemyCombatArt({key}).key,key);
 assert.equal(npcCombatArt({race:'missing',profession:'missing',gear:{武器:'unknown'}}).image,'assets/combat/npcs/human_driver_none.png');
 assert.equal(enemyCombatArt({key:'missing'}).image,'assets/combat/enemies/raider.png');
 assert.equal(enemyCombatArt(null).kind,'enemy');
});
