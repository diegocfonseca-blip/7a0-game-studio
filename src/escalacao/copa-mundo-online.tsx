// ─── 🌐 COPA DO MUNDO ONLINE — a Copa da TURMA ───────────────────────────────
//
// 🌐 POR QUE ESTE GLOBO E NÃO O 🌍: no seletor "Depois da liga" a Copa do Mundo
// fica LADO A LADO com a Libertadores (🌎), e o Diego pegou na tela: *"acho que
// tem que ter uma diferenciação do emoji de mundo e liberta"*. Ele tem razão —
// 🌍 e 🌎 são o mesmo desenho girado, e no tamanho de um botão viram a mesma
// bolinha azul. O 🌐 é grade branca sobre azul: some a dúvida de longe.
//
// Pedido do Diego (31/08): *"faça a copa do mundo online, pegando o que já
// existe no modo carreira"*. E é exatamente isso: o torneio aqui é o MESMO
// `simulaCopaMundo` da carreira, a mesma convocação, o mesmo placar ao vivo.
// Este arquivo só resolve o que a carreira não precisava resolver — várias
// pessoas escolhendo seleção ao mesmo tempo.
//
// ── ⚠️ POR QUE ISTO É SEGURO (regra #1 do Diego: nunca quebrar o futebol) ────
// A Copa NÃO PASSA PELO MOTOR DO LEILÃO. Nada de assento (`player_index`),
// nada de reducer, nada de `RESTORE_ONLINE` — que é justamente de onde vieram
// os piores bugs da casa ("virei bot", "dei lance por outro"). A sala fica
// paradinha em `waiting` o tempo todo e a Copa é uma tela POR CIMA dela.
// Reverter = tirar a tela; a sala continua uma sala normal.
//
// ── COMO TODO MUNDO VÊ A MESMA COPA SEM SINCRONIZAR NADA ────────────────────
// `simulaCopaMundo(entrants, seed, edição)` é função PURA e semeada: mesma
// entrada = mesma Copa, jogo por jogo, gol por gol. Então não existe "host
// mandando resultado": o host só publica a FICHA da Copa (a semente + os 24
// times com as 11 chaves de cada um) e cada aparelho recalcula o torneio
// inteirinho sozinho. Se a internet de alguém cair no meio, ele volta e a Copa
// está no mesmo lugar — não tem o que dessincronizar.
//
// ── O QUE ELA NÃO FAZ (de propósito) ────────────────────────────────────────
// Não paga moeda de clube (sala não tem caixa), não escreve no mural do Rank e
// não grava título em `esc_results`. Subir no ranking mundial continua sendo
// coisa da CARREIRA — foi bug em 17/08 a Copa vazar pra lá, e não vai voltar.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ONLINE_VISUAL_RELEASED } from './online-release'
import { CompetitionStage } from './online-match-visual'
import { NationalCrest } from './national-crest'
import { useCopaClockPreview } from './copa-clock-preview'
import { simulaCopaMundo } from './copa-mundo'
import { PASSO_COPA } from './copa-passos'
import { agoraSala } from './relogio' // ⏱️ o relógio da sala é o do DONO (ver relogio.ts)
import { pensRevealDelay } from './pyramidseason'
import './online-match-visual.css'
import { supabase } from '../lib/supabase'
import { rankingSelecoes } from './paises'
import { tr, getLang, ordinal } from './lang' // 🌐 BR/EN
import {
  CMModal, ConvocacaoScreen, CupScreen, COPA_TEAMS, flagOf,
  countryPool, xiPorChaves, xiDaMaquina, xiStrength, completaXI,
  type Entrant, type Formation, type CopaSave,
} from './copa-mundo'

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D'
// tira emoji do nome do técnico (o selo de apoio vem colado no manager_name)
const stripEmojiSimples = (n: string) => n.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2B00}-\u{2BFF}]/gu, '').trim() || tr('Técnico', 'Manager')
const OSWALD = { fontFamily: "'Oswald','Arial Narrow',system-ui,sans-serif" } as const
const box = (bg: string) => ({ border: `3px solid ${INK}`, borderRadius: 14, boxShadow: `4px 4px 0 0 ${INK}`, background: bg }) as const

// ── a escolha de UMA pessoa, do jeito que ela mora em `room_players.copa` ────
export interface CopaPick { pais: string; xiKeys: string[]; form: Formation }
export const copaPickOk = (p?: CopaPick | null): p is CopaPick =>
  !!p && typeof p.pais === 'string' && Array.isArray(p.xiKeys) && p.xiKeys.length === 11

// ── a FICHA da Copa, que o host publica em `game_state.copaMundo` ────────────
// `nome` é o nome do técnico (ou do país, no caso da máquina) — é o que aparece
// na tabela. `uid` só existe nas seleções de GENTE: é por ele que cada aparelho
// descobre qual das 24 é a dele (o `you`), sem depender de assento nenhum.
export interface CopaTime { pais: string; nome: string; uid?: string; xiKeys?: string[] }
export interface CopaFicha {
  seed: number; edicao: number; times: CopaTime[]
  /** 🏺 esta Copa nasceu DEPOIS do sorteio por potes? Vem de `criada_em` da linha
   *  no banco (ver `POTES_DESDE`). Copa que já estava rolando termina com o
   *  sorteio velho — trocar o chaveamento no meio do caminho é o estrago de
   *  04/08 ("mudou o resultado da Copa"). */
  potes?: boolean
}

// 🏺 O INSTANTE EM QUE O SORTEIO POR POTES ENTROU NO AR (Diego, 20/09: *"a Copa
// do Mundo deveria sempre ter os países mais fortes sendo cabeça de chave"*).
// Copa criada ANTES disto segue com o embaralhamento cru até acabar.
export const POTES_DESDE = Date.parse('2026-09-20T22:00:00Z')
export const copaTemPotes = (criadaEm?: string | null): boolean =>
  !!criadaEm && Date.parse(criadaEm) >= POTES_DESDE

/** as 24 seleções do jogo, na ordem de quem tem mais carta no baralho */
export const paisesDaCopa = (): string[] => rankingSelecoes().slice(0, COPA_TEAMS).map(p => p.pais)

// ── o host monta a ficha: gente primeiro, máquina completando até 24 ─────────
// A ordem é ESTÁVEL (ordenada pelo uid) pra que dois hosts, ou o mesmo host
// clicando duas vezes, produzam a mesma lista — e a Copa não mude de cara.
export function montaFicha(
  gente: { uid: string; nome: string; pick: CopaPick }[],
  seed: number,
  edicao: number,
): CopaFicha {
  const ordenada = [...gente].sort((a, b) => a.uid.localeCompare(b.uid))
  const times: CopaTime[] = []
  const pegos = new Set<string>()
  for (const g of ordenada) {
    if (pegos.has(g.pick.pais)) continue // duas pessoas na mesma seleção: a 1ª leva (a tela já impede)
    pegos.add(g.pick.pais)
    times.push({ pais: g.pick.pais, nome: g.nome, uid: g.uid, xiKeys: g.pick.xiKeys })
  }
  for (const p of paisesDaCopa()) {
    if (times.length >= COPA_TEAMS) break
    if (pegos.has(p)) continue
    pegos.add(p)
    times.push({ pais: p, nome: p })
  }
  return { seed, edicao, times }
}

// ── de FICHA pra Entrant[] (o que o motor do torneio come) ───────────────────
// Roda igual em todo aparelho: as cartas vêm do catálogo, que é o mesmo pra
// todo mundo. `meuUid` só decide qual seleção é a SUA na tela.
export function entrantesDaFicha(ficha: CopaFicha, meuUid?: string): Entrant[] {
  return ficha.times.map(t => {
    const xi = t.xiKeys?.length ? xiPorChaves(t.pais, t.xiKeys) : xiDaMaquina(t.pais).xi
    return { club: t.nome, you: !!t.uid && t.uid === meuUid, pais: t.pais, xi, str: xiStrength(xi) }
  })
}

