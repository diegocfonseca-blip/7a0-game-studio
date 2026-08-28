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
//
// 🖼️ EXCEÇÃO APROVADA (Diego, 10/08): batismo pode usar ARTE PRÓPRIA em imagem
// quando o dono manda o arquivo (caso Tôka10). Regra prática: webp comprimido,
// kit inteiro ≤ ~40 KB (o site tem ~3 MB, então isso é ~1% — irrelevante).
import type { ReactNode } from 'react'
import tokaEscudoImg from './img/toka10-escudo.webp'
import erosEscudoImg from './img/eros-escudo.webp'
import sapekEscudoImg from './img/sapek-escudo.webp'
import arrudaEscudoImg from './img/arruda-escudo.webp'
import coringasEscudoImg from './img/coringas-escudo.webp'
import nataEscudoImg from './img/nata-escudo.webp'
import theuzudoEscudoImg from './img/theuzudo-escudo.webp' // 🦇 Theuzudo FC (matheusfilipealves): arte própria do dono
import saoluizEscudoImg from './img/saoluiz-escudo.webp' // 🐶 São Luiz FC (gabrielnegreirosamaral99): arte própria do dono
import papaoEscudoImg from './img/papao-escudo.webp' // 🐺 Papão United Madrid (agrostinho88): arte própria do dono
import lluchEscudoImg from './img/lluch-escudo.webp' // 🏠 Esqueceram do Lluch FC (lluchmarcel81): arte própria do dono
import neymarzettiEscudoImg from './img/neymarzetti-escudo.webp' // 🦇 Neymarzetti (diego.c.fonseca): arte própria do dono, 24/08
import milhacaEscudoImg from './img/milhaca-escudo.webp' // 🌽 Milhaça FC (igormarquesn99 / @igumarques): arte própria do dono, 24/08
import leaoEstradinhaEscudoImg from './img/leao-estradinha-escudo.webp' // 🦁 Leão da Estradinha (jorgericardo777): arte própria do dono
import skyyEscudoImg from './img/skyy-escudo.webp'
import bigaoEscudoImg from './img/bigao-escudo.webp'
import futpointEscudoImg from './img/futpoint-escudo.webp'
import ferrariEscudoImg from './img/ferrari-escudo.webp' // 🏎️ Ferrari SC (adriano): arte própria do dono
import { newestTeamName } from './data' // 🔁 nome ATUAL a partir de um nome VELHO (batismo)

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
  // ⚠️ daqui pra baixo as paletas NÃO entram no sorteio (SORTEIO_PALETAS trava
  // em 12) — adicionar linha aqui não muda a cor de nenhum escudo existente.
  // Elas só saem por TRAVA: DICIO (3º item) ou CORES_TRAVADAS (nome inteiro).
  ['#0C0C0C', '#FDFDFB'], // 12: preto + branco (alvinegro raiz)
]
// 🔒 o sorteio continua entre as 12 primeiras PRA SEMPRE. Se fosse
// PALETAS.length, cada paleta nova mudaria o `h % length` de TODO clube do
// jogo — todo escudo sorteado trocaria de cor da noite pro dia.
const SORTEIO_PALETAS = 12

// 🎨 COR TRAVADA POR NOME: casos em que só a COR precisa obedecer (o formato,
// o padrão e a letra continuam os sorteados do nome). 1º caso (28/08): jogador
// mandou e-mail pro Diego — o "Corinthians SCCP" dele tinha saído VERDE no
// sorteio ("chega dar arrepio ver meu Corinthians com logo verde, rival do
// Palmeiras"). Diego: "coloque preto e branco". Vale pra qualquer nome que
// contenha a palavra (não é batismo, não reserva nome — é só a cor certa).
const CORES_TRAVADAS: [string[], number][] = [
  [['corinthian', 'corintian', 'coringao', 'coringão'], 12], // ⚫⚪ alvinegro
]
function corTravada(alvo: string): number | undefined {
  for (const [palavras, pal] of CORES_TRAVADAS) {
    if (palavras.some(p => alvo.includes(semAcento(p)))) return pal
  }
  return undefined
}

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
  return nome
    .replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}‍️︎⃣]/gu, '')
    // 🧹 sufixos de TELA que algumas partes do jogo grudam no nome pra marcar
    // quem é quem ("(você)", "🔥" pros amigos). Eles não fazem parte do nome do
    // clube — e, colados, faziam o escudo comprado sumir (caso do São Luiz FC na
    // Copa, 21/08). Tirar aqui protege qualquer tela nova que faça o mesmo.
    .replace(/\s*\((você|voce)\)\s*$/i, '')
    .replace(/\s+/g, ' ').trim()
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
  // cor travada por nome de clube vence tudo (Corinthians NUNCA sai verde,
  // nem que o nome também tenha uma palavra do DICIO com cor própria)
  const [c1, c2] = PALETAS[corTravada(alvo) ?? paletaFixa ?? (h % SORTEIO_PALETAS)]
  return {
    shape: (h >> 4) % SHAPES.length,
    pat: (h >> 8) % 7,
    c1, c2, sim,
    letra: (nome.trim()[0] ?? '?').toUpperCase(),
  }
}

// 🎮🐶 Eros FC (batismo do erosreis@outlook.com.br / @erosreis, aprovado pelo Diego
// 12/08): o Eros com o videogame retrô no escudo vermelho e cinza — ARTE PRÓPRIA do
// dono (imagem webp, exceção aprovada; ver nota no topo). Mesma arte vale pros 4
// nomes reservados do clube (Eros FC / Eros Reis FC / Eros Reis / Eros).
const erosEscudoRender = (size: number) => (
  <img
    src={erosEscudoImg}
    height={size}
    width={Math.round(size * 419 / 520)}
    alt="Eros FC"
    style={{ flex: 'none', display: 'block', objectFit: 'contain' }}
  />
)

// 🐝👑 Sapekeiros FC (batismo do tiosapeka@gmail.com / @tiosapekagg, aprovado pelo
// Diego 12/08): a logo REAL do clube (abelha coroada com a bola) — arte própria do
// dono (imagem webp redonda). Vale pros nomes 'Sapekeiros FC' e 'Sapekeiros'.
const sapekEscudoRender = (size: number) => (
  <img src={sapekEscudoImg} height={size} width={size} alt="Sapekeiros FC" style={{ flex: 'none', display: 'block', objectFit: 'contain', borderRadius: '50%' }} />
)

// 🏟️🇧🇷 Tricolor do Arruda (batismo do souzact12@gmail.com — Geovani GS).
// TROCA DE ESCUDO (16/08, 2ª arte do dono): saiu o escudo com a cobra na frente,
// entrou o ANEL DO ARRUDA visto de cima (arquibancada vermelha/preta/branca) com
// o "T" de Tricolor no meio do gramado. Arte enviada pelo próprio dono; aqui só
// tiramos o fundo quadriculado e reduzimos pra 360px (o escudo nunca aparece
// maior que 78px na tela, então 360 já é o dobro do necessário em retina).
// A cobra de cachimbo da 1ª arte CONTINUA sendo a mascote (mascotes.tsx,
// chave "cobra_arruda") — ela só não mora mais dentro do escudo.
const arrudaEscudoRender = (size: number) => (
  <img src={arrudaEscudoImg} height={size} width={Math.round(size * 304 / 360)} alt="Tricolor do Arruda" style={{ flex: 'none', display: 'block', objectFit: 'contain' }} />
)

// 🃏⚫⚪ Coringas do Diniz (lucas_calefi) — ex-Vanguarda Nacional, Série A. Arte
// enviada pelo próprio dono; aqui só tiramos o fundo quadriculado falso, cortamos
// no limite do desenho e reduzimos (o escudo nunca passa de 78px na tela).
const coringasEscudoRender = (size: number) => (
  <img src={coringasEscudoImg} height={size} width={Math.round(size * 219 / 248)} alt="Coringas do Diniz" style={{ flex: 'none', display: 'block', objectFit: 'contain' }} />
)

// 🦅🩵 Skyy FC (matheusncruz1) — ex-Fortuna SAF, Série D. Escudo azul-piscina com
// a águia de asas abertas segurando a bola, borda dourada. Arte enviada pelo
// próprio dono; aqui só tiramos o fundo quadriculado falso, cortamos no limite do
// desenho e reduzimos (o escudo nunca passa de 78px na tela, então 360 já é o
// dobro do necessário em retina).
const skyyEscudoRender = (size: number) => (
  <img src={skyyEscudoImg} height={size} width={Math.round(size * 348 / 360)} alt="Skyy FC" style={{ flex: 'none', display: 'block', objectFit: 'contain' }} />
)

// 🧢💙💛 Crias do Bigão (giovannecastro784) — ex-Ferroviária do Vale, Série B.
// Escudo azul/amarelo com a cara do próprio dono de boné e a faixa com o nome.
// Arte enviada pelo próprio dono; aqui só tiramos o fundo branco, cortamos no
// limite do desenho e reduzimos (o escudo nunca passa de 78px na tela).
const bigaoEscudoRender = (size: number) => (
  <img src={bigaoEscudoImg} height={size} width={Math.round(size * 302 / 360)} alt="Crias do Bigão" style={{ flex: 'none', display: 'block', objectFit: 'contain' }} />
)

// 📍⚫🟡 Futpoint FC (gfpicolo13) — SÓCIO, não batismo: o clube é o DELE, não
// substitui nenhum time de CPU da pirâmide (mesmo caso do Eros FC, Sapekeiros FC
// e Marinheiros AS). Escudo preto/dourado com o alfinete de mapa e a bola
// dentro, faixa com o nome e "EST. 2024". Arte enviada pelo próprio dono; aqui
// só tiramos o fundo branco, cortamos no limite do desenho e reduzimos (o
// escudo nunca passa de 78px na tela).
const futpointEscudoRender = (size: number) => (
  <img src={futpointEscudoImg} height={size} width={Math.round(size * 293 / 360)} alt="Futpoint FC" style={{ flex: 'none', display: 'block', objectFit: 'contain' }} />
)

// 🤡🟡⚫ Nata de SP (pedrinhocamisa8) — ex-Paris São Geraldo, Série D. Escudo
// amarelo/preto com o palhaço e faixas de risco; arte enviada pelo próprio dono,
// aqui só tiramos o fundo quadriculado falso, cortamos no limite do desenho e
// reduzimos (o escudo nunca passa de 78px na tela).
// 🐶 São Luiz FC — pitbull (coração Flamengo), vermelho/preto/branco. 283x279 no arquivo.
const saoluizEscudoRender = (size: number) => (
  <img src={saoluizEscudoImg} height={size} width={Math.round(size * 283 / 279)} alt="São Luiz FC" style={{ flex: 'none', display: 'block', objectFit: 'contain' }} />
)
// 🐺 Papão United Madrid — lobo chifrudo com tridente, azul-marinho e branco.
// 150x360 no arquivo (a largura sai da proporção REAL, nunca chutada).
// 📌 O dono mandou DUAS artes. A 1ª trazia escudo, fera e camisa grudados, com um
// xadrez falso preto+cinza por baixo — a haste da fera atravessava a borda do
// escudo e o Diego reprovou o resultado ("ficou ruim"). A 2ª (esta) veio com as
// três peças SEPARADAS e fundo branco: o escudo saiu inteiro, sem remendo nenhum.
// Conferido sobre fundo CREME, nunca sobre branco — "PAPÃO UNITED" e "DE MADRID"
// intactos, que foi o furo que ele pegou no Theuzudo.
const leaoEstradinhaRender = (size: number) => (
  <img src={leaoEstradinhaEscudoImg} height={size} width={Math.round(size * 287 / 360)} alt="Leão da Estradinha" style={{ flex: 'none', display: 'block', objectFit: 'contain' }} />
)
// 🏠🔴⚫ Esqueceram do Lluch FC (lluchmarcel81) — o escudo vermelho e preto com o
// menino esquecido em casa, o desenho da casa, o ladrão e a viatura. Arte própria
// do dono; aqui só tiramos o fundo escuro (recorte por GrabCut, porque o preto do
// desenho e o fundo eram parecidos demais pro corte por cor), cortamos no limite
// do desenho e reduzimos pra 360px (o escudo nunca passa de 78px na tela).
const lluchEscudoRender = (size: number) => (
  <img src={lluchEscudoImg} height={size} width={Math.round(size * 296 / 360)} alt="Esqueceram do Lluch FC" style={{ flex: 'none', display: 'block', objectFit: 'contain' }} />
)

