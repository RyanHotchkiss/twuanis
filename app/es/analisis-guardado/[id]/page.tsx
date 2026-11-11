import {loadAnalysis} from '@/lib/load-analysis'
import {savedAnalysisDestination} from '@/lib/saved-analysis-destination'
import {notFound,redirect} from 'next/navigation'
export default async function SavedAnalysis({params}:{params:Promise<{id:string}>}){const {id}=await params;const record=await loadAnalysis(id);if(!record)notFound();redirect(savedAnalysisDestination(record,'es'))}