// ─── 1) A ESCOLHA, dentro da sala de espera ──────────────────────────────────
// Mesmo desenho já provado do 🃏 Bafo: cada um escreve a PRÓPRIA linha e todo
// mundo lê as dos outros — é assim que a tela sabe quais seleções já foram
// pegas sem inventar canal nenhum.
export function EscolhaSelecao({ roomId, meuUid, minha, pegasPorOutros, aoEscolher }: {
  roomId: string
  meuUid: string
  minha: CopaPick | null
  pegasPorOutros: { pais: string; nome: string }[]
  aoEscolher: () => void
}) {
  const [tela, setTela] = useState<'off' | 'pais' | 'convoca'>('off')
  const [pais, setPais] = useState<string | null>(null)
  const [erro, setErro] = useState('')
  const paises = useMemo(paisesDaCopa, [])
  const donoDe = useMemo(() => new Map(pegasPorOutros.map(p => [p.pais, p.nome])), [pegasPorOutros])

  async function grava(p: CopaPick) {
    setErro('')
    // 🛡️ ÚLTIMA CONFERIDA ANTES DE GRAVAR: entre abrir a lista e terminar a
    // convocação (que leva um tempo bom) alguém pode ter pegado o país. Reler
    // aqui é o que evita duas pessoas com a MESMA seleção — e a tela diz o
    // porquê em vez de simplesmente não funcionar.
    const { data } = await supabase.from('room_players').select('user_id, copa').eq('room_id', roomId)
    const conflito = ((data ?? []) as { user_id: string; copa: CopaPick | null }[])
      .some(r => r.user_id !== meuUid && r.copa?.pais === p.pais)
    if (conflito) { setErro(getLang() === 'en' ? `Someone took ${p.pais} while you were calling up. Pick another — the team you built isn't lost, just redo it with the new country.` : `Alguém pegou a ${p.pais} enquanto você convocava. Escolhe outra — o time que você montou não se perde, é só refazer com o país novo.`); setTela('pais'); return }
    const { error } = await supabase.from('room_players').update({ copa: p }).eq('room_id', roomId).eq('user_id', meuUid)
    if (error) { setErro(tr('Não consegui gravar sua seleção. Tenta de novo em instantes.', 'Couldn\'t save your team. Try again in a moment.')); return }
    setTela('off'); aoEscolher()
  }

  return (
    <>
      <div style={{ ...box(minha ? '#EAF6EE' : '#FFF6D6'), padding: '10px 12px', marginBottom: 10 }}>
        <p style={{ ...OSWALD, fontWeight: 900, fontSize: 13, margin: 0, textTransform: 'uppercase' }}>
          {minha ? `${flagOf(minha.pais)} ${tr('Você é a', 'You are')} ${minha.pais}` : tr('🌐 Escolha a sua seleção', '🌐 Pick your national team')}
        </p>
        <p style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,.6)', margin: '3px 0 0', lineHeight: 1.45 }}>
          {minha
            ? <>{tr('11 convocados no papel. Agora é esperar a turma — o dono da sala abre a Copa quando todo mundo estiver pronto.', '11 called up on paper. Now wait for the crew — the room owner opens the Cup when everyone is ready.')}</>
            : (getLang() === 'en' ? <>Everyone picks <b>one national team</b> and calls up <b>11 players</b> from that country. No auction here: pure call-up, and the team is yours from start to finish of the Cup.</> : <>Cada um pega <b>uma seleção</b> e convoca <b>11 jogadores</b> do país. Não tem leilão aqui: é convocação pura, e o time é seu do começo ao fim da Copa.</>)}
        </p>
        <button onClick={() => { setPais(null); setTela('pais') }}
          style={{ width: '100%', marginTop: 8, border: `2.5px solid ${INK}`, borderRadius: 11, padding: '9px 0', ...OSWALD, fontWeight: 900, fontSize: 13,
            background: minha ? '#fff' : `linear-gradient(150deg,#FFE79A,${GOLD} 55%,#E8A200)`, color: INK, boxShadow: `3px 3px 0 0 ${INK}`, cursor: 'pointer' }}>
          {minha ? tr('🔁 Trocar de seleção', '🔁 Change national team') : tr('🌐 ESCOLHER MINHA SELEÇÃO', '🌐 PICK MY NATIONAL TEAM')}
        </button>
        {erro && <p style={{ fontSize: 10.5, fontWeight: 800, color: '#B23B2E', margin: '6px 0 0', lineHeight: 1.4 }}>{erro}</p>}
      </div>

      {tela === 'pais' && (
        <CMModal>
          <p style={{ ...OSWALD, fontWeight: 900, fontSize: 19, margin: 0, textAlign: 'center', textTransform: 'uppercase' }}>{tr('🌐 Escolha sua seleção', '🌐 Pick your national team')}</p>
          <p style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,.6)', textAlign: 'center', margin: '4px 0 10px', lineHeight: 1.4 }}>
            {getLang() === 'en' ? <>The <b>{COPA_TEAMS}</b> national teams of the Cup. The ones already taken appear greyed out — <b>two people can't take the same country</b>.</> : <>As <b>{COPA_TEAMS}</b> seleções da Copa. As que já têm dono aparecem apagadas — <b>duas pessoas não podem levar o mesmo país</b>.</>}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {paises.map(p => {
              const dono = donoDe.get(p)
              const cartas = countryPool(p)
              const qtd = (['GOL', 'LAT', 'ZAG', 'MEI', 'ATA'] as const).reduce((n, s) => n + cartas[s].length, 0)
              return (
                <button key={p} disabled={!!dono} onClick={() => { setPais(p); setTela('convoca') }}
                  style={{ textAlign: 'left', border: `2.5px solid ${INK}`, borderRadius: 10, padding: '7px 9px', background: dono ? '#ded5bd' : '#fff',
                    opacity: dono ? .65 : 1, cursor: dono ? 'default' : 'pointer', boxShadow: dono ? 'none' : `2px 2px 0 0 ${INK}` }}>
                  <span style={{ ...OSWALD, fontWeight: 900, fontSize: 13, display: 'block' }}>{flagOf(p)} {p}</span>
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(0,0,0,.55)' }}>{dono ? `${tr('já é de', 'taken by')} ${dono}` : `${qtd} ${tr('cartas', 'cards')}`}</span>
                </button>
              )
            })}
          </div>
          <button onClick={() => setTela('off')} style={{ width: '100%', marginTop: 10, border: 'none', background: 'transparent', ...OSWALD, fontWeight: 900, fontSize: 12, color: 'rgba(0,0,0,.5)', textDecoration: 'underline', cursor: 'pointer' }}>{tr('voltar pra sala', 'back to the room')}</button>
        </CMModal>
      )}

      {tela === 'convoca' && pais && (
        <CMModal>
          <ConvocacaoScreen pais={pais} onBack={() => setTela('pais')}
            onDone={(xi, f) => { void grava({ pais, form: f, xiKeys: xi.map(c => `${c.name}|${c.club}|${c.year}`) }) }} />
        </CMModal>
      )}
    </>
  )
}

// ─── 2) O TORNEIO ────────────────────────────────────────────────────────────
// Um `CopaSave` de mentirinha só pra satisfazer a assinatura do CupScreen: no
// modo `online` ele nem encosta nisso (não grava mural, não paga prêmio, não
// escreve em `esc_results` — ver a trava lá dentro).
const SAVE_VAZIO: CopaSave = { anchor: 0, mural: [], played: [], emAndamento: null }

export function CopaDaSala({ ficha, roomId, meuUid, aoCampeao, aoFechar, souDono=false, visible=true }: { ficha: CopaFicha; roomId: string; meuUid?: string; aoCampeao?: (nome: string, pais: string) => void; aoFechar: () => void; souDono?:boolean; visible?:boolean }) {
  const cinematic = ONLINE_VISUAL_RELEASED
  const entrants = useMemo(() => entrantesDaFicha(ficha, meuUid), [ficha, meuUid])
  const clockWorld=useMemo(()=>cinematic?simulaCopaMundo(entrants,ficha.seed,ficha.edicao,ficha.potes):null,[cinematic,entrants,ficha.seed,ficha.edicao,ficha.potes])
  // ⏱️ o tempo a mais dos PÊNALTIS de cada passo, pro relógio da sala esperar a
  // disputa inteira. Os passos vêm de `copa-passos` (jogo único desde 19/09).
  const extraForStep=(step:number)=>{
    if(!clockWorld)return 0
    const ties=step===PASSO_COPA.OITAVAS?clockWorld.r16:step===PASSO_COPA.QUARTAS?clockWorld.qf:step===PASSO_COPA.SEMI?clockWorld.sf:[]
    if(step===PASSO_COPA.FINAL&&clockWorld.final.pen)return Math.round(pensRevealDelay(clockWorld.final.pen)*1000)
    return Math.round(Math.max(0,...ties.map(t=>t.pen?pensRevealDelay(t.pen)*1000:0)))
  }
  const clock=useCopaClockPreview(cinematic,roomId,ficha.edicao,ficha.seed,souDono,extraForStep)
  // 🔑 a IDENTIDADE desta Copa no ranking: sala + semente. A semente muda a cada
  // Copa nova, então jogar Copa atrás de Copa na mesma sala não faz uma apagar a
  // outra (foi exatamente esse o bug do "novo leilão" no ranking, em agosto).
  const online = { seasonKey: `mundo:${roomId}:${ficha.seed}:copamundo`, aoCampeao, clock }
  if(!visible)return null
  return (
    <CMModal wide cinematic={cinematic}>
      <CupScreen entrants={entrants} seasonNo={ficha.edicao} seed={ficha.seed} save={SAVE_VAZIO} potes={ficha.potes}
        myForm="4-3-3" online={online} onClose={aoFechar} />
    </CMModal>
  )
}

