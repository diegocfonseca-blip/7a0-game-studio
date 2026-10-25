// ─── 🚫 NOME COM PRECONCEITO (21/10, regra do Diego) ──────────────────────────────────────────────────────────────
// *"não deixe criar mais nomes dessa forma… nem logo de nazismo nem palavras referentes ao nazismo ao fazer novo time e nova
// sala"* — e "crioulo". E "estupr…" (21/10, time "ESTUPRADOR DE JUDEU": *"essa palavra também tem que ser removida"*). E "molest…" (25/10, "Sala do Molestador": *"não deixe mais colocar a palavra molestador, estuprador também"*). Palavrão continua liberado (ordem dele). Quem manda é o BANCO (`esc_nome_ofensivo`: barra a sala e
// limpa o nome do perfil); esta é a MESMA régua na tela, pra avisar antes de gravar. Mudou aqui, muda lá (e vice-versa).
const tira = (t: string) => t.toLowerCase().replace(/[áàâãä]/g, 'a').replace(/[éèêë]/g, 'e').replace(/[íìîï]/g, 'i')
  .replace(/[óòôõö]/g, 'o').replace(/[úùûü]/g, 'u').replace(/ç/g, 'c')
  .replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's').replace(/@/g, 'a').replace(/\$/g, 's').replace(/!/g, 'i')
export function nomeOfensivo(t: string | null | undefined): boolean {
  const solto = tira(t ?? '')
  const junto = solto.replace(/[^a-z卍卐࿕-࿘]/g, '').replace('internazional', '') // "Internazionale" (Inter de Milão) não conta
  return /(nazis|crioul|hitler|suastic|swastik|fuhrer|fuehrer|siegheil|estupr|molest|[卍卐࿕-࿘])/.test(junto) || /(^|[^a-z])nazi([^a-z]|$)/.test(solto)
}
