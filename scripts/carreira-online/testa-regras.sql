-- 🌐 Teste das regras da Carreira Online v2 (19/10). Rodar no SQL do Supabase: tudo acontece dentro de um bloco que termina com
-- RAISE EXCEPTION — o banco DESFAZ tudo e a mensagem de erro traz o resultado. Esperado:
-- vice_pelo_convidado=sem_permissao · continuar_convidado_sem_ser_vice=sem_permissao · vice_pelo_dono=ok · vice_com_dono_aqui=sem_permissao
-- vice_sem_dono=ok · pronto=ok · dono_no_meio_do_dia=ja_comecou · dono_comecar_no_dia_do_vice=sem_permissao · vice_comecar=ok
-- apito=ok · apito_repetido=fora_de_hora · encerrar=ok · dono_outro_dia=ok · rodada=1 comandante_dono=true
do $$
declare d uuid := '6b5cf422-d4ad-4c69-a7e6-da1125c85844'; d2 uuid := 'b068eff2-098f-4370-87de-3f90dd7b12f6';
  r jsonb; sid uuid; cod text; out text := ''; t text;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', d, 'email','diego.c.fonseca@gmail.com','role','authenticated')::text, true);
  r := public.esc_carr_criar('Pirâmide Teste', 'Neymarzetti'); sid := (r->>'id')::uuid; cod := r->>'codigo';
  perform set_config('request.jwt.claims', json_build_object('sub', d2, 'email','diego.c.fonseca2@gmail.com','role','authenticated')::text, true);
  r := public.esc_carr_entrar(cod, 'Clube Dois'); out := out || 'entrar=' || r::text;
  out := out || ' | vice_pelo_convidado=' || public.esc_carr_vice(sid, d2);
  out := out || ' | continuar_convidado_sem_ser_vice=' || public.esc_carr_continuar(sid);
  perform set_config('request.jwt.claims', json_build_object('sub', d, 'email','diego.c.fonseca@gmail.com','role','authenticated')::text, true);
  out := out || ' | vice_pelo_dono=' || public.esc_carr_vice(sid, d2);
  perform public.esc_carr_presenca(sid, true);
  perform set_config('request.jwt.claims', json_build_object('sub', d2, 'email','diego.c.fonseca2@gmail.com','role','authenticated')::text, true);
  out := out || ' | vice_com_dono_aqui=' || public.esc_carr_continuar(sid);
  perform set_config('request.jwt.claims', json_build_object('sub', d, 'email','diego.c.fonseca@gmail.com','role','authenticated')::text, true);
  perform public.esc_carr_presenca(sid, false);
  perform set_config('request.jwt.claims', json_build_object('sub', d2, 'email','diego.c.fonseca2@gmail.com','role','authenticated')::text, true);
  out := out || ' | vice_sem_dono=' || public.esc_carr_continuar(sid);
  out := out || ' | pronto=' || public.esc_carr_pronto(sid, 1, '{"xi":["a","b"]}');
  perform set_config('request.jwt.claims', json_build_object('sub', d, 'email','diego.c.fonseca@gmail.com','role','authenticated')::text, true);
  out := out || ' | dono_no_meio_do_dia=' || public.esc_carr_continuar(sid);
  out := out || ' | dono_comecar_no_dia_do_vice=' || public.esc_carr_comecar(sid);
  perform set_config('request.jwt.claims', json_build_object('sub', d2, 'email','diego.c.fonseca2@gmail.com','role','authenticated')::text, true);
  out := out || ' | vice_comecar=' || public.esc_carr_comecar(sid);
  out := out || ' | apito=' || public.esc_carr_apito(sid, 1);
  out := out || ' | apito_repetido=' || public.esc_carr_apito(sid, 1);
  out := out || ' | encerrar=' || public.esc_carr_encerrar_dia(sid);
  perform set_config('request.jwt.claims', json_build_object('sub', d, 'email','diego.c.fonseca@gmail.com','role','authenticated')::text, true);
  out := out || ' | dono_outro_dia=' || public.esc_carr_continuar(sid);
  out := out || ' | rodada=' || (select rodada from public.esc_carr_sala where id = sid)::text || ' comandante_dono=' || ((select comandante from public.esc_carr_sala where id = sid) = d)::text;
  raise exception 'RESULTADO: %', out;
end $$;
