// ─── 💙 CASA LUCA (05/11, mockups `scripts/mockups/casa-luca/*.png` telas 1·2·3·5·6·8, com as mudanças do Diego) ──────────
//
//  A) 💙 PLANO CORAÇÃO — 50% em TODOS os planos mensais, pra quem é PcD ou pai/mãe/responsável de criança especial, enquanto
//     pagar. A pessoa escolhe quem é, escolhe Carteirinha ou Laudo e manda UMA FOTO. A foto vai pro bucket PRIVADO
//     `coracao-provas` (só o Diego lê), o Diego aprova/recusa no #admin e a foto é APAGADA na hora (Edge Function
//     `coracao-decidir`). Fica só: conta · quem · tipo de prova · aprovado/recusado · data. Quem cobra a metade é o SERVIDOR
//     (`vendria-checkout` → `esc_coracao_tem_desconto`); a tela só mostra o preço.
//     Selo 💙 do lado do nome: opcional e DESLIGADO até a pessoa ligar; não diz "Plano Coração" em lugar nenhum.
//  B) 💙 DOAÇÃO PRO LUCA — Pix do Mercado Pago do jogo (produto `doacao_luca`, R$ 5 · 10 · 20 · outro valor, mínimo R$ 2). NÃO dá
//     nada no jogo. Depois de pago, a pessoa pode pôr o nome no MURAL. O mural nunca mostra valor, total nem contagem, e só
//     aparece com pelo menos 1 nome. Nada pula na tela: a doação só é achada pela Casa Luca (mapa) e pela 🛒 Loja.
//
// 🔌 Pra outra tela ligar: `abrirDoacaoLuca()` / `abrirPlanoCoracao()` (abrem por cima de tudo; devolvem false se a Casa Luca
// ainda está travada pra essa conta — aí o botão continua "em breve") e `<MuralLuca />`.
// 🔒 Trava: `useCasaLucaLiberada()` (sport.ts) + `esc_casa_luca_config.aberto` no banco.
import { useCallback, useEffect, useRef, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { supabase } from '../lib/supabase'
import { tr, getLang, useLang } from './lang'
import { logApoio, stripEmoji, defineSeloCoracao, recarregaDireitos, useDireitos } from './apoio'
import { precoTxt } from './planos-regras'
import { PixMP } from './pix-mp'
import { assinarMensal, type PlanoMensal } from './vendria-checkout'
import { casaLucaLiberada, useCasaLucaLiberada } from './sport'
import { DOACAO_VALORES, DOACAO_MIN, valorDoacao, refDoacao, precoMensal, muralParaTela, muralAparece, nomeMural, type LinhaMural } from './casa-luca-regras'

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', CREAM = '#F4ECD6', RED = '#C2452F'
const AZUL = '#2F6FD6', AZUL_ESC = '#1D4FB8', AZUL_CLARO = '#DCE9FF'
const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 700 } as const
const caixa: React.CSSProperties = { background: '#fff', border: `3px solid ${INK}`, borderRadius: 16, boxShadow: `4px 4px 0 ${INK}`, padding: 12 }
const titulo: React.CSSProperties = { ...OSW, fontSize: 18, textTransform: 'uppercase', margin: '18px 0 8px', letterSpacing: .3 }
const botao = (bg: string, cor = '#fff'): React.CSSProperties => ({ ...OSW, width: '100%', fontSize: 19, textTransform: 'uppercase', background: bg, color: cor, border: `3px solid ${INK}`, borderRadius: 14, boxShadow: `4px 4px 0 ${INK}`, padding: '12px 10px', cursor: 'pointer' })
const reais = (v: number) => precoTxt(v, getLang() === 'en')

// ─── abrir por cima de tudo (sem depender de quem chama montar nada) ────────────────────────────────────────────────
let raiz: Root | null = null, host: HTMLDivElement | null = null
function fechaTela() { const r = raiz, h = host; raiz = null; host = null; setTimeout(() => { r?.unmount(); h?.remove() }, 0) }
type ValorInicial = number | 'outro'
function abreTela(qual: 'doar' | 'coracao', valor?: ValorInicial): boolean {
  if (!casaLucaLiberada()) return false
  if (!host) { host = document.createElement('div'); document.body.appendChild(host); raiz = createRoot(host) }
  // a chave nova faz a tela nascer de novo com o valor escolhido (mesmo se já estava aberta)
  raiz!.render(<TelaCasaLuca key={`${qual}-${valor ?? ''}-${Date.now()}`} inicial={qual} valor={valor} onClose={fechaTela} />)
  logApoio(qual === 'doar' ? '💙 abriu a doação pro Luca' : '💙 abriu o Plano Coração')
  return true
}
/** 💙 abre a tela de doar pro Luca, opcionalmente já com o valor escolhido (5 · 10 · 20 · 'outro').
 *  false = ainda travada pra esta conta (o botão segue "em breve"). */
export function abrirDoacaoLuca(valor?: ValorInicial): boolean { return abreTela('doar', valor) }
/** 💙 abre a tela do Plano Coração. false = ainda travada pra esta conta. */
export function abrirPlanoCoracao(): boolean { return abreTela('coracao') }

