// 📱✉️ 3ª CONTA NO MESMO APARELHO CONFIRMA O E-MAIL PRA CRIAR SALA (30/10, mockup aprovado: scripts/mockups/confirmar-aparelho.png)
// Quem decide é o BANCO (gatilho `esc_sala_por_dia` → erro CONFIRMA_EMAIL; regras em
// supabase/migrations/20261030230000_confirma_email_aparelho.sql). Esta caixa só explica o porquê, manda o código e confere.
// Falha NOSSA (e-mail não saiu, limite do dia) = o banco libera a pessoa naquele dia e a caixa cria a sala direto.
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { tr } from './lang'
import { logout } from './apoio'

const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 900 } as const
const btn = (bg: string, cor = '#0C0C0C') => ({ width: '100%', background: bg, color: cor, border: '3px solid #0C0C0C', borderRadius: 12, padding: '9px 10px', fontSize: 15, cursor: 'pointer', boxShadow: '3px 3px 0 #0C0C0C', ...OSW }) as const
const campo = { width: '100%', border: '3px solid #0C0C0C', borderRadius: 10, padding: '10px 12px', fontSize: 16, background: '#fff', color: '#0C0C0C' } as const

type Resp = { ok?: boolean; liberado?: boolean; motivo?: string; enviado_para?: string; restam?: number; estado?: string }

function erroDe(motivo?: string, restam?: number): string {
  switch (motivo) {
    case 'email_invalido': return tr('Esse e-mail não parece certo. Confere e tenta de novo.', "That e-mail doesn't look right. Check it and try again.")
    case 'email_em_uso': return tr('Esse e-mail já é de outra conta do jogo. Use "Entrar com a conta que já tenho".', 'That e-mail already belongs to another game account. Use "Sign in with the account I have".')
    case 'muitos_envios': return tr('Já mandamos muitos códigos hoje pra esta conta. Tenta amanhã — e enquanto isso, dá pra jogar na sala de um amigo.', "We already sent many codes to this account today. Try tomorrow — meanwhile you can play in a friend's room.")
    case 'errado': return tr(`Código errado. Restam ${restam ?? 0} tentativas.`, `Wrong code. ${restam ?? 0} tries left.`)
    case 'expirou': return tr('Esse código venceu (vale 30 minutos). Toque em "reenviar".', 'That code expired (valid 30 minutes). Tap "resend".')
    case 'muitas_tentativas': return tr('Muitas tentativas erradas. Toque em "reenviar" pra receber um código novo.', 'Too many wrong tries. Tap "resend" to get a new code.')
    case 'sem_codigo': return tr('Toque em "reenviar" pra receber o código.', 'Tap "resend" to get the code.')
    default: return tr('Não deu certo agora. Tenta de novo em instantes.', "That didn't work. Try again in a moment.")
  }
}

