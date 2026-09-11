// ─── 🏛️ SALÃO DOS BATISMOS ──────────────────────────────────────────────────
//
// Pedido do Diego (30/08): *"precisamos criar algum ranking sei lá algo c todos
// batismos, algo c times de coração... que a pessoa vê o mockup dos times
// criados... vê tb quais maiores torcidas"*. Mockup:
// `scripts/mockup-salao-batismos.mjs`.
//
// 🔄 REFEITO EM 08/09 — SEM RANKING. Palavras dele: *"N quero ranking não.
// Quero Série A/online e embaixo Série B, C, D, várzea"*.
//
// 🔄 REFEITO DE NOVO EM 11/09 — E AGORA **NENHUMA DIVISÃO APARECE**. Palavras
// dele: *"me mande sem mostrar qm tá na série A ou B. E a torcida atualize e
// coloque com % e N quantidade. E a torcida é só de qm tem batismo msm"*.
// Traduzindo pro que está nesta tela:
//   · **uma parede só**, com TODOS os clubes juntos. Nem faixa de Série A, nem
//     faixa de Várzea, nem letra nenhuma do lado de clube nenhum. Em 08/09 ele
//     já tinha tirado a letra de cada clube pra "nego N ficar puto"; agora
//     sumiu também a separação em dois grupos, que entregava a mesma coisa.
//   · a ordem é o número de FUNDADOR (quem chegou antes vem antes) — é o único
//     critério que não vira ranking nem compara clube com clube.
//   · 08/09, dele: *"todos esses entram sim"* — White Thigs do GuGu (1º batismo
//     da história) e Vasco da Grana entraram em `BATISMOS`, sem nº (dono
//     desconhecido), com selo próprio.
//   · ❤️ Torcidas mostra **porcentagem, não cabeça contada** (*"coloque com %
//     e N quantidade"*): de cada 100 donos de clube batizado, quantos torcem
//     por aquele time. Número pequeno em cabeça ("2 pessoas") diminui a
//     torcida de quem tem poucos; em % todo mundo lê a mesma régua.
//   · e é **só de quem é batismo mesmo** (*"a torcida é só de qm tem batismo
//     msm"*): o `esc_salao_torcidas()` filtra `origem = 'batismo'` no banco
//     (migração `salao_torcidas_so_batismo`, 11/09) — sócio de assinatura não
//     entra mais na conta. Ele devolve nome de CLUBE, nunca e-mail.
//
// 🔒 EM OBRA: só a conta do Diego vê (trava `useSalao` em sport.ts). Pra soltar
// pra geral é trocar `SALAO_GERAL` lá pra true.

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Shell, Box, VoltarInicio } from './screens'
import { Escudo } from './escudos'
import { BATISMOS, type Batismo } from './batismos'
import { useEsc } from './store'

const INK = '#0C0C0C', GOLD = '#FFC400', PURPLE = '#7C3AED', GREEN = '#1B7A3D'
const OSWALD = { fontFamily: 'Oswald, sans-serif' } as const

interface Torcida { time_nome: string; gente: number; clubes: string[] | null }

// 📛 NENHUMA DIVISÃO É LIDA AQUI (11/09). A tela não sabe — e não quer saber —
// em que série cada clube está: é uma parede só, na ordem de quem chegou antes.
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

  const clubes = useMemo(() => [...BATISMOS].sort(porChegada), [])

  const vagas = 100 - BATISMOS.filter(b => b.tipo === 'batismo').length
  // 📊 a % é sobre o TOTAL de donos que declararam time de coração — é essa a
  // régua que ele pediu. A barra é comparada com a MAIOR (senão, com 15 times
  // na lista, todas as barras nasceriam espremidas e ninguém leria nada).
  const totalTorcida = Math.max(1, (torcidas ?? []).reduce((s, t) => s + t.gente, 0))
  const maiorTorcida = Math.max(1, ...(torcidas ?? []).map(t => t.gente))
  const pct = (n: number) => {
    const v = 100 * n / totalTorcida
    return v >= 10 ? `${Math.round(v)}%` : `${v.toFixed(1).replace('.', ',')}%`
  }
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
      {!c.fundador && c.selo && (
        <span className="absolute top-1.5 right-1.5 text-[8.5px] font-black border-2 border-black rounded-full px-1.5"
          style={{ background: GOLD }}>{c.selo}</span>
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
          {/* 📛 UMA PAREDE SÓ: sem faixa de divisão, sem letra, sem separar em
              grupos. Só os clubes, na ordem de quem chegou antes. */}
          <Faixa titulo="🛡️ Os clubes" sub={`${clubes.length} · na ordem de quem chegou antes`} />
          <div className="grid grid-cols-2 gap-2.5">
            {clubes.map(c => <Card key={c.clube} c={c} />)}
          </div>
        </div>
      )}

      {/* ───────────────── ❤️ TORCIDAS (só donos de clube) ───────────────── */}
      {aba === 'torcida' && (
        <div className="space-y-2">
          <p className="text-center text-[11px] font-bold text-black/45">
            de cada 100 donos de clube batizado, quantos torcem por cada time
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
                    <span className="font-black text-[13px] w-24 shrink-0 truncate" style={OSWALD}>{t.time_nome}</span>
                    <span className="flex-1 h-3.5 rounded-full overflow-hidden" style={{ background: 'rgba(12,12,12,.09)' }}>
                      <i className="block h-full rounded-full" style={{ width: `${Math.round(100 * t.gente / maiorTorcida)}%`, background: PURPLE }} />
                    </span>
                    {/* % e NÃO quantidade (pedido dele, 11/09) */}
                    <span className="font-black text-[13px] w-12 text-right shrink-0" style={OSWALD}>{pct(t.gente)}</span>
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
