ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS share_phone boolean NOT NULL DEFAULT false;