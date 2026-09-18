// ─── 🎽 A FOTO DO CAMPEÃO COM O MANTO DO CLUBE ──────────────────────────────
//
// Pedido do Diego (18/09), olhando O MARTELO: *"teria como, principalmente
// quando for algum time de batismo, aparecer a camisa do time de batismo no
// lugar desses jogadores? Ou seria muito trabalho?"*
//
// O caminho escolhido: **não existe arte por clube**. A foto é sempre a mesma;
// o que muda é a COR do uniforme, pintada aqui na hora com as 2 cores do manto
// (as MEDIDAS na camisa que o dono mandou — nunca chutadas).
//
// 💾 POR QUE ASSIM: uma arte por clube seria ~60 KB vezes 53 hoje, e o Diego
// quer chegar a 10 mil batismos. Aqui é UM arquivinho de máscara (~3 KB) que
// serve pra TODOS — inclusive os batismos que ainda nem existem.
//
// ⏱️ E NÃO ATRASA NADA (regra de ouro do leilão): a pintura roda UMA vez por
// clube, quando o jornal abre — que é fim de temporada, hora de pausa — e fica
// guardada. A tela mostra a arte genérica no mesmo instante e troca quando a
// pintada fica pronta; se der qualquer erro, fica a genérica e ninguém vê bug.
//
// 🚫 Clube de CPU e batismo sem camisa continuam GENÉRICOS, como o Diego pediu:
// *"quando for genérico, mantém genérico e tudo mais, não tem problema"*.
import { useEffect, useState } from 'react'
import { mantoDoClube } from './batismos'
import ligaArt from './img/jornal-liga-v22.webp'
import copaArt from './img/jornal-copa-v22.webp'
import ligaMasc from './img/jornal-liga-manto-v1.webp'
import copaMasc from './img/jornal-copa-manto-v1.webp'

export type FotoJornal = 'liga' | 'copa'
/** a arte genérica de cada foto — é ela que aparece quando não há manto */
export const FOTO_GENERICA: Record<FotoJornal, string> = { liga: ligaArt, copa: copaArt }
const MASCARA: Record<FotoJornal, string> = { liga: ligaMasc, copa: copaMasc }

function carrega(src: string): Promise<HTMLImageElement | null> {
  return new Promise(res => {
    const i = new Image()
    i.onload = () => res(i)
    i.onerror = () => res(null)
    i.src = src
  })
}

const rgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

async function pinta(qual: FotoJornal, c1: string, c2: string): Promise<HTMLCanvasElement | null> {
  try {
    const [base, masc] = await Promise.all([carrega(FOTO_GENERICA[qual]), carrega(MASCARA[qual])])
    if (!base?.naturalWidth || !masc?.naturalWidth) return null
    const w = base.naturalWidth, h = base.naturalHeight
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h
    const cx = cv.getContext('2d', { willReadFrequently: true })
    const mv = document.createElement('canvas'); mv.width = w; mv.height = h
    const mx = mv.getContext('2d', { willReadFrequently: true })
    if (!cx || !mx) return null
    cx.drawImage(base, 0, 0)
    mx.drawImage(masc, 0, 0, w, h)
    const foto = cx.getImageData(0, 0, w, h)
    const mask = mx.getImageData(0, 0, w, h).data
    const p = foto.data

    // 1ª passada: o brilho MÉDIO de cada listra na arte original. É ele que
    // guarda o sombreado — a cor nova entra como "esta listra, nesta luz".
    let somaE = 0, nE = 0, somaC = 0, nC = 0
    for (let i = 0; i < p.length; i += 4) {
      const cla = mask[i] > 127, esc = mask[i + 1] > 127
      if (!cla && !esc) continue
      const luz = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2]
      if (esc) { somaE += luz; nE++ } else { somaC += luz; nC++ }
    }
    if (!nE || !nC) return null
    const refE = somaE / nE, refC = somaC / nC
    const [e0, e1, e2] = rgb(c1)   // cor 1 = a listra ESCURA da arte
    const [k0, k1, k2] = rgb(c2)   // cor 2 = a listra CLARA

    // 2ª passada: troca a cor mantendo a dobra do pano (a sombra vira fator).
    for (let i = 0; i < p.length; i += 4) {
      const cla = mask[i] > 127, esc = mask[i + 1] > 127
      if (!cla && !esc) continue
      const luz = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2]
      const f = luz / (esc ? refE : refC)
      const a = esc ? e0 : k0, b = esc ? e1 : k1, c = esc ? e2 : k2
      p[i] = Math.min(255, a * f)
      p[i + 1] = Math.min(255, b * f)
      p[i + 2] = Math.min(255, c * f)
    }
    cx.putImageData(foto, 0, 0)
    return cv
  } catch { return null } // navegador travando canvas, arte que não carregou: fica a genérica
}

// 🗂️ uma pintura por clube, guardada: a mesma foto aparece na tela do jornal e
// na imagem de compartilhar, e o online repinta a cada aviso do banco.
const guardado = new Map<string, Promise<HTMLCanvasElement | null>>()

/** a foto já pintada (pro canvas de compartilhar). `null` = usa a genérica. */
export function fotoJornal(qual: FotoJornal, clube?: string | null): Promise<HTMLCanvasElement | null> {
  const cor = mantoDoClube(clube)
  if (!cor) return Promise.resolve(null)
  const k = `${qual}|${cor[0]}|${cor[1]}`
  let v = guardado.get(k)
  if (!v) { v = pinta(qual, cor[0], cor[1]); guardado.set(k, v) }
  return v
}

const enderecos = new Map<string, string>()

/**
 * O `src` da foto pra usar em `<img>`. Devolve a GENÉRICA na hora e troca pela
 * pintada quando ela fica pronta — nunca deixa buraco na tela.
 */
export function useFotoJornal(qual: FotoJornal, clube?: string | null): string {
  const cor = mantoDoClube(clube)
  const k = cor ? `${qual}|${cor[0]}|${cor[1]}` : ''
  const [url, setUrl] = useState<string | null>(() => (k ? enderecos.get(k) ?? null : null))
  useEffect(() => {
    if (!k) { setUrl(null); return }
    const pronto = enderecos.get(k)
    if (pronto) { setUrl(pronto); return }
    let vivo = true
    fotoJornal(qual, clube).then(cv => {
      if (!vivo || !cv) return
      cv.toBlob(b => {
        if (!b || !vivo) return
        // o endereço fica guardado junto da pintura: enquanto a aba viver, o
        // mesmo clube não paga o trabalho de novo (nem a memória de outro blob)
        const u = enderecos.get(k) ?? URL.createObjectURL(b)
        enderecos.set(k, u)
        setUrl(u)
      }, 'image/webp', 0.92)
    })
    return () => { vivo = false }
  }, [k, qual, clube])
  return url ?? FOTO_GENERICA[qual]
}

/**
 * A foto do jornal já com o manto certo. Usar no lugar do `<img>` solto — assim
 * a carreira, o online e a imagem de compartilhar nunca saem diferentes.
 */
export function FotoJornal({ qual, clube, alt, loading }: {
  qual: FotoJornal
  /** clube campeão — batismo pinta, CPU e clube sem camisa ficam genéricos */
  clube?: string | null
  alt: string
  loading?: 'lazy' | 'eager'
}) {
  return <img src={useFotoJornal(qual, clube)} alt={alt} loading={loading} />
}
