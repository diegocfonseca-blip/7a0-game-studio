#!/usr/bin/env python3
# ─── 🎨 MOCKUP PADRÃO DE BATISMO — o post oficial de "clube batizado" ────────
#
# Decisão do Diego (17/08): *"sempre irei falar arte padrão de formato pra
# escudo manto e mascote... e mockup padrão também"*. Então o formato do post
# deixou de ser algo que cada sessão inventa de novo — é ESTE arquivo.
#
# O mockup do Coringas do Diniz (16/08) tinha sido feito à mão e morava só no
# scratchpad da sessão; quando a máquina trocou, sumiu. Este script existe pra
# isso não acontecer de novo: o formato agora mora no REPO, versionado, e todo
# batismo novo sai igualzinho ao anterior.
#
# ── COMO USAR ───────────────────────────────────────────────────────────────
#   python3 scripts/mockup-batismo.py \
#     --clube "Skyy FC" --serie D --antigo "Fortuna SAF" \
#     --escudo src/escalacao/img/skyy-escudo.webp \
#     --mascote src/escalacao/img/skyy-mascote.webp --mascote-nome "A Águia" \
#     --c1 "#237581" --c2 "#0D3558" \
#     --dono "matheusncruz1" --socio 9 --fundador 24 \
#     --saida /tmp/skyy-post.png
#
# Sai um PNG 1080×1350 (formato de post, 4:5) na identidade da casa: creme
# #F4ECD6, tinta preta, bordas grossas, sombra dura deslocada.
#
# ── POR QUE PIL E NÃO HTML ──────────────────────────────────────────────────
# Não dá pra baixar a Oswald neste ambiente (o proxy bloqueia o Google Fonts),
# então o título é a DejaVu Bold ESPREMIDA na horizontal (~78%), que é o jeito
# honesto de imitar a condensada sem fingir que temos a fonte certa. Se um dia
# a Oswald entrar no repo, é só apontar OSWALD_TTF pra ela e tirar o aperto.

import argparse, os
from PIL import Image, ImageDraw, ImageFont

CREME = (244, 236, 214, 255)
INK   = (12, 12, 12, 255)
GOLD  = (255, 196, 0, 255)
BRANCO= (255, 255, 255, 255)
W, H  = 1080, 1350          # 4:5 — o formato de post que mais aparece grande

OSWALD_TTF = None           # se um dia a Oswald vier pro repo, aponta aqui
BOLD = OSWALD_TTF or '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
REG  = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
APERTO = 1.0 if OSWALD_TTF else 0.78   # espremida que imita a condensada


def hexrgb(h):
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), 255)


def texto(base, xy, txt, size, cor=INK, bold=True, center=False, aperto=None, direita=False):
    """Escreve texto. `aperto` < 1 espreme na horizontal (efeito condensada).
    `direita=True` encosta o fim do texto no x pedido (sem isso o endereço do
    rodapé vazava pra fora da arte)."""
    f = ImageFont.truetype(BOLD if bold else REG, size)
    tmp = Image.new('RGBA', (1, 1))
    w, h = ImageDraw.Draw(tmp).textbbox((0, 0), txt, font=f)[2:]
    lay = Image.new('RGBA', (max(w, 1) + 8, max(h, 1) + 8), (0, 0, 0, 0))
    ImageDraw.Draw(lay).text((4, 4), txt, font=f, fill=cor)
    ap = APERTO if aperto is None else aperto
    if ap != 1.0:
        lay = lay.resize((max(1, int(lay.width * ap)), lay.height), Image.LANCZOS)
    x, y = xy
    if center:
        x -= lay.width // 2
    elif direita:
        x -= lay.width
    base.alpha_composite(lay, (int(x), int(y)))
    return lay.width, lay.height


def caixa(d, x, y, w, h, bg=BRANCO, sombra=8, borda=5, raio=26):
    """Caixa da casa: borda preta grossa + sombra DURA deslocada (nunca blur)."""
    d.rounded_rectangle([x + sombra, y + sombra, x + w + sombra, y + h + sombra],
                        raio, fill=INK)
    d.rounded_rectangle([x, y, x + w, y + h], raio, fill=bg, outline=INK, width=borda)


def cabe(img, cx, cy, maxw, maxh):
    """Encaixa a arte no espaço SEM distorcer (a proporção real é sagrada)."""
    im = img.copy()
    im.thumbnail((maxw, maxh), Image.LANCZOS)
    return im, (int(cx - im.width / 2), int(cy - im.height / 2))


