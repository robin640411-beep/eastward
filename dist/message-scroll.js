// Pure manual page-flipping for the message viewport; auto-scrolling is disabled.
let lastId=0,oldTop=0,holdUntil=0,mounted=null,canContinue=false;

export function hasMessageOverflow(el=mounted){
 if(!el)return false;
 return el.scrollHeight-el.clientHeight-el.scrollTop>8;
}

export function syncOverflowCue(el=mounted){
 if(!el)return;
 const win=el.closest?.('.message-window');
 if(!win)return;
 const more=hasMessageOverflow(el);
 win.classList.toggle('has-more-text',more);
 win.classList.toggle('can-continue',!more&&canContinue);
}

export function setContinueCue(flag){
 canContinue=!!flag;
 syncOverflowCue();
}

export function advanceManualPage(el=mounted){
 if(!el||!hasMessageOverflow(el))return false;
 const step=Math.max(52,el.clientHeight-24);
 el.scrollTop=Math.min(el.scrollHeight-el.clientHeight,el.scrollTop+step);
 oldTop=el.scrollTop;
 syncOverflowCue(el);
 if(!hasMessageOverflow(el))holdUntil=performance.now()+900;
 return true;
}

export function stopMessageScroll(){
 if(mounted)oldTop=mounted.scrollTop;
 mounted=null;
}

export function resetMessageScroll(){
 stopMessageScroll();lastId=0;oldTop=0;holdUntil=0;canContinue=false;
}

export function isMessageReadingPaused(){
 return hasMessageOverflow()||performance.now()<holdUntil;
}

export function mountMessageScroll(el,{transient=false,focusTitle=null,continuable=false,battle=false}={}){
 if(!el)return;
 stopMessageScroll();
 mounted=el;
 canContinue=battle?false:!!continuable;
 if(transient||battle){
  const rows=[...el.querySelectorAll('[data-message-id]')],latest=Number(rows.at(-1)?.dataset.messageId)||0;
  el.scrollTop=Math.max(0,el.scrollHeight-el.clientHeight);
  if(battle&&latest>lastId)lastId=latest;
  oldTop=el.scrollTop;
  const win=el.closest?.('.message-window');
  if(win){win.classList.toggle('has-more-text',false);win.classList.toggle('can-continue',false);}
  return;
 }
 const rows=[...el.querySelectorAll('[data-message-id]')],latest=Number(rows.at(-1)?.dataset.messageId)||0;
 const newRows=rows.filter(row=>Number(row.dataset.messageId)>lastId);
 const firstNew=(focusTitle&&newRows.find(row=>row.querySelector('strong')?.textContent===focusTitle))||newRows[0];
 if(firstNew){
  el.scrollTop+=firstNew.getBoundingClientRect().top-el.getBoundingClientRect().top;
  holdUntil=performance.now()+1200;
 }else{
  el.scrollTop=oldTop;
 }
 lastId=latest;
 oldTop=el.scrollTop;
 syncOverflowCue(el);
 globalThis.requestAnimationFrame?.(()=>syncOverflowCue(el));
 el.addEventListener('scroll',()=>{oldTop=el.scrollTop;syncOverflowCue(el);},{passive:true});
}
