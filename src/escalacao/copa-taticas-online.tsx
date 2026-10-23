// ─── ⚔️ A TÁTICA NA SALA: Copa do Mundo e regionais (23/10) ──────────────────
// O lado do APARELHO da regra de `copa-taticas.ts`:
//   · lê do banco SÓ as linhas congeladas (`esc_copa_taticas`) a cada virada do relógio da copa;
//   · SEGURA a tela no passo anterior enquanto as táticas que decidem o jogo da vez não chegaram — assim nenhum aparelho
//     mostra um placar calculado sem elas (a espera normal é zero: as linhas congelam no apito, 5 s+ antes da bola rolar);
//   · escreve a escolha da pessoa (`esc_copa_tatica_set`) — o banco só aceita com jogo rolando, e ela vale no PRÓXIMO jogo.
// Nenhuma mensagem nova no canal da sala: é leitura/escrita direta, ~2 por jogo por pessoa.
import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { tr } from './lang'
import { TATICAS_COPA, type LinhaTatica, type TaticaCopa } from './copa-taticas'

type RowTat = { revision: number; step: number; running: boolean }
type Dado = { linhas: LinhaTatica[]; coberto: number }
/** se o banco não responder, a tela não pode ficar presa pra sempre: depois disto ela segue (só acontece em falha) */
const ESPERA_MAX_MS = 8000

export function useTaticasCopa(tipo: 'mundo' | 'regional', roomId: string, edicao: number, seed: number, row: RowTat | null | undefined, meuUid?: string) {
  const [dado, setDado] = useState<Dado | null>(null)
  const [minha, setMinha] = useState<TaticaCopa | null>(null)
  const [aviso, setAviso] = useState('')
  const pedindo = useRef(false)
  const ativo = !!row
  const ler = useCallback(async () => {
    if (pedindo.current) return
    pedindo.current = true
    try {
      const { data, error } = await supabase.rpc('esc_copa_taticas', { p_room: roomId, p_tipo: tipo, p_edicao: edicao, p_seed: seed })
      if (error || !data) return
      const d = data as { rev: number; step?: number; running?: boolean; linhas: LinhaTatica[] }
      const coberto = d.rev < 0 || d.step == null ? -1 : d.running ? d.step - 1 : d.step
      setDado(v => (v && v.coberto > coberto ? v : { linhas: Array.isArray(d.linhas) ? d.linhas : [], coberto }))
    } finally { pedindo.current = false }
  }, [tipo, roomId, edicao, seed])
  // lê a cada virada do relógio (começo e apito de cada jogo)
  useEffect(() => { if (ativo) void ler() }, [ativo, row?.revision, ler])
  const precisa = row ? row.step - 1 : -1
  const coberto = dado?.coberto ?? -1
  // 🔁 enquanto falta o pedaço que decide o jogo da vez, tenta de novo a cada 1,5 s
  useEffect(() => {
    if (!ativo || coberto >= precisa) return
    const iv = setInterval(() => { void ler() }, 1500)
    return () => clearInterval(iv)
  }, [ativo, coberto, precisa, ler])
  // ⏳ válvula: banco mudo por 8 s não trava a sala
  const [venceu, setVenceu] = useState(-1)
  useEffect(() => {
    if (!row || coberto >= precisa) return
    const rev = row.revision
    const t = setTimeout(() => setVenceu(rev), ESPERA_MAX_MS)
    return () => clearTimeout(t)
  }, [row?.revision, coberto, precisa]) // eslint-disable-line react-hooks/exhaustive-deps
  const pronto = !row || coberto >= precisa || venceu === row.revision

  const escolher = useCallback(async (t: TaticaCopa) => {
    const antes = minha
    setMinha(t); setAviso('')
    const { data, error } = await supabase.rpc('esc_copa_tatica_set', { p_room: roomId, p_tipo: tipo, p_edicao: edicao, p_seed: seed, p_tatica: t })
    const d = data as { ok?: boolean } | null
    if (error || !d?.ok) { setMinha(antes); setAviso(tr('O jogo já apitou — escolha durante o próximo jogo.', 'The match is over — pick during the next match.')) }
  }, [minha, roomId, tipo, edicao, seed])

  // a tática que ESTÁ valendo pra mim daqui pra frente: a que escolhi agora, senão a última congelada
  const ultima = meuUid ? [...(dado?.linhas ?? [])].filter(l => l.uid === meuUid).sort((a, b) => b.passo - a.passo)[0]?.tatica : undefined
  return { linhas: dado?.linhas ?? [], pronto, escolher, minha: minha ?? ultima ?? 'equilibrio' as TaticaCopa, podeEscolher: !!row?.running, aviso }
}

const ROTULO: Record<TaticaCopa, [string, string]> = { retranca: ['🧱 Retranca', '🧱 Park the bus'], equilibrio: ['⚖️ Equilíbrio', '⚖️ Balanced'], ataque: ['🔥 Ataque', '🔥 Attack'] }
const INK = '#0C0C0C', GOLD = '#FFC400'

/** o MESMO cartão de tática da liga/Champions, com a regra da copa escrita embaixo */
export function CartaoTaticaCopa({ minha, podeEscolher, aviso, onEscolher }: { minha: TaticaCopa; podeEscolher: boolean; aviso?: string; onEscolher: (t: TaticaCopa) => void }) {
  return <div style={{ background: '#fff', color: INK, border: `3px solid ${INK}`, borderRadius: 14, boxShadow: `4px 4px 0 ${INK}`, padding: 12, margin: '0 0 10px' }}>
    <p style={{ fontFamily: 'Oswald, sans-serif', fontWeight: 900, fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(0,0,0,.5)', margin: '0 0 8px' }}>
      ⚔️ {tr('Tática do próximo jogo', 'Tactic for the next match')}
    </p>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
      {TATICAS_COPA.map(t => <button key={t} disabled={!podeEscolher} onClick={() => onEscolher(t)}
        style={{ border: `3px solid ${INK}`, borderRadius: 12, padding: '8px 2px', fontFamily: 'Oswald, sans-serif', fontWeight: 900, fontSize: 12.5, textTransform: 'uppercase', cursor: podeEscolher ? 'pointer' : 'default',
          background: minha === t ? GOLD : '#fff', color: INK, boxShadow: minha === t ? `3px 3px 0 ${INK}` : 'none', opacity: podeEscolher || minha === t ? 1 : 0.55 }}>
        {tr(ROTULO[t][0], ROTULO[t][1])}
      </button>)}
    </div>
    <p style={{ fontSize: 10.5, fontWeight: 700, color: aviso ? '#B23B2E' : 'rgba(0,0,0,.55)', margin: '7px 0 0', textAlign: 'center' }}>
      {aviso || (podeEscolher
        ? tr('Escolha enquanto a bola rola — vale a partir do PRÓXIMO jogo.', 'Pick while the ball is rolling — it counts from the NEXT match.')
        : tr('⏳ Abre quando a bola rolar. O que você escolher vale no jogo seguinte.', '⏳ Opens when the ball is rolling. Your pick counts in the following match.'))}
    </p>
  </div>
}
