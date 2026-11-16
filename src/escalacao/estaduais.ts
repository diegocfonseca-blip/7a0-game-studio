// 🏟️ ESTADUAIS DO BRASIL OFICIAL — o formato REAL de 2026 de cada estado (pesquisa em docs/brasil-oficial/competicoes-reais.md
// PARTE 1 e estaduais-faltantes.md). Regra do Diego: tudo real, nada inventado. O que a pesquisa não confirmou está marcado
// ⚠️ INCERTO aqui no código, com a escolha provisória ao lado (a mais simples que respeita o que é sabido).
// Módulo PURO (sem tela): cada estadual devolve as fases, o campeão, quem cai e a CLASSIFICAÇÃO FINAL (é dela que saem as
// vagas da Copa do Brasil do ano seguinte). Quem joga cada partida é o `joga` de quem chama (na carreira: o motor de sempre).
import { type Joga, type Penaltis, type Linha, type Jogo, type Confronto, type CtxJogo, ordena, embaralha, rngDe, turnoUnico, turnoEReturno, idaEVolta } from './campeonato-oficial'

export type FaseEstadual = { nome: string; tabelas: { nome: string; tabela: Linha[] }[]; confrontos: Confronto[]; rodadas: number }
export type ResultadoEstadual = {
  estadual: string
  fases: FaseEstadual[]
  jogos: Jogo[]
  campeao: string
  vice: string
  caem: string[]
  /** do campeão ao último (quem foi mais longe no mata-mata na frente; empate de fase = a campanha na 1ª fase) */
  classificacao: string[]
}

// ── peças ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
/** jogo único, mando de quem chega como `casa` (a melhor campanha, salvo regra do estado); empate = pênaltis */
function unico(casa: string, fora: string, joga: Joga, pen: Penaltis, ctx: Omit<CtxJogo, 'perna'>, empate: 'penaltis' | 'campanha' = 'penaltis'): Confronto {
  const p = joga(casa, fora, { ...ctx })
  const jogos: Jogo[] = [{ casa, fora, gc: p.gc, gf: p.gf, ctx: { ...ctx } }]
  if (p.gc !== p.gf) return { a: casa, b: fora, jogos, vencedor: p.gc > p.gf ? casa : fora }
  if (empate === 'campanha') return { a: casa, b: fora, jogos, vencedor: casa } // vantagem do empate pro mais bem colocado
  return { a: casa, b: fora, jogos, vencedor: pen(casa, fora, { ...ctx }), penaltis: true }
}
/** cada jogo de `pares` (casa, fora) distribuído em rodadas sem ninguém jogar duas vezes na mesma rodada (guloso, estável) */
function emRodadas(pares: [string, string][]): [string, string][][] {
  const rest = [...pares], out: [string, string][][] = []
  while (rest.length) {
    const usados = new Set<string>(), rod: [string, string][] = []
    for (let i = 0; i < rest.length;) {
      const [a, b] = rest[i]
      if (!usados.has(a) && !usados.has(b)) { rod.push(rest[i]); usados.add(a); usados.add(b); rest.splice(i, 1) } else i++
    }
    out.push(rod)
  }
  return out
}
/** pontos corridos com os jogos por NOME (rodada a rodada), tabela por grupo (ou geral) e só os jogos daquela fase no desempate */
function joga1(rodadas: [string, string][][], grupos: { nome: string; times: string[] }[], joga: Joga, est: string, fase: string): { tabelas: { nome: string; tabela: Linha[] }[]; jogos: Jogo[] } {
  const L = new Map<string, Linha>()
  for (const g of grupos) for (const t of g.times) L.set(t, { time: t, j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, pts: 0 })
  const jogos: Jogo[] = []
  rodadas.forEach((rod, r) => {
    for (const [casa, fora] of rod) {
      const ctx: CtxJogo = { serie: est, fase, rodada: r + 1 }
      const p = joga(casa, fora, ctx)
      jogos.push({ casa, fora, gc: p.gc, gf: p.gf, ctx })
      const lc = L.get(casa)!, lf = L.get(fora)!
      lc.j++; lf.j++; lc.gp += p.gc; lc.gc += p.gf; lf.gp += p.gf; lf.gc += p.gc
      if (p.gc > p.gf) { lc.v++; lc.pts += 3; lf.d++ } else if (p.gc < p.gf) { lf.v++; lf.pts += 3; lc.d++ } else { lc.e++; lf.e++; lc.pts++; lf.pts++ }
    }
  })
  return { tabelas: grupos.map(g => ({ nome: g.nome, tabela: ordena(g.times.map(t => L.get(t)!), jogos) })), jogos }
}
const nomes = (l: Linha[]) => l.map(x => x.time)
/** índices → nomes */
const porNome = (times: string[], rods: [number, number][][]): [string, string][][] => rods.map(r => r.map(([a, b]) => [times[a], times[b]] as [string, string]))
/** turno único só contra os do OUTRO grupo (2 grupos de mesmo tamanho): rodada r = A[i] × B[(i+r) % n], mando alternado */
function cruzado(A: string[], B: string[]): [string, string][][] {
  const n = A.length
  return Array.from({ length: n }, (_, r) => A.map((a, i) => { const b = B[(i + r) % n]; return ((i + r) % 2 ? [b, a] : [a, b]) as [string, string] }))
}
/** turno único contra todos os de OUTROS grupos (3+ grupos) */
function cruzadoN(grupos: string[][]): [string, string][][] {
  const pares: [string, string][] = []
  for (let g = 0; g < grupos.length; g++) for (let h = g + 1; h < grupos.length; h++) for (let i = 0; i < grupos[g].length; i++) for (let j = 0; j < grupos[h].length; j++) {
    const a = grupos[g][i], b = grupos[h][j]
    pares.push((i + j) % 2 ? [b, a] : [a, b])
  }
  return emRodadas(pares)
}
/** a tabela de todos juntos (classificação geral) a partir de tabelas de grupo */
const geral = (tabelas: { tabela: Linha[] }[], jogos: Jogo[]) => ordena(tabelas.flatMap(t => t.tabela), jogos)
/** quem foi mais longe na frente: `degraus` = do campeão pra trás; o resto pela campanha (`base`) */
function classifica(degraus: string[][], base: string[]): string[] {
  const out: string[] = []
  for (const d of degraus) for (const t of base) if (d.includes(t) && !out.includes(t)) out.push(t)
  for (const t of base) if (!out.includes(t)) out.push(t)
  return out
}
const perdedor = (c: Confronto) => (c.vencedor === c.a ? c.b : c.a)
/** cruzamento olímpico da classificação: 1×8, 2×7, 3×6, 4×5 (o melhor manda) */
const olimpico = (t: string[]): [string, string][] => Array.from({ length: t.length / 2 }, (_, i) => [t[i], t[t.length - 1 - i]] as [string, string])
/** mata-mata em sequência, chave fixa (o vencedor do jogo 1 pega o do jogo 2…), mando/volta na casa da melhor campanha */
function chave(pares: [string, string][], fases: { nome: string; pernas: 1 | 2; desempate?: 'penaltis' | 'campanha' }[], ordemCampanha: string[], joga: Joga, pen: Penaltis, est: string): { fases: FaseEstadual[]; jogos: Jogo[]; campeao: string; vice: string; degraus: string[][] } {
  const pos = (t: string) => ordemCampanha.indexOf(t)
  const melhorPrimeiro = ([a, b]: [string, string]): [string, string] => pos(a) <= pos(b) ? [a, b] : [b, a]
  let cur = pares.map(melhorPrimeiro)
  const out: FaseEstadual[] = [], jogos: Jogo[] = [], perdidos: string[][] = []
  for (let f = 0; f < fases.length; f++) {
    const F = fases[f]
    const conf = cur.map(([m, p]) => F.pernas === 2 ? idaEVolta(m, p, joga, pen, { serie: est, fase: F.nome, rodada: 1 }, F.desempate ?? 'penaltis') : unico(m, p, joga, pen, { serie: est, fase: F.nome, rodada: 1 }))
    out.push({ nome: F.nome, tabelas: [], confrontos: conf, rodadas: F.pernas })
    for (const c of conf) jogos.push(...c.jogos)
    perdidos.push(conf.map(perdedor))
    const venc = conf.map(c => c.vencedor)
    cur = []
    for (let i = 0; i + 1 < venc.length; i += 2) cur.push(melhorPrimeiro([venc[i], venc[i + 1]]))
    if (venc.length === 1) {
      const fin = conf[0]
      return { fases: out, jogos, campeao: fin.vencedor, vice: perdedor(fin), degraus: [[fin.vencedor], [perdedor(fin)], ...perdidos.slice(0, -1).reverse()] }
    }
  }
  throw new Error('chave sem final')
}

