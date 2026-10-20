// 🧬 MOTOR 2D v2 — O PERFIL DE CADA CARTA (B: inteligência individual começa aqui).
// A carta só tem posição, nível (`lo`–`hi`), categoria (`fame`) e, nas lendas, o ESTILO e os GOLPES (fatos conhecidos,
// `campo2d-estilos.ts`). Daqui sai um perfil de 13 números + tendências — sem inventar atributo novo na carta e sem mexer
// em save nenhum. Regra do Diego: lenda é única; mas também *"não inventar como uma pessoa real é"* — por isso o perfil só
// usa o que já está escrito sobre ela (estilo + golpes). As "duas marcas por lenda" são da fase 2 (lista pra ele aprovar).
import { estilo2De, estiloDe, golpesDe, peDe, type Estilo, type Golpe } from '../campo2d-estilos'
import type { Atrib, CartaCampo, Grupo, Tendencia } from './tipos'

const BASE_FAME: Record<number, number> = { 1: 54, 2: 63, 3: 71, 4: 81, 5: 91 }
const VARZEA = /^(Várzea|Pickup)$/

/** nível da carta (o meio da faixa lo–hi; sem faixa, pela categoria) */
export function nivelDe(c?: CartaCampo): number {
  if (!c || !c.name) return 48
  if (c.fake || VARZEA.test(c.club ?? '')) return 46
  if (c.lo != null && c.hi != null) return (c.lo + c.hi) / 2
  return BASE_FAME[c.fame ?? 0] ?? 62
}

// o que cada POSIÇÃO faz mais e menos que o nível dela
const MOLDE: Record<Grupo, Partial<Atrib>> = {
  GOL: { reflexo: 8, saida: 0, posicionamento: 4, vel: -14, acel: -10, conducao: -28, passe: -14, visao: -10, finalizacao: -45, cabeceio: -15, desarme: -25, fisico: 0 },
  DEF: { desarme: 7, cabeceio: 7, posicionamento: 6, fisico: 5, conducao: -12, finalizacao: -20, visao: -9, passe: -6, vel: -5, acel: -6, reflexo: -40, saida: -40 },
  LAT: { vel: 4, acel: 3, desarme: 0, passe: -2, conducao: -2, finalizacao: -15, cabeceio: -6, visao: -6, reflexo: -40, saida: -40 },
  MEI: { passe: 6, visao: 6, conducao: 2, desarme: -6, finalizacao: -6, cabeceio: -8, decisao: 3, reflexo: -40, saida: -40 },
  ATA: { finalizacao: 7, conducao: 3, vel: 3, acel: 3, desarme: -24, passe: -6, visao: -6, posicionamento: 3, reflexo: -40, saida: -40 },
}
// o ESTILO da lenda (o que ela é conhecida por fazer) puxa os números dela
const ESTILO: Record<Estilo, Partial<Atrib>> = {
  driblador: { conducao: 12, acel: 6, vel: 3, decisao: 2 },
  passador: { passe: 12, visao: 12, decisao: 5 },
  finalizador: { finalizacao: 12, posicionamento: 9, decisao: 4 },
  cabeceador: { cabeceio: 15, fisico: 5 },
  chutador: { finalizacao: 7, passe: 3 },
  velocista: { vel: 13, acel: 10 },
  desarmador: { desarme: 12, posicionamento: 8, decisao: 3 },
  apoiador: { vel: 5, passe: 5, fisico: 3 },
  paredao: { reflexo: 11, posicionamento: 4 },
  goleiro_linha: { saida: 13, passe: 14, reflexo: 3 },
  normal: {},
}
// os GOLPES (fatos de cada lenda) viram um empurrãozinho no número certo
const GOLPE: Partial<Record<Golpe, Partial<Atrib>>> = {
  elastico: { conducao: 3 }, pedalada: { conducao: 3 }, chapeu: { conducao: 2 }, roleta: { conducao: 3 }, slalom: { conducao: 4, acel: 2 },
  croqueta: { conducao: 3 }, caneta: { conducao: 2 }, drible_goleiro: { conducao: 2, decisao: 2 }, arrancada: { vel: 3, acel: 4 }, corta_pra_dentro: { conducao: 2 },
  bomba: { finalizacao: 2, fisico: 2 }, colocado: { finalizacao: 3 }, de_primeira: { finalizacao: 3, posicionamento: 2 }, cabecada: { cabeceio: 6 },
  voleio: { finalizacao: 2 }, cobertura: { decisao: 3 }, passe_acucar: { passe: 4, visao: 4 }, lancamento: { passe: 4, visao: 3 },
  cruzamento_curva: { passe: 3 }, bote: { desarme: 4, posicionamento: 2 }, carrinho: { desarme: 3 }, corte_cabeca: { cabeceio: 4 },
  defesa_milagrosa: { reflexo: 4 }, saida_pes: { saida: 4, passe: 3 },
}
const ZERO: Atrib = { vel: 0, acel: 0, conducao: 0, passe: 0, visao: 0, finalizacao: 0, cabeceio: 0, desarme: 0, posicionamento: 0, fisico: 0, reflexo: 0, saida: 0, decisao: 0 }

