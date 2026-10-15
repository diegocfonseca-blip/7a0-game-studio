// 👑🎬 AS CENAS DA KINGS LEAGUE (15/10, mockup `scripts/mockups/kings-v2.png` aprovado: *"Sim… ok faça"*).
// Tudo em CSS (0 KB de arte): a bola caindo da gaiola, a faixa do 1×1 até o 7×7, o DADO GIGANTE jogado na tela, a carta
// secreta virando e a cobrança 1×1 com contagem (presidente e cartas de pênalti/shootout/inverso).
// Quem decide o que acontece é o motor (`kings-liga.ts`); aqui é só a cena. A cobrança manda a escolha da pessoa pelo
// `onEscolha` (vira `KINGS_DECIDIR` no reducer) e, quando a contagem zera, mostra o resultado que o motor deu.
import { useEffect, useState } from 'react'
import { tr } from './lang'
import type { CartaKingsInfo, CartaKingsTipo, DueloKingsInfo } from './types'

const INK = '#0C0C0C', GOLD = '#FFC400', CREAM = '#FFF6DE', PURPLE = '#7C3AED', RED = '#C2452F', GREEN = '#1B7A3D'
const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 700 } as const

/** a moldura das cenas: tela escura por cima do jogo (o relógio está parado), com a etiqueta da Kings */
function Palco({ children, tag, cor = PURPLE }: { children: React.ReactNode; tag: string; cor?: string }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(8,10,14,.72)' }}>
      <style>{CSS}</style>
      <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <p style={{ ...OSW, fontSize: 11, letterSpacing: '.18em', color: GOLD, margin: '0 0 8px' }}>👑 KINGS LEAGUE · <span style={{ color: cor === INK ? GOLD : '#fff' }}>{tag}</span></p>
        {children}
      </div>
    </div>
  )
}
function Explica({ titulo, texto, cor = PURPLE }: { titulo: string; texto: string; cor?: string }) {
  return (
    <div style={{ background: CREAM, color: INK, border: `4px solid ${INK}`, borderRadius: 20, boxShadow: `5px 5px 0 ${cor}`, padding: '12px 14px', marginTop: 12, animation: 'kcPop .35s cubic-bezier(.2,1.4,.4,1)' }}>
      <p style={{ ...OSW, fontSize: 26, lineHeight: 1.05, margin: 0 }}>{titulo}</p>
      <p style={{ fontSize: 13.5, fontWeight: 700, margin: '6px 0 0', lineHeight: 1.4 }}>{texto}</p>
    </div>
  )
}

// ── ⚽ PONTAPÉ: a gaiola no teto abre e a bola cai no meio do campo, 1×1 + goleiros
export function CenaPontape() {
  return (
    <Palco tag={tr('PONTAPÉ', 'KICK-OFF')}>
      <div className="kc-campo" style={{ height: 210 }}>
        <div className="kc-linhas" />
        <div className="kc-gaiola" />
        <div className="kc-bola-cai">⚽</div>
        <i className="kc-jg" style={{ left: '8%', top: '50%', background: RED, borderColor: GOLD }} />
        <i className="kc-jg" style={{ left: '92%', top: '50%', background: PURPLE, borderColor: GOLD }} />
        <i className="kc-jg kc-corre-e" style={{ top: '50%', background: RED }} />
        <i className="kc-jg kc-corre-d" style={{ top: '50%', background: PURPLE }} />
        <div className="kc-conta"><span>3</span><span>2</span><span>1</span></div>
      </div>
      <Explica titulo={tr('⚽ A BOLA CAI DO ALTO!', '⚽ THE BALL DROPS FROM ABOVE!')}
        texto={tr('Na Kings não tem saída no meio: a bola cai de uma gaiola no teto e começa 1 contra 1 (mais os goleiros). Entra mais um de cada lado por minuto até 7×7.', 'No centre kick-off in the Kings: the ball drops from a cage in the roof and it starts 1 v 1 (plus keepers). One more per side joins every minute up to 7 v 7.')} />
    </Palco>
  )
}

