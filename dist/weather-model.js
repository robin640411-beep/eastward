// Visual-only weather. Never consumes the journey's random stream or changes rules.
export const WEATHER_PROFILES={
 salt:{dust:.5},canyon:{dust:.6,leaf:.12},forest:{leaf:1,rain:.16},city:{rain:.5,leaf:.22},
 coast:{rain:.65},industrial:{ash:.7,rain:.18},marsh:{rain:.65,leaf:.45},desert:{dust:1},
 farmland:{leaf:.5,petal:.6},snow:{snow:1},alien:{spore:.8,ash:.2},oasis:{petal:1,leaf:.35}
};
export const PARTICLE_LIMITS={rain:72,snow:64,leaf:24,petal:28,dust:22,ash:18,spore:18};
export function visualHash(value){let n=2166136261;for(const ch of String(value))n=Math.imul(n^ch.charCodeAt(0),16777619);return n>>>0;}
function randomStream(seed){let n=visualHash(seed)||1;return ()=>{n^=n<<13;n^=n>>>17;n^=n<<5;return (n>>>0)/4294967296;};}
const unit=n=>Math.max(0,Math.min(1,n));
export function weatherLayers({seed,from,to=from,blend=0,seconds=0,storm=0}){
 const layers={},mix=unit(blend),strength=unit(storm);
 for(const [region,weight] of [[from,1-mix],[to,mix]]){if(!weight)continue;const phase=visualHash(`${seed}:${region.index??0}:${region.id}`)%628/100;
  // Slow gusts keep weather changing without popping when the camera or event changes.
  const gust=.85+.15*Math.sin(seconds*.13+phase);
  for(const [kind,density] of Object.entries(WEATHER_PROFILES[region.id]||{}))layers[kind]=(layers[kind]||0)+density*gust*weight*(1-strength*.8);
 }
 if(strength)layers.rain=Math.max(layers.rain||0,strength);
 return Object.entries(layers).filter(([,density])=>density>.01).map(([kind,density])=>({kind,density:unit(density)}));
}
export function particlePool(seed){const rand=randomStream(`weather-particles:${seed}`);return Array.from({length:72},()=>({x:rand()*424,y:rand()*280,depth:.35+rand()*.65,phase:rand()*Math.PI*2,sway:rand()*9,spin:rand()*2-1}));}
export function lightningGeometry(seed,cycle){const rand=randomStream(`lightning:${seed}:${cycle}`),x0=38+rand()*306,endY=112+rand()*43,lean=(rand()-.5)*65;
 const main=[[x0,-8]],forks=[];for(let i=1;i<=11;i++)main.push([Math.max(8,Math.min(376,x0+lean*i/11+(rand()-.5)*37)),endY*i/11]);
 for(const index of [3,5,7]){const start=main[index],direction=rand()<.5?-1:1,path=[start];let x=start[0],y=start[1];for(let j=0;j<4;j++){x=Math.max(4,Math.min(380,x+direction*(8+rand()*14)));y+=6+rand()*10;path.push([x,y]);}forks.push(path);}
 return {main,forks};
}
const boltCache=new Map();
export function lightningAt(seed,seconds,soft=false){if(seconds<0)return null;const cycle=Math.floor(seconds/8),delay=.35+(visualHash(`strike:${seed}:${cycle}`)%3000)/1000,age=seconds-cycle*8-delay,duration=soft?1.1:.82;if(age<0||age>duration)return null;
 const key=seed+':'+cycle;if(!boltCache.has(key)){if(boltCache.size>=8)boltCache.delete(boltCache.keys().next().value);boltCache.set(key,lightningGeometry(seed,cycle));}
 const alpha=age<.12?age/.12:age<.4?1:unit((duration-age)/(duration-.4));
 return {...boltCache.get(key),alpha,age,cycle,glow:soft?0:alpha*.12};
}
