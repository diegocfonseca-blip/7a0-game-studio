// ─── 🛡️ ESCUDOS DOS CLUBES — desenhados POR CÓDIGO (peso ZERO no servidor) ──
// Mockup aprovado pelo Diego (04/08). Nada de imagem baixada: o brasão nasce do
// NOME do time. O gerador lê as palavras ("Sertão" → cacto, "meias" → par de
// meias, "fogo" → labareda); sem palavra conhecida, cai num sorteio FIXO do nome
// (mesmo escudo em todo aparelho, pra sempre). Serve os ~134 times do jogo E
// qualquer time de batismo que o usuário inventar, sem custo nenhum.
//
// ⚠️ REGRA DE SEGURANÇA (decisão do Diego): paródia de clube real NUNCA vira
// cópia. "Flamengo do Sertão" lê «Sertão» (cacto), não «Flamengo» — escudo de
// clube profissional é marca registrada e não entra aqui de jeito nenhum.
//
// 💰 LOGO ARTESANAL: quem paga entra em LOGOS_PRONTAS (nome → desenho próprio) e
// passa na frente do automático. É só acrescentar no mapa lá embaixo.
import type { ReactNode } from 'react'

const INK = '#0C0C0C'

// ─── paleta (só cores da identidade do jogo) ──────────────────────────────
// [fundo, detalhe] — fundo sempre escuro/saturado, detalhe sempre claro.
const PALETAS: [string, string][] = [
  ['#1B7A3D', '#FFC400'], // verde + ouro
  ['#C2452F', '#F4ECD6'], // vermelho + creme
  ['#0E3E86', '#F4ECD6'], // azul + creme
  ['#7C3AED', '#FFC400'], // roxo + ouro
  ['#0C0C0C', '#FFC400'], // preto + ouro
  ['#C1571F', '#FFC400'], // laranja terra + ouro
  ['#14401f', '#8BD44A'], // verde escuro + verde claro
  ['#8f2a1c', '#F4ECD6'], // vinho + creme
  ['#17808c', '#F4ECD6'], // azul-petróleo + creme
  ['#7a4a1e', '#FFC400'], // marrom + ouro
  ['#2b2d6e', '#8BD44A'], // azul-noite + verde
  ['#B23A2A', '#FFC400'], // telha + ouro
]

// ─── formatos do escudo ───────────────────────────────────────────────────
const SHAPES: string[] = [
  'M18 30 H182 V145 C182 188 138 214 100 234 C62 214 18 188 18 145 Z',              // clássico
  'M100 22 L182 46 V142 C182 184 140 210 100 230 C60 210 18 184 18 142 V46 Z',      // pontudo
  'M100 20 A92 92 0 1 1 99.9 20 Z',                                                  // redondo
  'M26 34 H174 A12 12 0 0 1 186 46 V138 C186 182 140 212 100 232 C60 212 14 182 14 138 V46 A12 12 0 0 1 26 34 Z', // ombro reto
]

// ─── padrões de fundo (dentro do escudo, recortados) ──────────────────────
function padrao(i: number, c2: string): ReactNode {
  switch (i) {
    case 1: return <> {/* listras */}
      <rect x="42" y="10" width="24" height="240" fill={c2} />
      <rect x="134" y="10" width="24" height="240" fill={c2} />
    </>
    case 2: return <rect x="0" y="112" width="200" height="34" fill={c2} /> // faixa
    case 3: return <path d="M-20 250 L210 20 v40 L20 250 Z" fill={c2} opacity=".9" /> // diagonal
    case 4: return <rect x="100" y="0" width="110" height="250" fill={c2} opacity=".35" /> // meio a meio
    case 5: return <> {/* aro */}
      <circle cx="100" cy="122" r="76" fill="none" stroke={c2} strokeWidth="9" />
    </>
    case 6: return <> {/* ondas no pé */}
      <path d="M-10 176 q40 -22 80 0 t80 0 t80 0 V250 H-10 Z" fill={c2} opacity=".55" />
      <path d="M-10 196 q40 -22 80 0 t80 0 t80 0 V250 H-10 Z" fill={c2} opacity=".8" />
    </>
    default: return null // liso
  }
}

