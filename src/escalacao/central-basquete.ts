// ─── 🏀 O MARTELO DA CENTRAL — a redação do BASQUETE (15/11) ─────────────────
//
// A Central da carreira do basquete usa a MESMA tela da Central do futebol
// (`central.tsx`); só a redação muda, porque basquete não tem empate, gol nem
// Série — tem vitória/derrota, pontos por jogo e cestinha.
//
// Regras da casa (iguais às de `central-noticias.ts`):
//  · 🙈 ANTI-SPOILER: quem chama só passa jogo JÁ revelado.
//  · 🚫 NADA INVENTADO: toda frase sai de um número real.
//  · 🌐 PT e EN juntos. Nome de jogador e de time NUNCA se traduz.
//  · Sem estado, sem React, sem sorteio (mesma entrada = mesma edição).

import type { Jornal, Noticia } from './central-noticias'

export type TimeBB = { name: string; w: number; l: number; gf: number; ga: number; you: boolean }
export type JogoBB = { h: string; a: string; hg: number; ag: number }
export type EntradaBB = {
  jogo: number
  total: number
  liga: [string, string]
  /** a tabela da liga, já ordenada */
  tabela: TimeBB[]
  /** os jogos do último jogo da rodada já revelada */
  ultimos: JogoBB[]
  /** cestinhas (pontos na temporada), já ordenados */
  cestinhas: { name: string; team: string; pts: number; you: boolean }[]
  /** o mais caro do pregão desta temporada */
  maisCaro: { name: string; team: string; paid: number; you: boolean } | null
}

