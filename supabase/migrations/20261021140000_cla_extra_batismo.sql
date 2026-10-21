-- ⚔️⚔️🖋 2º CLÃ DE QUEM TEM BATISMO (Diego 21/10, sobre o dono do Tricolor do Arruda, que criou o "Lado A-DPA"): *"ele tem direito de
-- ter também o time de batismo dele… mas pra ele ter o time de batismo agora como clã ele vai ter que pagar os 19,90 da lojinha. Quando
-- ele pagar, ele libera o time de batismo dele e ele personaliza o Lado A-DPA… porque ele só pode ter dois clãs"*.
-- Então, no MESMO produto 'cla_extra': quem tem batismo (esc_socios.escudo_time) ganha como 2º clã o PRÓPRIO TIME DO BATISMO (nome
-- e escudo do clube) e o escudo personalizado vai pro clã que ele JÁ TEM (o 1º). Quem não tem batismo segue igual: 2º clã com nome
-- novo e escudo personalizado nele.
create or replace function public.esc_cla_extra_criar(p_id uuid, p_nome text, p_ideia text) returns text
language plpgsql security definer set search_path = public as $$
declare em text := lower(coalesce(auth.jwt() ->> 'email', '')); eu uuid := auth.uid(); novo bigint; esc text; prin bigint;
  n text := regexp_replace(btrim(coalesce(p_nome, '')), '\s+', ' ', 'g'); i text := regexp_replace(btrim(coalesce(p_ideia, '')), '\s+', ' ', 'g');
begin
  if not exists (select 1 from public.esc_mp_pedidos where id = p_id and email = em and produto = 'cla_extra' and status in ('pago', 'liberado')) then return 'sem_pedido'; end if;
  if exists (select 1 from public.esc_cla_escudo_pedidos where pedido_id = p_id) then
    update public.esc_cla_escudo_pedidos set ideia = left(i, 300), atualizado_em = now() where pedido_id = p_id and char_length(i) >= 5;
    return 'ok';
  end if;
  if char_length(i) < 5 or char_length(i) > 300 then return 'ideia'; end if;
  if public.esc_cla_extra_de(eu) is not null then return 'ja_tem'; end if;
  select escudo_time into esc from public.esc_socios where lower(email) = em and escudo_time is not null order by socio_n desc nulls last limit 1;
  if esc is not null then
    -- 🖋 batismo: o 2º clã é o time do batismo; o escudo personalizado vai pro 1º clã
    prin := public.esc_cla_de(eu);
    if prin is null then return 'sem_cla'; end if;
    if exists (select 1 from public.esc_clas where ativo and nome_norm = lower(esc)) then return 'nome_em_uso'; end if;
    insert into public.esc_clas (nome, nome_norm, emblema, lider, aberto, extra) values (esc, lower(esc), 'escudo:' || esc, eu, true, true);
    insert into public.esc_cla_escudo_pedidos (pedido_id, email, cla_id, nome_cla, ideia) values (p_id, em, prin, (select nome from public.esc_clas where id = prin), i);
    return 'ok';
  end if;
  if char_length(n) < 3 or char_length(n) > 20 then return 'tamanho'; end if;
  if public.esc_nome_ofensivo(n) then return 'ofensivo'; end if;
  if exists (select 1 from public.esc_clas where ativo and nome_norm = lower(n)) then return 'nome_em_uso'; end if;
  insert into public.esc_clas (nome, nome_norm, emblema, lider, aberto, extra) values (n, lower(n), 'e:0', eu, true, true) returning id into novo;
  insert into public.esc_cla_escudo_pedidos (pedido_id, email, cla_id, nome_cla, ideia) values (p_id, em, novo, n, i);
  return 'ok';
end $$;
