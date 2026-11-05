// New dependency metadata/notice inventory; never reads credentials or product source.
import {execFileSync} from 'node:child_process';
import {existsSync,readFileSync,readdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
const roots=JSON.parse(execFileSync('pnpm',['list','--depth','Infinity','--json'],{encoding:'utf8'}));
const packages=new Map();
function visit(node){for(const group of ['dependencies','devDependencies','optionalDependencies'])for(const [name,item] of Object.entries(node[group]??{})){const key=name+'@'+item.version;if(packages.has(key))continue;packages.set(key,{name,version:item.version,path:item.path});visit(item);}}
roots.forEach(visit);
const records=[],notices=[];
for(const p of [...packages.values()].sort((a,b)=>a.name.localeCompare(b.name)||a.version.localeCompare(b.version))){
 const file=path.join(p.path,'package.json'),installed=existsSync(file);let metadata;
 if(installed)metadata=JSON.parse(readFileSync(file,'utf8'));
 else {const r=await fetch(`https://registry.npmjs.org/${encodeURIComponent(p.name)}/${p.version}`,{signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('Optional dependency metadata unavailable');metadata=await r.json();}
 const license=typeof metadata.license==='string'?metadata.license:metadata.license?.type??'UNKNOWN';
 const docs=installed?readdirSync(p.path).filter(n=>/^(license|licence|copying|notice)/i.test(n)):[];
 records.push({name:p.name,version:p.version,license,installed_on_this_platform:installed,license_source:installed?'package manifest':'npm version metadata (optional platform package)',notice_files:docs,scope:'third-party; own license retained'});
 for(const name of docs)notices.push(`## ${p.name} ${p.version}: ${name}\n\n`+readFileSync(path.join(p.path,name),'utf8'));
}
writeFileSync('evidence/dependency-licenses.json',JSON.stringify(records,null,2)+'\n');
writeFileSync('THIRD_PARTY_NOTICES.md','# Third-party notices\n\nDependencies retain their own licenses and copyrights; the draft ISC does not relicense them. No dependency source or built bundle is distributed in the submission source package. Optional-platform license metadata is included; installed license/notice texts follow. Judges retrieve dependencies through the lockfile under their upstream terms.\n\n'+notices.join('\n\n'));
if(records.some(r=>r.license==='UNKNOWN'))throw Error('Unknown dependency license');
console.log(JSON.stringify({packages:records.length,license_types:[...new Set(records.map(r=>r.license))]}));
