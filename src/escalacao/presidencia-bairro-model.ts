/** Primeiro trecho do bairro: unidades em metros, Y é a altura do chão. */
export const GEOMETRIA_BAIRRO = {
  rua: { xMin: -100, xMax: 100, zMin: 5, zMax: 13, y: 0 },
  calcada: { y: .16 },
  loja: { xMin: -8, xMax: 8, zMin: -12, zMax: -2, meiaPorta: 1.25 },
  pedestre: { altura: 1.8, raio: .3, velocidade: 1.25 },
  carro: { comprimento: 4.2, largura: 1.8, velocidade: 6, faixaZ: 9, limite: 95 },
} as const

export const CAMINHO_BAIRRO = [
  { x: -24, z: 2 }, { x: -4, z: 2 }, { x: 0, z: 2 }, { x: 0, z: -6 },
] as const

export type QuadroBairro = {
  pedestre: {
    x: number; z: number; y: number; heading: number; distance: number; speed: number
    phase: 'walking' | 'entering' | 'inside' | 'leaving' | 'waiting'
  }
  carro: { x: number; z: number; y: number; heading: number; distance: number; speed: number }
  seconds: number
}

const VELOCIDADE = GEOMETRIA_BAIRRO.pedestre.velocidade
const RAMPA = .8
const GIRO = .72
const ESPERA_DENTRO = 8
const ESPERA_FORA = 3
const ORIGEM = CAMINHO_BAIRRO[0]
const QUINA = CAMINHO_BAIRRO[2]
const INTERIOR = CAMINHO_BAIRRO[3]
const TRECHO_RUA = QUINA.x - ORIGEM.x
const TRECHO_LOJA = QUINA.z - INTERIOR.z
const DURACAO_RUA = TRECHO_RUA / VELOCIDADE + RAMPA
const DURACAO_LOJA = TRECHO_LOJA / VELOCIDADE + RAMPA
const DISTANCIA_CICLO = 2 * (TRECHO_RUA + TRECHO_LOJA)
export const DURACAO_CICLO_BAIRRO = 2 * (DURACAO_RUA + DURACAO_LOJA + GIRO) + ESPERA_DENTRO + ESPERA_FORA

/** Distância e velocidade da mesma curva: a passada não continua com o corpo parado. */
function deslocamento(seconds: number, comprimento: number) {
  const duration = comprimento / VELOCIDADE + RAMPA
  const t = Math.min(duration, Math.max(0, seconds))
  if (t < RAMPA) return { distance: VELOCIDADE * t * t / (2 * RAMPA), speed: VELOCIDADE * t / RAMPA }
  if (t > duration - RAMPA) {
    const restante = duration - t
    return { distance: comprimento - VELOCIDADE * restante * restante / (2 * RAMPA), speed: VELOCIDADE * restante / RAMPA }
  }
  return { distance: VELOCIDADE * (t - RAMPA / 2), speed: VELOCIDADE }
}

function giro(inicio: number, fim: number, t: number) {
  const f = Math.min(1, Math.max(0, t))
  const smooth = f * f * (3 - 2 * f)
  return inicio + (fim - inicio) * smooth
}

/** Sem relógio próprio: repetir o tempo (pausa) repete exatamente a pose. */
export function quadroBairro(seconds: number): QuadroBairro {
  // Limite muito além de uma sessão, evitando overflow também nos diagnósticos.
  const time = Number.isFinite(seconds) ? Math.min(Number.MAX_SAFE_INTEGER / 100, Math.max(0, seconds)) : 0
  const ciclo = Math.floor(time / DURACAO_CICLO_BAIRRO)
  // Usar a mesma divisão no ciclo e no resto evita duplicar distância em
  // múltiplos cujo `%` arredonda para o fim do ciclo anterior.
  let t = Math.max(0, time - ciclo * DURACAO_CICLO_BAIRRO)
  let x: number = ORIGEM.x
  let z: number = ORIGEM.z
  let heading = Math.PI / 2
  let distance = 0
  let speed = 0
  let phase: QuadroBairro['pedestre']['phase'] = 'walking'

  if (t < DURACAO_RUA) {
    const step = deslocamento(t, TRECHO_RUA)
    x += step.distance
    distance = step.distance
    speed = step.speed
  } else if ((t -= DURACAO_RUA) < GIRO) {
    x = QUINA.x
    distance = TRECHO_RUA
    heading = giro(Math.PI / 2, Math.PI, t / GIRO)
    phase = 'waiting'
  } else if ((t -= GIRO) < DURACAO_LOJA) {
    const step = deslocamento(t, TRECHO_LOJA)
    x = QUINA.x
    z -= step.distance
    distance = TRECHO_RUA + step.distance
    speed = step.speed
    heading = Math.PI
    phase = 'entering'
  } else if ((t -= DURACAO_LOJA) < ESPERA_DENTRO) {
    x = INTERIOR.x
    z = INTERIOR.z
    distance = TRECHO_RUA + TRECHO_LOJA
    heading = giro(Math.PI, 2 * Math.PI, (t - ESPERA_DENTRO + 1.3) / 1.3)
    phase = 'inside'
  } else if ((t -= ESPERA_DENTRO) < DURACAO_LOJA) {
    const step = deslocamento(t, TRECHO_LOJA)
    x = INTERIOR.x
    z = INTERIOR.z + step.distance
    distance = TRECHO_RUA + TRECHO_LOJA + step.distance
    speed = step.speed
    heading = 2 * Math.PI
    phase = 'leaving'
  } else if ((t -= DURACAO_LOJA) < GIRO) {
    x = QUINA.x
    distance = TRECHO_RUA + 2 * TRECHO_LOJA
    heading = giro(2 * Math.PI, 1.5 * Math.PI, t / GIRO)
    phase = 'waiting'
  } else if ((t -= GIRO) < DURACAO_RUA) {
    const step = deslocamento(t, TRECHO_RUA)
    x = QUINA.x - step.distance
    distance = TRECHO_RUA + 2 * TRECHO_LOJA + step.distance
    speed = step.speed
    heading = 1.5 * Math.PI
  } else {
    t -= DURACAO_RUA
    distance = DISTANCIA_CICLO
    heading = giro(1.5 * Math.PI, 2.5 * Math.PI, t / 1.3)
    phase = 'waiting'
  }

  const car = GEOMETRIA_BAIRRO.carro
  const carCycle = 2 * car.limite / car.velocidade
  // Reciclagem só a 95m do centro, além do trecho visível do protótipo.
  const carX = ((time % carCycle) * car.velocidade + 73) % (2 * car.limite) - car.limite
  return {
    seconds: time,
    pedestre: {
      x, z, y: GEOMETRIA_BAIRRO.calcada.y,
      heading: Math.atan2(Math.sin(heading), Math.cos(heading)),
      distance: ciclo * DISTANCIA_CICLO + distance, speed, phase,
    },
    carro: {
      x: carX, z: car.faixaZ, y: GEOMETRIA_BAIRRO.rua.y, heading: Math.PI / 2,
      distance: time * car.velocidade, speed: car.velocidade,
    },
  }
}
