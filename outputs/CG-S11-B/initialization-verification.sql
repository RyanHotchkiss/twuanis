-- READ ONLY, after initialization, before and after rollback-only smoke.
BEGIN TRANSACTION READ ONLY;
SELECT count(*)=1 AS exactly_one_receipt,
 coalesce(bool_and(operation_id='d07b12fe-d18d-4a86-a256-8cab437fab96'::uuid),false) AS correct_operation,
 coalesce(bool_and(auth_ids=(SELECT coalesce(jsonb_agg(id ORDER BY id),'[]') FROM auth.users)),false) AS auth_identity_set_verified,
 coalesce(bool_and(subscriptions=(SELECT coalesce(jsonb_agg(to_jsonb(s) ORDER BY s.user_id,s.id),'[]') FROM public.user_subscriptions s)),false) AS exact_subscription_receipt_verified
FROM twuanis_canonical_private.s11_retained_auth_receipt;
SELECT NOT EXISTS(SELECT 1 FROM auth.users u LEFT JOIN public.user_subscriptions s ON s.user_id=u.id LEFT JOIN public.packages p ON p.id=s.package_id GROUP BY u.id HAVING count(s.id)<>1 OR count(s.id) FILTER(WHERE p.slug='market-explorer' AND p.is_active AND s.status='active' AND s.billing_cycle='free')<>1)
 AND (SELECT count(*) FROM auth.users)=(SELECT count(*) FROM public.user_subscriptions) AS all_retained_users_default_only;
SELECT NOT EXISTS(SELECT 1 FROM public.payment_reviewers) AS no_test_reviewers,
 NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.import_operator_grants) AS no_test_import_operators;
-- Owner/session function returns false for every retained identity when no assignments exist.
SELECT NOT EXISTS(SELECT 1 FROM auth.users u WHERE public.is_payment_reviewer(u.id)) AS reviewers_fail_closed;
ROLLBACK;
