BEGIN;

-- Apply before enabling paid trials. Trial credits never enter the general wallet.
CREATE TABLE public.paid_video_trials (
  user_id uuid PRIMARY KEY REFERENCES public.user_profiles(id),
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id),
  initial_credits integer NOT NULL CHECK (initial_credits IN (100, 200)),
  remaining_credits integer NOT NULL CHECK (remaining_credits >= 0 AND remaining_credits <= initial_credits),
  expires_at timestamptz NOT NULL
);
ALTER TABLE public.paid_video_trials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their video trial" ON public.paid_video_trials
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
GRANT SELECT ON public.paid_video_trials TO authenticated;
GRANT ALL ON public.paid_video_trials TO service_role;

CREATE TABLE public.subscription_payments (
  payment_id text PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id),
  is_trial boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.subscription_payments TO service_role;

-- Called only after server-side verification of the signed payment + provider snapshot.
CREATE OR REPLACE FUNCTION public.fulfill_paid_subscription(
  p_order_id uuid, p_payment_id text, p_external_order_id text,
  p_is_trial boolean, p_period_start timestamptz, p_period_end timestamptz
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  o public.orders%ROWTYPE;
  p public.payment_plans%ROWTYPE;
  sub_id uuid;
  trial_credits integer;
  trial_price numeric;
  trial_days integer;
BEGIN
  SELECT * INTO STRICT o FROM public.orders WHERE id = p_order_id;
  PERFORM 1 FROM public.user_profiles WHERE id = o.user_id FOR UPDATE;
  IF EXISTS (SELECT 1 FROM public.subscription_payments WHERE payment_id = p_payment_id) THEN RETURN; END IF;
  SELECT * INTO STRICT p FROM public.payment_plans WHERE id = o.plan_id;
  IF p.plan_type <> 'subscription' OR p.currency <> 'USD' OR p_payment_id = '' OR p_external_order_id = ''
    OR p_period_end <= p_period_start THEN RAISE EXCEPTION 'Invalid subscription payment'; END IF;
  IF p_is_trial THEN
    CASE p.name
      WHEN 'Basic Monthly' THEN trial_credits := 100; trial_price := 0.99; trial_days := 1;
      WHEN 'Max Monthly' THEN trial_credits := 200; trial_price := 1.99; trial_days := 3;
      ELSE RAISE EXCEPTION 'Plan has no paid trial';
    END CASE;
    IF o.amount <> trial_price OR o.credits_awarded <> trial_credits
      OR p_period_end > p_period_start + make_interval(days => trial_days) THEN
      RAISE EXCEPTION 'Trial order does not match offer';
    END IF;
    IF EXISTS (SELECT 1 FROM public.subscription_payments WHERE order_id = o.id AND NOT is_trial) THEN
      RAISE EXCEPTION 'Trial receipt arrived after regular payment';
    END IF;
    IF EXISTS (SELECT 1 FROM public.paid_video_trials WHERE user_id = o.user_id) THEN
      RAISE EXCEPTION 'Paid trial already used';
    END IF;
  END IF;
  SELECT id INTO sub_id FROM public.subscriptions WHERE external_subscription_id = p_external_order_id AND user_id = o.user_id LIMIT 1;
  IF sub_id IS NULL THEN
    INSERT INTO public.subscriptions(user_id, plan_id, status, current_period_start, current_period_end, credits_included, external_subscription_id)
    VALUES(o.user_id, p.id, 'active', p_period_start, p_period_end, CASE WHEN p_is_trial THEN trial_credits ELSE p.credits END, p_external_order_id)
    RETURNING id INTO sub_id;
  ELSE
    UPDATE public.subscriptions SET status = 'active', current_period_start = p_period_start,
      current_period_end = p_period_end, credits_included = CASE WHEN p_is_trial THEN trial_credits ELSE p.credits END,
      updated_at = now() WHERE id = sub_id AND current_period_end <= p_period_end;
  END IF;
  INSERT INTO public.subscription_payments(payment_id, order_id, is_trial) VALUES(p_payment_id, o.id, p_is_trial);
  IF p_is_trial THEN
    INSERT INTO public.paid_video_trials VALUES(o.user_id, sub_id, trial_credits, trial_credits, p_period_end);
  ELSE
    UPDATE public.paid_video_trials SET remaining_credits = 0 WHERE user_id = o.user_id;
    INSERT INTO public.credit_transactions(user_id, amount, transaction_type, description, order_id)
      VALUES(o.user_id, p.credits, 'purchase', p.name || ' payment ' || p_payment_id, o.id);
  END IF;
  UPDATE public.orders SET status = 'completed', subscription_id = sub_id,
    external_order_id = p_external_order_id, external_payment_id = p_payment_id, updated_at = now() WHERE id = o.id;
  UPDATE public.user_profiles SET active_plan_id = p.id, subscription_expires_at = p_period_end, updated_at = now() WHERE id = o.user_id;
END;
$$;
REVOKE ALL ON FUNCTION public.fulfill_paid_subscription(uuid,text,text,boolean,timestamptz,timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fulfill_paid_subscription(uuid,text,text,boolean,timestamptz,timestamptz) TO service_role;

CREATE OR REPLACE FUNCTION public.deduct_credits_for_video(
  user_uuid uuid,
  p_effect_type text,
  p_preset_id text,
  p_prompt text,
  p_source_image_url text,
  p_title text DEFAULT NULL,
  credits_to_deduct integer DEFAULT 100,
  p_duration integer DEFAULT 4,
  p_resolution text DEFAULT '480p',
  p_aspect_ratio text DEFAULT '9:16',
  p_generate_audio boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_credits INTEGER;
  new_video_id UUID;
  trial_credits INTEGER := 0;
  use_trial BOOLEAN := false;
BEGIN
  SELECT credits INTO user_credits
  FROM public.user_profiles
  WHERE id = user_uuid FOR UPDATE;

  IF user_credits IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'User profile not found'
    );
  END IF;

  IF credits_to_deduct <> 100 OR p_duration <> 4 OR p_resolution <> '480p' THEN
    RAISE EXCEPTION 'Unsupported video generation price or format';
  END IF;
  SELECT remaining_credits INTO trial_credits FROM public.paid_video_trials
    WHERE user_id = user_uuid AND expires_at > now() FOR UPDATE;
  use_trial := COALESCE(trial_credits, 0) >= credits_to_deduct;

  IF NOT use_trial AND user_credits < credits_to_deduct THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Insufficient credits',
      'required', credits_to_deduct,
      'available', user_credits
    );
  END IF;

  INSERT INTO public.videos (
    user_id, effect_type, preset_id, title, prompt,
    source_image_url, thumbnail_url, status, cost,
    duration, resolution, aspect_ratio, generate_audio,
    file_format, metadata
  )
  VALUES (
    user_uuid, p_effect_type, p_preset_id, p_title, p_prompt,
    p_source_image_url, p_source_image_url, 'pending', credits_to_deduct,
    p_duration, p_resolution, p_aspect_ratio, p_generate_audio,
    'mp4', jsonb_build_object('provider', 'kie-seedance-2-fast', 'paid_trial', use_trial)
  )
  RETURNING id INTO new_video_id;

  IF use_trial THEN
    UPDATE public.paid_video_trials SET remaining_credits = remaining_credits - credits_to_deduct WHERE user_id = user_uuid;
  ELSE
  INSERT INTO public.credit_transactions (
    user_id, amount, transaction_type, description, video_id
  )
  VALUES (
    user_uuid,
    -credits_to_deduct,
    'usage',
    p_effect_type || ' video — ' || COALESCE(p_title, p_preset_id),
    new_video_id
  );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'video_id', new_video_id,
    'credits_deducted', credits_to_deduct,
    'remaining_credits', user_credits + COALESCE(trial_credits, 0) - credits_to_deduct
  );
