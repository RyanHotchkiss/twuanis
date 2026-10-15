BEGIN READ ONLY;
SELECT jsonb_build_object(
 'executions',(SELECT count(*) FROM twuanis_canonical_private.execution_credit_executions),
 'reports',(SELECT count(*) FROM twuanis_canonical_private.execution_credit_reports),
 'witnesses',(SELECT count(*) FROM twuanis_canonical_private.orchestrator_execution_witnesses),
 'charged_tokens',(SELECT coalesce(sum(quantity),0) FROM twuanis_canonical_private.execution_credit_events WHERE kind='EXECUTION_CONSUMED'),
 'owner_completed',(SELECT count(*) FROM twuanis_canonical_private.execution_credit_events WHERE kind='OWNER_COMPLETED'),
 'test_report',(SELECT jsonb_build_object('id',r.id,'execution',r.execution_id,'engines',jsonb_array_length(r.body->'engines'),'substantive',r.substantive_count,'population',r.body->>'population','kind',x.authority->>'kind','private_observations',jsonb_array_length(r.body#>'{evidence,originalPrices,PRIVATE}'),'methodology_release',a.release_id,'witness_count',(SELECT count(*) FROM twuanis_canonical_private.orchestrator_execution_witnesses w WHERE w.report_id=r.id)) FROM twuanis_canonical_private.execution_credit_reports r JOIN twuanis_canonical_private.execution_credit_executions x ON x.id=r.execution_id JOIN twuanis_canonical_private.orchestrator_witness_attempts a ON a.execution_id=x.id WHERE r.id='ac4885bc-9e7f-4def-8d56-ac523c2a6600')
) AS acceptance;
COMMIT;
