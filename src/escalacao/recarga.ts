// ─── 🔄 PEDAÇO DO JOGO QUE SUMIU: recarrega UMA VEZ, em vez de cair ──────────
//
// O PROBLEMA (achado 24/09 no `esc_quedas`, o registro de quedas do banco): nos
// últimos 10 dias foram 50 quedas de tela, e **as 50** eram a mesma coisa —
// "Failed to fetch dynamically imported module …/assets/salao-XXXX.js".
//
// Por que acontece: o jogo carrega alguns pedaços SÓ NA HORA (a Loja do Clube, a
// Copa da liga). O nome do arquivo tem um código que muda a cada publicação, e a
// publicação APAGA os arquivos antigos do servidor. Quem está com o jogo ABERTO
// ficou com os nomes velhos; quando abre a Loja, o arquivo não existe mais e a
// tela cai com o "😵 Ops, algo deu errado".
//
// Quem mais sofre é exatamente quem a gente menos quer atrapalhar: o vigia de
// versão (`VersionWatcher`) só atualiza sozinho quem está na TELA INICIAL, pra
// não interromper partida — então quem está DENTRO DE UMA SALA nunca atualiza, e
// é justamente ele que quebra. Foi o que derrubou as salas do Diego em 23/09,
// numa noite com três publicações (17h38, 19h19 e 01h26).
//
// O CONSERTO: quando um pedaço falha ao carregar, a página se recarrega e a
// pessoa volta pro lugar — uma piscada de 1-2s em vez de tela quebrada.
//
// ⚠️ **UMA VEZ SÓ, E ISSO É ORDEM DO DIEGO** (24/09: *"ok mas no máximo uma vez
// hein"*). A marca fica no `sessionStorage` desta aba: se o pedaço falhar DE
// NOVO depois da recarga, não recarrega mais — aí a tela de erro aparece, que é
// o certo (se recarregasse de novo viraria um pisca-pisca infinito, e o jogador
// nunca veria o que aconteceu). A marca morre junto com a aba.
//
// 🗄️ `sessionStorage` e não `localStorage` de propósito: é por ABA, some sozinho
// e não engorda o armazenamento do aparelho — que já derrubou o login do Diego
// uma vez (ver `storage-guard.ts`).

const MARCA = 'll-recarga-pedaco'

/** já recarreguei nesta aba por causa de pedaço que sumiu? */
function jaRecarregou(): boolean {
  try { return sessionStorage.getItem(MARCA) === '1' } catch { return false }
}
function marcaRecarga(): void {
  try { sessionStorage.setItem(MARCA, '1') } catch { /* aparelho sem espaço: segue */ }
}

/** o erro é "o arquivo do pedaço sumiu"? (cada navegador escreve com uma frase) */
export function ehPedacoQueSumiu(err: unknown): boolean {
  const m = String((err as { message?: unknown })?.message ?? err ?? '').toLowerCase()
  return m.includes('dynamically imported module')   // Chrome/Edge
    || m.includes('importing a module script failed') // Safari/iOS
    || m.includes('error loading dynamically imported module')
    || m.includes('failed to fetch dynamically imported')
    || m.includes('unable to preload css')            // o CSS do mesmo pedaço
}

/**
 * Recarrega a página UMA VEZ quando o pedaço sumiu. Devolve `true` se a recarga
 * foi disparada (quem chamou não precisa fazer mais nada — a página já vai).
 */
export function recarregaUmaVez(err: unknown): boolean {
  if (!ehPedacoQueSumiu(err) || jaRecarregou()) return false
  marcaRecarga()
  try { location.reload() } catch { return false }
  return true
}

/**
 * Embrulha um `import()` de pedaço: se o arquivo sumiu (publicamos no meio),
 * recarrega a página uma vez. Se já recarregou, deixa o erro subir pra tela de
 * erro — porque aí é problema de verdade, não é publicação.
 */
export function pedaco<T>(carrega: () => Promise<T>): () => Promise<T> {
  return () => carrega().catch(err => {
    if (recarregaUmaVez(err)) return new Promise<T>(() => { /* a página já está indo embora */ })
    throw err
  })
}
