# Apresentação privada do online e Partida Rápida — 09/11/2026

Diego aprovou a implementação dos mockups no desktop e celular e autorizou publicar somente para sua conta principal. A última revisão troca Ajustes por **Velocidade**, mantém os anúncios somente em texto e amplia a comemoração do campeão.

## Ativação e isolamento

`useOwnerPresentation` reaproveita a verificação autenticada já existente em `online-preview.ts`. Somente `diego.c.fonseca@gmail.com`, confirmado por `auth.getUser()`, recebe a apresentação. Trocar ou sair da conta fecha a prévia antes da próxima verificação; respostas antigas não podem reabri-la. A segunda conta de testes mantém sua prévia anterior.

O contexto `OwnerOnlineProvider` é local à apresentação. Nenhum flag é gravado na sala ou no save; a identidade não vem de parâmetros de URL, metadata, nome do técnico ou tier. O contexto recebe dados de apresentação da tela, sem importar o motor. O público conserva os componentes e estilos existentes. Carreira, carreira online e basquete ficam fora deste escopo.

## Organização aprovada

- Cabeçalho com marca, retorno ao menu, salas e cor real do plano da conta.
- Um jogo principal nativo, sem duplicar a simulação. Abas compactas, seletor Placar rápido/Campo 2D e três táticas expostas.
- Próxima rodada como ação principal; Pular secundário durante a apresentação. O botão respeita `canNext`, host, cadeados e o encerramento nativo do lance. Nenhum desses cliques troca Manual/Auto.
- Velocidade abre Manual/Auto e as marchas válidas do modo. O diálogo aceita Escape, contém o foco e o devolve ao botão. Os comandos e limites dos relógios existentes continuam iguais.
- Anúncio de texto abaixo dos controles, sem foto. Somente a renderização privada omite a foto; o cadastro do patrocinador permanece intacto.
- Placar termina na narração; autores dos gols vêm acima. Cena do mascote e dimensões nativas do campo preservadas.
- Todos os confrontos continuam na lista, inclusive o do usuário. Tabelas e rivalidades continuam acessíveis. A chave usa os nomes das fases já definidas, sem inventar futuros classificados ou mostrar resultados antecipados.
- Na tela do computador, os atalhos da sala vão para a coluna lateral; no celular mantêm a navegação inferior existente.
- Campeão tem troféu da competição em destaque, escudo, retratos identificados por nome/clube/ano do elenco real e mascote cadastrado quando houver. Duração, sons, resultados e prêmios da comemoração continuam nativos.

## Competições

Os pontos de integração abrangem Liga Legends, Liga da Turma, Liga Draft, leilões (envelope, Tocaia, pregão e envelope único), Copa dos 8, Libertadores, Champions (incluindo repescagem), mata-mata relâmpago, Copa do Mundo, Eurocopa e Rio–São Paulo, Sul–Minas–Paraná e Nordeste. As taças mantêm suas identidades próprias. Não altera seleção de cartas, regras dos campeonatos, simulação ou pagamentos.

## Validação

- `node scripts/testa-online-visual-privado.mjs`: isolamento de conta, troca de sessão, erro de autenticação, resposta atrasada e escopo. Passou.
- Bancada no navegador usando componentes reais e backend simulado, sem entrar ou gastar recursos na conta real. Verificações de conta comum, segunda conta e convidado: sem liberação de controles de host.
- Interações nativas: Velocidade dispara SET_SIM_SPEED/SET_VEL_2D; mantém rodada e Manual; tática dispara a seleção existente; Escape fecha o diálogo. Campo 2D medido em 365 × 491 px na viewport de 393 px.
- Anúncio com foto de exemplo: nenhuma imagem na prévia; foto continua presente na apresentação pública e no objeto original.
- Testes existentes de Copa congelada e tática da Copa passaram. `testa-sala-online.mjs` tem duas asserções de código-fonte antigas que também falham na base `8b9e8969`: conta duas chamadas literais de `chamarMaisGente`, embora já haja uma, e exige a classe antiga da barra, removida em 28/10. Nenhuma dessas regras de negócio foi alterada nesta entrega.
- O teste antigo `testa-relogio.mjs` também exige um payload literal `host_ping` que já não existe na base atual; a checagem de sincronização no navegador rodou, com essa única asserção antiga pendente. Relógios e heartbeat não foram editados nesta entrega.
- Matriz compilada: **238 verificações** em 1440 e 393 px, incluindo 72 verificações de fases do mata-mata, sem erros de execução, estouro lateral, controles de reprodução duplicados ou jogo principal duplicado. Também conferido o diálogo em 320, 360 e 1920 px. A sala de espera foi aberta pelo formulário nativo de código, com quatro participantes simulados.
- Evidências e matriz de fases: `/workspace/shared/owner-online-publicacao-20261109/`. As capturas da versão compilada usam a mesma implementação, com dados sintéticos e rede externa bloqueada. Arquivos da bancada não são publicados.
- `npm run build` completo passou. Confirmar o workflow oficial de Pages antes de anunciar publicação concluída.

## Reversão

Reverter o commit desta apresentação devolve o visual anterior sem migração de banco, save ou sala. Não desligar `ONLINE_VISUAL_RELEASED`: essa chave é da apresentação pública anterior e não desta prévia.
