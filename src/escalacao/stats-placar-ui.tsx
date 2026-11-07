// 📊 O RESUMO DO APITO NO PLACAR CINEMA (07/11). O desenho é o MESMO cartão do Campo 2D (`ResumoApitoCampo2D`), com as MESMAS cores
// de camisa que o campinho daria (batismo veste o manto; no choque o visitante troca) — a conta mora em stats-placar.ts.
// Quem chama só monta isto DEPOIS do apito (`statsPlacarVisivel`): antes disso não existe nem a conta.
import { useEffect, useMemo, useState } from 'react'
import { camisasDoJogo } from './camisas-2d'
import { kitDoTime } from './camisas-2d-dados'
import { CARIMBO_GOL } from './mascotes'
import { nomeLimpo } from './escudos'
import { ResumoApitoCampo2D } from './campo2d-resumo-ui'
import type { ResumoCampo2D } from './campo2d-resumo'
import { contaResumoDoPlacar, resumoGuardado, type EntradaStats } from './stats-placar'

const sigla = (nome: string) => nomeLimpo(nome).replace(/[^A-Za-zÀ-ú ]/g, '').trim().slice(0, 3).toUpperCase()
const mascoteFixa = (n: string): string | undefined => CARIMBO_GOL[n]

/** `craqueRadio`: o ⭐ CRAQUE DO JOGO que a Rádio Legends do placar já anunciou no apito — quando existe, o cartão usa o MESMO
 *  (a mesma pessoa nos dois lugares); sem ele, vale o ⭐ do motor, igual no 2D. */
export function StatsDoPlacar({ entrada, corCasa, corFora, craqueRadio }: { entrada: EntradaStats; corCasa: string; corFora: string; craqueRadio?: { name: string; home: boolean } | null }) {
  // (a chave do jogo: trocar de jogo refaz a conta; re-render do mesmo jogo não)
  const k = useMemo(() => JSON.stringify(entrada), [entrada])
  const [resumo, setResumo] = useState<{ k: string; r: ResumoCampo2D } | null>(() => { const r = resumoGuardado(entrada); return r ? { k, r } : null })
  useEffect(() => contaResumoDoPlacar(entrada, r => setResumo({ k, r })), [k]) // eslint-disable-line react-hooks/exhaustive-deps
  const kc = kitDoTime(entrada.casa.nome, corCasa || '#C2452F', mascoteFixa).join(','), kf = kitDoTime(entrada.fora.nome, corFora || '#2B6CFF', mascoteFixa).join(',')
  const [camC, camF] = useMemo(() => camisasDoJogo(kc.split(','), kf.split(',')), [kc, kf])
  if (!resumo || resumo.k !== k) return null
  return (
    <div data-stats-placar style={{ display: 'flex', justifyContent: 'center', padding: '0 0 8px' }}>
      <ResumoApitoCampo2D resumo={craqueRadio ? { ...resumo.r, craque: { nome: craqueRadio.name, lado: craqueRadio.home ? 0 : 1 } } : resumo.r}
        casa={{ nome: entrada.casa.nome, sigla: sigla(entrada.casa.nome), cor: camC.cor }}
        fora={{ nome: entrada.fora.nome, sigla: sigla(entrada.fora.nome), cor: camF.cor }} />
    </div>
  )
}
