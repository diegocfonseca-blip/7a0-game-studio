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
// 🔓 ABERTO PRA TODO MUNDO em 13/09 (`SALAO_GERAL = true` em sport.ts). Palavras
// do Diego: *"agora publique também a sala de batismos, mas oculte por enquanto os
// números de fundadores. + coloque a torcida também, sem pôr os usuários embaixo.
// Oculte eles. E deixe como % mesmo também"*. Então, nesta abertura:
//   · 🙈 **número de fundador ESCONDIDO** (`MOSTRAR_NUMERO_FUNDADOR`, abaixo) —
//     inclusive o selo que aparece no LUGAR do número ("🥇 1º da história"), que é
//     a mesma casinha. O selo 🎫 sócio fica, porque é TIPO, não número. A ORDEM
//     dos cards continua sendo a de chegada — só não está mais escrita na tela.
//   · 🙈 **lista de donos ESCONDIDA** embaixo de cada barra de torcida
//     (`MOSTRAR_DONOS_DA_TORCIDA`) — antes saía "❤️ Nata de SP · Fala D10 · …",
//     que é dizer quem torce pra quem.
//   · ❤️ **a torcida continua em %** (ele reforçou: *"deixe como % msm tb"*).
// As duas travas são uma linha cada: é assim que ele volta atrás quando quiser.
//
// 🌐 BILÍNGUE desde a abertura: a tela nasceu só em PT (30/08), mas o site virou
// BR/EN em 11-12/09 e agora ela é de todo mundo. Nome de CLUBE e de TIME DE
// CORAÇÃO nunca traduz — é identidade (regra do CLAUDE.md).

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Shell, Box, VoltarInicio } from './screens'
import { Escudo } from './escudos'
import { BATISMOS, type Batismo } from './batismos'
import { useEsc } from './store'
import { tr } from './lang'

const INK = '#0C0C0C', GOLD = '#FFC400', PURPLE = '#7C3AED', GREEN = '#1B7A3D'
const OSWALD = { fontFamily: 'Oswald, sans-serif' } as const

// 🙈 as duas travas da abertura de 13/09 — trocar pra true devolve cada coisa
const MOSTRAR_NUMERO_FUNDADOR = false   // nº do fundador (e o selo que ocupa a mesma casinha)
const MOSTRAR_DONOS_DA_TORCIDA = false  // a lista de clubes embaixo da barra de cada torcida

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
    { id: 'clubes' as const, txt: tr('🛡️ Clubes', '🛡️ Clubs') },
    { id: 'torcida' as const, txt: tr('❤️ Torcidas', '❤️ Fanbases') },
  ]

  const Card = ({ c }: { c: Batismo }) => (
    <div className="relative border-[3px] border-black rounded-2xl px-2 pt-3 pb-2.5 text-center"
      style={{ background: '#F4ECD6', boxShadow: `3px 3px 0 ${INK}` }}>
      {MOSTRAR_NUMERO_FUNDADOR && c.fundador && (
        <span className="absolute top-1.5 right-1.5 text-[8.5px] font-black border-2 border-black rounded-full px-1.5"
          style={{ background: GOLD }}>🏛️ nº{c.fundador}</span>
      )}
      {MOSTRAR_NUMERO_FUNDADOR && !c.fundador && c.selo && (
        <span className="absolute top-1.5 right-1.5 text-[8.5px] font-black border-2 border-black rounded-full px-1.5"
          style={{ background: GOLD }}>{c.selo}</span>
      )}
      {c.tipo === 'socio' && (
        <span className="absolute top-1.5 right-1.5 text-[8.5px] font-black border-2 border-black rounded-full px-1.5"
          style={{ background: '#fff' }}>{tr('🎫 sócio', '🎫 member')}</span>
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
          ? <button onClick={voltar} className="text-black/45 font-black text-sm active:opacity-60" style={OSWALD}>{tr('← Voltar pro Ranking', '← Back to the Ranking')}</button>
          : <VoltarInicio />}
      </div>
      <div className="text-center -mt-1">
        {/* 👁️ a pílula de "prévia" saiu em 13/09: a tela é de todo mundo agora */}
        <h2 className="font-black text-4xl leading-none" style={OSWALD}>{tr('🏛️ SALÃO DOS BATISMOS', '🏛️ HALL OF NAMED CLUBS')}</h2>
        <p className="font-semibold text-black/60 mt-2 text-[13px] leading-snug">
          {tr('Todo clube que virou de alguém está aqui, com o escudo que aparece no jogo.', 'Every club that became someone\'s is here, with the crest that shows up in the game.')}
          <br /><b>{BATISMOS.length} {tr('clubes', 'clubs')}</b> · {vagas} {tr('vagas ainda livres', 'spots still open')}
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
          <Faixa titulo={tr('🛡️ Os clubes', '🛡️ The clubs')} sub={`${clubes.length} · ${tr('na ordem de quem chegou antes', 'in the order they arrived')}`} />
          <div className="grid grid-cols-2 gap-2.5">
            {clubes.map(c => <Card key={c.clube} c={c} />)}
          </div>
        </div>
      )}

      {/* ───────────────── ❤️ TORCIDAS (só donos de clube) ───────────────── */}
      {aba === 'torcida' && (
        <div className="space-y-2">
          <p className="text-center text-[11px] font-bold text-black/45">
            {tr('de cada 100 donos de clube batizado, quantos torcem por cada time', 'out of every 100 owners of a named club, how many support each team')}
          </p>
          {fora && (
            <Box bg="#fff" className="p-5 text-center">
              <p className="font-black text-sm" style={OSWALD}>{tr('🔧 Servidor fora do ar por uns minutos', '🔧 Server down for a few minutes')}</p>
              <p className="font-bold text-black/60 text-xs mt-1">{tr('As torcidas já voltam — é só instabilidade 💛', 'The fanbases will be back shortly — just a hiccup 💛')}</p>
            </Box>
          )}
          {torcidas === null && !fora && <p className="text-center font-bold text-black/60">{tr('Carregando…', 'Loading…')}</p>}
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
                  {/* 🙈 quem torce por esse time: ESCONDIDO na abertura de 13/09
                      (*"sem pôr os usuários embaixo. Oculte eles"*). Uma linha
                      devolve, se ele mudar de ideia. */}
                  {MOSTRAR_DONOS_DA_TORCIDA && t.clubes && t.clubes.length > 0 && (
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
        <p className="font-black text-white text-lg leading-none" style={OSWALD}>{tr('🔨 Sua vaga está livre', '🔨 Your spot is open')}</p>
        <p className="text-white/85 text-[12px] font-bold mt-1.5 leading-snug">
          {vagas} {tr('clubes ainda esperam dono — vire Lenda e batize o seu', 'clubs are still waiting for an owner — become a Legend and name yours')}
        </p>
      </Box>

      <button onClick={() => dispatch({ type: 'GO_RANKING' })}
        className="w-full text-center text-[12px] font-black text-black/50 underline active:opacity-60 pb-2" style={OSWALD}>
        {tr('🏆 quer se comparar com TODO mundo? o Ranking geral está aqui', '🏆 want to compare with EVERYONE? the overall Ranking is here')}
      </button>
    </Shell>
  )
}
