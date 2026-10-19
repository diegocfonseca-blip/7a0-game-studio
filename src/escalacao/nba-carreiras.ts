// 🏀 MINHAS CARREIRAS DO BASQUETE (19/10) — várias carreiras guardadas no aparelho, igual ao futebol.
// A carreira EM JOGO mora em `bl-nba-career` (o autosave do store grava lá); as outras ficam no
// arquivo `bl-nba-career-archive`. Nada aqui toca as chaves do futebol.
// Regra do Diego (06/10): TROCAR NUNCA PERDE NADA — toda troca grava o arquivo PRIMEIRO e só depois
// mexe na ativa; se o aparelho estiver sem espaço, a troca não acontece e a tela avisa.
import type { EscState } from './types'

const ATIVA = 'bl-nba-career'
const ATIVA_AT = 'bl-nba-career-at'
const ARQUIVO = 'bl-nba-career-archive'

export type NbaSlot = { save: EscState; at: number }

const valido = (s: EscState | null | undefined): s is EscState =>
  !!s && s.sport === 'basquete' && !!s.nbaCareer && !!s.managers?.length
// carreira de antes do código fixo: ganha um, derivado do que ela já tem (estável entre leituras)
export const idDe = (s: EscState): string => s.nbaCareerId ?? `nba-antiga-${s.managers?.[s.youIdx ?? 0]?.teamName ?? ''}`

function lerArquivo(): NbaSlot[] {
  try { const a = JSON.parse(localStorage.getItem(ARQUIVO) ?? '[]') as NbaSlot[]; return Array.isArray(a) ? a.filter(x => valido(x?.save)) : [] } catch { return [] }
}
function lerAtiva(): NbaSlot | null {
  try {
    const r = localStorage.getItem(ATIVA); if (!r) return null
    const save = JSON.parse(r) as EscState
    return valido(save) ? { save, at: Number(localStorage.getItem(ATIVA_AT)) || Date.now() } : null
  } catch { return null }
}

/** todas as carreiras do basquete: a ativa primeiro (última jogada), depois o arquivo do mais recente pro mais antigo */
export function listaNbaCarreiras(): { slot: NbaSlot; ativa: boolean }[] {
  const ativa = lerAtiva()
  const arq = lerArquivo().filter(x => !ativa || idDe(x.save) !== idDe(ativa.save)).sort((a, b) => b.at - a.at)
  return [...(ativa ? [{ slot: ativa, ativa: true }] : []), ...arq.map(slot => ({ slot, ativa: false }))]
}

/** guarda a ativa no arquivo e libera a vaga (pra começar outra). false = sem espaço, nada mudou */
export function guardaAtivaNba(): boolean {
  const ativa = lerAtiva()
  if (!ativa) return true
  const arq = lerArquivo().filter(x => idDe(x.save) !== idDe(ativa.save))
  try { localStorage.setItem(ARQUIVO, JSON.stringify([ativa, ...arq])) } catch { return false }
  try { localStorage.removeItem(ATIVA); localStorage.removeItem(ATIVA_AT) } catch { /* a cópia já está no arquivo */ }
  return true
}

/** troca pra uma carreira do arquivo: a de agora vai pro arquivo, a escolhida vira a ativa. null = sem espaço, nada mudou */
export function ativaNbaCarreira(id: string): EscState | null {
  const arq = lerArquivo()
  const alvo = arq.find(x => idDe(x.save) === id)
  if (!alvo) return null
  const ativa = lerAtiva()
  const novoArq = [...(ativa ? [ativa] : []), ...arq.filter(x => idDe(x.save) !== id && (!ativa || idDe(x.save) !== idDe(ativa.save)))]
  // 1º grava a escolhida como ativa (a de agora segue no lugar até o arquivo novo estar gravado)
  const antes = { ativa: localStorage.getItem(ATIVA), at: localStorage.getItem(ATIVA_AT) }
  try {
    localStorage.setItem(ARQUIVO, JSON.stringify([...novoArq, alvo])) // a escolhida continua no arquivo até a ativa nova estar gravada
    localStorage.setItem(ATIVA, JSON.stringify(alvo.save)); localStorage.setItem(ATIVA_AT, String(Date.now()))
    localStorage.setItem(ARQUIVO, JSON.stringify(novoArq))
  } catch {
    try { if (antes.ativa != null) localStorage.setItem(ATIVA, antes.ativa); if (antes.at != null) localStorage.setItem(ATIVA_AT, antes.at) } catch { /* segue */ }
    return null
  }
  return alvo.save
}

/** apaga de vez (só pelo 🗑️, com confirmação na tela) */
export function apagaNbaCarreira(id: string): void {
  const ativa = lerAtiva()
  try {
    if (ativa && idDe(ativa.save) === id) { localStorage.removeItem(ATIVA); localStorage.removeItem(ATIVA_AT) }
    localStorage.setItem(ARQUIVO, JSON.stringify(lerArquivo().filter(x => idDe(x.save) !== id)))
  } catch { /* segue */ }
}
