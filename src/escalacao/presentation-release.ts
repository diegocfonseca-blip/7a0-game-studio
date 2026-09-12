import { useOnlinePreview } from './online-preview'
import { CAREER_VISUAL_RELEASED, LEGEND_AVATARS_RELEASED, PENALTY_ART_RELEASED } from './career-feature-release'

// Separate from account/auth gates; never enable unfinished private features.
export function useCareerPresentation() {
  const preview = useOnlinePreview()
  return CAREER_VISUAL_RELEASED || preview
}
export function useLegendPresentation() {
  const preview = useOnlinePreview()
  return LEGEND_AVATARS_RELEASED || preview
}
export function usePenaltyPresentation() {
  const preview = useOnlinePreview()
  return PENALTY_ART_RELEASED || preview
}
