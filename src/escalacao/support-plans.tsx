import { useEffect, useRef, type ReactNode } from 'react'
import { tr } from './lang'
import './support-plans.css'

export type SupportPlanKey = 'prata' | 'ouro' | 'batismo' | 'socio'
type Props = {
  focus: SupportPlanKey | null
  tier?: string
  name: string
  memberActive: boolean
  memberNumber?: number | null
  foundersLeft: number
  onPay: (tier: 'prata' | 'ouro') => void
  onNaming: () => void
  onMember: () => void
  onDonate: () => void
  onInstagram: () => void
}

export function SupportStory() {
  return <section className="ll-support-story">
    <h3>{tr('QUEM FAZ ISSO AQUI 🔴⚫', 'WHO MAKES THIS THING 🔴⚫')}</h3>
    <p>{tr('Sou o Diego. De dia vendo carro com meu pai. De madrugada, quando a casa dorme, faço este jogo — sozinho, na unha.', 'I’m Diego. By day I sell cars with my dad. Late at night, when the house is asleep, I build this game — on my own, by hand.')}</p>
    <p>{tr('E faço por um motivo com nome: o Luca, meu filho. Ele tem uma condição rara — são 120 casos no mundo — e ele é o menino mais forte do mundo. Ele é a minha ', 'And I do it for a reason with a name: Luca, my son. He has a rare condition — there are 120 cases worldwide — and he is the strongest boy in the world. He is my ')}<strong className="ll-support-luca-legend">{tr('lenda', 'legend')}</strong>{tr('. Cada apoio vira uma vida melhor pro Luca e este jogo vivo, crescendo toda semana.', '. Every bit of support helps give Luca a better life and keeps this game alive, growing every week.')}</p>
    <p>{tr('E essa história, que é minha e do Luca, passa a ter um pedaço de você dentro dela.', 'And that story, mine and Luca’s, gets to carry a piece of you inside it.')}</p>
    <strong>{tr('✍ Diego · fundador nº 1', '✍ Diego · founder no. 1')}</strong>
    <p>{tr('Pelo Luca: obrigado por estar aqui 💛', 'For Luca: thank you for being here 💛')}</p>
  </section>
}

export function SupportFooter({ onOpen }: { onOpen: () => void }) {
  return <section className="ll-support-footer">
    <h3>{tr('💛 APOIE O LEILÃO LEGENDS', '💛 SUPPORT LEILÃO LEGENDS')}</h3>
    <p>{tr('Ajude o jogo a continuar crescendo e conheça os benefícios de cada plano.', 'Help the game keep growing and explore what each plan includes.')}</p>
    <button onClick={onOpen}>{tr('CONHECER OS PLANOS →', 'EXPLORE THE PLANS →')}</button>
  </section>
}

export function SupportManualPreview() {
  return <section className="ll-support-controls" aria-label={tr('Exemplo dos controles liberados; não controla a partida', 'Preview of unlocked controls; does not control the match')}>
    <h3>{tr('PRÉVIA DOS CONTROLES LIBERADOS', 'PREVIEW OF UNLOCKED CONTROLS')}</h3>
    <div><p>{tr('VELOCIDADE DA PARTIDA', 'MATCH SPEED')}</p>
      <div className="ll-support-speeds">{['¼×', '½×', tr('Normal', 'Normal'), '2×', '4×'].map((v, i) => <span key={v} className={i === 2 ? 'selected' : ''}>{v}</span>)}</div>
      <div className="ll-support-actions"><span>{tr('⏭ PULAR', '⏭ SKIP')}</span><span>{tr('MODO AUTO', 'AUTO MODE')}</span><span>{tr('▶ PRÓXIMA RODADA', '▶ NEXT ROUND')}</span></div>
    </div>
  </section>
}

