import type { MatchResult, GameState } from './game'
import type { MatchMoment } from './commentary'

function getApiKey(): string | null {
  const localKey = localStorage.getItem('gemini_api_key')
  if (localKey && localKey.length > 10) return localKey
  const envKey = import.meta.env.VITE_GEMINI_API_KEY
  if (envKey && envKey.length > 10) return envKey
  return null
}

export function hasApiKey(): boolean {
  return !!getApiKey()
}

function buildPrompt(state: GameState, match: MatchResult, matchOpponentRating: number): string {
  const lineup = state.picks.map(p =>
    `  ${p.slot.position}: ${p.player.name}${p.player.isLegend ? ' ⭐LENDA' : ''} (nota ${p.player.rating})`
  ).join('\n')

  const myGoals = match.events.filter(e => e.type === 'goal')
    .map(e => `  ${e.minute}' — ${e.playerName}${e.assistName ? ` (assist: ${e.assistName})` : ''}`)
    .join('\n') || '  (Nenhum)'

  const oppGoals = match.events.filter(e => e.type === 'conceded')
    .map(e => `  ${e.minute}' — ${e.playerName ?? 'Jogador adversário'}`)
    .join('\n') || '  (Nenhum)'

  const penInfo = match.penalties
    ? ` (após pênaltis ${match.penalties.goalsFor}–${match.penalties.goalsAgainst})`
    : ''

  const ratingDiff = state.overall - matchOpponentRating
  const matchContext = ratingDiff >= 8
    ? 'TIME MUITO SUPERIOR ao adversário — deve dominar'
    : ratingDiff >= 3
    ? 'Time levemente favorito'
    : ratingDiff <= -8
    ? 'GRANDE ZEBRA possível — adversário bem mais forte'
    : ratingDiff <= -3
    ? 'Time underdog, adversário favorito'
    : 'Equilíbrio total — qualquer resultado é possível'

  const styleDesc = state.style === 'offensive'
    ? 'Estilo OFENSIVO — pressão alta, muitos ataques, vulnerável atrás'
    : state.style === 'defensive'
    ? 'Estilo DEFENSIVO — compacto, jogo no contra-ataque, difícil de furar'
    : 'Estilo EQUILIBRADO — transições rápidas, jogo inteligente'

  const legends = state.picks.filter(p => p.player.isLegend)
  const legendNote = legends.length > 0
    ? `LENDAS em campo: ${legends.map(p => p.player.name).join(', ')} — narre seus momentos com grandiosidade histórica`
    : ''

  return `Você é o narrador oficial da Copa do Mundo — apaixonado, dramático, profundo conhecedor de futebol histórico.
Narre os momentos desta partida em português brasileiro informal, estilo TV esportiva de alta emoção.

CONTEXTO DA PARTIDA:
- ${matchContext}
- ${styleDesc}
- Formação: ${state.formation.name}
${legendNote ? `- ${legendNote}` : ''}

REGRAS DE NARRAÇÃO:
- Mencione jogadores pelo nome com seus estilos reais históricos (Ronaldo Fenômeno: velocidade devastadora e gols impossíveis; Zidane: elegância e visão única; Messi: regate e drible; Pelé: improviso genial; etc.)
- Varie o ritmo: momentos de tensão, alívio, explosão de alegria, desespero
- Reflita o contexto: time superior domina diferente de um underdog que sofre; estilo ofensivo tem mais chances mas toma gol; defensivo sofre menos mas precisa de contra-ataque
- Use MAIÚSCULAS para gols e momentos épicos
- Use pontuação dramática: "!!!", "...", "???"
- Gere exatamente 8 a 10 momentos
- Primeiro: "intro" (clima, expectativa, contexto do confronto)
- Por gol marcado: 1 "buildup" (como a jogada foi construída) + 1 "goal" (explosão)
- Por gol sofrido: 1 "conceded" (choque e reação)
- Inclua 1 ou 2 momentos de tensão: "miss", "save" ou "danger"
- Último: "final" (apito, emoção do resultado)
- Cada momento: array "lines" com 2-3 frases curtas e impactantes
- Responda SOMENTE com JSON array válido, zero texto fora do JSON

COPA DO MUNDO — ${match.phase}

MEU TIME (Overall ${state.overall}) — ${state.formation.name}:
${lineup}

ADVERSÁRIO: ${match.opponent} ${match.opponentYear} (Rating ${matchOpponentRating})
RESULTADO: ${match.goalsFor} × ${match.goalsAgainst}${penInfo} ${match.won ? '✓ VITÓRIA' : match.goalsFor === match.goalsAgainst && !match.penalties ? '— EMPATE' : '✗ DERROTA'}

GOLS MARCADOS:
${myGoals}

GOLS SOFRIDOS:
${oppGoals}

JSON array (tipos: "intro"|"buildup"|"goal"|"conceded"|"save"|"miss"|"danger"|"final"):`
}

interface RawMoment {
  minute: number
  type: string
  lines: string[]
}

function parseAIMoments(raw: RawMoment[], match: MatchResult): MatchMoment[] {
  const validTypes = ['intro', 'buildup', 'goal', 'conceded', 'save', 'miss', 'danger', 'final', 'tactical']
  let goalIdx = 0
  let concededIdx = 0

  return raw
    .filter(m => validTypes.includes(m.type) && Array.isArray(m.lines) && m.lines.length > 0)
    .map(m => {
      const isGoal = m.type === 'goal'
      const isConceded = m.type === 'conceded'

      let playerName: string | undefined
      if (isGoal) {
        playerName = match.events.filter(e => e.type === 'goal')[goalIdx]?.playerName
        goalIdx++
      } else if (isConceded) {
        playerName = match.events.filter(e => e.type === 'conceded')[concededIdx]?.playerName
        concededIdx++
      }

      const momentType = (m.type === 'intro' || m.type === 'final')
        ? 'buildup'
        : m.type as MatchMoment['type']

      return {
        minute: m.minute ?? 0,
        type: momentType,
        forUs: isGoal ? true : isConceded ? false : true,
        isGoal,
        playerName,
        lines: m.lines.map(String).filter(Boolean),
      } satisfies MatchMoment
    })
}

export async function generateAINarration(
  state: GameState,
  match: MatchResult,
  matchOpponentRating: number,
  onProgress?: (text: string) => void
): Promise<MatchMoment[] | null> {
  const apiKey = getApiKey()
  if (!apiKey) return null

  const prompt = buildPrompt(state, match, matchOpponentRating)
  onProgress?.('Gerando narração...')

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const res = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 1.0,
          max_tokens: 1500,
        }),
      }
    )
    clearTimeout(timeoutId)

    if (!res.ok) {
      const err = await res.text()
      console.error('Groq API error:', res.status, err)
      return null
    }

    const data = await res.json()
    const text: string = data?.choices?.[0]?.message?.content ?? ''
    onProgress?.(text)

    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return null

    const raw: RawMoment[] = JSON.parse(jsonMatch[0])
    return parseAIMoments(raw, match)
  } catch (err) {
    clearTimeout(timeoutId)
    console.error('AI narration fetch error:', err)
    return null
  }
}
