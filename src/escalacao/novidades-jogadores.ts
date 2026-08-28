// ⚠️ ARQUIVO GERADO — não edite na mão.
// Sai do `npm run novidades`, que compara o baralho de hoje com a foto em
// `scripts/catalogo-snapshot.json`. Mexeu em jogador (entrou, saiu, mudou de
// nível ou de categoria)? Rode o comando e a home conta sozinha.
export interface MudancaJogador { data: string; tipo: 'entrou' | 'saiu' | 'nivel' | 'virou-folk' | 'saiu-folk'; nome: string; baralho: 'BR' | 'EU'; nivel?: string; de?: string; para?: string }
export const MUDANCAS_JOGADORES: MudancaJogador[] = [
  {
    "tipo": "entrou",
    "nome": "Valdo",
    "baralho": "BR",
    "nivel": "bom jogador",
    "data": "2026-08-28"
  },
  {
    "tipo": "entrou",
    "nome": "Rodrigo Fabri",
    "baralho": "BR",
    "nivel": "bom jogador",
    "data": "2026-08-28"
  },
  {
    "tipo": "entrou",
    "nome": "Rodrigo Mendes",
    "baralho": "BR",
    "nivel": "bom jogador",
    "data": "2026-08-28"
  },
  {
    "tipo": "entrou",
    "nome": "Villasanti",
    "baralho": "BR",
    "nivel": "bom jogador",
    "data": "2026-08-28"
  },
  {
    "tipo": "entrou",
    "nome": "Jean Lucas",
    "baralho": "BR",
    "nivel": "bom jogador",
    "data": "2026-08-28"
  },
  {
    "tipo": "entrou",
    "nome": "Yan Couto",
    "baralho": "EU",
    "nivel": "bom jogador",
    "data": "2026-08-28"
  },
  {
    "tipo": "entrou",
    "nome": "Alex",
    "baralho": "EU",
    "nivel": "bom jogador",
    "data": "2026-08-28"
  },
  {
    "tipo": "entrou",
    "nome": "Cris",
    "baralho": "EU",
    "nivel": "bom jogador",
    "data": "2026-08-28"
  },
  {
    "tipo": "entrou",
    "nome": "Felipe Anderson",
    "baralho": "EU",
    "nivel": "craque",
    "data": "2026-08-28"
  },
  {
    "tipo": "entrou",
    "nome": "Anderson Talisca",
    "baralho": "EU",
    "nivel": "bom jogador",
    "data": "2026-08-28"
  },
  {
    "tipo": "entrou",
    "nome": "Roger Guerreiro",
    "baralho": "EU",
    "nivel": "bom jogador",
    "data": "2026-08-28"
  },
  {
    "tipo": "nivel",
    "nome": "Alex",
    "baralho": "BR",
    "de": "craque",
    "para": "lenda",
    "data": "2026-08-25"
  },
  {
    "tipo": "entrou",
    "nome": "Alan Ruschel",
    "baralho": "BR",
    "nivel": "foi profissional",
    "data": "2026-08-21"
  },
  {
    "tipo": "entrou",
    "nome": "Kempes (Chape)",
    "baralho": "BR",
    "nivel": "bom jogador",
    "data": "2026-08-21"
  },
  {
    "tipo": "entrou",
    "nome": "Cléber Santana",
    "baralho": "BR",
    "nivel": "bom jogador",
    "data": "2026-08-21"
  },
  {
    "tipo": "entrou",
    "nome": "Bruno Rangel",
    "baralho": "BR",
    "nivel": "bom jogador",
    "data": "2026-08-21"
  },
  {
    "tipo": "entrou",
    "nome": "Follmann",
    "baralho": "BR",
    "nivel": "foi profissional",
    "data": "2026-08-21"
  },
  {
    "tipo": "saiu",
    "nome": "Everaldo",
    "baralho": "BR",
    "data": "2026-08-21"
  },
  {
    "tipo": "nivel",
    "nome": "Arce",
    "baralho": "BR",
    "de": "craque",
    "para": "lenda",
    "data": "2026-08-21"
  },
  {
    "tipo": "nivel",
    "nome": "Gamarra",
    "baralho": "BR",
    "de": "craque",
    "para": "lenda",
    "data": "2026-08-21"
  },
  {
    "tipo": "nivel",
    "nome": "Virgil van Dijk",
    "baralho": "EU",
    "de": "lenda",
    "para": "craque",
    "data": "2026-08-21"
  },
  {
    "tipo": "nivel",
    "nome": "Nelinho",
    "baralho": "BR",
    "de": "craque",
    "para": "lenda",
    "data": "2026-08-19"
  },
  {
    "tipo": "nivel",
    "nome": "Ashley Cole",
    "baralho": "EU",
    "de": "craque",
    "para": "lenda",
    "data": "2026-08-19"
  },
  {
    "tipo": "nivel",
    "nome": "Daniel Passarella",
    "baralho": "EU",
    "de": "craque",
    "para": "lenda",
    "data": "2026-08-19"
  },
  {
    "tipo": "nivel",
    "nome": "Emerson Leão",
    "baralho": "BR",
    "de": "craque",
    "para": "lenda",
    "data": "2026-08-19"
  },
  {
    "tipo": "nivel",
    "nome": "Peter Schmeichel",
    "baralho": "EU",
    "de": "craque",
    "para": "lenda",
    "data": "2026-08-19"
  },
  {
    "tipo": "nivel",
    "nome": "Dida",
    "baralho": "EU",
    "de": "bom jogador",
    "para": "lenda",
    "data": "2026-08-19"
  },
  {
    "tipo": "nivel",
    "nome": "Alessandro Nesta",
    "baralho": "EU",
    "de": "craque",
    "para": "lenda",
    "data": "2026-08-19"
  },
  {
    "tipo": "nivel",
    "nome": "Thiago Silva",
    "baralho": "EU",
    "de": "craque",
    "para": "lenda",
    "data": "2026-08-19"
  },
  {
    "tipo": "nivel",
    "nome": "Virgil van Dijk",
    "baralho": "EU",
    "de": "craque",
    "para": "lenda",
    "data": "2026-08-19"
  },
  {
    "tipo": "nivel",
    "nome": "Dani Alves",
    "baralho": "EU",
    "de": "craque",
    "para": "lenda",
    "data": "2026-08-19"
  },
  {
    "tipo": "nivel",
    "nome": "Javier Zanetti",
    "baralho": "EU",
    "de": "craque",
    "para": "lenda",
    "data": "2026-08-19"
  },
  {
    "tipo": "nivel",
    "nome": "Marcelo Vieira",
    "baralho": "EU",
    "de": "craque",
    "para": "lenda",
    "data": "2026-08-19"
  },
  {
    "tipo": "nivel",
    "nome": "Lilian Thuram",
    "baralho": "EU",
    "de": "craque",
    "para": "lenda",
    "data": "2026-08-19"
  }
]
