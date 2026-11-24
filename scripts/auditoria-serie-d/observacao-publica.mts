// Política de bancada: reputação aproximada, sem consultar atributos ocultos do lote.
export type OfertaPublica={name?:string;club?:string;year?:number;pos:string;conhecido?:number;referenciaClube?:number}
const nivelConhecido:Record<string,number>={
 'Pelé':95,'Garrincha':94,'Zico':94,'Romário':93,'Ronaldo':93,'Ronaldinho Gaúcho':92,'Neymar':86,'Julinho':86,
 'Kaká':82,'Lúcio':80,'Casagrande':76,'André Santos':73,'Isla':73,'Gabriel Mercado':74,'Miguel Trauco':71,'Eugenio Mena':72,'Betão':71,'Pará':69,
}
export function estimativaPublica(c:OfertaPublica,div:string){
 if(c.conhecido!=null)return c.conhecido
 const reputacao=c.name&&nivelConhecido[c.name]
 const base=c.referenciaClube!=null?c.referenciaClube-3+(reputacao?reputacao-77:0):reputacao||({D:65,C:69,B:75,A:81}[div]??65)
 // Incerteza de avaliação fixa por informação pública, não por força verdadeira.
 let n=2166136261;for(const ch of `${c.name??'?'}|${c.club??'?'}|${c.year??0}|${c.pos}`)n=Math.imul(n^ch.charCodeAt(0),16777619)>>>0
 return base+(n%7)-3
}
export function reputacaoTecnico(nome:string,div:string){
 return ({'Jorge Jesus':87,'José Mourinho':90,'Pep Guardiola':94,'Carlo Ancelotti':94,'Alex Ferguson':95,'Telê Santana':94,'Luiz Felipe Scolari':89,'César Luis Menotti':88,'Carlos Alberto Parreira':89}[nome]??({D:70,C:78,B:85,A:90}[div]??70))
}
