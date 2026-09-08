# Prévia visual V25 — Online + Carreira, teste fechado

Data: 08/09/2026. Preparada para publicação fechada nas duas contas autorizadas.

## Escopo autorizado

Somente as contas autenticadas diego.c.fonseca@gmail.com e diego.c.fonseca2@gmail.com recebem a nova apresentação no Online e na Carreira. Outros usuários continuam no caminho visual anterior. A lista controla apresentação, não substitui autorização/RLS. Não alterar regras, sorteios, dificuldade, prêmios, comandos do host, assentos ou saves.

## Implementado localmente

- online-preview.ts: acesso inicialmente fechado, getUser verificado, logout e troca de conta invalidam respostas anteriores; nenhum parâmetro de URL/localStorage libera a prévia.
- Placar compartilhado entre Online e Carreira mantém seu relógio, gols revelados, anti-spoiler e timers originais. O ramo visual privado usa a ilustração de estádio, mascote no espaço do escudo e faixa de gol no cabeçalho existente.
- Manual/Auto e velocidade em uma linha. Próxima/Pular preservam callbacks e condições existentes. Permissões de exibição continuam no chamador.
- Abas locais Jogos/Tabela/Estatísticas/Elenco na liga, preservando placar montado. Assistências privadas aguardam revelação.
- Libertadores: meu grupo/todos, escudos de clubes, cabeçalho SG/PTS. Mata-mata mostra ida/volta no lugar de pontos da liga no cabeçalho privado.
- Artes contextuais Libertadores/Copa dos 8. Arte corrigida do Mundial na escolha da seleção.
- Campos opcionais de identificação e escudo no placar para integração completa das seleções; nome do responsável vindo de entrants.club.
- Carreira: o mesmo placar e os mesmos controles visuais da V25 são usados sem criar outro motor. A Liga, a Copa Legends, a Copa do Brasil e a Supercopa ganharam cabeçalhos cinematográficos próprios; as duas últimas usam artes novas, leves e responsivas.
- Carreira: abas, estádio evolutivo, sala, elenco, agência, pregão, contratos, jornal, desbloqueios e saves continuam nos componentes e estados existentes. Mockups rasterizados não foram usados como telas clicáveis e não substituem dados reais.

## Limites conhecidos do teste fechado

- Escudos reais: 24 convertidos e conferidos visualmente, integrados na escolha, grupos e placar principal. Falta revisar os miniplacares e confrontos do mata-mata.
- Concluir organização de grupos/chaveamento das Copas e revisar intro para não duplicar informação. A integração visual é parcial.
- Revisar controles no Mundial: o código atual usa torneio determinístico local após ficha publicada pelo host. Não inventar sincronização nova nem prometer sincronização de relógio sem testes reais.
- Teste funcional com contas host/convidado, navegação durante jogo, pausas, retorno, fim da liga, Copas, cartas, notas da redação e votação. Na Carreira: save antigo/novo, temporada, pregão, elenco, clube/estádio/agência/presidência, jornal e desbloqueios.
- Testar caminhos de usuários comuns/offline/basquete após wrappers de apresentação (preservar layout anterior).
- Confirmar tamanhos de mascotes reais dentro do slot, além da fixture de apresentação.
- O teste automatizado valida determinismo e regras da Copa; ainda é recomendável conferir uma partida real com as duas contas em aparelhos diferentes, especialmente alternando Jogos/Tabela durante a rodada.

## Verificação realizada

