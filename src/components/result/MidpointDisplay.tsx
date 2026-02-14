'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { MidpointInfo, MidpointCandidate } from '@/types';
import Roulette from './Roulette';

interface OriginInfo {
    name: string;
    lat: number;
    lng: number;
}

interface MidpointDisplayProps {
    midpoint: MidpointInfo;
    origins?: OriginInfo[];
    selectedCandidateIndex?: number;
    onCandidateSelect?: (candidate: MidpointCandidate, index: number) => void;
}

// 주소에서 짧은 이름 추출 (역 이름 우선)
const getShortName = (address: string): string => {
    // 이미 "OO역" 형태면 그대로 반환 (숫자, 영문 포함)
    if (/^[가-힣a-zA-Z0-9]+역$/.test(address.trim())) {
        return address.trim();
    }

    // "OO역 N호선" 형태면 역 이름만 추출 (숫자, 영문 포함)
    const stationLineMatch = address.match(/^([가-힣a-zA-Z0-9]+역)\s*[\d호선]*/);
    if (stationLineMatch) return stationLineMatch[1];

    // 주소에서 역 이름 추출 (숫자, 영문 포함)
    const stationMatch = address.match(/([가-힣a-zA-Z0-9]+역)/);
    if (stationMatch) return stationMatch[1];

    // 그 외 경우 첫 번째 의미 있는 단어 반환
    const parts = address.split(' ').filter(p => p.length > 0);
    return parts[0] || address;
};

// WGS84 -> EPSG:3857 (Web Mercator) 좌표 변환
const toEPSG3857 = (lat: number, lng: number): { x: number; y: number } => {
    const x = lng * 20037508.34 / 180;
    const y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
    return { x, y: y * 20037508.34 / 180 };
};

// 네이버 지도 대중교통 경로 URL 생성 (EPSG:3857 좌표 기반)
const getNaverMapRouteUrl = (
    startLat: number, startLng: number,
    endLat: number, endLng: number,
    startName: string, endName: string
): string => {
    const start = toEPSG3857(startLat, startLng);
    const end = toEPSG3857(endLat, endLng);
    const s = `${start.x.toFixed(4)},${start.y.toFixed(4)},${encodeURIComponent(startName)},,PLACE_POI`;
    const e = `${end.x.toFixed(4)},${end.y.toFixed(4)},${encodeURIComponent(endName)},,PLACE_POI`;
    return `https://map.naver.com/p/directions/${s}/${e}/-/transit`;
};

// 색상 배열
const COLORS = ['#00d4ff', '#ff00d4', '#8b5cf6', '#00d4ff', '#ff00d4'];

