// ─── 🏆📊🖋️ VITRINE DA LISTA DE SALAS (13/10, mockup aprovado pelo Diego) ────────
// Embaixo do "🔄 Atualizar lista": três caixas pra dar vontade de jogar.
//  · 🏆 Campeões de hoje — na ORDEM DE QUEM VAI GANHANDO (o mais recente em cima). Só gente: sai
//    do `human_results` que a sala grava no fim, então bot nunca aparece. "Hoje" = Brasília.
//  · 📊 Ranking da semana — títulos online desde segunda 0h (Brasília), top 5 + a SUA posição.
//  · 🖋️ Último batismo — só o mais novo (maior nº de sócio de batismo), com escudo e mascote.
// Tudo vem PRONTO do banco numa chamada só (`esc_vitrine_salas`, docs/sql/vitrine-salas.sql):
// a semana tem ~900 linhas de campeão e baixar isso no celular a cada lista seria tráfego à toa.
// Banco sem resposta = a vitrine simplesmente não aparece (nunca trava a lista de salas).
import { useEffect, useState } from 'react'
import { buscaVitrine, type Vitrine } from './vitrine-dados'
import { tr, getLang } from './lang'
import { Escudo } from './escudos'
import { mascoteInteiraDoTime } from './mascotes'
import { MascoteMini } from './mascote-atravessa'
import { ApoieButton } from './screens'

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6'
const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 700 } as const


const TACA: Record<string, [string, string]> = {
  liga: ['🏆 Liga', '🏆 League'], copa: ['🏆 Copa', '🏆 Cup'], libertadores: ['🌎 Liberta', '🌎 Liberta'],
  mundial: ['🌍 Mundial', '🌍 World Cup'], regional: ['🏟️ Regional', '🏟️ Regional'], champions: ['⭐ Champions', '⭐ Champions'],
}
const nomeTaca = (t: string) => { const v = TACA[t]; return v ? (getLang() === 'en' ? v[1] : v[0]) : `🏆 ${t}` }
const haQuanto = (iso: string) => {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (min < 2) return tr('agora há pouco', 'just now')
  if (min < 60) return tr(`há ${min} min`, `${min} min ago`)
  const h = Math.round(min / 60)
  return tr(`há ${h} h`, `${h} h ago`)
}
const medalha = (p: number) => (p === 1 ? '🥇' : p === 2 ? '🥈' : p === 3 ? '🥉' : `${p}º`)

function Caixa({ titulo, sub, escura = false, children }: { titulo: string; sub: string; escura?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ background: escura ? 'linear-gradient(150deg,#1f1a14,#0c0c0c)' : CREME, color: escura ? '#fff' : INK, border: `3px solid ${INK}`, borderRadius: 16, boxShadow: `4px 4px 0 ${INK}`, padding: '12px 12px 10px' }}>
      <p style={{ ...OSW, margin: 0, fontSize: 17, textTransform: 'uppercase', color: escura ? GOLD : INK }}>{titulo}</p>
      <p style={{ margin: '2px 0 8px', fontSize: 11, fontWeight: 700, color: escura ? '#bbb' : '#5a5240' }}>{sub}</p>
      {children}
    </div>
  )
}

