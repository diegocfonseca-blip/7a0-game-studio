// ─── 🛒 LOJA DO CLUBE (14/10, Diego: "adorei" o mockup `scripts/mockup-loja-clube.mjs`) ─────────────────────────
//
// Regra dele: *"tudo tem que ter sentido com base nos planos"*. A loja mostra pra cada um SÓ o que faz sentido pro plano
// que ele tem (`planoAtual`, a mesma régua da vitrine de planos):
//   · ⬆️ SUBIR DE PLANO — os degraus acima do seu, pagando só a diferença (`precoSubida`).
//   · 🚁 GALA ÚNICA (R$ 25) e 📣 CANTO DA TORCIDA (R$ 10) — só pra quem tem 🖋 Batismo, porque a gala mostra o ESCUDO no
//     telão e a MASCOTE atravessando (sem batismo sobraria tela vazia). Os dois avulsos somam 35; subir pro Fundador custa
//     25 (diferença + 5) e já traz os dois + o número de fundador — o desconto de quem pagou o Fundador (palavras dele: *"pra ter uma
//     diferença, quem pagou o fundador ter ganhado desconto"*). Fundador vê "✅ já incluso".
//   · 🎨 (14/10) cor do nome NÃO é vendida — Diego: "não bote negócio de cor… pra não confundir". E o Lenda não promete mais escolher cor.
//   · 🎟️ SALAS EXTRAS — 3 por R$ 4,90 pra quem não cria à vontade; o gatilho `esc_sala_por_dia` gasta 1 quando a do dia acabou.
//   · 🎁 DAR DE PRESENTE — só PLANO, pra um amigo (`presente.tsx`; o Diego confirma o pagamento e entrega no #admin).
//   · 🪙 MOEDAS pro clube — os pacotes do Banco Legends (R$ 1 = 3 🪙). Viram uma FICHA que a pessoa resgata na carreira que
//     quiser (Clube › Finanças › Banco Legends). Só valem na carreira solo.
//
// 🔒 Segurança (ordem do Diego): a loja NUNCA libera nada sozinha. Clicar, copiar o Pix ou voltar do banco não dá nada —
// quem libera é o Diego (ou, depois, a Vendria confirmando o pagamento no servidor). Aqui só se mostra o preço e o Pix.
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { createPortal } from 'react-dom'
import { tr, getLang } from './lang'
import { myApoioPerk, useDireitos, logApoio, APOIO_PERKS, ApoioSheen, loggedEmail } from './apoio'
import { temCantoProprio } from './sound'
import { precoSubida, precoTxt, planoAtual, type PlanoUnico } from './planos-regras'
import { PixBox, APOIO_IG, ApoieButton } from './screens'
import { PresenteBox } from './presente'

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', CREAM = '#F4ECD6'
const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 700 } as const
/** 💰 avulsos do clube batizado (Diego 14/10) */
export const LOJA_PRECOS = { canto: 10, salasExtras: 4.9 } as const // 💰 14/10: a gala avulsa saiu (só no Fundador)
/** 🎟️ quantas salas vêm no pacote (Diego 14/10) */
export const SALAS_EXTRAS_QTD = 3
/** 🏦 pacotes do Banco Legends (os mesmos de `BL_PACOTES` em pyramidseason.tsx, R$ 1 = 3 🪙) */
const MOEDAS: [number, string, string][] = [[10, 'Cafezinho', 'Coffee money'], [50, 'Reforço pontual', 'Quick boost'], [100, 'Fôlego de temporada', 'Season breather']]
// 🎁 quem JÁ TEM o canto não vê ele à venda (Diego 14/10: "o Tricolor do Arruda já tem canto") — lista do som (`temCantoProprio`).
const ORDEM: PlanoUnico[] = ['craque', 'lenda', 'batismo', 'fundador']
const NOME: Record<PlanoUnico, [string, string]> = { craque: ['⭐ Craque', '⭐ Star'], lenda: ['👑 Lenda', '👑 Legend'], batismo: ['🖋 Batismo', '🖋 Club Naming'], fundador: ['🖋 Fundador', '🖋 Founder'] }
const GANHO: Record<PlanoUnico, [string, string]> = {
  craque: ['Modo Manual, nível e olheiro até Craque, nome prata', 'Manual Mode, levels and scout up to Star, silver name'],
  lenda: ['nível e olheiro até Lenda, nome dourado, salas à vontade, Minhas Ligas', 'levels and scout up to Legend, gold name, unlimited rooms, My Leagues'],
  batismo: ['escudo, mascote e manto feitos só pro seu clube + entrada de gala', 'crest, mascot and kit made just for your club + grand entrance'],
  fundador: ['gala ÚNICA + canto da torcida + número de fundador + seu clube nas salas online dos outros, mesmo sem você jogar', 'UNIQUE entrance + crowd chant + founder number + your club in other people’s online rooms, even when you’re not playing'],
}

