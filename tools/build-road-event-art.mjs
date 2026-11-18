import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';

const root=process.env.EASTWARD_ART_NODE_MODULES;
const require=createRequire(root?resolve(root,'../package.json'):import.meta.url);
const sharp=require('sharp');
const input='art-direction/volume/',out='dist/assets/volume/';
mkdirSync(out,{recursive:true});
const art={interiors:{},props:{}};
// Boundaries measured in the review thumbnails. The tree branches and radio
// antenna extend past the nominal grid, so each row has independent gutters.
const sheets=[
  {name:'annex',width:640,height:426,
    rows:[[0,141,[0,319,640]], [142,283,[0,319,640]], [285,426,[0,319,640]]],
    keys:['bath','office','corridor','stove','stairs','partition']},
  {name:'specials',width:640,height:426,
    rows:[[0,138,[0,218,425,640]], [140,276,[0,218,426,640]], [278,426,[0,200,435,640]]],
    keys:['tanker','motorcycle','bookvan','truck','chase','wreck','pylon','tree','tires']},
  {name:'supplies',width:632,height:578,
    rows:[[0,170,[0,209,433,632]], [171,383,[0,217,435,632]], [386,578,[0,210,437,632]]],
    keys:['crate','luggage','medicalbox','toolbox','locker','safe','barrel','generator','radio']},
  {name:'hazards',width:660,height:495,
    rows:[[44,176,[0,163,331,496,660]],[184,330,[0,163,331,496,660]],[343,485,[0,163,331,496,660]]],
    keys:['rocks','pit','ice','mud','flood','spikes','glass','electric','vines','eggs','fire','turret']},
  {name:'furnishings',width:660,height:495,
    rows:[[0,171,[0,167,329,497,660]],[171,325,[0,167,329,497,660]],[327,495,[0,167,329,497,660]]],
    keys:['shelf','bed','terminal','map','book','paper','poster','coat','door','counter','furniture','lamp']},
  {name:'drained',width:540,height:540,
    rows:[[0,168,[0,177,353,540]],[168,344,[0,167,357,540]],[348,540,[0,163,358,540]]],
    keys:['bareShelf','emptyCabinet','openSafe','openCase','drainedTank','deadGenerator','deadTerminal','brokenDisplay','blockedDoor']}
];
for(const sheet of sheets){
  const selected=process.argv.slice(2);
  if(selected.length&&!selected.includes(sheet.name)){
    const old=JSON.parse(readFileSync(out+'event-art.json','utf8')),category=sheet.name==='annex'?'interiors':'props';
    for(const key of sheet.keys)art[category][key]=old[category][key];
    continue;
  }
  const source=input+sheet.name+'.png',{width,height}=await sharp(source).metadata();
  const sx=n=>Math.round(n*width/sheet.width),sy=n=>Math.round(n*height/sheet.height);
  let index=0;
  for(const [y0,y1,xs] of sheet.rows)for(let i=1;i<xs.length;i++){
    const key=sheet.keys[index++],room=sheet.name==='annex';
    let tile=sharp(source).extract({left:sx(xs[i-1]),top:sy(y0),width:sx(xs[i])-sx(xs[i-1]),height:sy(y1)-sy(y0)});
    if(!room){
      const {data,info}=await tile.ensureAlpha().raw().toBuffer({resolveWithObject:true});
      // Generated transparent gutters may contain barely visible matte pixels.
      // Zero their alpha before trimming to avoid rectangular patches on dark roads.
      for(let a=3;a<data.length;a+=4){
        const alpha=data[a],r=data[a-3],g=data[a-2],b=data[a-1];
        const neutral=Math.min(r,g,b)>218&&Math.max(r,g,b)-Math.min(r,g,b)<16;
        if(sheet.name==='drained'||sheet.name==='hazards'){
          data[a]=alpha<209||neutral&&alpha<239?0:Math.min(255,(alpha-208)*7);
        }else if(alpha<18)data[a]=0;
      }
      const extracted=await sharp(data,{raw:{width:info.width,height:info.height,channels:4}}).png().toBuffer();
      tile=sharp(extracted).trim({threshold:12});
    }
    const path='volume/'+key+'.webp';
    const size=await tile.resize({width:room?768:320,height:room?440:320,fit:'inside',withoutEnlargement:true})
      .webp({quality:room?84:90,alphaQuality:100,effort:6}).toFile('dist/assets/'+path);
    art[room?'interiors':'props'][key]={image:path,size:[size.width,size.height],rect:[0,0,size.width,size.height]};
  }
}
writeFileSync(out+'event-art.json',JSON.stringify(art,null,2)+'\n');
