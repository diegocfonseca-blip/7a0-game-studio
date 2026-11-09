// 📋 A NOITE DO DRAFT — a tela (19/10, mockups aprovados: `scripts/mockups/draft.png` e `draft-anuncio.png`).
// Quem manda é o reducer do dono (DRAFT_* em store.tsx); aqui só se desenha, se roteia a escolha e — no aparelho do dono —
// se tica o relógio. As regras moram em `liga-draft.ts` e a tela lê as MESMAS funções (sem regra própria = sem botão mudo).
import { useEffect, useMemo, useRef, useState } from 'react'
import { useEsc } from './store'
import { Shell, CollectibleCard, Box, Btn, CardFace, HoldButton } from './screens'
import { useT } from './lang'
import { agoraSala } from './relogio'
import { playTick, playHammer } from './sound'
import { motion } from 'framer-motion'
import { flagOf } from './copa-mundo'
import { seloDoClube } from './selo-clube'
import type { Card, Sector, Manager } from './types'
import { EscalacaoMinha } from './minha-escalacao'
import { ListaFavoritos, EstrelaFav, useFavoritosDraft } from './draft-favoritos'
import {
  podemSair, chaveCarta, chaveNome, categoriaDa, decadaDe, paisDaCarta,
  DRAFT_PISTA_MS, DRAFT_VIRA_MS, type DraftPick, type DraftEstado,
  MLD_ELENCO_MAX, podePassarDraft, todasAsCartas, podemSairMinha, podeIrProLeilao, cartaPermitidaDraft, temRegraDraft, type RegrasDraft, podeSondarCarta, sondavelNoDraftDa, temporadasNoTime, MLD_SONDAR_TEMPORADAS,
} from './liga-draft'