function TelaCasaLuca({ inicial, valor, onClose }: { inicial: 'doar' | 'coracao'; valor?: ValorInicial; onClose: () => void }) {
  useLang() // re-renderiza no BR/EN
  const [aba, setAba] = useState(inicial)
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc)
  }, [onClose])
  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 100001, background: CREAM, color: INK, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 3, background: INK, padding: '11px 15px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ ...OSW, fontSize: 17, textTransform: 'uppercase', color: '#8DB8FF' }}>💙 Casa Luca</span>
        <button onClick={onClose} aria-label={tr('fechar', 'close')} style={{ marginLeft: 'auto', background: 'transparent', color: '#fff', border: '2px solid rgba(255,255,255,.35)', borderRadius: 10, padding: '4px 10px', fontWeight: 900, cursor: 'pointer' }}>✕</button>
      </div>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '14px 16px 40px', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: `3px solid ${INK}`, borderRadius: 14, overflow: 'hidden', boxShadow: `3px 3px 0 ${INK}` }}>
          {(['doar', 'coracao'] as const).map(a => <button key={a} onClick={() => setAba(a)} style={{ ...OSW, fontSize: 14, textTransform: 'uppercase', padding: '10px 6px', border: 'none', cursor: 'pointer', background: aba === a ? INK : '#fff', color: aba === a ? '#8DB8FF' : INK }}>
            {a === 'doar' ? tr('💙 Ajudar o Luca', '💙 Help Luca') : tr('💙 Plano Coração', '💙 Heart Plan')}
          </button>)}
        </div>
        {aba === 'doar' ? <DoacaoLuca inicial={valor} /> : <PlanoCoracao />}
        <p style={{ textAlign: 'center', marginTop: 20 }}><button onClick={onClose} style={{ background: 'none', border: 'none', textDecoration: 'underline', fontWeight: 900, fontSize: 12, color: 'rgba(12,12,12,.5)', cursor: 'pointer' }}>{tr('fechar', 'close')}</button></p>
      </div>
    </div>
  )
}

// ─── B) DOAÇÃO ──────────────────────────────────────────────────────────────────────────────────────────────────────
export function DoacaoLuca({ inicial }: { inicial?: ValorInicial } = {}) {
  const [escolha, setEscolha] = useState<number | 'outro'>(inicial === 'outro' || (typeof inicial === 'number' && inicial > 0) ? inicial : 10)
  const [outro, setOutro] = useState('')
  const [pago, setPago] = useState<string | null>(null)
  const valor = escolha === 'outro' ? valorDoacao(outro) : escolha
  const [logado, setLogado] = useState<boolean | null>(null)
  useEffect(() => { supabase.auth.getSession().then(({ data }) => setLogado(!!data.session), () => setLogado(false)) }, [])
  const opc = (ativo: boolean): React.CSSProperties => ({ ...OSW, fontSize: 26, padding: '14px 6px', background: ativo ? AZUL : '#fff', color: ativo ? '#fff' : INK, border: `3px solid ${ativo ? AZUL_ESC : INK}`, borderRadius: 14, boxShadow: `4px 4px 0 ${ativo ? AZUL_ESC : INK}`, cursor: 'pointer' })
  return <div>
    <h1 style={{ ...OSW, fontSize: 30, textTransform: 'uppercase', margin: '16px 0 2px', lineHeight: 1.05 }}>💙 {tr('Ajudar o Luca', 'Help Luca')}</h1>
    <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(12,12,12,.65)', margin: 0 }}>{tr('Pix na hora. Qualquer valor ajuda.', 'Instant Pix. Any amount helps.')}</p>
    <div style={{ ...caixa, background: AZUL_CLARO, borderColor: AZUL_ESC, boxShadow: `4px 4px 0 ${AZUL_ESC}`, marginTop: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
      <span style={{ fontSize: 34 }}>🤝</span>
      <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800, lineHeight: 1.35 }}>{tr('O Luca é o filho do Diego, o criador do Leilão Legends. A sua doação vai pra ele.', 'Luca is the son of Diego, who created Leilão Legends. Your donation goes to him.')}</p>
    </div>

    {pago ? <>
      <div style={{ ...caixa, marginTop: 14, textAlign: 'center' }}>
        <div style={{ fontSize: 46, lineHeight: 1 }}>💙</div>
        <p style={{ ...OSW, fontSize: 22, textTransform: 'uppercase', color: GREEN, margin: '6px 0 2px' }}>{tr('Obrigado de coração!', 'Thank you from the heart!')}</p>
        <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>{tr('Sua ajuda chegou.', 'Your help arrived.')}</p>
      </div>
      <AssinaMural pedido={pago} />
    </> : <>
      <h2 style={titulo}>💰 {tr('Quanto?', 'How much?')}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {DOACAO_VALORES.map(v => <button key={v} onClick={() => setEscolha(v)} style={opc(escolha === v)}>{reais(v)}</button>)}
        <button onClick={() => setEscolha('outro')} style={{ ...opc(escolha === 'outro'), fontSize: 18 }}>{tr('Outro valor', 'Other amount')}</button>
      </div>
      {escolha === 'outro' && <div style={{ marginTop: 12 }}>
        <input inputMode="decimal" value={outro} onChange={e => setOutro(e.target.value.slice(0, 10))} placeholder={tr(`Valor em R$ (mínimo ${DOACAO_MIN})`, `Amount in R$ (minimum ${DOACAO_MIN})`)} autoFocus
          style={{ width: '100%', boxSizing: 'border-box', ...OSW, fontSize: 22, border: `3px solid ${INK}`, borderRadius: 12, padding: '10px 12px', background: '#fff' }} />
        {outro.trim() !== '' && valor == null && <p style={{ fontSize: 12, fontWeight: 900, color: RED, margin: '6px 2px 0' }}>{tr(`O mínimo é ${reais(DOACAO_MIN)}.`, `The minimum is ${reais(DOACAO_MIN)}.`)}</p>}
      </div>}

      <p style={{ fontSize: 12.5, fontWeight: 800, margin: '14px 2px 0', lineHeight: 1.4 }}>⚖️ {tr('A doação não dá nada no jogo: nem selo, nem moeda, nem vantagem. É só carinho.', 'Donating gives nothing in the game: no badge, no coins, no edge. It is just kindness.')}</p>
      <p style={{ fontSize: 12, fontWeight: 700, margin: '4px 2px 0', color: 'rgba(12,12,12,.6)', lineHeight: 1.4 }}>🧱 {tr('Depois de pagar, se quiser, você põe seu nome no mural de agradecimento. Ninguém vê quanto você doou.', 'After paying, if you want, you can add your name to the thank-you wall. Nobody sees how much you gave.')}</p>

      <div style={{ marginTop: 14 }}>
        {logado === false ? <p style={{ ...caixa, fontSize: 13, fontWeight: 800, margin: 0 }}>{tr('Entre na sua conta pra gerar o Pix.', 'Sign in to create the Pix.')}</p>
          : valor != null ? <PixMP key={refDoacao(valor)} produto="doacao_luca" refId={refDoacao(valor)} valor={valor} aoPagar={p => { setPago(p); logApoio('💙 doação pro Luca caiu') }} />
          : null}
      </div>
    </>}
    <MuralLuca />
  </div>
}