// ─── 🎨 os símbolos (paths simples, borda preta grossa — estilo do jogo) ───
// Cada um desenha dentro de ~(60..140, 58..165). `d` = cor do detalhe.
const SIM: Record<string, (d: string) => ReactNode> = {
  trem: d => <>
    <rect x="52" y="92" width="96" height="52" rx="9" fill={d} stroke={INK} strokeWidth="6" />
    <rect x="64" y="102" width="28" height="22" rx="4" fill={INK} />
    <rect x="104" y="102" width="28" height="22" rx="4" fill={INK} />
    <rect x="118" y="66" width="22" height="28" rx="4" fill={d} stroke={INK} strokeWidth="6" />
    <circle cx="74" cy="152" r="13" fill={d} stroke={INK} strokeWidth="6" />
    <circle cx="126" cy="152" r="13" fill={d} stroke={INK} strokeWidth="6" />
  </>,
  estrela: d => <path d="M100 52 L117 102 L169 102 L127 133 L143 184 L100 153 L57 184 L73 133 L31 102 L83 102 Z" fill={d} stroke={INK} strokeWidth="6" strokeLinejoin="round" />,
  coroa: d => <>
    <path d="M50 148 L44 78 L74 104 L100 60 L126 104 L156 78 L150 148 Z" fill={d} stroke={INK} strokeWidth="6" strokeLinejoin="round" />
    <rect x="48" y="148" width="104" height="20" rx="7" fill={d} stroke={INK} strokeWidth="6" />
  </>,
  leao: d => <>
    <circle cx="100" cy="116" r="52" fill={d} stroke={INK} strokeWidth="6" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map(a => <circle key={a} cx={100 + 52 * Math.cos(a * Math.PI / 180)} cy={116 + 52 * Math.sin(a * Math.PI / 180)} r="17" fill={d} stroke={INK} strokeWidth="6" />)}
    <circle cx="100" cy="116" r="38" fill={d} stroke={INK} strokeWidth="5" />
    <circle cx="86" cy="108" r="6" fill={INK} /><circle cx="114" cy="108" r="6" fill={INK} />
    <path d="M92 126 h16 l-8 9 Z" fill={INK} />
    <path d="M86 140 q14 10 28 0" stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" />
  </>,
  aguia: d => <>
    <path d="M100 78 L36 108 q26 6 34 20 L62 132 q22 4 30 18 L100 168 l8-18 q8-14 30-18 l-8-4 q8-14 34-20 Z" fill={d} stroke={INK} strokeWidth="6" strokeLinejoin="round" />
    <circle cx="100" cy="70" r="16" fill={d} stroke={INK} strokeWidth="6" />
    <path d="M112 66 l16 6 -16 6 Z" fill={INK} />
    <circle cx="98" cy="66" r="4" fill={INK} />
  </>,
  onca: d => <>
    <path d="M56 84 L70 62 L86 78 h28 l16-16 14 22 q12 16 12 34 a48 40 0 0 1 -96 0 q0-18 12-36 Z" fill={d} stroke={INK} strokeWidth="6" strokeLinejoin="round" />
    <circle cx="84" cy="112" r="6" fill={INK} /><circle cx="116" cy="112" r="6" fill={INK} />
    <path d="M92 132 h16 l-8 8 Z" fill={INK} />
    <path d="M84 144 q16 10 32 0" stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" />
    <g fill={INK} opacity=".55"><circle cx="66" cy="98" r="4" /><circle cx="134" cy="98" r="4" /><circle cx="70" cy="130" r="4" /><circle cx="130" cy="130" r="4" /></g>
  </>,
  touro: d => <>
    <path d="M46 74 q-8 34 18 48 M154 74 q8 34 -18 48" stroke={INK} strokeWidth="17" fill="none" strokeLinecap="round" />
    <path d="M46 74 q-8 34 18 48 M154 74 q8 34 -18 48" stroke={d} strokeWidth="9" fill="none" strokeLinecap="round" />
    <path d="M66 108 h68 q10 0 10 12 v20 a44 34 0 0 1 -88 0 v-20 q0-12 10-12 Z" fill={d} stroke={INK} strokeWidth="6" strokeLinejoin="round" />
    <circle cx="84" cy="126" r="5.5" fill={INK} /><circle cx="116" cy="126" r="5.5" fill={INK} />
    <ellipse cx="100" cy="152" rx="17" ry="12" fill={INK} opacity=".5" />
  </>,
  cavalo: d => <>
    <path d="M74 168 V116 q0-26 22-38 l6-22 14 10 20 4 -10 14 q16 10 16 30 v54 Z" fill={d} stroke={INK} strokeWidth="6" strokeLinejoin="round" />
    <path d="M96 56 l-4-16 12 10 Z" fill={d} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
    <circle cx="112" cy="82" r="5" fill={INK} />
  </>,
  cobra: d => <>
    <path d="M62 164 q40 0 40-24 t-40-24 q-40 0 -40-22 t44-18" fill="none" stroke={INK} strokeWidth="22" strokeLinecap="round" />
    <path d="M62 164 q40 0 40-24 t-40-24 q-40 0 -40-22 t44-18" fill="none" stroke={d} strokeWidth="12" strokeLinecap="round" />
    <circle cx="112" cy="76" r="17" fill={d} stroke={INK} strokeWidth="6" />
    <circle cx="118" cy="72" r="4" fill={INK} />
    <path d="M128 80 l16 6 -16 2" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />
  </>,
  peixe: d => <>
    <path d="M64 118 q34-38 74 0 q-40 38 -74 0 Z" fill={d} stroke={INK} strokeWidth="6" strokeLinejoin="round" />
    <path d="M64 118 l-26-22 v44 Z" fill={d} stroke={INK} strokeWidth="6" strokeLinejoin="round" />
    <circle cx="120" cy="112" r="5" fill={INK} />
    <path d="M74 146 q26 22 52 0" stroke={d} strokeWidth="7" fill="none" strokeLinecap="round" opacity=".8" />
  </>,
  arvore: d => <>
    <path d="M92 172 V128 h16 v44 Z" fill={INK} />
    <circle cx="100" cy="98" r="42" fill={d} stroke={INK} strokeWidth="6" />
    <circle cx="66" cy="116" r="24" fill={d} stroke={INK} strokeWidth="6" />
    <circle cx="134" cy="116" r="24" fill={d} stroke={INK} strokeWidth="6" />
    <circle cx="100" cy="98" r="42" fill={d} />
  </>,
  cacto: d => <>
    <g stroke={INK} strokeWidth="16" strokeLinecap="round" fill="none">
      <path d="M100 176 V72" /><path d="M76 112 V128 Q76 141 91 141" /><path d="M124 96 V122 Q124 135 109 135" />
    </g>
    <g stroke={d} strokeWidth="8" strokeLinecap="round" fill="none">
      <path d="M100 176 V72" /><path d="M76 112 V128 Q76 141 91 141" /><path d="M124 96 V122 Q124 135 109 135" />
    </g>
  </>,
  sol: d => <>
    {Array.from({ length: 12 }, (_, i) => i * 30).map(a => <path key={a} d={`M100 116 l${52 * Math.cos(a * Math.PI / 180)} ${52 * Math.sin(a * Math.PI / 180)}`} stroke={INK} strokeWidth="13" strokeLinecap="round" />)}
    {Array.from({ length: 12 }, (_, i) => i * 30).map(a => <path key={a} d={`M100 116 l${50 * Math.cos(a * Math.PI / 180)} ${50 * Math.sin(a * Math.PI / 180)}`} stroke={d} strokeWidth="6" strokeLinecap="round" />)}
    <circle cx="100" cy="116" r="32" fill={d} stroke={INK} strokeWidth="6" />
  </>,
  lua: d => <path d="M124 58 a58 58 0 1 0 0 116 a46 46 0 1 1 0 -116 Z" fill={d} stroke={INK} strokeWidth="6" strokeLinejoin="round" />,
  raio: d => <path d="M112 52 L62 124 h30 l-16 62 L142 108 h-32 l14-56 Z" fill={d} stroke={INK} strokeWidth="6" strokeLinejoin="round" />,
  fogo: d => <>
    <path d="M100 52 C126 92 138 110 138 132 A38 38 0 0 1 62 132 C62 110 74 92 100 52 Z" fill={d} stroke={INK} strokeWidth="6" strokeLinejoin="round" />
    <path d="M100 104 c11 17 15 23 15 33 a17 17 0 0 1 -30 0 c0-10 4-16 15-33 Z" fill={INK} opacity=".35" />
  </>,
  onda: d => <>
    <path d="M40 108 q30-30 60 0 t60 0" stroke={INK} strokeWidth="19" fill="none" strokeLinecap="round" />
    <path d="M40 140 q30-30 60 0 t60 0" stroke={INK} strokeWidth="19" fill="none" strokeLinecap="round" />
    <path d="M40 108 q30-30 60 0 t60 0" stroke={d} strokeWidth="10" fill="none" strokeLinecap="round" />
    <path d="M40 140 q30-30 60 0 t60 0" stroke={d} strokeWidth="10" fill="none" strokeLinecap="round" />
  </>,
  ancora: d => <>
    <path d="M100 66 V166" stroke={INK} strokeWidth="17" strokeLinecap="round" />
    <path d="M64 100 h72" stroke={INK} strokeWidth="15" strokeLinecap="round" />
    <path d="M52 126 q0 44 48 44 q48 0 48-44" stroke={INK} strokeWidth="17" fill="none" strokeLinecap="round" />
    <path d="M100 66 V166 M64 100 h72" stroke={d} strokeWidth="8" strokeLinecap="round" />
    <path d="M52 126 q0 44 48 44 q48 0 48-44" stroke={d} strokeWidth="8" fill="none" strokeLinecap="round" />
    <circle cx="100" cy="66" r="15" fill="none" stroke={INK} strokeWidth="12" />
    <circle cx="100" cy="66" r="15" fill="none" stroke={d} strokeWidth="6" />
  </>,
  montanha: d => <>
    <path d="M36 166 L86 84 L116 126 L134 100 L168 166 Z" fill={d} stroke={INK} strokeWidth="6" strokeLinejoin="round" />
    <path d="M86 84 L104 114 h-36 Z" fill={INK} opacity=".3" />
  </>,
  castelo: d => <>
    <path d="M52 166 V88 h14 V72 h16 v16 h14 V72 h16 v16 h14 V72 h16 v16 h14 v78 Z" fill={d} stroke={INK} strokeWidth="6" strokeLinejoin="round" />
    <path d="M90 166 v-38 a10 10 0 0 1 20 0 v38 Z" fill={INK} opacity=".45" />
  </>,
  predio: d => <>
    <rect x="52" y="94" width="42" height="76" fill={d} stroke={INK} strokeWidth="6" />
    <rect x="102" y="66" width="46" height="104" fill={d} stroke={INK} strokeWidth="6" />
    <g fill={INK} opacity=".45">
      <rect x="62" y="106" width="10" height="12" /><rect x="76" y="106" width="10" height="12" />
      <rect x="62" y="128" width="10" height="12" /><rect x="76" y="128" width="10" height="12" />
      <rect x="112" y="80" width="11" height="13" /><rect x="128" y="80" width="11" height="13" />
      <rect x="112" y="104" width="11" height="13" /><rect x="128" y="104" width="11" height="13" />
      <rect x="112" y="128" width="11" height="13" /><rect x="128" y="128" width="11" height="13" />
    </g>
  </>,
  farol: d => <>
    <path d="M78 166 L86 90 h28 l8 76 Z" fill={d} stroke={INK} strokeWidth="6" strokeLinejoin="round" />
    <rect x="80" y="72" width="40" height="22" rx="5" fill={d} stroke={INK} strokeWidth="6" />
    <path d="M100 58 l10 12 h-20 Z" fill={d} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
    <path d="M76 82 l-24-10 M124 82 l24-10" stroke={d} strokeWidth="8" strokeLinecap="round" />
    <path d="M84 122 h32 M82 144 h36" stroke={INK} strokeWidth="6" opacity=".4" />
  </>,
  engrenagem: d => <>
    {Array.from({ length: 8 }, (_, i) => i * 45).map(a => <rect key={a} x="92" y="46" width="16" height="26" fill={d} stroke={INK} strokeWidth="5" transform={`rotate(${a} 100 116)`} />)}
    <circle cx="100" cy="116" r="46" fill={d} stroke={INK} strokeWidth="6" />
    <circle cx="100" cy="116" r="19" fill={INK} />
  </>,
  martelo: d => <>
    <path d="M56 68 h58 v30 h-58 Z" fill={d} stroke={INK} strokeWidth="6" strokeLinejoin="round" transform="rotate(-24 100 110)" />
    <path d="M104 84 L142 162" stroke={INK} strokeWidth="19" strokeLinecap="round" />
    <path d="M104 84 L142 162" stroke={d} strokeWidth="10" strokeLinecap="round" />
  </>,
  carro: d => <>
    <path d="M46 142 v-18 l14-30 q3-8 12-8 h56 q9 0 12 8 l14 30 v18 Z" fill={d} stroke={INK} strokeWidth="6" strokeLinejoin="round" />
    <path d="M68 96 h64 l8 22 H60 Z" fill={INK} opacity=".4" />
    <circle cx="70" cy="146" r="14" fill={d} stroke={INK} strokeWidth="6" />
    <circle cx="130" cy="146" r="14" fill={d} stroke={INK} strokeWidth="6" />
  </>,
  foguete: d => <>
    <path d="M100 50 q26 30 26 66 v22 H74 v-22 q0-36 26-66 Z" fill={d} stroke={INK} strokeWidth="6" strokeLinejoin="round" />
    <circle cx="100" cy="98" r="13" fill={INK} opacity=".45" />
    <path d="M74 118 l-20 26 20 -6 Z" fill={d} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
    <path d="M126 118 l20 26 -20 -6 Z" fill={d} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
    <path d="M88 140 h24 l-12 34 Z" fill={INK} opacity=".5" />
  </>,
  bola: d => <>
    <circle cx="100" cy="116" r="50" fill={d} stroke={INK} strokeWidth="6" />
    <path d="M100 84 l26 19 -10 31 h-32 l-10-31 Z" fill={INK} />
    <path d="M100 66 v18 M74 104 l-18-8 M126 104 l18-8 M90 134 l-12 24 M110 134 l12 24" stroke={INK} strokeWidth="7" />
  </>,
  chuteira: d => <>
    <path d="M52 96 h30 v34 l38 8 q22 5 22 22 v10 H52 Z" fill={d} stroke={INK} strokeWidth="6" strokeLinejoin="round" />
    <g fill={INK}><rect x="60" y="170" width="11" height="12" rx="3" /><rect x="88" y="170" width="11" height="12" rx="3" /><rect x="116" y="170" width="11" height="12" rx="3" /></g>
    <path d="M84 112 l24 10 M84 126 l30 12" stroke={INK} strokeWidth="5" strokeLinecap="round" opacity=".6" />
  </>,
  meias: d => <>
    <g transform="rotate(-14 100 120)">
      <path d="M56 62 H86 V116 H116 A15 15 0 0 1 116 146 H56 Z" fill={d} stroke={INK} strokeWidth="6" strokeLinejoin="round" />
      <rect x="56" y="62" width="30" height="16" fill={INK} opacity=".45" />
    </g>
    <g transform="rotate(12 120 130)">
      <path d="M96 78 H126 V132 H156 A15 15 0 0 1 156 162 H96 Z" fill={d} stroke={INK} strokeWidth="6" strokeLinejoin="round" />
      <rect x="96" y="78" width="30" height="16" fill={INK} opacity=".45" />
    </g>
  </>,
  espeto: d => <>
    <path d="M40 158 L160 74" stroke={INK} strokeWidth="12" strokeLinecap="round" />
    <path d="M40 158 L160 74" stroke={d} strokeWidth="5" strokeLinecap="round" />
    {[[70, 138], [98, 118], [126, 98]].map(([x, y], i) => <g key={i}>
      <rect x={x - 17} y={y - 17} width="34" height="34" rx="10" fill={d} stroke={INK} strokeWidth="6" transform={`rotate(-35 ${x} ${y})`} />
    </g>)}
  </>,
  copo: d => <>
    <path d="M62 76 h64 l-8 88 q-1 10 -11 10 h-26 q-10 0 -11-10 Z" fill={d} stroke={INK} strokeWidth="6" strokeLinejoin="round" />
    <path d="M126 96 h16 a14 14 0 0 1 0 28 h-18" fill="none" stroke={INK} strokeWidth="6" />
    <path d="M58 76 q10-16 22-6 q12-14 24 0 q12-12 24 2 q6 4 4 4 H58 Z" fill={d} stroke={INK} strokeWidth="6" strokeLinejoin="round" />
  </>,
  casa: d => <>
    <path d="M100 56 L166 110 h-16 v58 H50 v-58 H34 Z" fill={d} stroke={INK} strokeWidth="6" strokeLinejoin="round" />
    <rect x="86" y="126" width="28" height="42" fill={INK} opacity=".45" />
  </>,
  // 🥬 pé de alface: folhas em roseta (pedido do Diego pro Alfacehh FC)
  alface: d => <>
    <circle cx="66" cy="118" r="24" fill={d} stroke={INK} strokeWidth="6" />
    <circle cx="134" cy="118" r="24" fill={d} stroke={INK} strokeWidth="6" />
    <circle cx="78" cy="86" r="23" fill={d} stroke={INK} strokeWidth="6" />
    <circle cx="122" cy="86" r="23" fill={d} stroke={INK} strokeWidth="6" />
    <circle cx="100" cy="76" r="23" fill={d} stroke={INK} strokeWidth="6" />
    <circle cx="100" cy="140" r="22" fill={d} stroke={INK} strokeWidth="6" />
    <circle cx="100" cy="112" r="38" fill={d} stroke={INK} strokeWidth="6" />
    <circle cx="100" cy="112" r="38" fill="#fff" opacity=".22" /> {/* miolo mais claro: lê como pé de alface, não bola */}
    <path d="M100 76 v72 M78 86 q10 28 0 52 M122 86 q-10 28 0 52" stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" opacity=".4" />
  </>,
  moeda: d => <>
    <circle cx="88" cy="118" r="42" fill={d} stroke={INK} strokeWidth="6" />
    <circle cx="120" cy="126" r="42" fill={d} stroke={INK} strokeWidth="6" />
    <text x="120" y="144" fontFamily="Oswald, sans-serif" fontWeight="900" fontSize="46" fill={INK} textAnchor="middle">$</text>
  </>,
  cocar: d => <>
    {[-42, -21, 0, 21, 42].map((a, i) => <ellipse key={a} cx="100" cy={i === 2 ? 78 : Math.abs(a) === 21 ? 82 : 88} rx="10" ry={i === 2 ? 38 : Math.abs(a) === 21 ? 36 : 34} transform={`rotate(${a} 100 140)`} fill={d} stroke={INK} strokeWidth="5" />)}
    <rect x="56" y="136" width="88" height="24" rx="11" fill={INK} />
    <path d="M70 148 h12 M94 148 h12 M118 148 h12" stroke={d} strokeWidth="6" strokeLinecap="round" />
  </>,
  espiga: d => <>
    <path d="M100 60 q26 26 26 58 t-26 46 q-26-14 -26-46 t26-58 Z" fill={d} stroke={INK} strokeWidth="6" strokeLinejoin="round" />
    <path d="M100 74 v82 M84 92 q16 6 32 0 M84 114 q16 6 32 0 M84 136 q16 6 32 0" stroke={INK} strokeWidth="4.5" fill="none" opacity=".55" />
  </>,
  ponte: d => <>
    <path d="M34 150 q66-72 132 0" fill="none" stroke={INK} strokeWidth="15" strokeLinecap="round" />
    <path d="M34 150 q66-72 132 0" fill="none" stroke={d} strokeWidth="7" strokeLinecap="round" />
    <rect x="28" y="150" width="144" height="16" rx="5" fill={d} stroke={INK} strokeWidth="6" />
    <path d="M66 150 V126 M100 150 V112 M134 150 V126" stroke={INK} strokeWidth="6" />
  </>,
  bigode: d => <>
    <circle cx="100" cy="112" r="48" fill={d} stroke={INK} strokeWidth="6" />
    <circle cx="84" cy="102" r="6" fill={INK} /><circle cx="116" cy="102" r="6" fill={INK} />
    <path d="M62 128 q20-14 38 2 q18-16 38-2 q-14 22 -38 10 q-24 12 -38-10 Z" fill={INK} />
    <path d="M64 82 q16-14 34-8 M136 82 q-16-14 -34-8" stroke={INK} strokeWidth="6" fill="none" strokeLinecap="round" />
  </>,
  dragao: d => <>
    <path d="M46 152 q22-58 62-58 q-6-18 10-28 q4 16 16 18 q26 4 26 30 q0 34-38 42 q-40 8 -76-4 Z" fill={d} stroke={INK} strokeWidth="6" strokeLinejoin="round" />
    <path d="M96 74 l14-20 4 22" fill={d} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
    <circle cx="126" cy="88" r="5" fill={INK} />
    <path d="M60 150 q30 14 62 6" stroke={INK} strokeWidth="5" fill="none" opacity=".5" />
  </>,
  fenix: d => <>
    <path d="M100 56 q-14 26 -8 44 q-26-20 -50-14 q22 12 28 34 q-20-2 -30 8 q26 4 40 22 q18 22 20 34 q2-12 20-34 q14-18 40-22 q-10-10 -30-8 q6-22 28-34 q-24-6 -50 14 q6-18 -8-44 Z" fill={d} stroke={INK} strokeWidth="6" strokeLinejoin="round" />
  </>,
}

