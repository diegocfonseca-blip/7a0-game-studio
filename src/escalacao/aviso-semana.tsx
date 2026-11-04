// ─── 🏆⚔️ AVISO DE FIM DE SEMANA (26/10) ───────────────────────────────────────────────────────────────────────────────
// Diego: *"o ranking do clã vai acabar junto com os individuais… meia-noite… aparece esse modal diferente na tela dele informando que
// o clã dele venceu na semana, dando parabéns, falando o nome do clã vencedor, e que cada participante ganhará 30 moedas… e fale pela
// zoação também de poder zoar o clã perdedor… quando a pessoa fechar o X não aparece mais… em qualquer lugar da tela. Já dos
// individuais aparece também dando parabéns aos vencedores, moedas ganhas e que estarão no telão"*. Mockup aprovado ("Sim", com 2º e
// 3º também): `scripts/mockups/premio-semana-modal.png`.
// O banco fecha as DUAS semanas juntas (segunda 0h, Brasília) e paga as moedas na carreira, como já fazia. Aqui é só o AVISO:
// `esc_avisos_semana` traz o que a conta ainda não viu da última semana fechada; ✕ ou BORA chamam `esc_aviso_semana_visto` — a marca
// fica NA CONTA, então não volta em nenhum aparelho. Nada aqui dá moeda: quem dá é o resgate da carreira (servidor, 1× por semana).
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'
import { tr } from './lang'
import { loggedEmail } from './apoio'
import { EmblemaCla } from './cla'
import { RANKING_SEMANA_MOEDAS, CLA_SEMANA_MOEDAS } from './store'
import { releConta } from './conta-vez' // 📉 30/10: só relê quando a conta muda (ou foi pagar)

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', ROXO = '#7C3AED', CREME = '#FFF8E6'
const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 700 } as const
export type Aviso = { tipo: 'tecnico' | 'cla'; semana: string; pos: 1 | 2 | 3; nome: string; titulos: number; emblema?: string; rival?: { nome: string; titulos: number } | null }
const MEDALHA = { 1: '🥇', 2: '🥈', 3: '🥉' } as const
const GRAD_OURO = 'linear-gradient(160deg,#FFE79A,#FFC400 45%,#E8A200)'
const GRAD_POS = { 1: GRAD_OURO, 2: 'linear-gradient(160deg,#F4F7FB,#CBD4DE 52%,#9BA7B5)', 3: 'linear-gradient(160deg,#ffe0c2,#F0A35E 50%,#D9822B)' } as const

// 😜 a zoeira do campeão com o 2º colocado — {r} rival · {n} títulos dele · {m} os nossos · {d} a diferença. PT e EN na MESMA posição.
const ZOEIRA: [string, string][] = [
  ['O {r} ficou com {n}… vai precisar de mais {d} títulos e um milagre 🙏', '{r} finished on {n}… they need {d} more titles and a miracle 🙏'],
  ['Alguém avisa o {r} que a semana acabou? Ainda estão procurando o caminho do pódio 🧭', 'Someone tell {r} the week is over? They are still looking for the podium 🧭'],
  ['O {r} lutou bravamente… pelo 2º lugar 🥈😂', '{r} fought bravely… for 2nd place 🥈😂'],
  ['{d} títulos de vantagem. O {r} vai ter que treinar dobrado essa semana 🏋️', '{d} titles ahead. {r} will have to train twice as hard this week 🏋️'],
  ['Manda um abraço pro {r}: prata também brilha… um pouquinho ✨', 'Send {r} a hug: silver shines too… a little ✨'],
  ['O {r} pediu revanche. A gente aceita — e ganha de novo 😎', '{r} asked for a rematch. Accepted — and we win again 😎'],
  ['Placar da semana: nós {m} × {n} {r}. Sem VAR pra salvar 📺', 'Weekly score: us {m} × {n} {r}. No VAR to save them 📺'],
  ['O {r} já pode montar o grupo de oração pra próxima semana 🙏😂', '{r} can start the prayer group for next week 🙏😂'],
]
const SEM_RIVAL: [string, string] = ['Nenhum clã chegou nem perto. Zoeira sem alvo — só respeito 😎', 'No clan came close. Nobody to tease — just respect 😎']
const sorteio = (s: string) => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h }
function fraseZoeira(a: Aviso) {
  if (!a.rival) return tr(SEM_RIVAL[0], SEM_RIVAL[1])
  const [pt, en] = ZOEIRA[sorteio(a.semana + a.nome) % ZOEIRA.length]
  return tr(pt, en).replaceAll('{r}', a.rival.nome).replaceAll('{n}', String(a.rival.titulos)).replaceAll('{m}', String(a.titulos)).replaceAll('{d}', String(Math.max(1, a.titulos - a.rival.titulos)))
}
const zap = (txt: string) => window.open(`https://wa.me/?text=${encodeURIComponent(`${txt}\n${location.origin}`)}`, '_blank', 'noopener')

