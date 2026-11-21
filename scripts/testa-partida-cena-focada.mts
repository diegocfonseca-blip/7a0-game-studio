import assert from 'node:assert/strict'
import * as T from 'three'
import {criarCenaFocadaPartida,planoProximoPartida} from '../src/escalacao/presidencia-partida-cena.ts'
const scene=new T.Scene(),make=(name:string)=>{const g=new T.Group();g.name=name;scene.add(g);return g}
const field=make('complexo-campo'),players=make('complexo-partida'),crowd=make('complexo-torcida-sentada'),ads=make('placas-estadio'),city=make('complexo-entorno'),people=make('city-residents'),arrival=make('city-team-arrivals')
const light=new T.DirectionalLight();scene.add(light,light.target)
const camera=new T.PerspectiveCamera(),all=[...scene.children],scope=criarCenaFocadaPartida(scene)
let hiddenUpdates=0,activeUpdates=0
const hidden=new T.Bone(),active=new T.Bone();people.add(hidden);players.add(active)
const hu=hidden.updateMatrixWorld.bind(hidden),au=active.updateMatrixWorld.bind(active)
hidden.updateMatrixWorld=(force?:boolean)=>{hiddenUpdates++;hu(force)};active.updateMatrixWorld=(force?:boolean)=>{activeUpdates++;au(force)}
scope.sync(true);scene.updateMatrixWorld(true)
assert.equal(hiddenUpdates,0,'NPCs fora da cena não entram na atualização global de esqueletos')
assert(activeUpdates>0);assert.equal(city.parent,null)
for(const x of [field,players,crowd,ads,light,light.target])assert.equal(x.parent,scene)
assert.equal(arrival.parent,null)
scope.sync(true,true);assert.equal(arrival.parent,scene,'delegação aparece quando substitui os atletas no intervalo/saída')
scope.sync(true);assert.equal(arrival.parent,null)
const late=make('async-city-model'),fan=make('civilian-fanzone-eu');scope.sync(true)
assert.equal(late.parent,null);assert.equal(fan.parent,scene,'passeio no estádio não perde o avatar')
city.position.set(19,2,70);scope.sync(false);scene.updateMatrixWorld(true)
for(const x of all)assert.equal(x.parent,scene,'mesmos objetos voltam ao mapa, sem reconstruir ou duplicar')
assert.equal(scene.children.filter(x=>x===city).length,1);assert.equal(late.parent,scene)
assert.deepEqual(city.getWorldPosition(new T.Vector3()).toArray(),[19,2,70]);assert(hiddenUpdates>0)
for(let i=0;i<20;i++){scope.sync(true);scope.sync(false)}
assert.equal(scene.children.length,new Set(scene.children).size)
scope.sync(true);scope.dispose();for(const x of all)assert.equal(x.parent,scene)
assert.equal(scope.sync(true),false)
assert.equal(planoProximoPartida(120,true),.08);assert.equal(planoProximoPartida(120,false),1.2)
for(const d of [0,10,100,800,4000])assert(planoProximoPartida(d,false)>=.4&&planoProximoPartida(d,false)<=8)
camera.position.set(0,28,76);camera.near=planoProximoPartida(camera.position.length(),false);camera.far=200;camera.lookAt(0,0,0);camera.updateProjectionMatrix();camera.updateMatrixWorld()
for(const x of [-52.5,0,52.5]){const projected=new T.Vector3(x,.9,0).project(camera);assert(projected.z>=-1&&projected.z<=1,'planos de profundidade preservam os jogadores; a câmera continua recortando as laterais normalmente')}
console.log('PASS cena: NPCs sem matrizes durante jogo, campo/torcida/anúncios/iluminação preservados, intervalo, passeio, carregamento tardio e restauração sem duplicação')
