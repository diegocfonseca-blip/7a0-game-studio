#!/usr/bin/env python3
# ─── 📸 ESTEIRA DE ROSTO PRONTO (GPT / Gemini) → formato do jogo ──────────────
#
# Pergunta do Diego (19/08): *"e se o chat gpt fizer as imagens dos jogadores?
# com base no tamanho que precisamos... porque hoje tem mais de mil jogadores
# mas em breve terão 3 mil também"*.
#
# Eu recomendei fazer só os craques (a conta está no `docs/pendencias.md`), mas
# ele decidiu fazer TODOS: *"não se importe com o tempo que vai demorar, mas eu
# vou fazer de todos sim... posso lançar aos poucos"*. Decisão dele, e o sistema
# foi montado pra isso: **quem tem foto usa foto, quem não tem fica exatamente
# como está hoje**. Com 10 prontos, só esses 10 mudam. Nunca fica meio quebrado.
#
# Este script é a esteira: o Diego joga a pasta de imagens que o GPT gerou, e
# aqui sai tudo no formato do jogo, com o peso conferido.
#
#   python3 scripts/rosto/foto-jogador.py --pasta ~/rostos-gpt
#   python3 scripts/rosto/foto-jogador.py --pasta ~/rostos-gpt --lado 200 --teto 12
#
# O que ele faz com CADA arquivo:
#   1. casa o nome do arquivo com um jogador REAL do `data.ts` (sem acento, sem
#      caixa, sem "-" nem "_"). Arquivo que não casa com ninguém é avisado e
#      NÃO entra — assim não nasce rosto órfão no jogo.
#   2. tira o fundo branco (flood fill a partir da borda — o miolo branco do
#      desenho fica, igual fazemos com escudo de batismo).
#   3. corta no limite do desenho (bbox do alfa), senão a margem transparente
#      faz o rosto renderizar menor que os outros e ainda ocupa KB à toa.
#   4. reduz pro lado máximo (padrão 200px = 2× os 100px do card grande).
#   5. salva .webp (quality 85, method 6) em `public/rostos/` — fora do bundle.
#   6. avisa TODO arquivo que passar do teto de peso, com o nome, pra ninguém
#      commitar sem ver.
#   7. reescreve `src/escalacao/rostos-lista.ts` (arquivo GERADO) olhando a
#      pasta — é assim que o jogo fica sabendo quem já tem rosto.
#
# ⚠️ REGRA DO DIEGO QUE VALE AQUI (18/08): não inventar como uma pessoa real é.
# Se o GPT não souber quem é o jogador, ele vai desenhar QUALQUER coisa — e não
# avisa. Então, na dúvida sobre um jogador obscuro/folclórico, é melhor NÃO
# gerar: sem foto, a carta fica como sempre foi, e isso nunca fica errado.
import argparse, collections, os, re, sys, unicodedata

try:
    from PIL import Image
except ImportError:
    sys.exit('falta o Pillow: pip install Pillow')

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA = os.path.join(RAIZ, 'src', 'escalacao', 'data.ts')
# 📸 as fotos moram em public/ (copiadas como estão, SEM entrar no bundle).
# Ver o cabeçalho de src/escalacao/rostos.ts: com 3.000 imports o bundle
# carregaria 3.000 endereços que TODO jogador baixa. Assim, custo zero.
SAIDA = os.path.join(RAIZ, 'public', 'rostos')
LISTA = os.path.join(RAIZ, 'src', 'escalacao', 'rostos-lista.ts')


def chave(s: str) -> str:
    """nome comparável: sem acento, sem caixa, só letra e número."""
    s = unicodedata.normalize('NFKD', s)
    s = ''.join(c for c in s if not unicodedata.combining(c))
    return re.sub(r'[^a-z0-9]', '', s.lower())


def slug(s: str) -> str:
    s = unicodedata.normalize('NFKD', s)
    s = ''.join(c for c in s if not unicodedata.combining(c))
    return re.sub(r'-+', '-', re.sub(r'[^a-z0-9]+', '-', s.lower())).strip('-')


def jogadores():
    """{chave: (nome, fama)} lido do baralho — fonte única, sem lista paralela."""
    txt = open(DATA, encoding='utf-8').read()
    out = {}
    for m in re.finditer(r'name:\s*"([^"]+)"[^}]*?fame:\s*(\d)', txt):
        nome, fama = m.group(1), int(m.group(2))
        out.setdefault(chave(nome), (nome, fama))
    return out


