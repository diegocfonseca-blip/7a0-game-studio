import assert from 'node:assert/strict';import {existsSync} from 'node:fs';import {registerHooks} from 'node:module';import * as THREE from 'three';
registerHooks({resolve(s,c,n){if(s.startsWith('.')&&c.parentURL?.startsWith('file:')){const p=new URL(s+'.ts',c.parentURL);if(existsSync(p))return{url:p.href,shortCircuit:true}}return n(s,c)}});
const {criarPeruasAmbulantes}=await import('../../src/escalacao/presidencia-perua-ambulante.ts');
const parent=new THREE.Group(),colors=['#a7422b','#dfb736'],factory=criarPeruasAmbulantes(parent,colors);
for(const [i,color]of colors.entries()){
 const van=factory.root.getObjectByName('vendor-van-'+i);assert(van);const hull=van.children.find(o=>o.isMesh&&o.material.color?.getHexString()===color.slice(1));assert(hull,'Painted body was lost during batching');hull.geometry.computeBoundingBox();const bounds=hull.geometry.boundingBox;assert(bounds.min.x<-.8&&bounds.max.x>.8&&bounds.min.z<-1.9&&bounds.max.z>1.9,'Body hull is incomplete');
 const roof=van.children.filter(o=>o.isMesh&&o.material.color?.getHexString()==='eee5cf');assert(roof.some(o=>{o.geometry.computeBoundingBox();return o.geometry.boundingBox.max.y>2}),'Roof was lost');
 van.traverse(o=>{if(o.isMesh){const p=o.geometry.attributes.position;for(let k=0;k<p.count;k++)assert(Number.isFinite(p.getX(k)+p.getY(k)+p.getZ(k)),'Invalid merged vertex')}})
}
factory.dispose();assert.equal(parent.children.length,0);console.log('PASS: both van hulls, roofs and finite geometry survive batching; disposal removes root.');
