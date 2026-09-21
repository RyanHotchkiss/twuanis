BEGIN;

-- Fail instead of waiting indefinitely for production locks.
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- Build the membership index before taking the stronger dictionary lock.
CREATE INDEX listings_ontology_terms_term_listing_idx
    ON public.listings_ontology_terms USING btree
    (ontology_term_id, listing_id);

ALTER TABLE public.ontology_terms
    ADD CONSTRAINT ontology_terms_geography_level_check
    CHECK (
        CASE term_type
            WHEN 'province' THEN level IS NOT NULL AND level = 1
            WHEN 'canton'   THEN level IS NOT NULL AND level = 2
            WHEN 'district' THEN level IS NOT NULL AND level = 3
            ELSE TRUE
        END
    ),
    ADD CONSTRAINT ontology_terms_geography_code_check
    CHECK (
        CASE term_type
            WHEN 'province' THEN
                official_code IS NOT NULL
                AND official_code ~ '^[0-9]{1}$'
            WHEN 'canton' THEN
                official_code IS NOT NULL
                AND official_code ~ '^[0-9]{3}$'
            WHEN 'district' THEN
                official_code IS NOT NULL
                AND official_code ~ '^[0-9]{5}$'
            ELSE TRUE
        END
    );

CREATE UNIQUE INDEX ontology_terms_geography_official_code_uidx
    ON public.ontology_terms USING btree (official_code)
    WHERE term_type IN ('province', 'canton', 'district');

COMMIT;
