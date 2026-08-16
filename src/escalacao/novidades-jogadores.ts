// ⚠️ ARQUIVO GERADO — não edite na mão.
// Sai do `npm run novidades`, que compara o baralho de hoje com a foto em
// `scripts/catalogo-snapshot.json`. Mexeu em jogador (entrou, saiu, mudou de
// nível ou de categoria)? Rode o comando e a home conta sozinha.
export interface MudancaJogador { data: string; tipo: 'entrou' | 'saiu' | 'nivel' | 'virou-folk' | 'saiu-folk'; nome: string; baralho: 'BR' | 'EU'; nivel?: string; de?: string; para?: string }
export const MUDANCAS_JOGADORES: MudancaJogador[] = []