export function VitrineSalas({ logado }: { logado: boolean }) {
  const [v, setV] = useState<Vitrine | null>(null)
  useEffect(() => {
    let vivo = true
    void buscaVitrine().then(d => { if (vivo && d) setV(d) })
    return () => { vivo = false }
  }, [])
  if (!v) return null
  const euNoTop = !!v.eu && v.semana.some(s => s.nome === v.eu!.nome && s.titulos === v.eu!.titulos)
  const mascote = v.batismo ? mascoteInteiraDoTime(v.batismo.clube) : null
  return (
    <div className="space-y-3.5" style={{ marginTop: 6 }}>
      <Caixa titulo={tr('🏆 Campeões de hoje', '🏆 Today’s champions')} sub={tr('Quem levantou taça nas salas online hoje — só gente, nunca bot.', 'Who lifted a trophy in the online rooms today — people only, never bots.')}>
        {v.hoje.length === 0
          ? <p style={{ margin: 0, fontSize: 12, fontWeight: 800 }}>{tr('Ninguém levantou taça hoje ainda. O primeiro pode ser você! 👀', 'Nobody has lifted a trophy today yet. The first one could be you! 👀')}</p>
          : v.hoje.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 2px', borderTop: i ? '1.5px solid #0001' : 'none' }}>
              <span style={{ fontSize: 17 }}>🏆</span>
              <b style={{ ...OSW, flex: 1, fontSize: 14, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.time || c.nome}</b>
              {c.titulos.slice(0, 2).map(t => <span key={t} style={{ ...OSW, fontSize: 11, background: GOLD, border: `2px solid ${INK}`, borderRadius: 999, padding: '1px 8px', whiteSpace: 'nowrap' }}>{nomeTaca(t)}</span>)}
              <span style={{ fontSize: 10, fontWeight: 700, color: '#7a705a', width: 58, textAlign: 'right', flex: 'none' }}>{haQuanto(c.em)}</span>
            </div>
          ))}
      </Caixa>

      {v.semana.length > 0 && (
        <Caixa titulo={tr('📊 Ranking da semana', '📊 Ranking of the week')} sub={tr('Os técnicos com mais títulos online nesta semana.', 'The managers with the most online titles this week.')}>
          {v.semana.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 6px', borderRadius: 9, ...(i === 0 ? { background: `linear-gradient(90deg,#FFE79A,${GOLD})`, border: `2px solid ${INK}` } : { borderTop: '1.5px solid #0001' }) }}>
              <span style={{ ...OSW, fontSize: 15, width: 26, textAlign: 'center' }}>{medalha(s.pos)}</span>
              <b style={{ ...OSW, flex: 1, fontSize: 14, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.nome}</b>
              <span style={{ ...OSW, fontSize: 15 }}>{s.titulos} <span style={{ fontSize: 10, fontWeight: 600 }}>{s.titulos === 1 ? tr('título', 'title') : tr('títulos', 'titles')}</span></span>
            </div>
          ))}
          {logado && !euNoTop && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 6px', marginTop: 6, border: `2px dashed ${INK}`, borderRadius: 9, background: '#fff' }}>
              {v.eu
                ? <><span style={{ ...OSW, fontSize: 13, width: 26, textAlign: 'center' }}>{v.eu.pos}º</span><b style={{ ...OSW, flex: 1, fontSize: 13 }}>{tr('Você', 'You')} · {v.eu.nome}</b><span style={{ ...OSW, fontSize: 13 }}>{v.eu.titulos} {v.eu.titulos === 1 ? tr('título', 'title') : tr('títulos', 'titles')}</span></>
                : <b style={{ ...OSW, flex: 1, fontSize: 12.5 }}>{tr('Você ainda não tem título nesta semana — bora pra uma sala! ⚽', 'No title for you this week yet — jump into a room! ⚽')}</b>}
            </div>
          )}
          <p style={{ margin: '7px 0 0', fontSize: 10.5, fontWeight: 700, color: '#5a5240' }}>{tr('⏳ Zera toda segunda às 0h. Conta Liga, Copa, Liberta, Champions, Mundial e Copas regionais das salas online.', '⏳ Resets every Monday at midnight. Counts League, Cup, Liberta, Champions, World Cup and regional Cups in online rooms.')}</p>
        </Caixa>
      )}

      {v.batismo && (
        <Caixa escura titulo={tr('🖋️ Último batismo', '🖋️ Latest named club')} sub={tr('O clube mais novo do jogo — de um jogador de verdade.', 'The newest club in the game — from a real player.')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Escudo nome={v.batismo.clube} size={70} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ ...OSW, margin: 0, fontSize: 20, textTransform: 'uppercase', lineHeight: 1.05 }}>{v.batismo.clube}</p>
              <p style={{ margin: '3px 0 0', fontSize: 11.5, fontWeight: 700, color: '#ddd' }}>{tr('chegou no jogo em', 'joined the game on')} {v.batismo.desde.split('-').reverse().slice(0, 2).join('/')}</p>
            </div>
            {mascote && <span style={{ flex: 'none', margin: '-8px -4px -6px 0' }}><MascoteMini art={mascote} alt={88} /></span>}
          </div>
          <ApoieButton startScreen="batismo" trigger={open => (
            <button onClick={open} style={{ ...OSW, width: '100%', marginTop: 10, fontSize: 14, background: GOLD, color: INK, border: `3px solid ${INK}`, borderRadius: 12, boxShadow: `3px 3px 0 ${INK}`, padding: 9, cursor: 'pointer' }}>
              {tr('🖋️ QUERO BATIZAR O MEU CLUBE →', '🖋️ I WANT TO NAME MY CLUB →')}
            </button>
          )} />
        </Caixa>
      )}
    </div>
  )
}
