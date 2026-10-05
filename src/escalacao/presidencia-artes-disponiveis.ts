import type {PresidenciaItemId} from './presidencia-economia'
import {ARTES_VEICULOS} from './presidencia-veiculos-artes'

// Mesmas peças já aprovadas e usadas na sala. Não vender uma arte inexistente.
export const ARTES_MOBILIAS:Partial<Record<PresidenciaItemId,string>>={
 'cadeira-simples':'cadeira-simples-v49','mesa-simples':'mesa-simples-v50',
 'estante-simples':'estante-simples-v51','cadeira-couro':'cadeira',
 'mesa-madeira':'mesa','estante-madeira':'estante',tapete:'tapete',sofa:'sofa',
 luminaria:'luminaria',lustre:'lustre',quadro:'quadro',aquario:'aquario',planta:'planta',
}
export function arteCatalogoPresidencia(id:PresidenciaItemId){
 const furniture=ARTES_MOBILIAS[id]
 return furniture?'presidencia-moveis/'+furniture+'.webp':ARTES_VEICULOS[id]?.card
}
export function compraPresidenciaDisponivel(id:PresidenciaItemId){
 return !!ARTES_MOBILIAS[id]||!!(ARTES_VEICULOS[id]?.card&&ARTES_VEICULOS[id]?.scene)
}
