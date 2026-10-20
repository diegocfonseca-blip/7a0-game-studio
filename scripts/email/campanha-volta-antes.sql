-- 📧 O E-MAIL DA CAMPANHA COMO ESTAVA ATÉ 19/10 (cópia tirada do banco antes de trocar o texto).
-- Pra VOLTAR ao texto antigo: rodar este arquivo inteiro no banco. O disparo, a fila e o medidor não mudam.
create or replace function public.esc_email_assunto() returns text language sql immutable set search_path to 'public'
as $function$ select 'Você jogou no começo. Nem vai reconhecer o jogo agora ⚽🔨' $function$;

CREATE OR REPLACE FUNCTION public.esc_email_html(p_nome text, p_email text)
 RETURNS text
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
with v as (
  select coalesce(nullif(trim(p_nome), ''), 'Técnico') as nome,
         'https://leilaolegends.com/?sair=' || replace(replace(p_email, '@', '%40'), '+', '%2B') as sair
), bloco as (
  select string_agg(x, '' order by i) as html from (
    values
    (1,'🌱','A carreira agora COMEÇA NA VÁRZEA','Você não começa mais no profissional: começa no campo de terra, com perna-de-pau, e sobe divisão por divisão até a Série A. É outro jogo — e o começo virou a melhor parte.'),
    (2,'🧢','Seu clube tem TÉCNICO agora','105 comandantes, de lenda a ex-jogador, cada um com o nível dele — e é o técnico que destrava os esquemas. O jogo passou de 5 pra 15 formações.'),
    (3,'🏆','Na carreira: COPA DO BRASIL e SUPERCOPA','A copa virou Copa do Brasil, e quem ganha ela encara o campeão da Série A na Supercopa. Título que vale ponto no ranking.'),
    (4,'🌎','No online: LIBERTADORES e COPA DO MUNDO','Acabou a liga da sala e começa outra coisa: a Libertadores com 32 clubes do continente, ou a Copa do Mundo — onde cada um da sua turma pega uma seleção e convoca 11 do país. Essa saiu esta semana.'),
    (5,'🏟️','MINHAS LIGAS: a sala que não acaba','Sala rápida some quando a galera sai. A Liga não: é sempre a MESMA sala, com dia e hora combinados, e a estante guardando campeão e artilheiro temporada após temporada.'),
    (6,'📰','E no fim da noite, sai o jornal','O MARTELO fecha o campeonato com manchete de quem levou a liga, quem levou a copa e uma linha pra cada técnico da sala. Ah: todo gol agora mostra quem deu o passe.')
  ) as t(i, emoji, titulo, texto),
  lateral (select '<div style="border:3px solid #0C0C0C;border-radius:12px;background:#fff;padding:12px 14px;margin-bottom:10px">'
    || '<p style="margin:0 0 3px;font-size:15px;font-weight:900;color:#0C0C0C;line-height:1.3">' || t.emoji || ' ' || t.titulo || '</p>'
    || '<p style="margin:0;font-size:13.5px;font-weight:500;color:#444;line-height:1.5">' || t.texto || '</p></div>' as x) s
)
select
  '<div style="background:#F4ECD6;padding:24px 14px;font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif">'
  || '<div style="max-width:540px;margin:0 auto">'
  || '<div style="background:#0C0C0C;border:4px solid #0C0C0C;border-radius:18px 18px 0 0;padding:20px 22px">'
  || '<p style="margin:0;color:#FFC400;font-size:24px;font-weight:900;letter-spacing:.5px">🔨 LEILÃO LEGENDS</p>'
  || '<p style="margin:5px 0 0;color:rgba(255,255,255,.65);font-size:13px;font-weight:700">o leilão às cegas de lendas do futebol</p></div>'
  || '<div style="background:#fff;border:4px solid #0C0C0C;border-top:none;border-radius:0 0 18px 18px;padding:22px;box-shadow:6px 6px 0 #0C0C0C">'
  || '<p style="margin:0 0 8px;font-size:21px;font-weight:900;color:#0C0C0C;line-height:1.25">E aí, ' || (select nome from v) || '! 👋</p>'
  || '<p style="margin:0 0 18px;font-size:15px;font-weight:600;color:#333;line-height:1.6">'
  || 'Você jogou o Leilão Legends lá no começo — e, sinceramente, <b>você não imagina como o jogo está agora</b>. '
  || 'Não é a mesma coisa com uns retoques: mudou o começo, mudou o meio e mudou o fim. Dá uma olhada:</p>'
  || (select html from bloco)
  || '<div style="text-align:center;margin:22px 0 6px">'
  || '<a href="https://leilaolegends.com" style="display:inline-block;background:#FFC400;color:#0C0C0C;text-decoration:none;border:4px solid #0C0C0C;border-radius:14px;padding:15px 30px;font-size:18px;font-weight:900;box-shadow:5px 5px 0 #0C0C0C">🔨 VOLTAR PRO MEU TIME</a></div>'
  || '<p style="margin:14px 0 0;font-size:13px;font-weight:600;color:#666;line-height:1.55;text-align:center">Seu time e suas cartas continuam guardados na sua conta. É só entrar — e chamar a galera, que agora dá pra jogar junto de um monte de jeito.</p>'
  || '</div>'
  || '<p style="margin:16px 8px 0;font-size:11.5px;font-weight:600;color:rgba(12,12,12,.5);line-height:1.6;text-align:center">'
  || 'Você recebe este e-mail porque tem conta no Leilão Legends.<br>'
  || '<a href="' || (select sair from v) || '" style="color:rgba(12,12,12,.6)">Não quero mais receber e-mails</a> · '
  || '<a href="mailto:contato@leilaolegends.com" style="color:rgba(12,12,12,.6)">falar com a gente</a></p>'
  || '</div></div>'
$function$;
