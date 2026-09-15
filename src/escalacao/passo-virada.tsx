// ─── 🪜 A PÍLULA "PASSO X DE N" DA VIRADA DA TEMPORADA ─────────────────────
// Pedido do Diego (15/09): *"quero padronizado passo a passo igual já ocorre hoje
// quando abre patrocinador Master, depois patrocinador pontual, depois material
// esportivo, depois venda de camisas e depois o bico"*.
//
// Mora num arquivo só dele porque os CINCO passos a usam e eles vivem em módulos
// diferentes (`estadio.tsx`, `career-sponsor-visual.tsx`, `loja-tela.tsx`) — se
// nascesse dentro de um deles, os outros teriam que importar aquele módulo inteiro
// e o risco de import circular apareceria de graça.
//
// ⚠️ O NÚMERO É CONTADO DE FORA, na fila da virada (`pyramidseason.tsx`), e só entre
// os passos que estão REALMENTE na tela: quem só tem 2 decisões lê "passo 1 de 2".
// Contar aqui dentro seria mentira — cada componente só conhece a si mesmo.
import { tr } from './lang'
import './career-loja-cenas.css' // a classe .ll37-passo mora lá, junto das cenas novas

export type PassoVirada = { n: number; de: number }

export function PassoPill({ passo }: { passo?: PassoVirada }) {
  if (!passo) return null
  return (
    <span className="ll37-passo">
      {tr(`passo ${passo.n} de ${passo.de}`, `step ${passo.n} of ${passo.de}`)}
    </span>
  )
}
