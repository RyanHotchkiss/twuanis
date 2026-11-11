import {lensDefinition,type Request,type Question} from './lpi-contract'
// Dependency injection is internal/test-only. Browsers can supply only Request.
export async function executeSelected<T>(request:Request,deps:{authorize:(capability:string)=>Promise<string>;bind:()=>Promise<Question>;validate:(q:Question)=>void;execute:(q:Question)=>Promise<T>;fresh:(q:Question)=>Promise<void>}){
 const capability=lensDefinition(request.lens).capability
 const account=await deps.authorize(capability)
 const question=await deps.bind();deps.validate(question)
 const result=await deps.execute(question)
 await deps.fresh(question)
 if(await deps.authorize(capability)!==account)throw new Error('Authority changed during execution')
 return {question,result,account}
}
