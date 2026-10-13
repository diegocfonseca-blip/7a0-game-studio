// ─── 🆚 RETROSPECTO ENTRE AMIGOS + ⭐ CRAQUE DO JOGO (13/10) ───────────────────
// Diego aprovou o mockup `scripts/mockups/online-3-ideias.png` (*"pode fazer o 1 e 2"*; a copa dos campeões ele NÃO quis).
//
// 🆚 RETROSPECTO: antes da bola rolar, a linha da Rádio no placar mostra "VOCÊ × <dono do outro clube>: 1V 0E 4D" e
//    uma provocação. Só jogo de GENTE × GENTE nas salas online (rápida e Minhas Ligas), de todas as salas. O banco
//    (`docs/sql/retrospecto.sql`) guarda por PAR de contas; só o DONO da sala escreve (host-autoritativo) e cada um só
//    lê os próprios pares. É zoeira: não dá prêmio, não mexe em jogo nem ranking.
//    🙈 ANTI-SPOILER: o host só grava a rodada quando o resultado já revelou na tela; a leitura acontece quando a rodada
//    COMEÇA — então o jogo que está rolando nunca entra no número que aparece antes dele.
//    🪑 Quem é quem sai do `seatUids` (assento → conta), nunca do nome. Sala de DUPLAS fica de fora (o "VOCÊ" seria
//    ambíguo) — regra 5 do CLAUDE.md: cuidado extremo com assento.
// ⭐ CRAQUE DO JOGO: no apito, a mesma linha mostra quem mais decidiu (gol vale 3, assistência 2 — o que vale pro gol
//    vale pra assistência, regra de 19/09). Sem autor (jogador de mentira não tem súmula, regra 19/09) = sem craque.
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type Retro = { v: number; e: number; d: number }
export type JogoRetro = { a: string; b: string; ga: number; gb: number }

/** grava os jogos de gente × gente de UMA rodada (só o dono da sala consegue; o banco ignora repetição da mesma chave) */
export function gravaRetrospecto(roomId: string, chave: string, jogos: JogoRetro[]): void {
  if (!roomId || jogos.length === 0) return
  void supabase.rpc('esc_retrospecto_soma', { p_room: roomId, p_chave: chave.slice(0, 120), p_jogos: jogos.slice(0, 20) }).then(() => {}, () => {})
}

/** lê o MEU retrospecto contra cada conta da lista. `chave` muda a cada rodada → relê (poucas linhas minúsculas) */
export function useRetrospecto(eu: string | null | undefined, rivais: string[], chave: string): Record<string, Retro> {
  const [mapa, setMapa] = useState<Record<string, Retro>>({})
  const lista = rivais.filter(r => r && r !== eu).sort().join(',')
  useEffect(() => {
    if (!eu || !lista) { setMapa({}); return }
    let vivo = true
    const ids = lista.split(',')
    supabase.from('esc_retrospecto').select('a,b,vit_a,empates,vit_b').or(`and(a.eq.${eu},b.in.(${ids.join(',')})),and(b.eq.${eu},a.in.(${ids.join(',')}))`)
      .then(({ data }) => {
        if (!vivo || !Array.isArray(data)) return
        const m: Record<string, Retro> = {}
        for (const r of data as { a: string; b: string; vit_a: number; empates: number; vit_b: number }[]) {
          if (r.a === eu) m[r.b] = { v: r.vit_a, e: r.empates, d: r.vit_b }
          else m[r.a] = { v: r.vit_b, e: r.empates, d: r.vit_a }
        }
        setMapa(m)
      }, () => { /* sem rede: fica o que tinha */ })
    return () => { vivo = false }
  }, [eu, lista, chave])
  return mapa
}

