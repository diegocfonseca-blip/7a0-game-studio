// ─── 🔤 NOME DE TIME ARRUMADO (21/10, regra do Diego) ───────────────────────────────────────────────────────────────
// *"Todo time do usuário, quando for feito, mesmo que ele bote maiúscula, nós temos que ajustar pra primeira letra
// maiúscula e o restante minúscula. E FC sempre maiúscula."* Vale na HORA de criar/trocar o nome (cadastro, carreira,
// dinastia, chip do nome nas salas) — nome que já existe só muda quando a pessoa salva de novo.
//   "NEYMAR_FC" → "Neymar_FC" · "mengao caxiense" → "Mengao Caxiense" · "TRICOLOR DO ARRUDA fc" → "Tricolor do Arruda FC"
// Cada palavra: 1ª letra maiúscula, resto minúscula. "de/da/do/dos/das/e" no meio ficam minúsculas. FC/EC/SC/AC sempre
// maiúsculas. O separador (espaço, _, -, /, .) fica como a pessoa escreveu.
const MIUDAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e'])
const SIGLAS = new Set(['fc', 'ec', 'sc', 'ac', 'afc', 'cf', 'sfc', 'saf'])
export function nomeDeTime(t: string): string {
  const pedacos = t.trim().replace(/\s+/g, ' ').split(/([\s_\-/.]+)/)
  let palavra = 0
  return pedacos.map(p => {
    if (!p || /^[\s_\-/.]+$/.test(p)) return p
    const min = p.toLocaleLowerCase('pt-BR')
    const i = palavra++
    if (SIGLAS.has(min)) return min.toUpperCase()
    if (i > 0 && MIUDAS.has(min)) return min
    return min.charAt(0).toLocaleUpperCase('pt-BR') + min.slice(1)
  }).join('')
}
