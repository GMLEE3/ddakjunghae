import { NextRequest, NextResponse } from 'next/server';

const NAVER_API_BASE = 'https://openapi.naver.com/v1/search';

interface NaverSearchItem {
    title: string;
    category: string;
    address: string;
    roadAddress: string;
    mapx: string;
    mapy: string;
}

interface NaverSearchResponse {
    items: NaverSearchItem[];
}

interface TransitSuggestion {
    name: string;
    type: 'subway' | 'bus' | 'station';
    address: string;
    lat: number;
    lng: number;
}

/**
 * 네이버 좌표 변환 (mapx, mapy -> WGS84)
 * 네이버 API는 mapx, mapy를 정수로 반환
 * - 10자리: 소수점 7자리 정밀도 (예: 1269603814 -> 126.9603814)
 * - 9자리: 소수점 7자리 정밀도 (예: 375639297 -> 37.5639297)
 */
function convertNaverCoords(mapx: string, mapy: string): { lat: number; lng: number } {
    // 좌표값이 문자열의 길이에 따라 처리
    // lng(경도): 보통 126~129 범위 (한국), 10자리
    // lat(위도): 보통 33~38 범위 (한국), 9자리

    let lng: number;
    let lat: number;

    // 경도 (X) - 보통 10자리 (126.xxxxxxx)
    if (mapx.length === 10) {
        lng = parseInt(mapx, 10) / 10000000;
    } else if (mapx.length === 9) {
        lng = parseInt(mapx, 10) / 1000000;
    } else {
        lng = parseFloat(mapx);
    }

    // 위도 (Y) - 보통 9자리 (37.xxxxxxx)
    if (mapy.length === 9) {
        lat = parseInt(mapy, 10) / 10000000;
    } else if (mapy.length === 10) {
        lat = parseInt(mapy, 10) / 100000000;
    } else {
        lat = parseFloat(mapy);
    }

    // 유효성 검사 - 한국 좌표 범위 확인
    if (lat < 33 || lat > 43 || lng < 124 || lng > 132) {
        console.warn('Invalid coordinates detected:', { mapx, mapy, lat, lng });
        // 다시 시도: 다른 형식으로 파싱
        lat = parseInt(mapy, 10) / 10000000;
        lng = parseInt(mapx, 10) / 10000000;
    }

    return { lat, lng };
}

/**
 * 카테고리에서 교통수단 타입 추출
 */
function extractTransitType(category: string, title: string): 'subway' | 'bus' | 'station' | null {
    const lowerCategory = category.toLowerCase();
    const lowerTitle = title.toLowerCase();

    // 지하철역 판별
    if (lowerCategory.includes('지하철') || lowerCategory.includes('전철')) {
        return 'subway';
    }

    // 버스정류장 판별
    if (lowerCategory.includes('버스') || lowerCategory.includes('정류장') ||
        lowerTitle.includes('정류장') || lowerTitle.includes('정류소')) {
        return 'bus';
    }

    // 역 (기차역, 지하철역 등)
    if (lowerCategory.includes('역') || lowerCategory.includes('터미널') ||
        (lowerTitle.includes('역') && !lowerTitle.includes('정류'))) {
        return 'station';
    }

    return null;
}

/**
 * HTML 태그 제거
 */
function stripHtml(str: string): string {
    return str.replace(/<[^>]*>/g, '');
}

/**
 * 검색어 기반 쿼리목록 생성
 */
function buildSearchQueries(query: string): string[] {
    const queries: string[] = [];
    const trimmed = query.trim();

    // 이미 역/정류장으로 끝나면 그대로 검색
    if (trimmed.endsWith('역') || trimmed.endsWith('정류장') || trimmed.endsWith('정류소')) {
        queries.push(trimmed);
    } else {
        // 역과 정류장 버전 모두 검색
        queries.push(`${trimmed}역`);
        queries.push(`${trimmed} 버스정류장`);
    }

    return queries;
}

/**
 * 결과가 검색어와 관련있는지 확인
 */
function isRelevantResult(name: string, query: string): boolean {
    const normalizedName = name.replace(/\s/g, '').toLowerCase();

    // 검색어에서 역/정류장 접미사 제거
    let normalizedQuery = query.replace(/\s/g, '').toLowerCase();
    normalizedQuery = normalizedQuery.replace(/역$/, '')
        .replace(/정류장$/, '')
        .replace(/정류소$/, '');

    // 빈 쿼리면 false
    if (!normalizedQuery || normalizedQuery.length < 1) return false;

    // 검색어의 핵심 부분이 결과 이름에 포함되어야 함
    // 최소 2글자 이상 일치해야 함
    if (normalizedQuery.length >= 2) {
        return normalizedName.includes(normalizedQuery);
    }

    // 1글자인 경우 결과 이름이 검색어로 시작해야 함
    return normalizedName.startsWith(normalizedQuery);
}

export async function POST(request: NextRequest) {
    try {
        const { query } = await request.json();

        if (!query || query.length < 2) {
            return NextResponse.json({
                success: true,
                data: [],
            });
        }

        const clientId = process.env.NAVER_CLIENT_ID;
        const clientSecret = process.env.NAVER_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            return NextResponse.json({
                success: false,
                error: 'API 키가 설정되지 않았습니다',
            });
        }

        // 검색 쿼리 생성
        const searchQueries = buildSearchQueries(query);

        const results = await Promise.all(
            searchQueries.map(async (searchQuery) => {
                const response = await fetch(
                    `${NAVER_API_BASE}/local.json?query=${encodeURIComponent(searchQuery)}&display=10`,
                    {
                        headers: {
                            'X-Naver-Client-Id': clientId,
                            'X-Naver-Client-Secret': clientSecret,
                        },
                    }
                );

                if (!response.ok) {
                    console.error('Naver API error:', response.status);
                    return [];
                }

                const data: NaverSearchResponse = await response.json();
                return data.items || [];
            })
        );

        // 결과 병합 및 필터링
        const allItems = results.flat();
        const suggestions: TransitSuggestion[] = [];
        const seenNames = new Set<string>();

        for (const item of allItems) {
            const name = stripHtml(item.title);
            const type = extractTransitType(item.category, name);

            // 지하철역, 버스정류장만 필터링
            if (!type) continue;

            // 검색어와 관련있는 결과만 포함
            if (!isRelevantResult(name, query)) continue;

            // 중복 제거
            if (seenNames.has(name)) continue;
            seenNames.add(name);

            const coords = convertNaverCoords(item.mapx, item.mapy);

            suggestions.push({
                name,
                type,
                address: item.roadAddress || item.address,
                lat: coords.lat,
                lng: coords.lng,
            });
        }

        // 정렬: 1) 정확히 검색어로 시작하는 것 우선, 2) 지하철역 > 버스정류장
        suggestions.sort((a, b) => {
            const queryBase = query.replace(/역$/, '').replace(/정류장$/, '').replace(/정류소$/, '');
            const aStartsWith = a.name.startsWith(queryBase) ? 0 : 1;
            const bStartsWith = b.name.startsWith(queryBase) ? 0 : 1;

            if (aStartsWith !== bStartsWith) {
                return aStartsWith - bStartsWith;
            }

            const typeOrder = { subway: 0, station: 1, bus: 2 };
            return typeOrder[a.type] - typeOrder[b.type];
        });

        // 최대 8개만 반환
        return NextResponse.json({
            success: true,
            data: suggestions.slice(0, 8),
        });
    } catch (error) {
        console.error('Autocomplete error:', error);
        return NextResponse.json({
            success: false,
            error: '검색 중 오류가 발생했습니다',
        });
    }
}

