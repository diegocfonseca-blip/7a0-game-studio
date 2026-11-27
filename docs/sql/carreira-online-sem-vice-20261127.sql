-- 27/11 APLICADO (Diego 26/11: "vice: sai" — sem o dono a carreira espera): só o DONO continua/comanda; escolher vice não faz mais nada
create or replace function public.esc_carr_continuar(p_sala uuid, p_prazo_s integer default 60)
returns text language plpgsql security definer set search_path to 'public' as $function$
declare s public.esc_carr_sala; eu uuid := auth.uid();
begin
  select * into s from public.esc_carr_sala where id = p_sala for update;
  if s.id is null then return 'nao_achou'; end if;
  if s.fase <> 'espera' then return 'ja_comecou'; end if;
  if eu is null or eu <> s.dono then return 'sem_permissao'; end if;
  update public.esc_carr_sala set comandante = eu, fase = 'preparo', pausado = false,
    prazo = now() + make_interval(secs => least(greatest(coalesce(p_prazo_s, 60), 15), 300)), atualizado_em = now() where id = p_sala;
  return 'ok';
end $function$;

create or replace function public.esc_carr_vice(p_sala uuid, p_vice uuid)
returns text language plpgsql security definer set search_path to 'public' as $function$
begin
  return 'desligado';
end $function$;

update public.esc_carr_sala set vice = null where vice is not null;
