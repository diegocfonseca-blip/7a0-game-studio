import assert from 'node:assert/strict';
import {isImmediateLooseContinuation} from '../../../src/escalacao/futebol3d/chibi/ground-continuation-kind.mjs';
const receive={t:66,key:'runner'},next={t:68.1,key:'teammate'};
assert.equal(isImmediateLooseContinuation(receive,next,t=>({owner:t<67.55?'runner':undefined})),false,'Do not erase a controlled run because another athlete receives later');
assert.equal(isImmediateLooseContinuation(receive,next,t=>({owner:t<66.15?'runner':undefined})),true,'Retain an actual spilled first touch');
assert.equal(isImmediateLooseContinuation(receive,{t:66.2,key:'opponent'},()=>({owner:'opponent'})),true,'Immediate loss to an opponent remains loose');
assert.equal(isImmediateLooseContinuation(receive,next,()=>({owner:'runner'})),false,'A continued dribble keeps the original source trajectory');
console.log('PASS: distinguish controlled dribbling from an immediate failed first touch');
