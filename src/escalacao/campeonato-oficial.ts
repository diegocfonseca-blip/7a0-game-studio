// ─── 🇧🇷 BRASIL OFICIAL — O MOTOR DOS CAMPEONATOS REAIS (15/11) ─────────────────────────────────────────────────────────
// Diego: *"quero que todos campeonatos sejam reais, as regras e etc, sem invenção"*. Cada série joga no FORMATO REAL do ano
// (fonte: docs/brasil-oficial/competicoes-reais.md e formatos-futuros.md). O motor da carreira de sempre força 20 times e 38
// rodadas em tudo; aqui cada série tem o tamanho e as fases dela.
//
// Este arquivo é PURO: não sabe de tela, de save nem de como uma partida é calculada. Quem chama passa `joga(casa, fora, ctx)`
// (a mesma conta de partida do jogo) e recebe tabela, fases, mata-mata, campeão, quem sobe e quem cai. Tudo determinístico
// pela semente (mesma semente = mesmo campeonato em qualquer aparelho).
//
// ⚠️ O que ainda está INCERTO na fonte fica marcado aqui e no doc — nunca inventar (regra do Diego).

export type Placar = { gc: number; gf: number }
/** contexto de uma partida: fase, rodada da fase, jogo (1 = ida, 2 = volta) e se pode ter pênalti */
export type CtxJogo = { serie: string; fase: string; rodada: number; perna?: 1 | 2 }
export type Joga = (casa: string, fora: string, ctx: CtxJogo) => Placar
/** disputa de pênaltis (só quando o regulamento manda): devolve o vencedor */
export type Penaltis = (a: string, b: string, ctx: CtxJogo) => string

export type Linha = { time: string; j: number; v: number; e: number; d: number; gp: number; gc: number; pts: number }
export type Jogo = { casa: string; fora: string; gc: number; gf: number; ctx: CtxJogo }
export type Confronto = { a: string; b: string; jogos: Jogo[]; vencedor: string; penaltis?: boolean }

const sg = (l: Linha) => l.gp - l.gc
/** desempate da CBF nas tabelas (formatos-futuros.md, regulamento citado na pt.wikipedia): pontos → vitórias → saldo → gols
 *  pró → confronto direto (só quando são DOIS empatados) → (cartões: o jogo não conta) → sorteio = a ordem de entrada, que já
 *  é sorteada pela semente. */
export function ordena(linhas: Linha[], jogos: Jogo[] = []): Linha[] {
  const base = (a: Linha, b: Linha) => b.pts - a.pts || b.v - a.v || sg(b) - sg(a) || b.gp - a.gp
  const ord = linhas.map((l, i) => ({ l, i })).sort((x, y) => base(x.l, y.l) || x.i - y.i)
  // confronto direto: só entre DOIS times empatados em tudo acima (pontos nos jogos entre eles; depois saldo neles)
  for (let k = 0; k + 1 < ord.length; k++) {
    const a = ord[k].l, b = ord[k + 1].l
    if (base(a, b) !== 0 || (ord[k + 2] && base(b, ord[k + 2].l) === 0) || (k > 0 && base(ord[k - 1].l, a) === 0)) continue
    let pa = 0, pb = 0, ga = 0, gb = 0
    for (const j of jogos) {
      const ca = j.casa === a.time && j.fora === b.time, cb = j.casa === b.time && j.fora === a.time
      if (!ca && !cb) continue
      const golsA = ca ? j.gc : j.gf, golsB = ca ? j.gf : j.gc
      ga += golsA; gb += golsB
      if (golsA > golsB) pa += 3; else if (golsB > golsA) pb += 3; else { pa++; pb++ }
    }
    if (pb > pa || (pb === pa && gb > ga)) [ord[k], ord[k + 1]] = [ord[k + 1], ord[k]]
  }
  return ord.map(x => x.l)
}

