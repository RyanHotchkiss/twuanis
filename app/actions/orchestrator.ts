'use server'
import {observeJourneyOperation} from '@/lib/measurement/server-observation'
import {executeOrchestrator,orchestratorCatalog,savedOrchestratorReports,selectOrchestratorSubjects,orchestratorTerms} from '@/lib/orchestrator-server'
import {readMyOrchestratorPresentation} from '@/lib/orchestrator-report-delivery'
import type {OrchestratorRequest,OrchestratorReport} from '@/lib/orchestrator-contract'
export async function readOrchestratorCatalog(){return orchestratorCatalog()}
export async function runOrchestrator(input:unknown,signal?:import('@/lib/measurement/server-observation').ObservationSignal,grant?:{id:string;revision:number}){try{return await observeJourneyOperation('orchestrator',signal,()=>executeOrchestrator(input,{signal,grant}))}finally{try{const {after}=await import('next/server');after(async()=>{try{const {supabaseAdmin}=await import('@/lib/supabase-admin');const {dispatchPendingMeasurement}=await import('@/lib/measurement/operations');await dispatchPendingMeasurement(supabaseAdmin)}catch{}})}catch{}}}
export async function readSavedOrchestratorReports(after:string|null=null){return savedOrchestratorReports(after)}
export async function readOrchestratorReport(id:string){return await readMyOrchestratorPresentation(id)as unknown as OrchestratorReport}
export async function readOrchestratorSubjects(input:Omit<OrchestratorRequest,'requestId'|'subject'|'filters'|'options'|'confirmed'>,after:string|null=null){return selectOrchestratorSubjects(input,after)}
export async function readOrchestratorTerms(orchestrator:string,population:string,dimension:string,parent:string|null,after:string|null=null){return orchestratorTerms(orchestrator,population,dimension,parent,after)}
