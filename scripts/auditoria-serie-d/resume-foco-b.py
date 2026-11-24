#!/usr/bin/env python3
"""Confere a repetição instrumentada e resume a hipótese do acesso fácil na B."""
import json, statistics, sys
from pathlib import Path

root = Path(sys.argv[1] if len(sys.argv) > 1 else '/workspace/shared/carreira-foco-b-20261123')
old = json.loads(Path('/workspace/shared/carreira-repeticao-20261123/portuguesa/repeticao.json').read_text())
base = json.loads((root/'repeticao.json').read_text())
assert base.get('completo') and len(base['runs']) == 10
assert base['metodo']['sourceSha256'] == old['metodo']['sourceSha256']
old_by_seed = {r['seed']: r for r in old['runs']}
summary = {'reproducao': {'carreiras': 10, 'temporadas': 0, 'mesmoCodigoProduto': True}, 'portuguesa': [], 'controles': [], 'mercadoTodas': []}
fields = ['season', 'div', 'next', 'pos', 'pts', 'gf', 'ga', 'w', 'd', 'l', 'strength', 'players', 'coins', 'salary', 'caixaAposJanela', 'primeiroTime', 'ultimoTime']
for r in base['runs']:
    anterior = old_by_seed[r['seed']]
    assert r['primeiroAcessoA'] == anterior['primeiroAcessoA']
    assert len(r['anos']) == len(anterior['anos'])
    for a, b in zip(r['anos'], anterior['anos']):
        for f in fields:
            assert a[f] == b[f], (r['seed'], a['season'], f)
        assert not a['errosElenco']
        for t in a['detalhe']['divisoes']['B']:
            assert t['w'] + t['d'] + t['l'] == 38
            assert t['pts'] == t['w']*3+t['d']
    summary['reproducao']['temporadas'] += len(r['anos'])
    bs = [a for a in r['anos'] if a['div'] == 'B' and a['season'] <= r['primeiroAcessoA']]
    first, promoted = bs[0], bs[-1]
    ts = first['detalhe']['divisoes']['B']
    ordered = sorted(ts, key=lambda t: -t['forca'])
    summary['portuguesa'].append({'seed': r['seed'], 'estreiaB': first['season'], 'estreiaA': r['estreiaA'], 'temporadasB': len(bs), 'primeiraBpos': first['pos'], 'primeiraBpts': first['pts'], 'forca': first['strength'], 'rankingForcaPrimeiraB': next(i for i,t in enumerate(ordered,1) if t['humano']), 'mediaB': statistics.mean(t['forca'] for t in ts), 'caixaPrimeiraB': first['coins'], 'acessoPos': promoted['pos'], 'acessoPlayoff': promoted['uiPlayoff'], 'playoffsDisputados': sum(a['uiPlayoff'] for a in bs)})

for folder in ['controles-primeiros', 'controles-restantes']:
    p = root/folder/'controles.json'
    d = json.loads(p.read_text())
    assert d.get('completo'), folder
    for r in d['runs']:
        games = r['baseline']['entradas']
        assert len(games) == 38
        row = {'seed': r['seed'], 'temporada': r['season'], 'pontosFisicos': r['baseline']['pts'], 'pontosProjetados': sum(e['pontosEsperados'] for e in games), 'golsFisicos': sum(e['gols'][0 if e['home'] else 1] for e in games), 'golsProjetados': sum(e['esperados'][0 if e['home'] else 1] for e in games), 'contraFisicos': sum(e['gols'][1 if e['home'] else 0] for e in games), 'contraProjetados': sum(e['esperados'][1 if e['home'] else 0] for e in games), 'pontosMotorLeve': r['motorLeve']['pts'], 'pontosSemTecnico': r['semTecnico']['pts'], 'pontosSemModsCondicao': r['semDesgaste']['pts'], 'jogosComModHumano': sum(e['gasMods'][0 if e['home'] else 1]>0 for e in games), 'variacoesLiga': [{'pos':v['pos'],'pts':v['pts'],'sobe':v['sobe']} for v in r['variacoes']]}
        summary['controles'].append(row)
assert len(summary['controles']) == 10 and len({r['seed'] for r in summary['controles']}) == 10
market = json.loads((root/'mercado-todas/repeticao.json').read_text())
assert market.get('completo') and len(market['runs']) == 3
assert market['metodo']['sourceSha256'] == base['metodo']['sourceSha256']
for r in market['runs']:
    assert all(not a['errosElenco'] for a in r['anos'])
    orig = old_by_seed[r['seed']]
    assert any(c['name']=='Julinho' for c in r['inicial'])
    summary['mercadoTodas'].append({'seed':r['seed'],'estreiaOriginal':orig['estreiaA'],'estreiaExperimental':r['estreiaA'],'sequenciaOriginal':[(a['season'],a['div'],a['pos']) for a in orig['anos']], 'sequenciaExperimental':[(a['season'],a['div'],a['pos']) for a in r['anos']]})
(root/'resumo-foco-b.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
print(json.dumps(summary,ensure_ascii=False,indent=2))
