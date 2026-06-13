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

const SYSTEM_PROMPT = `Você é o narrador oficial da Copa do Mundo — apaixonado, dramático, profundo conhecedor de futebol histórico.
Narre os momentos de uma partida em português brasileiro informal, com estilo de TV esportiva.

REGRAS OBRIGATÓRIAS:
- Mencione jogadores pelo nome, evoque seus estilos históricos reais (ex: Ronaldo o Fenômeno era imparável em velocidade; Zidane dominava o meio-campo com elegância)
- Use MAIÚSCULAS para gritos e momentos épicos
- Use pontuação dramática: "!!!", "??", reticências "..."
- Gere exatamente 8 a 10 momentos por partida
- Primeiro: tipo "intro" (chegada ao estádio, clima, tensão pré-jogo)
- Para cada gol do meu time: 1 "buildup" narrativo + 1 "goal" com grito
- Para gol sofrido: 1 "conceded" dramático
- Ocasionalmente: "miss" ou "save" para criar tensão
- Último: tipo "final" (apito final, drama ou celebração)
- Cada momento: array "lines" com 2 a 3 strings (frases curtas e impactantes)
- Responda SOMENTE com JSON array válido. Zero texto antes ou depois do JSON.`

function buildPrompt(state: GameState, match: MatchResult, matchOpponentRating: number): string {
  const lineup = state.picks.map(p =>
    `  ${p.slot.position}: ${p.player.name}${p.player.isLegend ? ' ⭐LENDA' : ''} (${p.player.rating})`
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

  return `${SYSTEM_PROMPT}

COPA DO MUNDO — ${match.phase}

MEU TIME (Overall ${state.overall}):
${lineup}

ADVERSÁRIO: ${match.opponent} ${match.opponentYear} — Rating estimado ${matchOpponentRating}
RESULTADO FINAL: ${match.goalsFor} × ${match.goalsAgainst}${penInfo}

GOLS DO MEU TIME:
${myGoals}

GOLS SOFRIDOS:
${oppGoals}

Responda SOMENTE com o JSON array. Exemplo:
[
  {"minute": 0, "type": "intro", "lines": ["Frase 1", "Frase 2"]},
  {"minute": 23, "type": "buildup", "lines": ["Frase"]},
  {"minute": 23, "type": "goal", "lines": ["GOOOOL!", "Frase"]},
  {"minute": 90, "type": "final", "lines": ["Frase 1", "Frase 2"]}
]

Tipos válidos: "intro" | "buildup" | "goal" | "conceded" | "save" | "miss" | "danger" | "final"`
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
