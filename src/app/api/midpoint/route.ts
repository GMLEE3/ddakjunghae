import { NextRequest, NextResponse } from 'next/server';
import { calculateDistance } from '@/lib/midpoint';

interface Coordinate {
    lat: number;
    lng: number;
}

interface Station {
    name: string;
    lat: number;
    lng: number;
    address: string;
    line: string;
    isTransfer?: boolean; // 환승역 여부
}

// 수도권 주요 지하철역 좌표 (서울 + 경기)
const SUBWAY_STATIONS: Station[] = [
    // 서울 주요 환승역 (우선 검색)
    { name: '사당역', lat: 37.4765, lng: 126.9816, address: '서울 동작구 남부순환로 지하 2089', line: '2호선+4호선', isTransfer: true },
    { name: '교대역', lat: 37.4934, lng: 127.0146, address: '서울 서초구 서초대로 지하 294', line: '2호선+3호선', isTransfer: true },
    { name: '신도림역', lat: 37.5088, lng: 126.8913, address: '서울 구로구 경인로 지하 625', line: '1호선+2호선', isTransfer: true },
    { name: '왕십리역', lat: 37.5614, lng: 127.0379, address: '서울 성동구 왕십리광장로 17', line: '2호선+5호선', isTransfer: true },
    { name: '서울역', lat: 37.5547, lng: 126.9706, address: '서울 용산구 한강대로 405', line: '1호선+4호선', isTransfer: true },
    { name: '종로3가역', lat: 37.5710, lng: 126.9920, address: '서울 종로구 종로 지하 129', line: '1호선+3호선+5호선', isTransfer: true },
    { name: '을지로3가역', lat: 37.5663, lng: 126.9922, address: '서울 중구 을지로 지하 129', line: '2호선+3호선', isTransfer: true },
    { name: '충무로역', lat: 37.5614, lng: 126.9948, address: '서울 중구 퇴계로 지하 160', line: '3호선+4호선', isTransfer: true },
    { name: '동대문역사문화공원역', lat: 37.5650, lng: 127.0090, address: '서울 중구 을지로 281', line: '2호선+4호선+5호선', isTransfer: true },
    { name: '강남역', lat: 37.4979, lng: 127.0276, address: '서울 강남구 강남대로 396', line: '2호선+신분당선', isTransfer: true },

    // 서울 주요역
    { name: '홍대입구역', lat: 37.5563, lng: 126.9220, address: '서울 마포구 양화로 160', line: '2호선' },
    { name: '신촌역', lat: 37.5559, lng: 126.9369, address: '서울 서대문구 신촌로 90', line: '2호선' },
    { name: '이태원역', lat: 37.5345, lng: 126.9946, address: '서울 용산구 이태원로 180', line: '6호선' },
    { name: '잠실역', lat: 37.5133, lng: 127.1001, address: '서울 송파구 올림픽로 240', line: '2호선' },
    { name: '건대입구역', lat: 37.5404, lng: 127.0696, address: '서울 광진구 능동로 지하 92', line: '2호선' },
    { name: '여의도역', lat: 37.5219, lng: 126.9244, address: '서울 영등포구 여의나루로 42', line: '5호선' },
    { name: '명동역', lat: 37.5608, lng: 126.9856, address: '서울 중구 퇴계로 지하 126', line: '4호선' },
    { name: '선릉역', lat: 37.5045, lng: 127.0490, address: '서울 강남구 테헤란로 340', line: '2호선' },
    { name: '삼성역', lat: 37.5088, lng: 127.0638, address: '서울 강남구 테헤란로 512', line: '2호선' },
    { name: '합정역', lat: 37.5495, lng: 126.9139, address: '서울 마포구 양화로 지하 55', line: '2호선+6호선', isTransfer: true },
    { name: '역삼역', lat: 37.5007, lng: 127.0365, address: '서울 강남구 테헤란로 156', line: '2호선' },
    { name: '노원역', lat: 37.6557, lng: 127.0616, address: '서울 노원구 상계로 70', line: '4호선+7호선', isTransfer: true },
    { name: '천호역', lat: 37.5387, lng: 127.1237, address: '서울 강동구 천호대로 지하 1007', line: '5호선+8호선', isTransfer: true },
    { name: '양재역', lat: 37.4842, lng: 127.0345, address: '서울 서초구 남부순환로 지하 2585', line: '3호선+신분당선', isTransfer: true },
    { name: '남부터미널역', lat: 37.4846, lng: 127.0164, address: '서울 서초구 서초대로 지하 410', line: '3호선' },

    // 경기 남부 (분당선, 신분당선) - 인덕원~미금 연결 지역
    { name: '판교역', lat: 37.3947, lng: 127.1112, address: '경기 성남시 분당구 판교역로 160', line: '신분당선' },
    { name: '미금역', lat: 37.3849, lng: 127.1270, address: '경기 성남시 분당구 미금로 195', line: '분당선' },
    { name: '정자역', lat: 37.3665, lng: 127.1085, address: '경기 성남시 분당구 정자일로 1', line: '신분당선' },
    { name: '수원역', lat: 37.2660, lng: 127.0017, address: '경기 수원시 팔달구 덕영대로 924', line: '1호선' },
    { name: '광교중앙역', lat: 37.2858, lng: 127.0544, address: '경기 수원시 영통구 광교중앙로 145', line: '신분당선' },
    { name: '야탑역', lat: 37.4112, lng: 127.1272, address: '경기 성남시 분당구 야탑로 69', line: '분당선' },
    { name: '서현역', lat: 37.3850, lng: 127.1225, address: '경기 성남시 분당구 분당로 53', line: '분당선' },
    { name: '수내역', lat: 37.3779, lng: 127.1157, address: '경기 성남시 분당구 수내로 46', line: '분당선' },
    { name: '모란역', lat: 37.4322, lng: 127.1291, address: '경기 성남시 중원구 성남대로 1126', line: '분당선' },
    { name: '복정역', lat: 37.4704, lng: 127.1264, address: '경기 성남시 수정구 복정로 지하 82', line: '분당선' },
    { name: '수서역', lat: 37.4876, lng: 127.1020, address: '서울 강남구 밤고개로 21', line: '분당선' },
    { name: '대모산입구역', lat: 37.4925, lng: 127.0855, address: '서울 강남구 헌릉로 596', line: '분당선' },
    { name: '개포동역', lat: 37.4935, lng: 127.0735, address: '서울 강남구 개포로 지하 416', line: '분당선' },
    { name: '구룡역', lat: 37.4950, lng: 127.0630, address: '서울 강남구 개포로 지하 510', line: '분당선' },
    { name: '도곡역', lat: 37.4907, lng: 127.0531, address: '서울 강남구 남부순환로 지하 2585', line: '분당선' },
    { name: '한티역', lat: 37.4976, lng: 127.0448, address: '서울 강남구 도곡로 지하 157', line: '분당선' },
    { name: '선정릉역', lat: 37.5104, lng: 127.0438, address: '서울 강남구 선릉로 지하 472', line: '분당선' },

    // 안양/인덕원/과천 - 4호선 연결
    { name: '인덕원역', lat: 37.3875, lng: 126.9873, address: '경기 안양시 동안구 흥안대로 415', line: '4호선' },
    { name: '안양역', lat: 37.4012, lng: 126.9222, address: '경기 안양시 만안구 안양로 112', line: '1호선' },
    { name: '범계역', lat: 37.3902, lng: 126.9526, address: '경기 안양시 동안구 시민대로 180', line: '4호선' },
    { name: '평촌역', lat: 37.3944, lng: 126.9628, address: '경기 안양시 동안구 시민대로 230', line: '4호선' },
    { name: '과천역', lat: 37.4345, lng: 126.9872, address: '경기 과천시 별양로 지하 2', line: '4호선' },
    { name: '정부과천청사역', lat: 37.4234, lng: 126.9897, address: '경기 과천시 관문로 지하 69', line: '4호선' },
    { name: '선바위역', lat: 37.4520, lng: 126.9920, address: '경기 과천시 과천대로 지하 7길', line: '4호선' },
    { name: '경마공원역', lat: 37.4421, lng: 127.0022, address: '경기 과천시 경마공원대로 지하 79', line: '4호선' },
    { name: '대공원역', lat: 37.4345, lng: 127.0083, address: '경기 과천시 대공원광장로 지하 181', line: '4호선' },

    // 일산
    { name: '일산역', lat: 37.6784, lng: 126.7694, address: '경기 고양시 일산동구 일산로 지하 199', line: '경의중앙선' },
    { name: '주엽역', lat: 37.6693, lng: 126.7563, address: '경기 고양시 일산서구 주엽로 지하 101', line: '3호선' },
    { name: '대화역', lat: 37.6766, lng: 126.7430, address: '경기 고양시 일산서구 중앙로 지하 1580', line: '3호선' },

    // 부천/인천
    { name: '부천역', lat: 37.4857, lng: 126.7833, address: '경기 부천시 부천로 1', line: '1호선' },
    { name: '부평역', lat: 37.4898, lng: 126.7224, address: '인천 부평구 부평대로 지하 50', line: '1호선' },

    // 의정부/구리
    { name: '의정부역', lat: 37.7380, lng: 127.0455, address: '경기 의정부시 태평로 73', line: '1호선' },
    { name: '구리역', lat: 37.5962, lng: 127.1437, address: '경기 구리시 경춘로 지하 22', line: '경의중앙선' },
];

