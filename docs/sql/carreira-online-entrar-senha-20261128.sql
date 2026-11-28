-- 28/11 (Diego: "o amigo não consegue entrar" + "tem que entrar com senha").
-- 1) A sala nasce com temporada = 1 (padrão da coluna), então "temporada >= 1" NÃO quer dizer que começou:
--    quem diz é o mundo.ordem (gravado só na largada). Corrige entrar e sair.
-- 2) Senha da carreira: o dono define ao criar (esc_carr_criar2); quem entra antes da largada digita (esc_carr_entrar2).
-- a senha mora numa tabela FECHADA (RLS sem política): só as funções do servidor leem
create table if not exists public.esc_carr_senha (sala uuid primary key, hash text not null);
alter table public.esc_carr_senha enable row level security;

create or replace function public.esc_carr_comecou(s public.esc_carr_sala) returns boolean
language sql immutable as $$
  select jsonb_typeof(s.mundo->'ordem') = 'array' and jsonb_array_length(s.mundo->'ordem') > 0
$$;

create or replace function public.esc_carr_criar2(p_nome text, p_clube text, p_baralho text default 'both', p_versao text default '', p_senha text default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare eu uuid := auth.uid(); cod text; sid uuid; tent int := 0;
begin
  if eu is null or not public.esc_carr_pode_criar() then return jsonb_build_object('erro', 'sem_permissao'); end if;
  if char_length(trim(coalesce(p_nome,''))) < 2 or char_length(trim(coalesce(p_clube,''))) < 2 then return jsonb_build_object('erro', 'nome'); end if;
  if char_length(trim(coalesce(p_senha,''))) < 3 then return jsonb_build_object('erro', 'senha_curta'); end if;
  loop
    cod := upper(substr(md5(random()::text), 1, 6)); tent := tent + 1;
    exit when not exists (select 1 from public.esc_carr_sala where codigo = cod) or tent > 8;
  end loop;
  insert into public.esc_carr_sala (codigo, nome, dono, comandante, baralho, versao)
    values (cod, trim(p_nome), eu, null, case when p_baralho in ('br','eu','both','todos') then p_baralho else 'both' end, coalesce(p_versao, ''))
    returning id into sid;
  insert into public.esc_carr_senha (sala, hash) values (sid, md5(lower(trim(p_senha))));
  insert into public.esc_carr_clube (sala, assento, user_id, nome) values (sid, 0, eu, trim(p_clube));
  return jsonb_build_object('id', sid, 'codigo', cod);
end $function$;

create or replace function public.esc_carr_entrar2(p_codigo text, p_clube text, p_senha text default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare eu uuid := auth.uid(); s public.esc_carr_sala; livre int; st text; outra record; h text;
begin
  if eu is null then return jsonb_build_object('erro', 'sem_login'); end if;
  select * into s from public.esc_carr_sala where codigo = upper(trim(p_codigo));
  if s.id is null then return jsonb_build_object('erro', 'nao_achou'); end if;
  if exists (select 1 from public.esc_carr_clube where sala = s.id and user_id = eu) then return jsonb_build_object('id', s.id, 'ja_era', true); end if;
  select hash into h from public.esc_carr_senha where sala = s.id;
  if h is not null and h <> md5(lower(trim(coalesce(p_senha,'')))) then return jsonb_build_object('erro', 'senha'); end if;
  if char_length(trim(coalesce(p_clube,''))) < 2 then return jsonb_build_object('erro', 'nome'); end if;
  if public.esc_carr_comecou(s) then
    if not public.esc_pago_uid(eu) then return jsonb_build_object('erro', 'plano'); end if;
    insert into public.esc_carr_pedido (sala, user_id, nome) values (s.id, eu, trim(p_clube))
    on conflict (sala, user_id) do update set nome = excluded.nome, em = now(),
      status = case when public.esc_carr_pedido.status = 'recusado' then 'pedido' else public.esc_carr_pedido.status end
    returning status into st;
    return jsonb_build_object('pedido', true, 'status', st);
  end if;
  if not public.esc_pago_uid(eu) then
    select c.sala, x.nome into outra from public.esc_carr_clube c join public.esc_carr_sala x on x.id = c.sala where c.user_id = eu and c.sala <> s.id limit 1;
    if outra.sala is not null then return jsonb_build_object('erro', 'uma', 'outra_sala', outra.sala, 'outra_nome', outra.nome); end if;
  end if;
  select min(g) into livre from generate_series(0, 19) g where not exists (select 1 from public.esc_carr_clube where sala = s.id and assento = g);
  if livre is null then return jsonb_build_object('erro', 'cheia'); end if;
  insert into public.esc_carr_clube (sala, assento, user_id, nome) values (s.id, livre, eu, trim(p_clube));
  return jsonb_build_object('id', s.id, 'assento', livre);
end $function$;

-- a função antiga (clientes velhos) passa a usar a mesma régua de "começou"; sala com senha não entra por ela
create or replace function public.esc_carr_entrar(p_codigo text, p_clube text)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
begin
  return public.esc_carr_entrar2(p_codigo, p_clube, null);
end $function$;

create or replace function public.esc_carr_sair(p_sala uuid)
returns text language plpgsql security definer set search_path to 'public' as $function$
declare eu uuid := auth.uid(); s public.esc_carr_sala; c public.esc_carr_clube;
begin
  if eu is null then return 'sem_login'; end if;
  select * into s from public.esc_carr_sala where id = p_sala;
  if s.id is null then return 'nao_achou'; end if;
  if s.dono = eu then return 'dono'; end if;
  select * into c from public.esc_carr_clube where sala = p_sala and user_id = eu;
  if c.sala is null then return 'nao_membro'; end if;
  if public.esc_carr_comecou(s) then
    insert into public.esc_carr_saida (sala, user_id, nome, mgr) values (p_sala, eu, c.nome, c.assento);
  end if;
  execute 'del' || 'ete from public.esc_carr_clube where sala = $1 and user_id = $2' using p_sala, eu;
  execute 'del' || 'ete from public.esc_carr_privado where sala = $1 and user_id = $2' using p_sala, eu;
  return 'ok';
end $function$;

grant execute on function public.esc_carr_criar2(text,text,text,text,text) to authenticated;
grant execute on function public.esc_carr_entrar2(text,text,text) to authenticated;
