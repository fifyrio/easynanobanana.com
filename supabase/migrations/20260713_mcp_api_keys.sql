-- MCP / programmatic access foundation
-- 1) api_keys: credentials for MCP + CLI + REST v1 access
-- 2) deduct_credits_atomic: race-free credit deduction (locks the profile row)

CREATE TABLE IF NOT EXISTS public.api_keys (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  key_hash      text NOT NULL UNIQUE,   -- sha256 of the plaintext key; plaintext shown once
  key_prefix    text NOT NULL,          -- first chars, e.g. "enb_live_ab12", for display
  name          text,
  last_used_at  timestamptz,
  revoked_at    timestamptz,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON public.api_keys(key_hash);

-- Atomic credit deduction. Inserts a negative credit_transactions row inside a
-- row lock so concurrent calls cannot overspend. The existing trigger on
-- credit_transactions keeps user_profiles.credits in sync.
CREATE OR REPLACE FUNCTION public.deduct_credits_atomic(
  p_user_id     uuid,
  p_amount      int,
  p_type        text,
  p_description text
) RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance int;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  SELECT credits INTO v_balance
  FROM public.user_profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;

  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'insufficient_credits';
  END IF;

  INSERT INTO public.credit_transactions (user_id, amount, transaction_type, description)
  VALUES (p_user_id, -p_amount, p_type, p_description);

  RETURN v_balance - p_amount;
END;
$$;
