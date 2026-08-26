// ─── 🧢 OS 100 TÉCNICOS — dados (lista FECHADA pelo Diego, 26/08) ────────────
//
// Fonte: docs/tecnicos-100.md. 20 por divisão; a categoria segue a divisão de
// ORIGEM (onde o técnico começa). Esquemas liberados por categoria:
// A 5 · B 4 · C 3 · D 2 · Várzea 1.
//
// 🎽 REGRA DO ESTILO (Diego 26/08): as formações que o técnico domina saem do
// ESTILO DA VIDA REAL dele — a categoria corta a QUANTIDADE, o estilo define
// QUAIS entram (a coluna do estilo dele em formacoes.ts, na ordem).
// Equilibrado mistura o básico dos três estilos.
//
// ⚠️ REGRA DA PESSOA REAL (Diego 18/08: "quando você não souber quem é a pessoa,
// me fala"): `chute: true` marca estilo que é PALPITE meu, não estilo
// documentado/consagrado do treinador — esses o Diego revisa um a um antes de
// qualquer coisa ir pro ar. Sem referência clara, o neutro é 'equilibrado'.
// A revisão completa está em docs/tecnicos-100.md.
import { COLUNA_ESTILO, ORDEM_EQUILIBRADO, FORMACOES15 } from './formacoes'
import type { EstiloFormacao } from './formacoes'

export type DivTecnico = 'A' | 'B' | 'C' | 'D' | 'V'
export type EstiloTecnico = EstiloFormacao | 'equilibrado' // retranca · posse · ofensiva · equilibrado

export interface Tecnico {
  nome: string
  pais: string // bandeira
  div: DivTecnico // divisão de origem = categoria da carta
  estilo: EstiloTecnico
  chute?: boolean // ⚠️ estilo chutado (pendente de revisão do Diego) — nunca mostrar como fato
  // ajuste fino INDIVIDUAL de overall (só quando o Diego mandar destacar um nome);
  // sem eles, vale a faixa da categoria (FAIXA_POR_DIV).
  lo?: number
  hi?: number
}

export const ESQUEMAS_POR_DIV: Record<DivTecnico, number> = { A: 5, B: 4, C: 3, D: 2, V: 1 }

export const DIV_TECNICO_ROTULO: Record<DivTecnico, string> = {
  A: 'Série A', B: 'Série B', C: 'Série C', D: 'Série D', V: 'Várzea',
}

// ── 📊 NÍVEL (overall) do técnico — mesma régua das cartas de JOGADOR ────────
// Decisão do Diego (26/08): o técnico tem AS MESMAS categorias do jogador —
// 👑 Lenda · ⭐ Craque · 💜 Promessa · 💚 Bom jogador · 🤎 Foi profissional —
// uma por divisão de origem. A carta usa o MESMO visual (tier/cor) das cartas
// de jogador: dourado, prata, roxo, verde, bege.
// A faixa lo–hi é a típica dos jogadores da mesma categoria no baralho real
// (medida em data.ts). Em cada partida o overall do técnico é SORTEADO dentro
// da faixa, igual jogador — dia inspirado, dia apagado.
// Todos os técnicos da MESMA categoria começam com a MESMA faixa (não inventei
// ranking entre gente de verdade); quando o Diego quiser destacar um nome
// ("Ferguson mais forte"), é preencher lo/hi na linha dele que a faixa
// individual passa por cima.
export const FAME_POR_DIV: Record<DivTecnico, number> = { A: 5, B: 4, C: 3, D: 2, V: 1 }
// 💜 a promessa não é um fame — é o selo roxo (igual na carta de jogador, onde
// `promessa: true` pinta o tier roxo, nível logo abaixo de craque).
export const PROMESSA_POR_DIV: Record<DivTecnico, boolean> = { A: false, B: false, C: true, D: false, V: false }
export const CATEGORIA_TECNICO_ROTULO: Record<DivTecnico, string> = {
  A: '👑 Lenda', B: '⭐ Craque', C: '💜 Promessa', D: '💚 Bom jogador', V: '🤎 Foi profissional',
}
export const FAIXA_POR_DIV: Record<DivTecnico, { lo: number; hi: number }> = {
  A: { lo: 89, hi: 95 },
  B: { lo: 83, hi: 91 },
  C: { lo: 76, hi: 86 },
  D: { lo: 68, hi: 80 },
  V: { lo: 55, hi: 70 },
}
// 💰 piso do leilão de aliciar, por categoria (na régua dos preços de jogador
// da carreira: craque de leilão sai por 20-40 🪙). O lance começa no piso e o
// clube dono + rivais brigam por cima.
export const PISO_TECNICO: Record<DivTecnico, number> = { A: 25, B: 18, C: 12, D: 6, V: 2 }
export const tecnicoPorNome = (nome: string): Tecnico | undefined => TECNICOS.find(t => t.nome === nome)
export const poolDaDiv = (div: DivTecnico): Tecnico[] => TECNICOS.filter(t => t.div === div)
// a ficha completa pra montar a CARTA do técnico (formato de carta de jogador)
export function fichaDoTecnico(t: Tecnico): { fame: number; promessa: boolean; lo: number; hi: number; formacoes: string[] } {
  const faixa = FAIXA_POR_DIV[t.div]
  return { fame: FAME_POR_DIV[t.div], promessa: PROMESSA_POR_DIV[t.div], lo: t.lo ?? faixa.lo, hi: t.hi ?? faixa.hi, formacoes: formacoesDoTecnico(t) }
}

