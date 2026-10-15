const fs=require('fs'),crypto=require('crypto'),P='/private/tmp/twuanis-orch-final-01',cases=JSON.parse(fs.readFileSync(P+'/adversarial-bodies.private.json')),original=cases[0].body;function add(name,fn){let body=structuredClone(original);fn(body);cases.push({name,body})}function node(r,n){const id=crypto.createHash('sha256').update(JSON.stringify(n)).digest('hex');r.immutableEvidence.nodes[id]=n;return id}
add('content-hash-tamper',r=>{const id=Object.keys(r.immutableEvidence.nodes)[0];r.immutableEvidence.nodes[id]=['scalar','CHANGED']});
add('missing-node',r=>{delete r.immutableEvidence.nodes[r.immutableEvidence.records[0].contentId]});
add('missing-referenced-node',r=>{node(r,['array',['0'.repeat(64)]])});
add('invalid-scalar-numeric',r=>node(r,['scalar',42]));
add('binary64-identity-mismatch',r=>node(r,['binary64','3ff0000000000000','2']));
add('unsupported-node-kind',r=>node(r,['trusted-client-validation',true]));
add('duplicate-object-key',r=>{const id=node(r,['scalar','x']);node(r,['object',[['same',id],['same',id]]])});
add('invalid-root-reference',r=>{r.immutableEvidence.records[0].contentId='0'.repeat(64)});
add('duplicate-engine-output',r=>{r.immutableEvidence.records.push({...r.immutableEvidence.records.find(v=>v.kind.endsWith('/engine-output'))})});
add('missing-resolved-input',r=>{let removed=false;r.immutableEvidence.records=r.immutableEvidence.records.filter(v=>{if(!removed&&v.kind.endsWith('/resolved-input')){removed=true;return false}return true})});
add('engine-output-body-tamper',r=>{r.engines[0].result.bank.n+=1});
add('request-scope-body-tamper',r=>{r.request.scope.geography.province='10'});
fs.writeFileSync(P+'/adversarial-bodies.private.json',JSON.stringify(cases));console.log('Cases',cases.length);
