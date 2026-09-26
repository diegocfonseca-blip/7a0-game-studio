-- ⭐🐺 BATISMO CRUZEIRO DE BERRETINHO (weslleygomes749@gmail.com) — 25/09/2026
--
-- A 2ª perna do batismo. O código sozinho NÃO entrega nada (erro do Al Takhadao,
-- 01/09): tem que ter CÓDIGO + BANCO + deploy na main. Isto aqui é o banco.
--
-- ⛔ TRAVA DE SEGURANÇA (07/09) — JÁ CONFERIDA nesta entrega: a conta do dono
--    existe em auth.users (criada em 04/09). Achada pelo nome com que ele jogava
--    ("Cruzeiro do Berretinho") e CONFIRMADA pelo Diego.
--
-- Números: sócio nº60 (o último era 59, do Vasco SAF) · fundador nº79 (max era 78).
-- Nomes reservados: "Cruzeiro de Berretinho" (o do batismo) e "Cruzeiro do Berretinho"
-- (como ele escrevia no jogo) — o gatilho cria o FC e o EC de cada um.

insert into esc_socios (email, socio_n, desde, valido_ate, manto_c1, manto_c2, mascote_key, escudo_time, time_coracao, origem)
values ('weslleygomes749@gmail.com', 60, '2026-09-25', '2099-12-31', '#0130AD', '#F2F9FF', 'cruzeiro_lobo_rei', 'Cruzeiro de Berretinho', 'Cruzeiro', 'batismo');

insert into esc_fundadores (email, n) values ('weslleygomes749@gmail.com', 79);

insert into esc_nomes_batismo (nome, nome_norm, email) values
  ('Cruzeiro de Berretinho', 'cruzeiro de berretinho', 'weslleygomes749@gmail.com'),
  ('Cruzeiro do Berretinho', 'cruzeiro do berretinho', 'weslleygomes749@gmail.com');

insert into user_colors (email, tier, manual) values ('weslleygomes749@gmail.com', 'ouro', true)
on conflict (email) do update set tier = 'ouro', manual = true;

-- ✅ conferência:
-- select * from esc_socios where email = 'weslleygomes749@gmail.com';
-- select * from esc_fundadores where email = 'weslleygomes749@gmail.com';
-- select * from esc_nomes_batismo where nome_norm like 'cruzeiro d_ berretinho%';  -- espera 6 linhas
-- select * from user_colors where email = 'weslleygomes749@gmail.com';