// (um tempero pequeno e FIXO por carta pra quem não é lenda — dois "bom jogador" do mesmo nível não ficam idênticos. Não diz
// nada sobre a pessoa: é só ±2 pra não virar clone. Lenda não leva: o perfil dela é só o que se sabe dela.)
function tempero(nome: string, k: number): number {
  let h = 2166136261 ^ k
  for (let i = 0; i < nome.length; i++) h = Math.imul(h ^ nome.charCodeAt(i), 16777619)
  return ((h >>> 0) % 5) - 2
}

export interface Perfil { at: Atrib; tend: Tendencia; estilo: Estilo; golpes: Golpe[]; pe: ReturnType<typeof peDe>; nivel: number }

export function perfilDe(c: CartaCampo | undefined, grupo: Grupo): Perfil {
  const nome = c?.name ?? '', fame = c?.fame ?? 0, nivel = nivelDe(c)
  const estilo = estiloDe(nome, fame), estilo2 = estilo2De(nome, fame), golpes = golpesDe(nome, fame), lenda = fame >= 5
  const at = { ...ZERO }
  const somas = [MOLDE[grupo], ESTILO[estilo], ...golpes.map(g => GOLPE[g] ?? {})]
  let i = 0
  for (const k of Object.keys(ZERO) as (keyof Atrib)[]) {
    let v = nivel
    for (const s of somas) v += s[k] ?? 0
    v += (ESTILO[estilo2][k] ?? 0) * 0.5 // (a 2ª marca da lenda, com metade do peso)
    if (!lenda && nome) v += tempero(nome, i++)
    at[k] = Math.max(15, Math.min(99, v))
  }
  // TENDÊNCIAS: o que ele gosta de tentar (posição + estilo + golpes). Muda a CHANCE de escolher, nunca obriga.
  const tem = (...g: Golpe[]) => golpes.some(x => g.includes(x))
  const e2 = (e: Estilo, v: number) => (estilo === e ? v : estilo2 === e ? v * 0.5 : 0) // (1ª marca inteira, 2ª pela metade)
  const tend: Tendencia = {
    drible: (grupo === 'ATA' ? 0.35 : grupo === 'MEI' ? 0.2 : grupo === 'LAT' ? 0.15 : 0.05) + e2('driblador', 0.45) + e2('velocista', 0.2)
      + (tem('elastico', 'pedalada', 'chapeu', 'roleta', 'slalom', 'croqueta', 'caneta', 'corta_pra_dentro') ? 0.15 : 0),
    passeLongo: (grupo === 'DEF' ? 0.25 : grupo === 'MEI' ? 0.3 : 0.15) + e2('passador', 0.3) + (tem('lancamento') ? 0.25 : 0),
    chuteLonge: (grupo === 'MEI' ? 0.25 : grupo === 'ATA' ? 0.2 : 0.05) + e2('chutador', 0.45) + (tem('bomba', 'folha_seca', 'tres_dedos') ? 0.15 : 0),
    infiltra: (grupo === 'ATA' ? 0.55 : grupo === 'MEI' ? 0.2 : 0.02) + e2('finalizador', 0.3) + e2('velocista', 0.35),
    cruza: (grupo === 'LAT' ? 0.45 : grupo === 'ATA' ? 0.2 : 0.15) + e2('apoiador', 0.35) + (tem('cruzamento_curva') ? 0.25 : 0),
    apoia: (grupo === 'LAT' ? 0.4 : grupo === 'MEI' ? 0.3 : 0.05) + e2('apoiador', 0.45),
  }
  for (const k of Object.keys(tend) as (keyof Tendencia)[]) tend[k] = Math.max(0, Math.min(1, tend[k]))
  return { at, tend, estilo, golpes, pe: peDe(nome, fame), nivel }
}