// as formações (rótulos visíveis de formacoes.ts) que o técnico domina.
// 🎽 v2 (decisão do Diego 26/08, vinda da pesquisa dele): técnico = estilo +
// REPERTÓRIO PRÓPRIO. Cada um usa as formações da vida real DELE (mapeadas nas
// nossas 15), não uma coluna genérica do estilo — o 4-3-3 do Guardiola e o
// 4-3-3 de um retranqueiro são a mesma carta de formação, o que muda é quem usa.
// O estilo continua na carta como o "tempero" (e é o fallback de quem ficou sem
// repertório mapeado). A categoria segue cortando a QUANTIDADE (A5…V1).
export function formacoesDoTecnico(t: Pick<Tecnico, 'nome' | 'div' | 'estilo'>): string[] {
  const n = ESQUEMAS_POR_DIV[t.div]
  const proprio = REPERTORIO[t.nome]
  if (proprio?.length) {
    const out = proprio.filter(r => FORMACOES15.some(f => f.rotulo === r)).slice(0, n)
    // repertório curto pro tamanho da categoria: completa com o básico neutro
    for (const r of [...ORDEM_EQUILIBRADO, ...FORMACOES15.map(f => f.rotulo)]) {
      if (out.length >= n) break
      if (!out.includes(r)) out.push(r)
    }
    return out
  }
  const ordem = t.estilo === 'equilibrado' ? ORDEM_EQUILIBRADO : COLUNA_ESTILO[t.estilo]
  return ordem.slice(0, n)
}

