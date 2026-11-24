import type { Sector } from './types'
import type { PerfilBot } from './perfis-bot'

/** Reversão local: desligar mantém a rotina anterior, sem migrar elencos. */
export const MERCADO_BOTS_OFICIAL_GLOBAL = true
export const TRANSFERENCIAS_OFICIAIS = true

type Atleta = { name: string; club: string; pos: Sector; lo: number; hi: number; fake?: boolean; cria?: boolean; emprestado?: unknown }
export type ClubeMercado<T extends Atleta> = {
  chave: string; nome: string; div: string; squad: T[]; need: Record<Sector, number>
  caixa: number; compromissos: number; perfil: PerfilBot
}
const POS: Sector[] = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']
const PARTE: Record<PerfilBot, number> = { gastador:.6, paoduro:.25, obcecado:.4, imprevisivel:.45, equilibrado:.35 }
const nivel = (c: Atleta) => (c.lo+c.hi)/2
function hash(s: string, seed: number) { let n=seed>>>0;for(let i=0;i<s.length;i++)n=Math.imul(n^s.charCodeAt(i),16777619)>>>0;return n }

/** O dono aceita negociar um reserva, preservando XI e cobertura real. A mesma
 * disponibilidade é usada na sondagem humana; nunca põe titular à venda à força. */
export function reservaNegociavel<T extends Atleta>(squad: readonly T[], card: T, need: Record<Sector,number>, identidade:(c:T)=>string): boolean {
  if(card.fake||card.cria||card.emprestado)return false
  const fila=squad.filter(c=>c.pos===card.pos&&!c.fake&&!c.cria&&!c.emprestado)
    .sort((a,b)=>nivel(b)-nivel(a)||identidade(a).localeCompare(identidade(b)))
  const indice=fila.findIndex(c=>identidade(c)===identidade(card))
  return indice>=need[card.pos] && fila.length-1>=Math.ceil(need[card.pos]*1.5)
}

/** Mercado anual pago: a mesma decisão por elenco/orçamento, sem força-base por divisão.
 * A ordem muda a cada temporada, sem prioridade fixa do clube humano ou dos ricos.
 * Transferência opcional: só reserva disponível, sem negócio com o humano à força.
 */
