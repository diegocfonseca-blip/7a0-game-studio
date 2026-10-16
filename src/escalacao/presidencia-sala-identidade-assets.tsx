import {renderToStaticMarkup} from 'react-dom/server'
import type {ReactNode} from 'react'
import {Escudo} from './escudos'
import {MASCOTES} from './mascotes'
import {CAMISAS_SALAO,RECORTE_CAMISA} from './salao-camisas'
import type {IdentidadePresidencia} from './presidencia-identidade-conta'
export type ArtesIdentidadeSala={crest?:string;mascot?:string;shirt?:string;shirtCrop?:{width:number;height:number;front:number};color:string}
function imagem(node:ReactNode):string|undefined{
 if(!node||typeof DOMParser==='undefined')return
 const doc=new DOMParser().parseFromString(renderToStaticMarkup(node),'text/html')
 const img=doc.querySelector('img');if(img?.getAttribute('src'))return img.getAttribute('src')!
 const svg=doc.querySelector('svg');if(!svg)return
 svg.setAttribute('xmlns','http://www.w3.org/2000/svg')
 return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg.outerHTML)
}
/** Reuse the same approved crest/mascot/shirt as the account UI. No artwork is
 * inferred from the club's typed name when ownership has not been confirmed. */
export function artesIdentidadeSala(identity?:IdentidadePresidencia):ArtesIdentidadeSala|undefined{
 if(!identity)return
 const shirt=identity.shirt?CAMISAS_SALAO[identity.shirt]:null,cut=identity.shirt?RECORTE_CAMISA[identity.shirt]:null
 return {crest:imagem(<Escudo nome={identity.crest??identity.name} automatic={!identity.crest} size={256}/>),
  mascot:identity.mascot?imagem(MASCOTES[identity.mascot]):undefined,
  shirt:shirt?import.meta.env.BASE_URL+'mantos-salao/'+shirt:undefined,
  shirtCrop:cut?{width:cut[0],height:cut[1],front:cut[2]}:undefined,color:identity.color}
}