// ── ➕ a faixa do "quantos tem em campo" (só nos primeiros minutos)
export function FaixaEmCampo({ n }: { n: number }) {
  return (
    <div style={{ background: '#fff', border: `3px solid ${INK}`, borderRadius: 14, boxShadow: `3px 3px 0 ${INK}`, padding: '8px 10px', textAlign: 'center' }}>
      <p style={{ ...OSW, fontSize: 18, margin: 0 }}>{tr('EM CAMPO', 'ON THE PITCH')}: {n} × {n}</p>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', margin: '5px 0' }}>
        {Array.from({ length: 7 }, (_, i) => <span key={i} style={{ width: 18, height: 18, borderRadius: 99, border: `3px solid ${INK}`, background: i < n ? GREEN : '#ddd', transition: 'background .3s' }} />)}
      </div>
      <p style={{ fontSize: 11, fontWeight: 700, margin: 0, opacity: .75 }}>{tr('Entra 1 de cada lado por minuto: 1×1 no 0\' → 7×7 no 6\'', 'One more per side every minute: 1 v 1 at 0\' → 7 v 7 at 6\'')}</p>
    </div>
  )
}

// ── 🎲 O DADO GIGANTE: jogado na tela, quica girando e para na face (duas de cada: 👑 · 2×2 · 3×3)
const FACE_FINAL: Record<1 | 2 | 3, string> = { 1: 'rotateX(-18deg) rotateY(-24deg)', 2: 'rotateX(-18deg) rotateY(-114deg)', 3: 'rotateX(-108deg) rotateY(-24deg)' }
export function CenaDado({ face }: { face: 1 | 2 | 3 }) {
  const [parou, setParou] = useState(false)
  useEffect(() => { const t = setTimeout(() => setParou(true), 2300); return () => clearTimeout(t) }, [])
  const titulo = face === 1 ? tr('👑 CARA DO REI!', '👑 KING\'S FACE!') : face === 2 ? '2 × 2!' : '3 × 3!'
  const texto = face === 1
    ? tr('Até o intervalo é 1 CONTRA 1 com goleiro. O dado tem 3 coisas: 👑 cara do rei (1×1), 2×2 e 3×3 — duas faces de cada.', 'Until half-time it is 1 v 1 with keepers. The dice has 3 things: 👑 king\'s face (1 v 1), 2 v 2 and 3 v 3 — two faces each.')
    : tr(`Até o intervalo cada time joga com ${face} na linha + o goleiro. Campo aberto = mais gol! (O dado tem 👑 cara do rei, 2×2 e 3×3.)`, `Until half-time each team plays ${face} outfield + the keeper. Open pitch = more goals! (The dice has 👑 king's face, 2 v 2 and 3 v 3.)`)
  return (
    <Palco tag={tr('MINUTO 18 · O DADO', 'MINUTE 18 · THE DICE')}>
      <div style={{ height: 200, position: 'relative', perspective: 520 }}>
        <div className="kc-dado-voo">
          <div className="kc-cubo" style={{ ['--kc-fim' as string]: FACE_FINAL[face] }}>
            <div className="kc-f kc-rei" style={{ transform: 'translateZ(60px)' }}>👑<small>{tr('CARA DO REI', 'KING\'S FACE')}</small></div>
            <div className="kc-f kc-rei" style={{ transform: 'rotateY(180deg) translateZ(60px)' }}>👑<small>{tr('CARA DO REI', 'KING\'S FACE')}</small></div>
            <div className="kc-f" style={{ transform: 'rotateY(90deg) translateZ(60px)' }}>2×2</div>
            <div className="kc-f" style={{ transform: 'rotateY(-90deg) translateZ(60px)' }}>2×2</div>
            <div className="kc-f" style={{ transform: 'rotateX(90deg) translateZ(60px)' }}>3×3</div>
            <div className="kc-f" style={{ transform: 'rotateX(-90deg) translateZ(60px)' }}>3×3</div>
          </div>
        </div>
        <div className="kc-sombra" />
      </div>
      {parou ? <Explica titulo={titulo} texto={texto} /> : <p style={{ ...OSW, color: '#fff', fontSize: 18, margin: '14px 0 0' }}>{tr('🎲 rolando…', '🎲 rolling…')}</p>}
    </Palco>
  )
}

