import assert from 'node:assert/strict';
import {audit,roads,roadBox,walks,vehiclePaths,samplePath,inside,allLots,overlap} from './layout.mjs';
const report=audit();for(const key of ['conflicts','roadConflicts','outside','disconnectedRoads','pedestrianConflicts','vehicleConflicts'])assert.equal(report[key].length,0,key+': '+JSON.stringify(report[key]));assert.equal(report.connectedRoads,roads.length);
const junctions=[];for(let i=0;i<roads.length;i++)for(let j=i+1;j<roads.length;j++){const a=roads[i],b=roads[j];if((a.a[0]===a.b[0])===(b.a[0]===b.b[0]))continue;const x=a.a[0]===a.b[0]?a.a[0]:b.a[0],z=a.a[1]===a.b[1]?a.a[1]:b.a[1];if(x>=Math.min(a.a[0],a.b[0])&&x<=Math.max(a.a[0],a.b[0])&&z>=Math.min(a.a[1],a.b[1])&&z<=Math.max(a.a[1],a.b[1])&&x>=Math.min(b.a[0],b.b[0])&&x<=Math.max(b.a[0],b.b[0])&&z>=Math.min(b.a[1],b.b[1])&&z<=Math.max(b.a[1],b.b[1]))junctions.push({x,z,minX:x-8,maxX:x+8,minZ:z-8,maxZ:z+8})}
const bays=[{minX:-110,maxX:-35,minZ:136.2,maxZ:144.1},{minX:130,maxX:215,minZ:145.9,maxZ:154}];
const covered=p=>roads.some(r=>inside(p,roadBox(r,false),.08))||junctions.some(j=>inside(p,j,.08))||bays.some(j=>inside(p,j,.08));
const bad=[];for(const [id,points]of Object.entries(vehiclePaths)){if(id==='parking')continue;for(const p of samplePath(points,.15))if(!covered(p)){bad.push({id,p});break}}
assert.equal(bad.length,0,JSON.stringify(bad));
for(const j of junctions)for(const lot of allLots)assert.equal(!!overlap({minX:j.x-10,maxX:j.x+10,minZ:j.z-10,maxZ:j.z+10},lot),false,'junction/lot '+lot.name);
console.log(JSON.stringify({...report,junctions:junctions.length,vehiclesOnRoad:true},null,2));
