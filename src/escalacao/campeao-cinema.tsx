// 🏆 CAMPEÃO "CINEMA" (24/11, Diego aprovou o vídeo da Libertadores: *"agora eu gostei"* → *"pode fazer de todos aí… e coloca as
// artes também das copas que estão faltando"*). Tela cheia ~9 s em cima da tela de campeão de sempre:
//  1) escuro, a câmera anda devagar na ARTE da competição (cada copa tem a sua) com a frase de suspense;
//  2) clarão + o ESCUDO do campeão bate com o martelo (som do martelo que o jogo já tem) e solta a onda dourada;
//  3) título dourado brilhando + nome + fita nas cores do clube, lados da tela acesos nas cores e PAPEL PICADO de verdade (canvas);
//  4) as LENDAS do elenco sobem embaixo (a arte delas) e a MASCOTE entra pulando; quem não tem nenhuma das duas ganha o
//     "É CAMPEÃO! É CAMPEÃO!" balançando. Toque na tela = pula.
// Custo: zero no servidor (nenhuma mensagem nova; cada aparelho toca sozinho quando a tela de campeão aparece). As artes são
// arquivos separados (~30 KB) que só descem pra quem chega no fim DAQUELA competição. Euro, Copa América, regionais, Relâmpago e
// Kings ainda não têm arte própria: usam uma arte do jogo com cor e efeito próprios (raio, neon, fumaça) até a arte nova chegar. Só apresentação: não mexe em jogo/placar/save.
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { tr } from './lang'
import { playHammer } from './sound'
import { mantoDoClube } from './batismos'
import './campeao-cinema.css'
import artLiga from './img/online-estadio-v25.webp'
import artCopa8 from './img/online-copa8-v25.webp'
import artCopaBrasil from './img/carreira-copa-brasil-v25.webp'
import artSupercopa from './img/carreira-supercopa-v25.webp'
import artLiberta from './img/online-liberta-v25.webp'
import artChampions from './img/online-champions-v25.webp'
import artMundo from './img/online-mundial-v25.webp'
import artMundialClubes from './img/carreira-mundial-clubes-v1.webp'

export type TemaCampeao = 'liga' | 'copa8' | 'copabrasil' | 'supercopa' | 'liberta' | 'champions' | 'mundo' | 'mundialclubes' | 'euro' | 'america' | 'regional' | 'relampago' | 'kings'
type Tema = { art: string; filtro?: string; efeito?: 'raio' | 'neon' | 'fumaca'; intro: [string, string]; ttl: [string, string]; kick: [string, string]; c: [string, string] }
const TEMAS: Record<TemaCampeao, Tema> = {
  liga: { art: artLiga, intro: ['A taça espera o seu dono…', 'The trophy awaits its owner…'], ttl: ['É campeão!', 'Champions!'], kick: ['🏆 Campeão da liga', '🏆 League champions'], c: ['#1B7A3D', '#FFC400'] },
  copa8: { art: artCopa8, intro: ['Mata-mata não perdoa…', 'Knockouts show no mercy…'], ttl: ['Campeão da copa', 'Cup champions'], kick: ['🏆 Copa', '🏆 Cup'], c: ['#C2452F', '#FFC400'] },
  copabrasil: { art: artCopaBrasil, intro: ['O Brasil inteiro parou…', 'All of Brazil stopped…'], ttl: ['Campeão do Brasil', 'Champions of Brazil'], kick: ['🇧🇷 Copa do Brasil', '🇧🇷 Brazilian Cup'], c: ['#1B7A3D', '#FFC400'] },
  supercopa: { art: artSupercopa, intro: ['Campeão contra campeão…', 'Champion against champion…'], ttl: ['Supercampeão!', 'Super champions!'], kick: ['🏆 Supercopa', '🏆 Super Cup'], c: ['#7C3AED', '#FFC400'] },
  liberta: { art: artLiberta, intro: ['A taça espera o seu dono…', 'The trophy awaits its owner…'], ttl: ['Campeão da América', 'Champions of the Americas'], kick: ['🌎 Glória continental', '🌎 Continental glory'], c: ['#0E3E86', '#FFC400'] },
  champions: { art: artChampions, intro: ['A Europa está olhando…', 'Europe is watching…'], ttl: ['Campeão da Europa', 'Champions of Europe'], kick: ['⭐ Champions', '⭐ Champions'], c: ['#0D2A6B', '#ffffff'] },
  mundo: { art: artMundo, intro: ['O mundo inteiro está olhando…', 'The whole world is watching…'], ttl: ['Campeão do Mundo', 'World champions'], kick: ['🌐 Copa do Mundo', '🌐 World Cup'], c: ['#B8860B', '#FFC400'] },
  mundialclubes: { art: artMundialClubes, intro: ['Só sobrou um no planeta…', 'Only one left on the planet…'], ttl: ['Campeão do Mundo', 'World champions'], kick: ['🌐 Mundial de Clubes', '🌐 Club World Cup'], c: ['#B8860B', '#ffffff'] },
  euro: { art: artChampions, filtro: 'hue-rotate(-12deg) saturate(1.2)', intro: ['O continente parou…', 'The continent stopped…'], ttl: ['Campeão da Europa', 'Champions of Europe'], kick: ['🇪🇺 Eurocopa', '🇪🇺 Euro'], c: ['#0D2A6B', '#FFC400'] },
  america: { art: artLiberta, filtro: 'sepia(.25) saturate(1.3) hue-rotate(-8deg)', efeito: 'fumaca', intro: ['A América parou…', 'The Americas stopped…'], ttl: ['Campeão da América', 'Champions of the Americas'], kick: ['🌎 Copa América', '🌎 Copa América'], c: ['#4FA3E0', '#FFC400'] },
  regional: { art: artLiga, filtro: 'sepia(.35) saturate(1.25)', efeito: 'fumaca', intro: ['A cidade parou…', 'The whole town stopped…'], ttl: ['Campeão!', 'Champions!'], kick: ['🏟️ Copa regional', '🏟️ Regional cup'], c: ['#1B7A3D', '#E8503A'] },
  relampago: { art: artLiga, filtro: 'hue-rotate(210deg) saturate(1.4)', efeito: 'raio', intro: ['Um raio caiu na sala…', 'Lightning struck the room…'], ttl: ['Campeão relâmpago', 'Lightning champions'], kick: ['⚡ Mata-mata Relâmpago', '⚡ Lightning knockout'], c: ['#7C3AED', '#FFC400'] },
  kings: { art: artLiga, filtro: 'hue-rotate(250deg) saturate(1.5) contrast(1.1)', efeito: 'neon', intro: ['A coroa tem dono…', 'The crown has an owner…'], ttl: ['O rei da liga!', 'King of the league!'], kick: ['👑 Kings League', '👑 Kings League'], c: ['#111111', '#FFC400'] },
}