type Item = { id: string; amount: number; ctx: string; msgPt: string; msgEn: string }

export function LojaButton({ className, style, children }: { className?: string; style?: React.CSSProperties; children?: React.ReactNode }) {
  const [aberta, setAberta] = useState(false)
  return <>
    <button className={className} style={style} onClick={() => { logApoio('🛒 abriu a loja'); setAberta(true) }}>{children ?? tr('🛒 LOJA', '🛒 SHOP')}</button>
    {aberta && <Loja onClose={() => setAberta(false)} />}
  </>
}

function Loja({ onClose }: { onClose: () => void }) {
  const direitos = useDireitos()
  const tier = myApoioPerk()?.tier
  const atual = planoAtual(direitos, tier)
  const reais = (v: number) => precoTxt(v, getLang() === 'en')
  const [comprando, setComprandoRaw] = useState<Item | null>(null)
  const setComprando = (it: Item | null) => { setComprandoRaw(it); if (it) setTimeout(() => document.getElementById('loja-pagar')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60) }
  const acima = ORDEM.slice(atual ? ORDEM.indexOf(atual) + 1 : 0)
  const temBatismo = atual === 'batismo' || atual === 'fundador'
  // 🎟️ salas extras: só pra quem NÃO cria à vontade (grátis e Craque novo). O saldo vem do banco.
  // 14/10 (Diego): "se ele é batismo por que aparece salas extras?" — quem cria à vontade (Lenda+, ou Craque antigo) NEM VÊ a seção
  const salasAVontade = !!direitos?.salasPagas || atual === 'lenda' || atual === 'batismo' || atual === 'fundador'
  const [saldoSalas, setSaldoSalas] = useState<number | null>(null)
  useEffect(() => { if (loggedEmail()) supabase.rpc('esc_minhas_salas_extras').then(({ data }) => { if (typeof data === 'number') setSaldoSalas(data) }, () => {}) }, [])
  const email = loggedEmail()
  const jaTem = { 'canto da torcida': atual === 'fundador' || temCantoProprio(email) }
  const perk = tier ? APOIO_PERKS[tier] : APOIO_PERKS.bege

  const card: React.CSSProperties = { background: '#fff', border: `3px solid ${INK}`, borderRadius: 14, boxShadow: `3px 3px 0 ${INK}`, padding: 10 }
  const h2: React.CSSProperties = { ...OSW, fontSize: 19, textTransform: 'uppercase', margin: '18px 0 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }
  const sub: React.CSSProperties = { fontFamily: 'Arial, sans-serif', fontSize: 11, fontWeight: 700, textTransform: 'none', color: 'rgba(12,12,12,.55)' }
  const preco: React.CSSProperties = { ...OSW, fontSize: 15, background: GREEN, color: '#fff', border: `2px solid ${INK}`, borderRadius: 9, padding: '5px 10px', boxShadow: `2px 2px 0 ${INK}`, whiteSpace: 'nowrap', cursor: 'pointer' }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 99997, background: CREAM, color: INK, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 3, background: INK, padding: '11px 15px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ ...OSW, fontSize: 17, textTransform: 'uppercase', color: GOLD }}>{tr('🛒 Loja do Clube', '🛒 Club Shop')}</span>
        <button onClick={onClose} aria-label={tr('fechar', 'close')} style={{ marginLeft: 'auto', background: 'transparent', color: '#fff', border: '2px solid rgba(255,255,255,.35)', borderRadius: 10, padding: '4px 10px', fontWeight: 900, cursor: 'pointer' }}>✕</button>
      </div>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '14px 15px 40px', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-block', ...OSW, fontSize: 12, background: perk.grad, border: `2px solid ${INK}`, borderRadius: 9, padding: '4px 10px', boxShadow: `2px 2px 0 ${INK}` }}>
          <ApoioSheen holo={perk.holo} />
          <span style={{ position: 'relative' }}>{atual ? tr(`VOCÊ É ${NOME[atual][0].toUpperCase()}`, `YOU ARE ${NOME[atual][1].toUpperCase()}`) : tr('PLANO GRÁTIS', 'FREE PLAN')}</span>
        </div>
        <p style={{ fontSize: 13, fontWeight: 700, margin: '8px 0 0', color: 'rgba(12,12,12,.75)' }}>{tr('Tudo aqui é pagamento ÚNICO — nada de mensalidade. Nas salas online ninguém compra vantagem: lá é todo mundo igual.', 'Everything here is a ONE-OFF payment — no monthly fee. In online rooms nobody buys an edge: everyone is equal there.')}</p>

        {/* 💛 14/10 (Diego): da Loja tem que dar pra ver TODOS os planos e "pra onde vai o dinheiro" */}
        <ApoieButton startScreen="choice" trigger={open => <button onClick={() => { logApoio('🛒 loja → ver todos os planos'); open() }} style={{ marginTop: 10, width: '100%', ...OSW, fontSize: 14, background: '#FFF3C4', color: INK, border: `3px solid ${INK}`, borderRadius: 12, boxShadow: `3px 3px 0 ${INK}`, padding: '8px 10px', cursor: 'pointer' }}>{tr('💛 VER TODOS OS PLANOS E PRA ONDE VAI O DINHEIRO ›', '💛 SEE ALL PLANS AND WHERE THE MONEY GOES ›')}</button>} />

        {/* ⬆️ SUBIR DE PLANO */}
        {acima.length > 0 && <>
          <h2 style={h2}>{tr('⬆️ Sobe de plano', '⬆️ Move up a plan')} <span style={sub}>{atual ? tr('paga só a diferença', 'pay only the difference') : tr('pagamento único', 'one-off payment')}</span></h2>
          <div style={{ display: 'grid', gap: 8 }}>
            {acima.map(pl => <ApoieButton key={pl} startScreen="choice" trigger={open => <div role="button" tabIndex={0} onClick={() => { logApoio(`🛒 loja → ver plano ${pl}`); open() }} style={{ ...card, cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center', background: pl === 'lenda' ? APOIO_PERKS.ouro.grad : pl === 'craque' ? APOIO_PERKS.prata.grad : pl === 'fundador' ? 'linear-gradient(135deg,#14251a,#1B7A3D)' : INK, color: pl === 'batismo' || pl === 'fundador' ? CREAM : INK }}>
              <div style={{ flex: 1 }}>
                <b style={{ ...OSW, fontSize: 18, display: 'block', color: pl === 'batismo' || pl === 'fundador' ? GOLD : INK }}>{tr(NOME[pl][0], NOME[pl][1])}</b>
                <small style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.3, display: 'block' }}>{tr(GANHO[pl][0], GANHO[pl][1])}</small>
              </div>
              <span style={{ ...preco, background: '#fff', color: INK }}>{atual ? '+ ' : ''}{reais(precoSubida(pl, atual))} ›</span>
            </div>} />)}
          </div>
        </>}

        {!salasAVontade && <>
        {/* 🎟️ SALAS EXTRAS DO DIA (14/10, Diego: "pode fazer sala extras do dia") */}
        <h2 style={h2}>{tr('🎟️ Salas extras', '🎟️ Extra rooms')} <span style={sub}>{tr('pra criar mais de 1 sala no dia', 'to create more than 1 room a day')}</span></h2>
        <div style={{ ...card, display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 30 }}>🎟️</span>
          <small style={{ flex: 1, fontSize: 11.5, fontWeight: 700, lineHeight: 1.35 }}>{salasAVontade
            ? tr('✅ Você já cria quantas salas quiser — não precisa disso.', '✅ You already create as many rooms as you like — no need for this.')
            : <>{tr(`${SALAS_EXTRAS_QTD} salas a mais pra usar quando a do dia acabar. Não vencem.`, `${SALAS_EXTRAS_QTD} more rooms to use once today’s is gone. They never expire.`)}{saldoSalas ? <b style={{ display: 'block', color: GREEN, marginTop: 3 }}>{tr(`Você tem ${saldoSalas} sala${saldoSalas > 1 ? 's' : ''} extra${saldoSalas > 1 ? 's' : ''}.`, `You have ${saldoSalas} extra room${saldoSalas > 1 ? 's' : ''}.`)}</b> : null}<span style={{ display: 'block', color: 'rgba(12,12,12,.55)', marginTop: 3 }}>{tr('Criar à vontade, pra sempre, é do 👑 Lenda.', 'Unlimited rooms, forever, come with 👑 Legend.')}</span></>}</small>
          {!salasAVontade && <button onClick={() => setComprando({ id: 'salas', amount: LOJA_PRECOS.salasExtras, ctx: 'loja · 3 salas extras', msgPt: `Opa! Comprei na Loja do Clube: 🎟️ ${SALAS_EXTRAS_QTD} SALAS EXTRAS (${reais(LOJA_PRECOS.salasExtras)}). E-mail da conta: ____ — comprovante em anexo!`, msgEn: `Hey! I bought in the Club Shop: 🎟️ ${SALAS_EXTRAS_QTD} EXTRA ROOMS (${reais(LOJA_PRECOS.salasExtras)}). Account e-mail: ____ — receipt attached!` })} style={preco}>{reais(LOJA_PRECOS.salasExtras)}</button>}
        </div>
        </>}

        {/* 🎁 DAR DE PRESENTE (14/10) — só planos */}
        <h2 style={h2}>{tr('🎁 Dar de presente', '🎁 Send a gift')} <span style={sub}>{tr('um plano pra um amigo', 'a plan for a friend')}</span></h2>
        <PresenteBox />

        {/* 🎤 DO CLUBE BATIZADO — 14/10 (Diego): a gala avulsa SAIU (custava o mesmo que subir pro Fundador, que traz tudo).
            Fica só o 📣 canto avulso, o pedacinho barato; a gala única vem no 🖋 Fundador. */}
        <h2 style={h2}>{tr('📣 Canto da torcida', '📣 Crowd chant')} <span style={sub}>{tr('pro seu clube batizado', 'for your named club')}</span></h2>
        <div style={{ ...card, display: 'flex', gap: 10, alignItems: 'center', opacity: temBatismo ? 1 : .6 }}>
          <span style={{ fontSize: 30 }}>📣</span>
          <small style={{ flex: 1, fontSize: 11.5, fontWeight: 700, lineHeight: 1.35 }}>{temBatismo
            ? tr('Vale nos DOIS lugares: 🏟️ na Carreira, tocando no estádio durante os jogos, e 🌐 no online, junto com a sua entrada de gala (se você tiver a gala).', 'Works in BOTH places: 🏟️ in Career, playing at the stadium during matches, and 🌐 online, together with your grand entrance (if you have one).')
            : tr('🔒 Precisa do 🖋 Batismo: o canto toca no estádio do SEU clube.', '🔒 Needs 🖋 Club Naming: the chant plays at YOUR club’s stadium.')}</small>
          {jaTem['canto da torcida'] ? <span style={{ ...preco, background: CREAM, color: GREEN, cursor: 'default' }}>{atual === 'fundador' ? tr('✅ incluso', '✅ included') : tr('✅ já tem', '✅ owned')}</span>
            : <button disabled={!temBatismo} onClick={() => setComprando({ id: 'canto', amount: LOJA_PRECOS.canto, ctx: 'loja · canto da torcida', msgPt: `Opa! Comprei na Loja do Clube: 📣 CANTO DA TORCIDA (${reais(LOJA_PRECOS.canto)}). Meu time de coração: ____. E-mail da conta: ____ — comprovante em anexo!`, msgEn: `Hey! I bought in the Club Shop: 📣 CROWD CHANT (${reais(LOJA_PRECOS.canto)}). My favourite team: ____. Account e-mail: ____ — receipt attached!` })} style={{ ...preco, cursor: temBatismo ? 'pointer' : 'not-allowed' }}>{reais(LOJA_PRECOS.canto)}</button>}
        </div>
        {atual === 'batismo' && <p style={{ fontSize: 11.5, fontWeight: 700, margin: '8px 2px 0', color: GREEN, lineHeight: 1.4 }}>{tr(`🚁 Quer a gala única? Ela vem no 🖋 Fundador: + ${reais(precoSubida('fundador', 'batismo'))} e você leva gala + canto + número de fundador + o clube nas salas online dos outros.`, `🚁 Want the unique entrance? It comes with 🖋 Founder: + ${reais(precoSubida('fundador', 'batismo'))} for entrance + chant + founder number + your club in other people’s online rooms.`)}</p>}

        {/* 🪙 MOEDAS */}
        <h2 style={h2}>{tr('🏦 Moedas pro clube', '🏦 Coins for your club')} <span style={sub}>{tr('Banco Legends · carreira solo', 'Banco Legends · solo career')}</span></h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {MOEDAS.map(([r, pt, en], i) => <div key={r} style={{ ...card, textAlign: 'center', background: i === 1 ? '#FFF3C4' : '#fff', padding: 8 }}>
            <div style={{ fontSize: 24 }}>🪙</div>
            <b style={{ ...OSW, fontSize: 17, display: 'block' }}>{r * 3} 🪙</b>
            <small style={{ fontSize: 10, fontWeight: 700, color: 'rgba(12,12,12,.6)', display: 'block', minHeight: 26 }}>{tr(pt, en)}</small>
            <button onClick={() => setComprando({ id: `moedas-${r}`, amount: r, ctx: `loja · banco legends ${r * 3} moedas`, msgPt: `Opa! Comprei na Loja do Clube: 🏦 ${r * 3} MOEDAS (${reais(r)}). E-mail da conta: ____ — comprovante em anexo!`, msgEn: `Hey! I bought in the Club Shop: 🏦 ${r * 3} COINS (${reais(r)}). Account e-mail: ____ — receipt attached!` })} style={{ ...preco, width: '100%', marginTop: 6 }}>{reais(r)}</button>
          </div>)}
        </div>
        <p style={{ fontSize: 11, fontWeight: 700, margin: '8px 2px 0', color: 'rgba(12,12,12,.6)', lineHeight: 1.4 }}>{tr('Você recebe uma FICHA e resgata na carreira que quiser, quando quiser: Clube › Finanças › 🏦 Banco Legends. Moeda vale só na carreira solo (não entra em sala online nem em liga dos amigos).', 'You get a VOUCHER and redeem it in whichever career you like, whenever you like: Club › Finances › 🏦 Banco Legends. Coins only work in the solo career (not in online rooms or friends’ leagues).')}</p>

        {/* 💳 COMO PAGAR (o item escolhido) */}
        {comprando && <div id="loja-pagar" style={{ ...card, marginTop: 18, background: '#FFF8E1' }}>
          <p style={{ ...OSW, fontSize: 16, textTransform: 'uppercase', margin: '0 0 8px' }}>{tr('💳 Pagar', '💳 Pay')} · {reais(comprando.amount)}</p>
          <PixBox ctx={comprando.ctx} amount={comprando.amount} />
          <button onClick={async () => { logApoio(`🛒 mandou comprovante · ${comprando.ctx}`); try { await navigator.clipboard.writeText(tr(comprando.msgPt, comprando.msgEn)) } catch { /* segue */ } window.open(APOIO_IG, '_blank', 'noopener') }}
            style={{ width: '100%', marginTop: 10, ...OSW, fontSize: 14, background: '#E1306C', color: '#fff', border: `3px solid ${INK}`, borderRadius: 12, boxShadow: `3px 3px 0 ${INK}`, padding: 10, cursor: 'pointer' }}>{tr('📸 MANDAR COMPROVANTE NO @leilaolegendscom', '📸 SEND THE RECEIPT TO @leilaolegendscom')}</button>
          <p style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(12,12,12,.55)', textAlign: 'center', margin: '6px 0 0' }}>{tr('a mensagem já vai copiada · liberamos em até 24h no e-mail da sua conta', 'the message is already copied · we unlock it within 24h on your account e-mail')}</p>
          <p style={{ textAlign: 'center', margin: '8px 0 0' }}><button onClick={() => setComprando(null)} style={{ background: 'none', border: 'none', textDecoration: 'underline', fontWeight: 900, fontSize: 11, color: 'rgba(12,12,12,.5)', cursor: 'pointer' }}>{tr('cancelar', 'cancel')}</button></p>
        </div>}
        <p style={{ textAlign: 'center', marginTop: 18 }}><button onClick={onClose} style={{ background: 'none', border: 'none', textDecoration: 'underline', fontWeight: 900, fontSize: 12, color: 'rgba(12,12,12,.5)', cursor: 'pointer' }}>{tr('fechar', 'close')}</button></p>
      </div>
    </div>,
    document.body,
  )
}
