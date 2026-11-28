# Pregão aberto público — 28/11/2026

Diego aprovou o vídeo de celular (“Perfeito. Adorei assim”), pediu a versão de computador e depois autorizou publicar tudo para todos em desktop/celular. Os protótipos anteriores não eram a implementação de produção. Esta entrega integra a apresentação aprovada à entrada real `PregaoAberto`.

## Comportamento

- Uma carta maior no celular; duas cartas lado a lado, com mesas independentes.
- Virada no lugar, carimbo com comprador/preço, pequeno martelo, sem popup de revelação ou botão de continuar. Próxima carta e prazos continuam pertencendo ao motor existente (5s do martelo, 2s da revelação).
- Três compras reais da sala, com miniatura da carta e escudo do comprador. Sem fabricar histórico em partida nova/save antigo. Miniatura sai da carta e chega à faixa em 650ms; não atrasa motor ou lances. Não voa para destino fora da tela; movimento reduzido conserva apenas o destaque.
- Campinho sempre aberto: `YourPitch` conserva manto, titulares/banco, formação e regras de visibilidade existentes. Celular: faixa acima do campo substitui a linha de vagas. Computador: vagas na lateral com campo, faixa ampla abaixo das mesas. Tablets estreitos empilham informações dentro de cada mesa para não cortá-las.
- Shell, navegação, saída/gerência da sala, presentes e avisos globais permanecem existentes. Uma cópia dos controles e da faixa por viewport. Atalhos de teclado preservados e ignorados durante edição de campos.

## Escopo e preservação

Liberação por política de apresentação pública, sem depender de conta/flag privada. Vale para o pregão normal de jogadores de futebol, inclusive o fluxo que já usa esse pregão em reservas/transferências. NBA, Vice City, pacotes de clubes, Kings e Pokémon conservam os renderizadores existentes. Envelope, Tocaia, demais modos e prévias privadas não foram redesenhados.

Sem modificação de store/reducer, auction-core, protocolo de rede, catálogo, OVR, saves, preço, salário, banco ou planos. Convidado envia as mesmas ações autenticadas com `by`, `mgrId`, `mesa` e `cardId`; somente host/solo emite ticks. Valores, vagas, posição e dinheiro comprometido na outra mesa são validados por `paPodeLancar`. Contagem usa `agoraSala`, não o relógio local desajustado.

Som do pregão novo preservado: tique de lance, aviso de lance coberto, contagem, martelo de venda para a sala e sino de lenda. Identificação de vendas novas não depende do tamanho do histórico (limitado a 60 pelo motor).

## Verificações executadas

- `npm run build`: TypeScript e Vite concluídos. Vite adicional depois dos ajustes finais de CSS. Avisos existentes de plugins/importações dinâmicas não impediram o build.
- Pregão completo com uma/duas mesas: pagamentos, recusa de lances inválidos, vagas e passagem até cerimônia. Regressões de pregão NBA, Vice City, relógio sincronizado e publicação sem recarga automática passaram.
- `scripts/testa-pregao-visual-policy.mts`: público sem conta especial, uma/duas cartas, exclusão dos formatos próprios.
- Chromium com entrada real `PregaoAberto`, reducer real e dados locais de bancada: 320×720, 360×800, 432×936, 701×900, 1024×768, 1280×720 e 1440×900; uma/duas mesas. Sem erros JavaScript ou overflow da página. Rechecagem de 701/1024 após correção do corte interno do tablet.
- Lance pelo mouse/Enter/atalhos, input sem interceptação, assento atual, dinheiro reservado na outra mesa, convidado sem tick, envio com identidade/carta, atraso sem confirmação, confirmação pelo host, histórico vazio, movimento reduzido, desmontagem durante voo e resize sem duplicação.
- Carimbo preserva nome da carta; pagamento correto; virada no lugar e próxima carta automática; voos chegam à faixa quando origem/destino estão visíveis. Compras anteriores não animam novamente ao montar.

Capturas e resultados da bancada em `/workspace/shared/pregao-publico-20261128/` durante a revisão. A bancada bloqueia destinos externos; não acessa contas nem altera saves reais. Não representa medição física de desempenho em celular ou teste de uma sala real com 20 aparelhos.

## Reversão

`PREGAO_VISUAL_PUBLICO=false` em `pregao-visual-policy.ts` restaura a seleção anterior de renderizadores sem migrar estado. Alternativa: reverter o commit isolado desta entrega. Fluxo de publicação existente conserva bundles antigos e não recarrega automaticamente quem está jogando.
