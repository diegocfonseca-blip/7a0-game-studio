// ─── 🐊 O BICHO ATRAVESSA A TELA — peça compartilhada ───────────────────────
//
// Morava dentro de `screens.tsx` (a tela do leilão). Saiu de lá em 25/09 porque o
// Diego pediu o "solta o mascote" TAMBÉM na sala de espera do online (lobby.tsx), e
// o lobby não pode importar a tela do leilão (é ela que importa o lobby). Nada mudou
// no desenho nem no ritmo: é o mesmo bicho, só que num arquivo que os dois enxergam.
import { Fragment } from 'react'
import type React from 'react'
import { useEsc } from './store'
import { MASCOTES, FESTA_JEITO } from './mascotes'

const GOLD = '#FFC400'
const PURPLE = '#7C3AED'

export const MASC_W = 170, MASC_H = 204
export function MascoteMini({ art, alt }: { art: React.ReactNode; alt: number }) {
  const s = alt / MASC_H
  return (
    <span style={{ display: 'inline-block', width: Math.round(MASC_W * s), height: alt, position: 'relative', flex: 'none', verticalAlign: 'bottom' }}>
      <span style={{ position: 'absolute', left: 0, top: 0, width: MASC_W, height: MASC_H, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', transform: `scale(${s})`, transformOrigin: 'top left' }}>{art}</span>
    </span>
  )
}

// 🐊 SOLTOU O BICHO: a mascote do clube batizado ATRAVESSA A TELA de todo mundo.
//
// Diego (18/09): *"esse solta o mascote das salas online está mt pequeno e sem
// graça"*. E estava mesmo: soltar a mascote punha uma fichinha de 52px na fila de
// reações — menos teatro do que a cantada 💸, que já derrubava chuva de dinheiro na
// tela inteira. A mascote é a coisa MAIS pessoal do jogo (só quem tem clube
// batizado tem uma); era a que menos aparecia.
//
// Ele aprovou o desenho e escolheu o jeito: *"atravessa a tela"* — entra por um
// lado, cruza e sai, ~2,2 s. Uma passada só.
//
// 🎽 CADA BICHO DO JEITO DELE: reusa o `FESTA_JEITO` da festa de campeão (🦅 quem
// voa plana alto e sem sombra no chão · 🐍 quem rasteja ondula rente · o resto
// quica). Arte e movimento são os MESMOS da festa — o bundle não cresce um byte.
//
// ⏱️ NÃO ATRASA O JOGO (regra de ouro do Diego): camada fixa, `pointer-events:none`,
// fora do reducer — a MESMA receita da chuva de dinheiro logo abaixo. Não encosta em
// lance, tempo nem resultado; quem está lacrando continua lacrando por cima.
//
// 👥 DOIS AO MESMO TEMPO cruzam juntos, em alturas diferentes — cada emote é um
// bicho, igual a chuva trata cada rajada.
const MASC_ALTURAS = ['14%', '30%', '46%'] // onde cada bicho cruza (quem voa sobe mais)
// 🔇 E ELA NÃO ATRAVESSA A TELA DE QUEM AINDA VAI DAR LANCE (Diego 18/09):
// *"o soltar o mascote, deixe que apareça aqui nessa tela… não deixe que vaze pra
// tela de quem tá dando lances, ok? Apenas os emojis que já tem"*.
// Faz todo sentido e é a regra de ouro dele de sempre: nada pode atrapalhar quem
// está DECIDINDO. Quem já lacrou está esperando os outros — ali o teatro é bem-vindo,
// é o tempo morto. Quem ainda escolhe o valor não pode ter um bicho de 2 segundos
// passando por cima do que ele está lendo.
// Vale nos DOIS momentos de decisão: o envelope antes de lacrar e o desempate antes
// de mandar o lance. No resto (esperando, revelação, martelo) ela passa igual.
// ⚠️ É trava LOCAL, de TELA: quem soltou continua soltando e todo mundo que já
// lacrou vê. Ninguém perde o emote — ele só não interrompe quem está no meio da
// decisão. Os emojis/cantadas que já existiam continuam exatamente como eram.
// ⏱️ QUANTO TEMPO O BICHO LEVA PRA ATRAVESSAR.
// O padrão (2,2s) é o do ENVELOPE CEGO e NÃO se mexe — ordem do Diego (23/09):
// *"eu só tinha pedido pro modo Tocaia você deixar o mascote passar mais devagar
// do que está, e pedi pra NÃO mexer em nada no modo envelope"*.
// Quem quiser uma travessia mais calma passa `segundos` (é o que o Monte da
// Tocaia faz, com 3,8s).
export function MascoteAtravessa({ segundos = 2.2 }: { segundos?: number }) {
  const { state, emotes } = useEsc()
  // 🐊🐛 O 2º MOTIVO DE O BOTÃO NÃO FAZER NADA (conserto 23/09). Esta linha era
  // `if (state.onlineMode !== 'online') return null` — herdada da chuva de dinheiro,
  // que é reação DOS OUTROS e só faz sentido em sala. Só que o botão do Monte na
  // Tocaia aparece também em PARTIDA RÁPIDA (ele só olha `state.holandes`), e ali
  // o bicho era recusado por esta linha: a pessoa apertava e não acontecia nada.
  // A mascote é a SUA — soltar a sua própria no seu próprio jogo não depende de ter
  // gente na sala. Quem cria emote de mascote é só o botão, então no solo nunca vai
  // aparecer bicho de outra pessoa.
  const eu = state.managers[state.youIdx]
  if (eu) {
    const noEnvelope = (state.phase === 'envelope' || state.phase === 'resq_envelope') && !state.submitted.includes(eu.id)
    const tb = state.tiebreaks[state.tiebreakIdx]
    const noDesempate = state.phase === 'tiebreak' && !!tb && tb.managers.includes(eu.id) && !tb.submitted.includes(eu.id)
    if (noEnvelope || noDesempate) return null
  }
  // 🛟 só entra quem este aparelho SABE desenhar: chave desconhecida (versão velha,
  // clube que ele não conhece) segue pelo caminho antigo, com o 🎭 no balão.
  const soltos = emotes.filter(e => e.kind.startsWith('masc:') && MASCOTES[e.kind.slice(5)])
  if (soltos.length === 0) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99981, pointerEvents: 'none', overflow: 'hidden' }}>
      <style>{`
        @keyframes escMascCruza{0%{left:-34%;opacity:0}7%{opacity:1}93%{opacity:1}100%{left:110%;opacity:0}}
        @keyframes escMascQuica{0%,100%{transform:translateY(0) rotate(-7deg) scaleY(.96)}50%{transform:translateY(-54px) rotate(7deg) scaleY(1.03)}}
        @keyframes escMascPlana{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-24px) rotate(3deg)}}
        @keyframes escMascOndula{0%,100%{transform:translateY(0) rotate(-9deg) scaleX(1.03)}50%{transform:translateY(-12px) rotate(9deg) scaleX(.97)}}
        @keyframes escMascConf{0%{top:-8%;opacity:1}100%{top:106%;opacity:0}}
      `}</style>
      {soltos.map(e => {
        const key = e.kind.slice(5)
        const jeito = FESTA_JEITO[key] ?? 'quica'
        const voa = jeito === 'voa'
        // semente estável no id: re-render não faz o bicho pular de altura
        const h = moneySeed(e.id)
        const chao = MASC_ALTURAS[h % MASC_ALTURAS.length]
        return (
          <Fragment key={e.id}>
            {Array.from({ length: 12 }, (_, i) => {
              const c = moneySeed(`${e.id}:${i}`)
              const cor = [GOLD, '#E8503A', PURPLE, '#41C07A', '#fff'][c % 5]
              const w = 5 + (c % 3) * 2
              return <span key={i} style={{ position: 'absolute', left: `${3 + (c % 92)}%`, top: '-8%', width: w, height: w + 4, background: cor, transform: `rotate(${c % 360}deg)`, animation: `escMascConf ${1.4 + ((c >> 3) % 80) / 100}s linear ${((c >> 7) % 55) / 100}s forwards` }} />
            })}
            <div style={{ position: 'absolute', bottom: voa ? '46%' : chao, left: '-34%', animation: `escMascCruza ${segundos}s linear forwards` }}>
              <div style={{ animation: `${voa ? 'escMascPlana 1.4s' : jeito === 'rasteja' ? 'escMascOndula .8s' : 'escMascQuica .55s'} ease-in-out infinite` }}>{MASCOTES[key]}</div>
              {/* sombra no chão só pra quem PISA no chão — bicho voando não tem */}
              {!voa && <div style={{ width: 96, height: 13, borderRadius: 999, background: 'rgba(0,0,0,.28)', margin: '2px auto 0' }} />}
            </div>
          </Fragment>
        )
      })}
    </div>
  )
}

export function moneySeed(s: string): number { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h }
