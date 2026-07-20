// ── APOIO: benefícios visuais de quem apoia o projeto (só cosmético, nunca
// vantagem em campo). Cada conta pode ter um "tier" que define a COR do time
// em todo o jogo + o selo (emoji pequeno) ao lado do nome.
// Por enquanto a lista vive aqui no código (contas fundadoras); depois migra
// pra tabela user_colors no Supabase, aí outros jogadores também enxergam.
import { supabase } from '../lib/supabase'

export type ApoioTier = 'bege' | 'verde' | 'roxo' | 'prata' | 'ouro'

export interface ApoioPerk {
  tier: ApoioTier
  selo: string        // emoji ao lado do nome ('' = sem selo — bege e verde)
  solid: string       // cor sólida do time (chips, nomes, molduras)
  light: string       // fundo claro da faixa/linha nas tabelas
  holo: number        // intensidade do brilho (0 = sem brilho)
  grad: string        // degradê CSS — o MESMO visual da carta da categoria
  svgFull: [string, string]  // estádio: setor 100% (topo → base)
  svgPart: [string, string]  // estádio: setor em construção
}

export const APOIO_PERKS: Record<ApoioTier, ApoioPerk> = {
  bege:  { tier: 'bege',  selo: '',   solid: '#B2A583', light: '#EFE9D6', holo: 0,
           grad: 'linear-gradient(160deg,#DBD1B5,#CBBF9E 55%,#B2A583)', svgFull: ['#DBD1B5', '#B2A583'], svgPart: ['#cbbf9e', '#948967'] },
  verde: { tier: 'verde', selo: '',   solid: '#2E9E5B', light: '#CBEFD7', holo: 0,
           grad: 'linear-gradient(160deg,#41C07A,#2E9E5B 55%,#1E7A45)', svgFull: ['#41C07A', '#1E7A45'], svgPart: ['#2fa85c', '#15612f'] },
  roxo:  { tier: 'roxo',  selo: '💎', solid: '#8B5CF6', light: '#E4D6FB', holo: 0.3,
           grad: 'linear-gradient(160deg,#C9A9FF,#8B5CF6 52%,#5B2FB0)', svgFull: ['#C9A9FF', '#7C3AED'], svgPart: ['#a98be0', '#5B2FB0'] },
  prata: { tier: 'prata', selo: '⭐', solid: '#8E9BAB', light: '#E9EDF2', holo: 0.5,
           grad: 'linear-gradient(160deg,#F4F7FB,#CBD4DE 52%,#9BA7B5)', svgFull: ['#F4F7FB', '#9BA7B5'], svgPart: ['#cfd6de', '#7d8896'] },
  ouro:  { tier: 'ouro',  selo: '👑', solid: '#C9A227', light: '#F6E9C0', holo: 0.75,
           grad: 'linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)', svgFull: ['#ffd85a', '#e09e00'], svgPart: ['#e6c766', '#a67c00'] },
}

// contas fundadoras / apoios aplicados à mão (email → tier). O criador do jogo
// entra com tudo do tier máximo — menos o batismo de clube, que é só dos apoiadores.
const FOUNDERS: Record<string, ApoioTier> = {
  'diego.c.fonseca@gmail.com': 'ouro',
}

// e-mail da conta logada, cacheado — os pontos que usam (playerColors, nomes)
// são síncronos, então mantemos o valor atualizado via auth listener.
let myEmail: string | null = null
supabase.auth.getUser().then(({ data }) => { myEmail = data?.user?.email?.toLowerCase() ?? null }, () => {})
supabase.auth.onAuthStateChange((_e, s) => { myEmail = s?.user?.email?.toLowerCase() ?? null })

export function myApoioPerk(): ApoioPerk | null {
  if (!myEmail) return null
  const tier = FOUNDERS[myEmail]
  return tier ? APOIO_PERKS[tier] : null
}

// selo pronto pra colar no fim do nome (' 👑' ou '')
export function apoioSelo(): string {
  const p = myApoioPerk()
  return p && p.selo ? ` ${p.selo}` : ''
}
