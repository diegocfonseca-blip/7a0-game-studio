// ─── 🏀🎓 DRAFT do EUA Oficial (19/11, mockup `scripts/mockups/basquete-eua-draft.png`, Diego: "Siga") ──────────────────────────
// Regra da NBA (loteria desde 2019): os 14 que ficaram FORA dos playoffs entram na loteria; as chances da 1ª escolha são
// 14 · 14 · 14 · 12,5 · 10,5 · 9 · 7,5 · 6 · 4,5 · 3 · 2 · 1,5 · 1 · 0,5 % (do pior pro melhor). Só as 4 primeiras saem no sorteio;
// da 5ª em diante, do pior pro melhor. Depois vêm os 16 dos playoffs, também do pior pro melhor.
// Decisões do Diego: **1 escolha por time** (*"faz só uma escolha por time"*), **só carta SEM time** (ninguém pega de outro time) e
// **só promessa e jogador bom** (lenda e craque não entram — no Draft da NBA só tem jovem e aposta). Lógica pura.

/** chance da 1ª escolha, em combinações de 1000 (a tabela oficial da NBA), do pior (índice 0) pro 14º */
export const CHANCES_LOTERIA = [140, 140, 140, 125, 105, 90, 75, 60, 45, 30, 20, 15, 10, 5]

/** sorteia as 4 primeiras escolhas entre os 14 de fora (`fora` = do pior pro melhor) e devolve a ordem das 14 escolhas da loteria */
export function sorteiaLoteria<T>(fora: T[], rng: () => number): T[] {
  const restam = fora.map((t, i) => ({ t, peso: CHANCES_LOTERIA[i] ?? 0 }))
  const sorteados: T[] = []
  for (let k = 0; k < 4 && restam.some(r => r.peso > 0); k++) {
    const total = restam.reduce((a, r) => a + r.peso, 0)
    let x = rng() * total
    const i = restam.findIndex(r => (x -= r.peso) < 0)
    sorteados.push(restam.splice(i < 0 ? restam.length - 1 : i, 1)[0].t)
  }
  return [...sorteados, ...restam.map(r => r.t)]
}

export interface CartaDraft { name: string; club: string; year: number; pos: string; fame: number; lo: number; hi: number; promessa?: boolean; fake?: boolean }
/** entra no Draft? promessa ou jogador bom/profissional (fama ≤ 3), nunca carta de mentira */
export const entraNoDraft = (c: CartaDraft) => !c.fake && (!!c.promessa || c.fame <= 3)
export const forcaDraft = (c: CartaDraft) => (c.promessa ? 1 : 0) * 500 + c.fame * 100 + c.lo + c.hi

/** a escolha do bot (e a automática de quem deixou o tempo acabar): o melhor da posição onde o time tem MENOS gente */
export function escolhaDoBot<C extends CartaDraft>(pool: C[], elencoPos: string[], posicoes: readonly string[]): C | null {
  if (!pool.length) return null
  const conta = (p: string) => elencoPos.filter(x => x === p).length
  const ordemPos = [...posicoes].sort((a, b) => conta(a) - conta(b))
  for (const p of ordemPos) {
    const daPos = pool.filter(c => c.pos === p).sort((a, b) => forcaDraft(b) - forcaDraft(a))
    if (daPos.length) return daPos[0]
  }
  return [...pool].sort((a, b) => forcaDraft(b) - forcaDraft(a))[0]
}