export const TECNICOS: Tecnico[] = [
  // 🅰️ SÉRIE A — LENDAS (5 esquemas)
  { nome: 'Alex Ferguson', pais: '🇬🇧', div: 'A', estilo: 'ofensiva' },
  { nome: 'Pep Guardiola', pais: '🇪🇸', div: 'A', estilo: 'posse' },
  { nome: 'Carlo Ancelotti', pais: '🇮🇹', div: 'A', estilo: 'equilibrado' },
  { nome: 'José Mourinho', pais: '🇵🇹', div: 'A', estilo: 'retranca' },
  { nome: 'Zinedine Zidane', pais: '🇫🇷', div: 'A', estilo: 'equilibrado' },
  { nome: 'Johan Cruyff', pais: '🇳🇱', div: 'A', estilo: 'posse' },
  { nome: 'Rinus Michels', pais: '🇳🇱', div: 'A', estilo: 'ofensiva' },
  { nome: 'Arrigo Sacchi', pais: '🇮🇹', div: 'A', estilo: 'ofensiva' },
  { nome: 'Jupp Heynckes', pais: '🇩🇪', div: 'A', estilo: 'ofensiva' },
  { nome: 'Marcello Lippi', pais: '🇮🇹', div: 'A', estilo: 'equilibrado' },
  { nome: 'Vicente del Bosque', pais: '🇪🇸', div: 'A', estilo: 'posse' },
  { nome: 'Telê Santana', pais: '🇧🇷', div: 'A', estilo: 'ofensiva' }, // subiu da B (26/08, Diego: "pra mim Telê Santana é Série A") — o pai do futebol-arte com as 5 formações
  { nome: 'Giovanni Trapattoni', pais: '🇮🇹', div: 'A', estilo: 'retranca' },
  { nome: 'Fabio Capello', pais: '🇮🇹', div: 'A', estilo: 'retranca' },
  { nome: 'Jürgen Klopp', pais: '🇩🇪', div: 'A', estilo: 'ofensiva' },
  { nome: 'Louis van Gaal', pais: '🇳🇱', div: 'A', estilo: 'posse' },
  { nome: 'Arsène Wenger', pais: '🇫🇷', div: 'A', estilo: 'ofensiva' },
  { nome: 'Luis Enrique', pais: '🇪🇸', div: 'A', estilo: 'posse' },
  { nome: 'Diego Simeone', pais: '🇦🇷', div: 'A', estilo: 'retranca' },
  { nome: 'Luis de la Fuente', pais: '🇪🇸', div: 'A', estilo: 'posse' }, // campeão do mundo 2026 + Euro 2024 + Nations League (info do Diego 26/08)
  // 🅱️ SÉRIE B — GIGANTES (4 esquemas)
  { nome: 'Marcelo Gallardo', pais: '🇦🇷', div: 'B', estilo: 'ofensiva' },
  { nome: 'Marcelo Bielsa', pais: '🇦🇷', div: 'B', estilo: 'ofensiva' }, // subiu da C (26/08, OK do Diego): o "mestre" do Pep e do Sampaoli
  { nome: 'Lionel Scaloni', pais: '🇦🇷', div: 'B', estilo: 'equilibrado' }, // entrou 26/08: campeão do mundo 2022 + 2 Copa América — prateleira Deschamps/Parreira
  { nome: 'Antonio Conte', pais: '🇮🇹', div: 'B', estilo: 'retranca', chute: true },
  { nome: 'Roberto Mancini', pais: '🇮🇹', div: 'B', estilo: 'equilibrado', chute: true },
  { nome: 'Rafael Benítez', pais: '🇪🇸', div: 'B', estilo: 'retranca' },
  { nome: 'Frank Rijkaard', pais: '🇳🇱', div: 'B', estilo: 'posse' },
  { nome: 'Guus Hiddink', pais: '🇳🇱', div: 'B', estilo: 'equilibrado', chute: true },
  { nome: 'Unai Emery', pais: '🇪🇸', div: 'B', estilo: 'equilibrado', chute: true },
  { nome: 'Massimiliano Allegri', pais: '🇮🇹', div: 'B', estilo: 'retranca' },
  { nome: 'Thomas Tuchel', pais: '🇩🇪', div: 'B', estilo: 'posse' },
  { nome: 'Manuel Pellegrini', pais: '🇨🇱', div: 'B', estilo: 'ofensiva' },
  { nome: 'Luiz Felipe Scolari', pais: '🇧🇷', div: 'B', estilo: 'equilibrado', chute: true },
  { nome: 'Carlos Alberto Parreira', pais: '🇧🇷', div: 'B', estilo: 'retranca' },
  { nome: 'Mario Zagallo', pais: '🇧🇷', div: 'B', estilo: 'equilibrado', chute: true },
  { nome: 'Joachim Löw', pais: '🇩🇪', div: 'B', estilo: 'posse' }, // desceu da A (26/08): uma Copa (2014) e queda no fim — naipe do Deschamps/Parreira, que são B
  { nome: 'César Luis Menotti', pais: '🇦🇷', div: 'B', estilo: 'ofensiva' },
  { nome: 'Carlos Bilardo', pais: '🇦🇷', div: 'B', estilo: 'retranca' },
  { nome: 'Didier Deschamps', pais: '🇫🇷', div: 'B', estilo: 'retranca' },
  { nome: 'Luis Aragonés', pais: '🇪🇸', div: 'B', estilo: 'posse' },
  { nome: 'Hansi Flick', pais: '🇩🇪', div: 'B', estilo: 'ofensiva' }, // entrou no lugar do Eriksson (26/08): sêxtuplo do Bayern 2020, pressão alta
  { nome: 'Carlos Bianchi', pais: '🇦🇷', div: 'B', estilo: 'retranca' }, // subiu da C (26/08, ordem do Diego: "suba Bianchi pra B")
  // 🅲 SÉRIE C — GRANDES / CAMPEÕES / ASCENSÃO (3 esquemas)
  { nome: 'Hernán Crespo', pais: '🇦🇷', div: 'C', estilo: 'ofensiva', chute: true },
  { nome: 'Mauricio Pochettino', pais: '🇦🇷', div: 'C', estilo: 'ofensiva' }, // entrou 26/08: pressão alta, final de Champions com o Spurs
  { nome: 'Gian Piero Gasperini', pais: '🇮🇹', div: 'C', estilo: 'ofensiva' }, // entrou 26/08: Europa League 2024, a revolução da Atalanta
  { nome: 'Rúben Amorim', pais: '🇵🇹', div: 'C', estilo: 'posse', chute: true }, // entrou 26/08: títulos no Sporting, 3-4-3 posicional
  { nome: 'Roberto De Zerbi', pais: '🇮🇹', div: 'C', estilo: 'posse' }, // entrou 26/08: a saída de bola mais estudada da Europa (Brighton)
  { nome: 'Jürgen Klinsmann', pais: '🇩🇪', div: 'C', estilo: 'ofensiva' }, // desceu da B pra abrir a vaga do Bianchi (sugestão minha 26/08 — se o Diego preferir outro, é uma linha)
  { nome: 'Jorge Jesus', pais: '🇵🇹', div: 'C', estilo: 'ofensiva' },
  { nome: 'Abel Ferreira', pais: '🇵🇹', div: 'C', estilo: 'retranca' },
  { nome: 'Tite', pais: '🇧🇷', div: 'C', estilo: 'equilibrado' },
  { nome: 'Muricy Ramalho', pais: '🇧🇷', div: 'C', estilo: 'retranca', chute: true },
  { nome: 'Vanderlei Luxemburgo', pais: '🇧🇷', div: 'C', estilo: 'equilibrado', chute: true },
  { nome: 'Jorge Sampaoli', pais: '🇦🇷', div: 'C', estilo: 'ofensiva' },
  { nome: 'Ramón Díaz', pais: '🇦🇷', div: 'C', estilo: 'equilibrado', chute: true },
  { nome: 'José Pékerman', pais: '🇦🇷', div: 'C', estilo: 'posse', chute: true },
  { nome: 'Fernando Santos', pais: '🇵🇹', div: 'C', estilo: 'retranca' },
  { nome: 'Claudio Ranieri', pais: '🇮🇹', div: 'C', estilo: 'retranca' },
  { nome: 'Luciano Spalletti', pais: '🇮🇹', div: 'C', estilo: 'posse' },
  { nome: 'Maurizio Sarri', pais: '🇮🇹', div: 'C', estilo: 'posse' },
  { nome: 'Enzo Maresca', pais: '🇮🇹', div: 'C', estilo: 'posse' }, // escola Guardiola: Mundial de Clubes e Conference com o Chelsea, acesso com o Leicester
  { nome: 'Xavi Hernández', pais: '🇪🇸', div: 'C', estilo: 'posse' },
  { nome: 'Mikel Arteta', pais: '🇪🇸', div: 'C', estilo: 'posse' },
  { nome: 'Xabi Alonso', pais: '🇪🇸', div: 'C', estilo: 'posse' },
  { nome: 'Rogério Ceni', pais: '🇧🇷', div: 'C', estilo: 'ofensiva', chute: true },
  // 🅳 SÉRIE D — FAMOSOS / EX-CRAQUES / FLOPS (2 esquemas)
  { nome: 'Ronald Koeman', pais: '🇳🇱', div: 'D', estilo: 'equilibrado', chute: true },
  { nome: 'Gennaro Gattuso', pais: '🇮🇹', div: 'D', estilo: 'retranca', chute: true },
  { nome: 'Andrea Pirlo', pais: '🇮🇹', div: 'D', estilo: 'posse', chute: true },
  { nome: 'Thierry Henry', pais: '🇫🇷', div: 'D', estilo: 'posse', chute: true },
  { nome: 'Patrick Vieira', pais: '🇫🇷', div: 'D', estilo: 'equilibrado', chute: true },
  { nome: 'Fabio Cannavaro', pais: '🇮🇹', div: 'D', estilo: 'equilibrado', chute: true },
  { nome: 'Clarence Seedorf', pais: '🇳🇱', div: 'D', estilo: 'equilibrado', chute: true },
  { nome: 'Diego Maradona', pais: '🇦🇷', div: 'D', estilo: 'ofensiva', chute: true },
  { nome: 'Gary Neville', pais: '🏴', div: 'D', estilo: 'equilibrado', chute: true },
  { nome: 'Martín Palermo', pais: '🇦🇷', div: 'D', estilo: 'equilibrado', chute: true },
  { nome: 'Dunga', pais: '🇧🇷', div: 'D', estilo: 'retranca' },
  { nome: 'Fernando Diniz', pais: '🇧🇷', div: 'D', estilo: 'posse' },
  { nome: 'Mano Menezes', pais: '🇧🇷', div: 'D', estilo: 'equilibrado', chute: true },
  { nome: 'Cuca', pais: '🇧🇷', div: 'D', estilo: 'ofensiva', chute: true },
  { nome: 'Renato Gaúcho', pais: '🇧🇷', div: 'D', estilo: 'ofensiva', chute: true },
  { nome: 'Dorival Júnior', pais: '🇧🇷', div: 'D', estilo: 'equilibrado', chute: true },
  { nome: 'Paulo Autuori', pais: '🇧🇷', div: 'D', estilo: 'equilibrado', chute: true },
  { nome: 'Erik ten Hag', pais: '🇳🇱', div: 'D', estilo: 'posse' },
  { nome: 'André Villas-Boas', pais: '🇵🇹', div: 'D', estilo: 'ofensiva' },
  { nome: 'Filippo Inzaghi', pais: '🇮🇹', div: 'D', estilo: 'equilibrado', chute: true },
  // 🟤 VÁRZEA — OS PERSONAGENS (1 esquema)
  { nome: 'Lisca Doido', pais: '🇧🇷', div: 'V', estilo: 'ofensiva', chute: true },
  { nome: 'Joel Santana', pais: '🇧🇷', div: 'V', estilo: 'retranca', chute: true },
  { nome: 'Waldemar Lemos', pais: '🇧🇷', div: 'V', estilo: 'equilibrado', chute: true },
  { nome: 'Apolinho', pais: '🇧🇷', div: 'V', estilo: 'retranca', chute: true },
  { nome: 'Guto Ferreira', pais: '🇧🇷', div: 'V', estilo: 'equilibrado', chute: true },
  { nome: 'Celso Roth', pais: '🇧🇷', div: 'V', estilo: 'retranca' },
  { nome: 'Oswaldo de Oliveira', pais: '🇧🇷', div: 'V', estilo: 'ofensiva', chute: true },
  { nome: 'Geninho', pais: '🇧🇷', div: 'V', estilo: 'retranca', chute: true },
  { nome: 'Levir Culpi', pais: '🇧🇷', div: 'V', estilo: 'ofensiva', chute: true },
  { nome: 'Antônio Lopes', pais: '🇧🇷', div: 'V', estilo: 'retranca', chute: true },
  { nome: 'Nelsinho Baptista', pais: '🇧🇷', div: 'V', estilo: 'equilibrado', chute: true },
  { nome: 'Jair Ventura', pais: '🇧🇷', div: 'V', estilo: 'retranca' },
  { nome: 'Vadão', pais: '🇧🇷', div: 'V', estilo: 'equilibrado', chute: true },
  { nome: 'Givanildo Oliveira', pais: '🇧🇷', div: 'V', estilo: 'equilibrado', chute: true },
  { nome: 'PC Gusmão', pais: '🇧🇷', div: 'V', estilo: 'equilibrado', chute: true },
  { nome: 'Zé Ricardo', pais: '🇧🇷', div: 'V', estilo: 'posse', chute: true },
  { nome: 'Cristóvão Borges', pais: '🇧🇷', div: 'V', estilo: 'posse', chute: true },
  { nome: 'Romário', pais: '🇧🇷', div: 'V', estilo: 'ofensiva', chute: true },
  { nome: 'Vágner Mancini', pais: '🇧🇷', div: 'V', estilo: 'equilibrado', chute: true },
  { nome: 'René Simões', pais: '🇧🇷', div: 'V', estilo: 'equilibrado', chute: true },
]

