// AI 추천 타입 (룰렛 컴포넌트용)
export interface AIRecommendation {
    type: string;
    name?: string;
    description?: string;
    [key: string]: unknown;
}

// 모임 컨텍스트 모드
export type ContextMode = 'company' | 'friends' | 'romantic';

// 컨텍스트 모드 정보 (상수용)
export interface ContextModeInfo {
    id: string;
    label: string;
    emoji: string;
    description: string;
    keywords: string[];
    color: string;
}

// 추천 타입 정보
export interface RecommendationType {
    id: string;
    label: string;
    emoji: string;
    description: string;
}

// 식당 정보
export interface Restaurant {
    id: string;
    name: string;
    category: string;
    address: string;
    roadAddress: string;
    telephone: string;
    link: string;
    imageUrl?: string;
    keywords: string[];
    coordinates: { lat: number; lng: number };
}

// 검색 API 응답
export interface SearchResponse {
    success: boolean;
    data?: Restaurant[];
    error?: string;
}

// 위치 관련 타입
export interface Location {
    id: string;
    address: string;
    label?: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
}

// 중간 지점 후보 역
export interface MidpointCandidate {
    station: {
        name: string;
        address: string;
        line?: string;
        lat: number;
        lng: number;
    };
    times: Array<{ originIndex: number; minutes: number }>;
    maxTime: number;
    isRecommended: boolean;
}

// 중간 지점 정보
export interface MidpointInfo {
    coordinates: {
        lat: number;
        lng: number;
    };
    calculationMethod?: string;
    nearestStation?: {
        name: string;
        address: string;
        line?: string;
        distance: number;
    };
    distanceInfo?: {
        fromOrigins: Array<{ index: number; value: number; unit: string }>;
        maxDifference: number;
        fairnessScore: string;
    };
    candidates?: MidpointCandidate[];
}

// API 응답 타입
export interface GeocodeResponse {
    success: boolean;
    data?: {
        lat: number;
        lng: number;
        address: string;
    };
    error?: string;
}

// 역/정류장 자동완성 제안
export interface TransitSuggestion {
    name: string;
    type: 'subway' | 'bus' | 'station';
    address: string;
    lat: number;
    lng: number;
}

export interface AutocompleteResponse {
    success: boolean;
    data?: TransitSuggestion[];
    error?: string;
}
