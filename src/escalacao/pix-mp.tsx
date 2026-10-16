// ─── 💳 PIX DO MERCADO PAGO: gerar → pagar → caiu (15/10) ─────────────────────────────────────────────────────────
//
// Diego trocou a chave fixa + "manda o comprovante no Instagram" pelo Pix gerado na hora (mockup aprovado:
// `scripts/mockups/pix-mp.png`, *"perfeito, pode fazer tudo já"*). Regras dele:
//  · tudo é PIX ÚNICO (nada mensal) · antes do Pix NÃO pede nada (*"o telefone não quero antes do Pix… tudo é depois"*):
//    o WhatsApp, opcional, só aparece depois de pagar (e-mail já vem do login; nada de CPF nem nome)
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
import { listAllCareers } from './store'
import { ANUNCIO_MAX, releAnuncios } from './patrocinio'

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', CREAM = '#F4ECD6', RED = '#C2452F'
const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 700 } as const
export type ProdutoMp = 'craque' | 'lenda' | 'batismo' | 'fundador' | 'salas_extras' | 'teste' | 'moedas_10' | 'moedas_50' | 'moedas_100' | 'moedas_500' | 'moedas_1000' | 'canto' | 'presente' | 'dia_marca' | 'giro_dia'
const NOME: Record<ProdutoMp, [string, string]> = {
  craque: ['⭐ Plano Craque', '⭐ Star plan'], lenda: ['👑 Plano Lenda', '👑 Legend plan'], batismo: ['🖋 Plano Batismo', '🖋 Club Naming plan'],
  fundador: ['🖋 Plano Fundador', '🖋 Founder plan'], salas_extras: ['🎟️ 3 salas extras', '🎟️ 3 extra rooms'], teste: ['🧪 Teste de pagamento', '🧪 Payment test'],
  moedas_10: ['🏦 30 moedas', '🏦 30 coins'], moedas_50: ['🏦 150 moedas', '🏦 150 coins'], moedas_100: ['🏦 300 moedas', '🏦 300 coins'], moedas_500: ['🏦 1.500 moedas', '🏦 1,500 coins'], moedas_1000: ['🏦 3.000 moedas', '🏦 3,000 coins'],
  canto: ['📣 Canto da torcida', '📣 Crowd chant'], presente: ['🎁 Presente', '🎁 Gift'], dia_marca: ['⚡ Dia da marca', '⚡ Brand day'], giro_dia: ['📣 Anúncio no giro', '📣 Ticker ad'],
}
const GANHOU: Record<ProdutoMp, [string, string]> = {
  craque: ['Seu ⭐ Craque já está valendo: cor prata, Modo Manual e Olheiro.', 'Your ⭐ Star is live: silver colour, Manual Mode and Scout.'],
  lenda: ['Seu 👑 Lenda já está valendo: dourado em todo lugar, Modo Manual e salas à vontade.', 'Your 👑 Legend is live: gold everywhere, Manual Mode and unlimited rooms.'],
  batismo: ['Tudo do 👑 Lenda já está valendo. Agora é a parte do seu clube: conta pra gente como você imagina.', 'Everything from 👑 Legend is live. Now for your club: tell us how you picture it.'],
  fundador: ['Tudo do 👑 Lenda já está valendo. Agora é a parte do seu clube: conta pra gente como você imagina.', 'Everything from 👑 Legend is live. Now for your club: tell us how you picture it.'],
  salas_extras: ['Suas 3 salas extras já estão na conta. Bora criar!', 'Your 3 extra rooms are in your account. Go create!'],
  teste: ['Teste aprovado: o Pix caiu e o jogo viu sozinho. ✅', 'Test passed: the Pix landed and the game saw it on its own. ✅'],
  moedas_10: ['Pagamento recebido! Agora escolha em qual carreira as moedas vão cair:', 'Payment received! Now pick which career the coins go to:'],
  moedas_50: ['Pagamento recebido! Agora escolha em qual carreira as moedas vão cair:', 'Payment received! Now pick which career the coins go to:'],
  moedas_100: ['Pagamento recebido! Agora escolha em qual carreira as moedas vão cair:', 'Payment received! Now pick which career the coins go to:'],
  moedas_500: ['Pagamento recebido! Agora escolha em qual carreira as moedas vão cair:', 'Payment received! Now pick which career the coins go to:'],
  moedas_1000: ['Pagamento recebido! Agora escolha em qual carreira as moedas vão cair:', 'Payment received! Now pick which career the coins go to:'],
  canto: ['Agora conta qual canto você quer: o Diego monta e coloca no seu clube.', 'Now tell us which chant you want: Diego builds it and adds it to your club.'],
  presente: ['Presente entregue! Seu amigo recebe com o seu recado quando entrar no jogo. 🎁', 'Gift delivered! Your friend gets it with your message when they open the game. 🎁'],
  dia_marca: ['Pagamento recebido! Agora chama o Diego pra combinar o dia e mandar o nome, a bio e o cupom da sua marca.', 'Payment received! Now message Diego to pick the day and send your brand’s name, bio and coupon.'],
  giro_dia: ['Pagamento recebido! Agora escreva o seu anúncio: ele entra no ar na hora e passa por 24 h.', 'Payment received! Now write your ad: it goes live right away and runs for 24 h.'],
}
// 📲 contato do Diego depois de pagar (o WhatsApp entra quando ele mandar o número; sem número, só o e-mail aparece)
export const WHATSAPP_CONTATO = '5521998886982' // 16/10: número que o Diego passou (batismo, Fundador e Dia da marca)
export const WHATSAPP_TXT = '(21) 99888-6982'
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
/** `aoReceberFicha`: comprou DENTRO da carreira (🏦 Banco Legends) → a ficha é resgatada sozinha ali e devolve as moedas creditadas */
export function PixMP({ produto, valor, refId = '', aoReceberFicha }: { produto: ProdutoMp; valor?: number; refId?: string; aoReceberFicha?: (ficha: string) => Promise<number | null> }) {
  const en = getLang() === 'en'
  const [fase, setFase] = useState<Fase>('inicio')
  const [pix, setPix] = useState<Pix | null>(null)
  const [erro, setErro] = useState('')
  const [copiou, setCopiou] = useState(false)
  const [liberado, setLiberado] = useState(true)
  const [ficha, setFicha] = useState<string | null>(null)
  const [, tick] = useState(0)

  // ⏳ "você tem um Pix esperando": volta o mesmo Pix se ainda vale e o preço é o mesmo
  useEffect(() => {
    let vivo = true
    supabase.rpc('esc_mp_meu_pendente2', { p_produto: produto, p_ref: refId }).then(({ data }) => {
      const r = Array.isArray(data) ? data[0] as Pix & { qr_base64?: string } : undefined
      if (vivo && r?.pedido_id) { setPix({ ...r, qr_code_base64: r.qr_base64 ?? null }); setFase('gerado') }
    }, () => {})
    return () => { vivo = false }
  }, [produto, refId])

  // 👀 confere o status: a cada 5 s enquanto espera e toda vez que a pessoa volta pro jogo (saiu pro app do banco)
  const conferindo = useRef(false)
  const confere = useCallback(async () => {
    if (!pix || conferindo.current) return
    conferindo.current = true
    try {
      const { data } = await supabase.rpc('esc_mp_status_v2', { p_id: pix.pedido_id })
      const row = Array.isArray(data) ? (data[0] as { status: string; ficha: string | null } | undefined) : undefined
      const st = row?.status
      if (st === 'pago' || st === 'liberado') {
        setLiberado(st === 'liberado'); setFicha(row?.ficha ?? null); setFase('pago'); recarregaDireitos()
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
    const { data, error } = await supabase.functions.invoke('mp-criar-pix', { body: { produto, ref: refId } })
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

      {fase === 'pago' && <Pago produto={produto} liberado={liberado} pedido={pix?.pedido_id ?? ''} ficha={ficha} aoReceberFicha={aoReceberFicha} />}
    </div>
  )
}

/** ✅ caiu! — e, no Batismo/Fundador, o "conta como você imagina" (por escrito) + falar com o Diego */
function Pago({ produto, liberado, pedido, ficha, aoReceberFicha }: { produto: ProdutoMp; liberado: boolean; pedido: string; ficha: string | null; aoReceberFicha?: (ficha: string) => Promise<number | null> }) {
  const clubeDeGente = produto === 'batismo' || produto === 'fundador' || produto === 'teste' || produto === 'canto'
  // 🏦 comprou dentro da carreira: a ficha cai sozinha no caixa DESTE clube (uma vez só)
  const [creditou, setCreditou] = useState<number | null>(null)
  const jaTentou = useRef(false)
  useEffect(() => {
    if (!ficha || !aoReceberFicha || jaTentou.current) return
    jaTentou.current = true
    aoReceberFicha(ficha).then(v => setCreditou(v ?? null), () => {})
  }, [ficha, aoReceberFicha])
  return (
    <div>
      <div className="text-[56px] leading-none mt-1">✅</div>
      <p className="font-black uppercase text-[24px] mt-1" style={{ ...OSW, color: GREEN }}>{tr('Pagamento confirmado!', 'Payment confirmed!')}</p>
      <p className="text-[13px] font-bold mt-1 leading-snug">{liberado ? tr(GANHOU[produto][0], GANHOU[produto][1]) : tr('Chegou pro Diego liberar. Em instantes está na sua conta.', 'It reached Diego to unlock. It will be in your account shortly.')}</p>
      {creditou != null && creditou > 0 && <p className="font-black text-[26px] mt-2" style={{ ...OSW, color: GREEN }}>+{creditou} 🪙 {tr('no caixa do clube!', 'in the club’s till!')}</p>}
      {ficha && !aoReceberFicha && <EscolheSave pedido={pedido} />}
      {ficha && !(creditou != null && creditou > 0) && <p className="text-[10.5px] font-bold mt-2" style={{ color: 'rgba(12,12,12,.5)' }}>
        {tr('Código de reserva (se precisar): ', 'Backup code (if needed): ')}<b className="select-all">{ficha}</b>
      </p>}
      {produto === 'giro_dia' ? <EscreveAnuncio pedido={pedido} /> : produto === 'dia_marca' ? <ContatoDiego pedido={pedido} produto={produto} /> : clubeDeGente ? <Briefing produto={produto} pedido={pedido} /> : <>
        <Telefone pedido={pedido} />
        <button onClick={() => window.location.reload()} className="w-full rounded-xl py-3 mt-3 text-[18px] uppercase active:translate-y-0.5"
          style={{ ...OSW, background: GREEN, color: '#fff', border: `3px solid ${INK}`, boxShadow: `3px 3px 0 ${INK}` }}>{tr('🎮 Bora jogar', '🎮 Let’s play')}</button>
      </>}
    </div>
  )
}

/** 🏦 moedas compradas FORA da carreira: a pessoa escolhe a carreira; quando ela abrir, as moedas caem sozinhas
 *  (`DepositoPix` na carreira). Não mexe no save guardado — só anota o destino no pedido. */
function EscolheSave({ pedido }: { pedido: string }) {
  const [lista] = useState(() => { try { return listAllCareers() } catch { return [] } })
  const [escolhido, setEscolhido] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const escolher = async (seed: number, nome: string) => {
    setBusy(true)
    const { data } = await supabase.rpc('esc_mp_destino', { p_id: pedido, p_seed: seed, p_nome: nome })
    setBusy(false)
    if (data) { setEscolhido(nome); logApoio(`🏦 moedas do Pix → carreira ${nome}`) }
  }
  if (escolhido) return <p className="text-[13px] font-black mt-2.5 leading-snug" style={{ color: GREEN }}>{tr(`✅ Vão cair no ${escolhido} assim que você abrir essa carreira.`, `✅ They will land in ${escolhido} as soon as you open that career.`)}</p>
  if (!lista.length) return <p className="text-[12px] font-bold mt-2.5 leading-snug" style={{ color: '#5a5240' }}>{tr('Você ainda não tem carreira neste aparelho. As moedas ficam guardadas: abra uma carreira → Clube › Finanças › 🏦 Banco Legends → Depositar.', 'You have no career on this device yet. The coins stay saved: open a career → Club › Finances › 🏦 Banco Legends → Deposit.')}</p>
  return (
    <div className="mt-2.5 text-left">
      {lista.map(({ slot, active }) => {
        const sv = slot.save, nome = sv.managers[sv.youIdx]?.name ?? '—'
        return (
          <button key={sv.seed} disabled={busy} onClick={() => escolher(sv.seed, nome)} className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 mt-1.5 active:translate-y-0.5 bg-white"
            style={{ border: `3px solid ${INK}`, boxShadow: `3px 3px 0 ${INK}` }}>
            <span className="text-[20px]">🏟️</span>
            <span className="flex-1 text-left"><b className="block uppercase text-[15px]" style={OSW}>{nome}</b>
              <span className="text-[11px] font-bold" style={{ color: 'rgba(12,12,12,.55)' }}>{tr(`Temporada ${sv.seasonNo ?? 1}`, `Season ${sv.seasonNo ?? 1}`)}{active ? tr(' · a última que você jogou', ' · the last one you played') : ''}</span></span>
            <span className="font-black text-[18px]">›</span>
          </button>
        )
      })}
      <p className="text-[10.5px] font-bold mt-1.5" style={{ color: 'rgba(12,12,12,.5)' }}>{tr('Se preferir, deixe pra depois: dá pra depositar pelo 🏦 Banco Legends de qualquer carreira.', 'Or leave it for later: you can deposit from 🏦 Banco Legends in any career.')}</p>
    </div>
  )
}

/** 📲 o WhatsApp OPCIONAL, só depois de pagar */
function Telefone({ pedido, embutido = false }: { pedido: string; embutido?: boolean }) {
  const [tel, setTel] = useState('')
  const [ok, setOk] = useState<null | boolean>(null)
  const salvar = async () => { const { data } = await supabase.rpc('esc_mp_telefone', { p_id: pedido, p_tel: tel }); setOk(!!data) }
  if (ok) return <p className="text-[12px] font-black mt-2" style={{ color: GREEN }}>{tr('📲 WhatsApp salvo. Valeu!', '📲 WhatsApp saved. Thanks!')}</p>
  return (
    <div className={`text-left ${embutido ? 'mt-2.5' : 'mt-3 rounded-xl p-3'}`} style={embutido ? undefined : { background: CREAM, border: `2px solid ${INK}` }}>
      <span className="text-[11px] font-black uppercase tracking-wide" style={{ ...OSW, color: '#5a5240' }}>{tr('Seu WhatsApp (opcional)', 'Your WhatsApp (optional)')}</span>
      <div className="flex gap-2 mt-1">
        <input value={tel} onChange={e => { setTel(e.target.value.replace(/[^\d()+\s-]/g, '').slice(0, 20)); setOk(null) }} inputMode="tel" placeholder="(11) 91234-5678"
          className="flex-1 min-w-0 rounded-xl px-3 py-2 font-bold text-[15px] bg-white" style={{ border: `2px solid ${INK}` }} />
        <button onClick={salvar} disabled={tel.replace(/\D/g, '').length < 10} className="rounded-xl px-3 text-[14px] uppercase" style={{ ...OSW, background: GOLD, border: `2px solid ${INK}`, opacity: tel.replace(/\D/g, '').length < 10 ? .5 : 1 }}>{tr('Salvar', 'Save')}</button>
      </div>
      <span className="block text-[10.5px] font-bold mt-1" style={{ color: 'rgba(12,12,12,.5)' }}>{ok === false ? tr('Confere o número com DDD.', 'Check the number with area code.') : tr('Só pra gente te ajudar se precisar.', 'Only so we can help you if needed.')}</span>
    </div>
  )
}

function Briefing({ produto, pedido }: { produto: ProdutoMp; pedido: string }) {
  const [d, setD] = useState({ clube: '', coracao: '', cores: '', escudo: '', mascote: '', canto: '' })
  const [salvo, setSalvo] = useState(false)
  const [busy, setBusy] = useState(false)
  const fundador = produto === 'fundador' || produto === 'teste' || produto === 'canto'
  const soCanto = produto === 'canto'
  const nomeProd = produto === 'fundador' ? 'Fundador' : produto === 'batismo' ? 'Batismo' : produto === 'canto' ? 'Canto da torcida' : 'Teste'
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
      <p className="font-black uppercase text-[16px]" style={OSW}>{soCanto ? tr('✍️ Conta qual canto você quer', '✍️ Tell us which chant you want') : tr('✍️ Conta como você imagina o seu clube', '✍️ Tell us how you picture your club')}</p>
      {!salvo ? <>
        {!soCanto && campo('clube', ['Nome do clube', 'Club name'], ['Ex.: Atlético do Jefão', 'e.g. Atlético do Jefão'])}
        {campo('coracao', ['Time de coração', 'Favourite team'], ['Ex.: Palmeiras', 'e.g. Palmeiras'])}
        {!soCanto && campo('cores', ['Cores do clube', 'Club colours'], ['Ex.: verde e branco', 'e.g. green and white'])}
        {!soCanto && campo('escudo', ['Como você imagina o escudo', 'How you picture the crest'], ['Ex.: uma coroa em cima e o meu apelido no meio', 'e.g. a crown on top and my nickname in the middle'], true)}
        {!soCanto && campo('mascote', ['Como você imagina a mascote', 'How you picture the mascot'], ['Ex.: um leão de boné, bravo', 'e.g. a lion with a cap, fierce'], true)}
        {fundador && campo('canto', ['Canto da torcida (música ou letra)', 'Fan chant (song or lyrics)'], ['Ex.: o canto do meu time de coração', 'e.g. my favourite team’s chant'], true)}
        <p className="text-[11px] font-black mt-2.5 leading-snug" style={{ color: '#7C3AED' }}>{tr('🎨 Não precisa mandar imagem: a arte é feita pelo Leilão Legends, exclusiva pro seu clube.', '🎨 No need to send images: the art is made by Leilão Legends, exclusive to your club.')}</p>
        <button onClick={salvar} disabled={busy} className="w-full rounded-xl py-2.5 mt-2.5 text-[16px] uppercase active:translate-y-0.5" style={{ ...OSW, background: GOLD, border: `3px solid ${INK}`, boxShadow: `3px 3px 0 ${INK}` }}>{busy ? '…' : tr('📨 Enviar', '📨 Send')}</button>
      </> : <p className="text-[13px] font-black mt-1.5" style={{ color: GREEN }}>{tr('✅ Recebido! O Diego começa a fazer o seu clube.', '✅ Got it! Diego will start building your club.')}</p>}
      <Telefone pedido={pedido} embutido />
      <p className="text-[11.5px] font-bold mt-3" style={{ color: '#5a5240' }}>{tr(`Dúvida? Fala com o Diego (WhatsApp ${WHATSAPP_TXT}):`, `Questions? Talk to Diego (WhatsApp ${WHATSAPP_TXT}):`)}</p>
      <div className="flex gap-2 mt-1.5">
        {WHATSAPP_CONTATO && <a href={`https://wa.me/${WHATSAPP_CONTATO}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer" className="flex-1 rounded-xl py-2 text-center text-[14px] uppercase" style={{ ...OSW, background: '#25D366', color: '#fff', border: `3px solid ${INK}`, boxShadow: `3px 3px 0 ${INK}` }}>📲 WhatsApp</a>}
        <a href={`mailto:${EMAIL_CONTATO}?subject=${encodeURIComponent(tr(`Leilão Legends · ${nomeProd} (pedido ${num})`, `Leilão Legends · ${nomeProd} (order ${num})`))}&body=${encodeURIComponent(msg)}`} className="flex-1 rounded-xl py-2 text-center text-[14px] uppercase bg-white" style={{ ...OSW, border: `3px solid ${INK}`, boxShadow: `3px 3px 0 ${INK}` }}>✉️ E-mail</a>
      </div>
    </div>
  )
}

/** 📣 ANÚNCIO DO DIA escrito pelo próprio comprador (16/10, Diego: "a pessoa escreve o que quer… e caso escreva e dê ok vai
 *  passar a aparecer junto com o texto da Vadico, um depois do outro"). Só com o Pix CONFIRMADO: quem decide é o servidor
 *  (`esc_mp_anuncio_giro` confere dono, produto e status do pedido). Entra no ar na hora e sai sozinho 24 h depois. */
export function EscreveAnuncio({ pedido, aoPublicar }: { pedido: string; aoPublicar?: () => void }) {
  const [texto, setTexto] = useState('')
  const [estado, setEstado] = useState<'escrevendo' | 'enviando' | 'no_ar' | 'erro'>('escrevendo')
  const [erro, setErro] = useState('')
  const t = texto.replace(/\s+/g, ' ').trim()
  const enviar = async () => {
    if (t.length < 4 || estado === 'enviando') return
    if (!window.confirm(tr(`Pôr no ar agora, por 24 h?\n\n"${t}"`, `Go live now, for 24 h?\n\n"${t}"`))) return
    setEstado('enviando')
    const { data, error } = await supabase.rpc('esc_mp_anuncio_giro', { p_id: pedido, p_texto: t })
    if (!error && data === 'ok') { setEstado('no_ar'); logApoio(`📣 anúncio no ar: ${t}`); releAnuncios(); aoPublicar?.() }
    else if (data === 'ja_tem') { setEstado('no_ar') }
    else { setEstado('erro'); setErro(data === 'sem_pedido' ? tr('O pagamento ainda não foi confirmado. Espere uns segundos e tente de novo.', 'Payment not confirmed yet. Wait a few seconds and try again.') : tr('Não deu pra pôr no ar. Tente de novo.', 'Couldn’t go live. Try again.')) }
  }
  if (estado === 'no_ar') return (
    <div className="mt-3 rounded-xl p-3 text-left" style={{ background: CREAM, color: INK, border: `2px solid ${INK}` }}>
      <p className="font-black uppercase text-[16px]" style={{ ...OSW, color: GREEN }}>{tr('📣 Seu anúncio está no ar!', '📣 Your ad is live!')}</p>
      <p className="text-[12.5px] font-bold mt-1 leading-snug">{tr('Ele passa no letreiro "Anúncio do dia" de todas as salas pelas próximas 24 h, revezando com os outros anúncios.', 'It runs on the "Ad of the day" ticker in every room for the next 24 h, taking turns with the other ads.')}</p>
    </div>
  )
  return (
    <div className="mt-3 rounded-xl p-3 text-left" style={{ background: CREAM, color: INK, border: `2px solid ${INK}` }}>
      <p className="font-black uppercase text-[16px]" style={OSW}>{tr('📣 Escreva o seu anúncio', '📣 Write your ad')}</p>
      <p className="text-[11.5px] font-bold mt-1 leading-snug">{tr(`Até ${ANUNCIO_MAX} letras. Ex.: "Sua marca · Oferta do dia: … · @seuinsta". Ele entra no ar assim que você confirmar e fica 24 h.`, `Up to ${ANUNCIO_MAX} characters. E.g. "Your brand · Deal of the day: … · @yourinsta". It goes live as soon as you confirm and stays 24 h.`)}</p>
      <textarea value={texto} onChange={e => setTexto(e.target.value.slice(0, ANUNCIO_MAX))} maxLength={ANUNCIO_MAX} rows={2}
        className="w-full mt-2 rounded-lg p-2 text-[13px] font-bold" style={{ border: `2px solid ${INK}`, background: '#fff', color: INK, resize: 'none' }} />
      <div className="flex items-center justify-between mt-1 text-[11px] font-bold" style={{ color: 'rgba(12,12,12,.55)' }}>
        <span>{t.length}/{ANUNCIO_MAX}</span>
        {t.length >= 4 && <span style={{ background: '#0a0a0a', color: '#5CFF8A', fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 6, maxWidth: '75%', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>📣 {t}</span>}
      </div>
      {estado === 'erro' && <p className="text-[11.5px] font-black mt-1" style={{ color: '#C2452F' }}>{erro}</p>}
      <button disabled={t.length < 4 || estado === 'enviando'} onClick={enviar} className="w-full rounded-xl py-2 mt-2 text-[16px] uppercase"
        style={{ ...OSW, background: t.length < 4 ? '#ccc' : GREEN, color: '#fff', border: `3px solid ${INK}`, boxShadow: `3px 3px 0 ${INK}` }}>{estado === 'enviando' ? tr('⏳ pondo no ar…', '⏳ going live…') : tr('✅ OK, pôr no ar', '✅ OK, go live')}</button>
    </div>
  )
}

/** 📣 quem pagou o anúncio e fechou a tela antes de escrever: a Loja mostra o campo de novo (o pedido fica guardado no servidor) */
export function AnunciosPendentes() {
  const [ids, setIds] = useState<string[]>([])
  useEffect(() => { supabase.rpc('esc_mp_anuncio_pendente').then(({ data }) => setIds(Array.isArray(data) ? (data as unknown[]).map(String) : []), () => {}) }, [])
  if (!ids.length) return null
  return <>{ids.map(id => <EscreveAnuncio key={id} pedido={id} />)}</>
}

/** ⚡ Dia da marca (16/10, Diego: "precisa passar meu telefone pra eles entrarem em contato após pagar"): o Diego combina o
 *  dia, o nome, a bio e o cupom pelo WhatsApp. Nada vai pro ar sem ele aprovar. */
function ContatoDiego({ pedido, produto }: { pedido: string; produto: ProdutoMp }) {
  const giro = produto === 'giro_dia' // 📣 anúncio no giro (16/10): mesmo caminho, só muda o que a pessoa manda
  const msg = giro
    ? tr(`Oi Diego! Paguei o 📣 Anúncio no giro no Leilão Legends (pedido ${pedido.slice(0, 8)}). Meu texto é: ____`, `Hi Diego! I paid the 📣 Ticker ad on Leilão Legends (order ${pedido.slice(0, 8)}). My text is: ____`)
    : tr(`Oi Diego! Paguei o ⚡ Dia da marca no Leilão Legends (pedido ${pedido.slice(0, 8)}). Minha marca é: ____`, `Hi Diego! I paid the ⚡ Brand day on Leilão Legends (order ${pedido.slice(0, 8)}). My brand is: ____`)
  return (
    <div className="mt-3 rounded-xl p-3 text-left" style={{ background: CREAM, border: `2px solid ${INK}` }}>
      <p className="font-black uppercase text-[16px]" style={OSW}>{tr('📲 Fala com o Diego', '📲 Talk to Diego')}</p>
      <p className="text-[12.5px] font-bold mt-1 leading-snug">{giro
        ? tr(`WhatsApp ${WHATSAPP_TXT}. Manda o texto do anúncio (uma frase curta) e o dia que você quer. Ele confere e coloca no ar.`, `WhatsApp ${WHATSAPP_TXT}. Send the ad text (one short line) and the day you want. He checks it and puts it live.`)
        : tr(`WhatsApp ${WHATSAPP_TXT}. Manda o nome da marca, uma bio curta, o Instagram e o cupom (se tiver). Ele combina o dia com você.`, `WhatsApp ${WHATSAPP_TXT}. Send your brand name, a short bio, Instagram and a coupon (if any). He’ll set the day with you.`)}</p>
      <div className="flex gap-2 mt-2">
        <a href={`https://wa.me/${WHATSAPP_CONTATO}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer" className="flex-1 rounded-xl py-2 text-center text-[14px] uppercase" style={{ ...OSW, background: '#25D366', color: '#fff', border: `3px solid ${INK}`, boxShadow: `3px 3px 0 ${INK}` }}>📲 WhatsApp</a>
        <a href="https://instagram.com/leilaolegendscom" target="_blank" rel="noreferrer" className="flex-1 rounded-xl py-2 text-center text-[14px] uppercase bg-white" style={{ ...OSW, border: `3px solid ${INK}`, boxShadow: `3px 3px 0 ${INK}` }}>📷 Instagram</a>
      </div>
    </div>
  )
}
