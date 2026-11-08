import { createContext, useContext, useId, useRef, useState, type ReactNode } from 'react'
import { tr } from './lang'
import { LojaButton } from './loja-clube'
import { abreAmigosSolto } from './amigos'
import './online-lobby-layout.css'

/** Presentation only: navigation is supplied by the existing lobby. */
export function OnlineLobbyBrand({ onBack }: { onBack?: () => void }) {
  return <div className="ll-hub-brand-row">
    <button type="button" data-livre="1" className="ll-hub-brand" onClick={onBack} aria-label={tr('Voltar pra home', 'Back to home')}>
      <span className="ll-hub-monogram" aria-hidden="true">LL</span><span>LEILÃO LEGENDS<small>{tr('O SEU TIME COMEÇA NO LANCE.', 'YOUR TEAM STARTS WITH A BID.')}</small></span>
    </button>
    <nav className="ll-hub-links" aria-label={tr('Atalhos do Online', 'Online shortcuts')}>
      <span data-livre="1"><LojaButton>{tr('Loja do clube', 'Club shop')}</LojaButton></span>
      <button type="button" onClick={() => abreAmigosSolto()}>{tr('Amigos', 'Friends')}</button>
    </nav>
  </div>
}

export function OnlineLobbyReturn({ onBack }: { onBack: () => void }) {
  return <nav className="ll-hub-return" aria-label={tr('Menu inicial e outros modos', 'Main menu and other modes')}>
    <button type="button" data-livre="1" onClick={onBack}>← {tr('INÍCIO', 'HOME')}</button>
    <p>{tr('Carreira, Partida Rápida e outros modos ficam no Início.', 'Find Career, Quick Match and other modes on Home.')}</p>
  </nav>
}

export function OnlineLobbyTools({ children }: { children: ReactNode }) {
  return <details className="ll-hub-tools"><summary><span>{tr('TESTES E FERRAMENTAS', 'TESTS AND TOOLS')}<small>{tr('Carreira online e acessos de teste da conta', 'Online career and account test tools')}</small></span><span aria-hidden="true">⌄</span></summary><div className="ll-hub-tools-content">{children}</div></details>
}

type CommunityTab = 'campeoes' | 'ranking' | 'clas' | 'batismo'
const Community = createContext<{ enabled: boolean; active: CommunityTab }>({ enabled: false, active: 'ranking' })

export function OnlineCommunity({ enabled, clans, children }: { enabled: boolean; clans: boolean; children: ReactNode }) {
  const [active, setActive] = useState<CommunityTab>('ranking')
  const id = useId(), buttons = useRef<Partial<Record<CommunityTab, HTMLButtonElement | null>>>({})
  const tabs: { key: CommunityTab; label: string }[] = [
    { key: 'campeoes', label: tr('Campeões', 'Champions') }, { key: 'ranking', label: tr('Ranking', 'Ranking') },
    ...(clans ? [{ key: 'clas' as const, label: tr('Clãs', 'Clans') }] : []), { key: 'batismo', label: tr('Batismo', 'Named club') },
  ]
  const current = tabs.some(t => t.key === active) ? active : 'ranking'
  return <Community.Provider value={{ enabled, active: current }}>
    <div className={enabled ? 'll-hub-community' : 'space-y-3.5'} style={enabled ? undefined : { marginTop: 6 }}>
      {enabled && <><header className="ll-hub-community-heading"><small>{tr('A GALERA DO LEILÃO LEGENDS', 'THE LEILÃO LEGENDS COMMUNITY')}</small><h2>{tr('NA COMUNIDADE', 'IN THE COMMUNITY')}</h2><p>{tr('Quem venceu, quem lidera e quem joga junto.', 'Who won, who leads and who plays together.')}</p></header>
        <div role="tablist" aria-label={tr('Comunidade', 'Community')} className="ll-hub-community-tabs">
          {tabs.map((tab, i) => <button key={tab.key} ref={el => { buttons.current[tab.key] = el }} type="button" data-livre="1" role="tab"
            id={`${id}-${tab.key}`} aria-controls={`${id}-${tab.key}-panel`} aria-selected={current === tab.key} tabIndex={current === tab.key ? 0 : -1}
            onClick={() => setActive(tab.key)} onKeyDown={e => {
              if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return
              e.preventDefault()
              const next = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length
              setActive(tabs[next].key); buttons.current[tabs[next].key]?.focus()
            }}>{tab.label}</button>)}
        </div></>}
      <CommunityIds.Provider value={id}>{children}</CommunityIds.Provider>
    </div>
  </Community.Provider>
}

const CommunityIds = createContext('')
export function OnlineRoomMain({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  return enabled ? <div className="ll-hub-room-main space-y-3">{children}</div> : <>{children}</>
}

export function OnlineLeagueManage({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  return enabled ? <details className="ll-hub-league-manage"><summary aria-label={tr('Gerenciar sua liga', 'Manage your league')}>⋮</summary><div>{children}</div></details> : <>{children}</>
}

export function OnlineLobbyFooter({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  return enabled ? <div className="ll-hub-ending">
    <section className="ll-hub-store" data-livre="1" aria-label={tr('Loja do clube', 'Club shop')}>
      <span className="ll-hub-store-symbol" aria-hidden="true">🛍</span><div><small>{tr('O CLUBE COM A SUA CARA', 'MAKE THE CLUB YOUR OWN')}</small><h2>{tr('LOJA DO CLUBE', 'CLUB SHOP')}</h2><p>{tr('Planos, moedas e itens para o seu clube, em um só lugar.', 'Plans, coins and items for your club, all in one place.')}</p></div>
      <LojaButton className="ll-hub-store-button">{tr('ABRIR LOJA →', 'OPEN SHOP →')}</LojaButton>
    </section>
    <footer className="ll-hub-footer"><strong>LEILÃO LEGENDS</strong><div>{children}</div></footer>
  </div> : <>{children}</>
}

/** Hidden panels stay mounted: tabs do not re-fetch rankings or reset dialogs. */
export function OnlineCommunityPanel({ name, children }: { name: CommunityTab; children: ReactNode }) {
  const { enabled, active } = useContext(Community), id = useContext(CommunityIds)
  return enabled ? <section className={`ll-hub-community-panel ll-hub-panel-${name}`} id={`${id}-${name}-panel`} role="tabpanel"
    aria-labelledby={`${id}-${name}`} hidden={name !== active} tabIndex={0}>{children}</section> : <>{children}</>
}
