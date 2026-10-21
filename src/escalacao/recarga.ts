// ─── 🔄 PEDAÇO DO JOGO QUE CARREGA SÓ NA HORA ─────────────────────────────────
//
// O jogo carrega alguns pedaços SÓ NA HORA (a Loja do Clube, a Copa da liga, a
// Liga Draft). O nome do arquivo tem um código que muda a cada publicação.
//
// HISTÓRIA: em 24/09 (50 quedas "Failed to fetch dynamically imported module")
// a publicação APAGAVA os arquivos antigos, e quem estava com o jogo aberto caía
// ao abrir um pedaço. O remendo foi recarregar a página sozinho uma vez.
//
// 🛑 21/10 — O DIEGO MANDOU TIRAR A RECARGA SOZINHA. Na sala de duplas do
// Futpoint (13 pessoas, ao vivo) duas publicações seguidas fizeram todo mundo
// recarregar no meio da partida, e quem recarregava era tirado da sala. Palavras
// dele: *"não quero mais que publicando coisa nova faça atualizar a página
// sozinho… só atualiza se ele atualizar mesmo manualmente… não atualize por ele
// porque pode dar erro"*.
//
// O CONSERTO DE VERDADE mora na publicação: ela agora mantém no ar os arquivos
// das versões anteriores (`scripts/guarda-versao-anterior.mjs`, no deploy.yml),
// então o pedaço velho continua existindo e quem está no meio da partida segue
// jogando na versão que abriu. Este embrulho ficou só como ponto único dos
// imports preguiçosos — se um dia o arquivo sumir mesmo, a tela de erro aparece
// (com o botão de voltar), e quem atualiza é a pessoa.

/** o erro é "o arquivo do pedaço sumiu"? (cada navegador escreve com uma frase) */
export function ehPedacoQueSumiu(err: unknown): boolean {
  const m = String((err as { message?: unknown })?.message ?? err ?? '').toLowerCase()
  return m.includes('dynamically imported module')   // Chrome/Edge
    || m.includes('importing a module script failed') // Safari/iOS
    || m.includes('error loading dynamically imported module')
    || m.includes('failed to fetch dynamically imported')
    || m.includes('unable to preload css')            // o CSS do mesmo pedaço
}

/** Embrulha um `import()` de pedaço. Não recarrega nada: o erro (se houver) sobe pra tela de erro. */
export function pedaco<T>(carrega: () => Promise<T>): () => Promise<T> {
  return carrega
}
