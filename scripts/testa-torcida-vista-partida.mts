import assert from 'node:assert/strict'
import * as T from 'three'
import {criarTorcidaComplexo} from '../src/escalacao/presidencia-complexo-torcida.ts'
import {criarArquiteturaComplexo} from '../src/escalacao/presidencia-complexo-arquitetura.ts'
import {complexoDoEstadio} from '../src/escalacao/presidencia-complexo-model.ts'
import {STADIUM_SECTORS} from '../src/escalacao/estadiodata.ts'
const save={inv:Object.fromEntries(STADIUM_SECTORS.map(s=>[s.k,s.cost])),ext:[]},scene=new T.Scene()
const architecture=criarArquiteturaComplexo(scene,complexoDoEstadio(save))
const input={mode:'qa-sample' as const,homeOccupancy:.7,awayOccupancy:.5,homeColor:'#224488',awayColor:'#dddddd'},copy=JSON.stringify(input)
const crowd=criarTorcidaComplexo(scene,architecture.seats,input,{detailedDistance:80,pixelDistance:240,detailLimit:40})
const realSeats=()=>{const seats=new Map<string,string>();crowd.root.traverse(node=>{if(!(node instanceof T.InstancedMesh)||!node.instanceColor)return;for(let i=0;i<node.count;i++){const id=node.userData.seatIds[i],color=new T.Color();node.getColorAt(i,color);seats.set(id,(seats.get(id)??'')+color.getHexString())}});return[...seats].sort(([a],[b])=>a.localeCompare(b))}
crowd.perto({x:0,y:22,z:26});const before=crowd.inspect(),seats=realSeats()
crowd.setMatchView(true);const watching=crowd.inspect()
assert.deepEqual(realSeats(),seats,'LOD mantém os mesmos assentos, cores e número de pessoas')
assert.equal(watching.pixelActive,true,'na transmissão, a torcida de poucos pixels usa o lote distante');assert(watching.triangles<before.triangles*.4,'sem desenhar malha próxima onde ela ocupa poucos pixels')
assert.equal(watching.total,before.total);assert.deepEqual(watching.occupancy,before.occupancy)
assert.equal(crowd.setMatchView(true),false,'não reconstrói a cada quadro')
crowd.festa('home',10);assert(crowd.inspect().festa.home>0,'torcida continua comemorando')
crowd.setMatchView(false);assert.deepEqual(realSeats(),seats);assert.equal(crowd.inspect().triangles,before.triangles)
const reserved=seats[0][0];crowd.reserve([reserved]);const reservedSet=realSeats();assert(!reservedSet.some(([id])=>id===reserved))
crowd.setMatchView(true);assert.deepEqual(realSeats(),reservedSet,'reserva do passeador também vale no LOD de jogo')
crowd.setMatchView(false);crowd.perto({x:0,y:2,z:45});assert.equal(crowd.inspect().watchingField,false)
assert.equal(JSON.stringify(input),copy);assert.equal(crowd.inspect().instanceRebuilds,0)
console.log(JSON.stringify({pass:true,ocupantes:seats.length,triangulosAntes:before.triangles,triangulosVistaPartida:watching.triangles,mesmasCoresEAssentos:true,passeioEReservas:true}))
crowd.dispose();architecture.dispose()
