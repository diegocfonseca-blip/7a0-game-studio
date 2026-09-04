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
import { supabase } from '../lib/supabase'
import { stripEmoji, emailProblema } from './apoio'
import { nomeLivre, NOME_MSG } from './manto'
import { CORACAO_CLUBES } from './coracao'

const INK = '#0C0C0C'
const GOLD = '#FFC400'
const GREEN = '#1B7A3D'
const PURPLE = '#7C3AED'
const OSWALD: React.CSSProperties = { fontFamily: 'Oswald, sans-serif' }

// mesma tradução de erro do lobby (duplicada de propósito: o caminho de login do
// lobby está no ar e não vai ser mexido agora — ver plano-crescimento.md).
function erroAmigavel(msg: string): string {
  if (/fetch|network|Failed to fetch|timeout|503|502|504/i.test(msg)) return '🔧 Estamos atualizando novidades no jogo! O servidor volta já já — dá uma passadinha daqui a pouquinho. 💛'
  if (msg === 'Invalid login credentials') return 'Email ou senha incorretos.'
  if (/email not confirmed/i.test(msg)) return 'Confirme seu email antes de entrar (olha a caixa de entrada ✉️).'
  if (/already registered|already been registered/i.test(msg)) return 'Esse e-mail já tem conta. Vai em ENTRAR ali em cima. 😉'
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
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState('')
  const [carregando, setCarregando] = useState(false)
  // ✓/✗ do nome do time enquanto digita (a mesma trava do resto do jogo)
  const [nomeSit, setNomeSit] = useState<'vazio' | 'checando' | 'livre' | 'ocupado'>('vazio')
  // 📱 a lista inteira são 40 clubes — no celular isso empurra e-mail e senha
  // pra fora da tela. Mostra os primeiros e abre o resto só se pedir.
  const [todosClubes, setTodosClubes] = useState(false)
  const nomeSeq = useRef(0)

  // 🔎 checa o nome enquanto digita, com respiro de 500ms pra não bater no
  // servidor a cada letra. `seq` garante que resposta atrasada não sobrescreve
  // uma checagem mais nova.
  useEffect(() => {
    const nm = stripEmoji(time).trim()
    if (!nm) { setNomeSit('vazio'); return }
    setNomeSit('checando')
    const meu = ++nomeSeq.current
    const t = setTimeout(async () => {
      // no CADASTRO manda junto o e-mail digitado: é o que deixa o DONO do
      // batismo usar o nome do próprio clube (ver `nomeLivre`).
      const r = await nomeLivre(nm, aba === 'criar' ? email : undefined)
      if (nomeSeq.current !== meu) return
      setNomeSit(r.livre ? 'livre' : 'ocupado')
      if (!r.livre) setErro(NOME_MSG[r.motivo ?? 'em_uso'])
      else setErro(e => (e && /nome/i.test(e) ? '' : e))
    }, 500)
    return () => clearTimeout(t)
    // `email` e `aba` entram nas dependências de propósito: no cadastro a resposta
    // MUDA conforme o e-mail digitado (é o que libera o dono do batismo). Sem eles,
    // quem escrevesse o nome ANTES do e-mail ficava travado no ❌ na tela.
  }, [time, email, aba])

  async function enviar() {
    setCarregando(true); setErro(''); setOk('')
    try {
      if (aba === 'entrar') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
        if (error) { setErro(erroAmigavel(error.message)); setCarregando(false); return }
        setCarregando(false); onPronto(); return
      }
      // ── criar conta ──
      const nm = stripEmoji(time).trim()
      if (!nm) { setErro('Escolha o nome do seu time.'); setCarregando(false); return }
      const prob = emailProblema(email)
      if (prob) { setErro(prob); setCarregando(false); return }
      if (senha.length < 6) { setErro('A senha precisa de pelo menos 6 letras/números.'); setCarregando(false); return }
      // 🔒 nome único (tipo @ do Instagram, regra do Diego 10/08) — confere de
      // novo aqui, mesmo já tendo o ✓ na tela: entre digitar e enviar alguém
      // pode ter pegado o nome.
      const chk = await nomeLivre(nm, email)
      if (!chk.livre) { setErro(NOME_MSG[chk.motivo ?? 'em_uso']); setNomeSit('ocupado'); setCarregando(false); return }
      const { error } = await supabase.auth.signUp({
        email: email.trim(), password: senha,
        // 🏷️ `display_name` continua sendo o campo do nome (é o que o ranking e
        // o resto do jogo já leem) — só que agora ele guarda o NOME DO TIME, não
        // o nome da pessoa. Quem já tinha conta não é tocado: o nome que ela já
        // tem passa a valer como nome do time (é o que já aparecia no ranking).
        options: { data: { display_name: nm, ...(coracao ? { time_coracao: coracao } : {}) } },
      })
      if (error) { setErro(erroAmigavel(error.message)); setCarregando(false); return }
      setOk('✅ Conta criada! Guarde bem esse e-mail — é ele que recupera sua senha.')
      setCarregando(false)
      onPronto()
    } catch (e) {
      setErro(erroAmigavel(e instanceof Error ? e.message : String(e)))
      setCarregando(false)
    }
  }

  async function esqueci() {
    const em = email.trim().toLowerCase()
    if (!em) { setErro('Digite seu e-mail aí em cima primeiro — aí eu mando o link.'); return }
    const prob = emailProblema(em)
    if (prob) { setErro(prob); return }
    try {
      await supabase.auth.resetPasswordForEmail(em, { redirectTo: window.location.origin })
      setOk('✉️ Link de redefinição enviado. Olha a caixa de entrada (e o spam).')
    } catch (e) { setErro(erroAmigavel(e instanceof Error ? e.message : String(e))) }
  }

  const campo: React.CSSProperties = { width: '100%', border: `2.5px solid ${INK}`, borderRadius: 10, padding: '9px 11px', fontWeight: 700, fontSize: 15, background: '#fff', color: INK, outline: 'none' }
  const rot: React.CSSProperties = { ...OSWALD, fontWeight: 800, fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(12,12,12,.45)', margin: '0 0 3px' }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99991, background: 'rgba(12,12,12,.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '18px 14px 30px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#fff', border: `4px solid ${INK}`, borderRadius: 20, boxShadow: `6px 6px 0 ${INK}`, overflow: 'hidden' }}>
        <div style={{ background: PURPLE, color: '#fff', padding: '11px 14px', borderBottom: `3px solid ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ ...OSWALD, fontWeight: 900, fontSize: 16, textTransform: 'uppercase' }}>{titulo ?? '💾 Guardar sua carreira'}</span>
          <button onClick={onFechar} aria-label="Fechar" style={{ background: 'rgba(255,255,255,.22)', border: 'none', color: '#fff', width: 26, height: 26, borderRadius: 999, fontWeight: 900, fontSize: 13, cursor: 'pointer', lineHeight: 1, flex: 'none' }}>✕</button>
        </div>

        <div style={{ padding: '13px 15px 16px' }}>
          {contexto && (
            <p style={{ margin: '0 0 10px', fontWeight: 800, fontSize: 13.5, color: 'rgba(12,12,12,.72)', lineHeight: 1.35 }}>
              <b style={{ color: INK }}>{contexto}</b>
            </p>
          )}

          <div style={{ display: 'flex', border: `2.5px solid ${INK}`, borderRadius: 10, overflow: 'hidden', marginBottom: 11 }}>
            {(['entrar', 'criar'] as Aba[]).map(a => (
              <button key={a} onClick={() => { setAba(a); setErro(''); setOk('') }}
                style={{ flex: 1, padding: '7px 2px', ...OSWALD, fontWeight: 900, fontSize: 13, textTransform: 'uppercase', background: aba === a ? GOLD : '#fff', color: INK, border: 'none', cursor: 'pointer' }}>
                {a === 'entrar' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>

          {aba === 'criar' && (
            <>
              <p style={rot}>Nome do seu time</p>
              <div style={{ position: 'relative', marginBottom: 4 }}>
                <input value={time} onChange={e => setTime(e.target.value)} placeholder="Ex.: Lendas FC" maxLength={28}
                  style={{ ...campo, paddingRight: 74, borderColor: nomeSit === 'livre' ? GREEN : nomeSit === 'ocupado' ? '#C2452F' : INK }} />
                <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', ...OSWALD, fontWeight: 900, fontSize: 12, textTransform: 'uppercase', color: nomeSit === 'livre' ? GREEN : nomeSit === 'ocupado' ? '#C2452F' : 'rgba(12,12,12,.35)' }}>
                  {nomeSit === 'livre' ? '✓ livre' : nomeSit === 'ocupado' ? '✕ em uso' : nomeSit === 'checando' ? '…' : ''}
                </span>
              </div>
              <p style={{ margin: '0 0 10px', fontSize: 11.5, fontWeight: 700, color: 'rgba(12,12,12,.45)' }}>É o nome que aparece no ranking. Só pode existir um de cada.</p>

              <p style={rot}>Time de coração</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
                {(todosClubes ? CORACAO_CLUBES : CORACAO_CLUBES.slice(0, 12)).map(c => (
                  <button key={c.nome} onClick={() => setCoracao(cor => cor === c.nome ? null : c.nome)}
                    style={{ border: `2px solid ${INK}`, borderRadius: 8, padding: '4px 9px', fontWeight: 800, fontSize: 11.5, cursor: 'pointer', background: coracao === c.nome ? INK : '#fff', color: coracao === c.nome ? '#fff' : INK }}>
                    {c.nome}
                  </button>
                ))}
                {!todosClubes && (
                  <button onClick={() => setTodosClubes(true)}
                    style={{ border: `2px dashed ${INK}`, borderRadius: 8, padding: '4px 9px', fontWeight: 800, fontSize: 11.5, cursor: 'pointer', background: '#F4F1E6', color: INK }}>
                    ⋯ mais times
                  </button>
                )}
              </div>
              {/* ⚠️ AQUI NÃO PROMETE MANTO (Diego 16/08: "não quero que coloque
                  cores de manto que isso é dos sócios apenas"). Escolher o time
                  de coração NÃO pinta o clube de ninguém — as cores do manto
                  continuam sendo regalia de SÓCIO. Este campo é só pra saber de
                  quem é a torcida da casa; por isso o texto abaixo não fala em
                  nenhum prêmio, e é opcional. */}
              <p style={{ margin: '0 0 10px', fontSize: 11.5, fontWeight: 700, color: 'rgba(12,12,12,.45)' }}>
                Opcional — é só pra gente saber de que time é a torcida daqui. 💚
              </p>
            </>
          )}

          <p style={rot}>E-mail</p>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" style={{ ...campo, marginBottom: 9 }} />

          <p style={rot}>Senha</p>
          <input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••••••"
            onKeyDown={e => { if (e.key === 'Enter') enviar() }} style={{ ...campo, marginBottom: aba === 'entrar' ? 4 : 11 }} />

          {aba === 'entrar' && (
            <button onClick={esqueci} style={{ display: 'block', marginLeft: 'auto', background: 'none', border: 'none', textDecoration: 'underline', fontWeight: 700, fontSize: 12, color: 'rgba(12,12,12,.5)', cursor: 'pointer', marginBottom: 10 }}>
              Esqueci minha senha
            </button>
          )}

          {erro && <p style={{ margin: '0 0 9px', fontWeight: 800, fontSize: 13, color: '#C2452F', lineHeight: 1.35 }}>{erro}</p>}
          {ok && <p style={{ margin: '0 0 9px', fontWeight: 800, fontSize: 13, color: GREEN, lineHeight: 1.35 }}>{ok}</p>}

          <button onClick={enviar} disabled={carregando}
            style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 12, padding: 12, ...OSWALD, fontWeight: 900, fontSize: 16, textTransform: 'uppercase', background: carregando ? '#CBBF9E' : aba === 'entrar' ? GOLD : GREEN, color: aba === 'entrar' ? INK : '#fff', boxShadow: `4px 4px 0 ${INK}`, cursor: carregando ? 'default' : 'pointer' }}>
            {carregando ? '…' : aba === 'entrar' ? 'Entrar →' : 'Criar conta →'}
          </button>

          <button onClick={onFechar} style={{ display: 'block', width: '100%', background: 'none', border: 'none', textDecoration: 'underline', fontWeight: 700, fontSize: 13, color: 'rgba(12,12,12,.45)', cursor: 'pointer', marginTop: 9 }}>
            agora não
          </button>
        </div>
      </div>
    </div>
  )
}
