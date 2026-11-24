#!/usr/bin/env python3
import json,math,sys
from pathlib import Path
root=Path(sys.argv[1] if len(sys.argv)>1 else '/workspace/shared/carreira-repeticao-20261123')
total=0;temporadas=0;julinhos=0;hashes=set();entradas=saidas=renovacoes=0
for pasta in ['portuguesa','abc','brasiliense']:
 d=json.loads((root/pasta/'repeticao.json').read_text());assert d.get('completo'),pasta+' ainda rodando'
 assert len(d['runs'])==10
 assert len(set(r['seed'] for r in d['runs']))==10
 hashes.add(d['metodo']['sourceSha256'])
 assert d['metodo']['salariosDesde']==4 and d['metodo']['historicosPreservados']
 for r in d['runs']:
  total+=1;assert r.get('completo');assert not r['alertas']
  if r['clube']=='Portuguesa':assert any(c['name']=='Julinho' for c in r['inicial']);julinhos+=1
  acesso=None
  for i,a in enumerate(r['anos']):
   temporadas+=1;assert a['season']==i+1
   assert not a['errosElenco']
   if i: assert a['div']==r['anos'][i-1]['next']
   assert 1<=a['pos']<=a['counts'][a['div']]
   assert isinstance(a['caixaAposJanela'],(int,float)) and math.isfinite(a['caixaAposJanela'])
   assert len(set(a['ultimoTime']))==len(a['ultimoTime']),'identidade duplicada no clube'
   if a['next']=='A' and acesso is None:acesso=a['season']
   folha=[l for l in a['ledger'] if l.get('label')=='💸 Folha salarial']
   assert len(folha)==1,'fechamento salarial duplicado ou ausente'
   assert folha[0]['amount']==0 if a['season']<4 else folha[0]['amount']<0
   entradas+=len(set(a['ultimoTime'])-set(a['primeiroTime']));saidas+=len(set(a['primeiroTime'])-set(a['ultimoTime']));renovacoes+=len(a['renovacoes'])
  assert acesso==r['primeiroAcessoA']
  if acesso is not None:
   assert acesso>=3 and r['estreiaA']==acesso+1
   assert any(a['season']==acesso+1 and a['div']=='A' for a in r['anos'])
   assert len(r['anos'])==acesso+2
  else:assert len(r['anos'])==12
assert total==30 and julinhos==10 and len(hashes)==1
out={'carreiras':total,'temporadas':temporadas,'portuguesasComJulinhoInicial':julinhos,'entradasElenco':entradas,'saidasElenco':saidas,'renovacoes':renovacoes,'elencosIncompletos':0,'salarioDuplicado':0,'codigoUniforme':True}
(root/'integridade-final.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
print('PASS integridade final',json.dumps(out,ensure_ascii=False))