// ── 🃏 A CARTA SECRETA: sorteada (ninguém escolhe), vira na tela
export function cartaRotulo(c: Exclude<CartaKingsTipo, 'coringa'> | CartaKingsTipo): { ic: string; nome: string } {
  switch (c) {
    case 'penalti': return { ic: '⚽', nome: tr('PÊNALTI', 'PENALTY') }
    case 'shootout': return { ic: '🏃', nome: 'SHOOTOUT' }
    case 'suspensao': return { ic: '🟥', nome: tr('SUSPENSÃO', 'SUSPENSION') }
    case 'gol_dobro': return { ic: '✖️2', nome: tr('GOL EM DOBRO', 'DOUBLE GOAL') }
    case 'estrela': return { ic: '⭐', nome: tr('JOGADOR ESTRELA', 'STAR PLAYER') }
    case 'penalti_inverso': return { ic: '🔄', nome: tr('PÊNALTI INVERSO', 'REVERSE PENALTY') }
    default: return { ic: '🃏', nome: tr('CORINGA', 'JOKER') }
  }
}
function cartaTexto(c: CartaKingsInfo, time: string): string {
  switch (c.vale) {
    case 'penalti': return tr(`Uma cobrança de pênalti a favor do ${time}, agora!`, `A penalty for ${time}, right now!`)
    case 'shootout': return tr(`Um shootout pro ${time}: sai do meio-campo, 5 segundos contra o goleiro!`, `A shootout for ${time}: from halfway, 5 seconds against the keeper!`)
    case 'suspensao': return tr(`Um jogador do rival fica 4 minutos fora. O ${time} joga com um a mais!`, `A rival player sits out 4 minutes. ${time} plays a man up!`)
    case 'gol_dobro': return tr(`Por 4 minutos, todo gol do ${time} vale 2!`, `For 4 minutes, every ${time} goal counts double!`)
    case 'estrela': return c.estrela ? tr(`O 1º gol do ${c.estrela} (${time}) vale 2!`, `${c.estrela}'s first goal (${time}) counts double!`) : tr(`O 1º gol do craque do ${time} vale 2!`, `${time}'s star's first goal counts double!`)
    default: return tr(`O rival bate um pênalti: se fizer, NÃO vale; se errar, o gol é do ${time}!`, `The rival takes a penalty: if they score it does NOT count; if they miss, the goal goes to ${time}!`)
  }
}
export function CenaCarta({ carta, time }: { carta: CartaKingsInfo; time: string }) {
  const r = cartaRotulo(carta.vale)
  const coringa = carta.sorteada === 'coringa'
  return (
    <Palco tag={tr(`VEZ DO ${time.toUpperCase()}`, `${time.toUpperCase()}'S TURN`)}>
      <div style={{ perspective: 700, height: 250 }}>
        <div className="kc-carta">
          <div className="kc-carta-costas"><b>👑</b><span>KINGS<br />LEAGUE</span><small>{tr('CARTA SECRETA', 'SECRET CARD')}</small></div>
          <div className="kc-carta-frente">
            <small style={{ color: GOLD }}>{coringa ? tr('🃏 CORINGA VIROU…', '🃏 JOKER TURNED INTO…') : tr('CARTA SORTEADA', 'CARD DRAWN')}</small>
            <div style={{ ...OSW, fontSize: 52, lineHeight: 1.1 }}>{r.ic}</div>
            <b style={{ ...OSW, fontSize: 24, display: 'block' }}>{r.nome}</b>
          </div>
        </div>
      </div>
      <Explica titulo={`🃏 ${r.nome}`} texto={cartaTexto(carta, time) + ' ' + tr('(A carta é sorteada — ninguém escolhe.)', '(Cards are drawn — nobody picks.)')} />
    </Palco>
  )
}

