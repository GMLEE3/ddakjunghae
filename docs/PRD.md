# 딱정해 (DDAKJUNGHAE) PRD
> AI 기반 모임 장소 추천 서비스

---

## 1. 제품 개요

### 비전
**"결정 장애 해결"** - 모임 장소 선정의 고민을 AI가 해결

### 핵심 가치
- 복수 인원의 **중간 지점** 자동 계산
- 모임 성격에 맞는 **맞춤 추천** (회사/친구/연인)
- **도보 거리 기반** 추천 (800m 이내 = 10분)
- 못 고르겠을 때 **룰렛**으로 결정

---

## 2. 타겟 유저

| 유저 타입 | 페인 포인트 | 해결책 |
|----------|-------------|--------|
| 직장인 | 회식 장소 정하기 귀찮음 | 법카 가능 + 룸 있는 곳 추천 |
| 친구 모임 | 다들 다른 곳에서 오는데 어디서 만나지 | 중간 지점 자동 계산 |
| 커플 | 데이트 코스 맨날 고민 | 분위기 좋은 곳 AI 추천 |

---

## 3. 기능 현황

### ✅ 구현 완료

| 기능 | 설명 |
|------|------|
| 역/정류장 자동완성 | 지하철역, 버스정류장 검색 지원 |
| 주소 입력 | 단일/복수 위치 입력 |
| 중간 지점 계산 | 공평한 중간 위치 + 가장 가까운 역 |
| 모임 성격 선택 | 회사/친구/연인 테마 전환 |
| **반경 기반 맛집 검색** | 카카오 API로 800m/1.5km/2km 반경 검색 |
| **도보 거리 표시** | 각 맛집까지 도보 시간(분) + 거리(m) |
| AI 맛집 추천 | 정석/핫플/실속 3가지 타입 |
| 더 추천해줘 | 추가 맛집 로딩 |
| 딱정해 룰렛 | 슬롯머신 스타일 랜덤 선택 |
| 맛집 상세 팝업 | 큰 이미지 + 상세 정보 |
| 네이버 지도/카카오맵 링크 | 클릭 시 지도 앱 이동 |
| 공유 기능 | 링크 복사 + Web Share API |
| **가게 이미지 (개선)** | 네이버 이미지 검색 + 카테고리 폴백 |

### 🚧 구현 필요 (v2)

| 기능 | 우선순위 |
|------|----------|
| 대중교통 기반 중간점 | P1 (ODsay API 키 문제 해결 필요) |
| 네이버 지도 SDK 표시 | P2 |
| 카카오톡 SDK 공유 | P2 |
| 히스토리 저장 | P3 |

---

## 4. 기술 스택

```
Frontend: Next.js 16 (App Router) + TypeScript + Vanilla CSS
Animation: Framer Motion
Backend: Next.js API Routes
AI: Google Gemini API (선택)
External APIs: Kakao Local, Naver Search, Naver Image
```

---

## 5. API 현황

| API | 용도 | 상태 |
|-----|------|------|
| **Kakao Local** | 반경 기반 맛집 검색 + 거리 | ✅ 연동 완료 |
| Naver 이미지검색 | 가게 이미지 | ✅ 연동 완료 |
| Naver 지역검색 | 역/정류장 자동완성 | ✅ 연동 완료 |
| Naver Geocoding | 주소→좌표 | ✅ 연동 완료 |
| ODsay | 대중교통 중간점 | ⚠️ API 키 인증 오류 |
| Gemini AI | 추천 생성 | 🔶 선택 (폴백 있음) |

---

## 6. 환경 변수

```env
# .env.local

# Kakao API (반경 검색)
KAKAO_REST_API_KEY=카카오_REST_API_키

# Naver Developers (검색/이미지)
NAVER_CLIENT_ID=네이버_개발자_클라이언트_ID
NAVER_CLIENT_SECRET=네이버_개발자_시크릿

# Naver Cloud (Geocoding)
NAVER_CLOUD_CLIENT_ID=네이버_클라우드_ID
NAVER_CLOUD_CLIENT_SECRET=네이버_클라우드_시크릿

# ODsay 대중교통 (선택)
ODSAY_API_KEY=ODsay_API_키

# Gemini AI (선택)
GEMINI_API_KEY=제미나이_API_키
```

---

## 7. 주요 파일 구조

```
src/
├── app/
│   ├── api/
│   │   ├── search/      # 맛집 검색 (Kakao 반경 검색)
│   │   ├── autocomplete/ # 역/정류장 자동완성
│   │   ├── geocode/     # 주소→좌표
│   │   └── midpoint/    # 중간지점 계산
│   └── page.tsx         # 메인 페이지
├── lib/
│   ├── kakao.ts         # 카카오 Local API
│   ├── naver.ts         # 네이버 검색/이미지 API
│   └── odsay.ts         # ODsay 대중교통 API
└── components/
    └── result/          # 추천 결과 UI
```

---

## 8. 다음 단계

### 즉시 (배포 전)
- [ ] Vercel 배포
- [ ] 도메인 연결
- [ ] 모바일 테스트

### 이후 (v2)
- [ ] ODsay API 키 문제 해결 (대중교통 중간점)
- [ ] 네이버 지도 SDK
- [ ] 카카오톡 공유 SDK
