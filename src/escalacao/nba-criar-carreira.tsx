// 🏀 NOVA CARREIRA DO BASQUETE (10/11, Diego: *"seguir novos padrões… tudo igual do futebol pro basquete"*). É a MESMA
// moldura passo a passo da carreira nova do futebol (`CareerSetupFrame`, career-setup-guide.tsx), só com as etapas que
// existem no basquete: 1 · Seu time (nome + o quinteto) → 2 · A liga (Street League → G League → NBA, com as crews rivais).
// Não tem presidente nem rivais de batismo: a carreira do basquete não tem presidência e a Street League é sempre a mesma.
// Só monta a tela — quem começa a carreira é o `START_NBA_CAREER` de sempre (chamado por quem abre esta tela).
import { useState } from 'react'
import { useT } from './lang'
import { CareerSetupFrame } from './career-setup-guide'
import { IdentidadeNaSala } from './presidencia-identidade-visual'
import { identidadeDaConta } from './presidencia-identidade-conta'
import { useMeuSocio } from './manto'
import { APOIO_PERKS, myApoioPerk } from './apoio'
import { POS_LABELS } from './sportcfg'
import { SECTORS } from './types'
import { NBA_STREET_TEAMS } from './store'

export function NbaCriarCarreira({ nome, onNome, erro, checando, onComecar, onVoltar, avisoAparelho }: {
  nome: string; onNome: (v: string) => void; erro?: string; checando?: boolean
  onComecar: () => void; onVoltar: () => void; avisoAparelho?: string
}) {
  const t = useT()
  const [passo, setPasso] = useState<1 | 2>(1)
  const [semNome, setSemNome] = useState('')
  const socio = useMeuSocio()
  const identidade = identidadeDaConta(nome, socio, myApoioPerk()?.solid ?? APOIO_PERKS.bege.solid)
  const proximo = () => { if (!nome.trim()) { setSemNome(t('Digite o nome do time.', 'Type the team name.')); return } setSemNome(''); setPasso(2) }
  const crews = NBA_STREET_TEAMS.map(c => c.team)
  return (
    <div className="palco cse-shell" style={{ position: 'fixed', inset: 0, zIndex: 99998, overflowY: 'auto' }}>
      <div className="ll-shell-content" style={{ margin: "0 auto" }}>
        <CareerSetupFrame step={passo} club={nome} onBack={() => passo === 1 ? onVoltar() : setPasso(1)}
          etapas={[t('Seu time', 'Your team'), t('A liga', 'The league')]} topo={t('NOVA CARREIRA · STREET LEAGUE', 'NEW CAREER · STREET LEAGUE')}
          marca={{ nome: 'BIDLEGENDS', frase: t('O SEU QUINTETO COMEÇA NO LANCE.', 'YOUR FIVE STARTS WITH A BID.'), sigla: 'BL' }}>
          {passo === 1 ? (
            <section className="pc-create cse-club" aria-labelledby="nba-cc-time">
              <header className="cse-intro"><small>{t('A SUA HISTÓRIA COMEÇA AQUI', 'YOUR STORY STARTS HERE')}</small><h1 id="nba-cc-time">{t('Primeiro, o seu time.', 'First, your team.')}</h1><p>{t('Dê um nome ao time que vai sair da Street League e chegar na NBA.', 'Name the team that will rise from the Street League to the NBA.')}</p></header>
              <div className="cse-club-grid">
                <div className="cse-club-identity"><small>{t('SUA IDENTIDADE', 'YOUR IDENTITY')}</small><div className="pc-identity" data-identity="account"><IdentidadeNaSala identity={identidade} frame desk /></div><h2>{nome || t('Seu time', 'Your team')}</h2><p>{identidade.crest ? t('Seu escudo, manto e mascote acompanham sua conta.', 'Your crest, kit and mascot stay with your account.') : t('O jogo cria seu escudo e sua camisa básica. Você pode começar sem comprar um plano.', 'The game creates your crest and basic shirt. You can start without buying a plan.')}</p></div>
                <form className="cse-paper" onSubmit={e => { e.preventDefault(); proximo() }}>
                  <label htmlFor="nba-cc-nome">{t('Nome do time', 'Team name')}</label>
                  <input id="nba-cc-nome" maxLength={24} value={nome} onChange={e => { onNome(e.target.value); setSemNome('') }} placeholder={t('Ex.: Garrafão do Zé', 'E.g.: Downtown Bricklayers')} autoComplete="off" />
                  <h2 style={{ marginTop: 18 }}>{t('Seu quinteto', 'Your starting five')}</h2>
                  <div className="nba-cc-quinteto" role="list">{SECTORS.map(p => <span role="listitem" key={p}>{POS_LABELS.basquete[p].tag}<small>{t(POS_LABELS.basquete[p].singular.pt, POS_LABELS.basquete[p].singular.en)}</small></span>)}</div>
                  <p className="cse-note">{t('No leilão você monta um jogador de cada posição. Basquete não tem formação: o quinteto é sempre esse.', 'At the auction you sign one player per position. Basketball has no formation: the five is always this.')}</p>
                  {(semNome || erro) && <p role="alert" className="cse-error">{semNome || erro}</p>}
                  <button type="submit" className="csg-primary">{t('Continuar para a liga →', 'Continue to the league →')}</button>
                </form>
              </div>
            </section>
          ) : (
            <section className="cse-rivals" aria-labelledby="nba-cc-liga">
              <header className="cse-intro"><small>{t('ONDE VOCÊ VAI JOGAR', 'WHERE YOU WILL PLAY')}</small><h1 id="nba-cc-liga">{t('Da rua até o anel.', 'From the street to the ring.')}</h1><p>{t('Todo time começa na Street League. Indo bem, sobe de andar até a NBA.', 'Every team starts in the Street League. Do well and climb all the way to the NBA.')}</p></header>
              <div className="cse-paper">
                <div className="nba-cc-andares">
                  <div className="nba-cc-andar" style={{ borderLeftColor: '#1E7A3D' }}><div><b>🛝 STREET LEAGUE</b><p>{t('20 times, pontos corridos. É aqui que tudo começa.', '20 teams, round robin. This is where it all starts.')}</p></div><span className="nba-cc-aqui">{t('VOCÊ COMEÇA AQUI', 'YOU START HERE')}</span></div>
                  <div className="nba-cc-andar" style={{ borderLeftColor: '#8C97A3' }}><div><b>🔷 G LEAGUE</b><p>{t('O andar do meio: os melhores vão aos playoffs.', 'The middle tier: the best go to the playoffs.')}</p></div></div>
                  <div className="nba-cc-andar" style={{ borderLeftColor: '#E7A21F' }}><div><b>💍 NBA</b><p>{t('Playoffs por conferência e a briga pelo anel.', 'Conference playoffs and the fight for the ring.')}</p></div></div>
                </div>
                <h2>{t('Seus rivais na Street League', 'Your Street League rivals')}</h2>
                <p>{t('As crews da rua, controladas pelo jogo. Elas disputam o leilão com você.', 'The street crews, controlled by the game. They bid against you at the auction.')}</p>
                <div className="nba-cc-crews">{crews.map(c => <span key={c}>{c}</span>)}</div>
                {avisoAparelho && <p role="alert" className="cse-error">{avisoAparelho}</p>}
                {erro && <p role="alert" className="cse-error">{erro}</p>}
                <button type="button" className="csg-primary" disabled={checando} onClick={onComecar}>{checando ? t('Conferindo o nome…', 'Checking the name…') : t('🏀 Começar carreira', '🏀 Start career')}</button>
                <p className="cse-footnote">{t('Começar uma nova NÃO apaga as outras carreiras.', 'Starting a new one does NOT delete your other careers.')}</p>
              </div>
            </section>
          )}
        </CareerSetupFrame>
      </div>
    </div>
  )
}