export function MidpointDisplay({
    midpoint,
    origins = [],
    selectedCandidateIndex = 0,
    onCandidateSelect
}: MidpointDisplayProps) {
    const [isRouletteOpen, setIsRouletteOpen] = useState(false);

    const candidates = midpoint.candidates || [];
    const selectedCandidate = candidates[selectedCandidateIndex];
    const displayStation = selectedCandidate?.station || midpoint.nearestStation;
    const displayTimes = selectedCandidate?.times || [];

    const handleRouteClick = async (originIndex: number) => {
        const origin = origins[originIndex];
        if (!origin || !displayStation) return;

        // 출발지 이름에서 괄호 제거 후 역 이름 추출
        let startName = origin.name.replace(/\s*[\(\[（【].*?[\)\]）】]/g, '').trim();
        const stationMatch = startName.match(/([가-힣a-zA-Z0-9]+역)/);
        if (stationMatch) {
            startName = stationMatch[1];
        }

        // 도착지 이름
        let endName = displayStation.name;
        const endMatch = endName.match(/([가-힣a-zA-Z0-9]+역)/);
        if (endMatch) {
            endName = endMatch[1];
        }

        try {
            // geocode API로 정확한 출발지 좌표 가져오기
            const res = await fetch('/api/geocode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: startName }),
            });
            const data = await res.json();

            const startLat = data.success ? data.data.lat : origin.lat;
            const startLng = data.success ? data.data.lng : origin.lng;

            const url = getNaverMapRouteUrl(
                startLat, startLng,
                displayStation.lat, displayStation.lng,
                startName, endName
            );
            window.open(url, '_blank');
        } catch {
            // 폴백: origin 좌표 사용
            const url = getNaverMapRouteUrl(
                origin.lat, origin.lng,
                displayStation.lat, displayStation.lng,
                startName, endName
            );
            window.open(url, '_blank');
        }
    };

    return (
        <div className="space-y-4">
            {/* 후보역 그리드 + 룰렛 버튼 */}
            {candidates.length > 1 && (
                <div className="space-y-4">
                    {/* 룰렛 버튼 - 상단 배치, 더 크게 */}
                    <motion.button
                        className="roulette-btn-large"
                        onClick={() => setIsRouletteOpen(true)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <span className="roulette-icon">🎰</span>
                        <span className="roulette-text">랜덤 선택</span>
                    </motion.button>

                    <p className="text-white/50 text-sm px-1">추천 중간지점</p>

                    {/* 후보역 그리드 - 2열 */}
                    <div className="candidate-grid">
                        {candidates.map((candidate, index) => (
                            <motion.button
                                key={candidate.station.name}
                                onClick={() => onCandidateSelect?.(candidate, index)}
                                className={`candidate-card-new ${index === selectedCandidateIndex ? 'active' : ''}`}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                            >
                                {candidate.isRecommended && (
                                    <span className="badge-best-new">BEST</span>
                                )}
                                <div className="card-content">
                                    <span className="card-icon">🚇</span>
                                    <div className="card-info">
                                        <span className="card-name">{candidate.station.name}</span>
                                        {candidate.station.line && (
                                            <span className="card-line">{candidate.station.line}</span>
                                        )}
                                    </div>
                                    <span className="card-time">{candidate.maxTime}분</span>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </div>
            )}

            {/* 선택된 역 상세 정보 */}
            {displayStation && (
                <motion.div
                    className="selected-station-card"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={displayStation.name}
                >
                    <div className="flex items-center gap-4">
                        <div className="station-badge">
                            🚇
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-bold text-white">{displayStation.name}</h3>
                                {displayStation.line && (
                                    <span className="text-sm text-white/50">({displayStation.line})</span>
                                )}
                            </div>
                            <p className="text-white/40 text-sm">{displayStation.address}</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* 소요시간 그리드 */}
            {displayTimes.length > 0 && (
                <div className="time-grid">
                    <p className="text-white/50 text-sm mb-3">출발지별 소요시간</p>
                    <div className="grid gap-2">
                        {displayTimes.map((timeInfo) => {
                            const originInfo = origins[timeInfo.originIndex - 1];
                            const originName = originInfo ? getShortName(originInfo.name) : `출발지 ${timeInfo.originIndex}`;
                            const canRoute = Boolean(originInfo?.name);
                            const color = COLORS[timeInfo.originIndex - 1];

                            return (
                                <motion.div
                                    key={timeInfo.originIndex}
                                    onClick={() => canRoute && handleRouteClick(timeInfo.originIndex - 1)}
                                    className={`time-item ${canRoute ? 'clickable' : ''}`}
                                    whileHover={canRoute ? { scale: 1.01, x: 4 } : {}}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-2 h-8 rounded-full"
                                            style={{ background: color }}
                                        />
                                        <span className="text-white/70">{originName}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="time-value">{timeInfo.minutes}분</span>
                                        {canRoute && <span className="text-white/30">→</span>}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 직선거리 폴백 */}
            {displayTimes.length === 0 && midpoint.distanceInfo && (
                <div className="time-grid">
                    <p className="text-white/50 text-sm mb-3">출발지별 거리</p>
                    <div className="grid gap-2">
                        {midpoint.distanceInfo.fromOrigins.map((origin) => {
                            const originInfo = origins[origin.index - 1];
                            const originName = originInfo ? getShortName(originInfo.name) : `출발지 ${origin.index}`;
                            const color = COLORS[origin.index - 1];

                            return (
                                <div key={origin.index} className="time-item">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-2 h-8 rounded-full"
                                            style={{ background: color }}
                                        />
                                        <span className="text-white/70">{originName}</span>
                                    </div>
                                    <span className="time-value">{origin.value} {origin.unit}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 룰렛 모달 */}
            <Roulette
                candidates={candidates.map(c => ({
                    name: c.station.name,
                    address: c.station.address
                }))}
                isOpen={isRouletteOpen}
                onClose={() => setIsRouletteOpen(false)}
                onSelect={(index) => {
                    if (onCandidateSelect && candidates[index]) {
                        onCandidateSelect(candidates[index], index);
                    }
                }}
            />
        </div>
    );
}

export default MidpointDisplay;
