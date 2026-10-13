-- 🗑️ LIXEIRA DE SAVES PARADOS (13/10, ordem do Diego: "pode… só que não é a conta do usuário, e nem todos os saves
-- dele, só os que devem ser mesmo").
-- O que sai da nuvem: SÓ a carreira parada há mais de 30 dias, de quem:
--   · NÃO abriu o jogo em aparelho nenhum nos últimos 30 dias (login + renovação de sessão — o jogo renova a sessão
--     sozinho enquanto está aberto, então quem joga sem apertar Salvar NÃO entra);
--   · NUNCA pagou nada (tier prata/ouro, fundador, sócio, assinatura ou pagamento — mesmo vencido, fica protegido).
-- Nunca apaga a CONTA. Carreira que jogou no mês fica. A carreira vai pra `esc_saves_lixeira` e pode voltar até
-- `apagar_em` (30 dias); depois disso `esc_lixeira_esvazia()` apaga de vez.
-- O save do APARELHO não é tocado: o celular da pessoa continua com a carreira (a conta grátis só não volta a subir
-- essa carreira pra nuvem, que é a regra de 07/10).
-- Devolver uma carreira: select esc_lixeira_devolve(<id>);

create table if not exists public.esc_saves_lixeira (
  id bigserial primary key,
  user_id uuid not null,
  email text,
  career jsonb not null,            -- o slot inteiro ({save, at}) — volta exatamente como saiu
  career_at timestamptz,            -- última vez que essa carreira foi salva
  removido_em timestamptz not null default now(),
  apagar_em timestamptz not null default now() + interval '30 days'
);
alter table public.esc_saves_lixeira enable row level security; -- sem policy: só o banco/Diego mexe
create index if not exists esc_saves_lixeira_user on public.esc_saves_lixeira(user_id);

create or replace function public.esc_limpa_saves_parados(p_lote int default 200, p_testar boolean default true)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare
  r record; v_slots jsonb; v_fica jsonb; v_sai jsonb; s jsonb; v_at timestamptz;
  n_contas int := 0; n_sai int := 0; n_fica int := 0; n_linhas_vazias int := 0;
begin
  for r in
    with ult as (select user_id, max(coalesce(refreshed_at, updated_at, created_at)) ult from auth.sessions group by user_id)
    select p.user_id, p.save, p.updated_at, lower(coalesce(u.email, '')) email
    from esc_pyramid_saves p join auth.users u on u.id = p.user_id left join ult on ult.user_id = p.user_id
    where p.updated_at < now() - interval '30 days'
      and coalesce(greatest(u.last_sign_in_at, ult.ult), p.updated_at) < now() - interval '30 days'
      and not exists (select 1 from user_colors x where lower(x.email) = lower(u.email) and x.tier in ('prata', 'ouro'))
      and not exists (select 1 from esc_fundadores x where lower(x.email) = lower(u.email))
      and not exists (select 1 from esc_socios x where lower(x.email) = lower(u.email))
      and not exists (select 1 from esc_assinaturas x where lower(x.email) = lower(u.email))
      and not exists (select 1 from esc_pagamentos x where lower(x.email) = lower(u.email))
    order by p.updated_at
    limit p_lote
  loop
    n_contas := n_contas + 1;
    -- formato novo ({__multi, careers:[{save, at}]}) ou o antigo (o próprio estado = 1 carreira)
    if jsonb_typeof(r.save -> 'careers') = 'array' then v_slots := r.save -> 'careers';
    else v_slots := jsonb_build_array(jsonb_build_object('save', r.save, 'at', (extract(epoch from r.updated_at) * 1000)::bigint));
    end if;
    v_fica := '[]'::jsonb; v_sai := '[]'::jsonb;
    for s in select * from jsonb_array_elements(v_slots) loop
      v_at := case when (s ->> 'at') ~ '^[0-9]+$' then to_timestamp((s ->> 'at')::bigint / 1000.0) else r.updated_at end;
      if v_at < now() - interval '30 days' then
        v_sai := v_sai || jsonb_build_array(s);
        if not p_testar then
          insert into esc_saves_lixeira (user_id, email, career, career_at) values (r.user_id, r.email, s, v_at);
        end if;
      else
        v_fica := v_fica || jsonb_build_array(s);
      end if;
    end loop;
    n_sai := n_sai + jsonb_array_length(v_sai); n_fica := n_fica + jsonb_array_length(v_fica);
    if jsonb_array_length(v_sai) = 0 then continue; end if;
    if jsonb_array_length(v_fica) = 0 then
      n_linhas_vazias := n_linhas_vazias + 1;
      if not p_testar then delete from esc_pyramid_saves where user_id = r.user_id; end if; -- só a linha do SAVE, nunca a conta
    elsif not p_testar then
      update esc_pyramid_saves set save = jsonb_build_object('__multi', 1, 'careers', v_fica) where user_id = r.user_id; -- carimbo fica igual
    end if;
  end loop;
  return jsonb_build_object('testar', p_testar, 'contas', n_contas, 'carreiras_pra_lixeira', n_sai, 'carreiras_que_ficam', n_fica, 'contas_sem_carreira_na_nuvem', n_linhas_vazias);
end $$;

-- devolve UMA carreira da lixeira pra nuvem do dono (junta com o que ele tiver lá)
create or replace function public.esc_lixeira_devolve(p_id bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v esc_saves_lixeira; cur jsonb;
begin
  select * into v from esc_saves_lixeira where id = p_id;
  if not found then raise exception 'não está na lixeira: %', p_id; end if;
  select save into cur from esc_pyramid_saves where user_id = v.user_id;
  if cur is null then
    insert into esc_pyramid_saves (user_id, save, updated_at) values (v.user_id, jsonb_build_object('__multi', 1, 'careers', jsonb_build_array(v.career)), now());
  elsif jsonb_typeof(cur -> 'careers') = 'array' then
    update esc_pyramid_saves set save = jsonb_set(cur, '{careers}', (cur -> 'careers') || jsonb_build_array(v.career)), updated_at = now() where user_id = v.user_id;
  else
    update esc_pyramid_saves set save = jsonb_build_object('__multi', 1, 'careers', jsonb_build_array(jsonb_build_object('save', cur, 'at', (extract(epoch from now()) * 1000)::bigint), v.career)), updated_at = now() where user_id = v.user_id;
  end if;
  delete from esc_saves_lixeira where id = p_id;
  return jsonb_build_object('devolvida', p_id, 'user_id', v.user_id);
end $$;

-- passado o prazo, apaga de vez
create or replace function public.esc_lixeira_esvazia()
returns int language sql security definer set search_path = public as $$
  with d as (delete from esc_saves_lixeira where apagar_em < now() returning 1) select count(*)::int from d
$$;

-- ninguém de fora chama nada disso
revoke all on function public.esc_limpa_saves_parados(int, boolean) from public, anon, authenticated;
revoke all on function public.esc_lixeira_devolve(bigint) from public, anon, authenticated;
revoke all on function public.esc_lixeira_esvazia() from public, anon, authenticated;
