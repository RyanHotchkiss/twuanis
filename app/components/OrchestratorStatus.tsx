import TopBar from './TopBar'
import copy from './orchestrator-status-copy.json'
import release from './orchestrator-status-release.json'

export default function OrchestratorStatus({language}: {language: 'en' | 'es'}) {
  const es = language === 'es'
  return <main className="mobile-page-fit" style={{minHeight:'100vh',padding:'clamp(1rem, 3vw, 2rem)',backgroundColor:'var(--background)',backgroundImage:'var(--ih-background-image)',backgroundSize:'cover',backgroundPosition:'center top',backgroundAttachment:'fixed',color:'var(--foreground)'}}>
    <TopBar mobileFit />
    <article lang={language} style={{maxWidth:1100,margin:'2rem auto',lineHeight:1.6,overflowWrap:'anywhere'}}>
      <h1 style={{fontSize:'clamp(1.6rem, 4vw, 3rem)'}}>{es ? 'ORQUESTADOR TWUANIS: IMPLEMENTACIÓN, VERIFICACIÓN Y ESTADO DE PRODUCCIÓN' : 'TWUANIS ORCHESTRATOR: IMPLEMENTATION, VERIFICATION & PRODUCTION STATUS'}</h1>
      <section style={panel} aria-label={es?'Registro de versión':'Release receipt'}>
        <p>{es?'Fecha del informe':'Report date'}: {copy.date}</p>
        <p>{es?release.stateEs:release.state}</p>
        <p>Git: {process.env.VERCEL_GIT_COMMIT_SHA || release.gitRevision}</p>
        <p>{es?'Identificador de despliegue':'Deployment identifier'}: {process.env.VERCEL_DEPLOYMENT_ID || release.deploymentId || (es?'No desplegado por esta tarea':'Not deployed by this task')}</p>
        <p>{es?release.databaseStateEs:release.databaseState}</p>
        {(es?release.blockersEs:release.blockers).map(p=><p key={p}>{p}</p>)}
      </section>
      {copy.sections.map(section=><section key={section.id} aria-labelledby={'report-'+section.id} style={panel}>
        <h2 id={'report-'+section.id} style={{fontSize:'1.35rem',marginTop:0}}>{section.id}. {section[language].title}</h2>
        {section[language].paragraphs.map((p,i)=><p key={i}>{p}</p>)}
      </section>)}
    </article>
  </main>
}
const panel = {marginBlock:24,padding:22,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12}
