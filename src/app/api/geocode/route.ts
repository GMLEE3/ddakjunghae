import { NextRequest, NextResponse } from 'next/server';

// 카카오 키워드 검색 API - 지하철역 정확한 좌표 조회
async function kakaoKeywordSearch(query: string) {
    const kakaoApiKey = process.env.KAKAO_REST_API_KEY;
    if (!kakaoApiKey) return null;

    try {
        // SW8 = 지하철역 카테고리로 검색하여 정확한 역 좌표 확보
        const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&category_group_code=SW8&size=1`;
        const response = await fetch(url, {
            headers: { 'Authorization': `KakaoAK ${kakaoApiKey}` },
        });

        if (!response.ok) return null;
        const data = await response.json();

        if (data.documents && data.documents.length > 0) {
            const place = data.documents[0];
            return {
                success: true,
                data: {
                    lat: parseFloat(place.y),
                    lng: parseFloat(place.x),
                    address: place.place_name || query,
                },
            };
        }

        // 지하철역 카테고리에 없으면 일반 검색
        const generalUrl = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=1`;
        const generalRes = await fetch(generalUrl, {
            headers: { 'Authorization': `KakaoAK ${kakaoApiKey}` },
        });

        if (!generalRes.ok) return null;
        const generalData = await generalRes.json();

        if (generalData.documents && generalData.documents.length > 0) {
            const place = generalData.documents[0];
            return {
                success: true,
                data: {
                    lat: parseFloat(place.y),
                    lng: parseFloat(place.x),
                    address: place.place_name || query,
                },
            };
        }
    } catch (error) {
        console.error('Kakao keyword search error:', error);
    }

    return null;
}

// 네이버 클라우드 Geocoding API 호출
async function naverGeocode(address: string, clientId: string, clientSecret: string) {
    const url = `https://maps.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(address)}`;

    const response = await fetch(url, {
        headers: {
            'X-NCP-APIGW-API-KEY-ID': clientId,
            'X-NCP-APIGW-API-KEY': clientSecret,
        },
    });

    if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.addresses && data.addresses.length > 0) {
        const result = data.addresses[0];
        return {
            success: true,
            data: {
                lat: parseFloat(result.y),
                lng: parseFloat(result.x),
                address: result.roadAddress || result.jibunAddress || address,
            },
        };
    }

    return { success: false, error: '주소를 찾을 수 없습니다' };
}

// 폴백용 주요 지역 좌표 데이터
const LOCATION_COORDINATES: Record<string, { lat: number; lng: number }> = {
    '강남': { lat: 37.4979, lng: 127.0276 },
    '홍대': { lat: 37.5563, lng: 126.9220 },
    '종각': { lat: 37.5701, lng: 126.9830 },
    '명동': { lat: 37.5636, lng: 126.9869 },
    '이태원': { lat: 37.5345, lng: 126.9946 },
    '당진': { lat: 36.8898, lng: 126.6295 },
    '천안': { lat: 36.8151, lng: 127.1139 },
    '수원': { lat: 37.2636, lng: 127.0286 },
    '부산': { lat: 35.1796, lng: 129.0756 },
    '대구': { lat: 35.8714, lng: 128.6014 },
    '인천': { lat: 37.4563, lng: 126.7052 },
    '대전': { lat: 36.3504, lng: 127.3845 },
    '광주': { lat: 35.1595, lng: 126.8526 },
    '제주': { lat: 33.4996, lng: 126.5312 },
};

