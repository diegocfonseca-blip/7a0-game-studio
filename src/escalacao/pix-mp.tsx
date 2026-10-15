// ─── 💳 PIX DO MERCADO PAGO: gerar → pagar → caiu (15/10) ─────────────────────────────────────────────────────────
//
// Diego trocou a chave fixa + "manda o comprovante no Instagram" pelo Pix gerado na hora (mockup aprovado:
// `scripts/mockups/pix-mp.png`, *"perfeito, pode fazer tudo já"*). Regras dele:
//  · tudo é PIX ÚNICO (nada mensal) · pede só o WhatsApp, OPCIONAL (e-mail já vem do login; nada de CPF nem nome)
//  · no celular o COPIAR vem primeiro e grande (o QR fica embaixo) · o Pix vale 24h · se a pessoa voltar, o mesmo Pix
//    ainda está ali ("você tem um Pix esperando") · ao voltar do app do banco, o jogo confere sozinho
//  · liberou o automático (Craque, Lenda, salas, tudo do Lenda no Batismo/Fundador) → mostra na hora; o PERSONALIZADO
//    (escudo, mascote, manto, canto, gala) a pessoa conta POR ESCRITO aqui — *"não quero que mandem imagem… eu que
//    quero fazer as artes"* — e escolhe falar com o Diego por WhatsApp ou e-mail.
// 🔒 Este componente NÃO decide nada: preço e liberação são do servidor (Edge Functions `mp-criar-pix`/`mp-webhook` +
// `esc_mp_*` no banco). Aqui só se pede o Pix e se PERGUNTA o status do próprio pedido.
import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { tr, getLang } from './lang'
import { logApoio, recarregaDireitos } from './apoio'
import { precoTxt } from './planos-regras'

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', CREAM = '#F4ECD6', RED = '#C2452F'
const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 700 } as const
export type ProdutoMp = 'craque' | 'lenda' | 'batismo' | 'fundador' | 'salas_extras' | 'teste'
const NOME: Record<ProdutoMp, [string, string]> = {
  craque: ['⭐ Plano Craque', '⭐ Star plan'], lenda: ['👑 Plano Lenda', '👑 Legend plan'], batismo: ['🖋 Plano Batismo', '🖋 Club Naming plan'],
  fundador: ['🖋 Plano Fundador', '🖋 Founder plan'], salas_extras: ['🎟️ 3 salas extras', '🎟️ 3 extra rooms'], teste: ['🧪 Teste de pagamento', '🧪 Payment test'],
}
const GANHOU: Record<ProdutoMp, [string, string]> = {
  craque: ['Seu ⭐ Craque já está valendo: cor prata, Modo Manual e Olheiro.', 'Your ⭐ Star is live: silver colour, Manual Mode and Scout.'],
  lenda: ['Seu 👑 Lenda já está valendo: dourado em todo lugar, Modo Manual e salas à vontade.', 'Your 👑 Legend is live: gold everywhere, Manual Mode and unlimited rooms.'],
  batismo: ['Tudo do 👑 Lenda já está valendo. Agora é a parte do seu clube: conta pra gente como você imagina.', 'Everything from 👑 Legend is live. Now for your club: tell us how you picture it.'],
  fundador: ['Tudo do 👑 Lenda já está valendo. Agora é a parte do seu clube: conta pra gente como você imagina.', 'Everything from 👑 Legend is live. Now for your club: tell us how you picture it.'],
  salas_extras: ['Suas 3 salas extras já estão na conta. Bora criar!', 'Your 3 extra rooms are in your account. Go create!'],
  teste: ['Teste aprovado: o Pix caiu e o jogo viu sozinho. ✅', 'Test passed: the Pix landed and the game saw it on its own. ✅'],
}
// 📲 contato do Diego depois de pagar (o WhatsApp entra quando ele mandar o número; sem número, só o e-mail aparece)
export const WHATSAPP_CONTATO = ''
export const EMAIL_CONTATO = 'diego.c.fonseca@gmail.com'

type Pix = { pedido_id: string; valor: number; qr_code: string; qr_code_base64?: string | null; expira_em: string }
type Fase = 'inicio' | 'gerando' | 'gerado' | 'pago' | 'erro'

