// 🎟️ LOTAÇÃO DO JOGO no mapa (03/11, Diego: "a bilheteria de verdade enche o estádio… estádio vazio quando o time vai mal,
// lotado em clássico e decisão"). Função PURA: não mexe em renda, save nem relógio — só diz quão cheio o estádio do mapa fica
// e QUANTA gente aparece no placar.
// A base é a MESMA régua que paga a bilheteria (`stadiumOccupancy`: colocação na tabela + Estação). Por cima:
//  · a torcida da carreira (torcidômetro) mexe um pouco (±10 pontos);
//  · chuva sem cobertura esfria (a mesma regra que a aba do estádio já mostra);
//  · CLÁSSICO e DECISÃO enchem (piso alto), FINAL lota. Nunca passa da capacidade construída.
import type {StadiumSave} from './estadiodata'
import {stadiumOccupancy,stadiumSeats,sectorPct,hasExtra} from './estadiodata'

/** 'reta' = reta final da liga brigando por título/acesso · 'semi' · 'final' (Copa, Supercopa) */
export type DecisaoJogo='reta'|'semi'|'final'
export type EntradaLotacao={stadium?:StadiumSave;pos?:number;support?:number;rain?:boolean;classico?:boolean;decisao?:DecisaoJogo}
export type LotacaoJogo={lotacao:number;torcedores:number;capacidade:number;motivo:'final'|'classico'|'decisao'|'tabela'|'torcida'}

const PISO={classico:.9,reta:.88,semi:.95} as const
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n))

/** Cobertura (camarote pronto, cobertura ou teto retrátil) protege da chuva. */
export function estadioCoberto(st:StadiumSave|undefined):boolean{
 return sectorPct(st,'camarote')>=100||hasExtra(st,'cober')||hasExtra(st,'retratil')
}

export function lotacaoDoJogo(j:EntradaLotacao):LotacaoJogo{
 const st=j.stadium
 const support=Number.isFinite(j.support)?clamp(j.support!,0,100):50
 const wet=!!j.rain&&!estadioCoberto(st)
 const temPos=Number.isFinite(j.pos)&&j.pos!>=1
 let occ:number
 if(temPos){
  // a mesma ocupação que vira bilheteria no fim da temporada, pela colocação de AGORA
  occ=stadiumOccupancy(Math.floor(j.pos!),st)+(support-50)/500
  if(wet)occ=Math.max(.2,occ-.32)
 }else{
  // sem tabela (ex.: estádio do dono da casa num jogo fora): a regra antiga, só pela torcida
  occ=((wet?Math.max(20,support-32):support)+(hasExtra(st,'estacao')?8:0))/100
 }
 let motivo:LotacaoJogo['motivo']=temPos?'tabela':'torcida'
 if(j.decisao==='final'||(j.classico&&j.decisao)){occ=1;motivo=j.decisao==='final'?'final':'decisao'}
 else{
  if(j.decisao){const piso=PISO[j.decisao];if(occ<piso)motivo='decisao';occ=Math.max(occ+.2,piso)}
  if(j.classico){if(occ<PISO.classico)motivo='classico';occ=Math.max(occ+.25,PISO.classico)}
 }
 const lotacao=clamp(occ,temPos?.06:0,1)
 const capacidade=stadiumSeats(st).now
 return {lotacao,torcedores:Math.min(capacidade,Math.round(capacidade*lotacao)),capacidade,motivo}
}