// ─── 📖 dicionário: palavra no nome → símbolo (a ordem importa: 1ª que casar) ──
// Só vocabulário GENÉRICO do futebol/geografia — nunca mascote de clube real.
// ⚠️ Chave que começa com espaço = precisa ser INÍCIO DE PALAVRA. Sem isso,
// "Ope-RÁRIO DO-cas" casava com «rio » e virava onda; "col-MEIA" virava meias. 😅
// Ordem: bicho/objeto CONCRETO primeiro, título genérico (coroa, esporte) depois —
// senão "Dragão Imperial" vira coroa em vez de dragão.
// 3º item (opcional) = TRAVA a paleta (índice em PALETAS), quando a cor faz
// parte da identidade da palavra. Sem ele, a cor sai do sorteio pelo nome.
const DICIO: [string[], keyof typeof SIM, number?][] = [
  // 🥬 alface/verdura SEMPRE verde (pedido do Diego pro Alfacehh) — paleta 6
  [['alfac', ' couve', ' folha', 'verdura', ' horta', ' salada', ' rúcula', ' rucula'], 'alface', 6],
  [['ferroviar', 'ferrovia', ' trem', 'locomotiv', 'maria fuma'], 'trem'],
  [['sertao', 'sertão', 'agreste', 'caatinga', 'cariri', 'serido', 'seridó'], 'cacto'],
  [['meias', ' meia'], 'meias'],
  [['dragao', 'dragão'], 'dragao'],
  [['fenix', 'fênix', 'phoenix'], 'fenix'],
  [[' leao', ' leão', ' lion', 'leonin'], 'leao'],
  [['aguia', 'águia', 'gaviao', 'gavião', 'falcao', 'falcão', 'condor'], 'aguia'],
  [['onca', 'onça', 'jaguar', 'tigre', 'pantera', ' gato', ' puma', 'felin'], 'onca'],
  [['touro', ' boi ', ' bull', 'bufalo', 'búfalo', ' zebu', ' vaca'], 'touro'],
  [['cavalo', ' potro', ' egua', ' égua', 'jumento', ' burro'], 'cavalo'],
  [['cobra', ' naja', 'serpent', 'jararac', 'jacar'], 'cobra'],
  [['bagre', 'peixe', 'tubara', 'tubarã', 'piranha', 'sardinh', 'marreco', ' pato', 'baiacu'], 'peixe'],
  [['fogo', 'fogar', ' chama', ' brasa', 'labared', 'inferno', 'vulca', 'vulcã', 'incendi'], 'fogo'],
  [['estrela', ' astro', 'galat', 'galát', 'stellar', ' star'], 'estrela'],
  [['guarani', ' tupi', 'tamoio', 'cacique', ' indio', ' índio', 'potiguar', 'tabajara', 'carij'], 'cocar'],
  [['trovao', 'trovão', ' raio', 'relampag', 'relâmpag', 'tempestad', 'eletric', 'elétric', 'furac'], 'raio'],
  [['doca', ' porto', 'ancora', 'âncora', 'marinh', ' naval', ' barco', ' canoa'], 'ancora'],
  [['operari', 'operári', 'industri', 'maquina', 'máquina', ' motor', 'mecanic', 'mecânic', 'engrenag', ' usina', 'fabrica', 'fábrica'], 'engrenagem'],
  [['maritim', 'marítim', 'litoral', ' praia', ' onda', ' mar ', ' costa', 'nautic', 'náutic', ' rio ', ' ilha', ' lagoa', ' aqua'], 'onda'],
  [['serra', 'serran', ' monte', ' pico', 'cordilh', 'planalt', ' morro'], 'montanha'],
  [['cerrad', 'seringu', ' mata', 'florest', ' bosque', ' rural', ' campo', 'varzea', 'várzea', 'descampad', ' roca', ' roça', ' parque', 'arvore', 'árvore', 'pantanal', ' verde'], 'arvore'],
  [['aurora', ' sol ', 'alvorad', 'nascent', 'amanhec', ' raiar', 'oriente'], 'sol'],
  [['night', ' lua ', 'noturn', 'meia-noite', 'madrug', 'eclipse'], 'lua'],
  [['coliseu', 'castelo', 'fortalez', 'muralha', ' torre'], 'castelo'],
  [['perna', 'chuteir', 'canela', 'canelad', ' trave', ' onze', ' doze'], 'chuteira'],
  [['metropol', 'metrópol', ' city', ' urban', 'capital', ' centro', ' cidade', 'municipal'], 'predio'],
  [['farol', ' posto', ' guarda'], 'farol'],
  [['martelo', ' forja', 'ferreir', ' obra', 'construt', 'pedreir'], 'martelo'],
  [['kombi', 'ferrari', ' carro', 'veicul', 'veícul', ' turbo', ' garag', ' pneu', 'volante'], 'carro'],
  [['foguet', 'galaxi', 'galáxi', ' cosmo', 'espaci', 'dumont', ' aviao', ' avião', ' voo', ' sky', 'astronaut', 'orbita', 'órbita', 'cometa', 'meteor'], 'foguete'],
  [['churrasc', 'espeto', 'grelha', ' carne', 'picanha', 'linguic', 'linguiç', 'espetinh'], 'espeto'],
  [[' bar ', 'boteco', 'resenha', 'ressaca', ' brisa', ' chopp', 'cerveja', 'domingueir', ' copo', ' gole', ' birit'], 'copo'],
  [['cuscuz', ' milho', ' feira', 'colheit', 'espiga', 'goiaba', ' fruta', 'tapioc', 'canjic', ' torta', 'milanes', 'napolitan', ' pizza'], 'espiga'],
  [[' casa', ' vo ', ' vó', ' lar ', 'bairro', ' vila', 'morada', 'quintal', 'condomin'], 'casa'],
  [[' grana', ' bets', 'fortuna', ' banco', 'dinheir', ' ouro', 'milionar', 'milionár', 'tesour', ' cofre', 'comercial'], 'moeda'],
  [['ponte', 'fronteira'], 'ponte'],
  [['bigode', ' barba', 'magra', 'magrã', 'tonha', 'tonhã', 'xanda', 'xandã', 'serja', 'serjã', 'robert', 'sinho', 'sinhô', ' ze ', ' zé ', ' mano ', 'nininho', ' miudo', ' miúdo', ' gugu'], 'bigode'],
  [['imperador', 'imperial', 'monarca', 'realeza', 'soberan', ' rei ', 'majestad', ' nobre', 'olimpo', ' titan', ' titã', 'prestigi', 'prestígi', ' legado', 'apogeu', ' coroa', 'principe', 'príncipe', 'imperi', 'impéri'], 'coroa'],
  [[' gol ', 'peteca', 'pelad', 'society', 'boleir', ' pelot', 'craque', ' bola', 'futebol', 'esport', 'atletic', 'atlétic', 'juventu'], 'chuteira'],
]

