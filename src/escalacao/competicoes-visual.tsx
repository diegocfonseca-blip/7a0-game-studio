// 🏆 A CARA DE CADA CAMPEONATO (23/10, mockups `campeonatos-paletas-trofeus.png` e `tunel-final-cores.png`, Diego:
// *"cor do campeonato, pode fazer o túnel da final e o campeão"*). Cada competição tem paleta, frase e troféu
// próprios, inspirados na de verdade (sem logo oficial) — Liga Legends e Copa dos 8 são nossas.
//  · `TunelFinal`: entra NO LUGAR da abertura de fase quando a fase que vem é a FINAL (mesmo relógio, nada a mais).
//  · `FestaCampeao`: a festa do fim, por cima da tela de fim (toque pula, fecha sozinha). Som: canto do clube pra quem
//    é o campeão e tem canto; pros outros, o grito de gol.
// Zero mensagem nova: tudo sai do que cada aparelho já tem.
import { createContext, useContext, useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { tr } from './lang'
import { playCampeao } from './sound'
import { legendAvatar } from './legend-avatars'
import estadioArt from './img/online-estadio-v25.webp'
import { useTelaPC } from './sport'

const INK = '#0C0C0C'
const OSW: CSSProperties = { fontFamily: 'Oswald, sans-serif', fontWeight: 900, textTransform: 'uppercase' }

export type CompId = 'liga' | 'copa8' | 'liberta' | 'champions' | 'mundo' | 'euro' | 'mundial' | 'riosp' | 'sulminas' | 'nordeste' | 'relampago'
  // 🏆 carreira (24/10): as 5 divisões, a Copa e a Supercopa — o troféu é a arte da Sala de Troféus (`public/trofeus-v137/`)
  | 'carV' | 'carD' | 'carC' | 'carB' | 'carA' | 'copabr' | 'supercopa'
interface Comp {
  nome: [string, string]; bg: string; titulo: string; sub: string; vsBg: string; vsInk: string
  faixaBg: string; faixaInk: string; frase: [string, string]; campeao: [string, string]; conf: string[]; extra?: 'estrelas' | 'fumaca' | 'faixas' | 'sol' | 'raios'
}
export const COMPS: Record<CompId, Comp> = {
  liga: { nome: ['Liga Legends', 'Liga Legends'], bg: 'radial-gradient(ellipse at 50% 40%,#3a3220,#0C0C0C 72%)', titulo: '#FFC400', sub: '#F4ECD6', vsBg: '#FFC400', vsInk: INK, faixaBg: '#F4ECD6', faixaInk: INK, frase: ['a liga lendária', 'the legendary league'], campeao: ['campeão da Liga Legends', 'Liga Legends champion'], conf: ['#FFC400', '#F4ECD6', '#1B7A3D', '#fff'] },
  copa8: { nome: ['Copa dos 8', 'Cup of 8'], bg: 'radial-gradient(ellipse at 50% 40%,#d9572f,#5a1408 75%)', titulo: '#FFE79A', sub: '#FFE79A', vsBg: '#FFC400', vsInk: INK, faixaBg: '#FFC400', faixaInk: INK, frase: ['mata-mata é guerra', 'knockout is war'], campeao: ['sobreviveu à guerra', 'survived the war'], conf: ['#FFC400', '#C2452F', '#FFE79A', '#fff'] },
  // ⚡ MATA-MATA RELÂMPAGO (28/10, Diego: *"o desenho do mata-mata relâmpago deve ser algo com raio… túnel da final, festa do título,
  // tudo padrão igual aos outros campeonatos"*): noite roxa-elétrica, amarelo de raio e os raios cortando o fundo.
  relampago: { nome: ['Mata-mata Relâmpago', 'Lightning Knockout'], bg: 'radial-gradient(ellipse at 50% 35%,#5b34d6,#140838 70%)', titulo: '#FFE14D', sub: '#E9E3FF', vsBg: '#FFE14D', vsInk: '#140838', faixaBg: '#FFE14D', faixaInk: '#140838', frase: ['o raio não cai duas vezes', 'lightning never strikes twice'], campeao: ['caiu como um raio', 'struck like lightning'], conf: ['#FFE14D', '#7C3AED', '#FFFFFF', '#B79CFF'], extra: 'raios' },
  liberta: { nome: ['Libertadores', 'Libertadores'], bg: 'radial-gradient(ellipse at 50% 40%,#3a2c08,#0B0B0B 70%)', titulo: '#F2E6C8', sub: '#C9A227', vsBg: '#C9A227', vsInk: '#0B0B0B', faixaBg: '#C9A227', faixaInk: '#0B0B0B', frase: ['a glória eterna', 'eternal glory'], campeao: ['glória eterna', 'eternal glory'], conf: ['#C9A227', '#B5121B', '#F2E6C8', '#fff'], extra: 'fumaca' },
  champions: { nome: ['Champions', 'Champions'], bg: 'radial-gradient(ellipse at 50% 40%,#2c4fb5,#0A1640 70%)', titulo: '#FFFFFF', sub: '#D5DCE4', vsBg: '#D5DCE4', vsInk: '#0A1640', faixaBg: '#FFFFFF', faixaInk: '#0A1640', frase: ['a orelhuda em jogo', 'big ears on the line'], campeao: ['a orelhuda é sua', 'big ears are yours'], conf: ['#D5DCE4', '#FFFFFF', '#1F3A93', '#8E9AA8'], extra: 'estrelas' },
  mundo: { nome: ['Copa do Mundo', 'World Cup'], bg: 'linear-gradient(160deg,#0E5B2A,#1B7A3D 45%,#c9a000 140%)', titulo: '#FFFFFF', sub: '#FFE79A', vsBg: '#FFC400', vsInk: '#0E5B2A', faixaBg: '#FFC400', faixaInk: INK, frase: ['a taça do mundo', 'the world trophy'], campeao: ['campeão do mundo', 'world champion'], conf: ['#FFC400', '#1F7BD8', '#FFFFFF', '#2FBF5A'], extra: 'faixas' },
  // 🇪🇺 EUROCOPA (31/10, Diego: *"faça com temática… troféu da eurocopa, túnel da final, arte do vencedor"*): azul-noite da Europa,
  // prata da taça Henri Delaunay e o círculo de estrelas douradas (o `estrelas` do fundo).
  euro: { nome: ['Eurocopa', 'Euro'], bg: 'radial-gradient(ellipse at 50% 38%,#1f4fd1,#061a52 72%)', titulo: '#FFFFFF', sub: '#FFE14D', vsBg: '#FFE14D', vsInk: '#061a52', faixaBg: '#FFE14D', faixaInk: '#061a52', frase: ['a taça da Europa', 'the trophy of Europe'], campeao: ['campeão da Europa', 'champion of Europe'], conf: ['#FFE14D', '#1f4fd1', '#FFFFFF', '#D5DCE4'], extra: 'estrelas' },
  mundial: { nome: ['Mundial de Clubes', 'Club World Cup'], bg: 'radial-gradient(ellipse at 50% 40%,#4a3a08,#111 72%)', titulo: '#FFC400', sub: '#F4ECD6', vsBg: '#FFC400', vsInk: INK, faixaBg: '#FFC400', faixaInk: INK, frase: ['o planeta dos campeões', 'the planet of champions'], campeao: ['dono do planeta', 'owner of the planet'], conf: ['#FFC400', '#8C6A00', '#F4ECD6', '#fff'] },
  riosp: { nome: ['Rio × São Paulo', 'Rio × São Paulo'], bg: 'linear-gradient(90deg,#1E88E5 0%,#64B5F6 48%,#5c5c5c 52%,#2B2B2B 100%)', titulo: '#FFFFFF', sub: '#F4ECD6', vsBg: '#F4ECD6', vsInk: INK, faixaBg: '#F4ECD6', faixaInk: INK, frase: ['biscoito × bolacha', 'biscoito × bolacha'], campeao: ['biscoito, bolacha e a taça', 'biscoito, bolacha and the cup'], conf: ['#1E88E5', '#F4ECD6', '#9E9E9E', '#fff'] },
  sulminas: { nome: ['Sul × Minas-Paraná', 'South × Minas-Paraná'], bg: 'radial-gradient(ellipse at 50% 40%,#2e7d32,#0E3B1A 72%)', titulo: '#FFC400', sub: '#F4ECD6', vsBg: '#FFC400', vsInk: '#0E3B1A', faixaBg: '#FFC400', faixaInk: INK, frase: ['chimarrão × pão de queijo', 'mate × cheese bread'], campeao: ['rei do sul e das gerais', 'king of the south'], conf: ['#FFC400', '#2FBF5A', '#F4ECD6', '#6D4C41'] },
  nordeste: { nome: ['Copa do Nordeste', 'Northeast Cup'], bg: 'radial-gradient(ellipse at 50% 30%,#F08A2E,#7A3B12 75%)', titulo: '#FFF3B0', sub: '#FFE79A', vsBg: '#FFC400', vsInk: '#7A3B12', faixaBg: '#FFC400', faixaInk: '#3a1a06', frase: ['sol, cordel e forró', 'sun, cordel and forró'], campeao: ['rei do nordeste', 'king of the northeast'], conf: ['#FFC400', '#E86A1C', '#1B7A3D', '#fff'], extra: 'sol' },
  carV: { nome: ['Várzea', 'Várzea'], bg: 'radial-gradient(ellipse at 50% 40%,#9a6631,#2b1608 72%)', titulo: '#FFE79A', sub: '#F4ECD6', vsBg: '#FFE79A', vsInk: '#2b1608', faixaBg: '#FFE79A', faixaInk: '#2b1608', frase: ['do terrão pra glória', 'from the dirt to glory'], campeao: ['rei do terrão', 'king of the dirt pitch'], conf: ['#FFE79A', '#C98A3A', '#F4ECD6', '#fff'], extra: 'sol' },
  carD: { nome: ['Série D', 'Série D'], bg: 'radial-gradient(ellipse at 50% 40%,#2a8a4c,#06240f 72%)', titulo: '#FFFFFF', sub: '#C8F2D5', vsBg: '#F4ECD6', vsInk: '#06240f', faixaBg: '#F4ECD6', faixaInk: '#06240f', frase: ['a subida começa aqui', 'the climb starts here'], campeao: ['campeão da Série D', 'Série D champion'], conf: ['#2FBF5A', '#F4ECD6', '#FFC400', '#fff'] },
  carC: { nome: ['Série C', 'Série C'], bg: 'radial-gradient(ellipse at 50% 40%,#2f6bae,#0b1d38 72%)', titulo: '#FFFFFF', sub: '#CFE2F7', vsBg: '#CFE2F7', vsInk: '#0b1d38', faixaBg: '#FFFFFF', faixaInk: '#0b1d38', frase: ['o meio do caminho', 'halfway up the mountain'], campeao: ['campeão da Série C', 'Série C champion'], conf: ['#5AA0E8', '#FFFFFF', '#FFC400', '#CFE2F7'] },
  carB: { nome: ['Série B', 'Série B'], bg: 'radial-gradient(ellipse at 50% 40%,#7c3aed,#1c0a3a 72%)', titulo: '#FFFFFF', sub: '#E3D4FF', vsBg: '#D5DCE4', vsInk: '#1c0a3a', faixaBg: '#D5DCE4', faixaInk: '#1c0a3a', frase: ['a porta da elite', 'the door to the elite'], campeao: ['campeão da Série B', 'Série B champion'], conf: ['#B794FF', '#D5DCE4', '#FFC400', '#fff'], extra: 'estrelas' },
  carA: { nome: ['Série A', 'Série A'], bg: 'radial-gradient(ellipse at 50% 40%,#5a4510,#0C0C0C 72%)', titulo: '#FFC400', sub: '#F4ECD6', vsBg: '#FFC400', vsInk: INK, faixaBg: '#FFC400', faixaInk: INK, frase: ['o topo do Brasil', 'the top of Brazil'], campeao: ['campeão da Série A', 'Série A champion'], conf: ['#FFC400', '#FFE79A', '#1B7A3D', '#fff'], extra: 'faixas' },
  copabr: { nome: ['Copa do Brasil', 'Copa do Brasil'], bg: 'linear-gradient(160deg,#0a3d1d,#1B7A3D 55%,#c9a000 150%)', titulo: '#FFE79A', sub: '#FFFFFF', vsBg: '#FFC400', vsInk: '#0a3d1d', faixaBg: '#FFC400', faixaInk: INK, frase: ['mata-mata do país inteiro', 'the whole country\u2019s knockout'], campeao: ['campeão da Copa', 'cup champion'], conf: ['#FFC400', '#1B7A3D', '#2F6BAE', '#fff'] },
  supercopa: { nome: ['Supercopa', 'Super Cup'], bg: 'radial-gradient(ellipse at 50% 40%,#c2452f,#2a0805 72%)', titulo: '#FFFFFF', sub: '#FFD9D2', vsBg: '#FFC400', vsInk: INK, faixaBg: '#FFC400', faixaInk: INK, frase: ['campeão contra campeão', 'champion versus champion'], campeao: ['campeão da Supercopa', 'Super Cup champion'], conf: ['#E8503A', '#FFC400', '#fff', '#FFD9D2'], extra: 'fumaca' },
}

// ── os troféus (desenho vetorial, leve; inspirados nos reais, sem logo) ──────────────────────────────────────────
const S = { stroke: INK, strokeWidth: 3, strokeLinejoin: 'round' as const }
function Grads({ id }: { id: string }) {
  return <defs>
    <linearGradient id={`${id}o`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFF3B0" /><stop offset=".35" stopColor="#FFC400" /><stop offset=".7" stopColor="#C98A00" /><stop offset="1" stopColor="#FFE08A" /></linearGradient>
    <linearGradient id={`${id}p`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset=".4" stopColor="#D5DCE4" /><stop offset=".75" stopColor="#8E9AA8" /><stop offset="1" stopColor="#F1F4F7" /></linearGradient>
    <linearGradient id={`${id}v`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2FBF5A" /><stop offset="1" stopColor="#0E5B2A" /></linearGradient>
    <linearGradient id={`${id}m`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5a3a1e" /><stop offset="1" stopColor="#2b1a0c" /></linearGradient>
  </defs>
}
const TROFEU_CARREIRA: Partial<Record<CompId, string>> = { carV: 'liga-V', carD: 'liga-D', carC: 'liga-C', carB: 'liga-B', carA: 'liga-A', copabr: 'copa', supercopa: 'supercopa' }
export function Trofeu({ comp, size = 120, sombra = 4 }: { comp: CompId; size?: number; sombra?: number }) {
  const sb = `drop-shadow(${sombra}px ${sombra}px 0 rgba(0,0,0,.55))`
  // 🏆 carreira: a MESMA arte da Sala de Troféus (arquivo separado, só baixa quem vê)
  const arte = TROFEU_CARREIRA[comp]
  if (arte) return <img src={`${import.meta.env.BASE_URL}trofeus-v137/${arte}.webp`} alt="" width={size} height={Math.round(size * 170 / 120)} style={{ display: 'block', objectFit: 'contain', filter: sb }} />
  const id = `tr-${comp}`, o = `url(#${id}o)`, pr = `url(#${id}p)`
  const corpo: Partial<Record<CompId, ReactNode>> = {
    mundo: <><rect x="38" y="138" width="44" height="22" rx="4" fill={o} {...S} /><rect x="38" y="143" width="44" height="5" fill={`url(#${id}v)`} /><rect x="38" y="152" width="44" height="5" fill={`url(#${id}v)`} /><path d="M44 138 C30 110,40 92,52 82 C44 70,46 56,60 52 C74 56,76 70,68 82 C80 92,90 110,76 138 Z" fill={o} {...S} /><path d="M50 128 C46 112,54 100,60 94 M70 128 C74 112,66 100,60 94" fill="none" stroke="#9a6a00" strokeWidth={2.5} /><circle cx="60" cy="40" r="24" fill={o} {...S} /><path d="M38 40 H82 M60 16 C48 28,48 52,60 64 M60 16 C72 28,72 52,60 64" fill="none" stroke="#9a6a00" strokeWidth={2} /></>,
    euro: <><rect x="32" y="140" width="56" height="20" rx="4" fill="#0b2a7a" {...S} /><path d="M50 140 L54 118 H66 L70 140 Z" fill={pr} {...S} /><path d="M54 118 C50 104,46 74,40 22 H80 C74 74,70 104,66 118 Z" fill={pr} {...S} /><ellipse cx="60" cy="22" rx="20" ry="5" fill="#c9d1da" {...S} /><path d="M47 40 C50 70,53 92,56 110" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" opacity={.7} />{Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return <circle key={i} cx={60 + Math.cos(a) * 12} cy={150 + Math.sin(a) * 4} r={1.6} fill="#FFE14D" /> })}</>,
    champions: <><rect x="34" y="140" width="52" height="20" rx="4" fill="#1a2a5c" {...S} /><path d="M52 140 L56 116 H64 L68 140 Z" fill={pr} {...S} /><path d="M34 34 H86 C86 80,76 108,60 116 C44 108,34 80,34 34 Z" fill={pr} {...S} /><path d="M36 42 C6 34,4 98,44 96 C30 86,22 54,36 52 Z" fill={pr} {...S} /><path d="M84 42 C114 34,116 98,76 96 C90 86,98 54,84 52 Z" fill={pr} {...S} /><ellipse cx="60" cy="34" rx="26" ry="6" fill="#c9d1da" {...S} /></>,
    liberta: <><path d="M30 140 H90 L84 162 H36 Z" fill={`url(#${id}m)`} {...S} /><rect x="40" y="146" width="40" height="8" fill="#C9A227" stroke={INK} strokeWidth={1.5} /><path d="M52 140 L55 118 H65 L68 140 Z" fill={pr} {...S} /><path d="M36 58 H84 C84 92,74 112,60 118 C46 112,36 92,36 58 Z" fill={pr} {...S} /><path d="M38 64 C24 62,24 88,42 92 M82 64 C96 62,96 88,78 92" fill="none" {...S} /><circle cx="60" cy="24" r="7" fill={pr} {...S} /><path d="M60 31 L60 46 M60 36 L50 44 M60 36 L70 30 M60 46 L52 56 M60 46 L70 56" stroke={INK} strokeWidth={4} strokeLinecap="round" /><circle cx="72" cy="56" r="4" fill="#fff" stroke={INK} strokeWidth={2} /></>,
    mundial: <><rect x="36" y="142" width="48" height="18" rx="4" fill="#111" {...S} /><path d="M48 142 C40 112,46 92,60 84 C74 92,80 112,72 142 Z" fill={o} {...S} /><circle cx="60" cy="56" r="30" fill="none" stroke={o} strokeWidth={10} /><circle cx="60" cy="56" r="30" fill="none" stroke={INK} strokeWidth={2} /><circle cx="60" cy="56" r="17" fill={o} {...S} /></>,
    liga: <><rect x="34" y="140" width="52" height="20" rx="4" fill={INK} {...S} /><path d="M50 140 L54 112 H66 L70 140 Z" fill={o} {...S} /><path d="M30 40 H90 C90 82,78 106,60 112 C42 106,30 82,30 40 Z" fill={o} {...S} /><path d="M32 48 C14 46,14 80,36 84 M88 48 C106 46,106 80,84 84" fill="none" {...S} /><path d="M60 58 l6 12 13 2-9 9 2 13-12-6-12 6 2-13-9-9 13-2z" fill="#fff" stroke={INK} strokeWidth={2} /></>,
    copa8: <><rect x="34" y="140" width="52" height="20" rx="4" fill="#C2452F" {...S} /><path d="M50 140 L54 114 H66 L70 140 Z" fill={o} {...S} /><path d="M28 36 H92 L80 104 C74 112,46 112,40 104 Z" fill={o} {...S} /><text x="60" y="88" textAnchor="middle" fontFamily="Oswald" fontWeight={700} fontSize={46} fill={INK}>8</text></>,
    riosp: <><rect x="36" y="142" width="48" height="18" rx="4" fill="#1a1a1a" {...S} /><path d="M50 142 L54 120 H66 L70 142 Z" fill={pr} {...S} /><path d="M42 44 C34 70,36 104,60 120 C84 104,86 70,78 44 Z" fill={pr} {...S} /><path d="M44 52 C22 40,18 82,46 90 M76 52 C98 40,102 82,74 90" fill="none" {...S} /><path d="M40 40 H80 L76 30 H44 Z" fill={pr} {...S} /></>,
    sulminas: <><rect x="38" y="142" width="44" height="18" rx="4" fill="#0E5B2A" {...S} /><path d="M52 142 L55 104 H65 L68 142 Z" fill={pr} {...S} /><path d="M40 26 H80 C80 70,72 98,60 104 C48 98,40 70,40 26 Z" fill={o} {...S} /><path d="M42 34 C30 34,30 62,46 66 M78 34 C90 34,90 62,74 66" fill="none" {...S} /></>,
    // ⚡ Relâmpago: a taça com um RAIO dourado atravessando o bojo (sem número, sem logo)
    relampago: <><rect x="34" y="140" width="52" height="20" rx="4" fill="#3b1f8f" {...S} /><path d="M52 140 L56 114 H64 L68 140 Z" fill={o} {...S} /><path d="M28 34 H92 C92 80,80 106,60 114 C40 106,28 80,28 34 Z" fill={pr} {...S} /><path d="M28 46 C12 46,12 74,32 78 M92 46 C108 46,108 74,88 78" fill="none" {...S} /><path d="M66 38 L46 76 H60 L52 106 L78 62 H63 L72 38 Z" fill={o} stroke={INK} strokeWidth={3} strokeLinejoin="round" /><path d="M20 20 L14 32 H20 L16 42" fill="none" stroke="#FFE14D" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" /><path d="M100 16 L94 28 H100 L96 38" fill="none" stroke="#FFE14D" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" /></>,
    nordeste: <><g stroke="#E86A1C" strokeWidth={5} strokeLinecap="round" opacity={0.9}><path d="M60 8 V22 M20 28 L30 38 M100 28 L90 38 M8 68 H22 M98 68 H112" /></g><rect x="36" y="142" width="48" height="18" rx="4" fill="#7A3B12" {...S} /><path d="M50 142 L54 116 H66 L70 142 Z" fill={o} {...S} /><path d="M32 44 H88 C88 86,76 108,60 116 C44 108,32 86,32 44 Z" fill={o} {...S} /><path d="M60 62 V100 M50 72 V84 H60 M70 66 V80 H60" stroke="#1B7A3D" strokeWidth={5} strokeLinecap="round" fill="none" /></>,
  }
  return <svg viewBox="0 0 120 170" width={size} height={Math.round(size * 170 / 120)} style={{ display: 'block', filter: sb }}><Grads id={id} />{corpo[comp]}</svg>
}

function Enfeite({ tipo }: { tipo?: Comp['extra'] }) {
  if (tipo === 'estrelas') return <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>{[[8, 18], [86, 26], [18, 72], [78, 74], [50, 60], [34, 30], [64, 14]].map(([l, t], i) => <span key={i} style={{ position: 'absolute', left: `${l}%`, top: `${t}%`, color: '#fff', opacity: .75, fontSize: 14 }}>★</span>)}</div>
  if (tipo === 'fumaca') return <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 12% 88%,rgba(181,18,27,.55),transparent 35%),radial-gradient(circle at 88% 88%,rgba(181,18,27,.55),transparent 35%)' }} />
  if (tipo === 'faixas') return <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'repeating-linear-gradient(120deg,rgba(255,196,0,.12) 0 18px,transparent 18px 46px)' }} />
  // ⚡ raios cortando o fundo (CSS/SVG puro — 0 KB de imagem)
  if (tipo === 'raios') return <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: .5 }}>
    {['M12 0 L6 22 H11 L4 46', 'M88 4 L94 24 H89 L96 44', 'M30 100 L36 80 H31 L38 62', 'M74 100 L68 82 H73 L66 64'].map((d, i) => <path key={i} d={d} fill="none" stroke="#FFE14D" strokeWidth={1.4} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />)}
  </svg>
  if (tipo === 'sol') return <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'repeating-conic-gradient(from 0deg at 50% 0%,rgba(255,220,120,.16) 0 7deg,transparent 7deg 20deg)' }} />
  return null
}
const css = `
@keyframes tfEntraE{from{transform:translateX(-160px);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes tfEntraD{from{transform:translateX(160px);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes tfPulsa{0%,100%{transform:scale(1)}50%{transform:scale(1.14)}}
@keyframes tfZoom{from{transform:scale(1.5);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes fcSobe{from{transform:translateY(60px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes fcBrilho{0%,100%{filter:drop-shadow(0 0 18px rgba(255,220,120,.55))}50%{filter:drop-shadow(0 0 46px rgba(255,220,120,1))}}
@keyframes fcCai{0%{transform:translateY(-120px) rotate(0)}100%{transform:translateY(110vh) rotate(540deg)}}
@keyframes fcSai{to{opacity:0}}
`

