import assert from 'node:assert/strict';
import {matchKitPlan,kitContrast,recolorFabric,kitsClash} from '../../src/escalacao/futebol3d/kit-contrast.mjs';
import {neymarzetti,reiDaBola} from '../../src/escalacao/futebol3d/club-kit.mjs';
const original=JSON.stringify([neymarzetti,reiDaBola]);
for(const viewerClubId of [0,7]){
 const state={viewerClubId,context:{homeClubId:7,awayClubId:0},homeColor:'#ffffff',awayColor:'#ffffff'};
 const plan=matchKitPlan(state,[reiDaBola,neymarzetti]),own=viewerClubId===0?1:0,other=1-own;
 assert.equal(plan[own].config,[reiDaBola,neymarzetti][own]);assert.equal(plan[own].generated,false);
 assert.equal(plan[other].generated,true);assert.ok(kitContrast(plan[own].color,plan[other].color)>=3);
 assert.equal(plan[other].config.variants.home.shirt.art,[reiDaBola,neymarzetti][other].variants.home.shirt.art);
}
assert.equal(matchKitPlan({context:{homeClubId:7,awayClubId:0}},[reiDaBola,neymarzetti]).some(p=>p.generated),false);
const noClash=matchKitPlan({viewerClubId:0,context:{homeClubId:0,awayClubId:7},homeColor:'#ffffff',awayColor:'#123456'},[neymarzetti,null]);assert.equal(noClash.some(p=>p.generated),false);
const pixels=new Uint8ClampedArray([240,239,239,255,240,239,239,255,210,0,20,255,0,0,0,0]);
recolorFabric(pixels,4,{from:'#f0efef',to:'#a81924',protectedRects:[[0,0,1,1]]});
assert.deepEqual([...pixels.slice(0,4)],[240,239,239,255]);assert.notEqual(pixels[4],240);assert.deepEqual([...pixels.slice(8,12)],[210,0,20,255]);assert.equal(pixels[15],0);
assert.equal(JSON.stringify([neymarzetti,reiDaBola]),original);
console.log('PASS own standard home/away; opponent-only contrast; unknown observer fails closed; no clash unchanged; original art/config, protected logo RGBA, accents and alpha preserved.');

assert.equal(kitsClash('#cc2020','#2040cc'),false);assert.equal(kitsClash('#f5f5f5','#eeeecc'),true);assert.equal(kitsClash('#101520','#181d11'),true);
