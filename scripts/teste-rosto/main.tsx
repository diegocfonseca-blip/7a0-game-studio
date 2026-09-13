// 🔬 BANCADA de conferência (13/09) — monta telas REAIS do jogo, sem mockup.
//   (padrão)   🏛️ Salão dos Batismos — confere a abertura pra geral: nº de fundador
//              escondido, lista de donos escondida na torcida, tela em PT/EN.
//   ?agencia   🕴️ Agência — confere o rosto de lenda no quadradinho e o TIER de
//              cada carta com ela chegando SEM o campo `promessa` (é assim que ela
//              vem do álbum da nuvem, onde esse campo não existe).
//   ?patrocinio 🤝 a tela REAL do patrocínio de hoje (proposta no início da
//              temporada + a faixa da aba Clube), pra desenhar o Master por cima.
//   ?master    🏆 MOCKUP do Patrocinador Master desenhado por cima da cena REAL
//              do escritório (mesmas classes CSS) — 3 colunas: contrato acabou ·
//              dia a dia · aba Clube. Nada disto está no jogo; é pro OK do Diego.
//   ?masterreal 🏆 o Patrocinador Master DE VERDADE (componentes do jogo), nas duas
//              versões: caixinha (todo mundo) e escritório (prévia), proposta e
//              contrato correndo. `&en` mostra em inglês.
//   ?video     🎬 cena pro VÍDEO de mockup do Master (tela de celular, 430px):
//              os 4 contratos → escolhe → assina → faixa ASSINADO → Pontual embaixo.
//              Gravado por scripts/video-master.mjs. Cursor falso segue o mouse.
//   ?en        força o inglês.
// ⚠️ ordem dos imports: store → screens → pyramidseason/salao (ciclo do COPA_LEG_MS)
// ⚠️ envolver em <EscProvider>: o UnlockBanner usa useEsc.
import { createRoot } from 'react-dom/client'
import '../../src/index.css'
import { EscProvider } from '../../src/escalacao/store'
import '../../src/escalacao/screens'
import { AgenciadosTab } from '../../src/escalacao/pyramidseason'
import Salao from '../../src/escalacao/salao'
import { CareerSponsorVisual, CareerSponsorOverview } from '../../src/escalacao/career-sponsor-visual'
import { MasterBanner, MasterFaixa, MasterRegua, SponsorBetBanner } from '../../src/escalacao/estadio'
import { useState } from 'react'
import { VADICO_LOGO } from '../../src/escalacao/vadico'
import { ERO_LOGO } from '../../src/escalacao/ero'
import { MAXJOIAS_LOGO } from '../../src/escalacao/maxjoias'
import { REIDASTINTAS_LOGO } from '../../src/escalacao/reidastintas'
import { CATALOG, CATALOG_EU, CATALOG_WORLD } from '../../src/escalacao/data'
import type { AgCard } from '../../src/escalacao/types'

const q = new URLSearchParams(location.search)
if (q.has('en')) { try { localStorage.setItem('bl_lang', 'en') } catch { /* ignora */ } }
if (q.has('master') || (q.has('masterreal') && !q.has('en'))) { try { localStorage.setItem('bl_lang', 'pt') } catch { /* ignora */ } }

type C = { name: string; club: string; year: number; fame: number; promessa?: boolean; folk?: boolean }
const TODAS: (C & { pos: string })[] = [CATALOG, CATALOG_EU, CATALOG_WORLD]
  .flatMap(cat => Object.entries(cat).flatMap(([pos, l]) => (l as C[]).map(c => ({ ...c, pos }))))
