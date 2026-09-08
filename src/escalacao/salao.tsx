// ─── 🏛️ SALÃO DOS BATISMOS ──────────────────────────────────────────────────
//
// Pedido do Diego (30/08): *"precisamos criar algum ranking sei lá algo c todos
// batismos, algo c times de coração... que a pessoa vê o mockup dos times
// criados... vê tb quais maiores torcidas"*. Mockup:
// `scripts/mockup-salao-batismos.mjs`.
//
// 🔄 REFEITO EM 08/09 — SEM RANKING. Palavras dele: *"N quero ranking não.
// Quero Série A/online e embaixo Série B, C, D, várzea... quis dizer q B C D é
// várzea e tudo junto. N q vc fala q um time tá na B, outro na C — isso N
// precisa, p nego N ficar puto"*. Então:
//   · em cima, ⭐ SÉRIE A · ONLINE — os clubes que aparecem no jogo rápido;
//   · embaixo, 🏟️ VÁRZEA — todo o resto JUNTO (B, C, D e sócios), sem letra
//     nenhuma. Ninguém lê "Série D" do lado do próprio clube.
//   · sem título, sem palmarés, sem posição: a ordem é o número de fundador
//     (quem chegou antes vem antes), que é o único "ranking" que não briga.
//   · ❤️ Torcidas continua, mas **só de quem é batismo** (*"a torcida mantém tb
//     mas só de qm é batismo"*): `esc_salao_torcidas()` conta o coração dos
//     DONOS de clube (esc_socios) e devolve os clubes de cada torcida — nome de
//     clube, nunca e-mail.
//
// 🔒 EM OBRA: só a conta do Diego vê (trava `useSalao` em sport.ts). Pra soltar
// pra geral é trocar `SALAO_GERAL` lá pra true.

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Shell, Box, VoltarInicio } from './screens'
import { Escudo } from './escudos'
import { DIVISION_TEAMS } from './data'
import { BATISMOS, chaveClube, type Batismo } from './batismos'
import { useEsc } from './store'

const INK = '#0C0C0C', GOLD = '#FFC400', PURPLE = '#7C3AED', GREEN = '#1B7A3D'
const OSWALD = { fontFamily: 'Oswald, sans-serif' } as const

interface Torcida { time_nome: string; gente: number; clubes: string[] | null }

// quem é da Série A (= os clubes do jogo rápido online). O resto é Várzea.
const SERIE_A = new Set(DIVISION_TEAMS.A.map(t => chaveClube(t.team)))
const porChegada = (a: Batismo, b: Batismo) => (a.fundador ?? 999) - (b.fundador ?? 999) || a.clube.localeCompare(b.clube)