// ── os estaduais ─────────────────────────────────────────────────────────────────────────────────────────────────────────
type Fn = (seed: number, joga: Joga, pen: Penaltis) => ResultadoEstadual

/** RJ · Carioca: TG cruzada (A × B, 6 rodadas); quartas em jogo único DENTRO do grupo (1×4, 2×3); semis ida e volta
 *  (⚠️ INCERTO: confrontos por sorteio na vida real — aqui A×B cruzado, volta na casa do melhor); final em jogo único.
 *  Rebaixamento: 5º e 6º de cada grupo no Grupo X (turno e returno); o último cai (o penúltimo vai à repescagem com o vice da
 *  A2, que não existe no modo: ⚠️ INCERTO — fica). */
const carioca: Fn = (_seed, joga, pen) => {
  const E = 'Carioca'
  const A = ['Fluminense', 'Vasco', 'Volta Redonda', 'Bangu', 'Portuguesa-RJ', 'Sampaio Corrêa-RJ'], B = ['Botafogo', 'Madureira', 'Boavista-RJ', 'Flamengo', 'Nova Iguaçu', 'Maricá']
  const tg = joga1(cruzado(A, B), [{ nome: 'Grupo A', times: A }, { nome: 'Grupo B', times: B }], joga, E, 'Taça Guanabara')
  const [ta, tb] = tg.tabelas.map(t => nomes(t.tabela))
  const camp = nomes(geral(tg.tabelas, tg.jogos))
  const k = chave([[ta[0], ta[3]], [ta[1], ta[2]], [tb[0], tb[3]], [tb[1], tb[2]]], [{ nome: 'Quartas', pernas: 1 }, { nome: 'Semifinal', pernas: 2 }, { nome: 'Final', pernas: 1 }], camp, joga, pen, E)
  const x = [ta[4], ta[5], tb[4], tb[5]]
  const gx = joga1(porNome(x, turnoEReturno(4)), [{ nome: 'Grupo X', times: x }], joga, E, 'Grupo X')
  const caem = [nomes(gx.tabelas[0].tabela)[3]]
  return { estadual: E, fases: [{ nome: 'Taça Guanabara', tabelas: tg.tabelas, confrontos: [], rodadas: 6 }, ...k.fases, { nome: 'Grupo X', tabelas: gx.tabelas, confrontos: [], rodadas: 6 }],
    jogos: [...tg.jogos, ...k.jogos, ...gx.jogos], campeao: k.campeao, vice: k.vice, caem, classificacao: classifica(k.degraus, camp) }
}

/** SP · Paulistão A1: 4 potes, tabela única; cada clube joga os 3 do próprio pote + 5 de outros (8 rodadas). 8 melhores →
 *  quartas e semis em jogo único (1×8…), final ida e volta. 2 piores caem.
 *  ⚠️ INCERTO: quem enfrenta quem entre potes (o sorteio real) — aqui 2 jogos contra 2 potes e 1 contra o terceiro, fixo. */
