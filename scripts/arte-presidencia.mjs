// ─── 🏛️ ARTE DA SALA DA PRESIDÊNCIA (03/09) ─────────────────────────────────
//
// O Diego não quis nem desenho cru em SVG à mão ("n quero criado a mão estilo
// svg cara") nem gerador externo ("faz por vc a arte então pelo Claude msm
// igual vc faz vídeo e etc"). Então é isto: arte feita AQUI, com código, mas
// com capricho de ilustração — madeira com veio, vidro com reflexo, luz que
// cai, sombra que assenta o móvel no chão, quatro tons por material.
// Sai PNG e .webp; o que vai pro jogo é o .webp.
//
// A ideia que manda: a sala não ganha só objeto, ela ENRIQUECE. Parede, chão,
// luz e moldura mudam de divisão em divisão. Quem bate o olho numa screenshot
// sabe na hora se o presidente está na miséria ou milionário, sem ler nada.
//
// uso: node scripts/arte-presidencia.mjs [--pasta /tmp/arte-presid]
import { writeFileSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'

const OUT = (i => i > 0 ? process.argv[i + 1] : '/tmp/arte-presid')(process.argv.indexOf('--pasta')); mkdirSync(OUT, { recursive: true })
const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F'
const W = 1280, H = 1180
const ORDEM = ['V', 'D', 'C', 'B', 'A']
const de = (d, m) => ORDEM.indexOf(d) >= ORDEM.indexOf(m)
const NTROF = { V: 0, D: 1, C: 3, B: 7, A: 14 }
const NOME = { V: 'VÁRZEA', D: 'SÉRIE D', C: 'SÉRIE C', B: 'SÉRIE B', A: 'SÉRIE A' }

// ── ferramentas de ilustração ───────────────────────────────────────────────
const grad = (id, stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1) =>
  `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`
// sombra que assenta o móvel no chão (borrada de verdade, não bloco chapado)
const pousa = (cx, cy, rx, op = 0.34) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${rx * 0.17}" fill="#000" opacity="${op}" filter="url(#borrao)"/>`
// veio de madeira: linhas finas e irregulares, o que tira a cara de "chapado"
const veio = (x, y, w, h, n = 7, cor = 'rgba(0,0,0,.16)') => {
  let o = ''
  for (let i = 0; i < n; i++) {
    const yy = y + (h / (n + 1)) * (i + 1) + (i % 3) * 2
    o += `<path d="M${x} ${yy} q${w * 0.3} ${i % 2 ? -3 : 3} ${w * 0.55} 0 t${w * 0.45} 0" fill="none" stroke="${cor}" stroke-width="${1.4 + (i % 2) * 0.7}" opacity=".85"/>`
  }
  return o
}
// taça de verdade: pé, haste, copa, alças e brilho
const taca = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})">
  <ellipse cx="0" cy="30" rx="15" ry="4" fill="#000" opacity=".28"/>
  <rect x="-13" y="22" width="26" height="7" rx="3" fill="url(#ouroG)" stroke="${INK}" stroke-width="2.6"/>
  <rect x="-4" y="10" width="8" height="13" fill="url(#ouroG)" stroke="${INK}" stroke-width="2.6"/>
  <path d="M-15 -20 h30 v9 a15 17 0 0 1 -30 0 z" fill="url(#ouroG)" stroke="${INK}" stroke-width="2.8"/>
  <path d="M-15 -15 h-9 a9 9 0 0 0 9 11 M15 -15 h9 a9 9 0 0 1 -9 11" fill="none" stroke="${INK}" stroke-width="2.6"/>
  <path d="M-8 -16 v6 a7 8 0 0 0 5 8" fill="none" stroke="#FFF3C4" stroke-width="3" stroke-linecap="round" opacity=".9"/>
