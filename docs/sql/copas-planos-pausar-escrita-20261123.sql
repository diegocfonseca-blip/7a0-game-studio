-- SOMENTE PARA REVERSÃO: não executar na liberação normal.
-- Interrompe novas ordens sem apagar histórico, leitura ou relógios.
-- Para retomar: reaplicar a definição em copas-planos-publicos-20261123.sql.
create or replace function esc_copa_plano_private.esc_copa_plano_set(
 p_room uuid,p_tipo text,p_edicao integer,p_seed bigint,p_plan jsonb,p_id uuid,p_live boolean default false
) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 raise exception 'Novas ordens temporariamente indisponíveis' using errcode='42501';
end $$;
