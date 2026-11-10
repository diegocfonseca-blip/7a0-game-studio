// 🗺️ GUIA DA CARREIRA — banner de desbloqueio explicado (Diego 13/08): explica
// a mecânica na hora em que ela passa a valer, com os números REAIS do jogo.
// Fecha com "Entendi!" (MARK_CAREER_SEEN) e NUNCA MAIS aparece nesta carreira
// (`state.careerSeen`, zera só na fundação de carreira nova). Cada chamada usa
// uma chave `k` própria — banners são independentes entre si.
//
// Módulo À PARTE (não mora em pyramidseason.tsx nem estadio.tsx) só pra dar pra
// usar dos dois lados sem import circular — estadio.tsx é importado por
// pyramidseason.tsx, então não pode importar de volta.
import { useEsc } from './store'
import {useCareerVisualV2} from './career-visual-v2'
import {useT} from './lang'

const INK = '#0C0C0C'
const GOLD = '#FFC400'
const OSWALD = { fontFamily: "'Oswald','Arial Narrow',system-ui,sans-serif" } as const

export function UnlockBanner({ k, tag, tagBg = GOLD, title, ctaBg = GOLD, ctaColor = INK, children }: {
  k: string; tag: string; tagBg?: string; title: string; ctaBg?: string; ctaColor?: string; children: React.ReactNode
}) {
  const { state, dispatch } = useEsc()
  const visual=useCareerVisualV2(),t=useT()
  if (state.careerSeen?.[k]) return null
  const summaries:Record<string,string>={
    condicao:t('Titulares gastam gás. Descansar no banco recupera. Veja a barra de cada jogador no Elenco; o cansaço continua entre temporadas.','Starters use energy. Resting on the bench restores it. Check each player’s bar in Squad; fatigue carries between seasons.'),
    sub:t('Você já pode alternar titulares e reservas. No Elenco, toque no jogador que sai e no que entra.','You can now rotate starters and substitutes. In Squad, tap the outgoing player, then the incoming player.'),
    salario:t('Seu elenco agora tem uma folha salarial. Consulte Finanças para entender os valores e planejar as próximas contratações.','Your squad now has a payroll. Check Finances to understand the amounts and plan your next signings.'),
    profissional:t('Seu clube avançou. Este leilão serve para reforçar o elenco e montar o banco; os titulares que continuam no clube não precisam ser comprados de novo.','Your club has progressed. This auction strengthens the squad and builds the bench; retained starters do not need to be bought again.'),
    agenciados:t('Você pode administrar jogadores do seu álbum na Agência. Confira as categorias e as condições disponíveis antes de contratar.','You can manage album players in the Agency. Check the available categories and terms before signing.'),
    criabase:t('Se faltar uma opção no banco, a base pode ajudar. Confira a posição e o efeito da escolha antes de promover o jogador.','If your bench is missing an option, the academy can help. Check the position and effect before promoting a player.'),
  }
  const summary=visual?summaries[k]:undefined
  return (
    <div className={visual?'csg-unlock-banner':undefined} data-unlock={k} style={{ background: '#fff', color:INK, border: `3px solid ${INK}`, borderRadius: 16, boxShadow: `4px 4px 0 0 ${INK}`, padding: 16, marginBottom: 10 }}>
      <span style={{ display: 'inline-flex', ...OSWALD, fontWeight: 800, fontSize: 10.5, letterSpacing: .5, textTransform: 'uppercase', color: INK, background: tagBg, border: `2px solid ${INK}`, borderRadius: 999, padding: '3px 10px', marginBottom: 10 }}>{tag}</span>
      <p style={{ ...OSWALD, fontWeight: 900, fontSize: 17, textTransform: 'uppercase', margin: '0 0 8px', lineHeight: 1.05 }}>{title}</p>
      <div style={{ fontSize: 12.5, color: '#3a3527', fontWeight: 600, lineHeight: 1.6 }}>{summary?<><p style={{margin:'0 0 10px'}}>{summary}</p><details><summary style={{cursor:'pointer',minHeight:44,display:'list-item',padding:'10px 0',fontWeight:700}}>{t('Entender em detalhes','See the details')}</summary>{children}</details></>:children}</div>
      <button onClick={() => dispatch({ type: 'MARK_CAREER_SEEN', key: k })} style={{ marginTop: 12, ...OSWALD, fontWeight: 800, fontSize: 12.5, textTransform: 'uppercase', color: ctaColor, background: ctaBg, border: `2px solid ${INK}`, borderRadius: 9, padding: '8px 16px', boxShadow: `2.5px 2.5px 0 0 ${INK}`, cursor: 'pointer' }}>{t('Entendi!','Got it!')}</button>
    </div>
  )
}
