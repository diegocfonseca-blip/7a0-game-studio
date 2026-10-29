// ─── ✕ AVISO FECHADO NÃO VOLTA (29/10, regra do Diego) ──────────────────────────────────────────────────────────
// Palavras dele: *"se aparecer mensagem, é fechar — não quero que volte a mensagem mais"*. Todo aviso que aparece SOZINHO
// e tem ✕ (ou "agora não" / "deixa assim") guarda o fechamento AQUI, no aparelho, pra sempre. Antes vários só lembravam
// enquanto a tela estava aberta (useState) ou até fechar a aba (sessionStorage), e voltavam.
// · Quem cria aviso novo que aparece sozinho: usa `avisoFechado`/`fechaAviso` com uma chave própria.
// · Sem localStorage (anônima/cheio): cai no sessionStorage e na memória — o melhor que dá sem banco.
const PREFIXO = 'esc-aviso-x-'
const naMemoria = new Set<string>()
export function avisoFechado(chave: string): boolean {
  if (naMemoria.has(chave)) return true
  try { if (localStorage.getItem(PREFIXO + chave) === '1') return true } catch { /* sem localStorage */ }
  try { if (sessionStorage.getItem(PREFIXO + chave) === '1') return true } catch { /* sem sessionStorage */ }
  return false
}
export function fechaAviso(chave: string): void {
  naMemoria.add(chave)
  try { localStorage.setItem(PREFIXO + chave, '1'); return } catch { /* cheio: tenta a sessão */ }
  try { sessionStorage.setItem(PREFIXO + chave, '1') } catch { /* fica só na memória */ }
}