const paulista: Fn = (_seed, joga, pen) => {
  const E = 'Paulista'
  const potes = [['Corinthians', 'Palmeiras', 'Santos', 'São Paulo'], ['São Bernardo', 'Novorizontino', 'Bragantino', 'Mirassol'], ['Ponte Preta', 'Guarani', 'Velo Clube', 'Portuguesa'], ['Botafogo-SP', 'Noroeste', 'Capivariano', 'Primavera-SP']]
  const pares: [string, string][] = []
  for (const p of potes) for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) pares.push((i + j) % 2 ? [p[j], p[i]] : [p[i], p[j]])
  const cruz: [number, number, number[]][] = [[0, 1, [0, 1]], [2, 3, [0, 1]], [0, 2, [2, 3]], [1, 3, [2, 3]], [0, 3, [0]], [1, 2, [0]]]
  for (const [x, y, ss] of cruz) for (const s of ss) for (let k = 0; k < 4; k++) pares.push((k + s) % 2 ? [potes[y][(k + s) % 4], potes[x][k]] : [potes[x][k], potes[y][(k + s) % 4]])
  const f1 = joga1(emRodadas(pares), [{ nome: 'Classificação', times: potes.flat() }], joga, E, '1ª fase')
  const t = nomes(f1.tabelas[0].tabela)
  const k = chave(olimpico(t.slice(0, 8)), [{ nome: 'Quartas', pernas: 1 }, { nome: 'Semifinal', pernas: 1 }, { nome: 'Final', pernas: 2 }], t, joga, pen, E)
  return { estadual: E, fases: [{ nome: '1ª fase', tabelas: f1.tabelas, confrontos: [], rodadas: 8 }, ...k.fases], jogos: [...f1.jogos, ...k.jogos], campeao: k.campeao, vice: k.vice, caem: t.slice(-2), classificacao: classifica(k.degraus, t) }
}

/** MG · Mineiro: 3 grupos de 4, cada um enfrenta os dos outros grupos (8 jogos). Os 3 líderes + o melhor 2º → semis ida e
 *  volta (volta na casa da melhor campanha; ⚠️ INCERTO o cruzamento — aqui 1×4 e 2×3 da campanha); final em jogo único
 *  (⚠️ mando da federação na vida real — aqui o de melhor campanha). Caem os 2 piores da classificação geral. */
const mineiro: Fn = (_seed, joga, pen) => {
  const E = 'Mineiro'
  const G = [['Atlético-MG', 'Democrata-GV', 'Uberlândia', 'URT'], ['América-MG', 'Betim', 'Pouso Alegre', 'Tombense'], ['Athletic', 'Cruzeiro', 'Itabirito', 'North']]
  const f1 = joga1(cruzadoN(G), G.map((times, i) => ({ nome: `Grupo ${'ABC'[i]}`, times })), joga, E, '1ª fase')
  const g = geral(f1.tabelas, f1.jogos), t = nomes(g)
  const lideres = f1.tabelas.map(x => x.tabela[0].time), seg = ordena(f1.tabelas.map(x => x.tabela[1]), f1.jogos)[0].time
  const semi = t.filter(x => lideres.includes(x) || x === seg)
  const k = chave([[semi[0], semi[3]], [semi[1], semi[2]]], [{ nome: 'Semifinal', pernas: 2 }, { nome: 'Final', pernas: 1 }], t, joga, pen, E)
  return { estadual: E, fases: [{ nome: '1ª fase', tabelas: f1.tabelas, confrontos: [], rodadas: 8 }, ...k.fases], jogos: [...f1.jogos, ...k.jogos], campeao: k.campeao, vice: k.vice, caem: t.slice(-2), classificacao: classifica(k.degraus, t) }
}

/** RS · Gauchão: 2 grupos de 6, cada um contra o outro grupo. 4 primeiros de cada grupo → quartas em jogo único (mando do
 *  melhor; ⚠️ INCERTO o cruzamento — aqui 1ºA×4ºB, 2ºA×3ºB, 1ºB×4ºA, 2ºB×3ºA); semis e final ida e volta. Os 2 últimos de
 *  cada grupo jogam o quadrangular do rebaixamento (⚠️ INCERTO turno único ou ida e volta — aqui turno único); caem os 2 piores. */
const gaucho: Fn = (_seed, joga, pen) => {
  const E = 'Gaúcho'
  const A = ['Avenida', 'Guarany de Bagé', 'Internacional', 'Juventude', 'São José-RS', 'São Luiz-RS'], B = ['Caxias', 'Grêmio', 'Inter-SM', 'Monsoon', 'Novo Hamburgo', 'Ypiranga']
  const f1 = joga1(cruzado(A, B), [{ nome: 'Grupo A', times: A }, { nome: 'Grupo B', times: B }], joga, E, '1ª fase')
  const [ta, tb] = f1.tabelas.map(x => nomes(x.tabela)), camp = nomes(geral(f1.tabelas, f1.jogos))
  const k = chave([[ta[0], tb[3]], [tb[1], ta[2]], [tb[0], ta[3]], [ta[1], tb[2]]], [{ nome: 'Quartas', pernas: 1 }, { nome: 'Semifinal', pernas: 2 }, { nome: 'Final', pernas: 2 }], camp, joga, pen, E)
  const q = [ta[4], ta[5], tb[4], tb[5]]
  const qd = joga1(porNome(q, turnoUnico(4)), [{ nome: 'Quadrangular do rebaixamento', times: q }], joga, E, 'Rebaixamento')
  return { estadual: E, fases: [{ nome: '1ª fase', tabelas: f1.tabelas, confrontos: [], rodadas: 6 }, ...k.fases, { nome: 'Rebaixamento', tabelas: qd.tabelas, confrontos: [], rodadas: 3 }],
    jogos: [...f1.jogos, ...k.jogos, ...qd.jogos], campeao: k.campeao, vice: k.vice, caem: nomes(qd.tabelas[0].tabela).slice(-2), classificacao: classifica(k.degraus, camp) }
}