/** ✍️ depois de pagar: o nome no mural (opcional, sem valor) */
function AssinaMural({ pedido }: { pedido: string }) {
  const [nome, setNome] = useState('')
  const [fase, setFase] = useState<'pergunta' | 'enviando' | 'ok' | 'nao' | 'erro'>('pergunta')
  useEffect(() => { supabase.auth.getUser().then(({ data }) => { const n = stripEmoji(String(data?.user?.user_metadata?.display_name ?? '')).trim(); if (n) setNome(n.slice(0, 30)) }, () => {}) }, [])
  const limpo = nomeMural(nome)
  const envia = async () => {
    if (!limpo) return
    setFase('enviando')
    const { data, error } = await supabase.rpc('esc_luca_mural_assinar', { p_pedido: pedido, p_nome: limpo })
    setFase(!error && data === true ? 'ok' : 'erro')
    if (!error && data === true) avisaMural()
  }
  if (fase === 'nao') return null
  if (fase === 'ok') return <p style={{ ...caixa, marginTop: 12, fontSize: 13, fontWeight: 900, color: GREEN, textAlign: 'center' }}>🧱 {tr('Seu nome está no mural. Obrigado! 💙', 'Your name is on the wall. Thank you! 💙')}</p>
  return <div style={{ ...caixa, marginTop: 12 }}>
    <p style={{ ...OSW, fontSize: 16, textTransform: 'uppercase', margin: '0 0 2px' }}>🧱 {tr('Quer seu nome no mural?', 'Want your name on the wall?')}</p>
    <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(12,12,12,.6)', margin: '0 0 8px' }}>{tr('É opcional. Aparece só o nome e o dia, nunca o valor.', 'Optional. Only the name and the day show, never the amount.')}</p>
    <input value={nome} onChange={e => setNome(e.target.value.slice(0, 30))} placeholder={tr('Seu nome ou o do seu clube', 'Your name or your club’s')}
      style={{ width: '100%', boxSizing: 'border-box', fontSize: 15, fontWeight: 800, border: `3px solid ${INK}`, borderRadius: 12, padding: '9px 11px', background: '#fff' }} />
    {fase === 'erro' && <p style={{ fontSize: 12, fontWeight: 900, color: RED, margin: '6px 2px 0' }}>{tr('Não deu pra pôr esse nome. Tenta outro (sem link).', 'Couldn’t use that name. Try another (no links).')}</p>}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginTop: 10 }}>
      <button onClick={envia} disabled={!limpo || fase === 'enviando'} style={{ ...botao(AZUL), fontSize: 16, opacity: limpo ? 1 : .45 }}>{fase === 'enviando' ? '⏳' : tr('Pôr no mural', 'Add to the wall')}</button>
      <button onClick={() => setFase('nao')} style={{ background: 'none', border: 'none', fontWeight: 900, fontSize: 12.5, textDecoration: 'underline', color: 'rgba(12,12,12,.55)', cursor: 'pointer' }}>{tr('não, obrigado', 'no, thanks')}</button>
    </div>
  </div>
}

// ─── 🧱 MURAL ───────────────────────────────────────────────────────────────────────────────────────────────────────
const ouvintesMural = new Set<() => void>()
function avisaMural() { ouvintesMural.forEach(f => { try { f() } catch { /* ignora */ } }) }
const quando = (iso: string) => {
  const d = new Date(iso), hoje = new Date()
  const dia = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const dif = Math.round((dia(hoje) - dia(d)) / 864e5)
  if (dif <= 0) return tr('hoje', 'today')
  if (dif === 1) return tr('ontem', 'yesterday')
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}
/** 💙 "Obrigado a quem ajudou o Luca": só nome + data, por ordem de chegada, sem posição, sem valor, sem contagem.
 *  Não aparece NADA enquanto não tiver pelo menos 1 nome. `linhas` = só pra foto/teste (pula o banco). */
