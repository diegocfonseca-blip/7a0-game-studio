-- 📧 03/11 (Diego): a cota do Resend (100/dia) fica 70 pra CÓDIGO de confirmação e 30 pra CAMPANHA. Confirmação já na 2ª conta do
-- mesmo aparelho (min_outros 2 → 1). E sozinho: "se vê que está batendo nos 70, já vai diminuindo a campanha até zerar".
-- Todo dia 23h50 (Brasília) o banco conta os e-mails de código do dia; chegou a 60+ (perto dos 70) → campanha −10/dia, até 0.
-- Nunca sobe a campanha de volta sozinho.
update public.esc_conf_cfg set teto_dia = 70, min_outros = 1 where id = 1;
update public.esc_email_config set por_dia = 30 where id = 1;

create table if not exists public.esc_conf_uso (dia date primary key, emails int not null, contas int not null, campanha_depois int);
alter table public.esc_conf_uso enable row level security;

create or replace function public.esc_email_ajusta_campanha() returns void language plpgsql security definer set search_path = public as $$
declare v_dia date := (now() at time zone 'America/Sao_Paulo')::date; v_emails int; v_contas int; v_camp int;
begin
  select coalesce(sum(envios_dia), 0), count(*) into v_emails, v_contas from esc_conf_cod where dia = v_dia and envios_dia > 0;
  select por_dia into v_camp from esc_email_config where id = 1;
  if v_emails >= 60 and coalesce(v_camp, 0) > 0 then
    v_camp := greatest(0, v_camp - 10);
    update esc_email_config set por_dia = v_camp where id = 1;
  end if;
  insert into esc_conf_uso (dia, emails, contas, campanha_depois) values (v_dia, v_emails, v_contas, v_camp)
    on conflict (dia) do update set emails = excluded.emails, contas = excluded.contas, campanha_depois = excluded.campanha_depois;
end $$;

select cron.schedule('esc-email-ajusta', '50 2 * * *', 'select public.esc_email_ajusta_campanha()');
