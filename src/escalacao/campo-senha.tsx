import { useId, useState } from 'react'
import { tr } from './lang'

export function erroSenhaNova(senha: string, confirmacao: string): string {
  if (senha.length < 6) return tr('A senha precisa de pelo menos 6 caracteres.', 'The password needs at least 6 characters.')
  if (senha !== confirmacao) return tr('As senhas não coincidem. Digite a mesma senha nos dois campos.', 'Passwords do not match. Enter the same password in both fields.')
  return ''
}

export function CampoSenha({ label, value, onChange, onEnter, nova = false }: {
  label: string; value: string; onChange: (value: string) => void; onEnter?: () => void; nova?: boolean
}) {
  const id = useId()
  const [visivel, setVisivel] = useState(false)
  return <div style={{ marginBottom: 10 }}>
    <label htmlFor={id} style={{ display: 'block', fontFamily: 'Oswald, sans-serif', fontSize: 11, fontWeight: 800, color: '#565656', textTransform: 'uppercase', marginBottom: 3 }}>{label}</label>
    <div style={{ display: 'flex', background: '#fff', border: '2.5px solid #0C0C0C', borderRadius: 10, overflow: 'hidden' }}>
      <input id={id} type={visivel ? 'text' : 'password'} value={value} autoComplete={nova ? 'new-password' : 'current-password'}
        onChange={e => onChange(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onEnter?.() } }}
        style={{ width: '100%', minWidth: 0, border: 0, padding: '9px 11px', fontSize: 16, fontWeight: 700, background: '#fff', color: '#0C0C0C', boxSizing: 'border-box' }} />
      <button type="button" aria-label={visivel ? tr('Ocultar senha', 'Hide password') : tr('Mostrar senha', 'Show password')} aria-pressed={visivel}
        onClick={() => setVisivel(v => !v)} style={{ flexShrink: 0, minWidth: 44, minHeight: 44, border: 0, borderLeft: '1px solid #ddd', background: '#F4ECD6', color: '#0C0C0C', cursor: 'pointer', fontSize: 12, fontWeight: 800 }}>
        {visivel ? tr('Ocultar', 'Hide') : tr('Ver', 'Show')}
      </button>
    </div>
  </div>
}
