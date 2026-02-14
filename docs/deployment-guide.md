# 딱정해 배포 가이드

> Vercel 배포 + Cloudflare 도메인 연결 가이드

---

## 1단계: Git 초기화 & GitHub 푸시

### 1-1. .gitignore 생성

```bash
# 프로젝트 루트에서 실행
cat > .gitignore << 'EOF'
# dependencies
node_modules/
.pnp
.pnp.js

# next.js
.next/
out/

# env files
.env
.env.local
.env.*.local

# debug
npm-debug.log*

# misc
.DS_Store
*.tsbuildinfo
next-env.d.ts
EOF
```

### 1-2. Git 초기화 & 커밋

```bash
git init
git add .
git commit -m "feat: 딱정해 v1.0 - AI 기반 모임 장소 추천"
```

### 1-3. GitHub 레포 생성 & 푸시

```bash
# GitHub에서 새 레포 생성 후 (https://github.com/new)
git remote add origin https://github.com/YOUR_USERNAME/ddakjunghae.git
git branch -M main
git push -u origin main
```

---

## 2단계: Vercel 배포

### 2-1. Vercel 가입 & 프로젝트 연결

1. [vercel.com](https://vercel.com) 접속 → GitHub 계정으로 로그인
2. **"Add New Project"** 클릭
3. GitHub 레포 `ddakjunghae` 선택 → **Import**
4. Framework: **Next.js** 자동 감지됨 → 그대로 진행

### 2-2. 환경변수 설정 ⚠️ 중요

Vercel 프로젝트 설정에서 **Environment Variables** 탭으로 이동하여 아래 6개 추가:

| Key | 용도 |
|-----|------|
| `NAVER_CLIENT_ID` | 네이버 검색 API |
| `NAVER_CLIENT_SECRET` | 네이버 검색 API |
| `NAVER_CLOUD_CLIENT_ID` | 네이버 Cloud 지도/Geocoding |
| `NAVER_CLOUD_CLIENT_SECRET` | 네이버 Cloud 지도/Geocoding |
| `ODSAY_API_KEY` | ODsay 대중교통 API |
| `KAKAO_REST_API_KEY` | 카카오 장소 검색 API |

> ⚠️ `.env.local`의 값을 그대로 복사하세요. Production/Preview/Development 모두 체크.

### 2-3. 배포

1. 환경변수 설정 후 **"Deploy"** 클릭
2. 빌드 완료까지 약 1~2분 대기
3. 배포 완료! `https://ddakjunghae.vercel.app` 형태의 URL 생성

### 2-4. API 도메인 허용 설정

배포 후 API 호출이 실패하면 각 API 콘솔에서 **배포 도메인을 허용**해야 합니다:

- **Naver Cloud**: `console.ncloud.com` → Application → Web 서비스 URL에 Vercel 도메인 추가
- **ODsay**: `lab.odsay.com` → 앱 설정 → 도메인 추가
- **Kakao**: `developers.kakao.com` → 앱 → 플랫폼 → Web → 사이트 도메인 추가

---

## 3단계: 커스텀 도메인 연결 (선택)

### 3-1. Cloudflare에서 도메인 구매

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Domain Registration** → **Register**
2. 원하는 도메인 검색 (예: `ddakjunghae.com`, `meetpoint.kr`)
3. 결제 후 도메인 등록 완료

### 3-2. Vercel에 커스텀 도메인 추가

1. Vercel 프로젝트 → **Settings** → **Domains**
2. 구매한 도메인 입력 (예: `ddakjunghae.com`)
3. Vercel이 DNS 레코드 안내 표시

### 3-3. Cloudflare DNS 설정

Cloudflare 대시보드 → DNS → 레코드 추가:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | `@` | `cname.vercel-dns.com` | DNS only (회색구름) |
| CNAME | `www` | `cname.vercel-dns.com` | DNS only (회색구름) |

> ⚠️ **Proxy를 반드시 "DNS only" (회색 구름)** 으로 설정하세요. 주황 구름(Proxied)이면 SSL 충돌이 발생합니다.

### 3-4. SSL 확인

- Vercel이 자동으로 Let's Encrypt SSL 인증서 발급
- 약 5~10분 후 `https://ddakjunghae.com` 접속 확인

---

## 배포 후 체크리스트

- [ ] 메인 페이지 렌더링 확인
- [ ] 역 검색 자동완성 동작 확인
- [ ] 중간지점 계산 정상 동작
- [ ] 네이버 지도 길찾기 링크 정상 동작
- [ ] 모바일 반응형 확인
- [ ] API 도메인 허용 설정 완료

---

## 재배포

코드 수정 후 GitHub에 push하면 **자동으로 재배포**됩니다:

```bash
git add .
git commit -m "fix: 수정 내용"
git push
```

Vercel 대시보드에서 배포 상태를 실시간 확인할 수 있습니다.
