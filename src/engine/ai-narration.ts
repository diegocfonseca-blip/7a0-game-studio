import { GoogleGenerativeAI } from '@google/generative-ai'
import type { MatchResult, GameState } from './game'
import type { MatchMoment } from './commentary'

export type AINarrationMoment = MatchMoment & { aiGenerated: true }

function getApiKey(): string | null {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY
  if (envKey && envKey.length > 10) return envKey
  return localStorage.getItem('gemini_api_key')
}

export function hasApiKey(): boolean {
  return !!getApiKey()
}

export function saveApiKey(key: string) {
  localStorage.setItem('gemini_api_key', key)
}

export function clearApiKey() {
  localStorage.removeItem('gemini_api_key')
}

const SYSTEM_PROMPT = `Você é o narrador oficial da Copa do Mundo — apaixonado, dramático, profundo conhecedor de futebol histórico.
Narre os momentos de uma partida em português brasileiro informal, com estilo de TV esportiva.

REGRAS OBRIGATÓRIAS:
- Mencione jogadores pelo nome, evoque seus estilos históricos reais (ex: Ronaldo o Fenômeno era imparável em velocidade; Zidane dominava o meio-campo com elegância)
- Use MAIÚSCULAS para gritos e momentos épicos
- Use pontuação dramática: "!!!", "??", reticências "..."
- Gere exatamente 7 a 9 momentos por partida
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

  return `COPA DO MUNDO — ${match.phase}

MEU TIME (Overall ${state.overall}):
${lineup}

ADVERSÁRIO: ${match.opponent} ${match.opponentYear} — Rating estimado ${matchOpponentRating}
RESULTADO FINAL: ${match.goalsFor} × ${match.goalsAgainst}${penInfo}

GOLS DO MEU TIME:
${myGoals}

GOLS SOFRIDOS:
${oppGoals}

Gere a narração como JSON array. Exemplo de formato:
[
  {"minute": 0, "type": "intro", "lines": ["Frase 1", "Frase 2"]},
  {"minute": 23, "type": "buildup", "lines": ["Frase"]},
  {"minute": 23, "type": "goal", "lines": ["GOOOOL!", "Frase"]},
  {"minute": 90, "type": "final", "lines": ["Frase 1", "Frase 2"]}
]

Tipos: "intro" | "buildup" | "goal" | "conceded" | "save" | "miss" | "danger" | "final"`
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
      const forUs = isGoal || (!isConceded && m.type !== 'intro' && m.type !== 'final')

      let playerName: string | undefined
      if (isGoal) {
        playerName = match.events.filter(e => e.type === 'goal')[goalIdx]?.playerName
        goalIdx++
      } else if (isConceded) {
        playerName = match.events.filter(e => e.type === 'conceded')[concededIdx]?.playerName
        concededIdx++
      }

      const momentType = m.type === 'intro' || m.type === 'final'
        ? 'buildup'
        : m.type as MatchMoment['type']

      return {
        minute: m.minute ?? 0,
        type: momentType,
        forUs: isGoal ? true : isConceded ? false : forUs,
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

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: SYSTEM_PROMPT,
  })

  try {
    let fullText = ''

    const result = await model.generateContentStream(buildPrompt(state, match, matchOpponentRating))

    for await (const chunk of result.stream) {
      fullText += chunk.text()
      onProgress?.(fullText)
    }

    const jsonMatch = fullText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return null

    const raw: RawMoment[] = JSON.parse(jsonMatch[0])
    return parseAIMoments(raw, match)
  } catch (err) {
    console.error('AI narration error:', err)
    return null
  }
}