const ord = (n: number) => `${n}º`
const ordEn = (n: number) => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`
const vd = (t: TimeBB) => `${t.w}-${t.l}`
const media = (x: number, j: number) => (j > 0 ? Math.round((x / j) * 10) / 10 : 0)

export function redacaoBasquete(e: EntradaBB): Jornal {
  const t = e.tabela
  if (!t.length || e.jogo < 1) return { manchete: null, noticias: [] }
  const fila: { pri: number; n: Noticia }[] = []
  const push = (n: Noticia, pri = 5) => fila.push({ pri, n })
  const lider = t[0], vice = t[1]
  const eu = t.find(x => x.you)
  const minhaPos = eu ? t.indexOf(eu) + 1 : 0
  const [ligaPt, ligaEn] = e.liga

  // 📰 MANCHETE: quem manda na liga
  let manchete: Jornal['manchete']
  if (eu && minhaPos === 1) {
    const folga = vice ? eu.w - vice.w : 0
    manchete = {
      pt: `${eu.name} lidera a ${ligaPt} com ${vd(eu)}`,
      en: `${eu.name} top the ${ligaEn} at ${vd(eu)}`,
      sub: [folga > 0 ? `${folga} vitória${folga > 1 ? 's' : ''} de vantagem pro ${vice.name}` : `${vice?.name ?? ''} vem colado, com a mesma campanha`,
        folga > 0 ? `${folga} win${folga > 1 ? 's' : ''} clear of ${vice.name}` : `${vice?.name ?? ''} are level on record`],
    }
  } else {
    manchete = {
      pt: `${lider.name} manda na ${ligaPt}: ${vd(lider)}`,
      en: `${lider.name} rule the ${ligaEn}: ${vd(lider)}`,
      sub: eu ? [`Você é o ${ord(minhaPos)}, com ${vd(eu)} — ${lider.w - eu.w} vitória${lider.w - eu.w === 1 ? '' : 's'} atrás do líder`,
        `You are ${ordEn(minhaPos)} at ${vd(eu)} — ${lider.w - eu.w} win${lider.w - eu.w === 1 ? '' : 's'} behind the leader`] : ['', ''],
    }
  }

  // 🧾 a sua campanha (sempre primeiro)
  if (eu) {
    const pj = eu.w + eu.l
    push({ emoji: '🏀', pt: `${eu.name}: ${vd(eu)}, ${media(eu.gf, pj)} pontos por jogo e ${media(eu.ga, pj)} sofridos`, en: `${eu.name}: ${vd(eu)}, ${media(eu.gf, pj)} points per game, ${media(eu.ga, pj)} allowed`, tag: ['seu time', 'your team'] }, 1)
  }

  // 💥 o maior atropelo da última noite
  const blow = [...e.ultimos].sort((x, y) => Math.abs(y.hg - y.ag) - Math.abs(x.hg - x.ag))[0]
  if (blow && Math.abs(blow.hg - blow.ag) >= 15) {
    const [v, p, gv, gp] = blow.hg > blow.ag ? [blow.h, blow.a, blow.hg, blow.ag] : [blow.a, blow.h, blow.ag, blow.hg]
    push({ emoji: '💥', pt: `${v} atropelou ${p}: ${gv} × ${gp}`, en: `${v} blew out ${p}: ${gv}–${gp}`, tag: ['atropelo', 'blowout'] }, 3)
  }
  // ⏱️ o jogo decidido no detalhe
  const perto = e.ultimos.filter(j => Math.abs(j.hg - j.ag) <= 3).sort((x, y) => Math.abs(x.hg - x.ag) - Math.abs(y.hg - y.ag))[0]
  if (perto) {
    const [v, p, gv, gp] = perto.hg > perto.ag ? [perto.h, perto.a, perto.hg, perto.ag] : [perto.a, perto.h, perto.ag, perto.hg]
    push({ emoji: '⏱️', pt: `No detalhe: ${v} ${gv} × ${gp} ${p}`, en: `Down to the wire: ${v} ${gv}–${gp} ${p}`, tag: ['no estouro', 'buzzer'] }, 4)
  }

  // 🎯 cestinha da liga
  const c = e.cestinhas[0]
  if (c && c.pts > 0) push({ emoji: '🎯', pt: `Cestinha da liga: ${c.name} (${c.team}), ${c.pts} pontos — ${media(c.pts, e.jogo)} por jogo`, en: `League top scorer: ${c.name} (${c.team}), ${c.pts} points — ${media(c.pts, e.jogo)} per game`, tag: ['cestinha', 'scoring'] }, c.you ? 2 : 4)
  const meu = e.cestinhas.find(x => x.you)
  if (meu && meu !== c) push({ emoji: '🔥', pt: `Seu cestinha: ${meu.name}, ${meu.pts} pontos na temporada`, en: `Your top scorer: ${meu.name}, ${meu.pts} points this season`, tag: ['seu time', 'your team'] }, 2)

  // 🛡️ melhor ataque e melhor defesa (por jogo)
  const pj = (x: TimeBB) => Math.max(1, x.w + x.l)
  const atk = [...t].sort((x, y) => y.gf / pj(y) - x.gf / pj(x))[0]
  const def = [...t].sort((x, y) => x.ga / pj(x) - y.ga / pj(y))[0]
  if (atk) push({ emoji: '🚀', pt: `Melhor ataque: ${atk.name}, ${media(atk.gf, pj(atk))} pontos por jogo`, en: `Best offense: ${atk.name}, ${media(atk.gf, pj(atk))} points per game`, tag: ['ataque', 'offense'] }, 6)
  if (def) push({ emoji: '🧱', pt: `Melhor defesa: ${def.name}, só ${media(def.ga, pj(def))} sofridos por jogo`, en: `Best defense: ${def.name}, only ${media(def.ga, pj(def))} allowed per game`, tag: ['defesa', 'defense'] }, 6)

  // 🪫 o lanterna
  const ult = t[t.length - 1]
  if (ult && ult.w + ult.l >= 5) push({ emoji: '🪫', pt: `${ult.name} é o lanterna: ${vd(ult)}`, en: `${ult.name} prop up the table: ${vd(ult)}`, tag: ['lanterna', 'bottom'] }, 7)

  // 💰 o mais caro do pregão
  if (e.maisCaro) push({ emoji: '💰', pt: `${e.maisCaro.name} foi o mais caro do pregão: 🪙 ${e.maisCaro.paid} pro ${e.maisCaro.team}`, en: `${e.maisCaro.name} was the priciest buy: 🪙 ${e.maisCaro.paid} to ${e.maisCaro.team}`, tag: ['mercado', 'market'] }, 8)

  // 🗓️ quanto falta
  const faltam = e.total - e.jogo
  if (faltam > 0 && faltam <= 10) push({ emoji: '🗓️', pt: `Faltam ${faltam} jogo${faltam > 1 ? 's' : ''} pro fim da temporada regular`, en: `${faltam} game${faltam > 1 ? 's' : ''} left in the regular season`, tag: ['reta final', 'home stretch'] }, 3)

  const noticias = fila.sort((a, b) => a.pri - b.pri).slice(0, 9).map(x => x.n)
  return { manchete, noticias }
}
