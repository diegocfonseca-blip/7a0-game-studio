import { type CSSProperties, type ReactNode, Component, useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { revealOffers, revealIdentityVisible } from './reveal-presentation'
import './online-visual.css'
import { SupportPlans, SupportFooter, SupportStory, SupportManualPreview, SupportCraqueBenefits, SupportPlanCard } from './support-plans'
import onlinePackArt from './img/online-pacote-v20.webp'
import type { Card, DuplaSeat, EscState, FormationKey, Manager, QuickCopaTie, Sector, Tactic, WonCard } from './types'
import { FORMATIONS, SECTORS, duplaPodeAgir } from './types'
import { lanceEhGol, useEsc, openSlots, totalHoles, xiHoles, sortedTable, topScorers, rivalryOf, MONTE_SECONDS, BATCH_SIZE, batchCount, DIVISION_LABEL, buildCareerSave, nextDivision, monteLocked, mesmoDono, deletePyramidCloud, removeCareerFromCloud, listAllCareers, activateCareerSlot, deleteCareerSlot, stashActiveBeforeNew, careerSlotLimit, syncCareersWithCloud, patchCareerCofre, fotoDaConexao} from './store'
import type { CareerSlot } from './store'
import { playCoin, playSeal, playTick, playHammer, playMp3, playWhistle, startCrowd, stopCrowd } from './sound'
import type { CareerSave } from './store'
import { supabase } from '../lib/supabase'
import { resilientWrite } from './pending'
import { CATALOG, CATALOG_EU, BIOS, ehPromessa, TIMES_ELITE } from './data'
import { AdminButton } from './admin'
import { stripEmoji, myApoioPerk, APOIO_PERKS, ApoioSheen, logApoio, useHasManual, myFundadorN } from './apoio'
import type { ApoioTier } from './apoio'
import { fotoDoJogador } from './rostos'
import { AvatarLote1, avatarLote1 } from './avatar-lote1'
import { PRESIDENT_EDITOR_RELEASED } from './career-feature-release'
import { JogadorNoCampo, VagaNoCampo } from './jogadorcampo'
import { DinastiaButton } from './dinastia'
import { CareerOnlineButton, LigaFechadaButton } from './careeronline'
import { PyramidOverlay } from './pyramid'
// 🌍 COPA DO MUNDO DEPOIS DA LIGA (01/09) — LAZY de propósito: este pedaço
// puxa o torneio inteiro junto, e só quem termina uma sala 'liga + Copa do
// Mundo' precisa dele. Ninguém mais baixa um byte a mais.
const CopaDaLigaLazy = lazy(() => import('./copa-mundo-online').then(m => ({ default: m.CopaDaLigaGate })))
import { LigaHub } from './ligahub' // 🏆 a liga num lugar só: Rank · Estante · Temporadas · Ajustes
import { VADICO_LOGO } from './vadico'
import { useResumableRoom } from './lobby'
import { playerColors, perkFromSelo, LiveScoreCard, PensShootout, pensRevealDelay, COPA_LEG_MS } from './pyramidseason'
import { useOnlinePreview } from './online-preview'
import { AvisoVersaoNova } from './aviso-versao'
import { anotaTrava } from './caixa-preta'
import { useLegendPresentation } from './presentation-release'
import { publicCareerVisual } from './career-feature-release'
import { publicOnlineVisual } from './online-release'
import { useRoundPresentationStart, OnlineRhythm, OnlineMatchTabs, CompetitionStage, CompetitionMatch, RoundMatchPresentation, type OnlineMatchTab } from './online-match-visual'
import { Escudo, LOGOS_PRONTAS, escudoDe } from './escudos' // 🛡️ brasão do clube (desenhado por código, do NOME)
import { JornalDaSalaBloco } from './jornal-sala' // 📰 O MARTELO · edição da sala (fim do rápido online)
import { useSport, useSportUnlocked, useTemaLiberado, useAgenciaLiberada, useRevealCinema, useLibertaLiberada, useHomeNova, useHomeIlustrada, usePregaoLimpo, getSport, escadaLiberada, type Sport } from './sport'
import { novidadesDaVez, novTitulo, novTexto } from './novidades'
import { AvisoDaVez } from './aviso'
import { MUDANCAS_JOGADORES } from './novidades-jogadores'
import { useLang, useT, getLang, ordinal, tr } from './lang'
import { POS_LABELS } from './sportcfg'
import { meuManto, mantoStripes, meuMantoAngle, meuMantoC3, meuMantoC3Buffer, useMeuSocio, nomeLivre, NOME_MSG } from './manto'
import { MASCOTES, FestaoMascote } from './mascotes'
import { historiaSondagem } from './tecnicos' // 📰 historinha do setor TÉCNICO sondado
import { JanelaConta } from './conta'
import './home-ilustrada.css'
import './career-private.css'
import careerSetupRoom from './img/career-setup-room-private.webp'
import presidentCasual from './img/career-president-casual.webp'
import presidentPolo from './img/career-president-polo.webp'
import presidentSocial from './img/career-president-social.webp'
import presidentTerno from './img/career-president-terno.webp'

// 🏀/⚽ rótulo do SETOR conforme esporte + idioma (futebol = igual a SECTOR_LABEL;
// basquete = Armadores/Alas/Pivôs em BR ou EN). Usado no topo do pregão.
function secLabel(sport: Sport, pos: Sector, lang: 'pt' | 'en'): string {
  return POS_LABELS[sport][pos].plural[lang]
}
// selo curto da posição na carta (GOL… no futebol; PG/SG/SF/PF/C no basquete).
const SECTOR_KEYS: Sector[] = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']
function posTag(pos: string): string {
  return getSport() === 'basquete' && (SECTOR_KEYS as string[]).includes(pos)
    ? POS_LABELS.basquete[pos as Sector].tag : pos
}

// universo colecionável = os DOIS baralhos (BR + Europa), por nomes únicos
// (Kaká, Cafu etc. aparecem nos dois — conta uma vez só).
// total colecionável = cada AUGE é uma carta (nome+clube+ano). Mesmo nome em
// clubes/anos diferentes (Vini Jr Flamengo x Real Madrid, Kaká SP x Milan) são
// cartas DISTINTAS — contam separado. Só o idêntico (nome+clube+ano) que não vale.
const CATALOG_TOTAL = new Set([...Object.values(CATALOG).flat(), ...Object.values(CATALOG_EU).flat()].map(c => `${c.name}|${c.club}|${c.year}`)).size

// 🔗 O ENDEREÇO QUE VAI NO COMPARTILHAR. Era o link cru do GitHub, de antes do
// domínio existir — e ele saía no texto E IMPRESSO DENTRO DA IMAGEM. O Diego pegou
// (04/09): *"veio c esse link horrível sendo q já temos nosso domínio"*.
const GAME_URL = 'https://leilaolegends.com'

// ─── estilo base (neubrutalista, igual ao resto do estúdio) ──────────
const CREAM = '#F4ECD6'
const INK = '#0C0C0C'
// 🏛️ SALÃO DOS BATISMOS — carregado SÓ quando abre (import preguiçoso). Além de
// não pesar pra quem nunca entra, é o que quebra o ciclo de import: o Salão
// precisa do Shell/Box daqui, e daqui a gente precisa dele.
const SalaoLazy = lazy(() => import('./salao'))

const GOLD = '#FFC400'
// 🎨 COR SÓLIDA de cada lado do placar da Copa dos 8 (estilo Brasfoot). VOCÊ = cor
// do seu TIER (com brilho); amigo (online) = cor fixa viva; BOT = cor viva própria
// também (Diego 11/08: era apagada/cinza e ficava tudo parecido — agora cada bot
// puxa a MESMA paleta, só sem brilho de tier). Paleta FORA das cores de tier.
// 🛡️ Diego (11/08): cor tem que bater com a do ESCUDO do time, não sortear separado
// — puxa o fundo (c1) do mesmo gerador de escudo, qualquer nome (real ou fictício).
const copaSideColor = (name: string): string => escudoDe(name).c1
type CopaFill = { bg: string; ink: string; holo: number }
const _lum = (r: number, g: number, b: number) => 0.3 * r + 0.59 * g + 0.11 * b
const _inkFor = (hex: string) => { const n = parseInt(hex.slice(1), 16); return _lum((n >> 16) & 255, (n >> 8) & 255, n & 255) > 150 ? '#0c0c0c' : '#ffffff' }
const TIER_INK: Record<string, string> = { bege: '#0c0c0c', verde: '#ffffff', roxo: '#ffffff', prata: '#0c0c0c', ouro: '#0c0c0c' }
function copaFill(kind: 'you' | 'human' | 'bot', name: string): CopaFill {
  if (kind === 'you') { const p = myApoioPerk() ?? APOIO_PERKS.bege; return { bg: p.grad, ink: TIER_INK[p.tier], holo: p.holo } }
  const hex = copaSideColor(name)
  return { bg: hex, ink: _inkFor(hex), holo: 0 }
}
const copaCenterChip: React.CSSProperties = { background: 'rgba(8,8,10,.55)', borderRadius: 7, padding: '1px 7px', color: '#fff' }
const GREEN = '#1B7A3D'
const RED = '#E8503A'
// ⚔️ o VERMELHO DO DUELO (desempate). Diego 04/09, vendo a live: *"esse dourado
// no empate tá confundindo pq não é lenda"*. A caixa do desempate era SEMPRE
// dourada, e dourado no jogo inteiro quer dizer 👑 LENDA.
// ⚠️ E não dá pra copiar a regra da revelação (`fame >= 5 ? GOLD : '#fff'`): lá o
// nível JÁ saiu; o desempate rola no meio do pregão ÀS CEGAS, então cor por
// raridade entregaria o nível antes do martelo. Vermelho é a única cor forte que
// não significa raridade em canto nenhum — e já é a cor do ⚔️ no título.
const DUELO = '#C2452F'
const PURPLE = '#7C3AED'
// 🎨 identidade da Copa dos 8 (Diego 14/08): roxo brilhante, MESMO degradê da
// carta 💎 Promessa (não é um brilho novo, é o mesmo mecanismo reaproveitado).
const PURPLE_HOLO = 'linear-gradient(150deg,#C9A9FF,#8B5CF6 52%,#5B2FB0)'
// 🌎 identidade da LIBERTADORES (Diego 20/08, mockup aprovado): azul-noite
// brilhante — mesmo mecanismo de brilho do roxo da Copa, só que outra cor, pra
// dar pra saber de longe qual dos dois torneios está rolando na tela.
const NOITE_HOLO = 'linear-gradient(150deg,#8FAEF0,#2E4A8F 52%,#0F1A38)'
const NOITE = '#1B2A5B'
const OSWALD = { fontFamily: 'Oswald, sans-serif' }

// ícone do Instagram (traço, herda a cor do texto — fica sutil onde for usado)
function InstaIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: '-1.5px', marginRight: 3 }} aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}
// crédito sutil pro rodapé durante o jogo (mesma cor/discrição do rodapé da home)
export function CreditLine({ className = '' }: { className?: string }) {
  return (
    <p className={`text-center text-black/30 text-[11px] font-semibold ${className}`}>
      <a href="https://instagram.com/leilaolegendscom" target="_blank" rel="noopener noreferrer" className="text-black/30 no-underline"><InstaIcon /> @leilaolegendscom</a>
    </p>
  )
}
// rodapé completo (contato) — aparece SUTIL no final de TODAS as telas do jogo.
// Fundo bege PRÓPRIO pra ficar legível em qualquer tela (senão o texto escuro
// some no fundo preto do app fora da área das telas).
// ─── APOIE O PROJETO (Pix) ────────────────────────────────────────────
// Fluxo aprovado: escolha (só apoiar / batizar clube) → sonho → batismo.
// NENHUM valor de apoio aparece pra ninguém. Chave em PIX_KEY; DM no Instagram.
const PIX_KEY = 'diego.c.fonseca@gmail.com'
const PIX_NOME = 'DIEGO FONSECA'   // recebedor (obrigatório no BR Code, ≤25, sem acento)
const PIX_CIDADE = 'RIO DE JANEIRO' // cidade do recebedor (obrigatório, ≤15, sem acento)
const APOIO_IG = 'https://ig.me/m/leilaolegendscom'
// 💳 planos do SÓCIO no Mercado Pago (criados pelo Diego 09/08) — preço por
// fidelidade: grátis 9,90 · ⭐ Craque 4,90 · 👑 Lenda 2,90 (batismo = incluso)
const MP_SOCIO = { base: 'https://mpago.la/2G3nmQq', craque: 'https://mpago.la/1jqtK38', lenda: 'https://mpago.la/2CGoqiJ' } as const

// CRC16-CCITT (poly 0x1021, init 0xFFFF) — exigido no fim do código Pix.
function pixCrc16(str: string): string {
  let crc = 0xFFFF
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}
// 🟢 PIX "COPIA E COLA" (BR Code / EMV, padrão do Banco Central). Estático, com
// valor opcional já preenchido. A pessoa cola no banco em "Pix Copia e Cola" e só
// confirma — sem digitar chave nem valor. Muito menos atrito que copiar o e-mail.
function pixCode(amount?: number): string {
  const f = (id: string, val: string) => id + String(val.length).padStart(2, '0') + val
  const mai = f('00', 'br.gov.bcb.pix') + f('01', PIX_KEY)
  const body =
    f('00', '01') +                                   // formato
    f('26', mai) +                                    // conta Pix (chave)
    f('52', '0000') +                                 // categoria
    f('53', '986') +                                  // moeda: BRL
    (amount && amount > 0 ? f('54', amount.toFixed(2)) : '') + // valor (opcional)
    f('58', 'BR') +                                   // país
    f('59', PIX_NOME) +                               // nome do recebedor
    f('60', PIX_CIDADE) +                             // cidade
    f('62', f('05', '***'))                           // txid vazio
  const semCrc = body + '6304'
  return semCrc + pixCrc16(semCrc)
}

// 🌐 ajudinha pra texto RICO (com <b>, <i>, links): tr() só serve pra string
// pelada. `L(pt, en)` escolhe o pedaço de JSX inteiro pelo idioma do site.
const L = (pt: React.ReactNode, en: React.ReactNode): React.ReactNode => (getLang() === 'en' ? en : pt)

function PixBox({ label = 'copiar', ctx, amount }: { label?: string; ctx?: string; amount?: number }) {
  const [copied, setCopied] = useState<'code' | 'key' | null>(null)
  const copyCode = async () => {
    if (ctx) logApoio(`💰 copiou o Pix${amount ? ` R$${amount}` : ''} · ${ctx}`)
    const code = pixCode(amount)
    try { await navigator.clipboard.writeText(code); setCopied('code'); setTimeout(() => setCopied(null), 2500) }
    catch { window.prompt(tr('Copia o código Pix (cola no banco em "Pix Copia e Cola"):', 'Copy the Pix code (paste it in your bank under "Pix Copia e Cola"):'), code) }
  }
  const copyKey = async () => {
    try { await navigator.clipboard.writeText(PIX_KEY); setCopied('key'); setTimeout(() => setCopied(null), 2500) }
    catch { window.prompt(tr('Copia a chave Pix:', 'Copy the Pix key:'), PIX_KEY) }
  }
  void label
  return (
    <>
      {/* JEITO FÁCIL: copia e cola — o valor já vai junto */}
      <button onClick={copyCode}
        className="w-full rounded-xl border-[3px] border-black font-black text-base py-3 active:translate-y-0.5"
        style={{ background: copied === 'code' ? GREEN : GOLD, color: copied === 'code' ? '#fff' : INK, boxShadow: `4px 4px 0 0 ${INK}`, ...OSWALD }}>
        {copied === 'code' ? tr('✅ CÓDIGO COPIADO — VALEU DEMAIS! 💛', '✅ CODE COPIED — THANK YOU SO MUCH! 💛') : `${tr('📋 COPIAR PIX', '📋 COPY PIX')}${amount ? ` · R$ ${amount.toFixed(2).replace('.', ',')}` : ''}`}
      </button>
      <p className="text-[10.5px] font-bold text-black/55 mt-1.5 leading-snug text-center">
        {L(<>No banco: <b>Pix › Pix Copia e Cola › colar</b>. {amount ? 'O valor já vai preenchido — é só confirmar. 💛' : 'Aí você escolhe o valor. 💛'}</>,
           <>In your bank app: <b>Pix › Pix Copia e Cola › paste</b>. {amount ? 'The amount comes filled in — just confirm. 💛' : 'Then you choose the amount. 💛'}</>)}
      </p>
      {/* alternativa: a chave e-mail, pra quem preferir */}
      <button onClick={copyKey} className="w-full text-[11px] font-black underline text-black/45 mt-1.5 active:opacity-60">
        {copied === 'key' ? tr('✅ chave copiada!', '✅ key copied!') : tr('ou copiar só a chave (e-mail)', 'or copy just the key (e-mail)')}
      </button>
    </>
  )
}
// escada de cores (produto visual): cada tier espelha a categoria das cartas.
// bege e verde SEM selo (ninguém carrega etiqueta de "menor" — selo começa no 💎).
// 🖋️ FUNDADOR: 100 vagas, hoje SÓ pelo batismo (quem já era fundador continua).
// Contador MANUAL — cada batismo que o Diego
// confirmar no Instagram, baixar este número aqui (não dá pra contar sozinho).
const FUNDADOR_VAGAS = 64
// 🎫 ÁREA DO SÓCIO (mockup aprovado 09/08): votação do mês + mural. Regra
// anti-spoiler do Diego: as barras de resultado SÓ abrem depois de votar.
// Backend: esc_votacao_atual / esc_votar / esc_mural (1 voto por sócio no banco).
interface VotAtual { id: number; pergunta: string; opcoes: string[]; votos: number[]; meu_voto: number | null }
interface MuralRow { nome: string; socio_n: number; desde: string; origem: string; tier: string | null }
function AreaSocioBody({ socioN }: { socioN: number | null }) {
  const [vot, setVot] = useState<VotAtual | null>(null)
  const [mural, setMural] = useState<MuralRow[]>([])
  const [busy, setBusy] = useState(false)
  const [carregou, setCarregou] = useState(false)
  const carregar = async () => {
    try {
      const [v, m] = await Promise.all([supabase.rpc('esc_votacao_atual'), supabase.rpc('esc_mural')])
      const r = (Array.isArray(v.data) ? v.data[0] : v.data) as VotAtual | undefined
      setVot(r && r.pergunta ? r : null)
      setMural((m.data ?? []) as MuralRow[])
    } catch { /* sem rede — mostra o que der */ }
    setCarregou(true)
  }
  useEffect(() => { carregar() }, [])
  const votar = async (i: number) => {
    if (!vot || busy || vot.meu_voto != null) return
    setBusy(true)
    try { await supabase.rpc('esc_votar', { p_votacao: vot.id, p_opcao: i }); logApoio(`🗳️ votou na opção ${i + 1}`) } catch { /* já votou/fechou */ }
    await carregar(); setBusy(false)
  }
  const total = vot ? vot.votos.reduce((a, b) => a + b, 0) : 0
  const corTier = (t: string | null) => t === 'ouro' ? GOLD : t === 'prata' ? '#CBD4DE' : t === 'verde' ? '#41C07A' : '#8B5CF6'
  const selo = (r: MuralRow) => r.origem === 'batismo' ? '👑🖋️' : r.tier === 'ouro' ? '👑🎫' : r.tier === 'prata' ? '⭐🎫' : '🎫'
  return (
    <>
      <div className="border-[3px] border-black rounded-xl px-3 py-2.5" style={{ background: 'linear-gradient(150deg,#A78BFA,#7C3AED)', boxShadow: `4px 4px 0 0 ${INK}`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(115deg,transparent 30%,rgba(255,255,255,.4) 48%,transparent 62%)', backgroundSize: '250% 250%', animation: 'escSheen 3s linear infinite' }} />
        <p className="font-black text-white text-lg uppercase relative" style={{ ...OSWALD, textShadow: '1px 1px 0 rgba(0,0,0,.4)' }}>{tr('🎫 Área do Sócio', '🎫 Members Area')}{socioN != null ? ` · ${tr('nº', 'no.')} ${socioN}` : ''}</p>
        <p className="text-[10.5px] font-bold text-white/85 relative">{tr('obrigado por segurar essa resenha com a gente 💜', 'thanks for keeping this party going with us 💜')}</p>
      </div>

      <div className="border-[3px] border-black rounded-xl overflow-hidden mt-3" style={{ boxShadow: `3px 3px 0 0 ${INK}` }}>
        <p className="text-[10px] font-black uppercase tracking-wide text-center py-1.5 text-white" style={{ background: vot?.meu_voto != null ? GREEN : '#7C3AED', ...OSWALD }}>{tr('🗳️ Votação dos sócios — a novidade é você quem escolhe', '🗳️ Members vote — you pick what comes next')}</p>
        <div style={{ background: '#FBF6E8', padding: 10 }}>
          {!vot && <p className="text-[11px] font-bold text-black/55 text-center py-2">{carregou ? tr('nenhuma votação aberta agora — o Diego avisa no grupo quando abrir a próxima 🔨', 'no vote open right now — Diego announces the next one in the group 🔨') : tr('carregando…', 'loading…')}</p>}
          {vot && (
            <>
              <p className="font-black text-[13px]">{vot.pergunta}</p>
              <p className="text-[9.5px] font-bold text-black/50">{vot.meu_voto != null ? (getLang() === 'en' ? `✅ your vote is counted · ${total} vote${total === 1 ? '' : 's'} so far` : `✅ seu voto tá contado · ${total} voto${total === 1 ? '' : 's'} até agora`) : tr('1 voto por sócio · resultado aparece depois de votar 🤫', '1 vote per member · the result shows up after you vote 🤫')}</p>
              {vot.opcoes.map((op, i) => {
                const votou = vot.meu_voto != null
                const pct = votou && total > 0 ? Math.round((vot.votos[i] ?? 0) * 100 / total) : 0
                return votou ? (
                  <div key={i} className="border-[2.5px] border-black rounded-xl mt-1.5 overflow-hidden relative" style={{ background: '#fff' }}>
                    <div style={{ position: 'absolute', inset: 0, width: `${pct}%`, background: 'linear-gradient(150deg,#C9A9FF,#8B5CF6)', opacity: vot.meu_voto === i ? 1 : 0.4 }} />
                    <div className="relative flex justify-between px-2.5 py-1.5 text-[12px] font-black"><span>{op}{vot.meu_voto === i ? tr(' · seu voto ✔️', ' · your vote ✔️') : ''}</span><b>{pct}%</b></div>
                  </div>
                ) : (
                  <button key={i} disabled={busy} onClick={() => votar(i)} className="w-full text-left border-[2.5px] border-black rounded-xl px-2.5 py-2 mt-1.5 bg-white active:translate-y-0.5 font-black text-[12px]" style={{ boxShadow: `2px 2px 0 0 ${INK}`, opacity: busy ? 0.6 : 1 }}>{op}</button>
                )
              })}
            </>
          )}
        </div>
      </div>

      <div className="border-[3px] border-black rounded-xl overflow-hidden mt-3" style={{ boxShadow: `3px 3px 0 0 ${INK}` }}>
        <p className="text-[10px] font-black uppercase tracking-wide text-center py-1.5" style={{ background: '#141414', color: GOLD, ...OSWALD }}>{tr('📜 Mural dos Sócios do Leilão Legends', '📜 Leilão Legends Members Wall')}</p>
        <div style={{ background: '#fff', maxHeight: 260, overflowY: 'auto' }}>
          {mural.map((r, i) => (
            <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 text-[11.5px] font-black" style={{ borderTop: i ? '2px dashed rgba(0,0,0,.12)' : 'none' }}>
              <span style={{ width: 13, height: 13, borderRadius: 999, border: '2px solid #000', background: corTier(r.tier), boxShadow: `0 0 5px 1px ${corTier(r.tier)}`, flexShrink: 0 }} />
              <span className="truncate">{r.nome} {selo(r)}</span>
              <span className="text-[9px] font-black border-2 border-black rounded-lg px-1.5 flex-shrink-0" style={{ background: '#FFE79A' }}>{tr('nº', 'no.')} {r.socio_n}</span>
              <span className="ml-auto text-[8px] font-bold text-black/45 text-right leading-tight flex-shrink-0">{r.origem === 'batismo' ? tr('batismo', 'club naming') : tr('sócio', 'member')}<br />{tr('desde', 'since')} {new Date(r.desde + 'T12:00').toLocaleDateString(getLang() === 'en' ? 'en-GB' : 'pt-BR', { month: '2-digit', year: 'numeric' })}</span>
            </div>
          ))}
          {mural.length === 0 && <p className="text-[11px] font-bold text-black/50 text-center py-3">{carregou ? tr('o mural abre quando os sócios chegarem 💜', 'the wall opens up once members arrive 💜') : tr('carregando…', 'loading…')}</p>}
        </div>
        <p className="text-[9px] font-bold text-black/50 text-center py-1.5" style={{ background: '#FBF6E8', borderTop: `2px solid ${INK}` }}>{tr('cada um na cor do PRÓPRIO tier · o 🖋️ é só de quem batizou', 'everyone in their OWN tier colour · the 🖋️ is only for club namers')}</p>
      </div>
    </>
  )
}

// 🔗 link direto pro APOIE (pra postar nos stories/grupo): leilaolegends.com/?apoie=lenda
// abre o modal já na cor OURO. Também vale ?apoie=craque (manual) e ?apoie=1 (tela geral).
// consumido UMA vez só (vários ApoieButton montam ao mesmo tempo — só o primeiro abre).
let apoieLinkConsumido = false
// 🧯 Modal do apoio FORA do componente (bug 10/08): quando ele era declarado
// DENTRO do ApoieButton, virava função nova a cada tecla → o React remontava o
// modal e o campo "nome do clube" do batismo PERDIA O FOCO a cada letra (mesmo
// bug da Copa). Fora daqui, identidade estável — digitar funciona normal.
// 🖥️ TELA CHEIA (Diego 23/08: *"e sobre a tela do apoie quero tela cheia"* —
// antes era uma janelinha de 390px, apertada, com tudo em sanfona). Agora ocupa
// a tela inteira: cabeçalho preto FIXO com o ✕ (sempre à mão, não some ao rolar)
// e o conteúdo rolando por baixo, numa coluna de leitura de 620px no máximo —
// em celular ela usa tudo, em tela grande não estica feio.
// ⚠️ Sem "clicar fora pra fechar": em tela cheia não existe fora, e o toque
// perdido fechava a tela sem querer.
function ApoieModal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 99997, background: '#F4ECD6', color: INK, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <style>{'@keyframes escSheen{0%{background-position:180% 180%}100%{background-position:-80% -80%}}#root button[aria-label="Desligar som"],#root button[aria-label="Ligar som"]{visibility:hidden!important}'}</style>
      <div style={{ position: 'sticky', top: 0, zIndex: 3, background: INK, padding: '11px 15px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 3px 10px rgba(0,0,0,.25)' }}>
        <span style={{ ...OSWALD, fontWeight: 900, fontSize: 16, textTransform: 'uppercase', color: GOLD, lineHeight: 1.1 }}>{tr('💛 Apoiar o Leilão Legends', '💛 Support Leilão Legends')}</span>
        <button onClick={onClose} aria-label={tr('fechar', 'close')} style={{ marginLeft: 'auto', flexShrink: 0, background: 'transparent', color: '#fff', border: '2px solid rgba(255,255,255,.35)', borderRadius: 10, padding: '3px 11px', ...OSWALD, fontWeight: 900, fontSize: 15, cursor: 'pointer' }}>✕</button>
      </div>
      <div style={{ maxWidth: 620, margin: '0 auto', padding: '14px 15px 40px' }}>
        {children}
        <p className="text-center mt-4"><button onClick={onClose} className="text-xs font-black underline text-black/50">{tr('fechar', 'close')}</button></p>
      </div>
    </div>,
    document.body
  )
}
export function ApoieButton({ big = false, startScreen = 'choice', trigger }: { big?: boolean; startScreen?: 'choice' | 'manual' | 'batismo'; trigger?: (open: () => void) => React.ReactNode }) {
  const [screen, setScreen] = useState<'off' | 'choice' | 'pix' | 'pay' | 'batismo' | 'manual' | 'socio'>('off')
  const meuSoc = useMeuSocio() // 🎫 sócio ativo vê a ÁREA dele no lugar da propaganda
  const openApoio = () => { if (startScreen === 'manual') logApoio('👀 abriu: modo manual (trava)'); setScreen(startScreen) }
  const [clube, setClube] = useState('')
  // ⚽ BATISMO: qual série o clube vai jogar — muda o valor do Pix (Série D
  // custa mais, são os rivais escolhidos). Cards viram seletor (09/08).
  const [serieBatismo, setSerieBatismo] = useState<'abc' | 'd'>('abc')
  // ⚠️ a chave interna 'd' quer dizer "a divisão CARA", e ela é a Série A desde
  // 30/08 (a troca de letra). O nome da chave ficou pra não mexer no que já
  // funciona; o que o jogador LÊ é o texto ao lado, que já diz Série A.
  const precoCheioBatismo = serieBatismo === 'd' ? 69.9 : 59.9
  // 🎟️ CUPOM DE INFLUENCIADOR (Diego 07/09): "PANTERA" = 10% off SÓ no batismo.
  // O código é conferido no banco (esc_cupom_validar) — nenhum cupom vive no
  // código do jogo, então ninguém descobre fuçando. O desconto entra no valor do
  // Pix copia-e-cola e na mensagem da DM; o uso é registrado (esc_cupom_usar) na
  // hora em que a pessoa aperta "chamar no @", pro relatório do influenciador.
  const [cupomTxt, setCupomTxt] = useState('')
  const [cupomAberto, setCupomAberto] = useState(false) // o linkzinho "tem cupom?" abriu o campo?
  const [cupom, setCupom] = useState<{ codigo: string; influenciador: string; desconto_pct: number } | null>(null)
  const [cupomMsg, setCupomMsg] = useState<string | null>(null)
  const [cupomBusy, setCupomBusy] = useState(false)
  const aplicarCupom = async () => {
    const cod = cupomTxt.trim().toUpperCase()
    if (!cod || cupomBusy) return
    setCupomBusy(true); setCupomMsg(null)
    try {
      const { data, error } = await supabase.rpc('esc_cupom_validar', { p_codigo: cod, p_plano: 'batismo' })
      const row = !error && Array.isArray(data) ? (data[0] as { codigo: string; influenciador: string; desconto_pct: number } | undefined) : undefined
      if (row) { setCupom(row); setCupomMsg(null); logApoio(`🎟️ cupom ${row.codigo} aplicado no batismo`) }
      else { setCupom(null); setCupomMsg(tr('Cupom não encontrado ou vencido. Confere a escrita 🧐', 'Coupon not found or expired. Double-check the spelling 🧐')); logApoio(`🎟️ cupom "${cod}" recusado`) }
    } catch { setCupom(null); setCupomMsg(tr('Sem conexão pra conferir o cupom — tenta de novo.', 'No connection to check the coupon — try again.')) }
    setCupomBusy(false)
  }
  const precoBatismo = cupom ? Math.round(precoCheioBatismo * (100 - cupom.desconto_pct)) / 100 : precoCheioBatismo
  // 🎯 alvo do LINK DIRETO (?apoie=lenda). Antes isto era a sanfona aberta; agora
  // que tudo fica à vista (23/08), ele só rola até o card e acende um brilho.
  const [amp, setAmp] = useState<null | 'socio' | 'prata' | 'ouro' | 'batismo'>(null)
  const [payTier, setPayTier] = useState<'prata' | 'ouro'>('prata')
  const [meuNome, setMeuNome] = useState('') // nome da conta, pra simular na cor com o nome REAL da pessoa
  useEffect(() => {
    if (screen !== 'choice' || meuNome) return
    supabase.auth.getUser().then(({ data }) => { const dn = ((data?.user?.user_metadata?.display_name as string) ?? '').trim(); if (dn) setMeuNome(dn) }).catch(() => { /* deslogado: usa "Seu Nome" */ })
  }, [screen, meuNome])
  const close = () => { setScreen('off'); setAmp(null) }
  useEffect(() => {
    if (apoieLinkConsumido) return
    const a = new URLSearchParams(window.location.search).get('apoie')
    if (!a) return
    apoieLinkConsumido = true
    logApoio(`🔗 chegou pelo link direto: apoie=${a}`)
    if (a === 'lenda') { setScreen('choice'); setAmp('ouro') }
    else if (a === 'craque' || a === 'manual') setScreen('manual')
    else setScreen('choice')
  }, [])
  const igMsg = async (msg: string) => {
    try { await navigator.clipboard.writeText(msg) } catch { /* segue o baile */ }
    window.open(APOIO_IG, '_blank', 'noopener')
  }
  return (
    <>
      {trigger ? trigger(openApoio) : big ? (
        <SupportFooter onOpen={openApoio} />
      ) : (
        <button onClick={openApoio} className="text-xs font-black rounded-full px-3 py-1 border-2 border-black" style={{ background: 'linear-gradient(150deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)', color: INK, boxShadow: `2px 2px 0 0 ${INK}`, ...OSWALD }}>
          {tr('💛 Apoie o projeto (Pix)', '💛 Support the project (Pix)')}
        </button>
      )}

      {screen === 'choice' && <ApoieModal onClose={close}>
        <SupportPlans focus={amp} tier={myApoioPerk()?.tier} name={meuNome} memberActive={!!meuSoc?.ativo} memberNumber={meuSoc?.socioN} foundersLeft={FUNDADOR_VAGAS}
          onPay={tier => { logApoio('👀 escolheu apoio: ' + tier); setPayTier(tier); setScreen(tier === 'prata' ? 'manual' : 'pay') }}
          onNaming={() => { logApoio('🖋 escolheu batismo'); setScreen('batismo') }}
          onMember={() => { if (meuSoc?.ativo) { setScreen('socio'); return } const tier = myApoioPerk()?.tier; logApoio('🎫 abriu assinatura sócio'); window.open(tier === 'ouro' ? MP_SOCIO.lenda : tier === 'prata' ? MP_SOCIO.craque : MP_SOCIO.base, '_blank', 'noopener') }}
          onDonate={() => setScreen('pix')}
          onInstagram={() => window.open(APOIO_IG, '_blank', 'noopener')} />
      </ApoieModal>}

      {screen === 'socio' && (
        <ApoieModal onClose={close}>
          <AreaSocioBody socioN={meuSoc?.socioN ?? null} />
          <p className="text-center mt-3"><button onClick={() => setScreen('choice')} className="text-[11px] font-black underline text-black/45">{tr('← voltar pros apoios', '← back to the packages')}</button></p>
        </ApoieModal>
      )}

      {screen === 'pix' && (
        <ApoieModal onClose={close}>
          <p className="font-black text-2xl text-center" style={OSWALD}>{tr('💛 Valeu por apoiar!', '💛 Thanks for the support!')}</p>
          <p className="text-[13px] font-bold text-black/70 mt-2 leading-snug text-center">
            {tr('Qualquer valor ajuda a pagar o servidor e a manter tudo de graça pra geral. 🔨', 'Any amount helps pay the server and keep everything free for everyone. 🔨')}
          </p>
          <div className="mt-3.5"><PixBox label="copiar chave Pix" ctx="só apoiar" /></div>
          <p className="text-[11px] font-bold text-black/45 mt-3 text-center">{tr('Cola no app do teu banco e pronto. Qualquer valor vira mais jogo. 💛', 'Paste it in your bank app and that\'s it. Any amount turns into more game. 💛')}</p>
        </ApoieModal>
      )}

      {screen === 'manual' && <ApoieModal onClose={close}>
        <div className="ll-support-offer">
          <p className="ll-support-eyebrow">{tr('MODO MANUAL · PLANO CRAQUE', 'MANUAL MODE · STAR PLAN')}</p>
          <h1>{tr('ACELERE. PULE. JOGUE NO SEU RITMO.', 'SPEED UP. SKIP. PLAY AT YOUR PACE.')}</h1>
          <p>{tr('Controle o tempo da carreira com o Craque. Um pagamento, sem mensalidade.', 'Control the pace of Career with Star. One payment, no monthly fee.')}</p>
          <SupportManualPreview />
          <SupportPlanCard title={tr('⭐ CRAQUE', '⭐ STAR')} price="R$ 19,90" cadence={tr('uma vez só', 'one-off payment')} tone="prata">
            <h3>{tr('Não é só velocidade. Tudo isso vem junto:', 'More than speed. All this is included:')}</h3>
            <SupportCraqueBenefits />
            <p className="ll-support-small">{tr('No online normal, o ritmo continua igual para todos. O olheiro Craque não revela nem sonda Lendas.', 'In regular online play the pace stays the same for everyone. The Star scout does not reveal or scout Legends.')}</p>
          </SupportPlanCard>
          <h3>{tr('COMO LIBERAR', 'HOW TO UNLOCK')}</h3>
          <p className="ll-support-small">{tr('1 · Copie o Pix e pague R$ 19,90 no aplicativo do banco.', '1 · Copy the Pix code and pay R$ 19.90 in your banking app.')}</p>
          <div className="mt-3"><PixBox label="copiar Pix (R$ 19,90)" ctx="craque (manual + cor)" amount={19.9} /></div>
          <button onClick={() => { logApoio('⭐ QUER O CRAQUE / MANUAL (R$ 19,90)'); igMsg(tr('Opa! Apoiei o Leilão Legends 💛 Quero o ⭐ CRAQUE (Modo Manual + cor do time + grupo VIP). E-mail da conta: ____ — comprovante em anexo!', 'Hey! I supported Leilão Legends 💛 I want ⭐ STAR (Manual Mode + club colour + VIP). Account email: ____ — receipt attached!')) }} className="ll-support-button" style={{ background: '#d52665', color: '#fff' }}>
            {tr('2 · ENVIAR COMPROVANTE', '2 · SEND RECEIPT')}
          </button>
          <p className="ll-support-small">{tr('@leilaolegendscom · Informe o e-mail da conta. Liberação em até 24h após a conferência.', '@leilaolegendscom · Include your account email. Unlocked within 24h after verification.')}</p>
          <p className="ll-support-note">{tr('Quer mais benefícios? Lenda: R$ 39,90. Seu clube no jogo: Batismo a partir de R$ 59,90.', 'Want more benefits? Legend: R$ 39.90. Your club in the game: Club naming from R$ 59.90.')}</p>
          <button className="ll-support-button" onClick={() => setScreen('choice')}>{tr('CONHECER TODOS OS PLANOS →', 'EXPLORE ALL PLANS →')}</button>
          <SupportStory />
        </div>
      </ApoieModal>}

      {screen === 'pay' && (() => {
        const ouro = payTier === 'ouro'
        const upgrade = ouro && myApoioPerk()?.tier === 'prata'
        const amount = ouro ? (upgrade ? 20 : 39.9) : 19.9
        return (
        <ApoieModal onClose={close}>
          <p className="font-black text-xl text-center" style={OSWALD}>{upgrade ? tr('👑 UPGRADE LENDA · R$ 20,00', '👑 LEGEND UPGRADE · R$ 20.00') : ouro ? tr('👑 LENDA · R$ 39,90', '👑 LEGEND · R$ 39.90') : tr('⭐ CRAQUE · R$ 19,90', '⭐ STAR · R$ 19.90')}</p>
          <p className="text-[10.5px] font-bold text-black/55 text-center mt-1 leading-snug">{ouro ? tr('ouro (ou qualquer cor) com brilho + selo + 🎮 Manual + 📲 grupo VIP + 🕵️ Olheiro de tudo + 💾 6 fichas', 'gold (or any colour) with shine + badge + 🎮 Manual + 📲 VIP group + 🕵️ Scout for everything + 💾 6 save slots') : tr('cor prata com brilho + 🎮 Modo Manual + 📲 grupo VIP + 🕵️ Olheiro até ⭐ + 💾 4 fichas', 'shining silver + 🎮 Manual Mode + 📲 VIP group + 🕵️ Scout up to ⭐ + 💾 4 save slots')}</p>
          <div className="mt-3.5"><PixBox label="copiar Pix" ctx={ouro ? 'lenda' : 'craque (manual + cor)'} amount={amount} /></div>
          <button onClick={() => { logApoio(ouro ? '👑 QUER O LENDA (R$ 39,90)' : '⭐ QUER O CRAQUE (R$ 19,90)'); igMsg(ouro ? tr('Opa! Apoiei o Leilão Legends 💛 Quero o 👑 LENDA (ouro/cor com brilho + Manual + grupo VIP) — comprovante em anexo!', 'Hey! I just supported Leilão Legends 💛 I want the 👑 LEGEND tier (shining gold/colour + Manual + VIP group) — receipt attached!') : tr('Opa! Apoiei o Leilão Legends 💛 Quero o ⭐ CRAQUE (Modo Manual + cor do time + grupo VIP) — comprovante em anexo!', 'Hey! I just supported Leilão Legends 💛 I want the ⭐ STAR tier (Manual Mode + club colour + VIP group) — receipt attached!')) }}
            className="w-full rounded-xl border-[3px] border-black font-black text-[14px] py-3 mt-2.5 active:translate-y-0.5"
            style={{ background: '#E1306C', color: '#fff', boxShadow: `4px 4px 0 0 ${INK}`, ...OSWALD }}>
            {tr('📸 MANDAR COMPROVANTE NO @leilaolegendscom', '📸 SEND THE RECEIPT TO @leilaolegendscom')}
          </button>
          <p className="text-[10px] font-bold text-black/45 text-center mt-1.5">{tr('a mensagem já vai copiada · liberamos em até 24h no seu e-mail · upgrade depois? paga só a diferença 😉', 'the message is already copied · we unlock it within 24h on your e-mail · upgrade later? you only pay the difference 😉')}</p>
          <p className="text-center mt-3"><button onClick={() => setScreen('choice')} className="text-[11px] font-black underline text-black/45">{tr('← voltar pros pacotes', '← back to the packages')}</button></p>
        </ApoieModal>
        )
      })()}

      {screen === 'batismo' && (
        <ApoieModal onClose={close}>
          <p className="font-black text-2xl text-center" style={OSWALD}>{tr('⚽ BATIZA TEU CLUBE', '⚽ NAME YOUR CLUB')}</p>
          <p className="text-xs font-bold text-black/60 text-center mt-1">{tr('3 coisinhas e teu time entra em campo:', '3 little things and your team takes the field:')}</p>
          <p className="font-black text-[13px] mt-3" style={OSWALD}><span className="inline-block w-5 h-5 rounded-full text-center text-[11px] leading-5 mr-1.5" style={{ background: INK, color: GOLD }}>1</span>{tr('Escolhe o nome do clube', 'Pick the club name')}</p>
          <input value={clube} onChange={e => setClube(stripEmoji(e.target.value))} maxLength={26} placeholder={tr('Ex.: Atlético do Jefão', 'e.g. Atlético do Jefão')}
            className="w-full border-[3px] border-black rounded-xl px-3 py-2.5 mt-2 font-black text-base bg-white" style={OSWALD} />
          <p className="text-[10px] font-bold text-black/45 mt-1.5">{tr('✅ nome de resenha, zoeira leve, homenagem · ❌ ofensa, política, marca de empresa', '✅ banter names, light jokes, tributes · ❌ slurs, politics, company brands')}</p>
          <p className="font-black text-[13px] mt-3.5" style={OSWALD}><span className="inline-block w-5 h-5 rounded-full text-center text-[11px] leading-5 mr-1.5" style={{ background: INK, color: GOLD }}>2</span>{tr('Escolhe a série e faz o Pix', 'Pick the division and pay via Pix')}</p>
          <div className="flex gap-1.5 mt-1.5">
            <button onClick={() => setSerieBatismo('abc')} className="flex-1 border-2 border-black rounded-lg px-2 py-1.5 text-[9.5px] font-black text-center active:translate-y-0.5"
              style={{ background: serieBatismo === 'abc' ? GOLD : '#fff', boxShadow: serieBatismo === 'abc' ? `2px 2px 0 0 ${INK}` : 'none' }}>
              {tr('Série B·C·D e Várzea', 'Série B·C·D and Várzea')}<br /><span className="text-[12px]" style={OSWALD}>{tr('R$ 59,90', 'R$ 59.90')}</span>
            </button>
            <button onClick={() => setSerieBatismo('d')} className="flex-1 border-2 border-black rounded-lg px-2 py-1.5 text-[9.5px] font-black text-center active:translate-y-0.5"
              style={{ background: serieBatismo === 'd' ? GOLD : '#fff', boxShadow: serieBatismo === 'd' ? `2px 2px 0 0 ${INK}` : 'none' }}>
              {tr('👑 Série A (a elite)', '👑 Série A (the elite)')}<br /><span className="text-[12px]" style={OSWALD}>{tr('R$ 69,90', 'R$ 69.90')}</span>
            </button>
          </div>
          <p className="text-[9.5px] font-bold text-black/50 mt-1 leading-snug">{L(<>a <b>Série A</b> custa mais porque é a elite: são os clubes que aparecem no <b>jogo rápido</b> e os rivais que todo mundo enfrenta. Toque numa das duas pra escolher.</>,
                                                                                    <><b>Série A</b> costs more because it is the elite: those are the clubs that show up in <b>quick play</b> and the rivals everybody faces. Tap one of the two to choose.</>)}</p>
          <div className="mt-2"><PixBox label="copiar chave Pix" ctx={`batismo do clube · ${serieBatismo === 'd' ? '👑 Série A (a elite)' : 'Série B/C/D ou Várzea'}${cupom ? ` · cupom ${cupom.codigo}` : ''}`} amount={precoBatismo} /></div>
          {/* 🎟️ cupom de influenciador — só aqui, no batismo. SUTIL de propósito
              (Diego 08/09: *"deixe de forma mais sutil lá no pagamento e não tão
              óbvio"*): é uma linha cinza embaixo do Pix, "tem cupom?", que só vira
              campo quando a pessoa toca. Quem não tem cupom nem repara. */}
          {cupom ? (
            <p className="text-[10px] font-bold text-center mt-1.5" style={{ color: GREEN }}>
              {tr('🎟️ cupom', '🎟️ coupon')} <b>{cupom.codigo}</b> {tr('aplicado', 'applied')} · {cupom.desconto_pct}% off · <s className="text-black/40">R$ {precoCheioBatismo.toFixed(2).replace('.', getLang() === 'en' ? '.' : ',')}</s> <b>R$ {precoBatismo.toFixed(2).replace('.', getLang() === 'en' ? '.' : ',')}</b>
              {' '}<button onClick={() => { setCupom(null); setCupomTxt(''); setCupomMsg(null); setCupomAberto(false) }} className="underline text-black/40 font-bold">{tr('tirar', 'remove')}</button>
            </p>
          ) : !cupomAberto ? (
            <p className="text-center mt-1.5"><button onClick={() => setCupomAberto(true)} className="text-[10px] font-bold underline text-black/40">{tr('tem cupom?', 'got a coupon?')}</button></p>
          ) : (
            <div className="mt-1.5">
              <div className="flex gap-1.5 items-center justify-center">
                <input value={cupomTxt} onChange={e => { setCupomTxt(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setCupomMsg(null) }} onKeyDown={e => e.key === 'Enter' && aplicarCupom()} maxLength={16} placeholder={tr('código', 'code')} autoCapitalize="characters" autoFocus
                  className="w-36 border-2 border-black/30 rounded-lg px-2 py-1 font-black text-[12px] bg-white tracking-wider text-center" style={OSWALD} />
                <button onClick={aplicarCupom} disabled={cupomBusy || !cupomTxt.trim()} className="text-[10px] font-black underline" style={{ color: cupomTxt.trim() ? INK : 'rgba(0,0,0,.3)' }}>{cupomBusy ? '…' : tr('aplicar', 'apply')}</button>
                <button onClick={() => { setCupomAberto(false); setCupomTxt(''); setCupomMsg(null) }} className="text-[10px] font-bold underline text-black/35">{tr('fechar', 'close')}</button>
              </div>
              {cupomMsg && <p className="text-[10px] font-bold mt-1 text-center" style={{ color: '#C2452F' }}>{cupomMsg}</p>}
            </div>
          )}
          <p className="font-black text-[13px] mt-3.5" style={OSWALD}><span className="inline-block w-5 h-5 rounded-full text-center text-[11px] leading-5 mr-1.5" style={{ background: INK, color: GOLD }}>3</span>{tr('Manda comprovante + nome', 'Send the receipt + the name')}</p>
          <button onClick={() => {
            logApoio(`🏟️ QUER BATISMO: "${clube.trim() || '(sem nome)'}"${cupom ? ` · cupom ${cupom.codigo}` : ''}`)
            // 🎟️ registra o uso do cupom (pro relatório do influenciador). Não trava
            // nada se falhar: a DM com "cupom X" continua sendo a prova pro Diego.
            if (cupom) supabase.rpc('esc_cupom_usar', { p_codigo: cupom.codigo, p_clube: clube.trim(), p_serie: serieBatismo === 'd' ? 'A' : 'BCD', p_valor_cheio: precoCheioBatismo, p_valor_pago: precoBatismo }).then(() => {}, () => {})
            igMsg(getLang() === 'en'
              ? `Hey! I just supported Leilão Legends 💛 I want to name my club: "${clube.trim() || '(club name)'}"${cupom ? ` — I used coupon ${cupom.codigo} (${cupom.desconto_pct}% off, paid R$ ${precoBatismo.toFixed(2)})` : ''} — receipt attached!`
              : `Opa! Acabei de apoiar o Leilão Legends 💛 Quero batizar meu clube: "${clube.trim() || '(nome do clube)'}"${cupom ? ` — usei o cupom ${cupom.codigo} (${cupom.desconto_pct}% off, paguei R$ ${precoBatismo.toFixed(2).replace('.', ',')})` : ''} — comprovante em anexo!`)
          }} className="w-full mt-2 rounded-xl border-[3px] border-black font-black text-[15px] py-3 active:translate-y-0.5"
            style={{ background: '#E1306C', color: '#fff', boxShadow: `4px 4px 0 0 ${INK}`, ...OSWALD }}>
            {tr('📸 CHAMAR NO @leilaolegendscom', '📸 MESSAGE @leilaolegendscom')}
          </button>
          <p className="text-[10px] font-bold text-black/45 mt-1.5 text-center">{tr('(a mensagem já vai copiada — é só colar na DM e anexar o comprovante)', '(the message is already copied — just paste it in the DM and attach the receipt)')}</p>
          <p className="text-[11px] font-bold text-black/55 mt-3 leading-snug text-center">{tr('A gente responde em até 24h confirmando o clube — e na próxima atualização ele já tá jogando pra todo mundo. ⚽', 'We reply within 24h confirming the club — and in the next update it is already playing for everyone. ⚽')}</p>
          <p className="text-[10.5px] font-bold text-black/60 mt-2 leading-snug text-center">{L(<>👑 <b>Bônus:</b> batizar já inclui <b>tudo do Lenda</b> + o <b>🎫 Sócio Legends</b> (manto, escudo, mascote, estádio batizado). Se alguém cobrir a proposta pelo nome, você perde <b>só o nome</b> — o resto continua com você. Aí é cobrir ou chorar. 😄</>,
                                                                                                <>👑 <b>Bonus:</b> naming a club already includes <b>everything from Legend</b> + <b>🎫 Legends Membership</b> (kit, crest, mascot, named stadium). If someone outbids you for the name, you only lose <b>the name</b> — everything else stays with you. Then it's outbid or cry. 😄</>)}</p>
          <div className="border-[3px] border-black rounded-xl px-3 py-2.5 mt-3 text-center" style={{ background: INK }}>
            <p className="font-black text-[12px] tracking-wide" style={{ color: GOLD, ...OSWALD }}>{tr('🤫 DISCRIÇÃO TOTAL', '🤫 COMPLETE DISCRETION')}</p>
            <p className="text-[10.5px] font-bold mt-1 leading-snug" style={{ color: 'rgba(255,255,255,0.75)' }}>{tr('Nenhum valor aparece pra ninguém, nunca. Quanto cada um apoiou fica só entre você e a gente. No jogo, só existe o nome do clube.', 'No amount is ever shown to anyone, ever. How much each person gave stays between you and us. In the game, only the club name exists.')}</p>
          </div>
        </ApoieModal>
      )}
    </>
  )
}

// ─── 💬 CHAT / ZOEIRA DA SALA (só online) ────────────────────────────────
// FAB no canto + gaveta que abre/fecha. Mensagens efêmeras (broadcast, fora do
// reducer — não afeta o jogo). Badge de não-lidas POR usuário (some ao abrir,
// sem aumentar o botão). Host liga/desliga o chat pra sala toda (padrão: on).
const CHAT_DOTS = [RED, '#2E6FB0', GREEN, PURPLE, GOLD, '#E0731E', '#0EA5A0']
export function ChatWidget() {
  const { state, chat, chatUnread, sendChat, chatOpen, setChatOpen, dispatch } = useEsc()
  const [text, setText] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const online = state.onlineMode === 'online'
  const inRoom = online && !!state.roomId
  const isHost = !!state.isHost
  const chatOff = !!state.chatOff
  useEffect(() => { if (chatOpen && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight }, [chat, chatOpen])
  if (!inRoom) return null
  if (chatOff && !isHost) return null // host desligou → convidados não veem nada
  const dot = (from: number) => CHAT_DOTS[((from % CHAT_DOTS.length) + CHAT_DOTS.length) % CHAT_DOTS.length]
  const send = (t: string) => { sendChat(t); setText('') }
  return (
    <>
      {!chatOpen && (
        <button onClick={() => setChatOpen(true)} aria-label={tr('Abrir chat da sala', 'Open room chat')}
          style={{ position: 'fixed', left: 12, bottom: 12, zIndex: 99990, width: 46, height: 46, borderRadius: 999, background: chatOff ? '#fff' : GOLD, border: '3px solid #000', display: 'grid', placeItems: 'center', fontSize: 20, boxShadow: '3px 3px 0 0 #000', cursor: 'pointer' }}>
          {chatOff ? '🔕' : '💬'}
          {chatUnread > 0 && !chatOff && (
            <span style={{ position: 'absolute', top: -5, right: -4, background: RED, color: '#fff', border: '2px solid #000', borderRadius: 999, ...OSWALD, fontWeight: 900, fontSize: 10, minWidth: 17, height: 17, display: 'grid', placeItems: 'center', padding: '0 3px', lineHeight: 1 }}>{chatUnread}</span>
          )}
        </button>
      )}
      {chatOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99991, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div onClick={() => setChatOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.28)' }} />
          <div style={{ position: 'relative', color: INK, background: '#FBF6E7', borderTop: `3px solid ${INK}`, borderRadius: '18px 18px 0 0', maxWidth: 460, width: '100%', margin: '0 auto', maxHeight: '64vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 -6px 0 0 rgba(0,0,0,.12)' }}>
            <div style={{ background: INK, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px' }}>
              <span style={{ ...OSWALD, fontWeight: 900, textTransform: 'uppercase', fontSize: 14 }}>{tr('💬 Zoeira da sala', '💬 Room banter')}</span>
              <button onClick={() => setChatOpen(false)} aria-label={tr('Fechar', 'Close')} style={{ width: 24, height: 24, borderRadius: 999, background: '#fff', color: '#000', border: '2px solid #000', ...OSWALD, fontWeight: 900, cursor: 'pointer' }}>✕</button>
            </div>
            {isHost && (
              <button onClick={() => dispatch({ type: 'SET_CHAT', off: !chatOff })}
                style={{ ...OSWALD, color: INK, fontWeight: 800, fontSize: 12, padding: '7px 12px', background: chatOff ? '#f0ece0' : '#E7F7EC', borderBottom: '2px solid #000', textAlign: 'left', cursor: 'pointer', width: '100%' }}>
                👑 Host: chat <b style={{ color: chatOff ? RED : GREEN }}>{chatOff ? tr('DESLIGADO', 'OFF') : tr('LIGADO', 'ON')}</b> — {tr('toque pra', 'tap to turn')} {chatOff ? tr('LIGAR', 'ON') : tr('DESLIGAR', 'OFF')}
              </button>
            )}
            {chatOff ? (
              <p style={{ padding: 20, textAlign: 'center', fontWeight: 700, color: '#6b5f3f' }}>{tr('🔕 O chat está desligado pra esta sala.', '🔕 Chat is off for this room.')}{isHost ? tr(' Ligue no botão acima.', ' Turn it on with the button above.') : ''}</p>
            ) : (
              <>
                <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 7, minHeight: 90 }}>
                  {chat.length === 0
                    ? <p style={{ textAlign: 'center', color: '#8a7d59', fontWeight: 700, fontSize: 12, marginTop: 10 }}>{tr('Manda a primeira zoeira 😎', 'Send the first jab 😎')}</p>
                    : chat.map(m => {
                      // 🤝 DUPLA: os dois dividem o mesmo `from` (time) — usa o `uid` da
                      // PESSOA quando existe, senão cai no `from` de sempre (mensagem
                      // antiga guardada no aparelho, ou sala sem dupla).
                      const mine = m.uid ? m.uid === state.youUid : m.from === state.youIdx
                      return (
                        <div key={m.id} style={{ display: 'flex', gap: 7, alignItems: 'flex-start', flexDirection: mine ? 'row-reverse' : 'row' }}>
                          <span style={{ width: 11, height: 11, borderRadius: 999, border: '1.5px solid #000', background: dot(m.from), marginTop: 4, flexShrink: 0 }} />
                          <div style={{ background: mine ? '#FFF3D6' : '#fff', border: '2px solid #000', borderRadius: 11, padding: '4px 9px', boxShadow: '2px 2px 0 0 #000', maxWidth: '78%' }}>
                            <span style={{ ...OSWALD, fontWeight: 900, fontSize: 10, display: 'block', lineHeight: 1 }}>{mine ? tr('Você', 'You') : m.name}</span>
                            <span style={{ fontSize: 12.5, fontWeight: 600, wordBreak: 'break-word' }}>{m.text}</span>
                          </div>
                        </div>
                      )
                    })}
                </div>
                <div style={{ display: 'flex', gap: 6, padding: 9, borderTop: '2px solid #000', background: CREAM }}>
                  <input value={text} onChange={e => setText(e.target.value)} maxLength={160}
                    onKeyDown={e => { if (e.key === 'Enter') send(text) }} placeholder={tr('manda a real…', 'say it…')}
                    style={{ flex: 1, minWidth: 0, color: INK, background: '#fff', border: '2px solid #000', borderRadius: 9, padding: '7px 10px', fontSize: 13, fontWeight: 600 }} />
                  <button onClick={() => send(text)} disabled={!text.trim()} style={{ ...OSWALD, fontWeight: 900, fontSize: 13, background: text.trim() ? GREEN : '#cfc6ae', color: '#fff', border: '2px solid #000', borderRadius: 9, padding: '0 14px', boxShadow: '2px 2px 0 0 #000', cursor: text.trim() ? 'pointer' : 'default', flexShrink: 0 }}>{tr('Enviar', 'Send')}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export function GameFooter() {
  const { state, dispatch } = useEsc()
  const privatePreview = useOnlinePreview()
  // 🛟 SAÍDA DE EMERGÊNCIA: o rodapé é a ÚNICA coisa que continua na tela mesmo se
  // uma tela renderizar vazia (troca de fase, estado incompleto, save travado). Um
  // link discreto aqui garante que NINGUÉM fica preso num "tela em branco" — volta
  // pro início e limpa o save da partida em andamento (pra o refresh não recarregar
  // o mesmo estado ruim). Só aparece fora do início (lá já é o próprio início).
  const canEscape = state.screen !== 'intro'
  // O onboarding privado já ocupa a tela inteira e tem navegação própria.
  // O rodapé geral embaixo duplicava a saída e quebrava a composição no celular.
  if (privatePreview && state.careerIntent && state.screen === 'setup') return null
  // No lobby, a navegação já está acima. Mesmo apoio compacto da home,
  // sem duplicar contatos, assinatura e saída no rodapé.
  if (state.screen === 'lobby') return (
    <footer className="game-contact-footer ll-support-home-tail">
      <ApoieButton trigger={open => <SupportFooter onOpen={open} />} />
    </footer>
  )
  const goHome = () => {
    if (!window.confirm(tr('Voltar pra tela inicial? Se você travou numa tela em branco, isso resolve. Uma partida em andamento (nesta tela) será encerrada.', 'Back to the home screen? If you got stuck on a blank screen, this fixes it. A match in progress (on this screen) will be ended.'))) return
    try { localStorage.removeItem('esc-solo-inprogress-v1') } catch { /* ignora */ }
    dispatch({ type: 'GO_LOBBY' }) // volta pro início (e libera a vaga se estiver online)
  }
  return (
    <div className="game-contact-footer" style={{ background: '#F4ECD6', borderTop: '2px solid rgba(0,0,0,0.06)' }}>
      <footer className="max-w-xl mx-auto text-center px-4 pt-4 pb-8 space-y-1.5">
        <div className="pb-1"><ApoieButton /></div>
        <p className="text-black/55 text-xs font-bold">{tr('💡 Ideia de jogador novo, sugestão ou achou um bug? Fala comigo:', '💡 New player idea, suggestion or found a bug? Talk to me:')}</p>
        <p className="text-xs font-bold">
          <a href="https://instagram.com/leilaolegendscom" target="_blank" rel="noopener noreferrer" className="text-black/65 underline"><InstaIcon /> @leilaolegendscom</a>
          <span className="text-black/30"> · </span>
          <a href="mailto:contato@leilaolegends.com" className="text-black/65 underline">✉️ contato@leilaolegends.com</a>
        </p>
        {canEscape && (
          <p className="text-[11px] font-bold pt-0.5">
            <button onClick={goHome} className="text-black/45 underline active:opacity-60">{tr('🛟 Travou na tela? Voltar ao início', '🛟 Stuck on a screen? Back to start')}</button>
          </p>
        )}
        <p className="text-black/35 text-[11px] font-semibold pt-1">{tr('Feito por @diegocfonseca', 'Made by @diegocfonseca')}</p>
        <p className="text-black/20 text-[10px] font-semibold">v{__BUILD_ID__}</p>
      </footer>
    </div>
  )
}

export function Box({ children, bg = '#fff', className = '', shadow = 4, style }: { children: React.ReactNode; bg?: string; className?: string; shadow?: number; style?: React.CSSProperties }) {
  return (
    <div className={`border-[3px] border-black rounded-2xl ${className}`} style={{ background: bg, boxShadow: `${shadow}px ${shadow}px 0 0 ${INK}`, ...style }}>
      {children}
    </div>
  )
}

function Btn({ children, onClick, bg = GOLD, disabled = false, className = '' }: { children: React.ReactNode; onClick: () => void; bg?: string; disabled?: boolean; className?: string }) {
  return (
    <motion.button
      whileTap={disabled ? undefined : { x: 2, y: 2 }}
      onClick={onClick}
      disabled={disabled}
      className={`border-[3px] border-black rounded-xl px-4 py-3 font-black uppercase text-sm tracking-wide ${disabled ? 'opacity-40' : ''} ${className}`}
      style={{ backgroundColor: bg, boxShadow: disabled ? 'none' : `4px 4px 0 0 ${INK}`, ...OSWALD }}
    >
      {children}
    </motion.button>
  )
}

// botão do stepper de lance: toque = 1; segurar = repete e ACELERA (pra subir/
// baixar rápido). O primeiro disparo sai no toque (igual clique), então tocar
// e soltar rápido conta 1 só — não atrapalha quem só dá toquinhos.
function HoldButton({ onStep, disabled = false, className = '', style, children }: { onStep: () => void; disabled?: boolean; className?: string; style?: React.CSSProperties; children: React.ReactNode }) {
  const stepRef = useRef(onStep); stepRef.current = onStep
  const t = useRef<number | undefined>(undefined)
  const stop = () => { if (t.current) { clearTimeout(t.current); t.current = undefined } }
  useEffect(() => stop, [])
  const begin = (e: React.PointerEvent) => {
    e.preventDefault()
    if (disabled) return
    stepRef.current() // toque imediato
    let delay = 320 // espera antes de começar a repetir (senão um toque vira vários)
    const run = () => { stepRef.current(); delay = Math.max(38, delay - 26); t.current = window.setTimeout(run, delay) }
    t.current = window.setTimeout(run, delay)
  }
  return (
    <button
      onPointerDown={begin}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      disabled={disabled}
      className={className}
      style={{ touchAction: 'manipulation', userSelect: 'none', ...style }}>
      {children}
    </button>
  )
}

export function Shell({ children, bar, hideExit = false, className = '' }: { children: React.ReactNode; bar?: React.ReactNode; hideExit?: boolean; className?: string }) {
  const previewAccount = useOnlinePreview()
  // O CSS base do estúdio usa texto claro (creme). Como este jogo é todo em
  // fundos claros, forçamos texto escuro por padrão aqui — quem precisa de
  // branco (botões/fundos escuros) já define a cor explicitamente.
  const { state, dispatch, kickPlayer, leaveRoom: leaveRoomHard } = useEsc()
  const [manage, setManage] = useState(false)
  // "sair do jogo" discreto: só durante uma partida (não na home/álbum). Ao
  // sair, o dispatch libera a vaga na sala online (não vira fantasma).
  const inGame = ['setup', 'auction', 'monte', 'cerimonia', 'season', 'liberta', 'end'].includes(state.screen)
  const leave = () => {
    if (window.confirm(tr('Sair do jogo? Você vai perder esta partida.', 'Leave the game? You will lose this match.'))) dispatch({ type: 'GO_LOBBY' })
  }
  // online: dois caminhos. Voltar pro menu MANTÉM a vaga (dá pra voltar pela
  // faixa "Voltar pra partida"). Sair da sala remove a vaga de vez.
  const backToMenu = () => dispatch({ type: 'GO_LOBBY_ONLINE' })
  const leaveRoom = () => {
    const msg = state.isHost
      ? tr('Sair da sala? Você será removido e o comando (host) passa pra outra pessoa da sala. Se você estiver sozinho, a sala é apagada.', 'Leave the room? You will be removed and command (host) passes to someone else in the room. If you are alone, the room is deleted.')
      : tr('Sair da sala? Você será removido desta partida (não dá pra voltar).', 'Leave the room? You will be removed from this match (no way back).')
    if (window.confirm(msg)) leaveRoomHard()
  }
  // só o host, numa partida online, gerencia os técnicos. Lista os HUMANOS (menos
  // ele) e também os RIVAIS CPU (ex-amigos que saíram — auctionRival sem ser humano).
  const canManage = inGame && state.onlineMode === 'online' && state.isHost
  const others = state.managers.filter(m => m.id !== state.youIdx && (m.isHuman || m.auctionRival))
  const kick = (m: Manager) => {
    const msg = m.isHuman
      ? (getLang() === 'en' ? `Remove ${m.teamName}? Becomes a CPU RIVAL: stays in the auction bidding with their team and money.` : `Remover ${m.teamName}? Vira um RIVAL CPU: continua no leilão dando lance com o time e o dinheiro dele.`)
      : (getLang() === 'en' ? `Delete CPU rival ${m.teamName}? They stop bidding at the auction (stay only in the table).` : `Excluir o rival CPU ${m.teamName}? Ele para de dar lance no leilão (fica só na tabela).`)
    if (window.confirm(msg)) kickPlayer(m.id)
  }
  // 🔁 LEILÃO DE RESERVAS (Diego 14/08): cabeçalho do leilão do meio da
  // carreira usava a MESMA cara (fundo branco) do leilão inicial — só um
  // textinho pequeno perto do campo avisava que era outro leilão. Agora o
  // topo fica lilás com um rótulo, pra bater o olho e já saber de cara.
  const isReserveAuction = !!bar && state.reserveAuction
  const reserveLabel = state.seasonNo === 1 ? tr('🔁 Leilão de Reservas', '🔁 Reserves Auction') : tr('🔁 Leilão de Transferências', '🔁 Transfer Auction')
  const privateCareerShell = (previewAccount || publicCareerVisual(state)) && state.sport !== 'basquete' && state.careerOnline
  const privateAuctionShell = privateCareerShell && ['streamIntro', 'auction', 'monte', 'cerimonia', 'reserveList'].includes(state.screen)
  return (
    <div className={`min-h-screen pb-16 palco ${className} ${(previewAccount || publicOnlineVisual(state)) && state.sport !== 'basquete' && ['season', 'liberta'].includes(state.screen) ? 'll25-shell' : ''} ${privateCareerShell ? 'll-career-private-shell' : ''} ${privateAuctionShell ? 'll-career-auction-private' : ''}`} style={{ backgroundColor: CREAM, color: INK }}>
      {bar && (
        <div className="sticky top-0 z-20 border-b-[3px] border-black px-4 py-2.5" style={{ backgroundColor: isReserveAuction ? '#EFE6FE' : '#fff', color: INK }}>
          {isReserveAuction && (
            <p className="text-center text-[10px] font-black uppercase tracking-wide mb-1.5" style={{ ...OSWALD, color: PURPLE }}>{reserveLabel}</p>
          )}
          {bar}
        </div>
      )}
      <div className="max-w-xl mx-auto px-4 pt-5 space-y-5">{children}</div>
      {inGame && !hideExit && (
        <div className="max-w-xl mx-auto px-4 pt-6 pb-4 text-center space-y-2">
          {state.onlineMode === 'online' ? (
            <div className="flex items-center justify-center gap-5">
              <button onClick={backToMenu} className="text-black/35 text-xs font-semibold underline active:opacity-60" title={tr('Sai pro menu mas continua na sala — dá pra voltar', 'Goes to the menu but you stay in the room — you can come back')}>{tr('🏠 voltar pro menu', '🏠 back to menu')}</button>
              <button onClick={leaveRoom} className="text-black/35 text-xs font-semibold underline active:opacity-60" title={tr('Sai da sala de vez (removido)', 'Leaves the room for good (removed)')}>{tr('🚪 sair da sala', '🚪 leave the room')}</button>
            </div>
          ) : (
            <button onClick={leave} className="block mx-auto text-black/60 text-[13px] font-black underline active:opacity-60">{tr('🚪 sair do jogo', '🚪 leave the game')}</button>
          )}
          {canManage && others.length > 0 && (
            <button onClick={() => setManage(v => !v)} className="block mx-auto text-black/60 text-[13px] font-black underline active:opacity-60">
              {manage ? tr('fechar', 'close') : tr('⚙️ gerenciar técnicos', '⚙️ manage managers')}
            </button>
          )}
          {canManage && manage && (
            <div className="max-w-xs mx-auto mt-1 border-2 border-black/15 rounded-xl p-2 space-y-1.5 text-left" style={{ background: '#fff' }}>
              <p className="text-black/40 text-[10px] font-black uppercase tracking-widest px-1">{tr('Remover da partida', 'Remove from the match')}</p>
              {others.map(m => (
                <div key={m.id} className="flex items-center gap-2">
                  <span className="flex-1 min-w-0 truncate text-xs font-bold text-black/70" style={OSWALD}>{m.isHuman ? '' : '🤖 '}{m.teamName}</span>
                  <button onClick={() => kick(m)}
                    className="shrink-0 border border-black/20 rounded-lg px-2 py-1 text-[11px] font-black active:opacity-60"
                    style={{ background: '#F4ECD6', color: '#B23A2A', ...OSWALD }}>{m.isHuman ? tr('remover', 'remove') : tr('excluir', 'delete')}</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── campinho ────────────────────────────────────────────────────────
// linhas top→bottom: ATA · MEI · defesa (LAT-esq · ZAG · ZAG · LAT-dir) · GOL
// 🎨 GRAMADO POR CONTEXTO (mockup aprovado pelo Diego 03/08): 🌱 várzea = terra
// batida marrom (vale a divisão V da carreira nova E o modo várzea do rápido);
// 👑 Série A da carreira nova = verde premium mais vivo; resto = verde de sempre.
// Formato/casinhas/placa de patrocínio NÃO mudam (Diego: "a logo não remova!").
function turfColors(state: EscState): [string, string] {
  if (state.varzea) return ['#8B5E3C', '#7A4E2E'] // 🥅 rápido "sem craques" = peladão
  if (state.escadaOn && state.careerOnline) {
    const y = state.managers[state.youIdx]?.id ?? 0
    const d = (state.careerPlacements?.[`m${y}`] as string | undefined) ?? state.careerDivision ?? 'V'
    if (d === 'V') return ['#8B5E3C', '#7A4E2E'] // 🌱 Várzea: terra batida
    if (d === 'A') return ['#23984F', '#1A7F40'] // 👑 elite: gramado premium
  }
  return [GREEN, '#166332'] // verde tradicional (tudo que já existia fica igual)
}
// 🎽 `manto`: cores do coração do DONO do time (só o próprio usuário vê o seu) —
// faixinha listrada no topo das fichinhas + barrinha de título nas cores.
// Aprovado pelo Diego 09/08 (arte manto-real.png). Sem manto, nada muda.
function Campinho({ m, small = false, bench = false, title, manto, mantoDir = 90, mantoC3 = null, mantoC3Buf = false }: { m: Manager; small?: boolean; bench?: boolean; title?: string; manto?: [string, string] | null; mantoDir?: number; mantoC3?: string | null; mantoC3Buf?: boolean }) {
  const { state } = useEsc()
  const [g1, g2] = turfColors(state)
  // ⚽🅰️ SELOS NO CAMPINHO DO RÁPIDO (Diego 24/08: *"o campinho de gols coloque
  // também no modo online rápido, e as assistências lá também"*). Antes só a
  // carreira mostrava; aqui o boneco vinha sempre pelado. A artilharia do rápido
  // é por NOME+time (não tem id de carta), então é assim que se procura.
  const golsDe = (nome: string) => state.scorers.find(x => x.name === nome && x.teamId === m.id)?.goals ?? 0
  const assistDe = (nome: string) => state.assists?.find(x => x.name === nome && x.teamId === m.id)?.assists ?? 0
  const rows: { key: string; slots: { pos: Sector; card: WonCard | null }[] }[] = useMemo(() => {
    const filled = (p: Sector) => m.squad.filter(c => c.pos === p)
    const buildRow = (p: Sector): { pos: Sector; card: WonCard | null }[] => {
      const have = filled(p)
      const slots = FORMATIONS[m.formation][p]
      // titular: os primeiros `slots` por posição. reserva (banco): os `slots`
      // seguintes — o leilão de reservas mira 22 (2× a formação), então cada
      // posição ganha um espelho no campinho de baixo.
      const start = bench ? slots : 0
      return Array.from({ length: slots }, (_, i) => ({ pos: p, card: have[start + i] ?? null }))
    }
    const lats = buildRow('LAT') // [esquerda, direita] quando existirem
    const zags = buildRow('ZAG')
    const defense: { pos: Sector; card: WonCard | null }[] = []
    if (lats[0]) defense.push(lats[0])
    defense.push(...zags)
    if (lats[1]) defense.push(lats[1])
    return [
      { key: 'ATA', slots: buildRow('ATA') },
      { key: 'MEI', slots: buildRow('MEI') },
      { key: 'DEF', slots: defense },
      { key: 'GOL', slots: buildRow('GOL') },
    ]
  }, [m.squad, m.formation, bench])

  return (
    <div className="border-[3px] border-black rounded-2xl overflow-hidden" style={{ boxShadow: `4px 4px 0 0 ${INK}` }}>
      {title && (
        <div style={{ background: manto ? mantoStripes(manto, 14, mantoDir, mantoC3, mantoC3Buf) : INK, color: '#fff', borderBottom: `3px solid ${INK}`, height: small ? 22 : 26, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="font-black uppercase tracking-wide" style={{ ...OSWALD, fontSize: small ? 10 : 12, textShadow: manto ? '1px 1px 0 rgba(0,0,0,.85)' : undefined }}>{title}</span>
        </div>
      )}
      {/* ⚽🧍 JOGADOR SOLTO NA GRAMA (aprovado 19/08). Antes cada um era uma
          fichinha branca com borda; o Diego cortou: *"o jogador é ele LIVRE"*.
          A peça mora em `jogadorcampo.tsx` e é a MESMA do elenco da carreira —
          um lugar só pra mexer, os dois campinhos mudam juntos.
          A bolinha leva o MANTO do dono; sem manto, bege. */}
      <div className="campinho-field px-3 py-3.5 flex flex-col gap-3" style={{ background: `repeating-linear-gradient(180deg, ${g1} 0 ${small ? 34 : 38}px, ${g2} ${small ? 34 : 38}px ${small ? 68 : 76}px)` }}>
        {rows.map(row => (
          <div key={row.key} className="campinho-row flex justify-center items-end gap-2">
            {row.slots.map((slot, i) => slot.card ? (
              <JogadorNoCampo
                key={i}
                nome={slot.card.name}
                avatarIdentity={{ club: slot.card.club, year: slot.card.year }}
                clube={small ? undefined : slot.card.club}
                ano={small ? undefined : slot.card.year}
                tag={slot.pos}
                gols={golsDe(slot.card.name)}
                assist={assistDe(slot.card.name)}
                alt={small ? 48 : 58}
                fonteNome={small ? 10 : 11}
                mantoCss={manto ? mantoStripes(manto, 6, mantoDir, mantoC3, mantoC3Buf) : null}
              />
            ) : (
              <VagaNoCampo key={i} tag={slot.pos} alt={small ? 48 : 58} />
            ))}
          </div>
        ))}
      </div>
      {/* placa de patrocínio: faixa branca fina num lado do campo (atrás do gol) */}
      <div style={{ background: '#fff', borderTop: `3px solid ${INK}`, height: small ? 26 : 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={VADICO_LOGO} alt="Vadico Veículos" style={{ height: small ? 16 : 19, width: 'auto', display: 'block' }} />
      </div>
    </div>
  )
}

// campinho(s) do SEU time no fluxo do leilão. No leilão de RESERVAS mostra dois
// campinhos empilhados: o banco (o que está sendo montado agora) na frente e os
// titulares logo abaixo. Fora do leilão de reservas, só o time único.
// 🏀 QUADRA DO BIDLEGENDS (aprovada pelo Diego 27/07): meia-quadra de madeira,
// garrafão laranja, logo no centro. Substitui o campinho SÓ no basquete — o
// campinho do futebol não muda em nada. As 5 posições sentam nos 5 setores do
// motor (PG→GOL · SG→LAT · SF→ZAG · PF→MEI · C→ATA); o rótulo sai via posTag.
function NbaCourt({ m }: { m: Manager }) {
  const t = useT()
  const SPOTS: { pos: Sector; x: number; y: number }[] = [
    { pos: 'ATA', x: 62, y: 22 }, // C · pivô (cesta)
    { pos: 'MEI', x: 38, y: 22 }, // PF · ala-pivô
    { pos: 'ZAG', x: 19, y: 50 }, // SF · ala
    { pos: 'LAT', x: 81, y: 50 }, // SG · ala-armador
    { pos: 'GOL', x: 50, y: 84 }, // PG · armador
  ]
  const surname = (n: string) => n.replace(/\s*\(.*?\)\s*/g, ' ').trim().split(' ').pop() || n
  const isProm = (c: Card) => ehPromessa(c) // 💎 pela CARTA (nome|clube|ano), nunca só pelo nome
  const tierOf = (c: Card) => (isProm(c) ? PROMESSA_TIER : (FAME_TIER[c.fame] ?? FAME_TIER[1]))
  const tierEmoji = (c: Card) => (isProm(c) ? '💎' : c.fame >= 5 ? '👑' : c.fame === 4 ? '⭐' : c.fame === 1 ? '🪵' : '🎯')
  return (
    <div className="relative w-full mx-auto" style={{ maxWidth: 320, aspectRatio: '1 / 1.18', border: `3px solid ${INK}`, borderRadius: 14, overflow: 'hidden', boxShadow: `4px 4px 0 0 ${INK}`, background: 'linear-gradient(180deg,#E7BE85,#DFB074 55%,#D7A566)' }}>
      <svg viewBox="0 0 100 118" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <rect x="37" y="3" width="26" height="40" fill="#E8703A" fillOpacity="0.92" />
        <g fill="none" stroke="rgba(20,12,4,.55)" strokeWidth="1.1">
          <rect x="3" y="3" width="94" height="112" rx="3" />
          <rect x="37" y="3" width="26" height="40" />
          <circle cx="50" cy="43" r="12" />
          <path d="M14 3 L14 26 A 36 36 0 0 0 86 26 L86 3" />
          <path d="M30 115 A 20 20 0 0 1 70 115" />
        </g>
        <line x1="42" y1="7" x2="58" y2="7" stroke="rgba(20,12,4,.7)" strokeWidth="1.8" />
        <circle cx="50" cy="10" r="2.6" fill="none" stroke="#C2452F" strokeWidth="1.6" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg,rgba(120,72,20,.16) 0 1.5px,transparent 1.5px 26px)', opacity: .7 }} />
      <div style={{ position: 'absolute', left: '50%', top: '56%', transform: 'translate(-50%,-50%)', width: 118, height: 118, borderRadius: 999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', border: '3px solid rgba(12,12,12,.45)', background: 'rgba(232,112,58,.13)', opacity: .9 }}>
        <span style={{ ...OSWALD, fontWeight: 900, textTransform: 'uppercase', fontSize: 15, lineHeight: .92, color: 'rgba(12,12,12,.8)' }}>Bid<br />Legends</span>
        <span style={{ fontSize: 20, marginTop: 2 }}>🏀</span>
      </div>
      {SPOTS.map(({ pos, x, y }) => {
        const c = m.squad.find(cc => cc.pos === pos && !cc.fake)
        const tt = c ? tierOf(c) : null
        return (
          <div key={pos} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)', width: 82, textAlign: 'center', zIndex: 3 }}>
            <div style={{ border: `3px solid ${INK}`, borderRadius: 11, boxShadow: c ? `2px 3px 0 0 ${INK}` : 'none', padding: '5px 4px 6px', background: c && tt ? tt.grad : 'rgba(255,255,255,.35)', borderStyle: c ? 'solid' : 'dashed' }}>
              <span style={{ ...OSWALD, display: 'inline-block', fontWeight: 900, fontSize: 10, background: c ? INK : 'rgba(0,0,0,.55)', color: '#fff', borderRadius: 6, padding: '1px 7px', marginBottom: 3 }}>{posTag(pos)}</span>
              {c && tt
                ? <><div style={{ ...OSWALD, fontWeight: 900, fontSize: 12.5, lineHeight: 1, color: tt.ink }}>{surname(c.name)}</div><div style={{ fontSize: 11, marginTop: 1 }}>{tierEmoji(c)}</div></>
                : <div style={{ ...OSWALD, fontWeight: 800, fontSize: 11, color: 'rgba(12,12,12,.7)' }}>{t('Vazio', 'Empty')}</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function YourPitch({ small = false }: { small?: boolean }) {
  const { state } = useEsc()
  const you = state.managers[state.youIdx]
  // SEM SPOILER: durante a revelação, os vencedores já estão decididos por
  // dentro — mas o campinho só mostra a carta DEPOIS que o martelo dela bateu
  // na tela. As que ainda vão ser reveladas ficam escondidas.
  // `state.phase` é uma flag global do leilão que NUNCA é resetada ao sair pro
  // monte/cerimônia/temporada — fica travada em 'reveal' pro resto do jogo. Sem
  // travar também em screen==='auction', o último jogador da última revelação
  // ficava escondido pra sempre (Vazio no campinho, mesmo marcando gol na
  // simulação — ele existe no elenco, só não aparecia no desenho).
  // TIEBREAK também esconde: o setor inteiro é resolvido por dentro assim que
  // fecha (inclusive as cartas SEM empate), mas a revelação "oficial" só começa
  // depois que TODOS os empates da rodada acabarem. Sem cobrir a espera do
  // empate, quem ganhou uma carta sem disputa via ela aparecer no campinho na
  // hora — vazando o resultado enquanto os outros ainda decidem o empate deles.
  const revealing = state.screen === 'auction' && (state.phase === 'reveal' || state.phase === 'resq_reveal' || state.phase === 'tiebreak')
  // revealIdx aponta a carta NA TELA agora (martelo já bateu nela) — ela some
  // do "escondido" na hora, pra aparecer no campinho enquanto essa revelação
  // ainda está exibida, antes do avanço automático pra próxima carta. Durante
  // o desempate (revelação ainda não começou), esconde a fila inteira.
  const pendingIds = revealing
    ? new Set((state.revealQueue ?? []).slice(state.phase === 'tiebreak' ? 0 : state.revealIdx + 1).map(it => it.card.id))
    : new Set<string>()
  const shown = pendingIds.size ? { ...you, squad: you.squad.filter(c => !pendingIds.has(c.id)) } : you
  // 🏀 basquete: a QUADRA no lugar do campinho (mesma lógica anti-spoiler acima).
  if (state.sport === 'basquete') return <NbaCourt m={shown} />
  // 🎽 manto do coração: só decora o PRÓPRIO time de quem está vendo
  const manto = meuManto()
  const mantoAng = meuMantoAngle()
  const mantoC3 = meuMantoC3() // 🟢 3ª cor (só do próprio dono, ex.: Desportivo Montreal)
  const mantoC3Buf = meuMantoC3Buffer() // 🚫🔴⚫ amortecedor: pro Arruda, vermelho não pode encostar em preto
  if (state.reserveAuction) {
    // "Reservas" só na 2ª temporada (quando se monta o banco); da 3ª em diante é
    // o mercado, então o campinho de baixo é só o "Banco".
    const benchTitle = state.seasonNo === 2 ? '🔁 Reservas (banco)' : '🔁 Banco'
    return (
      <div className="space-y-2">
        <Campinho m={shown} small={small} bench title={benchTitle} manto={manto} mantoDir={mantoAng} mantoC3={mantoC3} mantoC3Buf={mantoC3Buf} />
        <Campinho m={shown} small={small} title={tr('⭐ Titulares', '⭐ Starting XI')} manto={manto} mantoDir={mantoAng} mantoC3={mantoC3} mantoC3Buf={mantoC3Buf} />
      </div>
    )
  }
  return <Campinho m={shown} small={small} manto={manto} mantoDir={mantoAng} mantoC3={mantoC3} mantoC3Buf={mantoC3Buf} />
}

// `claro` = a carta está sobre fundo ESCURO (hoje só o vermelho do desempate):
// nome e clube em branco. Sem a prop, tudo fica EXATAMENTE como sempre foi — é
// por isso que ela é opcional, pra não encostar nos outros 4 lugares que usam.
function CardFace({ c, big = false, surprise = false, highlight = false, claro = false }: { c: Card; big?: boolean; surprise?: boolean; highlight?: boolean; claro?: boolean }) {
  // 🧢 carta de TÉCNICO no pregão (id 'tec:...'): às cegas — só TEC + nome +
  // clube atual. Categoria/nível/formações se revelam quando ele for SEU.
  if (c.id.startsWith('tec:')) {
    return (
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="border-2 border-black rounded-md px-1.5 py-0.5 text-[9px] font-black leading-none" style={{ background: INK, color: '#fff', ...OSWALD }}>TEC</span>
          <p className={`font-black leading-tight truncate ${big ? 'text-2xl' : 'text-[15px]'}`} style={OSWALD}>{c.name}</p>
        </div>
        <p className={`font-bold text-black/55 ${big ? 'text-sm' : 'text-[10.5px]'}`}>{c.club} · 🎲 revela quando for seu</p>
      </div>
    )
  }
  return (
    <div className="text-left">
      <div className="flex items-center gap-2">
        <span className="border-2 border-black rounded-full px-2 py-0.5 text-[10px] font-black" style={{ backgroundColor: INK, color: '#fff' }}>{posTag(c.pos)}</span>
        {surprise
          // 🙈 ANTI-SPOILER: o nome REAL não vai pro HTML (antes só era borrado por CSS —
          // dava pra ler no "inspecionar"). Placeholder mascarado até a revelação.
          ? <span className={`font-black ${big ? 'text-2xl' : 'text-base'} inline-flex items-center gap-1.5`} style={{ ...OSWALD, color: PURPLE }}>🎁 <span aria-hidden style={{ filter: 'blur(4px)', letterSpacing: 3, userSelect: 'none' }}>? ? ? ?</span></span>
          : <p className={`font-black ${big ? 'text-2xl' : 'text-base'}`} style={{ ...OSWALD, color: highlight ? PURPLE : (claro ? '#fff' : INK) }}>{c.name}{highlight ? ' 🎁' : ''}</p>}
      </div>
      <p className={`${big ? 'text-sm' : 'text-xs'} font-semibold mt-0.5 ${claro ? 'text-white/75' : 'text-black/60'}`}>{c.club} · {c.year}</p>
    </div>
  )
}

// ─── NOVIDADES ───────────────────────────────────────────────────────
// 🗞️ O BANNER ROXO DE NOVIDADES DO TOPO SAIU (Diego 16/08: "tire o banner de
// novidades superior, só deixe os lá de baixo mesmo"). Ele contava a MESMA coisa
// que o `NewsSection` do rodapé já conta, e era alto: ficava no caminho de quem
// abre o jogo pra JOGAR. O código dele está no histórico do git (commit da "home
// nova") — se um dia quiser de volta, dá pra ressuscitar de lá.

// 🆕 RECÉM-CHEGADOS automáticos: puxa as ÚLTIMAS cartas de cada baralho (as novas
// entram no FIM de cada posição no data.ts) com o selo do tier — sem lista à mão,
// reflete sempre as cartas de verdade e fica dividido por baralho.
type Recruit = (typeof CATALOG)[Sector][number]
const RECENT_PER_POS = 4 // últimas N cartas de cada posição, por baralho
function recentArrivals(cat: Record<Sector, Recruit[]>): Recruit[] {
  const out: Recruit[] = []
  for (const pos of SECTORS) { const arr = cat[pos]; for (const c of arr.slice(Math.max(0, arr.length - RECENT_PER_POS)).reverse()) out.push(c) }
  return out
}

// ─── 📢 NOVIDADES (rodapé da home) ───────────────────────────────────
// Reescrita em 16/08 a pedido do Diego: *"as novidades lá embaixo está muito
// exagerado... novidade não deve ficar sempre lá, vai reduzindo aos poucos, tem
// que ser menos que metade do tamanho daquele banner"*.
//
// O que era: **17 avisos** empilhados na mão, alguns de meses atrás, um
// paredão de texto que ninguém lia. Nada saía dali sozinho.
//
// O que é agora, e por que encolhe sozinho:
// • **Novidades do jogo** — vêm de `novidades.ts` (lista única, com data). A
//   tela mostra só as dos últimos 45 dias, no máximo 5. Novidade velha some
//   sozinha, sem ninguém apagar nada. **Bug nunca entra na lista** (regra do
//   Diego — conserto não é novidade).
// • **Mudanças de jogador** — vêm de `novidades-jogadores.ts`, que é GERADO
//   pelo `npm run novidades`: ele compara o baralho com a foto anterior e
//   escreve sozinho quem entrou, quem saiu e quem mudou de nível/categoria.
//   Ninguém escreve isso na mão.
// • **Recém-chegados** — as últimas cartas de cada posição, como já era.
// 📣 versão CURTA das novidades, pra home nova: 3 linhas à mostra e o resto no
// toque. O `NewsSection` inteiro (com baralho e recém-chegados) continua sendo o
// da home de hoje — aqui a gente só não deixa ele virar o maior bloco da tela.
function NovidadesCurtas() {
  const [abertas, setAbertas] = useState(false)
  const todas = novidadesDaVez()
  if (todas.length === 0) return null
  const mostra = abertas ? todas : todas.slice(0, 3)
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-widest text-black/45 mb-3" style={OSWALD}>{tr('📣 O que mudou por aqui', '📣 What changed around here')}</p>
      <Box bg="#fff" className="p-3.5 space-y-3">
        {mostra.map(n => (
          <div key={n.titulo + n.data} className="flex gap-2 items-start">
            <span className="text-[15px] leading-tight">{n.emoji}</span>
            <div className="min-w-0">
              <p className="font-black text-[12.5px] leading-tight" style={OSWALD}>{novTitulo(n)}</p>
              <p className="text-[10.5px] font-semibold text-black/60 leading-snug">{novTexto(n)}</p>
            </div>
          </div>
        ))}
        {todas.length > 3 && (
          <button onClick={() => setAbertas(a => !a)} className="w-full text-center pt-1 text-[11px] font-black text-black/45" style={OSWALD}>
            {abertas ? tr('mostrar menos ›', 'show less ›') : `${tr('ver as', 'see all')} ${todas.length} ›`}
          </button>
        )}
      </Box>
    </div>
  )
}

function NewsSection() {
  const recentBR = recentArrivals(CATALOG).slice(0, 6)
  const recentEU = recentArrivals(CATALOG_EU).slice(0, 4)
  const novidades = novidadesDaVez()
  // só as mudanças de jogador dos últimos 30 dias, no máximo 4 linhas — o
  // resto vira história velha e cai fora sozinho.
  const mud = MUDANCAS_JOGADORES.filter(m => Date.parse(m.data) >= Date.now() - 30 * 86400000).slice(0, 4)
  const frase = (m: typeof mud[number]) => {
    // 🇧🇷 Brasil · 🌍 Europa · 🌎 Resto do Mundo (entrou em 12/09, a pedido do
    // Diego, quando o gerador de novidades passou a olhar o 3º baralho também).
    const bar = m.baralho === 'EU' ? '🌍' : m.baralho === 'MUNDO' ? '🌎' : '🇧🇷'
    if (m.tipo === 'entrou') return `${bar} ${m.nome} ${tr('entrou no baralho', 'joined the deck')}${m.nivel ? ` ${tr('como', 'as')} ${m.nivel}` : ''}`
    if (m.tipo === 'saiu') return `${bar} ${m.nome} ${tr('saiu do baralho', 'left the deck')}`
    if (m.tipo === 'nivel') return `${bar} ${m.nome}: ${m.de} → ${m.para}`
    if (m.tipo === 'virou-folk') return `${bar} ${m.nome} ${tr('virou folclórico 🃏', 'became a folk hero 🃏')}`
    return `${bar} ${m.nome} ${tr('deixou de ser folclórico', 'is no longer a folk hero')}`
  }
  return (
    <Box bg="#F6F2FF" className="p-3.5 space-y-2.5">
      <p className="font-black text-[13px]" style={OSWALD}>{tr('📢 O que mudou por aqui', '📢 What changed around here')}</p>
      <div className="space-y-1">
        {novidades.map(n => (
          <p key={n.titulo + n.data} className="text-[11.5px] font-bold text-black/75 leading-snug">
            {n.emoji} <b>{novTitulo(n)}</b> — {novTexto(n)}
          </p>
        ))}
      </div>
      {mud.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase" style={{ color: PURPLE }}>{tr('🎴 No baralho', '🎴 In the deck')}</p>
          {mud.map((m, i) => <p key={i} className="text-[11.5px] font-bold text-black/75 leading-snug mt-0.5">{frase(m)}</p>)}
        </div>
      )}
      <div>
        <p className="text-[10px] font-black uppercase" style={{ color: PURPLE }}>{tr('🆕 Recém-chegados', '🆕 New arrivals')}</p>
        <p className="text-[11.5px] font-bold text-black/75 mt-0.5 leading-snug">
          <b>🇧🇷</b> {recentBR.map(c => c.name).join(', ')} · <b>🌍</b> {recentEU.map(c => c.name).join(', ')}.
        </p>
      </div>
    </Box>
  )
}

// ─── INTRO ───────────────────────────────────────────────────────────
// carreira offline salva no localStorage — pra oferecer "continuar" na intro
function useResumableSolo() {
  const { dispatch } = useEsc()
  const [saved, setSaved] = useState<EscState | null>(null)
  const readLocal = (): EscState | null => { try { const r = localStorage.getItem('esc-solo-career'); return r ? JSON.parse(r) as EscState : null } catch { return null } }
  useEffect(() => {
    let alive = true
    setSaved(readLocal()) // pinta rápido com o que já está no aparelho
    // 🪜 logado: une TODAS as carreiras da nuvem com as do aparelho (cada save, o
    // seu; segue a conta em qualquer aparelho) e relê a ativa mais nova.
    const pull = async () => { const ok = await syncCareersWithCloud(); if (alive && ok) setSaved(readLocal()) }
    pull()
    // aba parada há tempão? ao voltar o foco pra ela, puxa a conta de novo — assim
    // uma aba aberta há um mês pega a versão mais nova (fecha o furo da aba velha).
    const onFocus = () => { if (typeof document === 'undefined' || !document.hidden) pull() }
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onFocus)
    if (typeof window !== 'undefined') window.addEventListener('focus', onFocus)
    return () => {
      alive = false
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onFocus)
      if (typeof window !== 'undefined') window.removeEventListener('focus', onFocus)
    }
  }, [])
  if (!saved || !saved.careerOnline || !saved.managers?.length) return null
  const you = saved.managers[saved.youIdx ?? 0]
  return {
    seasonNo: saved.seasonNo ?? 1,
    teamName: you?.teamName ?? 'Meu time',
    // ao CONTINUAR, puxa a conta primeiro e abre a versão MAIS NOVA daquele save —
    // nunca a cópia velha de uma aba parada.
    resume: async () => { await syncCareersWithCloud(); dispatch({ type: 'RESUME_CAREER_SOLO', saved: readLocal() ?? saved }) },
    // descartar tira SÓ este save (não mexe nas outras carreiras da conta).
    discard: () => {
      const seed = saved.seed
      try { localStorage.removeItem('esc-solo-career'); localStorage.removeItem('esc-solo-career-at') } catch { /* ignora */ }
      if (typeof seed === 'number') removeCareerFromCloud(seed); else deletePyramidCloud()
      setSaved(null)
    },
  }
}

// 🏀 continuar a CARREIRA do basquete (Street League) — lê a chave própria
// `bl-nba-career`, ISOLADA do futebol. Só local (sem nuvem por enquanto).
function useResumableNbaCareer() {
  const { dispatch } = useEsc()
  const [saved, setSaved] = useState<EscState | null>(null)
  useEffect(() => {
    try { const r = localStorage.getItem('bl-nba-career'); if (r) setSaved(JSON.parse(r) as EscState) } catch { setSaved(null) }
  }, [])
  if (!saved || saved.sport !== 'basquete' || !saved.nbaCareer || !saved.managers?.length) return null
  const you = saved.managers[saved.youIdx ?? 0]
  return {
    seasonNo: saved.seasonNo ?? 1,
    teamName: you?.teamName ?? 'Meu Time',
    resume: () => dispatch({ type: 'RESUME_NBA_CAREER', saved }),
    discard: () => { try { localStorage.removeItem('bl-nba-career'); localStorage.removeItem('bl-nba-career-at') } catch { /* ignora */ } setSaved(null) },
  }
}

// (O banner de "continuar carreira offline" da pirâmide vive inline na HOME —
// EscIntro, no bloco {solo && ...}. Não existe mais versão pra tela de setup: lá
// ele criava um loop quando o save estava travado no próprio setup.)

// "jogou há X" curtinho a partir de um timestamp
function agoLabel(at: number): string {
  const s = Math.max(0, Date.now() - at) / 1000
  const en = getLang() === 'en'
  if (s < 3600) return en ? `${Math.max(1, Math.round(s / 60))} min ago` : `há ${Math.max(1, Math.round(s / 60))} min`
  if (s < 86400) return en ? `${Math.round(s / 3600)} h ago` : `há ${Math.round(s / 3600)} h`
  const d = Math.round(s / 86400)
  if (en) return d < 7 ? `${d} day${d > 1 ? 's' : ''} ago` : `${Math.round(d / 7)} wk ago`
  return d < 7 ? `há ${d} dia${d > 1 ? 's' : ''}` : `há ${Math.round(d / 7)} sem`
}
const DIV_COLOR: Record<string, string> = { A: '#E7A21F', B: '#8C97A3', C: '#C77B3C', D: '#1E7A3D' }
// 🪜 MINHAS CARREIRAS — lista de todos os saves (ativa + arquivo). Começar uma nova
// nunca apaga as outras; "Continuar" na home aponta pro último jogado. Excluir é na mão.
function MinhasCarreiras({ onClose, onNew }: { onClose: () => void; onNew: () => void }) {
  const { dispatch } = useEsc()
  const [list, setList] = useState<{ slot: CareerSlot; active: boolean }[]>(() => listAllCareers())
  // confirmação de apagar é DENTRO do jogo (dois toques) — window.confirm é
  // bloqueado no navegador do WhatsApp/Instagram e o 🗑️ "não fazia nada" pra galera.
  const [confirmKey, setConfirmKey] = useState<string | null>(null)
  const open = (slot: CareerSlot, active: boolean) => {
    const save = active ? slot.save : (activateCareerSlot(slot.save.seed) ?? slot.save)
    dispatch({ type: 'RESUME_CAREER_SOLO', saved: save })
  }
  const del = (slot: CareerSlot) => {
    deleteCareerSlot(slot.save.seed); setConfirmKey(null); setList(listAllCareers())
  }
  const t = useT() // 🌐 BR/EN
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 99998, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '18px 12px' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, background: '#F4ECD6', border: `3px solid ${INK}`, borderRadius: 18, boxShadow: `5px 5px 0 0 ${INK}`, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <p style={{ flex: 1, fontWeight: 900, fontSize: 18, ...OSWALD, margin: 0 }}>{t('🪜 Minhas Carreiras', '🪜 My Careers')}</p>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(0,0,0,.5)', border: `2px solid ${INK}`, borderRadius: 999, padding: '2px 8px' }}>{list.length} / {careerSlotLimit(list.length)}</span>
          <button onClick={onClose} aria-label={t('Fechar', 'Close')} style={{ fontSize: 18, fontWeight: 900, border: 'none', background: 'transparent', cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>
        {list.length === 0 && <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#5a5647', padding: '10px 0 14px' }}>{t('Nenhuma carreira ainda. Comece uma! 👇', 'No careers yet. Start one! 👇')}</p>}
        {list.map(({ slot, active }, i) => {
          const you = slot.save.managers?.[slot.save.youIdx ?? 0]
          const div = (slot.save.careerPlacements?.['m' + (you?.id ?? 0)] as string) ?? slot.save.careerDivision ?? 'D'
          const caixa = slot.save.careerCoins?.[you?.id ?? 0] ?? 0
          const tn = you?.teamName ?? you?.name ?? t('Meu time', 'My team')
          return (
            <div key={String(slot.save.seed ?? i)} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: `2.5px solid ${INK}`, borderLeft: `7px solid ${DIV_COLOR[div] ?? '#8B8168'}`, borderRadius: 12, padding: '10px 11px', marginBottom: 9, marginTop: active ? 10 : 0, boxShadow: `3px 3px 0 0 ${INK}` }}>
              {active && <span style={{ position: 'absolute', top: -9, left: 12, background: GOLD, color: INK, fontSize: 9, fontWeight: 900, textTransform: 'uppercase', padding: '2px 7px', borderRadius: 6, border: `2px solid ${INK}`, ...OSWALD }}>{t('▶ última jogada', '▶ last played')}</span>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 900, fontSize: 15.5, ...OSWALD, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tn}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 9.5, fontWeight: 900, color: '#fff', background: DIV_COLOR[div] ?? '#8B8168', padding: '2px 7px', borderRadius: 6, ...OSWALD }}>SÉRIE {div}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#4a4740', ...OSWALD }}>{t('Temporada', 'Season')} {slot.save.seasonNo ?? 1}</span>
                </div>
                <span style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: '#8B8168', marginTop: 3 }}>💰 {t('caixa', 'till')} {caixa} · {t('jogou', 'played')} {agoLabel(slot.at)}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
                <button onClick={() => open(slot, active)} style={{ background: GREEN, color: '#fff', border: `2px solid ${INK}`, borderRadius: 9, padding: '7px 11px', fontWeight: 900, fontSize: 12.5, ...OSWALD, boxShadow: `2px 2px 0 0 ${INK}`, cursor: 'pointer', whiteSpace: 'nowrap' }}>{t('▶️ Continuar', '▶️ Continue')}</button>
                {confirmKey === String(slot.save.seed ?? i) ? (
                  <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                    <button onClick={() => del(slot)} style={{ background: '#C2452F', color: '#fff', border: `2px solid ${INK}`, borderRadius: 9, padding: '6px 9px', fontWeight: 900, fontSize: 11, ...OSWALD, boxShadow: `2px 2px 0 0 ${INK}`, cursor: 'pointer', whiteSpace: 'nowrap' }}>{t('🗑️ Apagar', '🗑️ Delete')}</button>
                    <button onClick={() => setConfirmKey(null)} aria-label={t('Cancelar', 'Cancel')} style={{ background: 'transparent', border: 'none', fontSize: 15, fontWeight: 900, cursor: 'pointer', opacity: 0.6, lineHeight: 1 }}>✕</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmKey(String(slot.save.seed ?? i))} aria-label={t('Apagar', 'Delete')} style={{ background: 'transparent', border: 'none', fontSize: 14, cursor: 'pointer', opacity: 0.7 }}>🗑️</button>
                )}
              </div>
            </div>
          )
        })}
        {(() => { const lim = careerSlotLimit(list.length); const cheio = list.length >= lim; return (<>
        <button onClick={onNew} disabled={cheio} style={{ width: '100%', background: cheio ? '#d8cfb5' : '#fff', border: `2.5px dashed ${INK}`, borderRadius: 12, padding: 12, fontWeight: 900, fontSize: 14, ...OSWALD, cursor: cheio ? 'default' : 'pointer', color: INK }}>{t('➕ Começar nova carreira', '➕ Start a new career')}{cheio ? ` (${t('fichas cheias', 'slots full')} ${list.length}/${lim})` : ''}</button>
        {cheio && <p style={{ fontSize: 10.5, fontWeight: 800, color: 'rgba(0,0,0,.55)', margin: '6px 2px 0', lineHeight: 1.45 }}>{t('🔒 Suas fichas de carreira estão cheias — apague uma carreira que não usa mais, ou ganhe fichas apoiando: ⭐ Craque tem 4 · 👑 Lenda 6 · 🖋️ Batismo 8. (Quem já tinha mais que o limite não perde nada.)', '🔒 Your career slots are full — delete a career you no longer use, or earn slots by supporting: ⭐ Star has 4 · 👑 Legend 6 · 🖋️ Named club 8. (Whoever already had more than the limit loses nothing.)')}</p>}
      </>) })()}
        <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,.45)', textAlign: 'center', margin: '9px 2px 0' }}>{t('Começar uma nova NÃO apaga as outras. Trocar de save também não — só o 🗑️ apaga.', 'Starting a new one does NOT delete the others. Switching saves doesn\'t either — only 🗑️ deletes.')}</p>
      </div>
    </div>
  )
}

// ─── SELETOR DE ESPORTE ⚽/🏀 (topo da home) ───────────────────────────
// Abas aprovadas com o Diego. O futebol (ao vivo) segue no ⚽; o 🏀 abre o
// BidLegends (basquete). A escolha fica gravada no aparelho (ver sport.ts).
// COR ATIVA: verde do futebol · telha/vermelho do basquete — ambas da paleta
// oficial (nada de cor nova inventada).
function SportTabs() {
  const [sport, setSport] = useSport()
  const t = useT()
  const tab = (s: Sport, emoji: string, label: string, activeBg: string) => {
    const active = sport === s
    return (
      <button onClick={() => setSport(s)} aria-pressed={active}
        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border-[3px] border-black py-2.5 active:translate-y-0.5"
        style={{ background: active ? activeBg : '#fff', color: active ? '#fff' : 'rgba(0,0,0,.4)', boxShadow: active ? `3px 3px 0 0 ${INK}` : 'none', fontWeight: 900, textTransform: 'uppercase', letterSpacing: .5, fontSize: 14, ...OSWALD }}>
        <span style={{ fontSize: 19, lineHeight: 1 }}>{emoji}</span>{label}
      </button>
    )
  }
  return (
    <div className="flex gap-2 pt-3">
      {tab('futebol', '⚽', t('Futebol', 'Soccer'), GREEN)}
      {tab('basquete', '🏀', t('Basquete', 'Basketball'), '#C2452F')}
    </div>
  )
}

// 🌐 BOTÃO BR/EN — canto direito do header do BidLegends (regra do Diego). Só
// aparece no basquete; o futebol não tem idioma pra trocar. Segmento compacto.
function LangToggle() {
  const [lang, setLang] = useLang()
  const seg = (l: 'pt' | 'en', flag: string, code: string) => {
    const on = lang === l
    return (
      <button onClick={() => setLang(l)} aria-pressed={on}
        className="flex items-center gap-1 rounded-lg active:translate-y-0.5"
        style={{ padding: '3px 8px', background: on ? INK : 'transparent', color: on ? '#fff' : 'rgba(0,0,0,.5)', fontWeight: 900, fontSize: 12, ...OSWALD }}>
        <span style={{ fontSize: 13, lineHeight: 1 }}>{flag}</span>{code}
      </button>
    )
  }
  return (
    <div className="inline-flex items-center gap-0.5 rounded-xl border-2 border-black bg-white" style={{ padding: 2, boxShadow: `2px 2px 0 0 ${INK}` }}>
      {seg('pt', '🇧🇷', 'BR')}
      {seg('en', '🇺🇸', 'EN')}
    </div>
  )
}

// ─── HOME DO BIDLEGENDS (basquete) — Fase 1 ────────────────────────────
// Mesma cara do jogo (creme/bordas/Oswald), só troca o conteúdo. Como o
// basquete ainda está em construção, esta é a tela "chegando": apresenta a
// marca, o conceito (pirâmide + quinteto) e deixa claro que o FUTEBOL segue
// 100% no ar na aba ⚽. Zero risco pro jogo ao vivo.
function BidLegendsHome() {
  const t = useT()
  const { dispatch } = useEsc()
  const nbaSolo = useResumableNbaCareer() // 🏀 carreira do basquete salva (continuar)
  const PYR = [
    ['🛝', 'STREET LEAGUE', t('A base. 20 times, pontos corridos. Sobem 4, ninguém cai.', 'The base. 20 teams, round-robin. Top 4 go up, nobody drops.')],
    ['🔷', 'G LEAGUE', t('Leste × Oeste, 82 jogos, playoffs. Sobe quem vai longe.', 'East × West, 82 games, playoffs. Go far and move up.')],
    ['💍', 'NBA', t('O topo. Chegue às Finals e leve o anel pro seu álbum.', 'The top. Reach the Finals and take the ring to your album.')],
  ] as [string, string, string][]
  return (
    <Shell>
      {/* header: botão de idioma BR/EN no canto direito (só o BidLegends tem) */}
      <div className="flex justify-end pt-2"><LangToggle /></div>
      <SportTabs />
      {/* 🏀 carreira do basquete em andamento — continuar de onde parou (salvo local) */}
      {nbaSolo && (
        <div className="rounded-2xl border-4 border-black p-3 mt-2 space-y-2.5" style={{ background: PURPLE, boxShadow: `4px 4px 0 0 ${INK}` }}>
          <p className="font-black text-sm text-white leading-tight" style={OSWALD}>
            🛝 {t('Carreira em andamento', 'Career in progress')}<br />
            <span className="opacity-80 text-xs">{nbaSolo.teamName} · {t('Temporada', 'Season')} {nbaSolo.seasonNo}</span>
          </p>
          <button onClick={nbaSolo.resume} className="w-full rounded-xl border-2 border-black bg-white text-black font-black text-sm py-2.5 active:translate-y-0.5" style={OSWALD}>
            ▶️ {t('Continuar carreira', 'Continue career')} ({nbaSolo.teamName})
          </button>
          <button onClick={nbaSolo.discard} className="w-full rounded-xl border-2 border-black font-black text-xs py-2 active:translate-y-0.5" style={{ background: '#E8503A', color: '#fff', ...OSWALD }}>
            🗑️ {t('Largar e começar outra', 'Drop and start a new one')}
          </button>
        </div>
      )}
      <div className="text-center pt-6">
        <span className="inline-block border-2 border-black rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide" style={{ backgroundColor: GOLD, boxShadow: `3px 3px 0 0 ${INK}` }}>
          🏀 {t('Leilão às cegas de lendas', 'Blind auction of legends')}
        </span>
        <h1 className="font-black text-5xl mt-4 leading-none" style={OSWALD}>BIDLEGENDS</h1>
        <div className="mx-auto mt-2" style={{ width: 150, height: 10, borderRadius: 5, background: '#C2452F', border: `2px solid ${INK}`, boxShadow: `3px 3px 0 0 ${INK}` }} />
        <p className="mt-3 font-semibold text-black/60 max-w-sm mx-auto">
          {t('O leilão cego das lendas do ', 'The blind auction of ')}<b>{t('basquete', 'basketball')}</b>{t('. Monte seu quinteto no pregão, suba a pirâmide da NBA e colecione os craques no seu álbum.', ' legends. Draft your starting five, climb the NBA pyramid and collect the stars in your album.')}
        </p>
      </div>
      {/* vitrine: as MESMAS cartas do futebol, só que de basquete (mesmo visual) */}
      <div className="grid grid-cols-2 gap-3 grade-cartas">
        <div style={{ transform: 'rotate(-1.5deg)' }}><CollectibleCard name="Michael Jordan" club="Bulls" year={1996} pos="ALA" fame={5} showBio bio={t('Melhor de todos os tempos. Seis anéis, seis MVPs de Finals. Fechou a carreira do jeito que começou: por cima.', 'The greatest of all time. Six rings, six Finals MVPs. Ended his career the way it began: on top.')} /></div>
        <div style={{ transform: 'rotate(1.5deg)' }}><CollectibleCard name="Dwyane Wade" club="Heat" year={2006} pos="ARM" fame={4} showBio bio={t('Flash. Carregou o Heat ao título em 2006 numa das melhores finais individuais da história.', 'Flash. Carried the Heat to the 2006 title in one of the greatest individual Finals ever.')} /></div>
        <div style={{ transform: 'rotate(1.5deg)' }}><CollectibleCard name="Victor Wembanyama" club="Spurs" year={2024} pos="PIVÔ" fame={3} promessa showBio bio={t('O alienígena. 2,24m que enterra, cravou e acerta de três. O futuro chegou cedo.', 'The alien. 7-foot-4 that dunks and drains threes. The future came early.')} /></div>
        <div style={{ transform: 'rotate(-1.5deg)' }}><CollectibleCard name="JaVale McGee" club="Wizards" year={2011} pos="PIVÔ" fame={2} folk showBio bio={t("Rei do Shaqtin' a Fool. Errou uns, acertou anéis. Folclore puro do garrafão.", "King of Shaqtin' a Fool. Missed a few, won rings. Pure paint folklore.")} /></div>
      </div>
      <p className="text-center text-[11px] font-black uppercase tracking-wide text-black/45" style={OSWALD}>{t('👑 lenda · ⭐ craque · 💎 promessa · 🃏 folclórico — colecione todos', '👑 legend · ⭐ star · 💎 prospect · 🃏 cult hero — collect them all')}</p>
      {/* ⚡ PARTIDA RÁPIDA (vs CPU) — pregão cego do basquete, MESMO motor do
          futebol. Em teste (só o Diego vê). 3 rivais (franquias da NBA). */}
      <Btn onClick={() => dispatch({ type: 'START_NBA', teamName: t('Meu Time', 'My Team'), rivals: 3 })} className="w-full text-lg">
        ⚡ {t('PARTIDA RÁPIDA (VS CPU)', 'QUICK GAME (VS CPU)')}
      </Btn>
      <p className="text-center text-[11px] font-semibold text-black/45 -mt-2">{t('Pregão cego do quinteto (5) — em teste 🔧', 'Blind auction for your five (5) — testing 🔧')}</p>
      {/* 🛝 CARREIRA · STREET LEAGUE — a base da pirâmide, MESMO motor do futebol.
          Rotação de 10 (2 por posição) e liga cheia de pontos corridos. Em teste. */}
      <motion.div className="rounded-xl"
        animate={{ boxShadow: ['0 0 0 0 rgba(124,58,237,0)', '0 0 16px 4px rgba(124,58,237,0.7)', '0 0 0 0 rgba(124,58,237,0)'] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}>
        <Btn onClick={() => dispatch({ type: 'START_NBA_CAREER', teamName: t('Meu Time', 'My Team') })} className="w-full text-lg" bg={PURPLE}>
          <span className="text-white">🛝 {t('CARREIRA · STREET LEAGUE', 'CAREER · STREET LEAGUE')} <span className="text-yellow-300">(new)</span></span>
        </Btn>
      </motion.div>
      <p className="text-center text-[11px] font-semibold text-black/45 -mt-2">{t('A base: quinteto (5), liga de 20 — cresce nas reservas 🔧 em construção', 'The base: starting five (5), 20-team league — grows in the reserve auction 🔧 building')}</p>
      {/* aviso "chegando" — honesto, sem prometer o que ainda não tem */}
      <div className="border-[3px] border-black rounded-2xl p-4 text-center" style={{ background: '#fff', boxShadow: `4px 4px 0 0 ${INK}` }}>
        <div className="text-3xl">🚧</div>
        <p className="font-black text-lg uppercase mt-1" style={OSWALD}>{t('Chegando ao BidLegends', 'Coming to BidLegends')}</p>
        <p className="text-[13px] font-semibold text-black/60 mt-1 leading-snug">
          {t('O basquete está em construção — o mesmo motor do Leilão Legends, agora com o quinteto e a pirâmide da NBA. Quer jogar HOJE? Toca em ', 'Basketball is under construction — the same engine as Leilão Legends, now with the starting five and the NBA pyramid. Want to play TODAY? Tap ')}<b>{t('⚽ Futebol', '⚽ Soccer')}</b>{t(' aí em cima: o jogo completo está no ar.', ' up top: the full game is live.')}
        </p>
      </div>
      {/* a pirâmide (conceito) */}
      <div className="space-y-2.5">
        <p className="text-center text-[11px] font-black uppercase tracking-widest text-black/40" style={OSWALD}>{t('A pirâmide do basquete', 'The basketball pyramid')}</p>
        {PYR.map(([ic, ti, d]) => (
          <div key={ti} className="flex items-center gap-3 border-[3px] border-black rounded-xl bg-white p-3" style={{ boxShadow: `4px 4px 0 0 ${INK}` }}>
            <div className="text-2xl shrink-0">{ic}</div>
            <div>
              <p className="font-black text-sm uppercase" style={OSWALD}>{ti}</p>
              <p className="text-[11px] font-semibold text-black/60 leading-snug">{d}</p>
            </div>
          </div>
        ))}
      </div>
      {/* como funciona — espelha os 4 cartões do futebol, adaptado ao basquete */}
      <div className="grid grid-cols-2 gap-2.5">
        {([['🏀', t('O Pregão', 'The Auction'), t('5 rodadas de leilão cego: armador, ala-armador, ala, ala-pivô e pivô. Ninguém vê o lance de ninguém.', '5 blind auction rounds: PG, SG, SF, PF and C. No one sees anyone else’s bid.')],
           ['🎭', t('Níveis ocultos', 'Hidden ratings'), t('Você aposta no nome. O nível só abre na Cerimônia — e todo craque tem noite boa e noite ruim.', 'You bet on the name. The rating only opens at the Ceremony — and every star has good and bad nights.')],
           ['🪜', t('Pirâmide', 'The Pyramid'), t('Da Street League à NBA. Cada anel vira uma carta no seu álbum.', 'From the Street League to the NBA. Each ring becomes a card in your album.')],
           ['💎', t('Vale o auge', 'Peak counts'), t('O nível é o auge do craque naquele ano/franquia (Jordan 1996 lenda; Wade 2006 craque).', 'The rating is the star’s peak that year/franchise (Jordan 1996 legend; Wade 2006 star).')]] as [string, string, string][]).map(([ic, ti, d]) => (
          <div key={ti} className="border-[3px] border-black rounded-xl bg-white p-3" style={{ boxShadow: `4px 4px 0 0 ${INK}` }}>
            <div className="text-xl">{ic}</div>
            <p className="font-black text-[13px] uppercase mt-1.5" style={OSWALD}>{ti}</p>
            <p className="text-[11px] font-semibold text-black/60 mt-0.5 leading-snug">{d}</p>
          </div>
        ))}
      </div>
    </Shell>
  )
}
// 🗑️ A TELA CHEIA DE LOGIN DA CARREIRA SAIU (Diego 16/08, plano-crescimento §1).
// Ela ocupava a tela inteira e o botão de entrar disparava GO_LOBBY_ONLINE —
// jogava a pessoa no lobby das salas online e, depois de criar a conta, NADA a
// trazia de volta pra carreira. Agora quem faz esse papel é a `JanelaConta`
// (conta.tsx): abre POR CIMA, com o fundo atrás, e ao terminar retoma
// exatamente a ação que a pessoa tinha pedido (ver `startCareer`).

// 🔳 quadradinho de ícone da home (álbum · ranking · manual · apoiar). Mesma
// borda grossa e sombra dura dos botões — só que pequeno, porque isso é coisa
// de VER, não de jogar (Diego 16/08, plano §4).
function HomeIconTile({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="border-[3px] border-black rounded-xl bg-white py-2 active:translate-y-0.5 flex flex-col items-center justify-center gap-0.5"
      style={{ boxShadow: `3px 3px 0 0 ${INK}` }}>
      <span className="text-xl leading-none">{icon}</span>
      <span className="text-[10.5px] font-black uppercase tracking-wide" style={OSWALD}>{label}</span>
    </button>
  )
}

// ─── 🏠 HOME NOVA (só a conta do Diego, 20/08) ───────────────────────────────
// Desenho aprovado no mockup `scripts/mockup-home-v2.mjs`. A ideia, em uma frase:
// **calma vem de espaço, não de tirar coisa**. Scroll longo, um assunto por
// "andar", tudo ABERTO — e um MENU FIXO no rodapé (ideia do Diego), que é o que
// destrava o resto: se navegar não depende de rolar de volta, o scroll pode ser
// comprido e nada precisa se esconder atrás de clique.
//
// Ordem dos andares e o porquê de cada um:
//   1 · o que é o jogo (uma frase, só)
//   2 · as CARTAS deitadas — são o motivo de jogar, ficam no alto (o Diego cortou
//       minha 1ª versão, que tinha tirado elas dali, e ele estava certo)
//   3 · os TRÊS modos, com a CARREIRA grande (é onde ele quer a galera: 118 mil
//       temporadas jogadas, e é o modo onde o patrocinador aparece toda temporada)
//   4 · continuar carreira / voltar pra sala (só pra quem tem)
//   5 · COMO FUNCIONA UMA PARTIDA — aberto, mas lá embaixo. Não está na cara
//       (quem quer jogar já apertou em cima) nem escondido (quem rolou até aqui
//       quer entender). Era a queixa dele: "as pessoas não entendem o leilão,
//       as moedas, a disputa, e que depois tem uma simulação".
//   6 · novidades · 7 · apoiar (a história de quem faz o jogo mora DENTRO dele)
// ❓ DÚVIDAS — a terceira seção do Manual (Diego 20/08, inspirado no FAQ que ele
// mandou). Ele cortou a minha primeira lista: *"as respostas estão muito fracas"*
// — e estava certo, eram linhas soltas. Aqui cada resposta diz O QUE FAZER, com
// o número e o caminho.
//
// 🔢 A ORDEM É POR GENTE AFETADA, medido no banco em 20/08 — não por palpite:
//   · 2.832 contas (38% de todas) NUNCA ganharam uma carta → a nº1 do jogo;
//   · 4.474 contas (59%) nunca abriram uma carreira;
//   · 192 carreiras estão com a caixa negativa hoje;
//   · 28 clubes batizados — e "como o fulano tem escudo?" é a que mais leva
//     alguém a apoiar, por isso as duas do batismo abrem a lista (pedido dele).
// ⚠️ Toda resposta aqui é conferida NO CÓDIGO. Se uma regra mudar, esta lista
// muda junto — FAQ que mente é pior que FAQ nenhum.
function Duvidas() {
  const [aberta, setAberta] = useState<number | null>(null)
  const t = useT() // 🌐 BR/EN
  // 📋 A ORDEM É A QUE O DIEGO DITOU (20/08): sala online → carta → escudo e
  // mascote → nome pra todo mundo ver → planos → patrocínio. Ele cortou a minha
  // primeira versão duas vezes ("as respostas estão muito fracas", "não sei se
  // está claro") — então aqui a pergunta é a que a pessoa faria em voz alta, e a
  // resposta diz o NÚMERO e o CAMINHO, não uma frase bonita.
  const QA: [string, React.ReactNode][] = getLang() === 'en' ? [
    ['How many people fit in an online room?', <>
      <b>Up to 20 managers</b> in the same auction.<br /><br />
      Tap <b>👥 With friends online</b>, create the room and the game gives you a <b>code</b>. Send the code in the chat: whoever gets it opens the same site, types the code and lands in your room.<br /><br />
      Nobody needs to download anything or create an account to join. You can start with <b>2 people</b> — no need to fill it up.
    </>],
    ['How do I win the album cards?', <>
      <b>Cards are a champion\'s prize.</b> You don\'t earn them by playing, you earn them by <b>winning</b>.<br /><br />
      • <b>League</b> champion → 1 card.<br />
      • <b>Cup of 8</b> (or Libertadores) champion → 1 more, separately.<br /><br />
      Same against the CPU and online.<br /><br />
      ⚠️ <b>Without an account, the card isn\'t kept.</b> Play as much as you like, but the album stays empty. If you were champion before creating the account, those don\'t come back — but from then on they stay.
    </>],
    ['How do I get a crest and a mascot of my own?', <>
      It\'s the <b>🖋️ Club naming</b>. You pick the name, send whatever art you like (or we draw it), and the club gets its <b>crest, mascot, kit and stadium name</b> — made just for it.<br /><br />
      <b>Where:</b> 💛 Support → 🖋️ Batismo.<br />
      <b>How much:</b> R$ 59.90 (Série B, C, D or Várzea) · R$ 69.90 (👑 Série A).<br />
      <b>How:</b> pay via Pix, send the receipt and the name by DM. We confirm <b>within 24h</b> and it enters the next update.<br /><br />
      The name is <b>reserved in 4 forms</b> (with and without FC/EC, upper or lower case) — nobody else can use it.
    </>],
    ['How do I make my team show up for everyone in the game?', <>
      It\'s the same <b>Club naming</b> — and that\'s the best part of it.<br /><br />
      Your club <b>enters a real division</b> and exists for <b>every Leilão Legends player</b>, not just you. Anyone can land in the same table as it, see your crest, your kit, and your mascot celebrating the goal.<br /><br />
      <b>Série A costs more</b> (R$ 69.90) because it\'s the elite of the game: they are the clubs that show up in the <b>online quick match</b> and the rivals everyone faces in the career. It\'s the club that appears the most.
    </>],
    ['What are the support plans?', <>
      There are <b>4</b>, and all the details are in the <b>💛 Support</b> button:<br /><br />
      🎫 <b>Sócio Legends — R$ 9.90 a month.</b> The only monthly one.<br />
      ⭐ <b>Craque (Star) — R$ 19.90, one time.</b><br />
      👑 <b>Lenda (Legend) — R$ 39.90, one time.</b> Gets <b>everything from Star</b> and more.<br />
      🖋️ <b>Batismo (Club naming) — from R$ 59.90, one time.</b> Gets <b>everything from Legend</b>, plus the club with crest, mascot, kit and stadium.<br /><br />
      No plan gives an advantage on the pitch — <b>the game is the same for everyone</b>. What changes is colour, shine, story and perks.
    </>],
    ['How do I sponsor my company in the game?', <>
      Your brand can become <b>part of the game</b>, not a banner: at the start of every season each manager <b>picks a sponsor</b> for the club and plays the whole season for its target.<br /><br />
      Real brands are already in there today, chosen by the players.<br /><br />
      <b>Send an e-mail to <span style={{ color: PURPLE }}>contato@leilaolegends.com</span></b> and we reply with the game\'s numbers and formats. If you prefer, DM <b>@leilaolegendscom</b>.
    </>],
    ['Do I need an account to play?', <>
      <b>No.</b> You can play everything without signing up: quick match, room with friends, and even the <b>whole first season of the career</b>.<br /><br />
      With an account you <b>win and keep the cards</b>, show up in the ranking, and the career is saved in the cloud — switched phones, it goes with you.<br /><br />
      Without an account, the save lives <b>only on that device</b>. Cleared the browser, lost it.
    </>],
    ['My club is in the red. Now what?', <>
      <b>It\'s not a bug</b> — and there is a way out.<br /><br />
      It happens when the <b>payroll</b> (or a contract renewal) gets bigger than your till. While negative you <b>can\'t sign anyone</b>, but you keep playing normally.<br /><br />
      To get out: <b>sell a player</b> at the auction, grab a free signing <b>from the Pile</b>, and keep earning prizes and gate money. Back to zero, the market unlocks on its own.
    </>],
    ['Why can\'t I see a player\'s level before bidding?', <>
      <b>It\'s not a bug — it\'s the game.</b> The auction is <b>blind</b>: you only see the name and bet on what you think that name is worth.<br /><br />
      The level only opens at the <b>Reveal Ceremony</b>, when all envelopes open together. That\'s where you find out whether you paid 30 coins for a star or a donkey — and everyone finds out at the same time.
    </>],
    ['I switched phones and my career is gone', <>
      If you have an <b>account</b>, it\'s not gone: sign in with the same e-mail on the new device and the career <b>downloads from the cloud</b> on its own.<br /><br />
      If you played <b>without an account</b>, the save stayed only in that browser — then there is no way to recover it. It\'s the nº 1 reason to create the account before investing many seasons.<br /><br />
      Got more than one career? Tap <b>🪜 My careers</b> on the home screen to switch between them.
    </>],
  ] : [
    ['Quantas pessoas cabem numa sala online?', <>
      <b>Até 20 técnicos</b> no mesmo pregão.<br /><br />
      Você toca em <b>👥 Com amigos online</b>, cria a sala e o jogo te dá um <b>código</b>. Manda o código no zap: quem receber abre o mesmo site, digita o código e cai na sua sala.<br /><br />
      Ninguém precisa baixar nada nem criar conta pra entrar. Dá pra começar com <b>2 pessoas</b> — não precisa encher.
    </>],
    ['Como eu ganho as cartas do álbum?', <>
      <b>Carta é prêmio de campeão.</b> Não ganha por jogar, ganha por <b>ganhar</b>.<br /><br />
      • Campeão da <b>liga</b> → 1 carta.<br />
      • Campeão da <b>Copa dos 8</b> (ou da Libertadores) → mais 1, à parte.<br /><br />
      Vale igual contra a CPU e no online.<br /><br />
      ⚠️ <b>Sem conta criada, a carta não é guardada.</b> Você joga à vontade, mas o álbum fica vazio. Se você já foi campeão antes de criar a conta, aquelas não voltam — mas da próxima vez ficam.
    </>],
    ['Como faço pra ter escudo e mascote do meu jeito?', <>
      É o <b>🖋️ Batismo do clube</b>. Você escolhe o nome, manda a arte que quiser (ou a gente desenha), e o clube passa a ter <b>escudo, mascote, manto e nome de estádio</b> — feitos só pra ele.<br /><br />
      <b>Onde:</b> 💛 Apoiar → 🖋️ Batismo.<br />
      <b>Quanto:</b> R$ 59,90 (Série B, C, D ou Várzea) · R$ 69,90 (👑 Série A).<br />
      <b>Como:</b> paga no Pix, manda o comprovante e o nome no direct. A gente confirma <b>em até 24h</b> e ele entra na atualização seguinte.<br /><br />
      O nome fica <b>reservado em 4 formas</b> (com e sem FC/EC, maiúscula ou minúscula) — mais ninguém pode usar.
    </>],
    ['Como faço pro meu time aparecer pra todo mundo no jogo?', <>
      É o mesmo <b>Batismo</b> — e essa é a melhor parte dele.<br /><br />
      Seu clube <b>entra numa divisão de verdade</b> e passa a existir pra <b>todo jogador do Leilão Legends</b>, não só pra você. Qualquer pessoa pode cair na mesma tabela que ele, ver o seu escudo, o seu manto, e a sua mascote comemorando o gol.<br /><br />
      A <b>Série A custa mais</b> (R$ 69,90) porque é a elite do jogo: são os clubes que aparecem no <b>jogo rápido online</b> e os rivais que todo mundo enfrenta na carreira. É o clube que mais aparece.
    </>],
    ['Quais são os planos de apoio?', <>
      São <b>4</b>, e todos os detalhes estão no botão <b>💛 Apoiar</b>:<br /><br />
      🎫 <b>Sócio Legends — R$ 9,90 por mês.</b> O único mensal.<br />
      ⭐ <b>Craque — R$ 19,90, uma vez só.</b><br />
      👑 <b>Lenda — R$ 39,90, uma vez só.</b> Ganha <b>tudo do Craque</b> e mais.<br />
      🖋️ <b>Batismo — a partir de R$ 59,90, uma vez só.</b> Ganha <b>tudo do Lenda</b>, mais o clube com escudo, mascote, manto e estádio.<br /><br />
      Nenhum plano dá vantagem dentro das quatro linhas — <b>o jogo é igual pra todos</b>. O que muda é cor, brilho, história e mimos.
    </>],
    ['Como faço pra patrocinar minha empresa no jogo?', <>
      A sua marca pode virar <b>parte do jogo</b>, não um banner: todo início de temporada cada técnico <b>escolhe um patrocinador</b> pro clube e joga a temporada inteira pela meta dele.<br /><br />
      Marcas reais já estão lá dentro hoje, escolhidas pelos jogadores.<br /><br />
      <b>Manda um e-mail pra <span style={{ color: PURPLE }}>contato@leilaolegends.com</span></b> que a gente te responde com os números do jogo e os formatos. Se preferir, chama no direct <b>@leilaolegendscom</b>.
    </>],
    ['Preciso criar conta pra jogar?', <>
      <b>Não.</b> Dá pra jogar tudo sem cadastro: partida rápida, sala com os amigos, e até a <b>primeira temporada inteira da carreira</b>.<br /><br />
      Com conta você <b>ganha e guarda as cartas</b>, aparece no ranking, e a carreira fica salva na nuvem — trocou de celular, ela vai junto.<br /><br />
      Sem conta, o save mora <b>só naquele aparelho</b>. Limpou o navegador, perdeu.
    </>],
    ['Meu clube ficou no vermelho. E agora?', <>
      <b>Não é bug</b> — e tem saída.<br /><br />
      Acontece quando a <b>folha salarial</b> (ou uma renovação de contrato) fica maior que o seu caixa. Enquanto estiver negativo você <b>não consegue contratar</b>, mas continua jogando normal.<br /><br />
      Pra sair: <b>venda um jogador</b> no leilão, pegue reforço <b>de graça no Monte</b>, e siga ganhando prêmio e bilheteria. Zerou, o mercado destrava sozinho.
    </>],
    ['Por que não dá pra ver o nível do jogador antes do lance?', <>
      <b>Não é bug — é o jogo.</b> O leilão é <b>às cegas</b>: você vê só o nome e aposta no que acha que aquele nome vale.<br /><br />
      O nível só abre na <b>Cerimônia da Revelação</b>, quando todos os envelopes abrem juntos. É ali que você descobre se pagou 30 moedas num craque ou num perna-de-pau — e todo mundo descobre ao mesmo tempo.
    </>],
    ['Troquei de celular e sumiu minha carreira', <>
      Se você tem <b>conta criada</b>, ela não sumiu: entre com o mesmo e-mail no aparelho novo e a carreira <b>baixa da nuvem</b> sozinha.<br /><br />
      Se jogava <b>sem conta</b>, o save ficava só naquele navegador — aí não tem como recuperar. É o motivo nº 1 pra criar a conta antes de investir muitas temporadas.<br /><br />
      Tem mais de uma carreira? Toca em <b>🪜 Minhas carreiras</b> na tela inicial pra trocar entre elas.
    </>],
  ]
  return (
    <>
      {/* ␣ RESPIRO (Diego 21/08: *"dê um espaço bom pra não ficar colado"*): as
          Dúvidas são OUTRO assunto, não a continuação das regras — então ganham
          um fio separando e bastante ar antes. */}
      <div className="mt-7 pt-6" style={{ borderTop: '2.5px solid rgba(12,12,12,.14)' }}>
        <p className="text-[11px] font-black uppercase tracking-widest text-black/45 mb-3" style={OSWALD}>{t('❓ Dúvidas de quem joga', '❓ Players\' questions')}</p>
      <div className="space-y-2">
        {QA.map(([q, a], i) => (
          <div key={i} className="border-[2.5px] border-black rounded-xl bg-white overflow-hidden" style={{ boxShadow: `2px 2px 0 0 ${INK}` }}>
            <button onClick={() => setAberta(aberta === i ? null : i)}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left active:opacity-70">
              <span className="flex-1 font-black text-[12px] leading-snug" style={OSWALD}>{q}</span>
              <span className="flex-none text-[13px] font-black" style={{ color: PURPLE, transform: aberta === i ? 'rotate(180deg)' : undefined, transition: 'transform .18s' }}>⌄</span>
            </button>
            {aberta === i && (
              <p className="text-[11px] font-semibold text-black/70 leading-relaxed px-3 pb-3 -mt-0.5" style={{ borderTop: '2px solid rgba(0,0,0,.08)', paddingTop: 9 }}>{a}</p>
            )}
          </div>
        ))}
        </div>
      </div>
    </>
  )
}

// 📋 A LINHA DE PASSO — a mesma peça na home e no Manual do Técnico.
// Foi pedido do Diego (20/08): *"as regras estão com muita firula no botão de
// regras… tem que ser mais parecido com a foto do como funciona"*. O manual
// antigo era quadro dentro de quadro (uma caixa dourada, com uma fileira de 4
// cartõezinhos dentro, com texto de 8px dentro deles). Agora os dois lugares
// usam LITERALMENTE o mesmo componente — não é "parecido", é o mesmo.
// `n` vazio = linha sem número (os modos, no manual).
function PassoLinha({ n, ic, titulo, children }: { n?: number; ic: string; titulo: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 border-[2.5px] border-black rounded-xl bg-white px-3.5 py-3" style={{ boxShadow: `2px 2px 0 0 ${INK}` }}>
      <span className="flex-none w-[30px] h-[30px] rounded-[9px] border-[2.5px] border-black grid place-items-center text-[15px]" style={{ background: GOLD }}>{ic}</span>
      <div className="min-w-0">
        <p className="font-black text-[12.5px] uppercase leading-tight" style={OSWALD}>{n != null && <span className="text-black/30">{n}. </span>}{titulo}</p>
        <p className="text-[10.5px] font-semibold text-black/60 leading-snug">{children}</p>
      </div>
    </div>
  )
}

// 🎨 ÍCONES DA BARRA — desenhados (não emoji). O Diego mandou uma referência de
// app e o pedido foi: *"mais suave, sei lá, com mais cara de aplicativo embaixo"*.
// Emoji na barra fica com cara de rascunho: cada um tem um estilo, um peso e uma
// cor própria, e não dá pra pintar de roxo quando está ativo. Estes são traço
// arredondado com um "miolo" claro (duotone) — ativo pinta de roxo, parado fica
// tinta apagada. Mesmo espírito do jogo (traço grosso, canto redondo), só que sem
// a moldura preta pesada, que na barra de baixo brigava com o conteúdo.
function IconeBarra({ nome, cor }: { nome: 'inicio' | 'regras' | 'album' | 'ranking' | 'apoiar'; cor: string }) {
  const fill = cor === PURPLE ? 'rgba(124,58,237,.22)' : 'rgba(12,12,12,.10)'
  const p = { fill: 'none', stroke: cor, strokeWidth: 2, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" style={{ display: 'block', margin: '0 auto' }} aria-hidden="true">
      {nome === 'inicio' && (<>
        <path d="M3.5 10.5 12 3.5l8.5 7v9a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1z" {...p} fill={fill} />
        <path d="M9.5 20.5v-5.5h5v5.5" {...p} />
      </>)}
      {nome === 'regras' && (<>
        <path d="M3.5 5.2c2.8-1 5.6-1 8.5.6 2.9-1.6 5.7-1.6 8.5-.6v13c-2.8-1-5.6-1-8.5.6-2.9-1.6-5.7-1.6-8.5-.6z" {...p} fill={fill} />
        <path d="M12 5.8v13" {...p} />
      </>)}
      {nome === 'album' && (<>
        <rect x="4" y="3.5" width="12" height="17" rx="2.2" {...p} fill={fill} />
        <path d="M18.2 6.6l2 .7a1.6 1.6 0 0 1 1 2l-3.6 11" {...p} />
        <path d="M10 8.6l1.1 2.3 2.5.3-1.9 1.8.5 2.5-2.2-1.2-2.2 1.2.5-2.5-1.9-1.8 2.5-.3z" {...p} />
      </>)}
      {nome === 'ranking' && (<>
        <path d="M7 3.5h10v5.2a5 5 0 0 1-10 0z" {...p} fill={fill} />
        <path d="M7 5.2H4.3v1.6A3.2 3.2 0 0 0 7 9.9M17 5.2h2.7v1.6A3.2 3.2 0 0 1 17 9.9" {...p} />
        <path d="M12 13.7v3.1M8.6 20.5h6.8" {...p} />
      </>)}
      {nome === 'apoiar' && (
        <path d="M12 20.3S3.8 15.6 3.8 9.9A4.4 4.4 0 0 1 12 7.4a4.4 4.4 0 0 1 8.2 2.5c0 5.7-8.2 10.4-8.2 10.4z" {...p} fill={fill} />
      )}
    </svg>
  )
}

// 📱 BARRA DE BAIXO — suave, "cara de app" (pedido do Diego 20/08, com referência).
// O que ficou diferente do resto do jogo, de propósito:
//   · a moldura preta grossa virou um fio fino — a barra é MOLDURA da tela, não
//     um card; borda pesada ali brigava com todo o conteúdo acima dela;
//   · o item ativo não é mais um retângulo preto preenchido: só o ícone e o
//     rótulo pintados de roxo, como na referência;
//   · fundo quase branco (não o creme), pra a barra "sumir" e o conteúdo mandar.
function HomeMenuFixo({ onInicio, onRegras, onAlbum, onRanking, apoiar }: {
  onInicio: () => void; onRegras: () => void; onAlbum: () => void; onRanking: () => void; apoiar: React.ReactNode
}) {
  const item = (nome: 'inicio' | 'regras' | 'album' | 'ranking', txt: string, fn: () => void, on = false) => (
    <button key={txt} onClick={fn} className="flex-1 py-1.5 active:opacity-60" style={{ background: 'transparent' }}>
      <IconeBarra nome={nome} cor={on ? PURPLE : 'rgba(12,12,12,.55)'} />
      <span className="block text-[10.5px] font-black mt-1" style={{ ...OSWALD, color: on ? PURPLE : 'rgba(12,12,12,.6)' }}>{txt}</span>
    </button>
  )
  return (
    <div className="barra-menu" style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 99989,
      background: 'rgba(250,247,238,.97)', backdropFilter: 'blur(8px)',
      borderTop: '1.5px solid rgba(12,12,12,.13)', display: 'flex', gap: 2,
      /* 📱 iPhone com entalhe: a barrinha de gestos mora EM CIMA do rodapé. Sem
         isto, o último item da barra fica por baixo dela e o dedo não acerta.
         Em aparelho sem entalhe o env() vale 0 — não muda nada. */
      padding: '6px 6px calc(8px + env(safe-area-inset-bottom))', boxShadow: '0 -2px 12px rgba(0,0,0,.05)' }}>
      {/* 🔇 O botão de som é fixo no canto de baixo à direita (mora no index.tsx,
          fora daqui) e caía EM CIMA da barra — ficava um disco preto grandão
          colado no último item. Enquanto esta barra existe, ele sobe pra cima
          dela. Some junto com a barra: é só nesta tela. */}
      <style>{'button[aria-label="Desligar som"],button[aria-label="Ligar som"]{bottom:78px !important}'}</style>
      {item('inicio', tr('Início', 'Home'), onInicio, true)}
      {item('regras', tr('Regras', 'Rules'), onRegras)}
      {item('album', tr('Álbum', 'Album'), onAlbum)}
      {item('ranking', 'Ranking', onRanking)}
      {apoiar}
    </div>
  )
}

// 🏛️ Vitrine ilustrada do salão do pregão. É deliberadamente um componente
// isolado: a home geral continua no bloco antigo logo abaixo e pode ser
// comparada/revertida sem misturar seus estilos com esta experiência.
function HomeIlustradaDiego({ resumable, solo, onCareer, onCareers, onOnline, onQuick, onAlbum, onRanking, onManual, overlays }: {
  resumable: ReturnType<typeof useResumableRoom>
  solo: ReturnType<typeof useResumableSolo>
  shared: boolean
  onCareer: () => void
  onCareers: () => void
  onOnline: () => void
  onQuick: () => void
  onAlbum: () => void
  onRanking: () => void
  onManual: () => void
  onShare: () => void
  overlays: ReactNode
}) {
  const [contaAberta, setContaAberta] = useState(false)
  const [verSalao, setVerSalao] = useState(false)
  const t = useT() // 🌐 BR/EN: o botão fica no header, do lado de MINHA CONTA
  if (verSalao) return <Suspense fallback={<p className="p-6">{t('Carregando…', 'Loading…')}</p>}><SalaoLazy voltar={() => setVerSalao(false)} /></Suspense>
  return (
    <><div className="ll-home">
      <div className="ll-art" />
      <div className="ll-shade" />
      {/* 📢 faixa de "tem versão nova" — fecha uma vez e não volta mais naquele
          aparelho. Só existe aqui na home; ver `aviso-versao.tsx`. */}
      <AvisoVersaoNova />
      <header className="ll-header">
        <div className="ll-brand"><small>{t('LEILÃO ÀS CEGAS', 'BLIND AUCTION')}</small>LEILÃO LEGENDS</div>
        <div className="ll-lang"><LangToggle /></div>
        <div className="ll-account"><button onClick={() => setContaAberta(true)}>{t('MINHA CONTA', 'MY ACCOUNT')}</button></div>
      </header>
      <section className="ll-intro">
        <h1>{t('O PREGÃO ESTÁ ABERTO.', 'THE AUCTION IS OPEN.')}</h1>
        <p>{t('Dê lance no nome. O nível só aparece depois do martelo.', 'Bid on the name. The rating only shows after the hammer.')}</p>
      </section>
      {(resumable || solo) && <div className="ll-resume">
        {resumable && <><button onClick={resumable.resume}>{t('CONTINUAR SALA', 'RESUME ROOM')} {resumable.code}</button><button onClick={resumable.leave}>{t('SAIR DA SALA', 'LEAVE ROOM')}</button></>}
        {solo && <><button onClick={solo.resume}>{t('CONTINUAR', 'CONTINUE')} · {solo.teamName} · T{solo.seasonNo}</button><button onClick={onCareers}>{t('MINHAS CARREIRAS', 'MY CAREERS')}</button></>}
      </div>}
      <section className="ll-choices" aria-label="Escolha como jogar">
        <p className="ll-eyebrow">{t('ESCOLHA COMO VOCÊ QUER JOGAR', 'CHOOSE HOW YOU WANT TO PLAY')}</p>
        <div className="ll-modes">
          <button className="ll-mode" onClick={onQuick}><span className="ll-symbol" aria-hidden="true">ϟ</span><span className="ll-copy"><strong>{t('PARTIDA RÁPIDA', 'QUICK MATCH')}</strong><small>{t('Monte seu time e enfrente a CPU.', 'Build your squad and face the CPU.')}</small></span><span className="ll-arrow" aria-hidden="true">→</span></button>
          <button className="ll-mode ll-online" onClick={onOnline}><span className="ll-symbol" aria-hidden="true">◎</span><span className="ll-copy"><strong>{t('JOGAR ONLINE', 'PLAY ONLINE')}</strong><small>{t('Entre no pregão com seus amigos.', 'Join the auction with your friends.')}</small></span><span className="ll-arrow" aria-hidden="true">→</span></button>
          <button className="ll-mode ll-career" onClick={onCareer}><span className="ll-symbol" aria-hidden="true">★</span><span className="ll-copy"><strong>{t('MODO CARREIRA', 'CAREER MODE')}</strong><small>{t('Construa a história do seu clube.', "Build your club's story.")}</small></span><span className="ll-arrow" aria-hidden="true">→</span></button>
        </div>
        <button className="ll-salao-entry" onClick={() => { setVerSalao(true); window.scrollTo(0, 0) }}><span aria-hidden="true">🏛️</span><span><strong>{t('SALÃO DOS BATISMOS', 'HALL OF NAMED CLUBS')}</strong><small>{t('Conheça os clubes da comunidade', 'Meet the community’s clubs')}</small></span><span aria-hidden="true">›</span></button>
      </section>
      <footer className="ll-footer">
        <nav aria-label="Mais opções">
          <button onClick={onManual}>{t('REGRAS', 'RULES')}</button><button onClick={onAlbum}>{t('ÁLBUM', 'ALBUM')}</button><button onClick={onRanking}>{t('RANKING', 'RANKING')}</button>
          <ApoieButton trigger={open => <button onClick={open}>{t('APOIAR', 'SUPPORT')}</button>} />
        </nav>
        <div className="ll-web"><span>leilaolegends.com</span> · {t('Seu clube. Sua história.', 'Your club. Your story.')}</div>
      </footer>
      {contaAberta && <JanelaConta titulo={t('MINHA CONTA', 'MY ACCOUNT')} onPronto={() => setContaAberta(false)} onFechar={() => setContaAberta(false)} />}
      {overlays}
    </div><div className="ll-support-home-tail"><ApoieButton trigger={open => <SupportFooter onOpen={open} />} /></div></>
  )
}

export function EscIntro() {
  const t = useT() // 🌐 BR/EN
  const [sport] = useSport()
  const unlocked = useSportUnlocked() // 🔒 só o Diego vê qualquer coisa de basquete
  const homeNova = useHomeNova() // 🏠 home redesenhada — por enquanto só a conta do Diego
  const homeIlustrada = useHomeIlustrada() // 🏛️ teste fechado: apenas diego.c.fonseca@gmail.com
  const { dispatch } = useEsc()
  const resumable = useResumableRoom()
  const solo = useResumableSolo()
  const [showCarreiras, setShowCarreiras] = useState(false)
  // 🔑 a ação que a pessoa queria fazer quando o login foi pedido. Guardar isso
  // é o conserto do vazamento antigo: antes o botão de entrar mandava a pessoa
  // pro LOBBY ONLINE e ninguém a trazia de volta pra carreira.
  const [careerGate, setCareerGate] = useState<null | (() => void)>(null)
  const [shared, setShared] = useState(false)
  const [showManual, setShowManual] = useState(false) // 📖 Manual do Técnico (overlay)
  const [tema, setTema] = useState<string>(() => { try { return localStorage.getItem('esc-tema') ?? 'claro' } catch { return 'claro' } }) // 🌙 tema atual (rótulo do botão)
  const temaLiberado = useTemaLiberado() // 🔒 noturno: por enquanto só a conta do Diego (vira regalia de plano pago)
  // 🔓 A CARREIRA NÃO PEDE MAIS LOGIN PRA COMEÇAR (Diego 16/08 — plano §1).
  // Antes, toda entrada de carreira batia num cadeado. Medido: 56% de quem joga
  // NUNCA abre uma carreira, e quem abre volta 3× mais e some 2,5× menos — o
  // cadeado na porta estava custando exatamente a parte que segura as pessoas.
  // Agora ela joga; o save fica no aparelho (que é como já funcionava — a nuvem
  // é backup) e o convite pra criar conta aparece DENTRO da carreira, no fim da
  // 1ª temporada (`AvisoContaCarreira`, pyramidseason.tsx), mostrando o que ela
  // já conquistou. Enquanto isso, um aviso fixo diz que está só neste aparelho.
  const startCareer = (fn: () => void) => { fn() }
  const shareGame = async () => {
    const data = { title: 'Leilão Legends', text: t('Bora jogar Leilão Legends! Leilão às cegas de lendas do futebol brasileiro 🔨⚽', 'Come play Leilão Legends! A blind auction of Brazilian football legends 🔨⚽'), url: 'https://leilaolegends.com' }
    try {
      if (navigator.share) { await navigator.share(data); return }
      await navigator.clipboard.writeText('https://leilaolegends.com')
      setShared(true); setTimeout(() => setShared(false), 2500)
    } catch { /* usuário cancelou */ }
  }
  // 🏀 na aba Basquete abre a home do BidLegends (SÓ pro Diego; o futebol nem
  // carrega — seguro). Pra qualquer outra conta, `unlocked` é false e nada disso
  // existe: a home é EXATAMENTE a de hoje.
  if (unlocked && sport === 'basquete') return <BidLegendsHome />
  // O gate ilustrado vem antes da HOME_NOVA geral. Se a sessão não for
  // exatamente a conta autorizada, este bloco nem é montado e todo o fluxo
  // existente abaixo permanece intacto.
  if (homeIlustrada) {
    return <HomeIlustradaDiego
      resumable={resumable}
      solo={solo}
      shared={shared}
      onCareer={() => startCareer(() => { if (listAllCareers().length > 0) setShowCarreiras(true); else dispatch({ type: 'GO_SETUP_CAREER' }) })}
      onCareers={() => startCareer(() => setShowCarreiras(true))}
      onOnline={() => dispatch({ type: 'GO_LOBBY_ONLINE' })}
      onQuick={() => dispatch({ type: 'GO_SETUP' })}
      onAlbum={() => dispatch({ type: 'GO_ALBUM' })}
      onRanking={() => dispatch({ type: 'GO_RANKING' })}
      onManual={() => setShowManual(true)}
      onShare={shareGame}
      overlays={<>
        {showCarreiras && <MinhasCarreiras onClose={() => setShowCarreiras(false)} onNew={() => { setShowCarreiras(false); startCareer(() => dispatch({ type: 'GO_SETUP_CAREER' })) }} />}
        {showManual && <ManualDoTecnico onClose={() => setShowManual(false)} limpo />}
      </>}
    />
  }
  // 🏠 HOME NOVA — só a conta do Diego (ver `useHomeNova` em sport.ts). Todo o
  // resto do mundo cai no `return` de baixo, que é a home de hoje intacta.
  if (homeNova) {
    return (
      <Shell>
        {unlocked && <SportTabs />}
        <AvisoDaVez />
        {/* 🫁 RESPIRO DA HOME (Diego 21/08: "não tá tudo muito apertado aqui
            na home? não falta um pouco mais de espaço de um item pro outro?").
            O `Shell` dá 20px entre os blocos de TODAS as telas — nesta home a
            lista é longa e 20px empilha tudo. Este wrapper sobe pra 28px SÓ
            aqui: nenhuma outra tela do jogo muda. Pra reverter, é só tirar
            esta div (e o </div> lá embaixo). */}
        <div className="space-y-7">
        {/* 1 · o que é o jogo */}
        <div className="text-center pt-6">
          <span className="inline-block border-2 border-black rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide" style={{ backgroundColor: GOLD, boxShadow: `3px 3px 0 0 ${INK}` }}>
            {t('⚽ Leilão às cegas de lendas', '⚽ Blind auction of legends')}
          </span>
          <h1 className="font-black text-5xl mt-4 leading-none" style={OSWALD}>LEILÃO LEGENDS</h1>
          <div className="mx-auto mt-2" style={{ width: 150, height: 10, borderRadius: 5, background: GOLD, border: `2px solid ${INK}`, boxShadow: `3px 3px 0 0 ${INK}` }} />
          <p className="mt-3 font-semibold text-black/60 max-w-sm mx-auto">{getLang() === 'en' ? <>Bid <b>on the name</b>, without seeing the level. Build the team and collect the legends.</> : <>Dê lance <b>no nome</b>, sem ver o nível. Monte o time e colecione as lendas.</>}</p>
        </div>
        {/* 2 · as cartas, DEITADAS — o motivo de jogar fica no alto */}
        <div className="-mx-4">
          <div className="fita flex gap-3 px-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            <div className="flex-none w-[150px]"><CollectibleCard name="Pelé" club="Santos" year={1962} pos="ATA" fame={5} /></div>
            <div className="flex-none w-[150px]"><CollectibleCard name="Gabigol" club="Flamengo" year={2019} pos="ATA" fame={4} /></div>
            <div className="flex-none w-[150px]"><CollectibleCard name="Rayan Oi, Boa Noite" club="Vasco" year={2025} pos="ATA" fame={3} promessa /></div>
            <div className="flex-none w-[150px]"><CollectibleCard name="Obina" club="Flamengo" year={2005} pos="ATA" fame={2} folk /></div>
          </div>
          <p className="text-center text-[11px] font-bold text-black/45 mt-2">{t('👑 lenda · ⭐ craque · 💎 promessa · 🃏 folclórico — colecione todos', '👑 legend · ⭐ star · 💎 prospect · 🃏 folk hero — collect them all')}</p>
        </div>
        {/* 3 · os três modos, com a CARREIRA grande */}
        <div className="space-y-3 pt-1">
          <Btn onClick={() => startCareer(() => { if (listAllCareers().length > 0) setShowCarreiras(true); else dispatch({ type: 'GO_SETUP_CAREER' }) })} className="w-full text-left" bg={PURPLE}>
            <span className="block text-xl leading-none text-white">🪜 {solo ? t('Nova carreira', 'New career') : t('Começar carreira', 'Start career')}</span>
            <span className="block text-[11.5px] font-bold normal-case tracking-normal mt-1.5 leading-snug" style={{ color: 'rgba(255,255,255,.85)' }}>
              {escadaLiberada() ? t('Comece na Várzea e suba até a Série A.', 'Start in Várzea and climb to Série A.') : t('Comece na Série D e suba até a Série A.', 'Start in Série D and climb to Série A.')} {t('Cada título vira carta no seu álbum.', 'Every title becomes a card in your album.')}
            </span>
            <span className="inline-block mt-2 rounded-full px-2 py-0.5 text-[9.5px] font-black tracking-wide"
              style={{ ...OSWALD, background: 'rgba(255,255,255,.18)', border: '2px solid rgba(255,255,255,.4)', color: '#fff' }}>{t('🆓 SEM PRECISAR DE CONTA', '🆓 NO ACCOUNT NEEDED')}</span>
          </Btn>
          <div className="grid grid-cols-2 gap-3">
            <Btn onClick={() => dispatch({ type: 'GO_LOBBY_ONLINE' })} className="text-center" bg={GREEN}>
              {/* 🌐 "(online)" no rótulo a pedido do Diego (20/08) — "com amigos"
                  sozinho dá a entender que dá pra jogar com os amigos no MESMO
                  aparelho, que não é o caso: é sala online, com código. */}
              <span className="block text-sm leading-tight text-white">{getLang() === 'en' ? <>👥 With friends<br />online</> : <>👥 Com amigos<br />online</>}</span>
              <span className="block text-[9.5px] font-bold normal-case tracking-normal mt-1" style={{ color: 'rgba(255,255,255,.85)' }}>{t('até 20 na sala', 'up to 20 in the room')}</span>
            </Btn>
            <Btn onClick={() => dispatch({ type: 'GO_SETUP' })} className="text-center" bg="#fff">
              <span className="block text-sm leading-tight">{getLang() === 'en' ? <>⚡ Quick<br />match</> : <>⚡ Partida<br />rápida</>}</span>
              <span className="block text-[9.5px] font-bold normal-case tracking-normal mt-1 text-black/60">{t('uns 6 minutos', 'about 6 minutes')}</span>
            </Btn>
          </div>
        </div>
        {/* 4 · continuar (só pra quem tem) */}
        {resumable && (
          <div className="rounded-2xl border-4 border-black p-3 space-y-2.5" style={{ background: GREEN, boxShadow: `4px 4px 0 0 ${INK}` }}>
            <p className="font-black text-sm text-white leading-tight" style={OSWALD}>{t('⏳ Você tem uma partida em andamento', '⏳ You have a match in progress')}<br /><span className="opacity-80 text-xs">{t('Sala', 'Room')} {resumable.code}</span></p>
            <button onClick={resumable.resume} className="w-full rounded-xl border-2 border-black bg-white text-black font-black text-sm py-2.5 active:translate-y-0.5" style={OSWALD}>{t('▶️ Voltar pra sala', '▶️ Back to room')} {resumable.code}</button>
            <button onClick={resumable.leave} className="w-full rounded-xl border-2 border-black font-black text-sm py-2.5 active:translate-y-0.5" style={{ background: '#E8503A', color: '#fff', ...OSWALD }}>{t('🚪 Sair da sala', '🚪 Leave the room')}</button>
          </div>
        )}
        {solo && (
          <div className="rounded-2xl border-4 border-black p-3 space-y-2.5" style={{ background: '#6C43C0', boxShadow: `4px 4px 0 0 ${INK}` }}>
            <p className="font-black text-[11px] uppercase tracking-wide text-white/85" style={OSWALD}>{t('Sua carreira', 'Your career')} · {t('Temporada', 'Season')} {solo.seasonNo}</p>
            <p className="font-black text-lg text-white leading-none -mt-1" style={OSWALD}>{solo.teamName}</p>
            <button onClick={() => startCareer(solo.resume)} className="w-full rounded-xl border-2 border-black bg-white text-black font-black text-sm py-2.5 active:translate-y-0.5" style={OSWALD}>{t('▶️ Continuar de onde parei', '▶️ Continue where I left off')}</button>
            <button onClick={() => startCareer(() => setShowCarreiras(true))} className="w-full rounded-xl border-2 border-black bg-white text-black font-black text-[12.5px] py-2 active:translate-y-0.5" style={OSWALD}>{t('🪜 Minhas carreiras · trocar de save', '🪜 My careers · switch save')}</button>
          </div>
        )}
        {/* 5 · como funciona — ABERTO, e aqui embaixo */}
        <div className="pt-2">
          <p className="text-[11px] font-black uppercase tracking-widest text-black/45 mb-3" style={OSWALD}>{t('Como funciona uma partida', 'How a match works')}</p>
          {getLang() === 'en' ? <div className="space-y-3">
            <PassoLinha n={1} ic="🪙" titulo="100 coins">The deck comes by position. You only see the <b>name</b>.</PassoLinha>
            <PassoLinha n={2} ic="✉️" titulo="Secret bid">Write what it's worth and seal. Nobody sees anyone's bid.</PassoLinha>
            <PassoLinha n={3} ic="🔨" titulo="The hammer reveals">Whoever paid the most wins — and <b>only then</b> the level shows.</PassoLinha>
            <PassoLinha n={4} ic="👕" titulo="Fill the 11">Missing a position? The Pile has the leftovers, for free.</PassoLinha>
            <PassoLinha n={5} ic="⚽" titulo="The championship runs">38 rounds in 3 minutes. The champion takes a <b>card</b>.</PassoLinha>
          </div> : <div className="space-y-3">
            <PassoLinha n={1} ic="🪙" titulo="100 moedas">O baralho vem por posição. Você só vê o <b>nome</b>.</PassoLinha>
            <PassoLinha n={2} ic="✉️" titulo="Lance secreto">Escreve quanto vale e lacra. Ninguém vê o lance de ninguém.</PassoLinha>
            <PassoLinha n={3} ic="🔨" titulo="O martelo revela">Quem pagou mais leva — e <b>só aí</b> aparece o nível.</PassoLinha>
            <PassoLinha n={4} ic="👕" titulo="Fecha os 11">Faltou posição? O Monte tem as sobras, de graça.</PassoLinha>
            <PassoLinha n={5} ic="⚽" titulo="O campeonato roda">38 rodadas em 3 minutos. Campeão leva <b>carta</b>.</PassoLinha>
          </div>}
        </div>
        {/* 6 · novidades — ABERTAS, mas ENXUTAS. Na home de hoje este bloco é o
            MAIOR da página (foi a queixa nº1 do Diego). Aqui ele mostra as 3
            primeiras e abre o resto no toque: continua visível sem virar paredão. */}
        <NovidadesCurtas />
        {/* 7 · apoiar — a história de quem faz o jogo mora DENTRO dele */}
        <ApoieButton big />
        <CardAccountNote />
        <Btn onClick={shareGame} className="w-full" bg="#fff">
          📤 {shared ? t('Link copiado! Cola no zap 📲', 'Link copied! Paste it in the chat 📲') : t('Compartilhar com os amigos', 'Share with friends')}
        </Btn>
        <AdminButton />
        <DinastiaButton />
        <CareerOnlineButton />
        <LigaFechadaButton />
        </div>
        {/* espaço pro menu fixo não tapar o fim da página. No PC a barra sobe
            pro topo (index.css), então este espaço vira zero e o respiro passa
            pra cima — a classe faz as duas coisas. */}
        <div className="espaco-barra" style={{ height: 74 }} />
        <HomeMenuFixo
          onInicio={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          onRegras={() => setShowManual(true)}
          onAlbum={() => dispatch({ type: 'GO_ALBUM' })}
          onRanking={() => dispatch({ type: 'GO_RANKING' })}
          apoiar={<ApoieButton trigger={open => (
            <button onClick={open} className="flex-1 py-1.5 active:opacity-60">
              <IconeBarra nome="apoiar" cor="rgba(194,69,47,.85)" />
              <span className="block text-[10.5px] font-black mt-1" style={{ ...OSWALD, color: 'rgba(194,69,47,.9)' }}>{t('Apoiar', 'Support')}</span>
            </button>
          )} />} />
        {showCarreiras && <MinhasCarreiras onClose={() => setShowCarreiras(false)} onNew={() => { setShowCarreiras(false); startCareer(() => dispatch({ type: 'GO_SETUP_CAREER' })) }} />}
        {showManual && <ManualDoTecnico onClose={() => setShowManual(false)} limpo />}
        {careerGate && (
          <JanelaConta titulo={t('🪜 Sua carreira mora na conta', '🪜 Your career lives in your account')} contexto={t('Entre ou crie sua conta — te levo direto pra carreira.', 'Sign in or create your account — I\'ll take you straight to the career.')} comecarEmCriar
            onPronto={() => { const fn = careerGate; setCareerGate(null); fn?.() }} onFechar={() => setCareerGate(null)} />
        )}
      </Shell>
    )
  }
  return (
    <Shell>
      {unlocked && <SportTabs />}
      {/* 📣 recado temporário do Diego pra todo mundo (ver `aviso.tsx`): fica no
          TOPO da home porque é o primeiro que precisa ser lido, some sozinho na
          data marcada e some de vez pra quem fechar. */}
      <AvisoDaVez />
      {resumable && (
        <div className="rounded-2xl border-4 border-black p-3 mb-1 space-y-2.5" style={{ background: '#1B7A3D', boxShadow: `4px 4px 0 0 ${INK}` }}>
          <p className="font-black text-sm text-white leading-tight" style={OSWALD}>
            {t('⏳ Você tem uma partida em andamento', '⏳ You have a match in progress')}<br />
            <span className="opacity-80 text-xs">{t('Sala', 'Room')} {resumable.code}</span>
          </p>
          <button onClick={resumable.resume}
            className="w-full rounded-xl border-2 border-black bg-white text-black font-black text-sm py-2.5 active:translate-y-0.5" style={OSWALD}>
            {t('▶️ Continuar a partida', '▶️ Continue the match')} ({t('Sala', 'Room')} {resumable.code})
          </button>
          <button onClick={resumable.leave}
            className="w-full rounded-xl border-2 border-black font-black text-sm py-2.5 active:translate-y-0.5"
            style={{ background: '#E8503A', color: '#fff', ...OSWALD }}>
            {t('🚪 Sair da sala e começar uma nova', '🚪 Leave the room and start a new one')}
          </button>
        </div>
      )}
      {solo && (
        <div className="rounded-2xl border-4 border-black p-3 mb-1 space-y-2.5" style={{ background: '#6C43C0', boxShadow: `4px 4px 0 0 ${INK}` }}>
          <p className="font-black text-sm text-white leading-tight" style={OSWALD}>
            {t('🪜 Carreira offline em andamento', '🪜 Offline career in progress')}<br />
            <span className="opacity-80 text-xs">{solo.teamName} · {t('Temporada', 'Season')} {solo.seasonNo}</span>
          </p>
          <button onClick={() => startCareer(solo.resume)} className="w-full rounded-xl border-2 border-black bg-white text-black font-black text-sm py-2.5 active:translate-y-0.5" style={OSWALD}>
            {t('▶️ Continuar carreira', '▶️ Continue career')} ({solo.teamName})
          </button>
          <button onClick={() => startCareer(() => setShowCarreiras(true))} className="w-full rounded-xl border-2 border-black bg-white text-black font-black text-sm py-2.5 active:translate-y-0.5" style={OSWALD}>
            {t('🪜 Minhas carreiras · trocar de save', '🪜 My careers · switch save')}
          </button>
        </div>
      )}
      {showCarreiras && <MinhasCarreiras onClose={() => setShowCarreiras(false)} onNew={() => { setShowCarreiras(false); startCareer(() => dispatch({ type: 'GO_SETUP_CAREER' })) }} />}
      {careerGate && (
        <JanelaConta
          titulo={t('🪜 Sua carreira mora na conta', '🪜 Your career lives in your account')}
          contexto={t('Entre ou crie sua conta — te levo direto pra carreira.', 'Sign in or create your account — I\'ll take you straight to the career.')}
          comecarEmCriar
          onPronto={() => { const fn = careerGate; setCareerGate(null); fn?.() }}
          onFechar={() => setCareerGate(null)} />
      )}
      <div className="text-center pt-8">
        <span className="inline-block border-2 border-black rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide" style={{ backgroundColor: GOLD, boxShadow: `3px 3px 0 0 ${INK}` }}>
          {t('⚽ Leilão às cegas de lendas', '⚽ Blind auction of legends')}
        </span>
        <h1 className="font-black text-5xl mt-4 leading-none" style={OSWALD}>LEILÃO LEGENDS</h1>
        {/* sublinhado dourado da marca oficial (mesmo da logo do Instagram/og) */}
        <div className="mx-auto mt-2" style={{ width: 150, height: 10, borderRadius: 5, background: GOLD, border: `2px solid ${INK}`, boxShadow: `3px 3px 0 0 ${INK}` }} />
        <p className="mt-3 font-semibold text-black/60 max-w-sm mx-auto">{getLang() === 'en' ? <>Bid on the <b>name</b>, without seeing the level. Build the team at the auction, win the championship and collect the stars in your album.</> : <>Dê lance no <b>nome</b>, sem ver o nível. Monte o time no pregão, ganhe o campeonato e colecione os craques no seu álbum.</>}</p>
      </div>
      {/* 🎯 O QUE FAZER AGORA (Diego 16/08 — docs/plano-crescimento.md §4).
          Antes a home abria com 4 cartas e a primeira coisa clicável era a
          PARTIDA RÁPIDA — o modo que acaba em 20 min e não deixa nada. Agora:
          1) quem já tem carreira vê "continuar" LÁ EM CIMA (blocos acima);
          2) os botões de JOGAR vêm antes da vitrine e cada um DIZ o que a
             pessoa ganha ali (nada de nome solto);
          3) a carreira (o modo que segura quem joga) fica em cima da rápida;
          4) álbum/ranking/manual/apoiar viram uma fileirinha de ícones — são
             coisas de VER, não de jogar, e estavam roubando o lugar do jogo. */}
      <div className="space-y-3">
        {/* carreira em destaque: brilho pulsante na própria cor (roxo) */}
        <motion.div className="rounded-xl"
          animate={{ boxShadow: ['0 0 0 0 rgba(124,58,237,0)', '0 0 16px 4px rgba(124,58,237,0.7)', '0 0 0 0 rgba(124,58,237,0)'] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}>
          <Btn onClick={() => startCareer(() => { if (listAllCareers().length > 0) setShowCarreiras(true); else dispatch({ type: 'GO_SETUP_CAREER' }) })} className="w-full text-left" bg={PURPLE}>
            <span className="block text-lg leading-none text-white">🪜 {solo ? t('Nova carreira', 'New career') : t('Começar carreira', 'Start career')}</span>
            <span className="block text-[11px] font-bold normal-case tracking-normal mt-1.5 leading-snug" style={{ color: 'rgba(255,255,255,.82)' }}>
              {escadaLiberada() ? t('Comece na Várzea e suba até a Série A', 'Start in Várzea and climb to Série A') : t('Comece na Série D e suba até a Série A', 'Start in Série D and climb to Série A')}
            </span>
          </Btn>
        </motion.div>
        {/* ⚠️ o Diego pediu SEM contador de gente online e com "(online)" entre
            parênteses no rótulo (16/08) — sala vazia com "0 online" espanta. */}
        <Btn onClick={() => dispatch({ type: 'GO_LOBBY_ONLINE' })} className="w-full text-left" bg={GREEN}>
          <span className="block text-lg leading-none text-white">{t('👥 Jogar com amigos (online)', '👥 Play with friends (online)')}</span>
          <span className="block text-[11px] font-bold normal-case tracking-normal mt-1.5 leading-snug" style={{ color: 'rgba(255,255,255,.82)' }}>
            {t('Crie a sala, mande o código no zap — até 20 no mesmo pregão', 'Create the room, send the code in the chat — up to 20 in the same auction')}
          </span>
        </Btn>
        {/* uma linha só, como era (Diego 16/08: "deixe como estava antes o só uma
            partida rápida mesmo, só deixe alinhado") — o que mudou foi só o
            alinhamento: encostado na esquerda igual aos dois de cima. */}
        <Btn onClick={() => dispatch({ type: 'GO_SETUP' })} className="w-full text-left text-lg" bg="#fff">{t('⚡ Só uma partida rápida (vs CPU)', '⚡ Just a quick match (vs CPU)')}</Btn>
        {/* fileira de ícones: ver, não jogar */}
        <div className="grid grid-cols-4 gap-2">
          {([['📖', t('Álbum', 'Album'), () => dispatch({ type: 'GO_ALBUM' })],
             ['🏆', 'Ranking', () => dispatch({ type: 'GO_RANKING' })],
             ['📘', t('Manual', 'Handbook'), () => setShowManual(true)]] as [string, string, () => void][]).map(([ic, lb, fn]) => (
            <HomeIconTile key={lb} icon={ic} label={lb} onClick={fn} />
          ))}
          <ApoieButton trigger={open => <HomeIconTile icon="💛" label={t('Apoiar', 'Support')} onClick={open} />} />
        </div>
        <AdminButton />
        <DinastiaButton />
        <CareerOnlineButton />
        <LigaFechadaButton />
      </div>
      {/* (aqui ficava o banner roxo de novidades — saiu a pedido do Diego 16/08;
          as novidades continuam no `NewsSection`, no rodapé.) */}
      {/* vitrine: a coleção é a estrela — cartas reais do álbum (nível/cor/bio do
          catálogo). Desceu pra baixo dos botões, mas NÃO saiu: é ela que mostra
          o que a pessoa vai colecionar. */}
      <div className="grid grid-cols-2 gap-3 grade-cartas">
        <div style={{ transform: 'rotate(-1.5deg)' }}><CollectibleCard name="Pelé" club="Santos" year={1962} pos="ATA" fame={5} showBio /></div>
        <div style={{ transform: 'rotate(1.5deg)' }}><CollectibleCard name="Gabigol" club="Flamengo" year={2019} pos="ATA" fame={4} showBio /></div>
        <div style={{ transform: 'rotate(1.5deg)' }}><CollectibleCard name="Rayan Oi, Boa Noite" club="Vasco" year={2025} pos="ATA" fame={3} promessa showBio /></div>
        <div style={{ transform: 'rotate(-1.5deg)' }}><CollectibleCard name="Obina" club="Flamengo" year={2005} pos="ATA" fame={2} folk showBio /></div>
      </div>
      <p className="text-center text-[11px] font-black uppercase tracking-wide text-black/45" style={OSWALD}>{t('👑 lenda · ⭐ craque · 💎 promessa · 🃏 folclórico — colecione todos', '👑 legend · ⭐ star · 💎 prospect · 🃏 folk hero — collect them all')}</p>
      {/* como funciona — 4 cartões enxutos em grade 2×2 */}
      <div className="grid grid-cols-2 gap-2.5">
        {((getLang() === 'en' ? [['🔨', 'The Auction', '5 rounds of blind auction: goalkeeper, full-back, defence, midfield and attack. Nobody sees anyone\'s bid.'],
           ['🎭', 'Hidden levels', 'You bet on the name. The level only opens at the Ceremony — and every star has good days and bad days.'],
           ['🪜', 'Pyramid', escadaLiberada() ? 'Start in VÁRZEA and climb to Série A. Every title becomes a card in your album.' : 'Start in Série D and climb to A. Every title becomes a card in your album.'],
           ['💎', 'Peak counts', 'The level is the star\'s peak, according to the deck: in 🇧🇷 it\'s the peak in Brazil; in 🌍 Europe, the peak abroad. A star only in Europe enters as a prospect in BR.']] : [['🔨', 'O Pregão', '5 rodadas de leilão cego: goleiro, lateral, zaga, meio e ataque. Ninguém vê o lance de ninguém.'],
           ['🎭', 'Níveis ocultos', 'Você aposta no nome. O nível só abre na Cerimônia — e todo craque tem dia bom e dia ruim.'],
           ['🪜', 'Pirâmide', escadaLiberada() ? 'Comece na VÁRZEA e suba até a Série A. Cada título vira uma carta no seu álbum.' : 'Comece na Série D e suba até a A. Cada título vira uma carta no seu álbum.'],
           ['💎', 'Vale o auge', 'O nível é o auge do craque, conforme o baralho: no 🇧🇷 conta o auge no Brasil; no 🌍 Europa, o auge lá fora. Estrela só na Europa entra como promessa no BR.']]) as [string, string, string][]).map(([ic, t, d]) => (
          <div key={t} className="border-[3px] border-black rounded-xl bg-white p-3" style={{ boxShadow: `4px 4px 0 0 ${INK}` }}>
            <div className="text-xl">{ic}</div>
            <p className="font-black text-[13px] uppercase mt-1.5" style={OSWALD}>{t}</p>
            <p className="text-[11px] font-semibold text-black/60 mt-0.5 leading-snug">{d}</p>
          </div>
        ))}
      </div>
      {/* (o botão do Manual e o de Apoiar viraram ícones lá em cima — o overlay
          continua o mesmo, só mudou de onde ele é chamado.) */}
      {showManual && <ManualDoTecnico onClose={() => setShowManual(false)} />}
      {/* 🌙 tema noturno: SÓ pra conta liberada (Diego; vira regalia de plano pago). O claro é o padrão e não muda. */}
      {temaLiberado && <div className="flex justify-center">
        <button onClick={() => {
          const on = document.documentElement.classList.toggle('noturno')
          try { localStorage.setItem('esc-tema', on ? 'noturno' : 'claro') } catch { /* segue */ }
          setTema(on ? 'noturno' : 'claro')
        }} className="border-2 border-black rounded-full px-4 py-1.5 text-xs font-black bg-white text-black" style={{ ...OSWALD, boxShadow: `2px 2px 0 0 ${INK}` }}>
          {tema === 'noturno' ? t('☀️ Voltar pro tema claro', '☀️ Back to light theme') : t('🌙 Tema noturno (estádio à noite)', '🌙 Night theme (stadium at night)')}
        </button>
      </div>}
      <CardAccountNote />
      <Btn onClick={shareGame} className="w-full" bg="#fff">
        📤 {shared ? t('Link copiado! Cola no zap 📲', 'Link copied! Paste it in the chat 📲') : t('Compartilhar com os amigos', 'Share with friends')}
      </Btn>
      <NewsSection />
    </Shell>
  )
}

// ─── 📖 MANUAL DO TÉCNICO ────────────────────────────────────────────
// A regra-mãe (o leilão, igual em todo modo) UMA vez + um card por modo com só
// o que muda. Modos ainda não liberados (Dinastia/Carreira online/Liga Fechada)
// ficam de fora até o Diego liberar. É um complemento — o ensino de verdade
// continua sendo contextual, dentro do jogo.
function ManualDoTecnico({ onClose, limpo }: { onClose: () => void; limpo?: boolean }) {
  const t = useT() // 🌐 BR/EN
  const fases: [string, string, string][] = [
    ['✉️', t('Envelope', 'Envelope'), t('lance secreto — ninguém vê o seu', 'secret bid — nobody sees yours')],
    ['👀', t('Revelação', 'Reveal'), t('abrem todos juntos', 'all open together')],
    ['🔨', t('Martelo', 'Hammer'), t('maior lance leva', 'highest bid wins')],
    ['🃏', t('Monte', 'Pile'), t('sobras: pega de graça na sua vez', 'leftovers: grab for free on your turn')],
  ]
  const modos: [string, string, string][] = [
    ['⚡', t('Rápido (offline)', 'Quick (offline)'), t('Você contra a CPU. Monta o time no leilão e joga UMA temporada (liga + Copa dos 8). Bom pra treinar o dedo.', 'You against the CPU. Build the team at the auction and play ONE season (league + Cup of 8). Good for practice.')],
    ['👥', t('Rápido (online)', 'Quick (online)'), t('Mesma coisa, só que os lances são dos seus AMIGOS na sala (até 8). Baralho Brasil, Europa, Todos — ou a Várzea 🥅 (sem craques).', 'Same thing, but the bids come from your FRIENDS in the room. Brazil, Europe or All decks — or Várzea 🥅 (no stars).')],
    ['🪜', t('Carreira', 'Career'), escadaLiberada() ? t('A vida de técnico: começa na VÁRZEA (peladão raiz 🍺) e sobe a pirâmide até a Série A. Temporada a temporada desbloqueia reservas, vendas, folha, contratos, estádio, SAF…', 'The manager\'s life: start in VÁRZEA (grassroots pick-up football 🍺) and climb the pyramid up to Série A. Season by season you unlock reserves, sales, payroll, contracts, stadium, SAF…') : t('A vida de técnico: começa na Série D e sobe a pirâmide até a A. Temporada a temporada desbloqueia reservas, vendas, folha salarial, contratos, estádio, SAF…', 'The manager\'s life: start in Série D and climb the pyramid up to A. Season by season you unlock reserves, sales, payroll, contracts, stadium, SAF…')],
  ]
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 99998, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '18px 12px' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, background: '#F4ECD6', border: `3px solid ${INK}`, borderRadius: 18, boxShadow: `5px 5px 0 0 ${INK}`, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <p style={{ flex: 1, fontWeight: 900, fontSize: 18, ...OSWALD, margin: 0 }}>{t('📖 Manual do Técnico', '📖 Manager\'s Handbook')}</p>
          <button onClick={onClose} aria-label={t('Fechar', 'Close')} style={{ fontSize: 18, fontWeight: 900, border: 'none', background: 'transparent', cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>
        {/* 🧼 VERSÃO LIMPA (home nova) — sem firula: a MESMA lista de passos da
            home, e os modos na mesma linha. O manual velho continua igual pra
            quem ainda está na home de hoje. */}
        {limpo ? (
          <>
            <p className="text-[11px] font-black uppercase tracking-widest text-black/45 mb-2.5" style={OSWALD}>{t('Como funciona uma partida', 'How a match works')}</p>
            {getLang() === 'en' ? <div className="space-y-2">
              <PassoLinha n={1} ic="🪙" titulo="100 coins">The deck comes by position. You only see the <b>name</b>, never the level.</PassoLinha>
              <PassoLinha n={2} ic="✉️" titulo="Secret bid">Write what each name is worth and seal the envelope. Nobody sees anyone's bid.</PassoLinha>
              <PassoLinha n={3} ic="👀" titulo="All open together">At the Ceremony the envelopes open at once — and <b>only then</b> you see whether it was a star or a donkey.</PassoLinha>
              <PassoLinha n={4} ic="🔨" titulo="The hammer falls">Whoever paid the most wins. Tied on the highest bid? There is a <b>tie-break</b>, also blind.</PassoLinha>
              <PassoLinha n={5} ic="🃏" titulo="Fill the 11 from the Pile">Player left without an owner? On your turn you grab him <b>for free</b>, until the team is complete.</PassoLinha>
              <PassoLinha n={6} ic="⚽" titulo="The championship runs">38 rounds in about 3 minutes, with the score ticking live. The champion takes <b>a card</b> for the album.</PassoLinha>
            </div> : <div className="space-y-2">
              <PassoLinha n={1} ic="🪙" titulo="100 moedas">O baralho vem por posição. Você só vê o <b>nome</b>, nunca o nível.</PassoLinha>
              <PassoLinha n={2} ic="✉️" titulo="Lance secreto">Escreve quanto vale cada nome e lacra o envelope. Ninguém vê o lance de ninguém.</PassoLinha>
              <PassoLinha n={3} ic="👀" titulo="Abrem todos juntos">Na Cerimônia os envelopes abrem de uma vez — e <b>só aí</b> aparece se era craque ou perna-de-pau.</PassoLinha>
              <PassoLinha n={4} ic="🔨" titulo="O martelo bate">Quem pagou mais leva. Empatou no maior lance? Tem <b>desempate</b>, também às cegas.</PassoLinha>
              <PassoLinha n={5} ic="🃏" titulo="Fecha os 11 no Monte">Sobrou jogador sem dono? Na sua vez você pega <b>de graça</b>, até fechar o time.</PassoLinha>
              <PassoLinha n={6} ic="⚽" titulo="O campeonato roda">38 rodadas em uns 3 minutos, com o placar subindo ao vivo. Campeão leva <b>uma carta</b> pro álbum.</PassoLinha>
            </div>}
            <p className="text-[11px] font-black uppercase tracking-widest text-black/45 mt-6 mb-2.5" style={OSWALD}>{t('Onde dá pra jogar isso', 'Where you can play it')}</p>
            {getLang() === 'en' ? <div className="space-y-2">
              <PassoLinha ic="⚡" titulo="Quick (offline)">You against the CPU. Just one season — league + Cup of 8. Good to get the hang of it.</PassoLinha>
              <PassoLinha ic="👥" titulo="Quick (online)">Same thing, but the bids come from your friends in the room. Up to 20 in the same auction.</PassoLinha>
              <PassoLinha ic="🪜" titulo="Career">{escadaLiberada() ? 'Start in Várzea' : 'Start in Série D'} and climb the pyramid up to Série A. Season by season it opens reserves, sales, payroll, contracts, stadium and SAF.</PassoLinha>
            </div> : <div className="space-y-2">
              <PassoLinha ic="⚡" titulo="Rápido (offline)">Você contra a CPU. Uma temporada só — liga + Copa dos 8. Bom pra pegar o jeito.</PassoLinha>
              <PassoLinha ic="👥" titulo="Rápido (online)">Mesma coisa, mas os lances são dos seus amigos na sala. Até 20 no mesmo pregão.</PassoLinha>
              <PassoLinha ic="🪜" titulo="Carreira">{escadaLiberada() ? 'Começa na Várzea' : 'Começa na Série D'} e sobe a pirâmide até a Série A. Temporada a temporada abre reservas, vendas, folha, contratos, estádio e SAF.</PassoLinha>
            </div>}
            <Duvidas />
          </>
        ) : (<>
        {/* a regra-mãe: o leilão */}
        <div style={{ border: `3px solid ${INK}`, borderRadius: 14, background: GOLD, padding: '10px 11px', boxShadow: `3px 3px 0 0 ${INK}`, marginBottom: 10 }}>
          <p style={{ fontWeight: 900, fontSize: 14, ...OSWALD, margin: 0, textTransform: 'uppercase' }}>{t('🔨 Como funciona o leilão (a base de tudo)', '🔨 How the auction works (the base of everything)')}</p>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            {fases.map(([ic, t, d]) => (
              <div key={t} style={{ flex: 1, background: '#fff', border: `2.5px solid ${INK}`, borderRadius: 10, padding: '6px 4px', textAlign: 'center' }}>
                <div style={{ fontSize: 16 }}>{ic}</div>
                <p style={{ fontWeight: 900, fontSize: 9, ...OSWALD, margin: '2px 0 0', textTransform: 'uppercase' }}>{t}</p>
                <p style={{ fontSize: 8, fontWeight: 700, color: 'rgba(0,0,0,.55)', margin: '2px 0 0', lineHeight: 1.25 }}>{d}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 10, fontWeight: 700, margin: '7px 2px 0', lineHeight: 1.4 }}>{getLang() === 'en' ? <>Tied on the highest bid? There is a <b>tie-break</b>. Nobody bid? It goes to the <b>pile</b> — each manager can grab on their turn. And the player's level <b>only opens at the Ceremony</b>: you bet on the name!</> : <>Empatou no maior lance? Tem <b>desempate</b>. Sobrou sem lance? Vai pro <b>monte</b> — cada técnico pode pegar na sua vez. E o nível do jogador <b>só abre na Cerimônia</b>: você aposta no nome!</>}</p>
        </div>
        {/* um card por modo — só o que muda */}
        {modos.map(([ic, t, d]) => (
          <div key={t} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, border: `2.5px solid ${INK}`, borderRadius: 12, padding: '9px 10px', marginBottom: 7, background: '#FCFBF4', boxShadow: `2.5px 2.5px 0 0 ${INK}` }}>
            <span style={{ fontSize: 20, lineHeight: 1 }}>{ic}</span>
            <div>
              <p style={{ fontWeight: 900, fontSize: 13, ...OSWALD, margin: 0, textTransform: 'uppercase' }}>{t}</p>
              <p style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,.6)', margin: '1px 0 0', lineHeight: 1.35 }}>{d}</p>
            </div>
          </div>
        ))}
        <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,.45)', textAlign: 'center', margin: '9px 2px 0' }}>{t('Outros modos entram no manual quando forem liberados. 😉', 'Other modes join the handbook when they are released. 😉')}</p>
        </>)}
      </div>
    </div>
  )
}

// ─── 🎙️ NARRADOR DA PRIMEIRA PARTIDA ─────────────────────────────────
// Balãozinho de dica que aparece UMA vez em cada fase do primeiro leilão
// (envelope → revelação → monte) e some pra sempre depois do "entendi".
// "pular todas" desliga o narrador de vez. Guarda no aparelho (localStorage).
function NarradorDica({ fase, texto }: { fase: string; texto: string }) {
  const K = `esc-dica-${fase}`, KOFF = 'esc-dicas-off'
  const [vista, setVista] = useState<boolean>(() => { try { return !!(localStorage.getItem(K) || localStorage.getItem(KOFF)) } catch { return true } })
  if (vista) return null
  const marca = (tudo: boolean) => { try { localStorage.setItem(K, '1'); if (tudo) localStorage.setItem(KOFF, '1') } catch { /* segue */ } setVista(true) }
  return (
    <div style={{ border: `3px solid ${INK}`, borderRadius: 13, borderBottomLeftRadius: 4, background: '#fff', boxShadow: `3px 3px 0 0 ${INK}`, padding: '9px 11px', marginBottom: 10 }}>
      <span style={{ display: 'inline-block', fontWeight: 900, fontSize: 9, ...OSWALD, textTransform: 'uppercase', background: GOLD, border: `2px solid ${INK}`, borderRadius: 999, padding: '1px 8px', marginBottom: 5 }}>{tr('🎙️ Narrador', '🎙️ Commentator')}</span>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 800, lineHeight: 1.35 }}>{texto}</p>
      <div style={{ display: 'flex', gap: 8, marginTop: 7, alignItems: 'center' }}>
        <button onClick={() => marca(false)} style={{ border: `2.5px solid ${INK}`, borderRadius: 9, background: GREEN, color: '#fff', fontWeight: 900, fontSize: 11, ...OSWALD, padding: '4px 12px', boxShadow: `2px 2px 0 0 ${INK}`, cursor: 'pointer', textTransform: 'uppercase' }}>{tr('✅ Entendi', '✅ Got it')}</button>
        <button onClick={() => marca(true)} style={{ border: 'none', background: 'transparent', fontSize: 10, fontWeight: 800, color: 'rgba(0,0,0,.45)', cursor: 'pointer', textDecoration: 'underline' }}>{tr('pular todas as dicas', 'skip all tips')}</button>
      </div>
    </div>
  )
}

// ─── SETUP ───────────────────────────────────────────────────────────
export function EscSetup() {
  const { state, dispatch } = useEsc()
  const t = useT() // 🌐 BR/EN
  const career = state.careerIntent
  const privatePreview = useOnlinePreview() && PRESIDENT_EDITOR_RELEASED
  const [name, setName] = useState('')
  const [formation, setFormation] = useState<FormationKey>('4-3-3')
  const [rivals, setRivals] = useState(5)
  const [league, setLeague] = useState<'br' | 'eu' | 'both'>('br') // baralho: 🇧🇷 Brasileirão, 🌍 Liga Europa ou 🌎 os dois juntos
  const [copaMode, setCopaMode] = useState<'liga' | 'liga_copa' | 'liga_liberta'>('liga_copa') // rápido offline: liga só, liga + copa dos 8 ou liga + Libertadores
  // 🌎 a Libertadores também aparece no rápido OFFLINE — é onde dá pra testar
  // sozinho, sem juntar 8 pessoas. Mesma trava de conta do online.
  const libertaOn = useLibertaLiberada()
  // carreira: quais times da Série D viram seus rivais fixos (vazio = os padrões).
  // Ao selecionar mais que o número escolhido, o mais antigo sai (fila).
  const [rivalPicks, setRivalPicks] = useState<string[]>([])
  const [privateStep, setPrivateStep] = useState<1 | 2 | 3>(1)
  const [presidentName, setPresidentName] = useState('')
  const [presidentOutfit, setPresidentOutfit] = useState<'casual' | 'polo' | 'social' | 'terno'>('terno')
  const toggleRival = (team: string) => setRivalPicks(prev => {
    if (prev.includes(team)) return prev.filter(t => t !== team)
    const next = [...prev, team]
    return next.length > rivals ? next.slice(next.length - rivals) : next
  })
  // conta = fonte única do nome do time. Se logado, o nome vem do cadastro
  // (mesmo do online) e é editável aqui; ao começar, sincroniza de volta pra
  // conta — então trocar num lugar troca em todos (CPU, carreira, online, stats).
  const [accountName, setAccountName] = useState<string | null>(null) // null = deslogado
  const [nameErr, setNameErr] = useState('') // 🔒 nome único: aviso quando o nome já tem dono
  useEffect(() => {
    let alive = true
    const apply = (u: { user_metadata?: Record<string, unknown> } | null | undefined) => {
      if (!alive) return
      if (!u) { setAccountName(null); return }
      const dn = ((u.user_metadata?.display_name as string) ?? '').trim()
      setAccountName(dn)
      if (dn) setName(prev => prev.trim() ? prev : dn) // pré-preenche sem sobrescrever o que a pessoa já digitou
    }
    supabase.auth.getUser().then(({ data }) => apply(data?.user))
    const { data: sub } = supabase.auth.onAuthStateChange((_, s) => apply(s?.user))
    return () => { alive = false; sub.subscription.unsubscribe() }
  }, [])

  async function start() {
    const clean = stripEmoji(name).trim()
    // logado e o nome mudou? sincroniza o cadastro → vale no online e nas stats
    if (accountName !== null && clean && clean !== accountName) {
      // 🔒 nome único (tipo @ do Instagram): nome de outra conta ou batismo alheio não passa
      const chk = await nomeLivre(clean)
      if (!chk.livre) { setNameErr(NOME_MSG[chk.motivo ?? 'em_uso']); return }
      setNameErr('')
      try { await supabase.auth.updateUser({ data: { display_name: clean } }) } catch { /* não trava o jogo */ }
    }
    // rivais escolhidos + completa com os padrões da Série D se faltar.
    // 🪞 SEM SE ENFRENTAR (19/08, print do Diego): o preenchimento automático pegava
    // os primeiros clubes da Série D — e o clube do PRÓPRIO jogador está lá. Deu
    // dois "Neymarzetti" na mesma tabela, um dele e um robô. Aqui o seu clube sai
    // da lista de rivais; a trava final está no `makeCareerManagers`.
    const meuNome = stripEmoji(clean).trim().toLowerCase()
    const naoSouEu = (t: string) => stripEmoji(t).trim().toLowerCase() !== meuNome
    const picks = career
      ? [...rivalPicks.filter(naoSouEu), ...TIMES_ELITE.map(t => t.team).filter(t => !rivalPicks.includes(t) && naoSouEu(t))].slice(0, rivals)
      : undefined
    // carreira offline = pirâmide de 4 divisões (baralho sempre BR + Europa juntos).
    // O modo rápido (career=false) segue no START normal com o baralho escolhido.
    if (career) {
      // 🪜 VÁRIOS SAVES: guarda a carreira ATUAL no arquivo (não apaga!) antes de
      // começar a nova. A nova vira a ativa; a antiga fica em "Minhas Carreiras".
      stashActiveBeforeNew()
      dispatch({
        type: 'START_CAREER_SOLO', teamName: clean, formation, rivals,
        rivalTeams: picks, league: 'both', intro: true,
        president: privatePreview ? { name: stripEmoji(presidentName).trim() || 'Presidente', outfit: presidentOutfit } : undefined,
      })
    }
    else dispatch({ type: 'START', teamName: clean, formation, rivals, career, rivalTeams: picks, league, copaMode, intro: true })
  }
  if (career && privatePreview) {
    const outfits = [
      ['casual', tr('INÍCIO', 'CASUAL'), presidentCasual],
      ['polo', tr('CLUBE', 'CLUB'), presidentPolo],
      ['social', tr('SOCIAL', 'SMART'), presidentSocial],
      ['terno', tr('TERNO', 'SUIT'), presidentTerno],
    ] as const
    const activePresident = outfits.find(([id]) => id === presidentOutfit)?.[2] ?? presidentTerno
    const nextFromClub = () => {
      if (!stripEmoji(name).trim()) { setNameErr(tr('Digite o nome do clube.', 'Type the club name.')); return }
      setNameErr(''); setPrivateStep(2)
    }
    const nextFromPresident = () => setPrivateStep(3)
    return (
      <Shell className="ll-career-onboarding" hideExit>
        <main className={`ll-career-setup ll-career-step-${privateStep}`} style={{ '--career-room': `url(${careerSetupRoom})` } as CSSProperties}>
          <header className="ll-career-setup-head">
            <span>● {tr('TEMPORADA 1 · VÁRZEA', 'SEASON 1 · VÁRZEA')}</span>
            <b>LEILÃO LEGENDS</b>
          </header>

          {privateStep === 1 && (
            <section className="ll-career-club-step">
              <div className="ll-career-copy">
                <h1>{tr('CRIE SEU CLUBE', 'CREATE YOUR CLUB')}</h1>
                <p>{tr('O primeiro capítulo da sua carreira.', 'The first chapter of your career.')}</p>
              </div>
              <img className="ll-career-founder" src={presidentPolo} alt={tr('Presidente provisório do clube', 'Interim club president')} />
              <div className="ll-career-control ll-career-club-control">
                <h2>{tr('COMO SEU CLUBE VAI SE CHAMAR?', 'WHAT WILL YOUR CLUB BE CALLED?')}</h2>
                <label>{tr('NOME DO CLUBE', 'CLUB NAME')}</label>
                <input value={name} onChange={e => { setName(stripEmoji(e.target.value)); setNameErr('') }} placeholder={tr('Ex.: Lendas FC', 'E.g.: Legends FC')} />
                {nameErr && <p className="ll-career-error">{nameErr}</p>}
                <label>{tr('FORMAÇÃO INICIAL', 'STARTING FORMATION')}</label>
                <div className="ll-career-choice-grid">
                  {(['4-3-3', '4-4-2'] as FormationKey[]).map(f => (
                    <button key={f} onClick={() => setFormation(f)} className={formation === f ? 'is-selected' : ''}>{f}</button>
                  ))}
                </div>
                <p className="ll-career-note">{tr('Cores e escudo simples são gerados automaticamente pelo jogo.', 'Colors and a simple crest are generated automatically by the game.')}</p>
              </div>
              <div className="ll-career-actions">
                <button className="ll-secondary" onClick={() => dispatch({ type: 'GO_LOBBY' })}>{tr('VOLTAR', 'BACK')}</button>
                <button className="ll-primary" onClick={nextFromClub}>{tr('CRIAR CLUBE', 'CREATE CLUB')}</button>
              </div>
            </section>
          )}

          {privateStep === 2 && (
            <section className="ll-career-president-step">
              <div className="ll-career-copy">
                <button className="ll-career-backlink" onClick={() => setPrivateStep(1)}>{tr('‹ VOLTAR AO CLUBE', '‹ BACK TO THE CLUB')}</button>
                <h1>{tr('CRIE SEU PRESIDENTE', 'CREATE YOUR PRESIDENT')}</h1>
                <p>{tr('Monte o dirigente que vai representar seu clube.', 'Build the executive who will represent your club.')}</p>
              </div>
              <div className="ll-president-stage"><img src={activePresident} alt={tr('Prévia do presidente', 'President preview')} /></div>
              <div className="ll-career-control ll-president-controls">
                <label>{tr('NOME DO PRESIDENTE', 'PRESIDENT NAME')}</label>
                <input value={presidentName} onChange={e => setPresidentName(stripEmoji(e.target.value))} placeholder={tr('Ex.: Ricardo Silva', 'E.g.: John Smith')} />
                <label>{tr('ROUPA', 'OUTFIT')}</label>
                <div className="ll-outfit-grid">
                  {outfits.map(([id, label, src]) => (
                    <button key={id} onClick={() => setPresidentOutfit(id)} className={presidentOutfit === id ? 'is-selected' : ''}>
                      <img src={src} alt="" /><span>{label}</span>
                    </button>
                  ))}
                </div>
                <p className="ll-career-note">{tr('Você poderá editar o visual novamente pela Sala da Presidência.', 'You can edit the look again from the President\'s Office.')}</p>
              </div>
              <div className="ll-career-actions">
                <button className="ll-secondary" onClick={() => setPrivateStep(1)}>{tr('VOLTAR', 'BACK')}</button>
                <button className="ll-primary" onClick={nextFromPresident}>{tr('CONTINUAR', 'CONTINUE')}</button>
              </div>
            </section>
          )}

          {privateStep === 3 && (
            <section className="ll-career-rivals-step">
              <div className="ll-career-copy">
                <button className="ll-career-backlink" onClick={() => setPrivateStep(2)}>{tr('‹ VOLTAR AO PRESIDENTE', '‹ BACK TO THE PRESIDENT')}</button>
                <h1>{tr('PREPARE O PREGÃO', 'SET UP THE AUCTION')}</h1>
                <p>{tr('Escolha quem disputa os envelopes com você.', 'Choose who fights for the envelopes with you.')}</p>
              </div>
              <div className="ll-career-control ll-rivals-control">
                <label>{tr('RIVAIS NO PREGÃO', 'RIVALS AT THE AUCTION')}</label>
                <div className="ll-career-choice-grid ll-four">
                  {[3, 5, 7, 9].map(n => <button key={n} onClick={() => setRivals(n)} className={rivals === n ? 'is-purple' : ''}>{n}</button>)}
                </div>
                <p className="ll-career-note">{tr('Mais rivais significam mais disputa pelos mesmos jogadores. A liga continua com 20 clubes.', 'More rivals means more competition for the same players. The league still has 20 clubs.')}</p>
                <label>{tr('RIVAIS PARA A CARREIRA', 'RIVALS FOR THE CAREER')} <small>{rivalPicks.length}/{rivals}</small></label>
                <div className="ll-rival-list">
                  {TIMES_ELITE.map(t => {
                    const on = rivalPicks.includes(t.team)
                    return <button key={t.team} onClick={() => toggleRival(t.team)} className={on ? 'is-selected' : ''}>{on ? '🔥 ' : ''}{t.team}</button>
                  })}
                </div>
                <button className="ll-random-rivals" onClick={() => setRivalPicks([])}>{tr('🎲 USAR RIVAIS PADRÃO', '🎲 USE DEFAULT RIVALS')}</button>
              </div>
              <div className="ll-career-actions">
                <button className="ll-secondary" onClick={() => setPrivateStep(2)}>{tr('VOLTAR', 'BACK')}</button>
                <button className="ll-primary" onClick={() => void start()}>{tr('IR PARA O PREGÃO 🔨', 'GO TO THE AUCTION 🔨')}</button>
              </div>
            </section>
          )}
        </main>
      </Shell>
    )
  }
  return (
    <Shell>
      <button onClick={() => dispatch({ type: 'GO_LOBBY' })}
        className="flex items-center gap-1 text-black/60 font-black text-sm pt-4 -mb-2 active:opacity-60" style={OSWALD}>
        <span className="text-lg leading-none">🏠</span> {t('Voltar ao início', 'Back to start')}
      </button>
      <h2 className="font-black text-3xl pt-2" style={OSWALD}>{career ? (escadaLiberada() ? t('🪜 CARREIRA · VÁRZEA', '🪜 CAREER · SUNDAY LEAGUE') : t('🪜 CARREIRA · SÉRIE D', '🪜 CAREER · TIER D')) : t('MONTE SUA SALA', 'SET UP YOUR ROOM')}</h2>
      {career && <p className="text-sm font-bold text-black/60 -mt-1">{escadaLiberada()
        ? t('Comece na VÁRZEA (5ª divisão, peladão raiz) e suba até a Série A. O mercado sobe junto com você — de perna-de-pau a lenda. Dá pra salvar e voltar depois.', 'Start in the SUNDAY LEAGUE (5th tier, park football) and climb to the top flight. The market grows with you — from park player to legend. You can save and come back later.')
        : t('Comece na Série D e suba até a A. O leilão é o mesmo — o que muda é subir de divisão a cada temporada. Dá pra salvar e voltar depois.', 'Start in Tier D and climb to the top. Same auction — what changes is moving up a division every season. You can save and come back later.')}</p>}
      {career && (
        <Box bg="#FFF6DE" className="p-4 space-y-1.5">
          <p className="font-black text-sm" style={OSWALD}>{t('⚡ Como funciona a Carreira', '⚡ How Career mode works')}</p>
          <p className="text-xs font-bold text-black/75">🪜 {getLang() === 'en' ? (escadaLiberada() ? <><b>5-tier pyramid:</b> start in VÁRZEA (grassroots park football 🍺) and climb to Série A — up or down every season, based on your finish.</> : <><b>4-tier pyramid:</b> start in Série D and climb to A — up or down every season, based on your finish.</>) : escadaLiberada() ? <><b>Pirâmide de 5 divisões:</b> começa na VÁRZEA (peladão raiz 🍺) e sobe até a Série A — sobe ou desce a cada temporada, conforme sua colocação.</> : <><b>Pirâmide de 4 divisões:</b> começa na Série D e sobe até a A — sobe ou desce a cada temporada, conforme sua colocação.</>}</p>
          <p className="text-xs font-bold text-black/75">🔨 <b>{t('Mesmo leilão do modo rápido:', 'Same auction as quick match:')}</b> {t('monta o time no pregão e disputa o campeonato de 38 rodadas.', 'build your squad at the auction and play a 38-round league.')}</p>
          <p className="text-xs font-bold text-black/75">🔥 <b>{t('Rivais pra vida toda:', 'Rivals for life:')}</b> {t('têm vida própria na pirâmide e só te enfrentam quando estão na sua divisão.', 'they live their own life in the pyramid and only face you when they are in your division.')}</p>
          <p className="text-xs font-bold text-black/75">🏆 <b>{t('Títulos acumulam:', 'Titles stack up:')}</b> {t('cada título da Série A vira uma ⭐ no seu escudo.', 'every top-flight title becomes a ⭐ on your crest.')}</p>
          <p className="text-xs font-bold text-black/75">💾 <b>{t('Salva e continua:', 'Save and continue:')}</b> {t('pare e volte depois, em qualquer aparelho.', 'stop and come back later, on any device.')}</p>
        </Box>
      )}
      <Box className="p-4 space-y-4">
        {career ? (
          <div className="border-[3px] border-black rounded-xl p-3" style={{ background: '#EAF3FF' }}>
            <p className="font-black text-sm" style={OSWALD}>{escadaLiberada() ? tr('🌎 Baralho: Brasileirão + Europa + MUNDO juntos', '🌎 Deck: Brasileirão + Europe + WORLD together') : tr('🌎 Baralho fixo: Brasileirão + Europa juntos', '🌎 Fixed deck: Brasileirão + Europe together')}</p>
            <p className="text-[11px] font-bold text-black/65 mt-1">{getLang() === 'en' ? (escadaLiberada() ? <>In Career the deck is <b>Brasileirão + Europe + World together</b> (~850 names) — it takes all of them to properly fill the <b>100 teams across 5 tiers</b> (from Várzea to Série A). Each tier's market only trades its own categories.</> : <>In Career the deck is always the <b>Brasileirão peaks + the Europe peaks together</b> (~700 names) — it takes both to properly fill the <b>80 teams across 4 tiers</b>. There is no BR-only or Europe-only deck here.</>) : escadaLiberada() ? <>Na Carreira o baralho é <b>Brasileirão + Europa + Mundo juntos</b> (~850 nomes) — precisa de todos pra preencher bem os <b>100 times das 5 divisões</b> (da Várzea à Série A). O mercado de cada divisão só negocia as categorias dela.</> : <>Na Carreira o baralho é sempre os <b>auges do Brasileirão + os auges da Europa juntos</b> (~700 nomes) — precisa dos dois pra preencher bem os <b>80 times das 4 divisões</b>. Não tem baralho só BR nem só Europa por aqui.</>}</p>
          </div>
        ) : (
        <div>
          <p className="text-xs font-black uppercase mb-1">{t('Baralho de craques', 'Player deck')}</p>
          <div className="grid grid-cols-2 gap-2">
            {([['br', t('🇧🇷 Brasileirão', '🇧🇷 Brazil')], ['eu', t('🌍 Liga Europa', '🌍 Europe')]] as const).map(([id, label]) => (
              <button key={id} onClick={() => setLeague(id)}
                className="border-[3px] border-black rounded-xl py-2.5 font-black text-sm"
                style={{ backgroundColor: league === id ? GOLD : '#fff', boxShadow: league === id ? `3px 3px 0 0 ${INK}` : 'none', ...OSWALD }}>
                {label}
              </button>
            ))}
          </div>
          <button onClick={() => setLeague('both')}
            className="w-full mt-2 border-[3px] border-black rounded-xl py-2.5 font-black text-sm"
            style={{ backgroundColor: league === 'both' ? GOLD : '#fff', boxShadow: league === 'both' ? `3px 3px 0 0 ${INK}` : 'none', ...OSWALD }}>
            {t('🌎 Todos juntos (BR + Europa + Mundo)', '🌎 All together (Brazil + Europe + World)')}
          </button>
          <p className="text-[11px] font-semibold text-black/55 mt-1">{league === 'br' ? t('Auges do futebol brasileiro — de Pelé a Obina.', 'Peak years of Brazilian football — from Pelé to Obina.') : league === 'eu' ? t('Auges nos clubes europeus — de Yashin a Mbappé.', 'Peak years at European clubs — from Yashin to Mbappé.') : t('Brasileirão + Europa juntos (~700 nomes) — craques e folclóricos dos dois lados no mesmo martelo.', 'Brazil + Europe together (~700 names) — stars and cult heroes from both sides under the same hammer.')}</p>
          {league === 'br' && <p className="text-[11px] font-bold mt-0.5" style={{ color: '#8a6d1f' }}>{t('🃏 Quer resenha? Só aqui tem até o Walter Minhoca.', '🃏 Want a laugh? Only here you find even Walter Minhoca.')}</p>}
        </div>
        )}
        {!career && (
          <div>
            <p className="text-xs font-black uppercase mb-1">{t('Depois da liga', 'After the league')}</p>
            <div className={`grid gap-2 ${libertaOn ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {((libertaOn
                ? [['liga_copa', t('🏆 Liga + Copa', '🏆 League + Cup')], ['liga_liberta', t('🌎 Liga + Liberta', '🌎 League + Copa Lib')], ['liga', t('📊 Só Liga', '📊 League only')]]
                : [['liga_copa', t('🏆 Liga + Copa', '🏆 League + Cup')], ['liga', t('📊 Só Liga', '📊 League only')]]) as ['liga_copa' | 'liga_liberta' | 'liga', string][]).map(([m, label]) => (
                <button key={m} onClick={() => setCopaMode(m)}
                  className={`border-[3px] border-black rounded-xl py-2.5 font-black ${libertaOn ? 'text-[12px] px-1' : 'text-sm'}`}
                  style={{ backgroundColor: copaMode === m ? GOLD : '#fff', boxShadow: copaMode === m ? `3px 3px 0 0 ${INK}` : 'none', ...OSWALD }}>
                  {label}
                </button>
              ))}
            </div>
            <p className="text-[11px] font-semibold text-black/55 mt-1">{copaMode === 'liga_liberta' ? t('🌎 Quando a liga acaba, os 8 primeiros entram na Libertadores com 24 clubes do continente: 8 grupos de 4, passam 2, mata-mata até a final única. Nesta partida NÃO tem Copa dos 8.', '🌎 When the league ends, the top 8 join the continental cup with 24 clubs: 8 groups of 4, top 2 advance, knockouts to a single final. This match has NO Cup of 8.') : copaMode === 'liga_copa' ? t('🏆 Quando a liga acaba, os 8 primeiros disputam a Copa (ida e volta, final única) antes do fim de jogo.', '🏆 When the league ends, the top 8 play the Cup (two legs, single final) before the game is over.') : t('📊 Termina a liga e já mostra o resultado — jogo mais curto.', '📊 League ends and the result comes straight away — a shorter game.')}</p>
          </div>
        )}
        <div>
          <p className="text-xs font-black uppercase mb-1">{t('Nome do seu time', 'Your team name')}</p>
          <input
            value={name}
            onChange={e => { setName(stripEmoji(e.target.value)); if (nameErr) setNameErr('') }}
            placeholder={t('Ex.: Bagres do Asfalto', 'e.g. Asphalt Catfish')}
            className="w-full border-[3px] border-black rounded-xl px-3 py-2 font-bold bg-white"
          />
          {nameErr && <p className="text-[11px] font-bold mt-1" style={{ color: '#C2452F' }}>{nameErr}</p>}
          {accountName !== null && (
            <p className="text-[11px] font-semibold text-black/55 mt-1">{t('🔗 É o nome da sua conta — vale no CPU, na carreira e no online. Se editar aqui, troca em todos os lugares (e nas estatísticas).', '🔗 This is your account name — it counts vs CPU, in career and online. Editing here changes it everywhere (stats included).')}</p>
          )}
        </div>
        <div>
          <p className="text-xs font-black uppercase mb-1">{t('Formação (travada antes do pregão)', 'Formation (locked before the auction)')}</p>
          <div className="grid grid-cols-4 gap-2">
            {/* INÍCIO: só 4-3-3 e 4-4-2 (base do leilão). O 4-5-1 é troca TÁTICA na
                carreira depois — nunca no começo. */}
            {(['4-3-3', '4-4-2'] as FormationKey[]).map(f => (
              <button key={f} onClick={() => setFormation(f)}
                className="border-[3px] border-black rounded-xl py-2 font-black text-sm"
                style={{ backgroundColor: formation === f ? GOLD : '#fff', boxShadow: formation === f ? `3px 3px 0 0 ${INK}` : 'none', ...OSWALD }}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-black uppercase mb-1">{t('Rivais na sala (CPUs)', 'Rivals in the room (CPUs)')}</p>
          <div className="grid grid-cols-4 gap-2">
            {[3, 5, 7, 9].map(n => (
              <button key={n} onClick={() => setRivals(n)}
                className="border-[3px] border-black rounded-xl py-2 font-black text-sm"
                style={{ backgroundColor: rivals === n ? PURPLE : '#fff', color: rivals === n ? '#fff' : INK, boxShadow: rivals === n ? `3px 3px 0 0 ${INK}` : 'none', ...OSWALD }}>
                {n}
              </button>
            ))}
          </div>
          <p className="text-[11px] font-semibold text-black/60 mt-1.5 leading-snug"><b>{t('Mais rivais:', 'More rivals:')}</b> {t('mais técnicos brigando no leilão e maior variedade de jogadores.', 'more managers fighting at the auction and a wider spread of players.')} <b>{t('Menos rivais:', 'Fewer rivals:')}</b> {t('menos técnicos brigando e jogo mais rápido.', 'fewer managers fighting and a quicker game.')}</p>
        </div>
        {career && (
          <div>
            <p className="text-xs font-black uppercase mb-1">{t('🔥 Escolha seus rivais', '🔥 Pick your rivals')} <span className="text-black/50">({rivalPicks.length}/{rivals})</span></p>
            <p className="text-[11px] font-semibold text-black/55 mb-1.5">{t('Eles serão seus rivais pra vida toda.', 'They will be your rivals for life.')}</p>
            <div className="flex flex-wrap gap-1.5">
              {TIMES_ELITE.map(t => {
                const on = rivalPicks.includes(t.team)
                return (
                  <button key={t.team} onClick={() => toggleRival(t.team)}
                    className="border-2 border-black rounded-lg px-2 py-1 font-black text-[11px] active:translate-y-0.5"
                    style={{ backgroundColor: on ? '#E8503A' : '#fff', color: on ? '#fff' : INK }}>
                    {on ? '🔥 ' : ''}{t.team}
                  </button>
                )
              })}
            </div>
            <button onClick={() => setRivalPicks([])} className="mt-2 border-2 border-black rounded-lg px-2.5 py-1 font-black text-[11px] bg-white active:translate-y-0.5" style={OSWALD}>
              {t('🎲 Não escolher — usar rivais padrão', '🎲 Skip — use the default rivals')}
            </button>
          </div>
        )}
        {career && <p className="text-xs font-semibold text-black/70">{t('🏟️ A liga completa 20 times com os clássicos — você disputa a divisão contra os CPUs do leilão.', '🏟️ The league fills up to 20 teams with the classic clubs — you play the division against the auction CPUs.')}</p>}
      </Box>
      <Btn onClick={start} className="w-full text-lg" bg={GREEN}>
        <span className="text-white">{career ? t('AVANÇAR 🪜', 'CONTINUE 🪜') : t('AVANÇAR 🔨', 'CONTINUE 🔨')}</span>
      </Btn>
      {/* carreira antiga (só pra quem já tinha um save no formato antigo poder
          terminar). O "Continuar carreira" da pirâmide NÃO entra aqui de propósito:
          na tela de setup ele criava um LOOP (save travado no próprio setup →
          tocar em continuar voltava pro setup). Continuar a pirâmide é na HOME. */}
      {career && <CareerContinueBanner />}
      <CardAccountNote />
    </Shell>
  )
}

// Aviso na home/setup: jogar não precisa de conta, mas só quem tem cadastro
// leva a carta-lembrança pro álbum sendo campeão. Toca → abre já no cadastro.
export function CardAccountNote() {
  const { dispatch } = useEsc()
  const [email, setEmail] = useState<string | null | undefined>(undefined)
  const [name, setName] = useState('')
  useEffect(() => {
    let alive = true
    supabase.auth.getUser().then(({ data }) => { if (!alive) return; setEmail(data?.user?.email ?? null); setName((data?.user?.user_metadata?.display_name as string) ?? '') })
    const { data: sub } = supabase.auth.onAuthStateChange((_, s) => { setEmail(s?.user?.email ?? null); setName((s?.user?.user_metadata?.display_name as string) ?? '') })
    return () => { alive = false; sub.subscription.unsubscribe() }
  }, [])

  if (email === undefined) return null
  if (email) {
    return (
      <p className="text-center text-xs font-bold text-black/50 px-2">
        {tr('✅ Logado', '✅ Signed in')}{name ? ` ${tr('como', 'as')} ${name}` : ''} — {tr('sendo campeão você leva uma carta-lembrança pro álbum 🎴', 'become champion and you take a keepsake card to the album 🎴')}
      </p>
    )
  }
  const goRegister = () => {
    try { localStorage.setItem('esc_open_register', '1') } catch { /* ignora */ }
    dispatch({ type: 'GO_LOBBY_ONLINE' })
  }
  return (
    <button onClick={goRegister} className="w-full rounded-2xl border-[3px] border-black p-3.5 text-left active:translate-y-0.5"
      style={{ background: '#FFF7DB', boxShadow: `3px 3px 0 0 ${INK}` }}>
      <p className="font-black text-sm" style={OSWALD}>{tr('🎴 Colecione craques — faça seu cadastro', '🎴 Collect stars — sign up')}</p>
      <p className="text-xs font-semibold text-black/75 mt-1">
        {getLang() === 'en' ? <><b>With an account:</b> become champion (vs CPU or online) and you win a <b>limited collectible star</b> for your album.</> : <><b>Com conta:</b> sendo campeão (no CPU ou online) você ganha um <b>craque colecionável limitado</b> pro seu álbum.</>}
      </p>
      <p className="text-xs font-semibold text-black/60 mt-0.5">
        {getLang() === 'en' ? <><b>Without an account:</b> play as much as you like, but <b>no card</b>.</> : <><b>Sem conta:</b> joga à vontade, mas <b>não ganha carta</b>.</>}
      </p>
      <p className="text-xs font-black mt-1.5" style={{ color: GREEN, ...OSWALD }}>{tr('👉 Toque aqui pra criar sua conta', '👉 Tap here to create your account')}</p>
    </button>
  )
}

// ─── STREAM: tela explicativa antes do pregão (só no modo stream) ────
// O leilão do stream NÃO começa direto: primeiro esta tela explica pra quem
// está assistindo como funciona (moedas = lance, maior lance leva, o auge com
// o exemplo do Kaká) e mostra quem está jogando. O STREAMER (host) toca
// "Começar o leilão" quando quiser. Convidados só esperam o host.
export function EscStreamIntro() {
  const { state, dispatch } = useEsc()
  const online = state.onlineMode === 'online'
  const isCareer = !!state.careerOnline // 🏆 banner "vira o clube mais bem-sucedido" — na carreira solo E online
  const isHost = !online || state.isHost
  const you = state.managers[state.youIdx]
  const humans = state.managers.filter(m => m.isHuman)
  // cor do apoiador pelo selo no nome (igual ao lobby): 👑 ouro · ⭐ prata · 💎 roxo
  const perkColor = (name: string) => name.includes('👑') ? APOIO_PERKS.ouro : name.includes('⭐') ? APOIO_PERKS.prata : name.includes('💎') ? APOIO_PERKS.roxo : null
  return (
    <Shell>
      {isCareer && (
        <div style={{ position: 'relative', overflow: 'hidden', border: `3px solid ${INK}`, borderRadius: 18, boxShadow: `5px 5px 0 0 ${INK}`, background: 'linear-gradient(160deg,#141414,#26313d)', color: '#fff', padding: '20px 18px 22px' }}>
          <div style={{ position: 'absolute', inset: 'auto -30% -60% -30%', height: 220, background: 'radial-gradient(closest-side, rgba(245,179,1,.30), transparent 70%)', pointerEvents: 'none' }} />
          <span style={{ ...OSWALD, fontWeight: 800, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: GOLD, position: 'relative' }}>{escadaLiberada() ? tr('Várzea → o topo', 'Várzea → the top') : tr('Série D → o topo', 'Série D → the top')}</span>
          <h1 style={{ ...OSWALD, fontWeight: 800, fontSize: 30, lineHeight: .97, margin: '12px 0 0', position: 'relative' }}>{getLang() === 'en' ? <>It's not just lifting <span style={{ color: GOLD }}>trophies.</span><br />It's becoming the most <span style={{ color: GOLD }}>successful club.</span></> : <>Não é só levantar <span style={{ color: GOLD }}>taça.</span><br />É virar o clube mais <span style={{ color: GOLD }}>bem-sucedido.</span></>}</h1>
          <p style={{ fontSize: 13.5, lineHeight: 1.45, color: 'rgba(255,255,255,.82)', margin: '10px 0 0', fontWeight: 500, position: 'relative' }}>{getLang() === 'en' ? <>You take over a grassroots club and climb the pyramid. But success here isn't just titles: it's <b style={{ color: '#fff' }}>managing</b> — filling the till, building assets (stadium, SAF) and dominating on and off the pitch.</> : <>Você assume um clube na várzea e sobe na pirâmide. Mas sucesso aqui não é só título: é <b style={{ color: '#fff' }}>administrar</b> — encher o caixa, construir patrimônio (estádio, SAF) e dominar dentro e fora de campo.</>}</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, marginTop: 15, position: 'relative' }}>
            {([['D', 26], ['C', 38], ['B', 52]] as [string, number][]).map(([l, h]) => (
              <div key={l} style={{ flex: 1, border: '2px solid rgba(255,255,255,.85)', borderRadius: '5px 5px 0 0', background: 'rgba(255,255,255,.08)', height: h, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', ...OSWALD, fontWeight: 700, fontSize: 11, color: '#fff', paddingBottom: 3 }}>{l}</div>
            ))}
            <div style={{ flex: 1, border: `2px solid ${INK}`, borderRadius: '5px 5px 0 0', background: GOLD, height: 70, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', ...OSWALD, fontWeight: 700, fontSize: 11, color: INK, paddingBottom: 3 }}>A 👑</div>
          </div>
        </div>
      )}
      <div className="text-center pt-4">
        <span className="inline-block border-2 border-black rounded-full px-3 py-1 text-[11px] font-black uppercase" style={{ backgroundColor: GOLD, boxShadow: `3px 3px 0 ${INK}`, ...OSWALD }}>{state.streamMode ? tr('🎥 Modo Stream', '🎥 Stream Mode') : tr('🔨 Como funciona', '🔨 How it works')}</span>
        <h2 className="font-black text-3xl mt-3 leading-none" style={OSWALD}>{getLang() === 'en' ? <>WELCOME<br />TO THE AUCTION! 🔨</> : <>BEM-VINDO<br />AO PREGÃO! 🔨</>}</h2>
        <p className="text-sm font-semibold text-black/60 mt-2">{tr('Antes de começar, entenda o leilão às cegas — pra quem tá chegando agora.', 'Before you start, understand the blind auction — for those just arriving.')}</p>
      </div>

      <Box bg={GOLD} className="p-4" shadow={6}>
        <p className="font-black text-lg" style={OSWALD}>{tr('🪙 Moedas = seu lance', '🪙 Coins = your bid')}</p>
        <p className="text-sm font-bold text-black/75 mt-1 leading-snug">{getLang() === 'en' ? <>Each manager starts with <b>100 coins</b>. You place a <b>secret bid</b> (nobody sees) on each player. At the reveal: <b>the HIGHEST bid takes the star</b> and pays what it offered. Tie? Blind re-bid! ⚔️</> : <>Cada técnico começa com <b>100 moedas</b>. Você dá um <b>lance secreto</b> (ninguém vê) em cada jogador. Na revelação: <b>quem deu o MAIOR lance leva o craque</b> e paga o que ofertou. Empate? Re-lance às cegas! ⚔️</>}</p>
      </Box>

      {/* 👇 mock da linha do jogador: mostra ONDE se põe as moedas (com 7, não 1!)
          e aponta o clube/ano — muita gente aposta só 1 por não entender. */}
      <Box bg="#fff" className="p-3.5" shadow={6}>
        <p className="font-black text-base mb-2" style={OSWALD}>{tr('👇 É AQUI que você bota as moedas', '👇 THIS is where you put the coins')}</p>
        <div className="border-[3px] border-black rounded-xl p-3 flex items-center justify-between gap-2" style={{ boxShadow: `3px 3px 0 0 ${INK}` }}>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-black rounded-lg text-white" style={{ ...OSWALD, background: INK, fontSize: 11, padding: '2px 7px' }}>GOL</span>
              <span className="font-black text-sm truncate" style={OSWALD}>Alex Muralha</span>
            </div>
            <p className="text-xs font-bold mt-0.5" style={{ color: '#B25AD0' }}>⬅️ Flamengo · 2017 <span className="text-black/45">{tr('(clube e ano)', '(club and year)')}</span></p>
          </div>
          <div className="flex flex-col items-center flex-shrink-0">
            <span className="text-[9px] font-black uppercase tracking-wide mb-0.5" style={{ color: '#B8860B' }}>{tr('seu lance', 'your bid')}</span>
            <div className="flex items-center gap-1.5">
              <span className="border-2 border-black rounded-lg w-8 h-8 flex items-center justify-center font-black bg-white">−</span>
              <span className="w-12 h-8 flex items-center justify-center font-black border-[3px] rounded-lg bg-white text-lg" style={{ ...OSWALD, borderColor: GREEN, boxShadow: `0 0 0 3px rgba(46,158,91,.25)` }}>7</span>
              <span className="border-2 border-black rounded-lg w-8 h-8 flex items-center justify-center font-black" style={{ background: GOLD }}>+</span>
            </div>
          </div>
        </div>
        <p className="text-xs font-bold text-black/70 mt-2 leading-snug">{getLang() === 'en' ? <>👆 Tap the box and <b>type how many coins</b> you want to bid — <b>the more coins, the better your chance of getting the star!</b> Bid <b>7, 15, 30…</b> not just <b>1</b> 😉</> : <>👆 Toque na caixinha e <b>digite quantas moedas</b> quer dar — <b>quanto mais moedas, mais chance de levar o craque!</b> Bota <b>7, 15, 30…</b> não só <b>1</b> 😉</>}</p>
      </Box>

      <Box bg="#EDE7FF" className="p-4" shadow={6}>
        <p className="font-black text-lg" style={OSWALD}>{tr('🎭 O nível é o AUGE do craque', '🎭 The level is the star\'s PEAK')}</p>
        <p className="text-xs font-bold text-black/65 mt-1 mb-3 leading-snug">{getLang() === 'en' ? <>The same player is worth <b>different</b> amounts depending on <b>club and year</b>. You bet on the name — the level only opens at the reveal!</> : <>O mesmo jogador vale <b>diferente</b> conforme o <b>clube e o ano</b>. Você aposta no nome — o nível só abre na revelação!</>}</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <CollectibleCard name="Kaká" club="Milan" year={2007} pos="MEI" fame={5} promessa={false} />
            <p className="text-center text-[11px] font-black mt-1.5 leading-tight" style={OSWALD}>{getLang() === 'en' ? <>👑 peak in Europe<br />= LEGEND</> : <>👑 auge na Europa<br />= LENDA</>}</p>
          </div>
          <div>
            <CollectibleCard name="Kaká" club="São Paulo" year={2003} pos="MEI" fame={3} promessa />
            <p className="text-center text-[11px] font-black mt-1.5 leading-tight" style={OSWALD}>{getLang() === 'en' ? <>💎 young in Brazil<br />= PROSPECT</> : <>💎 jovem no Brasil<br />= PROMESSA</>}</p>
          </div>
        </div>
      </Box>

      {online && (
      <Box bg={INK} className="p-4" shadow={6}>
        <p className="font-black text-lg" style={{ ...OSWALD, color: '#fff' }}>{tr('👥 Quem tá no pregão', '👥 Who is in the auction')} ({humans.length})</p>
        <div className="mt-2 space-y-1.5">
          {humans.map(m => {
            const nm = m.teamName || m.name
            const pk = perkColor(nm)
            return (
              <div key={m.id} className="flex items-center gap-2 rounded-lg px-3 py-2 border-2 border-black" style={{ background: pk ? pk.light : '#fff' }}>
                <span style={{ width: 13, height: 13, borderRadius: 999, background: pk ? pk.solid : '#B2A583', border: '2px solid #000', flexShrink: 0, boxShadow: pk && pk.holo > 0 ? `0 0 5px ${pk.solid}` : 'none' }} />
                <span className="font-black text-sm truncate flex-1" style={{ ...OSWALD, color: INK }}>{nm}</span>
                {you && m.id === you.id && <span className="text-[10px] font-black text-black/45 flex-shrink-0">{tr('(você)', '(you)')}</span>}
              </div>
            )
          })}
        </div>
      </Box>
      )}

      {isHost ? (
        <Btn onClick={() => dispatch({ type: 'START_STREAM_AUCTION' })} bg={GREEN} className="w-full text-lg"><span className="text-white">{tr('▶️ COMEÇAR O LEILÃO 🔨', '▶️ START THE AUCTION 🔨')}</span></Btn>
      ) : (
        <div className="w-full border-[3px] border-black rounded-xl py-3 text-center font-black" style={{ background: '#fff', ...OSWALD }}>{tr('⏳ O host vai começar o leilão…', '⏳ The host will start the auction…')}</div>
      )}
      {/* ← voltar: só no offline (rápido/carreira), volta pro setup certo pra
          reconfigurar. No online, sair é pelo próprio fluxo da sala. */}
      {!online && (
        <button onClick={() => dispatch({ type: state.careerOnline ? 'GO_SETUP_CAREER' : 'GO_SETUP' })}
          className="w-full border-[3px] border-black rounded-xl py-2.5 text-center font-black bg-white active:translate-y-0.5" style={{ ...OSWALD, boxShadow: `3px 3px 0 0 ${INK}` }}>
          {tr('← Voltar', '← Back')}
        </button>
      )}
    </Shell>
  )
}

// ─── LEILÃO: envelope ────────────────────────────────────────────────
// contador de moedas que REAGE quando o caixa muda: pulsa (verde ao entrar grana
// de uma venda, vermelho ao gastar) e solta um "+X / −X" flutuando. Só anima na
// mudança — no primeiro render fica quieto.
function CoinCounter({ value }: { value: number }) {
  const prev = useRef(value)
  const [delta, setDelta] = useState<{ n: number; key: number } | null>(null)
  const [pulse, setPulse] = useState(false)
  useEffect(() => {
    if (value === prev.current) return
    const d = value - prev.current
    prev.current = value
    setDelta({ n: d, key: Date.now() })
    setPulse(true)
    const t1 = setTimeout(() => setPulse(false), 650)
    const t2 = setTimeout(() => setDelta(null), 1000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [value])
  const up = (delta?.n ?? 0) > 0
  return (
    <span className="relative inline-flex items-center">
      <motion.span className="font-black text-lg" style={OSWALD}
        animate={pulse ? { scale: [1, 1.4, 1] } : { scale: 1 }} transition={{ duration: 0.65 }}>
        💰 <motion.span animate={pulse ? { color: [INK, up ? GREEN : RED, INK] } : { color: INK }} transition={{ duration: 0.65 }} style={{ display: 'inline' }}>{value}</motion.span>
      </motion.span>
      {delta && delta.n !== 0 && (
        <motion.span key={delta.key} initial={{ opacity: 0, y: 2, scale: 0.7 }} animate={{ opacity: 1, y: -20, scale: 1 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="absolute right-0 -top-2 font-black text-sm pointer-events-none whitespace-nowrap"
          style={{ ...OSWALD, color: up ? GREEN : RED, textShadow: '0 1px 0 rgba(255,255,255,0.8)' }}>
          {up ? `+${delta.n}` : delta.n} 🪙
        </motion.span>
      )}
    </span>
  )
}
// SEM SPOILER nas moedas: mesma lógica do campinho (YourPitch) — o setor fecha
// e desconta o dinheiro por dentro na hora, mas o saldo na tela só deve cair
// no exato momento que o martelo bate na carta (revealIdx chega nela). Até lá,
// soma de volta o que já foi pago pelas cartas AINDA escondidas na fila.
function pendingSpend(state: EscState, you: Manager): number {
  const revealing = state.screen === 'auction' && (state.phase === 'reveal' || state.phase === 'resq_reveal' || state.phase === 'tiebreak')
  if (!revealing) return 0
  const pendingIds = new Set((state.revealQueue ?? []).slice(state.phase === 'tiebreak' ? 0 : state.revealIdx + 1).map(it => it.card.id))
  if (!pendingIds.size) return 0
  return you.squad.reduce((sum, c) => pendingIds.has(c.id) ? sum + (c.paid ?? 0) : sum, 0)
}
// 🔨 barra do pregão. Com o PREGÃO LIMPO ligado ela ganha duas coisas que hoje
// vivem em quadros que rolam com as cartas: as VAGAS e o ❓ das regras. O que a
// pessoa precisa AGORA (moedas · vagas · tempo) fica sempre na tela.
function AuctionBar({ vagas, ajuda }: { vagas?: number; ajuda?: boolean } = {}) {
  const { state } = useEsc()
  const you = state.managers[state.youIdx]
  const [regras, setRegras] = useState(false)
  return (
    <>
      <div className="flex items-center justify-between max-w-xl mx-auto gap-2">
        <div className="flex gap-1.5">
          {SECTORS.map((p, i) => (
            <span key={p} className="border-2 border-black rounded-full px-2 py-0.5 text-[10px] font-black"
              style={{ backgroundColor: i < state.sectorIdx ? INK : i === state.sectorIdx ? GOLD : '#fff', color: i < state.sectorIdx ? '#fff' : INK }}>
              {posTag(p)}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          {vagas != null && vagas > 0 && (
            <span className="border-2 border-black rounded-full px-2 py-0.5 text-[10px] font-black whitespace-nowrap"
              style={{ background: '#E7F7EC', color: '#146c33', ...OSWALD }}>{vagas} {getLang() === 'en' ? (vagas === 1 ? 'slot' : 'slots') : (vagas === 1 ? 'vaga' : 'vagas')}</span>
          )}
          {ajuda && (
            <button onClick={() => setRegras(true)} aria-label="Regras do pregão"
              className="border-2 border-black rounded-full w-6 h-6 flex items-center justify-center text-[11px] font-black bg-white"
              style={{ cursor: 'pointer' }}>❓</button>
          )}
          <CoinCounter value={you.money + pendingSpend(state, you)} />
        </div>
      </div>
      {regras && <RegrasDoPregao onFechar={() => setRegras(false)} />}
    </>
  )
}
// ❓ as regras do pregão, a UM toque. Nada aqui é novo — é o que hoje fica
// empilhado em quadros na frente das cartas, escrito melhor e fora do caminho.
// ⏱️ O relógio NÃO para: por isso o aviso honesto no rodapé da folha.
function RegrasDoPregao({ onFechar }: { onFechar: () => void }) {
  const linhas: [string, string, string][] = [
    ['🏆', 'Ganha quem dá o maior lance', 'Não é 1 moeda que leva — é quem paga mais. Empate? Re-lance às cegas.'],
    ['✉️', 'O lance é cego', 'Ninguém vê o seu, você não vê o dos outros. Tudo aparece só na revelação.'],
    ['🎟️', 'Suas vagas', 'Dá pra dar lance em vários jogadores DE UMA VEZ na mesma leva — até o número de vagas que aparece na barra, não só em um.'],
    ['🔒', 'O piso', 'O número apagado é o mínimo do jogador, não um lance. Vira lance quando você aperta +. Abaixo do piso fica vermelho e é anulado.'],
    ['🎁', 'Jogador surpresa', 'O nome fica escondido: você só vê posição, clube e ano. Sai no martelo.'],
  ]
  return (
    <div onClick={onFechar} style={{ position: 'fixed', inset: 0, zIndex: 99995, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 380, maxHeight: '86vh', overflowY: 'auto', border: `4px solid ${INK}`, borderRadius: 18, background: '#fff', boxShadow: `4px 4px 0 0 ${INK}` }}>
        <div style={{ background: INK, padding: '10px 13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0 }}>
          <span style={{ ...OSWALD, fontWeight: 900, fontSize: 14, color: GOLD }}>❓ REGRAS DO PREGÃO</span>
          <button onClick={onFechar} aria-label="Fechar" style={{ background: 'none', border: 'none', color: '#fff', ...OSWALD, fontWeight: 900, fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: '11px 13px' }}>
          {linhas.map(([ic, t, s], i) => (
            <div key={t} style={{ display: 'flex', gap: 9, padding: '9px 0', borderBottom: i < linhas.length - 1 ? '1.5px solid rgba(12,12,12,.10)' : 'none' }}>
              <span style={{ fontSize: 17, flexShrink: 0 }}>{ic}</span>
              <div>
                <p style={{ ...OSWALD, fontWeight: 900, fontSize: 12.5, margin: 0, lineHeight: 1.15 }}>{t}</p>
                <p style={{ fontSize: 10.5, fontWeight: 600, color: 'rgba(0,0,0,.55)', margin: '2px 0 0', lineHeight: 1.45 }}>{s}</p>
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: '#E7F7EC', borderTop: `3px solid ${INK}`, padding: '10px 13px', textAlign: 'center' }}>
          <p style={{ fontSize: 10, fontWeight: 800, color: '#146c33', margin: '0 0 8px', lineHeight: 1.4 }}>{getLang() === 'en' ? <>⏱️ The clock <b>doesn't stop</b> while this is open — close it and place your bid right away.</> : <>⏱️ O relógio <b>não para</b> enquanto isso está aberto — feche e dê seu lance na hora.</>}</p>
          <button onClick={onFechar} style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 11, padding: '9px 10px', ...OSWALD, fontWeight: 900, fontSize: 13.5, background: GREEN, color: '#fff', boxShadow: `3px 3px 0 0 ${INK}`, cursor: 'pointer' }}>{tr('Fechar e dar lance 👊', 'Close and bid 👊')}</button>
        </div>
      </div>
    </div>
  )
}

// ─── reações efêmeras (zoeira/blefe) — só online ─────────────────────
// 🎤 CANTADAS DE MESA: no lugar dos emojis soltos, declarações públicas de blefe
// presas à carta ("Fulano → Romário: TÔ NESSE 😈"). PODE ser mentira — é o table
// talk do poker. A 💸 ainda faz CHOVER DINHEIRO na tela de todo mundo (MoneyRain).
// Flutuam na mesma camada de sempre; opcional, um toque, não mexe em tempo nenhum.
// 📉 DE 6 PRA 3 (Diego 25/08): *"esses emojis dos jogadores tô achando que tá
// demais… tá ruim vertical"*. O menu abria com SEIS linhas de frase por baixo da
// carta e tapava as cartas seguintes — numa leva de 6 jogadores virava paredão.
// Ele escolheu estas três e o menu passou a abrir DEITADO (ver `CardReact`):
// uma linha em vez de sete. Saíram do card: ❤️ meu ídolo · 🪙 1 moedinha · 🤣.
// O rótulo curto é o que aparece no BOTÃO; a frase inteira (`t`) é a que a sala
// lê no balão quando você manda.
const CANTADAS: { k: string; t: string; curto: string }[] = [
  { k: '😈', t: 'TÔ NESSE, vou com TUDO!', curto: 'TÔ NESSE' },
  { k: '💸', t: 'esse vai ficar CARO…', curto: 'VAI FICAR CARO' }, // + chuva de dinheiro na sala inteira
  { k: '🥱', t: 'nem quero…', curto: 'NEM QUERO' },
]

// camada flutuante que mostra as reações de todo mundo subindo e sumindo
// cor por usuário (estável pelo nome) — diferencia as mensagens de cada um no balão.
const CHAT_COLORS = ['#7C3AED', '#E8503A', '#1B7A3D', '#2E6FB0', '#C77800', '#B23B8E', '#0E8A8A', '#B8860B']
function chatColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return CHAT_COLORS[h % CHAT_COLORS.length]
}
// 🐊 MASCOTE MINIATURA — a mesma arte do gol/festão, encolhida pro balão de
// reação e pro botão. Ela NASCE grande (~176px de altura, até 170 de largura),
// então a gente escala por `transform`. Bundle não cresce: a arte já está no jogo.
//
// ⚠️ TAMANHO MÍNIMO (reclamação do Diego 26/08: *"não deu certo o mascote
// soltar ele!"*). A 1ª versão desenhava a mascote com 30px de altura, do
// tamanho de um emoji. Só que emoji é um DESENHO SÓ, e a mascote é um bicho de
// corpo inteiro: a 30px ela vira um risquinho e ninguém reconhece quem é —
// medido lado a lado, 32px não dá pra distinguir o lobo do galo. Daí:
//   · botão "solta a sua mascote" → 44px  (dá pra ver de quem é)
//   · balão que sobe na tela      → 52px  (é a hora dela aparecer)
// Não descer disso. Se o balão ficar alto demais com muita gente reagindo,
// diminuir o TEXTO, não a mascote.
//
// A caixa de dentro tem o tamanho REAL da arte (170×204) de propósito: se ela
// ficar estreita, o `img { max-width:100% }` do Tailwind espreme a mascote
// ANTES do scale e ela some. Só o `scale` decide o tamanho final.
const MASC_W = 170, MASC_H = 204
function MascoteMini({ art, alt }: { art: React.ReactNode; alt: number }) {
  const s = alt / MASC_H
  return (
    <span style={{ display: 'inline-block', width: Math.round(MASC_W * s), height: alt, position: 'relative', flex: 'none', verticalAlign: 'bottom' }}>
      <span style={{ position: 'absolute', left: 0, top: 0, width: MASC_W, height: MASC_H, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', transform: `scale(${s})`, transformOrigin: 'top left' }}>{art}</span>
    </span>
  )
}

function FloatingEmotes() {
  const { state, emotes } = useEsc()
  if (state.onlineMode !== 'online' || emotes.length === 0) return null
  const you = state.managers[state.youIdx]
  const cardName = (id?: string) => {
    if (!id) return null
    // 🎁 carta surpresa: o nome fica escondido até o martelo — a reação NÃO pode
    // vazar (antes mostrava "Você → Cafu" e entregava o jogador oculto).
    if (id === state.surpriseId) return '🎁 Surpresa'
    const c = state.currentCards.find(x => x.id === id)
      ?? state.revealQueue.find(q => q.card.id === id)?.card
      ?? state.tiebreaks.find(t => t.card.id === id)?.card
    return c ? c.name : null
  }
  return (
    <div className="fixed inset-x-0 bottom-20 z-50 pointer-events-none flex flex-col-reverse items-center gap-1 px-3">
      <AnimatePresence>
        {emotes.slice(-6).map(e => {
          // resolve o autor pelo CRACHÁ (fromId) — estável entre aparelhos; cai
          // pra cadeira (e.from) só em evento antigo sem fromId
          const m = (e.fromId != null ? state.managers.find(x => x.id === e.fromId) : undefined) ?? state.managers[e.from]
          const who = m ? (m.id === you?.id ? 'Você' : (m.teamName || m.name)) : ''
          const cn = cardName(e.cardId)
          return (
            <motion.div key={e.id} initial={{ opacity: 0, y: 24, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -34 }}
              className="flex items-center gap-1.5 bg-white border-2 border-black rounded-full px-3 py-1"
              style={{ boxShadow: `2px 2px 0 0 ${INK}` }}>
              {/* 🐊 MASCOTE COMO REAÇÃO (Diego 25/08): quando o `kind` vem com o
                  prefixo `masc:`, o balão desenha a mascote do clube batizado no
                  lugar do emoji. Ela nasce com 176px de altura (é a mesma arte do
                  gol e do festão), então entra encolhida por `scale` — mesmo
                  jeito que o perfil do sócio já faz. Bundle não cresce: a arte
                  já está no jogo.
                  🛟 Aparelho com versão velha (ou clube que ele não conhece) não
                  acha a chave e cai no 🎭 — nunca fica um balão vazio. */}
              {e.kind.startsWith('masc:')
                ? (() => {
                  const art = MASCOTES[e.kind.slice(5)]
                  if (!art) return <span className="text-lg leading-none">🎭</span>
                  return <MascoteMini art={art} alt={52} />
                })()
                : <span className="text-lg leading-none">{e.kind}</span>}
              {/* alfinetada (frase) → nome de quem manda NA FRENTE; reação simples → "quem → carta" */}
              {/* cantada presa à carta: "Fulano → Romário: TÔ NESSE"; alfinetada solta: "Fulano: frase" */}
              <span className="text-xs font-black text-black truncate max-w-[70vw]" style={OSWALD}>{e.text ? <><span style={{ color: chatColor(m?.teamName || m?.name || who) }}>{who}{cn ? ` → ${cn}` : ''}:</span> {e.text}</> : <>{who}{cn ? ` → ${cn}` : ''}</>}</span>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

// 💸 CHUVA DE DINHEIRO: quando alguém solta a cantada 💸 ("esse vai ficar CARO…"),
// chove nota na tela de TODO MUNDO por ~2,4s. Puro teatro de blefe — camada fixa,
// pointer-events none, fora do reducer: não toca em lance, tempo nem resultado.
function moneySeed(s: string): number { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h }
function MoneyRain() {
  const { state, emotes } = useEsc()
  if (state.onlineMode !== 'online') return null
  const bursts = emotes.filter(e => e.kind === '💸')
  if (bursts.length === 0) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99980, pointerEvents: 'none', overflow: 'hidden' }}>
      <style>{'@keyframes escMoneyFall{0%{transform:translateY(-10vh) rotate(-16deg);opacity:0}8%{opacity:1}88%{opacity:1}100%{transform:translateY(108vh) rotate(18deg);opacity:0}}'}</style>
      {bursts.flatMap(b => Array.from({ length: 14 }, (_, i) => {
        // pseudo-aleatório ESTÁVEL por nota (semente no id do emote): re-render não embaralha
        const h = moneySeed(`${b.id}:${i}`)
        const left = 3 + (h % 90), dur = 1.7 + ((h >> 3) % 70) / 100, delay = ((h >> 7) % 50) / 100, size = 17 + ((h >> 11) % 14)
        return <span key={`${b.id}-${i}`} style={{ position: 'absolute', top: 0, left: `${left}%`, fontSize: size, animation: `escMoneyFall ${dur}s linear ${delay}s forwards`, opacity: 0 }}>💸</span>
      }))}
    </div>
  )
}

// ─── 🏆😂 PREMIAÇÃO DA RESENHA (Diego 25/08) ────────────────────────────────
// Ele pediu uma premiação de vexame e mandou JUNTAR nela os dois prêmios que já
// existiam soltos aqui na Cerimônia (🏅 Achado e 🐴 Mico) — eram duas linhas
// perdidas numa caixa, no card do último técnico, e ninguém via.
//
// POR QUE MORA NA CERIMÔNIA e não no fim: ele queria logo depois do leilão, e a
// Cerimônia JÁ É esse momento — tem 45s de tempo morto (CEREMONY_MS) cujo texto
// é literalmente "aproveite pra ver os times de todo mundo". E todo prêmio aqui
// sai de dado do PREGÃO: nenhum precisa do campeonato ter rodado.
//
// ⏱️ Não mexe no cronômetro. Quem não terminou de ler não perde nada — o mesmo
// bloco reaparece no fim, do lado do troféu.
export interface PremiosResenha {
  achado: { nome: string; time: string; lo: number; hi: number; pago: number }
  mico: { nome: string; time: string; lo: number; hi: number; pago: number }
  furada: { time: string; nome: string; pago: number; segundo: number; total: number } | null
  vaca: { time: string; sobrou: number } | null
  pau: { time: string; nome: string; lo: number; hi: number } | null
}
/**
 * 🏆 quem leva cada prêmio do vexame. Função PURA de propósito — é a parte que
 * pode errar (escolher o técnico errado, dividir por zero, save antigo sem
 * `resenha`), então dá pra testar sem abrir o jogo.
 * Devolve null quando ninguém pagou nada (pregão sem lance = sem premiação).
 */
export function premiosDaResenha(mgrs: Manager[], resenha?: EscState['resenha']): PremiosResenha | null {
  // 🎭 INCÓGNITO FORA DE TODOS OS PRÊMIOS. Carta `fake` é nome gerado pra tapar
  // buraco de elenco — não é jogador de verdade, então não pode ser "achado",
  // nem "mico", nem "perna-de-pau". Pego num teste em 25/08: com um incógnito no
  // elenco, ele ganhava o Achado E o Mico ao mesmo tempo (a conta dele fica fora
  // da curva porque custa 1 moeda). Régua do Diego: fake nunca entra por regra nova.
  const all = mgrs.flatMap(mg => mg.squad.filter(c => !c.fake).map(c => ({ mg, c, mid: (c.lo + c.hi) / 2 })))
  const paid = all.filter(x => x.c.paid > 0)
  if (!paid.length) return null
  const achadoX = [...paid].sort((a, b) => (b.mid / b.c.paid) - (a.mid / a.c.paid))[0]
  const micoX = [...paid].sort((a, b) => (b.c.paid - b.mid) - (a.c.paid - a.mid))[0]
  const fEntry = resenha ? Object.entries(resenha.furada).sort((a, b) => b[1].total - a[1].total)[0] : null
  const fMgr = fEntry ? mgrs.find(m => m.id === Number(fEntry[0])) : null
  const vacaX = [...mgrs].sort((a, b) => b.money - a.money)[0]
  const pauX = [...all].sort((a, b) => a.mid - b.mid)[0]
  const card = (x: typeof achadoX) => ({ nome: x.c.name, time: x.mg.teamName, lo: x.c.lo, hi: x.c.hi, pago: x.c.paid })
  return {
    achado: card(achadoX),
    mico: card(micoX),
    furada: fMgr && fEntry ? { time: fMgr.teamName, nome: fEntry[1].pior.nome, pago: fEntry[1].pior.pago, segundo: fEntry[1].pior.segundo, total: fEntry[1].total } : null,
    vaca: vacaX ? { time: vacaX.teamName, sobrou: vacaX.money } : null,
    pau: pauX ? { time: pauX.mg.teamName, nome: pauX.c.name, lo: pauX.c.lo, hi: pauX.c.hi } : null,
  }
}

function PremiacaoResenha({ mgrs, resenha }: { mgrs: Manager[]; resenha?: EscState['resenha'] }) {
  const pr = premiosDaResenha(mgrs, resenha)
  if (!pr) return null

  const item = (bg: string, ic: string, titulo: string, quem: string, detalhe: React.ReactNode) => (
    <div className="border-[2.5px] border-black rounded-xl overflow-hidden" style={{ boxShadow: `3px 3px 0 ${INK}` }}>
      <div className="flex items-center gap-1.5 px-2.5 py-1" style={{ background: bg }}>
        <span className="text-sm leading-none">{ic}</span>
        <span className="font-black text-[11px] uppercase tracking-wide text-white" style={OSWALD}>{titulo}</span>
      </div>
      <div className="bg-white px-2.5 py-1.5">
        <p className="font-black text-[14px] leading-tight" style={OSWALD}>{quem}</p>
        <p className="text-[11px] font-bold text-black/60 leading-snug mt-0.5">{detalhe}</p>
      </div>
    </div>
  )
  return (
    <div className="space-y-2">
      <div className="rounded-2xl border-[3px] border-black p-3" style={{ background: INK, boxShadow: `4px 4px 0 ${INK}` }}>
        <p className="font-black text-[10px] uppercase tracking-widest text-white/50" style={OSWALD}>{tr('O pregão acabou', 'The auction is over')}</p>
        <p className="font-black text-2xl leading-none mt-0.5" style={{ ...OSWALD, color: GOLD }}>{tr('Agora a conta.', 'Now the bill.')}</p>
      </div>
      {getLang() === 'en' ? <>
        {item(GREEN, '🏅', 'Steal of the auction', `${pr.achado.nome} · ${pr.achado.time}`, <>Level {pr.achado.lo}–{pr.achado.hi} and paid <b>{pr.achado.pago}</b>. Robbery.</>)}
        {item('#8B5E3C', '🐴', 'Blunder of the auction', `${pr.mico.nome} · ${pr.mico.time}`, <>Level {pr.mico.lo}–{pr.mico.hi} and paid <b>{pr.mico.pago}</b>. Ouch.</>)}
        {pr.furada && item('#C2452F', '💸', 'Money down the drain', pr.furada.time,
          <>Paid <b>{pr.furada.pago}</b> for {pr.furada.nome} and the 2nd bid was <b>{pr.furada.segundo}</b>. Threw <b>{pr.furada.total} 🪙</b> away at the auction.</>)}
        {pr.vaca && item('#B45309', '🤏', 'Tightwad', pr.vaca.time, <>Ended the auction with <b>{pr.vaca.sobrou} 🪙</b> in the pocket. Saving it for what?</>)}
        {pr.pau && item('#6B7280', '🗑️', 'Dud in the starting XI', pr.pau.time, <>Started <b>{pr.pau.nome}</b> ({pr.pau.lo}–{pr.pau.hi}). On purpose?</>)}
      </> : <>
        {item(GREEN, '🏅', 'Achado do pregão', `${pr.achado.nome} · ${pr.achado.time}`, <>Nível {pr.achado.lo}–{pr.achado.hi} e pagou <b>{pr.achado.pago}</b>. Roubou.</>)}
        {item('#8B5E3C', '🐴', 'Mico do pregão', `${pr.mico.nome} · ${pr.mico.time}`, <>Nível {pr.mico.lo}–{pr.mico.hi} e pagou <b>{pr.mico.pago}</b>. Doeu.</>)}
        {pr.furada && item('#C2452F', '💸', 'Mão furada', pr.furada.time,
          <>Pagou <b>{pr.furada.pago}</b> no {pr.furada.nome} e o 2º lance era <b>{pr.furada.segundo}</b>. Jogou <b>{pr.furada.total} 🪙</b> fora no pregão.</>)}
        {pr.vaca && item('#B45309', '🤏', 'Mão de vaca', pr.vaca.time, <>Acabou o pregão com <b>{pr.vaca.sobrou} 🪙</b> no bolso. Guardou pra quê?</>)}
        {pr.pau && item('#6B7280', '🗑️', 'Perna-de-pau titular', pr.pau.time, <>Escalou o <b>{pr.pau.nome}</b> ({pr.pau.lo}–{pr.pau.hi}). De propósito?</>)}
      </>}
    </div>
  )
}

// 🐊 SOLTA A SUA MASCOTE — só pra quem tem clube batizado (a mascote vem do
// cadastro do sócio, `mascoteKey`). Quem não tem, não vê botão nenhum: nada de
// placeholder pra quem não comprou (régua do Diego).
function MascoteJab() {
  const { emote } = useEsc()
  const soc = useMeuSocio()
  const key = soc?.ativo && soc.mascoteKey && MASCOTES[soc.mascoteKey] ? soc.mascoteKey : null
  if (!key) return null
  return (
    <button onClick={() => emote(`masc:${key}`, undefined, 'soltou o bicho! 🔊')}
      className="mt-1.5 mx-auto flex items-center gap-2 border-2 rounded-full pl-1.5 pr-3 py-0.5 bg-white active:translate-y-0.5"
      style={{ borderColor: PURPLE, boxShadow: `2px 2px 0 0 ${INK}` }}>
      <MascoteMini art={MASCOTES[key]} alt={44} />
      <span className="text-xs font-black text-black" style={OSWALD}>SOLTA A SUA MASCOTE</span>
    </button>
  )
}

// botãozinho de reação numa carta do leilão (blefe: não revela seu lance)
function CardReact({ cardId }: { cardId: string }) {
  const { emote } = useEsc()
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} aria-label="reagir"
        className="border-2 border-black rounded-lg w-8 h-8 font-black bg-white text-black leading-none">😏</button>
      {/* 🛏️ DEITADO, não em pé (Diego 25/08). As três cantadas lado a lado, com
          o rótulo curto embaixo do emoji — ocupa UMA linha e não tapa mais as
          cartas de baixo. A frase inteira só aparece no balão da sala. */}
      {open && (
        <div className="absolute right-0 top-9 z-30 flex gap-1.5 bg-white border-2 border-black rounded-xl p-1.5"
          style={{ boxShadow: `2px 2px 0 0 ${INK}` }}>
          {CANTADAS.map(c => (
            <button key={c.k} onClick={() => { emote(c.k, cardId, c.t); setOpen(false) }}
              className="border-2 border-black rounded-lg px-2 py-1 text-center bg-white active:translate-y-0.5 w-[62px]">
              <span className="block text-lg leading-none">{c.k}</span>
              <span className="block text-[7.5px] font-black text-black leading-tight mt-0.5" style={OSWALD}>{c.curto}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function EscAuction() {
  const { state } = useEsc()
  let sub
  if (state.phase === 'envelope' || state.phase === 'resq_envelope') sub = <Envelope />
  else if (state.phase === 'tiebreak') sub = <Tiebreak />
  else sub = <Reveal />
  return <>{sub}<FloatingEmotes /><MoneyRain /></>
}

function Envelope() {
  const { state, dispatch, emote } = useEsc()
  const [blLang] = useLang()
  const you = state.managers[state.youIdx]
  const pos = SECTORS[state.sectorIdx]
  // 🧢 setor TÉCNICO na mesa: mesma tela, mesmo envelope — só muda o rótulo e
  // que a "vaga" é uma só (todo time tem um posto de técnico).
  const tecMesa = !!state.tecLote
  // esporte da partida (futebol = tudo como hoje) + rótulo do setor no idioma
  const sport: Sport = state.sport === 'basquete' ? 'basquete' : 'futebol'
  const lang: 'pt' | 'en' = blLang === 'en' ? 'en' : 'pt'
  const posName = tecMesa ? (lang === 'en' ? 'Manager' : 'Técnico') : secLabel(sport, pos, lang)
  // 🌐 tradução SÓ do basquete: no futebol devolve sempre o PT (idêntico a hoje).
  // 🌐 11/09: o idioma agora vale pro jogo INTEIRO (pedido do Diego), não só pro
  // basquete. Antes esta linha exigia `sport === 'basquete'` — ou seja, todas as
  // traduções que já existiam aqui ficavam guardadas e nunca apareciam no
  // futebol. Agora quem manda é só o botão BR/EN.
  const L = (pt: string, en: string) => (lang === 'en' ? en : pt)
  const rescue = state.phase === 'resq_envelope'
  const [bids, setBids] = useState<Record<string, number>>({})
  const [pickerCard, setPickerCard] = useState<Card | null>(null) // 🎯 escolher valor redondo
  const [typeVal, setTypeVal] = useState('') // "digitar" um valor na mão
  const [peek, setPeek] = useState(false) // 👁️ ver os PRÓPRIOS lances no modo stream (local, não vaza)
  // PRIMEIRA partida da vida: dica dourada que alterna por setor (moedas ↔ auge).
  // HOOKS AQUI NO TOPO, antes de qualquer return condicional — colocar depois
  // derrubava o online com React #300 quando o envelope era lacrado.
  // 🔨 pregão limpo (só a conta do Diego por enquanto)
  const pregaoLimpo = usePregaoLimpo()
  const [firstGame] = useState(() => {
    try {
      // 🎓 QUANDO ENSINAR. Hoje a marca é do APARELHO: quem termina a 1ª carreira
      // e começa a 2ª não recebe ensino NENHUM. Com o pregão limpo a marca passa
      // a ser desta PARTIDA/CARREIRA (a seed), então todo começo ensina de novo —
      // que é justamente quando a pessoa precisa.
      // 🎓 O ensino volta a cada CARREIRA nova (era o buraco: a marca ficava no
      // APARELHO, então quem começava a 2ª carreira não via ensino nenhum).
      // ⚠️ No JOGO RÁPIDO a marca continua sendo do aparelho — senão quem joga
      // várias partidas seguidas levaria a mesma aula em TODA partida nova.
      const k = pregaoLimpo && state.careerOnline && state.seed != null ? `esc-tip-lance-s${state.seed}` : 'esc-tip-lance-v1'
      if (localStorage.getItem(k)) return false
      localStorage.setItem(k, '1')
      return true
    } catch { return false }
  })
  const [tipClosed, setTipClosed] = useState(false)
  // 🔨 PREGÃO LIMPO: o ensino é UMA VEZ por partida, e ponto. Sem esta trava o
  // `tipClosed` zerava a cada setor e a folha do ensino voltava 5 vezes seguidas
  // (uma por posição) — chato pra caramba, e com o relógio correndo.
  useEffect(() => { if (!pregaoLimpo) setTipClosed(false) }, [state.sectorIdx, pregaoLimpo])
  // "enviei mas ainda não veio confirmação do host" — sem isso, se o host
  // demorar (ou tiver caído), o jogador ficava vendo os lances dele
  // somem sem nunca lacrar de verdade: um clique em LACRAR sempre limpava
  // os valores na hora, mesmo quando o envio pro host não tinha efeito.
  const [pending, setPending] = useState(false)
  const pendingBidsRef = useRef<{ cardId: string; amount: number }[]>([])
  const total = Object.values(bids).reduce((s, v) => s + v, 0)
  const myOpen = tecMesa ? 1 : openSlots(you, pos)
  // 🤝 DUPLA: nesta leva (um setor por vez) quem lacra pelo time é SÓ quem manda
  // na categoria. O parceiro vê as MESMAS cartas — nunca escondemos informação —
  // mas sem os controles. Na leva seguinte os papéis podem inverter.
  const minhaVez = duplaPodeAgir(state.duplas, you.id, pos, state.youUid)
  const duplaDaVez = state.duplas?.[you.id]
  const donoDaVezUid = !minhaVez && duplaDaVez ? duplaDaVez.cats?.[pos] : undefined
  const quemDecide = !minhaVez && duplaDaVez
    ? (donoDaVezUid === duplaDaVez.ownerUid ? duplaDaVez.ownerName : duplaDaVez.partnerName)
    : null
  // 🆘 PARCEIRO CAIU: quem cai de verdade (fecha o app, perde a net) nunca avisa
  // nada — e sem isso o time ficava travado pra sempre esperando alguém que não
  // volta (relato do Diego: "caiu quem era do meio e do monte e o jogo prendeu").
  // A presença do canal diz quem está online DE VERDADE, por crachá. Some da
  // presença → o parceiro que ficou pode assumir o time inteiro num toque.
  const parceiroSumiu = !!donoDaVezUid && Array.isArray(state.presenceUids) && state.presenceUids.length > 0 && !state.presenceUids.includes(donoDaVezUid)
  const assumirTime = () => dispatch({ type: 'DUPLA_SOLO', mgrId: you.id, ficouUid: state.youUid ?? '' })
  const canBid = myOpen > 0 && you.money > 0 && minhaVez
  const online = state.onlineMode === 'online'
  const iSubmitted = state.submitted.includes(you.id)
  const humanBidders = state.managers.filter(m => m.isHuman && openSlots(m, pos) > 0 && m.money > 0)
  const waitingFor = humanBidders.filter(m => !state.submitted.includes(m.id))
  // ⏱️ leilão SEM cronômetro (host-manual, auctionSecs=0): não tem contagem; o host
  // fecha cada envelope no botão e todo mundo segue sincronizado.
  const noTimer = state.auctionSecs === 0
  const amHost = !!state.isHost

  // ─── cronômetro de 45s ───────────────────────────────────────────
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(iv)
  }, [])
  const remaining = state.phaseDeadline ? Math.max(0, Math.ceil((state.phaseDeadline - now) / 1000)) : 45

  function seal() {
    playSeal() // 🔒 som do carimbo ao lacrar
    const payload = Object.entries(bids).map(([cardId, amount]) => ({ cardId, amount }))
    pendingBidsRef.current = payload
    setPending(true)
    dispatch({ type: 'SUBMIT_ENVELOPE', mgrId: you.id, bids: payload, by: state.youUid })
  }

  // confirmação chegou (o host aplicou e devolveu o estado): só agora limpa
  useEffect(() => {
    if (iSubmitted) { setBids({}); setPending(false) }
  }, [iSubmitted])
  // ⏱️ tique-taque nos últimos 5s (só enquanto ainda não lacrou)
  useEffect(() => { if (remaining >= 1 && remaining <= 5 && !iSubmitted) playTick() }, [remaining, iSubmitted])

  // enquanto não confirma, reenvia de tempos em tempos — cobre o host que
  // ficou um instante sem conexão (app em segundo plano etc.) e reconecta
  const reenviosRef = useRef(0)
  useEffect(() => {
    if (!online || !pending || iSubmitted) return
    const iv = setInterval(() => {
      reenviosRef.current += 1
      dispatch({ type: 'SUBMIT_ENVELOPE', mgrId: you.id, bids: pendingBidsRef.current, by: state.youUid })
    }, 4000)
    return () => clearInterval(iv)
  }, [online, pending, iSubmitted, dispatch, you.id])

  // 🕵️ CAIXA-PRETA (11/09, pedido do Diego): quando o "ENVIANDO…" passa de 8s,
  // o aparelho ANOTA CALADO o que estava vendo naquele instante — nada aparece
  // na tela, nada muda de regra, e em partida normal isto nunca dispara. É o
  // que faltava pra saber QUAL lado piscou (o do convidado ou o do host) em vez
  // de chutar. Ver `caixa-preta.ts`.
  useEffect(() => {
    if (!online || !pending || iSubmitted) return
    reenviosRef.current = 0
    const t = setTimeout(() => {
      const foto = fotoDaConexao()
      anotaTrava({
        room_id: state.roomId || null,
        sala: state.roomCode || null,
        papel: state.isHost ? 'host' : 'convidado',
        momento: state.phase === 'resq_envelope' ? 'resq_envelope' : 'envelope',
        setor: state.sectorIdx ?? null,
        segundos: 8,
        reenvios: reenviosRef.current,
        canal: foto.canal,
        host_calado_ms: Math.round(foto.hostCaladoMs),
        extra: { cartas: pendingBidsRef.current.length, restante: remaining, lacrados: state.submitted.length, humanos: humanBidders.length },
      })
    }, 8000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online, pending, iSubmitted])

  // auto-lacra ao zerar o timer. IMPORTANTE: lacra MESMO quem não pode dar lance
  // (setor completo / 22 jogadores → só assiste). Sem isso, um espectador solo
  // nunca lacrava, nada disparava a resolução da rodada e a tela travava eterno
  // no TEMPO 0s (bug: só dava pra voltar ao menu, fora do save). Envelope vazio
  // resolve o leilão normalmente.
  useEffect(() => {
    if (remaining > 0) return
    // ⚠️ SÓ no ENVELOPE: este efeito não pode tocar na REVELAÇÃO/monte (senão fica
    // disparando FORCE_SEAL à toa e atrapalha o avanço da revelação).
    if (state.phase !== 'envelope' && state.phase !== 'resq_envelope') return
    // 🤝 DUPLA: quem NÃO é da vez não lacra nem no estouro do tempo — o host
    // recusaria e este aparelho ficaria preso no "ENVIANDO…". Quem fecha a leva
    // é o FORCE_SEAL logo abaixo, que vale pra mesa inteira e não deixa o jogo
    // parar nem se o dono da posição tiver sumido (regra de ouro: nada atrasa).
    if (!minhaVez) { dispatch({ type: 'FORCE_SEAL' }); return }
    if (!iSubmitted && !pending) { seal(); return }
    // 🏛️ SOLO PRESO: já lacrei (ou não posso lançar) e o envelope NÃO resolveu — é o
    // leilão travado no "TEMPO 0s". FORCE_SEAL fecha os que faltam (no solo = só o MEU
    // assento) e resolve. No jogo normal o seal() acima já resolveu antes.
    if (!online) dispatch({ type: 'FORCE_SEAL' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, iSubmitted, pending, online, state.phase, minhaVez])

  // já lacrei, ou enviei e tô esperando o host confirmar (online)
  if (online && (iSubmitted || pending)) {
    return (
      <Shell bar={<AuctionBar />}>
        <div className="pt-10 text-center space-y-3">
          <div className="text-5xl">{iSubmitted ? '🔒' : '🔄'}</div>
          <h2 className="font-black text-2xl" style={OSWALD}>{iSubmitted ? 'ENVELOPE LACRADO' : 'ENVIANDO…'}</h2>
          <p className="font-semibold text-black/70">
            {iSubmitted
              ? `Aguardando os outros técnicos lacrarem…${noTimer ? ' o host fecha o pregão quando quiser.' : ` (${remaining}s)`}`
              : 'Confirmando com o host… se demorar muito, ele pode estar sem conexão — não se preocupe, seu lance fica guardado e a gente reenvia sozinho.'}
          </p>
          <Box className="p-3 mt-2 text-left">
            {humanBidders.map(m => (
              <p key={m.id} className="text-sm font-bold flex justify-between text-black">
                <span>{m.id === you.id ? '🫵 Você' : m.teamName}</span>
                <span>{state.submitted.includes(m.id) ? '✅ lacrou' : '⏳ pensando'}</span>
              </p>
            ))}
          </Box>
          {/* ZOEIRA: já lacrou? apressa quem tá "pensando" — aparece pra todos no
              mesmo balão das reações, com o SEU nome na frente. */}
          {iSubmitted && waitingFor.filter(m => m.id !== you.id).length > 0 && (() => {
            const slow = waitingFor.filter(m => m.id !== you.id)
            const target = () => (slow[Math.floor(Math.random() * slow.length)]?.teamName) ?? 'a galera'
            const jabs: { ic: string; label: string; mk: (n: string) => string }[] = [
              { ic: '🐢', label: 'Anda!', mk: n => `Anda, ${n}!` },
              { ic: '😴', label: 'Dormiu?', mk: n => `${n} dormiu?` },
              { ic: '🔒', label: 'Lacra logo!', mk: n => `Lacra logo, ${n}!` },
              { ic: '🧮', label: 'Conta moeda?', mk: n => `${n} tá contando moeda no dedo?` },
              { ic: '💸', label: 'Chora depois!', mk: n => `${n} vai gastar tudo e chorar depois` },
            ]
            return (
              <div className="mt-3">
                <p className="text-[11px] font-black text-black/45 mb-1.5" style={OSWALD}>😈 CUTUCA QUEM TÁ PENSANDO</p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {jabs.map(j => (
                    <button key={j.ic} onClick={() => emote(j.ic, undefined, j.mk(target()))}
                      className="border-2 border-black rounded-full px-2.5 py-1 text-xs font-black bg-white text-black active:translate-y-0.5" style={{ ...OSWALD, boxShadow: `2px 2px 0 0 ${INK}` }}>
                      {j.ic} {j.label}
                    </button>
                  ))}
                </div>
                {/* 🐊 A MASCOTE MORA AQUI, e não na carta (decisão do Diego 25/08):
                    *"os mascotes eu acho que só nos emojis onde tem contando moeda,
                    lacra logo e etc"*. Faz sentido: a cantada da carta é sobre O
                    JOGADOR, esta barra é sobre VOCÊ cutucando a galera — e a mascote
                    é a sua cara. De brinde, esta barra só existe DEPOIS que você
                    lacrou, então a mascote nunca pipoca na tela de quem ainda está
                    decidindo o lance. */}
                <MascoteJab />
              </div>
            )
          })()}
        </div>
      </Shell>
    )
  }

  // sobe/desce o lance com todas as travas (orçamento, nº de jogadores, piso).
  // "+" partindo do 0 pula pro piso; usado tanto no toque quanto no segurar.
  function bump(c: Card, dir: 1 | -1) {
    const floor = (c as { paid?: number }).paid ?? 0
    if (dir > 0) playCoin() // 🪙 som ao subir o lance
    setBids(prev => {
      const cur = prev[c.id] ?? 0
      if (dir < 0) {
        const v = Math.max(0, cur - 1)
        const next = { ...prev }
        if (v === 0) delete next[c.id]; else next[c.id] = v
        return next
      }
      const others = Object.entries(prev).reduce((s, [k, v]) => (k === c.id ? s : s + v), 0)
      const room = you.money - others // teto que ESTA carta pode receber
      if (cur >= room) return prev // sem moeda sobrando
      if (cur === 0 && Object.keys(prev).length >= bidLimit) return prev // já escolheu o máximo de jogadores
      const target = cur === 0 && floor > 0 ? floor : cur + 1
      const v = Math.min(target, room)
      if (cur === 0 && floor > 0 && v < floor) return prev // piso não cabe no orçamento → lance abaixo do piso é inválido
      return { ...prev, [c.id]: v }
    })
  }
  // 🎯 define o lance num valor DIRETO (atalho de números redondos / digitado),
  // com as mesmas travas do +/-: nunca acima do que cabe, nunca abaixo do piso.
  function setBidTo(c: Card, value: number) {
    const floor = (c as { paid?: number }).paid ?? 0
    if (value > 0) playCoin() // 🪙 som ao definir o lance (+5/+10, OK)
    setBids(prev => {
      const cur = prev[c.id] ?? 0
      const others = Object.entries(prev).reduce((s, [k, v]) => (k === c.id ? s : s + v), 0)
      const room = you.money - others // teto que ESTA carta pode receber
      if (value <= 0) { const next = { ...prev }; delete next[c.id]; return next } // 0 = tira o lance
      if (cur === 0 && Object.keys(prev).length >= bidLimit) return prev // já escolheu o máximo de jogadores
      let v = Math.max(value, floor) // nunca abaixo do piso (sobe pro piso)
      v = Math.min(v, room)          // nunca acima do que cabe no caixa
      if (v < floor || v <= 0) return prev // piso não cabe no orçamento → inválido
      return { ...prev, [c.id]: v }
    })
  }

  // ordem embaralhada do baralho (NÃO ordenar por nível — isso vazava quem é
  // bom pela posição na tela e furava o leilão às cegas)
  const cards = state.currentCards
  // cores dos técnicos (iguais às da tabela da temporada) — pra marcar de quem
  // é o jogador listado no leilão. Só na carreira online (onde há listagem).
  const seasonColors = state.careerOnline
    ? playerColors(
        state.managers.filter(m => m.isHuman || m.rival).map(m => m.id), you.id, state.seed, [],
        Object.fromEntries(state.managers.filter(m => m.isHuman).map(m => [m.id, perkFromSelo(m.teamName)])),
      )
    : {}
  const timerColor = remaining <= 10 ? RED : remaining <= 20 ? GOLD : GREEN
  const timerTextColor = remaining <= 20 ? INK : '#fff'
  const totalBatches = tecMesa ? 1 : batchCount(state.deck[pos].length)
  const curBatch = Math.min(totalBatches, Math.ceil(state.sectorCursor / BATCH_SIZE))
  // trava em quantos jogadores DIFERENTES dá pra apostar: no máximo suas
  // vagas abertas nessa posição (dá lance em todas de uma vez). Sem isso,
  // apostar em mais candidatos do que cabe é ambíguo — a resolução roda por
  // ordem de menor disputa, então você poderia ganhar o "backup" ao invés do
  // favorito, mesmo tendo dado lance maior nele.
  const bidLimit = myOpen
  const chosenCount = Object.keys(bids).length

  // com o pregão limpo o ensino só aparece na PRIMEIRA posição da partida —
  // nunca no meio do pregão, nunca de novo depois de fechado.
  const showLanceTip = firstGame && !tipClosed && (!pregaoLimpo || state.sectorIdx === 0)
  // 🏀 basquete: rápido = quinteto (5, 50 moedas); carreira/Street League = rotação
  // de 10 (100 moedas). Distingo pelo total de vagas do elenco (10 → carreira).
  const nbaRotacao = totalHoles(you) >= 8
  const tipTxt = sport === 'basquete'
    ? (nbaRotacao
      ? <>{L('💡 Aqui é leilão de VERDADE: quem dá MAIS moedas leva o jogador. Você tem 100 pra montar a rotação de 10.', '💡 This is a REAL auction: whoever bids the MOST coins gets the player. You have 100 to build your 10-man rotation.')}</>
      : <>{L('💡 Aqui é leilão de VERDADE: quem dá MAIS moedas leva o jogador. Você tem 50 pra montar o quinteto inteiro.', '💡 This is a REAL auction: whoever bids the MOST coins gets the player. You have 50 to build the whole five.')}</>)
    : state.sectorIdx % 2 === 0
    ? <>{L('💡 Aqui é leilão de VERDADE: quem dá MAIS moedas leva o jogador. Você tem 100 pra montar o time inteiro.', '💡 This is a REAL auction: whoever bids the MOST coins gets the player. You have 100 to build the whole team.')}</>
    : (getLang() === 'en'
      ? <>💡 The card level is the <b>player's peak at that club and year</b>: Kaká · São Paulo 2003 is a prospect, Kaká · Milan 2007 is a legend. Mind the club and the year!</>
      : <>💡 O nível da carta é o <b>auge do jogador naquele clube e ano</b>: Kaká · São Paulo 2003 é promessa, Kaká · Milan 2007 é lenda. Repara no clube e no ano!</>)
  return (
    <Shell bar={<AuctionBar vagas={pregaoLimpo && canBid ? bidLimit : undefined} ajuda={pregaoLimpo} />}>
      {sport !== 'basquete' && <NarradorDica fase="envelope" texto="✉️ Escreve teu lance ESCONDIDO — ninguém vê o de ninguém! Quem der mais, leva no martelo. E se segura: são 5 posições pra encher o time. 💰" />}
      {/* 🎓 O ENSINO. Com o pregão limpo as regras saem da frente das cartas — mas
          QUEM ESTÁ COMEÇANDO vê tudo aqui, uma vez, no começo da partida/carreira,
          com um "entendi" pra fechar. É a troca: ensina no momento certo em vez de
          empurrar a mesma regra em todo setor de toda temporada. */}
      {showLanceTip && !rescue && (pregaoLimpo ? (
        <div className="border-[3px] border-black rounded-xl p-3 text-center" style={{ background: `linear-gradient(180deg,#FFE07A,${GOLD})`, boxShadow: `3px 3px 0 0 ${INK}` }}>
          <p className="text-[9px] font-black uppercase tracking-wide text-black/50" style={OSWALD}>{L('Seu primeiro pregão', 'Your first auction')}</p>
          <p className="text-[16px] font-black leading-tight mt-0.5" style={OSWALD}>🏆 {L('GANHA QUEM DÁ O MAIOR LANCE', 'HIGHEST BID WINS')}</p>
          <p className="text-[11px] font-bold text-black/70 mt-1 leading-snug">
            {L('Não é 1 moeda que leva — é quem ', "It's not one coin that wins — it's who ")}<b>{L('paga mais', 'pays most')}</b>{L('. Empate? Re-lance às cegas. O lance é ', '. Tie? Blind re-bid. Bids are ')}<b>{L('cego', 'blind')}</b>{L(': ninguém vê nada até a revelação.', ': nobody sees anything until the reveal.')}
            {canBid && bidLimit > 0 && <> {L('Você tem ', 'You have ')}<b>{bidLimit === 1 ? L('1 vaga', '1 slot') : L(`${bidLimit} vagas`, `${bidLimit} slots`)}</b>{bidLimit > 1 ? L(' — dá pra dar lance em vários DE UMA VEZ.', ' — you can bid on several AT ONCE.') : '.'}</>}
          </p>
          <button onClick={() => setTipClosed(true)}
            className="w-full border-[3px] border-black rounded-xl py-2 mt-2.5 font-black text-[13px] active:translate-y-0.5"
            style={{ background: '#fff', color: INK, boxShadow: `3px 3px 0 0 ${INK}`, ...OSWALD, cursor: 'pointer' }}>
            {L('Entendi, bora dar lance 👊', 'Got it, let me bid 👊')}
          </button>
          <p className="text-[9px] font-bold text-black/45 mt-1.5">{L('Esqueceu? O ❓ lá em cima abre isso de novo, a qualquer hora.', 'Forgot? The ❓ up top reopens this any time.')}</p>
        </div>
      ) : (
        <div className="relative border-[3px] border-black rounded-xl p-3 pr-8" style={{ background: GOLD, boxShadow: `3px 3px 0 0 ${INK}` }}>
          <p className="text-[12.5px] font-black leading-snug" style={OSWALD}>{tipTxt}</p>
          <button onClick={() => setTipClosed(true)} aria-label="Fechar"
            className="absolute top-1 right-2 text-lg font-black" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
      ))}
      <div className="pt-1 flex items-start justify-between gap-3">
        <div className="flex-1">
          <h2 className="font-black text-3xl" style={OSWALD}>
            {rescue ? L('⚡ REPESCAGEM · ', '⚡ LEFTOVERS · ') : '🔨 '}{posName.toUpperCase()}
          </h2>
          <p className="text-sm font-semibold text-black/70">
            {rescue
              ? <>{L('Sobras do setor, última chance de pagar por elas. Só quem ficou com buraco participa. Suas vagas: ', 'Leftovers from this position — last chance to pay for them. Only those with an open slot join. Your slots: ')}<b>{myOpen}</b>.</>
              : L('Lance cego: distribua suas moedas em segredo. Ninguém vê nada até a revelação.', 'Blind bid: spread your coins in secret. No one sees anything until the reveal.')}
          </p>
          {/* 📰 setor TÉCNICO sondado: a historinha de bastidor explica por que
              ele está na mesa (a MESMA fofoca mostrada na hora da sondagem). */}
          {tecMesa && state.tecLote && (
            <p className="mt-1.5 text-[11px] font-bold border-[2px] border-dashed border-black rounded-lg px-2.5 py-1.5" style={{ background: '#FFF7DB', color: INK, lineHeight: 1.45 }}>
              📰 <b>Bastidor:</b> {historiaSondagem(state.tecLote.nome, state.tecLote.clube ? 'tec' : 'livre', state.tecLote.clube, state.seasonNo ?? 0)}
            </p>
          )}
          {!rescue && totalBatches > 1 && (
            <div className="mt-1.5 inline-flex items-center gap-1.5 border-[3px] border-black rounded-full px-3 py-1"
              style={{ backgroundColor: '#2E6FB0', boxShadow: `2px 2px 0 0 ${INK}` }}>
              <span className="text-sm leading-none">📦</span>
              <span className="text-[11px] font-black text-white uppercase tracking-wide" style={OSWALD}>
                {totalBatches - curBatch > 0
                  ? (lang === 'en'
                    ? `Batch ${curBatch} of ${totalBatches} · ${totalBatches - curBatch} more ${totalBatches - curBatch > 1 ? 'batches' : 'batch'} of ${posName.toLowerCase()} to come`
                    : `Leva ${curBatch} de ${totalBatches} · ainda ${totalBatches - curBatch > 1 ? 'vêm' : 'vem'} mais ${totalBatches - curBatch} leva${totalBatches - curBatch > 1 ? 's' : ''} de ${posName.toLowerCase()}`)
                  : (lang === 'en'
                    ? `Last batch of ${posName.toLowerCase()} · ${curBatch} of ${totalBatches}`
                    : `Última leva de ${posName.toLowerCase()} · ${curBatch} de ${totalBatches}`)}
              </span>
            </div>
          )}
        </div>
        {noTimer ? (
          <div className="border-[3px] border-black rounded-xl px-3 py-2 text-center min-w-[64px]"
            style={{ backgroundColor: '#2E6FB0', boxShadow: `3px 3px 0 0 ${INK}` }}>
            <p className="text-[9px] font-black uppercase text-white">{L('Ritmo', 'Pace')}</p>
            <p className="font-black text-lg leading-none text-white" style={OSWALD}>🎮 host</p>
          </div>
        ) : (
          <div className="border-[3px] border-black rounded-xl px-3 py-2 text-center min-w-[64px]"
            style={{ backgroundColor: timerColor, boxShadow: `3px 3px 0 0 ${INK}` }}>
            <p className="text-[9px] font-black uppercase" style={{ color: timerTextColor }}>{L('Tempo', 'Time')}</p>
            <p className="font-black text-2xl leading-none" style={{ ...OSWALD, color: timerTextColor }}>{remaining}s</p>
          </div>
        )}
      </div>

      {!canBid && (
        <Box bg={!minhaVez ? '#EDE4FF' : '#FFE9B0'} className="p-3">
          {!minhaVez ? (
            <>
              <p className="text-sm font-black text-black" style={OSWALD}>{L('🔒 Quem decide', '🔒 Who calls')} {secLabel(sport, pos, lang).toUpperCase()} {L('é', 'is')} {quemDecide ? stripEmoji(quemDecide).trim() : L('seu parceiro', 'your partner')}</p>
              <p className="text-[12px] font-bold text-black/65 leading-snug mt-0.5">
                ⏳ Você vê as mesmas cartas, mas nesta leva quem lacra é ele. Na leva da SUA posição é você que manda — e aí ele é que só assiste.
              </p>
              {parceiroSumiu && (
                <button onClick={assumirTime}
                  className="w-full border-[3px] border-black rounded-xl py-2.5 mt-2 font-black text-[13px] active:translate-y-0.5"
                  style={{ background: GREEN, color: '#fff', boxShadow: `3px 3px 0 0 ${INK}`, ...OSWALD }}>
                  🆘 {quemDecide ? stripEmoji(quemDecide).trim() : 'Seu parceiro'} caiu — assumir o time
                </button>
              )}
            </>
          ) : (
            <p className="text-sm font-bold text-black">{myOpen === 0 ? L('Setor completo — você só assiste esta rodada.', 'Position filled — you just watch this round.') : L('Sem dinheiro — resta torcer pelo Monte Final.', 'Out of coins — all that is left is the Final Pile.')}</p>
          )}
        </Box>
      )}

      {/* REGRA DE OURO + VAGAS — brilhante e centralizado logo acima dos lances,
          pra ninguém achar que 1 moeda leva nem que só dá pra apostar em um.
          🔨 PREGÃO LIMPO: isto sai da frente das cartas — a regra de ouro vai pro
          ❓ da barra (a um toque, com o relógio correndo do mesmo jeito) e as
          VAGAS sobem pra barra, onde ficam sempre visíveis. O 🎁 surpresa também
          sai: a carta JÁ mostra o presente com o nome borrado. */}
      {!pregaoLimpo && !rescue && canBid && bidLimit > 0 && (
        <div className="space-y-2">
          <div className="text-center border-[3px] border-black rounded-xl px-3 py-2"
            style={{ background: `linear-gradient(180deg, #FFE07A 0%, ${GOLD} 100%)`, boxShadow: `3px 3px 0 0 ${INK}` }}>
            <p className="font-black text-lg leading-tight" style={OSWALD}>🏆 {L('GANHA QUEM DÁ O MAIOR LANCE', 'HIGHEST BID WINS')}</p>
            <p className="text-[11px] font-bold text-black/70 mt-0.5">{L('Não é 1 moeda que leva — é quem ', 'It\'s not one coin that wins — it\'s who ')}<b>{L('paga mais', 'pays most')}</b>{L('. Empate? Re-lance às cegas.', '. Tie? Blind re-bid.')}</p>
          </div>
          <div className="text-center border-[3px] border-black rounded-xl px-3 py-1.5"
            style={{ background: '#E7F7EC', boxShadow: `3px 3px 0 0 ${INK}` }}>
            {bidLimit === 1
              ? <p className="text-sm font-black" style={{ color: '#146c33' }}>{L('Você tem ', 'You have ')}<b>{L('1 vaga', '1 slot')}</b>{L(' — dê seu lance em quem quer levar.', ' — bid on the one you want.')}</p>
              : <p className="text-sm font-black" style={{ color: '#146c33' }}>{L('Você tem ', 'You have ')}<b>{L(`${bidLimit} vagas`, `${bidLimit} slots`)}</b>{L(` — pode dar lance em até ${bidLimit} jogadores DE UMA VEZ nesta rodada, não só em um! 👈`, ` — you can bid on up to ${bidLimit} players AT ONCE this round, not just one! 👈`)}</p>}
          </div>
          {cards.some(c => c.id === state.surpriseId) && (
            <div className="text-center border-[3px] border-black rounded-xl px-3 py-1.5 text-white"
              style={{ background: PURPLE, boxShadow: `3px 3px 0 0 ${INK}` }}>
              <p className="text-sm font-black" style={OSWALD}>{L('🎁 JOGADOR SURPRESA nesta rodada!', '🎁 MYSTERY PLAYER in this round!')}</p>
              <p className="text-[11px] font-bold" style={{ opacity: 0.9 }}>O nome está escondido — você só vê posição, clube e ano. Arrisca no escuro; o nome sai no martelo.</p>
            </div>
          )}
        </div>
      )}

      {/* 🔨 PREGÃO LIMPO: este quadro é REDUNDANTE — a própria carta já mostra
          "mín 🔒 7" logo em cima da caixa do lance. A explicação foi pro ❓. */}
      {!pregaoLimpo && !state.streamMode && canBid && cards.some(c => ((c as { paid?: number }).paid ?? 0) > 0) && (
        <div className="text-center border-[3px] border-black rounded-xl px-3 py-1.5" style={{ background: '#FFF3D6', boxShadow: `3px 3px 0 0 ${INK}` }}>
          <p className="text-[11px] font-bold text-black/75">🔒 O número esmaecido é o <b>piso</b> do jogador — <b>não é lance</b>. Só vira lance quando você aperta <b>+</b> (aí fica preto). Abaixo do piso fica vermelho e é anulado.</p>
        </div>
      )}
      <div className="space-y-2">
        {cards.map(c => {
          const bid = bids[c.id] ?? 0
          const floor = (c as { paid?: number }).paid ?? 0 // piso (carreira): mínimo aceito neste leilão
          const chosen = bid > 0
          // "+" partindo do 0 pula direto pro piso (1º lance válido); daí em diante +1.
          const nextVal = bid === 0 && floor > 0 ? floor : bid + 1
          const plusBlocked = total + (nextVal - bid) > you.money || (!chosen && chosenCount >= bidLimit)
          const belowFloor = chosen && floor > 0 && bid < floor // lance abaixo do piso → será anulado
          const numColor = !chosen ? 'rgba(0,0,0,0.35)' : belowFloor ? RED : INK
          // 🎥 stream escondido: enquanto NÃO apertar "Ver meus lances", TUDO na
          // linha fica idêntico (mesmo cadeado, + sempre aceso) pra câmera não
          // denunciar em quem/quanto. Com o peek, volta a ser um jogo normal.
          const masked = state.streamMode && !peek
          // de quem é esse jogador listado (carreira): marca sutil na cor do técnico
          const sellerId = (c as { seller?: number }).seller
          const sellerM = sellerId != null ? state.managers.find(m => m.id === sellerId) : undefined
          const sCol = sellerM ? seasonColors[sellerM.id] : undefined
          // 😤 "mesmo dono" cobre os DOIS clubes do Multiclubes: soltou no
          // dormindo → também não recompra pelo ativo (e vice-versa)
          const isMine = sellerM != null && mesmoDono(state, you.id, sellerM.id)
          return (
          <Box key={c.id} className="p-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              {sellerM && (
                <span className="inline-flex items-center gap-1 rounded-full border-2 border-black px-1.5 py-0.5 text-[9px] font-black uppercase leading-none mb-1"
                  style={{ background: c.semContrato ? '#C2452F' : (sCol?.solid ?? '#6b7280'), color: '#fff', ...OSWALD }}>
                  {c.semContrato
                    ? (isMine ? L('😤 magoado com você', '😤 upset with you') : `⏳ sem contrato · ${sellerM.teamName}`)
                    : (isMine ? L('🫵 seu jogador', '🫵 your player') : `${sellerM.rival ? '⚔️' : sellerM.isHuman ? '🔥' : '🔁'} ${sellerM.teamName}`)}
                </span>
              )}
              <CardFace c={c} surprise={c.id === state.surpriseId} />
            </div>
            <div className="flex items-center gap-1.5">
              {/* 📝 ANTI-MALANDRAGEM: você deixou o contrato vencer → não recompra
                  este jogador (nem no monte). Trava com aviso do porquê. */}
              {canBid && c.semContrato && isMine && (
                <div className="border-2 border-black rounded-lg px-2 py-1.5 text-center max-w-[130px]" style={{ background: '#FDECEA' }}>
                  <p className="text-[9px] font-black uppercase leading-tight" style={{ ...OSWALD, color: RED }}>🙅 {L('não joga pra você!', "won't play for you!")}</p>
                  <p className="text-[8px] font-bold leading-tight text-black/60">{L('Você não quis renovar — ele se recusa a ir pra clube que você comanda. Só se outro clube levar.', "You refused to renew — he won't join any club you manage. Only if another club signs him.")}</p>
                </div>
              )}
              {canBid && !(c.semContrato && isMine) && (
                <div className="flex flex-col items-center">
                  {/* rótulo: carta com piso mostra o mínimo (🔒); senão, na 1ª tela, "seu lance".
                      Escondido no stream até o peek (aí volta como jogo normal). */}
                  {!masked && (floor > 0
                    ? <span className="text-[9px] font-black uppercase leading-none mb-0.5 tracking-wide" style={{ color: belowFloor ? RED : '#B8860B' }}>{L('mín', 'min')} 🔒 {floor}</span>
                    : state.sectorIdx === 0 && <span className="text-[9px] font-black uppercase leading-none mb-0.5 tracking-wide" style={{ color: '#B8860B' }}>{L('seu lance', 'your bid')}</span>)}
                  <div className="flex items-center gap-1.5">
                    <HoldButton onStep={() => bump(c, -1)} className="border-2 border-black rounded-lg w-8 h-8 font-black bg-white text-black">−</HoldButton>
                    {/* caixa do lance: toca e abre um modalzinho CENTRALIZADO pra
                        escolher/digitar o valor. No stream a caixa mostra sempre 🔒
                        (todas iguais) e o modal não mostra o nome do jogador — assim
                        a câmera não denuncia EM QUEM nem QUANTO você apostou. */}
                    <button onClick={() => { setTypeVal(chosen ? String(bid) : ''); setPickerCard(c) }}
                      className="w-14 h-8 text-base text-center font-black border-2 border-black rounded-lg bg-white active:opacity-60"
                      style={{ ...OSWALD, color: masked ? INK : numColor }}>
                      {masked ? '🔒' : (chosen ? bid : floor > 0 ? floor : 0)}
                    </button>
                    {/* escondido no stream o + NUNCA apaga (senão a câmera veria em
                        quem você apostou — o apagado denuncia). A trava segue por
                        dentro no bump(). Com o peek, volta o estado normal. */}
                    <HoldButton
                      onStep={() => bump(c, 1)}
                      disabled={masked ? false : plusBlocked}
                      className={`border-2 border-black rounded-lg w-8 h-8 font-black text-black ${!masked && plusBlocked ? 'opacity-40' : ''}`}
                      style={{ backgroundColor: GOLD }}>+</HoldButton>
                  </div>
                </div>
              )}
              {online && <CardReact cardId={c.id} />}
            </div>
          </Box>
          )
        })}
      </div>

      {state.streamMode && canBid && (
        <Box bg="#111" className="p-2.5 text-center space-y-2">
          <p className="font-black text-white text-xs" style={OSWALD}>{L('🎥 MODO STREAM — os valores ficam ocultos até o martelo. Manda ver no dedo! 🔒', '🎥 STREAM MODE — amounts stay hidden until the hammer. Go for it! 🔒')}</p>
          {/* pra quem NÃO está filmando: dá pra ver os próprios lances (só no seu aparelho) */}
          <button onClick={() => setPeek(p => !p)} className="w-full border-2 border-white/40 rounded-lg py-1.5 font-black text-xs" style={{ background: peek ? GOLD : 'transparent', color: peek ? '#000' : '#fff', ...OSWALD }}>
            {peek ? '🙈 Esconder meus lances' : '👁️ Ver meus lances'}
          </button>
        </Box>
      )}
      {minhaVez && (
      <Box bg="#fff" className="p-3 flex items-center justify-between">
        <p className="font-black text-black" style={OSWALD}>{L('ENVELOPE', 'ENVELOPE')}: {state.streamMode && !peek ? '🔒' : total} / {you.money}</p>
        <Btn onClick={seal} bg={RED}>
          <span className="text-white">{L('LACRAR', 'SEAL')} 🔒</span>
        </Btn>
      </Box>
      )}
      {online && waitingFor.length > 0 && (
        <p className="text-center text-xs font-bold text-black/60">Faltam lacrar: {waitingFor.map(m => m.teamName).join(', ')}</p>
      )}
      {/* ⏱️ leilão SEM cronômetro: só o HOST fecha o envelope e faz todo mundo
          avançar. Lacra o lance do host (se ainda não) e sela os que faltam. */}
      {online && noTimer && amHost && (
        <button onClick={() => { if (!iSubmitted && canBid) seal(); dispatch({ type: 'FORCE_SEAL' }) }}
          className="w-full border-[3px] border-black rounded-xl py-3 font-black active:translate-y-0.5"
          style={{ background: GREEN, color: '#fff', boxShadow: `3px 3px 0 0 ${INK}`, ...OSWALD }}>
          ▶️ Fechar o envelope e avançar{waitingFor.length > 0 ? ` · ${waitingFor.length} sem lacrar` : ''}
        </button>
      )}

      <YourPitch />
      <RivalsStrip />

      {/* 🎯 modalzinho pra escolher/digitar o lance. Fica CENTRALIZADO (neutro),
          então tocar nele não denuncia na câmera qual jogador você mirou. No
          stream: sem nome do jogador, valor mascarado e atalhos escondidos até
          o 👁️ — só você vê. Fora do stream: nome, mín/teto e atalhos à vontera. */}
      {pickerCard && (() => {
        const c = pickerCard
        const floor = (c as { paid?: number }).paid ?? 0
        const others = Object.entries(bids).reduce((s, [k, v]) => (k === c.id ? s : s + v), 0)
        const room = you.money - others // teto que cabe pra ESTA carta
        const cName = c.id === state.surpriseId ? L('🎁 Jogador Surpresa', '🎁 Mystery Player') : c.name
        const masked = state.streamMode && !peek
        const typed = parseInt(typeVal || '0', 10)
        const min = Math.max(1, floor)
        const valid = typed >= min && typed <= room
        const apply = (v: number) => { setBidTo(c, v); setPickerCard(null) }
        // atalhos RELATIVOS (+5/+10): não vazam o total na câmera, então podem
        // ficar à mostra até no stream. Somam ao valor atual, com as travas de
        // piso e teto; o +/- da linha continua ajustando de 1 em 1.
        const addN = (n: number) => {
          const base = parseInt(typeVal || '0', 10)
          const nv = Math.min(base === 0 ? Math.max(n, min) : base + n, room)
          if (nv < min) return
          setTypeVal(String(nv)); setBidTo(c, nv)
        }
        const atCap = (parseInt(typeVal || '0', 10) || min) >= room
        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,.6)' }} onClick={() => setPickerCard(null)}>
            <div className="w-full max-w-[280px] border-[3px] border-black rounded-2xl p-3.5 bg-[#F4ECD6]" style={{ boxShadow: `5px 5px 0 ${INK}` }} onClick={e => e.stopPropagation()}>
              <p className="font-black text-base" style={OSWALD}>{masked ? L('🔒 Seu lance secreto', '🔒 Your secret bid') : `✍️ ${cName}`}</p>
              {masked
                ? <p className="text-[11px] font-bold text-black/60 mb-2">{L('Só você vê o valor — a câmera não. Toque 👁️ pra conferir.', 'Only you see the amount — the camera does not. Tap 👁️ to check.')}</p>
                : <p className="text-[11px] font-bold text-black/60 mb-2">{floor > 0 ? `mín ${floor} · ` : ''}cabe até {room} 🪙</p>}
              {/* atalhos +5 / +10: relativos, seguros até no stream (não revelam o total) */}
              {room >= min && (
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {[5, 10].map(n => (
                    <button key={n} onClick={() => addN(n)} disabled={masked ? false : atCap}
                      className={`border-2 border-black rounded-lg py-2.5 font-black text-lg bg-white ${!masked && atCap ? 'opacity-40' : ''}`}
                      style={{ ...OSWALD, boxShadow: `2px 2px 0 0 ${INK}` }}>+{n}</button>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <input autoFocus inputMode="numeric" type="text" value={typeVal}
                  onChange={e => setTypeVal(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                  onKeyDown={e => { if (e.key === 'Enter' && valid) apply(typed) }}
                  placeholder={masked ? '••••' : 'digite…'}
                  className="flex-1 min-w-0 border-[3px] border-black rounded-xl px-3 py-2.5 font-black text-lg bg-white"
                  style={masked ? ({ WebkitTextSecurity: 'disc' } as CSSProperties) : undefined} />
                <button onClick={() => { if (valid) apply(typed) }} disabled={!valid}
                  className="border-[3px] border-black rounded-xl px-4 py-2.5 font-black text-base" style={{ background: valid ? GREEN : '#cfc6ae', color: '#fff', ...OSWALD }}>OK</button>
              </div>
              {!masked && typeVal !== '' && typed > room && <p className="text-[11px] font-black text-red-600 mt-1.5">💰 Passou do que cabe — máximo {room}.</p>}
              {!masked && typeVal !== '' && floor > 0 && typed > 0 && typed < floor && <p className="text-[11px] font-black text-red-600 mt-1.5">🔒 Abaixo do mínimo — mín {floor}.</p>}
              {masked && typeVal !== '' && !valid && <p className="text-[11px] font-black text-red-600 mt-1.5">{L('🔒 Esse valor não vale (fora do limite).', '🔒 That amount is not allowed (out of range).')}</p>}
              {state.streamMode && (
                <button onClick={() => setPeek(p => !p)} className="w-full mt-2 border-2 border-black rounded-lg py-1.5 font-black text-xs" style={{ background: peek ? GOLD : INK, color: peek ? '#000' : '#fff', ...OSWALD }}>
                  {peek ? L('🙈 Esconder (voltar pra câmera)', '🙈 Hide (back to camera)') : L('👁️ Mostrar só pra mim', '👁️ Show only to me')}
                </button>
              )}
              <div className="flex items-center justify-between mt-2.5">
                <button onClick={() => apply(0)} className="text-xs font-black text-black/55 underline active:opacity-60">🗑️ tirar</button>
                <button onClick={() => setPickerCard(null)} className="text-xs font-black text-black/55 underline active:opacity-60">fechar</button>
              </div>
            </div>
          </div>
        )
      })()}
    </Shell>
  )
}

// ─── LEILÃO: desempate (re-lance cego) ───────────────────────────────
const TIE_COLORS = [RED, '#2E6FB0', GREEN, '#B25AD0', '#E08A1E', '#0EA5A0']

function Tiebreak() {
  const { state, dispatch } = useEsc()
  const you = state.managers[state.youIdx]
  const tb = state.tiebreaks[state.tiebreakIdx]
  const online = state.onlineMode === 'online'

  const amInIt = !!tb && tb.managers.includes(you.id)
  const iSubmitted = !!tb && tb.submitted.includes(you.id)
  const [amount, setAmount] = useState(tb?.amount ?? 0)
  const [pending, setPending] = useState(false)
  const pendingAmtRef = useRef(0)

  // troca de disputa (ou entrada): zera o valor pro piso e limpa o pending
  useEffect(() => {
    setAmount(tb?.amount ?? 0)
    setPending(false)
  }, [tb?.cardId, tb?.amount])

  // cronômetro
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(iv)
  }, [])
  const remaining = state.phaseDeadline ? Math.max(0, Math.ceil((state.phaseDeadline - now) / 1000)) : 30

  function send(v: number) {
    pendingAmtRef.current = v
    setPending(true)
    dispatch({ type: 'SUBMIT_TIEBREAK', mgrId: you.id, amount: v, by: state.youUid })
  }
  // confirmação do host chegou
  useEffect(() => { if (iSubmitted) setPending(false) }, [iSubmitted])
  // reenvia enquanto não confirma (online)
  useEffect(() => {
    if (!online || !pending || iSubmitted) return
    const iv = setInterval(() => dispatch({ type: 'SUBMIT_TIEBREAK', mgrId: you.id, amount: pendingAmtRef.current, by: state.youUid }), 4000)
    return () => clearInterval(iv)
  }, [online, pending, iSubmitted, dispatch, you.id])
  // auto-envia ao zerar o timer (cobre o solo e o próprio jogador)
  useEffect(() => {
    if (remaining <= 0 && amInIt && !iSubmitted && !pending) send(amount)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, amInIt, iSubmitted, pending])

  // 🛟 sem desempate ativo (estado incompleto/sincronizando): mostra uma tela de
  // espera em vez de renderizar em branco. O host ressincroniza pelo heartbeat.
  if (!tb) return (
    <Shell bar={<AuctionBar />}>
      <div className="text-center pt-12 space-y-2">
        <p className="text-4xl">⚔️</p>
        <p className="font-black text-lg" style={OSWALD}>Preparando o desempate…</p>
        <p className="text-sm font-bold text-black/60">{online ? 'Sincronizando com o host…' : 'Só um instante.'}</p>
      </div>
    </Shell>
  )

  const total = state.tiebreaks.length
  const maxBid = you.money
  const canRaise = amount < maxBid
  const names = tb.managers.map((id, i) => {
    const m = state.managers.find(x => x.id === id)!
    return { id, label: m.id === you.id ? '🫵 Você' : (m.teamName || m.name), color: TIE_COLORS[i % TIE_COLORS.length], done: tb.submitted.includes(id) }
  })

  const header = (
    <div className="text-center space-y-1 pt-1">
      <p className="text-xs font-black uppercase" style={{ color: RED }}>
        ⚔️ Desempate {state.tiebreakIdx + 1} / {total} · empate no maior lance
      </p>
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {names.map((n, i) => (
          <span key={n.id} className="flex items-center gap-1">
            {i > 0 && <span className="text-black/40 text-xs font-black">×</span>}
            <span className="border-2 border-black rounded-full px-2.5 py-0.5 text-[11px] font-black text-white"
              style={{ backgroundColor: n.color }}>{n.label}{n.done ? ' ✅' : ''}</span>
          </span>
        ))}
      </div>
      <p className="text-sm font-semibold text-black/70">
        Empataram em <b>{tb.amount}</b>. Re-lance <b>às cegas</b> só nesta carta — quem paga mais leva.
        Empatar de novo cai na 🎡 roleta.
      </p>
    </div>
  )

  // espectador: não está no empate
  if (!amInIt) {
    return (
      <Shell bar={<AuctionBar />}>
        {header}
        <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Box bg={DUELO} className="p-5 relative" shadow={6}>
            {/* selo igual ao 👑 LENDA da revelação: diz o que a caixa é, em vez de
                deixar a COR falar (que era o que confundia). */}
            <span className="absolute top-2 right-2 z-10 text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-black bg-white" style={OSWALD}>⚔️ DESEMPATE</span>
            <CardFace c={tb.card} big claro />
            <p className="mt-4 text-center font-black text-lg text-white" style={OSWALD}>🍿 Você assiste este duelo</p>
            <p className="text-center text-sm font-bold text-white/75">
              Já re-lançaram: {tb.submitted.length}/{tb.managers.length}
            </p>
          </Box>
        </motion.div>
        <YourPitch small />
      </Shell>
    )
  }

  // participante que já enviou
  if (iSubmitted || pending) {
    return (
      <Shell bar={<AuctionBar />}>
        {header}
        <div className="pt-6 text-center space-y-3">
          <div className="text-5xl">{iSubmitted ? '🔒' : '🔄'}</div>
          <h2 className="font-black text-2xl" style={OSWALD}>{iSubmitted ? 'RE-LANCE ENVIADO' : 'ENVIANDO…'}</h2>
          <p className="font-semibold text-black/70">
            {iSubmitted ? `Aguardando os outros do empate… (${remaining}s)` : 'Confirmando com o host…'}
          </p>
          <Box className="p-3 text-left max-w-xs mx-auto">
            {names.map(n => (
              <p key={n.id} className="text-sm font-bold flex justify-between text-black">
                <span>{n.label}</span><span>{n.done ? '✅ lançou' : '⏳ pensando'}</span>
              </p>
            ))}
          </Box>
        </div>
      </Shell>
    )
  }

  // participante decidindo o re-lance
  const timerColor = remaining <= 8 ? RED : remaining <= 15 ? GOLD : GREEN
  const timerTextColor = remaining <= 15 ? INK : '#fff'
  return (
    <Shell bar={<AuctionBar />}>
      {header}
      <div className="flex justify-end">
        <div className="border-[3px] border-black rounded-xl px-3 py-1.5 text-center min-w-[60px]"
          style={{ backgroundColor: timerColor, boxShadow: `3px 3px 0 0 ${INK}` }}>
          <p className="text-[9px] font-black uppercase" style={{ color: timerTextColor }}>Tempo</p>
          <p className="font-black text-xl leading-none" style={{ ...OSWALD, color: timerTextColor }}>{remaining}s</p>
        </div>
      </div>
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <Box bg={DUELO} className="p-5 relative" shadow={6}>
          <span className="absolute top-2 right-2 z-10 text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-black bg-white" style={OSWALD}>⚔️ DESEMPATE</span>
          <CardFace c={tb.card} big claro />
        </Box>
      </motion.div>
      <Box bg="#fff" className="p-4 space-y-3">
        <p className="text-center font-black text-black" style={OSWALD}>SEU RE-LANCE</p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setAmount(v => Math.max(tb.amount, v - 1))}
            className="border-2 border-black rounded-lg w-11 h-11 font-black text-xl bg-white text-black">−</button>
          <span className="w-16 text-center font-black text-3xl text-black" style={OSWALD}>{amount}</span>
          <button onClick={() => canRaise && setAmount(v => Math.min(maxBid, v + 1))} disabled={!canRaise}
            className={`border-2 border-black rounded-lg w-11 h-11 font-black text-xl text-black ${canRaise ? '' : 'opacity-40'}`}
            style={{ backgroundColor: GOLD }}>+</button>
        </div>
        <p className="text-center text-xs font-bold text-black/55">
          Mínimo {tb.amount} · seu caixa 💰 {you.money}
        </p>
        <Btn onClick={() => send(amount)} bg={RED} className="w-full">
          <span className="text-white">{amount > tb.amount ? `COBRIR POR ${amount} 🔨` : `MANTER ${amount} 🔒`}</span>
        </Btn>
      </Box>
      <YourPitch small />
    </Shell>
  )
}

// ─── LEILÃO: revelação ───────────────────────────────────────────────
// avança sozinho depois de alguns segundos. Usa PRAZO por relógio real, não
// só um setTimeout cego: quem tá de espectador (saldo negativo, sem lance
// pra dar) não toca na tela — se a aba fica em 2º plano nesse meio tempo, o
// navegador atrasa/pausa o setTimeout e a revelação ficava presa pra sempre
// (só um F5 destravava). Com prazo (Date.now()) + um poll de reforço, assim
// que a aba volta a rodar de verdade a gente vê que o prazo já passou e
// avança na hora — sem precisar recarregar a página.
function AutoAdvance({ hasBids, canDrive, extraMs = 0 }: { hasBids: boolean; canDrive: boolean; isLast: boolean; extraMs?: number }) {
  const { state, dispatch } = useEsc()
  useEffect(() => {
    if (!canDrive) return
    const delay = (hasBids ? 2000 : 1000) + extraMs
    const due = Date.now() + delay
    let fired = false
    const fire = () => { if (fired) return; fired = true; dispatch({ type: 'ADVANCE_REVEAL' }) }
    const t = setTimeout(fire, delay)
    const iv = setInterval(() => { if (Date.now() >= due) fire() }, 1000)
    const onVis = () => { if (!document.hidden && Date.now() >= due) fire() }
    document.addEventListener('visibilitychange', onVis)
    return () => { clearTimeout(t); clearInterval(iv); document.removeEventListener('visibilitychange', onVis) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.revealIdx, state.phase, canDrive, hasBids, extraMs])
  return null
}

// sorteio visual da roleta na revelação: destaca os empatados em sequência,
// desacelerando, e para no vencedor (que o host já decidiu).
function TieSorteio({ names, winnerId }: { names: { id: number; label: string; color: string }[]; winnerId: number }) {
  const winIdx = Math.max(0, names.findIndex(n => n.id === winnerId))
  const [hi, setHi] = useState(0)
  useEffect(() => {
    const total = names.length * 4 + winIdx // volta algumas voltas e para no vencedor
    let stop = false
    function tick(step: number) {
      if (stop) return
      setHi(step % names.length)
      if (step >= total) return
      const t = 70 + step * 14 // desacelera
      setTimeout(() => tick(step + 1), t)
    }
    tick(0)
    return () => { stop = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winnerId])
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1">
      {names.map((n, i) => {
        const on = i === hi
        return (
          <span key={n.id} className="border-2 border-black rounded-full px-2.5 py-0.5 text-[11px] font-black text-white transition-transform"
            style={{ backgroundColor: n.color, opacity: on ? 1 : 0.45, transform: on ? 'scale(1.12)' : 'scale(1)' }}>
            {n.label}
          </span>
        )
      })}
    </div>
  )
}

// 🎉 FESTÃO DA LENDA (Revelação Cinema — EM TESTE, só na conta liberada): confete
// + brilho dourado no instante do martelo quando uma LENDA é arrematada. É SÓ
// visual (one-shot, pointer-events:none) — não encosta em nenhuma lógica do leilão.
// Fora da conta liberada nem é renderizado, então o jogo dos outros fica idêntico.
function LendaParty({ delay }: { delay: number }) {
  const pieces = useMemo(() => Array.from({ length: 18 }, (_, i) => ({
    x: (Math.random() * 2 - 1) * 150,
    rot: (Math.random() * 2 - 1) * 240,
    dur: 0.9 + Math.random() * 0.7,
    emoji: ['🎉', '👑', '✨', '💛', '🔨', '🎊'][i % 6],
    sc: 0.8 + Math.random() * 0.9,
  })), [])
  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden" aria-hidden>
      <motion.div className="absolute left-1/2 top-1/2 rounded-full"
        style={{ width: 320, height: 320, marginLeft: -160, marginTop: -160, background: 'radial-gradient(circle, rgba(255,196,0,0.7), transparent 65%)' }}
        initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: [0, 0.9, 0], scale: [0.3, 1.3, 1.7] }}
        transition={{ delay, duration: 1.2, ease: 'easeOut' }} />
      {pieces.map((p, i) => (
        <motion.span key={i} className="absolute left-1/2 top-1/3 text-2xl"
          initial={{ opacity: 0, x: 0, y: 0, scale: 0.4, rotate: 0 }}
          animate={{ opacity: [0, 1, 1, 0], x: p.x, y: [0, -34, 280], scale: p.sc, rotate: p.rot }}
          transition={{ delay, duration: p.dur + 0.7, ease: 'easeOut' }}>{p.emoji}</motion.span>
      ))}
    </div>
  )
}

// ─── 🔨 A MESA DO MARTELO (Diego 17/08) ─────────────────────────────────────
// Ideia dele, a partir de uma imagem que viu: no rápido online os técnicos param
// de ser uma LISTA embaixo da carta e passam a sentar EM VOLTA dela, com a carta
// no meio e VOCÊ embaixo fechando a mesa.
//
// ⚠️ É SÓ MOLDURA — regra nenhuma muda. Palavras do Diego: *"quero tudo igual sem
// mudar nada, nada nada. Só tô mudando visualmente o resultado da oferta que vai
// ser revelado, com animações"*. Então continua idêntico: os MESMOS lances, os
// MESMOS valores à vista, a MESMA ordem (maior primeiro), o MESMO anti-spoiler
// (verde só depois que o martelo bate), o MESMO "anulado (setor cheio)", o MESMO
// 😱 QUASE, os MESMOS sons e os MESMOS tempos (delay i*0.25, igual à lista).
//
// Cada técnico senta com o ESCUDO do clube — ninguém fica sem, porque o escudo
// nasce do NOME (escudos.tsx) e quem batizou entra com a arte que pagou. A cor do
// PRÓPRIO tier veste a barra do lance (degradê do APOIO_PERKS + o brilho holo dos
// pagos), nunca dourado emprestado pra todos.
function MesaMartelo({ bids, winner, voided, hammered, youId, managers, centro, passo, total }: {
  bids: { mgr: number; amount: number }[]
  winner: number | null
  voided: number[]
  hammered: boolean
  youId: number
  managers: { id: number; teamName: string; name: string }[]
  centro: React.ReactNode
  passo: number // revelação atual dentro da leva (0-based)
  total: number // quantas revelações a leva tem
}) {
  // 🏅 A FILA É A ORDEM DE LEITURA (Diego 17/08). Ele viu que a mesa tinha COMIDO
  // o ranking que a lista antiga dava de graça ("só não sei se tá claro a ordem de
  // quem pagou mais"). Conserto: os assentos são preenchidos ALTERNANDO esquerda e
  // direita na ordem do maior lance — então ler a mesa como se lê um texto (linha
  // por linha, esquerda→direita) JÁ dá a classificação. E cada assento carrega o
  // SELO da posição (🥇 · 2º · 3º…), pra ninguém precisar comparar número.
  //
  // 🫵 VOCÊ NÃO TEM LUGAR FIXO. Antes o teu assento ficava sempre embaixo, e o
  // Diego cortou: *"acho que a minha não deve ser preferencial embaixo, porque
  // confunde"* — com razão: se a leitura é o ranking, te prender no fim faz você
  // parecer último mesmo quando levou a carta. Agora você senta na SUA posição,
  // como todo mundo; o que te acha na mesa é o "🫵 VOCÊ", a moldura mais grossa e
  // a cor do teu tier — nunca o lugar.
  const ordem = [...bids].sort((a, b) => b.amount - a.amount)
  // sala cheia aperta o assento (a carta do meio NUNCA encolhe)
  const mini = ordem.length > 7
  const esq = ordem.filter((_, i) => i % 2 === 0)
  const dir = ordem.filter((_, i) => i % 2 === 1)
  const perkDe = (mgr: number, teamName: string) => (mgr === youId ? myApoioPerk() : perkFromSelo(teamName)) ?? APOIO_PERKS.bege

  const assento = (b: { mgr: number; amount: number }, ordIdx: number) => {
    const m = managers.find(x => x.id === b.mgr)
    if (!m) return null
    const anulado = voided.includes(b.mgr)
    const venceu = winner === b.mgr && hammered
    const souEu = b.mgr === youId
    const perk = perkDe(b.mgr, m.teamName)
    const nome = m.teamName || m.name
    // 🥇 a medalha só nasce DEPOIS do martelo — antes do apito ninguém é campeão.
    const selo = ordIdx === 0 && venceu ? '🥇' : `${ordIdx + 1}º`
    return (
      <motion.div key={b.mgr} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: ordIdx * 0.25 }}
        className="relative overflow-hidden text-center rounded-xl"
        style={{ background: '#fff', border: `${souEu ? 3 : 2.5}px solid ${venceu ? GREEN : INK}`, boxShadow: `2.5px 2.5px 0 0 ${venceu ? GREEN : INK}`, padding: mini ? '4px 3px 4px' : '6px 4px 5px' }}>
        {perk.holo > 0 && <ApoioSheen holo={perk.holo} />}
        <span className="absolute z-10 font-black" style={{ ...OSWALD, top: -1, left: -1, fontSize: mini ? 7.5 : 8.5, letterSpacing: 0.3, lineHeight: 1.5,
          background: selo === '🥇' ? GOLD : INK, color: selo === '🥇' ? INK : '#fff', border: `2px solid ${INK}`, borderRadius: '0 0 9px 0', padding: '0 5px 1px' }}>{selo}</span>
        <div className="flex justify-center relative"><Escudo nome={nome} size={mini ? 24 : 32} /></div>
        <p className="font-bold truncate relative" style={{ fontSize: mini ? 8.5 : 10, marginTop: 2 }}>{souEu ? '🫵 VOCÊ' : stripEmoji(nome)}</p>
        <div className="rounded-lg font-black relative" style={{ ...OSWALD, marginTop: 3, border: `2px solid ${INK}`, fontSize: mini ? 11 : 13, lineHeight: 1.35,
          background: venceu ? GREEN : anulado ? '#ddd' : perk.grad, color: venceu ? '#fff' : TIER_INK[perk.tier] }}>{b.amount}</div>
        {anulado && <p className="font-bold relative" style={{ fontSize: 7.5, marginTop: 1, color: 'rgba(0,0,0,.55)' }}>anulado (setor cheio)</p>}
      </motion.div>
    )
  }

  return (
    <div className="mt-3">
      {/* 🔒 A FAIXA DO MOMENTO (ideia que o GPT deu e o Diego aprovou, 17/08): antes
          a mesa abria em silêncio e ninguém sabia o que estava rolando nem quanto
          faltava. Agora diz o momento em uma linha e mostra as BOLINHAS da leva —
          uma por revelação, a de agora acesa. Custo de tempo: ZERO (é só leitura
          do estado que já existe). */}
      <div className="text-center" style={{ marginBottom: 7 }}>
        <p className="font-black uppercase" style={{ ...OSWALD, fontSize: 10.5, letterSpacing: '.06em' }}>
          🔒 Todos lacraram!{' '}
          <span className="font-bold" style={{ color: 'rgba(0,0,0,.5)', letterSpacing: 0 }}>{hammered ? 'martelo batido.' : 'revelando lances…'}</span>
        </p>
        {total > 1 && (
          <div className="flex justify-center items-center" style={{ gap: 4, marginTop: 4 }}>
            {Array.from({ length: Math.min(total, 12) }, (_, i) => (
              <span key={i} style={{ width: i === passo ? 9 : 6, height: i === passo ? 9 : 6, borderRadius: 999,
                background: i === passo ? GOLD : i < passo ? INK : 'rgba(0,0,0,.18)',
                border: i === passo ? `1.5px solid ${INK}` : 'none', display: 'block' }} />
            ))}
          </div>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto minmax(0,1fr)', gap: 6, alignItems: 'center' }}>
        <div style={{ display: 'grid', gap: 6, minWidth: 0, alignContent: 'center' }}>{esq.map((b, i) => assento(b, i * 2))}</div>
        <div style={{ width: 122 }}>{centro}</div>
        <div style={{ display: 'grid', gap: 6, minWidth: 0, alignContent: 'center' }}>{dir.map((b, i) => assento(b, i * 2 + 1))}</div>
      </div>
    </div>
  )
}

function Reveal() {
  const avatarPreview = useLegendPresentation()
  const { state, dispatch } = useEsc()
  const cinema = useRevealCinema() // 🔨🎬 festão da Lenda: só na conta liberada (Diego)
  const item = state.revealQueue[state.revealIdx]
  const you = state.managers[state.youIdx]
  const online = state.onlineMode === 'online'
  const canDrive = !online || state.isHost
  // 🛟 AUTO-CURA: se a revelação ficou SEM carta (leva vazia ou índice fora de
  // faixa — ex.: um save antigo gravado nesse instante), em vez de tela em branco,
  // quem conduz (solo/host) empurra pro próximo passo; convidado espera o sync do
  // host. Junto com a guarda na causa-raiz, ninguém trava mais numa revelação vazia.
  // 🐛 FIX 15/08 (relato do Diego: "trava na 1ª carta e só o F5 resolve"): antes
  // era UMA tentativa de 80ms. Se ela não pegasse (ex.: a fase não é mais de
  // revelação — ADVANCE_REVEAL é recusado; ou o convidado esperando um sync do
  // host que não chegou), a tela ficava PRESA pra sempre no "Preparando o
  // pregão…", sem timer, sem retry e sem saída. Agora: (1) quem conduz INSISTE
  // a cada 700ms; (2) depois de 5s preso, TODO MUNDO (inclusive convidado) ganha
  // um botão de destravar — ninguém mais precisa adivinhar que o F5 resolve.
  const [presoHa, setPresoHa] = useState(0)
  useEffect(() => {
    if (item) { setPresoHa(0); return }
    const t0 = Date.now()
    const iv = setInterval(() => {
      if (canDrive) dispatch({ type: 'ADVANCE_REVEAL' })
      setPresoHa(Math.floor((Date.now() - t0) / 1000))
    }, 700)
    return () => clearInterval(iv)
  }, [item, canDrive, dispatch])
  // 🔨 martelada quando a carta é vendida + ✨ chime dourado se for LENDA,
  // sincronizados com o momento que o martelo bate na tela (hammerDelay).
  useEffect(() => {
    const it = state.revealQueue[state.revealIdx]
    if (!it) return
    const tieHit = state.tiebreaks.find(t => t.card.id === it.card.id && t.winner !== null)
    const delayMs = (it.bids.length * 0.25 + (tieHit ? 1.2 : 0.2)) * 1000
    const sold = it.winner !== null && it.bids.length > 0
    // identidade EXPLÍCITA: sons só com "eu" válido e humano. Sem isso, carta sem
    // vendedor (campo vazio) batia com "você" vazio num piscar de transição —
    // "vazio === vazio" dava verdadeiro e o faah/martelo tocava em vitória de CPU.
    const meId = you && you.isHuman ? you.id : null
    const iWon = sold && meId != null && it.winner === meId // 🔨 só pra QUEM levou a carta
    const sellerId = (it.card as { seller?: number }).seller
    // 🔨 e pro VENDEDOR (carreira): jogador SEU listado arrematado por outro.
    const iSold = sold && meId != null && sellerId != null && sellerId === meId && it.winner !== meId
    const timers: ReturnType<typeof setTimeout>[] = []
    if (iWon || iSold) timers.push(setTimeout(() => playHammer(), delayMs))
    // 🎙️ ÁUDIO DA LENDA (meme "faah"): só pra QUEM pega a lenda no martelo — ou pra
    // quem VENDE uma lenda listada (a venda dele fechando). Vale em todos os modos
    // que usam o reveal; respeita o mudo (playMp3). Substitui o antigo chime.
    if (it.card.fame >= 5 && (iWon || iSold)) timers.push(setTimeout(() => playMp3(`${import.meta.env.BASE_URL}sfx/lenda.mp3`), delayMs + 260))
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.revealIdx])
  // 🔨 ANTI-SPOILER: o vencedor só fica VERDE quando o martelo bate (hammerDelay) —
  // nunca antes. Sem isto, a linha do maior lance entrava já verde em ~0s e a sala
  // via quem ganhou (e por quanto) antes do apito/martelo.
  const agLibReveal = useAgenciaLiberada() // 🔒 banner da Agência 2.0: por enquanto só a conta do Diego
  const [hammered, setHammered] = useState(false)
  useEffect(() => {
    setHammered(false)
    const it = state.revealQueue[state.revealIdx]
    if (!it) return
    const tieHit = state.tiebreaks.some(t => t.card.id === it.card.id && t.winner !== null)
    const hd = it.bids.length * 0.25 + (tieHit ? 1.2 : 0.2)
    const t = setTimeout(() => setHammered(true), hd * 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.revealIdx])
  if (!item) return (
    <Shell bar={<AuctionBar />}>
      <div className="text-center pt-12 space-y-2">
        <p className="text-4xl">⚽</p>
        <p className="font-black text-lg" style={OSWALD}>Preparando o pregão…</p>
        <p className="text-sm font-bold text-black/60">{online ? 'Sincronizando com o host…' : 'Só um instante.'}</p>
        {presoHa >= 5 && (
          <div className="pt-4 px-6 space-y-2">
            <p className="text-xs font-bold text-black/70 leading-snug">
              Demorou mais que o normal pra destravar. Pode ser conexão. <b>Nada se perde</b> — o leilão volta de onde parou.
            </p>
            <button onClick={() => window.location.reload()}
              className="w-full border-[3px] border-black rounded-xl py-2.5 font-black uppercase active:translate-y-0.5"
              style={{ ...OSWALD, background: GOLD, color: INK, boxShadow: `3px 3px 0 ${INK}` }}>
              🔄 Destravar o pregão
            </button>
          </div>
        )}
      </div>
    </Shell>
  )
  const winnerMgr = item.winner !== null ? state.managers.find(m => m.id === item.winner) : null
  const isLast = state.revealIdx >= state.revealQueue.length - 1
  // essa carta passou por desempate?
  const tie = state.tiebreaks.find(t => t.card.id === item.card.id && t.winner !== null)
  const tieMax = tie ? Math.max(...tie.managers.map(id => tie.bids?.[id] ?? tie.amount)) : 0
  const tieRows = tie ? tie.managers.map((id, i) => {
    const m = state.managers.find(x => x.id === id)!
    const amt = tie.bids?.[id] ?? tie.amount
    return { id, label: m.id === you.id ? '🫵 Você' : (m.teamName || m.name), color: TIE_COLORS[i % TIE_COLORS.length], amt, atTop: amt === tieMax }
  }).sort((a, b) => b.amt - a.amt) : []
  const rouletteNames = tieRows.filter(r => r.atTop).map(r => ({ id: r.id, label: r.label, color: r.color }))
  // "MARTELO!": só quando teve venda de verdade (houve lance vencedor)
  const sold = winnerMgr !== null && item.bids.length > 0
  const hammerDelay = item.bids.length * 0.25 + (tie ? 1.2 : 0.2)
  // 🔨 A MESA DO MARTELO só vale no RÁPIDO ONLINE (pedido do Diego 17/08: "isso é
  // só pro modo online rápido"). Solo e carreira seguem na lista de sempre, byte
  // por byte — se a mesa der qualquer problema, ela não alcança o resto do jogo.
  const mesaModo = online && !state.careerOnline
  const privateReveal = avatarPreview && state.sport !== 'basquete'
  const mesaOn = mesaModo && item.bids.length > 0 && !privateReveal
  const identityVisible = revealIdentityVisible(item.card.id === state.surpriseId, hammered, sold)
  const offerRows = privateReveal
    ? revealOffers(item.bids, item.voided, item.winner, hammered)
    : [...item.bids].sort((a, b) => b.amount - a.amount)

  return (
    <Shell bar={<AuctionBar />}>
      {/* 🎙️ A DICA DO NARRADOR SAI DA REVELAÇÃO ONDE A MESA MANDA (Diego 17/08).
          A dica existia porque a lista não contava nada: era ela que explicava que
          o maior lance leva a carta e que perder por pouco vira QUASE. A mesa passou
          a contar isso sozinha — a faixa diz o momento, as bolinhas dizem quanto
          falta, o selo diz a posição de cada um. Manter a dica aqui virava texto de
          guia por cima do martelo, comendo meia tela no melhor momento do jogo.
          Ela continua VIVA em todo o resto (solo, carreira, outras fases) e o
          conteúdo segue no Manual. */}
      {state.sport !== 'basquete' && !mesaModo && <NarradorDica fase="revelacao" texto="👀 Abriram os envelopes! O maior lance leva a carta. Cobriram o seu? QUASE! Se recompõe e vem mais esperto na próxima leva. 🔨" />}
      <p className="text-center text-xs font-black uppercase text-black/70 pt-1">
        Revelação {state.revealIdx + 1} / {state.revealQueue.length} · pote crescente
      </p>
      <motion.div key={item.card.id} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <motion.div animate={sold ? { x: [0, -11, 11, -8, 8, -4, 4, 0] } : undefined}
          transition={{ delay: hammerDelay, duration: 0.5 }}>
        <Box bg={item.card.fame >= 5 ? GOLD : '#fff'} className={`p-5 relative ${privateReveal ? 'll-private-reveal' : ''}`} shadow={6}>
          {item.card.fame >= 5 && (
            <span className="absolute top-2 right-2 z-10 text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-black bg-white" style={OSWALD}>👑 LENDA</span>
          )}
          {item.card.id === state.surpriseId && (
            <span className="absolute top-2 left-2 z-10 text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-black text-white" style={{ ...OSWALD, background: PURPLE }}>🎁 SURPRESA</span>
          )}
          {/* 🎁 SURPRESA anti-spoiler: o nome fica BORRADO até alguém GANHAR de fato
              (martelo com vencedor). Sem lance = nunca revela (vai pro Monte às cegas);
              com lance = borrado até o martelo bater. */}
          {!mesaOn && (privateReveal && identityVisible && avatarLote1(item.card.name, item.card.club, item.card.year)
            ? <div className="ll-lote1-reveal-card"><CollectibleCard {...item.card}/></div>
            : <CardFace c={item.card} big surprise={item.card.id === state.surpriseId && !(hammered && sold)} highlight={item.card.id === state.surpriseId} />)}
          {cinema && sold && item.card.fame >= 5 && <LendaParty delay={hammerDelay} />}
          {/* (carimbo grande "VENDIDO!" removido — vazava da carta e repetia o texto
              "🔨 VENDIDO pro X por Y!" que já existe embaixo. O festão da Lenda fica.) */}
          {mesaOn ? (
            <MesaMartelo bids={item.bids} winner={item.winner} voided={item.voided} hammered={hammered}
              youId={you.id} managers={state.managers} passo={state.revealIdx} total={state.revealQueue.length}
              centro={(() => {
                // 🃏 A CARTA DO MEIO COM CARA DE CARTA (17/08): faixa de raridade em
                // cima, tag da posição, nome grande e clube·ano embaixo. Antes era
                // uma caixinha de texto — agora é o que está sendo leiloado, no
                // centro da mesa, do tamanho que merece.
                // 🙈 O anti-spoiler da SURPRESA é o MESMO do CardFace: o nome real
                // nem entra no HTML enquanto não bate o martelo com vencedor.
                const escondido = item.card.id === state.surpriseId && !(hammered && sold)
                if (avatarPreview && hammered && sold && !escondido && avatarLote1(item.card.name, item.card.club, item.card.year)) return <div className="ll-lote1-reveal-card"><CollectibleCard {...item.card}/></div>
                const lenda = item.card.fame >= 5
                return (
                  <div className="rounded-2xl text-center relative overflow-hidden"
                    style={{ border: `3px solid ${INK}`, boxShadow: `3px 3px 0 0 ${INK}`, background: lenda ? GOLD : '#fff' }}>
                    {(lenda || item.card.id === state.surpriseId) && (
                      <p className="font-black uppercase" style={{ ...OSWALD, fontSize: 8.5, letterSpacing: '.14em', padding: '2px 0 3px',
                        background: item.card.id === state.surpriseId ? PURPLE : INK, color: item.card.id === state.surpriseId ? '#fff' : GOLD }}>
                        {item.card.id === state.surpriseId ? '🎁 Surpresa' : '👑 Lenda'}
                      </p>
                    )}
                    <div style={{ padding: '7px 6px 8px' }}>
                      <span className="inline-block border-2 border-black rounded-full font-black"
                        style={{ ...OSWALD, fontSize: 9, padding: '0 7px 1px', background: INK, color: '#fff' }}>{posTag(item.card.pos)}</span>
                      {escondido
                        ? <p className="font-black" style={{ ...OSWALD, fontSize: 17, lineHeight: 1.05, marginTop: 4, color: PURPLE }}>
                            🎁 <span aria-hidden style={{ filter: 'blur(4px)', letterSpacing: 3, userSelect: 'none' }}>? ? ?</span></p>
                        : <p className="font-black uppercase" style={{ ...OSWALD, fontSize: 15, lineHeight: 1.05, marginTop: 4 }}>{item.card.name}</p>}
                      <p className="font-bold" style={{ fontSize: 9, marginTop: 3, color: 'rgba(0,0,0,.55)' }}>{item.card.club} · {item.card.year}</p>
                    </div>
                  </div>
                )
              })()} />
          ) : (
          <div className="mt-4 space-y-1.5">
            {item.bids.length === 0 && (
              <p className="font-bold text-black/70">{item.card.id.startsWith('tec:') ? 'Nenhum lance. O técnico fica onde está. 🧢' : 'Nenhum lance. Vai pro Monte Final. 🪣'}</p>
            )}
            {/* MAIOR lance em CIMA (quem ganha no topo) — como sempre foi. O
                anti-spoiler que importa é só a cor: a linha do vencedor só fica
                VERDE quando o martelo bate (hammered), nunca antes do apito. */}
            {offerRows.map((b, i) => {
              const m = state.managers.find(x => x.id === b.mgr)!
              const voided = item.voided.includes(b.mgr)
              const isWinner = item.winner === b.mgr && hammered
              return (
                <motion.div key={b.mgr} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.25 }}
                  data-offer-manager={privateReveal ? b.mgr : undefined}
                  data-confirmed-winner={privateReveal && isWinner ? 'true' : undefined}
                  className="flex items-center justify-between border-2 border-black rounded-lg px-3 py-1.5"
                  style={{ backgroundColor: isWinner ? GREEN : voided ? '#ddd' : '#fff' }}>
                  <p className="font-bold text-sm" style={{ color: isWinner ? '#fff' : INK }}>
                    {avatarPreview && <span style={{display:'inline-block',verticalAlign:'middle',marginRight:6}}><Escudo nome={m.teamName} size={24}/></span>}
                    {m.id === you.id ? '🫵 Você' : m.teamName}{voided ? ' · anulado (setor cheio)' : ''}{privateReveal && isWinner ? ' · VENCEDOR' : ''}
                  </p>
                  <p className="font-black" style={{ ...OSWALD, color: isWinner ? '#fff' : INK }}>{privateReveal && isWinner ? item.paid : b.amount}</p>
                </motion.div>
              )
            })}
          </div>
          )}
          {/* 😱 QUASE!: facada revelada — perdeu por 1-2 moedas. Frase BEM variada,
              sorteada de forma determinística pela carta (a sala toda vê a mesma).
              Só drama no reveal que já existe (empate no topo vira desempate). */}
          {sold && !tie && (() => {
            const win = item.bids.find(b => b.mgr === item.winner)
            const losers = item.bids.filter(b => b.mgr !== item.winner && !item.voided.includes(b.mgr))
            if (!win || losers.length === 0) return null
            const best = Math.max(...losers.map(b => b.amount))
            const diff = win.amount - best
            if (diff < 1 || diff > 2) return null
            const names = losers.filter(b => b.amount === best).map(b => { const m = state.managers.find(x => x.id === b.mgr); return m ? (m.id === you.id ? 'Você' : (m.teamName || m.name)) : '' }).filter(Boolean)
            const who = names.slice(0, 2).join(' e '), card = item.card.name, n = diff === 1 ? '1 MOEDA' : '2 moedas'
            const frases = [
              `😱 QUASE! ${who} perde${names.length > 1 ? 'm' : ''} ${card} por ${n}!`,
              `🔪 FACADA! ${n} separou ${who} de ${card}!`,
              `💔 Por ${n}… ${card} escapou de ${who}!`,
              `😭 ${who} sonhou com ${card} — faltou ${n}!`,
              `🥶 Na tampa! ${who} viu ${card} ir embora por ${n}!`,
              `🫠 Doeu: ${n} a mais e ${card} tinha outro dono…`,
              `⚰️ Enterrado por ${n}! ${who} quase leva ${card}!`,
              `🎯 Errou por ${n}! ${card} passou raspando de ${who}!`,
              `🥊 No detalhe! ${n} tirou ${card} das mãos de ${who}!`,
              `😤 Faltou ${n} pra ${who} fechar com ${card}. Que ódio!`,
              `🎣 Escapou do anzol! ${card} livrou-se de ${who} por ${n}!`,
              `🧊 Gelou! ${who} perde${names.length > 1 ? 'm' : ''} ${card} por meros ${n}.`,
              `🚪 Bateu a porta na cara: ${card} foi embora por ${n} de ${who}!`,
              `🩹 Ai! ${n} de diferença e ${card} não é de ${who}…`,
              `📉 Deu ruim por ${n}! ${who} olha ${card} de longe.`,
              `🫥 Sumiu por ${n}: ${card} escorregou de ${who}!`,
              `🧨 Explodiu na mão! ${who} perde${names.length > 1 ? 'm' : ''} ${card} por ${n}!`,
              `🕳️ Caiu no buraco: ${n} e ${card} sumiu de ${who}!`,
              `🪤 Armadilha! ${card} escapou de ${who} por ${n}.`,
              `😵‍💫 ${who} nem acredita: ${n} tirou ${card} do colo!`,
              `🥀 Murchou por ${n}! ${card} não vestiu a camisa de ${who}.`,
              `🚑 Chama a ambulância! ${who} levou ${n} de facada por ${card}!`,
              `🧗 Faltou um degrau (${n}) pra ${who} pegar ${card}.`,
              `⛔ Barrado por ${n}! ${who} fica só na vontade de ${card}.`,
              `🧤 Escorregou das mãos: ${n} e ${card} era de ${who}…`,
              `🔒 Trancado por ${n}! ${card} não abriu pra ${who}.`,
              `🥲 Sorriso amarelo: ${who} viu ${card} ir por ${n}.`,
              `🧱 Bateu no muro! ${n} separou ${who} de ${card}.`,
              `🎬 Corta! ${who} perde ${card} no último frame por ${n}.`,
              `🐐 Por ${n}, ${card} preferiu outro elenco a ${who}.`,
              `🎢 Que montanha-russa: ${who} perde ${card} lá no alto por ${n}!`,
              `🫧 Estourou a bolha: ${card} escapou de ${who} por ${n}.`,
              `📮 Devolvido ao remetente: ${card} voltou por ${n} de ${who}!`,
              `🧊 Congelou no detalhe: ${n} e ${who} fica sem ${card}.`,
            ]
            return (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: hammerDelay + 0.4 }}
                className="mt-2 border-2 border-black rounded-lg px-3 py-1.5 text-center" style={{ backgroundColor: '#FFE1DC' }}>
                <p className="font-black text-[13px]" style={{ ...OSWALD, color: RED }}>{frases[(moneySeed(item.card.id) + state.revealIdx) % frases.length]}</p>
              </motion.div>
            )
          })()}
          {privateReveal && <div className={`ll-reveal-verdict ${hammered && sold ? 'is-sold' : ''}`} role="status">
            <span className={hammered && sold ? 'll-reveal-hammer strike' : 'll-reveal-hammer'} aria-hidden>🔨</span>
            <span>{hammered
              ? sold ? `Vendido ${winnerMgr?.id === you.id ? 'para você' : `para ${winnerMgr?.teamName}`} por ${item.paid}!` : 'Sem venda nesta revelação.'
              : tie ? 'Ofertas empatadas… confirmando desempate!' : 'Abrindo as ofertas… quem leva?'}</span>
          </div>}
          {tie && (!privateReveal || hammered) && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: item.bids.length * 0.25 + 0.15 }}
              className="mt-3 border-[3px] border-black rounded-xl p-2.5" style={{ backgroundColor: '#FFE9B0' }}>
              <p className="text-[11px] font-black uppercase text-center" style={{ color: RED }}>⚔️ Desempate · re-lance às cegas</p>
              <div className="mt-1.5 space-y-1">
                {tieRows.map(r => {
                  const isWin = r.id === tie.winner
                  return (
                    <div key={r.id} className="flex items-center justify-between border-2 border-black rounded-lg px-2.5 py-1"
                      style={{ backgroundColor: isWin ? GREEN : '#fff' }}>
                      <span className="text-xs font-black" style={{ color: isWin ? '#fff' : INK }}>{r.label}</span>
                      <span className="text-xs font-black" style={{ ...OSWALD, color: isWin ? '#fff' : INK }}>
                        {r.amt > tie.amount ? `cobriu ${r.amt}` : `manteve ${r.amt}`}
                      </span>
                    </div>
                  )
                })}
              </div>
              {tie.viaRoulette && (
                <div className="mt-2 text-center">
                  <p className="text-[11px] font-black uppercase" style={{ color: RED }}>🎡 Empataram em {tieMax} — a roleta decidiu!</p>
                  <TieSorteio names={rouletteNames} winnerId={tie.winner!} />
                </div>
              )}
            </motion.div>
          )}
          {winnerMgr && (!privateReveal || hammered) && (
            <motion.div className="mt-3 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: hammerDelay }}>
              {sold && !privateReveal && (
                <>
                  {/* ✨ RAIOS ATRÁS DO MARTELO (17/08): o martelo já caía do céu; os
                      raios só dão o estouro da batida. CSS puro, 0 KB, e nascem
                      JUNTO com a martelada — não adianta nem atrasa nada. */}
                  <div className="relative flex justify-center">
                    <motion.span aria-hidden className="absolute" style={{ width: 120, height: 120, top: -18, borderRadius: 999, pointerEvents: 'none',
                      background: 'repeating-conic-gradient(rgba(255,196,0,.55) 0 9deg, transparent 9deg 26deg)' }}
                      initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 1.15, 1], opacity: [0, 1, 0.55] }}
                      transition={{ delay: hammerDelay + 0.1, duration: 0.5 }} />
                    <motion.div className="text-5xl leading-none relative"
                      initial={{ y: -55, rotate: -75, opacity: 0 }}
                      animate={{ y: [-55, 6, 0], rotate: [-75, 8, 0], opacity: 1 }}
                      transition={{ delay: hammerDelay, duration: 0.5, type: 'spring', bounce: 0.55 }}>🔨</motion.div>
                  </div>
                  <motion.p className="font-black text-3xl -mt-1" style={{ ...OSWALD, color: RED }}
                    initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }} transition={{ delay: hammerDelay + 0.12, duration: 0.35 }}>
                    MARTELO!
                  </motion.p>
                </>
              )}
              {!privateReveal && <p className="font-black text-lg" style={OSWALD}>
                🔨 VENDIDO {winnerMgr.id === you.id ? 'PRA VOCÊ' : `pro ${winnerMgr.teamName}`} por {item.paid}!
              </p>}
              {/* 🕴️ AGÊNCIA 2.0: agenciado negociado → banner de comissão no tempo
                  morto do martelo (não adiciona passo). A moeda já entrou no motor. */}
              {sold && state.agenciaOn && agLibReveal && (state.agenciados ?? []).some(a => a.name === item.card.name) && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: hammerDelay + 0.5 }}
                  className="mt-2 border-[3px] border-black rounded-2xl px-3 py-2 text-left flex items-center gap-2"
                  style={{ background: 'linear-gradient(150deg,#FFE79A,#FFC400 60%,#E8A200)', boxShadow: `3px 3px 0 ${INK}` }}>
                  <span className="text-2xl">🕴️</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm uppercase leading-tight" style={OSWALD}>Comissão da agência!</p>
                    <p className="text-[11px] font-bold text-black/70 leading-tight"><b>{item.card.name}</b> é seu agenciado — a negociação te rendeu comissão 🤑</p>
                  </div>
                  <span className="font-black text-base px-2 py-1 rounded-lg shrink-0" style={{ ...OSWALD, background: INK, color: GOLD }}>+1 🪙</span>
                </motion.div>
              )}
            </motion.div>
          )}
        </Box>
        </motion.div>
      </motion.div>
      {/* auto-avanço: 1s por carta, 2s se houve lance; +tempo se teve desempate.
          ⏱️ FOLGA A MAIS (pedido do Diego 04/08): a carta 🎁 SURPRESA só revela o
          nome NO MARTELO — passava tão rápido que ninguém via QUEM era. E a
          ÚLTIMA revelação fecha a rodada (o resultado), então também merece um
          respiro. Só nesses dois casos; o resto do pregão segue no ritmo de sempre. */}
      <AutoAdvance hasBids={item.bids.length > 0} canDrive={canDrive} isLast={isLast}
        extraMs={(tie ? (tie.viaRoulette ? 3200 : 1500) : 0)
          + (item.card.id === state.surpriseId && sold ? 1600 : 0)
          + (isLast ? 1200 : 0)} />
      <p className="text-center text-xs font-bold text-black/60 py-1">
        {canDrive ? '🎬 Passando automaticamente…' : '🔨 O host está conduzindo a revelação…'}
      </p>
      {/* 🏟️ rótulo do campinho: sem ele o gramado aparecia solto e não ficava claro
          que aquele time é o SEU (outra ideia boa do GPT, 17/08). */}
      <p className="text-center font-black uppercase" style={{ ...OSWALD, fontSize: 10, letterSpacing: '.1em', color: 'rgba(0,0,0,.45)', marginBottom: 3 }}>Sua escalação</p>
      <YourPitch small />
    </Shell>
  )
}

function RivalsStrip() {
  const { state } = useEsc()
  const [blLang] = useLang()
  // 🌐 11/09: o idioma agora vale pro jogo INTEIRO (pedido do Diego), não só pro
  // basquete. Antes esta linha exigia `sport === 'basquete'` — ou seja, todas as
  // traduções que já existiam aqui ficavam guardadas e nunca apareciam no
  // futebol. Agora quem manda é só o botão BR/EN.
  const L = (pt: string, en: string) => (blLang === 'en' ? en : pt)
  const you = state.managers[state.youIdx]
  // só quem REALMENTE disputa o leilão, sem contar você mesmo: no solo são
  // os rivais CPU; online são os amigos humanos da sala (bots de
  // preenchimento já têm elenco pronto e nunca dão lance — não fazem
  // sentido aqui)
  const rivals = state.managers.filter(m => m.id !== you.id && m.auctionRival)
  if (rivals.length === 0) return null
  return (
    <div>
      <p className="text-xs font-black uppercase text-black/70 mb-1.5">{L('A sala', 'The room')}</p>
      <div className="grid grid-cols-2 gap-2">
        {rivals.map(m => (
          <Box key={m.id} className="p-2.5" shadow={3}>
            <p className="font-black text-sm truncate" style={OSWALD}>{m.teamName}</p>
            <p className="text-[11px] font-semibold text-black/55">{state.sport === 'basquete' ? '' : `${m.formation} · `}💰 {m.money} · {m.squad.length}/{m.squad.length + totalHoles(m)}</p>
            <p className="text-[10px] font-medium text-black/70" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {[...m.squad].sort((a, b) => SECTORS.indexOf(a.pos) - SECTORS.indexOf(b.pos)).map(c => c.name).join(', ') || L('ainda sem contratações', 'no signings yet')}
            </p>
          </Box>
        ))}
      </div>
    </div>
  )
}

// ─── MONTE FINAL ─────────────────────────────────────────────────────
export function EscMonte() {
  const { state, dispatch, emote } = useEsc()
  const you = state.managers[state.youIdx]
  const isYourTurn = state.monteOrder[state.monteIdx] === you.id && totalHoles(you) > 0
  // 🤝 DUPLA: dentro da vez do time, só quem ficou com a categoria MONTE decide
  const monteMinhaVez = duplaPodeAgir(state.duplas, you.id, 'MONTE', state.youUid)
  // esconde o que está reservado pro dono (prioridade); afford fica no botão
  const valid = state.monte.filter(c => openSlots(you, c.pos) > 0 && !monteLocked(state, you, c))
  const online = state.onlineMode === 'online'
  const curMgr = state.managers.find(m => m.id === state.monteOrder[state.monteIdx])

  // contagem regressiva (só online, quando há prazo)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!online || !state.monteDeadline) return
    const iv = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(iv)
  }, [online, state.monteDeadline])
  const remaining = online && state.monteDeadline ? Math.max(0, Math.ceil((state.monteDeadline - now) / 1000)) : null

  return (
    <Shell bar={<AuctionBar />}>
      {state.sport !== 'basquete' && <NarradorDica fase="monte" texto={tr('🃏 Sobrou jogador sem dono! Na sua vez, pega DE GRAÇA (ou paga o piso, se tiver 💰). É a hora de fechar o time sem gastar. Também pode passar a vez!', '🃏 Players left without an owner! On your turn, grab one FOR FREE (or pay the floor, if it has 💰). Time to complete the team without spending. You can also pass!')} />}
      <h2 className="font-black text-3xl pt-1" style={OSWALD}>{tr('🪣 MONTE FINAL', '🪣 FINAL PILE')}</h2>
      <p className="text-sm font-semibold text-black/70">
        {tr('As sobras do pregão. Quem tem mais buracos escolhe primeiro, em serpente. Seus buracos:', 'The auction leftovers. Whoever has more holes picks first, snake order. Your holes:')} <b>{totalHoles(you)}</b>.
      </p>
      {state.careerOnline && state.monte.some(c => ((c as { paid?: number }).paid ?? 0) > 0) && (
        <p className="text-xs font-semibold text-black/60">
          {getLang() === 'en' ? <>🆓 A leftover <b>with no value</b> is <b>free</b>. A player <b>with a floor</b> (💰) is a <b>buy without auction</b> — pay the fixed value. On players <b>you listed</b> you have <b>priority</b>: first chance to recover for free (already worth half). Let it pass, and the others take him — paying half. And <b>nobody is forced</b>: you can pass.</> : <>🆓 Sobra <b>sem valor</b> é de <b>graça</b>. Jogador <b>com piso</b> (💰) é <b>compra sem leilão</b> — paga o valor fixo. Nos jogadores que <b>você listou</b> você tem <b>preferência</b>: a primeira chance de recuperar de graça (já valendo a metade). Se deixar passar, aí os outros levam — pagando metade. E <b>ninguém é obrigado</b>: dá pra passar a vez.</>}
        </p>
      )}
      {online && (
        <p className="text-xs font-semibold text-black/60">
          ⏱️ {remaining ?? MONTE_SECONDS}s {tr('por vez', 'per turn')}. {state.careerOnline
            ? (getLang() === 'en' ? <>If time runs out, you <b>take nobody</b> and pass — no penalty (your team already has the 11).</> : <>Se estourar o tempo, você <b>não pega ninguém</b> e passa a vez — sem multa (seu time já tem os 11).</>)
            : (getLang() === 'en' ? <>Time ran out (bathroom break?), the game picks the worst leftover for you and passes the turn. <b>Costs no coins</b>: leftovers are free.</> : <>Estourou o tempo (foi ao banheiro?), o jogo escolhe a pior sobra pra você e passa a vez. <b>Não custa moeda</b>: as sobras são de graça.</>)}
        </p>
      )}
      {/* 🤝 DUPLA: o Monte é categoria própria — na vez do time, quem pega a sobra
          é só quem ficou com ele. O parceiro vê as mesmas cartas e assiste. */}
      {isYourTurn && !monteMinhaVez && (() => {
        const dp = state.duplas?.[you.id]
        const dono = dp && (dp.cats?.MONTE === dp.ownerUid ? dp.ownerName : dp.partnerName)
        const donoUid = dp?.cats?.MONTE
        // 🆘 mesma saída do leilão: se quem manda no Monte caiu de verdade (sumiu
        // da presença), quem ficou assume o time e a vez anda.
        const sumiu = !!donoUid && Array.isArray(state.presenceUids) && state.presenceUids.length > 0 && !state.presenceUids.includes(donoUid)
        return (
          <Box bg="#EDE4FF" className="p-3">
            <p className="font-black text-black" style={OSWALD}>{tr('🔒 O Monte é do', '🔒 The Pile belongs to')} {dono ? stripEmoji(dono).trim() : tr('seu parceiro', 'your partner')}</p>
            <p className="text-[12px] font-bold text-black/65 leading-snug mt-0.5">{tr('⏳ É a vez do seu time, mas quem escolhe a sobra é ele. Você acompanha daqui.', '⏳ It is your team\'s turn, but they pick the leftover. You watch from here.')}</p>
            {sumiu && (
              <button onClick={() => dispatch({ type: 'DUPLA_SOLO', mgrId: you.id, ficouUid: state.youUid ?? '' })}
                className="w-full border-[3px] border-black rounded-xl py-2.5 mt-2 font-black text-[13px] active:translate-y-0.5"
                style={{ background: GREEN, color: '#fff', boxShadow: `3px 3px 0 0 ${INK}`, ...OSWALD }}>
                🆘 {dono ? stripEmoji(dono).trim() : tr('Seu parceiro', 'Your partner')} {tr('caiu — assumir o time', 'dropped — take over the team')}
              </button>
            )}
          </Box>
        )
      })()}
      {isYourTurn && monteMinhaVez ? (
        <div className="space-y-2">
          <Box bg={remaining !== null && remaining <= 5 ? RED : GOLD} className="p-3">
            <p className="font-black text-center" style={{ ...OSWALD, color: remaining !== null && remaining <= 5 ? '#fff' : INK }}>
              {tr('SUA VEZ — escolha uma carta', 'YOUR TURN — pick a card')}{remaining !== null ? ` · ${remaining}s` : ''}
            </p>
          </Box>
          {valid.map(c => {
            const val = (c as { paid?: number }).paid ?? 0 // piso: carta com valor é compra sem leilão
            const own = (c as { seller?: number }).seller === you.id // sua carta listada: de graça
            const paidCard = state.careerOnline && val > 0 && !own
            const afford = !paidCard || you.money >= val
            return (
            <Box key={c.id} className="p-3 flex items-center justify-between">
              <CardFace c={c} />
              <div className="flex items-center gap-2 shrink-0">
                {own && val > 0 && (
                  <span className="text-right leading-tight" style={{ color: GREEN }}>
                    <span className="text-sm font-black" style={OSWALD}>{tr('🫵 seu', '🫵 yours')}</span>
                    <br /><span className="text-[8px] font-bold uppercase" style={{ color: 'rgba(0,0,0,0.5)' }}>{tr('recupere grátis · vale', 'recover for free · worth')} {val}</span>
                  </span>
                )}
                {paidCard && (
                  <span className="text-right leading-tight" style={{ color: afford ? '#B8860B' : RED }}>
                    <span className="text-sm font-black" style={OSWALD}>💰 {val}</span>
                    <br /><span className="text-[8px] font-bold uppercase" style={{ color: afford ? 'rgba(0,0,0,0.5)' : RED }}>{tr('pague sem leilão', 'buy without auction')}</span>
                  </span>
                )}
                <Btn onClick={() => afford && dispatch({ type: 'MONTE_PICK', mgrId: you.id, cardId: c.id, by: state.youUid })} bg={paidCard ? GOLD : GREEN} disabled={!afford}>
                  <span style={{ color: paidCard ? INK : '#fff' }}>{paidCard ? (afford ? `${tr('PAGAR', 'PAY')} ${val}` : tr('SEM CAIXA', 'NO CASH')) : tr('PEGAR', 'TAKE')}</span>
                </Btn>
              </div>
            </Box>
            )
          })}
          {state.careerOnline && (xiHoles(you) === 0 || valid.filter(c => {
            const val = (c as { paid?: number }).paid ?? 0
            const own = (c as { seller?: number }).seller === you.id
            return !(state.careerOnline && val > 0 && !own) || you.money >= val
          }).length === 0 ? (
            <>
              <button onClick={() => dispatch({ type: 'MONTE_PASS', mgrId: you.id, by: state.youUid })}
                className="w-full rounded-xl border-[3px] border-black bg-white font-black text-sm py-3 active:translate-y-0.5"
                style={{ color: '#B23B2E', boxShadow: `3px 3px 0 0 ${INK}`, ...OSWALD }}>
                {tr('🙅 PASSAR A VEZ — não quero nenhuma sobra', '🙅 PASS — I don\'t want any leftover')}
              </button>
              <p className="text-[10px] font-bold text-black/45 text-center">{tr('Seu time já tem os 11 — sobra é opcional, ninguém é obrigado a pagar.', 'Your team already has the 11 — leftovers are optional, nobody is forced to pay.')}</p>
            </>
          ) : (
            <p className="text-[11px] font-black text-center rounded-xl border-2 border-black py-2 px-3" style={{ background: '#FFE9B0', ...OSWALD }}>
              {tr('⚠️ Você tem BURACO no time titular — aqui não dá pra passar: pega alguém pra fechar os 11!', '⚠️ You have a HOLE in the starting XI — you can\'t pass here: grab someone to complete the 11!')}
            </p>
          ))}
        </div>
      ) : (
        <Box className="p-4">
          <p className="font-bold text-center text-black">
            {curMgr ? <>{tr('Vez de', 'Turn of')} <b>{curMgr.teamName}</b>{remaining !== null ? ` · ${remaining}s` : ''}…</> : tr('Aguardando a serpente chegar em você…', 'Waiting for the snake to reach you…')}
          </p>
        </Box>
      )}
      {/* 😈 ZOEIRA DO MONTE (online): cutuca quem está escolhendo a sobra. As frases
          miram o técnico da vez (curMgr) e aparecem flutuando pra todos, igual leilão. */}
      {online && curMgr && curMgr.id !== you.id && (() => {
        const n = curMgr.teamName || curMgr.name
        const jabs: { ic: string; label: string; mk: (x: string) => string }[] = [
          { ic: '👆', label: tr('Aperta o Pegar!', 'Press Take!'), mk: x => getLang() === 'en' ? `How hard is it to press Take, ${x}?` : `Qual a dificuldade de apertar o Pegar, ${x}?` },
          { ic: '🐢', label: tr('Anda!', 'Move!'), mk: x => getLang() === 'en' ? `Come on, ${x}, they're just leftovers!` : `Anda, ${x}, é só sobra!` },
          { ic: '😴', label: tr('Dormiu?', 'Asleep?'), mk: x => getLang() === 'en' ? `${x} fell asleep on their turn?` : `${x} dormiu na vez?` },
          { ic: '🗑️', label: tr('Perna-de-pau', 'Donkey'), mk: x => getLang() === 'en' ? `Only donkeys will be left for ${x}!` : `Só vai sobrar perna-de-pau pro ${x}!` },
          { ic: '🤡', label: tr('Sobra o Gol Contra', 'Own-goal guy is left'), mk: x => getLang() === 'en' ? `Adriano Own-Goal will be left for ${x} 😂` : `Vai sobrar o Adriano Gol Contra pro ${x} 😂` },
          { ic: '🤏', label: tr('Mão de vaca', 'Cheapskate'), mk: x => getLang() === 'en' ? `Next time stop being a cheapskate, ${x}!` : `Na próxima deixa de ser mão de vaca, ${x}!` },
        ]
        return (
          <div className="mt-1">
            <p className="text-[11px] font-black text-black/45 mb-1.5" style={OSWALD}>{tr('😈 CUTUCA QUEM TÁ ESCOLHENDO', '😈 POKE WHOEVER IS PICKING')}</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {jabs.map(j => (
                <button key={j.ic} onClick={() => emote(j.ic, undefined, j.mk(n))}
                  className="border-2 border-black rounded-full px-2.5 py-1 text-xs font-black bg-white text-black active:translate-y-0.5" style={{ ...OSWALD, boxShadow: `2px 2px 0 0 ${INK}` }}>
                  {j.ic} {j.label}
                </button>
              ))}
            </div>
          </div>
        )
      })()}
      <YourPitch />
      <FloatingEmotes />
    </Shell>
  )
}

// ─── CERIMÔNIA DA REVELAÇÃO ──────────────────────────────────────────
export function EscCerimonia() {
  const { state, dispatch } = useEsc()
  const t = useT()
  const agLibCer = useAgenciaLiberada() // 🔒 fatura da Agência 2.0: por enquanto só a conta do Diego
  // 🏛️ abre SEMPRE no SEU clube (o que acabou de leiloar) — antes abria no time
  // nº 0 da lista, que na carreira normal É você… mas no MULTICLUBES, comandando
  // o 2º clube, o nº 0 é o clube ORIGINAL (dormindo) — a cerimônia parecia "do
  // outro clube" (bug relatado). Navegar pelos outros times continua igual.
  const [idx, setIdx] = useState(() => {
    const list = state.managers.filter(m => !m.marketCpu)
    const p = list.findIndex(m => m.id === state.managers[state.youIdx]?.id)
    return p >= 0 ? p : 0
  })
  // esconde os participantes TEMPORÁRIOS do mercado (times de fundo) — eles só
  // brigaram no leilão, não entram na sua liga nem na revelação.
  const mgrs = state.managers.filter(m => !m.marketCpu)
  const m = mgrs[Math.min(idx, mgrs.length - 1)]
  const you = state.managers[state.youIdx]
  const isLastMgr = idx >= mgrs.length - 1
  const canStart = state.onlineMode !== 'online' || state.isHost

  // cronômetro de 45s (igual leilão): dá tempo de olhar os times e começa
  // o campeonato sozinho quando zerar (o vigia no provider dispara o FINISH).
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!state.cerimoniaDeadline) return
    const iv = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(iv)
  }, [state.cerimoniaDeadline])
  const secsLeft = state.cerimoniaDeadline ? Math.max(0, Math.ceil((state.cerimoniaDeadline - now) / 1000)) : null

  // 🏆 achados, micos e o resto do vexame agora moram no `PremiacaoResenha`

  return (
    <Shell>
      <div className="text-center pt-4">
        <h2 className="font-black text-3xl" style={OSWALD}>{t('🎭 CERIMÔNIA DA REVELAÇÃO', '🎭 REVEAL CEREMONY')}</h2>
        <p className="text-sm font-semibold text-black/60">{t('As faixas de nível abrem. Agora todo mundo descobre o que comprou.', 'The level ranges open. Now everyone finds out what they bought.')}</p>
      </div>
      {secsLeft !== null && (
        <div className="rounded-2xl border-[3px] border-black p-3 text-center" style={{ background: secsLeft <= 10 ? '#E8503A' : GREEN, boxShadow: `4px 4px 0 ${INK}` }}>
          <p className="font-black text-white text-sm leading-tight" style={OSWALD}>{t('⏱️ O campeonato começa em', '⏱️ The championship starts in')}</p>
          <p className="font-black text-white text-4xl leading-none mt-0.5" style={OSWALD}>{secsLeft}s</p>
          <p className="font-bold text-white/80 text-[11px] mt-1">{t('Aproveite pra ver os times de todo mundo 👀', 'Use the time to check out everyone\'s teams 👀')}</p>
        </div>
      )}
      <Box bg={m.id === you.id ? GOLD : '#fff'} className="p-4" shadow={6}>
        <p className="font-black text-xl" style={OSWALD}>{m.id === you.id ? `🫵 ${m.teamName}` : m.teamName}{state.sport === 'basquete' ? '' : <span className="text-sm font-bold text-black/70"> ({m.formation})</span>}</p>
        <div className="mt-2 space-y-1.5">
          {[...m.squad].sort((a, b) => SECTORS.indexOf(a.pos) - SECTORS.indexOf(b.pos)).map(c => {
            const tb = tierBadge(c)
            return (
            <div key={c.id} className="flex items-center justify-between border-2 border-black rounded-lg px-3 py-1.5 bg-white">
              <div>
                <p className="font-bold text-sm">{posTag(c.pos)} · {c.name} <span className="text-black/70 text-xs">({c.club} {c.year})</span></p>
                <p className="text-[10px] font-semibold text-black/70">
                  {c.via === 'bot' ? t('escalado direto', 'assigned directly') : c.via === 'monte' ? t('monte (grátis)', 'pile (free)') : c.via === 'repescagem' ? `${t('repescagem · pagou', 'leftovers · paid')} ${c.paid}` : `${t('leilão · pagou', 'auction · paid')} ${c.paid}`}
                </p>
              </div>
              <motion.span initial={{ rotateY: 90 }} animate={{ rotateY: 0 }} transition={{ delay: 0.15 }}
                className="border-2 border-black rounded-lg px-2 py-1 font-black text-sm"
                style={{ backgroundColor: tb.bg, color: tb.ink, ...OSWALD }}>
                {c.lo}–{c.hi}
              </motion.span>
            </div>
            )
          })}
        </div>
      </Box>
      {/* 🏆 a premiação entra no lugar das duas linhas soltas de antes — mesmo
          gatilho (só depois de passar por todos os elencos), tela cheia. */}
      {isLastMgr && <PremiacaoResenha mgrs={mgrs} resenha={state.resenha} />}
      {/* 🌱 CRIA DA BASE: a historinha de quem subiu do Sub-20 nesta virada
          (o técnico deixou um contrato vencido ir e o guri tapou o buraco).
          🔒 SÓ NA CARREIRA (`careerOnline`) — no rápido e no Minhas Ligas não
          existe contrato nem Sub-20, então a caixa não tem o que fazer ali.
          Isto é a REDE DE SEGURANÇA do conserto de 11/09: mesmo que um estado
          velho chegue aqui com `criaNews` cheio, a tela não mostra. */}
      {state.careerOnline && (state.criaNews ?? []).map((n, i) => (
        <div key={i} className="border-[3px] border-black rounded-2xl overflow-hidden" style={{ boxShadow: `4px 4px 0 ${INK}` }}>
          <div className="p-3" style={{ background: 'linear-gradient(150deg,#2E7D46,#1B5E33)', color: '#fff' }}>
            <p className="font-black text-[9px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,.65)' }}>{t('Direto da base', 'Straight from the academy')}</p>
            <p className="font-black text-sm uppercase" style={OSWALD}>🌱 {t('O menino', 'The kid')} {n.nome} {t('realizou um sonho!', 'made a dream come true!')}</p>
          </div>
          <div className="bg-white p-3">
            <p className="text-[12px] font-semibold leading-relaxed">{n.texto}</p>
            <div className="mt-2 border-2 border-dashed border-black/30 rounded-xl px-3 py-1.5 text-[11px] font-bold" style={{ background: '#F3EFE2' }}>
              🌱 {n.nome} · {n.pos} — {t('nível de base · sem contrato · sai de graça quando chegar reforço', 'academy level · no contract · leaves for free when a signing arrives')}
            </div>
          </div>
        </div>
      ))}
      {/* 🕴️ AGÊNCIA 2.0: fatura da temporada (mensalidades pagas na virada +
          comissões de artilheiro/campeão + negociações do leilão que acabou).
          Tudo JÁ caiu no caixa do 1º clube — aqui é o resumo pós-apito. */}
      {state.agenciaOn && agLibCer && state.agenciaFatura && (state.agenciaFatura.total > 0 || state.agenciaFatura.rows.length > 0) && (
        <div className="border-[3px] border-black rounded-2xl p-4" style={{ background: `linear-gradient(160deg, ${GREEN}, #14401f)`, boxShadow: `4px 4px 0 ${INK}`, color: '#fff' }}>
          <p className="font-black text-sm uppercase" style={OSWALD}>{t('🕴️ Sua agência faturou', '🕴️ Your agency earned')}</p>
          {state.agenciaFatura.mensal > 0 && (
            <div className="flex items-center gap-2 text-[12px] font-bold py-1">
              💰 <span className="flex-1">{t('Mensalidades dos', 'Monthly fees of the')} {state.agenciados?.length ?? 0} {t('na ativa', 'active')}</span>
              <span className="font-black" style={{ ...OSWALD, color: '#FFE79A' }}>+{state.agenciaFatura.mensal} 🪙</span>
            </div>
          )}
          {state.agenciaFatura.rows.map((r, i) => (
            <div key={i} className="flex items-center gap-2 text-[12px] font-bold py-1" style={{ borderTop: '1px solid rgba(255,255,255,.16)' }}>
              {r.emoji} <span className="flex-1 min-w-0">{r.texto}</span>
              <span className="font-black shrink-0" style={{ ...OSWALD, color: '#FFE79A' }}>+{r.coins} 🪙</span>
            </div>
          ))}
          <div className="mt-2 border-2 border-black rounded-xl px-3 py-1.5 flex items-center justify-between font-black text-[12px]" style={{ background: GOLD, color: INK }}>
            <span>{t('Total no caixa do 1º clube', 'Total in the 1st club\'s till')}</span>
            <span className="text-base" style={OSWALD}>+{state.agenciaFatura.total} 🪙</span>
          </div>
        </div>
      )}
      {state.careerOnline && (state.marketLog?.length ?? 0) > 0 && (
        <Box bg="#EEF7FF" className="p-4 space-y-1">
          <p className="font-black text-sm" style={OSWALD}>{t('🏟️ OUTROS TIMES NO LEILÃO', '🏟️ OTHER TEAMS AT THE AUCTION')}</p>
          <p className="text-[11px] font-semibold text-black/55 !mb-1.5">{getLang() === 'en' ? <>Every season some pyramid teams enter the auction (drawn). They only bid when the position is <b>uncontested</b> — no manager, or just one, made an offer.</> : <>A cada temporada alguns times da pirâmide entram no leilão (sorteados). Eles só dão lance quando a posição está <b>sem disputa</b> — nenhum ou só um técnico ofertou.</>}</p>
          {state.marketLog!.slice(0, 14).map((l, i) => <p key={i} className="text-xs font-bold text-black/75">{l}</p>)}
          {state.marketLog!.length > 14 && <p className="text-[10px] font-semibold text-black/50">…{t('e mais', 'and')} {state.marketLog!.length - 14}{getLang() === 'en' ? ' more' : ''}</p>}
        </Box>
      )}
      {/* navegação livre pelos times durante os 45s (dá a volta) */}
      <div className="flex gap-2">
        <div className="flex-1"><Btn className="w-full" bg="#fff"
          onClick={() => setIdx((idx - 1 + mgrs.length) % mgrs.length)}>◀ {t('Anterior', 'Previous')}</Btn></div>
        <div className="shrink-0 flex items-center px-2 font-black text-sm text-black/50" style={OSWALD}>{idx + 1}/{mgrs.length}</div>
        <div className="flex-1"><Btn className="w-full" bg={GOLD}
          onClick={() => setIdx((idx + 1) % mgrs.length)}>{t('Próximo', 'Next')} ▶</Btn></div>
      </div>
      {/* 🏀 basquete: a temporada (por pontos) ainda não entrou — em vez de cair
          na temporada de FUTEBOL, mostra um aviso honesto e volta pra home. */}
      {state.sport === 'basquete' ? (
        <div className="border-[3px] border-black rounded-2xl p-4 text-center space-y-2" style={{ background: '#fff', boxShadow: `4px 4px 0 0 ${INK}` }}>
          <div className="text-3xl">🏆</div>
          <p className="font-black text-lg uppercase" style={OSWALD}>{t('Quinteto fechado!', 'Your five is set!')}</p>
          <p className="text-[13px] font-semibold text-black/60 leading-snug">
            {t('Você montou seu time no pregão. A temporada do basquete (jogos por pontos, tabela e playoffs) entra na próxima atualização. 🔧', 'You built your team in the auction. The basketball season (games by points, standings and playoffs) arrives in the next update. 🔧')}
          </p>
          <Btn className="w-full" bg={GREEN} onClick={() => dispatch({ type: 'GO_LOBBY' })}>
            <span style={{ color: '#fff' }}>🏠 {t('Voltar ao início', 'Back to home')}</span>
          </Btn>
        </div>
      ) : canStart ? (
        <Btn className="w-full text-lg" bg={GREEN} onClick={() => dispatch({ type: 'FINISH_CEREMONY' })}>
          <span style={{ color: '#fff' }}>{(state.streamMode || state.manualRoom) ? t('▶️ COMEÇAR O CAMPEONATO 🏆', '▶️ START THE CHAMPIONSHIP 🏆') : t('COMEÇAR AGORA 🏆', 'START NOW 🏆')}</span>
        </Btn>
      ) : (
        <p className="text-center text-sm font-bold text-black/55 py-1">{t('🔨 O campeonato começa quando', '🔨 The championship starts when')} {(state.streamMode || state.manualRoom) ? t('o host começar', 'the host starts it') : t('o tempo acabar', 'time runs out')}…</p>
      )}
    </Shell>
  )
}

// ─── TEMPORADA (autoplay: 38 rodadas em ~3 min, relógio correndo) ─────
const TACTIC_LABEL: Record<Tactic, string> = { retranca: '🧱 Retranca', equilibrio: '⚖️ Equilíbrio', ataque: '🔥 Ataque' }
const TACTIC_LABEL_EN: Record<Tactic, string> = { retranca: '🧱 Park the bus', equilibrio: '⚖️ Balanced', ataque: '🔥 Attack' }
// 🏀 mesma pedra-papel-tesoura, nomes de basquete (defesa/equilíbrio/run-and-gun).
const TACTIC_LABEL_NBA: Record<Tactic, { pt: string; en: string }> = {
  retranca: { pt: '🛡️ Defesa', en: '🛡️ Defense' },
  equilibrio: { pt: '⚖️ Equilíbrio', en: '⚖️ Balanced' },
  ataque: { pt: '🏃 Run-and-gun', en: '🏃 Run & gun' },
}
// rótulo da tática conforme o esporte + idioma (futebol = igual a hoje).
function tacticLabel(t: Tactic, bb: boolean, lang: 'pt' | 'en'): string {
  return bb ? TACTIC_LABEL_NBA[t][lang] : lang === 'en' ? TACTIC_LABEL_EN[t] : TACTIC_LABEL[t]
}
export const SEASON_TOTAL_MS = 180_000
const ROUND_MS = Math.round(SEASON_TOTAL_MS / 38) // ~4,7s por rodada
// 🏆 Copa dos 8 (rápido): cada JOGO roda +6s mais devagar que a Copa da carreira,
// pra dar pra acompanhar o placar subindo (Diego achou muito rápido). Só o rápido.
const QUICK_COPA_LEG_MS = COPA_LEG_MS + 6000
// tempo de LEITURA da telinha "Chegou a Copa" antes da 1ª partida (modo automático)
const COPA_INTRO_SECONDS = 10

// ── RITMO da simulação (só modos SOLO): auto (padrão) ou manual — no manual
// a temporada PARA depois de cada rodada e você avança no botão. A escolha
// fica salva no aparelho e pode trocar a qualquer momento.
export function useSimMode(): [boolean, () => void] {
  const [manual, setManual] = useState(() => { try { return localStorage.getItem('esc-sim-manual') === '1' } catch { return false } })
  const toggle = () => setManual(m => { const v = !m; try { localStorage.setItem('esc-sim-manual', v ? '1' : '0') } catch { /* ignora */ } return v })
  return [manual, toggle]
}
// 🎥 RITMO no modo STREAM (host online): igual ao solo, mas COMEÇA no MANUAL — o
// streamer controla a passagem das rodadas/jogos na live. Preferência com chave
// própria (não mistura com a do modo normal); default = manual.
export function useStreamSimMode(): [boolean, () => void] {
  const [manual, setManual] = useState(() => { try { return localStorage.getItem('esc-stream-auto') !== '1' } catch { return true } })
  const toggle = () => setManual(m => { const v = !m; try { localStorage.setItem('esc-stream-auto', v ? '0' : '1') } catch { /* ignora */ } return v })
  return [manual, toggle]
}
// 🔒 cadeado do Modo Manual no jogo rápido offline: quem não apoia vê isto no
// lugar do toggle Auto/Manual — leva pra tela de Apoie (igual à carreira).
export function QuickManualLock() {
  return (
    <div style={{ marginBottom: 10 }}>
      <ApoieButton startScreen="manual" trigger={open => (
        <button onClick={open} style={{ width: '100%', border: `2.5px solid ${INK}`, borderRadius: 12, padding: '10px 12px', fontWeight: 900, fontSize: 12, background: '#fff', color: INK, boxShadow: `2px 2px 0 0 ${INK}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: 'Oswald, sans-serif' }}>
          <span>{tr('Acelerar e pular', 'Speed up and skip')}</span>
          <span style={{ fontSize: 10, fontWeight: 800, background: GREEN, color: '#fff', borderRadius: 999, padding: '2px 8px' }}>{tr('🔒 Desbloquear', '🔒 Unlock')}</span>
        </button>
      )} />
    </div>
  )
}
export function SimControls({ manual, onToggle, onNext, onSkip, canNext, nextLabel, lock }: { manual: boolean; onToggle: () => void; onNext: () => void; onSkip?: () => void; canNext: boolean; nextLabel?: string; lock?: React.ReactNode }) {
  const previewAccount = useOnlinePreview()
  const { state, dispatch } = useEsc()
  const t = useT() // 🌐 BR/EN
  const label = nextLabel ?? t('▶️ Próxima rodada', '▶️ Next round')
  // 🔒 sem apoio no modo rápido offline: o toggle vira cadeado (leva pro Apoie)
  if (lock) return <>{lock}</>
  if ((previewAccount || publicOnlineVisual(state) || publicCareerVisual(state)) && state.sport !== 'basquete') return <>
    <OnlineRhythm manual={manual} onToggle={onToggle} speed={state.simSpeed ?? 1} onSpeed={speed => dispatch({ type: 'SET_SIM_SPEED', speed })} />
    {manual && <div className="ll25-actions">
      <button className="ll25-button" onClick={onNext} disabled={!canNext}>{label}</button>
      {onSkip && <button className="ll25-button" onClick={onSkip}>{t('PULAR', 'SKIP')}</button>}
    </div>}
  </>
  // 🎮 MANUAL com PULAR: "Próxima rodada" GRANDE à esquerda (espera a partida
  // acabar, como sempre); à direita, "⏭️ Pular" em cima (vai direto pro resultado,
  // sem esperar) e "🔁 Modo auto" embaixo. Fino e sutil. Só aparece no manual.
  if (manual && onSkip) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1.12fr 1fr', gridTemplateRows: 'auto auto', gap: 7, marginBottom: 10 }}>
        <button onClick={onNext} disabled={!canNext} style={{ gridRow: '1 / 3', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', border: `2.5px solid ${INK}`, borderRadius: 11, padding: 10, fontWeight: 900, fontSize: 15.5, lineHeight: 1.1, fontFamily: 'Oswald, sans-serif', background: canNext ? GREEN : '#cfc6ae', color: canNext ? '#fff' : 'rgba(0,0,0,.45)', boxShadow: `2px 2px 0 0 ${INK}`, cursor: canNext ? 'pointer' : 'default' }}>
          {label}
        </button>
        <button onClick={onSkip} style={{ gridColumn: 2, gridRow: 1, border: `1.5px solid ${INK}`, borderRadius: 10, padding: 8, fontWeight: 800, fontSize: 12.5, fontFamily: 'Oswald, sans-serif', background: '#2F6BAE', color: '#fff', boxShadow: `1.5px 1.5px 0 0 ${INK}`, cursor: 'pointer' }}>
          {t('⏭️ Pular', '⏭️ Skip')}
        </button>
        <button onClick={onToggle} style={{ gridColumn: 2, gridRow: 2, border: `1.5px solid ${INK}`, borderRadius: 10, padding: 8, fontWeight: 800, fontSize: 11.5, fontFamily: 'Oswald, sans-serif', background: '#fff', color: '#5a5647', boxShadow: `1.5px 1.5px 0 0 ${INK}`, cursor: 'pointer' }}>
          {t('🔁 Modo auto', '🔁 Auto mode')}
        </button>
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'stretch', marginBottom: 10 }}>
      {manual && (
        <button onClick={onNext} disabled={!canNext} style={{ flex: 1, border: `3px solid ${INK}`, borderRadius: 12, padding: '11px 10px', fontWeight: 900, fontSize: 15, fontFamily: 'Oswald, sans-serif', background: canNext ? GREEN : '#cfc6ae', color: canNext ? '#fff' : 'rgba(0,0,0,.45)', boxShadow: `3px 3px 0 0 ${INK}`, cursor: canNext ? 'pointer' : 'default' }}>
          {label}
        </button>
      )}
      <button onClick={onToggle} style={{ flex: manual ? 'none' : 1, border: `2.5px solid ${INK}`, borderRadius: 12, padding: manual ? '8px 12px' : '9px 10px', fontWeight: 900, fontSize: manual ? 11 : 12, fontFamily: 'Oswald, sans-serif', background: '#fff', color: INK, boxShadow: `2px 2px 0 0 ${INK}`, cursor: 'pointer' }}>
        {manual ? t('🔁 voltar pro AUTO', '🔁 back to AUTO') : t('⏸️ MANUAL: pausar entre as rodadas', '⏸️ MANUAL: pause between rounds')}
      </button>
    </div>
  )
}
// ⏩ VELOCIDADE da simulação: 5 marchas — normal no meio, 2×/4× mais devagar (🐢)
// pra saborear o jogo, 2×/4× mais rápido (⚡) pra adiantar. Só aparece quando o
// PASSO é seu (manual/stream ou solo). Multiplicador vai pro estado (sincroniza),
// então o relógio da partida bate igual pra sala inteira.
export const SPEED_OPTS: { v: number; label: string }[] = [
  { v: 0.25, label: '🐢 4×' },
  { v: 0.5, label: '🐢 2×' },
  { v: 1, label: 'Normal' },
  { v: 2, label: '⚡ 2×' },
  { v: 4, label: '⚡ 4×' },
]
export function SpeedControls({ speed, onSet }: { speed: number; onSet: (v: number) => void }) {
  const previewAccount = useOnlinePreview()
  const { state } = useEsc()
  const t = useT() // 🌐 BR/EN
  if ((previewAccount || publicOnlineVisual(state) || publicCareerVisual(state)) && state.sport !== 'basquete') return null
  const cur = speed > 0 ? speed : 1
  return (
    <div style={{ marginBottom: 10 }}>
      <p style={{ fontFamily: 'Oswald, sans-serif', fontWeight: 900, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(0,0,0,.5)', margin: '0 0 5px 2px' }}>{t('⏩ Velocidade da partida', '⏩ Match speed')}</p>
      <div style={{ display: 'flex', gap: 5 }}>
        {SPEED_OPTS.map(o => {
          const on = cur === o.v
          const bg = !on ? '#fff' : o.v === 1 ? GOLD : o.v < 1 ? '#5C8FD6' : GREEN
          const fg = !on ? INK : o.v === 1 ? INK : '#fff'
          return (
            <button key={o.v} onClick={() => onSet(o.v)} style={{ flex: 1, minWidth: 0, border: `2.5px solid ${INK}`, borderRadius: 10, padding: '8px 2px', fontWeight: 900, fontSize: 12, fontFamily: 'Oswald, sans-serif', background: bg, color: fg, boxShadow: on ? `2px 2px 0 0 ${INK}` : 'none', cursor: 'pointer', lineHeight: 1.05, whiteSpace: 'nowrap' }}>
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function EscSeason() {
  const { state, dispatch } = useEsc()
  const previewAccount = useOnlinePreview()
  const privateVisual = (previewAccount || publicOnlineVisual(state)) && state.sport !== 'basquete'
  const [visualTab, setVisualTab] = useState<OnlineMatchTab>('jogos')
  const leagueStartedAt = useRoundPresentationStart(state.round)
  const [seasonLang] = useLang()
  const bbS = state.sport === 'basquete' // 🏀 no basquete a "Copa dos 8" vira "Playoffs"
  // 🌎 sala de LIBERTADORES: o mata-mata roda no mesmo motor da Copa dos 8, mas
  // com outra cara (azul-noite), outro nome e uma fase a mais (oitavas).
  const libS = state.copaMode === 'liga_liberta'
  const copaHolo = libS ? NOITE_HOLO : PURPLE_HOLO
  // 🌐 BR/EN (11/09): valia só pro basquete; agora a temporada do futebol também lê o idioma
  const LS = (pt: string, en: string) => seasonLang === 'en' ? en : pt
  const enS = seasonLang === 'en'
  const you = state.managers[state.youIdx]
  const online = state.onlineMode === 'online'
  // 🎽 mantos da SALA (pedido do Diego 10/08): os campinhos dos OUTROS também
  // vestem o manto do dono (sócio/batismo). O servidor devolve SÓ assento →
  // cores (esc_mantos_sala) — e-mail nunca viaja. Falhou? Fica sem manto.
  const [mantosSala, setMantosSala] = useState<Record<number, [string, string]>>({})
  useEffect(() => {
    if (!online || !state.roomId) { setMantosSala({}); return }
    let alive = true
    supabase.rpc('esc_mantos_sala', { p_room: state.roomId }).then(({ data }) => {
      if (!alive || !Array.isArray(data)) return
      const m: Record<number, [string, string]> = {}
      for (const r of data as { player_index: number; manto_c1: string; manto_c2: string }[]) m[r.player_index] = [r.manto_c1, r.manto_c2]
      setMantosSala(m)
    }, () => {})
    return () => { alive = false }
  }, [online, state.roomId])
  const canAdvance = !online || state.isHost
  // ritmo manual: nos modos solo (rápido offline, carreira, dinastia) E quando o
  // HOST controla o passo online — sala em STREAM ou sala criada no modo MANUAL.
  // Nos dois o host ganha o botão manual/auto (começa no manual).
  const streamHost = online && state.isHost && (state.streamMode || !!state.manualRoom)
  const [manualPref, toggleSim] = useSimMode()
  const [streamManual, toggleStream] = useStreamSimMode()
  // 🔒 no rápido OFFLINE o Modo Manual agora é apoiado (pago pra todos, sem
  // grandfather). Online host-paced (stream/sala manual) segue livre.
  const hasManual = useHasManual()
  const manual = streamHost ? streamManual : (manualPref && !online && hasManual)
  const manualLocked = !online && !hasManual // rápido offline sem apoio: mostra o cadeado
  // ⏩ AUTO é SEMPRE o ritmo padrão: ao voltar pro auto, zera a velocidade (Normal).
  // Assim a marcha escolhida vale só dentro do manual, e o manual sempre COMEÇA no
  // Normal (o do meio) — igual ao auto. (Sincroniza via estado, então bate pra sala.)
  const rawToggle = streamHost ? toggleStream : toggleSim
  const toggleManual = () => {
    const goingManual = !manual
    rawToggle()
    if (!goingManual && (state.simSpeed ?? 1) !== 1) dispatch({ type: 'SET_SIM_SPEED', speed: 1 })
  }
  // ⏩ velocidade escolhida (sincroniza via estado): divide o tempo da rodada —
  // 4× rápido = ¼ do tempo; 2× devagar = o dobro. Default 1 (normal). Todo mundo
  // na sala lê o mesmo state.simSpeed, então os relógios continuam batendo juntos.
  // O Normal do manual é IGUAL ao do auto (ROUND_MS) — quem quiser mais devagar usa
  // a marcha 🐢. (Antes o manual tinha uma folga fixa que o deixava mais lento.)
  const speedFactor = state.simSpeed && state.simSpeed > 0 ? state.simSpeed : 1
  // 🏀 basquete tem 82 rodadas (não 38): acelera cada rodada pra a temporada
  // caber no MESMO tempo total (~3 min), senão levaria mais que o dobro. Futebol
  // segue com o ROUND_MS de sempre (38 rodadas) — nada muda lá.
  const baseRoundMs = state.sport === 'basquete' ? Math.round(SEASON_TOTAL_MS / (state.fixtures.length || 82)) : ROUND_MS
  const roundMs = Math.round(baseRoundMs / speedFactor)
  const streamRoom = online && (state.streamMode || !!state.manualRoom) // sala com ritmo do host: Copa/etapas sem cronômetro pra ninguém
  const myTactic = state.tactics[you.id] ?? 'equilibrio'
  const table = sortedTable(state.league)
  // 🏆 total de rodadas real: 20 times = 38 (como sempre); Liga Fechada = calendário
  // do tamanho da galera. Fallback 38 enquanto as fixtures não existem.
  const totalRounds = state.fixtures.length || 38
  const fixture = state.round < totalRounds ? state.fixtures[state.round].find(([h, a]) => h === you.id || a === you.id) : undefined
  const opp = fixture ? state.league.find(t => t.id === (fixture[0] === you.id ? fixture[1] : fixture[0])) : undefined
  // confronto direto: clássico quando o adversário é um humano da sala OU um
  // rival fixo da sua carreira (que está na sua divisão nesta temporada).
  const careerRivalOf = (teamName?: string) => teamName && state.careerDivision ? state.careerRivals.find(rv => rv.team === teamName) : undefined
  const toWLD = (rv?: { h2h: [number, number, number] }) => rv ? { w: rv.h2h[0], l: rv.h2h[2], d: rv.h2h[1] } : null
  const oppCareerRiv = careerRivalOf(opp?.name)
  const isClassico = (!!opp && state.managers.some(m => m.id === opp.id && m.isHuman)) || !!oppCareerRiv
  const rivalry = isClassico && opp ? (oppCareerRiv ? toWLD(oppCareerRiv) : rivalryOf(state.rivalries, you.id, opp.id)) : null
  const myLast = state.lastResults.find(r => r.homeId === you.id || r.awayId === you.id)
  // clássico recém-jogado: mostra o resultado com peso de rivalidade
  const lastOppId = myLast ? (myLast.homeId === you.id ? myLast.awayId : myLast.homeId) : undefined
  const lastOppName = lastOppId != null ? state.league.find(t => t.id === lastOppId)?.name : ''
  const lastCareerRiv = careerRivalOf(lastOppName)
  const lastWasClassico = (lastOppId != null && state.managers.some(m => m.id === lastOppId && m.isHuman)) || !!lastCareerRiv
  const lastRiv = lastWasClassico ? (lastCareerRiv ? toWLD(lastCareerRiv) : rivalryOf(state.rivalries, you.id, lastOppId!)) : null
  const myGoals = myLast ? (myLast.homeId === you.id ? myLast.hg : myLast.ag) : 0
  const oppGoals = myLast ? (myLast.homeId === you.id ? myLast.ag : myLast.hg) : 0

  // só revela o resultado do clássico DEPOIS que o card do jogo terminou de
  // animar os 90' — senão a faixa entregava o placar antes da simulação.
  // 🏁 temporada JÁ ENCERRADA (campeão coroado / Copa dos 8 semeada): não segura
  // nada — a última rodada já animou. Sem isto, re-entrar na tela (ex.: apertar
  // "Iniciar a Copa") re-armava o segurador e a tabela ficava ~8s SEM a última
  // rodada, contradizendo a Copa (parecia que "o 10º se classificou").
  const seasonSettled = state.round >= totalRounds && (state.quickCopa != null || state.champion != null)
  const [resultRevealed, setResultRevealed] = useState(seasonSettled)
  const [showPyramid, setShowPyramid] = useState(false)
  useEffect(() => {
    if (seasonSettled) { setResultRevealed(true); return }
    setResultRevealed(false)
    const t = setTimeout(() => setResultRevealed(true), roundMs * 0.85 + 250)
    return () => clearTimeout(t)
  }, [state.round, seasonSettled])
  // 🏟️ torcida ao fundo enquanto a temporada roda (para ao sair da tela)
  useEffect(() => { startCrowd(); return () => stopCrowd() }, [])
  // 📣 apito no início de cada jogo (kickoff) — só quando há partida rolando
  useEffect(() => { if (state.round > 0 && state.round <= totalRounds) playWhistle() }, [state.round])

  // manchete PESSOAL (por quem vê): detecta quando VOCÊ muda de faixa na
  // tabela. Feito no cliente pra ficar certo pra cada um no online.
  // 🙈 ANTI-SPOILER: usa a posição EXIBIDA (a tabela segura o resultado até o
  // jogo terminar de animar), NÃO a posição crua. Assim a manchete só muda quando
  // o placar é revelado na tela — sem depender de um flag de tempo que, no ONLINE,
  // podia estar "atrasado" e disparar o aviso antes da partida animar (o spoiler
  // relatado: "você entrou no G4" antes do jogo rolar).
  const youPosShown = (() => {
    const disp = !resultRevealed && state.lastResults.length > 0 ? sortedTable(leagueBeforeResults(state.league, state.lastResults)) : table
    return disp.findIndex(t => t.id === you.id) + 1
  })()
  const prevPosRef = useRef(youPosShown)
  const [personalNews, setPersonalNews] = useState<string | null>(null)
  const personalTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    const prev = prevPosRef.current
    prevPosRef.current = youPosShown
    if (state.round === 0 || youPosShown === 0 || prev === youPosShown) return
    // só MOMENTOS marcantes (cruzou uma faixa). Sem número de posição — ele fica
    // velho na hora, porque a temporada roda rápido. E some sozinho em 5s pra não
    // ficar contradizendo a tabela embaixo.
    // 🏆 faixas PROPORCIONAIS ao tamanho da liga: o G4/Z4 do Brasileirão é 4 de 20
    // (20%). Numa liga de 20 dá 4 (igual sempre); numa de 8 dá ~2; numa de 4/5 dá 1.
    // Nada de "G4" num campeonato de 4 times.
    const zTop = zoneN(table.length)      // faixa de cima (G4 proporcional)
    const zBot = zoneBot(table.length)    // 1ª posição da zona de baixo (Z4 proporcional)
    let msg: string | null = null
    if (youPosShown === 1 && prev !== 1) msg = LS('👑 Você é o novo LÍDER do campeonato!', '👑 You are the new league LEADER!')
    else if (youPosShown <= zTop && prev > zTop) msg = LS(`📈 Você ENTROU no G${zTop}!`, `📈 You are IN the top ${zTop}!`)
    else if (youPosShown >= zBot && prev < zBot) msg = LS(`⚠️ PERIGO! Você caiu pra zona de rebaixamento (Z${zTop})!`, `⚠️ DANGER! You dropped into the relegation zone (bottom ${zTop})!`)
    else if (youPosShown < zBot && prev >= zBot) msg = LS(`😮‍💨 Você escapou do Z${zTop}!`, `😮‍💨 You escaped the bottom ${zTop}!`)
    if (msg) {
      setPersonalNews(msg)
      if (personalTimer.current) clearTimeout(personalTimer.current)
      personalTimer.current = setTimeout(() => setPersonalNews(null), 5000)
    }
  }, [youPosShown, state.round])
  useEffect(() => () => { if (personalTimer.current) clearTimeout(personalTimer.current) }, [])

  // autoplay: só quem "puxa" a temporada dispara a próxima rodada (host no
  // online, o próprio cliente no CPU). Os demais só recebem o resultado
  // sincronizado e tocam a animação do próprio jogo localmente.
  useEffect(() => {
    if (!canAdvance || state.round >= totalRounds || state.dinastiaPaused || manual) return // Dinastia: para na janela do meio; manual: avança no botão
    const t = setTimeout(() => dispatch({ type: 'PLAY_ROUND' }), roundMs)
    return () => clearTimeout(t)
  }, [state.round, canAdvance, dispatch, state.dinastiaPaused, manual, roundMs])
  // 🏁 ÚLTIMA RODADA: quando a 38ª é jogada, o jogo fica na tela ANIMANDO (a tela não
  // pula pro 'end' sozinha). Quando a animação acaba, aí sim vai pro campeão/Copa —
  // antes o PLAY_ROUND pulava direto e a última partida não aparecia rolando.
  useEffect(() => {
    if (!canAdvance || state.round < totalRounds || state.screen !== 'season' || state.champion != null || state.quickCopa) return
    const t = setTimeout(() => dispatch({ type: 'FINISH_SEASON' }), roundMs)
    return () => clearTimeout(t)
  }, [canAdvance, state.round, state.screen, state.champion, state.quickCopa, roundMs, dispatch])

  // 🏆 Copa dos 8: a liga acabou (round 38) e a sala escolheu Liga + Copa —
  // toca fase a fase (quartas → semis → final), mesmo ritmo/motor da Copa da
  // carreira (COPA_LEG_MS). `s.screen` só vira 'end' quando a final termina.
  const qc = state.quickCopa
  const copaLive = state.round >= totalRounds && !!qc && qc.phase !== 'done'
  const copaTieKey = qc ? `${qc.phase}:${qc.legIdx}:${qc.ties.map(t => t.legs.length).join(',')}` : ''
  // primeira partida da Copa (quartas, ainda ninguém jogou nada): dá um tempo
  // de LEITURA (30s) pra explicar o formato antes de começar a rolar bola — as
  // demais trocas de fase seguem no ritmo normal, sem essa pausa extra.
  // 1ª partida do mata-mata = nenhuma fase fechada ainda (bracket vazio). Antes
  // isto testava `phase === 'quartas'`, o que deixava a Libertadores (que começa
  // nas OITAVAS) entrar sem o tempo de leitura do chaveamento.
  const firstLegPending = copaLive && qc!.bracket.length === 0 && qc!.legIdx === 0 && qc!.ties.every(t => t.legs.length === 0)
  const [copaFirstLeft, setCopaFirstLeft] = useState(COPA_INTRO_SECONDS)
  const copaFirstFiredRef = useRef(false)
  useEffect(() => {
    // stream: sem cronômetro pra ninguém — o host começa no botão.
    if (!firstLegPending || manual || streamRoom) return
    copaFirstFiredRef.current = false
    setCopaFirstLeft(COPA_INTRO_SECONDS)
    const t0 = Date.now()
    const iv = setInterval(() => {
      const left = Math.max(0, COPA_INTRO_SECONDS - Math.floor((Date.now() - t0) / 1000))
      setCopaFirstLeft(left)
      // o cronômetro aparece pra todo mundo (visual), mas só quem conduz (host no
      // online, ou o próprio cliente no solo) DISPARA a partida — evita corrida.
      if (left <= 0 && !copaFirstFiredRef.current && canAdvance) { copaFirstFiredRef.current = true; dispatch({ type: 'PLAY_COPA_LEG' }) }
    }, 250)
    return () => clearInterval(iv)
  }, [firstLegPending, canAdvance, manual, dispatch, streamRoom])
  // fase acabou de VIRAR (chaveamento novo, nenhuma perna jogada ainda): dá um
  // respiro CURTO só pra ver quem avançou, e então bate bola. Uma perna normal
  // (ida/volta) espera o tempo cheio do jogo pra animar o placar todo.
  const copaJustAdvanced = copaLive && !firstLegPending && !!qc && qc.ties.every(t => t.legs.length === 0)
  // ⚠️ se a perna que acabou de rolar foi a ÚLTIMA da fase (ida+volta feitas, ou a
  // final) E algum confronto empatou → PÊNALTIS. A disputa anima uns ~12s DEPOIS do
  // relógio zerar, então precisa esperar mais antes de avançar/coroar — senão corta
  // no meio (a final acabava "com 3 chutes"). Vale pra QUALQUER jogo, auto ou manual.
  const phaseFullyPlayed = !!qc && (qc.ties[0]?.legs.length ?? 0) >= (qc.phase === 'final' ? 1 : 2)
  const anyPens = !!qc?.ties.some(t => t.pens)
  // ⏩ a Copa segue a MESMA marcha de velocidade da liga (state.simSpeed, sincronizado)
  // ⚠️ MAS SÓ O JOGO ACELERA — OS PÊNALTIS NÃO (04/09). A disputa é animação de CSS
  // com tempo FIXO (~12s, `pensRevealDelay`): a marcha não muda a velocidade dela.
  // Dividir esse pedaço pelo `speedFactor` fazia a tela voltar a CORTAR a disputa em
  // 2× e 4× (em 2× esperava 6,5s por uma disputa de até 11,5s) — o mesmo defeito que
  // o jogador relatou na Copa da carreira. Então o tempo do jogo divide, o dos
  // pênaltis é somado depois, inteiro.
  const copaAnimMs = Math.round(QUICK_COPA_LEG_MS / speedFactor) + (phaseFullyPlayed && anyPens ? 13000 : 0)
  useEffect(() => {
    if (!canAdvance || !copaLive || manual || firstLegPending) return
    const t = setTimeout(() => dispatch({ type: 'PLAY_COPA_LEG' }), copaJustAdvanced ? Math.round(3200 / speedFactor) : copaAnimMs)
    return () => clearTimeout(t)
  }, [copaTieKey, copaLive, canAdvance, manual, dispatch, firstLegPending, copaJustAdvanced, copaAnimMs, speedFactor])
  // trava o "Próximo jogo da Copa" (manual) enquanto a perna — INCLUINDO a disputa
  // de pênaltis — ainda está animando, pra não cortar clicando cedo.
  const [copaAdvReady, setCopaAdvReady] = useState(true)
  useEffect(() => {
    if (!copaLive || firstLegPending || copaJustAdvanced) { setCopaAdvReady(true); return }
    setCopaAdvReady(false)
    const t = setTimeout(() => setCopaAdvReady(true), copaAnimMs)
    return () => clearTimeout(t)
  }, [copaTieKey, copaLive, firstLegPending, copaJustAdvanced, copaAnimMs])
  // relógio compartilhado dos placares dos jogos da fase (lista de baixo): sobe
  // 0→93 no mesmo tempo do card grande (COPA_LEG_MS) e reinicia a cada nova perna
  // — assim TODOS os jogos progridem juntos, minuto a minuto, em vez de já mostrar
  // o resultado pronto. Reinicia por copaTieKey (muda quando entra uma perna nova).
  const [copaMin, setCopaMin] = useState(93)
  // 🚫 ANTI-SPOILER DO GIRO: as manchetes descrevem a rodada que AINDA está
  // animando na tela — mostrar na hora entrega zebra/líder/placar antes do apito
  // (a tabela é segurada com holdResults, mas o giro não era). Segura o giro do
  // MESMO jeito: só troca pro texto novo quando o resultado revela (liga) ou a
  // perna fecha (Copa, relógio 93'). Enquanto anima, mostra o giro ANTERIOR.
  // ⚠️ pênaltis: a disputa anima ~12s DEPOIS do relógio bater 93' — o giro tem
  // que esperar a MESMA trava do botão (copaAdvReady, que inclui os pênaltis),
  // senão a manchete entrega o vencedor no meio das cobranças (bug do Diego 28/07).
  const giroReady = copaLive ? (copaMin >= 93 && copaAdvReady) : (resultRevealed || state.lastResults.length === 0)
  const giroRef = useRef<string[] | null>(null)
  if (giroReady) giroRef.current = state.news
  const giroNews = giroRef.current ?? []
  // 🚫 ANTI-SPOILER: quando entra uma perna/fase nova (copaTieKey muda), o relógio
  // ainda está no 93' da anterior por 1 frame — o que piscaria o placar FINAL (com o
  // vencedor riscado) do jogo novo antes do apito. Zera JÁ na renderização.
  const copaKeyRef = useRef(copaTieKey)
  if (copaKeyRef.current !== copaTieKey) { copaKeyRef.current = copaTieKey; setCopaMin(copaLive && !firstLegPending ? 0 : 93) }
  useEffect(() => {
    if (!copaLive || firstLegPending) { setCopaMin(93); return }
    setCopaMin(0)
    // relógio por TEMPO (igual ao card grande): cada velocidade é de fato diferente
    // e termina exato no fim do jogo. Piso de 400ms pra nunca ficar instantâneo.
    const dur = Math.max(400, (QUICK_COPA_LEG_MS / speedFactor) * 0.82)
    const t0 = Date.now()
    const iv = setInterval(() => {
      const m = Math.min(93, Math.round(((Date.now() - t0) / dur) * 93))
      setCopaMin(m)
      if (m >= 93) clearInterval(iv)
    }, 40)
    return () => clearInterval(iv)
  }, [copaTieKey, copaLive, firstLegPending, speedFactor])

  return (
    <Shell bar={
      <div className="flex items-center justify-between max-w-xl mx-auto gap-2">
        <span className="font-black text-sm" style={OSWALD}>
          {state.careerDivision && <span className="mr-1.5 px-1.5 py-0.5 rounded bg-purple-700 text-white text-[11px]">🪜 {DIVISION_LABEL[state.careerDivision].toUpperCase()}</span>}
          {state.careerOnline && !state.careerDivision && <span className="mr-1.5 px-1.5 py-0.5 rounded bg-purple-700 text-white text-[11px]">🪜 {LS('CARREIRA', 'CAREER')}{escadaLiberada() ? ' · VÁRZEA' : ' · SÉRIE D'}</span>}
          {state.careerTitlesA > 0 && <span className="mr-1.5"><CareerStars n={state.careerTitlesA} size={12} /></span>}
          {copaLive && qc ? `${libS ? '🌎 LIBERTA' : `🏆 ${bbS ? LS('PLAYOFFS', 'PLAYOFFS') : LS('COPA', 'CUP')}`} · ${qc.phase === 'oitavas' ? LS('OITAVAS', 'R16') : qc.phase === 'quartas' ? (bbS ? LS('SEMIS DE CONF.', 'CONF. SEMIS') : LS('QUARTAS', 'QUARTERS')) : qc.phase === 'semis' ? (bbS ? LS('FINAIS DE CONF.', 'CONF. FINALS') : 'SEMI') : (bbS ? LS('FINAIS', 'FINALS') : 'FINAL')}` : `${LS('RODADA', 'ROUND')} ${Math.min(privateVisual ? Math.max(1, state.round) : state.round + 1, totalRounds)}/${totalRounds}`}
        </span>
        <span className="font-black text-sm" style={OSWALD}>{(() => {
          if (privateVisual && copaLive && qc) return qc.phase === 'final' ? LS('JOGO ÚNICO', 'ONE-OFF') : qc.legIdx === 0 ? LS('IDA', '1ST LEG') : LS('VOLTA', '2ND LEG')
          const disp = !resultRevealed && state.lastResults.length > 0 ? sortedTable(leagueBeforeResults(state.league, state.lastResults)) : table
          const pos = disp.findIndex(t => t.id === you.id) + 1
          return `${ordinal(pos, seasonLang)} · ${disp[pos - 1]?.pts ?? 0} pts`
        })()}</span>
      </div>
    }>
      {copaLive && qc ? (() => {
        const phaseLabel = qc.phase === 'oitavas' ? LS('Oitavas de Final', 'Round of 16') : qc.phase === 'quartas' ? LS('Quartas de Final', 'Quarter-finals') : qc.phase === 'semis' ? LS('Semifinal', 'Semi-final') : 'Final'
        const legLabel = qc.phase === 'final' ? LS('Jogo único · campo neutro', 'One-off · neutral ground') : qc.legIdx === 0 ? LS('Jogo de ida', 'First leg') : LS('Jogo de volta', 'Second leg')
        const myTie = qc.ties.find(t => t.aId === you.id || t.bId === you.id)
        const youColor = myApoioPerk()?.solid ?? APOIO_PERKS.bege.solid
        // 🌎 na Libertadores metade da chave é de clube do continente, que NÃO está
        // na liga — sem este fallback o card do jogo mostrava "?" no lugar do nome.
        const nameOf = (id: number) => (state.league.find(t => t.id === id) ?? state.liberta?.times.find(t => t.id === id))?.name ?? '?'
        const scorer = (text: string) => { const mm = text.match(/⚽\s+(.+?)\s+marca para/) || text.match(/🏀\s+(.+?)\s+anota para/); return mm ? mm[1] : text.replace(/^[⚽🏀]\s*/, '').replace(/\.$/, '') }
        // 🔥 marca os AMIGOS (humanos da sala, no online) — pra saber quem é rival de
        // verdade e quem é CPU. "(você)" pra você; 🔥 pros outros humanos.
        const nameTag = (id: number) => id === you.id ? LS(' (você)', ' (you)') : state.managers.some(m => m.id === id && m.isHuman) ? ' 🔥' : ''
        // minutos "sintéticos" pros gols dos jogos de CPU (que não guardam highlights):
        // espalha `count` gols entre 6' e 88', determinístico (mesma semente = mesma
        // ordem) — só pro placar subir bonitinho, sem inventar resultado.
        const synthMins = (count: number, seed: number): number[] => {
          const mins: number[] = []
          for (let i = 0; i < count; i++) mins.push(6 + ((Math.abs(seed) * 17 + i * 53 + 29) % 82))
          return mins.sort((a, b) => a - b)
        }
        const tieRow = (tie: QuickCopaTie) => {
          const mine = tie.aId === you.id || tie.bId === you.id
          const nLegs = tie.legs.length
          const fullAggA = tie.legs.reduce((s2, l) => s2 + l[0], 0)
          const fullAggB = tie.legs.reduce((s2, l) => s2 + l[1], 0)
          const clockDone = copaMin >= 93
          // placar AO VIVO: pernas já fechadas + a perna atual progredindo no relógio.
          let showA = fullAggA, showB = fullAggB
          let minsA: number[] = [], minsB: number[] = []
          if (!clockDone && nLegs > 0) {
            const doneA = tie.legs.slice(0, nLegs - 1).reduce((s2, l) => s2 + l[0], 0)
            const doneB = tie.legs.slice(0, nLegs - 1).reduce((s2, l) => s2 + l[1], 0)
            const [curA, curB] = tie.legs[nLegs - 1]
            // meu jogo tem highlights reais (fica igual ao card grande); CPU usa sintético
            // ⚠️ SÓ LANCE DE GOL (bug do Diego 25/08: *"apareceu do nada 8x0 e
            // depois tava 4"*). Era AQUI: enquanto o relógio corria, a linha contava
            // TODO lance (gol + assistência) e o placar inflava; no apito final ele
            // trocava pelo agregado de verdade (`fullAggA/B`) e "voltava" pra 4.
            const gols = (privateVisual ? tie.lastPresentationGoals ?? tie.lastHighlights ?? [] : tie.lastHighlights ?? []).filter(lanceEhGol)
            const useHl = gols.length > 0
            minsA = useHl ? gols.filter(h => h.teamId === tie.aId).map(h => h.min).sort((a, b) => a - b) : synthMins(curA, tie.aId * 31 + tie.bId + nLegs)
            minsB = useHl ? gols.filter(h => h.teamId === tie.bId).map(h => h.min).sort((a, b) => a - b) : synthMins(curB, tie.aId * 31 + tie.bId + nLegs + 7)
            showA = doneA + minsA.filter(m => m <= copaMin).length
            showB = doneB + minsB.filter(m => m <= copaMin).length
          }
          const settled = clockDone && tie.winner != null // só risca/mostra pênaltis depois que o relógio fecha
          const aWin = tie.winner === tie.aId
          // 🚫 anti-spoiler: com PÊNALTIS, o riscado do perdedor espera a última cobrança animar
          const pd = settled && tie.pens ? pensRevealDelay(tie.pens) : 0
          const loserStyle = (isLoser: boolean) => !settled || !isLoser ? {} : pd > 0 ? { animation: `qcLoserFade .4s ease ${pd.toFixed(2)}s forwards` } : { opacity: .6, textDecoration: 'line-through' as const }
          const minLabel = copaMin >= 93 ? '' : copaMin > 90 ? `90+${copaMin - 90}'` : `${copaMin}'`
          const live = !clockDone && nLegs > 0
          const kindOf = (id: number): 'you' | 'human' | 'bot' => id === you.id ? 'you' : state.managers.some(m => m.id === id && m.isHuman) ? 'human' : 'bot'
          const fA = copaFill(kindOf(tie.aId), tie.aName), fB = copaFill(kindOf(tie.bId), tie.bName)
          // ⚡ "acabou de fazer gol": olha só pra minuto JÁ revelado no placar (<=
          // copaMin) — nunca antecipa nada, é só destaque visual de algo que o
          // placar já mostrou. Janela de 1' (mesmo passo do relógio da Copa).
          const lastGoalMin = live ? Math.max(-1, ...minsA.filter(m => m <= copaMin), ...minsB.filter(m => m <= copaMin)) : -1
          const justScored = live && lastGoalMin >= 0 && copaMin - lastGoalMin <= 1
          const barPct = Math.max(0, Math.min(100, Math.round((copaMin / 90) * 100)))
          if (privateVisual) {
            const reverse = nLegs > 1
            const prevA = tie.legs.slice(0, -1).reduce((s, l) => s + l[0], 0)
            const prevB = tie.legs.slice(0, -1).reduce((s, l) => s + l[1], 0)
            const owner = (id: number) => state.managers.find(m => m.id === id && m.isHuman)?.name ?? 'BOT'
            const h = reverse ? tie.bName : tie.aName, a = reverse ? tie.aName : tie.bName
            return <CompetitionMatch key={`${tie.aId}-${tie.bId}`} goals={(tie.lastPresentationGoals??tie.lastHighlights??[]).filter(lanceEhGol).filter(g=>clockDone||g.min<=copaMin).map(g=>({name:g.text,min:g.min,home:g.teamId===(reverse?tie.bId:tie.aId)}))} home={h} away={a} homeCrest={<Escudo nome={h} size={28} />} awayCrest={<Escudo nome={a} size={28} />} homeOwner={owner(reverse ? tie.bId : tie.aId)} awayOwner={owner(reverse ? tie.aId : tie.bId)} mine={mine}
              homeScore={nLegs ? reverse ? showB-prevB : showA-prevA : '–'} awayScore={nLegs ? reverse ? showA-prevA : showB-prevB : '–'}
              status={`${qc.phase==='final'?'FINAL':reverse?LS('VOLTA', '2ND LEG'):LS('IDA', '1ST LEG')} · ${live ? `${minLabel} ${LS('AO VIVO', 'LIVE')}` : nLegs ? LS('ENCERRADO', 'FULL TIME') : LS('A DISPUTAR', 'TO BE PLAYED')}`}
              detail={<>{reverse && <p>{LS('Ida', '1st leg')}: {tie.aName} {prevA} × {prevB} {tie.bName}<br /><b>{LS('Agregado', 'Aggregate')}: {tie.aName} {showA} × {showB} {tie.bName}</b></p>}{settled && <>{tie.pens && <PensShootout compactOnline final={qc.phase==='final'} aCrest={<Escudo nome={tie.aName} size={20}/>} bCrest={<Escudo nome={tie.bName} size={20}/>} pens={tie.pens} aName={tie.aName} bName={tie.bName} />}{!tie.pens&&<p style={pd ? {opacity:0,animation:`cmWinPop .3s ease ${pd}s forwards`} : undefined}><b>{aWin ? tie.aName : tie.bName} {qc.phase==='final'?LS('é campeão', 'is champion'):LS('avançou', 'advanced')}</b></p>}</>}</>} />
          }
          return (
            <Box key={`${tie.aId}-${tie.bId}`} className={privateVisual ? 'll26-cup-match' : undefined} bg={privateVisual ? CREAM : 'transparent'} style={{ position: 'relative', overflow: 'hidden', borderColor: justScored ? GOLD : mine ? '#B23B2E' : live ? '#8B5CF6' : undefined }} shadow={4}>
              {privateVisual && <div className="ll26-match-label">{mine ? LS('SEU CONFRONTO', 'YOUR TIE') : LS('CONFRONTO DA FASE', 'TIE OF THE ROUND')}<span>{live ? `${minLabel} · ${LS('AO VIVO', 'LIVE')}` : nLegs ? LS('ENCERRADO', 'FULL TIME') : LS('A DISPUTAR', 'TO BE PLAYED')}</span></div>}
              {/* 🎨 identidade da Copa dos 8 (Diego 11/08, brilho 14/08): moldura roxa
                  só enquanto o jogo tá AO VIVO (decidido volta pro preto, senão briga
                  com o "avança"); barra de progresso no TOPO, agora com o degradê. */}
              {live && (
                <div style={{ height: 4, background: 'rgba(0,0,0,.15)' }}>
                  <div style={{ height: '100%', width: `${barPct}%`, background: PURPLE_HOLO }} />
                </div>
              )}
              {/* 🎨 faixa branca no meio com o placar, escudo em cima e nome embaixo
                  (mais espaço pra ler o nome) — cor cheia só nas laterais. */}
              <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'stretch', overflow: 'hidden' }}>
                <div style={{ position: 'relative', overflow: 'hidden', background: fA.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, minWidth: 0, padding: '9px 6px' }}>
                  {fA.holo > 0 && <ApoioSheen holo={fA.holo} />}
                  <span style={{ ...loserStyle(!aWin) }}><Escudo nome={tie.aName} size={22} /></span>
                  <span className="font-black text-[10.5px] truncate text-center" style={{ ...OSWALD, color: fA.ink, maxWidth: '100%', ...loserStyle(!aWin) }}>{tie.aName}{nameTag(tie.aId)}</span>
                </div>
                <div style={{ background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4px 11px', gap: 1 }}>
                  {live && <span className="text-[9px] font-black" style={{ color: '#C2452F' }}>●{minLabel}</span>}
                  <span className="font-black text-lg" style={{ ...OSWALD, color: INK, whiteSpace: 'nowrap' }}>{privateVisual ? showA - tie.legs.slice(0,-1).reduce((s,l)=>s+l[0],0) : showA} × {privateVisual ? showB - tie.legs.slice(0,-1).reduce((s,l)=>s+l[1],0) : showB}</span>
                  {privateVisual && <small style={{fontSize:9,fontWeight:800,color:INK}}>{qc.phase==='final'?'FINAL':nLegs>1?LS('VOLTA', '2ND LEG'):LS('IDA', '1ST LEG')}</small>}
                </div>
                <div style={{ position: 'relative', overflow: 'hidden', background: fB.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, minWidth: 0, padding: '9px 6px' }}>
                  {fB.holo > 0 && <ApoioSheen holo={fB.holo} />}
                  <span style={{ ...loserStyle(aWin) }}><Escudo nome={tie.bName} size={22} /></span>
                  <span className="font-black text-[10.5px] truncate text-center" style={{ ...OSWALD, color: fB.ink, maxWidth: '100%', ...loserStyle(aWin) }}>{tie.bName}{nameTag(tie.bId)}</span>
                </div>
                {justScored && (
                  <>
                    <style>{'@keyframes qcGoalFlash{0%{opacity:1}100%{opacity:0}}'}</style>
                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, rgba(255,255,255,.5), transparent 70%)', animation: 'qcGoalFlash 1.1s ease', pointerEvents: 'none' }} />
                  </>
                )}
              </div>
              <div style={{ padding: '6px 10px 9px' }}>
                {privateVisual && nLegs>1 && <p className="text-center text-xs font-bold text-black">{LS('AGREGADO', 'AGGREGATE')}: {showA} × {showB} · {LS('Ida', '1st leg')}: {tie.legs[0][0]} × {tie.legs[0][1]}</p>}
                {privateVisual && settled && <p className="text-center text-xs font-bold" style={{color:GREEN,...(pd>0?{opacity:0,animation:`cmWinPop .2s ease ${pd}s forwards`}:{})}}>{tie.winner===tie.aId?tie.aName:tie.bName} {qc.phase==='final'?LS('é campeão', 'is champion'):LS('avança', 'advances')}</p>}
                {justScored && <p className="text-center mt-1"><span style={{ ...copaCenterChip, fontSize: 9, fontWeight: 900, color: '#FFD778' }}>{LS('⚽ GOOOL agora!', '⚽ GOAL just now!')}</span></p>}
                {settled && nLegs > 0 && (
                  <p className="text-center mt-1" style={{ fontSize: 10, fontWeight: 800 }}><span style={copaCenterChip}>{nLegs === 1 ? `${LS('ida', '1st leg')} ${tie.legs[0][0]}×${tie.legs[0][1]}` : `${LS('ida', '1st leg')} ${tie.legs[0][0]}×${tie.legs[0][1]} · ${LS('volta', '2nd leg')} ${tie.legs[1][0]}×${tie.legs[1][1]}`}</span></p>
                )}
                {settled && tie.pens && <><style>{'@keyframes qcLoserFade{to{opacity:.6;text-decoration:line-through}}'}</style><PensShootout pens={tie.pens} aName={tie.aName} bName={tie.bName} /></>}
              </div>
            </Box>
          )
        }
        return (
          <>
            {/* 🎨 identidade da Copa dos 8 (Diego 11/08, brilho 14/08): roxo, nome original mantido */}
            {privateVisual ? <CompetitionStage kind={libS ? 'liberta' : 'copa8'} title={libS ? 'LIBERTADORES' : LS('COPA DOS 8', 'CUP OF 8')} phase={phaseLabel} detail={enS ? `${legLabel} · ${qc.ties.length} ${qc.ties.length === 1 ? 'tie' : 'ties'} in this round` : `${legLabel} · ${qc.ties.length} confronto${qc.ties.length === 1 ? '' : 's'} na fase`} status={firstLegPending ? (!manual && !streamRoom ? LS(`Começa em ${copaFirstLeft}s`, `Starts in ${copaFirstLeft}s`) : canAdvance ? LS('Tudo pronto. Inicie nos controles da partida.', 'All set. Start from the match controls.') : LS('Aguardando o host iniciar', 'Waiting for the host to start')) : copaMin < 93 ? LS('Bola rolando · acompanhe os confrontos abaixo', 'Ball rolling · follow the ties below') : LS('Resultados da fase', 'Round results')}>
              {firstLegPending && <details className="ll26-format"><summary>{LS('COMO FUNCIONA A COPA', 'HOW THE CUP WORKS')}</summary><p>{libS ? LS('Os dois primeiros de cada grupo avançam às oitavas. Oitavas, quartas e semifinais em ida e volta; final em jogo único.', 'The top two of each group reach the round of 16. Round of 16, quarters and semis over two legs; single-match final.') : LS('Os oito primeiros da liga se enfrentam: 1º × 8º, 2º × 7º, 3º × 6º e 4º × 5º. Quartas e semifinais em ida e volta; final em jogo único.', 'The league\'s top eight face off: 1st × 8th, 2nd × 7th, 3rd × 6th and 4th × 5th. Quarters and semis over two legs; single-match final.')} {LS('O campeão ganha uma carta para o álbum.', 'The champion earns a card for the album.')}</p></details>}
            </CompetitionStage> : <Box bg={copaHolo} className="p-3 text-center" shadow={4} style={{ position: 'relative', overflow: 'hidden' }}>
              <ApoioSheen holo={1} dur={3.2} />
              <p className="font-black text-sm relative" style={{ ...OSWALD, color: '#fff', zIndex: 2 }}>{libS ? '🌎 LIBERTADORES' : `🏆 ${bbS ? LS('PLAYOFFS', 'PLAYOFFS') : LS('COPA DOS 8', 'CUP OF 8')}`} · {phaseLabel.toUpperCase()}</p>
              <p className="font-black text-[11px] relative" style={{ color: 'rgba(255,255,255,.8)', zIndex: 2 }}>{legLabel}</p>
            </Box>}
            {firstLegPending && !privateVisual && (
              <Box bg={copaHolo} className="p-4 space-y-2" shadow={6} style={{ position: 'relative', overflow: 'hidden' }}>
                <ApoioSheen holo={1} dur={3.4} />
                <div className="relative space-y-2" style={{ zIndex: 2 }}>
                  <p className="font-black text-base text-center" style={{ ...OSWALD, color: GOLD }}>{libS ? LS('🌎 Chegaram as OITAVAS!', '🌎 The ROUND OF 16 is here!') : `🏆 ${bbS ? LS('Chegaram os Playoffs!', 'Playoffs are here!') : LS('Chegou a Copa dos 8!', 'The Cup of 8 is here!')}`}</p>
                  <p className="text-sm font-bold text-center" style={{ color: 'rgba(255,255,255,.85)' }}>
                    {libS
                      ? (enS
                        ? <><b style={{ color: GOLD }}>16 clubs</b> remain — the top 2 of each group. From here on it's two legs, and the loser <b>goes home</b>. The final is a <b>single match</b>. Whoever lifts the cup earns <b style={{ color: GOLD }}>another card</b> for the album!</>
                        : <>Sobraram <b style={{ color: GOLD }}>16 clubes</b> — os 2 primeiros de cada grupo. Daqui pra frente é ida e volta, e quem perder <b>vai pra casa</b>. A final é <b>jogo único</b>. Quem levantar a taça ganha <b style={{ color: GOLD }}>outra carta</b> pro álbum!</>)
                      : bbS
                      ? (seasonLang === 'en'
                        ? <>The top 8 face off in the bracket: 1×8, 2×7, 3×6, 4×5. Winners reach the semis — the final is one game. The champion takes the <b style={{ color: GOLD }}>ring</b> to the album! 🏀</>
                        : <>Os 8 melhores da temporada se enfrentam no mata-mata: 1º×8º, 2º×7º, 3º×6º, 4º×5º. Quem passa vai à semi — e a decisão é jogo único. O campeão leva o <b style={{ color: GOLD }}>anel</b> pro álbum! 🏀</>)
                      : enS
                      ? <>The league's top 8 face off over two legs: 1st×8th, 2nd×7th, 3rd×6th, 4th×5th. Winners reach the semi-final — and the final is a single match. The Cup champion earns <b style={{ color: GOLD }}>another card</b> for the album, on top of the league card!</>
                      : <>Os 8 melhores da liga se enfrentam ida e volta: 1º×8º, 2º×7º, 3º×6º, 4º×5º. Quem passar cai na semifinal — e a final é jogo único. O campeão da Copa ganha <b style={{ color: GOLD }}>outra carta</b> pro álbum, além da carta da liga!</>}
                  </p>
                  {!manual && !streamRoom && (
                    <p className="text-center font-black text-sm" style={{ ...OSWALD, color: '#fff' }}>{LS(`⚽ A primeira partida começa em ${copaFirstLeft}s`, `⚽ The first match starts in ${copaFirstLeft}s`)}</p>
                  )}
                  {streamRoom && !canAdvance && (
                    <p className="text-center font-black text-sm" style={{ ...OSWALD, color: '#fff' }}>{enS ? `⏳ The host starts ${libS ? 'the round of 16' : 'the Cup'} when ready…` : `⏳ O host começa ${libS ? 'as oitavas' : 'a Copa'} quando quiser…`}</p>
                  )}
                </div>
              </Box>
            )}
            {privateVisual && <OnlineMatchTabs value={visualTab} onChange={setVisualTab} />}
            {myTie ? (
              myTie.legs.length > 0 ? (() => {
                // SEMPRE anima a última perna jogada (ida OU volta) — antes, quando
                // a volta decidia a vaga, o card já pulava pro agregado e a volta
                // não aparecia. Agora ida e volta rolam as duas, cada uma no seu tempo.
                const lastLegIdx = myTie.legs.length - 1
                const legHomeId = lastLegIdx === 0 ? myTie.aId : myTie.bId
                const legAwayId = lastLegIdx === 0 ? myTie.bId : myTie.aId
                const homeIsYou = legHomeId === you.id
                const oppId = homeIsYou ? legAwayId : legHomeId
                const oppIsHuman = state.managers.some(m => m.id === oppId && m.isHuman)
                // 🎨 mesmo padrão da liga: amigo = cor do tier DELE (gratuito = bege)
                const oppColor = oppIsHuman ? (perkFromSelo(state.managers.find(m => m.id === oppId)?.teamName ?? '')?.solid ?? APOIO_PERKS.bege.solid) : '#3A7CA5'
                const hl = myTie.lastHighlights ?? []
                const goals = hl.filter(lanceEhGol).map(h => ({ name: scorer(h.text), min: h.min, home: h.teamId === legHomeId }))
                return (
                  <>
                    <LiveScoreCard enhancedOnline={privateVisual} key={`copa-${qc.phase}-${myTie.legs.length}`}
                      homeName={nameOf(legHomeId)} awayName={nameOf(legAwayId)}
                      homeColor={homeIsYou ? youColor : oppColor} awayColor={homeIsYou ? oppColor : youColor}
                      youIsHome={homeIsYou} goals={goals}
                      roundKey={myTie.legs.length + (qc.phase === 'oitavas' ? 30 : qc.phase === 'quartas' ? 0 : qc.phase === 'semis' ? 10 : 20)}
                      roundMs={QUICK_COPA_LEG_MS} classico={oppIsHuman}
                      footTint={libS ? { bg: '#E8EEFB', border: '#b9c9ef', holo: 0.5 } : { bg: '#F3EAFE', border: '#d9c3f5', holo: 0.5 }} />
                    {myTie.legs.length === 2 && (
                      <p className="text-center text-[11px] font-black text-black/55 -mt-1" style={privateVisual ? {color:CREAM} : undefined}>↩️ Ida: {nameOf(myTie.aId)} {myTie.legs[0][0]} × {myTie.legs[0][1]} {nameOf(myTie.bId)}</p>
                    )}
                  </>
                )
              })() : (
                <Box bg="#fff" className="p-6" shadow={6}>
                  <p className="text-center font-black" style={OSWALD}>{state.sport === 'basquete' ? (getLang() === 'en' ? '🏀 Waiting for the Cup jump ball…' : '🏀 Aguardando a bola ao alto da Copa…') : libS ? LS('🌎 Aguardando o pontapé inicial da Libertadores…', '🌎 Waiting for the Libertadores kick-off…') : LS('🏁 Aguardando o pontapé inicial da Copa…', '🏁 Waiting for the Cup kick-off…')}</p>
                </Box>
              )
            ) : (
              <Box bg="#fff" className="p-4" shadow={6}>
                <p className="text-center font-black text-sm" style={OSWALD}>{libS ? LS('Você já caiu — acompanhe a Libertadores chegando ao fim…', 'You are out — follow the Libertadores to the end…') : LS('Acompanhe a Copa dos 8 chegando ao fim…', 'Follow the Cup of 8 to the end…')}</p>
              </Box>
            )}
            {/* 🎯 tática (pedido de jogador, 12/08) — DEPOIS do placar ao vivo agora
                (Diego 14/08: antes vinha antes do placar, "tava errado" — o jogo
                principal é a estrela, a tática é apoio). */}
            {myTie && (!privateVisual || visualTab === 'jogos') && (
              <Box bg="#fff" className="p-4 space-y-3" shadow={4}>
                <p className="font-black text-xs uppercase tracking-wide" style={OSWALD}>{enS ? `🎯 Your tactic ${libS ? 'in the Libertadores' : 'in the Cup'}` : `🎯 Sua tática ${libS ? 'na Libertadores' : 'na Copa'}`}</p>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(TACTIC_LABEL) as Tactic[]).map(t => (
                    <button key={t} onClick={() => dispatch({ type: 'SET_TACTIC', mgrId: you.id, tactic: t })}
                      className="border-[3px] border-black rounded-xl py-2 text-xs font-black"
                      style={{ backgroundColor: myTactic === t ? GOLD : '#fff', boxShadow: myTactic === t ? `3px 3px 0 0 ${INK}` : 'none' }}>
                      {tacticLabel(t, state.sport === 'basquete', getLang() === 'en' ? 'en' : 'pt')}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] font-semibold text-black/70">{state.sport === 'basquete' ? LS('Defesa segura o run-and-gun · run-and-gun atropela o equilíbrio · equilíbrio fura a defesa.', 'Defense holds run-and-gun · run-and-gun runs over balance · balance breaks the defense.') : LS('Retranca segura ataque · ataque atropela equilíbrio · equilíbrio fura retranca.', 'Park the bus holds attack · attack runs over balanced · balanced breaks the bus.')}</p>
              </Box>
            )}
            {qc.ties.length > 0 && (!privateVisual || visualTab === 'jogos') && (
              <div className={privateVisual ? 'll26-phase-matches' : undefined}>
                <p className="text-xs font-black uppercase text-black/50 mt-1 mb-1">{LS('Todos os jogos da fase', 'All ties of the round')}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>{qc.ties.map(t => tieRow(t))}</div>
              </div>
            )}
          </>
        )
      })() : myLast ? (() => {
        // mesmo placar da carreira (LiveScoreCard): relógio, GOOOL, flash e bump.
        const homeIsYou = myLast.homeId === you.id
        const oppId = homeIsYou ? myLast.awayId : myLast.homeId
        const oppIsHuman = state.managers.some(m => m.id === oppId && m.isHuman)
        // 🎨 amigo online joga com a cor do TIER dele (gratuito = bege) — nunca uma
        // cor emprestada. CPU segue o azul neutro.
        const youColor = myApoioPerk()?.solid ?? APOIO_PERKS.bege.solid
        const oppColor = oppIsHuman ? (perkFromSelo(state.managers.find(m => m.id === oppId)?.teamName ?? '')?.solid ?? APOIO_PERKS.bege.solid) : '#3A7CA5'
        const nameOf = (id: number) => state.league.find(t => t.id === id)?.name ?? '?'
        const scorer = (text: string) => { const mm = text.match(/⚽\s+(.+?)\s+marca para/) || text.match(/🏀\s+(.+?)\s+anota para/); return mm ? mm[1] : text.replace(/^[⚽🏀]\s*/, '').replace(/\.$/, '') }
        const goals = myLast.highlights.filter(lanceEhGol).map(hl => ({ name: scorer(hl.text), min: hl.min, home: hl.teamId === myLast.homeId }))
        return <LiveScoreCard enhancedOnline={privateVisual} key={state.round}
          homeName={nameOf(myLast.homeId)} awayName={nameOf(myLast.awayId)}
          homeColor={homeIsYou ? youColor : oppColor} awayColor={homeIsYou ? oppColor : youColor}
          youIsHome={homeIsYou} goals={goals} roundKey={state.round} roundMs={roundMs} classico={oppIsHuman}
          basket={state.sport === 'basquete' ? { h: myLast.hg, a: myLast.ag } : undefined} />
      })() : (
        <Box bg="#fff" className="p-6" shadow={6}>
          <p className="text-center font-black" style={OSWALD}>{state.sport === 'basquete' ? (getLang() === 'en' ? '🏀 Waiting for the jump ball…' : '🏀 Aguardando a bola ao alto…') : LS('🏁 Aguardando o pontapé inicial…', '🏁 Waiting for kick-off…')}</p>
        </Box>
      )}

      {manual && !state.dinastiaPaused && (
        // ⏩ marcha da velocidade: só no manual (o passo é seu). No online manual/stream
        // só o HOST vê e escolhe — o valor vai pro estado e sincroniza pra sala toda.
        <SpeedControls speed={state.simSpeed ?? 1} onSet={v => dispatch({ type: 'SET_SIM_SPEED', speed: v })} />
      )}
      {(!online || streamHost) && !state.dinastiaPaused && state.round < totalRounds && (
        // 🎮 MANUAL: "Próxima rodada" só LIBERA depois que a partida terminou de
        // simular (respeita o tempo da rodada). Sem isto, dava pra clicar sem parar
        // e "pular" as 38 rodadas na hora. No começo (round 0) libera pra dar o
        // pontapé; da rodada 1 em diante espera a animação (resultRevealed).
        <SimControls manual={manual} onToggle={toggleManual} canNext={state.round === 0 || resultRevealed}
          lock={manualLocked ? <QuickManualLock /> : undefined}
          onNext={() => dispatch({ type: 'PLAY_ROUND' })}
          onSkip={() => dispatch({ type: 'PLAY_ROUND' })}
          nextLabel={!(state.round === 0 || resultRevealed) ? LS('⏳ Deixa a rodada acabar…', '⏳ Let the round finish…') : state.round === 0 && !myLast ? LS('▶️ Começar a temporada', '▶️ Start the season') : LS('▶️ Próxima rodada', '▶️ Next round')} />
      )}
      {(!online || streamHost) && copaLive && (
        <SimControls manual={manual} onToggle={toggleManual} canNext={copaAdvReady}
          lock={manualLocked ? <QuickManualLock /> : undefined}
          onNext={() => dispatch({ type: 'PLAY_COPA_LEG' })}
          onSkip={() => dispatch({ type: 'PLAY_COPA_LEG' })}
          nextLabel={!copaAdvReady ? (bbS ? LS('⏳ Deixa o jogo acabar…', '⏳ Let the game finish…') : LS('⏳ Deixa o jogo/pênaltis acabar…', '⏳ Let the match/penalties finish…')) : firstLegPending ? (libS ? LS('🌎 Iniciar as oitavas', '🌎 Start the round of 16') : bbS ? LS('🏆 Iniciar os Playoffs', '🏆 Start the Playoffs') : LS('🏆 Iniciar a Copa dos 8', '🏆 Start the Cup of 8')) : copaJustAdvanced ? (bbS ? LS('▶️ Próxima fase', '▶️ Next round') : LS('▶️ Começar a próxima fase', '▶️ Start the next round')) : (libS ? LS('🌎 Próximo jogo da Libertadores', '🌎 Next Libertadores match') : bbS ? LS('🏀 Próximo jogo dos Playoffs', '🏀 Next playoff game') : LS('⚽ Próximo jogo da Copa', '⚽ Next Cup match'))} />
      )}
      {privateVisual && !copaLive && <OnlineMatchTabs value={visualTab} onChange={setVisualTab} />}
      {privateVisual && !copaLive && visualTab==='jogos' && state.lastResults.length>1 && <section className="ll27-room-summary" aria-label="Resumo dos outros jogos"><h3>{LS('OUTROS JOGOS · RODADA', 'OTHER MATCHES · ROUND')} {state.round}</h3><div className="ll27-ticker" tabIndex={0}>{state.lastResults.filter(r=>r.homeId!==you.id&&r.awayId!==you.id).map(r=>{
        const home=state.league.find(t=>t.id===r.homeId)?.name??'Clube',away=state.league.find(t=>t.id===r.awayId)?.name??'Clube'
        return <RoundMatchPresentation key={r.homeId} startedAt={leagueStartedAt} roundKey={state.round} roundMs={roundMs} finished={resultRevealed} home={home} away={away} homeCrest={<Escudo nome={home} size={20}/>} awayCrest={<Escudo nome={away} size={20}/>} score={[r.hg,r.ag]} goals={(r.presentationGoals ?? r.highlights).filter(lanceEhGol).map(g=>({name:g.text,min:g.min,home:g.teamId===r.homeId}))}/>
      })}</div></section>}
      <div hidden={privateVisual && visualTab !== 'jogos'} className="space-y-5">
      {!copaLive && lastWasClassico && lastRiv && resultRevealed && (
        <Box bg={myGoals > oppGoals ? GREEN : myGoals < oppGoals ? RED : '#fff'} className="p-3 text-center" shadow={4}>
          <p className="font-black text-sm" style={{ ...OSWALD, color: myGoals === oppGoals ? INK : '#fff' }}>
            {enS ? `⚔️ DERBY ${myGoals > oppGoals ? 'WON' : myGoals < oppGoals ? 'LOST' : 'DRAWN'} against ${lastOppName}` : `⚔️ CLÁSSICO ${myGoals > oppGoals ? 'VENCIDO' : myGoals < oppGoals ? 'PERDIDO' : 'EMPATADO'} contra ${lastOppName}`}
          </p>
          <p className="font-black text-xs mt-0.5" style={{ color: myGoals === oppGoals ? 'rgba(0,0,0,.65)' : 'rgba(255,255,255,.9)' }}>
            {LS('Rivalidade: você', 'Rivalry: you')} {lastRiv.w} × {lastRiv.l} {lastOppName}{lastRiv.d ? (enS ? ` · ${lastRiv.d} draw${lastRiv.d > 1 ? 's' : ''}` : ` · ${lastRiv.d} empate${lastRiv.d > 1 ? 's' : ''}`) : ''}
          </p>
        </Box>
      )}

      {fixture && opp && (
        <Box bg={isClassico ? GOLD : '#fff'} className="p-4 space-y-3">
          {isClassico && (
            <div>
              <p className="font-black text-xs uppercase tracking-wide" style={OSWALD}>{oppCareerRiv ? LS(`🔥 CLÁSSICO — contra ${opp.name}, seu rival de sempre!`, `🔥 DERBY — against ${opp.name}, your rival of old!`) : LS('🥊 CLÁSSICO — é contra a galera!', '🥊 DERBY — it\'s against a friend!')}</p>
              {rivalry && (
                <p className="font-black text-[11px] mt-0.5" style={OSWALD}>
                  {rivalry.w + rivalry.l + rivalry.d === 0
                    ? LS('⚔️ Primeiro duelo de vocês — começa a rivalidade!', '⚔️ Your first duel — the rivalry begins!')
                    : enS ? `⚔️ Head-to-head: you ${rivalry.w} × ${rivalry.l} ${opp.name}${rivalry.d ? ` · ${rivalry.d} draw${rivalry.d > 1 ? 's' : ''}` : ''}` : `⚔️ Retrospecto: você ${rivalry.w} × ${rivalry.l} ${opp.name}${rivalry.d ? ` · ${rivalry.d} empate${rivalry.d > 1 ? 's' : ''}` : ''}`}
                </p>
              )}
            </div>
          )}
          <p className="font-black text-lg" style={OSWALD}>
            {LS('PRÓXIMO', 'NEXT')}: {fixture[0] === you.id ? `${you.teamName} × ${opp.name}` : `${opp.name} × ${you.teamName}`}
            <span className="text-xs text-black/70"> {fixture[0] === you.id ? LS('(em casa)', '(home)') : LS('(fora)', '(away)')}</span>
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(TACTIC_LABEL) as Tactic[]).map(t => (
              <button key={t} onClick={() => dispatch({ type: 'SET_TACTIC', mgrId: you.id, tactic: t })}
                className="border-[3px] border-black rounded-xl py-2 text-xs font-black"
                style={{ backgroundColor: myTactic === t ? GOLD : '#fff', boxShadow: myTactic === t ? `3px 3px 0 0 ${INK}` : 'none' }}>
                {tacticLabel(t, state.sport === 'basquete', getLang() === 'en' ? 'en' : 'pt')}
              </button>
            ))}
          </div>
          {/* 🎨 Diego 14/08: box mais clean, igual o da Copa — tirei a barra de
              progresso + o textão "temporada rolando sozinha" (decorativo, a
              Copa nunca teve isso e ficava mais poluído aqui). */}
          <p className="text-[11px] font-semibold text-black/70">{state.sport === 'basquete' ? LS('Defesa segura o run-and-gun · run-and-gun atropela o equilíbrio · equilíbrio fura a defesa.', 'Defense holds run-and-gun · run-and-gun runs over balance · balance breaks the defense.') : LS('Retranca segura ataque · ataque atropela equilíbrio · equilíbrio fura retranca.', 'Park the bus holds attack · attack runs over balanced · balanced breaks the bus.')}</p>
        </Box>
      )}

      {/* 🛋️ FOLGA: liga com nº ímpar de times — nesta rodada você não tem jogo. Só
          aparece na Liga Fechada ímpar (numa tabela par todo mundo joga toda rodada). */}
      {!fixture && !copaLive && state.round < totalRounds && state.fixtures.length > 0 && (
        <Box className="p-4 text-center">
          <p className="font-black text-lg" style={OSWALD}>{LS('🛋️ VOCÊ FOLGA nesta rodada', '🛋️ You have a BYE this round')}</p>
          <p className="text-xs font-bold text-black/60 mt-1 leading-snug">{LS('Liga com número ímpar de times — a cada rodada um time descansa. Você volta a campo na próxima! 💪', 'Odd number of teams — one team rests each round. You are back on the pitch next round! 💪')}</p>
          <div className="space-y-1 mt-3">
            <div className="h-2 rounded-full border-2 border-black overflow-hidden bg-white">
              <div className="h-full transition-all" style={{ width: `${(state.round / totalRounds) * 100}%`, backgroundColor: GREEN }} />
            </div>
            <p className="text-center text-xs font-bold text-black/60">{LS('⏱️ A rodada corre — os outros se enfrentam.', '⏱️ The round goes on — the others play.')}</p>
          </div>
        </Box>
      )}

      {personalNews && (
        <Box bg="#6C43C0" className="p-2.5 text-center" shadow={4}>
          <p className="font-black text-sm" style={{ ...OSWALD, color: '#fff' }}>{personalNews}</p>
        </Box>
      )}

      {(() => {
        // 🚫 ANTI-SPOILER: enquanto a perna da Copa ainda ANIMA (relógio < 93'), as
        // manchetes que revelam PLACAR / quem passou / campeão entregam o resultado
        // antes do apito. Some SÓ essas linhas de Copa; o resto do giro segue. Quando
        // o relógio fecha (copaMin >= 93), o giro aparece completo.
        const isCopaReveal = (n: string) => /^⚽ Copa /.test(n) || /passou nos PÊNALTIS/.test(n) || /avançou na Copa/.test(n) || /CAMPEÃO DA COPA/.test(n)
        // giroNews é o giro SEGURADO (só atualiza no apito) — o filtro de linhas de
        // Copa fica como segurança extra enquanto a perna anima.
        const shownNews = copaLive && copaMin < 93 ? giroNews.filter(n => !isCopaReveal(n)) : giroNews
        if (shownNews.length === 0) return null
        return <GiroDaRodada news={shownNews} isCopa={copaLive} />
      })()}

      </div>
      {state.careerOnline && (
        <button onClick={() => setShowPyramid(true)}
          className="w-full border-[3px] border-black rounded-xl py-3 font-black text-sm uppercase"
          style={{ backgroundColor: '#7C3AED', color: '#fff', boxShadow: `4px 4px 0 ${INK}`, ...OSWALD }}>
          {LS('🪜 Ver as 4 divisões', '🪜 See the 4 divisions')}
        </button>
      )}
      {/* 🚫 ANTI-SPOILER: a artilharia da Copa soma os gols da perna JÁ no sim; se
          aparecer durante a animação (relógio < 93'), entrega quem marcou antes do
          gol animar. Só mostra depois do apito. */}
      <div hidden={privateVisual && visualTab !== 'jogos'} className={privateVisual && !copaLive ? 'll26-league-content' : undefined} id="ll26-classification">
        {privateVisual && !copaLive && state.lastResults.length > 0 && <section className="ll26-round-list" id="ll26-round-games"><h3>{LS('TODOS OS JOGOS · RODADA', 'ALL MATCHES · ROUND')} {state.round}</h3><p>{resultRevealed ? LS('Rodada encerrada. Confira os resultados e a classificação.', 'Round over. Check the results and the standings.') : LS('Acompanhe a sala. A classificação atualiza após o apito.', 'Follow the room. Standings update after the final whistle.')}</p><div>
          {state.lastResults.map(r => {
            const h = state.league.find(t => t.id === r.homeId), a = state.league.find(t => t.id === r.awayId)
            const owner = (id: number) => { const m = state.managers.find(x => x.id === id); return m?.isHuman ? m.name : 'BOT' }
            return <RoundMatchPresentation startedAt={leagueStartedAt} key={`${r.homeId}-${r.awayId}`} home={h?.name ?? 'Clube'} away={a?.name ?? 'Clube'} homeCrest={<Escudo nome={h?.name ?? ''} size={26} />} awayCrest={<Escudo nome={a?.name ?? ''} size={26} />} homeOwner={owner(r.homeId)} awayOwner={owner(r.awayId)} mine={r.homeId===you.id || r.awayId===you.id} score={[r.hg,r.ag]} goals={(r.presentationGoals ?? r.highlights).filter(lanceEhGol).map(g => ({name:g.text,min:g.min,home:g.teamId===r.homeId}))} finished={resultRevealed} roundKey={state.round} roundMs={roundMs} />
          })}
        </div></section>}
        {privateVisual && copaLive && qc && qc.bracket.map(b => <details key={b.phase} className="ll26-bracket-history"><summary>{enS ? ({oitavas:'ROUND OF 16',quartas:'QUARTER-FINALS',semis:'SEMI-FINALS',final:'FINAL'} as const)[b.phase] : ({oitavas:'OITAVAS',quartas:'QUARTAS',semis:'SEMIFINAIS',final:'FINAL'} as const)[b.phase]} · {LS('RESULTADOS', 'RESULTS')}</summary>{b.ties.map(t => <CompetitionMatch key={`${t.aId}-${t.bId}`} home={t.aName} away={t.bName} homeCrest={<Escudo nome={t.aName} size={26} />} awayCrest={<Escudo nome={t.bName} size={26} />} homeScore={t.legs.reduce((s,g)=>s+g[0],0)} awayScore={t.legs.reduce((s,g)=>s+g[1],0)} status={LS('AGREGADO FINAL', 'FINAL AGGREGATE')} detail={`${t.pens ? `${LS('Pênaltis', 'Penalties')} ${t.pens[0]} × ${t.pens[1]} · ` : ''}${t.winner===t.aId?t.aName:t.bName} ${LS('avançou', 'advanced')}`} />)}</details>)}
        {privateVisual && copaLive ? <details className="ll26-bracket-history"><summary>{LS('LIGA ENCERRADA · VER CLASSIFICAÇÃO', 'LEAGUE OVER · SEE STANDINGS')}</summary><TableBox highlight={you.id} title={LS('LIGA LEGENDS · CLASSIFICAÇÃO FINAL', 'LIGA LEGENDS · FINAL STANDINGS')} /></details> :
        <TableBox highlight={you.id} holdResults={!resultRevealed} title="🏆 LIGA LEGENDS" />
        }
      </div>
      <div hidden={privateVisual && visualTab !== 'estatisticas'} className="space-y-5">
        {copaLive && copaMin >= 93 && <CopaScorersBox highlight={you.id} />}
        <TopScorersBox highlight={you.id} title={LS('⚽ ARTILHARIA DA LIGA LEGENDS', '⚽ LIGA LEGENDS TOP SCORERS')} hold={!resultRevealed} />
        {/* 🐛 08/09 (Diego: *"fica aparecendo 'disponíveis após o apito' e não mostra
            nada, sendo que artilheiro lotado"*): na LIGA o quadro ficava preso a
            `resultRevealed`, que no online AUTOMÁTICO é falso ~85% de cada rodada —
            e as rodadas emendam, então os garçons quase nunca apareciam. A liga volta
            ao que sempre valeu (quadro sempre visível); a Copa mantém a trava do
            relógio (93'), que fecha de verdade no apito. */}
        {(!privateVisual || !copaLive || (copaMin >= 93 && copaAdvReady)) ? <TopAssistsBox highlight={you.id} competition={privateVisual && copaLive ? 'copa' : 'liga'} showEmpty={privateVisual} /> : <Box className="p-4">{LS('Assistências disponíveis após o apito final.', 'Assists available after the final whistle.')}</Box>}
      </div>
      <div hidden={privateVisual && visualTab !== 'elenco'} className="space-y-5">
      <YourPitch small />
      {/* 🌐 SÓ NO RÁPIDO ONLINE (pedido do Diego 09/08): os campinhos de TODOS os
          times da sala, um embaixo do outro — não só o seu. Sem spoiler: o leilão
          já acabou, os elencos são públicos (tabela/artilharia já mostram tudo).
          Offline/carreira: nada muda. */}
      {online && !state.careerOnline && state.managers.filter(mm => mm.id !== you.id && !mm.auctionOnly && mm.squad.length > 0).map(mm => (
        <Campinho key={mm.id} m={mm} small title={`${mm.isHuman ? '👤' : '🤖'} ${mm.teamName}`} manto={mm.isHuman ? mantosSala[mm.id] ?? null : null} />
      ))}
      </div>
      {state.careerDivision && <RivalTracker />}
      {/* 🏆 A LIGA NUM LUGAR SÓ — aparece assim que o PREGÃO ACABA, que é
          exatamente esta tela (a simulação dos jogos). Pedido do Diego 23/08:
          *"as pílulas novas devem aparecer logo após acabar o leilão, q inicia a
          simulação dos jogos"*.
          🚫 NÃO É SPOILER: Rank, Estante e Temporadas só mostram temporadas
          ENCERRADAS (linhas de `game_champions`); o jogo que está rolando agora
          só entra lá quando o apito final tocar. E AQUI ele NÃO grava nada — a
          gravação é do fim do jogo (`gravar`), pra não escrever campeão pela
          metade. Vale na liga E na sala rápida (lá sem a pílula de ajustes, e
          com a linha avisando que a sala some). */}
      {/* ⚠️ SÓ NO RÁPIDO/LIGA: a CARREIRA online já tem a barra dela embaixo
          (`BarraCarreira`), e duas barras fixas na mesma tela brigariam. */}
      {online && state.roomId && !state.careerOnline && (
        <LigaHub roomId={state.roomId} souDono={state.isHost}
          humanos={state.managers.filter(m => m.isHuman).map(m => m.teamName)} />
      )}
      <CreditLine className="pt-4 pb-2" />
      {showPyramid && state.careerOnline && (
        <PyramidOverlay league={state.league} scorers={state.scorers} managers={state.managers} youId={you.id}
          seed={state.seed} round={state.round} deckLeague={state.deckLeague} onClose={() => setShowPyramid(false)} />
      )}
    </Shell>
  )
}

// rastreador dos rivais fixos da carreira: onde cada um está na pirâmide e o
// retrospecto (h2h) vitalício contra você. 🔥 = está na sua divisão (clássico!).
function RivalTracker() {
  const { state } = useEsc()
  if (!state.careerDivision || state.careerRivals.length === 0) return null
  const myDiv = state.careerDivision
  return (
    <Box className="p-3">
      <p className="font-black text-sm mb-2 text-black" style={OSWALD}>🔥 SEUS RIVAIS · ONDE ESTÃO</p>
      <div className="space-y-1.5">
        {state.careerRivals.map(rv => {
          const here = rv.division === myDiv
          const games = rv.h2h[0] + rv.h2h[1] + rv.h2h[2]
          return (
            <div key={rv.team} className="flex items-center justify-between text-xs font-bold rounded-lg px-2 py-1.5"
              style={{ backgroundColor: here ? '#FFE0D6' : '#F3EFE2' }}>
              <span className="truncate max-w-[150px]">{here ? '🔥 ' : ''}{rv.team}</span>
              <span className="flex items-center gap-2 shrink-0">
                <span className="px-1.5 py-0.5 rounded bg-black/10">{DIVISION_LABEL[rv.division]}{rv.lastPos ? ` · ${rv.lastPos}º` : ''}</span>
                <span className="text-black/60">{games === 0 ? 'sem duelos' : `${rv.h2h[0]}V ${rv.h2h[1]}E ${rv.h2h[2]}D`}</span>
              </span>
            </div>
          )
        })}
      </div>
      <p className="text-[10px] font-semibold text-black/50 mt-1.5">🔥 = está na sua divisão (clássico!). Retrospecto: suas Vitórias · Empates · Derrotas.</p>
    </Box>
  )
}

function TopScorersBox({ highlight, title = getLang() === 'en' ? '⚽ TOP SCORERS · LIVE' : '⚽ ARTILHARIA · TEMPO REAL', hold = false }: { highlight: number; title?: string; hold?: boolean }) {
  const { state } = useEsc()
  const [blLang] = useLang()
  const bb = state.sport === 'basquete' // 🏀 basquete: cestinha/pontos no lugar de artilharia/gols
  // 🌐 11/09: o idioma agora vale pro jogo INTEIRO (pedido do Diego), não só pro
  // basquete. Antes esta linha exigia `sport === 'basquete'` — ou seja, todas as
  // traduções que já existiam aqui ficavam guardadas e nunca apareciam no
  // futebol. Agora quem manda é só o botão BR/EN.
  const L = (pt: string, en: string) => (blLang === 'en' ? en : pt)
  // 🙈 ANTI-SPOILER: enquanto o SEU jogo anima (hold), mostra a artilharia de ANTES
  // da rodada (scorersPrev) — os gols novos só entram no apito. Sem isto o total do
  // artilheiro subia com a partida rolando e entregava o gol antes de animar.
  const src = hold && state.scorersPrev ? state.scorersPrev : state.scorers
  const rows = [...src].sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name)).slice(0, 10)
  if (rows.length === 0) {
    return (
      <Box className="p-3">
        <p className="font-black text-sm mb-1 text-black" style={OSWALD}>{bb ? L('🏀 CESTINHA', '🏀 SCORING') : L('⚽ ARTILHARIA', '⚽ TOP SCORERS')}</p>
        <p className="text-xs text-black/60 font-semibold">{bb ? L('Sem pontos ainda. Bola quicando…', 'No points yet. Ball is bouncing…') : L('Sem gols ainda. Bola rolando…', 'No goals yet. Ball rolling…')}</p>
      </Box>
    )
  }
  return (
    <Box className="p-3">
      <p className="font-black text-sm mb-2 text-black" style={OSWALD}>{bb ? L('🏀 CESTINHA DA LIGA', '🏀 SCORING LEADERS') : title}</p>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-black/60 font-black">
            <th className="pr-1">#</th><th>{L('Jogador', 'Player')}</th><th>{L('Time', 'Team')}</th><th className="text-center">{bb ? L('Média', 'PPG') : L('Gols', 'Goals')}</th>{bb && <th className="text-center text-black/40">{L('Pts', 'Pts')}</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            // 🏀 cestinha da NBA é por MÉDIA de pontos por jogo (não total). games =
            // rodadas jogadas até agora; no fim da temporada = 82.
            const games = Math.max(1, state.round)
            const ppg = r.goals / games
            const ppgTxt = blLang === 'en' ? ppg.toFixed(1) : ppg.toFixed(1).replace('.', ',')
            return (
            // 🎨 sua linha veste o SEU tier (Lenda = dourado metálico; gratuito = bege)
            <tr key={`${r.teamId}-${r.name}`} className="border-t border-black/10 font-semibold text-black"
              style={r.teamId === highlight ? { background: myApoioPerk()?.grad ?? APOIO_PERKS.bege.light, color: TIER_INK[myApoioPerk()?.tier ?? 'bege'] } : undefined}>
              <td className="pr-1">{i + 1}</td>
              <td className="truncate max-w-[130px]">{r.name}</td>
              <td className={`max-w-[120px] ${r.teamId === highlight ? '' : 'text-black/70'}`}>
                {/* 🛡️ escudinho do clube do artilheiro (mesmo brasão da tabela) */}
                <span className="flex items-center gap-1 min-w-0"><Escudo nome={r.teamName} size={15} /><span className="truncate">{r.teamName}</span></span>
              </td>
              <td className="text-center font-black">{bb ? ppgTxt : r.goals}</td>
              {bb && <td className="text-center text-black/40">{r.goals}</td>}
            </tr>
          )})}
        </tbody>
      </table>
    </Box>
  )
}

// 🅰️ GARÇONS DA LIGA (rápido, 24/08) — irmã da artilharia, contando os passes
// pro gol. Só aparece quando já existe assistência (save antigo/começo de
// temporada simplesmente não mostra a caixa). Basquete não tem: lá o placar é
// por pontos e assistência não é calculada.
function TopAssistsBox({ highlight, competition = 'liga', showEmpty = false }: { highlight: number; competition?: 'liga' | 'copa' | 'liberta'; showEmpty?: boolean }) {
  const { state } = useEsc()
  if (state.sport === 'basquete') return null
  const rows = [...((competition === 'copa' ? state.quickCopa?.assists : competition === 'liberta' ? state.liberta?.assists : state.assists) ?? [])].sort((a, b) => b.assists - a.assists || a.name.localeCompare(b.name)).slice(0, 10)
  if (rows.length === 0 && !showEmpty) return null
  return (
    <Box className="p-3">
      <p className="font-black text-sm mb-2 text-black" style={OSWALD}>{getLang() === 'en' ? '🅰️ ASSISTS · WHO SETS IT UP' : '🅰️ GARÇONS · QUEM DÁ O PASSE'}</p>
      {showEmpty && <p className="text-xs mb-2 text-black/70">{getLang() === 'en' ? (competition === 'liberta' ? 'Continental cup assists' : competition === 'copa' ? 'Cup assists' : 'League assists') : (competition === 'liberta' ? 'Assistências da Libertadores' : competition === 'copa' ? 'Assistências da Copa' : 'Assistências da liga')}{rows.length === 0 ? ' · Nenhuma assistência registrada ainda.' : ''}</p>}
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-black/60 font-black">
            <th className="pr-1">#</th><th>{getLang() === 'en' ? 'Player' : 'Jogador'}</th><th>{getLang() === 'en' ? 'Team' : 'Time'}</th><th className="text-center">{getLang() === 'en' ? 'Ast.' : 'Assist.'}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.teamId}-${r.name}`} className="border-t border-black/10 font-semibold text-black"
              style={r.teamId === highlight ? { background: myApoioPerk()?.grad ?? APOIO_PERKS.bege.light, color: TIER_INK[myApoioPerk()?.tier ?? 'bege'] } : undefined}>
              <td className="pr-1">{i + 1}</td>
              <td className="truncate max-w-[130px]">{r.name}</td>
              <td className={`max-w-[120px] ${r.teamId === highlight ? '' : 'text-black/70'}`}>
                <span className="flex items-center gap-1 min-w-0"><Escudo nome={r.teamName} size={15} /><span className="truncate">{r.teamName}</span></span>
              </td>
              <td className="text-center font-black" style={{ color: r.teamId === highlight ? undefined : '#2F6BAE' }}>{r.assists}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[10px] font-bold text-black/45 mt-1.5 text-center">{tr('Cerca de 3 em cada 4 gols saem de um passe — o resto é jogada individual.', 'About 3 in 4 goals come from a pass — the rest are solo plays.')}</p>
    </Box>
  )
}

// 🏆 ARTILHARIA DA COPA — ranking À PARTE (só gols da Copa dos 8), aparece em
// cima da tabela da liga quando a Copa está rolando ou acabou. Não mistura com a
// artilharia da liga (que congela no fim das 38 rodadas).
function CopaScorersBox({ highlight }: { highlight: number }) {
  const { state } = useEsc()
  const [cLang] = useLang()
  const bbC = state.sport === 'basquete'
  // 🌐 11/09: vale pro jogo inteiro, não só pro basquete.
  const LC = (pt: string, en: string) => (cLang === 'en' ? en : pt)
  const rows = [...(state.quickCopa?.scorers ?? [])].sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name)).slice(0, 10)
  if (rows.length === 0) return null
  return (
    <Box bg="#FFFBEF" className="p-3">
      <p className="font-black text-sm mb-2" style={{ ...OSWALD, color: '#9a6d00' }}>{bbC ? LC('🏀 CESTINHA DOS PLAYOFFS', '🏀 PLAYOFF SCORING') : state.copaMode === 'liga_liberta' ? (getLang() === 'en' ? '🌎 CONTINENTAL CUP TOP SCORERS' : '🌎 ARTILHARIA DA LIBERTADORES') : (getLang() === 'en' ? '🏆 CUP TOP SCORERS' : '🏆 ARTILHARIA DA COPA')}</p>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-black/60 font-black">
            <th className="pr-1">#</th><th>{LC('Jogador', 'Player')}</th><th>{LC('Time', 'Team')}</th><th className="text-center">{bbC ? LC('Pts', 'Pts') : LC('Gols', 'Goals')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            // 🎨 sua linha veste o SEU tier (Lenda = dourado metálico; gratuito = bege)
            <tr key={`${r.teamId}-${r.name}`} className="border-t border-black/10 font-semibold text-black"
              style={r.teamId === highlight ? { background: myApoioPerk()?.grad ?? APOIO_PERKS.bege.light, color: TIER_INK[myApoioPerk()?.tier ?? 'bege'] } : undefined}>
              <td className="pr-1">{i + 1}</td>
              <td className="truncate max-w-[130px]">{r.name}</td>
              <td className={`max-w-[120px] ${r.teamId === highlight ? '' : 'text-black/70'}`}>
                {/* 🛡️ escudinho do clube do artilheiro (mesmo brasão da tabela) */}
                <span className="flex items-center gap-1 min-w-0"><Escudo nome={r.teamName} size={15} /><span className="truncate">{r.teamName}</span></span>
              </td>
              <td className="text-center font-black">{r.goals}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  )
}

// placar progressivo: o minuto sobe sozinho de 1 até 90+acréscimos, revelando
// os gols conforme o relógio passa por eles — nunca mostra o resultado pronto.

// zona da tabela por posição, PROPORCIONAL ao tamanho da liga (o G4/Z4 do
// Brasileirão é 4 de 20 = 20%). Numa tabela de 20 dá exatamente o de sempre
// (1-4 azul G4, 5-10 amarelo pré, 11-16 branco meio, 17-20 vermelho Z4); numa
// liga fechada menor, as faixas encolhem na mesma proporção.
function zoneN(n: number): number { return Math.max(1, Math.round(n / 5)) }
function zoneBot(n: number): number { return n - zoneN(n) + 1 } // 1ª posição da zona de baixo (Z4 proporcional)
// 🏆 quem classifica pra Copa dos 8 — top 40% da liga (8 de 20, igual sempre foi
// a régua real da Copa). Diego 14/08: virou UMA cor só (não mais degradê G4/Pré/
// Meio/Z4) — o 1-4 (G4) ganha só uma etiquetinha dentro da faixa verde.
function copaN(n: number): number { return Math.max(1, Math.round(n * 0.4)) }
function zoneColor(rank: number, n = 20): string | undefined {
  const copa = copaN(n)                          // classifica pra Copa dos 8 (~40% de cima)
  const bot = zoneBot(n)                         // 1ª posição da zona de risco (20% de baixo)
  if (rank >= bot) return '#F9D8D3'
  if (rank <= copa) return '#D8F0DE'
  return undefined
}

// desfaz os resultados de UMA rodada na tabela — pra mostrar a classificação
// como estava ANTES do jogo, enquanto a partida ainda anima (não estraga a graça).
function leagueBeforeResults<T extends { id: number; pts: number; w: number; d: number; l: number; gf: number; ga: number }>(league: T[], results: { homeId: number; awayId: number; hg: number; ag: number }[]): T[] {
  const map = new Map(league.map(t => [t.id, { ...t }]))
  for (const r of results) {
    const h = map.get(r.homeId), a = map.get(r.awayId)
    if (!h || !a) continue
    h.gf -= r.hg; h.ga -= r.ag; a.gf -= r.ag; a.ga -= r.hg
    if (r.hg > r.ag) { h.pts -= 3; h.w -= 1; a.l -= 1 }
    else if (r.ag > r.hg) { a.pts -= 3; a.w -= 1; h.l -= 1 }
    else { h.pts -= 1; a.pts -= 1; h.d -= 1; a.d -= 1 }
  }
  return league.map(t => map.get(t.id)!)
}

// 📣 giro da rodada: gira UMA manchete por vez sozinho (Diego 14/08 pediu pra
// "rolar" igual o mockup, em vez de empilhar as 4 numa lista parada). Reseta
// pro início toda vez que a lista muda (rodada nova/apito) — a trava
// anti-spoiler continua sendo quem monta `news` lá fora, aqui é só vitrine.
// 🌐 As manchetes do giro NASCEM em PT no HOST e viajam pra sala inteira
// (`state.news`). Traduzir na origem colocaria inglês na tela de quem joga em PT
// na mesma sala — então a tradução é feita AQUI, por quem vê, casando os moldes
// fixos do `narrateRound`/giro da Copa (store.tsx). Molde desconhecido = fica
// como veio (nunca inventa).
function traduzManchete(h: string): string {
  if (getLang() !== 'en') return h
  const m = h.match(/^(R\d+ · )?(.*)$/s)
  const pre = m?.[1] ?? '', t = m?.[2] ?? h
  let r: RegExpMatchArray | null
  if ((r = t.match(/^👑 (.+) assumiu a liderança do campeonato!$/))) return `${pre}👑 ${r[1]} took the league lead!`
  if ((r = t.match(/^🎯 (.+) \((.+)\) tá pegando fogo: (\d+) (gols|pontos) na temporada!$/))) return `${pre}🎯 ${r[1]} (${r[2]}) is on fire: ${r[3]} ${r[4] === 'gols' ? 'goals' : 'points'} this season!`
  if ((r = t.match(/^😱 ZEBRA! (.+) \((\d+)º\) derrubou o (.+) \((\d+)º\): (\d+)×(\d+)\.$/))) return `${pre}😱 UPSET! ${r[1]} (${ordinal(+r[2], 'en')}) brought down ${r[3]} (${ordinal(+r[4], 'en')}): ${r[5]}×${r[6]}.`
  if ((r = t.match(/^💥 (.+) (goleou|atropelou) o (.+): (\d+)×(\d+)\.$/))) return `${pre}💥 ${r[1]} ${r[2] === 'goleou' ? 'thrashed' : 'steamrolled'} ${r[3]}: ${r[4]}×${r[5]}.`
  if ((r = t.match(/^⚽ (Copa|Liberta) (FINAL|SEMI|OITAVAS|QUARTAS)( · ida| · volta)?: (.+)$/))) {
    const fase = { FINAL: 'FINAL', SEMI: 'SEMI', OITAVAS: 'R16', QUARTAS: 'QUARTERS' }[r[2]] ?? r[2]
    const perna = r[3] === ' · ida' ? ' · 1st leg' : r[3] === ' · volta' ? ' · 2nd leg' : ''
    return `${pre}⚽ ${r[1] === 'Copa' ? 'Cup' : 'Liberta'} ${fase}${perna}: ${r[4]}`
  }
  if ((r = t.match(/^🎯 (.+) passou nos PÊNALTIS e eliminou (.+)!$/))) return `${pre}🎯 ${r[1]} went through on PENALTIES and knocked out ${r[2]}!`
  if ((r = t.match(/^🏆 (.+) avançou na (Copa|Libertadores) — adeus, (.+)!$/))) return `${pre}🏆 ${r[1]} advanced in the ${r[2] === 'Copa' ? 'Cup' : 'Libertadores'} — bye, ${r[3]}!`
  return h
}
function GiroDaRodada({ news, isCopa }: { news: string[]; isCopa?: boolean }) {
  const list = news.slice(0, 5).map(traduzManchete)
  const key = list.join('|')
  const [idx, setIdx] = useState(0)
  const keyRef = useRef(key)
  if (keyRef.current !== key) { keyRef.current = key; setIdx(0) }
  useEffect(() => {
    if (list.length <= 1) return
    const iv = setInterval(() => setIdx(i => (i + 1) % list.length), 3200)
    return () => clearInterval(iv)
  }, [key, list.length])
  if (list.length === 0) return null
  return (
    <Box bg="#FFF6DC" className="p-3">
      <style>{'@keyframes giroFade{0%{opacity:0;transform:translateY(4px)}100%{opacity:1;transform:translateY(0)}}'}</style>
      <p className="font-black text-xs uppercase tracking-wide mb-2" style={OSWALD}>{getLang() === 'en' ? (isCopa ? '🏆 Around the cup' : '📣 Around the round') : (isCopa ? '🏆 Giro da Copa' : '📣 Giro da rodada')}</p>
      <p key={idx} className="text-xs font-bold" style={{ minHeight: '2.4em', animation: 'giroFade .35s ease' }}>{list[idx]}</p>
      {list.length > 1 && (
        <div className="flex justify-center gap-1 mt-2">
          {list.map((_, i) => <span key={i} className="rounded-full" style={{ width: 5, height: 5, background: i === idx ? '#8a8069' : '#e2d8b8', display: 'inline-block' }} />)}
        </div>
      )}
    </Box>
  )
}

function TableBox({ highlight, holdResults, title = getLang() === 'en' ? 'TABLE' : 'TABELA' }: { highlight: number; holdResults?: boolean; title?: string }) {
  const { state } = useEsc()
  const [blLang] = useLang()
  const bb = state.sport === 'basquete' // 🏀 basquete: saldo de CESTAS (SC) no lugar de SG
  // 🌐 11/09: o idioma agora vale pro jogo INTEIRO (pedido do Diego), não só pro
  // basquete. Antes esta linha exigia `sport === 'basquete'` — ou seja, todas as
  // traduções que já existiam aqui ficavam guardadas e nunca apareciam no
  // futebol. Agora quem manda é só o botão BR/EN.
  const L = (pt: string, en: string) => (blLang === 'en' ? en : pt)
  // 🏀 andar com playoffs (G League/NBA): mostra a conferência de cada time (🔵
  // Leste par · 🔴 Oeste ímpar) — top 4 de cada vai aos playoffs. Na Street não.
  const confTier = bb && state.copaMode === 'liga_copa'
  const confOf = (id: number) => id % 2 === 0 ? '🔵 ' : '🔴 '
  const league = holdResults && state.lastResults.length > 0 ? leagueBeforeResults(state.league, state.lastResults) : state.league
  const table = sortedTable(league)
  return (
    <Box className="p-3 overflow-x-auto">
      <div className="flex items-center justify-between mb-2">
        <p className="font-black text-sm" style={OSWALD}>{title}</p>
        <div className="flex items-center gap-2 text-[9px] font-bold text-black/60">
          <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: '#FFC400', border: '1px solid rgba(0,0,0,.3)' }} />G{copaN(table.length)}</span>
          <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm inline-block border border-black/20" style={{ backgroundColor: '#fff' }} />{L('Meio', 'Mid')}</span>
          <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: '#F9D8D3', border: '1px solid rgba(0,0,0,.3)' }} />Z{zoneN(table.length)}</span>
        </div>
      </div>
      {confTier && <p className="text-[10px] font-bold text-black/55 mb-1.5">{L('🔵 Leste · 🔴 Oeste — top 4 de cada conferência vai aos playoffs', '🔵 East · 🔴 West — top 4 of each conference makes the playoffs')}</p>}
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-black/70 font-black">
            <th className="pr-1">#</th><th>{L('Time', 'Team')}</th>
            {bb
              ? <><th className="text-center">V</th><th className="text-center">D</th><th className="text-center">{L('AP', 'PCT')}</th><th className="text-center">SC</th></>
              : <><th className="text-center">{L('P', 'Pts')}</th><th className="text-center">{L('V', 'W')}</th><th className="text-center">{L('E', 'D')}</th><th className="text-center">{L('D', 'L')}</th><th className="text-center">{L('SG', 'GD')}</th></>}
          </tr>
        </thead>
        <tbody>
          {table.map((t, i) => {
            const isMgr = state.managers.some(m => m.id === t.id)
            const rank = i + 1
            const isYou = t.id === highlight
            // rival de carreira (fixo, vida própria na pirâmide) OU, no online,
            // qualquer outro técnico HUMANO na sala (gente de verdade, não bot)
            const isOnlineRival = state.onlineMode === 'online' && !isYou && !!state.managers.find(m => m.id === t.id)?.isHuman
            const isRival = (!!state.careerDivision && state.careerRivals.some(rv => rv.team === t.name)) || isOnlineRival
            // 🎨 cada técnico leva o VISUAL do próprio tier pra faixa dele: quem tem
            // tier brilha com o DEGRADÊ da carta (Lenda = dourado metálico, Craque =
            // prata brilhante…); gratuito = bege chapado. Rival de carreira = salmão.
            const youPerk = isYou ? myApoioPerk() : null
            const rivPerk = isOnlineRival ? perkFromSelo(state.managers.find(m => m.id === t.id)?.teamName ?? '') : null
            const rowBg = isYou
              ? (youPerk ? youPerk.grad : APOIO_PERKS.bege.light)
              : isOnlineRival
                ? (rivPerk ? rivPerk.grad : APOIO_PERKS.bege.light)
                : isRival ? '#FFE0D6' : zoneColor(rank, table.length)
            const rowInk = youPerk ? TIER_INK[youPerk.tier] : rivPerk ? TIER_INK[rivPerk.tier] : undefined
            return (
              <tr key={t.id} className="border-t border-black/10 font-semibold"
                style={{ background: rowBg, color: rowInk, fontWeight: isMgr ? 800 : 500 }}>
                <td className="pr-1">
                  <span className="flex items-center gap-1">
                    {rank}
                    {rank <= copaN(table.length) && <span className="text-[7px] font-black rounded px-1" style={{ background: GOLD, border: '1px solid rgba(0,0,0,.4)', color: INK }}>G{copaN(table.length)}</span>}
                    {rank >= zoneBot(table.length) && <span className="text-[7px] font-black rounded px-1" style={{ background: '#F9D8D3', border: '1px solid rgba(0,0,0,.4)', color: INK }}>Z{zoneN(table.length)}</span>}
                  </span>
                </td>
                {/* 🛡️ escudo do clube (gerado do nome) — só no futebol; o basquete
                    segue sem, o visual dele ainda não passou pelo Diego */}
                <td className="max-w-[150px]">
                  <span className="flex items-center gap-1.5 min-w-0">
                    {!bb && <Escudo nome={t.name} size={18} />}
                    <span className="truncate">{confTier ? confOf(t.id) : ''}{isRival ? '🔥 ' : isMgr ? '👤 ' : ''}{t.name}</span>
                  </span>
                </td>
                {bb ? (
                  <>
                    <td className="text-center font-black">{t.w}</td>
                    <td className="text-center">{t.l}</td>
                    <td className="text-center">{(t.w + t.l) > 0 ? Math.round(100 * t.w / (t.w + t.l)) : 0}%</td>
                    <td className="text-center">{t.gf - t.ga}</td>
                  </>
                ) : (
                  <>
                    <td className="text-center font-black">{t.pts}</td>
                    <td className="text-center">{t.w}</td><td className="text-center">{t.d}</td><td className="text-center">{t.l}</td>
                    <td className="text-center">{t.gf - t.ga}</td>
                  </>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
      {!bb && <p className="text-[10px] font-bold text-black/45 text-center mt-2">{tr(`🏆 G${copaN(table.length)} = os ${copaN(table.length)} primeiros — quando a liga acaba, disputam a Copa dos 8.`, `🏆 G${copaN(table.length)} = the top ${copaN(table.length)} — when the league ends, they play the Cup of 8.`)}</p>}
    </Box>
  )
}

// ─── card de resultado pra compartilhar ────────────────────────────────
type ShareCard = { name: string; club: string; year: number; pos: string; fame: number; folk?: boolean; promessa?: boolean }
type ShareBlobOpts = {
  teamName: string; youPos: number; youWon: boolean; champName: string
  pts: number; w: number; d: number; l: number; scorerName?: string; scorerGoals?: number
  nTeams?: number // tamanho da liga (pra faixa 🏅/🪦 proporcional; ausente = 20)
  card?: ShareCard // carta-lembrança do campeão (só quando você venceu e escolheu)
}
// 🪜 "QUER CONTINUAR COM ESSE TIME?" — leva a liga que acabou pra uma carreira.
// Fica no fim da partida rápida OFFLINE (online tem a votação da sala; dinastia,
// NBA e carreira já têm o próprio caminho). Se a pessoa não tem conta, a
// JanelaConta abre por cima e retoma daqui mesmo — ela nunca sai do lugar.
function ContinuarComEsseTime() {
  const { state, dispatch } = useEsc()
  const t = useT() // 🌐 BR/EN
  const [pedindoConta, setPedindoConta] = useState(false)
  const you = state.managers[state.youIdx]
  const nome = you?.teamName ?? t('seu time', 'your team')
  const virar = () => dispatch({ type: 'CAREER_FROM_QUICK' })
  const clicar = async () => {
    // conta NÃO é obrigatória pra jogar (a 1ª temporada é livre — §1 do plano).
    // O convite só aparece se ela ainda não tem conta, e dá pra recusar.
    try {
      const { data } = await supabase.auth.getSession()
      if (data.session) { virar(); return }
    } catch { /* sem rede: deixa jogar, o save fica no aparelho */ }
    setPedindoConta(true)
  }
  return (
    <>
      <Box bg={PURPLE} className="p-4 space-y-2" shadow={6}>
        <p className="font-black text-lg text-center text-white" style={OSWALD}>{t('🪜 QUER CONTINUAR COM ESSE TIME?', '🪜 KEEP GOING WITH THIS TEAM?')}</p>
        <p className="text-sm font-bold text-center text-white/85">
          {getLang() === 'en' ? <>Take <b className="text-white">{nome}</b> and this whole league into a <b className="text-white">career</b>:
          climb the divisions, build a stadium, renew contracts and play the Copa do Brasil.
          <br /><span className="text-white/70">No new auction — the team is already yours.</span></> : <>Leva o <b className="text-white">{nome}</b> e essa liga inteira pra uma <b className="text-white">carreira</b>:
          suba de divisão, construa estádio, renove contrato e dispute a Copa do Brasil.
          <br /><span className="text-white/70">Sem novo pregão — o time já é seu.</span></>}
        </p>
        <Btn onClick={clicar} bg={GOLD} className="w-full text-lg">{t(`🪜 Continuar com o ${nome}`, `🪜 Continue with ${nome}`)}</Btn>
      </Box>
      {pedindoConta && (
        <JanelaConta
          titulo={t('🪜 Levar esse time pra carreira', '🪜 Take this team into a career')}
          contexto={t(`${nome} — sua carreira começa agora`, `${nome} — your career starts now`)}
          comecarEmCriar
          onPronto={() => { setPedindoConta(false); virar() }}
          onFechar={() => { setPedindoConta(false); virar() }} />
      )}
    </>
  )
}

// 🏆 CAMPEÃO (jogo rápido): a imagem de compartilhar é a CARTA BONITA do craque-troféu
// (mesma cara holográfica/bio da carta colecionável) com uma faixa dourada "🏆 CAMPEÃO
// + time" em cima e uma linha de stats logo abaixo. Só pra QUEM GANHA e tem carta; o
// resto (2º, rebaixado) segue no card creme de estatística (buildResultStatsBlob).
async function buildChampionShareBlob(opts: ShareBlobOpts): Promise<Blob | null> {
  const c = opts.card!
  const W = 900, TOP = 206, CH = 1260, FOOT = 96, H = TOP + CH + FOOT
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H
  const x = cv.getContext('2d'); if (!x) return null
  try { await document.fonts.load('900 60px Oswald') } catch { /* segue */ }
  const OSW = 'Oswald, sans-serif'
  const isProm = ehPromessa(c) // 💎 pela CARTA, nunca só pelo nome
  const grads: Record<string, [string, string, string]> = {
    prom: ['#C9A9FF', '#8B5CF6', '#5B2FB0'], f5: ['#FFE79A', '#FFC400', '#E8A200'],
    f4: ['#F4F7FB', '#CBD4DE', '#9BA7B5'], f3: ['#41C07A', '#2E9E5B', '#1E7A45'], f1: ['#DBD1B5', '#CBBF9E', '#B2A583'],
  }
  const key = isProm ? 'prom' : c.fame >= 5 ? 'f5' : c.fame === 4 ? 'f4' : c.fame >= 2 ? 'f3' : 'f1'
  const [g1, g2, g3] = grads[key]
  const dark = key === 'prom' || key === 'f3'
  const inkC = dark ? '#ffffff' : '#0C0C0C'
  const tierLabel = isProm ? '💎 PROMESSA' : c.fame >= 5 ? '👑 LENDA' : c.fame === 4 ? '⭐ CRAQUE' : c.fame >= 2 ? '🎯 BOM JOGADOR' : '🪵 FOI PROFISSIONAL'
  const rrp = (px: number, py: number, w: number, h: number, r: number) => {
    x.beginPath(); x.moveTo(px + r, py); x.arcTo(px + w, py, px + w, py + h, r); x.arcTo(px + w, py + h, px, py + h, r); x.arcTo(px, py + h, px, py, r); x.arcTo(px, py, px + w, py, r); x.closePath()
  }
  // fundo creme
  x.fillStyle = '#F4ECD6'; x.fillRect(0, 0, W, H)
  // 🏆 faixa de campeão + stats
  x.fillStyle = GOLD; x.fillRect(0, 0, W, TOP)
  x.fillStyle = INK; x.fillRect(0, TOP - 8, W, 8)
  x.textAlign = 'center'; x.fillStyle = INK
  x.font = `900 62px ${OSW}`; x.fillText('🏆 CAMPEÃO', W / 2, 78)
  let tf = 40; x.font = `800 ${tf}px ${OSW}`
  while (x.measureText(opts.teamName).width > W - 120 && tf > 24) { tf -= 2; x.font = `800 ${tf}px ${OSW}` }
  x.fillText(opts.teamName, W / 2, 130)
  const stats = `${opts.pts} pts · ${opts.w}V ${opts.d}E ${opts.l}D` + (opts.scorerName ? `  ·  ⚽ ${opts.scorerName} (${opts.scorerGoals})` : '')
  x.font = `700 26px ${OSW}`; x.fillStyle = 'rgba(0,0,0,0.72)'
  let sf = 26; x.font = `700 ${sf}px ${OSW}`
  while (x.measureText(stats).width > W - 90 && sf > 16) { sf -= 1; x.font = `700 ${sf}px ${OSW}` }
  x.fillText(stats, W / 2, 176)
  // ── a CARTA (deslocada pra baixo da faixa) ──
  const OY = TOP, M = 46, cw = W - M * 2, ch = CH - M * 2
  const gr = x.createLinearGradient(M, OY + M, M + cw, OY + M + ch)
  gr.addColorStop(0, g1); gr.addColorStop(0.5, g2); gr.addColorStop(1, g3)
  rrp(M, OY + M, cw, ch, 44); x.fillStyle = gr; x.fill()
  x.lineWidth = 10; x.strokeStyle = '#0C0C0C'; rrp(M, OY + M, cw, ch, 44); x.stroke()
  if (key === 'f5' || key === 'f4' || key === 'prom') {
    x.save(); rrp(M, OY + M, cw, ch, 44); x.clip()
    const hg = x.createLinearGradient(M, OY + M + ch, M + cw, OY + M)
    hg.addColorStop(0.35, 'rgba(255,255,255,0)'); hg.addColorStop(0.5, `rgba(255,255,255,${key === 'f5' ? 0.55 : 0.35})`); hg.addColorStop(0.65, 'rgba(255,255,255,0)')
    x.fillStyle = hg; x.fillRect(M, OY + M, cw, ch); x.restore()
  }
  x.fillStyle = '#0C0C0C'; rrp(M + 34, OY + M + 34, 108, 62, 16); x.fill()
  x.fillStyle = '#fff'; x.font = `900 38px ${OSW}`; x.textAlign = 'center'; x.fillText(c.pos, M + 88, OY + M + 78)
  x.textAlign = 'right'; x.font = `900 34px ${OSW}`; x.fillStyle = dark ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.62)'
  x.fillText(tierLabel, M + cw - 36, OY + M + 76)
  if (c.folk) {
    x.font = `900 27px ${OSW}`
    const fw = x.measureText('🃏 FOLCLÓRICO').width + 40
    x.fillStyle = 'rgba(0,0,0,0.30)'; rrp(M + cw - 36 - fw, OY + M + 96, fw, 46, 23); x.fill()
    x.fillStyle = '#fff'; x.fillText('🃏 FOLCLÓRICO', M + cw - 56, OY + M + 129)
  }
  x.textAlign = 'center'
  x.beginPath(); x.arc(W / 2, OY + M + ch * 0.40, 130, 0, Math.PI * 2)
  x.fillStyle = dark ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.5)'; x.fill()
  x.lineWidth = 8; x.strokeStyle = 'rgba(0,0,0,0.28)'; x.stroke()
  x.fillStyle = dark ? '#2b1a4d' : 'rgba(0,0,0,0.55)'; x.font = `900 118px ${OSW}`
  x.fillText((c.name.trim()[0] || '?').toUpperCase(), W / 2, OY + M + ch * 0.40 + 42)
  let fs = 64; x.font = `900 ${fs}px ${OSW}`
  while (x.measureText(c.name).width > cw - 80 && fs > 30) { fs -= 3; x.font = `900 ${fs}px ${OSW}` }
  x.fillStyle = inkC; x.fillText(c.name, W / 2, OY + M + ch * 0.66)
  x.font = `800 32px Arial`; x.fillStyle = dark ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.62)'
  x.fillText(`${c.club} · ${c.year}`, W / 2, OY + M + ch * 0.66 + 48)
  x.font = `700 36px Arial`
  x.fillText(isProm ? '💎💎💎' : '⭐'.repeat(Math.max(1, c.fame)), W / 2, OY + M + ch * 0.66 + 104)
  const bioText = BIOS[c.name] // bio REAL (sem inventar); vazio se não tiver
  if (bioText) {
    x.font = `italic 700 28px Georgia`; x.fillStyle = dark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.72)'
    const words = ('“' + bioText + '”').split(' '); const lines: string[] = []; let ln = ''
    for (const w2 of words) { const t = ln ? ln + ' ' + w2 : w2; if (x.measureText(t).width > cw - 130 && ln) { lines.push(ln); ln = w2 } else ln = t }
    if (ln) lines.push(ln)
    lines.slice(0, 4).forEach((l, i) => x.fillText(l, W / 2, OY + M + ch * 0.66 + 168 + i * 38))
  }
  // rodapé da marca
  x.fillStyle = '#0C0C0C'; x.fillRect(0, TOP + CH, W, FOOT)
  x.fillStyle = '#F5B301'; x.font = `900 28px ${OSW}`; x.textAlign = 'center'
  x.fillText('🏆 campeão do Leilão Legends · leilaolegends.com 🔨', W / 2, TOP + CH + 60)
  return new Promise(resolve => cv.toBlob(b => resolve(b), 'image/png'))
}
async function buildShareCardBlob(opts: ShareBlobOpts): Promise<Blob | null> {
  // 🏆 QUEM GANHA (e tem carta-troféu) leva a carta bonita; o resto segue no card creme.
  if (opts.youWon && opts.card) return buildChampionShareBlob(opts)
  const canvas = document.createElement('canvas')
  canvas.width = 900; canvas.height = 1200
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  try { await document.fonts.load('900 52px Oswald') } catch { /* segue com a fonte padrão */ }

  ctx.fillStyle = CREAM
  ctx.fillRect(0, 0, 900, 1200)
  ctx.fillStyle = GOLD
  ctx.fillRect(24, 24, 852, 140)
  ctx.strokeStyle = INK; ctx.lineWidth = 16
  ctx.strokeRect(24, 24, 852, 140)
  ctx.strokeRect(24, 24, 852, 1152)
  ctx.fillStyle = INK
  ctx.textAlign = 'center'
  ctx.font = '900 46px Oswald, sans-serif'
  ctx.fillText('🔨 LEILÃO LEGENDS', 450, 108)

  const hasCard = !!opts.card
  ctx.font = hasCard ? '110px sans-serif' : '160px sans-serif'
  // 🐛 CORRIGIDO (relato do Diego 12/08): usava 🥈 (que É literalmente a
  // medalha "2º lugar" no desenho do emoji) pra QUALQUER posição dentro da
  // zona de cima — um 3º lugar aparecia com "2" na medalha. Trocado por 🏅
  // (medalha sem número), que não promete uma posição que não é a de verdade.
  ctx.fillText(opts.youWon ? '🏆' : opts.youPos <= zoneN(opts.nTeams ?? 20) ? '🏅' : opts.youPos >= zoneBot(opts.nTeams ?? 20) ? '🪦' : '⚽', 450, hasCard ? 296 : 400)

  ctx.font = '900 72px Oswald, sans-serif'
  ctx.fillText(opts.youWon ? 'CAMPEÃO!' : `${opts.youPos}º LUGAR`, 450, hasCard ? 366 : 500)

  ctx.font = '700 42px Oswald, sans-serif'
  ctx.fillText(opts.teamName, 450, hasCard ? 424 : 565)

  let statsY = 680
  if (opts.card) {
    // ── painel da carta-lembrança do campeão ──
    const c = opts.card
    const cw = 360, chh = 300, cx = 450 - cw / 2, top = 470
    ctx.fillStyle = c.fame >= 5 ? GOLD : '#fff'
    ctx.beginPath(); ctx.roundRect(cx, top, cw, chh, 22); ctx.fill()
    ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.stroke()
    ctx.fillStyle = INK; ctx.beginPath(); ctx.roundRect(cx + 22, top + 22, 92, 44, 22); ctx.fill()
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = '900 24px Oswald, sans-serif'
    ctx.fillText(c.pos, cx + 22 + 46, top + 52)
    ctx.fillStyle = INK
    let nameFont = 46; ctx.font = `900 ${nameFont}px Oswald, sans-serif`
    while (ctx.measureText(c.name).width > cw - 48 && nameFont > 24) { nameFont -= 2; ctx.font = `900 ${nameFont}px Oswald, sans-serif` }
    ctx.fillText(c.name, 450, top + 132)
    ctx.font = '600 26px Inter, sans-serif'; ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillText(`${c.club} · ${c.year}`, 450, top + 174)
    const tier = c.fame >= 5 ? '👑 LENDA' : c.fame === 4 ? '⭐ CRAQUE' : c.promessa ? '💎 PROMESSA' : c.folk ? '🃏 FOLCLÓRICO' : '⚽ BOM JOGADOR'
    ctx.font = '900 30px Oswald, sans-serif'; ctx.fillStyle = INK
    ctx.fillText(tier, 450, top + 244)
    statsY = top + chh + 66
  }

  ctx.textAlign = 'left'
  ctx.font = '600 32px Inter, sans-serif'
  let y = statsY
  ctx.fillText(`Pontos: ${opts.pts} (${opts.w}V ${opts.d}E ${opts.l}D)`, 90, y)
  y += 50
  if (opts.scorerName) { ctx.fillText(`Artilheiro: ${opts.scorerName} — ${opts.scorerGoals} gols`, 90, y); y += 50 }
  if (!opts.youWon) ctx.fillText(`Campeão da temporada: ${opts.champName}`, 90, y)

  ctx.textAlign = 'center'
  ctx.font = '700 30px Oswald, sans-serif'
  ctx.fillText('LEILÃO LEGENDS', 450, 1125)
  ctx.font = '400 22px Inter, sans-serif'
  ctx.fillText(GAME_URL.replace('https://', ''), 450, 1156)

  return new Promise(resolve => canvas.toBlob(b => resolve(b), 'image/png'))
}

// 📤 tenta mandar a IMAGEM pelo compartilhar do próprio aparelho (é por aí que
// foto entra no WhatsApp/Instagram/Telegram). Devolve `true` se conseguiu — quem
// chama decide o que fazer quando não dá (baixar, ou abrir o link).
async function shareImagemNativa(opts: ShareOpts, texto: string): Promise<boolean> {
  const blob = await buildShareCardBlob(opts)
  if (!blob) return false
  const file = new File([blob], 'leilao-legends.png', { type: 'image/png' })
  const shareData = { files: [file], title: 'Leilão Legends', text: `${texto} ${GAME_URL}` }
  if (!navigator.canShare?.(shareData)) return false
  try { await navigator.share(shareData); return true } catch { return false /* cancelou ou falhou */ }
}
async function shareResult(opts: ShareOpts) {
  if (await shareImagemNativa(opts, shareTextFor(opts))) return
  const blob = await buildShareCardBlob(opts)
  if (!blob) return
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'leilao-legends.png'
  a.click()
  URL.revokeObjectURL(url)
}

// texto + links por plataforma. WhatsApp/Twitter aceitam só texto+link (a IMAGEM
// vai pelo compartilhar nativo ou baixada). Instagram não tem "intent" web:
// baixa a imagem e o usuário posta no story/feed.
type ShareOpts = Parameters<typeof buildShareCardBlob>[0]
function shareTextFor(o: ShareOpts) {
  return o.youWon
    ? `🏆 Fui CAMPEÃO com o ${o.teamName} no Leilão Legends! Leilão às cegas de lendas do futebol brasileiro 🔨`
    : `Terminei em ${o.youPos}º com o ${o.teamName} no Leilão Legends 🔨 Bora jogar?`
}
async function downloadShareImage(o: ShareOpts) {
  const blob = await buildShareCardBlob(o); if (!blob) return
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = 'leilao-legends.png'; a.click()
  URL.revokeObjectURL(url)
}
function ShareResultPanel({ opts }: { opts: ShareOpts }) {
  const t = useT() // 🌐 BR/EN (só os botões; o texto compartilhado segue em PT — é o post do jogo)
  const [savedIG, setSavedIG] = useState(false)
  const [open, setOpen] = useState(false) // recolhido por padrão — não roubar a atenção da votação
  const text = shareTextFor(opts)
  // 📱 WhatsApp: no CELULAR manda a IMAGEM pelo compartilhar do aparelho — o
  // `wa.me` só sabe levar TEXTO, e era por isso que saía link pelado no lugar da
  // arte (reclamação do Diego 04/09). Se o aparelho não souber mandar arquivo
  // (desktop), aí sim cai no link — mas agora no domínio certo.
  const wa = async () => {
    if (await shareImagemNativa(opts, text)) return
    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + GAME_URL)}`, '_blank', 'noopener')
  }
  const tw = () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(GAME_URL)}`, '_blank', 'noopener')
  const ig = async () => { await downloadShareImage(opts); setSavedIG(true) }
  return (
    <Box bg="#fff" className="p-3 space-y-2">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between active:opacity-70">
        <span className="font-black text-sm" style={OSWALD}>{t('📤 Compartilhar', '📤 Share')} {opts.youWon ? t('a conquista', 'the title') : t('o resultado', 'the result')}{opts.card ? t(' + carta', ' + card') : ''}</span>
        <span className="text-black/40 text-[11px] font-black" style={OSWALD}>{open ? t('fechar ▲', 'close ▲') : t('abrir ▼', 'open ▼')}</span>
      </button>
      {open && (
        <>
          <Btn onClick={() => shareResult(opts)} bg={GOLD} className="w-full">{t('📤 Compartilhar imagem', '📤 Share image')}</Btn>
          <div className="grid grid-cols-3 gap-2">
            <Btn onClick={wa} bg="#25D366" className="w-full"><span className="text-white">📱 WhatsApp</span></Btn>
            <Btn onClick={tw} bg="#111" className="w-full"><span className="text-white">𝕏 Twitter</span></Btn>
            <Btn onClick={ig} bg="#E1306C" className="w-full"><span className="text-white">📸 Instagram</span></Btn>
          </div>
          {savedIG && <p className="text-[11px] font-bold text-black/60 text-center">{t('📸 Imagem salva! Abra o Instagram e poste no seu story.', '📸 Image saved! Open Instagram and post it to your story.')}</p>}
        </>
      )}
    </Box>
  )
}

// ─── 🌎 LIBERTADORES · FASE DE GRUPOS ──────────────────────────────────────
// Tela própria (screen 'liberta'), separada da temporada, porque aqui NÃO existe
// tabela de 20 nem rebaixamento: são 8 grupos de 4, 6 rodadas, passam 2. Quando a
// 6ª rodada fecha, o motor semeia as OITAVAS no `quickCopa` e devolve pra tela da
// temporada — o mata-mata reusa inteirinho o motor da Copa dos 8.
//
// Ritmo: MESMO da liga (ROUND_MS) e com as mesmas regras de quem conduz — host no
// online, o próprio cliente no solo — pra ninguém ver rodada fora de ordem.
const LIBERTA_RODADAS = 6
const GRUPO_LETRA = 'ABCDEFGH'

export function EscLiberta() {
  const { state, dispatch } = useEsc()
  const LB = useT() // 🌐 BR/EN
  const enL = getLang() === 'en'
  const previewAccount = useOnlinePreview()
  const privateVisual = (previewAccount || publicOnlineVisual(state)) && state.sport !== 'basquete'
  const [groupView, setGroupView] = useState<'meu' | 'todos'>('todos')
  const groupStartedAt = useRoundPresentationStart(state.liberta?.rodada ?? 0)
  const you = state.managers[state.youIdx]
  const lb = state.liberta
  const online = state.onlineMode === 'online'
  const canAdvance = !online || state.isHost
  const streamHost = online && state.isHost && (state.streamMode || !!state.manualRoom)
  const [manualPref, toggleSim] = useSimMode()
  const [streamManual, toggleStream] = useStreamSimMode()
  const hasManual = useHasManual()
  const manual = streamHost ? streamManual : (manualPref && !online && hasManual)
  const manualLocked = !online && !hasManual
  const rawToggle = streamHost ? toggleStream : toggleSim
  const toggleManual = () => {
    const goingManual = !manual
    rawToggle()
    if (!goingManual && (state.simSpeed ?? 1) !== 1) dispatch({ type: 'SET_SIM_SPEED', speed: 1 })
  }
  const speedFactor = state.simSpeed && state.simSpeed > 0 ? state.simSpeed : 1
  const roundMs = Math.round(ROUND_MS / speedFactor)
  // 🙈 ANTI-SPOILER (regra do Diego): a classificação do grupo só atualiza DEPOIS
  // que o jogo terminou de animar na tela — igual a tabela da liga faz.
  const [revealed, setRevealed] = useState(false)
  useEffect(() => {
    setRevealed(false)
    const t = setTimeout(() => setRevealed(true), roundMs * 0.85 + 250)
    return () => clearTimeout(t)
  }, [lb?.rodada])
  useEffect(() => { startCrowd(); return () => stopCrowd() }, [])
  useEffect(() => { if ((lb?.rodada ?? 0) > 0) playWhistle() }, [lb?.rodada])
  // autoplay: só quem conduz dispara a rodada seguinte (os outros recebem o
  // resultado já sincronizado e animam localmente).
  useEffect(() => {
    if (!canAdvance || manual || !lb || lb.fase !== 'grupos' || lb.rodada >= LIBERTA_RODADAS) return
    const t = setTimeout(() => dispatch({ type: 'PLAY_LIBERTA_RODADA' }), lb.rodada === 0 ? Math.round(2200 / speedFactor) : roundMs)
    return () => clearTimeout(t)
  }, [lb?.rodada, lb?.fase, canAdvance, manual, roundMs, speedFactor, dispatch])

  if (!lb) return null
  const meuTime = lb.times.find(t => t.id === you.id)
  const meuGrupo = meuTime?.grupo ?? -1
  const nomeDe = (id: number) => lb.times.find(t => t.id === id)?.name ?? '?'
  const humano = (id: number) => state.managers.some(m => m.id === id && m.isHuman)
  const tag = (id: number) => id === you.id ? LB(' (você)', ' (you)') : humano(id) ? ' 🔥' : ''
  const meuJogo = lb.lastResults.find(r => r.homeId === you.id || r.awayId === you.id)
  // 🙈 ANTI-SPOILER (relato do Walace via Diego, 20/08: *"a tabela tá atualizando
  // antes do jogo acabar"*). É a MESMA trava da liga: enquanto a partida anima na
  // tela, as tabelinhas mostram como o grupo estava ANTES desta rodada — os
  // pontos só entram quando o apito soa. Sem isto, dava pra ler o resultado do
  // seu próprio jogo na tabela antes de ele terminar de rolar.
  const timesShown = !revealed && lb.lastResults.length > 0
    ? leagueBeforeResults(lb.times, lb.lastResults)
    : lb.times
  const grupoShown = (g: number) => timesShown.filter(t => t.grupo === g).sort((a, c) =>
    c.pts - a.pts || c.w - a.w || (c.gf - c.ga) - (a.gf - a.ga) || c.gf - a.gf || a.name.localeCompare(c.name))
  const youColor = myApoioPerk()?.solid ?? APOIO_PERKS.bege.solid
  const scorer = (text: string) => { const mm = text.match(/⚽\s+(.+?)\s+marca para/); return mm ? mm[1] : text.replace(/^⚽\s*/, '').replace(/\.$/, '') }
  const acabou = lb.rodada >= LIBERTA_RODADAS

  // uma tabelinha de grupo (4 linhas). `destaque` = o SEU grupo (fundo creme).
  const tabelaGrupo = (g: number, destaque: boolean) => {
    const cl = grupoShown(g)
    return (
      <Box key={g} bg={privateVisual ? CREAM : destaque ? '#FFF6D6' : '#fff'} className={privateVisual ? 'p-3 ll26-liberta-group' : 'p-2'} shadow={destaque ? 5 : 3}
        style={destaque ? { borderColor: NOITE } : undefined}>
        <p className="font-black text-[11px] uppercase mb-1" style={{ ...OSWALD, color: NOITE }}>
          {LB('Grupo', 'Group')} {GRUPO_LETRA[g]}{destaque ? LB(' · o seu', ' · yours') : ''}
        </p>
        {privateVisual && <div className="flex justify-end gap-3 text-[10px] font-bold"><span>{LB('SG', 'GD')}</span><span>PTS</span></div>}
        {cl.map((t, i) => (
          <div key={t.id} className="flex items-center gap-1.5 text-[10.5px] font-bold py-0.5"
            style={{ opacity: acabou && i > 1 ? .45 : 1 }}>
            {/* 🟢 os 2 primeiros passam — marca visual constante, sem precisar contar */}
            <span className="flex-none w-3.5 h-3.5 rounded-[4px] text-[8px] font-black flex items-center justify-center"
              style={{ background: i < 2 ? GREEN : 'rgba(0,0,0,.12)', color: i < 2 ? '#fff' : 'rgba(0,0,0,.5)' }}>{i + 1}</span>
            {privateVisual && <Escudo nome={t.name} size={22} />}
            <span className="min-w-0 flex-1 truncate" style={{ fontWeight: t.id === you.id ? 900 : 700 }}>{t.name}{tag(t.id)}</span>
            <span className="flex-none tabular-nums text-black/45">{t.gf - t.ga > 0 ? '+' : ''}{t.gf - t.ga}</span>
            <span className="flex-none tabular-nums font-black w-5 text-right">{t.pts}</span>
          </div>
        ))}
        {privateVisual && <div className="ll26-group-fixtures"><h3>{lb.rodada > 0 ? `${LB('JOGOS · RODADA', 'MATCHES · ROUND')} ${lb.rodada}/6` : LB('AGUARDANDO A PRIMEIRA RODADA', 'WAITING FOR THE FIRST ROUND')}</h3>
          {lb.lastResults.filter(r => lb.times.find(t => t.id === r.homeId)?.grupo === g).map(r => <RoundMatchPresentation startedAt={groupStartedAt} key={`${r.homeId}-${r.awayId}`} home={nomeDe(r.homeId)} away={nomeDe(r.awayId)} homeCrest={<Escudo nome={nomeDe(r.homeId)} size={25} />} awayCrest={<Escudo nome={nomeDe(r.awayId)} size={25} />} homeOwner={state.managers.find(m=>m.id===r.homeId&&m.isHuman)?.name ?? 'BOT'} awayOwner={state.managers.find(m=>m.id===r.awayId&&m.isHuman)?.name ?? 'BOT'} mine={r.homeId === you.id || r.awayId === you.id} goals={(r.presentationGoals ?? r.highlights).filter(lanceEhGol).map(h => ({name: scorer(h.text), min:h.min,home:h.teamId===r.homeId}))} score={[r.hg,r.ag]} finished={revealed} roundKey={lb.rodada} roundMs={roundMs} />)}
          <p>{acabou && revealed ? LB('Os dois primeiros avançam às oitavas.', 'The top two reach the round of 16.') : revealed ? LB('Classificação atualizada após o apito.', 'Standings updated after the whistle.') : LB('A classificação atualiza quando a rodada terminar.', 'Standings update when the round ends.')}</p>
        </div>}
      </Box>
    )
  }

  return (
    <Shell bar={
      <div className="flex items-center justify-between gap-2">
        <span className="font-black text-sm" style={{ ...OSWALD, color: NOITE }}>
          🌎 LIBERTADORES · {acabou && (!privateVisual || revealed) ? LB('GRUPOS ENCERRADOS', 'GROUPS OVER') : `${LB('RODADA', 'ROUND')} ${privateVisual ? Math.max(1,lb.rodada) : Math.min(lb.rodada + 1, LIBERTA_RODADAS)}/${LIBERTA_RODADAS}`}
        </span>
        {meuTime && (
          <span className="font-black text-sm" style={OSWALD}>
            {LB('Grupo', 'Group')} {GRUPO_LETRA[meuGrupo]} · {ordinal(grupoShown(meuGrupo).findIndex(t => t.id === you.id) + 1)} · {grupoShown(meuGrupo).find(t => t.id === you.id)?.pts ?? 0} pts
          </span>
        )}
      </div>
    }>
{privateVisual ? <CompetitionStage kind="liberta" title="LIBERTADORES" phase={acabou && revealed ? LB('Grupos encerrados', 'Groups over') : LB(`Fase de grupos · rodada ${Math.max(1, lb.rodada)}/6`, `Group stage · round ${Math.max(1, lb.rodada)}/6`)} detail={LB('32 clubes · 8 grupos · os dois primeiros avançam às oitavas', '32 clubs · 8 groups · the top two reach the round of 16')} status={meuTime ? LB(`Seu clube está no grupo ${GRUPO_LETRA[meuGrupo]}`, `Your club is in group ${GRUPO_LETRA[meuGrupo]}`) : LB('Acompanhe os clubes classificados da sala', 'Follow the room\'s qualified clubs')} /> : <Box bg={NOITE_HOLO} className="p-3 text-center" shadow={4} style={{ position: 'relative', overflow: 'hidden' }}>
        <ApoioSheen holo={1} dur={3.2} />
        <p className="font-black text-sm relative" style={{ ...OSWALD, color: '#fff', zIndex: 2 }}>{LB('🌎 LIBERTADORES · FASE DE GRUPOS', '🌎 LIBERTADORES · GROUP STAGE')}</p>
        <p className="font-black text-[11px] relative" style={{ color: 'rgba(255,255,255,.82)', zIndex: 2 }}>
          {LB('32 clubes · 8 grupos de 4 · passam os 2 primeiros', '32 clubs · 8 groups of 4 · top 2 go through')}
        </p>
      </Box>}

      {/* 📺 O SEU jogo da rodada, com o placar subindo — igual a liga */}
      {meuJogo ? (() => {
        const homeIsYou = meuJogo.homeId === you.id
        const oppId = homeIsYou ? meuJogo.awayId : meuJogo.homeId
        const oppIsHuman = humano(oppId)
        const oppColor = oppIsHuman ? (perkFromSelo(state.managers.find(m => m.id === oppId)?.teamName ?? '')?.solid ?? APOIO_PERKS.bege.solid) : '#3A7CA5'
        const goals = meuJogo.highlights.filter(lanceEhGol).map(hl => ({ name: scorer(hl.text), min: hl.min, home: hl.teamId === meuJogo.homeId }))
        return <LiveScoreCard enhancedOnline={privateVisual} key={`lb-${lb.rodada}`}
          homeName={nomeDe(meuJogo.homeId)} awayName={nomeDe(meuJogo.awayId)}
          homeColor={homeIsYou ? youColor : oppColor} awayColor={homeIsYou ? oppColor : youColor}
          youIsHome={homeIsYou} goals={goals} roundKey={lb.rodada} roundMs={roundMs} classico={oppIsHuman}
          footTint={{ bg: '#E8EEFB', border: '#b9c9ef', holo: 0.5 }} />
      })() : (
        <Box bg="#fff" className="p-6" shadow={6}>
          <p className="text-center font-black" style={OSWALD}>
            {acabou ? LB('🏁 Fim da fase de grupos!', '🏁 Group stage over!') : meuTime ? LB('🌎 Aguardando o pontapé inicial da Libertadores…', '🌎 Waiting for the Libertadores kick-off…') : LB('📺 Você não se classificou — acompanhe a Libertadores por aqui.', '📺 You did not qualify — follow the Libertadores here.')}
          </p>
        </Box>
      )}

      {/* 📣 giro da Libertadores (o mesmo lugar de sempre das manchetes) */}
      {state.news.length > 0 && (
        <Box bg="#fff" className="p-3" shadow={4}>
          <p className="font-black text-[11px] uppercase mb-1" style={{ ...OSWALD, color: NOITE }}>{LB('📣 Giro da Libertadores', '📣 Libertadores round-up')}</p>
          {state.news.slice(0, 3).map((n, i) => <p key={i} className="text-[11px] font-semibold text-black/70 leading-snug">{n}</p>)}
        </Box>
      )}

      {/* 🥅 os OUTROS jogos da rodada — só depois que o seu terminou de animar,
          senão o placar da tela grande é entregue aqui embaixo antes do apito. */}
      {!privateVisual && revealed && lb.lastResults.length > 0 && (
        <Box bg="#fff" className="p-3" shadow={4}>
          <p className="font-black text-[11px] uppercase mb-1.5" style={{ ...OSWALD, color: NOITE }}>{LB('🥅 Os outros jogos da rodada', '🥅 The other matches of the round')}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 5 }}>
            {lb.lastResults.filter(r => r.homeId !== you.id && r.awayId !== you.id).map((r, i) => (
              <div key={i} className="flex items-center gap-1 text-[10px] font-bold rounded-lg px-1.5 py-1" style={{ background: '#F4ECD6', border: '2px solid rgba(0,0,0,.18)' }}>
                <span className="min-w-0 flex-1 truncate text-right">{nomeDe(r.homeId)}</span>
                <span className="flex-none font-black tabular-nums">{r.hg}×{r.ag}</span>
                <span className="min-w-0 flex-1 truncate">{nomeDe(r.awayId)}</span>
              </div>
            ))}
          </div>
        </Box>
      )}

      {/* 📊 os 8 grupos — o SEU primeiro, pra não ter que caçar na tela */}
      {privateVisual && <nav className="ll25-rhythm" aria-label="Grupos da Libertadores">
        {meuGrupo >= 0 && <button className="ll25-button" aria-pressed={groupView === 'meu'} onClick={() => setGroupView('meu')}>{LB('MEU GRUPO', 'MY GROUP')}</button>}
        <button className="ll25-button" aria-pressed={groupView === 'todos' || meuGrupo < 0} onClick={() => setGroupView('todos')}>{LB('TODOS OS GRUPOS', 'ALL GROUPS')}</button>
      </nav>}
      <div style={{ display: 'grid', gridTemplateColumns: privateVisual ? 'repeat(auto-fit, minmax(min(100%, 310px), 1fr))' : 'repeat(auto-fit, minmax(165px, 1fr))', gap: 12 }}>
        {[...Array(8).keys()]
          .filter(g => !privateVisual || groupView === 'todos' || meuGrupo < 0 || g === meuGrupo)
          .sort((a, b) => (a === meuGrupo ? -1 : b === meuGrupo ? 1 : a - b))
          .map(g => tabelaGrupo(g, g === meuGrupo))}
      </div>
      <p className="text-[10px] font-bold text-black/45 text-center" style={privateVisual ? {color:CREAM} : undefined}>{enL ? <>🟢 the <b>top 2</b> of each group reach the round of 16 — 16 clubs.</> : <>🟢 os <b>2 primeiros</b> de cada grupo vão pras oitavas — 16 clubes.</>}</p>
      {privateVisual && <details className="ll26-bracket-history"><summary>{LB('ESTATÍSTICAS DA LIBERTADORES', 'LIBERTADORES STATS')}</summary>{revealed || lb.rodada === 0 ? <TopAssistsBox highlight={you.id} competition="liberta" showEmpty /> : <p className="text-xs mt-3">{LB('As estatísticas atualizam após o apito final.', 'Stats update after the final whistle.')}</p>}</details>}

      {manual && <SpeedControls speed={state.simSpeed ?? 1} onSet={v => dispatch({ type: 'SET_SIM_SPEED', speed: v })} />}
      {(!online || streamHost) && !acabou && (
        <SimControls manual={manual} onToggle={toggleManual} canNext={lb.rodada === 0 || revealed}
          lock={manualLocked ? <QuickManualLock /> : undefined}
          onNext={() => dispatch({ type: 'PLAY_LIBERTA_RODADA' })}
          onSkip={() => dispatch({ type: 'PLAY_LIBERTA_RODADA' })}
          nextLabel={!(lb.rodada === 0 || revealed) ? LB('⏳ Deixa a rodada acabar…', '⏳ Let the round finish…') : lb.rodada === 0 ? LB('🌎 Começar a Libertadores', '🌎 Start the Libertadores') : LB('▶️ Próxima rodada', '▶️ Next round')} />
      )}
      {online && !state.isHost && !acabou && (
        <p className="text-center text-[11px] font-bold text-black/50" style={privateVisual ? {color:CREAM} : undefined}>{LB('⏳ O host puxa as rodadas — você acompanha ao vivo.', '⏳ The host runs the rounds — you follow live.')}</p>
      )}
      {privateVisual && online && state.roomId && !state.careerOnline && <LigaHub roomId={state.roomId} souDono={state.isHost} humanos={state.managers.filter(m=>m.isHuman).map(m=>m.teamName)} />}
    </Shell>
  )
}

// ─── carta de colecionador: a raridade (fama) define o visual inteiro ──
// as cores da CARTA batem com as faixas de nível da Cerimônia (tierBadge):
// 🟡 lenda=ouro · 🟠 craque=bronze · 🟢 bom jogador=verde · 🫒 foi profissional=bege.
// brilho (holo): ouro brilha forte, promessa brilha sutil, os demais são estáticos.
const FAME_TIER: Record<number, { label: string; grad: string; ink: string; tierColor: string; crestBg: string; crestInk: string; holo?: boolean; holoAlpha?: number }> = {
  5: { label: '👑 LENDA', grad: 'linear-gradient(150deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)', ink: '#0C0C0C', tierColor: '#7a4d00', crestBg: 'rgba(255,255,255,.42)', crestInk: '#7a4d00', holo: true, holoAlpha: .85 },
  4: { label: '⭐ CRAQUE', grad: 'linear-gradient(150deg,#F4F7FB,#CBD4DE 45%,#9BA7B5 78%,#EAEFF4)', ink: '#0C0C0C', tierColor: '#44546a', crestBg: 'rgba(255,255,255,.5)', crestInk: '#44546a', holo: true, holoAlpha: .72 },
  3: { label: '🎯 BOM JOGADOR', grad: 'linear-gradient(150deg,#41C07A,#2E9E5B 55%,#1E7A45)', ink: '#fff', tierColor: 'rgba(255,255,255,.92)', crestBg: 'rgba(255,255,255,.35)', crestInk: '#14532d' },
  2: { label: '🎯 BOM JOGADOR', grad: 'linear-gradient(150deg,#41C07A,#2E9E5B 55%,#1E7A45)', ink: '#fff', tierColor: 'rgba(255,255,255,.92)', crestBg: 'rgba(255,255,255,.35)', crestInk: '#14532d' },
  1: { label: '🪵 FOI PROFISSIONAL', grad: 'linear-gradient(150deg,#DBD1B5,#CBBF9E 60%,#B2A583)', ink: '#0C0C0C', tierColor: '#655c43', crestBg: 'rgba(255,255,255,.5)', crestInk: '#655c43' },
}
// 5º tier: promessas (foi promessa aqui, virou estrela na Europa) — roxo, brilho sutil
const PROMESSA_TIER = { label: '💎 PROMESSA', grad: 'linear-gradient(150deg,#C9A9FF,#8B5CF6 52%,#5B2FB0)', ink: '#fff', tierColor: 'rgba(255,255,255,.9)', crestBg: 'rgba(255,255,255,.5)', crestInk: '#3d1f7a', holo: true, holoAlpha: .38 } as const
// cor do badge de nível POR TIER (ouro só pra lenda; craque num bronze/dourado
// escuro — "quase ouro", um degrau abaixo da lenda)
function tierBadge(c: { fame: number; promessa?: boolean }): { bg: string; ink: string } {
  if (c.promessa) return { bg: '#7C57D6', ink: '#fff' }   // 💎 promessa
  if (c.fame === 5) return { bg: GOLD, ink: INK }          // 👑 lenda (ouro)
  if (c.fame === 4) return { bg: '#C3CCD8', ink: INK }     // ⭐ craque (prata)
  if (c.fame === 1) return { bg: '#CBBF9E', ink: INK }     // 🍺 foi profissional
  return { bg: '#2E9E5B', ink: '#fff' }                    // 🎯 bom jogador
}
// texto garantido pra QUALQUER carta: se o jogador ainda não tem uma bio
// específica, mostra uma frase por categoria + posição — assim nenhuma
// carta-lembrança fica sem nada escrito.
function fallbackBio(fame: number, pos: string): string {
  const p: Record<string, string> = { GOL: 'do gol', LAT: 'da lateral', ZAG: 'da zaga', MEI: 'do meio-campo', ATA: 'do ataque' }
  const where = p[pos] ?? 'do futebol brasileiro'
  switch (fame) {
    case 5: return `Lenda ${where} — nome eterno do futebol brasileiro.`
    case 4: return `Craque ${where}: brilhou de verdade e marcou época.`
    case 3: return `Bom jogador ${where}, de confiança e regularidade.`
    case 2: return `Bom jogador ${where} que tinha seus dias de brilho.`
    default: return `Foi profissional ${where} — do nosso futebol raiz.`
  }
}
export function CollectibleCard({ name, club, year, pos, fame, big = false, bio, folk = false, promessa, showBio = false }: { name: string; club: string; year: number; pos: string; fame: number; big?: boolean; bio?: string; folk?: boolean; promessa?: boolean; showBio?: boolean }) {
  const avatarPreview = useLegendPresentation() && ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA'].includes(pos) && !!avatarLote1(name, club, year)
  const isProm = ehPromessa({ name, club, year, promessa }) // 💎 pela CARTA, nunca só pelo nome
  const t = isProm ? PROMESSA_TIER : (FAME_TIER[fame] ?? FAME_TIER[1])
  const initial = name.trim()[0]?.toUpperCase() ?? '?'
  const foto = fotoDoJogador(name)
  const text = bio ?? BIOS[name] ?? (isProm ? `Promessa ${({ GOL: 'do gol', LAT: 'da lateral', ZAG: 'da zaga', MEI: 'do meio-campo', ATA: 'do ataque' } as Record<string, string>)[pos] ?? 'do futebol'} — brilhou aqui jovem e virou estrela.` : fallbackBio(fame, pos))
  return (
    <div className="relative overflow-hidden border-[3px] border-black rounded-2xl flex flex-col justify-between"
      style={{ background: t.grad, aspectRatio: '3 / 4.2', boxShadow: `5px 6px 0 0 ${INK}`, padding: big ? 16 : 11 }}>
      {t.holo && (
        <motion.div className="absolute inset-0 pointer-events-none"
          style={{ background: `linear-gradient(115deg, transparent 30%, rgba(255,255,255,${(t as { holoAlpha?: number }).holoAlpha ?? .6}) 48%, transparent 62%)`, backgroundSize: '250% 250%' }}
          animate={{ backgroundPosition: ['180% 180%', '-80% -80%'] }}
          transition={{ duration: !isProm && fame === 5 ? 2.2 : !isProm && fame === 4 ? 2.8 : 3.6, repeat: Infinity, ease: 'linear' }} />
      )}
      <div className="relative flex justify-between items-start gap-1">
        <span className="font-black rounded-lg" style={{ ...OSWALD, background: INK, color: '#fff', border: '2px solid rgba(255,255,255,.25)', fontSize: big ? 13 : 11, padding: '2px 7px' }}>{posTag(pos)}</span>
        <div className="flex flex-col items-end gap-1">
          <span className="font-black tracking-wide text-right" style={{ ...OSWALD, color: t.tierColor, fontSize: big ? 11 : 9 }}>{t.label}</span>
          {folk && (
            <span className="font-black rounded-full" style={{ ...OSWALD, background: 'rgba(0,0,0,.28)', color: '#fff', fontSize: big ? 10 : 8, padding: big ? '2px 8px' : '1px 6px', letterSpacing: .5 }}>🃏 FOLCLÓRICO</span>
          )}
        </div>
      </div>
      {/* 📸 o retrato. Jogador COM foto mostra a foto; SEM foto fica a letra do
          nome, exatamente como sempre foi. Como quase todo mundo ainda não tem,
          o normal é cair na letra — e a carta não muda em nada. Ver
          `rostos.ts`: o Diego vai fazendo os rostos aos poucos. */}
      {avatarPreview ? <div className="ll-lote1-card-avatar"><AvatarLote1 name={name} club={club} year={year}/></div> : <div className="relative self-center rounded-full flex items-center justify-center overflow-hidden"
        style={{ width: big ? 100 : 66, height: big ? 100 : 66, background: t.crestBg, color: t.crestInk, border: '3px solid rgba(0,0,0,.28)', ...OSWALD, fontWeight: 900, fontSize: big ? 42 : 27, boxShadow: t.holo ? 'inset 0 0 14px rgba(255,255,255,.7)' : 'none' }}>
        {foto
          ? <img src={foto} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block' }} />
          : initial}
      </div>}
      <div className="relative">
        <p className="font-black truncate" style={{ ...OSWALD, color: t.ink, fontSize: big ? 26 : 17, lineHeight: 1.2, paddingBottom: 2 }}>{name}</p>
        <p className="font-extrabold" style={{ color: t.ink, opacity: .62, fontSize: big ? 12 : 10 }}>{club} · {year}</p>
        <p style={{ fontSize: big ? 13 : 11, letterSpacing: 1, marginTop: 3 }}>{isProm ? '💎💎💎' : '⭐'.repeat(fame)}</p>
        {(big || showBio) && text && (
          <p className="font-semibold italic" style={{ color: t.ink, opacity: .78, fontSize: big ? 12 : 9.5, lineHeight: 1.28, marginTop: big ? 8 : 5, display: '-webkit-box', WebkitLineClamp: big ? 5 : 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>“{text}”</p>
        )}
      </div>
    </div>
  )
}

// 📤 compartilhar a CARTA como imagem: replica o visual do CollectibleCard em
// canvas (gradiente do tier, brilho, selo, bio) + rodapé da marca.
async function shareCardImage(c: { name: string; club: string; year: number; pos: string; fame: number; folk?: boolean; promessa?: boolean; bio?: string }) {
  const W = 900, CH = 1260, FOOT = 96, H = CH + FOOT
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H
  const x = cv.getContext('2d'); if (!x) return
  try { await document.fonts.load('900 60px Oswald') } catch { /* segue */ }
  const OSW = 'Oswald, sans-serif'
  const isProm = ehPromessa(c) // 💎 pela CARTA, nunca só pelo nome
  const grads: Record<string, [string, string, string]> = {
    prom: ['#C9A9FF', '#8B5CF6', '#5B2FB0'], f5: ['#FFE79A', '#FFC400', '#E8A200'],
    f4: ['#F4F7FB', '#CBD4DE', '#9BA7B5'], f3: ['#41C07A', '#2E9E5B', '#1E7A45'],
    f1: ['#DBD1B5', '#CBBF9E', '#B2A583'],
  }
  const key = isProm ? 'prom' : c.fame >= 5 ? 'f5' : c.fame === 4 ? 'f4' : c.fame >= 2 ? 'f3' : 'f1'
  const [g1, g2, g3] = grads[key]
  const dark = key === 'prom' || key === 'f3'
  const inkC = dark ? '#ffffff' : '#0C0C0C'
  const tierLabel = isProm ? '💎 PROMESSA' : c.fame >= 5 ? '👑 LENDA' : c.fame === 4 ? '⭐ CRAQUE' : c.fame >= 2 ? '🎯 BOM JOGADOR' : '🪵 FOI PROFISSIONAL'
  // fundo creme + carta
  x.fillStyle = '#F4ECD6'; x.fillRect(0, 0, W, H)
  const M = 46, cw = W - M * 2, ch = CH - M * 2
  const gr = x.createLinearGradient(M, M, M + cw, M + ch)
  gr.addColorStop(0, g1); gr.addColorStop(0.5, g2); gr.addColorStop(1, g3)
  const rrp = (px: number, py: number, w: number, h: number, r: number) => {
    x.beginPath(); x.moveTo(px + r, py); x.arcTo(px + w, py, px + w, py + h, r); x.arcTo(px + w, py + h, px, py + h, r); x.arcTo(px, py + h, px, py, r); x.arcTo(px, py, px + w, py, r); x.closePath()
  }
  rrp(M, M, cw, ch, 44); x.fillStyle = gr; x.fill()
  x.lineWidth = 10; x.strokeStyle = '#0C0C0C'; rrp(M, M, cw, ch, 44); x.stroke()
  // brilho diagonal (holo)
  if (key === 'f5' || key === 'f4' || key === 'prom') {
    x.save(); rrp(M, M, cw, ch, 44); x.clip()
    const hg = x.createLinearGradient(M, M + ch, M + cw, M)
    hg.addColorStop(0.35, 'rgba(255,255,255,0)'); hg.addColorStop(0.5, `rgba(255,255,255,${key === 'f5' ? 0.55 : 0.35})`); hg.addColorStop(0.65, 'rgba(255,255,255,0)')
    x.fillStyle = hg; x.fillRect(M, M, cw, ch); x.restore()
  }
  // pos chip + tier
  x.fillStyle = '#0C0C0C'; rrp(M + 34, M + 34, 108, 62, 16); x.fill()
  x.fillStyle = '#fff'; x.font = `900 38px ${OSW}`; x.textAlign = 'center'; x.fillText(c.pos, M + 88, M + 78)
  x.textAlign = 'right'; x.font = `900 34px ${OSW}`; x.fillStyle = dark ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.62)'
  x.fillText(tierLabel, M + cw - 36, M + 76)
  if (c.folk) {
    x.font = `900 27px ${OSW}`
    const fw = x.measureText('🃏 FOLCLÓRICO').width + 40
    x.fillStyle = 'rgba(0,0,0,0.30)'; rrp(M + cw - 36 - fw, M + 96, fw, 46, 23); x.fill()
    x.fillStyle = '#fff'; x.fillText('🃏 FOLCLÓRICO', M + cw - 56, M + 129)
  }
  // brasão (inicial)
  x.textAlign = 'center'
  x.beginPath(); x.arc(W / 2, M + ch * 0.40, 130, 0, Math.PI * 2)
  x.fillStyle = dark ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.5)'; x.fill()
  x.lineWidth = 8; x.strokeStyle = 'rgba(0,0,0,0.28)'; x.stroke()
  x.fillStyle = dark ? '#2b1a4d' : 'rgba(0,0,0,0.55)'; x.font = `900 118px ${OSW}`
  x.fillText((c.name.trim()[0] || '?').toUpperCase(), W / 2, M + ch * 0.40 + 42)
  // nome / clube / estrelas / bio
  let fs = 64; x.font = `900 ${fs}px ${OSW}`
  while (x.measureText(c.name).width > cw - 80 && fs > 30) { fs -= 3; x.font = `900 ${fs}px ${OSW}` }
  x.fillStyle = inkC; x.fillText(c.name, W / 2, M + ch * 0.66)
  x.font = `800 32px Arial`; x.fillStyle = dark ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.62)'
  x.fillText(`${c.club} · ${c.year}`, W / 2, M + ch * 0.66 + 48)
  x.font = `700 36px Arial`
  x.fillText(isProm ? '💎💎💎' : '⭐'.repeat(Math.max(1, c.fame)), W / 2, M + ch * 0.66 + 104)
  // 📝 BIO: a carta compartilhada leva a bio REAL do jogador (a escrita na carta ou a
  // do catálogo por nome, BIOS[nome]). Se o jogador NÃO tem bio, fica vazio mesmo —
  // nada de texto genérico inventado (pedido do Diego).
  const bioText = c.bio ?? BIOS[c.name]
  if (bioText) {
    x.font = `italic 700 28px Georgia`; x.fillStyle = dark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.72)'
    const words = ('“' + bioText + '”').split(' '); const lines: string[] = []; let ln = ''
    for (const w2 of words) { const t = ln ? ln + ' ' + w2 : w2; if (x.measureText(t).width > cw - 130 && ln) { lines.push(ln); ln = w2 } else ln = t }
    if (ln) lines.push(ln)
    lines.slice(0, 4).forEach((l, i) => x.fillText(l, W / 2, M + ch * 0.66 + 168 + i * 38))
  }
  // rodapé da marca
  x.fillStyle = '#0C0C0C'; x.fillRect(0, CH, W, FOOT)
  x.fillStyle = '#F5B301'; x.font = `900 30px ${OSW}`
  x.fillText('🎁 tirei no Pacote do Campeão · leilaolegends.com 🔨', W / 2, CH + 60)
  const blob: Blob | null = await new Promise(res => cv.toBlob(b => res(b), 'image/png'))
  const txt = `Tirei ${c.name} (${c.club} · ${c.year}) no pacote do campeão do Leilão Legends! 🎁 Joga tu também: https://leilaolegends.com`
  if (blob) {
    const file = new File([blob], 'minha-carta.png', { type: 'image/png' })
    const sd = { files: [file], title: 'Minha carta — Leilão Legends', text: txt }
    if (navigator.canShare?.(sd)) { try { await navigator.share(sd) } catch { /* cancelou */ } return }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'minha-carta.png'; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 4000)
    return
  }
  try { if (navigator.share) await navigator.share({ text: txt }) } catch { /* cancelou */ }
}

// ─── prêmio de campeão: escolhe 1 carta do seu time pro álbum ─────────
// 🗑️ o CARD_PICK_SECONDS = 45 morreu aqui em 27/08: era o relógio que abria o
// pacote sozinho. O Diego mandou tirar em TODO modo — o pacote agora espera o
// toque, e a carta é gravada antes disso de qualquer jeito.
// mapa nome → selos (folk/promessa) do catálogo, pra pintar as cartas do álbum
// certas mesmo quando só guardamos o nome (cartas online antigas).
// meta ATUAL do catálogo por nome. Espalhado por último nas cartas do álbum,
// sobrescreve o que foi salvo na coleta — assim nível/clube/ano acompanham as
// atualizações do catálogo (ex.: Lúcio deixou de ser lenda; Diego é do Santos).
const CARD_META = new Map<string, { fame: number; club: string; year: number; folk?: boolean; promessa?: boolean }>()
// europeus primeiro; o brasileiro entra por último e VENCE em nomes iguais
// (ex.: Kaká/Cafu existem nos dois — a coleta comum é no baralho brasileiro).
Object.values(CATALOG_EU).flat().forEach(c => CARD_META.set(c.name, { fame: c.fame, club: c.club, year: c.year, folk: c.folk, promessa: c.promessa }))
Object.values(CATALOG).flat().forEach(c => CARD_META.set(c.name, { fame: c.fame, club: c.club, year: c.year, folk: c.folk, promessa: c.promessa }))

// pool de TODAS as cartas reais (BR + Europa) — usado como "curinga" quando o
// campeão já tem todos os 11 do próprio time no álbum (aí ganha uma NOVA daqui).
const ALL_POOL: WonCard[] = (() => {
  const seen = new Set<string>(); const out: WonCard[] = []
  for (const cat of [CATALOG, CATALOG_EU]) for (const pos of SECTORS) for (const c of cat[pos]) {
    if (seen.has(c.name)) continue; seen.add(c.name)
    out.push({ id: `wild-${out.length}`, name: c.name, club: c.club, year: c.year, pos, fame: c.fame as Card['fame'], folk: c.folk, promessa: c.promessa, lo: 0, hi: 0, paid: 0, via: 'leilao' })
  }
  return out
})()

export function CardCollectPrompt({ seasonKey, origin = 'online', onClaimed, onGuaranteed, onStatus, saveCards }: { you?: Manager; seasonKey: string; origin?: 'cpu' | 'online'; onClaimed?: (card: WonCard) => void; onGuaranteed?: (card: WonCard) => void; onStatus?: (s: 'checking' | 'noauth' | 'picking' | 'revealed') => void; saveCards?: { name: string; club: string; year: number }[] }) {
  // 'noauth' = campeão sem conta: cartas são só pra quem tem cadastro
  const [status, setStatus] = useState<'checking' | 'noauth' | 'picking' | 'revealed'>('checking')
  // avisa quem renderiza (EscEnd) o status da carta — pra travar a votação online
  // enquanto o campeão ainda não abriu o pacote (Jeito 1: ninguém perde carta).
  useEffect(() => { onStatus?.(status) }, [status]) // eslint-disable-line react-hooks/exhaustive-deps
  const [claimed, setClaimed] = useState<WonCard | null>(null)
  const [owned, setOwned] = useState<Set<string>>(new Set()) // cartas que o usuário JÁ tem no álbum (por nome)
  const [authOpen, setAuthOpen] = useState(false) // cadastro rápido INLINE, sem sair da tela de campeão
  const [reload, setReload] = useState(0)          // re-checa o login após criar conta → cai no pega-carta real
  const [pendingPick, setPendingPick] = useState<WonCard | null>(null) // carta já sorteada e GRAVADA, esperando a cerimônia de abrir
  const [dismissed, setDismissed] = useState(false) // fechou o popup "na cara" → vira pílula pra reabrir (a carta já conta)
  const savedRef = useRef(false) // idempotência: grava a carta UMA vez por montagem
  const userIdRef = useRef<string | null>(null) // conta já resolvida — persist() reusa, sem bater na rede de novo

  useEffect(() => {
    ;(async () => {
      // 🔒 getSession() (LOCAL, sem rede) em vez de getUser() (bate no servidor):
      // um campeão JÁ logado não pode cair em "sem conta" por causa de uma rede
      // instável naquele instante — isso apagava a carta de gente com conta real.
      // Ainda assim tenta de novo algumas vezes antes de desistir (raríssimo, mas
      // protege de um hiccup do próprio SDK logo depois de a aba voltar do fundo).
      let uid: string | null = null
      for (let tent = 0; tent < 3 && !uid; tent++) {
        if (tent > 0) await new Promise(r => setTimeout(r, 700))
        const { data: { session } } = await supabase.auth.getSession()
        uid = session?.user?.id ?? null
      }
      if (!uid) { setStatus('noauth'); return } // sem cadastro (de verdade) não ganha carta
      userIdRef.current = uid
      // o que o usuário já tem no álbum — pra não oferecer repetida
      const { data: ownedRows } = await supabase.from('user_cards').select('card_name').eq('user_id', uid)
      setOwned(new Set((ownedRows ?? []).map((r: { card_name: string }) => r.card_name)))
      const { data } = await supabase.from('user_cards').select('*').eq('user_id', uid).eq('season_key', seasonKey).maybeSingle()
      if (data) {
        const cc = { id: 'x', name: data.card_name, club: data.card_club, year: data.card_year, pos: data.card_pos, fame: data.card_fame, ...(CARD_META.get(data.card_name) ?? {}), lo: 0, hi: 0, paid: 0, via: 'leilao' } as WonCard
        setClaimed(cc); onClaimed?.(cc); onGuaranteed?.(cc)
        setStatus('revealed')
      } else {
        setStatus('picking')
      }
    })()
  }, [seasonKey, reload])

  // 👆 SEM CRONÔMETRO (Diego 27/08, valendo em TODO modo): *"de aparece a carta
  // num banner na tela que dá até pro cara sair, e se ele sair aí conta
  // automático"*. O pacote FICA lacrado até alguém tocar. O relógio que existia
  // aqui só servia pra abrir sozinho — e abrir sozinho era exatamente o que ele
  // não queria ("não tem graça aparecer automático sem o cara ver").
  // A carta não corre risco nenhum: ela é sorteada e gravada logo abaixo, assim
  // que a tela monta, antes de qualquer toque.

  // 🎁 PACOTE SURPRESA: a carta agora é SORTEADA entre TODAS as cartas do jogo
  // (baralho BR + Europa), sempre uma que o campeão ainda NÃO tem (só repetiria
  // se já tivesse o catálogo inteiro). Trocamos o "escolher" pela emoção de abrir.
  const packPool = useMemo(() => {
    // MODO CARREIRA: a unicidade do pacote é do SAVE (agência), não do álbum geral.
    // Assim uma carta que você já tem no álbum de rua mas ainda NÃO neste save
    // entra normalmente no save (conta pra agência) — não gera carta substituta e,
    // por já existir, não infla o álbum geral (o álbum deduplica por nome|clube|ano).
    // Só evita repetir o que já está NESTE save: aí sim sorteia outra que falta no save.
    if (saveCards) {
      const saveSet = new Set(saveCards.map(c => `${c.name}|${c.club}|${c.year}`))
      const un = ALL_POOL.filter(c => !saveSet.has(`${c.name}|${c.club}|${c.year}`))
      return un.length ? un : ALL_POOL
    }
    const un = ALL_POOL.filter(c => !owned.has(c.name))
    return un.length ? un : ALL_POOL
  }, [owned, saveCards])
  const [opening, setOpening] = useState(false)
  // 🔒 grava a carta na conta (álbum) — RESILIENTE: se o backend cair, guarda no
  // aparelho e re-tenta ao reabrir. NÃO revela: só garante que a carta É do campeão.
  async function persist(card: WonCard) {
    // reusa a conta já resolvida no check inicial — SEM bater na rede de novo
    // (era um 2º getUser() aqui, e se ESSE falhasse por instabilidade a carta
    // sumia mesmo com o campeão logado; getSession() abaixo é só um fallback raro).
    let uid = userIdRef.current
    if (!uid) { const { data: { session } } = await supabase.auth.getSession(); uid = session?.user?.id ?? null }
    if (!uid) { setStatus('noauth'); return }
    // season_key INTEIRA: a coluna é `text` (sem limite). Cortar em 48 quebrava a
    // dedup (a leitura usa a chave inteira) e colava temporadas na mesma chave.
    const key = seasonKey
    await resilientWrite({ table: 'user_cards', row: {
      user_id: uid, season_key: key, origin,
      card_name: card.name, card_club: card.club, card_year: card.year, card_pos: card.pos, card_fame: card.fame,
    } })
  }
  // 🔒 GARANTIA "conta mesmo sem abrir": assim que o campeão cai na tela (status
  // 'picking'), a carta é sorteada e GRAVADA na conta NA HORA — antes de qualquer
  // toque. Se a pessoa sair, fechar ou nunca abrir o pacote, a carta JÁ ESTÁ no
  // álbum. Abrir o pacote vira só a cerimônia de ver qual foi. Idempotente: o
  // season_key é único por temporada, e ao reabrir o check de cima acha e revela.
  // 🕴️ onGuaranteed dispara JUNTO (mesmo instante, sem depender de abrir o pacote
  // nem de esperar o timer) — quem consome isso (ex.: Agência) nunca é spoiler
  // pra ninguém (é só o PRÓPRIO campeão vendo o próprio prêmio), então não
  // precisa esperar a cerimônia como o onClaimed espera pros outros da sala.
  useEffect(() => {
    if (status !== 'picking' || savedRef.current || !packPool.length) return
    const pick = packPool[Math.floor(Math.random() * packPool.length)]
    if (!pick) return
    savedRef.current = true
    setPendingPick(pick)
    void persist(pick)
    onGuaranteed?.(pick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, packPool])

  const openPack = () => {
    if (opening) return
    const card = pendingPick ?? packPool[Math.floor(Math.random() * packPool.length)]
    if (!card) return
    if (!savedRef.current) { savedRef.current = true; void persist(card) } // rede de segurança
    setOpening(true)
    // pacote balança/estoura e revela a carta JÁ garantida (não sorteia de novo)
    setTimeout(() => { setClaimed(card); onClaimed?.(card); setStatus('revealed') }, 950)
  }


  if (status === 'checking') return null

  let content: React.ReactNode = null
  if (status === 'noauth') {
    content = (
      <Box bg={GOLD} className={`p-5 text-center ${origin === 'online' ? 'online-reward' : ''}`} shadow={6}>
        <p className="font-black text-2xl" style={OSWALD}>🎁 Você foi campeão!</p>
        <p className="text-sm font-bold text-black/75 mt-1 mb-3">Todo campeão abre um <b>PACOTE SURPRESA</b> e leva uma carta colecionável pro álbum — tipo essa 👇</p>
        <motion.div initial={{ rotateY: 90, opacity: 0, scale: 0.9 }} animate={{ rotateY: 0, opacity: 1, scale: 1 }} transition={{ duration: 0.7, type: 'spring', bounce: 0.35 }}
          className="mx-auto mb-3" style={{ maxWidth: 220 }}>
          <CollectibleCard name="Pelé" club="Santos" year={1962} pos="ATA" fame={5} big />
        </motion.div>
        <p className="text-xs font-bold text-black/65 mb-3">☝️ Exemplo. A sua é <b>sorteada entre TODAS as cartas do jogo</b> — pode vir uma lenda dourada dessas! Mas <b>só quem tem conta guarda a carta</b>.</p>
        <Btn onClick={() => setAuthOpen(true)} bg={GREEN} className="w-full text-lg"><span className="text-white">Criar conta grátis e abrir o pacote 🎁</span></Btn>
        <p className="text-[11px] font-bold text-black/55 mt-2">Cadastro rápido: só e-mail e senha. Vale no CPU e no online.</p>
        {authOpen && <CareerAuthModal onClose={() => setAuthOpen(false)} onDone={() => {
          // logou sem sair da tela: re-checa → cai no pega-carta REAL do time campeão
          setAuthOpen(false); setStatus('checking'); setReload(r => r + 1)
        }} />}
      </Box>
    )
  } else if (status === 'revealed' && claimed) {
    content = (
      <Box bg={CREAM} className={`p-5 text-center ${origin === 'online' ? 'online-reward' : ''}`} shadow={6}>
        <p className="text-xs font-black uppercase text-black/60 mb-3">🎁 Saiu do pacote — foi pro seu álbum!</p>
        <motion.div initial={{ rotateY: 90, opacity: 0, scale: 0.9 }} animate={{ rotateY: 0, opacity: 1, scale: 1 }} transition={{ duration: 0.7, type: 'spring', bounce: 0.35 }}
          className="mx-auto" style={{ maxWidth: 285 }}>
          <CollectibleCard name={claimed.name} club={claimed.club} year={claimed.year} pos={claimed.pos} fame={claimed.fame} bio={claimed.bio} folk={claimed.folk} promessa={claimed.promessa} big />
        </motion.div>
        <button onClick={() => shareCardImage(claimed)} className="text-xs font-black underline text-black/55 mt-3">📤 compartilhar carta</button>
        <p className="text-[11px] font-bold text-black/50 mt-2">📖 Veja o álbum completo no menu inicial.</p>
      </Box>
    )
  } else {
  // 🎁 o PACOTE LACRADO: flutua brilhando; ao tocar balança, o lacre estoura,
  // um clarão toma a tela e a carta é revelada (o componente real do álbum).
  content = (
    <Box bg={GOLD} className={`p-4 text-center ${origin === 'online' ? 'online-reward' : ''}`} shadow={6}>
      <style>{'@keyframes escPackSheen{0%{background-position:0% 0%}100%{background-position:100% 100%}}'}</style>
      <p className="font-black text-lg mb-1" style={OSWALD}>🎁 Pacote do campeão!</p>
      <p className="text-xs font-bold text-black/70 mb-3">Campeão leva uma carta <b>surpresa</b> pro álbum — sorteada entre <b>todas as cartas do jogo</b> (sempre uma que você ainda não tem). Toque no pacote pra abrir.</p>
      {/* o pacote espera. A carta JÁ é sua — o aviso existe pra ninguém achar que
          vai perder alguma coisa se fechar a tela. */}
      <p className="text-[11px] font-bold text-black/55 mb-3">Sem pressa: <b>a carta já é sua</b>. Tocar fora fecha o pacote e ela continua no álbum.</p>
      <motion.button onClick={openPack} disabled={opening}
        aria-label="Abrir pacote do campeão"
        className={`relative mx-auto block ${origin === 'online' ? 'online-pack-button' : ''}`} style={{ width: 168, height: 230, background: 'transparent', border: 'none', padding: 0, cursor: opening ? 'default' : 'pointer' }}
        animate={opening
          ? { rotate: [0, -8, 8, -7, 7, -5, 5, 0], scale: [1, 1.04, 1.08, 1.12], transition: { duration: 0.75 } }
          : { y: [0, -9, 0], rotate: [-1.5, 1.5, -1.5], transition: { duration: 2.6, repeat: Infinity, ease: 'easeInOut' } }}>
        <div style={{ position: 'absolute', inset: 0, border: `4px solid ${INK}`, borderRadius: 16, overflow: 'hidden',
          background: 'linear-gradient(150deg, #125e2f 0%, #2ea457 35%, #FFC400 50%, #2ea457 65%, #125e2f 100%)',
          backgroundSize: '220% 220%', animation: 'escPackSheen 2.8s linear infinite',
          boxShadow: `0 12px 26px rgba(0,0,0,.35), inset 0 0 24px rgba(255,255,255,.18)` }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, color: '#fff' }}>
          <span style={{ fontSize: 46, filter: 'drop-shadow(2px 3px 0 rgba(0,0,0,.4))' }}>🔨</span>
          <span style={{ ...OSWALD, fontWeight: 900, fontSize: 16, lineHeight: 1, textShadow: '2px 2px 0 rgba(0,0,0,.45)' }}>LEILÃO<br />LEGENDS</span>
          <span style={{ ...OSWALD, fontWeight: 800, fontSize: 9, letterSpacing: 2.5, color: GOLD, textShadow: '1px 1px 0 rgba(0,0,0,.5)' }}>PACOTE DO CAMPEÃO</span>
        </div>
        {origin === 'online' && <img className="online-pack-image" src={onlinePackArt} alt="" />}
        <motion.span animate={opening ? { y: -34, rotate: 22, opacity: 0 } : {}} transition={{ duration: 0.35, delay: 0.3 }}
          style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: GOLD, border: `3px solid ${INK}`, borderRadius: 999, padding: '3px 13px', fontSize: 10.5, fontWeight: 900, letterSpacing: 1, ...OSWALD }}>LACRADO</motion.span>
      </motion.button>
      {!opening && <p className="text-[11px] font-black text-black/60 mt-3" style={OSWALD}>👆 TOCA PRA ABRIR</p>}
      {opening && (
        <motion.div className="fixed inset-0 pointer-events-none" style={{ background: '#fff', zIndex: 9999 }}
          initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.5, delay: 0.6 }} />
      )}
    </Box>
    )
  }

  // 🎁 NA CARA: o pacote/carta aparece num POPUP por cima da tela, na hora que
  // vira campeão. Dá pra tocar fora / no ✕ e seguir o jogo — a carta JÁ está
  // gravada na conta (não depende de abrir). Fechou = vira uma pílula pra reabrir.
  if (dismissed) {
    return (
      <button onClick={() => setDismissed(false)} className={`w-full rounded-xl border-[3px] border-black px-3 py-2.5 font-black text-sm flex items-center justify-center gap-2 ${origin === 'online' && status !== 'noauth' ? 'online-reward-reopen' : ''}`} style={{ ...OSWALD, background: GOLD, color: INK, boxShadow: `3px 3px 0 ${INK}` }}>
        {origin === 'online' && status !== 'noauth' ? <><img src={onlinePackArt} alt="" /><span><strong>Seu pacote do campeão</strong><small>Sua carta está no álbum.</small><span className="online-reopen-label">{status === 'revealed' ? 'Ver a carta do campeão' : 'Reabrir pacote'}</span></span></> : '🎁 Ver a carta do campeão'}
      </button>
    )
  }
  return createPortal(
    <div onClick={() => setDismissed(true)} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(8,6,3,.64)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto' }}>
      <motion.div initial={{ scale: 0.66, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.3, duration: 0.5 }}
        onClick={e => e.stopPropagation()} style={{ position: 'relative', width: '100%', maxWidth: 360, margin: 'auto' }}>
        <button onClick={() => setDismissed(true)} aria-label="Fechar" style={{ position: 'absolute', top: -14, right: -8, zIndex: 2, width: 34, height: 34, borderRadius: 999, border: `3px solid ${INK}`, background: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer', boxShadow: `2px 2px 0 ${INK}`, ...OSWALD }}>✕</button>
        {content}
      </motion.div>
    </div>,
    document.body
  )
}

// 🎥 STREAM · pacote do campeão pra QUEM NÃO É o campeão (a sala assistindo).
// Mostra o MESMO pacote e revela a MESMA carta que o campeão tirou (vem do
// estado, sincronizada pra todos). Qualquer um pode tocar pra abrir, mas é só
// pra ver: não grava nada no álbum. Se a carta ainda não chegou (campeão não
// abriu), o lacre fica "esperando" e revela sozinho quando ela cair no estado.
function StreamSpectatorCard({ champName, card }: { champName: string; card?: WonCard | null }) {
  const [opened, setOpened] = useState(false)
  const [opening, setOpening] = useState(false)
  const reveal = opened && !!card
  const openPack = () => {
    if (opening || opened) return
    setOpening(true)
    setTimeout(() => { setOpening(false); setOpened(true) }, 950)
  }

  if (reveal && card) {
    return (
      <Box bg={CREAM} className="online-reward p-5 text-center" shadow={6}>
        <p className="text-xs font-black uppercase text-black/60 mb-0.5">🎁 Carta do campeão · {champName}</p>
        <p className="text-[11px] font-bold text-black/45 mb-3">👀 Você está assistindo — essa carta é do campeão (não vai pro seu álbum).</p>
        <motion.div initial={{ rotateY: 90, opacity: 0, scale: 0.9 }} animate={{ rotateY: 0, opacity: 1, scale: 1 }} transition={{ duration: 0.7, type: 'spring', bounce: 0.35 }}
          className="mx-auto" style={{ maxWidth: 285 }}>
          <CollectibleCard name={card.name} club={card.club} year={card.year} pos={card.pos} fame={card.fame} bio={card.bio} folk={card.folk} promessa={card.promessa} big />
        </motion.div>
      </Box>
    )
  }

  return (
    <Box bg={GOLD} className="online-reward p-4 text-center" shadow={6}>
      <style>{'@keyframes escPackSheen{0%{background-position:0% 0%}100%{background-position:100% 100%}}'}</style>
      <p className="font-black text-lg mb-1" style={OSWALD}>🎁 Pacote do campeão · {champName}</p>
      <p className="text-xs font-bold text-black/70 mb-3">A carta que o campeão tirou aparece aqui pra <b>todo mundo ver</b>. Toque no pacote pra abrir — é só pra assistir, não vai pro seu álbum.</p>
      <motion.button onClick={openPack} disabled={opening}
        aria-label="Ver pacote do campeão"
        className="online-pack-button relative mx-auto block" style={{ width: 168, height: 230, background: 'transparent', border: 'none', padding: 0, cursor: opening || opened ? 'default' : 'pointer' }}
        animate={opening
          ? { rotate: [0, -8, 8, -7, 7, -5, 5, 0], scale: [1, 1.04, 1.08, 1.12], transition: { duration: 0.75 } }
          : { y: [0, -9, 0], rotate: [-1.5, 1.5, -1.5], transition: { duration: 2.6, repeat: Infinity, ease: 'easeInOut' } }}>
        <div style={{ position: 'absolute', inset: 0, border: `4px solid ${INK}`, borderRadius: 16, overflow: 'hidden',
          background: 'linear-gradient(150deg, #125e2f 0%, #2ea457 35%, #FFC400 50%, #2ea457 65%, #125e2f 100%)',
          backgroundSize: '220% 220%', animation: 'escPackSheen 2.8s linear infinite',
          boxShadow: `0 12px 26px rgba(0,0,0,.35), inset 0 0 24px rgba(255,255,255,.18)` }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, color: '#fff' }}>
          <span style={{ fontSize: 46, filter: 'drop-shadow(2px 3px 0 rgba(0,0,0,.4))' }}>🔨</span>
          <span style={{ ...OSWALD, fontWeight: 900, fontSize: 16, lineHeight: 1, textShadow: '2px 2px 0 rgba(0,0,0,.45)' }}>LEILÃO<br />LEGENDS</span>
          <span style={{ ...OSWALD, fontWeight: 800, fontSize: 9, letterSpacing: 2.5, color: GOLD, textShadow: '1px 1px 0 rgba(0,0,0,.5)' }}>PACOTE DO CAMPEÃO</span>
        </div>
        <img className="online-pack-image" src={onlinePackArt} alt="" />
        <motion.span animate={opening ? { y: -34, rotate: 22, opacity: 0 } : {}} transition={{ duration: 0.35, delay: 0.3 }}
          style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: GOLD, border: `3px solid ${INK}`, borderRadius: 999, padding: '3px 13px', fontSize: 10.5, fontWeight: 900, letterSpacing: 1, ...OSWALD }}>LACRADO</motion.span>
      </motion.button>
      {!opening && !opened && <p className="text-[11px] font-black text-black/60 mt-3" style={OSWALD}>👆 TOCA PRA ABRIR</p>}
      {opened && !card && <p className="text-[11px] font-black text-black/60 mt-3" style={OSWALD}>⏳ Esperando o campeão abrir o pacote…</p>}
      {opening && (
        <motion.div className="fixed inset-0 pointer-events-none" style={{ background: '#fff', zIndex: 9999 }}
          initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.5, delay: 0.6 }} />
      )}
    </Box>
  )
}

// ─── álbum: coleção de cartas ganhas sendo campeão, entre partidas ────
interface UserCardRow { card_name: string; card_club: string; card_year: number; card_pos: string; card_fame: number; origin: string | null; obtained_at: string; season_key?: string; taken_from_name?: string | null }
interface AlbumCard { name: string; club: string; year: number; pos: Sector; fame: number; folk?: boolean; promessa?: boolean; origin: 'cpu' | 'online'; at: number; sk?: string; tomadaDe?: string }
type AlbumFilter = 'all' | 'cpu' | 'online'

// 🗂️ organização do álbum: raridade (melhores primeiro), posição, clube ou
// ordem de coleção (recentes). Reutilizado no próprio álbum e no de outro técnico.
type AlbumSort = 'tier' | 'pos' | 'club' | 'recent'
const ALBUM_POS_ORD: Record<string, number> = { GOL: 0, LAT: 1, ZAG: 2, MEI: 3, ATA: 4 }
function sortAlbum(list: AlbumCard[], mode: AlbumSort): AlbumCard[] {
  const arr = [...list]
  if (mode === 'recent') return arr.sort((a, b) => (b.at ?? 0) - (a.at ?? 0))
  if (mode === 'pos') return arr.sort((a, b) => (ALBUM_POS_ORD[a.pos] ?? 9) - (ALBUM_POS_ORD[b.pos] ?? 9) || b.fame - a.fame || a.name.localeCompare(b.name))
  if (mode === 'club') return arr.sort((a, b) => a.club.localeCompare(b.club) || b.fame - a.fame || a.name.localeCompare(b.name))
  return arr.sort((a, b) => b.fame - a.fame || a.name.localeCompare(b.name)) // raridade (padrão): lenda → craque → … → foi profissional
}
const ALBUM_SORT_TABS: { id: AlbumSort; label: string }[] = [
  { id: 'tier', label: '🏆 Raridade' },
  { id: 'pos', label: '⚽ Posição' },
  { id: 'club', label: '🔥 Clube' },
  { id: 'recent', label: '🕐 Recentes' },
]
function AlbumSortBar({ value, onChange }: { value: AlbumSort; onChange: (s: AlbumSort) => void }) {
  return (
    <div className="flex border-2 border-black rounded-lg overflow-hidden">
      {ALBUM_SORT_TABS.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className="flex-1 py-1.5 font-black text-[10px] uppercase leading-tight" style={{ backgroundColor: value === t.id ? GOLD : '#fff', color: '#000', ...OSWALD }}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

// carta de EXEMPLO — aparece só pra quem NÃO tem conta, pra mostrar como é a
// carta-lembrança e provocar o cadastro. Some assim que a pessoa loga (aí entram
// só as reais). É de mentirinha, não conta em lugar nenhum.
const EXAMPLE_CARD = { name: 'Rayan', club: 'Exemplo FC', year: 2025, pos: 'ATA', fame: 3, bio: 'Oi, boa noite! 👋 Sou só um exemplo pra você ver como é a carta. Faça seu cadastro, seja campeão e colecione craques de verdade — no CPU e no online.' }
const EXAMPLE_BIO_EN = 'Hi, good evening! 👋 I\'m just an example so you can see what the card looks like. Sign up, become champion and collect real stars — vs CPU and online.'

// ⬅️ VOLTAR no canto de cima à esquerda (pedido do Diego 20/08: *"precisa que o
// botão de voltar fique no canto superior esquerdo também dessas páginas. Mais
// fácil de achar e claro"*). No Álbum e no Ranking o único jeito de sair era o
// botão lá no FIM da página — e o álbum tem centenas de cartas até chegar lá.
// O botão de baixo continua onde estava: quem termina de rolar acha ali também.
export function VoltarInicio() {
  const { dispatch } = useEsc()
  return (
    <button onClick={() => dispatch({ type: 'GO_LOBBY' })}
      className="flex items-center gap-1.5 border-[2.5px] border-black rounded-xl bg-white px-3 py-1.5 font-black text-[12.5px] active:translate-y-0.5"
      style={{ ...OSWALD, boxShadow: `2.5px 2.5px 0 0 ${INK}` }}>
      <span className="text-[15px] leading-none">🏠</span> {tr('Início', 'Home')}
    </button>
  )
}

export function EscAlbum() {
  const { dispatch } = useEsc()
  const [cards, setCards] = useState<AlbumCard[] | null>(null)
  const [anon, setAnon] = useState(false)
  const [down, setDown] = useState(false) // backend fora do ar — evita travar em "Carregando…"
  const [filter, setFilter] = useState<AlbumFilter>('all')
  const [sort, setSort] = useState<AlbumSort>('tier') // 🗂️ padrão: melhores primeiro

  useEffect(() => {
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setCards([]); setAnon(true); return }
        setAnon(false)
        const { data } = await supabase.from('user_cards').select('card_name, card_club, card_year, card_pos, card_fame, origin, obtained_at').eq('user_id', user.id).order('obtained_at', { ascending: false })
        setCards(((data ?? []) as UserCardRow[]).map(c => ({
          name: c.card_name, club: c.card_club, year: c.card_year, pos: c.card_pos as Sector, fame: c.card_fame,
          ...(CARD_META.get(c.card_name) ?? {}),
          origin: (c.origin === 'cpu' ? 'cpu' : 'online') as 'cpu' | 'online', // cartas antigas (origin nulo) contam como online
          at: new Date(c.obtained_at).getTime(),
        })))
      } catch {
        // backend fora (instabilidade Supabase): não deixa preso em "Carregando…"
        setDown(true); setCards([])
      }
    })()
  }, [])

  const loading = cards === null
  // chave da figurinha = o AUGE (nome+clube+ano). Vini Jr Flamengo e Vini Jr Real
  // Madrid são cartas DIFERENTES no álbum; só o auge idêntico conta como repetida.
  const cardKey = (c: AlbumCard) => `${c.name}|${c.club}|${c.year}`
  const shown = useMemo(() => {
    const all = cards ?? []
    const byFilter = filter === 'all' ? all : all.filter(c => c.origin === filter)
    const seen = new Set<string>()
    const dedup = byFilter.filter(c => { const k = cardKey(c); return seen.has(k) ? false : (seen.add(k), true) })
    return sortAlbum(dedup, sort)
  }, [cards, filter, sort])

  // conta FIGURINHAS ÚNICAS (por AUGE) — igual ao que aparece na tela.
  const uniqBy = (list: AlbumCard[]) => new Set(list.map(cardKey)).size
  const all = cards ?? []
  const nAll = uniqBy(all)
  const nCpu = uniqBy(all.filter(c => c.origin === 'cpu'))
  const nOnline = uniqBy(all.filter(c => c.origin === 'online'))
  const TABS: { id: AlbumFilter; label: string }[] = [
    { id: 'all', label: `${tr('Todos', 'All')} (${nAll})` },
    { id: 'cpu', label: `⚡ Offline (${nCpu})` },
    { id: 'online', label: `👥 Online (${nOnline})` },
  ]

  return (
    <Shell>
      <div className="pt-4"><VoltarInicio /></div>
      <div className="text-center -mt-1">
        <h2 className="font-black text-4xl" style={OSWALD}>{tr('📖 MEU ÁLBUM', '📖 MY ALBUM')}</h2>
        <p className="font-semibold text-black/60 mt-1">{tr('Campeão ganha uma carta-lembrança por título — no CPU ou no online. Vai colecionando os craques.', 'A champion earns one keepsake card per title — vs CPU or online. Keep collecting the stars.')}</p>
        {!loading && <p className="font-black text-lg mt-2" style={OSWALD}>{shown.length}/{CATALOG_TOTAL} {tr('craques', 'stars')}{filter !== 'all' ? ` (${filter === 'cpu' ? '⚡ Offline' : '👥 Online'})` : ''}</p>}
      </div>

      <div className="flex border-[3px] border-black rounded-xl overflow-hidden">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setFilter(t.id)}
            className="flex-1 py-2.5 font-black text-xs uppercase" style={{ backgroundColor: filter === t.id ? GOLD : '#fff', color: '#000', ...OSWALD }}>
            {t.label}
          </button>
        ))}
      </div>
      {!loading && !anon && shown.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase text-black/45 tracking-wide" style={OSWALD}>{tr('🗂️ Organizar por', '🗂️ Sort by')}</p>
          <AlbumSortBar value={sort} onChange={setSort} />
        </div>
      )}

      {loading && <p className="text-center font-bold text-black/60">{tr('Carregando…', 'Loading…')}</p>}
      {down && (
        <div className="rounded-xl border-2 border-amber-400/70 bg-amber-400/10 px-4 py-3 text-center">
          <p className="font-black text-sm" style={OSWALD}>{tr('🔧 Servidor fora do ar por uns minutos', '🔧 Server down for a few minutes')}</p>
          <p className="font-bold text-black/60 text-xs mt-1">{tr('Seu álbum está a salvo — é só instabilidade. Volta daqui a pouquinho 💛', 'Your album is safe — just a hiccup. Come back in a little while 💛')}</p>
        </div>
      )}

      {/* SEM CONTA: mostra 1 carta de exemplo pra provocar o cadastro (some ao logar) */}
      {!loading && anon && (
        <div className="space-y-3">
          <Box bg={GOLD} className="p-3 text-center">
            <p className="font-black text-sm" style={OSWALD}>{tr('👀 Exemplo de carta-lembrança', '👀 Example keepsake card')}</p>
            <p className="font-bold text-black/70 text-xs mt-1">{tr('Faça seu cadastro pra começar a SUA coleção de verdade. Esta carta some quando você logar.', 'Sign up to start YOUR real collection. This card disappears once you sign in.')}</p>
          </Box>
          <div className="grid grid-cols-2 gap-3">
            <CollectibleCard name={EXAMPLE_CARD.name} club={EXAMPLE_CARD.club} year={EXAMPLE_CARD.year} pos={EXAMPLE_CARD.pos} fame={EXAMPLE_CARD.fame} bio={getLang() === 'en' ? EXAMPLE_BIO_EN : EXAMPLE_CARD.bio} showBio />
          </div>
        </div>
      )}

      {!loading && !anon && shown.length === 0 && (
        <Box bg="#fff" className="p-6 text-center">
          <p className="font-bold text-black/70">
            {filter === 'online' ? tr('Ainda sem cartas do online. Seja campeão de uma sala pra ganhar a primeira!', 'No online cards yet. Win a room to earn the first one!')
              : filter === 'cpu' ? tr('Ainda sem cartas do CPU. Seja campeão jogando contra a CPU pra ganhar a primeira!', 'No CPU cards yet. Become champion against the CPU to earn the first one!')
              : tr('Ainda sem cartas. Seja campeão (no CPU ou online) pra ganhar a primeira!', 'No cards yet. Become champion (vs CPU or online) to earn the first one!')}
          </p>
        </Box>
      )}
      {!anon && (
        <div className="grid grid-cols-2 gap-3">
          {shown.map((c, i) => (
            <CollectibleCard key={i} name={c.name} club={c.club} year={c.year} pos={c.pos} fame={c.fame} folk={c.folk} promessa={c.promessa} showBio />
          ))}
        </div>
      )}
      <Btn onClick={() => dispatch({ type: 'GO_LOBBY' })} className="w-full text-lg">🏠 {tr('Voltar ao início', 'Back to start')}</Btn>
    </Shell>
  )
}

// ─── RANKING DE TÉCNICOS (só contas) ─────────────────────────────────
type RankMode = 'carreira' | 'ronline' | 'rcpu' // 🏆 decisão do Diego (04/08): sem 'Geral'; Carreira (em breve, zerada) · Rápido online · Rápido offline
interface RankRow { user_id: string; name: string; career_key: string; titles: number; scorer_titles: number; goals: number; cards: number }

// (removida 10/08: a rotina de acerto cartas↔títulos corrompia a contagem —
// inflava títulos de carreira antiga e apagava título real; ver diário)

export function EscRanking() {
  const { dispatch } = useEsc()
  // 🏛️ SALÃO DOS BATISMOS — ABERTO PRA TODO MUNDO em 13/09 (era só o Diego).
  // Fica AQUI, e não numa tela nova, porque foi o que ele pediu: *"e aí entraria
  // no, ligar daquela aba de ranking"*. O Ranking é a tabela de quem ganhou mais;
  // o Salão é o lugar de quem tem clube próprio — um leva pro outro.
  // 🪜 aba Carreira LIBERADA GERAL (decisão do Diego 04/08): histórico completo
  // visível pra todos e os títulos de carreira novos seguem contando normalmente.
  const [mode, setMode] = useState<RankMode>('ronline')
  // 🪜 aba Carreira mostra SÓ por-carreira (04/08, Diego tirou o "Total da conta"
  // daqui — o total da conta inteira já mora no álbum do técnico, chip Conta toda;
  // o modo 'carreiratotal' segue existindo no servidor, só não tem botão).
  const [rows, setRows] = useState<RankRow[] | null>(null)
  const [down, setDown] = useState(false) // backend fora do ar — evita travar em "Carregando…"
  const [meId, setMeId] = useState<string | null>(null)
  // 👤 PERFIL COMPLETO (mockup aprovado pelo Diego 09/08): tocar num técnico
  // abre o perfil (stats + documentos + troféus) com o álbum como UMA seção.
  const [viewUser, setViewUser] = useState<{ id: string; name: string; careerKey?: string; stats?: { titles: number; scorers: number; goals: number; cards: number } } | null>(null)
  const [viewCards, setViewCards] = useState<AlbumCard[] | null>(null)
  const [viewSort, setViewSort] = useState<AlbumSort>('tier')
  // 📖 visão do álbum tocado (pedido do Diego 04/08): quando a linha do ranking
  // é UMA carreira, o álbum mostra os dois totais — só esta carreira × conta toda
  const [viewScope, setViewScope] = useState<'carreira' | 'conta'>('carreira')

  // 🪪 tier + nº de fundador do técnico tocado — via RPC esc_perfil (a ponte
  // segura: o servidor casa user_id → e-mail → tier/fundador e devolve SÓ o
  // público; o e-mail nunca chega ao aparelho de ninguém).
  const [viewPerfil, setViewPerfil] = useState<{ tier: ApoioTier | null; fundadorN: number | null; socioN: number | null; socioDesde: string | null; socioAtivo: boolean; mascoteKey: string | null; escudoTime: string | null; timeCoracao: string | null } | null>(null)

  // abre o PERFIL de QUALQUER técnico (user_cards tem leitura pública)
  async function openAlbum(userId: string, name: string, careerKey?: string, stats?: { titles: number; scorers: number; goals: number; cards: number }) {
    setViewUser({ id: userId, name, careerKey: careerKey || undefined, stats }); setViewCards(null); setViewScope('carreira')
    setViewPerfil(null)
    supabase.rpc('esc_perfil', { p_user: userId }).then(({ data }) => {
      const row = (Array.isArray(data) ? data[0] : data) as { tier?: string | null; fundador_n?: number | null; socio_n?: number | null; socio_desde?: string | null; socio_ativo?: boolean | null; mascote_key?: string | null; escudo_time?: string | null; time_coracao?: string | null } | undefined
      const t = (row?.tier ?? null) as ApoioTier | null
      setViewPerfil({ tier: t && t in APOIO_PERKS ? t : null, fundadorN: row?.fundador_n ?? null, socioN: row?.socio_n ?? null, socioDesde: row?.socio_desde ?? null, socioAtivo: !!row?.socio_ativo, mascoteKey: row?.mascote_key ?? null, escudoTime: row?.escudo_time ?? null, timeCoracao: row?.time_coracao ?? null })
    }, () => setViewPerfil({ tier: null, fundadorN: null, socioN: null, socioDesde: null, socioAtivo: false, mascoteKey: null, escudoTime: null, timeCoracao: null }))
    try {
      const { data } = await supabase.from('user_cards')
        .select('card_name, card_club, card_year, card_pos, card_fame, origin, obtained_at, season_key, taken_from_name')
        .eq('user_id', userId).order('obtained_at', { ascending: false })
      // guarda SEM deduplicar — a deduplicação é por visão (carreira × conta),
      // senão uma carta repetida em duas carreiras sumiria da visão da carreira
      setViewCards(((data ?? []) as UserCardRow[]).map(c => ({
        name: c.card_name, club: c.card_club, year: c.card_year, pos: c.card_pos as Sector, fame: c.card_fame,
        ...(CARD_META.get(c.card_name) ?? {}),
        origin: (c.origin === 'cpu' ? 'cpu' : 'online') as 'cpu' | 'online',
        at: new Date(c.obtained_at).getTime(), sk: c.season_key,
        ...(c.taken_from_name ? { tomadaDe: c.taken_from_name } : {}), // 🃏 Bafo: de quem esta carta foi arrancada
      })))
    } catch {
      setViewCards([]) // backend fora: não trava em "Carregando…"
    }
  }

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setMeId(data.user?.id ?? null)) }, [])
  useEffect(() => {
    let alive = true
    setRows(null); setDown(false)
    ;(async () => {
      try {
        // 🚫 DESATIVADO (10/08): o acerto cartas↔títulos partia de "todo campeão
        // gera carta E título juntos" — premissa que QUEBROU com a trava do Falido
        // FC (09/08: só carreira NOVA/agenciaOn grava título no ranking). Como a
        // carta é garantida em QUALQUER carreira, a rotina recriava (fix:) os
        // títulos que a trava tirou (INFLA) e ainda rebaixava título real quando 2
        // títulos davam a MESMA carta (APAGA). Rodava 1×/dia, então corrompia sempre.
        // O ranking passa a refletir só o que o jogo grava de verdade. Ver diário.
        const pmode = mode
        // 🕐 RANKING DIÁRIO: lê a foto pronta (esc_ranking_cache, servidor atualiza
        // 1×/dia) — a conta pesada não roda mais pra cada visitante. Sem foto
        // (cache recém-limpo), cai no cálculo ao vivo como antes.
        const { data: cached } = await supabase.from('esc_ranking_cache').select('rows').eq('p_mode', pmode).maybeSingle()
        let list = (cached?.rows ?? null) as RankRow[] | null
        if (!list) {
          const { data } = await supabase.rpc('esc_ranking', { p_mode: pmode })
          list = (data ?? []) as RankRow[]
        }
        if (alive) setRows(list)
      } catch {
        // backend fora: não deixa preso em "Carregando…"
        if (alive) { setDown(true); setRows([]) }
      }
    })()
    return () => { alive = false }
  }, [mode])

  const loading = rows === null
  // Ranking por TÍTULOS (a artilharia saiu — é rara/pouco significativa e fácil
  // de forjar). Desempate simples por gols. Entra quem tem ao menos 1 título.
  const shown = useMemo(() => (rows ?? [])
    .filter(r => r.titles > 0)
    .sort((a, b) => b.titles - a.titles || b.goals - a.goals),
    [rows])
  const inList = !!meId && shown.some(r => r.user_id === meId)
  // 📖 as duas visões do álbum tocado: cada uma deduplica por nome POR SI
  // 🃏 dedup pelo AUGE único (nome|clube|ano), não só pelo nome (10/08): quem tem
  // "Ronaldo 2002" E "Ronaldo 1998" via UMA carta só e a contagem divergia do
  // servidor. Agora cada versão conta como a carta que é (igual ao packPool).
  const dedupByName = (cs: AlbumCard[]) => { const seen = new Set<string>(); return cs.filter(c => { const k = `${c.name}|${c.club}|${c.year}`; return seen.has(k) ? false : (seen.add(k), true) }) }
  const albumCk = viewUser?.careerKey
  const albumConta = viewCards ? dedupByName(viewCards) : null
  const albumCarreira = viewCards && albumCk ? dedupByName(viewCards.filter(c => c.sk?.startsWith(albumCk + ':'))) : null
  const albumShown = viewScope === 'carreira' && albumCarreira ? albumCarreira : albumConta

  const MODES: { id: RankMode; label: string }[] = [
    { id: 'ronline', label: tr('👥 Rápido (online)', '👥 Quick (online)') },
    { id: 'rcpu', label: tr('⚡ Rápido (offline)', '⚡ Quick (offline)') },
    { id: 'carreira', label: tr('🪜 Carreira', '🪜 Career') }, // histórico completo, liberado geral (04/08)
  ]
  const medal = (i: number) => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`

  return (
    <Shell>
      <div className="pt-4"><VoltarInicio /></div>
      <div className="text-center -mt-1">
        <h2 className="font-black text-4xl" style={OSWALD}>🏆 RANKING</h2>
        <p className="font-semibold text-black/60 mt-1">{tr('Só técnicos com cadastro. Ranking por títulos. 🏆', 'Registered managers only. Ranked by titles. 🏆')}</p>
        {/* 🕐 aviso sutil do ranking diário (decisão do Diego 04/08) */}
        <p className="text-[10.5px] font-bold text-black/40 mt-0.5">{tr('🕐 O ranking e as cartas atualizam 1× por dia', '🕐 Ranking and cards update once a day')}</p>
      </div>


      {/* filtro: Carreira (em breve) / Rápido online / Rápido offline */}
      <div className="flex border-[3px] border-black rounded-xl overflow-hidden">
        {MODES.map(t => (
          <button key={t.id} onClick={() => setMode(t.id)}
            className="flex-1 py-2.5 font-black text-xs uppercase" style={{ backgroundColor: mode === t.id ? GOLD : '#fff', color: '#000', ...OSWALD }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 🪜 Carreira: SÓ a lista por carreira (decisão do Diego 04/08 — a sub-aba
          "Total da conta" saiu: o total da conta toda já aparece ao tocar no
          técnico, dentro do álbum, no chip "📊 Conta toda"). */}
      {mode === 'carreira' && (
        <p className="text-center text-[10px] font-bold text-black/45">{tr('cada carreira é uma linha · toque no técnico pra ver o total da conta', 'each career is one line · tap the manager to see the account total')}</p>
      )}

      {/* dica: dá pra tocar num técnico e ver o álbum dele */}
      {!loading && shown.length > 0 && (
        <p className="text-center text-[12px] font-black text-black/55" style={OSWALD}>{tr('👆 Toque num técnico pra ver as cartas dele', '👆 Tap a manager to see their cards')}</p>
      )}

      {/* cabeçalho das colunas */}
      {!loading && shown.length > 0 && (
        <div className="flex items-center gap-3 px-2.5">
          <span className="w-9 shrink-0" />
          <span className="flex-1" />
          <span className="w-12 text-center font-black text-[11px] text-black/45 shrink-0" style={OSWALD}>{tr('🏆 Tít.', '🏆 Titles')}</span>
        </div>
      )}

      {loading && <p className="text-center font-bold text-black/60">{tr('Carregando…', 'Loading…')}</p>}
      {down && (
        <Box bg="#fff" className="p-5 text-center">
          <p className="font-black text-sm" style={OSWALD}>{tr('🔧 Servidor fora do ar por uns minutos', '🔧 Server down for a few minutes')}</p>
          <p className="font-bold text-black/60 text-xs mt-1">{tr('O ranking já volta — é só instabilidade. Tenta de novo daqui a pouco 💛', 'The ranking will be right back — just a hiccup. Try again in a bit 💛')}</p>
        </Box>
      )}
      {!loading && !down && shown.length === 0 && (
        <Box bg="#fff" className="p-6 text-center">
          <p className="font-bold text-black/70">{tr('Ninguém no ranking ainda. Seja o primeiro campeão! 🔨', 'Nobody in the ranking yet. Be the first champion! 🔨')}</p>
        </Box>
      )}
      <div className="space-y-2">
        {shown.slice(0, 10).map((r, i) => (
          <button key={r.user_id} onClick={() => openAlbum(r.user_id, r.name, r.career_key, { titles: r.titles, scorers: r.scorer_titles, goals: r.goals, cards: r.cards })}
            className="w-full flex items-center gap-3 border-[3px] border-black rounded-xl p-2.5 active:translate-y-0.5"
            style={{ background: r.user_id === meId ? GOLD : '#fff', boxShadow: `3px 3px 0 ${INK}` }}>
            <span className="font-black text-lg w-9 text-center shrink-0" style={OSWALD}>{medal(i)}</span>
            <span className="font-black text-black text-sm flex-1 min-w-0 truncate text-left" style={OSWALD}>{r.name}{r.user_id === meId ? tr(' (você)', ' (you)') : ''}</span>
            <span className="w-12 text-center font-black text-lg shrink-0" style={OSWALD}>{r.titles}</span>
          </button>
        ))}
      </div>
      {!loading && !inList && meId && shown.length > 0 && (
        <Box bg="#fff" className="p-3 text-center">
          <p className="font-bold text-black/70 text-sm">{tr('Você ainda não pontuou', 'You haven\'t scored yet')} {mode === 'ronline' ? tr('no rápido online', 'in online quick match') : tr('no rápido offline', 'in offline quick match')}. {tr('Seja campeão pra entrar! 🔨', 'Become champion to get in! 🔨')}</p>
        </Box>
      )}
      {!loading && !meId && (
        <Box bg="#fff" className="p-3 text-center">
          <p className="font-bold text-black/70 text-sm">{tr('Faça login pra aparecer no ranking e ganhar cartas.', 'Sign in to appear in the ranking and earn cards.')}</p>
        </Box>
      )}
      <Btn onClick={() => dispatch({ type: 'GO_LOBBY' })} className="w-full text-lg">🏠 {tr('Voltar ao início', 'Back to start')}</Btn>

      {/* álbum do técnico tocado */}
      {viewUser && (
        <div className="fixed inset-0 z-50 flex flex-col p-4" style={{ background: 'rgba(0,0,0,.7)' }} onClick={() => setViewUser(null)}>
          <div className="max-w-md w-full mx-auto my-auto max-h-[85vh] flex flex-col rounded-2xl border-[3px] border-black overflow-hidden" style={{ background: CREAM }} onClick={e => e.stopPropagation()}>
            {(() => {
              // 🎨 header na cor do PRÓPRIO tier (fidelidade sagrada): grátis = bege
              const pk = viewPerfil ? APOIO_PERKS[viewPerfil.tier ?? 'bege'] : null
              const selos = pk ? `${pk.selo}${viewPerfil?.fundadorN != null ? '🖋️' : ''}${viewPerfil?.socioAtivo ? '🎫' : ''}` : ''
              return (
                <div className="flex items-center justify-between px-4 py-3 border-b-[3px] border-black" style={{ background: pk?.grad ?? GOLD }}>
                  <div className="min-w-0">
                    <p className="font-black text-black text-lg leading-tight truncate" style={OSWALD}>👤 {viewUser.name}{selos ? ` ${selos}` : ''}</p>
                    <p className="text-black/60 text-xs font-bold">{tr('perfil do técnico', 'manager profile')}</p>
                  </div>
                  <button onClick={() => setViewUser(null)} className="shrink-0 w-8 h-8 rounded-full border-2 border-black bg-white font-black text-black active:translate-y-0.5">✕</button>
                </div>
              )
            })()}
            {/* 👤 PERFIL (mockup aprovado 09/08): stats + documentos + troféus antes do álbum */}
            {viewUser.stats && (
              <div className="flex gap-1.5 px-4 pt-3">
                {([['🏆', tr('títulos', 'titles'), viewUser.stats.titles], ['👟', tr('artilharias', 'top scorer'), viewUser.stats.scorers], ['⚽', tr('gols', 'goals'), viewUser.stats.goals], ['🎴', tr('cartas', 'cards'), viewUser.stats.cards]] as const).map(([em, lb, n]) => (
                  <div key={lb} className="flex-1 border-[2.5px] border-black rounded-xl bg-white text-center py-1.5" style={{ boxShadow: `2px 2px 0 ${INK}` }}>
                    <p className="font-black text-base leading-tight" style={OSWALD}>{n}</p>
                    <p className="text-[8px] font-black uppercase tracking-wide text-black/50">{em} {lb}</p>
                  </div>
                ))}
              </div>
            )}
            {/* 🪪 Documentos: fundador de QUALQUER perfil (via RPC esc_perfil; o
                próprio ainda tem o fallback local). 1 carteirinha só = tamanho
                GRANDE (regra do Diego 09/08) — a de sócio entra na infra do sócio. */}
            {(() => {
              const fN = viewPerfil?.fundadorN ?? (viewUser.id === meId ? myFundadorN() : null)
              const socio = viewPerfil?.socioAtivo && viewPerfil.socioN != null ? viewPerfil : null
              if (fN == null && !socio) return null
              // 🪪 meses de casa do sócio (desde nunca zera enquanto assinar)
              const meses = socio?.socioDesde ? Math.max(0, Math.floor((Date.now() - new Date(socio.socioDesde + 'T12:00').getTime()) / (30.44 * 86400e3))) : 0
              return (
                <div className="px-4 pt-3 space-y-2">
                  {fN != null && (
                    <div className="relative overflow-hidden border-[3px] border-black rounded-xl px-3 py-3" style={{ background: 'linear-gradient(150deg,#241d0c,#141414 55%,#2b230e)', boxShadow: `3px 3px 0 ${INK}` }}>
                      <span className="absolute right-2.5 top-2.5 font-black text-sm border-2 border-black rounded-lg px-2 py-0.5" style={{ ...OSWALD, background: 'linear-gradient(150deg,#FFE79A,#FFC400)' }}>Nº {fN}</span>
                      <p className="font-black text-base uppercase" style={{ ...OSWALD, color: GOLD }}>{tr('🖋️ Fundador do Leilão Legends', '🖋️ Leilão Legends Founder')}</p>
                      <p className="text-[10.5px] font-bold" style={{ color: 'rgba(255,255,255,.75)' }}>{fN} {tr('dos 100 primeiros · pra sempre', 'of the first 100 · forever')}</p>
                    </div>
                  )}
                  {socio && (
                    <div className="relative overflow-hidden border-[3px] border-black rounded-xl px-3 py-3" style={{ background: 'linear-gradient(150deg,#A78BFA,#7C3AED)', boxShadow: `3px 3px 0 ${INK}` }}>
                      <span className="absolute right-2.5 top-2.5 font-black text-sm border-2 border-black rounded-lg px-2 py-0.5 bg-white" style={OSWALD}>nº {socio.socioN}</span>
                      <p className="font-black text-base uppercase text-white" style={OSWALD}>🎫 Sócio Legends</p>
                      <p className="text-[10.5px] font-bold" style={{ color: 'rgba(255,255,255,.85)' }}>{meses > 0 ? (getLang() === 'en' ? `${meses} ${meses === 1 ? 'month' : 'months'} in the club` : `${meses} ${meses === 1 ? 'mês' : 'meses'} de casa`) : tr('recém-chegado ao clube', 'new to the club')}{socio.socioDesde ? ` · ${tr('desde', 'since')} ${new Date(socio.socioDesde + 'T12:00').toLocaleDateString(getLang() === 'en' ? 'en-US' : 'pt-BR', { month: 'long', year: 'numeric' })}` : ''}</p>
                    </div>
                  )}
                </div>
              )
            })()}
            {/* 🛡️🎭 o CLUBE DO CORAÇÃO: escudo artesanal + mascote — SÓ pra quem
                tem (regra do Diego 09/08: sem placeholder pra quem não tem). */}
            {(() => {
              const escT = viewPerfil?.escudoTime && LOGOS_PRONTAS[viewPerfil.escudoTime] ? viewPerfil.escudoTime : null
              const masc = viewPerfil?.mascoteKey && MASCOTES[viewPerfil.mascoteKey] ? MASCOTES[viewPerfil.mascoteKey] : null
              // ❤️ o rótulo é o time de coração DE VERDADE (Palmeiras, Cruzeiro...) —
              // vai alimentar o futuro ranking de torcidas. Só sócio tem.
              const coracao = viewPerfil?.timeCoracao ?? null
              if (!escT && !masc) return null
              return (
                <div className="px-4 pt-3">
                  <p className="font-black text-[11px] uppercase tracking-wide mb-1.5" style={OSWALD}>{tr('🛡️ O clube do coração', '🛡️ The club they support')}</p>
                  <div className="border-[2.5px] border-black rounded-xl bg-white flex items-end justify-center gap-6 px-3 py-2.5" style={{ boxShadow: `2px 2px 0 ${INK}` }}>
                    {escT && (
                      <div className="text-center">
                        <Escudo nome={escT} size={78} />
                        <p className="text-[8.5px] font-black text-black/50 uppercase mt-1" style={OSWALD}>{coracao ?? escT}</p>
                      </div>
                    )}
                    {masc && (
                      <div className="text-center">
                        <div style={{ transform: 'scale(.58)', transformOrigin: 'bottom center', height: 176, width: 140, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginTop: -66, marginLeft: -22, marginRight: -22 }}>{masc}</div>
                        <p className="text-[8.5px] font-black text-black/50 uppercase" style={OSWALD}>{!escT && coracao ? coracao : tr('mascote', 'mascot')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}
            {viewUser.stats && (viewUser.stats.titles > 0 || viewUser.stats.scorers > 0) && (
              <div className="px-4 pt-3">
                <p className="font-black text-[11px] uppercase tracking-wide mb-1.5" style={OSWALD}>{tr('🏆 Sala de troféus', '🏆 Trophy room')}</p>
                {/* 🏆 troféus GRANDES (pedido do Diego 09/08: o DESENHO grande, não só a letra) */}
                <div className="flex flex-wrap gap-2">
                  {viewUser.stats.titles > 0 && <span className="flex items-center gap-1.5 border-[3px] border-black rounded-xl px-3 py-1.5 text-[15px] font-black" style={{ background: 'linear-gradient(150deg,#FFF3C2,#FFE79A)', boxShadow: `2.5px 2.5px 0 ${INK}`, ...OSWALD }}><span style={{ fontSize: 28, lineHeight: '28px' }}>🏆</span>{viewUser.stats.titles === 1 ? tr('Título', 'Title') : tr('Títulos', 'Titles')} ×{viewUser.stats.titles}</span>}
                  {viewUser.stats.scorers > 0 && <span className="flex items-center gap-1.5 border-[3px] border-black rounded-xl px-3 py-1.5 text-[15px] font-black" style={{ background: 'linear-gradient(150deg,#FFF3C2,#FFE79A)', boxShadow: `2.5px 2.5px 0 ${INK}`, ...OSWALD }}><span style={{ fontSize: 28, lineHeight: '28px' }}>👟</span>{viewUser.stats.scorers === 1 ? tr('Artilharia', 'Top scorer') : tr('Artilharias', 'Top scorer awards')} ×{viewUser.stats.scorers}</span>}
                  {viewUser.stats.goals > 0 && <span className="flex items-center gap-1.5 border-[3px] border-black rounded-xl px-3 py-1.5 text-[15px] font-black bg-white" style={{ boxShadow: `2.5px 2.5px 0 ${INK}`, ...OSWALD }}><span style={{ fontSize: 28, lineHeight: '28px' }}>⚽</span>{viewUser.stats.goals} {tr('gols', 'goals')}</span>}
                </div>
              </div>
            )}
            {albumShown && <p className="px-4 pt-3 font-black text-[11px] uppercase tracking-wide" style={OSWALD}>{tr('🎴 Álbum de cartas', '🎴 Card album')}</p>}
            {/* 🪜×📊 os dois totais (mockup aprovado): só quando a linha tocada é UMA carreira */}
            {albumCarreira && albumConta && (
              <div className="flex gap-2 px-4 pt-3">
                {([['carreira', tr('🪜 Esta carreira', '🪜 This career'), albumCarreira.length], ['conta', tr('📊 Conta toda', '📊 Whole account'), albumConta.length]] as const).map(([id, label, n]) => (
                  <button key={id} onClick={() => setViewScope(id)}
                    className="flex-1 border-[2.5px] border-black rounded-xl py-2 px-1 font-black text-[11px] uppercase leading-tight"
                    style={{ backgroundColor: viewScope === id ? GOLD : '#fff', boxShadow: viewScope === id ? `2px 2px 0 0 ${INK}` : 'none', ...OSWALD }}>
                    {label}
                    <span className="block text-[11px] font-extrabold normal-case">{n} {n === 1 ? tr('carta', 'card') : tr('cartas', 'cards')}</span>
                  </button>
                ))}
              </div>
            )}
            {albumShown && albumShown.length > 1 && (
              <div className="px-4 pt-3"><AlbumSortBar value={viewSort} onChange={setViewSort} /></div>
            )}
            <div className="overflow-y-auto p-4">
              {!albumShown && <p className="text-center font-bold text-black/60 py-6">{tr('Carregando…', 'Loading…')}</p>}
              {albumShown && albumShown.length === 0 && <p className="text-center font-bold text-black/60 py-6">{viewScope === 'carreira' && albumCarreira ? tr('Nenhuma carta nesta carreira ainda.', 'No cards in this career yet.') : tr('Esse técnico ainda não ganhou cartas.', 'This manager hasn\'t earned any cards yet.')}</p>}
              {albumShown && albumShown.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {sortAlbum(albumShown, viewSort).map((c, i) => (
                    <div key={i}>
                      <CollectibleCard name={c.name} club={c.club} year={c.year} pos={c.pos} fame={c.fame} folk={c.folk} promessa={c.promessa} showBio />
                      {/* 🃏 BAFO: carta que MUDOU DE DONO fica marcada pra sempre com
                          de quem ela foi arrancada — é a graça do modo. */}
                      {c.tomadaDe && (
                        <p className="text-[9.5px] font-black text-center mt-1 leading-snug" style={{ color: '#8E2A1B' }}>{tr('🃏 arrancada do', '🃏 taken from')} {c.tomadaDe}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Shell>
  )
}

// Grava (silenciosamente) o meu resultado da temporada no ranking — só se eu
// tiver conta. Uma linha por técnico por temporada (season_key deduplica). Cada
// cliente grava o SEU: no online, todos os humanos entram; no CPU, só eu.
function RankResultWriter() {
  const { state } = useEsc()
  const wrote = useRef(false)
  // base do season_key deste jogo (online / dinastia / cpu) — reusada pela liga e pela Copa
  // 🔑 online: inclui o SEED (impressão digital do jogo, único por leilão/revanche)
  // — senão o "novo leilão" na MESMA sala reseta a temporada pra 1 e o título novo
  // grava POR CIMA do antigo (sumia do ranking). Solo/dinastia já têm o seed.
  const baseKey = () => state.onlineMode === 'online' ? `${state.roomId}:${state.seed}:${state.seasonNo}` : state.dinastia ? `dinastia:${state.seed}:${state.seasonNo}` : `cpu:${state.seed}:${state.seasonNo}`
  useEffect(() => {
    if (wrote.current) return
    wrote.current = true
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const you = state.managers[state.youIdx]
        const table = sortedTable(state.league)
        if (!you || table.length === 0) return
        const champ = table[0]
        const myRow = table.find(t => t.id === you.id)
        const top = topScorers(state, 1)[0]
        const online = state.onlineMode === 'online'
        const seasonKey = baseKey()
        const displayName = stripEmoji(user.user_metadata?.display_name ?? user.email?.split('@')[0] ?? you.teamName)
        await resilientWrite({ table: 'esc_results', onConflict: 'user_id,season_key', row: {
          user_id: user.id, display_name: displayName,
          mode: online ? 'online' : 'cpu', season_key: seasonKey,
          champion: champ.id === you.id, top_scorer: top?.teamId === you.id,
          goals: myRow?.gf ?? 0,
        } })
      } catch { /* nunca trava o jogo */ }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // 🏆 COPA DOS 8: quem for campeão da Copa TAMBÉM leva um título no ranking
  // (agora que a Copa dá carta). Linha à parte (season_key com sufixo ":copa"),
  // então dá pra ganhar liga + Copa na mesma temporada = 2 títulos. Dispara
  // quando a Copa é decidida (pode ser depois da liga, já na tela de fim).
  const wroteCopa = useRef(false)
  // 🏆 quem sou EU é local a cada cliente (youIdx). O `champion.you` do estado é
  // GLOBAL (marca "o campeão é humano") — no online dá true pra todos quando
  // qualquer humano leva a Copa. O certo é comparar o id do campeão com o MEU time.
  const iWonCopa = state.quickCopa?.champion?.id != null && state.quickCopa.champion.id === state.managers[state.youIdx]?.id
  useEffect(() => {
    if (wroteCopa.current || !iWonCopa) return
    wroteCopa.current = true
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const you = state.managers[state.youIdx]
        if (!you) return
        const online = state.onlineMode === 'online'
        const displayName = stripEmoji(user.user_metadata?.display_name ?? user.email?.split('@')[0] ?? you.teamName)
        await resilientWrite({ table: 'esc_results', onConflict: 'user_id,season_key', row: {
          user_id: user.id, display_name: displayName,
          mode: online ? 'online' : 'cpu', season_key: `${baseKey()}:copa`,
          champion: true, top_scorer: false, goals: 0,
        } })
      } catch { /* nunca trava o jogo */ }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iWonCopa])
  return null
}

// 🧯 CERCA DA COPA (01/09) — regra #1 do Diego: nunca quebrar o futebol.
// A Copa do Mundo da sala é jogo NOVO desenhado por cima da tela de fim de
// temporada, que é a tela mais cara do jogo (campeão, carta, jornal, estante).
// Sem cerca, um erro dentro da Copa derrubaria a árvore inteira e a pessoa
// perderia a festa do título por causa de uma tela extra. Com cerca, a Copa some
// e explica; TODO o resto do fim de temporada continua de pé.
class CercaDaCopa extends Component<{ children: ReactNode }, { caiu: boolean }> {
  state = { caiu: false }
  static getDerivedStateFromError() { return { caiu: true } }
  componentDidCatch(err: Error) { try { console.error('Copa do Mundo da sala:', err) } catch { /* ignora */ } }
  render() {
    if (!this.state.caiu) return this.props.children
    return (
      <div style={{ border: '3px solid #0C0C0C', borderRadius: 14, background: '#FFF4CF', boxShadow: '4px 4px 0 #0C0C0C', padding: '11px 13px', marginBottom: 10 }}>
        <p style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 900, fontSize: 13, margin: 0 }}>🌍 A Copa do Mundo não abriu</p>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,.6)', margin: '3px 0 0', lineHeight: 1.4 }}>
          Deu um problema só na Copa — <b>o resto da temporada está tudo aí embaixo</b>, campeão, carta e jornal.
          Atualize a página pra tentar de novo, e manda um print pro <b>@leilaolegendscom</b>.
        </p>
      </div>
    )
  }
}

// ─── CARREIRA: salvar/carregar + modais ──────────────────────────────
const CAREER_LS = 'esc-career'
// ⚠️ ESTE É O SAVE DA CARREIRA ANTIGA (a de 4 divisões, `esc_careers`) — NÃO é a
// carreira de hoje. A carreira atual é a PIRÂMIDE, que mora em outro lugar
// (`esc_pyramid_saves` / "Minhas Carreiras"). Desde 30/07 ninguém consegue mais
// CRIAR uma carreira antiga: o botão da tela de setup manda `START_CAREER_SOLO`
// (pirâmide). Ou seja, todo save daqui pra frente nesta caixa é FANTASMA — foi
// escrito por engano no fim de uma sala online que herdou o `careerDivision`
// (bug consertado em 19/08). Por isso o banner "Continuar carreira" só oferece
// save mais VELHO que essa data: o que veio depois não existe de verdade.
const PIRAMIDE_DESDE = '2026-07-30'
type CareerSaveRow = CareerSave & { savedAt?: string }
/** save escrito depois que a pirâmide nasceu = fantasma (nunca foi criado por ninguém) */
function saveFantasma(s: CareerSaveRow): boolean { return !s.savedAt || s.savedAt.slice(0, 10) >= PIRAMIDE_DESDE }
function saveCareerLocal(save: CareerSave) { try { localStorage.setItem(CAREER_LS, JSON.stringify({ ...save, savedAt: new Date().toISOString() })) } catch { /* ignora */ } }
function loadCareerLocal(): CareerSaveRow | null { try { const r = localStorage.getItem(CAREER_LS); return r ? JSON.parse(r) as CareerSaveRow : null } catch { return null } }

// salva sempre no aparelho; se logado, também na conta (nuvem, multi-aparelho).
// devolve true se salvou na conta.
async function saveCareer(save: CareerSave): Promise<boolean> {
  saveCareerLocal(save)
  try {
    const { data } = await supabase.auth.getUser()
    if (!data?.user) return false
    const { error } = await supabase.from('esc_careers').upsert({
      user_id: data.user.id, division: save.division, season_no: save.seasonNo,
      team_name: save.teamName, formation: save.formation, squad: save.squad, titles: save.titles, titles_a: save.titlesA ?? 0,
      pending_decision: !!save.pendingDecision, result: save.result ?? null, prev_division: save.prevDivision ?? null,
      rival_teams: save.rivals ?? null, rival_count: save.rivalCount ?? null,
      updated_at: new Date().toISOString(),
    })
    return !error
  } catch { return false }
}
async function loadCareer(): Promise<CareerSaveRow | null> {
  try {
    const { data } = await supabase.auth.getUser()
    if (data?.user) {
      const { data: row } = await supabase.from('esc_careers').select('*').eq('user_id', data.user.id).maybeSingle()
      if (row) return { division: row.division, seasonNo: row.season_no, teamName: row.team_name, formation: row.formation, squad: row.squad as CareerSave['squad'], titles: row.titles, titlesA: row.titles_a ?? 0, pendingDecision: !!row.pending_decision, result: row.result ?? undefined, prevDivision: row.prev_division ?? undefined, rivals: (row.rival_teams as CareerSave['rivals']) ?? undefined, rivalCount: row.rival_count ?? undefined, savedAt: (row.updated_at as string | undefined) ?? undefined }
    }
  } catch { /* ignora */ }
  return loadCareerLocal()
}
// apaga o save da carreira — no aparelho e, se logado, também na conta (nuvem)
async function deleteCareer() {
  try { localStorage.removeItem(CAREER_LS) } catch { /* ignora */ }
  try {
    const { data } = await supabase.auth.getUser()
    if (data?.user) await supabase.from('esc_careers').delete().eq('user_id', data.user.id)
  } catch { /* ignora */ }
}

// modal rápido de cadastro/login (email + senha) — pra salvar na conta
function CareerAuthModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  return <JanelaConta titulo={tr('💾 Salvar carreira', '💾 Save career')}
    contexto={tr('Entre ou crie sua conta para guardar sua carreira.', 'Sign in or create your account to save your career.')}
    comecarEmCriar onFechar={onClose} onPronto={onDone} />
}

// faixa no setup da carreira: retomar o save (ou excluí-lo no X). Só aparece
// depois de tocar em "Carreira por Divisões" — não fica mais na home.
function CareerContinueBanner() {
  const { dispatch } = useEsc()
  const [save, setSave] = useState<CareerSaveRow | null>(null)
  const [decideOpen, setDecideOpen] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false) // confirma no app (window.confirm é bloqueado no navegador do zap/insta)
  const onDelete = async () => {
    await deleteCareer()
    setSave(null)
  }
  useEffect(() => {
    let alive = true
    ;(async () => {
      const s = await loadCareer()
      if (!s) return
      // 👻 save fantasma (nasceu no fim de uma sala online, não é carreira de
      // ninguém): não oferece. Só APAGA quando dá pra provar pela data — save
      // escrito depois de 30/07 é impossível de ter sido criado por alguém. Sem
      // data (aparelho de quem nunca logou), só esconde: não apaga o que não dá
      // pra ter certeza.
      if (saveFantasma(s)) { if (s.savedAt) deleteCareer(); return }
      // se logado, o time carrega com o nome ATUAL da conta (fonte única) —
      // renomear em qualquer lugar reflete aqui também.
      const { data } = await supabase.auth.getUser()
      const dn = ((data?.user?.user_metadata?.display_name as string) ?? '').trim()
      if (alive) setSave(dn ? { ...s, teamName: dn } : s)
    })()
    return () => { alive = false }
  }, [])
  if (!save) return null
  // salvou no fim da temporada sem ter decidido? traz a decisão de volta:
  // manter o mesmo time ou trocar tudo (novo leilão) — não escolhe por você.
  if (save.pendingDecision && decideOpen) {
    const banner = save.result === 'up'
      ? { bg: '#1B7A3D', txt: `${tr('🔼 SUBIU PRA', '🔼 PROMOTED TO')} ${DIVISION_LABEL[save.division].toUpperCase()}!` }
      : save.result === 'down'
        ? { bg: '#E8503A', txt: `${tr('🔽 REBAIXADO PRA', '🔽 RELEGATED TO')} ${DIVISION_LABEL[save.division].toUpperCase()}` }
        : { bg: '#2E6FB0', txt: `${tr('➡️ CONTINUA NA', '➡️ STAYS IN')} ${DIVISION_LABEL[save.division].toUpperCase()}` }
    return (
      <div className="rounded-2xl border-[3px] border-black p-3 space-y-2" style={{ background: PURPLE, boxShadow: `4px 4px 0 ${INK}` }}>
        <div className="rounded-xl border-2 border-black px-3 py-2 text-center" style={{ background: banner.bg }}>
          <p className="font-black text-white text-sm" style={OSWALD}>{banner.txt}</p>
          <p className="font-bold text-white/85 text-[11px]">{tr('Temporada', 'Season')} {save.seasonNo} · {save.titles} {save.titles === 1 ? tr('título', 'title') : tr('títulos', 'titles')} · {save.teamName}</p>
          {(save.titlesA ?? 0) > 0 && <p className="mt-0.5"><CareerStars n={save.titlesA ?? 0} size={13} /></p>}
        </div>
        <p className="text-center text-white font-black text-xs" style={OSWALD}>{tr('Como quer seguir?', 'How do you want to go on?')}</p>
        <button onClick={() => dispatch({ type: 'RESTORE_CAREER', save })} className="w-full rounded-xl border-2 border-black bg-white text-black font-black text-sm py-2.5 active:translate-y-0.5" style={OSWALD}>{tr('▶️ Continuar com o mesmo time', '▶️ Continue with the same team')}</button>
        {(save.rivals ?? []).filter(r => r.division === save.division).length > 0 ? (
          <button onClick={() => dispatch({ type: 'RESTORE_CAREER', save, redraft: true })} className="w-full rounded-xl border-2 border-black font-black text-sm py-2.5 active:translate-y-0.5" style={{ background: GOLD, color: INK, ...OSWALD }}>{tr('🔄 Trocar tudo (novo leilão)', '🔄 Change everything (new auction)')}</button>
        ) : (
          <p className="text-center text-white/70 text-[11px] font-bold px-1">{getLang() === 'en' ? <>🔒 No rival of yours in {DIVISION_LABEL[save.division]} — the auction doesn't open (it would be just you). Keep the same team; it comes back when a rival reaches your division.</> : <>🔒 Sem rival seu na {DIVISION_LABEL[save.division]} — o leilão não abre (seria só você). Siga com o mesmo time; volta quando um rival chegar na sua divisão.</>}</p>
        )}
        <button onClick={() => setDecideOpen(false)} className="w-full text-white/60 text-xs underline">{tr('agora não', 'not now')}</button>
      </div>
    )
  }
  return (
    <div className="rounded-2xl border-[3px] border-black p-3 space-y-2" style={{ background: PURPLE, boxShadow: `4px 4px 0 ${INK}` }}>
      <p className="font-black text-white text-sm leading-tight" style={OSWALD}>{tr('🪜 Carreira em andamento', '🪜 Career in progress')}<br /><span className="opacity-85 text-xs">{DIVISION_LABEL[save.division]} · {tr('Temporada', 'Season')} {save.seasonNo} · {save.titles} {save.titles === 1 ? tr('título', 'title') : tr('títulos', 'titles')}</span>{(save.titlesA ?? 0) > 0 && <><br /><CareerStars n={save.titlesA ?? 0} size={13} /></>}</p>
      <div className="flex gap-2">
        <button
          onClick={() => save.pendingDecision ? setDecideOpen(true) : dispatch({ type: 'RESTORE_CAREER', save })}
          className="flex-1 rounded-xl border-2 border-black bg-white text-black font-black text-sm py-2.5 active:translate-y-0.5" style={OSWALD}>
          {tr('▶️ Continuar carreira', '▶️ Continue career')} ({save.teamName})
        </button>
        {confirmDel ? (
          <div className="flex gap-1 items-center shrink-0">
            <button onClick={onDelete} className="rounded-xl border-2 border-black text-white font-black text-xs px-2.5 active:translate-y-0.5" style={{ background: '#C2452F', ...OSWALD }}>{tr('🗑️ Apagar', '🗑️ Delete')}</button>
            <button onClick={() => setConfirmDel(false)} aria-label={tr('Cancelar', 'Cancel')} className="text-white/70 font-black text-lg px-1 active:opacity-60">✕</button>
          </div>
        ) : (
          <button onClick={() => setConfirmDel(true)} aria-label={tr('Excluir save da carreira', 'Delete career save')} title={tr('Excluir save', 'Delete save')}
            className="rounded-xl border-2 border-black bg-white text-red-600 font-black text-lg px-3.5 active:translate-y-0.5" style={OSWALD}>
            ✕
          </button>
        )}
      </div>
    </div>
  )
}

// estrelas de título da SÉRIE A ⭐ — só campeão da elite ganha estrela.
// 1 = Campeão, 2 Bi, 3 Tri, 4 Tetra, 5 Penta, 6+ Dinastia 👑
const A_TITLE_LABEL: Record<number, string> = { 1: 'Campeão da Série A', 2: 'Bicampeão', 3: 'Tricampeão', 4: 'Tetracampeão', 5: 'Pentacampeão' }
const A_TITLE_LABEL_EN: Record<number, string> = { 1: 'Série A Champion', 2: 'Two-time champion', 3: 'Three-time champion', 4: 'Four-time champion', 5: 'Five-time champion' }
function aTitleLabel(n: number): string { return n >= 6 ? tr('👑 Dinastia', '👑 Dynasty') : ((getLang() === 'en' ? A_TITLE_LABEL_EN : A_TITLE_LABEL)[n] ?? '') }
function CareerStars({ n, size = 13 }: { n: number; size?: number }) {
  if (n <= 0) return null
  const shown = Math.min(n, 5)
  return (
    <span title={aTitleLabel(n)} style={{ fontSize: size, letterSpacing: -1, whiteSpace: 'nowrap' }}>
      {'⭐'.repeat(shown)}{n > 5 && <span style={{ fontSize: size - 3, fontWeight: 900, letterSpacing: 0 }}> ×{n}</span>}
    </span>
  )
}

// painel de fim de temporada da carreira (sobe/cai + continuar/trocar/salvar/sair)
// 🏀 fim de temporada da CARREIRA do basquete (Street League). Botão de PRÓXIMA
// TEMPORADA: se ainda falta banco, abre o leilão de reservas (mantém o quinteto);
// senão, começa a temporada com o mesmo time. (Salvar/continuar = próximo passo.)
// 🪜 rótulo de cada andar + o de cima (pro aviso de subir de liga)
const NBA_TIER_LABEL: Record<'street' | 'gleague' | 'nba', { pt: string; en: string; nextPt?: string; nextEn?: string }> = {
  street: { pt: '🛝 Street League', en: '🛝 Street League', nextPt: '🔷 G League', nextEn: '🔷 G League' },
  gleague: { pt: '🔷 G League', en: '🔷 G League', nextPt: '💍 NBA', nextEn: '💍 NBA' },
  nba: { pt: '💍 NBA', en: '💍 NBA' },
}
function NbaCareerEndPanel() {
  const { state, dispatch } = useEsc()
  const t = useT()
  const [showSell, setShowSell] = useState(false)
  const you = state.managers[state.youIdx]
  const real = (you?.squad ?? []).filter(c => !c.fake)
  const roster = real.length
  // 🪜 subir de liga: terminou no top 4 e tem andar acima? sobe na próxima temporada.
  const tier = state.nbaTier ?? 'street'
  const tbl = sortedTable(state.league)
  const youPos = tbl.findIndex(tt => tt.id === you?.id) + 1
  const tierInfo = NBA_TIER_LABEL[tier]
  const willPromote = youPos >= 1 && youPos <= 4 && !!tierInfo.nextPt
  const marked = new Set(state.reserveListed?.[you?.id ?? 0] ?? [])
  const nMarked = marked.size
  // 🏀 VENDER só na T3+ com elenco cheio (15). Fraco primeiro (o banco a trocar).
  const canSell = (state.seasonNo ?? 1) >= 3 && roster >= 15
  const sellable = [...real].sort((a, b) => (a.lo + a.hi) - (b.lo + b.hi))
  const note = roster < 10
    ? t('Abre o leilão de RESERVAS: mantém o quinteto e monta o banco (rotação de 10). 🔧 em teste', 'Opens the RESERVE auction: keep your five and build the bench (10-man rotation). 🔧 testing')
    : roster < 15
    ? t('Abre o leilão de RESERVAS: completa o elenco cheio da NBA (15). 🔧 em teste', 'Opens the RESERVE auction: fill out the full NBA roster (15). 🔧 testing')
    : nMarked > 0
    ? t(`Você dispensou ${nMarked} — o leilão de reservas vai repor as vagas.`, `You released ${nMarked} — the reserve auction will refill the slots.`)
    : t('Elenco cheio (15) — a próxima temporada começa com o mesmo time (ou dispense reservas pra trocar).', 'Full roster (15) — next season starts with the same team (or release bench players to swap).')
  return (
    <div className="space-y-2">
      {/* 🪜 subiu de liga! (top 4) — feedback antes de tocar em próxima temporada */}
      {willPromote && (
        <div className="rounded-xl border-[3px] border-black px-3 py-2 text-center" style={{ background: '#1B7A3D', boxShadow: `3px 3px 0 ${INK}` }}>
          <p className="font-black text-white text-sm" style={OSWALD}>🔼 {youPos}º {t('lugar', 'place')} — {t('SUBIU DE LIGA!', 'PROMOTED!')}</p>
          <p className="font-bold text-white/85 text-[11px]">{t('Próxima temporada na', 'Next season in')} {t(tierInfo.nextPt!, tierInfo.nextEn!)}</p>
        </div>
      )}
      {!willPromote && tier !== 'nba' && (
        <p className="text-center text-[11px] font-bold text-black/45">{t(`${youPos}º na ${tierInfo.pt} — top 4 sobe de liga.`, `${youPos}${youPos === 1 ? 'st' : 'th'} in ${tierInfo.en} — top 4 gets promoted.`)}</p>
      )}
      <Btn onClick={() => dispatch({ type: 'NEXT_NBA_SEASON' })} bg={GREEN} className="w-full text-lg">
        <span className="text-white">▶️ {t('Próxima temporada', 'Next season')}</span>
      </Btn>
      <p className="text-center text-[11px] font-semibold text-black/50 -mt-1">{note}</p>
      {/* 🔄 VENDER (T3+): dispensa reservas fracas — nunca abaixo do quinteto */}
      {canSell && (
        <>
          <button onClick={() => setShowSell(s => !s)} className="w-full rounded-xl border-2 border-black bg-white text-black font-black text-sm py-2 active:translate-y-0.5" style={OSWALD}>
            🔄 {showSell ? t('Fechar', 'Close') : t('Trocar reservas (vender)', 'Swap bench (sell)')}{nMarked > 0 ? ` · ${nMarked} 🗑️` : ''}
          </button>
          {showSell && (
            <div className="space-y-1 max-h-72 overflow-y-auto rounded-xl border-2 border-black bg-white p-2">
              <p className="text-[10px] font-semibold text-black/55 leading-snug px-0.5">{t('Dispense reservas fracas pra abrir vaga — nunca abaixo do quinteto. As vagas voltam no leilão de reservas da próxima temporada.', 'Release weak bench players to open slots — never below your five. Slots reopen in next season’s reserve auction.')}</p>
              {sellable.map(c => {
                const on = marked.has(c.id)
                return (
                  <button key={c.id} onClick={() => dispatch({ type: 'TOGGLE_NBA_RELEASE', cardId: c.id })}
                    className="w-full flex items-center justify-between gap-2 rounded-lg border-2 border-black px-2 py-1.5 active:translate-y-0.5"
                    style={{ background: on ? '#E8503A' : '#F4ECD6' }}>
                    <span className="font-black text-xs truncate" style={{ color: on ? '#fff' : INK }}>{posTag(c.pos)} · {c.name}</span>
                    <span className="text-[10px] font-black shrink-0" style={{ color: on ? '#fff' : '#999' }}>{on ? t('DISPENSADO 🗑️', 'RELEASED 🗑️') : t('dispensar', 'release')}</span>
                  </button>
                )
              })}
            </div>
          )}
        </>
      )}
      <Btn onClick={() => dispatch({ type: 'GO_LOBBY' })} className="w-full" bg="#fff">🏠 {t('Voltar ao início', 'Back home')}</Btn>
    </div>
  )
}
function CareerEndPanel() {
  const { state, dispatch } = useEsc()
  const div = state.careerDivision!
  const you = state.managers[state.youIdx]
  const table = sortedTable(state.league)
  const youPos = table.findIndex(t => t.id === you.id) + 1
  const nd = nextDivision(div, youPos)
  const [authOpen, setAuthOpen] = useState(false)
  const [exitAsk, setExitAsk] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // save da PRÓXIMA temporada (já com os rivais avançados na pirâmide). Determinístico.
  const pendingSave = useMemo(() => buildCareerSave(state), [])
  // quantos dos seus rivais estarão na SUA divisão na próxima temporada (só esses
  // dão lance no leilão). Se 0, um "trocar tudo" seria um leilão só seu, sem disputa.
  const nextRivalsHere = pendingSave ? (pendingSave.rivals ?? []).filter(r => r.division === pendingSave.division).length : 0

  // auto-salva ao CHEGAR na decisão de fim de temporada (com a decisão pendente).
  // Assim, se o jogador sair pra home/álbum sem clicar em nada, a carreira NÃO se
  // perde — ele retoma pelo "Continuar carreira" na home. Corrige o bug de
  // "campeão → escolher carta → voltou pra home → carreira sumiu".
  const autoSaved = useRef(false)
  useEffect(() => {
    if (autoSaved.current) return
    autoSaved.current = true
    if (pendingSave) saveCareer(pendingSave)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const doSave = async () => {
    const save = buildCareerSave(state); if (!save) return
    setBusy(true)
    const cloud = await saveCareer(save)
    setBusy(false)
    setMsg(cloud ? tr('✅ Carreira salva na sua conta!', '✅ Career saved to your account!') : tr('💾 Salva neste aparelho.', '💾 Saved on this device.'))
  }
  const onSaveClick = async () => {
    const { data } = await supabase.auth.getUser()
    if (data?.user) doSave()
    else setAuthOpen(true) // não logado → cadastro rápido
  }
  const wonA = div === 'A' && youPos === 1        // campeão da elite nesta temporada → nova estrela
  const totalA = state.careerTitlesA + (wonA ? 1 : 0)
  const banner = nd.result === 'up'
    ? { bg: '#1B7A3D', txt: `${tr('🔼 SUBIU PRA', '🔼 PROMOTED TO')} ${DIVISION_LABEL[nd.div].toUpperCase()}!` }
    : nd.result === 'down'
      ? { bg: '#E8503A', txt: `${tr('🔽 REBAIXADO PRA', '🔽 RELEGATED TO')} ${DIVISION_LABEL[nd.div].toUpperCase()}` }
      : { bg: '#2E6FB0', txt: `${tr('➡️ CONTINUA NA', '➡️ STAYS IN')} ${DIVISION_LABEL[div].toUpperCase()}` }

  return (
    <div className="space-y-2.5">
      {wonA && (
        <div className="rounded-2xl border-4 border-black p-3 text-center" style={{ background: 'linear-gradient(150deg,#FFE79A,#FFC400 45%,#E8A200 75%,#FFDD70)', boxShadow: `4px 4px 0 ${INK}` }}>
          <p className="font-black text-black text-2xl leading-none" style={OSWALD}>{tr('🏆 CAMPEÃO DA SÉRIE A!', '🏆 SÉRIE A CHAMPION!')}</p>
          <p className="font-black text-black/80 text-sm mt-1" style={OSWALD}>{aTitleLabel(totalA)}</p>
          <p className="mt-1"><CareerStars n={totalA} size={22} /></p>
        </div>
      )}
      <div className="rounded-2xl border-4 border-black p-3 text-center" style={{ background: banner.bg, boxShadow: `4px 4px 0 ${INK}` }}>
        <p className="font-black text-white text-xl" style={OSWALD}>{banner.txt}</p>
        <p className="font-bold text-white/80 text-xs mt-0.5">{DIVISION_LABEL[div]} · {tr('Temporada', 'Season')} {state.seasonNo} · {state.careerTitles} {state.careerTitles === 1 ? tr('título', 'title') : tr('títulos', 'titles')} {tr('na carreira', 'in the career')}{totalA > 0 && !wonA ? ` · ${totalA}⭐ Série A` : ''}</p>
      </div>
      <p className="text-center font-black text-sm text-black/60" style={OSWALD}>{tr('Como quer seguir?', 'How do you want to go on?')}</p>
      <Btn onClick={() => dispatch({ type: 'CAREER_ADVANCE', keep: true })} bg={GREEN} className="w-full text-lg"><span className="text-white">{tr('▶️ Continuar com o mesmo time', '▶️ Continue with the same team')}</span></Btn>
      {nextRivalsHere > 0 ? (
        <Btn onClick={() => dispatch({ type: 'CAREER_ADVANCE', keep: false })} className="w-full text-lg">{tr('🔄 Trocar tudo (novo leilão)', '🔄 Change everything (new auction)')}</Btn>
      ) : (
        <p className="text-center text-xs font-bold text-black/55 px-2">
          {getLang() === 'en'
            ? <>🔒 No rival of yours in {DIVISION_LABEL[nd.div]} this season — the auction doesn't open (it would be just you). You can <b>keep the same team</b>; when a rival gets promoted or relegated into your division, "change everything" comes back.</>
            : <>🔒 Sem rival seu na {DIVISION_LABEL[nd.div]} nesta temporada — o leilão não abre (seria só você). Dá pra <b>seguir com o mesmo time</b>; quando um rival subir ou cair pra sua divisão, o "trocar tudo" volta.</>}
        </p>
      )}
      <div className="flex gap-2">
        <div className="flex-1"><Btn onClick={onSaveClick} bg="#fff" className="w-full">{busy ? '...' : tr('💾 Salvar', '💾 Save')}</Btn></div>
        <div className="flex-1"><Btn onClick={() => setExitAsk(true)} bg="#fff" className="w-full">{tr('🚪 Sair', '🚪 Leave')}</Btn></div>
      </div>
      {msg && <p className="text-center text-sm font-black text-green-700" style={OSWALD}>{msg}</p>}

      {authOpen && <CareerAuthModal onClose={() => setAuthOpen(false)} onDone={() => { setAuthOpen(false); doSave() }} />}

      {exitAsk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,.7)' }}>
          <div className="w-full max-w-xs border-[3px] border-black rounded-2xl p-4 bg-[#F4ECD6]" style={{ boxShadow: `5px 5px 0 ${INK}` }}>
            <p className="font-black text-black text-lg" style={OSWALD}>{tr('🚪 Sair da carreira', '🚪 Leave the career')}</p>
            <p className="text-black/60 text-sm font-bold mb-3">{tr('Quer salvar antes de sair?', 'Save before leaving?')}</p>
            <div className="space-y-2">
              <button onClick={async () => { const sv = buildCareerSave(state); if (sv) await saveCareer(sv); setExitAsk(false); dispatch({ type: 'GO_LOBBY' }) }}
                className="w-full border-[3px] border-black rounded-xl py-2.5 font-black text-sm" style={{ background: GREEN, color: '#fff', ...OSWALD }}>{tr('💾 Salvar e sair', '💾 Save and leave')}</button>
              <button onClick={() => { setExitAsk(false); dispatch({ type: 'GO_LOBBY' }) }}
                className="w-full border-[3px] border-black rounded-xl py-2.5 font-black text-sm bg-white text-black" style={OSWALD}>{tr('🚪 Sair sem salvar', '🚪 Leave without saving')}</button>
              <button onClick={() => setExitAsk(false)}
                className="w-full border-2 border-black/20 rounded-xl py-2 font-black text-xs text-black/60" style={OSWALD}>{tr('Cancelar', 'Cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── FIM ─────────────────────────────────────────────────────────────
// Fim de jogo ONLINE rápido: votação (mesmo time × novo leilão) com presença
// visível. Todo mundo vota (mostra pro host quem tá online e o que quer); o
// HOST decide e começa quando quiser (nunca trava esperando ninguém). O host
// pode remover quem não decide e voltar pro menu das salas.
// 🗑️ AQUI MORAVA O `GrupoOnlineBox` (29/08, de manhã). O Diego mudou de lugar no
// mesmo dia, olhando a tela: *"sobre o WhatsApp, é pra aparecer aqui embaixo de
// atualizar lista, e de forma mais sutil. E não após acabar os jogos"*.
// Ele está certo por dois motivos: o fim da partida é hora de comemorar e votar o
// próximo jogo, não de ler oferta; e quem NÃO tem com quem jogar está justamente
// na lista de salas abertas, procurando. Agora ele mora em `lobby.tsx`, embaixo do
// 🔄 Atualizar lista, e bem mais discreto.
function OnlineEndVote({ awaitingCard }: { awaitingCard?: boolean }) {
  const { state, dispatch, kickPlayer, leaveRoom } = useEsc()
  const V = useT() // 🌐 BR/EN
  const enV = getLang() === 'en'
  // 🎫 identidade pelo CRACHÁ (manager.id), NÃO pela cadeira (youIdx) — quando o
  // host sai e os assentos escorregam, a cadeira muda de dono mas o crachá NÃO.
  // (correção 11/08: era `youId = state.youIdx`, o que trocava voto/nome de lugar)
  const youSeat = state.youIdx                          // 🪑 minha cadeira (só pra coisas por assento, ex.: duplas)
  const youId = state.managers[youSeat]?.id ?? youSeat  // 🎫 meu crachá (identidade fixa)
  const isHost = state.isHost
  const votes = state.seasonVotes ?? {}
  const myVote = votes[youId]
  const humans = state.managers.filter(m => m.isHuman)
  // o host é o DECISOR (não vota) — placar e chips contam só os convidados
  const guests = humans.filter(m => m.id !== youId)
  const nMesmo = guests.filter(m => votes[m.id] === 'mesmo').length
  const nLeilao = guests.filter(m => votes[m.id] === 'leilao').length
  const nVoted = nMesmo + nLeilao
  // 🐛 08/08 (print do Diego): "Chelsea FC saiu, mas embaixo dizia 'ainda não
  // votou' e o host ficou esperando". Quem SAIU da sala (sumiu da presença) não
  // entra mais na conta dos pendentes — voto de fantasma não segura ninguém.
  // A presença já é a régua do "🚪 saiu" na lista de cima; aqui usa a MESMA.
  const pendTodos = guests.filter(m => !votes[m.id])
  const vote = (v: 'mesmo' | 'leilao') => dispatch({ type: 'CAST_SEASON_VOTE', mgrId: youId, vote: v })
  // tem um campeão HUMANO (liga ou copa) que NÃO sou eu? (ex.: o host ganhou) — pode
  // estar pegando a carta dele; serve pra explicar pro resto por que ainda não começou.
  const leagueChampId = sortedTable(state.league)[0]?.id
  const copaChampId = state.quickCopa?.champion?.id
  const otherHumanChamp = [leagueChampId, copaChampId].some(id => id != null && id !== youId && state.managers.some(m => m.id === id && m.isHuman))
  // aviso do host quando ainda tem gente sem decidir: um mini-modal com 3 saídas
  // (esperar · começar com eles · excluir e começar). Se todos prontos, começa direto.
  const [askStart, setAskStart] = useState<'mesmo' | 'leilao' | null>(null)
  // 👥 QUEM AINDA ESTÁ NA SALA (pra ninguém decidir "jogar de novo" no escuro —
  // ex.: a sala era 10 e agora só tem 3). Presença via realtime (+ eu mesmo);
  // quem fechou o app aparece esmaecido como "saiu". A tag 👑 HOST vem do banco
  // (host_id → player_index) — é a fonte de verdade, inclusive após passar a coroa.
  // presença chega por CADEIRA (playerIndex) — converte pra CRACHÁ pra casar com m.id
  const present = new Set<number>([
    ...(state.presence ?? []).map(idx => state.managers[idx]?.id).filter((id): id is number => id != null),
    youId,
  ])
  const pend = pendTodos.filter(m => present.has(m.id)) // só quem está NA SALA segura o começo
  // 🤝 DUPLA (09/08, relato do Diego jogando com o Didico): o parceiro do HOST
  // compartilha o MESMO time (youId), então nunca aparece em `guests`/`pend` —
  // o host conseguia começar sem o parceiro ter votado, porque pro código
  // parecia que "só falta gente de fora". `votes[youId]` só é escrito pelo
  // PARCEIRO (o host não vota, decide) — então dá pra usar exatamente essa
  // chave pra saber se ele já confirmou.
  const myDupla = state.duplas?.[youSeat]
  const partnerPending = isHost && !!myDupla?.partnerUid && !myDupla.soloUid && !votes[youId]
  const podeComecarDireto = pend.length === 0 && !partnerPending
  const [hostId, setHostId] = useState<number | null>(isHost ? youId : null)
  useEffect(() => {
    if (!state.roomId) return
    ;(async () => {
      try {
        const [{ data: room }, { data: pls }] = await Promise.all([
          supabase.from('game_rooms').select('host_id').eq('id', state.roomId).maybeSingle(),
          supabase.from('room_players').select('user_id, player_index').eq('room_id', state.roomId),
        ])
        const hid = (room as { host_id?: string } | null)?.host_id
        const row = ((pls ?? []) as { user_id: string; player_index: number }[]).find(p => p.user_id === hid)
        if (row) setHostId(state.managers[row.player_index]?.id ?? row.player_index)
      } catch { /* sem tag de host — segue */ }
    })()
  }, [state.roomId, isHost])
  const startMesmo = () => dispatch({ type: 'REPLAY_SEASON' })
  // "Novo leilão": a MESMA galera segue na sala, com um leilão do zero (jogadores
  // novos) — SEM voltar pra sala de espera. O host monta e transmite; os
  // convidados seguem via SYNC_STATE. Fallback seguro: qualquer erro → fluxo
  // antigo (REMATCH volta pra sala), pra NUNCA travar o jogo dos jogadores.
  const startLeilao = async () => {
    if (!state.roomId) { dispatch({ type: 'REMATCH' }); return }
    try {
      const { data: auth } = await supabase.auth.getUser()
      const { data: pls } = await supabase.from('room_players').select('user_id, manager_name, player_index, dupla_partner_of, dupla_categories, dupla_name').eq('room_id', state.roomId).order('player_index')
      // 🛟 DEDUPLICA por usuário (reconexão/refresh no meio do jogo pode ter deixado
      // vaga DUPLICADA no banco) e usa a POSIÇÃO na lista limpa como número do
      // técnico — EXATAMENTE como o INÍCIO da sala faz. Sem isso, o "novo leilão"
      // montava os assentos numa ordem diferente do jogo 1 e o "quem sou eu" (youIdx)
      // deslizava pra um BOT (o bug do "virei o Biriba United"). Assim a ordem dos
      // assentos é IDÊNTICA à do jogo anterior e ninguém desliza.
      const sorted = ((pls ?? []) as { user_id: string; manager_name: string; player_index: number; dupla_partner_of?: string | null; dupla_categories?: Record<string, string> | null; dupla_name?: string | null }[])
      // 🤝 DUPLA (08/08, relato do Diego: "virei rival do meu parceiro no novo
      // leilão"): esse rebuild ignorava dupla_partner_of e transformava a linha do
      // PARCEIRO num time próprio — EXATAMENTE o mesmo cano que a sala de espera já
      // resolve. Espelhando aquele código: só DONO de assento vira time.
      const temDono = (uid?: string | null) => !!uid && sorted.some(d => d.user_id === uid && !d.dupla_partner_of)
      const donos = state.duplasMode ? sorted.filter(p => !temDono(p.dupla_partner_of)) : sorted
      const seen = new Set<string>()
      const semRepetir = donos.filter(p => (seen.has(p.user_id) ? false : (seen.add(p.user_id), true)))
      // 🚪 QUEM SAIU NÃO VOLTA (Diego 16/08 — relato jogando com dois amigos):
      // esta lista vem do BANCO (`room_players`), que guarda todo mundo que um dia
      // entrou na sala. Quem fechou o app continuava lá — então, no "novo leilão",
      // o amigo que tinha SAÍDO (e nem votou) ganhava um assento de novo e o
      // pregão ficava esperando o envelope de um fantasma. O host tinha que ir no
      // "gerenciar" e remover na mão, no meio do jogo.
      //
      // Régua: entra quem está ONLINE agora (presença) ou quem VOTOU (votar prova
      // que estava lá) — e o host sempre. É a mesma régua que a lista de cima da
      // tela usa pra marcar "🚪 saiu", então o que o host vê é o que acontece.
      //
      // 🛡️ Trava de segurança: se a presença não chegou (realtime caindo,
      // `presenceUids` vazio), NÃO corta ninguém — melhor um a mais, que o host
      // remove, do que cortar quem estava jogando.
      const uidsPresentes = new Set<string>((state.presenceUids ?? []).filter((u): u is string => !!u))
      // quem VOTOU: a linha do banco guarda o assento (`player_index`), e o voto é
      // guardado pelo crachá do técnico daquele assento — dá pra casar os dois.
      const uidsQueVotaram = new Set<string>()
      for (const p of sorted) {
        const crachá = state.managers[p.player_index]?.id
        if (crachá != null && (state.seasonVotes ?? {})[crachá]) uidsQueVotaram.add(p.user_id)
      }
      const meuUidAgora = auth?.user?.id
      // 🚪 REGRA DO DIEGO (09/09, sala do Futpoint): *"se o cara saiu na votação
      // então ele saiu de vez. Ele saiu da sala. Mesma coisa de apertar o botão
      // sair… quando o host reiniciar, começa com quem não saiu e votou"*.
      // Isto SUBSTITUI a trava de 23/08 ("só corta com a lista de crachás
      // COMPLETA"). Aquela trava fazia o corte NUNCA acontecer quando alguém fechava
      // o app: a vaga dele fica no banco, então a lista nunca fica completa. Foi
      // assim que o Dérick e o Florminense, marcados como "🚪 saiu" na tela,
      // entraram no leilão novo e travaram o setor esperando envelope de fantasma.
      // Régua nova = EXATAMENTE a que a tela mostra: quem aparece como "🚪 saiu"
      // (não está na presença nem por cadeira nem por crachá) e NÃO votou fica de
      // fora. Votar continua provando presença — cobre a presença que chega pela
      // metade, o caso de 23/08. O host vê na lista quem vai ficar de fora ANTES
      // de tocar, e o aviso de "X pessoas saíram e não entraram" continua saindo.
      // 🛡️ A única guarda que sobra: presença VAZIA (realtime morto) → não corta
      // ninguém, porque aí não dá pra afirmar nada sobre ninguém.
      const cadeiraPresente = (p: { player_index: number }) => present.has(state.managers[p.player_index]?.id ?? -1)
      const temPresenca = uidsPresentes.size > 0 || (state.presence ?? []).length > 0
      const uniq = temPresenca
        ? semRepetir.filter(p => p.user_id === meuUidAgora || uidsPresentes.has(p.user_id) || cadeiraPresente(p) || uidsQueVotaram.has(p.user_id))
        : semRepetir
      const cortados = semRepetir.length - uniq.length
      const duplas: Record<number, DuplaSeat> = {}
      const playerNames = uniq.map((p, i) => {
        if (!state.duplasMode) return p.manager_name
        const par = sorted.find(x => x.dupla_partner_of === p.user_id && x.user_id !== p.user_id)
        duplas[i] = {
          ownerUid: p.user_id, ownerName: p.manager_name,
          ...(par ? { partnerUid: par.user_id, partnerName: par.manager_name } : {}),
          ...(p.dupla_categories ? { cats: p.dupla_categories as DuplaSeat['cats'] } : {}),
        }
        if (!par) return p.manager_name
        const corta = (n: string) => { const c = n.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2B00}-\u{2BFF}]/gu, '').trim(); return c.length > 11 ? c.slice(0, 11).trim() : c }
        return (p.dupla_name || `${corta(p.manager_name)}|${corta(par.manager_name)}`)
      })
      // sobrou só o host na sala (ex.: excluiu o único convidado)? Leilão novo
      // precisa de 2+ — volta pra sala de espera pra chamar gente, sem travar.
      if (playerNames.length < 2) {
        try { await supabase.from('game_rooms').update({ status: 'waiting' }).eq('id', state.roomId) } catch { /* segue */ }
        try { alert(V('Você ficou sozinho na sala — o novo leilão precisa de pelo menos 2 pessoas. Te levei pra sala de espera: chama a galera por lá! 📣', 'You are alone in the room — a new auction needs at least 2 people. I took you to the waiting room: call the crew from there! 📣')) } catch { /* ignora */ }
        dispatch({ type: 'REMATCH' })
        return
      }
      if (cortados > 0) {
        // 📢 nada acontece no escuro: o host fica sabendo quem não entrou.
        try { alert(enV ? `${cortados === 1 ? 'One person left the room and did not join' : `${cortados} people left the room and did not join`} the new auction. If anyone comes back, just invite them again with the code. 👋` : `${cortados === 1 ? 'Uma pessoa saiu da sala e não entrou' : `${cortados} pessoas saíram da sala e não entraram`} no novo leilão. Se alguém voltar, é só chamar de novo pelo código. 👋`) } catch { /* ignora */ }
      }
      // 🪑 ARRUMA OS ASSENTOS NO BANCO ANTES DE REMONTAR (12/09, sala EHWPR4 do
      // Futpoint × Cajuri). O jogo novo numera os humanos pela POSIÇÃO na lista limpa
      // (0..n-1), mas as linhas do banco ficavam com o número VELHO: o Cajuri era o 3º
      // (player_index 2) na 1ª partida, o 2º saiu, e na 2ª ele virou o técnico id 1 —
      // só que a linha dele continuou "2". Tudo que casa assento ↔ pessoa pelo banco
      // (Copa do Mundo, reconexão, expulsão) passou a apontar pro BOT do id 2: o
      // Cajuri não entrou na fila da Copa (foi o Futpoint, 17º, escolher primeiro
      // sozinho) e o "Cajuri EC" ficou sem dono. É o MESMO acerto que o início da
      // sala já faz (lobby.tsx): quem saiu de vez perde a linha; quem fica é
      // renumerado na ordem da lista. Tudo best effort — se o banco falhar, o jogo
      // segue e o `seatUids` no estado ainda reancora todo mundo pelo crachá.
      try {
        const ficam = new Set(uniq.map(p => p.user_id))
        for (const p of semRepetir) {
          if (ficam.has(p.user_id)) continue
          await supabase.from('room_players').delete().eq('room_id', state.roomId).eq('user_id', p.user_id).then(() => {}, () => {})
        }
        for (let i = 0; i < uniq.length; i++) {
          if (uniq[i].player_index === i) continue
          // mira o USER_ID (único de verdade): parceiro de dupla compartilha o índice do dono
          await supabase.from('room_players').update({ player_index: i }).eq('room_id', state.roomId).eq('user_id', uniq[i].user_id).then(() => {}, () => {})
          if (state.duplasMode) {
            for (const par of sorted) if (par.dupla_partner_of === uniq[i].user_id && par.user_id !== uniq[i].user_id) await supabase.from('room_players').update({ player_index: i }).eq('room_id', state.roomId).eq('user_id', par.user_id).then(() => {}, () => {})
          }
        }
      } catch { /* best effort — o estado leva o seatUids de qualquer jeito */ }
      await supabase.from('game_rooms').update({ status: 'started' }).eq('id', state.roomId)
      // meu assento = a posição do meu DONO (se eu for parceiro, é o assento dele —
      // o time é o mesmo dos dois, igual a sala de espera já resolve).
      const meuUid = auth?.user?.id
      const meuDonoUid = meuUid && temDono(sorted.find(p => p.user_id === meuUid)?.dupla_partner_of) ? sorted.find(p => p.user_id === meuUid)!.dupla_partner_of! : meuUid
      const myPos = meuDonoUid ? uniq.findIndex(p => p.user_id === meuDonoUid) : -1
      dispatch({
        type: 'START_ONLINE',
        roomId: state.roomId, roomCode: state.roomCode, roomName: state.roomName,
        isHost: state.isHost, playerIndex: myPos >= 0 ? myPos : state.youIdx, // meu assento = minha posição na lista limpa
        playerNames, formation: state.managers[state.youIdx]?.formation ?? '4-3-3',
        duplasMode: state.duplasMode, duplas: state.duplasMode ? duplas : undefined, youUid: meuUid ?? state.youUid,
        seatUids: uniq.map(p => p.user_id), // 🪑 quem senta em cada assento — é por ISTO que o convidado se reancora no time certo
        deck: state.deckLeague, varzea: state.varzea, rematch: Date.now(), copaMode: state.copaMode, // 🥅 mantém a escolha da sala (deck E modo várzea — senão o "novo leilão" caía no padrão)
        // 🏆 a sala CONTINUA a contagem: o "novo leilão" é a próxima temporada da
        // mesma resenha, não um recomeço do zero. Sem isto o `seasonNo` voltava
        // pra 1 e a partida nova apagava a anterior no Hall da Fama.
        seasonNo: (state.seasonNo ?? 1) + 1,
        // 🎥 08/08 (relato do Diego): o "novo leilão" ESQUECIA o modo stream — a sala
        // começou com valores escondidos e, na revanche, os lances apareciam. O
        // START_ONLINE zera o que não vier na ação, então TODAS as escolhas da sala
        // precisam ir junto de novo (stream, manual, chat, tempo, liga fechada, senha).
        stream: state.streamMode, manual: state.manualRoom, chatOff: state.chatOff,
        auctionSecs: state.auctionSecs, ligaFechada: state.ligaFechada,
        locked: state.locked, pwHash: state.pwHash,
      })
    } catch { dispatch({ type: 'REMATCH' }) }
  }
  const voteBtn = (v: 'mesmo' | 'leilao', label: string, bg: string, fg: string) => (
    <button onClick={() => vote(v)} className="flex-1 rounded-xl border-[3px] border-black py-3 font-black text-sm relative active:translate-y-0.5"
      style={{ background: myVote === v ? bg : '#fff', color: myVote === v ? fg : '#000', boxShadow: myVote === v ? `3px 3px 0 ${INK}` : 'none', ...OSWALD }}>
      {myVote === v && <span className="absolute top-1 right-2 text-xs">✓</span>}{label}
    </button>
  )
  const exitLeave = () => {
    const msg = isHost
      ? V('Sair da sala? O comando (host) passa pra outra pessoa. Se estiver sozinho, a sala é apagada.', 'Leave the room? Command (host) passes to someone else. If you are alone, the room is deleted.')
      : V('Sair da sala? Você será removido desta partida.', 'Leave the room? You will be removed from this match.')
    if (window.confirm(msg)) leaveRoom()
  }
  return (
    <div className="online-end-vote rounded-2xl border-4 border-black p-3 space-y-2.5" style={{ background: 'linear-gradient(160deg,#C9A9FF,#8B5CF6 52%,#5B2FB0)', boxShadow: `4px 4px 0 ${INK}` }}>
      <p className="font-black text-lg text-center" style={{ ...OSWALD, color: '#fff', textShadow: '1px 1px 0 rgba(0,0,0,.35)' }}>{V('🗳️ E agora?', '🗳️ What now?')}</p>
      {/* 👥 quem está na sala — igual à sala de espera: bolinha no DEGRADÊ do tier
          de cada um (com brilho), nome, 👑 HOST e status (na sala / saiu). */}
      {humans.length > 0 && (
        <div className="online-vote-people rounded-xl border-2 border-black px-3 py-2" style={{ background: 'rgba(255,255,255,.95)' }}>
          <p className="text-[10px] font-black uppercase tracking-widest text-black/50 mb-1.5" style={OSWALD}>{V('👥 Na sala agora', '👥 In the room now')} · {humans.filter(m => present.has(m.id)).length}/{humans.length}</p>
          <div className="space-y-1.5">
            {humans.map(m => {
              const pk = (m.id === youId ? myApoioPerk() : perkFromSelo(m.teamName)) ?? APOIO_PERKS.bege
              const here = present.has(m.id)
              return (
                <div key={m.id} className="online-vote-person flex items-center gap-2" style={{ opacity: here ? 1 : 0.45 }}>
                  <div className="w-7 h-7 rounded-full border-2 border-black flex items-center justify-center text-xs font-black shrink-0" style={{ background: pk.grad, color: TIER_INK[pk.tier], position: 'relative', overflow: 'hidden' }}>
                    <span style={{ position: 'relative', zIndex: 2 }}>{stripEmoji(m.teamName).trim()[0]?.toUpperCase() ?? '?'}</span>
                    {pk.holo > 0 && <ApoioSheen holo={pk.holo} dur={2.6} />}
                  </div>
                  <span className="font-black text-[13px] text-black flex-1 truncate" style={OSWALD}>{m.teamName}{m.id === youId ? V(' (você)', ' (you)') : ''}</span>
                  {hostId === m.id && <span className="text-[9px] font-black uppercase bg-yellow-400 border border-black px-1.5 py-0.5 rounded-full shrink-0">👑 HOST</span>}
                  {/* status: saiu · voto de cada um (▶️/🔨) · ainda não votou. Host não vota (decide). */}
                  {(() => {
                    if (!here) return <span className="text-[10px] font-black shrink-0" style={{ ...OSWALD, color: '#8a8672' }}>{V('🚪 saiu', '🚪 left')}</span>
                    if (m.id === hostId) return <span className="text-[10px] font-black shrink-0" style={{ ...OSWALD, color: '#166534' }}>{V('🟢 na sala', '🟢 in the room')}</span>
                    const v = votes[m.id]
                    return v
                      ? <span className="text-[10px] font-black shrink-0" style={{ ...OSWALD, color: '#166534' }}>{v === 'mesmo' ? V('✅ ▶️ mesmo time', '✅ ▶️ same team') : V('✅ 🔨 novo leilão', '✅ 🔨 new auction')}</span>
                      : <span className="text-[10px] font-black shrink-0" style={{ ...OSWALD, color: '#92600A' }}>{V('⏳ não votou ainda…', '⏳ hasn\'t voted yet…')}</span>
                  })()}
                </div>
              )
            })}
          </div>
        </div>
      )}
      {awaitingCard ? (
        // 🎁 Jeito 1: você foi campeão e ainda não abriu a carta — trava o voto/começar
        // até pegar, pra NUNCA trocar de tela e perder a carta.
        <div className="rounded-xl border-[3px] border-black px-3 py-3 text-center" style={{ background: '#FFF7DE', boxShadow: `3px 3px 0 ${INK}` }}>
          <p className="font-black text-sm" style={{ ...OSWALD, color: '#92600A' }}>{V('🎁 Pega tua carta de campeão primeiro!', '🎁 Grab your champion card first!')}</p>
          <p className="text-[11px] font-bold text-black/65 mt-0.5">{enV ? `Tap the pack up top to open it. After that ${isHost ? 'starting the next one' : 'your vote'} unlocks — so nobody loses a card.` : `Toque no pacote lá em cima pra abrir. Depois disso libera ${isHost ? 'o começar a próxima' : 'o seu voto'} — assim ninguém perde carta.`}</p>
        </div>
      ) : isHost ? (
        <>
          <p className="text-center text-xs font-bold text-white/85">{enV ? <>Keep the <b>same team</b> or open a <b>new auction</b>? You (host) decide 👇</> : <>Seguir com o <b>mesmo time</b> ou abrir um <b>novo leilão</b>? Você (host) decide 👇</>}</p>
          {/* prontidão da galera (só os convidados): nome grande + PRONTO claro */}
          {guests.length > 0 && (
            <div className="online-vote-repeat space-y-1.5">
              {guests.map(m => { const v = votes[m.id]; const here = present.has(m.id); return (
                <div key={m.id} className="flex items-center justify-between rounded-xl border-2 border-black px-3 py-2" style={{ background: v ? '#DCFCE7' : here ? '#FFF7DE' : '#EFEAD9', opacity: v || here ? 1 : 0.6 }}>
                  <span className="font-black text-sm text-black" style={OSWALD}>{v ? '✅' : here ? '⏳' : '🚪'} {m.teamName}</span>
                  <span className="text-[11px] font-black" style={{ ...OSWALD, color: v ? '#166534' : here ? '#92600A' : '#8a8672' }}>
                    {v ? (enV ? `READY · wants ${v === 'mesmo' ? '▶️ same team' : '🔨 new auction'}` : `PRONTO · quer ${v === 'mesmo' ? '▶️ mesmo time' : '🔨 novo leilão'}`) : here ? V('ainda não votou…', 'hasn\'t voted yet…') : V('saiu da sala — não segura o começo', 'left the room — doesn\'t hold up the start')}
                  </span>
                </div>
              )})}
              <p className="text-center text-[11px] font-black text-white/75" style={OSWALD}>{nVoted}/{guests.length} {V('prontos', 'ready')} · ▶️ {nMesmo} · 🔨 {nLeilao}</p>
            </div>
          )}
          {pend.length > 0 && (
            <p className="text-center text-[11.5px] font-black" style={{ color: '#FFE08A', ...OSWALD }}>{enV ? `⏳ Waiting for ${pend.map(m => m.teamName).join(', ')} to vote…` : `⏳ Aguardando ${pend.map(m => m.teamName).join(', ')} votar${pend.length > 1 ? 'em' : ''}…`}</p>
          )}
          {partnerPending && (
            <p className="text-center text-[11.5px] font-black" style={{ color: '#FFE08A', ...OSWALD }}>{V(`🤝 Aguardando seu parceiro (${myDupla?.partnerName}) votar…`, `🤝 Waiting for your partner (${myDupla?.partnerName}) to vote…`)}</p>
          )}
          <Btn onClick={() => podeComecarDireto ? startMesmo() : setAskStart('mesmo')} bg={podeComecarDireto ? GREEN : '#cfc6ae'} className="w-full text-lg"><span className={podeComecarDireto ? 'text-white' : 'text-black/50'}>{podeComecarDireto ? '▶️' : '🔒'} {V('Começar (mesmo time)', 'Start (same team)')}</span></Btn>
          <Btn onClick={() => podeComecarDireto ? startLeilao() : setAskStart('leilao')} bg={podeComecarDireto ? GOLD : '#cfc6ae'} className="w-full text-lg"><span className={podeComecarDireto ? '' : 'text-black/50'}>{podeComecarDireto ? '🔨' : '🔒'} {V('Abrir novo leilão', 'Open a new auction')}</span></Btn>
          {!podeComecarDireto && (
            <p className="text-center text-[10px] font-bold text-white/70">{V('O começo destrava quando todo mundo votar — ou toque num botão pra decidir o que fazer.', 'The start unlocks once everyone has voted — or tap a button to decide what to do.')}</p>
          )}
        </>
      ) : (
        <>
          <p className="text-center text-xs font-bold text-white/85">{V('Vote no que você quer — o host começa quando decidir.', 'Vote for what you want — the host starts when they decide.')}</p>
          <div className="flex gap-2">
            {voteBtn('mesmo', V('▶️ Mesmo time', '▶️ Same team'), GREEN, '#fff')}
            {voteBtn('leilao', V('🔨 Novo leilão', '🔨 New auction'), GOLD, '#000')}
          </div>
          {myVote ? (
            <div className="rounded-xl border-[3px] border-black px-3 py-2.5 text-center" style={{ background: '#DCFCE7', boxShadow: `3px 3px 0 ${INK}` }}>
              <p className="font-black text-sm" style={{ ...OSWALD, color: '#166534' }}>{V('✅ VOCÊ ESTÁ PRONTO!', '✅ YOU ARE READY!')}</p>
              <p className="text-[11px] font-bold text-black/60">{enV ? `You voted ${myVote === 'mesmo' ? '▶️ same team' : '🔨 new auction'} · waiting for the host to start (you can switch)` : `Votou em ${myVote === 'mesmo' ? '▶️ mesmo time' : '🔨 novo leilão'} · esperando o host começar (dá pra trocar)`}</p>
            </div>
          ) : (
            <p className="text-center text-sm font-black" style={{ color: '#FFDD70', ...OSWALD, textShadow: '1px 1px 0 rgba(0,0,0,.35)' }}>{V('👆 Toque no seu voto pra ficar PRONTO!', '👆 Tap your vote to be READY!')}</p>
          )}
          {/* explica a espera quando um campeão (às vezes o próprio host) tá pegando a carta */}
          {otherHumanChamp && <p className="text-[11px] font-bold text-center mt-1" style={{ color: '#FFE08A' }}>{V('🏆 Um campeão está pegando a carta dele — o host começa logo depois. Segura aí!', '🏆 A champion is grabbing their card — the host starts right after. Hang tight!')}</p>}
        </>
      )}
      {/* saídas — uma linha só, discreta, pra todos */}
      <div className="flex items-center justify-center gap-6 pt-2 mt-1 border-t-2 border-white/20">
        <button onClick={() => dispatch({ type: 'GO_LOBBY_ONLINE' })} className="text-white/70 text-xs font-bold underline active:opacity-60" title={V('Sai pro menu mas continua na sala — dá pra voltar', 'Goes to the menu but stays in the room — you can come back')}>{V('🏠 Voltar pro menu', '🏠 Back to menu')}</button>
        <button onClick={exitLeave} className="text-white/70 text-xs font-bold underline active:opacity-60" title={V('Sai da sala de vez', 'Leaves the room for good')}>{V('🚪 Sair da sala', '🚪 Leave the room')}</button>
      </div>

      {/* modal do host: alguém ainda não decidiu — esperar, começar com eles, ou excluir */}
      {askStart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,.7)' }}>
          <div className="w-full max-w-xs border-[3px] border-black rounded-2xl p-4 bg-[#F4ECD6]" style={{ boxShadow: `5px 5px 0 ${INK}` }}>
            <p className="font-black text-black text-lg" style={OSWALD}>{V('🔒 Nem todo mundo votou ainda', '🔒 Not everyone has voted yet')}</p>
            <p className="text-black/65 text-sm font-bold mb-3">
              {pend.length > 0 && <>{enV ? 'Still to vote: ' : pend.length === 1 ? 'Ainda falta votar: ' : 'Ainda faltam votar: '}<b>{pend.map(m => m.teamName).join(', ')}</b>{partnerPending ? V(' e ', ' and ') : '. '}</>}
              {partnerPending && <>{V('seu parceiro', 'your partner')} <b>{myDupla?.partnerName}</b>. </>}
              {V('O começo fica travado até todo mundo votar. O que você quer fazer?', 'The start stays locked until everyone votes. What do you want to do?')}
            </p>
            <div className="space-y-2">
              <button onClick={() => setAskStart(null)}
                className="w-full border-[3px] border-black rounded-xl py-2.5 font-black text-sm" style={{ background: GREEN, color: '#fff', ...OSWALD }}>{V('⏳ Aguardar mais um pouco', '⏳ Wait a little longer')}</button>
              {pend.map(m => (
                <button key={m.id} onClick={async () => { const k = askStart; setAskStart(null); if (!window.confirm(V(`Remover ${m.teamName} da partida?`, `Remove ${m.teamName} from the match?`))) return; kickPlayer(m.id); if (pend.length === 1 && !partnerPending) { await new Promise(r => setTimeout(r, 500)); k === 'mesmo' ? startMesmo() : startLeilao() } }}
                  className="w-full border-[3px] border-black rounded-xl py-2.5 font-black text-sm bg-white" style={{ color: '#B23B2E', ...OSWALD }}>{V('✂️ Excluir', '✂️ Remove')} {m.teamName}{pend.length === 1 && !partnerPending ? V(' e começar', ' and start') : ''}</button>
              ))}
              {pend.length > 1 && (
                <button onClick={async () => { const k = askStart; setAskStart(null); if (!window.confirm(V(`Remover ${pend.map(m => m.teamName).join(', ')} da partida?`, `Remove ${pend.map(m => m.teamName).join(', ')} from the match?`))) return; pend.forEach(m => kickPlayer(m.id)); if (!partnerPending) { await new Promise(r => setTimeout(r, 500)); k === 'mesmo' ? startMesmo() : startLeilao() } }}
                  className="w-full border-[3px] border-black rounded-xl py-2.5 font-black text-sm bg-white" style={{ color: '#B23B2E', ...OSWALD }}>{V('✂️ Excluir TODOS que faltam', '✂️ Remove EVERYONE missing')}{partnerPending ? '' : V(' e começar', ' and start')}</button>
              )}
              {/* 🤝 parceiro não é "excluído" — é o time do próprio host. Só dá pra
                  esperar ou assumir e começar mesmo assim (nunca trava o jogo).
                  Só aparece quando o parceiro é a ÚNICA pendência — se ainda falta
                  gente de fora, resolve isso primeiro (reabre este modal depois). */}
              {partnerPending && pend.length === 0 && (
                <button onClick={() => { const k = askStart; setAskStart(null); k === 'mesmo' ? startMesmo() : startLeilao() }}
                  className="w-full border-[3px] border-black rounded-xl py-2.5 font-black text-sm bg-white" style={{ color: '#92600A', ...OSWALD }}>
                  {V(`▶️ Começar mesmo assim (sem esperar ${myDupla?.partnerName})`, `▶️ Start anyway (without waiting for ${myDupla?.partnerName})`)}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── 🃏 BAFO · A CASCATA (o prêmio do modo) ──────────────────────────────────
// Regra fechada com o Diego (17/08), nas palavras dele: "c 5 por exemplo, o 5
// perde pro 4, o 4 perde pro 3, o 3 perde pro 2, e o segundo perde pro 1. E o 1
// não perde pra ninguém." Ou seja: cada um paga UMA carta pro que ficou logo
// acima. O 1º só recebe; o último só paga.
//
// 🎲 A carta é SORTEADA (ninguém escolhe) entre as cartas DAQUELA carreira que
//    entrou na sala — nunca do álbum inteiro da pessoa.
// 🛡️ PISO DE 1: ninguém zera. Quem só tem uma carta naquela carreira não
//    entrega nada — a CASA cobre e o vencedor ganha uma carta nova do baralho.
// 🔒 Quem fecha a cascata é o HOST, UMA vez por sala (trava no banco). Todo
//    mundo lê o MESMO resultado gravado — ninguém vê uma versão diferente.
// 🏷️ A carta não é copiada: ela troca de dono de verdade (o servidor muda o
//    user_id da linha) e fica marcada com de quem foi arrancada.
interface BafoTroca {
  de: string; para: string; deNome: string; paraNome: string
  casa: boolean; key: string
  carta: { name: string; club: string; year: number; pos: string; fame: number }
}
function BafoCascata() {
  const { state } = useEsc()
  const [trocas, setTrocas] = useState<BafoTroca[] | null>(null)
  const [erro, setErro] = useState('')
  const [esperou, setEsperou] = useState(false) // convidado cansou de esperar o host fechar
  const rodou = useRef(false)   // o host só dispara UMA vez por montagem
  const aplicado = useRef(false) // e o cofre local só é mexido UMA vez

  // a fila da cascata: a classificação final, SÓ com quem trouxe time de carreira
  // (bot no meio da tabela não entra — a cascata é entre a galera).
  const fila = useMemo(() => {
    const donos = state.bafoDonos ?? {}
    return sortedTable(state.league)
      .map(t => ({ t, dono: donos[t.id] }))
      .filter((x): x is { t: typeof x.t; dono: NonNullable<typeof x.dono> } => !!x.dono)
      .map(({ t, dono }) => ({ mgrId: t.id, nome: t.name, ...dono }))
  }, [state.league, state.bafoDonos])

  // HOST: fecha a cascata no servidor. Manda também uma carta "da casa" por
  // possível vencedor (uma que ele ainda NÃO tem) pro caso do piso de 1 — o
  // servidor não conhece o baralho, quem conhece é o jogo.
  useEffect(() => {
    if (!state.isHost || rodou.current || fila.length < 2 || !state.roomId) return
    rodou.current = true
    ;(async () => {
      try {
        const uids = fila.map(f => f.uid)
        const { data: donas } = await supabase.from('user_cards').select('user_id, card_name').in('user_id', uids)
        const tem = new Map<string, Set<string>>()
        for (const r of (donas ?? []) as { user_id: string; card_name: string }[]) {
          if (!tem.has(r.user_id)) tem.set(r.user_id, new Set())
          tem.get(r.user_id)!.add(r.card_name)
        }
        const casa: Record<string, { name: string; club: string; year: number; pos: string; fame: number }> = {}
        for (const f of fila.slice(0, -1)) { // todo mundo menos o último pode receber
          const meu = tem.get(f.uid) ?? new Set<string>()
          const faltam = ALL_POOL.filter(c => !meu.has(c.name))
          const p = (faltam.length ? faltam : ALL_POOL)[Math.floor(Math.random() * (faltam.length || ALL_POOL.length))]
          if (p) casa[f.uid] = { name: p.name, club: p.club, year: p.year, pos: p.pos, fame: p.fame }
        }
        const { data, error } = await supabase.rpc('bafo_cascata', { p_room: state.roomId, p_ordem: uids, p_casa: casa })
        if (error) throw error
        setTrocas((data ?? []) as BafoTroca[])
      } catch {
        setErro('Não deu pra fechar o Bafo agora — a internet oscilou. Nenhuma carta trocou de dono. Volte a esta tela pra tentar de novo.')
        rodou.current = false
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isHost, fila.length, state.roomId])

  // TODO MUNDO (host incluído): lê o resultado gravado. É a MESMA fonte pra
  // todos — ninguém vê uma cascata diferente da do vizinho.
  useEffect(() => {
    if (trocas || !state.roomId) return
    let vivo = true, voltas = 0
    const olha = async () => {
      const { data } = await supabase.from('esc_bafo_trocas').select('trocas').eq('room_id', state.roomId).maybeSingle()
      const t = (data?.trocas ?? null) as BafoTroca[] | null
      if (vivo && t && t.length) { setTrocas(t); return true }
      return false
    }
    const iv = setInterval(async () => {
      voltas++
      if (await olha()) { clearInterval(iv); return }
      // desistiu de esperar: quase sempre é o host que saiu antes de fechar.
      // Diz a verdade em vez de girar pra sempre — e o caminho de volta.
      if (voltas > 40) { clearInterval(iv); if (vivo && !state.isHost) setEsperou(true) }
    }, 2500)
    void olha()
    return () => { vivo = false; clearInterval(iv) }
  }, [trocas, state.roomId, state.isHost])

  // 🃏 e agora o ÁLBUM DA CARREIRA, no aparelho: sai de um, entra no outro.
  // Cada aparelho aplica só o que é DELE — nunca mexe na carreira de ninguém.
  useEffect(() => {
    if (!trocas || aplicado.current) return
    const eu = state.youUid
    const minha = state.bafoDonos?.[state.managers[state.youIdx]?.id ?? -1]
    if (!eu || !minha) return
    aplicado.current = true
    for (const t of trocas) {
      if (t.de === eu && !t.casa) patchCareerCofre(minha.seed, t.key, t.carta, null)
      if (t.para === eu) patchCareerCofre(minha.seed, t.key, null, { ...t.carta, pos: t.carta.pos as Sector })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trocas])

  if (fila.length < 2) return null
  const eu = state.youUid
  return (
    <Box bg="#FFF6D6" className="p-4 space-y-2.5" shadow={6}>
      <p className="font-black text-xl text-center" style={OSWALD}>🃏 BAFO · A HORA DA VERDADE</p>
      <p className="text-[11.5px] font-bold text-center text-black/60 leading-snug">
        Quem ficou atrás entrega <b>uma carta</b> da carreira que trouxe pro time logo acima. O 1º só recebe. A carta <b>troca de dono de verdade</b>: sai do álbum daquela carreira e entra no álbum da carreira do outro.
      </p>

      {erro && (
        <div className="border-[2.5px] border-black rounded-xl p-2.5" style={{ background: '#FFF1E8' }}>
          <p className="text-[11.5px] font-bold leading-snug" style={{ color: '#8E2A1B' }}>⚠️ {erro}</p>
        </div>
      )}

      {!trocas && !erro && !esperou && (
        <div className="border-[2.5px] border-black rounded-xl py-3 text-center font-black" style={{ background: '#fff', ...OSWALD }}>
          ⏳ Separando as cartas…
        </div>
      )}

      {!trocas && esperou && (
        <div className="border-[2.5px] border-black rounded-xl p-2.5" style={{ background: '#FFF1E8' }}>
          <p className="text-[11.5px] font-bold leading-snug" style={{ color: '#8E2A1B' }}>
            ⏳ O Bafo ainda não foi fechado — quem fecha é o host, e ele precisa chegar nesta tela. <b>Nenhuma carta trocou de dono</b> até agora. Se ele voltar, some sozinho.
          </p>
        </div>
      )}

      {trocas?.map((t, i) => {
        const euPerdi = t.de === eu
        const euGanhei = t.para === eu
        const cor = euGanhei ? GREEN : euPerdi ? RED : INK
        return (
          <div key={t.key ?? i} className="rounded-xl p-3" style={{ border: `3px solid ${cor}`, background: '#fff', boxShadow: `3px 3px 0 0 ${cor}` }}>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-[13px] truncate flex-1" style={OSWALD}>{t.deNome}{euPerdi && ' (você)'}</span>
              <span className="font-black text-[15px] shrink-0">➜</span>
              <span className="font-black text-[13px] truncate flex-1 text-right" style={OSWALD}>{t.paraNome}{euGanhei && ' (você)'}</span>
            </div>
            <div className="flex justify-center mt-2">
              <CollectibleCard name={t.carta.name} club={t.carta.club} year={t.carta.year} pos={t.carta.pos} fame={t.carta.fame} />
            </div>
            <p className="text-[10.5px] font-bold text-center mt-2 leading-snug" style={{ color: t.casa ? '#8E6A00' : cor }}>
              {t.casa
                ? <>🏠 <b>{t.deNome}</b> só tinha uma carta nessa carreira — ninguém zera, então a <b>casa cobriu</b> e a carta saiu do baralho.</>
                : euGanhei ? <>🏆 Arrancada do <b>{t.deNome}</b> — a carta é sua e já está no álbum desta sua carreira.</>
                : euPerdi ? <>💔 Foi pro <b>{t.paraNome}</b>. Saiu do álbum desta carreira — volte no Bafo pra buscar de volta.</>
                : <>Arrancada do <b>{t.deNome}</b>.</>}
            </p>
          </div>
        )
      })}

      {trocas && (
        <p className="text-[10.5px] font-bold text-center text-black/50 leading-snug">
          🥇 <b>{fila[0].nome}</b> não entregou carta pra ninguém.
        </p>
      )}
    </Box>
  )
}

export function EscEnd() {
  const { state, dispatch } = useEsc()
  const previewEnd = useOnlinePreview()
  const privateEnd = (previewEnd || publicOnlineVisual(state)) && state.sport !== 'basquete'
  const [manualPref] = useSimMode()
  const [streamManual] = useStreamSimMode()
  const [endLang] = useLang()
  const bbEnd = state.sport === 'basquete' // 🏀 no basquete a "Copa dos 8" vira "Playoffs"
  // 🌐 BR/EN (11/09): valia só pro basquete; agora o fim de jogo do futebol também lê o idioma
  const LE = (pt: string, en: string) => endLang === 'en' ? en : pt
  const you = state.managers[state.youIdx]
  const table = sortedTable(state.league)
  const champ = table[0]
  const youPos = table.findIndex(t => t.id === you.id) + 1
  const youWon = champ.id === you.id
  const online = state.onlineMode === 'online'
  // 🐊 FESTÃO DA MASCOTE (aprovado no GIF): só o CAMPEÃO vê, pós-apito, 1x por
  // temporada (sessionStorage), toque pula. Diego 11/08: valia só pro campeão
  // da LIGA — ganhar a COPA DOS 8 (mata-mata) não disparava a festa. Agora os
  // dois contam ("por quem vê": compara com o MEU id, não o flag .you global,
  // que no online marca todo humano igual).
  const meuSoc = useMeuSocio()
  const wonCopaRapido = state.quickCopa?.champion?.id === you.id
  const mascKey = (youWon || wonCopaRapido) && meuSoc?.ativo && meuSoc.mascoteKey && MASCOTES[meuSoc.mascoteKey] ? meuSoc.mascoteKey : null
  const festaKey = `esc-festa-${state.seed}-${state.seasonNo}`
  const [festaOn, setFestaOn] = useState(false)
  useEffect(() => {
    if (!mascKey) return
    try { if (sessionStorage.getItem(festaKey) === '1') return } catch { /* segue */ }
    setFestaOn(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mascKey])
  const fecharFesta = () => { setFestaOn(false); try { sessionStorage.setItem(festaKey, '1') } catch { /* segue */ } }
  const canRestart = !online || state.isHost
  // streamHost = SÓ stream (usado na carta compartilhada do campeão). hostPaced =
  // host controla o ritmo (stream OU sala manual) — é quem decide começar a Copa.
  const streamHost = online && state.streamMode && state.isHost
  const hostPaced = online && state.isHost && (state.streamMode || !!state.manualRoom)
  const manual = hostPaced ? streamManual : (manualPref && !online)
  const myScorer = topScorers(state, 1)[0]
  // 🏆 Copa dos 8: liga acabou com Copa marcada e ainda não começou nenhuma
  // partida dela — mostra o chaveamento explicando + botão (ou cronômetro no
  // modo automático) antes de entrar na Copa.
  // 📌 Este comentário DIZIA que o cronômetro daqui é maior que o da carta pra
  // não trocar de tela antes de a carta gravar. Isso está velho duas vezes: a
  // trava foi solta em 30/07 (a carta grava assim que o cara vira campeão, não
  // depende de relógio nenhum) e em 27/08 o relógio da carta deixou de existir.
  // Ou seja: os 30s aqui são só o tempo de olhar o chaveamento — não seguram
  // carta de ninguém.
  const COPA_GATE_S = 30 // quadro "COPA DOS 8 · fica ligado" (mostra o chaveamento) antes de começar
  const copaPending = !!state.quickCopa && state.quickCopa.phase !== 'done'
  // 🌎 LIBERTADORES: a liga acabou numa sala 'liga_liberta' e a fase de grupos
  // ainda não começou → entra o BANNERZÃO de abertura (pedido do Diego 20/08:
  // *"o banner grande da libertadores c visual bonito e brilhante e c as regras…
  // e dps de 30s de contagem se inicia ou o host aperta o avançar tb"*). Mesmos
  // 30 segundos do gate da Copa, pelo mesmo motivo: dá folga pra carta da liga
  // terminar de gravar antes de trocar de tela.
  const libPending = !!state.liberta && state.liberta.fase === 'grupos' && state.liberta.rodada === 0
  // online: só o HOST puxa a Copa (e sincroniza pra sala). Solo: o próprio cliente.
  const canDriveCopa = !online || state.isHost
  // 🎥 streamRoom = SÓ stream (carta compartilhada do campeão). pacedRoom = sala com
  // ritmo do host (stream OU manual): SEM cronômetro pra ninguém — o host decide
  // quando começa a Copa (pra todo mundo). Vale pra host E convidados.
  const streamRoom = online && state.streamMode
  const pacedRoom = online && (state.streamMode || !!state.manualRoom)
  const [copaLeft, setCopaLeft] = useState(COPA_GATE_S)
  const copaFiredRef = useRef(false)
  useEffect(() => {
    if (!copaPending || manual || pacedRoom) return
    copaFiredRef.current = false
    setCopaLeft(COPA_GATE_S)
    const t0 = Date.now()
    const iv = setInterval(() => {
      const left = Math.max(0, COPA_GATE_S - Math.floor((Date.now() - t0) / 1000))
      setCopaLeft(left)
      // cronômetro aparece pra todos (visual); só o host/solo DISPARA (evita corrida no online)
      if (left <= 0 && !copaFiredRef.current && canDriveCopa) { copaFiredRef.current = true; dispatch({ type: 'START_COPA' }) }
    }, 250)
    return () => clearInterval(iv)
  }, [copaPending, manual, dispatch, canDriveCopa, pacedRoom])
  // 🌎 mesma mecânica pro bannerzão da Libertadores: o cronômetro aparece pra
  // TODO MUNDO (é visual), mas só quem conduz DISPARA — senão dois clientes
  // mandavam começar ao mesmo tempo.
  const [libLeft, setLibLeft] = useState(COPA_GATE_S)
  const libFiredRef = useRef(false)
  useEffect(() => {
    if (!libPending || manual || pacedRoom) return
    libFiredRef.current = false
    setLibLeft(COPA_GATE_S)
    const t0 = Date.now()
    const iv = setInterval(() => {
      const left = Math.max(0, COPA_GATE_S - Math.floor((Date.now() - t0) / 1000))
      setLibLeft(left)
      if (left <= 0 && !libFiredRef.current && canDriveCopa) { libFiredRef.current = true; dispatch({ type: 'START_LIBERTA' }) }
    }, 250)
    return () => clearInterval(iv)
  }, [libPending, manual, dispatch, canDriveCopa, pacedRoom])
  // carta-lembrança que o campeão escolheu (entra na imagem de compartilhar)
  const [myCard, setMyCard] = useState<WonCard | null>(null)
  // Jeito 1: no online, o campeão precisa ABRIR a carta antes de poder votar/começar
  // — assim ninguém perde carta por trocar de tela antes de pegar. 'picking' = ainda
  // não abriu; qualquer outro status (revelado, sem conta) não trava.
  const [ligaCardStatus, setLigaCardStatus] = useState('')
  const [copaCardStatus, setCopaCardStatus] = useState('')
  // 🔓 A trava foi SOLTA (decisão do Diego 30/07): a carta agora é gravada na conta
  // ASSIM QUE o campeão vira campeão (não depende mais de abrir), então ninguém
  // perde carta e a sala não precisa esperar. "Amigo ganhou não trava ninguém."
  // (Mantido o wiring de status só por compatibilidade — não bloqueia mais.)
  void ligaCardStatus; void copaCardStatus
  const awaitingCard = false
  const featured = youWon ? (myCard ?? [...you.squad].sort((a, b) => (b.lo + b.hi) - (a.lo + a.hi))[0]) : undefined
  const shareOpts: ShareOpts = {
    teamName: you.teamName, youPos, youWon, champName: champ.name, nTeams: table.length,
    pts: table[youPos - 1]?.pts ?? 0, w: table[youPos - 1]?.w ?? 0, d: table[youPos - 1]?.d ?? 0, l: table[youPos - 1]?.l ?? 0,
    scorerName: myScorer?.name, scorerGoals: myScorer?.goals,
    card: featured ? { name: featured.name, club: featured.club, year: featured.year, pos: featured.pos, fame: featured.fame, folk: featured.folk, promessa: featured.promessa } : undefined,
  }
  // check de prontidão do "Reiniciar com novos times": TODOS os participantes
  // humanos precisam clicar "estou pronto" (não depende do presence, instável)
  const restartPending = state.restartPending
  const humanIds = state.managers.filter(m => m.isHuman).map(m => m.id)
  // 🤝 DUPLA: a conta é de PESSOAS, não de times — o time é dos dois, então os
  // dois precisam dizer que estão prontos (decisão do Diego). Sem isso, quem
  // clicasse primeiro decidia sozinho por quem estava do lado.
  const meuIdRestart = state.managers[state.youIdx]?.id ?? state.youIdx
  const pessoasDoTime = (id: number) => { const d = state.duplas?.[id]; return d?.partnerUid && !d.soloUid ? 2 : 1 }
  const prontasDoTime = (id: number) => {
    const d = state.duplas?.[id]
    if (!d?.partnerUid || d.soloUid) return state.restartReady.includes(id) ? 1 : 0
    const u = state.restartReadyUids ?? []
    return (u.includes(d.ownerUid) ? 1 : 0) + (u.includes(d.partnerUid) ? 1 : 0)
  }
  const totalPessoas = humanIds.reduce((n, id) => n + pessoasDoTime(id), 0)
  const readyCount = humanIds.reduce((n, id) => n + prontasDoTime(id), 0)
  const minhaDuplaRestart = state.duplas?.[meuIdRestart]
  const iAmReady = minhaDuplaRestart?.partnerUid && !minhaDuplaRestart.soloUid
    ? (state.restartReadyUids ?? []).includes(state.youUid ?? '')
    : state.restartReady.includes(state.youIdx)
  // cabeçalho da SUA colocação na liga (troféu/rádio + Nº lugar + frase). Quando
  // tem Copa pendente, ele desce pra perto da TABELA — a Copa é que fica no topo
  // (é a próxima ação). Sem Copa, fica no topo como sempre.
  const placementHeader = (padTop: string) => (
    <div className={`text-center ${padTop}`}>
      {/* 🐛 CORRIGIDO (relato do Diego 12/08): 🥈 é a medalha "2º lugar" de
          verdade (tem um "2" desenhado nela) — usar pra QUALQUER posição da
          zona de cima mostrava "2" pra quem ficou em 3º ou 4º. Trocado por 🏅. */}
      <p className="text-6xl">{youWon ? '🏆' : youPos <= zoneN(table.length) ? '🏅' : youPos >= zoneBot(table.length) ? '🪦' : '📻'}</p>
      <h2 className="font-black text-4xl mt-2" style={OSWALD}>{youWon ? LE('CAMPEÃO!', 'CHAMPION!') : `${ordinal(youPos, endLang)} ${LE('LUGAR', 'PLACE')}`}</h2>
      <p className="font-semibold text-black/60 mt-1">
        {youWon ? LE('O pregão foi seu, o campeonato foi seu. Resenha eterna.', 'The auction was yours, the title was yours. Eternal bragging rights.') : `${LE('Campeão', 'Champion')}: ${champ.name}. ${youPos >= zoneBot(table.length) ? LE('Rebaixado. O leilão cobra caro.', 'Relegated. The auction bites back.') : LE('Ano que vem tem pregão de novo.', 'Next year the auction returns.')}`}
      </p>
    </div>
  )
  // 🏆 Copa jogada e ENCERRADA nesta temporada — muda a cara do fim: em vez do
  // radião "6º lugar", um placar com os DOIS torneios (Liga + Copa), e a ordem
  // vira Liga → artilheiro da Liga → Copa → artilheiro da Copa.
  const copaDone = state.quickCopa?.phase === 'done'
  // 🌍 esta sala foi criada como "liga + Copa do Mundo"?
  // ⚠️ A marca é da SALA, não da partida — então ela NÃO está no estado do jogo.
  // (Tentei ler do estado primeiro: funciona pra quem entrou por reconexão, mas o
  // HOST monta a partida do zero e nunca teria a marca — ele ficaria sem a Copa
  // na tela dele, que é o pior jeito possível de quebrar isso.) Aqui é uma
  // batidinha só, na linha da sala, e a Copa em si só é baixada se a marca vier.
  const [mundoNaLiga, setMundoNaLiga] = useState(false)
  // 🌍 a noite só acaba DEPOIS da Copa (Diego 01/09: *"a votação é somente quando
  // acabar tudo, a liga e a Copa do Mundo — mesma coisa o jornal"*). Enquanto
  // `mundoPendente` for true, o jornal e o "e agora?" ficam escondidos, exatamente
  // como já acontece com a Copa dos 8 (`copaPending`) e a Libertadores.
  // Começa TRUE quando a sala é liga+mundo: melhor segurar e soltar do que
  // piscar o jornal na cara e sumir.
  const [mundoPendente, setMundoPendente] = useState(false)
  const [campeaoDoMundo, setCampeaoDoMundo] = useState<{ nome: string; pais: string } | null>(null)
  useEffect(() => { if (mundoNaLiga) setMundoPendente(true) }, [mundoNaLiga])
  useEffect(() => {
    if (!online || !state.roomId) return
    let vivo = true
    void supabase.from('game_rooms').select('flag:game_state->>mundoNaLiga').eq('id', state.roomId).maybeSingle()
      .then(({ data }) => { if (vivo) setMundoNaLiga(String((data as { flag?: string } | null)?.flag) === 'true') }, () => {})
    return () => { vivo = false }
  }, [online, state.roomId])
  // 🌎 nesta sala o mata-mata é a LIBERTADORES (não a Copa dos 8) — muda só o
  // nome e a cor nos quadros do fim; o resto do fluxo é o mesmo.
  const libEnd = state.copaMode === 'liga_liberta'
  const copaNome = libEnd ? 'Libertadores' : LE('Copa dos 8', 'Cup of 8')
  // até onde VOCÊ foi na Copa (pro resuminho do topo)
  const myCopaRun = (() => {
    const qc = state.quickCopa
    if (!qc) return ''
    if (qc.champion?.id === you.id) return LE('🏆 Campeão!', '🏆 Champion!')
    // 🌎 'oitavas' só aparece na Libertadores (a Copa dos 8 começa nas quartas)
    let last: 'oitavas' | 'quartas' | 'semis' | 'final' | null = null, lost = false
    for (const b of qc.bracket) { const t = b.ties.find(x => x.aId === you.id || x.bId === you.id); if (t) { last = b.phase; lost = t.winner != null && t.winner !== you.id } }
    if (!last) return state.copaMode === 'liga_liberta' ? LE('Não se classificou', 'Did not qualify') : LE('Fora do top 8', 'Outside the top 8')
    if (last === 'final') return lost ? LE('🥈 Vice', '🥈 Runner-up') : LE('🏆 Campeão!', '🏆 Champion!')
    return last === 'semis' ? LE('Caiu na semi', 'Out in the semis') : last === 'quartas' ? LE('Caiu nas quartas', 'Out in the quarters') : LE('Caiu nas oitavas', 'Out in the round of 16')
  })()
  // 👀 "VOCÊ!" é por quem VÊ (compara o id do campeão com o MEU time), não pelo
  // flag global champion.you (que no online marcava todo humano como "você").
  const copaChampName = state.quickCopa?.champion ? (state.quickCopa.champion.id === you.id ? LE('VOCÊ!', 'YOU!') : state.quickCopa.champion.name) : ''
  // 🎥 STREAM · carta do campeão compartilhada com a sala. Só faz sentido quando o
  // campeão é HUMANO (CPU não tira carta). A carta revelada vem do estado, sincronizada.
  const ligaChampHuman = !!state.managers.find(m => m.id === champ.id)?.isHuman
  const copaChampId = state.quickCopa?.champion?.id ?? undefined
  const copaChampHuman = copaChampId != null && !!state.managers.find(m => m.id === copaChampId)?.isHuman
  const copaChampIsYou = copaChampId != null && copaChampId === you.id // 👀 por quem VÊ (não o flag global .you)
  const streamLigaCard = state.streamChampCard?.liga ?? null
  const streamCopaCard = state.streamChampCard?.copa ?? null
  // quando o campeão abre o pacote, além de gravar no álbum dele, joga a carta no
  // estado → o host retransmite e a sala TODA vê a mesma carta (só no stream).
  const bcastCard = (slot: 'liga' | 'copa') => (c: WonCard) => { setMyCard(c); if (streamRoom) dispatch({ type: 'SET_STREAM_CHAMP_CARD', slot, card: c }) }
  // 🎥 STREAM · se o CAMPEÃO saiu da sala e não abriu o pacote, o HOST abre no lugar
  // dele (sorteio) — a sala não fica travada esperando uma carta que não vem. Espera
  // uma folga (presence é instável) e não age se a carta já existe ou se o campeão voltou.
  useEffect(() => {
    if (!streamHost) return
    const timers: ReturnType<typeof setTimeout>[] = []
    const arm = (slot: 'liga' | 'copa', champId: number | undefined, human: boolean, filled: boolean) => {
      if (champId == null || !human || filled) return
      const idx = state.managers.findIndex(m => m.id === champId)
      if (idx < 0 || idx === state.youIdx) return          // o campeão sou EU (host) → eu abro, sem auto
      if ((state.presence ?? []).includes(idx)) return     // campeão presente → ele mesmo abre
      timers.push(setTimeout(() => {
        const pick = ALL_POOL[Math.floor(Math.random() * ALL_POOL.length)]
        if (pick) dispatch({ type: 'SET_STREAM_CHAMP_CARD', slot, card: pick })
      }, 14000))
    }
    arm('liga', champ.id, ligaChampHuman, !!streamLigaCard)
    if (copaDone) arm('copa', copaChampId, copaChampHuman, !!streamCopaCard)
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamHost, state.presence, state.streamChampCard, champ.id, ligaChampHuman, copaChampId, copaChampHuman, copaDone, state.youIdx])
  // placar-resumo do topo (Liga + Copa), no lugar do radião de colocação
  const comboHeader = (
    <div className="pt-6">
      <p className="text-center text-xs font-black uppercase tracking-widest text-black/45 mb-1" style={OSWALD}>{LE('🏁 Fim da temporada', '🏁 End of season')}</p>
      <Box bg={INK} className="p-4 text-center" shadow={6}>
        <p className="font-black text-2xl truncate" style={{ ...OSWALD, color: '#fff' }}>{you.teamName}</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="rounded-xl border-2 py-2" style={{ borderColor: 'rgba(255,255,255,.18)', background: 'rgba(255,255,255,.06)' }}>
            <p className="text-[10px] font-black uppercase tracking-wide" style={{ color: GOLD }}>Liga Legends</p>
            <p className="font-black text-lg" style={{ ...OSWALD, color: '#fff' }}>{youWon ? LE('🏆 Campeão', '🏆 Champion') : `${ordinal(youPos, endLang)} ${LE('lugar', 'place')}`}</p>
          </div>
          <div className="rounded-xl border-2 py-2" style={{ borderColor: 'rgba(255,255,255,.18)', background: 'rgba(255,255,255,.06)' }}>
            <p className="text-[10px] font-black uppercase tracking-wide" style={{ color: GOLD }}>{copaNome}</p>
            <p className="font-black text-base" style={{ ...OSWALD, color: '#fff' }}>{myCopaRun}</p>
          </div>
        </div>
      </Box>
    </div>
  )
  // versão SÓ LIGA do topo (sem Copa): mesmo visual bonito do painel, mas com um
  // quadro só + a frase da colocação. Substitui o antigo radião no rápido comum.
  const ligaOnlyHeader = (padTop = 'pt-6') => (
    <div className={padTop}>
      <p className="text-center text-xs font-black uppercase tracking-widest text-black/45 mb-1" style={OSWALD}>{LE('🏁 Fim da temporada', '🏁 End of season')}</p>
      <Box bg={INK} className="p-4 text-center" shadow={6}>
        <p className="font-black text-2xl truncate" style={{ ...OSWALD, color: '#fff' }}>{you.teamName}</p>
        <div className="mt-2 rounded-xl border-2 py-2.5 px-2" style={{ borderColor: 'rgba(255,255,255,.18)', background: 'rgba(255,255,255,.06)' }}>
          <p className="text-[10px] font-black uppercase tracking-wide" style={{ color: GOLD }}>Liga Legends</p>
          <p className="font-black text-xl" style={{ ...OSWALD, color: '#fff' }}>{youWon ? LE('🏆 Campeão', '🏆 Champion') : `${ordinal(youPos, endLang)} ${LE('lugar', 'place')}`}</p>
          <p className="text-[11px] font-semibold mt-0.5" style={{ color: 'rgba(255,255,255,.62)' }}>
            {youWon ? LE('O pregão foi seu, o campeonato foi seu. Resenha eterna.', 'The auction was yours, the title was yours. Eternal bragging rights.') : `${LE('Campeão', 'Champion')}: ${champ.name}. ${youPos >= zoneBot(table.length) ? LE('Rebaixado — o leilão cobra caro.', 'Relegated — the auction bites back.') : LE('Ano que vem tem pregão de novo.', 'Next year the auction returns.')}`}
          </p>
        </div>
      </Box>
    </div>
  )
  // blocos da LIGA (tabela + artilheiro) e da COPA (campeão + artilheiro), pra
  // montar a ordem do fim conforme teve Copa ou não.
  const ligaChampionCard = (
    <>
      {online && youWon && state.roomId && (
        <CardCollectPrompt you={you} seasonKey={`${state.roomId}:${state.seed}:${state.seasonNo}`} origin="online" onClaimed={bcastCard('liga')} onStatus={setLigaCardStatus} />
      )}
      {/* 🎥 STREAM: a sala (quem NÃO é campeão) assiste o pacote do campeão da liga */}
      {streamRoom && !youWon && ligaChampHuman && (
        <StreamSpectatorCard champName={champ.name} card={streamLigaCard} />
      )}
      {!online && youWon && (
        <CardCollectPrompt you={you} seasonKey={state.dinastia ? `dinastia:${state.seed}:${state.seasonNo}` : `cpu:${state.seed}:${state.seasonNo}`} origin="cpu" onClaimed={setMyCard} />
      )}
    </>
  )
  const ligaBlocks = (
    <>
      <TableBox highlight={you.id} title="🏆 LIGA LEGENDS" />
      <TopScorersBox highlight={you.id} title={LE('⚽ ARTILHARIA DA LIGA LEGENDS', '⚽ LIGA LEGENDS TOP SCORERS')} />
    </>
  )
  // 🏆 Copa dos 8: quem é campeão da Copa ganha carta À PARTE do título da liga
  // (pode ganhar as duas na mesma temporada) — seasonKey com sufixo ":copa".
  const copaBlocks = (
    <>
      {state.quickCopa?.champion && (
        <Box bg="#FFF6D6" className="p-3 text-center" shadow={4}>
          <p className="text-[11px] font-black uppercase tracking-widest" style={{ ...OSWALD, color: '#9a6d00' }}>{libEnd ? '🌎 Libertadores' : LE('🏆 Copa dos 8', '🏆 Cup of 8')}</p>
          <p className="font-black text-base" style={OSWALD}>{LE('Campeão', 'Champion')}: {copaChampName}</p>
        </Box>
      )}
      {copaChampIsYou && (
        online && state.roomId ? (
          <CardCollectPrompt you={you} seasonKey={`${state.roomId}:${state.seed}:${state.seasonNo}:copa`} origin="online" onClaimed={bcastCard('copa')} onStatus={setCopaCardStatus} />
        ) : !online ? (
          <CardCollectPrompt you={you} seasonKey={`${state.dinastia ? `dinastia:${state.seed}:${state.seasonNo}` : `cpu:${state.seed}:${state.seasonNo}`}:copa`} origin="cpu" onClaimed={setMyCard} />
        ) : null
      )}
      {/* 🎥 STREAM: a sala (quem NÃO é campeão da Copa) assiste o pacote do campeão */}
      {streamRoom && copaChampHuman && !copaChampIsYou && (
        <StreamSpectatorCard champName={copaChampName} card={streamCopaCard} />
      )}
      <CopaScorersBox highlight={you.id} />
    </>
  )
  return (
    <Shell hideExit={online} className={online && !copaPending && !libPending && !mundoPendente ? 'online-end-art' : ''}>
      {festaOn && mascKey && <FestaoMascote nome={you.teamName} mascote={mascKey} onDone={fecharFesta} />}
      <RankResultWriter />
      {/* FIM COM COPA JÁ JOGADA: placar Liga+Copa no topo, e ordem
          Liga → artilheiro da Liga → Copa → artilheiro da Copa. */}
      {copaDone ? (
        <>
          {comboHeader}
          {ligaChampionCard}
          {ligaBlocks}
          {copaBlocks}
        </>
      ) : (
      <>
      {!copaPending && !libPending && (state.careerDivision ? placementHeader('pt-8') : ligaOnlyHeader())}
      {/* 🃏 BAFO: a cascata é O prêmio deste modo — vem logo depois da colocação,
          antes da tabela, porque é a primeira coisa que a galera quer ver. */}
      {state.bafoOn && (state.bafoValendo !== false ? <BafoCascata /> : (
        <Box bg="#FFF6D6" className="p-3 text-center" shadow={4}>
          <p className="font-black text-base" style={OSWALD}>{LE('🤝 BAFO AMISTOSO', '🤝 FRIENDLY BAFO')}</p>
          <p className="text-[11.5px] font-bold text-black/60 leading-snug mt-0.5">{endLang === 'en' ? <>This room was created <b>with no cards at stake</b> — nobody lost or won anything from the album. Just the table.</> : <>Esta sala foi criada <b>sem valer carta</b> — ninguém perdeu nem ganhou nada do álbum. Foi só a tabela.</>}</p>
        </Box>
      ))}
      {ligaChampionCard}
      {/* 🌎 BANNERZÃO DA LIBERTADORES (Diego 20/08) — o equivalente ao quadro da
          Copa dos 8, mas na cara azul-noite e com AS REGRAS escritas, porque é um
          formato novo: 32 clubes, 8 grupos, passam 2, e a final é jogo único. */}
      {libPending && state.liberta && (() => {
        const meu = state.liberta.times.find(t => t.id === you.id)
        const classificados = state.liberta.times.filter(t => t.pote === 1)
        if (privateEnd) return <CompetitionStage kind="liberta" title={LE('A LIGA TERMINOU · PRÓXIMA COMPETIÇÃO', 'LEAGUE OVER · NEXT COMPETITION')} phase="Libertadores" detail={meu ? LE('Você se classificou! Os oito da liga encaram os 24 clubes do continente.', 'You qualified! The league\'s top eight face the 24 clubs of the continent.') : LE('Seu clube não se classificou. Acompanhe os oito representantes da sala.', 'Your club did not qualify. Follow the room\'s eight representatives.')} status={canDriveCopa ? (manual || pacedRoom ? LE('O host pode iniciar a competição', 'The host can start the competition') : LE(`Começa em ${libLeft}s`, `Starts in ${libLeft}s`)) : LE('Aguardando o host', 'Waiting for the host')}>
          <div className="ll26-cup-entry"><div className="ll26-qualified">{classificados.map(t => <span key={t.id}><Escudo nome={t.name} size={25} />{t.name}</span>)}</div>
            <details className="ll26-format"><summary>{LE('REGULAMENTO E PREMIAÇÃO', 'FORMAT AND PRIZE')}</summary><p>{LE('8 grupos de 4, seis rodadas de ida e volta. Os dois primeiros de cada grupo avançam. Oitavas, quartas e semifinais em ida e volta; final em jogo único. Empate no agregado leva aos pênaltis. O campeão ganha outra carta.', '8 groups of 4, six home-and-away rounds. The top two of each group advance. Round of 16, quarters and semis over two legs; single-match final. A tie on aggregate goes to penalties. The champion earns another card.')}</p></details>
            {canDriveCopa && <Btn onClick={() => dispatch({ type: 'START_LIBERTA' })} bg={GOLD} className="w-full">{LE('INICIAR LIBERTADORES', 'START LIBERTADORES')}</Btn>}
          </div>
        </CompetitionStage>
        const regra = (emoji: string, titulo: string, txt: React.ReactNode) => (
          <div key={titulo} className="flex items-start gap-2 rounded-xl px-2.5 py-2" style={{ background: 'rgba(255,255,255,.12)', border: '2px solid rgba(255,255,255,.28)' }}>
            <span className="text-base leading-none mt-0.5">{emoji}</span>
            <p className="text-[11.5px] font-bold leading-snug" style={{ color: 'rgba(255,255,255,.9)' }}>
              <b className="font-black uppercase" style={{ ...OSWALD, color: GOLD }}>{titulo}</b> — {txt}
            </p>
          </div>
        )
        return (
          <Box bg={NOITE_HOLO} className="p-4 space-y-2.5" shadow={7} style={{ position: 'relative', overflow: 'hidden' }}>
            <ApoioSheen holo={1} dur={3.4} />
            <div className="relative space-y-2.5" style={{ zIndex: 2 }}>
              <p className="text-center text-4xl">🌎</p>
              <p className="font-black text-2xl text-center leading-none" style={{ ...OSWALD, color: GOLD }}>LIBERTADORES</p>
              <p className="text-center font-black text-[12px]" style={{ ...OSWALD, color: '#fff', letterSpacing: '.06em' }}>
                {meu ? LE('VOCÊ ESTÁ DENTRO!', 'YOU ARE IN!') : LE('A LIGA ACABOU — COMEÇA O CONTINENTE', 'THE LEAGUE IS OVER — THE CONTINENT BEGINS')}
              </p>
              <p className="text-[12px] font-bold text-center" style={{ color: 'rgba(255,255,255,.85)' }}>
                {endLang === 'en'
                  ? (meu
                    ? <>You finished in the <b style={{ color: GOLD }}>top 8</b> and took the spot. Now it's <b style={{ color: GOLD }}>32 clubs</b> — the 8 from here plus the continent's 24 giants.</>
                    : <>The league's <b style={{ color: GOLD }}>top 8</b> took the spots and face the continent's 24 giants. You didn't qualify, but you can follow everything.</>)
                  : (meu
                    ? <>Você terminou entre os <b style={{ color: GOLD }}>8 primeiros</b> e pegou a vaga. Agora são <b style={{ color: GOLD }}>32 clubes</b> — os 8 daqui mais os 24 grandes do continente.</>
                    : <>Os <b style={{ color: GOLD }}>8 primeiros</b> da liga pegaram a vaga e encaram os 24 grandes do continente. Você não se classificou, mas dá pra acompanhar tudo.</>)}
              </p>
              <div className="space-y-1.5">
                {endLang === 'en' ? <>
                  {regra('🎱', 'The draw', <>the league's 8 are <b>seeded</b> — one per group. Two friends from the room never land in the same group.</>)}
                  {regra('🥅', 'The groups', <>8 groups of 4, <b>6 rounds</b> home and away. The <b>top 2</b> of each go through.</>)}
                  {regra('⚔️', 'The knockout', <>16 clubs: round of 16, quarters and semis over <b>two legs</b>. Level on aggregate? <b>Penalties</b>.</>)}
                  {regra('🏆', 'The final', <><b>single match</b>, neutral ground. Whoever lifts the cup earns <b>another card</b> for the album.</>)}
                </> : <>
                  {regra('🎱', 'O sorteio', <>os 8 da liga são <b>cabeças de chave</b> — um por grupo. Dois amigos da sala nunca caem no mesmo grupo.</>)}
                  {regra('🥅', 'Os grupos', <>8 grupos de 4, <b>6 rodadas</b> de ida e volta. Passam os <b>2 primeiros</b> de cada um.</>)}
                  {regra('⚔️', 'O mata-mata', <>16 clubes: oitavas, quartas e semi em <b>ida e volta</b>. Empatou no agregado, vai pros <b>pênaltis</b>.</>)}
                  {regra('🏆', 'A final', <><b>jogo único</b>, em campo neutro. Quem levantar a taça leva <b>outra carta</b> pro álbum.</>)}
                </>}
                {/* 🚫 NÃO ENTRA AQUI (Diego 20/08: *"nem coloque essa aí de força e
                    etc, nada a ver por isso lá"*): nada de força/nível dos clubes.
                    O banner é o REGULAMENTO — como funciona o torneio. Número de
                    força é papo de bastidor, não de tela de abertura. */}
              </div>
              <div>
                <p className="text-[10.5px] font-black uppercase text-center mb-1" style={{ ...OSWALD, color: GOLD }}>{LE('🎟️ Os 8 classificados', '🎟️ The 8 qualifiers')}</p>
                <div className="flex flex-wrap justify-center gap-1">
                  {classificados.map(t => (
                    <span key={t.id} className="rounded-full px-2 py-0.5 text-[10px] font-black truncate"
                      style={{ ...OSWALD, maxWidth: '46%', background: t.id === you.id ? GOLD : 'rgba(255,255,255,.16)', color: t.id === you.id ? INK : '#fff', border: `2px solid ${t.id === you.id ? INK : 'rgba(255,255,255,.35)'}` }}>
                      {t.name}{t.id === you.id ? LE(' (você)', ' (you)') : state.managers.some(m => m.id === t.id && m.isHuman) ? ' 🔥' : ''}
                    </span>
                  ))}
                </div>
              </div>
              {canDriveCopa ? (
                <Btn onClick={() => dispatch({ type: 'START_LIBERTA' })} bg={GOLD} className="w-full text-lg">
                  {(manual || pacedRoom) ? LE('▶️ Iniciar a Libertadores', '▶️ Start the Libertadores') : LE(`▶️ A Libertadores começa em ${libLeft}s (toque pra já)`, `▶️ Libertadores starts in ${libLeft}s (tap to go)`)}
                </Btn>
              ) : (
                <div className="w-full border-[3px] border-black rounded-xl py-2.5 text-center font-black" style={{ background: '#fff', ...OSWALD }}>
                  ⏳ {pacedRoom ? LE('A Libertadores começa quando o host quiser', 'Libertadores starts when the host is ready') : LE(`A Libertadores começa em ${libLeft}s — o host puxa`, `Libertadores starts in ${libLeft}s — the host kicks it off`)}
                </div>
              )}
            </div>
          </Box>
        )
      })()}
      {copaPending && state.quickCopa && (privateEnd ? <CompetitionStage kind="copa8" title={LE('A LIGA TERMINOU · PRÓXIMA COMPETIÇÃO', 'LEAGUE OVER · NEXT COMPETITION')} phase={LE('Copa dos 8', 'Cup of 8')} detail={LE('Os oito primeiros disputam uma nova taça. O campeão ganha outra carta.', 'The top eight play for a new trophy. The champion earns another card.')} status={manual || pacedRoom ? LE('Aguardando o host iniciar', 'Waiting for the host to start') : LE(`A Copa começa em ${copaLeft}s`, `The Cup starts in ${copaLeft}s`)}>
        <div className="ll26-cup-entry"><h3>{LE('QUARTAS DE FINAL', 'QUARTER-FINALS')}</h3>
          {state.quickCopa.ties.map(t => <div className="ll26-draw-row" key={`${t.aId}-${t.bId}`}><span><Escudo nome={t.aName} size={25} />{t.aName}</span><b>×</b><span><Escudo nome={t.bName} size={25} />{t.bName}</span></div>)}
          <details className="ll26-format"><summary>{LE('REGULAMENTO', 'FORMAT')}</summary><p>{LE('1º × 8º, 2º × 7º, 3º × 6º e 4º × 5º. Quartas e semifinais em ida e volta. Final em jogo único. Empatou no agregado: pênaltis.', '1st × 8th, 2nd × 7th, 3rd × 6th and 4th × 5th. Quarters and semis over two legs. Single-match final. Level on aggregate: penalties.')}</p></details>
          {canDriveCopa && <Btn onClick={() => dispatch({ type: 'START_COPA' })} bg={GOLD} className="w-full">{LE('INICIAR COPA DOS 8', 'START THE CUP OF 8')}</Btn>}
        </div>
      </CompetitionStage> : (
        <Box bg={GOLD} className="p-4 space-y-2" shadow={6}>
          <p className="font-black text-lg text-center" style={OSWALD}>{bbEnd ? LE('🏆 PLAYOFFS · fica ligado!', '🏆 PLAYOFFS · stay tuned!') : LE('🏆 COPA DOS 8 · fica ligado!', '🏆 CUP OF 8 · stay tuned!')}</p>
          <p className="text-sm font-bold text-center text-black/75">
            {bbEnd
              ? (endLang === 'en'
                ? <><b>Playoffs — East × West.</b> Top 4 of each conference. Each conference crowns its champion, and the two meet in the <b>Finals</b> for the <b>ring</b>! 🏀</>
                : <><b>Playoffs — Leste × Oeste.</b> Top 4 de cada conferência. Cada lado decide seu campeão, e os dois se cruzam nas <b>Finais</b> pelo <b>anel</b>! 🏀</>)
              : endLang === 'en'
                ? <>The league's top 8 enter a separate Cup — two legs, semis and a single final. 1st plays 8th, 2nd plays 7th, 3rd plays 6th, 4th plays 5th. The Cup champion earns <b>another card</b> for the album!</>
                : <>Os 8 melhores da liga entram numa Copa à parte — ida e volta, semifinal e final única. O 1º pega o 8º, o 2º pega o 7º, o 3º pega o 6º, o 4º pega o 5º. Quem for campeão da Copa ganha <b>outra carta</b> pro álbum!</>}
          </p>
          <div className="space-y-1.5">
            {(() => {
              const tag = (id: number) => id === you.id ? LE(' (você)', ' (you)') : state.managers.some(m => m.id === id && m.isHuman) ? ' 🔥' : ''
              const tieRow = (t: typeof state.quickCopa.ties[number]) => (
                <div key={`${t.aId}-${t.bId}`} className="flex items-center justify-between gap-2 bg-white/80 rounded-lg px-3 py-1.5 border-2 border-black">
                  <span className="font-black text-xs truncate flex-1" style={OSWALD}>{t.aName}{tag(t.aId)}</span>
                  <span className="font-black text-[10px] text-black/50 shrink-0">×</span>
                  <span className="font-black text-xs truncate flex-1 text-right" style={OSWALD}>{t.bName}{tag(t.bId)}</span>
                </div>
              )
              const ties = state.quickCopa.ties
              // 🏀 quartas por conferência (Leste = ties 0,1 · Oeste = 2,3): agrupa
              // com cabeçalho. Fora disso (futebol, ou fases seguintes), lista direto.
              if (bbEnd && state.quickCopa.phase === 'quartas' && ties.length === 4) {
                return (
                  <>
                    <p className="text-[11px] font-black text-center" style={{ ...OSWALD, color: '#1D5FC4' }}>🔵 {LE('CONFERÊNCIA LESTE', 'EASTERN CONFERENCE')}</p>
                    {ties.slice(0, 2).map(tieRow)}
                    <p className="text-[11px] font-black text-center pt-1" style={{ ...OSWALD, color: '#C2452F' }}>🔴 {LE('CONFERÊNCIA OESTE', 'WESTERN CONFERENCE')}</p>
                    {ties.slice(2, 4).map(tieRow)}
                  </>
                )
              }
              return ties.map(tieRow)
            })()}
          </div>
          {online && <p className="text-[11px] font-bold text-center text-black/60">{LE('🔥 = amigo da sala · sem foguinho = time da CPU', '🔥 = friend in the room · no flame = CPU team')}</p>}
          {canDriveCopa ? (
            <Btn onClick={() => dispatch({ type: 'START_COPA' })} bg={INK} className="w-full text-lg">
              <span className="text-white">{(manual || pacedRoom) ? (bbEnd ? LE('▶️ Iniciar os Playoffs', '▶️ Start the Playoffs') : LE('▶️ Iniciar Copa dos 8', '▶️ Start the Cup of 8')) : (bbEnd ? LE(`▶️ Os Playoffs começam em ${copaLeft}s (toque pra já)`, `▶️ Playoffs start in ${copaLeft}s (tap to go)`) : LE(`▶️ A Copa começa em ${copaLeft}s (toque pra já)`, `▶️ The Cup starts in ${copaLeft}s (tap to go)`))}</span>
            </Btn>
          ) : (
            <div className="w-full border-[3px] border-black rounded-xl py-2.5 text-center font-black" style={{ background: '#fff', ...OSWALD }}>⏳ {pacedRoom ? LE('A Copa começa quando o host quiser', 'The Cup starts when the host is ready') : LE(`A Copa começa em ${copaLeft}s — o host puxa`, `The Cup starts in ${copaLeft}s — the host kicks it off`)}</div>
          )}
        </Box>
      ))}
      {privateEnd && (copaPending || libPending) ? <details className="ll26-bracket-history"><summary>{LE('LIGA ENCERRADA · CAMPEÃO, CLASSIFICAÇÃO E ESTATÍSTICAS', 'LEAGUE OVER · CHAMPION, STANDINGS AND STATS')}</summary>{ligaOnlyHeader('pt-2')}{ligaBlocks}</details> : <>{(copaPending || libPending) && ligaOnlyHeader('pt-2')}{ligaBlocks}</>}
      </>
      )}
      {/* 🏆 A LIGA NUM LUGAR SÓ (pílulas). Aqui, no FIM, ela também GRAVA a
          temporada — por isso vem com `gravar`. Só quando a temporada está
          DECIDIDA (liga-só, ou depois da Copa): durante a espera da Copa
          (copaPending) ainda falta o campeão dela, e gravar antes escreveria
          campeão pela metade. */}
      {/* 📰 O MARTELO · EDIÇÃO DA SALA (Diego 27/08) — a capa do fim de jogo, só
          com os USUÁRIOS: manchete, banner de quem levou a liga e de quem levou a
          Copa (quando são pessoas diferentes), os donos da noite e uma linha
          criativa pra cada técnico, cruzando liga + Copa.
          🔒 Só entra quando NÃO falta mais nada pra jogar — senão o jornal daria
          campeão de Copa antes da Copa acontecer (spoiler + mentira). Por isso as
          três travas: `!copaPending`, `!libPending` e, na Libertadores, exigir que
          o mata-mata dela tenha fechado.
          🃏 Fica ABAIXO da carta do campeão de propósito: o pacote é um popup por
          cima (portal), então o campeão vê a carta primeiro e cai no jornal quando
          fecha — e a gravação da carta, que dispara ao montar aquela tela, não é
          atrasada por nada daqui. */}
      {/* 🌍 COPA DO MUNDO DA SALA — só em sala criada como "liga + Copa do Mundo".
          Ela entra DEPOIS da liga estar decidida e ANTES do jornal: o jornal é o
          fecho da noite, e a Copa ainda é jogo.
          ⚠️ Igual à Copa da carreira, ela NÃO passa pelo motor do leilão: nada de
          assento, nada de reducer. É uma tela por cima. Tirar daqui = a sala volta
          a ser uma liga comum, e nada mais muda. */}
      {online && state.roomId && mundoNaLiga && !copaPending && !libPending && (
        <CercaDaCopa><Suspense fallback={null}>
          <CopaDaLigaLazy roomId={state.roomId} souDono={!!state.isHost} meuUid={state.youUid}
            matchSeed={state.seed}
            seasonNo={state.seasonNo ?? 1}
            aoStatus={st => { setMundoPendente(st.pendente); setCampeaoDoMundo(st.campeao) }}
            classificacao={table.map(t => {
              const m = state.managers.find(mm => mm.id === t.id)
              return { id: t.id, nome: t.name, humano: !!m?.isHuman }
            })} />
        </Suspense></CercaDaCopa>
      )}
      {/* 🖥️ OFFLINE TAMBÉM (Diego 04/09: "no modo rápido offline tem q ter jornal
          tb pow… igual no rápido online, qd acaba o torneio"). É o MESMO jornal e
          o MESMO lugar: esta tela de fim já é compartilhada pelos dois modos, só
          faltava tirar o `online &&` daqui. As três travas de spoiler continuam
          valendo iguais — o jornal nunca sai antes da Copa/Libertadores fechar.
          O que muda por dentro do jornal está em `jornal-sala.tsx` (`offline`):
          quem ganha linha e as palavras.
          ⚠️ `!state.careerDivision` de propósito: a CARREIRA VELHA (save de antes
          da pirâmide) também termina nesta tela, e lá quem manda é o
          `CareerEndPanel` — carreira tem o jornal dela (`jornal.tsx`). Sem esta
          trava, um save antigo abriria os DOIS jornais na mesma tela. Carreira
          nova nem passa por aqui (`careerOnline` vai pro PyramidSeasonScreen). */}
      {!state.careerDivision && !copaPending && !libPending && !mundoPendente && (!state.liberta || copaDone) && (
        <JornalDaSalaBloco state={state} vagasCopa={copaN(table.length)} zonaDebaixo={zoneBot(table.length)} mundo={campeaoDoMundo} />
      )}
      {online && state.roomId && !state.careerOnline && !copaPending && !libPending && (() => {
        const copaSc = [...(state.quickCopa?.scorers ?? [])].sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name))[0]
        return (
          <LigaHub roomId={state.roomId} souDono={state.isHost}
            humanos={state.managers.filter(m => m.isHuman).map(m => m.teamName)}
            gravar={{
              seasonNo: state.seasonNo, matchSeed: state.seed, champName: champ.name,
              scorerName: myScorer?.name, scorerGoals: myScorer?.goals,
              scorerTeamName: state.managers.find(m => m.id === myScorer?.teamId)?.teamName,
              micoName: table.length > 1 ? table[table.length - 1]?.name : undefined,
              copaChampName: copaDone ? (state.quickCopa?.champion?.name ?? undefined) : undefined,
              copaScorerName: copaDone ? copaSc?.name : undefined, copaScorerGoals: copaDone ? copaSc?.goals : undefined,
            }} />
        )
      })()}
      {/* No online, a votação "E agora?" vem ANTES do compartilhar (é a ação principal).
          Durante a ESPERA da Copa (copaPending) ela some — senão daria pra começar a
          próxima temporada e PULAR a Copa. Volta quando a Copa acaba. */}
      {online && !copaPending && !libPending && !mundoPendente && <OnlineEndVote awaitingCard={awaitingCard} />}
      <ShareResultPanel opts={shareOpts} />
      {/* 🔒 CINTO (19/08): o painel de fim de CARREIRA nunca aparece numa sala ONLINE.
          Ele auto-salva um save de carreira; numa sala online isso gravava uma carreira
          fantasma com o elenco da sala (a origem do caso do Paduz). A raiz já está
          fechada no START_ONLINE — este `!online` é a segunda trava. */}
      {state.dinastia ? (
        <Btn onClick={() => { window.location.hash = 'dinastia' }} bg={GREEN} className="w-full text-lg"><span className="text-white">🏰 Ir pra janela de transferências →</span></Btn>
      ) : (state.careerDivision && !online) ? <CareerEndPanel /> :state.nbaCareer ? (copaPending ? null : <NbaCareerEndPanel />) : (online || copaPending || libPending) ? null : (<>
      {restartPending
        ? (
          <div className="rounded-2xl border-4 border-black p-3 space-y-2" style={{ background: '#FEF3C7' }}>
            <p className="text-center font-black text-lg" style={OSWALD}>{LE('🔀 REINICIAR COM NOVOS TIMES', '🔀 RESTART WITH NEW TEAMS')}</p>
            <p className="text-center text-sm font-bold">{LE('Esperando todo mundo confirmar…', 'Waiting for everyone to confirm…')} {readyCount}/{totalPessoas} {LE('prontos', 'ready')}</p>
            {!iAmReady
              ? <Btn onClick={() => dispatch({ type: 'CONFIRM_RESTART', mgrId: state.youIdx, by: state.youUid })} bg={GREEN} className="w-full text-lg"><span className="text-white">{LE('✅ Estou pronto', '✅ I\'m ready')}</span></Btn>
              : <p className="text-center text-sm font-bold text-black/60">{LE('Você está pronto. Aguardando os outros…', 'You are ready. Waiting for the others…')}</p>}
            {/* 🤝 numa dupla o time só conta como pronto com os DOIS confirmados */}
            {iAmReady && !!minhaDuplaRestart?.partnerUid && !minhaDuplaRestart.soloUid && prontasDoTime(meuIdRestart) < 2 && (
              <p className="text-center text-[12px] font-bold text-black/55 leading-snug">{LE('🤝 Falta o seu parceiro confirmar — o time só fica pronto com os dois.', '🤝 Your partner still has to confirm — the team is only ready with both.')}</p>
            )}
            {canRestart && <Btn onClick={() => dispatch({ type: 'CANCEL_RESTART' })} className="w-full">{LE('Cancelar', 'Cancel')}</Btn>}
          </div>
        )
        : canRestart
          ? (
            <>
              <Btn onClick={() => dispatch({ type: 'REPLAY_SEASON' })} bg={GREEN} className="w-full text-lg"><span className="text-white">{LE('🔁 Nova temporada (mesmo time)', '🔁 New season (same team)')}</span></Btn>
              <Btn onClick={() => dispatch({ type: 'REQUEST_NEW_TEAMS' })} className="w-full text-lg">{LE('🔀 Reiniciar com novos times', '🔀 Restart with new teams')}</Btn>
            </>
          )
          : <p className="text-center text-sm font-bold text-black/60">{LE('Aguardando o host começar a próxima temporada…', 'Waiting for the host to start the next season…')}</p>}
      {/* 🪜 NÃO JOGA O TIME FORA (Diego 16/08 — plano-crescimento §1). O fim da
          partida rápida era beco sem saída: a pessoa montava o time no pregão e o
          jogo descartava tudo. Medido: 56% de quem joga nunca abre uma carreira,
          e quem abre volta 3× mais. Aqui a liga inteira vira a divisão de estreia
          — com os MESMOS adversários, então o equilíbrio fica de pé. */}
      <ContinuarComEsseTime />
      <Btn onClick={() => dispatch({ type: 'NEW_GAME' })} className="w-full text-lg">{LE('NOVO PREGÃO 🔨', 'NEW AUCTION 🔨')}</Btn>
      </>)}
    </Shell>
  )
}
