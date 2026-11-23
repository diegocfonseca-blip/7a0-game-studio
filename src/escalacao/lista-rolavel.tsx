// 📜 23/11 (Diego, print da convocação de Portugal: *"coloque uma barrinha que dê a impressão de rolagem, porque muitos usuários não
// sabem que dá pra rolar… pra cima ou pra baixo quando tem muitos jogadores daquela posição"*). A lista da convocação é uma caixa com
// rolagem própria, e no celular a barra do navegador some sozinha. Aqui: barra de rolagem SEMPRE visível (preta, grossinha) e, enquanto
// tem jogador escondido, uma faixa embaixo "▼ role pra ver mais" (e "▲" em cima quando já desceu). Só visual: a lista é a mesma.
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { tr } from './lang'
import './lista-rolavel.css'

export function ListaRolavel({ className, style, children, deps = [] }: { className?: string; style?: CSSProperties; children: ReactNode; deps?: unknown[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const [dica, setDica] = useState({ cima: false, baixo: false })
  const mede = () => {
    const el = ref.current; if (!el) return
    const cima = el.scrollTop > 6, baixo = el.scrollTop + el.clientHeight < el.scrollHeight - 6
    setDica(d => d.cima === cima && d.baixo === baixo ? d : { cima, baixo })
  }
  useEffect(() => { mede(); const el = ref.current; if (!el) return; const ro = new ResizeObserver(mede); ro.observe(el); return () => ro.disconnect() }, deps) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const t = window.setTimeout(mede, 50); return () => window.clearTimeout(t) })
  return <div className="lr-caixa">
    <div ref={ref} className={`lr-rolagem ${className ?? ''}`} style={style} onScroll={mede}>{children}</div>
    {dica.cima && <div className="lr-dica lr-dica-cima" aria-hidden="true"><span>▲</span></div>}
    {dica.baixo && <div className="lr-dica lr-dica-baixo" aria-hidden="true"><span>{tr('▼ role pra ver mais', '▼ scroll for more')}</span></div>}
  </div>
}
