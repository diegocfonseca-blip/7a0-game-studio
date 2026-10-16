import assert from 'node:assert/strict'
import fs from 'node:fs'
import {fileURLToPath,pathToFileURL} from 'node:url'
import {createRequire,registerHooks} from 'node:module'
import * as THREE from 'three'

// Original-art contracts only. Real raster/WebGL fidelity and lifecycle are
// checked separately in the browser; Node does not pretend to render the room.
registerHooks({resolve(s,c,n){if(s.startsWith('.')&&c.parentURL?.startsWith('file:')){const p=fileURLToPath(new URL(s,c.parentURL));if(fs.existsSync(p+'.ts'))return{url:pathToFileURL(p+'.ts').href,shortCircuit:true}}return n(s,c)},load(u,c,n){if(u.endsWith('/lang.ts'))return{format:'module',source:"export const getLang=()=> 'pt'",shortCircuit:true};return n(u,c)}})
const require=createRequire(import.meta.url)
const sharp=require('./presidencia-runtime.cjs').loadDependency('sharp')
const {criarPresidenteComplexo}=await import('../src/escalacao/presidencia-presidente-3d.ts')
const {complexoDoEstadio}=await import('../src/escalacao/presidencia-complexo-model.ts')
const {VESTUARIO_MODULAR}=await import('../src/escalacao/presidente-vestuario-modular.ts')
const {PECAS_PRESIDENTE}=await import('../src/escalacao/presidente-pecas.ts')
const {TONS_PELE}=await import('../src/escalacao/presidente-pele.ts')
const {camadasDoPresidente}=await import('../src/escalacao/presidente-aparencia.ts')
const {PRESIDENTE_RIG,PRESIDENTE_LAYERS,montarPresidenteLayers}=await import('../src/escalacao/presidente-rig.ts')
const {camadasNaPose,podeSentarPresidente,arteSentada}=await import('../src/escalacao/presidente-pose.ts')
const {planoPresidenteOriginal,limitesPresidenteOriginal,comporPresidenteOriginal}=await import('../src/escalacao/presidente-textura-original.ts')

const base={version:5,name:'Presidente escolhido',outfit:'terno',appearance:{version:22,hair:'puyol-2010-hair',beard:'messi-2023-beard',skinTone:'medium',accessories:['silver-studs']}}
const wallet=ids=>({cash:1000,revision:1,owned:ids.map(id=>({id,paid:20}))})
const catalogueBefore=JSON.stringify([VESTUARIO_MODULAR,PRESIDENTE_LAYERS,PECAS_PRESIDENTE])
const assets=new Map()
let plans=0,piecePlans=0,ownershipCases=0

function checkPlan(president,pose){
 const before=JSON.stringify(president),ids=camadasDoPresidente(president),assembled=montarPresidenteLayers(ids)
 assert.equal(assembled.ok,true,'a seleção original precisa existir no catálogo')
 const actual=planoPresidenteOriginal(president,pose),expected=camadasNaPose(assembled.layers,pose)
 assert.deepEqual(actual,expected,'sala e editor usam as mesmas camadas, ordem e coordenadas')
 assert.equal(actual.filter(layer=>layer.kind==='base').length,1)
 const originalBase=actual.find(layer=>layer.kind==='base')
 assert.equal(originalBase.outfit,president.outfit,'a pose não substitui a roupa escolhida')
 assert.equal(originalBase.src,pose==='seated'?arteSentada(president.outfit):VESTUARIO_MODULAR.find(outfit=>outfit.id===president.outfit).src)
 for(const layer of actual){
  assert.equal(layer.rig,PRESIDENTE_RIG.id)
  const prior=assets.get(layer.src)
  if(prior)assert.deepEqual(prior,layer.raster,'uma fonte tem uma dimensão nativa definida')
  else assets.set(layer.src,{...layer.raster})
 }
 assert.equal(JSON.stringify(president),before,'compor um plano não modifica a aparência salva')
 return actual
}

for(const outfit of VESTUARIO_MODULAR)for(const skin of TONS_PELE)for(const pose of ['standing','seated']){
 checkPlan({...base,outfit:outfit.id,appearance:{...base.appearance,skinTone:skin.id}},pose);plans++
}
assert.equal(plans,33*5*2)

// Every separately selectable piece retains its own source, including both
// earrings. No hair/beard is translated into a generic geometric family.
for(const piece of PECAS_PRESIDENTE.filter(piece=>piece.ready))for(const pose of ['standing','seated']){
 const appearance={...base.appearance,...(piece.category==='accessory'?{accessories:[piece.id]}:{[piece.category]:piece.id})}
 const layers=checkPlan({...base,appearance},pose)
 for(const id of piece.layers)assert(layers.some(layer=>layer.id===id),`peça selecionada preservada: ${id}`)
 piecePlans++
}
for(const appearance of [undefined,{version:16,hair:'classic',beard:'classic'},{version:22,hair:'none',beard:'none',accessories:[]}]){
 for(const pose of ['standing','seated'])checkPlan({...base,appearance},pose)
}
assert.equal(JSON.stringify([VESTUARIO_MODULAR,PRESIDENTE_LAYERS,PECAS_PRESIDENTE]),catalogueBefore,'o catálogo compartilhado permanece intacto')