</g>`

const sala = (d) => {
  const luxo = de(d, 'A'), rico = de(d, 'B'), medio = de(d, 'C')
  const PY = 690        // linha do chão
  const nt = NTROF[d]
  const parA = d === 'V' ? '#CFC3A6' : luxo ? '#EFE3C2' : '#F1E8CE'
  const parB = d === 'V' ? '#B3A78A' : luxo ? '#D8C79E' : '#DED0AC'
  const chaoA = d === 'V' ? '#A9A296' : luxo ? '#6B4220' : '#8A5730'
  const chaoB = d === 'V' ? '#7E786D' : luxo ? '#3E230D' : '#5A3418'
  const madA = luxo ? '#6E4321' : '#8B5A2B', madB = luxo ? '#3C210C' : '#5A3517'

  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  ${grad('parede', [[0, parA], [0.62, parA], [1, parB]])}
  ${grad('chao', [[0, chaoA], [1, chaoB]])}
  ${grad('ouroG', [[0, '#FFE9A0'], [0.42, GOLD], [1, '#C89400']])}
  ${grad('mad', [[0, luxo ? '#8A5527' : '#A06B33'], [0.5, madA], [1, madB]], 0, 0, 0.25, 1)}
  ${grad('madTopo', [[0, luxo ? '#A26A32' : '#B87C41'], [1, madA]])}
  ${grad('couro', [[0, '#6A4520'], [0.45, '#4A2E13'], [1, '#2E1A08']])}
  ${grad('vidro', [[0, 'rgba(255,255,255,.55)'], [0.35, 'rgba(190,232,255,.24)'], [1, 'rgba(140,200,235,.14)']])}
  ${grad('ceu', [[0, '#101B33'], [0.55, '#1E3350'], [1, '#33526F']])}
  ${grad('diaCeu', [[0, '#7FBEE8'], [1, '#CFE7F5']])}
  ${grad('tap', [[0, '#7A2320'], [0.5, '#A83F36'], [1, '#7A2320']], 0, 0, 1, 0)}
  <radialGradient id="halo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFF3C4" stop-opacity=".85"/><stop offset="1" stop-color="#FFF3C4" stop-opacity="0"/></radialGradient>
  <radialGradient id="vinheta" cx="50%" cy="46%" r="72%"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".26"/></radialGradient>
  <filter id="borrao" x="-60%" y="-160%" width="220%" height="420%"><feGaussianBlur stdDeviation="11"/></filter>
  <filter id="borraoP" x="-60%" y="-160%" width="220%" height="420%"><feGaussianBlur stdDeviation="5"/></filter>
  <filter id="graos"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3"/><feColorMatrix type="saturate" values="0"/></filter>
  <pattern id="tabuas" x="0" y="0" width="96" height="${H}" patternUnits="userSpaceOnUse">
    <rect width="96" height="${H}" fill="url(#chao)"/><rect x="93" width="3" height="${H}" fill="#000" opacity=".22"/>
  </pattern>
</defs>

<!-- ═══ PAREDE ═══ -->
<rect width="${W}" height="${PY}" fill="url(#parede)"/>
${d === 'V'
      ? `<g opacity=".5"><ellipse cx="930" cy="200" rx="130" ry="86" fill="#B5A98C"/><ellipse cx="300" cy="560" rx="96" ry="58" fill="#B5A98C"/>
         <path d="M186 96 q34 78 -12 152" fill="none" stroke="#9C9077" stroke-width="6" stroke-linecap="round"/>
         <path d="M1040 470 q-24 60 6 108" fill="none" stroke="#9C9077" stroke-width="5" stroke-linecap="round"/></g>`
      : ''}
${luxo
      ? `<g><rect y="470" width="${W}" height="220" fill="url(#mad)"/>${veio(0, 470, W, 220, 9)}
       ${[24, 284, 544, 804, 1064].map(x => `<g><rect x="${x}" y="500" width="196" height="164" rx="6" fill="none" stroke="#2E1A08" stroke-width="7" opacity=".55"/><rect x="${x + 10}" y="510" width="176" height="144" rx="4" fill="rgba(255,255,255,.06)"/></g>`).join('')}
       <rect y="452" width="${W}" height="20" fill="url(#ouroG)"/><rect y="444" width="${W}" height="9" fill="#2E1A08"/>
       <rect y="0" width="${W}" height="26" fill="url(#mad)"/><rect y="26" width="${W}" height="11" fill="url(#ouroG)"/></g>`
      : medio
        ? `<g><rect y="530" width="${W}" height="160" fill="#DCCFA9"/><rect y="522" width="${W}" height="12" fill="#C6B78E"/><rect y="516" width="${W}" height="7" fill="#B0A177"/></g>`
        : ''}

<!-- ═══ RODAPÉ + CHÃO ═══ -->
<rect y="${PY - 34}" width="${W}" height="34" fill="${luxo ? '#3C210C' : d === 'V' ? '#8C867A' : '#5A3517'}"/>
<rect y="${PY - 41}" width="${W}" height="9" fill="${luxo ? GOLD : d === 'V' ? '#A29B8D' : '#9A7A3F'}"/>
${d === 'V'
      ? `<rect y="${PY}" width="${W}" height="${H - PY}" fill="url(#chao)"/>
       <g opacity=".55" stroke="#6E685E" stroke-width="6" fill="none" stroke-linecap="round">
         <path d="M60 760 L230 830 L180 960"/><path d="M600 720 L760 800 L700 900 L820 1010"/><path d="M980 800 L1120 870 L1080 990"/></g>
       <g opacity=".35" fill="#8E877B">${[[300, 900, 70, 16], [860, 1060, 90, 20], [140, 1080, 60, 14]].map(([x, y, a, b]) => `<ellipse cx="${x}" cy="${y}" rx="${a}" ry="${b}"/>`).join('')}</g>`
      : `<g><rect y="${PY}" width="${W}" height="${H - PY}" fill="url(#tabuas)"/>
       ${veio(0, PY, W, H - PY, 10, 'rgba(0,0,0,.13)')}
       <rect y="${PY}" width="${W}" height="46" fill="#fff" opacity="${luxo ? 0.1 : 0.06}"/>
       ${luxo ? `<rect y="${PY}" width="${W}" height="${H - PY}" fill="#fff" opacity=".04"/>` : ''}</g>`}

<!-- ═══ LUZ ═══ -->
${d === 'V'
      ? `<g><line x1="640" y1="0" x2="640" y2="96" stroke="#2A2A2A" stroke-width="7"/>
       <ellipse cx="640" cy="150" rx="150" ry="120" fill="url(#halo)" opacity=".5"/>
       <circle cx="640" cy="128" r="30" fill="#F6E7A8" stroke="${INK}" stroke-width="7"/>
       <rect x="626" y="94" width="28" height="18" rx="4" fill="#9A9384" stroke="${INK}" stroke-width="6"/></g>`
      : luxo
        ? `<g><ellipse cx="640" cy="180" rx="270" ry="150" fill="url(#halo)" opacity=".55"/>
         <line x1="640" y1="0" x2="640" y2="60" stroke="#2E1A08" stroke-width="9"/>
         <path d="M486 92 h308 l-56 74 h-196 z" fill="url(#ouroG)" stroke="${INK}" stroke-width="9"/>
         <path d="M508 104 h264 l-18 24 h-228 z" fill="#fff" opacity=".3"/>
         ${[572, 640, 708].map(x => `<g><line x1="${x}" y1="166" x2="${x}" y2="188" stroke="#2E1A08" stroke-width="7"/><circle cx="${x}" cy="206" r="23" fill="#FFF3C4" stroke="${INK}" stroke-width="7"/><circle cx="${x}" cy="206" r="52" fill="url(#halo)" opacity=".7"/></g>`).join('')}</g>`
        : ''}

<!-- ═══ JANELA ═══ -->
${de(d, 'D') ? (() => {
      const jx = rico ? 884 : 900, jy = rico ? 120 : 176, jw = rico ? 364 : 268, jh = rico ? 462 : 322
      const noite = medio
      return `<g>${rico ? `<ellipse cx="${jx + jw / 2}" cy="${jy + jh / 2}" rx="${jw * 0.82}" ry="${jh * 0.72}" fill="url(#halo)" opacity=".3"/>` : ''}
      <rect x="${jx - 10}" y="${jy - 10}" width="${jw + 20}" height="${jh + 20}" rx="12" fill="${luxo ? 'url(#mad)' : '#EAE0C4'}" stroke="${INK}" stroke-width="9"/>
      ${luxo ? `<rect x="${jx - 4}" y="${jy - 4}" width="${jw + 8}" height="${jh + 8}" rx="8" fill="none" stroke="${GOLD}" stroke-width="6"/>` : ''}
      <rect x="${jx}" y="${jy}" width="${jw}" height="${jh}" fill="url(#${noite ? 'ceu' : 'diaCeu'})"/>
      ${noite
          ? `<g><circle cx="${jx + jw * 0.2}" cy="${jy + 60}" r="2.6" fill="#fff" opacity=".8"/><circle cx="${jx + jw * 0.62}" cy="${jy + 38}" r="2" fill="#fff" opacity=".7"/><circle cx="${jx + jw * 0.84}" cy="${jy + 92}" r="2.4" fill="#fff" opacity=".6"/>
         <ellipse cx="${jx + jw / 2}" cy="${jy + jh - 78}" rx="${jw * 0.46}" ry="${jh * 0.16}" fill="#17673A"/>
         <ellipse cx="${jx + jw / 2}" cy="${jy + jh - 78}" rx="${jw * 0.46}" ry="${jh * 0.16}" fill="none" stroke="#2C9455" stroke-width="4" opacity=".7"/>
         <ellipse cx="${jx + jw / 2}" cy="${jy + jh - 78}" rx="${jw * 0.27}" ry="${jh * 0.09}" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="4"/>
         <path d="M${jx + jw * 0.1} ${jy + jh - 128} h${jw * 0.8} l-${jw * 0.06} 48 h-${jw * 0.68} z" fill="#2E4A6B"/>
         ${[0.2, 0.8].map(f => `<g><path d="M${jx + jw * f} ${jy + 78} L${jx + jw * f - 62} ${jy + 250} L${jx + jw * f + 62} ${jy + 250} Z" fill="${GOLD}" opacity=".16"/>
            <line x1="${jx + jw * f}" y1="${jy + 86}" x2="${jx + jw * f}" y2="${jy + jh - 128}" stroke="#8FA4BD" stroke-width="7"/>
            <circle cx="${jx + jw * f}" cy="${jy + 76}" r="15" fill="#FFF3C4" stroke="${INK}" stroke-width="5"/>
            <circle cx="${jx + jw * f}" cy="${jy + 76}" r="34" fill="url(#halo)" opacity=".8"/></g>`).join('')}</g>`
          : `<g><circle cx="${jx + jw * 0.74}" cy="${jy + 74}" r="34" fill="#FFF6D2"/>
         ${[[0.24, 0.3, 54], [0.5, 0.2, 38]].map(([fx, fy, r]) => `<g fill="#fff" opacity=".9"><ellipse cx="${jx + jw * fx}" cy="${jy + jh * fy}" rx="${r}" ry="${r * 0.5}"/><ellipse cx="${jx + jw * fx + r * 0.5}" cy="${jy + jh * fy - r * 0.28}" rx="${r * 0.6}" ry="${r * 0.42}"/></g>`).join('')}
         <ellipse cx="${jx + jw / 2}" cy="${jy + jh - 54}" rx="${jw * 0.46}" ry="${jh * 0.15}" fill="#2C9455"/></g>`}
      <rect x="${jx}" y="${jy}" width="${jw}" height="${jh * 0.42}" fill="#fff" opacity=".07"/>
      <line x1="${jx + jw / 2}" y1="${jy}" x2="${jx + jw / 2}" y2="${jy + jh}" stroke="${INK}" stroke-width="9"/>
      <line x1="${jx}" y1="${jy + jh / 2}" x2="${jx + jw}" y2="${jy + jh / 2}" stroke="${INK}" stroke-width="9"/>
      <rect x="${jx}" y="${jy}" width="${jw}" height="${jh}" fill="none" stroke="${INK}" stroke-width="7"/></g>`
    })() : ''}

<!-- ═══ CALENDÁRIO TORTO (Várzea) ═══ -->
${d === 'V' ? `<g transform="translate(232,214) rotate(-7)"><ellipse cx="70" cy="180" rx="60" ry="12" fill="#000" opacity=".14" filter="url(#borraoP)"/>
  <rect x="0" y="0" width="140" height="176" rx="7" fill="#F7F3E6" stroke="${INK}" stroke-width="8"/>
  <rect x="0" y="0" width="140" height="44" fill="${RED}" stroke="${INK}" stroke-width="7"/>
  <text x="70" y="130" text-anchor="middle" font-family="Georgia,serif" font-size="66" font-weight="bold" fill="${INK}">12</text>
  <circle cx="70" cy="-10" r="7" fill="#6E685E" stroke="${INK}" stroke-width="4"/></g>` : ''}

<!-- ═══ ESTANTE DE TROFÉUS (Série C) ═══ -->
${medio ? (() => {
      const ex = 46, ey = luxo ? 176 : 250, ew = 330, eb = PY - 6
      const linhas = luxo ? [ey + 96, ey + 200, ey + 304, ey + 408] : [ey + 108, ey + 220, ey + 332]
      return `<g>${pousa(ex + ew / 2, eb + 16, 186)}
    <rect x="${ex - 12}" y="${ey - 16}" width="${ew + 24}" height="${eb - ey + 16}" rx="10" fill="url(#mad)" stroke="${INK}" stroke-width="9"/>
    ${veio(ex - 12, ey - 16, ew + 24, eb - ey + 16, 8)}
    <rect x="${ex}" y="${ey}" width="${ew}" height="${eb - ey - 6}" fill="${luxo ? '#2A1607' : '#41260F'}"/>
    ${luxo ? `<rect x="${ex}" y="${ey}" width="${ew}" height="${eb - ey - 6}" fill="url(#halo)" opacity=".22"/>` : ''}
    ${linhas.filter(y => y < eb - 30).map(y => `<g><rect x="${ex}" y="${y}" width="${ew}" height="14" fill="${luxo ? 'url(#ouroG)' : madA}"/><rect x="${ex}" y="${y + 14}" width="${ew}" height="7" fill="#000" opacity=".3"/></g>`).join('')}
    ${(() => { let o = '', k = 0
        for (const y of linhas) { for (const x of [ex + 58, ex + 165, ex + 272]) { if (k < nt && y < eb - 30) { o += taca(x, y - 6, luxo ? 0.88 : 1.02); k++ } } }
        return o })()}
    <rect x="${ex - 12}" y="${ey - 16}" width="${ew + 24}" height="${eb - ey + 16}" rx="10" fill="url(#vidro)" opacity=".5"/>
    <path d="M${ex + 26} ${ey + 6} L${ex + 128} ${ey + 6} L${ex + 30} ${eb - 20} L${ex - 4} ${eb - 20} Z" fill="#fff" opacity=".1"/>
    <rect x="${ex - 12}" y="${ey - 16}" width="${ew + 24}" height="${eb - ey + 16}" rx="10" fill="none" stroke="${INK}" stroke-width="9"/></g>`
    })() : ''}

<!-- ═══ MANTO EMOLDURADO (Série B) ═══ -->
${rico ? `<g transform="translate(432,${luxo ? 224 : 200})">${''}
  <rect x="6" y="10" width="228" height="292" rx="10" fill="#000" opacity=".2" filter="url(#borraoP)"/>
  <rect x="0" y="0" width="228" height="292" rx="10" fill="${luxo ? 'url(#mad)' : '#EAE0C4'}" stroke="${INK}" stroke-width="9"/>
  ${luxo ? `<rect x="13" y="13" width="202" height="266" rx="5" fill="none" stroke="${GOLD}" stroke-width="7"/>` : ''}
  <rect x="26" y="26" width="176" height="240" fill="#F7F3E6" stroke="${INK}" stroke-width="5"/>
  <path d="M60 66 L92 48 h44 l32 18 20 30 -26 24 -10 -11 v106 h-84 v-106 l-10 11 -26 -24 z" fill="#fff" stroke="${INK}" stroke-width="7"/>
  ${[86, 106, 126, 146].map(x => `<rect x="${x}" y="84" width="11" height="132" fill="${GREEN}"/>`).join('')}
  <path d="M64 70 L92 50" stroke="#fff" stroke-width="6" opacity=".9"/></g>` : ''}

<!-- ═══ ESCUDO NA PAREDE ═══ -->
${de(d, 'D') ? `<g transform="translate(${rico ? 690 : 470},${rico ? 322 : 250})">${pousa(0, 0, 0, 0)}
  <path d="M84 6 L162 32 V118 C162 172 126 202 84 218 C42 202 6 172 6 118 V32 Z" fill="#000" opacity=".22" transform="translate(7,9)" filter="url(#borraoP)"/>
  <path d="M84 6 L162 32 V118 C162 172 126 202 84 218 C42 202 6 172 6 118 V32 Z" fill="${GREEN}" stroke="${INK}" stroke-width="9"/>
  <path d="M84 28 L140 47 V116 C140 152 114 176 84 190 Z" fill="#12572A"/>
  <path d="M84 6 L162 32 V60 C130 44 108 36 84 30 Z" fill="#fff" opacity=".16"/>
  <text x="84" y="140" text-anchor="middle" font-family="Georgia,serif" font-size="82" font-weight="bold" fill="#fff">T</text>
  ${luxo ? `<circle cx="84" cy="112" r="122" fill="none" stroke="${GOLD}" stroke-width="8" opacity=".85"/>` : ''}</g>` : ''}

<!-- ═══ TAPETE (Série C) ═══ -->
${medio ? `<g><ellipse cx="640" cy="${PY + 268}" rx="${luxo ? 500 : 430}" ry="${luxo ? 118 : 100}" fill="url(#tap)" stroke="${INK}" stroke-width="9"/>
  <ellipse cx="640" cy="${PY + 268}" rx="${luxo ? 420 : 360}" ry="${luxo ? 92 : 78}" fill="none" stroke="rgba(255,255,255,.34)" stroke-width="7"/>
  <ellipse cx="640" cy="${PY + 268}" rx="${luxo ? 340 : 292}" ry="${luxo ? 68 : 58}" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="5"/></g>` : ''}

<!-- ═══ O TRONO: poltrona atrás + mesa robusta na frente ═══ -->
${medio ? `<g><rect x="516" y="${PY - 216}" width="248" height="286" rx="66" fill="url(#couro)" stroke="${INK}" stroke-width="10"/>
  <rect x="548" y="${PY - 186}" width="184" height="226" rx="50" fill="#5A3A18"/>
  ${[[604, PY - 146], [676, PY - 146], [604, PY - 74], [676, PY - 74]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#2E1A08"/>`).join('')}
  <path d="M540 ${PY - 190} q-8 60 0 120" fill="none" stroke="#fff" stroke-width="9" opacity=".13"/>
  ${luxo ? `<rect x="596" y="${PY - 208}" width="88" height="14" rx="7" fill="url(#ouroG)" stroke="${INK}" stroke-width="4"/>` : ''}</g>` : ''}
${de(d, 'D')
      ? `<g>${pousa(640, PY + 246, 400)}
     <rect x="252" y="${PY - 8}" width="776" height="52" rx="14" fill="url(#madTopo)" stroke="${INK}" stroke-width="10"/>
     ${veio(262, PY - 4, 756, 44, 4, 'rgba(0,0,0,.14)')}
     <rect x="252" y="${PY - 8}" width="776" height="16" rx="8" fill="#fff" opacity=".18"/>
     ${luxo ? `<rect x="252" y="${PY + 30}" width="776" height="14" fill="url(#ouroG)"/>` : ''}
     <rect x="292" y="${PY + 44}" width="696" height="164" rx="10" fill="url(#mad)" stroke="${INK}" stroke-width="9"/>
     ${veio(292, PY + 44, 696, 164, 6)}
     ${[408, 640, 872].map(x => `<g><rect x="${x - 88}" y="${PY + 74}" width="176" height="46" rx="7" fill="${luxo ? '#2E1A08' : '#4A2E13'}" stroke="${INK}" stroke-width="5"/><rect x="${x - 26}" y="${PY + 92}" width="52" height="11" rx="5" fill="${luxo ? 'url(#ouroG)' : '#8B5A2B'}"/>
        <rect x="${x - 88}" y="${PY + 134}" width="176" height="46" rx="7" fill="${luxo ? '#2E1A08' : '#4A2E13'}" stroke="${INK}" stroke-width="5"/><rect x="${x - 26}" y="${PY + 152}" width="52" height="11" rx="5" fill="${luxo ? 'url(#ouroG)' : '#8B5A2B'}"/></g>`).join('')}
     <g><rect x="700" y="${PY - 34}" width="150" height="30" rx="5" fill="#F7F3E6" stroke="${INK}" stroke-width="6"/><rect x="716" y="${PY - 28}" width="118" height="6" rx="3" fill="#C9C2AE"/><rect x="716" y="${PY - 16}" width="86" height="6" rx="3" fill="#C9C2AE"/></g>
     <g transform="translate(884,${PY - 74})"><rect x="0" y="34" width="42" height="38" rx="6" fill="${luxo ? '#2E1A08' : '#4A2E13'}" stroke="${INK}" stroke-width="6"/>${[10, 22, 32].map((x, i) => `<line x1="${x}" y1="34" x2="${x - 4 + i * 4}" y2="${4 + i * 6}" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`).join('')}</g>`
      : `<g>${pousa(640, PY + 200, 210)}
     <rect x="430" y="${PY - 56}" width="420" height="30" rx="8" fill="#E8E3D4" stroke="${INK}" stroke-width="9" transform="rotate(-2 640 ${PY - 40})"/>
     <line x1="470" y1="${PY - 26}" x2="446" y2="${PY + 152}" stroke="#8C867A" stroke-width="12" stroke-linecap="round"/>
     <line x1="812" y1="${PY - 26}" x2="836" y2="${PY + 152}" stroke="#8C867A" stroke-width="12" stroke-linecap="round"/>
     <g transform="translate(300,${PY - 96})">${pousa(56, 248, 60)}
       <rect x="12" y="0" width="94" height="100" rx="10" fill="#EFEFEA" stroke="${INK}" stroke-width="9"/>
       <rect x="0" y="100" width="118" height="24" rx="8" fill="#EFEFEA" stroke="${INK}" stroke-width="9"/>
       <line x1="20" y1="124" x2="8" y2="244" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><line x1="98" y1="124" x2="110" y2="244" stroke="${INK}" stroke-width="9" stroke-linecap="round"/></g>
     <g transform="translate(902,${PY - 130})">${pousa(50, 250, 56)}
       <rect x="0" y="0" width="100" height="100" rx="12" fill="#E4E9ED" stroke="${INK}" stroke-width="9"/>
       <circle cx="50" cy="50" r="30" fill="#CBD5DC" stroke="${INK}" stroke-width="7"/>
       ${[0, 60, 120, 180, 240, 300].map(a => `<line x1="50" y1="50" x2="${50 + 26 * Math.cos(a * Math.PI / 180)}" y2="${50 + 26 * Math.sin(a * Math.PI / 180)}" stroke="${INK}" stroke-width="5"/>`).join('')}
       <rect x="34" y="100" width="32" height="94" fill="#E4E9ED" stroke="${INK}" stroke-width="8"/><rect x="8" y="194" width="84" height="20" rx="9" fill="#CBD5DC" stroke="${INK}" stroke-width="8"/></g>`}

<!-- ═══ 💎 O DIAMANTE: coluna própria, redoma grande, luz em cima (Série B) ═══ -->
${rico ? `<g transform="translate(112,${PY - 190})">${pousa(88, 384, 106)}
  <ellipse cx="88" cy="60" rx="150" ry="180" fill="url(#halo)" opacity=".55"/>
  <rect x="34" y="238" width="108" height="140" fill="url(#mad)" stroke="${INK}" stroke-width="9"/>
  ${veio(34, 238, 108, 140, 5)}
  <rect x="10" y="360" width="156" height="30" rx="7" fill="${luxo ? '#2E1A08' : '#4A2E13'}" stroke="${INK}" stroke-width="8"/>
  <rect x="16" y="212" width="144" height="34" rx="7" fill="${luxo ? 'url(#ouroG)' : 'url(#madTopo)'}" stroke="${INK}" stroke-width="9"/>
  <path d="M22 212 a66 116 0 0 1 132 0 z" fill="url(#vidro)" stroke="${INK}" stroke-width="9"/>
  <path d="M56 158 a36 62 0 0 1 20 -46" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity=".75"/>
  <g transform="translate(88,158)">
    <path d="M0 -62 L48 -20 L0 58 L-48 -20 Z" fill="#7FDCF7" stroke="${INK}" stroke-width="7"/>
    <path d="M-48 -20 h96" stroke="${INK}" stroke-width="6"/>
    <path d="M0 -62 L-17 -20 L0 58 L17 -20 Z" fill="#D6F4FF"/>
    <path d="M-30 -34 l14 -14" stroke="#fff" stroke-width="8" stroke-linecap="round"/>
    <path d="M-17 -20 L0 -62 L17 -20 Z" fill="#fff" opacity=".55"/></g></g>` : ''}

<!-- ═══ MASCOTE NO PEDESTAL (Série B) ═══ -->
${rico ? `<g transform="translate(1058,${PY - 88})">${pousa(76, 246, 92)}
  <rect x="26" y="118" width="104" height="112" fill="${luxo ? '#E6DDC5' : '#CFC7B1'}" stroke="${INK}" stroke-width="9"/>
  <rect x="4" y="222" width="148" height="26" rx="7" fill="${luxo ? '#CFC5A5' : '#9A927C'}" stroke="${INK}" stroke-width="8"/>
  <rect x="10" y="96" width="136" height="26" rx="6" fill="${luxo ? 'url(#ouroG)' : '#B9B09A'}" stroke="${INK}" stroke-width="8"/>
  ${veio(26, 118, 104, 112, 3, 'rgba(0,0,0,.1)')}
  <text x="78" y="86" text-anchor="middle" font-size="118">🐯</text></g>` : ''}

<!-- ═══ O EXAGERO DA SÉRIE A ═══ -->
${luxo ? `<g transform="translate(1108,${PY + 208})">${pousa(78, 262, 92)}
    <rect x="0" y="0" width="156" height="240" rx="10" fill="#1F5B78" stroke="${INK}" stroke-width="9"/>
    <rect x="14" y="18" width="128" height="204" fill="#4FA3C7"/>
    <rect x="14" y="18" width="128" height="80" fill="#7FC6E2" opacity=".6"/>
    ${[[46, 74], [104, 128], [58, 176]].map(([x, y]) => `<g transform="translate(${x},${y})"><path d="M0 0 l26 -13 v26 z" fill="${GOLD}" stroke="${INK}" stroke-width="3.5"/><circle cx="7" cy="0" r="3" fill="${INK}"/></g>`).join('')}
    ${[[36, 190], [92, 206], [122, 178]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#fff" opacity=".55"/>`).join('')}
    <rect x="0" y="0" width="156" height="240" rx="10" fill="url(#vidro)" opacity=".45"/>
    <rect x="-8" y="-26" width="172" height="34" rx="8" fill="url(#ouroG)" stroke="${INK}" stroke-width="9"/></g>
  <g transform="translate(872,${PY + 222})">${pousa(58, 236, 70)}
    <rect x="24" y="128" width="70" height="106" fill="#CFC7B1" stroke="${INK}" stroke-width="9"/>
    <rect x="6" y="226" width="106" height="22" rx="6" fill="#B9B09A" stroke="${INK}" stroke-width="8"/>
    <path d="M34 128 q24 -30 50 0 z" fill="#8C6218" stroke="${INK}" stroke-width="7"/>
    <circle cx="59" cy="72" r="50" fill="#B07A2B" stroke="${INK}" stroke-width="9"/>
    <path d="M22 60 a37 32 0 0 1 74 0" fill="#8C6218" stroke="${INK}" stroke-width="7"/>
    <circle cx="43" cy="76" r="5.5" fill="${INK}"/><circle cx="76" cy="76" r="5.5" fill="${INK}"/>
    <path d="M46 100 q13 11 27 0" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
    <path d="M30 46 a34 30 0 0 1 22 -14" fill="none" stroke="#fff" stroke-width="7" opacity=".45" stroke-linecap="round"/></g>
  <g transform="translate(300,${PY + 216})">${pousa(80, 176, 88)}
    <rect x="6" y="56" width="152" height="16" rx="6" fill="url(#ouroG)" stroke="${INK}" stroke-width="7"/>
    <rect x="6" y="120" width="152" height="16" rx="6" fill="url(#ouroG)" stroke="${INK}" stroke-width="7"/>
    <line x1="20" y1="72" x2="20" y2="120" stroke="${INK}" stroke-width="7"/><line x1="144" y1="72" x2="144" y2="120" stroke="${INK}" stroke-width="7"/>
    <circle cx="26" cy="152" r="14" fill="#2A2A2A" stroke="${INK}" stroke-width="6"/><circle cx="138" cy="152" r="14" fill="#2A2A2A" stroke="${INK}" stroke-width="6"/>
    <path d="M58 4 h26 v22 l12 30 h-50 l12 -30 z" fill="#17512C" stroke="${INK}" stroke-width="7"/>
    <rect x="60" y="10" width="8" height="34" fill="#fff" opacity=".3"/>
    ${[112, 134].map(x => `<path d="M${x} 20 l16 0 -8 18 z" fill="#F7F3E6" stroke="${INK}" stroke-width="5"/>`).join('')}</g>` : ''}

<!-- ═══ VASO (D até B) ═══ -->
${de(d, 'D') && !luxo ? `<g transform="translate(1128,${PY - 6})">${pousa(52, 172, 62)}
  <path d="M8 60 h88 l-12 104 h-64 z" fill="#B5642F" stroke="${INK}" stroke-width="9"/>
  <rect x="0" y="42" width="104" height="26" rx="6" fill="#C97440" stroke="${INK}" stroke-width="9"/>
  <path d="M52 44 C-6 8 16 -66 52 -22 C88 -66 110 8 52 44 Z" fill="${GREEN}" stroke="${INK}" stroke-width="9"/>
  <path d="M52 44 v-58" stroke="#12572A" stroke-width="7"/></g>` : ''}

<rect width="${W}" height="${H}" fill="url(#vinheta)"/>
<rect width="${W}" height="${H}" filter="url(#graos)" opacity=".05" style="mix-blend-mode:multiply"/>
</svg>`
}

// ── render ──────────────────────────────────────────────────────────────────
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
for (const d of ORDEM) {
  const svg = sala(d)
  const p = `${OUT}/sala-${d}.html`
  writeFileSync(p, `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#F4ECD6}</style>${svg}`)
  const pg = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
  await pg.goto('file://' + p); await pg.waitForTimeout(260)
  await pg.screenshot({ path: `${OUT}/sala-${d}.png` }); await pg.close()
  console.log(`${OUT}/sala-${d}.png  (${NOME[d]})`)
}
await b.close()
