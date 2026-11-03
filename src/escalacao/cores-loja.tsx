// 🎨 COR ADICIONAL NA LOJA (02/11, Diego — mockup scripts/mockups/cor-adicional.png, "Sim").
// "SUAS CORES": só a cor do PRÓPRIO plano (sem plano → bege · Craque → prata · Lenda/Batismo/Fundador → dourado) + as que comprou;
// toca pra escolher qual usar. "COMPRAR MAIS": as 7 brilhantes que ainda não são dela, R$ 14,90 cada, pra sempre.
// Só compra quem TEM PLANO (o banco também barra: esc_mp_preco_ref devolve nulo). O preto não aparece pra ninguém.
// Escolher/comprar vale na PRÓXIMA sala que a pessoa entrar (o nome com a cor é montado ao entrar).
import { useState } from 'react'
import { tr, getLang } from './lang'
import { APOIO_PERKS, ApoioSheen, CORES_EXTRA, COR_EXTRA_PRECO, minhasCoresExtra, recarregaCores, usarCorExtra, useDireitos, myApoioPerk, logApoio, type CorExtra } from './apoio'
import { PixMP } from './pix-mp'
import { ApoieButton } from './screens'

const INK = '#0C0C0C'
const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 900 } as const
const ORDEM: CorExtra[] = ['roxo', 'verde', 'rosa', 'azul', 'vermelho', 'laranja', 'turquesa']

function Chip({ grad, holo, rotulo, sub, emUso, apagado, onClick }: { grad: string; holo: number; rotulo: string; sub: string; emUso?: boolean; apagado?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} disabled={!onClick} style={{ position: 'relative', overflow: 'hidden', height: 60, border: `3px solid ${INK}`, borderRadius: 12, boxShadow: `3px 3px 0 ${INK}`, background: grad, opacity: apagado ? .45 : 1, cursor: onClick ? 'pointer' : 'default', outline: emUso ? `3px solid ${INK}` : 'none', outlineOffset: 2, padding: 0 }}>
      {holo > 0 && <ApoioSheen holo={holo} dur={3} />}
      <span style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#fff', textShadow: `1px 1px 0 ${INK}` }}>
        <b style={{ ...OSW, fontSize: 14 }}>{rotulo}</b>
        {emUso ? <span style={{ ...OSW, fontSize: 9, letterSpacing: 1, background: INK, borderRadius: 5, padding: '0 5px', marginTop: 2, textShadow: 'none' }}>{tr('EM USO', 'IN USE')}</span>
          : <small style={{ fontSize: 10, fontWeight: 800 }}>{sub}</small>}
      </span>
    </button>
  )
}