// 주요 지하철역 좌표 (중복 제거, 알파벳순)
const SUBWAY_STATION_COORDINATES: Record<string, { lat: number; lng: number }> = {
    // ㄱ
    '가락시장역': { lat: 37.4926, lng: 127.1181 },
    '가산디지털단지역': { lat: 37.4812, lng: 126.8827 },
    '가양역': { lat: 37.5610, lng: 126.8565 },
    '가좌역': { lat: 37.5661, lng: 126.9145 },
    '가천대역': { lat: 37.4498, lng: 127.1279 },
    '강남역': { lat: 37.4979, lng: 127.0276 },
    '강남구청역': { lat: 37.5173, lng: 127.0415 },
    '강동역': { lat: 37.5353, lng: 127.1323 },
    '강동구청역': { lat: 37.5306, lng: 127.1242 },
    '강매역': { lat: 37.6012, lng: 126.8663 },
    '강변역': { lat: 37.5350, lng: 127.0944 },
    '개롱역': { lat: 37.4929, lng: 127.1219 },
    '개포동역': { lat: 37.4770, lng: 127.0564 },
    '개화역': { lat: 37.5791, lng: 126.8057 },
    '개화산역': { lat: 37.5723, lng: 126.8237 },
    '거여역': { lat: 37.4921, lng: 127.1128 },
    '건대입구역': { lat: 37.5404, lng: 127.0696 },
    '검암역': { lat: 37.5612, lng: 126.6709 },
    '경마공원역': { lat: 37.4426, lng: 126.9894 },
    '경복궁역': { lat: 37.5759, lng: 126.9738 },
    '계양역': { lat: 37.5363, lng: 126.7358 },
    '고덕역': { lat: 37.5548, lng: 127.1543 },
    '고려대역': { lat: 37.5902, lng: 127.0338 },
    '고속터미널역': { lat: 37.5049, lng: 127.0050 },
    '고잔역': { lat: 37.3210, lng: 126.8256 },
    '곡산역': { lat: 37.6624, lng: 126.7306 },
    '공덕역': { lat: 37.5441, lng: 126.9517 },
    '공릉역': { lat: 37.6255, lng: 127.0729 },
    '공항시장역': { lat: 37.5599, lng: 126.8121 },
    '공항화물청사역': { lat: 37.4421, lng: 126.4765 },
    '과천역': { lat: 37.4328, lng: 126.9965 },
    '광교역': { lat: 37.3025, lng: 127.0451 },
    '광교중앙역': { lat: 37.2858, lng: 127.0544 },
    '광나루역': { lat: 37.5457, lng: 127.1032 },
    '광명사거리역': { lat: 37.4788, lng: 126.8635 },
    '광운대역': { lat: 37.6222, lng: 127.0615 },
    '광화문역': { lat: 37.5714, lng: 126.9766 },
    '광흥창역': { lat: 37.5478, lng: 126.9318 },
    '교대역': { lat: 37.4934, lng: 127.0146 },
    '구로역': { lat: 37.5033, lng: 126.8824 },
    '구로디지털단지역': { lat: 37.4852, lng: 126.9014 },
    '구룡역': { lat: 37.4853, lng: 127.0556 },
    '구반포역': { lat: 37.5075, lng: 126.9878 },
    '구산역': { lat: 37.6110, lng: 126.9123 },
    '구성역': { lat: 37.2996, lng: 127.1066 },
    '구의역': { lat: 37.5381, lng: 127.0864 },
    '구파발역': { lat: 37.6381, lng: 126.9183 },
    '국회의사당역': { lat: 37.5287, lng: 126.9176 },
    '군자역': { lat: 37.5572, lng: 127.0795 },
    '굽은다리역': { lat: 37.5354, lng: 127.1548 },
    '금릉역': { lat: 37.7405, lng: 126.5933 },
    '금정역': { lat: 37.3715, lng: 126.8855 },
    '금촌역': { lat: 37.7568, lng: 126.5778 },
    '금천구청역': { lat: 37.4567, lng: 126.8952 },
    '금호역': { lat: 37.5477, lng: 127.0179 },
    '기흥역': { lat: 37.2755, lng: 127.1159 },
    '길동역': { lat: 37.5353, lng: 127.1433 },
    '길음역': { lat: 37.6034, lng: 127.0251 },
    '김포공항역': { lat: 37.5620, lng: 126.8010 },
    '까치산역': { lat: 37.5328, lng: 126.8473 },

    // ㄴ
    '낙성대역': { lat: 37.4768, lng: 126.9636 },
    '남구로역': { lat: 37.4849, lng: 126.8867 },
    '남부터미널역': { lat: 37.4848, lng: 127.0150 },
    '남성역': { lat: 37.4857, lng: 126.9739 },
    '남영역': { lat: 37.5412, lng: 126.9715 },
    '남태령역': { lat: 37.4645, lng: 126.9785 },
    '남한산성입구역': { lat: 37.4500, lng: 127.1551 },
    '내방역': { lat: 37.4879, lng: 126.9971 },
    '노들역': { lat: 37.5128, lng: 126.9520 },
    '노량진역': { lat: 37.5135, lng: 126.9426 },
    '노원역': { lat: 37.6557, lng: 127.0616 },
    '녹번역': { lat: 37.6008, lng: 126.9358 },
    '녹사평역': { lat: 37.5344, lng: 126.9870 },
    '녹천역': { lat: 37.6273, lng: 127.0551 },
    '논현역': { lat: 37.5115, lng: 127.0215 },
    '능곡역': { lat: 37.6196, lng: 126.8180 },

    // ㄷ
    '단대오거리역': { lat: 37.4441, lng: 127.1577 },
    '답십리역': { lat: 37.5671, lng: 127.0522 },
    '당고개역': { lat: 37.6760, lng: 127.0786 },
    '당산역': { lat: 37.5349, lng: 126.9025 },
    '대공원역': { lat: 37.4294, lng: 126.9946 },
    '대곡역': { lat: 37.6533, lng: 126.7473 },
    '대림역': { lat: 37.4928, lng: 126.8965 },
    '대모산입구역': { lat: 37.4663, lng: 127.0730 },
    '대방역': { lat: 37.5130, lng: 126.9266 },
    '대야미역': { lat: 37.3784, lng: 126.9092 },
    '대청역': { lat: 37.4919, lng: 127.0817 },
    '대치역': { lat: 37.4942, lng: 127.0633 },
    '대흥역': { lat: 37.5478, lng: 126.9421 },
    '도곡역': { lat: 37.4914, lng: 127.0546 },
    '도봉역': { lat: 37.6654, lng: 127.0434 },
    '도봉산역': { lat: 37.6893, lng: 127.0447 },
    '독립문역': { lat: 37.5723, lng: 126.9463 },
    '독바위역': { lat: 37.6126, lng: 126.9360 },
    '독산역': { lat: 37.4735, lng: 126.8872 },
    '돌곶이역': { lat: 37.6103, lng: 127.0509 },
    '동대문역': { lat: 37.5712, lng: 127.0095 },
    '동대문역사문화공원역': { lat: 37.5651, lng: 127.0086 },
    '동대입구역': { lat: 37.5582, lng: 127.0017 },
    '동묘앞역': { lat: 37.5711, lng: 127.0168 },
    '동작역': { lat: 37.5077, lng: 126.9797 },
    '동천역': { lat: 37.3338, lng: 127.0955 },
    '둔촌동역': { lat: 37.5256, lng: 127.1364 },
    '둔촌오륜역': { lat: 37.5206, lng: 127.1422 },
    '등촌역': { lat: 37.5516, lng: 126.8720 },
    '디지털미디어시티역': { lat: 37.5772, lng: 126.8998 },
    '뚝섬역': { lat: 37.5473, lng: 127.0474 },
    '뚝섬유원지역': { lat: 37.5313, lng: 127.0666 },

    // ㅁ
    '마곡역': { lat: 37.5610, lng: 126.8249 },
    '마곡나루역': { lat: 37.5678, lng: 126.8303 },
    '마들역': { lat: 37.6651, lng: 127.0584 },
    '마장역': { lat: 37.5658, lng: 127.0443 },
    '마천역': { lat: 37.4961, lng: 127.1422 },
    '마포역': { lat: 37.5393, lng: 126.9457 },
    '마포구청역': { lat: 37.5631, lng: 126.9043 },
    '망원역': { lat: 37.5559, lng: 126.9100 },
    '망월사역': { lat: 37.6998, lng: 127.0441 },
    '망포역': { lat: 37.2443, lng: 127.0566 },
    '매교역': { lat: 37.2673, lng: 127.0110 },
    '매봉역': { lat: 37.4866, lng: 127.0468 },
    '매탄권선역': { lat: 37.2378, lng: 127.0451 },
    '먹골역': { lat: 37.6106, lng: 127.0789 },
    '면목역': { lat: 37.5883, lng: 127.0870 },
    '명동역': { lat: 37.5608, lng: 126.9856 },
    '명일역': { lat: 37.5380, lng: 127.1470 },
    '모란역': { lat: 37.4329, lng: 127.1294 },
    '목동역': { lat: 37.5264, lng: 126.8667 },
    '몽촌토성역': { lat: 37.5171, lng: 127.1123 },
    '무악재역': { lat: 37.5827, lng: 126.9500 },
    '문래역': { lat: 37.5177, lng: 126.8947 },
    '문산역': { lat: 37.8577, lng: 126.7832 },
    '문정역': { lat: 37.4858, lng: 127.1228 },
    '미금역': { lat: 37.3514, lng: 127.1095 },
    '미아역': { lat: 37.6268, lng: 127.0269 },
    '미아사거리역': { lat: 37.6132, lng: 127.0300 },

    // ㅂ
    '반월역': { lat: 37.3866, lng: 126.8941 },
    '반포역': { lat: 37.5082, lng: 127.0136 },
    '발산역': { lat: 37.5570, lng: 126.8389 },
    '방배역': { lat: 37.4816, lng: 126.9977 },
    '방이역': { lat: 37.5082, lng: 127.1269 },
    '방학역': { lat: 37.6583, lng: 127.0439 },
    '방화역': { lat: 37.5729, lng: 126.8156 },
    '백마역': { lat: 37.6744, lng: 126.7087 },
    '버티고개역': { lat: 37.5474, lng: 127.0066 },
    '범계역': { lat: 37.3901, lng: 126.9515 },
    '보라매역': { lat: 37.4995, lng: 126.9205 },
    '보문역': { lat: 37.5862, lng: 127.0190 },
    '보정역': { lat: 37.3128, lng: 127.1092 },
    '복정역': { lat: 37.4702, lng: 127.1264 },
    '봉은사역': { lat: 37.5144, lng: 127.0569 },
    '봉천역': { lat: 37.4826, lng: 126.9422 },
    '봉화산역': { lat: 37.6176, lng: 127.0912 },
    '부산역': { lat: 35.1152, lng: 129.0410 },
    '불광역': { lat: 37.6103, lng: 126.9296 },

    // ㅅ
    '사가정역': { lat: 37.5809, lng: 127.0884 },
    '사당역': { lat: 37.4765, lng: 126.9816 },
    '사평역': { lat: 37.5030, lng: 127.0136 },
    '산본역': { lat: 37.3590, lng: 126.9322 },
    '산성역': { lat: 37.4584, lng: 127.1383 },
    '삼각지역': { lat: 37.5347, lng: 126.9731 },
    '삼성역': { lat: 37.5088, lng: 127.0638 },
    '삼성중앙역': { lat: 37.5111, lng: 127.0510 },
    '삼전역': { lat: 37.5092, lng: 127.0859 },
    '상갈역': { lat: 37.2644, lng: 127.1186 },
    '상계역': { lat: 37.6623, lng: 127.0733 },
    '상도역': { lat: 37.5028, lng: 126.9536 },
    '상록수역': { lat: 37.3002, lng: 126.8466 },
    '상봉역': { lat: 37.5967, lng: 127.0854 },
    '상수역': { lat: 37.5476, lng: 126.9229 },
    '상왕십리역': { lat: 37.5650, lng: 127.0290 },
    '상월곡역': { lat: 37.6062, lng: 127.0406 },
    '상일동역': { lat: 37.5573, lng: 127.1651 },
    '상현역': { lat: 37.3017, lng: 127.0677 },
    '샛강역': { lat: 37.5175, lng: 126.9332 },
    '새절역': { lat: 37.5975, lng: 126.9137 },
    '서강대역': { lat: 37.5530, lng: 126.9395 },
    '서대문역': { lat: 37.5652, lng: 126.9658 },
    '서울대입구역': { lat: 37.4816, lng: 126.9527 },
    '서울숲역': { lat: 37.5436, lng: 127.0444 },
    '서울역': { lat: 37.5547, lng: 126.9706 },
    '서초역': { lat: 37.4917, lng: 127.0078 },
    '서현역': { lat: 37.3850, lng: 127.1225 },
    '석계역': { lat: 37.6152, lng: 127.0661 },
    '석촌역': { lat: 37.5054, lng: 127.1014 },
    '석촌고분역': { lat: 37.5062, lng: 127.0949 },
    '선릉역': { lat: 37.5045, lng: 127.0490 },
    '선바위역': { lat: 37.4527, lng: 126.9826 },
    '선유도역': { lat: 37.5395, lng: 126.8959 },
    '선정릉역': { lat: 37.5100, lng: 127.0435 },
    '성복역': { lat: 37.3144, lng: 127.0782 },
    '성수역': { lat: 37.5446, lng: 127.0559 },
    '성신여대입구역': { lat: 37.5927, lng: 127.0169 },
    '송정역': { lat: 37.5570, lng: 126.8036 },
    '송파역': { lat: 37.5004, lng: 127.1077 },
    '송파나루역': { lat: 37.5049, lng: 127.1108 },
    '수내역': { lat: 37.3772, lng: 127.1142 },
    '수락산역': { lat: 37.6749, lng: 127.0565 },
    '수리산역': { lat: 37.3688, lng: 126.9162 },
    '수색역': { lat: 37.5838, lng: 126.8956 },
    '수서역': { lat: 37.4873, lng: 127.1018 },
    '수원역': { lat: 37.2660, lng: 127.0017 },
    '수원시청역': { lat: 37.2628, lng: 127.0317 },
    '수유역': { lat: 37.6378, lng: 127.0252 },
    '수진역': { lat: 37.4362, lng: 127.1422 },
    '수지구청역': { lat: 37.3223, lng: 127.0876 },
    '숙대입구역': { lat: 37.5452, lng: 126.9720 },
    '숭실대입구역': { lat: 37.4962, lng: 126.9538 },
    '시청역': { lat: 37.5647, lng: 126.9772 },
    '신갈역': { lat: 37.2867, lng: 127.1060 },
    '신금호역': { lat: 37.5548, lng: 127.0248 },
    '신길역': { lat: 37.5172, lng: 126.9140 },
    '신내역': { lat: 37.6119, lng: 127.1035 },
    '신논현역': { lat: 37.5046, lng: 127.0252 },
    '신당역': { lat: 37.5659, lng: 127.0177 },
    '신대방역': { lat: 37.4876, lng: 126.9130 },
    '신대방삼거리역': { lat: 37.4993, lng: 126.9266 },
    '신도림역': { lat: 37.5088, lng: 126.8913 },
    '신림역': { lat: 37.4842, lng: 126.9296 },
    '신목동역': { lat: 37.5439, lng: 126.8832 },
    '신반포역': { lat: 37.5086, lng: 126.9959 },
    '신방화역': { lat: 37.5571, lng: 126.8208 },
    '신사역': { lat: 37.5168, lng: 127.0203 },
    '신설동역': { lat: 37.5760, lng: 127.0250 },
    '신용산역': { lat: 37.5282, lng: 126.9715 },
    '신이문역': { lat: 37.5964, lng: 127.0674 },
    '신정역': { lat: 37.5249, lng: 126.8556 },
    '신촌역': { lat: 37.5559, lng: 126.9369 },
    '신풍역': { lat: 37.5082, lng: 126.9121 },
    '신흥역': { lat: 37.4379, lng: 127.1528 },
    '쌍문역': { lat: 37.6485, lng: 127.0343 },

    // ㅇ
    '아현역': { lat: 37.5578, lng: 126.9560 },
    '아차산역': { lat: 37.5518, lng: 127.0896 },
    '안국역': { lat: 37.5763, lng: 126.9854 },
    '안산역': { lat: 37.3246, lng: 126.7903 },
    '안암역': { lat: 37.5860, lng: 127.0290 },
    '안양역': { lat: 37.4019, lng: 126.9223 },
    '암사역': { lat: 37.5505, lng: 127.1272 },
    '압구정역': { lat: 37.5270, lng: 127.0283 },
    '압구정로데오역': { lat: 37.5271, lng: 127.0396 },
    '애오개역': { lat: 37.5528, lng: 126.9565 },
    '야당역': { lat: 37.7167, lng: 126.6387 },
    '야탑역': { lat: 37.4112, lng: 127.1272 },
    '약수역': { lat: 37.5544, lng: 127.0103 },
    '양재역': { lat: 37.4842, lng: 127.0345 },
    '양재시민의숲역': { lat: 37.4699, lng: 127.0384 },
    '양천향교역': { lat: 37.5609, lng: 126.8482 },
    '양평역': { lat: 37.5252, lng: 126.8857 },
    '어린이대공원역': { lat: 37.5478, lng: 127.0745 },
    '언주역': { lat: 37.5063, lng: 127.0342 },
    '여의나루역': { lat: 37.5272, lng: 126.9326 },
    '여의도역': { lat: 37.5219, lng: 126.9244 },
    '역삼역': { lat: 37.5007, lng: 127.0365 },
    '역촌역': { lat: 37.6067, lng: 126.9220 },
    '연신내역': { lat: 37.6192, lng: 126.9210 },
    '염창역': { lat: 37.5465, lng: 126.8770 },
    '영등포역': { lat: 37.5158, lng: 126.9074 },
    '영등포구청역': { lat: 37.5254, lng: 126.8966 },
    '영등포시장역': { lat: 37.5226, lng: 126.9047 },
    '영종역': { lat: 37.4849, lng: 126.5354 },
    '영통역': { lat: 37.2503, lng: 127.0733 },
    '오금역': { lat: 37.5022, lng: 127.1280 },
    '오리역': { lat: 37.3396, lng: 127.1087 },
    '오송역': { lat: 36.6267, lng: 127.0111 },
    '오목교역': { lat: 37.5245, lng: 126.8752 },
    '옥수역': { lat: 37.5403, lng: 127.0176 },
    '올림픽공원역': { lat: 37.5166, lng: 127.1318 },
    '온수역': { lat: 37.4920, lng: 126.8238 },
    '왕십리역': { lat: 37.5614, lng: 127.0379 },
    '외대앞역': { lat: 37.5970, lng: 127.0639 },
    '용마산역': { lat: 37.5735, lng: 127.0873 },
    '용산역': { lat: 37.5299, lng: 126.9647 },
    '우장산역': { lat: 37.5488, lng: 126.8368 },
    '운서역': { lat: 37.4341, lng: 126.5101 },
    '운정역': { lat: 37.7263, lng: 126.6188 },
    '월계역': { lat: 37.6232, lng: 127.0585 },
    '월곡역': { lat: 37.5999, lng: 127.0380 },
    '월드컵경기장역': { lat: 37.5682, lng: 126.8973 },
    '월롱역': { lat: 37.7780, lng: 126.5553 },
    '을지로3가역': { lat: 37.5663, lng: 126.9919 },
    '을지로4가역': { lat: 37.5671, lng: 127.0001 },
    '을지로입구역': { lat: 37.5660, lng: 126.9821 },
    '응암역': { lat: 37.5979, lng: 126.9131 },
    '의정부역': { lat: 37.7383, lng: 127.0459 },
    '이대역': { lat: 37.5568, lng: 126.9463 },
    '이매역': { lat: 37.3944, lng: 127.1272 },
    '이수역': { lat: 37.4850, lng: 126.9817 },
    '이촌역': { lat: 37.5218, lng: 126.9703 },
    '이태원역': { lat: 37.5345, lng: 126.9946 },
    '인덕원역': { lat: 37.4019, lng: 126.9771 },
    '인천공항1터미널역': { lat: 37.4414, lng: 126.4526 },
    '인천공항2터미널역': { lat: 37.4619, lng: 126.4430 },
    '일산역': { lat: 37.6997, lng: 126.6788 },
    '일원역': { lat: 37.4833, lng: 127.0868 },

    // ㅈ
    '잠실역': { lat: 37.5133, lng: 127.1001 },
    '잠실나루역': { lat: 37.5201, lng: 127.1037 },
    '잠실새내역': { lat: 37.5117, lng: 127.0861 },
    '잠원역': { lat: 37.5113, lng: 127.0145 },
    '장승배기역': { lat: 37.5041, lng: 126.9404 },
    '장암역': { lat: 37.7079, lng: 127.0532 },
    '장지역': { lat: 37.4788, lng: 127.1263 },
    '장한평역': { lat: 37.5611, lng: 127.0644 },
    '정부과천청사역': { lat: 37.4265, lng: 126.9898 },
    '정자역': { lat: 37.3665, lng: 127.1085 },
    '제기동역': { lat: 37.5806, lng: 127.0345 },
    '종각역': { lat: 37.5700, lng: 126.9826 },
    '종로3가역': { lat: 37.5710, lng: 126.9920 },
    '종로5가역': { lat: 37.5707, lng: 127.0028 },
    '종합운동장역': { lat: 37.5108, lng: 127.0736 },
    '죽전역': { lat: 37.3252, lng: 127.1073 },
    '중계역': { lat: 37.6447, lng: 127.0644 },
    '중곡역': { lat: 37.5665, lng: 127.0839 },
    '중앙역': { lat: 37.3143, lng: 126.8653 },
    '중앙보훈병원역': { lat: 37.5256, lng: 127.1477 },
    '중화역': { lat: 37.6021, lng: 127.0830 },
    '증미역': { lat: 37.5585, lng: 126.8644 },
    '증산역': { lat: 37.5838, lng: 126.9098 },
    '지축역': { lat: 37.6481, lng: 126.9131 },

    // ㅊ
    '창동역': { lat: 37.6530, lng: 127.0473 },
    '창신역': { lat: 37.5798, lng: 127.0151 },
    '천왕역': { lat: 37.4868, lng: 126.8530 },
    '천호역': { lat: 37.5387, lng: 127.1237 },
    '철산역': { lat: 37.4766, lng: 126.8688 },
    '청계산입구역': { lat: 37.4483, lng: 127.0547 },
    '청구역': { lat: 37.5599, lng: 127.0194 },
    '청담역': { lat: 37.5197, lng: 127.0531 },
    '청량리역': { lat: 37.5803, lng: 127.0467 },
    '청라국제도시역': { lat: 37.5220, lng: 126.6532 },
    '청명역': { lat: 37.2541, lng: 127.0772 },
    '초지역': { lat: 37.3182, lng: 126.8059 },
    '총신대입구역': { lat: 37.4876, lng: 126.9817 },
    '충무로역': { lat: 37.5612, lng: 126.9948 },
    '충정로역': { lat: 37.5599, lng: 126.9630 },

    // ㅌ
    '탄현역': { lat: 37.7077, lng: 126.6601 },
    '태릉입구역': { lat: 37.6175, lng: 127.0754 },
    '태평역': { lat: 37.4406, lng: 127.1273 },

    // ㅍ
    '파주역': { lat: 37.8101, lng: 126.8129 },
    '판교역': { lat: 37.3947, lng: 127.1112 },
    '평촌역': { lat: 37.3944, lng: 126.9649 },
    '풍산역': { lat: 37.6891, lng: 126.6891 },

    // ㅎ
    '하계역': { lat: 37.6368, lng: 127.0669 },
    '학동역': { lat: 37.5150, lng: 127.0318 },
    '학여울역': { lat: 37.4965, lng: 127.0718 },
    '한강진역': { lat: 37.5391, lng: 127.0010 },
    '한대앞역': { lat: 37.3094, lng: 126.8538 },
    '한성대입구역': { lat: 37.5887, lng: 127.0066 },
    '한성백제역': { lat: 37.5047, lng: 127.1192 },
    '한양대역': { lat: 37.5556, lng: 127.0438 },
    '한티역': { lat: 37.4977, lng: 127.0542 },
    '합정역': { lat: 37.5495, lng: 126.9139 },
    '행당역': { lat: 37.5508, lng: 127.0323 },
    '행신역': { lat: 37.6118, lng: 126.8361 },
    '혜화역': { lat: 37.5824, lng: 127.0018 },
    '홍대입구역': { lat: 37.5563, lng: 126.9220 },
    '홍제역': { lat: 37.5892, lng: 126.9436 },
    '화곡역': { lat: 37.5418, lng: 126.8397 },
    '화랑대역': { lat: 37.6203, lng: 127.0845 },
    '화전역': { lat: 37.5951, lng: 126.8799 },
    '회기역': { lat: 37.5896, lng: 127.0578 },
    '회룡역': { lat: 37.7198, lng: 127.0456 },
    '회현역': { lat: 37.5585, lng: 126.9784 },
    '효창공원앞역': { lat: 37.5397, lng: 126.9614 },
    '흑석역': { lat: 37.5082, lng: 126.9628 },
};

