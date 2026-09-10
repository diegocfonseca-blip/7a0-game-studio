import {readFileSync} from 'node:fs'
import assert from 'node:assert/strict'
const source=readFileSync(new URL('../src/escalacao/store.tsx',import.meta.url),'utf8')
const expression=source.split('\n').find(l=>l.includes('const sig =')&&l.includes('|tv:')).trim().slice('const sig = '.length)
const signature=new Function('state','onlinePreviewEnabled',`return ${expression}`)
const body=source.match(/case 'TV_BANNER_SEEN': \{([\s\S]*?)\n    \}/)[1]
const acknowledge=new Function('s','action',body)
const state={screen:'season',round:0,seasonNo:6,sectorIdx:0,phase:'envelope',monteIdx:0,managers:[],stadiums:{}}
const before=signature(state,()=>true),publicBefore=signature(state,()=>false)
acknowledge(state,{div:'C'})
assert.notEqual(signature(state,()=>true),before,'acknowledgement triggers private autosave')
assert.equal(signature(state,()=>false),publicBefore,'ordinary accounts unchanged')
acknowledge(state,{div:'C'});assert.deepEqual(state.tvBannerSeen,['C'],'idempotent')
const restored=JSON.parse(JSON.stringify(state));restored.seasonNo++
assert.ok(restored.tvBannerSeen.includes('C'),'saved acknowledgement survives reload and season number change')
const seen=signature(state,()=>true);state.tvExtraVisto=true
assert.notEqual(signature(state,()=>true),seen,'extra TV dismissal also saved')
console.log('PASS private TV autosave signature, acknowledgement, serialization, ordinary-account negative')
