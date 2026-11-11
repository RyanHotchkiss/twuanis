export type OperationsMode='institutions'|'sources'|'audit'|'retries'|'runs'|'readiness'
export type OperationsQuery={mode:OperationsMode;institution?:string;source?:string;after?:string}
export type OperationsCommand={operation:'source.configure'|'source.suspend'|'source.stop'|'retry.review'|'retry.resolve'|'moderation.review'|'institution.approval.revoke';institution:string;source?:string;expected:string;reason:string;data:Record<string,unknown>}
export type OperationsRow=Record<string,unknown>&{id:string}
export type OperationsRead={items:OperationsRow[];owner:boolean;sourceOperations:boolean;moderation:boolean;liveRetrieval:false}
