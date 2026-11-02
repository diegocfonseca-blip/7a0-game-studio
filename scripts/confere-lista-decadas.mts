// Confere a lista de docs/lista-cartas-decadas.md contra o baralho de HOJE (nome igual ou sobrenome igual no MESMO baralho).
import { CATALOG, CATALOG_EU, CATALOG_WORLD } from '../src/escalacao/data'
const N = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim()
const L: [string, string, string, number, string][] = [
['BR','Kléber','Corinthians',2002,'LAT'],['BR','Betão','Corinthians',2005,'ZAG'],['BR','Alessandro','Corinthians',2012,'LAT'],['BR','Paulo André','Corinthians',2012,'ZAG'],
['BR','David Braz','Santos',2015,'ZAG'],['BR','Thiago Maia','Santos',2016,'MEI'],['BR','Vitinho','Botafogo',2024,'LAT'],['BR','Mateo Ponte','Botafogo',2024,'LAT'],['BR','Adryelson','Botafogo',2023,'ZAG'],
['BR','Paulo Victor','Grêmio',2019,'GOL'],['BR','Ramiro','Grêmio',2017,'MEI'],['BR','Douglas Santos','Atlético-MG',2015,'LAT'],['BR','Patric','Atlético-MG',2018,'LAT'],['BR','Leonardo Silva','Atlético-MG',2013,'ZAG'],
['BR','Jailson','Palmeiras',2020,'GOL'],['BR','Michael','Flamengo',2021,'ATA'],['BR','Luiz Araújo','Flamengo',2023,'ATA'],['BR','Toninho Cerezo','São Paulo',1993,'MEI'],['BR','Serginho','São Paulo',1997,'LAT'],
['BR','Cantarele','Flamengo',1981,'GOL'],['BR','Zé Carlos','Flamengo',1987,'GOL'],['BR','Marinho','Flamengo',1981,'ZAG'],['BR','Edinho','Flamengo',1987,'ZAG'],['BR','Tita','Flamengo',1981,'MEI'],['BR','Lico','Flamengo',1981,'ATA'],
['BR','Dalmo','Santos',1962,'LAT'],['BR','Mauro Ramos','Santos',1962,'ZAG'],['BR','Mengálvio','Santos',1962,'MEI'],['BR','Dorval','Santos',1962,'ATA'],
['BR','Piazza','Cruzeiro',1976,'ZAG'],['BR','Joãozinho','Cruzeiro',1976,'ATA'],
['BR','Benítez','Internacional',1979,'GOL'],['BR','Marinho Peres','Internacional',1976,'ZAG'],['BR','Carpegiani','Internacional',1975,'MEI'],['BR','Valdomiro','Internacional',1976,'ATA'],['BR','Lula','Internacional',1976,'ATA'],
['BR','Adílson','Grêmio',1995,'ZAG'],['BR','Rivarola','Grêmio',1995,'ZAG'],['BR','Dinho','Grêmio',1995,'MEI'],['BR','Arílson','Grêmio',1995,'MEI'],['BR','Carlos Miguel','Grêmio',1996,'MEI'],
['EU','Samuel Umtiti','Barcelona',2017,'ZAG'],['EU','Javier Mascherano','Barcelona',2012,'ZAG'],['EU','Álvaro Morata','Real Madrid',2016,'ATA'],['EU','Emmanuel Adebayor','Real Madrid',2011,'ATA'],
['EU','David de Gea','Atlético de Madrid',2010,'GOL'],['EU','Saúl Ñíguez','Atlético de Madrid',2016,'MEI'],['EU','Samir Handanović','Inter',2018,'GOL'],['EU','Diego Milito','Inter',2010,'ATA'],
['EU','Christian Abbiati','Milan',2004,'GOL'],['EU','Kakha Kaladze','Milan',2004,'LAT'],['EU','Massimo Oddo','Milan',2007,'LAT'],
['EU','Hans-Jörg Butt','Bayern',2010,'GOL'],['EU','Rafinha','Bayern',2014,'LAT'],['EU','Juan Bernat','Bayern',2015,'LAT'],['EU','Holger Badstuber','Bayern',2012,'ZAG'],['EU','Mario Gómez','Bayern',2011,'ATA'],
['EU','Andriy Lunin','Real Madrid',2024,'GOL'],['EU','Ferland Mendy','Real Madrid',2022,'LAT'],['EU','Lucas Vázquez','Real Madrid',2022,'LAT'],
['EU','Manuel Almunia','Arsenal',2008,'GOL'],['EU','Gaël Clichy','Arsenal',2008,'LAT'],['EU','Martin Keown','Arsenal',2002,'ZAG'],
['EU','Pablo Zabaleta','Man City',2012,'LAT'],['EU','Joleon Lescott','Man City',2012,'ZAG'],['EU','Samir Nasri','Man City',2012,'MEI'],['EU','Leroy Sané','Man City',2018,'ATA'],
['EU','Glen Johnson','Liverpool',2012,'LAT'],['EU','Alberto Moreno','Liverpool',2015,'LAT'],['EU','Jordan Henderson','Liverpool',2019,'MEI'],['EU','Daniel Sturridge','Liverpool',2014,'ATA'],
['EU','Steve Finnan','Liverpool',2005,'LAT'],['EU','Sami Hyypiä','Liverpool',2005,'ZAG'],['EU','Martin Škrtel','Liverpool',2009,'ZAG'],
['EU','Marcos Alonso','Chelsea',2017,'LAT'],['EU','Gary Cahill','Chelsea',2015,'ZAG'],['EU','Yann Sommer','Bayern',2023,'GOL'],['EU','Leon Goretzka','Bayern',2020,'MEI'],['EU','Thilo Kehrer','PSG',2020,'LAT'],
['EU','Sergio Romero','Man United',2017,'GOL'],['EU','Carlos Roa','Mallorca',1998,'GOL'],['EU','Laurent Koscielny','Arsenal',2015,'ZAG'],['EU','Daniele De Rossi','Roma',2006,'MEI'],
['EU','Ricardo','Sporting',2004,'GOL'],['EU','Unai Simón','Athletic Bilbao',2021,'GOL'],['EU','Gregory van der Wiel','Ajax',2012,'LAT'],['EU','Stefan de Vrij','Inter',2019,'ZAG'],
['WORLD','Germán Burgos','River Plate',1999,'GOL'],['WORLD','Justo Villar','Estudiantes',2010,'GOL'],
]
const deck: any = { BR: CATALOG, EU: CATALOG_EU, WORLD: CATALOG_WORLD }
const all = (d: string) => Object.values(deck[d]).flat() as any[]
for (const [d, nome, clube, ano, pos] of L) {
  const n = N(nome), sob = n.split(' ').slice(-1)[0], cs = all(d)
  const igual = cs.filter(c => N(c.name) === n)
  const parecido = cs.filter(c => N(c.name) !== n && (N(c.name).split(' ').includes(sob) || n.split(' ').includes(N(c.name).split(' ').slice(-1)[0])) && sob.length > 3)
  const outros = Object.keys(deck).filter(o => o !== d && all(o).some(c => N(c.name) === n))
  const tag = igual.length ? 'JA_TEM' : parecido.length ? 'CONFERIR' : 'OK'
  console.log(`${tag}\t${d}\t${pos}\t${nome} (${clube} ${ano})` + (igual.length ? `  ⇒ ${igual.map(c => `${c.name}/${c.club} ${c.year}`).join('; ')}` : '') + (parecido.length ? `  ~ ${parecido.map(c => `${c.name}/${c.club} ${c.year}`).join('; ')}` : '') + (outros.length ? `  [outros baralhos: ${outros}]` : ''))
}