/**
 * 두 출발지 사이에서 합리적인 중간 지점 역 찾기
 * 핵심: 
 * 1. 각 사람의 이동거리가 출발지 간 거리보다 작아야 함
 * 2. 총 이동거리가 출발지 간 거리의 1.1배를 넘지 않아야 함
 */
function findOptimalMidpoint(origins: Coordinate[]): {
    station: Station;
    distances: number[];
    isOptimal: boolean;
} {
    // 출발지들 사이의 최대 직선 거리 계산
    let maxOriginDistance = 0;
    for (let i = 0; i < origins.length; i++) {
        for (let j = i + 1; j < origins.length; j++) {
            const dist = calculateDistance(origins[i], origins[j]);
            maxOriginDistance = Math.max(maxOriginDistance, dist);
        }
    }

    // 허용 기준: 총 거리는 출발지 간 거리 × 1.1, 개별 거리는 출발지 간 거리보다 작아야
    const maxAllowedTotalDistance = maxOriginDistance * 1.1;
    const maxAllowedIndividualDistance = maxOriginDistance;

    type CandidateStation = {
        station: Station;
        distances: number[];
        totalDistance: number;
        maxDistance: number;
        fairnessScore: number; // 거리 편차 (낮을수록 좋음)
    };

    const candidates: CandidateStation[] = [];

    for (const station of SUBWAY_STATIONS) {
        const distances = origins.map(origin =>
            calculateDistance(origin, { lat: station.lat, lng: station.lng })
        );

        const totalDistance = distances.reduce((sum, d) => sum + d, 0);
        const maxDistance = Math.max(...distances);
        const minDistance = Math.min(...distances);
        const fairnessScore = maxDistance - minDistance;

        // 조건 1: 총 거리가 허용 범위 내
        // 조건 2: 각 개인의 거리가 두 출발지 간 거리보다 작아야
        const allDistancesReasonable = distances.every(d => d <= maxAllowedIndividualDistance);

        if (totalDistance <= maxAllowedTotalDistance && allDistancesReasonable) {
            candidates.push({
                station,
                distances,
                totalDistance,
                maxDistance,
                fairnessScore,
            });
        }
    }

    // 후보가 있으면 가장 공평한 역 선택 (거리 편차가 가장 적은 역)
    if (candidates.length > 0) {
        candidates.sort((a, b) => a.fairnessScore - b.fairnessScore);
        const best = candidates[0];
        return {
            station: best.station,
            distances: best.distances,
            isOptimal: true,
        };
    }

    // 후보가 없으면 범위를 넓혀서 다시 시도 (2배까지)
    const extendedMaxDistance = maxOriginDistance * 2;
    for (const station of SUBWAY_STATIONS) {
        const distances = origins.map(origin =>
            calculateDistance(origin, { lat: station.lat, lng: station.lng })
        );
        const totalDistance = distances.reduce((sum, d) => sum + d, 0);
        const fairnessScore = Math.max(...distances) - Math.min(...distances);

        if (totalDistance <= extendedMaxDistance) {
            candidates.push({
                station,
                distances,
                totalDistance,
                maxDistance: Math.max(...distances),
                fairnessScore,
            });
        }
    }

    if (candidates.length > 0) {
        candidates.sort((a, b) => a.fairnessScore - b.fairnessScore);
        const best = candidates[0];
        return {
            station: best.station,
            distances: best.distances,
            isOptimal: false,
        };
    }

    // 그래도 없으면 가장 가까운 역 반환
    let bestStation = SUBWAY_STATIONS[0];
    let bestDistances: number[] = [];
    let bestFairness = Infinity;

    for (const station of SUBWAY_STATIONS) {
        const distances = origins.map(origin =>
            calculateDistance(origin, { lat: station.lat, lng: station.lng })
        );
        const fairness = Math.max(...distances) - Math.min(...distances);
        if (fairness < bestFairness) {
            bestFairness = fairness;
            bestStation = station;
            bestDistances = distances;
        }
    }

    return {
        station: bestStation,
        distances: bestDistances,
        isOptimal: false,
    };
}

