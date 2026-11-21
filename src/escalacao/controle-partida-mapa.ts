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
  /** ⏩ 21/11: a marcha do jogo no estádio 3D = a do campinho 2D (1× · 1,5× · … · 4×) */
  marcha?: number
  mudaMarcha?: (v: number) => void
  /** 🔒 sem o Modo Manual: o toque no cadeado abre as ofertas (em cima do mapa) */
  cadeado?: () => void
  /** 🔁 substituição e tática: abre a aba Jogos (onde moram) */
  tatica?: () => void
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
  const k = c ? `${c.manualOk}|${c.manual}|${c.velocidade}|${c.marcha}|${!!c.cadeado}|${c.podeAvancar}|${c.rotuloAvancar}|${c.dia}|${!!c.irProJogo}|${!!c.chegando}` : ''
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

// 🏟️ 25/10 (Diego: *"quando clicar em campo 3D redireciona já pra dentro da aba de clubes, dentro do mapa, e já na melhor
// câmera do estádio"*): a carreira PEDE a câmera e o mapa atende assim que estiver pronto (se já estiver, atende na hora)
type PedidoCameraMapa = { camera: string; giro?: string }
let cameraPedida: PedidoCameraMapa | null = null
const ouvintesCamera = new Set<() => void>()
export function pedeCameraDoMapa(c: string, giro?: string) { cameraPedida = { camera: c, giro }; ouvintesCamera.forEach(f => f()) }
export function tiraCameraPedida(): PedidoCameraMapa | null { const c = cameraPedida; cameraPedida = null; return c }
/** O pedido espera o mapa carregar; a apresentação não depende do apito inicial. */
export function temCameraPedida(): boolean { return cameraPedida != null }
// 🏟️ 20/11 (Diego: "só depois de parar aparecer o botão de começar o jogo"): o mapa avisa quando o giro de abertura terminou
const ouvintesGiro = new Set<(giro?: string) => void>()
export function avisaGiroFeito(giro?: string) { ouvintesGiro.forEach(f => { try { f(giro) } catch { /* segue */ } }) }
export function assinaGiroFeito(f: (giro?: string) => void) { ouvintesGiro.add(f); return () => { ouvintesGiro.delete(f) } }
export function assinaCameraPedida(f: () => void) { ouvintesCamera.add(f); return () => { ouvintesCamera.delete(f) } }

// 📍 18/11 (Diego: *"quando apertar qualquer coisa deve mostrar na hora no mapa o ocorrido"*): o "Ver no mapa" da cena do bairro
// na Central PEDE o lugar (feira, balada, boteco…) e o mapa voa pra lá assim que estiver pronto — o mesmo caminho do menu Locais
let vistaPedida: string | null = null
const ouvintesVista = new Set<() => void>()
export function pedeVistaDoMapa(v: string) { vistaPedida = v; ouvintesVista.forEach(f => f()) }
export function tiraVistaPedida(): string | null { const v = vistaPedida; vistaPedida = null; return v }
export function assinaVistaPedida(f: () => void) { ouvintesVista.add(f); return () => { ouvintesVista.delete(f) } }