// ─── 3) O PAINEL DO DONO — quem já está pronto e o botão de abrir a Copa ─────
export function PainelDaCopa({ prontos, total, souDono, abrindo, aoAbrir }: {
  prontos: { nome: string; pais: string }[]
  total: number
  souDono: boolean
  abrindo: boolean
  aoAbrir: () => void
}) {
  const faltam = total - prontos.length
  const podeAbrir = prontos.length >= 2
  return (
    <div style={{ ...box('#fff'), padding: '10px 12px', marginBottom: 10 }}>
      <p style={{ ...OSWALD, fontWeight: 900, fontSize: 12, margin: '0 0 6px', textTransform: 'uppercase', color: 'rgba(0,0,0,.6)' }}>
        {tr('🌐 Convocados', '🌐 Called up')} · {prontos.length} {tr('de', 'of')} {total}
      </p>
      {prontos.length === 0
        ? <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,.5)', margin: 0 }}>{tr('Ninguém escolheu ainda.', 'Nobody has picked yet.')}</p>
        : prontos.map(p => (
          <div key={p.nome + p.pais} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, fontWeight: 800, padding: '3px 0', borderTop: '1px solid rgba(0,0,0,.08)' }}>
            <span style={{ fontSize: 15 }}>{flagOf(p.pais)}</span>
            <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nome}</span>
            <span style={{ ...OSWALD, fontWeight: 900, color: GREEN }}>{p.pais}</span>
          </div>
        ))}
      {faltam > 0 && (
        <p style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,.55)', margin: '6px 0 0', lineHeight: 1.4 }}>
          {getLang() === 'en' ? <>⏳ {faltam === 1 ? '1 person still has' : `${faltam} people still have`} to pick. Whoever doesn't pick <b>sits out the Cup</b> — the spots become machine teams.</> : <>⏳ {faltam === 1 ? 'Falta 1 pessoa' : `Faltam ${faltam} pessoas`} escolher. Quem não escolher <b>fica de fora da Copa</b> — as vagas viram seleções da máquina.</>}
        </p>
      )}
      {souDono && (
        <>
          <button onClick={aoAbrir} disabled={!podeAbrir || abrindo}
            style={{ width: '100%', marginTop: 8, border: `2.5px solid ${INK}`, borderRadius: 11, padding: '10px 0', ...OSWALD, fontWeight: 900, fontSize: 14,
              background: podeAbrir ? `linear-gradient(150deg,#FFE79A,${GOLD} 55%,#E8A200)` : '#ded5bd', color: INK,
              boxShadow: podeAbrir ? `3px 3px 0 0 ${INK}` : 'none', cursor: podeAbrir && !abrindo ? 'pointer' : 'default' }}>
            {abrindo ? tr('⏳ Abrindo…', '⏳ Opening…') : podeAbrir ? tr('🌐 ABRIR A COPA DO MUNDO', '🌐 OPEN THE WORLD CUP') : tr('🌐 Precisa de 2 seleções', '🌐 Needs 2 national teams')}
          </button>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,.5)', margin: '5px 0 0', lineHeight: 1.4 }}>
            {getLang() === 'en' ? <>The Cup opens <b>on everyone's screen at the same time</b>. There are {COPA_TEAMS} national teams in total — the leftover spots become machine teams.</> : <>A Copa abre <b>na tela de todo mundo ao mesmo tempo</b>. São {COPA_TEAMS} seleções no total — as vagas que sobrarem viram time da máquina.</>}
          </p>
        </>
      )}
    </div>
  )
}

// ─── 3.5) A ESTANTE DA SALA — os campeões de todas as Copas dela ─────────────
// Decisão do Diego (31/08): *"todo título deve valer sempre... e também estante,
// ranking, etc, tudo igual"*. A estante mora na MESMA tabela da liga
// (`game_champions`), então é o mesmo troféu de sempre — só que a "temporada"
// aqui é o número da Copa. A `match_seed` (a semente daquela Copa) é o que impede
// uma edição escrever por cima da outra, exatamente como já valia na liga.
export interface CampeaoDaSala { season_no: number; champion_name: string | null; top_scorer_name: string | null }

/** o DONO grava o campeão da Copa (o banco só deixa o dono mexer depois) */
export async function gravaCampeaoDaCopa(roomId: string, ficha: CopaFicha, campeao: string, pais: string, humanos: string[]): Promise<void> {
  try {
    const { data: existe } = await supabase.from('game_champions').select('id').eq('room_id', roomId).eq('match_seed', ficha.seed).maybeSingle()
    const linha = { champion_name: `${campeao} (${pais})`, humanos }
    if (existe) await supabase.from('game_champions').update(linha).eq('id', existe.id)
    else await supabase.from('game_champions').insert({ room_id: roomId, season_no: ficha.edicao, match_seed: ficha.seed, ...linha })
  } catch { /* nunca trava a Copa */ }
}

export function EstanteDaCopa({ roomId, versao }: { roomId: string; versao: number }) {
  const [linhas, setLinhas] = useState<CampeaoDaSala[] | null>(null)
  useEffect(() => {
    let vivo = true
    void supabase.from('game_champions').select('season_no, champion_name, top_scorer_name').eq('room_id', roomId).order('season_no')
      .then(({ data }) => { if (vivo) setLinhas((data ?? []) as CampeaoDaSala[]) }, () => { if (vivo) setLinhas([]) })
    return () => { vivo = false }
  }, [roomId, versao])
  if (!linhas || linhas.length === 0) return null
  return (
    <div style={{ ...box('#fff'), padding: '10px 12px', marginBottom: 10 }}>
      <p style={{ ...OSWALD, fontWeight: 900, fontSize: 12, margin: '0 0 5px', textTransform: 'uppercase', color: 'rgba(0,0,0,.6)' }}>{tr('🏆 Estante desta sala', '🏆 This room\'s shelf')}</p>
      {linhas.map(l => (
        <div key={l.season_no} style={{ display: 'flex', gap: 7, fontSize: 11.5, fontWeight: 800, padding: '3px 0', borderTop: '1px solid rgba(0,0,0,.08)' }}>
          <span style={{ ...OSWALD, color: 'rgba(0,0,0,.45)', width: 54 }}>{tr('Copa', 'Cup')} {l.season_no}</span>
          <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>🏆 {l.champion_name ?? '—'}</span>
        </div>
      ))}
    </div>
  )
}

// ─── 4) o cabeçalho da sala de Copa (o que a pessoa vê ao entrar) ────────────
export function FaixaCopa() {
  return (
    <div style={{ ...box(`linear-gradient(150deg,#FFE79A,${GOLD} 55%,#E8A200)`), padding: '9px 12px', marginBottom: 10, textAlign: 'center' }}>
      <p style={{ ...OSWALD, fontWeight: 900, fontSize: 15, margin: 0, textTransform: 'uppercase' }}>{tr('🌐 Copa do Mundo Legends', '🌐 Legends World Cup')}</p>
      <p style={{ fontSize: 10, fontWeight: 800, color: 'rgba(0,0,0,.6)', margin: '2px 0 0' }}>{tr('sem leilão · cada um convoca 11 do próprio país', 'no auction · everyone calls up 11 from their own country')} · {COPA_TEAMS} {tr('seleções', 'national teams')}</p>
    </div>
  )
}

// 🔎 hook que fica de olho na coluna `copa` de todo mundo da sala (a mesma
// assinatura de tempo real que a sala já usa pro Bafo).
export function useEscolhasDaCopa(roomId: string | null, versao: number): Record<string, CopaPick | null> {
  const [mapa, setMapa] = useState<Record<string, CopaPick | null>>({})
  useEffect(() => {
    if (!roomId) { setMapa({}); return }
    let vivo = true
    void supabase.from('room_players').select('user_id, copa').eq('room_id', roomId).then(({ data }) => {
      if (!vivo) return
      const m: Record<string, CopaPick | null> = {}
      for (const r of (data ?? []) as { user_id: string; copa: CopaPick | null }[]) m[r.user_id] = r.copa
      setMapa(m)
    })
    return () => { vivo = false }
  }, [roomId, versao])
  return mapa
}


