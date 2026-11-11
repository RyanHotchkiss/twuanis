'use client'
import type {ReactNode} from 'react'
import {useHubUniverse} from './HubUniverseContext'
export default function LiveResultQuestion({title,children,className}:{title?:ReactNode;children:ReactNode;className?:string}){const population=useHubUniverse();if(!population||population==='BANK')return null;return <>{title&&<h3>{title}</h3>}<p className={className}>{children}</p></>}
