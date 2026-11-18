// Production architecture assets: each encounter downloads only its own sprite.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {dirname,resolve,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {homedir} from 'node:os';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const source=resolve(root,'art-direction/volume/buildings');
const output=resolve(root,'dist/assets/volume/architecture');
const require=createRequire(import.meta.url);
let sharp;
try{sharp=require('sharp');}catch{
 const bundled=process.env.EASTWARD_SHARP||resolve(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
 sharp=require(bundled);
}
await mkdir(output,{recursive:true});
const layout=JSON.parse(await readFile(resolve(source,'atlas-layout.json'),'utf8'));
const manifest={facilities:{},interiors:{}};
const report=[];
for(const [category,items] of Object.entries(layout)){
 for(const [kind,entry] of Object.entries(items)){
  const [left,top,width,height]=entry.rect;
  const sourceFile=resolve(source,basename(entry.image));
  const name=`${category==='facilities'?'facility':'interior'}-${kind}.webp`;
  const file=resolve(output,name);
  const maxWidth=category==='facilities'?440:720;
  const existing=process.argv.includes('--reuse')?await sharp(file).metadata().catch(()=>null):null;
  const info=existing?{width:existing.width,height:existing.height}:await sharp(sourceFile).extract({left,top,width,height})
    .resize({width:Math.min(width,maxWidth),withoutEnlargement:true,kernel:'lanczos3'})
    .webp({quality:94,alphaQuality:100,effort:6,smartSubsample:true})
    .toFile(file);
  const meta=await sharp(file).metadata();
  if(info.width>width||info.height>height)throw Error('Unexpected upscaling: '+kind);
  let transparent=0,opaque=0;
  if(category==='facilities'){
   if(!meta.hasAlpha)throw Error('Alpha missing: '+kind);
   const {data,info:raw}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   for(let i=3;i<data.length;i+=raw.channels){if(data[i]===0)transparent++;if(data[i]>=250)opaque++;}
   if(!transparent||!opaque)throw Error('Alpha coverage invalid: '+kind);
  }
  manifest[category][kind]={image:'volume/architecture/'+name,rect:[0,0,info.width,info.height],size:[info.width,info.height]};
  report.push({kind,category,width:info.width,height:info.height,bytes:(await stat(file)).size,hasAlpha:!!meta.hasAlpha,transparent,opaque});
 }
}
await writeFile(resolve(root,'dist/assets/volume/buildings.json'),JSON.stringify(manifest,null,2)+'\n');
await writeFile(resolve(source,'production-report.json'),JSON.stringify({format:'WebP',quality:94,alphaQuality:100,filter:'lanczos3',noUpscaling:true,files:report,totalBytes:report.reduce((n,r)=>n+r.bytes,0)},null,2)+'\n');
console.log(JSON.stringify({files:report.length,totalBytes:report.reduce((n,r)=>n+r.bytes,0),largestBytes:Math.max(...report.map(r=>r.bytes)),facilities:report.filter(r=>r.category==='facilities').length,interiors:report.filter(r=>r.category==='interiors').length,alphaVerified:true}));
