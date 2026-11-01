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
import type { Card, Sector, WonCard, Manager } from './types'
import { FORMATIONS } from './types'
import {
  cartasLivres, nomesOcupados, podemSair, chaveCarta, chaveNome, categoriaDa, decadaDe, paisDaCarta,
  DRAFT_PISTA_MS, DRAFT_VIRA_MS, type DraftPick, type DraftEstado,
  MLD_ELENCO_MAX, podemSairMinha, podeIrProLeilao, xiPorOrdem,
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
  const minha = !!state.minhaLigaDraft // 📋🏆 Minha Liga Draft: ✋ pronto, 45 s, perde a vez
  const souDono = !online || state.isHost
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

        {minha && (d.fase === 'prontos' || d.fase === 'leilao' || d.fase === 'igualar' || d.fase === 'escala') ? (
          <EtapaMinha d={d} you={you} souDono={souDono} restante={restante} nome={nome} />
        ) : <>
        <OrdemDraft ordem={d.ordem} idx={d.idx} fase={d.fase} picks={d.picks} pulados={d.pulados ?? []} sondou={Object.fromEntries((d.sondagens ?? []).map(x => [x.por, x.nome]))} nome={nome} youId={you.id} />

        {ultimo ? (
          <AnuncioDraft key={`${ultimo.mgrId}-${d.idx}`} pick={ultimo} n={d.idx + 1} quem={nome(ultimo.mgrId)} decorrido={agora - (d.inicioRevela ?? agora)} />
        ) : d.fase === 'aguarda' ? (
          <AguardaPronto n={d.idx + 1} quem={daVez?.teamName ?? '?'} minhaVez={vezId === you.id}
            onPronto={() => dispatch({ type: 'DRAFT_PRONTO', mgrId: you.id, by: state.youUid })}
            onPular={souDono && vezId !== you.id ? () => dispatch({ type: 'DRAFT_PULAR', by: state.youUid }) : undefined} />
        ) : minhaVez ? (
          <EscolhaDraft restante={restante} n={d.idx + 1} minha={minha} />
        ) : (
          <div className="space-y-2.5">
            <div className="rounded-2xl border-[3px] border-black px-3 py-2.5 text-center" style={{ background: ROXO, boxShadow: `3px 3px 0 ${INK}` }}>
              <p className="text-white/85 text-[12px] uppercase tracking-wider" style={OSW}>{t(`Com a ${d.idx + 1}ª escolha do draft…`, `With pick #${d.idx + 1} of the draft…`)}</p>
              <p className="text-white uppercase leading-tight" style={{ ...OSW, fontSize: 24 }}>{daVez?.teamName ?? '?'} {t('está escolhendo', 'is picking')}</p>
            </div>
            <Coberta etapa={0} />
            <p className="text-center font-black text-[13px]" style={{ ...OSW, color: restante <= 10 ? RED : INK }}>⏱ {restante}s</p>
            {minha && souDono && (
              <button onClick={() => dispatch({ type: 'DRAFT_PULAR', by: state.youUid })} className="w-full border-[3px] border-black rounded-xl py-2 uppercase"
                style={{ ...OSW, fontSize: 15, background: RED, color: '#fff', boxShadow: `3px 3px 0 ${INK}` }}>{t('⏭ Pular a vez dele', '⏭ Skip their turn')}</button>
            )}
            {minha ? (
              <p className="text-center text-[11.5px] font-bold text-black/60">{t('Ninguém vê a escolha do outro até a carta virar. Se o tempo acabar, ele PERDE A VEZ.', 'Nobody sees the pick until the card flips. If time runs out, they LOSE THE TURN.')}</p>
            ) : <p className="text-center text-[11.5px] font-bold text-black/60">{t('Ninguém vê a escolha do outro até a carta virar. Se o tempo acabar, o jogo escolhe o melhor jogador livre por ele.', 'Nobody sees the pick until the card flips. If time runs out, the game takes the best free player for them.')}</p>}
          </div>
        )}
        {minha && <VenderMeu d={d} you={you} />}
        </>}
      </div>
    </Shell>
  )
}

