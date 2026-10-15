// 🏢➡️⚽ SAF QUE VIRA 2º CLUBE — as telas (13/10). Seguem o mockup aprovado
// `scripts/mockups/carreira-saf-completo.png` (② sua SAF · ③ assumir o comando · ④ o 2º clube no dia a
// dia · ⑤ empréstimos entre os seus clubes · ⑥ vender a SAF · ⑦ vender o 2º clube · ⑧ o jogo mudou),
// com as MESMAS peças das telas da carreira: caixa creme, borda preta grossa, sombra dura, Oswald.
// 🔒 Nenhuma regra mora aqui: todo número e toda trava vem de `saf2.ts` — a mesma função que o reducer
// usa (regra de ouro contra botão mudo). Só aparece com `useSaf2()` ligado (sport.ts).
import { useState, type CSSProperties, type ReactNode } from 'react'
import { tr, getLang } from './lang'
import {
  podeAssumir, temporadasComoDono, valorVendaSaf, VALOR_SAF_DIV, PRECO_SAF, PRECO_COMANDO, TEMPORADAS_PRA_ASSUMIR,
  TACAS_SAF2, TACA_NOME, valorTacas, lucroVenda, REEMBOLSO_SAF, REEMBOLSO_2O_CLUBE, EMPRESTIMOS_ENTRE_CLUBES, semLance, type TacaSaf2,
} from './saf2'

const INK = '#0C0C0C'
const GOLD = '#FFC400'
const GREEN = '#1B7A3D'
const RED = '#C2452F'
const CREME = '#F4ECD6'
const OSW = { fontFamily: 'Oswald, sans-serif' } as const
const box = (bg = '#fff'): CSSProperties => ({ background: bg, border: `3px solid ${INK}`, borderRadius: 16, boxShadow: `4px 4px 0 0 ${INK}` })
const linha: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, background: '#fff', border: `2.5px solid ${INK}`, borderRadius: 10, padding: '7px 10px', marginTop: 6, fontSize: 11.5, fontWeight: 800 }
const nota: CSSProperties = { fontFamily: 'system-ui', fontSize: 10, fontWeight: 600, color: 'rgba(0,0,0,.55)', margin: '6px 2px 0', lineHeight: 1.45 }
const fmt = (n: number) => Math.round(n).toLocaleString(getLang() === 'en' ? 'en-US' : 'pt-BR')
const sinal = (n: number) => (n > 0 ? `+${fmt(n)}` : n < 0 ? `−${fmt(-n)}` : tr('empata', 'break-even'))
const divNome = (d: string) => (d === 'V' ? 'Várzea' : `Série ${d}`)

