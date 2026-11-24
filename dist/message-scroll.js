// Only animate the small message viewport; never scroll the game page.
let ticker=null,lastId=0,oldTop=0,holdUntil=0,mounted=null,manualHold=false;
export function stopMessageScroll(){clearInterval(ticker);ticker=null;if(mounted)oldTop=mounted.scrollTop;mounted=null;}
export function resetMessageScroll(){stopMessageScroll();lastId=0;oldTop=0;holdUntil=0;}
export function isMessageReadingPaused(){return manualHold||performance.now()<holdUntil;}
export function mountMessageScroll(el,{prompt=false,transient=false,focusTitle=null,paused=false}={}){if(!el)return;stopMessageScroll();mounted=el;manualHold=!!paused;if(transient){el.scrollTop=el.scrollHeight;return;}const rows=[...el.querySelectorAll('[data-message-id]')],latest=Number(rows.at(-1)?.dataset.messageId)||0;
 const newRows=rows.filter(row=>Number(row.dataset.messageId)>lastId);
 const firstNew=(focusTitle&&newRows.find(row=>row.querySelector('strong')?.textContent===focusTitle))||newRows[0];if(firstNew){el.scrollTop+=firstNew.getBoundingClientRect().top-el.getBoundingClientRect().top;holdUntil=performance.now()+2800;}else el.scrollTop=oldTop;
 if(prompt)el.scrollTop=el.scrollHeight;lastId=latest;oldTop=el.scrollTop;
 const pause=()=>{holdUntil=performance.now()+10000;};
 el.addEventListener('pointerdown',pause,{passive:true});
 el.addEventListener('touchstart',pause,{passive:true});
 el.addEventListener('touchmove',pause,{passive:true});
 el.addEventListener('wheel',pause,{passive:true});
 el.addEventListener('keydown',pause);
 ticker=setInterval(()=>{if(!el.isConnected){stopMessageScroll();return;}oldTop=el.scrollTop;if(manualHold||document.hidden||performance.now()<holdUntil||el.scrollTop>=el.scrollHeight-el.clientHeight-1)return;el.scrollTop=Math.min(el.scrollHeight-el.clientHeight,el.scrollTop+1.4);oldTop=el.scrollTop;},120);
}