// dado preso na semente
export function rngDe(seed: number) {
  let s = (seed >>> 0) || 1
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
export function embaralha<T>(l: T[], r: () => number): T[] { const a = [...l]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a }

/** turno único de n times (método do círculo); n ímpar ganha uma folga. Devolve rodadas de pares [casa, fora] (índices). */
export function turnoUnico(n: number): [number, number][][] {
  const m = n % 2 ? n + 1 : n
  const idx = Array.from({ length: m }, (_, i) => i)
  const rodadas: [number, number][][] = []
  for (let r = 0; r < m - 1; r++) {
    const jogos: [number, number][] = []
    for (let i = 0; i < m / 2; i++) {
      const a = idx[i], b = idx[m - 1 - i]
      if (a >= n || b >= n) continue // folga
      jogos.push(r % 2 === 0 ? [a, b] : [b, a])
    }
    rodadas.push(jogos)
    idx.splice(1, 0, idx.pop()!) // gira (o 0 fica parado)
  }
  return rodadas
}
/** turno e returno: o returno inverte o mando */
export function turnoEReturno(n: number): [number, number][][] {
  const ida = turnoUnico(n)
  return [...ida, ...ida.map(r => r.map(([a, b]) => [b, a] as [number, number]))]
}

/** joga uma fase de pontos corridos e devolve a tabela ordenada + os jogos */
export function pontosCorridos(times: string[], rodadas: [number, number][][], joga: Joga, serie: string, fase: string): { tabela: Linha[]; jogos: Jogo[] } {
  const L = new Map(times.map(t => [t, { time: t, j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, pts: 0 } as Linha]))
  const jogos: Jogo[] = []
  rodadas.forEach((rod, r) => {
    for (const [h, a] of rod) {
      const casa = times[h], fora = times[a]
      const ctx: CtxJogo = { serie, fase, rodada: r + 1 }
      const p = joga(casa, fora, ctx)
      jogos.push({ casa, fora, gc: p.gc, gf: p.gf, ctx })
      const lc = L.get(casa)!, lf = L.get(fora)!
      lc.j++; lf.j++; lc.gp += p.gc; lc.gc += p.gf; lf.gp += p.gf; lf.gc += p.gc
      if (p.gc > p.gf) { lc.v++; lc.pts += 3; lf.d++ } else if (p.gc < p.gf) { lf.v++; lf.pts += 3; lc.d++ } else { lc.e++; lf.e++; lc.pts++; lf.pts++ }
    }
  })
  return { tabela: ordena([...L.values()], jogos), jogos }
}

/**
 * Mata-mata de ida e volta. `melhor` = quem decide em casa a volta (o de melhor campanha). Empate no agregado:
 *  · `desempate: 'campanha'` → passa o de melhor campanha (é a regra do playoff da Série B 2026, sem pênaltis);
 *  · `desempate: 'penaltis'` → pênaltis.
 */
export function idaEVolta(melhor: string, pior: string, joga: Joga, pen: Penaltis, ctx: Omit<CtxJogo, 'perna'>, desempate: 'campanha' | 'penaltis'): Confronto {
  const ida = joga(pior, melhor, { ...ctx, perna: 1 })
  const volta = joga(melhor, pior, { ...ctx, perna: 2 })
  const gm = ida.gf + volta.gc, gp = ida.gc + volta.gf
  const jogos: Jogo[] = [{ casa: pior, fora: melhor, gc: ida.gc, gf: ida.gf, ctx: { ...ctx, perna: 1 } }, { casa: melhor, fora: pior, gc: volta.gc, gf: volta.gf, ctx: { ...ctx, perna: 2 } }]
  if (gm !== gp) return { a: melhor, b: pior, jogos, vencedor: gm > gp ? melhor : pior }
  if (desempate === 'campanha') return { a: melhor, b: pior, jogos, vencedor: melhor }
  return { a: melhor, b: pior, jogos, vencedor: pen(melhor, pior, { ...ctx, perna: 2 }), penaltis: true }
}

// ── Os formatos ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export type Resultado = {
  serie: string
  /** a tabela da fase de pontos (na D: os 16 grupos, na ordem A1…A16) */
  tabelas: { nome: string; tabela: Linha[] }[]
  /** fases de mata-mata, na ordem */
  mataMata: { nome: string; confrontos: Confronto[] }[]
  jogos: Jogo[]
  campeao: string
  vice?: string
  sobem: string[]
  caem: string[]
}

/**
 * SÉRIE A (2026 e seguintes, sem mudança conhecida): 20, turno e returno, os 4 últimos caem. Campeão = 1º.
 * (As vagas de Libertadores/Sul-Americana saem da tabela — módulo das copas.)
 */