// ─── 5) 🌐 A COPA DEPOIS DA LIGA — com os RELÓGIOS ───────────────────────────
//
// O roteiro é dele, palavra por palavra (01/09):
//   *"vai ser igual o monte de sobra do leilão, muito parecido, com buracos — só
//   que com seleções. O primeiro colocado da liga escolhe a seleção que ele
//   quiser em 45s, depois passa pro segundo, depois pro terceiro, e aí por
//   diante. Quando todos acabarem deve aparecer um cronômetro de 15s com banner
//   da Copa do Mundo explicando que eles devem escolher em 60s os 11 jogadores,
//   e quem não escolher a máquina irá escolher automaticamente os piores 11 da
//   posição."* E na bandeira: *"escolhe a pior seleção quem não escolher em 45s,
//   ou a que ele estiver selecionado"*.
//
// ⏱️ QUEM SEGURA O RELÓGIO: o DONO. Ele grava a vez e o prazo em
// `esc_copa_salas`, e todo mundo obedece o que está gravado. Se cada aparelho
// contasse sozinho, dois jogadores discordariam de quem é a vez — e "de quem é a
// vez" errado é a família de bug mais cara desta casa ("dei lance por outro").
// O dono também é a rede de segurança: se alguém fecha o app no meio da vez, é
// ele que carimba a pior seleção livre e toca o jogo pra frente (o banco deixa:
// a RLS de `room_players` dá update pro dono da sala).
//
// 🕳️ E A CONVOCAÇÃO É DE TODO MUNDO AO MESMO TEMPO, de propósito: a ordem vale
// só pra bandeira (um toque). Se valesse pros 11 também, a sala inteira ficaria
// parada esperando o 1º colocado montar time — e "nada pode atrasar o ritmo do
// jogo" é regra de ouro dele.

export type FaseCopa = 'bandeira' | 'banner' | 'convocacao' | 'torneio'
export interface LugarNaLiga { id: number; nome: string; humano: boolean }
interface LinhaFase { edicao: number; seed: number; fase: FaseCopa; vez_uid: string | null; ate: string | null; times: CopaTime[] | null; campeao: string | null; criada_em?: string | null }
interface LinhaSala { user_id: string; player_index: number; manager_name: string; copa: CopaPick | null }

// ⏱️ OS TRÊS RELÓGIOS, todos escolhidos pelo Diego (01/09):
//   · 65s pra escolher a SELEÇÃO, um de cada vez, na ordem da tabela;
//   · 15s de banner entre as duas fases;
//   · 135s pra CONVOCAR os 11 — todo mundo junto. Era 65s, igual à bandeira;
//     em 02/09 o Diego mandou *"aumente o tempo pra convocação em 70s"* depois
//     que, numa sala de 4, três pessoas não fecharam os 11 a tempo (levaram os
//     piores). Não atrasa ninguém: a fase avança na hora em que TODOS fecham
//     o time (`todosMontaram`); o relógio é só o teto pra quem dorme.
//   · 08/09: a convocação caiu pra 80s (Diego: *"o tempo de cada seleção
//     convocar no online é agora de 80 segundos… e não mais de 100s, no rápido,
//     minhas ligas etc."*). Vale pra TODO online que tem Copa do Mundo — é uma
//     constante só, então não tem como um modo ficar diferente do outro.
//   · 19/09: +10s nos dois (Diego: *"quero que aumente mais 10s pra cada um
//     escolher seu país… e a convocação também aumente mais dez segundos"*).
//     Bandeira 65 → 75s · convocação 80 → 90s. O banner continua 15s.
const SEG_BANDEIRA = 75, SEG_BANNER = 15, SEG_CONVOCA = 90
const temPais = (p?: CopaPick | null): p is CopaPick => !!p && typeof p.pais === 'string' && !!p.pais
const temTime = (p?: CopaPick | null): boolean => !!p && Array.isArray(p.xiKeys) && p.xiKeys.length === 11
/** a PIOR seleção que ainda está livre — o castigo de quem deixou os 45s passarem */
const piorLivre = (pegos: Set<string>): string => {
  const todas = paisesDaCopa() // já vem da melhor pra pior (nº de cartas)
  for (let i = todas.length - 1; i >= 0; i--) if (!pegos.has(todas[i])) return todas[i]
  return todas[todas.length - 1]
}
// ⏱️ NA HORA DO DONO, não na do meu celular (`agoraSala()` — ver `relogio.ts`).
// O `ate` é carimbado pelo aparelho do dono da sala; lido com o relógio local,
// um celular 79s atrasado mostrava "154s" onde eram os 75s da bandeira, "84s" no
// banner de 15s e "129s" na convocação de 90s — os prints do Diego de 20/09.
const segundosAte = (ate?: string | null): number =>
  ate ? Math.max(0, Math.ceil((new Date(ate).getTime() - agoraSala()) / 1000)) : 0

/** monta as 24: os times da liga na ordem da tabela + a máquina completando */
export function montaFichaDaLiga(
  classificacao: LugarNaLiga[],
  uidDe: Map<number, string>,
  picks: Map<string, CopaPick>,
  seed: number,
  edicao: number,
): CopaFicha {
  const times: CopaTime[] = []
  const pegos = new Set<string>()
  // 🛡️ RESERVA ANTES DE DISTRIBUIR (bug de 02/09, seis salas num dia só): a
  // lista anda na ordem da TABELA, e um bot que terminou acima da pessoa pegava
  // "a melhor seleção livre" — o Brasil — antes de chegar a vez dela. Quando
  // chegava, o Brasil "já tinha ido" e ela levava a pior sobra (Coreia do Sul),
  // mesmo com os 11 convocados. Palavras do amigo do Diego: *"o time que a
  // gente convoca não vem pra gente… apareceu como se eu tivesse com a Coreia
  // que eu nem convoquei"*. Agora o que GENTE escolheu fica reservado desde o
  // começo: bot só pega do que sobrou depois das escolhas de todo mundo.
  const reservados = new Set<string>()
  for (const lugar of classificacao) {
    if (!lugar.humano) continue
    const uid = uidDe.get(lugar.id); const pick = uid ? picks.get(uid) : undefined
    if (temPais(pick)) reservados.add(pick.pais)
  }
  const melhorLivre = (): string => paisesDaCopa().find(p => !pegos.has(p) && !reservados.has(p)) ?? paisesDaCopa().find(p => !pegos.has(p)) ?? paisesDaCopa()[0]
  for (const lugar of classificacao) {
    const uid = uidDe.get(lugar.id)
    const pick = uid ? picks.get(uid) : undefined
    // 🎯 três casos, e a diferença entre eles importa:
    //  · escolheu → leva o que escolheu;
    //  · é BOT → leva a melhor que sobrou (ele também anda na ordem da tabela,
    //    só que sozinho — "os bots ficam com as sobras", nas palavras do Diego);
    //  · é GENTE e deixou os 45s passarem → leva a PIOR que sobrou. É castigo,
    //    igual aos piores 11 de quem não convoca.
    // ⚠️ quem é GENTE vem do `humano` da tabela, NÃO de "tem uid": o guarda pegou
    // isso (01/09) — num teste em que todo assento tinha uid, os bots levaram o
    // castigo dos humanos. O uid serve pra dizer QUEM é a pessoa, não SE é.
    const pais = temPais(pick) && !pegos.has(pick.pais) ? pick.pais : lugar.humano ? piorLivre(pegos) : melhorLivre()
    pegos.add(pais)
    // 🥴 quem escolheu a bandeira mas NÃO convocou entra com os piores 11 — é o
    // castigo do Diego, e ele precisa viajar na ficha (senão cada aparelho
    // montaria um time diferente pra essa pessoa e a Copa racharia).
    // 🧩 gente: o que ela marcou + os PIORES nas vagas que ficaram vazias (mesmo
    // quem não marcou NADA cai aqui e leva 11 pernas-de-pau). Bot: nada, que o
    // motor monta o melhor XI do país sozinho.
    const xiKeys = lugar.humano
      ? completaXI(pais, (pick?.form ?? '4-3-3'), temPais(pick) ? pick!.xiKeys : []).map(c => `${c.name}|${c.club}|${c.year}`)
      : undefined
    times.push({ pais, nome: lugar.nome, ...(uid ? { uid } : {}), ...(xiKeys ? { xiKeys } : {}) })
  }
  for (const p of paisesDaCopa()) {
    if (times.length >= COPA_TEAMS) break
    if (pegos.has(p)) continue
    pegos.add(p); times.push({ pais: p, nome: p })
  }
  return { seed, edicao, times: times.slice(0, COPA_TEAMS) }
}