// ✋ Minha Liga Draft: a vez começa PARADA. Quem está na vez aperta PRONTO (aí correm os 45 s); o dono pode pular quem não deu.
function AguardaPronto({ n, quem, minhaVez, onPronto, onPular }: { n: number; quem: string; minhaVez: boolean; onPronto: () => void; onPular?: () => void }) {
  const t = useT()
  return (
    <div className="space-y-2.5">
      <div className="rounded-2xl border-[3px] border-black px-3 py-2.5 text-center" style={{ background: ROXO, boxShadow: `3px 3px 0 ${INK}` }}>
        <p className="text-white/85 text-[12px] uppercase tracking-wider" style={OSW}>{t(`${n}ª escolha do draft`, `Draft pick #${n}`)}</p>
        <p className="text-white uppercase leading-tight" style={{ ...OSW, fontSize: 24 }}>{minhaVez ? t('É a sua vez!', 'It\'s your turn!') : t(`Vez do ${quem}`, `${quem}'s turn`)}</p>
      </div>
      <Coberta etapa={0} />
      {minhaVez ? (<>
        <button onClick={onPronto} className="w-full border-[3px] border-black rounded-xl py-3 uppercase"
          style={{ ...OSW, fontSize: 19, background: GREEN, color: '#fff', boxShadow: `3px 3px 0 ${INK}` }}>{t('✋ Pronto, quero escolher', '✋ Ready, let me pick')}</button>
        <p className="text-center text-[11.5px] font-bold text-black/60">{t('Quando apertar, você tem 45 s pra escolher. Acabou o tempo, perde a vez.', 'Once you tap, you have 45 s to pick. If time runs out, you lose the turn.')}</p>
      </>) : (
        <p className="text-center text-[12.5px] font-bold text-black/65">{t(`⏳ Esperando o ${quem} dizer que está pronto…`, `⏳ Waiting for ${quem} to say they're ready…`)}</p>
      )}
      {onPular && (<>
        <button onClick={onPular} className="w-full border-[3px] border-black rounded-xl py-2.5 uppercase"
          style={{ ...OSW, fontSize: 16, background: RED, color: '#fff', boxShadow: `3px 3px 0 ${INK}` }}>{t('⏭ Pular a vez dele', '⏭ Skip their turn')}</button>
        <p className="text-center text-[11px] font-bold text-black/55">{t('Só você (dono) vê. Quem é pulado fica sem jogador do draft nesta temporada.', 'Only you (owner) see this. Whoever is skipped gets no draft player this season.')}</p>
      </>)}
    </div>
  )
}

