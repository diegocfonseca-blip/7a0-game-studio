import type {PresidenciaItemId} from './presidencia-economia'
/** Retratos com fundo NÃO podem ser usados como recortes na cena. */
type ContatoPneu=readonly [x:number,y:number,width:number,height:number]
export const ARTES_VEICULOS:Partial<Record<PresidenciaItemId,{card:string;scene?:string;ground?:{ratio:string;contacts:readonly ContatoPneu[]}}>>={
 fusca:{card:'garagem-v43/fusca.webp',scene:'garagem-v138/fusca.webp',ground:{ratio:'440/235',contacts:[[51,99,20,8],[90,88,14,6],[12,94,14,6]]}},
 chevette:{card:'garagem-v43/chevette.webp',scene:'garagem-v143/chevette.webp',ground:{ratio:'440/202',contacts:[[52,99,18,7],[87,88,12,6],[14,92,16,6]]}},
 'm3-gtr':{card:'garagem-v44/m3-gtr.webp',scene:'garagem-v44/m3-gtr.webp',ground:{ratio:'440/208',contacts:[[62,98,22,8],[96,79,11,6]]}},
 'fat-boy':{card:'garagem-v44/fat-boy.webp',scene:'garagem-v44/fat-boy.webp',ground:{ratio:'360/294',contacts:[[12,81,23,7],[77,98,29,8]]}},
}
