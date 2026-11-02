import assert from 'node:assert/strict';
import {STADIUM_ENTRANCES,STADIUM_SERVICE_GATE,STADIUM_AWAY_GATE,STADIUM_HOME_GATE,entranceForRole,serviceExitPoints} from '../../src/escalacao/cidade3d/stadium-entrances.mjs';
import {teamCoachAccess} from '../../src/escalacao/cidade3d/coach-access.mjs';
import {matchdayFanPoints} from '../../src/escalacao/cidade3d/matchday-plan.mjs';
import {intervalSpectatorPoints} from '../../src/escalacao/cidade3d/spectator-access.mjs';
assert.equal(STADIUM_ENTRANCES.length,3);assert.equal(new Set(STADIUM_ENTRANCES.map(e=>JSON.stringify(e.gate.threshold))).size,3);
for(const role of ['home-team','away-team','coaches','staff','medical','ball-attendants'])assert.equal(entranceForRole(role)?.id,'service');
assert.equal(entranceForRole('owner-supporters')?.id,'owner-supporters');assert.equal(entranceForRole('rival-supporters')?.id,'rival-supporters');
assert.equal(entranceForRole('unknown'),undefined);assert.equal(entranceForRole('owner-supporters','away').gate,STADIUM_AWAY_GATE);assert.equal(entranceForRole('rival-supporters','away').gate,STADIUM_HOME_GATE);assert.equal(entranceForRole('away-team','away').gate,STADIUM_SERVICE_GATE);
function crossed(points,gate){const distance=p=>(p.x-gate.threshold.x)*Math.sin(gate.heading)+(p.z-gate.threshold.z)*Math.cos(gate.heading),side=p=>(p.x-gate.threshold.x)*Math.cos(gate.heading)-(p.z-gate.threshold.z)*Math.sin(gate.heading);for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],da=distance(a),db=distance(b);if(da*db>1e-7||Math.abs(da-db)<1e-7)continue;const u=da/(da-db),p={x:a.x+(b.x-a.x)*u,z:a.z+(b.z-a.z)*u};if(Math.abs(side(p))<gate.width/2-.2)return true}return false}
const routes=[{role:'home-team',points:teamCoachAccess().passenger},{role:'away-team',points:teamCoachAccess().passenger},...[-1.35,1.35].map(lane=>({role:'staff',points:serviceExitPoints(lane)}))];
for(const [side,role]of [['home','owner-supporters'],['away','rival-supporters']]){for(let i=0;i<4;i++)routes.push({role,points:matchdayFanPoints(side,i)});routes.push({role,points:intervalSpectatorPoints(side,entranceForRole(role).gate)})}
for(const route of routes){const gates=STADIUM_ENTRANCES.filter(e=>crossed(route.points,e.gate)).map(e=>e.id);assert.deepEqual(gates,[entranceForRole(route.role).id],route.role+' traversed the wrong gate');assert.deepEqual(STADIUM_ENTRANCES.filter(e=>crossed([...route.points].reverse(),e.gate)).map(e=>e.id),gates)}
assert(teamCoachAccess().passenger.some(p=>p.x===STADIUM_SERVICE_GATE.threshold.x&&p.z===STADIUM_SERVICE_GATE.threshold.z));
console.log(JSON.stringify({status:'PASS',physicalEntrances:3,routes:routes.length,staffAndBothTeamsShareService:true,ownerAndRivalSeparated:true,arrivalsAndDepartures:true}));
