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
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { createPortal } from 'react-dom'
import { tr, getLang } from './lang'
import { myApoioPerk, useDireitos, logApoio, APOIO_PERKS, ApoioSheen, loggedEmail } from './apoio'
import { temCantoProprio } from './sound'
import { precoSubida, precoTxt, planoAtual, PRECOS_UNICO, PRECOS_DUPLO, type PlanoUnico } from './planos-regras'
import { PixBox, APOIO_IG, ApoieButton, GiroDaRodada } from './screens'
import { PresenteBox } from './presente'
import { TemasNaLoja } from './temas-loja' // 🎨 18/10: tema da sala (time de coração + clube batizado)
import { MarcaMensal } from './marca-mensal' // 📅 18/10: patrocínio mensal com números e fotos
import { PixMP, AnunciosPendentes, WHATSAPP_CONTATO, WHATSAPP_TXT, EMAIL_CONTATO, type ProdutoMp } from './pix-mp'
import { patrocinioLojaOk, type AnuncioGiro } from './patrocinio'
// 📺 18/10 (Diego): "um telão pro da galera e um telão pro da empresa… passando": exemplos FIXOS que rodam na Loja
const EX_EMPRESA: AnuncioGiro[] = [
  { texto: '🚗 Vadico Veículos · Oferta do dia: GWM Haval H6 0 km blindado · Menor valor do Rio', cor: '#FFC400' },
  { texto: '🤖 Tidex · Sua empresa aparece no ChatGPT? Clique aqui', cor: '#FFC400' }, // 19/10: Tidex no lugar da Max Joias
]
const EX_RECADO: AnuncioGiro[] = [
  { texto: 'Parabéns The Wolf, papou tudo hoje 🐺', cor: '#FF5FA2', recado: { autor: 'Chelsão da Massa FC' } },
  { texto: 'Bom dia grupo! Hoje tem pregão aberto 21h ☀️', cor: '#FF5FA2', recado: { autor: 'Futpoint' } },
]
import { usePixMp } from './sport'
import { useEsc, fichasExtras, carregaFichasExtras, fichasExtrasCompraveis, FICHA_EXTRA_PRECO } from './store'
import { MeuPresidenteLoja } from './presidente-loja'

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

/** `naCarreira`: aberta de DENTRO da carreira (Clube › Finanças) — as moedas caem direto no caixa da carreira aberta */
/** `ancora`: id de uma seção da Loja pra já abrir rolada nela (ex.: 'loja-marca', o "📣 Anuncie aqui" do giro) */
export function LojaButton({ className, style, children, naCarreira = false, ancora }: { className?: string; style?: React.CSSProperties; children?: React.ReactNode; naCarreira?: boolean; ancora?: string }) {
  const [aberta, setAberta] = useState(false)
  return <>
    <button className={className} style={style} onClick={() => { logApoio(ancora ? `🛒 abriu a loja (${ancora})` : naCarreira ? '🛒 abriu a loja (carreira)' : '🛒 abriu a loja'); setAberta(true) }}>{children ?? tr('🛒 LOJA', '🛒 SHOP')}</button>
    {aberta && <Loja onClose={() => setAberta(false)} naCarreira={naCarreira} ancora={ancora} />}
  </>
}

