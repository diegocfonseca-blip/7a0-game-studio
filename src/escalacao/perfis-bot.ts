// 🎭 PERFIS DOS BOTS NO LEILÃO DA CARREIRA (Diego 07/10)
//
// Pedido: *"pode fazer tudo isso que você disse dos bots, mais imprevisíveis e reais"*.
// Antes todo bot pagava ~o preço justo e nunca se arriscava — o leilão ficava previsível.
// Agora cada clube bot tem UM jeito de comprar, fixo dentro da carreira, pra quem joga
// aprender a ler o mercado ("nesta carreira o Real Domingueira é pão-duro").
//
// Regras que o Diego fechou junto:
//  • 🚫📈 o exagero do GASTADOR (e a loucura do IMPREVISÍVEL) NÃO entra no piso da carta —
//    quem vendeu recebe o valor cheio, mas o livro de preços e o `paid` da carta ficam no
//    preço justo (`justoDaCarta`). Senão o preço do jogo inteiro disparava temporada após
//    temporada (mesmo motivo de 22/09: prêmio não encarece jogador).
//  • 🎲 o perfil é SORTEADO POR CARREIRA (nome do clube + semente da carreira): fixo dentro
//    dela (dá pra aprender), diferente na próxima. Vale pra TODOS os rivais, batismo
//    incluído — medido em 07/10: numa carreira real os 5 rivais do leilão eram clubes de
//    batismo, então "batismo sem perfil" deixava o leilão igualzinho. Como muda de carreira
//    pra carreira, não vira uma "verdade" sobre o clube de uma pessoa real.
//  • só a CARREIRA usa perfil; partida rápida e salas seguem o leilão de sempre.
//  • nenhum perfil faz o bot gastar o que não tem (o cinto do bolso continua no motor).
//
// Trava: `npm run perfis`.
export type PerfilBot = 'gastador' | 'paoduro' | 'obcecado' | 'imprevisivel' | 'equilibrado'
type Setor = 'GOL' | 'LAT' | 'ZAG' | 'MEI' | 'ATA'
const SETORES: Setor[] = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']

/** 🔌 desliga tudo (volta o leilão de antes) trocando pra false */
export const PERFIS_BOT_ON = true

// hash estável (FNV-1a) — o mesmo nome dá o mesmo perfil em qualquer aparelho e carreira
function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}

/** o perfil do clube bot NESTA carreira (`semente` = a semente da carreira). Distribuição:
 *  20% gastador · 25% pão-duro · 15% obcecado · 15% imprevisível · 25% equilibrado. */
export function perfilDoClube(nome: string | undefined | null, semente: number | string = 0): PerfilBot {
  if (!PERFIS_BOT_ON || !nome) return 'equilibrado'
  const r = hash(`${nome.trim().toLowerCase()}|${semente}`) % 20
  return r < 4 ? 'gastador' : r < 9 ? 'paoduro' : r < 12 ? 'obcecado' : r < 15 ? 'imprevisivel' : 'equilibrado'
}

/** o setor que o OBCECADO persegue nesta temporada (muda de ano pra ano, fixo dentro dele) */
export function setorDaObsessao(nome: string, temporada: number): Setor {
  return SETORES[hash(`${nome.trim().toLowerCase()}|${temporada}`) % SETORES.length]
}

/** 🧮 multiplicador do ORÇAMENTO do setor (quanto o bot separa pra esta leva) */
export function fatorOrcamento(perfil: PerfilBot, setor: Setor, obsessao: Setor | undefined, repescagem: boolean): number {
  switch (perfil) {
    case 'gastador': return repescagem ? 1 : 1.3
    case 'paoduro': return repescagem ? 2 : 0.85 // guarda dinheiro pra pegar pechincha nas sobras
    case 'obcecado': return repescagem ? 1 : setor === obsessao ? 2.2 : 0.7
    default: return 1
  }
}

/** 🧮 multiplicador do TETO por carta (até quanto ele vai num jogador) */
export function fatorTeto(perfil: PerfilBot, fame: number, setor: Setor, obsessao: Setor | undefined): number {
  switch (perfil) {
    case 'gastador': return fame >= 4 ? 1.5 : 1.1 // estica de verdade é por craque e lenda
    case 'paoduro': return 0.8 // nunca passa do preço justo
    case 'obcecado': return setor === obsessao ? 1.7 : 0.85
    default: return 1
  }
}

/** 🃏 o IMPREVISÍVEL às vezes "endoidece" numa carta média: chance por carta e o tamanho */
export const LOUCURA_CHANCE = 0.18
export const loucuraFator = (r: number) => 1.6 + r * 0.7

/** os perfis que podem pagar ACIMA do justo (e por isso passam pela trava do piso) */
export const perfilPagaAcima = (p: PerfilBot) => p === 'gastador' || p === 'imprevisivel' || p === 'obcecado'

/** texto curto pra quem joga (PT e EN) — o jornal/Central usam quando a tela vier */
export const PERFIL_INFO: Record<PerfilBot, { emoji: string; pt: string; en: string }> = {
  gastador: { emoji: '💸', pt: 'Gastador', en: 'Big spender' },
  paoduro: { emoji: '🐷', pt: 'Pão-duro', en: 'Penny-pincher' },
  obcecado: { emoji: '🎯', pt: 'Obcecado', en: 'Obsessed' },
  imprevisivel: { emoji: '🃏', pt: 'Imprevisível', en: 'Wildcard' },
  equilibrado: { emoji: '⚖️', pt: 'Equilibrado', en: 'Balanced' },
}
