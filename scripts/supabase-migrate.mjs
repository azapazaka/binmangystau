const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'your_project_ref_here';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || 'your_access_token_here';

async function runSQL(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SQL failed (${res.status}): ${text}`);
  }
  return res.json();
}

const MIGRATION_SQL = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('road', 'light', 'trash', 'traffic', 'other')),
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  address text,
  district text,
  zone_key text,
  zone_coefficient double precision NOT NULL DEFAULT 1,
  report_count integer NOT NULL DEFAULT 1,
  severity double precision NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
  representative_photo_url text,
  priority_score double precision NOT NULL DEFAULT 0,
  priority_reason text,
  top_factors jsonb NOT NULL DEFAULT '[]'::jsonb,
  priority_source_report_id uuid,
  ai_validation_status text NOT NULL DEFAULT 'unavailable' CHECK (ai_validation_status IN ('valid', 'invalid', 'uncertain', 'unavailable')),
  effective_category text CHECK (effective_category IN ('road', 'light', 'trash', 'traffic', 'other')),
  effective_visual_severity text CHECK (effective_visual_severity IN ('low', 'medium', 'high')),
  moderator_review_status text NOT NULL DEFAULT 'pending' CHECK (moderator_review_status IN ('pending', 'confirmed', 'corrected', 'invalidated')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id uuid REFERENCES public.clusters(id) ON DELETE SET NULL,
  user_category text NOT NULL CHECK (user_category IN ('road', 'light', 'trash', 'traffic', 'other')),
  description text,
  photo_url text NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  address text,
  district text,
  severity double precision NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
  ai_category text CHECK (ai_category IN ('road', 'light', 'trash', 'traffic', 'other')),
  ai_confidence double precision,
  ai_tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  ai_validation_status text NOT NULL DEFAULT 'unavailable' CHECK (ai_validation_status IN ('valid', 'invalid', 'uncertain', 'unavailable')),
  ai_needs_review boolean NOT NULL DEFAULT false,
  ai_reason text,
  ai_visual_severity text CHECK (ai_visual_severity IN ('low', 'medium', 'high')),
  ai_deep_analysis jsonb,
  ai_deep_analyzed_at timestamptz,
  ai_raw jsonb,
  ai_priority_score double precision NOT NULL DEFAULT 0,
  ai_priority_reason text,
  ai_top_factors jsonb NOT NULL DEFAULT '[]'::jsonb,
  review_status text NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'confirmed', 'corrected', 'invalidated')),
  ai_correct boolean,
  expert_category text CHECK (expert_category IN ('road', 'light', 'trash', 'traffic', 'other')),
  expert_visual_severity text CHECK (expert_visual_severity IN ('low', 'medium', 'high')),
  review_note text,
  reviewed_by text,
  reviewed_at timestamptz,
  human_real_votes integer NOT NULL DEFAULT 0,
  human_fake_votes integer NOT NULL DEFAULT 0,
  human_votes_total integer NOT NULL DEFAULT 0,
  human_confirmation_status text NOT NULL DEFAULT 'pending' CHECK (human_confirmation_status IN ('pending', 'confirmed_real', 'confirmed_fake', 'disputed')),
  human_last_voted_at timestamptz,
  submitted_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.clusters
  DROP CONSTRAINT IF EXISTS clusters_priority_source_report_id_fkey;
ALTER TABLE public.clusters
  ADD CONSTRAINT clusters_priority_source_report_id_fkey
  FOREIGN KEY (priority_source_report_id) REFERENCES public.reports(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id uuid NOT NULL REFERENCES public.clusters(id) ON DELETE CASCADE,
  old_status text CHECK (old_status IN ('open', 'in_progress', 'closed')),
  new_status text NOT NULL CHECK (new_status IN ('open', 'in_progress', 'closed')),
  changed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  district text,
  bio text,
  avatar_path text,
  position text,
  department text,
  categories text[] NOT NULL DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.report_human_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verdict text NOT NULL CHECK (verdict IN ('real', 'fake')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT report_human_votes_report_id_user_id_key UNIQUE (report_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_clusters_category ON public.clusters(category);
CREATE INDEX IF NOT EXISTS idx_clusters_status ON public.clusters(status);
CREATE INDEX IF NOT EXISTS idx_clusters_created_at ON public.clusters(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clusters_priority_score ON public.clusters(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_reports_cluster_id ON public.reports(cluster_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_category ON public.reports(user_category);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_ai_validation_status ON public.reports(ai_validation_status);
CREATE INDEX IF NOT EXISTS idx_reports_ai_priority_score ON public.reports(ai_priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_reports_review_status ON public.reports(review_status);
CREATE INDEX IF NOT EXISTS idx_report_human_votes_report_id ON public.report_human_votes(report_id);
CREATE INDEX IF NOT EXISTS idx_report_human_votes_user_id ON public.report_human_votes(user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_clusters_updated_at ON public.clusters;
CREATE TRIGGER update_clusters_updated_at BEFORE UPDATE ON public.clusters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_reports_updated_at ON public.reports;
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_report_human_votes_updated_at ON public.report_human_votes;
CREATE TRIGGER update_report_human_votes_updated_at BEFORE UPDATE ON public.report_human_votes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.sync_public_user_from_auth()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', COALESCE(NEW.raw_user_meta_data->>'role', 'citizen'))
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, role = EXCLUDED.role;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT OR UPDATE ON auth.users FOR EACH ROW EXECUTE FUNCTION public.sync_public_user_from_auth();

CREATE OR REPLACE FUNCTION public.create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_new_user();

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_human_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_select_all ON public.users;
CREATE POLICY users_select_all ON public.users FOR SELECT USING (true);
DROP POLICY IF EXISTS users_insert_own ON public.users;
CREATE POLICY users_insert_own ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS users_update_own ON public.users;
CREATE POLICY users_update_own ON public.users FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS clusters_select_all ON public.clusters;
CREATE POLICY clusters_select_all ON public.clusters FOR SELECT USING (true);
DROP POLICY IF EXISTS clusters_insert_auth ON public.clusters;
CREATE POLICY clusters_insert_auth ON public.clusters FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS clusters_update_auth ON public.clusters;
CREATE POLICY clusters_update_auth ON public.clusters FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS reports_select_all ON public.reports;
CREATE POLICY reports_select_all ON public.reports FOR SELECT USING (true);
DROP POLICY IF EXISTS reports_insert_auth ON public.reports;
CREATE POLICY reports_insert_auth ON public.reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS reports_update_auth ON public.reports;
CREATE POLICY reports_update_auth ON public.reports FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS status_history_select_all ON public.status_history;
CREATE POLICY status_history_select_all ON public.status_history FOR SELECT USING (true);
DROP POLICY IF EXISTS status_history_insert_auth ON public.status_history;
CREATE POLICY status_history_insert_auth ON public.status_history FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS user_profiles_select_all ON public.user_profiles;
CREATE POLICY user_profiles_select_all ON public.user_profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS user_profiles_insert_own ON public.user_profiles;
CREATE POLICY user_profiles_insert_own ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS user_profiles_update_own ON public.user_profiles;
CREATE POLICY user_profiles_update_own ON public.user_profiles FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS report_human_votes_select_all ON public.report_human_votes;
CREATE POLICY report_human_votes_select_all ON public.report_human_votes FOR SELECT USING (true);
DROP POLICY IF EXISTS report_human_votes_insert_auth ON public.report_human_votes;
CREATE POLICY report_human_votes_insert_auth ON public.report_human_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS report_human_votes_update_own ON public.report_human_votes;
CREATE POLICY report_human_votes_update_own ON public.report_human_votes FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Report images are publicly readable" ON storage.objects;
CREATE POLICY "Report images are publicly readable" ON storage.objects FOR SELECT USING (bucket_id = 'reports');
DROP POLICY IF EXISTS "Authenticated users can upload report images" ON storage.objects;
CREATE POLICY "Authenticated users can upload report images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'reports'
  AND auth.role() = 'authenticated'
);
`;

async function main() {
  console.log('Running CityPulse migration on project', PROJECT_REF);
  const result = await runSQL(MIGRATION_SQL);
  console.log('Migration complete:', JSON.stringify(result, null, 2));
}

main().catch(e => { console.error(e.message); process.exit(1); });
