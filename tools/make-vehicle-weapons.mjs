import {writeFileSync,mkdirSync,readFileSync} from 'node:fs';
const out=new URL('../dist/assets/vehicle-weapons/',import.meta.url);mkdirSync(out,{recursive:true});
const ink='#19232b',dark='#37464b',steel='#73858a',light='#b6b6a1',warm='#c1a478',rust='#795945',cool='#4e656c';
let p=[];const r=(x,y,w,h,c)=>p.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`),poly=(s,c)=>p.push(`<polygon points="${s}" fill="${c}"/>`);
const bolt=(x,y)=>{r(x,y,2,2,ink);r(x,y,1,1,light);};
function base(){poly('9,34 14,28 24,28 29,34 26,38 10,38',ink);poly('12,33 15,30 23,30 26,33 24,35 12,35',steel);r(13,33,11,1,light);r(17,24,5,9,dark);r(18,24,2,8,steel);bolt(14,33);bolt(23,33);}
for(const id of ['bumper','ram','nail','coil','harpoon','gun','spore']){p=[];
 if(['bumper','ram'].includes(id)){
  r(2,20,18,5,ink);r(3,21,15,2,steel);r(9,15,4,17,dark);
  if(id==='bumper'){poly('12,13 20,10 27,14 27,30 20,34 12,31',ink);poly('14,14 20,12 24,15 24,28 19,31 14,29',steel);poly('14,14 20,12 24,15 20,17 14,16',light);r(17,18,3,10,dark);r(22,17,2,10,cool);bolt(15,19);bolt(21,27);}
  else{poly('10,15 29,11 46,20 42,30 18,34 10,29',ink);poly('13,16 29,13 42,20 39,27 19,31 13,27',rust);poly('13,16 29,13 42,20 38,22 26,17 13,19',warm);poly('19,22 38,22 39,27 19,31',dark);for(let x=19;x<38;x+=8)poly(`${x},17 ${x+5},18 ${x+7},27 ${x+3},28`,steel);poly('36,18 55,20 40,24',light);bolt(14,20);bolt(20,28);}
 }else{base();
  if(id==='nail'){r(10,14,24,12,ink);r(12,16,20,8,'#7c7864');r(13,16,17,2,warm);r(28,18,26,5,ink);r(30,19,24,2,steel);r(51,17,5,7,ink);r(52,18,3,2,light);poly('12,13 12,5 24,3 30,7 27,15',ink);poly('14,12 14,6 23,5 27,8 25,13',steel);r(16,6,7,2,light);r(15,19,7,5,dark);for(let x=16;x<23;x+=3)r(x,8,1,4,dark);bolt(25,20);}
  if(id==='coil'){poly('12,23 12,13 25,10 36,14 36,24',ink);poly('14,21 14,15 25,12 34,16 34,21',cool);r(18,13,4,11,'#927d68');r(25,13,4,11,'#927d68');for(const x of [18,25])for(let y=14;y<24;y+=3){r(x,y,5,1,warm);r(x+1,y,2,1,light);}r(30,12,18,3,ink);r(30,23,18,3,ink);r(43,8,7,7,dark);r(43,23,7,7,dark);r(45,9,3,5,'#9eafbd');r(45,24,3,4,'#9eafbd');r(49,14,2,10,'#a0b1c1');r(47,17,3,2,'#d6d5c3');r(50,20,3,1,'#c4c4cb');bolt(14,18);}
  if(id==='harpoon'){poly('10,16 21,13 32,17 32,25 17,27 10,23',ink);poly('12,17 21,15 29,18 29,23 17,25 12,22',rust);r(16,17,8,7,steel);r(18,18,4,5,dark);r(8,20,10,1,warm);r(25,17,29,4,ink);r(26,18,28,1,light);poly('50,15 62,18 50,23 53,19',steel);poly('45,8 48,9 40,18 47,28 44,30 35,19',ink);poly('44,10 45,11 38,18 45,28 43,27 36,19',light);r(28,12,1,16,'#927d5b');bolt(12,20);}
  if(id==='gun'){poly('10,14 28,14 33,18 29,26 11,24',ink);r(12,16,16,7,cool);r(13,16,13,1,light);r(28,17,29,5,ink);r(29,18,26,2,steel);r(53,16,7,7,ink);r(54,17,4,2,light);for(let x=34;x<52;x+=5)r(x,18,2,2,ink);r(11,10,13,5,ink);r(12,11,10,3,rust);r(13,11,8,1,warm);r(11,22,5,8,dark);for(let y=24;y<31;y+=3)r(11,y,4,1,warm);bolt(24,18);}
  if(id==='spore'){poly('9,24 7,13 10,6 16,3 23,6 28,14 26,25 19,29',ink);poly('11,23 10,13 12,8 17,5 21,8 25,15 23,24 18,26','#6b7966');poly('12,15 13,8 17,6 20,9 17,14','#a2ac87');r(12,20,12,3,'#415451');r(14,6,3,21,'#77856b');r(23,16,7,6,rust);poly('28,17 44,15 51,18 48,23 30,22',ink);poly('29,18 43,17 48,19 46,21 30,20',steel);poly('45,15 55,16 59,20 54,25 46,24',dark);r(53,18,4,4,'#a7b489');r(50,18,2,5,'#c1c59e');bolt(22,23);}
 }
 writeFileSync(new URL(id+'.svg',out),`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="40" viewBox="0 0 64 40" shape-rendering="crispEdges">${p.join('')}</svg>`);
}
const ids=['bumper','ram','nail','coil','harpoon','gun','spore'];
const frames=ids.map((id,i)=>{const raw=readFileSync(new URL(id+'.svg',out),'utf8'),body=raw.slice(raw.indexOf('>')+1,raw.lastIndexOf('</svg>'));return `<g transform="translate(${i*64} 0)">${body}</g>`;});
writeFileSync(new URL('atlas.svg',out),`<svg xmlns="http://www.w3.org/2000/svg" width="448" height="40" viewBox="0 0 448 40" shape-rendering="crispEdges">${frames.join('')}</svg>`);
writeFileSync(new URL('catalog.json',out),JSON.stringify({image:'vehicle-weapons/atlas.svg',size:[448,40],frames:Object.fromEntries(ids.map((id,i)=>[id,{rect:[i*64,0,64,40],image:'vehicle-weapons/'+id+'.svg',mount:['bumper','ram'].includes(id)?'front':'roof'}]))},null,2)+'\n');
console.log('Created seven distinct mounted weapon sprites and a shared atlas.');
