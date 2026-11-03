// 🏆🪧 PATROCINADOR MASTER NO MAPA (03/11, aprovado pelo Diego: *"O Master contratado aparece no mapa. A marca que você fecha
// ganha a placa grande na fachada do estádio e no telão; quando o contrato acaba, a placa sai."*).
//
// Este arquivo é só o RECADO entre a carreira e o mapa: qual marca está com contrato Master ATIVO agora. Ele não importa
// three.js nem arte (fica no pedaço que carrega junto da carreira, e o mapa 3D continua carregando sob demanda). Quem desenha a
// placa é `presidencia-complexo-placas.ts`. Sem contrato = `null` = sem placa (nada de "espaço disponível").
import { masterAtivo, type MasterContrato } from './estadiodata'

let marcaAtual: string | null = null
const ouvintes = new Set<(brandId: string | null) => void>()

/** a marca do Master que o mapa deve mostrar (null = nenhuma) */
export function masterDoMapa(): string | null { return marcaAtual }
/** a carreira avisa a marca de agora; o mapa aberto troca/tira a placa na hora */
export function definirMasterDoMapa(brandId: string | null | undefined) {
  const prox = typeof brandId === 'string' && brandId ? brandId : null
  if (prox === marcaAtual) return
  marcaAtual = prox
  ouvintes.forEach(fn => fn(prox))
}
export function observarMasterDoMapa(fn: (brandId: string | null) => void) { ouvintes.add(fn); return () => { ouvintes.delete(fn) } }

/** A MESMA régua do caixa (`masterAtivo`): a placa só existe enquanto o contrato cobre a temporada de agora. Acabou o prazo
 *  (ou a marca rescindiu — o contrato rescindido termina na temporada da rescisão), devolve null e a placa sai. */
export function marcaMasterAtiva(contratos: Record<number, MasterContrato> | undefined, mgrId: number, seasonNo: number | undefined): string | null {
  const c = contratos?.[mgrId]
  return masterAtivo(c, seasonNo ?? 1) ? c.brandId : null
}
