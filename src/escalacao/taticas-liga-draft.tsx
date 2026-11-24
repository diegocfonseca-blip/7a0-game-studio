// ⚔️ TÁTICAS NOVAS NA LIGA DRAFT (24/11, pedido do Diego: *"essas táticas agora também tivessem disponíveis lá no modo draft…
// e na área do elenco, onde faz a substituição"*). É o MESMO painel das salas (postura · caminho do ataque · marcação/pressão
// alta · ritmo), salvo pelo dono da sala igual nas outras salas (`FOOTBALL_SAVE_PLAN`) e valendo a partir do próximo jogo.
// A Liga Draft não usa o visual novo das partidas, então aqui o painel ganha a roupa clássica do jogo (creme, borda preta,
// dourado no escolhido) — `taticas-liga-draft.css`. Ordem ao vivo (botão "Enviar ordens") fica de fora: o status já diz que
// a escolha vale pros próximos jogos.
import { FootballTacticsPanel } from './football-tactics-panel'
import { tr } from './lang'
import type { Tactic } from './types'
import { useOwnerLayout } from './owner-online-visual'
import './taticas-liga-draft.css'

export function TaticasLigaDraft({ value, onChange, titulo = false }: { value: Tactic; onChange: (t: Tactic) => void; titulo?: boolean }) {
  // na sala com o visual escuro (o de todo mundo hoje) o painel é o MESMO da tela do jogo, numa caixa escura; sem ele, a roupa creme
  const escuro = useOwnerLayout()
  return (
    <div className={escuro ? 'ld-taticas-escuro' : 'ld-taticas'}>
      {titulo && !escuro && <b className="ld-taticas-titulo">{tr('⚔️ Tática do próximo jogo', '⚔️ Next match tactics')}</b>}
      <FootballTacticsPanel value={value} onChange={onChange} disabled={false} minimal={escuro} />
    </div>
  )
}
