"""Offline fail-closed staging target validation. No network or mutation command."""
import json,sys,re
from urllib.parse import urlsplit
PRODUCTION={'szhpqemhjyvvqgjgsmsw'}
NAME='TWUANIS-STAGING-DO-NOT-USE-FOR-PRODUCTION'
STAGING='zryfurtogxvrnilnnadn'
def verify(c):
 if c.get('environment')!='staging' or c.get('projectName')!=NAME:raise ValueError('Explicit staging identity required')
 ref=c.get('projectRef','')
 if ref != STAGING or ref in PRODUCTION:raise ValueError('Unknown or production project reference rejected')
 if c.get('ownerVerified') is not True:raise ValueError('Owner project identity verification missing')
 if c.get('apiUrl')!='https://'+ref+'.supabase.co':raise ValueError('API target mismatch')
 if c.get('databaseHost')!='db.'+ref+'.supabase.co':raise ValueError('Pinned direct database host required; pooler must be reviewed separately')
 if c.get('vercelProject')!='twuanis-staging':raise ValueError('Separate staging deployment target required')
 if c.get('installationAuthorized') is not True:raise ValueError('Separate installation authorization missing')
 if c.get('connectedDatabaseIdentityVerified') is not True:raise ValueError('Actual connected database identity verification missing')
 return ref
if __name__=='__main__':
 try:
  if len(sys.argv)!=2:raise ValueError('Supply explicit staging identity JSON; no ambient environment/link fallback')
  c=json.load(open(sys.argv[1]));verify(c);print('Offline configuration PASS only; no connection or migration executed')
 except Exception as e:print('BLOCKED:',str(e));sys.exit(1)