function Cabeca({ ic, titulo, sub }: { ic: string; titulo: string; sub: string }) {
  return (
    <div style={{ background: INK, color: '#fff', borderRadius: 12, padding: '10px 12px', marginBottom: 9 }}>
      <p style={{ ...OSW, fontWeight: 900, fontSize: 16, margin: 0 }}>{ic} {titulo}</p>
      <p style={{ fontFamily: 'system-ui', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,.65)', margin: '2px 0 0' }}>{sub}</p>
    </div>
  )
}
function Botao({ children, onClick, cor = GOLD, tinta = INK, desligado = false }: { children: ReactNode; onClick?: () => void; cor?: string; tinta?: string; desligado?: boolean }) {
  return (
    <button disabled={desligado} onClick={desligado ? undefined : onClick}
      style={{ width: '100%', marginTop: 9, border: `3px solid ${INK}`, borderRadius: 12, padding: 11, ...OSW, fontWeight: 900, fontSize: 13.5, background: desligado ? '#d9d4c7' : cor, color: desligado ? 'rgba(0,0,0,.45)' : tinta, boxShadow: desligado ? 'none' : `3px 3px 0 0 ${INK}`, cursor: desligado ? 'default' : 'pointer' }}>
      {children}
    </button>
  )
}
/** 🔒 a trava sempre diz O PORQUÊ e O CAMINHO (regra do Diego) */
function Trava({ children }: { children: ReactNode }) {
  return <div style={{ fontFamily: 'system-ui', fontSize: 10.5, fontWeight: 700, background: '#FDE9C8', border: `2px solid ${INK}`, borderRadius: 9, padding: '7px 9px', marginTop: 7, lineHeight: 1.4 }}>{children}</div>
}
const JANELA_TXT = () => tr('🪟 Abre só na virada da temporada: antes de começar a 1ª rodada.', '🪟 Only opens at the season turn: before round 1 starts.')

// ② + ③ + ⑥ — a SAF (bot no comando): relógio das 10 temporadas, assumir o comando, vender pela divisão
export function Saf2SafPainel(p: {
  team: string; div: string; desde: number; seasonNo: number; semEspera?: boolean
  caixaPrincipal: number; pagante: boolean; janela: boolean; ativoEhPrincipal: boolean
  planosBtn?: ReactNode; onAssumir: () => void; onVender: () => void
}) {
  const [vendendo, setVendendo] = useState(false)
  const temporadas = temporadasComoDono(p.desde, p.seasonNo)
  const r = podeAssumir({ temSaf: true, tem2o: false, janela: p.janela, pagante: p.pagante, seasonNo: p.seasonNo, safDesde: p.desde, semEspera: p.semEspera, caixa: p.caixaPrincipal })
  const valor = valorVendaSaf(p.div)
  const lucro = lucroVenda(valor, PRECO_SAF)
  const pct = p.semEspera ? 100 : Math.min(100, Math.round(temporadas / TEMPORADAS_PRA_ASSUMIR * 100))
  const check = (ok: boolean, txt: ReactNode, val: ReactNode) => (
    <div style={linha}><span style={{ color: ok ? GREEN : INK }}>{ok ? '✓' : '✗'} {txt}</span><b style={{ ...OSW, color: ok ? GREEN : RED }}>{val}</b></div>
  )
  return (
    <div style={{ marginTop: 11 }}>
      {/* ② PRA VIRAR SEU 2º CLUBE */}
      <div style={{ ...box(), padding: 11 }}>
        <p style={{ ...OSW, fontWeight: 900, fontSize: 14.5, margin: 0, textTransform: 'uppercase' }}>{tr('Pra virar seu 2º clube', 'To become your 2nd club')}</p>
        <div style={linha}>
          <span>{tr('Temporadas como dono', 'Seasons as owner')}</span>
          <b style={OSW}>{p.semEspera ? tr('liberado', 'unlocked') : `${Math.min(temporadas, TEMPORADAS_PRA_ASSUMIR)} ${tr('de', 'of')} ${TEMPORADAS_PRA_ASSUMIR}`}</b>
        </div>
        <div style={{ height: 11, border: `2.5px solid ${INK}`, borderRadius: 99, marginTop: 6, overflow: 'hidden', background: '#fff' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: GOLD }} />
        </div>
        <p style={nota}>{p.semEspera
          ? tr('Você escolheu ficar com a SAF quando o jogo mudou: ela já pode virar seu 2º clube, sem esperar.', 'You chose to keep the SAF when the game changed: it can become your 2nd club right away.')
          : r.faltamTemporadas > 0
            ? tr(`Daqui a ${r.faltamTemporadas} ${r.faltamTemporadas === 1 ? 'temporada' : 'temporadas'} você pode assumir o comando.`, `In ${r.faltamTemporadas} ${r.faltamTemporadas === 1 ? 'season' : 'seasons'} you can take command.`)
            : tr('Pronto: você já pode assumir o comando.', 'Ready: you can take command now.')}</p>
      </div>

      {/* ③ ASSUMIR O COMANDO */}
      <div style={{ ...box(CREME), padding: 11, marginTop: 10 }}>
        <Cabeca ic="⚽" titulo={tr('Assumir o comando', 'Take command')} sub={tr('só na virada da temporada', 'only at the season turn')} />
        <p style={{ ...OSW, fontWeight: 900, fontSize: 13, margin: '2px 0 0', textTransform: 'uppercase' }}>{tr('O que precisa', 'What you need')}</p>
        {check(p.pagante, <>⭐ {tr('Ser apoiador (Craque, Lenda ou Batismo)', 'Be a supporter (Star, Legend or Club naming)')}</>, p.pagante ? 'ok' : '—')}
        {check(r.faltamTemporadas === 0, tr(`${TEMPORADAS_PRA_ASSUMIR} temporadas como dono da SAF`, `${TEMPORADAS_PRA_ASSUMIR} seasons as SAF owner`), p.semEspera ? '✓' : `${Math.min(temporadas, TEMPORADAS_PRA_ASSUMIR)}/${TEMPORADAS_PRA_ASSUMIR}`)}
        {check(r.faltamMoedas === 0, tr(`${fmt(PRECO_COMANDO)} 🪙 no caixa principal`, `${fmt(PRECO_COMANDO)} 🪙 in the main till`), fmt(p.caixaPrincipal))}
        {r.ok && p.ativoEhPrincipal
          ? <Botao onClick={() => { if (window.confirm(tr(`Assumir o comando do ${p.team} por ${fmt(PRECO_COMANDO)} 🪙? Ele vira o seu 2º clube.`, `Take command of ${p.team} for ${fmt(PRECO_COMANDO)} 🪙? It becomes your 2nd club.`))) p.onAssumir() }}>⚽ {tr('Assumir o comando', 'Take command')} · {fmt(PRECO_COMANDO)} 🪙</Botao>
          : <Botao desligado>⚽ {tr('Assumir o comando', 'Take command')}</Botao>}
        {r.motivo === 'pagante' && (
          <Trava>⭐ {tr('Só pra quem apoia o jogo: Craque, Lenda ou Batismo.', 'Only for game supporters: Star, Legend or Club naming.')} {p.planosBtn}</Trava>
        )}
        {r.motivo === 'temporadas' && <Trava>⏳ {tr(`Faltam ${r.faltamTemporadas} ${r.faltamTemporadas === 1 ? 'temporada' : 'temporadas'} como dono da SAF. É só seguir jogando.`, `${r.faltamTemporadas} more ${r.faltamTemporadas === 1 ? 'season' : 'seasons'} as SAF owner. Just keep playing.`)}</Trava>}
        {r.motivo === 'moedas' && <Trava>🪙 {tr(`Faltam ${fmt(r.faltamMoedas)} 🪙 no caixa do clube principal (custa ${fmt(PRECO_COMANDO)}).`, `${fmt(r.faltamMoedas)} 🪙 short in the main club till (it costs ${fmt(PRECO_COMANDO)}).`)}</Trava>}
        {r.motivo === 'janela' && <Trava>{JANELA_TXT()}</Trava>}
        {r.ok && !p.ativoEhPrincipal && <Trava>🔄 {tr('Passe o comando pro seu clube principal: é dele que sai o dinheiro.', 'Hand command back to your main club: the money comes from it.')}</Trava>}
        <p style={nota}>{tr(`O ${p.team} vira o seu 2º clube: você escala, dá lance e joga. Os títulos dele ficam com ele.`, `${p.team} becomes your 2nd club: you pick the team, bid and play. Its titles stay with it.`)}</p>
      </div>

      {/* ⑥ VENDER A SAF PELA DIVISÃO */}
      <div style={{ ...box(), padding: 11, marginTop: 10 }}>
        {!vendendo ? (
          <>
            <div style={linha}><span>💸 {tr(`Vale hoje (${divNome(p.div)})`, `Worth today (${divNome(p.div)})`)}</span><b style={{ ...OSW, color: lucro >= 0 ? GREEN : RED }}>{fmt(valor)} · {sinal(lucro)}</b></div>
            <Botao cor="#fff" onClick={() => setVendendo(true)}>💸 {tr('Vender a SAF', 'Sell the SAF')}</Botao>
          </>
        ) : (
          <>
            <Cabeca ic="💸" titulo={tr('Vender a SAF', 'Sell the SAF')} sub={tr(`você pagou ${fmt(PRECO_SAF)} com ela na Série D`, `you paid ${fmt(PRECO_SAF)} with it in Série D`)} />
            {(['V', 'D', 'C', 'B', 'A'] as const).map(d => {
              const v = VALOR_SAF_DIV[d], l = lucroVenda(v, PRECO_SAF), aqui = d === p.div
              return (
                <div key={d} style={{ ...linha, background: aqui ? '#FFF3CF' : '#fff' }}>
                  <span>{divNome(d)}{aqui ? tr(' ← ela está aqui', ' ← it is here') : ''}</span>
                  <b style={{ ...OSW, color: l > 0 ? GREEN : l < 0 ? RED : INK }}>{fmt(v)} · {sinal(l)}</b>
                </div>
              )
            })}
            {p.janela && p.ativoEhPrincipal
              ? <Botao cor="#fff" onClick={() => { if (window.confirm(tr(`Vender a SAF do ${p.team} por ${fmt(valor)} 🪙? Os empréstimos com ela voltam na hora.`, `Sell the ${p.team} SAF for ${fmt(valor)} 🪙? Loans with it come back right away.`))) { p.onVender(); setVendendo(false) } }}>💸 {tr(`Vender por ${fmt(valor)} 🪙`, `Sell for ${fmt(valor)} 🪙`)}</Botao>
              : <Botao desligado>💸 {tr(`Vender por ${fmt(valor)} 🪙`, `Sell for ${fmt(valor)} 🪙`)}</Botao>}
            {!p.janela && <Trava>{JANELA_TXT()}</Trava>}
            {p.janela && !p.ativoEhPrincipal && <Trava>🔄 {tr('Passe o comando pro seu clube principal pra vender.', 'Hand command back to your main club to sell.')}</Trava>}
            <p style={nota}>{tr('Só dá lucro se ela estiver na Série A. E o lucro nunca passa de 500.', 'It only makes a profit if it is in Série A. And the profit never goes above 500.')}</p>
            <button onClick={() => setVendendo(false)} style={{ width: '100%', marginTop: 6, background: 'transparent', border: 'none', fontWeight: 800, fontSize: 11, color: 'rgba(0,0,0,.5)', textDecoration: 'underline', cursor: 'pointer' }}>{tr('voltar', 'back')}</button>
          </>
        )}
      </div>
    </div>
  )
}

/** as regras novas da SAF, no lugar da lista velha (que dizia "não vende, não troca" e "o empréstimo fica valendo") */
export function Saf2Regras() {
  const li = (t: ReactNode) => <li>{t}</li>
  return (
    <ul style={{ margin: '7px 0 0', paddingLeft: 16, fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,.7)', lineHeight: 1.55 }}>
      {li(tr(`💰 A SAF custa ${fmt(PRECO_SAF)}. O bot continua no comando dela: você é o sócio.`, `💰 The SAF costs ${fmt(PRECO_SAF)}. The bot stays in charge: you are the partner.`))}
      {li(tr('🏆 Direito a 50% dos prêmios de campanha dela (e 50% da multa se ela cair).', '🏆 Entitled to 50% of its campaign prizes (and 50% of the fine if it is relegated).'))}
      {li(tr(`⚽ Depois de ${TEMPORADAS_PRA_ASSUMIR} temporadas como dono, quem apoia o jogo pode assumir o comando (${fmt(PRECO_COMANDO)}) e ela vira o seu 2º clube.`, `⚽ After ${TEMPORADAS_PRA_ASSUMIR} seasons as owner, supporters can take command (${fmt(PRECO_COMANDO)}) and it becomes your 2nd club.`))}
      {li(tr('🔄 Empréstimo só na virada da temporada: vale 1 temporada, volta sozinho no fim e cada lado paga metade do salário.', '🔄 Loans only at the season turn: they last 1 season, come back by themselves and each side pays half the wages.'))}
      {li(tr('💸 Dá pra vender na virada, pela divisão em que ela estiver. Quase sempre sai no prejuízo: o lucro máximo é 500.', '💸 You can sell at the season turn, by the division it is in. It is almost always a loss: the most you can make is 500.'))}
    </ul>
  )
}
export const saf2LoanSub = () => tr('Vale 1 temporada e volta sozinho no fim · metade do salário pra cada lado · só na virada (antes da 1ª rodada)', 'Lasts 1 season and comes back by itself · half the wages each side · only at the season turn (before round 1)')

type Jog = { id: string; name: string; pos: string; valor: number; livre: boolean; livreT?: boolean; motivo?: string }
// ④ + ⑤ + ⑦ — o 2º clube no dia a dia, empréstimos/transferência entre os seus clubes, venda pela coleção de taças
export function Saf2Clube2Painel(p: {
  principal: { id: number; nome: string; caixa: number }
  seg: { id: number; nome: string; caixa: number; div: string }
  ativoId: number; janela: boolean
  tacas: TacaSaf2[]; venda: { base: number; caixa: number; total: number; investido: number; antigo: boolean }
  emprestimos: { nome: string; pos: string; de: number; para: number }[]
  jogPrincipal: Jog[]; jogSeg: Jog[]; transfFeita: boolean
  onAporte: (v: number) => void; onEmprestar: (cardId: string) => void; onTransferir: (cardId: string) => void; onVender: () => void
}) {
  const [aba, setAba] = useState<'emp' | 'transf' | null>(null)
  const [aporte, setAporte] = useState(100)
  const [vendendo, setVendendo] = useState(false)
  const sem = p.ativoId === p.principal.id ? p.seg : p.principal
  const vermelho = semLance(p.seg.caixa)
  const empDe = (id: number) => p.emprestimos.filter(e => e.de === id).length
  const lucro = lucroVenda(p.venda.base, p.venda.investido)
  const set = new Set(p.tacas)
  const lista = (de: { id: number; nome: string }, para: { nome: string }, jogs: Jog[], modo: 'emp' | 'transf') => (
    <div style={{ ...box(), padding: 10, marginTop: 8 }}>
      <p style={{ ...OSW, fontWeight: 900, fontSize: 13, margin: 0, textTransform: 'uppercase' }}>{de.nome} → {para.nome}{modo === 'emp' ? <span style={{ fontSize: 10, border: `2px solid ${INK}`, borderRadius: 6, padding: '0 5px', marginLeft: 6 }}>{empDe(de.id)} {tr('DE', 'OF')} {EMPRESTIMOS_ENTRE_CLUBES}</span> : null}</p>
      <div style={{ maxHeight: 170, overflowY: 'auto', marginTop: 4 }}>
        {jogs.length === 0 && <p style={nota}>{tr('Ninguém disponível.', 'Nobody available.')}</p>}
        {jogs.map(j => { const ok = modo === 'transf' ? !!j.livreT : j.livre; return (
          <button key={j.id} disabled={!ok} title={j.motivo}
            onClick={() => { if (!ok) return; if (modo === 'transf' ? window.confirm(tr(`Transferir ${j.name} de vez pro ${para.nome} por ${fmt(j.valor)} 🪙?`, `Transfer ${j.name} for good to ${para.nome} for ${fmt(j.valor)} 🪙?`)) : true) { (modo === 'emp' ? p.onEmprestar : p.onTransferir)(j.id); setAba(null) } }}
            style={{ ...linha, width: '100%', cursor: ok ? 'pointer' : 'default', opacity: ok ? 1 : .5 }}>
            <span>{j.pos} · {j.name}{!ok && j.motivo ? <small style={{ fontWeight: 600, opacity: .7 }}> · {j.motivo}</small> : null}</span><b style={OSW}>{modo === 'transf' ? `${fmt(j.valor)} 🪙` : '→'}</b>
          </button>
        ) })}
      </div>
    </div>
  )
  return (
    <div style={{ marginTop: 10 }}>
      {/* ④ O CLUBE QUE ESTÁ COM O AUXILIAR */}
      <div style={{ ...box(CREME), padding: 11 }}>
        <p style={{ ...OSW, fontWeight: 900, fontSize: 14, margin: 0, textTransform: 'uppercase' }}>🤖 {sem.nome} · {tr('com o auxiliar', 'with the assistant')}</p>
        <p style={{ fontFamily: 'system-ui', fontSize: 10.5, fontWeight: 600, color: '#3a3222', margin: '3px 0 0', lineHeight: 1.45 }}>{tr('Sem você lá, o auxiliar escala, renova os contratos e repõe quem sai, com o caixa do clube.', 'Without you there, the assistant picks the team, renews contracts and replaces whoever leaves, with the club\'s own till.')}</p>
        <div style={linha}><span>💰 {tr(`Caixa próprio do ${p.seg.nome}`, `${p.seg.nome} own till`)}</span><b style={{ ...OSW, color: p.seg.caixa < 0 ? RED : INK }}>{fmt(p.seg.caixa)}</b></div>
        <p style={nota}>{tr('Troca de comando entre as rodadas, de graça (no seletor aqui em cima).', 'Switch command between rounds, for free (in the selector above).')}</p>
      </div>
      {vermelho && (
        <div style={{ ...box('#FBE0DA'), padding: '9px 11px', marginTop: 9 }}>
          <p style={{ fontFamily: 'system-ui', fontSize: 11, fontWeight: 700, margin: 0, lineHeight: 1.45 }}>🔴 {tr(`Caixa do ${p.seg.nome} sem dinheiro = sem lance no leilão. Destrava vendendo jogador ou com aporte do principal (o aporte não volta).`, `${p.seg.nome} till without money = no bids at the auction. Unlock it by selling a player or with a transfer from the main club (it does not come back).`)}</p>
        </div>
      )}
      {/* 💰 APORTE: só do principal pro 2º clube */}
      <div style={{ ...box(), padding: 10, marginTop: 9 }}>
        <p style={{ ...OSW, fontWeight: 900, fontSize: 13, margin: 0 }}>💰 {tr(`Aporte: ${p.principal.nome} → ${p.seg.nome}`, `Transfer: ${p.principal.nome} → ${p.seg.nome}`)}</p>
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          {[50, 100, 250, 500].map(v => (
            <button key={v} onClick={() => setAporte(v)} style={{ flex: 1, border: `2px solid ${INK}`, borderRadius: 8, padding: '6px 0', ...OSW, fontWeight: 900, fontSize: 12, background: aporte === v ? GOLD : '#fff', cursor: 'pointer' }}>{v}</button>
          ))}
        </div>
        <Botao desligado={p.principal.caixa < aporte} onClick={() => { if (window.confirm(tr(`Mandar ${fmt(aporte)} 🪙 do ${p.principal.nome} pro ${p.seg.nome}? O aporte não volta.`, `Send ${fmt(aporte)} 🪙 from ${p.principal.nome} to ${p.seg.nome}? It does not come back.`))) p.onAporte(aporte) }}>💰 {tr(`Aportar ${fmt(aporte)} 🪙`, `Send ${fmt(aporte)} 🪙`)}</Botao>
        {p.principal.caixa < aporte && <Trava>🪙 {tr(`O ${p.principal.nome} tem ${fmt(p.principal.caixa)} 🪙: não dá pra aportar mais do que tem.`, `${p.principal.nome} has ${fmt(p.principal.caixa)} 🪙: you can't send more than that.`)}</Trava>}
        <p style={nota}>{tr('Só vai do principal pro 2º clube e não volta. Entra na conta do que você investiu.', 'Only goes from the main club to the 2nd club and never comes back. It counts as invested.')}</p>
      </div>

      {/* ⑤ EMPRÉSTIMOS / TRANSFERÊNCIA ENTRE OS SEUS CLUBES */}
      <div style={{ ...box(CREME), padding: 11, marginTop: 10 }}>
        <Cabeca ic="🔁" titulo={tr('Empréstimos', 'Loans')} sub={tr('abre só na janela · virada da temporada', 'only opens in the window · season turn')} />
        {p.emprestimos.map((e, i) => (
          <div key={i} style={linha}><span>{e.pos} · {e.nome}</span><b style={OSW}>{e.de === p.principal.id ? `${p.principal.nome} → ${p.seg.nome}` : `${p.seg.nome} → ${p.principal.nome}`}</b></div>
        ))}
        {!p.janela && <Trava>{JANELA_TXT()}</Trava>}
        {p.janela && (
          <div style={{ display: 'flex', gap: 6, marginTop: 7 }}>
            <button onClick={() => setAba(a => a === 'emp' ? null : 'emp')} style={{ flex: 1, border: `2.5px solid ${INK}`, borderRadius: 10, padding: 8, ...OSW, fontWeight: 900, fontSize: 12, background: aba === 'emp' ? GOLD : '#fff', cursor: 'pointer' }}>🔁 {tr('Emprestar', 'Loan')}</button>
            <button onClick={() => setAba(a => a === 'transf' ? null : 'transf')} style={{ flex: 1, border: `2.5px solid ${INK}`, borderRadius: 10, padding: 8, ...OSW, fontWeight: 900, fontSize: 12, background: aba === 'transf' ? GOLD : '#fff', cursor: 'pointer' }}>🤝 {tr('Transferir de vez', 'Transfer for good')}</button>
          </div>
        )}
        {p.janela && aba === 'emp' && (<>
          {lista(p.principal, p.seg, p.jogPrincipal, 'emp')}
          {lista(p.seg, p.principal, p.jogSeg, 'emp')}
        </>)}
        {p.janela && aba === 'transf' && (p.transfFeita
          ? <Trava>🤝 {tr('Já teve uma transferência de vez nesta janela. A próxima, só na virada que vem.', 'There was already a transfer for good in this window. The next one only at the next season turn.')}</Trava>
          : <>
            {lista(p.principal, p.seg, p.jogPrincipal, 'transf')}
            {lista(p.seg, p.principal, p.jogSeg, 'transf')}
          </>)}
        <p style={nota}>{tr('Empréstimo: vale 1 temporada e volta sozinho no fim. Metade do salário pra cada clube. Transferência de vez: pelo valor oficial, sai do caixa de um e entra no do outro, salário e contrato vão junto. 1 por janela.', 'Loan: lasts 1 season and comes back by itself. Half the wages for each club. Transfer for good: at the official value, out of one till and into the other, wages and contract go with him. 1 per window.')}</p>
      </div>

      {/* ⑦ VENDER O 2º CLUBE PELA COLEÇÃO DE TAÇAS */}
      <div style={{ ...box(CREME), padding: 11, marginTop: 10 }}>
        <Cabeca ic="💸" titulo={tr(`Vender o ${p.seg.nome}`, `Sell ${p.seg.nome}`)} sub={tr(`você investiu ${fmt(p.venda.investido)}`, `you invested ${fmt(p.venda.investido)}`)} />
        <p style={{ ...OSW, fontWeight: 900, fontSize: 13, margin: 0, textTransform: 'uppercase' }}>{tr('Taças ganhas com você', 'Trophies won with you')} · {p.tacas.length} {tr('de', 'of')} {TACAS_SAF2.length}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginTop: 6 }}>
          {TACAS_SAF2.map(t => (
            <div key={t} style={{ border: `2.5px solid ${set.has(t) ? INK : 'rgba(0,0,0,.2)'}`, borderRadius: 10, padding: '7px 2px', textAlign: 'center', background: '#fff', opacity: set.has(t) ? 1 : .45 }}>
              <div style={{ fontSize: 20, filter: set.has(t) ? 'none' : 'grayscale(1)' }}>🏆</div>
              <div style={{ ...OSW, fontWeight: 800, fontSize: 10 }}>{tr(TACA_NOME[t].pt, TACA_NOME[t].en)}</div>
            </div>
          ))}
        </div>
        <div style={linha}><span>{tr('Sem taça', 'No trophy')}{p.venda.antigo ? tr(' (piso do 2º clube antigo)', ' (old 2nd club floor)') : ''}</span><b style={OSW}>{fmt(p.venda.antigo ? Math.max(3000, valorTacas(0)) : valorTacas(0))}</b></div>
        <div style={{ ...linha, background: '#FFF3CF' }}><span>{tr(`Com ${p.tacas.length} ${p.tacas.length === 1 ? 'taça' : 'taças'} (hoje)`, `With ${p.tacas.length} ${p.tacas.length === 1 ? 'trophy' : 'trophies'} (today)`)}</span><b style={{ ...OSW, color: lucro > 0 ? GREEN : lucro < 0 ? RED : INK }}>{fmt(p.venda.base)} · {sinal(lucro)}</b></div>
        <div style={linha}><span>{tr('Com as 6', 'With all 6')}</span><b style={{ ...OSW, color: GREEN }}>{fmt(valorTacas(6))}</b></div>
        <div style={linha}><span>{tr('+ caixa dele', '+ its till')}</span><b style={{ ...OSW, color: p.venda.caixa < 0 ? RED : INK }}>{fmt(p.venda.caixa)}</b></div>
        {!vendendo
          ? <Botao cor="#fff" desligado={!p.janela || p.ativoId === p.seg.id} onClick={() => setVendendo(true)}>💸 {tr(`Vender por ${fmt(p.venda.total)} 🪙`, `Sell for ${fmt(p.venda.total)} 🪙`)}</Botao>
          : <div style={{ display: 'flex', gap: 7, marginTop: 9 }}>
              <button onClick={() => setVendendo(false)} style={{ flex: 1, border: `2.5px solid ${INK}`, borderRadius: 10, padding: 9, ...OSW, fontWeight: 900, fontSize: 12, background: '#fff', cursor: 'pointer' }}>{tr('Voltar', 'Back')}</button>
              <button onClick={() => { setVendendo(false); p.onVender() }} style={{ flex: 1.4, border: `2.5px solid ${INK}`, borderRadius: 10, padding: 9, ...OSW, fontWeight: 900, fontSize: 12.5, background: RED, color: '#fff', boxShadow: `2px 2px 0 0 ${INK}`, cursor: 'pointer' }}>💸 {tr('Confirmar venda', 'Confirm sale')}</button>
            </div>}
        {!p.janela && <Trava>{JANELA_TXT()}</Trava>}
        {p.janela && p.ativoId === p.seg.id && <Trava>🔄 {tr('Passe o comando pro seu clube principal pra vender o 2º clube (o principal nunca se vende).', 'Hand command back to your main club to sell the 2nd club (the main club is never sold).')}</Trava>}
        <p style={nota}>{tr('Cada taça conta uma vez só. Copa do Mundo não conta. Ganhar a mesma taça de novo não muda o valor. O clube continua no jogo, comandado pela máquina.', 'Each trophy counts once. The World Cup does not count. Winning the same trophy again does not change the value. The club stays in the game, run by the computer.')}</p>
      </div>
    </div>
  )
}