// de propósito SEM o campo `promessa`: é assim que a carta chega do álbum da nuvem
const semFlag = (n: string, cl: string, y: number): AgCard => {
  const c = TODAS.find(x => x.name === n && x.club === cl && x.year === y)!
  return { name: c.name, club: c.club, year: c.year, pos: c.pos, fame: c.fame }
}
const CARDS: AgCard[] = [
  semFlag('Dani Alves', 'Barcelona', 2011), semFlag('Dani Alves', 'Bahia', 2002),
  semFlag('Kaká', 'Milan', 2007), semFlag('Kaká', 'São Paulo', 2003),
  semFlag('Rummenigge', 'Bayern', 1981), semFlag('Allan Simonsen', 'Mönchengladbach', 1977),
  semFlag('Lothar Matthäus', 'Inter', 1990), semFlag('Kenny Dalglish', 'Liverpool', 1983),
  // 🗂️ cartas VELHAS (a gente renomeou a carta; o álbum guarda a antiga)
  { name: 'Zinedine Zidane', club: 'Real Madrid', year: 2002, pos: 'MEI', fame: 5 },
  { name: 'Zizinho', club: 'Flamengo', year: 1950, pos: 'ATA', fame: 5 },
  { name: 'Marcos', club: 'Palmeiras', year: 1999, pos: 'GOL', fame: 5 },
  { name: 'Zlatan Ibrahimović', club: 'Milan', year: 2013, pos: 'ATA', fame: 5 },
]
// estádio fake com tudo desbloqueado (StadiumSave = { inv, ext })
const estadio = { inv: { grama: 999, norte: 999, sul: 999, leste: 999, oeste: 999 }, ext: ['saf'] }


