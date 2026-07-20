import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { Card, EscState, FormationKey, Manager, Sector, Tactic, WonCard } from './types'
import { FORMATIONS, SECTORS, SECTOR_LABEL } from './types'
import { useEsc, openSlots, totalHoles, sortedTable, topScorers, rivalryOf, START_MONEY, MONTE_SECONDS, BATCH_SIZE, batchCount, DIVISION_LABEL, buildCareerSave, nextDivision, monteLocked, loadPyramidCloud, deletePyramidCloud } from './store'
import type { CareerSave } from './store'
import { supabase } from '../lib/supabase'
import { resilientWrite } from './pending'
import { CATALOG, CATALOG_EU, BIOS, PROMESSA_SET, DIVISION_TEAMS } from './data'
import { AdminButton } from './admin'
import { DinastiaButton } from './dinastia'
import { CareerOnlineButton } from './careeronline'
import { PyramidOverlay } from './pyramid'
import { VADICO_LOGO } from './vadico'
import { useResumableRoom } from './lobby'
import { playerColors, LiveScoreCard } from './pyramidseason'

// universo colecionável = os DOIS baralhos (BR + Europa), por nomes únicos
// (Kaká, Cafu etc. aparecem nos dois — conta uma vez só).
// total colecionável = cada AUGE é uma carta (nome+clube+ano). Mesmo nome em
// clubes/anos diferentes (Vini Jr Flamengo x Real Madrid, Kaká SP x Milan) são
// cartas DISTINTAS — contam separado. Só o idêntico (nome+clube+ano) que não vale.
const CATALOG_TOTAL = new Set([...Object.values(CATALOG).flat(), ...Object.values(CATALOG_EU).flat()].map(c => `${c.name}|${c.club}|${c.year}`)).size

const GAME_URL = 'https://diegocfonseca-blip.github.io/7a0-game-studio/leilao-legends-38/'

// ─── estilo base (neubrutalista, igual ao resto do estúdio) ──────────
const CREAM = '#F4ECD6'
const INK = '#0C0C0C'
const GOLD = '#FFC400'
const GREEN = '#1B7A3D'
const RED = '#E8503A'
const PURPLE = '#7C3AED'
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
const APOIO_IG = 'https://ig.me/m/leilaolegendscom'
function PixBox({ label = 'copiar' }: { label?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(PIX_KEY); setCopied(true); setTimeout(() => setCopied(false), 2500) }
    catch { window.prompt('Copia a chave Pix:', PIX_KEY) }
  }
  return (
    <>
      <div className="border-[3px] border-black rounded-xl bg-white px-3 py-2.5">
        <p className="text-[10px] font-black uppercase text-black/50">Chave Pix (e-mail)</p>
        <p className="text-[13px] font-black break-all" style={OSWALD}>{PIX_KEY}</p>
      </div>
      <button onClick={copy}
        className="w-full mt-2.5 rounded-xl border-[3px] border-black font-black text-base py-3 active:translate-y-0.5"
        style={{ background: copied ? GREEN : GOLD, color: copied ? '#fff' : INK, boxShadow: `4px 4px 0 0 ${INK}`, ...OSWALD }}>
        {copied ? '✅ CHAVE COPIADA — VALEU DEMAIS!' : `📋 ${label.toUpperCase()}`}
      </button>
    </>
  )
}
export function ApoieButton({ big = false }: { big?: boolean }) {
  const [screen, setScreen] = useState<'off' | 'choice' | 'pix' | 'dream' | 'batismo'>('off')
  const [clube, setClube] = useState('')
  const close = () => { setScreen('off') }
  const igMsg = async () => {
    // deixa a mensagem prontinha no clipboard e abre a DM do Instagram
    const msg = `Opa! Acabei de apoiar o Leilão Legends 💛 Quero batizar meu clube: "${clube.trim() || '(nome do clube)'}" — comprovante em anexo!`
    try { await navigator.clipboard.writeText(msg) } catch { /* segue o baile */ }
    window.open(APOIO_IG, '_blank', 'noopener')
  }
  // portal no body: escapa de qualquer transform de ancestral (fixed de verdade)
  // e a COR PRETA explícita anula o color creme global do body (#f0e6c8) que
  // deixava os textos sem cor própria "apagados" no fundo creme.
  const Modal = ({ children }: { children: React.ReactNode }) => createPortal(
    <div onClick={close} style={{ position: 'fixed', inset: 0, zIndex: 99997, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14, overflowY: 'auto' }}>
      <div onClick={e => e.stopPropagation()} className="border-[3px] border-black rounded-2xl p-5 w-full my-auto"
        style={{ background: '#F4ECD6', color: INK, maxWidth: 390, boxShadow: `6px 6px 0 0 ${INK}`, maxHeight: '94vh', overflowY: 'auto' }}>
        {children}
        <p className="text-center mt-3"><button onClick={close} className="text-xs font-black underline text-black/50">fechar</button></p>
      </div>
    </div>,
    document.body
  )
  return (
    <>
      {big ? (
        <button onClick={() => setScreen('choice')}
          className="w-full rounded-xl border-[3px] border-black font-black text-base py-3 active:translate-y-0.5"
          style={{ background: 'linear-gradient(180deg,#FFE07A,#F5B301)', boxShadow: `4px 4px 0 0 ${INK}`, ...OSWALD }}>
          💛 APOIE O PROJETO — E ELE SEGUE GRÁTIS
        </button>
      ) : (
        <button onClick={() => setScreen('choice')} className="text-xs font-black underline" style={{ color: 'rgba(0,0,0,0.6)' }}>
          💛 Apoie o projeto (Pix)
        </button>
      )}

      {screen === 'choice' && (
        <Modal>
          <p className="font-black text-2xl text-center" style={OSWALD}>💛 APOIAR O LEILÃO LEGENDS</p>
          <p className="text-xs font-bold text-black/60 text-center mt-1.5 leading-snug">O jogo é grátis, sem anúncio, feito por um torcedor só.<br />Escolhe como quer apoiar:</p>
          <button onClick={() => setScreen('pix')} className="w-full text-left border-[3px] border-black rounded-xl p-3.5 mt-3.5 active:translate-y-0.5"
            style={{ background: GREEN, boxShadow: `4px 4px 0 0 ${INK}` }}>
            <p className="font-black text-white text-base" style={OSWALD}>💛 Só apoiar a resenha</p>
            <p className="text-[11px] font-bold text-white/80 mt-1 leading-snug">Qualquer valor no Pix. Sem burocracia, sem cadastro — só gratidão eterna e o jogo continuando grátis pra geral.</p>
          </button>
          <button onClick={() => setScreen('dream')} className="w-full text-left border-[3px] border-black rounded-xl p-3.5 mt-3 active:translate-y-0.5"
            style={{ background: 'linear-gradient(180deg,#FFE07A,#F5B301)', boxShadow: `4px 4px 0 0 ${INK}` }}>
            <p className="font-black text-base" style={OSWALD}>🏟️ Apoiar E batizar um clube do jogo</p>
            <p className="text-[11px] font-bold text-black/65 mt-1 leading-snug">Escolhe o nome do SEU time e ele entra no campeonato que <b>todo mundo</b> joga — na tabela, no jornal, na Copa. Seu clube, vivo, pra sempre*.</p>
          </button>
          <p className="text-[10px] font-bold text-black/45 text-center mt-2.5">*ou até alguém fazer uma proposta maior pelo clube… aí é cobrir ou chorar 😄</p>
        </Modal>
      )}

      {screen === 'pix' && (
        <Modal>
          <p className="font-black text-2xl text-center" style={OSWALD}>💛 Valeu por apoiar!</p>
          <p className="text-[13px] font-bold text-black/70 mt-2 leading-snug text-center">
            Qualquer valor ajuda a pagar o servidor e a manter tudo de graça pra geral. 🔨
          </p>
          <div className="mt-3.5"><PixBox label="copiar chave Pix" /></div>
          <p className="text-[11px] font-bold text-black/45 mt-3 text-center">Cola no app do teu banco e pronto. Qualquer valor vira mais jogo. 💛</p>
        </Modal>
      )}

      {screen === 'dream' && (
        <Modal>
          <p className="font-black text-xl text-center leading-tight" style={OSWALD}>🏟️ SEU TIME. NO JOGO.<br />PRA TODO MUNDO.</p>
          <div className="border-[3px] border-black rounded-xl overflow-hidden mt-3.5 bg-white" style={{ boxShadow: `4px 4px 0 0 ${INK}` }}>
            <p className="text-[9.5px] font-black uppercase tracking-wider text-center py-1" style={{ background: INK, color: GOLD }}>📊 é assim que os outros vão ver — Série A · rodada 31</p>
            {[['1', 'Real Madruga', '61', false], ['2', '⭐ Atlético do Jefão', '60', true], ['3', 'Vadico Veículos', '57', false], ['4', 'Robertão United', '55', false]].map(([p, n, pts, me]) => (
              <div key={p as string} className="flex justify-between px-3 py-1.5 text-[12px] border-t border-black/10"
                style={{ background: me ? '#FFE9B0' : '#fff', fontWeight: me ? 900 : 700 }}>
                <span><span className="text-black/40 mr-2">{p}</span>{n}</span><span>{pts}</span>
              </div>
            ))}
            <div className="px-3 py-2.5 border-t-2 border-black" style={{ background: '#f6f1e6' }}>
              <p className="font-black text-[13px] leading-tight" style={OSWALD}>📰 "ATLÉTICO DO JEFÃO ELIMINA GIGANTE E VAI À SEMI DA COPA"</p>
              <p className="text-[10px] font-semibold italic text-black/55 mt-0.5" style={{ fontFamily: 'Georgia, serif' }}>— O Martelo, jornal da temporada, na tela de milhares de jogadores</p>
            </div>
          </div>
          <p className="text-[11.5px] font-bold text-black/70 mt-3 leading-snug">Seu clube <b>joga de verdade</b>: sobe, cai, briga por título, aparece na artilharia e sai no jornal — na carreira de <b>cada pessoa que joga</b>. Não é homenagem parada: é um clube VIVO com o seu nome na história dele.</p>
          <button onClick={() => setScreen('batismo')} className="w-full mt-3.5 rounded-xl border-[3px] border-black font-black text-base py-3 active:translate-y-0.5"
            style={{ background: 'linear-gradient(180deg,#FFE07A,#F5B301)', boxShadow: `4px 4px 0 0 ${INK}`, ...OSWALD }}>
            ⚽ QUERO BATIZAR MEU CLUBE
          </button>
        </Modal>
      )}

      {screen === 'batismo' && (
        <Modal>
          <p className="font-black text-2xl text-center" style={OSWALD}>⚽ BATIZA TEU CLUBE</p>
          <p className="text-xs font-bold text-black/60 text-center mt-1">3 coisinhas e teu time entra em campo:</p>
          <p className="font-black text-[13px] mt-3" style={OSWALD}><span className="inline-block w-5 h-5 rounded-full text-center text-[11px] leading-5 mr-1.5" style={{ background: INK, color: GOLD }}>1</span>Escolhe o nome do clube</p>
          <input value={clube} onChange={e => setClube(e.target.value)} maxLength={26} placeholder="Ex.: Atlético do Jefão"
            className="w-full border-[3px] border-black rounded-xl px-3 py-2.5 mt-2 font-black text-base bg-white" style={OSWALD} />
          <p className="text-[10px] font-bold text-black/45 mt-1.5">✅ nome de resenha, zoeira leve, homenagem · ❌ ofensa, política, marca de empresa</p>
          <p className="font-black text-[13px] mt-3.5" style={OSWALD}><span className="inline-block w-5 h-5 rounded-full text-center text-[11px] leading-5 mr-1.5" style={{ background: INK, color: GOLD }}>2</span>Faz o Pix (a partir de R$ 5)</p>
          <div className="mt-2"><PixBox label="copiar chave Pix" /></div>
          <p className="font-black text-[13px] mt-3.5" style={OSWALD}><span className="inline-block w-5 h-5 rounded-full text-center text-[11px] leading-5 mr-1.5" style={{ background: INK, color: GOLD }}>3</span>Manda comprovante + nome</p>
          <button onClick={igMsg} className="w-full mt-2 rounded-xl border-[3px] border-black font-black text-[15px] py-3 active:translate-y-0.5"
            style={{ background: '#E1306C', color: '#fff', boxShadow: `4px 4px 0 0 ${INK}`, ...OSWALD }}>
            📸 CHAMAR NO @leilaolegendscom
          </button>
          <p className="text-[10px] font-bold text-black/45 mt-1.5 text-center">(a mensagem já vai copiada — é só colar na DM e anexar o comprovante)</p>
          <p className="text-[11px] font-bold text-black/55 mt-3 leading-snug text-center">A gente responde em até 24h confirmando o clube — e na próxima atualização ele já tá jogando pra todo mundo. ⚽</p>
          <div className="border-[3px] border-black rounded-xl px-3 py-2.5 mt-3 text-center" style={{ background: INK }}>
            <p className="font-black text-[12px] tracking-wide" style={{ color: GOLD, ...OSWALD }}>🤫 DISCRIÇÃO TOTAL</p>
            <p className="text-[10.5px] font-bold mt-1 leading-snug" style={{ color: 'rgba(255,255,255,0.75)' }}>Nenhum valor aparece pra ninguém, nunca. Quanto cada um apoiou fica só entre você e a gente. No jogo, só existe o nome do clube.</p>
          </div>
        </Modal>
      )}
    </>
  )
}

export function GameFooter() {
  return (
    <div style={{ background: '#F4ECD6', borderTop: '2px solid rgba(0,0,0,0.06)' }}>
      <footer className="max-w-xl mx-auto text-center px-4 pt-4 pb-8 space-y-1.5">
        <div className="pb-1"><ApoieButton /></div>
        <p className="text-black/55 text-xs font-bold">💡 Ideia de jogador novo, sugestão ou achou um bug? Fala comigo:</p>
        <p className="text-xs font-bold">
          <a href="https://instagram.com/leilaolegendscom" target="_blank" rel="noopener noreferrer" className="text-black/65 underline"><InstaIcon /> @leilaolegendscom</a>
          <span className="text-black/30"> · </span>
          <a href="mailto:diego.c.fonseca@gmail.com" className="text-black/65 underline">✉️ diego.c.fonseca@gmail.com</a>
        </p>
        <p className="text-black/35 text-[11px] font-semibold pt-1">Feito por @diegocfonseca</p>
        <p className="text-black/20 text-[10px] font-semibold">v{__BUILD_ID__}</p>
      </footer>
    </div>
  )
}

