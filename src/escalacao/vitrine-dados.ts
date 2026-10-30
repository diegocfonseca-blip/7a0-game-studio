// 🏆📊 dados da vitrine da lista de salas (RPC `esc_vitrine_salas`), com cache de 60s.
// Mora num arquivo próprio e PEQUENO porque dois lugares usam: a vitrine (vitrine-salas.tsx) e a
// 🥇 MEDALHA DA SEMANA que vai grudada no nome (apoio.tsx). Uma chamada serve as duas.
import { supabase } from '../lib/supabase'

export interface Vitrine {
  hoje: { nome: string; time: string; titulos: string[]; em: string }[]
  semana: { nome: string; titulos: number; pos: number; uid?: string | null }[] // 👆 21/10: uid pra abrir o perfil
  eu: { nome: string; titulos: number; pos: number } | null
  batismo: { clube: string; desde: string } | null
  // 🏅 19/10 (pódio da semana, mockup `podio-30d.png`) — campos novos, todos opcionais (banco velho não manda)
  podio?: { uid: string; pos: number }[]                      // quem está no TOP 3 AGORA (por id da conta)
  passada?: { nome: string; titulos: number; pos: number; uid?: string | null }[]  // o pódio da última semana FECHADA
  ganhas?: string                                             // minhas medalhas dos últimos 30 dias ('🥇🥉'), mais nova primeiro
}

// 🏆 o pódio de AGORA, por id da conta — a moldura da sala e do chat olham AQUI, nunca o emoji do nome (desde 19/10 o nome
// também carrega as medalhas GANHAS de 30 dias, então "tem 🥇" não quer mais dizer "é o 1º de agora").
let podioAgora = new Map<string, 1 | 2 | 3>()
let passadaCache: NonNullable<Vitrine['passada']> = []
export function podioDeUid(uid: string | null | undefined): 0 | 1 | 2 | 3 {
  return (uid && podioAgora.get(uid)) || 0
}
export function podioPassada() { return passadaCache }
function guardaPodio(v: Vitrine | null) {
  if (!v) return
  podioAgora = new Map((v.podio ?? []).filter(x => x.pos >= 1 && x.pos <= 3).map(x => [x.uid, x.pos as 1 | 2 | 3]))
  passadaCache = v.passada ?? []
}

let cache: { em: number; dado: Promise<Vitrine | null> } | null = null
export function buscaVitrine(forcar = false): Promise<Vitrine | null> {
  if (!forcar && cache && Date.now() - cache.em < 120_000) return cache.dado // 30/10: o banco já guarda 5 min; 2 min aqui poupa ida à toa
  const dado = Promise.resolve(supabase.rpc('esc_vitrine_salas'))
    .then(({ data, error }) => { const v = error || !data ? null : (data as Vitrine); guardaPodio(v); return v }, () => null)
  cache = { em: Date.now(), dado }
  return dado
}

/** 🥇🥈🥉 pela posição no ranking da semana (empate divide a medalha: 1º, 2º, 2º → nenhum 🥉) */
export const medalhaDaPos = (pos?: number | null): string => (pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : '')
