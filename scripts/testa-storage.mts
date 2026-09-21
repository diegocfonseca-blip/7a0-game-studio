// 🧪 TRAVA DO ARMAZENAMENTO — o login não pode morrer por falta de espaço
//
// Nasceu do bug do Neymarzetti (21/09): armazenamento do celular cheio → a
// biblioteca de login falha no teste de escrita → guarda a sessão só na memória →
// cada reload desloga. O jogo enchia o armazenamento com o chat de cada sala,
// que nunca era apagado.
//
// O que se confere aqui, com um localStorage FALSO de cota limitada:
//   ① a limpeza apaga SÓ chat de sala velha — nunca a sala atual, nunca save,
//     nunca cofre, nunca login;
//   ② com o lixo apagado, o mesmo teste de escrita que a biblioteca faz passa;
//   ③ o teste de escrita distingue "cheio" de "bloqueado".
//
// Rodar:  npx tsx scripts/testa-storage.mts

let erros = 0
const ok = (cond: boolean, msg: string) => { console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) erros++ }

// ── localStorage de mentira, com cota em caracteres ──────────────────────────
class QuotaExceededError extends Error { name = 'QuotaExceededError' }
function fakeStorage(cota: number) {
  const m = new Map<string, string>()
  const tamanho = () => [...m.entries()].reduce((s, [k, v]) => s + k.length + v.length, 0)
  const st = {
    get length() { return m.size },
    key: (i: number) => [...m.keys()][i] ?? null,
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => {
      const atual = m.get(k)
      const depois = tamanho() - (atual ? k.length + atual.length : 0) + k.length + v.length
      if (depois > cota) throw new QuotaExceededError('quota')
      m.set(k, v)
    },
    removeItem: (k: string) => { m.delete(k) },
    clear: () => m.clear(),
    _tamanho: tamanho,
  }
  return st
}

const g = globalThis as unknown as { localStorage: unknown }

console.log('1) a limpeza só tira chat de sala VELHA')
{
  const ls = fakeStorage(100_000)
  g.localStorage = ls
  const { limpaChatsVelhos, medeStorage } = await import('../src/storage-guard')
  ls.setItem('escalacao-room', 'SALA-ATUAL')
  ls.setItem('esc-room-owner', 'SALA-DONO')
  ls.setItem('esc-chat-SALA-ATUAL', 'x'.repeat(500))
  ls.setItem('esc-lobbychat-SALA-DONO', 'x'.repeat(500))
  for (let i = 0; i < 30; i++) { ls.setItem(`esc-chat-velha${i}`, 'x'.repeat(800)); ls.setItem(`esc-lobbychat-velha${i}`, 'x'.repeat(800)) }
  ls.setItem('esc-solo-career', 'S'.repeat(5000))
  ls.setItem('esc-career-vault::outra-conta', 'V'.repeat(3000))
  ls.setItem('sb-faab-auth-token', '{"access_token":"a"}')
  ls.setItem('esc-had-login', '1')
  const antes = medeStorage()
  const n = limpaChatsVelhos()
  ok(n === 60, `apagou as 60 chaves de chat de salas velhas (apagou ${n})`)
  ok(ls.getItem('esc-chat-SALA-ATUAL') !== null && ls.getItem('esc-lobbychat-SALA-DONO') !== null, 'o chat da sala ATUAL (e da sala de que sou dono) fica')
  ok(ls.getItem('esc-solo-career') !== null && ls.getItem('esc-career-vault::outra-conta') !== null, 'save e cofre de outra conta NUNCA são tocados')
  ok(ls.getItem('sb-faab-auth-token') !== null && ls.getItem('esc-had-login') !== null, 'login e marcador de login ficam')
  const depois = medeStorage()
  ok(depois.chaves === antes.chaves - 60 && depois.usadoKB < antes.usadoKB, `a medição enxerga a diferença (${antes.usadoKB} KB → ${depois.usadoKB} KB)`)
}

console.log('2) armazenamento CHEIO: o teste de escrita falha, a limpeza destrava')
{
  const ls = fakeStorage(20_000)
  g.localStorage = ls
  const { testaEscrita, guardaStorage } = await import('../src/storage-guard')
  ls.setItem('escalacao-room', 'ATUAL')
  ls.setItem('esc-chat-ATUAL', 'x'.repeat(1000))
  ls.setItem('esc-solo-career', 'S'.repeat(8000))
  // enche até a borda com chats velhos — em blocos cada vez menores, até não
  // caber NEM UM caractere (é assim que o armazenamento cheio de verdade fica)
  let i = 0
  for (const bloco of [900, 90, 9, 1]) {
    try { while (true) { ls.setItem(`esc-chat-velha${i++}`, 'x'.repeat(bloco)) } } catch { /* cheio neste tamanho, tenta menor */ }
  }
  ok(testaEscrita() === 'cheio', 'com o armazenamento na borda, o teste de escrita diz CHEIO (o mesmo que a biblioteca do login vê)')
  const r = guardaStorage()
  ok(r.apagadas > 0, `a guarda apagou ${r.apagadas} chats velhos`)
  ok(r.escrita === 'ok', 'e depois da limpeza a escrita volta a funcionar — o login volta a ser gravado')
  ok(ls.getItem('esc-solo-career') !== null && ls.getItem('esc-chat-ATUAL') !== null, 'save e chat da sala atual continuam lá')
}

console.log('3) armazenamento BLOQUEADO (aba privada etc.) não é confundido com cheio')
{
  g.localStorage = { get length() { throw new Error('SecurityError') }, key() { throw new Error('SecurityError') }, getItem() { throw new Error('SecurityError') }, setItem() { throw new Error('SecurityError') }, removeItem() { throw new Error('SecurityError') } }
  const { testaEscrita, limpaChatsVelhos } = await import('../src/storage-guard')
  ok(testaEscrita() === 'bloqueado', 'setItem que falha sem ser cota → BLOQUEADO')
  ok(limpaChatsVelhos() === 0, 'e a limpeza não explode: devolve 0')
}

console.log(erros ? `\n❌ ${erros} problema(s)` : '\n✅ tudo certo')
process.exit(erros ? 1 : 0)
