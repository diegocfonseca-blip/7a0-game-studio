// ─── 🎽 O CARDÁPIO DE FORMAÇÕES DO TÉCNICO — uma função só pra tela e pro motor (23/10) ──────────
// Antes a regra morava só dentro do seletor de formação (pyramidseason.tsx). Com a Escalação A/B (`escalacao-salva.ts`)
// ela passou a ser lida em três lugares — o seletor, o cartão do A/B e o reducer que aplica o time salvo — e a REGRA DE
// OURO CONTRA BOTÃO MUDO (19/09) manda que tela e motor leiam a MESMA função. As regras são as de sempre:
//   · 🧢 com técnico: as formações DELE + a 🏠 da casa (a que o time já jogava quando ele chegou);
//   · sem técnico: SÓ a formação que o time já joga (Diego 28/08) — com a válvula do 4-3-3/4-4-2 se o elenco não montar a atual;
//   · a ATUAL nunca sai do cardápio;
//   · fora das 15 formações (online/conta antiga): qualquer uma que o elenco consiga preencher.
const BASE2 = new Set(['4-3-3', '4-4-2'])
export function formacaoNoCardapio(a: {
  quinze: boolean; temTecnico: boolean; doTecnico: string[]; daCasa: string | null
  atualRotulo: string; atualMonta: boolean; rotulo: string; monta: boolean
}): boolean {
  if (!a.quinze) return a.monta || a.rotulo === a.atualRotulo
  if (a.rotulo === a.atualRotulo) return true
  if (a.temTecnico) return a.doTecnico.includes(a.rotulo) || a.rotulo === a.daCasa
  const socorro = !a.atualMonta // elenco não monta a atual
  return socorro && BASE2.has(a.rotulo)
}