// (nada de aviso no meio do pregão: espera a pessoa sair do leilão — "nada pode atrasar o ritmo do jogo")
const TELAS_PREGAO = new Set(['auction', 'monte', 'cerimonia', 'convocacao'])
// 🩹 27/10 (Diego: "fecham no X e fica aparecendo toda hora… N some nunca"): o `void supabase.rpc(...)` NUNCA mandava o pedido — o
// supabase-js só envia quando alguém chama `.then` — então a marca não caía na conta e a checagem de 60s trazia o aviso de volta.
// Agora o ✕ espera o banco de verdade e, de reforço, o aparelho lembra o que já foi fechado (nunca mostra de novo, mesmo se a rede falhar).
const CHAVE_VISTO = 'esc-aviso-semana-visto'
const chaveAviso = (a: Pick<Aviso, 'tipo' | 'semana'>) => `${a.tipo}|${a.semana}`
const lerVistos = (): string[] => { try { const v = JSON.parse(localStorage.getItem(CHAVE_VISTO) ?? '[]'); return Array.isArray(v) ? v.slice(-20) : [] } catch { return [] } }
const vistosNaMemoria = new Set<string>(lerVistos())
function marcaVisto(a: Aviso) {
  vistosNaMemoria.add(chaveAviso(a))
  try { localStorage.setItem(CHAVE_VISTO, JSON.stringify([...vistosNaMemoria].slice(-20))) } catch { /* sem espaço: a memória da aba e o banco seguram */ }
  supabase.rpc('esc_aviso_semana_visto', { p_tipo: a.tipo, p_semana: a.semana }).then(() => {}, () => {})
}

export function AvisoSemana({ tela }: { tela: string }) {
  const [fila, setFila] = useState<Aviso[]>([])
  useEffect(() => {
    let vivo = true, ultima = 0
    const olha = async () => {
      if (!loggedEmail() || Date.now() - ultima < 30 * 60_000) return // 📉 30/10: o pódio só muda segunda 0h — 1 pergunta a cada 30 min basta
      ultima = Date.now()
      const { data } = await supabase.rpc('esc_avisos_semana')
      if (!vivo || !Array.isArray(data)) return
      // (técnico primeiro, depois o clã — quem foi dos dois vê um depois do outro)
      const lista = (data as Aviso[]).filter(a => a.pos >= 1 && a.pos <= 3 && !vistosNaMemoria.has(chaveAviso(a))).sort((a, b) => (a.tipo === b.tipo ? 0 : a.tipo === 'tecnico' ? -1 : 1))
      setFila(lista)
    }
    const t = setTimeout(olha, 3000) // depois do login assentar
    const { data: sub } = supabase.auth.onAuthStateChange((ev, s) => { if (ev === 'SIGNED_IN' && releConta('aviso-semana', s?.user?.id)) { ultima = 0; setTimeout(olha, 1500) } })
    // (quem deixa o jogo aberto virando a meia-noite de domingo: confere de novo a cada 30 min e quando volta pra aba)
    const iv = setInterval(olha, 30 * 60_000)
    const vis = () => { if (document.visibilityState === 'visible') olha() }
    document.addEventListener('visibilitychange', vis)
    return () => { vivo = false; clearTimeout(t); clearInterval(iv); sub.subscription.unsubscribe(); document.removeEventListener('visibilitychange', vis) }
  }, [])
  const a = fila[0]
  if (!a || TELAS_PREGAO.has(tela)) return null
  const fecha = () => {
    marcaVisto(a)
    setFila(f => f.filter(x => chaveAviso(x) !== chaveAviso(a)))
  }
  return createPortal(<AvisoSemanaCard a={a} onClose={fecha} />, document.body)
}