/**
 * 후보 역 결과 타입
 */
interface CandidateResult {
    station: Station;
    times: number[];
    maxTime: number;
    isRecommended: boolean;
}

/**
 * ODsay 대중교통 시간 기반 후보 역들 찾기
 * 최적화: API 호출 수 제한 + 순차 실행 + 딜레이
 * 변경: 모든 성공한 후보 역 반환 (최적 역 표시)
 */
async function findCandidatesByTransit(
    origins: Coordinate[],
    candidates: Station[]
): Promise<CandidateResult[]> {
    const apiKey = process.env.ODSAY_API_KEY;
    if (!apiKey) return [];

    // 동적으로 odsay 모듈 import
    const { getTransitRoute } = await import('@/lib/odsay');

    const results: CandidateResult[] = [];

    // 딜레이 함수
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // 상위 5개 역만 API 호출 (API 사용량 최적화)
    const topCandidates = candidates.slice(0, 5);
    console.log(`[ODsay] ${topCandidates.length}개 역 검색 시작`);

    for (const station of topCandidates) {
        try {
            // 각 출발지에서 이 역까지 대중교통 시간 계산 (순차 실행)
            const times: number[] = [];
            let allSuccess = true;

            for (const origin of origins) {
                // 출발지와 도착지가 같은 역인지 체크 (700m 이내 오류 방지)
                const distance = Math.sqrt(
                    Math.pow(origin.lat - station.lat, 2) +
                    Math.pow(origin.lng - station.lng, 2)
                ) * 111; // 대략적인 km 변환

                if (distance < 0.7) {
                    // 700m 이내면 0분으로 처리
                    times.push(0);
                    continue;
                }

                const result = await getTransitRoute(
                    origin.lat, origin.lng,
                    station.lat, station.lng,
                    apiKey
                );

                if (result) {
                    times.push(result.totalTime);
                } else {
                    allSuccess = false;
                    break;
                }

                // API 호출 간 300ms 딜레이
                await delay(300);
            }

            if (allSuccess && times.length === origins.length) {
                const maxTime = Math.max(...times);
                console.log(`[ODsay] ${station.name}: 최대 ${maxTime}분`);

                results.push({
                    station,
                    times,
                    maxTime,
                    isRecommended: false, // 나중에 설정
                });
            }
        } catch (error) {
            console.error('[ODsay] API 호출 실패:', station.name, error);
        }

        // 역 간 500ms 딜레이
        await delay(500);
    }

    // 최적 역 표시 (maxTime이 가장 작은 역)
    if (results.length > 0) {
        results.sort((a, b) => a.maxTime - b.maxTime);
        results[0].isRecommended = true;
        console.log(`[ODsay] 최적 역: ${results[0].station.name} (최대 ${results[0].maxTime}분)`);
    }

    return results;
}

