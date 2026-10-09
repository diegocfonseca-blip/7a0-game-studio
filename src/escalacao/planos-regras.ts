// ─── 💳 PLANOS V2 (08/10, Diego) — as REGRAS num lugar só ─────────────────────
//
// Gratuito · ⭐ Craque completo R$ 12,90/mês (era 9,90 até 09/10) · 🖋 Batismo Lenda R$ 69,90 · 🖋✨ Batismo Plus R$ 79,99.
// Não existe mais Craque/Lenda avulso nem passe trimestral. Quem comprou o antigo FICA com tudo.
//
// Este arquivo é PURO (sem banco, sem React): a tela, o reducer e a trava `npm run planos` leem as
// mesmas funções — regra de ouro contra botão mudo (19/09). O banco tem a CÓPIA da mesma régua em
// `esc_direitos_de` (supabase/migrations/20261008230000_planos_v2_direitos.sql); mudou aqui, muda lá.
//
// As três camadas ficam SEPARADAS e nunca se misturam:
//   • LEGADO: o tier de sempre (user_colors / lista FOUNDERS), fundador, sócio. Nunca vence.
//   • ASSINATURA: o Craque mensal. Vence sozinho na data; ao vencer some SÓ o que veio dela.
//   • BATISMO: antigo (esc_socios origem 'batismo') ou novo (Lenda/Plus). Pra sempre.

export type TierCor = 'bege' | 'verde' | 'roxo' | 'prata' | 'ouro'

/** 💰 preços — o único lugar com número de plano no jogo */
export const PRECOS = {
  craqueMensal: 12.9,
  batismoLenda: 69.9,
  batismoPlus: 79.99,
} as const

/** "R$ 12,90" / "R$ 12.90" */
export function precoTxt(v: number, en = false): string {
  return `R$ ${v.toFixed(2).replace('.', en ? '.' : ',')}`
}

// 🏟️ LIMITES DE SALA — centralizados pra o Diego decidir depois (ordem de 08/10: "não inventar cotas,
// não reduzir tamanho, não prometer ilimitado"). Os números são os MESMOS de antes; só mudaram de casa.
export const LIMITES_SALA = {
  /** técnicos numa sala normal (a tabela tem 20; o que falta vira bot) */
  jogadores: 20,
  /** ⭐ Só Champions */
  jogadoresChampions: 36,
  /** ligas que cada pessoa pode CRIAR (entrar não tem limite) */
  ligasPorPessoa: 5,
  /** salas rápidas abertas ao mesmo tempo por pessoa */
  rapidasAbertas: 2,
  /** modos que só um dono PAGANTE cria. Quem entra nunca paga. A sala rápida NÃO está aqui:
   *  restringir a criação grátis não foi autorizado (08/10) — só como proposta. */
  modosPagos: ['liga', 'carreira', 'elenco'] as const,
}
export type ModoSala = 'rapido' | 'liga' | 'carreira' | 'elenco' | 'mundo'

/** o que o banco devolve em `esc_meus_direitos()` (já lido e com tipos certos) */
export interface Direitos {
  tierLegado: TierCor | null
  fundador: boolean
  socioAtivo: boolean
  batismo: boolean
  batismoPlano: 'antigo' | 'lenda' | 'plus' | null
  plus: boolean
  craqueAtivo: boolean
  craqueAte: string | null
  craqueCancelada: boolean
  /** a cor/tier na tela (o maior entre o antigo e o que a assinatura/batismo dá) */
  tier: TierCor | null
  manual: boolean
  /** pode CRIAR sala de modo pago */
  salasPagas: boolean
  /** carreira nova sobe pra nuvem */
  pago: boolean
  /** pedido do mensal esperando o Diego (a pessoa deixou o WhatsApp) */
  pedido: { status: 'novo' | 'link_enviado'; criadoEm: string } | null
}

const TIERS: TierCor[] = ['bege', 'verde', 'roxo', 'prata', 'ouro']
const ehTier = (t: unknown): t is TierCor => typeof t === 'string' && (TIERS as string[]).includes(t)

