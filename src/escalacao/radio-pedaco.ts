// 📡✂️ RÁDIO EM PEDAÇOS (10/11, Diego: *"sim"* pra construir no simulador; NÃO está ligado no jogo ainda).
//
// Hoje o dono manda a SALA INTEIRA a cada mudança (~30 KB comprimidos, ~23 vezes por minuto pra cada convidado). Medido no
// simulador: só ~17% disso é coisa que mudou. Aqui o dono manda:
//   • um ESTADO CHEIO de vez em quando (a "base", com um carimbo `b` sorteado), e
//   • no meio, só as CHAVES de cima do estado que mudaram desde ESSA base (nunca desde o pedaço anterior).
// Por isso perder um pedaço no caminho não estraga nada: o próximo pedaço já traz tudo o que mudou desde a base. O convidado só
// precisa da ÚLTIMA BASE; se não tiver (entrou agora, perdeu a base, o dono recarregou), ele PEDE O ESTADO CHEIO, como já faz hoje.
// Pedaço velho chegando atrasado é ignorado pelo número de ordem (`s`).
//
// Puro (sem React, sem Supabase): o simulador de salas usa exatamente isto, e a prova de que funciona é ele reconstruir, em todo
// envio, o MESMO estado que o dono tem (`npm run salas-sim`).
import { packTxt, unpackTxt } from './netpack'

type Filtro = (this: unknown, k: string, v: unknown) => unknown

export type PacoteCheio = { z: string; b: string; s: number }
export type PacotePedaco = { d: string; b: string; s: number }

// o pedaço só compensa enquanto é bem menor que a sala inteira; passou disso, manda uma base nova
const PEDACO_MAX = 0.5

export function criaEmissor(tira: Filtro) {
  let base: { b: string; txts: Record<string, string>; tam: number } | null = null
  let seq = 0
  const novaBase = () => Math.random().toString(36).slice(2, 10)
  const textos = (st: Record<string, unknown>) => {
    const t: Record<string, string> = {}
    for (const [k, v] of Object.entries(st)) { if (v === undefined) continue; const j = JSON.stringify(v, tira); if (j !== undefined) t[k] = j }
    return t
  }
  const cheio = (txts: Record<string, string>): PacoteCheio => {
    const corpo = '{' + Object.entries(txts).map(([k, j]) => JSON.stringify(k) + ':' + j).join(',') + '}'
    const z = packTxt(corpo)
    base = { b: novaBase(), txts, tam: z.length }
    return { z, b: base.b, s: ++seq }
  }
  return {
    /** o que mandar agora. `forcaCheio`: alguém pediu o estado (entrou, recarregou, perdeu a base) */
    emite(st: Record<string, unknown>, forcaCheio = false): { cheio: PacoteCheio } | { pedaco: PacotePedaco } {
      const txts = textos(st)
      if (!base || forcaCheio) return { cheio: cheio(txts) }
      const mud: string[] = []
      for (const [k, j] of Object.entries(txts)) if (base.txts[k] !== j) mud.push(JSON.stringify(k) + ':' + j)
      const fora = Object.keys(base.txts).filter(k => !(k in txts))
      const corpo = `{"c":{${mud.join(',')}},"r":${JSON.stringify(fora)}}`
      const d = packTxt(corpo)
      if (d.length > base.tam * PEDACO_MAX) return { cheio: cheio(txts) }
      return { pedaco: { d, b: base.b, s: ++seq } }
    },
    /** o pacote cheio da base de AGORA (pra quem pediu o estado), sem trocar de base */
    reenviaBase(st: Record<string, unknown>): PacoteCheio { return cheio(textos(st)) },
  }
}

export function criaReceptor<T>(poe: Filtro) {
  let base: { b: string; txt: string } | null = null
  let ultimo = 0
  let ultimaBase = ''
  return {
    /** devolve o estado inteiro reconstruído, `'pede'` (não tenho a base: peça o estado cheio) ou `null` (pacote velho, ignore) */
    recebe(p: PacoteCheio | PacotePedaco): T | 'pede' | null {
      if ('z' in p) {
        // base nova sempre vale (o dono pode ter recarregado e voltado a contar do 1)
        if (p.b === ultimaBase && p.s <= ultimo) return null
        const txt = unpackTxt(p.z)
        const st = JSON.parse(txt, poe) as T
        base = { b: p.b, txt }
        ultimaBase = p.b; ultimo = p.s
        return st
      }
      if (!base || base.b !== p.b) return 'pede'
      if (p.s <= ultimo) return null
      const { c, r } = JSON.parse(unpackTxt(p.d), poe) as { c: Record<string, unknown>; r: string[] }
      const st = JSON.parse(base.txt, poe) as Record<string, unknown> // cópia nova a cada vez: ninguém mexe na base guardada
      for (const k of r) delete st[k]
      Object.assign(st, c)
      ultimo = p.s
      return st as T
    },
  }
}
