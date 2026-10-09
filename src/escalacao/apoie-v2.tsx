// ─── 💳 APOIAR · PLANOS V2 (08–09/10) — SÓ nas contas do Diego por enquanto ─────────
// Diego (09/10): *"publique só pro meu usuário pra eu ver como ficará"*. O `ApoieButton` de
// `screens.tsx` escolhe: quem está em `usePlanos2()` (sport.ts) cai AQUI; o resto do mundo segue no
// botão antigo, que não foi tocado. Liberar pra todos = PLANOS2_GERAL = true, e depois apagar o V1.
//
// Telas: escolha (os 4 planos) · ⭐ mensal (WhatsApp/Direct/cartão) · 🖋 batismo Lenda/Plus · ⏭ trava do
// Manual · 💛 só apoiar · 🎫 área do sócio (quem já é sócio). NADA aqui libera benefício: o plano só
// liga quando o Diego confirma o pagamento no Painel do Criador.
import { useEffect, useState } from 'react'
import type React from 'react'
import { supabase } from '../lib/supabase'
import { tr, getLang } from './lang'
import { stripEmoji, myApoioPerk, APOIO_PERKS, ApoioSheen, logApoio, useDireitos, recarregaDireitos } from './apoio'
import { useMeuSocio, souBarao } from './manto'
import { SupportFooter, SupportStory } from './support-plans'
import { SupportPlansV2, type SupportPlanKeyV2 as SupportPlanKey } from './support-plans-v2'
import { PRECOS, precoTxt, situacaoCraque, whatsappValido, type Direitos } from './planos-regras'
import { PixBox, ApoieModal, AreaSocioBody, APOIO_IG, MP_CRAQUE_CARTAO } from './screens'

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#E8503A'
const OSWALD = { fontFamily: 'Oswald, sans-serif' }
const L = (pt: React.ReactNode, en: React.ReactNode): React.ReactNode => (getLang() === 'en' ? en : pt)
let linkV2Consumido = false

