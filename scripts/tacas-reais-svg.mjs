// 🏆 Desenhos das taças (viewBox 120×170, traço da Copa dos 8). Fonte do MOCKUP; depois de aprovado, cada corpo
// vira JSX no `Trofeu` de src/escalacao/competicoes-visual.tsx.
// c = { o: ouro, p: prata, b: bronze, v: verde, m: madeira, INK }
const S = 'stroke="#0C0C0C" stroke-width="3" stroke-linejoin="round"'
const fino = 'stroke="#0C0C0C" stroke-width="1.5" stroke-linejoin="round"'

export const TACAS = {
  // ── REAIS ─────────────────────────────────────────────────────────────────────
  liberta: {
    real: true, nome: 'Libertadores', onde: 'online + carreira internacional', foto: 'continental_libertadores.png', fundo: 'radial-gradient(ellipse at 50% 40%,#3a2c08,#0B0B0B 70%)',
    // base de madeira cheia de plaquinhas (os campeões), bola de prata com os 2 pinos e o jogador em cima
    svg: c => `<rect x="34" y="108" width="52" height="52" rx="3" fill="${c.m}" ${S}/>
      ${[114, 128, 142].map(y => [38, 50, 62, 74].map(x => `<rect x="${x}" y="${y}" width="9" height="10" rx="1" fill="${c.o}" ${fino}/>`).join('')).join('')}
      <rect x="30" y="101" width="60" height="9" rx="2" fill="${c.p}" ${S}/>
      <path d="M52 101 L55 80 H65 L68 101 Z" fill="${c.p}" ${S}/>
      <rect x="28" y="52" width="9" height="12" rx="2" fill="${c.p}" ${S}/><rect x="83" y="52" width="9" height="12" rx="2" fill="${c.p}" ${S}/>
      <circle cx="60" cy="58" r="24" fill="${c.p}" ${S}/>
      <path d="M36 58 H84" stroke="#0C0C0C" stroke-width="2.5"/><path d="M40 47 C52 43,68 43,80 47" fill="none" stroke="#8E9AA8" stroke-width="2"/>
      <rect x="55" y="29" width="10" height="7" fill="${c.p}" ${S}/>
      <circle cx="60" cy="13" r="4.5" fill="${c.p}" ${fino}/><path d="M60 17 V27 M60 20 L53 15 M60 20 L67 24 M60 27 L55 31 M60 27 L66 30" stroke="#0C0C0C" stroke-width="3" stroke-linecap="round"/>`,
  },
  champions: {
    real: true, nome: 'Champions', onde: 'online + carreira internacional', foto: 'continental_champions-league.png', fundo: 'radial-gradient(ellipse at 50% 40%,#2c4fb5,#0A1640 70%)',
    // a "orelhuda": corpo de prata comprido e as duas alças gigantes do aro até o meio
    svg: c => `<path d="M38 160 L42 140 H78 L82 160 Z" fill="${c.p}" ${S}/><rect x="44" y="133" width="32" height="8" rx="2" fill="${c.p}" ${S}/>
      <path d="M54 133 L56 110 H64 L66 133 Z" fill="${c.p}" ${S}/>
      <path d="M38 30 H82 C82 74,74 100,60 110 C46 100,38 74,38 30 Z" fill="${c.p}" ${S}/>
      <path d="M40 34 C4 18,0 104,46 96 C28 84,20 50,40 46 Z" fill="${c.p}" ${S}/>
      <path d="M80 34 C116 18,120 104,74 96 C92 84,100 50,80 46 Z" fill="${c.p}" ${S}/>
      <ellipse cx="60" cy="30" rx="22" ry="5" fill="#c9d1da" ${S}/><path d="M50 50 C52 70,56 86,60 96" fill="none" stroke="#fff" stroke-width="3" opacity=".8"/>`,
  },
  mundo: {
    real: true, nome: 'Copa do Mundo', onde: 'online + carreira', foto: 'continental_world-cup.png', fundo: 'linear-gradient(160deg,#0E5B2A,#1B7A3D 45%,#c9a000 140%)',
    // duas figuras em espiral segurando o globo, com as 2 faixas verdes na base
    svg: c => `<path d="M40 160 L44 134 H76 L80 160 Z" fill="${c.o}" ${S}/>
      <rect x="42" y="139" width="36" height="5" fill="${c.v}"/><rect x="41" y="150" width="38" height="5" fill="${c.v}"/>
      <circle cx="60" cy="40" r="21" fill="${c.o}" ${S}/>
      <path d="M46 32 C52 28,56 36,62 32 S72 28,74 36 M44 46 C50 50,56 42,62 48" fill="none" stroke="#9a6a00" stroke-width="2"/>
      <path d="M46 134 C50 118,52 108,50 98 C44 86,36 70,38 54 C42 64,48 66,54 62 C50 74,58 84,60 92 C62 84,70 74,66 62 C72 66,78 64,82 54 C84 70,76 86,70 98 C68 108,70 118,74 134 Z" fill="${c.o}" ${S}/>
      <path d="M52 128 C56 112,54 100,60 92 M68 128 C64 112,66 100,60 92 M42 60 C46 76,52 84,56 90 M78 60 C74 76,68 84,64 90" fill="none" stroke="#9a6a00" stroke-width="2.2"/>`,
  },
  mundial: {
    real: true, nome: 'Mundial de Clubes', onde: 'online + carreira internacional', foto: 'continental_intercontinental-cup.png', fundo: 'radial-gradient(ellipse at 50% 40%,#4a3a08,#111 72%)',
    // a taça do Intercontinental da FIFA: base dourada, corpo de prata torcido e a bola em cima
    svg: c => `<path d="M40 160 L43 136 H77 L80 160 Z" fill="${c.o}" ${S}/><rect x="40" y="146" width="40" height="4" fill="#8C6A00"/>
      <path d="M50 136 C44 114,56 98,52 74 C58 82,62 82,60 72 C60 82,64 82,68 74 C64 98,76 114,70 136 Z" fill="${c.p}" ${S}/>
      <path d="M54 130 C52 112,62 98,58 80 M66 130 C68 112,58 98,62 80" fill="none" stroke="#8E9AA8" stroke-width="2"/>
      <path d="M42 72 C40 60,52 62,60 72 C68 62,80 60,78 72" fill="${c.p}" ${S}/>
      <circle cx="60" cy="46" r="22" fill="${c.p}" ${S}/>
      <path d="M60 36 l8 6-3 9h-10l-3-9z" fill="#0C0C0C"/><path d="M60 36 V26 M68 42 L80 38 M65 51 L72 62 M55 51 L48 62 M52 42 L40 38" stroke="#0C0C0C" stroke-width="2"/>`,
  },
  nordeste: {
    real: true, nome: 'Copa do Nordeste', onde: 'online (copa regional)', foto: 'regional_copa-do-nordeste.png', fundo: 'radial-gradient(ellipse at 50% 30%,#F08A2E,#7A3B12 75%)',
    // taça dourada alta com os anéis pretos e as alças em gota
    svg: c => `<rect x="40" y="144" width="40" height="16" rx="3" fill="#2a2a2a" ${S}/>
      <path d="M50 144 L53 128 H67 L70 144 Z" fill="${c.o}" ${S}/>
      <path d="M40 34 H80 L72 128 H48 Z" fill="${c.o}" ${S}/>
      ${[50, 68, 86, 104].map((y, i) => `<path d="M${41.4 + i * 1.6 + (y - 50) * 0.08} ${y} H${78.6 - i * 1.6 - (y - 50) * 0.08}" stroke="#0C0C0C" stroke-width="7"/>`).join('')}
      <path d="M40 38 C18 26,16 70,44 78" fill="none" stroke="${c.o}" stroke-width="7"/><path d="M40 38 C18 26,16 70,44 78" fill="none" stroke="#0C0C0C" stroke-width="2"/>
      <path d="M80 38 C102 26,104 70,76 78" fill="none" stroke="${c.o}" stroke-width="7"/><path d="M80 38 C102 26,104 70,76 78" fill="none" stroke="#0C0C0C" stroke-width="2"/>
      <ellipse cx="60" cy="34" rx="20" ry="5" fill="#FFE08A" ${S}/>`,
  },
  riosp: {
    real: true, nome: 'Rio × São Paulo', onde: 'online (copa regional)', foto: 'regional_rio-sao-paulo.png', fundo: 'linear-gradient(90deg,#1E88E5 0%,#64B5F6 48%,#5c5c5c 52%,#2B2B2B 100%)',
    // o troféu do Torneio Rio-São Paulo: moldura alta dourada com a bola dentro, sobre a base preta com placa
    svg: c => `<rect x="30" y="134" width="60" height="26" rx="3" fill="#1a1a1a" ${S}/><rect x="40" y="141" width="40" height="11" rx="1" fill="${c.o}" ${fino}/>
      <rect x="36" y="126" width="48" height="10" rx="2" fill="${c.o}" ${S}/>
      <rect x="40" y="30" width="40" height="96" rx="3" fill="#2a2418" ${S}/>
      <rect x="44" y="34" width="32" height="88" rx="2" fill="none" stroke="${c.o}" stroke-width="5"/>
      <circle cx="60" cy="80" r="12" fill="${c.p}" ${S}/><path d="M60 72 l5 4-2 6h-6l-2-6z" fill="#0C0C0C"/>
      <path d="M50 104 H70 M52 112 H68" stroke="${c.o}" stroke-width="3"/><path d="M36 30 H84 L78 20 H42 Z" fill="${c.o}" ${S}/>`,
  },
  copabr: {
    real: true, nome: 'Copa do Brasil', onde: 'carreira (e Sala de Troféus)', foto: 'cup_bra.png', fundo: 'linear-gradient(160deg,#0a3d1d,#1B7A3D 55%,#c9a000 150%)',
    // taça de prata com tampa, alças e as fitas verde e amarela, na base de madeira
    svg: c => `<rect x="38" y="140" width="44" height="20" rx="3" fill="${c.m}" ${S}/>
      <path d="M50 140 L54 114 H66 L70 140 Z" fill="${c.p}" ${S}/>
      <path d="M34 50 H86 C86 86,76 104,60 112 C44 104,34 86,34 50 Z" fill="${c.p}" ${S}/>
      <path d="M36 56 C18 54,18 88,42 92 M84 56 C102 54,102 88,78 92" fill="none" ${S}/>
      <path d="M22 66 C20 92,24 112,26 128 M98 66 C100 92,96 112,94 128" fill="none" stroke="#1B7A3D" stroke-width="6"/>
      <path d="M26 66 C26 92,30 110,32 124 M94 66 C94 92,90 110,88 124" fill="none" stroke="#FFC400" stroke-width="5"/>
      <path d="M38 50 C40 36,80 36,82 50 Z" fill="${c.p}" ${S}/><circle cx="60" cy="33" r="5" fill="${c.p}" ${S}/>`,
  },
  supercopa: {
    real: true, nome: 'Supercopa do Brasil', onde: 'carreira (e Sala de Troféus)', foto: 'super-cup_bra.png', fundo: 'radial-gradient(ellipse at 50% 40%,#c2452f,#2a0805 72%)',
    // cobre, bojo pequeno no alto, haste comprida e as alças que abrem como asas
    svg: c => `<path d="M40 160 L44 142 H76 L80 160 Z" fill="#2a1508" ${S}/>
      <path d="M54 142 L56 82 H64 L66 142 Z" fill="${c.b}" ${S}/>
      <path d="M40 34 H80 C80 60,72 76,60 82 C48 76,40 60,40 34 Z" fill="${c.b}" ${S}/>
      <path d="M42 38 C14 22,12 82,54 100" fill="none" stroke="${c.b}" stroke-width="7"/><path d="M42 38 C14 22,12 82,54 100" fill="none" stroke="#0C0C0C" stroke-width="2"/>
      <path d="M78 38 C106 22,108 82,66 100" fill="none" stroke="${c.b}" stroke-width="7"/><path d="M78 38 C106 22,108 82,66 100" fill="none" stroke="#0C0C0C" stroke-width="2"/>
      <ellipse cx="60" cy="34" rx="20" ry="5" fill="#FFD2A8" ${S}/><circle cx="60" cy="56" r="7" fill="#7A3F1C" ${fino}/>`,
  },
  carA: {
    real: true, nome: 'Série A', onde: 'carreira (e Sala de Troféus)', foto: 'league_bra.png', fundo: 'radial-gradient(ellipse at 50% 40%,#5a4510,#0C0C0C 72%)',
    // a taça do Brasileirão: prata em ampulheta, larga em cima, com a bola dourada no meio
    svg: c => `<rect x="34" y="148" width="52" height="12" rx="2" fill="#1a1a1a" ${S}/>
      <path d="M28 26 H92 L68 90 L86 148 H34 L52 90 Z" fill="${c.p}" ${S}/>
      <path d="M36 32 L56 88 M84 32 L64 88" fill="none" stroke="#fff" stroke-width="2.5" opacity=".8"/>
      <circle cx="60" cy="96" r="11" fill="${c.o}" ${S}/><path d="M60 89 l5 4-2 6h-6l-2-6z" fill="#0C0C0C"/>
      <rect x="44" y="132" width="32" height="8" rx="1" fill="${c.o}" ${fino}/>`,
  },
  carB: {
    real: true, nome: 'Série B', onde: 'carreira (e Sala de Troféus)', foto: 'league_bra-2.png', fundo: 'radial-gradient(ellipse at 50% 40%,#7c3aed,#1c0a3a 72%)',
    // a da Série B: a mesma ampulheta do Brasileirão, só que DOURADA e mais encorpada
    svg: c => `<rect x="34" y="148" width="52" height="12" rx="2" fill="#1a1a1a" ${S}/>
      <path d="M32 28 H88 L70 92 L82 148 H38 L50 92 Z" fill="${c.o}" ${S}/>
      <path d="M44 34 H76 L62 84 Z" fill="#FFF3B0" ${fino}/>
      <circle cx="60" cy="98" r="10" fill="${c.o}" ${S}/><path d="M60 92 l4 3-1.5 5h-5l-1.5-5z" fill="#0C0C0C"/>
      <rect x="44" y="132" width="32" height="8" rx="1" fill="#1a1a1a" ${fino}/>`,
  },
  carC: {
    real: true, nome: 'Série C', onde: 'carreira (e Sala de Troféus)', foto: 'league_bra-3.png', fundo: 'radial-gradient(ellipse at 50% 40%,#2f6bae,#0b1d38 72%)',
    // a da Série C: BRONZE, fina e comprida
    svg: c => `<rect x="38" y="148" width="44" height="12" rx="2" fill="#1a1a1a" ${S}/>
      <path d="M40 24 H80 L66 94 L76 148 H44 L54 94 Z" fill="${c.b}" ${S}/>
      <path d="M46 30 L57 90 M74 30 L63 90" fill="none" stroke="#FFD2A8" stroke-width="2.5" opacity=".9"/>
      <circle cx="60" cy="58" r="8" fill="#7A3F1C" ${fino}/><rect x="48" y="134" width="24" height="7" rx="1" fill="#FFD2A8" ${fino}/>`,
  },
  carD: {
    real: true, nome: 'Série D', onde: 'carreira (e Sala de Troféus)', foto: 'league_bra-4.png', fundo: 'radial-gradient(ellipse at 50% 40%,#2a8a4c,#06240f 72%)',
    // a da Série D: dourada, fina, com o V aberto no alto
    svg: c => `<rect x="40" y="148" width="40" height="12" rx="2" fill="#1a1a1a" ${S}/>
      <path d="M40 26 H80 L68 98 L76 148 H44 L52 98 Z" fill="${c.o}" ${S}/>
      <path d="M48 26 L60 72 L72 26 Z" fill="#3a2a00" ${S}/>
      <circle cx="60" cy="104" r="8" fill="${c.o}" ${S}/><rect x="48" y="134" width="24" height="7" rx="1" fill="#1a1a1a" ${fino}/>`,
  },
  // ── NOSSAS (inventadas) — continuam como estão ────────────────────────────────
  liga: {
    real: false, nome: 'Liga Legends', onde: 'online', fundo: 'radial-gradient(ellipse at 50% 40%,#3a3220,#0C0C0C 72%)',
    svg: c => `<rect x="34" y="140" width="52" height="20" rx="4" fill="#0C0C0C" ${S}/><path d="M50 140 L54 112 H66 L70 140 Z" fill="${c.o}" ${S}/><path d="M30 40 H90 C90 82,78 106,60 112 C42 106,30 82,30 40 Z" fill="${c.o}" ${S}/><path d="M32 48 C14 46,14 80,36 84 M88 48 C106 46,106 80,84 84" fill="none" ${S}/><path d="M60 58 l6 12 13 2-9 9 2 13-12-6-12 6 2-13-9-9 13-2z" fill="#fff" stroke="#0C0C0C" stroke-width="2"/>`,
  },
  copa8: {
    real: false, nome: 'Copa dos 8', onde: 'online', fundo: 'radial-gradient(ellipse at 50% 40%,#d9572f,#5a1408 75%)',
    svg: c => `<rect x="34" y="140" width="52" height="20" rx="4" fill="#C2452F" ${S}/><path d="M50 140 L54 114 H66 L70 140 Z" fill="${c.o}" ${S}/><path d="M28 36 H92 L80 104 C74 112,46 112,40 104 Z" fill="${c.o}" ${S}/><text x="60" y="88" text-anchor="middle" font-family="Oswald" font-weight="700" font-size="46" fill="#0C0C0C">8</text>`,
  },
  relampago: {
    real: false, nome: 'Mata-mata Relâmpago', onde: 'online', fundo: 'radial-gradient(ellipse at 50% 35%,#5b34d6,#140838 70%)',
    svg: c => `<rect x="34" y="140" width="52" height="20" rx="4" fill="#3b1f8f" ${S}/><path d="M52 140 L56 114 H64 L68 140 Z" fill="${c.o}" ${S}/><path d="M28 34 H92 C92 80,80 106,60 114 C40 106,28 80,28 34 Z" fill="${c.p}" ${S}/><path d="M28 46 C12 46,12 74,32 78 M92 46 C108 46,108 74,88 78" fill="none" ${S}/><path d="M66 38 L46 76 H60 L52 106 L78 62 H63 L72 38 Z" fill="${c.o}" ${S}/>`,
  },
  sulminas: {
    real: false, nome: 'Sul × Minas-Paraná', onde: 'online (copa regional)', fundo: 'radial-gradient(ellipse at 50% 40%,#2e7d32,#0E3B1A 72%)',
    svg: c => `<rect x="38" y="142" width="44" height="18" rx="4" fill="#0E5B2A" ${S}/><path d="M52 142 L55 104 H65 L68 142 Z" fill="${c.p}" ${S}/><path d="M40 26 H80 C80 70,72 98,60 104 C48 98,40 70,40 26 Z" fill="${c.o}" ${S}/><path d="M42 34 C30 34,30 62,46 66 M78 34 C90 34,90 62,74 66" fill="none" ${S}/>`,
  },
  carV: {
    real: false, nova: true, nome: 'Várzea', onde: 'carreira (e Sala de Troféus)', fundo: 'radial-gradient(ellipse at 50% 40%,#9a6631,#2b1608 72%)',
    // nova, mas inventada: a taça de lata do terrão em cima do caixote
    svg: c => `<rect x="30" y="132" width="60" height="28" rx="2" fill="${c.m}" ${S}/><path d="M30 146 H90 M45 132 V160 M75 132 V160" stroke="#0C0C0C" stroke-width="2"/>
      <path d="M50 132 L53 112 H67 L70 132 Z" fill="${c.p}" ${S}/>
      <path d="M36 44 H84 L78 100 C72 112,48 112,42 100 Z" fill="${c.p}" ${S}/>
      <path d="M38 52 C22 52,22 82,42 84 M82 52 C98 52,98 82,78 84" fill="none" ${S}/>
      <path d="M44 60 L52 66 M70 58 L76 70 M50 88 L58 84" stroke="#8E9AA8" stroke-width="2.5" stroke-linecap="round"/>
      <ellipse cx="60" cy="44" rx="24" ry="5" fill="#c9d1da" ${S}/>`,
  },
}
