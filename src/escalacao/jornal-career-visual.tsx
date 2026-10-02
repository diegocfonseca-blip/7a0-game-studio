import { Escudo } from './escudos'
import { SeloClube } from './selo-clube'
import { FotoJornal } from './jornal-manto' // 🎽 a foto sai com o manto do campeão, quando ele é batismo
import './jornal-online-visual.css'

import worldArt from './img/online-jornal-v20.webp' // 🌍 foto NEUTRA (silhuetas com a taça) — não existe arte própria da Copa do Mundo
import { tr } from './lang'
import { bandeiraDe as bandeira } from './copa-mundo'

/** Mesma direção de arte do online, com vencedores reais da carreira.
 *  📰 26/09 (Diego, mockup aprovado: *"sim"*): a capa passa a ser dos TÍTULOS GRANDES
 *  do ano, não da série de quem joga. Toda temporada a foto grande é o campeão da
 *  SÉRIE A, e embaixo vêm Copa do Brasil e Supercopa. Ano de Copa do Mundo, a foto
 *  grande é a seleção campeã do mundo e o resto desce pros quadros menores. */
export function CareerNewspaperStories({ serieA, cup, cupBrasil, superCup, mundial, internacional }: {
  serieA?: string; cup?: string; cupBrasil?: boolean; superCup?: { name: string; vs: string } | null
  mundial?: { selecao: string; campeao: string } | null
  /** 🌎🌍🌐 campeões da Libertadores, da Champions e do Mundial de Clubes (Diego 02/10:
   *  *"no jornal também tem que ter destaque dos campeões da Libertadores, Champions e Mundial"*).
   *  `voce` = o clube que o usuário representou (aparece com o nome e o escudo DELE). */
  internacional?: { liberta: string; champions: string; mundial: string; representado: string | null; voce: string } | null
}) {
  const lado = (tag: string, titulo: string, qual: 'liga' | 'copa', clube: string, legenda: string, crest?: React.ReactNode) => (
    <figure key={tag}><h3><small style={{ display: 'block', font: '700 10px Oswald,sans-serif', letterSpacing: 1, color: '#6c604a' }}>{tag}</small>{titulo}</h3>
      <div className="jv-photo"><FotoJornal qual={qual} clube={clube} alt="" /><span className="jv-crest">{crest ?? <Escudo nome={clube} size={40}/>}</span></div>
      <figcaption>{legenda}</figcaption></figure>
  )
  // 🌎 clube de verdade (Flamengo, Real Madrid…) usa o escudo oficial; o que o usuário
  // representou aparece como o clube DELE, com o escudo dele
  const intl = (tag: string, titulo: string, inst: string) => {
    // 🧢 O CONVITE (02/10): o campeão aparece como o clube que é (Flamengo, escudo do
    // Flamengo); se foi você no banco, a legenda diz "técnico: <seu clube>"
    const voce = !!internacional && inst === internacional.representado
    return lado(tag, titulo, 'copa', inst, voce ? `${inst} · ${tr('técnico', 'coach')}: ${internacional!.voce}` : inst, <SeloClube clube={inst} size={40}/>)
  }
  const copaTag = cupBrasil ? tr('🇧🇷 COPA DO BRASIL', '🇧🇷 BRAZILIAN CUP') : tr('🏆 COPA LEGENDS', '🏆 LEGENDS CUP')
  const lados = [
    ...(mundial && serieA ? [lado(tr('🏆 SÉRIE A', '🏆 SERIE A'), tr('Campeão', 'Champion'), 'liga', serieA, serieA)] : []),
    ...(cup ? [lado(copaTag, tr('O dono da Copa', 'Cup winner'), 'copa', cup, cup)] : []),
    ...(superCup ? [lado(tr('👑 SUPERCOPA', '👑 SUPER CUP'), tr('Rei da Supercopa', 'Super Cup king'), 'copa', superCup.name, `${superCup.name} · ${tr('contra o', 'against')} ${superCup.vs}`)] : []),
    ...(internacional ? [
      intl(tr('🌐 MUNDIAL DE CLUBES', '🌐 CLUB WORLD CUP'), tr('Campeão do mundo', 'World champion'), internacional.mundial),
      intl(tr('🌎 LIBERTADORES', '🌎 LIBERTADORES'), tr('Rei da América', 'King of the Americas'), internacional.liberta),
      intl(tr('🌍 CHAMPIONS LEAGUE', '🌍 CHAMPIONS LEAGUE'), tr('Rei da Europa', 'King of Europe'), internacional.champions),
    ] : []),
  ]
  return <section className="jv-stories ll34-career-stories" aria-label="Destaques da temporada">
    {mundial ? <figure className="jv-main-story">
      <div className="jv-photo"><img src={worldArt} alt={tr('Ilustração neutra da taça sendo erguida', 'Neutral illustration of the trophy being lifted')}/><span className="jv-crest" style={{ fontSize: 40, lineHeight: 1 }}>{bandeira(mundial.selecao)}</span></div>
      <figcaption><small>{tr('🌍 COPA DO MUNDO LEGENDS · CAMPEÃ', '🌍 LEGENDS WORLD CUP · CHAMPIONS')}</small><h3>{mundial.selecao}</h3><p>{tr('técnico', 'coach')}: {mundial.campeao}</p></figcaption>
    </figure> : serieA ? <figure className="jv-main-story">
      <div className="jv-photo"><FotoJornal qual="liga" clube={serieA} alt="Ilustração de comemoração do título"/><span className="jv-crest"><Escudo nome={serieA} size={52}/></span></div>
      <figcaption><small>{tr('🏆 CAMPEÃO · SÉRIE A', '🏆 CHAMPIONS · SERIE A')}</small><h3>{serieA}</h3></figcaption>
    </figure> : null}
    {lados.length > 0 && <div className="jv-side-stories">{lados}</div>}
  </section>
}
