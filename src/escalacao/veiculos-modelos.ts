/** Original, lightweight 3D interpretations of the existing catalogue. Metres, front +Z.
 * No prices, permissions, purchases or third-party model downloads. */
export type PerfilVeiculo={id:string;kind:'car'|'bike';shape:string;length:number;width:number;height:number;wheelbase:number;radius:number;color:string;roof?:string;spoiler?:boolean;ladder?:boolean;stripes?:boolean;track?:number}
const car=(id:string,shape:string,length:number,width:number,height:number,wheelbase:number,color:string,extra:Partial<PerfilVeiculo>={}):PerfilVeiculo=>({id,kind:'car',shape,length,width,height,wheelbase,radius:shape==='suv'?.39:shape==='super'?.34:.31,color,...extra})
const bike=(id:string,shape:string,length:number,height:number,color:string,extra:Partial<PerfilVeiculo>={}):PerfilVeiculo=>({id,kind:'bike',shape,length,width:shape==='adventure'?.92:.74,height,wheelbase:length*.65,radius:shape==='bmx'?.25:shape==='bicycle'?.35:.31,color,...extra})
export const MODELOS_VEICULOS:readonly PerfilVeiculo[]=[
 car('fusca','beetle',4.08,1.55,1.5,2.4,'#83a9ac',{track:1.31,radius:.31}),car('chevette','sedan',4.12,1.57,1.32,2.39,'#83907a'),
 car('brasilia','wagon',4.01,1.6,1.46,2.4,'#e6d7a0',{track:1.36,radius:.3}),car('kombi','van',4.5,1.72,1.98,2.4,'#2f78b3',{roof:'#f1ede2',track:1.4,radius:.33}),
 car('uno-escada','hatch',3.64,1.55,1.43,2.36,'#eee8d7',{ladder:true}),car('celta','hatch',3.79,1.63,1.43,2.44,'#b8bfbe'),
 car('gol-gti','hatch',3.81,1.64,1.36,2.36,'#d42e30',{stripes:true,track:1.39,radius:.29}),car('saveiro','pickup',4.1,1.63,1.42,2.4,'#e7e5dc'),
 car('opala-ss','muscle',4.58,1.76,1.35,2.67,'#df7b29',{stripes:true,track:1.48,radius:.32}),car('golf-gti','hatch',4.26,1.8,1.46,2.63,'#d4d6d4'),
 car('veloster','coupe',4.22,1.79,1.4,2.65,'#cfbc36'),car('civic','sedan',4.55,1.75,1.36,2.67,'#a6aab1',{spoiler:true}),
 car('lancer-evo','sedan',4.49,1.77,1.4,2.62,'#f1f0e9',{spoiler:true}),car('song-plus','suv',4.78,1.89,1.66,2.77,'#c2c7c7'),
 car('skyline-r34','coupe',4.6,1.78,1.34,2.66,'#215fb7',{spoiler:true}),car('supra-mk4','round-coupe',4.52,1.81,1.27,2.55,'#d95a2c',{spoiler:true}),
 car('z4','convertible',4.32,1.86,1.28,2.47,'#b8bdc2'),car('m3-gtr','coupe',4.49,1.78,1.32,2.73,'#c5c9ce',{stripes:true,spoiler:true}),
 car('escalade','suv',5.38,2.06,1.94,3.07,'#272c30',{radius:.42}),car('challenger','muscle',5.03,1.92,1.43,2.95,'#51356c',{stripes:true}),
 car('g63','box-suv',4.87,1.93,1.97,2.89,'#3a423d',{radius:.4}),car('f40','super',4.43,1.98,1.13,2.45,'#cc1a1d',{spoiler:true,track:1.66,radius:.33}),
 car('911-gt3','rear-coupe',4.57,1.9,1.28,2.46,'#dedfdd',{spoiler:true}),car('720s','super',4.54,1.93,1.2,2.67,'#d99424'),
 car('aventador','wedge',4.78,2.03,1.14,2.7,'#72b839'),
 bike('bike-usada','bicycle',1.8,1.12,'#867b66'),bike('bicicleta','bicycle',1.85,1.14,'#387987'),bike('mobilete','moped',1.65,1.07,'#a74336'),
 bike('bmx','bmx',1.47,.99,'#cba82d'),bike('pop100','step',1.85,1.05,'#c82b32'),bike('biz','scooter',1.89,1.07,'#e1dfcf'),
 bike('cg-titan','standard',1.99,1.1,'#c52b2c'),bike('rd135','standard',2.0,1.09,'#d2d4d0'),bike('twister','naked',2.03,1.1,'#e3b92c'),
 bike('xt660','trail',2.24,1.32,'#344a8d'),bike('hornet','naked',2.08,1.1,'#b8c22a'),bike('xj6','naked',2.12,1.13,'#e8e5d8'),
 bike('fat-boy','cruiser',2.38,1.14,'#222b2a',{wheelbase:1.65,radius:.35,width:.98}),
 bike('f800gs','adventure',2.31,1.38,'#be9e36'),bike('r1250gs','adventure',2.42,1.44,'#dededb'),
 bike('s1000rr','sport',2.07,1.16,'#dedfd7',{stripes:true}),bike('ninja-h2','sport',2.09,1.12,'#246b3f'),
]
const aliases:Record<string,string>={'moto-basica':'cg-titan','carro-popular':'celta','moto-custom':'fat-boy','carro-executivo':'civic','carro-esportivo':'f40'}
export const MODELO_ENTREGA_QUADROS:PerfilVeiculo={id:'servico-dsouza',kind:'car',shape:'delivery',length:5.25,width:1.96,height:2.35,wheelbase:3.0,radius:.36,color:'#d9dfcc',roof:'#315a43'}
export function modeloVeiculo(id:string){return MODELOS_VEICULOS.find(p=>p.id===(aliases[id]??id))}
