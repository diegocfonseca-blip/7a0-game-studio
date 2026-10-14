// ─── 🎁 DAR DE PRESENTE (14/10, Diego: "por agora só o presente, e presente apenas de plano") ─────────────────────
// Mockup aprovado: `scripts/mockup-loja-itens.mjs` (tela 1). Só PLANOS: ⭐ Craque · 👑 Lenda · 🖋 Batismo · 🖋 Fundador.
//
// 🔒 Segurança (ordens do Diego, valem pra todo pagamento): o pedido NÃO libera nada. O jogo só guarda "Fulano quer dar
// Craque pro e-mail X" (`esc_pedir_presente`, que confere no servidor: conta do amigo existe, ele ainda não tem esse plano,
// não é pra si mesmo). Quem paga manda o comprovante; o Diego confere e ENTREGA no #admin. Só aí o amigo vê o
// "FULANO TE DEU UM PRESENTE!" (`esc_meus_presentes`) — e o plano já está ligado quando ele aperta ABRIR.
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'
import { tr, getLang } from './lang'
import { logApoio, recarregaDireitos, loggedEmail, APOIO_PERKS, ApoioSheen } from './apoio'
import { PRECOS_UNICO, precoTxt, type PlanoUnico } from './planos-regras'
import { PixBox, APOIO_IG } from './screens'

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', CREAM = '#F4ECD6'
const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 700 } as const
const NOME: Record<PlanoUnico, [string, string]> = { craque: ['⭐ Craque', '⭐ Star'], lenda: ['👑 Lenda', '👑 Legend'], batismo: ['🖋 Batismo', '🖋 Club Naming'], fundador: ['🖋 Fundador', '🖋 Founder'] }
const FUNDO: Record<PlanoUnico, string> = { craque: APOIO_PERKS.prata.grad, lenda: APOIO_PERKS.ouro.grad, batismo: INK, fundador: 'linear-gradient(135deg,#14251a,#1B7A3D)' }
const ERROS: Record<string, [string, string]> = {
  SEM_LOGIN: ['Entre na sua conta pra dar presente.', 'Sign in to send a gift.'],
  EMAIL_INVALIDO: ['Esse e-mail não parece certo. Confere a escrita.', 'That e-mail doesn’t look right. Check the spelling.'],
  PRA_SI_MESMO: ['Presente é pra amigo 😄 Pra você mesmo, use "Sobe de plano".', 'Gifts are for friends 😄 For yourself, use "Move up a plan".'],
  SEM_CONTA: ['Não achamos conta com esse e-mail. Peça pro seu amigo criar a conta no jogo primeiro.', 'No account with that e-mail. Ask your friend to create a game account first.'],
  JA_TEM: ['Seu amigo já tem esse plano (ou um maior). Escolha um plano acima do dele.', 'Your friend already has this plan (or a higher one). Pick a plan above theirs.'],
  MUITOS_PEDIDOS: ['Você já tem 5 presentes esperando pagamento. Termine esses primeiro.', 'You already have 5 gifts waiting for payment. Finish those first.'],
}
const erroTxt = (msg: string) => { const k = Object.keys(ERROS).find(e => msg.includes(e)); return k ? tr(ERROS[k][0], ERROS[k][1]) : tr('Não deu pra registrar agora. Tenta de novo.', 'Couldn’t register it now. Try again.') }