/** o desenho do aviso (separado pra dar pra conferir com dados de exemplo) */
export function AvisoSemanaCard({ a, onClose: fecha }: { a: Aviso; onClose: () => void }) {
  const cla = a.tipo === 'cla'
  const moedas = (cla ? CLA_SEMANA_MOEDAS : RANKING_SEMANA_MOEDAS)[a.pos]
  const titulo = cla
    ? (a.pos === 1 ? tr('SEU CLÃ É O CAMPEÃO!', 'YOUR CLAN IS THE CHAMPION!') : tr(`SEU CLÃ FICOU EM ${a.pos}º!`, `YOUR CLAN FINISHED ${a.pos === 2 ? '2ND' : '3RD'}!`))
    : tr(`VOCÊ FOI O ${a.pos}º DA SEMANA!`, `YOU WERE ${a.pos === 1 ? '1ST' : a.pos === 2 ? '2ND' : '3RD'} OF THE WEEK!`)
  const zoeira = cla && a.pos === 1 ? fraseZoeira(a) : null
  const txtZap = cla
    ? (a.pos === 1 ? tr(`⚔️ O ${a.nome} é o CAMPEÃO dos Clãs da Semana no Leilão Legends! ${zoeira}`, `⚔️ ${a.nome} are the Clans of the Week CHAMPIONS on Leilão Legends! ${zoeira}`)
      : tr(`⚔️ O ${a.nome} ficou em ${a.pos}º nos Clãs da Semana do Leilão Legends!`, `⚔️ ${a.nome} finished ${a.pos === 2 ? '2nd' : '3rd'} in the Clans of the Week on Leilão Legends!`))
    : tr(`${MEDALHA[a.pos]} Fui o ${a.pos}º da semana no Leilão Legends com ${a.titulos} títulos online!`, `${MEDALHA[a.pos]} I was ${a.pos === 1 ? '1st' : a.pos === 2 ? '2nd' : '3rd'} of the week on Leilão Legends with ${a.titulos} online titles!`)
  const caixa = { border: `2px solid ${INK}`, borderRadius: 12, background: '#fff', padding: '8px 12px', fontWeight: 700, fontSize: 13.5, textAlign: 'left' as const, lineHeight: 1.45 }
  const btn = (bg: string) => ({ flex: 1, ...OSW, fontSize: 15, textTransform: 'uppercase' as const, background: bg, color: INK, border: `3px solid ${INK}`, borderRadius: 12, boxShadow: `3px 3px 0 ${INK}`, padding: '11px 6px', cursor: 'pointer' })
  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 99998, background: 'rgba(12,12,12,.62)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto' }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: 420, maxHeight: '100%', overflowY: 'auto', background: !cla && a.pos === 1 ? 'linear-gradient(170deg,#FFF6D0,#FFF8E6 40%)' : CREME, color: INK, border: `4px solid ${INK}`, borderRadius: 22, boxShadow: `6px 6px 0 ${INK}`, padding: '18px 18px 16px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
        <button onClick={fecha} aria-label={tr('Fechar', 'Close')} style={{ position: 'absolute', right: 10, top: 10, width: 36, height: 36, border: `3px solid ${INK}`, borderRadius: 11, background: '#fff', ...OSW, fontSize: 17, boxShadow: `2px 2px 0 ${INK}`, cursor: 'pointer' }}>✕</button>
        <span style={{ display: 'inline-block', ...OSW, fontSize: 11.5, letterSpacing: 1.1, background: ROXO, color: '#fff', border: `2px solid ${INK}`, borderRadius: 8, padding: '3px 10px', boxShadow: `2px 2px 0 ${INK}` }}>
          {cla ? tr('⚔️ CLÃS DA SEMANA · FECHOU', '⚔️ CLANS OF THE WEEK · CLOSED') : tr('📊 RANKING DA SEMANA · FECHOU', '📊 WEEKLY RANKING · CLOSED')}
        </span>
        <div style={{ margin: '12px 0 2px', display: 'flex', justifyContent: 'center' }}>
          {cla && a.emblema ? <EmblemaCla emblema={a.emblema} size={92} /> : <span style={{ fontSize: 76, lineHeight: 1, filter: `drop-shadow(3px 3px 0 ${INK})` }}>{MEDALHA[a.pos]}</span>}
        </div>
        <div style={{ ...OSW, fontSize: 30, lineHeight: 1.04, textTransform: 'uppercase', margin: '8px 0' }}>{titulo}</div>
        <span style={{ display: 'inline-block', ...OSW, fontSize: 21, background: GRAD_POS[a.pos], border: `3px solid ${INK}`, borderRadius: 12, padding: '3px 14px', boxShadow: `3px 3px 0 ${INK}` }}>{cla ? `${MEDALHA[a.pos]} ` : ''}{a.nome}</span>
        <div style={{ fontWeight: 700, fontSize: 13.5, opacity: .7, margin: '8px 0 10px' }}>{tr(`${a.titulos} títulos online na semana`, `${a.titulos} online titles this week`)}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', background: GREEN, color: '#fff', border: `3px solid ${INK}`, borderRadius: 14, padding: '9px 13px', boxShadow: `3px 3px 0 ${INK}`, marginBottom: 10 }}>
          <b style={{ ...OSW, fontSize: 30, whiteSpace: 'nowrap' }}>+{moedas} 🪙</b>
          <span style={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1.25 }}>{cla ? tr('pra CADA membro jogar no modo carreira', 'for EVERY member to use in career mode') : tr('pra jogar no modo carreira', 'to use in career mode')}<br />
            <small style={{ fontWeight: 600, opacity: .85, fontSize: 11.5 }}>{tr('caem sozinhas na próxima vez que você abrir a carreira', 'they land automatically next time you open your career')}</small></span>
        </div>
        {/* 🚫 29/10: o telão saiu do prêmio (Diego: "não prometam mais isso") */}
        {!cla && <div style={{ ...caixa, marginBottom: 12 }}>
              <div>{tr(`${MEDALHA[a.pos]} Medalha no nome por 30 dias`, `${MEDALHA[a.pos]} Medal next to your name for 30 days`)}</div>
            </div>}
        {zoeira && <div style={{ textAlign: 'left', background: '#FFE3DD', border: `3px solid ${INK}`, borderRadius: 14, padding: '8px 12px', fontWeight: 600, fontSize: 14.5, lineHeight: 1.3, marginBottom: 12, boxShadow: `3px 3px 0 ${INK}` }}>
          <small style={{ display: 'block', ...OSW, fontSize: 11.5, letterSpacing: 1, color: '#C2452F', marginBottom: 2 }}>{tr('😜 ZOEIRA LIBERADA', '😜 TEASING ALLOWED')}</small>{zoeira}
        </div>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => zap(txtZap)} style={btn('#25D366')}>{cla && a.pos === 1 && a.rival ? tr(`📲 ZOAR O ${a.rival.nome} NO ZAP`, `📲 TEASE ${a.rival.nome} ON WHATSAPP`) : tr('📲 CONTAR NO ZAP', '📲 SHARE ON WHATSAPP')}</button>
          <button onClick={fecha} style={btn(GOLD)}>{tr('BORA! 🔨', "LET'S GO! 🔨")}</button>
        </div>
      </div>
    </div>
  )
}