export function SupportCraqueBenefits() {
  return <ul className="ll-support-benefits">
    <li><b>{tr('Modo Manual na carreira', 'Manual Mode in Career')}</b>{tr('Pause a partida, altere a velocidade, pule ou avance a rodada quando quiser.', 'Pause the match, adjust the speed, skip or advance the round whenever you want.')}</li>
    <li><b>{tr('Overall visível depois da contratação', 'Ratings visible after signing')}</b>{tr('Veja a nota dos jogadores e treinadores do seu elenco até a categoria Craque. Lendas continuam ocultas.', 'See the rating of players and coaches in your squad up to Star. Legends remain hidden.')}</li>
    <li><b>{tr('Olheiro até a categoria Craque', 'Scout up to Star')}</b>{tr('Sonde Foi Profissional, Bom Jogador, Promessa e Craque. O jogador vai ao pregão e você ainda disputa o lance.', 'Scout Former Pro, Good Player, Prospect and Star. The player enters the auction and you still compete for the bid.')}</li>
    <li><b>{tr('Visual prata com brilho', 'Shining silver look')}</b>{tr('Seu nome ganha destaque prateado no estádio, elenco e tabelas.', 'Your name gets a silver highlight in the stadium, squad and tables.')}</li>
    <li><b>{tr('Grupo VIP', 'VIP group')}</b>{tr('Bastidores, novidades e contato com o Diego no WhatsApp.', 'Behind the scenes, news and contact with Diego on WhatsApp.')}</li>
    <li><b>{tr('4 carreiras salvas', '4 saved careers')}</b>{tr('Mantenha quatro histórias diferentes ao mesmo tempo.', 'Keep four different stories at the same time.')}</li>
  </ul>
}

export function SupportPlanCard({ id, title, price, cadence, tone, children }: { id?: string; title: string; price: string; cadence: string; tone: string; children: ReactNode }) {
  return <article id={id} className={'ll-support-plan ' + tone}><header><h2>{title}</h2><div><strong>{price}</strong><small>{cadence}</small></div></header><div className="ll-support-plan-body">{children}</div></article>
}

