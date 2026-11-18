// Decide which set and which foreground object an event uses. Both the moving
// approach shot and the stopped shot call this with the same encounter data.
const exteriorAliases={books:'stall',bridgegift:'bridge'};
const vehicleModels={ambulance:['ambulance'],car:['sedan'],rescue:['pickup','ambulance'],convoy:['van','pickup'],cars:['compact','sedan'],bus:['bus']};
const roadside={sign:'sign',container:'container',traveler:'shelter',storm:'pole',fog:'rail',sand:'sign',dust:'rail',smoke:'barrier',acid:'lamp'};
const propAliases={
  gift:'crate',cache:'crate',fuel:'barrel',leak:'barrel',bag:'luggage',engine:'generator',explosion:'fire',
  gunfight:'crate',soldier:'crate',bandit:'crate',sniper:'crate',infected:'furniture',beast:'rocks',
  swarm:'eggs',nest:'eggs',spores:'eggs',gascloud:'barrel',robot:'terminal',
  mural:'poster',alarm:'electric',bomb:'toolbox',trap:'electric'
};
const fieldSizes={
  tanker:[176,83],chase:[142,72],truck:[160,81],wreck:[142,62],motorcycle:[103,72],bookvan:[146,87],
  tree:[158,83],tires:[78,61],pylon:[72,102],medicalbox:[46,42],toolbox:[60,42],crate:[78,60],
  safe:[69,65],luggage:[62,50],radio:[65,58],fuel:[65,61],barrel:[65,61],generator:[66,55],
  locker:[58,90],shelf:[89,94],terminal:[68,79],paper:[43,34],book:[46,34],bed:[110,67],
  door:[68,103],poster:[82,63],coat:[50,72],map:[77,59],counter:[105,68],furniture:[88,64],lamp:[34,58],
  rocks:[115,64],pit:[137,64],ice:[132,46],mud:[124,50],flood:[146,61],spikes:[119,44],glass:[84,37],
  electric:[99,58],vines:[123,59],eggs:[101,65],fire:[93,65],turret:[94,68]
};
const serviceRooms={gas:'garage',garage:'garage',clinic:'clinic',pharmacy:'clinic',motel:'hotel',market:'shop',stall:'shop',shop:'shop',cars:'garage',warehouse:'warehouse',tunnel:'corridor'};
const looted={shelf:'bareShelf',medicalbox:'emptyCabinet',safe:'openSafe',luggage:'openCase',barrel:'drainedTank',generator:'deadGenerator',terminal:'deadTerminal',glass:'brokenDisplay',door:'blockedDoor'};
const sceneKinds={bath:'bath',office:'office',corridor:'corridor',stove:'stove',stairs:'stairs',partition:'partition',
  dark:'partition',nest:'nest',eggs:'nest',spores:'nest',garage:'garage',clinic:'clinic',pharmacy:'clinic',market:'shop',shop:'shop',stall:'shop',tunnel:'corridor'};
export function interiorSet(event,frameScene){
  if(event?.interior&&event.empty&&event.kind==='flood')return 'bath';
  return (event?.interior?sceneKinds[event.kind]:serviceRooms[event?.kind])||frameScene||'warehouse';
}
export function eventVolume(a,inside,assets){
  const kind=a.kind;
  if(!inside){
    const key=exteriorAliases[kind]||kind;
    if(assets.facilities[key])return {type:'facade',key,extra:kind==='bridgegift'?'crate':null};
    if(vehicleModels[kind])return {type:'fleet',models:vehicleModels[kind]};
    if(roadside[kind])return {type:'roadside',key:roadside[kind]};
  }else{
    if(a.empty&&kind==='flood')return {type:'set'};
    if(a.empty&&looted[kind])return {type:'prop',key:looted[kind]};
    if(['bath','office','corridor','stove','stairs','partition','dark','empty','garage','shop','tunnel'].includes(kind))return {type:'set'};
    if(kind==='cars')return {type:'fleet',models:['compact']};
    if(kind==='camp')return {type:'prop',key:'bed'};
    if(kind==='stall')return {type:'prop',key:'counter'};
    if(kind==='clinic'||kind==='pharmacy')return {type:'prop',key:'medicalbox'};
    if(kind==='sign')return {type:'prop',key:'poster'};
  }
  const key=propAliases[kind]||kind;
  return assets.props?.[key]?{type:'prop',key}:{type:'legacy',image:a.image};
}
export function propSize(key){return fieldSizes[key]||[84,64];}