function OrdemDraft({ ordem, idx, fase, picks, pulados, sondou, nome, youId }: { ordem: number[]; idx: number; fase: DraftEstado['fase']; picks: DraftPick[]; pulados: number[]; sondou: Record<number, string>; nome: (id: number) => string; youId: number }) {
  const t = useT()
  return (
    <div className="rounded-2xl border-[3px] border-black overflow-hidden bg-white" style={{ boxShadow: `3px 3px 0 ${INK}` }}>
      <p className="px-3 py-1.5 text-[11px] uppercase tracking-widest" style={{ ...OSW, background: INK, color: GOLD }}>{t('Ordem do draft · a tabela manda', 'Draft order · the table decides')}</p>
      {ordem.map((id, i) => {
        const pick = picks.find(p => p.mgrId === id)
        // na hora do anúncio a carta ainda está coberta: o nome do escolhido só aparece depois que ela vira
        const escondido = i === idx && fase === 'revela'
        const vez = i === idx && fase !== 'revela'
        const pulou = pulados.includes(id) && !pick
        return (
          <div key={id} className="flex items-center gap-2 px-3 py-1.5 border-t border-black/10" style={{ background: vez ? '#FFF1B8' : undefined }}>
            <span className="w-7 shrink-0" style={{ ...OSW, fontSize: 15 }}>{i + 1}º</span>
            <span className="flex-1 min-w-0 truncate text-[13px]" style={OSW}>{nome(id)}{id === youId ? t(' (você)', ' (you)') : ''}{i === 0 ? ' 🏆' : ''}</span>
            <span className="shrink-0 text-[12.5px]" style={{ ...OSW, color: pick && !escondido ? GREEN : vez ? RED : 'rgba(0,0,0,.35)' }}>
              {pick && !escondido ? `✓ ${pick.carta.name}${pick.auto ? ' ⏱' : ''}` : sondou[id] ? `🕵️ ${t('sondou', 'scouted')} ${sondou[id]}` : pulou ? t('⏭ perdeu a vez', '⏭ lost the turn') : vez ? (fase === 'aguarda' ? t('✋ NA VEZ', '✋ UP NEXT') : t('⏱ NA VEZ', '⏱ ON THE CLOCK')) : escondido ? '🥁' : '…'}
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

function EscolhaDraft({ restante, n, minha }: { restante: number; n: number; minha?: boolean }) {
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
  const [sondando, setSondando] = useState(false)
  if (!you) return null
  // 📋🏆 Minha Liga Draft: com vaga (menos de 22) ninguém sai; cheio = sai quem ele escolher, sem furar posição
  const temVaga = !!minha && you.squad.length < MLD_ELENCO_MAX
  const candidatos = carta ? (minha ? podemSairMinha(you.squad, carta, you.formation) : podemSair(you.squad, carta.pos)) : []
  const confirmar = () => {
    if (!carta || (!sai && !temVaga)) return
    dispatch({ type: 'DRAFT_ESCOLHER', mgrId: you.id, carta: chaveCarta(carta), sai: sai ?? '', by: state.youUid })
  }
  if (sondando) return <SondarAmigo restante={restante} onVoltar={() => setSondando(false)} />
  return (
    <div className="space-y-2.5">
      <div className="rounded-2xl border-[3px] border-black px-3 py-2.5" style={{ background: GOLD, boxShadow: `3px 3px 0 ${INK}` }}>
        <p className="uppercase leading-none" style={{ ...OSW, fontSize: 20 }}>{t(`Sua vez · ${n}ª escolha`, `Your turn · pick #${n}`)}</p>
        <p className="text-[12px] font-bold mt-1" style={{ color: restante <= 10 ? RED : INK }}>⏱ <b style={{ ...OSW, fontSize: 17 }}>{restante}s</b> {minha ? t('pra escolher · acabou o tempo, você perde a vez', 'to pick · if time runs out, you lose the turn') : t('pra escolher · acabou o tempo, o jogo pega o melhor livre pra você', 'to pick · if time runs out, the game takes the best free player for you')}</p>
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
        {minha && (
          <button onClick={() => setSondando(true)} className="w-full border-[3px] border-black rounded-xl py-2.5 uppercase"
            style={{ ...OSW, fontSize: 16, background: '#F4ECD6', boxShadow: `3px 3px 0 ${INK}` }}>{t('🕵️ Prefiro sondar um amigo', '🕵️ I\'d rather scout a friend')}</button>
        )}
      </>) : (
        <div className="space-y-2.5">
          <div className="mx-auto" style={{ width: 200 }}>
            <CollectibleCard name={carta.name} club={carta.club} year={carta.year} pos={carta.pos} fame={carta.fame} bio={carta.bio} folk={carta.folk} promessa={carta.promessa} />
          </div>
          {temVaga ? (
            <p className="text-center text-[12px] font-bold text-black/60">{t(`Você tem vaga (${you.squad.length}/${MLD_ELENCO_MAX}): ele entra no banco e ninguém sai. Chega valendo 10 🪙.`, `You have room (${you.squad.length}/${MLD_ELENCO_MAX}): he joins the bench and nobody leaves. Worth 10 🪙.`)}</p>
          ) : (
          <div className="rounded-2xl border-[3px] border-black p-3 bg-white">
            <p className="uppercase" style={{ ...OSW, fontSize: 16 }}>🔄 {minha ? t(`Elenco cheio (${MLD_ELENCO_MAX}): quem sai?`, `Full squad (${MLD_ELENCO_MAX}): who leaves?`) : t('Quem sai pra ele entrar?', 'Who leaves to make room?')}</p>
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
          )}
          <button onClick={confirmar} disabled={!sai && !temVaga} className="w-full border-[3px] border-black rounded-xl py-3 uppercase"
            style={{ ...OSW, fontSize: 18, background: sai || temVaga ? GREEN : '#cfc6ae', color: sai || temVaga ? '#fff' : 'rgba(0,0,0,.45)', boxShadow: sai || temVaga ? `3px 3px 0 ${INK}` : 'none' }}>
            {sai || temVaga ? t(`✅ Escolher ${carta.name}`, `✅ Pick ${carta.name}`) : t('👆 Escolha quem sai', '👆 Pick who leaves')}
          </button>
          <button onClick={() => { setCarta(null); setSai(null) }} className="w-full text-[12px] font-bold underline text-black/60">{t('← trocar de jogador', '← pick another player')}</button>
        </div>
      )}
    </div>
  )
}

// ═══ 📋🏆 MINHA LIGA DRAFT · fase 2 (01/11) ═══════════════════════════════════════════════════════════════════════════
const caixaDe = (m?: Manager) => Math.max(0, Math.floor(m?.money ?? 0))
function Linha({ a, b, fundo }: { a: React.ReactNode; b?: React.ReactNode; fundo?: string }) {
  return <div className="flex items-center gap-2 px-3 py-1.5 border-t border-black/10" style={{ background: fundo }}><span className="flex-1 min-w-0 truncate text-[13px]" style={OSW}>{a}</span>{b != null && <span className="shrink-0 text-[12.5px]" style={OSW}>{b}</span>}</div>
}
function Caixa({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border-[3px] border-black overflow-hidden bg-white" style={{ boxShadow: `3px 3px 0 ${INK}` }}>
      <p className="px-3 py-1.5 text-[11px] uppercase tracking-widest" style={{ ...OSW, background: INK, color: GOLD }}>{titulo}</p>
      {children}
    </div>
  )
}
function BotaoGrande({ onClick, cor = GOLD, tinta = INK, children, disabled }: { onClick: () => void; cor?: string; tinta?: string; children: React.ReactNode; disabled?: boolean }) {
  return <button onClick={onClick} disabled={disabled} className="w-full border-[3px] border-black rounded-xl py-3 uppercase"
    style={{ ...OSW, fontSize: 17, background: disabled ? '#cfc6ae' : cor, color: disabled ? 'rgba(0,0,0,.45)' : tinta, boxShadow: disabled ? 'none' : `3px 3px 0 ${INK}` }}>{children}</button>
}

// ✋ lista de prontos (o dono vê quem está pronto e decide quando segue)
function ListaProntos({ d, you, souDono, rotulo, onSeguir }: { d: DraftEstado; you: Manager; souDono: boolean; rotulo: string; onSeguir: () => void }) {
  const { state, dispatch } = useEsc()
  const t = useT()
  const humanos = state.managers.filter(m => m.isHuman)
  const prontos = new Set(d.prontos ?? [])
  return (
    <div className="space-y-2.5">
      <Caixa titulo={t(`✋ Prontos · ${prontos.size} de ${humanos.length}`, `✋ Ready · ${prontos.size} of ${humanos.length}`)}>
        {humanos.map(m => <Linha key={m.id} a={`${m.teamName}${m.id === you.id ? t(' (você)', ' (you)') : ''}`} b={prontos.has(m.id) ? <span style={{ color: GREEN }}>✅ {t('pronto', 'ready')}</span> : <span style={{ color: RED }}>⏳ {t('ainda não', 'not yet')}</span>} fundo={m.id === you.id ? '#FFF1B8' : undefined} />)}
      </Caixa>
      {!prontos.has(you.id) && <BotaoGrande cor={GREEN} tinta="#fff" onClick={() => dispatch({ type: 'DRAFT_ESTOU_PRONTO', mgrId: you.id, by: state.youUid })}>{t('✋ Estou pronto', '✋ I\'m ready')}</BotaoGrande>}
      {souDono ? (<>
        <BotaoGrande onClick={onSeguir}>{rotulo}</BotaoGrande>
        <p className="text-center text-[11px] font-bold text-black/55">{t('Só você (dono) vê. Pode seguir mesmo com gente faltando.', 'Only you (owner) see this. You can go on even with people missing.')}</p>
      </>) : <p className="text-center text-[12px] font-bold text-black/60">{t('⏳ O dono segue quando a galera estiver pronta.', '⏳ The owner moves on when the crew is ready.')}</p>}
    </div>
  )
}

function EtapaMinha({ d, you, souDono, restante, nome }: { d: DraftEstado; you: Manager; souDono: boolean; restante: number; nome: (id: number) => string }) {
  const { state, dispatch } = useEsc()
  const t = useT()
  const seguir = () => dispatch({ type: 'DRAFT_SEGUIR', by: state.youUid })
  if (d.fase === 'prontos' && d.proxima === 'draft') {
    const tab = Object.entries(d.premios ?? {}).sort((a, b) => b[1] - a[1])
    return (
      <div className="space-y-3">
        {tab.length > 0 && (
          <Caixa titulo={t('💰 Moedas pela colocação · já no caixa', '💰 Coins for your finish · already in the bank')}>
            {tab.map(([id, v]) => <Linha key={id} a={`${nome(+id)}${+id === you.id ? t(' (você)', ' (you)') : ''}`} b={`+${v} 🪙`} fundo={+id === you.id ? '#FFF1B8' : undefined} />)}
          </Caixa>
        )}
        <Caixa titulo={t('📋 Como é o draft', '📋 How the draft works')}>
          <p className="px-3 py-2 text-[12px] font-bold text-black/70 leading-snug">{t('Na ordem da tabela (o campeão primeiro), cada um aperta ✋ Pronto e tem 45 s pra pegar 1 jogador livre de todo o jogo — ou 🕵️ sondar o jogador de um amigo (aí perde a vez e o jogador vai pro leilão). Não deu pronto ou o tempo acabou: perde a vez.', 'In table order (champion first), each manager taps ✋ Ready and has 45 s to take 1 free player from the whole game — or 🕵️ scout a friend\'s player (losing the turn; the player goes to auction). Not ready or out of time: lose the turn.')}</p>
        </Caixa>
        <VenderMeu d={d} you={you} />
        <ListaProntos d={d} you={you} souDono={souDono} rotulo={t('▶ Começar o draft', '▶ Start the draft')} onSeguir={seguir} />
      </div>
    )
  }
  if (d.fase === 'prontos' && d.proxima === 'leilao') {
    return (
      <div className="space-y-3">
        <Caixa titulo={t(`🔨 Vão a leilão · ${d.lotes?.length ?? 0}`, `🔨 Up for auction · ${d.lotes?.length ?? 0}`)}>
          {(d.lotes ?? []).map((l, i) => <Linha key={i} a={`${l.carta.name} · ${nome(l.dono)}`} b={l.sondador != null ? `🕵️ ${nome(l.sondador)}` : t('🏷️ à venda', '🏷️ for sale')} />)}
        </Caixa>
        <p className="text-center text-[11.5px] font-bold text-black/60">{t('Envelope de 60 s: ninguém vê o lance do outro. Lance mínimo = o que o dono pagou. Quem sondou pode IGUALAR o maior lance (menos se o maior for do dono). Vendeu: o dinheiro vai pro dono. Ninguém deu lance: volta pro dono.', '60 s sealed envelope: nobody sees the others\' bids. Minimum bid = what the owner paid. Whoever scouted can MATCH the top bid (unless the top bid is the owner\'s). Sold: money goes to the owner. No bids: back to the owner.')}</p>
        <ListaProntos d={d} you={you} souDono={souDono} rotulo={t('▶ Começar o leilão', '▶ Start the auction')} onSeguir={seguir} />
      </div>
    )
  }
  if (d.fase === 'leilao') return <LeilaoMinha d={d} you={you} restante={restante} nome={nome} />
  if (d.fase === 'igualar') return <IgualarMinha d={d} you={you} restante={restante} nome={nome} />
  if (d.fase === 'escala') return <EscalaMinha d={d} you={you} souDono={souDono} restante={restante} />
  return null
}

// 🏷️ pôr 1 jogador seu à venda (vale até a fila do draft acabar)
function VenderMeu({ d, you }: { d: DraftEstado; you: Manager }) {
  const { state, dispatch } = useEsc()
  const t = useT()
  const [aberto, setAberto] = useState(false)
  if (d.proxima === 'leilao' || !['prontos', 'aguarda', 'escolha', 'revela'].includes(d.fase)) return null
  const atual = d.aVenda?.[you.id]
  const cAtual = atual ? you.squad.find(c => c.id === atual) : undefined
  const pode = you.squad.filter(c => podeIrProLeilao(you, c.id))
  return (
    <div className="rounded-2xl border-[3px] border-black p-3 bg-white space-y-2" style={{ boxShadow: `3px 3px 0 ${INK}` }}>
      <p className="uppercase" style={{ ...OSW, fontSize: 15 }}>🏷️ {t('Vender 1 jogador seu no leilão', 'Sell 1 of your players at the auction')}</p>
      {cAtual ? (
        <div className="flex items-center gap-2">
          <span className="flex-1 text-[13px]" style={OSW}>{cAtual.name} · {t('lance mínimo', 'min bid')} {Math.max(1, Math.round(cAtual.paid ?? 1))} 🪙</span>
          <button onClick={() => dispatch({ type: 'DRAFT_VENDER', mgrId: you.id, cardId: null, by: state.youUid })} className="border-2 border-black rounded-lg px-2 py-1 text-[12px]" style={OSW}>{t('tirar', 'remove')}</button>
        </div>
      ) : !aberto ? (
        <button onClick={() => setAberto(true)} className="w-full border-2 border-black rounded-lg py-1.5 text-[13px]" style={{ ...OSW, background: '#F4ECD6' }}>{t('Escolher jogador pra vender', 'Pick a player to sell')}</button>
      ) : (
        <div className="grid grid-cols-2 gap-1.5 max-h-64 overflow-y-auto">
          {pode.map(c => (
            <button key={c.id} onClick={() => { dispatch({ type: 'DRAFT_VENDER', mgrId: you.id, cardId: c.id, by: state.youUid }); setAberto(false) }} className="border-2 border-black rounded-lg px-2 py-1 text-left" style={{ background: '#F4ECD6' }}>
              <b className="block truncate text-[12.5px]" style={OSW}>{c.pos} · {c.name}</b>
              <small className="text-[10px] font-bold text-black/55">{Math.max(1, Math.round(c.paid ?? 1))} 🪙</small>
            </button>
          ))}
        </div>
      )}
      <p className="text-[10.5px] font-bold text-black/50">{t('Vendeu: o dinheiro vem pra você. Ninguém quis: ele fica.', 'Sold: the money comes to you. Nobody wanted him: he stays.')}</p>
    </div>
  )
}

// 🕵️ na sua vez: escolhe o amigo e o jogador dele
function SondarAmigo({ restante, onVoltar }: { restante: number; onVoltar: () => void }) {
  const { state, dispatch } = useEsc()
  const t = useT()
  const you = state.managers[state.youIdx]
  const d = state.draft
  const amigos = state.managers.filter(m => m.isHuman && m.id !== you?.id)
  const [dono, setDono] = useState<number | null>(amigos[0]?.id ?? null)
  const [cardId, setCardId] = useState<string | null>(null)
  if (!you || !d) return null
  const mDono = amigos.find(m => m.id === dono)
  const jaSondados = new Set((d.sondagens ?? []).map(x => x.cardId))
  const cartas = (mDono?.squad ?? []).filter(c => podeIrProLeilao(mDono, c.id) && !jaSondados.has(c.id)).sort((a, b) => b.fame - a.fame || (b.hi ?? 0) - (a.hi ?? 0))
  const c = cartas.find(x => x.id === cardId)
  return (
    <div className="space-y-2.5">
      <div className="rounded-2xl border-[3px] border-black px-3 py-2.5" style={{ background: '#F4ECD6', boxShadow: `3px 3px 0 ${INK}` }}>
        <p className="uppercase leading-none" style={{ ...OSW, fontSize: 20 }}>🕵️ {t('Sondar um amigo', 'Scout a friend')}</p>
        <p className="text-[12px] font-bold mt-1" style={{ color: restante <= 10 ? RED : INK }}>⏱ <b style={{ ...OSW, fontSize: 17 }}>{restante}s</b> · {t('você perde a vez no draft e o jogador vai pro leilão', 'you lose your draft turn and the player goes to auction')}</p>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {amigos.map(m => <button key={m.id} onClick={() => { setDono(m.id); setCardId(null) }} className="border-2 border-black rounded-lg px-2 py-1 text-[13px]" style={{ ...OSW, background: dono === m.id ? GOLD : '#fff' }}>{m.teamName}</button>)}
      </div>
      <div className="rounded-2xl border-[3px] border-black overflow-hidden bg-white max-h-80 overflow-y-auto">
        {cartas.map(x => {
          const cat = categoriaDa(x)
          return (
            <button key={x.id} onClick={() => setCardId(x.id)} className="w-full flex items-center gap-2 px-3 py-1.5 border-b border-black/10 text-left" style={{ background: cardId === x.id ? '#FFF1B8' : undefined }}>
              <span className="shrink-0 text-[11px] border-2 border-black rounded-md px-1.5" style={{ ...OSW, background: '#F4ECD6' }}>{x.pos}</span>
              <span className="flex-1 min-w-0"><b className="block truncate uppercase text-[14px] leading-tight" style={OSW}>{x.name}</b><small className="text-[10.5px] font-bold text-black/55">{x.club} · {x.year}</small></span>
              <span className="shrink-0 text-[11px]" style={OSW}>{cat.emoji} {Math.max(1, Math.round(x.paid ?? 1))} 🪙</span>
            </button>
          )
        })}
        {cartas.length === 0 && <p className="px-3 py-3 text-[12px] font-bold text-black/50">{t('Nenhum jogador pra sondar aqui.', 'No player to scout here.')}</p>}
      </div>
      {c && mDono && <p className="text-center text-[12px] font-bold text-black/65">{t(`${c.name} vai pro leilão com lance mínimo de ${Math.max(1, Math.round(c.paid ?? 1))} 🪙 (o que o ${mDono.teamName} pagou). Você pode igualar o maior lance.`, `${c.name} goes to auction with a minimum bid of ${Math.max(1, Math.round(c.paid ?? 1))} 🪙 (what ${mDono.teamName} paid). You can match the top bid.`)}</p>}
      <BotaoGrande disabled={!c || !mDono} onClick={() => { if (c && mDono) dispatch({ type: 'DRAFT_SONDAR', mgrId: you.id, dono: mDono.id, cardId: c.id, by: state.youUid }) }}>{t('🕵️ Confirmar a sondagem', '🕵️ Confirm scouting')}</BotaoGrande>
      <button onClick={onVoltar} className="w-full text-[12px] font-bold underline text-black/60">{t('← voltar pro draft', '← back to the draft')}</button>
    </div>
  )
}

// 🔨 leilão dos sondados + à venda (envelope de 60 s)
function LeilaoMinha({ d, you, restante, nome }: { d: DraftEstado; you: Manager; restante: number; nome: (id: number) => string }) {
  const { state, dispatch } = useEsc()
  const t = useT()
  const [rasc, setRasc] = useState<Record<number, number>>({})
  const caixa = caixaDe(you)
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border-[3px] border-black px-3 py-2.5" style={{ background: GOLD, boxShadow: `3px 3px 0 ${INK}` }}>
        <p className="uppercase leading-none" style={{ ...OSW, fontSize: 20 }}>🔨 {t('Leilão dos sondados', 'Scouted players auction')}</p>
        <p className="text-[12px] font-bold mt-1" style={{ color: restante <= 10 ? RED : INK }}>⏱ <b style={{ ...OSW, fontSize: 17 }}>{restante}s</b> · {t(`seu caixa: ${caixa} 🪙 · ninguém vê o seu lance`, `your bank: ${caixa} 🪙 · nobody sees your bid`)}</p>
      </div>
      {(d.lotes ?? []).map((l, i) => {
        const meu = d.lances?.[i]?.[you.id] ?? 0
        const v = rasc[i] ?? (meu || l.piso)
        const ok = v >= l.piso && v <= caixa
        return (
          <div key={i} className="rounded-2xl border-[3px] border-black p-3 space-y-2" style={{ background: 'linear-gradient(160deg,#1a1508,#0C0C0C)', boxShadow: `3px 3px 0 ${INK}` }}>
            <div className="flex gap-1.5 flex-wrap">
              <span className="text-[10.5px] rounded px-1.5" style={{ ...OSW, background: l.sondador != null ? RED : '#333', color: '#fff' }}>{l.sondador != null ? `🕵️ ${t('sondado por', 'scouted by')} ${nome(l.sondador)}` : t('🏷️ à venda', '🏷️ for sale')}</span>
              <span className="text-[10.5px] rounded px-1.5" style={{ ...OSW, background: '#333', color: GOLD }}>{t('dono', 'owner')}: {nome(l.dono)}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="shrink-0" style={{ width: 92 }}><CollectibleCard name={l.carta.name} club={l.carta.club} year={l.carta.year} pos={l.carta.pos} fame={l.carta.fame} bio={l.carta.bio} folk={l.carta.folk} promessa={l.carta.promessa} /></div>
              <div className="flex-1 min-w-0 text-white">
                <p className="uppercase leading-tight" style={{ ...OSW, fontSize: 20 }}>{l.carta.name}</p>
                <p className="text-[11.5px] font-bold text-white/70">{l.carta.club} · {l.carta.year}</p>
                <p className="text-[12px] font-bold mt-1" style={{ color: GOLD }}>{t('lance mínimo', 'min bid')}: {l.piso} 🪙</p>
                {meu > 0 && <p className="text-[12px] font-bold text-white/85">✉️ {t('seu lance', 'your bid')}: {meu} 🪙</p>}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {[-5, -1].map(x => <button key={x} onClick={() => setRasc(r => ({ ...r, [i]: Math.max(l.piso, v + x) }))} className="border-2 border-black rounded-lg px-2 py-1 bg-white text-[13px]" style={OSW}>{x}</button>)}
              <span className="flex-1 text-center text-white" style={{ ...OSW, fontSize: 20 }}>{v} 🪙</span>
              {[1, 5, 10].map(x => <button key={x} onClick={() => setRasc(r => ({ ...r, [i]: v + x }))} className="border-2 border-black rounded-lg px-2 py-1 text-[13px]" style={{ ...OSW, background: GOLD }}>+{x}</button>)}
            </div>
            <div className="flex gap-1.5">
              <button disabled={!ok} onClick={() => dispatch({ type: 'DRAFT_LANCE', mgrId: you.id, lote: i, valor: v, by: state.youUid })} className="flex-1 border-[3px] border-black rounded-xl py-2 uppercase"
                style={{ ...OSW, fontSize: 15, background: ok ? GREEN : '#555', color: '#fff' }}>{ok ? (meu ? t('✉️ Trocar o lance', '✉️ Change bid') : t('✉️ Dar lance', '✉️ Place bid')) : t('sem caixa', 'not enough coins')}</button>
              {meu > 0 && <button onClick={() => dispatch({ type: 'DRAFT_LANCE', mgrId: you.id, lote: i, valor: 0, by: state.youUid })} className="border-[3px] border-black rounded-xl px-3 bg-white text-[12px]" style={OSW}>{t('tirar', 'remove')}</button>}
            </div>
          </div>
        )
      })}
      <p className="text-center text-[11px] font-bold text-black/55">{t('O dono também pode dar lance (e paga se segurar). Empate: dono → quem sondou.', 'The owner can bid too (and pays if he keeps him). Tie: owner → scout.')}</p>
    </div>
  )
}

// ⚡ quem sondou decide se iguala o maior lance
function IgualarMinha({ d, you, restante, nome }: { d: DraftEstado; you: Manager; restante: number; nome: (id: number) => string }) {
  const { state, dispatch } = useEsc()
  const t = useT()
  const l = d.lotes?.[d.igualarIdx ?? -1]
  if (!l || l.sondador == null) return null
  const souEu = l.sondador === you.id
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border-[3px] border-black p-3 text-center text-white" style={{ background: ROXO, boxShadow: `3px 3px 0 ${INK}` }}>
        <p className="uppercase" style={{ ...OSW, fontSize: 13 }}>⚡ {t('Direito de igualar', 'Right to match')}</p>
        <p className="uppercase leading-tight" style={{ ...OSW, fontSize: 22 }}>{l.carta.name}</p>
        <p className="text-[12.5px] font-bold mt-1">{t(`Maior lance: ${nome(l.vencedor ?? -1)} · ${l.valor} 🪙`, `Top bid: ${nome(l.vencedor ?? -1)} · ${l.valor} 🪙`)}</p>
        <p className="text-[12px] font-bold mt-1" style={{ color: GOLD }}>⏱ {restante}s</p>
      </div>
      {souEu ? (<>
        <BotaoGrande cor={GREEN} tinta="#fff" onClick={() => dispatch({ type: 'DRAFT_IGUALAR', mgrId: you.id, sim: true, by: state.youUid })}>{t(`✅ Igualar ${l.valor} e levar`, `✅ Match ${l.valor} and take him`)}</BotaoGrande>
        <BotaoGrande cor="#fff" onClick={() => dispatch({ type: 'DRAFT_IGUALAR', mgrId: you.id, sim: false, by: state.youUid })}>{t('Deixar', 'Pass')}</BotaoGrande>
      </>) : <p className="text-center text-[12.5px] font-bold text-black/65">{t(`⏳ ${nome(l.sondador)} sondou e está decidindo se iguala…`, `⏳ ${nome(l.sondador)} scouted him and is deciding whether to match…`)}</p>}
    </div>
  )
}

// 👕 escalação: titulares (os primeiros de cada posição) ↔ reservas, tocando um e depois o outro da mesma posição
function EscalaMinha({ d, you, souDono, restante }: { d: DraftEstado; you: Manager; souDono: boolean; restante: number }) {
  const { state, dispatch } = useEsc()
  const t = useT()
  const [sel, setSel] = useState<string | null>(null)
  const xi = new Set(xiPorOrdem(you.squad, you.formation).map(c => c.id))
  const need = FORMATIONS[you.formation]
  const toca = (c: WonCard) => {
    if (!sel || sel === c.id) { setSel(sel === c.id ? null : c.id); return }
    const a = you.squad.find(x => x.id === sel)
    if (!a || a.pos !== c.pos) { setSel(c.id); return }
    dispatch({ type: 'MLD_TROCA', mgrId: you.id, a: a.id, b: c.id, by: state.youUid })
    setSel(null)
  }
  const resultados = (d.lotes ?? []).filter(l => l.vencedor != null)
  return (
    <div className="space-y-3">
      {resultados.length > 0 && (
        <Caixa titulo={t('🔨 Como ficou o leilão', '🔨 Auction results')}>
          {resultados.map((l, i) => <Linha key={i} a={l.carta.name} b={l.vencedor === l.dono ? (l.valor ? t(`🛡️ ficou (${l.valor})`, `🛡️ kept (${l.valor})`) : t('↩️ ficou com o dono', '↩️ stays')) : `${state.managers.find(m => m.id === l.vencedor)?.teamName ?? '?'} · ${l.valor} 🪙${l.igualou ? ' ⚡' : ''}`} />)}
        </Caixa>
      )}
      <div className="rounded-2xl border-[3px] border-black px-3 py-2.5" style={{ background: GOLD, boxShadow: `3px 3px 0 ${INK}` }}>
        <p className="uppercase leading-none" style={{ ...OSW, fontSize: 20 }}>👕 {t('Escalação', 'Line-up')} · {you.squad.length}/{MLD_ELENCO_MAX}</p>
        <p className="text-[12px] font-bold mt-1" style={{ color: restante <= 10 ? RED : INK }}>⏱ <b style={{ ...OSW, fontSize: 17 }}>{restante}s</b> · {t('toque num titular e depois num reserva da mesma posição pra trocar', 'tap a starter and then a sub of the same position to swap')}</p>
      </div>
      {(['GOL', 'LAT', 'ZAG', 'MEI', 'ATA'] as Sector[]).map(pos => {
        const doPos = you.squad.filter(c => c.pos === pos)
        return (
          <div key={pos} className="rounded-2xl border-[3px] border-black bg-white overflow-hidden">
            <p className="px-3 py-1 text-[11px] uppercase tracking-widest" style={{ ...OSW, background: INK, color: GOLD }}>{pos} · {t(`${need[pos]} titular(es)`, `${need[pos]} starter(s)`)}</p>
            <div className="grid grid-cols-2 gap-1.5 p-2">
              {doPos.map(c => (
                <button key={c.id} onClick={() => toca(c)} className="border-2 border-black rounded-lg px-2 py-1 text-left"
                  style={{ background: sel === c.id ? GOLD : xi.has(c.id) ? '#DCFCE7' : '#F4ECD6', boxShadow: sel === c.id ? `2px 2px 0 ${INK}` : 'none' }}>
                  <b className="block truncate text-[12.5px]" style={OSW}>{xi.has(c.id) ? '⭐ ' : ''}{c.name}</b>
                  <small className="text-[10px] font-bold text-black/55">{categoriaDa(c).emoji} {xi.has(c.id) ? t('titular', 'starter') : t('reserva', 'sub')}</small>
                </button>
              ))}
            </div>
          </div>
        )
      })}
      <ListaProntos d={d} you={you} souDono={souDono} rotulo={t('⚽ Começar a temporada', '⚽ Start the season')} onSeguir={() => dispatch({ type: 'DRAFT_SEGUIR', by: state.youUid })} />
    </div>
  )
}