// ─── 🧼 nome LIMPO: sem emoji e sem espaço sobrando ───────────────────────
// Na tabela o nome vem com o SELO do tier ("Fulano FC 👑🖊️"). Sem limpar, o
// escudo mudaria quando a pessoa trocasse de tier — e o clube perderia a cara.
// (Regex igual ao stripEmoji do apoio.tsx; cópia local pra este módulo ficar puro.)
export function nomeLimpo(nome: string): string {
  return nome.replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}‍️︎⃣]/gu, '').replace(/\s+/g, ' ').trim()
}

// ─── 🔒 hash determinístico do nome (mesmo nome = mesmo escudo, sempre) ────
function hashNome(nome: string): number {
  let h = 2166136261
  const s = nome.trim().toLowerCase()
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return Math.abs(h)
}
const semAcento = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export interface EscudoDesign { shape: number; pat: number; c1: string; c2: string; sim: keyof typeof SIM | null; letra: string }

// a receita do escudo a partir do NOME (pura, sem estado)
export function escudoDe(nomeCru: string): EscudoDesign {
  const nome = nomeLimpo(nomeCru) || nomeCru // 🧼 tira o selo do tier (👑🖊️) antes de tudo
  const h = hashNome(nome)
  const alvo = ' ' + semAcento(nome) + ' '
  let sim: keyof typeof SIM | null = null
  let paletaFixa: number | undefined
  for (const [palavras, s, pal] of DICIO) {
    if (palavras.some(p => alvo.includes(semAcento(p)))) { sim = s; paletaFixa = pal; break }
  }
  const [c1, c2] = PALETAS[paletaFixa ?? (h % PALETAS.length)]
  return {
    shape: (h >> 4) % SHAPES.length,
    pat: (h >> 8) % 7,
    c1, c2, sim,
    letra: (nome.trim()[0] ?? '?').toUpperCase(),
  }
}

