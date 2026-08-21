// 🐊 MASCOTES DO SÓCIO + FESTÃO DO TÍTULO (aprovado pelo Diego 09/08 via GIF):
// a mascote é desenhada à mão (em código, tipo o escudo) e ATRAVESSA a tela
// quicando por cima da UI quando o dono é CAMPEÃO — pulão no meio, sombra,
// confete, ~4s, toque pula. SÓ o time campeão vê a própria festa (lei do som
// do martelo) e SÓ depois do apito (zero spoiler). A chave da mascote vem do
// esc_socios.mascote_key (Diego seta pelo painel).
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import tokaMascoteImg from './img/toka10-mascote.webp'
import erosNinaImg from './img/eros-nina-mascote.webp'
import sapekAbelhaImg from './img/sapek-mascote.webp'
import arrudaCobraImg from './img/arruda-mascote.webp'
import coringasMascoteImg from './img/coringas-mascote.webp'
import ferrariMascoteImg from './img/ferrari-mascote.webp' // 🏎️ Ferrari SC (adriano): arte própria do dono
import nataMascoteImg from './img/nata-mascote.webp' // 🤡 Nata de SP (pedrinhocamisa8): arte própria do dono
import skyyMascoteImg from './img/skyy-mascote.webp' // 🦅 Skyy FC (matheusncruz1): arte própria do dono
import bigaoMascoteImg from './img/bigao-mascote.webp' // 🧢 Crias do Bigão (giovannecastro784): arte própria do dono
import futpointMascoteImg from './img/futpoint-mascote.webp' // 📍 Futpoint FC (gfpicolo13): arte própria do dono

const INK = '#0C0C0C'

