# Prévia privada: avatares e carreira — 10/09/2026

Escopo autorizado por Diego: somente `diego.c.fonseca@gmail.com` e
`diego.c.fonseca2@gmail.com`. A allowlist continua em `online-preview.ts`,
validada por `supabase.auth.getUser`, desligada por padrão e após logout/erro.
É uma restrição de interface, não sigilo dos arquivos estáticos do site público.

## Integrado

- 156 versões de lendas, identificadas por nome + clube + ano, incluindo os seis
  extras. Nenhuma alteração no catálogo, atributos, IDs ou saves.
- WebP separado, até 60 KB por retrato, carregamento sob demanda. Não carrega
  retratos para contas fora da prévia. A arte original continua no acervo local.
- Elenco/campo, cartas do álbum e resultado do leilão após martelo com vencedor.
  Lances às cegas, surpresa não revelada e lote sem comprador continuam ocultos.
- Sem arte correspondente: preserva a foto/inicial antiga, sem silhueta inventada.
- Carreira: Jogos e Tabelas separados, placar animado, banners por competição,
  divisão selecionável, jogos com autores, fases/ida/volta/agregado e assistências.
- Patrocínio: mesa aprovada na contratação e no contrato atual. Regras/valores,
  TV, régua e bicos existentes preservados.
- Estádio: Setores/Melhorias, vista aérea ampliada e capacidade/obras reais do save.
- Editor de técnico, criar presidente e sala da presidência ficam DESLIGADOS.

## Limites que não devem ser anunciados como concluídos

- A imagem de Messi Barcelona 2012 fornecida pelo usuário conserva fundo preto.
  Não apresentar esta exceção como recorte transparente concluído.
- O estádio usa o StadiumSvg dinâmico existente, com seus desbloqueios reais.
  A composição cinematográfica final em camadas e a janela da presidência
  continuam pendentes, junto da sala; não simular obras com uma foto de estádio pronto.
- QA de contas usa a autenticação simulada isolada + testes do gate real. Não é
  uma partida de produção jogada nas duas contas reais.

## Verificação e reversão

Testes: check-online-preview, check-legend-avatars, check-career-match-model,
check-career-stadium-model; build TypeScript/Vite; QA 390/1440px de liga e Copas,
patrocínio, elenco, cartas, revelação e isolamento da conta comum.
Capturas locais: `outputs/private-release-20260910`, `outputs/career-v29`,
`outputs/career-v32`. Nenhuma migração de banco nesta entrega.
Reversão: reverter o commit desta entrega restaura a interface anterior; não
há migração de save, prêmio, compra, jogador novo ou transformação irreversível.
Publicação só é confirmada após verificar main e o workflow de deploy.