- TypeScript tsc -b: passou.
- Vite build: passou; avisos existentes de bundle grande/import circular estático-dinâmico. Pasta isolada sem git gera aviso de revisão.
- scripts/check-online-preview.mjs: passou (duas contas, comum, sufixo malicioso, logout, erro e corrida de sessões).
- scripts/qa-match-v25.cjs: passou em 320/390/1440px, sem overflow horizontal; ritmo 44px em uma linha, altura do placar idêntica antes/depois do gol. Fixture somente visual, não simulação online real.
- scripts/checa-vigias-online.mjs: passou.
- scripts/qa-copa-windows.cjs: usa a página e assertivas originais de checa-copa-online.mjs no Edge/Windows; passou determinismo, identidade, 24 seleções, convocação e regras de prazos.
- Script original de Copa usa npx e Chromium Linux; seu erro no Windows foi contornado pelo adaptador sem mudar motor/assertivas.

## Base e arquivos

Cópia isolada de work/publish-online-v20. screens.tsx, copa-mundo.tsx, copa-mundo-online.tsx, sport.ts, index.tsx, CLAUDE.md e docs/pendencias.md atualizados previamente a partir de main 4c1907ced13692734abef607986a4eadc47d8ff8. pyramidseason.tsx também atualizado desse SHA nesta etapa. Demais arquivos podem estar antigos: nunca publicar toda a pasta.

Fontes novas: online-preview.ts, online-match-visual.tsx, online-match-visual.css e national-crest.tsx. Alterados: screens.tsx, pyramidseason.tsx, copa-mundo.tsx, copa-mundo-online.tsx. QA HTML/TSX são entradas locais e não fazem parte do build principal.

### Escudos reais das seleções

national-crest.tsx e img/nations-v25 contêm os 24 escudos. SVGs originais preservados em art-sources/nations, obtidos da coleção [football-logos](https://github.com/JoseArroyave/football-logos), caminhos logos/<país>/<nome>_National_Team.svg (Portugal: Portuguese_Football_Federation.svg; Holanda: Dutch_National_Team.svg). São marcas das respectivas associações, não identidades geradas pelo jogo. Conferência conjunta: outputs/selecoes-v25-conferencia.png na raiz do workspace. Conversão para WebP a 128px, todos abaixo de 30KB, sem redesenhar os brasões. Manter proveniência e verificar direitos de uso antes de qualquer distribuição fora do teste autorizado.

Artes: src/escalacao/img/online-estadio-v25.webp, online-liberta-v25.webp, online-copa8-v25.webp, online-mundial-v25.webp. V23/V24 preservadas.

## Proveniência da arte do Mundial

Modo: imagegen integrado, edição precisa de objeto. Resultado recuperado: C:/Users/diego/.codex/generated_images/01a068ed-c601-77d3-9af4-1aa6893fab81/exec-5de57902-589b-44d5-a7b1-73174e96127a.png. Inspecionado visualmente e convertido para WebP 1280px/35.306 bytes no projeto.

Prompt final: Use case: precise-object-edit. Edit target: supplied illustrated football competition hall. Change ONLY the trophy on the right: replace the generic football ball trophy with an accurate recognizable traditional FIFA World Cup Trophy introduced in 1974, sculptural golden two human figures holding up a WORLD GLOBE with geographical continents (NOT soccer-ball panels), narrow twisting gold body, round malachite-green double band base. Keep exact position, size footprint, pedestal, perspective and warm lighting. Preserve every other part of the existing painterly cinematic illustration: dark stone hall, arch, stadium lights, folded jerseys, left negative space. No UI, text, logos, captions or people added. Illustrated painted style, not a photograph. Landscape.

## Artes próprias da Carreira

- Copa do Brasil: `src/escalacao/img/carreira-copa-brasil-v25.webp`, 1280 px, 58.774 bytes. Fonte gerada: `exec-f56e5bc3-0e9b-4457-adf1-71cfd7f50ac4.png`.
- Supercopa: `src/escalacao/img/carreira-supercopa-v25.webp`, 1280 px, 58.102 bytes. Fonte gerada: `exec-64b54773-ccd4-4bf8-8510-6054704d0860.png`.
- Ambas foram geradas em modo `stylized-concept`, inspecionadas visualmente e mantêm espaço negativo para a interface nativa. Não contêm textos, logos nem controles rasterizados.