export function ConfirmaEmail({ onLiberado, onVerSalas }: { onLiberado: () => void; onVerSalas: () => void }) {
  const [para, setPara] = useState('')
  const [cod, setCod] = useState('')
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [outro, setOutro] = useState(false)
  const [novoEmail, setNovoEmail] = useState('')
  const enviouUmaVez = useRef(false)

  // o e-mail sai pelo banco sem esperar resposta; 4s depois a gente confere se o Resend aceitou. Recusou = falha nossa = libera hoje.
  const confereEnvio = () => {
    window.setTimeout(async () => {
      try {
        const { data } = await supabase.rpc('esc_conf_checa_envio')
        if ((data as Resp | null)?.estado === 'liberado') onLiberado()
      } catch { /* sem resposta: segue esperando o código */ }
    }, 4000)
  }

  const enviar = async (email?: string) => {
    setOcupado(true); setErro('')
    try {
      const { data, error } = await supabase.rpc('esc_conf_enviar', { p_email: email ?? null })
      const r = (data ?? {}) as Resp
      if (error) { setErro(erroDe()); return }
      if (r.liberado) { onLiberado(); return }
      if (!r.ok) { setErro(erroDe(r.motivo)); return }
      setPara(r.enviado_para ?? ''); setCod(''); setOutro(false); confereEnvio()
    } finally { setOcupado(false) }
  }

  useEffect(() => { if (!enviouUmaVez.current) { enviouUmaVez.current = true; void enviar() } }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const confirmar = async () => {
    if (cod.trim().length !== 6) { setErro(tr('O código tem 6 números.', 'The code has 6 digits.')); return }
    setOcupado(true); setErro('')
    try {
      const { data, error } = await supabase.rpc('esc_conf_verificar', { p_cod: cod.trim() })
      const r = (data ?? {}) as Resp
      if (error || !r.ok) { setErro(erroDe(r.motivo, r.restam)); return }
      if (r.ok) { try { await supabase.auth.refreshSession() } catch { /* e-mail novo aparece no próximo login */ } onLiberado() }
    } finally { setOcupado(false) }
  }

  return (
    <div style={{ background: '#fff', color: '#0C0C0C', border: '3px solid #C2452F', borderRadius: 14, boxShadow: '3px 3px 0 #C2452F', padding: '12px', margin: '8px 0' }}>
      <p style={{ margin: 0, fontSize: 17, ...OSW, textTransform: 'uppercase' }}>{tr('🔒 Este aparelho já tem outras contas', '🔒 This device already has other accounts')}</p>
      <p style={{ margin: '6px 0 0', fontSize: 13.5, fontWeight: 600, lineHeight: 1.4 }}>
        {tr('Pra criar sala com uma conta nova, confirme seu e-mail. ', 'To create a room with a new account, confirm your e-mail. ')}
        {para
          ? <>{tr('Mandamos um código de 6 números pro ', 'We sent a 6-digit code to ')}<b>{para}</b>.</>
          : tr('Mandando o código…', 'Sending the code…')}
      </p>
      <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={cod} placeholder="000000"
        onChange={e => setCod(e.target.value.replace(/\D/g, '').slice(0, 6))} onKeyDown={e => e.key === 'Enter' && confirmar()}
        style={{ ...campo, marginTop: 10, textAlign: 'center', letterSpacing: 10, fontSize: 26, ...OSW }} />
      <button disabled={ocupado} onClick={confirmar} style={{ ...btn('#1B7A3D', '#fff'), marginTop: 10 }}>
        {ocupado ? '…' : tr('✅ Confirmar e criar sala', '✅ Confirm and create room')}
      </button>
      {erro && <p style={{ margin: '8px 0 0', color: '#C2452F', fontWeight: 800, fontSize: 13 }}>{erro}</p>}
      <p style={{ margin: '8px 0 0', fontSize: 12.5, color: '#555' }}>
        {tr('Não chegou? Olhe o spam · ', "Didn't arrive? Check spam · ")}
        <button disabled={ocupado} onClick={() => enviar(para || undefined)} style={{ background: 'none', border: 0, padding: 0, textDecoration: 'underline', color: '#555', cursor: 'pointer', fontSize: 12.5 }}>{tr('reenviar', 'resend')}</button>
      </p>

      <p style={{ margin: '12px 0 6px', fontSize: 14, ...OSW, textTransform: 'uppercase' }}>{tr('Esse e-mail não é seu ou está errado?', "Not your e-mail, or it's wrong?")}</p>
      {!outro
        ? <button onClick={() => { setOutro(true); setErro('') }} style={btn('#FFC400')}>{tr('✉️ Usar outro e-mail (o código vai pra ele)', '✉️ Use another e-mail (the code goes there)')}</button>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input type="email" autoCapitalize="none" value={novoEmail} placeholder="seu@email.com" onChange={e => setNovoEmail(e.target.value)} style={campo} />
            <button disabled={ocupado} onClick={() => enviar(novoEmail.trim())} style={btn('#FFC400')}>{tr('Mandar código pra esse e-mail', 'Send the code to this e-mail')}</button>
            <p style={{ margin: 0, fontSize: 11.5, color: '#555', fontWeight: 600 }}>{tr('Depois do código certo, sua conta passa a usar esse e-mail. O time e tudo mais continuam.', 'After the right code, your account switches to this e-mail. Your team and everything else stay.')}</p>
          </div>}
      <button onClick={() => { void logout() }} style={{ ...btn('#fff'), marginTop: 8 }}>{tr('🔑 Entrar com a conta que já tenho', '🔑 Sign in with the account I have')}</button>
      <p style={{ margin: '10px 0 6px', fontSize: 13, fontWeight: 600 }}>{tr('Ou ', 'Or ')}<b>{tr('entre na sala de um amigo', "join a friend's room")}</b>{tr(' e jogue normal:', ' and play normally:')}</p>
      <button onClick={onVerSalas} style={btn('#fff')}>{tr('🌐 Ver salas abertas', '🌐 See open rooms')}</button>
    </div>
  )
}
