// 🔜 "NÃO SAI, AINDA TEM COMPETIÇÃO" (Diego 13/10, mockup `scripts/mockups/proxima-competicao.png`,
// "Perfeito. Pode fazer. E serve pra todas competições que tem convocação").
// O problema, nas palavras dele: *"a gente chega nessa área e não sabe que tem outra competição
// e sai antes disso... e aí chega na hora de escolher o time a pessoa já saiu"*.
//   1) FAIXA nas últimas rodadas da liga: "Depois da liga: <competição>".
//   2) NÃO SAI no portão da competição: "você é o Nº, sua vez em ~X min".
//   3) CHAMA NA VEZ: vibra, apita (se o som estiver ligado), muda o título da aba e abre um
//      cartão grande "Sua vez de escolher!" — também quando abre a convocação dos 11.
// ⚠️ Só aviso: nenhuma regra, tempo ou ordem muda, e nada daqui manda mensagem pelo canal.
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { tr, getLang } from './lang'
import { playWhistle } from './sound'
import { COPAS_REGIONAIS, type CopaRegionalId } from './copa-regional'

const INK = '#0C0C0C'
const GOLD = '#FFC400'
const GREEN = '#1B7A3D'
const RED = '#C2452F'
const OSWALD = { fontFamily: 'Oswald, sans-serif' }

export const RODADAS_DO_AVISO = 5

/** marcas da SALA (não estão no estado do jogo): Copa do Mundo e Copa regional depois da liga.
 *  Uma leitura só, e só quando `ativo` (as últimas rodadas) — não lê nada no resto da liga. */
export function useCopasDaSala(roomId: string | null | undefined, ativo: boolean) {
  const [r, setR] = useState<{ mundo: boolean; regional: CopaRegionalId | null } | null>(null)
  useEffect(() => {
    if (!ativo || !roomId || r) return
    let vivo = true
    void supabase.from('game_rooms').select('flag:game_state->>mundoNaLiga, reg:game_state->>regionalNaLiga').eq('id', roomId).maybeSingle()
      .then(({ data }) => {
        if (!vivo) return
        const d = data as { flag?: string; reg?: string } | null
        const reg = d?.reg && d.reg in COPAS_REGIONAIS ? d.reg as CopaRegionalId : null
        setR({ mundo: String(d?.flag) === 'true', regional: reg })
      }, () => {})
    return () => { vivo = false }
  }, [ativo, roomId, r])
  return r
}

export type ProximaCompeticao = { emoji: string; nome: string; quem: string }

export function proximasCompeticoes(copaMode: string | undefined, sala: { mundo: boolean; regional: CopaRegionalId | null } | null): ProximaCompeticao[] {
  const en = getLang() === 'en'
  const out: ProximaCompeticao[] = []
  if (copaMode === 'liga_copa') out.push({ emoji: '🏆', nome: tr('Copa dos 8', 'Cup of 8'), quem: tr('os 8 primeiros jogam', 'the top 8 play') })
  if (copaMode === 'liga_liberta') out.push({ emoji: '🌎', nome: 'Libertadores', quem: tr('os 8 primeiros jogam', 'the top 8 play') })
  if (copaMode === 'liga_champions') out.push({ emoji: '⭐', nome: 'Champions League', quem: tr('os primeiros da liga jogam', 'the top of the league play') })
  if (sala?.mundo) out.push({ emoji: '🌐', nome: tr('Copa do Mundo', 'World Cup'), quem: tr('todo mundo escolhe seleção e convoca', 'everyone picks a nation and calls up') })
  if (sala?.regional) {
    const c = COPAS_REGIONAIS[sala.regional]
    out.push({ emoji: c.emoji, nome: en ? c.nomeEn : c.nome, quem: tr('os primeiros escolhem clube e convocam', 'the top teams pick a club and call up') })
  }
  return out
}

/** 1) a faixa das últimas rodadas da liga */
export function FaixaProximaCompeticao({ lista }: { lista: ProximaCompeticao[] }) {
  if (!lista.length) return null
  const nomes = lista.map(c => c.nome).join(' + ')
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', background: GOLD, color: INK, border: '3px solid #000', borderRadius: 14, boxShadow: '4px 4px 0 0 #000', padding: '9px 12px' }}>
      <span style={{ fontSize: 30, lineHeight: 1, flexShrink: 0 }}>{lista[0].emoji}</span>
      <div style={{ minWidth: 0 }}>
        <p style={{ ...OSWALD, fontWeight: 900, fontSize: 17, lineHeight: 1.1, textTransform: 'uppercase', margin: 0 }}>{tr('Depois da liga', 'After the league')}: {nomes}</p>
        <p style={{ fontSize: 12.5, fontWeight: 700, margin: '2px 0 0', lineHeight: 1.3 }}>{lista.map(c => c.quem).join(' · ')}. {tr('Fica até o fim!', 'Stay till the end!')}</p>
      </div>
    </div>
  )
}

