#!/usr/bin/env python3
"""New isolated schema/concurrency validator. Docker networking is disabled; container always removed."""
from pathlib import Path
import subprocess,time,json,os
root=Path(__file__).resolve().parents[1];name='passport-schema-check-'+str(os.getpid())
def docker(*args,input=None):
    return subprocess.run(['docker',*args],input=input,text=True,capture_output=True,check=True).stdout.strip()
def sql(query):return docker('exec','-i',name,'psql','-U','postgres','-d','passport_demo','-v','ON_ERROR_STOP=1','-At',input=query)
try:
    docker('run','--rm','-d','--network','none','--name',name,'-e','POSTGRES_HOST_AUTH_METHOD=trust','-e','POSTGRES_DB=passport_demo','postgres:14')
    for _ in range(100):
        try:
            docker('exec',name,'sh','-c','test "$(cat /proc/1/comm)" = postgres')
            if sql('SELECT 1')=='1':break
        except subprocess.CalledProcessError:pass
        time.sleep(.2)
    else:raise RuntimeError('Database not ready')
    migration=(root/'sql/001_passport.sql').read_text()
    sql(migration);sql(migration)
    assert sql("SELECT string_agg(tablename,',' ORDER BY tablename) FROM pg_tables WHERE schemaname='public'")=='passport,sandbox_order'
    key='11111111-1111-4111-8111-111111111111'
    command=['docker','exec','-i',name,'psql','-U','postgres','-d','passport_demo','-v','ON_ERROR_STOP=1','-At']
    first=subprocess.Popen(command,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
    first.stdin.write(f"BEGIN; INSERT INTO sandbox_order(reservation,request_digest,amount) VALUES('{key}','unchanged','1.00') ON CONFLICT DO NOTHING RETURNING reservation; SELECT pg_sleep(1.5); COMMIT;");first.stdin.close()
    time.sleep(.25)
    second=sql(f"INSERT INTO sandbox_order(reservation,request_digest,amount) VALUES('{key}','different','1.00') ON CONFLICT DO NOTHING RETURNING reservation;")
    first.wait(timeout=10)
    assert first.returncode==0
    assert sql('SELECT count(*) FROM sandbox_order')=='1'
    assert sql('SELECT request_digest FROM sandbox_order')=='unchanged'
    sql("BEGIN; CREATE TABLE should_rollback(id int); ROLLBACK;")
    assert sql("SELECT to_regclass('public.should_rollback') IS NULL")=='t'
    report={'result':'PASS','database':'disposable postgres:14; networking disabled','schema':['passport','sandbox_order'],'migration_replay':'PASS','concurrent_reservations':'one winner; duplicate cannot change digest','transaction_rollback':'PASS','product_schema_present':False}
    (root/'evidence/postgres-check.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
finally:
    subprocess.run(['docker','rm','-f',name],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