// ── o relógio grande, igual ao do leilão ──
function Relogio({ seg, total, cor = GOLD }: { seg: number; total: number; cor?: string }) {
  const pct = Math.max(0, Math.min(100, (seg / total) * 100))
  const apertado = seg <= 10
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ height: 16, border: `2.5px solid ${INK}`, borderRadius: 999, background: '#fff', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, width: `${pct}%`, background: apertado ? '#E8503A' : cor, transition: 'width .9s linear' }} />
        <b style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 10.5, fontWeight: 900, ...OSWALD, color: INK }}>{seg}s</b>
      </div>
    </div>
  )
}

// ── 🗺️ A GRADE DAS 24 SELEÇÕES — GRANDE, do tamanho da tela ──────────────────
// Diego (19/09): *"esses quadrinhos da Copa do Mundo pra escolher o país estão
// MUITO pequenos"*. Eram 2 colunas apertadas, escudo de 36px, numa caixa de 320px
// com rolagem — a pessoa escolhia a seleção dela por um buraco de fechadura.
// Agora: escudo grande (56px), nome em Oswald de 15, 2 colunas no celular e 3 no
// monitor, e SEM caixa com rolagem — a lista é a própria tela. Quem não é a vez
// vê a mesma grade (só sem poder tocar): fica sabendo quem já levou o quê.
function GradeDeSelecoes({ pegas, marcado, podeMarcar, aoMarcar }: {
  pegas: Map<string, string>
  marcado: string | null
  podeMarcar: boolean
  aoMarcar: (p: string) => void
}) {
  const paises = useMemo(paisesDaCopa, [])
  return (
    <div className="ll27-selecoes">
      {paises.map(p => {
        const dono = pegas.get(p)
        const eu = marcado === p
        return (
          <button key={p} disabled={!!dono || !podeMarcar} onClick={() => aoMarcar(p)}
            className={`ll27-selecao${dono ? ' tomada' : ''}${eu ? ' marcada' : ''}`}>
            <NationalCrest country={p} size={56} />
            <span className="ll27-selecao-nome">{p}</span>
            <span className="ll27-selecao-status">{dono ? `${tr('de', 'taken by')} ${dono}` : eu ? tr('✔️ marcada', '✔️ marked') : tr('livre', 'free')}</span>
          </button>
        )
      })}
    </div>
  )
}

// ── a escolha da BANDEIRA: toca pra marcar, confirma pra levar ──
// Mora DENTRO do portão (abaixo do banner da Copa), não num modal: o Diego pediu
// o formato da Copa dos 8/Libertadores — *"de cara aparece o banner top da Copa e
// embaixo, maior, a escolha dos países"*. Quando vira a MINHA vez, a tela rola
// até aqui sozinha (`scrollIntoView`), que é o "aparecer de cara" sem tapar nada.
function EscolheBandeira({ pegas, seg, aoConfirmar }: {
  pegas: Map<string, string>
  seg: number
  aoConfirmar: (pais: string) => void
}) {
  const [marcado, setMarcado] = useState<string | null>(null)
  const enviado = useRef(false)
  const marcadoRef = useRef<string | null>(null)
  const topo = useRef<HTMLDivElement>(null)
  marcadoRef.current = marcado
  useEffect(() => { topo.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, [])
  // ⏰ os 75s estouraram no MEU aparelho: mando o que estava marcado — e, se eu
  // não marquei nada, o dono carimba a pior livre por mim (ele é a rede).
  useEffect(() => {
    if (seg > 0 || enviado.current) return
    enviado.current = true
    if (marcadoRef.current) aoConfirmar(marcadoRef.current)
  }, [seg]) // eslint-disable-line react-hooks/exhaustive-deps
  const confirmar = () => { if (marcado) { enviado.current = true; aoConfirmar(marcado) } }
  return (
    <div ref={topo} style={{ scrollMarginTop: 8 }}>
      <h3 style={{ margin: '0 0 2px' }}>{tr('🌐 É A SUA VEZ — ESCOLHA A SELEÇÃO', '🌐 YOUR TURN — PICK THE NATIONAL TEAM')}</h3>
      <Relogio seg={seg} total={SEG_BANDEIRA} />
      <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,.6)', margin: '6px 0 10px', lineHeight: 1.4 }}>
        {getLang() === 'en' ? <>Tap to mark and confirm. If time runs out, you take the one marked — and, with none marked, <b>the worst one left</b>.</> : <>Toque pra marcar e confirme. Se o tempo acabar, você leva a que estiver marcada — e, sem nenhuma marcada, <b>a pior que sobrou</b>.</>}
      </p>
      <GradeDeSelecoes pegas={pegas} marcado={marcado} podeMarcar aoMarcar={setMarcado} />
      {/* 📌 o CONFIRMAR gruda no pé da tela: a grade é comprida e ninguém tem que
          rolar até o fim pra fechar a escolha com o relógio correndo. */}
      <div className="ll27-confirmar-barra">
        <button onClick={confirmar} disabled={!marcado} className={`ll27-confirmar${marcado ? ' pronto' : ''}`}>
          {marcado ? `${tr('✅ CONFIRMAR', '✅ CONFIRM')} ${marcado.toUpperCase()}` : tr('toque numa seleção', 'tap a national team')}
        </button>
      </div>
    </div>
  )
}

