// New standalone storage interface; imports no product runtime modules.
import pg from 'pg';
export function openDatabase(connectionString) {
  const u = new URL(connectionString);
  if (!['postgres:', 'postgresql:'].includes(u.protocol) || !['127.0.0.1', 'localhost', '[::1]'].includes(u.hostname) || u.pathname !== '/passport_demo') throw Error('Only disposable loopback passport_demo is allowed');
  return new pg.Pool({connectionString, max:2, connectionTimeoutMillis:2500, statement_timeout:4000});
}
export class Store {
  constructor(pool) { this.pool=pool; }
  async reserve(key,digest) {
    const inserted=await this.pool.query("INSERT INTO sandbox_order(reservation,request_digest,amount) VALUES($1,$2,'1.00') ON CONFLICT DO NOTHING RETURNING reservation",[key,digest]);
    const saved=await this.pool.query('SELECT * FROM sandbox_order WHERE reservation=$1',[key]);
    return {won:inserted.rowCount===1,row:saved.rows[0]};
  }
  async attach(key,id) { const r=await this.pool.query('UPDATE sandbox_order SET provider_id=$2 WHERE reservation=$1 AND provider_id IS NULL',[key,id]);if(r.rowCount!==1)throw Error('Reservation reconciliation required'); }
  async order(id) {return (await this.pool.query('SELECT * FROM sandbox_order WHERE provider_id=$1',[id])).rows[0];}
  async enroll(id,order,capability,disclosure,digest,payment) {return (await this.pool.query('INSERT INTO passport(id,provider_id,capability_digest,merchant_disclosure,disclosure_digest,verified_payment) VALUES($1,$2,$3,$4::jsonb,$5,$6::jsonb) ON CONFLICT(provider_id) DO NOTHING RETURNING id',[id,order,capability,JSON.stringify(disclosure),digest,JSON.stringify(payment)])).rowCount===1;}
  async receipt(id,capability) {return (await this.pool.query('SELECT * FROM passport WHERE id=$1 AND capability_digest=$2',[id,capability])).rows[0];}
  async payment(id,payment) {await this.pool.query('UPDATE passport SET verified_payment=$2::jsonb WHERE id=$1',[id,JSON.stringify(payment)]);}
}
