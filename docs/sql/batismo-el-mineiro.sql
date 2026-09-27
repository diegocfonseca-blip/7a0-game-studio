-- 🐓 BATISMO EL MINEIRO (bastosmbc@gmail.com) — 27/09/2026
--
-- A 2ª perna do batismo (código + BANCO + deploy na main).
--
-- ⛔ TRAVA DE SEGURANÇA (07/09) — JÁ CONFERIDA: a conta do dono existe em auth.users
--    (criada em 17/08, jogando com o nome "El Mineiro"). Estava no tier prata → vira ouro.
--
-- Números: sócio nº61 (o último era 60, Cruzeiro de Berretinho) · fundador nº80 (max era 79).
-- Nome reservado: "El Mineiro" — o gatilho cria o FC e o EC.

insert into esc_socios (email, socio_n, desde, valido_ate, manto_c1, manto_c2, mascote_key, escudo_time, time_coracao, origem)
values ('bastosmbc@gmail.com', 61, '2026-09-27', '2099-12-31', '#100C0C', '#E1D9D5', 'el_mineiro_galo_doido', 'El Mineiro', 'Atlético Mineiro', 'batismo');

insert into esc_fundadores (email, n) values ('bastosmbc@gmail.com', 80);

insert into esc_nomes_batismo (nome, nome_norm, email) values
  ('El Mineiro', 'el mineiro', 'bastosmbc@gmail.com');

insert into user_colors (email, tier, manual) values ('bastosmbc@gmail.com', 'ouro', true)
on conflict (email) do update set tier = 'ouro', manual = true;

-- ✅ conferência:
-- select * from esc_socios where email = 'bastosmbc@gmail.com';
-- select * from esc_fundadores where email = 'bastosmbc@gmail.com';
-- select * from esc_nomes_batismo where nome_norm like 'el mineiro%';  -- espera 3 linhas
-- select * from user_colors where email = 'bastosmbc@gmail.com';
