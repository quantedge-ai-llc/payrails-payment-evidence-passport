// New sandbox-only Orders v2 transport. No API hostname or credentials may be supplied by a browser.
import {digest} from './evidence.mjs';
export class SandboxProvider {
  constructor({clientId,clientSecret,fetcher=fetch,record=()=>{}}) {if(!clientId||!clientSecret)throw Error('Sandbox credentials required');Object.assign(this,{clientId,clientSecret,fetcher,record});}
  async request(path,body,key) {
    const auth=await this.fetcher('https://api-m.sandbox.paypal.com/v1/oauth2/token',{method:'POST',headers:{Authorization:'Basic '+Buffer.from(this.clientId+':'+this.clientSecret).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials',signal:AbortSignal.timeout(8000)});
    this.record({operation:'oauth',http:auth.status});
    if(!auth.ok)throw Error('Sandbox authentication failed');
    const {access_token}=await auth.json();if(typeof access_token!=='string'||!access_token.trim())throw Error('Invalid sandbox token');
    const r=await this.fetcher('https://api-m.sandbox.paypal.com'+path,{method:body===undefined?'GET':'POST',headers:{Authorization:'Bearer '+access_token,'Content-Type':'application/json',...(key?{'PayPal-Request-Id':key}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(12000)});
    this.record({operation:path.endsWith('/capture')?'capture':path==='/v2/checkout/orders'?'create':'read',http:r.status});
    if(!r.ok)throw Error('Sandbox request failed; reconcile before retry');return r.json();
  }
  create(key) {return this.request('/v2/checkout/orders',{intent:'CAPTURE',purchase_units:[{amount:{currency_code:'USD',value:'1.00'}}]},key);}
  get(id) {if(!/^[A-Z0-9]{8,32}$/.test(id))throw Error('Invalid order ID');return this.request('/v2/checkout/orders/'+id);}
  capture(id) {if(!/^[A-Z0-9]{8,32}$/.test(id))throw Error('Invalid order ID');return this.request('/v2/checkout/orders/'+id+'/capture',{},digest('passport-demo-capture:'+id).slice(0,32));}
}
