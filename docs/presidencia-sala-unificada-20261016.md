# Sala da Presidência em 3D — 16/10/2026

**Atualização posterior:** Diego rejeitou a aproximação geométrica do
personagem descrita abaixo. Ela foi substituída pelas mesmas artes originais
do criador; ler [a correção do personagem](presidencia-personagem-original-20261016.md).
Os resultados do antigo boneco permanecem aqui apenas como histórico e não
comprovam fidelidade à arte aprovada.

Continuação autorizada por Diego depois da explicação de que o camarote no
mapa já era 3D, enquanto a tela da Presidência ainda era uma composição
ilustrada com janela viva. Trabalho local, sem nova publicação; acesso
mantido na conta verificada `diego.c.fonseca@gmail.com`.

## Integração

- A tela privada da Presidência abre a sala no mesmo construtor 3D do mapa,
  com móveis comprados, janela, estádio e partida compartilhados.
- As vistas Minha sala, Janela, Presidente e Estante usam o mesmo ambiente.
  Há aproximação, gesto de pinça, arraste e ampliação da sala.
- Perfil/aparência, mobílias, garagem e acesso ao estádio permanecem no fluxo.
  A renderização não compra itens, não altera moedas e não grava o personagem.
- O personagem usa os dados existentes de pele, roupa, cabelo, barba e
  acessórios. É um corpo com volume, sem olhos, nariz ou boca. Fica sentado
  quando possui mesa e cadeira, e em pé sem o conjunto.
- Mesa e cadeira foram orientadas para o presidente olhar para a câmera da
  sala, com o campo atrás. As mãos e os pés usam os apoios correspondentes.
- A coleção usa os títulos realmente conquistados e suas quantidades; a
  estante mostra até nove tipos por página. Na estante de madeira as taças
  ficam nos níveis abertos, fora do armário e da divisória central.
- Na revisão da câmera da estante, foi encontrada uma parte da fachada
  atravessando o interior. Paredes/lajes/vigas que invadiam o volume do
  camarote foram recortadas, preservando a pele exterior oval. A estante e
  os troféus mantêm suas posições reais.
- Escudo, manto e mascote reutilizam as artes existentes da identidade do
  clube, aplicadas aos suportes físicos. Quadro, mesa e estante respeitam as
  compras. A arte preserva sua proporção e os carregamentos são agrupados
  antes de redesenhar a cena.
- Sem acesso privado, permanece a tela anterior. Em falha WebGL, a alternativa
  informa explicitamente que está exibindo a vista ilustrada de compatibilidade.

## Decisão de disponibilidade

A Presidência já existia no começo da carreira. Por isso, a apresentação
interna usa a sala disponível também na várzea. **O exterior continua sem
construir camarote ou arquibancada não comprados.** Esse interior inicial
é uma convenção de apresentação no ponto fixo da Presidência, não a obra
física de um camarote concedida no terreno. Nenhuma propriedade é adicionada
ao save por abrir a sala.

## Limites visuais e funcionais

O personagem e o mobiliário 3D são aproximações geométricas dos dados e do
estilo existente. Não representam reprodução perfeita da arte aprovada.
O personagem está sentado/em pé e não caminha pela sala. Taças têm volume
genérico e exibem a arte específica do título no suporte. Mascote e camisa
usam a arte aprovada aplicada a superfícies, não esculturas completas.
A estante já está livre da fachada, mas sua iluminação ainda está escura;
melhorar esse acabamento continua pendente.

A janela mostra a cena através do vidro; não há reflexão dinâmica completa
de todo o estádio e dos atores. A população enviada por este adaptador não
representa toda a massa de torcedores do mapa.

O navegador local usa Chromium com renderização por software. Houve demora
significativa em chamadas de renderização, inclusive sem a nova coleção.
Uma medição isolada sem coleção teve 168 chamadas e 628.368 triângulos; a
renderização JavaScript posterior ficou na ordem de 6–20 ms, mas a espera
da renderização completa foi maior. Não usar esse dado como prova de fluidez
em celular real, nem atribuir toda a demora às texturas da coleção.

## Validação

- Personagem: 523 combinações de aparência/posição passaram, sem dados
  inventados, sem alterar a fonte, com pés no piso, atualização idempotente
  e descarte de recursos.
- Mobília: compras existentes e apoios preservados após orientar a cadeira.
- Coleção: seis cenários CPU com compras, títulos, paginação, posição física,
  divisória da estante, mesa e descarte.
- Encaixe do camarote: nove etapas, 162 raios para posições de taças,
  315 linhas internas livres e 21 verificações da pele exterior oval.
- A suíte original de arquitetura também passou nas 11 etapas, preservando
  cobertura, assentos, portões e percursos dos NPCs.
- Navegação real da Presidência: sala inicial, perfil, mobílias, garagem e
  estádio passaram sem gravar conta ou executar compra. Esse teste usa um
  substituto do renderizador; a cena WebGL é verificada separadamente.
- Navegador WebGL: PASS em 1200 e 390 px, com dez texturas carregadas e sete
  grupos de títulos. Capturas finais da sala, presidente e estante conferidas
  depois do recorte da fachada, sem placas atravessando o interior.
- Passaram pinça, arraste, várzea/etapa parcial/cobertura fechada, revenda de
  móveis com mudança para a pose em pé, ampliação/Escape, alternativa ilustrada
  em falha WebGL e retirada do acesso privado. Nenhum erro inesperado de página.
  Relatórios `browser.json` e `panel.json` na pasta de evidências.
- Recuperação real após perda do contexto WebGL: PASS. O botão de tentar de
  novo cria outro canvas 3D e reabre a sala, mantendo a fonte intacta e sem
  erros inesperados; relatório `retry.json`.
- A aprovação visual do Diego e a medição em celular físico continuam pendentes.

Evidências em `test-results/sala-unificada/` e testes
`testa-presidencia-presidente-3d.mjs`, `testa-presidencia-sala-colecao.mjs`,
`testa-presidencia-complexo-mobilia.mjs`, `testa-presidencia-sala-unificada.cjs`.
Não houve login real, escrita administrativa no banco, commit ou deploy.
