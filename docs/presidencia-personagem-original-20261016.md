# Personagem original na sala da Presidência — 16/10/2026

Diego rejeitou a aproximação geométrica do presidente na sala: ela usava os
IDs salvos, mas recriava o corpo, cabelo e roupas com formas e cores genéricas.
A exigência é mostrar o mesmo personagem escolhido no criador, sem olhos,
nariz ou boca e sem redesenhar sua aparência.

## Correção

- Removida a reconstrução procedural de `presidencia-presidente-3d.ts`.
- `presidente-textura-original.ts` compõe os WebP originais pelo mesmo
  contrato do editor: `camadasDoPresidente` → `montarPresidenteLayers` →
  `camadasNaPose` → `aplicarTomPele`. Inclui as 33 roupas e suas artes sentadas,
  cinco tons de pele, cabelo, barba e acessórios escolhidos.
- Pele é processada na resolução nativa; offsets e ordem do catálogo são
  preservados, inclusive coordenadas fracionárias da pose sentada. Não há
  nova roupa, novo save nem concessão de peças.
- A composição entra na cena como superfície com textura transparente,
  coordenadas físicas e teste/escrita de profundidade. A mesa e a cadeira
  ocultam as partes que ficam atrás. Não há overlay por cima dos móveis.
  A sombra usa ambos os lados da superfície para receber luz frontal; a
  imagem visível continua apenas na frente, sem criar um verso espelhado.
- As solas são medidas na arte de cada roupa para apoiar o personagem no
  piso/tapete. Mesa e cadeira juntas selecionam a arte sentada; sem o conjunto,
  usa a arte em pé da mesma roupa.
- O material mantém as cores da arte original. A composição completa só
  aparece depois do carregamento de todas as camadas. Trocas antigas são
  canceladas; falhas mostram aviso e botão de tentar novamente, sem substituir
  o personagem ou modificar sua escolha.
- Na conferência da cena completa, o processamento pesado em renderização
  por software atrasou `onload` e provocou um timeout falso. O prazo de 15s
  agora é por imagem e confere se o arquivo já está completo antes de falhar;
  dimensões ainda são obrigatórias. O download começa após preparar a cena,
  e o redesenho fica separado da promessa da arte. Atualizações de mobília
  sem alteração não provocam outro desenho desnecessário.
- Sala, estádio pela janela, partida, móveis comprados e coleção continuam
  no ambiente 3D existente. O acesso privado à conta verificada de Diego
  permanece inalterado.

## Limite explícito

A arte original tem vista frontal. Esta solução é a **arte original integrada
à sala 3D**, não um modelo volumétrico idêntico de 360°. Não foram inventados
costas, perfil ou animações. A superfície não gira para perseguir a câmera nem
mostra uma cópia espelhada no verso. O material também preserva a iluminação
pintada da arte, em vez de alterar seu acabamento com a exposição do estádio.
O canvas 1024×1536 mantém as coordenadas do rig, mas não cria detalhes além da
resolução dos WebP originais (base 480×720).

## Conferência

- Compositor: 66 artes originais (33 roupas × duas poses) carregadas.
- Editor real × compositor: 16 comparações de pixels, incluindo cinco tons,
  cabelo, barba, acessórios e trajes especiais. Em pé, diferenças nulas ou
  de até 1/255; sentado, diferença média máxima de 0,77/255 pela reamostragem
  CSS/Canvas das coordenadas fracionárias. Nenhum erro inesperado de navegador.
- Contrato CPU: 330 combinações roupa/pele/pose, 56 seleções de peças,
  94 fontes únicas e 297 combinações de posse de móveis. Catálogo e save
  intactos; alfa, seleção inválida e cancelamento aprovados.
- Ciclo de vida no navegador: 66 composições reais, fontes, materiais,
  solas, troca rápida, falha/retry, compra/revenda, descarte único de
  geometria/material/textura e cancelamento de carregamento pendente.
- Prazo de imagem: arquivo real completo com evento `onload` retido passa;
  arquivo incompleto falha; arquivo completo com dimensão errada também
  falha. O evento tardio não conclui a promessa duas vezes.
- Navegação da Presidência: sala recebe o personagem da conta, perfil,
  mobílias, garagem, retorno e acesso ao estádio passam sem gravações.
- Capturas na sala completa em 1200 e 390 px conferidas: arte original
  visível, mãos junto à borda traseira da mesa e corpo ocultado por ela.
- Sala completa: PASS em 1200 e 390 px, pinça, arraste, várzea/etapa parcial/
  cobertura fechada, troca para roupa/pele/cabelo diferentes após revenda,
  ampliação/Escape, alternativa ilustrada em perda WebGL e retirada do acesso
  privado. Partida mantém 22 jogadores; dez artes da coleção carregam, com
  sete grupos de títulos. Nenhum erro inesperado de página.
- Sombra revisada e novas capturas em 1200/390 px conferidas; ciclo de vida
  passou novamente exigindo frente original e sombra em ambos os lados.
- Build final PASS: `DEPLOY_BASE=/ VITE_ONLY_GAME=escalacao npm run build`
  (TypeScript e Vite). Permanecem avisos de tamanho de pacote/importações
  dinâmicas e tempo de plugins; não houve erro de compilação.

Testes: `testa-presidencia-presidente-3d.mjs`,
`testa-presidencia-avatar-original.cjs`, `testa-presidencia-avatar-lifecycle.cjs`,
`testa-presidencia-avatar-timeout.cjs` e `testa-presidencia-sala-unificada.cjs`
(completo, navegação do painel e capturas finais).

Capturas finais em `test-results/avatar-original-20261016/sala-final/`;
regressões completas em `sala/browser.json`, além de `fidelidade.json`,
`lifecycle.json`, `timeout.json` e `build-final.log` na pasta de evidências.
A conferência usa Chromium com renderização por software e tela simulada;
não mede desempenho em celular físico. Os registros de diagnóstico com
timeout são anteriores à correção e não são o resultado final.

Evidências: `test-results/avatar-original-20261016/`.
Sem gravação na conta real, commit, push ou nova publicação nesta correção.