export function SupportPlans(p: Props) {
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!p.focus) return
    const target = p.focus === 'socio' ? (p.tier === 'ouro' ? 'ouro' : 'prata') : p.focus
    const timer = setTimeout(() => root.current?.querySelector('#support-' + target)?.scrollIntoView({ block: 'start' }), 40)
    return () => clearTimeout(timer)
  }, [p.focus, p.tier])
  const memberButton = (tier: 'prata' | 'ouro') => p.tier === tier
    ? <button className={'ll-support-button ' + (tier === 'ouro' ? 'gold' : 'prata')} onClick={p.onMember}>{p.memberActive
      ? tr('ABRIR MINHA ÁREA DE SÓCIO →', 'OPEN MY MEMBER AREA →')
      : tr(tier === 'ouro' ? 'ADICIONAR SÓCIO · R$ 2,90/MÊS' : 'ADICIONAR SÓCIO · R$ 4,90/MÊS', tier === 'ouro' ? 'ADD MEMBERSHIP · R$ 2.90/MONTH' : 'ADD MEMBERSHIP · R$ 4.90/MONTH')}</button>
    : null
  return <div className="ll-support" ref={root}>
    <div className="ll-support-hero"><small>{tr('FAÇA PARTE DESSA HISTÓRIA', 'BE PART OF THIS STORY')}</small><h1>{tr('SEU APOIO FAZ O JOGO CRESCER.', 'YOUR SUPPORT HELPS THE GAME GROW.')}</h1><p>{tr('Escolha o plano que combina com você e ajude a manter o Leilão Legends vivo.', 'Choose the plan that suits you and help keep Leilão Legends alive.')}</p></div>
    <h3 className="ll-support-section">{tr('PAGUE UMA VEZ · BENEFÍCIOS PERMANENTES', 'PAY ONCE · PERMANENT BENEFITS')}</h3>
      <SupportPlanCard id="support-prata" title={tr('⭐ Craque', '⭐ Star')} price="R$ 19,90" cadence={tr('uma vez só', 'one-off payment')} tone="prata">
        <h3>{tr('O ritmo da carreira na sua mão.', 'The pace of your career in your hands.')}</h3><div className="ll-support-sample prata">{p.name || tr('Seu clube', 'Your club')} ⭐</div><SupportCraqueBenefits />
        <p className="ll-support-note">{tr('O olheiro do Craque não revela nem sonda Lendas. No online normal, o ritmo é o mesmo para todos.', 'The Star scout does not reveal or scout Legends. In regular online play, the pace is the same for everyone.')}</p>
        <button className="ll-support-button prata" onClick={() => p.onPay('prata')}>{tr('ESCOLHER CRAQUE · R$ 19,90', 'CHOOSE STAR · R$ 19.90')}</button>
        <p className="ll-support-addon">{tr('Quer também escudo, mascote, manto e nome do estádio? Sendo Craque, adicione o Sócio por apenas R$ 4,90/mês. Inclui carteirinha e 30 moedas a cada 30 dias. Cancele quando quiser.', 'Want a crest, mascot, kit and stadium name too? As a Star, add Membership for only R$ 4.90/month. Includes a membership card and 30 coins every 30 days. Cancel anytime.')}</p>
        {memberButton('prata')}
      </SupportPlanCard>
      <SupportPlanCard id="support-ouro" title={tr('👑 Lenda', '👑 Legend')} price="R$ 39,90" cadence={tr('uma vez só', 'one-off payment')} tone="ouro">
        <h3>{tr('A experiência completa do treinador.', 'The complete manager experience.')}</h3><div className="ll-support-sample ouro">{p.name || tr('Seu clube', 'Your club')} 👑</div>
        <ul className="ll-support-benefits">
          <li><b>{tr('Modo Manual na carreira', 'Manual Mode in Career')}</b>{tr('Pause a partida, altere a velocidade, pule ou avance a rodada quando quiser.', 'Pause the match, adjust the speed, skip or advance the round whenever you want.')}</li>
          <li><b>{tr('Overall visível de qualquer categoria', 'Ratings visible for every category')}</b>{tr('Veja a nota de todos os jogadores e treinadores do seu elenco, inclusive Lendas.', 'See the rating of every player and coach in your squad, including Legends.')}</li>
          <li><b>{tr('Olheiro de todas as categorias', 'Scout for all categories')}</b>{tr('Sonde qualquer jogador, de Foi Profissional até Lenda. Ele vai ao pregão e a contratação continua disputada.', 'Scout any player, from Former Pro to Legend. He enters the auction and the signing remains competitive.')}</li>
          <li><b>{tr('Visual ouro e selo no nome', 'Gold look and name badge')}</b>{tr('Seu nome aparece com brilho dourado — ou você escolhe outra cor.', 'Your name appears with a gold shine — or you choose another colour.')}</li>
          <li><b>{tr('Grupo VIP', 'VIP group')}</b>{tr('Bastidores, novidades e contato com o Diego no WhatsApp.', 'Behind the scenes, news and contact with Diego on WhatsApp.')}</li>
          <li><b>{tr('6 carreiras salvas', '6 saved careers')}</b>{tr('Tenha ainda mais espaço para construir histórias diferentes.', 'Get even more room to build different stories.')}</li>
          <li><b>{tr('Crie sua própria Liga', 'Create your own League')}</b>{tr('Monte até 5 ligas para jogar com a sua turma.', 'Create up to 5 leagues to play with your crew.')}</li>
        </ul>
        <p className="ll-support-note">{tr('Já tem Craque? Suba para Lenda pagando a diferença: R$ 20,00.', 'Already have Star? Upgrade to Legend for the difference: R$ 20.00.')}</p>
        <button className="ll-support-button gold" onClick={() => p.onPay('ouro')}>{p.tier === 'prata' ? tr('SUBIR PARA LENDA · R$ 20,00', 'UPGRADE TO LEGEND · R$ 20.00') : tr('ESCOLHER LENDA · R$ 39,90', 'CHOOSE LEGEND · R$ 39.90')}</button>
        <p className="ll-support-addon">{tr('Quer também escudo, mascote, manto e nome do estádio? Sendo Lenda, adicione o Sócio por apenas R$ 2,90/mês. Inclui carteirinha e 30 moedas a cada 30 dias. Cancele quando quiser.', 'Want a crest, mascot, kit and stadium name too? As a Legend, add Membership for only R$ 2.90/month. Includes a membership card and 30 coins every 30 days. Cancel anytime.')}</p>
        {memberButton('ouro')}
      </SupportPlanCard>
      <SupportPlanCard id="support-batismo" title={tr('🖋 Batismo', '🖋 Club naming')} price="R$ 59,90" cadence={tr('a partir de · uma vez', 'from · one-off')} tone="batismo">
        <h3>{tr('Seu clube entra no jogo de todo mundo.', 'Your club joins everyone’s game.')}</h3>
        <ul className="ll-support-benefits">
          <li><b>{tr('Seu nome num clube da pirâmide', 'Your name on a club in the pyramid')}</b>{tr('Disputa temporadas e aparece nas tabelas e no jornal dos jogadores.', 'Plays seasons and appears in players’ tables and newspapers.')}</li>
          <li><b>{tr('Escudo, mascote, manto e estádio próprios', 'Your own crest, mascot, kit and stadium')}</b>{tr('O Diego desenha as artes do seu jeito, e a mascote comemora seus gols e títulos.', 'Diego creates the artwork your way, and the mascot celebrates your goals and titles.')}</li>
          <li><b>{tr('Todos os benefícios do Lenda', 'Every Legend benefit')}</b>{tr('Modo Manual, overall de todas as categorias, olheiro até Lenda, visual ouro, Grupo VIP e criação de até 5 ligas.', 'Manual Mode, ratings for every category, scouting up to Legend, gold look, VIP group and creation of up to 5 leagues.')}</li>
          <li><b>{tr('Sócio incluído para sempre — sem mensalidade', 'Membership included forever — no monthly fee')}</b>{tr('Você já ganha escudo, mascote, manto, nome do estádio, carteirinha e 30 moedas a cada 30 dias sem pagar nada por mês.', 'You already get a crest, mascot, kit, stadium name, membership card and 30 coins every 30 days without paying anything monthly.')}</li>
          <li><b>{tr('8 carreiras salvas', '8 saved careers')}</b>{tr('O maior espaço de saves entre todos os planos.', 'The largest save allowance among all plans.')}</li>
          <li><b>{tr('Selo de Fundador e nome no mural', 'Founder badge and your name on the wall')}</b>{tr('Sua participação fica registrada na história do jogo. Vagas disponíveis:', 'Your support is recorded in the game’s history. Places available:')} {p.foundersLeft}/100.</li>
        </ul>
        <div className="ll-support-prices"><div>{tr('SÉRIES B, C, D E VÁRZEA', 'DIVISIONS B, C, D AND VÁRZEA')}<b>R$ 59,90</b></div><div>{tr('SÉRIE A', 'DIVISION A')}<b>R$ 69,90</b></div></div>
        <p className="ll-support-note">{tr('No Batismo de R$ 69,90, seu clube entra na Série A e também aparece no Jogo Rápido e no modo Online. O clube continua seu: nome, escudo, mascote e manto.', 'With the R$ 69.90 Club Naming, your club joins Division A and also appears in Quick Play and Online mode. The club remains yours: name, crest, mascot and kit.')}</p>
        <button className="ll-support-button dark" onClick={p.onNaming}>{tr('QUERO BATIZAR MEU CLUBE →', 'I WANT TO NAME MY CLUB →')}</button>
      </SupportPlanCard>
      <p className="ll-support-note">{tr('Jogar continua grátis. Os planos liberam personalização e recursos extras, mas não aumentam os atributos dos jogadores.', 'Playing stays free. Plans unlock customization and extra features, but do not increase player attributes.')}</p>
    <div className="ll-support-bottom"><button className="ll-support-button green" onClick={p.onDonate}>{tr('💛 SÓ APOIAR A RESENHA · QUALQUER VALOR', '💛 JUST CHIP IN · ANY AMOUNT')}</button><button className="ll-support-button" onClick={p.onInstagram}>{tr('SEGUIR NO INSTAGRAM TAMBÉM AJUDA 📲', 'FOLLOWING ON INSTAGRAM HELPS TOO 📲')}</button><SupportStory /></div>
  </div>
}
