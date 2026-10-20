// ─── 🤝 DUPLA NAS COPAS COM CONVOCAÇÃO (Copa do Mundo da liga · copa regional) — 15/10 ────────────────────────
//
// O bug (sala do Futpoint, dupla Futpoint + Cativeiro): no Rio × SP cada um da dupla escolheu um clube, e o
// Cativeiro ainda escolheu NA VEZ DE OUTRA DUPLA (Gui|Palmolego). Causa: as copas montam "assento → pessoa" com
// TODAS as linhas do room_players, e a linha do PARCEIRO guarda um `player_index` velho (a renumeração da largada
// só mexe nos donos, de propósito). O número velho dele caía em cima do assento de outro time.
//
// Regra do Diego (15/10, mockup `scripts/mockups/dupla-convoca.png`): **só UM da dupla escolhe o clube e convoca**.
// Quem é: o que a dupla marcou na sala de espera ("🏳️ Quem escolhe o clube e convoca"), guardado na divisão das
// posições do dono (`dupla_categories.CONV`). Ninguém marcou = o DONO do assento. O outro assiste, com o aviso de
// quem está convocando. Uma função só serve as duas copas — tela e dono da sala nunca discordam.
export const DUPLA_CONVOCA = 'CONV'

export interface LinhaDuplaCopa {
  user_id: string
  player_index: number
  manager_name?: string
  dupla_partner_of?: string | null
  dupla_categories?: Record<string, string> | null
}

/** 🪑 assento (id do técnico) → a PESSOA que age por ele nas copas. Linha de parceiro nunca vira assento. */
export function quemAgePorAssento(linhas: LinhaDuplaCopa[]): Map<number, string> {
  const m = new Map<number, string>()
  const presente = new Set(linhas.map(l => l.user_id))
  // donos primeiro (linha sem `dupla_partner_of`): o número deles é o oficial
  for (const l of linhas) {
    if (l.dupla_partner_of) continue
    const par = linhas.find(p => p.dupla_partner_of === l.user_id && p.user_id !== l.user_id)
    const conv = l.dupla_categories?.[DUPLA_CONVOCA]
    m.set(l.player_index, par && conv === par.user_id ? par.user_id : l.user_id)
  }
  // 🛟 parceiro ÓRFÃO (o dono saiu): vira dono do próprio time, mas NUNCA por cima de um assento já ocupado
  for (const l of linhas) {
    if (!l.dupla_partner_of || presente.has(l.dupla_partner_of)) continue
    if (!m.has(l.player_index)) m.set(l.player_index, l.user_id)
  }
  return m
}

/** 👥 a minha dupla nas copas: quem age por ela (`age`) e o outro (`outro`). `null` = não estou em dupla. */
export function minhaDuplaNaCopa(linhas: LinhaDuplaCopa[], meuUid?: string): { age: string; outro: string; nomeAge: string; nomeOutro: string } | null {
  if (!meuUid) return null
  const eu = linhas.find(l => l.user_id === meuUid)
  if (!eu) return null
  const dono = eu.dupla_partner_of ? linhas.find(l => l.user_id === eu.dupla_partner_of && !l.dupla_partner_of) : eu
  if (!dono) return null
  const par = linhas.find(p => p.dupla_partner_of === dono.user_id && p.user_id !== dono.user_id)
  if (!par) return null
  const age = quemAgePorAssento(linhas).get(dono.player_index) ?? dono.user_id
  const outro = age === dono.user_id ? par.user_id : dono.user_id
  const nome = (uid: string) => (linhas.find(l => l.user_id === uid)?.manager_name ?? '').replace(/\p{Extended_Pictographic}|️/gu, '').trim()
  return { age, outro, nomeAge: nome(age), nomeOutro: nome(outro) }
}

/** 🏷️ a dupla de um ASSENTO, pra fila mostrar "Fulano escolhe · Ciclano assiste". `null` = time de uma pessoa só. */
export function duplaDoAssento(linhas: LinhaDuplaCopa[], assento: number): { nomeAge: string; nomeOutro: string } | null {
  const dono = linhas.find(l => l.player_index === assento && !l.dupla_partner_of)
  if (!dono) return null
  const d = minhaDuplaNaCopa(linhas, dono.user_id)
  return d ? { nomeAge: d.nomeAge, nomeOutro: d.nomeOutro } : null
}

