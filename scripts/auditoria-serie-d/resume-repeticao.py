#!/usr/bin/env python3
import csv,json,statistics,sys
from pathlib import Path
root=Path(sys.argv[1] if len(sys.argv)>1 else '/workspace/shared/carreira-repeticao-20261123')
resumo=[];linhas=[];trajetos=[];hashes=set()
for pasta in ['portuguesa','abc','brasiliense']:
 p=root/pasta/'repeticao.json'
 if not p.exists(): continue
 try:d=json.loads(p.read_text())
 except json.JSONDecodeError:continue
 hashes.add(d['metodo']['sourceSha256'])
 concluidos=[r for r in d['runs'] if r.get('completo')]
 chegados=[r for r in concluidos if r['primeiroAcessoA'] is not None]
 resumo.append({'clube':d['metodo']['clube'],'completas':len(concluidos),'iniciadas':len(d['runs']),'temporadas':sum(len(r['anos']) for r in d['runs']),'acessoAem3':sum(r['primeiroAcessoA']==3 for r in concluidos),'acessoAate12':len(chegados),'semAcessoAate12':len(concluidos)-len(chegados),'estreiaMaisCedo':min((r['estreiaA'] for r in chegados),default=None),'estreiaMaisTarde':max((r['estreiaA'] for r in chegados),default=None),'estreiaMedianaEntreQuemSubiu':statistics.median([r['estreiaA'] for r in chegados]) if chegados else None,'cairamNaEstreia':sum(r['primeiraCampanhaA'] is not None and not r['primeiraCampanhaA']['seguiuNaA'] for r in concluidos),'alertasDeElenco':sum(len(r['alertas']) for r in concluidos),'concluido':d.get('completo',False)})
 for r in d['runs']:
  if not r.get('completo'):continue
  trajetos.append({'clube':r['clube'],'semente':r['seed'],'estreiaA':r['estreiaA'],'acesso':r['primeiroAcessoA'],'sequencia':' → '.join(a['div'] for a in r['anos'])+' → [próxima: '+r['final']['div']+']','caixaFinal':r['final']['caixa'],'folhaFinal':r['final']['folha'],'primeiraA':r['primeiraCampanhaA']})
  for a in r['anos']:
   antigos=set(a['primeiroTime']);novos=set(a['ultimoTime'])
   linhas.append({'clube':r['clube'],'semente':r['seed'],'temporada':a['season'],'divisao':a['div'],'proxima':a['next'],'posicao':a['pos'],'pontos':a['pts'],'gols_pro':a['gf'],'gols_contra':a['ga'],'forca_titulares':a['strength'],'jogadores':a['players'],'folha':a['salary'],'caixa_antes_fecho':a['caixaAntesFecho'],'caixa_apos_janela':a['caixaAposJanela'],'entradas_elenco':len(novos-antigos),'saidas_elenco':len(antigos-novos),'renovacoes':len(a['renovacoes']),'custos_renovacao':sum(x['price'] for x in a['renovacoes']),'alertas_elenco':len(a['errosElenco'])})
resultado={'amostras':resumo,'totalCarreiras':sum(x['completas'] for x in resumo),'totalTemporadas':sum(x['temporadas'] for x in resumo),'codigoUniforme':len(hashes)==1,'hashes':sorted(hashes),'trajetos':trajetos}
(root/'resumo.json').write_text(json.dumps(resultado,ensure_ascii=False,indent=2))
if linhas:
 with (root/'temporadas.csv').open('w') as f:
  w=csv.DictWriter(f,fieldnames=linhas[0].keys());w.writeheader();w.writerows(linhas)
print(json.dumps({k:v for k,v in resultado.items() if k!='trajetos'},ensure_ascii=False,indent=2))
