import { useEffect, useId, useRef, type ReactNode } from 'react'
import { useT } from './lang'
import './loja-layout.css'
import { marcaNome, marcaSigla, marcaFraseClube } from './marca'

export type LojaCategoria = 'planos' | 'clube' | 'carreira' | 'salas' | 'marca'
export function categoriaDaAncora(ancora?: string): LojaCategoria {
  if (ancora?.startsWith('loja-marca') || ancora?.startsWith('loja-giro')) return 'marca'
  if (ancora && ['loja-moedas', 'loja-ficha', 'loja-resgate'].includes(ancora)) return 'carreira'
  if (ancora && ['loja-presidente', 'loja-canto', 'loja-cores', 'loja-cor', 'loja-temas'].includes(ancora)) return 'clube'
  if (ancora && ['loja-salas', 'loja-recado', 'loja-cla', 'loja-presentes', 'loja-combos'].includes(ancora)) return 'salas'
  return 'planos'
}

export function LojaIcone({ tipo }: { tipo: LojaCategoria | 'gift' }) {
  const path = {
    planos: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z',
    clube: 'M5 4h14v6c0 5-4 8-7 10-3-2-7-5-7-10V4Z',
    carreira: 'M4 6c0-4 16-4 16 0S4 10 4 6Zm0 0v6c0 4 16 4 16 0V6M4 12v6c0 4 16 4 16 0v-6',
    salas: 'M12 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM3 21v-4a6 6 0 0 1 12 0v4M16 4a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5v2',
    marca: 'm3 10 17-6v14L3 12v-2ZM7 13l2 7h4l-2-6M21 3v16',
    gift: 'M3 8h18v4H3V8ZM5 12v9h14v-9M12 8v13M12 8C2 8 5 0 9 4l3 4Zm0 0c10 0 7-8 3-4l-3 4Z',
  }[tipo]
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={path} /></svg>
}

export function LojaLayout({ categoria, onCategoria, onClose, onAccount, marca, status, secoes, pagamento, overlays }: {
  categoria: LojaCategoria; onCategoria: (v: LojaCategoria) => void; onClose: () => void
  onAccount: () => void; marca: boolean; status: ReactNode
  secoes: Record<LojaCategoria, ReactNode>; pagamento: ReactNode; overlays: ReactNode
}) {
  const t = useT(), id = useId(), root = useRef<HTMLDivElement>(null), close = useRef<HTMLButtonElement>(null)
  const ativo = categoria === 'marca' && !marca ? 'planos' : categoria
  const categorias: [LojaCategoria, string][] = [
    ['planos', t('Planos', 'Plans')], ['clube', t('Seu clube', 'Your club')], ['carreira', t('Carreira', 'Career')],
    ['salas', t('Salas e comunidade', 'Rooms & community')], ...(marca ? [['marca', t('Sua marca', 'Your brand')] as [LojaCategoria, string]] : []),
  ]
  useEffect(() => {
    const before = document.activeElement instanceof HTMLElement ? document.activeElement : null
    close.current?.focus({ preventScroll: true })
    return () => { if (before?.isConnected) before.focus({ preventScroll: true }) }
  }, [])
  useEffect(() => {
    root.current?.querySelector<HTMLButtonElement>('.ls1-categories button[aria-pressed="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [ativo])
  const escolher = (c: LojaCategoria) => {
    onCategoria(c)
    const panel = document.getElementById(`${id}-conteudo`)
    if (root.current && panel) {
      const offset = root.current.clientWidth <= 680 ? 146 : 90
      root.current.scrollTo({ top: Math.max(0, panel.getBoundingClientRect().top - root.current.getBoundingClientRect().top + root.current.scrollTop - offset), behavior: 'auto' })
    }
  }
  return <div className="ll-shop-dialog" ref={root} role="dialog" aria-modal="true" aria-labelledby={`${id}-titulo`}
    onKeyDown={e => {
      if (!(e.target instanceof Node) || !root.current?.contains(e.target) || e.defaultPrevented) return
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
      if (e.key !== 'Tab') return
      const nodes = [...root.current.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),summary,[tabindex="0"]')].filter(n => n.getClientRects().length > 0)
      const first = nodes[0], last = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus() }
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus() }
    }}>
    <header className="ls1-header"><div className="ls1-wrap"><button type="button" className="ls1-brand" onClick={onClose} aria-label={t('Voltar ao jogo', 'Return to game')}><span className="ls1-ll" aria-hidden="true">{marcaSigla()}</span><span><strong>{marcaNome()}</strong><small>{marcaFraseClube()}</small></span></button><div className="ls1-header-actions"><button type="button" className="ls1-back" onClick={onClose}>← {t('Voltar ao jogo', 'Return to game')}</button><button type="button" onClick={onAccount}>{t('MINHA CONTA', 'MY ACCOUNT')}</button><button type="button" ref={close} onClick={onClose} aria-label={t('Fechar loja', 'Close shop')}>✕</button></div></div></header>
    <section className="ls1-hero"><div className="ls1-wrap"><div><div className="ls1-kicker">{t('A MESMA RESENHA. MAIS POSSIBILIDADES.', 'THE SAME BANTER. MORE POSSIBILITIES.')}</div><h1 id={`${id}-titulo`}>{t('LOJA DO CLUBE.', 'CLUB SHOP.')}</h1><p>{t('Seu jeito de jogar. Seu clube com a sua cara.', 'Your way to play. Your club, your style.')}</p></div><div className="ls1-account-status">{status}</div></div></section>
    <div className="ls1-layout ls1-wrap"><aside className="ls1-sidebar"><div className="ls1-sidebar-title">{t('EXPLORE A LOJA', 'EXPLORE THE SHOP')}</div><nav className="ls1-categories" aria-label={t('Categorias da loja', 'Shop categories')}>
      {categorias.map(([key, label]) => <button type="button" key={key} className={key === ativo ? 'active' : undefined} aria-pressed={key === ativo} aria-controls={`${id}-${key}`} onClick={() => escolher(key)}><LojaIcone tipo={key} />{label}</button>)}
    </nav><div className="ls1-sidebar-note"><b>{t('Seu plano, do seu jeito.', 'Your plan, your way.')}</b>{t('Mensalidades e compras únicas bem separadas. Benefícios já adquiridos continuam respeitados.', 'Monthly plans and one-off purchases, clearly separated. Your existing benefits stay yours.')}</div></aside>
      <main className="ls1-content" id={`${id}-conteudo`}>{categorias.map(([key, label]) => <section key={key} id={`${id}-${key}`} hidden={key !== ativo} aria-label={label} className="ls1-category">{secoes[key]}</section>)}{pagamento}</main>
    </div>
    <footer className="ls1-wrap ls1-trust"><strong>{marcaNome()}</strong><span>{t('Preços e condições visíveis antes de continuar.', 'Prices and terms shown before you continue.')} <a href="mailto:contato@leilaolegends.com">{t('Precisa de ajuda?', 'Need help?')}</a></span></footer>
    {overlays}
  </div>
}