END;
$$;

REVOKE ALL ON FUNCTION public.deduct_credits_for_video(uuid,text,text,text,text,text,integer,integer,text,text,boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_credits_for_video(uuid,text,text,text,text,text,integer,integer,text,text,boolean) TO service_role;

-- Provider failures can restore trial credits; failures after a successful KIE
-- generation cannot, since retrying those would create unbounded API costs.
CREATE OR REPLACE FUNCTION public.refund_video_credits(p_video_id uuid, p_reason text, p_provider_charged boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v public.videos%ROWTYPE;
  owner_id uuid;
BEGIN
  SELECT user_id INTO STRICT owner_id FROM public.videos WHERE id = p_video_id;
  PERFORM 1 FROM public.user_profiles WHERE id = owner_id FOR UPDATE;
  SELECT * INTO STRICT v FROM public.videos WHERE id = p_video_id FOR UPDATE;
  IF COALESCE((v.metadata->>'credits_refunded')::boolean, false) THEN RETURN; END IF;
  IF COALESCE((v.metadata->>'paid_trial')::boolean, false) THEN
    IF NOT p_provider_charged THEN
      UPDATE public.paid_video_trials SET remaining_credits = LEAST(initial_credits, remaining_credits + v.cost)
        WHERE user_id = v.user_id AND expires_at > now()
          AND NOT EXISTS (SELECT 1 FROM public.subscription_payments sp JOIN public.orders o ON o.id = sp.order_id
            WHERE o.subscription_id = paid_video_trials.subscription_id AND NOT sp.is_trial);
    END IF;
  ELSE
    INSERT INTO public.credit_transactions(user_id, amount, transaction_type, description, video_id)
      VALUES(v.user_id, v.cost, 'refund', p_reason, v.id);
  END IF;
  UPDATE public.videos SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"credits_refunded":true}'::jsonb WHERE id = v.id;
END;
$$;
REVOKE ALL ON FUNCTION public.refund_video_credits(uuid,text,boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_video_credits(uuid,text,boolean) TO service_role;

COMMIT;
