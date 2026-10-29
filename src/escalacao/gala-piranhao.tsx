// ─── 🐟🏛️ ENTRADA ÚNICA DO PIRANHÃO FC: "A POSSE DO PRESIDENTE" ───────────────────────────────────────────────────
//
// Pedido do Diego (29/10, batismo 🖋 Fundador): *"entrada de gala personalizada. Ele é o presidente do Brasil… mas o time se
// chama Piranhão e torce pro Botafogo"*. A mascote é a arte do dono (O Presidente, de camisa alvinegra e luvas com coroa).
// Combinado com o Diego: tema PRESIDENCIAL, sem desenhar rosto de ninguém além da arte que o dono mandou. Então é uma posse:
// 1) noite em Brasília: as colunas do Palácio acendem, holofotes verde e amarelo cruzam o céu, flashes da imprensa
// 2) o TAPETE VERMELHO desenrola pela rampa e a guarda (bonecos de CSS) faz alas
// 3) o PRESIDENTE sobe a rampa e pousa no centro; SALVA DE TIROS (21 fogos preto, branco e dourado), a tela treme
// 4) a FAIXA PRESIDENCIAL atravessa a tela e o cardume de PIRANHAS salta do rio de baixo, de dente arreganhado
// 5) o Presidente vai pro canto, o escudo acende com a estrela solitária do Botafogo girando atrás
// 6) a frase do escudo dele bate — LÁ EM CASA TODO MUNDO É 13 (pedido do Diego, 29/10) — e a faixa "CHEGOU NA SALA · TOMOU POSSE"
// Mesmo esquema das outras galas únicas: palco 420×760 escalado, camada fixa sem clique, fora do reducer, sem localStorage.
// Som: o MESMO canto do Lulubaba FC (torcida do Botafogo, `sfx/torcida-lulubaba-v1.mp3`), pedido do Diego — o mesmo da carreira dele.
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Escudo } from './escudos'
import { tr } from './lang'
import { playMp3Gala } from './sound'
import presidenteImg from './img/piranhao-mascote.webp' // 407×440, O Presidente ajoelhado comemorando

export const PIRANHAO_MS = 8600
const T = PIRANHAO_MS
const pct = (ms: number) => (ms / T * 100).toFixed(1) + '%'
const VERDE = '#1B9A47', AMARELO = '#FFD60A', BRANCO = '#F4F4F2', GOLD = '#FFC400', TAPETE = '#B3121F'
const sorte = (i: number) => ((i * 7919) % 997) / 997 // espalhado e sempre igual (a gala é igual pra todos)
const MH = 300, MW = Math.round(MH * 407 / 440)
const FOGOS = 21

