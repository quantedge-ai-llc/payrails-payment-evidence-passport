// New hackathon service, with explicit Store/Provider boundaries for independent testing.
import {randomUUID,randomBytes} from 'node:crypto';
import {orderSchema,disclosureSchema,disclosureHash,digest,projectPayment,matchPurchase,explain} from './evidence.mjs';
export class Fault extends Error {constructor(status,message){super(message);this.status=status;}}
export class PassportService {
  constructor(store,provider){Object.assign(this,{store,provider});}
  async create(input){
    const v=orderSchema.parse(input),hash=digest(v.amount+':'+v.currency),saved=await this.store.reserve(v.reservation,hash);
    if(saved.row.request_digest!==hash)throw new Fault(409,'Reservation input conflict');
    if(!saved.won){if(saved.row.provider_id)return {order_id:saved.row.provider_id,reused:true};throw new Fault(409,'Reservation pending; reconcile provider state');}
    const order=await this.provider.create(v.reservation);
    if(!/^[A-Z0-9]{8,32}$/.test(order.id))throw Error('Unexpected provider response');
    await this.store.attach(v.reservation,order.id);
    return {order_id:order.id,reused:false};
  }
  async read(id){if(!await this.store.order(id))throw new Fault(404,'Order unavailable');return projectPayment(await this.provider.get(id),id);}
  async enroll(id,input){
    const disclosure=disclosureSchema.parse(input),payment=await this.read(id);
    const purchase=randomUUID(),capability=randomBytes(32).toString('hex');
    if(!await this.store.enroll(purchase,id,digest(capability),disclosure,disclosureHash(disclosure),payment))throw new Fault(409,'Passport already exists; no overwrite');
    return {purchase_id:purchase,capability};
  }
  async customer(id,capability,observation){
    if(!/^[a-f0-9-]{36}$/.test(id)||!/^[a-f0-9]{64}$/.test(capability??''))throw new Fault(404,'Passport unavailable');
    const row=await this.store.receipt(id,digest(capability));if(!row)throw new Fault(404,'Passport unavailable');
    const disclosure=disclosureSchema.parse(row.merchant_disclosure);
    if(disclosureHash(disclosure)!==row.disclosure_digest)throw Error('Disclosure integrity failure');
    const payment=await this.read(row.provider_id);
    await this.store.payment(id,payment);
    const correlation=matchPurchase(observation??{descriptor:'',amount:payment.amount,currency:payment.currency,order_reference:payment.order_id},disclosure,payment);
    return {purchase_id:id,disclosure,payment,correlation,explanation:explain(disclosure,payment,correlation),mocked_payment:false,environment:'paypal_sandbox'};
  }
  async capture(id,authorized){
    if(authorized!==true)throw new Fault(403,'Explicit sandbox capture authorization required');
    const before=await this.read(id);
    if(before.stage!=='COMPLETED'){
      if(before.stage!=='APPROVED')throw new Fault(409,'Provider payer approval required');
      await this.provider.capture(id);
    }
    const after=await this.read(id);
    if(after.stage!=='COMPLETED'||!after.capture)throw new Fault(409,'Completed capture not verified; reconcile');
    return after;
  }
}
