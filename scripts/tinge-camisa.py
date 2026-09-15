# 👕 PINTA O MOLDE DA CAMISA NA COR DO CLUBE (Loja do Clube, 15/09).
#
# A ideia que faz a Loja caber no jogo: NÃO existe um arquivo de camisa por
# clube. Existe UM molde só (`scripts/kits/MOLDE-camisa-branca.webp`, tirado da
# camisa do Final Boss FC, que é o modelo que o Diego aprovou) e ele é pintado
# com as cores de quem for. Quem tem batismo continua usando a arte própria.
#
# Como pinta: o molde é quase sem cor (tecido claro, faixas escuras, contorno
# preto), então dá pra trocar a cor lendo o BRILHO de cada pixel e devolvendo a
# cor da rampa naquele mesmo brilho. Sombra, ruga e brilho do tecido ficam
# todos de pé — muda só a cor.
#
# ⚠️ Rampa desbotada = camisa "sem cor". O Diego cortou a primeira tentativa:
# *"a cor do batismo eu pedi cor do tier profissional, mas na forma que tá parece
# que tá sem cor"*. Então a rampa tem que ter FAIXA LARGA: escuro de verdade
# embaixo, cor cheia no meio, claro em cima. Bege lavado não vale.
#
#   python3 scripts/tinge-camisa.py foiprof saida.webp
import sys
from PIL import Image
import numpy as np

MOLDE = 'scripts/kits/MOLDE-camisa-branca.webp'

# 🪵 tier FOI PROFISSIONAL — o bege do jogo (#DBD1B5/#CBBF9E/#B2A583), mas
# esticado em rampa pra virar cor de camisa mesmo: faixa caramelo no peito,
# tecido areia quente, contorno marrom escuro.
RAMPAS = {
    'foiprof': [(0.00, '#2A2211'), (0.30, '#8A6E33'), (0.60, '#C3AF78'), (0.85, '#DCCB9A'), (1.00, '#F1E7CB')],
}


def tinge(stops, saida, molde=MOLDE):
    a = np.asarray(Image.open(molde).convert('RGBA')).astype(np.float32)
    lum = (0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]) / 255.0
    xs = np.array([s[0] for s in stops], dtype=np.float32)
    cores = np.array([[int(s[1][i:i + 2], 16) for i in (1, 3, 5)] for s in stops], dtype=np.float32)
    out = np.zeros_like(a)
    for c in range(3):
        out[..., c] = np.interp(lum, xs, cores[:, c])
    out[..., 3] = a[..., 3]
    Image.fromarray(out.astype(np.uint8)).save(saida, quality=92, method=6)
    return saida


if __name__ == '__main__':
    tier = sys.argv[1] if len(sys.argv) > 1 else 'foiprof'
    saida = sys.argv[2] if len(sys.argv) > 2 else f'scripts/kits/camisa-tier-{tier}.webp'
    print(tinge(RAMPAS[tier], saida))