// ─── 🏆 MOCKUP DO MASTER (só na bancada) ────────────────────────────────────
// Régua proposta: 1 temp = aposta 🛡️ não cair · +metade por temp a mais · 5 = 👑 campeão.
const MASTER_BASE: Record<string, number> = { V: 2, D: 4, C: 8, B: 16, A: 32 }
const mval = (div: string, anos: number) => MASTER_BASE[div] * (1 + (anos - 1) / 2)
// Diego (13/09): *"botando apenas os reais que tem no jogo: ERO, Rei das Tintas,
// Max Joias e Vadico Veículos. Quero que a Vadico seja o que dá mais grana porém
// mais temporadas"*. A ordem 1·2·3·5 segue o nível que cada marca já tem hoje no
// Pontual (Max Joias nível 1 · Rei das Tintas nível 2 · ERO e Vadico nível 3).
const MASTER_MARCAS = [
  { anos: 1, nome: 'Max Joias', logo: MAXJOIAS_LOGO },
  { anos: 2, nome: 'Rei das Tintas', logo: REIDASTINTAS_LOGO },
  { anos: 3, nome: 'ERO Odontologia', logo: ERO_LOGO },
  { anos: 5, nome: 'Vadico Veículos', logo: VADICO_LOGO },
]
const GOLD = '#FFC400', INK = '#0C0C0C', GREEN = '#1B7A3D'
function MasterFaixaMock({ div, anos, ano, nome, logo }: { div: string; anos: number; ano: number; nome: string; logo: string }) {
  return (
    <div style={{ background: '#160e08', color: '#f4ecd6', border: `3px solid ${INK}`, borderRadius: 16, boxShadow: `4px 4px 0 ${INK}`, padding: '12px 14px', marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <div>
          <div style={{ font: '600 10px Oswald,sans-serif', letterSpacing: '.08em', color: GOLD }}>🏆 PATROCINADOR MASTER · {div === 'V' ? 'VÁRZEA' : `SÉRIE ${div}`}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <span style={{ background: '#fff', borderRadius: 6, padding: '2px 5px', display: 'inline-flex' }}><img src={logo} alt="" style={{ height: 22, width: 'auto', maxWidth: 90, objectFit: 'contain' }} /></span>
            <span style={{ font: '700 20px/1.1 Oswald,sans-serif' }}>{nome}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ font: '700 24px/1 Oswald,sans-serif', color: GOLD }}>+{mval(div, anos)} 🪙</div>
          <div style={{ font: '700 10px Arial,sans-serif', opacity: .75 }}>por temporada · {mval(div, anos) * anos} no total</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, margin: '10px 0 6px' }}>
        {Array.from({ length: anos }, (_, i) => <div key={i} style={{ flex: 1, height: 9, border: `2px solid ${GOLD}`, borderRadius: 4, background: i < ano ? GOLD : 'transparent' }} />)}
      </div>
      <div style={{ font: '700 12px Arial,sans-serif' }}>Temporada <b>{ano}</b> de <b>{anos}</b> do contrato · faltam <b>{anos - ano}</b></div>
      <div style={{ font: '12px/1.45 Arial,sans-serif', opacity: .8, marginTop: 3 }}>Fechado na Série C. O valor é o da divisão onde você assinou e <b>não muda</b> se subir ou cair. Nova proposta só quando acabar.</div>
    </div>
  )
}
function MasterProposta() {
  const div = 'V'; const divNome = 'Várzea'; const esc = MASTER_MARCAS[3]
  // Diego (13/09): *"no visual já aparecesse os 4 painéis abertos de uma vez, já
  // mostrando cada marca, cada temporada e cada valor a pagar… coloque o valor
  // total das temporadas e o que ele ganhará por temporada, que é só dividir"*.
  const Papel = ({ m }: { m: typeof MASTER_MARCAS[number] }) => {
    const porTemp = mval(div, m.anos); const total = porTemp * m.anos; const on = m === esc
    return (
      <div style={{ background: '#f6efdc', color: INK, border: `3px solid ${on ? '#7c3aed' : INK}`, outline: on ? '3px solid #7c3aed' : 'none', outlineOffset: 1, borderRadius: 6, padding: '9px 8px 8px', textAlign: 'center', boxShadow: '3px 3px 0 #000a', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, position: 'relative' }}>
        <small style={{ font: '600 7.5px Oswald,sans-serif', letterSpacing: '.08em' }}>CONTRATO MASTER</small>
        <img src={m.logo} alt="" style={{ height: 26, width: '70%', objectFit: 'contain' }} />
        <div style={{ font: '700 15px/1.05 Oswald,sans-serif' }}>{m.nome}</div>
        <div style={{ font: '700 11px Oswald,sans-serif', background: INK, color: GOLD, borderRadius: 5, padding: '1px 7px', marginTop: 1 }}>{m.anos} TEMPORADA{m.anos > 1 ? 'S' : ''}</div>
        <div style={{ font: '700 24px/1 Oswald,sans-serif', marginTop: 4 }}>{total} 🪙</div>
        <div style={{ font: '600 9.5px Arial,sans-serif', opacity: .75 }}>no total</div>
        <div style={{ font: '700 12px Oswald,sans-serif', color: GREEN, marginTop: 2 }}>= +{porTemp} por temporada</div>
        <div style={{ alignSelf: 'stretch', borderTop: '1px solid #897b5d', marginTop: 5, paddingTop: 3, font: `500 8px Arial,sans-serif`, color: '#62573f' }}>{on ? 'toque em ASSINAR embaixo' : 'toque pra escolher'}</div>
      </div>
    )
  }
  return (
    <section className="ll29-sponsor ll36-sponsor" aria-label="Patrocinador Master">
      <header><small>VÁRZEA · TEMPORADA 1 (a primeira vez) — ou quando um contrato acaba</small><h2>PATROCINADOR MASTER</h2><p>Quatro contratos na mesa — cada um com o seu prazo. Escolha um.</p></header>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 14px 12px' }}>
        {MASTER_MARCAS.map(m => <Papel key={m.anos} m={m} />)}
      </div>
      <div className="ll36-office"><article className="ll36-paper">
        <img className="ll35-contract-logo" src={esc.logo} alt="" />
        <h3>{esc.nome}</h3>
        <p>{esc.anos} temporadas · {mval(div, esc.anos) * esc.anos} no total · {divNome}</p>
        <strong>+{mval(div, esc.anos)}/TEMPORADA</strong>
        <span className="ll35-signature">Assinatura do presidente</span>
      </article></div>
      <div className="ll29-sponsor-bottom">
        <p><b>{mval(div, esc.anos) * esc.anos} moedas em {esc.anos} temporadas = +{mval(div, esc.anos)} por temporada</b>, garantidas. O valor trava na {divNome}, onde você assinou: subiu ou caiu, continua igual até a {esc.anos}ª temporada. Depois o contrato acaba e chegam contratos novos, já na divisão em que você estiver.</p>
        <button>ASSINAR · {esc.nome.toUpperCase()} · {esc.anos} TEMPORADAS</button>
        <small>Começa já na Várzea, na 1ª temporada. Depois só volta quando um contrato termina — com os valores da divisão em que você estiver (cada divisão paga o dobro da de baixo).</small>
      </div>
    </section>
  )
}
function PontualHoje({ compacto }: { compacto?: boolean }) {
  return (
    <section className="ll29-sponsor ll36-sponsor" aria-label="Patrocinador Pontual" style={compacto ? { marginTop: 0 } : undefined}>
      <header><small>SÉRIE C · SÓ ESTA TEMPORADA</small><h2>PATROCINADOR PONTUAL</h2><p>A aposta de sempre: onde você quer chegar nesta temporada?</p></header>
      <div className="ll29-sponsor-tabs"><button aria-pressed>Não cair de divisão</button><button>Acesso (top 4)</button><button>Campeão (liga ou copa)</button></div>
      <nav className="ll30-proposals"><button aria-pressed>PROPOSTA 1</button><button>PROPOSTA 2</button><button>PROPOSTA 3</button></nav>
      <div className="ll36-office"><article className="ll36-paper">
        <small className="ll35-contract-heading">CONTRATO PONTUAL</small>
        <h3>Padaria do Zé</h3><p>Não cair de divisão</p><strong>+8 MOEDAS</strong>
        <span className="ll35-signature">Assinatura do presidente</span>
      </article></div>
      <div className="ll29-sponsor-bottom">
        <p>Aposta segura: termine fora da zona de rebaixamento. O prêmio depende da meta.</p>
        <button>ASSINAR CONTRATO</button>
      </div>
    </section>
  )
}
function MasterAbaClube() {
  const linhas: [string, string][] = [['V', '🌱 Várzea'], ['D', 'Série D'], ['C', 'Série C'], ['B', 'Série B'], ['A', 'Série A']]
  return (
    <section className="ll32-sponsor-overview ll36-sponsor">
      <header><small>SÉRIE C</small><h2>PATROCÍNIO DO CLUBE</h2></header>
      <div style={{ padding: '10px 14px 0' }}><MasterFaixaMock div="C" anos={5} ano={2} nome="Vadico Veículos" logo={VADICO_LOGO} /></div>
      <div className="ll32-contract-scene"><article>
        <small>CONTRATO PONTUAL DA TEMPORADA</small>
        <h3>Max Joias</h3><p>Não cair de divisão</p><strong>+8 MOEDAS</strong>
        <span className="ll35-signature">CONTRATO ASSINADO</span>
      </article></div>
      <div style={{ padding: '4px 14px 14px' }}>
        <div style={{ background: '#f4ecd6', color: INK, border: `3px solid ${INK}`, borderRadius: 14, padding: '10px 12px' }}>
          <div style={{ font: '700 13px Oswald,sans-serif', marginBottom: 6 }}>🏆 MASTER · TOTAL DO CONTRATO (e por temporada)</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', font: '700 12px Arial,sans-serif' }}>
            <thead><tr><td /> {MASTER_MARCAS.map(m => <td key={m.anos} style={{ textAlign: 'center', font: '600 9.5px/1.15 Oswald,sans-serif', opacity: .7, padding: '0 2px' }}>{m.nome.split(' ')[0].toUpperCase()}<br />{m.anos} TEMP{m.anos > 1 ? 'S' : ''}</td>)}</tr></thead>
            <tbody>{linhas.map(([d, n]) => <tr key={d} style={{ borderTop: '1.5px solid rgba(0,0,0,.12)' }}><td style={{ font: '700 12px Oswald,sans-serif', padding: '4px 4px' }}>{n}</td>{MASTER_MARCAS.map(m => <td key={m.anos} style={{ textAlign: 'center', padding: '3px 2px', color: m.anos === 5 ? '#7C3AED' : INK, lineHeight: 1.1 }}>{mval(d, m.anos) * m.anos}<br /><span style={{ font: '600 9px Arial,sans-serif', opacity: .65 }}>{mval(d, m.anos)}/temp</span></td>)}</tr>)}</tbody>
          </table>
          <div style={{ font: '12px/1.45 Arial,sans-serif', marginTop: 8, opacity: .8 }}>Total do contrato, na divisão onde assinou; por temporada é só dividir. <b>Max Joias</b> (1 temp) paga o mesmo que a aposta 🛡️ não cair; cada temporada a mais soma <b>metade</b> disso por temporada; <b>Vadico</b> (5 temps) é quem dá mais grana no total e por temporada.</div>
        </div>
      </div>
      <p className="ll32-contract-note">O Pontual continua igual: 2/4/6 · 4/8/12 · 8/16/24 · 16/32/48 · 32/64/96, mesma fidelidade, mesmas 9 marcas.</p>
    </section>
  )
}
function MasterMockup() {
  const col = (rot: string, nota: string, children: React.ReactNode) => (
    <div style={{ width: 430 }}>
      <div style={{ font: '700 17px Oswald,sans-serif', textTransform: 'uppercase', letterSpacing: '.05em' }}>{rot}</div>
      <div style={{ font: '600 12px/1.4 system-ui', opacity: .6, minHeight: 52, margin: '4px 0 10px' }}>{nota}</div>
      {children}
    </div>
  )
  return (
    <div style={{ background: '#F4ECD6', minHeight: '100vh', padding: 24, color: INK }}>
      <div style={{ font: '700 30px Oswald,sans-serif', marginBottom: 4 }}>🏆 PATROCINADOR MASTER — na cena real do escritório</div>
      <div style={{ font: '600 13px/1.5 system-ui', opacity: .7, maxWidth: 1000, marginBottom: 22 }}>Só as 4 marcas reais, cada uma com o seu prazo: <b>Max Joias 1</b> · <b>Rei das Tintas 2</b> · <b>ERO 3</b> · <b>Vadico Veículos 5</b> temporadas. Quanto mais longo, mais paga por temporada — Vadico é quem dá mais grana e por mais tempo. O valor trava na divisão onde assinou; nova proposta só quando acabar, na divisão de então.</div>
      <div style={{ display: 'flex', gap: 26, alignItems: 'flex-start' }}>
        {col('① Temporada 1, na Várzea (e toda vez que um contrato acaba)', 'Os 4 contratos ABERTOS de uma vez: marca, prazo, TOTAL e o que dá por temporada (total ÷ temporadas). Toca num, ele vai pra mesa, assina. Embaixo, o Pontual de sempre.', <><MasterProposta /><PontualHoje /></>)}
        {col('② O dia a dia (contrato correndo)', 'Contrato rolando: o Master é só uma FAIXA em cima — quanto paga, temporada 2 de 5, quanto falta. Nada pra decidir. Quando a 5ª acabar, o contrato termina e voltam os 4 contratos, já na divisão em que você estiver.', <><MasterFaixaMock div="C" anos={5} ano={2} nome="Vadico Veículos" logo={VADICO_LOGO} /><PontualHoje compacto /></>)}
        {col('③ Clube › Patrocínio', 'A faixa do Master, o papel do Pontual assinado e a régua completa de valores — no mesmo quadro que já existe.', <MasterAbaClube />)}
      </div>
      <div style={{ display: 'flex', gap: 26, marginTop: 26, maxWidth: 1340 }}>
        {[['💰 A régua (TOTAL do contrato, na divisão da assinatura)', 'Série C: Max Joias 8 (1 temp → 8/temp) · Rei das Tintas 24 (2 temps → 12/temp) · ERO 48 (3 temps → 16/temp) · Vadico 120 (5 temps → 24/temp). Dobra a cada divisão: na Várzea a Vadico dá 30 no total (6/temp); na Série A, 480 (96/temp). Por temporada: Max = a aposta "não cair"; cada temporada a mais soma metade disso.'],
          ['🔒 O que trava', 'Valor congela na divisão da assinatura — subiu ou caiu, continua igual até acabar. Contrato rolando = aguarda; a proposta nova só chega no começo da temporada em que o contrato terminou, já na divisão de então. Sem rescisão.'],
          ['🧩 O que eu assumi', 'A ordem 1·2·3·5 segue o nível que cada marca já tem hoje no Pontual (Max Joias nível 1, Rei das Tintas 2, ERO e Vadico 3) — se quiser outra ordem, é só trocar. E o Master SOMA com o Pontual: o Master é o salário garantido, o Pontual continua sendo a aposta da temporada.']].map(([t, x]) => (
          <div key={t} style={{ flex: 1, background: '#FFF6D6', border: `3px solid ${INK}`, borderRadius: 14, boxShadow: `4px 4px 0 ${INK}`, padding: '12px 14px' }}>
            <div style={{ font: '700 14px Oswald,sans-serif', marginBottom: 4 }}>{t}</div>
            <div style={{ font: '600 12px/1.5 system-ui' }}>{x}</div>
          </div>
        ))}
      </div>
      <div style={{ font: '600 12px system-ui', opacity: .55, marginTop: 18 }}>Nada disto está no jogo — é só o desenho, na bancada, pro seu OK. ⚽ Leilão Legends</div>
    </div>
  )
}


