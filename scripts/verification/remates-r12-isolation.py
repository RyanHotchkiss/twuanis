"""Bounded structural coverage of all existing 17 engine authority paths; not numerical R15 acceptance."""
from pathlib import Path
import re,json
r=Path('/Users/cassidydaddy/twuanis');doc=(r/'outputs/remates/06-ANALYTICAL-POPULATION-ISOLATION.md').read_text();rows=[line for line in doc.splitlines() if re.match(r'\| \d+ ',line)];results=[]
assert len(rows)==17
for row in rows:
 capability=re.search(r'`(cap-[\w-]+)`',row)[1];paths=list(dict.fromkeys(re.findall(r'lib/[\w-]+\.ts',row)));assert paths
 for path in paths:
  source=(r/path).read_text();assert not re.search(r"(?:from\s+|require\()['\"][^'\"]*remates|remate_public_read|twuanis_remates_private",source),(capability,path)
 assert capability in (r/'lib/package-capability-authorization.ts').read_text()
 results.append(dict(capability=capability,paths=paths,result='PASS — existing ordinary authority paths have no Remates dependency'))
public=(r/'supabase/migrations/074_remates_public_marketplace.sql').read_text();assert not re.search(r'(?<!remates_private\.)\bpublic\.listings\b|listings_ontology_terms|market_statistics|ontology_graph_cache',public)
server=(r/'app/actions/remates-public.ts').read_text();assert '.from(' not in server and "rpc('remate_public_read'" in server
home=(r/'app/components/home-marketplace/HomeMarketplace.tsx').read_text();assert "useState<'sale'|'rent'>('sale')" in home and "switchMode(next:'sale'|'rent')" in home
report={'status':'PASS','engineCount':len(results),'results':results,'publicPopulation':'Independent Remates projection only','scope':'Structural authority/source dependency check plus separate disposable DB ordinary snapshots; all-engine numerical/warm-cold output matrix remains R15 pending'}
(r/'outputs/remates/R-12-isolation-results.json').write_text(json.dumps(report,indent=2)+'\n');print('PASS — 17 engine authority paths isolated; no numerical R15 claim')
