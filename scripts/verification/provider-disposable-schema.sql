-- Test-only provider-specific submission records; no external financial integration.
CREATE TABLE public.bank_transfer_payments(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),purchase_request_id uuid REFERENCES public.purchase_requests(id),
 user_id uuid REFERENCES auth.users(id),amount numeric,currency text,bank_name text,account_reference text,
 transfer_reference text,sender_name text,sender_account_last4 text,payment_date timestamptz,status text,created_at timestamptz DEFAULT now()
);
