// ─── 🛒 LOJA DO CLUBE (14/10, Diego: "adorei" o mockup `scripts/mockup-loja-clube.mjs`) ─────────────────────────
//
// Regra dele: *"tudo tem que ter sentido com base nos planos"*. A loja mostra pra cada um SÓ o que faz sentido pro plano
// que ele tem (`planoAtual`, a mesma régua da vitrine de planos):
//   · ⬆️ SUBIR DE PLANO — os degraus acima do seu, pagando só a diferença (`precoSubida`).
//   · 🚁 GALA ÚNICA (R$ 20) e 📣 CANTO DA TORCIDA (R$ 10) — só pra quem tem 🖋 Batismo, porque a gala mostra o ESCUDO no
//     telão e a MASCOTE atravessando (sem batismo sobraria tela vazia). Os dois avulsos somam 30; subir pro Fundador custa
//     20 e já traz os dois + o número de fundador — o desconto de quem pagou o Fundador (palavras dele: *"pra ter uma
//     diferença, quem pagou o fundador ter ganhado desconto"*). Fundador vê "✅ já incluso".
//   · 🎨 COR DO NOME (R$ 4,90) — saiu do Lenda (14/10); só pra quem tem plano, porque troca a cor BRILHANTE que já tem.
//   · 🎁 DAR DE PRESENTE — só PLANO, pra um amigo (`presente.tsx`; o Diego confirma o pagamento e entrega no #admin).
//   · 🪙 MOEDAS pro clube — os pacotes do Banco Legends (R$ 1 = 3 🪙). Viram uma FICHA que a pessoa resgata na carreira que
//     quiser (Clube › Finanças › Banco Legends). Só valem na carreira solo.
//
// 🔒 Segurança (ordem do Diego): a loja NUNCA libera nada sozinha. Clicar, copiar o Pix ou voltar do banco não dá nada —
// quem libera é o Diego (ou, depois, a Vendria confirmando o pagamento no servidor). Aqui só se mostra o preço e o Pix.
import { useState } from 'react'
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
export const LOJA_PRECOS = { galaUnica: 20, canto: 10, cor: 4.9 } as const
/** 🏦 pacotes do Banco Legends (os mesmos de `BL_PACOTES` em pyramidseason.tsx, R$ 1 = 3 🪙) */
const MOEDAS: [number, string, string][] = [[10, 'Cafezinho', 'Coffee money'], [50, 'Reforço pontual', 'Quick boost'], [100, 'Fôlego de temporada', 'Season breather']]
// 🎁 quem JÁ TEM o item não pode ver ele à venda (Diego 14/10: "o Tricolor do Arruda já tem canto"). O canto vem da lista
// do som (`temCantoProprio`). A gala única mora em `GALA_UNICA` (entrada-gala.tsx, chaveada pelo CLUBE e carregada sob
// demanda) — aqui vai o E-MAIL de quem tem. Ganhou gala única nova? Entra nas DUAS listas.
const GALA_UNICA_EMAILS = new Set(['diego.c.fonseca@gmail.com', 'kelvinoliveiraandradeenunes@gmail.com']) // Neymarzetti · K9 FC
const ORDEM: PlanoUnico[] = ['craque', 'lenda', 'batismo', 'fundador']
const NOME: Record<PlanoUnico, [string, string]> = { craque: ['⭐ Craque', '⭐ Star'], lenda: ['👑 Lenda', '👑 Legend'], batismo: ['🖋 Batismo', '🖋 Club Naming'], fundador: ['🖋 Fundador', '🖋 Founder'] }
const GANHO: Record<PlanoUnico, [string, string]> = {
  craque: ['Modo Manual, nível e olheiro até Craque, nome prata', 'Manual Mode, levels and scout up to Star, silver name'],
  lenda: ['nível e olheiro até Lenda, nome dourado, salas à vontade, Minhas Ligas', 'levels and scout up to Legend, gold name, unlimited rooms, My Leagues'],
  batismo: ['escudo, mascote e manto feitos só pro seu clube + entrada de gala', 'crest, mascot and kit made just for your club + grand entrance'],
  fundador: ['gala ÚNICA + canto da torcida + número de fundador + seu clube nas salas online dos outros, mesmo sem você jogar', 'UNIQUE entrance + crowd chant + founder number + your club in other people’s online rooms, even when you’re not playing'],
}

