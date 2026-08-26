// ─── 🎽 AS 15 FORMAÇÕES — catálogo (26/08, martelo batido pelo Diego) ────────
//
// O jogador vê 15 formações em 3 estilos. Por dentro, cada uma roda numa das
// 7 contas REAIS do motor (`FormationKey` em types.ts). A régua da honestidade,
// criada pela bronca do Diego ("424 não pode ser 433, são realmente 4
// atacantes"): a quantidade de ZAGUEIRO e de ATACANTE é SEMPRE a de verdade —
// o que o desenho pode redistribuir é só o MIOLO (as linhas de meia).
//
// 🤫 O mapa rótulo→conta é SEGREDO DE PRODUÇÃO: nunca vai em texto de UI,
// novidade ou post. Pro jogador são 15 formações, ponto.
//
// 📐 Desenho do campinho (decisões do Diego 26/08, mockup campinhos-v5):
// altura ÚNICA pra todas as formações (a do desenho mais alto) com FAIXAS
// FIXAS — goleiro, zaga e ataque sempre na mesma posição; só o miolo se
// distribui na faixa do meio. Recuo sutil SÓ nos alas do 3-5-2 ("era só no
// 352, os outros deixava igual") e no líbero do 5-3-2 líbero.
import type { FormationKey, Manager } from './types'

export type EstiloFormacao = 'ofensiva' | 'posse' | 'retranca'

export interface Formacao15 {
  rotulo: string        // o que o jogador vê no botão e no campinho
  motor: FormationKey   // a conta real que roda por dentro
  estilo: EstiloFormacao
  // é a "cara padrão" da conta do motor: save antigo (sem formationView) com
  // essa formação desenha e marca ESTE rótulo como o atual.
  padrao?: boolean
  // desenho do MIOLO: quantas cartas de MEI em cada linha, de cima (perto do
  // ataque) pra baixo (perto da zaga). Ausente = linha única com todos.
  meio?: number[]
  // 3-5-2: os LATERAIS sobem pro miolo como alas (recuados em relação aos
  // meias) e a linha da zaga fica só com os zagueiros de verdade.
  alas?: boolean
  // 5-3-2 líbero: o zagueiro do meio desenha recuado (atrás da linha).
  libero?: boolean
}

export const FORMACOES15: Formacao15[] = [
  // ⚽ OFENSIVAS
  { rotulo: '4-3-3', motor: '4-3-3', estilo: 'ofensiva', padrao: true },
  { rotulo: '3-4-3', motor: '3-4-3', estilo: 'ofensiva', padrao: true },
  { rotulo: '4-2-4', motor: '4-2-4', estilo: 'ofensiva', padrao: true },
  { rotulo: '4-3-1-2', motor: '4-4-2', estilo: 'ofensiva', meio: [1, 3] },        // o "1" é a camisa 10 grudada nos atacantes
  { rotulo: '3-4-3 losango', motor: '3-4-3', estilo: 'ofensiva', meio: [1, 2, 1] },
  // 🎩 POSSE
  { rotulo: '4-5-1', motor: '4-5-1', estilo: 'posse', padrao: true },
  { rotulo: '4-2-3-1', motor: '4-5-1', estilo: 'posse', meio: [3, 2] },           // 3 meias na frente, 2 volantes atrás
  { rotulo: '4-3-2-1', motor: '4-5-1', estilo: 'posse', meio: [2, 3] },           // árvore de Natal
  { rotulo: '4-4-2 losango', motor: '4-4-2', estilo: 'posse', meio: [1, 2, 1] },
  { rotulo: '3-5-2', motor: '5-3-2', estilo: 'posse', alas: true },               // os alas são os LATERAIS de verdade
  // 🛡️ RETRANCA
  { rotulo: '5-3-2', motor: '5-3-2', estilo: 'retranca', padrao: true },
  { rotulo: '4-4-2', motor: '4-4-2', estilo: 'retranca', padrao: true },          // duas linhas de quatro (o 4-4-2 de sempre)
  { rotulo: '4-1-4-1', motor: '4-5-1', estilo: 'retranca', meio: [4, 1] },        // volante sozinho na frente da zaga
  { rotulo: '5-4-1', motor: '5-4-1', estilo: 'retranca', padrao: true },
  { rotulo: '5-3-2 líbero', motor: '5-3-2', estilo: 'retranca', libero: true },
]

export const ESTILO_ROTULO: Record<EstiloFormacao, string> = {
  ofensiva: '⚽ Ofensivas',
  posse: '🎩 Posse de bola',
  retranca: '🛡️ Retranca',
}

export function formacaoPorRotulo(rotulo: string): Formacao15 | undefined {
  return FORMACOES15.find(f => f.rotulo === rotulo)
}

// a formação ATUAL do técnico, como entrada do catálogo: usa o rótulo guardado
// (formationView) e, sem ele — todo save antigo —, a cara padrão da conta do
// motor. Nunca devolve undefined pra formação válida do jogo.
export function formacaoAtual(m: Pick<Manager, 'formation' | 'formationView'>): Formacao15 {
  const porView = m.formationView ? formacaoPorRotulo(m.formationView) : undefined
  // trava de segurança: view guardada tem que bater com a conta do motor (save
  // mexido/antigo com par inconsistente cai na cara padrão, nunca desenha errado)
  if (porView && porView.motor === m.formation) return porView
  return FORMACOES15.find(f => f.padrao && f.motor === m.formation) ?? FORMACOES15[0]
}

// ── pros TÉCNICOS: coluna de cada estilo, na ordem em que a categoria libera ──
// (categoria corta a quantidade: A 5 · B 4 · C 3 · D 2 · Várzea 1; a ordem de
// entrada é esta, da formação mais característica do estilo pra menos)
export const COLUNA_ESTILO: Record<EstiloFormacao, string[]> = {
  ofensiva: ['4-3-3', '3-4-3', '4-2-4', '4-3-1-2', '3-4-3 losango'],
  posse: ['4-5-1', '4-2-3-1', '4-3-2-1', '4-4-2 losango', '3-5-2'],
  retranca: ['5-3-2', '4-4-2', '4-1-4-1', '5-4-1', '5-3-2 líbero'],
}
// técnico EQUILIBRADO não tem coluna própria: mistura o básico dos três
// estilos, do mais comum pro mais ousado.
export const ORDEM_EQUILIBRADO: string[] = ['4-4-2', '4-3-3', '4-5-1', '5-3-2', '3-4-3']