export function serieA(times: string[], seed: number, joga: Joga): Resultado {
  const ordem = embaralha(times, rngDe(seed ^ 0xA0A0))
  const { tabela, jogos } = pontosCorridos(ordem, turnoEReturno(ordem.length), joga, 'A', 'pontos corridos')
  return { serie: 'A', tabelas: [{ nome: 'Série A', tabela }], mataMata: [], jogos, campeao: tabela[0].time, vice: tabela[1].time, sobem: [], caem: tabela.slice(-4).map(l => l.time) }
}

/**
 * SÉRIE B 2026: 20, turno e returno. 1º e 2º sobem direto. 3º×6º e 4º×5º em ida e volta, volta na casa do melhor; empate no
 * agregado = passa a melhor campanha, SEM pênaltis. Os 2 vencedores sobem (4 acessos). Os 4 últimos caem.
 */
export function serieB(times: string[], seed: number, joga: Joga, pen: Penaltis): Resultado {
  const ordem = embaralha(times, rngDe(seed ^ 0xB0B0))
  const { tabela, jogos } = pontosCorridos(ordem, turnoEReturno(ordem.length), joga, 'B', 'pontos corridos')
  const t = tabela.map(l => l.time)
  const po = [idaEVolta(t[2], t[5], joga, pen, { serie: 'B', fase: 'playoff', rodada: 1 }, 'campanha'), idaEVolta(t[3], t[4], joga, pen, { serie: 'B', fase: 'playoff', rodada: 1 }, 'campanha')]
  return {
    serie: 'B', tabelas: [{ nome: 'Série B', tabela }], mataMata: [{ nome: 'Playoff de acesso', confrontos: po }],
    jogos: [...jogos, ...po.flatMap(c => c.jogos)], campeao: t[0], vice: t[1],
    sobem: [t[0], t[1], ...po.map(c => c.vencedor)], caem: t.slice(-4),
  }
}

/**
 * SÉRIE C 2026: 1ª fase com 20 em turno único (19 rodadas); 8 avançam; os 2 últimos caem. 2ª fase: grupos 1º/4º/5º/8º e
 * 2º/3º/6º/7º em turno e returno; os 2 primeiros de cada grupo sobem. Final entre os líderes dos grupos, ida e volta.
 * ✅ os pontos ZERAM na 2ª fase (regulamento: "a pontuação será zerada no início de cada fase") e o desempate só conta os
 *    jogos daquela fase (formatos-futuros.md).
 * ⚠️ INCERTO: desempate da final empatada no agregado — aqui pênaltis até confirmar.
 * 2027 (✅ 24 clubes, turno único de 23 rodadas, 8 avançam, 2 últimos caem, 2 grupos de 4, 2 primeiros sobem, final entre
 * os líderes): MESMA receita com 24 — ⚠️ INCERTO a composição dos grupos e se a final é ida e volta (usa a de 2026).
 */
export function serieC2026(times: string[], seed: number, joga: Joga, pen: Penaltis): Resultado {
  const ordem = embaralha(times, rngDe(seed ^ 0xC0C0))
  const f1 = pontosCorridos(ordem, turnoUnico(ordem.length), joga, 'C', '1ª fase')
  const t = f1.tabela.map(l => l.time)
  const g1 = [t[0], t[3], t[4], t[7]], g2 = [t[1], t[2], t[5], t[6]]
  const a = pontosCorridos(g1, turnoEReturno(4), joga, 'C', '2ª fase · Grupo 1')
  const b = pontosCorridos(g2, turnoEReturno(4), joga, 'C', '2ª fase · Grupo 2')
  const la = a.tabela.map(l => l.time), lb = b.tabela.map(l => l.time)
  // na final, quem tem melhor campanha decide em casa: a soma das duas fases
  const camp = (x: string) => { const p1 = f1.tabela.find(l => l.time === x)!, p2 = [...a.tabela, ...b.tabela].find(l => l.time === x)!; return p1.pts + p2.pts }
  const [m, p] = camp(la[0]) >= camp(lb[0]) ? [la[0], lb[0]] : [lb[0], la[0]]
  const final = idaEVolta(m, p, joga, pen, { serie: 'C', fase: 'final', rodada: 1 }, 'penaltis')
  return {
    serie: 'C', tabelas: [{ nome: '1ª fase', tabela: f1.tabela }, { nome: '2ª fase · Grupo 1', tabela: a.tabela }, { nome: '2ª fase · Grupo 2', tabela: b.tabela }],
    mataMata: [{ nome: 'Final', confrontos: [final] }], jogos: [...f1.jogos, ...a.jogos, ...b.jogos, ...final.jogos],
    campeao: final.vencedor, vice: final.vencedor === m ? p : m, sobem: [la[0], la[1], lb[0], lb[1]], caem: t.slice(-2),
  }
}

