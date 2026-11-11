'use client'
export default function Error({reset}:{reset:()=>void}){return <main lang="es" style={{padding:'100px 24px',background:'#f8f7f3',color:'#182922',minHeight:'100vh'}}><h1>Conocimiento no disponible</h1><p role="alert">Inténtelo de nuevo.</p><button onClick={reset}>Intentar de nuevo</button></main>}