// ─── 🎽 REPERTÓRIO REAL de cada técnico, mapeado nas NOSSAS 15 ───────────────
// Fonte: pesquisa do Diego (26/08). Formações da vida real que não existem no
// jogo foram mapeadas na equivalente mais próxima (4-4-1-1→4-4-2 · 3-2-4-1/
// 3-3-4/3-3-1-3→3-4-3 · 3-4-1-2→3-5-2 · 3-4-2-1→3-4-3 losango · 4-2-2-2→
// 4-4-2 losango · 4-1-3-2→4-3-1-2). A ordem importa: a categoria corta daqui
// (Série D usa as 2 primeiras). Quem não está aqui cai na coluna do estilo.
export const REPERTORIO: Record<string, string[]> = {
  'Lionel Scaloni': ['4-3-3', '4-4-2', '4-2-3-1', '5-3-2'],
  'Mauricio Pochettino': ['4-2-3-1', '4-3-3', '4-4-2', '3-4-3'],
  'Gian Piero Gasperini': ['3-5-2', '3-4-3 losango', '3-4-3'], // 3-4-1-2/3-4-2-1 da Atalanta mapeados
  'Rúben Amorim': ['3-4-3 losango', '3-4-3', '3-5-2'], // o 3-4-2-1 do Sporting/United mapeado
  'Roberto De Zerbi': ['4-2-3-1', '4-3-3', '3-4-3 losango'],
  'Alex Ferguson': ['4-4-2', '4-3-3', '4-2-3-1', '4-5-1'],
  'Pep Guardiola': ['4-3-3', '3-4-3', '4-1-4-1', '4-2-3-1'],
  'Carlo Ancelotti': ['4-4-2', '4-3-3', '4-4-2 losango', '4-2-3-1', '4-3-2-1'],
  'José Mourinho': ['4-2-3-1', '4-3-3', '4-4-2', '4-3-1-2', '5-3-2'],
  'Zinedine Zidane': ['4-3-3', '4-4-2', '4-3-1-2', '4-2-3-1'],
  'Arrigo Sacchi': ['4-4-2', '4-3-3', '4-3-2-1', '4-4-2 losango'],
  'Rinus Michels': ['4-3-3', '4-2-3-1', '4-4-2', '3-4-3', '4-3-2-1'],
  'Johan Cruyff': ['3-4-3', '4-3-3', '4-2-3-1', '4-4-2'],
  'Jupp Heynckes': ['4-2-3-1', '4-4-2', '4-3-3', '4-1-4-1'],
  'Luis de la Fuente': ['4-3-3', '4-2-3-1', '4-1-4-1', '4-4-2', '3-4-3'],
  'Luis Enrique': ['4-3-3', '4-2-3-1', '3-4-3', '4-4-2', '4-1-4-1'],
  'Marcello Lippi': ['4-4-2', '4-3-1-2', '4-2-3-1', '3-5-2'],
  'Vicente del Bosque': ['4-2-3-1', '4-3-3', '4-1-4-1', '4-4-2', '3-4-3'],
  'Telê Santana': ['4-2-4', '4-3-3', '4-2-3-1', '4-4-2', '4-3-1-2'],
  'Giovanni Trapattoni': ['5-3-2', '4-4-2', '4-3-1-2', '4-5-1'],
  'Fabio Capello': ['4-4-2', '4-2-3-1', '4-3-1-2', '4-5-1'],
  'Jürgen Klopp': ['4-3-3', '4-2-3-1', '4-4-2', '4-3-2-1', '3-4-3'],
  'Louis van Gaal': ['3-4-3', '4-3-3', '4-2-3-1', '3-5-2', '4-4-2'],
  'Arsène Wenger': ['4-2-3-1', '4-4-2', '4-3-3', '3-4-3'],
  'Diego Simeone': ['4-4-2', '5-3-2', '4-3-3', '4-2-3-1'],
  'Marcelo Gallardo': ['4-3-1-2', '4-2-3-1', '3-5-2'],
  'Antonio Conte': ['3-5-2', '3-4-3', '4-2-4'],
  'Roberto Mancini': ['4-3-3', '4-2-3-1', '4-4-2', '3-4-3'],
  'Rafael Benítez': ['4-2-3-1', '4-4-2', '4-3-2-1', '4-3-3'],
  'Frank Rijkaard': ['4-3-3', '4-2-3-1', '4-3-1-2', '3-4-3'],
  'Guus Hiddink': ['4-4-2', '4-3-3', '4-2-3-1', '3-4-3'],
  'Unai Emery': ['4-2-3-1', '4-4-2', '4-3-3'],
  'Massimiliano Allegri': ['4-3-3', '4-4-2', '3-5-2', '4-2-3-1'],
  'Thomas Tuchel': ['3-4-3', '4-2-3-1', '4-3-3', '3-5-2'],
  'Manuel Pellegrini': ['4-2-3-1', '4-3-3', '4-4-2', '4-1-4-1'],
  'Luiz Felipe Scolari': ['4-2-3-1', '4-4-2', '3-5-2', '4-3-3'],
  'Carlos Alberto Parreira': ['4-4-2', '4-2-3-1', '4-3-3', '3-5-2'],
  'Mario Zagallo': ['4-3-3', '4-2-4', '4-4-2', '4-3-1-2'],
  'Joachim Löw': ['4-2-3-1', '4-3-3', '4-1-4-1', '3-4-3'],
  'César Luis Menotti': ['4-3-3', '4-2-3-1', '4-3-1-2', '4-4-2'],
  'Carlos Bilardo': ['3-5-2', '4-4-2', '5-3-2'],
  'Didier Deschamps': ['4-2-3-1', '4-3-3', '4-4-2', '3-4-3'],
  'Luis Aragonés': ['4-4-2', '4-3-3', '4-2-3-1', '4-1-4-1'],
  'Hansi Flick': ['4-2-3-1', '4-3-3', '4-4-2 losango', '3-4-3'],
  'Carlos Bianchi': ['4-3-1-2', '4-4-2'],
  'Hernán Crespo': ['4-3-1-2', '3-5-2', '4-2-3-1'],
  'Jorge Jesus': ['4-4-2', '4-2-3-1', '3-4-3', '4-3-3'],
  'Abel Ferreira': ['3-4-3 losango', '4-2-3-1', '4-3-3', '3-5-2'],
  'Tite': ['4-1-4-1', '4-2-3-1', '4-3-3', '4-4-2'],
  'Muricy Ramalho': ['4-4-2', '3-5-2'],
  'Vanderlei Luxemburgo': ['4-4-2', '4-3-3'],
  'Marcelo Bielsa': ['4-1-4-1', '3-4-3', '4-2-3-1', '4-3-3'], // 4º esquema real (Newell's/Athletic) — agora é Série B, usa 4
  'Ramón Díaz': ['4-3-1-2'],
  'José Pékerman': ['4-2-3-1', '4-3-3'],
  'Fernando Santos': ['4-2-3-1', '4-3-3'],
  'Claudio Ranieri': ['4-4-2', '4-2-3-1'],
  'Luciano Spalletti': ['4-3-3', '4-2-3-1', '3-4-3 losango', '4-2-4'],
  'Maurizio Sarri': ['4-3-3', '4-3-1-2', '4-2-3-1', '4-4-2'],
  'Enzo Maresca': ['4-3-3', '4-2-3-1', '3-4-3'],
  'Xavi Hernández': ['4-3-3', '3-4-3', '4-2-3-1'],
  'Mikel Arteta': ['4-3-3', '4-2-3-1', '3-4-3'],
  'Xabi Alonso': ['3-4-3 losango', '3-4-3', '4-2-3-1'],
  'Rogério Ceni': ['4-2-3-1', '4-3-3', '3-5-2'],
  'Ronald Koeman': ['4-3-3'],
  'Gennaro Gattuso': ['4-3-3', '4-2-3-1'],
  'Andrea Pirlo': ['4-3-3', '3-5-2'],
  'Thierry Henry': ['4-3-3', '4-2-3-1'],
  'Patrick Vieira': ['4-3-3', '4-2-3-1'],
  'Fabio Cannavaro': ['4-3-3', '4-2-3-1', '3-5-2'],
  'Clarence Seedorf': ['4-3-3', '4-2-3-1'],
  'Diego Maradona': ['4-3-3', '4-4-2'],
  'Gary Neville': ['4-2-3-1'],
  'Martín Palermo': ['4-2-3-1'],
  'Dunga': ['4-2-3-1', '4-3-3'],
  'Fernando Diniz': ['4-2-3-1', '3-4-3'],
  'Mano Menezes': ['4-2-3-1', '4-4-2'],
  'Cuca': ['4-2-3-1', '4-3-3'],
  'Renato Gaúcho': ['4-2-3-1', '4-3-3'],
  'Dorival Júnior': ['4-2-3-1', '4-3-3'],
  'Paulo Autuori': ['4-4-2', '4-2-3-1'],
  'Erik ten Hag': ['4-3-3', '4-2-3-1'],
  'André Villas-Boas': ['4-3-3', '4-2-3-1'],
  'Filippo Inzaghi': ['3-5-2', '4-3-3'],
  'Lisca Doido': ['4-2-3-1'],
  'Joel Santana': ['4-4-2'],
  'Waldemar Lemos': ['4-4-2'],
  'Apolinho': ['4-4-2'],
  'Guto Ferreira': ['4-2-3-1'],
  'Celso Roth': ['4-4-2'],
  'Oswaldo de Oliveira': ['4-2-3-1'],
  'Geninho': ['4-4-2'],
  'Levir Culpi': ['4-2-3-1'],
  'Antônio Lopes': ['4-4-2'],
  'Nelsinho Baptista': ['4-4-2'],
  'Jair Ventura': ['4-2-3-1'],
  'Vadão': ['4-4-2'],
  'Givanildo Oliveira': ['4-4-2'],
  'PC Gusmão': ['4-4-2'],
  'Zé Ricardo': ['4-2-3-1'],
  'Cristóvão Borges': ['4-2-3-1'],
  'Romário': ['4-4-2'],
  'Vágner Mancini': ['4-4-2'],
  'René Simões': ['4-4-2'],
}
