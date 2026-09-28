// ─── 👑 ENTRADA DE GALA DO BATISMO (sala de espera do online) ─────────────────
//
// Ideia pra dar "água na boca" em quem ainda não tem batismo (Diego, 28/09:
// *"algo visual… o jogador sinta a água na boca, o gostinho de querer"*). Mockup
// aprovado no mesmo dia (`scripts/mockup-entrada-gala.mjs`), com UMA mudança dele:
// *"sem pôr por enquanto número de sócio"* — então a tela NÃO mostra nº de sócio
// nem de fundador em lugar nenhum.
//
// O que acontece:
//   1. 🎬 quando o dono de um clube BATIZADO chega na sala de espera, a tela de
//      todo mundo escurece por ~5 s: holofote, escudo grande no telão ("CHEGOU NA
//      SALA"), a torcida grita o nome e a mascote atravessa. Depois volta tudo.
//   2. 🟡 na lista de técnicos, a linha dele fica DOURADA, com o escudo no lugar da
//      bolinha e a mascote pulando do lado.
//   3. 👆 quem toca no escudo de um batismo (e não é o dono) vê "ele entra assim em
//      toda sala" com o botão que abre o Batismo.
//
// Regras da casa respeitadas:
//   · ⏱️ não atrasa nada: é a SALA DE ESPERA (tempo morto), camada fixa com
//     `pointer-events:none`, fora do reducer. Não encosta em lance nem em tempo.
//   · 🙅 quem já estava na sala quando EU cheguei não ganha entrada na minha tela
//     (senão abrir uma sala cheia de batismo virava um desfile de 30 s). Entrada é
//     pra quem CHEGA depois de mim — e pra mim mesmo, se eu sou o batismo.
//   · 👥 dois chegando juntos: fila, um de cada vez.
//   · ♿ "reduzir movimento" no aparelho: só o telão, sem voo nem mascote correndo.
//   · 🧼 zero localStorage: a memória de "já vi a entrada dele" vive só enquanto a
//     página está aberta (regra do armazenamento cheio, 21/09).
import { useEffect, useRef, useState, lazy, Suspense } from 'react'
import type React from 'react'
import { createPortal } from 'react-dom'
import { batismoDe, BATISMOS } from './batismos'
import { mascoteInteiraDoTime, CARIMBO_GOL } from './mascotes'
import { Escudo, nomeLimpo } from './escudos'
import { newestTeamName } from './data'
import { MascoteMini } from './mascote-atravessa'
import { tr } from './lang'

const INK = '#0C0C0C', GOLD = '#FFC400'
const OSWALD: React.CSSProperties = { fontFamily: 'Oswald, sans-serif', fontWeight: 700 }
export const GALA_MS = 5600

/** o nome ATUAL do clube, se quem está na sala é dono de BATISMO; senão `null` */
// 📧 28/09 — A GALA SEGUE O E-MAIL DO BATISMO, NUNCA O NOME DO TIME. Palavras do Diego:
// *"lembrando que é pelo e-mail de batismo a entrada de gala e não pelo nome do time"*.
// (Antes eu olhava o nome digitado: o dono do Jurubeba, jogando como "Meia na Canela de
// Desportos", ficava sem gala — e quem DIGITASSE "Fabulous EC" ganharia a gala dos outros.)
// Quem diz de quem é cada assento é o SERVIDOR: a RPC `esc_mimos_sala` junta
// assento → conta → `esc_socios` e devolve só assento → mascote/escudo do batismo (o e-mail
// nunca sai do servidor). Aqui só traduzimos isso pro clube de batismo daquela conta.
const BATISMO_DA_MASCOTE = new Map<string, string>()
for (const b of BATISMOS) if (b.tipo === 'batismo') { const k = CARIMBO_GOL[b.clube]; if (k && !BATISMO_DA_MASCOTE.has(k)) BATISMO_DA_MASCOTE.set(k, b.clube) }
/** o clube de BATISMO de uma CONTA (pelo que o servidor devolveu da `esc_socios`); `null` = não é dono de batismo */
export function clubeDaConta(mimo: { mascote?: string | null; escudo?: string | null } | null | undefined): string | null {
  if (!mimo) return null
  const pelo = mimo.escudo ? batismoDe(newestTeamName(mimo.escudo)) : null
  if (pelo) return pelo.tipo === 'batismo' ? pelo.clube : null
  return mimo.mascote ? BATISMO_DA_MASCOTE.get(mimo.mascote) ?? null : null
}
/** @deprecated a gala não olha mais o NOME do time (regra do Diego, 28/09) — use `clubeDaConta` */
export function clubeDeGala(managerName: string): string | null {
  const limpo = newestTeamName(nomeLimpo(managerName || ''))
  const b = limpo ? batismoDe(limpo) : null
  return b && b.tipo === 'batismo' ? b.clube : null
}

// o grito da torcida usa o nome curto (sem FC/EC/SC no fim)
const nomeCurto = (clube: string) => clube.replace(/\s+(FC|EC|SC|AS)$/i, '').trim()

