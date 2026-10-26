-- 🏆⚔️ AVISO DE FIM DE SEMANA (26/10, Diego: "aparece esse modal… parabéns… o clã dele venceu… 30 moedas… zoar o clã perdedor…
-- quando fechar o X não aparece mais… em qualquer lugar da tela. Dos individuais também"). Mockup aprovado: scripts/mockups/
-- premio-semana-modal.png ("Sim", incluindo 2º e 3º). As semanas JÁ fecham juntas na segunda 0h de Brasília (esc_fecha_semanas e
-- esc_fecha_semanas_clas) e as moedas JÁ caem na carreira (esc_resgata_premio_*). Aqui só: (1) a marca de "já viu o aviso", NA CONTA
-- (vale em todo aparelho); (2) a lista de avisos pendentes da última semana fechada; (3) marcar como visto.
alter table public.esc_premio_semana add column if not exists visto_em timestamptz;
alter table public.esc_premio_cla_semana add column if not exists visto_em timestamptz;

create or replace function public.esc_avisos_semana() returns jsonb language plpgsql security definer set search_path = public as $$
declare atual date := (date_trunc('week', now() at time zone 'America/Sao_Paulo'))::date; ult date := atual - 7; out jsonb := '[]'::jsonb;
begin
  if auth.uid() is null then return out; end if;
  perform esc_fecha_semanas(); perform esc_fecha_semanas_clas();
  select coalesce(jsonb_agg(jsonb_build_object('tipo', 'tecnico', 'semana', p.semana, 'pos', p.pos, 'nome', p.nome, 'titulos', p.titulos)), '[]'::jsonb)
    into out from esc_premio_semana p where p.user_id = auth.uid() and p.semana = ult and p.visto_em is null;
  select out || coalesce(jsonb_agg(jsonb_build_object('tipo', 'cla', 'semana', c.semana, 'pos', c.pos, 'nome', c.nome_cla, 'emblema', c.emblema, 'titulos', c.titulos,
      -- (o 2º colocado, pra zoeira do campeão — só nome e títulos, que já são públicos no ranking)
      'rival', case when c.pos = 1 then (select jsonb_build_object('nome', r.nome_cla, 'titulos', r.titulos) from esc_premio_cla_semana r
                                         where r.semana = c.semana and r.pos = 2 limit 1) end)), '[]'::jsonb)
    into out from esc_premio_cla_semana c where c.user_id = auth.uid() and c.semana = ult and c.visto_em is null;
  return out;
end $$;

create or replace function public.esc_aviso_semana_visto(p_tipo text, p_semana date) returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  if p_tipo = 'tecnico' then update esc_premio_semana set visto_em = now() where user_id = auth.uid() and semana = p_semana and visto_em is null;
  elsif p_tipo = 'cla' then update esc_premio_cla_semana set visto_em = now() where user_id = auth.uid() and semana = p_semana and visto_em is null;
  end if;
end $$;
grant execute on function public.esc_avisos_semana(), public.esc_aviso_semana_visto(text, date) to authenticated;
