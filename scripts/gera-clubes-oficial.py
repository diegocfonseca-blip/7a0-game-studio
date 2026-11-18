#!/usr/bin/env python3
# 🇧🇷 Brasil Oficial: a lista mestra (docs/brasil-oficial/clubes-mestra.md, conferida em 15/11) vira src/escalacao/brasil-oficial-clubes.ts.
# Rodar de novo quando a lista mudar: python3 scripts/gera-clubes-oficial.py
import re, json
out = []
na_tabela = False
for ln in open('docs/brasil-oficial/clubes-mestra.md', encoding='utf-8'):
  if ln.startswith('## '): na_tabela = ln.startswith('## Tabela única')
  if not na_tabela: continue
  c = [x.strip() for x in ln.strip().strip('|').split('|')]
  if len(c) < 4 or not re.match(r'^[A-Z]{2}$', c[1]) or c[1] == 'UF': continue
  comp = c[2]
  g = re.search(r'D:(A\d+)', comp); f = re.search(r'CdB:([^·]+)', comp)
  est = [p.strip() for p in comp.split('·') if not p.strip().startswith(('D:', 'CdB:'))]
  nome = re.sub(r'\s*\(CEOV\)$', '', c[0])
  out.append({'nome': nome, 'uf': c[1], **({'grupoD': g.group(1)} if g else {}), **({'copa': f.group(1).strip()} if f else {}),
              **({'estadual': est[0]} if est else {}), 'abc': c[3].startswith('SIM')})
lin = ['// ⚠️ ARQUIVO GERADO por scripts/gera-clubes-oficial.py a partir de docs/brasil-oficial/clubes-mestra.md — não editar na mão.',
  '// 🇧🇷 Os 225 clubes das competições reais de 2026 (Série D, Copa do Brasil, 17 estaduais), com fonte aberta na lista mestra.',
  'export type ClubeMestra = { nome: string; uf: string; grupoD?: string; copa?: string; estadual?: string; abc: boolean }',
  'export const CLUBES_MESTRA: ClubeMestra[] = [']
for r in out: lin.append('  ' + json.dumps(r, ensure_ascii=False) + ',')
lin.append(']')
open('src/escalacao/brasil-oficial-clubes.ts', 'w', encoding='utf-8').write('\n'.join(lin) + '\n')
print(len(out), 'clubes ·', sum(1 for r in out if 'grupoD' in r), 'na Série D ·', sum(1 for r in out if not r['abc']), 'fora de A/B/C')