// ─── quem ganha entrada, e quando ─────────────────────────────────────────────
// memória da PÁGINA (não do aparelho): sala → quem eu já vi entrar
const vistos = new Map<string, Set<string>>()

export function useEntradaGala(roomId: string | null | undefined, players: { user_id: string; manager_name: string }[], myUid: string | null | undefined,
  /** conta de cada assento → clube de batismo (vem do servidor); `null` = ainda carregando */
  galaDaConta: Map<string, string> | null) {
  const [fila, setFila] = useState<{ uid: string; clube: string; nome: string }[]>([])
  const carregou = useRef<string | null>(null)
  useEffect(() => {
    // ⏳ só decide depois que o servidor respondeu de quem é cada assento — senão o dono
    // era marcado "já visto" sem gala e perdia a entrada
    if (!roomId || !players.length || !galaDaConta) return
    let visto = vistos.get(roomId)
    const primeira = carregou.current !== roomId
    if (!visto) { visto = new Set(); vistos.set(roomId, visto) }
    const novos: { uid: string; clube: string; nome: string }[] = []
    for (const p of players) {
      if (visto.has(p.user_id)) continue
      visto.add(p.user_id)
      const clube = galaDaConta.get(p.user_id)
      if (!clube) continue
      // quem já estava na sala quando eu abri não ganha entrada — só eu mesmo
      if (primeira && p.user_id !== myUid) continue
      novos.push({ uid: p.user_id, clube, nome: nomeLimpo(p.manager_name) || clube })
    }
    carregou.current = roomId
    if (novos.length) setFila(f => [...f, ...novos])
  }, [roomId, players, myUid, galaDaConta])
  const atual = fila[0] ?? null
  useEffect(() => {
    if (!atual) return
    const t = setTimeout(() => setFila(f => f.slice(1)), GALA_MS + 250)
    return () => clearTimeout(t)
  }, [atual])
  return atual
}

// ─── 🎬 o show (tela inteira, 5,6 s) ──────────────────────────────────────────
const CSS = `
.gala-show{position:fixed;inset:0;z-index:99990;pointer-events:none;animation:galaIn ${GALA_MS}ms ease forwards;overflow:hidden}
@keyframes galaIn{0%{opacity:0}6%{opacity:1}88%{opacity:1}100%{opacity:0}}
.gala-escuro{position:absolute;inset:0;background:radial-gradient(ellipse 60% 45% at 50% 40%,rgba(40,30,5,.72),rgba(0,0,0,.96) 70%)}
.gala-feixe{position:absolute;left:50%;top:-40px;width:min(90vw,380px);height:72vh;transform:translateX(-50%);background:linear-gradient(180deg,rgba(255,240,190,.55),rgba(255,240,190,0));clip-path:polygon(44% 0,56% 0,100% 100%,0 100%);opacity:0;animation:galaFeixe ${GALA_MS}ms ease forwards}
@keyframes galaFeixe{0%,6%{opacity:0}14%{opacity:1}85%{opacity:1}100%{opacity:0}}
.gala-telao{position:absolute;left:50%;top:18vh;width:min(92vw,400px);text-align:center;opacity:0;transform:translateX(-50%) scale(.3);animation:galaTelao ${GALA_MS}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes galaTelao{0%,12%{opacity:0;transform:translateX(-50%) scale(.3)}22%{opacity:1;transform:translateX(-50%) scale(1.08)}28%{transform:translateX(-50%) scale(1)}86%{opacity:1}100%{opacity:0}}
.gala-telao .esc{display:inline-flex;filter:drop-shadow(0 0 22px rgba(255,196,0,.8)) drop-shadow(4px 5px 0 #000)}
.gala-chega{font:700 15px Oswald,sans-serif;letter-spacing:3px;color:${GOLD};margin:8px 0 0}
.gala-nome{font:700 clamp(30px,9vw,42px)/1 Oswald,sans-serif;color:#fff;text-transform:uppercase;margin:6px 0 0;text-shadow:3px 3px 0 #000}
.gala-grito{position:absolute;left:0;right:0;top:58vh;text-align:center;font:700 clamp(20px,6.5vw,28px) Oswald,sans-serif;color:${GOLD};text-shadow:2px 2px 0 #000;opacity:0;animation:galaGrito ${GALA_MS}ms ease forwards;padding:0 12px}
@keyframes galaGrito{0%,30%{opacity:0;transform:scale(.6)}36%{opacity:1;transform:scale(1.15)}40%{transform:scale(1)}80%{opacity:1}88%{opacity:0}}
.gala-masc{position:absolute;bottom:6vh;left:-240px;animation:galaMasc ${GALA_MS}ms ease-in-out forwards;filter:drop-shadow(4px 6px 0 rgba(0,0,0,.5))}
@keyframes galaMasc{0%,24%{left:-240px}34%{left:8vw}40%{left:22vw;transform:rotate(-6deg)}46%{transform:rotate(6deg)}52%{transform:rotate(0)}70%{left:22vw}90%{left:110vw}100%{left:110vw}}
@media (prefers-reduced-motion:reduce){.gala-masc,.gala-feixe{display:none}.gala-telao{animation:galaIn ${GALA_MS}ms ease forwards;transform:translateX(-50%)}}
.gala-linha{position:relative;overflow:hidden;background:linear-gradient(120deg,#FFE79A,#FFC400 45%,#E8A200 75%,#FFDD70);border:3px solid ${INK};border-radius:12px;box-shadow:3px 3px 0 ${INK};padding:4px 8px}
.gala-linha:after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.75) 48%,transparent 62%);background-size:250% 100%;animation:galaBrilho 2.6s linear infinite}
@keyframes galaBrilho{from{background-position:120% 0}to{background-position:-120% 0}}
.gala-pula{display:inline-flex;animation:galaPula 1.2s ease-in-out infinite;position:relative;z-index:1}
@keyframes galaPula{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-3px) rotate(4deg)}}
@media (prefers-reduced-motion:reduce){.gala-linha:after,.gala-pula{animation:none}}
`
export function GalaEstilo() { return <style>{CSS}</style> }

