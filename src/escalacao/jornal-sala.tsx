// ─── 📰 O MARTELO · EDIÇÃO DA SALA (rápido online) ──────────────────────────
// Ideia do Diego (27/08): *"quando acabar liga e copa, aparecer o jornal O
// Martelo igual quando tem no modo carreira… um banner com quem ganhou a liga, a
// copa, e rebaixamento ou lanterna. Ou quem ficou a uma posição de se
// classificar… e seria apenas sobre os USUÁRIOS, falando deles"*.
//
// 🔀 A DIFERENÇA PRO JORNAL DA CARREIRA (`jornal.tsx`): lá o jornal fala do time
// do jogador contra times de CPU, e a manchete sai de uma tabela de 80 (uma por
// posição da pirâmide). Aqui os outros times são GENTE — então cada pessoa ganha
// a linha dela, e a Copa entra JUNTO com a liga na mesma linha.
//
// ⚖️ POR QUE LIGA E COPA NA MESMA LINHA (decidido com o Diego): a linha só da
// liga MENTE. Alguém pode terminar em 8º e ser campeão da Copa — zoar o 8º lugar
// de quem levantou taça é errado. Então a Copa manda no tom da frase.
//
// 🎯 O DRAMA DA NOITE é quem ficou a UMA posição da Copa. O corte não é fixo em
// 8: é `copaN(n)` lá no screens.tsx (40% da liga). Por isso as vagas chegam aqui
// por PROP — nada de repetir a fórmula e ela sair do lugar depois.
//
// 🃏 ORDEM: este jornal entra DEPOIS da tela do campeão, nunca no lugar dela — é
// ao montar aquela tela que a carta é gravada na conta.
import { useMemo, useRef, useState } from 'react'
import type { EscState, LeagueTeam, QuickCopaState } from './types'
import { sortedTable, topScorers } from './store'
import { Escudo } from './escudos'

const INK = '#0C0C0C', PAPEL = '#FBF6E9', VERM = '#B23A2A', GOLD = '#FFC400', GREEN = '#1B7A3D', ROXO = '#7C3AED'
const SERIF = { fontFamily: "Georgia, 'Times New Roman', serif" } as const
const COND = { fontFamily: 'Oswald, sans-serif' } as const

// ── como cada um foi na Copa ────────────────────────────────────────────────
export type CopaStatus = 'campeao' | 'vice' | 'caiu' | 'fora'
export interface CopaRunSala { status: CopaStatus; fase?: string; vs?: string; pens?: boolean }

const NOME_FASE: Record<string, string> = { oitavas: 'nas oitavas', quartas: 'nas quartas', semis: 'na semifinal', final: 'na final' }

// Lê o chaveamento e diz, pra cada id, até onde foi. `bracket` guarda as fases já
// fechadas; `ties` é a fase em andamento (no fim, já entrou no bracket).
export function runsDaCopa(copa: QuickCopaState | null | undefined): Map<number, CopaRunSala> {
  const out = new Map<number, CopaRunSala>()
  if (!copa) return out
  const fases = [...copa.bracket]
  if (copa.phase !== 'done' && copa.ties.length) fases.push({ phase: copa.phase as Exclude<typeof copa.phase, 'done'>, ties: copa.ties })
  for (const { phase, ties } of fases) {
    for (const t of ties) {
      if (t.winner == null) continue
      const perdedor = t.winner === t.aId ? t.bId : t.aId
      const nomeVencedor = t.winner === t.aId ? t.aName : t.bName
      const pens = !!t.pens
      if (phase === 'final') {
        out.set(t.winner, { status: 'campeao' })
        out.set(perdedor, { status: 'vice', vs: nomeVencedor, pens })
      } else {
        out.set(perdedor, { status: 'caiu', fase: NOME_FASE[phase] ?? `na ${phase}`, vs: nomeVencedor, pens })
        if (!out.has(t.winner)) out.set(t.winner, { status: 'caiu' }) // provisório: some quando ele aparece na fase seguinte
      }
    }
  }
  return out
}

// ── a linha de cada técnico ─────────────────────────────────────────────────
export interface LinhaSala {
  id: number; time: string; quem: string; pos: number; pts: number
  humano: boolean; voce: boolean
  nota: string
  destaque?: 'ouro' | 'roxo' | 'vermelho' | 'cinza'
}

// escolhe uma frase da lista de um jeito estável (mesma sala = mesma frase)
const pick = (arr: string[], semente: number) => arr[Math.abs(semente) % arr.length]