def monta(a):
    im = Image.new('RGBA', (W, H), CREME)
    d = ImageDraw.Draw(im)
    c1, c2 = hexrgb(a.c1), hexrgb(a.c2)

    # ── faixa de cima: o anúncio ────────────────────────────────────────────
    caixa(d, 60, 56, W - 120 - 8, 96, bg=INK, sombra=8, borda=5)
    texto(im, (W // 2, 78), 'NOVO CLUBE BATIZADO', 46, cor=GOLD, center=True)

    # ── o ESCUDO, herói do post ─────────────────────────────────────────────
    caixa(d, 60, 190, W - 120 - 8, 500, bg=BRANCO)
    esc, pos = cabe(Image.open(a.escudo).convert('RGBA'), W // 2, 440, 470, 430)
    im.alpha_composite(esc, pos)

    # ── nome do clube + onde ele joga ───────────────────────────────────────
    texto(im, (W // 2, 716), a.clube.upper(), 104, center=True)
    sub = f'SÉRIE {a.serie}'
    if a.antigo:
        sub += f'   ·   no lugar do {a.antigo}'
    texto(im, (W // 2, 838), sub, 34, cor=(0, 0, 0, 150), center=True)

    # ── embaixo, lado a lado: a MASCOTE e o MANTO ───────────────────────────
    # as duas caixas de baixo alinham EXATAMENTE com a caixa do escudo (60 →
    # 1012). Sem essa conta a da direita sobrava pra dentro e o post ficava torto.
    LARG = W - 120 - 8            # mesma largura da caixa do escudo
    by, bh, vaob = 900, 282, 22
    bw = (LARG - vaob) // 2
    caixa(d, 60, by, bw, bh, bg=BRANCO)
    masc, pos = cabe(Image.open(a.mascote).convert('RGBA'),
                     60 + bw / 2, by + bh / 2 - 20, bw - 70, bh - 84)
    im.alpha_composite(masc, pos)
    texto(im, (60 + bw / 2, by + bh - 52), (a.mascote_nome or 'MASCOTE').upper(),
          32, cor=(0, 0, 0, 170), center=True)

    # o MANTO: listras centradas na caixa (o jogo desenha assim), e o rótulo
    # numa tarja da cor 2 pra ficar legível por cima de qualquer combinação.
    mx = 60 + bw + vaob
    caixa(d, mx, by, bw, bh, bg=c1)
    larg, vao, n = 44, 34, 3
    total = n * larg + (n - 1) * vao
    x0 = mx + (bw - total) / 2
    for i in range(n):
        lx = x0 + i * (larg + vao)
        d.rectangle([lx, by + 6, lx + larg, by + bh - 74], fill=c2)
    d.rounded_rectangle([mx + 6, by + bh - 68, mx + bw - 6, by + bh - 6], 20, fill=c2)
    texto(im, (mx + bw / 2, by + bh - 60), 'MANTO', 32, cor=BRANCO, center=True)

    # ── rodapé: de quem é o clube + o endereço ──────────────────────────────
    caixa(d, 60, 1206, W - 120 - 8, 96, bg=INK, sombra=8, borda=5)
    quem = f'batizado por {a.dono}'
    selos = []
    if a.fundador: selos.append(f'👑 fundador nº{a.fundador}')
    if a.socio:    selos.append(f'sócio nº{a.socio}')
    texto(im, (100, 1224), quem, 32, cor=BRANCO)
    if selos:
        texto(im, (100, 1262), '  ·  '.join(selos).replace('👑 ', ''), 26, cor=GOLD, bold=False)
    texto(im, (W - 100, 1242), 'leilaolegends.com', 30, cor=GOLD, direita=True)
    return im


if __name__ == '__main__':
    p = argparse.ArgumentParser(description='Mockup padrão de batismo (post 1080x1350)')
    p.add_argument('--clube', required=True)
    p.add_argument('--serie', default='D')
    p.add_argument('--antigo', default='')
    p.add_argument('--escudo', required=True)
    p.add_argument('--mascote', required=True)
    p.add_argument('--mascote-nome', dest='mascote_nome', default='')
    p.add_argument('--c1', required=True, help='cor 1 do manto (#RRGGBB)')
    p.add_argument('--c2', required=True, help='cor 2 do manto (#RRGGBB)')
    p.add_argument('--dono', default='')
    p.add_argument('--socio', default='')
    p.add_argument('--fundador', default='')
    p.add_argument('--saida', required=True)
    a = p.parse_args()
    monta(a).convert('RGB').save(a.saida, quality=95)
    print(f'{a.saida}  ·  {os.path.getsize(a.saida)/1024:.0f} KB')
