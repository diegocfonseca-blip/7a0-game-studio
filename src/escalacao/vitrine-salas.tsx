// ─── 🏆📊🖋️ VITRINE DA LISTA DE SALAS (13/10, mockup aprovado pelo Diego) ────────
// Embaixo do "🔄 Atualizar lista": três caixas pra dar vontade de jogar.
//  · 🏆 Campeões de hoje — na ORDEM DE QUEM VAI GANHANDO (o mais recente em cima). Só gente: sai
//    do `human_results` que a sala grava no fim, então bot nunca aparece. "Hoje" = Brasília.
//  · 📊 Ranking da semana — títulos online desde segunda 0h (Brasília), top 5 + a SUA posição.
//  · 🖋️ Último batismo — só o mais novo (maior nº de sócio de batismo), com escudo e mascote.
// Tudo vem PRONTO do banco numa chamada só (`esc_vitrine_salas`, docs/sql/vitrine-salas.sql):
// a semana tem ~900 linhas de campeão e baixar isso no celular a cada lista seria tráfego à toa.
// Banco sem resposta = a vitrine simplesmente não aparece (nunca trava a lista de salas).
import { EmblemaCla, clasLiberado } from './cla' // ⚔️ 21/10: ranking dos clãs da semana
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { buscaVitrine, type Vitrine } from './vitrine-dados'
import { tr, getLang } from './lang'
import { PodioMoldura } from './podio-semana'
import { stripEmoji } from './apoio'
import { Escudo } from './escudos'
import { mascoteInteiraDoTime } from './mascotes'
import { MascoteMini } from './mascote-atravessa'
import { ApoieButton } from './screens'
import { RANKING_SEMANA_MOEDAS } from './store'
import { ClaVer } from './cla-ver' // 👆 21/10: tocar no clã abre a janela com os membros e o entrar/pedir
import { abreAmigosSolto, abrePerfilSolto, contaValida } from './amigos' // 👆 21/10: tocar no técnico abre o perfil (amigo, clã)

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D'
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
// 🖋️ BATISMO EM DESTAQUE (13/10, Diego: "troque o último batismo do Rossini pelo do K9 e não quero mais que seja último
// batismo… vou fazer uns rodízios"). Quem escolhe o clube é o Diego: pra trocar, é só mudar esta linha (clube + data
// em que ele chegou no jogo). Não depende mais do banco.
const DESTAQUE = { clube: 'Labubu FC', desde: '2026-10-14' } // 🔁 21/10: Labubu FC (Diego: "troque o batizado em destaque das salas online pro Labubu") · antes: K9 FC (16/10)
const medalha = (p: number) => (p === 1 ? '🥇' : p === 2 ? '🥈' : p === 3 ? '🥉' : `${p}º`)