/** PR · Paranaense: 2 grupos de 6, cada um contra o outro grupo. 4 de cada grupo; quartas e semis em ida e volta DENTRO do
 *  grupo (1×4, 2×3); final ida e volta. Os 2 piores de cada grupo: Torneio da Morte em ida e volta (5ºA×6ºB e 5ºB×6ºA;
 *  ⚠️ INCERTO o cruzamento); os 2 perdedores caem. */
const paranaense: Fn = (_seed, joga, pen) => {
  const E = 'Paranaense'
  const A = ['Athletico-PR', 'Cascavel', 'Foz do Iguaçu', 'Londrina', 'Maringá', 'São Joseense'], B = ['Andraus', 'Azuriz', 'Cianorte', 'Coritiba', 'Galo Maringá', 'Operário-PR']
  const f1 = joga1(cruzado(A, B), [{ nome: 'Grupo A', times: A }, { nome: 'Grupo B', times: B }], joga, E, '1ª fase')
  const [ta, tb] = f1.tabelas.map(x => nomes(x.tabela)), camp = nomes(geral(f1.tabelas, f1.jogos))
  const k = chave([[ta[0], ta[3]], [ta[1], ta[2]], [tb[0], tb[3]], [tb[1], tb[2]]], [{ nome: 'Quartas', pernas: 2 }, { nome: 'Semifinal', pernas: 2 }, { nome: 'Final', pernas: 2 }], camp, joga, pen, E)
  const morte = [idaEVolta(ta[4], tb[5], joga, pen, { serie: E, fase: 'Torneio da Morte', rodada: 1 }, 'penaltis'), idaEVolta(tb[4], ta[5], joga, pen, { serie: E, fase: 'Torneio da Morte', rodada: 1 }, 'penaltis')]
  return { estadual: E, fases: [{ nome: '1ª fase', tabelas: f1.tabelas, confrontos: [], rodadas: 6 }, ...k.fases, { nome: 'Torneio da Morte', tabelas: [], confrontos: morte, rodadas: 2 }],
    jogos: [...f1.jogos, ...k.jogos, ...morte.flatMap(c => c.jogos)], campeao: k.campeao, vice: k.vice, caem: morte.map(perdedor), classificacao: classifica(k.degraus, camp) }
}

/** SC · Catarinense: 2 grupos de 6 contra o outro grupo (6 rodadas). 4 de cada grupo → quartas DENTRO do grupo (1×4, 2×3),
 *  semis cruzando os grupos, final — tudo ida e volta. Os 2 últimos de cada grupo: quadrangular do descenso (6 rodadas =
 *  turno e returno); só o 1º fica, os outros 3 caem. */
const catarinense: Fn = (_seed, joga, pen) => {
  const E = 'Catarinense'
  const A = ['Avaí', 'Brusque', 'Camboriú', 'Concórdia', 'Joinville', 'Marcílio Dias'], B = ['Barra', 'Carlos Renaux', 'Chapecoense', 'Criciúma', 'Figueirense', 'Santa Catarina']
  const f1 = joga1(cruzado(A, B), [{ nome: 'Grupo A', times: A }, { nome: 'Grupo B', times: B }], joga, E, '1ª fase')
  const [ta, tb] = f1.tabelas.map(x => nomes(x.tabela)), camp = nomes(geral(f1.tabelas, f1.jogos))
  // quartas dentro do grupo; os vencedores de A1×A4 e B2×B3 se cruzam na semi (semis cruzando os grupos)
  const k = chave([[ta[0], ta[3]], [tb[1], tb[2]], [tb[0], tb[3]], [ta[1], ta[2]]], [{ nome: 'Quartas', pernas: 2 }, { nome: 'Semifinal', pernas: 2 }, { nome: 'Final', pernas: 2 }], camp, joga, pen, E)
  const q = [ta[4], ta[5], tb[4], tb[5]]
  const qd = joga1(porNome(q, turnoEReturno(4)), [{ nome: 'Quadrangular do descenso', times: q }], joga, E, 'Descenso')
  return { estadual: E, fases: [{ nome: '1ª fase', tabelas: f1.tabelas, confrontos: [], rodadas: 6 }, ...k.fases, { nome: 'Descenso', tabelas: qd.tabelas, confrontos: [], rodadas: 6 }],
    jogos: [...f1.jogos, ...k.jogos, ...qd.jogos], campeao: k.campeao, vice: k.vice, caem: nomes(qd.tabelas[0].tabela).slice(1), classificacao: classifica(k.degraus, camp) }
}

/** BA · Baianão: 10 em turno único (9 rodadas); 4 primeiros → semis e final em jogo único (mando da melhor campanha,
 *  empate = pênaltis). Os 2 últimos caem. */
const baiano: Fn = (_seed, joga, pen) => {
  const E = 'Baiano'
  const T = embaralha(['Bahia', 'Vitória', 'Jacuipense', 'Atlético-BA', 'Porto-BA', 'Juazeirense', 'Jequié', 'Barcelona de Ilhéus', 'Bahia de Feira', 'Galícia'], rngDe(_seed ^ 0xBA))
  const f1 = joga1(porNome(T, turnoUnico(10)), [{ nome: 'Classificação', times: T }], joga, E, '1ª fase')
  const t = nomes(f1.tabelas[0].tabela)
  const k = chave([[t[0], t[3]], [t[1], t[2]]], [{ nome: 'Semifinal', pernas: 1 }, { nome: 'Final', pernas: 1 }], t, joga, pen, E)
  return { estadual: E, fases: [{ nome: '1ª fase', tabelas: f1.tabelas, confrontos: [], rodadas: 9 }, ...k.fases], jogos: [...f1.jogos, ...k.jogos], campeao: k.campeao, vice: k.vice, caem: t.slice(-2), classificacao: classifica(k.degraus, t) }
}

