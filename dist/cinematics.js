let preference=null;try{preference=localStorage.getItem('eastward.motion');}catch{}
let soft=preference?preference==='soft':matchMedia('(prefers-reduced-motion: reduce)').matches;
document.documentElement.dataset.motion=soft?'soft':'full';
export const reducedMotion=()=>soft;
export function toggleMotion(){soft=!soft;document.documentElement.dataset.motion=soft?'soft':'full';try{localStorage.setItem('eastward.motion',soft?'soft':'full');}catch{}}

export function waitForBeat(ms,signal){return new Promise(resolve=>{if(signal?.aborted)return resolve();const done=()=>{clearTimeout(timer);signal?.removeEventListener('abort',done);resolve();},timer=setTimeout(done,ms);signal?.addEventListener('abort',done,{once:true});});}
export async function sceneTransition(kind,title,swap){
 if(!kind){swap();return;}
 const cover=document.createElement('div');cover.className='scene-transition '+kind+(soft?' soft':'');cover.setAttribute('aria-hidden','true');
 const bounds=document.getElementById('app').getBoundingClientRect();cover.style.left=bounds.left+'px';cover.style.width=bounds.width+'px';
 for(let i=0;i<(kind==='battle'?7:2);i++){const band=document.createElement('i');band.style.setProperty('--i',i);cover.append(band);}
 const caption=document.createElement('span');caption.textContent=title;cover.append(caption);document.body.append(cover);
 try{await waitForBeat(soft?100:300);swap();cover.classList.add('revealing');await waitForBeat(soft?160:340);}finally{cover.remove();}
}