// 💰 LOGOS ARTESANAIS (pagas): nome do time → desenho próprio, entra no lugar do
// automático. É só adicionar aqui quando alguém comprar.
export const LOGOS_PRONTAS: Record<string, (size: number) => ReactNode> = {
  // 🦋 Xurupitas FC (batismo do davisantana1312, aprovado pelo Diego 09/08):
  // mariposa-da-seda NERVOSA — só as asas superiores no escudo (pedido dele);
  // a versão inteira (com as asas de baixo) vive na mascote do festão.
  'Xurupitas FC': (size: number) => {
    const mini = size < 40
    const w = Math.round(size * 200 / 240)
    return (
      <svg width={w} height={size} viewBox="0 0 200 240" aria-label="Xurupitas FC" role="img" style={{ flex: 'none', display: 'block' }}>
        <defs><clipPath id="xurClip"><path d="M18 30 H182 V145 C182 188 138 214 100 234 C62 214 18 188 18 145 Z" /></clipPath></defs>
        <path d="M18 30 H182 V145 C182 188 138 214 100 234 C62 214 18 188 18 145 Z" fill="#1B7A3D" />
        <g clipPath="url(#xurClip)">
          <rect x="42" y="10" width="24" height="240" fill="#ffffff" opacity=".85" />
          <rect x="134" y="10" width="24" height="240" fill="#ffffff" opacity=".85" />
        </g>
        <path d="M18 30 H182 V145 C182 188 138 214 100 234 C62 214 18 188 18 145 Z" fill="none" stroke={INK} strokeWidth={mini ? 9 : 7} strokeLinejoin="round" />
        {mini ? (
          <g>
            <path d="M96 110 C64 70 34 62 28 70 C22 100 40 138 68 146 Q90 152 96 132 Z" fill="#7CD492" stroke={INK} strokeWidth="8" />
            <path d="M104 110 C136 70 166 62 172 70 C178 100 160 138 132 146 Q110 152 104 132 Z" fill="#7CD492" stroke={INK} strokeWidth="8" />
            <ellipse cx="100" cy="126" rx="15" ry="28" fill="#fff" stroke={INK} strokeWidth="8" />
            <circle cx="100" cy="92" r="17" fill="#fff" stroke={INK} strokeWidth="8" />
            <circle cx="92" cy="92" r="7.5" fill={INK} /><circle cx="108" cy="92" r="7.5" fill={INK} />
            <path d="M78 78 L94 86 M122 78 L106 86" stroke={INK} strokeWidth="8" strokeLinecap="round" />
          </g>
        ) : (
          <g transform="translate(0,18)">
            <path d="M96 104 C70 70 40 56 28 62 C18 88 30 128 58 140 C72 146 86 138 94 128 Z" fill="#7CD492" stroke={INK} strokeWidth="6" strokeLinejoin="round" />
            <path d="M104 104 C130 70 160 56 172 62 C182 88 170 128 142 140 C128 146 114 138 106 128 Z" fill="#7CD492" stroke={INK} strokeWidth="6" strokeLinejoin="round" />
            <g fill="#14401f"><ellipse cx="46" cy="86" rx="4" ry="6" /><ellipse cx="60" cy="112" rx="3.5" ry="5" /><ellipse cx="76" cy="92" rx="3" ry="4.5" /><ellipse cx="154" cy="86" rx="4" ry="6" /><ellipse cx="140" cy="112" rx="3.5" ry="5" /><ellipse cx="124" cy="92" rx="3" ry="4.5" /></g>
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
        )}
      </svg>
    )
  },
  // 💇‍♂️ Neymarzetti (time do Diego, aprovado 09/08 v5): perfil com a crista
  // ÚNICA preto+loiro (moicano 2011), brincão de pérola, sorrisão com dentes.
  Neymarzetti: (size: number) => {
    const mini = size < 40
    const w = Math.round(size * 200 / 240)
    return (
      <svg width={w} height={size} viewBox="0 0 200 240" aria-label="Neymarzetti" role="img" style={{ flex: 'none', display: 'block' }}>
        <defs><clipPath id="nzClip"><path d="M100 22 L182 46 V142 C182 184 140 210 100 230 C60 210 18 184 18 142 V46 Z" /></clipPath></defs>
        <path d="M100 22 L182 46 V142 C182 184 140 210 100 230 C60 210 18 184 18 142 V46 Z" fill="#ffffff" />
        <g clipPath="url(#nzClip)">
          <rect x="30" y="10" width="14" height="240" fill="#0C0C0C" opacity=".9" />
          <rect x="156" y="10" width="14" height="240" fill="#0C0C0C" opacity=".9" />
        </g>
        <path d="M100 22 L182 46 V142 C182 184 140 210 100 230 C60 210 18 184 18 142 V46 Z" fill="none" stroke={INK} strokeWidth={mini ? 9 : 7} strokeLinejoin="round" />
        {mini ? (
          <g>
            <path d="M78 108 C66 122 60 132 54 144 L64 152 Q58 166 74 174 Q92 186 116 178 L142 184 Q152 148 152 130 Q150 100 122 92 Q96 84 78 108 Z" fill="#E8B98A" stroke={INK} strokeWidth="8" />
            <path d="M74 108 L64 54 L84 82 L90 30 L106 72 L118 28 L128 72 L142 48 L144 90 L158 112 L152 152 L138 142 Q144 114 122 102 Q100 92 74 108 Z" fill="#0C0C0C" />
            <path d="M72 88 L64 54 L84 82 L90 30 L106 72 L118 28 L128 72 L142 48 L144 90 L158 112 L152 132 Q140 102 120 92 Q98 82 72 88 Z" fill="#F2C14E" />
            <path d="M62 124 L86 118" stroke={INK} strokeWidth="8" strokeLinecap="round" />
            <circle cx="74" cy="132" r="5" fill={INK} />
            <circle cx="116" cy="160" r="7" fill="#fff" stroke={INK} strokeWidth="4" />
          </g>
        ) : (
          <g>
            <path d="M84 190 L92 168 L128 168 L134 190 Z" fill="#E8B98A" stroke={INK} strokeWidth="5" />
            <path d="M70 214 L84 186 L108 196 L132 186 L146 214 Z" fill="#ffffff" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
            <path d="M84 186 L108 196 L132 186" fill="none" stroke={INK} strokeWidth="5" />
            <path d="M76 100 C70 108 67 114 64 120 L56 134 Q54 138 58 140 L64 142 Q57 146 61 149 Q53 155 64 158 Q56 163 66 165 Q62 171 74 172 Q88 176 102 174 Q112 172 117 166 L122 176 L138 176 Q146 148 148 130 Q148 102 124 92 Q98 82 76 100 Z" fill="#E8B98A" stroke={INK} strokeWidth="6" strokeLinejoin="round" />
            <path d="M72 102 L64 58 L80 82 L84 36 L98 74 L106 30 L116 72 L128 40 L132 76 L146 58 L146 94 L156 112 L152 146 L142 138 L146 162 L134 150 Q140 116 122 104 Q100 92 72 102 Z" fill="#0C0C0C" />
            <path d="M70 84 L64 58 L80 82 L84 36 L98 74 L106 30 L116 72 L128 40 L132 76 L146 58 L146 94 L156 112 L151 132 L146 124 Q138 102 120 92 Q98 82 70 84 Z" fill="#F2C14E" />
            <g fill="#0C0C0C" opacity=".3"><circle cx="102" cy="112" r="1.8" /><circle cx="112" cy="108" r="1.8" /><circle cx="122" cy="112" r="1.8" /><circle cx="108" cy="120" r="1.8" /><circle cx="118" cy="122" r="1.8" /><circle cx="128" cy="120" r="1.8" /><circle cx="132" cy="130" r="1.8" /><circle cx="124" cy="132" r="1.8" /></g>
            <path d="M60 116 L84 109" stroke={INK} strokeWidth="5.5" strokeLinecap="round" />
            <path d="M64 126 q9 -5 16 -1 q-7 6 -16 1 Z" fill="#fff" stroke={INK} strokeWidth="3" />
            <circle cx="71" cy="125" r="3" fill={INK} />
            <circle cx="60" cy="139" r="2.4" fill={INK} />
            <path d="M58 152 q10 7 20 2" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M59 151 q10 6 18 3 l-3 6 q-10 2 -15 -9 Z" fill="#fff" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M104 126 l8 -3 3 16 -7 2 Z" fill="#0C0C0C" opacity=".85" />
            <path d="M112 136 q10 -6 12 4 q2 10 -8 12 q-6 1 -8 -6" fill="#E8B98A" stroke={INK} strokeWidth="4.5" />
            <circle cx="115" cy="158" r="6" fill="#ffffff" stroke={INK} strokeWidth="3.5" />
          </g>
        )}
      </svg>
    )
  },
  // 🦊 La Bestia Negra (batismo do eltonfrossard45, aprovado pelo Diego 09/08):
  // azul cruzeirense + diagonal clara, estrela creme e a cabeça da raposa.
  'La Bestia Negra': (size: number) => {
    const mini = size < 40
    const w = Math.round(size * 200 / 240)
    return (
      <svg width={w} height={size} viewBox="0 0 200 240" aria-label="La Bestia Negra" role="img" style={{ flex: 'none', display: 'block' }}>
        <defs><clipPath id="lbnClip"><path d="M100 22 L182 46 V142 C182 184 140 210 100 230 C60 210 18 184 18 142 V46 Z" /></clipPath></defs>
        <path d="M100 22 L182 46 V142 C182 184 140 210 100 230 C60 210 18 184 18 142 V46 Z" fill="#0E3E86" />
        <g clipPath="url(#lbnClip)"><path d="M-20 250 L210 20 v40 L20 250 Z" fill="#1B62C9" opacity=".55" /></g>
        <path d="M100 22 L182 46 V142 C182 184 140 210 100 230 C60 210 18 184 18 142 V46 Z" fill="none" stroke={INK} strokeWidth={mini ? 9 : 7} strokeLinejoin="round" />
        <path d="M100 38 L106 52 L121 52 L109 61 L114 76 L100 67 L86 76 L91 61 L79 52 L94 52 Z" fill="#F4ECD6" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <path d="M64 58 L80 88 L52 92 Z M136 58 L120 88 L148 92 Z" fill="#F4ECD6" stroke={INK} strokeWidth={mini ? 8 : 6} strokeLinejoin="round" />
        {!mini && <path d="M70 66 L78 84 L60 86 Z M130 66 L122 84 L140 86 Z" fill={INK} />}
        <path d="M62 88 Q100 72 138 88 L144 108 L128 118 L138 128 Q120 158 100 164 Q80 158 62 128 L72 118 L56 108 Z" fill="#F4ECD6" stroke={INK} strokeWidth={mini ? 8 : 6} strokeLinejoin="round" />
        <circle cx="84" cy="110" r={mini ? 7.5 : 6.5} fill={INK} /><circle cx="116" cy="110" r={mini ? 7.5 : 6.5} fill={INK} />
        <path d="M100 152 l-9 -12 h18 Z" fill={INK} />
        {!mini && <path d="M70 126 l-12 -3 M70 132 l-11 3 M130 126 l12 -3 M130 132 l11 3" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />}
      </svg>
    )
  },
}

