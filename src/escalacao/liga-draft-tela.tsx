// 📋 A NOITE DO DRAFT — a tela (19/10, mockups aprovados: `scripts/mockups/draft.png` e `draft-anuncio.png`).
// Quem manda é o reducer do dono (DRAFT_* em store.tsx); aqui só se desenha, se roteia a escolha e — no aparelho do dono —
// se tica o relógio. As regras moram em `liga-draft.ts` e a tela lê as MESMAS funções (sem regra própria = sem botão mudo).
import { useEffect, useMemo, useRef, useState } from 'react'
import { useEsc } from './store'
import { Shell, CollectibleCard } from './screens'
import { useT } from './lang'
import { agoraSala } from './relogio'
import { playTick } from './sound'
import { flagOf } from './copa-mundo'
import { seloDoClube } from './selo-clube'
import type { Card, Sector } from './types'
import {
  cartasLivres, nomesOcupados, podemSair, chaveCarta, chaveNome, categoriaDa, decadaDe, paisDaCarta,
  DRAFT_PISTA_MS, DRAFT_VIRA_MS, type DraftPick,
} from './liga-draft'

const GOLD = '#FFC400', INK = '#0C0C0C', GREEN = '#1B7A3D', ROXO = '#7C3AED', RED = '#C2452F'
const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 700 } as const
const POS: Sector[] = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']
const forca = (c: Card) => c.fame * 1000 + (c.hi ?? 0) * 2 + (c.lo ?? 0)
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function EscLigaDraft() {
  const { state, dispatch } = useEsc()
  const t = useT()
  const d = state.draft
  const online = state.onlineMode === 'online'
  const euTico = !online || state.isHost
  const [agora, setAgora] = useState(agoraSala())
  useEffect(() => { const iv = setInterval(() => setAgora(agoraSala()), 250); return () => clearInterval(iv) }, [])
  // ⏱️ só o dono tica (o reducer confere o prazo): tempo esgotado → escolha automática; anúncio acabou → próximo
  useEffect(() => {
    if (!d || !euTico) return
    const iv = setInterval(() => dispatch({ type: 'DRAFT_TICK' }), 500)
    return () => clearInterval(iv)
  }, [!!d, euTico]) // eslint-disable-line react-hooks/exhaustive-deps

  const you = state.managers[state.youIdx]
  if (!d || !you) return <Shell><div className="pt-10 text-center text-5xl">📋</div></Shell>
  const vezId = d.ordem[d.idx]
  const daVez = state.managers.find(m => m.id === vezId)
  const minhaVez = d.fase === 'escolha' && vezId === you.id
  const restante = Math.max(0, Math.ceil((d.prazo - agora) / 1000))
  const ultimo = d.fase === 'revela' ? d.picks[d.picks.length - 1] : undefined
  const nome = (id: number) => state.managers.find(m => m.id === id)?.teamName ?? '?'

  return (
    <Shell>
      <div className="space-y-3 pb-6">
        <div className="rounded-2xl border-[3px] border-black px-3 py-2.5 flex items-center gap-2.5" style={{ background: INK, boxShadow: `3px 3px 0 ${INK}` }}>
          <span style={{ fontSize: 26 }}>📋</span>
          <div className="min-w-0">
            <p className="text-white uppercase leading-none" style={{ ...OSW, fontSize: 17 }}>{t('Noite do draft', 'Draft night')} · {t('temporada', 'season')} {d.temporada + 1}</p>
            <p className="text-white/65 text-[11px] font-bold mt-1">{t('Cada técnico pega 1 jogador, de todos do jogo. O campeão escolhe primeiro.', 'Each manager picks 1 player from the whole game. The champion picks first.')}</p>
          </div>
        </div>

        <OrdemDraft ordem={d.ordem} idx={d.idx} fase={d.fase} picks={d.picks} nome={nome} youId={you.id} />

        {ultimo ? (
          <AnuncioDraft key={`${ultimo.mgrId}-${d.idx}`} pick={ultimo} n={d.idx + 1} quem={nome(ultimo.mgrId)} decorrido={agora - (d.inicioRevela ?? agora)} />
        ) : minhaVez ? (
          <EscolhaDraft restante={restante} n={d.idx + 1} />
        ) : (
          <div className="space-y-2.5">
            <div className="rounded-2xl border-[3px] border-black px-3 py-2.5 text-center" style={{ background: ROXO, boxShadow: `3px 3px 0 ${INK}` }}>
              <p className="text-white/85 text-[12px] uppercase tracking-wider" style={OSW}>{t(`Com a ${d.idx + 1}ª escolha do draft…`, `With pick #${d.idx + 1} of the draft…`)}</p>
              <p className="text-white uppercase leading-tight" style={{ ...OSW, fontSize: 24 }}>{daVez?.teamName ?? '?'} {t('está escolhendo', 'is picking')}</p>
            </div>
            <Coberta etapa={0} />
            <p className="text-center font-black text-[13px]" style={{ ...OSW, color: restante <= 10 ? RED : INK }}>⏱ {restante}s</p>
            <p className="text-center text-[11.5px] font-bold text-black/60">{t('Ninguém vê a escolha do outro até a carta virar. Se o tempo acabar, o jogo escolhe o melhor jogador livre por ele.', 'Nobody sees the pick until the card flips. If time runs out, the game takes the best free player for them.')}</p>
          </div>
        )}
      </div>
    </Shell>
  )
}

