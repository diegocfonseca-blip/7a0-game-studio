// ─── 📢 FAIXA "TEM VERSÃO NOVA" NA HOME ──────────────────────────────────────
// Pedido do Diego (11/09): *"coloque um banner com a atualização que fizemos.
// Quando a pessoa fechar não deve aparecer mais — pra todos isso. Além disso
// pede pra atualizar pra versão nova que tem muitas novidades"*. Ele escolheu
// o formato **A · faixa fixa no topo** no mockup
// (`scripts/mockup-banner-atualizar.mjs`).
//
// Regras que valem aqui, e o porquê de cada uma:
//
// 1. **Fecha uma vez, nunca mais volta NAQUELE aparelho.** A marca fica no
//    `localStorage` do navegador — não vai pro banco, não depende de estar
//    logado e não aparece pra mesma pessoa em outro celular (lá é outro
//    aparelho, outra marca). Foi o que ele pediu, duas vezes, na mesma
//    mensagem.
// 2. **A chave tem VERSÃO no nome.** Este aviso é o `v1`: quem fechou, fechou
//    pra sempre. Se um dia ele quiser avisar de outra leva, nasce um `v2` com
//    texto novo — e aí sim volta a aparecer, pra quem fechou o v1 também.
//    Sem isso a gente ficaria sem jeito de avisar de novo, ou pior: reusaria a
//    mesma chave e o aviso voltaria do nada pra quem já tinha fechado.
// 3. **Só na HOME.** A faixa é desenhada dentro da home ilustrada; ela não
//    existe no leilão, na carreira nem no online. Nada de barra cobrindo o
//    cabeçalho do pregão no meio de um lance.
// 4. **O botão só recarrega a página.** O site é servido pelo GitHub Pages e
//    cada build tem arquivos com nome novo; recarregar já traz a versão nova.
//    Não mexe em save, em conta, em sala nem em nada do jogo.
// 5. **localStorage pode explodir** (janela anônima, site bloqueado). Por isso
//    toda leitura/escrita está em try/catch: se não der pra gravar, o pior que
//    acontece é o aviso aparecer de novo na próxima visita — nunca uma tela
//    branca.
import { useState } from 'react'
import { tr } from './lang' // 🌐 BR/EN

const CHAVE = 'esc-aviso-versao-v1'
const GOLD = '#FFC400', INK = '#0C0C0C', GREEN = '#1B7A3D'

function jaFechou(): boolean {
  try { return localStorage.getItem(CHAVE) === 'fechado' } catch { return false }
}
function marcaFechado(): void {
  try { localStorage.setItem(CHAVE, 'fechado') } catch { /* sem localStorage: só não guarda */ }
}

export function AvisoVersaoNova() {
  const [aberto, setAberto] = useState(() => !jaFechou())
  if (!aberto) return null
  const fechar = () => { marcaFechado(); setAberto(false) }
  const atualizar = () => {
    marcaFechado()
    try { window.location.reload() } catch { setAberto(false) }
  }
  return (
    <>
      {/* A home ilustrada gruda o cabeçalho e o botão de som no topo. Enquanto a
          faixa estiver aberta os dois descem a ALTURA FIXA dela (56 px) — por
          isso o texto é de uma linha só com reticências: altura que muda de
          tamanho desalinharia o que está embaixo. */}
      <style>{[
        '.ll-home:has(.ll-aviso) .ll-header{top:calc(26px + 56px)}',
        '#root:has(.ll-aviso) button[aria-label="Desligar som"],#root:has(.ll-aviso) button[aria-label="Ligar som"]{top:calc(26px + 56px)!important}',
        '@media(max-width:650px){.ll-home:has(.ll-aviso) .ll-header{top:calc(16px + 56px)}',
        '#root:has(.ll-aviso) button[aria-label="Desligar som"],#root:has(.ll-aviso) button[aria-label="Ligar som"]{top:calc(16px + 56px)!important}}',
      ].join('')}</style>
      <div className="ll-aviso" role="status" style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 6, height: 56, boxSizing: 'border-box',
        background: GOLD, borderBottom: `4px solid ${INK}`,
        display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px',
        fontFamily: "Oswald, 'Arial Narrow', system-ui, sans-serif", color: INK,
      }}>
        <span style={{ fontSize: 21, lineHeight: 1 }} aria-hidden="true">🔨</span>
        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 13.5, lineHeight: 1.15, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {tr('As lendas ganharam cara', 'The legends got a new face')}
          </p>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 11, lineHeight: 1.2, color: 'rgba(12,12,12,.62)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {tr('saiu versão nova — toque em atualizar', 'new version out — tap to update')}
          </p>
        </div>
        <button onClick={atualizar} style={{
          fontFamily: 'inherit', fontWeight: 800, fontSize: 12, whiteSpace: 'nowrap',
          background: GREEN, color: '#fff', border: `2px solid ${INK}`, borderRadius: 999,
          padding: '7px 13px', cursor: 'pointer',
        }}>{tr('ATUALIZAR', 'UPDATE')}</button>
        <button onClick={fechar} aria-label={tr('Fechar aviso', 'Close notice')} style={{
          fontFamily: 'inherit', fontWeight: 800, fontSize: 18, lineHeight: 1,
          background: 'transparent', border: 0, color: 'rgba(12,12,12,.55)',
          padding: '2px 4px', cursor: 'pointer',
        }}>✕</button>
      </div>
    </>
  )
}
