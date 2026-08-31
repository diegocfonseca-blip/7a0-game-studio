// ─── 🏛️ SALÃO DOS BATISMOS ──────────────────────────────────────────────────
//
// Pedido do Diego (30/08): *"precisamos criar algum ranking sei lá algo c todos
// batismos, algo c times de coração... que a pessoa vê o mockup dos times
// criados... vê tb quais maiores torcidas"*. Mockup aprovado:
// `scripts/mockup-salao-batismos.mjs`.
//
// 🔒 EM OBRA: só a conta do Diego vê (trava `useSalao` em sport.ts). Pra soltar
// pra geral é trocar `SALAO_GERAL` lá pra true.
//
// ── POR QUE ISTO É DIFERENTE DA ABA 🏆 RANKING ──────────────────────────────
// O Ranking já existe e é ABERTO: top 100 de todo mundo, 4 modos, troca todo
// dia. Medi antes de desenhar e o batismo NÃO fica abafado lá — o Xurupitas é o
// 1º do jogo inteiro e 7 dos 20 primeiros são batizados. Então o Salão não
// repete a tabela: ele é o LUGAR. Ranking é quem ganhou mais essa semana;
// Salão é quem tem clube próprio, com escudo, mascote e número de fundador —
// não muda, acumula.
//
// ── DE ONDE VÊM OS NÚMEROS ──────────────────────────────────────────────────
// De `esc_salao_clubes()`, que soma `esc_results` (toda temporada terminada já
// era gravada — 227 mil linhas). Nada de novo precisou ser guardado.
//
// ⚠️ A SOMA É POR CLUBE, JUNTANDO NOME VELHO COM NOME NOVO. Sem isso o
// Xurupitas apareceria duas vezes (ele era Tokyo City Esperion) e o Leão da
// Estradinha perderia metade do palmarés (era Império Samambaia). Quem junta é
// o `newestTeamName` do data.ts, que já sabe as correntes — o banco só entrega
// nome + número e nenhum e-mail sai de lá.

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Shell, Box, VoltarInicio } from './screens'
import { Escudo } from './escudos'
import { newestTeamName, DIVISION_TEAMS } from './data'
import { BATISMOS, chaveClube, type Batismo } from './batismos'
import { useEsc } from './store'

const INK = '#0C0C0C', GOLD = '#FFC400', PURPLE = '#7C3AED', GREEN = '#1B7A3D'
const OSWALD = { fontFamily: 'Oswald, sans-serif' } as const

interface LinhaBanco { nome: string; titulos: number; temporadas: number; artilharias: number; gols: number; fundador: number | null }
interface Torcida { time_nome: string; gente: number }
interface Clube extends Batismo { titulos: number; temporadas: number; artilharias: number; gols: number; divisao: string | null }

// divisão de cada clube — sai do próprio baralho da carreira
const DIV_POR_CLUBE = (() => {
  const m = new Map<string, string>()
  for (const d of ['A', 'B', 'C', 'D'] as const) {
    for (const t of DIVISION_TEAMS[d]) m.set(chaveClube(t.team), d)
  }
  return m
})()

