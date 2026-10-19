// 🧑‍💼 gera o CATÁLOGO DE PEÇAS AVULSAS do presidente pro banco (19/10). O banco precisa saber o NÍVEL de cada peça
// pra cobrar o preço certo no Pix (Craque 1,99 · Lenda 2,99 · Batismo 3,99 · Fundador 4,99) — e a fonte é o catálogo do jogo.
//   npx tsx scripts/gera-catalogo-presidente.mts            → imprime o SQL (insert … on conflict)
//   (a trava `npm run presidente` confere que o banco e o código têm as mesmas peças)
import { catalogoAvulsas } from '../src/escalacao/presidente-avulsas'
const linhas = catalogoAvulsas().map(p => `('${p.ref}', ${p.nivel})`)
console.log(`insert into public.esc_presidente_catalogo (peca, nivel) values\n  ${linhas.join(',\n  ')}\non conflict (peca) do update set nivel = excluded.nivel;`)