// ── o BANNER de 15s entre a bandeira e a convocação (inline, dentro do portão) ──
function BannerDaCopa({ seg }: { seg: number }) {
  return (
    <div style={{ ...box(`linear-gradient(150deg,#FFE79A,${GOLD} 55%,#E8A200)`), padding: '14px 13px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <span style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(115deg,transparent 32%,rgba(255,255,255,.7) 48%,transparent 60%)', backgroundSize: '250% 250%', animation: 'cmSheen 2.4s linear infinite' }} />
      <p style={{ fontSize: 40, margin: 0, position: 'relative' }}>🌐</p>
      <p style={{ ...OSWALD, fontWeight: 900, fontSize: 19, margin: '2px 0 0', textTransform: 'uppercase', position: 'relative' }}>{tr('Todas as seleções escolhidas!', 'All national teams picked!')}</p>
      <p style={{ fontSize: 11.5, fontWeight: 800, color: 'rgba(0,0,0,.7)', margin: '5px 0 0', lineHeight: 1.4, position: 'relative' }}>
        {getLang() === 'en' ? <>Now you have <b>{SEG_CONVOCA} seconds</b> to call up <b>11 players</b> from the country.<br />⚠️ Whoever doesn't call up enters with the <b>worst 11</b> — the machine picks, and shows no mercy.</> : <>Agora vocês têm <b>{SEG_CONVOCA} segundos</b> pra convocar <b>11 jogadores</b> do país.<br />⚠️ Quem não convocar entra com os <b>piores 11</b> — a máquina escolhe, e não tem dó.</>}
      </p>
      <div style={{ position: 'relative' }}><Relogio seg={seg} total={SEG_BANNER} cor="#fff" /></div>
    </div>
  )
}

// ─── 🚪 O PORTÃO DA COPA — o que a sala inteira vê quando a liga acaba ────────
// Diego (19/09): *"às vezes a pessoa, quando acaba a liga, nem tá percebendo que
// vai começar a Copa do Mundo. Tem que ser parecido com o modelo da Copa dos 8 e
// da Libertadores: acabou a liga, já aparece grande o banner da Copa, a tabela da
// liga vai pra baixo, e embaixo, maior, a escolha dos países; depois da escolha o
// passo segue pra convocação"*.
// É exatamente o desenho da Copa dos 8 no fim da liga: `CompetitionStage` com a
// arte do mundial em cima, e o "miolo" (`ll26-cup-entry`) troca conforme a fase —
// fila e botão do dono → grade das seleções → banner → convocação → torneio.
// Só desenho: quem manda na fase, no relógio e no banco continua sendo o
// `CopaDaLigaGate` (e só o dono escreve).
export function PortaoDaCopa({ nLiga, fase, lido, souDono, comecando, erro, fila, picks, pegas, seg, meuUid, minha, souAVez, daVezNome, temFicha, aberta, aoComecar, aoConfirmarPais, aoConvocar, aoVoltarCopa }: {
  nLiga: number
  fase: FaseCopa | null
  lido: boolean
  souDono: boolean
  comecando: boolean
  erro: string
  fila: { uid: string; nome: string; vez: number }[]
  picks: Map<string, CopaPick>
  pegas: Map<string, string>
  seg: number
  meuUid?: string
  minha: CopaPick | null
  souAVez: boolean
  daVezNome: string
  temFicha: boolean
  aberta: boolean
  aoComecar: () => void
  aoConfirmarPais: (pais: string) => void
  aoConvocar: () => void
  aoVoltarCopa: () => void
}) {
  const en = getLang() === 'en'
  const status = fase === 'bandeira' ? (souAVez ? tr('É a sua vez de escolher a seleção', 'Your turn to pick a national team') : `${daVezNome} ${tr('está escolhendo a seleção', 'is picking a national team')} · ${seg}s`)
    : fase === 'banner' ? `${tr('A convocação abre em', 'Call-up opens in')} ${seg}s`
    : fase === 'convocacao' ? (temTime(minha) ? tr('Seu time está convocado · esperando a turma', 'Your team is called up · waiting for the crew') : `${tr('Convoque os seus 11', 'Call up your 11')} · ${seg}s`)
    : fase === 'torneio' ? tr('Competição em andamento', 'Competition in progress')
    : tr('Aguardando o dono abrir a Copa', 'Waiting for the host to open the Cup')
  const detail = en ? `${nLiga} league teams become national teams. The standings set the picking order.` : `${nLiga} times da liga viram seleções. A classificação define a ordem de escolha.`
  const botaoGrande = (txt: string, onClick: () => void, cor = GOLD, disabled = false) => (
    <button onClick={onClick} disabled={disabled} className={`ll27-portao-botao${cor === GREEN ? ' verde' : ''}`}>{txt}</button>
  )
  return (
    <CompetitionStage kind="world" title={tr('A LIGA TERMINOU · PRÓXIMA COMPETIÇÃO', 'THE LEAGUE IS OVER · NEXT COMPETITION')} phase={tr('Copa do Mundo', 'World Cup')} detail={detail} status={status}>
      <div className="ll26-cup-entry">
        {/* 🥇 a fila, na ordem da tabela — some depois que todo mundo tem bandeira */}
        {!!fila.length && fase !== 'torneio' && fase !== 'convocacao' && (
          <div className="ll27-fila">
            <h3>{tr('🥇 QUEM TERMINOU NA FRENTE ESCOLHE PRIMEIRO', '🥇 WHOEVER FINISHED HIGHER PICKS FIRST')}</h3>
            {fila.map(f => {
              const p = picks.get(f.uid)
              const euSou = f.uid === meuUid
              const daVez = fase === 'bandeira' && !p && fila.find(x => !picks.get(x.uid))?.uid === f.uid
              return (
                <div key={f.uid} className={`ll27-fila-linha${daVez ? ' vez' : ''}${euSou ? ' eu' : ''}`}>
                  <span className="ll27-fila-n">{ordinal(f.vez)}</span>
                  <span className="ll27-fila-nome">{f.nome}{euSou ? tr(' (você)', ' (you)') : ''}</span>
                  {p
                    ? <span className="ll27-fila-pais"><NationalCrest country={p.pais} size={22} /> {p.pais}{temTime(p) ? ' ✔️' : ''}</span>
                    : <span className="ll27-fila-espera">{daVez ? `⏳ ${seg}s` : tr('na fila', 'in line')}</span>}
                </div>
              )
            })}
          </div>
        )}

        {/* ainda não começou: o dono puxa — só depois da 1ª leitura bem-sucedida do banco */}
        {!fase && lido && (souDono
          ? <>
              {botaoGrande(comecando ? tr('⏳ Começando…', '⏳ Starting…') : tr('🌐 COMEÇAR A COPA DO MUNDO', '🌐 START THE WORLD CUP'), aoComecar, GOLD, comecando)}
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,.6)', margin: '8px 2px 0', lineHeight: 1.45 }}>
                {en ? <>From then on the clock runs: <b>{SEG_BANDEIRA}s</b> for each one to pick a national team, in table order, and then <b>{SEG_CONVOCA}s</b> for everyone to call up their 11 together.</> : <>A partir daí o relógio corre: <b>{SEG_BANDEIRA}s</b> pra cada um escolher a seleção, na ordem da tabela, e depois <b>{SEG_CONVOCA}s</b> pra todos convocarem os 11 juntos.</>}
              </p>
            </>
          : <p className="ll27-portao-aviso">{tr('⏳ O dono da sala abre a Copa do Mundo — segura aí.', '⏳ The room owner opens the World Cup — hang on.')}</p>)}
        <details className="ll26-format" style={{ marginTop: fase ? 0 : 6 }}><summary>{tr('REGULAMENTO', 'FORMAT')}</summary><p>{tr(`${COPA_TEAMS} seleções em 6 grupos de 4, turno único (3 rodadas); passam os 2 primeiros de cada grupo + os 4 melhores 3ºs = 16. Oitavas, quartas, semifinal e final em JOGO ÚNICO — empatou, pênaltis. Desempate: pontos, vitórias, saldo, gols. Cada um convoca 11 jogadores do próprio país; quem não convocar entra com os piores 11. O campeão do mundo leva título no Rank, a carta do campeão e o troféu na estante da sala.`, `${COPA_TEAMS} national teams in 6 groups of 4, single round-robin (3 rounds); the top 2 of each group + the 4 best 3rd-placed go through = 16. Round of 16, quarter-finals, semi-final and final are ONE-OFF — a draw goes to penalties. Tie-break: points, wins, goal difference, goals. Everyone calls up 11 players from their own country; whoever doesn't call up gets the worst 11. The world champion gets a Rank title, the champion's card and the trophy on the room's shelf.`)}</p></details>

        {/* fase 1 — a bandeira: quem é a vez escolhe AQUI; os outros veem a grade travada */}
        {fase === 'bandeira' && (souAVez
          ? <EscolheBandeira pegas={pegas} seg={seg} aoConfirmar={aoConfirmarPais} />
          : <>
              <p className="ll27-portao-aviso">
                {minha
                  ? (en ? <><NationalCrest country={minha.pais} size={22} /> You are <b>{minha.pais}</b>. Now wait for the line — <b>{daVezNome}</b> is picking ({seg}s).</> : <><NationalCrest country={minha.pais} size={22} /> Você é a <b>{minha.pais}</b>. Agora é esperar a fila — <b>{daVezNome}</b> está escolhendo ({seg}s).</>)
                  : (en ? <>⏳ <b>{daVezNome}</b> is picking a national team ({seg}s). Your turn comes in table order.</> : <>⏳ <b>{daVezNome}</b> está escolhendo a seleção ({seg}s). A sua vez vem na ordem da tabela.</>)}
              </p>
              <GradeDeSelecoes pegas={pegas} marcado={minha?.pais ?? null} podeMarcar={false} aoMarcar={() => {}} />
            </>)}

        {/* fase 2 — os 15s de respiro */}
        {fase === 'banner' && <BannerDaCopa seg={seg} />}

        {/* fase 3 — a convocação, todo mundo junto (a tela dos 11 abre sozinha por cima) */}
        {fase === 'convocacao' && (
          <div className="ll27-convoca">
            <h3>{temTime(minha) ? tr('✅ TIME CONVOCADO', '✅ TEAM CALLED UP') : tr('⚽ CONVOQUE OS 11', '⚽ CALL UP THE 11')}</h3>
            <Relogio seg={seg} total={SEG_CONVOCA} />
            {minha && !temTime(minha) && <div style={{ marginTop: 10 }}>{botaoGrande(tr('⚽ VOLTAR PRA CONVOCAÇÃO', '⚽ BACK TO THE CALL-UP'), aoConvocar, GREEN)}</div>}
            {temTime(minha) && (
              <p className="ll27-portao-aviso" style={{ marginTop: 8 }}>
                <NationalCrest country={minha!.pais} size={22} /> <b>{minha!.pais}</b> {tr('com 11 no papel. A Copa começa quando o tempo acabar (ou quando todo mundo terminar).', 'with 11 on paper. The Cup starts when time runs out (or when everyone finishes).')}
              </p>
            )}
          </div>
        )}

        {!!erro && <p style={{ fontSize: 11, fontWeight: 800, color: '#B23B2E', margin: '8px 2px 0', lineHeight: 1.4 }}>{erro}</p>}
        {temFicha && !aberta && <div style={{ marginTop: 8 }}>{botaoGrande(tr('🌐 VOLTAR PRA COPA', '🌐 BACK TO THE CUP'), aoVoltarCopa)}</div>}
      </div>
    </CompetitionStage>
  )
}