/** lê a resposta crua do banco sem confiar em nada (campo faltando = não tem) */
export function lerDireitos(raw: unknown): Direitos | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const b = (k: string) => r[k] === true
  const plano = r.batismo_plano
  const ped = r.pedido as Record<string, unknown> | null | undefined
  return {
    tierLegado: ehTier(r.tier_legado) ? r.tier_legado : null,
    fundador: b('fundador'),
    socioAtivo: b('socio_ativo'),
    batismo: b('batismo'),
    batismoPlano: plano === 'antigo' || plano === 'lenda' || plano === 'plus' ? plano : null,
    plus: b('plus'),
    craqueAtivo: b('craque_ativo'),
    craqueAte: typeof r.craque_ate === 'string' ? r.craque_ate : null,
    craqueCancelada: b('craque_cancelada'),
    tier: ehTier(r.tier) ? r.tier : null,
    manual: b('manual'),
    salasPagas: b('salas_pagas'),
    pago: b('pago'),
    pedido: ped && (ped.status === 'novo' || ped.status === 'link_enviado') ? { status: ped.status, criadoEm: String(ped.criado_em ?? '') } : null,
  }
}

/**
 * 🎨 o tier que a pessoa VÊ. `legado` é o de sempre (banco ou lista do código). A assinatura ativa e o
 * batismo sobem pra ouro (o Craque completo traz o visual premium do antigo Lenda); quando a assinatura
 * vence, volta pro legado — nada do que foi comprado antes some.
 * Se o banco não respondeu (`d` nulo), fica o legado: o jogo nunca TIRA nada por falta de rede.
 */
export function tierEfetivo(legado: TierCor | null | undefined, d: Direitos | null): TierCor | null {
  if (d && (d.craqueAtivo || d.batismo)) return 'ouro'
  return legado ?? null
}

/** 🎮 Modo Manual: o selo `manual` antigo, Craque/Lenda antigo, assinatura ou batismo */
export function temManual(legado: TierCor | null | undefined, manualCol: boolean, d: Direitos | null): boolean {
  if (manualCol || legado === 'prata' || legado === 'ouro') return true
  return !!d && (d.manual || d.craqueAtivo || d.batismo)
}

/**
 * 🏟️ pode CRIAR sala desse modo? Sala rápida/Copa do Mundo: sempre (é grátis). Modo pago: só com
 * direito pago — assinatura, batismo, ou qualquer direito antigo (Craque/Lenda permanente, fundador,
 * sócio em dia). Sem resposta do banco, vale o legado do aparelho (prata/ouro ou batismo antigo),
 * que é o que a pessoa já tinha antes desta mudança.
 */
export function podeCriarModo(modo: ModoSala, legado: TierCor | null | undefined, d: Direitos | null, barao = false): boolean {
  if (!(LIMITES_SALA.modosPagos as readonly string[]).includes(modo)) return true
  if (d) return d.salasPagas
  return legado === 'prata' || legado === 'ouro' || barao
}

/** 🚪 entrar numa sala de QUALQUER modo: convidado nunca paga (ordem de 08/10). O que segura um modo
 *  em construção (Carreira Online, Bafo) é a liberação do modo, não o plano. */
export function podeEntrarModo(_modo: ModoSala): boolean { return true }

/** 💾 fichas de carreira: grátis 1 · Craque (antigo) 2 · Lenda/Craque completo/batismo 4 */
export function fichasDoPlano(tier: TierCor | null | undefined, barao: boolean): number {
  if (barao || tier === 'ouro') return 4
  if (tier === 'prata') return 2
  return 1
}

/** 🎤 o canto da torcida e a 🚁 gala única são do Plus (a arte/áudio é produzida caso a caso) */
export function temExtrasPlus(d: Direitos | null): boolean { return !!d && d.plus }

/** a frase da situação do mensal pra mostrar na tela ("ativo até 08/11", "cancelado, vale até…") */
export function situacaoCraque(d: Direitos | null, agora = Date.now()): 'nunca' | 'ativo' | 'cancelado_no_prazo' | 'vencido' {
  if (!d || !d.craqueAte) return 'nunca'
  const ate = Date.parse(d.craqueAte)
  if (!(ate > agora)) return 'vencido'
  return d.craqueCancelada ? 'cancelado_no_prazo' : 'ativo'
}

/** WhatsApp: só dígitos, 10 a 15 (o banco confere de novo) */
export function whatsappValido(txt: string): string | null {
  const n = txt.replace(/\D/g, '')
  return n.length >= 10 && n.length <= 15 ? n : null
}
