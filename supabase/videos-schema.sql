-- Videos table for AI video generation features (Seedance / KIE).
-- Conventions mirror public.images in supabase/database.sql.
-- Run this in the Supabase SQL editor on the live database.

-- ===== videos =====

CREATE TABLE IF NOT EXISTS public.videos (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  title text,                                  -- optional user-facing title (mirrors images.title)
  prompt text,                                 -- final English prompt sent to KIE
  source_image_url text,                       -- first_frame_url passed to Seedance (image-to-video)
  video_url text,                              -- final mp4 R2 URL (NULL until callback)
  thumbnail_url text,                          -- for now: same as source_image_url
  status text NOT NULL DEFAULT 'pending'::text
    CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text])),
  effect_type text NOT NULL DEFAULT 'ai-kiss'::text,  -- e.g. 'ai-kiss', matches /video/<slug>
  preset_id text,                              -- e.g. 'soft-kiss'
  duration integer NOT NULL DEFAULT 4,
  resolution text NOT NULL DEFAULT '480p'::text,
  aspect_ratio text NOT NULL DEFAULT '9:16'::text,
  generate_audio boolean NOT NULL DEFAULT true,
  file_format text NOT NULL DEFAULT 'mp4'::text
    CHECK (file_format = ANY (ARRAY['mp4'::text, 'mov'::text, 'webm'::text])),
  file_size integer,
  cost integer NOT NULL DEFAULT 100,           -- credits charged per generation
  external_task_id text,                       -- KIE taskId (mirrors images.external_task_id)
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT videos_pkey PRIMARY KEY (id),
  CONSTRAINT videos_external_task_id_unique UNIQUE (external_task_id),
  CONSTRAINT videos_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public.user_profiles(id)
);

CREATE INDEX IF NOT EXISTS videos_user_id_created_at_idx
  ON public.videos (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS videos_external_task_id_idx
  ON public.videos (external_task_id);

CREATE INDEX IF NOT EXISTS videos_processing_idx
  ON public.videos (status)
  WHERE status = ANY (ARRAY['pending'::text, 'processing'::text]);

-- updated_at is maintained by the shared public.handle_updated_at() trigger
-- function (already defined in this project, used by images / user_profiles /
-- orders / subscriptions). We just attach it to videos here.

DROP TRIGGER IF EXISTS handle_updated_at ON public.videos;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.videos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- NOTE: user_profiles.credits is automatically kept in sync by the existing
-- public.update_user_credits() trigger on credit_transactions. Server-side
-- routes only INSERT into credit_transactions (with positive `amount` for
-- refunds, negative for usage) — never manually UPDATE user_profiles.credits.

-- ===== Add video_id link to credit_transactions =====
-- Mirrors the existing image_id pattern. Nullable so existing image/order
-- transactions stay valid.

ALTER TABLE public.credit_transactions
  ADD COLUMN IF NOT EXISTS video_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'credit_transactions_video_id_fkey'
  ) THEN
    ALTER TABLE public.credit_transactions
      ADD CONSTRAINT credit_transactions_video_id_fkey
      FOREIGN KEY (video_id) REFERENCES public.videos(id);
  END IF;
END$$;

-- ===== Row Level Security =====
-- (Apply only if your other tables in this project also use RLS; skip otherwise.)

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own videos" ON public.videos;
CREATE POLICY "Users can view their own videos"
  ON public.videos
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role bypasses RLS automatically; server-side routes that use
-- createServiceClient() do not need additional policies.

-- ===== deduct_credits_for_video (mirror of deduct_credits_for_image) =====
-- Atomic: check credits → INSERT pending videos row → INSERT usage txn.
-- Returns jsonb { success, video_id?, credits_deducted?, remaining_credits?,
-- message?, required?, available? }.
-- Caller then submits to KIE and UPDATEs videos.external_task_id + status.

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
AS $$
DECLARE
  user_credits INTEGER;
  new_video_id UUID;
BEGIN
  SELECT credits INTO user_credits
  FROM public.user_profiles
  WHERE id = user_uuid;

  IF user_credits IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'User profile not found'
    );
  END IF;

  IF user_credits < credits_to_deduct THEN
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
    'mp4', jsonb_build_object('provider', 'kie-seedance-2-fast')
  )
  RETURNING id INTO new_video_id;

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

  RETURN jsonb_build_object(
    'success', true,
    'video_id', new_video_id,
    'credits_deducted', credits_to_deduct,
    'remaining_credits', user_credits - credits_to_deduct
  );
END;
$$;
