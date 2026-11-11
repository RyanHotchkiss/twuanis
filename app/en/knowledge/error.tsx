'use client'
export default function Error({reset}:{reset:()=>void}){return <main lang="en" style={{padding:'100px 24px',background:'#f8f7f3',color:'#182922',minHeight:'100vh'}}><h1>Knowledge unavailable</h1><p role="alert">Please try again.</p><button onClick={reset}>Try again</button></main>}