/** PE · Pernambucano: 8 em turno único (7 rodadas). 1º e 2º direto às semis; 3º a 6º na 2ª fase em ida e volta (3º×6º,
 *  4º×5º); semis e final em ida e volta (empate no agregado = saldo, depois pênaltis — o agregado já é o saldo). Não há
 *  rebaixamento direto (o 8º volta pra etapa classificatória de 2027) — no modo, ninguém cai. */
const pernambucano: Fn = (_seed, joga, pen) => {
  const E = 'Pernambucano'
  const T = embaralha(['Sport', 'Náutico', 'Santa Cruz', 'Retrô', 'Maguary', 'Decisão', 'Jaguar', 'Vitória das Tabocas'], rngDe(_seed ^ 0x9E))
  const f1 = joga1(porNome(T, turnoUnico(8)), [{ nome: 'Classificação', times: T }], joga, E, '1ª fase')
  const t = nomes(f1.tabelas[0].tabela)
  const s2 = [idaEVolta(t[2], t[5], joga, pen, { serie: E, fase: '2ª fase', rodada: 1 }, 'penaltis'), idaEVolta(t[3], t[4], joga, pen, { serie: E, fase: '2ª fase', rodada: 1 }, 'penaltis')]
  const k = chave([[t[0], s2[1].vencedor], [t[1], s2[0].vencedor]], [{ nome: 'Semifinal', pernas: 2 }, { nome: 'Final', pernas: 2 }], t, joga, pen, E)
  return { estadual: E, fases: [{ nome: '1ª fase', tabelas: f1.tabelas, confrontos: [], rodadas: 7 }, { nome: '2ª fase', tabelas: [], confrontos: s2, rodadas: 2 }, ...k.fases],
    jogos: [...f1.jogos, ...s2.flatMap(c => c.jogos), ...k.jogos], campeao: k.campeao, vice: k.vice, caem: [], classificacao: classifica([...k.degraus, s2.map(perdedor)], t) }
}

/** CE · Cearense: 1ª fase em 2 grupos de 5 (turno único dentro do grupo, 4 jogos). 2ª fase: os 3 melhores de cada grupo
 *  enfrentam os 3 do OUTRO (3 jogos) em 2 grupos (C = os do A, D = os do B); os 2 primeiros de cada → semis ida e volta
 *  (1º×2º do mesmo grupo) e final ida e volta. Os 2 últimos de cada grupo da 1ª fase: Quadrangular da Permanência (turno
 *  único); os 2 últimos caem. ⚠️ INCERTO: se a 2ª fase soma os pontos da 1ª — aqui zera (conta só a 2ª fase). */
const cearense: Fn = (_seed, joga, pen) => {
  const E = 'Cearense'
  const A = ['Ferroviário-CE', 'Fortaleza', 'Horizonte', 'Maracanã-CE', 'Quixadá'], B = ['Ceará', 'Floresta', 'Iguatu', 'Maranguape', 'Tirol']
  const f1 = joga1([...porNome(A, turnoUnico(5)), ...porNome(B, turnoUnico(5))].reduce<[string, string][][]>((acc, r, i) => { const k = i % 5; (acc[k] ??= []).push(...r); return acc }, []), [{ nome: 'Grupo A', times: A }, { nome: 'Grupo B', times: B }], joga, E, '1ª fase')
  const [ta, tb] = f1.tabelas.map(x => nomes(x.tabela))
  const C = ta.slice(0, 3), D = tb.slice(0, 3)
  const f2 = joga1(cruzado(C, D), [{ nome: 'Grupo C', times: C }, { nome: 'Grupo D', times: D }], joga, E, '2ª fase')
  const [tc, td] = f2.tabelas.map(x => nomes(x.tabela))
  const camp = [...nomes(geral(f2.tabelas, f2.jogos)), ...nomes(geral(f1.tabelas, f1.jogos)).filter(x => !C.includes(x) && !D.includes(x))]
  const k = chave([[tc[0], tc[1]], [td[0], td[1]]], [{ nome: 'Semifinal', pernas: 2 }, { nome: 'Final', pernas: 2 }], camp, joga, pen, E)
  const q = [ta[3], ta[4], tb[3], tb[4]]
  const qd = joga1(porNome(q, turnoUnico(4)), [{ nome: 'Quadrangular da Permanência', times: q }], joga, E, 'Permanência')
  return { estadual: E, fases: [{ nome: '1ª fase', tabelas: f1.tabelas, confrontos: [], rodadas: 5 }, { nome: '2ª fase', tabelas: f2.tabelas, confrontos: [], rodadas: 3 }, ...k.fases, { nome: 'Permanência', tabelas: qd.tabelas, confrontos: [], rodadas: 3 }],
    jogos: [...f1.jogos, ...f2.jogos, ...k.jogos, ...qd.jogos], campeao: k.campeao, vice: k.vice, caem: nomes(qd.tabelas[0].tabela).slice(-2), classificacao: classifica(k.degraus, camp) }
}

/** GO · Goianão: 3 grupos de 4, cada um enfrenta os dos outros 2 grupos, classificação geral. 8 melhores → quartas, semis e
 *  final em ida e volta. Caem o 11º e o 12º (⚠️ o playoff de permanência entre 10º e 11º quando ficam a até 6 pontos ainda
 *  não entra — aqui caem os 2 últimos). Grupos: ⚠️ INCERTO (os da 1ª rodada da pesquisa, não reabertos). */
