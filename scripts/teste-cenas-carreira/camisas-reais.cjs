const {chromium}=require('playwright-core');
const fs=require('node:fs'),assert=require('node:assert/strict');
const out=process.env.CHEGADA_OUTPUT||'/tmp/camisas-reais',origin=process.env.CHEGADA_ORIGIN||'http://127.0.0.1:5390';fs.mkdirSync(out,{recursive:true});
const clubes=process.env.CHEGADA_CLUBES?.split(',')||['Flamengo','Palmeiras','São Paulo','Fluminense','Vasco','Santos'];
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});try{
 const page=await browser.newPage({viewport:{width:1280,height:1120}});await page.route('**/qa-camisas-reais',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><style>body{margin:0;background:#0c0c0c;color:#f4ecd6;font:700 20px sans-serif}main{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:16px}figure{margin:0;border:2px solid #f4ecd6;border-radius:12px;overflow:hidden}canvas{display:block;width:100%}figcaption{padding:8px;background:#f4ecd6;color:#0c0c0c}</style><main></main>'}));
 await page.goto(origin+'/qa-camisas-reais');
 const report=await page.evaluate(async(clubes)=>{
  const {camisaApresentada,corpoApresentacao}=await import('/src/escalacao/cena-contratacao-camisa.ts'),{pintorChegada}=await import('/src/escalacao/cena-contratacao-pintor.ts'),{ligaEscudosOficiais}=await import('/src/escalacao/escudo-oficial-chave.ts');ligaEscudosOficiais(true);
  const load=url=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=url});
  const [body,portrait,background,atlas,staff]=await Promise.all(['/src/escalacao/img/central-apresentacao-corpo.webp','/avatars/lendas-v1/romario-vasco-2000.webp','/src/escalacao/img/central-chegada-cenario.webp','/src/escalacao/img/central-chegada-sprites.webp','/src/escalacao/img/career-president-terno.webp'].map(load));
  const original=document.createElement('canvas');original.width=original.height=768;const ox=original.getContext('2d');ox.drawImage(body,0,0,768,768);const source=ox.getImageData(0,0,768,768).data;
  const report=[];
  for(const nome of clubes){
   const kit=camisaApresentada(nome),crest=kit.escudo?await load(kit.escudo):undefined;
   const presentation=corpoApresentacao(body,kit,undefined,crest,portrait),pixels=presentation.body.getContext('2d').getImageData(0,0,768,768).data;
   let whites=0,leaks=0,greens=0;
   for(let y=270;y<665;y++)for(let x=178;x<573;x++){
    if(x>=420&&x<485&&y>=275&&y<345)continue;
    const i=(y*768+x)*4,s=source.subarray(i,i+4),p=pixels.subarray(i,i+4);
    if(s[3]>240&&Math.min(...s.slice(0,3))>195&&Math.max(...s.slice(0,3))-Math.min(...s.slice(0,3))<30){whites++;if(Math.min(...p.slice(0,3))>195&&Math.max(...p.slice(0,3))-Math.min(...p.slice(0,3))<30){leaks++;}if(p[1]>p[0]*1.5&&p[1]>p[2]*1.2)greens++}
   }
   report.push({nome,whiteTemplatePixels:whites,whitePixelsOutsideBadge:leaks,greenPixels:greens});
   const fig=document.createElement('figure'),canvas=document.createElement('canvas'),caption=document.createElement('figcaption');canvas.width=640;canvas.height=360;caption.textContent=nome;fig.append(canvas,caption);document.querySelector('main').append(fig);pintorChegada(canvas,{background,atlas,staff,portrait,presentation},{nome:'Romário',club:'Vasco',year:2000})(12000);
  }return report;
 },clubes);
 console.log(JSON.stringify(report,null,2));fs.writeFileSync(out+'/tecido.json',JSON.stringify(report,null,2));await page.screenshot({path:out+'/clubes-reais.png',fullPage:true});
 const fla=report.find(x=>x.nome==='Flamengo');if(fla)assert.equal(fla.whitePixelsOutsideBadge,0,'Flamengo must not retain the white template cuffs/hem');const pal=report.find(x=>x.nome==='Palmeiras');if(pal)assert(pal.greenPixels>30000,'Palmeiras must use its actual green identity');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
