import {npcFavorInfo} from './npc-runtime.js';
import {rolledNpcVignette} from './storybook.js';
// Storybook-first choices: keep Page 1 concise (<= 4 choices) by rolling 1 situational NPC vignette.
export function encounterCommands(g,display){const s=g.s,c=s?.current,commands=[];if(s?.mode!=='event'||!c)return commands;
 const add=(label,action,args='',style='',disabled=false)=>commands.push({label,action,args,style,disabled});
 if(c.dialogue){
  const p=c.npc,favor=npcFavorInfo(p),vignette=rolledNpcVignette(s,p,favor);
  add('上前攀談 · 5 分鐘','talk');
  if(vignette)add(vignette.label,vignette.action,'',vignette.style||'',!!vignette.disabled);
  add('交換隨身物資','panel','shop','',!c.service);
  if(!c.finalGate&&!c.building)add(s.offerVehicle?'保留原車並離開':'道別並回到車上','finish','','primary');
  // Page 2+: secondary actions kept tidy out of the primary storybook view
  add(g.canRecruit()?'邀請上車同行':s.party.length>=4?'隊伍已滿 · 4 人':'車內沒有空位','recruit','','',!g.canRecruit());
  for(const a of g.traitActions())add(a.label,'trait',a.id,'special-command');
  if(c.inside&&!c.explored&&!c.event.options?.length)add('往建築深處看看','explore');
  if(s.offerVehicle)add('查看發現的車輛','panel','offer','primary');
  if(s.party.filter(q=>q.hp>0&&!q.asleep).length>1)add('由 '+g.actor().name+' 交涉 · 換人','cycleActor','','quiet');
  add('拔武動手','attackNpc','','danger');
  return commands;
 }
 for(const o of g.options()){const cost=Object.entries(g.optionCosts(g.preparedOption(o))).map(([k,v])=>' · '+v+' '+({fuel:'汽油',scrap:'廢料',medicine:'藥品',stamina:'體力'}[k]||k)).join('');add(o.label+cost,'choose',o.id,'',!g.canChoose(o));}
 if(c.carePending)return commands;
 if(!c.building&&c.event.options?.length&&c.event.reward_alternative){
  const specialist=g.rewardSpecialist();
  if(specialist){
   const label=c.event.reward_alternative==='locksmith'?'開鎖取出裝備':'繞過門禁取出裝備';
   add(specialist.name+' · '+label+'（5 分鐘）','choose','reward_specialist');
   return commands;
  }
 }
 if(!c.rewardReceipt)for(const a of g.traitActions())add(a.label,'trait',a.id,'special-command');
 if(c.inside&&!c.explored&&!c.event.options?.length)add('往建築深處看看','explore');
 if(s.offerVehicle)add('查看發現的車輛','panel','offer','primary');
 if(!c.finalGate&&!c.building&&!c.event.options?.length&&(c.service||s.offerVehicle||c.inside&&!c.explored))add(s.offerVehicle?'保留原車並離開':'回到車上','finish','','primary');
 if(!c.rewardReceipt&&s.party.filter(p=>p.hp>0&&!p.asleep).length>1&&commands.length)add('由 '+g.actor().name+' 行動 · 換人','cycleActor','','quiet');
 return commands;
}
