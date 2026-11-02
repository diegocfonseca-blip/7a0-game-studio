import assert from 'node:assert/strict';
import {stadiumExteriorVisible,matchdayFanPoints} from '../../src/escalacao/cidade3d/matchday-plan.mjs';
const gates={home:{threshold:{x:0,z:82},heading:0},away:{threshold:{x:105,z:6},heading:Math.PI/2}};
for(const [side,gate]of Object.entries(gates)){
 let visible=true;
 const point=d=>({x:gate.threshold.x+Math.sin(gate.heading)*d,z:gate.threshold.z+Math.cos(gate.heading)*d});
 for(const distance of [2,.8,.3,0,-.2,-.39]){visible=stadiumExteriorVisible(point(distance),gate,visible);assert(visible,side+': hid before clearing entrance')}
 visible=stadiumExteriorVisible(point(-.41),gate,visible);assert(!visible,side+': not hidden inside');
 for(const distance of [-1,-.2,0,.2,.39]){visible=stadiumExteriorVisible(point(distance),gate,visible);assert(!visible,side+': flickered in doorway')}
 visible=stadiumExteriorVisible(point(.41),gate,visible);assert(visible,side+': did not reappear outside on departure');
 for(let i=0;i<4;i++){const path=matchdayFanPoints(side,i);assert(stadiumExteriorVisible(path[0],gate,false));assert(!stadiumExteriorVisible(path.at(-1),gate,true),'a spectator waiting inside must not remain rendered')}
}
const rotated={threshold:{x:12,z:-3},heading:.73};
assert.equal(stadiumExteriorVisible({x:12-Math.sin(.73),z:-3-Math.cos(.73)},rotated),false);
console.log(JSON.stringify({status:'PASS',homeAndAway:true,hiddenAfterCrossing:true,visibleAgainOnExit:true,noDoorwayFlicker:true,rotatedGate:true}));
