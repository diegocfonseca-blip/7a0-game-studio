-- 💳 MERCADO PAGO · PIX ÚNICO, parte 3 (15/10). Diego viu as moedas ainda no Pix antigo: *"na minha conta também tá
-- aparecendo que tá antigo, quando fui nas moedas"*. Entram no Pix novo: 🏦 moedas (a FICHA do Banco Legends nasce
-- sozinha), 📣 canto avulso (registra; o Diego faz) e 🎁 presente (entregue pro amigo na hora).
-- (aplicado no banco em partes pelo MCP; este arquivo é a memória do que ficou)
alter table public.esc_mp_pedidos add column if not exists ref text, add column if not exists ficha text;
alter table public.esc_mp_pedidos drop constraint if exists esc_mp_pedidos_produto_check;
alter table public.esc_mp_pedidos add constraint esc_mp_pedidos_produto_check check (produto in ('craque','lenda','batismo','fundador','salas_extras','teste','moedas_10','moedas_50','moedas_100','canto','presente'));
alter table public.esc_pagamentos drop constraint if exists esc_pagamentos_produto_check;
alter table public.esc_pagamentos add constraint esc_pagamentos_produto_check check (produto in ('craque_mensal','batismo_lenda','batismo_plus','craque','lenda','salas_extras','teste','moedas_10','moedas_50','moedas_100','canto','presente'));
-- funções criadas/trocadas (corpo igual ao aplicado): esc_mp_preco_ref(email, produto, ref) · esc_mp_criar_pedido(email,
-- produto, telefone, ref) · esc_mp_meu_pendente2(produto, ref) · esc_mp_status_v2(id) (devolve a ficha) · esc_mp_entregar
-- (+ moedas → bl_fichas, presente → amigo, canto → só registra) · esc_mp_briefing (+ canto).
-- Preços: moedas_10/50/100 = R$ 10/50/100 (×3 moedas) · canto = R$ 10, só com Batismo (rank 3; Fundador já traz) ·
-- presente = preço cheio do plano do `esc_presentes` pedido pelo PRÓPRIO comprador.