// ── 🥅 A COBRANÇA 1×1 (presidente, pênalti/shootout/inverso de carta): contagem, um bate e o outro defende.
//    Não tocou até zerar? O jogo bate (ou pula) sozinho. Depois mostra o que o motor deu.
const SETAS = ['↖', '↑', '↗', '↙', '↓', '↘']
export const DUELO_SEGUNDOS = 5
export function CenaDuelo({ duelo, souBatedor, nomeBatedor, nomeGoleiro, onEscolha }: {
  duelo: DueloKingsInfo; souBatedor: boolean; nomeBatedor: string; nomeGoleiro: string; onEscolha: (canto: number) => void
}) {
  const [seg, setSeg] = useState(DUELO_SEGUNDOS)
  const [escolha, setEscolha] = useState<number | null>(null)
  useEffect(() => {
    const t0 = Date.now()
    const iv = setInterval(() => { const s = Math.max(0, DUELO_SEGUNDOS - Math.floor((Date.now() - t0) / 1000)); setSeg(s); if (s <= 0) clearInterval(iv) }, 200)
    return () => clearInterval(iv)
  }, [duelo.key])
  const fim = seg <= 0
  const tag = duelo.tipo === 'presidente' ? tr('🎩 PÊNALTI DO PRESIDENTE', '🎩 PRESIDENT PENALTY')
    : duelo.tipo === 'shootout' ? tr('🃏 SHOOTOUT DA CARTA', '🃏 CARD SHOOTOUT')
    : duelo.tipo === 'penalti_inverso' ? tr('🔄 PÊNALTI INVERSO', '🔄 REVERSE PENALTY') : tr('🃏 PÊNALTI DA CARTA', '🃏 CARD PENALTY')
  const titulo = souBatedor
    ? (duelo.tipo === 'presidente' ? tr('O SEU PRESIDENTE BATE!', 'YOUR PRESIDENT SHOOTS!') : tr('VOCÊ BATE!', 'YOU SHOOT!'))
    : tr(`🧤 ${nomeBatedor.toUpperCase()} BATE — DEFENDA!`, `🧤 ${nomeBatedor.toUpperCase()} SHOOTS — SAVE IT!`)
  const ajuda = duelo.tipo === 'penalti_inverso'
    ? (souBatedor ? tr('Se você fizer, NÃO vale. Se errar, o gol é do rival.', 'If you score it does NOT count. If you miss, the rival gets the goal.') : tr('Defendeu? O gol é SEU!', 'Save it and the goal is YOURS!'))
    : duelo.tipo === 'shootout' ? tr('Sai do meio-campo: 5 segundos cara a cara.', 'From halfway: 5 seconds one on one.') : ''
  const resultado = duelo.tipo === 'penalti_inverso'
    ? (duelo.gol ? tr('⚽ FEZ… MAS NÃO VALE!', '⚽ SCORED… BUT IT DOES NOT COUNT!') : tr(`🧤 ERROU! GOL DO ${nomeGoleiro.toUpperCase()}!`, `🧤 MISSED! ${nomeGoleiro.toUpperCase()} GETS THE GOAL!`))
    : (duelo.gol ? tr('⚽ GOOOOL!', '⚽ GOAAAL!') : tr('🧤 DEFENDEU!', '🧤 SAVED!'))
  const marca = (i: number) => escolha === i || (fim && (souBatedor ? duelo.chute === i : duelo.pulo === i))
  const outro = fim ? (souBatedor ? duelo.pulo : duelo.chute) : null
  return (
    <Palco tag={tag} cor={RED}>
      <div style={{ background: INK, color: '#fff', border: `4px solid ${INK}`, borderRadius: 20, padding: 14, boxShadow: `5px 5px 0 ${RED}` }}>
        <p style={{ ...OSW, fontSize: 24, margin: 0, lineHeight: 1.1 }}>{titulo}</p>
        {!fim && <p style={{ ...OSW, fontSize: 28, margin: '6px 0 0', color: INK, background: GOLD, borderRadius: 12, display: 'inline-block', padding: '0 12px' }}>⏱️ {seg}</p>}
        <div className="kc-gol">
          {SETAS.map((s, i) => (
            <button key={i} disabled={fim || escolha != null} onClick={() => { setEscolha(i); onEscolha(i) }}
              className={`kc-z${marca(i) ? ' on' : ''}${outro === i ? ' outro' : ''}`}>
              {outro === i ? (souBatedor ? '🧤' : '⚽') : s}
            </button>
          ))}
        </div>
        {fim
          ? <p style={{ ...OSW, fontSize: 28, margin: '8px 0 0', color: (duelo.golPara != null) === souBatedor ? GOLD : '#ff8a7a', animation: 'kcPop .35s cubic-bezier(.2,1.4,.4,1)' }}>{resultado}</p>
          : <p style={{ fontSize: 12.5, fontWeight: 700, margin: '6px 0 0', opacity: .9 }}>
              {escolha != null ? tr('✅ Escolhido! Esperando a contagem…', '✅ Picked! Waiting for the countdown…')
                : souBatedor ? tr('Toque no canto. Não tocou até zerar? O jogo bate sozinho.', 'Tap a corner. No tap before zero? The game shoots for you.')
                : tr('Toque pra onde o goleiro pula. Não tocou? O jogo pula sozinho.', 'Tap where the keeper dives. No tap? The game dives for you.')}
              {ajuda ? <><br />{ajuda}</> : null}
            </p>}
      </div>
    </Palco>
  )
}

