import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { extname } from 'node:path'
import * as THREE from 'three'
const sourceRoot = new URL('../src/escalacao/', import.meta.url).href
const hooks = registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && context.parentURL?.startsWith(sourceRoot) && !extname(specifier)) {
      const url = new URL(specifier + '.ts', context.parentURL)
      if (existsSync(url)) return next(url.href, context)
    }
    return next(specifier, context)
  },
  load(url, context, next) {
    const result = next(url, context)
    if (url.startsWith(sourceRoot) && result.source != null) return { ...result, source: Buffer.from(result.source).toString().replaceAll('import.meta.env.BASE_URL', "'/'") }
    return result
  },
})
const distance = (a, b) => Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)
const close = (a,b,message,tolerance=.00001) => assert(Math.abs(a-b)<tolerance,`${message}: ${a}/${b}`)
try {
  const { complexoDoEstadio } = await import('../src/escalacao/presidencia-complexo-model.ts')
  const { STADIUM_SECTORS, STADIUM_EXTRAS } = await import('../src/escalacao/estadiodata.ts')
  const { criarArquiteturaComplexo } = await import('../src/escalacao/presidencia-complexo-arquitetura.ts')
  const { criarEntornoComplexo } = await import('../src/escalacao/presidencia-complexo-entorno.ts')
  const { criarTransporteComplexo, roteiroTransporteComplexo } = await import('../src/escalacao/presidencia-complexo-transporte.ts')
  const save={inv:Object.fromEntries(STADIUM_SECTORS.map(s=>[s.k,s.cost])),ext:STADIUM_EXTRAS.map(e=>e.k)}
  const state=complexoDoEstadio(save),scene=new THREE.Scene(),architecture=criarArquiteturaComplexo(scene,state),environment=criarEntornoComplexo(scene,state)
  const statics=[]
  for(const root of [architecture.root,environment.root])root.traverse(object=>{if(object instanceof THREE.Mesh)statics.push(object)})
  scene.updateMatrixWorld(true)
  const staticBounds=statics.map(mesh=>({mesh,bounds:new THREE.Box3().setFromObject(mesh)}))
  const ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0)
  let continuity=0,footProbes=0,bodyProbes=0,chairs=0
  for(const [kind,side,tier,row] of [['bus','home','lower',0],['car','home','lower',5],['metro','away','upper',0],['metro','home','lower',10]]){
    const access=architecture.seatAccess.find(access=>access.side===side&&access.seat.tier===tier&&access.seat.row===row)
    assert(access,`acesso real ${side}/${tier}/${row}`)
    const options={transit:true,metroSide:side,metroPassengers:+(kind==='metro'),busPassengers:+(kind==='bus'),parkingPassengers:+(kind==='car'),cars:+(kind==='car'),seatAccess:{[side]:access}}
    const timeline=roteiroTransporteComplexo(state,options),entry=timeline.services.find(e=>e.service.kind===kind)
    assert.deepEqual(timeline.at(0).problems,[],`${kind}/${side}: rota composta válida`)
    assert.equal(entry.seatAccess.seatId,access.seatId)
    assert.deepEqual(entry.inbound.at(-1),access.standing)
    assert.deepEqual(entry.outbound[0],access.standing)
    assert.deepEqual(entry.outbound.at(-1),entry.inbound[0])
    const stages=entry.walking.inspect().stages
    for(const phase of ['sitting','seated','standing','climbing','descending'])assert(stages.some(s=>s.phase===phase),`${kind} executa ${phase}`)
    for(const stage of stages){
      const before=entry.walking.at(Math.max(0,stage.at-.000001)),after=entry.walking.at(stage.at+.000001)
      assert(distance(before.hip,after.hip)<.0001,'quadril contínuo inclusive nas junções')
      for(let foot=0;foot<2;foot++)assert(distance(before.feet[foot].position,after.feet[foot].position)<.0001,'pé contínuo entre etapas')
      assert(after.feet.some(foot=>foot.supported),'sempre há apoio físico')
      continuity++
    }
    const actors=criarTransporteComplexo(scene,state,options),initial=actors.inspect().passengers.find(p=>p.transport===kind),body=actors.actor(side)
    assert.equal(body.root.uuid,initial.rigId)
    assert.deepEqual(actors.reservedSeatIds(),[access.seatId])
    const end=entry.service.passengerRoute.at(-1),start=access.points[0]
    const connector=new THREE.Vector3(start.x-end.x,start.y-end.y,start.z-end.z),connectorLength=connector.length()
    if(connectorLength>.00001){
      connector.divideScalar(connectorLength)
      const lateral=new THREE.Vector3(connector.z,0,-connector.x)
      for(const shift of [-.33,0,.33])for(const height of [.35,.95,1.72]){
        const origin=new THREE.Vector3(end.x,end.y+height,end.z).addScaledVector(lateral,shift)
        const box=new THREE.Box3().setFromPoints([origin,origin.clone().addScaledVector(connector,connectorLength)]).expandByScalar(.002)
        ray.set(origin,connector);ray.near=.001;ray.far=connectorLength
        assert.equal(ray.intersectObjects(staticBounds.filter(s=>s.bounds.intersectsBox(box)).map(s=>s.mesh),false).length,0,`${kind}/${side}: conector não corta objetos`)
        bodyProbes++
      }
    }
    const probes=new Set([entry.markers.seated,entry.markers.seated+5,entry.markers.boarding,entry.markers.boarded])
    for(const stage of stages){
      const t=stage.at+stage.duration*.5,p=entry.walking.at(t)
      if(Math.min(distance(p.hip,{...end,y:end.y+.86}),distance(p.hip,{...start,y:start.y+.86}))<5||['sitting','standing'].includes(stage.phase)){
        for(const fraction of [.02,.5,.98])probes.add(entry.markers.doorsOpen+stage.at+stage.duration*fraction)
      }
    }
    for(const seconds of (process.argv.includes('--logic')?[]:[...probes].sort((a,b)=>a-b))){
      actors.update(seconds);scene.updateMatrixWorld(true)
      const p=actors.inspect().passengers.find(p=>p.transport===kind)
      assert.equal(p.rigId,initial.rigId,'veículo→cadeira→retorno conserva mesmo corpo')
      assert.equal(p.seatId,access.seatId)
      const vehicleMeshes=[]
      actors.root.getObjectByName(`transporte-${entry.service.id}`).traverse(o=>{if(o instanceof THREE.Mesh)vehicleMeshes.push(o)})
      for(const [index,sole] of actors.passengerFeet.find(a=>a.id===p.id).feet.entries()){
        sole.geometry.computeBoundingBox();const bounds=sole.geometry.boundingBox
        for(const x of [bounds.min.x,bounds.max.x])for(const z of [bounds.min.z,bounds.max.z]){
          const point=new THREE.Vector3(x,bounds.min.y,z).applyMatrix4(sole.matrixWorld)
          ray.set(new THREE.Vector3(point.x,point.y+.4,point.z),down);ray.near=0;ray.far=1.2
          const box=new THREE.Box3().setFromPoints([ray.ray.origin,ray.ray.origin.clone().addScaledVector(down,ray.far)]).expandByScalar(.002)
          const hit=ray.intersectObjects([...staticBounds.filter(s=>s.bounds.intersectsBox(box)).map(s=>s.mesh),...vehicleMeshes],false).find(h=>h.face&&h.face.normal.clone().transformDirection(h.object.matrixWorld).y>.9)
          assert(hit,`${kind}/${side}: sola tem piso ${point.toArray()} fase${p.pose.phase}`)
          assert(point.y>=hit.point.y-.012,`${kind}/${side}: sola não penetra piso ${point.y}/${hit.point.y} ${point.x},${point.z}`)
          if(p.pose.feet[index].supported)close(point.y,hit.point.y,`${kind}/${side}: sola apoiada sem flutuar`,.012)
          footProbes++
        }
      }
    }
    actors.dispose()
    const journey={key:`jogo-${kind}-${side}`,phase:'playing',variantSeed:37},liveOptions={...options,journey}
    const live=criarTransporteComplexo(scene,state,liveOptions)
    const liveEntry=roteiroTransporteComplexo(state,liveOptions).services.find(e=>e.service.kind===kind)
    live.update(liveEntry.holdAt+100)
    const seated=live.inspect().passengers.find(p=>p.transport===kind),held=live.inspect().vehicles.find(v=>v.kind===kind)
    assert.equal(seated.phase,'seated','jornada retém corpo já sentado')
    assert.equal(seated.pose.seated,1)
    close(seated.pose.hip.y,access.seat.position.y+access.seat.seatHeight+.08,'quadril sobre cadeira')
    assert.equal(held.heldAtGate,true)
    const frozen=live.inspect();live.update(frozen.seconds+500)
    assert.deepEqual(live.inspect().passengers.find(p=>p.transport===kind).pose,seated.pose,'permanece no assento ao longo da partida')
    live.configure({...liveOptions,journey:{...journey,phase:'departure'}})
    const pending=live.allocation().pending.find(p=>p.vehicleId===held.id)
    assert(pending,'saída agendada depois de retornar ao veículo')
    const departureStart=live.inspect().seconds
    let sawStanding=false,sawBoarding=false
    for(let time=departureStart;time<pending.at;time+=.5){
      live.update(time);const p=live.inspect().passengers.find(p=>p.transport===kind)
      assert.equal(p.rigId,seated.rigId);assert(live.reservedSeatIds().includes(access.seatId))
      sawStanding ||= p.phase==='standing';sawBoarding ||= p.phase==='boarding'
    }
    assert(sawStanding&&sawBoarding,'levanta e embarca fisicamente na saída')
    live.update(pending.at+.001)
    assert(!live.inspect().passengers.some(p=>p.transport===kind));assert(!live.reservedSeatIds().includes(access.seatId))
    live.dispose();chairs++
    console.log(JSON.stringify({checkpoint:`${kind}-${side}-${tier}-${row}`,continuity,footProbes,bodyProbes}))
  }
  const home=architecture.seatAccess.find(a=>a.side==='home'&&a.seat.row===0),away=architecture.seatAccess.find(a=>a.side==='away'&&a.seat.row===0)
  const demand={transit:true,metroPassengers:1,metroSide:'away',seatAccess:{home,away},homeColor:'#123456',awayColor:'#654321'}
  const switching=criarTransporteComplexo(scene,state,demand)
  const initial=switching.inspect().passengers.find(p=>p.transport==='metro'),vehicle=switching.inspect().vehicles.find(v=>v.kind==='metro')
  switching.setAccessBlocked({away:true});switching.update(vehicle.markers.arrival+100)
  assert.equal(switching.inspect().vehicles.find(v=>v.kind==='metro').doorsOpen,0,'acesso ocupado segura no veículo antes de abrir')
  assert.equal(switching.inspect().passengers.find(p=>p.transport==='metro').phase,'riding')
  switching.setAccessBlocked({});switching.update(switching.inspect().seconds+20)
  const before=switching.inspect();switching.configure({...demand,metroSide:'home'})
  assert.equal(switching.allocation().metroSide,'away','demanda nova não relabela passageiro atual')
  assert.deepEqual(switching.inspect().passengers.find(p=>p.transport==='metro').pose,before.passengers.find(p=>p.transport==='metro').pose)
  const pending=switching.allocation().pending.find(p=>p.vehicleId===vehicle.id)
  switching.update(pending.at+.001)
  const next=switching.inspect().passengers.find(p=>p.transport==='metro')
  assert.equal(next.rigId,initial.rigId);assert.equal(next.vehicleId,initial.vehicleId);assert.equal(next.side,'home');assert.equal(next.color,'#123456');assert.equal(next.seatId,home.seatId)
  assert.equal(switching.allocation().metroSide,'home');assert.equal(switching.actor('home').root.userData.side,'home')
  switching.dispose()
  let ownershipFrames=0,blockedTransfers=0
  for(const from of ['home','away']){
    const options={transit:true,metroPassengers:1,busPassengers:1,metroSide:from,seatAccess:{home,away}}
    const timetable=roteiroTransporteComplexo(state,options)
    let transferTime
    // Different trip lengths deliberately make the new service start while
    // the former seat owner is still outside. No crowd cohort is involved.
    for(let time=5;time<10000;time+=.5){
      const frame=timetable.at(time),train=frame.vehicles.find(v=>v.kind==='metro'),bus=frame.vehicles.find(v=>v.kind==='bus')
      const old=frame.passengers.find(p=>p.transport===(from==='home'?'metro':'bus'))
      if((from==='home'?bus:train).phase==='origin'&&old.phase!=='riding'&&old.phase!=='boarding'){transferTime=time;break}
    }
    assert(transferTime,'precondição: novo serviço na origem e antigo dono fora')
    const actors=criarTransporteComplexo(scene,state,options);actors.update(transferTime)
    const before=actors.inspect(),oldOwner=before.passengers.find(p=>p.ownsSeat&&p.seatId===home.seatId)
    assert(oldOwner)
    actors.configure({...options,metroSide:from==='home'?'away':'home'})
    const same=actors.inspect().passengers.find(p=>p.id===oldOwner.id)
    assert.equal(same.rigId,oldOwner.rigId);assert.equal(same.ownsSeat,true)
    const deadline=Math.max(...actors.allocation().pending.map(p=>p.at))+1200
    let sawBlocked=false,sawNewOwner=false
    for(let time=transferTime;time<deadline;time+=1){
      actors.update(time);const frame=actors.inspect(),owners=frame.passengers.filter(p=>p.seatId===home.seatId&&p.ownsSeat)
      assert(owners.length<=1,'um único dono físico da cadeira mesmo quando dois serviços reservam')
      for(const p of frame.passengers)if(p.seatId&&p.phase!=='riding')assert(p.ownsSeat,`${from}: só desembarca depois de obter cadeira`)
      for(const vehicle of frame.vehicles)if(vehicle.waitingForSeat===home.seatId&&vehicle.heldAtAccess){
        assert.equal(vehicle.doorsOpen,0);const p=frame.passengers.find(p=>p.vehicleId===vehicle.id)
        assert.equal(p.phase,'riding');sawBlocked=true
      }
      sawNewOwner ||= owners.some(p=>p.transport!==(from==='home'?'metro':'bus'))
      ownershipFrames++
    }
    assert(sawBlocked,`${from}: serviço novo aguarda cadeira ocupada sem depender de coorte`)
    assert(sawNewOwner,`${from}: cadeira transfere depois da volta do dono antigo à origem`)
    actors.dispose();blockedTransfers++
  }
  const bare=criarTransporteComplexo(new THREE.Scene(),complexoDoEstadio({inv:{},ext:[]}),{busPassengers:1,journey:{key:'varzea',phase:'playing',variantSeed:0}})
  bare.update(10000);assert.equal(bare.inspect().passengers[0].phase,'at-gate');assert.equal(bare.inspect().passengers[0].seatId,undefined);bare.dispose()
  architecture.dispose();environment.dispose()
  console.log(JSON.stringify({status:'PASS',chairs,continuity,footProbes,bodyProbes,ownershipFrames,blockedTransfers,sameBody:true,gateFallback:true,heldSeated:true,originSideChange:true,blockedAccess:true}))
}finally{hooks.deregister()}
