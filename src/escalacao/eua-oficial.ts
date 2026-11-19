// ─── 🏀🇺🇸 EUA OFICIAL: as 30 franquias da NBA, na conferência e na divisão REAIS (temporada 2025-26) ─────────────────────
// Fonte: NBA.com/standings (divisões) — a mesma divisão desde 2004-05. Plano completo: docs/carreira-eua-oficial-plano.md.
// Decisão do Diego (19/11, "Pode"): o usuário escolhe UMA franquia e fica nela — sem sobe e desce, como nos EUA.
// A chave (`chave`) é o nome do clube nas cartas e no ESCUDOS_NBA; `nome` é o nome completo (cidade + apelido).
export type ConfNBA = 'Leste' | 'Oeste'
export interface FranquiaNBA { chave: string; nome: string; conf: ConfNBA; div: string; divEn: string }

const D = (conf: ConfNBA, div: string, divEn: string, lista: [string, string][]): FranquiaNBA[] =>
  lista.map(([chave, nome]) => ({ chave, nome, conf, div, divEn }))

export const FRANQUIAS_NBA: FranquiaNBA[] = [
  ...D('Leste', 'Atlântico', 'Atlantic', [['Celtics', 'Boston Celtics'], ['Nets', 'Brooklyn Nets'], ['Knicks', 'New York Knicks'], ['Sixers', 'Philadelphia 76ers'], ['Raptors', 'Toronto Raptors']]),
  ...D('Leste', 'Central', 'Central', [['Bulls', 'Chicago Bulls'], ['Cavaliers', 'Cleveland Cavaliers'], ['Pistons', 'Detroit Pistons'], ['Pacers', 'Indiana Pacers'], ['Bucks', 'Milwaukee Bucks']]),
  ...D('Leste', 'Sudeste', 'Southeast', [['Hawks', 'Atlanta Hawks'], ['Hornets', 'Charlotte Hornets'], ['Heat', 'Miami Heat'], ['Magic', 'Orlando Magic'], ['Wizards', 'Washington Wizards']]),
  ...D('Oeste', 'Noroeste', 'Northwest', [['Nuggets', 'Denver Nuggets'], ['Timberwolves', 'Minnesota Timberwolves'], ['Thunder', 'Oklahoma City Thunder'], ['Trail Blazers', 'Portland Trail Blazers'], ['Jazz', 'Utah Jazz']]),
  ...D('Oeste', 'Pacífico', 'Pacific', [['Warriors', 'Golden State Warriors'], ['Clippers', 'LA Clippers'], ['Lakers', 'Los Angeles Lakers'], ['Suns', 'Phoenix Suns'], ['Kings', 'Sacramento Kings']]),
  ...D('Oeste', 'Sudoeste', 'Southwest', [['Mavericks', 'Dallas Mavericks'], ['Rockets', 'Houston Rockets'], ['Grizzlies', 'Memphis Grizzlies'], ['Pelicans', 'New Orleans Pelicans'], ['Spurs', 'San Antonio Spurs']]),
]
