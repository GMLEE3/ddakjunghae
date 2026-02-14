// ODsay 대중교통 길찾기 API 유틸리티

interface TransitResult {
    totalTime: number;      // 총 소요시간 (분)
    totalDistance: number;  // 총 거리 (m)
    transferCount: number;  // 환승 횟수
    pathType: string;       // 경로 유형 (지하철/버스/버스+지하철)
}

/**
 * ODsay 대중교통 길찾기 API 호출
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
        // ODsay API는 경도(X), 위도(Y) 순서로 입력
        // API 키에 특수문자(/)가 포함되어 있으므로 인코딩 필요
        const encodedApiKey = encodeURIComponent(apiKey);
        const url = `https://api.odsay.com/v1/api/searchPubTransPathT?apiKey=${encodedApiKey}&SX=${startLng}&SY=${startLat}&EX=${endLng}&EY=${endLat}`;

        console.log('[ODsay] API 호출:', `SX=${startLng}, SY=${startLat}, EX=${endLng}, EY=${endLat}`);

        const response = await fetch(url);

        if (!response.ok) {
            console.error('ODsay API 응답 에러:', response.status);
            return null;
        }

        const data = await response.json();

        // 에러 체크
        if (data.error) {
            console.error('ODsay API 에러:', data.error);
            return null;
        }

        // 결과 파싱
        if (data.result?.path && data.result.path.length > 0) {
            // 첫 번째 경로 (최적 경로)
            const bestPath = data.result.path[0];
            const info = bestPath.info;

            return {
                totalTime: info.totalTime,           // 분 단위
                totalDistance: info.totalDistance,  // m 단위
                transferCount: (info.busTransitCount || 0) + (info.subwayTransitCount || 0),
                pathType: getPathTypeName(bestPath.pathType),
            };
        }

        return null;
    } catch (error) {
        console.error('ODsay API 호출 에러:', error);
        return null;
    }
}

/**
 * 경로 유형 이름 변환
 */
function getPathTypeName(pathType: number): string {
    switch (pathType) {
        case 1: return '지하철';
        case 2: return '버스';
        case 3: return '버스+지하철';
        default: return '대중교통';
    }
}

/**
 * 여러 출발지에서 하나의 목적지까지 대중교통 시간 계산
 */
export async function getTransitTimesFromOrigins(
    origins: Array<{ lat: number; lng: number }>,
    destination: { lat: number; lng: number },
    apiKey: string
): Promise<(TransitResult | null)[]> {
    const results = await Promise.all(
        origins.map(origin =>
            getTransitRoute(
                origin.lat, origin.lng,
                destination.lat, destination.lng,
                apiKey
            )
        )
    );
    return results;
}
