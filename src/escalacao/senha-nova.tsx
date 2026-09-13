// ─── 🔑 TELA DE SENHA NOVA (o link do "esqueci a senha") ─────────────────────
//
// 🐛 O BUG (achado em 11/09, reclamação do albertgomessantos@gmail.com: *"tá
// redefinindo e joga ele pra página inicial"*):
//
// O link do e-mail SEMPRE volta na página INICIAL do jogo — é o que o
// `redirectTo` manda (`window.location.origin`), e é o único lugar que o site
// tem: o Lobby não é endereço, é uma tela lá dentro. Só que a tela de digitar a
// senha nova morava DENTRO do Lobby (`lobby.tsx`, `startRecovery`). Resultado:
// o link logava a pessoa (por isso o "último acesso" dela ficava de hoje) e
// largava ela na home, **sem nunca mostrar onde trocar a senha**. Não era só
// com esse usuário — era com todo mundo que esquecia a senha.
//
// 🩹 O CONSERTO: a tela passa a morar aqui, FORA do Lobby, e é montada lá no
// `index.tsx`, que está sempre de pé. Onde quer que a pessoa caia, o aviso
// aparece por cima.
//
// Como ela sabe que é uma redefinição (duas portas, porque uma sozinha falha):
//   1. a MARCA na URL (`type=recovery`) — o supabase-js limpa o endereço logo
//      depois de ler, então a leitura é feita na hora em que o módulo carrega,
//      antes do React montar (`MARCA_NA_URL` embaixo);
//   2. o EVENTO `PASSWORD_RECOVERY` do supabase — que é o caminho normal, mas
//      pode chegar antes do componente existir. Por isso as duas.
//
// ⚠️ O Lobby continua com o código dele intocado. Na prática ele nunca dispara
// (a pessoa nunca cai no Lobby vindo do e-mail), mas mexer ali seria risco à
// toa num fluxo de conta.
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { CampoSenha, erroSenhaNova } from './campo-senha'
import { tr } from './lang' // 🌐 BR/EN

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F'
const OSWALD = { fontFamily: "Oswald, 'Arial Narrow', system-ui, sans-serif" } as const

// lido UMA vez, no carregamento do módulo: depois disso o supabase-js já
// pode ter limpado o hash da URL e a marca some.
const MARCA_NA_URL = (() => {
  try { return `${window.location.hash} ${window.location.search}`.includes('type=recovery') } catch { return false }
})()

