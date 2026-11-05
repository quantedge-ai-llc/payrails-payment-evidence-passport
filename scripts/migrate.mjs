// This runner executes ONLY this submission's new schema, atomically and serially.
import {readFile} from 'node:fs/promises';
import {openDatabase} from '../src/database.mjs';
export async function migrate(pool){const client=await pool.connect();try{await client.query('BEGIN');await client.query('SELECT pg_advisory_xact_lock(4101,1)');await client.query(await readFile(new URL('../sql/001_passport.sql',import.meta.url),'utf8'));await client.query('COMMIT');}catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}}
if(process.argv[1]?.endsWith('/migrate.mjs')){const pool=openDatabase(process.env.DATABASE_URL);try{await migrate(pool);console.log('Submission schema ready');}catch{console.error('Migration failed and rolled back');process.exitCode=1;}finally{await pool.end();}}