/** a caixa "🎁 Dar de presente" dentro da Loja do Clube */
export function PresenteBox() {
  const reais = (v: number) => precoTxt(v, getLang() === 'en')
  const [plano, setPlano] = useState<PlanoUnico>('craque')
  const [para, setPara] = useState('')
  const [nome, setNome] = useState('')
  const [recado, setRecado] = useState('')
  const [busy, setBusy] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [pedido, setPedido] = useState<number | null>(null)
  const logado = !!loggedEmail()
  const inp: React.CSSProperties = { width: '100%', border: `3px solid ${INK}`, borderRadius: 10, padding: '8px 10px', fontSize: 13, fontWeight: 700, background: '#fff', fontFamily: 'Arial, sans-serif' }
  const rot: React.CSSProperties = { ...OSW, fontSize: 11, letterSpacing: '.1em', color: 'rgba(12,12,12,.6)', margin: '10px 0 5px' }
  const pedir = async () => {
    if (busy) return
    setBusy(true); setErro(null)
    const { data, error } = await supabase.rpc('esc_pedir_presente', { p_para: para.trim(), p_plano: plano, p_recado: recado.trim(), p_de_nome: nome.trim() })
    setBusy(false)
    if (error || typeof data !== 'number') { setErro(erroTxt(error?.message ?? '')); return }
    logApoio(`🎁 pediu presente nº${data}: ${plano} pra ${para.trim()}`)
    setPedido(data)
  }
  if (pedido) return <div style={{ background: '#FFF8E1', border: `3px solid ${INK}`, borderRadius: 14, boxShadow: `3px 3px 0 ${INK}`, padding: 12 }}>
    <p style={{ ...OSW, fontSize: 16, textTransform: 'uppercase', margin: '0 0 4px' }}>{tr(`🎁 Presente nº ${pedido} registrado`, `🎁 Gift no. ${pedido} registered`)}</p>
    <p style={{ fontSize: 12, fontWeight: 700, margin: '0 0 10px', color: 'rgba(12,12,12,.7)' }}>{tr(`${NOME[plano][0]} pra ${para.trim()}. Agora é só pagar e mandar o comprovante — seu amigo recebe assim que a gente confirmar.`, `${NOME[plano][1]} for ${para.trim()}. Now just pay and send the receipt — your friend gets it as soon as we confirm.`)}</p>
    <PixBox ctx={`presente nº${pedido} · ${plano} pra ${para.trim()}`} amount={PRECOS_UNICO[plano]} />
    <button onClick={async () => { logApoio(`🎁 mandou comprovante do presente nº${pedido}`); try { await navigator.clipboard.writeText(tr(`Opa! Paguei o PRESENTE nº ${pedido}: ${NOME[plano][0]} (${reais(PRECOS_UNICO[plano])}) pra ${para.trim()}. Comprovante em anexo!`, `Hey! I paid GIFT no. ${pedido}: ${NOME[plano][1]} (${reais(PRECOS_UNICO[plano])}) for ${para.trim()}. Receipt attached!`)) } catch { /* segue */ } window.open(APOIO_IG, '_blank', 'noopener') }}
      style={{ width: '100%', marginTop: 10, ...OSW, fontSize: 14, background: '#E1306C', color: '#fff', border: `3px solid ${INK}`, borderRadius: 12, boxShadow: `3px 3px 0 ${INK}`, padding: 10, cursor: 'pointer' }}>{tr('📸 MANDAR COMPROVANTE NO @leilaolegendscom', '📸 SEND THE RECEIPT TO @leilaolegendscom')}</button>
    <p style={{ textAlign: 'center', margin: '8px 0 0' }}><button onClick={() => { setPedido(null); setPara(''); setRecado('') }} style={{ background: 'none', border: 'none', textDecoration: 'underline', fontWeight: 900, fontSize: 11, color: 'rgba(12,12,12,.5)', cursor: 'pointer' }}>{tr('dar outro presente', 'send another gift')}</button></p>
  </div>
  return <div style={{ background: '#fff', border: `3px solid ${INK}`, borderRadius: 14, boxShadow: `3px 3px 0 ${INK}`, padding: 12 }}>
    <p style={{ ...rot, marginTop: 0 }}>{tr('O QUE VAI DAR', 'WHAT YOU’LL GIVE')}</p>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
      {(Object.keys(NOME) as PlanoUnico[]).map(p => <button key={p} onClick={() => setPlano(p)} style={{ position: 'relative', overflow: 'hidden', ...OSW, fontSize: 13, border: `3px solid ${INK}`, borderRadius: 10, padding: '6px 4px', cursor: 'pointer', background: FUNDO[p], color: p === 'batismo' || p === 'fundador' ? GOLD : INK, boxShadow: plano === p ? `0 0 0 3px ${GOLD}, 2px 2px 0 ${INK}` : 'none', opacity: plano === p ? 1 : .7 }}>
        {(p === 'craque' || p === 'lenda') && <ApoioSheen holo={p === 'lenda' ? .75 : .5} />}
        <span style={{ position: 'relative' }}>{tr(NOME[p][0], NOME[p][1])}<br /><small style={{ fontSize: 11 }}>{reais(PRECOS_UNICO[p])}</small></span>
      </button>)}
    </div>
    {(plano === 'batismo' || plano === 'fundador') && <p style={{ fontSize: 11, fontWeight: 700, margin: '6px 0 0', color: '#7C3AED' }}>{tr('🖋 O clube é montado com o seu amigo: o Diego fala com ele pra combinar nome, escudo, mascote e manto.', '🖋 The club is built with your friend: Diego talks to them to sort out name, crest, mascot and kit.')}</p>}
    <p style={rot}>{tr('PRA QUEM (E-MAIL DA CONTA DO AMIGO)', 'TO WHOM (YOUR FRIEND’S ACCOUNT E-MAIL)')}</p>
    <input value={para} onChange={e => setPara(e.target.value)} placeholder="amigo@email.com" type="email" autoCapitalize="none" style={inp} />
    <p style={rot}>{tr('SEU NOME (APARECE PRO AMIGO)', 'YOUR NAME (SHOWN TO YOUR FRIEND)')}</p>
    <input value={nome} onChange={e => setNome(e.target.value)} maxLength={40} placeholder={tr('Ex.: Renaton', 'e.g. Renaton')} style={inp} />
    <p style={rot}>{tr('RECADO (OPCIONAL)', 'MESSAGE (OPTIONAL)')}</p>
    <input value={recado} onChange={e => setRecado(e.target.value)} maxLength={140} placeholder={tr('Agora não tem desculpa pra perder no envelope 😂', 'No more excuses for losing the envelope 😂')} style={inp} />
    {erro && <p style={{ fontSize: 12, fontWeight: 800, color: '#C2452F', margin: '8px 0 0' }}>{erro}</p>}
    <button disabled={!logado || busy || !para.trim()} onClick={pedir}
      style={{ width: '100%', marginTop: 12, ...OSW, fontSize: 16, textTransform: 'uppercase', background: GREEN, color: '#fff', border: `3px solid ${INK}`, borderRadius: 12, boxShadow: `3px 3px 0 ${INK}`, padding: 9, cursor: logado && para.trim() ? 'pointer' : 'not-allowed', opacity: logado && para.trim() ? 1 : .55 }}>
      {busy ? '…' : tr(`🎁 PRESENTEAR · ${reais(PRECOS_UNICO[plano])}`, `🎁 SEND GIFT · ${reais(PRECOS_UNICO[plano])}`)}</button>
    {!logado && <p style={{ fontSize: 11, fontWeight: 700, margin: '6px 0 0', textAlign: 'center', color: 'rgba(12,12,12,.6)' }}>{tr('Entre na sua conta pra dar presente.', 'Sign in to send a gift.')}</p>}
    <p style={{ fontSize: 10.5, fontWeight: 700, margin: '8px 0 0', color: 'rgba(12,12,12,.55)', lineHeight: 1.4 }}>{tr('Pagamento único, sem mensalidade. Seu amigo recebe quando a gente confirmar o pagamento.', 'One-off payment, no monthly fee. Your friend gets it once we confirm the payment.')}</p>
  </div>
}

