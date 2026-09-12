// Explicitly deferred by Diego. Separate from the two-account visual preview.
export const PRESIDENT_EDITOR_RELEASED: boolean = false
export const PRESIDENT_ROOM_RELEASED: boolean = false

// Liberação pública de apresentação aprovada pelo Diego. Não muda autorização.
export const CAREER_VISUAL_RELEASED: boolean = true
export const LEGEND_AVATARS_RELEASED: boolean = true
// ⚡ Pênalti ilustrado da carreira (estádio, goleiro, mira e barra de força).
// Estava pronto e travado nas duas contas de teste desde 10/09. Liberado geral
// em 12/09 por ordem do Diego ("sim pode fazer tudo isso"). Reverter = false.
export const PENALTY_ART_RELEASED: boolean = true
// 😓 CONDIÇÃO / GÁS do jogador (carreira solo com Agência; liga ao chegar na Série
// C, pra sempre — quem já está em C/B/A liga na próxima rodada). Aprovado pelo
// Diego em 12/09 (barrinha, −7/+15). Reverter =
// false: some da tela E da simulação (o gás não vive no save, é derivado).
export const CONDICAO_ON: boolean = true
export function publicCareerVisual(state: { careerOnline?: boolean; sport?: string }) {
  return CAREER_VISUAL_RELEASED && !!state.careerOnline && state.sport !== 'basquete'
}
