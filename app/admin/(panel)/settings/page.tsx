import SettingsForm, { type Banner } from '@/components/admin/SettingsForm';
import { createClient } from '@/lib/supabase/server';
import { getSettings } from '@/lib/types';

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const supabase = await createClient();
  const [settings, { data: banners }] = await Promise.all([
    getSettings(supabase),
    supabase.from('banners').select('*').eq('placement', 'hero').order('sort_order').order('id').limit(5),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">배너 · 사이트 설정</h1>
      {saved && <p className="mb-6 max-w-3xl bg-green-50 text-green-800 text-sm p-3 border border-green-200">저장됐어요.</p>}
      <SettingsForm settings={settings} banners={(banners ?? []) as Banner[]} />
    </div>
  );
}
