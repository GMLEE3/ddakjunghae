# ODsay 대중교통 API 연동 가이드

> 대중교통 시간 기반 중간 지점 계산을 위한 ODsay API 연동

---

## ODsay API 개요

| 항목 | 내용 |
|------|------|
| 제공사 | ODsay Lab |
| 무료 한도 | **1,000건/일** |
| 지원 교통수단 | 버스, 지하철, 기차, 고속버스 |
| 응답 형식 | JSON |

---

## 1단계: API 키 발급

### 1.1 회원가입
1. **[ODsay Lab](https://lab.odsay.com/)** 접속
2. 회원가입 진행
3. 이메일 인증

### 1.2 앱 등록
1. 로그인 후 **마이페이지** → **앱 관리**
2. **앱 등록** 클릭
3. 앱 이름: `딱정해` (또는 원하는 이름)
4. 플랫폼: **Web** 선택
5. 도메인: `localhost` (개발용), 실제 도메인 추가

### 1.3 API 키 확인
- 앱 등록 완료 후 **API Key** 확인
- 이 키를 `.env.local`에 저장

---

## 2단계: 환경 변수 설정

```env
# .env.local에 추가
ODSAY_API_KEY=발급받은_API_키
```

---

## 3단계: API 코드 구현

### 3.1 ODsay 유틸리티 파일 생성

```typescript
// src/lib/odsay.ts

interface TransitResult {
    totalTime: number;      // 총 소요시간 (분)
    totalDistance: number;  // 총 거리 (m)
    transferCount: number;  // 환승 횟수
    pathType: string;       // 경로 유형
}

/**
 * ODsay 대중교통 길찾기 API
 * @param startLat 출발지 위도
 * @param startLng 출발지 경도
 * @param endLat 도착지 위도
 * @param endLng 도착지 경도
 * @param apiKey ODsay API 키
 */
export async function getTransitRoute(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
    apiKey: string
): Promise<TransitResult | null> {
    try {
        // ODsay API는 경도(X), 위도(Y) 순서
        const url = new URL('https://api.odsay.com/v1/api/searchPubTransPathT');
        url.searchParams.append('apiKey', apiKey);
        url.searchParams.append('SX', startLng.toString());  // 출발지 경도
        url.searchParams.append('SY', startLat.toString());  // 출발지 위도
        url.searchParams.append('EX', endLng.toString());    // 도착지 경도
        url.searchParams.append('EY', endLat.toString());    // 도착지 위도

        const response = await fetch(url.toString());
        
        if (!response.ok) {
            console.error('ODsay API error:', response.status);
            return null;
        }

        const data = await response.json();

        // 결과 파싱
        if (data.result?.path && data.result.path.length > 0) {
            // 첫 번째 경로 (최적 경로)
            const bestPath = data.result.path[0];
            const info = bestPath.info;

            return {
                totalTime: info.totalTime,           // 분 단위
                totalDistance: info.totalDistance,  // m 단위
                transferCount: info.busTransitCount + info.subwayTransitCount,
                pathType: getPathTypeName(bestPath.pathType),
            };
        }

        return null;
    } catch (error) {
        console.error('ODsay API error:', error);
        return null;
    }
}

function getPathTypeName(pathType: number): string {
    switch (pathType) {
        case 1: return '지하철';
        case 2: return '버스';
        case 3: return '버스+지하철';
        default: return '대중교통';
    }
}
```

### 3.2 중간점 API 수정

```typescript
// src/app/api/midpoint/route.ts 에 추가

import { getTransitRoute } from '@/lib/odsay';

// 대중교통 시간 기반 최적 역 찾기
async function findFairestStationByTransit(
    origins: Coordinate[],
    candidates: Station[]
): Promise<{ station: Station; times: number[] } | null> {
    const apiKey = process.env.ODSAY_API_KEY;
    if (!apiKey) return null;

    let bestStation: Station | null = null;
    let bestMaxTime = Infinity;
    let bestTimes: number[] = [];

    for (const station of candidates) {
        // 각 출발지에서 이 역까지 대중교통 시간 계산
        const results = await Promise.all(
            origins.map(origin =>
                getTransitRoute(
                    origin.lat, origin.lng,
                    station.lat, station.lng,
                    apiKey
                )
            )
        );

        // 모든 경로가 성공한 경우만 고려
        if (results.every(r => r !== null)) {
            const times = results.map(r => r!.totalTime);
            const maxTime = Math.max(...times);

            // 가장 긴 시간이 최소인 역 선택 (공평함)
            if (maxTime < bestMaxTime) {
                bestMaxTime = maxTime;
                bestStation = station;
                bestTimes = times;
            }
        }
    }

    if (bestStation) {
        return { station: bestStation, times: bestTimes };
    }
    return null;
}
```

---

## 4단계: API 호출 최적화

### 문제: 1,000건/일 제한

### 해결책: 사전 필터링

```typescript
// 1. 직선거리로 상위 10개 역만 필터링
const nearbyStations = SUBWAY_STATIONS
    .map(station => ({
        station,
        avgDistance: origins.reduce((sum, o) => 
            sum + calculateDistance(o, station), 0) / origins.length
    }))
    .sort((a, b) => a.avgDistance - b.avgDistance)
    .slice(0, 10)
    .map(s => s.station);

// 2. 필터링된 역에만 ODsay API 호출 (최대 20건 = 10역 × 2출발지)
const result = await findFairestStationByTransit(origins, nearbyStations);
```

---

## 5단계: 테스트

### 테스트 케이스

| 출발지 | 도착지 | 예상 중간점 |
|--------|--------|------------|
| 인덕원역 | 미금역 | 판교역 또는 사당역 |
| 강남역 | 홍대역 | 합정역 또는 신촌역 |
| 잠실역 | 신도림역 | 여의도역 또는 영등포역 |

### API 테스트

```bash
# 브라우저에서 직접 테스트 (API 키 넣어서)
https://api.odsay.com/v1/api/searchPubTransPathT?apiKey=YOUR_KEY&SX=126.9873&SY=37.3875&EX=127.1270&EY=37.3849
```

---

## 응답 예시

```json
{
    "result": {
        "path": [{
            "pathType": 1,
            "info": {
                "totalTime": 45,
                "totalDistance": 15200,
                "busTransitCount": 0,
                "subwayTransitCount": 1
            }
        }]
    }
}
```

---

## 구현 체크리스트

- [ ] ODsay Lab 가입
- [ ] 앱 등록 및 API 키 발급
- [ ] `.env.local`에 `ODSAY_API_KEY` 추가
- [ ] `src/lib/odsay.ts` 파일 생성
- [ ] `/api/midpoint` 라우트 수정
- [ ] 테스트 실행

---

## 참고 링크

- [ODsay Lab](https://lab.odsay.com/)
- [대중교통 길찾기 API 문서](https://lab.odsay.com/guide/releaseReference#searchPubTransPathT)
- [API 에러 코드](https://lab.odsay.com/guide/releaseReference#error)
