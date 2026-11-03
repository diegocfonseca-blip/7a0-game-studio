// 🏢 03/11 (Diego: *"deixe clicar e aparecer algo sobre a empresa, tipo um banner com logo, link e informações dela… já a Vadico
// terá isso também, porém também terá como comprar carros"*): o cartão que abre ao tocar no prédio de cada patrocinador do mapa.
// Os textos e links são os MESMOS do telão (`patrocinio.ts`, reserva das linhas de `esc_anuncios_fixos`) — nada inventado.
import {LOGOS_PATROCINADORES_CIDADE,type PatrocinadorCidadeId} from './presidencia-patrocinadores-planta'

export interface InfoPatrocinador {
 nome:string
 logo:{src:string;width:number;height:number;background:string}
 pt:string;en:string
 link:string;linkPt:string;linkEn:string
}
export const INFO_PATROCINADORES:Record<PatrocinadorCidadeId,InfoPatrocinador>={
 vadico:{nome:'Vadico Veículos',logo:LOGOS_PATROCINADORES_CIDADE.vadico,
  pt:'45 anos de empresa familiar. Garantia e documento no nome da loja, sem carro de leilão. Itaguaí e Barra da Tijuca.',
  en:'A family business for 45 years. Warranty and papers in the dealer\'s name, no auction cars. Itaguaí and Barra da Tijuca.',
  link:'https://vadicoveiculos.com.br',linkPt:'🔗 Ver o site da Vadico',linkEn:'🔗 Visit Vadico\'s website'},
 dsouza:{nome:'dSouza Empreendimentos',logo:LOGOS_PATROCINADORES_CIDADE.dsouza,
  pt:'Quadros do seu time pra decorar a parede. Frete grátis.',
  en:'Framed prints of your club to decorate your wall. Free shipping.',
  link:'https://www.mercadolivre.com.br/pagina/dsouzaempreendimentos/futebol',linkPt:'🔗 Ver os quadros',linkEn:'🔗 See the prints'},
 tidex:{nome:'Tidex',logo:LOGOS_PATROCINADORES_CIDADE.tidex,
  pt:'Sua empresa aparece no ChatGPT? A Tidex coloca a sua marca dentro das IAs.',
  en:'Does your company show up on ChatGPT? Tidex puts your brand inside the AIs.',
  link:'https://wa.me/5511981181888?text='+encodeURIComponent('Olá! Vim pelo Leilão Legends e queria saber como ter minha empresa no ChatGPT.'),linkPt:'💬 Falar com a Tidex',linkEn:'💬 Talk to Tidex'},
 oittolabs:{nome:'OittoLabs',logo:LOGOS_PATROCINADORES_CIDADE.oittolabs,
  pt:'Contabilidade e BPO financeiro pra sua empresa ou pessoa física.',
  en:'Accounting and financial BPO for your company or for you.',
  link:'https://oittolabs.com.br',linkPt:'🔗 Ver o site da OittoLabs',linkEn:'🔗 Visit OittoLabs\' website'},
 gecg:{nome:'Grêmio Esportivo Campo Grande',logo:LOGOS_PATROCINADORES_CIDADE.gecg,
  pt:'Clube com estádio próprio em Jurubatuba, Zona Sul de SP. Jogos nos fins de semana e aluguel do campo pra torneios.',
  en:'A club with its own stadium in Jurubatuba, south São Paulo. Weekend matches and pitch rental for tournaments.',
  link:'https://www.instagram.com/gremiocampo',linkPt:'📸 Ver o Instagram do clube',linkEn:'📸 See the club\'s Instagram'},
}
export const ehPatrocinadorCidade=(v:string):v is PatrocinadorCidadeId=>v in INFO_PATROCINADORES
