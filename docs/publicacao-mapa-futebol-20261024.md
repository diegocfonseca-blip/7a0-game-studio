# Publicação autorizada: mapa e futebol 3D (24/10/2026)

Pedido de Diego: disponibilizar agora na própria conta o mapa e a partida existentes. A autorização substitui, para esta entrega, a orientação anterior de manter os testes apenas locais.

## Escopo

- Integra o trabalho acumulado até `7130fec9` com a produção `e65fc493`, preservando tema Guimarães, salas online e demais mudanças recentes de `main`.
- Mantém o acesso ao mapa/replay avançado limitado à conta já autorizada pelo servidor de autenticação. Não abre o teste aos demais usuários.
- Preserva cidade, estádio evolutivo, personagens Civis/NO FACE, uniformes, câmera livre com zoom contínuo e opção de transmissão.
- O replay usa os eventos do Motor2 oficial. Nenhuma alteração de resultados, overalls, categorias, descanso, rankings ou premiações nesta publicação.
- Nenhuma escrita no banco, avanço de rodada ou alteração da carreira realizada para publicar.

## Validação

- Build de produção com `DEPLOY_BASE=/ VITE_ONLY_GAME=escalacao npm run build`: passou após a integração de `main`.
- `scripts/testa-presidente-acesso-v68.cjs`: passou, incluindo revogação ao trocar conta e bloqueio de respostas antigas. Transporte de autenticação simulado no teste.
- `scripts/cartoon-football/test-official-parity.mjs`: passou após a integração; execução independente do motor comparada ao adaptador 3D.
- Save da conta consultado apenas para leitura: Neymarzetti, temporada 5, rodada 38. Comparação com a fixture de desenvolvimento: somente `simSpeed` difere; elencos, condições, resultados, estádio e demais campos são iguais.
- Recursos de execução auditados: modelos, clipes, uniformes e variantes civis referenciados estão versionados. Não incluir exports de carreira, credenciais ou arquivos locais de experimentação.

## Como abrir

Em `https://leilaolegends.com/`, atualizar a página e entrar na conta autorizada. Abrir a carreira salva do Neymarzetti, **Clube → Estrutura/Estádio → REVER JOGO SALVO EM 3D**. O jogo salvo recente é fora de casa; o botão de replay permite revê-lo sem avançar rodada. **Ampliar mapa** abre a navegação livre e **Transmissão** acompanha a bola.

## Limites da versão

Versão de testes, sem promessa de repertório completo ou qualidade final de futebol. Domínio, condução, transições, deslizamento residual, contraste entre uniformes claros e cobertura de capturas ainda têm pendências registradas na bancada. Laterais manuais sem captura válida não devem ser apresentados como animações aprovadas. A calibração de contatos revisada é específica da partida verificada; outros saves usam validação de compatibilidade. Desempenho em aparelho físico permanece pendente.

O envio a `main` aciona o workflow existente de GitHub Pages. A confirmação de publicação depende do resultado desse workflow; compilação local, isoladamente, não comprova implantação.
