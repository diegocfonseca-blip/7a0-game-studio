-- 🇧🇷 19/11: o painel ao vivo separa o Brasil Oficial da carreira de sempre (aplicado no banco em 19/11).
alter table public.live_beats add column if not exists career_modo text;
-- e o esc_admin_dashboard passou a devolver 'careerModo' no live_list (o mesmo texto de antes + career_modo no select e no jsonb).
