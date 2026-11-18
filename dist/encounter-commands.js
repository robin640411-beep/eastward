// All event choices share the message window, including actor selection and exits.
export function encounterCommands(g,display){const s=g.s,c=s?.current,commands=[];if(s?.mode!=='event'||!c)return commands;
 const add=(label,action,args='',style='',disabled=false)=>commands.push({label,action,args,style,disabled});
 if(c.dialogue){add('交談 · 5 分鐘','talk');add('交易與服務','panel','shop','',!c.service);add(g.canRecruit()?'邀請同行':s.party.length>=4?'隊伍已滿 · 4 人':'車內沒有空位','recruit','','',!g.canRecruit());add('攻擊','attackNpc','','danger');}
 else for(const o of g.options()){const cost=Object.entries(g.optionCosts(g.preparedOption(o))).map(([k,v])=>' · '+v+' '+({fuel:'汽油',scrap:'廢料',medicine:'藥品',stamina:'體力'}[k]||k)).join('');add(o.label+cost,'choose',o.id,'',!g.canChoose(o));}
 for(const a of g.traitActions())add(a.label,'trait',a.id,'special-command');
 if(c.inside&&!c.explored&&!c.event.options?.length)add('往建築深處看看','explore');
 if(s.offerVehicle)add('查看發現的車輛','panel','offer','primary');
 if(!c.finalGate&&!c.building&&(!c.event.options?.length||c.dialogue)&&(c.dialogue||c.service||s.offerVehicle||c.inside&&!c.explored))add(s.offerVehicle?'保留原車並離開':c.dialogue?'告別並回到車上':'回到車上','finish','','primary');
 if(s.party.filter(p=>p.hp>0&&!p.asleep).length>1&&commands.length)add('由 '+g.actor().name+' 行動 · 換人','cycleActor','','quiet');
 return commands;
}
