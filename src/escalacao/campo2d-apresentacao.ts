// 🔁 04/11 (Diego: *"ainda tô vendo coisas que tem em um e não tem no outro… tem que ver tudo que tem de bom em um que não tem
// no outro pra igualar"*). O MESMO desenho nos dois campos — o campinho da aba Jogos (canvas) e o campo no gramado do estádio do
// mapa (three.js). Aqui mora só a REGRA de apresentação que os dois usam; nada mexe em motor, placar, relógio ou resultado.

/** 🌠 RASTRO DA BOLA — o do mapa (que o Diego gostou) virou o padrão dos dois: bolinhas de luz atrás da bola quando ela VIAJA
 * rápido (passe longo, lançamento, chute); bola conduzida não deixa rastro e o rastro some sozinho, ponto a ponto. */
export const RASTRO_PONTOS = 9
/** distância (m) entre dois pontos do rastro e velocidade (m/s de TELA; medido na bancada: condução ~5–15, passe ~15–20, lançamento/chute 22+) a partir da qual a bola está "viajando" */
export const RASTRO_PASSO = 0.55, RASTRO_VEL = 22
export type PontoRastro = { x: number; y: number; z: number }
/** O rastro, preso no TEMPO e não no número de quadros: o mesmo comprimento a 30 ou a 60 quadros/s (antes, com regra por quadro,
 * o campinho da aba Jogos — que desenha a 60 — quase nunca deixava rastro; o mapa, que recebe a bola a ~30, deixava). */
export function criaRastro() {
  const pts: PontoRastro[] = []
  let ant: PontoRastro | null = null, apaga = 0
  /** um quadro desenhado; `dt` em segundos desde o anterior */
  const passo = (x: number, y: number, z: number, dt: number) => {
    const v = ant && dt > 0 ? Math.hypot(x - ant.x, z - ant.z) / dt : 0
    if (ant && Math.hypot(x - ant.x, z - ant.z) > 9) pts.length = 0 // pulo (gol, reposição): sem rastro atravessando o campo
    ant = { x, y, z }
    if (v > RASTRO_VEL) { const u = pts[pts.length - 1]; if (!u || Math.hypot(x - u.x, z - u.z) > RASTRO_PASSO) pts.push({ x, y, z }); apaga = 0 }
    else if (pts.length) { apaga += dt; while (apaga > 0.034 && pts.length) { pts.shift(); apaga -= 0.034 } }
    while (pts.length > RASTRO_PONTOS) pts.shift()
    return pts
  }
  return { pts, passo, limpa: () => { pts.length = 0; ant = null } }
}
/** Tamanho (em DIÂMETROS DA BOLA — nos dois campos o rastro tem a mesma proporção da bola) e opacidade do ponto i (0 = o mais velho). Só desenha com 3+ pontos. */
export function pontoRastro(i: number, n: number): { tamanho: number; alfa: number } {
  const k = (i + 1) / n
  return { tamanho: (0.5 + 0.9 * k) / 1.45, alfa: 0.2 + 0.6 * k }
}
export const rastroVisivel = (n: number) => n > 2
/** A bolinha de luz do rastro (32 px, branco que some na borda) — a mesma arte nos dois campos. */
export function arteBolinhaRastro(): HTMLCanvasElement {
  const c = document.createElement('canvas'); c.width = c.height = 32; c.dataset.rastro = '1'
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
