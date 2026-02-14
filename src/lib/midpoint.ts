import type { Location } from '@/types';

/**
 * 여러 좌표의 평균 중간 지점 계산
 */
export function calculateMidpoint(
    coordinates: Array<{ lat: number; lng: number }>
): { lat: number; lng: number } {
    if (coordinates.length === 0) {
        throw new Error('좌표가 없습니다');
    }

    if (coordinates.length === 1) {
        return coordinates[0];
    }

    // 간단한 평균 계산 (소규모 지역에서 유효)
    const sum = coordinates.reduce(
        (acc, coord) => ({
            lat: acc.lat + coord.lat,
            lng: acc.lng + coord.lng,
        }),
        { lat: 0, lng: 0 }
    );

    return {
        lat: sum.lat / coordinates.length,
        lng: sum.lng / coordinates.length,
    };
}

/**
 * 두 좌표 사이의 거리 계산 (Haversine formula, km)
 */
export function calculateDistance(
    coord1: { lat: number; lng: number },
    coord2: { lat: number; lng: number }
): number {
    const R = 6371; // 지구 반경 (km)
    const dLat = toRad(coord2.lat - coord1.lat);
    const dLng = toRad(coord2.lng - coord1.lng);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(coord1.lat)) *
        Math.cos(toRad(coord2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg: number): number {
    return (deg * Math.PI) / 180;
}

/**
 * 유효한 주소인지 확인
 */
export function isValidAddress(address: string): boolean {
    // 최소 2글자 이상, 공백만 있는 경우 제외
    return address.trim().length >= 2;
}

/**
 * 위치 배열에서 유효한 좌표만 필터링
 */
export function getValidCoordinates(
    locations: Location[]
): Array<{ lat: number; lng: number }> {
    return locations
        .filter((loc) => loc.coordinates)
        .map((loc) => loc.coordinates!);
}

/**
 * 고유 ID 생성
 */
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
