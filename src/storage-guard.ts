// ─── 🧹 GUARDA DO ARMAZENAMENTO — roda ANTES de tudo ─────────────────────────
//
// 🐛 O BUG (Diego, 21/09, sala JCQO35 do Neymarzetti): *"quando eu entro numa sala
// e atualizo a página tá me desligando… quando atualizo não desliga em qualquer
// área do site, mas quando entro numa sala e atualizo tá desligando"*.
//
// 🔍 O QUE OS LOGS MOSTRARAM: a conta dele fez 8 logins em 11 minutos, o servidor
// NUNCA recusou nem revogou nada, e no reload o celular não fez NENHUMA chamada de
// auth — abriu sem sessão nenhuma. Ou seja: o login existia só na MEMÓRIA da
// página. É exatamente o que a biblioteca de login faz quando o armazenamento
// do navegador está CHEIO: ao criar o cliente ela faz um teste de escrita no
// localStorage (`supportsLocalStorage()` em @supabase/auth-js); se o `setItem`
// estoura a cota, ela desiste do localStorage pela página inteira e guarda a
// sessão na memória → funciona enquanto a página vive e morre no reload.
//
// 🗑️ E O QUE ENCHE: o jogo guarda o chat de CADA sala (`esc-chat-<id>` e
// `esc-lobbychat-<id>`, 60 mensagens cada) e nunca apagava nenhum — meses de
// salas viram centenas de chaves mortas. Somado ao save da carreira (que é
// grande) e ao cofre de carreiras por conta, o Android chega no limite.
//
// ✅ O CONSERTO, em duas pernas:
//   1. Este arquivo é o PRIMEIRO import do `main.tsx` — então roda antes de o
//      cliente do Supabase nascer e fazer o teste dele. Aqui a gente apaga os
//      chats de salas que não são a atual (lixo puro) e libera espaço.
//   2. A faixa "sua sessão caiu" (index.tsx) agora TESTA a escrita e, se o
//      armazenamento estiver cheio, diz isso com todas as letras e dá o botão
//      de liberar espaço — em vez de só mandar a pessoa logar de novo, que é o
//      que ela já vinha fazendo 8 vezes.
//
// 🛡️ O que este arquivo NUNCA apaga: save de carreira, arquivo de carreiras,
// cofre de outras contas, login, preferências. Só chat de sala velha.

const CHAT_PREFIXOS = ['esc-chat-', 'esc-lobbychat-'] as const
/** chaves que dizem qual é a sala ATUAL (o chat dela fica) */
const CHAVES_SALA_ATUAL = ['escalacao-room', 'esc-room-owner'] as const

export type ProbeStorage = {
  /** 'ok' escreve normal · 'cheio' estourou a cota · 'bloqueado' o navegador não deixa nem ler */
  escrita: 'ok' | 'cheio' | 'bloqueado'
  usadoKB: number
  chaves: number
  /** as 5 maiores chaves, pra diagnóstico (nome + KB) */
  maiores: { chave: string; kb: number }[]
}

/** mede quanto o site já ocupa (aproximado: 2 bytes por caractere, como o Chrome conta) */
export function medeStorage(): Pick<ProbeStorage, 'usadoKB' | 'chaves' | 'maiores'> {
  const itens: { chave: string; kb: number }[] = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k == null) continue
      const v = localStorage.getItem(k) ?? ''
      itens.push({ chave: k, kb: Math.round(((k.length + v.length) * 2) / 1024 * 10) / 10 })
    }
  } catch { /* bloqueado: devolve o que deu */ }
  const usadoKB = Math.round(itens.reduce((s, x) => s + x.kb, 0))
  return { usadoKB, chaves: itens.length, maiores: [...itens].sort((a, b) => b.kb - a.kb).slice(0, 5) }
}

/** o MESMO teste que a biblioteca de login faz: escreve e apaga uma chave */
export function testaEscrita(): ProbeStorage['escrita'] {
  const k = `esc-teste-escrita-${Math.random()}`
  try {
    localStorage.setItem(k, k)
    localStorage.removeItem(k)
    return 'ok'
  } catch (e) {
    const nome = (e as { name?: string } | null)?.name ?? ''
    // QuotaExceededError (Chrome/Firefox) · NS_ERROR_DOM_QUOTA_REACHED (Firefox velho)
    if (/quota/i.test(nome) || /quota/i.test(String(e))) return 'cheio'
    try { localStorage.getItem('x'); return 'cheio' } catch { return 'bloqueado' }
  }
}