// Read each source once, not once per skin tone. Catch a broken seated path or
// raster size before it becomes an invisible president in-game.
for(const [src,raster] of assets){
 const file=fileURLToPath(new URL('../public/'+src,import.meta.url))
 assert(fs.existsSync(file),`arte original existe: ${src}`)
 const metadata=await sharp(file).metadata()
 assert.equal(metadata.format,'webp',src)
 assert.equal(metadata.width,raster.width,src)
 assert.equal(metadata.height,raster.height,src)
 assert.equal(metadata.hasAlpha,true,`transparência original: ${src}`)
}

const poseCases=[
 [[],false],[['mesa-simples'],false],[['cadeira-simples'],false],
 [['mesa-simples','cadeira-simples'],true],[['mesa-madeira','cadeira-couro'],true],
 [['mesa-madeira','cadeira-simples'],true],[['mesa-simples','cadeira-couro'],true],
 [['cadeira-couro','tapete'],false],[['mesa-madeira','tapete'],false],
]
for(const outfit of VESTUARIO_MODULAR)for(const [ids,expected] of poseCases){
 const owned=wallet(ids).owned,before=JSON.stringify(owned)
 assert.equal(podeSentarPresidente(outfit.id,owned),expected,'somente mesa e cadeira próprias permitem sentar')
 assert.equal(JSON.stringify(owned),before);ownershipCases++
}
assert.equal(podeSentarPresidente('roupa-inexistente',wallet(['mesa-simples','cadeira-simples']).owned),false)

// An asymmetric fixture checks exclusive edges, alpha threshold and isolated
// pixels without reimplementing the bounds algorithm in this test.
const width=12,height=14,pixels=new Uint8ClampedArray(width*height*4)
for(let y=3;y<11;y++)for(let x=4;x<9;x++)pixels[(y*width+x)*4+3]=40
pixels[3]=255
pixels[(1*width+1)*4+3]=255
for(let x=0;x<width;x++)pixels[(13*width+x)*4+3]=39
assert.deepEqual(limitesPresidenteOriginal(pixels,width,height),{left:4,top:3,right:9,bottom:11},'direita e fundo exclusivos; alpha40 conta, alpha39 não')
assert.throws(()=>limitesPresidenteOriginal(new Uint8ClampedArray(width*height*4),width,height),/vazia/)
assert.throws(()=>limitesPresidenteOriginal(pixels,width+.5,height),/inválida/)
assert.throws(()=>limitesPresidenteOriginal(pixels.subarray(4),width,height),/inválida/)

const invalidSelections=[
 {...base,outfit:'inexistente'},
 {...base,appearance:{...base.appearance,version:2}},
 {...base,appearance:{...base.appearance,hair:'cabelo-inexistente'}},
 {...base,appearance:{...base.appearance,skinTone:'azul'}},
 {...base,appearance:{...base.appearance,accessories:['silver-studs','silver-studs']}},
]
for(const president of invalidSelections){
 const before=JSON.stringify(president)
 assert.throws(()=>planoPresidenteOriginal(president,'standing'),/visual original/)
 assert.equal(JSON.stringify(president),before)
}
assert.throws(()=>planoPresidenteOriginal(base,'retrato-inventado'),/Pose/)
assert.equal(typeof document,'undefined','este teste não usa nem simula o compositor do navegador')
const cancelled=new AbortController(),reason=new DOMException('Cancelamento do teste','AbortError')
cancelled.abort(reason)
await assert.rejects(comporPresidenteOriginal(base,'standing',{signal:cancelled.signal}),error=>error===reason,'cancelamento antes de qualquer acesso ao DOM')

// No-DOM is a real loading failure, never permission to silently restore the
// rejected procedural body. Browser QA covers its actual world-space surface.
const scene=new THREE.Scene(),bare=complexoDoEstadio({inv:{},ext:[]})
const outside=criarPresidenteComplexo(scene,bare),interior=criarPresidenteComplexo(scene,bare,{interior:true})
assert.equal(outside.inspect().available,false)
assert.equal(interior.inspect().available,true)
assert.equal(interior.inspect().source,'original-art')
assert.equal(interior.inspect().status,'empty')
outside.update(base,wallet(['mesa-simples','cadeira-simples']))
assert.equal(outside.inspect().president,null,'a arte não compra um camarote externo')
interior.update(base,wallet(['mesa-simples','cadeira-simples']))
assert.equal(interior.inspect().status,'loading')
assert.equal(await interior.whenReady(),false)
assert.equal(interior.inspect().status,'error')
assert.equal(interior.inspect().meshes,0,'falha de arte não fabrica um personagem diferente')
assert.equal(interior.root.visible,false)
assert.equal(interior.inspect().president.outfit,base.outfit,'falha não apaga a escolha')
interior.update({...base,outfit:'inexistente'},wallet([]))
assert.equal(interior.inspect().status,'empty')
assert.equal(interior.inspect().president,null)
outside.dispose();interior.dispose();interior.dispose()
assert.equal(scene.children.length,0)

console.log(`PASS arte original: ${plans} planos roupa/pele/pose, ${piecePlans} planos de peças, ${assets.size} fontes únicas com dimensão/alfa, ${ownershipCases} regras de pose; catálogo e save imutáveis, limites alfa, seleção inválida, cancelamento e falha sem substituto. Renderização e enquadramento: testes separados no navegador.`)
