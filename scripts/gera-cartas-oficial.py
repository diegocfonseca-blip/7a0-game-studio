#!/usr/bin/env python3
# 🇧🇷 Brasil Oficial: transforma as listas conferidas (docs/brasil-oficial/cartas-*.md) em src/escalacao/data-oficial.ts.
# Rodar de novo sempre que uma lista mudar: python3 scripts/gera-cartas-oficial.py
import re, json, unicodedata
import glob
ARQS = ['docs/brasil-oficial/cartas-serie-a.md', 'docs/brasil-oficial/cartas-serie-b1.md', 'docs/brasil-oficial/cartas-serie-b2.md', 'docs/brasil-oficial/cartas-complemento.md', 'docs/brasil-oficial/cartas-serie-c.md'] + sorted(glob.glob('docs/brasil-oficial/cartas-d-*.md')) + sorted(glob.glob('docs/brasil-oficial/cartas-conmebol-*.md'))
# lotes da Série D / estaduais / Copa: o cabeçalho da seção É o nome do clube na lista mestra (brasil-oficial-clubes.ts)
# 🏆 clubes estrangeiros da Libertadores: o cabeçalho É o nome (o mesmo de ESTRANGEIROS_LIBERTA_2026)
CONMEBOL = set(re.findall(r"nome: '([^']+)', pais:", open('src/escalacao/libertadores-oficial.ts', encoding='utf-8').read())) | set(re.findall(r'nome: "([^"]+)", pais:', open('src/escalacao/libertadores-oficial.ts', encoding='utf-8').read()))
MESTRA = {json.loads(l.strip().rstrip(','))['nome'] for l in open('src/escalacao/brasil-oficial-clubes.ts', encoding='utf-8') if l.strip().startswith('{')}
# cabeçalho da seção → nome do clube no jogo (a chave do escudo, igual a CLUBES_BR em brasil-oficial.ts)
CLUBE = [('Amazonas','Amazonas'),('Anápolis','Anápolis'),('Barra-SC','Barra'),('Botafogo-PB','Botafogo-PB'),('Brusque','Brusque'),('Caxias','Caxias'),('Confiança','Confiança'),('Ferroviária','Ferroviária'),('Figueirense','Figueirense'),('Floresta','Floresta'),('Guarani','Guarani'),('Inter de Limeira','Inter de Limeira'),('Itabaiana','Itabaiana'),('Ituano','Ituano'),('Maranhão','Maranhão'),('Maringá','Maringá'),('Paysandu','Paysandu'),('Santa Cruz','Santa Cruz'),('Volta Redonda','Volta Redonda'),('Ypiranga-RS','Ypiranga'),('Athletico-PR','Athletico-PR'),('Bahia','Bahia'),('Vitória','Vitória'),('Fortaleza','Fortaleza'),('Mirassol','Mirassol'),('Remo','Remo'),('Red Bull Bragantino','Bragantino'),('Bragantino','Bragantino'),('Chapecoense','Chapecoense'),
  ('Coritiba','Coritiba'),('América-MG','América-MG'),('Athletic','Athletic'),('Atlético-GO','Atlético-GO'),('Atlético Goianiense','Atlético-GO'),
  ('Avaí','Avaí'),('Botafogo-SP','Botafogo-SP'),('Ceará','Ceará'),('CRB','CRB'),('Criciúma','Criciúma'),('Cuiabá','Cuiabá'),('Goiás','Goiás'),
  ('Juventude','Juventude'),('Londrina','Londrina'),('Náutico','Náutico'),('Novorizontino','Novorizontino'),('Operário','Operário-PR'),
  ('Ponte Preta','Ponte Preta'),('São Bernardo','São Bernardo'),('Sport','Sport'),('Vila Nova','Vila Nova')]
def clube_de(txt):
  for k, v in CLUBE:
    if txt.strip().startswith(k) or txt.strip() == k: return v
  return None
# 15/11 (Diego: "Apelido"): o nome da carta é como a torcida chama
APELIDO = {('Douglas Silva',None):'Douglas Pelé',('Yuri Silva',None):'Yuri',('Jhonatan Silva',None):'Jhonathan',
  ('Carlos Eduardo','b1'):'Carlão',('Augusto',None):'Augusto Fassina',('Richard',None):'Richard Costa'}
