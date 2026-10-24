# Contraste temporário dos uniformes 3D

Diego autorizou em 24/10/2026: manter sempre o próprio uniforme padrão; se o rival tiver uniforme parecido, aplicar uma variante baseada nas cores dele, até existir outra camisa. Não cadastrar essa apresentação como uniforme oficial.

O observador vem do ID real do clube da carreira, passado somente à apresentação. A proteção vale tanto em casa quanto fora. Sem identificação do observador, nenhuma equipe é trocada por suposição. O motor oficial, a entrada Motor2 e o banco não recebem essa propriedade.

`kit-contrast.mjs` compara luminosidade e diferença de cor das camisas. Vermelho e azul não são considerados iguais apenas por terem brilho parecido. Na colisão, somente o rival recebe uma variante: cores secundárias/acentos do catálogo 3D e do cadastro público `BATISMOS`, depois tonalidades derivadas da própria cor. Uniformes sem conflito ficam originais.

Nas artes com UV validado, recolore o tecido mantendo sombras, padrões e cores de detalhes. Escudos e inscrições possuem retângulos de proteção explícitos nas coordenadas da arte original; seus pixels RGBA são preservados. Nada de aplicar filtro sobre a imagem inteira. Caches da variante possuem chave própria, compartilhada entre os jogadores e liberada ao encerrar as instâncias. Costas/numeração e meiões acompanham a variante; short mantém a composição existente. A malha, o rig e as animações ficam intactos.

Primeiro teste: Neymarzetti continua branco/preto; Rei da Bola recebe vermelho escuro derivado de sua faixa vermelha, preservando as faixas vermelha/preta e os símbolos. A arte original permanece disponível e inalterada.

Limite do acervo: somente Neymarzetti e Rei da Bola já possuem receitas UV validadas nesta biblioteca 3D. Nos demais clubes a seleção de cores funciona sobre a roupa genérica existente, aproveitando as cores públicas disponíveis; isso não significa que suas artes completas já estejam adaptadas. Cada nova receita deve proteger escudos e patrocínios antes de permitir recoloração.

Validação: teste de unidade para observador mandante/visitante, ausência de conflito, identidade desconhecida, configs originais imutáveis e pixels protegidos; bancada real com 22 Civis e o save somente para leitura, sem erros JS. Texturas e captura da partida em `test-results/kit-contrast/`. Não mediu FPS em aparelho físico e não alterou o save. Publicação exige sucesso da pipeline normal.