export function CopaDaLigaGate({ roomId, souDono, meuUid, classificacao, matchSeed, aoStatus, seasonNo = 1 }: {
  roomId: string
  souDono: boolean
  meuUid?: string
  /** a tabela FINAL da liga, do 1º ao último (id = número do técnico) */
  classificacao: LugarNaLiga[]
  /** a semente da partida — é a chave da linha desta temporada na estante */
  matchSeed?: number
  /** 🌍 a TEMPORADA da sala (seasonNo) = a EDIÇÃO da Copa. Uma Copa por temporada
      (Diego 09/09, sala do Futpoint): a sala reiniciou com "novo leilão" (liga +
      mundo), a liga acabou e NÃO teve Copa — o jornal ainda repetiu o campeão da
      noite anterior. Motivo: a Copa era "uma por sala": a 2ª temporada achava a
      linha da 1ª (com campeão gravado) e dava a noite por encerrada. Agora cada
      temporada procura e abre SÓ a edição dela; a chave da tabela já era
      (sala, edição), então a edição vira o número da temporada. */
  seasonNo?: number
  /** 📰 avisa o fim de temporada se a noite JÁ acabou e quem levou a Copa —
      é o que segura o jornal e a votação até a Copa terminar (Diego 01/09). */
  aoStatus?: (s: { pendente: boolean; campeao: { nome: string; pais: string } | null }) => void
}) {
  const [linhas, setLinhas] = useState<LinhaSala[]>([])
  const privateVisual = ONLINE_VISUAL_RELEASED
  const [fase, setFase] = useState<LinhaFase | null>(null)
  const [aberta, setAberta] = useState(false)
  const [comecando, setComecando] = useState(false)
  const [erro, setErro] = useState('')
  const [, setAgora] = useState(Date.now()) // só pra redesenhar a contagem 1x por segundo
  const convocando = useRef(false)
  // 🚪 a convocação abre SOZINHA quando a fase começa. Se a pessoa fechar pra dar
  // uma olhada na tabela, isto lembra que ela já viu — e aí não fica reabrindo na
  // cara dela a cada batidinha (tela que reabre sozinha é praga).
  const convocouRef = useRef(false)

  // relógio de tela: 1x por segundo, só pra desenhar a contagem
  useEffect(() => { const iv = setInterval(() => setAgora(Date.now()), 1000); return () => clearInterval(iv) }, [])

  // 🧯 leitura que FALHA não apaga o que a tela já sabe (bug 07/09 à noite: a
  // Copa tinha ACABADO, a pessoa estava vendo o pacote e o jornal, e "a Copa
  // atualizou e voltou a rolar sozinha"). O supabase-js não lança erro: devolve
  // `{ data: null, error }`. Aqui isso virava `setFase(null)` numa piscada de
  // rede — a ficha sumia, a batidinha seguinte trazia de volta, e o efeito de
  // "ficha nova → abre a Copa" remontava o torneio e ANIMAVA TUDO DE NOVO. De
  // quebra, o dono via o botão "COMEÇAR A COPA" no meio da piscada. Agora: deu
  // erro em qualquer uma das duas consultas, fica tudo como estava.
  const [lido, setLido] = useState(false) // já li o banco ao menos uma vez com sucesso?
  // 🌍 a edição desta noite = a temporada da sala (ver o comentário da prop `seasonNo`)
  const edicaoDaTemporada = Math.max(1, Math.floor(Number(seasonNo) || 1))
  const ler = useCallback(async () => {
    try {
      const [{ data: pls, error: e1 }, { data: fs, error: e2 }] = await Promise.all([
        supabase.from('room_players').select('user_id, player_index, manager_name, copa').eq('room_id', roomId),
        supabase.from('esc_copa_salas').select('edicao, seed, fase, vez_uid, ate, times, campeao, criada_em').eq('room_id', roomId).eq('edicao', edicaoDaTemporada).limit(1),
      ])
      if (e1 || e2 || !pls || !fs) return null
      setLinhas(pls as LinhaSala[])
      const f = fs[0] as LinhaFase | undefined
      setFase(f ? { ...f, seed: Number(f.seed) } : null)
      setLido(true)
      return { linhas: pls as LinhaSala[], fase: f }
    } catch { return null }
  }, [roomId, edicaoDaTemporada])

  useEffect(() => { void ler(); const iv = setInterval(() => { void ler() }, 2000); return () => clearInterval(iv) }, [ler])

  const uidDe = useMemo(() => new Map(linhas.map(l => [l.player_index, l.user_id])), [linhas])
  const nomeDe = useMemo(() => new Map(linhas.map(l => [l.user_id, stripEmojiSimples(l.manager_name)])), [linhas])
  const picks = useMemo(() => {
    const m = new Map<string, CopaPick>()
    for (const l of linhas) if (temPais(l.copa)) m.set(l.user_id, l.copa)
    return m
  }, [linhas])
  /** a FILA: só gente, na ordem da tabela final da liga */
  const fila = useMemo(() => classificacao
    .filter(c => c.humano && uidDe.has(c.id))
    .map((c, i) => ({ ...c, uid: uidDe.get(c.id)!, vez: i + 1 })), [classificacao, uidDe])
  const pegas = useMemo(() => {
    const m = new Map<string, string>()
    for (const f of fila) { const p = picks.get(f.uid); if (p) m.set(p.pais, f.nome) }
    return m
  }, [fila, picks])

  const seg = segundosAte(fase?.ate)
  const minha = meuUid ? picks.get(meuUid) ?? null : null
  const souAVez = fase?.fase === 'bandeira' && fase.vez_uid === meuUid && !minha

  // ─── 👑 O DONO EMPURRA O RELÓGIO ──────────────────────────────────────────
  // Só ele escreve. Roda junto da batidinha de leitura (2s), então a vez anda
  // no máximo 2s depois — e nunca depende do relógio do celular dos outros.
  const passo = useCallback(async () => {
    if (!souDono) return
    const lido = await ler()
    if (!lido?.fase) return
    const f = lido.fase
    const pk = new Map<string, CopaPick>()
    for (const l of lido.linhas) if (temPais(l.copa)) pk.set(l.user_id, l.copa)
    const filaAgora = classificacao.filter(c => c.humano).map(c => ({ id: c.id, uid: new Map(lido.linhas.map(l => [l.player_index, l.user_id])).get(c.id) }))
      .filter((x): x is { id: number; uid: string } => !!x.uid)
    const venceu = f.ate ? agoraSala() >= new Date(f.ate).getTime() : true

    if (f.fase === 'bandeira') {
      const semPais = filaAgora.filter(x => !pk.has(x.uid))
      if (semPais.length === 0) {
        await supabase.from('esc_copa_salas').update({ fase: 'banner', vez_uid: null, ate: new Date(Date.now() + SEG_BANNER * 1000).toISOString() }).eq('room_id', roomId).eq('edicao', f.edicao)
        return
      }
      const daVez = semPais[0]
      if (f.vez_uid !== daVez.uid) {
        // a vez virou (alguém confirmou): reinicia os 45s pro próximo
        await supabase.from('esc_copa_salas').update({ vez_uid: daVez.uid, ate: new Date(Date.now() + SEG_BANDEIRA * 1000).toISOString() }).eq('room_id', roomId).eq('edicao', f.edicao)
        return
      }
      if (venceu) {
        // ⏰ estourou e ninguém carimbou (app fechado, aba dormindo): o dono dá a
        // PIOR seleção livre e toca o jogo. A sala nunca fica esperando um fantasma.
        const pegos = new Set([...pk.values()].map(p => p.pais))
        const pior = piorLivre(pegos)
        await supabase.from('room_players').update({ copa: { pais: pior, form: '4-3-3', xiKeys: [] } }).eq('room_id', roomId).eq('user_id', daVez.uid)
        const prox = semPais[1]
        await supabase.from('esc_copa_salas').update(prox
          ? { vez_uid: prox.uid, ate: new Date(Date.now() + SEG_BANDEIRA * 1000).toISOString() }
          : { fase: 'banner', vez_uid: null, ate: new Date(Date.now() + SEG_BANNER * 1000).toISOString() })
          .eq('room_id', roomId).eq('edicao', f.edicao)
      }
      return
    }

    if (f.fase === 'banner') {
      if (venceu) await supabase.from('esc_copa_salas').update({ fase: 'convocacao', ate: new Date(Date.now() + SEG_CONVOCA * 1000).toISOString() }).eq('room_id', roomId).eq('edicao', f.edicao)
      return
    }

    if (f.fase === 'convocacao') {
      const todosMontaram = filaAgora.every(x => temTime(pk.get(x.uid)))
      if (!venceu && !todosMontaram) return
      const ficha = montaFichaDaLiga(classificacao, new Map(lido.linhas.map(l => [l.player_index, l.user_id])), pk, f.seed, f.edicao)
      await supabase.from('esc_copa_salas').update({ fase: 'torneio', vez_uid: null, ate: null, times: ficha.times }).eq('room_id', roomId).eq('edicao', f.edicao)
    }
  }, [souDono, ler, classificacao, roomId])

  useEffect(() => {
    if (!souDono) return
    const iv = setInterval(() => { void passo() }, 2000)
    return () => clearInterval(iv)
  }, [souDono, passo])

  async function comecar() {
    if (!souDono || comecando) return
    setComecando(true); setErro('')
    try {
      const { data: fs, error: eFs } = await supabase.from('esc_copa_salas').select('edicao').eq('room_id', roomId).eq('edicao', edicaoDaTemporada).limit(1)
      // 🛡️ UMA COPA POR TEMPORADA: se a edição DESTA temporada já existe (a tela é
      // que ainda não tinha lido), NÃO abre outra — só relê. Antes um toque no botão
      // durante uma piscada de leitura criava outra edição e recomeçava a Copa pra
      // todo mundo. (Era "uma por SALA" até 09/09 — e por isso a 2ª temporada da
      // mesma sala nunca tinha Copa; ver a prop `seasonNo`.)
      if (eFs) { setErro(tr('Não consegui ler a sala agora. Tenta de novo em instantes.', 'Couldn\'t read the room right now. Try again in a moment.')); return }
      if ((fs ?? []).length > 0) { await ler(); return }
      const edicao = edicaoDaTemporada
      // 🧹 TEMPORADA NOVA, SELEÇÕES NOVAS: a bandeira e os 11 convocados ficam na
      // linha do jogador (`room_players.copa`), não na edição. Sem limpar, a 2ª Copa
      // pulava a escolha de país e usava a convocação da temporada passada (com
      // jogadores que a pessoa nem tem mais). Só o dono faz isso, e só ao ABRIR a
      // edição nova — ninguém pode ter escolhido nada dela ainda.
      if (edicao > 1) await supabase.from('room_players').update({ copa: null }).eq('room_id', roomId)
      const primeiro = fila[0]?.uid ?? null
      const { error } = await supabase.from('esc_copa_salas').insert({
        room_id: roomId, edicao, seed: Math.floor(Math.random() * 1e9), times: null,
        fase: primeiro ? 'bandeira' : 'convocacao', vez_uid: primeiro,
        ate: new Date(Date.now() + (primeiro ? SEG_BANDEIRA : SEG_CONVOCA) * 1000).toISOString(),
      })
      if (error) { setErro(tr('Não consegui começar a Copa agora. Tenta de novo em instantes.', 'Couldn\'t start the Cup right now. Try again in a moment.')); return }
      await ler()
    } finally { setComecando(false) }
  }

  async function gravaPais(pais: string) {
    if (!meuUid) return
    try { await supabase.from('room_players').update({ copa: { pais, form: '4-3-3', xiKeys: [] } }).eq('room_id', roomId).eq('user_id', meuUid); await ler() } catch { /* a batidinha tenta de novo */ }
  }
  // `parcial` = o tempo estourou e a pessoa tinha marcado menos de 11. Grava o
  // que ela fez mesmo assim: as vagas vazias viram os PIORES na hora de montar a
  // ficha (`completaXI`), e assim ninguém perde o que já tinha escolhido.
  async function gravaTime(xiKeys: string[], form: Formation, parcial = false) {
    if (!meuUid || !minha) return
    if (!parcial && xiKeys.length !== 11) return
    try { await supabase.from('room_players').update({ copa: { ...minha, form, xiKeys } }).eq('room_id', roomId).eq('user_id', meuUid); await ler() } catch { /* idem */ }
  }

  const ficha: CopaFicha | null = fase?.fase === 'torneio' && fase.times ? { seed: fase.seed, edicao: fase.edicao, times: fase.times, potes: copaTemPotes(fase.criada_em) } : null
  // 🎬 abre SOZINHA só enquanto a Copa está por decidir. Com campeão já gravado
  // (a noite acabou), a pessoa que voltar do pacote/jornal NÃO leva o torneio
  // inteiro de novo na cara — o botão "VOLTAR PRA COPA" fica ali pra quem quiser
  // rever por vontade própria.
  useEffect(() => { if (ficha && !fase?.campeao) setAberta(true) }, [ficha?.seed]) // eslint-disable-line react-hooks/exhaustive-deps

  async function gravaNaEstante(campeao: string, pais: string) {
    if (!souDono) return
    try {
      // 1) a linha da Copa: é ela que diz pra TODO MUNDO que a noite acabou —
      //    e é por ela que o jornal e a votação do "e agora?" destravam juntos,
      //    na mesma hora, em todos os aparelhos.
      if (fase) await supabase.from('esc_copa_salas').update({ campeao: `${campeao} | ${pais}` }).eq('room_id', roomId).eq('edicao', fase.edicao)
      // 2) a estante da temporada (a MESMA linha da liga daquela noite)
      if (matchSeed != null) {
        const { data: existe } = await supabase.from('game_champions').select('id').eq('room_id', roomId).eq('match_seed', matchSeed).maybeSingle()
        if (existe) await supabase.from('game_champions').update({ copa_champion_name: `${campeao} (${pais})` }).eq('id', existe.id)
      }
      await ler()
    } catch { /* nunca trava a Copa */ }
  }

  // 📰 o fim de temporada precisa saber DUAS coisas: se ainda falta Copa (pra
  // segurar o jornal e a votação) e quem levou (pra sair no jornal).
  const campeaoDoMundo = useMemo(() => {
    if (!fase?.campeao) return null
    const [nome, pais] = fase.campeao.split(' | ')
    return nome ? { nome, pais: pais ?? '' } : null
  }, [fase?.campeao])
  useEffect(() => { aoStatus?.({ pendente: !campeaoDoMundo, campeao: campeaoDoMundo }) }, [campeaoDoMundo]) // eslint-disable-line react-hooks/exhaustive-deps

  const daVezNome = fase?.vez_uid ? nomeDe.get(fase.vez_uid) ?? tr('alguém', 'someone') : ''
  return (
    <>
      <style>{'@keyframes cmSheen{0%{background-position:180% 180%}100%{background-position:-80% -80%}}'}</style>
      {/* 🚪 O PORTÃO (19/09): o banner grande da Copa no TOPO do fim da liga, com a
          fila, a grade das seleções e a convocação embaixo dele — o mesmo desenho
          da Copa dos 8/Libertadores. Antes a escolha da bandeira subia num modal
          por cima de tudo (Diego 01/09) e o resto era uma caixinha depois da tabela;
          ele pediu de volta o formato das outras copas, com a tabela indo pra baixo.
          A tela rola sozinha até a grade quando vira a sua vez. */}
      <PortaoDaCopa nLiga={classificacao.length} fase={fase?.fase ?? null} lido={lido} souDono={souDono} comecando={comecando} erro={erro}
        fila={fila} picks={picks} pegas={pegas} seg={seg} meuUid={meuUid} minha={minha} souAVez={souAVez} daVezNome={daVezNome}
        temFicha={!!ficha} aberta={aberta}
        aoComecar={() => { void comecar() }} aoConfirmarPais={p => { void gravaPais(p) }}
        aoConvocar={() => { convocando.current = true; setAgora(Date.now()) }} aoVoltarCopa={() => setAberta(true)} />

      {/* a tela de convocação (a MESMA da carreira) — ela ABRE SOZINHA quando o
          banner acaba: o banner acabou de avisar que são 90s, então mandar a
          pessoa procurar um botão seria queimar metade do tempo dela. */}
      {fase?.fase === 'convocacao' && (convocando.current || !convocouRef.current) && minha && !temTime(minha) && (
        <CMModal>
          <ConvocacaoScreen pais={minha.pais} prazoSeg={seg}
            onBack={() => { convocando.current = false; convocouRef.current = true; setAgora(Date.now()) }}
            aoEstourar={(parcial, f) => { convocando.current = false; void gravaTime(parcial.map(c => `${c.name}|${c.club}|${c.year}`), f, true) }}
            onDone={(xi, f) => { convocando.current = false; void gravaTime(xi.map(c => `${c.name}|${c.club}|${c.year}`), f) }} />
        </CMModal>
      )}

      {ficha && (aberta || privateVisual) && (
        <CopaDaSala ficha={ficha} roomId={roomId} meuUid={meuUid} souDono={souDono} visible={aberta}
          aoCampeao={(nome, pais) => { void gravaNaEstante(nome, pais) }}
          aoFechar={() => setAberta(false)} />
      )}
    </>
  )
}
