// ⏰ CONFERE OS VIGIAS DE PRAZO DO ONLINE — `npm run vigias`
//
// Nasceu em 28/08, do "do nada trava" do rápido online que o Diego relatou:
// *"o jogo está fluindo, benzão, aí do nada um dia vai e trava"*.
//
// A CAUSA era sempre a mesma forma escrita no código: um prazo do online
// (fechar o envelope, resolver o empate, a vez do monte, a cerimônia) vigiado
// por UM `setTimeout` só. Celular PAUSA `setTimeout` quando a aba sai da frente,
// e o efeito do React só rearma quando o prazo MUDA — e ele não muda, porque a
// sala está justamente presa naquele prazo. Um tiro perdido = sala travada até
// alguém dar F5.
//
// A cura é o `useVigiaPrazo` (store.tsx): tiro + conferida de relógio de 4 em 4s
// + disparo quando a pessoa volta pra tela. Este script existe pra a forma
// ERRADA não voltar sem ninguém perceber: ele acusa qualquer `setTimeout` armado
// em cima de um campo `*Deadline`.
//
// Sai com código 1 se achar algo, pra dar pra ligar em CI um dia.
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const ARQUIVOS = ['src/escalacao/store.tsx', 'src/escalacao/screens.tsx', 'src/escalacao/pyramidseason.tsx']

// `setTimeout(...)` com um `algumaCoisaDeadline - Date.now()` dentro da conta do
// atraso — a assinatura exata do tiro único. O `[\s\S]{0,200}` cobre a quebra de
// linha do prettier sem atravessar a função inteira.
// O `[\s\S]{0,30}` entre o campo e o `-` cobre as formas que aparecem de
// verdade no código: `x.monteDeadline - Date.now()` e `(x.monteDeadline ?? 0) -
// Date.now()`. Sem essa folga a conferência passava batido no 2º caso.
const RX = /setTimeout\([\s\S]{0,200}?(\w*Deadline)[\s\S]{0,30}?-\s*Date\.now\(\)/g

const achados = []
for (const rel of ARQUIVOS) {
  const txt = readFileSync(join(raiz, rel), 'utf8')
  for (const m of txt.matchAll(RX)) {
    const linha = txt.slice(0, m.index).split('\n').length
    achados.push({ rel, linha, campo: m[1] })
  }
}

// contra-prova: o vigia bom tem que estar sendo usado de verdade
const store = readFileSync(join(raiz, 'src/escalacao/store.tsx'), 'utf8')
const usos = (store.match(/useVigiaPrazo\(/g) ?? []).length - 1 // -1 = a definição
const temVigia = /function useVigiaPrazo\(/.test(store)

console.log(`⏰ ${ARQUIVOS.length} arquivos conferidos · useVigiaPrazo ${temVigia ? `existe e é usado ${usos}×` : 'NÃO EXISTE'}\n`)

if (!temVigia || usos < 4) {
  console.log('❌ o vigia bom sumiu ou parou de ser usado nos 4 prazos do online')
  console.log('   (envelope · desempate · vez do monte · cerimônia)\n')
}

if (achados.length) {
  console.log(`❌ ${achados.length} prazo(s) vigiado(s) por setTimeout de TIRO ÚNICO:`)
  for (const a of achados) console.log(`   ${a.rel}:${a.linha} → ${a.campo}`)
  console.log('   → trocar por useVigiaPrazo(ligado, prazo, () => dispatch({...})).')
  console.log('     Celular pausa setTimeout em 2º plano; se o tiro se perde, a sala trava.\n')
}

const ruim = achados.length > 0 || !temVigia || usos < 4
if (!ruim) console.log('✅ nenhum prazo do online depende de um setTimeout de tiro único.')
process.exit(ruim ? 1 : 0)
