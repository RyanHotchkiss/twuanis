'use client'
import SourceStatus from './SourceStatus'
export default function Audit({language='en'}:{language?:'en'|'es'}){return <SourceStatus language={language} initialMode="audit"/>}
