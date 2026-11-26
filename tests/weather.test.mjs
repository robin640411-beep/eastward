import test from 'node:test';
import assert from 'node:assert/strict';
import {BIOMES} from '../dist/route-catalog.js';
import {WEATHER_PROFILES,PARTICLE_LIMITS,weatherLayers,particlePool,lightningGeometry,lightningAt} from '../dist/weather-model.js';
import {drawWeatherSky,drawWeatherParticles} from '../dist/weather-art.js';
test('all twenty biomes have bounded ambient weather, including leaves, petals and snow without an event',()=>{
 assert.equal(Object.keys(WEATHER_PROFILES).length,20);
 for(const region of BIOMES){const layers=weatherLayers({seed:445,from:region,seconds:20});assert(layers.length);assert(layers.every(l=>l.density>0&&l.density<=1));assert(layers.reduce((sum,l)=>sum+Math.ceil(PARTICLE_LIMITS[l.kind]*l.density),0)<=100);}
 for(const [id,kind] of [['forest','leaf'],['oasis','petal'],['snow','snow']])assert(weatherLayers({seed:1,from:{id}}).some(l=>l.kind===kind));
});
test('biome transitions blend weather continuously and storm overrides with full rain',()=>{
 const config={seed:44,from:{id:'forest'},to:{id:'snow'},seconds:8};
 assert(!weatherLayers({...config,blend:0}).some(l=>l.kind==='snow'));
 assert(!weatherLayers({...config,blend:1}).some(l=>l.kind==='leaf'));
 const a=weatherLayers({...config,blend:.5}),b=weatherLayers({...config,blend:.501});
 assert(a.some(l=>l.kind==='leaf')&&a.some(l=>l.kind==='snow'));for(const l of a)assert(Math.abs(b.find(k=>k.kind===l.kind).density-l.density)<.002);
 assert.equal(weatherLayers({...config,storm:1}).find(l=>l.kind==='rain').density,1);
});
test('lightning varies its sky location and fork geometry while replaying deterministically',()=>{
 const locations=new Set();for(let cycle=0;cycle<100;cycle++){const bolt=lightningGeometry(445,cycle);assert.deepEqual(bolt,lightningGeometry(445,cycle));assert.equal(bolt.forks.length,3);assert(bolt.main.at(-1)[1]>110);for(const path of [bolt.main,...bolt.forks])for(const [x,y] of path){assert(x>=0&&x<=384);assert(y>=-8&&y<=180);}locations.add(Math.round(bolt.main[0][0]));}
 assert(locations.size>60);assert.notDeepEqual(lightningGeometry(445,0),lightningGeometry(446,0));
});
test('strikes have quiet gaps and a single fade, soft motion removes sky flashes but keeps a visible bolt',()=>{
 let active=0,previous=false,starts=[];
 for(let time=0;time<80;time+=.02){const bolt=lightningAt(445,time);if(bolt){active++;assert(bolt.alpha>=0&&bolt.alpha<=1);if(!previous)starts.push(time);}previous=!!bolt;const soft=lightningAt(445,time,true);if(soft)assert.equal(soft.glow,0);}
 assert.equal(starts.length,10);assert(active<600);assert(starts.slice(1).every((s,i)=>s-starts[i]>4));
});
test('particle pools are stable and every effect renders finite geometry in full and soft modes',()=>{
 assert.equal(particlePool(445).length,72);assert.deepEqual(particlePool(445),particlePool(445));assert.notDeepEqual(particlePool(445),particlePool(446));
 let points=0;const check=(...args)=>{assert(args.every(Number.isFinite));points++;},gradient={addColorStop(){}};
 const ctx={save(){},restore(){},beginPath(){},closePath(){},fill(){},stroke(){},moveTo:check,lineTo:check,fillRect:check,createLinearGradient(...a){check(...a);return gradient;},createRadialGradient(...a){check(...a);return gradient;}};
 for(const soft of [false,true])for(const seconds of [0,.5,2,8,1e6]){for(const from of BIOMES)drawWeatherParticles(ctx,{seed:445,seconds,travel:1e9,soft,layers:weatherLayers({seed:445,from,seconds,storm:1})});drawWeatherSky(ctx,{seed:445,seconds,storm:1,soft});}
 // Sample an actual strike as well as the quiet sky.
 for(let seconds=0;seconds<4;seconds+=.1)drawWeatherSky(ctx,{seed:445,seconds,storm:1});assert(points>1000);
});