const CSS = `
@keyframes kcPop{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}
.kc-campo{position:relative;border:4px solid ${INK};border-radius:16px;overflow:hidden;background:repeating-linear-gradient(90deg,#16683a 0 36px,#135d33 36px 72px);box-shadow:5px 5px 0 ${GOLD}}
.kc-linhas{position:absolute;inset:8px;border:2px solid rgba(255,255,255,.75);border-radius:4px;background:linear-gradient(90deg,transparent calc(50% - 1px),rgba(255,255,255,.75) calc(50% - 1px) calc(50% + 1px),transparent calc(50% + 1px))}
.kc-linhas::after{content:'';position:absolute;left:50%;top:50%;width:60px;height:60px;margin:-30px 0 0 -30px;border:2px solid rgba(255,255,255,.75);border-radius:50%}
.kc-gaiola{position:absolute;left:50%;top:-4px;width:60px;height:42px;margin-left:-30px;border:3px solid #cfd3d8;border-top:none;border-radius:0 0 12px 12px;background:repeating-linear-gradient(90deg,transparent 0 7px,#b9bec5 7px 9px);box-shadow:0 0 22px rgba(255,255,220,.7);z-index:2}
.kc-bola-cai{position:absolute;left:50%;top:6px;margin-left:-15px;font-size:30px;line-height:1;z-index:3;filter:drop-shadow(0 0 8px #fff);animation:kcCai 3.6s cubic-bezier(.5,0,.75,0) forwards}
@keyframes kcCai{0%,58%{transform:translateY(0) scale(.7)}74%{transform:translateY(86px) scale(1.15)}82%{transform:translateY(62px) scale(1)}90%{transform:translateY(86px) scale(1.1)}100%{transform:translateY(80px) scale(1)}}
.kc-jg{position:absolute;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;border:3px solid #fff;box-shadow:1px 2px 0 #000;z-index:2}
.kc-corre-e{left:30%;animation:kcCorreE 3.6s ease-in forwards}.kc-corre-d{left:70%;animation:kcCorreD 3.6s ease-in forwards}
@keyframes kcCorreE{0%,62%{left:22%}100%{left:44%}}@keyframes kcCorreD{0%,62%{left:78%}100%{left:56%}}
.kc-conta{position:absolute;right:14px;top:10px;width:44px;height:52px;overflow:hidden;z-index:3}
.kc-conta span{position:absolute;inset:0;${'font:700 46px/52px Oswald,sans-serif'};color:${GOLD};-webkit-text-stroke:2px #000;opacity:0;animation:kcConta 3.6s linear forwards}
.kc-conta span:nth-child(2){animation-delay:.7s}.kc-conta span:nth-child(3){animation-delay:1.4s}
@keyframes kcConta{0%{opacity:1;transform:scale(1.4)}18%{opacity:1;transform:scale(1)}19%,100%{opacity:0}}
.kc-dado-voo{position:absolute;left:50%;top:0;margin-left:-60px;animation:kcVoa 2.3s cubic-bezier(.25,.6,.4,1) forwards}
@keyframes kcVoa{0%{transform:translate(-200px,-260px) scale(.5)}45%{transform:translate(20px,60px) scale(1.05)}62%{transform:translate(10px,10px) scale(1)}78%{transform:translate(0,50px) scale(1)}100%{transform:translate(0,40px) scale(1)}}
.kc-cubo{width:120px;height:120px;position:relative;transform-style:preserve-3d;animation:kcGira 2.3s cubic-bezier(.2,.7,.3,1) forwards}
@keyframes kcGira{0%{transform:rotateX(620deg) rotateY(480deg)}100%{transform:var(--kc-fim)}}
.kc-f{position:absolute;inset:0;background:#fff;border:5px solid ${INK};border-radius:20px;display:flex;flex-direction:column;align-items:center;justify-content:center;${'font:700 44px Oswald,sans-serif'};color:${INK};backface-visibility:hidden}
.kc-f small{${'font:700 11px Oswald,sans-serif'};letter-spacing:.06em}.kc-rei{background:${GOLD};font-size:56px}
.kc-sombra{position:absolute;left:50%;bottom:4px;width:130px;height:18px;margin-left:-65px;border-radius:50%;background:rgba(0,0,0,.55);filter:blur(5px)}
.kc-carta{position:relative;width:200px;height:240px;margin:0 auto;transform-style:preserve-3d;animation:kcVira 1.6s cubic-bezier(.3,1.3,.5,1) .3s both}
@keyframes kcVira{0%{transform:rotateY(0) translateY(40px) scale(.7)}40%{transform:rotateY(0) translateY(0) scale(1.05)}100%{transform:rotateY(180deg) rotate(-3deg)}}
.kc-carta>div{position:absolute;inset:0;border:5px solid ${INK};border-radius:20px;backface-visibility:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:5px 5px 0 ${INK}}
.kc-carta-costas{background:repeating-linear-gradient(45deg,${INK} 0 10px,#1c1c1c 10px 20px);color:${GOLD}}
.kc-carta-costas b{font-size:54px}.kc-carta-costas span{${'font:700 22px/1 Oswald,sans-serif'};text-align:center}.kc-carta-costas small{${'font:700 10px Oswald,sans-serif'};letter-spacing:.16em;margin-top:8px}
.kc-carta-frente{background:linear-gradient(160deg,#C9A8FF,${PURPLE});color:#fff;transform:rotateY(180deg);padding:10px}
.kc-carta-frente small{${'font:700 11px Oswald,sans-serif'};letter-spacing:.14em}
.kc-gol{position:relative;display:grid;grid-template-columns:repeat(3,1fr);gap:7px;padding:10px;margin:10px 0 0;border:5px solid #fff;border-bottom:none;background:repeating-linear-gradient(45deg,rgba(255,255,255,.14) 0 6px,transparent 6px 12px)}
.kc-z{background:rgba(255,255,255,.12);border:2px solid #fff;border-radius:10px;color:#fff;${'font:700 24px Oswald,sans-serif'};padding:12px 0;cursor:pointer}
.kc-z:disabled{cursor:default}.kc-z.on{background:${GOLD};color:${INK};box-shadow:0 0 14px ${GOLD}}.kc-z.outro{background:#fff;color:${INK}}
@media (prefers-reduced-motion:reduce){.kc-bola-cai,.kc-dado-voo,.kc-cubo,.kc-carta,.kc-conta span,.kc-corre-e,.kc-corre-d{animation-duration:.01s!important}}
`
