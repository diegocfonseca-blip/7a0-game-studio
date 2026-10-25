// 🎮 O CONTROLE DA PARTIDA DENTRO DO MAPA 3D (25/10, Diego: *"não gostei do placar fora do mapa… a pessoa vai querer ser imersiva,
// ver lá dentro do mapa. Então botão manual, placar e etc. deveria ser lá"*). A carreira continua dona do ritmo (Manual/Auto,
// velocidade, próxima rodada); aqui ela só PUBLICA o que já mostra no "🎮 Controle da partida" pro mapa desenhar por cima do 3D.
// Os toques do mapa chamam as MESMAS funções do controle de sempre — nenhuma regra nova (regra contra botão mudo).
import { useSyncExternalStore } from 'react'

export interface ControleMapa {
  /** a pessoa pode usar o Modo Manual (Craque pra cima / carreira antiga) */
  manualOk: boolean
  manual: boolean
  velocidade: number
  podeAvancar: boolean
  rotuloAvancar: string
  alternaManual: () => void
  mudaVelocidade: (v: number) => void
  avanca: () => void
  /** 📅 o dia do calendário da carreira ("📅 Qua 23 abr") */
  dia?: string
  /** ⏩ pula os dias que faltam até o jogo, sem sair do mapa (só com a semana passando) */
  irProJogo?: () => void
  /** 🏟️ dia de jogo em casa, antes do apito: a torcida está chegando */
  chegando?: boolean
}
let atual: ControleMapa | null = null
let chave = ''
const ouvintes = new Set<() => void>()
/** a carreira chama a cada render; só avisa o mapa quando muda o que aparece (as funções são sempre as mais novas) */
export function publicaControleMapa(c: ControleMapa | null) {
  const k = c ? `${c.manualOk}|${c.manual}|${c.velocidade}|${c.podeAvancar}|${c.rotuloAvancar}|${c.dia}|${!!c.irProJogo}|${!!c.chegando}` : ''
  atual = c
  if (k === chave) return
  chave = k
  ouvintes.forEach(f => f())
}
const assina = (f: () => void) => { ouvintes.add(f); return () => { ouvintes.delete(f) } }
let instantaneo: { k: string; c: ControleMapa | null } = { k: '', c: null }
export function useControleMapa(): ControleMapa | null {
  // (o instantâneo só troca quando a chave muda — senão o React redesenharia a cada publicação)
  return useSyncExternalStore(assina, () => { if (instantaneo.k !== chave) instantaneo = { k: chave, c: atual }; return instantaneo.c ? atual : null }, () => null)
}