const CSS = `
.gpz{position:fixed;inset:0;z-index:99990;pointer-events:none;overflow:hidden;animation:gpzVis ${T}ms ease forwards}
@keyframes gpzVis{0%{opacity:0}3%{opacity:1}95%{opacity:1}100%{opacity:0}}
.gpz-ceu{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 30%,#13305a,#08152b 55%,#02060f)}
.gpz-palco{position:absolute;left:50%;top:50%;width:420px;height:760px;overflow:hidden}
.gpz-treme{position:absolute;inset:0;animation:gpzTreme ${T}ms linear forwards}
@keyframes gpzTreme{0%,${pct(3950)}{transform:none}${pct(4000)}{transform:translate(-9px,6px)}${pct(4060)}{transform:translate(8px,-7px)}${pct(4120)}{transform:translate(-6px,-3px)}${pct(4190)}{transform:translate(4px,4px)}${pct(4260)}{transform:none}100%{transform:none}}
/* holofotes verde e amarelo cruzando o céu */
.gpz-holo{position:absolute;bottom:300px;width:60px;height:640px;margin-left:-30px;transform-origin:50% 100%;filter:blur(5px);opacity:0;animation:gpzHoloVis ${T}ms ease forwards}
.gpz-holo i{position:absolute;inset:0;clip-path:polygon(40% 100%,60% 100%,100% 0,0 0);animation:gpzVarre 2600ms ease-in-out infinite alternate}
@keyframes gpzHoloVis{0%,${pct(200)}{opacity:0}${pct(900)}{opacity:.55}100%{opacity:.45}}
@keyframes gpzVarre{0%{transform:rotate(-28deg)}100%{transform:rotate(28deg)}}
/* estrelinhas do céu */
.gpz-astro{position:absolute;width:3px;height:3px;border-radius:50%;background:#fff;opacity:.6;animation:gpzPisca 1700ms ease-in-out infinite}
@keyframes gpzPisca{0%,100%{opacity:.15}50%{opacity:.9}}
/* o PALÁCIO: laje fina em cima, colunas em arco embaixo, espelho d'água */
.gpz-palacio{position:absolute;left:20px;right:20px;top:300px;height:150px;opacity:0;animation:gpzPalacio ${T}ms ease forwards}
@keyframes gpzPalacio{0%,${pct(100)}{opacity:0;transform:translateY(20px)}${pct(1000)}{opacity:1;transform:none}${pct(5000)}{opacity:1}${pct(5600)}{opacity:.3}100%{opacity:.3}}
.gpz-laje{position:absolute;left:0;right:0;top:0;height:14px;background:linear-gradient(180deg,#fff,#cfd6e2);box-shadow:0 0 18px rgba(255,255,255,.6)}
.gpz-vidro{position:absolute;left:30px;right:30px;top:14px;height:88px;background:repeating-linear-gradient(90deg,#f6d77a 0 14px,#d9a83e 14px 16px);opacity:.85;box-shadow:inset 0 0 20px rgba(0,0,0,.35)}
.gpz-coluna{position:absolute;top:14px;width:30px;height:108px;margin-left:-15px;border:5px solid #fff;border-top:none;border-radius:0 0 50% 50% / 0 0 100% 100%;filter:drop-shadow(0 0 6px rgba(255,255,255,.6))}
.gpz-base{position:absolute;left:-20px;right:-20px;top:120px;height:10px;background:#e8ecf3}
.gpz-agua{position:absolute;left:-30px;right:-30px;top:450px;height:120px;background:linear-gradient(180deg,#0e2d52,#05101f);border-top:2px solid rgba(255,255,255,.35)}
/* o TAPETE VERMELHO desenrolando pela rampa (perspectiva) */
.gpz-rampa{position:absolute;left:50%;top:428px;width:300px;height:332px;margin-left:-150px;clip-path:polygon(38% 0,62% 0,100% 100%,0 100%);background:linear-gradient(180deg,#d9dde5,#9aa3b2)}
.gpz-tapete{position:absolute;left:50%;top:428px;width:200px;height:332px;margin-left:-100px;clip-path:polygon(44% 0,56% 0,100% 100%,0 100%);background:linear-gradient(180deg,#e2283a,${TAPETE});transform-origin:50% 100%;animation:gpzTapete ${T}ms cubic-bezier(.3,.9,.4,1) forwards}
@keyframes gpzTapete{0%,${pct(800)}{transform:scaleY(0)}${pct(1900)}{transform:scaleY(1)}100%{transform:scaleY(1)}}
.gpz-tapete::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,${GOLD} 0 4%,transparent 4% 96%,${GOLD} 96%)}
/* a guarda fazendo alas */
.gpz-guarda{position:absolute;width:16px;height:40px;margin-left:-8px;opacity:0;animation:gpzGuarda ${T}ms ease-out forwards}
.gpz-guarda::before{content:"";position:absolute;left:3px;top:0;width:10px;height:10px;border-radius:50%;background:#e9c08f;box-shadow:0 -5px 0 2px #8b0d14}
.gpz-guarda::after{content:"";position:absolute;left:0;top:10px;width:16px;height:30px;border-radius:4px 4px 2px 2px;background:linear-gradient(180deg,#a8111d 0 60%,#f4f4f4 60%);box-shadow:inset 0 3px 0 ${GOLD}}
@keyframes gpzGuarda{0%{opacity:0;transform:translateY(16px) scale(.6)}100%{opacity:1;transform:none}}
/* flashes da imprensa */
.gpz-foto{position:absolute;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;background:radial-gradient(circle,#fff,rgba(255,255,255,0) 70%);opacity:0;animation:gpzFoto 1500ms ease-out infinite}
@keyframes gpzFoto{0%,80%,100%{opacity:0;transform:scale(.4)}84%{opacity:1;transform:scale(1.6)}}
.gpz-fotos{position:absolute;inset:0;opacity:0;animation:gpzFotos ${T}ms ease forwards}
@keyframes gpzFotos{0%,${pct(1200)}{opacity:0}${pct(1600)}{opacity:1}${pct(5200)}{opacity:1}${pct(5800)}{opacity:0}100%{opacity:0}}
/* O PRESIDENTE sobe a rampa e pousa no centro */
.gpz-pres{position:absolute;left:${210 - MW / 2}px;top:${470 - MH}px;width:${MW}px;height:${MH}px;z-index:10;opacity:0;transform-origin:50% 100%;animation:gpzPres ${T}ms cubic-bezier(.25,1.2,.45,1) forwards}
@keyframes gpzPres{0%,${pct(2300)}{opacity:0;transform:translateY(300px) scale(.35)}${pct(2450)}{opacity:1;transform:translateY(280px) scale(.38)}${pct(3500)}{opacity:1;transform:translateY(30px) scale(.85)}${pct(3900)}{transform:translateY(-36px) scale(1.06)}${pct(4000)}{transform:translateY(0) scale(1)}${pct(4120)}{transform:translateY(-8px) scale(1)}${pct(4250)}{transform:none}${pct(5000)}{opacity:1;transform:none}${pct(5600)}{opacity:1;transform:translate(-136px,134px) scale(.5)}100%{opacity:1;transform:translate(-136px,134px) scale(.5)}}
.gpz-pres img{width:100%;height:100%;display:block;filter:drop-shadow(5px 7px 0 rgba(0,0,0,.6)) drop-shadow(0 0 22px rgba(255,214,10,.35))}
/* SALVA DE TIROS: 21 fogos */
.gpz-fogo{position:absolute;width:0;height:0;opacity:0;animation:gpzFogo 1100ms ease-out both}
.gpz-fogo i{position:absolute;left:-3px;top:-3px;width:6px;height:6px;border-radius:50%;background:var(--c);box-shadow:0 0 8px var(--c);transform:rotate(var(--a)) translateX(0)}
@keyframes gpzFogo{0%{opacity:0}5%{opacity:1}80%{opacity:1}100%{opacity:0}}
.gpz-fogo i{animation:gpzFagulha 1100ms cubic-bezier(.1,.8,.3,1) both;animation-delay:inherit}
@keyframes gpzFagulha{0%{transform:rotate(var(--a)) translateX(0) scale(1.4)}100%{transform:rotate(var(--a)) translateX(var(--r)) translateY(20px) scale(.4)}}
.gpz-tiro{position:absolute;left:0;right:0;top:120px;z-index:13;text-align:center;font:700 22px Oswald,sans-serif;letter-spacing:.24em;color:${GOLD};text-shadow:2px 2px 0 #000;opacity:0;animation:gpzTiro ${T}ms ease forwards}
@keyframes gpzTiro{0%,${pct(3950)}{opacity:0;transform:scale(.6)}${pct(4150)}{opacity:1;transform:scale(1.1)}${pct(4350)}{transform:scale(1)}${pct(4900)}{opacity:1}${pct(5150)}{opacity:0}100%{opacity:0}}
/* a FAIXA PRESIDENCIAL atravessando a tela */
.gpz-faixapres{position:absolute;left:-80px;top:470px;width:600px;height:46px;z-index:9;background:linear-gradient(180deg,${VERDE} 0 42%,${AMARELO} 42% 58%,${VERDE} 58%);border-top:3px solid ${GOLD};border-bottom:3px solid ${GOLD};box-shadow:0 6px 0 rgba(0,0,0,.4);transform:rotate(-16deg) translateX(-700px);animation:gpzFaixaPres ${T}ms cubic-bezier(.2,1,.3,1) forwards}
@keyframes gpzFaixaPres{0%,${pct(4200)}{transform:rotate(-16deg) translateX(-700px)}${pct(4700)}{transform:rotate(-16deg) translateX(0)}${pct(5100)}{opacity:1}${pct(5500)}{opacity:0;transform:rotate(-16deg) translateX(0)}100%{opacity:0}}
.gpz-faixapres b{position:absolute;left:0;right:0;top:9px;text-align:center;font:700 19px Oswald,sans-serif;letter-spacing:.3em;color:#0b3d1d}
/* o cardume de PIRANHAS saltando do rio */
.gpz-piranha{position:absolute;bottom:170px;width:62px;height:40px;margin-left:-31px;scale:1.5;z-index:12;opacity:0;animation:gpzSalto 1100ms cubic-bezier(.3,.6,.5,1) both}
@keyframes gpzSalto{0%{opacity:0;transform:translate(0,140px) rotate(-60deg)}12%{opacity:1}50%{transform:translate(var(--dx),-230px) rotate(0)}100%{opacity:0;transform:translate(calc(var(--dx) * 2),160px) rotate(70deg)}}
/* o escudo com a estrela solitária girando atrás */
.gpz-esc{position:absolute;left:50%;top:150px;width:230px;height:230px;margin-left:-115px;z-index:6;display:flex;align-items:center;justify-content:center;opacity:0;
  filter:drop-shadow(0 0 26px rgba(255,214,10,.6)) drop-shadow(5px 6px 0 rgba(0,0,0,.55));animation:gpzEsc ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gpzEsc{0%,${pct(5000)}{opacity:0;transform:scale(.2) translateY(-60px)}${pct(5450)}{opacity:1;transform:scale(1.12)}${pct(5700)}{transform:scale(1)}100%{opacity:1;transform:scale(1)}}
.gpz-estrela{position:absolute;left:50%;top:265px;width:380px;height:380px;margin:-190px 0 0 -190px;z-index:5;opacity:0;animation:gpzEstrela ${T}ms linear forwards}
@keyframes gpzEstrela{0%,${pct(5000)}{opacity:0;transform:rotate(0) scale(.5)}${pct(5400)}{opacity:.5;transform:rotate(40deg) scale(1)}100%{opacity:.5;transform:rotate(200deg) scale(1)}}
/* a frase e a faixa */
.gpz-frase{position:absolute;left:0;right:0;top:56px;z-index:13;text-align:center;white-space:nowrap;font:700 26px/1.05 Oswald,sans-serif;color:${BRANCO};text-shadow:3px 3px 0 #000;letter-spacing:.02em}
.gpz-frase span{display:inline-block;opacity:0;animation:gpzPalavra ${T}ms cubic-bezier(.2,1.5,.4,1) forwards}
@keyframes gpzPalavra{0%{opacity:0;transform:translateY(-40px)}6%{opacity:1;transform:translateY(4px)}9%{transform:none}96%{opacity:1}100%{opacity:1}}
.gpz-frase em{font-style:normal;color:#ff2a2a;font-size:42px;vertical-align:-4px;display:inline-block;transform:rotate(-6deg);text-shadow:3px 3px 0 #000,0 0 18px rgba(255,40,40,.6)}
.gpz-faixa{position:absolute;left:24px;right:24px;top:612px;z-index:14;background:#0C0C0C;border:3px solid ${GOLD};border-radius:16px;padding:8px 8px 9px;text-align:center;opacity:0;animation:gpzFaixa ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gpzFaixa{0%,${pct(6100)}{opacity:0;transform:scale(.4)}${pct(6450)}{opacity:1;transform:scale(1.06)}${pct(6650)}{transform:scale(1)}${pct(8200)}{opacity:1}100%{opacity:0}}
.gpz-faixa small{display:block;font:700 13px Oswald,sans-serif;letter-spacing:.22em;color:${GOLD}}
.gpz-faixa b{display:block;font:700 27px/1.05 Oswald,sans-serif;color:#fff;text-transform:uppercase;margin-top:2px}
.gpz-faixa em{display:inline-block;font-style:normal;font:700 13px Oswald,sans-serif;color:#0b3d1d;background:linear-gradient(90deg,${VERDE},${AMARELO},${VERDE});border-radius:7px;padding:2px 9px;margin-top:5px;letter-spacing:.1em}
.gpz-branco{position:absolute;inset:0;z-index:20;background:#fff;opacity:0;animation:gpzBranco ${T}ms linear forwards}
@keyframes gpzBranco{0%,${pct(3960)}{opacity:0}${pct(4000)}{opacity:.6}${pct(4250)}{opacity:0}100%{opacity:0}}
@media (prefers-reduced-motion:reduce){.gpz-holo,.gpz-astro,.gpz-fotos,.gpz-fogo,.gpz-tiro,.gpz-faixapres,.gpz-piranha,.gpz-estrela,.gpz-branco{display:none}.gpz-treme,.gpz-tapete{animation:none}.gpz-esc,.gpz-pres,.gpz-palacio,.gpz-faixa,.gpz-frase span{animation:none;opacity:1}}
`

