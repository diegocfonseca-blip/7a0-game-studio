import {readFileSync,writeFileSync} from 'node:fs'
import assert from 'node:assert/strict'
import {CLUBES_BR_TODOS} from '../src/escalacao/brasil-oficial.ts'
const fontes=JSON.parse(readFileSync('docs/brasil-oficial/fontes-hierarquia-2026.json','utf8'))
const rnc=fontes.rnc as {nome:string;uf:string;posicao:number;pontos:number;variacao:number|null}[]
const campanha=fontes.campanhas as {nome:string;serie:string;posicao:number;pontos:number;jogos:number}[]
const normal=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'')
const nomes:Record<string,string>={'São Bernardo':'São Bernardo FC','Maracanã-CE':'Maracanã','Fluminense-PI':'Fluminense','Cascavel':'FC Cascavel','Boavista-RJ':'Boavista','São Luiz-RS':'São Luiz','Independente-AP':'Independente','Atlético-MG':'Atlético','Athletico-PR':'Athletico','Vasco':'Vasco da Gama','Bragantino':'Red Bull Bragantino','Atlético-GO':'Atlético','América-MG':'América','Operário-PR':'Operário','Botafogo-SP':'Botafogo','Botafogo-PB':'Botafogo','América-RN':'América','Brasil de Pelotas':'Brasil','Ferroviário-CE':'Ferroviário','São José-RS':'São José','Portuguesa-RJ':'Portuguesa','São Raimundo-RR':'São Raimundo','União Rondonópolis':'União','Operário-MS':'Operário','Operário VG':'Operário','Atlético-CE':'Atlético','Atlético-BA':'Atlético','Nacional de Patos':'Nacional','Nacional-AM':'Nacional','São Raimundo-AM':'São Raimundo','Rio Branco-AC':'Rio Branco','Rio Branco-ES':'Rio Branco','Rio Branco-VN':'Rio Branco VN','Capital-DF':'Capital','Capital-TO':'Capital','Santa Cruz-RN':'Santa Cruz','Barcelona de Ilhéus':'Barcelona','Guarany de Bagé':'Guarany de Bagé','Inter de Limeira':'Inter de Limeira','São Joseense':'Sãojoseense','União-TO':'União','Vitória-ES':'Vitória','Juventude-MA':'Juventude','Santa Cruz-RS':'Santa Cruz','Rio Branco-PR':'Rio Branco','Cruzeiro-AL':'Cruzeiro','Barcelona-RO':'Barcelona','Náutico-RR':'Náutico','Ypiranga-AP':'Ypiranga'}
const nomesCampanha:Record<string,string>={'Operário':'Operário-PR','Fortaleza Ec Saf':'Fortaleza','Sport Recife':'Sport','Amazonas Saf':'Amazonas','Cruzeiro Saf':'Cruzeiro','Atlético Mineiro Saf':'Atlético-MG','Santos Fc':'Santos','Vasco da Gama Saf':'Vasco','Coritiba S.a.f.':'Coritiba','Athletico Paranaense':'Athletico-PR','Gremio Novorizontino - Saf':'Novorizontino','Crb':'CRB','Cuiabá Saf':'Cuiabá','Atlético Goianiense Saf':'Atlético-GO','America Saf':'América-MG','Athletic Saf':'Athletic','Red Bull Bragantino':'Bragantino'}
const camp=(nome:string)=>campanha.find(c=>normal(nomesCampanha[c.nome]??(c.nome==='Botafogo'&&c.serie==='B'?'Botafogo-SP':c.nome))===normal(nome))
assert.equal(rnc.length,235);assert.equal(campanha.length,40)
const rows=CLUBES_BR_TODOS.map(cl=>{
 const alias=nomes[cl.nome]??cl.nome
 const r=rnc.find(r=>r.uf===cl.uf&&[alias,...(cl.apelidos??[])].some(n=>normal(n)===normal(r.nome)))
 const c=camp(cl.nome)
 return {clube:cl.nome,uf:cl.uf,divisao:cl.div,rnc:r?{posicao:r.posicao,pontos:r.pontos,variacao:r.variacao}:null,campanha2025:c?{serie:c.serie,posicao:c.posicao,pontos:c.pontos,jogos:c.jogos}:null}
})
console.log('SEM_MATCH_CAMPANHA',campanha.filter(c=>!CLUBES_BR_TODOS.some(cl=>normal(nomesCampanha[c.nome]??(c.nome==='Botafogo'&&c.serie==='B'?'Botafogo-SP':c.nome))===normal(cl.nome))).map(c=>c.nome));
assert.equal(rows.filter(c=>c.campanha2025).length,40,'todas as campanhas A/B resolvidas sem ambiguidade')
writeFileSync('src/escalacao/hierarquia-brasil-2026.json',JSON.stringify({referencia:'início da temporada2026',fontes:{rnc:'https://stcbfsiteprdimgbrs.blob.core.windows.net/img-site/cdn/RNC_Ranking_Nacional_dos_Clubes_2026_27e24418e7.pdf',serieA:'https://www.cbf.com.br/futebol-brasileiro/tabelas/campeonato-brasileiro/serie-a/2025',serieB:'https://www.cbf.com.br/futebol-brasileiro/tabelas/campeonato-brasileiro/serie-b/2025'},clubes:rows},null,2)+'\n')
console.log('CADASTRO',rows.length,'RNC resolvidos',rows.filter(c=>c.rnc).length,'sem RNC',rows.filter(c=>!c.rnc).map(c=>c.clube).join(', '))
