import { perfilDoDia } from './motor2/motor'
import type { CartaCampo, Grupo, Lado } from './motor2/tipos'
import type { EntradaM2 } from './motor2/carreira'
import { assinaturaEntradaM2 } from './motor2/carreira'

const grupo=(c:CartaCampo):Grupo=>c.pos==='GOL'?'GOL':c.pos==='ZAG'?'DEF':c.pos==='LAT'?'LAT':c.pos==='MEI'?'MEI':'ATA'
/** A projeção usa o mesmo nível do dia, técnico e evento; não há bônus por ser bot. */
export function setoresDoDia(e:EntradaM2,lado:Lado) {
  const sums:Record<string,{a:number;d:number;n:number}>={}
  const cartas=lado===0?e.casa:e.fora
  for(const c of cartas){const g=grupo(c),p=perfilDoDia(c,g,lado,{seed:e.seed,tecnico:e.tecnico?.[lado],evento:e.evento?.[lado]}),at=p.perfil.at,f=1+p.forma*.08;
    const v=sums[g]??={a:0,d:0,n:0};v.a+=(at.finalizacao*.45+at.passe*.25+at.visao*.15+at.conducao*.15)*f;v.d+=(g==='GOL'?at.reflexo*.8+at.posicionamento*.2:at.desarme*.6+at.posicionamento*.4)*f;v.n++;
  }
  const avg=(g:string,k:'a'|'d')=>sums[g]?.n?sums[g][k]/sums[g].n:40
  return {ataque:avg('ATA','a')*.5+avg('MEI','a')*.35+avg('LAT','a')*.15,defesa:avg('GOL','d')*.3+avg('DEF','d')*.45+avg('MEI','d')*.15+avg('LAT','d')*.1,atacantes:sums.ATA?.n??0,defensores:(sums.DEF?.n??0)+(sums.LAT?.n??0)}
}
function vetor(e:EntradaM2,lado:Lado,a:ReturnType<typeof setoresDoDia>,b:ReturnType<typeof setoresDoDia>):number[]{return [1,(a.ataque-b.defesa)/20,(a.ataque+b.defesa-140)/20,(a.atacantes-3)/2,(b.defensores-4)/2,e.tatica[lado]??0,e.tatica[(1-lado) as Lado]??0,e.clima==='chuva'?1:0]}
export function variaveisGols(e:EntradaM2,lado:Lado):number[]{return vetor(e,lado,setoresDoDia(e,lado),setoresDoDia(e,(1-lado) as Lado))}

/** Ajuste Poisson em 480 jogos do Motor 2, validado em outros 120.
 *  Não escolhe vencedor, não soma gols ao jogo físico e não altera overalls.
 *  O sorteio e a autoria continuam na simulação leve existente. */
const COEF=[-0.2834866546190519,1.06952004216544,0.18743994281025533,0.36453320686960944,-0.08629681923464766,0.11912193250919201,-0.17583243759846606,-0.10041487643081835] as const
function expDeterministico(x:number):number {
  const k=Math.floor(x/0.6931471805599453),y=x-k*0.6931471805599453
  let term=1,sum=1
  for(let j=1;j<=14;j++){term*=y/j;sum+=term}
  if(k>=0)for(let j=0;j<k;j++)sum*=2
  else for(let j=0;j>k;j--)sum*=.5
  return sum
}
export const projetarGolsDosSetores=(x:readonly number[])=>expDeterministico(Math.max(-6,Math.min(3,x.reduce((n,v,i)=>n+v*COEF[i],0))))
const EXPECTATIVAS=new Map<string,readonly [number,number]>()
export function expectativaBotsCarreira(e:EntradaM2):readonly [number,number] {
  const key=assinaturaEntradaM2(e),hit=EXPECTATIVAS.get(key)
  if(hit)return hit
  const a=setoresDoDia(e,0),b=setoresDoDia(e,1)
  const out:readonly [number,number]=[projetarGolsDosSetores(vetor(e,0,a,b)),projetarGolsDosSetores(vetor(e,1,b,a))]
  if(EXPECTATIVAS.size>=4000)EXPECTATIVAS.delete(EXPECTATIVAS.keys().next().value!)
  EXPECTATIVAS.set(key,out)
  return out
}
