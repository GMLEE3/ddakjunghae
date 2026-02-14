# 카카오 로컬 API 설정 가이드

카카오 로컬 API를 사용하여 좌표 기반 반경 검색으로 근처 맛집을 찾는 기능을 구현합니다.

## 요금

- **무료**: 일 100,000건
- 초과 시 건당 0.6원

---

## 1단계: 카카오 개발자 계정 생성

1. [Kakao Developers](https://developers.kakao.com/) 접속
2. 우측 상단 **로그인** → 카카오 계정으로 로그인
3. 로그인 후 **내 애플리케이션** 메뉴 진입

---

## 2단계: 애플리케이션 생성

1. **애플리케이션 추가하기** 클릭
2. 정보 입력:
   - **앱 이름**: `딱정해` (또는 원하는 이름)
   - **사업자명**: 개인 이름 또는 회사명
3. **저장** 클릭

---

## 3단계: REST API 키 확인

1. 생성된 앱 클릭
2. **앱 키** 섹션에서 **REST API 키** 복사
   
   ```
   예시: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
   ```

---

## 4단계: 플랫폼 등록 (선택)

> 로컬 개발 시에는 생략 가능

1. **플랫폼** 메뉴 클릭
2. **Web** → **사이트 도메인 등록**
   - 개발: `http://localhost:3000`
   - 배포: `https://your-domain.com`

---

## 5단계: 환경 변수 설정

`.env.local` 파일에 추가:

```bash
# 카카오 API
KAKAO_REST_API_KEY=여기에_REST_API_키_붙여넣기
```

---

## API 사용 예시

### 키워드 검색 (반경 지정)

```bash
GET https://dapi.kakao.com/v2/local/search/keyword.json
  ?query=맛집
  &x=127.1270   # 경도 (lng)
  &y=37.3849    # 위도 (lat)
  &radius=800   # 반경 (미터, 최대 20000)

Headers:
  Authorization: KakaoAK {REST_API_KEY}
```

### 응답 예시

```json
{
  "documents": [
    {
      "place_name": "맛있는 식당",
      "category_name": "음식점 > 한식",
      "address_name": "경기 성남시 분당구...",
      "road_address_name": "경기 성남시 분당구...",
      "phone": "031-123-4567",
      "x": "127.1234",
      "y": "37.3856",
      "distance": "150"  // 미터 단위!
    }
  ]
}
```

---

## 체크리스트

- [ ] 카카오 개발자 계정 생성
- [ ] 애플리케이션 생성 완료
- [ ] REST API 키 복사
- [ ] `.env.local`에 `KAKAO_REST_API_KEY` 추가
- [ ] 완료되면 알려주세요! 코드에 연동하겠습니다

---

## 참고 링크

- [카카오 로컬 API 문서](https://developers.kakao.com/docs/latest/ko/local/dev-guide)
- [키워드 검색 API](https://developers.kakao.com/docs/latest/ko/local/dev-guide#search-by-keyword)
