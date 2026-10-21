// 👆 JANELA DO CLÃ (21/10, Diego: "no ranking dos clãs, aperto no Futpoint e abre um modal pra ver quem são os usuários… e
// entrar (sem cadeado) ou pedir pra entrar (com cadeado)… se já tiver 22, aparece escrito"). Abre do ranking dos clãs da
// lista de salas. Quem decide tudo é o banco (`esc_cla_ver` lê, `esc_cla_entrar` entra/pede, com as MESMAS travas da aba
// ⚔️ Clã: trocar de clã pergunta antes, presidente com gente não sai, "sempre são dois"). Tocar num membro abre o perfil dele.
import { useEffect, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'
import { tr } from './lang'
import { CLA_MAX, EmblemaCla, esqueceClas, msgErro } from './cla'
import { abrePerfilSolto, contaValida } from './amigos'

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#E8503A', CLA_OURO = '#E9C46A'
const OSW: CSSProperties = { fontFamily: 'Oswald, sans-serif', fontWeight: 800, textTransform: 'uppercase' }
const bt = (bg: string, cor: string): CSSProperties => ({ ...OSW, fontSize: 14, background: bg, color: cor, border: `2px solid ${INK}`, borderRadius: 10, padding: '10px 12px', boxShadow: `2px 2px 0 ${INK}`, cursor: 'pointer', width: '100%' })

type Ver = { id: number; nome: string; emblema: string; aberto: boolean; lider: string; lider_nome: string; membros: number; titulos: number; pos: number | null
  descricao?: string | null; campeao: boolean; sou: boolean; pedi: boolean; lista: { uid: string; nome: string; titulos: number }[] }
type Resp = { ok?: boolean; erro?: string; pedido?: boolean; atual?: string; preso?: boolean }

export function ClaVer({ id, onClose }: { id: number; onClose: () => void }) {
  const [c, setC] = useState<Ver | null | 'erro'>(null)
  const [logado, setLogado] = useState(false)
  const [msg, setMsg] = useState('')
  const [troca, setTroca] = useState<string | null>(null) // já está em outro clã: pergunta antes de trocar
  const [ocupado, setOcupado] = useState(false)
  const carrega = () => { supabase.rpc('esc_cla_ver', { p_cla: id }).then(({ data, error }) => setC(error || !data ? 'erro' : data as Ver), () => setC('erro')) }
  useEffect(() => { carrega(); supabase.auth.getUser().then(({ data }) => setLogado(!!data?.user), () => {}) }, [id])
  const entra = async (trocar: boolean) => {
    setOcupado(true); setMsg(''); setTroca(null)
    try {
      const { data, error } = await supabase.rpc('esc_cla_entrar', { p_cla: id, p_trocar: trocar })
      const r = (data ?? {}) as Resp
      if (!error && r.erro === 'confirmar') {
        if (r.preso) setMsg(`⚠️ ${tr(`Você é o presidente do ${r.atual}: antes, passe a presidência ou feche o clã em 👥 Amigos → ⚔️ Clã.`, `You are the president of ${r.atual}: first hand over or close it in 👥 Friends → ⚔️ Clan.`)}`)
        else setTroca(r.atual ?? '')
      } else if (!error && r.erro === 'cheio') setMsg(`⚠️ ${tr('Você já está em 2 clãs, que é o máximo. Saia de um em 👥 Amigos → ⚔️ Clã.', 'You are already in 2 clans, the max. Leave one in 👥 Friends → ⚔️ Clan.')}`)
      else if (error || !r.ok) setMsg(`⚠️ ${msgErro(r.erro)}`)
      else { setMsg(r.pedido ? tr('📨 Pedido enviado — o presidente do clã decide.', '📨 Request sent — the clan president decides.') : tr('✅ Você entrou no clã!', '✅ You joined the clan!')); esqueceClas() }
    } catch { setMsg(`⚠️ ${msgErro(null)}`) } finally { setOcupado(false); carrega() }
  }
  const cheio = c && c !== 'erro' && c.membros >= CLA_MAX
  return createPortal(
    <div role="dialog" aria-modal="true" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 99970, background: 'rgba(12,12,12,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ position: 'relative', width: '100%', maxWidth: 400, maxHeight: '90vh', overflowY: 'auto', background: '#F4ECD6', color: INK, border: `4px solid ${INK}`, borderRadius: 18, boxShadow: `5px 5px 0 ${INK}`, padding: 14 }}>
        <button onClick={onClose} aria-label={tr('fechar', 'close')} style={{ position: 'absolute', top: 8, right: 8, ...OSW, fontSize: 16, width: 34, height: 34, borderRadius: 10, border: `2px solid ${INK}`, background: '#fff', cursor: 'pointer' }}>✕</button>
        {c === null && <p style={{ textAlign: 'center', fontWeight: 800, margin: '24px 0' }}>{tr('carregando…', 'loading…')}</p>}
        {c === 'erro' && <p style={{ textAlign: 'center', fontWeight: 800, margin: '24px 0' }}>{tr('Esse clã não está mais no ar.', 'This clan is no longer around.')}</p>}
        {c && c !== 'erro' && <>
          <div style={{ background: 'linear-gradient(150deg,#262626,#0c0c0c)', color: '#fff', border: `3px solid ${INK}`, borderRadius: 14, padding: 10, display: 'flex', gap: 12, alignItems: 'center', marginRight: 36 }}>
            <EmblemaCla emblema={c.emblema} size={58} />
            <div style={{ minWidth: 0 }}>
              <b style={{ ...OSW, fontSize: 20, color: CLA_OURO, display: 'block', lineHeight: 1.05 }}>{c.nome}{c.campeao ? ' 🏆' : ''}</b>
              <span style={{ fontSize: 11.5, fontWeight: 700 }}>👑 {c.lider_nome} · {c.membros}/{CLA_MAX} · {c.aberto ? tr('🔓 aberto', '🔓 open') : tr('🔒 fechado', '🔒 closed')}</span>
            </div>
          </div>
          {c.descricao && <p style={{ fontSize: 12.5, fontWeight: 700, fontStyle: 'italic', margin: '8px 2px 0', lineHeight: 1.35, overflowWrap: 'anywhere' }}>“{c.descricao}”</p>}
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            {[[c.pos ? `${c.pos}º` : '—', tr('na semana', 'this week')], [`${c.titulos} 🏆`, tr('títulos do clã', 'clan titles')]].map(([a, b]) => (
              <div key={b} style={{ flex: 1, background: '#fff', border: `2px solid ${INK}`, borderRadius: 10, textAlign: 'center', padding: 5 }}><b style={{ ...OSW, fontSize: 17 }}>{a}</b><br /><span style={{ fontSize: 10.5, fontWeight: 700 }}>{b}</span></div>
            ))}
          </div>
          <div style={{ background: '#fff', border: `3px solid ${INK}`, borderRadius: 12, padding: '6px 10px', marginTop: 8 }}>
            <p style={{ ...OSW, fontSize: 12, margin: '2px 0 4px' }}>👥 {tr('Membros', 'Members')} <span style={{ fontWeight: 600, textTransform: 'none', fontSize: 10.5, color: '#777' }}>· {tr('toque pra ver o perfil', 'tap to see the profile')}</span></p>
            {c.lista.map((m, i) => (
              <button key={m.uid} onClick={() => { if (contaValida(m.uid)) abrePerfilSolto(m.uid) }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 0', border: 'none', borderTop: i ? '1px dashed #d8ccaa' : 'none', background: 'transparent', color: INK, cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ ...OSW, width: 24, textAlign: 'center', fontSize: 13 }}>{i < 3 && m.titulos > 0 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}º`}</span>
                <b style={{ flex: 1, minWidth: 0, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.nome}{m.uid === c.lider ? ' 👑' : ''}</b>
                <span style={{ ...OSW, fontSize: 13 }}>{m.titulos} 🏆</span>
                <span style={{ fontSize: 13, color: '#999' }}>›</span>
              </button>
            ))}
          </div>
          <div style={{ marginTop: 10 }}>
            {c.sou ? <p style={{ ...OSW, textAlign: 'center', fontSize: 14, color: GREEN, margin: 0 }}>✅ {tr('Você está neste clã', 'You are in this clan')}</p>
              : !logado ? <p style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 800, margin: 0 }}>{tr('Entre na sua conta pra participar de um clã.', 'Log in to join a clan.')}</p>
              : cheio ? <p style={{ ...OSW, textAlign: 'center', fontSize: 14, background: '#eee', border: `2px solid ${INK}`, borderRadius: 10, padding: 10, margin: 0, color: '#555' }}>🔒 {c.aberto ? tr(`Clã cheio: ${CLA_MAX}/${CLA_MAX}`, `Clan full: ${CLA_MAX}/${CLA_MAX}`) : tr(`Clã fechado com ${CLA_MAX}/${CLA_MAX}`, `Clan closed with ${CLA_MAX}/${CLA_MAX}`)}</p>
              : c.pedi ? <p style={{ ...OSW, textAlign: 'center', fontSize: 14, color: '#7a6b4a', margin: 0 }}>⏳ {tr('Pedido enviado — o presidente decide', 'Request sent — the president decides')}</p>
              : troca !== null ? <div style={{ background: '#fff', border: `3px solid ${INK}`, borderRadius: 12, padding: 10 }}>
                  <p style={{ fontSize: 13, fontWeight: 800, margin: '0 0 8px' }}>{tr(`Você já participa do ${troca}. Se seguir, você sai dele e ${c.aberto ? `entra no ${c.nome}` : `o pedido vai pro presidente do ${c.nome}`}.`, `You are already in ${troca}. If you go on, you leave it and ${c.aberto ? `join ${c.nome}` : `the request goes to the ${c.nome} president`}.`)}</p>
                  <p style={{ fontSize: 11.5, fontWeight: 700, margin: '0 0 8px', color: '#5a4a2a' }}>⚔️⚔️ {tr('Quer ficar nos dois? Libere a 2ª vaga por R$ 9,90 na 🛒 Loja do Clube.', 'Want to stay in both? Unlock the 2nd slot for R$ 9.90 in the 🛒 Club Shop.')}</p>
                  <button disabled={ocupado} style={bt(GREEN, '#fff')} onClick={() => void entra(true)}>✅ {tr(`Sim, ir pro ${c.nome}`, `Yes, go to ${c.nome}`)}</button>
                  <button style={{ ...bt('#fff', INK), marginTop: 6 }} onClick={() => setTroca(null)}>{tr(`Não, ficar no ${troca}`, `No, stay in ${troca}`)}</button>
                </div>
              : c.aberto ? <button disabled={ocupado} style={bt(GREEN, '#fff')} onClick={() => void entra(false)}>⚔️ {tr('Entrar no clã', 'Join the clan')}</button>
              : <button disabled={ocupado} style={bt(GOLD, INK)} onClick={() => void entra(false)}>🔒 {tr('Pedir pra entrar', 'Ask to join')}</button>}
            {msg && <p style={{ fontSize: 12.5, fontWeight: 800, margin: '8px 0 0', color: msg.startsWith('⚠️') ? RED : GREEN }}>{msg}</p>}
          </div>
        </>}
      </div>
    </div>,
    document.body,
  )
}
