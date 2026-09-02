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
import { supabase } from '../lib/supabase'
import { rankingSelecoes } from './paises'
import {
  CMModal, ConvocacaoScreen, CupScreen, COPA_TEAMS, flagOf,
  countryPool, xiPorChaves, xiDaMaquina, xiStrength, completaXI,
  type Entrant, type Formation, type CopaSave,
} from './copa-mundo'

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D'
// tira emoji do nome do técnico (o selo de apoio vem colado no manager_name)
const stripEmojiSimples = (n: string) => n.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2B00}-\u{2BFF}]/gu, '').trim() || 'Técnico'
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
export interface CopaFicha { seed: number; edicao: number; times: CopaTime[] }

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
    if (conflito) { setErro(`Alguém pegou a ${p.pais} enquanto você convocava. Escolhe outra — o time que você montou não se perde, é só refazer com o país novo.`); setTela('pais'); return }
    const { error } = await supabase.from('room_players').update({ copa: p }).eq('room_id', roomId).eq('user_id', meuUid)
    if (error) { setErro('Não consegui gravar sua seleção. Tenta de novo em instantes.'); return }
    setTela('off'); aoEscolher()
  }

  return (
    <>
      <div style={{ ...box(minha ? '#EAF6EE' : '#FFF6D6'), padding: '10px 12px', marginBottom: 10 }}>
        <p style={{ ...OSWALD, fontWeight: 900, fontSize: 13, margin: 0, textTransform: 'uppercase' }}>
          {minha ? `${flagOf(minha.pais)} Você é a ${minha.pais}` : '🌐 Escolha a sua seleção'}
        </p>
        <p style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,.6)', margin: '3px 0 0', lineHeight: 1.45 }}>
          {minha
            ? <>11 convocados no papel. Agora é esperar a turma — o dono da sala abre a Copa quando todo mundo estiver pronto.</>
            : <>Cada um pega <b>uma seleção</b> e convoca <b>11 jogadores</b> do país. Não tem leilão aqui: é convocação pura, e o time é seu do começo ao fim da Copa.</>}
        </p>
        <button onClick={() => { setPais(null); setTela('pais') }}
          style={{ width: '100%', marginTop: 8, border: `2.5px solid ${INK}`, borderRadius: 11, padding: '9px 0', ...OSWALD, fontWeight: 900, fontSize: 13,
            background: minha ? '#fff' : `linear-gradient(150deg,#FFE79A,${GOLD} 55%,#E8A200)`, color: INK, boxShadow: `3px 3px 0 0 ${INK}`, cursor: 'pointer' }}>
          {minha ? '🔁 Trocar de seleção' : '🌐 ESCOLHER MINHA SELEÇÃO'}
        </button>
        {erro && <p style={{ fontSize: 10.5, fontWeight: 800, color: '#B23B2E', margin: '6px 0 0', lineHeight: 1.4 }}>{erro}</p>}
      </div>

      {tela === 'pais' && (
        <CMModal>
          <p style={{ ...OSWALD, fontWeight: 900, fontSize: 19, margin: 0, textAlign: 'center', textTransform: 'uppercase' }}>🌐 Escolha sua seleção</p>
          <p style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,.6)', textAlign: 'center', margin: '4px 0 10px', lineHeight: 1.4 }}>
            As <b>{COPA_TEAMS}</b> seleções da Copa. As que já têm dono aparecem apagadas — <b>duas pessoas não podem levar o mesmo país</b>.
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
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(0,0,0,.55)' }}>{dono ? `já é de ${dono}` : `${qtd} cartas`}</span>
                </button>
              )
            })}
          </div>
          <button onClick={() => setTela('off')} style={{ width: '100%', marginTop: 10, border: 'none', background: 'transparent', ...OSWALD, fontWeight: 900, fontSize: 12, color: 'rgba(0,0,0,.5)', textDecoration: 'underline', cursor: 'pointer' }}>voltar pra sala</button>
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

