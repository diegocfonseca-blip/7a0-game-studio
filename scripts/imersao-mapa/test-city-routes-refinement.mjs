import assert from 'node:assert/strict';
import {walkNetwork} from '../../src/escalacao/cidade3d/walk-network.mjs';
import {arredondarCaminho,viagemVeiculo} from '../../src/escalacao/veiculos-entrega-rota.ts';
const points=[{x:0,z:0},{x:0,z:35},{x:35,z:35},{x:35,z:60}],route=viagemVeiculo(arredondarCaminho(points,3).map(p=>({...p,y:0})),7);
let last=route.at(0),maxAcceleration=0,minCornerSpeed=7,maxStep=0;
for(let i=1;i<=Math.ceil(route.duration*120);i++){const p=route.at(i/120),step=Math.hypot(p.x-last.x,p.z-last.z);assert(step<=7/120+.00001);assert(p.distance>=last.distance);assert(Math.abs(step-(p.distance-last.distance))<.003);maxAcceleration=Math.max(maxAcceleration,Math.abs(p.speed-last.speed)*120);maxStep=Math.max(maxStep,step);if(p.z>32&&p.z<36&&p.x<4)minCornerSpeed=Math.min(minCornerSpeed,p.speed);last=p}
assert(maxAcceleration<3.21);assert(minCornerSpeed<4);assert.equal(last.speed,0);assert.equal(last.done,true);assert.equal(route.at(0).speed,0);
const short=viagemVeiculo([{x:0,y:0,z:0},{x:.5,y:0,z:0}]);assert(short.duration<3);assert(Math.abs(short.at(short.duration).x-.5)<1e-7);
// Opposite pavements are connected ONLY by a registered crossing. A wall
// cannot be bypassed by the neighbour-link or the shortest-path algorithm.
const paths=[{points:[{x:0,z:0},{x:0,z:30}]},{points:[{x:8,z:0},{x:8,z:30}]}];
const valid=(p,cross)=>cross||Math.abs(p.x)<.1||Math.abs(p.x-8)<.1;
const clear=(a,b,cross)=>cross||Math.abs(a.x-b.x)<.1;
const isolated=walkNetwork(paths,valid,clear);assert.equal(isolated.path(isolated.nearest({x:0,z:10}),isolated.nearest({x:8,z:10})),null);
const linked=walkNetwork([...paths,{crossing:true,points:[{x:0,z:0},{x:8,z:0}]}],valid,clear);assert(linked.path(linked.nearest({x:0,z:10}),linked.nearest({x:8,z:10})));
const blocked=walkNetwork(paths,p=>valid(p,false)&&!(p.z>12&&p.z<18),(a,b)=>clear(a,b,false)&&!(a.z<12&&b.z>18));assert.equal(blocked.path(blocked.nearest({x:0,z:2}),blocked.nearest({x:0,z:28})),null);
console.log({status:'PASS',maxAcceleration,minCornerSpeed,maxStep,shortTrip:short.duration,registeredCrossingsOnly:true});
