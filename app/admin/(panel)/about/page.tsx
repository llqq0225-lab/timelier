import AboutEditor from '@/components/admin/AboutEditor';
import { createClient } from '@/lib/supabase/server';
import { parseAbout, parseStyle } from '@/lib/about';

export default async function AdminAbout() {
  const supabase = await createClient();
  const { data: rows } = await supabase.from('site_settings').select('key, value').in('key', ['about_blocks', 'about_style', 'wm_on']);
  const get = (k: string) => rows?.find((r) => r.key === k)?.value as string | undefined;
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">메종 이야기 (About)</h1>
      <p className="text-sm text-neutral-500 mb-6">
        사이트의 <b>The Maison</b> 페이지예요. 블록마다 사진과 글을 넣고, ▲▼로 순서를 바꾸고, 맨 아래에서 블록을 추가할 수 있어요. 빈 사진 블록은 사이트에 안 나와요.
      </p>
      <AboutEditor initial={parseAbout(get('about_blocks'))} initialStyle={parseStyle(get('about_style'))} wmOn={get('wm_on') === 'Y'} />
    </div>
  );
}
