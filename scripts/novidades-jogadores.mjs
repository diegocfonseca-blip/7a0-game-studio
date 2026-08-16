// ─── 🎴 MUDANÇAS DO BARALHO, AUTOMÁTICAS (Diego 16/08) ────────────────────
//
// Pedido do Diego, com estas palavras: *"Jogadores mesma coisa: sempre que eu
// incluir, remover ou mudar níveis ou categorias, joga automático na área de
// recém-lançados também"*.
//
// Como funciona, sem mágica:
//   1. Este script LÊ o baralho de verdade (`data.ts`, os dois catálogos).
//   2. Compara com a FOTO da última vez (`scripts/catalogo-snapshot.json`).
//   3. Escreve o que mudou em `src/escalacao/novidades-jogadores.ts` — entrou,
//      saiu, mudou de nível, virou/deixou de ser promessa ou folclórico.
//   4. Tira uma foto nova pra próxima comparação.
//
// Ou seja: ninguém escreve novidade de jogador na mão. Mexeu no baralho, roda
// `npm run novidades` e a home já conta. A foto mora FORA do `src/` de
// propósito — ela não entra no bundle, então isso custa **0 KB** pra quem joga
// (só o arquivinho das mudanças, que é curto).
//
// ⚠️ A foto é a memória. Se ela sumir, a primeira rodada acha que TODO mundo é
// novo — por isso ela é versionada no git junto com o baralho.
import { createServer } from 'vite'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const FOTO = join(raiz, 'scripts', 'catalogo-snapshot.json')
const SAIDA = join(raiz, 'src', 'escalacao', 'novidades-jogadores.ts')

const hoje = new Date().toISOString().slice(0, 10)

// nível como a pessoa vê na carta (o mesmo vocabulário do jogo)
const NIVEL = { 5: 'lenda', 4: 'craque', 3: 'bom jogador', 2: 'bom jogador', 1: 'foi profissional' }
const nivelDe = c => (c.promessa ? 'promessa' : NIVEL[c.fame] ?? '—')

function achatar(cat, baralho) {
  const out = {}
  for (const pos of Object.keys(cat)) {
    for (const c of cat[pos]) {
      out[`${baralho}|${c.name}|${c.club}|${c.year}`] = { n: c.name, p: pos, f: c.fame, pr: !!c.promessa, fo: !!c.folk }
    }
  }
  return out
}

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const data = await server.ssrLoadModule('/src/escalacao/data.ts')
await server.close()

const agora = { ...achatar(data.CATALOG, 'BR'), ...achatar(data.CATALOG_EU, 'EU') }
const antes = existsSync(FOTO) ? JSON.parse(readFileSync(FOTO, 'utf8')) : null

const mudancas = []
if (antes) {
  for (const [k, c] of Object.entries(agora)) {
    const a = antes[k]
    const baralho = k.startsWith('EU') ? 'EU' : 'BR'
    if (!a) { mudancas.push({ tipo: 'entrou', nome: c.n, baralho, nivel: nivelDe({ fame: c.f, promessa: c.pr }) }); continue }
    if (a.f !== c.f || a.pr !== c.pr) {
      const de = nivelDe({ fame: a.f, promessa: a.pr }), pra = nivelDe({ fame: c.f, promessa: c.pr })
      if (de !== pra) mudancas.push({ tipo: 'nivel', nome: c.n, baralho, de, para: pra })
    }
    if (a.fo !== c.fo) mudancas.push({ tipo: c.fo ? 'virou-folk' : 'saiu-folk', nome: c.n, baralho })
  }
  for (const [k, a] of Object.entries(antes)) {
    if (!agora[k]) mudancas.push({ tipo: 'saiu', nome: a.n, baralho: k.startsWith('EU') ? 'EU' : 'BR' })
  }
}

// junta com o que já estava escrito, pra mudança de semanas atrás não sumir
// só porque hoje ninguém mexeu no baralho.
let antigas = []
if (existsSync(SAIDA)) {
  const m = readFileSync(SAIDA, 'utf8').match(/export const MUDANCAS_JOGADORES: MudancaJogador\[\] = (\[[\s\S]*?\n\])/)
  if (m) { try { antigas = JSON.parse(m[1].replace(/(\w+):/g, '"$1":').replace(/'/g, '"').replace(/,(\s*[\]}])/g, '$1')) } catch { antigas = [] } }
}
const todas = [...mudancas.map(m => ({ ...m, data: hoje })), ...antigas]
  // guarda no máximo 120 dias e 60 linhas — o resto é história velha
  .filter(m => Date.parse(m.data) >= Date.now() - 120 * 86400000)
  .slice(0, 60)

writeFileSync(SAIDA, `// ⚠️ ARQUIVO GERADO — não edite na mão.
// Sai do \`npm run novidades\`, que compara o baralho de hoje com a foto em
// \`scripts/catalogo-snapshot.json\`. Mexeu em jogador (entrou, saiu, mudou de
// nível ou de categoria)? Rode o comando e a home conta sozinha.
export interface MudancaJogador { data: string; tipo: 'entrou' | 'saiu' | 'nivel' | 'virou-folk' | 'saiu-folk'; nome: string; baralho: 'BR' | 'EU'; nivel?: string; de?: string; para?: string }
export const MUDANCAS_JOGADORES: MudancaJogador[] = ${JSON.stringify(todas, null, 2)}
`)
writeFileSync(FOTO, JSON.stringify(agora))

const conta = t => mudancas.filter(m => m.tipo === t).length
console.log(antes
  ? `✅ ${mudancas.length} mudança(s) no baralho: ${conta('entrou')} entrou · ${conta('saiu')} saiu · ${conta('nivel')} mudou de nível · ${conta('virou-folk') + conta('saiu-folk')} mudou de categoria`
  : `📸 Primeira foto do baralho tirada (${Object.keys(agora).length} cartas). Da próxima vez que alguém mexer, a mudança sai sozinha.`)
console.log(`   ${SAIDA.replace(raiz + '/', '')} · ${todas.length} linha(s) na home`)
