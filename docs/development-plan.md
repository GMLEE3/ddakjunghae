# 개발 상세 계획서 (Development Plan)

> PRD/MVP에 종속된 상세 개발 계획

---

## 현재 단계: MVP 배포 준비

---

## 1. 완료된 개발 항목

### 프론트엔드
- [x] 주소 입력 컴포넌트 (`LocationInput`)
- [x] 모임 성격 선택 (`ContextSelector`)
- [x] 맛집 추천 카드 (`RecommendCard`)
- [x] 상세 팝업 모달 (`RestaurantDetailModal`)
- [x] 중간 지점 표시 (`MidpointDisplay`)
- [x] 룰렛 기능 (`GravityRoulette`)
- [x] 가게 이미지 표시

### 백엔드 (API Routes)
- [x] `/api/geocode` - 주소→좌표 변환
- [x] `/api/midpoint` - 중간 지점 계산
- [x] `/api/search` - 맛집 검색
- [x] `/api/recommend` - AI 추천 생성

### API 연동
- [x] 네이버 지역 검색 API
- [x] 네이버 이미지 검색 API
- [x] 네이버 Geocoding API

---

## 2. 진행 예정 항목

### 배포 (P0)
- [ ] Vercel 배포 설정
- [ ] 도메인 연결
- [ ] 네이버 API URL 등록 (실제 도메인)
- [ ] 환경 변수 설정

### 테스트 (P0)
- [ ] 실제 API 데이터 검증
- [ ] 모바일 반응형 확인
- [ ] 다양한 주소 입력 테스트

### 개선 (P1)
- [ ] 대중교통 기반 중간점 (TMAP API)
- [ ] 이미지 해상도 개선
- [ ] 룰렛 버그 수정

### 추가 기능 (P2)
- [ ] 네이버 지도 SDK 표시
- [ ] 카카오톡 SDK 공유
- [ ] Gemini AI 프롬프트 최적화

---

## 3. 기술 부채

| 항목 | 설명 | 우선순위 |
|------|------|----------|
| 중간점 알고리즘 | 직선거리 기반 → 대중교통 기반 | P1 |
| 이미지 캐싱 | 이미지 검색 결과 캐싱 필요 | P2 |
| 타입 안전성 | 일부 `any` 타입 제거 필요 | P3 |

---

## 4. 파일별 상태

| 파일 | 라인 수 | 상태 |
|------|--------|------|
| `src/app/page.tsx` | ~470 | ⚠️ 분리 고려 |
| `src/app/api/midpoint/route.ts` | ~270 | ✅ OK |
| `src/components/result/RecommendCard.tsx` | ~230 | ✅ OK |
| `src/components/roulette/GravityRoulette.tsx` | ~360 | ✅ OK |

---

## 5. 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-01-11 | 가게 이미지 검색 기능 추가 |
| 2026-01-11 | 중간점 알고리즘 개선 (공평성 기준) |
| 2026-01-10 | 네이버 API 연동 완료 |
| 2026-01-10 | 상세 모달 + 공유 기능 추가 |