const goiano: Fn = (_seed, joga, pen) => {
  const E = 'Goiano'
  const G = [['Vila Nova', 'CRAC', 'Inhumas', 'Goiatuba'], ['Anápolis', 'Goiás', 'Jataiense', 'Aparecidense'], ['Atlético-GO', 'ABECAT', 'Centro Oeste', 'Anapolina']]
  const f1 = joga1(cruzadoN(G), [{ nome: 'Classificação geral', times: G.flat() }], joga, E, '1ª fase')
  const t = nomes(f1.tabelas[0].tabela)
  const k = chave(olimpico(t.slice(0, 8)), [{ nome: 'Quartas', pernas: 2 }, { nome: 'Semifinal', pernas: 2 }, { nome: 'Final', pernas: 2 }], t, joga, pen, E)
  return { estadual: E, fases: [{ nome: '1ª fase', tabelas: f1.tabelas, confrontos: [], rodadas: 8 }, ...k.fases], jogos: [...f1.jogos, ...k.jogos], campeao: k.campeao, vice: k.vice, caem: t.slice(-2), classificacao: classifica(k.degraus, t) }
}

/** PA · Parazão: 2 grupos de 6, cada um contra o outro grupo (6 jogos), classificação geral. 8 melhores → quartas e semis em
 *  jogo único (1×8…), final em ida e volta (pênaltis no empate). Os 2 últimos caem. Grupos: ⚠️ INCERTO (só se sabe que Remo
 *  e Paysandu foram cabeças de chave em grupos diferentes) — aqui alternados. */
const paraense: Fn = (_seed, joga, pen) => {
  const E = 'Paraense'
  const A = ['Remo', 'Tuna Luso', 'Cametá', 'Castanhal', 'Santa Rosa', 'São Francisco-PA'], B = ['Paysandu', 'Águia de Marabá', 'Amazônia', 'Bragantino-PA', 'Capitão Poço', 'São Raimundo-PA']
  const f1 = joga1(cruzado(A, B), [{ nome: 'Grupo A', times: A }, { nome: 'Grupo B', times: B }], joga, E, '1ª fase')
  const g = geral(f1.tabelas, f1.jogos), t = nomes(g)
  const k = chave(olimpico(t.slice(0, 8)), [{ nome: 'Quartas', pernas: 1 }, { nome: 'Semifinal', pernas: 1 }, { nome: 'Final', pernas: 2 }], t, joga, pen, E)
  return { estadual: E, fases: [{ nome: '1ª fase', tabelas: [{ nome: 'Classificação geral', tabela: g }], confrontos: [], rodadas: 6 }, ...k.fases], jogos: [...f1.jogos, ...k.jogos], campeao: k.campeao, vice: k.vice, caem: t.slice(-2), classificacao: classifica(k.degraus, t) }
}

/** AL · Alagoano: ⚠️ INCERTO o formato (não reconfirmado): 8 em turno único, 4 primeiros → semis e final em ida e volta.
 *  Rebaixado: ⚠️ INCERTO (CSE só por um espelho) — aqui cai o último. */
const alagoano: Fn = (_seed, joga, pen) => {
  const E = 'Alagoano'
  const T = embaralha(['CRB', 'ASA', 'CSA', 'Coruripe', 'CSE', 'Penedense', 'Cruzeiro-AL', 'Murici'], rngDe(_seed ^ 0xA1))
  const f1 = joga1(porNome(T, turnoUnico(8)), [{ nome: 'Classificação', times: T }], joga, E, '1ª fase')
  const t = nomes(f1.tabelas[0].tabela)
  const k = chave([[t[0], t[3]], [t[1], t[2]]], [{ nome: 'Semifinal', pernas: 2 }, { nome: 'Final', pernas: 2 }], t, joga, pen, E)
  return { estadual: E, fases: [{ nome: '1ª fase', tabelas: f1.tabelas, confrontos: [], rodadas: 7 }, ...k.fases], jogos: [...f1.jogos, ...k.jogos], campeao: k.campeao, vice: k.vice, caem: t.slice(-1), classificacao: classifica(k.degraus, t) }
}

/** AM · Amazonense (docs/brasil-oficial/estaduais-faltantes.md): 2 grupos de 4 (A: Amazonas, Itacoatiara, Manauara, Parintins ·
 *  B: Nacional-AM, Princesa do Solimões, Manaus, São Raimundo-AM). 1º turno contra o OUTRO grupo (4 jogos); 2º turno contra o
 *  PRÓPRIO grupo (3 jogos). Em cada turno: o líder de cada grupo vai à semi; 2º×3º num playoff de jogo único (mando e vantagem
 *  do empate pro mais bem colocado). Semis e final do turno em jogo único (pênaltis). Final do campeonato: campeão do 1º turno ×
 *  campeão do 2º, jogo único (mesmo campeão nos dois = campeão direto). Cai 1: o último da classificação geral (quem ganhou um
 *  turno não cai). ⚠️ INCERTO: o cruzamento do playoff (no real foi dentro do grupo no 1º turno e cruzado no 2º — aqui igual). */