// A Copa manda no tom. Quando a campanha na Copa é FORTE (campeão ou vice), ela
// vira a manchete da linha e a liga vira detalhe — senão a linha mentiria.
function notaDe(
  t: LeagueTeam, pos: number, n: number, copa: CopaRunSala | undefined,
  vagasCopa: number, zonaDebaixo: number, copaNome: string, seed: number,
): { nota: string; destaque?: LinhaSala['destaque'] } {
  const s = seed + pos
  const sg = t.gf - t.ga
  const ultimo = pos === n

  // 1) campeão da Copa — sempre a manchete da linha
  if (copa?.status === 'campeao') {
    if (pos === 1) return { nota: `🏆🥇 FEZ OS DOIS. Campeão da liga e campeão da ${copaNome}. Não sobrou nada pra ninguém.`, destaque: 'ouro' }
    // ⚠️ "o último a passar" SÓ quando ele é mesmo o último classificado — o teste
    // pegou essa frase saindo pra quem não era, e frase que mente é bug.
    if (pos === vagasCopa) return { nota: `🥇 CAMPEÃO DA ${copaNome.toUpperCase()}. Entrou como o ÚLTIMO classificado, em ${pos}º, e terminou com a taça na mão. O ${pos}º lugar ninguém mais lembra.`, destaque: 'roxo' }
    return { nota: `🥇 CAMPEÃO DA ${copaNome.toUpperCase()}. Foi ${pos}º na liga e cobrou a conta no mata-mata.`, destaque: 'roxo' }
  }
  // 2) vice da Copa
  if (copa?.status === 'vice') {
    const p = copa.pens ? ' nos pênaltis' : ''
    if (pos === 1) return { nota: `🏆 Campeão da liga, mas perdeu a final da ${copaNome} pro ${copa.vs}${p}. Ficou o gosto amargo.`, destaque: 'ouro' }
    return { nota: `🥈 Chegou na final da ${copaNome} e perdeu pro ${copa.vs}${p}. ${pos}º na liga — a taça teria consertado tudo.` }
  }

  // 3) campeão da liga (sem Copa forte)
  if (pos === 1) return {
    nota: copa?.status === 'caiu' && copa.fase
      ? `🏆 CAMPEÃO DA LIGA. Levou a taça e a carta — mas caiu ${copa.fase} da ${copaNome} pro ${copa.vs}. Ninguém é perfeito.`
      : pick([
        '🏆 CAMPEÃO. Levantou a taça e levou a carta pro álbum. Fim de papo.',
        '🏆 CAMPEÃO. Comandou do começo ao fim e ainda leva carta nova pro álbum.',
        '🏆 CAMPEÃO. O pregão foi dele, o campeonato foi dele. Resenha eterna.',
      ], s), destaque: 'ouro',
  }

  // 4) o drama: primeiro de fora da Copa
  if (vagasCopa > 0 && pos === vagasCopa + 1) return {
    nota: pick([
      `❗ A UMA POSIÇÃO da ${copaNome}. Ficou de fora por nada e vai passar a semana pensando nisso.`,
      `❗ Primeiro de fora da ${copaNome}. Uma vitória a mais e estava lá dentro.`,
      `❗ Parou em ${pos}º — exatamente uma casa depois do corte da ${copaNome}. Cruel.`,
    ], s), destaque: 'vermelho',
  }

  // 5) lanterna
  if (ultimo) return {
    nota: pick([
      '🏮 LANTERNA. Gastou tudo em uma posição e esqueceu do resto do time.',
      '🏮 LANTERNA. O leilão prometia, a tabela não perdoou.',
      '🏮 LANTERNA. Fez as contas erradas no pregão e pagou nas 38 rodadas.',
    ], s), destaque: 'cinza',
  }

  // 6) caiu na Copa (linha combinada — é aqui que liga e copa se cruzam)
  if (copa?.status === 'caiu' && copa.fase) {
    const p = copa.pens ? ' nos pênaltis' : ''
    if (pos === 2) return { nota: `🥈 Vice da liga e ainda caiu ${copa.fase} da ${copaNome} pro ${copa.vs}${p}. Noite pra esquecer.` }
    return { nota: `${pos}º na liga e caiu ${copa.fase} da ${copaNome} pro ${copa.vs}${p}.` }
  }

  // 7) só a liga
  if (pos === 2) return { nota: pick([
    '🥈 Vice. Brigou o campeonato inteiro e viu a taça passar na frente na reta final.',
    '🥈 Vice. Faltou um empurrãozinho — e o empurrãozinho valia uma carta.',
    '🥈 Vice. Segundo lugar é o primeiro dos perdedores, e ele sabe disso.',
  ], s) }
  if (pos === 3 || pos === 4) return { nota: pick([
    'Pódio conquistado reclamando do juiz em todas as rodadas.',
    'Chegou perto. Perto não vale taça, não vale carta, não vale nada.',
    'Campanha de gente grande — faltou transformar respeito em troféu.',
  ], s) }
  if (pos <= vagasCopa) return { nota: pick([
    `Entrou na ${copaNome} e foi isso. Cumpriu tabela.`,
    `Se classificou pra ${copaNome} e parou por aí. Já é alguma coisa.`,
    'Time bonito no papel, campanha morna no campo.',
  ], s) }
  if (pos >= zonaDebaixo) return { nota: pick([
    'Escapou do fundo no sufoco e jura que estava tudo sob controle.',
    'Passou a temporada olhando pra baixo. E olhou de perto demais.',
    `Saldo de ${sg >= 0 ? '+' : ''}${sg}. O ataque não veio, a defesa foi embora junto.`,
  ], s) }
  return { nota: pick([
    'Ninguém lembra do meio da tabela. Nem a própria torcida.',
    'Nem alegria, nem tristeza. Café sem açúcar.',
    'Jogou, pontuou, ninguém notou.',
  ], s) }
}