export function mercadoAnualOficial<T extends Atleta>(args: {
  clubes: ClubeMercado<T>[]; catalogo: T[]; ocupados: ReadonlySet<string>; seed: number; season: number
  identidade: (c:T)=>string; elegivel: (div:string,c:T)=>boolean; preco: (c:T)=>number
  salario: (c:T)=>number; contratar: (c:T,clube:ClubeMercado<T>,preco:number,n:number)=>T
  transferencias?: boolean; protegidos?: ReadonlySet<string>
}) {
  const {identidade}=args,usados=new Set(args.ocupados),negociados=new Set<string>()
  const catalogo=[...new Map(args.catalogo.filter(c=>!c.fake&&!c.cria&&!c.emprestado).map(c=>[identidade(c),c])).values()]
  const movimentos:{clube:string;entra:string;sai?:string;preco:number;tipo:'titular'|'banco';vendedor?:string}[]=[]
  const clubes=args.clubes.map(c=>({...c,squad:[...c.squad]})).sort((a,b)=>hash(a.nome,args.seed^Math.imul(args.season,7919))-hash(b.nome,args.seed^Math.imul(args.season,7919))||a.chave.localeCompare(b.chave))
  // Lista de disponibilidade da abertura: evita reordenar todos os elencos para
  // cada comprador. Posse e cobertura ainda são conferidas no momento da oferta.
  const reservas=new Map(POS.map(p=>[p,[] as {c:T;d:ClubeMercado<T>}[]]))
  if(args.transferencias)for(const d of clubes)for(const c of d.squad)if(!args.protegidos?.has(identidade(c))&&reservaNegociavel(d.squad,c,d.need,identidade))reservas.get(c.pos)!.push({c,d})
  for(const clube of clubes){
    const comprometido=Math.max(0,clube.compromissos),livre=Math.max(0,clube.caixa-comprometido)
    let verba=Math.min(livre,Math.max(0,Math.floor(clube.caixa*PARTE[clube.perfil]))),folhaExtra=0
    const reais=(p:Sector)=>clube.squad.filter(c=>c.pos===p&&!c.fake&&!c.cria&&!c.emprestado).sort((a,b)=>nivel(b)-nivel(a))
    const custoFolha=(c:T,sai?:T)=>Math.max(0,args.salario(c)-(sai?args.salario(sai):0))
    const cabe=(c:T,sai?:T,teto=verba)=>{
      const preco=args.preco(c),extra=custoFolha(c,sai)
      return preco>0&&preco<=Math.min(verba,teto)&&clube.caixa-preco>=comprometido+folhaExtra+extra
    }
    const livres=(p:Sector)=>catalogo.filter(c=>c.pos===p&&!usados.has(identidade(c))&&args.elegivel(clube.div,c))
    let transferiu=false
    const ofertas=(p:Sector)=>!args.transferencias||transferiu?[]:reservas.get(p)!.filter(({c,d})=>d!==clube&&!negociados.has(identidade(c))&&d.squad.includes(c)&&args.elegivel(clube.div,c)&&d.squad.filter(x=>x.pos===p&&!x.fake&&!x.cria&&!x.emprestado).length-1>=Math.ceil(d.need[p]*1.5))
    const compra=(c:T,tipo:'titular'|'banco',sai?:T,vendedor?:ClubeMercado<T>)=>{
      const preco=args.preco(c);verba-=preco;clube.caixa-=preco;folhaExtra+=custoFolha(c,sai)
      if(vendedor){
        vendedor.squad=vendedor.squad.filter(x=>identidade(x)!==identidade(c));vendedor.caixa+=preco
        negociados.add(identidade(c));transferiu=true
      }
      if(sai){clube.squad=clube.squad.filter(x=>x!==sai);usados.delete(identidade(sai))}
      usados.add(identidade(c));clube.squad.push(args.contratar(c,clube,preco,movimentos.length))
      negociados.add(identidade(c)) // não revende a contratação desta mesma janela
      movimentos.push({clube:clube.nome,entra:identidade(c),...(sai?{sai:identidade(sai)}:{}),preco,tipo,...(vendedor?{vendedor:vendedor.nome}:{})})
    }
    // Primeiro melhora uma vaga DO XI, não o pior reserva. Mantém o antigo
    // titular no banco quando há espaço; só libera excedente da mesma posição.
    for(let k=0;k<(clube.perfil==='gastador'?2:1);k++){
      let melhor:{c:T;sai?:T;ganho:number;preco:number;vendedor?:ClubeMercado<T>}|undefined
      for(const p of POS){
        const meus=reais(p),titular=meus[clube.need[p]-1]
        if(!titular)continue // mínimo é reparado pelo fluxo nativo, nunca por atleta fictício
        const sai=meus.length>=clube.need[p]*2?meus[meus.length-1]:undefined
        for(const {c,d} of [...livres(p).map(c=>({c,d:undefined as ClubeMercado<T>|undefined})),...ofertas(p)]){
          const ganho=nivel(c)-nivel(titular),preco=args.preco(c)
          if(ganho<3||!cabe(c,sai))continue
          if(!melhor||ganho>melhor.ganho||(ganho===melhor.ganho&&preco<melhor.preco))melhor={c,sai,ganho,preco,vendedor:d}
        }
      }
      if(!melhor)break
      compra(melhor.c,'titular',melhor.sai,melhor.vendedor)
    }
    // Depois distribui a verba restante entre as vagas do banco, por cobertura.
    const vagas:Sector[]=[]
    for(const p of POS)for(let k=reais(p).length;k<clube.need[p]*2;k++)vagas.push(p)
    vagas.sort((a,b)=>reais(a).length/clube.need[a]-reais(b).length/clube.need[b]||POS.indexOf(a)-POS.indexOf(b))
    for(let k=0;k<vagas.length;k++){
      const teto=Math.floor(verba/(vagas.length-k)),cands=livres(vagas[k]).filter(c=>cabe(c,undefined,teto)).sort((a,b)=>nivel(b)-nivel(a)||args.preco(a)-args.preco(b)||identidade(a).localeCompare(identidade(b)))
      if(cands[0])compra(cands[0],'banco')
    }
  }
  return {clubes,movimentos}
}
