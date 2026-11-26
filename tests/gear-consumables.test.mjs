import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Game,ITEMS} from '../dist/engine.js';
import {ITEM_DESCRIPTIONS} from '../dist/equipment-model.js';
import {CONSUMABLES,CONSUMABLE_IDS,shopConsumables,consumableEffectText} from '../dist/consumables-catalog.js';

const load=p=>JSON.parse(fs.readFileSync(new URL('../dist/'+p,import.meta.url),'utf8'));
const data={
 assets:load('assets/manifest.json'),
 catalog:load('data/npc-catalog.json'),
 oracles:load('data/oracles.json'),
 events:load('data/events.json'),
 buildings:load('data/building-events.json'),
 traits:load('data/traits.json'),
 encounters:load('assets/encounters.json'),
 endings:load('data/endings.json'),
 d12Events:load('data/d12-events.json'),
};

test('all 36 equipment items (12 weapons, 12 armors, 12 accessories) have descriptions and crisp SVGs',()=>{
 const ids=Object.keys(ITEMS);
 assert.equal(ids.length,36);
 assert.equal(ids.filter(id=>ITEMS[id].slot==='武器').length,12);
 assert.equal(ids.filter(id=>ITEMS[id].slot==='防具').length,12);
 assert.equal(ids.filter(id=>ITEMS[id].slot==='配件').length,12);
 for(const id of ids){
  assert(ITEM_DESCRIPTIONS[id],'Missing description for '+id);
  const svgPath=new URL(`../dist/assets/equipment/${id}.svg`,import.meta.url);
  assert(fs.existsSync(svgPath),'Missing SVG for '+id);
  assert(fs.readFileSync(svgPath,'utf8').includes('crispEdges'));
 }
});

test('all 10 consumables (medkits, food, energy drinks, stew) have SVGs, shop availability, and restore HP/ST/ESP',()=>{
 assert.equal(CONSUMABLE_IDS.length,10);
 for(const id of CONSUMABLE_IDS){
  const svgPath=new URL(`../dist/assets/equipment/${id}.svg`,import.meta.url);
  assert(fs.existsSync(svgPath),'Missing consumable SVG for '+id);
  assert(consumableEffectText(id).length>0);
 }
 assert(shopConsumables('general_shop').includes('canned_ration'));
 assert(shopConsumables('general_shop').includes('neon_soda'));
 assert(shopConsumables('pharmacy').includes('regen_shot'));
 assert(shopConsumables('pharmacy').includes('crystal_elixir'));

 const g=new Game(data);
 g.start({seed:701,totalKm:3000});
 const p=g.s.party[0];
 p.maxHp=50;p.hp=10;
 p.maxSt=40;p.st=5;
 p.maxEsp=30;p.esp=2;

 // Food restores ST
 g.addConsumable('military_mre',1);
 assert(g.useConsumable(p.id,'military_mre'));
 assert.equal(p.st,31);
 assert.equal(p.hp,14);

 // Energy drink restores ESP
 g.addConsumable('crystal_elixir',1);
 assert(g.useConsumable(p.id,'crystal_elixir'));
 assert.equal(p.esp,26);

 // Medkit restores HP (with auto_injector healBonus)
 p.gear.配件='auto_injector';
 g.addConsumable('antibiotics',1);
 const hpBefore=p.hp;
 assert(g.useConsumable(p.id,'antibiotics'));
 assert(p.hp>=hpBefore+20,'Medkit should apply healBonus from auto_injector');

 // Buying consumable from shop works
 g.s.mode='event';
 g.s.resources.scrap=20;
 g.s.current={event:{id:'shop',title:'雜貨鋪',options:[]},dialogue:true,service:'general_shop'};
 const beforeTea=g.s.consumables.psi_coffee||0;
 assert(g.buy('consumable','psi_coffee'));
 assert.equal(g.s.consumables.psi_coffee,beforeTea+1);
});
