# Uma partida, cinema / campo 2D / mapa 3D — 24/10/2026

Decisão expressa de Diego: os três modos mostram a mesma partida. Placar, gols, minutos, autores, assistências, narrações e comentários precisam compartilhar os acontecimentos oficiais. A câmera e os desenhos mudam; escolher uma vista não pode mudar resultado ou criar um roteiro futebolístico independente. Não interpretar esse esclarecimento como autorização para alterar unilateralmente as probabilidades ou reescrever resultados salvos.

## Auditoria

O campinho com `elencos.m2` e o adaptador 3D usam `novoMotor2` com a mesma entrada. O placar cinema recebia os gols oficiais, mas ainda gerava chances em `chancesDoJogo`, comentários em `radioDoJogo` e uma descrição do gol em `lanceDoGol`. A celebração do cinema também acrescentava uma espera antes de contar o gol. Portanto, placar final igual não comprovava a igualdade dos acontecimentos e da narração. O verificador de replay comparava gols/autores/minutos, mas ignorava assistências; o bloqueio de jogo histórico incompatível era restrito ao 3D.

## Alterações

- Transcrição somente de leitura do motor existente, com seus eventos, placar e texto do narrador. Sem um sorteio adicional de frases ou oportunidades de gol. Uma tabela de alterações da partida é reutilizada pela apresentação e pela conferência do replay; trocar de câmera não grava dados nem simula um novo resultado.
- Cinema de partidas Motor2 consome essa transcrição, com o relógio do campo. Quando o 2D está montado, utiliza o minuto preciso já publicado por ele. Gols aparecem quando existem na sequência oficial; não aguardam a fila visual de outro roteiro. Cenas e narrações aleatórias do cinema são desativadas nesse caminho.
- O texto oficial acompanha o estado publicado ao mapa e ao campo 3D, inclusive no replay de revisão. A aparência dos jogadores, a cidade e as animações permanecem.
- Conferência de replay inclui assistência. Resultado histórico incompatível é preservado e não autoriza reproduzir outro resultado no 2D ou 3D. Cinema continua podendo mostrar os fatos salvos. Uma mudança de idioma não deve alterar fatos da partida.
- Modos legados sem `EntradaM2` preservam sua apresentação anterior. Não declarar que foram migrados ou que todos os modos online passaram a usar Motor2.

## Validação e limites

`test-three-presentations.mjs`: três partidas locais, 5.641 instantes a 60 Hz cada, comparando placar e eventos entre motor do 2D, transcrição do cinema e adaptador 3D. Narração do cinema igual ao texto do motor 2D, PT/EN sem alteração nos eventos dessas entradas. Conferidos gols, minutos, autores e assistências; autoria/minuto/assistência adulterados são recusados. Seek consulta a mesma sequência, e a entrada não é modificada.

Bancada de navegador com o `LiveScoreCard` real e o estado publicado ao mapa: oito pontos conferidos (0, 10, 15, 16, 42, 43, 60, 93), mesmos placares e frases, nenhuma chance sintética e nenhum erro JavaScript. Execução adicional com relógio livre completou a partida na tela, sem regressão do placar ou gol duplicado. Troca de rodada volta a 0×0; assistência adulterada bloqueia o replay. Captura em `cinema-e-mapa.png` é da integração local, não uma publicação na conta.

Rei da Bola FC × Neymarzetti: 1×1 / 82 eventos. Variantes locais de QA: 1×0 / 77 e 2×0 / 72 (não são novas rodadas da carreira). A comparação independente de posições do adaptador continua disponível em `test-official-parity.mjs`. Evidências em `test-results/cartoon-football/tres-apresentacoes/`.

Esta correção de integração não resolve por si só o domínio distante, a rigidez corporal ou a naturalidade da condução. Motor2/atributos/regras de posse não foram modificados. Saves antigos sem registro integral de ações não podem ganhar um replay fiel apenas a partir do placar: se não houver compatibilidade, não inventar movimentos para forçar o resultado. Não houve gravação de banco/save nem publicação.
