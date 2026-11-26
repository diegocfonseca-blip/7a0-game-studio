# Cores das camisas brasileiras na apresentação — 26/11/2026

Diego autorizou camisas reconhecíveis para os clubes reais, inclusive B/C/D, usando cores e escudos já disponíveis. São camisas estilizadas, não réplicas perfeitas da temporada nem especificações oficiais de HEX.

## Escopo

- Cobertura dos 228 clubes brasileiros cadastrados: A20, B20, C20, D96 e E72 (clubes apenas estaduais na organização interna).
- 186 paletas complementares; 42 receitas brasileiras clássicas já existentes têm prioridade e permanecem intactas. Arte de camisa de batismo continua com prioridade no renderizador.
- Correspondência pelo nome canônico exato. Confiança SE/PB, Operário PR/VG/MS, Primavera MT/SP e Capital DF/TO conservam identidades distintas.
- Cores independem da divisão, do tier ou do clube histórico da carta. A apresentação usa o clube que contratou.
- Portuguesa usa faixas horizontais e Sampaio Corrêa verticais. Demais novas paletas usam acabamento simples de duas/três cores. Maringá usa base verde para manter legível seu escudo preto.
- Sem novos arquivos de arte: reutiliza os escudos disponíveis. Quinze clubes ainda usam o fallback genérico preexistente, listados no manifesto. Não foram criados escudos oficiais fictícios.
- Sem mudanças em OVR, categorias, economia, elenco, salvamento, modalidades online ou acesso a prévias privadas. Sem trabalho de cor adicional por quadro: tecido preparado antes da animação.

## Fontes e limites

O manifesto JSON irmão registra clube/UF/divisão, paleta aproximada, arquivo e SHA256 do escudo existente e referências externas consultadas nos casos que precisavam de confirmação. A identidade visual do catálogo local foi revisada manualmente; pixels majoritários de um escudo não determinam automaticamente a camisa. Estrelas, bola e versões monocromáticas podem distorcer essa leitura.

RSSSF (https://www.rsssf.org/colours/brazil.html) é apoio histórico, não referência atual universal. Sites oficiais e reportagens de uniformes corrigem os casos duvidosos; links estão nos respectivos registros. Não se afirma que todas as 186 camisas foram confrontadas com fotos oficiais. As cores HEX são aproximações de famílias visuais para o jogo. Itabirito e ABECAT preservam a identidade dos clubes hoje cadastrados, sem aplicar renomeações anunciadas para 2027.

## Validação

- `scripts/testa-cores-camisas-br.mts`: cobertura de todos os clubes, nomes válidos, cores, independência de fallback/tier, homônimos e clube criado pelo usuário.
- `CHEGADA_CLUBES_MENORES=1 CHEGADA_NATIVE_ONLY=1 ... node scripts/teste-cenas-carreira/chegada.cjs`: Athletic móvel, Confiança desktop e Portuguesa móvel; apresentação, replay, seguir/elenco, ausência de mapa, memória de cena vista, nenhum erro de página ou mudança de moedas/notas/rodada.
- Galeria gerada pelo pintor real do jogo: Athletic, Confiança, Portuguesa, Galvez, Manauara, Maringá, Operário VG e Confiança-PB. Conferência visual em móvel/desktop.
- `npm run build` completo e `npm run recarga`.
- Capturas e logs locais: `/workspace/shared/cores-clubes-20261126/`. Publicação deve ser confirmada pelo deploy do commit; este documento não antecipa sucesso do deploy.

## Reversão

Commit isolado: reverter a inclusão das paletas e o pequeno acabamento de terceira cor. A reversão não depende de SQL nem altera o progresso das carreiras.