export function CopaDaSala({ ficha, roomId, meuUid, aoCampeao, aoFechar }: { ficha: CopaFicha; roomId: string; meuUid?: string; aoCampeao?: (nome: string, pais: string) => void; aoFechar: () => void }) {
  const entrants = useMemo(() => entrantesDaFicha(ficha, meuUid), [ficha, meuUid])
  // 🔑 a IDENTIDADE desta Copa no ranking: sala + semente. A semente muda a cada
  // Copa nova, então jogar Copa atrás de Copa na mesma sala não faz uma apagar a
  // outra (foi exatamente esse o bug do "novo leilão" no ranking, em agosto).
  const online = useMemo(() => ({ seasonKey: `mundo:${roomId}:${ficha.seed}:copamundo`, aoCampeao }), [roomId, ficha.seed, aoCampeao])
  return (
    <CMModal wide>
      <CupScreen entrants={entrants} seasonNo={ficha.edicao} seed={ficha.seed} save={SAVE_VAZIO}
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
        🌐 Convocados · {prontos.length} de {total}
      </p>
      {prontos.length === 0
        ? <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,.5)', margin: 0 }}>Ninguém escolheu ainda.</p>
        : prontos.map(p => (
          <div key={p.nome + p.pais} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, fontWeight: 800, padding: '3px 0', borderTop: '1px solid rgba(0,0,0,.08)' }}>
            <span style={{ fontSize: 15 }}>{flagOf(p.pais)}</span>
            <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nome}</span>
            <span style={{ ...OSWALD, fontWeight: 900, color: GREEN }}>{p.pais}</span>
          </div>
        ))}
      {faltam > 0 && (
        <p style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,.55)', margin: '6px 0 0', lineHeight: 1.4 }}>
          ⏳ {faltam === 1 ? 'Falta 1 pessoa' : `Faltam ${faltam} pessoas`} escolher. Quem não escolher <b>fica de fora da Copa</b> — as vagas viram seleções da máquina.
        </p>
      )}
      {souDono && (
        <>
          <button onClick={aoAbrir} disabled={!podeAbrir || abrindo}
            style={{ width: '100%', marginTop: 8, border: `2.5px solid ${INK}`, borderRadius: 11, padding: '10px 0', ...OSWALD, fontWeight: 900, fontSize: 14,
              background: podeAbrir ? `linear-gradient(150deg,#FFE79A,${GOLD} 55%,#E8A200)` : '#ded5bd', color: INK,
              boxShadow: podeAbrir ? `3px 3px 0 0 ${INK}` : 'none', cursor: podeAbrir && !abrindo ? 'pointer' : 'default' }}>
            {abrindo ? '⏳ Abrindo…' : podeAbrir ? '🌐 ABRIR A COPA DO MUNDO' : '🌐 Precisa de 2 seleções'}
          </button>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,.5)', margin: '5px 0 0', lineHeight: 1.4 }}>
            A Copa abre <b>na tela de todo mundo ao mesmo tempo</b>. São {COPA_TEAMS} seleções no total — as vagas que sobrarem viram time da máquina.
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
      <p style={{ ...OSWALD, fontWeight: 900, fontSize: 12, margin: '0 0 5px', textTransform: 'uppercase', color: 'rgba(0,0,0,.6)' }}>🏆 Estante desta sala</p>
      {linhas.map(l => (
        <div key={l.season_no} style={{ display: 'flex', gap: 7, fontSize: 11.5, fontWeight: 800, padding: '3px 0', borderTop: '1px solid rgba(0,0,0,.08)' }}>
          <span style={{ ...OSWALD, color: 'rgba(0,0,0,.45)', width: 54 }}>Copa {l.season_no}</span>
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
      <p style={{ ...OSWALD, fontWeight: 900, fontSize: 15, margin: 0, textTransform: 'uppercase' }}>🌐 Copa do Mundo Legends</p>
      <p style={{ fontSize: 10, fontWeight: 800, color: 'rgba(0,0,0,.6)', margin: '2px 0 0' }}>sem leilão · cada um convoca 11 do próprio país · {COPA_TEAMS} seleções</p>
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
interface LinhaFase { edicao: number; seed: number; fase: FaseCopa; vez_uid: string | null; ate: string | null; times: CopaTime[] | null; campeao: string | null }
interface LinhaSala { user_id: string; player_index: number; manager_name: string; copa: CopaPick | null }

// ⏱️ OS TRÊS RELÓGIOS, todos escolhidos pelo Diego (01/09):
//   · 65s pra escolher a SELEÇÃO, um de cada vez, na ordem da tabela;
//   · 15s de banner entre as duas fases;
//   · 135s pra CONVOCAR os 11 — todo mundo junto. Era 65s, igual à bandeira;
//     em 02/09 o Diego mandou *"aumente o tempo pra convocação em 70s"* depois
//     que, numa sala de 4, três pessoas não fecharam os 11 a tempo (levaram os
//     piores). Não atrasa ninguém: a fase avança na hora em que TODOS fecham
//     o time (`todosMontaram`); o relógio é só o teto pra quem dorme.
const SEG_BANDEIRA = 65, SEG_BANNER = 15, SEG_CONVOCA = 135
const temPais = (p?: CopaPick | null): p is CopaPick => !!p && typeof p.pais === 'string' && !!p.pais
const temTime = (p?: CopaPick | null): boolean => !!p && Array.isArray(p.xiKeys) && p.xiKeys.length === 11
/** a PIOR seleção que ainda está livre — o castigo de quem deixou os 45s passarem */
const piorLivre = (pegos: Set<string>): string => {
  const todas = paisesDaCopa() // já vem da melhor pra pior (nº de cartas)
  for (let i = todas.length - 1; i >= 0; i--) if (!pegos.has(todas[i])) return todas[i]
  return todas[todas.length - 1]
}
const segundosAte = (ate?: string | null): number =>
  ate ? Math.max(0, Math.ceil((new Date(ate).getTime() - Date.now()) / 1000)) : 0

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

// ── a escolha da BANDEIRA: toca pra marcar, confirma pra levar ──
function EscolheBandeira({ pegas, seg, aoConfirmar }: {
  pegas: Map<string, string>
  seg: number
  aoConfirmar: (pais: string) => void
}) {
  const [marcado, setMarcado] = useState<string | null>(null)
  const paises = useMemo(paisesDaCopa, [])
  const enviado = useRef(false)
  const marcadoRef = useRef<string | null>(null)
  marcadoRef.current = marcado
  // ⏰ os 45s estouraram no MEU aparelho: mando o que estava marcado — e, se eu
  // não marquei nada, o dono carimba a pior livre por mim (ele é a rede).
  useEffect(() => {
    if (seg > 0 || enviado.current) return
    enviado.current = true
    if (marcadoRef.current) aoConfirmar(marcadoRef.current)
  }, [seg]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div style={{ ...box('#fff'), padding: '10px 11px', marginTop: 9, boxShadow: `3px 3px 0 0 ${INK}` }}>
      <p style={{ ...OSWALD, fontWeight: 900, fontSize: 14, margin: 0, textTransform: 'uppercase', textAlign: 'center' }}>🌐 É a sua vez — escolha a seleção</p>
      <Relogio seg={seg} total={SEG_BANDEIRA} />
      <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,.55)', margin: '5px 0 7px', textAlign: 'center', lineHeight: 1.35 }}>
        Toque pra marcar e confirme. Se o tempo acabar, você leva a que estiver marcada — e, sem nenhuma marcada, <b>a pior que sobrou</b>.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, maxHeight: 320, overflowY: 'auto' }}>
        {paises.map(p => {
          const dono = pegas.get(p)
          const eu = marcado === p
          return (
            <button key={p} disabled={!!dono} onClick={() => setMarcado(p)}
              style={{ textAlign: 'left', border: `2.5px solid ${INK}`, borderRadius: 9, padding: '6px 8px',
                background: dono ? '#ded5bd' : eu ? GOLD : '#fff', opacity: dono ? .6 : 1,
                cursor: dono ? 'default' : 'pointer', boxShadow: dono ? 'none' : `2px 2px 0 0 ${INK}` }}>
              <span style={{ ...OSWALD, fontWeight: 900, fontSize: 12.5, display: 'block' }}>{flagOf(p)} {p}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(0,0,0,.55)' }}>{dono ? `de ${dono}` : eu ? '✔️ marcada' : 'livre'}</span>
            </button>
          )
        })}
      </div>
      <button onClick={() => { if (marcado) { enviado.current = true; aoConfirmar(marcado) } }} disabled={!marcado}
        style={{ width: '100%', marginTop: 9, border: `3px solid ${INK}`, borderRadius: 12, padding: '10px 0', ...OSWALD, fontWeight: 900, fontSize: 14,
          background: marcado ? GREEN : '#ded5bd', color: marcado ? '#fff' : INK, boxShadow: marcado ? `4px 4px 0 0 ${INK}` : 'none', cursor: marcado ? 'pointer' : 'default' }}>
        {marcado ? `✅ CONFIRMAR ${marcado.toUpperCase()}` : 'toque numa seleção'}
      </button>
    </div>
  )
}

// ── o BANNER de 15s entre a bandeira e a convocação ──
function BannerDaCopa({ seg }: { seg: number }) {
  return (
    <div style={{ ...box(`linear-gradient(150deg,#FFE79A,${GOLD} 55%,#E8A200)`), padding: '14px 13px', marginTop: 9, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <span style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(115deg,transparent 32%,rgba(255,255,255,.7) 48%,transparent 60%)', backgroundSize: '250% 250%', animation: 'cmSheen 2.4s linear infinite' }} />
      <p style={{ fontSize: 40, margin: 0, position: 'relative' }}>🌐</p>
      <p style={{ ...OSWALD, fontWeight: 900, fontSize: 19, margin: '2px 0 0', textTransform: 'uppercase', position: 'relative' }}>Começa a Copa do Mundo</p>
      <p style={{ fontSize: 11.5, fontWeight: 800, color: 'rgba(0,0,0,.7)', margin: '5px 0 0', lineHeight: 1.4, position: 'relative' }}>
        Todo mundo já tem sua seleção. Agora vocês têm <b>{SEG_CONVOCA} segundos</b> pra convocar <b>11 jogadores</b> do país.
        <br />⚠️ Quem não convocar entra com os <b>piores 11</b> — a máquina escolhe, e não tem dó.
      </p>
      <div style={{ position: 'relative' }}><Relogio seg={seg} total={SEG_BANNER} cor="#fff" /></div>
    </div>
  )
}

export function CopaDaLigaGate({ roomId, souDono, meuUid, classificacao, matchSeed, aoStatus }: {
  roomId: string
  souDono: boolean
  meuUid?: string
  /** a tabela FINAL da liga, do 1º ao último (id = número do técnico) */
  classificacao: LugarNaLiga[]
  /** a semente da partida — é a chave da linha desta temporada na estante */
  matchSeed?: number
  /** 📰 avisa o fim de temporada se a noite JÁ acabou e quem levou a Copa —
      é o que segura o jornal e a votação até a Copa terminar (Diego 01/09). */
  aoStatus?: (s: { pendente: boolean; campeao: { nome: string; pais: string } | null }) => void
}) {
  const [linhas, setLinhas] = useState<LinhaSala[]>([])
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

  const ler = useCallback(async () => {
    try {
      const [{ data: pls }, { data: fs }] = await Promise.all([
        supabase.from('room_players').select('user_id, player_index, manager_name, copa').eq('room_id', roomId),
        supabase.from('esc_copa_salas').select('edicao, seed, fase, vez_uid, ate, times, campeao').eq('room_id', roomId).order('edicao', { ascending: false }).limit(1),
      ])
      setLinhas((pls ?? []) as LinhaSala[])
      const f = (fs ?? [])[0] as LinhaFase | undefined
      setFase(f ? { ...f, seed: Number(f.seed) } : null)
      return { linhas: (pls ?? []) as LinhaSala[], fase: f }
    } catch { return null }
  }, [roomId])

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
    const venceu = f.ate ? Date.now() >= new Date(f.ate).getTime() : true

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
      const { data: fs } = await supabase.from('esc_copa_salas').select('edicao').eq('room_id', roomId).order('edicao', { ascending: false }).limit(1)
      const edicao = (((fs ?? [])[0] as { edicao: number } | undefined)?.edicao ?? 0) + 1
      const primeiro = fila[0]?.uid ?? null
      const { error } = await supabase.from('esc_copa_salas').insert({
        room_id: roomId, edicao, seed: Math.floor(Math.random() * 1e9), times: null,
        fase: primeiro ? 'bandeira' : 'convocacao', vez_uid: primeiro,
        ate: new Date(Date.now() + (primeiro ? SEG_BANDEIRA : SEG_CONVOCA) * 1000).toISOString(),
      })
      if (error) { setErro('Não consegui começar a Copa agora. Tenta de novo em instantes.'); return }
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

  const ficha: CopaFicha | null = fase?.fase === 'torneio' && fase.times ? { seed: fase.seed, edicao: fase.edicao, times: fase.times } : null
  useEffect(() => { if (ficha) setAberta(true) }, [ficha?.seed]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const daVezNome = fase?.vez_uid ? nomeDe.get(fase.vez_uid) ?? 'alguém' : ''
  return (
    <>
      <style>{'@keyframes cmSheen{0%{background-position:180% 180%}100%{background-position:-80% -80%}}'}</style>
      <div style={{ ...box(`linear-gradient(150deg,#FFE79A,${GOLD} 55%,#E8A200)`), padding: '11px 13px', marginBottom: 10 }}>
        <p style={{ ...OSWALD, fontWeight: 900, fontSize: 16, margin: 0, textTransform: 'uppercase', textAlign: 'center' }}>🌐 Copa do Mundo</p>
        <p style={{ fontSize: 10.5, fontWeight: 800, color: 'rgba(0,0,0,.65)', margin: '2px 0 0', textAlign: 'center', lineHeight: 1.35 }}>
          acabou a liga — os {classificacao.length} times viram seleções (+ {Math.max(0, COPA_TEAMS - classificacao.length)} da máquina)
        </p>

        {/* a fila, na ordem da tabela — quem já tem bandeira, quem está na vez */}
        {!!fila.length && (
          <div style={{ ...box('#fff'), padding: '8px 10px', marginTop: 9, boxShadow: `3px 3px 0 0 ${INK}` }}>
            <p style={{ ...OSWALD, fontWeight: 900, fontSize: 10.5, margin: '0 0 3px', textTransform: 'uppercase', color: 'rgba(0,0,0,.5)' }}>
              🥇 quem terminou na frente escolhe primeiro
            </p>
            {fila.map(f => {
              const p = picks.get(f.uid)
              const euSou = f.uid === meuUid
              const daVez = fase?.fase === 'bandeira' && fase.vez_uid === f.uid
              return (
                <div key={f.uid} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, fontWeight: euSou ? 900 : 700,
                  padding: '3px 5px', borderTop: '1px solid rgba(0,0,0,.08)', borderRadius: 6, background: daVez ? '#FFF4CF' : 'transparent' }}>
                  <span style={{ ...OSWALD, color: 'rgba(0,0,0,.45)', width: 20 }}>{f.vez}º</span>
                  <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.nome}{euSou ? ' (você)' : ''}</span>
                  {p
                    ? <span style={{ ...OSWALD, fontWeight: 900, color: temTime(p) ? GREEN : 'rgba(0,0,0,.6)' }}>{flagOf(p.pais)} {p.pais}{temTime(p) ? ' ✔️' : ''}</span>
                    : <span style={{ fontSize: 10.5, fontWeight: 800, color: daVez ? '#B23B2E' : 'rgba(0,0,0,.4)' }}>{daVez ? `⏳ ${seg}s` : 'na fila'}</span>}
                </div>
              )
            })}
          </div>
        )}

        {/* ainda não começou: o dono puxa */}
        {!fase && (souDono
          ? <>
              <button onClick={() => { void comecar() }} disabled={comecando}
                style={{ width: '100%', marginTop: 9, border: `3px solid ${INK}`, borderRadius: 12, padding: '11px 0', ...OSWALD, fontWeight: 900, fontSize: 15,
                  background: '#fff', color: INK, boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer' }}>
                {comecando ? '⏳ Começando…' : '🌐 COMEÇAR A COPA DO MUNDO'}
              </button>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,.55)', margin: '5px 2px 0', lineHeight: 1.4 }}>
                A partir daí o relógio corre: <b>{SEG_BANDEIRA}s</b> pra cada um escolher a seleção, na ordem da tabela, e depois <b>{SEG_CONVOCA}s</b> pra todos convocarem os 11 juntos.
              </p>
            </>
          : <p style={{ fontSize: 11.5, fontWeight: 800, color: 'rgba(0,0,0,.65)', margin: '9px 2px 0', textAlign: 'center', lineHeight: 1.4 }}>
              ⏳ O dono da sala abre a Copa do Mundo — segura aí.
            </p>)}

        {/* fase 1: quem NÃO é a vez fica sabendo aqui (a vez em si é tela cheia) */}
        {fase?.fase === 'bandeira' && (souAVez
          ? null
          : <p style={{ fontSize: 11.5, fontWeight: 800, color: 'rgba(0,0,0,.7)', margin: '9px 2px 0', textAlign: 'center', lineHeight: 1.4 }}>
              {minha
                ? <>{flagOf(minha.pais)} Você é a <b>{minha.pais}</b>. Agora é esperar a fila — <b>{daVezNome}</b> está escolhendo ({seg}s).</>
                : <>⏳ <b>{daVezNome}</b> está escolhendo a seleção ({seg}s). A sua vez vem na ordem da tabela.</>}
            </p>)}


        {/* fase 3: a convocação, todo mundo junto */}
        {fase?.fase === 'convocacao' && (
          <div style={{ ...box('#fff'), padding: '10px 11px', marginTop: 9, boxShadow: `3px 3px 0 0 ${INK}` }}>
            <p style={{ ...OSWALD, fontWeight: 900, fontSize: 14, margin: 0, textTransform: 'uppercase', textAlign: 'center' }}>
              {temTime(minha) ? '✅ Time convocado' : '⚽ Convoque os 11'}
            </p>
            <Relogio seg={seg} total={SEG_CONVOCA} />
            {minha && !temTime(minha) && (
              <button onClick={() => { convocando.current = true; setAgora(Date.now()) }}
                style={{ width: '100%', marginTop: 7, border: `3px solid ${INK}`, borderRadius: 12, padding: '10px 0', ...OSWALD, fontWeight: 900, fontSize: 14,
                  background: GREEN, color: '#fff', boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer' }}>⚽ VOLTAR PRA CONVOCAÇÃO</button>
            )}
            {temTime(minha) && (
              <p style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,.6)', margin: '6px 0 0', textAlign: 'center', lineHeight: 1.35 }}>
                {flagOf(minha!.pais)} <b>{minha!.pais}</b> com 11 no papel. A Copa começa quando o tempo acabar (ou quando todo mundo terminar).
              </p>
            )}
          </div>
        )}

        {!!erro && <p style={{ fontSize: 11, fontWeight: 800, color: '#B23B2E', margin: '7px 2px 0', lineHeight: 1.4 }}>{erro}</p>}
        {ficha && !aberta && (
          <button onClick={() => setAberta(true)}
            style={{ width: '100%', marginTop: 9, border: `3px solid ${INK}`, borderRadius: 12, padding: '11px 0', ...OSWALD, fontWeight: 900, fontSize: 15,
              background: '#fff', color: INK, boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer' }}>🌐 VOLTAR PRA COPA</button>
        )}
      </div>

      {/* 🖥️ AS FASES SÃO TELA CHEIA (Diego 01/09: *"o banner pra escolher seleção
          deve ser MUITO maior e aparecer de cara na tela pros usuários"*). Antes
          era uma caixinha no meio do fim de temporada e a pessoa tinha que rolar
          a tela pra achar — com 65s correndo. Agora sobe por cima de tudo. */}
      {fase?.fase === 'bandeira' && souAVez && (
        <CMModal>
          <EscolheBandeira pegas={pegas} seg={seg} aoConfirmar={p => { void gravaPais(p) }} />
        </CMModal>
      )}
      {fase?.fase === 'banner' && <CMModal><BannerDaCopa seg={seg} /></CMModal>}

      {/* a tela de convocação (a MESMA da carreira) — ela ABRE SOZINHA quando o
          banner acaba: o banner acabou de avisar que são 60s, então mandar a
          pessoa procurar um botão seria queimar metade do tempo dela. */}
      {fase?.fase === 'convocacao' && (convocando.current || !convocouRef.current) && minha && !temTime(minha) && (
        <CMModal>
          <ConvocacaoScreen pais={minha.pais} prazoSeg={seg}
            onBack={() => { convocando.current = false; convocouRef.current = true; setAgora(Date.now()) }}
            aoEstourar={(parcial, f) => { convocando.current = false; void gravaTime(parcial.map(c => `${c.name}|${c.club}|${c.year}`), f, true) }}
            onDone={(xi, f) => { convocando.current = false; void gravaTime(xi.map(c => `${c.name}|${c.club}|${c.year}`), f) }} />
        </CMModal>
      )}

      {ficha && aberta && (
        <CopaDaSala ficha={ficha} roomId={roomId} meuUid={meuUid}
          aoCampeao={(nome, pais) => { void gravaNaEstante(nome, pais) }}
          aoFechar={() => setAberta(false)} />
      )}
    </>
  )
}