/** 🏦 dentro da carreira: moedas já pagas esperando (compradas sem escolher carreira) + quem tem um CÓDIGO de ficha antigo */
function ResgateFicha() {
  const { state, dispatch } = useEsc()
  const [guardadas, setGuardadas] = useState<{ code: string; coins: number }[]>([])
  const [cod, setCod] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; tx: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const carrega = useCallback(() => {
    supabase.rpc('esc_mp_minhas_fichas2').then(({ data }) => setGuardadas((Array.isArray(data) ? data as { code: string; coins: number; seed_destino: number | null }[] : []).filter(f => f.seed_destino == null || Number(f.seed_destino) !== state.seed)), () => {})
  }, [state.seed])
  useEffect(() => { carrega() }, [carrega])
  const resgata = async (code: string) => {
    if (busy || !code.trim()) return
    setBusy(true); setMsg(null)
    const { data, error } = await supabase.rpc('bl_redeem', { p_code: code.trim() })
    setBusy(false)
    if (!error && typeof data === 'number' && data > 0) { dispatch({ type: 'BANCO_CREDIT', coins: data, code: code.trim().toUpperCase() }); setMsg({ ok: true, tx: tr(`+${data} 🪙 no caixa deste clube!`, `+${data} 🪙 in this club’s till!`) }); setCod('') }
    else setMsg({ ok: false, tx: tr('Código inválido ou já usado.', 'Invalid or already used code.') })
    carrega()
  }
  return <div style={{ marginTop: 10 }}>
    {guardadas.map(f => <div key={f.code} style={{ display: 'flex', alignItems: 'center', gap: 8, border: `3px solid ${INK}`, borderRadius: 12, padding: '8px 10px', background: '#FFF3C4', marginBottom: 8 }}>
      <span style={{ flex: 1, fontSize: 11.5, fontWeight: 800 }}>🪙 {tr(`${f.coins} moedas já pagas, esperando.`, `${f.coins} coins already paid, waiting.`)}</span>
      <button onClick={() => resgata(f.code)} disabled={busy} style={{ ...OSW, fontSize: 12, textTransform: 'uppercase', background: GREEN, color: '#fff', border: `2px solid ${INK}`, borderRadius: 9, padding: '6px 9px', cursor: 'pointer' }}>{tr('Depositar aqui', 'Deposit here')}</button>
    </div>)}
    <div style={{ display: 'flex', gap: 6 }}>
      <input value={cod} onChange={e => setCod(e.target.value)} placeholder={tr('Tem um código de ficha? BL-XXXX-XX', 'Got a voucher code? BL-XXXX-XX')} maxLength={14}
        style={{ flex: 1, minWidth: 0, border: `2px solid ${INK}`, borderRadius: 10, padding: '7px 9px', fontSize: 12, fontWeight: 700, background: '#fff', textTransform: 'uppercase' }} />
      <button onClick={() => resgata(cod)} disabled={busy || !cod.trim()} style={{ ...OSW, fontSize: 12, textTransform: 'uppercase', background: GOLD, border: `2px solid ${INK}`, borderRadius: 10, padding: '6px 10px', cursor: 'pointer' }}>{tr('Resgatar', 'Redeem')}</button>
    </div>
    {msg && <p style={{ fontSize: 11.5, fontWeight: 900, margin: '6px 2px 0', color: msg.ok ? GREEN : '#C2452F' }}>{msg.tx}</p>}
  </div>
}

