import {PLANTA_COMPLEXO} from './presidencia-complexo-model'
import {TERRENO_USUARIO as HOME} from './residencia-planta'
import {LOTE_AGENCIA_CLUBE} from './clube-mapa-destinos'
import {LOTE_MUSEU_CLUBE} from './museu-clube-predio'
import type {DestinoPasseio} from './presidencia-fanzone-3d'
import type {DestinoClubeMapa} from './clube-mapa-destinos'

export function destinosDoPasseio({gestao,agencia,museu,loja}:{gestao:boolean;agencia:boolean;museu:boolean;loja:boolean}):DestinoPasseio[]{
 const gate=PLANTA_COMPLEXO.gates.home,shop=PLANTA_COMPLEXO.doors.loja.approach
 const out:DestinoPasseio[]=[{id:'portao',nome:['Portão da torcida','Supporters gate'],x:gate.approach.x,z:gate.threshold.z+6}]
 if(!gestao)return out
 out.push({id:'casa',nome:['Minha casa','My home'],x:HOME.house.x,z:HOME.house.z+HOME.house.depth/2+1.3,acao:['Entrar na casa','Enter home']},
  {id:'loja',nome:loja?['Loja da torcida','Supporters store']:['Terreno da loja','Store plot'],...shop,acao:loja?['Ver loja','View store']:['Ver melhorias','View improvements']},
  {id:'patrocinio',nome:['Patrocínios do clube','Club sponsorships'],x:-8,z:115,acao:['Ver patrocínios','View sponsorships']},
  {id:'financas',nome:['Gestão do clube','Club management'],x:8,z:115,acao:['Abrir finanças','Open finances']})
 if(agencia)out.push({id:'agencia',nome:['Minha agência','My agency'],...LOTE_AGENCIA_CLUBE.visit[2],acao:['Entrar na agência','Enter agency']})
 if(museu)out.push({id:'museu',nome:['Museu do clube','Club museum'],x:LOTE_MUSEU_CLUBE.x,z:LOTE_MUSEU_CLUBE.building.minZ-1.2,acao:['Ver museu','View museum']})
 return out
}
export function painelDoPasseio(id:string,loja:boolean):DestinoClubeMapa|null{
 if(id==='casa')return'presidencia'
 if(id==='loja')return loja?'loja':'estrutura'
 if(['agencia','museu','patrocinio','financas'].includes(id))return id as DestinoClubeMapa
 return null
}
