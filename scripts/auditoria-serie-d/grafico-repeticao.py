#!/usr/bin/env python3
import os,json,sys
from pathlib import Path
os.environ.setdefault('MPLCONFIGDIR','/tmp/leilao-mpl-carreira')
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle,Patch
root=Path(sys.argv[1] if len(sys.argv)>1 else '/workspace/shared/carreira-repeticao-20261123')
rows=[]
for pasta in ['portuguesa','abc','brasiliense']:
 d=json.loads((root/pasta/'repeticao.json').read_text());assert d.get('completo'),pasta+' ainda está rodando'
 rows.extend(d['runs'])
assert len(rows)==30
n=max(len(r['anos']) for r in rows)
cores={'D':'#e5dbc4','C':'#c4a8f0','B':'#efbc42','A':'#257b4d'}
fig,ax=plt.subplots(figsize=(12,13),facecolor='#fbfaf6')
ax.set_facecolor('#fbfaf6')
nomes=[]
cont={}
for i,r in enumerate(rows):
 cont[r['clube']]=cont.get(r['clube'],0)+1
 nomes.append(f"{r['clube']} {cont[r['clube']]:02d}")
 for y in r['anos']:
  x=y['season']-1;div=y['div'];ax.add_patch(Rectangle((x-.48,i-.43),.96,.86,facecolor=cores[div],edgecolor='white',linewidth=.7))
  ax.text(x,i,div,ha='center',va='center',fontsize=9,fontweight='bold',color='white' if div=='A' else '#252525')
 if i in [9,19]:ax.axhline(i+.5,color='#aaa',linewidth=.8)
ax.set_xlim(-.6,n-.4);ax.set_ylim(len(rows)-.3,-.7)
ax.set_xticks(range(n),[str(x+1) for x in range(n)])
ax.xaxis.set_label_position('top');ax.xaxis.tick_top();ax.set_xlabel('Temporada disputada',fontsize=11,labelpad=12)
ax.set_yticks(range(len(rows)),nomes,fontsize=9)
ax.tick_params(length=0,pad=8)
for spine in ax.spines.values():spine.set_visible(False)
fig.suptitle('30 carreiras iniciadas na Série D',fontsize=18,fontweight='bold',y=.98)
fig.text(.5,.952,'Julinho e os históricos no sorteio inicial · salários a partir da 4ª temporada',ha='center',fontsize=11)
ax.legend(handles=[Patch(facecolor=cores[d],label='Série '+d) for d in ['D','C','B','A']],loc='upper center',bbox_to_anchor=(.5,-.02),ncol=4,frameon=False)
fig.text(.5,.015,'Até 12 temporadas para obter acesso; quem sobe tem mais duas temporadas acompanhadas.\nAs lacunas indicam fim do acompanhamento. Gestão anual automatizada; leia os limites do relatório.',ha='center',fontsize=9,color='#555')
fig.subplots_adjust(top=.88,bottom=.085,left=.21,right=.97)
fig.savefig(root/'trajetorias.png',dpi=160,facecolor=fig.get_facecolor())
fig.savefig(root/'trajetorias.pdf',facecolor=fig.get_facecolor())
print('Gráfico e PDF gerados:',len(rows),'carreiras')
