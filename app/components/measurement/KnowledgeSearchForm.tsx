'use client'
import Form from 'next/form'
import {useEffect,type ReactNode} from 'react'
import {commitKnowledgeSearch,clearKnowledgeCommit} from '@/lib/measurement/knowledge-commit'
export default function KnowledgeSearchForm({locale,action,className,children}:{locale:'en'|'es';action:string;className:string;children:ReactNode}){
 useEffect(()=>{window.addEventListener('tw-measurement-consent',clearKnowledgeCommit);return()=>window.removeEventListener('tw-measurement-consent',clearKnowledgeCommit)},[])
 return <Form action={action} prefetch={false} className={className} role="search" onSubmit={e=>commitKnowledgeSearch(locale,new FormData(e.currentTarget))}>{children}</Form>
}
