// 🏟️ ESTÁDIOS DOS CLUBES DO BRASIL OFICIAL (18/11, Diego: *"todos os times do jogo deveriam ter nome do estádio… igual Flamengo,
// Maracanã… São Paulo, MorumBIS… se não tiver, você pode inventar um nome de um estádio com base no nome do time… o ideal é que
// sejam os nomes reais"*). Nome POPULAR (o que o torcedor fala), com fonte aberta em docs/brasil-oficial/estadios.md.
// Clube sem estádio achado com fonte cai no nome montado pelo nome do clube (`inventado: true`) — e a tela não finge que é real.
export const ESTADIOS_OFICIAL: Record<string, string> = {
}
export function estadioDoClube(nome: string): { nome: string; inventado: boolean } {
  const real = ESTADIOS_OFICIAL[nome]
  if (real) return { nome: real, inventado: false }
  const base = nome.replace(/-[A-Z]{2}$/, '')
  return { nome: `Estádio do ${base}`, inventado: true }
}