def tira_fundo(im: Image.Image, tol=232) -> Image.Image:
    """fundo branco vira transparente, a partir das bordas (miolo branco fica)."""
    im = im.convert('RGBA')
    w, h = im.size
    px = im.load()
    vis = bytearray(w * h)
    dq = collections.deque()
    for x in range(w):
        dq.append((x, 0)); dq.append((x, h - 1))
    for y in range(h):
        dq.append((0, y)); dq.append((w - 1, y))
    while dq:
        x, y = dq.popleft()
        if x < 0 or y < 0 or x >= w or y >= h or vis[y * w + x]:
            continue
        p = px[x, y]
        if p[3] == 0:
            vis[y * w + x] = 1
            dq.extend(((x+1, y), (x-1, y), (x, y+1), (x, y-1)))
            continue
        if not (p[0] > tol and p[1] > tol and p[2] > tol):
            continue
        vis[y * w + x] = 1
        px[x, y] = (255, 255, 255, 0)
        dq.extend(((x+1, y), (x-1, y), (x, y+1), (x, y-1)))
    return im


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--pasta', required=True, help='pasta com as imagens do GPT/Gemini')
    ap.add_argument('--lado', type=int, default=200, help='lado maior em px (padrão 200 = 2x o card grande)')
    ap.add_argument('--teto', type=float, default=12, help='teto de peso por rosto, em KB')
    ap.add_argument('--q', type=int, default=85, help='qualidade webp')
    a = ap.parse_args()

    base = jogadores()
    os.makedirs(SAIDA, exist_ok=True)
    arquivos = sorted(f for f in os.listdir(a.pasta)
                      if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')))
    if not arquivos:
        sys.exit(f'nenhuma imagem em {a.pasta}')

    feitos, gordos, orfaos, total = [], [], [], 0
    for f in arquivos:
        nome_arq = os.path.splitext(f)[0]
        achou = base.get(chave(nome_arq))
        if not achou:
            orfaos.append(f)
            continue
        nome, fama = achou
        im = tira_fundo(Image.open(os.path.join(a.pasta, f)))
        bb = im.getbbox()
        if bb:
            im = im.crop(bb)
        w, h = im.size
        if w >= h:
            nw, nh = a.lado, max(1, round(h * a.lado / w))
        else:
            nh, nw = a.lado, max(1, round(w * a.lado / h))
        im = im.resize((nw, nh), Image.LANCZOS)
        dest = os.path.join(SAIDA, slug(nome) + '.webp')
        im.save(dest, 'WEBP', quality=a.q, method=6)
        kb = os.path.getsize(dest) / 1024
        total += kb
        feitos.append((nome, fama, nw, nh, kb))
        if kb > a.teto:
            gordos.append((nome, kb))

    for nome, fama, w, h, kb in feitos:
        marca = '⚠️' if kb > a.teto else '  '
        print(f'{marca} {nome:28.28s} ⭐{fama}  {w}x{h}  {kb:5.1f} KB')

    print(f'\n✅ {len(feitos)} rostos · {total/1024:.2f} MB no total '
          f'(média {total/max(1,len(feitos)):.1f} KB)')
    if gordos:
        print(f'\n⚠️ {len(gordos)} passaram do teto de {a.teto:.0f} KB — recomprimir antes de commitar:')
        for nome, kb in gordos:
            print(f'   · {nome}: {kb:.1f} KB')
    if orfaos:
        print(f'\n❓ {len(orfaos)} arquivos NÃO casaram com jogador nenhum do baralho '
              f'(não entraram, pra não virar rosto órfão):')
        for f in orfaos:
            print(f'   · {f}')
        print('   → o nome do arquivo tem que ser o nome do jogador, igualzinho ao do jogo.')

    escreve_lista()


def escreve_lista(_base=None):
    """reescreve `rostos-lista.ts` olhando o que EXISTE em public/rostos/.

    A lista é a única coisa que o jogo carrega — ela diz quem já tem foto. Quem
    não está nela cai no visual de sempre. Como é gerada a partir da PASTA (e
    não de uma lista escrita à mão), apagar um arquivo já tira o rosto do jogo:
    não dá pra ficar dessincronizado.
    """
    slugs = sorted(os.path.splitext(f)[0] for f in os.listdir(SAIDA)
                   if f.lower().endswith('.webp'))
    corpo = ''.join(f"  '{s}',\n" for s in slugs)
    with open(LISTA, 'w', encoding='utf-8') as fp:
        fp.write(
            '// ⚠️ ARQUIVO GERADO — não editar na mão.\n'
            '// Escrito por `scripts/rosto/foto-jogador.py` toda vez que o Diego passa uma\n'
            '// pasta de rostos novos pela esteira. É só a lista de QUEM já tem foto em\n'
            '// `public/rostos/`; quem não está aqui cai no visual de sempre.\n'
            '//\n'
            f'// Rostos: {len(slugs)}\n'
            'export const ROSTOS_PRONTOS: ReadonlySet<string> = new Set([\n'
            f'{corpo}'
            '])\n')
    print(f'\n📝 rostos-lista.ts atualizado: {len(slugs)} jogador(es) com foto no jogo.')


if __name__ == '__main__':
    main()
