// This row projects existing redacted evidence, never a new transaction or account-wide listing.
import evidence from '../evidence/provider-readback.json' with {type:'json'};
export const dashboardRows=Object.freeze([{reference:evidence.redacted_order,status:evidence.provider_stage,source:'Recorded PayPal sandbox read-back',merchant:'Synthetic merchant / product disclosure',correlation:evidence.reference_match,descriptor:evidence.descriptor_only,checkedAt:evidence.checked_at,passport:'#passport'}]);
