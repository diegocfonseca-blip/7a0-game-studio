// One metric plan shared by the 3D preview and its independent geometry checks.
export const bounds={minX:-241,maxX:241,minZ:-223,maxZ:249};
export const lots=[
 ['Hotel',[-197,-123,-12,65],-192,-32,.88,'east'],
 ['Loja da torcida',[43,77,118,153],18,111,.90,'south'],
 ['Choperia',[86,133,129,165],74,111,.85,'south'],
 ['Alimentação',[39,129,171,200],15,165,.72,'north'],
 ['Estacionamento · 4 setores',[154,286,0,191],176,-39,.67,'east'],
 ['Shopping e Vadico',[53,264,-278,-195],107,-180,.84,'south'],
 ['Agência',[-43,-8,-276,-233],-105,-178,.95,'south'],
 ['Tidex',[-196,-154,-288,-220],-169,-179,.83,'south'],
 ['dSouza',[253,318,212,312],184,194,.60,'south'],
 ['OittoLabs',[130,170,220,313],133,200,.60,'south'],
 ['GECG',[-110,-28,226,315],75,207,.50,'south'],
 ['Arena Legends',[220,320,-121,1],174,87,.62,'south'],
 ['Casa do presidente',[412,452,437,473],-15,210,1,'south'],
 ['Balada',[-358,-339,-309,-291],-208,177,1.3,'south'],
 ['Boteco',[-259,-245,125,147],-174,176,1.15,'south'],
 ['Feira',[-278,-269,89,121],-128,208,.95,'south'],
 ['Campo de terra',[-303,-271,150,178],-74,210,1.05,'south'],
 ['Padaria',[-259,-245,95,117],-181,213,1.1,'south'],
 ['Praça do bairro',[-329,-302,122,149],-205,211,.88,'south'],
 ['Banca',[-272,-262,139,151],-151,211,1.1,'south'],
].map(([name,source,x,z,scale,face])=>({name,source,x,z,scale,face}));
export const reserved=[
 {name:'Estádio',minX:-131,maxX:71,minZ:-90,maxZ:86,face:'south'},
 {name:'Museu',minX:-123,maxX:-99,minZ:97,maxZ:125,face:'south'},
 {name:'Clube Recreio',minX:-222.8,maxX:-155.2,minZ:42.05,maxZ:71.95,face:'south'},
 {name:'Casa Luca',minX:-217.1,maxX:-163.59,minZ:86.49,maxZ:136.18,face:'south'},
 {name:'Metrô',minX:-115,maxX:67,minZ:-121,maxZ:-99,face:'south'}
];
export const housePositions=Array.from({length:8},(_,i)=>({x:i%2?-183:-210,z:[-100,-78,14,29][Math.floor(i/2)]}));
export function boxOf(l){if(l.minX!==undefined)return {...l};const [a,b,c,d]=l.source;return {name:l.name,minX:l.x-(b-a)*l.scale/2,maxX:l.x+(b-a)*l.scale/2,minZ:l.z-(d-c)*l.scale/2,maxZ:l.z+(d-c)*l.scale/2,face:l.face};}
export const allLots=[...lots.map(boxOf),...reserved,...housePositions.map((p,i)=>({name:'Casa '+i,minX:p.x-6,maxX:p.x+6,minZ:p.z-6,maxZ:p.z+6,face:'south'}))];
export const roads=[
 {id:'avenida-norte',a:[-288,-134],b:[288,-134],width:10,walk:2.5,portal:true},
 {id:'avenida-estadio',a:[-231,145],b:[230,145],width:8,walk:2.5},
 {id:'rua-sul',a:[-231,235],b:[230,235],width:7,walk:2},
 {id:'rua-oeste',a:[-231,-134],b:[-231,235],width:6,walk:2},
 {id:'rua-leste',a:[230,-134],b:[230,235],width:6,walk:2},
 {id:'rua-clube',a:[-147,-134],b:[-147,145],width:7,walk:2},
 {id:'rua-arena',a:[108,-134],b:[108,235],width:7,walk:2},
 {id:'ligacao-leste',a:[108,36],b:[230,36],width:6,walk:2},
];
export function roadBox(r,sidewalk=true){const p=r.width/2+(sidewalk?r.walk:0);return {minX:Math.min(r.a[0],r.b[0])-(r.a[0]===r.b[0]?p:0),maxX:Math.max(r.a[0],r.b[0])+(r.a[0]===r.b[0]?p:0),minZ:Math.min(r.a[1],r.b[1])-(r.a[1]===r.b[1]?p:0),maxZ:Math.max(r.a[1],r.b[1])+(r.a[1]===r.b[1]?p:0)};}
export function overlap(a,b,epsilon=.02){const dx=Math.min(a.maxX,b.maxX)-Math.max(a.minX,b.minX),dz=Math.min(a.maxZ,b.maxZ)-Math.max(a.minZ,b.minZ);return dx>epsilon&&dz>epsilon?{dx,dz,area:dx*dz}:null}
export function inside(p,b,pad=0){return p[0]>=b.minX-pad&&p[0]<=b.maxX+pad&&p[1]>=b.minZ-pad&&p[1]<=b.maxZ+pad}
export const sidewalks=[
 [[-225.5,-126],[-225.5,229.5]], [[-152.5,-126],[-152.5,138]], [[-141.5,-126],[-141.5,138]],
 [[102.5,-126],[102.5,229.5]], [[113.5,-126],[113.5,229.5]], [[224.5,-126],[224.5,229.5]],
 [[-225.5,-141.5],[224.5,-141.5]], [[-225.5,-126.5],[224.5,-126.5]],
 [[-225.5,138.5],[224.5,138.5]], [[-225.5,151.5],[224.5,151.5]],
 [[-225.5,229.5],[224.5,229.5]],
 [[113.5,30.5],[224.5,30.5]], [[113.5,41.5],[224.5,41.5]],
];
// Continuous pedestrian paths: station stairs, bus platforms, compound entrances,
// outer public sidewalk loop, stadium esplanade, commercial frontage and south quarter.
export const walks=[
 {id:'entrada-clube',points:[[-189,71.95],[-189,79],[-152.5,79],[-141.5,79],[-136,79],[-136,133],[-34.55,133],[-34.55,86]],crossings:[[-147,79]],owners:['Clube Recreio','Estádio'],target:'Clube Recreio'},
 {id:'lazer-oeste',points:[[-189,79],[-225.5,79]],target:'rua-oeste'},
 {id:'entrada-luca',points:[[-190,136.18],[-190,138.5],[-152.5,138.5]],target:'Casa Luca'},
 {id:'metro-oeste',points:[[-84,6,-107],[-133,6,-107],[-133,6,-103],[-133,.16,-91],[-136,-91],[-136,79],[-136,133],[-34.55,133],[-34.55,86]],owners:['Metrô','Estádio'],target:'Estádio'},
 {id:'metro-leste',points:[[38,6,-107],[85,6,-107],[85,6,-103],[85,.16,-91],[99,-91],[99,88],[99,133],[-34.55,133],[-34.55,86]],owners:['Metrô','Estádio'],target:'Estádio'},
 {id:'onibus-estadio',points:[[-73,136],[-73,134],[-34.55,134],[-34.55,86]],target:'Estádio'},
 {id:'onibus-arena',points:[[174,156],[210,158],[216,158],[216,133],[174,133],[174,124.82]],crossings:[[216,145]],target:'Arena Legends'},
 {id:'loja',points:[[18,126.75],[18,133],[-34.55,133]],target:'Loja da torcida'},
 {id:'museu',points:[[-111,125],[-111,133],[-34.55,133]],target:'Museu'},
 {id:'choperia',points:[[74,126.3],[74,133],[-34.55,133]],target:'Choperia'},
 {id:'hotel',points:[[-159.44,-24],[-152.5,-24]],target:'Hotel'},
 {id:'shopping',points:[[83,-145.14],[83,-141.5]],target:'Shopping e Vadico'},
 {id:'agencia',points:[[-105,-157.575],[-105,-141.5]],target:'Agência'},
 {id:'tidex',points:[[-169,-150.78],[-169,-141.5]],target:'Tidex'},
 {id:'alimentacao',points:[[15,154.56],[15,151.5]],target:'Alimentação'},
 {id:'gecg',points:[[75,229.25],[75,229.5]],target:'GECG'},
 {id:'oitto',points:[[133,227.9],[133,229.5]],target:'OittoLabs'},
 {id:'dsouza',points:[[184,224],[184,229.5]],target:'dSouza'},
 {id:'casa-presidente',points:[[-15,228],[-15,229.5]],target:'Casa do presidente'},
 {id:'bairro-frente',points:[[-225.5,193],[-152.5,193],[-139,193],[-139,229.5]],target:'bairro'},
 ...['Balada','Boteco','Feira','Campo de terra','Padaria','Praça do bairro','Banca'].map(name=>{const b=allLots.find(l=>l.name===name);const x=(b.minX+b.maxX)/2;return {id:'acesso-'+name,target:name,points:name==='Balada'?[[x,b.maxZ],[x,193],[-225.5,193]]:name==='Boteco'?[[x,b.maxZ],[x,193],[-164,193],[-164,229.5]]:[[x,b.maxZ],[x,229.5]]}}),
 ...housePositions.map((p,i)=>({id:'acesso-casa-'+i,target:'Casa '+i,points:[[p.x,p.z+6],[p.x,p.z+7],[-225.5,p.z+7]]})),
];
export const vehiclePaths={
 north:[[-288,-131.5],[288,-131.5]],
 south:[[288,-136.5],[-288,-136.5]],
 bus:[[-288,-131.5],[222,-131.5],[228.5,-126],[228.5,138],[220,142.5],[-35,142.5],[-45,137.8],[-100,137.8],[-110,142.5],[-220,142.5],[-229.5,138],[-229.5,-125],[-236,-136.5],[-288,-136.5]],
 busEast:[[-288,-131.5],[-240,-131.5],[-232.5,-125],[-232.5,138],[-224,147.5],[130,147.5],[140,152.4],[205,152.4],[215,147.5],[224,147.5],[231.5,138],[231.5,-125],[239,-131.5],[288,-131.5]],
 parking:[[228.5,-36],[220,-36],[176,-36]],
};
export const portals=[{id:'oeste',x:-288,z:-134,fadeFrom:265},{id:'leste',x:288,z:-134,fadeFrom:265}];
const xz=p=>p.length===3?[p[0],p[2]]:p;
export function samplePath(points,step=.5){const output=[];for(let i=1;i<points.length;i++){const a=xz(points[i-1]),b=xz(points[i]);const n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/step));for(let k=0;k<=n;k++)output.push([a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n])}return output}
export function audit(){
 const conflicts=[],roadConflicts=[],outside=[];
 for(let i=0;i<allLots.length;i++){const a=allLots[i];if(a.minX<bounds.minX||a.maxX>bounds.maxX||a.minZ<bounds.minZ||a.maxZ>bounds.maxZ)outside.push(a.name);for(let j=i+1;j<allLots.length;j++){const hit=overlap(a,allLots[j]);if(hit)conflicts.push({a:a.name,b:allLots[j].name,...hit})}for(const road of roads){const hit=overlap(a,roadBox(road));if(hit)roadConflicts.push({lot:a.name,road:road.id,...hit})}}
 const adj=roads.map(()=>new Set());for(let i=0;i<roads.length;i++)for(let j=i+1;j<roads.length;j++)if(overlap(roadBox(roads[i],false),roadBox(roads[j],false),-.001)){adj[i].add(j);adj[j].add(i)}const seen=new Set([0]),queue=[0];for(const i of queue)for(const j of adj[i])if(!seen.has(j)){seen.add(j);queue.push(j)}
 const pedestrianConflicts=[];for(const route of walks)for(const p of samplePath(route.points)){for(const lot of allLots){if(lot.name===route.target||route.owners?.includes(lot.name))continue;if(inside(p,lot,.85)){pedestrianConflicts.push({route:route.id,lot:lot.name,point:p});break}}if(pedestrianConflicts.at(-1)?.route===route.id)break}
 const vehicleConflicts=[];for(const [id,path]of Object.entries(vehiclePaths))for(const p of samplePath(path)){for(const l of allLots){if(id==='parking'&&l.name.startsWith('Estacionamento'))continue;if(inside(p,l)){vehicleConflicts.push({route:id,lot:l.name,point:p});break}}if(vehicleConflicts.at(-1)?.route===id)break}
 return {lotCount:allLots.length,roadCount:roads.length,pedestrianRouteCount:walks.length,conflicts,roadConflicts,outside,connectedRoads:seen.size,disconnectedRoads:roads.filter((_,i)=>!seen.has(i)).map(r=>r.id),pedestrianConflicts,vehicleConflicts};
}
