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
import { COLUNA_ESTILO, ORDEM_EQUILIBRADO } from './formacoes'
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
// A categoria da carta segue a divisão de origem (A = Lenda 👑 … Várzea = base
// bege), e a faixa lo–hi é a faixa TÍPICA dos jogadores daquela categoria no
// baralho real (medida em data.ts: lenda ~88/95 · craque ~84/92 · 76/86 ·
// 68/80 · várzea 55/70). Em cada partida o overall do técnico é SORTEADO dentro
// da faixa, igual jogador — dia inspirado, dia apagado.
// Todos os técnicos da MESMA categoria começam com a MESMA faixa (não inventei
// ranking entre gente de verdade); quando o Diego quiser destacar um nome
// ("Ferguson mais forte"), é preencher lo/hi na linha dele que a faixa
// individual passa por cima.
export const FAME_POR_DIV: Record<DivTecnico, number> = { A: 5, B: 4, C: 3, D: 2, V: 1 }
export const FAIXA_POR_DIV: Record<DivTecnico, { lo: number; hi: number }> = {
  A: { lo: 89, hi: 95 },
  B: { lo: 83, hi: 91 },
  C: { lo: 76, hi: 86 },
  D: { lo: 68, hi: 80 },
  V: { lo: 55, hi: 70 },
}
// a ficha completa pra montar a CARTA do técnico (formato de carta de jogador)
export function fichaDoTecnico(t: Tecnico): { fame: number; lo: number; hi: number; formacoes: string[] } {
  const faixa = FAIXA_POR_DIV[t.div]
  return { fame: FAME_POR_DIV[t.div], lo: t.lo ?? faixa.lo, hi: t.hi ?? faixa.hi, formacoes: formacoesDoTecnico(t) }
}

// as formações (rótulos visíveis de formacoes.ts) que o técnico domina.
export function formacoesDoTecnico(t: Pick<Tecnico, 'div' | 'estilo'>): string[] {
  const ordem = t.estilo === 'equilibrado' ? ORDEM_EQUILIBRADO : COLUNA_ESTILO[t.estilo]
  return ordem.slice(0, ESQUEMAS_POR_DIV[t.div])
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
  { nome: 'Ottmar Hitzfeld', pais: '🇩🇪', div: 'A', estilo: 'equilibrado', chute: true },
  { nome: 'Giovanni Trapattoni', pais: '🇮🇹', div: 'A', estilo: 'retranca' },
  { nome: 'Fabio Capello', pais: '🇮🇹', div: 'A', estilo: 'retranca' },
  { nome: 'Jürgen Klopp', pais: '🇩🇪', div: 'A', estilo: 'ofensiva' },
  { nome: 'Louis van Gaal', pais: '🇳🇱', div: 'A', estilo: 'posse' },
  { nome: 'Arsène Wenger', pais: '🇫🇷', div: 'A', estilo: 'ofensiva' },
  { nome: 'Luis Enrique', pais: '🇪🇸', div: 'A', estilo: 'posse' },
  { nome: 'Diego Simeone', pais: '🇦🇷', div: 'A', estilo: 'retranca' },
  { nome: 'Brian Clough', pais: '🏴', div: 'A', estilo: 'equilibrado', chute: true },
  // 🅱️ SÉRIE B — GIGANTES (4 esquemas)
  { nome: 'Marcelo Gallardo', pais: '🇦🇷', div: 'B', estilo: 'ofensiva' },
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
  { nome: 'Telê Santana', pais: '🇧🇷', div: 'B', estilo: 'ofensiva' },
  { nome: 'César Luis Menotti', pais: '🇦🇷', div: 'B', estilo: 'ofensiva' },
  { nome: 'Carlos Bilardo', pais: '🇦🇷', div: 'B', estilo: 'retranca' },
  { nome: 'Didier Deschamps', pais: '🇫🇷', div: 'B', estilo: 'retranca' },
  { nome: 'Luis Aragonés', pais: '🇪🇸', div: 'B', estilo: 'posse' },
  { nome: 'Sven-Göran Eriksson', pais: '🇸🇪', div: 'B', estilo: 'equilibrado' },
  { nome: 'Jürgen Klinsmann', pais: '🇩🇪', div: 'B', estilo: 'ofensiva' },
  // 🅲 SÉRIE C — GRANDES / CAMPEÕES / ASCENSÃO (3 esquemas)
  { nome: 'Hernán Crespo', pais: '🇦🇷', div: 'C', estilo: 'ofensiva', chute: true },
  { nome: 'Carlos Bianchi', pais: '🇦🇷', div: 'C', estilo: 'retranca' },
  { nome: 'Jorge Jesus', pais: '🇵🇹', div: 'C', estilo: 'ofensiva' },
  { nome: 'Abel Ferreira', pais: '🇵🇹', div: 'C', estilo: 'retranca' },
  { nome: 'Tite', pais: '🇧🇷', div: 'C', estilo: 'equilibrado' },
  { nome: 'Muricy Ramalho', pais: '🇧🇷', div: 'C', estilo: 'retranca', chute: true },
  { nome: 'Vanderlei Luxemburgo', pais: '🇧🇷', div: 'C', estilo: 'equilibrado', chute: true },
  { nome: 'Marcelo Bielsa', pais: '🇦🇷', div: 'C', estilo: 'ofensiva' },
  { nome: 'Jorge Sampaoli', pais: '🇦🇷', div: 'C', estilo: 'ofensiva' },
  { nome: 'Ramón Díaz', pais: '🇦🇷', div: 'C', estilo: 'equilibrado', chute: true },
  { nome: 'José Pékerman', pais: '🇦🇷', div: 'C', estilo: 'posse', chute: true },
  { nome: 'Fernando Santos', pais: '🇵🇹', div: 'C', estilo: 'retranca' },
  { nome: 'Claudio Ranieri', pais: '🇮🇹', div: 'C', estilo: 'retranca' },
  { nome: 'Luciano Spalletti', pais: '🇮🇹', div: 'C', estilo: 'posse' },
  { nome: 'Maurizio Sarri', pais: '🇮🇹', div: 'C', estilo: 'posse' },
  { nome: 'Laurent Blanc', pais: '🇫🇷', div: 'C', estilo: 'posse', chute: true },
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