// 💳 item da Loja → produto do Pix do Mercado Pago (15/10): salas extras, canto e moedas já vão pelo Pix novo
const produtoMp = (id: string): ProdutoMp | null => id === 'salas' ? 'salas_extras' : id === 'canto' ? 'canto' : id === 'moedas-10' ? 'moedas_10' : id === 'moedas-50' ? 'moedas_50' : id === 'moedas-100' ? 'moedas_100' : id === 'dia-marca' ? 'dia_marca' : id === 'giro-dia' ? 'giro_dia' : id === 'giro-hora' ? 'giro_hora' : id === 'recado-hora' ? 'recado_hora' : id === 'recado-dia' ? 'recado_dia' : id === 'ficha' ? 'ficha_carreira' : null
function Loja({ onClose, naCarreira = false, ancora }: { onClose: () => void; naCarreira?: boolean; ancora?: string }) {
  const pixMp = usePixMp()
  useEffect(() => {
    if (!ancora) return
    const t = setTimeout(() => document.getElementById(ancora)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120)
    return () => clearTimeout(t)
  }, [ancora])
  const { state: esc, dispatch: escDispatch } = useEsc()
  const naCarr = naCarreira && !!esc.careerOnline && esc.onlineMode !== 'online'
  // 🏦 comprou de DENTRO da carreira: a ficha do Pix é resgatada sozinha e cai no caixa da carreira aberta (16/10, Diego:
  // "na loja dentro da carreira já saberia que é o save atual dele"; o Banco Legends saiu pra ser uma porta só)
  const creditaFicha = useCallback(async (ficha: string): Promise<number | null> => {
    const { data, error } = await supabase.rpc('bl_redeem', { p_code: ficha })
    if (error || typeof data !== 'number' || data <= 0) return null
    escDispatch({ type: 'BANCO_CREDIT', coins: data, code: ficha })
    return data
  }, [escDispatch])
  const direitos = useDireitos()
  const tier = myApoioPerk()?.tier
  const atual = planoAtual(direitos, tier)
  const reais = (v: number) => precoTxt(v, getLang() === 'en')
  const [comprando, setComprandoRaw] = useState<Item | null>(null)
  const [duploAberto, setDuploAberto] = useState<PlanoUnico | null>(null)
  const setComprando = (it: Item | null) => { setComprandoRaw(it); if (it) setTimeout(() => document.getElementById('loja-pagar')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60) }
  const acima = ORDEM.slice(atual ? ORDEM.indexOf(atual) + 1 : 0)
  const temBatismo = atual === 'batismo' || atual === 'fundador'
  // 🎟️ salas extras: só pra quem NÃO cria à vontade (grátis e Craque novo). O saldo vem do banco.
  // 14/10 (Diego): "se ele é batismo por que aparece salas extras?" — quem cria à vontade (Lenda+, ou Craque antigo) NEM VÊ a seção
  const salasAVontade = !!direitos?.salasPagas || atual === 'lenda' || atual === 'batismo' || atual === 'fundador'
  const [saldoSalas, setSaldoSalas] = useState<number | null>(null)
  useEffect(() => { if (loggedEmail()) supabase.rpc('esc_minhas_salas_extras').then(({ data }) => { if (typeof data === 'number') setSaldoSalas(data) }, () => {}) }, [])
  // 💾 ficha extra de carreira (17/10): o saldo vem do banco; some quando bate no teto que o aparelho guarda
  const [fichasTem, setFichasTem] = useState(() => fichasExtras())
  useEffect(() => { carregaFichasExtras().then(setFichasTem, () => {}) }, [])
  const fichasPode = fichasExtrasCompraveis()
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

        {/* 🧑‍💼 MEU PRESIDENTE (15/10) — o boneco mora na conta; só pra conta liberada enquanto está em teste */}
        <MeuPresidenteLoja />

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
            {/* 📲 16/10 (Diego: "coloque meu telefone também pra quem faz batismo e fundador caso queira tirar dúvidas") */}
            {acima.some(pl => pl === 'batismo' || pl === 'fundador') && <a href={`https://wa.me/${WHATSAPP_CONTATO}?text=${encodeURIComponent(tr('Oi Diego! Tenho uma dúvida sobre o batismo/Fundador do Leilão Legends.', 'Hi Diego! I have a question about the Leilão Legends Club Naming/Founder.'))}`} target="_blank" rel="noreferrer"
              style={{ display: 'block', textAlign: 'center', fontSize: 11.5, fontWeight: 800, color: GREEN, textDecoration: 'underline' }}>{tr(`💬 Dúvida sobre Batismo ou Fundador? WhatsApp do Diego: ${WHATSAPP_TXT}`, `💬 Questions about Club Naming or Founder? Diego’s WhatsApp: ${WHATSAPP_TXT}`)}</a>}
            {/* 💛 PLANO DUPLO (16/10, Diego: "plano duplo… 10%… sutilmente embaixo do plano" + "o valor tem que ser um só pagando"):
                só no Pix novo, e só quando sai mais barato que subir + presentear separado */}
            {pixMp && acima.filter(pl => PRECOS_DUPLO[pl] < precoSubida(pl, atual) + PRECOS_UNICO[pl]).map(pl => duploAberto === pl
              ? <PresenteBox key={`d-${pl}`} duplo={pl} onClose={() => setDuploAberto(null)} />
              : <button key={`d-${pl}`} onClick={() => { logApoio(`💛 loja → plano duplo ${pl}`); setDuploAberto(pl) }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: '#FFF8E1', border: `2px dashed ${INK}`, borderRadius: 11, padding: '6px 10px', cursor: 'pointer', textAlign: 'left', fontFamily: 'Arial, sans-serif' }}>
                  <span style={{ flex: 1, fontSize: 11.5, fontWeight: 800 }}>{tr(`💛 Leve 2 ${NOME[pl][0]}: um pra você, outro de presente`, `💛 Get 2 ${NOME[pl][1]}: one for you, one as a gift`)}</span>
                  <span style={{ whiteSpace: 'nowrap', fontSize: 12 }}><s style={{ opacity: .5 }}>{reais(PRECOS_UNICO[pl] * 2)}</s> <b style={{ ...OSW, fontSize: 14 }}>{reais(PRECOS_DUPLO[pl])}</b> <i style={{ fontStyle: 'normal', background: GREEN, color: '#fff', borderRadius: 6, padding: '0 5px', fontSize: 10.5, fontWeight: 900 }}>-10%</i></span>
                </button>)}
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

        {/* 💾 FICHA EXTRA DE CARREIRA (17/10, Diego: "add ficha de save na lojinha… pra pessoa ter save novo. 9,99").
            Só no Pix novo (entrega sozinha) e só logado: a ficha é da CONTA. */}
        {pixMp && email && (fichasPode > 0 || fichasTem > 0) && <>
          <h2 style={h2}>{tr('💾 Ficha de carreira', '💾 Career slot')} <span style={sub}>{tr('mais uma carreira salva', 'one more saved career')}</span></h2>
          <div style={{ ...card, display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 30 }}>💾</span>
            <small style={{ flex: 1, fontSize: 11.5, fontWeight: 700, lineHeight: 1.35 }}>
              {tr('+1 carreira salva, além das do seu plano. Começa um clube novo sem apagar nenhum. É sua pra sempre.', '+1 saved career on top of your plan’s. Start a new club without deleting any. Yours forever.')}
              {fichasTem > 0 && <b style={{ display: 'block', color: GREEN, marginTop: 3 }}>{tr(`Você já tem ${fichasTem} ficha${fichasTem > 1 ? 's' : ''} extra${fichasTem > 1 ? 's' : ''}.`, `You already have ${fichasTem} extra slot${fichasTem > 1 ? 's' : ''}.`)}</b>}
              {fichasPode <= 0 && <span style={{ display: 'block', color: 'rgba(12,12,12,.55)', marginTop: 3 }}>{tr('Você chegou no máximo de carreiras que o jogo guarda.', 'You’ve reached the most careers the game can keep.')}</span>}
            </small>
            {fichasPode > 0 && <button onClick={() => setComprando({ id: 'ficha', amount: FICHA_EXTRA_PRECO, ctx: 'loja · ficha extra de carreira', msgPt: `Opa! Comprei na Loja do Clube: 💾 FICHA EXTRA DE CARREIRA (${reais(FICHA_EXTRA_PRECO)}).`, msgEn: `Hey! I bought in the Club Shop: 💾 EXTRA CAREER SLOT (${reais(FICHA_EXTRA_PRECO)}).` })} style={preco}>{reais(FICHA_EXTRA_PRECO)}</button>}
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
        <h2 style={h2}>{tr('🏦 Moedas pro clube', '🏦 Coins for your club')} <span style={sub}>{pixMp ? (naCarr ? tr('caem direto neste clube', 'straight into this club') : tr('carreira solo', 'solo career')) : tr('Banco Legends · carreira solo', 'Banco Legends · solo career')}</span></h2>
        <p style={{ fontSize: 12, fontWeight: 700, margin: '0 2px 8px', lineHeight: 1.4 }}>{tr('🏟️ Pra CARREIRA SOLO: cada R$ 1 vira 3 🪙 no caixa do seu clube. Use pra dar lance no leilão, pagar salário e fazer obra no estádio.', '🏟️ For the SOLO CAREER: every R$ 1 becomes 3 🪙 in your club’s till. Use them to bid at the auction, pay wages and build at the stadium.')}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {MOEDAS.map(([r, pt, en], i) => <div key={r} style={{ ...card, textAlign: 'center', background: i === 1 ? '#FFF3C4' : '#fff', padding: 8 }}>
            {/* 18/10, Diego: "pague 10 e ganhe 30… mais claro" — o card fala a conta inteira */}
            <small style={{ ...OSW, fontSize: 11, fontWeight: 800, letterSpacing: '.04em', display: 'block' }}>{tr('PAGUE', 'PAY')}</small>
            <b style={{ ...OSW, fontSize: 16, display: 'block', whiteSpace: 'nowrap' }}>{reais(r)}</b>
            <div style={{ fontSize: 13, lineHeight: 1, margin: '2px 0', color: 'rgba(12,12,12,.45)' }}>▼</div>
            <small style={{ ...OSW, fontSize: 11, fontWeight: 800, color: GREEN, display: 'block', letterSpacing: '.04em' }}>{tr('GANHE', 'GET')}</small>
            <b style={{ ...OSW, fontSize: 24, display: 'block', color: GREEN, lineHeight: 1.25, whiteSpace: 'nowrap' }}>{r * 3} 🪙</b>
            <small style={{ fontSize: 10, fontWeight: 700, color: 'rgba(12,12,12,.6)', display: 'block', minHeight: 26, marginTop: 2 }}>{tr(pt, en)}</small>
            <button onClick={() => setComprando({ id: `moedas-${r}`, amount: r, ctx: `loja · banco legends ${r * 3} moedas`, msgPt: `Opa! Comprei na Loja do Clube: 🏦 ${r * 3} MOEDAS (${reais(r)}). E-mail da conta: ____ — comprovante em anexo!`, msgEn: `Hey! I bought in the Club Shop: 🏦 ${r * 3} COINS (${reais(r)}). Account e-mail: ____ — receipt attached!` })} style={{ ...preco, width: '100%', marginTop: 6 }}>{tr('COMPRAR', 'BUY')}</button>
          </div>)}
        </div>
        {pixMp ? <p style={{ fontSize: 11, fontWeight: 700, margin: '8px 2px 0', color: 'rgba(12,12,12,.6)', lineHeight: 1.4 }}>{naCarr
          ? tr('Pagou o Pix, as moedas caem na hora no caixa desta carreira. Vale só na carreira solo.', 'Pay the Pix and the coins land right away in this career’s till. Solo career only.')
          : tr('Depois de pagar, você escolhe em qual carreira elas caem. Vale só na carreira solo.', 'After paying, you choose which career they go to. Solo career only.')}</p>
          : <p style={{ fontSize: 11, fontWeight: 700, margin: '8px 2px 0', color: 'rgba(12,12,12,.6)', lineHeight: 1.4 }}>{tr('Você recebe uma FICHA e resgata na carreira que quiser, quando quiser: Clube › Finanças › 🏦 Banco Legends. Moeda vale só na carreira solo (não entra em sala online nem em liga dos amigos).', 'You get a VOUCHER and redeem it in whichever career you like, whenever you like: Club › Finances › 🏦 Banco Legends. Coins only work in the solo career (not in online rooms or friends’ leagues).')}</p>}
        {naCarr && <ResgateFicha />}

        {/* 🎨 TEMA DA SALA (18/10, Diego): ❤️ time de coração pra qualquer um · 🛡️ do clube só Batismo/Fundador · Fundador ganha 1 */}
        {pixMp && <TemasNaLoja temBatismo={temBatismo} fundador={atual === 'fundador'} h2={h2} sub={sub} card={card} preco={preco} reais={reais} />}

        {/* 💬 SEU RECADO NO JOGO (18/10, Diego: "tipo um super chat… com cor diferente"; mockup `recado-destaque.png`): o jogador
            escreve um recado que gira no letreiro, em rosa, com o nome do time — 1 hora R$ 2,99 ou o dia todo R$ 9,90 */}
        {pixMp && <>
          <h2 id="loja-recado" style={h2}>{tr('💬 Seu recado no jogo', '💬 Your shout-out in the game')}</h2>
          <div style={{ ...card }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 30 }}>💬</span>
              <div style={{ flex: 1 }}>
                <b style={{ ...OSW, fontSize: 17, textTransform: 'uppercase', display: 'block' }}>{tr('Super Chat', 'Super Chat')}</b>
                <small style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.3, display: 'block' }}>{tr('Escreva um recado (até 60 letras) e ele gira no letreiro de todas as salas, na cor de recado e com o nome do seu time. Zoeira, parabéns, convite pro pregão…', 'Write a shout-out (up to 60 characters) and it runs on the ticker in every room, in the shout-out colour and with your team name. Banter, congrats, an invite to the auction…')}</small>
              </div>
            </div>
            <div style={{ marginTop: 10 }}><GiroDaRodada exemplos={EX_RECADO} mb={0} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
              <button onClick={() => setComprando({ id: 'recado-hora', amount: 2.99, ctx: 'loja · recado 1h', msgPt: 'Opa! Comprei o 💬 RECADO (1 h). Meu recado: ____', msgEn: 'Hey! I bought the 💬 SHOUT-OUT (1 h). My message: ____' })} style={{ ...preco, background: '#FF5FA2', padding: '6px 8px' }}>
                <small style={{ display: 'block', fontSize: 10, letterSpacing: '.06em' }}>{tr('1 HORA', '1 HOUR')}</small>{reais(2.99)}</button>
              <button onClick={() => setComprando({ id: 'recado-dia', amount: 9.9, ctx: 'loja · recado dia todo', msgPt: 'Opa! Comprei o 💬 RECADO (dia todo). Meu recado: ____', msgEn: 'Hey! I bought the 💬 SHOUT-OUT (all day). My message: ____' })} style={{ ...preco, background: '#FF5FA2', padding: '6px 8px', outline: `3px solid ${GOLD}`, outlineOffset: -5 }}>
                <small style={{ display: 'block', fontSize: 10, letterSpacing: '.06em' }}>{tr('DIA TODO · 24 H', 'ALL DAY · 24 H')}</small>{reais(9.9)}</button>
            </div>
          </div>
          <AnunciosPendentes />
        </>}

        {/* 💼 SUA MARCA NO JOGO (16/10, Diego): ⚡ Dia da marca pago no Pix (depois chama o Diego) · 📅 mensal SEM preço, só o que
            vem no pacote e o contato. Começa só nas contas do Diego (`patrocinioLojaOk`). */}
        {patrocinioLojaOk() && <>
          <h2 id="loja-marca" style={h2}>{tr('💼 Sua marca no jogo', '💼 Your brand in the game')} <span style={sub}>{tr('pra empresas', 'for businesses')}</span></h2>
          <div style={{ ...card, display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 30 }}>⚡</span>
            <div style={{ flex: 1 }}>
              <b style={{ ...OSW, fontSize: 17, textTransform: 'uppercase', display: 'block' }}>{tr('Dia da marca', 'Brand day')}</b>
              <small style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.3, display: 'block' }}>{tr('Por 24 horas (contando de quando entra no ar) sua marca leva os naming rights da Copa dos 8 ("Copa dos 8 apresentada por…"), ganha o destaque da home, com bio e cupom, e passa no LED do estádio. Vem junto um post no Instagram e um aviso na comunidade dos fãs. Depois do Pix, você combina o dia com o Diego.', 'For 24 hours (from the moment it goes live) your brand gets the Copa dos 8 naming rights ("Copa dos 8 presented by…"), the home spotlight, with bio and coupon, and runs on the stadium LED. It also comes with an Instagram post and an announcement in the fans’ community. After the Pix, you set the day with Diego.')}</small>
            </div>
            <button onClick={() => setComprando({ id: 'dia-marca', amount: 50, ctx: 'loja · dia da marca', msgPt: 'Opa! Comprei o ⚡ DIA DA MARCA (R$ 50). Minha marca: ____', msgEn: 'Hey! I bought the ⚡ BRAND DAY (R$ 50). My brand: ____' })} style={preco}>{reais(50)}</button>
          </div>
          {/* 📣 ANÚNCIO NO GIRO, 1 DIA (16/10, Diego: "por 25 na lojinha embaixo do anúncio do dia de 50"; o "Anuncie aqui" do giro
              abre a Loja nesta seção) */}
          {/* 📣 18/10 (Diego: "tanto empresa também 1h ou dia todo"): o anúncio ganha o de 1 hora por R$ 4,99 */}
          <div style={{ ...card, marginTop: 8 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 30 }}>📣</span>
              <div style={{ flex: 1 }}>
                <b style={{ ...OSW, fontSize: 17, textTransform: 'uppercase', display: 'block' }}>{tr('Anúncio do dia', 'Ad of the day')}</b>
                <small style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.3, display: 'block' }}>{tr('Você mesmo escreve (até 82 letras) logo depois do Pix. Ele entra no ar na hora no letreiro "Anúncio do dia" de todas as salas, revezando com os outros anúncios. Ex.: "Sua marca · Oferta do dia: …".', 'You write it yourself (up to 82 characters) right after the Pix. It goes live right away on the "Ad of the day" ticker in every room, taking turns with the other ads. E.g. "Your brand · Deal of the day: …".')}</small>
              </div>
            </div>
            <div style={{ marginTop: 10 }}><GiroDaRodada exemplos={EX_EMPRESA} mb={0} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
              <button onClick={() => setComprando({ id: 'giro-hora', amount: 4.99, ctx: 'loja · anúncio 1h', msgPt: 'Opa! Comprei o 📣 ANÚNCIO (1 h). Meu texto: ____', msgEn: 'Hey! I bought the 📣 AD (1 h). My text: ____' })} style={{ ...preco, padding: '6px 8px' }}>
                <small style={{ display: 'block', fontSize: 10, letterSpacing: '.06em' }}>{tr('1 HORA', '1 HOUR')}</small>{reais(4.99)}</button>
              <button onClick={() => setComprando({ id: 'giro-dia', amount: 25, ctx: 'loja · anúncio no giro', msgPt: 'Opa! Comprei o 📣 ANÚNCIO NO GIRO (R$ 25). Meu texto: ____', msgEn: 'Hey! I bought the 📣 TICKER AD (R$ 25). My text: ____' })} style={{ ...preco, padding: '6px 8px', outline: `3px solid ${GOLD}`, outlineOffset: -5 }}>
                <small style={{ display: 'block', fontSize: 10, letterSpacing: '.06em' }}>{tr('DIA TODO · 24 H', 'ALL DAY · 24 H')}</small>{reais(25)}</button>
            </div>
          </div>
          <MarcaMensal card={card} emailContato={EMAIL_CONTATO} />{/* 📅 18/10: números fortes + fotos de onde a marca aparece (marca-mensal.tsx) */}
        </>}

        {/* 💳 COMO PAGAR (o item escolhido) */}
        {comprando && <div id="loja-pagar" style={{ ...card, marginTop: 18, background: '#FFF8E1' }}>
          <p style={{ ...OSW, fontSize: 16, textTransform: 'uppercase', margin: '0 0 8px' }}>{tr('💳 Pagar', '💳 Pay')} · {reais(comprando.amount)}</p>
          {/* 💳 15/10: as salas extras já vão pelo Pix do Mercado Pago (só na conta do Diego por enquanto); o resto segue no Pix antigo */}
          {pixMp && produtoMp(comprando.id) ? <PixMP key={comprando.id} produto={produtoMp(comprando.id)!} valor={comprando.amount} aoReceberFicha={naCarr && comprando.id.startsWith('moedas-') ? creditaFicha : undefined} /> : <>
          <PixBox ctx={comprando.ctx} amount={comprando.amount} />
          <button onClick={async () => { logApoio(`🛒 mandou comprovante · ${comprando.ctx}`); try { await navigator.clipboard.writeText(tr(comprando.msgPt, comprando.msgEn)) } catch { /* segue */ } window.open(APOIO_IG, '_blank', 'noopener') }}
            style={{ width: '100%', marginTop: 10, ...OSW, fontSize: 14, background: '#E1306C', color: '#fff', border: `3px solid ${INK}`, borderRadius: 12, boxShadow: `3px 3px 0 ${INK}`, padding: 10, cursor: 'pointer' }}>{tr('📸 MANDAR COMPROVANTE NO @leilaolegendscom', '📸 SEND THE RECEIPT TO @leilaolegendscom')}</button>
          <p style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(12,12,12,.55)', textAlign: 'center', margin: '6px 0 0' }}>{tr('a mensagem já vai copiada · liberamos em até 24h no e-mail da sua conta', 'the message is already copied · we unlock it within 24h on your account e-mail')}</p>
          </>}
          <p style={{ textAlign: 'center', margin: '8px 0 0' }}><button onClick={() => setComprando(null)} style={{ background: 'none', border: 'none', textDecoration: 'underline', fontWeight: 900, fontSize: 11, color: 'rgba(12,12,12,.5)', cursor: 'pointer' }}>{tr('cancelar', 'cancel')}</button></p>
        </div>}
        <p style={{ textAlign: 'center', marginTop: 18 }}><button onClick={onClose} style={{ background: 'none', border: 'none', textDecoration: 'underline', fontWeight: 900, fontSize: 12, color: 'rgba(12,12,12,.5)', cursor: 'pointer' }}>{tr('fechar', 'close')}</button></p>
      </div>
    </div>,
    document.body,
  )
}
