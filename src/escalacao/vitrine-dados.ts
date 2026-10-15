// 🏆📊 dados da vitrine da lista de salas (RPC `esc_vitrine_salas`), com cache de 60s.
// Mora num arquivo próprio e PEQUENO porque dois lugares usam: a vitrine (vitrine-salas.tsx) e a
// 🥇 MEDALHA DA SEMANA que vai grudada no nome (apoio.tsx). Uma chamada serve as duas.
import { supabase } from '../lib/supabase'

export interface Vitrine {
  hoje: { nome: string; time: string; titulos: string[]; em: string }[]
  semana: { nome: string; titulos: number; pos: number }[]
  eu: { nome: string; titulos: number; pos: number } | null
  batismo: { clube: string; desde: string } | null
}

let cache: { em: number; dado: Promise<Vitrine | null> } | null = null
export function buscaVitrine(forcar = false): Promise<Vitrine | null> {
  if (!forcar && cache && Date.now() - cache.em < 60_000) return cache.dado
  const dado = Promise.resolve(supabase.rpc('esc_vitrine_salas'))
    .then(({ data, error }) => (error || !data ? null : (data as Vitrine)), () => null)
  cache = { em: Date.now(), dado }
  return dado
}

/** 🥇🥈🥉 pela posição no ranking da semana (empate divide a medalha: 1º, 2º, 2º → nenhum 🥉) */
export const medalhaDaPos = (pos?: number | null): string => (pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : '')