export function MuralLuca({ linhas, noCartao }: { linhas?: LinhaMural[]; noCartao?: boolean } = {}) {
  useLang()
  const liberada = useCasaLucaLiberada()
  const [lista, setLista] = useState<LinhaMural[]>(linhas ?? [])
  const [todos, setTodos] = useState(false)
  const carrega = useCallback(() => {
    if (linhas) return
    supabase.rpc('esc_luca_mural').then(({ data, error }) => { if (!error) setLista(muralParaTela(data)) }, () => {})
  }, [linhas])
  useEffect(() => { if (!liberada) return; carrega(); ouvintesMural.add(carrega); return () => { ouvintesMural.delete(carrega) } }, [carrega, liberada])
  // 🧱 05/11 (Diego): no cartão da Casa Luca o mural aparece SEMPRE — vazio, convida a ser o primeiro (sem número, sem contagem)
  if (noCartao) return <MuralNoCartao lista={muralAparece(lista) ? lista : []} />
  if ((!liberada && !linhas) || !muralAparece(lista)) return null
  const vis = todos ? lista : lista.slice(0, 12)
  return <div style={{ marginTop: 22 }}>
    <h2 style={{ ...titulo, margin: '0 0 8px' }}>🧱 {tr('Obrigado a quem ajudou o Luca 💙', 'Thank you to everyone who helped Luca 💙')}</h2>
    <div style={{ ...caixa, padding: 0, overflow: 'hidden' }}>
      {vis.map((l, i) => <div key={`${l.nome}-${l.criado_em}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderTop: i ? '2px solid #EEE7D3' : 'none' }}>
        <span style={{ width: 30, height: 30, borderRadius: 9, background: AZUL_CLARO, border: `2px solid ${AZUL_ESC}`, display: 'grid', placeItems: 'center', fontSize: 16, flex: 'none' }}>💙</span>
        <b style={{ flex: 1, minWidth: 0, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.nome}</b>
        <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(12,12,12,.5)', flex: 'none' }}>{quando(l.criado_em)}</span>
      </div>)}
      {lista.length > vis.length && <button onClick={() => setTodos(true)} style={{ width: '100%', border: 'none', borderTop: '2px solid #EEE7D3', background: '#fff', padding: '10px', fontWeight: 900, fontSize: 13, color: 'rgba(12,12,12,.6)', cursor: 'pointer' }}>{tr('ver todos ↓', 'see all ↓')}</button>}
    </div>
    <p style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(12,12,12,.55)', margin: '6px 2px 0' }}>{tr('Sem valor e sem posição: todo mundo igual. Quem chegou por último aparece primeiro.', 'No amounts and no ranking: everyone is equal. Newest first.')}</p>
  </div>
}

/** 🧱 o mural dentro do cartão do mapa: caixa compacta; sem nomes = "seja o primeiro". Só nome + data (nada de dinheiro nem contagem). */
function MuralNoCartao({ lista }: { lista: LinhaMural[] }) {
  const [todos, setTodos] = useState(false)
  const vis = todos ? lista : lista.slice(0, 6)
  return <div style={{ marginTop: 12, background: '#fff', border: `3px solid ${INK}`, borderRadius: 12, boxShadow: `3px 3px 0 ${INK}`, overflow: 'hidden' }}>
    <div style={{ ...OSW, fontSize: 15, textTransform: 'uppercase', padding: '8px 10px', background: AZUL_CLARO, borderBottom: `2px solid ${INK}`, color: '#1e3f86' }}>🧱 {tr('Mural de apoiadores', 'Supporters wall')}</div>
    {vis.length === 0
      ? <p style={{ margin: 0, padding: '12px 10px', fontSize: 14, fontWeight: 800, lineHeight: 1.35 }}>{tr('Seja o primeiro a ajudar o Luca 💙', 'Be the first to help Luca 💙')}</p>
      : vis.map((l, i) => <div key={`${l.nome}-${l.criado_em}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderTop: i ? '2px solid #EEE7D3' : 'none' }}>
        <span style={{ fontSize: 14, flex: 'none' }}>💙</span>
        <b style={{ flex: 1, minWidth: 0, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.nome}</b>
        <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(12,12,12,.5)', flex: 'none' }}>{quando(l.criado_em)}</span>
      </div>)}
    {lista.length > vis.length && <button type="button" onClick={() => setTodos(true)} style={{ width: '100%', border: 'none', borderTop: '2px solid #EEE7D3', background: '#fff', padding: 10, fontWeight: 900, fontSize: 13, color: 'rgba(12,12,12,.6)', cursor: 'pointer', margin: 0, boxShadow: 'none', borderRadius: 0 }}>{tr('ver todos ↓', 'see all ↓')}</button>}
  </div>
}