const papaoEscudoRender = (size: number) => (
  <img src={papaoEscudoImg} height={size} width={Math.round(size * 150 / 263)} alt="Papão United Madrid" style={{ flex: 'none', display: 'block', objectFit: 'contain' }} />
)
// 🦇 Neymarzetti — o "N" de asa de morcego, prateado sobre preto. 360x299 no
// arquivo. Fundo tirado por INUNDAÇÃO a partir da borda (nunca "apaga todo
// branco"): assim o brilho claro do metal e o vinco do N ficaram inteiros.
// 🌽 Milhaça FC — brasão de raio amarelo sobre explosão vermelha. 308x360 no
// arquivo. A arte veio com fundo TRANSPARENTE de verdade (a 2ª que o dono
// mandou), mas com 29.597 px de POEIRA DE ALFA — o bbox cru mentiria, então o
// corte foi medido com alfa >= 40 e mínimo de 3 px por linha/coluna.
// Conferido sobre fundo CREME: as letras amarelas e o contorno preto inteiros.
const milhacaEscudoRender = (size: number) => (
  <img src={milhacaEscudoImg} height={size} width={Math.round(size * 308 / 360)} alt="Milhaça FC" style={{ flex: 'none', display: 'block', objectFit: 'contain' }} />
)
const neymarzettiEscudoRender = (size: number) => (
  <img src={neymarzettiEscudoImg} height={size} width={Math.round(size * 360 / 299)} alt="Neymarzetti" style={{ flex: 'none', display: 'block', objectFit: 'contain' }} />
)
// 🦇 Theuzudo FC — morcego (coração Valência), laranja e preto. 293x360 no arquivo.
const theuzudoEscudoRender = (size: number) => (
  <img src={theuzudoEscudoImg} height={size} width={Math.round(size * 293 / 360)} alt="Theuzudo FC" style={{ flex: 'none', display: 'block', objectFit: 'contain' }} />
)
const nataEscudoRender = (size: number) => (
  <img src={nataEscudoImg} height={size} width={Math.round(size * 312 / 360)} alt="Nata de SP" style={{ flex: 'none', display: 'block', objectFit: 'contain' }} />
)

// 🏎️⚽ Ferrari SC (batismo do adriano.ferrari, aprovado pelo Diego 14/08): a arte é
// o PILOTO dirigindo uma bola de futebol gigante — macacão vermelho, capacete do
// Brasil, bola com rodas de aro vermelho. Arte AUTORAL do jogo (NÃO usa marca: sem
// o cavalinho/emblema da Ferrari, que é registrado). A MESMA arte serve de escudo e
// de mascote (ver mascotes.tsx, chave "piloto_bola"). Desenhada em 0..200 x 0..200.
export function pilotBallSC(): ReactNode {
  return (
    <>
      <ellipse cx="100" cy="186" rx="74" ry="9" fill="rgba(0,0,0,.15)" />
      <path d="M55 168 H145" stroke="#141414" strokeWidth="8" />
      <circle cx="55" cy="168" r="17" fill="#141414" stroke="#0C0C0C" strokeWidth="5" /><circle cx="55" cy="168" r="10" fill="#C2452F" stroke="#0C0C0C" strokeWidth="2.5" /><circle cx="55" cy="168" r="3.5" fill="#CFCFCF" />
      <circle cx="145" cy="168" r="17" fill="#141414" stroke="#0C0C0C" strokeWidth="5" /><circle cx="145" cy="168" r="10" fill="#C2452F" stroke="#0C0C0C" strokeWidth="2.5" /><circle cx="145" cy="168" r="3.5" fill="#CFCFCF" />
      <circle cx="100" cy="130" r="52" fill="#F7F7F2" stroke="#0C0C0C" strokeWidth="6" />
      <path d="M100 106 l19 14 -8 22 h-22 l-8 -22 Z" fill="#141414" />
      <path d="M60 121 l15 3 3 17 -15 7 -12 -12 Z" fill="#141414" opacity=".92" />
      <path d="M140 121 l-15 3 -3 17 15 7 12 -12 Z" fill="#141414" opacity=".92" />
      <path d="M83 165 l7 -14 20 0 7 14 -17 9 Z" fill="#141414" opacity=".92" />
      <path d="M100 106 v-10 M119 120 l12 -7 M111 142 l13 10 M89 142 l-13 10 M81 120 l-12 -7" stroke="#141414" strokeWidth="3.2" />
      <path d="M78 108 Q76 82 100 78 Q124 82 122 108 Q112 103 100 103 Q88 103 78 108 Z" fill="#C2452F" stroke="#0C0C0C" strokeWidth="5" strokeLinejoin="round" />
      <path d="M87 84 H113" stroke="#FFC400" strokeWidth="5" strokeLinecap="round" />
      <circle cx="100" cy="96" r="7.5" fill="#F4ECD6" stroke="#0C0C0C" strokeWidth="3" />
      <path d="M100 92 l3.5 2.5 -1.3 4.3 h-4.4 l-1.3 -4.3 Z" fill="#141414" />
      <rect x="114" y="97" width="11" height="8.5" rx="1.5" fill="#1B7A3D" stroke="#0C0C0C" strokeWidth="1.6" />
      <path d="M119.5 98.5 l4 2.7 -4 2.7 -4 -2.7 Z" fill="#FFC400" /><circle cx="119.5" cy="101.2" r="1.6" fill="#1E4F9E" />
      <path d="M80 103 Q67 112 77 123" fill="none" stroke="#C2452F" strokeWidth="12" strokeLinecap="round" />
      <path d="M120 103 Q133 112 123 123" fill="none" stroke="#C2452F" strokeWidth="12" strokeLinecap="round" />
      <ellipse cx="100" cy="125" rx="24" ry="10" fill="none" stroke="#141414" strokeWidth="6.5" />
      <circle cx="100" cy="125" r="4.5" fill="#141414" />
      <path d="M100 125 L81 120 M100 125 L119 120 M100 125 V135" stroke="#141414" strokeWidth="4.5" />
      <circle cx="76" cy="123" r="7.5" fill="#141414" stroke="#0C0C0C" strokeWidth="3.5" />
      <circle cx="124" cy="123" r="7.5" fill="#141414" stroke="#0C0C0C" strokeWidth="3.5" />
      <path d="M78 56 Q78 30 100 30 Q122 30 122 56 L122 65 Q122 73 113 73 H87 Q78 73 78 65 Z" fill="#1B7A3D" stroke="#0C0C0C" strokeWidth="5.5" strokeLinejoin="round" />
      <path d="M80 51 H120" stroke="#FFC400" strokeWidth="8" />
      <path d="M82 56 H118 V66 Q118 70 111 70 H89 Q82 70 82 66 Z" fill="#1b2c66" stroke="#0C0C0C" strokeWidth="4.5" strokeLinejoin="round" />
      <path d="M82 55 H118" stroke="#FFC400" strokeWidth="3.5" />
      <path d="M85 61 q15 -5 30 0" stroke="#3f63c9" strokeWidth="3" fill="none" opacity=".8" />
      <path d="M91 71 Q100 77 109 71 Q100 74 91 71 Z" fill="#fff" stroke="#0C0C0C" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M100 32 l11 9 -11 9 -11 -9 Z" fill="#FFC400" stroke="#0C0C0C" strokeWidth="2.6" strokeLinejoin="round" />
      <circle cx="100" cy="41" r="4.4" fill="#1E4F9E" />
      <path d="M96 41 q4 -3 8 0" stroke="#fff" strokeWidth="1.6" fill="none" />
    </>
  )
}
// 🖼️ o escudo FINAL do Ferrari SC é a ARTE PRÓPRIA do dono (imagem webp) — o
// cavalo-piloto no carrinho de bola. (A pilotBallSC acima ficou como fallback em
// vetor, não é mais usada no render.)
const ferrariSCRender = (size: number) => (
  <img src={ferrariEscudoImg} height={size} width={size} alt="Ferrari SC" style={{ flex: 'none', display: 'block', objectFit: 'contain' }} />
)

// 🦁7️⃣ SEVEN CITY (batismo do glaucomiranda, Lenda fundador nº42, ex-Apogeu FC) —
// homenagem ao Seven Gamer (@sevengamersp): coroa + 7 dourado no azul-marinho.
const sevenCityRender = (size: number) => {
  const w = Math.round(size * 190 / 220)
  return (
    <svg width={w} height={size} viewBox="0 0 190 220" aria-label="Seven City" role="img" style={{ flex: 'none', display: 'block' }}>
      <path d="M55 38 L64 16 L80 32 L95 8 L110 32 L126 16 L135 38 Z" fill="#C9A227" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <rect x="55" y="36" width="80" height="10" rx="4" fill="#C9A227" stroke={INK} strokeWidth="4" />
      <path d="M30 58 Q95 44 160 58 L156 140 Q150 185 95 208 Q40 185 34 140 Z" fill="#C9A227" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
      <path d="M42 68 Q95 56 148 68 L145 138 Q139 175 95 194 Q51 175 45 138 Z" fill="#12256B" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <path d="M66 92 L128 92 L124 112 L98 174 L74 174 L100 114 L63 114 Z" fill="#C9A227" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
    </svg>
  )
}

