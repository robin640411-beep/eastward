// Static authored voices selected from the actual speaker's identity.
// Wishes live on the person, so save/reload and later reunions preserve them.
export function companionExchange(game,initiator,partner,display){
 const catalog=game.d.oracles.companion_dialogue;
 const race=catalog?.races[partner.race],profession=catalog?.professions[partner.profession];
 if(!race||!profession){const pair=game.oracle('driving_companions').value;return {lines:[line(initiator,pair[0],display),line(partner,pair[1],display)],focus:'shared'};}
 const focus=game.oracle('companion_focus').value;
 partner.chatterLast??={};
 function select(entries,key){let index=game.roll(entries.length)-1;if(entries.length>1&&partner.chatterLast[key]===index)index=(index+1)%entries.length;partner.chatterLast[key]=index;return entries[index];}
 let prompt,response;
 if(focus==='paradise'){
  partner.aspirations??={version:1,destination:'樂園',raceWish:game.pick(race.wishes),professionWish:game.pick(profession.wishes)};
  partner.aspirations.shared=true;
  prompt=select(catalog.paradise_prompts,'paradise');
  response=partner.aspirations.raceWish+partner.aspirations.professionWish;
 }else [prompt,response]=select((focus==='race'?race:profession).exchanges,focus);
 return {focus,subject:partner.id,lines:[line(initiator,prompt,display),line(partner,response,display)]};
}
function line(person,text,display){return {speaker:display(person),personId:person.id,text};}
