import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { useT } from './lang'
import { legendAvatar } from './legend-avatars'
import type { OnlineDestination } from './desktop-online-navigation'
import { isMuted, onSoundChange, toggleMuted, playCoin } from './sound'
import './home-v03.css'

type HomeProps = {
  onCareer: () => void; onCareers: () => void; onQuick: () => void
  onOnline: (destination: OnlineDestination) => void
  onAccount: () => void; onFriends?: () => void; onAlbum: () => void
  onHall: () => void; onManual: () => void
  shop: ReactNode; language: ReactNode; notifications?: ReactNode
  sportSwitcher?: ReactNode; resume?: ReactNode; notices?: ReactNode
  title: ReactNode; overlays: ReactNode
  /** 🏀 BidLegends: a MESMA home, só troca marca, arte e textos (as cartas e os modos são da NBA) */
  bb?: boolean
}

function HomeSound() {
  const [, refresh] = useState(0)
  useEffect(() => onSoundChange(() => refresh(n => n + 1)), [])
  const muted = isMuted()
  return <button type="button" className="hv3-sound" aria-label={muted ? 'Ligar som da home' : 'Desligar som da home'} aria-pressed={!muted}
    onClick={() => { toggleMuted(); if (!isMuted()) playCoin() }}>{muted ? '🔇' : '🔊'}</button>
}

function LegendsIcon() {
  return <span className="hv3-small-legends" aria-hidden="true">{[
    ['Ronaldinho Gaúcho', 'Barcelona', 2005], ['Ronaldo Fenômeno', 'Inter', 1998],
  ].map(([name, club, year]) => {
    const art = legendAvatar(String(name), String(club), Number(year))
    return art ? <span key={String(name)}><img src={`${import.meta.env.BASE_URL}${art.src.slice(1)}`} alt="" width={600} height={400} decoding="async" /></span> : null
  })}</span>
}

function VillageIcon() {
  return <span className="hv3-village-icon" aria-hidden="true"><svg viewBox="0 0 64 54" width="45" height="40" fill="none">
    <path d="M3 39 40 31 62 42 21 52 3 45Z" fill="#C98A51" stroke="#191E17" strokeWidth="2" strokeLinejoin="round" />
    <path d="m8 43 35-8m-18 13 28-7" stroke="#E3B77C" strokeWidth="2" />
    <path d="m14 40-1-24 27-5 1 23m-28-18 8 4 27-4-8-5m8 5 1 21m-28-17 1 22" stroke="#18271D" strokeWidth="2.3" strokeLinejoin="round" />
    <path d="m16 18 8 3 21-4m-29 8 8 3 21-4m-28 8 7 3 22-4m-22-11 1 21m6-23 1 20m6-21 1 19m6-19 1 18" stroke="#E0E6C5" strokeWidth="1.3" />
    <path d="m13 16 27-5 1 23M13 16l1 24" stroke="#F4ECD6" strokeWidth="3.5" strokeLinecap="round" />
    <path d="m4 37 2-6 3 4m43 8 3-6 3 4m-31 9 3-5 2 4" stroke="#507B3B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg></span>
}

// 🏀 no basquete o ícone da carreira é a cesta (no futebol é o campinho de terra)
function HoopIcon() {
  return <span className="hv3-village-icon" aria-hidden="true"><svg viewBox="0 0 64 54" width="45" height="40" fill="none">
    <rect x="14" y="4" width="36" height="24" rx="2" fill="#F4ECD6" stroke="#191E17" strokeWidth="2.3" />
    <rect x="25" y="12" width="14" height="10" stroke="#C2452F" strokeWidth="2" />
    <path d="M20 30h24" stroke="#E8503A" strokeWidth="3.5" strokeLinecap="round" />
    <path d="m21 31 4 15h14l4-15M27 31l2 15m8-15-2 15m-11-8h16" stroke="#F4ECD6" strokeWidth="1.5" />
    <circle cx="52" cy="44" r="8" fill="#E07B2C" stroke="#191E17" strokeWidth="2" /><path d="M44 44h16M52 36v16m-5-14a10 10 0 0 1 0 12m10-12a10 10 0 0 0 0 12" stroke="#191E17" strokeWidth="1.2" />
  </svg></span>
}