const amazonense: Fn = (_seed, joga, pen) => {
  const E = 'Amazonense'
  const A = ['Amazonas', 'Itacoatiara', 'Manauara', 'Parintins'], B = ['Nacional-AM', 'Princesa do Solimões', 'Manaus', 'São Raimundo-AM']
  const turno = (nome: string, rodadas: [string, string][][], cruzaPlayoff: boolean) => {
    const f = joga1(rodadas, [{ nome: 'Grupo A', times: A }, { nome: 'Grupo B', times: B }], joga, E, nome)
    const [ta, tb] = f.tabelas.map(x => nomes(x.tabela))
    const po = cruzaPlayoff ? [unico(tb[1], ta[2], joga, pen, { serie: E, fase: `${nome} · playoff`, rodada: 1 }, 'campanha'), unico(ta[1], tb[2], joga, pen, { serie: E, fase: `${nome} · playoff`, rodada: 1 }, 'campanha')]
      : [unico(ta[1], ta[2], joga, pen, { serie: E, fase: `${nome} · playoff`, rodada: 1 }, 'campanha'), unico(tb[1], tb[2], joga, pen, { serie: E, fase: `${nome} · playoff`, rodada: 1 }, 'campanha')]
    const camp = nomes(geral(f.tabelas, f.jogos))
    const k = chave([[ta[0], po[cruzaPlayoff ? 1 : 0].vencedor], [tb[0], po[cruzaPlayoff ? 0 : 1].vencedor]], [{ nome: `${nome} · semifinal`, pernas: 1 }, { nome: `${nome} · final`, pernas: 1 }], camp, joga, pen, E)
    return { f, po, k }
  }
  const t1 = turno('1º turno', cruzado(A, B), false)
  const t2 = turno('2º turno', [...porNome(A, turnoUnico(4)), ...porNome(B, turnoUnico(4))].reduce<[string, string][][]>((acc, r, i) => { (acc[i % 3] ??= []).push(...r); return acc }, []), true)
  const todos = [...t1.f.jogos, ...t2.f.jogos]
  const g = nomes(ordena([...A, ...B].map(t => { const l = { time: t, j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, pts: 0 }; for (const j of todos) { if (j.casa !== t && j.fora !== t) continue; const gp = j.casa === t ? j.gc : j.gf, gc = j.casa === t ? j.gf : j.gc; l.j++; l.gp += gp; l.gc += gc; if (gp > gc) { l.v++; l.pts += 3 } else if (gp === gc) { l.e++; l.pts++ } else l.d++ } return l }), todos))
  const c1 = t1.k.campeao, c2 = t2.k.campeao
  const fin = c1 === c2 ? null : unico(c1, c2, joga, pen, { serie: E, fase: 'Final', rodada: 1 })
  const campeao = fin ? fin.vencedor : c1, vice = fin ? perdedor(fin) : (g.find(x => x !== c1) ?? c1)
  const fases: FaseEstadual[] = [{ nome: '1º turno', tabelas: t1.f.tabelas, confrontos: [], rodadas: 4 }, { nome: '1º turno · playoff', tabelas: [], confrontos: t1.po, rodadas: 1 }, ...t1.k.fases,
    { nome: '2º turno', tabelas: t2.f.tabelas, confrontos: [], rodadas: 3 }, { nome: '2º turno · playoff', tabelas: [], confrontos: t2.po, rodadas: 1 }, ...t2.k.fases, ...(fin ? [{ nome: 'Final', tabelas: [], confrontos: [fin], rodadas: 1 }] : [])]
  const caem = g.filter(x => x !== c1 && x !== c2).slice(-1)
  return { estadual: E, fases, jogos: [...todos, ...t1.po.flatMap(c => c.jogos), ...t1.k.jogos, ...t2.po.flatMap(c => c.jogos), ...t2.k.jogos, ...(fin ? fin.jogos : [])], campeao, vice, caem,
    classificacao: classifica([[campeao], [vice], [t1.k.vice, t2.k.vice]], g) }
}

/** MA · Maranhense: 8 em turno único (7 jogos). 1º×4º e 2º×3º; semis e final em ida e volta (pênaltis). O 8º cai direto;
 *  6º e 7º jogam o descenso em ida e volta (volta na casa do 6º), o perdedor cai. */
const maranhense: Fn = (_seed, joga, pen) => {
  const E = 'Maranhense'
  const T = embaralha(['Maranhão', 'IAPE', 'Imperatriz', 'ITZ', 'Luminense', 'Moto Club', 'Sampaio Corrêa', 'Tuntum'], rngDe(_seed ^ 0x3A))
  const f1 = joga1(porNome(T, turnoUnico(8)), [{ nome: 'Classificação', times: T }], joga, E, '1ª fase')
  const t = nomes(f1.tabelas[0].tabela)
  const k = chave([[t[0], t[3]], [t[1], t[2]]], [{ nome: 'Semifinal', pernas: 2 }, { nome: 'Final', pernas: 2 }], t, joga, pen, E)
  const desc = idaEVolta(t[5], t[6], joga, pen, { serie: E, fase: 'Descenso', rodada: 1 }, 'penaltis')
  return { estadual: E, fases: [{ nome: '1ª fase', tabelas: f1.tabelas, confrontos: [], rodadas: 7 }, ...k.fases, { nome: 'Descenso', tabelas: [], confrontos: [desc], rodadas: 2 }],
    jogos: [...f1.jogos, ...k.jogos, ...desc.jogos], campeao: k.campeao, vice: k.vice, caem: [t[7], perdedor(desc)], classificacao: classifica(k.degraus, t) }
}

/** PB · Paraibano: 10 em turno único (9 jogos). 1º×4º e 2º×3º; semis e final em ida e volta (pênaltis). Os 2 últimos caem. */
const paraibano: Fn = (_seed, joga, pen) => {
  const E = 'Paraibano'
  const T = embaralha(['Botafogo-PB', 'Atlético de Cajazeiras', 'Campinense', 'Confiança-PB', 'Esporte de Patos', 'Nacional de Patos', 'Pombal', 'Serra Branca', 'Sousa', 'Treze'], rngDe(_seed ^ 0x9B))
  const f1 = joga1(porNome(T, turnoUnico(10)), [{ nome: 'Classificação', times: T }], joga, E, '1ª fase')
  const t = nomes(f1.tabelas[0].tabela)
  const k = chave([[t[0], t[3]], [t[1], t[2]]], [{ nome: 'Semifinal', pernas: 2 }, { nome: 'Final', pernas: 2 }], t, joga, pen, E)
  return { estadual: E, fases: [{ nome: '1ª fase', tabelas: f1.tabelas, confrontos: [], rodadas: 9 }, ...k.fases], jogos: [...f1.jogos, ...k.jogos], campeao: k.campeao, vice: k.vice, caem: t.slice(-2), classificacao: classifica(k.degraus, t) }
}