// ⭐ CRAQUE MENSAL (planos v2, 08/10). A cobrança automática ainda não está montada, então o caminho é
// o do Diego: *"deixará o whatsapp dele… aí mando pra ele pelo WhatsApp o link do pagamento do mensal"*.
// A pessoa deixa o WhatsApp (fica guardado com a CONTA dela, `esc_pedir_craque`) ou chama no Direct.
// NADA é liberado aqui: o plano só liga quando o Diego confirma o pagamento no painel
// (`esc_admin_craque_pagamento`, com o ID do pagamento — repetido não conta duas vezes).
function CraqueMensal({ direitos, onDirect, onVoltar }: { direitos: Direitos | null; onDirect: (msg: string) => void; onVoltar: () => void }) {
  const en = getLang() === 'en'
  const [logado, setLogado] = useState<boolean | null>(null)
  const [zap, setZap] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [enviado, setEnviado] = useState(false)
  const [trocando, setTrocando] = useState(false)
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setLogado(!!data?.user), () => setLogado(false)) }, [])
  const sit = situacaoCraque(direitos)
  const ate = direitos?.craqueAte ? new Date(direitos.craqueAte).toLocaleDateString(en ? 'en-GB' : 'pt-BR') : ''
  const esperando = (enviado || !!direitos?.pedido) && !trocando
  const enviar = async () => {
    const num = whatsappValido(zap)
    if (!num) { setErro(tr('Confere o número: DDD + número, só os dígitos (ex.: 21 99999-0000).', 'Check the number: area code + number, digits only (e.g. 21 99999-0000).')); return }
    setEnviando(true); setErro(null)
    try {
      const { error } = await supabase.rpc('esc_pedir_craque', { p_whatsapp: num })
      if (error) throw error
      logApoio('⭐ deixou o WhatsApp pro mensal')
      setEnviado(true); setTrocando(false); recarregaDireitos()
    } catch { setErro(tr('Não deu pra enviar agora (sem conexão?). Tenta de novo ou chama no Direct aqui embaixo.', 'Couldn’t send it right now (no connection?). Try again or message us on Instagram below.')) }
    setEnviando(false)
  }
  const msgDirect = tr('Opa! Quero assinar o ⭐ CRAQUE COMPLETO (R$ 12,90/mês). Meu e-mail da conta: ____ · meu WhatsApp: ____', 'Hey! I want to subscribe to ⭐ FULL STAR (R$ 12.90/month). My account e-mail: ____ · my WhatsApp: ____')
  const passo = (n: string, t: React.ReactNode) => <div className="flex-1 bg-white rounded-xl px-1.5 py-1.5 text-center font-extrabold text-[9.5px] leading-tight" style={{ border: `2px solid ${INK}` }}><b className="block text-[13px]" style={OSWALD}>{n}</b>{t}</div>
  return (
    <div style={{ color: INK }}>
      <div className="relative overflow-hidden rounded-2xl px-3 py-2.5 flex items-center gap-2" style={{ background: APOIO_PERKS.ouro.grad, border: `3px solid ${INK}`, boxShadow: `4px 4px 0 ${INK}` }}>
        <ApoioSheen holo={.6} />
        <span className="relative font-black uppercase text-[20px] leading-none" style={OSWALD}>⭐ {tr('Craque completo', 'Full Star')}</span>
        <span className="relative ml-auto text-right">
          <b className="block font-black text-[24px] leading-none" style={OSWALD}>{precoTxt(PRECOS.craqueMensal, en)}</b>
          <small className="block font-extrabold text-[9px] uppercase tracking-wider opacity-80">{tr('por mês', 'per month')}</small>
        </span>
      </div>

      {sit === 'ativo' || sit === 'cancelado_no_prazo' ? (
        <div className="bg-white rounded-2xl mt-3 px-3 py-3 text-center" style={{ border: `3px solid ${INK}`, boxShadow: `4px 4px 0 ${INK}` }}>
          <p className="font-black uppercase text-[16px]" style={{ ...OSWALD, color: GREEN }}>{tr('✅ Seu Craque está ativo', '✅ Your Star is active')}</p>
          <p className="text-[12px] font-bold mt-1">{sit === 'ativo' ? (en ? `Valid until ${ate}. Diego sends the next payment link before that.` : `Vale até ${ate}. O Diego te manda o link do próximo mês antes disso.`) : (en ? `Cancelled — it keeps working until ${ate}.` : `Cancelado — continua valendo até ${ate}.`)}</p>
        </div>
      ) : esperando ? (
        <div className="bg-white rounded-2xl mt-3 px-3 py-3 text-center" style={{ border: `3px solid ${INK}`, boxShadow: `4px 4px 0 ${INK}` }}>
          <p className="font-black uppercase text-[16px]" style={{ ...OSWALD, color: GREEN }}>{tr('📲 Pedido enviado!', '📲 Request sent!')}</p>
          <p className="text-[12px] font-bold mt-1 leading-snug">{tr('O Diego vai te mandar o link de pagamento no WhatsApp. Pagou, ele libera o Craque na sua conta (em até 24h).', 'Diego will send you the payment link on WhatsApp. Once you pay, he unlocks Star on your account (within 24h).')}</p>
          <button onClick={() => { setEnviado(false); setTrocando(true) }} className="text-[10.5px] font-black underline text-black/45 mt-2">{tr('trocar o número', 'change the number')}</button>
        </div>
      ) : (
        <>
          {sit === 'vencido' && <p className="text-[11.5px] font-bold mt-3 leading-snug text-center" style={{ color: 'rgba(12,12,12,.7)' }}>{tr('Seu Craque venceu. Tudo o que você jogou continua guardado — é só renovar pra voltar o ritmo, o nível e as suas salas.', 'Your Star lapsed. Everything you played is still stored — just renew to get the pace, levels and your rooms back.')}</p>}
          <p className="font-black uppercase text-[12px] tracking-wider mt-3.5" style={{ ...OSWALD, color: 'rgba(12,12,12,.6)' }}>{tr('📲 como assinar (por enquanto)', '📲 how to subscribe (for now)')}</p>
          <div className="flex gap-1.5 mt-1.5">
            {passo('1', tr('Pix: deixa seu WhatsApp aqui', 'Pix: leave your WhatsApp here'))}
            {passo('2', tr('o Diego te manda o link de pagamento', 'Diego sends you the payment link'))}
            {passo('3', tr('pagou, liberou na sua conta', 'paid, unlocked on your account'))}
          </div>
          {logado === false ? (
            <div className="bg-white rounded-2xl mt-3 px-3 py-3 text-center" style={{ border: `3px solid ${INK}` }}>
              <p className="text-[12px] font-bold leading-snug">{tr('🔑 Entre na sua conta primeiro: o plano fica preso no seu e-mail, pra não se perder.', '🔑 Log in first: the plan is tied to your e-mail so it never gets lost.')}</p>
            </div>
          ) : (
            <>
              <input value={zap} onChange={e => { setZap(e.target.value.replace(/[^0-9()+\-\s]/g, '')); setErro(null) }} inputMode="tel" maxLength={20} placeholder={tr('seu WhatsApp com DDD', 'your WhatsApp with area code')}
                className="w-full border-[3px] border-black rounded-xl px-3 py-2.5 mt-3 font-black text-base bg-white" style={OSWALD} />
              {erro && <p className="text-[10.5px] font-bold mt-1" style={{ color: RED }}>{erro}</p>}
              <button onClick={enviar} disabled={enviando || !zap.trim()}
                className="w-full rounded-xl border-[3px] border-black font-black text-[15px] py-3 mt-2 active:translate-y-0.5"
                style={{ background: zap.trim() ? GREEN : '#cfc8b5', color: '#fff', boxShadow: `4px 4px 0 0 ${INK}`, ...OSWALD }}>
                {enviando ? tr('ENVIANDO…', 'SENDING…') : tr('📲 QUERO RECEBER O LINK', '📲 SEND ME THE LINK')}
              </button>
            </>
          )}
        </>
      )}

      {MP_CRAQUE_CARTAO && sit !== 'ativo' && sit !== 'cancelado_no_prazo' && logado !== false && (
        <>
          {/* 💳 CARTÃO (09/10): o link de assinatura do Mercado Pago (aparece quando MP_CRAQUE_CARTAO tiver o link de R$ 12,90). O MP cobra
              todo mês sozinho; a liberação continua MANUAL (o Diego confirma no painel com o ID do pagamento). */}
          <button onClick={() => { logApoio('⭐ mensal → abriu o cartão (Mercado Pago)'); window.open(MP_CRAQUE_CARTAO!, '_blank', 'noopener') }}
            className="w-full rounded-xl border-[3px] border-black font-black text-[14px] py-2.5 mt-2.5 active:translate-y-0.5"
            style={{ background: '#009EE3', color: '#fff', boxShadow: `3px 3px 0 0 ${INK}`, ...OSWALD }}>
            {tr('💳 ASSINAR NO CARTÃO · MERCADO PAGO', '💳 SUBSCRIBE BY CARD · MERCADO PAGO')}
          </button>
          <p className="text-[10px] font-bold text-black/55 mt-1 leading-snug text-center">{tr('Use o MESMO e-mail da sua conta do jogo no Mercado Pago. O cartão é cobrado todo mês sozinho; o Craque liga quando o Diego confirmar (em até 24h).', 'Use the SAME e-mail as your game account on Mercado Pago. The card is charged monthly; Star turns on once Diego confirms (within 24h).')}</p>
        </>
      )}
      <button onClick={() => onDirect(msgDirect)} className="w-full rounded-xl border-[3px] border-black font-black text-[13px] py-2.5 mt-2.5 active:translate-y-0.5"
        style={{ background: '#E1306C', color: '#fff', boxShadow: `3px 3px 0 0 ${INK}`, ...OSWALD }}>
        {tr('📸 PREFIRO CHAMAR NO DIRECT', '📸 I’D RATHER MESSAGE ON INSTAGRAM')}
      </button>
      <p className="text-[10.5px] font-bold text-black/55 mt-3 leading-snug text-center">{tr('Nada é cobrado sozinho. Cancelou? Vale até o fim do mês pago. Se vencer, voltam as regras do gratuito — seus saves, ligas e histórico continuam guardados.', 'Nothing is charged automatically. Cancelled? It lasts until the end of the paid month. If it lapses, the free rules come back — your saves, leagues and history stay stored.')}</p>
      <p className="text-center mt-3"><button onClick={onVoltar} className="text-[11px] font-black underline text-black/45">{tr('← ver todos os planos', '← see all plans')}</button></p>
    </div>
  )
}
export function ApoieButtonV2({ big = false, startScreen = 'choice', trigger }: { big?: boolean; startScreen?: 'choice' | 'manual' | 'batismo'; trigger?: (open: () => void) => React.ReactNode }) {
  const [screen, setScreen] = useState<'off' | 'choice' | 'pix' | 'mensal' | 'batismo' | 'manual' | 'socio'>('off')
  const direitos = useDireitos() // 💳 planos v2: assinatura do Craque, batismo, pedido do mensal
  const meuSoc = useMeuSocio() // 🎫 sócio ativo vê a ÁREA dele no lugar da propaganda
  const openApoio = () => { if (startScreen === 'manual') logApoio('👀 abriu: modo manual (trava)'); setScreen(startScreen) }
  const [clube, setClube] = useState('')
  // 🖋 BATISMO (planos v2, 08/10): Lenda R$ 69,90 ou Plus R$ 79,99 — os dois já entram na Série A
  // (antes era a escolha de série, 59,90 × 69,90). Preços em planos-regras.ts.
  const [planoBatismo, setPlanoBatismo] = useState<'lenda' | 'plus'>('lenda')
  const precoCheioBatismo = planoBatismo === 'plus' ? PRECOS.batismoPlus : PRECOS.batismoLenda
  // 🎟️ CUPOM DE INFLUENCIADOR (Diego 07/09): "PANTERA" = 10% off SÓ no batismo.
  // O código é conferido no banco (esc_cupom_validar) — nenhum cupom vive no
  // código do jogo, então ninguém descobre fuçando. O desconto entra no valor do
  // Pix copia-e-cola e na mensagem da DM; o uso é registrado (esc_cupom_usar) na
  // hora em que a pessoa aperta "chamar no @", pro relatório do influenciador.
  const [cupomTxt, setCupomTxt] = useState('')
  const [cupomAberto, setCupomAberto] = useState(false) // o linkzinho "tem cupom?" abriu o campo?
  const [cupom, setCupom] = useState<{ codigo: string; influenciador: string; desconto_pct: number } | null>(null)
  const [cupomMsg, setCupomMsg] = useState<string | null>(null)
  const [cupomBusy, setCupomBusy] = useState(false)
  const aplicarCupom = async () => {
    const cod = cupomTxt.trim().toUpperCase()
    if (!cod || cupomBusy) return
    setCupomBusy(true); setCupomMsg(null)
    try {
      const { data, error } = await supabase.rpc('esc_cupom_validar', { p_codigo: cod, p_plano: 'batismo' })
      const row = !error && Array.isArray(data) ? (data[0] as { codigo: string; influenciador: string; desconto_pct: number } | undefined) : undefined
      if (row) { setCupom(row); setCupomMsg(null); logApoio(`🎟️ cupom ${row.codigo} aplicado no batismo`) }
      else { setCupom(null); setCupomMsg(tr('Cupom não encontrado ou vencido. Confere a escrita 🧐', 'Coupon not found or expired. Double-check the spelling 🧐')); logApoio(`🎟️ cupom "${cod}" recusado`) }
    } catch { setCupom(null); setCupomMsg(tr('Sem conexão pra conferir o cupom — tenta de novo.', 'No connection to check the coupon — try again.')) }
    setCupomBusy(false)
  }
  const precoBatismo = cupom ? Math.round(precoCheioBatismo * (100 - cupom.desconto_pct)) / 100 : precoCheioBatismo
  // 🎯 alvo do LINK DIRETO (?apoie=lenda). Antes isto era a sanfona aberta; agora
  // que tudo fica à vista (23/08), ele só rola até o card e acende um brilho.
  const [amp, setAmp] = useState<null | SupportPlanKey>(null)
  const [meuNome, setMeuNome] = useState('') // nome da conta, pra simular na cor com o nome REAL da pessoa
  useEffect(() => {
    if (screen !== 'choice' || meuNome) return
    supabase.auth.getUser().then(({ data }) => { const dn = ((data?.user?.user_metadata?.display_name as string) ?? '').trim(); if (dn) setMeuNome(dn) }).catch(() => { /* deslogado: usa "Seu Nome" */ })
  }, [screen, meuNome])
  const close = () => { setScreen('off'); setAmp(null) }
  useEffect(() => {
    if (linkV2Consumido) return
    const a = new URLSearchParams(window.location.search).get('apoie')
    if (!a) return
    linkV2Consumido = true
    logApoio(`🔗 chegou pelo link direto: apoie=${a}`)
    if (a === 'lenda') { setScreen('choice'); setAmp('ouro') }
    else if (a === 'nuvem') { setScreen('choice'); setAmp('prata') } // ☁️⭐ 07/10: botão da nuvem → TODOS os planos, acendendo o Craque
    else if (a === 'craque' || a === 'manual') setScreen('manual')
    else setScreen('choice')
  }, [])
  const igMsg = async (msg: string) => {
    try { await navigator.clipboard.writeText(msg) } catch { /* segue o baile */ }
    window.open(APOIO_IG, '_blank', 'noopener')
  }
  return (
    <>
      {trigger ? trigger(openApoio) : big ? (
        <SupportFooter onOpen={openApoio} />
      ) : (
        <button onClick={openApoio} className="text-xs font-black rounded-full px-3 py-1 border-2 border-black" style={{ background: 'linear-gradient(150deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)', color: INK, boxShadow: `2px 2px 0 0 ${INK}`, ...OSWALD }}>
          {tr('💛 Apoie o projeto (Pix)', '💛 Support the project (Pix)')}
        </button>
      )}

      {screen === 'choice' && <ApoieModal onClose={close}>
        <SupportPlansV2 focus={amp} tier={myApoioPerk()?.tier} name={meuNome} memberActive={!!meuSoc?.ativo}
          craque={situacaoCraque(direitos)} craqueAte={direitos?.craqueAte} pedidoAberto={!!direitos?.pedido} batismoPlano={direitos?.batismoPlano ?? (souBarao() ? 'antigo' : null)}
          onCraque={() => { logApoio('⭐ abriu o Craque mensal'); setScreen('mensal') }}
          onNaming={plano => { logApoio(`🖋 escolheu batismo ${plano}`); setPlanoBatismo(plano); setScreen('batismo') }}
          onMember={() => setScreen('socio')}
          onDonate={() => setScreen('pix')}
          onInstagram={() => window.open(APOIO_IG, '_blank', 'noopener')} />
      </ApoieModal>}

      {screen === 'socio' && (
        <ApoieModal onClose={close}>
          <AreaSocioBody socioN={meuSoc?.socioN ?? null} />
          <p className="text-center mt-3"><button onClick={() => setScreen('choice')} className="text-[11px] font-black underline text-black/45">{tr('← voltar pros apoios', '← back to the packages')}</button></p>
        </ApoieModal>
      )}

      {screen === 'pix' && (
        <ApoieModal onClose={close}>
          <p className="font-black text-2xl text-center" style={OSWALD}>{tr('💛 Valeu por apoiar!', '💛 Thanks for the support!')}</p>
          <p className="text-[13px] font-bold text-black/70 mt-2 leading-snug text-center">
            {tr('Qualquer valor ajuda a pagar o servidor e a manter tudo de graça pra geral. 🔨', 'Any amount helps pay the server and keep everything free for everyone. 🔨')}
          </p>
          <div className="mt-3.5"><PixBox label="copiar chave Pix" ctx="só apoiar" /></div>
          <p className="text-[11px] font-bold text-black/45 mt-3 text-center">{tr('Cola no app do teu banco e pronto. Qualquer valor vira mais jogo. 💛', 'Paste it in your bank app and that\'s it. Any amount turns into more game. 💛')}</p>
        </ApoieModal>
      )}

      {screen === 'manual' && <ApoieModal onClose={close}>
        {/* ⏭ A TRAVA DO MODO MANUAL — redesenhada em 29/09 (mockup aprovado pelo Diego).
            É por aqui que quase todo mundo chega (1.422 pessoas em 30 dias bateram no ⏭ da
            carreira, e só 49 copiaram o Pix). Regra dele: curta — a prévia dos controles, o
            NÍVEL aparecendo, o preço e um botão. Nada de "nota"/"overall": é NÍVEL. */}
        <div style={{ color: INK }}>
          <p className="font-black leading-[.95] uppercase" style={{ ...OSWALD, fontSize: 30 }}>
            {tr('Quer acelerar?', 'Want to speed up?')}<br /><span style={{ color: GREEN }}>{tr('Isso é do Craque.', 'That’s a Star thing.')}</span>
          </p>
          <p className="text-[12.5px] font-bold leading-snug mt-1.5" style={{ color: 'rgba(12,12,12,.7)' }}>
            {L(<>Pause, acelere, pule a rodada — <b>a carreira no seu ritmo</b>. E ainda vê o nível dos seus jogadores.</>,
               <>Pause, speed up, skip the round — <b>Career at your pace</b>. And you see your players’ level too.</>)}
          </p>

          {/* 🎮 os controles */}
          <div className="bg-white rounded-2xl mt-3 px-3 py-2.5" style={{ border: `3px solid ${INK}`, boxShadow: `4px 4px 0 ${INK}` }}>
            <p className="font-black uppercase text-[10px] tracking-widest mb-2" style={{ ...OSWALD, color: 'rgba(12,12,12,.55)' }}>{tr('🎮 os controles que ficam seus', '🎮 the controls you unlock')}</p>
            <div className="flex flex-wrap gap-1.5 items-center">
              {['¼×', '½×', tr('Normal', 'Normal'), '2×', '4×'].map((v, i) => (
                <span key={v} className="font-black text-[12px] rounded-lg px-2 py-1" style={{ ...OSWALD, border: `2.5px solid ${INK}`, background: i === 3 ? INK : '#fff', color: i === 3 ? '#fff' : INK, boxShadow: i === 3 ? 'none' : `2px 2px 0 ${INK}` }}>{v}</span>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[tr('⏸ PAUSAR', '⏸ PAUSE'), tr('⏭ PULAR RODADA', '⏭ SKIP ROUND'), tr('▶ PRÓXIMA', '▶ NEXT')].map(v => (
                <span key={v} className="font-black text-[12px] rounded-lg px-2 py-1 bg-white" style={{ ...OSWALD, border: `2.5px solid ${INK}`, boxShadow: `2px 2px 0 ${INK}` }}>{v}</span>
              ))}
            </div>
            <p className="text-[10.5px] font-bold mt-2" style={{ color: 'rgba(12,12,12,.6)' }}>{tr('👆 no 2× a rodada inteira passa em segundos. No ⏭ ela pula.', '👆 at 2× the whole round goes by in seconds. With ⏭ it skips.')}</p>
          </div>

          {/* 🔎 o nível aparece: a mesma carta, hoje × com o Craque */}
          <div className="bg-white rounded-2xl mt-3 px-3 py-2.5" style={{ border: `3px solid ${INK}`, boxShadow: `4px 4px 0 ${INK}` }}>
            <p className="font-black uppercase text-[10px] tracking-widest mb-2" style={{ ...OSWALD, color: 'rgba(12,12,12,.55)' }}>{tr('🔎 o nível do jogador aparece — até Lenda', '🔎 the player’s level shows — up to Legend')}</p>
            <div className="flex items-center justify-center gap-2.5">
              {([['hoje', 'today', false], ['com o Craque', 'with Star', true]] as const).map(([pt, en, on]) => (
                <div key={pt} className="text-center">
                  <div className="relative overflow-hidden rounded-[10px] px-1.5 py-1.5 text-left" style={{ width: 86, background: on ? APOIO_PERKS.ouro.grad : APOIO_PERKS.bege.grad, border: `2.5px solid ${INK}`, boxShadow: `3px 3px 0 ${INK}`, opacity: on ? 1 : .85 }}>
                    {on && <ApoioSheen holo={.6} />}
                    <span className="relative font-black rounded text-[8px] px-1.5" style={{ ...OSWALD, background: INK, color: '#fff' }}>MEI</span>
                    <div className="relative rounded-full mx-auto my-1.5 flex items-center justify-center font-black text-[14px]" style={{ width: 30, height: 30, background: 'rgba(255,255,255,.5)', border: '2px solid rgba(0,0,0,.28)', ...OSWALD }}>Z</div>
                    <p className="relative font-black text-[10.5px] leading-tight" style={OSWALD}>Zé Craque</p>
                    <p className="relative flex items-center gap-1 mt-0.5">
                      <span className="font-black text-[15px] bg-white rounded-md px-1" style={{ ...OSWALD, border: `2px solid ${INK}`, color: on ? INK : 'rgba(0,0,0,.35)' }}>{on ? '82' : '??'}</span>
                      <span className="text-[7.5px] font-black leading-none opacity-70">{tr('NÍVEL', 'LEVEL')}</span>
                    </p>
                  </div>
                  <p className="text-[9px] font-black mt-1" style={{ color: on ? GREEN : 'rgba(12,12,12,.5)' }}>{tr(pt, en)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ⭐ e vem junto */}
          <div className="bg-white rounded-2xl mt-3 px-3 py-2.5" style={{ border: `3px solid ${INK}`, boxShadow: `4px 4px 0 ${INK}` }}>
            <p className="font-black uppercase text-[10px] tracking-widest mb-2" style={{ ...OSWALD, color: 'rgba(12,12,12,.55)' }}>{tr('⭐ e vem junto', '⭐ also included')}</p>
            <div className="flex flex-wrap gap-1.5">
              {[tr('✨ nome dourado brilhando nas salas', '✨ shining gold name in the rooms'), tr('🕵️ Olheiro: acha jogador fora do leilão (até Lenda)', '🕵️ Scout: find players outside the auction (up to Legend)'), tr('💾 4 carreiras salvas', '💾 4 saved careers'), tr('🏆 cria salas e Minhas Ligas', '🏆 create rooms and My Leagues'), tr('📲 grupo VIP no WhatsApp com o Diego', '📲 VIP WhatsApp group with Diego')].map(t => (
                <span key={t} className="font-extrabold text-[10.5px] rounded-full px-2.5 py-1" style={{ border: `2px solid ${INK}`, background: '#F4ECD6' }}>{t}</span>
              ))}
            </div>
          </div>

          {/* 💰 preço + o botão (planos v2, 08/10: Craque completo mensal) */}
          <div className="relative overflow-hidden rounded-2xl mt-3.5 px-3 py-2.5 flex items-center gap-2" style={{ background: APOIO_PERKS.ouro.grad, border: `3px solid ${INK}`, boxShadow: `4px 4px 0 ${INK}` }}>
            <ApoioSheen holo={.6} />
            <span className="relative font-black uppercase text-[20px] leading-none" style={OSWALD}>⭐ {tr('Craque completo', 'Full Star')}</span>
            <span className="relative ml-auto text-right">
              <b className="block font-black text-[24px] leading-none" style={OSWALD}>{precoTxt(PRECOS.craqueMensal, getLang() === 'en')}</b>
              <small className="block font-extrabold text-[9px] uppercase tracking-wider opacity-80">{tr('por mês · cancela quando quiser', 'per month · cancel anytime')}</small>
            </span>
          </div>
          <button onClick={() => { logApoio('⭐ trava do manual → mensal'); setScreen('mensal') }}
            className="w-full rounded-xl border-[3px] border-black font-black text-[15px] py-3 mt-3 active:translate-y-0.5"
            style={{ background: GOLD, color: INK, boxShadow: `4px 4px 0 0 ${INK}`, ...OSWALD }}>
            {tr('⭐ QUERO O CRAQUE', '⭐ I WANT STAR')}
          </button>
          <p className="text-center text-[10px] font-bold mt-3 leading-relaxed" style={{ color: 'rgba(12,12,12,.5)' }}>{tr('Não muda a força de ninguém — só o ritmo e o que você enxerga. No online o tempo é igual pra todos.', 'It doesn’t change anyone’s strength — only the pace and what you see. Online, the clock is the same for everyone.')}</p>

          {/* 🖋 quer mais que isso? */}
          <p className="text-center font-black uppercase text-[11px] tracking-widest mt-3 mb-1.5" style={{ ...OSWALD, color: 'rgba(12,12,12,.55)' }}>{tr('prefere pagar uma vez só?', 'rather pay just once?')}</p>
          <button onClick={() => { logApoio('👀 manual → batismo'); setAmp('batismo'); setScreen('choice') }} className="w-full rounded-xl px-1.5 py-2.5 text-center font-black uppercase text-[13px] active:translate-y-0.5" style={{ ...OSWALD, background: INK, color: GOLD, border: `3px solid ${INK}`, boxShadow: `3px 3px 0 ${INK}` }}>
            {tr('🖋 Ver o Batismo', '🖋 See Club naming')}<br /><span className="text-[9px] font-extrabold opacity-75">{tr('tudo do Craque pra sempre + seu clube no jogo · a partir de R$ 69,90', 'all of Star forever + your club in the game · from R$ 69.90')}</span>
          </button>
          <div className="ll-support-offer mt-2"><SupportStory /></div>
        </div>
      </ApoieModal>}

      {screen === 'mensal' && (
        <ApoieModal onClose={close}>
          <CraqueMensal direitos={direitos} onDirect={msg => { logApoio('⭐ mensal → chamou no Direct'); igMsg(msg) }} onVoltar={() => setScreen('choice')} />
        </ApoieModal>
      )}

      {screen === 'batismo' && (
        <ApoieModal onClose={close}>
          <p className="font-black text-2xl text-center" style={OSWALD}>{tr('⚽ BATIZA TEU CLUBE', '⚽ NAME YOUR CLUB')}</p>
          <p className="text-xs font-bold text-black/60 text-center mt-1">{tr('3 coisinhas e teu time entra em campo:', '3 little things and your team takes the field:')}</p>
          <p className="font-black text-[13px] mt-3" style={OSWALD}><span className="inline-block w-5 h-5 rounded-full text-center text-[11px] leading-5 mr-1.5" style={{ background: INK, color: GOLD }}>1</span>{tr('Escolhe o nome do clube', 'Pick the club name')}</p>
          <input value={clube} onChange={e => setClube(stripEmoji(e.target.value))} maxLength={26} placeholder={tr('Ex.: Atlético do Jefão', 'e.g. Atlético do Jefão')}
            className="w-full border-[3px] border-black rounded-xl px-3 py-2.5 mt-2 font-black text-base bg-white" style={OSWALD} />
          <p className="text-[10px] font-bold text-black/45 mt-1.5">{tr('✅ nome de resenha, zoeira leve, homenagem · ❌ ofensa, política, marca de empresa', '✅ banter names, light jokes, tributes · ❌ slurs, politics, company brands')}</p>
          <p className="font-black text-[13px] mt-3.5" style={OSWALD}><span className="inline-block w-5 h-5 rounded-full text-center text-[11px] leading-5 mr-1.5" style={{ background: INK, color: GOLD }}>2</span>{tr('Escolhe o batismo e faz o Pix', 'Pick the naming and pay via Pix')}</p>
          <div className="flex gap-1.5 mt-1.5">
            {([['lenda', tr('🖋 Batismo Lenda', '🖋 Legend Naming'), PRECOS.batismoLenda, tr('tudo do Craque pra sempre + seu clube', 'all of Star forever + your club')],
               ['plus', tr('🖋✨ Batismo Plus', '🖋✨ Plus Naming'), PRECOS.batismoPlus, tr('+ gala única + canto de torcida', '+ unique entrance + crowd chant')]] as const).map(([k, nome, preco, sub]) => (
              <button key={k} onClick={() => setPlanoBatismo(k)} className="flex-1 border-2 border-black rounded-lg px-2 py-1.5 text-[9.5px] font-black text-center active:translate-y-0.5"
                style={{ background: planoBatismo === k ? GOLD : '#fff', boxShadow: planoBatismo === k ? `2px 2px 0 0 ${INK}` : 'none' }}>
                {nome}<br /><span className="text-[12px]" style={OSWALD}>{precoTxt(preco, getLang() === 'en')}</span><br /><span className="font-bold text-black/55">{sub}</span>
              </button>
            ))}
          </div>
          <p className="text-[9.5px] font-bold text-black/50 mt-1 leading-snug">{L(<>Os dois entram na <b>Série A</b>, no <b>Jogo Rápido</b> e no <b>Online</b>, e trazem <b>tudo do Craque pra sempre</b>, sem mensalidade.</>,
                                                                                    <>Both join <b>Division A</b>, <b>Quick Play</b> and <b>Online</b>, and bring <b>everything in Star forever</b>, no monthly fee.</>)}</p>
          <div className="mt-2"><PixBox label="copiar chave Pix" ctx={`batismo do clube · ${planoBatismo === 'plus' ? '🖋✨ Plus' : '🖋 Lenda'}${cupom ? ` · cupom ${cupom.codigo}` : ''}`} amount={precoBatismo} /></div>
          {/* 🎟️ cupom de influenciador — só aqui, no batismo. SUTIL de propósito
              (Diego 08/09: *"deixe de forma mais sutil lá no pagamento e não tão
              óbvio"*): é uma linha cinza embaixo do Pix, "tem cupom?", que só vira
              campo quando a pessoa toca. Quem não tem cupom nem repara. */}
          {cupom ? (
            <p className="text-[10px] font-bold text-center mt-1.5" style={{ color: GREEN }}>
              {tr('🎟️ cupom', '🎟️ coupon')} <b>{cupom.codigo}</b> {tr('aplicado', 'applied')} · {cupom.desconto_pct}% off · <s className="text-black/40">R$ {precoCheioBatismo.toFixed(2).replace('.', getLang() === 'en' ? '.' : ',')}</s> <b>R$ {precoBatismo.toFixed(2).replace('.', getLang() === 'en' ? '.' : ',')}</b>
              {' '}<button onClick={() => { setCupom(null); setCupomTxt(''); setCupomMsg(null); setCupomAberto(false) }} className="underline text-black/40 font-bold">{tr('tirar', 'remove')}</button>
            </p>
          ) : !cupomAberto ? (
            <p className="text-center mt-1.5"><button onClick={() => setCupomAberto(true)} className="text-[10px] font-bold underline text-black/40">{tr('tem cupom?', 'got a coupon?')}</button></p>
          ) : (
            <div className="mt-1.5">
              <div className="flex gap-1.5 items-center justify-center">
                <input value={cupomTxt} onChange={e => { setCupomTxt(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setCupomMsg(null) }} onKeyDown={e => e.key === 'Enter' && aplicarCupom()} maxLength={16} placeholder={tr('código', 'code')} autoCapitalize="characters" autoFocus
                  className="w-36 border-2 border-black/30 rounded-lg px-2 py-1 font-black text-[12px] bg-white tracking-wider text-center" style={OSWALD} />
                <button onClick={aplicarCupom} disabled={cupomBusy || !cupomTxt.trim()} className="text-[10px] font-black underline" style={{ color: cupomTxt.trim() ? INK : 'rgba(0,0,0,.3)' }}>{cupomBusy ? '…' : tr('aplicar', 'apply')}</button>
                <button onClick={() => { setCupomAberto(false); setCupomTxt(''); setCupomMsg(null) }} className="text-[10px] font-bold underline text-black/35">{tr('fechar', 'close')}</button>
              </div>
              {cupomMsg && <p className="text-[10px] font-bold mt-1 text-center" style={{ color: '#C2452F' }}>{cupomMsg}</p>}
            </div>
          )}
          <p className="font-black text-[13px] mt-3.5" style={OSWALD}><span className="inline-block w-5 h-5 rounded-full text-center text-[11px] leading-5 mr-1.5" style={{ background: INK, color: GOLD }}>3</span>{tr('Manda comprovante + nome', 'Send the receipt + the name')}</p>
          <button onClick={() => {
            logApoio(`🏟️ QUER BATISMO ${planoBatismo.toUpperCase()}: "${clube.trim() || '(sem nome)'}"${cupom ? ` · cupom ${cupom.codigo}` : ''}`)
            // 🎟️ registra o uso do cupom (pro relatório do influenciador). Não trava
            // nada se falhar: a DM com "cupom X" continua sendo a prova pro Diego.
            if (cupom) supabase.rpc('esc_cupom_usar', { p_codigo: cupom.codigo, p_clube: clube.trim(), p_serie: planoBatismo === 'plus' ? 'PLUS' : 'LENDA', p_valor_cheio: precoCheioBatismo, p_valor_pago: precoBatismo }).then(() => {}, () => {})
            igMsg(getLang() === 'en'
              ? `Hey! I just supported Leilão Legends 💛 I want the ${planoBatismo === 'plus' ? 'PLUS' : 'LEGEND'} naming for my club: "${clube.trim() || '(club name)'}"${cupom ? ` — I used coupon ${cupom.codigo} (${cupom.desconto_pct}% off, paid R$ ${precoBatismo.toFixed(2)})` : ''} — receipt attached!`
              : `Opa! Acabei de apoiar o Leilão Legends 💛 Quero o Batismo ${planoBatismo === 'plus' ? 'PLUS' : 'LENDA'} do meu clube: "${clube.trim() || '(nome do clube)'}"${cupom ? ` — usei o cupom ${cupom.codigo} (${cupom.desconto_pct}% off, paguei R$ ${precoBatismo.toFixed(2).replace('.', ',')})` : ''} — comprovante em anexo!`)
          }} className="w-full mt-2 rounded-xl border-[3px] border-black font-black text-[15px] py-3 active:translate-y-0.5"
            style={{ background: '#E1306C', color: '#fff', boxShadow: `4px 4px 0 0 ${INK}`, ...OSWALD }}>
            {tr('📸 CHAMAR NO @leilaolegendscom', '📸 MESSAGE @leilaolegendscom')}
          </button>
          <p className="text-[10px] font-bold text-black/45 mt-1.5 text-center">{tr('(a mensagem já vai copiada — é só colar na DM e anexar o comprovante)', '(the message is already copied — just paste it in the DM and attach the receipt)')}</p>
          <p className="text-[11px] font-bold text-black/55 mt-3 leading-snug text-center">{tr('A gente responde em até 24h confirmando o clube — e na próxima atualização ele já tá jogando pra todo mundo. ⚽', 'We reply within 24h confirming the club — and in the next update it is already playing for everyone. ⚽')}</p>
          <p className="text-[10.5px] font-bold text-black/60 mt-2 leading-snug text-center">{L(<>👑 <b>Bônus:</b> batizar já inclui <b>tudo do Craque completo, pra sempre</b> + o <b>🎫 Sócio Legends</b> (manto, escudo, mascote, estádio batizado). Se alguém cobrir a proposta pelo nome, você perde <b>só o nome</b> — o resto continua com você. Aí é cobrir ou chorar. 😄</>,
                                                                                                <>👑 <b>Bonus:</b> naming a club already includes <b>everything in Full Star, forever</b> + <b>🎫 Legends Membership</b> (kit, crest, mascot, named stadium). If someone outbids you for the name, you only lose <b>the name</b> — everything else stays with you. Then it's outbid or cry. 😄</>)}</p>
          <div className="border-[3px] border-black rounded-xl px-3 py-2.5 mt-3 text-center" style={{ background: INK }}>
            <p className="font-black text-[12px] tracking-wide" style={{ color: GOLD, ...OSWALD }}>{tr('🤫 DISCRIÇÃO TOTAL', '🤫 COMPLETE DISCRETION')}</p>
            <p className="text-[10.5px] font-bold mt-1 leading-snug" style={{ color: 'rgba(255,255,255,0.75)' }}>{tr('Nenhum valor aparece pra ninguém, nunca. Quanto cada um apoiou fica só entre você e a gente. No jogo, só existe o nome do clube.', 'No amount is ever shown to anyone, ever. How much each person gave stays between you and us. In the game, only the club name exists.')}</p>
          </div>
        </ApoieModal>
      )}
    </>
  )
}