// registro das mascotes prontas (chave → desenho). Cada sócio que pedir ganha
// a dele aqui — 1ª da casa: a alface brava do Alfacehh FC.
export const MASCOTES: Record<string, ReactNode> = {
  // 🦁7️⃣ O LEÃO SEVEN do Seven City (batismo do glaucomiranda, Sócio nº 22) — aprovado
  // pelo Diego 15/08: leão forte de uniforme completo (juba azul-marinho, camisa e
  // calção com o 7 dourado, chuteira preta) com a bola dominada no pé. Homenagem ao
  // Seven Gamer (@sevengamersp). mascote_key = "leao_seven".
  leao_seven: (
    <svg width="140" height="168" viewBox="0 0 200 240">
      <ellipse cx="100" cy="234" rx="54" ry="8" fill="rgba(0,0,0,.15)"/>
      <g transform="translate(4,0) scale(0.8)">
        <path d="M76 138 Q46 146 40 172 Q38 190 52 198 L70 190 Q64 172 80 158 Z" fill="#E0A93E" stroke={INK} strokeWidth="5" strokeLinejoin="round"/>
        <path d="M52 172 q-8 10 2 20" stroke={INK} strokeWidth="3" fill="none"/>
        <path d="M164 138 Q194 146 200 172 Q202 190 188 198 L170 190 Q176 172 160 158 Z" fill="#E0A93E" stroke={INK} strokeWidth="5" strokeLinejoin="round"/>
        <path d="M188 172 q8 10 -2 20" stroke={INK} strokeWidth="3" fill="none"/>
        <path d="M76 134 L68 224 L172 224 L164 134 Q120 152 76 134 Z" fill="#12256B" stroke={INK} strokeWidth="5" strokeLinejoin="round"/>
        <path d="M96 164 Q120 176 144 164" stroke="#0B1B52" strokeWidth="4" fill="none"/>
        <path d="M133 176 L100 176 L100 190 L120 190 L104 214 L122 214 L140 184 Z" fill="#C9A227" stroke={INK} strokeWidth="4" strokeLinejoin="round"/>
        <path d="M68 224 L64 254 L102 254 L118 236 L120 254 L176 254 L172 224 Z" fill="#12256B" stroke={INK} strokeWidth="5" strokeLinejoin="round"/>
        <path d="M162 234 L148 234 L148 240 L156 240 L148 250 L157 250 L166 238 Z" fill="#C9A227" stroke={INK} strokeWidth="2.5" strokeLinejoin="round"/>
        <path d="M78 254 L76 274 L98 274 L98 254 Z" fill="#12256B" stroke={INK} strokeWidth="4"/>
        <path d="M142 254 L142 274 L164 274 L162 254 Z" fill="#12256B" stroke={INK} strokeWidth="4"/>
        <path d="M74 274 L100 274 L102 286 L70 286 Z" fill={INK}/>
        <path d="M140 274 L166 274 L172 286 L138 286 Z" fill={INK}/>
        <path d="M172 228 Q206 236 208 258" stroke={INK} strokeWidth="7" fill="none" strokeLinecap="round"/>
        <path d="M200 250 L218 252 L210 268 Z" fill="#12256B" stroke={INK} strokeWidth="4" strokeLinejoin="round"/>
        <circle cx="186" cy="276" r="17" fill="#fff" stroke={INK} strokeWidth="4"/>
        <path d="M186 268 L193 273 L190 281 L182 281 L179 273 Z" fill={INK}/>
        <g transform="translate(0,6)">
          <path d="M120 2 L137 22 L161 12 L165 38 L193 38 L183 62 L207 76 L183 90 L191 114 L165 112 L161 138 L135 128 L120 146 L105 128 L79 138 L75 112 L49 114 L57 90 L33 76 L57 62 L47 38 L75 38 L79 12 L103 22 Z" fill="#12256B" stroke={INK} strokeWidth="5" strokeLinejoin="round"/>
          <circle cx="85" cy="40" r="12" fill="#E0A93E" stroke={INK} strokeWidth="4"/>
          <circle cx="155" cy="40" r="12" fill="#E0A93E" stroke={INK} strokeWidth="4"/>
          <circle cx="120" cy="76" r="44" fill="#E0A93E" stroke={INK} strokeWidth="5"/>
          <path d="M92 60 L114 68" stroke={INK} strokeWidth="6" strokeLinecap="round"/>
          <path d="M148 60 L126 68" stroke={INK} strokeWidth="6" strokeLinecap="round"/>
          <circle cx="105" cy="76" r="6" fill={INK}/>
          <circle cx="135" cy="76" r="6" fill={INK}/>
          <ellipse cx="120" cy="94" rx="17" ry="12" fill="#F4D9A0" stroke={INK} strokeWidth="4"/>
          <path d="M114 90 L126 90 L120 98 Z" fill={INK}/>
          <path d="M120 98 L120 104 M112 108 Q120 114 128 108" stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round"/>
        </g>
      </g>
    </svg>
  ),
  // 🐈💛💙 O GATÃO do Barcenite FC (batismo do ricardopessoafreire, Sócio nº 12) —
  // aprovado pelo Diego 14/08: gato-selvagem amarelo/azul inspirado no CAT (o
  // mascote real do Barcelona dos 125 anos): orelhas pontudas, tufos na bochecha,
  // listras na testa, presinha no sorriso, camisa listrada do clube e bola no pé.
  // Desenhado em código (mesma linguagem do leao_thor). mascote_key = "gatao_bfc".
  gatao_bfc: (
    <svg width="140" height="168" viewBox="0 0 200 240">
      <ellipse cx="100" cy="232" rx="54" ry="9" fill="rgba(0,0,0,.15)"/>
      <path d="M162 178 Q188 168 184 140 Q182 124 168 122 Q178 138 170 152 Q164 164 150 170 Z" fill="#F0B446" stroke={INK} strokeWidth="5" strokeLinejoin="round"/>
      <path d="M184 140 Q183 128 168 122 L174 132 Z" fill="#0E3E86" stroke={INK} strokeWidth="4"/>
      <path d="M64 148 Q64 132 82 128 L118 128 Q136 132 136 148 L136 190 L64 190 Z" fill="#FFC400" stroke={INK} strokeWidth="6" strokeLinejoin="round"/>
      <rect x="76" y="128" width="14" height="62" fill="#0E3E86"/>
      <rect x="110" y="128" width="14" height="62" fill="#0E3E86"/>
      <path d="M64 148 Q64 132 82 128 L118 128 Q136 132 136 148 L136 190 L64 190 Z" fill="none" stroke={INK} strokeWidth="6" strokeLinejoin="round"/>
      <path d="M64 140 Q46 148 44 166 Q44 176 54 176 Q62 174 64 162 Z" fill="#F0B446" stroke={INK} strokeWidth="5" strokeLinejoin="round"/>
      <path d="M136 140 Q154 148 156 166 Q156 176 146 176 Q138 174 136 162 Z" fill="#F0B446" stroke={INK} strokeWidth="5" strokeLinejoin="round"/>
      <rect x="68" y="188" width="64" height="20" rx="6" fill="#0E3E86" stroke={INK} strokeWidth="5"/>
      <rect x="74" y="206" width="16" height="18" rx="6" fill="#F0B446" stroke={INK} strokeWidth="5"/>
      <rect x="110" y="206" width="16" height="18" rx="6" fill="#F0B446" stroke={INK} strokeWidth="5"/>
      <circle cx="146" cy="222" r="14" fill="#fff" stroke={INK} strokeWidth="5"/>
      <path d="M146 214 L153 219 L150 227 L142 227 L139 219 Z" fill={INK}/>
      <path d="M52 52 L68 24 L84 44 L116 44 L132 24 L148 52 Q160 68 158 88 Q156 104 144 112 L140 116 Q150 118 154 114 L148 126 Q138 130 130 124 Q116 132 84 132 Q70 130 60 124 L52 126 Q46 122 46 114 Q50 118 60 116 L56 112 Q44 104 42 88 Q40 68 52 52 Z" fill="#F0B446" stroke={INK} strokeWidth="6" strokeLinejoin="round"/>
      <path d="M62 42 L69 31 L76 40 Z" fill="#0E3E86"/>
      <path d="M138 42 L131 31 L124 40 Z" fill="#0E3E86"/>
      <path d="M74 92 Q76 78 100 78 Q124 78 126 92 Q126 112 100 116 Q74 112 74 92 Z" fill="#FFF6E0" stroke={INK} strokeWidth="4"/>
      <ellipse cx="80" cy="72" rx="11" ry="12" fill="#fff" stroke={INK} strokeWidth="4"/>
      <ellipse cx="120" cy="72" rx="11" ry="12" fill="#fff" stroke={INK} strokeWidth="4"/>
      <circle cx="82" cy="74" r="4.5" fill={INK}/>
      <circle cx="118" cy="74" r="4.5" fill={INK}/>
      <path d="M70 58 L90 54 M130 58 L110 54" stroke={INK} strokeWidth="4" strokeLinecap="round"/>
      <path d="M94 90 L106 90 L100 97 Z" fill={INK}/>
      <path d="M100 97 Q100 104 92 105 M100 97 Q100 104 108 105" stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <path d="M106 105 L110 111 L113 104" fill="#fff" stroke={INK} strokeWidth="3" strokeLinejoin="round"/>
      <path d="M60 88 L40 84 M60 96 L42 98 M140 88 L160 84 M140 96 L158 98" stroke={INK} strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M92 48 L92 58 M100 46 L100 58 M108 48 L108 58" stroke={INK} strokeWidth="4" strokeLinecap="round" opacity=".8"/>
    </svg>
  ),
  // 🏎️⚽ Ferrari SC (adriano.ferrari) — ARTE PRÓPRIA do dono (imagem webp): o cavalo-
  // piloto comemorando GOL, de macacão vermelho e capacete do Brasil. Pro festão do
  // campeão. mascote_key = "piloto_bola".
  piloto_bola: (
    <img src={ferrariMascoteImg} height={188} width={188} alt="Ferrari SC" style={{ flex: 'none', display: 'block', objectFit: 'contain' }} />
  ),
  // 🦁⚡ Leão Azul do Remo fantasiado de THOR (Remoçada — luiz.maia.luiz, Lenda+fundador).
  // Elmo alado, Mjölnir erguido, camisa azul-marinho/branca, capa vermelha. mascote_key = "leao_thor".
  leao_thor: (
    <svg width="126" height="178" viewBox="0 0 120 170">
      <g transform="translate(0,2)">
      <ellipse cx="60" cy="160" rx="44" ry="9" fill="rgba(0,0,0,.15)"/>
      <path d="M42 66 Q18 98 24 142 L46 130 Q40 100 52 78 Z" fill="#C2452F" stroke="#0C0C0C" strokeWidth="4" strokeLinejoin="round"/>
      <path d="M78 66 Q102 98 96 142 L74 130 Q80 100 68 78 Z" fill="#9A2E20" stroke="#0C0C0C" strokeWidth="4" strokeLinejoin="round"/>
      <circle cx="90" cy="150" r="12" fill="#fff" stroke="#0C0C0C" strokeWidth="4"/>
      <path d="M90 143 l4 4 -2 6 h-4 l-2 -6 Z" fill="#12256B"/>
      <path d="M50 120 48 150 60 150 60 122 Z" fill="#E4A950" stroke="#0C0C0C" strokeWidth="4" strokeLinejoin="round"/>
      <path d="M62 122 64 146 76 148 72 120 Z" fill="#E4A950" stroke="#0C0C0C" strokeWidth="4" strokeLinejoin="round"/>
      <path d="M42 150 h18 v6 h-20 Z" fill="#12256B" stroke="#0C0C0C" strokeWidth="3.5" strokeLinejoin="round"/>
      <path d="M62 146 l14 2 2 6 -16 -2 Z" fill="#12256B" stroke="#0C0C0C" strokeWidth="3.5" strokeLinejoin="round"/>
      <path d="M40 84 H80 L84 124 H36 Z" fill="#12256B" stroke="#0C0C0C" strokeWidth="4.5" strokeLinejoin="round"/>
      <path d="M60 84 H80 L84 124 H60 Z" fill="#F7F4EC"/>
      <path d="M40 84 H80 L84 124 H36 Z" fill="none" stroke="#0C0C0C" strokeWidth="4.5" strokeLinejoin="round"/>
      <path d="M40 92 Q24 98 30 116 L40 112" fill="#E4A950" stroke="#0C0C0C" strokeWidth="4.5" strokeLinejoin="round"/>
      <circle cx="30" cy="116" r="7" fill="#E4A950" stroke="#0C0C0C" strokeWidth="4"/>
      <path d="M80 90 Q98 78 96 58 L86 62 Q86 80 74 92 Z" fill="#E4A950" stroke="#0C0C0C" strokeWidth="4.5" strokeLinejoin="round"/>
      <circle cx="93" cy="56" r="8" fill="#E4A950" stroke="#0C0C0C" strokeWidth="4"/>
      <rect x="90" y="20" width="7" height="40" rx="3" fill="#7A5230" stroke="#0C0C0C" strokeWidth="4"/>
      <rect x="76" y="8" width="36" height="22" rx="6" fill="#C2CAD9" stroke="#0C0C0C" strokeWidth="4.5"/>
      <rect x="76" y="8" width="36" height="7" rx="3" fill="#8B96AE"/>
      <rect x="76" y="8" width="36" height="22" rx="6" fill="none" stroke="#0C0C0C" strokeWidth="4.5"/>
      <path d="M70 14 l-10 -2 6 6 -8 2 12 4" fill="none" stroke="#FFC400" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M60 40
      L82 34 76 52 96 50 84 66 100 76 82 82 90 98 72 92 70 108 60 100
      50 108 48 92 30 98 38 82 20 76 36 66 24 50 44 52 38 34 Z"
      fill="#B4732A" stroke="#0C0C0C" strokeWidth="4.5" strokeLinejoin="round"/>
      <ellipse cx="60" cy="66" rx="23" ry="21" fill="#E4A950" stroke="#0C0C0C" strokeWidth="4.5"/>
      <circle cx="43" cy="54" r="7" fill="#B4732A" stroke="#0C0C0C" strokeWidth="4"/>
      <circle cx="77" cy="54" r="7" fill="#B4732A" stroke="#0C0C0C" strokeWidth="4"/>
      <path d="M40 56 Q60 38 80 56 L76 62 Q60 48 44 62 Z" fill="#C7CEDB" stroke="#0C0C0C" strokeWidth="4.5" strokeLinejoin="round"/>
      <path d="M60 40 L60 56" stroke="#0C0C0C" strokeWidth="4"/>
      <path d="M40 56 Q24 46 12 50 Q24 55 28 62 Q18 61 12 68 Q26 70 40 62 Z" fill="#EDEFF5" stroke="#0C0C0C" strokeWidth="4" strokeLinejoin="round"/>
      <path d="M80 56 Q96 46 108 50 Q96 55 92 62 Q102 61 108 68 Q94 70 80 62 Z" fill="#EDEFF5" stroke="#0C0C0C" strokeWidth="4" strokeLinejoin="round"/>
      <ellipse cx="60" cy="80" rx="13" ry="10" fill="#F2E4C4" stroke="#0C0C0C" strokeWidth="3.2"/>
      <path d="M48 64 L58 68 M72 64 L62 68" stroke="#0C0C0C" strokeWidth="4.5" strokeLinecap="round"/>
      <circle cx="53" cy="72" r="4" fill="#0C0C0C"/><circle cx="67" cy="72" r="4" fill="#0C0C0C"/>
      <path d="M55 77 Q60 74 65 77 Q63 83 60 83 Q57 83 55 77 Z" fill="#3A2410" stroke="#0C0C0C" strokeWidth="2.6" strokeLinejoin="round"/>
      <path d="M60 83 Q53 88 48 84 M60 83 Q67 88 72 84" stroke="#0C0C0C" strokeWidth="3.2" fill="none" strokeLinecap="round"/>
      <path d="M47 79 L34 77 M47 83 L36 87 M73 79 L86 77 M73 83 L84 87" stroke="#0C0C0C" strokeWidth="2.2" strokeLinecap="round"/>
      </g>
    </svg>
  ),
  // 🤙🌱 Marolados FC (batismo do paisagensetrilha): o MOLEQUE de boa da várzea —
  // rastafari (dreadlocks + touca rasta), descalço, com a bola rasgada, fazendo joia.
  // Homenagem à molecada de periferia que joga na várzea. mascote_key = "marolado".
  marolado: (
    <svg width="150" height="192" viewBox="0 0 200 255">
      <ellipse cx="100" cy="246" rx="56" ry="9" fill="rgba(0,0,0,.15)"/>
  
  <g><path d="M150 120 q-21.0 -15.0 -3.0 -33.0 q18.0 -15.0 -3.0 -33.0 q-18.0 -12.0 3.0 -30.0" fill="none" stroke="#EAF0E7" strokeWidth="10.5" strokeLinecap="round" opacity="0.8"/><path d="M52 116 q-19.599999999999998 -14.0 -2.8 -30.799999999999997 q16.799999999999997 -14.0 -2.8 -30.799999999999997 q-16.799999999999997 -11.2 2.8 -28.0" fill="none" stroke="#EAF0E7" strokeWidth="9.799999999999999" strokeLinecap="round" opacity="0.7"/></g>
  
  <path d="M78 196 H122 V214 H78 Z" fill="#ffffff" stroke="#141414" strokeWidth="5" strokeLinejoin="round"/>
  <path d="M100 198 L100 214" stroke="#1B7A3D" strokeWidth="3"/>
  <path d="M82 214 l-2 18 M118 214 l2 18" stroke="#B07A4E" strokeWidth="14" strokeLinecap="round"/>
  
  <path d="M74 228 q-10 3 -8 10 q2 5 13 4 l10 -1 -3 -15 Z" fill="#B07A4E" stroke="#141414" strokeWidth="4" strokeLinejoin="round"/>
  <path d="M126 228 q10 3 8 10 q-2 5 -13 4 l-10 -1 3 -15 Z" fill="#B07A4E" stroke="#141414" strokeWidth="4" strokeLinejoin="round"/>
  <path d="M66 238 h10 M124 238 h10" stroke="#8C5E38" strokeWidth="1.6"/>
  
  <g>
      <path d="M131 230 Q131 215 150 215 Q169 215 169 230 Q169 248.82 150 248.82 Q131 248.82 131 230 Z" fill="#ffffff" stroke="#141414" strokeWidth="4" strokeLinejoin="round"/>
      <path d="M147.15 227.35 l7.6000000000000005 5.32 l-2.85 7.9799999999999995 h-9.5 l-2.85 -7.9799999999999995 Z" fill="#141414"/>
      <path d="M139.55 236.85 l7.6000000000000005 1.9000000000000001 M160.45 236.85 l-7.6000000000000005 1.9000000000000001" stroke="#141414" strokeWidth="2.5" opacity=".5"/>
      
      <path d="M156.65 220.32 l3.42 4.18 l-2.28 1.9000000000000001 l3.04 3.04 l-4.94 0.76 l-1.14 -9.5 Z" fill="#2A2A2A" stroke="#141414" strokeWidth="2.5" strokeLinejoin="round"/>
      
      <rect x="136.32" y="234.38" width="7.9799999999999995" height="6.460000000000001" rx="2" transform="rotate(-12 140.5 237.8)" fill="#C9B89A" stroke="#141414" strokeWidth="2.5"/>
      <path d="M136.7 235.9 l7.6000000000000005 1.14 M137.07999999999998 238.18 l7.22 1.14" stroke="#141414" strokeWidth="1.6" strokeDasharray="2 2"/>
    </g>
  
  <path d="M74 150 Q70 138 86 134 L114 134 Q130 138 126 150 L128 196 72 196 Z" fill="#1B7A3D" stroke="#141414" strokeWidth="6" strokeLinejoin="round"/>
  <path d="M88 138 L88 196 M112 138 L112 196" stroke="#ffffff" strokeWidth="7"/>
  <path d="M80 140 Q100 132 120 140" stroke="#0E5A2B" strokeWidth="4" fill="none"/>
  
  <path d="M78 150 Q54 158 52 186" fill="none" stroke="#B07A4E" strokeWidth="14" strokeLinecap="round"/>
  <circle cx="52" cy="190" r="9" fill="#B07A4E" stroke="#141414" strokeWidth="4"/>
  
  <path d="M122 150 Q150 150 154 128" fill="none" stroke="#B07A4E" strokeWidth="14" strokeLinecap="round"/>
  <circle cx="156" cy="122" r="11" fill="#B07A4E" stroke="#141414" strokeWidth="4"/>
  <path d="M156 111 q7 -9 3 -18 q-8 2 -6 12" fill="#B07A4E" stroke="#141414" strokeWidth="4" strokeLinejoin="round"/>
  
  <rect x="92" y="120" width="16" height="18" fill="#B07A4E" stroke="#141414" strokeWidth="5"/>
  <g transform="translate(100 92) scale(1.0) translate(-100 -92)">
      
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
    </g>
    </svg>
  ),
  // 👶😎 Desportivo Montreal (batismo do nevesgabriel95): a MAITÊ — bebê BRAVA de óculos
  // escuros, homenagem do Gabriel à filha. Aparece no festão do gol. mascote_key = "maite".
  maite: (
    <svg width="150" height="188" viewBox="0 0 200 250">
      <ellipse cx="100" cy="242" rx="54" ry="9" fill="rgba(0,0,0,.15)"/>
  <g fill="none" stroke="#BFC6CC" strokeWidth="5" strokeLinecap="round" opacity=".8">
    <path d="M46 60 q-8 -8 0 -16 q8 -8 0 -16"/><path d="M154 60 q8 -8 0 -16 q-8 -8 0 -16"/>
  </g>
  <path d="M66 196 Q60 168 82 158 L118 158 Q140 168 134 196 Q138 228 100 234 Q62 228 66 196 Z" fill="#1BA34C" stroke="#0C0C0C" strokeWidth="6" strokeLinejoin="round"/>
  <path d="M80 160 Q100 150 120 160 Q116 172 100 172 Q84 172 80 160 Z" fill="#ffffff" stroke="#0C0C0C" strokeWidth="5" strokeLinejoin="round"/>
  <path d="M100 174 L100 220 M84 196 h32" stroke="#0F7A37" strokeWidth="4" strokeLinecap="round"/>
  <path d="M70 172 Q44 176 40 158" fill="none" stroke="#1BA34C" strokeWidth="15" strokeLinecap="round"/>
  <path d="M130 172 Q156 176 160 158" fill="none" stroke="#1BA34C" strokeWidth="15" strokeLinecap="round"/>
  <circle cx="38" cy="150" r="12" fill="#F1C39B" stroke="#0C0C0C" strokeWidth="5"/>
  <circle cx="162" cy="150" r="12" fill="#F1C39B" stroke="#0C0C0C" strokeWidth="5"/>
  <path d="M84 232 l-2 12 M116 232 l2 12" stroke="#F1C39B" strokeWidth="13" strokeLinecap="round"/>
  <ellipse cx="80" cy="246" rx="12" ry="7" fill="#ffffff" stroke="#0C0C0C" strokeWidth="4"/>
  <ellipse cx="120" cy="246" rx="12" ry="7" fill="#ffffff" stroke="#0C0C0C" strokeWidth="4"/>
  <circle cx="100" cy="104" r="60" fill="#F1C39B" stroke="#0C0C0C" strokeWidth="6"/>
  <ellipse cx="42" cy="108" rx="10" ry="13" fill="#F1C39B" stroke="#0C0C0C" strokeWidth="5"/>
  <ellipse cx="158" cy="108" rx="10" ry="13" fill="#F1C39B" stroke="#0C0C0C" strokeWidth="5"/>
  <path d="M92 48 Q100 34 108 48 Q104 44 100 44 Q96 44 92 48 Z" fill="#5A3A22" stroke="#0C0C0C" strokeWidth="4" strokeLinejoin="round"/>
  <path d="M74 60 Q86 48 100 52 Q114 48 126 60 Q112 54 100 56 Q88 54 74 60 Z" fill="#5A3A22" stroke="#0C0C0C" strokeWidth="4" strokeLinejoin="round"/>
  <g transform="translate(132 62) rotate(18)">
    <path d="M0 0 L-20 -12 L-20 12 Z" fill="#E8509A" stroke="#0C0C0C" strokeWidth="4" strokeLinejoin="round"/>
    <path d="M0 0 L20 -12 L20 12 Z" fill="#E8509A" stroke="#0C0C0C" strokeWidth="4" strokeLinejoin="round"/>
    <circle cx="0" cy="0" r="6" fill="#C23B7C" stroke="#0C0C0C" strokeWidth="4"/>
  </g>
  <circle cx="64" cy="122" r="11" fill="#E86A6A" opacity=".8"/>
  <circle cx="136" cy="122" r="11" fill="#E86A6A" opacity=".8"/>
  <path d="M66 82 L92 92" stroke="#0C0C0C" strokeWidth="7" strokeLinecap="round"/>
  <path d="M134 82 L108 92" stroke="#0C0C0C" strokeWidth="7" strokeLinecap="round"/>
  <circle cx="80" cy="104" r="18" fill="#18181C" stroke="#0C0C0C" strokeWidth="5"/>
  <circle cx="120" cy="104" r="18" fill="#18181C" stroke="#0C0C0C" strokeWidth="5"/>
  <path d="M98 103 h4" stroke="#0C0C0C" strokeWidth="6"/>
  <path d="M62 101 L44 104 M138 101 L156 104" stroke="#0C0C0C" strokeWidth="5" strokeLinecap="round"/>
  <path d="M72 97 Q78 92 86 95" stroke="#ffffff" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity=".65"/>
  <path d="M112 97 Q118 92 126 95" stroke="#ffffff" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity=".65"/>
  <path d="M84 132 Q100 126 116 132 Q118 150 100 154 Q82 150 84 132 Z" fill="#7A1B1B" stroke="#0C0C0C" strokeWidth="5" strokeLinejoin="round"/>
  <path d="M88 134 Q100 130 112 134 Q108 138 100 137 Q92 138 88 134 Z" fill="#ffffff"/>
  <ellipse cx="100" cy="148" rx="6" ry="4" fill="#E86A6A"/>
  <path d="M150 96 q6 8 0 14 q-6 -6 0 -14 Z" fill="#7FC6E8" stroke="#0C0C0C" strokeWidth="3" strokeLinejoin="round"/>
    </svg>
  ),
  // 🦍🦂 Scorporila FC (batismo do lucassrribeiroo2023): o GORILA-ESCORPIÃO de corpo
  // inteiro rugindo — cauda de escorpião com ferrão e mãos-pinças. No FESTÃO atravessa
  // a tela. Vetor leve (estilo Nightfull). mascote_key = "scorporila".
  scorporila: (
    <svg width="150" height="188" viewBox="0 0 200 250">
      <ellipse cx="100" cy="243" rx="58" ry="9" fill="rgba(0,0,0,.15)"/>
  <path d="M82 186 Q70 206 74 226 Q76 236 90 234 L100 232 L100 186 Z" fill="#1D1D20" stroke="#141414" strokeWidth="6" strokeLinejoin="round"/>
  <path d="M118 186 Q130 206 126 226 Q124 236 110 234 L100 232 L100 186 Z" fill="#1D1D20" stroke="#141414" strokeWidth="6" strokeLinejoin="round"/>
  <ellipse cx="78" cy="232" rx="19" ry="10" fill="#6C727A" stroke="#141414" strokeWidth="6"/>
  <ellipse cx="122" cy="232" rx="19" ry="10" fill="#6C727A" stroke="#141414" strokeWidth="6"/>
  <path d="M72 122 Q40 132 40 176 Q40 196 60 198 Q68 186 64 170 Q58 148 78 140 Z" fill="#1D1D20" stroke="#141414" strokeWidth="7" strokeLinejoin="round"/>
  <path d="M128 122 Q160 132 160 176 Q160 196 140 198 Q132 186 136 170 Q142 148 122 140 Z" fill="#1D1D20" stroke="#141414" strokeWidth="7" strokeLinejoin="round"/>
  <path d="M66 150 Q60 116 90 106 L110 106 Q140 116 134 150 Q136 190 112 200 L88 200 Q64 190 66 150 Z" fill="#1D1D20" stroke="#141414" strokeWidth="7" strokeLinejoin="round"/>
  <path d="M82 116 Q100 108 118 116 Q120 130 110 140 Q100 132 90 140 Q80 130 82 116 Z" fill="#A2A8AE" stroke="#141414" strokeWidth="3.5" strokeLinejoin="round" opacity=".9"/>
  <path d="M100 118 L100 176" stroke="#141414" strokeWidth="3.5" opacity=".5" strokeLinecap="round"/>
  <path d="M80 136 Q90 148 99 144 M120 136 Q110 148 101 144" stroke="#141414" strokeWidth="3" fill="none" opacity=".45" strokeLinecap="round"/>
  <g transform="translate(58 198) rotate(10) scale(0.56 0.56)"><path d="M6 2 Q-16 8 -28 0" fill="none" stroke="#FFC400" strokeWidth="12" strokeLinecap="round"/><circle cx="4" cy="2" r="5.5" fill="#E8A200" stroke="#141414" strokeWidth="3.5"/><ellipse cx="-38" cy="-3" rx="17" ry="13" fill="#FFC400" stroke="#141414" strokeWidth="5"/><path d="M-46 -12 C-70 -28 -92 -28 -104 -16 C-88 -14 -73 -10 -52 -3 Z" fill="#FFC400" stroke="#141414" strokeWidth="5" strokeLinejoin="round"/><path d="M-46 8 C-68 22 -90 22 -100 10 C-85 6 -71 4 -50 1 Z" fill="#E8A200" stroke="#141414" strokeWidth="5" strokeLinejoin="round"/></g>
  <g transform="translate(142 198) rotate(-10) scale(-0.56 0.56)"><path d="M6 2 Q-16 8 -28 0" fill="none" stroke="#FFC400" strokeWidth="12" strokeLinecap="round"/><circle cx="4" cy="2" r="5.5" fill="#E8A200" stroke="#141414" strokeWidth="3.5"/><ellipse cx="-38" cy="-3" rx="17" ry="13" fill="#FFC400" stroke="#141414" strokeWidth="5"/><path d="M-46 -12 C-70 -28 -92 -28 -104 -16 C-88 -14 -73 -10 -52 -3 Z" fill="#FFC400" stroke="#141414" strokeWidth="5" strokeLinejoin="round"/><path d="M-46 8 C-68 22 -90 22 -100 10 C-85 6 -71 4 -50 1 Z" fill="#E8A200" stroke="#141414" strokeWidth="5" strokeLinejoin="round"/></g>
  <g transform="translate(100 64) scale(0.9) translate(-100 -120)"><path d="M52 150 C43 120 47 90 62 76 C70 56 84 48 100 48 C116 48 130 56 138 76 C153 90 157 120 148 150 C141 178 121 192 100 192 C79 192 59 178 52 150 Z" fill="none" stroke="#FFC400" strokeWidth="13" strokeLinejoin="round"/><circle cx="49" cy="108" r="13" fill="#1D1D20" stroke="#141414" strokeWidth="6"/><circle cx="151" cy="108" r="13" fill="#1D1D20" stroke="#141414" strokeWidth="6"/><path d="M52 150 C43 120 47 90 62 76 C70 56 84 48 100 48 C116 48 130 56 138 76 C153 90 157 120 148 150 C141 178 121 192 100 192 C79 192 59 178 52 150 Z" fill="#1D1D20" stroke="#141414" strokeWidth="6" strokeLinejoin="round"/><path d="M66 92 C64 78 80 70 100 70 C120 70 136 78 134 92 C138 112 132 138 116 158 C108 170 100 176 100 176 C100 176 92 170 84 158 C68 138 62 112 66 92 Z" fill="#A2A8AE" stroke="#141414" strokeWidth="4.5" strokeLinejoin="round"/><path d="M84 60 Q100 52 116 60" stroke="#141414" strokeWidth="3" fill="none" opacity=".5"/><path d="M72 78 Q80 70 90 74 M128 78 Q120 70 110 74" stroke="#6C727A" strokeWidth="2.5" fill="none" opacity=".6"/><path d="M66 96 Q84 84 98 96 L100 100 L102 96 Q116 84 134 96 L130 106 Q116 98 102 106 L100 108 L98 106 Q84 98 70 106 Z" fill="#1D1D20" stroke="#141414" strokeWidth="4" strokeLinejoin="round"/><path d="M74 108 Q84 102 95 110 Q86 118 76 114 Z" fill="#FFC400" stroke="#141414" strokeWidth="3" strokeLinejoin="round"/><path d="M126 108 Q116 102 105 110 Q114 118 124 114 Z" fill="#FFC400" stroke="#141414" strokeWidth="3" strokeLinejoin="round"/><circle cx="84" cy="111" r="3.2" fill="#141414"/><circle cx="116" cy="111" r="3.2" fill="#141414"/><path d="M82 120 Q100 112 118 120 Q122 134 100 140 Q78 134 82 120 Z" fill="#6C727A" stroke="#141414" strokeWidth="4" strokeLinejoin="round"/><ellipse cx="91" cy="126" rx="3.4" ry="4.6" fill="#141414"/><ellipse cx="109" cy="126" rx="3.4" ry="4.6" fill="#141414"/><path d="M100 118 L100 128" stroke="#4A4F55" strokeWidth="2.5" strokeLinecap="round"/><path d="M76 146 Q100 137 124 146 Q126 168 100 177 Q74 168 76 146 Z" fill="#5E120E" stroke="#141414" strokeWidth="5" strokeLinejoin="round"/><path d="M78 146 Q100 139 122 146 L121 154 Q100 148 79 154 Z" fill="#ffffff" stroke="#141414" strokeWidth="2"/><path d="M88 148 L88 153 M100 147 L100 153 M112 148 L112 153" stroke="#141414" strokeWidth="1.6"/><path d="M80 152 L84 164 L90 153 Z" fill="#ffffff" stroke="#141414" strokeWidth="2" strokeLinejoin="round"/><path d="M120 152 L116 164 L110 153 Z" fill="#ffffff" stroke="#141414" strokeWidth="2" strokeLinejoin="round"/><path d="M90 176 L93 167 L97 176 Z" fill="#ffffff" stroke="#141414" strokeWidth="2" strokeLinejoin="round"/><path d="M110 176 L107 167 L103 176 Z" fill="#ffffff" stroke="#141414" strokeWidth="2" strokeLinejoin="round"/><path d="M100 175 L100 169" stroke="#ffffff" strokeWidth="3" strokeLinecap="round"/><ellipse cx="100" cy="170" rx="7" ry="4.5" fill="#C2452F" opacity=".9"/></g>
  <g><circle cx="136.0" cy="150.0" r="14.0" fill="#FFC400" stroke="#141414" strokeWidth="5"/><circle cx="131.8" cy="145.1" r="4.2" fill="#ffffff" opacity=".55"/><circle cx="152.4" cy="128.0" r="13.2" fill="#FFC400" stroke="#141414" strokeWidth="5"/><circle cx="148.4" cy="123.4" r="4.0" fill="#ffffff" opacity=".55"/><circle cx="164.6" cy="108.1" r="12.5" fill="#FFC400" stroke="#141414" strokeWidth="5"/><circle cx="160.9" cy="103.8" r="3.8" fill="#ffffff" opacity=".55"/><circle cx="172.7" cy="90.3" r="11.8" fill="#FFC400" stroke="#141414" strokeWidth="5"/><circle cx="169.1" cy="86.2" r="3.5" fill="#ffffff" opacity=".55"/><circle cx="176.5" cy="74.5" r="11.0" fill="#FFC400" stroke="#141414" strokeWidth="5"/><circle cx="173.2" cy="70.7" r="3.3" fill="#ffffff" opacity=".55"/><circle cx="176.2" cy="60.8" r="10.2" fill="#FFC400" stroke="#141414" strokeWidth="5"/><circle cx="173.1" cy="57.2" r="3.1" fill="#ffffff" opacity=".55"/><circle cx="171.6" cy="49.1" r="9.5" fill="#FFC400" stroke="#141414" strokeWidth="5"/><circle cx="168.8" cy="45.8" r="2.9" fill="#ffffff" opacity=".55"/><circle cx="162.9" cy="39.5" r="8.8" fill="#FFC400" stroke="#141414" strokeWidth="5"/><circle cx="160.3" cy="36.5" r="2.6" fill="#ffffff" opacity=".55"/><circle cx="150.0" cy="32.0" r="8.0" fill="#FFC400" stroke="#141414" strokeWidth="5"/><circle cx="147.6" cy="29.2" r="2.4" fill="#ffffff" opacity=".55"/><ellipse cx="150.0" cy="32.0" rx="14.0" ry="16.0" fill="#E8A200" stroke="#141414" strokeWidth="5"/><path d="M148.0 19.0 Q132.0 6.0 122.0 18.0 Q134.0 20.0 145.0 34.0 Z" fill="#E8503A" stroke="#141414" strokeWidth="4.5" strokeLinejoin="round"/></g>
    </svg>
  ),
  // 🐷⚓ porco marinheiro ESTRESSADO (Marinheiros AS — feehcamp11, 1ª assinatura, Palmeiras)
  porco_marinheiro: (
    <svg width={150} height={195} viewBox="0 0 200 300">
      <defs><clipPath id="shirt"><path d="M60 150 Q100 142 140 150 L146 210 54 210 Z"/></clipPath></defs>
            <ellipse cx="100" cy="284" rx="60" ry="10" fill="rgba(0,0,0,.15)"/>
            <rect x="74" y="206" width="20" height="46" rx="7" fill="#3FAF6A" stroke="#0C0C0C" strokeWidth="5"/>
            <rect x="106" y="206" width="20" height="46" rx="7" fill="#3FAF6A" stroke="#0C0C0C" strokeWidth="5"/>
            <path d="M66 246 q-8 10 4 16 l26 0 0 -16 Z" fill="#FFFFFF" stroke="#0C0C0C" strokeWidth="5" strokeLinejoin="round"/>
            <path d="M104 246 l0 16 26 0 q12 -6 4 -16 Z" fill="#FFFFFF" stroke="#0C0C0C" strokeWidth="5" strokeLinejoin="round"/>
            <path d="M64 158 Q40 168 44 200" fill="none" stroke="#3FAF6A" strokeWidth="17" strokeLinecap="round"/>
            <path d="M136 158 Q160 168 156 200" fill="none" stroke="#3FAF6A" strokeWidth="17" strokeLinecap="round"/>
            <circle cx="44" cy="206" r="14" fill="#3FAF6A" stroke="#0C0C0C" strokeWidth="5"/>
            <circle cx="156" cy="206" r="14" fill="#3FAF6A" stroke="#0C0C0C" strokeWidth="5"/>
            <path d="M60 150 Q100 142 140 150 L146 210 54 210 Z" fill="#FFFFFF" stroke="#0C0C0C" strokeWidth="5" strokeLinejoin="round"/>
            <g clipPath="url(#shirt)">
              <rect x="50" y="150" width="100" height="11" fill="#1B7A3D"/>
              <rect x="50" y="172" width="100" height="11" fill="#1B7A3D"/>
              <rect x="50" y="194" width="100" height="11" fill="#1B7A3D"/>
            </g>
            <path d="M60 150 Q100 142 140 150 L146 210 54 210 Z" fill="none" stroke="#0C0C0C" strokeWidth="5" strokeLinejoin="round"/>
            <path d="M84 146 L100 160 116 146 L108 140 92 140 Z" fill="#1B7A3D" stroke="#0C0C0C" strokeWidth="4" strokeLinejoin="round"/>
            <g transform="translate(8 -6) scale(0.92)">
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
    </svg>
  ),
  // 🧔 careca de barba ruiva ESTRESSADO (Murriz FC — msb102010, rubro-negro)
  careca_ruivo: (
    <svg width={150} height={195} viewBox="0 0 200 260">
      <g>
              <ellipse cx="100" cy="248" rx="60" ry="10" fill="rgba(0,0,0,.15)"/>
              <rect x="72" y="196" width="20" height="40" rx="6" fill="#F0C49B" stroke="#0C0C0C" strokeWidth="5"/>
              <rect x="108" y="196" width="20" height="40" rx="6" fill="#F0C49B" stroke="#0C0C0C" strokeWidth="5"/>
              <path d="M64 232 q-6 10 6 14 l24 0 0 -14 Z" fill="#141414" stroke="#0C0C0C" strokeWidth="5" strokeLinejoin="round"/>
              <path d="M106 232 l0 14 24 0 q12 -4 6 -14 Z" fill="#141414" stroke="#0C0C0C" strokeWidth="5" strokeLinejoin="round"/>
              <path d="M66 176 H134 L138 200 108 196 106 202 94 202 92 196 62 200 Z" fill="#141414" stroke="#0C0C0C" strokeWidth="5" strokeLinejoin="round"/>
              <path d="M56 118 Q34 140 40 172 L60 164" fill="#C4122E" stroke="#0C0C0C" strokeWidth="5" strokeLinejoin="round"/>
              <circle cx="42" cy="176" r="13" fill="#F0C49B" stroke="#0C0C0C" strokeWidth="5"/>
              <path d="M144 118 Q166 140 160 172 L140 164" fill="#C4122E" stroke="#0C0C0C" strokeWidth="5" strokeLinejoin="round"/>
              <circle cx="158" cy="176" r="13" fill="#F0C49B" stroke="#0C0C0C" strokeWidth="5"/>
              <defs><clipPath id="tor"><path d="M60 112 Q100 104 140 112 L136 180 64 180 Z"/></clipPath></defs>
              <path d="M60 112 Q100 104 140 112 L136 180 64 180 Z" fill="#C4122E" stroke="#0C0C0C" strokeWidth="5" strokeLinejoin="round"/>
              <g clipPath="url(#tor)">
                <rect x="55" y="124" width="90" height="12" fill="#141414"/>
                <rect x="55" y="148" width="90" height="12" fill="#141414"/>
                <rect x="55" y="172" width="90" height="12" fill="#141414"/>
              </g>
              <path d="M60 112 Q100 104 140 112 L136 180 64 180 Z" fill="none" stroke="#0C0C0C" strokeWidth="5" strokeLinejoin="round"/>
              <g transform="translate(100 66) scale(1.18)">
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
          </g>
            </g>
    </svg>
  ),
  // 🌿👑 samambaia BRABA coroada (Império Samambaia — jorgericardo777, Rio Branco)
  samambaia: (
    <svg width={140} height={203} viewBox="0 0 200 290">
      <defs>
              <clipPath id="pot"><path d="M62 150 H138 L128 208 72 208 Z"/></clipPath>
            </defs>
            <ellipse cx="100" cy="272" rx="58" ry="10" fill="rgba(0,0,0,.15)"/>
            <path d="M100.0 150.0 Q76.6 127.2 45.1 118.3" fill="none" stroke="#0F5528" strokeWidth="4.4" strokeLinecap="round"/><ellipse cx="92.3" cy="137.8" rx="14.4" ry="6.0" transform="rotate(-106.0 92.3 137.8)" fill="#3AAE63" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="88.0" cy="148.3" rx="14.4" ry="6.0" transform="rotate(150.0 88.0 148.3)" fill="#3AAE63" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="84.3" cy="131.9" rx="13.0" ry="5.5" transform="rotate(-106.0 84.3 131.9)" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="80.4" cy="141.4" rx="13.0" ry="5.5" transform="rotate(150.0 80.4 141.4)" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="75.8" cy="126.8" rx="11.6" ry="4.9" transform="rotate(-106.0 75.8 126.8)" fill="#3AAE63" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="72.4" cy="135.3" rx="11.6" ry="4.9" transform="rotate(150.0 72.4 135.3)" fill="#3AAE63" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="66.9" cy="122.4" rx="10.2" ry="4.3" transform="rotate(-106.0 66.9 122.4)" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="63.9" cy="129.9" rx="10.2" ry="4.3" transform="rotate(150.0 63.9 129.9)" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="57.6" cy="118.8" rx="8.8" ry="3.7" transform="rotate(-106.0 57.6 118.8)" fill="#3AAE63" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="55.0" cy="125.2" rx="8.8" ry="3.7" transform="rotate(150.0 55.0 125.2)" fill="#3AAE63" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="47.8" cy="115.9" rx="7.4" ry="3.1" transform="rotate(-106.0 47.8 115.9)" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="45.7" cy="121.3" rx="7.4" ry="3.1" transform="rotate(150.0 45.7 121.3)" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="45.1" cy="118.3" rx="7.7" ry="3.4" transform="rotate(-150.0 45.1 118.3)" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="2.4"/><path d="M100.0 150.0 Q85.0 114.6 56.8 88.4" fill="none" stroke="#0F5528" strokeWidth="4.4" strokeLinecap="round"/><ellipse cx="97.3" cy="134.5" rx="14.4" ry="6.0" transform="rotate(-81.0 97.3 134.5)" fill="#3AAE63" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="89.0" cy="142.3" rx="14.4" ry="6.0" transform="rotate(175.0 89.0 142.3)" fill="#3AAE63" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="91.4" cy="124.2" rx="13.0" ry="5.5" transform="rotate(-81.0 91.4 124.2)" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="83.9" cy="131.2" rx="13.0" ry="5.5" transform="rotate(175.0 83.9 131.2)" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="84.8" cy="114.4" rx="11.6" ry="4.9" transform="rotate(-81.0 84.8 114.4)" fill="#3AAE63" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="78.1" cy="120.6" rx="11.6" ry="4.9" transform="rotate(175.0 78.1 120.6)" fill="#3AAE63" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="77.5" cy="105.1" rx="10.2" ry="4.3" transform="rotate(-81.0 77.5 105.1)" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="71.6" cy="110.5" rx="10.2" ry="4.3" transform="rotate(175.0 71.6 110.5)" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="69.5" cy="96.2" rx="8.8" ry="3.7" transform="rotate(-81.0 69.5 96.2)" fill="#3AAE63" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="64.4" cy="101.0" rx="8.8" ry="3.7" transform="rotate(175.0 64.4 101.0)" fill="#3AAE63" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="60.8" cy="87.9" rx="7.4" ry="3.1" transform="rotate(-81.0 60.8 87.9)" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="56.5" cy="91.9" rx="7.4" ry="3.1" transform="rotate(175.0 56.5 91.9)" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="56.8" cy="88.4" rx="7.7" ry="3.4" transform="rotate(-125.0 56.8 88.4)" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="2.4"/><path d="M100.0 150.0 Q101.0 109.6 86.2 72.0" fill="none" stroke="#0F5528" strokeWidth="4.4" strokeLinecap="round"/><ellipse cx="104.0" cy="134.4" rx="14.4" ry="6.0" transform="rotate(-56.0 104.0 134.4)" fill="#3AAE63" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="93.3" cy="137.9" rx="14.4" ry="6.0" transform="rotate(-160.0 93.3 137.9)" fill="#3AAE63" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="102.9" cy="121.9" rx="13.0" ry="5.5" transform="rotate(-56.0 102.9 121.9)" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="93.2" cy="125.1" rx="13.0" ry="5.5" transform="rotate(-160.0 93.2 125.1)" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="101.0" cy="109.6" rx="11.6" ry="4.9" transform="rotate(-56.0 101.0 109.6)" fill="#3AAE63" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="92.3" cy="112.4" rx="11.6" ry="4.9" transform="rotate(-160.0 92.3 112.4)" fill="#3AAE63" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="98.2" cy="97.4" rx="10.2" ry="4.3" transform="rotate(-56.0 98.2 97.4)" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="90.5" cy="99.9" rx="10.2" ry="4.3" transform="rotate(-160.0 90.5 99.9)" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="94.5" cy="85.3" rx="8.8" ry="3.7" transform="rotate(-56.0 94.5 85.3)" fill="#3AAE63" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="87.9" cy="87.5" rx="8.8" ry="3.7" transform="rotate(-160.0 87.9 87.5)" fill="#3AAE63" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="90.0" cy="73.4" rx="7.4" ry="3.1" transform="rotate(-56.0 90.0 73.4)" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="84.5" cy="75.3" rx="7.4" ry="3.1" transform="rotate(-160.0 84.5 75.3)" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="86.2" cy="72.0" rx="7.7" ry="3.4" transform="rotate(-100.0 86.2 72.0)" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="2.4"/><path d="M100.0 150.0 Q114.8 112.4 113.8 72.0" fill="none" stroke="#0F5528" strokeWidth="4.4" strokeLinecap="round"/><ellipse cx="109.1" cy="136.7" rx="14.4" ry="6.0" transform="rotate(-36.0 109.1 136.7)" fill="#3AAE63" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="97.8" cy="136.3" rx="14.4" ry="6.0" transform="rotate(-140.0 97.8 136.3)" fill="#3AAE63" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="112.4" cy="124.6" rx="13.0" ry="5.5" transform="rotate(-36.0 112.4 124.6)" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="102.1" cy="124.2" rx="13.0" ry="5.5" transform="rotate(-140.0 102.1 124.2)" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="114.8" cy="112.3" rx="11.6" ry="4.9" transform="rotate(-36.0 114.8 112.3)" fill="#3AAE63" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="105.6" cy="112.0" rx="11.6" ry="4.9" transform="rotate(-140.0 105.6 112.0)" fill="#3AAE63" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="116.3" cy="99.9" rx="10.2" ry="4.3" transform="rotate(-36.0 116.3 99.9)" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="108.2" cy="99.6" rx="10.2" ry="4.3" transform="rotate(-140.0 108.2 99.6)" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="117.0" cy="87.4" rx="8.8" ry="3.7" transform="rotate(-36.0 117.0 87.4)" fill="#3AAE63" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="110.0" cy="87.1" rx="8.8" ry="3.7" transform="rotate(-140.0 110.0 87.1)" fill="#3AAE63" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="116.8" cy="74.7" rx="7.4" ry="3.1" transform="rotate(-36.0 116.8 74.7)" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="111.0" cy="74.4" rx="7.4" ry="3.1" transform="rotate(-140.0 111.0 74.4)" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="113.8" cy="72.0" rx="7.7" ry="3.4" transform="rotate(-80.0 113.8 72.0)" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="2.4"/><path d="M100.0 150.0 Q128.1 123.8 143.2 88.4" fill="none" stroke="#0F5528" strokeWidth="4.4" strokeLinecap="round"/><ellipse cx="113.6" cy="142.2" rx="14.4" ry="6.0" transform="rotate(-11.0 113.6 142.2)" fill="#3AAE63" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="103.5" cy="137.1" rx="14.4" ry="6.0" transform="rotate(-115.0 103.5 137.1)" fill="#3AAE63" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="121.3" cy="133.1" rx="13.0" ry="5.5" transform="rotate(-11.0 121.3 133.1)" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="112.2" cy="128.5" rx="13.0" ry="5.5" transform="rotate(-115.0 112.2 128.5)" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="128.3" cy="123.6" rx="11.6" ry="4.9" transform="rotate(-11.0 128.3 123.6)" fill="#3AAE63" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="120.1" cy="119.4" rx="11.6" ry="4.9" transform="rotate(-115.0 120.1 119.4)" fill="#3AAE63" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="134.5" cy="113.5" rx="10.2" ry="4.3" transform="rotate(-11.0 134.5 113.5)" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="127.4" cy="109.8" rx="10.2" ry="4.3" transform="rotate(-115.0 127.4 109.8)" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="140.1" cy="102.9" rx="8.8" ry="3.7" transform="rotate(-11.0 140.1 102.9)" fill="#3AAE63" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="133.9" cy="99.8" rx="8.8" ry="3.7" transform="rotate(-115.0 133.9 99.8)" fill="#3AAE63" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="145.0" cy="91.9" rx="7.4" ry="3.1" transform="rotate(-11.0 145.0 91.9)" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="139.7" cy="89.2" rx="7.4" ry="3.1" transform="rotate(-115.0 139.7 89.2)" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="143.2" cy="88.4" rx="7.7" ry="3.4" transform="rotate(-55.0 143.2 88.4)" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="2.4"/><path d="M100.0 150.0 Q131.4 141.1 154.9 118.3" fill="none" stroke="#0F5528" strokeWidth="4.4" strokeLinecap="round"/><ellipse cx="114.4" cy="149.4" rx="14.4" ry="6.0" transform="rotate(14.0 114.4 149.4)" fill="#3AAE63" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="107.4" cy="140.5" rx="14.4" ry="6.0" transform="rotate(-90.0 107.4 140.5)" fill="#3AAE63" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="123.5" cy="145.4" rx="13.0" ry="5.5" transform="rotate(14.0 123.5 145.4)" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="117.2" cy="137.3" rx="13.0" ry="5.5" transform="rotate(-90.0 117.2 137.3)" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="132.2" cy="140.6" rx="11.6" ry="4.9" transform="rotate(14.0 132.2 140.6)" fill="#3AAE63" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="126.6" cy="133.4" rx="11.6" ry="4.9" transform="rotate(-90.0 126.6 133.4)" fill="#3AAE63" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="140.4" cy="135.1" rx="10.2" ry="4.3" transform="rotate(14.0 140.4 135.1)" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="135.5" cy="128.8" rx="10.2" ry="4.3" transform="rotate(-90.0 135.5 128.8)" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="148.3" cy="128.9" rx="8.8" ry="3.7" transform="rotate(14.0 148.3 128.9)" fill="#3AAE63" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="144.0" cy="123.4" rx="8.8" ry="3.7" transform="rotate(-90.0 144.0 123.4)" fill="#3AAE63" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="155.6" cy="121.9" rx="7.4" ry="3.1" transform="rotate(14.0 155.6 121.9)" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="152.0" cy="117.3" rx="7.4" ry="3.1" transform="rotate(-90.0 152.0 117.3)" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="2.4"/><ellipse cx="154.9" cy="118.3" rx="7.7" ry="3.4" transform="rotate(-30.0 154.9 118.3)" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="2.4"/>
            <rect x="74" y="204" width="20" height="46" rx="8" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="5"/>
            <rect x="106" y="204" width="20" height="46" rx="8" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="5"/>
            <path d="M66 244 q-8 10 4 16 l24 0 0 -16 Z" fill="#136A34" stroke="#0C0C0C" strokeWidth="5" strokeLinejoin="round"/>
            <path d="M106 244 l0 16 24 0 q12 -6 4 -16 Z" fill="#136A34" stroke="#0C0C0C" strokeWidth="5" strokeLinejoin="round"/>
            <path d="M70 206 Q100 198 130 206 L126 214 74 214 Z" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="5" strokeLinejoin="round"/>
            <path d="M74 210 Q46 214 44 184" fill="none" stroke="#1F8A46" strokeWidth="16" strokeLinecap="round"/>
            <path d="M126 210 Q154 214 156 184" fill="none" stroke="#1F8A46" strokeWidth="16" strokeLinecap="round"/>
            <circle cx="44" cy="176" r="14" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="5"/>
            <circle cx="156" cy="176" r="14" fill="#1F8A46" stroke="#0C0C0C" strokeWidth="5"/>
            <path d="M36 176 h16 M36 172 h15" stroke="#136A34" strokeWidth="2.5"/>
            <path d="M148 176 h16 M149 172 h15" stroke="#136A34" strokeWidth="2.5"/>
            <path d="M62 150 H138 L128 208 72 208 Z" fill="#FFFFFF" stroke="#0C0C0C" strokeWidth="6" strokeLinejoin="round"/>
            <g clipPath="url(#pot)"><g transform="rotate(-38 100 180)"><rect x="30" y="120" width="15" height="150" fill="#E5271C"/><rect x="60" y="120" width="15" height="150" fill="#E5271C"/><rect x="90" y="120" width="15" height="150" fill="#E5271C"/><rect x="120" y="120" width="15" height="150" fill="#E5271C"/><rect x="150" y="120" width="15" height="150" fill="#E5271C"/><rect x="180" y="120" width="15" height="150" fill="#E5271C"/></g></g>
            <path d="M62 150 H138 L128 208 72 208 Z" fill="none" stroke="#0C0C0C" strokeWidth="6" strokeLinejoin="round"/>
            <rect x="56" y="140" width="88" height="16" rx="6" fill="#E5271C" stroke="#0C0C0C" strokeWidth="5"/>
            <g transform="translate(100 176) scale(1.02)">
            <path d="M-30 -10 L-8 -2" stroke="#0C0C0C" strokeWidth="7" strokeLinecap="round"/>
            <path d="M30 -10 L8 -2" stroke="#0C0C0C" strokeWidth="7" strokeLinecap="round"/>
            <ellipse cx="-16" cy="6" rx="9" ry="8" fill="#fff" stroke="#0C0C0C" strokeWidth="3"/>
            <ellipse cx="16" cy="6" rx="9" ry="8" fill="#fff" stroke="#0C0C0C" strokeWidth="3"/>
            <circle cx="-13" cy="8" r="4" fill="#0C0C0C"/><circle cx="19" cy="8" r="4" fill="#0C0C0C"/>
            <path d="M-20 26 Q0 20 20 26 Q16 42 0 42 Q-16 42 -20 26 Z" fill="#7a1410" stroke="#0C0C0C" strokeWidth="4" strokeLinejoin="round"/>
            <path d="M-16 27 L-11 33 -6 27 -1 33 4 27 9 33 14 27" fill="#fff" stroke="#0C0C0C" strokeWidth="1.5"/>
          </g>
            <path d="M78.0 140.0 L78.0 124.2 L90.8 134.7 L100.0 118.0 L109.2 134.7 L122.0 124.2 L122.0 140.0 Z" fill="#FFC400" stroke="#0C0C0C" strokeWidth="3.1" strokeLinejoin="round"/><rect x="78.0" y="140.0" width="44.0" height="7.5" rx="2.6" fill="#FFC400" stroke="#0C0C0C" strokeWidth="3.1"/><circle cx="100.0" cy="126.4" r="4.0" fill="#E5271C" stroke="#0C0C0C" strokeWidth="1.6"/><circle cx="78.0" cy="124.2" r="2.6" fill="#FFFFFF" stroke="#0C0C0C" strokeWidth="1.4"/><circle cx="122.0" cy="124.2" r="2.6" fill="#FFFFFF" stroke="#0C0C0C" strokeWidth="1.4"/>
    </svg>
  ),
  // 🐷 o PORCÃO (Xurupitas FC — denilson.stifler10, aprovado 10/08 v5): porco
  // forte verde/branco (Palmeiras), presas pra cima, punhos fechados. No FESTÃO
  // atravessa a tela fuçando o gramado, roncando e chutando barro pra torcida.
  porco: (
    <svg width="160" height="200" viewBox="0 0 150 182">
      <g transform="translate(0,4)">
        <ellipse cx="75" cy="170" rx="52" ry="10" fill="rgba(0,0,0,.15)" />
        <path d="M58 134 l-3 22 M92 134 l3 22" stroke="#2E9E5B" strokeWidth="17" strokeLinecap="round" />
        <path d="M44 152 q-5 9 5 14 l20 -1 -1 -14 Z" fill="#fff" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <path d="M83 151 l-1 14 20 1 q9 -5 5 -14 Z" fill="#fff" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <path d="M42 112 H108 L110 140 88 135 86 140 64 140 62 135 40 140 Z" fill="#fff" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <path d="M34 76 Q14 96 22 122 L44 112" fill="#2E9E5B" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
        <circle cx="24" cy="124" r="14" fill="#2E9E5B" stroke={INK} strokeWidth="5" />
        <path d="M116 76 Q136 96 128 122 L106 112" fill="#2E9E5B" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
        <circle cx="126" cy="124" r="14" fill="#2E9E5B" stroke={INK} strokeWidth="5" />
        <path d="M38 72 Q75 64 112 72 L108 116 42 116 Z" fill="#0B4D2C" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
        <path d="M64 70 86 70 83 82 75 87 67 82 Z" fill="#1E7A45" stroke={INK} strokeWidth="3" />
        <g transform="translate(28,6) scale(0.46)">
          <path d="M56 76 Q42 40 58 36 Q74 42 82 74 Z" fill="#2E9E5B" stroke={INK} strokeWidth="7" strokeLinejoin="round" />
          <path d="M144 76 Q158 40 142 36 Q126 42 118 74 Z" fill="#2E9E5B" stroke={INK} strokeWidth="7" strokeLinejoin="round" />
          <path d="M100 44 Q93 60 100 74 Q107 60 100 44 Z" fill="#2E9E5B" stroke={INK} strokeWidth="6" strokeLinejoin="round" />
          <path d="M56 90 Q56 62 100 60 Q144 62 144 90 L144 122 Q144 156 100 162 Q56 156 56 122 Z" fill="#2E9E5B" stroke={INK} strokeWidth="7" strokeLinejoin="round" />
          <path d="M66 96 L96 108 M134 96 L104 108" stroke={INK} strokeWidth="10" strokeLinecap="round" />
          <path d="M72 110 Q84 105 96 112 Q86 124 74 119 Z" fill="#fff" stroke={INK} strokeWidth="4" />
          <path d="M128 110 Q116 105 104 112 Q114 124 126 119 Z" fill="#fff" stroke={INK} strokeWidth="4" />
          <circle cx="86" cy="114" r="5.5" fill={INK} /><circle cx="114" cy="114" r="5.5" fill={INK} />
          <ellipse cx="100" cy="136" rx="28" ry="19" fill="#1E7A45" stroke={INK} strokeWidth="7" />
          <ellipse cx="90" cy="136" rx="4.5" ry="7" fill={INK} /><ellipse cx="110" cy="136" rx="4.5" ry="7" fill={INK} />
          <path d="M76 150 Q60 142 62 118 Q72 138 86 148 Z" fill="#fff" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
          <path d="M124 150 Q140 142 138 118 Q128 138 114 148 Z" fill="#fff" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
          <path d="M88 154 l0 8 M100 156 l0 8 M112 154 l0 8" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
          <path d="M86 152 Q100 159 114 152" stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  ),
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
  // 🐝👑 a ABELHA COROADA (mascote do Sapekeiros FC — tiosapeka/@tiosapekagg, aprovado
  // 12/08): abelha/vespa coroada de asas abertas agarrando a bola. Arte própria do dono
  // (webp, gerada no estilo do escudo, fundo transparente). mascote_key = "sapek_abelha".
  sapek_abelha: (
    <img src={sapekAbelhaImg} height={176} width={Math.round(176 * 440 / 373)} alt="Abelha — Sapekeiros FC" style={{ flex: 'none', display: 'block', objectFit: 'contain' }} />
  ),
  // 🐍💨 a COBRA DO ARRUDA (mascote do Tricolor do Arruda — souzact12, aprovado
  // 16/08): a MESMA cobra que aparece no escudo, recortada dele (boné virado,
  // cachimbo fumegando, isqueiro na mão). Arte própria do dono; o recorte do
  // escudo de trás foi feito aqui. mascote_key = "cobra_arruda".
  cobra_arruda: (
    <img src={arrudaCobraImg} height={176} width={Math.round(176 * 319 / 440)} alt="Cobra Coral — Tricolor do Arruda FC" style={{ flex: 'none', display: 'block', objectFit: 'contain' }} />
  ),
  // 🃏⚫⚪ o CORINGA (mascote dos Coringas do Diniz — lucas_calefi, aprovado 16/08):
  // o coringa de camisa listrada preto e branco, com a bola no braço e a carta na
  // mão. Arte própria do dono (webp, fora do bundle). mascote_key = "coringa_diniz".
  coringa_diniz: (
    <img src={coringasMascoteImg} height={176} width={Math.round(176 * 248 / 320)} alt="O Coringa — Coringas do Diniz" style={{ flex: 'none', display: 'block', objectFit: 'contain' }} />
  ),
  // 🦅🩵 a ÁGUIA (mascote do Skyy FC — matheusncruz1, aprovado 17/08): a águia de
  // peito branco e asas azul-piscina, garras douradas, olhando de frente. Arte
  // própria do dono (webp, fora do bundle). mascote_key = "skyy_aguia".
  skyy_aguia: (
    <img src={skyyMascoteImg} height={176} width={Math.round(176 * 354 / 440)} alt="A Águia — Skyy FC" style={{ flex: 'none', display: 'block', objectFit: 'contain' }} />
  ),
  // 🧢💙💛 o BIGÃO (mascote dos Crias do Bigão — giovannecastro784, 17/08): o
  // próprio dono de boné, camisa azul e amarela, chutando a bola. Arte própria
  // do dono (webp, fora do bundle). mascote_key = "bigao".
  // 📍⚽ o PONTINHO (mascote do Futpoint FC — gfpicolo13, 19/08): bola de boné
  // dando joinha. Arte própria do dono (webp, fora do bundle).
  // SÓCIO, não batismo: o clube é o dele e não substitui time de CPU nenhum.
  // mascote_key = "futpoint_bola".
  futpoint_bola: (
    <img src={futpointMascoteImg} height={176} width={Math.round(176 * 310 / 440)} alt="O Pontinho — Futpoint FC" style={{ flex: 'none', display: 'block', objectFit: 'contain' }} />
  ),
  bigao: (
    <img src={bigaoMascoteImg} height={176} width={Math.round(176 * 319 / 440)} alt="O Bigão — Crias do Bigão" style={{ flex: 'none', display: 'block', objectFit: 'contain' }} />
  ),
  // 🤡🟡⚫ o PALHAÇO (mascote do Nata de SP — pedrinhocamisa8, aprovado 17/08):
  // arte própria do dono (webp, fora do bundle). mascote_key = "nata_palhaco".
  nata_palhaco: (
    <img src={nataMascoteImg} height={176} width={Math.round(176 * 369 / 440)} alt="O Palhaço — Nata de SP" style={{ flex: 'none', display: 'block', objectFit: 'contain' }} />
  ),
  // 🐶🎮 a NINA (mascote do Eros FC — erosreis/@erosreis, aprovado 12/08): a
  // cachorrinha do dono, de coleira vermelha, sentada na pilha de cartuchos com o
  // controle no peito. Arte própria do dono (webp, exceção aprovada). mascote_key = "eros_nina".
  eros_nina: (
    <img
      src={erosNinaImg}
      height={176}
      width={Math.round(176 * 400 / 474)}
      alt="Nina — Eros FC"
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
  // 🦋 mariposa-da-seda NERVOSA do Bicho da Seda (Davi Santana — davisantana1312):
  // BRANCA com detalhes pretos (coração do Davi é BOTAFOGO, correção 10/08).
  // inteira (asas de cima + de baixo com caudinha) — no festão ela "voa".
  mariposa: (
    <svg width="140" height="168" viewBox="0 0 200 240">
      <g transform="translate(0,10)">
        <path d="M96 104 C70 70 40 56 28 62 C18 88 30 128 58 140 C72 146 86 138 94 128 Z" fill="#F4F4F4" stroke={INK} strokeWidth="6" strokeLinejoin="round" />
        <path d="M104 104 C130 70 160 56 172 62 C182 88 170 128 142 140 C128 146 114 138 106 128 Z" fill="#F4F4F4" stroke={INK} strokeWidth="6" strokeLinejoin="round" />
        <path d="M94 130 C76 142 62 162 64 180 C66 194 76 200 84 192 Q80 206 90 210 C98 200 100 170 98 146 Z" fill="#E2E2E2" stroke={INK} strokeWidth="6" strokeLinejoin="round" />
        <path d="M106 130 C124 142 138 162 136 180 C134 194 124 200 116 192 Q120 206 110 210 C102 200 100 170 102 146 Z" fill="#E2E2E2" stroke={INK} strokeWidth="6" strokeLinejoin="round" />
        <g fill="#141414"><ellipse cx="46" cy="86" rx="4" ry="6" /><ellipse cx="60" cy="112" rx="3.5" ry="5" /><ellipse cx="76" cy="92" rx="3" ry="4.5" /><ellipse cx="154" cy="86" rx="4" ry="6" /><ellipse cx="140" cy="112" rx="3.5" ry="5" /><ellipse cx="124" cy="92" rx="3" ry="4.5" /><ellipse cx="78" cy="168" rx="3" ry="4.5" /><ellipse cx="122" cy="168" rx="3" ry="4.5" /></g>
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

// ⚽🎉 CARIMBO DO GOL (Diego 15/08, depois de aprovar o "7" do Seven City: "já faça
// o de todos os mascotes tb aparecer alguma coisa deles no gol"): quando um clube
// BATIZADO marca, a carinha dele carimba o placar por ~1,7s e some sozinha.
// Regras que valem aqui (as mesmas do martelo/festão):
//   · só de QUEM MARCA — gol do rival não carimba nada;
//   · NÃO adiciona passo nem espera: é overlay por cima do que já está rolando,
//     o relógio não para e ninguém precisa tocar em nada;
//   · time sem batismo = nada muda (o placar fica exatamente como sempre foi).
// Nome do clube → chave em MASCOTES. Quem tem nome antigo no save cai aqui pelo
// `newestTeamName` (quem chama resolve antes de procurar).
// ⚠️ NÃO "limpar" Marinheiros AS / Eros FC / Sapekeiros FC / Futpoint FC por não acharem na
// pirâmide: esses são batismos de RESERVA DE NOME (o clube do próprio jogador, que
// não substitui time de CPU) — o carimbo deles dispara quando o dono marca.
export const CARIMBO_GOL: Record<string, string> = {
  'Neymarzetti': 'moicano',
  'Manfré FC': 'gralha',
  'Alfacehh': 'alface',
  'Império Samambaia': 'samambaia',
  'Bicho da Seda': 'mariposa',
  'Nightfull FC': 'galo',
  'Murriz FC': 'careca_ruivo',
  'Tôka10': 'toka',
  'SC Ferrari': 'piloto_bola',
  'Barcenite FC': 'gatao_bfc',
  'La Bestia Negra': 'raposa',
  'Xurupitas FC': 'porco',
  'Marinheiros AS': 'porco_marinheiro',
  'Scorporila FC': 'scorporila',
  'Deportivo Montreal': 'maite',
  'Marolados FC': 'marolado',
  'Remoçada': 'leao_thor',
  'Eros FC': 'eros_nina',
  'Sapekeiros FC': 'sapek_abelha',
  'Tricolor do Arruda FC': 'cobra_arruda', // 🐍 a cobra do cachimbo carimba o placar (16/08)
  'Seven City': 'sete_seven', // 7️⃣ o Seven City carimba com o SETE (mockup aprovado), não com o leão
  'Coringas do Diniz': 'coringa_diniz', // 🃏 o coringa carimba o placar (16/08)
  'Nata de SP': 'nata_palhaco', // 🤡 o palhaço carimba o placar (pedrinhocamisa8, 17/08)
  'Skyy FC': 'skyy_aguia', // 🦅 a águia carimba o placar (matheusncruz1, 17/08)
  'Crias do Bigão': 'bigao', // 🧢 o Bigão carimba o placar (giovannecastro784, 17/08)
  'Futpoint FC': 'futpoint_bola', // 📍 o Pontinho carimba o placar (gfpicolo13, 19/08) — RESERVA DE NOME (sócio, não batismo)
}

// 7️⃣ carimbo exclusivo do Seven City: o sete dourado com borda preta grossa.
// Fica fora de MASCOTES de propósito — não é mascote de festão, é só o carimbo.
const SETE_SEVEN = (
  <svg width="134" height="168" viewBox="0 0 120 150" aria-hidden="true">
    <path d="M22 18 L104 18 L98 46 L62 140 L28 140 L64 50 L18 50 Z" fill="#C9A227" stroke={INK} strokeWidth="7" strokeLinejoin="round" />
  </svg>
)

// 🏷️ NOME PRÓPRIO da mascote (o dono batiza a mascote, não só o clube).
// Hoje isso ainda NÃO aparece na tela — o card do perfil escreve só "mascote".
// Fica registrado aqui pra virar rótulo quando o Diego aprovar o mockup; quem
// não estiver nesta lista continua caindo no "mascote" genérico de sempre.
export const MASCOTE_NOME: Record<string, string> = {
  cobra_arruda: 'Cobra Coral', // 🐍 Tricolor do Arruda FC (Geovany Souza, 16/08)
  coringa_diniz: 'O Coringa',  // 🃏 Coringas do Diniz (Lucas Calefi, 16/08)
  eros_nina: 'Nina',           // 🐶 Eros FC — a cachorrinha do dono
  maite: 'Maitê',              // 💚 Desportivo Montreal — homenagem à filha do Gabriel
  nata_palhaco: 'O Palhaço',   // 🤡 Nata de SP (pedrinhocamisa8, 17/08)
  skyy_aguia: 'A Águia',       // 🦅 Skyy FC (matheusncruz1, 17/08)
  bigao: 'O Bigão',            // 🧢 Crias do Bigão (giovannecastro784, 17/08)
  futpoint_bola: 'O Pontinho', // 📍 Futpoint FC (gfpicolo13, 19/08)
}

// arte do carimbo de um clube (ou null se ele não é batizado / não tem mascote)
export const carimboDoTime = (time: string): ReactNode | null => {
  const k = CARIMBO_GOL[time]
  if (!k) return null
  if (k === 'sete_seven') return SETE_SEVEN
  return MASCOTES[k] ?? null
}

// ─── 🎬 CADA MASCOTE COMEMORA DO SEU JEITO (Diego, 17/08) ───────────────────
// Palavras dele: *"na comemoração do gol cada mascote tem que ter suas
// individualidades. Se é águia tem que ser algo relacionado a águia. Cada um é
// o que depende do outro, as coisas que faz"*. Antes TODO mundo entrava com o
// mesmo carimbo (`coCarimba`): caía girado e sumia. Agora o movimento combina
// com o bicho — a águia MERGULHA de cima, o palhaço QUICA, a cobra RASTEJA
// pelo lado, o coringa vira no ar feito carta sendo dada.
//
// 📌 DECIDIDO ASSIM depois de uma ida e volta com o Diego, e o histórico fica
// aqui pra ninguém "corrigir" de novo achando que é engano: ele chegou a pedir
// *"no gol tem que ser igual pra todos"*, eu tirei, e em seguida ele mandou
// *"volte o gol como estava, que você tinha feito no anterior"*. Ou seja, vale
// o que está aqui: **gol E título, os dois por mascote**.
//
// 🛡️ Duas regras que não mudam, custe o que custar:
//   1. o tempo é o MESMO (1,7s) e o carimbo continua `pointer-events:none` —
//      regra de ouro do Diego: zoeira nova nunca atrasa o ritmo do jogo;
//   2. mascote sem entrada própria cai no `coCarimba` de sempre — ninguém
//      perde o que já tinha, e batismo novo nasce funcionando mesmo antes de
//      alguém pensar numa animação pra ele.
export const CARIMBO_ANIM: Record<string, string> = {
  skyy_aguia: 'coVoa',        // 🦅 mergulha de cima e sobe planando de volta
  nata_palhaco: 'coQuica',    // 🤡 entra quicando, gingando pros dois lados
  cobra_arruda: 'coRasteja',  // 🐍 entra rastejando pelo lado, ondulando
  coringa_diniz: 'coCarta',   // 🃏 vira no ar como carta sendo dada na mesa
  sapek_abelha: 'coZumbe',    // 🐝 chega vibrando, parando no ar
  eros_nina: 'coPulinho',     // 🐶 pulinho curto e feliz
  futpoint_bola: 'coQuica',   // 📍 é uma BOLA: entra quicando, como bola faz
}
export const carimboAnimDoTime = (time: string): string =>
  CARIMBO_ANIM[CARIMBO_GOL[time] ?? ''] ?? 'coCarimba'

// 🏆 e no FESTÃO de campeão a mesma ideia: o bicho atravessa a tela do jeito
// DELE. Quem VOA plana no alto e não tem sombra no chão (era o mais errado de
// todos: a águia quicando no gramado feito bola). Quem RASTEJA ondula colado no
// chão. O resto continua quicando, igual sempre foi.
export const FESTA_JEITO: Record<string, 'voa' | 'rasteja' | 'quica'> = {
  skyy_aguia: 'voa',
  sapek_abelha: 'voa',
  cobra_arruda: 'rasteja',
}

// as entradas em si. Ficam aqui (do lado de quem sabe qual mascote é qual) e
// são injetadas pelo placar ao vivo junto com os keyframes que já existiam.
export const CARIMBO_KEYFRAMES = `
@keyframes coVoa{0%{opacity:0;transform:translate(70px,-96px) scale(1.5) rotate(16deg)}22%{opacity:1;transform:translate(0,6px) scale(1) rotate(-4deg)}34%{transform:translate(0,-4px) scale(1) rotate(2deg)}46%{transform:translate(0,2px) scale(1) rotate(-2deg)}72%{opacity:1;transform:translate(0,0) scale(1) rotate(0)}100%{opacity:0;transform:translate(-46px,-70px) scale(.86) rotate(-12deg)}}
@keyframes coQuica{0%{opacity:0;transform:translateY(-90px) scale(.8) rotate(-16deg)}20%{opacity:1;transform:translateY(0) scale(1.12,.86) rotate(0)}30%{transform:translateY(-26px) scale(.94,1.08) rotate(7deg)}42%{transform:translateY(0) scale(1.08,.9) rotate(0)}52%{transform:translateY(-12px) scale(1) rotate(-6deg)}64%{transform:translateY(0) scale(1.04,.96) rotate(0)}80%{opacity:1;transform:translateY(0) scale(1) rotate(0)}100%{opacity:0;transform:translateY(-30px) scale(1.1) rotate(0)}}
@keyframes coRasteja{0%{opacity:0;transform:translate(-120px,14px) scale(.9) rotate(-6deg)}18%{opacity:1;transform:translate(-30px,-6px) rotate(5deg)}30%{transform:translate(-4px,8px) rotate(-5deg)}42%{transform:translate(14px,-4px) rotate(4deg)}54%{transform:translate(0,4px) rotate(-2deg)}74%{opacity:1;transform:translate(0,0) rotate(0)}100%{opacity:0;transform:translate(96px,10px) scale(.92) rotate(6deg)}}
@keyframes coCarta{0%{opacity:0;transform:translateY(-40px) rotateY(-540deg) scale(.5)}26%{opacity:1;transform:translateY(0) rotateY(0) scale(1.06)}36%{transform:scale(1) rotate(-6deg)}72%{opacity:1;transform:scale(1) rotate(-6deg)}100%{opacity:0;transform:rotateY(180deg) scale(.8)}}
@keyframes coZumbe{0%{opacity:0;transform:translate(60px,-40px) scale(.7)}18%{opacity:1;transform:translate(0,0) scale(1)}24%{transform:translate(-3px,2px)}30%{transform:translate(3px,-2px)}36%{transform:translate(-2px,-2px)}42%{transform:translate(2px,2px)}48%{transform:translate(-2px,1px)}72%{opacity:1;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(-40px,-34px) scale(.85)}}
@keyframes coPulinho{0%{opacity:0;transform:translateY(26px) scale(.8)}18%{opacity:1;transform:translateY(0) scale(1)}30%{transform:translateY(-16px) rotate(-6deg)}42%{transform:translateY(0) rotate(0)}52%{transform:translateY(-9px) rotate(5deg)}62%{transform:translateY(0) rotate(0)}78%{opacity:1}100%{opacity:0;transform:translateY(-18px) scale(1.08)}}
`

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
  const jeitoFesta = FESTA_JEITO[mascote] ?? 'quica'
  if (!art) return null
  // 🍃 o Império Samambaia chove FOLHA no lugar do confete (pedido do Diego 10/08)
  const folhas = mascote === 'samambaia'
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
        @keyframes fmPlana{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-30px) rotate(3deg)}}
        @keyframes fmOndula{0%,100%{transform:translateY(0) rotate(-9deg) scaleX(1.03)}50%{transform:translateY(-16px) rotate(9deg) scaleX(.97)}}
        @keyframes fmConf{0%{top:-6%}100%{top:104%}}
        @keyframes fmPulsa{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
      `}</style>
      <div style={{ position: 'absolute', left: '50%', top: '40%', width: 900, height: 900, borderRadius: 999, animation: 'fmRaios 14s linear infinite', background: 'repeating-conic-gradient(rgba(255,196,0,.20) 0 14deg, transparent 14deg 30deg)' }} />
      {conf.map((c, i) => folhas ? (
        <span key={i} style={{ position: 'absolute', left: `${c.x}%`, top: '-6%', width: c.w + 7, height: c.w + 3, borderRadius: '0 100% 0 100%', background: ['#3AAE63', '#1F8A46', '#136A34'][i % 3], transform: `rotate(${c.rot}deg)`, animation: `fmConf ${c.dur}s linear ${c.delay}s infinite` }} />
      ) : (
        <span key={i} style={{ position: 'absolute', left: `${c.x}%`, top: '-6%', width: c.w, height: c.w + 4, borderRadius: 2, background: c.cor, transform: `rotate(${c.rot}deg)`, animation: `fmConf ${c.dur}s linear ${c.delay}s infinite` }} />
      ))}
      <p style={{ position: 'relative', textAlign: 'center', marginTop: '13vh', fontFamily: 'Oswald, sans-serif', fontWeight: 900, fontSize: 42, color: '#FFC400', textTransform: 'uppercase', textShadow: `3px 3px 0 ${INK}`, letterSpacing: '.04em', lineHeight: 1, animation: 'fmPulsa 1.1s ease-in-out infinite' }}>🏆 Campeão!</p>
      <p style={{ position: 'relative', textAlign: 'center', marginTop: 6, fontFamily: 'Oswald, sans-serif', fontWeight: 800, fontSize: 17, color: '#fff', textTransform: 'uppercase', textShadow: '2px 2px 0 rgba(0,0,0,.7)' }}>{nome}</p>
      {/* 🥬 a mascote SOLTA: atravessa a tela do JEITO DELA (Diego 17/08 — "se é
          águia tem que ser algo relacionado a águia"). Quem voa vai alto e sem
          sombra no chão; quem rasteja ondula rente; o resto quica como sempre. */}
      <div style={{ position: 'absolute', bottom: jeitoFesta === 'voa' ? '40vh' : '16vh', left: '-24%', animation: `fmCruza ${jeitoFesta === 'voa' ? 5.6 : 6.5}s linear infinite` }}>
        <div style={{ animation: `${jeitoFesta === 'voa' ? 'fmPlana 1.5s' : jeitoFesta === 'rasteja' ? 'fmOndula .8s' : 'fmQuica .62s'} ease-in-out infinite` }}>{art}</div>
        {/* sombra no chão só pra quem PISA no chão — bicho voando não tem */}
        {jeitoFesta !== 'voa' && <div style={{ width: 84, height: 12, borderRadius: 999, background: 'rgba(0,0,0,.3)', margin: '4px auto 0' }} />}
      </div>
      <p style={{ position: 'absolute', bottom: '4vh', left: 0, right: 0, textAlign: 'center', fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.7)' }}>toque pra pular 👆</p>
    </div>
  )
}
