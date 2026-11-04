// 🔁 04/11 (Diego: *"ainda tô vendo coisas que tem em um e não tem no outro… tem que ver tudo que tem de bom em um que não tem
// no outro pra igualar"*). O MESMO desenho nos dois campos — o campinho da aba Jogos (canvas) e o campo no gramado do estádio do
// mapa (three.js). Aqui mora só a REGRA de apresentação que os dois usam; nada mexe em motor, placar, relógio ou resultado.

/** 🌠 RASTRO DA BOLA — o do mapa (que o Diego gostou) virou o padrão dos dois: bolinhas de luz atrás da bola quando ela VIAJA
 * rápido (passe longo, lançamento, chute); bola conduzida não deixa rastro e o rastro some sozinho, ponto a ponto. */
export const RASTRO_PONTOS = 9
/** metros que a bola anda de um quadro pro outro pra contar como "viajando" (igual ao que o mapa já usava) */
export const RASTRO_PASSO = 0.55
export type PontoRastro = { x: number; y: number; z: number }
/** Um passo do rastro por quadro desenhado. `pts` é mutado (sem criar lista nova por quadro). */
export function avancaRastro(pts: PontoRastro[], x: number, y: number, z: number): void {
  const u = pts[pts.length - 1], voa = !!u && Math.hypot(x - u.x, z - u.z) > RASTRO_PASSO
  if (voa || !u) pts.push({ x, y, z }); else if (pts.length) pts.shift()
  if (pts.length > RASTRO_PONTOS) pts.shift()
}
/** Tamanho (em METROS de campo, os dois campos usam metros) e opacidade do ponto i (0 = o mais velho). Só desenha com 3+ pontos. */
export function pontoRastro(i: number, n: number): { tamanho: number; alfa: number } {
  const k = (i + 1) / n
  return { tamanho: 0.5 + 0.9 * k, alfa: 0.12 + 0.5 * k }
}
export const rastroVisivel = (n: number) => n > 2
/** A bolinha de luz do rastro (32 px, branco que some na borda) — a mesma arte nos dois campos. */
export function arteBolinhaRastro(): HTMLCanvasElement {
  const c = document.createElement('canvas'); c.width = c.height = 32
  const g = c.getContext('2d')!, gr = g.createRadialGradient(16, 16, 2, 16, 16, 15)
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32)
  return c
}

/** 🏷️ NOME DE QUEM PEGA NA BOLA: a regra continua "só de quem ENCOSTA na bola" (+ o autor do gol na festa), mas o nome SEGURA um
 * pouquinho depois do toque — num passe de primeira ele piscava e sumia antes de dar pra ler. */
export const NOME_SEGURA_MS = 900
export function criaNomeNaBola() {
  let ultimo = '', ate = 0
  /** devolve a chave de quem ainda mostra o nome (o dono de agora ou o último que tocou, por NOME_SEGURA_MS) */
  return (dono: string | null | undefined, agora: number): string => {
    if (dono) { ultimo = dono; ate = agora + NOME_SEGURA_MS; return dono }
    return agora < ate ? ultimo : ''
  }
}