type Item = { id: string; amount: number; ctx: string; msgPt: string; msgEn: string }

export function LojaButton({ className, children }: { className?: string; children?: React.ReactNode }) {
  const [aberta, setAberta] = useState(false)
  return <>
    <button className={className} onClick={() => { logApoio('🛒 abriu a loja'); setAberta(true) }}>{children ?? tr('🛒 LOJA', '🛒 SHOP')}</button>
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
  const email = loggedEmail()
  const jaTem = { 'gala única': atual === 'fundador' || (!!email && GALA_UNICA_EMAILS.has(email)), 'canto da torcida': atual === 'fundador' || temCantoProprio(email) }
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
        <p style={{ fontSize: 13, fontWeight: 700, margin: '8px 0 0', color: 'rgba(12,12,12,.75)' }}>{tr('Tudo aqui é pagamento ÚNICO — nada de mensalidade. E nada deixa o time mais forte no online, na liga dos amigos ou no ranking.', 'Everything here is a ONE-OFF payment — no monthly fee. And nothing makes your team stronger online, in friends’ leagues or in the ranking.')}</p>

        {/* ⬆️ SUBIR DE PLANO */}
        {acima.length > 0 && <>
          <h2 style={h2}>{tr('⬆️ Sobe de plano', '⬆️ Move up a plan')} <span style={sub}>{atual ? tr('paga só a diferença', 'pay only the difference') : tr('pagamento único', 'one-off payment')}</span></h2>
          <div style={{ display: 'grid', gap: 8 }}>
            {acima.map(pl => <div key={pl} style={{ ...card, display: 'flex', gap: 10, alignItems: 'center', background: pl === 'lenda' ? APOIO_PERKS.ouro.grad : pl === 'craque' ? APOIO_PERKS.prata.grad : pl === 'fundador' ? 'linear-gradient(135deg,#14251a,#1B7A3D)' : INK, color: pl === 'batismo' || pl === 'fundador' ? CREAM : INK }}>
              <div style={{ flex: 1 }}>
                <b style={{ ...OSW, fontSize: 18, display: 'block', color: pl === 'batismo' || pl === 'fundador' ? GOLD : INK }}>{tr(NOME[pl][0], NOME[pl][1])}</b>
                <small style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.3, display: 'block' }}>{tr(GANHO[pl][0], GANHO[pl][1])}</small>
              </div>
              <ApoieButton startScreen={pl === 'batismo' || pl === 'fundador' ? 'batismoInfo' : 'choice'} trigger={open => <button onClick={() => { logApoio(`🛒 loja → subir pra ${pl}`); open() }} style={{ ...preco, background: '#fff', color: INK }}>{atual ? '+ ' : ''}{reais(precoSubida(pl, atual))}</button>} />
            </div>)}
          </div>
        </>}

        {/* 🎨 TROCAR A COR (14/10, Diego): saiu do Lenda e virou item — R$ 4,90, troca a cor brilhante do nome */}
        <h2 style={h2}>{tr('🎨 Cor do seu nome', '🎨 Your name colour')} <span style={sub}>{tr('troca a cor brilhante', 'swap your shiny colour')}</span></h2>
        <div style={{ ...card, display: 'flex', gap: 10, alignItems: 'center', opacity: atual ? 1 : .55 }}>
          <div style={{ display: 'flex', gap: 4 }}>{[APOIO_PERKS.ouro.grad, APOIO_PERKS.roxo.grad, APOIO_PERKS.verde.grad, APOIO_PERKS.prata.grad].map((g, i) => <span key={i} style={{ width: 22, height: 22, borderRadius: '50%', background: g, border: `2px solid ${INK}` }} />)}</div>
          <small style={{ flex: 1, fontSize: 11, fontWeight: 700, lineHeight: 1.3 }}>{atual ? tr('Escolha outra cor com brilho pro seu nome nas salas, na tabela e no chat. Seu plano continua o mesmo.', 'Pick another shiny colour for your name in rooms, tables and chat. Your plan stays the same.') : tr('🔒 Precisa de um plano: a cor brilhante vem com ele.', '🔒 Needs a plan: the shiny colour comes with it.')}</small>
          <button disabled={!atual} onClick={() => setComprando({ id: 'cor', amount: LOJA_PRECOS.cor, ctx: 'loja · trocar a cor do nome', msgPt: `Opa! Comprei na Loja do Clube: 🎨 TROCAR A COR DO NOME (${reais(LOJA_PRECOS.cor)}). Cor que eu quero: ____. E-mail da conta: ____ — comprovante em anexo!`, msgEn: `Hey! I bought in the Club Shop: 🎨 NAME COLOUR SWAP (${reais(LOJA_PRECOS.cor)}). Colour I want: ____. Account e-mail: ____ — receipt attached!` })} style={{ ...preco, cursor: atual ? 'pointer' : 'not-allowed' }}>{reais(LOJA_PRECOS.cor)}</button>
        </div>

        {/* 🎁 DAR DE PRESENTE (14/10) — só planos */}
        <h2 style={h2}>{tr('🎁 Dar de presente', '🎁 Send a gift')} <span style={sub}>{tr('um plano pra um amigo', 'a plan for a friend')}</span></h2>
        <PresenteBox />

        {/* 🎤 DO CLUBE BATIZADO */}
        <h2 style={h2}>{tr('🎤 Do seu clube batizado', '🎤 For your named club')} <span style={sub}>{tr('feitos sob medida', 'made to order')}</span></h2>
        {!temBatismo && <p style={{ ...card, margin: 0, fontSize: 12, fontWeight: 700, background: '#FFF3C4' }}>{tr('🔒 Precisa do 🖋 Batismo: a gala mostra o SEU escudo no telão e a SUA mascote atravessando a tela, e o canto toca no estádio do SEU clube.', '🔒 Needs 🖋 Club Naming: the entrance shows YOUR crest on the big screen and YOUR mascot running across, and the chant plays at YOUR club’s stadium.')}</p>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: temBatismo ? 0 : 8, opacity: temBatismo ? 1 : .55 }}>
          {([['🚁', tr('Gala ÚNICA', 'UNIQUE entrance'), tr('helicóptero, moto, fumaça… só o seu clube tem', 'helicopter, bike, smoke… only your club has it'), LOJA_PRECOS.galaUnica, 'gala única'],
             ['📣', tr('Canto da torcida', 'Crowd chant'), tr('o canto do seu time de coração tocando no estádio da sua Carreira', 'your favourite team’s chant playing at your Career stadium'), LOJA_PRECOS.canto, 'canto da torcida']] as const).map(([ic, t, d, v, ctx]) =>
            <div key={ctx} style={{ ...card, textAlign: 'center' }}>
              <div style={{ fontSize: 32 }}>{ic}</div>
              <b style={{ ...OSW, fontSize: 14, textTransform: 'uppercase', display: 'block' }}>{t}</b>
              <small style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(12,12,12,.6)', display: 'block', minHeight: 28 }}>{d}</small>
              {jaTem[ctx] ? <div style={{ ...preco, background: CREAM, color: GREEN, cursor: 'default', marginTop: 6 }}>{atual === 'fundador' ? tr('✅ já incluso', '✅ included') : tr('✅ você já tem', '✅ you have it')}</div>
                : <button disabled={!temBatismo} onClick={() => setComprando({ id: ctx, amount: v, ctx: `loja · ${ctx}`, msgPt: `Opa! Comprei na Loja do Clube: ${ic} ${ctx.toUpperCase()} (${reais(v)}). E-mail da conta: ____ — comprovante em anexo!`, msgEn: `Hey! I bought in the Club Shop: ${ic} ${ctx.toUpperCase()} (${reais(v)}). Account e-mail: ____ — receipt attached!` })}
                  style={{ ...preco, width: '100%', marginTop: 6, cursor: temBatismo ? 'pointer' : 'not-allowed' }}>{reais(v)}</button>}
            </div>)}
        </div>
        {atual === 'batismo' && !jaTem['gala única'] && !jaTem['canto da torcida'] && <p style={{ fontSize: 11, fontWeight: 700, margin: '8px 2px 0', color: GREEN }}>{tr(`💡 Os dois juntos dão ${reais(LOJA_PRECOS.galaUnica + LOJA_PRECOS.canto)}. Subindo pro 🖋 Fundador você paga ${reais(precoSubida('fundador', 'batismo'))} e ainda ganha o número de fundador.`, `💡 Both together cost ${reais(LOJA_PRECOS.galaUnica + LOJA_PRECOS.canto)}. Moving up to 🖋 Founder costs ${reais(precoSubida('fundador', 'batismo'))} and also gives you a founder number.`)}</p>}

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
