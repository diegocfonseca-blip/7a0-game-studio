-- 💾 24/11 (caso do Milan de Recife FC): SALVAR MANDA SÓ A CARREIRA JOGADA.
-- Antes, pra salvar 1 carreira o aparelho BAIXAVA o save inteiro da conta (7 MB com 2 carreiras grandes),
-- juntava e REENVIAVA tudo. No celular isso (somado à home baixando o mesmo pacote) estourou a memória,
-- a página reiniciou e o envio morreu. Agora o aparelho manda só a carreira ativa e o servidor encaixa
-- no lugar dela (por seed). Regra da junção = a de sempre (`mergeCareers`): nunca volta no tempo —
-- se a nuvem já tem essa carreira numa temporada MAIOR, fica a da nuvem. As outras carreiras não mudam.
-- Devolve o novo updated_at; NULL = linha no formato antigo (o aparelho cai no caminho de sempre).
create or replace function public.esc_salva_carreira_slot(p_seed bigint, p_slot jsonb)
returns timestamptz
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_save jsonb;
  v_lista jsonb := '[]'::jsonb;
  v_el jsonb;
  v_achou boolean := false;
  v_agora timestamptz := now();
  v_temp_nova int := coalesce((p_slot->'save'->>'seasonNo')::int, 0);
begin
  if v_uid is null then raise exception 'sem login'; end if;
  if p_slot is null or jsonb_typeof(p_slot->'save') <> 'object' or (p_slot->'save'->>'seed')::bigint is distinct from p_seed then
    raise exception 'carreira inválida';
  end if;
  select save into v_save from esc_pyramid_saves where user_id = v_uid for update;
  if not found then
    insert into esc_pyramid_saves (user_id, save, updated_at)
    values (v_uid, jsonb_build_object('__multi', 1, 'careers', jsonb_build_array(p_slot)), v_agora);
    return v_agora;
  end if;
  if v_save is null or coalesce(v_save->>'__multi', '') <> '1' or jsonb_typeof(v_save->'careers') <> 'array' then
    return null;
  end if;
  for v_el in select e from jsonb_array_elements(v_save->'careers') e loop
    if (v_el->'save'->>'seed')::bigint = p_seed then
      v_achou := true;
      if v_temp_nova >= coalesce((v_el->'save'->>'seasonNo')::int, 0) then
        v_lista := v_lista || jsonb_build_array(p_slot);
      else
        v_lista := v_lista || jsonb_build_array(v_el);
      end if;
    else
      v_lista := v_lista || jsonb_build_array(v_el);
    end if;
  end loop;
  if not v_achou then
    v_lista := jsonb_build_array(p_slot) || v_lista;
  end if;
  update esc_pyramid_saves
     set save = jsonb_build_object('__multi', 1, 'careers', v_lista), updated_at = v_agora
   where user_id = v_uid;
  return v_agora;
end
$$;
grant execute on function public.esc_salva_carreira_slot(bigint, jsonb) to authenticated;
