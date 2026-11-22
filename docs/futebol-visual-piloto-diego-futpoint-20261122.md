# Visual das partidas de futebol — piloto de Diego e Futpoint

Pedido de 22/11: “Faça na minha conta […] pro Futpoint apenas p eu testar c ele. Qlqr coisa podemos tirar”. O mockup aprovado é o futebol com placar cinema, campo 2D, velocidade e mascote no gol. Esta entrega é a apresentação dos componentes reais, com os controles já existentes.

## Quem recebe

- Diego principal: `diego.c.fonseca@gmail.com`.
- Futpoint: `gfpicolo13@gmail.com`, conferido no cadastro do clube/mascote do próprio projeto.
- Apenas partidas das salas online de futebol (`season`, `liberta`, `champions`). Carreira, basquete, pregão, sala de espera e Pokémon ficam fora.
- Identidade vem do `getUser` já usado por `online-preview.ts`. Uma resposta atrasada ou erro não libera o teste. A conta do Futpoint não ganha as outras prévias privadas de Diego.
- Não concede host, não troca `youIdx`, não altera dados, SQL, RLS, relógios, resultados ou payloads. Nenhum canal, mensagem ou consulta periódica foi adicionado.

## Antes → depois

| Antes | Piloto |
|---|---|
| Seletor de visual em lista pequena | Dois botões: Placar cinema e Campo 2D, ligados ao seletor original e às mesmas permissões |
| Controles de velocidade em janela | Auto/Manual e velocidade à vista, somente onde o jogo já mostra o controle ao dono |
| Abas discretas | Botões creme/dourado: Partida, Tabela/Chave, Estatísticas, Elenco e, quando existente, Rivalidades |
| Tática em faixa | Cartão “Mude o plano” com as três táticas atuais e aviso de validade no próximo jogo |
| Placar do cinema com caixa clara no meio | Estádio, placar grande claro, escudos verdadeiros e rádio preservada |
| Sem saída específica do experimento | “Voltar ao visual anterior” no topo, preferência local por conta |

Cinema/campo continua sendo uma escolha do dono para o **próximo jogo** de toda a sala. Auto mantém a última velocidade escolhida; não copia o reset de velocidade da simulação ilustrativa. O botão de próxima rodada continua bloqueado durante a partida. O Pular só aparece quando o componente original o fornece.

O campo usa o `Campo2D` real, sem mudar geometria, jogadores ou motor. A mascote do clube continua com a animação real de comemoração. Não foi usada a mascote ilustrativa do mockup. Gols/assistências, estatísticas e proteção contra spoilers seguem na implementação existente.

**Pressão alta, caminho do ataque, ritmo tático e marcação especial do mockup não foram ativados nesta entrega.** O motor atual resolve o resultado antes da exibição. Esses comandos precisam de implementação própria na simulação e sincronização; não há botões decorativos fingindo mudar o resultado em andamento. O usuário foi informado durante a execução.

## Reversão

- Para testar o desenho antigo: botão no topo, sem recarregar nem remontar a partida. Reativar pelo mesmo lugar.
- Preferência apenas neste aparelho/conta: `esc-football-match-pilot-off:<email>`; não vai ao Supabase ou à sala.
- Desligar para ambos: `FOOTBALL_MATCH_PILOT_ENABLED = false` em `football-match-pilot-policy.ts` e publicar. Nenhum save exige migração.

## Validação

- `npm run build`: compilação completa passou.
- `node scripts/testa-football-match-pilot.mjs`: contas exatas, escopo, Auth com erro/logout/troca/resposta atrasada, sem herdar outras prévias.
- `npm run vel-2d`: passou; velocidade absoluta e Auto conservando a marcha.
- `npm run sala-troca-2d`: passou. Foi atualizada uma verificação textual antiga que ainda esperava Kings totalmente oculto, apesar da prévia própria aprovada em 11/11. Nenhuma regra de Kings mudou.
- `npm run recarga`: passou; sem recarga automática no deploy e retenção de assets preservada.
- Bancada de navegador: `scripts/teste-football-match-pilot/`, Chromium a 390 e 1280 px. Importa componentes reais, simula apenas a identidade verificada e bloqueia requisições externas. Testa botões, handlers, permissões do participante, desabilitados, seleção pendente, Auto/velocidade, retorno sem remontar a partida, persistência local e remoção ao trocar conta/esporte/carreira.
- Evidências da sessão: `/workspace/shared/futpoint-visual-qa-20261122/` (capturas + `resultado.json`). **Não equivale a uma sala ao vivo com as duas contas autenticadas nem a teste físico no S25**; esse é o teste que Diego e Futpoint farão.

Não adicionar novidade pública nem ampliar a lista de contas sem novo pedido do Diego.