// 💰 LOGOS ARTESANAIS (pagas): nome do time → desenho próprio, entra no lugar do
// automático. É só adicionar aqui quando alguém comprar.
export const LOGOS_PRONTAS: Record<string, (size: number) => ReactNode> = {
  // 🦁7️⃣ Seven City (glaucomiranda, Lenda fundador nº42, ex-Apogeu FC) — homenagem ao
  // Seven Gamer (@sevengamersp). Coroa + 7 dourado no escudo azul-marinho.
  // 🩹 15/08: registrado nos 3 nomes (o clube nasceu como "Seven FC" por engano e
  // ficou ~1h no ar) — assim nenhum save antigo cai no escudo automático.
  'Seven City': sevenCityRender,
  // 🏎️⚽ Ferrari SC (adriano) — piloto na bola (mesma arte da mascote), todos os nomes
  // 🐛 FIX 14/08 (relato do Diego: "logo não aparece"): o time DE VERDADE se chama
  // 'SC Ferrari' (data.ts, ex-Painitto FC) — o registro só tinha 'Ferrari SC'
  // (ordem trocada), então o lookup falhava e caía no escudo automático.
  'SC Ferrari': ferrariSCRender,
  // 🐝👑 Sapekeiros FC (Tio Sapeka) — mesmo escudo pros dois nomes
  'Sapekeiros FC': sapekEscudoRender,
  'Sapekeiros': sapekEscudoRender,
  // 🏟️🇧🇷 Tricolor do Arruda FC (souzact12) — ex-Legado EC, Série A. Os nomes
  // sem "FC" continuam registrados: quem pegou o save da 1ª hora não fica sem escudo.
  'Tricolor do Arruda FC': arrudaEscudoRender,
  'Tricolor do Arruda': arrudaEscudoRender,
  // 🃏⚫⚪ Coringas do Diniz (lucas_calefi) — ex-Vanguarda Nacional, Série A. O nome
  // velho fica registrado: quem já tinha carreira com o Vanguarda não fica sem escudo.
  'Coringas do Diniz': coringasEscudoRender,
  'Coringas do Diniz FC': coringasEscudoRender,
  // 🤡🟡⚫ Nata de SP (pedrinhocamisa8) — ex-Paris São Geraldo, Série D. O nome
  // velho fica registrado: quem já tinha carreira com o Paris não fica sem escudo.
  // 🐶🔴⚫ São Luiz FC (gabrielnegreirosamaral99) — ex-Flamengo do Sertão, Série D. O
  // nome velho fica registrado: quem já tinha carreira com o Flamengo do Sertão
  // não fica sem escudo.
  'São Luiz FC': saoluizEscudoRender,
  'São Luiz': saoluizEscudoRender,
  'São Luiz EC': saoluizEscudoRender,
  'Sao Luiz FC': saoluizEscudoRender,
  'Flamengo do Sertão': saoluizEscudoRender,
  // 🐺🔵⚪ Papão United Madrid (agrostinho88) — ex-Santos Dumont, Série D. O nome
  // velho fica registrado: quem já tinha carreira com o Santos Dumont não fica sem
  // escudo. As 4 formas do nome (regra 20/08) já estão reservadas no banco.
  // 🏠 Esqueceram do Lluch FC (lluchmarcel81) — ex-Litoral United, Série B.
  // As 4 formas do nome (regra do Diego 20/08) + o nome VELHO, que nunca fica
  // livre: save antigo com Litoral United mostra o escudo novo.
  'Esqueceram do Lluch FC': lluchEscudoRender,
  'Esqueceram do Lluch': lluchEscudoRender,
  'Esqueceram do Lluch EC': lluchEscudoRender,
  'Esqueceram do Lluch SC': lluchEscudoRender,
  'Litoral United': lluchEscudoRender,
  'Papão United Madrid': papaoEscudoRender,
  'Papão United Madrid FC': papaoEscudoRender,
  'Papão United Madrid EC': papaoEscudoRender,
  'Papao United Madrid': papaoEscudoRender,
  'Santos Dumont': papaoEscudoRender,
  // 🦇🟠⚫ Theuzudo FC (matheusfilipealves) — ex-Comercial do Norte, Série B. O nome
  // velho fica registrado: quem já tinha carreira com o Comercial não fica sem escudo.
  'Theuzudo FC': theuzudoEscudoRender,
  'Theuzudo': theuzudoEscudoRender,
  'Theuzudo EC': theuzudoEscudoRender,
  'Comercial do Norte': theuzudoEscudoRender,
  'Nata de SP': nataEscudoRender,
  'Nata de SP FC': nataEscudoRender,
  // 🦅🩵 Skyy FC (matheusncruz1) — ex-Fortuna SAF, Série D. O nome velho fica
  // registrado: quem já tinha carreira com o Fortuna não fica sem escudo.
  'Skyy FC': skyyEscudoRender,
  'Skyy': skyyEscudoRender,
  'Skyy FC SAF': skyyEscudoRender,
  // 🧢💙💛 Crias do Bigão (giovannecastro784) — ex-Ferroviária do Vale, Série B.
  // O nome velho fica registrado: quem já tinha carreira com a Ferroviária não
  // fica sem escudo.
  'Crias do Bigão': bigaoEscudoRender,
  'Crias do Bigao': bigaoEscudoRender,
  'Crias do Bigão FC': bigaoEscudoRender,
  // 📍⚫🟡 Futpoint FC (gfpicolo13) — SÓCIO com clube próprio (reserva de nome):
  // não tira o lugar de ninguém na pirâmide, o escudo aparece quando o dono usa
  // o nome dele. Só as variações do nome — nenhum clube de CPU entra aqui.
  'Futpoint FC': futpointEscudoRender,
  'Futpoint': futpointEscudoRender,
  'FutPoint FC': futpointEscudoRender,
  'Fut Point FC': futpointEscudoRender,
  // 🎮🐶 Eros FC + variações reservadas (todas puxam o MESMO escudo)
  'Eros FC': erosEscudoRender,
  'Eros Reis FC': erosEscudoRender,
  'Eros Reis': erosEscudoRender,
  // 🛡️🐈 Barcenite FC (batismo do ricardopessoafreire, Sócio Barão nº 12) —
  // aprovado pelo Diego 14/08: formato que LEMBRA o brasão do Barcelona (dois
  // "ombros" com vinco no topo — sem copiar nada do escudo real), topo azul com
  // BFC dourado, faixa dourada e base listrada amarelo/azul com a bola.
  // O nome velho (Milanesa FC) resolve sozinho via newestTeamName.
  'Barcenite FC': (size: number) => {
    const w = Math.round(size * 200 / 240)
    return (
      <svg width={w} height={size} viewBox="0 0 200 240" aria-label="Barcenite FC" role="img" style={{ flex: 'none', display: 'block' }}>
        <defs><clipPath id="bfcEscClip"><path d="M30 30 C30 18 45 14 58 16 C72 18 88 24 100 24 C112 24 128 18 142 16 C155 14 170 18 170 30 L171 118 C171 172 140 208 100 231 C60 208 29 172 29 118 Z"/></clipPath></defs>
        <path d="M30 30 C30 18 45 14 58 16 C72 18 88 24 100 24 C112 24 128 18 142 16 C155 14 170 18 170 30 L171 118 C171 172 140 208 100 231 C60 208 29 172 29 118 Z" fill="#0E3E86"/>
        <g clipPath="url(#bfcEscClip)">
          <text x="100" y="68" textAnchor="middle" fontFamily="Oswald,'Arial Narrow',sans-serif" fontWeight="700" fontSize="46" fill="#FFC400" letterSpacing="4">BFC</text>
          <rect x="0" y="84" width="200" height="26" fill="#FFC400"/>
          <rect x="0" y="84" width="200" height="26" fill="none" stroke={INK} strokeWidth="4"/>
          <rect x="29" y="110" width="28.4" height="130" fill="#FFC400"/>
          <rect x="57.4" y="110" width="28.4" height="130" fill="#0E3E86"/>
          <rect x="85.8" y="110" width="28.4" height="130" fill="#FFC400"/>
          <rect x="114.2" y="110" width="28.4" height="130" fill="#0E3E86"/>
          <rect x="142.6" y="110" width="28.4" height="130" fill="#FFC400"/>
          <circle cx="100" cy="162" r="26" fill="#fff" stroke={INK} strokeWidth="5"/>
          <path d="M100 148 L112 157 L107 171 L93 171 L88 157 Z" fill={INK}/>
        </g>
        <path d="M30 30 C30 18 45 14 58 16 C72 18 88 24 100 24 C112 24 128 18 142 16 C155 14 170 18 170 30 L171 118 C171 172 140 208 100 231 C60 208 29 172 29 118 Z" fill="none" stroke={INK} strokeWidth="7" strokeLinejoin="round"/>
      </svg>
    )
  },
  'Remoçada': (size: number) => {
    const w = Math.round(size * 200 / 240)
    return (
      <svg width={w} height={size} viewBox="0 0 200 240" aria-label="Remoçada" role="img" style={{ flex: 'none', display: 'block' }}>
        <defs><clipPath id="rmcEsc"><path d="M18 30 H182 V145 C182 188 138 214 100 234 C62 214 18 188 18 145 Z"/></clipPath></defs>
        <path d="M18 30 H182 V145 C182 188 138 214 100 234 C62 214 18 188 18 145 Z" fill="#12256B"/>
        <g clipPath="url(#rmcEsc)">
        <path d="M-20 150 L210 30 v42 L10 182 Z" fill="#1E3A9E" opacity=".5"/>
        <g stroke="#0C0C0C" strokeWidth="5" strokeLinejoin="round">
        <g transform="rotate(-27 100 122)">
        <rect x="95" y="66" width="10" height="96" rx="4" fill="#7A5230"/>
        <rect x="80" y="50" width="40" height="28" rx="8" fill="#C2CAD9"/>
        <rect x="80" y="50" width="40" height="10" rx="4" fill="#8B96AE"/>
        </g>
        <g transform="rotate(27 100 122)">
        <rect x="95" y="66" width="10" height="96" rx="4" fill="#7A5230"/>
        <rect x="80" y="50" width="40" height="28" rx="8" fill="#C2CAD9"/>
        <rect x="80" y="50" width="40" height="10" rx="4" fill="#8B96AE"/>
        </g>
        </g>
        </g>
        <path d="M18 30 H182 V145 C182 188 138 214 100 234 C62 214 18 188 18 145 Z" fill="none" stroke="#0C0C0C" strokeWidth="7" strokeLinejoin="round"/>
        <g stroke="#0C0C0C" strokeWidth="4.5" strokeLinejoin="round">
        <path d="M60 74 Q40 60 22 64 Q36 68 42 78 Q28 76 18 84 Q36 88 58 84 Z" fill="#EDEFF5"/>
        <path d="M140 74 Q160 60 178 64 Q164 68 158 78 Q172 76 182 84 Q164 88 142 84 Z" fill="#EDEFF5"/>
        </g>
        <g clipPath="url(#rmcEsc)">
        <path d="M100 66
        L124 60 118 78 138 74 128 92 150 96 132 108 148 120 128 124 138 142 118 136 116 154 100 146
        84 154 82 136 62 142 72 124 52 120 68 108 50 96 72 92 62 74 82 78 76 60 Z"
        fill="#B4732A" stroke="#0C0C0C" strokeWidth="5" strokeLinejoin="round"/>
        <ellipse cx="100" cy="108" rx="33" ry="31" fill="#E4A950" stroke="#0C0C0C" strokeWidth="5"/>
        <circle cx="74" cy="92" r="9" fill="#B4732A" stroke="#0C0C0C" strokeWidth="4.5"/>
        <circle cx="126" cy="92" r="9" fill="#B4732A" stroke="#0C0C0C" strokeWidth="4.5"/>
        <path d="M66 98 Q100 72 134 98 L130 106 Q100 86 70 106 Z" fill="#C7CEDB" stroke="#0C0C0C" strokeWidth="4.5" strokeLinejoin="round"/>
        <path d="M100 76 L100 98" stroke="#0C0C0C" strokeWidth="4.5"/>
        <ellipse cx="100" cy="126" rx="17" ry="13" fill="#F2E4C4" stroke="#0C0C0C" strokeWidth="3.5"/>
        <path d="M84 110 L96 114" stroke="#0C0C0C" strokeWidth="5" strokeLinecap="round"/>
        <path d="M116 110 L104 114" stroke="#0C0C0C" strokeWidth="5" strokeLinecap="round"/>
        <circle cx="90" cy="117" r="4.5" fill="#0C0C0C"/><circle cx="110" cy="117" r="4.5" fill="#0C0C0C"/>
        <path d="M93 122 Q100 118 107 122 Q105 130 100 130 Q95 130 93 122 Z" fill="#3A2410" stroke="#0C0C0C" strokeWidth="3" strokeLinejoin="round"/>
        <path d="M100 130 L100 136 M100 136 Q92 139 88 133 M100 136 Q108 139 112 133" stroke="#0C0C0C" strokeWidth="3.2" fill="none" strokeLinecap="round"/>
        </g>
        <path d="M26 180 H174 L164 200 H36 Z" fill="#0D1B52" stroke="#0C0C0C" strokeWidth="5" strokeLinejoin="round"/>
        <text x="100" y="196" fontFamily="Oswald, sans-serif" fontWeight="700" fontSize="22" fill="#FFFFFF" textAnchor="middle" letterSpacing="1">REMOÇADA</text>
      </svg>
    )
  },
  // 🛡️🌱 Marolados FC (batismo do paisagensetrilha — Lenda + fundador, aprovado 11/08):
  // a molecada da várzea. Cabeça do moleque RASTAFARI (dreadlocks + touca rasta) no
  // escudo verde ("AQUI É RAIZ") + fumaça. ex-Real Madruga (Série D). SVG + mini.
  'Marolados FC': (size: number) => {
    const mini = size < 40
    const w = Math.round(size * 200 / 240)
    return (
      <svg width={w} height={size} viewBox="0 0 200 240" aria-label="Marolados FC" role="img" style={{ flex: 'none', display: 'block' }}>
        <defs><clipPath id="mrS"><path d="M18 30 H182 V145 C182 188 138 214 100 234 C62 214 18 188 18 145 Z" /></clipPath></defs>
        {mini ? (
          <><path d="M18 30 H182 V145 C182 188 138 214 100 234 C62 214 18 188 18 145 Z" fill="#0E5A2B"/><g clipPath="url(#mrS)"><path d="M-20 150 L210 30 v42 L10 182 Z" fill="#2E9E5B" opacity=".45"/><path d="M18 176 H182 V196 H18 Z" fill="#0E5A2B"/></g><g clipPath="url(#mrS)"><g transform="translate(100 122) scale(1.25) translate(-100 -92)">
      
      <g stroke="#16110E" strokeWidth="10" strokeLinecap="round" fill="none">
        <path d="M58 70 q-12 20 -4 40 q6 16 0 34"/>
        <path d="M72 66 q-12 18 -6 38 q5 16 -1 32"/>
        <path d="M142 70 q12 20 4 40 q-6 16 0 34"/>
        <path d="M128 66 q12 18 6 38 q-5 16 1 32"/>
      </g>
      <g fill="#C2452F" stroke="#141414" strokeWidth="2">
        <circle cx="54" cy="146" r="4.5"/><circle cx="146" cy="146" r="4.5"/>
      </g>
      <g fill="#FFC400" stroke="#141414" strokeWidth="2">
        <circle cx="71" cy="138" r="4"/><circle cx="129" cy="138" r="4"/>
      </g>
      
      <circle cx="100" cy="92" r="40" fill="#B07A4E" stroke="#141414" strokeWidth="6"/>
      <ellipse cx="62" cy="94" rx="7" ry="9" fill="#B07A4E" stroke="#141414" strokeWidth="5"/>
      <ellipse cx="138" cy="94" rx="7" ry="9" fill="#B07A4E" stroke="#141414" strokeWidth="5"/>
      
      <path d="M58 80 Q58 44 100 42 Q142 44 142 80 Q100 71 58 80 Z" fill="#1B7A3D" stroke="#141414" strokeWidth="6" strokeLinejoin="round"/>
      <path d="M62 66 Q62 50 100 48 Q138 50 138 66 Q100 59 62 66 Z" fill="#FFC400" stroke="#141414" strokeWidth="3" strokeLinejoin="round"/>
      <path d="M68 55 Q68 45 100 44 Q132 45 132 55 Q100 50 68 55 Z" fill="#C2452F" stroke="#141414" strokeWidth="3" strokeLinejoin="round"/>
      <path d="M56 78 Q100 88 144 78 L142 86 Q100 96 58 86 Z" fill="#1B7A3D" stroke="#141414" strokeWidth="6" strokeLinejoin="round"/>
      <circle cx="100" cy="42" r="5" fill="#FFC400" stroke="#141414" strokeWidth="3"/>
      
      <path d="M74 94 q10 8 20 0" stroke="#141414" strokeWidth="5" fill="none" strokeLinecap="round"/>
      <path d="M106 94 q10 8 20 0" stroke="#141414" strokeWidth="5" fill="none" strokeLinecap="round"/>
      <circle cx="84" cy="97" r="3" fill="#141414"/><circle cx="116" cy="97" r="3" fill="#141414"/>
      
      <path d="M86 110 Q100 120 114 110" stroke="#141414" strokeWidth="5" fill="none" strokeLinecap="round"/>
      <path d="M97 122 q3 7 6 0 q-3 9 -6 0 Z" fill="#16110E"/>
    </g></g><path d="M18 30 H182 V145 C182 188 138 214 100 234 C62 214 18 188 18 145 Z" fill="none" stroke="#141414" strokeWidth="9" strokeLinejoin="round"/></>
        ) : (
          <><path d="M18 30 H182 V145 C182 188 138 214 100 234 C62 214 18 188 18 145 Z" fill="#0E5A2B"/><g clipPath="url(#mrS)"><path d="M-20 150 L210 30 v42 L10 182 Z" fill="#2E9E5B" opacity=".45"/><path d="M18 176 H182 V196 H18 Z" fill="#0E5A2B"/></g><g clipPath="url(#mrS)"><path d="M70 150 q-21.0 -15.0 -3.0 -33.0 q18.0 -15.0 -3.0 -33.0 q-18.0 -12.0 3.0 -30.0" fill="none" stroke="#EAF0E7" strokeWidth="10.5" strokeLinecap="round" opacity="0.7"/><path d="M132 150 q-22.400000000000002 -16.0 -3.2 -35.2 q19.200000000000003 -16.0 -3.2 -35.2 q-19.200000000000003 -12.8 3.2 -32.0" fill="none" stroke="#EAF0E7" strokeWidth="11.200000000000001" strokeLinecap="round" opacity="0.7"/><path d="M100 120 q-18.2 -13.0 -2.6 -28.6 q15.600000000000001 -13.0 -2.6 -28.6 q-15.600000000000001 -10.4 2.6 -26.0" fill="none" stroke="#EAF0E7" strokeWidth="9.1" strokeLinecap="round" opacity="0.55"/></g><g clipPath="url(#mrS)"><g transform="translate(100 118) scale(1.06) translate(-100 -92)">
      
      <g stroke="#16110E" strokeWidth="10" strokeLinecap="round" fill="none">
        <path d="M58 70 q-12 20 -4 40 q6 16 0 34"/>
        <path d="M72 66 q-12 18 -6 38 q5 16 -1 32"/>
        <path d="M142 70 q12 20 4 40 q-6 16 0 34"/>
        <path d="M128 66 q12 18 6 38 q-5 16 1 32"/>
      </g>
      <g fill="#C2452F" stroke="#141414" strokeWidth="2">
        <circle cx="54" cy="146" r="4.5"/><circle cx="146" cy="146" r="4.5"/>
      </g>
      <g fill="#FFC400" stroke="#141414" strokeWidth="2">
        <circle cx="71" cy="138" r="4"/><circle cx="129" cy="138" r="4"/>
      </g>
      
      <circle cx="100" cy="92" r="40" fill="#B07A4E" stroke="#141414" strokeWidth="6"/>
      <ellipse cx="62" cy="94" rx="7" ry="9" fill="#B07A4E" stroke="#141414" strokeWidth="5"/>
      <ellipse cx="138" cy="94" rx="7" ry="9" fill="#B07A4E" stroke="#141414" strokeWidth="5"/>
      
      <path d="M58 80 Q58 44 100 42 Q142 44 142 80 Q100 71 58 80 Z" fill="#1B7A3D" stroke="#141414" strokeWidth="6" strokeLinejoin="round"/>
      <path d="M62 66 Q62 50 100 48 Q138 50 138 66 Q100 59 62 66 Z" fill="#FFC400" stroke="#141414" strokeWidth="3" strokeLinejoin="round"/>
      <path d="M68 55 Q68 45 100 44 Q132 45 132 55 Q100 50 68 55 Z" fill="#C2452F" stroke="#141414" strokeWidth="3" strokeLinejoin="round"/>
      <path d="M56 78 Q100 88 144 78 L142 86 Q100 96 58 86 Z" fill="#1B7A3D" stroke="#141414" strokeWidth="6" strokeLinejoin="round"/>
      <circle cx="100" cy="42" r="5" fill="#FFC400" stroke="#141414" strokeWidth="3"/>
      
      <path d="M74 94 q10 8 20 0" stroke="#141414" strokeWidth="5" fill="none" strokeLinecap="round"/>
      <path d="M106 94 q10 8 20 0" stroke="#141414" strokeWidth="5" fill="none" strokeLinecap="round"/>
      <circle cx="84" cy="97" r="3" fill="#141414"/><circle cx="116" cy="97" r="3" fill="#141414"/>
      
      <path d="M86 110 Q100 120 114 110" stroke="#141414" strokeWidth="5" fill="none" strokeLinecap="round"/>
      <path d="M97 122 q3 7 6 0 q-3 9 -6 0 Z" fill="#16110E"/>
    </g></g><text x="100" y="190" textAnchor="middle" fontFamily="Oswald, Arial, sans-serif" fontWeight="800" fontSize="13.5" letterSpacing="1" fill="#ffffff">AQUI É RAIZ</text><path d="M18 30 H182 V145 C182 188 138 214 100 234 C62 214 18 188 18 145 Z" fill="none" stroke="#141414" strokeWidth="7" strokeLinejoin="round"/></>
        )}
      </svg>
    )
  },
  // 🛡️ Deportivo Montreal (batismo do nevesgabriel95 — Lenda + fundador, aprovado 11/08):
  // recriação do escudo verde (estrela-bússola + faixas DEPORTIVO/MONTREAL + 2026 + bola),
  // ex-Titan Capital (Série A). SVG estilo da casa, com versão MINI pra tabela.
  'Deportivo Montreal': (size: number) => {
    const mini = size < 40
    const w = Math.round(size * 200 / 240)
    return (
      <svg width={w} height={size} viewBox="0 0 200 240" aria-label="Deportivo Montreal" role="img" style={{ flex: 'none', display: 'block' }}>
        <defs><clipPath id="dmS"><path d="M100 20 L174 38 C178 92 176 140 166 168 C154 200 130 222 100 232 C70 222 46 200 34 168 C24 140 22 92 26 38 Z" /></clipPath></defs>
        {mini ? (
          <><path d="M100 20 L174 38 C178 92 176 140 166 168 C154 200 130 222 100 232 C70 222 46 200 34 168 C24 140 22 92 26 38 Z" fill="#0C0C0C"/><g transform="translate(100 126) scale(0.955) translate(-100 -126)"><path d="M100 20 L174 38 C178 92 176 140 166 168 C154 200 130 222 100 232 C70 222 46 200 34 168 C24 140 22 92 26 38 Z" fill="#ffffff"/></g><g transform="translate(100 126) scale(0.90) translate(-100 -126)"><path d="M100 20 L174 38 C178 92 176 140 166 168 C154 200 130 222 100 232 C70 222 46 200 34 168 C24 140 22 92 26 38 Z" fill="#1BA34C"/></g><g clipPath="url(#dmS)"><path d="M100.0 32.0 L110.7 98.1 L165.1 58.9 L125.9 113.3 L192.0 124.0 L125.9 134.7 L165.1 189.1 L110.7 149.9 L100.0 216.0 L89.3 149.9 L34.9 189.1 L74.1 134.7 L8.0 124.0 L74.1 113.3 L34.9 58.9 L89.3 98.1 Z" fill="#ffffff" stroke="#0C0C0C" strokeWidth="2.5" strokeLinejoin="round" opacity=".97"/></g><g transform="translate(100 126) scale(0.90) translate(-100 -126)"><path d="M100 20 L174 38 C178 92 176 140 166 168 C154 200 130 222 100 232 C70 222 46 200 34 168 C24 140 22 92 26 38 Z" fill="none" stroke="#0C0C0C" strokeWidth="3"/></g><circle cx="100" cy="190" r="26" fill="#ffffff" stroke="#0C0C0C" strokeWidth="3"/><path d="M100.0 181.2 L108.4 187.3 L105.2 197.2 L94.8 197.2 L91.6 187.3 Z" fill="#0C0C0C"/><path d="M100.0 181.2 L100.0 166.1" stroke="#0C0C0C" strokeWidth="2.4"/><circle cx="113.1" cy="171.9" r="4.2" fill="#0C0C0C"/><path d="M108.4 187.3 L122.7 182.6" stroke="#0C0C0C" strokeWidth="2.4"/><circle cx="121.3" cy="196.9" r="4.2" fill="#0C0C0C"/><path d="M105.2 197.2 L114.1 209.4" stroke="#0C0C0C" strokeWidth="2.4"/><circle cx="100.0" cy="212.4" r="4.2" fill="#0C0C0C"/><path d="M94.8 197.2 L85.9 209.4" stroke="#0C0C0C" strokeWidth="2.4"/><circle cx="78.7" cy="196.9" r="4.2" fill="#0C0C0C"/><path d="M91.6 187.3 L77.3 182.6" stroke="#0C0C0C" strokeWidth="2.4"/><circle cx="86.9" cy="171.9" r="4.2" fill="#0C0C0C"/><circle cx="100" cy="190" r="26" fill="none" stroke="#0C0C0C" strokeWidth="3"/></>
        ) : (
          <><path d="M100 20 L174 38 C178 92 176 140 166 168 C154 200 130 222 100 232 C70 222 46 200 34 168 C24 140 22 92 26 38 Z" fill="#0C0C0C"/><g transform="translate(100 126) scale(0.955) translate(-100 -126)"><path d="M100 20 L174 38 C178 92 176 140 166 168 C154 200 130 222 100 232 C70 222 46 200 34 168 C24 140 22 92 26 38 Z" fill="#ffffff"/></g><g transform="translate(100 126) scale(0.90) translate(-100 -126)"><path d="M100 20 L174 38 C178 92 176 140 166 168 C154 200 130 222 100 232 C70 222 46 200 34 168 C24 140 22 92 26 38 Z" fill="#1BA34C"/></g><g clipPath="url(#dmS)"><path d="M100.0 32.0 L110.7 98.1 L165.1 58.9 L125.9 113.3 L192.0 124.0 L125.9 134.7 L165.1 189.1 L110.7 149.9 L100.0 216.0 L89.3 149.9 L34.9 189.1 L74.1 134.7 L8.0 124.0 L74.1 113.3 L34.9 58.9 L89.3 98.1 Z" fill="#ffffff" stroke="#0C0C0C" strokeWidth="2.5" strokeLinejoin="round" opacity=".97"/></g><g transform="translate(100 126) scale(0.90) translate(-100 -126)"><path d="M100 20 L174 38 C178 92 176 140 166 168 C154 200 130 222 100 232 C70 222 46 200 34 168 C24 140 22 92 26 38 Z" fill="none" stroke="#0C0C0C" strokeWidth="3"/></g><text x="100" y="49" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontWeight="700" fontSize="23" letterSpacing="4" paintOrder="stroke" stroke="#ffffff" strokeWidth="5" strokeLinejoin="round" fill="#0C0C0C">2026</text><circle cx="100" cy="196" r="22" fill="#ffffff" stroke="#0C0C0C" strokeWidth="3"/><path d="M100.0 188.5 L107.1 193.7 L104.4 202.1 L95.6 202.1 L92.9 193.7 Z" fill="#0C0C0C"/><path d="M100.0 188.5 L100.0 175.8" stroke="#0C0C0C" strokeWidth="2.4"/><circle cx="111.1" cy="180.7" r="3.5" fill="#0C0C0C"/><path d="M107.1 193.7 L119.2 189.7" stroke="#0C0C0C" strokeWidth="2.4"/><circle cx="118.0" cy="201.8" r="3.5" fill="#0C0C0C"/><path d="M104.4 202.1 L111.9 212.4" stroke="#0C0C0C" strokeWidth="2.4"/><circle cx="100.0" cy="214.9" r="3.5" fill="#0C0C0C"/><path d="M95.6 202.1 L88.1 212.4" stroke="#0C0C0C" strokeWidth="2.4"/><circle cx="82.0" cy="201.8" r="3.5" fill="#0C0C0C"/><path d="M92.9 193.7 L80.8 189.7" stroke="#0C0C0C" strokeWidth="2.4"/><circle cx="88.9" cy="180.7" r="3.5" fill="#0C0C0C"/><circle cx="100" cy="196" r="22" fill="none" stroke="#0C0C0C" strokeWidth="3"/><g transform="rotate(-8 100 96)"><path d="M14 82 Q100 74 186 82 L182 110 Q100 102 18 110 Z" fill="#ffffff" stroke="#0C0C0C" strokeWidth="4" strokeLinejoin="round"/><path d="M14 82 l-8 8 l10 8 Z M186 82 l8 8 l-10 8 Z" fill="#ffffff" stroke="#0C0C0C" strokeWidth="3.5" strokeLinejoin="round"/><text x="100" y="102" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontWeight="700" fontSize="21" letterSpacing="2" fill="#0C0C0C">DEPORTIVO</text></g><g transform="rotate(6 100 140)"><path d="M14 126 Q100 118 186 126 L182 154 Q100 146 18 154 Z" fill="#ffffff" stroke="#0C0C0C" strokeWidth="4" strokeLinejoin="round"/><path d="M14 126 l-8 8 l10 8 Z M186 126 l8 8 l-10 8 Z" fill="#ffffff" stroke="#0C0C0C" strokeWidth="3.5" strokeLinejoin="round"/><text x="100" y="146" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontWeight="700" fontSize="21" letterSpacing="2" fill="#0C0C0C">MONTREAL</text></g></>
        )}
      </svg>
    )
  },
  // 🦍🦂 Scorporila FC (batismo do lucassrribeiroo2023 — Lenda, aprovado pelo Diego 11/08):
  // GORILA rugindo (silverback preto, máscara facial cinza) fundido com ESCORPIÃO
  // (cauda dourada segmentada + ferrão vermelho + pinças), sobre listras P&B do
  // Santos. Vetor leve estilo Nightfull, com versão MINI pra tabela. Ex-Realeza FC.
  'Scorporila FC': (size: number) => {
    const mini = size < 40
    const w = Math.round(size * 200 / 240)
    return (
      <svg width={w} height={size} viewBox="0 0 200 240" aria-label="Scorporila FC" role="img" style={{ flex: 'none', display: 'block' }}>
        <defs><clipPath id="sclS"><path d="M18 30 H182 V145 C182 188 138 214 100 234 C62 214 18 188 18 145 Z" /></clipPath></defs>
        {mini ? (
          <><path d="M18 30 H182 V145 C182 188 138 214 100 234 C62 214 18 188 18 145 Z" fill="#ffffff"/><g clipPath="url(#sclS)"><rect x="18" y="10" width="19" height="240" fill="#141414"/><rect x="56" y="10" width="19" height="240" fill="#141414"/><rect x="94" y="10" width="19" height="240" fill="#141414"/><rect x="132" y="10" width="19" height="240" fill="#141414"/><rect x="170" y="10" width="19" height="240" fill="#141414"/></g><g transform="translate(58 168) rotate(-24) scale(0.86 0.86)"><path d="M6 2 Q-16 8 -28 0" fill="none" stroke="#FFC400" strokeWidth="12" strokeLinecap="round"/><circle cx="4" cy="2" r="5.5" fill="#E8A200" stroke="#141414" strokeWidth="3.5"/><ellipse cx="-38" cy="-3" rx="17" ry="13" fill="#FFC400" stroke="#141414" strokeWidth="7"/><path d="M-46 -12 C-70 -28 -92 -28 -104 -16 C-88 -14 -73 -10 -52 -3 Z" fill="#FFC400" stroke="#141414" strokeWidth="7" strokeLinejoin="round"/><path d="M-46 8 C-68 22 -90 22 -100 10 C-85 6 -71 4 -50 1 Z" fill="#E8A200" stroke="#141414" strokeWidth="7" strokeLinejoin="round"/></g><g transform="translate(142 168) rotate(24) scale(-0.86 0.86)"><path d="M6 2 Q-16 8 -28 0" fill="none" stroke="#FFC400" strokeWidth="12" strokeLinecap="round"/><circle cx="4" cy="2" r="5.5" fill="#E8A200" stroke="#141414" strokeWidth="3.5"/><ellipse cx="-38" cy="-3" rx="17" ry="13" fill="#FFC400" stroke="#141414" strokeWidth="7"/><path d="M-46 -12 C-70 -28 -92 -28 -104 -16 C-88 -14 -73 -10 -52 -3 Z" fill="#FFC400" stroke="#141414" strokeWidth="7" strokeLinejoin="round"/><path d="M-46 8 C-68 22 -90 22 -100 10 C-85 6 -71 4 -50 1 Z" fill="#E8A200" stroke="#141414" strokeWidth="7" strokeLinejoin="round"/></g><g transform="translate(100 116) scale(0.86) translate(-100 -120)"><path d="M52 150 C43 120 47 90 62 76 C70 56 84 48 100 48 C116 48 130 56 138 76 C153 90 157 120 148 150 C141 178 121 192 100 192 C79 192 59 178 52 150 Z" fill="none" stroke="#FFC400" strokeWidth="15" strokeLinejoin="round"/><circle cx="49" cy="108" r="13" fill="#1D1D20" stroke="#141414" strokeWidth="8"/><circle cx="151" cy="108" r="13" fill="#1D1D20" stroke="#141414" strokeWidth="8"/><path d="M52 150 C43 120 47 90 62 76 C70 56 84 48 100 48 C116 48 130 56 138 76 C153 90 157 120 148 150 C141 178 121 192 100 192 C79 192 59 178 52 150 Z" fill="#1D1D20" stroke="#141414" strokeWidth="8" strokeLinejoin="round"/><path d="M66 92 C64 78 80 70 100 70 C120 70 136 78 134 92 C138 112 132 138 116 158 C108 170 100 176 100 176 C100 176 92 170 84 158 C68 138 62 112 66 92 Z" fill="#A2A8AE" stroke="#141414" strokeWidth="6.5" strokeLinejoin="round"/><path d="M66 96 Q84 84 98 96 L100 100 L102 96 Q116 84 134 96 L130 106 Q116 98 102 106 L100 108 L98 106 Q84 98 70 106 Z" fill="#1D1D20" stroke="#141414" strokeWidth="6" strokeLinejoin="round"/><path d="M74 108 Q84 102 95 110 Q86 118 76 114 Z" fill="#FFC400" stroke="#141414" strokeWidth="3" strokeLinejoin="round"/><path d="M126 108 Q116 102 105 110 Q114 118 124 114 Z" fill="#FFC400" stroke="#141414" strokeWidth="3" strokeLinejoin="round"/><circle cx="84" cy="111" r="3.2" fill="#141414"/><circle cx="116" cy="111" r="3.2" fill="#141414"/><path d="M82 120 Q100 112 118 120 Q122 134 100 140 Q78 134 82 120 Z" fill="#6C727A" stroke="#141414" strokeWidth="6" strokeLinejoin="round"/><ellipse cx="91" cy="126" rx="3.4" ry="4.6" fill="#141414"/><ellipse cx="109" cy="126" rx="3.4" ry="4.6" fill="#141414"/><path d="M100 118 L100 128" stroke="#4A4F55" strokeWidth="2.5" strokeLinecap="round"/><path d="M76 146 Q100 137 124 146 Q126 168 100 177 Q74 168 76 146 Z" fill="#5E120E" stroke="#141414" strokeWidth="7" strokeLinejoin="round"/><path d="M78 146 Q100 139 122 146 L121 154 Q100 148 79 154 Z" fill="#ffffff" stroke="#141414" strokeWidth="2"/><path d="M80 152 L84 164 L90 153 Z" fill="#ffffff" stroke="#141414" strokeWidth="2" strokeLinejoin="round"/><path d="M120 152 L116 164 L110 153 Z" fill="#ffffff" stroke="#141414" strokeWidth="2" strokeLinejoin="round"/><path d="M90 176 L93 167 L97 176 Z" fill="#ffffff" stroke="#141414" strokeWidth="2" strokeLinejoin="round"/><path d="M110 176 L107 167 L103 176 Z" fill="#ffffff" stroke="#141414" strokeWidth="2" strokeLinejoin="round"/><ellipse cx="100" cy="170" rx="7" ry="4.5" fill="#C2452F" opacity=".9"/></g><g clipPath="url(#sclS)"><circle cx="150.0" cy="180.0" r="15.0" fill="#FFC400" stroke="#141414" strokeWidth="7"/><circle cx="145.5" cy="174.8" r="4.5" fill="#ffffff" opacity=".55"/><circle cx="159.7" cy="144.2" r="14.0" fill="#FFC400" stroke="#141414" strokeWidth="7"/><circle cx="155.5" cy="139.3" r="4.2" fill="#ffffff" opacity=".55"/><circle cx="162.6" cy="114.5" r="13.0" fill="#FFC400" stroke="#141414" strokeWidth="7"/><circle cx="158.7" cy="110.0" r="3.9" fill="#ffffff" opacity=".55"/><circle cx="158.6" cy="91.0" r="12.0" fill="#FFC400" stroke="#141414" strokeWidth="7"/><circle cx="155.0" cy="86.8" r="3.6" fill="#ffffff" opacity=".55"/><circle cx="147.7" cy="73.6" r="11.0" fill="#FFC400" stroke="#141414" strokeWidth="7"/><circle cx="144.4" cy="69.7" r="3.3" fill="#ffffff" opacity=".55"/><circle cx="130.0" cy="62.2" r="10.0" fill="#FFC400" stroke="#141414" strokeWidth="7"/><circle cx="127.0" cy="58.7" r="3.0" fill="#ffffff" opacity=".55"/><circle cx="105.4" cy="57.1" r="9.0" fill="#FFC400" stroke="#141414" strokeWidth="7"/><circle cx="102.7" cy="53.9" r="2.7" fill="#ffffff" opacity=".55"/><circle cx="74.0" cy="58.0" r="8.0" fill="#FFC400" stroke="#141414" strokeWidth="7"/><circle cx="71.6" cy="55.2" r="2.4" fill="#ffffff" opacity=".55"/><ellipse cx="74.0" cy="58.0" rx="14.0" ry="16.0" fill="#E8A200" stroke="#141414" strokeWidth="7"/><path d="M72.0 45.0 Q56.0 32.0 46.0 44.0 Q58.0 46.0 69.0 60.0 Z" fill="#E8503A" stroke="#141414" strokeWidth="6.5" strokeLinejoin="round"/></g><path d="M18 30 H182 V145 C182 188 138 214 100 234 C62 214 18 188 18 145 Z" fill="none" stroke="#141414" strokeWidth="9" strokeLinejoin="round"/></>
        ) : (
          <><path d="M18 30 H182 V145 C182 188 138 214 100 234 C62 214 18 188 18 145 Z" fill="#ffffff"/><g clipPath="url(#sclS)"><rect x="18" y="10" width="19" height="240" fill="#141414"/><rect x="56" y="10" width="19" height="240" fill="#141414"/><rect x="94" y="10" width="19" height="240" fill="#141414"/><rect x="132" y="10" width="19" height="240" fill="#141414"/><rect x="170" y="10" width="19" height="240" fill="#141414"/></g><g transform="translate(56 170) rotate(-22) scale(0.9 0.9)"><path d="M6 2 Q-16 8 -28 0" fill="none" stroke="#FFC400" strokeWidth="12" strokeLinecap="round"/><circle cx="4" cy="2" r="5.5" fill="#E8A200" stroke="#141414" strokeWidth="3.5"/><ellipse cx="-38" cy="-3" rx="17" ry="13" fill="#FFC400" stroke="#141414" strokeWidth="5"/><path d="M-46 -12 C-70 -28 -92 -28 -104 -16 C-88 -14 -73 -10 -52 -3 Z" fill="#FFC400" stroke="#141414" strokeWidth="5" strokeLinejoin="round"/><path d="M-46 8 C-68 22 -90 22 -100 10 C-85 6 -71 4 -50 1 Z" fill="#E8A200" stroke="#141414" strokeWidth="5" strokeLinejoin="round"/></g><g transform="translate(144 170) rotate(22) scale(-0.9 0.9)"><path d="M6 2 Q-16 8 -28 0" fill="none" stroke="#FFC400" strokeWidth="12" strokeLinecap="round"/><circle cx="4" cy="2" r="5.5" fill="#E8A200" stroke="#141414" strokeWidth="3.5"/><ellipse cx="-38" cy="-3" rx="17" ry="13" fill="#FFC400" stroke="#141414" strokeWidth="5"/><path d="M-46 -12 C-70 -28 -92 -28 -104 -16 C-88 -14 -73 -10 -52 -3 Z" fill="#FFC400" stroke="#141414" strokeWidth="5" strokeLinejoin="round"/><path d="M-46 8 C-68 22 -90 22 -100 10 C-85 6 -71 4 -50 1 Z" fill="#E8A200" stroke="#141414" strokeWidth="5" strokeLinejoin="round"/></g><g transform="translate(0 6)"><g transform="translate(100 120) scale(0.82) translate(-100 -120)"><path d="M52 150 C43 120 47 90 62 76 C70 56 84 48 100 48 C116 48 130 56 138 76 C153 90 157 120 148 150 C141 178 121 192 100 192 C79 192 59 178 52 150 Z" fill="none" stroke="#FFC400" strokeWidth="13" strokeLinejoin="round"/><circle cx="49" cy="108" r="13" fill="#1D1D20" stroke="#141414" strokeWidth="6"/><circle cx="151" cy="108" r="13" fill="#1D1D20" stroke="#141414" strokeWidth="6"/><path d="M52 150 C43 120 47 90 62 76 C70 56 84 48 100 48 C116 48 130 56 138 76 C153 90 157 120 148 150 C141 178 121 192 100 192 C79 192 59 178 52 150 Z" fill="#1D1D20" stroke="#141414" strokeWidth="6" strokeLinejoin="round"/><path d="M66 92 C64 78 80 70 100 70 C120 70 136 78 134 92 C138 112 132 138 116 158 C108 170 100 176 100 176 C100 176 92 170 84 158 C68 138 62 112 66 92 Z" fill="#A2A8AE" stroke="#141414" strokeWidth="4.5" strokeLinejoin="round"/><path d="M84 60 Q100 52 116 60" stroke="#141414" strokeWidth="3" fill="none" opacity=".5"/><path d="M72 78 Q80 70 90 74 M128 78 Q120 70 110 74" stroke="#6C727A" strokeWidth="2.5" fill="none" opacity=".6"/><path d="M66 96 Q84 84 98 96 L100 100 L102 96 Q116 84 134 96 L130 106 Q116 98 102 106 L100 108 L98 106 Q84 98 70 106 Z" fill="#1D1D20" stroke="#141414" strokeWidth="4" strokeLinejoin="round"/><path d="M74 108 Q84 102 95 110 Q86 118 76 114 Z" fill="#FFC400" stroke="#141414" strokeWidth="3" strokeLinejoin="round"/><path d="M126 108 Q116 102 105 110 Q114 118 124 114 Z" fill="#FFC400" stroke="#141414" strokeWidth="3" strokeLinejoin="round"/><circle cx="84" cy="111" r="3.2" fill="#141414"/><circle cx="116" cy="111" r="3.2" fill="#141414"/><path d="M82 120 Q100 112 118 120 Q122 134 100 140 Q78 134 82 120 Z" fill="#6C727A" stroke="#141414" strokeWidth="4" strokeLinejoin="round"/><ellipse cx="91" cy="126" rx="3.4" ry="4.6" fill="#141414"/><ellipse cx="109" cy="126" rx="3.4" ry="4.6" fill="#141414"/><path d="M100 118 L100 128" stroke="#4A4F55" strokeWidth="2.5" strokeLinecap="round"/><path d="M76 146 Q100 137 124 146 Q126 168 100 177 Q74 168 76 146 Z" fill="#5E120E" stroke="#141414" strokeWidth="5" strokeLinejoin="round"/><path d="M78 146 Q100 139 122 146 L121 154 Q100 148 79 154 Z" fill="#ffffff" stroke="#141414" strokeWidth="2"/><path d="M88 148 L88 153 M100 147 L100 153 M112 148 L112 153" stroke="#141414" strokeWidth="1.6"/><path d="M80 152 L84 164 L90 153 Z" fill="#ffffff" stroke="#141414" strokeWidth="2" strokeLinejoin="round"/><path d="M120 152 L116 164 L110 153 Z" fill="#ffffff" stroke="#141414" strokeWidth="2" strokeLinejoin="round"/><path d="M90 176 L93 167 L97 176 Z" fill="#ffffff" stroke="#141414" strokeWidth="2" strokeLinejoin="round"/><path d="M110 176 L107 167 L103 176 Z" fill="#ffffff" stroke="#141414" strokeWidth="2" strokeLinejoin="round"/><path d="M100 175 L100 169" stroke="#ffffff" strokeWidth="3" strokeLinecap="round"/><ellipse cx="100" cy="170" rx="7" ry="4.5" fill="#C2452F" opacity=".9"/></g></g><g clipPath="url(#sclS)"><circle cx="150.0" cy="182.0" r="15.0" fill="#FFC400" stroke="#141414" strokeWidth="5"/><circle cx="145.5" cy="176.8" r="4.5" fill="#ffffff" opacity=".55"/><circle cx="157.8" cy="152.8" r="14.2" fill="#FFC400" stroke="#141414" strokeWidth="5"/><circle cx="153.5" cy="147.8" r="4.2" fill="#ffffff" opacity=".55"/><circle cx="161.5" cy="127.4" r="13.3" fill="#FFC400" stroke="#141414" strokeWidth="5"/><circle cx="157.5" cy="122.7" r="4.0" fill="#ffffff" opacity=".55"/><circle cx="161.1" cy="105.8" r="12.5" fill="#FFC400" stroke="#141414" strokeWidth="5"/><circle cx="157.4" cy="101.4" r="3.8" fill="#ffffff" opacity=".55"/><circle cx="156.7" cy="88.0" r="11.7" fill="#FFC400" stroke="#141414" strokeWidth="5"/><circle cx="153.2" cy="83.9" r="3.5" fill="#ffffff" opacity=".55"/><circle cx="148.3" cy="74.0" r="10.8" fill="#FFC400" stroke="#141414" strokeWidth="5"/><circle cx="145.0" cy="70.2" r="3.2" fill="#ffffff" opacity=".55"/><circle cx="135.8" cy="63.8" r="10.0" fill="#FFC400" stroke="#141414" strokeWidth="5"/><circle cx="132.8" cy="60.3" r="3.0" fill="#ffffff" opacity=".55"/><circle cx="119.2" cy="57.4" r="9.2" fill="#FFC400" stroke="#141414" strokeWidth="5"/><circle cx="116.5" cy="54.2" r="2.8" fill="#ffffff" opacity=".55"/><circle cx="98.6" cy="54.8" r="8.3" fill="#FFC400" stroke="#141414" strokeWidth="5"/><circle cx="96.1" cy="51.9" r="2.5" fill="#ffffff" opacity=".55"/><circle cx="74.0" cy="56.0" r="7.5" fill="#FFC400" stroke="#141414" strokeWidth="5"/><circle cx="71.8" cy="53.4" r="2.2" fill="#ffffff" opacity=".55"/><ellipse cx="74.0" cy="56.0" rx="13.5" ry="15.5" fill="#E8A200" stroke="#141414" strokeWidth="5"/><path d="M72.0 43.5 Q56.0 30.5 46.0 42.5 Q58.0 44.5 69.0 58.0 Z" fill="#E8503A" stroke="#141414" strokeWidth="4.5" strokeLinejoin="round"/></g><path d="M18 30 H182 V145 C182 188 138 214 100 234 C62 214 18 188 18 145 Z" fill="none" stroke="#141414" strokeWidth="7" strokeLinejoin="round"/></>
        )}
      </svg>
    )
  },
  // ⭐ 1ª ASSINATURA (personalização de conta, NÃO é batismo/time fixo)
  'Marinheiros AS': (size: number) => {
    const w = Math.round(size * 200 / 240)
    return (
      <svg width={w} height={size} viewBox="0 0 200 240" aria-label="Marinheiros AS" role="img" style={{ flex: 'none', display: 'block' }}>
        <defs><clipPath id="mrMar"><path d="M18 30 H182 V145 C182 188 138 214 100 234 C62 214 18 188 18 145 Z"/></clipPath></defs>
              <path d="M18 30 H182 V145 C182 188 138 214 100 234 C62 214 18 188 18 145 Z" fill="#1B7A3D"/>
              <g clipPath="url(#mrMar)"><path d="M-20 150 L210 30 v40 L10 180 Z" fill="#2A8f4d" opacity=".5"/></g>
              <path d="M18 30 H182 V145 C182 188 138 214 100 234 C62 214 18 188 18 145 Z" fill="none" stroke="#0C0C0C" strokeWidth="7" strokeLinejoin="round"/>
              <g clipPath="url(#mrMar)">
                <circle cx="100" cy="128" r="60" fill="#FFFFFF" stroke="#0C0C0C" strokeWidth="6"/>
              <path d="M40 128 a60 60 0 0 1 60 -60" fill="none" stroke="#1B7A3D" strokeWidth="12"/>
              <path d="M160 128 a60 60 0 0 1 -60 60" fill="none" stroke="#1B7A3D" strokeWidth="12"/>
              <circle cx="100" cy="128" r="47" fill="#1B7A3D" stroke="#0C0C0C" strokeWidth="5"/>
                <g transform="translate(38 58) scale(0.62)">
              <g fill="#EAF7EE" stroke="#0C0C0C" strokeWidth="3">
                <circle cx="34" cy="74" r="8"/><circle cx="22" cy="62" r="6"/>
                <circle cx="166" cy="74" r="8"/><circle cx="178" cy="62" r="6"/>
              </g>
              <path d="M56 82 Q40 46 58 42 Q76 50 84 82 Z" fill="#3FAF6A" stroke="#0C0C0C" strokeWidth="7" strokeLinejoin="round"/>
              <path d="M144 82 Q160 46 142 42 Q124 50 116 82 Z" fill="#3FAF6A" stroke="#0C0C0C" strokeWidth="7" strokeLinejoin="round"/>
              <path d="M56 92 Q56 64 100 62 Q144 64 144 92 L144 124 Q144 158 100 164 Q56 158 56 124 Z" fill="#3FAF6A" stroke="#0C0C0C" strokeWidth="7" strokeLinejoin="round"/>
              <path d="M64 98 L98 112 M136 98 L102 112" stroke="#0C0C0C" strokeWidth="11" strokeLinecap="round"/>
              <path d="M72 114 Q84 108 96 116 Q86 126 74 122 Z" fill="#fff" stroke="#0C0C0C" strokeWidth="4"/>
              <path d="M128 114 Q116 108 104 116 Q114 126 126 122 Z" fill="#fff" stroke="#0C0C0C" strokeWidth="4"/>
              <circle cx="86" cy="117" r="5" fill="#0C0C0C"/><circle cx="114" cy="117" r="5" fill="#0C0C0C"/>
              <ellipse cx="100" cy="138" rx="28" ry="18" fill="#1E7A45" stroke="#0C0C0C" strokeWidth="7"/>
              <ellipse cx="90" cy="138" rx="4.5" ry="7" fill="#0C0C0C"/><ellipse cx="110" cy="138" rx="4.5" ry="7" fill="#0C0C0C"/>
              <rect x="80" y="150" width="40" height="13" rx="3" fill="#7a1410" stroke="#0C0C0C" strokeWidth="4"/>
              <path d="M86 150 L86 163 M94 150 L94 163 M102 150 L102 163 M110 150 L110 163 M118 150 L118 163" stroke="#fff" strokeWidth="3"/>
              <path d="M150 96 q7 12 0 18 q-7 -6 0 -18 Z" fill="#7FD3F0" stroke="#0C0C0C" strokeWidth="3"/>
              <ellipse cx="100" cy="62" rx="62" ry="17" fill="#FFFFFF" stroke="#0C0C0C" strokeWidth="6"/>
              <path d="M44 62 Q100 14 156 62 Q130 76 100 76 Q70 76 44 62 Z" fill="#FFFFFF" stroke="#0C0C0C" strokeWidth="6" strokeLinejoin="round"/>
              <circle cx="100" cy="26" r="8" fill="#E5271C" stroke="#0C0C0C" strokeWidth="4"/>
            </g>
              </g>
      </svg>
    )
  },
  // ⬇️ kit de batismo (arte própria em código — cores + símbolo folclórico, sem escudo real)
  'Murriz FC': (size: number) => {
    const w = Math.round(size * 200 / 240)
    return (
      <svg width={w} height={size} viewBox="0 0 200 240" aria-label="Murriz FC" role="img" style={{ flex: 'none', display: 'block' }}>
        <defs><clipPath id="mcMurriz"><path d="M18 30 H182 V145 C182 188 138 214 100 234 C62 214 18 188 18 145 Z"/></clipPath></defs>
              <path d="M18 30 H182 V145 C182 188 138 214 100 234 C62 214 18 188 18 145 Z" fill="#141414"/>
              <g clipPath="url(#mcMurriz)">
                <rect x="0" y="30" width="200" height="34" fill="#C4122E"/>
                <rect x="0" y="98" width="200" height="34" fill="#C4122E"/>
                <rect x="0" y="166" width="200" height="34" fill="#C4122E"/>
              </g>
              <path d="M18 30 H182 V145 C182 188 138 214 100 234 C62 214 18 188 18 145 Z" fill="none" stroke="#0C0C0C" strokeWidth="7" strokeLinejoin="round"/>
              <g clipPath="url(#mcMurriz)"><g transform="translate(100 108) scale(1.28)">
              <circle cx="-42" cy="6" r="10" fill="#F0C49B" stroke="#0C0C0C" strokeWidth="5"/>
              <circle cx="42" cy="6" r="10" fill="#F0C49B" stroke="#0C0C0C" strokeWidth="5"/>
              <path d="M-40 6 Q-44 -46 0 -48 Q44 -46 40 6 Q40 20 32 30 L-32 30 Q-40 20 -40 6 Z" fill="#F0C49B" stroke="#0C0C0C" strokeWidth="6" strokeLinejoin="round"/>
              <path d="M-22 -34 Q-4 -44 14 -36 Q-4 -30 -22 -34 Z" fill="#ffffff" opacity=".45"/>
              <path d="M-30 -8 L-8 -2" stroke="#A2481A" strokeWidth="8" strokeLinecap="round"/>
              <path d="M30 -8 L8 -2" stroke="#A2481A" strokeWidth="8" strokeLinecap="round"/>
              <circle cx="-17" cy="6" r="7.5" fill="#fff" stroke="#0C0C0C" strokeWidth="3"/>
              <circle cx="17" cy="6" r="7.5" fill="#fff" stroke="#0C0C0C" strokeWidth="3"/>
              <circle cx="-15" cy="7" r="3.6" fill="#0C0C0C"/>
              <circle cx="19" cy="7" r="3.6" fill="#0C0C0C"/>
              <path d="M0 8 Q-6 22 2 24" fill="none" stroke="#DDA877" strokeWidth="5" strokeLinecap="round"/>
              <path d="M-38 6 Q-40 44 -20 62 Q0 74 20 62 Q40 44 38 6 Q30 30 18 32 Q8 44 0 44 Q-8 44 -18 32 Q-30 30 -38 6 Z" fill="#C85A1B" stroke="#0C0C0C" strokeWidth="6" strokeLinejoin="round"/>
              <path d="M-26 30 l-4 16 M-12 40 l-2 16 M0 44 l0 16 M12 40 l2 16 M26 30 l4 16" stroke="#A2481A" strokeWidth="3.5" strokeLinecap="round"/>
              <path d="M-20 26 Q-8 34 0 30 Q8 34 20 26 Q10 40 0 38 Q-10 40 -20 26 Z" fill="#A2481A" stroke="#0C0C0C" strokeWidth="3"/>
            </g></g>
      </svg>
    )
  },
  // 🦁 Leão da Estradinha (jorgericardo777) — ex-Império Samambaia. REBATISMO
  // 23/08: o dono trocou o clube pro apelido do time do coração dele, o Rio
  // Branco-PR ("Leão da Estradinha", 1913). O escudo antigo era SVG à mão no
  // bundle (era pré-regra); saiu de vez — agora é webp fora do bundle, como
  // manda o CLAUDE.md. O nome velho continua apontando pra cá: carreira antiga
  // vê a cara nova sem perder nada.
  'Leão da Estradinha': leaoEstradinhaRender,
  'Leão da Estradinha FC': leaoEstradinhaRender,
  'Leão da Estradinha EC': leaoEstradinhaRender,
  'Leao da Estradinha': leaoEstradinhaRender,
  'Império Samambaia': leaoEstradinhaRender,
  // 🐷 Xurupitas FC (batismo do denilson.stifler10, aprovado pelo Diego 10/08 v5):
  // PORCO bravo verde/branco (Palmeiras), presas curvando pra CIMA. Desenhado em
  // código (folclórico — cores + porco, sem escudo de clube real). ex-Tokyo City.
  'Xurupitas FC': (size: number) => {
    const w = Math.round(size * 200 / 240)
    const V1 = '#2E9E5B', V2 = '#1E7A45', VD = '#0B4D2C'
    return (
      <svg width={w} height={size} viewBox="0 0 200 240" aria-label="Xurupitas FC" role="img" style={{ flex: 'none', display: 'block' }}>
        <defs><clipPath id="porcoClip"><path d="M18 30 H182 V145 C182 188 138 214 100 234 C62 214 18 188 18 145 Z" /></clipPath></defs>
        <path d="M18 30 H182 V145 C182 188 138 214 100 234 C62 214 18 188 18 145 Z" fill={VD} />
        <g clipPath="url(#porcoClip)"><path d="M-20 150 L210 30 v34 L10 175 Z" fill={V2} opacity=".35" /></g>
        <path d="M18 30 H182 V145 C182 188 138 214 100 234 C62 214 18 188 18 145 Z" fill="none" stroke={INK} strokeWidth="7" strokeLinejoin="round" />
        <g transform="translate(0 2)">
          <path d="M56 76 Q42 40 58 36 Q74 42 82 74 Z" fill={V1} stroke={INK} strokeWidth="7" strokeLinejoin="round" />
          <path d="M144 76 Q158 40 142 36 Q126 42 118 74 Z" fill={V1} stroke={INK} strokeWidth="7" strokeLinejoin="round" />
          <path d="M100 44 Q93 60 100 74 Q107 60 100 44 Z" fill={V1} stroke={INK} strokeWidth="6" strokeLinejoin="round" />
          <path d="M56 90 Q56 62 100 60 Q144 62 144 90 L144 122 Q144 156 100 162 Q56 156 56 122 Z" fill={V1} stroke={INK} strokeWidth="7" strokeLinejoin="round" />
          <path d="M66 96 L96 108 M134 96 L104 108" stroke={INK} strokeWidth="10" strokeLinecap="round" />
          <path d="M72 110 Q84 105 96 112 Q86 124 74 119 Z" fill="#fff" stroke={INK} strokeWidth="4" />
          <path d="M128 110 Q116 105 104 112 Q114 124 126 119 Z" fill="#fff" stroke={INK} strokeWidth="4" />
          <circle cx="86" cy="114" r="5.5" fill={INK} /><circle cx="114" cy="114" r="5.5" fill={INK} />
          <ellipse cx="100" cy="136" rx="28" ry="19" fill={V2} stroke={INK} strokeWidth="7" />
          <ellipse cx="90" cy="136" rx="4.5" ry="7" fill={INK} /><ellipse cx="110" cy="136" rx="4.5" ry="7" fill={INK} />
          <path d="M76 150 Q60 142 62 118 Q72 138 86 148 Z" fill="#fff" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
          <path d="M124 150 Q140 142 138 118 Q128 138 114 148 Z" fill="#fff" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
          <path d="M88 154 l0 8 M100 156 l0 8 M112 154 l0 8" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
          <path d="M86 152 Q100 159 114 152" stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" />
        </g>
      </svg>
    )
  },
  // 🧢 Tôka10 (batismo do ofc.toka10, aprovado pelo Diego 10/08): o menino da
  // touca — ARTE PRÓPRIA do dono (imagem webp 22 KB, exceção aprovada; ver nota
  // no topo). Selo redondo já vem no desenho; fundo é transparente.
  'Tôka10': (size: number) => (
    <img
      src={tokaEscudoImg}
      height={size}
      width={Math.round(size * 322 / 340)}
      alt="Tôka10"
      style={{ flex: 'none', display: 'block', objectFit: 'contain' }}
    />
  ),
  // 🦋 Bicho da Seda (batismo do davisantana1312/Davi — CORREÇÃO 10/08: a
  // mariposa é do clube Bicho da Seda; "Xurupitas" era só o nome que o
  // denilson usa jogando e já ganhou kit próprio (Xurupitas FC, o porco)).
  // CORREÇÃO 10/08 (Diego): coração do Davi é BOTAFOGO → escudo PRETO com
  // listras brancas + mariposa BRANCA (o bicho-da-seda é branco de verdade)
  // com detalhes pretos. Só as asas superiores no escudo; a inteira vive na mascote.
  'Bicho da Seda': (size: number) => {
    const mini = size < 40
    const w = Math.round(size * 200 / 240)
    return (
      <svg width={w} height={size} viewBox="0 0 200 240" aria-label="Bicho da Seda" role="img" style={{ flex: 'none', display: 'block' }}>
        <defs><clipPath id="xurClip"><path d="M18 30 H182 V145 C182 188 138 214 100 234 C62 214 18 188 18 145 Z" /></clipPath></defs>
        <path d="M18 30 H182 V145 C182 188 138 214 100 234 C62 214 18 188 18 145 Z" fill="#141414" />
        <g clipPath="url(#xurClip)">
          <rect x="42" y="10" width="24" height="240" fill="#ffffff" opacity=".92" />
          <rect x="134" y="10" width="24" height="240" fill="#ffffff" opacity=".92" />
        </g>
        <path d="M18 30 H182 V145 C182 188 138 214 100 234 C62 214 18 188 18 145 Z" fill="none" stroke={INK} strokeWidth={mini ? 9 : 7} strokeLinejoin="round" />
        {mini ? (
          <g>
            <path d="M96 110 C64 70 34 62 28 70 C22 100 40 138 68 146 Q90 152 96 132 Z" fill="#F4F4F4" stroke={INK} strokeWidth="8" />
            <path d="M104 110 C136 70 166 62 172 70 C178 100 160 138 132 146 Q110 152 104 132 Z" fill="#F4F4F4" stroke={INK} strokeWidth="8" />
            <ellipse cx="100" cy="126" rx="15" ry="28" fill="#fff" stroke={INK} strokeWidth="8" />
            <circle cx="100" cy="92" r="17" fill="#fff" stroke={INK} strokeWidth="8" />
            <circle cx="92" cy="92" r="7.5" fill={INK} /><circle cx="108" cy="92" r="7.5" fill={INK} />
            <path d="M78 78 L94 86 M122 78 L106 86" stroke={INK} strokeWidth="8" strokeLinecap="round" />
          </g>
        ) : (
          <g transform="translate(0,18)">
            <path d="M96 104 C70 70 40 56 28 62 C18 88 30 128 58 140 C72 146 86 138 94 128 Z" fill="#F4F4F4" stroke={INK} strokeWidth="6" strokeLinejoin="round" />
            <path d="M104 104 C130 70 160 56 172 62 C182 88 170 128 142 140 C128 146 114 138 106 128 Z" fill="#F4F4F4" stroke={INK} strokeWidth="6" strokeLinejoin="round" />
            <g fill="#141414"><ellipse cx="46" cy="86" rx="4" ry="6" /><ellipse cx="60" cy="112" rx="3.5" ry="5" /><ellipse cx="76" cy="92" rx="3" ry="4.5" /><ellipse cx="154" cy="86" rx="4" ry="6" /><ellipse cx="140" cy="112" rx="3.5" ry="5" /><ellipse cx="124" cy="92" rx="3" ry="4.5" /></g>
            <path d="M40 76 q14 16 24 40 M160 76 q-14 16 -24 40" stroke="#9AA0A6" strokeWidth="3.5" fill="none" />
            <ellipse cx="100" cy="140" rx="9" ry="12" fill="#EDEDED" stroke={INK} strokeWidth="5" />
            <ellipse cx="100" cy="120" rx="11" ry="14" fill="#EDEDED" stroke={INK} strokeWidth="5" />
            <ellipse cx="100" cy="100" rx="12" ry="13" fill="#ffffff" stroke={INK} strokeWidth="5" />
            <path d="M88 72 C74 56 58 48 46 50 C50 62 66 74 84 78 Z" fill="#141414" stroke={INK} strokeWidth="4.5" strokeLinejoin="round" />
            <path d="M112 72 C126 56 142 48 154 50 C150 62 134 74 116 78 Z" fill="#141414" stroke={INK} strokeWidth="4.5" strokeLinejoin="round" />
            <circle cx="100" cy="78" r="16" fill="#EDEDED" stroke={INK} strokeWidth="5" />
            <circle cx="92" cy="80" r="7.5" fill={INK} /><circle cx="108" cy="80" r="7.5" fill={INK} />
            <circle cx="94.5" cy="77.5" r="2.2" fill="#fff" /><circle cx="110.5" cy="77.5" r="2.2" fill="#fff" />
            <path d="M78 65 L96 74 M122 65 L104 74" stroke={INK} strokeWidth="6.5" strokeLinecap="round" />
            <path d="M93 92 q7 -6 14 0" stroke={INK} strokeWidth="4.5" fill="none" strokeLinecap="round" />
          </g>
        )}
      </svg>
    )
  },
  // 🐓🌙 Nightfull FC (guilhermevictor539, aprovado 09/08): o GALO BALADEIRO
  // da noite — alvinegro, crista vermelha, óculos escuro, lua e estrela.
  'Nightfull FC': (size: number) => {
    const mini = size < 40
    const w = Math.round(size * 200 / 240)
    return (
      <svg width={w} height={size} viewBox="0 0 200 240" aria-label="Nightfull FC" role="img" style={{ flex: 'none', display: 'block' }}>
        <defs><clipPath id="nfClip"><path d="M100 22 L182 46 V142 C182 184 140 210 100 230 C60 210 18 184 18 142 V46 Z" /></clipPath></defs>
        <path d="M100 22 L182 46 V142 C182 184 140 210 100 230 C60 210 18 184 18 142 V46 Z" fill="#141414" />
        <g clipPath="url(#nfClip)">
          <rect x="38" y="10" width="18" height="240" fill="#ffffff" opacity=".92" />
          <rect x="144" y="10" width="18" height="240" fill="#ffffff" opacity=".92" />
        </g>
        <path d="M100 22 L182 46 V142 C182 184 140 210 100 230 C60 210 18 184 18 142 V46 Z" fill="none" stroke={INK} strokeWidth={mini ? 9 : 7} strokeLinejoin="round" />
        {mini ? (
          <g>
            <path d="M64 70 Q54 44 78 52 Q78 30 100 42 Q104 24 122 40 Q134 34 132 56 L122 76 Z" fill="#E8503A" stroke={INK} strokeWidth="6" />
            <path d="M60 100 Q64 70 96 66 Q128 62 140 86 Q148 108 138 130 Q128 152 100 154 Q72 156 62 132 Q56 114 60 100 Z" fill="#141414" stroke={INK} strokeWidth="8" />
            <path d="M58 108 L26 118 L58 130 Z" fill="#E8A200" stroke={INK} strokeWidth="6" />
            <path d="M62 88 Q62 78 76 78 L112 82 Q124 84 120 96 Q118 110 104 110 L76 106 Q62 104 62 88 Z" fill="#0C0C0C" stroke="#fff" strokeWidth="3" />
            <path d="M72 88 L100 92" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" opacity=".85" />
          </g>
        ) : (
          <g>
            <path d="M150 44 a16 16 0 1 0 12 26 a13 13 0 0 1 -12 -26 Z" fill="#FFC400" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
            <path d="M128 66 l2.5 6 6 1 -4.5 4 1.5 6 -5.5 -3.5 -5.5 3.5 1.5 -6 -4.5 -4 6 -1 Z" fill="#FFC400" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M78 150 Q76 190 96 208 L140 208 Q142 172 128 148 Z" fill="#141414" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
            <path d="M92 154 q-2 30 10 50 M110 152 q4 26 14 48" stroke="#ffffff" strokeWidth="7" fill="none" />
            <path d="M68 64 Q58 42 78 48 Q76 28 96 38 Q98 20 114 34 Q126 26 126 48 L118 68 Z" fill="#E8503A" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
            <path d="M64 96 Q66 70 92 64 Q120 58 132 78 Q142 96 136 118 Q130 140 106 144 Q80 148 70 128 Q62 112 64 96 Z" fill="#141414" stroke={INK} strokeWidth="6" strokeLinejoin="round" />
            <path d="M62 104 L34 112 L62 122 Z" fill="#E8A200" stroke={INK} strokeWidth="4.5" strokeLinejoin="round" />
            <path d="M40 112 L60 116" stroke={INK} strokeWidth="3" strokeLinecap="round" />
            <path d="M68 126 q-8 16 4 22 q10 4 14 -8 q-8 -4 -18 -14 Z" fill="#E8503A" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
            <path d="M66 86 Q66 78 76 78 L108 80 Q118 82 116 92 Q114 104 102 104 L78 102 Q66 100 66 86 Z" fill="#0C0C0C" stroke={INK} strokeWidth="4" />
            <path d="M112 84 L134 80" stroke={INK} strokeWidth="5" strokeLinecap="round" />
            <path d="M74 84 L96 86" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" opacity=".8" />
          </g>
        )}
      </svg>
    )
  },
  // 🐦 Manfré FC (danielmanfre5, aprovado 09/08): a CABEÇONA da gralha-azul
  // paranista (molde da referência dele) no escudo azul c/ faixa vermelha.
  'Manfré FC': (size: number) => {
    const mini = size < 40
    const w = Math.round(size * 200 / 240)
    return (
      <svg width={w} height={size} viewBox="0 0 200 240" aria-label="Manfré FC" role="img" style={{ flex: 'none', display: 'block' }}>
        <defs><clipPath id="mfClip"><path d="M18 30 H182 V145 C182 188 138 214 100 234 C62 214 18 188 18 145 Z" /></clipPath></defs>
        <path d="M18 30 H182 V145 C182 188 138 214 100 234 C62 214 18 188 18 145 Z" fill="#0E3E86" />
        <g clipPath="url(#mfClip)">
          <path d="M0 176 H200 V196 H0 Z" fill="#C2452F" />
          {!mini && <path d="M0 170 H200 V176 H0 Z M0 196 H200 V202 H0 Z" fill="#ffffff" />}
        </g>
        <path d="M18 30 H182 V145 C182 188 138 214 100 234 C62 214 18 188 18 145 Z" fill="none" stroke={INK} strokeWidth={mini ? 9 : 7} strokeLinejoin="round" />
        <g transform={mini ? 'translate(4,34) scale(1.7)' : 'translate(10,32) scale(1.55)'}>
          <path d="M50 76 Q34 66 30 48 Q28 30 44 20 Q58 12 74 16 L94 6 L82 24 L104 20 L86 34 Q90 48 78 62 Q66 76 50 76 Z" fill="#2E6FB0" stroke={INK} strokeWidth={mini ? 5 : 4} strokeLinejoin="round" />
          <path d="M40 46 Q20 46 8 54 Q22 62 40 58 Q46 56 44 50 Z" fill="#C2452F" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
          {!mini && <path d="M14 58 Q26 66 42 62" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />}
          {!mini && <path d="M40 62 Q30 68 22 66 Q30 72 42 68 Z" fill="#A33325" stroke={INK} strokeWidth="3" strokeLinejoin="round" />}
          <path d="M38 34 L52 40 M68 32 L56 40" stroke={INK} strokeWidth={mini ? 5.5 : 4.5} strokeLinecap="round" />
          <circle cx="48" cy="44" r="6" fill="#fff" stroke={INK} strokeWidth="3" />
          <circle cx="61" cy="42" r="6" fill="#fff" stroke={INK} strokeWidth="3" />
          <circle cx="49" cy="45" r={mini ? 3.2 : 2.6} fill={INK} /><circle cx="62" cy="43" r={mini ? 3.2 : 2.6} fill={INK} />
        </g>
      </svg>
    )
  },
  // 🦇 Neymarzetti (time do DIEGO, dono do jogo — ex-Paixandu). 24/08: a arte
  // que ele mandou APOSENTA o escudo que era SVG desenhado à mão aqui dentro
  // (o moicano de 09/08). Vale a regra de peso do batismo: arte nasce .webp
  // FORA do bundle, então só desce pra quem cruza com o clube.
  // 360x299 no arquivo — a largura sai da proporção REAL, nunca chutada.
  // Recorte conferido sobre fundo CREME (nunca branco): o prateado e o vinco
  // claro do 'N' continuam inteiros.
  // 📛 as 4 FORMAS reservadas do nome (regra do Diego 20/08): nome puro + FC +
  // EC, e a caixa já está coberta porque a chave é comparada em minúscula.
  // 🌽 Milhaça FC (igormarquesn99) — ex-Real Bets, Série C. As 4 formas do nome.
  'Milhaça FC': milhacaEscudoRender,
  'Milhaça': milhacaEscudoRender,
  'Milhaça EC': milhacaEscudoRender,
  'Real Bets': milhacaEscudoRender, // 🕰️ nome VELHO: save antigo abre com o escudo novo
  Neymarzetti: neymarzettiEscudoRender,
  'Neymarzetti FC': neymarzettiEscudoRender,
  'Neymarzetti EC': neymarzettiEscudoRender,
  Paixandu: neymarzettiEscudoRender, // 🕰️ o nome VELHO: save antigo abre com o escudo novo
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

// 🔑 CHAVE DO ESCUDO ARTESANAL — regra ditada pelo Diego (20/08): *"qd eu te
// falar o time dele você já deve reservar o escudo pra esse nome seja letras
// minúscula ou maiúsculas e tb c fc e ec no final do nome do time. E c isso ng
// poderia ter esses 4 nomes"*.
//
// Traduzindo: cada batismo/sócio **reserva 4 formas do MESMO nome** — o nome
// puro (em qualquer caixa), com **FC** e com **EC** no fim. Ninguém mais pode
// ter nenhuma das 4. Aqui no desenho, a chave normaliza essas 4 formas pra uma
// só; a trava que IMPEDE outra pessoa de pegar mora no banco
// (`esc_nomes_batismo` + RPC `esc_nome_livre`), com uma linha por forma.
// SC entra junto porque já existiam clubes registrados assim ('SC Ferrari').
//
// 🐛 O que isso conserta (achado em 20/08): a busca era pela string EXATA e a
// lista tinha APELIDOS registrados ('Arruda', 'Coringas', 'Ferrari', 'Seven',
// 'Crias', 'Eros', 'Nata SP'). Resultado: `arrudabernardo213076@gmail.com`, que
// só pôs o próprio sobrenome de time, jogava com o escudo do Tricolor do Arruda
// FC do Geovany. Palavras do Diego: *"não tem nada a ver o cara escreveu o nome
// de Arruda, e isso ser uma chave dos escudos do tricolor do Arruda, está
// errado"*. Os apelidos foram APAGADOS: agora só o nome completo vale.
const chaveEscudo = (n: string): string => n
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // tira acento (Bigão = Bigao)
  .toLowerCase().trim()
  .replace(/\s+/g, ' ')
  .replace(/\s+(f\.?\s?c\.?|e\.?\s?c\.?|s\.?\s?c\.?)$/, '') // FC/EC/SC no fim não mudam o dono
const LOGOS_POR_CHAVE: Map<string, (size: number) => ReactNode> =
  new Map(Object.entries(LOGOS_PRONTAS).map(([k, v]) => [chaveEscudo(k), v]))
const logoPronta = (n: string) => LOGOS_POR_CHAVE.get(chaveEscudo(n))

// ─── 🛡️ o componente ──────────────────────────────────────────────────────
// `size` = altura em px. Abaixo de 40px entra a versão MINI: sem detalhes finos
// e com traço mais grosso (o que lê na tabela é a silhueta + a cor).
export function Escudo({ nome: nomeCru, size = 30, title }: { nome: string; size?: number; title?: string }) {
  const nome = nomeLimpo(nomeCru) || nomeCru // 🧼 mesmo escudo com ou sem o selo do tier
  // logo artesanal: bate pelo nome EXATO; se não achar, tenta o nome ATUAL do
  // batismo (save antigo que ficou com o nome velho — ex.: "Cuiabagre" →
  // "Império Samambaia"). Assim a logo comprada aparece mesmo em carreira antiga.
  const pronta = logoPronta(nome) ?? logoPronta(newestTeamName(nome))
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
