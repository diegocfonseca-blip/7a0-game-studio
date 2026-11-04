// 🗺️💾 MAPA GUARDADO ENTRE ABAS (04/11, Diego: *"eu vou sair da aba, mas quando eu voltar ficará como?"* → *"ok pode fazer"*).
// Antes: sair da aba Clube DESMONTAVA o mapa, e voltar montava a cidade inteira do zero (no PC fraco, vários segundos congelado).
// Agora o mapa mora num "cofre" (um pedaço da página que nunca sai) e só é ENCAIXADO no lugar dele quando a aba Clube aparece:
//  · fora da aba ele fica escondido e PARADO (não desenha nem recebe atualização — custo zero enquanto você está em Jogos/Elenco);
//  · ao voltar, ele recebe o estado de AGORA (hora do dia, pré-jogo/jogo/pós-jogo, placar) e só troca o que mudou — sem remontar;
//  · ficou mais de 5 minutos fora: solta a memória (desmonta), e a próxima visita monta de novo como sempre foi.
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactElement, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export const SOLTA_MAPA_MS = 5 * 60 * 1000
type Cofre = { node: HTMLDivElement; parking: HTMLDivElement | null; vaga: (on: boolean) => void }
const Ctx = createContext<Cofre | null>(null)

export function MapaGuardado({ mapa, children }: { mapa: ReactElement | undefined; children: ReactNode }) {
  const [node] = useState(() => { const d = document.createElement('div'); d.style.width = '100%'; return d })
  const parking = useRef<HTMLDivElement>(null)
  const [temVaga, setTemVaga] = useState(false), [vivo, setVivo] = useState(false)
  // enquanto escondido, o mapa fica com o ÚLTIMO estado que viu (o React nem visita ele); na volta, pega o de agora
  const congelado = useRef<ReactElement | undefined>(undefined)
  if (temVaga || !congelado.current) congelado.current = mapa
  useEffect(() => {
    if (temVaga) { setVivo(true); return }
    const t = window.setTimeout(() => setVivo(false), SOLTA_MAPA_MS)
    return () => window.clearTimeout(t)
  }, [temVaga])
  const cofre = useRef<Cofre>({ node, parking: null, vaga: setTemVaga })
  cofre.current.parking = parking.current
  useLayoutEffect(() => { cofre.current.parking = parking.current; if (!node.parentNode && parking.current) parking.current.appendChild(node) })
  return <Ctx.Provider value={cofre.current}>
    {children}
    <div ref={parking} hidden aria-hidden="true" />
    {vivo && congelado.current && mapa ? createPortal(congelado.current, node) : null}
  </Ctx.Provider>
}

/** O lugar do mapa na aba Clube: encaixa o cofre aqui enquanto está na tela; ao sair, devolve pro estacionamento escondido. */
export function VagaDoMapa() {
  const cofre = useContext(Ctx), aqui = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = aqui.current
    if (!cofre || !el) return
    el.appendChild(cofre.node); cofre.vaga(true)
    return () => { cofre.vaga(false); if (cofre.parking) cofre.parking.appendChild(cofre.node); else cofre.node.remove() }
  }, [cofre])
  return <div ref={aqui} style={{ width: '100%' }} />
}