/** o tema pela competição escrita no título (as telas de campeão já mandam o nome dela); na dúvida, a liga */
export function temaDoTitulo(t: string): TemaCampeao {
  const s = t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  if (/libertadores/.test(s)) return 'liberta'
  if (/champions/.test(s)) return 'champions'
  if (/eurocopa|\beuro\b/.test(s)) return 'euro'
  if (/copa america/.test(s)) return 'america'
  if (/copa do mundo|world cup/.test(s)) return 'mundo'
  if (/mundial/.test(s)) return 'mundialclubes'
  if (/relampago|lightning/.test(s)) return 'relampago'
  if (/kings/.test(s)) return 'kings'
  if (/supercopa|super cup/.test(s)) return 'supercopa'
  if (/copa do brasil|brazilian cup/.test(s)) return 'copabrasil'
  if (/copa|cup/.test(s)) return 'copa8'
  return 'liga'
}

const vistos = new Set<string>() // uma vez por título por página (voltar pra tela não repete; recarregar, sim)
export const CAMPEAO_CINEMA_MS = 9600
const DURACAO = CAMPEAO_CINEMA_MS
// 🎞️ fila: a tela final pode mostrar o campeão da LIGA e o da COPA juntos — um toca depois do outro, nunca os dois por cima
const fila: string[] = []
const ouvintes = new Set<() => void>()
const avisa = () => ouvintes.forEach(f => f())

