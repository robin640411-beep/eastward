import {npcFavorInfo} from './npc-runtime.js';
// All event choices share the message window, including actor selection and exits.
export function encounterCommands(g,display){const s=g.s,c=s?.current,commands=[];if(s?.mode!=='event'||!c)return commands;
 const add=(label,action,args='',style='',disabled=false)=>commands.push({label,action,args,style,disabled});
 if(c.dialogue){
  const p=c.npc,favor=npcFavorInfo(p);
  add('交談 · 5 分鐘','talk');
  if(!c.storyShared)add('聊聊出身與願望 · 5 分鐘','npcStory');
  if(!c.intelShared)add('打聽東方與路況 · 5 分鐘','npcIntel');
  add('交易與服務','panel','shop','',!c.service);
  if(!c.giftedNpc)add('分享 1 廢料結交','npcGift','','',s.resources.scrap<1);
  if(favor&&!c.favorDone)add(favor.label,'npcFavor','','special-command');
  add(g.canRecruit()?'邀請同行':s.party.length>=4?'隊伍已滿 · 4 人':'車內沒有空位','recruit','','',!g.canRecruit());
  add('攻擊','attackNpc','','danger');
 }
 else for(const o of g.options()){const cost=Object.entries(g.optionCosts(g.preparedOption(o))).map(([k,v])=>' · '+v+' '+({fuel:'汽油',scrap:'廢料',medicine:'藥品',stamina:'體力'}[k]||k)).join('');add(o.label+cost,'choose',o.id,'',!g.canChoose(o));}
 if(c.carePending)return commands;
 if(!c.building&&c.event.options?.length&&c.event.reward_alternative){
  const specialist=g.rewardSpecialist();
  if(specialist){
   const label=c.event.reward_alternative==='locksmith'?'開鎖取出裝備':'繞過門禁取出裝備';
   add(specialist.name+' · '+label+'（5 分鐘）','choose','reward_specialist');
   return commands;
  }
 }
 if(!c.rewardReceipt||c.dialogue)for(const a of g.traitActions())add(a.label,'trait',a.id,'special-command');
 if(c.inside&&!c.explored&&!c.event.options?.length)add('往建築深處看看','explore');
 if(s.offerVehicle)add('查看發現的車輛','panel','offer','primary');
 if(!c.finalGate&&!c.building&&(!c.event.options?.length||c.dialogue)&&(c.dialogue||c.service||s.offerVehicle||c.inside&&!c.explored))add(s.offerVehicle?'保留原車並離開':c.dialogue?'告別並回到車上':'回到車上','finish','','primary');
 if((!c.rewardReceipt||c.dialogue)&&s.party.filter(p=>p.hp>0&&!p.asleep).length>1&&commands.length)add('由 '+g.actor().name+' 行動 · 換人','cycleActor','','quiet');
 return commands;
}