// ─── 🛡️ o componente ──────────────────────────────────────────────────────
// `size` = altura em px. Abaixo de 40px entra a versão MINI: sem detalhes finos
// e com traço mais grosso (o que lê na tabela é a silhueta + a cor).
export function Escudo({ nome: nomeCru, size = 30, title }: { nome: string; size?: number; title?: string }) {
  const nome = nomeLimpo(nomeCru) || nomeCru // 🧼 mesmo escudo com ou sem o selo do tier
  const pronta = LOGOS_PRONTAS[nome]
  if (pronta) return <>{pronta(size)}</>
  const d = escudoDe(nome)
  const mini = size < 40
  const shape = SHAPES[d.shape]
  const cid = 'esc' + hashNome(nome).toString(36)
  const w = Math.round(size * 200 / 240)
  return (
    <svg width={w} height={size} viewBox="0 0 200 240" aria-label={title ?? nome} role="img" style={{ flex: 'none', display: 'block' }}>
      <defs><clipPath id={cid}><path d={shape} /></clipPath></defs>
      <path d={shape} fill={d.c1} />
      <g clipPath={`url(#${cid})`}>{padrao(d.pat, d.c2)}</g>
      <path d={shape} fill="none" stroke={INK} strokeWidth={mini ? 9 : 7} strokeLinejoin="round" />
      {d.sim
        // escala pra NENHUM símbolo encostar na borda (o mini cresce um tico: na
        // tabela o que vale é enxergar a silhueta). O centro do escudo é ~(100,118).
        ? <g transform={`translate(100 118) scale(${mini ? 1 : .88}) translate(-100 -118)`}>{SIM[d.sim](d.c2)}</g>
        : <>
          <circle cx="100" cy="118" r="46" fill={d.c2} stroke={INK} strokeWidth={mini ? 8 : 6} />
          <text x="100" y="146" fontFamily="Oswald, sans-serif" fontWeight="900" fontSize="74" fill={INK} textAnchor="middle">{d.letra}</text>
        </>}
    </svg>
  )
}
