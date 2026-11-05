// Newly authored UI. Purchase access is entered locally; never accepted in a URL or persisted.
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import './style.css';
function Passport(){
 const [id,setId]=useState(''),[cap,setCap]=useState(''),[receipt,setReceipt]=useState(null),[error,setError]=useState(''),[reference,setReference]=useState(''),[descriptor,setDescriptor]=useState('');
 async function load(event,recognize=false){event.preventDefault();setError('');try{
  if(!/^[a-f0-9-]{36}$/.test(id)||!/^[a-f0-9]{64}$/.test(cap))throw Error();
  const response=await fetch(`/v1/passports/${id}${recognize?'/recognize':''}`,{method:recognize?'POST':'GET',cache:'no-store',credentials:'omit',headers:{'x-passport-access':cap,...(recognize?{'Content-Type':'application/json'}:{})},...(recognize?{body:JSON.stringify({descriptor,amount:receipt.payment.amount,currency:receipt.payment.currency,...(reference?{order_reference:reference}:{})})}:{})});
  if(!response.ok)throw Error();setReceipt(await response.json());
 }catch{setError('Purchase or provider state could not be verified. Do not assume funds moved.');}}
 return <main><header><p>LOCAL PAYPAL SANDBOX · NO LIVE FUNDS</p><h1>Payment Evidence Passport</h1></header><aside>Merchant details are supplied by the merchant, not independently verified. References identify a purchase; a statement descriptor alone does not.</aside>
 <form onSubmit={load}><h2>Open your private receipt</h2><label>Purchase ID<input value={id} onChange={e=>setId(e.target.value)} required autoComplete="off"/></label><label>Purchase access capability<input type="password" value={cap} onChange={e=>setCap(e.target.value)} required autoComplete="off"/></label><button>Verify with PayPal</button></form>
 {error&&<p role="alert">{error}</p>}{receipt&&<><section><h2>{receipt.disclosure.trading_name}</h2>{receipt.disclosure.synthetic&&<strong>SYNTHETIC MERCHANT / PRODUCT DISCLOSURE — PAYMENT VERIFIED SEPARATELY</strong>}<dl>{Object.entries({Legal:receipt.disclosure.legal_name,Website:receipt.disclosure.website,Support:receipt.disclosure.support,Product:receipt.disclosure.product,Invoice:receipt.disclosure.invoice,Descriptor:receipt.disclosure.descriptor,Amount:`${receipt.payment.amount} ${receipt.payment.currency}`,Order:receipt.payment.order_id,'Provider state':receipt.payment.provider_status,'Payment stage':receipt.payment.stage,Source:receipt.payment.source}).map(([k,v])=><React.Fragment key={k}><dt>{k}</dt><dd>{v}</dd></React.Fragment>)}</dl></section>
 <section><h2>Reference check: {receipt.correlation.status}</h2><p>{receipt.correlation.basis}</p><form onSubmit={e=>load(e,true)}><label>Observed descriptor<input value={descriptor} onChange={e=>setDescriptor(e.target.value)}/></label><label>Explicit PayPal order reference (leave blank to test descriptor only)<input value={reference} onChange={e=>setReference(e.target.value)}/></label><button>Check reference — no payment action</button></form></section>
 <section><h2>Deterministic explanation — not AI-generated</h2><p>Live AI execution: NOT VERIFIED</p>{receipt.explanation.sentences.map((text,i)=><p key={i}>{text}</p>)}</section></>}
 <footer>Created, approved and pending are not completed payment. This customer view cannot create, approve or capture payments. No server credentials are sent to the browser.</footer></main>;
}
createRoot(document.getElementById('root')).render(<Passport/>);
