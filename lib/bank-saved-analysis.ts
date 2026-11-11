'use server'
import {loadAnalysis} from './load-analysis'
import {assertBankCommitted} from './saved-universe-contract'
export async function readMyBankAnalysis(id:string){
 const record=await loadAnalysis(id)
 if(!record||record.filters?.population!=='BANK'||record.universeReselectionRequired)throw Error('Saved Bank analysis unavailable or current Bank access required.')
 assertBankCommitted(record.result)
 return {id:record.id,name:record.name,committed:record.result}
}