export function TelaSenhaNova() {
  const [aberto, setAberto] = useState(MARCA_NA_URL)
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [pronto, setPronto] = useState(false)

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(event => {
      if (event === 'PASSWORD_RECOVERY') setAberto(true)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  if (!aberto) return null

  const salvar = async () => {
    if (salvando) return
    const problema = erroSenhaNova(senha, confirmacao)
    if (problema) { setErro(problema); return }
    setSalvando(true); setErro('')
    try {
      const { error } = await supabase.auth.updateUser({ password: senha })
      if (error) {
        // o link vale por pouco tempo e só uma vez — é o erro mais comum aqui
        setErro(/expired|invalid|token/i.test(error.message)
          ? tr('Esse link já venceu ou já foi usado. Peça outro em "esqueci minha senha".', 'That link has expired or was already used. Ask for another in "forgot my password".')
          : tr('Não consegui trocar agora. Tenta de novo daqui a pouco.', 'Couldn\'t change it right now. Try again in a bit.'))
        setSalvando(false); return
      }
      setSenha(''); setConfirmacao(''); setPronto(true)
    } catch {
      setErro(tr('Sem internet agora. Tenta de novo daqui a pouco.', 'No internet right now. Try again in a bit.'))
    }
    setSalvando(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99992, background: 'rgba(12,12,12,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 380, maxHeight: 'calc(100dvh - 32px)', overflowY: 'auto', background: '#F4ECD6', border: `4px solid ${INK}`, borderRadius: 20, boxShadow: `6px 6px 0 ${INK}`, padding: 18 }}>
        {pronto ? (
          <>
            <p style={{ ...OSWALD, fontWeight: 900, fontSize: 21, margin: 0, textTransform: 'uppercase' }}>{tr('✅ Senha trocada', '✅ Password changed')}</p>
            <p style={{ fontWeight: 700, fontSize: 13.5, color: 'rgba(12,12,12,.65)', margin: '8px 0 0', lineHeight: 1.45 }}>
              {tr('Já está valendo, e você já entrou com ela. Da próxima vez é essa que você usa.', 'It is already active, and you are signed in with it. Next time this is the one you use.')}
            </p>
            <button onClick={() => setAberto(false)} style={{ ...OSWALD, width: '100%', marginTop: 16, background: GREEN, color: '#fff', border: `3px solid ${INK}`, borderRadius: 12, boxShadow: `3px 3px 0 ${INK}`, padding: '11px 0', fontWeight: 900, fontSize: 16, cursor: 'pointer' }}>
              {tr('BORA JOGAR ⚽', 'LET\'S PLAY ⚽')}
            </button>
          </>
        ) : (
          <>
            <span style={{ ...OSWALD, display: 'inline-block', background: GOLD, border: `2px solid ${INK}`, borderRadius: 999, padding: '2px 10px', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em' }}>{tr('🔑 esqueceu a senha', '🔑 forgot the password')}</span>
            <p style={{ ...OSWALD, fontWeight: 900, fontSize: 23, margin: '10px 0 0', textTransform: 'uppercase', lineHeight: 1.05 }}>{tr('Crie sua senha nova', 'Create your new password')}</p>
            <p style={{ fontWeight: 700, fontSize: 13, color: 'rgba(12,12,12,.6)', margin: '6px 0 12px', lineHeight: 1.45 }}>
              {tr('Você chegou aqui pelo link do e-mail. Escreve a senha nova e pronto — nada do seu jogo se perde.', 'You got here from the e-mail link. Type the new password and that is it — nothing in your game is lost.')}
            </p>
            <CampoSenha label={tr('Nova senha', 'New password')} value={senha} onChange={v => { setSenha(v); setErro('') }} nova onEnter={() => void salvar()} />
            <CampoSenha label={tr('Confirmar nova senha', 'Confirm new password')} value={confirmacao} onChange={v => { setConfirmacao(v); setErro('') }} nova onEnter={() => void salvar()} />
            {erro && <p style={{ fontWeight: 800, fontSize: 12.5, color: RED, margin: '8px 0 0', lineHeight: 1.4 }}>{erro}</p>}
            <button onClick={() => void salvar()} disabled={salvando}
              style={{ ...OSWALD, width: '100%', marginTop: 12, background: salvando ? '#9aa' : GREEN, color: '#fff', border: `3px solid ${INK}`, borderRadius: 12, boxShadow: `3px 3px 0 ${INK}`, padding: '11px 0', fontWeight: 900, fontSize: 16, cursor: 'pointer' }}>
              {salvando ? tr('SALVANDO…', 'SAVING…') : tr('SALVAR SENHA', 'SAVE PASSWORD')}
            </button>
            {/* explicação embaixo do botão, no lugar exato */}
            <p style={{ fontWeight: 700, fontSize: 11, color: 'rgba(12,12,12,.5)', margin: '8px 0 0', textAlign: 'center', lineHeight: 1.4 }}>
              {tr('o link do e-mail vale uma vez só — se der erro, é só pedir outro', 'the e-mail link works only once — if it fails, just ask for another')}
            </p>
            <button onClick={() => setAberto(false)} style={{ ...OSWALD, width: '100%', marginTop: 10, background: 'transparent', border: 0, color: 'rgba(12,12,12,.5)', fontWeight: 800, fontSize: 12, textDecoration: 'underline', cursor: 'pointer' }}>
              {tr('agora não', 'not now')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
