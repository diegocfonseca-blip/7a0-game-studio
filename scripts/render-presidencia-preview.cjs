// Render estático das camadas da prévia offline. Não é screenshot do React.
// Antes: node scripts/testa-presidencia-evolucao.mjs --preview
const fs=require('node:fs'),path=require('node:path');
const sharp=require('./presidencia-runtime.cjs').loadDependency('sharp');
const root=path.resolve(__dirname,'..');
(async()=>{
 const html=fs.readFileSync(path.join(root,'test-results/presidencia-evolucao-preview.html'),'utf8');
 const cards=[...html.matchAll(/<article><h2>(.*?)<\/h2>(.*?)<\/article>/gs)],cache=new Map();
 async function asset(url){if(!cache.has(url))cache.set(url,'data:image/png;base64,'+(await sharp(new URL(url).pathname).png().toBuffer()).toString('base64'));return cache.get(url)}
 let body='',defs='',clipId=0;
 for(let n=0;n<cards.length;n++){
  const x=16+(n%3)*390,y=76+Math.floor(n/3)*420;
  body+=`<rect x="${x}" y="${y}" width="372" height="402" rx="14" fill="#fff" stroke="#0c0c0c" stroke-width="3"/><text x="${x+12}" y="${y+26}" font-size="16" font-family="sans-serif" font-weight="bold">${cards[n][1].replace(/&/g,'&amp;')}</text>`;
  const views=cards[n][2].split('<div class="view ').slice(1);
  for(let j=0;j<views.length;j++){
   const w=366,h=j===0?244:146,vy=y+38+(j===0?0:244),b=views[j].match(/<img class="base" src="([^"]+)"/);
   body+=`<g transform="translate(${x+3},${vy})"><image href="${await asset(b[1])}" width="${w}" height="${h}" preserveAspectRatio="none"/>`;
   const corner=views[j].match(/<img class="pe-layer"[^>]*src="([^"]+)"/);
   if(corner)body+=`<image href="${await asset(corner[1])}" width="${w}" height="${h}"/>`;
   for(const m of views[j].matchAll(/<div class="pe-layer"[^>]*style="clip-path:([^\"]+)"[^>]*><div class="pe-reveal" style="clip-path:([^\"]+)"[^>]*><img src="([^\"]+)"/g)){
    const points=[...m[1].matchAll(/([\d.]+)%\s+([\d.]+)%/g)].map(p=>`${Number(p[1])*w/100},${Number(p[2])*h/100}`).join(' '),id='c'+clipId++;
    defs+=`<clipPath id="${id}"><polygon points="${points}"/></clipPath>`;
    let reveal='';
    if(m[2]!=='none'){
     const v=m[2].match(/inset\(0 ([\d.]+)% 0 ([\d.]+)%\)/),rid='c'+clipId++;
     defs+=`<clipPath id="${rid}"><rect x="${Number(v[2])*w/100}" y="0" width="${(100-Number(v[1])-Number(v[2]))*w/100}" height="${h}"/></clipPath>`;
     reveal=` clip-path="url(#${rid})"`;
    }
    body+=`<g clip-path="url(#${id})"><g${reveal}><image href="${await asset(m[3])}" width="${w}" height="${h}" preserveAspectRatio="none"/></g></g>`;
   }
   for(const m of views[j].matchAll(/<div class="pe-sprite"[^>]*style="left:([\d.]+)%;top:([\d.]+)%;width:([\d.]+)%;height:([\d.]+)%"><img src="([^"]+)"/g)){
    body+=`<image href="${await asset(m[5])}" x="${Number(m[1])*w/100}" y="${Number(m[2])*h/100}" width="${Number(m[3])*w/100}" height="${Number(m[4])*h/100}"/>`;
   }
   for(const p of views[j].matchAll(/<span class="pe-person" data-npc-placement="([^\"]+)" style="left:([\d.]+)%;top:([\d.]+)%;[^\"]*"><img src="([^\"]+)"/g)){
    const pw=w*(p[1]==='stand'?.009:j===0?.018:.01);
    body+=`<image href="${await asset(p[4])}" x="${Number(p[2])*w/100}" y="${Number(p[3])*h/100}" width="${pw}" height="${pw*1.6}"/>`;
   }
   body+='</g>';
  }
 }
 const height=76+Math.ceil(cards.length/3)*420;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1186" height="${height}"><defs>${defs}</defs><rect width="100%" height="100%" fill="#f4ecd6"/><text x="16" y="30" font-size="24" font-family="sans-serif" font-weight="bold">Presidência — prévia das camadas</text><text x="16" y="54" font-size="13" font-family="sans-serif">Renderização estática do modelo; não substitui o teste do aplicativo.</text>${body}</svg>`;
 await sharp(Buffer.from(svg)).png().toFile(path.join(root,'test-results/presidencia-evolucao-preview.png'));
 const layers=JSON.parse(fs.readFileSync(path.join(root,'test-results/presidente-preview-model.json'),'utf8'));
 let character='';
 for(const layer of layers){
  const file=path.join(root,'public',layer.src),metadata=await sharp(file).metadata();
  if(metadata.width!==layer.raster.width||metadata.height!==layer.raster.height)throw Error('Dimensão de camada: '+layer.id);
  const png='data:image/png;base64,'+(await sharp(file).png().toBuffer()).toString('base64'),b=layer.bounds;
  character+=`<image href="${png}" x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}"/>`;
 }
 const portrait=`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="650"><rect width="100%" height="100%" fill="#f4ecd6"/><text x="20" y="36" font-size="24" font-family="sans-serif" font-weight="bold">Personagem — peças existentes preservadas</text><text x="20" y="62" font-size="14" font-family="sans-serif">Prévia estática do mesmo rig: corpo inteiro e rosto ampliado.</text><rect x="20" y="90" width="330" height="530" rx="14" fill="#1b3a29" stroke="#0c0c0c" stroke-width="3"/><svg x="20" y="98" width="330" height="495" viewBox="0 0 1024 1536">${character}</svg><rect x="380" y="90" width="390" height="390" rx="14" fill="#f4ecd6" stroke="#0c0c0c" stroke-width="3"/><svg x="390" y="100" width="370" height="370" viewBox="320 0 384 384">${character}</svg><text x="390" y="520" font-size="17" font-family="sans-serif">Cabelo e barba selecionados separadamente.</text><text x="390" y="546" font-size="17" font-family="sans-serif">Roupas e poses originais mantidas.</text></svg>`;
 await sharp(Buffer.from(portrait)).png().toFile(path.join(root,'test-results/presidente-preview.png'));
 console.log('Prévia estática: test-results/presidencia-evolucao-preview.png');
})().catch(error=>{console.error(error);process.exitCode=1});