// ─── A) PLANO CORAÇÃO ───────────────────────────────────────────────────────────────────────────────────────────────
type Meu = { aberto: boolean; status: 'pedido' | 'aprovado' | 'recusado' | null; desde: string | null; selo: boolean }
export function PlanoCoracao({ previa }: { previa?: Meu } = {}) {
  useLang()
  const [meu, setMeu] = useState<Meu | null>(previa ?? null)
  const [form, setForm] = useState(false)
  const carrega = useCallback(() => {
    if (previa) return
    supabase.rpc('esc_coracao_meu').then(({ data, error }) => { if (!error && data) setMeu(data as Meu); else setMeu({ aberto: false, status: null, desde: null, selo: false }) }, () => {})
  }, [previa])
  useEffect(() => { carrega() }, [carrega])
  if (!meu) return <p style={{ marginTop: 20, fontWeight: 800, textAlign: 'center' }}>⏳</p>
  if (meu.status === 'aprovado') return <CoracaoAtivo meu={meu} onMuda={carrega} />
  if (form) return <PedidoCoracao onEnviado={() => { setForm(false); carrega() }} onVoltar={() => setForm(false)} />
  return <div>
    <div style={{ marginTop: 14, position: 'relative', overflow: 'hidden', background: `linear-gradient(160deg,#3B82F6,${AZUL_ESC})`, border: `3px solid ${INK}`, borderRadius: 18, boxShadow: `5px 5px 0 ${INK}`, padding: '18px 14px', textAlign: 'center', color: '#fff' }}>
      <div style={{ fontSize: 52, lineHeight: 1 }}>💙</div>
      <h1 style={{ ...OSW, fontSize: 38, textTransform: 'uppercase', margin: '4px 0 8px', lineHeight: 1, textShadow: `2px 2px 0 ${AZUL_ESC}` }}>{tr('Plano Coração', 'Heart Plan')}</h1>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        <span style={{ ...OSW, fontSize: 15, background: GOLD, color: INK, border: `3px solid ${INK}`, borderRadius: 10, padding: '3px 10px' }}>💙 50% OFF</span>
        <span style={{ ...OSW, fontSize: 15, background: '#fff', color: INK, border: `3px solid ${INK}`, borderRadius: 10, padding: '3px 10px' }}>{tr('📅 nos planos mensais', '📅 on monthly plans')}</span>
      </div>
      <p style={{ fontSize: 13.5, fontWeight: 800, margin: '10px 0 0' }}>{tr('Metade do preço enquanto você assinar.', 'Half price for as long as you subscribe.')}</p>
    </div>

    <h2 style={titulo}>👥 {tr('Pra quem é', 'Who it is for')}</h2>
    {([['♿', tr('Pessoa com deficiência (PcD)', 'Person with a disability')], ['👨‍👧', tr('Pai, mãe ou responsável de criança especial', 'Parent or caregiver of a child with special needs')]] as const).map(([e, t]) =>
      <div key={t} style={{ ...caixa, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}><span style={{ fontSize: 30 }}>{e}</span><b style={{ fontSize: 15 }}>{t}</b></div>)}

    <h2 style={titulo}>⭐ {tr('Quanto fica', 'What you pay')}</h2>
    <TabelaPrecos />
    <p style={{ fontSize: 12.5, fontWeight: 800, margin: '10px 2px 0' }}>🤫 {tr('Discreto: ninguém vê que é o Plano Coração. Só você sabe.', 'Discreet: nobody sees it is the Heart Plan. Only you know.')}</p>

    {meu.status === 'pedido' ? <div style={{ ...caixa, marginTop: 14, background: '#FFF3C4', textAlign: 'center' }}>
      <p style={{ ...OSW, fontSize: 18, textTransform: 'uppercase', margin: 0 }}>⏳ {tr('Pedido enviado', 'Request sent')}</p>
      <p style={{ fontSize: 13, fontWeight: 700, margin: '4px 0 0' }}>{tr('O Diego confere pessoalmente. Quando aprovar, o desconto aparece aqui.', 'Diego checks it personally. Once approved, the discount shows up here.')}</p>
    </div> : meu.aberto ? <>
      {meu.status === 'recusado' && <p style={{ ...caixa, marginTop: 14, fontSize: 12.5, fontWeight: 800, background: '#FFE3DC' }}>{tr('Seu último pedido não foi aprovado (a foto já foi apagada). Pode mandar outro documento.', 'Your last request was not approved (the photo was already deleted). You can send another document.')}</p>}
      <button onClick={() => setForm(true)} style={{ ...botao(AZUL), marginTop: 16 }}>💙 {tr('Pedir o Plano Coração', 'Request the Heart Plan')}</button>
    </> : <p style={{ ...caixa, marginTop: 14, fontSize: 13, fontWeight: 800 }}>{tr('Entre na sua conta pra pedir.', 'Sign in to request it.')}</p>}
  </div>
}

function TabelaPrecos({ assinar = false }: { assinar?: boolean }) {
  const direitos = useDireitos()
  const linhas: [PlanoMensal, string][] = [['craque_salas', tr('⭐ Craque Salas', '⭐ Star Rooms')], ['craque_completo', tr('⭐ Craque Completo', '⭐ Star Complete')]]
  return <div style={{ ...caixa, padding: 0, overflow: 'hidden' }}>
    {linhas.map(([pl, nome], i) => {
      const ja = direitos?.mensalPlano === pl
      return <div key={pl} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderTop: i ? '2px solid #EEE7D3' : 'none' }}>
        <b style={{ flex: 1, fontSize: 15 }}>{nome}</b>
        <s style={{ fontSize: 12.5, fontWeight: 800, color: 'rgba(12,12,12,.45)' }}>{reais(precoMensal(pl, false))}</s>
        {assinar && !ja
          ? <button onClick={() => { logApoio(`💙 Plano Coração → ${pl} (Vendria, metade)`); void assinarMensal(pl, tr) }} style={{ ...OSW, fontSize: 15, background: AZUL, color: '#fff', border: `2px solid ${INK}`, borderRadius: 9, boxShadow: `2px 2px 0 ${INK}`, padding: '5px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}>{reais(precoMensal(pl, true))}{tr('/mês', '/mo')}</button>
          : <b style={{ ...OSW, fontSize: 17, color: AZUL_ESC, whiteSpace: 'nowrap' }}>{ja ? tr('✅ assinando', '✅ subscribed') : `${reais(precoMensal(pl, true))}${tr('/mês', '/mo')}`}</b>}
      </div>
    })}
  </div>
}

function CoracaoAtivo({ meu, onMuda }: { meu: Meu; onMuda: () => void }) {
  const [selo, setSelo] = useState(meu.selo)
  const [salvando, setSalvando] = useState(false)
  const troca = async () => {
    if (salvando) return
    const novo = !selo
    setSalvando(true); setSelo(novo)
    const { data, error } = await supabase.rpc('esc_coracao_selo', { p_on: novo })
    setSalvando(false)
    if (error || data !== true) { setSelo(!novo); return }
    defineSeloCoracao(novo); onMuda()
  }
  const desde = meu.desde ? new Date(meu.desde) : null
  return <div>
    <div style={{ marginTop: 14, background: `linear-gradient(160deg,#3B82F6,${AZUL_ESC})`, border: `3px solid ${INK}`, borderRadius: 18, boxShadow: `5px 5px 0 ${INK}`, padding: '16px 14px', textAlign: 'center', color: '#fff' }}>
      <div style={{ fontSize: 44, lineHeight: 1 }}>💙</div>
      <p style={{ ...OSW, fontSize: 26, textTransform: 'uppercase', margin: '4px 0 2px' }}>{tr('Você tem o Plano Coração', 'You have the Heart Plan')}</p>
      <p style={{ fontSize: 13, fontWeight: 800, margin: 0 }}>{tr('50% em qualquer plano mensal, enquanto você assinar.', '50% off any monthly plan, for as long as you subscribe.')}{desde ? ` ${tr('Desde', 'Since')} ${String(desde.getMonth() + 1).padStart(2, '0')}/${desde.getFullYear()}.` : ''}</p>
    </div>
    <h2 style={titulo}>⭐ {tr('Assinar com o desconto', 'Subscribe with the discount')}</h2>
    <TabelaPrecos assinar />
    <p style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(12,12,12,.6)', margin: '6px 2px 0', lineHeight: 1.4 }}>{tr('O desconto já vem no pagamento: você paga a metade todo mês. Se você já assinava pelo preço cheio, fala com o Diego pra trocar.', 'The discount is already in the payment: you pay half every month. If you already subscribed at full price, talk to Diego to switch.')}</p>

    <h2 style={titulo}>💙 {tr('Seu selo', 'Your badge')}</h2>
    <div style={{ ...caixa }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <b style={{ fontSize: 15 }}>{tr('Mostrar meu selo 💙', 'Show my 💙 badge')}</b>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(12,12,12,.6)', margin: '2px 0 0', lineHeight: 1.35 }}>{tr('Um 💙 pequeno do lado do nome. Não diz nada do plano. Vale a partir da próxima sala.', 'A small 💙 next to your name. It says nothing about the plan. Shows from your next room.')}</p>
        </div>
        <button role="switch" aria-checked={selo} onClick={troca} disabled={salvando} style={{ width: 62, height: 36, borderRadius: 20, border: `3px solid ${INK}`, background: selo ? GREEN : '#ddd', position: 'relative', cursor: 'pointer', flex: 'none' }}>
          <span style={{ position: 'absolute', top: 3, left: selo ? 29 : 3, width: 24, height: 24, borderRadius: 12, background: '#fff', border: `2px solid ${INK}`, transition: 'left .15s' }} />
        </button>
      </div>
      <p style={{ fontSize: 12.5, fontWeight: 800, margin: '10px 0 0' }}>{tr('Fica assim:', 'Looks like:')} <span style={{ border: `2px solid ${INK}`, borderRadius: 9, padding: '2px 8px', background: CREAM }}>{tr('Seu Clube FC', 'Your Club FC')}{selo ? ' 💙' : ''}</span></p>
    </div>
  </div>
}

/** 📨 o formulário: quem é → documento → foto → privacidade → enviar */
function PedidoCoracao({ onEnviado, onVoltar }: { onEnviado: () => void; onVoltar: () => void }) {
  const [quem, setQuem] = useState<'pcd' | 'responsavel' | null>(null)
  const [prova, setProva] = useState<'carteirinha' | 'laudo'>('carteirinha')
  const [foto, setFoto] = useState<Blob | null>(null)
  const [previa, setPrevia] = useState<string | null>(null)
  const [nomeArq, setNomeArq] = useState('')
  const [fase, setFase] = useState<'editando' | 'enviando' | 'erro'>('editando')
  const [erro, setErro] = useState('')
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => () => { if (previa) URL.revokeObjectURL(previa) }, [previa])
  const escolheFoto = async (f: File | undefined) => {
    if (!f) return
    setErro('')
    try {
      const b = await reduzFoto(f)
      setFoto(b); setNomeArq(f.name); setPrevia(URL.createObjectURL(b))
    } catch { setErro(tr('Não deu pra ler essa foto. Tenta outra (JPG ou PNG).', 'Couldn’t read that photo. Try another (JPG or PNG).')) }
  }
  const pronto = !!quem && !!foto
  const envia = async () => {
    if (!pronto || fase === 'enviando') return
    setFase('enviando'); setErro('')
    const { data: s } = await supabase.auth.getSession()
    const uid = s.session?.user?.id
    if (!uid) { setErro(tr('Entre na sua conta pra mandar.', 'Sign in to send it.')); setFase('erro'); return }
    const path = `${uid}/${crypto.randomUUID()}.jpg`
    const up = await supabase.storage.from('coracao-provas').upload(path, foto!, { contentType: 'image/jpeg', upsert: false })
    if (up.error) { setErro(tr('A foto não subiu. Confere a internet e tenta de novo (até 4 fotos por dia).', 'The photo didn’t upload. Check your connection and try again (up to 4 photos a day).')); setFase('erro'); return }
    const { error } = await supabase.rpc('esc_coracao_pedir', { p_quem: quem, p_prova: prova, p_path: path })
    if (error) { setErro(/JA_PEDIU/.test(error.message) ? tr('Você já tem um pedido esperando.', 'You already have a request waiting.') : tr('Não deu pra mandar agora. Tenta de novo em instantes.', 'Couldn’t send it right now. Try again in a moment.')); setFase('erro'); return }
    logApoio(`💙 pediu o Plano Coração (${quem}, ${prova})`)
    recarregaDireitos()
    onEnviado()
  }
  const cartao = (ativo: boolean): React.CSSProperties => ({ ...caixa, position: 'relative', textAlign: 'center', cursor: 'pointer', padding: '14px 8px', background: ativo ? AZUL_CLARO : '#fff', borderColor: ativo ? AZUL_ESC : INK, boxShadow: `4px 4px 0 ${ativo ? AZUL_ESC : INK}` })
  const passo = (n: number, t: string) => <h2 style={{ ...titulo, display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 28, height: 28, borderRadius: 14, background: GOLD, border: `3px solid ${INK}`, display: 'grid', placeItems: 'center', fontSize: 15 }}>{n}</span>{t}</h2>
  return <div>
    <button onClick={onVoltar} style={{ marginTop: 12, background: 'none', border: 'none', fontWeight: 900, fontSize: 13, cursor: 'pointer', padding: 0 }}>‹ {tr('voltar', 'back')}</button>
    <h1 style={{ ...OSW, fontSize: 28, textTransform: 'uppercase', margin: '6px 0 2px', lineHeight: 1.05 }}>💙 {tr('Pedir o Plano Coração', 'Request the Heart Plan')}</h1>
    <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(12,12,12,.65)', margin: 0 }}>{tr('2 passos rápidos. Ninguém além do Diego vê.', '2 quick steps. Nobody but Diego sees it.')}</p>

    {passo(1, tr('Quem é você?', 'Who are you?'))}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {([['pcd', '♿', tr('Sou PcD', 'I have a disability')], ['responsavel', '👨‍👧', tr('Sou pai/mãe/ responsável', 'I am a parent/ caregiver')]] as const).map(([k, e, t]) =>
        <button key={k} onClick={() => setQuem(k)} style={cartao(quem === k)}>
          {quem === k && <span style={{ position: 'absolute', top: -10, right: -10, width: 28, height: 28, borderRadius: 14, background: GREEN, color: '#fff', border: `3px solid ${INK}`, display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 900 }}>✓</span>}
          <div style={{ fontSize: 34 }}>{e}</div>
          <b style={{ ...OSW, fontSize: 16, textTransform: 'uppercase', lineHeight: 1.1 }}>{t}</b>
        </button>)}
    </div>

    {passo(2, tr('Mande um documento', 'Send a document'))}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: `3px solid ${INK}`, borderRadius: 14, overflow: 'hidden' }}>
      {([['carteirinha', tr('🪪 Carteirinha', '🪪 ID card')], ['laudo', tr('📄 Laudo', '📄 Medical report')]] as const).map(([k, t]) =>
        <button key={k} onClick={() => setProva(k)} style={{ ...OSW, fontSize: 15, textTransform: 'uppercase', padding: '10px 6px', border: 'none', cursor: 'pointer', background: prova === k ? INK : '#fff', color: prova === k ? GOLD : INK }}>{t}</button>)}
    </div>
    <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(12,12,12,.6)', margin: '6px 2px 10px' }}>{prova === 'carteirinha'
      ? tr('CIPTEA, carteira PcD ou a carteirinha do seu estado/cidade.', 'CIPTEA, disability card or your state/city card.')
      : tr('Laudo médico com o nome e o CID (pode tapar o que quiser além disso).', 'Medical report with the name and diagnosis code (cover anything else you want).')}</p>
    <input ref={input} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { void escolheFoto(e.target.files?.[0]); e.target.value = '' }} />
    <button onClick={() => input.current?.click()} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: `3px dashed ${INK}`, borderRadius: 16, padding: 10, cursor: 'pointer', textAlign: 'left' }}>
      <span style={{ width: 84, height: 60, borderRadius: 10, border: `3px solid ${INK}`, background: previa ? `center/cover url(${previa})` : '#EEE7D3', display: 'grid', placeItems: 'center', fontSize: 26, flex: 'none' }}>{previa ? '' : '📷'}</span>
      <span style={{ minWidth: 0 }}>
        <b style={{ display: 'block', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{foto ? nomeArq : tr('Tirar ou escolher a foto', 'Take or pick the photo')}</b>
        <span style={{ fontSize: 12.5, fontWeight: 800, color: foto ? GREEN : 'rgba(12,12,12,.55)' }}>{foto ? tr('✓ pronta pra enviar · trocar foto', '✓ ready to send · change photo') : tr('uma foto só, nítida', 'just one clear photo')}</span>
      </span>
    </button>

    <div style={{ ...caixa, marginTop: 16, background: '#FFF3D6', borderColor: RED, boxShadow: `4px 4px 0 ${RED}` }}>
      <p style={{ ...OSW, fontSize: 18, textTransform: 'uppercase', color: RED, margin: '0 0 4px' }}>🔒 {tr('Sua privacidade', 'Your privacy')}</p>
      <p style={{ fontSize: 14, fontWeight: 800, margin: 0, lineHeight: 1.4 }}>{tr('Sua foto só é vista pelo Diego pra aprovar e é ', 'Your photo is only seen by Diego to approve it and is ')}<span style={{ background: RED, color: '#fff', borderRadius: 6, padding: '0 6px' }}>{tr('APAGADA', 'DELETED')}</span>{tr(' logo depois.', ' right after.')}</p>
      <p style={{ fontSize: 12.5, fontWeight: 700, margin: '6px 0 0', lineHeight: 1.4 }}>{tr('Fica guardado só: sua conta, PcD ou responsável, carteirinha ou laudo, aprovado ou não, e a data. Ninguém mais vê, e o seu nome no jogo não muda.', 'We keep only: your account, disability or caregiver, card or report, approved or not, and the date. Nobody else sees it, and your name in the game does not change.')}</p>
    </div>

    {erro && <p style={{ fontSize: 12.5, fontWeight: 900, color: RED, margin: '10px 2px 0' }}>{erro}</p>}
    <button onClick={envia} disabled={!pronto || fase === 'enviando'} style={{ ...botao(AZUL), marginTop: 16, opacity: pronto ? 1 : .45 }}>{fase === 'enviando' ? tr('⏳ Enviando…', '⏳ Sending…') : tr('Enviar pedido', 'Send request')}</button>
    {!pronto && <p style={{ fontSize: 11.5, fontWeight: 800, color: 'rgba(12,12,12,.5)', textAlign: 'center', margin: '6px 0 0' }}>{!quem ? tr('Escolha quem você é (passo 1).', 'Pick who you are (step 1).') : tr('Falta a foto do documento (passo 2).', 'The document photo is missing (step 2).')}</p>}
  </div>
}

/** 📷 a foto sai do aparelho já pequena (lado maior 1600 px, JPEG) — e, por ser redesenhada, sem os dados escondidos da câmera (GPS etc.) */
async function reduzFoto(f: File): Promise<Blob> {
  const url = URL.createObjectURL(f)
  try {
    const img = await new Promise<HTMLImageElement>((ok, falha) => { const i = new Image(); i.onload = () => ok(i); i.onerror = falha; i.src = url })
    const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight))
    const c = document.createElement('canvas')
    c.width = Math.max(1, Math.round(img.naturalWidth * k)); c.height = Math.max(1, Math.round(img.naturalHeight * k))
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
    const b = await new Promise<Blob | null>(ok => c.toBlob(ok, 'image/jpeg', 0.85))
    if (!b) throw Error('sem blob')
    return b
  } finally { URL.revokeObjectURL(url) }
}

