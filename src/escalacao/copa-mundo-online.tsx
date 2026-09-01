// ─── 🌍 COPA DO MUNDO ONLINE — a Copa da TURMA ───────────────────────────────
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

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { rankingSelecoes } from './paises'
import {
  CMModal, ConvocacaoScreen, CupScreen, COPA_TEAMS, flagOf,
  countryPool, xiPorChaves, xiDaMaquina, xiStrength,
  type Entrant, type Formation, type CopaSave,
} from './copa-mundo'

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D'
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
          {minha ? `${flagOf(minha.pais)} Você é a ${minha.pais}` : '🌍 Escolha a sua seleção'}
        </p>
        <p style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,.6)', margin: '3px 0 0', lineHeight: 1.45 }}>
          {minha
            ? <>11 convocados no papel. Agora é esperar a turma — o dono da sala abre a Copa quando todo mundo estiver pronto.</>
            : <>Cada um pega <b>uma seleção</b> e convoca <b>11 jogadores</b> do país. Não tem leilão aqui: é convocação pura, e o time é seu do começo ao fim da Copa.</>}
        </p>
        <button onClick={() => { setPais(null); setTela('pais') }}
          style={{ width: '100%', marginTop: 8, border: `2.5px solid ${INK}`, borderRadius: 11, padding: '9px 0', ...OSWALD, fontWeight: 900, fontSize: 13,
            background: minha ? '#fff' : `linear-gradient(150deg,#FFE79A,${GOLD} 55%,#E8A200)`, color: INK, boxShadow: `3px 3px 0 0 ${INK}`, cursor: 'pointer' }}>
          {minha ? '🔁 Trocar de seleção' : '🌍 ESCOLHER MINHA SELEÇÃO'}
        </button>
        {erro && <p style={{ fontSize: 10.5, fontWeight: 800, color: '#B23B2E', margin: '6px 0 0', lineHeight: 1.4 }}>{erro}</p>}
      </div>

      {tela === 'pais' && (
        <CMModal>
          <p style={{ ...OSWALD, fontWeight: 900, fontSize: 19, margin: 0, textAlign: 'center', textTransform: 'uppercase' }}>🌍 Escolha sua seleção</p>
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
        🌍 Convocados · {prontos.length} de {total}
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
            {abrindo ? '⏳ Abrindo…' : podeAbrir ? '🌍 ABRIR A COPA DO MUNDO' : '🌍 Precisa de 2 seleções'}
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
      <p style={{ ...OSWALD, fontWeight: 900, fontSize: 15, margin: 0, textTransform: 'uppercase' }}>🌍 Copa do Mundo Legends</p>
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

// ─── 5) 🌍 COPA DO MUNDO DEPOIS DA LIGA (01/09) ──────────────────────────────
//
// Regras que o Diego ditou, em uma frase cada:
//  · *"a escolha das seleções é com base na colocação da liga: quem ficou em
//    primeiro escolhe primeiro, o segundo escolhe em segundo, até o último —
//    dos usuários online. Os bots ficam com as sobras."*
//  · *"vão ter 24 seleções, além dos 20 times da liga: quando começar a Copa vão
//    ter 4 bots jogando pelos 4 países restantes."*
//
// ⏱️ E UMA COISA QUE EU MUDEI DE PROPÓSITO, pela regra de ouro dele ("nada pode
// atrasar o ritmo do jogo"): a ORDEM vale só pra ESCOLHER A BANDEIRA, que é um
// toque. A CONVOCAÇÃO todo mundo faz junto, na hora que quiser. Se a ordem
// valesse pros 11 também, a sala inteira ficaria parada esperando o 1º colocado
// montar time — e aí a vantagem de ter ganhado a liga viraria castigo pros outros.
//
// 🏠 A ficha mora em `esc_copa_salas`, NÃO no `game_state`: com a bola rolando o
// save do host reescreve o `game_state` inteiro a cada 3s (o conserto de 23/08) e
// apagaria a Copa no primeiro save.

export interface LugarNaLiga { id: number; nome: string; humano: boolean }

/** monta as 24 seleções: os 20 times da liga (na ordem da tabela) + 4 da máquina */
export function montaFichaDaLiga(
  classificacao: LugarNaLiga[],
  uidDe: Map<number, string>,
  picks: Map<string, CopaPick>,
  seed: number,
  edicao: number,
): CopaFicha {
  const times: CopaTime[] = []
  const pegos = new Set<string>()
  const livre = () => paisesDaCopa().find(p => !pegos.has(p)) ?? paisesDaCopa()[0]
  for (const lugar of classificacao) {
    const uid = uidDe.get(lugar.id)
    const pick = uid ? picks.get(uid) : undefined
    if (pick && !pegos.has(pick.pais)) {
      pegos.add(pick.pais)
      times.push({ pais: pick.pais, nome: lugar.nome, uid, xiKeys: pick.xiKeys })
    } else {
      // bot (ou quem não escolheu a tempo): leva a melhor seleção que sobrou
      const p = livre(); pegos.add(p)
      times.push({ pais: p, nome: lugar.nome, ...(uid ? { uid } : {}) })
    }
  }
  // as vagas que faltam pra fechar 24 são seleções da máquina, com o nome do país
  for (const p of paisesDaCopa()) {
    if (times.length >= COPA_TEAMS) break
    if (pegos.has(p)) continue
    pegos.add(p); times.push({ pais: p, nome: p })
  }
  return { seed, edicao, times: times.slice(0, COPA_TEAMS) }
}

interface LinhaSala { user_id: string; player_index: number; manager_name: string; copa: CopaPick | null }

export function CopaDaLigaGate({ roomId, souDono, meuUid, classificacao, matchSeed }: {
  roomId: string
  souDono: boolean
  meuUid?: string
  /** a tabela FINAL da liga, do 1º ao último (id = número do técnico) */
  classificacao: LugarNaLiga[]
  /** a semente da partida — é a chave da linha desta temporada na estante */
  matchSeed?: number
}) {
  const [linhas, setLinhas] = useState<LinhaSala[]>([])
  const [ficha, setFicha] = useState<CopaFicha | null>(null)
  const [aberta, setAberta] = useState(false)
  const [abrindo, setAbrindo] = useState(false)
  const [erro, setErro] = useState('')

  // 🔁 sem canal novo: uma batidinha a cada 3s. É a tela de FIM de temporada (um
  // tempo morto), as linhas são minúsculas e assim não depende de tempo real
  // nenhum pra funcionar — se a rede piscar, a próxima batida resolve.
  useEffect(() => {
    let vivo = true
    const ler = async () => {
      try {
        const [{ data: pls }, { data: fic }] = await Promise.all([
          supabase.from('room_players').select('user_id, player_index, manager_name, copa').eq('room_id', roomId),
          supabase.from('esc_copa_salas').select('seed, edicao, times').eq('room_id', roomId).order('edicao', { ascending: false }).limit(1),
        ])
        if (!vivo) return
        setLinhas((pls ?? []) as LinhaSala[])
        const f = (fic ?? [])[0] as { seed: number; edicao: number; times: CopaTime[] } | undefined
        if (f) setFicha({ seed: Number(f.seed), edicao: f.edicao, times: f.times })
      } catch { /* a próxima batida tenta de novo */ }
    }
    void ler()
    const iv = setInterval(ler, 3000)
    return () => { vivo = false; clearInterval(iv) }
  }, [roomId])

  // 🌍 a Copa abre sozinha na tela de todo mundo quando a ficha aparece
  useEffect(() => { if (ficha) setAberta(true) }, [ficha?.seed]) // eslint-disable-line react-hooks/exhaustive-deps

  const uidDe = useMemo(() => new Map(linhas.map(l => [l.player_index, l.user_id])), [linhas])
  const picks = useMemo(() => {
    const m = new Map<string, CopaPick>()
    for (const l of linhas) if (copaPickOk(l.copa)) m.set(l.user_id, l.copa)
    return m
  }, [linhas])

  // a FILA: só gente, na ordem da tabela
  const fila = useMemo(() => classificacao
    .filter(c => c.humano && uidDe.has(c.id))
    .map((c, i) => ({ ...c, uid: uidDe.get(c.id)!, vez: i + 1 })), [classificacao, uidDe])
  const minhaVez = fila.findIndex(f => f.uid === meuUid)
  const faltamAntesDeMim = minhaVez < 0 ? 0 : fila.slice(0, minhaVez).filter(f => !picks.has(f.uid)).length
  const souOProximo = minhaVez >= 0 && faltamAntesDeMim === 0 && !picks.has(meuUid ?? '')
  const quemFalta = fila.filter(f => !picks.has(f.uid))
  const daVezAgora = quemFalta[0]
  const minha = meuUid ? picks.get(meuUid) ?? null : null
  const pegasPorOutros = fila.filter(f => f.uid !== meuUid && picks.has(f.uid))
    .map(f => ({ pais: picks.get(f.uid)!.pais, nome: f.nome }))

  async function abrirCopa(mesmoAssim: boolean) {
    if (!souDono || abrindo) return
    if (!mesmoAssim && quemFalta.length > 0) return
    setAbrindo(true); setErro('')
    try {
      const { data: fic } = await supabase.from('esc_copa_salas').select('edicao').eq('room_id', roomId).order('edicao', { ascending: false }).limit(1)
      const edicao = (((fic ?? [])[0] as { edicao: number } | undefined)?.edicao ?? 0) + 1
      const nova = montaFichaDaLiga(classificacao, uidDe, picks, Math.floor(Math.random() * 1e9), edicao)
      const { error } = await supabase.from('esc_copa_salas').insert({ room_id: roomId, edicao, seed: nova.seed, times: nova.times })
      if (error) { setErro('Não consegui abrir a Copa agora. Tenta de novo em instantes.'); setAbrindo(false); return }
      setFicha(nova); setAberta(true)
    } finally { setAbrindo(false) }
  }

  // 🏆 o campeão do mundo entra na MESMA linha da estante daquela temporada
  async function gravaNaEstante(campeao: string, pais: string) {
    if (!souDono || matchSeed == null) return
    try {
      const { data: existe } = await supabase.from('game_champions').select('id').eq('room_id', roomId).eq('match_seed', matchSeed).maybeSingle()
      if (existe) await supabase.from('game_champions').update({ copa_champion_name: `${campeao} (${pais})` }).eq('id', existe.id)
    } catch { /* nunca trava a Copa */ }
  }

  return (
    <>
      <div style={{ ...box(`linear-gradient(150deg,#FFE79A,${GOLD} 55%,#E8A200)`), padding: '11px 13px', marginBottom: 10 }}>
        <p style={{ ...OSWALD, fontWeight: 900, fontSize: 16, margin: 0, textTransform: 'uppercase', textAlign: 'center' }}>🌍 Copa do Mundo</p>
        <p style={{ fontSize: 10.5, fontWeight: 800, color: 'rgba(0,0,0,.65)', margin: '2px 0 0', textAlign: 'center', lineHeight: 1.35 }}>
          acabou a liga — agora os {classificacao.length} times viram seleções (+ {Math.max(0, COPA_TEAMS - classificacao.length)} da máquina)
        </p>

        {/* a fila, na ordem da tabela */}
        <div style={{ ...box('#fff'), padding: '8px 10px', marginTop: 9, boxShadow: `3px 3px 0 0 ${INK}` }}>
          <p style={{ ...OSWALD, fontWeight: 900, fontSize: 10.5, margin: '0 0 4px', textTransform: 'uppercase', color: 'rgba(0,0,0,.5)' }}>
            🥇 quem terminou na frente escolhe primeiro
          </p>
          {fila.map(f => {
            const p = picks.get(f.uid)
            const euSou = f.uid === meuUid
            const daVez = daVezAgora?.uid === f.uid
            return (
              <div key={f.uid} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, fontWeight: euSou ? 900 : 700,
                padding: '3px 5px', borderTop: '1px solid rgba(0,0,0,.08)', borderRadius: 6, background: daVez && !p ? '#FFF4CF' : 'transparent' }}>
                <span style={{ ...OSWALD, color: 'rgba(0,0,0,.45)', width: 20 }}>{f.vez}º</span>
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.nome}{euSou ? ' (você)' : ''}</span>
                {p
                  ? <span style={{ ...OSWALD, fontWeight: 900, color: GREEN }}>{flagOf(p.pais)} {p.pais}</span>
                  : <span style={{ fontSize: 10.5, fontWeight: 800, color: daVez ? '#B23B2E' : 'rgba(0,0,0,.4)' }}>{daVez ? '⏳ escolhendo…' : 'na fila'}</span>}
              </div>
            )
          })}
        </div>

        {/* a minha vez (ou a espera) */}
        {meuUid && minhaVez >= 0 && !minha && (
          souOProximo
            ? <div style={{ marginTop: 9 }}>
                <EscolhaSelecao roomId={roomId} meuUid={meuUid} minha={null} pegasPorOutros={pegasPorOutros} aoEscolher={() => { /* a batidinha relê */ }} />
              </div>
            : <p style={{ fontSize: 11, fontWeight: 800, color: 'rgba(0,0,0,.65)', margin: '9px 2px 0', lineHeight: 1.4, textAlign: 'center' }}>
                ⏳ Você escolhe em <b>{minhaVez + 1}º</b> — {daVezAgora ? <>agora é a vez do <b>{daVezAgora.nome}</b>.</> : 'já já é a sua vez.'} A escolha da bandeira é <b>um toque só</b>, não demora.
              </p>
        )}
        {minha && (
          <p style={{ fontSize: 11.5, fontWeight: 800, color: 'rgba(0,0,0,.7)', margin: '9px 2px 0', textAlign: 'center', lineHeight: 1.4 }}>
            {flagOf(minha.pais)} Você é a <b>{minha.pais}</b> — 11 convocados no papel. {quemFalta.length > 0 ? `Falta ${quemFalta.length} escolher.` : 'Todo mundo pronto!'}
          </p>
        )}

        {/* o dono abre */}
        {souDono && !ficha && (
          <>
            <button onClick={() => { void abrirCopa(false) }} disabled={quemFalta.length > 0 || abrindo}
              style={{ width: '100%', marginTop: 9, border: `3px solid ${INK}`, borderRadius: 12, padding: '11px 0', ...OSWALD, fontWeight: 900, fontSize: 15,
                background: quemFalta.length === 0 ? '#fff' : '#ded5bd', color: INK, boxShadow: quemFalta.length === 0 ? `4px 4px 0 0 ${INK}` : 'none',
                cursor: quemFalta.length === 0 && !abrindo ? 'pointer' : 'default' }}>
              {abrindo ? '⏳ Abrindo…' : quemFalta.length === 0 ? '🌍 ABRIR A COPA DO MUNDO' : `🌍 Faltam ${quemFalta.length} escolher`}
            </button>
            {/* 🚪 SAÍDA PRA SALA NÃO MORRER: se alguém fechou o app no meio, o dono
                não pode ficar preso pra sempre esperando. Ele abre mesmo assim, e a
                tela diz exatamente o que acontece com quem não escolheu. */}
            {quemFalta.length > 0 && (
              <button onClick={() => { if (window.confirm(`${quemFalta.map(q => q.nome).join(', ')} não escolheu seleção. Abrir a Copa assim? Quem não escolheu entra com uma seleção sorteada e o time que a máquina montar.`)) void abrirCopa(true) }}
                style={{ width: '100%', marginTop: 6, border: 'none', background: 'transparent', ...OSWALD, fontWeight: 900, fontSize: 11, color: 'rgba(0,0,0,.55)', textDecoration: 'underline', cursor: 'pointer' }}>
                abrir mesmo assim (quem não escolheu entra sorteado)
              </button>
            )}
          </>
        )}
        {!!erro && <p style={{ fontSize: 11, fontWeight: 800, color: '#B23B2E', margin: '7px 2px 0', lineHeight: 1.4 }}>{erro}</p>}
        {ficha && !aberta && (
          <button onClick={() => setAberta(true)}
            style={{ width: '100%', marginTop: 9, border: `3px solid ${INK}`, borderRadius: 12, padding: '11px 0', ...OSWALD, fontWeight: 900, fontSize: 15,
              background: '#fff', color: INK, boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer' }}>
            🌍 VOLTAR PRA COPA
          </button>
        )}
      </div>

      {ficha && aberta && (
        <CopaDaSala ficha={ficha} roomId={roomId} meuUid={meuUid}
          aoCampeao={(nome, pais) => { void gravaNaEstante(nome, pais) }}
          aoFechar={() => setAberta(false)} />
      )}
    </>
  )
}
