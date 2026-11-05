// Isolated local lifecycle. Secrets stay in process environment and an external mode-0600 file.
import {readFileSync,writeFileSync,existsSync,openSync} from 'node:fs';
import {execFileSync,spawn} from 'node:child_process';
import {randomBytes,randomUUID} from 'node:crypto';
import {openDatabase,Store} from '../src/database.mjs';
import {SandboxProvider} from '../src/provider.mjs';
import {PassportService} from '../src/service.mjs';
import {projectPayment,digest} from '../src/evidence.mjs';
import {migrate} from './migrate.mjs';
import {createApp} from '../src/server.mjs';
const privateFile=process.env.PASSPORT_PRIVATE_STATE??'/tmp/passport-isolated-private.json';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const docker=(args,env=process.env)=>execFileSync('docker',args,{env,encoding:'utf8',stdio:['ignore','pipe','pipe']});
function credentials(){return {clientId:process.env.PAYPAL_CLIENT_ID,clientSecret:process.env.PAYPAL_CLIENT_SECRET};}
const disclosure={legal_name:'Synthetic demo merchant',trading_name:'Synthetic demo shop',website:'https://merchant.example',support:'support@merchant.example',product:'Synthetic sandbox demonstration',invoice:'SYNTHETIC-'+Date.now(),descriptor:'SYNTHETIC DEMO',synthetic:true};
async function main(){
 const mode=process.argv[2],http=[];
 if(!['start','check','capture'].includes(mode))throw Error('Use start, check or capture');
 const provider=new SandboxProvider({...credentials(),record:x=>http.push(x)});
 if(mode!=='start'){
  const s=JSON.parse(readFileSync(privateFile,'utf8')),pool=openDatabase(s.database);
  try{
   const service=new PassportService(new Store(pool),provider);
   if(mode==='capture')await service.capture(s.order,process.env.AUTHORIZE_USD1_SANDBOX_CAPTURE==='true');
   const read=await service.customer(s.purchase,s.capability),notVerified=await service.customer(s.purchase,s.capability,{amount:'1.00',currency:'USD',descriptor:read.disclosure.descriptor});
   if(read.correlation.status!=='MATCHED'||notVerified.correlation.status!=='NOT VERIFIED'||read.explanation.source!=='deterministic_fallback')throw Error('Evidence check failed');
   const persisted=await pool.query('SELECT verified_payment FROM passport WHERE id=$1',[s.purchase]);
   if(persisted.rows[0].verified_payment.stage!==read.payment.stage)throw Error('Snapshot persistence failed');
   const report={environment:'paypal_sandbox',payment_mocked:false,merchant_disclosure:'synthetic, merchant-supplied',provider_stage:read.payment.stage,capture_status:read.payment.capture?.status??null,redacted_order:s.order.slice(0,3)+'…'+s.order.slice(-3),reference_match:read.correlation.status,descriptor_only:notVerified.correlation.status,explanation:read.explanation.source,live_ai_execution:'NOT VERIFIED',database:'isolated disposable local PostgreSQL',snapshot_persisted:true,http,existing_order_import:s.imported,checked_at:new Date().toISOString()};
   writeFileSync('evidence/provider-readback.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
  }finally{await pool.end();}return;
 }
 if(existsSync(privateFile))throw Error('Private state exists; reconcile before starting another session');
 const name='passport-isolated-'+process.pid,password=randomBytes(32).toString('hex');
 docker(['run','--rm','-d','--name',name,'-p','127.0.0.1:55441:5432','-e','POSTGRES_PASSWORD','-e','POSTGRES_DB=passport_demo','postgres:14'],{...process.env,POSTGRES_PASSWORD:password});
 let server,pool;
 const cleanup=async()=>{server?.close();if(pool)await pool.end();try{docker(['stop',name]);}catch{}};
 process.on('SIGTERM',()=>{void cleanup().then(()=>process.exit());});process.on('SIGINT',()=>{void cleanup().then(()=>process.exit());});
 try{
  let ready=false;for(let i=0;i<80;i++){try{const result=docker(['exec',name,'sh','-c','test "$(cat /proc/1/comm)" = postgres && psql -U postgres -d passport_demo -Atc "SELECT 1"']);if(result.trim()==='1'){ready=true;break;}}catch{}await pause(250);}if(!ready)throw Error('Database startup failed');
  const database=`postgresql://postgres:${password}@127.0.0.1:55441/passport_demo`;
  pool=openDatabase(database);await migrate(pool);await migrate(pool);
  const store=new Store(pool),service=new PassportService(store,provider),merchant=randomBytes(32).toString('hex'),reservation=randomUUID();
  const state={database,merchant,container:name,reservation,status:'preparing'};
  writeFileSync(privateFile,JSON.stringify(state),{mode:0o600,flag:'wx'});
  let id,approval;
  if(process.env.EXISTING_SANDBOX_ORDER_ID){
   id=process.env.EXISTING_SANDBOX_ORDER_ID;
   projectPayment(await provider.get(id),id);
   await store.reserve(reservation,digest('1.00:USD'));await store.attach(reservation,id);
  }else{
   ({order_id:id}=await service.create({reservation,amount:'1.00',currency:'USD'}));
   const order=await provider.get(id);
   approval=order.links?.find(l=>['approve','payer-action'].includes(l.rel))?.href;
   if(approval){const u=new URL(approval);if(u.protocol!=='https:'||!['www.sandbox.paypal.com','sandbox.paypal.com'].includes(u.hostname))throw Error('Unexpected approval URL');}
  }
  const issued=await service.enroll(id,disclosure);
  Object.assign(state,{order:id,purchase:issued.purchase_id,capability:issued.capability,approval,imported:!!process.env.EXISTING_SANDBOX_ORDER_ID,status:'ready'});
  writeFileSync(privateFile,JSON.stringify(state),{mode:0o600});
  server=createApp(service,merchant).listen(4101,'127.0.0.1');
  console.log(JSON.stringify({local_api:'127.0.0.1:4101',local_database:'passport_demo',credentials_printed:false,private_state:privateFile,payment_stage:(await service.read(id)).stage,imported:state.imported}));
 }catch(error){await cleanup();throw error;}
}
main().catch(()=>{console.error('Local demo stopped; reconcile protected state. No secret diagnostics printed.');process.exitCode=1;});