// ── monta a edição inteira a partir do estado ───────────────────────────────
export interface EdicaoSala {
  linhas: LinhaSala[]
  campeaoLiga: { nome: string; quem: string; pts: number; w: number; d: number; l: number; gf: number; ga: number } | null
  campeaoCopa: { nome: string; quem: string } | null
  mesmoDono: boolean
  artilheiro: { nome: string; time: string; gols: number } | null
  lanterna: { nome: string; quem: string; pts: number } | null
  manchete: string
  linhaFina: string
  copaNome: string
  nTecnicos: number
}

export function montaEdicao(state: EscState, vagasCopa: number, zonaDebaixo: number): EdicaoSala {
  const table = sortedTable(state.league)
  const n = table.length
  const copaNome = state.copaMode === 'liga_liberta' ? 'Libertadores' : 'Copa dos 8'
  const runs = runsDaCopa(state.quickCopa)
  const mgr = (id: number) => state.managers.find(m => m.id === id)
  const seed = Math.abs(state.seed | 0)

  // 👥 só os USUÁRIOS ganham linha (pedido do Diego) — mas o campeão e o lanterna
  // entram mesmo sendo bot, senão o jornal esconderia quem ganhou.
  const linhas: LinhaSala[] = []
  table.forEach((t, i) => {
    const pos = i + 1
    const m = mgr(t.id)
    const humano = !!m?.isHuman
    if (!humano && pos !== 1 && pos !== n) return
    const { nota, destaque } = notaDe(t, pos, n, runs.get(t.id), vagasCopa, zonaDebaixo, copaNome, seed)
    linhas.push({
      id: t.id, time: t.name, quem: m?.name ?? '', pos, pts: t.pts,
      humano, voce: t.id === state.managers[state.youIdx]?.id, nota, destaque,
    })
  })

  const t1 = table[0]
  const tN = table[n - 1]
  const campeaoLiga = t1 ? { nome: t1.name, quem: mgr(t1.id)?.name ?? '', pts: t1.pts, w: t1.w, d: t1.d, l: t1.l, gf: t1.gf, ga: t1.ga } : null
  const champCopa = state.quickCopa?.champion ?? null
  const campeaoCopa = champCopa ? { nome: champCopa.name, quem: mgr(champCopa.id)?.name ?? '' } : null
  const mesmoDono = !!(champCopa && t1 && champCopa.id === t1.id)
  const art = topScorers(state, 1)[0]
  const artilheiro = art ? { nome: art.name, time: art.teamName, gols: art.goals } : null
  const lanterna = tN && n > 1 ? { nome: tN.name, quem: mgr(tN.id)?.name ?? '', pts: tN.pts } : null

  // manchete: muda quando os dois títulos têm donos diferentes
  let manchete: string, linhaFina: string
  if (campeaoCopa && campeaoLiga && !mesmoDono) {
    manchete = `NOITE DE DOIS DONOS: O ${campeaoLiga.nome.toUpperCase()} LEVA A LIGA, O ${campeaoCopa.nome.toUpperCase()} LEVA A COPA!`
    linhaFina = `Dois campeões e uma sala inteira sem saber de quem foi a noite. A liga ficou com o ${campeaoLiga.nome}, e a ${copaNome} escapou pro ${campeaoCopa.nome}.`
  } else if (campeaoCopa && campeaoLiga && mesmoDono) {
    manchete = `${campeaoLiga.nome.toUpperCase()} FAZ OS DOIS E NÃO DEIXA NADA PRA NINGUÉM!`
    linhaFina = `Campeão da liga e campeão da ${copaNome} na mesma noite. Os outros ${Math.max(0, n - 1)} que se expliquem.`
  } else if (campeaoLiga) {
    manchete = `${campeaoLiga.nome.toUpperCase()} É O CAMPEÃO DA SALA!`
    linhaFina = `${campeaoLiga.pts} pontos e a taça. O resto da sala vai ter que esperar o próximo pregão.`
  } else {
    manchete = 'FIM DE JOGO NA SALA'
    linhaFina = 'A tabela fechou.'
  }

  return { linhas, campeaoLiga, campeaoCopa, mesmoDono, artilheiro, lanterna, manchete, linhaFina, copaNome, nTecnicos: linhas.filter(l => l.humano).length }
}