POS = {'GOL','LAT','ZAG','MEI','ATA'}
cartas = []
import os
for arq in ARQS:
  if not os.path.exists(arq): continue
  tag = 'b1' if 'b1' in arq else ('b2' if 'b2' in arq else 'a')
  clube = None; cab = None
  for ln in open(arq, encoding='utf-8'):
    if ln.startswith('## '):
      h = ln[3:].strip(); clube = (h if h in MESTRA else None) if '/cartas-d-' in arq else (h if h in CONMEBOL else None) if '/cartas-conmebol-' in arq else clube_de(h); cab = None
      if h.lower().startswith(('conferência','totais','pontos','descartados','dúvidas','xarás revistos')): clube = None; cab = 'fora'
      elif h.lower().startswith('xarás'): clube = 'XARA'
      continue
    if ln.startswith('### '): cab = 'fora'; continue
    if not ln.startswith('|') or cab == 'fora' or clube is None: continue
    cel = [c.strip() for c in ln.strip().strip('|').split('|')]
    if cel[0].lower() in ('nome','carta') : cab = [c.lower() for c in cel]; continue
    if set(cel[0]) <= set('-: ') or not isinstance(cab, list): continue
    d = dict(zip(cab, cel))
    pos = d.get('pos'); nome = d.get('nome')
    if pos not in POS or not nome: continue
    cl = clube if clube != 'XARA' else clube_de(d.get('clube',''))
    if not cl: raise SystemExit(f'clube desconhecido: {d}')
    nome = re.sub(r'\s*\(xará\)\s*', '', nome).strip()
    nome = APELIDO.get((nome, tag), APELIDO.get((nome, None), nome))
    cartas.append(dict(pos=pos, name=nome, club=cl, year=int(d['ano']), fame=int(d['fame']), lo=int(d['lo']), hi=int(d['hi']),
      bioPt=d.get('bio pt',''), bioEn=d.get('bio en','')))
# trava: ninguém repetido (mesmo nome+clube+ano)
chaves = [(c['name'], c['club'], c['year']) for c in cartas]
rep = {k for k in chaves if chaves.count(k) > 1}
if rep: raise SystemExit(f'carta repetida: {rep}')
for c in cartas:
  assert 1 <= c['fame'] <= 5 and c['lo'] < c['hi'], c
out = ['// ⚠️ ARQUIVO GERADO por scripts/gera-cartas-oficial.py a partir de docs/brasil-oficial/cartas-*.md — não editar na mão.',
  '// 🇧🇷 Cartas que existem SÓ no modo Brasil Oficial (nunca entram em CATALOG/CATALOG_EU/CATALOG_WORLD: Partida Rápida,',
  '// salas online e carreira de time criado não veem nada daqui — ordem do Diego, 15/11). Todas conferidas a fundo (15/11).',
  "import type { Fame, Sector } from './types'",
  'export type CartaOficial = { name: string; club: string; year: number; fame: Fame; lo: number; hi: number; bio: string; bioEn: string }',
  'export const CATALOG_OFICIAL: Record<Sector, CartaOficial[]> = {']
for p in ['GOL','LAT','ZAG','MEI','ATA']:
  out.append(f'  {p}: [')
  for c in [x for x in cartas if x['pos'] == p]:
    out.append('    ' + json.dumps({k: c[k] for k in ('name','club','year','fame','lo','hi')}, ensure_ascii=False)[:-1] + ', "bio": ' + json.dumps(c['bioPt'], ensure_ascii=False) + ', "bioEn": ' + json.dumps(c['bioEn'], ensure_ascii=False) + ' },')
  out.append('  ],')
out.append('}')
open('src/escalacao/data-oficial.ts','w',encoding='utf-8').write('\n'.join(out) + '\n')
from collections import Counter
print(len(cartas), 'cartas ·', dict(Counter(c['pos'] for c in cartas)))
print(dict(Counter(c['club'] for c in cartas)))