export default function Salao({ voltar }: { voltar?: () => void }) {
  const { dispatch } = useEsc()
  const [aba, setAba] = useState<'rank' | 'parede' | 'torcida'>('rank')
  const [linhas, setLinhas] = useState<LinhaBanco[] | null>(null)
  const [torcidas, setTorcidas] = useState<Torcida[] | null>(null)
  const [fora, setFora] = useState(false)

  useEffect(() => {
    let vivo = true
    ;(async () => {
      try {
        const [a, b] = await Promise.all([
          supabase.rpc('esc_salao_clubes'),
          supabase.rpc('esc_salao_torcidas'),
        ])
        if (!vivo) return
        setLinhas((a.data ?? []) as LinhaBanco[])
        setTorcidas((b.data ?? []) as Torcida[])
      } catch {
        if (vivo) { setFora(true); setLinhas([]); setTorcidas([]) }
      }
    })()
    return () => { vivo = false }
  }, [])

  // 🧮 junta o palmarés no clube ATUAL (nome velho entra no novo)
  const clubes = useMemo<Clube[]>(() => {
    const soma = new Map<string, { t: number; s: number; a: number; g: number }>()
    for (const l of linhas ?? []) {
      const k = chaveClube(newestTeamName(l.nome))
      const c = soma.get(k) ?? { t: 0, s: 0, a: 0, g: 0 }
      c.t += l.titulos; c.s += l.temporadas; c.a += l.artilharias; c.g += Number(l.gols || 0)
      soma.set(k, c)
    }
    return BATISMOS.map(b => {
      const k = chaveClube(b.clube)
      const s = soma.get(k) ?? { t: 0, s: 0, a: 0, g: 0 }
      return { ...b, titulos: s.t, temporadas: s.s, artilharias: s.a, gols: s.g, divisao: DIV_POR_CLUBE.get(k) ?? null }
    }).sort((x, y) => y.titulos - x.titulos || y.temporadas - x.temporadas || x.clube.localeCompare(y.clube))
  }, [linhas])

  const carregando = linhas === null
  const selo = (c: Clube) => c.tipo === 'socio' ? '🎫 sócio' : (c.fundador ? `🏛️ fundador nº${c.fundador}` : '🖋️ batismo')
  const sub = (c: Clube) => [c.divisao ? `Série ${c.divisao}` : (c.tipo === 'socio' ? 'clube de sócio' : null), selo(c)].filter(Boolean).join(' · ')

  const ABAS = [
    { id: 'rank' as const, txt: '🏆 Ranking' },
    { id: 'parede' as const, txt: '🖼️ A Parede' },
    { id: 'torcida' as const, txt: '❤️ Torcidas' },
  ]
  const maiorTorcida = Math.max(1, ...(torcidas ?? []).map(t => t.gente))
  const comArte = clubes.filter(c => c.titulos > 0).length

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
          Todo clube que virou de alguém está aqui: escudo, divisão e o que já ganhou.
          <br /><b>{BATISMOS.length} clubes</b> · {100 - BATISMOS.filter(b => b.tipo === 'batismo').length} vagas ainda livres
        </p>
      </div>

      <div className="flex border-[3px] border-black rounded-xl overflow-hidden">
        {ABAS.map(t => (
          <button key={t.id} onClick={() => setAba(t.id)}
            className="flex-1 py-2.5 font-black text-xs uppercase"
            style={{ backgroundColor: aba === t.id ? GOLD : '#fff', color: '#000', ...OSWALD }}>{t.txt}</button>
        ))}
      </div>

      {fora && (
        <Box bg="#fff" className="p-5 text-center">
          <p className="font-black text-sm" style={OSWALD}>🔧 Servidor fora do ar por uns minutos</p>
          <p className="font-bold text-black/60 text-xs mt-1">O Salão já volta — é só instabilidade 💛</p>
        </Box>
      )}
      {carregando && !fora && <p className="text-center font-bold text-black/60">Carregando…</p>}

      {/* ───────────────── 🏆 RANKING ───────────────── */}
      {!carregando && aba === 'rank' && (
        <div className="space-y-1.5">
          <p className="text-center text-[11px] font-bold text-black/45">
            títulos de TODAS as carreiras · nome velho e nome novo somam juntos
          </p>
          {clubes.map((c, i) => (
            <div key={c.clube} className="flex items-center gap-2.5 border-[2.5px] border-black rounded-xl px-2.5 py-1.5"
              style={{ background: i < 3 ? '#FFF7DE' : '#fff' }}>
              <span className="w-7 shrink-0 font-black text-[15px] text-center" style={{ ...OSWALD, color: i < 3 ? INK : 'rgba(12,12,12,.45)' }}>{i + 1}º</span>
              <span className="shrink-0"><Escudo nome={c.clube} size={34} /></span>
              {/* 📱 o nome NÃO pode cortar (era o que acontecia: "Leão da Estradi…").
                  Por isso as temporadas desceram pra linha de baixo, em vez de
                  virarem uma segunda coluna roubando largura do nome. */}
              <div className="flex-1 min-w-0">
                <p className="font-black text-[14.5px] leading-tight" style={OSWALD}>{c.clube}</p>
                <p className="text-[9.5px] font-bold text-black/50 leading-snug">{sub(c)}</p>
                <p className="text-[9.5px] font-bold text-black/40 leading-snug">
                  {c.temporadas > 0 ? `${c.temporadas} temporadas` : 'ainda não jogou'}
                  {c.artilharias > 0 ? ` · ${c.artilharias} artilharia${c.artilharias > 1 ? 's' : ''}` : ''}
                </p>
              </div>
              <div className="w-12 text-center shrink-0">
                <b className="block font-black text-[19px] leading-none" style={OSWALD}>{c.titulos}</b>
                <span className="block text-[8.5px] font-black text-black/45 uppercase tracking-wide">títulos</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ───────────────── 🖼️ A PAREDE ───────────────── */}
      {!carregando && aba === 'parede' && (
        <div className="space-y-3">
          <p className="text-center text-[11px] font-bold text-black/45">
            {comArte} clubes já jogaram · o escudo é o que aparece no jogo
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {[...clubes].sort((a, b) => (a.fundador ?? 999) - (b.fundador ?? 999)).map(c => (
              <div key={c.clube} className="relative border-[3px] border-black rounded-2xl px-2 py-3 text-center"
                style={{ background: '#F4ECD6', boxShadow: `3px 3px 0 ${INK}` }}>
                {c.fundador && (
                  <span className="absolute top-1.5 right-1.5 text-[8.5px] font-black border-2 border-black rounded-full px-1.5"
                    style={{ background: GOLD }}>nº{c.fundador}</span>
                )}
                {c.tipo === 'socio' && (
                  <span className="absolute top-1.5 right-1.5 text-[8.5px] font-black border-2 border-black rounded-full px-1.5"
                    style={{ background: '#fff' }}>🎫 sócio</span>
                )}
                <div className="flex justify-center mb-1.5"><Escudo nome={c.clube} size={58} /></div>
                <p className="font-black text-[12.5px] leading-tight" style={OSWALD}>{c.clube}</p>
                <p className="text-[9.5px] font-bold text-black/50 mt-0.5">
                  {c.divisao ? `Série ${c.divisao}` : 'clube de sócio'}{c.titulos > 0 ? ` · 🏆 ${c.titulos}` : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ───────────────── ❤️ TORCIDAS ───────────────── */}
      {!carregando && aba === 'torcida' && (
        <div className="space-y-2">
          <p className="text-center text-[11px] font-bold text-black/45">
            {(torcidas ?? []).reduce((s, t) => s + t.gente, 0)} pessoas já disseram de qual time torcem
          </p>
          <Box bg="#fff" className="p-3 space-y-1.5">
            {(torcidas ?? []).map(t => (
              <div key={t.time_nome} className="flex items-center gap-2">
                <span className="font-black text-[13px] w-28 shrink-0 truncate" style={OSWALD}>{t.time_nome}</span>
                <span className="flex-1 h-3.5 rounded-full overflow-hidden" style={{ background: 'rgba(12,12,12,.09)' }}>
                  <i className="block h-full rounded-full" style={{ width: `${Math.round(100 * t.gente / maiorTorcida)}%`, background: PURPLE }} />
                </span>
                <span className="font-black text-[13px] w-8 text-right shrink-0" style={OSWALD}>{t.gente}</span>
              </div>
            ))}
          </Box>
          {/* ⚠️ decisão pendente do Diego: a regra dele (coracao.ts / manto.ts) diz
              que nome de clube REAL não aparece dentro do jogo, só as cores. */}
          <Box bg="#FFF4CF" className="p-3">
            <p className="text-[11.5px] font-bold leading-snug">
              ⚠️ <b>Falta você decidir isto.</b> Sua regra (coracao.ts / manto.ts) diz que <i>nome de clube real
              nunca aparece dentro do jogo — só as cores</i>. Aqui o nome está escrito. Se preferir, eu troco
              por só a listra colorida — mas aí quase ninguém adivinha qual é.
            </p>
          </Box>
        </div>
      )}

      {!carregando && (
        <Box bg={GREEN} className="p-4 text-center">
          <p className="font-black text-white text-lg leading-none" style={OSWALD}>🔨 Sua vaga está livre</p>
          <p className="text-white/85 text-[12px] font-bold mt-1.5 leading-snug">
            {100 - BATISMOS.filter(b => b.tipo === 'batismo').length} clubes ainda esperam dono — vire Lenda e batize o seu
          </p>
        </Box>
      )}

      <button onClick={() => dispatch({ type: 'GO_RANKING' })}
        className="w-full text-center text-[12px] font-black text-black/50 underline active:opacity-60 pb-2" style={OSWALD}>
        🏆 quer se comparar com TODO mundo? o Ranking geral está aqui
      </button>
    </Shell>
  )
}
