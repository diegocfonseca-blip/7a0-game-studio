import fs from 'node:fs'
import vm from 'node:vm'
import assert from 'node:assert/strict'
import ts from 'typescript'
const exports = {}
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/escalacao/online-release.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports})
const isPublic=exports.publicOnlineVisual
assert.equal(isPublic({onlineMode:'online',sport:'futebol'}),true)
assert.equal(isPublic({onlineMode:'online',sport:'futebol',careerOnline:true}),false)
assert.equal(isPublic({onlineMode:'offline',sport:'futebol'}),false)
assert.equal(isPublic({onlineMode:'online',sport:'basquete'}),false)
assert.equal(isPublic({}),false)
const screens=fs.readFileSync('src/escalacao/screens.tsx','utf8')
assert.match(screens,/const privateCareerShell = previewAccount &&/)
assert.match(screens,/if \(privatePreview && state.careerIntent/)
assert.match(fs.readFileSync('src/escalacao/copa-mundo.tsx','utf8'),/previewAccount \|\| \(ONLINE_VISUAL_RELEASED && !!online\)/)
console.log('PASS: online público; carreira, offline e basquete continuam isolados.')
