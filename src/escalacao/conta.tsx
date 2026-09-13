// ─── 💾 JANELA DE CONTA (Diego 16/08 — docs/plano-crescimento.md §1 e §2) ───
// Entrar/cadastrar SEM SAIR DO LUGAR. Antes disso, quem clicava em Carreira sem
// login era mandado pro LOBBY ONLINE (`GO_LOBBY_ONLINE`) — saía da carreira, via
// uma tela preta escrito "LEILÃO LEGENDS · ONLINE" e, depois de criar a conta,
// NADA a trazia de volta. Medido: 56% de quem joga nunca abre uma carreira, e
// quem abre volta 3× mais — então esse desvio custa caro.
//
// Esta janela abre POR CIMA (o fundo continua atrás, a pessoa vê que não saiu),
// o título fala do que ela está guardando (não de "online") e, ao terminar, ela
// volta exatamente pra onde estava.
//
// 📝 O FORMULÁRIO MUDOU (§2): antes pedia "Nome de técnico" ("Como te chamam?"),
// que virava o nome exibido no ranking — ou seja, a pessoa punha o nome DELA e
// aparecia como se fosse o time, e depois escolhia OUTRO nome pro clube na
// carreira. Dois nomes brigando. Agora é UM só: o nome do TIME. O nome da
// pessoa saiu — o jogo é sobre clube, não sobre gente.
import { useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { CampoSenha, erroSenhaNova } from './campo-senha'
import { supabase } from '../lib/supabase'
import { stripEmoji, emailProblema, logout } from './apoio'
import { nomeLivre, NOME_MSG } from './manto'
import { tr } from './lang' // 🌐 BR/EN do site

// Lista curta do perfil; não altera o catálogo de cores usado em outras telas.
const CLUBES_PRINCIPAIS = ['Atlético-MG', 'Botafogo', 'Corinthians', 'Cruzeiro', 'Flamengo', 'Fluminense', 'Grêmio', 'Internacional', 'Palmeiras', 'Santos', 'São Paulo', 'Vasco']

const INK = '#0C0C0C'
const GOLD = '#FFC400'
const GREEN = '#1B7A3D'
const PURPLE = '#7C3AED'
const OSWALD: React.CSSProperties = { fontFamily: 'Oswald, sans-serif' }

// Online, Minha conta e Carreira compartilham este formulário e a mesma sessão.
function erroAmigavel(msg: string): string {
  if (/rate.limit|too many requests|after.*seconds/i.test(msg)) return tr('Muitas tentativas em pouco tempo. Aguarde um pouco e tente novamente.', 'Too many attempts. Wait a little and try again.')
  if (/fetch|network|Failed to fetch|timeout|503|502|504/i.test(msg)) return tr('🔧 Estamos atualizando novidades no jogo! O servidor volta já já — dá uma passadinha daqui a pouquinho. 💛', '🔧 We are rolling out news to the game! The server will be right back — drop by again in a little while. 💛')
  if (msg === 'Invalid login credentials') return tr('Email ou senha incorretos.', 'Wrong e-mail or password.')
  if (/email not confirmed/i.test(msg)) return tr('Confirme seu email antes de entrar (olha a caixa de entrada ✉️).', 'Confirm your e-mail before signing in (check your inbox ✉️).')
  if (/already registered|already been registered/i.test(msg)) return tr('Esse e-mail já tem conta. Vai em ENTRAR ali em cima. 😉', 'That e-mail already has an account. Use SIGN IN up there. 😉')
  return msg
}

type Aba = 'entrar' | 'criar'

export interface JanelaContaProps {
  /** o que a pessoa está guardando — vira o subtítulo ("Lendas FC · Várzea · T1") */
  contexto?: string
  /** título da janela. Padrão fala de guardar carreira; o online passa o dele. */
  titulo?: string
  /** chamada quando a conta entra/nasce — quem chamou devolve a pessoa pro lugar dela */
  onPronto: () => void
  /** fechar sem fazer nada ("agora não") */
  onFechar: () => void
  /** abre já na aba de criar conta */
  comecarEmCriar?: boolean
}

export function JanelaConta({ contexto, titulo, onPronto, onFechar, comecarEmCriar }: JanelaContaProps) {
  const [aba, setAba] = useState<Aba>(comecarEmCriar ? 'criar' : 'entrar')
  const [time, setTime] = useState('')
  const [coracao, setCoracao] = useState<string | null>(null)
  const [outroClube, setOutroClube] = useState(false)
  const preferenciaRecebida = useRef('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [checandoSessao, setChecandoSessao] = useState(true)
  const [confirmarSaida, setConfirmarSaida] = useState(false)
  const ocupado = useRef(false)
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState('')
  const [carregando, setCarregando] = useState(false)
  // ✓/✗ do nome do time enquanto digita (a mesma trava do resto do jogo)
  const [nomeSit, setNomeSit] = useState<'vazio' | 'checando' | 'livre' | 'ocupado'>('vazio')
  // Preferência opcional fica no perfil; nunca atrasa o cadastro.
  const nomeSeq = useRef(0)

  useEffect(() => {
    let ativo = true
    let eventoRecebido = false
    const mostrar = (u: User | null) => {
      setUser(u); setChecandoSessao(false)
      const salvo = typeof u?.user_metadata?.time_coracao === 'string' ? u.user_metadata.time_coracao : null
      const chave = JSON.stringify([u?.id ?? null, salvo])
      // Renovar a sessão não apaga o nome que a pessoa ainda está digitando.
      if (preferenciaRecebida.current !== chave) {
        preferenciaRecebida.current = chave
        setCoracao(salvo)
        setOutroClube(!!salvo && !CLUBES_PRINCIPAIS.includes(salvo))
      }
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evento, sessao) => {
      if (!ativo) return
      eventoRecebido = true
      mostrar(sessao?.user ?? null)
    })
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!ativo || eventoRecebido) return
      if (error) setErro(erroAmigavel(error.message))
      mostrar(data.session?.user ?? null)
    }).catch(() => {
      if (ativo && !eventoRecebido) {
        setChecandoSessao(false)
        setErro(tr('Não consegui consultar sua conta. Feche e tente novamente.', 'Could not check your account. Close and try again.'))
      }
    })
    return () => { ativo = false; subscription.unsubscribe() }
  }, [])

  // 🔎 checa o nome enquanto digita, com respiro de 500ms pra não bater no
  // servidor a cada letra. `seq` garante que resposta atrasada não sobrescreve
  // uma checagem mais nova.
  useEffect(() => {
    const meu = ++nomeSeq.current
    if (aba !== 'criar' || user) { setNomeSit('vazio'); return }
    const nm = stripEmoji(time).trim()
    if (!nm) { setNomeSit('vazio'); return }
    setNomeSit('checando')
    const t = setTimeout(async () => {
      // no CADASTRO manda junto o e-mail digitado: é o que deixa o DONO do
      // batismo usar o nome do próprio clube (ver `nomeLivre`).
      const r = await nomeLivre(nm, aba === 'criar' ? email : undefined)
      if (nomeSeq.current !== meu) return
      setNomeSit(r.livre ? 'livre' : 'ocupado')
      if (!r.livre) setErro(NOME_MSG[r.motivo ?? 'em_uso'])
      else setErro(e => (e && /nome/i.test(e) ? '' : e))
    }, 500)
    return () => { clearTimeout(t); nomeSeq.current++ }
    // `email` e `aba` entram nas dependências de propósito: no cadastro a resposta
    // MUDA conforme o e-mail digitado (é o que libera o dono do batismo). Sem eles,
    // quem escrevesse o nome ANTES do e-mail ficava travado no ❌ na tela.
  }, [time, email, aba, user])

  async function enviar() {
    if (ocupado.current || checandoSessao || user) return
    ocupado.current = true
    setCarregando(true); setErro(''); setOk('')
    try {
      if (aba === 'entrar') {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
        if (error) { setErro(erroAmigavel(error.message)); setCarregando(false); return }
        if (!data.session) { setErro(tr('Não foi possível entrar. Tente novamente.', 'Could not sign in. Try again.')); return }
        setSenha(''); setConfirmacao(''); onPronto(); return
      }
      // ── criar conta ──
      const nm = stripEmoji(time).trim()
      if (!nm) { setErro(tr('Escolha o nome do seu time.', 'Choose your team name.')); setCarregando(false); return }
      const prob = emailProblema(email)
      if (prob) { setErro(prob); setCarregando(false); return }
      const problemaSenha = erroSenhaNova(senha, confirmacao)
      if (problemaSenha) { setErro(problemaSenha); return }
      // 🔒 nome único (tipo @ do Instagram, regra do Diego 10/08) — confere de
      // novo aqui, mesmo já tendo o ✓ na tela: entre digitar e enviar alguém
      // pode ter pegado o nome.
      const chk = await nomeLivre(nm, email)
      if (!chk.livre) { setErro(NOME_MSG[chk.motivo ?? 'em_uso']); setNomeSit('ocupado'); setCarregando(false); return }
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(), password: senha,
        // 🏷️ `display_name` continua sendo o campo do nome (é o que o ranking e
        // o resto do jogo já leem) — só que agora ele guarda o NOME DO TIME, não
        // o nome da pessoa. Quem já tinha conta não é tocado: o nome que ela já
        // tem passa a valer como nome do time (é o que já aparecia no ranking).
        options: { data: { display_name: nm } },
      })
      if (error) { setErro(erroAmigavel(error.message)); setCarregando(false); return }
      setSenha(''); setConfirmacao('')
      if (data.session) { onPronto(); return }
      setAba('entrar')
      setOk(tr('✉️ Confira seu e-mail para confirmar o cadastro. Depois, entre com sua senha para continuar.', '✉️ Check your e-mail to confirm registration. Then sign in with your password to continue.'))
    } catch (e) {
      setErro(erroAmigavel(e instanceof Error ? e.message : String(e)))
      setCarregando(false)
    } finally { ocupado.current = false; setCarregando(false) }
  }

  async function esqueci() {
    const em = email.trim().toLowerCase()
    if (!em) { setErro(tr('Digite seu e-mail aí em cima primeiro — aí eu mando o link.', 'Type your e-mail up there first — then I\'ll send the link.')); return }
    const prob = emailProblema(em)
    if (prob) { setErro(prob); return }
    if (ocupado.current) return
    ocupado.current = true; setCarregando(true); setErro(''); setOk('')
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(em, { redirectTo: window.location.origin + window.location.pathname })
      if (error) { setErro(erroAmigavel(error.message)); return }
      setOk(tr('✉️ Link de redefinição enviado. Olha a caixa de entrada (e o spam).', '✉️ Reset link sent. Check your inbox (and spam).'))
    } catch (e) { setErro(erroAmigavel(e instanceof Error ? e.message : String(e))) }
    finally { ocupado.current = false; setCarregando(false) }
  }

  async function salvarPerfil(sair = false) {
    if (ocupado.current || !user) return
    const clube = coracao?.trim().replace(/\s+/g, ' ') || null
    if (!sair && outroClube && !clube) { setErro(tr('Digite o nome do clube ou escolha Não informar.', 'Enter the club name or choose Prefer not to say.')); setOk(''); return }
    if (!sair && clube && clube.length > 60) { setErro(tr('Use até 60 caracteres para o nome do clube.', 'Use up to 60 characters for the club name.')); setOk(''); return }
    ocupado.current = true; setCarregando(true); setErro(''); setOk('')
    try {
      const { error } = sair ? await logout() : await supabase.auth.updateUser({ data: { time_coracao: clube } })
      if (error) { setErro(erroAmigavel(error.message)); return }
      if (sair) {
        setUser(null); setEmail(''); setSenha(''); setConfirmacao(''); setConfirmarSaida(false); setAba('entrar')
      } else { setCoracao(clube); setOutroClube(!!clube && !CLUBES_PRINCIPAIS.includes(clube)); setOk(tr('Preferência salva na sua conta.', 'Preference saved to your account.')) }
    } catch (e) { setErro(erroAmigavel(e instanceof Error ? e.message : String(e))) }
    finally { ocupado.current = false; setCarregando(false) }
  }

  const campo: React.CSSProperties = { width: '100%', border: `2.5px solid ${INK}`, borderRadius: 10, padding: '9px 11px', fontWeight: 700, fontSize: 16, boxSizing: 'border-box', background: '#fff', color: INK, outline: 'none' }
  const rot: React.CSSProperties = { ...OSWALD, fontWeight: 800, fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: '#565656', margin: '0 0 3px' }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99991, background: 'rgba(12,12,12,.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '18px 14px 30px', overflowY: 'auto' }}>
      <div role="dialog" aria-modal="true" aria-label={titulo ?? tr('Sua conta', 'Your account')} style={{ flexShrink: 0, width: '100%', maxWidth: 420, background: '#fff', border: `4px solid ${INK}`, borderRadius: 20, boxShadow: `6px 6px 0 ${INK}`, overflow: 'hidden' }}>
        <div style={{ background: PURPLE, color: '#fff', padding: '11px 14px', borderBottom: `3px solid ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ ...OSWALD, fontWeight: 900, fontSize: 16, textTransform: 'uppercase' }}>{titulo ?? tr('💾 Guardar sua carreira', '💾 Save your career')}</span>
          <button onClick={onFechar} aria-label={tr('Fechar', 'Close')} style={{ background: 'rgba(255,255,255,.22)', border: 'none', color: '#fff', width: 26, height: 26, borderRadius: 999, fontWeight: 900, fontSize: 13, cursor: 'pointer', lineHeight: 1, flex: 'none' }}>✕</button>
        </div>

        <div style={{ padding: '13px 15px 16px' }}>
          {contexto && (
            <p style={{ margin: '0 0 10px', fontWeight: 800, fontSize: 13.5, color: 'rgba(12,12,12,.72)', lineHeight: 1.35 }}>
              <b style={{ color: INK }}>{contexto}</b>
            </p>
          )}

          {checandoSessao ? <p role="status" style={{ color: INK }}>{tr('Consultando sua conta…', 'Checking your account…')}</p> : user ? <>
            <p style={{ ...OSWALD, color: INK, fontSize: 22, fontWeight: 800, margin: '0 0 4px', overflowWrap: 'anywhere' }}>{user.user_metadata?.display_name || tr('Seu time', 'Your team')}</p>
            <p style={{ color: '#565656', fontSize: 14, overflowWrap: 'anywhere', margin: '0 0 14px' }}>{user.email}</p>
            <p style={{ color: INK, fontSize: 13 }}>{tr('Esta é sua conta no Online e na Carreira.', 'This is your account for Online and Career.')}</p>
            <label htmlFor="conta-coracao" style={rot}>{tr('Time de coração · opcional', 'Favorite team · optional')}</label>
            <select id="conta-coracao" disabled={carregando} value={outroClube ? '__outros__' : coracao ?? ''} onChange={e => {
              const outros = e.target.value === '__outros__'
              setOutroClube(outros); setCoracao(outros ? '' : e.target.value || null); setErro(''); setOk('')
            }} style={{ ...campo, margin: '5px 0 8px' }}>
              <option value="">{tr('Não informar', 'Prefer not to say')}</option>
              {CLUBES_PRINCIPAIS.map(nome => <option key={nome}>{nome}</option>)}
              <option value="__outros__">{tr('Outros', 'Other')}</option>
            </select>
            {outroClube && <div style={{ marginBottom: 8 }}>
              <label htmlFor="conta-outro-clube" style={rot}>{tr('Qual é o seu clube?', 'Which club do you support?')}</label>
              <input id="conta-outro-clube" autoFocus disabled={carregando} maxLength={60} value={coracao ?? ''}
                onChange={e => { setCoracao(e.target.value); setErro(''); setOk('') }}
                onKeyDown={e => { if (e.key === 'Enter') void salvarPerfil() }}
                placeholder={tr('Digite o nome do clube', 'Enter the club name')} style={campo} />
            </div>}
            <p style={{ fontSize: 12, color: '#565656', margin: '0 0 8px' }}>{tr('Toque em Salvar preferência para guardar na sua conta.', 'Tap Save preference to store it in your account.')}</p>
            <button disabled={carregando} onClick={() => void salvarPerfil()} style={{ ...campo, cursor: 'pointer', marginBottom: 12 }}>{tr('Salvar preferência', 'Save preference')}</button>
            {erro && <p role="alert" style={{ color: '#C2452F', fontWeight: 700 }}>{erro}</p>}
            {ok && <p role="status" style={{ color: GREEN, fontWeight: 700 }}>{ok}</p>}
            <button disabled={carregando} onClick={onPronto} style={{ ...campo, background: GOLD, cursor: 'pointer', ...OSWALD }}>{tr('Continuar →', 'Continue →')}</button>
            {confirmarSaida ? <div style={{ marginTop: 12, color: INK, fontSize: 13 }}>
              <p>{tr('Sair desta conta? Você precisará entrar novamente.', 'Sign out of this account? You will need to sign in again.')}</p>
              <button disabled={carregando} onClick={() => void salvarPerfil(true)} style={{ ...campo, cursor: 'pointer' }}>{tr('Confirmar saída', 'Confirm sign out')}</button>
              <button disabled={carregando} onClick={() => setConfirmarSaida(false)} style={{ ...campo, marginTop: 6 }}>{tr('Cancelar', 'Cancel')}</button>
            </div> : <button disabled={carregando} onClick={() => setConfirmarSaida(true)} style={{ color: '#565656', background: 'none', border: 0, textDecoration: 'underline', marginTop: 14, cursor: 'pointer' }}>{tr('Sair da conta', 'Sign out')}</button>}
          </> : <>
          <div style={{ display: 'flex', border: `2.5px solid ${INK}`, borderRadius: 10, overflow: 'hidden', marginBottom: 11 }}>
            {(['entrar', 'criar'] as Aba[]).map(a => (
              <button key={a} disabled={carregando} onClick={() => { setAba(a); setSenha(''); setConfirmacao(''); setErro(''); setOk('') }}
                style={{ flex: 1, padding: '7px 2px', ...OSWALD, fontWeight: 900, fontSize: 13, textTransform: 'uppercase', background: aba === a ? GOLD : '#fff', color: INK, border: 'none', cursor: 'pointer' }}>
                {a === 'entrar' ? tr('Entrar', 'Sign in') : tr('Criar conta', 'Create account')}
              </button>
            ))}
          </div>

          {aba === 'criar' && (
            <>
              <p style={rot}>{tr('Nome do seu time', 'Your team name')}</p>
              <div style={{ position: 'relative', marginBottom: 4 }}>
                <input aria-label={tr('Nome do seu time', 'Your team name')} autoComplete="nickname" value={time} onChange={e => setTime(e.target.value)} placeholder={tr('Ex.: Lendas FC', 'E.g.: Legends FC')} maxLength={28}
                  style={{ ...campo, paddingRight: 74, borderColor: nomeSit === 'livre' ? GREEN : nomeSit === 'ocupado' ? '#C2452F' : INK }} />
                <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', ...OSWALD, fontWeight: 900, fontSize: 12, textTransform: 'uppercase', color: nomeSit === 'livre' ? GREEN : nomeSit === 'ocupado' ? '#C2452F' : 'rgba(12,12,12,.35)' }}>
                  {nomeSit === 'livre' ? tr('✓ livre', '✓ free') : nomeSit === 'ocupado' ? tr('✕ em uso', '✕ taken') : nomeSit === 'checando' ? '…' : ''}
                </span>
              </div>
              <p style={{ margin: '0 0 10px', fontSize: 11.5, fontWeight: 700, color: 'rgba(12,12,12,.45)' }}>{tr('É o nome que aparece no ranking. Só pode existir um de cada.', 'It is the name that shows in the ranking. There can only be one of each.')}</p>


            </>
          )}

          <p style={rot}>E-mail</p>
          <input type="email" aria-label="E-mail" autoComplete="email" autoCapitalize="none" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" style={{ ...campo, marginBottom: 9 }} />

          <CampoSenha label={tr('Senha', 'Password')} value={senha} onChange={setSenha} nova={aba === 'criar'} onEnter={() => void enviar()} />
          {aba === 'criar' && <CampoSenha label={tr('Confirmar senha', 'Confirm password')} value={confirmacao} onChange={setConfirmacao} nova onEnter={() => void enviar()} />}

          {aba === 'entrar' && (
            <button disabled={carregando} onClick={esqueci} style={{ display: 'block', marginLeft: 'auto', background: 'none', border: 'none', textDecoration: 'underline', fontWeight: 700, fontSize: 12, color: 'rgba(12,12,12,.5)', cursor: 'pointer', marginBottom: 10 }}>
              {tr('Esqueci minha senha', 'Forgot my password')}
            </button>
          )}

          {erro && <p role="alert" style={{ margin: '0 0 9px', fontWeight: 800, fontSize: 13, color: '#C2452F', lineHeight: 1.35 }}>{erro}</p>}
          {ok && <p role="status" style={{ margin: '0 0 9px', fontWeight: 800, fontSize: 13, color: GREEN, lineHeight: 1.35 }}>{ok}</p>}

          <button onClick={enviar} disabled={carregando}
            style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 12, padding: 12, ...OSWALD, fontWeight: 900, fontSize: 16, textTransform: 'uppercase', background: carregando ? '#CBBF9E' : aba === 'entrar' ? GOLD : GREEN, color: aba === 'entrar' ? INK : '#fff', boxShadow: `4px 4px 0 ${INK}`, cursor: carregando ? 'default' : 'pointer' }}>
            {carregando ? '…' : aba === 'entrar' ? tr('Entrar →', 'Sign in →') : tr('Criar conta →', 'Create account →')}
          </button>

          <button onClick={onFechar} style={{ display: 'block', width: '100%', background: 'none', border: 'none', textDecoration: 'underline', fontWeight: 700, fontSize: 13, color: 'rgba(12,12,12,.45)', cursor: 'pointer', marginTop: 9 }}>
            {tr('agora não', 'not now')}
          </button>
          </>}
        </div>
      </div>
    </div>
  )
}
