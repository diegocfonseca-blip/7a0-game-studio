import assert from 'node:assert/strict';
import {prepareBodyTrack} from '../../../src/escalacao/futebol3d/chibi/segmented-body-track.mjs';
import {prepareBodyTrack as native} from '../../../src/escalacao/futebol3d/motion/map-root-track.mjs';
const source=t=>({x:t<2?-30-t:1,z:0});
const knots=[{t:1.2,x:-.8,z:0},{t:1.65,x:-1.35,z:0},{t:2.6,x:.8,z:0}];
const controls=[{start:1.2,end:1.65,from:{x:-32,z:0},to:{x:-33,z:0}}];
const fit=prepareBodyTrack(knots,controls,source,{breaks:[{before:1.99,after:2}]}),original=native(knots,controls,source);
for(const t of [1.2,1.65])assert.deepEqual(fit(t),original(t),'Preserve preceding fixed controls');
let peak=0,oldPeak=0;for(let t=1.7;t<1.98;t+=.001){const a=fit(t),b=fit(t+.001),p=original(t),q=original(t+.001);peak=Math.max(peak,Math.abs((b.x-a.x)/.001-1));oldPeak=Math.max(oldPeak,Math.abs((q.x-p.x)/.001-1));assert(source(t).x+a.x<-30,'No anticipation of the new midfield placement');}
assert(peak<10&&peak<oldPeak/2,'A recovery must not aim at a destination on the other side of half-time');
assert.deepEqual(fit(1.995),{x:0,z:0},'The authoritative placement gap has no carried offset');
const clean=prepareBodyTrack(knots,controls,source);for(const t of [.2,1,1.8,2.5])assert.deepEqual(clean(t),original(t),'No behavior change when there is no placement cut');
assert.deepEqual(fit(2.6),{x:.8,z:0},'New-side contacts keep their original offset');
console.log('PASS: segmented recovery ignores future placements, preserves contacts, and keeps the default path unchanged',{peak,oldPeak});
