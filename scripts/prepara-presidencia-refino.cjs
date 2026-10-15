// Packaging only: artwork is generated separately; this never synthesizes detail.
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {loadDependency}=require('./presidencia-runtime.cjs');const sharp=loadDependency('sharp');
const root=path.resolve(__dirname,'..');
async function register(original,candidate){
 const frames=[];
 for(const file of [original,candidate]){
  const {data,info}=await sharp(file).greyscale().raw().toBuffer({resolveWithObject:true});
  assert.equal(info.width,1536);assert.equal(info.height,1024);frames.push(data);
 }
 const marks=[];
 for(const [x,y] of [[588,311],[911,312],[933,425],[575,425],[750,578],[420,350],[1080,350],[750,250]]){
  let best={score:-1};
  for(let dy=-6;dy<=6;dy++)for(let dx=-6;dx<=6;dx++){
   let n=0,sx=0,sy=0,sxx=0,syy=0,sxy=0;
   for(let yy=-15;yy<=15;yy++)for(let xx=-15;xx<=15;xx++){
    const u=frames[0][(y+yy)*1536+x+xx],v=frames[1][(y+yy+dy)*1536+x+xx+dx];
    n++;sx+=u;sy+=v;sxx+=u*u;syy+=v*v;sxy+=u*v;
   }
   const score=(n*sxy-sx*sy)/Math.sqrt((n*sxx-sx*sx)*(n*syy-sy*sy));
   if(score>best.score)best={dx,dy,score};
  }
  assert.ok(best.score>.7&&Math.abs(best.dx)<=1&&Math.abs(best.dy)<=1,`Registration moved at ${x},${y}: ${JSON.stringify(best)}`);
  marks.push({x,y,...best});
 }
 return marks;
}
async function bounded(input,limit){
 for(const quality of [92,88,84,80,76,72,68,64,60,56,52,48,44,40,36,32]){
  const buffer=await input.clone().webp({quality,effort:6}).toBuffer();
  if(buffer.length<=limit)return buffer;
 }
 throw Error('Asset exceeds the artwork byte budget');
}
(async()=>{
 const [stage,original,candidate]=process.argv.slice(2);
 assert.ok(['lower','upper'].includes(stage),'Usage: node scripts/prepara-presidencia-refino.cjs lower|upper ORIGINAL CANDIDATE');
 const marks=await register(original,candidate),prefix=`estadio-mapa/projeto/${stage}-refino`;
 const files=[],asset={src:prefix+'.webp',width:1536,height:1024,tiles:[]};
 files.push([asset.src,await bounded(sharp(candidate).resize(600,400),60*1024)]);
 for(let y=0;y<1024;y+=256)for(let x=0;x<1536;x+=256){
  const src=`${prefix}-${x}-${y}.webp`;
  files.push([src,await bounded(sharp(candidate).extract({left:x,top:y,width:256,height:256}),25*1024)]);
  asset.tiles.push({src,x:x/1536*100,y:y/1024*100,w:256/1536*100,h:25});
 }
 // Validate and encode everything before modifying the registry. Keep old assets.
 for(const [file,buffer] of files)await fs.writeFile(path.join(root,'public',file),buffer);
 const registryPath=path.join(root,'src/escalacao/presidencia-estadio-tiles.ts');
 const registry=JSON.parse((await fs.readFile(registryPath,'utf8')).replace(/^export default /,''));
 registry[stage]=asset;await fs.writeFile(registryPath,'export default '+JSON.stringify(registry)+'\n');
 console.log(JSON.stringify({stage,marks,files:files.length,bytes:files.reduce((n,[,b])=>n+b.length,0),maxTileBytes:Math.max(...files.slice(1).map(([,b])=>b.length))},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
