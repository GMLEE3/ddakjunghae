# 네이버 API 연동 가이드
> 딱정해 서비스를 위한 네이버 API 설정 방법

---

## ⚠️ 중요: 두 가지 플랫폼 필요

| 플랫폼 | 제공 API | 용도 |
|--------|---------|------|
| **Naver Cloud Platform** | Maps, Geocoding | 지도 표시, 주소→좌표 |
| **Naver Developers** | 지역 검색 | 맛집 검색 |

---

## 1. Naver Cloud Platform (지도/Geocoding)

### 1.1 가입 및 콘솔 접속
1. **[Naver Cloud Platform](https://www.ncloud.com/)** 접속
2. 회원가입 (네이버 계정 사용)
3. `콘솔 → AI·NAVER API → Application → Application 등록`

### 1.2 API 선택
| API | 용도 | 무료 할당량 |
|-----|------|------------|
| ✅ Maps (Web Dynamic Map) | 지도 표시 | 무제한 |
| ✅ Geocoding | 주소→좌표 | 3,000건/월 |

### 1.3 서비스 환경 등록
```
Web 서비스 URL: http://localhost:3000
```

### 1.4 인증 정보 확인
- **Client ID**: 지도 SDK에서 사용 (X-NCP-APIGW-API-KEY-ID)
- **Client Secret**: 서버에서 사용 (X-NCP-APIGW-API-KEY)

---

## 2. Naver Developers (지역 검색 API)

### 2.1 가입 및 애플리케이션 등록
1. **[Naver Developers](https://developers.naver.com/)** 접속
2. 로그인 → `Application → 애플리케이션 등록`

### 2.2 API 선택
| API | 용도 | 일일 호출 한도 |
|-----|------|--------------|
| ✅ 검색 (지역) | 맛집 검색 | 25,000건/일 |

### 2.3 환경 설정
```
사용 API: 검색
환경 추가: WEB 설정 → http://localhost:3000
```

### 2.4 인증 정보 확인
- **Client ID**: `X-Naver-Client-Id`
- **Client Secret**: `X-Naver-Client-Secret`

---

## 3. 환경 변수 설정

### 3.1 파일 생성
```bash
cd /Users/gmlee/Desktop/WORKSPACE/DDAKJUNGHAE
cp .env.local.example .env.local
```

### 3.2 키 입력
```env
# .env.local

# Naver Developers (지역 검색용)
NAVER_CLIENT_ID=Naver_Developers에서_발급받은_Client_ID
NAVER_CLIENT_SECRET=Naver_Developers에서_발급받은_Client_Secret

# (선택) Naver Cloud Platform (지도용 - 추후 지도 기능 추가 시)
# NAVER_CLOUD_CLIENT_ID=Naver_Cloud에서_발급받은_ID
# NAVER_CLOUD_CLIENT_SECRET=Naver_Cloud에서_발급받은_Secret
```

> **참고**: 현재 앱은 **Naver Developers의 지역 검색 API**만 사용합니다.  
> 지도 표시 기능은 아직 미구현 상태입니다.

---

## 4. 개발 서버 재시작

```bash
# 기존 서버 종료 (Ctrl+C)
npm run dev
```

---

## 5. 연동 테스트

### 5.1 검색 테스트
1. 앱 실행 후 주소 입력 (예: `강남역`)
2. 모임 성격 선택 → 추천 받기
3. **실제 맛집 데이터**가 표시되면 성공!

### 5.2 확인 방법
- 목업 데이터: 식당 이름에 `당진점`, `중간지점` 등 포함
- 실제 데이터: 네이버 검색 결과와 동일

---

## 6. 문제 해결

| 에러 | 원인 | 해결 |
|------|------|------|
| `401 Unauthorized` | API 키 오류 | `.env.local` 키 재확인 |
| `403 Forbidden` | URL 미등록 | 개발자센터에서 localhost 등록 |
| `429 Too Many Requests` | 할당량 초과 | 다음 날 재시도 |
| 목업 데이터만 나옴 | 키 미인식 | 서버 재시작 필요 |

---

## 7. 참고 링크

- [Naver Developers 검색 API 문서](https://developers.naver.com/docs/serviceapi/search/local/local.md)
- [Naver Cloud Platform Maps API 문서](https://api.ncloud-docs.com/docs/ai-naver-mapsstaticmap)
