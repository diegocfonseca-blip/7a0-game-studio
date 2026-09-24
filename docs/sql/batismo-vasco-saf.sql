-- ⚽🏴‍☠️ BATISMO VASCO SAF (ex-Vasco da Grana) (brunnodeluca90@gmail.com) — 24/09/2026
--
-- A 2ª perna do batismo. O código sozinho NÃO entrega nada (erro do Al Takhadao,
-- 01/09): tem que ter CÓDIGO + BANCO + deploy na main. Isto aqui é o banco.
--
-- ⛔ TRAVA DE SEGURANÇA (07/09) — JÁ CONFERIDA nesta entrega: a conta do dono
--    existe em auth.users (criada em 10/07).
--
-- Números: sócio nº59 (o último era 58, do Julia Barranquila) · fundador nº78 (max era 77).

insert into esc_socios (email, socio_n, desde, valido_ate, manto_c1, manto_c2, mascote_key, escudo_time, time_coracao, origem)
values ('brunnodeluca90@gmail.com', 59, '2026-09-24', '2099-12-31', '#161414', '#ECE6E1', 'vasco_pirata', 'Vasco SAF', 'Vasco', 'batismo');

insert into esc_fundadores (email, n) values ('brunnodeluca90@gmail.com', 78);

-- só o nome PURO; o gatilho esc_batismo_reserva_variacoes cria FC e EC sozinho
insert into esc_nomes_batismo (nome, nome_norm, email) values ('Vasco SAF', 'vasco saf', 'brunnodeluca90@gmail.com');

insert into user_colors (email, tier, manual) values ('brunnodeluca90@gmail.com', 'ouro', true)
on conflict (email) do update set tier = 'ouro', manual = true;

-- ✅ conferência:
-- select * from esc_socios where email = 'brunnodeluca90@gmail.com';
-- select * from esc_fundadores where email = 'brunnodeluca90@gmail.com';
-- select * from esc_nomes_batismo where nome_norm like 'vasco saf%';  -- espera 3 linhas
-- select * from user_colors where email = 'brunnodeluca90@gmail.com';
