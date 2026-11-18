import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {STARTER_VEHICLES,VEHICLE_WEAPONS,VEHICLE_MODS} from '../dist/vehicle-catalog.js';
const dir=new URL('../dist/assets/',import.meta.url),manifest=JSON.parse(readFileSync(new URL('manifest.json',dir)));
const palettes={compact:['#c49a52','#efd38b','#8e693b','#514844'],sedan:['#5f9395','#a6c7bd','#3d6874','#374b53'],van:['#b1b49a','#e0ddba','#7c8b78','#465e5d'],pickup:['#ad6550','#df9a70','#784b42','#494344'],armored:['#45445d','#77788b','#2c2d43','#1c2131'],rover:['#68637b','#ada1bb','#403e5d','#292b45'],ambulance:['#bcc1b4','#eeead2','#879b99','#51686c']};
const mix=(c,t)=>'#'+[1,3,5].map(i=>Math.round(t>0?parseInt(c.slice(i,i+2),16)*(1-t)+225*t:parseInt(c.slice(i,i+2),16)*(1+t)).toString(16).padStart(2,'0')).join('');
mkdirSync(new URL('vehicles/starters/',dir),{recursive:true});manifest.starters={};
for(const starter of STARTER_VEHICLES){const base=manifest.vehicles[starter.model],variants={};
 for(let seats=starter.seats;seats<=4;seats++){
  let model=starter.model,source=base.variants?.[seats]||base;
  if(seats>source.windows.length){model='sedan';source=manifest.vehicles.sedan.variants[seats];}
  const windows=source.windows.slice(-seats).reverse(),closed=source.windows.filter(w=>!windows.includes(w)),colors=[starter.color,mix(starter.color,.45),mix(starter.color,-.28),mix(starter.color,-.5)];
  let svg=readFileSync(new URL(source.image,dir),'utf8');palettes[model].forEach((c,i)=>svg=svg.replaceAll(c,'PALETTE'+i));colors.forEach((c,i)=>svg=svg.replaceAll('PALETTE'+i,c));
  const plates=closed.map(w=>`<rect x="${w.x}" y="${w.y}" width="${w.width}" height="${w.height}" fill="${colors[2]}"/><path d="M${w.x+2} ${w.y+2}h${w.width-4}m-${w.width-4} ${w.height-4}h${w.width-4}" stroke="${colors[1]}" stroke-width="1"/>`).join('');
  const badge=`<rect x="64" y="39" width="12" height="8" fill="${colors[3]}"/><path d="M66 41h8m-8 2h${starter.roll}" stroke="${colors[1]}" stroke-width="1"/>`;
  svg=svg.replace('</svg>',plates+badge+'</svg>');const image=`vehicles/starters/${starter.id}-${seats}.svg`;writeFileSync(new URL(image,dir),svg);variants[seats]={image,windows};
 }
 manifest.starters[starter.id]={name:starter.name,seats:starter.seats,...variants[starter.seats],variants};
}
manifest.mods.tank='mods/tank.svg';writeFileSync(new URL('mods/tank.svg',dir),'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" shape-rendering="crispEdges"><path d="M5 5h14v16H5z" fill="#172733"/><path d="M6 6h12v14H6z" fill="#83918a"/><path d="M8 2h8v5H8z" fill="#d1c69d"/><path d="M8 9h2v8H8zm6 0h2v8h-2z" fill="#4f666c"/><path d="M7 7h10v2H7z" fill="#c3cbbb"/></svg>');
writeFileSync(new URL('manifest.json',dir),JSON.stringify(manifest,null,2)+'\n');
writeFileSync(new URL('../spec/starter-vehicles.json',import.meta.url),JSON.stringify({die:'D10',rows:STARTER_VEHICLES,weapons:VEHICLE_WEAPONS,modifications:VEHICLE_MODS,rules:{shared_limit:true,initial_equipment_uses_limit:false,one_installation_uses:1,garage_only:true,seats_max:4,armor_per_upgrade:2,weapon_bonus_per_upgrade:4,tank_capacity_and_fuel_per_upgrade:12,overflow_fuel:'Unlimited communal backpack; automatically transferred at stops and before departure.',replacement:'Old modifications stay on old vehicle. All fuel remains with the party.'}},null,2)+'\n');