export function CampeaoCinema({ chave, tema, nome, crest, retratos, mascote, onDone }: {
  chave: string; tema: TemaCampeao; nome: string; crest?: ReactNode; retratos: string[]; mascote?: ReactNode; onDone?:()=>void
}) {
  const [meu] = useState(() => { if (vistos.has(chave)) return false; vistos.add(chave); fila.push(chave); return true }) // marca já no 1º desenho: duas telas montando juntas não tocam duas vezes
  const [vez, setVez] = useState(() => fila[0] === chave)
  const [acabou, setAcabou] = useState(false)
  useEffect(() => { if (!meu) return; const f = () => setVez(fila[0] === chave); ouvintes.add(f); f(); return () => { ouvintes.delete(f); const i = fila.indexOf(chave); if (i >= 0) { fila.splice(i, 1); avisa() } } }, [meu, chave])
  const ativo = meu && vez && !acabou
  const doneRef=useRef(onDone);doneRef.current=onDone
  const completed=useRef(false)
  const setAtivo=useCallback((v:boolean)=>{if(v||completed.current)return;completed.current=true;setAcabou(true);const i=fila.indexOf(chave);if(i>=0){fila.splice(i,1);avisa()}doneRef.current?.()},[chave])
  useEffect(()=>{if(!meu&&!completed.current){completed.current=true;doneRef.current?.()}},[meu])
  const cv = useRef<HTMLCanvasElement>(null)
  const T = TEMAS[tema]
  const [c1, c2] = mantoDoClube(nome) ?? T.c
  useEffect(() => {
    if (!ativo) return
    const bate = setTimeout(() => { try { playHammer() } catch { /* som é enfeite */ } }, 3000)
    const fim = setTimeout(() => setAtivo(false), DURACAO)
    return () => { clearTimeout(bate); clearTimeout(fim) }
  }, [ativo, chave])
  useEffect(() => {
    if (!ativo) return
    const el = cv.current, x = el?.getContext('2d')
    if (!el || !x) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const W = (el.width = innerWidth * dpr), H = (el.height = innerHeight * dpr)
    const cores = [c1, c2, '#FFC400', '#ffffff']
    const P: { x: number; y: number; vx: number; vy: number; r: number; vr: number; w: number; h: number; c: string }[] = []
    const solta = (n: number) => { for (let i = 0; i < n; i++) P.push({ x: Math.random() * W, y: -20 - Math.random() * H * 0.5, vx: (Math.random() - 0.5) * 3 * dpr, vy: (2 + Math.random() * 4) * dpr, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3, w: (6 + Math.random() * 6) * dpr, h: (4 + Math.random() * 4) * dpr, c: cores[i % cores.length] }) }
    const t0 = performance.now(); let raf = 0, soltou = 0
    const loop = (t: number) => {
      const dt = (t - t0) / 1000
      if (dt > 3.1 && soltou === 0) { soltou = 1; solta(160) }
      if (dt > 4.6 && soltou === 1) { soltou = 2; solta(100) }
      if (dt > 6.2 && soltou === 2) { soltou = 3; solta(100) }
      x.clearRect(0, 0, W, H)
      for (const p of P) {
        if (p.y > H + 30) continue
        p.x += p.vx + Math.sin(t / 400 + p.r) * 1.2; p.y += p.vy; p.r += p.vr
        const k = Math.abs(Math.cos(p.r * 2))
        x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.w / 2, (-p.h / 2) * k, p.w, p.h * k + 1); x.restore()
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [ativo, c1, c2])
  if (!ativo) return null
  const temCena = retratos.length > 0 || !!mascote
  return createPortal(
    <div className="cc-cinema" role="dialog" aria-label={tr('Comemoração do campeão', 'Champion celebration')} onClick={() => setAtivo(false)}
      style={{ ['--c1' as string]: c1, ['--c2' as string]: c2 }}>
      <div className="cc-bg" style={{ backgroundImage: `url(${T.art})`, ['--cc-filtro' as string]: T.filtro ?? 'none' }} />
      {T.efeito && <div className={`cc-efeito ${T.efeito}`} />}
      <div className="cc-veu" />
      <div className="cc-lado e" /><div className="cc-lado d" />
      <div className="cc-intro">{tr(...T.intro)}<b>{tr(...T.kick)}</b></div>
      <div className="cc-flash" />
      <div className="cc-onda" />
      <div className="cc-esc">{crest}</div>
      <div className="cc-txt">
        <div className="cc-kick">{tr(...T.kick)}</div>
        <div className="cc-ttl">{tr(...T.ttl)}</div>
        <div className="cc-nome">{nome}</div>
        <div className="cc-fita" />
      </div>
      {retratos.length > 0 && <div className="cc-lendas">{retratos.slice(0, 3).map((src, i) => <img key={src} src={src} alt="" className={`n${i}`} />)}</div>}
      {mascote && <div className="cc-masc">{mascote}</div>}
      {!temCena && <div className="cc-canto"><span>{tr('📣 É CAMPEÃO! É CAMPEÃO! 🔥', '📣 CHAMPIONS! CHAMPIONS! 🔥')}</span></div>}
      <canvas ref={cv} className="cc-papel" />
      <button type="button" className="cc-pular" onClick={e => { e.stopPropagation(); setAtivo(false) }}>{tr('Pular ›', 'Skip ›')}</button>
    </div>,
    document.body,
  )
}
