import assert from 'node:assert/strict'
import {planejarRedeViaria,poligonoRuaComplexo} from '../src/escalacao/presidencia-complexo-ruas.ts'

const point=(x,z)=>({x,z})
const road=(id,points,width=5.8,walk=1.2)=>({id,points:points.map(([x,z])=>point(x,z)),width,walk})
const rect=(minX,maxX,minZ,maxZ)=>[point(minX,minZ),point(maxX,minZ),point(maxX,maxZ),point(minX,maxZ)]
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value)}return value}
const exact=(a,b)=>assert(Math.abs(a-b)<1e-8,`${a} != ${b}`)

// The diagnostic footprint matches the rendered width and actual end caps;
// sidewalks are additional lateral space, not evidence of connected asphalt.
const polygon=poligonoRuaComplexo(road('sample',[[0,0],[10,0]]))
assert.deepEqual(polygon,[point(-3,2.9),point(13,2.9),point(13,-2.9),point(-3,-2.9)])
const padded=poligonoRuaComplexo(road('sample',[[0,0],[10,0]]),1.2)
exact(padded[0].x,-3);exact(padded[0].z,4.1)
const narrow=poligonoRuaComplexo(road('narrow',[[0,0],[0,8]],4,0))
exact(narrow[0].z,-.85);exact(narrow[1].z,8.85)

// Duplicate and partially overlapping local streets have the same paved union
// after normalization. A true gap between centre intervals is not filled.
const input=freeze({streets:[road('bairro-a',[[0,0],[10,0]]),road('parque-b',[[20,0],[10,0]]),road('bairro-c',[[4,0],[8,0]])]})
const before=JSON.stringify(input),merged=planejarRedeViaria(input)
assert.equal(JSON.stringify(input),before,'planner mutated input')
assert.equal(merged.diagnostics.originalStreets,3)
assert.equal(merged.diagnostics.normalizedStreets,1)
assert.equal(merged.diagnostics.mergedStreets,2)
assert.deepEqual(merged.streets[0].points,[point(0,0),point(20,0)])
assert.equal(merged.streets[0].sourceIds.length,3)
const gap=planejarRedeViaria({streets:[road('bairro-a',[[0,0],[10,0]]),road('bairro-b',[[12,0],[20,0]])]})
assert.equal(gap.diagnostics.normalizedStreets,2,'normalization must not extend an absent interval')

const isolated=[road('local-a',[[-30,0],[-15,0]]),road('local-b',[[15,0],[30,0]])]
const linked=planejarRedeViaria({streets:isolated})
assert.equal(linked.diagnostics.beforeComponents,2)
assert.equal(linked.diagnostics.afterComponents,1)
assert.equal(linked.connections.length,1)
assert(linked.connections[0].fromId&&linked.connections[0].toId)
const wall={id:'future-hotel',polygon:rect(-5,5,-20,20)}
const blocked=planejarRedeViaria({streets:isolated,obstacles:[wall]})
assert.equal(blocked.connections.length,0,'road invaded a reserved building')
assert.equal(blocked.diagnostics.afterComponents,2)
assert(blocked.diagnostics.unresolved.some(item=>item.kind==='component'))
const walking=planejarRedeViaria({streets:isolated,blockedRoutes:[{...wall,id:'station'}]})
assert.equal(walking.connections.length,0,'road crossed protected station access')

// A near endpoint is a parking destination only when its physical road cap
// actually reaches the reserved parking polygon.
const parking=planejarRedeViaria({streets:[road('rua-interna-oeste',[[0,110],[0,20]])],obstacles:[{id:'estacionamento-3',polygon:rect(-8,8,5,18)}]})
assert(parking.diagnostics.resolvedDestinations.some(item=>item.end===1&&item.destination==='estacionamento-3'))
const farParking=planejarRedeViaria({streets:[road('rua-interna-oeste',[[0,110],[0,20]])],obstacles:[{id:'estacionamento-3',polygon:rect(-8,8,5,12)}]})
assert.equal(farParking.diagnostics.resolvedDestinations.length,0)

// Only the registered sidewalk at the southern internal-road exits can become
// an explicit raised crossing. All other pedestrian paths stay blockers.
const exitRoads=[road('rua-interna-leste',[[0,120],[0,150]]),road('local-public',[[-30,100],[30,100]],10,2.8)]
const sidewalk={id:'sidewalk',polygon:rect(-45,45,114,116)}
const crossing=planejarRedeViaria({streets:exitRoads,blockedRoutes:[sidewalk]})
assert.equal(crossing.crossings.length,1)
assert.equal(crossing.crossings[0].pedestrianRouteId,'sidewalk')
assert(crossing.connections.some(connection=>connection.id===crossing.crossings[0].roadId))
const noStationCrossing=planejarRedeViaria({streets:exitRoads,blockedRoutes:[{...sidewalk,id:'station'}]})
assert.equal(noStationCrossing.crossings.length,0)
assert.equal(noStationCrossing.connections.length,0)

// A local component connection must not disguise an internal terminal by
// folding backwards over its own approach.
for(const connection of crossing.connections.filter(c=>c.reason==='terminal')){
 const source=exitRoads.find(r=>r.id===connection.fromId),p=connection.points[0]
 const end=Math.hypot(p.x-source.points[0].x,p.z-source.points[0].z)<1e-8?0:1
 const previous=source.points[1-end],next=connection.points[1]
 const cosine=((p.x-previous.x)*(next.x-p.x)+(p.z-previous.z)*(next.z-p.z))/(Math.hypot(p.x-previous.x,p.z-previous.z)*Math.hypot(next.x-p.x,next.z-p.z))
 assert(cosine>=-.2-1e-8,'terminal folds into its own incoming street')
}
console.log('PASS road planner: immutable input, paved widths/caps, exact coalescing, connected components, protected plots and pedestrian paths, parking contact, explicit raised crossings.')