function ExtraIcon({ kind }: { kind: 'friends' | 'hall' }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">{kind === 'friends' ? <><circle cx="9" cy="7" r="3" /><path d="M3 20v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5v2" /></> : <path d="m3 7 9-4 9 4v3H3V7ZM5 10v10m7-10v10m7-10v10M2 21h20" />}</svg>
}

/** Approved home V03. Presentation and existing navigation only; no save or room rules. */
export function HomeV03(p: HomeProps) {
  const t = useT()
  const id = useId()
  const shortcuts = useRef<HTMLDivElement>(null)
  const howId = `${id}-how`, communityId = `${id}-community`
  const bb = !!p.bb
  return <><div className={bb ? 'll-home home-v03 hv3-bb' : 'll-home home-v03'}>
    <header className="hv3-top"><div className="hv3-wrap">
      <div className="hv3-brand"><span className="hv3-monogram" aria-hidden="true">{bb ? 'BL' : 'LL'}</span><span><strong>{bb ? 'BIDLEGENDS' : 'LEILÃO LEGENDS'}</strong><small>{bb ? t('SEU QUINTETO. SUA LENDA.', 'YOUR FIVE. YOUR LEGEND.') : t('SEU CLUBE. SUA HISTÓRIA.', 'YOUR CLUB. YOUR STORY.')}</small></span></div>
      <nav aria-label={t('Atalhos da home', 'Home shortcuts')}><a href={`#${howId}`}>{t('Como jogar', 'How to play')}</a><a href={`#${communityId}`}>{t('Comunidade', 'Community')}</a><a href={`#${communityId}`} onClick={e => { const button = shortcuts.current?.querySelector<HTMLButtonElement>('button.hv3-shop'); if (button) { e.preventDefault(); button.click() } }}>{t('Loja do clube', 'Club shop')}</a></nav>
      <div className="hv3-account"><div className="hv3-language">{p.language}</div><HomeSound /><button type="button" onClick={p.onAccount}>{t('MINHA CONTA', 'MY ACCOUNT')} <span aria-hidden="true">→</span></button></div>
    </div></header>
    {(p.sportSwitcher || p.notifications) && <div className="hv3-utilities hv3-wrap">{p.sportSwitcher}{p.notifications}</div>}
    <section className="hv3-hero"><div className="hv3-wrap"><div className="hv3-hero-copy"><div className="hv3-eyebrow">{t('O pregão está aberto', 'The auction is open')}</div>{p.title}<p>{bb ? t('Dispute lendas da NBA no leilão, monte seu quinteto e entre na briga pelo anel. Sozinho ou com a turma.', 'Bid for NBA legends, build your five and chase the ring. Solo or with friends.') : t('Dispute lendas no leilão, monte seu time e entre na briga pela taça. Sozinho ou com a turma.', 'Bid for legends, build your team and compete for the trophy. Solo or with friends.')}</p><a href={`#${howId}`} className="hv3-learn">▷ {t('Entenda como jogar', 'Learn how to play')}</a></div><div className="hv3-art-caption">{bb ? t('BASQUETE · LEILÃO · RESENHA', 'BASKETBALL · AUCTION · BANTER') : t('FUTEBOL · LEILÃO · RESENHA', 'FOOTBALL · AUCTION · BANTER')}</div></div></section>
    <main><section className="hv3-play"><div className="hv3-wrap">
      {p.resume && <div className="hv3-resume" aria-label={t('Continue de onde parou', 'Pick up where you left off')}>{p.resume}</div>}
      <div className="hv3-notices">{p.notices}</div>
      <div className="hv3-section-head"><div><div className="hv3-kicker">{bb ? t('TRÊS JEITOS DE ENTRAR EM QUADRA', 'THREE WAYS TO PLAY') : t('TRÊS JEITOS DE ENTRAR EM CAMPO', 'THREE WAYS TO PLAY')}</div><h2>{t('ESCOLHA COMO JOGAR.', 'CHOOSE HOW TO PLAY.')}</h2></div><p>{bb ? t('Um leilão. Seu quinteto. A disputa pelo anel.', 'One auction. Your five. The race for the ring.') : t('Um leilão. Seu time. A disputa pela taça.', 'One auction. Your team. The race for the trophy.')}</p></div>
      <div className="hv3-cards">
        <article className="hv3-mode hv3-online"><div className="hv3-topline">{bb ? <span className="hv3-icon" aria-hidden="true">🏀</span> : <LegendsIcon />}<span className="hv3-flag">{t('COM A TURMA', 'WITH FRIENDS')}</span></div><h3>{t('JOGAR ONLINE', 'PLAY ONLINE')}</h3><p>{t('Entre no pregão com seus amigos.', 'Join the auction with your friends.')}<br />{t('Salas rápidas e ligas com a turma.', 'Quick rooms and leagues together.')}</p><button type="button" className="hv3-primary" onClick={() => p.onOnline('open')}>{t('VER SALAS ABERTAS', 'BROWSE OPEN ROOMS')}<span aria-hidden="true">→</span></button><div className="hv3-links"><button type="button" onClick={() => p.onOnline('join')}>{t('Tenho um código', 'I have a code')} →</button><button type="button" onClick={() => p.onOnline('create')}>{t('Criar sala', 'Create room')} +</button></div></article>
        <article className="hv3-mode hv3-career"><div className="hv3-topline">{bb ? <HoopIcon /> : <VillageIcon />}<span className="hv3-flag">{t('SUA HISTÓRIA', 'YOUR STORY')}</span></div><h3>{t('MODO CARREIRA', 'CAREER MODE')}</h3><p>{bb ? <>{t('Comece na Street League e leve seu time', 'Start in the Street League and take your team')}<br />{t('até a NBA.', 'all the way to the NBA.')}</> : <>{t('Comece na várzea e leve seu clube', 'Start at grassroots and take your club')}<br />{t('até as grandes conquistas.', 'all the way to the big trophies.')}</>}</p><button type="button" className="hv3-primary" onClick={p.onCareer}>{t('JOGAR CARREIRA', 'PLAY CAREER')}<span aria-hidden="true">→</span></button><div className="hv3-links"><button type="button" onClick={p.onCareers}>{t('Minhas carreiras', 'My careers')} →</button><button type="button" onClick={p.onManual}>{t('Como funciona', 'How it works')}</button></div></article>
        <article className="hv3-mode hv3-quick"><div className="hv3-topline"><span className="hv3-icon" aria-hidden="true">ϟ</span><span className="hv3-flag">{t('CONTRA A CPU', 'VS THE CPU')}</span></div><h3>{t('PARTIDA RÁPIDA', 'QUICK MATCH')}</h3><p>{bb ? t('Monte seu quinteto no leilão e enfrente', 'Build your five at auction and face') : t('Monte seu time no leilão e enfrente', 'Build your team at auction and face')}<br />{t('a máquina. Sem marcar horário.', 'the CPU. No scheduling needed.')}</p><button type="button" className="hv3-primary" onClick={p.onQuick}>{t('JOGAR AGORA', 'PLAY NOW')}<span aria-hidden="true">→</span></button><div className="hv3-links"><button type="button" onClick={p.onManual}>{t('Bom para conhecer o jogo', 'A good place to learn')} →</button></div></article>
      </div>
      <div className="hv3-others" id={communityId} ref={shortcuts}>{p.shop}
        {p.onFriends ? <button type="button" className="hv3-extra" onClick={p.onFriends}><ExtraIcon kind="friends" /><span className="hv3-text"><strong>{t('AMIGOS', 'FRIENDS')}</strong><small>{t('Clã, álbum e trocas.', 'Clan, album and trades.')}</small></span><span aria-hidden="true">→</span></button> : <button type="button" className="hv3-extra" onClick={p.onAlbum}><span aria-hidden="true">▤</span><span className="hv3-text"><strong>{t('MEU ÁLBUM', 'MY ALBUM')}</strong><small>{t('Cartas, coleções e trocas.', 'Cards, collections and trades.')}</small></span><span aria-hidden="true">→</span></button>}
        <button type="button" className="hv3-extra" onClick={p.onHall}><ExtraIcon kind="hall" /><span className="hv3-text"><strong>{t('SALÃO DOS BATISMOS', 'HALL OF NAMED CLUBS')}</strong><small>{t('Os clubes da nossa comunidade.', 'Clubs from our community.')}</small></span><span aria-hidden="true">→</span></button>
      </div>
    </div></section>
    <section className="hv3-how" id={howId}><div className="hv3-wrap"><div><h2>{t('NUNCA JOGOU?', 'NEW HERE?')}<br />{t('É ASSIM QUE COMEÇA.', 'HERE’S HOW IT STARTS.')}</h2><p className="hv3-intro">{t('Não precisa entender tudo de primeira.', 'You don’t need to know everything yet.')}<br />{t('O primeiro pregão já vira resenha.', 'The banter starts at your first auction.')}</p><button type="button" className="hv3-rule-link" onClick={p.onManual}>{t('Ver as regras completas', 'Read the full rules')} →</button></div><div className="hv3-steps">{[
      [t('DISPUTE NO LEILÃO', 'BID AT AUCTION'), t('Escolha suas apostas e use bem as moedas para contratar.', 'Pick your targets and spend wisely on signings.')],
      bb ? [t('MONTE SEU QUINTETO', 'BUILD YOUR FIVE'), t('Um armador, um ala-armador, um ala, um ala-pivô e um pivô.', 'A point guard, a shooting guard, a small forward, a power forward and a center.')] : [t('MONTE SEU TIME', 'BUILD YOUR TEAM'), t('Organize o elenco e escolha como entrar em campo.', 'Organize your squad and decide how to play.')],
      bb ? [t('BRIGUE PELO ANEL', 'CHASE THE RING'), t('Acompanhe os jogos e descubra quem montou o melhor quinteto.', 'Watch the games and see who built the best five.')] : [t('BRIGUE PELA TAÇA', 'FIGHT FOR THE TROPHY'), t('Acompanhe os jogos e descubra quem montou o melhor time.', 'Watch the matches and see who built the best team.')],
    ].map(([title, text], i) => <div className="hv3-step" key={i}><b>0{i + 1}</b><div><strong>{title}</strong><p>{text}</p></div></div>)}</div></div></section></main>
    <footer className="hv3-foot"><div className="hv3-wrap"><div><strong>{bb ? 'BIDLEGENDS' : 'LEILÃO LEGENDS'}</strong><p>{bb ? t('Seu quinteto. Sua lenda. Sua próxima resenha.', 'Your five. Your legend. Your next game night.') : t('Seu clube. Sua história. Sua próxima resenha.', 'Your club. Your story. Your next match night.')}</p></div><nav><a href="https://instagram.com/leilaolegendscom" target="_blank" rel="noopener noreferrer">Instagram →</a><a href="mailto:contato@leilaolegends.com">{t('Fale com o Diego', 'Contact Diego')}</a><button type="button" className="hv3-rule-link" onClick={p.onManual}>{t('Regras', 'Rules')}</button></nav><div className="hv3-footer-language">{p.language}</div></div></footer>
    {p.overlays}
  </div></>
}
