// 🐊 MASCOTES DO SÓCIO + FESTÃO DO TÍTULO (aprovado pelo Diego 09/08 via GIF):
// a mascote é desenhada à mão (em código, tipo o escudo) e ATRAVESSA a tela
// quicando por cima da UI quando o dono é CAMPEÃO — pulão no meio, sombra,
// confete, ~4s, toque pula. SÓ o time campeão vê a própria festa (lei do som
// do martelo) e SÓ depois do apito (zero spoiler). A chave da mascote vem do
// esc_socios.mascote_key (Diego seta pelo painel).
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

const INK = '#0C0C0C'

// registro das mascotes prontas (chave → desenho). Cada sócio que pedir ganha
// a dele aqui — 1ª da casa: a alface brava do Alfacehh FC.
export const MASCOTES: Record<string, ReactNode> = {
  alface: (
    <svg width="120" height="164" viewBox="0 0 120 170">
      <g transform="translate(0,10)">
        <path d="M48 118 48 140 40 146 56 146 55 118 Z" fill={INK} />
        <path d="M72 118 72 140 80 146 64 146 65 118 Z" fill={INK} />
        <path d="M44 104 76 104 78 122 62 118 60 122 42 122 Z" fill="#141414" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <path d="M40 66 80 66 88 110 32 110 Z" fill="#2E9E5B" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <path d="M50 66 58 66 60 110 54 110 Z" fill="#141414" />
        <path d="M66 66 74 66 78 110 72 110 Z" fill="#141414" />
        <path d="M42 70 30 44 38 40 50 66" fill="#2E9E5B" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <path d="M78 70 90 44 82 40 70 66" fill="#2E9E5B" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <g stroke={INK} strokeWidth="4" strokeLinejoin="round">
          <ellipse cx="38" cy="34" rx="13" ry="15" fill="#2E9E5B" />
          <ellipse cx="82" cy="34" rx="13" ry="15" fill="#2E9E5B" />
          <ellipse cx="46" cy="18" rx="13" ry="14" fill="#41C07A" />
          <ellipse cx="74" cy="18" rx="13" ry="14" fill="#41C07A" />
          <circle cx="60" cy="34" r="24" fill="#7CD492" />
        </g>
        <path d="M44 26 56 31 M76 26 64 31" stroke={INK} strokeWidth="4" strokeLinecap="round" />
        <circle cx="52" cy="36" r="4.2" fill={INK} /><circle cx="68" cy="36" r="4.2" fill={INK} />
        <path d="M50 47 Q60 53 70 47" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />
      </g>
      <g stroke={INK} strokeWidth="3.5" strokeLinejoin="round">
        <path d="M48 8 72 8 70 22 Q60 32 50 22 Z" fill="#FFC400" />
        <path d="M48 10 40 10 44 22 50 20 M72 10 80 10 76 22 70 20" fill="#FFC400" />
        <rect x="56" y="30" width="8" height="6" fill="#FFC400" />
        <rect x="51" y="36" width="18" height="6" fill="#E8A200" />
      </g>
    </svg>
  ),
}

// 🎉 FESTÃO: overlay de ~4,2s por cima da tela de fim — versão viva do GIF.
// `nome` = time campeão · `mascote` = chave em MASCOTES. Toque pula.
export function FestaoMascote({ nome, mascote, onDone }: { nome: string; mascote: string; onDone: () => void }) {
  const [saindo, setSaindo] = useState(false)
  useEffect(() => {
    const t1 = setTimeout(() => setSaindo(true), 3800)
    const t2 = setTimeout(onDone, 4300)
    return () => { clearTimeout(t1); clearTimeout(t2) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const art = MASCOTES[mascote]
  if (!art) return null
  const conf = Array.from({ length: 26 }, (_, i) => ({
    x: (i * 137 + 40) % 100, dur: 2.2 + ((i * 79) % 100) / 70, delay: -((i * 211) % 200) / 100,
    w: 5 + (i % 3) * 2, cor: ['#FFC400', '#E8503A', '#7C3AED', '#41C07A', '#ffffff', '#2E7DD1'][i % 6], rot: (i * 47) % 360,
  }))
  return (
    <div onClick={onDone} style={{ position: 'fixed', inset: 0, zIndex: 99998, overflow: 'hidden', cursor: 'pointer', background: 'radial-gradient(circle at 50% 38%, #1F8C46, #0d3a1e 78%)', opacity: saindo ? 0 : 1, transition: 'opacity .45s' }}>
      <style>{`
        @keyframes fmRaios{0%{transform:translate(-50%,-50%) rotate(0)}100%{transform:translate(-50%,-50%) rotate(360deg)}}
        @keyframes fmCruza{0%{left:-24%}100%{left:104%}}
        @keyframes fmQuica{0%,100%{transform:translateY(0) rotate(-7deg) scaleY(.96)}50%{transform:translateY(-84px) rotate(7deg) scaleY(1.03)}}
        @keyframes fmConf{0%{top:-6%}100%{top:104%}}
        @keyframes fmPulsa{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
      `}</style>
      <div style={{ position: 'absolute', left: '50%', top: '40%', width: 900, height: 900, borderRadius: 999, animation: 'fmRaios 14s linear infinite', background: 'repeating-conic-gradient(rgba(255,196,0,.20) 0 14deg, transparent 14deg 30deg)' }} />
      {conf.map((c, i) => (
        <span key={i} style={{ position: 'absolute', left: `${c.x}%`, top: '-6%', width: c.w, height: c.w + 4, borderRadius: 2, background: c.cor, transform: `rotate(${c.rot}deg)`, animation: `fmConf ${c.dur}s linear ${c.delay}s infinite` }} />
      ))}
      <p style={{ position: 'relative', textAlign: 'center', marginTop: '13vh', fontFamily: 'Oswald, sans-serif', fontWeight: 900, fontSize: 42, color: '#FFC400', textTransform: 'uppercase', textShadow: `3px 3px 0 ${INK}`, letterSpacing: '.04em', lineHeight: 1, animation: 'fmPulsa 1.1s ease-in-out infinite' }}>🏆 Campeão!</p>
      <p style={{ position: 'relative', textAlign: 'center', marginTop: 6, fontFamily: 'Oswald, sans-serif', fontWeight: 800, fontSize: 17, color: '#fff', textTransform: 'uppercase', textShadow: '2px 2px 0 rgba(0,0,0,.7)' }}>{nome}</p>
      {/* 🥬 a mascote SOLTA: atravessa a tela quicando (7s = cruza ~1,7x na festa) */}
      <div style={{ position: 'absolute', bottom: '16vh', left: '-24%', animation: 'fmCruza 6.5s linear infinite' }}>
        <div style={{ animation: 'fmQuica .62s ease-in-out infinite' }}>{art}</div>
        <div style={{ width: 84, height: 12, borderRadius: 999, background: 'rgba(0,0,0,.3)', margin: '4px auto 0' }} />
      </div>
      <p style={{ position: 'absolute', bottom: '4vh', left: 0, right: 0, textAlign: 'center', fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.7)' }}>toque pra pular 👆</p>
    </div>
  )
}