function Box({ children, bg = '#fff', className = '', shadow = 4 }: { children: React.ReactNode; bg?: string; className?: string; shadow?: number }) {
  return (
    <div className={`border-[3px] border-black rounded-2xl ${className}`} style={{ backgroundColor: bg, boxShadow: `${shadow}px ${shadow}px 0 0 ${INK}` }}>
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

function Shell({ children, bar, hideExit = false }: { children: React.ReactNode; bar?: React.ReactNode; hideExit?: boolean }) {
  // O CSS base do estúdio usa texto claro (creme). Como este jogo é todo em
  // fundos claros, forçamos texto escuro por padrão aqui — quem precisa de
  // branco (botões/fundos escuros) já define a cor explicitamente.
  const { state, dispatch, kickPlayer, leaveRoom: leaveRoomHard } = useEsc()
  const [manage, setManage] = useState(false)
  // "sair do jogo" discreto: só durante uma partida (não na home/álbum). Ao
  // sair, o dispatch libera a vaga na sala online (não vira fantasma).
  const inGame = ['setup', 'auction', 'monte', 'cerimonia', 'season', 'end'].includes(state.screen)
  const leave = () => {
    if (window.confirm('Sair do jogo? Você vai perder esta partida.')) dispatch({ type: 'GO_LOBBY' })
  }
  // online: dois caminhos. Voltar pro menu MANTÉM a vaga (dá pra voltar pela
  // faixa "Voltar pra partida"). Sair da sala remove a vaga de vez.
  const backToMenu = () => dispatch({ type: 'GO_LOBBY_ONLINE' })
  const leaveRoom = () => {
    const msg = state.isHost
      ? 'Sair da sala? Você será removido e o comando (host) passa pra outra pessoa da sala. Se você estiver sozinho, a sala é apagada.'
      : 'Sair da sala? Você será removido desta partida (não dá pra voltar).'
    if (window.confirm(msg)) leaveRoomHard()
  }
  // só o host, numa partida online, gerencia os técnicos. Lista os HUMANOS (menos
  // ele) e também os RIVAIS CPU (ex-amigos que saíram — auctionRival sem ser humano).
  const canManage = inGame && state.onlineMode === 'online' && state.isHost
  const others = state.managers.filter(m => m.id !== state.youIdx && (m.isHuman || m.auctionRival))
  const kick = (m: Manager) => {
    const msg = m.isHuman
      ? `Remover ${m.teamName}? Vira um RIVAL CPU: continua no leilão dando lance com o time e o dinheiro dele.`
      : `Excluir o rival CPU ${m.teamName}? Ele para de dar lance no leilão (fica só na tabela).`
    if (window.confirm(msg)) kickPlayer(m.id)
  }
  return (
    <div className="min-h-screen pb-16" style={{ backgroundColor: CREAM, color: INK }}>
      {bar && (
        <div className="sticky top-0 z-20 border-b-[3px] border-black px-4 py-2.5" style={{ backgroundColor: '#fff', color: INK }}>
          {bar}
        </div>
      )}
      <div className="max-w-xl mx-auto px-4 pt-5 space-y-5">{children}</div>
      {inGame && !hideExit && (
        <div className="max-w-xl mx-auto px-4 pt-6 pb-4 text-center space-y-2">
          {state.onlineMode === 'online' ? (
            <div className="flex items-center justify-center gap-5">
              <button onClick={backToMenu} className="text-black/35 text-xs font-semibold underline active:opacity-60" title="Sai pro menu mas continua na sala — dá pra voltar">🏠 voltar pro menu</button>
              <button onClick={leaveRoom} className="text-black/35 text-xs font-semibold underline active:opacity-60" title="Sai da sala de vez (removido)">🚪 sair da sala</button>
            </div>
          ) : (
            <button onClick={leave} className="block mx-auto text-black/30 text-xs font-semibold underline active:opacity-60">sair do jogo</button>
          )}
          {canManage && others.length > 0 && (
            <button onClick={() => setManage(v => !v)} className="block mx-auto text-black/30 text-xs font-semibold underline active:opacity-60">
              {manage ? 'fechar' : 'gerenciar técnicos'}
            </button>
          )}
          {canManage && manage && (
            <div className="max-w-xs mx-auto mt-1 border-2 border-black/15 rounded-xl p-2 space-y-1.5 text-left" style={{ background: '#fff' }}>
              <p className="text-black/40 text-[10px] font-black uppercase tracking-widest px-1">Remover da partida</p>
              {others.map(m => (
                <div key={m.id} className="flex items-center gap-2">
                  <span className="flex-1 min-w-0 truncate text-xs font-bold text-black/70" style={OSWALD}>{m.isHuman ? '' : '🤖 '}{m.teamName}</span>
                  <button onClick={() => kick(m)}
                    className="shrink-0 border border-black/20 rounded-lg px-2 py-1 text-[11px] font-black active:opacity-60"
                    style={{ background: '#F4ECD6', color: '#B23A2A', ...OSWALD }}>{m.isHuman ? 'remover' : 'excluir'}</button>
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
function Campinho({ m, small = false, bench = false, title }: { m: Manager; small?: boolean; bench?: boolean; title?: string }) {
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
        <div style={{ background: INK, color: '#fff', borderBottom: `3px solid ${INK}`, height: small ? 22 : 26, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="font-black uppercase tracking-wide" style={{ ...OSWALD, fontSize: small ? 10 : 12 }}>{title}</span>
        </div>
      )}
      <div className="px-3 py-2 flex flex-col gap-2" style={{ background: `repeating-linear-gradient(180deg, ${GREEN} 0 34px, #166332 34px 68px)` }}>
        {rows.map(row => (
          <div key={row.key} className="flex justify-center gap-2">
            {row.slots.map((slot, i) => (
              <div
                key={i}
                className={`border-2 border-black rounded-lg text-center ${small ? 'px-1 py-0.5 min-w-[52px]' : 'px-2 py-1 min-w-[72px]'}`}
                style={{ backgroundColor: slot.card ? '#fff' : 'rgba(255,255,255,0.25)' }}
              >
                <p className="text-[9px] font-black" style={{ color: slot.card ? RED : '#fff' }}>{slot.pos}</p>
                <p className={`font-bold leading-tight ${small ? 'text-[9px]' : 'text-[11px]'}`} style={{ color: slot.card ? INK : 'rgba(255,255,255,0.95)' }}>
                  {slot.card ? slot.card.name : 'Vazio'}
                </p>
                {slot.card && !small && <p className="text-[8px] text-black/60 font-medium">{slot.card.club} {slot.card.year}</p>}
              </div>
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
function YourPitch({ small = false }: { small?: boolean }) {
  const { state } = useEsc()
  const you = state.managers[state.youIdx]
  if (state.reserveAuction) {
    // "Reservas" só na 2ª temporada (quando se monta o banco); da 3ª em diante é
    // o mercado, então o campinho de baixo é só o "Banco".
    const benchTitle = state.seasonNo === 2 ? '🔁 Reservas (banco)' : '🔁 Banco'
    return (
      <div className="space-y-2">
        <Campinho m={you} small={small} bench title={benchTitle} />
        <Campinho m={you} small={small} title="⭐ Titulares" />
      </div>
    )
  }
  return <Campinho m={you} small={small} />
}

function CardFace({ c, big = false, surprise = false, highlight = false }: { c: Card; big?: boolean; surprise?: boolean; highlight?: boolean }) {
  return (
    <div className="text-left">
      <div className="flex items-center gap-2">
        <span className="border-2 border-black rounded-full px-2 py-0.5 text-[10px] font-black" style={{ backgroundColor: INK, color: '#fff' }}>{c.pos}</span>
        {surprise
          ? <span className={`font-black ${big ? 'text-2xl' : 'text-base'} inline-flex items-center gap-1.5`} style={{ ...OSWALD, color: PURPLE }}>🎁 <span aria-hidden style={{ filter: 'blur(7px)', userSelect: 'none' }}>{c.name}</span></span>
          : <p className={`font-black ${big ? 'text-2xl' : 'text-base'}`} style={{ ...OSWALD, color: highlight ? PURPLE : INK }}>{c.name}{highlight ? ' 🎁' : ''}</p>}
      </div>
      <p className={`${big ? 'text-sm' : 'text-xs'} font-semibold text-black/60 mt-0.5`}>{c.club} · {c.year}</p>
    </div>
  )
}

// ─── NOVIDADES ───────────────────────────────────────────────────────
// Mostra SÓ a novidade mais recente, com X pra fechar. Ao fechar, guarda o id
// no aparelho — só reaparece quando eu trocar o LATEST_NEWS por um id novo.
const LATEST_NEWS = {
  id: '2026-07-estadio',
  emoji: '🏟️',
  title: 'Chegou o ESTÁDIO — no Modo Carreira!',
  text: 'Construa seu estádio arquibancada por arquibancada: torcida enchendo, refletores, telão, loja e cobertura. Cada melhoria destrava a próxima e TUDO rende bilheteria no fim de cada temporada 💰 Procura a aba 🏟️ na tua carreira!',
}
function NewsBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem('esc_news_seen') === LATEST_NEWS.id } catch { return false }
  })
  if (dismissed) return null
  const close = () => { try { localStorage.setItem('esc_news_seen', LATEST_NEWS.id) } catch { /* ignore */ } setDismissed(true) }
  return (
    <div className="relative rounded-2xl border-[3px] border-black p-3 pr-9 mb-1" style={{ background: '#EDE7FF', boxShadow: `4px 4px 0 0 ${INK}` }}>
      <button onClick={close} aria-label="Fechar novidade"
        className="absolute top-2 right-2 w-6 h-6 rounded-full border-2 border-black bg-white font-black text-xs leading-none active:translate-y-0.5">✕</button>
      <p className="text-[10px] font-black uppercase tracking-wide" style={{ color: PURPLE }}>✨ Novidade</p>
      <p className="font-black text-sm leading-tight" style={OSWALD}>{LATEST_NEWS.emoji} {LATEST_NEWS.title}</p>
      <p className="text-xs font-bold text-black/70 mt-0.5">{LATEST_NEWS.text}</p>
    </div>
  )
}

// seção detalhada lá embaixo: novidades do jogo + jogadores que entraram
function NewsSection() {
  return (
    <Box bg="#F6F2FF" className="p-4 space-y-3">
      <p className="font-black text-base" style={OSWALD}>📢 Últimas novidades</p>
      <div>
        <p className="text-[11px] font-black uppercase" style={{ color: PURPLE }}>✨ No jogo</p>
        <div className="mt-1 space-y-1">
          <p className="text-xs font-bold text-black/75">🏟️ <b>Estádio</b> — no <b>Modo Carreira</b>: construa arquibancadas, refletores, telão e cobertura. O desenho cresce a cada compra e a bilheteria rende toda temporada!</p>
          <p className="text-xs font-bold text-black/75">🏆 <b>Copa Legends</b> — no <b>Modo Carreira</b>, no fim de cada temporada os 16 melhores das 4 divisões se enfrentam num mata-mata sorteado. Série D pode eliminar Série A!</p>
          <p className="text-xs font-bold text-black/75">🪜 <b>Modo Carreira liberado</b> — pirâmide de 4 divisões (Série D → A), com leilão de reservas, transferências e substituições.</p>
          <p className="text-xs font-bold text-black/75">🎴 <b>Álbum + placar novo</b> — cartas dos craques colecionáveis e o placar ao vivo com selo de GOOOL também no jogo rápido.</p>
          <p className="text-xs font-bold text-black/75">🌍 <b>Dois baralhos</b> — escolha Auges do Brasileirão ou da Liga Europa na partida rápida e na carreira.</p>
          <p className="text-xs font-bold text-black/75">🔴 <b>Salas ao vivo</b> — a lista de salas abertas mostra também as partidas já rolando.</p>
          <p className="text-xs font-bold text-black/75">🔁 <b>Jogar de novo no online</b> — o host traz todo mundo de volta pra sala sem recomeçar do zero.</p>
          <p className="text-xs font-bold text-black/75">🎁 <b>Jogador Surpresa</b> no leilão — nome escondido, revelado só no martelo.</p>
          <p className="text-xs font-bold text-black/75">🏆 <b>Leilão mais claro</b> — quem dá o maior lance leva, e dá pra apostar em várias vagas de uma vez.</p>
        </div>
      </div>
      <div>
        <p className="text-[11px] font-black uppercase" style={{ color: PURPLE }}>🌍 Baralho da Liga Europa</p>
        <p className="text-xs font-bold text-black/75 mt-1"><b>Lendas:</b> Maradona, Zidane, Messi, Cristiano, Mbappé, Vini Jr, Ronaldinho Gaúcho, Kaká, Henry, Pirlo, Cruyff, van Basten, Puskás, George Best, Yashin.</p>
        <p className="text-xs font-bold text-black/75 mt-1"><b>Craques:</b> Bebeto, Totti, Del Piero, Cantona, Zola, Rui Costa, Hagi, Drogba, Harry Kane, Van Dijk, Sergio Ramos.</p>
        <p className="text-xs font-bold text-black/75 mt-1"><b>Promessas 💎:</b> Yamal, Bellingham, Musiala, Wirtz, João Félix, Pato, Endrick.</p>
        <p className="text-xs font-bold text-black/75 mt-1"><b>Flops &amp; folclore 🃏:</b> Gabigol, Kléberson, Ali Dia, Bebé, Kerlon, Vampeta, Pedro, Denílson Show, Fellaini.</p>
      </div>
      <div>
        <p className="text-[11px] font-black uppercase" style={{ color: PURPLE }}>🆕 Recém-chegados</p>
        <p className="text-xs font-bold text-black/75 mt-1"><b>🇧🇷 BR:</b> Lucas Moura, Danilo, Ralf, Taison, Guilherme Arana, Junior Alonso, Luan.</p>
        <p className="text-xs font-bold text-black/75 mt-1"><b>🌍 Europa:</b> Gareth Bale, Eden Hazard, Son, Arturo Vidal, Bruno Fernandes, Gündogan.</p>
        <p className="text-[11px] font-bold text-black/50 mt-1">O baralho só cresce — sempre entrando craque novo. 🔨</p>
      </div>
    </Box>
  )
}

// ─── INTRO ───────────────────────────────────────────────────────────
// carreira offline salva no localStorage — pra oferecer "continuar" na intro
function useResumableSolo() {
  const { dispatch } = useEsc()
  const [saved, setSaved] = useState<EscState | null>(null)
  useEffect(() => {
    let alive = true
    let localAt = 0
    try { const r = localStorage.getItem('esc-solo-career'); if (r) setSaved(JSON.parse(r) as EscState); localAt = +(localStorage.getItem('esc-solo-career-at') || 0) } catch { setSaved(null) }
    // logado: se a NUVEM tiver um save mais recente que o local (ex.: outro
    // aparelho), usa o da nuvem — a carreira segue a conta.
    ;(async () => {
      try {
        const cloud = await loadPyramidCloud()
        if (!alive || !cloud) return
        const c = cloud.save
        if (c && c.careerOnline && Array.isArray(c.managers) && c.managers.length && cloud.at > localAt) setSaved(c)
      } catch { /* ignora */ }
    })()
    return () => { alive = false }
  }, [])
  if (!saved || !saved.careerOnline || !saved.managers?.length) return null
  const you = saved.managers[saved.youIdx ?? 0]
  return {
    seasonNo: saved.seasonNo ?? 1,
    teamName: you?.teamName ?? 'Meu time',
    resume: () => dispatch({ type: 'RESUME_CAREER_SOLO', saved }),
    discard: () => { try { localStorage.removeItem('esc-solo-career'); localStorage.removeItem('esc-solo-career-at') } catch { /* ignora */ } deletePyramidCloud(); setSaved(null) },
  }
}

// banner de "continuar carreira offline" (pirâmide) — aparece na home E logo
// abaixo do botão de começar, no setup, quando existe um jogo salvo.
function SoloContinueBanner() {
  const solo = useResumableSolo()
  if (!solo) return null
  return (
    <div className="rounded-2xl border-4 border-black p-3 space-y-2.5" style={{ background: '#6C43C0', boxShadow: `4px 4px 0 0 ${INK}` }}>
      <p className="font-black text-sm text-white leading-tight" style={OSWALD}>
        🪜 Carreira offline salva<br />
        <span className="opacity-80 text-xs">{solo.teamName} · Temporada {solo.seasonNo}</span>
      </p>
      <button onClick={solo.resume} className="w-full rounded-xl border-2 border-black bg-white text-black font-black text-sm py-2.5 active:translate-y-0.5" style={OSWALD}>
        ▶️ Continuar carreira ({solo.teamName})
      </button>
      <button onClick={solo.discard} className="w-full rounded-xl border-2 border-black font-black text-sm py-2.5 active:translate-y-0.5" style={{ background: '#E8503A', color: '#fff', ...OSWALD }}>
        🗑️ Descartar e começar do zero
      </button>
    </div>
  )
}

export function EscIntro() {
  const { dispatch } = useEsc()
  const resumable = useResumableRoom()
  const solo = useResumableSolo()
  const [shared, setShared] = useState(false)
  const shareGame = async () => {
    const data = { title: 'Leilão Legends', text: 'Bora jogar Leilão Legends! Leilão às cegas de lendas do futebol brasileiro 🔨⚽', url: 'https://leilaolegends.com' }
    try {
      if (navigator.share) { await navigator.share(data); return }
      await navigator.clipboard.writeText('https://leilaolegends.com')
      setShared(true); setTimeout(() => setShared(false), 2500)
    } catch { /* usuário cancelou */ }
  }
  return (
    <Shell>
      {resumable && (
        <div className="rounded-2xl border-4 border-black p-3 mb-1 space-y-2.5" style={{ background: '#1B7A3D', boxShadow: `4px 4px 0 0 ${INK}` }}>
          <p className="font-black text-sm text-white leading-tight" style={OSWALD}>
            ⏳ Você tem uma partida em andamento<br />
            <span className="opacity-80 text-xs">Sala {resumable.code}</span>
          </p>
          <button onClick={resumable.resume}
            className="w-full rounded-xl border-2 border-black bg-white text-black font-black text-sm py-2.5 active:translate-y-0.5" style={OSWALD}>
            ▶️ Continuar a partida (Sala {resumable.code})
          </button>
          <button onClick={resumable.leave}
            className="w-full rounded-xl border-2 border-black font-black text-sm py-2.5 active:translate-y-0.5"
            style={{ background: '#E8503A', color: '#fff', ...OSWALD }}>
            🚪 Sair da sala e começar uma nova
          </button>
        </div>
      )}
      {solo && (
        <div className="rounded-2xl border-4 border-black p-3 mb-1 space-y-2.5" style={{ background: '#6C43C0', boxShadow: `4px 4px 0 0 ${INK}` }}>
          <p className="font-black text-sm text-white leading-tight" style={OSWALD}>
            🪜 Carreira offline em andamento<br />
            <span className="opacity-80 text-xs">{solo.teamName} · Temporada {solo.seasonNo}</span>
          </p>
          <button onClick={solo.resume} className="w-full rounded-xl border-2 border-black bg-white text-black font-black text-sm py-2.5 active:translate-y-0.5" style={OSWALD}>
            ▶️ Continuar carreira ({solo.teamName})
          </button>
          <button onClick={solo.discard} className="w-full rounded-xl border-2 border-black font-black text-sm py-2.5 active:translate-y-0.5" style={{ background: '#E8503A', color: '#fff', ...OSWALD }}>
            🗑️ Descartar e começar do zero
          </button>
        </div>
      )}
      <div className="text-center pt-8">
        <span className="inline-block border-2 border-black rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide" style={{ backgroundColor: GOLD, boxShadow: `3px 3px 0 0 ${INK}` }}>
          ⚽ Leilão às cegas de lendas
        </span>
        <h1 className="font-black text-5xl mt-4 leading-none" style={OSWALD}>LEILÃO LEGENDS</h1>
        {/* sublinhado dourado da marca oficial (mesmo da logo do Instagram/og) */}
        <div className="mx-auto mt-2" style={{ width: 150, height: 10, borderRadius: 5, background: GOLD, border: `2px solid ${INK}`, boxShadow: `3px 3px 0 0 ${INK}` }} />
        <p className="mt-3 font-semibold text-black/60 max-w-sm mx-auto">Dê lance no <b>nome</b>, sem ver o nível. Monte o time no pregão, ganhe o campeonato e colecione os craques no seu álbum.</p>
      </div>
      {/* vitrine: a coleção é a estrela — cartas reais do álbum (nível/cor/bio do catálogo) */}
      <div className="grid grid-cols-2 gap-3">
        <div style={{ transform: 'rotate(-1.5deg)' }}><CollectibleCard name="Pelé" club="Santos" year={1962} pos="ATA" fame={5} showBio /></div>
        <div style={{ transform: 'rotate(1.5deg)' }}><CollectibleCard name="Gabigol" club="Flamengo" year={2019} pos="ATA" fame={4} showBio /></div>
        <div style={{ transform: 'rotate(1.5deg)' }}><CollectibleCard name="Rayan Oi, Boa Noite" club="Vasco" year={2025} pos="ATA" fame={3} promessa showBio /></div>
        <div style={{ transform: 'rotate(-1.5deg)' }}><CollectibleCard name="Obina" club="Flamengo" year={2005} pos="ATA" fame={2} folk showBio /></div>
      </div>
      <p className="text-center text-[11px] font-black uppercase tracking-wide text-black/45" style={OSWALD}>👑 lenda · ⭐ craque · 💎 promessa · 🃏 folclórico — colecione todos</p>
      <NewsBanner />
      <div className="space-y-3">
        <Btn onClick={() => dispatch({ type: 'GO_SETUP' })} className="w-full text-lg">⚡ PARTIDA RÁPIDA (VS CPU)</Btn>
        {/* carreira nova em destaque: brilho pulsante na própria cor (roxo) + tag (new) */}
        <motion.div className="rounded-xl"
          animate={{ boxShadow: ['0 0 0 0 rgba(124,58,237,0)', '0 0 16px 4px rgba(124,58,237,0.7)', '0 0 0 0 rgba(124,58,237,0)'] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}>
          <Btn onClick={() => dispatch({ type: 'GO_SETUP_CAREER' })} className="w-full text-lg" bg={PURPLE}>
            <span className="text-white">🪜 CARREIRA POR DIVISÕES <span className="text-yellow-300">(new)</span></span>
          </Btn>
        </motion.div>
        <Btn onClick={() => dispatch({ type: 'GO_LOBBY_ONLINE' })} className="w-full text-lg" bg={GREEN}>
          <span className="text-white">👥 JOGAR ONLINE (O FAVORITO DO CRIADOR)</span>
        </Btn>
        <div className="flex gap-3">
          <div className="flex-1"><Btn onClick={() => dispatch({ type: 'GO_ALBUM' })} className="w-full" bg="#fff">📖 Álbum</Btn></div>
          <div className="flex-1"><Btn onClick={() => dispatch({ type: 'GO_RANKING' })} className="w-full" bg="#fff">🏆 Ranking</Btn></div>
        </div>
        <AdminButton />
        <DinastiaButton />
        <CareerOnlineButton />
      </div>
      {/* como funciona — 4 cartões enxutos em grade 2×2 */}
      <div className="grid grid-cols-2 gap-2.5">
        {([['🔨', 'O Pregão', '5 rodadas de leilão cego: goleiro, lateral, zaga, meio e ataque. Ninguém vê o lance de ninguém.'],
           ['🎭', 'Níveis ocultos', 'Você aposta no nome. O nível só abre na Cerimônia — e todo craque tem dia bom e dia ruim.'],
           ['🪜', 'Pirâmide', 'Comece na Série D e suba até a A. Cada título vira uma carta no seu álbum.'],
           ['💎', 'Vale o auge', 'O nível é o auge do craque, conforme o baralho: no 🇧🇷 conta o auge no Brasil; no 🌍 Europa, o auge lá fora. Estrela só na Europa entra como promessa no BR.']] as [string, string, string][]).map(([ic, t, d]) => (
          <div key={t} className="border-[3px] border-black rounded-xl bg-white p-3" style={{ boxShadow: `4px 4px 0 0 ${INK}` }}>
            <div className="text-xl">{ic}</div>
            <p className="font-black text-[13px] uppercase mt-1.5" style={OSWALD}>{t}</p>
            <p className="text-[11px] font-semibold text-black/60 mt-0.5 leading-snug">{d}</p>
          </div>
        ))}
      </div>
      <CardAccountNote />
      <ApoieButton big />
      <Btn onClick={shareGame} className="w-full" bg="#fff">
        📤 {shared ? 'Link copiado! Cola no zap 📲' : 'Compartilhar com os amigos'}
      </Btn>
      <NewsSection />
    </Shell>
  )
}

// ─── SETUP ───────────────────────────────────────────────────────────
export function EscSetup() {
  const { state, dispatch } = useEsc()
  const career = state.careerIntent
  const [name, setName] = useState('')
  const [formation, setFormation] = useState<FormationKey>('4-3-3')
  const [rivals, setRivals] = useState(5)
  const [league, setLeague] = useState<'br' | 'eu' | 'both'>('br') // baralho: 🇧🇷 Brasileirão, 🌍 Liga Europa ou 🌎 os dois juntos
  // carreira: quais times da Série D viram seus rivais fixos (vazio = os padrões).
  // Ao selecionar mais que o número escolhido, o mais antigo sai (fila).
  const [rivalPicks, setRivalPicks] = useState<string[]>([])
  const toggleRival = (team: string) => setRivalPicks(prev => {
    if (prev.includes(team)) return prev.filter(t => t !== team)
    const next = [...prev, team]
    return next.length > rivals ? next.slice(next.length - rivals) : next
  })
  // conta = fonte única do nome do time. Se logado, o nome vem do cadastro
  // (mesmo do online) e é editável aqui; ao começar, sincroniza de volta pra
  // conta — então trocar num lugar troca em todos (CPU, carreira, online, stats).
  const [accountName, setAccountName] = useState<string | null>(null) // null = deslogado
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
    const clean = name.trim()
    // logado e o nome mudou? sincroniza o cadastro → vale no online e nas stats
    if (accountName !== null && clean && clean !== accountName) {
      try { await supabase.auth.updateUser({ data: { display_name: clean } }) } catch { /* não trava o jogo */ }
    }
    // rivais escolhidos + completa com os padrões da Série D se faltar
    const picks = career
      ? [...rivalPicks, ...DIVISION_TEAMS['D'].map(t => t.team).filter(t => !rivalPicks.includes(t))].slice(0, rivals)
      : undefined
    // carreira offline = pirâmide de 4 divisões (baralho sempre BR + Europa juntos).
    // O modo rápido (career=false) segue no START normal com o baralho escolhido.
    if (career) dispatch({ type: 'START_CAREER_SOLO', teamName: clean, formation, rivals, rivalTeams: picks, league: 'both' })
    else dispatch({ type: 'START', teamName: clean, formation, rivals, career, rivalTeams: picks, league })
  }
  return (
    <Shell>
      <button onClick={() => dispatch({ type: 'GO_LOBBY' })}
        className="flex items-center gap-1 text-black/60 font-black text-sm pt-4 -mb-2 active:opacity-60" style={OSWALD}>
        <span className="text-lg leading-none">←</span> Home
      </button>
      <h2 className="font-black text-3xl pt-2" style={OSWALD}>{career ? '🪜 CARREIRA · SÉRIE D' : 'MONTE SUA SALA'}</h2>
      {career && <p className="text-sm font-bold text-black/60 -mt-1">Comece na Série D e suba até a A. O leilão é o mesmo — o que muda é subir de divisão a cada temporada. Dá pra salvar e voltar depois.</p>}
      {career && (
        <Box bg="#FFF6DE" className="p-4 space-y-1.5">
          <p className="font-black text-sm" style={OSWALD}>⚡ Como funciona a Carreira</p>
          <p className="text-xs font-bold text-black/75">🪜 <b>Pirâmide de 4 divisões:</b> começa na Série D e sobe até a A — sobe ou desce a cada temporada, conforme sua colocação.</p>
          <p className="text-xs font-bold text-black/75">🔨 <b>Mesmo leilão do modo rápido:</b> monta o time no pregão e disputa o campeonato de 38 rodadas.</p>
          <p className="text-xs font-bold text-black/75">🔥 <b>Rivais pra vida toda:</b> têm vida própria na pirâmide e só te enfrentam quando estão na sua divisão.</p>
          <p className="text-xs font-bold text-black/75">🏆 <b>Títulos acumulam:</b> cada título da Série A vira uma ⭐ no seu escudo.</p>
          <p className="text-xs font-bold text-black/75">💾 <b>Salva e continua:</b> pare e volte depois, em qualquer aparelho.</p>
        </Box>
      )}
      <Box className="p-4 space-y-4">
        {career ? (
          <div className="border-[3px] border-black rounded-xl p-3" style={{ background: '#EAF3FF' }}>
            <p className="font-black text-sm" style={OSWALD}>🌎 Baralho fixo: Brasileirão + Europa juntos</p>
            <p className="text-[11px] font-bold text-black/65 mt-1">Na Carreira o baralho é sempre os <b>auges do Brasileirão + os auges da Europa juntos</b> (~700 nomes) — precisa dos dois pra preencher bem os <b>80 times das 4 divisões</b>. Não tem baralho só BR nem só Europa por aqui.</p>
          </div>
        ) : (
        <div>
          <p className="text-xs font-black uppercase mb-1">Baralho de craques</p>
          <div className="grid grid-cols-2 gap-2">
            {([['br', '🇧🇷 Brasileirão'], ['eu', '🌍 Liga Europa']] as const).map(([id, label]) => (
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
            🌎 Os dois juntos
          </button>
          <p className="text-[11px] font-semibold text-black/55 mt-1">{league === 'br' ? 'Auges do futebol brasileiro — de Pelé a Obina.' : league === 'eu' ? 'Auges nos clubes europeus — de Yashin a Mbappé.' : 'Brasileirão + Europa juntos (~700 nomes) — craques e folclóricos dos dois lados no mesmo martelo.'}</p>
          {league === 'br' && <p className="text-[11px] font-bold mt-0.5" style={{ color: '#8a6d1f' }}>🃏 Quer resenha? Só aqui tem até o Walter Minhoca.</p>}
        </div>
        )}
        <div>
          <p className="text-xs font-black uppercase mb-1">Nome do seu time</p>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex.: Bagres do Asfalto"
            className="w-full border-[3px] border-black rounded-xl px-3 py-2 font-bold bg-white"
          />
          {accountName !== null && (
            <p className="text-[11px] font-semibold text-black/55 mt-1">🔗 É o nome da sua conta — vale no CPU, na carreira e no online. Se editar aqui, troca em todos os lugares (e nas estatísticas).</p>
          )}
        </div>
        <div>
          <p className="text-xs font-black uppercase mb-1">Formação (travada antes do pregão)</p>
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(FORMATIONS) as FormationKey[]).map(f => (
              <button key={f} onClick={() => setFormation(f)}
                className="border-[3px] border-black rounded-xl py-2 font-black text-sm"
                style={{ backgroundColor: formation === f ? GOLD : '#fff', boxShadow: formation === f ? `3px 3px 0 0 ${INK}` : 'none', ...OSWALD }}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-black uppercase mb-1">Rivais na sala (CPUs)</p>
          <div className="grid grid-cols-4 gap-2">
            {[3, 5, 7, 9].map(n => (
              <button key={n} onClick={() => setRivals(n)}
                className="border-[3px] border-black rounded-xl py-2 font-black text-sm"
                style={{ backgroundColor: rivals === n ? PURPLE : '#fff', color: rivals === n ? '#fff' : INK, boxShadow: rivals === n ? `3px 3px 0 0 ${INK}` : 'none', ...OSWALD }}>
                {n}
              </button>
            ))}
          </div>
        </div>
        {career && (
          <div>
            <p className="text-xs font-black uppercase mb-1">🔥 Escolha seus rivais <span className="text-black/50">({rivalPicks.length}/{rivals})</span></p>
            <p className="text-[11px] font-semibold text-black/55 mb-1.5">Eles serão seus rivais pra vida toda.</p>
            <div className="flex flex-wrap gap-1.5">
              {DIVISION_TEAMS['D'].map(t => {
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
              🎲 Não escolher — usar rivais padrão
            </button>
          </div>
        )}
        {career && <p className="text-xs font-semibold text-black/70">🏟️ A liga completa 20 times com os clássicos — você disputa a divisão contra os CPUs do leilão.</p>}
        <p className="text-xs font-semibold text-black/70">💰 Todo técnico começa com {START_MONEY} moedas. O que sobrar no fim do leilão <b>evapora</b> — gaste com sabedoria (ou sem).</p>
      </Box>
      <Btn onClick={start} className="w-full text-lg" bg={GREEN}>
        <span className="text-white">{career ? 'COMEÇAR CARREIRA 🪜' : 'ABRIR O PREGÃO 🔨'}</span>
      </Btn>
      {/* pirâmide nova (todo save novo) + carreira antiga (só pra quem já tinha um
          save em andamento poder terminar). Cada banner some sozinho se não houver
          save — então quem começa do zero vê só a pirâmide. */}
      {career && <><SoloContinueBanner /><CareerContinueBanner /></>}
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
        ✅ Logado{name ? ` como ${name}` : ''} — sendo campeão você leva uma carta-lembrança pro álbum 🎴
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
      <p className="font-black text-sm" style={OSWALD}>🎴 Colecione craques — faça seu cadastro</p>
      <p className="text-xs font-semibold text-black/75 mt-1">
        <b>Com conta:</b> sendo campeão (no CPU ou online) você ganha um <b>craque colecionável limitado</b> pro seu álbum.
      </p>
      <p className="text-xs font-semibold text-black/60 mt-0.5">
        <b>Sem conta:</b> joga à vontade, mas <b>não ganha carta</b>.
      </p>
      <p className="text-xs font-black mt-1.5" style={{ color: GREEN, ...OSWALD }}>👉 Toque aqui pra criar sua conta</p>
    </button>
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
function AuctionBar() {
  const { state } = useEsc()
  const you = state.managers[state.youIdx]
  return (
    <div className="flex items-center justify-between max-w-xl mx-auto">
      <div className="flex gap-1.5">
        {SECTORS.map((p, i) => (
          <span key={p} className="border-2 border-black rounded-full px-2 py-0.5 text-[10px] font-black"
            style={{ backgroundColor: i < state.sectorIdx ? INK : i === state.sectorIdx ? GOLD : '#fff', color: i < state.sectorIdx ? '#fff' : INK }}>
            {p}
          </span>
        ))}
      </div>
      <CoinCounter value={you.money} />
    </div>
  )
}

// ─── reações efêmeras (zoeira/blefe) — só online ─────────────────────
const EMOTE_KINDS = ['👀', '🤣', '❤️', '💸']

// camada flutuante que mostra as reações de todo mundo subindo e sumindo
// cor por usuário (estável pelo nome) — diferencia as mensagens de cada um no balão.
const CHAT_COLORS = ['#7C3AED', '#E8503A', '#1B7A3D', '#2E6FB0', '#C77800', '#B23B8E', '#0E8A8A', '#B8860B']
function chatColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return CHAT_COLORS[h % CHAT_COLORS.length]
}
function FloatingEmotes() {
  const { state, emotes } = useEsc()
  if (state.onlineMode !== 'online' || emotes.length === 0) return null
  const you = state.managers[state.youIdx]
  const cardName = (id?: string) => {
    if (!id) return null
    const c = state.currentCards.find(x => x.id === id)
      ?? state.revealQueue.find(q => q.card.id === id)?.card
      ?? state.tiebreaks.find(t => t.card.id === id)?.card
    return c ? c.name : null
  }
  return (
    <div className="fixed inset-x-0 bottom-20 z-50 pointer-events-none flex flex-col-reverse items-center gap-1 px-3">
      <AnimatePresence>
        {emotes.slice(-6).map(e => {
          const m = state.managers[e.from]
          const who = m ? (m.id === you.id ? 'Você' : (m.teamName || m.name)) : ''
          const cn = cardName(e.cardId)
          return (
            <motion.div key={e.id} initial={{ opacity: 0, y: 24, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -34 }}
              className="flex items-center gap-1.5 bg-white border-2 border-black rounded-full px-3 py-1"
              style={{ boxShadow: `2px 2px 0 0 ${INK}` }}>
              <span className="text-lg leading-none">{e.kind}</span>
              {/* alfinetada (frase) → nome de quem manda NA FRENTE; reação simples → "quem → carta" */}
              <span className="text-xs font-black text-black truncate max-w-[70vw]" style={OSWALD}>{e.text ? <><span style={{ color: chatColor(m?.teamName || m?.name || who) }}>{who}:</span> {e.text}</> : <>{who}{cn ? ` → ${cn}` : ''}</>}</span>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
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
      {open && (
        <div className="absolute right-0 top-9 z-30 flex gap-1 bg-white border-2 border-black rounded-lg p-1"
          style={{ boxShadow: `2px 2px 0 0 ${INK}` }}>
          {EMOTE_KINDS.map(k => (
            <button key={k} onClick={() => { emote(k, cardId); setOpen(false) }} className="text-xl leading-none px-0.5">{k}</button>
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
  return <>{sub}<FloatingEmotes /></>
}

function Envelope() {
  const { state, dispatch, emote } = useEsc()
  const you = state.managers[state.youIdx]
  const pos = SECTORS[state.sectorIdx]
  const rescue = state.phase === 'resq_envelope'
  const [bids, setBids] = useState<Record<string, number>>({})
  // "enviei mas ainda não veio confirmação do host" — sem isso, se o host
  // demorar (ou tiver caído), o jogador ficava vendo os lances dele
  // somem sem nunca lacrar de verdade: um clique em LACRAR sempre limpava
  // os valores na hora, mesmo quando o envio pro host não tinha efeito.
  const [pending, setPending] = useState(false)
  const pendingBidsRef = useRef<{ cardId: string; amount: number }[]>([])
  const total = Object.values(bids).reduce((s, v) => s + v, 0)
  const myOpen = openSlots(you, pos)
  const canBid = myOpen > 0 && you.money > 0
  const online = state.onlineMode === 'online'
  const iSubmitted = state.submitted.includes(you.id)
  const humanBidders = state.managers.filter(m => m.isHuman && openSlots(m, pos) > 0 && m.money > 0)
  const waitingFor = humanBidders.filter(m => !state.submitted.includes(m.id))

  // ─── cronômetro de 45s ───────────────────────────────────────────
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(iv)
  }, [])
  const remaining = state.phaseDeadline ? Math.max(0, Math.ceil((state.phaseDeadline - now) / 1000)) : 45

  function seal() {
    const payload = Object.entries(bids).map(([cardId, amount]) => ({ cardId, amount }))
    pendingBidsRef.current = payload
    setPending(true)
    dispatch({ type: 'SUBMIT_ENVELOPE', mgrId: you.id, bids: payload })
  }

  // confirmação chegou (o host aplicou e devolveu o estado): só agora limpa
  useEffect(() => {
    if (iSubmitted) { setBids({}); setPending(false) }
  }, [iSubmitted])

  // enquanto não confirma, reenvia de tempos em tempos — cobre o host que
  // ficou um instante sem conexão (app em segundo plano etc.) e reconecta
  useEffect(() => {
    if (!online || !pending || iSubmitted) return
    const iv = setInterval(() => {
      dispatch({ type: 'SUBMIT_ENVELOPE', mgrId: you.id, bids: pendingBidsRef.current })
    }, 4000)
    return () => clearInterval(iv)
  }, [online, pending, iSubmitted, dispatch, you.id])

  // auto-lacra ao zerar o timer
  useEffect(() => {
    if (remaining <= 0 && canBid && !iSubmitted && !pending) seal()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, canBid, iSubmitted, pending])

  // já lacrei, ou enviei e tô esperando o host confirmar (online)
  if (online && (iSubmitted || pending)) {
    return (
      <Shell bar={<AuctionBar />}>
        <div className="pt-10 text-center space-y-3">
          <div className="text-5xl">{iSubmitted ? '🔒' : '🔄'}</div>
          <h2 className="font-black text-2xl" style={OSWALD}>{iSubmitted ? 'ENVELOPE LACRADO' : 'ENVIANDO…'}</h2>
          <p className="font-semibold text-black/70">
            {iSubmitted
              ? `Aguardando os outros técnicos lacrarem… (${remaining}s)`
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

  // ordem embaralhada do baralho (NÃO ordenar por nível — isso vazava quem é
  // bom pela posição na tela e furava o leilão às cegas)
  const cards = state.currentCards
  // cores dos técnicos (iguais às da tabela da temporada) — pra marcar de quem
  // é o jogador listado no leilão. Só na carreira online (onde há listagem).
  const seasonColors = state.careerOnline
    ? playerColors(state.managers.filter(m => m.isHuman || m.rival).map(m => m.id), you.id, state.seed)
    : {}
  const timerColor = remaining <= 10 ? RED : remaining <= 20 ? GOLD : GREEN
  const timerTextColor = remaining <= 20 ? INK : '#fff'
  const totalBatches = batchCount(state.deck[pos].length)
  const curBatch = Math.min(totalBatches, Math.ceil(state.sectorCursor / BATCH_SIZE))
  // trava em quantos jogadores DIFERENTES dá pra apostar: no máximo suas
  // vagas abertas nessa posição (dá lance em todas de uma vez). Sem isso,
  // apostar em mais candidatos do que cabe é ambíguo — a resolução roda por
  // ordem de menor disputa, então você poderia ganhar o "backup" ao invés do
  // favorito, mesmo tendo dado lance maior nele.
  const bidLimit = myOpen
  const chosenCount = Object.keys(bids).length

  return (
    <Shell bar={<AuctionBar />}>
      <div className="pt-1 flex items-start justify-between gap-3">
        <div className="flex-1">
          <h2 className="font-black text-3xl" style={OSWALD}>
            {rescue ? '⚡ REPESCAGEM · ' : '🔨 '}{SECTOR_LABEL[pos].toUpperCase()}
          </h2>
          <p className="text-sm font-semibold text-black/70">
            {rescue
              ? <>Sobras do setor, última chance de pagar por elas. Só quem ficou com buraco participa. Suas vagas: <b>{myOpen}</b>.</>
              : 'Lance cego: distribua suas moedas em segredo. Ninguém vê nada até a revelação.'}
          </p>
          {/* dica de leitura das cartas — só no PRIMEIRO setor pra não poluir:
              muita gente vê "Vini Jr · Flamengo" e acha que é o craque de hoje */}
          {!rescue && state.sectorIdx === 0 && (
            <p className="text-[11px] font-bold text-black/55 mt-1 leading-snug">
              💡 O nível da carta é o <b>auge do jogador naquele clube e ano</b>: Kaká · São Paulo 2003 é promessa, Kaká · Milan 2007 é lenda. Repara no clube e no ano antes do lance!
            </p>
          )}
          {!rescue && totalBatches > 1 && (
            <div className="mt-1.5 inline-flex items-center gap-1.5 border-[3px] border-black rounded-full px-3 py-1"
              style={{ backgroundColor: '#2E6FB0', boxShadow: `2px 2px 0 0 ${INK}` }}>
              <span className="text-sm leading-none">📦</span>
              <span className="text-[11px] font-black text-white uppercase tracking-wide" style={OSWALD}>
                {totalBatches - curBatch > 0
                  ? `Leva ${curBatch} de ${totalBatches} · ainda ${totalBatches - curBatch > 1 ? 'vêm' : 'vem'} mais ${totalBatches - curBatch} leva${totalBatches - curBatch > 1 ? 's' : ''} de ${SECTOR_LABEL[pos].toLowerCase()}`
                  : `Última leva de ${SECTOR_LABEL[pos].toLowerCase()} · ${curBatch} de ${totalBatches}`}
              </span>
            </div>
          )}
        </div>
        <div className="border-[3px] border-black rounded-xl px-3 py-2 text-center min-w-[64px]"
          style={{ backgroundColor: timerColor, boxShadow: `3px 3px 0 0 ${INK}` }}>
          <p className="text-[9px] font-black uppercase" style={{ color: timerTextColor }}>Tempo</p>
          <p className="font-black text-2xl leading-none" style={{ ...OSWALD, color: timerTextColor }}>{remaining}s</p>
        </div>
      </div>

      {!canBid && (
        <Box bg="#FFE9B0" className="p-3">
          <p className="text-sm font-bold text-black">{myOpen === 0 ? 'Setor completo — você só assiste esta rodada.' : 'Sem dinheiro — resta torcer pelo Monte Final.'}</p>
        </Box>
      )}

      {/* REGRA DE OURO + VAGAS — brilhante e centralizado logo acima dos lances,
          pra ninguém achar que 1 moeda leva nem que só dá pra apostar em um. */}
      {!rescue && canBid && bidLimit > 0 && (
        <div className="space-y-2">
          <div className="text-center border-[3px] border-black rounded-xl px-3 py-2"
            style={{ background: `linear-gradient(180deg, #FFE07A 0%, ${GOLD} 100%)`, boxShadow: `3px 3px 0 0 ${INK}` }}>
            <p className="font-black text-lg leading-tight" style={OSWALD}>🏆 GANHA QUEM DÁ O MAIOR LANCE</p>
            <p className="text-[11px] font-bold text-black/70 mt-0.5">Não é 1 moeda que leva — é quem <b>paga mais</b>. Empate? Re-lance às cegas.</p>
          </div>
          <div className="text-center border-[3px] border-black rounded-xl px-3 py-1.5"
            style={{ background: '#E7F7EC', boxShadow: `3px 3px 0 0 ${INK}` }}>
            {bidLimit === 1
              ? <p className="text-sm font-black" style={{ color: '#146c33' }}>Você tem <b>1 vaga</b> — dê seu lance em quem quer levar.</p>
              : <p className="text-sm font-black" style={{ color: '#146c33' }}>Você tem <b>{bidLimit} vagas</b> — pode dar lance em até <b>{bidLimit} jogadores DE UMA VEZ</b> nesta rodada, não só em um! 👈</p>}
          </div>
          {cards.some(c => c.id === state.surpriseId) && (
            <div className="text-center border-[3px] border-black rounded-xl px-3 py-1.5 text-white"
              style={{ background: PURPLE, boxShadow: `3px 3px 0 0 ${INK}` }}>
              <p className="text-sm font-black" style={OSWALD}>🎁 JOGADOR SURPRESA nesta rodada!</p>
              <p className="text-[11px] font-bold" style={{ opacity: 0.9 }}>O nome está escondido — você só vê posição, clube e ano. Arrisca no escuro; o nome sai no martelo.</p>
            </div>
          )}
        </div>
      )}

      {!state.streamMode && canBid && cards.some(c => ((c as { paid?: number }).paid ?? 0) > 0) && (
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
          // de quem é esse jogador listado (carreira): marca sutil na cor do técnico
          const sellerId = (c as { seller?: number }).seller
          const sellerM = sellerId != null ? state.managers.find(m => m.id === sellerId) : undefined
          const sCol = sellerM ? seasonColors[sellerM.id] : undefined
          const isMine = sellerM?.id === you.id
          return (
          <Box key={c.id} className="p-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              {sellerM && (
                <span className="inline-flex items-center gap-1 rounded-full border-2 border-black px-1.5 py-0.5 text-[9px] font-black uppercase leading-none mb-1"
                  style={{ background: sCol?.solid ?? '#6b7280', color: '#fff', ...OSWALD }}>
                  {isMine ? '🫵 seu jogador' : `${sellerM.rival ? '⚔️' : sellerM.isHuman ? '🔥' : '🔁'} ${sellerM.teamName}`}
                </span>
              )}
              <CardFace c={c} surprise={c.id === state.surpriseId} />
            </div>
            <div className="flex items-center gap-1.5">
              {canBid && (
                <div className="flex flex-col items-center">
                  {/* rótulo: carta com piso mostra o mínimo (🔒); senão, na 1ª tela, "seu lance" */}
                  {!state.streamMode && (floor > 0
                    ? <span className="text-[9px] font-black uppercase leading-none mb-0.5 tracking-wide" style={{ color: belowFloor ? RED : '#B8860B' }}>mín 🔒 {floor}</span>
                    : state.sectorIdx === 0 && <span className="text-[9px] font-black uppercase leading-none mb-0.5 tracking-wide" style={{ color: '#B8860B' }}>seu lance</span>)}
                  <div className="flex items-center gap-1.5">
                    <HoldButton onStep={() => bump(c, -1)} className="border-2 border-black rounded-lg w-8 h-8 font-black bg-white text-black">−</HoldButton>
                    <span className="w-9 text-center font-black" style={{ ...OSWALD, color: numColor }}>{state.streamMode ? (chosen ? '🔒' : '–') : (chosen ? bid : floor > 0 ? floor : 0)}</span>
                    <HoldButton
                      onStep={() => bump(c, 1)}
                      disabled={plusBlocked}
                      className={`border-2 border-black rounded-lg w-8 h-8 font-black text-black ${plusBlocked ? 'opacity-40' : ''}`}
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
        <Box bg="#111" className="p-2.5 text-center">
          <p className="font-black text-white text-xs" style={OSWALD}>🎥 MODO STREAM — os valores ficam ocultos até o martelo. Manda ver no dedo! 🔒</p>
        </Box>
      )}
      <Box bg="#fff" className="p-3 flex items-center justify-between">
        <p className="font-black text-black" style={OSWALD}>ENVELOPE: {state.streamMode ? '🔒' : total} / {you.money}</p>
        <Btn onClick={seal} bg={RED}>
          <span className="text-white">LACRAR 🔒</span>
        </Btn>
      </Box>
      {online && waitingFor.length > 0 && (
        <p className="text-center text-xs font-bold text-black/60">Faltam lacrar: {waitingFor.map(m => m.teamName).join(', ')}</p>
      )}

      <YourPitch />
      <RivalsStrip />
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
    dispatch({ type: 'SUBMIT_TIEBREAK', mgrId: you.id, amount: v })
  }
  // confirmação do host chegou
  useEffect(() => { if (iSubmitted) setPending(false) }, [iSubmitted])
  // reenvia enquanto não confirma (online)
  useEffect(() => {
    if (!online || !pending || iSubmitted) return
    const iv = setInterval(() => dispatch({ type: 'SUBMIT_TIEBREAK', mgrId: you.id, amount: pendingAmtRef.current }), 4000)
    return () => clearInterval(iv)
  }, [online, pending, iSubmitted, dispatch, you.id])
  // auto-envia ao zerar o timer (cobre o solo e o próprio jogador)
  useEffect(() => {
    if (remaining <= 0 && amInIt && !iSubmitted && !pending) send(amount)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, amInIt, iSubmitted, pending])

  if (!tb) return null

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
          <Box bg={GOLD} className="p-5" shadow={6}>
            <CardFace c={tb.card} big />
            <p className="mt-4 text-center font-black text-lg" style={OSWALD}>🍿 Você assiste este duelo</p>
            <p className="text-center text-sm font-bold text-black/60">
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
        <Box bg={GOLD} className="p-5" shadow={6}>
          <CardFace c={tb.card} big />
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
function AutoAdvance({ hasBids, canDrive, extraMs = 0 }: { hasBids: boolean; canDrive: boolean; isLast: boolean; extraMs?: number }) {
  const { state, dispatch } = useEsc()
  useEffect(() => {
    if (!canDrive) return
    const delay = (hasBids ? 2000 : 1000) + extraMs
    const t = setTimeout(() => dispatch({ type: 'ADVANCE_REVEAL' }), delay)
    return () => clearTimeout(t)
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

function Reveal() {
  const { state } = useEsc()
  const item = state.revealQueue[state.revealIdx]
  const you = state.managers[state.youIdx]
  if (!item) return null
  const winnerMgr = item.winner !== null ? state.managers.find(m => m.id === item.winner) : null
  const isLast = state.revealIdx >= state.revealQueue.length - 1
  const online = state.onlineMode === 'online'
  const canDrive = !online || state.isHost
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

  return (
    <Shell bar={<AuctionBar />}>
      <p className="text-center text-xs font-black uppercase text-black/70 pt-1">
        Revelação {state.revealIdx + 1} / {state.revealQueue.length} · pote crescente
      </p>
      <motion.div key={item.card.id} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <motion.div animate={sold ? { x: [0, -11, 11, -8, 8, -4, 4, 0] } : undefined}
          transition={{ delay: hammerDelay, duration: 0.5 }}>
        <Box bg={item.card.fame >= 5 ? GOLD : '#fff'} className="p-5 relative" shadow={6}>
          {item.card.fame >= 5 && (
            <span className="absolute top-2 right-2 z-10 text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-black bg-white" style={OSWALD}>👑 LENDA</span>
          )}
          {item.card.id === state.surpriseId && (
            <span className="absolute top-2 left-2 z-10 text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-black text-white" style={{ ...OSWALD, background: PURPLE }}>🎁 SURPRESA</span>
          )}
          <CardFace c={item.card} big highlight={item.card.id === state.surpriseId} />
          <div className="mt-4 space-y-1.5">
            {item.bids.length === 0 && (
              <p className="font-bold text-black/70">Nenhum lance. Vai pro Monte Final. 🪣</p>
            )}
            {item.bids.map((b, i) => {
              const m = state.managers.find(x => x.id === b.mgr)!
              const voided = item.voided.includes(b.mgr)
              const isWinner = item.winner === b.mgr
              return (
                <motion.div key={i} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.25 }}
                  className="flex items-center justify-between border-2 border-black rounded-lg px-3 py-1.5"
                  style={{ backgroundColor: isWinner ? GREEN : voided ? '#ddd' : '#fff' }}>
                  <p className="font-bold text-sm" style={{ color: isWinner ? '#fff' : INK }}>
                    {m.id === you.id ? '🫵 Você' : m.teamName}{voided ? ' · anulado (setor cheio)' : ''}
                  </p>
                  <p className="font-black" style={{ ...OSWALD, color: isWinner ? '#fff' : INK }}>{b.amount}</p>
                </motion.div>
              )
            })}
          </div>
          {tie && (
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
          {winnerMgr && (
            <motion.div className="mt-3 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: hammerDelay }}>
              {sold && (
                <>
                  <motion.div className="text-5xl leading-none"
                    initial={{ y: -55, rotate: -75, opacity: 0 }}
                    animate={{ y: [-55, 6, 0], rotate: [-75, 8, 0], opacity: 1 }}
                    transition={{ delay: hammerDelay, duration: 0.5, type: 'spring', bounce: 0.55 }}>🔨</motion.div>
                  <motion.p className="font-black text-3xl -mt-1" style={{ ...OSWALD, color: RED }}
                    initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }} transition={{ delay: hammerDelay + 0.12, duration: 0.35 }}>
                    MARTELO!
                  </motion.p>
                </>
              )}
              <p className="font-black text-lg" style={OSWALD}>
                🔨 VENDIDO {winnerMgr.id === you.id ? 'PRA VOCÊ' : `pro ${winnerMgr.teamName}`} por {item.paid}!
              </p>
            </motion.div>
          )}
        </Box>
        </motion.div>
      </motion.div>
      {/* auto-avanço: 1s por carta, 2s se houve lance; +tempo se teve desempate */}
      <AutoAdvance hasBids={item.bids.length > 0} canDrive={canDrive} isLast={isLast} extraMs={tie ? (tie.viaRoulette ? 3200 : 1500) : 0} />
      <p className="text-center text-xs font-bold text-black/60 py-1">
        {canDrive ? '🎬 Passando automaticamente…' : '🔨 O host está conduzindo a revelação…'}
      </p>
      <YourPitch small />
    </Shell>
  )
}

function RivalsStrip() {
  const { state } = useEsc()
  const you = state.managers[state.youIdx]
  // só quem REALMENTE disputa o leilão, sem contar você mesmo: no solo são
  // os rivais CPU; online são os amigos humanos da sala (bots de
  // preenchimento já têm elenco pronto e nunca dão lance — não fazem
  // sentido aqui)
  const rivals = state.managers.filter(m => m.id !== you.id && m.auctionRival)
  if (rivals.length === 0) return null
  return (
    <div>
      <p className="text-xs font-black uppercase text-black/70 mb-1.5">A sala</p>
      <div className="grid grid-cols-2 gap-2">
        {rivals.map(m => (
          <Box key={m.id} className="p-2.5" shadow={3}>
            <p className="font-black text-sm truncate" style={OSWALD}>{m.teamName}</p>
            <p className="text-[11px] font-semibold text-black/55">{m.formation} · 💰 {m.money} · {m.squad.length}/{m.squad.length + totalHoles(m)}</p>
            <p className="text-[10px] font-medium text-black/70" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {[...m.squad].sort((a, b) => SECTORS.indexOf(a.pos) - SECTORS.indexOf(b.pos)).map(c => c.name).join(', ') || 'ainda sem contratações'}
            </p>
          </Box>
        ))}
      </div>
    </div>
  )
}

// ─── MONTE FINAL ─────────────────────────────────────────────────────
export function EscMonte() {
  const { state, dispatch } = useEsc()
  const you = state.managers[state.youIdx]
  const isYourTurn = state.monteOrder[state.monteIdx] === you.id && totalHoles(you) > 0
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
      <h2 className="font-black text-3xl pt-1" style={OSWALD}>🪣 MONTE FINAL</h2>
      <p className="text-sm font-semibold text-black/70">
        As sobras do pregão. Quem tem mais buracos escolhe primeiro, em serpente. Seus buracos: <b>{totalHoles(you)}</b>.
      </p>
      {state.careerOnline && state.monte.some(c => ((c as { paid?: number }).paid ?? 0) > 0) && (
        <p className="text-xs font-semibold text-black/60">
          🆓 Sobra <b>sem valor</b> é de <b>graça</b>. Jogador <b>com piso</b> (💰) é <b>compra sem leilão</b> — paga o valor fixo. Nos jogadores que <b>você listou</b> você tem <b>preferência</b>: a primeira chance de recuperar de graça (já valendo a metade). Se deixar passar, aí os outros levam — pagando metade.
        </p>
      )}
      {online && (
        <p className="text-xs font-semibold text-black/60">
          ⏱️ {remaining ?? MONTE_SECONDS}s por vez. {state.careerOnline
            ? <>Se estourar o tempo, você <b>não pega ninguém</b> e passa a vez — sem multa (seu time já tem os 11).</>
            : <>Estourou o tempo (foi ao banheiro?), o jogo escolhe a pior sobra pra você e cobra 5 moedas de multa.</>}
        </p>
      )}
      {isYourTurn ? (
        <div className="space-y-2">
          <Box bg={remaining !== null && remaining <= 5 ? RED : GOLD} className="p-3">
            <p className="font-black text-center" style={{ ...OSWALD, color: remaining !== null && remaining <= 5 ? '#fff' : INK }}>
              SUA VEZ — escolha uma carta{remaining !== null ? ` · ${remaining}s` : ''}
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
                    <span className="text-sm font-black" style={OSWALD}>🫵 seu</span>
                    <br /><span className="text-[8px] font-bold uppercase" style={{ color: 'rgba(0,0,0,0.5)' }}>recupere grátis · vale {val}</span>
                  </span>
                )}
                {paidCard && (
                  <span className="text-right leading-tight" style={{ color: afford ? '#B8860B' : RED }}>
                    <span className="text-sm font-black" style={OSWALD}>💰 {val}</span>
                    <br /><span className="text-[8px] font-bold uppercase" style={{ color: afford ? 'rgba(0,0,0,0.5)' : RED }}>pague sem leilão</span>
                  </span>
                )}
                <Btn onClick={() => afford && dispatch({ type: 'MONTE_PICK', mgrId: you.id, cardId: c.id })} bg={paidCard ? GOLD : GREEN} disabled={!afford}>
                  <span style={{ color: paidCard ? INK : '#fff' }}>{paidCard ? (afford ? `PAGAR ${val}` : 'SEM CAIXA') : 'PEGAR'}</span>
                </Btn>
              </div>
            </Box>
            )
          })}
        </div>
      ) : (
        <Box className="p-4">
          <p className="font-bold text-center text-black">
            {curMgr ? <>Vez de <b>{curMgr.teamName}</b>{remaining !== null ? ` · ${remaining}s` : ''}…</> : 'Aguardando a serpente chegar em você…'}
          </p>
        </Box>
      )}
      <YourPitch />
    </Shell>
  )
}

// ─── CERIMÔNIA DA REVELAÇÃO ──────────────────────────────────────────
export function EscCerimonia() {
  const { state, dispatch } = useEsc()
  const [idx, setIdx] = useState(0)
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

  // achados e micos da sala inteira
  const all = mgrs.flatMap(mg => mg.squad.map(c => ({ mg, c, mid: (c.lo + c.hi) / 2 })))
  const paid = all.filter(x => x.c.paid > 0)
  const bestDeal = paid.length ? [...paid].sort((a, b) => (b.mid / b.c.paid) - (a.mid / a.c.paid))[0] : null
  const worstDeal = paid.length ? [...paid].sort((a, b) => (b.c.paid - b.mid) - (a.c.paid - a.mid))[0] : null

  return (
    <Shell>
      <div className="text-center pt-4">
        <h2 className="font-black text-3xl" style={OSWALD}>🎭 CERIMÔNIA DA REVELAÇÃO</h2>
        <p className="text-sm font-semibold text-black/60">As faixas de nível abrem. Agora todo mundo descobre o que comprou.</p>
      </div>
      {secsLeft !== null && (
        <div className="rounded-2xl border-[3px] border-black p-3 text-center" style={{ background: secsLeft <= 10 ? '#E8503A' : GREEN, boxShadow: `4px 4px 0 ${INK}` }}>
          <p className="font-black text-white text-sm leading-tight" style={OSWALD}>⏱️ O campeonato começa em</p>
          <p className="font-black text-white text-4xl leading-none mt-0.5" style={OSWALD}>{secsLeft}s</p>
          <p className="font-bold text-white/80 text-[11px] mt-1">Aproveite pra ver os times de todo mundo 👀</p>
        </div>
      )}
      <Box bg={m.id === you.id ? GOLD : '#fff'} className="p-4" shadow={6}>
        <p className="font-black text-xl" style={OSWALD}>{m.id === you.id ? `🫵 ${m.teamName}` : m.teamName} <span className="text-sm font-bold text-black/70">({m.formation})</span></p>
        <div className="mt-2 space-y-1.5">
          {[...m.squad].sort((a, b) => SECTORS.indexOf(a.pos) - SECTORS.indexOf(b.pos)).map(c => {
            const tb = tierBadge(c)
            return (
            <div key={c.id} className="flex items-center justify-between border-2 border-black rounded-lg px-3 py-1.5 bg-white">
              <div>
                <p className="font-bold text-sm">{c.pos} · {c.name} <span className="text-black/70 text-xs">({c.club} {c.year})</span></p>
                <p className="text-[10px] font-semibold text-black/70">
                  {c.via === 'bot' ? 'escalado direto' : c.via === 'monte' ? 'monte (grátis)' : c.via === 'repescagem' ? `repescagem · pagou ${c.paid}` : `leilão · pagou ${c.paid}`}
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
      {isLastMgr && bestDeal && worstDeal && (
        <Box className="p-4 space-y-1.5">
          <p className="font-black text-sm" style={OSWALD}>🏅 ACHADO DO PREGÃO: {bestDeal.c.name} ({bestDeal.c.lo}–{bestDeal.c.hi}) por {bestDeal.c.paid} — {bestDeal.mg.teamName}</p>
          <p className="font-black text-sm" style={OSWALD}>🐴 MICO DO PREGÃO: {worstDeal.c.name} ({worstDeal.c.lo}–{worstDeal.c.hi}) por {worstDeal.c.paid} — {worstDeal.mg.teamName}</p>
        </Box>
      )}
      {state.careerOnline && (state.marketLog?.length ?? 0) > 0 && (
        <Box bg="#EEF7FF" className="p-4 space-y-1">
          <p className="font-black text-sm" style={OSWALD}>🏟️ OUTROS TIMES NO LEILÃO</p>
          <p className="text-[11px] font-semibold text-black/55 !mb-1.5">A cada temporada alguns times da pirâmide entram no leilão (sorteados). Eles só dão lance quando a posição está <b>sem disputa</b> — nenhum ou só um técnico ofertou.</p>
          {state.marketLog!.slice(0, 14).map((l, i) => <p key={i} className="text-xs font-bold text-black/75">{l}</p>)}
          {state.marketLog!.length > 14 && <p className="text-[10px] font-semibold text-black/50">…e mais {state.marketLog!.length - 14}</p>}
        </Box>
      )}
      {/* navegação livre pelos times durante os 45s (dá a volta) */}
      <div className="flex gap-2">
        <div className="flex-1"><Btn className="w-full" bg="#fff"
          onClick={() => setIdx((idx - 1 + mgrs.length) % mgrs.length)}>◀ Anterior</Btn></div>
        <div className="shrink-0 flex items-center px-2 font-black text-sm text-black/50" style={OSWALD}>{idx + 1}/{mgrs.length}</div>
        <div className="flex-1"><Btn className="w-full" bg={GOLD}
          onClick={() => setIdx((idx + 1) % mgrs.length)}>Próximo ▶</Btn></div>
      </div>
      {canStart ? (
        <Btn className="w-full text-lg" bg={GREEN} onClick={() => dispatch({ type: 'FINISH_CEREMONY' })}>
          <span style={{ color: '#fff' }}>COMEÇAR AGORA 🏆</span>
        </Btn>
      ) : (
        <p className="text-center text-sm font-bold text-black/55 py-1">🔨 O campeonato começa quando o tempo acabar…</p>
      )}
    </Shell>
  )
}

// ─── TEMPORADA (autoplay: 38 rodadas em ~3 min, relógio correndo) ─────
const TACTIC_LABEL: Record<Tactic, string> = { retranca: '🧱 Retranca', equilibrio: '⚖️ Equilíbrio', ataque: '🔥 Ataque' }
export const SEASON_TOTAL_MS = 180_000
const ROUND_MS = Math.round(SEASON_TOTAL_MS / 38) // ~4,7s por rodada

export function EscSeason() {
  const { state, dispatch } = useEsc()
  const you = state.managers[state.youIdx]
  const online = state.onlineMode === 'online'
  const canAdvance = !online || state.isHost
  const myTactic = state.tactics[you.id] ?? 'equilibrio'
  const table = sortedTable(state.league)
  const youPos = table.findIndex(t => t.id === you.id) + 1
  const fixture = state.round < 38 ? state.fixtures[state.round].find(([h, a]) => h === you.id || a === you.id) : undefined
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
  const [resultRevealed, setResultRevealed] = useState(false)
  const [showPyramid, setShowPyramid] = useState(false)
  useEffect(() => {
    setResultRevealed(false)
    const t = setTimeout(() => setResultRevealed(true), ROUND_MS * 0.85 + 250)
    return () => clearTimeout(t)
  }, [state.round])

  // manchete PESSOAL (por quem vê): detecta quando VOCÊ muda de faixa na
  // tabela. Feito no cliente pra ficar certo pra cada um no online.
  const prevPosRef = useRef(youPos)
  const [personalNews, setPersonalNews] = useState<string | null>(null)
  const personalTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    const prev = prevPosRef.current
    prevPosRef.current = youPos
    if (state.round === 0 || prev === youPos) return
    // só MOMENTOS marcantes (cruzou uma faixa). Sem número de posição — ele fica
    // velho na hora, porque a temporada roda rápido. E some sozinho em 5s pra não
    // ficar contradizendo a tabela embaixo.
    let msg: string | null = null
    if (youPos === 1 && prev !== 1) msg = '👑 Você é o novo LÍDER do campeonato!'
    else if (youPos <= 4 && prev > 4) msg = '📈 Você ENTROU no G4!'
    else if (youPos >= 17 && prev < 17) msg = '⚠️ PERIGO! Você caiu pra zona de rebaixamento!'
    else if (youPos < 17 && prev >= 17) msg = '😮‍💨 Você escapou do Z4!'
    if (msg) {
      setPersonalNews(msg)
      if (personalTimer.current) clearTimeout(personalTimer.current)
      personalTimer.current = setTimeout(() => setPersonalNews(null), 5000)
    }
  }, [state.round, youPos])
  useEffect(() => () => { if (personalTimer.current) clearTimeout(personalTimer.current) }, [])

  // autoplay: só quem "puxa" a temporada dispara a próxima rodada (host no
  // online, o próprio cliente no CPU). Os demais só recebem o resultado
  // sincronizado e tocam a animação do próprio jogo localmente.
  useEffect(() => {
    if (!canAdvance || state.round >= 38 || state.dinastiaPaused) return // Dinastia: para na janela do meio
    const t = setTimeout(() => dispatch({ type: 'PLAY_ROUND' }), ROUND_MS)
    return () => clearTimeout(t)
  }, [state.round, canAdvance, dispatch, state.dinastiaPaused])

  return (
    <Shell bar={
      <div className="flex items-center justify-between max-w-xl mx-auto gap-2">
        <span className="font-black text-sm" style={OSWALD}>
          {state.careerDivision && <span className="mr-1.5 px-1.5 py-0.5 rounded bg-purple-700 text-white text-[11px]">🪜 {DIVISION_LABEL[state.careerDivision].toUpperCase()}</span>}
          {state.careerOnline && !state.careerDivision && <span className="mr-1.5 px-1.5 py-0.5 rounded bg-purple-700 text-white text-[11px]">🪜 CARREIRA · SÉRIE D</span>}
          {state.careerTitlesA > 0 && <span className="mr-1.5"><CareerStars n={state.careerTitlesA} size={12} /></span>}
          RODADA {Math.min(state.round + 1, 38)}/38
        </span>
        <span className="font-black text-sm" style={OSWALD}>{(() => {
          const disp = !resultRevealed && state.lastResults.length > 0 ? sortedTable(leagueBeforeResults(state.league, state.lastResults)) : table
          const pos = disp.findIndex(t => t.id === you.id) + 1
          return `${pos}º · ${disp[pos - 1]?.pts ?? 0} pts`
        })()}</span>
      </div>
    }>
      {myLast ? (() => {
        // mesmo placar da carreira (LiveScoreCard): relógio, GOOOL, flash e bump.
        const homeIsYou = myLast.homeId === you.id
        const oppId = homeIsYou ? myLast.awayId : myLast.homeId
        const oppIsHuman = state.managers.some(m => m.id === oppId && m.isHuman)
        const youColor = '#7C3AED', oppColor = oppIsHuman ? '#E8503A' : '#3A7CA5'
        const nameOf = (id: number) => state.league.find(t => t.id === id)?.name ?? '?'
        const scorer = (text: string) => { const mm = text.match(/⚽\s+(.+?)\s+marca para/); return mm ? mm[1] : text.replace(/^⚽\s*/, '').replace(/\.$/, '') }
        const goals = myLast.highlights.map(hl => ({ name: scorer(hl.text), min: hl.min, home: hl.teamId === myLast.homeId }))
        return <LiveScoreCard key={state.round}
          homeName={nameOf(myLast.homeId)} awayName={nameOf(myLast.awayId)}
          homeColor={homeIsYou ? youColor : oppColor} awayColor={homeIsYou ? oppColor : youColor}
          youIsHome={homeIsYou} goals={goals} roundKey={state.round} roundMs={ROUND_MS} classico={oppIsHuman} />
      })() : (
        <Box bg="#fff" className="p-6" shadow={6}>
          <p className="text-center font-black" style={OSWALD}>🏁 Aguardando o pontapé inicial…</p>
        </Box>
      )}

      {lastWasClassico && lastRiv && resultRevealed && (
        <Box bg={myGoals > oppGoals ? GREEN : myGoals < oppGoals ? RED : '#fff'} className="p-3 text-center" shadow={4}>
          <p className="font-black text-sm" style={{ ...OSWALD, color: myGoals === oppGoals ? INK : '#fff' }}>
            ⚔️ CLÁSSICO {myGoals > oppGoals ? 'VENCIDO' : myGoals < oppGoals ? 'PERDIDO' : 'EMPATADO'} contra {lastOppName}
          </p>
          <p className="font-black text-xs mt-0.5" style={{ color: myGoals === oppGoals ? 'rgba(0,0,0,.65)' : 'rgba(255,255,255,.9)' }}>
            Rivalidade: você {lastRiv.w} × {lastRiv.l} {lastOppName}{lastRiv.d ? ` · ${lastRiv.d} empate${lastRiv.d > 1 ? 's' : ''}` : ''}
          </p>
        </Box>
      )}

      {fixture && opp && (
        <Box bg={isClassico ? GOLD : '#fff'} className="p-4 space-y-3">
          {isClassico && (
            <div>
              <p className="font-black text-xs uppercase tracking-wide" style={OSWALD}>{oppCareerRiv ? `🔥 CLÁSSICO — contra ${opp.name}, seu rival de sempre!` : '🥊 CLÁSSICO — é contra a galera!'}</p>
              {rivalry && (
                <p className="font-black text-[11px] mt-0.5" style={OSWALD}>
                  {rivalry.w + rivalry.l + rivalry.d === 0
                    ? '⚔️ Primeiro duelo de vocês — começa a rivalidade!'
                    : `⚔️ Retrospecto: você ${rivalry.w} × ${rivalry.l} ${opp.name}${rivalry.d ? ` · ${rivalry.d} empate${rivalry.d > 1 ? 's' : ''}` : ''}`}
                </p>
              )}
            </div>
          )}
          <p className="font-black text-lg" style={OSWALD}>
            PRÓXIMO: {fixture[0] === you.id ? `${you.teamName} × ${opp.name}` : `${opp.name} × ${you.teamName}`}
            <span className="text-xs text-black/70"> {fixture[0] === you.id ? '(em casa)' : '(fora)'}</span>
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(TACTIC_LABEL) as Tactic[]).map(t => (
              <button key={t} onClick={() => dispatch({ type: 'SET_TACTIC', mgrId: you.id, tactic: t })}
                className="border-[3px] border-black rounded-xl py-2 text-xs font-black"
                style={{ backgroundColor: myTactic === t ? GOLD : '#fff', boxShadow: myTactic === t ? `3px 3px 0 0 ${INK}` : 'none' }}>
                {TACTIC_LABEL[t]}
              </button>
            ))}
          </div>
          <div className="space-y-1">
            <div className="h-2 rounded-full border-2 border-black overflow-hidden bg-white">
              <div className="h-full transition-all" style={{ width: `${(state.round / 38) * 100}%`, backgroundColor: GREEN }} />
            </div>
            <p className="text-center text-xs font-bold text-black/60">⏱️ Temporada rolando sozinha — sente e assista.</p>
          </div>
          <p className="text-[11px] font-semibold text-black/70">Retranca segura ataque · ataque atropela equilíbrio · equilíbrio fura retranca.</p>
        </Box>
      )}

      {personalNews && (
        <Box bg="#6C43C0" className="p-2.5 text-center" shadow={4}>
          <p className="font-black text-sm" style={{ ...OSWALD, color: '#fff' }}>{personalNews}</p>
        </Box>
      )}

      {state.news.length > 0 && (
        <Box bg="#FFF6DC" className="p-3 space-y-1">
          <p className="font-black text-xs uppercase tracking-wide mb-1" style={OSWALD}>📣 Giro da rodada</p>
          {state.news.slice(0, 4).map((n, i) => <p key={i} className="text-xs font-bold">{n}</p>)}
        </Box>
      )}

      {state.careerOnline && (
        <button onClick={() => setShowPyramid(true)}
          className="w-full border-[3px] border-black rounded-xl py-3 font-black text-sm uppercase"
          style={{ backgroundColor: '#7C3AED', color: '#fff', boxShadow: `4px 4px 0 ${INK}`, ...OSWALD }}>
          🪜 Ver as 4 divisões
        </button>
      )}
      <TableBox highlight={you.id} holdResults={!resultRevealed} />
      <TopScorersBox highlight={you.id} />
      <YourPitch small />
      {state.careerDivision && <RivalTracker />}
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

function TopScorersBox({ highlight }: { highlight: number }) {
  const { state } = useEsc()
  const rows = topScorers(state, 10)
  if (rows.length === 0) {
    return (
      <Box className="p-3">
        <p className="font-black text-sm mb-1 text-black" style={OSWALD}>⚽ ARTILHARIA</p>
        <p className="text-xs text-black/60 font-semibold">Sem gols ainda. Bola rolando…</p>
      </Box>
    )
  }
  return (
    <Box className="p-3">
      <p className="font-black text-sm mb-2 text-black" style={OSWALD}>⚽ ARTILHARIA · TEMPO REAL</p>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-black/60 font-black">
            <th className="pr-1">#</th><th>Jogador</th><th>Time</th><th className="text-center">Gols</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.teamId}-${r.name}`} className="border-t border-black/10 font-semibold text-black"
              style={{ backgroundColor: r.teamId === highlight ? GOLD : undefined }}>
              <td className="pr-1">{i + 1}</td>
              <td className="truncate max-w-[130px]">{r.name}</td>
              <td className="truncate max-w-[110px] text-black/70">{r.teamName}</td>
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

// zona da tabela por posição (sempre 20 times): 1-4 azul (G4 — na carreira
// SOBE de divisão), 5-10 amarelo (pré), 11-16 branco (meio), 17-20 vermelho
// (Z4 — na carreira CAI) — tom pastel, só pra dar significado visual.
function zoneColor(rank: number): string | undefined {
  if (rank <= 4) return '#D6E9FA'
  if (rank <= 10) return '#FFF3B8'
  if (rank <= 16) return undefined
  return '#F9D8D3'
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

function TableBox({ highlight, holdResults }: { highlight: number; holdResults?: boolean }) {
  const { state } = useEsc()
  const league = holdResults && state.lastResults.length > 0 ? leagueBeforeResults(state.league, state.lastResults) : state.league
  const table = sortedTable(league)
  return (
    <Box className="p-3 overflow-x-auto">
      <div className="flex items-center justify-between mb-2">
        <p className="font-black text-sm" style={OSWALD}>TABELA</p>
        <div className="flex items-center gap-2 text-[9px] font-bold text-black/60">
          <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: '#D6E9FA' }} />G4</span>
          <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: '#FFF3B8' }} />Pré</span>
          <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm inline-block border border-black/20" style={{ backgroundColor: '#fff' }} />Meio</span>
          <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: '#F9D8D3' }} />Z4</span>
        </div>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-black/70 font-black">
            <th className="pr-1">#</th><th>Time</th><th className="text-center">P</th><th className="text-center">V</th><th className="text-center">E</th><th className="text-center">D</th><th className="text-center">SG</th>
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
            return (
              <tr key={t.id} className="border-t border-black/10 font-semibold"
                style={{ backgroundColor: isYou ? GOLD : isRival ? '#FFE0D6' : zoneColor(rank), fontWeight: isMgr ? 800 : 500 }}>
                <td className="pr-1">{rank}</td>
                <td className="truncate max-w-[130px]">{isRival ? '🔥 ' : isMgr ? '👤 ' : ''}{t.name}</td>
                <td className="text-center font-black">{t.pts}</td>
                <td className="text-center">{t.w}</td><td className="text-center">{t.d}</td><td className="text-center">{t.l}</td>
                <td className="text-center">{t.gf - t.ga}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </Box>
  )
}

// ─── card de resultado pra compartilhar ────────────────────────────────
type ShareCard = { name: string; club: string; year: number; pos: string; fame: number; folk?: boolean; promessa?: boolean }
async function buildShareCardBlob(opts: {
  teamName: string; youPos: number; youWon: boolean; champName: string
  pts: number; w: number; d: number; l: number; scorerName?: string; scorerGoals?: number
  card?: ShareCard // carta-lembrança do campeão (só quando você venceu e escolheu)
}): Promise<Blob | null> {
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
  ctx.fillText(opts.youWon ? '🏆' : opts.youPos <= 4 ? '🥈' : opts.youPos >= 17 ? '🪦' : '⚽', 450, hasCard ? 296 : 400)

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

async function shareResult(opts: Parameters<typeof buildShareCardBlob>[0]) {
  const blob = await buildShareCardBlob(opts)
  if (!blob) return
  const file = new File([blob], 'leilao-legends-38.png', { type: 'image/png' })
  const shareData = { files: [file], title: 'Leilão Legends', text: `${opts.youWon ? 'Fui campeão' : `Terminei em ${opts.youPos}º`} no Leilão Legends! 🔨` }
  if (navigator.canShare?.(shareData)) {
    try { await navigator.share(shareData); return } catch { /* cancelou ou falhou — cai pro download */ }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'leilao-legends-38.png'
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
  const [savedIG, setSavedIG] = useState(false)
  const [open, setOpen] = useState(false) // recolhido por padrão — não roubar a atenção da votação
  const text = shareTextFor(opts)
  const wa = () => window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + GAME_URL)}`, '_blank', 'noopener')
  const tw = () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(GAME_URL)}`, '_blank', 'noopener')
  const ig = async () => { await downloadShareImage(opts); setSavedIG(true) }
  return (
    <Box bg="#fff" className="p-3 space-y-2">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between active:opacity-70">
        <span className="font-black text-sm" style={OSWALD}>📤 Compartilhar {opts.youWon ? 'a conquista' : 'o resultado'}{opts.card ? ' + carta' : ''}</span>
        <span className="text-black/40 text-[11px] font-black" style={OSWALD}>{open ? 'fechar ▲' : 'abrir ▼'}</span>
      </button>
      {open && (
        <>
          <Btn onClick={() => shareResult(opts)} bg={GOLD} className="w-full">📤 Compartilhar imagem</Btn>
          <div className="grid grid-cols-3 gap-2">
            <Btn onClick={wa} bg="#25D366" className="w-full"><span className="text-white">📱 WhatsApp</span></Btn>
            <Btn onClick={tw} bg="#111" className="w-full"><span className="text-white">𝕏 Twitter</span></Btn>
            <Btn onClick={ig} bg="#E1306C" className="w-full"><span className="text-white">📸 Instagram</span></Btn>
          </div>
          {savedIG && <p className="text-[11px] font-bold text-black/60 text-center">📸 Imagem salva! Abra o Instagram e poste no seu story.</p>}
        </>
      )}
    </Box>
  )
}

// ─── Hall da Fama da sala (só online): histórico entre revanches ──────
interface ChampionRow { season_no: number; champion_name: string; top_scorer_name: string | null; top_scorer_goals: number | null }
function HallDaFama({ roomId, isHost, seasonNo, champName, scorerName, scorerGoals }: {
  roomId: string; isHost: boolean; seasonNo: number; champName: string; scorerName?: string; scorerGoals?: number
}) {
  const [rows, setRows] = useState<ChampionRow[] | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      // 1) HOST grava (ou corrige) o campeão DESTA temporada ANTES de ler —
      // antes a leitura corria em paralelo com a escrita e a temporada atual
      // não aparecia, mostrando só a anterior (parecia campeão errado).
      if (isHost) {
        const { data: existing } = await supabase.from('game_champions').select('id').eq('room_id', roomId).eq('season_no', seasonNo).maybeSingle()
        const payload = { champion_name: champName, top_scorer_name: scorerName ?? null, top_scorer_goals: scorerGoals ?? null }
        if (existing) await supabase.from('game_champions').update(payload).eq('id', existing.id)
        else await supabase.from('game_champions').insert({ room_id: roomId, season_no: seasonNo, ...payload })
      }
      // 2) lê o histórico completo
      const { data } = await supabase.from('game_champions').select('season_no, champion_name, top_scorer_name, top_scorer_goals').eq('room_id', roomId).order('season_no', { ascending: true })
      if (!alive) return
      const list = (data ?? []) as ChampionRow[]
      // 3) garante que a temporada ATUAL esteja na lista mesmo que a escrita do
      // host ainda não tenha propagado (guest lê antes) — usa o campeão local,
      // que é o mesmo mostrado no topo da tela final.
      if (!list.some(r => r.season_no === seasonNo)) {
        list.push({ season_no: seasonNo, champion_name: champName, top_scorer_name: scorerName ?? null, top_scorer_goals: scorerGoals ?? null })
        list.sort((a, b) => a.season_no - b.season_no)
      }
      setRows(list)
    })()
    return () => { alive = false }
  }, [isHost, roomId, seasonNo, champName, scorerName, scorerGoals])

  if (!rows || rows.length === 0) return null
  return (
    <Box className="p-3">
      <p className="font-black text-sm mb-2" style={OSWALD}>🏆 HALL DA FAMA DA SALA</p>
      <div className="space-y-1.5">
        {rows.map(r => (
          <div key={r.season_no} className="flex items-center justify-between border-t border-black/10 pt-1.5 first:border-t-0 first:pt-0">
            <p className="text-sm font-bold text-black">Temporada {r.season_no}: <b>{r.champion_name}</b></p>
            {r.top_scorer_name && <p className="text-[11px] font-semibold text-black/60">⚽ {r.top_scorer_name} ({r.top_scorer_goals})</p>}
          </div>
        ))}
      </div>
    </Box>
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
  const isProm = promessa ?? PROMESSA_SET.has(name)
  const t = isProm ? PROMESSA_TIER : (FAME_TIER[fame] ?? FAME_TIER[1])
  const initial = name.trim()[0]?.toUpperCase() ?? '?'
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
        <span className="font-black rounded-lg" style={{ ...OSWALD, background: INK, color: '#fff', border: '2px solid rgba(255,255,255,.25)', fontSize: big ? 13 : 11, padding: '2px 7px' }}>{pos}</span>
        <div className="flex flex-col items-end gap-1">
          <span className="font-black tracking-wide text-right" style={{ ...OSWALD, color: t.tierColor, fontSize: big ? 11 : 9 }}>{t.label}</span>
          {folk && (
            <span className="font-black rounded-full" style={{ ...OSWALD, background: 'rgba(0,0,0,.28)', color: '#fff', fontSize: big ? 10 : 8, padding: big ? '2px 8px' : '1px 6px', letterSpacing: .5 }}>🃏 FOLCLÓRICO</span>
          )}
        </div>
      </div>
      <div className="relative self-center rounded-full flex items-center justify-center"
        style={{ width: big ? 100 : 66, height: big ? 100 : 66, background: t.crestBg, color: t.crestInk, border: '3px solid rgba(0,0,0,.28)', ...OSWALD, fontWeight: 900, fontSize: big ? 42 : 27, boxShadow: t.holo ? 'inset 0 0 14px rgba(255,255,255,.7)' : 'none' }}>
        {initial}
      </div>
      <div className="relative">
        <p className="font-black leading-none truncate" style={{ ...OSWALD, color: t.ink, fontSize: big ? 26 : 17 }}>{name}</p>
        <p className="font-extrabold" style={{ color: t.ink, opacity: .62, fontSize: big ? 12 : 10 }}>{club} · {year}</p>
        <p style={{ fontSize: big ? 13 : 11, letterSpacing: 1, marginTop: 3 }}>{isProm ? '💎💎💎' : '⭐'.repeat(fame)}</p>
        {(big || showBio) && text && (
          <p className="font-semibold italic" style={{ color: t.ink, opacity: .78, fontSize: big ? 12 : 9.5, lineHeight: 1.28, marginTop: big ? 8 : 5, display: '-webkit-box', WebkitLineClamp: big ? 5 : 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>“{text}”</p>
        )}
      </div>
    </div>
  )
}

// ─── prêmio de campeão: escolhe 1 carta do seu time pro álbum ─────────
const CARD_PICK_SECONDS = 45
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

export function CardCollectPrompt({ seasonKey, origin = 'online', onClaimed }: { you: Manager; seasonKey: string; origin?: 'cpu' | 'online'; onClaimed?: (card: WonCard) => void }) {
  // 'noauth' = campeão sem conta: cartas são só pra quem tem cadastro
  const [status, setStatus] = useState<'checking' | 'noauth' | 'picking' | 'revealed'>('checking')
  const [claimed, setClaimed] = useState<WonCard | null>(null)
  const [owned, setOwned] = useState<Set<string>>(new Set()) // cartas que o usuário JÁ tem no álbum (por nome)
  const [deadline, setDeadline] = useState(() => Date.now() + CARD_PICK_SECONDS * 1000)
  const [now, setNow] = useState(() => Date.now())
  const [authOpen, setAuthOpen] = useState(false) // cadastro rápido INLINE, sem sair da tela de campeão
  const [reload, setReload] = useState(0)          // re-checa o login após criar conta → cai no pega-carta real
  const claimingRef = useRef(false)

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setStatus('noauth'); return } // sem cadastro não ganha carta
      // o que o usuário já tem no álbum — pra não oferecer repetida
      const { data: ownedRows } = await supabase.from('user_cards').select('card_name').eq('user_id', user.id)
      setOwned(new Set((ownedRows ?? []).map((r: { card_name: string }) => r.card_name)))
      const { data } = await supabase.from('user_cards').select('*').eq('user_id', user.id).eq('season_key', seasonKey).maybeSingle()
      if (data) {
        const cc = { id: 'x', name: data.card_name, club: data.card_club, year: data.card_year, pos: data.card_pos, fame: data.card_fame, ...(CARD_META.get(data.card_name) ?? {}), lo: 0, hi: 0, paid: 0, via: 'leilao' } as WonCard
        setClaimed(cc); onClaimed?.(cc)
        setStatus('revealed')
      } else {
        setStatus('picking')
      }
    })()
  }, [seasonKey, reload])

  useEffect(() => {
    if (status !== 'picking') return
    const iv = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(iv)
  }, [status])
  const remaining = Math.max(0, Math.ceil((deadline - now) / 1000))

  // 🎁 PACOTE SURPRESA: a carta agora é SORTEADA entre TODAS as cartas do jogo
  // (baralho BR + Europa), sempre uma que o campeão ainda NÃO tem (só repetiria
  // se já tivesse o catálogo inteiro). Trocamos o "escolher" pela emoção de abrir.
  const packPool = useMemo(() => {
    const un = ALL_POOL.filter(c => !owned.has(c.name))
    return un.length ? un : ALL_POOL
  }, [owned])
  const [opening, setOpening] = useState(false)
  // ABERTURA COM SUSPENSE, em tela cheia: o pacote toma a tela e treme cada vez
  // mais forte (2,4s de tensão), CLARÃO, e a carta entra GRANDE girando.
  const [fx, setFx] = useState<'off' | 'shake' | 'flash' | 'show'>('off')
  const openPack = () => {
    if (opening || claimingRef.current) return
    const pick = packPool[Math.floor(Math.random() * packPool.length)]
    if (!pick) return
    setOpening(true)
    setFx('shake')
    setTimeout(() => setFx('flash'), 2400)
    setTimeout(() => { claim(pick); setFx('show') }, 2750)
  }

  async function claim(card: WonCard) {
    if (claimingRef.current) return
    claimingRef.current = true
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setStatus('noauth'); return }
    // season_key ENCURTADO (a coluna tem limite): se ainda vier longo, corta.
    const key = seasonKey.length > 48 ? seasonKey.slice(0, 48) : seasonKey
    // gravação RESILIENTE: se o backend estiver fora, guarda no aparelho e
    // re-tenta ao reabrir o jogo — ninguém perde a carta numa instabilidade.
    await resilientWrite({ table: 'user_cards', row: {
      user_id: user.id, season_key: key, origin,
      card_name: card.name, card_club: card.club, card_year: card.year, card_pos: card.pos, card_fame: card.fame,
    } })
    setClaimed(card); onClaimed?.(card)
    setStatus('revealed')
  }

  useEffect(() => {
    if (status !== 'picking' || remaining > 0) return
    openPack() // tempo esgotou: o pacote abre sozinho (ninguém fica sem carta)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, status])

  // ── overlay de REVELAÇÃO em tela cheia: tensão → clarão → carta gigante ──
  const revealOverlay = fx !== 'off' ? createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 99998, background: 'rgba(8,5,10,0.94)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18, overflow: 'hidden' }}>
      <style>{'@keyframes escPackSheen{0%{background-position:0% 0%}100%{background-position:100% 100%}}'}</style>
      {fx === 'shake' && (
        <div className="text-center">
          <motion.div className="relative mx-auto" style={{ width: 225, height: 308 }}
            animate={{
              rotate: [0, -2, 2, -3, 3, -5, 5, -7, 7, -10, 10, -13, 13, -8, 0],
              x: [0, -2, 2, -3, 3, -5, 5, -7, 7, -9, 9, -11, 11, -5, 0],
              scale: [1, 1, 1.02, 1.03, 1.05, 1.07, 1.1, 1.13],
            }}
            transition={{ duration: 2.35, ease: 'easeIn' }}>
            <div style={{ position: 'absolute', inset: 0, border: `5px solid ${INK}`, borderRadius: 20, overflow: 'hidden',
              background: 'linear-gradient(150deg, #125e2f 0%, #2ea457 35%, #FFC400 50%, #2ea457 65%, #125e2f 100%)',
              backgroundSize: '220% 220%', animation: 'escPackSheen 1.1s linear infinite',
              boxShadow: '0 0 60px rgba(255,196,0,.45), inset 0 0 30px rgba(255,255,255,.2)' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 7, color: '#fff' }}>
              <span style={{ fontSize: 60, filter: 'drop-shadow(2px 3px 0 rgba(0,0,0,.4))' }}>🔨</span>
              <span style={{ ...OSWALD, fontWeight: 900, fontSize: 21, lineHeight: 1, textShadow: '2px 2px 0 rgba(0,0,0,.45)', textAlign: 'center' }}>LEILÃO<br />LEGENDS</span>
              <span style={{ ...OSWALD, fontWeight: 800, fontSize: 11, letterSpacing: 3, color: GOLD, textShadow: '1px 1px 0 rgba(0,0,0,.5)' }}>PACOTE DO CAMPEÃO</span>
            </div>
          </motion.div>
          <motion.p className="font-black text-white mt-5 text-lg" style={OSWALD}
            initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.4, 1] }} transition={{ duration: 2.2 }}>
            🥁 segura o coração…
          </motion.p>
        </div>
      )}
      {fx === 'flash' && (
        <motion.div style={{ position: 'absolute', inset: 0, background: '#fff' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.28 }} />
      )}
      {fx === 'show' && claimed && (
        <div className="text-center w-full" style={{ maxWidth: 340 }}>
          <motion.div initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.5 }}
            style={{ position: 'absolute', inset: 0, background: '#fff', pointerEvents: 'none' }} />
          <motion.div initial={{ rotateY: 100, scale: 0.55, opacity: 0 }} animate={{ rotateY: 0, scale: 1, opacity: 1 }}
            transition={{ duration: 0.9, type: 'spring', bounce: 0.38 }} className="mx-auto" style={{ maxWidth: 320 }}>
            <CollectibleCard name={claimed.name} club={claimed.club} year={claimed.year} pos={claimed.pos} fame={claimed.fame} bio={claimed.bio} folk={claimed.folk} promessa={claimed.promessa} big />
          </motion.div>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
            className="font-black text-white text-xl mt-4" style={OSWALD}>🎉 FOI PRO SEU ÁLBUM!</motion.p>
          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
            onClick={() => setFx('off')}
            className="mt-4 rounded-xl border-[3px] border-black font-black text-base py-3 px-6 active:translate-y-0.5"
            style={{ background: GOLD, boxShadow: `4px 4px 0 0 ${INK}`, ...OSWALD }}>
            📖 GUARDAR NO ÁLBUM
          </motion.button>
        </div>
      )}
    </div>,
    document.body
  ) : null

  if (status === 'checking') return null

  if (status === 'noauth') {
    return (
      <Box bg={GOLD} className="p-5 text-center" shadow={6}>
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
          // logou sem sair da tela: reseta o cronômetro e re-checa → cai no pega-carta REAL do time campeão
          setAuthOpen(false); setDeadline(Date.now() + CARD_PICK_SECONDS * 1000); setStatus('checking'); setReload(r => r + 1)
        }} />}
      </Box>
    )
  }

  if (status === 'revealed' && claimed) {
    return (
      <Box bg={CREAM} className="p-5 text-center" shadow={6}>
        {revealOverlay}
        <p className="text-xs font-black uppercase text-black/60 mb-3">🎁 Saiu do pacote — foi pro seu álbum!</p>
        <motion.div initial={{ rotateY: 90, opacity: 0, scale: 0.9 }} animate={{ rotateY: 0, opacity: 1, scale: 1 }} transition={{ duration: 0.7, type: 'spring', bounce: 0.35 }}
          className="mx-auto" style={{ maxWidth: 220 }}>
          <CollectibleCard name={claimed.name} club={claimed.club} year={claimed.year} pos={claimed.pos} fame={claimed.fame} bio={claimed.bio} folk={claimed.folk} promessa={claimed.promessa} big />
        </motion.div>
        <p className="text-[11px] font-bold text-black/50 mt-3">📖 Veja o álbum completo no menu inicial.</p>
      </Box>
    )
  }

  // 🎁 o PACOTE LACRADO: flutua brilhando; ao tocar balança, o lacre estoura,
  // um clarão toma a tela e a carta é revelada (o componente real do álbum).
  return (
    <Box bg={GOLD} className="p-4 text-center" shadow={6}>
      <style>{'@keyframes escPackSheen{0%{background-position:0% 0%}100%{background-position:100% 100%}}'}</style>
      <div className="flex items-center justify-between mb-1">
        <p className="font-black text-lg" style={OSWALD}>🎁 Pacote do campeão!</p>
        <span className="border-2 border-black rounded-lg px-2 py-1 text-xs font-black bg-white">{remaining}s</span>
      </div>
      <p className="text-xs font-bold text-black/70 mb-3">Campeão leva uma carta <b>surpresa</b> pro álbum — sorteada entre <b>todas as cartas do jogo</b> (sempre uma que você ainda não tem). Toque no pacote pra abrir; se o tempo acabar, ele abre sozinho.</p>
      <motion.button onClick={openPack} disabled={opening}
        className="relative mx-auto block" style={{ width: 168, height: 230, background: 'transparent', border: 'none', padding: 0, cursor: opening ? 'default' : 'pointer' }}
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
        <motion.span animate={opening ? { y: -34, rotate: 22, opacity: 0 } : {}} transition={{ duration: 0.35, delay: 0.3 }}
          style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: GOLD, border: `3px solid ${INK}`, borderRadius: 999, padding: '3px 13px', fontSize: 10.5, fontWeight: 900, letterSpacing: 1, ...OSWALD }}>LACRADO</motion.span>
      </motion.button>
      {!opening && <p className="text-[11px] font-black text-black/60 mt-3" style={OSWALD}>👆 TOCA PRA ABRIR</p>}
      {revealOverlay}
    </Box>
  )
}

// ─── álbum: coleção de cartas ganhas sendo campeão, entre partidas ────
interface UserCardRow { card_name: string; card_club: string; card_year: number; card_pos: string; card_fame: number; origin: string | null; obtained_at: string }
interface AlbumCard { name: string; club: string; year: number; pos: Sector; fame: number; folk?: boolean; promessa?: boolean; origin: 'cpu' | 'online'; at: number }
type AlbumFilter = 'all' | 'cpu' | 'online'

// carta de EXEMPLO — aparece só pra quem NÃO tem conta, pra mostrar como é a
// carta-lembrança e provocar o cadastro. Some assim que a pessoa loga (aí entram
// só as reais). É de mentirinha, não conta em lugar nenhum.
const EXAMPLE_CARD = { name: 'Rayan', club: 'Exemplo FC', year: 2025, pos: 'ATA', fame: 3, bio: 'Oi, boa noite! 👋 Sou só um exemplo pra você ver como é a carta. Faça seu cadastro, seja campeão e colecione craques de verdade — no CPU e no online.' }

export function EscAlbum() {
  const { dispatch } = useEsc()
  const [cards, setCards] = useState<AlbumCard[] | null>(null)
  const [anon, setAnon] = useState(false)
  const [down, setDown] = useState(false) // backend fora do ar — evita travar em "Carregando…"
  const [filter, setFilter] = useState<AlbumFilter>('all')

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
    return byFilter.filter(c => { const k = cardKey(c); return seen.has(k) ? false : (seen.add(k), true) })
  }, [cards, filter])

  // conta FIGURINHAS ÚNICAS (por AUGE) — igual ao que aparece na tela.
  const uniqBy = (list: AlbumCard[]) => new Set(list.map(cardKey)).size
  const all = cards ?? []
  const nAll = uniqBy(all)
  const nCpu = uniqBy(all.filter(c => c.origin === 'cpu'))
  const nOnline = uniqBy(all.filter(c => c.origin === 'online'))
  const TABS: { id: AlbumFilter; label: string }[] = [
    { id: 'all', label: `Todos (${nAll})` },
    { id: 'cpu', label: `🤖 CPU (${nCpu})` },
    { id: 'online', label: `👥 Online (${nOnline})` },
  ]

  return (
    <Shell>
      <div className="text-center pt-4">
        <h2 className="font-black text-4xl" style={OSWALD}>📖 MEU ÁLBUM</h2>
        <p className="font-semibold text-black/60 mt-1">Campeão ganha uma carta-lembrança por título — no CPU ou no online. Vai colecionando os craques.</p>
        {!loading && <p className="font-black text-lg mt-2" style={OSWALD}>{shown.length}/{CATALOG_TOTAL} craques{filter !== 'all' ? ` (${filter === 'cpu' ? '🤖 CPU' : '👥 Online'})` : ''}</p>}
      </div>

      <div className="flex border-[3px] border-black rounded-xl overflow-hidden">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setFilter(t.id)}
            className="flex-1 py-2.5 font-black text-xs uppercase" style={{ backgroundColor: filter === t.id ? GOLD : '#fff', color: '#000', ...OSWALD }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-center font-bold text-black/60">Carregando…</p>}
      {down && (
        <div className="rounded-xl border-2 border-amber-400/70 bg-amber-400/10 px-4 py-3 text-center">
          <p className="font-black text-sm" style={OSWALD}>🔧 Servidor fora do ar por uns minutos</p>
          <p className="font-bold text-black/60 text-xs mt-1">Seu álbum está a salvo — é só instabilidade. Volta daqui a pouquinho 💛</p>
        </div>
      )}

      {/* SEM CONTA: mostra 1 carta de exemplo pra provocar o cadastro (some ao logar) */}
      {!loading && anon && (
        <div className="space-y-3">
          <Box bg={GOLD} className="p-3 text-center">
            <p className="font-black text-sm" style={OSWALD}>👀 Exemplo de carta-lembrança</p>
            <p className="font-bold text-black/70 text-xs mt-1">Faça seu cadastro pra começar a SUA coleção de verdade. Esta carta some quando você logar.</p>
          </Box>
          <div className="grid grid-cols-2 gap-3">
            <CollectibleCard name={EXAMPLE_CARD.name} club={EXAMPLE_CARD.club} year={EXAMPLE_CARD.year} pos={EXAMPLE_CARD.pos} fame={EXAMPLE_CARD.fame} bio={EXAMPLE_CARD.bio} showBio />
          </div>
        </div>
      )}

      {!loading && !anon && shown.length === 0 && (
        <Box bg="#fff" className="p-6 text-center">
          <p className="font-bold text-black/70">
            {filter === 'online' ? 'Ainda sem cartas do online. Seja campeão de uma sala pra ganhar a primeira!'
              : filter === 'cpu' ? 'Ainda sem cartas do CPU. Seja campeão jogando contra a CPU pra ganhar a primeira!'
              : 'Ainda sem cartas. Seja campeão (no CPU ou online) pra ganhar a primeira!'}
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
      <Btn onClick={() => dispatch({ type: 'GO_LOBBY' })} className="w-full text-lg">← Voltar</Btn>
    </Shell>
  )
}

// ─── RANKING DE TÉCNICOS (só contas) ─────────────────────────────────
type RankMode = 'geral' | 'online' | 'cpu'
interface RankRow { user_id: string; name: string; titles: number; scorer_titles: number; goals: number; cards: number }

// ACERTO AUTOMÁTICO cartas↔ranking. Regra do Diego: cada usuário tem que ter a
// MESMA quantidade de cartas (álbum) e de títulos (ranking). A carta é a verdade
// e nunca se mexe nela; o título é o lado flexível — pode faltar ou sobrar.
//
// Por que desencontra:
//  • FALTA título: modos antigos (ex.: carreira online antiga) davam a carta mas
//    não gravavam o título no ranking.
//  • SOBRA título: o álbum conta AUGES ÚNICOS (nome|clube|ano) — foi campeão 2x
//    e ganhou a carta repetida de um craque que já tinha, o álbum não duplica,
//    mas os 2 títulos contam. Aí sobra título.
//
// IMPORTANTE: isto é uma LIMPEZA ÚNICA (one-shot), não um igualador permanente.
// Daqui pra frente o jogo já nasce certo — carta repetida é bloqueada na hora de
// escolher e todo campeão gera carta + título — então título e carta batem
// sozinhos. Por isso este acerto roda UMA VEZ por técnico (guardado num flag) só
// pra regularizar o acumulado antigo (contas que desencontraram por modos legados
// ou cartas repetidas de antes) e PARA. Nunca mais fica somando/tirando título.
//
// Ao rodar (uma vez), o navegador do próprio técnico (logado) iguala as contagens
// POR MODO: cartas online ↔ títulos online, cartas CPU ↔ títulos CPU. Falta →
// cria título; sobra → rebaixa (champion=false, sem apagar a linha nem a
// artilharia). Roda como o usuário (passa no RLS), sem eu tocar no banco.
async function reconcileCardsToTitles() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const flag = `esc-cards-titles-fix-v1:${user.id}`
    if (localStorage.getItem(flag)) return // já regularizou este técnico — não repete
    const [{ data: cards }, { data: results }] = await Promise.all([
      supabase.from('user_cards').select('card_name, card_club, card_year, origin').eq('user_id', user.id),
      supabase.from('esc_results').select('season_key, mode, champion, top_scorer, display_name').eq('user_id', user.id),
    ])
    if (!cards) return
    const rows = (results ?? []) as { season_key: string; mode: string; champion: boolean; top_scorer: boolean; display_name: string | null }[]
    const displayName = rows.find(r => r.display_name)?.display_name
      ?? user.user_metadata?.display_name ?? user.email?.split('@')[0] ?? 'Técnico'
    // cartas ÚNICAS por auge, por modo — exatamente como o álbum conta.
    const cardKey = (c: { card_name: string; card_club: string; card_year: number }) => `${c.card_name}|${c.card_club}|${c.card_year}`
    const want: Record<'cpu' | 'online', Set<string>> = { cpu: new Set(), online: new Set() }
    for (const c of cards as { card_name: string; card_club: string; card_year: number; origin: string }[]) {
      want[c.origin === 'online' ? 'online' : 'cpu'].add(cardKey(c))
    }
    for (const mode of ['cpu', 'online'] as const) {
      const target = want[mode].size
      const champ = rows.filter(r => r.mode === mode && r.champion)
      if (champ.length === target) continue
      if (champ.length < target) {
        // FALTA: cria títulos sintéticos estáveis (fix:) até bater com as cartas.
        const add: Record<string, unknown>[] = []
        for (let i = champ.length; i < target; i++) {
          add.push({ user_id: user.id, display_name: displayName, mode, season_key: `fix:${mode}:${i}`, champion: true, top_scorer: false, goals: 0 })
        }
        await supabase.from('esc_results').upsert(add, { onConflict: 'user_id,season_key' })
      } else {
        // SOBRA: rebaixa champion=false. Ordem de preferência pra rebaixar: 1º os
        // sintéticos (fix:), 2º os que são SÓ título, e por último os que também
        // são artilharia (pra preservar o máximo de conquista real).
        const prio = (r: { season_key: string; top_scorer: boolean }) => r.season_key?.startsWith('fix:') ? 0 : r.top_scorer ? 2 : 1
        const demote = [...champ].sort((a, b) => prio(a) - prio(b)).slice(0, champ.length - target).map(r => r.season_key)
        await supabase.from('esc_results').update({ champion: false }).eq('user_id', user.id).in('season_key', demote)
      }
    }
    localStorage.setItem(flag, '1') // regularizado — não roda de novo pra este técnico
  } catch { /* nunca trava a tela */ }
}

export function EscRanking() {
  const { dispatch } = useEsc()
  const [mode, setMode] = useState<RankMode>('geral')
  const [rows, setRows] = useState<RankRow[] | null>(null)
  const [down, setDown] = useState(false) // backend fora do ar — evita travar em "Carregando…"
  const [meId, setMeId] = useState<string | null>(null)
  const [viewUser, setViewUser] = useState<{ id: string; name: string } | null>(null)
  const [viewCards, setViewCards] = useState<AlbumCard[] | null>(null)

  // abre o álbum de QUALQUER técnico (user_cards tem leitura pública)
  async function openAlbum(userId: string, name: string) {
    setViewUser({ id: userId, name }); setViewCards(null)
    try {
      const { data } = await supabase.from('user_cards')
        .select('card_name, card_club, card_year, card_pos, card_fame, origin, obtained_at')
        .eq('user_id', userId).order('obtained_at', { ascending: false })
      const cards = ((data ?? []) as UserCardRow[]).map(c => ({
        name: c.card_name, club: c.card_club, year: c.card_year, pos: c.card_pos as Sector, fame: c.card_fame,
        ...(CARD_META.get(c.card_name) ?? {}),
        origin: (c.origin === 'cpu' ? 'cpu' : 'online') as 'cpu' | 'online',
        at: new Date(c.obtained_at).getTime(),
      }))
      const seen = new Set<string>()
      setViewCards(cards.filter(c => (seen.has(c.name) ? false : (seen.add(c.name), true))))
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
        await reconcileCardsToTitles() // acerta cartas↔títulos antes de somar
        const { data } = await supabase.rpc('esc_ranking', { p_mode: mode })
        if (alive) setRows(((data ?? []) as RankRow[]))
      } catch {
        // backend fora: não deixa preso em "Carregando…"
        if (alive) { setDown(true); setRows([]) }
      }
    })()
    return () => { alive = false }
  }, [mode])

  const loading = rows === null
  // Lista única: 1º critério títulos, 2º artilharias (desempate por gols).
  // Entra quem tem ao menos 1 título OU 1 artilharia.
  const shown = useMemo(() => (rows ?? [])
    .filter(r => r.titles > 0 || r.scorer_titles > 0)
    .sort((a, b) => b.titles - a.titles || b.scorer_titles - a.scorer_titles || b.goals - a.goals),
    [rows])
  const inList = !!meId && shown.some(r => r.user_id === meId)

  const MODES: { id: RankMode; label: string }[] = [
    { id: 'geral', label: 'Geral' },
    { id: 'online', label: '👥 Online' },
    { id: 'cpu', label: '🤖 CPU' },
  ]
  const medal = (i: number) => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`

  return (
    <Shell>
      <div className="text-center pt-4">
        <h2 className="font-black text-4xl" style={OSWALD}>🏆 RANKING</h2>
        <p className="font-semibold text-black/60 mt-1">Só técnicos com cadastro. 1º critério: títulos · 2º: artilharias.</p>
      </div>

      {/* filtro: geral / online / cpu */}
      <div className="flex border-[3px] border-black rounded-xl overflow-hidden">
        {MODES.map(t => (
          <button key={t.id} onClick={() => setMode(t.id)}
            className="flex-1 py-2.5 font-black text-xs uppercase" style={{ backgroundColor: mode === t.id ? GOLD : '#fff', color: '#000', ...OSWALD }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* dica: dá pra tocar num técnico e ver o álbum dele */}
      {!loading && shown.length > 0 && (
        <p className="text-center text-[12px] font-black text-black/55" style={OSWALD}>👆 Toque num técnico pra ver as cartas dele</p>
      )}

      {/* cabeçalho das colunas */}
      {!loading && shown.length > 0 && (
        <div className="flex items-center gap-3 px-2.5">
          <span className="w-9 shrink-0" />
          <span className="flex-1" />
          <span className="w-12 text-center font-black text-[11px] text-black/45 shrink-0" style={OSWALD}>🏆 Tít.</span>
          <span className="w-12 text-center font-black text-[11px] text-black/45 shrink-0" style={OSWALD}>⚽ Art.</span>
        </div>
      )}

      {loading && <p className="text-center font-bold text-black/60">Carregando…</p>}
      {down && (
        <Box bg="#fff" className="p-5 text-center">
          <p className="font-black text-sm" style={OSWALD}>🔧 Servidor fora do ar por uns minutos</p>
          <p className="font-bold text-black/60 text-xs mt-1">O ranking já volta — é só instabilidade. Tenta de novo daqui a pouco 💛</p>
        </Box>
      )}
      {!loading && !down && shown.length === 0 && (
        <Box bg="#fff" className="p-6 text-center">
          <p className="font-bold text-black/70">Ninguém no ranking ainda. Seja o primeiro campeão! 🔨</p>
        </Box>
      )}
      <div className="space-y-2">
        {shown.slice(0, 10).map((r, i) => (
          <button key={r.user_id} onClick={() => openAlbum(r.user_id, r.name)}
            className="w-full flex items-center gap-3 border-[3px] border-black rounded-xl p-2.5 active:translate-y-0.5"
            style={{ background: r.user_id === meId ? GOLD : '#fff', boxShadow: `3px 3px 0 ${INK}` }}>
            <span className="font-black text-lg w-9 text-center shrink-0" style={OSWALD}>{medal(i)}</span>
            <span className="font-black text-black text-sm flex-1 min-w-0 truncate text-left" style={OSWALD}>{r.name}{r.user_id === meId ? ' (você)' : ''}</span>
            <span className="w-12 text-center font-black text-lg shrink-0" style={OSWALD}>{r.titles}</span>
            <span className="w-12 text-center font-black text-lg shrink-0" style={OSWALD}>{r.scorer_titles}</span>
          </button>
        ))}
      </div>
      {!loading && !inList && meId && shown.length > 0 && (
        <Box bg="#fff" className="p-3 text-center">
          <p className="font-bold text-black/70 text-sm">Você ainda não pontuou{mode !== 'geral' ? ` ${mode === 'online' ? 'no online' : 'no CPU'}` : ''}. Seja campeão ou artilheiro pra entrar! 🔨</p>
        </Box>
      )}
      {!loading && !meId && (
        <Box bg="#fff" className="p-3 text-center">
          <p className="font-bold text-black/70 text-sm">Faça login pra aparecer no ranking e ganhar cartas.</p>
        </Box>
      )}
      <Btn onClick={() => dispatch({ type: 'GO_LOBBY' })} className="w-full text-lg">← Voltar</Btn>

      {/* álbum do técnico tocado */}
      {viewUser && (
        <div className="fixed inset-0 z-50 flex flex-col p-4" style={{ background: 'rgba(0,0,0,.7)' }} onClick={() => setViewUser(null)}>
          <div className="max-w-md w-full mx-auto my-auto max-h-[85vh] flex flex-col rounded-2xl border-[3px] border-black overflow-hidden" style={{ background: CREAM }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b-[3px] border-black" style={{ background: GOLD }}>
              <div className="min-w-0">
                <p className="font-black text-black text-lg leading-tight truncate" style={OSWALD}>📖 Álbum de {viewUser.name}</p>
                {viewCards && <p className="text-black/60 text-xs font-bold">{viewCards.length} carta{viewCards.length === 1 ? '' : 's'}</p>}
              </div>
              <button onClick={() => setViewUser(null)} className="shrink-0 w-8 h-8 rounded-full border-2 border-black bg-white font-black text-black active:translate-y-0.5">✕</button>
            </div>
            <div className="overflow-y-auto p-4">
              {!viewCards && <p className="text-center font-bold text-black/60 py-6">Carregando…</p>}
              {viewCards && viewCards.length === 0 && <p className="text-center font-bold text-black/60 py-6">Esse técnico ainda não ganhou cartas.</p>}
              {viewCards && viewCards.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {viewCards.map((c, i) => (
                    <CollectibleCard key={i} name={c.name} club={c.club} year={c.year} pos={c.pos} fame={c.fame} folk={c.folk} promessa={c.promessa} showBio />
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
        const seasonKey = online ? `${state.roomId}:${state.seasonNo}` : state.dinastia ? `dinastia:${state.seed}:${state.seasonNo}` : `cpu:${state.seed}:${state.seasonNo}`
        const displayName = user.user_metadata?.display_name ?? user.email?.split('@')[0] ?? you.teamName
        await resilientWrite({ table: 'esc_results', onConflict: 'user_id,season_key', row: {
          user_id: user.id, display_name: displayName,
          mode: online ? 'online' : 'cpu', season_key: seasonKey,
          champion: champ.id === you.id, top_scorer: top?.teamId === you.id,
          goals: myRow?.gf ?? 0,
        } })
      } catch { /* nunca trava o jogo */ }
    })()
  }, [])
  return null
}

// ─── CARREIRA: salvar/carregar + modais ──────────────────────────────
const CAREER_LS = 'esc-career'
function saveCareerLocal(save: CareerSave) { try { localStorage.setItem(CAREER_LS, JSON.stringify(save)) } catch { /* ignora */ } }
function loadCareerLocal(): CareerSave | null { try { const r = localStorage.getItem(CAREER_LS); return r ? JSON.parse(r) as CareerSave : null } catch { return null } }

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
async function loadCareer(): Promise<CareerSave | null> {
  try {
    const { data } = await supabase.auth.getUser()
    if (data?.user) {
      const { data: row } = await supabase.from('esc_careers').select('*').eq('user_id', data.user.id).maybeSingle()
      if (row) return { division: row.division, seasonNo: row.season_no, teamName: row.team_name, formation: row.formation, squad: row.squad as CareerSave['squad'], titles: row.titles, titlesA: row.titles_a ?? 0, pendingDecision: !!row.pending_decision, result: row.result ?? undefined, prevDivision: row.prev_division ?? undefined, rivals: (row.rival_teams as CareerSave['rivals']) ?? undefined, rivalCount: row.rival_count ?? undefined }
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
  const [tab, setTab] = useState<'register' | 'login'>('register')
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [nome, setNome] = useState('')
  const [err, setErr] = useState(''); const [loading, setLoading] = useState(false)
  async function go() {
    setLoading(true); setErr('')
    if (tab === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setErr('Email ou senha incorretos.'); setLoading(false); return }
      onDone()
    } else {
      if (!nome.trim()) { setErr('Escolha um nome de técnico.'); setLoading(false); return }
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: nome.trim() } } })
      if (error) { setErr(error.message); setLoading(false); return }
      if (data.session) { onDone() } // confirmação desligada: já entrou → salva
      else { setErr('✉️ Conta criada! Confirme no seu email e depois entre pra salvar na nuvem. (Já guardei no aparelho.)'); setLoading(false) }
    }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,.7)' }}>
      <div className="w-full max-w-xs border-[3px] border-black rounded-2xl p-4 bg-[#F4ECD6]" style={{ boxShadow: `5px 5px 0 ${INK}` }}>
        <p className="font-black text-black text-lg" style={OSWALD}>💾 Salvar carreira</p>
        <p className="text-black/60 text-xs font-bold mb-2">Rapidinho: crie a conta (ou entre) pra guardar sua carreira e jogar em qualquer aparelho.</p>
        <div className="flex border-[3px] border-black rounded-xl overflow-hidden mb-2">
          {(['register', 'login'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setErr('') }} className="flex-1 py-2 font-black text-xs uppercase" style={{ background: tab === t ? GOLD : '#fff', color: '#000', ...OSWALD }}>{t === 'register' ? 'Cadastrar' : 'Entrar'}</button>
          ))}
        </div>
        <div className="space-y-2">
          {tab === 'register' && <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome de técnico" className="w-full border-[3px] border-black rounded-lg px-3 py-2 font-black text-black text-sm bg-white" />}
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="seu@email.com" className="w-full border-[3px] border-black rounded-lg px-3 py-2 font-black text-black text-sm bg-white" />
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Senha" onKeyDown={e => e.key === 'Enter' && go()} className="w-full border-[3px] border-black rounded-lg px-3 py-2 font-black text-black text-sm bg-white" />
          {err && <p className={`text-xs font-bold ${err.startsWith('✉️') ? 'text-green-700' : 'text-red-500'}`}>{err}</p>}
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={onClose} className="flex-1 border-[3px] border-black rounded-xl py-2 font-black text-sm bg-white text-black" style={OSWALD}>Cancelar</button>
          <button onClick={go} disabled={loading} className="flex-1 border-[3px] border-black rounded-xl py-2 font-black text-sm" style={{ background: GREEN, color: '#fff', ...OSWALD }}>{loading ? '...' : tab === 'register' ? 'Criar e salvar' : 'Entrar e salvar'}</button>
        </div>
      </div>
    </div>
  )
}

// faixa no setup da carreira: retomar o save (ou excluí-lo no X). Só aparece
// depois de tocar em "Carreira por Divisões" — não fica mais na home.
function CareerContinueBanner() {
  const { dispatch } = useEsc()
  const [save, setSave] = useState<CareerSave | null>(null)
  const [decideOpen, setDecideOpen] = useState(false)
  const onDelete = async () => {
    if (!window.confirm('Excluir esse save de carreira? Isso não tem volta.')) return
    await deleteCareer()
    setSave(null)
  }
  useEffect(() => {
    let alive = true
    ;(async () => {
      const s = await loadCareer()
      if (!s) return
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
      ? { bg: '#1B7A3D', txt: `🔼 SUBIU PRA ${DIVISION_LABEL[save.division].toUpperCase()}!` }
      : save.result === 'down'
        ? { bg: '#E8503A', txt: `🔽 REBAIXADO PRA ${DIVISION_LABEL[save.division].toUpperCase()}` }
        : { bg: '#2E6FB0', txt: `➡️ CONTINUA NA ${DIVISION_LABEL[save.division].toUpperCase()}` }
    return (
      <div className="rounded-2xl border-[3px] border-black p-3 space-y-2" style={{ background: PURPLE, boxShadow: `4px 4px 0 ${INK}` }}>
        <div className="rounded-xl border-2 border-black px-3 py-2 text-center" style={{ background: banner.bg }}>
          <p className="font-black text-white text-sm" style={OSWALD}>{banner.txt}</p>
          <p className="font-bold text-white/85 text-[11px]">Temporada {save.seasonNo} · {save.titles} título{save.titles === 1 ? '' : 's'} · {save.teamName}</p>
          {(save.titlesA ?? 0) > 0 && <p className="mt-0.5"><CareerStars n={save.titlesA ?? 0} size={13} /></p>}
        </div>
        <p className="text-center text-white font-black text-xs" style={OSWALD}>Como quer seguir?</p>
        <button onClick={() => dispatch({ type: 'RESTORE_CAREER', save })} className="w-full rounded-xl border-2 border-black bg-white text-black font-black text-sm py-2.5 active:translate-y-0.5" style={OSWALD}>▶️ Continuar com o mesmo time</button>
        {(save.rivals ?? []).filter(r => r.division === save.division).length > 0 ? (
          <button onClick={() => dispatch({ type: 'RESTORE_CAREER', save, redraft: true })} className="w-full rounded-xl border-2 border-black font-black text-sm py-2.5 active:translate-y-0.5" style={{ background: GOLD, color: INK, ...OSWALD }}>🔄 Trocar tudo (novo leilão)</button>
        ) : (
          <p className="text-center text-white/70 text-[11px] font-bold px-1">🔒 Sem rival seu na {DIVISION_LABEL[save.division]} — o leilão não abre (seria só você). Siga com o mesmo time; volta quando um rival chegar na sua divisão.</p>
        )}
        <button onClick={() => setDecideOpen(false)} className="w-full text-white/60 text-xs underline">agora não</button>
      </div>
    )
  }
  return (
    <div className="rounded-2xl border-[3px] border-black p-3 space-y-2" style={{ background: PURPLE, boxShadow: `4px 4px 0 ${INK}` }}>
      <p className="font-black text-white text-sm leading-tight" style={OSWALD}>🪜 Carreira em andamento<br /><span className="opacity-85 text-xs">{DIVISION_LABEL[save.division]} · Temporada {save.seasonNo} · {save.titles} título{save.titles === 1 ? '' : 's'}</span>{(save.titlesA ?? 0) > 0 && <><br /><CareerStars n={save.titlesA ?? 0} size={13} /></>}</p>
      <div className="flex gap-2">
        <button
          onClick={() => save.pendingDecision ? setDecideOpen(true) : dispatch({ type: 'RESTORE_CAREER', save })}
          className="flex-1 rounded-xl border-2 border-black bg-white text-black font-black text-sm py-2.5 active:translate-y-0.5" style={OSWALD}>
          ▶️ Continuar carreira ({save.teamName})
        </button>
        <button onClick={onDelete} aria-label="Excluir save da carreira" title="Excluir save"
          className="rounded-xl border-2 border-black bg-white text-red-600 font-black text-lg px-3.5 active:translate-y-0.5" style={OSWALD}>
          ✕
        </button>
      </div>
    </div>
  )
}

// estrelas de título da SÉRIE A ⭐ — só campeão da elite ganha estrela.
// 1 = Campeão, 2 Bi, 3 Tri, 4 Tetra, 5 Penta, 6+ Dinastia 👑
const A_TITLE_LABEL: Record<number, string> = { 1: 'Campeão da Série A', 2: 'Bicampeão', 3: 'Tricampeão', 4: 'Tetracampeão', 5: 'Pentacampeão' }
function aTitleLabel(n: number): string { return n >= 6 ? '👑 Dinastia' : (A_TITLE_LABEL[n] ?? '') }
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
    setMsg(cloud ? '✅ Carreira salva na sua conta!' : '💾 Salva neste aparelho.')
  }
  const onSaveClick = async () => {
    const { data } = await supabase.auth.getUser()
    if (data?.user) doSave()
    else setAuthOpen(true) // não logado → cadastro rápido
  }
  const wonA = div === 'A' && youPos === 1        // campeão da elite nesta temporada → nova estrela
  const totalA = state.careerTitlesA + (wonA ? 1 : 0)
  const banner = nd.result === 'up'
    ? { bg: '#1B7A3D', txt: `🔼 SUBIU PRA ${DIVISION_LABEL[nd.div].toUpperCase()}!` }
    : nd.result === 'down'
      ? { bg: '#E8503A', txt: `🔽 REBAIXADO PRA ${DIVISION_LABEL[nd.div].toUpperCase()}` }
      : { bg: '#2E6FB0', txt: `➡️ CONTINUA NA ${DIVISION_LABEL[div].toUpperCase()}` }

  return (
    <div className="space-y-2.5">
      {wonA && (
        <div className="rounded-2xl border-4 border-black p-3 text-center" style={{ background: 'linear-gradient(150deg,#FFE79A,#FFC400 45%,#E8A200 75%,#FFDD70)', boxShadow: `4px 4px 0 ${INK}` }}>
          <p className="font-black text-black text-2xl leading-none" style={OSWALD}>🏆 CAMPEÃO DA SÉRIE A!</p>
          <p className="font-black text-black/80 text-sm mt-1" style={OSWALD}>{aTitleLabel(totalA)}</p>
          <p className="mt-1"><CareerStars n={totalA} size={22} /></p>
        </div>
      )}
      <div className="rounded-2xl border-4 border-black p-3 text-center" style={{ background: banner.bg, boxShadow: `4px 4px 0 ${INK}` }}>
        <p className="font-black text-white text-xl" style={OSWALD}>{banner.txt}</p>
        <p className="font-bold text-white/80 text-xs mt-0.5">{DIVISION_LABEL[div]} · Temporada {state.seasonNo} · {state.careerTitles} título{state.careerTitles === 1 ? '' : 's'} na carreira{totalA > 0 && !wonA ? ` · ${totalA}⭐ Série A` : ''}</p>
      </div>
      <p className="text-center font-black text-sm text-black/60" style={OSWALD}>Como quer seguir?</p>
      <Btn onClick={() => dispatch({ type: 'CAREER_ADVANCE', keep: true })} bg={GREEN} className="w-full text-lg"><span className="text-white">▶️ Continuar com o mesmo time</span></Btn>
      {nextRivalsHere > 0 ? (
        <Btn onClick={() => dispatch({ type: 'CAREER_ADVANCE', keep: false })} className="w-full text-lg">🔄 Trocar tudo (novo leilão)</Btn>
      ) : (
        <p className="text-center text-xs font-bold text-black/55 px-2">
          🔒 Sem rival seu na {DIVISION_LABEL[nd.div]} nesta temporada — o leilão não abre (seria só você). Dá pra <b>seguir com o mesmo time</b>; quando um rival subir ou cair pra sua divisão, o "trocar tudo" volta.
        </p>
      )}
      <div className="flex gap-2">
        <div className="flex-1"><Btn onClick={onSaveClick} bg="#fff" className="w-full">{busy ? '...' : '💾 Salvar'}</Btn></div>
        <div className="flex-1"><Btn onClick={() => setExitAsk(true)} bg="#fff" className="w-full">🚪 Sair</Btn></div>
      </div>
      {msg && <p className="text-center text-sm font-black text-green-700" style={OSWALD}>{msg}</p>}

      {authOpen && <CareerAuthModal onClose={() => setAuthOpen(false)} onDone={() => { setAuthOpen(false); doSave() }} />}

      {exitAsk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,.7)' }}>
          <div className="w-full max-w-xs border-[3px] border-black rounded-2xl p-4 bg-[#F4ECD6]" style={{ boxShadow: `5px 5px 0 ${INK}` }}>
            <p className="font-black text-black text-lg" style={OSWALD}>🚪 Sair da carreira</p>
            <p className="text-black/60 text-sm font-bold mb-3">Quer salvar antes de sair?</p>
            <div className="space-y-2">
              <button onClick={async () => { const sv = buildCareerSave(state); if (sv) await saveCareer(sv); setExitAsk(false); dispatch({ type: 'GO_LOBBY' }) }}
                className="w-full border-[3px] border-black rounded-xl py-2.5 font-black text-sm" style={{ background: GREEN, color: '#fff', ...OSWALD }}>💾 Salvar e sair</button>
              <button onClick={() => { setExitAsk(false); dispatch({ type: 'GO_LOBBY' }) }}
                className="w-full border-[3px] border-black rounded-xl py-2.5 font-black text-sm bg-white text-black" style={OSWALD}>🚪 Sair sem salvar</button>
              <button onClick={() => setExitAsk(false)}
                className="w-full border-2 border-black/20 rounded-xl py-2 font-black text-xs text-black/60" style={OSWALD}>Cancelar</button>
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
function OnlineEndVote() {
  const { state, dispatch, kickPlayer, leaveRoom } = useEsc()
  const youId = state.youIdx
  const isHost = state.isHost
  const votes = state.seasonVotes ?? {}
  const myVote = votes[youId]
  const humans = state.managers.filter(m => m.isHuman)
  // o host é o DECISOR (não vota) — placar e chips contam só os convidados
  const guests = humans.filter(m => m.id !== youId)
  const nMesmo = guests.filter(m => votes[m.id] === 'mesmo').length
  const nLeilao = guests.filter(m => votes[m.id] === 'leilao').length
  const nVoted = nMesmo + nLeilao
  const pend = guests.filter(m => !votes[m.id])
  const vote = (v: 'mesmo' | 'leilao') => dispatch({ type: 'CAST_SEASON_VOTE', mgrId: youId, vote: v })
  // aviso do host quando ainda tem gente sem decidir: um mini-modal com 3 saídas
  // (esperar · começar com eles · excluir e começar). Se todos prontos, começa direto.
  const [askStart, setAskStart] = useState<'mesmo' | 'leilao' | null>(null)
  const startMesmo = () => dispatch({ type: 'REPLAY_SEASON' })
  // "Novo leilão": a MESMA galera segue na sala, com um leilão do zero (jogadores
  // novos) — SEM voltar pra sala de espera. O host monta e transmite; os
  // convidados seguem via SYNC_STATE. Fallback seguro: qualquer erro → fluxo
  // antigo (REMATCH volta pra sala), pra NUNCA travar o jogo dos jogadores.
  const startLeilao = async () => {
    if (!state.roomId) { dispatch({ type: 'REMATCH' }); return }
    try {
      const { data: pls } = await supabase.from('room_players').select('manager_name, player_index').eq('room_id', state.roomId).order('player_index')
      const playerNames = ((pls ?? []) as { manager_name: string }[]).map(p => p.manager_name)
      if (playerNames.length === 0) { dispatch({ type: 'REMATCH' }); return }
      await supabase.from('game_rooms').update({ status: 'started' }).eq('id', state.roomId)
      dispatch({
        type: 'START_ONLINE',
        roomId: state.roomId, roomCode: state.roomCode, roomName: state.roomName,
        isHost: state.isHost, playerIndex: state.youIdx,
        playerNames, formation: state.managers[state.youIdx]?.formation ?? '4-3-3',
        deck: state.deckLeague, rematch: Date.now(),
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
      ? 'Sair da sala? O comando (host) passa pra outra pessoa. Se estiver sozinho, a sala é apagada.'
      : 'Sair da sala? Você será removido desta partida.'
    if (window.confirm(msg)) leaveRoom()
  }
  return (
    <div className="rounded-2xl border-4 border-black p-3 space-y-2.5" style={{ background: '#EAF3FF', boxShadow: `4px 4px 0 ${INK}` }}>
      <p className="font-black text-lg text-center" style={OSWALD}>🗳️ E agora?</p>
      {isHost ? (
        <>
          <p className="text-center text-xs font-bold text-black/60">Seguir com o <b>mesmo time</b> ou abrir um <b>novo leilão</b>? Você (host) decide 👇</p>
          {/* prontidão da galera (só os convidados): nome grande + PRONTO claro */}
          {guests.length > 0 && (
            <div className="space-y-1.5">
              {guests.map(m => { const v = votes[m.id]; return (
                <div key={m.id} className="flex items-center justify-between rounded-xl border-2 border-black px-3 py-2" style={{ background: v ? '#DCFCE7' : '#FFF7DE' }}>
                  <span className="font-black text-sm text-black" style={OSWALD}>{v ? '✅' : '⏳'} {m.teamName}</span>
                  <span className="text-[11px] font-black" style={{ ...OSWALD, color: v ? '#166534' : '#92600A' }}>
                    {v ? `PRONTO · quer ${v === 'mesmo' ? '▶️ mesmo time' : '🔨 novo leilão'}` : 'ainda não votou…'}
                  </span>
                </div>
              )})}
              <p className="text-center text-[11px] font-black text-black/55" style={OSWALD}>{nVoted}/{guests.length} prontos · ▶️ {nMesmo} · 🔨 {nLeilao}</p>
            </div>
          )}
          <Btn onClick={() => pend.length === 0 ? startMesmo() : setAskStart('mesmo')} bg={GREEN} className="w-full text-lg"><span className="text-white">▶️ Começar (mesmo time)</span></Btn>
          <Btn onClick={() => pend.length === 0 ? startLeilao() : setAskStart('leilao')} bg={GOLD} className="w-full text-lg">🔨 Abrir novo leilão</Btn>
          {pend.length > 0 && (
            <div className="pt-1">
              <p className="text-center text-[10px] font-bold text-black/45 mb-1">Quem ainda não decidiu (você não precisa esperar):</p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {pend.map(m => (
                  <button key={m.id} onClick={() => { if (window.confirm(`Remover ${m.teamName} da partida?`)) kickPlayer(m.id) }}
                    className="text-[10px] font-black border-2 border-black rounded-full px-2 py-0.5" style={{ background: '#fff', color: '#B23B2E', ...OSWALD }}>✂️ Remover {m.teamName}</button>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="text-center text-xs font-bold text-black/60">Vote no que você quer — o host começa quando decidir.</p>
          <div className="flex gap-2">
            {voteBtn('mesmo', '▶️ Mesmo time', GREEN, '#fff')}
            {voteBtn('leilao', '🔨 Novo leilão', GOLD, '#000')}
          </div>
          {myVote ? (
            <div className="rounded-xl border-[3px] border-black px-3 py-2.5 text-center" style={{ background: '#DCFCE7', boxShadow: `3px 3px 0 ${INK}` }}>
              <p className="font-black text-sm" style={{ ...OSWALD, color: '#166534' }}>✅ VOCÊ ESTÁ PRONTO!</p>
              <p className="text-[11px] font-bold text-black/60">Votou em {myVote === 'mesmo' ? '▶️ mesmo time' : '🔨 novo leilão'} · esperando o host começar (dá pra trocar)</p>
            </div>
          ) : (
            <p className="text-center text-sm font-black" style={{ color: '#b23b2e', ...OSWALD }}>👆 Toque no seu voto pra ficar PRONTO!</p>
          )}
        </>
      )}
      {/* saídas — uma linha só, discreta, pra todos */}
      <div className="flex items-center justify-center gap-6 pt-2 mt-1 border-t-2 border-black/10">
        <button onClick={() => dispatch({ type: 'GO_LOBBY_ONLINE' })} className="text-black/45 text-xs font-bold underline active:opacity-60" title="Sai pro menu mas continua na sala — dá pra voltar">🏠 Voltar pro menu</button>
        <button onClick={exitLeave} className="text-black/45 text-xs font-bold underline active:opacity-60" title="Sai da sala de vez">🚪 Sair da sala</button>
      </div>

      {/* modal do host: alguém ainda não decidiu — esperar, começar com eles, ou excluir */}
      {askStart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,.7)' }}>
          <div className="w-full max-w-xs border-[3px] border-black rounded-2xl p-4 bg-[#F4ECD6]" style={{ boxShadow: `5px 5px 0 ${INK}` }}>
            <p className="font-black text-black text-lg" style={OSWALD}>⏳ Nem todo mundo tá pronto</p>
            <p className="text-black/65 text-sm font-bold mb-3">
              {pend.length === 1 ? 'Ainda falta decidir: ' : 'Ainda faltam decidir: '}<b>{pend.map(m => m.teamName).join(', ')}</b>. O que você quer fazer?
            </p>
            <div className="space-y-2">
              <button onClick={() => { const k = askStart; setAskStart(null); k === 'mesmo' ? startMesmo() : startLeilao() }}
                className="w-full border-[3px] border-black rounded-xl py-2.5 font-black text-sm" style={{ background: GREEN, color: '#fff', ...OSWALD }}>▶️ Começar assim {pend.length === 1 ? '(ele entra junto)' : '(eles entram juntos)'}</button>
              <button onClick={async () => { const k = askStart; setAskStart(null); pend.forEach(m => kickPlayer(m.id)); await new Promise(r => setTimeout(r, 500)); k === 'mesmo' ? startMesmo() : startLeilao() }}
                className="w-full border-[3px] border-black rounded-xl py-2.5 font-black text-sm bg-white" style={{ color: '#B23B2E', ...OSWALD }}>✂️ Excluir {pend.length === 1 ? 'ele' : 'eles'} e começar</button>
              <button onClick={() => setAskStart(null)}
                className="w-full border-2 border-black/20 rounded-xl py-2 font-black text-xs text-black/60" style={OSWALD}>⏳ Esperar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function EscEnd() {
  const { state, dispatch } = useEsc()
  const you = state.managers[state.youIdx]
  const table = sortedTable(state.league)
  const champ = table[0]
  const youPos = table.findIndex(t => t.id === you.id) + 1
  const youWon = champ.id === you.id
  const online = state.onlineMode === 'online'
  const canRestart = !online || state.isHost
  const myScorer = topScorers(state, 1)[0]
  // carta-lembrança que o campeão escolheu (entra na imagem de compartilhar)
  const [myCard, setMyCard] = useState<WonCard | null>(null)
  const featured = youWon ? (myCard ?? [...you.squad].sort((a, b) => (b.lo + b.hi) - (a.lo + a.hi))[0]) : undefined
  const shareOpts: ShareOpts = {
    teamName: you.teamName, youPos, youWon, champName: champ.name,
    pts: table[youPos - 1]?.pts ?? 0, w: table[youPos - 1]?.w ?? 0, d: table[youPos - 1]?.d ?? 0, l: table[youPos - 1]?.l ?? 0,
    scorerName: myScorer?.name, scorerGoals: myScorer?.goals,
    card: featured ? { name: featured.name, club: featured.club, year: featured.year, pos: featured.pos, fame: featured.fame, folk: featured.folk, promessa: featured.promessa } : undefined,
  }
  // check de prontidão do "Reiniciar com novos times": TODOS os participantes
  // humanos precisam clicar "estou pronto" (não depende do presence, instável)
  const restartPending = state.restartPending
  const humanIds = state.managers.filter(m => m.isHuman).map(m => m.id)
  const readyCount = state.restartReady.filter(id => humanIds.includes(id)).length
  const iAmReady = state.restartReady.includes(state.youIdx)
  return (
    <Shell hideExit={online}>
      <RankResultWriter />
      <div className="text-center pt-8">
        <p className="text-6xl">{youWon ? '🏆' : youPos <= 4 ? '🥈' : youPos >= 17 ? '🪦' : '📻'}</p>
        <h2 className="font-black text-4xl mt-2" style={OSWALD}>{youWon ? 'CAMPEÃO!' : `${youPos}º LUGAR`}</h2>
        <p className="font-semibold text-black/60 mt-1">
          {youWon ? 'O pregão foi seu, o campeonato foi seu. Resenha eterna.' : `Campeão: ${champ.name}. ${youPos >= 17 ? 'Rebaixado. O leilão cobra caro.' : 'Ano que vem tem pregão de novo.'}`}
        </p>
      </div>
      {online && youWon && state.roomId && (
        <CardCollectPrompt you={you} seasonKey={`${state.roomId}:${state.seasonNo}`} origin="online" onClaimed={setMyCard} />
      )}
      {!online && youWon && (
        <CardCollectPrompt you={you} seasonKey={state.dinastia ? `dinastia:${state.seed}:${state.seasonNo}` : `cpu:${state.seed}:${state.seasonNo}`} origin="cpu" onClaimed={setMyCard} />
      )}
      <TableBox highlight={you.id} />
      <TopScorersBox highlight={you.id} />
      {online && state.roomId && (
        <HallDaFama roomId={state.roomId} isHost={state.isHost} seasonNo={state.seasonNo} champName={champ.name}
          scorerName={myScorer?.name} scorerGoals={myScorer?.goals} />
      )}
      {/* No online, a votação "E agora?" vem ANTES do compartilhar (é a ação principal) */}
      {online && <OnlineEndVote />}
      <ShareResultPanel opts={shareOpts} />
      {state.dinastia ? (
        <Btn onClick={() => { window.location.hash = 'dinastia' }} bg={GREEN} className="w-full text-lg"><span className="text-white">🏰 Ir pra janela de transferências →</span></Btn>
      ) : state.careerDivision ? <CareerEndPanel /> : online ? null : (<>
      {restartPending
        ? (
          <div className="rounded-2xl border-4 border-black p-3 space-y-2" style={{ background: '#FEF3C7' }}>
            <p className="text-center font-black text-lg" style={OSWALD}>🔀 REINICIAR COM NOVOS TIMES</p>
            <p className="text-center text-sm font-bold">Esperando todo mundo confirmar… {readyCount}/{humanIds.length} prontos</p>
            {!iAmReady
              ? <Btn onClick={() => dispatch({ type: 'CONFIRM_RESTART', mgrId: state.youIdx })} bg={GREEN} className="w-full text-lg"><span className="text-white">✅ Estou pronto</span></Btn>
              : <p className="text-center text-sm font-bold text-black/60">Você está pronto. Aguardando os outros…</p>}
            {canRestart && <Btn onClick={() => dispatch({ type: 'CANCEL_RESTART' })} className="w-full">Cancelar</Btn>}
          </div>
        )
        : canRestart
          ? (
            <>
              <Btn onClick={() => dispatch({ type: 'REPLAY_SEASON' })} bg={GREEN} className="w-full text-lg"><span className="text-white">🔁 Nova temporada (mesmo time)</span></Btn>
              <Btn onClick={() => dispatch({ type: 'REQUEST_NEW_TEAMS' })} className="w-full text-lg">🔀 Reiniciar com novos times</Btn>
            </>
          )
          : <p className="text-center text-sm font-bold text-black/60">Aguardando o host começar a próxima temporada…</p>}
      <Btn onClick={() => dispatch({ type: 'NEW_GAME' })} className="w-full text-lg">NOVO PREGÃO 🔨</Btn>
      </>)}
    </Shell>
  )
}
