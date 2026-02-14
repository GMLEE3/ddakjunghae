import type { ContextModeInfo, RecommendationType } from '@/types';

// 음식 장르 정보 (기존 CONTEXT_MODES 대체)
export const CONTEXT_MODES: ContextModeInfo[] = [
    {
        id: 'meat',
        label: '고기',
        emoji: '🥩',
        description: '삼겹살, 갈비, BBQ',
        keywords: ['#삼겹살', '#갈비', '#고기집', '#BBQ'],
        color: 'red',
    },
    {
        id: 'seafood',
        label: '회/해산물',
        emoji: '🐟',
        description: '회, 초밥, 해산물',
        keywords: ['#회', '#초밥', '#해산물', '#신선한'],
        color: 'blue',
    },
    {
        id: 'cafe',
        label: '카페',
        emoji: '☕',
        description: '카페, 디저트, 브런치',
        keywords: ['#카페', '#디저트', '#브런치', '#인스타'],
        color: 'brown',
    },
    {
        id: 'korean',
        label: '한식',
        emoji: '🍚',
        description: '국밥, 찌개, 백반',
        keywords: ['#한식', '#국밥', '#찌개', '#가정식'],
        color: 'green',
    },
    {
        id: 'japanese',
        label: '일식',
        emoji: '🍣',
        description: '라멘, 초밥, 돈카츠',
        keywords: ['#일식', '#라멘', '#돈카츠', '#우동'],
        color: 'orange',
    },
    {
        id: 'chinese',
        label: '중식',
        emoji: '🥢',
        description: '짜장면, 짬뽕, 탕수육',
        keywords: ['#중식', '#짜장면', '#짬뽕', '#중화요리'],
        color: 'yellow',
    },
];

// 추천 타입 정보 (통합형)
export const RECOMMENDATION_TYPES: RecommendationType[] = [
    {
        id: 'recommend',
        label: 'AI 추천',
        emoji: '✨',
        description: 'AI가 분석한 맞춤 맛집',
    },
];

// 음식 장르별 검색 키워드
export const CONTEXT_SEARCH_KEYWORDS: Record<string, string[]> = {
    meat: ['삼겹살', '갈비', '고기', 'BBQ', '구이'],
    seafood: ['회', '초밥', '해산물', '횟집', '스시'],
    cafe: ['카페', '디저트', '브런치', '베이커리', '커피'],
    korean: ['한식', '국밥', '찌개', '백반', '정식'],
    japanese: ['일식', '라멘', '돈카츠', '우동', '초밥'],
    chinese: ['중식', '짜장면', '짬뽕', '탕수육', '중화요리'],
};

// API 엔드포인트
export const API_ENDPOINTS = {
    GEOCODE: '/api/geocode',
    SEARCH: '/api/search',
    MIDPOINT: '/api/midpoint',
    RECOMMEND: '/api/recommend',
} as const;
