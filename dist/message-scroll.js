// Only animate the small message viewport; never scroll the game page.
// Supports 'auto' (smooth auto-scroll) and 'manual' (tap screen to page down when overflowing).
const MODE_KEY='eastward.textMode';
let ticker=null,lastId=0,oldTop=0,holdUntil=0,mounted=null,manualHold=false,textMode=loadInitialMode();

function loadInitialMode(){
 try{
  const v=globalThis.localStorage?.getItem(MODE_KEY);
  return v==='manual'?'manual':'auto';
 }catch{return 'auto';}
}

export function getTextMode(){return textMode;}

export function setTextMode(mode){
 textMode=mode==='manual'?'manual':'auto';
 try{globalThis.localStorage?.setItem(MODE_KEY,textMode);}catch{}
 syncOverflowCue();
 return textMode;
}

export function toggleTextMode(){
 return setTextMode(textMode==='manual'?'auto':'manual');
}

export function hasMessageOverflow(el=mounted){
 if(!el)return false;
 return el.scrollHeight-el.clientHeight-el.scrollTop>4;
}

function syncOverflowCue(el=mounted){
 if(!el)return;
 el.dataset.textMode=textMode;
 const win=el.closest?.('.message-window');
 if(win)win.classList.toggle('has-more-text',textMode==='manual'&&hasMessageOverflow(el));
}

export function advanceManualPage(el=mounted){
 if(textMode!=='manual'||!hasMessageOverflow(el))return false;
 const step=Math.max(44,el.clientHeight-22);
 el.scrollTop=Math.min(el.scrollHeight-el.clientHeight,el.scrollTop+step);
 oldTop=el.scrollTop;
 syncOverflowCue(el);
 if(!hasMessageOverflow(el))holdUntil=performance.now()+2600;
 return true;
}

export function stopMessageScroll(){
 clearInterval(ticker);ticker=null;
 if(mounted)oldTop=mounted.scrollTop;
 mounted=null;
}

export function resetMessageScroll(){
 stopMessageScroll();lastId=0;oldTop=0;holdUntil=0;
}

export function isMessageReadingPaused(){
 return manualHold||(textMode==='manual'&&hasMessageOverflow())||performance.now()<holdUntil;
}

export function mountMessageScroll(el,{prompt=false,transient=false,focusTitle=null,paused=false}={}){
 if(!el)return;
 stopMessageScroll();
 mounted=el;
 manualHold=!!paused;
 if(transient){el.scrollTop=el.scrollHeight;syncOverflowCue(el);return;}
 const rows=[...el.querySelectorAll('[data-message-id]')],latest=Number(rows.at(-1)?.dataset.messageId)||0;
 const newRows=rows.filter(row=>Number(row.dataset.messageId)>lastId);
 const firstNew=(focusTitle&&newRows.find(row=>row.querySelector('strong')?.textContent===focusTitle))||newRows[0];
 if(firstNew){
  el.scrollTop+=firstNew.getBoundingClientRect().top-el.getBoundingClientRect().top;
  holdUntil=performance.now()+2800;
 }else{
  el.scrollTop=oldTop;
 }
 if(prompt&&textMode==='auto'&&!firstNew)el.scrollTop=el.scrollHeight;
 lastId=latest;
 oldTop=el.scrollTop;
 syncOverflowCue(el);

 const pause=()=>{if(textMode==='auto')holdUntil=performance.now()+10000;syncOverflowCue(el);};
 el.addEventListener('scroll',()=>syncOverflowCue(el),{passive:true});
 el.addEventListener('pointerdown',pause,{passive:true});
 el.addEventListener('touchstart',pause,{passive:true});
 el.addEventListener('touchmove',pause,{passive:true});
 el.addEventListener('wheel',pause,{passive:true});
 el.addEventListener('keydown',pause);

 ticker=setInterval(()=>{
  if(!el.isConnected){stopMessageScroll();return;}
  oldTop=el.scrollTop;
  syncOverflowCue(el);
  if(textMode==='manual'||manualHold||document.hidden||performance.now()<holdUntil||el.scrollTop>=el.scrollHeight-el.clientHeight-1)return;
  el.scrollTop=Math.min(el.scrollHeight-el.clientHeight,el.scrollTop+1.4);
  oldTop=el.scrollTop;
 },120);
}