// ─── 🏆 o MASTER real, nas duas versões ──────────────────────────────────────
function MasterReal() {
  const [c1, setC1] = useState<{ brandId: string; anos: number; div: string; desde: number; porTemporada: number } | undefined>()
  const [c2, setC2] = useState<{ brandId: string; anos: number; div: string; desde: number; porTemporada: number } | undefined>()
  const assina = (set: typeof setC1) => (brandId: string) => {
    const anos = brandId === 'vadico' ? 5 : brandId === 'ero' ? 3 : brandId === 'reidastintas' ? 2 : 1
    const base = { V: 2, D: 4, C: 8, B: 16, A: 32 }.V
    set({ brandId, anos, div: 'V', desde: 1, porTemporada: Math.round(base * (1 + (anos - 1) / 2)) })
  }
  const correndo = { brandId: 'vadico', anos: 5, div: 'V', desde: 1, porTemporada: 6 }
  const col = (rot: string, children: React.ReactNode) => (
    <div style={{ width: 430 }}><div style={{ font: '700 16px Oswald,sans-serif', textTransform: 'uppercase', margin: '0 0 8px' }}>{rot}</div>{children}</div>
  )
  return (
    <div style={{ background: '#F4ECD6', minHeight: '100vh', padding: 20, color: INK }}>
      <div style={{ font: '700 26px Oswald,sans-serif', marginBottom: 14 }}>🏆 PATROCINADOR MASTER — componentes REAIS do jogo (clique num papel pra ver a assinatura)</div>
      <div style={{ display: 'flex', gap: 22, alignItems: 'flex-start' }}>
        {col('① Caixinha (todo mundo) · T1 Várzea', <>
          <MasterBanner div="V" seasonNo={1} contrato={c1} onPick={assina(setC1)} />
          <SponsorBetBanner div="V" onPick={() => {}} />
        </>)}
        {col('② Escritório (prévia) · T1 Várzea', <>
          <MasterBanner cinematic div="V" seasonNo={1} contrato={c2} onPick={assina(setC2)} />
        </>)}
        {col('③ Contrato correndo · T3 (Série D) + régua', <>
          <MasterFaixa contrato={correndo} seasonNo={3} />
          <MasterRegua div="D" />
        </>)}
      </div>
    </div>
  )
}