/** apaga o chat de toda sala que NÃO é a atual. Devolve quantas chaves foram. */
export function limpaChatsVelhos(): number {
  let atuais: string[] = []
  try { atuais = CHAVES_SALA_ATUAL.map(k => localStorage.getItem(k) ?? '').filter(Boolean) } catch { return 0 }
  const lixo: string[] = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k) continue
      const pref = CHAT_PREFIXOS.find(p => k.startsWith(p))
      if (!pref) continue
      const id = k.slice(pref.length)
      if (atuais.includes(id)) continue
      lixo.push(k)
    }
  } catch { return 0 }
  let n = 0
  for (const k of lixo) { try { localStorage.removeItem(k); n++ } catch { /* segue */ } }
  return n
}

// 🗄️ 21/11 (noite, celular do Diego CHEIO de novo: 10 MB, login caindo a cada reload e carreira nova sem conseguir gravar).
// Quando outra conta entra no aparelho, as carreiras da conta anterior vão pro COFRE dela (`esc-career-vault::<conta>`). Quando a
// conta VOLTA, o cofre é copiado de volta pro lugar de sempre — e ficava lá pra sempre, DUPLICADO (no aparelho dele: 1,9 MB mortos).
// Aqui a gente apaga só essa cópia morta: o cofre da conta que É a dona atual do aparelho, e só se tudo que ele guarda está vivo
// no lugar de sempre. Cofre de OUTRA conta nunca é tocado (é a única cópia das carreiras dela neste aparelho).
const COFRE_PREFIXO = 'esc-career-vault::'
const DONO_DO_APARELHO = 'esc-career-owner'
const CHAVES_DE_CARREIRA = ['esc-solo-career', 'esc-solo-career-at', 'esc-career-archive', 'esc-solo-inprogress-v1'] as const
/** apaga o cofre DUPLICADO da conta dona do aparelho. Devolve quantos KB liberou (0 = nada a fazer / não era seguro). */
export function limpaCofreDoDono(): number {
  try {
    const dono = localStorage.getItem(DONO_DO_APARELHO)
    if (!dono) return 0
    const chave = COFRE_PREFIXO + dono
    const cru = localStorage.getItem(chave)
    if (!cru) return 0
    let cofre: Record<string, string | null> | null = null
    try { cofre = JSON.parse(cru) as Record<string, string | null> } catch { return 0 } // cofre ilegível: não mexe
    if (!cofre || typeof cofre !== 'object') return 0
    // 🛡️ só é cópia morta se CADA coisa guardada nele existe viva no aparelho; faltou uma, o cofre pode ser a única cópia → fica
    for (const k of CHAVES_DE_CARREIRA) { if (cofre[k] != null && localStorage.getItem(k) == null) return 0 }
    localStorage.removeItem(chave)
    return Math.round(((chave.length + cru.length) * 2) / 1024)
  } catch { return 0 }
}

/** a rodada completa: limpa o lixo e mede. Chamada no boot e pelo botão da faixa. */
export function guardaStorage(): ProbeStorage & { apagadas: number; cofreKB: number } {
  const apagadas = limpaChatsVelhos()
  const cofreKB = limpaCofreDoDono()
  const escrita = testaEscrita()
  return { escrita, apagadas, cofreKB, ...medeStorage() }
}

// 🚀 roda no import — antes do cliente do Supabase (ordem dos imports do main.tsx)
try {
  const r = guardaStorage()
  if (r.escrita !== 'ok' || r.apagadas > 0 || r.cofreKB > 0) {
    // só console: quem joga não precisa ver; quem investiga (DevTools) precisa
    console.warn(`[storage-guard] escrita=${r.escrita} · ${r.usadoKB} KB em ${r.chaves} chaves · chats de sala apagados: ${r.apagadas} · cofre duplicado liberado: ${r.cofreKB} KB`)
  }
} catch { /* nunca derruba o boot */ }