const PROVOCA: Record<'primeiro' | 'freguesia' | 'dono' | 'parelho', [string, string][]> = {
  primeiro: [['Primeiro duelo entre vocês. Que comece a história!', 'First ever meeting. Let the story begin!'], ['Nunca se enfrentaram. Hoje nasce uma rivalidade.', 'Never met before. A rivalry is born today.'], ['Estreia do confronto. Quem sai na frente?', 'Debut of the matchup. Who strikes first?']],
  freguesia: [['Freguesia declarada, hein? 😏', 'This is turning into a habit, huh? 😏'], ['Tá devendo essa, viu? 👀', 'You owe this one, you know? 👀'], ['Hoje é dia de quebrar o tabu? 🔨', 'Is today the day the curse breaks? 🔨'], ['O outro lado já tá rindo à toa. 😂', 'The other side is already laughing. 😂']],
  dono: [['Freguês de carteirinha do outro lado. 😎', 'Card-carrying customer on the other side. 😎'], ['Quem manda nesse clássico é você. 👑', 'You run this derby. 👑'], ['Mais uma pro freguês? 🍽️', 'Another one for the regular? 🍽️'], ['O rival entra pra tentar a revanche. 😤', 'The rival comes in looking for revenge. 😤']],
  parelho: [['Clássico parelho. Ninguém dá mole. 🤝', 'An even derby. Nobody gives an inch. 🤝'], ['Tudo muito igual. Hoje desempata? ⚖️', 'Dead even. Does today break the tie? ⚖️'], ['Rivalidade das boas: ninguém manda em ninguém.', 'A proper rivalry: nobody owns anybody.']],
}
/** a frase do retrospecto antes da bola rolar */
export function fraseRetro(r: Retro | undefined, en: boolean, semente: number): string {
  const t = r ? r.v + r.e + r.d : 0
  const tipo = t === 0 ? 'primeiro' : r!.d >= r!.v + 2 ? 'freguesia' : r!.v >= r!.d + 2 ? 'dono' : 'parelho'
  const lista = PROVOCA[tipo]
  const par = lista[Math.abs(semente) % lista.length]
  const p = en ? par[1] : par[0]
  if (t === 0) return p
  const placar = en ? `${r!.v}W · ${r!.e}D · ${r!.d}L in ${t} ${t === 1 ? 'game' : 'games'}.` : `${r!.v}V · ${r!.e}E · ${r!.d}D em ${t} ${t === 1 ? 'jogo' : 'jogos'}.`
  return `${placar} ${p}`
}

export type GolCraque = { name: string; min: number; home: boolean; assist?: string }
/** ⭐ o craque do jogo: gol 3, assistência 2; desempata quem marcou mais e depois quem marcou primeiro. null = sem autor nenhum */
export function craqueDoJogo(gols: GolCraque[]): { name: string; home: boolean; gols: number; assist: number } | null {
  const t = new Map<string, { name: string; home: boolean; gols: number; assist: number; primeiro: number }>()
  const bom = (n?: string) => !!n && n.trim().length > 1 && !/^(gol|goal)\b/i.test(n.trim())
  for (const g of gols) {
    if (bom(g.name)) { const k = `${g.home}|${g.name}`; const x = t.get(k) ?? { name: g.name, home: g.home, gols: 0, assist: 0, primeiro: g.min }; x.gols++; t.set(k, x) }
    if (bom(g.assist)) { const k = `${g.home}|${g.assist}`; const x = t.get(k) ?? { name: g.assist!, home: g.home, gols: 0, assist: 0, primeiro: g.min }; x.assist++; t.set(k, x) }
  }
  const lista = [...t.values()].sort((a, b) => (b.gols * 3 + b.assist * 2) - (a.gols * 3 + a.assist * 2) || b.gols - a.gols || a.primeiro - b.primeiro)
  return lista[0] ? { name: lista[0].name, home: lista[0].home, gols: lista[0].gols, assist: lista[0].assist } : null
}
export function fraseCraque(c: { name: string; gols: number; assist: number }, clube: string, en: boolean): string {
  const g = c.gols ? (en ? `⚽ ${c.gols} ${c.gols === 1 ? 'goal' : 'goals'}` : `⚽ ${c.gols} ${c.gols === 1 ? 'gol' : 'gols'}`) : ''
  const a = c.assist ? (en ? `🅰️ ${c.assist} ${c.assist === 1 ? 'assist' : 'assists'}` : `🅰️ ${c.assist} ${c.assist === 1 ? 'assistência' : 'assistências'}`) : ''
  return `${c.name} · ${clube} · ${[g, a].filter(Boolean).join(' · ')}`
}
