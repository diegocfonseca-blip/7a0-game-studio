import { createServer } from 'vite'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { writeFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
try {
  const { CareerInternationalView } = await vite.ssrLoadModule('/src/escalacao/career-international-view.tsx')
  const { CATALOG_BOTH } = await vite.ssrLoadModule('/src/escalacao/data.ts')
  const { INTERNATIONAL_CLUBS } = await vite.ssrLoadModule('/src/escalacao/career-international.ts')
  const squad = Object.entries({ GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 }).flatMap(([pos, count]) => CATALOG_BOTH[pos].slice(0, count).map((card, i) => ({ ...card, pos, id: `meu-${pos}-${i}` })))
  const html = renderToStaticMarkup(React.createElement(CareerInternationalView, {
    season: 40, seed: 101, userTeam: 'Neymarzetty FC', userId: 0, squad,
    choices: INTERNATIONAL_CLUBS, priority: 1, campaign: null, history: [],
    onStart: () => {}, onAdvance: () => {}, onFinish: () => {},
  }))
  const css = readdirSync('dist/assets').find(file => file.startsWith('index-') && file.endsWith('.css'))
  const output = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="file://${resolve('dist/assets', css)}"><style>body{font-family:system-ui;background:#F4ECD6;color:#0C0C0C;margin:0;padding:30px;max-width:900px;margin:auto}*{box-sizing:border-box}</style></head><body>${html}</body></html>`
  writeFileSync('/tmp/leilao-internacional-mockup.html', output)
  console.log('/tmp/leilao-internacional-mockup.html')
  const { makeInternationalCampaign } = await vite.ssrLoadModule('/src/escalacao/career-international-season.ts')
  const campaign = makeInternationalCampaign({ season: 40, seed: 101, representedClub: 'Flamengo', userTeam: 'Neymarzetty FC', userId: 0, priority: 1, userXI: squad })
  campaign.reveal = 1
  const games = renderToStaticMarkup(React.createElement(CareerInternationalView, {
    season: 40, seed: 101, userTeam: 'Neymarzetty FC', userId: 0, squad,
    choices: INTERNATIONAL_CLUBS, priority: 1, campaign, history: [],
    onStart: () => {}, onAdvance: () => {}, onFinish: () => {},
  }))
  writeFileSync('/tmp/leilao-internacional-jogos.html', output.replace(html, games))
  console.log('/tmp/leilao-internacional-jogos.html')
} finally { await vite.close() }
