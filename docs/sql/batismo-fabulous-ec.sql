-- 🦅🔴⚫ BATISMO FABULOUS EC (koeppfabio@gmail.com) — 23/09/2026
--
-- A 2ª perna do batismo. O código sozinho NÃO entrega nada (erro do Al Takhadao,
-- 01/09): tem que ter CÓDIGO + BANCO + deploy na main. Isto aqui é o banco.
--
-- ⛔ TRAVA DE SEGURANÇA (07/09) — JÁ CONFERIDA nesta entrega: a conta do dono
--    existe em auth.users (criada em 22/09). Nunca cadastrar batismo antes da
--    conta: todos os mimos seguem o E-MAIL, então quem criasse a conta primeiro
--    com aquele e-mail levaria tudo.
--
-- Números: sócio nº57 (o último era 56, do Grêmio FBPA) · fundador nº76.

-- 1️⃣ SÓCIO — é daqui que sai o número de sócio. Sem esta linha o dono não vira
--    sócio, mesmo com o tier ouro ligado no código.
insert into esc_socios (email, socio_n, desde, valido_ate, manto_c1, manto_c2, mascote_key, escudo_time, time_coracao, origem)
values ('koeppfabio@gmail.com', 57, '2026-09-23', '2099-12-31', '#161011', '#CE0E17', 'fabulous_aguia', 'Fabulous EC', 'Flamengo', 'batismo');

-- 2️⃣ FUNDADOR — o n TEM que bater com o FUNDADOR_N do apoio.tsx (76).
insert into esc_fundadores (email, n) values ('koeppfabio@gmail.com', 76);

-- 3️⃣ NOME RESERVADO — entra só o nome PURO; o gatilho
--    esc_batismo_reserva_variacoes cria FC e EC sozinho, e a caixa já está
--    coberta porque a chave é minúscula. `nome_norm` é NOT NULL e não tem
--    default, então vai na mão.
insert into esc_nomes_batismo (nome, nome_norm, email) values ('Fabulous', 'fabulous', 'koeppfabio@gmail.com');

-- 4️⃣ TIER OURO — a fonte OFICIAL (o apoio.tsx é só reserva). É a única perna que
--    funciona SEM deploy: é o mesmo caminho do botão 💛 do Painel do Criador.
--    O Modo Manual vem junto do ouro, não precisa de nada à parte.
insert into user_colors (email, tier, manual) values ('koeppfabio@gmail.com', 'ouro', true)
on conflict (email) do update set tier = 'ouro', manual = true;

-- ✅ conferência depois de rodar:
-- select * from esc_socios where email = 'koeppfabio@gmail.com';
-- select * from esc_fundadores where email = 'koeppfabio@gmail.com';
-- select * from esc_nomes_batismo where nome_norm like 'fabulous%';  -- espera 3 linhas (puro + FC + EC)
-- select * from user_colors where email = 'koeppfabio@gmail.com';
