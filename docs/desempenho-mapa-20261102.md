# Diagnóstico de desempenho do mapa — 02/11/2026

Base: f5507bd8. Alterações locais na branch `fix/desempenho-mapa-20261102`.

O perfil isolado usa uma cópia local somente de leitura do save Neymarzetti e da rodada 4, viewport 390×844. Não acessa Auth nem grava carreira. Chromium usa SwiftShader: tempos de desenho NÃO representam FPS de um celular físico. A bancada congela o passeio e separa atualização de desenho; não certifica desempenho durante uma partida oficial inteira.

## Evidências

- Vista geral: 556 draw calls, 842.630 triângulos. Campo: 306 chamadas e 1.234.421 triângulos. São os mesmos antes/depois; nenhuma peça da cidade foi retirada.
- Atualização medida: aproximadamente 1 ms por quadro nessa bancada. O principal custo observado está no desenho; não há evidência de Supabase/Reatime como causa dessas travadas.
- Perfil móvel permite pixel ratio 2,5. Comparado a 1,25, isso representa quatro vezes mais pixels. FPS de aparelho real ainda precisa ser medido.
- Antes: 97 instâncias civis montadas inicialmente, 537 nós SkinnedMesh na cena geral. Depois: 56 instâncias montadas inicialmente e 322 nós; 41 ficam pendentes até a primeira visibilidade. Personagens e rotas seguem existindo logicamente.
- Medidas completas de altura passaram a usar cache por arquivo e escala do pai: 6 varreduras iniciais em vez de uma por personagem. O teste comparou 17 calibrações com medidas completas, incluindo 16 combinações de variante/escala, e verificou apoio dos pés e descarte.
- Abertura local observada: 21,1 s antes e 14,6 s depois. São amostras únicas de ambiente de desenvolvimento, sujeitas a cache/compilação; não usar como promessa de ganho percentual.

## Correções

1. Cache de calibração dos civis, sem mudar malha, rig, animação ou medida final.
2. Montagem sob demanda apenas para frequentadores/funcionários dos botecos, equipe de apoio e preparação do estádio. Jogadores, delegações e ambulantes que controlam a sequência de chegada mantêm a prontidão anterior. Arquivos GLB continuam compartilhados em cache.
3. Resolução adaptativa do canvas em GPU real: reduz após lentidão sustentada, preserva pelo menos a resolução nativa e, quando disponível, 1,25 pixels físicos por pixel CSS. Recupera lentamente. Não muda sombras, relógios, simulação, escala física, entradas ou câmera. GPU de software mantém o tratamento anterior.
4. Diagnóstico informa escala adaptativa e pixel ratio efetivo.

## Validação

- Teste puro: queda sustentada, tela 30 Hz, pausa em segundo plano, recuperação e resolução mínima.
- Navegador: variantes/escala, calibração contra bounds completos, pés no piso, primeira visibilidade e descarte de ator ainda pendente.
- Perfil antes/depois: mesmas três vistas, mesmas chamadas de desenho e contagem de triângulos.
- Fingerprint do motor oficial preservado: `23599bdba04b0c7c2639389e2509f4d81a34796083f78b6a5d81e97c0d22bbbd`.

Publicação das otimizações autorizada por Diego em 02/11/2026, junto à câmera lateral fixa. Nenhuma alteração de banco realizada nesta correção. Ainda é necessário validar navegação e FPS no aparelho do usuário, sobretudo com partida em andamento. Resolução adaptativa pode suavizar a imagem quando acionada; não resolve sozinha todos os custos de geometria e sombras.
