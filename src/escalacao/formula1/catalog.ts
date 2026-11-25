/** Temporadas históricas; notas e categorias são avaliações do jogo, relativas à época. */
export type Category='profissional'|'bom'|'promessa'|'craque'|'lenda'
export const CATEGORIES:Record<Category,{label:string;color:string}>={
 profissional:{label:'Profissional',color:'#676b62'},bom:{label:'Bom piloto',color:'#1B7A3D'},
 promessa:{label:'Promessa',color:'#7C3AED'},craque:{label:'Craque',color:'#78919b'},lenda:{label:'Lenda',color:'#c6a126'},
}
export type Driver={id:string;name:string;short:string;country:string;year:number;category:Category;overall:number;pace:number;rain:number;craft:number;care:number;consistency:number;color:string}
function driver(id:string,name:string,short:string,country:string,year:number,category:Category,overall:number,profile:[number,number,number,number],color='#FFC400'):Driver{
 return{id,name,short,country,year,category,overall,pace:overall,rain:profile[0],craft:profile[1],care:profile[2],consistency:profile[3],color}
}
// Uma pessoa por baralho. O ano é a versão de sua carreira representada na carta.
export const DRIVERS:Driver[]=[
 driver('schumacher','Michael Schumacher','MSC','Alemanha',2004,'lenda',99,[98,99,96,98],'#C2452F'),
 driver('hamilton','Lewis Hamilton','HAM','Reino Unido',2020,'lenda',99,[99,98,98,98],'#1B7A3D'),
 driver('fangio','Juan Manuel Fangio','FAN','Argentina',1957,'lenda',98,[95,98,99,99]),
 driver('senna','Ayrton Senna','SEN','Brasil',1991,'lenda',99,[99,99,92,95],'#FFC400'),
 driver('prost','Alain Prost','PRO','França',1993,'lenda',98,[92,96,99,99],'#C2452F'),
 driver('vettel','Sebastian Vettel','VET','Alemanha',2013,'lenda',97,[96,95,96,97],'#375b99'),
 driver('verstappen','Max Verstappen','VER','Países Baixos',2023,'lenda',99,[99,99,97,98],'#375b99'),
 driver('clark','Jim Clark','CLK','Reino Unido',1965,'lenda',98,[98,97,98,98],'#1B7A3D'),
 driver('stewart','Jackie Stewart','STE','Reino Unido',1973,'lenda',96,[98,95,98,98],'#375b99'),
 driver('lauda','Niki Lauda','LAU','Áustria',1984,'lenda',96,[90,94,99,98],'#C2452F'),
 driver('piquet','Nelson Piquet','PIQ','Brasil',1987,'lenda',96,[92,96,98,97]),
 driver('fittipaldi','Emerson Fittipaldi','FIT','Brasil',1974,'lenda',95,[93,94,98,97]),
 driver('alonso','Fernando Alonso','ALO','Espanha',2006,'lenda',97,[97,99,98,98],'#375b99'),
 driver('hakkinen','Mika Häkkinen','HAK','Finlândia',1999,'craque',94,[93,96,94,95]),
 driver('mansell','Nigel Mansell','MAN','Reino Unido',1992,'craque',94,[94,98,89,93]),
 driver('raikkonen','Kimi Räikkönen','RAI','Finlândia',2007,'craque',93,[94,94,97,95],'#C2452F'),
 driver('button','Jenson Button','BUT','Reino Unido',2009,'craque',91,[97,91,99,96]),
 driver('rosberg','Nico Rosberg','ROS','Alemanha',2016,'craque',92,[90,92,96,97]),
 driver('ascari','Alberto Ascari','ASC','Itália',1953,'craque',94,[91,95,95,96],'#C2452F'),
 driver('brabham','Jack Brabham','BRA','Austrália',1966,'craque',92,[94,93,97,96]),
 driver('moss','Stirling Moss','MOS','Reino Unido',1961,'craque',94,[98,97,94,95]),
 driver('barrichello','Rubens Barrichello','BAR','Brasil',2004,'craque',89,[96,89,95,94],'#C2452F'),
 driver('montoya','Juan Pablo Montoya','MON','Colômbia',2003,'craque',91,[91,98,86,89]),
 driver('massa','Felipe Massa','MAS','Brasil',2008,'craque',90,[85,92,92,92],'#C2452F'),
 driver('ricciardo','Daniel Ricciardo','RIC','Austrália',2014,'craque',90,[91,98,94,95]),
 driver('leclerc','Charles Leclerc','LEC','Mônaco',2022,'craque',91,[91,94,89,89],'#C2452F'),
 driver('perez','Sergio Pérez','PER','México',2020,'promessa',85,[85,88,96,89]),
 driver('webber','Mark Webber','WEB','Austrália',2010,'promessa',86,[88,88,86,90]),
 driver('berger','Gerhard Berger','BER','Áustria',1988,'promessa',85,[85,89,87,89],'#C2452F'),
 driver('coulthard','David Coulthard','COU','Reino Unido',2001,'promessa',86,[87,85,91,92]),
 driver('bottas','Valtteri Bottas','BOT','Finlândia',2019,'promessa',86,[82,84,89,93]),
 driver('gasly','Pierre Gasly','GAS','França',2020,'promessa',84,[87,86,88,88]),
 driver('sainz','Carlos Sainz','SAI','Espanha',2023,'promessa',87,[87,90,94,93],'#C2452F'),
 driver('ocon','Esteban Ocon','OCO','França',2021,'promessa',82,[88,84,88,90]),
 driver('hulkenberg','Nico Hülkenberg','HUL','Alemanha',2013,'promessa',84,[90,88,88,90]),
 driver('grosjean','Romain Grosjean','GRO','França',2013,'promessa',82,[82,87,83,79]),
 driver('norris','Lando Norris','NOR','Reino Unido',2019,'bom',80,[83,82,84,82]),
 driver('piastri','Oscar Piastri','PIA','Austrália',2023,'promessa',82,[82,85,87,85]),
 driver('russell','George Russell','RUS','Reino Unido',2019,'bom',79,[81,82,84,84]),
 driver('tsunoda','Yuki Tsunoda','TSU','Japão',2021,'bom',75,[75,80,75,74]),
 driver('mick','Mick Schumacher','SCH','Alemanha',2021,'bom',73,[73,75,78,74]),
 driver('lawson','Liam Lawson','LAW','Nova Zelândia',2023,'bom',77,[79,80,80,80]),
 driver('latifi','Nicholas Latifi','LAT','Canadá',2021,'profissional',65,[64,65,71,69]),
 driver('sargeant','Logan Sargeant','SAR','Estados Unidos',2023,'profissional',64,[63,65,69,65]),
 driver('mazepin','Nikita Mazepin','MAZ','Rússia',2021,'profissional',61,[60,64,66,61]),
 driver('yoong','Alex Yoong','YOO','Malásia',2002,'profissional',60,[60,62,68,65]),
 driver('brunosenna','Bruno Senna','BSE','Brasil',2011,'profissional',70,[74,73,76,73]),
 driver('chilton','Max Chilton','CHI','Reino Unido',2013,'profissional',66,[67,65,75,73]),
]
export type HistoricCar={id:string;team:string;model:string;year:number;category:Category;overall:number;pace:number;corners:number;tyres:number;reliability:number;colors:[string,string];note:string}
function car(id:string,team:string,model:string,year:number,category:Category,overall:number,stats:[number,number,number,number],colors:[string,string],note:string):HistoricCar{return{id,team,model,year,category,overall,pace:stats[0],corners:stats[1],tyres:stats[2],reliability:stats[3],colors,note}}
export const CARS:HistoricCar[]=[
 car('mp44','McLaren','MP4/4',1988,'lenda',99,[99,98,96,98],['#F4ECD6','#C2452F'],'Venceu 15 dos 16 GPs de 1988.'),
 car('f2004','Ferrari','F2004',2004,'lenda',98,[98,98,97,98],['#C2452F','#F4ECD6'],'O carro do heptacampeonato de Schumacher.'),
 car('fw14b','Williams','FW14B',1992,'lenda',97,[98,99,94,93],['#375b99','#FFC400'],'Mansell campeão; referência em suspensão ativa.'),
 car('rb19','Red Bull','RB19',2023,'lenda',99,[99,99,99,98],['#243d69','#FFC400'],'Venceu 21 dos 22 GPs de 2023.'),
 car('w11','Mercedes','W11',2020,'lenda',98,[99,99,96,98],['#0C0C0C','#1B7A3D'],'Hamilton campeão pela sétima vez.'),
 car('f2002','Ferrari','F2002',2002,'lenda',95,[97,96,95,96],['#C2452F','#F4ECD6'],'Uma das máquinas da sequência de títulos da Ferrari.'),
 car('w07','Mercedes','W07',2016,'lenda',96,[98,97,96,96],['#93a6a5','#1B7A3D'],'Rosberg e Hamilton disputaram o título até a final.'),
 car('rb9','Red Bull','RB9',2013,'lenda',95,[95,98,97,95],['#243d69','#C2452F'],'Vettel fechou o tetracampeonato.'),
 car('r26','Renault','R26',2006,'craque',93,[93,95,96,96],['#FFC400','#375b99'],'O carro do bicampeonato de Alonso.'),
 car('bgp001','Brawn','BGP 001',2009,'craque',92,[92,94,94,94],['#F4ECD6','#9bc52d'],'Button e a equipe campeões na temporada de estreia.'),
 car('mp413','McLaren','MP4/13',1998,'craque',93,[96,95,92,92],['#93a6a5','#0C0C0C'],'Häkkinen conquistou seu primeiro título.'),
 car('j191','Jordan','191',1991,'bom',79,[79,82,81,76],['#1B7A3D','#375b99'],'O carro da estreia de Michael Schumacher.'),
 car('str3','Toro Rosso','STR3',2008,'bom',81,[81,84,82,85],['#243d69','#C2452F'],'Vettel venceu o GP da Itália com esta máquina.'),
 car('c31','Sauber','C31',2012,'promessa',82,[82,84,90,84],['#F4ECD6','#0C0C0C'],'Pódios com Pérez e Kobayashi em 2012.'),
 car('vjm09','Force India','VJM09',2016,'promessa',83,[84,83,87,88],['#93a6a5','#C2452F'],'Consistência na disputa do meio do grid.'),
 car('fw36','Williams','FW36',2014,'promessa',86,[92,82,83,87],['#F4ECD6','#375b99'],'Massa e Bottas levaram a Williams de volta aos pódios.'),
 car('a522','Alpine','A522',2022,'promessa',83,[85,85,83,74],['#375b99','#d5a6b9'],'Ritmo competitivo, com confiabilidade como desafio.'),
 car('vf21','Haas','VF-21',2021,'profissional',61,[61,61,67,75],['#F4ECD6','#C2452F'],'Temporada de reconstrução na parte de trás do grid.'),
 car('fw42','Williams','FW42',2019,'profissional',60,[60,61,68,76],['#F4ECD6','#375b99'],'Uma temporada difícil para a equipe britânica.'),
 car('mp430','McLaren','MP4-30',2015,'profissional',65,[63,75,74,60],['#0C0C0C','#C2452F'],'Retorno da parceria com a Honda, ainda em desenvolvimento.'),
]
export const driverById=(id:string)=>{const d=DRIVERS.find(d=>d.id===id);if(!d)throw new Error('Piloto não encontrado');return d}
export const carById=(id:string)=>{const c=CARS.find(c=>c.id===id);if(!c)throw new Error('Carro não encontrado');return c}
