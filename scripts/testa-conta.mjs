// Regressões sem rede: nenhuma conta criada ou senha real modificada.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
const read = path => fs.readFileSync(new URL('../' + path, import.meta.url), 'utf8')
const source = read('src/escalacao/campo-senha.tsx')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText
const context = { exports: {}, require: path => path === './lang' ? { tr: (pt) => pt } : {} }
vm.runInNewContext(compiled, context)
const validate = context.exports.erroSenhaNova
assert.match(validate('', ''), /6 caracteres/)
assert.match(validate('12345', '12345'), /6 caracteres/)
assert.equal(validate('123456', '123456'), '')
assert.match(validate('123456', ''), /não coincidem/)
assert.match(validate('abcDEF123', 'abcdef123'), /não coincidem/)
assert.match(validate(' abc123', 'abc123'), /não coincidem/)
assert.equal(validate(' senha válida 123 ', ' senha válida 123 '), '')
const conta = read('src/escalacao/conta.tsx')
const lobby = read('src/escalacao/lobby.tsx')
const screens = read('src/escalacao/screens.tsx')
const reset = read('src/escalacao/senha-nova.tsx')
assert.ok(conta.includes('supabase.auth.getSession()') && conta.includes('supabase.auth.onAuthStateChange('))
assert.ok(conta.includes('if (data.session) { onPronto(); return }'))
assert.ok(conta.includes('erroSenhaNova(senha, confirmacao)'))
assert.ok(!conta.includes('todosClubes') && !conta.includes('⋯ mais times'))
assert.ok(lobby.includes('return <JanelaConta') && !lobby.includes('supabase.auth.signUp('))
assert.ok(!screens.includes('supabase.auth.signUp(') && screens.includes('return <JanelaConta'))
assert.ok(reset.includes('erroSenhaNova(senha, confirmacao)'))
assert.ok(lobby.includes('erroSenhaNova(newPw, newPwConfirm)'))
assert.ok(!lobby.includes("setUser(u); if (u && !recoveringRef.current) setPhase('menu')"))
assert.ok(source.includes('autoComplete={nova') && source.includes("type={visivel ? 'text' : 'password'}"))
console.log('Conta: 7 cenários de senha + 10 regressões de integração OK. Sem chamadas externas.')