function OrdemDraft({ ordem, idx, fase, picks, nome, youId }: { ordem: number[]; idx: number; fase: 'escolha' | 'revela'; picks: DraftPick[]; nome: (id: number) => string; youId: number }) {
  const t = useT()
  return (
    <div className="rounded-2xl border-[3px] border-black overflow-hidden bg-white" style={{ boxShadow: `3px 3px 0 ${INK}` }}>
      <p className="px-3 py-1.5 text-[11px] uppercase tracking-widest" style={{ ...OSW, background: INK, color: GOLD }}>{t('Ordem do draft · a tabela manda', 'Draft order · the table decides')}</p>
      {ordem.map((id, i) => {
        const pick = picks.find(p => p.mgrId === id)
        // na hora do anúncio a carta ainda está coberta: o nome do escolhido só aparece depois que ela vira
        const escondido = i === idx && fase === 'revela'
        const vez = i === idx && fase === 'escolha'
        return (
          <div key={id} className="flex items-center gap-2 px-3 py-1.5 border-t border-black/10" style={{ background: vez ? '#FFF1B8' : undefined }}>
            <span className="w-7 shrink-0" style={{ ...OSW, fontSize: 15 }}>{i + 1}º</span>
            <span className="flex-1 min-w-0 truncate text-[13px]" style={OSW}>{nome(id)}{id === youId ? t(' (você)', ' (you)') : ''}{i === 0 ? ' 🏆' : ''}</span>
            <span className="shrink-0 text-[12.5px]" style={{ ...OSW, color: pick && !escondido ? GREEN : vez ? RED : 'rgba(0,0,0,.35)' }}>
              {pick && !escondido ? `✓ ${pick.carta.name}${pick.auto ? ' ⏱' : ''}` : vez ? t('⏱ NA VEZ', '⏱ ON THE CLOCK') : escondido ? '🥁' : '…'}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// 🥁 o verso da carta, que vai ganhando pista: 1 posição · 2 cor da categoria · 3 cores do clube
function Coberta({ etapa, pick }: { etapa: number; pick?: DraftPick }) {
  const c = pick?.carta
  const cat = c ? categoriaDa(c) : null
  const selo = c ? seloDoClube(c.club) : undefined
  const listra = etapa >= 3 && selo ? `repeating-linear-gradient(135deg,${selo.c1} 0 18px,${selo.c2} 18px 26px,${selo.c1} 26px 44px)` : 'repeating-linear-gradient(45deg,#1a1a1a 0 12px,#242424 12px 24px)'
  const brilho = etapa >= 2 && cat ? cat.brilho : null
  return (
    <div className="mx-auto rounded-2xl grid place-items-center transition-all duration-500"
      style={{ width: 180, height: 240, background: listra, border: `4px solid ${brilho ?? '#555'}`, boxShadow: brilho ? `0 0 34px ${brilho}, 0 0 80px ${brilho}66` : 'none' }}>
      <div className="grid place-items-center rounded-xl" style={{ width: 112, height: 150, background: INK, border: `3px solid ${GOLD}`, color: GOLD, ...OSW, fontSize: etapa >= 1 && c ? 48 : 60 }}>
        {etapa >= 1 && c ? c.pos : '?'}
      </div>
    </div>
  )
}

const POS_NOME: Record<Sector, [string, string]> = { GOL: ['GOLEIRO', 'GOALKEEPER'], LAT: ['LATERAL', 'FULL-BACK'], ZAG: ['ZAGUEIRO', 'CENTRE-BACK'], MEI: ['MEIA', 'MIDFIELDER'], ATA: ['ATACANTE', 'FORWARD'] }

function AnuncioDraft({ pick, n, quem, decorrido }: { pick: DraftPick; n: number; quem: string; decorrido: number }) {
  const t = useT()
  const c = pick.carta
  const etapa = Math.min(4, Math.max(0, Math.floor(decorrido / DRAFT_PISTA_MS)))
  const virou = decorrido >= DRAFT_VIRA_MS
  const cat = categoriaDa(c)
  const pais = paisDaCarta(c)
  const dec = decadaDe(c.year)
  const ultimaEtapa = useRef(-1)
  useEffect(() => { if (etapa !== ultimaEtapa.current) { ultimaEtapa.current = etapa; try { playTick() } catch { /* sem som */ } } }, [etapa])
  const titulo = virou ? `${t(`Com a ${n}ª escolha…`, `With pick #${n}…`)} ${c.name.toUpperCase()}!`
    : etapa === 0 ? t('🥁 Escolha feita!', '🥁 Pick is in!')
    : etapa === 1 ? `${t('É um…', 'It\'s a…')} ${t(POS_NOME[c.pos][0], POS_NOME[c.pos][1])}`
    : etapa === 2 ? `…${t('e é', 'and it\'s')} ${cat.emoji} ${t(cat.pt, cat.en)}!`
    : `${t('Brilhou', 'Shone')} ${pais !== '??' ? `${t('no', 'in')} ${flagOf(pais)} ${pais} ` : ''}${t(`nos ${dec.pt}`, `in ${dec.en}`)}`
  const pistas: string[] = [c.pos, `${cat.emoji} ${t(cat.pt, cat.en)}`, `${pais !== '??' ? flagOf(pais) + ' ' : ''}${t(dec.pt, dec.en)}`]
  return (
    <div className="rounded-3xl border-4 border-black p-3 space-y-3" style={{ background: 'radial-gradient(circle at 50% 40%,#2a2140,#0c0c0c 70%)', boxShadow: `4px 4px 0 ${INK}` }}>
      <div className="text-center">
        <p className="uppercase tracking-widest text-[11px]" style={{ ...OSW, color: GOLD }}>{t(`Noite do draft · ${n}ª escolha`, `Draft night · pick #${n}`)}</p>
        <p className="text-white uppercase" style={{ ...OSW, fontSize: 21 }}>{quem}</p>
      </div>
      <div style={{ minHeight: 330 }} className="flex flex-col items-center justify-center gap-3">
        {virou ? (
          <div className="relative" style={{ width: 230, animation: 'dr-vira .6s ease-out', filter: `drop-shadow(0 0 26px ${cat.brilho})` }}>
            <style>{'@keyframes dr-vira{0%{transform:rotateY(90deg) scale(.9);opacity:.3}100%{transform:rotateY(0) scale(1);opacity:1}}'}</style>
            <CollectibleCard name={c.name} club={c.club} year={c.year} pos={c.pos} fame={c.fame} bio={c.bio} folk={c.folk} promessa={c.promessa} big />
            <span className="absolute uppercase" style={{ ...OSW, right: -12, bottom: 34, transform: 'rotate(-10deg)', fontSize: 18, color: '#fff', background: ROXO, border: `3px solid ${INK}`, borderRadius: 10, padding: '1px 10px' }}>{t('Draftado!', 'Drafted!')}</span>
          </div>
        ) : <Coberta etapa={etapa} pick={pick} />}
        {!virou && (
          <div className="flex gap-1.5 flex-wrap justify-center">
            {pistas.map((p, i) => (
              <span key={i} className="rounded-lg px-2 py-0.5 text-[13px]" style={{ ...OSW, border: `2px solid ${i < etapa ? INK : '#555'}`, background: i < etapa ? GOLD : '#151515', color: i < etapa ? INK : '#777' }}>{i < etapa ? p : '?'}</span>
            ))}
          </div>
        )}
      </div>
      <p className="text-center text-white uppercase leading-tight" style={{ ...OSW, fontSize: 22 }}>{titulo}</p>
      <div className="flex gap-1">{[0, 1, 2, 3, 4].map(i => <span key={i} className="flex-1 rounded" style={{ height: 6, background: i <= etapa ? GOLD : '#333' }} />)}</div>
      {virou && (
        <p className="text-center text-white/75 text-[12px] font-bold">
          {pick.saiu ? t(`🔄 Saiu do time: ${pick.saiu.name}`, `🔄 Left the team: ${pick.saiu.name}`) : ''}{pick.auto ? t(' · ⏱ o tempo acabou e o jogo escolheu', ' · ⏱ time ran out and the game picked') : ''}
        </p>
      )}
    </div>
  )
}

function EscolhaDraft({ restante, n }: { restante: number; n: number }) {
  const { state, dispatch } = useEsc()
  const t = useT()
  const you = state.managers[state.youIdx]
  const [busca, setBusca] = useState('')
  const [pos, setPos] = useState<Sector | null>(null)
  const [carta, setCarta] = useState<Card | null>(null)
  const [sai, setSai] = useState<string | null>(null)
  const ocupados = useMemo(() => nomesOcupados(state.managers), [state.managers])
  const livres = useMemo(() => cartasLivres(ocupados), [ocupados])
  // quem já tem dono aparece apagado (só quando a busca bate num nome) — "já é do Fulano"
  const donoDe = useMemo(() => {
    const mp = new Map<string, string>()
    for (const m of state.managers) for (const c of m.squad) if (!c.fake) mp.set(chaveNome(c.name), m.teamName)
    return mp
  }, [state.managers])
  const q = norm(busca.trim())
  const lista = useMemo(() => {
    let l = livres.filter(c => (!pos || c.pos === pos) && (!q || norm(c.name).includes(q) || norm(c.club).includes(q)))
    l = [...l].sort((a, b) => forca(b) - forca(a))
    return l.slice(0, 60)
  }, [livres, pos, q])
  const tomados = useMemo(() => {
    if (q.length < 3) return []
    const vistos = new Set<string>()
    const out: { name: string; dono: string }[] = []
    for (const [k, dono] of donoDe) if (k.includes(q) && !vistos.has(k)) { vistos.add(k); out.push({ name: k, dono }) }
    return out.slice(0, 4)
  }, [donoDe, q])
  if (!you) return null
  const candidatos = carta ? podemSair(you.squad, carta.pos) : []
  const confirmar = () => {
    if (!carta || !sai) return
    dispatch({ type: 'DRAFT_ESCOLHER', mgrId: you.id, carta: chaveCarta(carta), sai, by: state.youUid })
  }
  return (
    <div className="space-y-2.5">
      <div className="rounded-2xl border-[3px] border-black px-3 py-2.5" style={{ background: GOLD, boxShadow: `3px 3px 0 ${INK}` }}>
        <p className="uppercase leading-none" style={{ ...OSW, fontSize: 20 }}>{t(`Sua vez · ${n}ª escolha`, `Your turn · pick #${n}`)}</p>
        <p className="text-[12px] font-bold mt-1" style={{ color: restante <= 10 ? RED : INK }}>⏱ <b style={{ ...OSW, fontSize: 17 }}>{restante}s</b> {t('pra escolher · acabou o tempo, o jogo pega o melhor livre pra você', 'to pick · if time runs out, the game takes the best free player for you')}</p>
      </div>
      {!carta ? (<>
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder={t('🔎 buscar jogador ou clube…', '🔎 search player or club…')}
          className="w-full border-[3px] border-black rounded-xl px-3 py-2 font-bold text-[14px] bg-white" />
        <div className="flex gap-1.5">
          {[null, ...POS].map(p => (
            <button key={p ?? 'todos'} onClick={() => setPos(p)} className="flex-1 border-2 border-black rounded-lg py-1.5 text-[13px]"
              style={{ ...OSW, background: pos === p ? GOLD : '#fff' }}>{p ?? t('Todos', 'All')}</button>
          ))}
        </div>
        <div className="rounded-2xl border-[3px] border-black overflow-hidden bg-white">
          {tomados.map(x => (
            <div key={x.name} className="flex items-center gap-2 px-3 py-1.5 border-b border-black/10" style={{ background: '#eee', opacity: .6 }}>
              <span className="flex-1 truncate text-[13px] uppercase" style={OSW}>{x.name}</span>
              <span className="text-[11px] font-black" style={{ color: RED }}>{t(`já é do ${x.dono}`, `already ${x.dono}'s`)}</span>
            </div>
          ))}
          {lista.map(c => {
            const cat = categoriaDa(c)
            return (
              <button key={chaveCarta(c)} onClick={() => { setCarta(c); setSai(null) }} className="w-full flex items-center gap-2 px-3 py-1.5 border-b border-black/10 text-left active:bg-yellow-100">
                <span className="shrink-0 text-[11px] border-2 border-black rounded-md px-1.5" style={{ ...OSW, background: '#F4ECD6' }}>{c.pos}</span>
                <span className="flex-1 min-w-0"><b className="block truncate uppercase text-[14px] leading-tight" style={OSW}>{c.name}</b><small className="text-[10.5px] font-bold text-black/55">{c.club} · {c.year}</small></span>
                <span className="shrink-0 text-[11px] border-2 border-black rounded-lg px-1.5" style={{ ...OSW, color: '#3d2a00', background: `${cat.brilho}55` }}>{cat.emoji} {t(cat.pt, cat.en)}</span>
              </button>
            )
          })}
          {lista.length === 0 && <p className="px-3 py-3 text-[12px] font-bold text-black/50">{t('Ninguém livre com esse nome.', 'Nobody free with that name.')}</p>}
        </div>
      </>) : (
        <div className="space-y-2.5">
          <div className="mx-auto" style={{ width: 200 }}>
            <CollectibleCard name={carta.name} club={carta.club} year={carta.year} pos={carta.pos} fame={carta.fame} bio={carta.bio} folk={carta.folk} promessa={carta.promessa} />
          </div>
          <div className="rounded-2xl border-[3px] border-black p-3 bg-white">
            <p className="uppercase" style={{ ...OSW, fontSize: 16 }}>🔄 {t('Quem sai pra ele entrar?', 'Who leaves to make room?')}</p>
            <p className="text-[12px] font-bold text-black/60 mb-2">{t(`O time tem vaga fixa: sai um dos seus ${POS_NOME[carta.pos][0].toLowerCase()}s e ele fica livre na liga.`, `The squad has fixed slots: one of your ${POS_NOME[carta.pos][1].toLowerCase()}s leaves and becomes free in the league.`)}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {candidatos.map(c => (
                <button key={c.id} onClick={() => setSai(c.id)} className="border-2 border-black rounded-lg px-2 py-1.5 text-left"
                  style={{ background: sai === c.id ? GOLD : '#F4ECD6', boxShadow: sai === c.id ? `2px 2px 0 ${INK}` : 'none' }}>
                  <b className="block truncate text-[13px]" style={OSW}>{c.name}</b>
                  <small className="text-[10px] font-bold text-black/55">{categoriaDa(c).emoji} {c.club} · {c.year}</small>
                </button>
              ))}
            </div>
          </div>
          <button onClick={confirmar} disabled={!sai} className="w-full border-[3px] border-black rounded-xl py-3 uppercase"
            style={{ ...OSW, fontSize: 18, background: sai ? GREEN : '#cfc6ae', color: sai ? '#fff' : 'rgba(0,0,0,.45)', boxShadow: sai ? `3px 3px 0 ${INK}` : 'none' }}>
            {sai ? t(`✅ Escolher ${carta.name}`, `✅ Pick ${carta.name}`) : t('👆 Escolha quem sai', '👆 Pick who leaves')}
          </button>
          <button onClick={() => { setCarta(null); setSai(null) }} className="w-full text-[12px] font-bold underline text-black/60">{t('← trocar de jogador', '← pick another player')}</button>
        </div>
      )}
    </div>
  )
}