export async function POST(request: NextRequest) {
    try {
        const { address } = await request.json();

        if (!address || typeof address !== 'string') {
            return NextResponse.json(
                { success: false, error: '주소를 입력해주세요' },
                { status: 400 }
            );
        }

        // 주소에서 역 이름 추출 (예: "혜화역 4호선" -> "혜화역")
        const normalizedAddress = address.trim();
        let stationName = normalizedAddress;

        // 괄호/대괄호 안의 노선 정보 제거 (예: "오송역 (고속철도)" -> "오송역", "부산역 [고속철도]" -> "부산역")
        stationName = stationName.replace(/\s*[\(\[（【].*?[\)\]）】]/g, '').trim();

        // "역"이 포함되어 있고 노선 정보가 붙어있으면 역 이름만 추출
        if (stationName.includes('역')) {
            const match = stationName.match(/^([가-힣a-zA-Z0-9]+역)/);
            if (match) {
                stationName = match[1];
            }
        }

        // 1순위: 카카오 키워드 검색 (정확한 장소 좌표)
        const kakaoResult = await kakaoKeywordSearch(stationName);
        if (kakaoResult) {
            return NextResponse.json(kakaoResult);
        }

        // 2순위: 네이버 클라우드 Geocoding API
        const cloudClientId = process.env.NAVER_CLOUD_CLIENT_ID;
        const cloudClientSecret = process.env.NAVER_CLOUD_CLIENT_SECRET;

        if (cloudClientId && cloudClientSecret) {
            try {
                const result = await naverGeocode(stationName, cloudClientId, cloudClientSecret);
                if (result.success) {
                    return NextResponse.json(result);
                }
            } catch (error) {
                console.error('Naver Cloud Geocoding error:', error);
                // 폴백으로 진행
            }
        }

        // 2순위: 하드코딩된 지하철역 좌표
        if (SUBWAY_STATION_COORDINATES[stationName]) {
            const coords = SUBWAY_STATION_COORDINATES[stationName];
            return NextResponse.json({
                success: true,
                data: {
                    lat: coords.lat,
                    lng: coords.lng,
                    address: stationName,
                },
            });
        }

        // 부분 매칭 시도 - 가장 정확한 매칭 우선
        // "부산" -> "부산역" (정확한 baseName 매칭)
        const stationNameWithoutSuffix = stationName.replace(/역$/, '');

        // 1. 정확한 이름 매칭 (역 접미사 없이 입력한 경우)
        const exactKey = stationNameWithoutSuffix + '역';
        if (SUBWAY_STATION_COORDINATES[exactKey]) {
            const coords = SUBWAY_STATION_COORDINATES[exactKey];
            return NextResponse.json({
                success: true,
                data: {
                    lat: coords.lat,
                    lng: coords.lng,
                    address: exactKey,
                },
            });
        }

        // 2. 부분 매칭 - 가장 긴 매칭을 우선시
        let bestMatch: { station: string; coords: { lat: number; lng: number } } | null = null;
        let bestMatchLength = 0;

        for (const [station, coords] of Object.entries(SUBWAY_STATION_COORDINATES)) {
            const baseName = station.replace('역', '');
            if (stationNameWithoutSuffix === baseName || normalizedAddress.includes(baseName)) {
                if (baseName.length > bestMatchLength) {
                    bestMatch = { station, coords };
                    bestMatchLength = baseName.length;
                }
            }
        }

        if (bestMatch) {
            return NextResponse.json({
                success: true,
                data: {
                    lat: bestMatch.coords.lat,
                    lng: bestMatch.coords.lng,
                    address: bestMatch.station,
                },
            });
        }

        // 3순위: 하드코딩된 지역 좌표
        for (const [keyword, coords] of Object.entries(LOCATION_COORDINATES)) {
            if (address.includes(keyword)) {
                return NextResponse.json({
                    success: true,
                    data: {
                        lat: coords.lat,
                        lng: coords.lng,
                        address,
                    },
                });
            }
        }

        return NextResponse.json(
            { success: false, error: '좌표를 찾을 수 없습니다.' },
            { status: 404 }
        );
    } catch (error) {
        console.error('Error in geocode POST:', error);
        return NextResponse.json(
            { success: false, error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
