# Mapa e campo do estádio públicos — 15/11/2026

Diego autorizou liberar para todos o mapa, a reorganização do Clube, o passeio e a visão do jogo dentro do estádio. Pediu manter os carros já adquiridos visíveis, suspender negociações e mostrar “Em breve” até revisar a arte. Confirmou que o presidente não pode comprar carros por enquanto. Também relatou marcadores de jogador exagerados quando passeia ou assiste sentado.

## Liberação e limites

- `PRESIDENCY_STADIUM_RELEASED = true`; a apresentação deixa de depender da lista privada de Diego. `presidentPreviewEmail` e sua verificação continuam privados: essa identidade não foi concedida a outras contas.
- Mapa/reorganização/ações continuam condicionados a uma carreira solo de futebol e ao clube humano no comando (`podeAlterarPresidencia`). Outros modos e a autoridade das salas não passam a usar essa autorização. Co2 mantém seus gates anteriores; nenhuma sala foi convertida em cidade compartilhada.
- O campo do placar e da Copa pode publicar a fotografia existente para o mapa nas contas comuns. O adaptador das competições internacionais usa a mesma liberação. Contextos, equipes, resultado, clock e fontes continuam os existentes; não foi criado outro motor ou outra partida. Onde uma competição/save não fornece contexto/replay compatível, esta entrega não inventa um.
- Passeio liberado com o mapa, incluindo NPCs existentes, destinos e arquibancada. Continua local, sem chat por proximidade ou novas mensagens de posição.
- Permissões das ações locais do estádio acompanham a publicação. Cada domínio/reducer continua validando modo, clube, bens, saldo e plano; autenticação da conta, RLS e permissões do host não foram modificadas.

## Veículos em preparação

- Trava única `NEGOCIACAO_VEICULOS_LIBERADA = false`: carros, motos e bicicletas ficam sem compra, venda ou troca. A UI mostra “Em breve”, retira seletores de troca e impede confirmação a partir do preview.
- O case `PRESIDENCY_TRADE` também recusa pedidos de veículo ou com veículo dado na troca. Esconder o botão não é a única proteção.
- Carros já possuídos continuam na garagem e nos bens, com a dupla de exposição preservada. A casa avisa que a negociação está em preparação. Nenhum bem foi retirado, devolvido ou reembolsado.
- Móveis mantêm o fluxo existente; a trava não bloqueia a economia inteira.

## Proporção na câmera de observador

O Campo 2D usa círculos de aproximadamente 3,9 m de diâmetro no plano do estádio e pode aumentá-los para garantir 18/24 px na vista alta. Essa regra ficava exagerada na câmera baixa do passeio/arquibancada.

- Em passeio ou ângulo baixo, os marcadores têm diâmetro máximo de 1,1 m; a bola passa de 1,45 para 0,4 m de diâmetro visual, com altura e sombra correspondentes. Esses valores são apresentação, não dimensões ou posições do motor.
- A visão alta mantém os marcadores e seu tamanho mínimo de tela. Não muda o Campo 2D da aba Jogos.
- A bola respeita a profundidade da cena na vista baixa; nomes de times e balões decorativos largos não atravessam essa câmera. Técnico, árbitro e auxiliares acompanham o limite visual dos marcadores.
- A identificação “Na arquibancada” fica abaixo para não encobrir o placar no celular. Câmera, cadeira, escalações, gols e posições de origem permanecem.

## Verificação

- `node scripts/imersao-mapa/test-map-private-gate.cjs`: publicação pública independente da identidade privada; respostas antigas não reabrem identidade; renovação preservada; logout revoga a prévia privada. Auth simulada, sem backend.
- `node scripts/teste-mapa-publico/liberacao.mjs`: outra conta gratuita simulada vê mapa, reorganização e passeio; carro possuído visível; botões “Em breve” desabilitados. Orçamentos válidos de compra/venda/troca são recusados pelo reducer real sem alterar saldo/bens. Móvel continua comprável; outro clube e modo online são recusados.
- `node scripts/teste-mapa-publico/visao.mjs`: quadro local idêntico de 22 jogadores, câmera real da cadeira em 390/1440 px; marcadores 3,9 → 1,1 m, bola 1,45 → 0,4 m; vista alta 3,9 m e posições da fonte intactas. `MAPA_ANTES=1` usa a revisão anterior servida localmente para capturas comparáveis.
- `node scripts/teste-mapa-publico/relogio.mjs`: placar real com conta comum simulada, fonte compartilhada de 22 jogadores, minuto avança, abrir observação não reinicia, pausa congela e retomada conserva a partida. Apenas WebGL caro é substituído neste teste de relógio; a geometria/câmera real é verificada no teste de visão.
- `PRESIDENCIA_QA_ORIGIN=http://127.0.0.1:4201 node scripts/teste-mapa-publico/copa.mjs`: ida/volta, gol aos 92 antes de trocar perna, mudança de velocidade sem retrocesso, placar e pênaltis depois do encerramento, com prévia privada desligada.
- `node scripts/teste-clube-organizacao/verifica.mjs`: oito acessos em celular/computador e conta comum gratuita, 320 px, mesmo canvas, navegação preserva save, débito e progresso de uma obra locais.
- `node scripts/testa-presidencia-estacionamento-carreira.mjs`: cases reais do reducer e extrato, etapas, recusas, outro clube, saves antigos e patrimônio. Atualizado o harness com o carimbo de obra já existente em produção.
- `node scripts/testa-passeio-livre.mjs`, `npm run fim` e `npm run build`.
- Fixtures internacionais: 7 classificações G8/G9, 72 clubes, 3 campanhas e histórico/pontos idempotentes.

Testes em bancada, identidades simuladas e rede externa bloqueada: não são testes autenticados em contas reais nem medição no telefone de Diego. Evidências e publicação em `/workspace/shared/mapa-publico-20261115/`. Não houve migração, consulta de conta real ou mudança em canais/sincronização das salas. O custo gráfico permanece no aparelho; não é promessa de FPS em todo dispositivo.

## Reversão

Reverter este commit restaura o alcance anterior. A identidade da prévia continua separada, e a trava de veículos é explícita para não reativar negociações acidentalmente. A publicação preserva os arquivos das versões anteriores; clientes já abertos precisam atualizar para carregar as novas regras, sem forçar recarga de salas em andamento.
