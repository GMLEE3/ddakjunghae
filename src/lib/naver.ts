import type { GeocodeResponse, SearchResponse, Restaurant } from '@/types';

const NAVER_API_BASE = 'https://openapi.naver.com/v1/search';

interface NaverSearchItem {
    title: string;
    link: string;
    category: string;
    description: string;
    telephone: string;
    address: string;
    roadAddress: string;
    mapx: string;
    mapy: string;
}

interface NaverSearchResponse {
    lastBuildDate: string;
    total: number;
    start: number;
    display: number;
    items: NaverSearchItem[];
}

/**
 * Naver Geocoding API (서버 사이드에서만 호출)
 */
export async function geocodeAddress(
    address: string,
    clientId: string,
    clientSecret: string
): Promise<GeocodeResponse> {
    try {
        const response = await fetch(
            `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(address)}`,
            {
                headers: {
                    'X-NCP-APIGW-API-KEY-ID': clientId,
                    'X-NCP-APIGW-API-KEY': clientSecret,
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Geocoding failed: ${response.status}`);
        }

        const data = await response.json();

        if (data.addresses && data.addresses.length > 0) {
            const result = data.addresses[0];
            return {
                success: true,
                data: {
                    lat: parseFloat(result.y),
                    lng: parseFloat(result.x),
                    address: result.roadAddress || result.jibunAddress,
                },
            };
        }

        return {
            success: false,
            error: '주소를 찾을 수 없습니다',
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : '주소 변환 중 오류 발생',
        };
    }
}

/**
 * Naver 이미지 검색 API - 식당 이미지 가져오기
 * @param query 검색어 (식당 이름)
 * @param clientId 네이버 API Client ID
 * @param clientSecret 네이버 API Client Secret
 * @param category 식당 카테고리 (검색 키워드로 활용)
 */
export async function searchImage(
    query: string,
    clientId: string,
    clientSecret: string,
    category?: string
): Promise<string | null> {
    try {
        // 카테고리에서 검색 키워드 추출 (카페, 고기 등)
        const categoryKeyword = category ? extractCategoryKeyword(category) : null;

        // 1차 시도: 식당 이름 + 카테고리 키워드 (또는 맛집)
        // 예: "산책 카페", "청춘삼겹 삼겹살"
        const suffix = categoryKeyword || '맛집';
        let searchQuery = `${query} ${suffix}`;
        console.log(`[Naver Image] Searching: ${searchQuery}`);

        let response = await fetch(
            `${NAVER_API_BASE}/image?query=${encodeURIComponent(searchQuery)}&display=1&sort=sim`,
            {
                headers: {
                    'X-Naver-Client-Id': clientId,
                    'X-Naver-Client-Secret': clientSecret,
                },
            }
        );

        if (response.ok) {
            const data = await response.json();
            if (data.items && data.items.length > 0) {
                console.log(`[Naver Image] Found: ${data.items[0].link}`);
                return data.items[0].link;
            }
        }

        // 2차 시도: 카테고리 기반 검색
        if (category) {
            const categoryKeyword = extractCategoryKeyword(category);
            if (categoryKeyword) {
                searchQuery = categoryKeyword + ' 음식';
                console.log(`[Naver Image] Fallback search: ${searchQuery}`);

                response = await fetch(
                    `${NAVER_API_BASE}/image?query=${encodeURIComponent(searchQuery)}&display=1&sort=sim`,
                    {
                        headers: {
                            'X-Naver-Client-Id': clientId,
                            'X-Naver-Client-Secret': clientSecret,
                        },
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    if (data.items && data.items.length > 0) {
                        console.log(`[Naver Image] Fallback found: ${data.items[0].link}`);
                        return data.items[0].link;
                    }
                }
            }
        }

        console.log('[Naver Image] No results');
        return null;
    } catch (error) {
        console.error('[Naver Image] Exception:', error);
        return null;
    }
}

/**
 * 카테고리에서 검색 키워드 추출
 * 단일 키워드로 반환 (이미지 검색 정확도 향상)
 */
function extractCategoryKeyword(category: string): string | null {
    const lowerCategory = category.toLowerCase();

    if (lowerCategory.includes('카페') || lowerCategory.includes('커피') || lowerCategory.includes('디저트') || lowerCategory.includes('베이커리')) {
        return '카페';
    }
    if (lowerCategory.includes('삼겹') || lowerCategory.includes('고기') || lowerCategory.includes('구이') || lowerCategory.includes('bbq')) {
        return '삼겹살';
    }
    if (lowerCategory.includes('회') || lowerCategory.includes('초밥') || lowerCategory.includes('스시') || lowerCategory.includes('횟집')) {
        return '회';
    }
    if (lowerCategory.includes('한식') || lowerCategory.includes('국밥') || lowerCategory.includes('찌개') || lowerCategory.includes('백반')) {
        return '한식';
    }
    if (lowerCategory.includes('일식') || lowerCategory.includes('라멘') || lowerCategory.includes('돈카츠') || lowerCategory.includes('우동')) {
        return '일식';
    }
    if (lowerCategory.includes('중식') || lowerCategory.includes('짜장') || lowerCategory.includes('짬뽕') || lowerCategory.includes('중화')) {
        return '중식';
    }

    return null;
}


/**
 * Naver 지역 검색 API
 */
export async function searchLocalRestaurants(
    query: string,
    clientId: string,
    clientSecret: string,
    display: number = 5,
    start: number = 1
): Promise<SearchResponse> {
    try {
        const response = await fetch(
            `${NAVER_API_BASE}/local.json?query=${encodeURIComponent(query)}&display=${display}&start=${start}&sort=comment`,
            {
                headers: {
                    'X-Naver-Client-Id': clientId,
                    'X-Naver-Client-Secret': clientSecret,
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Search failed: ${response.status}`);
        }

        const data: NaverSearchResponse = await response.json();

        // 각 식당에 대해 이미지 검색 (병렬 처리)
        const restaurantsWithImages = await Promise.all(
            data.items.map(async (item, index) => {
                const name = item.title.replace(/<[^>]*>/g, '');

                // 이미지 검색 (실패해도 계속 진행)
                let imageUrl: string | undefined;
                try {
                    const image = await searchImage(name, clientId, clientSecret);
                    if (image) imageUrl = image;
                } catch {
                    // 이미지 검색 실패 시 무시
                }

                // 좌표 변환 (네이버 API는 mapx, mapy를 1e7 배로 반환)
                const lng = parseInt(item.mapx, 10) / 10000000;
                const lat = parseInt(item.mapy, 10) / 10000000;

                return {
                    id: `naver-${start + index}`,
                    name,
                    category: item.category,
                    address: item.address,
                    roadAddress: item.roadAddress,
                    telephone: item.telephone,
                    link: item.link,
                    imageUrl,
                    keywords: extractKeywords(item.category, item.description),
                    coordinates: { lat, lng },
                };
            })
        );

        return {
            success: true,
            data: restaurantsWithImages,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : '검색 중 오류 발생',
        };
    }
}

/**
 * 카테고리와 설명에서 키워드 추출
 */
function extractKeywords(category: string, description: string): string[] {
    const keywords: string[] = [];
    const text = `${category} ${description}`.toLowerCase();

    // 키워드 매핑
    const keywordMap: Record<string, string[]> = {
        '룸': ['룸', '개별룸', '프라이빗'],
        '주차': ['주차', '발렛'],
        '단체': ['단체', '회식', '대형'],
        '분위기': ['분위기', '데이트', '인스타'],
        '가성비': ['가성비', '저렴', '착한가격'],
    };

    for (const [key, patterns] of Object.entries(keywordMap)) {
        if (patterns.some((p) => text.includes(p))) {
            keywords.push(`#${key}`);
        }
    }

    return keywords;
}

/**
 * 지하철역 검색
 */
export async function searchNearestStation(
    lat: number,
    lng: number,
    clientId: string,
    clientSecret: string
): Promise<{ name: string; address: string; distance: number } | null> {
    try {
        // 좌표 기반 지하철역 검색
        const response = await fetch(
            `${NAVER_API_BASE}/local.json?query=지하철역&display=1&sort=random`,
            {
                headers: {
                    'X-Naver-Client-Id': clientId,
                    'X-Naver-Client-Secret': clientSecret,
                },
            }
        );

        if (!response.ok) {
            return null;
        }

        const data: NaverSearchResponse = await response.json();

        if (data.items.length > 0) {
            const station = data.items[0];
            return {
                name: station.title.replace(/<[^>]*>/g, ''),
                address: station.roadAddress || station.address,
                distance: 0, // 거리 계산은 별도로 필요
            };
        }

        return null;
    } catch {
        return null;
    }
}