// ⚔️ RANKING DOS CLÃS DA SEMANA (21/10, Diego: "o ranking da semana também terá de clãs agora"): os 5 clãs com mais títulos
// online na semana (a MESMA conta do ranking dos técnicos, somada por clã). Uma leitura quando a lista de salas abre.
type ClaRank = { id: number; nome: string; emblema: string; membros: number; titulos: number; pos: number }
export function RankingClasCaixa() {
  const [l, setL] = useState<ClaRank[] | null>(null)
  const [ver, setVer] = useState<number | null>(null)
  useEffect(() => { let vivo = true; supabase.rpc('esc_cla_ranking').then(({ data }) => { if (vivo) setL(((data ?? []) as ClaRank[]).slice(0, 5)) }, () => {}); return () => { vivo = false } }, [])
  if (!l) return null // 🔁 21/10 (Diego): a caixa aparece SEMPRE, mesmo sem clã nenhum — vazia, ela chama a galera pra criar o primeiro
  return (
    <Caixa titulo={tr('⚔️ Clãs da semana', '⚔️ Clans of the week')} sub={tr('Todo título online de cada membro soma pro clã. Zera segunda.', 'Every member’s online title adds to the clan. Resets Monday.')}>
      {l.length === 0 && <div style={{ textAlign: 'center', padding: '8px 4px', border: `2px dashed ${INK}`, borderRadius: 10, background: '#fff' }}>
        <p style={{ ...OSW, margin: 0, fontSize: 15 }}>⚔️ {tr('Nenhum clã ainda', 'No clans yet')}</p>
        <p style={{ margin: '3px 0 0', fontSize: 11.5, fontWeight: 700, color: '#5a5240' }}>{tr('Seja o primeiro: 👥 Amigos → ⚔️ Clã. Entrar é de graça; criar é de quem tem plano.', 'Be the first: 👥 Friends → ⚔️ Clan. Joining is free; creating needs a plan.')}</p>
      </div>}
      {l.map((c, i) => (
        <div key={c.id} role="button" tabIndex={0} onClick={() => setVer(c.id)} onKeyDown={e => { if (e.key === 'Enter') setVer(c.id) }} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 6px', borderRadius: 9, ...(i === 0 && c.titulos > 0 ? { background: `linear-gradient(90deg,#FFE79A,${GOLD})`, border: `2px solid ${INK}` } : i ? { borderTop: '1.5px solid #0001' } : {}) }}>
          <span style={{ ...OSW, fontSize: 15, width: 26, textAlign: 'center' }}>{c.titulos > 0 ? medalha(c.pos) : `${c.pos}º`}</span>
          <EmblemaCla emblema={c.emblema} size={24} />
          <b style={{ ...OSW, flex: 1, fontSize: 14, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.nome}</b>
          <span style={{ ...OSW, fontSize: 15 }}>{c.titulos} <span style={{ fontSize: 10, fontWeight: 600 }}>{c.titulos === 1 ? tr('título', 'title') : tr('títulos', 'titles')}</span></span>
          <span style={{ ...OSW, fontSize: 16, color: '#0006' }}>›</span>
        </div>
      ))}
      {/* ⚔️ 29/10 (Diego: "coloque enfileirados ali embaixo dos nomes… até agora ninguém fez o 4º clã"): a lista vai sempre até o 5º —
          as posições sem clã viram VAGA ABERTA com o botão de criar ali mesmo, e embaixo os dois caminhos lado a lado (entrar · criar).
          Os dois levam pra aba ⚔️ Clã dos Amigos (lá tem a busca e o criar). */}
      {l.length > 0 && Array.from({ length: Math.max(0, 5 - l.length) }, (_, k) => l.length + k + 1).map(p => (
        <div key={`vaga${p}`} role="button" tabIndex={0} onClick={() => abreAmigosSolto('cla')} onKeyDown={e => { if (e.key === 'Enter') abreAmigosSolto('cla') }}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '5px 6px', marginTop: 4, borderRadius: 9, border: `2px dashed #0C0C0C55`, background: '#ffffff80' }}>
          <span style={{ ...OSW, fontSize: 15, width: 26, textAlign: 'center', color: '#0007' }}>{p}º</span>
          <span style={{ width: 24, height: 24, borderRadius: 7, border: `2px dashed #0C0C0C55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>⚔️</span>
          <b style={{ ...OSW, flex: 1, fontSize: 13.5, color: '#0009', minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tr('Vaga aberta — seu clã aqui', 'Open spot — your clan here')}</b>
          <span style={{ ...OSW, fontSize: 11, background: GOLD, color: INK, border: `2px solid ${INK}`, borderRadius: 999, padding: '1px 9px', boxShadow: `2px 2px 0 ${INK}` }}>+ {tr('CRIAR', 'CREATE')}</span>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 9 }}>
        <button onClick={() => abreAmigosSolto('cla')} style={{ ...OSW, flex: 1, fontSize: 13, background: '#fff', color: INK, border: `2.5px solid ${INK}`, borderRadius: 12, padding: '8px 6px', boxShadow: `3px 3px 0 ${INK}`, cursor: 'pointer' }}>🔎 {tr('Entrar num clã', 'Join a clan')}</button>
        <button onClick={() => abreAmigosSolto('cla')} style={{ ...OSW, flex: 1, fontSize: 13, background: GOLD, color: INK, border: `2.5px solid ${INK}`, borderRadius: 12, padding: '8px 6px', boxShadow: `3px 3px 0 ${INK}`, cursor: 'pointer' }}>⚔️ {tr('Criar meu clã', 'Create my clan')}</button>
      </div>
      {l.length > 0 && <p style={{ margin: '5px 0 0', fontSize: 10.5, fontWeight: 800, color: '#7C3AED', textAlign: 'center' }}>👆 {tr('Toque num clã da lista pra ver os membros.', 'Tap a clan in the list to see its members.')}</p>}
      {ver !== null && <ClaVer id={ver} onClose={() => setVer(null)} />}
      <p style={{ margin: '7px 0 0', fontSize: 11, fontWeight: 800, color: INK }}>{tr('🎁 Prêmio pra CADA membro que está no clã desde segunda: 🥇 30 · 🥈 20 · 🥉 10 🪙 pra carreira + o clã no 📺 telão a semana toda.', '🎁 Prize for EVERY member in the clan since Monday: 🥇 30 · 🥈 20 · 🥉 10 🪙 for career + the clan on the 📺 big screen all week.')}</p>
      <p style={{ margin: '4px 0 0', fontSize: 10.5, fontWeight: 700, color: '#5a5240' }}>{tr('O clã campeão joga a semana seguinte com 🏆 no selo de cada membro. Entre num clã em 👥 Amigos → ⚔️ Clã.', 'The champion clan plays the next week with 🏆 on every member’s badge. Join a clan in 👥 Friends → ⚔️ Clan.')}</p>
    </Caixa>
  )
}

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
  const mascote = mascoteInteiraDoTime(DESTAQUE.clube)
  return (
    <div className="space-y-3.5" style={{ marginTop: 6 }}>
      {/* 🔨 SELO DE NOVIDADE (Diego 13/10: "um selinho pra pessoa saber que tudo pra baixo é novo"). Some
          sozinho depois de 27/10, ninguém precisa apagar. Mesmo formato dos selos do aviso da comunidade. */}
      {Date.now() < Date.parse('2026-10-28T03:00:00Z') && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: -4 }}>
          <span style={{ ...OSW, display: 'inline-flex', alignItems: 'center', gap: 5, background: '#7C3AED', color: '#fff', border: `3px solid ${INK}`, borderRadius: 10, boxShadow: `3px 3px 0 ${INK}`, padding: '3px 10px', fontSize: 13, letterSpacing: '.08em', textTransform: 'uppercase' }}>🔨 {tr('Novidade', 'New')}</span>
          <span style={{ fontSize: 11.5, fontWeight: 800, color: '#F4ECD6', textShadow: '0 1px 2px rgba(0,0,0,.6)' }}>{tr('tudo aqui embaixo é novo ↓', 'everything below is new ↓')}</span>
        </div>
      )}
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

      {(v.semana.length > 0 || (v.passada?.length ?? 0) > 0) && (
        <Caixa titulo={tr('📊 Ranking da semana', '📊 Ranking of the week')} sub={tr('Os técnicos com mais títulos online nesta semana.', 'The managers with the most online titles this week.')}>
          {v.semana.length === 0 && <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 800 }}>{tr('Semana nova, ranking zerado. O primeiro título é seu? ⚽', 'New week, fresh ranking. Will the first title be yours? ⚽')}</p>}
          {/* 🏆 16/10 (Diego: "no ranking coloque a moldura que falamos"): o top 3 aparece aqui com a MESMA moldura de
              metal + fita que ele já leva na lista de técnicos da sala (`podio-semana.tsx`). A posição vem do ranking. */}
          {v.semana.map((s, i) => (
            <PodioMoldura key={i} pos={(s.pos >= 1 && s.pos <= 3 ? s.pos : 0) as 0 | 1 | 2 | 3}>
              <div role={contaValida(s.uid) ? 'button' : undefined} onClick={() => { if (contaValida(s.uid)) abrePerfilSolto(s.uid) }} style={{ cursor: contaValida(s.uid) ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 6px', borderRadius: 9, ...(i === 0 ? { background: `linear-gradient(90deg,#FFE79A,${GOLD})`, border: `2px solid ${INK}` } : s.pos > 3 ? { borderTop: '1.5px solid #0001' } : {}) }}>
                <span style={{ ...OSW, fontSize: 15, width: 26, textAlign: 'center' }}>{medalha(s.pos)}</span>
                <b style={{ ...OSW, flex: 1, fontSize: 14, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.nome}</b>
                <span style={{ ...OSW, fontSize: 15 }}>{s.titulos} <span style={{ fontSize: 10, fontWeight: 600 }}>{s.titulos === 1 ? tr('título', 'title') : tr('títulos', 'titles')}</span></span>
                {contaValida(s.uid) && <span style={{ ...OSW, fontSize: 16, color: '#0006' }}>›</span>}
              </div>
            </PodioMoldura>
          ))}
          {v.semana.some(s => contaValida(s.uid)) && <p style={{ margin: '5px 0 0', fontSize: 10.5, fontWeight: 800, color: '#7C3AED' }}>👆 {tr('Toque num técnico pra ver o perfil, chamar de amigo ou pro seu clã.', 'Tap a manager to see the profile, add as a friend or invite to your clan.')}</p>}
          {logado && !euNoTop && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 6px', marginTop: 6, border: `2px dashed ${INK}`, borderRadius: 9, background: '#fff' }}>
              {v.eu
                ? <><span style={{ ...OSW, fontSize: 13, width: 26, textAlign: 'center' }}>{v.eu.pos}º</span><b style={{ ...OSW, flex: 1, fontSize: 13 }}>{tr('Você', 'You')} · {v.eu.nome}</b><span style={{ ...OSW, fontSize: 13 }}>{v.eu.titulos} {v.eu.titulos === 1 ? tr('título', 'title') : tr('títulos', 'titles')}</span></>
                : <b style={{ ...OSW, flex: 1, fontSize: 12.5 }}>{tr('Você ainda não tem título nesta semana — bora pra uma sala! ⚽', 'No title for you this week yet — jump into a room! ⚽')}</b>}
            </div>
          )}
          {/* 🏆 19/10 (Diego: "embaixo do ranking fica em uma linha listado os 3 primeiros da semana"): o pódio da última semana FECHADA,
              fixo a semana inteira; na outra segunda troca sozinho. Mockup `scripts/mockups/podio-30d.png`. */}
          {(v.passada?.length ?? 0) > 0 && (
            <div style={{ marginTop: 10, border: `3px solid ${INK}`, borderRadius: 12, background: '#F4ECD6', boxShadow: `3px 3px 0 ${INK}`, padding: '7px 10px' }}>
              <span style={{ ...OSW, display: 'block', fontSize: 10, letterSpacing: '.14em', color: '#7C3AED', marginBottom: 3 }}>{tr('🏆 PÓDIO DA SEMANA PASSADA', '🏆 LAST WEEK’S PODIUM')}</span>
              {v.passada!.map((p, i) => (
                <div key={i} onClick={() => { if (contaValida(p.uid)) abrePerfilSolto(p.uid) }} style={{ cursor: contaValida(p.uid) ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 6, lineHeight: 1.45 }}>
                  <span style={{ fontSize: 13 }}>{medalha(p.pos)}</span>
                  <b style={{ ...OSW, flex: 1, fontSize: 13.5, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stripEmoji(p.nome).trim()}</b>
                  <span style={{ ...OSW, fontSize: 12 }}>{p.titulos} {p.titulos === 1 ? tr('título', 'title') : tr('títulos', 'titles')}</span>
                </div>
              ))}
            </div>
          )}
          <p style={{ margin: '7px 0 0', fontSize: 10.5, fontWeight: 700, color: '#5a5240' }}>{tr('⏳ Zera toda segunda às 0h. Os 3 primeiros jogam a semana com a medalha 🥇🥈🥉 ao lado do nome, a moldura de metal e a fita "1º DA SEMANA" nas salas e no chat. Quem fecha a semana no pódio fica com a medalha no nome por 30 dias.', '⏳ Resets every Monday at midnight. The top 3 play the week with the 🥇🥈🥉 medal next to their name, the metal frame and the "#1 OF THE WEEK" ribbon in the rooms and the chat. Whoever closes the week on the podium keeps the medal on their name for 30 days.')}</p>
          {/* 🪙 17/10 (Diego: "encaixa sutilmente aí… 1º 20 · 2º 10 · 3º 5") — o mesmo número de RANKING_SEMANA_MOEDAS */}
          <p style={{ margin: '4px 0 0', fontSize: 10.5, fontWeight: 800, color: GREEN }}>{tr(`🪙 E leva moedas pra carreira quando a semana fecha: 1º ${RANKING_SEMANA_MOEDAS[1]} · 2º ${RANKING_SEMANA_MOEDAS[2]} · 3º ${RANKING_SEMANA_MOEDAS[3]} — e 📺 propaganda da vitória no telão de TODAS as salas, a semana inteira.`, `🪙 Plus career coins when the week closes: #1 ${RANKING_SEMANA_MOEDAS[1]} · #2 ${RANKING_SEMANA_MOEDAS[2]} · #3 ${RANKING_SEMANA_MOEDAS[3]} — and 📺 your win advertised on the ticker in EVERY room, all week long.`)}</p>
        </Caixa>
      )}
      {clasLiberado() && <RankingClasCaixa />}

      {(
        <Caixa escura titulo={tr('🖋️ Batismo em destaque', '🖋️ Featured named club')} sub={tr('Um clube de verdade, de um jogador do Leilão Legends.', 'A real club, from a Leilão Legends player.')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Escudo nome={DESTAQUE.clube} size={70} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ ...OSW, margin: 0, fontSize: 20, textTransform: 'uppercase', lineHeight: 1.05 }}>{DESTAQUE.clube}</p>
              <p style={{ margin: '3px 0 0', fontSize: 11.5, fontWeight: 700, color: '#ddd' }}>{tr('no jogo desde', 'in the game since')} {DESTAQUE.desde.split('-').reverse().slice(0, 2).join('/')}</p>
            </div>
            {mascote && <span style={{ flex: 'none', margin: '-22px -6px -14px 0' }}><MascoteMini art={mascote} alt={140} /></span>}
          </div>
          <ApoieButton startScreen="batismoInfo" trigger={open => (
            <button onClick={open} style={{ ...OSW, width: '100%', marginTop: 10, fontSize: 14, background: GOLD, color: INK, border: `3px solid ${INK}`, borderRadius: 12, boxShadow: `3px 3px 0 ${INK}`, padding: 9, cursor: 'pointer' }}>
              {tr('🖋️ QUERO BATIZAR O MEU CLUBE →', '🖋️ I WANT TO NAME MY CLUB →')}
            </button>
          )} />
        </Caixa>
      )}
    </div>
  )
}
