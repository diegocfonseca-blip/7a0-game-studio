// ─── ❤️ TIME DE CORAÇÃO (Diego 16/08 — docs/plano-crescimento.md §2) ───
// A pessoa diz de qual time ela torce no cadastro. Só isso: é informação, não
// prêmio.
//
// 🚫 NÃO PINTA MANTO NENHUM. A primeira versão prometia que o manto do clube
// ganharia essas cores; o Diego cortou na hora (16/08): *"não quero que coloque
// cores de manto que isso é dos sócios apenas"*. **Cor de manto é regalia de
// SÓCIO** — dar de graça no cadastro apagaria o que o sócio paga pra ter. As
// cores ficam guardadas aqui pra um uso futuro que o Diego aprovar; hoje
// NINGUÉM as usa (o cadastro só grava o NOME em `time_coracao`).
//
// ⚠️ REGRA DA CASA, sem exceção: **nome de clube real NUNCA aparece dentro do
// jogo — só as CORES.** O nome vive aqui só pra pessoa se achar na hora de
// escolher; nas telas do jogo o que sai é a listra, nunca a marca.
// (Mesma regra que já vale no `manto.ts`: "Nome/escudo de clube REAL nunca
// aparece: só as CORES.")
//
// As cores são as DUAS principais do uniforme tradicional. Time de uma cor só
// (Flamengo tem duas, Palmeiras é verde e branco...) usa a cor + o branco/preto
// que ele veste junto — é o que faz a listra ficar reconhecível.
export interface ClubeCoracao { nome: string; c1: string; c2: string }

export const CORACAO_CLUBES: ClubeCoracao[] = [
  { nome: 'Flamengo', c1: '#C2001E', c2: '#0C0C0C' },
  { nome: 'Corinthians', c1: '#0C0C0C', c2: '#FFFFFF' },
  { nome: 'Palmeiras', c1: '#1B7A3D', c2: '#FFFFFF' },
  { nome: 'São Paulo', c1: '#C2001E', c2: '#FFFFFF' },
  { nome: 'Vasco', c1: '#0C0C0C', c2: '#FFFFFF' },
  { nome: 'Fluminense', c1: '#8B1A3A', c2: '#1B7A3D' },
  { nome: 'Botafogo', c1: '#0C0C0C', c2: '#FFFFFF' },
  { nome: 'Grêmio', c1: '#0E3E86', c2: '#0C0C0C' },
  { nome: 'Internacional', c1: '#C2001E', c2: '#FFFFFF' },
  { nome: 'Cruzeiro', c1: '#0E3E86', c2: '#FFFFFF' },
  { nome: 'Atlético-MG', c1: '#0C0C0C', c2: '#FFFFFF' },
  { nome: 'Santos', c1: '#FFFFFF', c2: '#0C0C0C' },
  { nome: 'Bahia', c1: '#0E3E86', c2: '#C2001E' },
  { nome: 'Vitória', c1: '#C2001E', c2: '#0C0C0C' },
  { nome: 'Sport', c1: '#C2001E', c2: '#0C0C0C' },
  { nome: 'Náutico', c1: '#C2001E', c2: '#FFFFFF' },
  { nome: 'Santa Cruz', c1: '#0C0C0C', c2: '#C2001E' },
  { nome: 'Fortaleza', c1: '#0E3E86', c2: '#C2001E' },
  { nome: 'Ceará', c1: '#0C0C0C', c2: '#FFFFFF' },
  { nome: 'Athletico-PR', c1: '#C2001E', c2: '#0C0C0C' },
  { nome: 'Coritiba', c1: '#1B7A3D', c2: '#FFFFFF' },
  { nome: 'Goiás', c1: '#1B7A3D', c2: '#FFFFFF' },
  { nome: 'Atlético-GO', c1: '#C2001E', c2: '#0C0C0C' },
  { nome: 'Cuiabá', c1: '#1B7A3D', c2: '#FFC400' },
  { nome: 'Chapecoense', c1: '#1B7A3D', c2: '#FFFFFF' },
  { nome: 'Juventude', c1: '#1B7A3D', c2: '#FFFFFF' },
  { nome: 'Paraná', c1: '#0E3E86', c2: '#C2001E' },
  { nome: 'Ponte Preta', c1: '#0C0C0C', c2: '#FFFFFF' },
  { nome: 'Guarani', c1: '#1B7A3D', c2: '#FFFFFF' },
  { nome: 'Portuguesa', c1: '#C2001E', c2: '#1B7A3D' },
  { nome: 'América-MG', c1: '#1B7A3D', c2: '#FFFFFF' },
  { nome: 'Remo', c1: '#0E3E86', c2: '#FFFFFF' },
  { nome: 'Paysandu', c1: '#0E3E86', c2: '#FFFFFF' },
  { nome: 'ABC', c1: '#0C0C0C', c2: '#FFFFFF' },
  { nome: 'CRB', c1: '#C2001E', c2: '#FFFFFF' },
  { nome: 'CSA', c1: '#0E3E86', c2: '#FFFFFF' },
  { nome: 'Criciúma', c1: '#FFC400', c2: '#0C0C0C' },
  { nome: 'Avaí', c1: '#0E3E86', c2: '#FFFFFF' },
  { nome: 'Figueirense', c1: '#0C0C0C', c2: '#FFFFFF' },
  { nome: 'Vila Nova', c1: '#C2001E', c2: '#1B7A3D' },
]

/** as duas cores do time do coração (ou null se a pessoa não escolheu / nome desconhecido) */
export function coresDoCoracao(nome?: string | null): [string, string] | null {
  if (!nome) return null
  const c = CORACAO_CLUBES.find(x => x.nome === nome)
  return c ? [c.c1, c.c2] : null
}
