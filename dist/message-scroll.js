// Single-event storybook page-flipping: shows one event at a time, scrolls long text, then flips to next event.
let cursorId=0,lastSeenMaxId=0,nextId=null,oldTop=0,holdUntil=0,mounted=null,canContinue=false;

export function hasPendingNextMessage(){
 return nextId!==null;
}

export function isScrollOverflow(el=mounted){
 if(!el)return false;
 return el.scrollHeight-el.clientHeight-el.scrollTop>8;
}

export function hasMessageOverflow(el=mounted){
 return isScrollOverflow(el)||hasPendingNextMessage();
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

export function selectVisibleMessage(rawMessages,{battle=false,prologue=false,transient=false}={}){
 const list=(rawMessages||[]).filter(Boolean);
 if(!list.length){nextId=null;return {current:null,hasNext:false};}
 // Merge standalone '作者吐槽' entries onto the preceding event so there is never a second yellow title for snark.
 const merged=[];
 for(const m of list){
  if(m.title==='作者吐槽'&&merged.length){
   const prev=merged[merged.length-1];
   merged[merged.length-1]={...prev,authorNotes:[...(prev.authorNotes||[]),m.text]};
  }else if(m.title==='作者吐槽'){
   merged.push({...m,title:'',authorNotes:[m.text],text:''});
  }else{
   merged.push({...m,authorNotes:[]});
  }
 }
 if(transient||battle){
  const cur=merged[merged.length-1];
  cursorId=cur.id;
  lastSeenMaxId=Math.max(lastSeenMaxId,cur.id||0);
  nextId=null;
  return {current:cur,hasNext:false};
 }
 let idx=merged.findIndex(m=>m.id===cursorId);
 if(idx<0){
  if(prologue){
   idx=0;
  }else if(lastSeenMaxId>0){
   const firstUnread=merged.findIndex(m=>m.id>lastSeenMaxId);
   idx=firstUnread>=0?firstUnread:merged.length-1;
  }else{
   idx=merged.length-1;
  }
 }
 const cur=merged[idx];
 cursorId=cur.id;
 lastSeenMaxId=Math.max(lastSeenMaxId,cur.id||0);
 nextId=idx<merged.length-1?merged[idx+1].id:null;
 return {current:cur,hasNext:nextId!==null};
}

export function advanceManualPage(el=mounted){
 if(el&&isScrollOverflow(el)){
  const step=Math.max(52,el.clientHeight-24);
  el.scrollTop=Math.min(el.scrollHeight-el.clientHeight,el.scrollTop+step);
  oldTop=el.scrollTop;
  syncOverflowCue(el);
  if(!hasMessageOverflow(el))holdUntil=performance.now()+900;
  return 'scrolled';
 }
 if(nextId!==null){
  cursorId=nextId;
  lastSeenMaxId=Math.max(lastSeenMaxId,cursorId||0);
  nextId=null;
  oldTop=0;
  if(el)el.scrollTop=0;
  holdUntil=performance.now()+900;
  return 'next';
 }
 return false;
}

export function stopMessageScroll(){
 if(mounted)oldTop=mounted.scrollTop;
 mounted=null;
}

export function resetMessageScroll(){
 stopMessageScroll();cursorId=0;lastSeenMaxId=0;nextId=null;oldTop=0;holdUntil=0;canContinue=false;
}

export function isMessageReadingPaused(){
 return hasMessageOverflow()||performance.now()<holdUntil;
}

export function mountMessageScroll(el,{transient=false,continuable=false,battle=false}={}){
 if(!el)return;
 stopMessageScroll();
 mounted=el;
 canContinue=battle?false:!!continuable;
 if(transient||battle){
  nextId=null;
  el.scrollTop=Math.max(0,el.scrollHeight-el.clientHeight);
  oldTop=el.scrollTop;
  const win=el.closest?.('.message-window');
  if(win){win.classList.toggle('has-more-text',false);win.classList.toggle('can-continue',false);}
  return;
 }
 el.scrollTop=Math.min(oldTop,Math.max(0,el.scrollHeight-el.clientHeight));
 oldTop=el.scrollTop;
 syncOverflowCue(el);
 globalThis.requestAnimationFrame?.(()=>syncOverflowCue(el));
 el.addEventListener('scroll',()=>{oldTop=el.scrollTop;syncOverflowCue(el);},{passive:true});
}