/** 🎉 o aviso que o AMIGO vê ao entrar — só aparece depois que o Diego entregou */
export function PresenteRecebido() {
  const [fila, setFila] = useState<{ id: number; de_nome: string; plano: PlanoUnico; recado: string | null }[]>([])
  useEffect(() => {
    let vivo = true
    const olha = async () => {
      if (!loggedEmail()) return
      const { data } = await supabase.rpc('esc_meus_presentes')
      if (vivo && Array.isArray(data)) setFila(data as typeof fila)
    }
    const t = setTimeout(olha, 2500) // depois do login assentar; uma vez por abertura do jogo
    const { data: sub } = supabase.auth.onAuthStateChange((ev) => { if (ev === 'SIGNED_IN') setTimeout(olha, 1500) })
    return () => { vivo = false; clearTimeout(t); sub.subscription.unsubscribe() }
  }, [])
  const p = fila[0]
  if (!p) return null
  const abrir = async () => {
    await supabase.rpc('esc_presente_visto', { p_id: p.id })
    recarregaDireitos()
    setFila(f => f.slice(1))
  }
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 99998, background: 'rgba(12,12,12,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 380, background: '#14251a', color: CREAM, border: `3px solid ${INK}`, borderRadius: 18, boxShadow: `4px 4px 0 ${INK}`, padding: 18, textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ fontSize: 56, lineHeight: 1 }}>🎁</div>
        <b style={{ ...OSW, fontSize: 21, display: 'block', color: GOLD, textTransform: 'uppercase', marginTop: 6 }}>{tr(`${p.de_nome} te deu um presente!`, `${p.de_nome} sent you a gift!`)}</b>
        <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-block', marginTop: 10, ...OSW, fontSize: 16, color: p.plano === 'batismo' || p.plano === 'fundador' ? GOLD : INK, background: FUNDO[p.plano], border: `2px solid ${INK}`, borderRadius: 9, padding: '4px 12px' }}>
          {(p.plano === 'craque' || p.plano === 'lenda') && <ApoioSheen holo={p.plano === 'lenda' ? .75 : .5} />}
          <span style={{ position: 'relative' }}>{tr(NOME[p.plano][0], NOME[p.plano][1]).toUpperCase()}</span>
        </div>
        {p.recado && <p style={{ fontSize: 13, fontStyle: 'italic', margin: '10px 0 0', opacity: .92 }}>"{p.recado}"</p>}
        {(p.plano === 'batismo' || p.plano === 'fundador') && <p style={{ fontSize: 12, fontWeight: 700, margin: '10px 0 0', opacity: .85 }}>{tr('🖋 O Diego vai falar com você pra montar o seu clube.', '🖋 Diego will get in touch to build your club.')}</p>}
        <button onClick={abrir} style={{ width: '100%', marginTop: 14, ...OSW, fontSize: 18, background: GOLD, color: INK, border: `3px solid ${INK}`, borderRadius: 12, boxShadow: `3px 3px 0 ${INK}`, padding: 10, cursor: 'pointer' }}>{tr('ABRIR 🎉', 'OPEN 🎉')}</button>
      </div>
    </div>,
    document.body,
  )
}