export function CoresNaLoja({ h2, sub, card, reais }: { h2: React.CSSProperties; sub: React.CSSProperties; card: React.CSSProperties; reais: (v: number) => string }) {
  useDireitos() // re-renderiza quando o plano/as cores chegam do banco
  const tier = myApoioPerk()?.tier ?? null
  const temPlano = tier === 'prata' || tier === 'ouro'
  const { cores, ativa } = minhasCoresExtra()
  const [comprar, setComprar] = useState<CorExtra | null>(null)
  const [msg, setMsg] = useState('')
  const en = getLang() === 'en'
  const nomeCor = (c: CorExtra) => `${CORES_EXTRA[c].emoji} ${en ? CORES_EXTRA[c].en : CORES_EXTRA[c].nome}`
  const plano = APOIO_PERKS[temPlano ? tier! : 'bege']
  const planoRotulo = tier === 'ouro' ? tr('👑 Dourado', '👑 Gold') : tier === 'prata' ? tr('⭐ Prata', '⭐ Silver') : tr('Bege', 'Beige')
  const usar = async (c: CorExtra | null) => {
    if (c === ativa) return
    setMsg('')
    logApoio(`🎨 usar cor ${c ?? 'do plano'}`)
    setMsg(await usarCorExtra(c) ? tr('✅ Pronto! Vale na próxima sala que você entrar.', '✅ Done! It applies in the next room you join.') : tr('⚠️ Não deu agora. Tenta de novo.', '⚠️ Couldn’t do it now. Try again.'))
  }
  const aVenda = ORDEM.filter(c => !cores.includes(c))
  return <>
    <h2 id="loja-cor" style={h2}>{tr('🎨 Sua cor brilhante', '🎨 Your shiny colour')} <span style={sub}>{tr(`${reais(COR_EXTRA_PRECO)} cada · sua pra sempre`, `${reais(COR_EXTRA_PRECO)} each · yours forever`)}</span></h2>
    <div style={{ ...card }}>
      <div style={{ ...OSW, fontSize: 13, margin: '0 0 6px' }}>✅ {tr('SUAS CORES', 'YOUR COLOURS')} <span style={{ fontFamily: 'Arial, sans-serif', fontSize: 11, fontWeight: 700, color: 'rgba(12,12,12,.55)' }}>{temPlano ? tr('· toque pra escolher qual usar', '· tap to pick which one to use') : ''}</span></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
        <Chip grad={plano.grad} holo={plano.holo} rotulo={planoRotulo} sub={tr('do seu plano', 'your plan’s')} emUso={!temPlano || !ativa} onClick={temPlano ? () => void usar(null) : undefined} />
        {temPlano && cores.map(c => <Chip key={c} grad={CORES_EXTRA[c].grad} holo={.75} rotulo={nomeCor(c)} sub={tr('tocar pra usar', 'tap to use')} emUso={ativa === c} onClick={() => void usar(c)} />)}
      </div>
      {msg && <p style={{ fontSize: 12, fontWeight: 800, margin: '8px 0 0', color: msg.startsWith('⚠️') ? '#C2452F' : '#1B7A3D' }}>{msg}</p>}

      {aVenda.length > 0 && <>
        <div style={{ ...OSW, fontSize: 13, margin: '14px 0 6px' }}>🛒 {tr('COMPRAR MAIS', 'BUY MORE')} <span style={{ fontFamily: 'Arial, sans-serif', fontSize: 11, fontWeight: 700, color: 'rgba(12,12,12,.55)' }}>{tr('· brilham igual ao dourado', '· they shine like gold')}</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {aVenda.map(c => <Chip key={c} grad={CORES_EXTRA[c].grad} holo={.75} rotulo={nomeCor(c)} sub={reais(COR_EXTRA_PRECO)} apagado={!temPlano} emUso={false}
            onClick={temPlano ? () => { logApoio(`🎨 quer comprar cor ${c}`); setComprar(c) } : undefined} />)}
        </div>
      </>}

      {!temPlano ? <div style={{ marginTop: 12, textAlign: 'center' }}>
        <p style={{ fontSize: 13, fontWeight: 800, margin: '0 0 8px' }}>🔒 {tr('Cor nova é pra quem tem plano.', 'New colours are for plan holders.')}</p>
        <ApoieButton startScreen="choice" trigger={open => <button onClick={() => { logApoio('🎨 cor → ver os planos'); open() }} style={{ width: '100%', ...OSW, fontSize: 16, background: '#FFC400', color: INK, border: `3px solid ${INK}`, borderRadius: 12, boxShadow: `3px 3px 0 ${INK}`, padding: '10px', cursor: 'pointer' }}>{tr('⭐ VER OS PLANOS', '⭐ SEE THE PLANS')}</button>} />
      </div>
        : comprar && <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 12.5, fontWeight: 800, margin: '0 0 6px' }}>{tr(`Comprando ${nomeCor(comprar)} · ${reais(COR_EXTRA_PRECO)}. Pagou, ela já fica EM USO.`, `Buying ${nomeCor(comprar)} · ${reais(COR_EXTRA_PRECO)}. Once paid, it’s IN USE right away.`)}</p>
          <PixMP key={`cor-${comprar}`} produto="cor_extra" valor={COR_EXTRA_PRECO} refId={comprar} aoPagar={recarregaCores} />
        </div>}
      <p style={{ fontSize: 11, fontWeight: 700, margin: '10px 0 0', color: 'rgba(12,12,12,.6)', lineHeight: 1.4 }}>{tr('A cor aparece no seu nome nas salas, no chat e no perfil. O selo do plano (👑 ⭐) continua do lado do nome.', 'The colour shows on your name in rooms, chat and profile. Your plan badge (👑 ⭐) stays next to your name.')}</p>
    </div>
  </>
}