/** 🎬 O TÚNEL DA FINAL: no lugar da abertura de fase quando a próxima é a final (mesmo relógio). */
export function TunelFinal({ comp, casa, fora, seg, total, espera, nomeComp, onFechar }: {
  comp: CompId; casa: { nome: string; crest: ReactNode }; fora: { nome: string; crest: ReactNode }
  seg: number | null; total: number; espera?: string
  /** 🏆 carreira: o nome que o save usa (Copa do Brasil × Copa Legends) */ nomeComp?: [string, string]
  /** carreira: o toque que fecha a tela cheia também solta o relógio */ onFechar?: () => void
}) {
  const c = nomeComp ? { ...COMPS[comp], nome: nomeComp } : COMPS[comp]
  const pc = useTelaPC()
  // 🎬 23/10 (Diego numa live: *"não vi nada disso"*): na contagem do automático o túnel vira TELA CHEIA por cima de tudo,
  // como a festa — antes era um cartão dentro do quadro do topo e passava batido. Toque fecha. No MANUAL fica só o cartão
  // (a tela cheia esconderia os controles de quem dá a largada).
  const [fechado, setFechado] = useState(false)
  const pct = seg == null || total <= 0 ? 0 : Math.max(0, Math.min(100, Math.round(100 - (seg / total) * 100)))
  const cartao = (
    <div style={{ position: 'relative', overflow: 'hidden', border: `4px solid ${INK}`, borderRadius: 22, boxShadow: `5px 5px 0 ${INK}`, background: c.bg, color: '#fff', padding: '16px 14px 14px', margin: '0 0 12px' }}>
      <style>{css}</style>
      <Enfeite tipo={c.extra} />
      <div style={{ position: 'relative', textAlign: 'center', animation: 'tfZoom .5s both' }}>
        <small style={{ ...OSW, fontSize: 11.5, letterSpacing: '.3em', color: c.sub }}>{tr(c.nome[0], c.nome[1])}</small>
        <b style={{ ...OSW, display: 'block', fontSize: 46, lineHeight: 1, color: c.titulo, filter: 'drop-shadow(3px 3px 0 #000)' }}>{tr('Final', 'Final')}</b>
      </div>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, margin: '12px 0 6px' }}>
        <div style={{ flex: 1, minWidth: 0, textAlign: 'center', animation: 'tfEntraE .6s .2s both' }}>
          <div style={{ display: 'flex', justifyContent: 'center', filter: 'drop-shadow(4px 4px 0 #000)' }}>{casa.crest}</div>
          <b style={{ ...OSW, display: 'block', fontSize: 16, marginTop: 6, filter: 'drop-shadow(2px 2px 0 #000)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{casa.nome}</b>
        </div>
        <div style={{ flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <Trofeu comp={comp} size={54} />
          <span style={{ width: 54, height: 54, borderRadius: '50%', border: `4px solid ${INK}`, background: c.vsBg, color: c.vsInk, ...OSW, fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'tfPulsa 1s .8s infinite' }}>VS</span>
        </div>
        <div style={{ flex: 1, minWidth: 0, textAlign: 'center', animation: 'tfEntraD .6s .2s both' }}>
          <div style={{ display: 'flex', justifyContent: 'center', filter: 'drop-shadow(4px 4px 0 #000)' }}>{fora.crest}</div>
          <b style={{ ...OSW, display: 'block', fontSize: 16, marginTop: 6, filter: 'drop-shadow(2px 2px 0 #000)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fora.nome}</b>
        </div>
      </div>
      <div style={{ position: 'relative', textAlign: 'center', marginTop: 8 }}>
        <span style={{ display: 'inline-block', background: c.faixaBg, color: c.faixaInk, border: `3px solid ${INK}`, borderRadius: 10, padding: '3px 12px', ...OSW, fontSize: 12.5, letterSpacing: '.06em', boxShadow: `3px 3px 0 ${INK}` }}>🏆 {tr(c.frase[0], c.frase[1])}</span>
        <div style={{ height: 8, border: `2px solid ${INK}`, borderRadius: 99, background: 'rgba(255,255,255,.25)', margin: '12px 4px 6px', overflow: 'hidden' }}><i style={{ display: 'block', height: '100%', width: `${pct}%`, background: c.faixaBg }} /></div>
        <p style={{ ...OSW, fontSize: 14, margin: 0, filter: 'drop-shadow(2px 2px 0 #000)' }}>{seg == null ? (espera ?? '') : <>⚽ {tr('A bola rola em', 'Kick-off in')} {seg}s</>}</p>
      </div>
    </div>
  )
  if (seg == null || seg <= 0 || fechado) return cartao
  return <>
    {cartao}
    {createPortal(
      <div onClick={() => { setFechado(true); onFechar?.() }} style={{ position: 'fixed', inset: 0, zIndex: 99960, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${c.bg}, url(${estadioArt}) center / cover`, cursor: 'pointer', padding: 16 }}>
        <style>{css}</style>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.35)' }} />
        <div style={{ position: 'relative', width: '100%', maxWidth: 520, zoom: pc ? 1.55 : 1.08 } as CSSProperties}>{cartao}
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,.7)', fontSize: 10, fontWeight: 700, margin: '2px 0 0' }}>{tr('toque pra fechar', 'tap to close')}</p>
        </div>
      </div>,
      document.body,
    )}
  </>
}

/** 🏆 A FESTA DO CAMPEÃO: por cima da tela de fim, ~5,5 s, toque pula. */
/** ⚽🅰️ quem fez mais gols / deu mais passes na competição (pra festa) */
export type DestaqueFesta = { nome: string; time: string; n: number }
export function FestaCampeao({ comp, nome, crest, mascote, lendas = [], linha, souCampeao = false, onDone, artilheiro, garcom, nomeComp }: {
  comp: CompId; nome: string; crest: ReactNode; mascote?: ReactNode
  /** 🏆 carreira: o nome que o save usa (Copa do Brasil × Copa Legends) */ nomeComp?: [string, string]
  /** ⚽ 23/10 (Diego: *"já poderia aparecer o artilheiro que ganhou a copa também"*) — e o 🅰️ garçom junto (regra dele: o que vale pro gol vale pra assistência) */
  artilheiro?: DestaqueFesta | null; garcom?: DestaqueFesta | null
  lendas?: { nome: string; club: string; year: number }[]; linha?: string
  /** quem está vendo É o campeão? (aí toca o canto do clube dele, se tiver; senão o grito de gol) */
  souCampeao?: boolean; onDone: () => void
}) {
  const c = nomeComp ? { ...COMPS[comp], nome: nomeComp } : COMPS[comp]
  const DUR = 5600
  const [saindo, setSaindo] = useState(false)
  useEffect(() => {
    const para = playCampeao(souCampeao, DUR)
    const t1 = setTimeout(() => setSaindo(true), DUR - 450)
    const t2 = setTimeout(onDone, DUR)
    return () => { para(); clearTimeout(t1); clearTimeout(t2) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const conf = Array.from({ length: 46 }, (_, i) => ({ l: (i * 37) % 100, d: (i * 0.137) % 3.2, r: (i * 53) % 180, cor: c.conf[i % c.conf.length], dur: 2.6 + (i % 5) * 0.35 }))
  const vis = lendas.slice(0, 3)
  // 🖥️ 23/10: no computador a festa ocupa a tela inteira (antes era a coluna de celular no meio)
  const pc = useTelaPC()
  return createPortal(
    <div onClick={onDone} style={{ position: 'fixed', inset: 0, zIndex: 99970, display: 'flex', justifyContent: 'center', background: '#000', animation: saindo ? 'fcSai .45s both' : undefined, cursor: 'pointer' }}>
      <style>{css}</style>
      <div style={{ position: 'relative', width: '100%', maxWidth: pc ? '100%' : 480, height: '100%', overflow: 'hidden', background: `${c.bg}, url(${estadioArt}) center / cover`, color: '#fff', zoom: pc ? 1.35 : undefined } as CSSProperties}>
        <div style={{ position: 'absolute', inset: 0, background: `url(${estadioArt}) center / cover`, opacity: .35, mixBlendMode: 'overlay' }} />
        <Enfeite tipo={c.extra} />
        {conf.map((k, i) => <i key={i} style={{ position: 'absolute', left: `${k.l}%`, top: -20, width: 9, height: 14, borderRadius: 2, background: k.cor, transform: `rotate(${k.r}deg)`, animation: `fcCai ${k.dur}s ${k.d}s linear infinite` }} />)}
        <div style={{ position: 'absolute', top: '5%', left: 0, right: 0, textAlign: 'center', animation: 'tfZoom .5s both' }}>
          <small style={{ ...OSW, fontSize: 13, letterSpacing: '.3em', color: c.sub }}>{tr('Campeão', 'Champion')} · {tr(c.nome[0], c.nome[1])}</small>
          <b style={{ ...OSW, display: 'block', fontSize: nome.length > 14 ? 40 : 54, lineHeight: .95, padding: '0 12px', color: c.titulo, filter: 'drop-shadow(4px 4px 0 #000)' }}>{nome}</b>
        </div>
        <div style={{ position: 'absolute', top: '20%', left: 0, right: 0, display: 'flex', justifyContent: 'center', animation: 'fcSobe .6s .2s both' }}>
          <div style={{ animation: 'fcBrilho 1.6s .8s infinite' }}>{crest}</div>
        </div>
        <div style={{ position: 'absolute', top: '44%', left: 0, right: 0, display: 'flex', justifyContent: 'center', animation: 'fcSobe .6s .6s both' }}><Trofeu comp={comp} size={110} /></div>
        {vis.length > 0 && <div style={{ position: 'absolute', bottom: 108, left: 4, display: 'flex', animation: 'fcSobe .6s 1s both' }}>
          {vis.map(l => { const art = legendAvatar(l.nome, l.club, l.year); return art ? <img key={l.nome} src={art.src} alt={l.nome} style={{ width: 104, height: 150, objectFit: 'cover', objectPosition: 'center top', filter: 'drop-shadow(4px 4px 0 #000)' }} /> : null })}
        </div>}
        {mascote && <div style={{ position: 'absolute', bottom: 100, right: -10, width: 200, animation: 'tfEntraD .7s 1.2s both', filter: 'drop-shadow(5px 5px 0 #000)' }}>{mascote}</div>}
        <div style={{ position: 'absolute', left: pc ? 'calc(50% - 320px)' : 16, right: pc ? 'calc(50% - 320px)' : 16, bottom: 22, background: INK, border: `4px solid ${c.faixaBg}`, borderRadius: 18, padding: '10px 12px', boxShadow: '5px 5px 0 #000', textAlign: 'center', animation: 'fcSobe .5s 1.5s both' }}>
          <b style={{ ...OSW, display: 'block', fontSize: 24, color: c.faixaBg === '#FFFFFF' ? '#fff' : c.faixaBg, lineHeight: 1 }}>🏆 {tr(c.campeao[0], c.campeao[1])}</b>
          {linha && <small style={{ fontSize: 12.5, fontWeight: 700, color: '#ddd' }}>{linha}</small>}
          {(artilheiro || garcom) && <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
            {artilheiro && <span style={{ background: '#fff', color: INK, border: `2px solid ${c.faixaBg === '#FFFFFF' ? '#999' : c.faixaBg}`, borderRadius: 9, padding: '3px 8px', fontSize: 11.5, fontWeight: 800, lineHeight: 1.25 }}>⚽ {tr('Artilheiro', 'Top scorer')}: <b>{artilheiro.nome}</b> <span style={{ opacity: .6 }}>({artilheiro.time})</span> · {artilheiro.n} {artilheiro.n === 1 ? tr('gol', 'goal') : tr('gols', 'goals')}</span>}
            {garcom && <span style={{ background: '#fff', color: INK, border: `2px solid ${c.faixaBg === '#FFFFFF' ? '#999' : c.faixaBg}`, borderRadius: 9, padding: '3px 8px', fontSize: 11.5, fontWeight: 800, lineHeight: 1.25 }}>🅰️ {tr('Garçom', 'Top assists')}: <b>{garcom.nome}</b> <span style={{ opacity: .6 }}>({garcom.time})</span> · {garcom.n} {garcom.n === 1 ? tr('passe', 'assist') : tr('passes', 'assists')}</span>}
          </div>}
          <small style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#999', marginTop: 3 }}>{tr('toque pra continuar', 'tap to continue')}</small>
        </div>
      </div>
    </div>,
    document.body,
  )
}

// 🎨 SIMULAÇÃO COM A CARA DA COPA (23/10, mockup `simulacao-tema-copas-1/2.png`, "ok"). A tela continua a MESMA;
// quem está dentro deste contexto ganha: ① troféu + faixa na paleta (CompetitionStage) · ② relógio do placar na cor
// da copa (OnlineScorePresentation) · ③ cabeçalho/zonas da tabela · ④ a frase da copa no pé (`FraseCopa`).
// Só as salas e a partida rápida embrulham as telas com ele — a carreira não, então nada muda lá.
export const TemaCompCtx = createContext<CompId | null>(null)
export const useTemaComp = () => { const id = useContext(TemaCompCtx); return id ? { id, ...COMPS[id] } : null }
export function FraseCopa() {
  const t = useTemaComp()
  if (!t) return null
  return <div style={{ background: t.vsBg, color: t.vsInk, border: `3px solid ${INK}`, borderRadius: 12, boxShadow: `3px 3px 0 ${INK}`, ...OSW, fontSize: 14, letterSpacing: '.06em', textAlign: 'center', padding: '6px 10px', margin: '4px 0 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Trofeu comp={t.id} size={26} />{tr(t.frase[0], t.frase[1])}</div>
}