// ─── 🎬 a cena do vídeo (celular, componentes reais) ─────────────────────────
function VideoMaster() {
  const [c, setC] = useState<{ brandId: string; anos: number; div: string; desde: number; porTemporada: number } | undefined>()
  const assina = (brandId: string) => {
    const anos = brandId === 'vadico' ? 5 : brandId === 'ero' ? 3 : brandId === 'reidastintas' ? 2 : 1
    setC({ brandId, anos, div: 'V', desde: 1, porTemporada: Math.round(2 * (1.25 + (anos - 1) / 2)) })
  }
  return (
    <div style={{ background: '#F4ECD6', minHeight: '100vh', padding: '0 0 40px', color: INK }}>
      <div style={{ background: INK, color: '#fff', padding: '12px 14px 10px' }}>
        <div style={{ font: '600 10px Oswald,sans-serif', letterSpacing: '.08em', color: GOLD }}>TEMPORADA 1 · LIGA LEGENDS</div>
        <div style={{ font: '700 22px Oswald,sans-serif', lineHeight: 1.1 }}>Começando…</div>
        <div style={{ font: '700 11px system-ui', opacity: .65 }}>🌱 Várzea</div>
      </div>
      <div style={{ padding: '12px 12px 0' }}>
        <div style={{ background: GOLD, border: `3px solid ${INK}`, borderRadius: 12, boxShadow: `3px 3px 0 ${INK}`, padding: '8px 12px', marginBottom: 12, font: '700 13px Oswald,sans-serif', letterSpacing: '.03em' }}>🆕 NOVO: PATROCINADOR MASTER — contrato de várias temporadas</div>
        <MasterBanner cinematic div="V" seasonNo={1} contrato={c} onPick={assina} />
        <CareerSponsorVisual div="V" onPick={() => {}} />
        <div style={{ font: '700 14px Oswald,sans-serif', textAlign: 'center', marginTop: 14, opacity: .7 }}>⚽ Leilão Legends · leilaolegends.com</div>
      </div>
      <div id="cursor" style={{ position: 'fixed', left: -100, top: -100, width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,196,0,.55)', border: `3px solid ${INK}`, pointerEvents: 'none', zIndex: 9999, transform: 'translate(-50%,-50%)', transition: 'transform .08s' }} />
    </div>
  )
}
if (new URLSearchParams(location.search).has('video')) {
  window.addEventListener('mousemove', e => { const el = document.getElementById('cursor'); if (el) { el.style.left = e.clientX + 'px'; el.style.top = e.clientY + 'px' } })
  window.addEventListener('mousedown', () => { const el = document.getElementById('cursor'); if (el) el.style.transform = 'translate(-50%,-50%) scale(.7)' })
  window.addEventListener('mouseup', () => { const el = document.getElementById('cursor'); if (el) el.style.transform = 'translate(-50%,-50%) scale(1)' })
}

createRoot(document.getElementById('root')!).render(
  <EscProvider>
    {q.has('video')
      ? <VideoMaster />
      : q.has('masterreal')
      ? <MasterReal />
      : q.has('master')
      ? <MasterMockup />
      : q.has('patrocinio')
      ? <div style={{ background: '#F4ECD6', minHeight: '100vh', padding: 14 }}>
          <div style={{ maxWidth: 430, margin: '0 auto' }}>
            <CareerSponsorVisual div="C" chosen={q.has('assinado') ? { tier: 1, brandId: 'maxjoias' } : undefined} onPick={() => {}} fielBrandId="maxjoias" />
            <div style={{ height: 18 }} />
            <CareerSponsorOverview div="C" chosen={{ tier: 1, brandId: 'maxjoias' }} />
          </div>
        </div>
      : q.has('agencia')
      ? <div style={{ background: '#F4ECD6', minHeight: '100vh', padding: 14 }}>
          <div style={{ maxWidth: 430, margin: '0 auto' }}>
            <AgenciadosTab cards={CARDS} pool={CARDS} hist={{}} fatura={undefined}
              st={estadio} hasFilial={false} primeiroClube="Neymarzetti" onSet={() => {}} />
          </div>
        </div>
      : <Salao />}
  </EscProvider>,
)
