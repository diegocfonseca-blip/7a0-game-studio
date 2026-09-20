// ─── 🐊 A ESCADA DO PREGÃO DA TOCAIA — espelho em JS puro ────────────────────
//
// Cópia fiel de `holEscada` / `holPassoMs` do `src/escalacao/store.tsx`. Existe
// porque script `.mjs` não importa `.tsx`, e o vídeo do modo mostra os números
// DE VERDADE na tela — se a escada do jogo mudar e esta ficar pra trás, o vídeo
// vira propaganda enganosa.
//
// 🔒 Quem garante que as duas não desencontram: `npm run holandes`, que compara
// esta lista com a que o `store.tsx` gera de verdade, rodando no navegador.

/** os degraus de preço, do valor de abertura até o zero */
export function holEscada(start) {
  const out = []
  let v = Math.max(1, Math.round(start))
  while (v > 0) {
    out.push(v)
    v = Math.max(0, v - (v > 60 ? 10 : v > 50 ? 5 : v > 30 ? 4 : v > 20 ? 3 : v > 14 ? 2 : 1))
  }
  out.push(0)
  return out
}

/** quanto tempo cada degrau fica na tela: rápido no enfeite, lento onde dói */
export const holPassoMs = (preco, start = 100) => {
  const f = preco / Math.max(1, start)
  return f > 0.55 ? 500 : f > 0.22 ? 1400 : 2000
}

/** quanto dura a descida inteira, em segundos (o degrau do ZERO não espera nada) */
export const descidaSegundos = (start = 100) =>
  holEscada(start).slice(0, -1).reduce((a, p) => a + holPassoMs(p, start), 0) / 1000
