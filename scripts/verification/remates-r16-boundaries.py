"""Local emitted-client and source-boundary review; never reads credentials."""
from pathlib import Path
import json,re,hashlib
root=Path('/Users/cassidydaddy/twuanis');build=Path('/private/tmp/remates-shot2-build-w58a61hz');out=root/'outputs/remates'
markers=['twuanis_remates_private','PDF_DECODING_FAILED','pdf-worker.mjs','positioned-label-rows-v1','SUPABASE_SERVICE_ROLE_KEY','ONVO_SECRET_KEY','RESEND_API_KEY','TWILIO_AUTH_TOKEN','BEGIN PRIVATE KEY','BEGIN RSA PRIVATE KEY','runPriceMeterComparableEngine','buildPriceMeterDistribution','executeWeightedPrice','executeCrossDimensional']
chunks=list((build/'.next/static').rglob('*.js'));findings=[];proxies=[]
for p in chunks:
 text=p.read_text()
 for marker in markers:
  if marker in text:
   if marker in ['executeWeightedPrice','executeCrossDimensional'] and re.search(r'createServerReference\)\("[a-f0-9]+"[^;]{0,200}findSourceMapURL,"'+marker+r'[^"]*"',text):proxies.append({'path':str(p.relative_to(build)),'marker':marker,'classification':'documented Next server-action reference; not implementation'})
   else:findings.append({'path':str(p.relative_to(build)),'marker':marker})
source=[]
for folder in ['lib/remates','app/components/remates','app/admin/remates','app/remates','app/actions','app/api/remates']:
 for p in (root/folder).rglob('*.ts*'):
  if folder=='app/actions' and not p.name.startswith('remates-'):continue
  text=p.read_text()
  for pattern in ['dangerouslySetInnerHTML','eval(','.innerHTML =']:
   if pattern in text:source.append({'path':str(p.relative_to(root)),'marker':pattern})
report={'status':'PASS' if not findings and not source else 'REVIEW_REQUIRED','buildId':(build/'.next/BUILD_ID').read_text().strip(),'clientChunks':len(chunks),'markers':markers,'clientFindings':findings,'expectedServerActionProxies':proxies,'activeMarkupFindings':source,'scope':'Bounded emitted-client markers/source sinks; not exhaustive secret scanning, dependency audit, screen reader or signed-session proof'}
(out/'R-16-boundary-results.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
