# Estádio, NPCs e Presidência — validação local em 12/10/2026

**Não publicado.** Base `2496b73b`, alterações acumuladas na branch `work`.
Preservada a restrição funcional à conta verificada `diego.c.fonseca@gmail.com`.
Não houve commit, push, deploy, compra, autenticação real ou escrita remota.

## O que está disponível para conferir

- `qa-presidencia-revisao.html`: 24 capturas do estádio, entorno, campo, personagens, reposições, criação e sala.
- `qa-presidencia-etapas.html`: 47 cenários selecionáveis, com mapa e janela usando o mesmo save de teste. Inclui cada clique de investimento, compras isoladas para inspeção e evolução acumulada. Não é uma sequência obrigatória de compras e não altera a carreira.
- `docs/presidencia-retomada-sessao.md`: histórico, decisões, evidências e limites de todas as continuações.

## Resultado por requisito

| Requisito | Evidência local |
| --- | --- |
| Campo vazio até estádio completo, com obras fracionadas | 47 cenários × 2 câmeras × larguras 390/900; imagens carregadas e sem transbordamento |
| Cobertura somente após os dois andares | Regras de compra e renderização, incluindo investimento incompleto por centavos |
| Ruas, asfalto e lotes de estabelecimentos | 4.096 combinações do mapa; edifícios só com aquisição correspondente |
| NPCs e carros sem atravessar objetos ou uns aos outros | Percursos de dez minutos, obstáculos, destinos e oclusão; aplica-se às rotas atuais e à amostragem registrada |
| Campo, bola e personagens integrados ao zoom | Geometria 3D, escala em metros, contato dos pés, recorte de câmera compartilhado e buffer com pelo menos um pixel por pixel CSS nos cenários testados |
| 11 por lado, juiz, técnicos e reservas | XI real do contexto; reservas reais fornecidos; área técnica no lado oposto à barreira frontal; personagens sem traços faciais |
| Partida sincronizada com abas/placar | Componentes reais de placar/copa/internacional, relógio compartilhado, pausa/4×, gols, intervalo, ida/volta, local da partida e apito final |
| Passe, domínio, defesas e reposições | Testes de contato, recepção, lateral, saída após gol, escanteio, tiro de meta, trave, bola para fora e recuperação do goleiro |
| Sala e personagem da Presidência | Revisão anterior dos lotes 1/2, cadastro, móveis, veículos, falhas de gravação, autosave local e janela; preservada nesta continuação |

## Correções finais desta continuação

Lateral: preparação de 0,95 s no relógio da partida, flexão para recolher a bola no chão, sustentação pelas mãos e soltura acima da cabeça. Pés mantidos na posição; adversários afastados antes do preparo. Substituir cobrador ou receptor durante o gesto reinicia a cobrança com o XI atualizado, sem deixar a bola sem dono.

Defesa segura: mãos → baixar a bola → queda à frente do corpo → domínio → passe. A transição mantém a posse e não concede tiro de meta. Pausa congela o gesto; 4× usa o mesmo relógio. Substituições preservam a pose dos atletas que continuam em campo.

Árbitro: direção, distância percorrida e velocidade passaram para o motor compartilhado. A passada não depende de abrir outra câmera nem muda num redesenho pausado.

Custo das poses: reutilizadas as matrizes já atualizadas para medir os pés, sem percorrer repetidamente os mesmos ancestrais. Comparadas 400 poses completas, sem mudança de transformações. Última mediana de 1.600 poses: 20,52 ms → 8,45 ms; chamadas redundantes medidas no exemplo: 64 → 0. É uma medida de CPU do esqueleto, não FPS do jogo. Não se reduziu resolução ou geometria.

## Limites que impedem declarar validação final em produção

- Celular físico não foi testado. Emulação Chromium/SwiftShader ainda mediu 6,3 / 3,3 / 3,0 / 3,9 FPS nos quatro formatos, com relógio próximo de 4×. A fluidez não está aprovada; esses números não representam um aparelho real.
- No último teste do gol 4×, o prazo programado de 225 ms teve callback em 452,3 ms e publicação em 791,1 ms no renderer por software. O resultado e a ordem dos eventos passaram; a latência não deve ser apresentada como perfeita.
- Login, carreira e gravação na conta real/nuvem não foram conferidos nesta sessão. Gate e persistência foram testados com identidades/fixtures locais.
- Arquibancadas e entorno continuam ilustrados, registrados com profundidade. Campo e personagens internos são volumétricos; não foi convertido todo o mundo em geometria 3D.
- O motor exibe os eventos oficiais e produz circulação visual entre eles. Não calcula o resultado nem constitui uma simulação completa de arbitragem, cartões, impedimentos e física. Não foram inventadas estatísticas para preencher lacunas da fonte.

## Verificações principais reproduzíveis

Servidor local: `npm run dev -- --host 127.0.0.1 --port 4196 --strictPort`.
Navegadores de teste bloqueiam rede externa. Executar as suítes de navegador em sequência e sem editar arquivos durante a execução, para evitar recarga do Vite.

- Motor: `node scripts/testa-presidencia-futebol-motor.mjs`.
- Contato e gestos: `testa-presidencia-contato-bola.mjs`, `testa-presidencia-recepcao.mjs`, `testa-presidencia-lateral.mjs`, `testa-presidencia-distribuicao.mjs`, `testa-presidencia-saida.mjs`, `testa-presidencia-mergulho.mjs`, `testa-presidencia-arbitro.mjs`.
- Poses e custo: `testa-presidencia-atleta-3d.mjs`, `testa-presidencia-pose-custo.mjs`, `testa-presidencia-instancias-browser.cjs`, `testa-presidencia-sombras-browser.cjs`.
- Evolução e entorno: `testa-presidencia-evolucao.mjs`, `testa-presidencia-acessos.mjs`, `testa-presidencia-encontros.mjs`, `testa-presidencia-etapas-revisao.cjs`, `testa-presidencia-mapa-3d-etapas.cjs`.
- Reposições visuais: `node scripts/testa-presidencia-lateral-browser.cjs` e o mesmo comando com `--goleiro`.
- Integração: `testa-presidencia-sincronia-browser.cjs`, `testa-presidencia-placar-real.cjs`, `testa-presidencia-copa-browser.cjs`, `testa-presidencia-internacional-browser.cjs`.
- Revisão móvel e galeria: `testa-presidencia-dispositivos.cjs`, `testa-presidencia-galeria.cjs`.

Publicar somente na etapa final combinada com Diego. A disponibilidade local não comprova deploy nem autoriza liberar a funcionalidade para outras contas. Para recolher uma publicação futura, usar as flags da integração, preservando os saves.

Compilação final: `npm run build` aprovado; log local em `/tmp/presidencia-reposicoes-integradas-build.log`. `git diff --check` sem problemas. Avisos de importações/chunks e tempo de plugins não bloquearam a compilação. Backup de continuidade atualizado, sem substituir o repositório nem publicar.
