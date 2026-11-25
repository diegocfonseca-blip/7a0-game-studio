# Chegada e apresentação diretamente na Central — 25/11/2026

Diego aprovou a prévia animada e determinou: “E pode aparecer isso na central sem precisar jogar pro mapa.. E nem precisa ter Ct pra isso!! Pode fszer”. Entrega desta etapa: contratação e apresentação ilustradas, nas carreiras de futebol Brasil Oficial e tradicional. Não inclui construção de CT ou um sistema de treino.

## Comportamento

- A Central reproduz a cena de 12 segundos dentro do cartão. Há Pular/Seguir, Ver elenco e repetição. Nenhum desses controles abre o mapa para esta apresentação.
- Só há cena para uma compra registrada na temporada/rodada atual, cujo jogador continua no elenco. Craques/lendas também podem gerar o fato quando a compra custa menos de 25 moedas. Recompra do próprio clube não inventa chegada.
- Mantidos o limite de um acontecimento por vez, o intervalo existente e o diário limitado do save. Ao terminar, o cartão permanece até seguir; visitar outra aba ou retomar o save não reapresenta automaticamente o fato já assistido.
- Identificação por nome, clube e ano, usando o mesmo catálogo de avatares da coletiva. A arte específica do exemplo só representa Romário/Vasco/2000; os demais usam seu retrato real do catálogo e peças neutras de vestuário. Sem avatar disponível, a apresentação usa uma camisa neutra, sem emprestar o rosto de outro atleta.
- Movimento reduzido aguarda reprodução manual. Aba escondida pausa; saída desmonta o canvas e cancela os agendamentos. Erro de imagem/desenho oferece continuidade e repetição, sem travar a carreira.

## Integração e peso

O componente é carregado sob demanda, somente com o cartão visível. Canvas 2D independente, até 24 desenhos/s e notificações de estado a cada quarto de segundo. O relógio do mapa não altera o relógio desta cena. Reprodução transitória limitada a 12 eventos; as marcações definitivas usam o diário existente. Não há novo campo de save, SQL, alteração de OVR, gasto, prêmio ou resultado esportivo.

As duas artes grandes são WebP: cenário 55.086 bytes e atlas 57.182 bytes, abaixo do teto de 60 KB por imagem grande. Fontes: peças geradas a partir da arte e dos avatares do jogo usados no mockup aprovado, conservados em `/workspace/generated_images/`; retratos e personagem da diretoria existentes no jogo. Não se distribui o vídeo de 2,2 MB como dependência da carreira.

Basquete, F1, salas online e carreira compartilhada não recebem esta ativação. As outras cenas do bairro conservam o caminho nativo do mapa. A apresentação nova não requer acesso ao mapa.

## Verificação

- `testa-cenas-bairro-central.mts`: fontes reais, prioridade, intervalo, histórico e câmeras anteriores passaram.
- `testa-chegada-central.mts`: contratação atual de lenda por preço baixo; recompra própria; seleção sem mapa; ativação explícita; diário; relógios isolados; revisão de replay; memória limitada passaram.
- Bancada com começo nativo das duas carreiras: Brasil Oficial/Romário em 390 px e tradicional/Zico em 1440 px, com conta grátis. Assistir, replay, pular, elenco, retorno e save/retomada passaram. Sem canvas do mapa, sem erros de página, caixa/notas/rodada preservados.
- Movimento reduzido, falha de imagem com retry, erro de desenho com saída segura e retrato ausente passaram. Capturas são da integração React real, não da página estática do mockup.
- `npm run recarga`: passou; nenhuma atualização automática de quem está jogando.

Na revisão visual final, o retrato genérico foi ancorado à mesa, com enquadramento da diretoria pela cintura, para evitar um busto flutuando acima da bancada. A captura adicional `enquadramento-mobile.png` confirma o ajuste com o avatar de Zico.

Build completo e estado de publicação são registrados em `/workspace/shared/central-chegada-integrada-20261125/`. Capturas e relatórios ficam no mesmo diretório. Não há alegação de FPS medido em aparelho físico. Reversão pelos commits desta etapa.
