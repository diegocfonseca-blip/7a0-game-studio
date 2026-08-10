// 🐊 MASCOTES DO SÓCIO + FESTÃO DO TÍTULO (aprovado pelo Diego 09/08 via GIF):
// a mascote é desenhada à mão (em código, tipo o escudo) e ATRAVESSA a tela
// quicando por cima da UI quando o dono é CAMPEÃO — pulão no meio, sombra,
// confete, ~4s, toque pula. SÓ o time campeão vê a própria festa (lei do som
// do martelo) e SÓ depois do apito (zero spoiler). A chave da mascote vem do
// esc_socios.mascote_key (Diego seta pelo painel).
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import tokaMascoteImg from './img/toka10-mascote.webp'

const INK = '#0C0C0C'

// registro das mascotes prontas (chave → desenho). Cada sócio que pedir ganha
// a dele aqui — 1ª da casa: a alface brava do Alfacehh FC.
export const MASCOTES: Record<string, ReactNode> = {
  // 🧢 o MENINO DA TOUCA (Tôka10 — ofc.toka10, aprovado 10/08): arte própria do
  // dono em imagem (webp 15 KB, exceção aprovada — ver nota em escudos.tsx).
  // Corpo inteiro: touca azul, oclinhos, piscadinha, joinha, camisa 10 e bola.
  toka: (
    <img
      src={tokaMascoteImg}
      height={176}
      width={92}
      alt="Tôka10"
      style={{ flex: 'none', display: 'block', objectFit: 'contain' }}
    />
  ),
  // 🐓🌙 o GALO BALADEIRO (Nightfull FC — guilhermevictor539, aprovado 09/08):
  // alvinegro de óculos escuro, corrente de ouro e pose Travolta da night.
  galo: (
    <svg width="126" height="176" viewBox="0 0 120 170">
      <g transform="translate(0,4)">
        <ellipse cx="60" cy="158" rx="42" ry="9" fill="rgba(0,0,0,.15)" />
        <circle cx="90" cy="146" r="12" fill="#fff" stroke={INK} strokeWidth="4" />
        <path d="M90 138 l4 5 -1 6 h-6 l-1 -6 Z" fill={INK} />
        <path d="M50 126 l-2 18 M68 126 l2 18" stroke="#E8A200" strokeWidth="6" strokeLinecap="round" />
        <path d="M42 146 l10 2 M64 146 l12 2 M46 140 l-6 2" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
        <path d="M74 92 Q104 68 108 44 Q112 66 96 88 Z" fill="#141414" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <path d="M76 100 Q112 88 122 66 Q120 94 96 108 Z" fill="#2b2b2b" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <path d="M40 88 74 88 78 128 38 128 Z" fill="#141414" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <path d="M50 88 l2 40 M64 88 l2 40" stroke="#ffffff" strokeWidth="6" />
        <path d="M70 92 Q86 74 88 56 L82 58 Q86 46 92 40 L96 52 Q98 60 92 72 Q86 84 76 94 Z" fill="#141414" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <path d="M92 40 l2 -10" stroke={INK} strokeWidth="4" strokeLinecap="round" />
        <path d="M42 96 Q30 102 36 114 L46 112" fill="#141414" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <path d="M44 90 Q58 100 70 90" stroke="#FFC400" strokeWidth="4" fill="none" strokeLinecap="round" />
        <circle cx="57" cy="97" r="4" fill="#FFC400" stroke={INK} strokeWidth="2.5" />
        <path d="M34 56 Q36 38 54 34 Q74 30 80 46 Q86 60 80 72 Q72 86 54 86 Q38 84 34 70 Z" fill="#141414" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <path d="M38 38 Q32 22 46 26 Q46 12 60 22 Q64 8 74 22 Q82 16 80 32 L72 44 Z" fill="#E8503A" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M32 60 L14 66 L32 72 Z" fill="#E8A200" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M36 74 q-6 12 3 16 q8 3 10 -6 q-6 -3 -13 -10 Z" fill="#E8503A" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <path d="M36 50 Q36 44 44 44 L68 46 Q76 47 74 54 Q73 62 64 62 L44 60 Q36 59 36 50 Z" fill="#0C0C0C" stroke={INK} strokeWidth="3" />
        <path d="M70 48 L82 44" stroke={INK} strokeWidth="4" strokeLinecap="round" />
        <path d="M42 49 L60 51" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" opacity=".8" />
      </g>
    </svg>
  ),
  // 🐦 a gralha-azul da MARRA (Manfré FC — danielmanfre5, aprovada 09/08 v2):
  // molde da referência paranista — cabeçona em gota, bicão vermelho, camisa
  // metade/metade, mão na cintura e pé na bola.
  gralha: (
    <svg width="126" height="176" viewBox="0 0 120 170">
      <g transform="translate(0,4)">
        <ellipse cx="58" cy="158" rx="42" ry="9" fill="rgba(0,0,0,.15)" />
        <circle cx="36" cy="146" r="13" fill="#fff" stroke={INK} strokeWidth="4" />
        <path d="M36 137 l5 6 -2 7 h-6 l-2 -7 Z" fill={INK} />
        <path d="M66 128 L68 148" stroke="#cfd6dd" strokeWidth="7" strokeLinecap="round" />
        <path d="M62 148 l4 8 14 -2 -6 -8 Z" fill="#141414" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <path d="M50 128 Q44 132 40 136" stroke="#cfd6dd" strokeWidth="7" strokeLinecap="round" />
        <path d="M28 132 q8 -4 14 2 l-4 8 q-8 -2 -12 -6 Z" fill="#141414" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <path d="M42 110 74 110 76 130 60 126 58 130 40 130 Z" fill="#ffffff" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M40 78 76 78 78 114 38 114 Z" fill="#C2452F" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <path d="M58 78 76 78 78 114 58 114 Z" fill="#0E3E86" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <path d="M40 84 Q26 92 34 106 L44 104" fill="#2E6FB0" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <path d="M76 84 Q90 92 82 106 L72 104" fill="#2E6FB0" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <path d="M50 76 Q34 66 30 48 Q28 30 44 20 Q58 12 74 16 L94 6 L82 24 L104 20 L86 34 Q90 48 78 62 Q66 76 50 76 Z" fill="#2E6FB0" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <path d="M40 46 Q20 46 8 54 Q22 62 40 58 Q46 56 44 50 Z" fill="#C2452F" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M14 58 Q26 66 42 62" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M40 62 Q30 68 22 66 Q30 72 42 68 Z" fill="#A33325" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <path d="M38 34 L52 40 M68 32 L56 40" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
        <circle cx="48" cy="44" r="6" fill="#fff" stroke={INK} strokeWidth="3" />
        <circle cx="61" cy="42" r="6" fill="#fff" stroke={INK} strokeWidth="3" />
        <circle cx="49" cy="45" r="2.6" fill={INK} /><circle cx="62" cy="43" r="2.6" fill={INK} />
      </g>
    </svg>
  ),
  // 💇‍♂️ o boleiro do MOICANO (Neymarzetti — Diego, aprovado 09/08 v5): perfil
  // driblando, crista preto+loiro, camisa 11, meião branco, bota amarela.
  moicano: (
    <svg width="126" height="178" viewBox="0 0 120 170">
      <g transform="translate(0,4)">
        <ellipse cx="56" cy="158" rx="42" ry="9" fill="rgba(0,0,0,.15)" />
        <circle cx="30" cy="148" r="12" fill="#fff" stroke={INK} strokeWidth="4" />
        <path d="M30 140 l5 5 -2 7 h-6 l-2 -7 Z" fill={INK} />
        <path d="M64 114 Q69 122 72 128" stroke="#E8B98A" strokeWidth="8" fill="none" strokeLinecap="round" />
        <path d="M71 126 L78 143" stroke={INK} strokeWidth="11" strokeLinecap="round" />
        <path d="M71 126 L78 143" stroke="#ffffff" strokeWidth="6.5" strokeLinecap="round" />
        <path d="M74 140 l0 10 14 1 -3 -9 Z" fill="#FFC400" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M50 114 Q46 120 44 125" stroke="#E8B98A" strokeWidth="8" fill="none" strokeLinecap="round" />
        <path d="M44 124 L38 137" stroke={INK} strokeWidth="11" strokeLinecap="round" />
        <path d="M44 124 L38 137" stroke="#ffffff" strokeWidth="6.5" strokeLinecap="round" />
        <path d="M30 132 l-6 6 12 8 5 -8 Z" fill="#FFC400" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M44 98 72 98 74 118 58 114 56 118 42 116 Z" fill="#ffffff" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M46 64 76 68 74 102 42 98 Z" fill="#ffffff" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <text x="52" y="92" fontFamily="Oswald, sans-serif" fontWeight="900" fontSize="17" fill={INK}>11</text>
        <path d="M48 70 Q34 76 28 88" stroke="#E8B98A" strokeWidth="6" fill="none" strokeLinecap="round" />
        <circle cx="27" cy="90" r="4.5" fill="#E8B98A" stroke={INK} strokeWidth="3" />
        <path d="M74 72 Q86 80 88 92" stroke="#E8B98A" strokeWidth="6" fill="none" strokeLinecap="round" />
        <circle cx="89" cy="94" r="4.5" fill="#E8B98A" stroke={INK} strokeWidth="3" />
        <g transform="translate(16,-10) scale(0.42)">
          <path d="M76 100 C70 108 67 114 64 120 L56 134 Q54 138 58 140 L64 142 Q57 146 61 149 Q53 155 64 158 Q56 163 66 165 Q62 171 74 172 Q88 176 102 174 Q112 172 117 166 L122 176 L138 176 Q146 148 148 130 Q148 102 124 92 Q98 82 76 100 Z" fill="#E8B98A" stroke={INK} strokeWidth="7" strokeLinejoin="round" />
          <path d="M72 102 L64 58 L80 82 L84 36 L98 74 L106 30 L116 72 L128 40 L132 76 L146 58 L146 94 L156 112 L152 146 L142 138 L146 162 L134 150 Q140 116 122 104 Q100 92 72 102 Z" fill="#0C0C0C" />
          <path d="M70 84 L64 58 L80 82 L84 36 L98 74 L106 30 L116 72 L128 40 L132 76 L146 58 L146 94 L156 112 L151 132 L146 124 Q138 102 120 92 Q98 82 70 84 Z" fill="#F2C14E" />
          <path d="M60 116 L84 109" stroke={INK} strokeWidth="6" strokeLinecap="round" />
          <path d="M64 126 q9 -5 16 -1 q-7 6 -16 1 Z" fill="#fff" stroke={INK} strokeWidth="3.5" />
          <circle cx="71" cy="125" r="3.4" fill={INK} />
          <circle cx="60" cy="139" r="2.6" fill={INK} />
          <path d="M58 152 q10 7 20 2" stroke={INK} strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <path d="M59 151 q10 6 18 3 l-3 6 q-10 2 -15 -9 Z" fill="#fff" stroke={INK} strokeWidth="2.8" strokeLinejoin="round" />
          <path d="M104 126 l8 -3 3 16 -7 2 Z" fill="#0C0C0C" opacity=".85" />
          <path d="M112 136 q10 -6 12 4 q2 10 -8 12 q-6 1 -8 -6" fill="#E8B98A" stroke={INK} strokeWidth="5" />
          <circle cx="115" cy="158" r="6.5" fill="#ffffff" stroke={INK} strokeWidth="4" />
        </g>
      </g>
    </svg>
  ),
  // 🦋 mariposa-da-seda NERVOSA do Xurupitas FC (Davi Santana, aprovada 09/08):
  // inteira (asas de cima + de baixo com caudinha) — no festão ela "voa".
  mariposa: (
    <svg width="140" height="168" viewBox="0 0 200 240">
      <g transform="translate(0,10)">
        <path d="M96 104 C70 70 40 56 28 62 C18 88 30 128 58 140 C72 146 86 138 94 128 Z" fill="#7CD492" stroke={INK} strokeWidth="6" strokeLinejoin="round" />
        <path d="M104 104 C130 70 160 56 172 62 C182 88 170 128 142 140 C128 146 114 138 106 128 Z" fill="#7CD492" stroke={INK} strokeWidth="6" strokeLinejoin="round" />
        <path d="M94 130 C76 142 62 162 64 180 C66 194 76 200 84 192 Q80 206 90 210 C98 200 100 170 98 146 Z" fill="#9FE0AE" stroke={INK} strokeWidth="6" strokeLinejoin="round" />
        <path d="M106 130 C124 142 138 162 136 180 C134 194 124 200 116 192 Q120 206 110 210 C102 200 100 170 102 146 Z" fill="#9FE0AE" stroke={INK} strokeWidth="6" strokeLinejoin="round" />
        <g fill="#14401f"><ellipse cx="46" cy="86" rx="4" ry="6" /><ellipse cx="60" cy="112" rx="3.5" ry="5" /><ellipse cx="76" cy="92" rx="3" ry="4.5" /><ellipse cx="154" cy="86" rx="4" ry="6" /><ellipse cx="140" cy="112" rx="3.5" ry="5" /><ellipse cx="124" cy="92" rx="3" ry="4.5" /><ellipse cx="78" cy="168" rx="3" ry="4.5" /><ellipse cx="122" cy="168" rx="3" ry="4.5" /></g>
        <path d="M40 76 q14 16 24 40 M160 76 q-14 16 -24 40" stroke="#2E9E5B" strokeWidth="3.5" fill="none" />
        <ellipse cx="100" cy="140" rx="9" ry="12" fill="#EAF7E3" stroke={INK} strokeWidth="5" />
        <ellipse cx="100" cy="120" rx="11" ry="14" fill="#EAF7E3" stroke={INK} strokeWidth="5" />
        <ellipse cx="100" cy="100" rx="12" ry="13" fill="#ffffff" stroke={INK} strokeWidth="5" />
        <path d="M88 72 C74 56 58 48 46 50 C50 62 66 74 84 78 Z" fill="#1B7A3D" stroke={INK} strokeWidth="4.5" strokeLinejoin="round" />
        <path d="M112 72 C126 56 142 48 154 50 C150 62 134 74 116 78 Z" fill="#1B7A3D" stroke={INK} strokeWidth="4.5" strokeLinejoin="round" />
        <circle cx="100" cy="78" r="16" fill="#EAF7E3" stroke={INK} strokeWidth="5" />
        <circle cx="92" cy="80" r="7.5" fill={INK} /><circle cx="108" cy="80" r="7.5" fill={INK} />
        <circle cx="94.5" cy="77.5" r="2.2" fill="#fff" /><circle cx="110.5" cy="77.5" r="2.2" fill="#fff" />
        <path d="M78 65 L96 74 M122 65 L104 74" stroke={INK} strokeWidth="6.5" strokeLinecap="round" />
        <path d="M93 92 q7 -6 14 0" stroke={INK} strokeWidth="4.5" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  ),
  // 🦊 raposa azul do La Bestia Negra (Elton) — cara IGUAL à do escudo (pedido
  // do Diego 09/08): orelhão com miolo preto, bigodinho, focinho creme.
  raposa: (
    <svg width="120" height="164" viewBox="0 0 120 170">
      <g transform="translate(0,6)">
        <path d="M88 110 q26 -6 24 -34 q14 30 -8 50 q-12 10 -22 4 Z" fill="#1B62C9" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <path d="M108 82 q8 16 -4 32 l-10 -8 q10 -10 8 -22 Z" fill="#F4ECD6" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M48 118 48 140 40 146 56 146 55 118 Z" fill={INK} />
        <path d="M72 118 72 140 80 146 64 146 65 118 Z" fill={INK} />
        <path d="M44 104 76 104 78 122 62 118 60 122 42 122 Z" fill="#141414" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <path d="M40 66 80 66 88 110 32 110 Z" fill="#0E3E86" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <path d="M52 66 68 66 66 84 60 90 54 84 Z" fill="#F4ECD6" stroke={INK} strokeWidth="3" />
        <path d="M42 70 L28 46 L36 40 L50 66" fill="#0E3E86" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <path d="M78 70 L92 46 L84 40 L70 66" fill="#0E3E86" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <circle cx="32" cy="42" r="7" fill="#1B62C9" stroke={INK} strokeWidth="3.5" />
        <circle cx="88" cy="42" r="7" fill="#1B62C9" stroke={INK} strokeWidth="3.5" />
        <g transform="translate(2,-26.7) scale(0.58)">
          <path d="M64 58 L80 88 L52 92 Z M136 58 L120 88 L148 92 Z" fill="#1B62C9" stroke={INK} strokeWidth="7" strokeLinejoin="round" />
          <path d="M70 66 L78 84 L60 86 Z M130 66 L122 84 L140 86 Z" fill={INK} />
          <path d="M62 88 Q100 72 138 88 L144 108 L128 118 L138 128 Q120 158 100 164 Q80 158 62 128 L72 118 L56 108 Z" fill="#1B62C9" stroke={INK} strokeWidth="7" strokeLinejoin="round" />
          <path d="M100 132 q-16 -4 -24 8 q10 20 24 24 q14 -4 24 -24 q-8 -12 -24 -8 Z" fill="#F4ECD6" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
          <circle cx="84" cy="110" r="7" fill={INK} /><circle cx="116" cy="110" r="7" fill={INK} />
          <path d="M100 152 l-9 -11 h18 Z" fill={INK} />
          <path d="M70 126 l-12 -3 M70 132 l-11 3 M130 126 l12 -3 M130 132 l11 3" stroke={INK} strokeWidth="4" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  ),
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
