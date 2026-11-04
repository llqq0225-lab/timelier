# TIMELIER 쇼핑몰

DA WATCH와 같은 기능, 버건디·크림 디자인. **DA WATCH와 완전히 따로** 운영돼요 (DB·저장소·배포 모두 별도).

## 처음 설치 (순서대로)

### 1. Supabase — 새 프로젝트
1. supabase.com → **New project** (이름 `timelier`, Region: Seoul)
2. SQL Editor → `TIMELIER_DB.sql` 전체 붙여넣고 **Run** (딱 한 번)
3. Authentication → Users → **Add user** (관리자 이메일·비밀번호, Auto Confirm 체크)
4. SQL Editor에서:
   `insert into admins (user_id) select id from auth.users where email = '관리자이메일';`
5. Project Settings → API Keys 에서 **Project URL**, **Publishable key**(sb_publishable_…) 복사

### 2. GitHub — 새 저장소 `timelier-shop`
파일이 100개가 넘어서 두 번에 나눠 올려요.
1. 새 저장소 만들기 → uploading an existing file
2. `timelier-part1.zip` 푼 내용물 전부 끌어다 놓기 → Commit
3. 다시 Add file → Upload files → `timelier-part2.zip` 푼 내용물 전부 → Commit

### 3. Vercel — 새 프로젝트
1. Add New → Project → `timelier-shop` Import
2. Environment Variables
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Publishable key
3. Deploy

### 4. 관리자 설정
`주소/admin` → 배너·사이트 설정(배너 3장, 카톡 링크, 계좌, 사업자 정보) → 브랜드 → 상품 등록

## 색상 바꾸고 싶을 때
`app/globals.css` 맨 위 색상표 (wine = 버건디, cream = 크림)