export async function POST(request: NextRequest) {
    try {
        const { coordinates } = await request.json();

        if (!coordinates || !Array.isArray(coordinates) || coordinates.length === 0) {
            return NextResponse.json(
                { success: false, error: '좌표 데이터가 필요합니다' },
                { status: 400 }
            );
        }

        const origins = coordinates as Coordinate[];

        // 1단계: 환승역 우선 + 직선거리로 상위 역 필터링
        const stationsWithScore = SUBWAY_STATIONS
            .map(station => ({
                station,
                avgDistance: origins.reduce((sum, o) =>
                    sum + calculateDistance(o, { lat: station.lat, lng: station.lng }), 0) / origins.length,
                isTransfer: station.isTransfer || false,
            }))
            // 환승역 우선, 그 다음 거리순 정렬
            .sort((a, b) => {
                // 환승역 우선
                if (a.isTransfer && !b.isTransfer) return -1;
                if (!a.isTransfer && b.isTransfer) return 1;
                // 거리순
                return a.avgDistance - b.avgDistance;
            })
            // 환승역 + 가까운 일반역 조합 (최대 10개)
            .slice(0, 10);

        const nearbyStations = stationsWithScore.map(s => s.station);
        console.log(`[Midpoint] 후보역: ${nearbyStations.slice(0, 5).map(s => s.name).join(', ')}`);

        // 2단계: ODsay 대중교통 시간 기반 후보들 계산
        const transitCandidates = await findCandidatesByTransit(origins, nearbyStations);

        if (transitCandidates.length > 0) {
            // 대중교통 시간 기반 후보들 반환
            const recommended = transitCandidates.find(c => c.isRecommended) || transitCandidates[0];

            // 소요시간 차이로 공평도 계산
            const maxTime = Math.max(...recommended.times);
            const minTime = Math.min(...recommended.times);
            const maxDifference = maxTime - minTime;
            let fairnessScore = '편차있음';
            if (maxDifference < 10) fairnessScore = '균등';
            else if (maxDifference < 20) fairnessScore = '보통';

            return NextResponse.json({
                success: true,
                data: {
                    calculationMethod: '대중교통 소요시간',
                    // 추천 역 (이전 호환성)
                    coordinates: { lat: recommended.station.lat, lng: recommended.station.lng },
                    nearestStation: {
                        name: recommended.station.name,
                        address: recommended.station.address,
                        line: recommended.station.line,
                        distance: 0,
                    },
                    distanceInfo: {
                        fromOrigins: recommended.times.map((time: number, index: number) => ({
                            index: index + 1,
                            value: time,
                            unit: '분',
                        })),
                        maxDifference,
                        fairnessScore,
                    },
                    // 새로운 후보 리스트
                    candidates: transitCandidates.map(c => ({
                        station: {
                            name: c.station.name,
                            address: c.station.address,
                            line: c.station.line,
                            lat: c.station.lat,
                            lng: c.station.lng,
                        },
                        times: c.times.map((t: number, i: number) => ({
                            originIndex: i + 1,
                            minutes: t,
                        })),
                        maxTime: c.maxTime,
                        isRecommended: c.isRecommended,
                    })),
                },
            });
        }

        // 폴백: 직선거리 기반 계산 (후보역도 포함)
        // 직선거리 → 예상 대중교통 시간 환산 (평균 시속 25km/h 기준, 도보/대기 추가)
        const estimateTransitTime = (distanceKm: number): number => {
            if (distanceKm < 1) return 5;
            return Math.round(distanceKm / 25 * 60 + 10); // 이동시간 + 도보/대기 10분
        };

        // 상위 5개 역을 후보로 포함
        const topStations = stationsWithScore.slice(0, 5);
        const distanceCandidates = topStations.map((s, idx) => {
            const distances = origins.map(o =>
                calculateDistance(o, { lat: s.station.lat, lng: s.station.lng })
            );
            const times = distances.map(d => estimateTransitTime(d));
            const maxTime = Math.max(...times);

            return {
                station: {
                    name: s.station.name,
                    address: s.station.address,
                    line: s.station.line,
                    lat: s.station.lat,
                    lng: s.station.lng,
                },
                times: times.map((t: number, i: number) => ({
                    originIndex: i + 1,
                    minutes: t,
                })),
                maxTime,
                isRecommended: idx === 0, // 첫 번째가 최적
            };
        });

        const bestCandidate = distanceCandidates[0];
        const maxDifference = bestCandidate
            ? Math.max(...bestCandidate.times.map(t => t.minutes)) - Math.min(...bestCandidate.times.map(t => t.minutes))
            : 0;
        let fairnessScore = '편차있음';
        if (maxDifference < 10) fairnessScore = '균등';
        else if (maxDifference < 20) fairnessScore = '보통';

        return NextResponse.json({
            success: true,
            data: {
                calculationMethod: '직선거리',
                coordinates: bestCandidate
                    ? { lat: bestCandidate.station.lat, lng: bestCandidate.station.lng }
                    : { lat: origins[0].lat, lng: origins[0].lng },
                nearestStation: bestCandidate
                    ? {
                        name: bestCandidate.station.name,
                        address: bestCandidate.station.address,
                        line: bestCandidate.station.line,
                        distance: 0,
                    }
                    : null,
                distanceInfo: {
                    fromOrigins: bestCandidate
                        ? bestCandidate.times.map((t: { originIndex: number; minutes: number }) => ({
                            index: t.originIndex,
                            value: t.minutes,
                            unit: '분',
                        }))
                        : [],
                    maxDifference,
                    fairnessScore,
                },
                candidates: distanceCandidates,
            },
        });
    } catch (error) {
        console.error('Midpoint API error:', error);
        return NextResponse.json(
            { success: false, error: '중간 지점 계산 중 오류가 발생했습니다' },
            { status: 500 }
        );
    }
}

