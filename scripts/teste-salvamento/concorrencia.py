# Somente o container local da bancada; não usa credencial nem URL do projeto real.
import concurrent.futures
import json
import subprocess
import uuid

cmd = ['docker', 'exec', 'll-save-lab-20261124', 'psql', '-U', 'postgres', '-Atv', 'ON_ERROR_STOP=1', '-c']
owner = '00000000-0000-4000-a000-000000000001'
subprocess.check_call(cmd + ["do $$begin if to_regclass('public.test_rights') is null then raise exception 'SOMENTE LAB'; end if;end$$; delete from esc_save_private.careers where seed=99;"])
state = json.dumps(dict(seed=99, careerOnline=True, onlineMode='cpu', managers=[dict(teamName='Clube de teste')], seasonNo=4, round=30))

def save(_):
    sql = f"set role authenticated; select set_config('request.jwt.claim.sub','{owner}',false); select public.esc_carreira_salvar_v2(auth.uid(),99,'{state}',0,'{uuid.uuid4()}')->>'status';"
    return subprocess.check_output(cmd + [sql], text=True).strip().splitlines()[-1]

with concurrent.futures.ThreadPoolExecutor() as pool:
    results = list(pool.map(save, [1, 2]))
assert sorted(results) == ['conflict', 'saved'], results
print('OK: dois pedidos concorrentes, um salvo e um conflito', results)
