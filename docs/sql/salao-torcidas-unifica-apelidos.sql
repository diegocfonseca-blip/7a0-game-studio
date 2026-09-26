-- 25/09/2026 — o Salão dos Batismos mostrava "Vasco da Gama" (3,7%) e "Vasco" (1,9%) como
-- duas torcidas. Diego: *"tem dois Vasco, cuidado com isso"*.
--
-- Por quê: o time de coração chega de TRÊS lugares e cada um escrevia do seu jeito —
--   · esc_socios.time_coracao (o batismo, escrito na mão: "Vasco da Gama", "Atlético Mineiro")
--   · auth.users.raw_user_meta_data->>'time_coracao' (o cadastro, pelo seletor de coracao.ts:
--     "Vasco", "Atlético-MG")
--   · esc_torcida_sem_dono
-- e a função `esc_salao_torcidas` agrupava pelo texto cru.
--
-- Conserto (aplicado como migração `salao_torcidas_unifica_apelidos`): a função passa a
-- juntar os apelidos no nome que o SELETOR usa, antes de agrupar. As linhas velhas também
-- foram corrigidas. Regra pra quem cadastrar batismo daqui pra frente: time_coracao com o
-- MESMO nome do seletor (`CORACAO_CLUBES` em src/escalacao/coracao.ts).

update esc_socios set time_coracao = case time_coracao
  when 'Vasco da Gama' then 'Vasco' when 'Atlético Mineiro' then 'Atlético-MG' end
 where time_coracao in ('Vasco da Gama','Atlético Mineiro');
update esc_torcida_sem_dono set time_coracao = case time_coracao
  when 'Vasco da Gama' then 'Vasco' when 'Atlético Mineiro' then 'Atlético-MG' end
 where time_coracao in ('Vasco da Gama','Atlético Mineiro');

-- a função nova (cópia fiel do que está no banco):
create or replace function public.esc_salao_torcidas()
 returns table(time_nome text, gente integer, clubes text[])
 language sql stable security definer
 set search_path to 'public'
as $function$
  with donos as (
    select s.escudo_time,
           coalesce(nullif(s.time_coracao, ''), nullif(u.raw_user_meta_data->>'time_coracao', '')) as coracao
    from esc_socios s
    left join auth.users u on lower(u.email) = lower(s.email)
    where coalesce(s.escudo_time, '') <> ''
    union all
    select t.escudo_time, t.time_coracao
    from esc_torcida_sem_dono t
    where not exists (select 1 from esc_socios s2 where s2.escudo_time = t.escudo_time)
  ), norm as (
    select escudo_time,
      case lower(trim(coracao))
        when 'vasco da gama' then 'Vasco'
        when 'atlético mineiro' then 'Atlético-MG'
        when 'atletico mineiro' then 'Atlético-MG'
        when 'atlético-mg' then 'Atlético-MG'
        when 'atletico-mg' then 'Atlético-MG'
        when 'atlético paranaense' then 'Athletico-PR'
        when 'athletico paranaense' then 'Athletico-PR'
        when 'athletico-pr' then 'Athletico-PR'
        when 'atlético-pr' then 'Athletico-PR'
        when 'atlético goianiense' then 'Atlético-GO'
        when 'atlético-go' then 'Atlético-GO'
        when 'corinthians paulista' then 'Corinthians'
        when 'palmeiras' then 'Palmeiras'
        when 'são paulo fc' then 'São Paulo'
        when 'sao paulo' then 'São Paulo'
        when 'grêmio fbpa' then 'Grêmio'
        when 'gremio' then 'Grêmio'
        when 'sport recife' then 'Sport'
        when 'red bull bragantino' then 'Bragantino'
        when 'flamengo' then 'Flamengo'
        else trim(coracao)
      end as coracao
    from donos
    where coracao is not null
  )
  select coracao, count(*)::int, array_agg(escudo_time order by escudo_time)
  from norm
  group by coracao
  order by 2 desc, 1
$function$;