/** SE · Sergipano: 10 em turno único (9 rodadas). O 1º vai direto à semi; 2×7, 3×6, 4×5 em jogo único (pênaltis). Semis e
 *  final em ida e volta (⚠️ INCERTO o cruzamento das semis — aqui o 1º pega o pior dos vencedores). Os 2 últimos caem. */
const sergipano: Fn = (_seed, joga, pen) => {
  const E = 'Sergipano'
  const T = embaralha(['Confiança', 'Itabaiana', 'América-SE', 'Atlético Gloriense', 'Desportiva Aracaju', 'Dorense', 'Falcon', 'Guarany-SE', 'Lagarto', 'Sergipe'], rngDe(_seed ^ 0x5E))
  const f1 = joga1(porNome(T, turnoUnico(10)), [{ nome: 'Classificação', times: T }], joga, E, '1ª fase')
  const t = nomes(f1.tabelas[0].tabela)
  const q = [unico(t[1], t[6], joga, pen, { serie: E, fase: 'Quartas', rodada: 1 }), unico(t[2], t[5], joga, pen, { serie: E, fase: 'Quartas', rodada: 1 }), unico(t[3], t[4], joga, pen, { serie: E, fase: 'Quartas', rodada: 1 })]
  const v = q.map(c => c.vencedor).sort((a, b) => t.indexOf(a) - t.indexOf(b))
  const k = chave([[t[0], v[2]], [v[0], v[1]]], [{ nome: 'Semifinal', pernas: 2 }, { nome: 'Final', pernas: 2 }], t, joga, pen, E)
  return { estadual: E, fases: [{ nome: '1ª fase', tabelas: f1.tabelas, confrontos: [], rodadas: 9 }, { nome: 'Quartas', tabelas: [], confrontos: q, rodadas: 1 }, ...k.fases],
    jogos: [...f1.jogos, ...q.flatMap(c => c.jogos), ...k.jogos], campeao: k.campeao, vice: k.vice, caem: t.slice(-2), classificacao: classifica([...k.degraus, q.map(perdedor)], t) }
}

/** MT · Mato-Grossense: 10 em turno único (9 jogos). 1º e 2º direto às semis; 3×6 e 4×5 na eliminatória de jogo único
 *  (pênaltis). Semis e final em ida e volta. Os 2 últimos caem. ⚠️ INCERTO o cruzamento das semis — aqui 1º × pior vencedor. */
const matogrossense: Fn = (_seed, joga, pen) => {
  const E = 'Mato-Grossense'
  const T = embaralha(['Cuiabá', 'Chapada', 'Luverdense', 'Mixto', 'Nova Mutum', 'Operário VG', 'Primavera-MT', 'Sinop', 'União Rondonópolis', 'Várzea Grande'], rngDe(_seed ^ 0x37))
  const f1 = joga1(porNome(T, turnoUnico(10)), [{ nome: 'Classificação', times: T }], joga, E, '1ª fase')
  const t = nomes(f1.tabelas[0].tabela)
  const el = [unico(t[2], t[5], joga, pen, { serie: E, fase: 'Eliminatória', rodada: 1 }), unico(t[3], t[4], joga, pen, { serie: E, fase: 'Eliminatória', rodada: 1 })]
  const v = el.map(c => c.vencedor).sort((a, b) => t.indexOf(a) - t.indexOf(b))
  const k = chave([[t[0], v[1]], [t[1], v[0]]], [{ nome: 'Semifinal', pernas: 2 }, { nome: 'Final', pernas: 2 }], t, joga, pen, E)
  return { estadual: E, fases: [{ nome: '1ª fase', tabelas: f1.tabelas, confrontos: [], rodadas: 9 }, { nome: 'Eliminatória', tabelas: [], confrontos: el, rodadas: 1 }, ...k.fases],
    jogos: [...f1.jogos, ...el.flatMap(c => c.jogos), ...k.jogos], campeao: k.campeao, vice: k.vice, caem: t.slice(-2), classificacao: classifica([...k.degraus, el.map(perdedor)], t) }
}

/** os estaduais com formato (a chave é o nome do estadual na lista mestra: `ClubeOficial.estadual`) */
export const ESTADUAIS: Record<string, Fn> = {
  Carioca: carioca, Paulista: paulista, Mineiro: mineiro, 'Gaúcho': gaucho, Paranaense: paranaense, Catarinense: catarinense,
  Baiano: baiano, Pernambucano: pernambucano, Cearense: cearense, Goiano: goiano, Paraense: paraense, Alagoano: alagoano,
  Amazonense: amazonense, Maranhense: maranhense, Paraibano: paraibano, Sergipano: sergipano, 'Mato-Grossense': matogrossense,
}
/** nome bonito do estadual na tela */
export const NOME_ESTADUAL: Record<string, string> = {
  Carioca: 'Carioca', Paulista: 'Paulistão', Mineiro: 'Mineiro', 'Gaúcho': 'Gauchão', Paranaense: 'Paranaense', Catarinense: 'Catarinense',
  Baiano: 'Baianão', Pernambucano: 'Pernambucano', Cearense: 'Cearense', Goiano: 'Goianão', Paraense: 'Parazão', Alagoano: 'Alagoano',
  Amazonense: 'Barezão', Maranhense: 'Maranhense', Paraibano: 'Paraibano', Sergipano: 'Sergipano', 'Mato-Grossense': 'Mato-Grossense',
}
export function simulaEstadual(nome: string, seed: number, joga: Joga, pen: Penaltis): ResultadoEstadual | null {
  const f = ESTADUAIS[nome]
  return f ? f(seed, joga, pen) : null
}
