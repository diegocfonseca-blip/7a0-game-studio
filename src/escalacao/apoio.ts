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
}

export const APOIO_PERKS: Record<ApoioTier, ApoioPerk> = {
  bege:  { tier: 'bege',  selo: '',   solid: '#B2A583', light: '#EFE9D6', holo: 0 },
  verde: { tier: 'verde', selo: '',   solid: '#2E9E5B', light: '#CBEFD7', holo: 0 },
  roxo:  { tier: 'roxo',  selo: '💎', solid: '#8B5CF6', light: '#E4D6FB', holo: 0.3 },
  prata: { tier: 'prata', selo: '⭐', solid: '#8E9BAB', light: '#E9EDF2', holo: 0.5 },
  ouro:  { tier: 'ouro',  selo: '👑', solid: '#C9A227', light: '#F6E9C0', holo: 0.75 },
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