/** 2) "Não sai! Você joga" — no portão, pra quem está na fila e ainda não escolheu.
 *  `antes` = quantos escolhem antes de mim e ainda não escolheram (inclui quem está na vez).
 *  `fase` = a fase do portão: antes de abrir (null) não dá pra estimar tempo. */
export function NaoSai({ minhaVez, antes, fase, seg, segPorVez }: { minhaVez: number; antes: number; fase: string | null | undefined; seg: number; segPorVez: number }) {
  const en = getLang() === 'en'
  const estimado = fase === 'bandeira' ? Math.max(0, seg) + Math.max(0, antes - 1) * segPorVez
    : fase === 'aviso' ? Math.max(0, seg) + antes * segPorVez : null
  const min = estimado == null ? 0 : Math.max(1, Math.round(estimado / 60))
  const quando = estimado == null ? '' : (fase === 'bandeira' && antes <= 1) ? tr(' Você é o próximo!', ' You are next!') : en ? ` Your turn in ~${min} min.` : ` Sua vez em ~${min} min.`
  return (
    <div style={{ background: RED, color: '#fff', border: '3px solid #000', borderRadius: 14, boxShadow: '3px 3px 0 0 #000', padding: '9px 12px', margin: '0 0 10px' }}>
      <p style={{ ...OSWALD, fontWeight: 900, fontSize: 20, textTransform: 'uppercase', margin: 0, lineHeight: 1.1 }}>⏳ {tr('Não sai! Você joga', "Don't leave! You're in")}</p>
      <p style={{ fontSize: 12.5, fontWeight: 700, margin: '3px 0 0', lineHeight: 1.35 }}>
        {en ? `You pick ${ordinalEn(minhaVez)}.` : `Você é o ${minhaVez}º a escolher.`}{quando}
      </p>
    </div>
  )
}
const ordinalEn = (n: number) => `${n}${n % 10 === 1 && n % 100 !== 11 ? 'st' : n % 10 === 2 && n % 100 !== 12 ? 'nd' : n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th'}`

/** 3) chama na vez: dispara UMA vez quando `chave` passa a existir (ex.: 'vez', 'convoca').
 *  Vibra, apita (o apito respeita o mudo do jogo), troca o título da aba enquanto durar e
 *  devolve se o cartão grande está aberto. */
export function useChamaNaVez(chave: string | null) {
  const [aberto, setAberto] = useState<string | null>(null)
  const ultima = useRef<string | null>(null)
  useEffect(() => {
    if (!chave) { ultima.current = null; setAberto(null); return }
    if (ultima.current === chave) return
    ultima.current = chave
    setAberto(chave)
    try { navigator.vibrate?.([220, 120, 220, 120, 320]) } catch { /* ignora */ }
    try { playWhistle() } catch { /* ignora */ }
    const titulo = document.title
    document.title = tr('⚠️ SUA VEZ! · Leilão Legends', '⚠️ YOUR TURN! · Leilão Legends')
    return () => { document.title = titulo }
  }, [chave])
  return { aberto, fechar: () => setAberto(null) }
}

export function CartaoSuaVez({ titulo, texto, botao, aoFechar }: { titulo: string; texto: string; botao: string; aoFechar: () => void }) {
  return (
    <div onClick={aoFechar} style={{ position: 'fixed', inset: 0, zIndex: 100002, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: GOLD, color: INK, border: '4px solid #000', borderRadius: 22, boxShadow: '6px 6px 0 0 #000', padding: '22px 18px', textAlign: 'center', width: '100%', maxWidth: 380 }}>
        <p style={{ fontSize: 54, lineHeight: 1, margin: 0 }}>📣</p>
        <p style={{ ...OSWALD, fontWeight: 900, fontSize: 34, lineHeight: 1, textTransform: 'uppercase', margin: '8px 0 0' }}>{titulo}</p>
        <p style={{ fontSize: 14, fontWeight: 700, margin: '8px 0 0', lineHeight: 1.35 }}>{texto}</p>
        <button onClick={aoFechar} style={{ ...OSWALD, marginTop: 16, width: '100%', background: GREEN, color: '#fff', border: '3px solid #000', borderRadius: 12, boxShadow: '3px 3px 0 0 #000', fontWeight: 900, fontSize: 20, padding: '10px 8px', textTransform: 'uppercase', cursor: 'pointer' }}>{botao}</button>
      </div>
    </div>
  )
}
