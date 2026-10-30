// ✉️ trava do e-mail de conta nova (30/10): nenhum domínio de verdade pode ser barrado; os inventados que o banco mostrou têm que cair.
import { emailNovoProblema } from '../src/escalacao/email-novo.ts'
const tr = (p: string) => p
const bons = ['gmail.com','hotmail.com','hotmail.com.br','outlook.com','outlook.com.br','yahoo.com','yahoo.com.br','icloud.com','live.com','me.com','msn.com','mail.com','email.com','ymail.com','gmx.com','bol.com.br','uol.com.br','terra.com.br',
 'escola.pr.gov.br','estudante.rs.gov.br','edu.mt.gov.br','aluno.edu.es.gov.br','notredamecampinas.net.br','colegiodomfeliciano.com.br','soulasalle.com.br','alunoecp.com.br','aluno.barueri.br','al.educacao.sp.gov.br',
 'k12.somerville.ma.us','mail.fae.edu','edu.ulisboa.pt','livemode.com','gsuite.iff.edu.br','tjrj.jus.br','94.football','gabarito.email','outlook.ie','cec.g12.br','eaportal.org','tutamail.com','mozmail.com','unilever.com','corinthians.com','herclan.com','p4ed.com','2027.br.com','alumni.usp.br','sou.ucpel.edu.br']
const ruins = ['gmail.comjjhujj','gmail.comsnsnsj','gmail.vom','gmahd.com','vggmail.com','gmail.coml','gmail.comf','hotmail.coma','hotmail.com7','gmail.clm','hotmail.clm','gmail.cmo','gmail.con','gmai.com','gmial.com','gnail.com','gamail.com','gmil.com','gmall.com','gmaill.com','gmal.com','gmsil.com','gmqil.com','gmailm.com','gmaail.com','ggmail.com','g-mail.com','gmail.com.br','gmail.br','gmail','gmailcom','22gmail.com.br','4792gmail.com','12gmail.com','gmail10p.com','testegmail.com','hitmail.com','gotmail.com','htmail.com','hormail.com','hotmal.com','oulook.com','outloo.com','putlook.com','outllook.com.br','icoud.com','iclou.com','icould.com','icloiud.com','ixloud.com','tahoo.com.br','mail.comppk','com.gme','a.a','123','bolaoww.temp','escola.pr.gov.b4','escola.pr.gov.vr','teste.com.nr','escola.pr']
let falso=0, pegou=0
for (const d of bons) { const r=emailNovoProblema('x@'+d,tr); if (r) { falso++; console.log('❌ BARROU BOM', d, '→', r) } }
for (const d of ruins) { const r=emailNovoProblema('x@'+d,tr); if (r) pegou++; else console.log('… deixou passar', d) }
if (falso) process.exit(1)
console.log(`✅ bons barrados: ${falso}/${bons.length} · ruins pegos: ${pegou}/${ruins.length}`)
