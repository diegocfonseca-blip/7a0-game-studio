#!/usr/bin/env node
// ─── 🔄 TRAVA: publicar NUNCA recarrega a página de ninguém sozinho (21/10) ────
//
// Ordem do Diego depois da sala de duplas do Futpoint: *"não quero mais que publicando coisa nova
// faça atualizar a página sozinho… só atualiza se ele atualizar mesmo manualmente"*.
// Antes (24/09) o pedaço que sumia recarregava a página uma vez; agora a publicação mantém os
// arquivos velhos no ar (`scripts/guarda-versao-anterior.mjs` no deploy.yml) e NADA recarrega sozinho.
//
// uso: node scripts/testa-recarga.mjs
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import vm from 'node:vm'
import assert from 'node:assert/strict'

const src = readFileSync('src/escalacao/recarga.ts', 'utf8')
const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
let recargas = 0
const contexto = { exports: {}, sessionStorage: { getItem: () => null, setItem: () => {} }, location: { reload: () => { recargas++ } } }
vm.runInNewContext(js, contexto)
const { pedaco, ehPedacoQueSumiu } = contexto.exports

const sumiu = new TypeError('Failed to fetch dynamically imported module: https://leilaolegends.com/assets/salao-AbC123.js')
assert.equal(ehPedacoQueSumiu(sumiu), true)
let subiu = 0
for (let i = 0; i < 3; i++) await pedaco(() => Promise.reject(sumiu))().catch(() => { subiu++ })
assert.equal(recargas, 0, 'o pedaço que falha NUNCA recarrega a página sozinho')
assert.equal(subiu, 3, 'o erro sobe pra tela de erro (quem atualiza é a pessoa)')
assert.equal(await pedaco(() => Promise.resolve(7))(), 7)

const idx = readFileSync('src/escalacao/index.tsx', 'utf8')
assert.ok(!/location\.reload\(\)/.test(idx.replace(/\/\/.*$/gm, '')) || /onClick/.test(idx), 'index.tsx não pode recarregar sozinho')
assert.ok(!/function VersionWatcher/.test(idx), 'o vigia de versão (atualizava sozinho na home) saiu em 21/10')
const dep = readFileSync('.github/workflows/deploy.yml', 'utf8')
assert.ok(dep.includes('guarda-versao-anterior.mjs'), 'a publicação tem que manter os arquivos da versão anterior no ar')

console.log('✅ publicar não recarrega ninguém · pedaço que falha vai pra tela de erro · deploy mantém a versão anterior no ar')