export default function Salao({ voltar }: { voltar?: () => void }) {
  const { dispatch } = useEsc()
  const [aba, setAba] = useState<'clubes' | 'torcida'>('clubes')
  const [torcidas, setTorcidas] = useState<Torcida[] | null>(null)
  const [fora, setFora] = useState(false)

  useEffect(() => {
    let vivo = true
    ;(async () => {
      try {
        const r = await supabase.rpc('esc_salao_torcidas')
        if (!vivo) return
        if (r.error) throw r.error
        setTorcidas((r.data ?? []) as Torcida[])
      } catch {
        if (vivo) { setFora(true); setTorcidas([]) }
      }
    })()
    return () => { vivo = false }
  }, [])

  const { elite, varzea } = useMemo(() => {
    const elite = BATISMOS.filter(b => SERIE_A.has(chaveClube(b.clube))).sort(porChegada)
    const varzea = BATISMOS.filter(b => !SERIE_A.has(chaveClube(b.clube))).sort(porChegada)
    return { elite, varzea }
  }, [])

  const vagas = 100 - BATISMOS.filter(b => b.tipo === 'batismo').length
  const maiorTorcida = Math.max(1, ...(torcidas ?? []).map(t => t.gente))
  const ABAS = [
    { id: 'clubes' as const, txt: '🛡️ Clubes' },
    { id: 'torcida' as const, txt: '❤️ Torcidas' },
  ]

  const Card = ({ c }: { c: Batismo }) => (
    <div className="relative border-[3px] border-black rounded-2xl px-2 pt-3 pb-2.5 text-center"
      style={{ background: '#F4ECD6', boxShadow: `3px 3px 0 ${INK}` }}>
      {c.fundador && (
        <span className="absolute top-1.5 right-1.5 text-[8.5px] font-black border-2 border-black rounded-full px-1.5"
          style={{ background: GOLD }}>🏛️ nº{c.fundador}</span>
      )}
      {c.tipo === 'socio' && (
        <span className="absolute top-1.5 right-1.5 text-[8.5px] font-black border-2 border-black rounded-full px-1.5"
          style={{ background: '#fff' }}>🎫 sócio</span>
      )}
      <div className="flex justify-center mb-1.5"><Escudo nome={c.clube} size={58} /></div>
      {/* 📱 nome inteiro, sem cortar — e NADA de "Série X" embaixo (decisão 08/09) */}
      <p className="font-black text-[12.5px] leading-tight" style={OSWALD}>{c.clube}</p>
    </div>
  )

  const Faixa = ({ titulo, sub }: { titulo: string; sub: string }) => (
    <div className="flex items-baseline justify-between border-[3px] border-black rounded-xl px-3 py-1.5"
      style={{ background: INK, color: '#fff', boxShadow: `3px 3px 0 rgba(12,12,12,.35)` }}>
      <b className="font-black text-[15px] uppercase tracking-wide" style={OSWALD}>{titulo}</b>
      <span className="text-[10px] font-bold text-white/60">{sub}</span>
    </div>
  )

  return (
    <Shell>
      <div className="pt-4">
        {voltar
          ? <button onClick={voltar} className="text-black/45 font-black text-sm active:opacity-60" style={OSWALD}>← Voltar pro Ranking</button>
          : <VoltarInicio />}
      </div>
      <div className="text-center -mt-1">
        <span className="inline-block border-2 border-black rounded-full px-3 py-0.5 text-[11px] font-black uppercase tracking-wide mb-1.5"
          style={{ background: GOLD, boxShadow: `3px 3px 0 0 ${INK}`, ...OSWALD }}>👁️ prévia — só você vê</span>
        <h2 className="font-black text-4xl leading-none" style={OSWALD}>🏛️ SALÃO DOS BATISMOS</h2>
        <p className="font-semibold text-black/60 mt-2 text-[13px] leading-snug">
          Todo clube que virou de alguém está aqui, com o escudo que aparece no jogo.
          <br /><b>{BATISMOS.length} clubes</b> · {vagas} vagas ainda livres
        </p>
      </div>

      <div className="flex border-[3px] border-black rounded-xl overflow-hidden">
        {ABAS.map(t => (
          <button key={t.id} onClick={() => setAba(t.id)}
            className="flex-1 py-2.5 font-black text-xs uppercase"
            style={{ backgroundColor: aba === t.id ? GOLD : '#fff', color: '#000', ...OSWALD }}>{t.txt}</button>
        ))}
      </div>

      {/* ───────────────── 🛡️ CLUBES ───────────────── */}
      {aba === 'clubes' && (
        <div className="space-y-3">
          <Faixa titulo="⭐ Série A · Online" sub={`${elite.length} clubes · os do jogo rápido`} />
          <div className="grid grid-cols-2 gap-2.5">
            {elite.map(c => <Card key={c.clube} c={c} />)}
          </div>

          <div className="pt-2" />
          <Faixa titulo="🏟️ Várzea" sub={`${varzea.length} clubes · subindo na carreira`} />
          <div className="grid grid-cols-2 gap-2.5">
            {varzea.map(c => <Card key={c.clube} c={c} />)}
          </div>
        </div>
      )}

      {/* ───────────────── ❤️ TORCIDAS (só donos de clube) ───────────────── */}
      {aba === 'torcida' && (
        <div className="space-y-2">
          <p className="text-center text-[11px] font-bold text-black/45">
            de qual time torce quem tem clube aqui no Salão
          </p>
          {fora && (
            <Box bg="#fff" className="p-5 text-center">
              <p className="font-black text-sm" style={OSWALD}>🔧 Servidor fora do ar por uns minutos</p>
              <p className="font-bold text-black/60 text-xs mt-1">As torcidas já voltam — é só instabilidade 💛</p>
            </Box>
          )}
          {torcidas === null && !fora && <p className="text-center font-bold text-black/60">Carregando…</p>}
          {torcidas && torcidas.length > 0 && (
            <Box bg="#fff" className="p-3 space-y-2.5">
              {torcidas.map(t => (
                <div key={t.time_nome}>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-[13px] w-28 shrink-0 truncate" style={OSWALD}>{t.time_nome}</span>
                    <span className="flex-1 h-3.5 rounded-full overflow-hidden" style={{ background: 'rgba(12,12,12,.09)' }}>
                      <i className="block h-full rounded-full" style={{ width: `${Math.round(100 * t.gente / maiorTorcida)}%`, background: PURPLE }} />
                    </span>
                    <span className="font-black text-[13px] w-8 text-right shrink-0" style={OSWALD}>{t.gente}</span>
                  </div>
                  {/* os clubes dessa torcida — é o que faz a aba ser dos batismos */}
                  {t.clubes && t.clubes.length > 0 && (
                    <p className="text-[9.5px] font-bold text-black/50 leading-snug pl-0.5 mt-0.5">
                      ❤️ {t.clubes.join(' · ')}
                    </p>
                  )}
                </div>
              ))}
            </Box>
          )}
        </div>
      )}

      <Box bg={GREEN} className="p-4 text-center">
        <p className="font-black text-white text-lg leading-none" style={OSWALD}>🔨 Sua vaga está livre</p>
        <p className="text-white/85 text-[12px] font-bold mt-1.5 leading-snug">
          {vagas} clubes ainda esperam dono — vire Lenda e batize o seu
        </p>
      </Box>

      <button onClick={() => dispatch({ type: 'GO_RANKING' })}
        className="w-full text-center text-[12px] font-black text-black/50 underline active:opacity-60 pb-2" style={OSWALD}>
        🏆 quer se comparar com TODO mundo? o Ranking geral está aqui
      </button>
    </Shell>
  )
}
