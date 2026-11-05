// Independently authored payment projection and deterministic explanation interface.
import {createHash} from 'node:crypto';
import {z} from 'zod';
export const digest = value => createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');
const phrase=z.string().trim().min(1).max(200).refine(x=>!/[\x00-\x1f\x7f]/.test(x));
const website=z.string().url().refine(x=>{const u=new URL(x);return u.protocol==='https:'&&!u.username&&!u.password;});
export const disclosureSchema=z.object({legal_name:phrase,trading_name:phrase,website,support:z.string().email(),product:phrase,invoice:phrase,descriptor:phrase,synthetic:z.boolean()}).strict();
export const orderSchema=z.object({reservation:z.string().uuid(),amount:z.literal('1.00'),currency:z.literal('USD')}).strict();
export const observationSchema=z.object({amount:z.string().regex(/^\d+\.\d{2}$/),currency:z.literal('USD'),descriptor:z.string().max(200),order_reference:z.string().max(32).optional(),invoice_reference:z.string().max(200).optional()}).strict();
export function disclosureHash(d) {return digest(disclosureSchema.parse(d));}
export function projectPayment(order,id) {
  const units=order.purchase_units;
  if(order.id!==id||order.intent!=='CAPTURE'||units?.length!==1||units[0].amount?.value!=='1.00'||units[0].amount?.currency_code!=='USD')throw Error('Provider order mismatch');
  const captures=units[0].payments?.captures??[];
  let stage=['CREATED','APPROVED','VOIDED'].includes(order.status)?order.status:'UNKNOWN';
  if(order.status==='SAVED'||order.status==='PAYER_ACTION_REQUIRED')stage='CREATED';
  let capture=null;
  if(captures.length===1){
    const c=captures[0];
    if(c.amount?.value==='1.00'&&c.amount?.currency_code==='USD'&&/^[A-Z0-9]{8,32}$/.test(c.id)&&['COMPLETED','PENDING'].includes(c.status)){
      stage=c.status==='COMPLETED'&&order.status!=='COMPLETED'?'UNKNOWN':c.status;
      capture={id:c.id,status:c.status,amount:'1.00',currency:'USD'};
    }
  }
  return {order_id:id,amount:'1.00',currency:'USD',provider_status:order.status,stage,capture,source:'paypal_sandbox_verified',checked_at:new Date().toISOString()};
}
export function matchPurchase(observation,disclosure,payment) {
  const o=observationSchema.parse(observation);
  const order=o.order_reference?.trim(),invoice=o.invoice_reference?.trim();
  const matched=!!(order||invoice)&&o.amount===payment.amount&&o.currency===payment.currency&&(!order||order===payment.order_id)&&(!invoice||invoice===disclosure.invoice);
  return {status:matched?'MATCHED':'NOT VERIFIED',basis:matched?(order?'explicit order reference':'explicit invoice reference'):'No matching explicit reference; a descriptor alone cannot identify a purchase.'};
}
export function explain(disclosure,payment,correlation) {
  const state={CREATED:'Created is not paid.',APPROVED:'Approval is not capture or completed payment.',PENDING:'Pending is not completed payment.',COMPLETED:'PayPal sandbox reports a matching completed capture.',VOIDED:'PayPal reports the order voided.',UNKNOWN:'Payment state is unverified; do not assume funds moved.'}[payment.stage];
  return {source:'deterministic_fallback',live_ai_execution:'NOT VERIFIED',sentences:[`${correlation.status}: ${correlation.basis}`,`Merchant-supplied identity: ${disclosure.legal_name}, trading as ${disclosure.trading_name}. Identity and website are not independently verified.`,`Merchant-supplied product: ${disclosure.product}; invoice ${disclosure.invoice}.`,`${payment.amount} ${payment.currency}. ${state}`,disclosure.synthetic?'Merchant/product details are explicitly synthetic. The payment projection is separately verified against PayPal sandbox.':'Merchant information is a disclosure, not independent merchant verification.','Sandbox only. This is not proof of a bank-statement charge or live funds. No AI controls payments.']};
}