const resta = (iso: string) => {
  const ms = new Date(iso).getTime() - Date.now()
  if (ms <= 0) return null
  const h = Math.floor(ms / 3600_000), m = Math.floor(ms / 60_000) % 60
  return h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m} min`
}

/** a caixa do Pix novo. `valor` é só pra MOSTRAR antes de gerar (o valor de verdade vem do servidor). */
export function PixMP({ produto, valor }: { produto: ProdutoMp; valor?: number }) {
  const en = getLang() === 'en'
  const [fase, setFase] = useState<Fase>('inicio')
  const [pix, setPix] = useState<Pix | null>(null)
  const [tel, setTel] = useState('')
  const [erro, setErro] = useState('')
  const [copiou, setCopiou] = useState(false)
  const [liberado, setLiberado] = useState(true)
  const [, tick] = useState(0)

  // ⏳ "você tem um Pix esperando": volta o mesmo Pix se ainda vale e o preço é o mesmo
  useEffect(() => {
    let vivo = true
    supabase.rpc('esc_mp_meu_pendente', { p_produto: produto }).then(({ data }) => {
      const r = Array.isArray(data) ? data[0] as Pix & { qr_base64?: string } : undefined
      if (vivo && r?.pedido_id) { setPix({ ...r, qr_code_base64: r.qr_base64 ?? null }); setFase('gerado') }
    }, () => {})
    return () => { vivo = false }
  }, [produto])

  // 👀 confere o status: a cada 5 s enquanto espera e toda vez que a pessoa volta pro jogo (saiu pro app do banco)
  const conferindo = useRef(false)
  const confere = useCallback(async () => {
    if (!pix || conferindo.current) return
    conferindo.current = true
    try {
      const { data } = await supabase.rpc('esc_mp_status_pedido', { p_id: pix.pedido_id })
      const st = Array.isArray(data) ? (data[0] as { status: string } | undefined)?.status : undefined
      if (st === 'pago' || st === 'liberado') {
        setLiberado(st === 'liberado'); setFase('pago'); recarregaDireitos()
        logApoio(`💳 PIX MP caiu · ${produto} · ${st}`)
      }
    } finally { conferindo.current = false }
  }, [pix, produto])
  useEffect(() => {
    if (fase !== 'gerado') return
    const iv = setInterval(() => { confere(); tick(n => n + 1) }, 5000)
    const volta = () => { if (document.visibilityState === 'visible') confere() }
    document.addEventListener('visibilitychange', volta); window.addEventListener('focus', volta)
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', volta); window.removeEventListener('focus', volta) }
  }, [fase, confere])

  const gerar = async () => {
    setFase('gerando'); setErro('')
    logApoio(`💳 gerou Pix MP · ${produto}`)
    const { data, error } = await supabase.functions.invoke('mp-criar-pix', { body: { produto, telefone: tel.replace(/\D/g, '') } })
    if (error || !data?.qr_code) {
      let cod = ''
      try { cod = (await (error as { context?: Response })?.context?.json?.())?.erro ?? '' } catch { /* sem corpo */ }
      setErro(cod === 'ja_tem' ? tr('Você já tem esse plano (ou um maior). 😉', 'You already have this plan (or a higher one). 😉')
        : cod === 'sem_login' ? tr('Entre na sua conta pra pagar: é por ela que o plano chega em você.', 'Sign in to pay: that is how the plan reaches you.')
        : tr('Não deu pra gerar o Pix agora. Tenta de novo em instantes.', 'Couldn’t create the Pix right now. Try again in a moment.'))
      setFase('erro'); return
    }
    setPix(data as Pix); setFase('gerado')
  }
  const copiar = async () => {
    if (!pix) return
    try { await navigator.clipboard.writeText(pix.qr_code) } catch { /* sem permissão: o código está à vista pra copiar na mão */ }
    setCopiou(true); setTimeout(() => setCopiou(false), 2500)
    logApoio(`💳 copiou Pix MP · ${produto}`)
  }

  const btn = (bg: string, cor = INK) => ({ ...OSW, background: bg, color: cor, border: `3px solid ${INK}`, boxShadow: `3px 3px 0 ${INK}` })
  const valorTela = pix?.valor ?? valor

  return (
    <div className="rounded-2xl bg-white p-3.5 text-center" style={{ border: `3px solid ${INK}`, boxShadow: `4px 4px 0 ${INK}` }}>
      <div className="flex items-center justify-between rounded-xl px-3 py-2 mb-3" style={{ background: CREAM, border: `2px solid ${INK}` }}>
        <span className="font-black uppercase text-[14px]" style={OSW}>{tr(NOME[produto][0], NOME[produto][1])}</span>
        {valorTela != null && <b className="font-black text-[20px]" style={OSW}>{precoTxt(valorTela, en)}</b>}
      </div>

      {(fase === 'inicio' || fase === 'gerando' || fase === 'erro') && <>
        <p className="text-[12px] font-bold leading-snug" style={{ color: '#5a5240' }}>{tr('O Pix sai com o valor certinho. Não precisa mandar comprovante: o jogo vê sozinho quando cair.', 'The Pix comes with the exact amount. No receipt needed: the game sees it on its own when it lands.')}</p>
        <label className="block text-left mt-3">
          <span className="text-[11px] font-black uppercase tracking-wide" style={{ ...OSW, color: '#5a5240' }}>{tr('Seu WhatsApp (opcional)', 'Your WhatsApp (optional)')}</span>
          <input value={tel} onChange={e => setTel(e.target.value.replace(/[^\d()+\s-]/g, '').slice(0, 20))} inputMode="tel" placeholder="(11) 91234-5678"
            className="w-full rounded-xl px-3 py-2 mt-1 font-bold text-[15px] bg-white" style={{ border: `2px solid ${INK}` }} />
          <span className="block text-[10.5px] font-bold mt-1" style={{ color: 'rgba(12,12,12,.5)' }}>{tr('Só pra gente te ajudar se der algum problema.', 'Only so we can help you if something goes wrong.')}</span>
        </label>
        {fase === 'erro' && <p className="text-[12px] font-black mt-2" style={{ color: RED }}>{erro}</p>}
        <button onClick={gerar} disabled={fase === 'gerando'} className="w-full rounded-xl py-3 mt-3 text-[18px] uppercase active:translate-y-0.5" style={btn(GREEN, '#fff')}>
          {fase === 'gerando' ? tr('⏳ Gerando…', '⏳ Creating…') : tr('⚡ Gerar meu Pix', '⚡ Create my Pix')}
        </button>
        <p className="text-[11px] font-bold mt-2" style={{ color: 'rgba(12,12,12,.5)' }}>{tr('Pagamento único. Nada de mensalidade.', 'One-time payment. No subscription.')}</p>
      </>}

      {fase === 'gerado' && pix && <>
        <button onClick={copiar} className="w-full rounded-xl py-3 text-[18px] uppercase active:translate-y-0.5" style={btn(copiou ? GREEN : GOLD, copiou ? '#fff' : INK)}>
          {copiou ? tr('✅ Copiado! Cole no app do banco', '✅ Copied! Paste it in your bank app') : tr('📋 Copiar código Pix', '📋 Copy Pix code')}
        </button>
        <p className="text-[11.5px] font-bold mt-2 leading-snug" style={{ color: '#5a5240' }}>{tr('Abra o app do banco → Pix → Copia e Cola. Ou leia o QR com a câmera:', 'Open your bank app → Pix → Copy and Paste. Or scan the QR with your camera:')}</p>
        {pix.qr_code_base64 && <img src={`data:image/png;base64,${pix.qr_code_base64}`} alt="QR Pix" width={180} height={180} className="mx-auto mt-2 rounded-lg" style={{ border: `3px solid ${INK}` }} />}
        <div className="text-[10px] font-mono text-left break-all rounded-lg p-2 mt-2 select-all" style={{ background: CREAM, border: `2px dashed ${INK}` }}>{pix.qr_code}</div>
        <div className="flex items-center justify-center gap-2 mt-3 font-black uppercase text-[14px]" style={OSW}>
          <span className="w-3 h-3 rounded-full animate-pulse" style={{ background: '#E8503A', boxShadow: '0 0 0 4px rgba(232,80,58,.25)' }} />
          {tr('Esperando o pagamento…', 'Waiting for the payment…')}
        </div>
        <p className="text-[11.5px] font-black mt-1" style={{ ...OSW, color: RED }}>{resta(pix.expira_em) ? tr(`⏳ vale por ${resta(pix.expira_em)}`, `⏳ valid for ${resta(pix.expira_em)}`) : tr('⏳ venceu: gere outro', '⏳ expired: create another')}</p>
        <button onClick={confere} className="text-[11px] font-black underline mt-2" style={{ color: 'rgba(12,12,12,.55)' }}>{tr('Já paguei, conferir agora', 'I already paid, check now')}</button>
      </>}

      {fase === 'pago' && <Pago produto={produto} liberado={liberado} pedido={pix?.pedido_id ?? ''} />}
    </div>
  )
}

/** ✅ caiu! — e, no Batismo/Fundador, o "conta como você imagina" (por escrito) + falar com o Diego */
function Pago({ produto, liberado, pedido }: { produto: ProdutoMp; liberado: boolean; pedido: string }) {
  const clubeDeGente = produto === 'batismo' || produto === 'fundador' || produto === 'teste'
  return (
    <div>
      <div className="text-[56px] leading-none mt-1">✅</div>
      <p className="font-black uppercase text-[24px] mt-1" style={{ ...OSW, color: GREEN }}>{tr('Pagamento confirmado!', 'Payment confirmed!')}</p>
      <p className="text-[13px] font-bold mt-1 leading-snug">{liberado ? tr(GANHOU[produto][0], GANHOU[produto][1]) : tr('Chegou pro Diego liberar. Em instantes está na sua conta.', 'It reached Diego to unlock. It will be in your account shortly.')}</p>
      {clubeDeGente ? <Briefing produto={produto} pedido={pedido} /> : (
        <button onClick={() => window.location.reload()} className="w-full rounded-xl py-3 mt-3 text-[18px] uppercase active:translate-y-0.5"
          style={{ ...OSW, background: GREEN, color: '#fff', border: `3px solid ${INK}`, boxShadow: `3px 3px 0 ${INK}` }}>{tr('🎮 Bora jogar', '🎮 Let’s play')}</button>
      )}
    </div>
  )
}

function Briefing({ produto, pedido }: { produto: ProdutoMp; pedido: string }) {
  const [d, setD] = useState({ clube: '', coracao: '', cores: '', escudo: '', mascote: '', canto: '' })
  const [salvo, setSalvo] = useState(false)
  const [busy, setBusy] = useState(false)
  const fundador = produto === 'fundador' || produto === 'teste'
  const nomeProd = produto === 'fundador' ? 'Fundador' : produto === 'batismo' ? 'Batismo' : 'Teste'
  const num = pedido.slice(0, 8).toUpperCase()
  const salvar = async () => {
    setBusy(true)
    const { data } = await supabase.rpc('esc_mp_briefing', { p_id: pedido, p_dados: d })
    setBusy(false)
    if (data) { setSalvo(true); logApoio(`🖋 briefing do ${nomeProd}: ${d.clube || '(sem nome)'}`) }
  }
  const msg = tr(`Oi, Diego! Comprei o ${nomeProd} (pedido ${num})${d.clube ? `, clube ${d.clube}` : ''}. Já contei no jogo como imagino o meu clube.`,
    `Hi Diego! I bought ${nomeProd} (order ${num})${d.clube ? `, club ${d.clube}` : ''}. I already described in the game how I picture my club.`)
  const campo = (k: keyof typeof d, rotulo: [string, string], ex: [string, string], grande = false) => (
    <label className="block text-left mt-2.5">
      <span className="text-[11px] font-black uppercase tracking-wide" style={{ ...OSW, color: '#5a5240' }}>{tr(rotulo[0], rotulo[1])}</span>
      {grande
        ? <textarea value={d[k]} onChange={e => setD({ ...d, [k]: e.target.value.slice(0, 600) })} rows={2} placeholder={tr(ex[0], ex[1])} className="w-full rounded-xl px-3 py-2 mt-1 font-bold text-[14px] bg-white resize-none" style={{ border: `2px solid ${INK}` }} />
        : <input value={d[k]} onChange={e => setD({ ...d, [k]: e.target.value.slice(0, 80) })} placeholder={tr(ex[0], ex[1])} className="w-full rounded-xl px-3 py-2 mt-1 font-bold text-[14px] bg-white" style={{ border: `2px solid ${INK}` }} />}
    </label>
  )
  return (
    <div className="mt-3 rounded-xl p-3 text-left" style={{ background: CREAM, border: `2px solid ${INK}` }}>
      <p className="font-black uppercase text-[16px]" style={OSW}>{tr('✍️ Conta como você imagina o seu clube', '✍️ Tell us how you picture your club')}</p>
      {!salvo ? <>
        {campo('clube', ['Nome do clube', 'Club name'], ['Ex.: Atlético do Jefão', 'e.g. Atlético do Jefão'])}
        {campo('coracao', ['Time de coração', 'Favourite team'], ['Ex.: Palmeiras', 'e.g. Palmeiras'])}
        {campo('cores', ['Cores do clube', 'Club colours'], ['Ex.: verde e branco', 'e.g. green and white'])}
        {campo('escudo', ['Como você imagina o escudo', 'How you picture the crest'], ['Ex.: uma coroa em cima e o meu apelido no meio', 'e.g. a crown on top and my nickname in the middle'], true)}
        {campo('mascote', ['Como você imagina a mascote', 'How you picture the mascot'], ['Ex.: um leão de boné, bravo', 'e.g. a lion with a cap, fierce'], true)}
        {fundador && campo('canto', ['Canto da torcida (música ou letra)', 'Fan chant (song or lyrics)'], ['Ex.: o canto do meu time de coração', 'e.g. my favourite team’s chant'], true)}
        <p className="text-[11px] font-black mt-2.5 leading-snug" style={{ color: '#7C3AED' }}>{tr('🎨 Não precisa mandar imagem: a arte é feita pelo Leilão Legends, exclusiva pro seu clube.', '🎨 No need to send images: the art is made by Leilão Legends, exclusive to your club.')}</p>
        <button onClick={salvar} disabled={busy} className="w-full rounded-xl py-2.5 mt-2.5 text-[16px] uppercase active:translate-y-0.5" style={{ ...OSW, background: GOLD, border: `3px solid ${INK}`, boxShadow: `3px 3px 0 ${INK}` }}>{busy ? '…' : tr('📨 Enviar', '📨 Send')}</button>
      </> : <p className="text-[13px] font-black mt-1.5" style={{ color: GREEN }}>{tr('✅ Recebido! O Diego começa a fazer o seu clube.', '✅ Got it! Diego will start building your club.')}</p>}
      <p className="text-[11.5px] font-bold mt-3" style={{ color: '#5a5240' }}>{tr('Quer falar com o Diego? Escolhe por onde:', 'Want to talk to Diego? Pick how:')}</p>
      <div className="flex gap-2 mt-1.5">
        {WHATSAPP_CONTATO && <a href={`https://wa.me/${WHATSAPP_CONTATO}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer" className="flex-1 rounded-xl py-2 text-center text-[14px] uppercase" style={{ ...OSW, background: '#25D366', color: '#fff', border: `3px solid ${INK}`, boxShadow: `3px 3px 0 ${INK}` }}>📲 WhatsApp</a>}
        <a href={`mailto:${EMAIL_CONTATO}?subject=${encodeURIComponent(tr(`Leilão Legends · ${nomeProd} (pedido ${num})`, `Leilão Legends · ${nomeProd} (order ${num})`))}&body=${encodeURIComponent(msg)}`} className="flex-1 rounded-xl py-2 text-center text-[14px] uppercase bg-white" style={{ ...OSW, border: `3px solid ${INK}`, boxShadow: `3px 3px 0 ${INK}` }}>✉️ E-mail</a>
      </div>
    </div>
  )
}
