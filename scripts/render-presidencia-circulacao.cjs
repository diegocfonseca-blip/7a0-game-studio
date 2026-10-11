// Render de revisão: mesmos caminhos, corpos e profundidade usados pelo mapa.
const fs=require('node:fs'),path=require('node:path'),{stripTypeScriptTypes}=require('node:module');
const sharp=require('./presidencia-runtime.cjs').loadDependency('sharp');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-results/estadio-projeto');
const model=stripTypeScriptTypes(fs.readFileSync(path.join(root,'src/escalacao/presidencia-estadio-mapa-model.ts'),'utf8')).replace(/^import .*$/gm,'').replace(/export /g,'');
const frame=new Function(model+';return quadroAtor')();
const stages=JSON.parse(fs.readFileSync(path.join(root,'test-results/estadio-mapa-model.json'))),stage=stages.at(-2);
const tiles=JSON.parse(fs.readFileSync(path.join(root,'src/escalacao/presidencia-estadio-tiles.ts'),'utf8').replace(/^export default /,''));
(async()=>{
 const asset=tiles.complete,W=asset.width,H=asset.height,scale=W/1536;
 const background=await sharp({create:{width:W,height:H,channels:4,background:'#000'}}).composite(asset.tiles.map(t=>({input:path.join(root,'public',t.src),left:Math.round(t.x*W/100),top:Math.round(t.y*H/100)}))).png().toBuffer();
 const actors=stage.actors.map(a=>({a,p:frame(a,80)})).sort((a,b)=>a.p.depth-b.p.depth),layers=[];
 for(const {a,p} of actors){
  const src=path.join(root,'public',p.back&&a.srcBack?a.srcBack:a.src),m=await sharp(src).metadata();let input=sharp(src);
  if(a.frames)input=input.extract({left:p.frame*m.width/a.frames,top:0,width:m.width/a.frames,height:m.height});
  input=input.resize(Math.round(a.width*p.scale*scale),Math.round(a.height*p.scale*scale));
  if(a.kind==='car')input=input.rotate(p.angle,{background:'#00000000'});else if(p.flip)input=input.flop();
  const {data,info}=await input.png().toBuffer({resolveWithObject:true});const left=Math.round(p.x*scale-info.width/2),top=Math.round(p.y*scale-info.height*(a.kind==='car'?.5:1));
  if(left>=0&&top>=0&&left+info.width<=W&&top+info.height<=H)layers.push({input:data,left,top});
 }
 for(const area of stage.occluders){const mask=Buffer.from(`<svg width="${W}" height="${H}"><polygon fill="white" points="${area.map(p=>p.map(x=>x*scale).join(',')).join(' ')}"/></svg>`);layers.push({input:await sharp(background).composite([{input:mask,blend:'dest-in'}]).png().toBuffer(),left:0,top:0})}
 const image=await sharp(background).composite(layers).png().toBuffer();fs.mkdirSync(out,{recursive:true});
 await sharp(image).resize(1536,1024).png().toFile(path.join(out,'circulacao.png'));
 await sharp(image).extract({left:Math.round(640*scale),top:Math.round(585*scale),width:Math.round(390*scale),height:Math.round(320*scale)}).png().toFile(path.join(out,'circulacao-zoom.png'));
 console.log('Prévia: circulação e zoom nativo, quadro de 80 segundos. Não é captura do navegador.');
})();