// ─── 🪑 PELO ESTADO DA PARTIDA, NÃO PELO NÚMERO DO BANCO (20/10, sala ZESM9K do Futpoint) ─────────────────────────
// Reclamação das duplas: *"tava convocando de outro país, jogando outro que não escolheu"*. Causa: as funções de cima
// acham o time de cada pessoa pelo `player_index` da linha no banco. Mas quem decide o assento é a LARGADA (`seatUids`
// no estado) — e numa dupla CRUZADA (os dois apontando um pro outro, que desde 19/10 viram UMA dupla) a renumeração do
// banco pulava os dois: o Bonança ficou com o número 5 no banco sendo o time 3 no jogo. Resultado: o número velho caía
// no time de OUTRA pessoa, e a escolha de um ia pra seleção do outro.
// A regra: com o estado da partida na mão, o assento sai do `seatUids` e a dupla do `duplas` (os MESMOS que o leilão
// usa). Quem age pela dupla segue a mesma régua do leilão (`duplaPodeAgir`): se um saiu de verdade, quem ficou; senão
// quem a dupla marcou pra convocar (`CONV`); senão o dono.
export interface DuplaDoEstado { ownerUid: string; ownerName?: string; partnerUid?: string; partnerName?: string; cats?: Partial<Record<string, string>>; soloUid?: string }

const quemAgeNaDupla = (d: DuplaDoEstado | undefined, dono: string): string =>
  !d?.partnerUid ? dono : d.soloUid ? d.soloUid : (d.cats?.[DUPLA_CONVOCA] ?? dono)

/** 🪑 assento → quem age por ele, pelo ESTADO da partida. `null` = estado sem o mapa (versão velha) → usa o do banco. */
export function quemAgePeloEstado(assentos: readonly string[] | undefined, duplas: Record<number, DuplaDoEstado> | undefined): Map<number, string> | null {
  if (!Array.isArray(assentos) || assentos.length === 0) return null
  const m = new Map<number, string>()
  assentos.forEach((dono, i) => { if (dono) m.set(i, quemAgeNaDupla(duplas?.[i], dono)) })
  return m
}

/** 👥 a minha dupla, pelo estado da partida. `null` = não estou em dupla (ou o estado não tem o mapa). */
export function minhaDuplaPeloEstado(assentos: readonly string[] | undefined, duplas: Record<number, DuplaDoEstado> | undefined, meuUid?: string): { age: string; outro: string; nomeAge: string; nomeOutro: string } | null {
  if (!meuUid || !Array.isArray(assentos) || !duplas) return null
  const i = assentos.findIndex((dono, k) => dono === meuUid || duplas[k]?.partnerUid === meuUid)
  if (i < 0) return null
  const d = duplas[i]
  if (!d?.partnerUid) return null
  const dono = assentos[i]
  const age = quemAgeNaDupla(d, dono)
  const outro = age === dono ? d.partnerUid : dono
  const limpa = (s?: string) => (s ?? '').replace(/\p{Extended_Pictographic}|️/gu, '').trim()
  const nome = (uid: string) => limpa(uid === d.ownerUid ? d.ownerName : uid === d.partnerUid ? d.partnerName : '')
  return { age, outro, nomeAge: nome(age), nomeOutro: nome(outro) }
}

/** 🏷️ a dupla de um assento pelo estado (pra fila: "Fulano escolhe · Ciclano assiste"). */
export function duplaDoAssentoPeloEstado(assentos: readonly string[] | undefined, duplas: Record<number, DuplaDoEstado> | undefined, assento: number): { nomeAge: string; nomeOutro: string } | null {
  const dono = assentos?.[assento]
  if (!dono) return null
  const d = minhaDuplaPeloEstado(assentos, duplas, dono)
  return d ? { nomeAge: d.nomeAge, nomeOutro: d.nomeOutro } : null
}
