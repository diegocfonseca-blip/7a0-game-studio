// Explicitly deferred by Diego. Separate from the two-account visual preview.
export const PRESIDENT_EDITOR_RELEASED: boolean = false
export const PRESIDENT_ROOM_RELEASED: boolean = false

// Liberação pública de apresentação aprovada pelo Diego. Não muda autorização.
export const CAREER_VISUAL_RELEASED: boolean = true
export const LEGEND_AVATARS_RELEASED: boolean = true
export function publicCareerVisual(state: { careerOnline?: boolean; sport?: string }) {
  return CAREER_VISUAL_RELEASED && !!state.careerOnline && state.sport !== 'basquete'
}
