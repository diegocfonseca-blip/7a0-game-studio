// 🏀🗺️ 18/11 — O JOGO DE BASQUETE DENTRO DA ARENA DO MAPA (aba Clube da carreira).
//
// Diego (17/11): *"o jogo da arena vai ser também com base na aba de jogos quando tiver no campo 2d"* — igual ao futebol, onde o
// mesmo jogo do Campo 2D da aba Jogos aparece no gramado do estádio do mapa. Aqui é a MESMA cena da Quadra 2D (`cenaEm`, do
// MESMO roteiro do placar), só que os marcadores vão pro piso da arena (o mapa já sabe desenhar marcador 2D: `criarCampo2DNoMapa`).
// Nada é jogo novo: não sorteia, não grava e não muda resultado — só repete, no mapa, o que a aba Jogos já mostra.
import { useEffect, useMemo, useRef } from 'react'
import { cenaEm, indiceDaCena } from './quadra2d-cena'
import { placarEm, QUADRA, type PlanoQuadra } from './quadra2d-plano'
import { publicarSuperficieCampo2D, soltarSuperficieCampo2D, demandaSuperficieCampo2D } from './campo2d-superficie'
import { usePublicarPartidaSimples } from './presidencia-partida-sincronia'
import { QUADRA_S } from './presidencia-quadra-3d'
import type { ContextoPartidaEstadio, EstadoPartidaEstadio } from './presidencia-partida-model'
import type { LadoQuadra } from './quadra2d'
import { legendAvatar } from './legend-avatars'

/** pés da quadra (94 × 50, x no comprimento) → metros do mapa (a quadra do mapa é a oficial 28 × 15 m em escala `QUADRA_S`, no centro) */
export function quadraNoMapa(p: readonly [number, number]): { x: number; z: number } {
  return { x: (p[0] - QUADRA.comp / 2) * (28 * QUADRA_S / QUADRA.comp), z: (p[1] - QUADRA.larg / 2) * (15 * QUADRA_S / QUADRA.larg) }
}

const retratos = new Map<string, HTMLImageElement | null>()
function retrato(nome: string, club?: string, year?: number): HTMLImageElement | null {
  const k = `${nome}|${club ?? ''}|${year ?? ''}`
  if (retratos.has(k)) return retratos.get(k)!
  const art = legendAvatar(nome, club, year)
  const src = art ? (art.src.startsWith('/') ? import.meta.env.BASE_URL + art.src.slice(1) : art.src) : null
  let img: HTMLImageElement | null = null
  if (src && typeof Image !== 'undefined') { img = new Image(); img.src = src }
  retratos.set(k, img)
  return img
}

export function QuadraNoMapa({ plano, minuto, minutoMs, fechado, pausado, casa, fora, contexto, fala }: {
  plano: PlanoQuadra; minuto: number; minutoMs: number; fechado: boolean; pausado?: boolean; casa: LadoQuadra; fora: LadoQuadra
  /** o mesmo contexto que o futebol manda pro mapa (id do jogo + os dois clubes) */ contexto: ContextoPartidaEstadio
  fala: string
}) {
  const idx = useMemo(() => indiceDaCena(plano), [plano])
  const pl = fechado ? { casa: plano.casaFim, fora: plano.foraFim } : placarEm(plano, minuto)
  const estado: EstadoPartidaEstadio = {
    context: contexto, minute: fechado ? 93 : minuto, homeScore: pl.casa, awayScore: pl.fora, paused: !!pausado, finished: fechado,
    homeColor: casa.cor, awayColor: fora.cor, officialTeams: [casa.nome, fora.nome], officialNarration: fala,
  }
  usePublicarPartidaSimples(estado)
  // a superfície (posições) só é calculada quando o mapa PEDE (aba Clube aberta) — fora disso, custo zero
  const vivo = useRef({ minuto, em: performance.now(), minutoMs, fechado, pausado: !!pausado })
  if (vivo.current.minuto !== minuto) vivo.current = { ...vivo.current, minuto, em: performance.now() }
  vivo.current.minutoMs = minutoMs; vivo.current.fechado = fechado; vivo.current.pausado = !!pausado
  const times = useRef({ casa, fora }); times.current = { casa, fora } // (os lados chegam novos a cada desenho do placar: lidos pela ref, sem reiniciar o laço)
  useEffect(() => {
    const id = contexto.id, dono = {}, canvas = document.createElement('canvas'); canvas.width = canvas.height = 2
    let raf = 0, ult = 0
    const roda = (ts: number) => {
      raf = requestAnimationFrame(roda)
      const fps = demandaSuperficieCampo2D(id)
      if (!fps || ts - ult < 1000 / fps) return
      ult = ts
      const v = vivo.current
      const t = v.fechado ? 93 : Math.min(93, v.minuto + (v.pausado ? 0 : Math.min(0.999, Math.max(0, (ts - v.em) / Math.max(1, v.minutoMs)))))
      const cena = cenaEm(plano, t, idx)
      const p = v.fechado ? { casa: plano.casaFim, fora: plano.foraFim } : placarEm(plano, t)
      const players = (['casa', 'fora'] as const).flatMap(lado => {
        const time = lado === 'casa' ? times.current.casa : times.current.fora
        return (lado === 'casa' ? cena.casa : cena.fora).map((pos, i) => {
          const j = time.jogadores[i], m = quadraNoMapa(pos)
          return { key: `${lado}${i}`, name: j?.name ?? '', side: lado === 'casa' ? 'home' as const : 'away' as const, keeper: false, x: m.x, z: m.z, radius: 1.15,
            marker: { name: j?.name ?? '', color: time.cor, number: String(j?.num ?? i + 1), portrait: j ? retrato(j.name, j.club, j.year) : null, owned: !!cena.comBola && cena.comBola.lado === lado && cena.comBola.i === i } }
        })
      })
      const b = quadraNoMapa(cena.bola)
      publicarSuperficieCampo2D({ id, owner: dono, canvas, rect: { x: 0, y: 0, width: 2, height: 2 }, landscape: true, minute: t, players,
        ball: { x: b.x, y: cena.bolaNoAr ? 1.6 : 0.11, z: b.z }, referee: quadraNoMapa([QUADRA.comp / 2, -2.5]), score: [p.casa, p.fora], narration: '' })
    }
    raf = requestAnimationFrame(roda)
    return () => { cancelAnimationFrame(raf); soltarSuperficieCampo2D(id, dono) }
  }, [contexto.id, plano, idx])
  return null
}
