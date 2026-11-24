# Carreira: relato de trava e proposta compacta para celular — 24/11/2026

Diego enviou foto de um usuário com Flamengo, temporada6, SérieB, rodada10/38. O placar mostra0′ e a primeira fala da narração1′. Pediu investigar travas e avaliar o tamanho dos cabeçalhos/escudos no celular. A conta do relato ainda não foi informada; a foto não fornece o estado do save nem comprova em que ponto parou.

## Resultado até aqui

- Bancada com componentes reais, sem abrir ou escrever contas/saves de produção. Liga, elenco, placares e narração gerados pelo próprio jogo.
- Partida legada chegou ao apito; o motor atual também. No Oficial com Flamengo naB/T6/R10, foram verificados relógio, pausa na Central, retomada, mudança de velocidade0,5×→4×, término aos93′ e apresentação das três opções de transmissão para o próximo confronto. Celular390×844 e desktop1440×1000. Registros locais em `/workspace/shared/travas-carreira-20261124/`.
- A primeira fala ser etiquetada1′ enquanto o relógio começa em0′ é a convenção da narração (`floor(t/SEG_POR_MIN)+1`). Isso sozinho não identifica um defeito. Não alterar motor nem placares para fazer coincidir as etiquetas.
- O primeiro teste de continuação esperava encontrar os botões diretamente na Central. A tela atual abre essas escolhas ao tocar no próximo confronto; coletiva também pode interromper a semana até terminar. O teste foi corrigido para seguir essa navegação. Não se atribuiu esse engano da bancada ao produto.
- Uma leitura da pausa150ms depois da troca de aba pegou atualização em trânsito no desktop; a verificação passou a aguardar500ms antes de comparar o relógio pausado. Isso não é reprodução da trava de0′ relatada.

**Não foi identificada/reproduzida a trava do usuário. Nenhuma correção funcional desse relato foi declarada concluída.** Para prosseguir no caso exato, falta identificar a conta e distinguir minuto parado, interface sem resposta ou partida encerrada sem avanço. Nenhuma conta mencionada em relatos anteriores foi presumida como sendo esta.

## Proposta visual, apenas local

`/workspace/shared/travas-carreira-20261124/compacto-preview.css` é carregado opcionalmente pela bancada após capturar o visual atual. Não está importado pelo aplicativo e não deve ser publicado/commitado como novo visual antes da aprovação prevista no `CLAUDE.md`.

- Cabeçalho da competição mais curto, conservando rodada/divisão, data/temporada, patrocinador, status, torcida/posição/saldo.
- Escudos56px; números do placar continuam em destaque. Táticas, modais e fontes globais não são alterados.
- Em390px, bloco da competição234–237→178px e duelo189→136px:109–112px liberados. A regra é limitada a600px; desktop conservou as medidas.
- Prévia real em `proposta-390.png`; original em `atual-390.png`. São dados de teste, não o save da foto do usuário.

## Reprodução e limites

```sh
node scripts/teste-travas-carreira/verifica.mjs
# Capturar também a proposta visual local, ainda sem aprovação:
LL_CAREER_PREVIEW_CSS=/workspace/shared/travas-carreira-20261124/compacto-preview.css node scripts/teste-travas-carreira/verifica.mjs
```

A bancada sobe Vite em5340, usa Chromium/Playwright e bloqueia todas as requisições externas e WebSockets. Instrumenta funções de navegação e leitura de estado somente no servidor de teste. Não injeta apito nem finaliza a partida por fora do motor. Estado de teste não é persistido. WebGL é desligado para isolar o placar; não mede FPS3D, aparelho físico, Supabase ou sincronização da nuvem. No ensaio de iniciar a rodada11, o próprio jogo gerou uma lesão de Rafinha e pediu confirmar Varela como substituto. O teste deve responder pela interface antes de esperar o avanço; uma pausa por decisão não comprova uma trava. A execução final passou em390/1440: confirmou a troca pela interface, avançou à rodada11 e o relógio continuou; nenhuma exceção de página. `verificacao.json` e `/tmp/travas-resultado-final.log` registram o resultado. Não se atribui a lesão do cenário sintético ao usuário da foto.

Não houve alteração de código do produto, banco, migração, placar salvo ou publicação. A investigação do save do usuário permanece pendente.
