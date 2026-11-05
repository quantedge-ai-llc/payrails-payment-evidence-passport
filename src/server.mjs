// Local-only API. No product endpoints and no HTTP capture endpoint.
import express from 'express';
import {timingSafeEqual} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {digest} from './evidence.mjs';
import {openDatabase,Store} from './database.mjs';
import {PassportService} from './service.mjs';
import {SandboxProvider} from './provider.mjs';
export function createApp(service,merchantKey){
  if(!merchantKey||merchantKey.length<32)throw Error('Merchant key required');
  const app=express();app.disable('x-powered-by');
  app.use((req,res,next)=>{res.set({'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'});if(req.originalUrl.includes('?'))return res.sendStatus(400);next();});
  app.use(express.json({limit:'16kb'}));
  app.use((req,res,next)=>{if(req.method==='POST'&&req.headers.origin&&!['http://127.0.0.1:5178','http://localhost:5178'].includes(req.headers.origin))return res.sendStatus(403);next();});
  const merchant=(req,res,next)=>timingSafeEqual(Buffer.from(digest(req.get('x-demo-merchant')??''),'hex'),Buffer.from(digest(merchantKey),'hex'))?next():res.sendStatus(401);
  app.get('/health',(_req,res)=>res.json({ok:true,mode:'local_sandbox'}));
  app.post('/v1/orders',merchant,async(req,res)=>res.status(201).json(await service.create(req.body)));
  app.get('/v1/orders/:id',merchant,async(req,res)=>res.json(await service.read(req.params.id)));
  app.post('/v1/orders/:id/passport',merchant,async(req,res)=>res.status(201).json(await service.enroll(req.params.id,req.body)));
  app.get('/v1/passports/:id',async(req,res)=>res.json(await service.customer(req.params.id,req.get('x-passport-access'))));
  app.post('/v1/passports/:id/recognize',async(req,res)=>res.json(await service.customer(req.params.id,req.get('x-passport-access'),req.body)));
  app.use((_req,res)=>res.sendStatus(404));
  app.use((err,_req,res,_next)=>res.status(err.name==='ZodError'?400:err.status??503).json({error:err.status?err.message:'State unavailable; do not assume payment completion'}));
  return app;
}
if(import.meta.url===pathToFileURL(process.argv[1]??'').href){
 const pool=openDatabase(process.env.DATABASE_URL);
 const provider=new SandboxProvider({clientId:process.env.PAYPAL_CLIENT_ID,clientSecret:process.env.PAYPAL_CLIENT_SECRET});
 const server=createApp(new PassportService(new Store(pool),provider),process.env.DEMO_MERCHANT_KEY).listen(4101,'127.0.0.1');
 process.on('SIGTERM',()=>server.close(()=>pool.end()));
}