/** 🛒 a seção da Loja do Clube (só com a trava aberta) */
export function CasaLucaNaLoja({ h2, sub, titulo }: { h2: React.CSSProperties; sub: React.CSSProperties; titulo?: string }) {
  const ok = useCasaLucaLiberada()
  if (!ok) return null
  const cartao: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', background: AZUL_CLARO, border: `3px solid ${INK}`, borderRadius: 14, boxShadow: `3px 3px 0 ${INK}`, padding: 10, cursor: 'pointer', marginBottom: 10 }
  return <>
    <h2 id="loja-casa-luca" style={h2}>{titulo ?? '💙 Casa Luca'} <span style={sub}>{tr('ajudar e ser ajudado', 'help and be helped')}</span></h2>
    <button onClick={() => abrirDoacaoLuca()} style={cartao}>
      <span style={{ fontSize: 30 }}>💙</span>
      <span style={{ flex: 1 }}><b style={{ ...OSW, fontSize: 16, textTransform: 'uppercase', display: 'block' }}>{tr('Ajudar o Luca', 'Help Luca')}</b><span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(12,12,12,.65)' }}>{tr('Pix de qualquer valor. Não dá nada no jogo: é só carinho.', 'A Pix of any amount. Gives nothing in the game: just kindness.')}</span></span>
      <span style={{ ...OSW, fontSize: 14, background: AZUL, color: '#fff', border: `2px solid ${INK}`, borderRadius: 9, padding: '5px 9px' }}>{tr('Doar', 'Give')}</span>
    </button>
    <button onClick={() => abrirPlanoCoracao()} style={cartao}>
      <span style={{ fontSize: 30 }}>♿</span>
      <span style={{ flex: 1 }}><b style={{ ...OSW, fontSize: 16, textTransform: 'uppercase', display: 'block' }}>{tr('Plano Coração · 50% OFF', 'Heart Plan · 50% OFF')}</b><span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(12,12,12,.65)' }}>{tr('Pra PcD e pais/responsáveis de criança especial, nos planos mensais.', 'For people with disabilities and parents/caregivers of children with special needs, on monthly plans.')}</span></span>
      <span style={{ ...OSW, fontSize: 14, background: '#fff', border: `2px solid ${INK}`, borderRadius: 9, padding: '5px 9px' }}>{tr('Ver', 'See')}</span>
    </button>
  </>
}
