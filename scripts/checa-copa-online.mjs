#!/usr/bin/env node
// ─── 🌍 GUARDA DA COPA DO MUNDO ONLINE — `npm run copa` ──────────────────────
//
// A Copa online se apoia numa promessa só, e ela é tudo: **todo mundo na sala vê
// a MESMA Copa**. Ninguém manda resultado pra ninguém — o dono publica a ficha
// (semente + as 24 seleções com as 11 chaves de cada um) e cada aparelho
// recalcula o torneio inteiro sozinho, porque `simulaCopaMundo` é função pura e
// semeada.
//
// Se um dia alguém mexer no motor e ele passar a olhar pra alguma coisa que é
// DIFERENTE em cada aparelho (o `you`, a hora, `Math.random`, o baralho ativo),
// a sala racha: cada um vê um campeão. Não daria erro nenhum na tela — só um
// monte de gente discutindo quem ganhou. Este guarda é pra isso não passar.
//
// Ele roda no NAVEGADOR de verdade (o motor mora no meio das telas, e fora do
// navegador o ciclo de imports nem carrega): sobe o vite, abre a página de
// teste, e confere linha por linha.
//
//   npm run copa

import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'

const PORTA = 5199
const URL = `http://localhost:${PORTA}/7a0-game-studio/scripts/checa-copa-online.html`

const vite = spawn('npx', ['vite', '--port', String(PORTA), '--strictPort'], { stdio: 'ignore', detached: true })
const mata = () => { try { process.kill(-vite.pid) } catch { /* já morreu */ } }

let saida = ''
try {
  await new Promise(r => setTimeout(r, 7000))
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
  const pg = await b.newPage()
  await pg.goto(URL, { waitUntil: 'networkidle' })
  await pg.waitForFunction(() => /FIM|ERRO/.test(document.getElementById('out').textContent), { timeout: 60000 }).catch(() => {})
  saida = await pg.textContent('#out')
  await b.close()
} finally { mata() }

console.log(saida.trim())
console.log('')

const exige = [
  ['TODO MUNDO VÊ A MESMA COPA? SIM', 'os aparelhos calcularam Copas DIFERENTES — a sala racharia'],
  ['quantos "você" no aparelho do Diego: 1', 'o dono do aparelho tem que ser UMA seleção, nem zero nem duas'],
  ['e no de quem não escolheu: 0', 'quem não escolheu seleção não pode "virar" ninguém'],
  ['alguma seleção com time incompleto? nenhuma', 'seleção com menos de 11 quebra o gol'],
  ['times na ficha: 24', 'a Copa é de 24 seleções — o resto é máquina'],
]
const erros = exige.filter(([linha]) => !saida.includes(linha)).map(([linha, porque]) => `❌ ${porque}\n   (esperava a linha: "${linha}")`)
if (saida.includes('ERRO:')) erros.push('❌ a página de teste estourou — veja o ERRO acima')

if (erros.length) { console.log(erros.join('\n')); process.exit(1) }
console.log('✅ copa online ok — todo mundo da sala vê a MESMA Copa, e cada um é só a própria seleção.')