function useEscala() {
  const calc = () => Math.min(window.innerWidth / 420, window.innerHeight / 760)
  const [s, setS] = useState(calc)
  useEffect(() => { const f = () => setS(calc()); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, [])
  return s
}

const Estrela = () => (
  <svg viewBox="-50 -50 100 100" width="100%" height="100%"><path d="M0-48 L11.3-15.5 L45.6-14.8 L18.3 5.9 L28.2 38.8 L0 19.2 L-28.2 38.8 L-18.3 5.9 L-45.6-14.8 L-11.3-15.5Z" fill="rgba(255,255,255,.9)" stroke="#000" strokeWidth="3" strokeLinejoin="round" /></svg>
)
// a piranha: corpo prata, barriga vermelha, dentes à mostra (desenho pequeno, 0 KB de arte)
const Piranha = () => (
  <svg viewBox="0 0 62 40" width="62" height="40">
    <path d="M4 20 L0 6 L12 14Z M4 20 L0 34 L12 26Z" fill="#6f7a86" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
    <path d="M10 20 C14 4 40 0 54 12 C60 17 60 23 54 28 C40 40 14 36 10 20Z" fill="#9aa6b2" stroke="#000" strokeWidth="2.5" />
    <path d="M18 26 C28 36 44 34 52 27 C44 30 30 30 18 26Z" fill="#d23a2c" />
    <path d="M44 22 L58 21 L57 26 L44 27Z" fill="#fff" stroke="#000" strokeWidth="1.5" />
    <path d="M46 22 L48 25 L50 22 L52 25 L54 22 L56 25" fill="none" stroke="#000" strokeWidth="1.2" />
    <circle cx="46" cy="14" r="3.4" fill="#fff" stroke="#000" strokeWidth="1.5" /><circle cx="47" cy="14" r="1.5" fill="#000" />
    <path d="M40 9 L46 10" stroke="#000" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
)

export function GalaPiranhao({ clube, chave, mostra, grito }: { clube: string; chave: string; mostra: string; grito: string }) {
  const s = useEscala()
  void grito
  useEffect(() => playMp3Gala(`${import.meta.env.BASE_URL}sfx/torcida-lulubaba-v1.mp3`, T), [chave])
  // a frase da faixa do escudo do dono (não se traduz: é o lema do clube)
  const frase = ['LÁ EM CASA', 'TODO MUNDO É', '13']
  const coresFogo = [BRANCO, GOLD, '#9aa6b2', AMARELO]
  return createPortal(
    <div key={chave} className="gpz" aria-hidden>
      <style>{CSS}</style>
      <div className="gpz-ceu" />
      <div className="gpz-palco" style={{ transform: `translate(-50%,-50%) scale(${s})` }}>
       <div className="gpz-treme">
        {Array.from({ length: 26 }, (_, i) => (
          <i key={i} className="gpz-astro" style={{ left: 6 + Math.round(sorte(i + 1) * 408), top: 10 + Math.round(sorte(i * 7 + 3) * 270), animationDelay: `${Math.round(sorte(i * 13 + 5) * 1700)}ms` }} />
        ))}
        {[[70, VERDE], [350, AMARELO], [210, '#ffffff']].map(([x, c], i) => (
          <div key={i} className="gpz-holo" style={{ left: x as number }}><i style={{ background: `linear-gradient(0deg,${c}cc,transparent)`, animationDelay: `-${i * 900}ms` }} /></div>
        ))}
        <div className="gpz-agua" />
        <div className="gpz-palacio">
          <div className="gpz-vidro" />
          <div className="gpz-laje" />
          {Array.from({ length: 9 }, (_, i) => <i key={i} className="gpz-coluna" style={{ left: `${6 + i * 11}%` }} />)}
          <div className="gpz-base" />
        </div>
        <div className="gpz-rampa" />
        <div className="gpz-tapete" />
        {Array.from({ length: 8 }, (_, i) => {
          const lado = i % 2 ? 1 : -1, k = Math.floor(i / 2)
          return <i key={i} className="gpz-guarda" style={{ left: 210 + lado * (34 + k * 26), top: 450 + k * 64, transform: `scale(${0.7 + k * 0.15})`, animationDelay: `${1300 + k * 160}ms` }} />
        })}
        <div className="gpz-fotos">
          {Array.from({ length: 14 }, (_, i) => (
            <i key={i} className="gpz-foto" style={{ left: 10 + Math.round(sorte(i * 3 + 2) * 400), top: 470 + Math.round(sorte(i * 5 + 1) * 270), animationDelay: `${Math.round(sorte(i * 11 + 7) * 1500)}ms` }} />
          ))}
        </div>
        <div className="gpz-estrela"><Estrela /></div>
        <div className="gpz-esc"><Escudo nome={clube} size={220} /></div>
        {Array.from({ length: FOGOS }, (_, i) => {
          const c = coresFogo[i % coresFogo.length]
          return (
            <div key={i} className="gpz-fogo" style={{ left: 30 + Math.round(sorte(i * 7 + 2) * 360), top: 40 + Math.round(sorte(i * 5 + 9) * 230), animationDelay: `${3980 + i * 55}ms` }}>
              {Array.from({ length: 10 }, (_, k) => <i key={k} style={{ ['--a' as string]: `${k * 36}deg`, ['--r' as string]: `${34 + Math.round(sorte(i + k) * 26)}px`, ['--c' as string]: c, animationDelay: `${3980 + i * 55}ms` }} />)}
            </div>
          )
        })}
        <div className="gpz-tiro">{tr('💥 SALVA DE 21 TIROS 💥', '💥 21-GUN SALUTE 💥')}</div>
        <div className="gpz-faixapres"><b>{tr('PRESIDENTE', 'PRESIDENT')}</b></div>
        <div className="gpz-pres"><img src={presidenteImg} alt="" /></div>
        {Array.from({ length: 14 }, (_, i) => (
          <div key={i} className="gpz-piranha" style={{ left: 30 + Math.round(sorte(i * 9 + 4) * 360), ['--dx' as string]: `${(i % 2 ? 1 : -1) * (30 + Math.round(sorte(i * 3) * 40))}px`, animationDelay: `${4450 + i * 75}ms`, transform: i % 2 ? undefined : 'scaleX(-1)' }}><Piranha /></div>
        ))}
        <div className="gpz-frase">
          {frase.map((p, i) => <span key={i} style={{ animationDelay: `${5500 + i * 300}ms`, marginRight: 6 }}>{i === 2 ? <em>{p}</em> : p}</span>)}
        </div>
        <div className="gpz-faixa">
          <small>{tr('🏛️ CHEGOU NA SALA', '🏛️ JUST ARRIVED')}</small>
          <b>{mostra}</b>
          <em>{tr('TOMOU POSSE', 'SWORN IN')}</em>
        </div>
        <div className="gpz-branco" />
       </div>
      </div>
    </div>,
    document.body,
  )
}