// ── a capa na tela ──────────────────────────────────────────────────────────
const corDestaque: Record<NonNullable<LinhaSala['destaque']>, string> = {
  ouro: GOLD, roxo: ROXO, vermelho: '#E8503A', cinza: '#7A7460',
}

function Banner({ faixa, tag, time, sub, c1, c2, fita }: { faixa: string; tag: string; time: string; sub: string; c1: string; c2: string; fita: string }) {
  return (
    <div style={{ flex: 1, minWidth: 0, background: `linear-gradient(160deg,${c1},${c2})`, border: `3px solid ${INK}`, borderRadius: 10, padding: '14px 10px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 14, right: -40, transform: 'rotate(34deg)', background: fita, borderTop: `2px solid ${INK}`, borderBottom: `2px solid ${INK}`, ...COND, fontWeight: 700, fontSize: 8.5, padding: '2px 46px', letterSpacing: '.08em' }}>{tag}</div>
      <p style={{ ...COND, fontWeight: 700, fontSize: 8.5, color: 'rgba(255,255,255,.75)', letterSpacing: '.12em', margin: '0 0 8px' }}>{faixa}</p>
      <Escudo nome={time} size={54} />
      <p style={{ ...SERIF, fontWeight: 700, fontSize: 15, color: '#fff', margin: '9px 0 0', textAlign: 'center', lineHeight: 1.1 }}>{time}</p>
      <p style={{ ...SERIF, fontStyle: 'italic', fontSize: 10.5, color: 'rgba(255,255,255,.82)', margin: '3px 0 0', textAlign: 'center', lineHeight: 1.3 }}>{sub}</p>
    </div>
  )
}

export function JornalDaSala({ ed, onCompartilhar, compartilhando }: { ed: EdicaoSala; onCompartilhar: () => void; compartilhando: boolean }) {
  return (
    <div style={{ background: PAPEL, border: `4px solid ${INK}`, borderRadius: 14, boxShadow: `5px 5px 0 0 ${INK}`, padding: '14px 14px 12px' }}>
      {/* cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ ...SERIF, fontWeight: 700, fontSize: 26, lineHeight: 1 }}>O <span style={{ color: VERM }}>MARTELO</span></span>
        <span style={{ ...COND, fontWeight: 700, fontSize: 8.5, color: 'rgba(0,0,0,.6)', textAlign: 'right', lineHeight: 1.4 }}>
          EDIÇÃO DA SALA<br />{ed.nTecnicos} TÉCNICO{ed.nTecnicos === 1 ? '' : 'S'} · 1 MOEDA</span>
      </div>
      <div style={{ borderTop: `3px solid ${INK}`, borderBottom: `1.5px solid ${INK}`, height: 4, margin: '8px 0 6px' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', ...COND, fontWeight: 700, fontSize: 9, paddingBottom: 6, borderBottom: `3px solid ${INK}`, color: 'rgba(0,0,0,.72)' }}>
        <span>⚽ O DIÁRIO DO LEILÃO LEGENDS</span><span>FIM DE JOGO</span>
      </div>

      {/* manchete */}
      <h2 style={{ ...SERIF, fontWeight: 700, fontSize: 22, lineHeight: 1.12, margin: '12px 0 0', textTransform: 'uppercase' }}>{ed.manchete}</h2>
      <p style={{ ...SERIF, fontStyle: 'italic', fontSize: 12.5, lineHeight: 1.4, margin: '8px 0 12px', color: 'rgba(0,0,0,.78)' }}>{ed.linhaFina}</p>

      {/* banner(s) dos campeões */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {ed.campeaoLiga && (
          <Banner faixa="LIGA LEGENDS" tag="CAMPEÃO" time={ed.campeaoLiga.nome}
            sub={`${ed.campeaoLiga.quem ? `o time do ${ed.campeaoLiga.quem} · ` : ''}${ed.campeaoLiga.pts} pontos`}
            c1="#2E9E5B" c2="#14532d" fita="#DFF3E3" />
        )}
        {ed.campeaoCopa && !ed.mesmoDono && (
          <Banner faixa={ed.copaNome.toUpperCase()} tag="CAMPEÃO" time={ed.campeaoCopa.nome}
            sub={ed.campeaoCopa.quem ? `o time do ${ed.campeaoCopa.quem}` : 'campeão do mata-mata'}
            c1="#8B5CF6" c2="#4C1D95" fita="#EDE7FF" />
        )}
      </div>

      {/* os donos da noite */}
      <div style={{ border: `3px solid ${INK}`, borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
        <p style={{ ...COND, fontWeight: 700, fontSize: 11, background: INK, color: GOLD, padding: '7px 10px', letterSpacing: '.05em' }}>🏆 OS DONOS DA NOITE</p>
        <div style={{ background: '#fff' }}>
          {([
            ed.campeaoLiga && ['🏆', 'CAMPEÃO DA LIGA', ed.campeaoLiga.nome, `${ed.campeaoLiga.quem} · ${ed.campeaoLiga.pts} pontos`, GOLD],
            ed.campeaoCopa && ['🥇', `CAMPEÃO DA ${ed.copaNome.toUpperCase()}`, ed.campeaoCopa.nome, ed.campeaoCopa.quem, ROXO],
            ed.artilheiro && ['⚽', 'ARTILHEIRO DA SALA', ed.artilheiro.nome, `${ed.artilheiro.time} · ${ed.artilheiro.gols} gols`, GREEN],
            ed.lanterna && ['🏮', 'LANTERNA', ed.lanterna.nome, `${ed.lanterna.quem} · ${ed.lanterna.pts} pontos`, '#7A7460'],
          ].filter(Boolean) as [string, string, string, string, string][]).map(([ic, rot, nome, sub, cor]) => (
            <div key={rot} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 10px', borderTop: '1.5px solid rgba(0,0,0,.1)', borderLeft: `6px solid ${cor}` }}>
              <span style={{ fontSize: 17, flex: 'none' }}>{ic}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ ...COND, fontWeight: 700, fontSize: 8.5, color: 'rgba(0,0,0,.45)', margin: 0, letterSpacing: '.05em' }}>{rot}</p>
                <p style={{ ...SERIF, fontWeight: 700, fontSize: 14, margin: 0, lineHeight: 1.15 }}>{nome}
                  {sub && <span style={{ ...SERIF, fontStyle: 'italic', fontWeight: 400, fontSize: 11, color: 'rgba(0,0,0,.6)', marginLeft: 5 }}>{sub}</span>}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* as notas da redação */}
      <div style={{ border: `3px solid ${INK}`, borderRadius: 8, overflow: 'hidden' }}>
        <p style={{ ...COND, fontWeight: 700, fontSize: 11, background: VERM, color: '#fff', padding: '7px 10px', letterSpacing: '.05em' }}>📝 AS NOTAS DA REDAÇÃO</p>
        <div style={{ background: '#fff' }}>
          {ed.linhas.map(l => {
            const cor = l.destaque ? corDestaque[l.destaque] : null
            return (
              <div key={l.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '8px 10px', borderTop: '1.5px solid rgba(0,0,0,.1)', borderLeft: `6px solid ${cor ?? 'transparent'}`, background: cor ? `${cor}1f` : undefined }}>
                <span style={{ ...COND, fontWeight: 700, fontSize: 13, width: 26, flex: 'none', textAlign: 'center', color: cor ?? 'rgba(0,0,0,.4)' }}>{l.pos}º</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ ...SERIF, fontWeight: 700, fontSize: 13, margin: 0, lineHeight: 1.15 }}>{l.time}
                    {l.voce && <span style={{ ...COND, fontSize: 8.5, background: INK, color: GOLD, borderRadius: 4, padding: '1px 5px', marginLeft: 5 }}>VOCÊ</span>}
                    {l.quem && <span style={{ ...COND, fontWeight: 700, fontSize: 9.5, color: 'rgba(0,0,0,.45)', marginLeft: 5 }}>{l.quem} · {l.pts} pts</span>}</p>
                  <p style={{ ...SERIF, fontSize: 11.5, margin: '2px 0 0', lineHeight: 1.35, color: 'rgba(0,0,0,.78)' }}>{l.nota}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 🥇 rodapé dourado — é ele que vai junto na imagem compartilhada */}
      <div style={{ marginTop: 12, background: `linear-gradient(100deg,#FFD44A,${GOLD} 45%,#E0A800)`, border: `3px solid ${INK}`, borderRadius: 8, padding: '9px 8px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(115deg,transparent 32%,rgba(255,255,255,.55) 48%,transparent 63%)' }} />
        <p style={{ ...COND, fontWeight: 700, fontSize: 16, position: 'relative', letterSpacing: '.03em' }}>🔨 leilaolegends.com</p>
      </div>

      <button onClick={onCompartilhar} disabled={compartilhando}
        style={{ marginTop: 12, width: '100%', background: GREEN, color: '#fff', border: `3px solid ${INK}`, borderRadius: 12, boxShadow: `3px 3px 0 0 ${INK}`, padding: '11px 0', ...COND, fontWeight: 700, fontSize: 15 }}>
        {compartilhando ? '⏳ montando a imagem…' : '📲 Compartilhar o jornal'}
      </button>
    </div>
  )
}

// ── a mesma capa desenhada em CANVAS, pra virar imagem PNG ──────────────────
// (mesma técnica do jornal da carreira: `jornal.tsx` → buildJornalBlob)
export async function buildSalaBlob(ed: EdicaoSala): Promise<Blob | null> {
  const W = 1080
  const cv = document.createElement('canvas')
  const x = cv.getContext('2d')
  if (!x) return null
  try { await document.fonts.load('700 60px Oswald') } catch { /* segue */ }
  const SER = "Georgia, 'Times New Roman', serif", OSW = 'Oswald, sans-serif'
  const L = 52, R = W - 52, MAXW = R - L

  const wrap = (t: string, font: string, maxW: number): string[] => {
    x.font = font
    const out: string[] = []; let line = ''
    for (const w of t.split(' ')) {
      const test = line ? line + ' ' + w : w
      if (x.measureText(test).width > maxW && line) { out.push(line); line = w } else line = test
    }
    if (line) out.push(line)
    return out
  }
  // 1ª passada: mede a altura necessária (a lista de notas varia com a sala)
  const hManchete = wrap(ed.manchete, `700 54px ${SER}`, MAXW).length * 60
  const hFina = wrap(ed.linhaFina, `italic 26px ${SER}`, MAXW).length * 34
  const nDonos = [ed.campeaoLiga, ed.campeaoCopa, ed.artilheiro, ed.lanterna].filter(Boolean).length
  let hNotas = 56
  for (const l of ed.linhas) hNotas += 40 + wrap(l.nota, `22px ${SER}`, MAXW - 80).length * 28
  const H = 250 + hManchete + hFina + 230 + (56 + nDonos * 74) + 26 + hNotas + 26 + 110 + 40
  cv.width = W; cv.height = H

  // papel
  x.fillStyle = PAPEL; x.fillRect(0, 0, W, H)
  x.strokeStyle = INK; x.lineWidth = 6; x.strokeRect(12, 12, W - 24, H - 24)
  let y = 108
  // masthead
  x.textAlign = 'left'; x.font = `700 62px ${SER}`
  x.fillStyle = INK; x.fillText('O ', L, y)
  x.fillStyle = VERM; x.fillText('MARTELO', L + x.measureText('O ').width, y)
  x.textAlign = 'right'; x.fillStyle = '#3a3527'; x.font = `700 20px ${OSW}`
  x.fillText('EDIÇÃO DA SALA', R, y - 30)
  x.fillText(`${ed.nTecnicos} TÉCNICO${ed.nTecnicos === 1 ? '' : 'S'} · PREÇO: 1 MOEDA`, R, y - 4)
  y += 20
  x.strokeStyle = INK; x.lineWidth = 3
  x.beginPath(); x.moveTo(L, y); x.lineTo(R, y); x.stroke()
  x.beginPath(); x.moveTo(L, y + 7); x.lineTo(R, y + 7); x.stroke()
  y += 40
  x.textAlign = 'left'; x.font = `700 21px ${OSW}`; x.fillStyle = '#3a3527'
  x.fillText('⚽ O DIÁRIO DO LEILÃO LEGENDS', L, y)
  x.textAlign = 'right'; x.fillText('FIM DE JOGO', R, y)
  y += 14
  x.lineWidth = 1.5; x.beginPath(); x.moveTo(L, y); x.lineTo(R, y); x.stroke()

  // manchete
  y += 60
  x.textAlign = 'left'; x.fillStyle = INK
  for (const ln of wrap(ed.manchete, `700 54px ${SER}`, MAXW)) { x.font = `700 54px ${SER}`; x.fillText(ln, L, y); y += 60 }
  y += 6
  x.fillStyle = 'rgba(0,0,0,.78)'
  for (const ln of wrap(ed.linhaFina, `italic 26px ${SER}`, MAXW)) { x.font = `italic 26px ${SER}`; x.fillText(ln, L, y); y += 34 }

  // banners dos campeões
  y += 20
  const bh = 200
  const dois = !!(ed.campeaoCopa && !ed.mesmoDono)
  const bw = dois ? (MAXW - 16) / 2 : MAXW
  const desenhaBanner = (bx: number, faixa: string, time: string, sub: string, c1: string, c2: string) => {
    const g = x.createLinearGradient(bx, y, bx + bw, y + bh)
    g.addColorStop(0, c1); g.addColorStop(1, c2)
    x.fillStyle = g; x.fillRect(bx, y, bw, bh)
    x.strokeStyle = INK; x.lineWidth = 4; x.strokeRect(bx, y, bw, bh)
    x.textAlign = 'center'
    x.font = `700 17px ${OSW}`; x.fillStyle = 'rgba(255,255,255,.75)'
    x.fillText(faixa, bx + bw / 2, y + 34)
    x.font = `700 34px ${SER}`; x.fillStyle = '#fff'
    x.fillText(time, bx + bw / 2, y + 106)
    x.font = `italic 20px ${SER}`; x.fillStyle = 'rgba(255,255,255,.85)'
    x.fillText(sub, bx + bw / 2, y + 146)
    x.font = `700 20px ${OSW}`; x.fillStyle = GOLD
    x.fillText('🏆 CAMPEÃO', bx + bw / 2, y + 180)
  }
  if (ed.campeaoLiga) desenhaBanner(L, 'LIGA LEGENDS', ed.campeaoLiga.nome, `${ed.campeaoLiga.quem ? `o time do ${ed.campeaoLiga.quem} · ` : ''}${ed.campeaoLiga.pts} pontos`, '#2E9E5B', '#14532d')
  if (dois && ed.campeaoCopa) desenhaBanner(L + bw + 16, ed.copaNome.toUpperCase(), ed.campeaoCopa.nome, ed.campeaoCopa.quem ? `o time do ${ed.campeaoCopa.quem}` : 'campeão do mata-mata', '#8B5CF6', '#4C1D95')
  y += bh + 30

  // os donos da noite
  x.fillStyle = INK; x.fillRect(L, y, MAXW, 46)
  x.textAlign = 'left'; x.font = `700 24px ${OSW}`; x.fillStyle = GOLD
  x.fillText('🏆 OS DONOS DA NOITE', L + 14, y + 32)
  let dy = y + 46
  const donos: [string, string, string, string, string][] = []
  if (ed.campeaoLiga) donos.push(['🏆', 'CAMPEÃO DA LIGA', ed.campeaoLiga.nome, `${ed.campeaoLiga.quem} · ${ed.campeaoLiga.pts} pontos`, GOLD])
  if (ed.campeaoCopa) donos.push(['🥇', `CAMPEÃO DA ${ed.copaNome.toUpperCase()}`, ed.campeaoCopa.nome, ed.campeaoCopa.quem, ROXO])
  if (ed.artilheiro) donos.push(['⚽', 'ARTILHEIRO DA SALA', ed.artilheiro.nome, `${ed.artilheiro.time} · ${ed.artilheiro.gols} gols`, GREEN])
  if (ed.lanterna) donos.push(['🏮', 'LANTERNA', ed.lanterna.nome, `${ed.lanterna.quem} · ${ed.lanterna.pts} pontos`, '#7A7460'])
  for (const [ic, rot, nome, sub, cor] of donos) {
    x.fillStyle = '#fff'; x.fillRect(L, dy, MAXW, 74)
    x.fillStyle = cor; x.fillRect(L, dy, 9, 74)
    x.font = `28px ${SER}`; x.fillStyle = INK; x.fillText(ic, L + 24, dy + 46)
    x.font = `700 15px ${OSW}`; x.fillStyle = 'rgba(0,0,0,.45)'; x.fillText(rot, L + 74, dy + 26)
    x.font = `700 26px ${SER}`; x.fillStyle = INK; x.fillText(nome, L + 74, dy + 56)
    const nw = x.measureText(nome).width
    if (sub) { x.font = `italic 19px ${SER}`; x.fillStyle = 'rgba(0,0,0,.6)'; x.fillText(sub, L + 74 + nw + 12, dy + 55) }
    x.strokeStyle = 'rgba(0,0,0,.12)'; x.lineWidth = 1.5
    x.beginPath(); x.moveTo(L, dy + 74); x.lineTo(R, dy + 74); x.stroke()
    dy += 74
  }
  x.strokeStyle = INK; x.lineWidth = 4; x.strokeRect(L, y, MAXW, dy - y)
  y = dy + 26

  // as notas da redação
  const notasTop = y
  x.fillStyle = VERM; x.fillRect(L, y, MAXW, 46)
  x.textAlign = 'left'; x.font = `700 24px ${OSW}`; x.fillStyle = '#fff'
  x.fillText('📝 AS NOTAS DA REDAÇÃO', L + 14, y + 32)
  let ny = y + 46
  for (const l of ed.linhas) {
    const linhasNota = wrap(l.nota, `22px ${SER}`, MAXW - 80)
    const alt = 40 + linhasNota.length * 28
    x.fillStyle = '#fff'; x.fillRect(L, ny, MAXW, alt)
    const cor = l.destaque ? corDestaque[l.destaque] : null
    if (cor) { x.fillStyle = cor + '2b'; x.fillRect(L, ny, MAXW, alt); x.fillStyle = cor; x.fillRect(L, ny, 9, alt) }
    x.font = `700 22px ${OSW}`; x.fillStyle = cor ?? 'rgba(0,0,0,.4)'
    x.fillText(`${l.pos}º`, L + 20, ny + 30)
    x.font = `700 23px ${SER}`; x.fillStyle = INK
    x.fillText(l.time, L + 74, ny + 30)
    const tw = x.measureText(l.time).width
    if (l.quem) { x.font = `700 15px ${OSW}`; x.fillStyle = 'rgba(0,0,0,.45)'; x.fillText(`${l.quem} · ${l.pts} pts`, L + 74 + tw + 12, ny + 29) }
    x.font = `22px ${SER}`; x.fillStyle = 'rgba(0,0,0,.78)'
    let ly = ny + 58
    for (const ln of linhasNota) { x.fillText(ln, L + 74, ly); ly += 28 }
    x.strokeStyle = 'rgba(0,0,0,.12)'; x.lineWidth = 1.5
    x.beginPath(); x.moveTo(L, ny + alt); x.lineTo(R, ny + alt); x.stroke()
    ny += alt
  }
  x.strokeStyle = INK; x.lineWidth = 4; x.strokeRect(L, notasTop, MAXW, ny - notasTop)
  y = ny + 26

  // 🥇 rodapé dourado
  const g = x.createLinearGradient(L, y, R, y + 84)
  g.addColorStop(0, '#FFD44A'); g.addColorStop(0.45, GOLD); g.addColorStop(1, '#E0A800')
  x.fillStyle = g; x.fillRect(L, y, MAXW, 84)
  x.strokeStyle = INK; x.lineWidth = 5; x.strokeRect(L, y, MAXW, 84)
  x.fillStyle = INK; x.font = `700 36px ${OSW}`; x.textAlign = 'center'
  x.fillText('🔨 leilaolegends.com', W / 2, y + 54)

  return new Promise(res => cv.toBlob(b => res(b), 'image/png'))
}

// ── o bloco pronto pro EscEnd: capa + compartilhar ──────────────────────────
export function JornalDaSalaBloco({ state, vagasCopa, zonaDebaixo }: { state: EscState; vagasCopa: number; zonaDebaixo: number }) {
  const ed = useMemo(() => montaEdicao(state, vagasCopa, zonaDebaixo), [state, vagasCopa, zonaDebaixo])
  const [busy, setBusy] = useState(false)
  const travaRef = useRef(false)

  async function compartilhar() {
    if (travaRef.current) return
    travaRef.current = true; setBusy(true)
    try {
      const blob = await buildSalaBlob(ed)
      const txt = `📰 "${ed.manchete}" — Leilão Legends. Monta o teu time: https://leilaolegends.com`
      if (blob) {
        const file = new File([blob], 'o-martelo-sala.png', { type: 'image/png' })
        const sd = { files: [file], title: 'O MARTELO', text: txt }
        if (navigator.canShare?.(sd)) { try { await navigator.share(sd) } catch { /* cancelou */ } return }
        // sem share de arquivo (desktop): baixa a imagem
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = 'o-martelo-sala.png'; a.click()
        setTimeout(() => URL.revokeObjectURL(url), 4000)
        return
      }
      if (navigator.share) { try { await navigator.share({ text: txt }) } catch { /* cancelou */ } }
    } catch { /* imagem falhou — não trava a tela */ }
    finally { travaRef.current = false; setBusy(false) }
  }

  if (!ed.campeaoLiga) return null
  return <JornalDaSala ed={ed} onCompartilhar={compartilhar} compartilhando={busy} />
}
