# Dois visuais, mesmos planos de jogo

Pedido do Diego em 23/11: manter a escolha individual entre visual anterior e
novo; abas superiores selecionadas em roxo também no anterior; táticas com
as novas opções no desenho escuro/creme minimalista do anterior. Rodada
destacada para todos conforme o mockup aprovado; roxo brilhante Promessa só
na conta principal dele.

## Entrega

- Rodada em placa creme com detalhe lilás, preservando a fonte da faixa.
  Disponível nos dois visuais das ligas e grupos continentais compatíveis.
- Abas antigas conservam fontes e dimensões; seleção roxa inclui atalhos de
  tabela/chave e rivalidades, sem mudar o que cada um abre.
- Brilho Promessa usa o degradê `#C9A9FF → #8B5CF6 → #5B2FB0`, reflexo de
  opacidade 0,38 e ciclo de 3,6 s, apenas na aba selecionada. A conta principal
  é reconhecida pelo e-mail já verificado no fluxo existente. Futpoint,
  secundária e público permanecem com roxo sólido. Redução de movimento
  desliga a animação. Sem nova consulta de identidade.
- Plano clássico: postura, caminho do ataque, pressão e ritmo em controles
  escuros com seleção creme. Sem caixa creme grande, título grande ou botões
  amarelos. Usa exatamente o mesmo componente/controlador de plano do novo
  visual, inclusive confirmações e preferências persistentes.
- Nas copas independentes, reutiliza o controlador da própria copa, inclusive
  na final enquanto há partida. O botão de alternar foi reaproveitado dentro
  do modal; o botão de fundo fica oculto enquanto o modal está aberto.

## Limites preservados

A preferência é local, por conta no aparelho, sem mudar o visual de outras
pessoas da sala. Alternar não escreve no estado da partida. Nada de novas
permissões para host/convidado, motor, placar, velocidade, relógios, premiações,
assentos, banco ou canais Realtime. O envio de ordens segue as permissões e
janelas existentes, independentemente da aparência.

Draft continua separado; carreira e basquete fora. Kings mantém os três
controles nativos. O brilho privado não libera outras prévias da conta.

## Validação

180 verificações específicas passaram em 390/1440 px: quatro contas nos dois
visuais, privacidade do brilho e retirada após troca de conta, contraste da
rodada, navegação antiga, manutenção do estado da sala ao alternar, plano salvo
e troca de visual em Eurocopa, regional e Libertadores independentes.

139 verificações de liberação pública e 651 de regressão geral passaram
novamente, sem exceções JavaScript. `npm run build` (TypeScript/Vite) e
`git diff --check` passaram. Testes de navegador em bancada com rede externa
simulada, sem entrar em salas reais. Teste físico no S25 continua pendente.

Roteiro: `scripts/teste-football-full/visuais.mjs`. Capturas e resultados:
`/workspace/shared/visuais-classico-20261123/`.

Reversão em commit isolado, sem migração de banco ou de saves.
Aplicação pedida pelo Diego para todos, com o brilho restrito à conta principal.
Acompanhar conclusão da publicação no GitHub Actions; evidência em
`/workspace/shared/visuais-classico-20261123/publicacao.json`.
