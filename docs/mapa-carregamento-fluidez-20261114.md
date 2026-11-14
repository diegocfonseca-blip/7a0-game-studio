# Abertura e fluidez do mapa — 14/11/2026

Diego mostrou os controles desativados e o cartão “Seu clube” por cima de “Preparando o mapa” e pediu uma análise do que atrapalha a abertura e o movimento. Segue a autorização da prévia exclusiva da conta dele.

## Problemas encontrados e correções

1. O cartão era uma alternativa para falha do 3D, mas também aparecia na espera normal. Agora só aparece em erro. A espera mostra uma mensagem por etapa, sem porcentagem simulada; os controles entram quando o primeiro quadro está pronto. O mesmo visual atende ao carregamento do código sob Suspense.
2. Iniciar replay e operar o teto eram ações expostas antes da cena estar pronta. Ficam abaixo do mapa e dependem da identidade da carreira/estádio efetivamente carregada, inclusive na recarga do teto. Pausar/encerrar um replay já ativo e sair da tela cheia permanecem disponíveis durante uma recarga.
3. O Padrão do mapa de gestão capturava a cidade inteira em seis direções para produzir o ambiente de reflexos. Agora usa o céu neutro já usado no Leve. Alta, interiores e demais vistas mantêm o comportamento anterior. Cidade e estádio passam a ter uma pausa de montagem entre si para devolver o controle à página.
4. Muitas peças fixas do shopping eram desenhadas individualmente. Peças opacas do mesmo material, estado de sombra e região de 64 m são agrupadas. Vidros, modelos com filhos/animação, materiais, textura, triângulos, posições e colisores são preservados. Aplicação limitada ao mapa de gestão em prévia. O proprietário continua liberando os buffers originais e os agrupados ao sair.
5. A perda do contexto 3D deixava a API e os controles aparentemente prontos. Agora interrompe os desenhos, invalida a prontidão para o componente pai e oferece o menu alternativo. A conclusão pendente do carregamento não reativa uma cena que perdeu o contexto.

## Medição e verificação

Bancada local sem contas reais, salas ou gravação em saves. Mesmo estádio completo, vista inicial, hora e quadro decorativo; Chromium com SwiftShader, sem a GPU do telefone de Diego.

| Caso | Chamadas de desenho antes | Depois | Triângulos antes/depois |
| --- | ---: | ---: | ---: |
| Desktop, panorama | 1.015 | 787 | 588.215 / 588.215 |
| Celular, panorama | 953 | 725 | 569.605 / 569.605 |

Isso representa cerca de 22–24% menos chamadas nessa vista. Não significa a mesma porcentagem de ganho de FPS: rasterização, hardware e tamanho da imagem também custam. O agrupamento elimina 237 desenhos das peças fixas; o ganho observado na vista difere pelo recorte dos grupos pela câmera. O preparo dos reflexos no Padrão deixa de desenhar seis vistas completas da cidade. No Leve, esse preparo já era neutro.

- Teste de geometria compara triângulos, UVs, materiais, vidros, volume e colisores; implantação urbana e trava privada passaram.
- Navegador desktop/celular: espera sem atalhos falsos, fim da espera, navegação, gestão, parada dos desenhos sob painel e saída sem canvas remanescente.
- Espera registrada com bloqueio controlado somente na bancada, sem incluir esse bloqueio na medição de desempenho. Saída da tela cheia durante recarga e alternativa quando WebGL não inicia passaram.
- Componente real da carreira com cliente local simulado: teto oculto durante carga, teto funcional após carga e recarga, posição abaixo do mapa, moedas preservadas, perda do contexto recuperada e outra identidade sem a prévia.
- Compilação de produção aprovada. Nenhuma mudança no motor oficial, regras, sincronização, autenticação de produção ou banco.

## Limites e próximo passo de análise

O panorama ainda desenha muitos objetos. A geração da cidade, os modelos, a torcida e os veículos continuam tendo custo; o limitador de resolução/quadros e a pausa quando o mapa está oculto ou coberto permanecem ativos. A avaliação de FPS e tempo percebido no aparelho real deve orientar uma próxima etapa de detalhe por distância ou divisão maior da montagem. Esta mudança não promete ausência de engasgos em todo aparelho.

Antes/depois, relatórios e publicação: `/workspace/shared/mapa-carregamento-fluidez-20261114/`. Chave pública do mapa continua desligada, prévia só na conta confirmada de Diego.
