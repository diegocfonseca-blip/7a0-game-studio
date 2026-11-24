#!/usr/bin/env python3
"""Verifica integridade dos lotes nativos e do controle com mercado anterior."""
import json, math
from pathlib import Path
root=Path('/workspace/shared/carreira-justa-20261123')
folders=['gama','gama-sem-compras','portuguesa','abc','gama-mercado-anterior']
report={'grupos':{},'temporadas':0,'carreiras':0,'errosElenco':0,'xisConferidos':0}
hashes=set()
for folder in folders:
    d=json.loads((root/folder/'repeticao.json').read_text())
    assert d.get('completo') and len(d['runs'])==3, folder
    hashes.add(d['metodo']['sourceSha256'])
    if folder=='gama-mercado-anterior':assert d['metodo']['mercadoBots'].startswith('anterior:')
    report['grupos'][folder]=[]
    for r in d['runs']:
        assert r.get('completo') and not r['alertas']
        initial={f"{c['name']}|{c['club']}|{c['year']}" for c in r['inicial']}
        chegada=saida=0;max_div='D';rank={'D':0,'C':1,'B':2,'A':3,'V':-1}
        continental=[]
        for i,a in enumerate(r['anos']):
            assert a['season']==i+1 and not a['errosElenco']
            assert math.isfinite(a['caixaAposJanela']) and len(a['ultimoTime'])==len(set(a['ultimoTime']))
            for teams in a['detalhe']['divisoes'].values():
                for t in teams:
                    assert len(t['cartas'])==11 and t['elenco']>=11, (folder,r['seed'],a['season'],t['clube'])
                    report['xisConferidos']+=1
            if i:assert a['div']==r['anos'][i-1]['next']
            if rank[a['div']]>rank[max_div]:max_div=a['div']
            chegada+=len(set(a['ultimoTime'])-set(a['primeiroTime']))
            saida+=len(set(a['primeiroTime'])-set(a['ultimoTime']))
            if folder=='gama-sem-compras':
                assert set(a['primeiroTime'])==initial and set(a['ultimoTime'])==initial,'controle deixou de conservar os iniciais'
            folha=[x for x in a['ledger'] if x.get('label')=='💸 Folha salarial']
            assert len(folha)==1 and (folha[0]['amount']==0 if a['season']<4 else folha[0]['amount']<0)
            for comp in ['liberta','sula','inter']:
                res=(a.get('copas') or {}).get('continental',{}).get(comp)
                if res:continental.append({'ano':a['season'],'competicao':comp,'resultado':res})
        if r['clube']=='Portuguesa':assert any(c['name']=='Julinho' for c in r['inicial'])
        report['carreiras']+=1;report['temporadas']+=len(r['anos'])
        report['grupos'][folder].append({'seed':r['seed'],'temporadas':len(r['anos']),'estreiaA':r['estreiaA'],'melhorDivDisputada':max_div,'forcaInicial':r['anos'][0]['strength'],'forcaFinal':r['anos'][-1]['strength'],'caixaFinal':r['final']['caixa'],'entradas':chegada,'saidas':saida,'continental':continental,'trajetoria':[(a['season'],a['div'],a['pos']) for a in r['anos']]})
assert len(hashes)==1,'arquivos de produto mudaram no meio dos lotes'
report['sourceSha256']=next(iter(hashes));report['mesmosArquivosProduto']=True
report['notaControle']='No lote anterior, somente a flag do módulo virtual foi desligada; transformação declarada no método. Não comparar esse hash como se o código efetivo fosse idêntico.'
(root/'integridade-e-resultados.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False,indent=2))
