import { createClient } from '@supabase/supabase-js';

/**
 * 손님 화면용: 로그인 정보 없이 공개 데이터만 읽음.
 * 쿠키를 안 쓰니 페이지를 미리 만들어 저장(캐시)해둘 수 있어서 훨씬 빠름.
 */
export function createPublicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
