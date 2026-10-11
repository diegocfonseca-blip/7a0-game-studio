// Verificação offline dos módulos reais; não instala dependências nem acessa contas.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath,pathToFileURL} from 'node:url'
import {registerHooks,stripTypeScriptTypes} from 'node:module'
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')
const auth={callback:null,user:{email:'diego.c.fonseca@gmail.com'},verify:async()=>({data:{user:auth.user},error:null})}
globalThis.__presidenciaAuth=auth
registerHooks({
 resolve(specifier,context,next){
  if(specifier==='react')return {url:'presidencia:react',shortCircuit:true}
  if(specifier.startsWith('.')&&context.parentURL?.startsWith('file:')){
   const candidate=fileURLToPath(new URL(specifier,context.parentURL))
   for(const ext of ['.ts','.tsx'])if(fs.existsSync(candidate+ext))return {url:pathToFileURL(candidate+ext).href,shortCircuit:true}
  }
  return next(specifier,context)
 },
 load(url,context,next){
  if(url==='presidencia:react')return {format:'module',source:'export function useSyncExternalStore(subscribe,snapshot){subscribe(()=>{});return snapshot()}',shortCircuit:true}
  if(url.endsWith('/lang.ts'))return {format:'module',source:"export const getLang=()=> 'pt';export const tr=(pt)=>pt",shortCircuit:true}
  if(url.endsWith('/lib/supabase.ts'))return {format:'module',source:'const a=globalThis.__presidenciaAuth;export const supabase={auth:{getUser:()=>a.verify(),onAuthStateChange:cb=>{a.callback=cb}}}',shortCircuit:true}
  if(url.endsWith('.ts'))return {format:'module',source:stripTypeScriptTypes(fs.readFileSync(fileURLToPath(url),'utf8')),shortCircuit:true}
  return next(url,context)
 }
})
const {STADIUM_SECTORS,STADIUM_EXTRAS}=await import('../src/escalacao/estadiodata.ts')
const {camadasEstadio,populacaoEstadio,extrasSemArte,vistaTemPendencias,progressoVisualSetor}=await import('../src/escalacao/presidencia-estadio-camadas.ts')
const {obrasVisuaisEstadio}=await import('../src/escalacao/presidencia-estadio-obras.ts')
const fullInv=Object.fromEntries(STADIUM_SECTORS.map(s=>[s.k,s.cost]))
let checked=0
for(let mask=0;mask<2**STADIUM_EXTRAS.length;mask++){
 const ext=STADIUM_EXTRAS.filter((_,index)=>mask&(1<<index)).map(e=>e.k)
 for(const roofClosed of [false,true]){
  const st={inv:{...fullInv},ext,roofClosed},before=JSON.stringify(st)
  for(const camera of ['aerial','window']){
   const layers=camadasEstadio(st,camera)
   for(const layer of layers){
    const key=layer.id.split(':')[0]
    assert.ok(STADIUM_SECTORS.some(s=>s.k===key&&st.inv[key]>0)||ext.includes(key),'Nenhuma obra não adquirida: '+key)
    assert.ok(fs.existsSync(path.join(root,'public',layer.src)),layer.src)
    assert.ok(!/v254|v255|v256|v259/.test(layer.src),'Arte rejeitada')
    if(key==='retratil')assert.ok(roofClosed&&ext.includes('cober'))
   }
   if(ext.includes('cober')&&ext.includes('retratil')&&(camera==='aerial'||ext.length<STADIUM_EXTRAS.length)){
    assert.equal(layers.some(layer=>layer.id.startsWith('retratil:')),roofClosed,'Teto sem negócios: '+camera)
   }
   if(camera==='window')assert.ok(!layers.some(layer=>['hotel','loja','chopp','praca','estac','estacao'].includes(layer.id.split(':')[0])),'Negócios fora da janela')
  }
  assert.equal(JSON.stringify(st),before,'Renderização não altera save')
  assert.ok(populacaoEstadio(st).fans<=6)
  checked++
 }
}
for(const key of ['geral','cadeiras','visitante','camarote']){
 const sector=STADIUM_SECTORS.find(s=>s.k===key),inv={...fullInv,[key]:sector.cost/2}
 const st={inv,ext:[]}
 assert.equal(progressoVisualSetor(st,key),.5)
 assert.ok(camadasEstadio(st,'aerial').some(layer=>layer.id===key&&layer.progress===.5),'Obra em progresso: '+key)
 assert.ok(populacaoEstadio(st).workers>0)
 const near={inv:{...fullInv,[key]:sector.cost-.01},ext:['cober','retratil'],roofClosed:true}
 assert.ok(!camadasEstadio(near,'aerial').some(layer=>layer.id.startsWith('retratil:')),'Teto não usa percentual arredondado')
}
for(const extra of STADIUM_EXTRAS){
 const st={inv:{...fullInv},ext:extra.k==='retratil'?['cober','retratil']:[extra.k]}
 assert.ok(obrasVisuaisEstadio(st).find(work=>work.id===extra.k)?.artReady,extra.k+' aparece individualmente')
}
assert.equal(vistaTemPendencias({inv:fullInv,ext:['obra-futura']}),true)
assert.equal(vistaTemPendencias({inv:{...fullInv,futuro:20},ext:[]}),true)
assert.deepEqual(extrasSemArte({inv:fullInv,ext:STADIUM_EXTRAS.map(e=>e.k)}),[])
assert.deepEqual(camadasEstadio({inv:{geral:Infinity},ext:['loja']},'aerial'),[])
assert.deepEqual(camadasEstadio(undefined,'aerial'),[])
assert.deepEqual(populacaoEstadio(undefined),{workers:0,fans:0,security:0})
const {atoresDoMapa,ROTAS_ESTADIO,quadroAtor,posicaoNaRota,comprimentoRota,limitarVistaMapa,aproximarMapa}=await import('../src/escalacao/presidencia-estadio-mapa-model.ts')
for(const sector of STADIUM_SECTORS.filter(s=>s.k!=='grama')){
 for(const progress of [.01,.5,1]){
  const st={inv:{[sector.k]:sector.cost*progress},ext:[]}
  const layers=camadasEstadio(st,'aerial')
  assert.ok(layers.some(l=>l.id===sector.k&&l.progress===progress),'Investimentos fora de ordem: '+sector.k)
  assert.ok(layers.every(l=>l.id===sector.k),'Não concede outro setor')
 }
}
assert.deepEqual(atoresDoMapa(undefined),[])
const emptyActors=atoresDoMapa({inv:{},ext:[]})
assert.ok(emptyActors.every(actor=>actor.kind==='car'&&actor.route.startsWith('road')),'Terreno vazio só tem tráfego da rua')
const populated=atoresDoMapa({inv:fullInv,ext:STADIUM_EXTRAS.map(e=>e.k)})
for(const actor of populated){
 assert.ok(fs.existsSync(path.join(root,'public',actor.src)),actor.src)
 if(actor.srcBack)assert.ok(fs.existsSync(path.join(root,'public',actor.srcBack)),actor.srcBack)
 for(let seconds=0;seconds<=300;seconds+=.5){
  const p=quadroAtor(actor,seconds)
  assert.ok([p.x,p.y,p.angle,p.depth,p.scale].every(Number.isFinite),'Quadro finito')
  assert.ok(p.frame>=0&&p.frame<(actor.frames??1),'Quadro de caminhada dentro da folha')
  // Cada quadro pertence a um segmento da rota, sem cortar as curvas.
  const route=ROTAS_ESTADIO[actor.route]
  assert.ok(route.points.slice(1).some((b,i)=>{const a=route.points[i],dx=b.x-a.x,dy=b.y-a.y;const cross=Math.abs((p.x-a.x)*dy-(p.y-a.y)*dx);const dot=(p.x-a.x)*dx+(p.y-a.y)*dy;return cross<1e-6&&dot>=-1e-6&&dot<=dx*dx+dy*dy+1e-6}),'Ator não sai da rota: '+actor.id)
 }
}
const walking=populated.find(actor=>actor.kind==='fan'&&actor.route==='entranceBare')
assert.equal(quadroAtor(walking,0).back,true,'Quem vai para a entrada é visto de costas')
assert.ok(new Set([0,.17,.34,.51].map(t=>quadroAtor(walking,t).frame)).size===4,'Quatro poses de caminhada')
for(const [key,route] of [['loja','shop'],['praca','food'],['chopp','beer'],['hotel','hotel'],['estacao','station'],['estac','parking']]){
 assert.ok(!emptyActors.some(actor=>actor.route===route))
 assert.ok(atoresDoMapa({inv:fullInv,ext:[key]}).some(actor=>actor.route===route),'Destino só comprado: '+key)
}
const bend={id:'test',points:[{x:0,y:0},{x:10,y:0},{x:10,y:10}],loop:false}
assert.equal(comprimentoRota(bend),20)
assert.deepEqual(posicaoNaRota(bend,15),{x:10,y:5,angle:90})
assert.deepEqual(posicaoNaRota(bend,25,true),{x:10,y:5,angle:270})
assert.deepEqual(limitarVistaMapa({zoom:10,x:999,y:-999},320,200),{zoom:4,x:480,y:-300})
assert.deepEqual(limitarVistaMapa({zoom:1,x:90,y:90},320,200),{zoom:1,x:0,y:0})
assert.deepEqual(aproximarMapa({zoom:1,x:0,y:0},2,{x:60,y:20},320,200),{zoom:2,x:-60,y:-20})
const {aparenciaInicial,escolherPeca,escolherTomPele,camadasDoPresidente,aparenciaModular}=await import('../src/escalacao/presidente-aparencia.ts')
const {montarPresidenteLayers}=await import('../src/escalacao/presidente-rig.ts')
const {PECAS_PRESIDENTE}=await import('../src/escalacao/presidente-pecas.ts')
for(const piece of PECAS_PRESIDENTE.filter(p=>p.ready)){
 const look=escolherPeca(aparenciaInicial(),piece.category,piece.id)
 assert.ok(look,piece.id)
 const rendered=montarPresidenteLayers(camadasDoPresidente({outfit:'presidente-raiz',appearance:look}))
 assert.ok(rendered.ok,piece.id)
 assert.equal(rendered.layers.some(layer=>layer.kind==='face'||layer.src.includes('rosto-neutro')),false,'Preserva o padrão sem traços faciais: '+piece.id)
 for(const layer of rendered.layers)assert.ok(fs.existsSync(path.join(root,'public',layer.src)),layer.src)
}
const neutral=montarPresidenteLayers(camadasDoPresidente({outfit:'presidente-raiz',appearance:{version:22,hair:'none',beard:'none',accessories:[]}}))
assert.ok(neutral.ok);assert.deepEqual(neutral.layers.map(layer=>layer.kind),['base'],'Base original sem olhos, nariz ou boca adicionais')
const appearance=escolherTomPele(escolherPeca(aparenciaInicial(),'accessory','silver-studs'),'brown')
const changed=aparenciaModular(escolherPeca(appearance,'hair','none'))
assert.equal(changed.skinTone,'brown');assert.deepEqual(changed.accessories,['silver-studs']);assert.equal(changed.beard,'classic-beard')
const access=await import('../src/escalacao/presidente-acesso.ts')
assert.equal(access.presidentPreviewEmail('outra@gmail.com'),false)
assert.equal(access.presidentPreviewEmail('diego.c.fonseca@gmail.com'),true)
access.usePresidentPreview();await new Promise(resolve=>setImmediate(resolve))
assert.equal(access.presidentWritesEnabled(),true)
auth.user={email:'outra@gmail.com'};auth.callback();assert.equal(access.presidentWritesEnabled(),false)
await new Promise(resolve=>setImmediate(resolve));assert.equal(access.presidentWritesEnabled(),false)
let release
auth.verify=()=>new Promise(resolve=>{release=resolve});auth.callback();await new Promise(resolve=>setImmediate(resolve))
const stale=release
auth.verify=async()=>({data:{user:null},error:{message:'offline'}});auth.callback();await new Promise(resolve=>setImmediate(resolve))
stale({data:{user:{email:'diego.c.fonseca@gmail.com'}},error:null});await new Promise(resolve=>setImmediate(resolve))
assert.equal(access.presidentWritesEnabled(),false,'Resposta antiga não reabre gate')
console.log(`PASS: ${checked} combinações, compras individuais, progresso fracionado, teto independente de negócios, saves intactos, peças reais e gate exclusivo/falha fechada. Fixtures offline; sem login real ou gravação em nuvem.`)
const {camadasMundo,OCLUSORES_MUNDO}=await import('../src/escalacao/presidencia-estadio-mundo.ts')
const {extraLiberadoNoProjeto,podeInvestirNoProjeto}=await import('../src/escalacao/presidencia-estadio-projeto.ts')
for(const key of ['geral','cadeiras','visitante','camarote']){
 const incomplete={inv:{...fullInv,[key]:fullInv[key]-.01},ext:['cober','retratil'],roofClosed:true}
 assert.equal(extraLiberadoNoProjeto(incomplete,'cober'),false)
 assert.equal(extraLiberadoNoProjeto(incomplete,'retratil'),false)
 assert.ok(!camadasMundo(incomplete).some(l=>l.id==='cober'||l.id==='retratil'),'Sem teto antes de dois andares completos')
}
assert.equal(podeInvestirNoProjeto({inv:{},ext:[]},'camarote'),false)
assert.equal(podeInvestirNoProjeto({inv:fullInv,ext:[]},'camarote'),true)
assert.equal(extraLiberadoNoProjeto({inv:{},ext:[]},'asfalto'),false)
assert.equal(extraLiberadoNoProjeto({inv:{},ext:['loja']},'asfalto'),true)
assert.equal(extraLiberadoNoProjeto({inv:{geral:40},ext:[]},'asfalto'),true)
assert.equal(extraLiberadoNoProjeto({inv:{}},'asfalto'),false)
assert.equal(camadasMundo({inv:{},ext:['asfalto']})[0].art,'complete')
for(const key of ['hotel','loja','praca','estacao']){
 assert.ok(!camadasMundo({inv:{},ext:['asfalto']}).some(l=>l.id.startsWith(key+':')))
 assert.ok(camadasMundo({inv:{},ext:[key]}).some(l=>l.id.startsWith(key+':')))
}
let worldChecks=0
const worldExtras=[...STADIUM_EXTRAS.map(e=>e.k),'asfalto']
for(let mask=0;mask<2**worldExtras.length;mask++)for(const roofClosed of [false,true]){
 const ext=worldExtras.filter((_,i)=>mask&(1<<i)),st={inv:{...fullInv},ext,roofClosed},before=JSON.stringify(st),world=camadasMundo(st)
 assert.equal(world.some(l=>l.id==='cober'),ext.includes('cober'))
 assert.equal(world.some(l=>l.id==='retratil'),ext.includes('cober')&&ext.includes('retratil')&&roofClosed)
 for(const k of ['loja','hotel','praca','chopp','estacao','estac'])assert.equal(world.some(l=>l.id.startsWith(k+':')),ext.includes(k),'Lote: '+k)
 assert.equal(world.some(l=>l.id==='refl'),ext.includes('refl'))
 assert.equal(world.some(l=>l.id==='telao'),ext.includes('telao'))
 assert.ok(world.every(l=>l.progress>=0&&l.progress<=1))
 assert.equal(JSON.stringify(st),before)
 worldChecks++
}
assert.equal(camadasMundo({inv:{camarote:150},ext:[]}).some(l=>l.id==='camarote'),false,'Andar superior não flutua sem o inferior')
console.log('PASS:',worldChecks,'combinações do mapa ampliado, terrenos/negócios, dois andares, iluminação e teto.')
// Executa os dois cases reais do store, sem carregar provider/rede.
// Não é um teste do reducer inteiro nem de autosave.
const data=await import('../src/escalacao/estadiodata.ts')
const project=await import('../src/escalacao/presidencia-estadio-projeto.ts')
const {podeAlterarPresidencia}=await import('../src/escalacao/presidencia-carreira.ts')
const storeSource=fs.readFileSync(path.join(root,'src/escalacao/store.tsx'),'utf8')
const cases=storeSource.slice(storeSource.indexOf("    case 'STADIUM_INVEST': {"),storeSource.indexOf("    case 'BECOME_HOST': {"))
let allowPrivate=true
const deps={...data,...project,podeAlterarPresidencia,presidentWritesEnabled:()=>allowPrivate,logFin:(s,kind,label,amount,unused,id)=>s.ledger.push({kind,amount,id})}
const buyCase=new Function(...Object.keys(deps),'return (s,action)=>{switch(action.type){'+cases+'}}')(...Object.values(deps))
const fixture=(stadium,wallet=500)=>({careerOnline:true,onlineMode:'cpu',sport:'futebol',youIdx:0,managers:[{id:7,isHuman:true}],agenciaOn:true,stadiums:{7:structuredClone(stadium)},careerCoins:{7:wallet},ledger:[]})
let purchase=fixture({inv:{geral:40},ext:[]},100)
buyCase(purchase,{type:'STADIUM_BUILD',mgrId:7,ext:'asfalto'})
assert.equal(purchase.careerCoins[7],20);assert.deepEqual(purchase.stadiums[7].ext,['asfalto']);assert.equal(purchase.ledger[0].amount,-80)
buyCase(purchase,{type:'STADIUM_BUILD',mgrId:7,ext:'asfalto'})
assert.equal(purchase.careerCoins[7],20);assert.equal(purchase.ledger.length,1,'Compra não cobra duas vezes')
for(const [st,wallet] of [[{inv:{},ext:[]},100],[{inv:{geral:40},ext:[]},79]]){
 const s=fixture(st,wallet),before=JSON.stringify(s);buyCase(s,{type:'STADIUM_BUILD',mgrId:7,ext:'asfalto'});assert.equal(JSON.stringify(s),before)
}
for(const ext of ['cober','retratil']){
 const s=fixture({inv:{...fullInv,camarote:149.99},ext:ext==='retratil'?['cober']:[]}),before=JSON.stringify(s)
 buyCase(s,{type:'STADIUM_BUILD',mgrId:7,ext});assert.equal(JSON.stringify(s),before)
}
const locked=fixture({inv:{},ext:[]}),lockedBefore=JSON.stringify(locked)
buyCase(locked,{type:'STADIUM_INVEST',mgrId:7,sector:'camarote'});assert.equal(JSON.stringify(locked),lockedBefore)
allowPrivate=false
const outside=fixture({inv:fullInv,ext:[]}),outsideBefore=JSON.stringify(outside)
buyCase(outside,{type:'STADIUM_BUILD',mgrId:7,ext:'asfalto'});assert.equal(JSON.stringify(outside),outsideBefore,'Nova melhoria não está no catálogo público')
allowPrivate=true
const otherManager=fixture({inv:fullInv,ext:[]}),otherBefore=JSON.stringify(otherManager)
buyCase(otherManager,{type:'STADIUM_BUILD',mgrId:8,ext:'asfalto'});assert.equal(JSON.stringify(otherManager),otherBefore)
console.log('PASS: cases reais de compra/investimento — pré-requisitos, saldo, cobrança única e escopo privado; sem provider/autosave.')
if(process.argv.includes('--preview')){
 const {etapaBaseEstadio,vistaInicialEstadio}=await import('../src/escalacao/presidencia-vista-estadio.ts')
 const {estadioCompletoNaAerea}=await import('../src/escalacao/presidencia-estadio-completo.ts')
 const {personagensEstadio}=await import('../src/escalacao/presidencia-estadio-camadas.ts')
 const asset=src=>pathToFileURL(path.join(root,'public',src)).href
 const render=(st,camera)=>{
  const stage=etapaBaseEstadio(st),complete=estadioCompletoNaAerea(st),grass=vistaInicialEstadio(st).grass
  const names={geral:camera==='aerial'?'estadio-v104/geral.webp':'estadio-v112/geral-janela.webp',cadeiras:camera==='aerial'?'estadio-v223/cadeiras-aerea.webp':'estadio-v223/cadeiras-janela.webp',visitante:camera==='aerial'?'estadio-v225/visitante-aerea.webp':'estadio-v225/visitante-janela.webp',camarote:camera==='aerial'?'estadio-v226/camarote-aerea.webp':'estadio-v225/visitante-janela.webp'}
  const base=camera==='aerial'?'estadio-mapa/terreno.webp':complete?(camera==='aerial'?`estadio-v104/${st.roofClosed?'fechado':'aberto'}.webp`:`estadio-v115/${st.roofClosed?'fechado':'aberto'}-janela.webp`):names[stage]??(camera==='aerial'?'estadio-v104/terra.webp':'estadio-v106/terra-janela.webp')
  let layers=camadasEstadio(st,camera)
  if((camera==='aerial'||!stage)&&grass>0){const clip=camera==='aerial'?`polygon(33.1% 26%, ${33.1+32.1*grass}% 26%, ${30.5+37.1*grass}% 43.5%, 30.5% 43.5%)`:`polygon(26.4% 32.6%, ${26.4+47.2*grass}% 32.6%, ${8.8+82.4*grass}% 46%, 8.8% 46%)`;layers=[{id:'grama',src:camera==='aerial'?'estadio-v104/grama.webp':'estadio-v106/grama-janela.webp',clip,progress:1},...layers]}
  const overlay=layers.map(l=>{if(l.bounds)return `<div class="pe-sprite" data-stadium-layer="${l.id}" style="left:${l.bounds.left}%;top:${l.bounds.top}%;width:${l.bounds.width}%;height:${l.bounds.height}%"><img src="${asset(l.src)}"></div>`;const xs=[...l.clip.matchAll(/([\d.]+)%\s+[\d.]+%/g)].map(m=>Number(m[1]));const left=Math.min(...xs),right=100-(left+(Math.max(...xs)-left)*l.progress);return `<div class="pe-layer" data-stadium-layer="${l.id}" style="clip-path:${l.clip}"><div class="pe-reveal" style="clip-path:${l.progress<1?`inset(0 ${right}% 0 ${left}%)`:'none'}"><img src="${asset(l.src)}"></div></div>`}).join('')
  const npcs=personagensEstadio(st,camera).map(p=>`<span class="pe-person" data-npc-placement="${p.placement}" style="left:${p.left}%;top:${p.top}%;--pe-delay:${p.delay}s"><img src="${asset(p.src)}"></span>`).join('')
  return `<div class="view ${camera}"><div class="pe-scene" data-camera="${camera}"><div class="pe-camera-canvas"><img class="base" src="${asset(base)}">${!complete&&camera==='aerial'&&['visitante','camarote'].includes(stage)?`<img class="pe-layer" style="width:100%;height:100%" src="${asset('estadio-v242/canto-direito-overlay.png')}">`:''}${overlay}<div class="pe-population paused">${npcs}</div></div></div></div>`
 }
 // Cada clique real de investimento (20 moedas, limitado ao custo do setor),
 // seguido por cada compra individual e pelas duas posições do teto.
 const fixtures=[['00 — Terreno sem investimento',{inv:{},ext:[]}]]
 const sequence={inv:{},ext:[]}
 for(const sector of STADIUM_SECTORS){
  let clicks=0
  while((sequence.inv[sector.k]??0)<sector.cost){
   sequence.inv[sector.k]=Math.min(sector.cost,(sequence.inv[sector.k]??0)+20)
   fixtures.push([`${sector.n} — clique ${++clicks} — ${sequence.inv[sector.k]}/${sector.cost}`,structuredClone(sequence)])
  }
 }
 for(const extra of STADIUM_EXTRAS){
  fixtures.push([`${extra.n} — compra individual`,{inv:{...fullInv},ext:extra.k==='retratil'?['cober','retratil']:[extra.k]}])
 }
 fixtures.push(['Teto fechado sem negócios',{inv:{...fullInv},ext:['cober','retratil'],roofClosed:true}])
 const precinct={inv:{...fullInv},ext:[]}
 for(const key of ['refl','telao','loja','asfalto','estac','praca','chopp','estacao','cober','hotel','retratil']){
  precinct.ext.push(key)
  fixtures.push([`Mapa acumulado — adicionou ${STADIUM_EXTRAS.find(e=>e.k===key)?.n??'Ruas internas e calçadas'}`,structuredClone(precinct)])
 }
 fixtures.push(['Complexo completo — teto fechado',{...structuredClone(precinct),roofClosed:true}])

 const stages=fixtures.map(([name,st])=>({name,stadium:st,grass:vistaInicialEstadio(st).grass,stage:etapaBaseEstadio(st),layers:camadasEstadio(st,'aerial'),actors:atoresDoMapa(st),world:camadasMundo(st),occluders:st.ext.includes('asfalto')?OCLUSORES_MUNDO:[]}))
 fs.mkdirSync(path.join(root,'test-results'),{recursive:true})
 fs.writeFileSync(path.join(root,'test-results/estadio-mapa-model.json'),JSON.stringify(stages))
 const css=fs.readFileSync(path.join(root,'src/escalacao/presidencia-estadio-camadas.css'),'utf8')
 const cards=fixtures.map(([name,st])=>`<article><h2>${name}</h2>${render(st,'aerial')}${render(st,'window')}</article>`).join('')
 const html=`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}body{margin:0;padding:20px;background:#F4ECD6;color:#0C0C0C;font-family:Arial,sans-serif}h1{font-size:22px}h2{font-size:16px;margin:12px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}article{overflow:hidden;border:3px solid #0C0C0C;border-radius:14px;box-shadow:3px 3px #0C0C0C;background:#fff}.base{display:block;width:100%;height:auto}.window{height:140px;border-top:3px solid #0C0C0C}.window .base{height:100%;object-fit:cover}button{border:2px solid black;padding:8px}@media(max-width:600px){.grid{grid-template-columns:1fr}}</style><h1>Presidência — etapas individuais</h1><p>Inventário visual de cada clique e compra. Composição em revisão: caminhos, profundidade, carros e zoom ainda pendentes. Sem publicação ou alteração de contas.</p><div class="grid">${cards}</div></html>`
 fs.mkdirSync(path.join(root,'test-results'),{recursive:true})
 fs.writeFileSync(path.join(root,'test-results/presidencia-evolucao-preview.html'),html)
 const face=escolherPeca(escolherPeca(aparenciaInicial(),'hair','marcelo-2017-hair'),'beard','marcelo-2017-beard')
 const portrait=montarPresidenteLayers(camadasDoPresidente({outfit:'presidente-raiz',appearance:face}))
 assert.ok(portrait.ok)
 fs.writeFileSync(path.join(root,'test-results/presidente-preview-model.json'),JSON.stringify(portrait.layers))
 console.log('Prévia: test-results/presidencia-evolucao-preview.html')
}
