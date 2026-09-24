-- 🦈🔴⚪ BATISMO JULIA BARRANQUILA (dondeestasleomessi10@gmail.com) — 24/09/2026
--
-- A 2ª perna do batismo. O código sozinho NÃO entrega nada (erro do Al Takhadao,
-- 01/09): tem que ter CÓDIGO + BANCO + deploy na main. Isto aqui é o banco.
--
-- ⛔ TRAVA DE SEGURANÇA (07/09) — JÁ CONFERIDA nesta entrega: a conta do dono
--    existe em auth.users (criada em 25/08).
--
-- Números: sócio nº58 (o último era 57, do Fabulous EC) · fundador nº77 (max era 76).

insert into esc_socios (email, socio_n, desde, valido_ate, manto_c1, manto_c2, mascote_key, escudo_time, time_coracao, origem)
values ('dondeestasleomessi10@gmail.com', 58, '2026-09-24', '2099-12-31', '#E60205', '#F7F5F3', 'julia_tubarao', 'Julia Barranquila', 'Corinthians', 'batismo');

insert into esc_fundadores (email, n) values ('dondeestasleomessi10@gmail.com', 77);

-- só o nome PURO; o gatilho esc_batismo_reserva_variacoes cria FC e EC sozinho
insert into esc_nomes_batismo (nome, nome_norm, email) values ('Julia Barranquila', 'julia barranquila', 'dondeestasleomessi10@gmail.com');

insert into user_colors (email, tier, manual) values ('dondeestasleomessi10@gmail.com', 'ouro', true)
on conflict (email) do update set tier = 'ouro', manual = true;

-- ✅ conferência:
-- select * from esc_socios where email = 'dondeestasleomessi10@gmail.com';
-- select * from esc_fundadores where email = 'dondeestasleomessi10@gmail.com';
-- select * from esc_nomes_batismo where nome_norm like 'julia barranquila%';  -- espera 3 linhas
-- select * from user_colors where email = 'dondeestasleomessi10@gmail.com';
