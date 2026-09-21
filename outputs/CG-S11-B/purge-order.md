# Reviewed pre-installation purge order

Union of query-71 and query-77. No cycle or protected incoming child was found in supplied scope. Auth/reference rows are not deleted. All canonical tables are installed afterward and start empty; do not import test operator assignments. Unexpected existing canonical schema or catalog drift aborts this artifact.

1. `public.activities`
2. `public.activity_events`
3. `public.bank_transfer_payments`
4. `public.entity_comparison_statistics`
5. `public.entity_distribution_statistics`
6. `public.entity_market_statistics`
7. `public.favorite_collection_items`
8. `public.lead_entity_statistics`
9. `public.lead_trend_snapshots`
10. `public.listing_events`
11. `public.listing_favorites`
12. `public.listing_measurement_provenance`
13. `public.listing_publish_tokens`
14. `public.listings_ontology_terms`
15. `public.market_cache_rebuild_logs`
16. `public.market_combination_distribution_statistics`
17. `public.market_combination_statistics`
18. `public.market_comparisons`
19. `public.market_distribution_statistics`
20. `public.market_snapshots`
21. `public.market_statistics`
22. `public.notifications`
23. `public.payment_reviewers`
24. `public.promotion_events`
25. `public.promotion_intelligence_evidence`
26. `public.properties`
27. `public.property_comparisons`
28. `public.property_notes`
29. `public.purchase_request_events`
30. `public.push_subscriptions`
31. `public.sale_listing`
32. `public.saved_analyses`
33. `public.saved_search_alert_deliveries`
34. `public.search_combination_statistics`
35. `public.search_entity_statistics`
36. `public.search_market_statistics`
37. `public.search_ontology_terms`
38. `public.search_trend_snapshots`
39. `public.sinpe_payments`
40. `public.user_favorites`
41. `public.user_recent_activity`
42. `public.verified_users`
43. `public.verified_whatsapp_numbers`
44. `public.whatsapp_otps`
45. `public.favorite_collections`
46. `public.listing_entitlements`
47. `public.saved_searches`
48. `public.search_statistics`
49. `public.user_subscriptions`
50. `public.purchase_requests`
51. `public.listings`

The sole temporarily disabled guard is promotion_events.prevent_promotion_events_delete, verified enabled O before and restored to O before commit. Complete public/auth trigger definitions/states and FK definitions are compared before commit. All 15 protected/reference/auth relations have pre/post content digests and counts. No blanket CASCADE or TRUNCATE.