/**
 * SÉRIE D 2026: 96 em 16 grupos de 6 (A1…A16), turno e returno; os 4 primeiros de cada grupo avançam (64). Depois tudo em
 * ida e volta: 64 → 32 → 16 → quartas → semis → final. SOBEM 6: os 4 semifinalistas + os 2 vencedores dos playoffs entre os 4
 * eliminados nas quartas. Não há rebaixamento (a vaga vem pelos estaduais).
 * ⚠️ INCERTO: o chaveamento exato da 2ª fase (quem pega quem entre grupos) e o desempate no agregado — aqui: 1º de um grupo ×
 * 4º do grupo vizinho, 2º × 3º, e pênaltis; o playoff dos eliminados nas quartas casa pela ordem da chave.
 */
export function serieD2026(grupos: { nome: string; times: string[] }[], seed: number, joga: Joga, pen: Penaltis): Resultado {
  const r = rngDe(seed ^ 0xD0D0)
  const tabelas: { nome: string; tabela: Linha[] }[] = []
  const jogos: Jogo[] = []
  for (const g of grupos) {
    const f = pontosCorridos(embaralha(g.times, r), turnoEReturno(g.times.length), joga, 'D', `Grupo ${g.nome}`)
    tabelas.push({ nome: `Grupo ${g.nome}`, tabela: f.tabela }); jogos.push(...f.jogos)
  }
  // campanha de cada um na fase de grupos (decide o mando da volta)
  const linhaDe = new Map(tabelas.flatMap(t => t.tabela).map(l => [l.time, l]))
  const melhorPrimeiro = (x: string, y: string): [string, string] => {
    const a = linhaDe.get(x)!, b = linhaDe.get(y)!
    return (b.pts - a.pts || b.v - a.v || sg(b) - sg(a) || b.gp - a.gp) > 0 ? [y, x] : [x, y]
  }
  // 2ª fase: grupos em pares (A1×A2, A3×A4…): 1º×4º e 2º×3º cruzados
  let vivos: [string, string][] = []
  for (let i = 0; i < tabelas.length; i += 2) {
    const g = tabelas[i].tabela.map(l => l.time), h = tabelas[i + 1].tabela.map(l => l.time)
    vivos.push([g[0], h[3]], [h[0], g[3]], [g[1], h[2]], [h[1], g[2]])
  }
  const mataMata: { nome: string; confrontos: Confronto[] }[] = []
  const nomes = ['2ª fase', '3ª fase', '4ª fase', 'Quartas de final', 'Semifinal', 'Final']
  let eliminadosQuartas: string[] = []
  let semis: string[] = []
  for (const nome of nomes) {
    const conf = vivos.map(([x, y]) => { const [m, p] = melhorPrimeiro(x, y); return idaEVolta(m, p, joga, pen, { serie: 'D', fase: nome, rodada: 1 }, 'penaltis') })
    mataMata.push({ nome, confrontos: conf }); jogos.push(...conf.flatMap(c => c.jogos))
    if (nome === 'Quartas de final') eliminadosQuartas = conf.map(c => (c.vencedor === c.a ? c.b : c.a))
    if (nome === 'Semifinal') semis = conf.flatMap(c => [c.a, c.b])
    const w = conf.map(c => c.vencedor)
    vivos = []
    for (let i = 0; i + 1 < w.length; i += 2) vivos.push([w[i], w[i + 1]])
    if (nome === 'Final') {
      const f = conf[0]
      // playoff dos 4 eliminados nas quartas (2 vagas)
      const po: Confronto[] = []
      for (let i = 0; i + 1 < eliminadosQuartas.length; i += 2) { const [m, p] = melhorPrimeiro(eliminadosQuartas[i], eliminadosQuartas[i + 1]); po.push(idaEVolta(m, p, joga, pen, { serie: 'D', fase: 'Playoff de acesso', rodada: 1 }, 'penaltis')) }
      mataMata.push({ nome: 'Playoff de acesso', confrontos: po }); jogos.push(...po.flatMap(c => c.jogos))
      return { serie: 'D', tabelas, mataMata, jogos, campeao: f.vencedor, vice: f.vencedor === f.a ? f.b : f.a, sobem: [...semis, ...po.map(c => c.vencedor)], caem: [] }
    }
  }
  throw new Error('Série D: chave incompleta')
}