const GOLD = '#FFC400', INK = '#0C0C0C', GREEN = '#1B7A3D', ROXO = '#7C3AED', RED = '#C2452F'
const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 700 } as const
const POS: Sector[] = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function EscLigaDraft() {
  const { state, dispatch } = useEsc()
  const t = useT()
  const d = state.draft
  const online = state.onlineMode === 'online'
  const euTico = !online || state.isHost
  const [agora, setAgora] = useState(agoraSala())
  const [sondarNaVez, setSondarNaVez] = useState<number | null>(null) // 🕵️ apertou "Sondar um amigo" nesta vez → abre direto na sondagem
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
  // 🔨 o leilão dos sondados tem a CARA do envelope de sempre (barra com o tempo, linhas com − / +, LACRAR TUDO)
  if (minha && d.fase === 'leilao') return <LeilaoMinha d={d} you={you} restante={restante} nome={nome} />
  // 🔨🎬 a revelação do envelope, lote por lote, com o suspense de sempre (05/11)
  if (minha && d.fase === 'revelaLeilao') return <RevelaLeilao d={d} you={you} nome={nome} />

  return (
    <Shell>
      <div className="space-y-3 pb-6">
        <div className="rounded-2xl border-[3px] border-black px-3 py-2.5 flex items-center gap-2.5" style={{ background: INK, boxShadow: `3px 3px 0 ${INK}` }}>
          <span style={{ fontSize: 26 }}>📋</span>
          <div className="min-w-0">
            <p className="text-white uppercase leading-none" style={{ ...OSW, fontSize: 17 }}>{t('Noite do draft', 'Draft night')} · {t('temporada', 'season')} {d.temporada + 1}</p>
            <p className="text-white/65 text-[11px] font-bold mt-1">{t('Cada técnico pega 1 jogador, de todos do jogo. O campeão escolhe primeiro.', 'Each manager picks 1 player from the whole game. The champion picks first.')}</p>
            {minha && temRegraDraft(state.draftRegras) && <p className="text-[11px] font-black mt-1" style={{ color: GOLD }}>📜 {t('Regras da turma', 'Crew rules')}: {textoRegrasDraft(state.draftRegras, t)}</p>}
          </div>
        </div>

        {minha && (d.fase === 'prontos' || d.fase === 'leilao' || d.fase === 'igualar' || d.fase === 'escala') ? (
          <EtapaMinha d={d} you={you} souDono={souDono} restante={restante} nome={nome} />
        ) : <>
        <OrdemDraft ordem={d.ordem} idx={d.idx} fase={d.fase} picks={d.picks} pulados={d.pulados ?? []} sondou={Object.fromEntries((d.sondagens ?? []).map(x => [x.por, nome(x.dono)]))} /* 🤫 05/11: mostra o TIME sondado, nunca o jogador */ nome={nome} youId={you.id} />

        {ultimo ? (
          <AnuncioDraft key={`${ultimo.mgrId}-${d.idx}`} pick={ultimo} n={d.idx + 1} quem={nome(ultimo.mgrId)} decorrido={agora - (d.inicioRevela ?? agora)} />
        ) : d.fase === 'aguarda' ? (
          <AguardaPronto n={d.idx + 1} quem={daVez?.teamName ?? '?'} minhaVez={vezId === you.id}
            onPronto={(sondar) => { setSondarNaVez(sondar ? d.idx : null); dispatch({ type: 'DRAFT_PRONTO', mgrId: you.id, by: state.youUid }) }}
            duasEscolhas={minha}
            onPassar={minha && vezId === you.id && podePassarDraft(you) ? () => dispatch({ type: 'DRAFT_PASSAR', mgrId: you.id, by: state.youUid }) : undefined}
            onPular={souDono && vezId !== you.id ? () => dispatch({ type: 'DRAFT_PULAR', by: state.youUid }) : undefined} />
        ) : minhaVez ? (
          <EscolhaDraft key={`vez-${d.idx}`} restante={restante} n={d.idx + 1} minha={minha} comecaSondando={minha && sondarNaVez === d.idx} />
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
function AguardaPronto({ n, quem, minhaVez, onPronto, onPular, onPassar, duasEscolhas }: { n: number; quem: string; minhaVez: boolean; onPronto: (sondar: boolean) => void; onPular?: () => void; onPassar?: () => void; duasEscolhas?: boolean }) {
  const t = useT()
  return (
    <div className="space-y-2.5">
      <div className="rounded-2xl border-[3px] border-black px-3 py-2.5 text-center" style={{ background: ROXO, boxShadow: `3px 3px 0 ${INK}` }}>
        <p className="text-white/85 text-[12px] uppercase tracking-wider" style={OSW}>{t(`${n}ª escolha do draft`, `Draft pick #${n}`)}</p>
        <p className="text-white uppercase leading-tight" style={{ ...OSW, fontSize: 24 }}>{minhaVez ? t('É a sua vez!', 'It\'s your turn!') : t(`Vez do ${quem}`, `${quem}'s turn`)}</p>
      </div>
      <Coberta etapa={0} />
      {minhaVez && duasEscolhas ? (<>
        {/* 📋🕵️ as DUAS jogadas da vez, lado a lado (Diego 01/11: "não teria que ter o botão junto, draft e sondar do amigo?") */}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => onPronto(false)} className="border-[3px] border-black rounded-xl px-2 py-3 text-center"
            style={{ background: GREEN, color: '#fff', boxShadow: `3px 3px 0 ${INK}` }}>
            <span className="block uppercase" style={{ ...OSW, fontSize: 18 }}>📋 {t('Pegar do draft', 'Draft a player')}</span>
            <span className="block text-[10.5px] font-bold text-white/85 mt-0.5">{t('1 jogador livre de todo o jogo', '1 free player from the whole game')}</span>
          </button>
          <button onClick={() => onPronto(true)} className="border-[3px] border-black rounded-xl px-2 py-3 text-center"
            style={{ background: '#F4ECD6', color: INK, boxShadow: `3px 3px 0 ${INK}` }}>
            <span className="block uppercase" style={{ ...OSW, fontSize: 18 }}>🕵️ {t('Sondar um amigo', 'Scout a friend')}</span>
            <span className="block text-[10.5px] font-bold text-black/60 mt-0.5">{t('o jogador dele vai pro leilão', 'his player goes to auction')}</span>
            <span className="block text-[10px] font-black mt-1" style={{ color: '#1B7A3D' }}>{t('⚡ empatou? o desempate é seu', '⚡ tied? the tiebreak is yours')}</span>
          </button>
        </div>
        <p className="text-center text-[11.5px] font-bold text-black/60">{t('Escolha UMA. Ao apertar, você tem 45 s. Acabou o tempo, perde a vez.', 'Pick ONE. Once you tap, you have 45 s. If time runs out, you lose the turn.')}</p>
      </>) : minhaVez ? (<>
        <button onClick={() => onPronto(false)} className="w-full border-[3px] border-black rounded-xl py-3 uppercase"
          style={{ ...OSW, fontSize: 19, background: GREEN, color: '#fff', boxShadow: `3px 3px 0 ${INK}` }}>{t('✋ Pronto, quero escolher', '✋ Ready, let me pick')}</button>
        <p className="text-center text-[11.5px] font-bold text-black/60">{t('Quando apertar, você tem 45 s pra escolher. Acabou o tempo, perde a vez.', 'Once you tap, you have 45 s to pick. If time runs out, you lose the turn.')}</p>
      </>) : (
        <p className="text-center text-[12.5px] font-bold text-black/65">{t(`⏳ Esperando o ${quem} dizer que está pronto…`, `⏳ Waiting for ${quem} to say they're ready…`)}</p>
      )}
      {minhaVez && onPassar && <BotaoPassar onPassar={onPassar} />}
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

// ⏭ 05/11 (Diego: *"quando bater 22 jogadores o usuário pode ter o direito de pular o draft… se ele for pro draft vai ter que pegar
// alguém e pode ser que ele não queira mais"*): só aparece com o elenco cheio; a régua é a mesma do motor (`podePassarDraft`)
function BotaoPassar({ onPassar }: { onPassar: () => void }) {
  const t = useT()
  return (<>
    <button onClick={onPassar} className="w-full border-[3px] border-black rounded-xl py-2.5 uppercase"
      style={{ ...OSW, fontSize: 16, background: '#fff', color: INK, boxShadow: `3px 3px 0 ${INK}` }}>{t('⏭ Passar a vez', '⏭ Pass my turn')}</button>
    <p className="text-center text-[11px] font-bold text-black/55">{t(`Seu elenco está cheio (${MLD_ELENCO_MAX}). Não quer ninguém? Passe a vez: ninguém sai do seu time.`, `Your squad is full (${MLD_ELENCO_MAX}). Don't want anyone? Pass: nobody leaves your team.`)}</p>
  </>)
}

function EscolhaDraft({ restante, n, minha, comecaSondando }: { restante: number; n: number; minha?: boolean; comecaSondando?: boolean }) {
  const { state, dispatch } = useEsc()
  const t = useT()
  const you = state.managers[state.youIdx]
  const [busca, setBusca] = useState('')
  const [pos, setPos] = useState<Sector | null>(null)
  const [carta, setCarta] = useState<Card | null>(null)
  const [sai, setSai] = useState<string | null>(null)
  // 🔤 05/11 (Diego): a lista é o jogo inteiro em ORDEM ALFABÉTICA, só nome + clube + ano — sem mostrar quem é lenda (a categoria e
  // o over só aparecem depois, no elenco de quem pegou). Quem já tem dono aparece marcado com o time (👤 técnico · 🤖 bot) e não dá pra pegar.
  const donoDe = useMemo(() => {
    const mp = new Map<string, { time: string; bot: boolean }>()
    for (const m of state.managers) for (const c of m.squad) if (!c.fake) mp.set(chaveNome(c.name), { time: m.teamName, bot: !m.isHuman })
    return mp
  }, [state.managers])
  const baralho = useMemo(() => todasAsCartas(state.minhaLigaDraft ? state.deckLeague : undefined), [state.minhaLigaDraft, state.deckLeague])
  const q = norm(busca.trim())
  const filtradas = useMemo(() => {
    // 📜 05/11: a regra da turma esconde quem não pode (a MESMA função que o motor confere em DRAFT_ESCOLHER)
    const l = baralho.filter(c => (!pos || c.pos === pos) && (!q || norm(c.name).includes(q) || norm(c.club).includes(q)) && (!state.minhaLigaDraft || cartaPermitidaDraft(c, state.draftRegras)))
    return [...l].sort((a, b) => a.name.localeCompare(b.name, 'pt', { sensitivity: 'base' }) || a.year - b.year)
  }, [baralho, pos, q, state.minhaLigaDraft, state.draftRegras])
  const LIMITE_LISTA = 250
  const lista = filtradas.slice(0, LIMITE_LISTA)
  const [sondando, setSondando] = useState(!!comecaSondando)
  const favs = useFavoritosDraft() // ⭐ 08/11: os favoritos marcados na temporada aparecem em cima (só conveniência do aparelho)
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
        {favs.length > 0 && (
          <div>
            <p className="uppercase text-[13px] mb-1" style={OSW}>⭐ {t('Seus favoritos', 'Your favourites')}</p>
            <ListaFavoritos deck={state.minhaLigaDraft ? state.deckLeague : undefined} donoDe={donoDe} favs={favs}
              onPegar={c => { if (!state.minhaLigaDraft || cartaPermitidaDraft(c, state.draftRegras)) { setCarta(c); setSai(null) } }} />
          </div>
        )}
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder={t('🔎 buscar jogador ou clube…', '🔎 search player or club…')}
          className="w-full border-[3px] border-black rounded-xl px-3 py-2 font-bold text-[14px] bg-white" />
        <div className="flex gap-1.5">
          {[null, ...POS].map(p => (
            <button key={p ?? 'todos'} onClick={() => setPos(p)} className="flex-1 border-2 border-black rounded-lg py-1.5 text-[13px]"
              style={{ ...OSW, background: pos === p ? GOLD : '#fff' }}>{p ?? t('Todos', 'All')}</button>
          ))}
        </div>
        <div className="rounded-2xl border-[3px] border-black overflow-hidden bg-white">
          {lista.map(c => {
            const dono = donoDe.get(chaveNome(c.name))
            if (dono) return (
              <div key={chaveCarta(c)} className="w-full flex items-center gap-2 px-3 py-1.5 border-b border-black/10" style={{ background: '#EFEBE0', opacity: .62 }}>
                <span className="shrink-0 text-[11px] border-2 border-black rounded-md px-1.5" style={{ ...OSW, background: '#fff' }}>{c.pos}</span>
                <span className="flex-1 min-w-0"><b className="block truncate uppercase text-[14px] leading-tight" style={OSW}>{c.name}</b><small className="text-[10.5px] font-bold text-black/55">{c.club} · {c.year}</small></span>
                <span className="shrink-0 max-w-[45%] truncate text-[10.5px] font-black border-2 border-black rounded-lg px-1.5" style={{ ...OSW, background: dono.bot ? '#E6E1D3' : '#FFE6A8' }}>{dono.bot ? '🤖' : '👤'} {dono.time}</span>
              </div>
            )
            return (
              <button key={chaveCarta(c)} onClick={() => { setCarta(c); setSai(null) }} className="w-full flex items-center gap-2 px-3 py-1.5 border-b border-black/10 text-left active:bg-yellow-100">
                <span className="shrink-0 text-[11px] border-2 border-black rounded-md px-1.5" style={{ ...OSW, background: '#F4ECD6' }}>{c.pos}</span>
                <span className="flex-1 min-w-0"><b className="block truncate uppercase text-[14px] leading-tight" style={OSW}>{c.name}</b><small className="text-[10.5px] font-bold text-black/55">{c.club} · {c.year}</small></span>
                <span className="shrink-0 text-[10.5px] font-black text-black/40" style={OSW}>{t('livre', 'free')}</span>
                <EstrelaFav chave={chaveCarta(c)} favs={favs} dentroDeBotao />
              </button>
            )
          })}
          {filtradas.length > LIMITE_LISTA && <p className="px-3 py-2 text-[11px] font-bold text-black/50">{t(`Mostrando ${LIMITE_LISTA} de ${filtradas.length}. Use a busca ou a posição pra achar o resto.`, `Showing ${LIMITE_LISTA} of ${filtradas.length}. Use search or position to find the rest.`)}</p>}
          {lista.length === 0 && <p className="px-3 py-3 text-[12px] font-bold text-black/50">{t('Ninguém livre com esse nome.', 'Nobody free with that name.')}</p>}
        </div>
        {minha && podePassarDraft(you) && <BotaoPassar onPassar={() => dispatch({ type: 'DRAFT_PASSAR', mgrId: you.id, by: state.youUid })} />}
        {minha && (
          <button onClick={() => setSondando(true)} className="w-full border-[3px] border-black rounded-xl py-2.5 uppercase"
            style={{ ...OSW, fontSize: 16, background: '#F4ECD6', boxShadow: `3px 3px 0 ${INK}` }}>{t('🕵️ Prefiro sondar um amigo', '🕵️ I\'d rather scout a friend')}</button>
        )}
      </>) : (
        <div className="space-y-2.5">
          {/* 🤫 sem categoria e sem over antes de pegar: só posição, nome, clube e ano (a carta de verdade vira no anúncio) */}
          <div className="mx-auto rounded-2xl border-[3px] border-black bg-white px-4 py-3 text-center" style={{ width: 220, boxShadow: `3px 3px 0 ${INK}` }}>
            <span className="inline-block text-[12px] border-2 border-black rounded-md px-2" style={{ ...OSW, background: '#F4ECD6' }}>{POS_NOME[carta.pos][0]}</span>
            <p className="uppercase leading-tight mt-1.5" style={{ ...OSW, fontSize: 22 }}>{carta.name}</p>
            <p className="text-[12px] font-bold text-black/60">{carta.club} · {carta.year}</p>
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
      <p className="text-[10.5px] font-bold text-black/50">{t('Vendeu: o dinheiro vem pra você. Ninguém quis: ele vai de graça pra um bot (você não recebe nada).', 'Sold: the money comes to you. Nobody wanted him: he goes to a bot for free (you get nothing).')}</p>
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
  // 🔒 todo mundo aparece, mas quem tem menos de 3 temporadas no time do amigo vem com CADEADO (o "contrato" da Liga Draft)
  const cartas = (mDono?.squad ?? []).filter(c => podeIrProLeilao(mDono, c.id) && !jaSondados.has(c.id))
    .sort((a, b) => Number(podeSondarCarta(b, d.temporada)) - Number(podeSondarCarta(a, d.temporada)) || b.fame - a.fame || (b.hi ?? 0) - (a.hi ?? 0))
  const c = cartas.find(x => x.id === cardId && podeSondarCarta(x, d.temporada))
  return (
    <div className="space-y-2.5">
      <div className="rounded-2xl border-[3px] border-black px-3 py-2.5" style={{ background: '#F4ECD6', boxShadow: `3px 3px 0 ${INK}` }}>
        <p className="uppercase leading-none" style={{ ...OSW, fontSize: 20 }}>🕵️ {t('Sondar um amigo', 'Scout a friend')}</p>
        <p className="text-[12px] font-bold mt-1" style={{ color: restante <= 10 ? RED : INK }}>⏱ <b style={{ ...OSW, fontSize: 17 }}>{restante}s</b> · {t('você perde a vez no draft e o jogador vai pro leilão', 'you lose your draft turn and the player goes to auction')}</p>
      </div>
      <p className="text-[11px] font-bold text-black/60">{t(`🔒 Só dá pra sondar quem já está há ${MLD_SONDAR_TEMPORADAS} temporadas no time do amigo (é o "contrato"). Quem chegou depois aparece com cadeado.`, `🔒 You can only scout players who have been on your friend's team for ${MLD_SONDAR_TEMPORADAS} seasons (the "contract"). Newer arrivals show a padlock.`)}</p>
      <div className="flex gap-1.5 flex-wrap">
        {amigos.map(m => <button key={m.id} onClick={() => { setDono(m.id); setCardId(null) }} className="border-2 border-black rounded-lg px-2 py-1 text-[13px]" style={{ ...OSW, background: dono === m.id ? GOLD : '#fff' }}>{m.teamName}</button>)}
      </div>
      <div className="rounded-2xl border-[3px] border-black overflow-hidden bg-white max-h-80 overflow-y-auto">
        {cartas.map(x => {
          const cat = categoriaDa(x)
          const livre = podeSondarCarta(x, d.temporada)
          const faltam = MLD_SONDAR_TEMPORADAS - temporadasNoTime(x, d.temporada)
          return (
            <button key={x.id} disabled={!livre} onClick={() => setCardId(x.id)} className="w-full flex items-center gap-2 px-3 py-1.5 border-b border-black/10 text-left"
              style={{ background: cardId === x.id ? '#FFF1B8' : !livre ? '#EFEAD9' : undefined, opacity: livre ? 1 : 0.7 }}>
              <span className="shrink-0 text-[11px] border-2 border-black rounded-md px-1.5" style={{ ...OSW, background: '#F4ECD6' }}>{x.pos}</span>
              <span className="flex-1 min-w-0"><b className="block truncate uppercase text-[14px] leading-tight" style={OSW}>{livre ? '' : '🔒 '}{x.name}</b>
                <small className="text-[10.5px] font-bold text-black/55">{x.club} · {x.year}</small>
                {!livre && <small className="block text-[10.5px] font-black" style={{ color: RED }}>{t(`📝 Contrato: falta${faltam === 1 ? '' : 'm'} ${faltam} temporada${faltam === 1 ? '' : 's'} · libera no draft do fim da temporada ${sondavelNoDraftDa(x)}`, `📝 Contract: ${faltam} more season${faltam === 1 ? '' : 's'} · unlocks at the draft after season ${sondavelNoDraftDa(x)}`)}</small>}
              </span>
              <span className="shrink-0 text-[11px]" style={OSW}>{cat.emoji} {Math.max(1, Math.round(x.paid ?? 1))} 🪙</span>
            </button>
          )
        })}
        {cartas.length === 0 && <p className="px-3 py-3 text-[12px] font-bold text-black/50">{t('Nenhum jogador pra sondar aqui.', 'No player to scout here.')}</p>}
      </div>
      {c && mDono && <p className="text-center text-[12px] font-bold text-black/65">{t(`${c.name} vai pro leilão com lance mínimo de ${Math.max(1, Math.round(c.paid ?? 1))} 🪙 (o que o ${mDono.teamName} pagou). Você pode igualar o maior lance.`, `${c.name} goes to auction with a minimum bid of ${Math.max(1, Math.round(c.paid ?? 1))} 🪙 (what ${mDono.teamName} paid). You can match the top bid.`)}</p>}
      {/* ⚡ 06/11 (Diego: "alguma coisa sutil… se empatar, você ganha"): o `martelo` dá o empate a quem sondou (só o dono segura
          empatando) e, se outro técnico der mais, quem sondou ainda pode IGUALAR e levar. */}
      <p className="text-center text-[11px] font-black" style={{ color: '#1B7A3D' }}>{t('⚡ Vantagem de quem sonda: empate com outro técnico é seu — e se alguém der mais, você pode igualar e levar.', '⚡ Scout\'s edge: a tie with another manager is yours — and if someone bids more, you can match it and take him.')}</p>
      <BotaoGrande disabled={!c || !mDono} onClick={() => { if (c && mDono) dispatch({ type: 'DRAFT_SONDAR', mgrId: you.id, dono: mDono.id, cardId: c.id, by: state.youUid }) }}>{t('🕵️ Confirmar a sondagem', '🕵️ Confirm scouting')}</BotaoGrande>
      <button onClick={onVoltar} className="w-full text-[12px] font-bold underline text-black/60">{t('← voltar pro draft', '← back to the draft')}</button>
    </div>
  )
}

// 🔨 leilão dos sondados + à venda (envelope de 60 s) — MESMA cara do envelope de sempre (Diego 01/11: *"leilão normal de
// sempre também, padrão"*): barra com o TEMPO, uma linha branca por jogador com − / valor / +, e o rodapé ✉️ ENVELOPE + LACRAR TUDO.
function LeilaoMinha({ d, you, restante, nome }: { d: DraftEstado; you: Manager; restante: number; nome: (id: number) => string }) {
  const { state, dispatch } = useEsc()
  const t = useT()
  const lotes = d.lotes ?? []
  const caixa = caixaDe(you)
  const enviado = (i: number) => d.lances?.[i]?.[you.id] ?? 0
  const [bids, setBids] = useState<Record<number, number>>(() => Object.fromEntries(lotes.map((_, i) => [i, enviado(i)]).filter(([, v]) => v > 0)))
  const total = Object.values(bids).reduce((a, b) => a + b, 0)
  const lacrado = lotes.every((_, i) => (bids[i] ?? 0) === enviado(i)) && (d.lacrou ?? []).includes(you.id) // 🔒 09/11: vale lacrar sem lance
  const bump = (i: number, dir: 1 | -1) => {
    const l = lotes[i]
    setBids(prev => {
      const cur = prev[i] ?? 0
      if (dir < 0) { const v = cur - 1 < l.piso ? 0 : cur - 1; const n = { ...prev }; if (v === 0) delete n[i]; else n[i] = v; return n }
      const outros = Object.entries(prev).reduce((a, [k, v]) => (+k === i ? a : a + v), 0)
      const v = cur === 0 ? l.piso : cur + 1
      if (v + outros > caixa) return prev
      return { ...prev, [i]: v }
    })
  }
  const lacrar = () => {
    lotes.forEach((_, i) => { const v = bids[i] ?? 0; if (v !== enviado(i)) dispatch({ type: 'DRAFT_LANCE', mgrId: you.id, lote: i, valor: v, by: state.youUid }) })
    dispatch({ type: 'DRAFT_LACRAR', mgrId: you.id, by: state.youUid }) // 🔒 sem lance também vale; todo mundo lacrou = martelo na hora
  }
  const barra = (
    <div className="flex items-center justify-between gap-2 px-3 py-2" style={{ background: '#F4ECD6', borderBottom: `3px solid ${INK}` }}>
      <p className="uppercase" style={{ ...OSW, fontSize: 15 }}>🔨 {t('Leilão dos sondados', 'Scouted auction')}</p>
      <div className="text-center border-[3px] border-black rounded-xl px-2 py-0.5" style={{ background: restante <= 15 ? RED : GREEN, color: '#fff', boxShadow: `2px 2px 0 0 ${INK}` }}>
        <p className="text-[8px] font-black leading-none" style={OSW}>{t('TEMPO', 'TIME')}</p>
        <p className="font-black text-xl leading-none" style={OSW}>{restante}s</p>
      </div>
    </div>
  )
  return (
    <Shell bar={barra}>
      <div className="space-y-3" style={{ paddingBottom: 170 }}>
        <Box bg="#FFF3D6" className="p-3">
          <p className="font-black text-[15px] text-black" style={OSW}>✉️ {t('ENVELOPE · SONDADOS E À VENDA', 'ENVELOPE · SCOUTED & FOR SALE')}</p>
          <p className="text-[12px] font-bold text-black/70 leading-snug mt-0.5">{t('Ninguém vê o lance do outro. Lance mínimo = o que o dono pagou. O dono também pode dar lance (e paga se segurar). Quem sondou pode IGUALAR o maior lance. Empate: dono → quem sondou.', 'Nobody sees the others\' bids. Minimum bid = what the owner paid. The owner can bid too (and pays if he keeps him). The scout can MATCH the top bid. Tie: owner → scout.')}</p>
        </Box>
        {lotes.map((l, i) => {
          const bid = bids[i] ?? 0
          return (
            <Box key={i} className="p-3 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0"><CardFace c={l.carta} /></div>
                <div className="flex items-center gap-1.5">
                  <HoldButton onStep={() => bump(i, -1)} className="border-2 border-black rounded-lg w-8 h-8 font-black bg-white text-black">−</HoldButton>
                  <span className="w-12 h-8 grid place-items-center text-base font-black border-2 border-black rounded-lg bg-white" style={{ ...OSW, color: bid > 0 ? INK : 'rgba(0,0,0,.35)' }}>{bid}</span>
                  <HoldButton onStep={() => bump(i, 1)} disabled={total >= caixa} className={`border-2 border-black rounded-lg w-8 h-8 font-black text-black ${total >= caixa ? 'opacity-40' : ''}`} style={{ backgroundColor: GOLD }}>+</HoldButton>
                </div>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <span className="text-[10.5px] rounded px-1.5 border-2 border-black" style={{ ...OSW, background: l.sondador != null ? RED : '#fff', color: l.sondador != null ? '#fff' : INK }}>{l.sondador != null ? `🕵️ ${t('sondado por', 'scouted by')} ${nome(l.sondador)}` : t('🏷️ à venda', '🏷️ for sale')}</span>
                <span className="text-[10.5px] rounded px-1.5 border-2 border-black" style={{ ...OSW, background: '#F4ECD6' }}>{t('dono', 'owner')}: {nome(l.dono)}</span>
                <span className="text-[10.5px] rounded px-1.5 border-2 border-black" style={{ ...OSW, background: GOLD }}>{t('mín.', 'min.')} {l.piso} 🪙</span>
              </div>
            </Box>
          )
        })}
      </div>
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 40, padding: '8px 12px 66px', background: 'linear-gradient(transparent, rgba(244,236,214,.96) 22%)' }}>
        <div className="max-w-xl mx-auto">
          <div className="border-[3px] border-black rounded-2xl p-2.5" style={{ background: INK, boxShadow: `3px 3px 0 0 ${INK}` }}>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[13px] font-black text-white" style={OSW}>✉️ {t('ENVELOPE', 'ENVELOPE')}: <span style={{ color: GOLD }}>{total} / {caixa}</span></p>
                <p className="text-[10.5px] font-bold" style={{ color: 'rgba(255,255,255,.7)' }}>{lacrado ? t('✅ Lacrado — quando todo mundo lacrar, o martelo bate na hora', '✅ Sealed — once everyone seals, the hammer falls right away') : t('Sem lance = você não disputa aquele jogador', 'No bid = you skip that player')}</p>
              </div>
              <Btn onClick={lacrar} bg={lacrado ? GREEN : RED}><span className="text-white whitespace-nowrap">{lacrado ? t('LACRADO ✅', 'SEALED ✅') : t('LACRAR TUDO 🔒', 'SEAL ALL 🔒')}</span></Btn>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  )
}

// 🔨🎬 REVELAÇÃO DO LEILÃO (05/11, Diego: *"tá faltando o suspense de sempre da carta… igual o motor que já tem nas salas
// rápidas… e aí tem aquele suspense de quem ganhou"*). A MESMA cara da revelação das salas: a carta grande, os envelopes abrindo
// um a um (maior em cima), o martelo batendo e a linha de quem levou ficando VERDE — nunca antes do martelo. Som de martelo só pra
// quem ganhou ou vendeu. Quem manda no tempo é o dono (`DRAFT_TICK`), então a sala inteira vê a mesma carta.
function RevelaLeilao({ d, you, nome }: { d: DraftEstado; you: Manager; nome: (id: number) => string }) {
  const t = useT()
  const i = d.revelaIdx ?? 0
  const l = d.lotes?.[i]
  const lances = Object.entries(d.lances?.[i] ?? {}).map(([k, v]) => ({ mgr: Number(k), valor: v })).filter(b => b.valor > 0).sort((a, b) => b.valor - a.valor)
  const hammerDelay = lances.length * 0.25 + 1.4
  const [martelou, setMartelou] = useState(false)
  useEffect(() => {
    setMartelou(false)
    if (!l) return
    const tm = setTimeout(() => {
      setMartelou(true)
      const vendeu = l.vencedor != null && l.vencedor !== l.dono && lances.length > 0
      if (vendeu && (l.vencedor === you.id || l.dono === you.id)) playHammer()
    }, hammerDelay * 1000)
    return () => clearTimeout(tm)
  }, [i]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!l) return <Shell><div className="pt-10 text-center text-5xl">🔨</div></Shell>
  const ficou = l.vencedor == null || l.vencedor === l.dono
  const barra = (
    <div className="flex items-center justify-between gap-2 px-3 py-2" style={{ background: '#F4ECD6', borderBottom: `3px solid ${INK}` }}>
      <p className="uppercase" style={{ ...OSW, fontSize: 15 }}>🔨 {t('Abrindo os envelopes', 'Opening the envelopes')}</p>
      <p className="font-black text-sm" style={OSW}>{i + 1}/{d.lotes?.length ?? 0}</p>
    </div>
  )
  return (
    <Shell bar={barra}>
      <div className="space-y-3 pb-6">
        <motion.div key={i} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <motion.div animate={martelou && !ficou ? { x: [0, -11, 11, -8, 8, -4, 4, 0] } : undefined} transition={{ duration: 0.5 }}>
            <Box bg={l.carta.fame >= 5 ? GOLD : '#fff'} className="p-5 relative" shadow={6}>
              {l.carta.fame >= 5 && <span className="absolute top-2 right-2 z-10 text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-black bg-white" style={OSW}>👑 LENDA</span>}
              <CardFace c={l.carta} big />
              <p className="text-[11.5px] font-bold text-black/60 mt-2">{t('dono', 'owner')}: {nome(l.dono)}{l.sondador != null ? ` · 🕵️ ${t('sondado por', 'scouted by')} ${nome(l.sondador)}` : ''}</p>
              <div className="mt-3 space-y-1.5">
                {lances.length === 0 && <p className="font-bold text-black/70">{l.sondador != null ? t('Nenhum lance. Fica com o dono. ↩️', 'No bids. Stays with the owner. ↩️') : t('Ninguém quis. Vai de graça pra um bot. 🤖', 'Nobody wanted him. He goes to a bot for free. 🤖')}</p>}
                {lances.map((b, k) => {
                  const venceu = martelou && l.vencedor === b.mgr
                  return (
                    <motion.div key={b.mgr} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: k * 0.25 }}
                      className="flex items-center justify-between border-2 border-black rounded-lg px-3 py-1.5" style={{ backgroundColor: venceu ? GREEN : '#fff' }}>
                      <p className="font-bold text-sm" style={{ color: venceu ? '#fff' : INK }}>{b.mgr === you.id ? t('🫵 Você', '🫵 You') : nome(b.mgr)}{b.mgr === l.dono ? t(' (dono)', ' (owner)') : ''}</p>
                      <p className="font-black" style={{ ...OSW, color: venceu ? '#fff' : INK }}>{b.valor}</p>
                    </motion.div>
                  )
                })}
              </div>
              {martelou && lances.length > 0 && (
                <motion.p initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-3 text-center font-black uppercase" style={{ ...OSW, fontSize: 18, color: ficou ? INK : GREEN }}>
                  {ficou ? t(`🛡️ ${nome(l.dono)} segurou por ${l.valor ?? 0}!`, `🛡️ ${nome(l.dono)} kept him for ${l.valor ?? 0}!`) : t(`🔨 VENDIDO pro ${nome(l.vencedor ?? -1)} por ${l.valor ?? 0}!`, `🔨 SOLD to ${nome(l.vencedor ?? -1)} for ${l.valor ?? 0}!`)}
                </motion.p>
              )}
              {martelou && l.igualar && <p className="mt-1 text-center text-[12px] font-black" style={{ color: ROXO }}>{t(`⚡ ${nome(l.sondador ?? -1)} sondou e ainda pode igualar`, `⚡ ${nome(l.sondador ?? -1)} scouted him and can still match`)}</p>}
            </Box>
          </motion.div>
        </motion.div>
      </div>
    </Shell>
  )
}

/** 📜 as regras da turma em uma linha (05/11) */
export function textoRegrasDraft(r: RegrasDraft | undefined, t: (pt: string, en: string) => string): string {
  if (!r) return ''
  return [r.semCraques ? t('nada de Craque nem Lenda', 'no Stars or Legends') : r.semLendas ? t('sem Lendas', 'no Legends') : '', r.soBrasil ? t('só clubes brasileiros', 'Brazilian clubs only') : ''].filter(Boolean).join(' · ')
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
  const resultados = (d.lotes ?? []).filter(l => l.vencedor != null)
  return (
    <div className="space-y-3">
      {resultados.length > 0 && (
        <Caixa titulo={t('🔨 Como ficou o leilão', '🔨 Auction results')}>
          {resultados.map((l, i) => <Linha key={i} a={l.carta.name} b={l.vencedor === l.dono ? (l.valor ? t(`🛡️ ficou (${l.valor})`, `🛡️ kept (${l.valor})`) : l.sondador == null ? t('🤖 foi pra um bot', '🤖 went to a bot') : t('↩️ ficou com o dono', '↩️ stays')) : `${state.managers.find(m => m.id === l.vencedor)?.teamName ?? '?'} · ${l.valor} 🪙${l.igualou ? ' ⚡' : ''}`} />)}
        </Caixa>
      )}
      <div className="rounded-2xl border-[3px] border-black px-3 py-2.5" style={{ background: GOLD, boxShadow: `3px 3px 0 ${INK}` }}>
        <p className="uppercase leading-none" style={{ ...OSW, fontSize: 20 }}>👕 {t('Escalação', 'Line-up')} · {you.squad.length}/{MLD_ELENCO_MAX}</p>
        <p className="text-[12px] font-bold mt-1" style={{ color: restante <= 10 ? RED : INK }}>⏱ <b style={{ ...OSW, fontSize: 17 }}>{restante}s</b> · {t('igual ao Elenco da carreira: toque num jogador e depois em outro da mesma posição pra trocar; a formação fica na pílula', 'same as the career Squad tab: tap a player and then another of the same position to swap; formation is in the pill')}</p>
      </div>
      <EscalacaoMinha />
      <ListaProntos d={d} you={you} souDono={souDono} rotulo={t('⚽ Começar a temporada', '⚽ Start the season')} onSeguir={() => dispatch({ type: 'DRAFT_SEGUIR', by: state.youUid })} />
    </div>
  )
}