// ⑧ "O jogo mudou" — quem tem SAF e 2º clube SEPARADOS escolhe UM (aparece na virada; ninguém perde dinheiro)
export function Saf2Migracao(p: { saf: { nome: string; div: string }; clube: { nome: string; div: string }; janela: boolean; onEscolher: (fica: '2o' | 'saf') => void; onDepois?: () => void }) {
  const card = (titulo: string, sub: string, sai: string, recebe: number, botao: string, fica: '2o' | 'saf', extra?: string) => (
    <div style={{ ...box(), padding: 11, marginTop: 10 }}>
      <p style={{ ...OSW, fontWeight: 900, fontSize: 15, margin: 0, textTransform: 'uppercase' }}>{titulo}</p>
      <p style={{ fontFamily: 'system-ui', fontSize: 10.5, fontWeight: 600, color: 'rgba(0,0,0,.55)', margin: '1px 0 0' }}>{sub}</p>
      <div style={linha}><span>{sai}</span><b style={{ ...OSW, color: GREEN }}>+{fmt(recebe)}</b></div>
      <Botao cor={GREEN} tinta="#fff" desligado={!p.janela} onClick={() => { if (window.confirm(botao + '?')) p.onEscolher(fica) }}>{botao}</Botao>
      {extra && <p style={nota}>{extra}</p>}
    </div>
  )
  return (
    <div style={{ ...box(CREME), padding: 12 }}>
      <Cabeca ic="📣" titulo={tr('O jogo mudou', 'The game changed')} sub={tr('aparece uma vez, na virada da temporada', 'shows up once, at the season turn')} />
      <div style={{ ...box(), padding: 10 }}>
        <p style={{ fontFamily: 'system-ui', fontSize: 12, fontWeight: 600, margin: 0, lineHeight: 1.5 }}>{tr('Agora a SAF e o 2º clube são um clube só. Você tem os dois separados, então escolha qual quer manter. Ninguém perde dinheiro.', 'Now the SAF and the 2nd club are a single club. You have both separately, so pick which one to keep. Nobody loses money.')}</p>
      </div>
      {card(tr('Ficar com o 2º clube', 'Keep the 2nd club'), `${p.clube.nome} · ${divNome(p.clube.div)}`, tr(`A SAF ${p.saf.nome} sai, você recebe`, `The ${p.saf.nome} SAF goes, you get`), REEMBOLSO_SAF, tr(`Ficar com o ${p.clube.nome}`, `Keep ${p.clube.nome}`), '2o')}
      {card(tr('Ficar com a SAF', 'Keep the SAF'), `${p.saf.nome} · ${divNome(p.saf.div)}`, tr(`O 2º clube ${p.clube.nome} sai, você recebe`, `The 2nd club ${p.clube.nome} goes, you get`), REEMBOLSO_2O_CLUBE, tr(`Ficar com a ${p.saf.nome}`, `Keep ${p.saf.nome}`), 'saf',
        tr(`A ${p.saf.nome} já pode virar seu 2º clube na hora, sem esperar ${TEMPORADAS_PRA_ASSUMIR} temporadas (o caixa do ${p.clube.nome} também volta pro principal).`, `${p.saf.nome} can become your 2nd club right away, no ${TEMPORADAS_PRA_ASSUMIR}-season wait (the ${p.clube.nome} till also goes back to your main club).`))}
      {!p.janela && <Trava>{JANELA_TXT()}</Trava>}
      {p.onDepois && <button onClick={p.onDepois} style={{ width: '100%', marginTop: 8, background: 'transparent', border: 'none', fontWeight: 800, fontSize: 11, color: 'rgba(0,0,0,.5)', textDecoration: 'underline', cursor: 'pointer' }}>{tr('decidir depois (fica na aba Clube › Estrutura)', 'decide later (it stays in Club › Facilities)')}</button>}
    </div>
  )
}