export function EntradaGalaShow({ clube, chave, nome }: { clube: string; chave: string; /** o nome com que o dono está jogando (pode ser o nome novo do clube) */ nome?: string }) {
  const mostra = nome || clube
  const art = mascoteInteiraDoTime(clube)
  return createPortal(
    <div key={chave} className="gala-show" aria-hidden>
      <GalaEstilo />
      <div className="gala-escuro" /><div className="gala-feixe" />
      <div className="gala-telao">
        <span className="esc"><Escudo nome={clube} size={170} /></span>
        <p className="gala-chega">{tr('👑 CHEGOU NA SALA', '👑 JUST ARRIVED')}</p>
        <p className="gala-nome">{mostra}</p>
      </div>
      <p className="gala-grito">🔊 {tr('Ô Ô Ô', 'OH OH OH')}, {nomeCurto(mostra).toUpperCase()}! 🔊</p>
      {art && <div className="gala-masc"><MascoteMini art={art} alt={210} /></div>}
    </div>,
    document.body,
  )
}

// ─── 🟡 a linha dourada na lista + o toque no escudo ──────────────────────────
// o Batismo mora na tela do leilão (`screens.tsx`), que importa o lobby — então
// aqui ele entra "depois", pra não dar volta de import (o arquivo já está carregado).
const ApoieBatismo = lazy(() => import('./screens').then(m => ({
  default: ({ label }: { label: string }) => (
    <m.ApoieButton startScreen="batismo" trigger={abrir => (
      <button onClick={abrir} style={{ display: 'block', width: '100%', marginTop: 8, background: GOLD, color: INK, border: `3px solid ${INK}`, borderRadius: 10, padding: '8px 10px', ...OSWALD, fontSize: 15, textTransform: 'uppercase', boxShadow: `3px 3px 0 ${INK}`, cursor: 'pointer' }}>{label}</button>
    )} />
  ),
})))

export function GalaEscudoBotao({ clube, souEu }: { clube: string; souEu: boolean }) {
  const [aberto, setAberto] = useState(false)
  useEffect(() => {
    if (!aberto) return
    const t = setTimeout(() => setAberto(false), 9000)
    return () => clearTimeout(t)
  }, [aberto])
  return (
    <>
      <button onClick={() => { if (!souEu) setAberto(a => !a) }} aria-label={clube}
        style={{ position: 'relative', zIndex: 1, background: 'transparent', border: 0, padding: 0, display: 'inline-flex', cursor: souEu ? 'default' : 'pointer', flex: 'none' }}>
        <Escudo nome={clube} size={36} />
      </button>
      {aberto && createPortal(
        <div style={{ position: 'fixed', left: 12, right: 12, bottom: 16, zIndex: 99991, maxWidth: 440, margin: '0 auto', background: INK, color: '#fff', border: `3px solid ${GOLD}`, borderRadius: 14, padding: '10px 12px', boxShadow: '0 8px 24px rgba(0,0,0,.4)' }}>
          <button onClick={() => setAberto(false)} aria-label={tr('fechar', 'close')} style={{ position: 'absolute', top: 6, right: 8, background: 'transparent', color: '#fff', border: 0, fontSize: 16, cursor: 'pointer' }}>✕</button>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, lineHeight: 1.4, paddingRight: 18 }}>
            {tr('O', 'The')} <b style={{ color: GOLD }}>{clube}</b> {tr('tem escudo, mascote e manto próprios — e entra assim em toda sala.', 'has its own crest, mascot and kit — and walks into every room like this.')}
          </p>
          <Suspense fallback={null}><ApoieBatismo label={tr('👑 Quero entrar assim também', '👑 I want to walk in like this too')} /></Suspense>
        </div>,
        document.body,
      )}
    </>
  )
}

/** a mascote pequena pulando na ponta da linha (some se o clube não tem mascote) */
export function GalaMascoteMini({ clube }: { clube: string }) {
  const art = mascoteInteiraDoTime(clube)
  if (!art) return null
  return <span className="gala-pula" style={{ margin: '-6px 0 -8px' }}><MascoteMini art={art} alt={42} /></span>
}