/**
 * SÉRIE C de 2028 em diante: ✅ 28 clubes em 2 grupos de 14, turno e returno dentro do grupo, ✅ 6 caem (CBF).
 * ⚠️ INCERTO (só 1–2 fontes de imprensa): os 4 primeiros de cada grupo avançam pra 2ª fase em dois grupos de 4 (mesma regra da
 * C 2026: 1º/4º/5º/8º × 2º/3º/6º/7º, juntando os 8 pela campanha), 2 primeiros de cada sobem (4 acessos), final entre os
 * líderes; e os 6 que caem são os 3 últimos de cada grupo. Grupos da 1ª fase: ⚠️ INCERTO o critério — aqui sorteio pela semente.
 */
export function serieC2028(times: string[], seed: number, joga: Joga, pen: Penaltis): Resultado {
  const ordem = embaralha(times, rngDe(seed ^ 0xC028))
  const g1 = ordem.slice(0, 14), g2 = ordem.slice(14, 28)
  const a = pontosCorridos(g1, turnoEReturno(14), joga, 'C', '1ª fase · Grupo A')
  const b = pontosCorridos(g2, turnoEReturno(14), joga, 'C', '1ª fase · Grupo B')
  const oito = ordena([...a.tabela.slice(0, 4), ...b.tabela.slice(0, 4)]).map(l => l.time)
  const h1 = [oito[0], oito[3], oito[4], oito[7]], h2 = [oito[1], oito[2], oito[5], oito[6]]
  const x = pontosCorridos(h1, turnoEReturno(4), joga, 'C', '2ª fase · Grupo 1')
  const y = pontosCorridos(h2, turnoEReturno(4), joga, 'C', '2ª fase · Grupo 2')
  const lx = x.tabela.map(l => l.time), ly = y.tabela.map(l => l.time)
  const linha1 = new Map([...a.tabela, ...b.tabela].map(l => [l.time, l]))
  const [m, p] = (linha1.get(lx[0])!.pts >= linha1.get(ly[0])!.pts) ? [lx[0], ly[0]] : [ly[0], lx[0]]
  const final = idaEVolta(m, p, joga, pen, { serie: 'C', fase: 'final', rodada: 1 }, 'penaltis')
  return {
    serie: 'C', tabelas: [{ nome: '1ª fase · Grupo A', tabela: a.tabela }, { nome: '1ª fase · Grupo B', tabela: b.tabela }, { nome: '2ª fase · Grupo 1', tabela: x.tabela }, { nome: '2ª fase · Grupo 2', tabela: y.tabela }],
    mataMata: [{ nome: 'Final', confrontos: [final] }], jogos: [...a.jogos, ...b.jogos, ...x.jogos, ...y.jogos, ...final.jogos],
    campeao: final.vencedor, vice: final.vencedor === m ? p : m, sobem: [lx[0], lx[1], ly[0], ly[1]],
    caem: [...a.tabela.slice(-3), ...b.tabela.slice(-3)].map(l => l.time),
  }
}

/** quantos clubes cada série tem em cada ano (✅ formatos-futuros.md). Depois de 2028 repete 2028 (nada anunciado). */
export function tamanhoDaSerie(serie: 'A' | 'B' | 'C' | 'D', ano: number): number {
  if (serie === 'C') return ano <= 2026 ? 20 : ano === 2027 ? 24 : 28
  if (serie === 'D') return 96
  return 20
}
/** quantos caem de cada série no fim do ano (✅): A 4 · B 4 · C 2 em 2026 e 2027, 6 a partir de 2028 · D não cai */
export function caemDaSerie(serie: 'A' | 'B' | 'C' | 'D', ano: number): number {
  if (serie === 'C') return ano >= 2028 ? 6 : 2
  return serie === 'D' ? 0 : 4
}
