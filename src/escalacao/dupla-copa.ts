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
