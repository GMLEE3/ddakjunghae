'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui';
import type { MidpointCandidate, MidpointInfo } from '@/types';

interface OriginInfo {
    name: string;
    lat: number;
    lng: number;
}

interface MidpointStepProps {
    midpoint: MidpointInfo;
    origins: OriginInfo[];
    selectedIndex: number;
    onSelect: (index: number) => void;
    onConfirm: () => void;
    onBack: () => void;
}

// 주소에서 짧은 이름 추출
const getShortName = (address: string): string => {
    const stationMatch = address.match(/([가-힣]+역)/);
    if (stationMatch) return stationMatch[1];
    const parts = address.split(' ');
    if (parts.length >= 2) return parts[1];
    return address;
};

export function MidpointStep({
    midpoint,
    origins,
    selectedIndex,
    onSelect,
    onConfirm,
    onBack,
}: MidpointStepProps) {
    const candidates = midpoint.candidates || [];
    const selectedCandidate = candidates[selectedIndex];

    if (candidates.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
            >
                <p className="text-white/60">중간 지점 후보를 찾을 수 없습니다.</p>
                <Button onClick={onBack} variant="secondary" className="mt-4">
                    ← 이전으로
                </Button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
        >
            {/* 뒤로가기 */}
            <button
                onClick={onBack}
                className="text-white/50 hover:text-white flex items-center gap-2 transition-colors"
            >
                ← 이전으로
            </button>

            {/* 헤더 */}
            <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">
                    📍 어디서 만날까요?
                </h2>
                <p className="text-white/60 text-sm">
                    중간 지점 후보 중 하나를 선택하세요
                </p>
            </div>

            {/* 후보 리스트 */}
            <div className="space-y-3">
                {candidates.map((candidate, index) => (
                    <motion.button
                        key={candidate.station.name}
                        onClick={() => onSelect(index)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`w-full p-4 rounded-2xl text-left transition-all border-2 ${index === selectedIndex
                                ? 'bg-[var(--theme-primary)]/20 border-[var(--theme-primary)] shadow-lg shadow-[var(--theme-primary)]/20'
                                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                            }`}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    {candidate.isRecommended && (
                                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                                            ⭐ 추천
                                        </span>
                                    )}
                                    <h3 className="text-lg font-bold text-white">
                                        {candidate.station.name}
                                    </h3>
                                    {candidate.station.line && (
                                        <span className="text-sm text-white/50">
                                            ({candidate.station.line})
                                        </span>
                                    )}
                                </div>
                                <p className="text-white/50 text-sm mb-3">
                                    {candidate.station.address}
                                </p>

                                {/* 각 출발지에서 소요시간 */}
                                <div className="flex flex-wrap gap-2">
                                    {candidate.times.map((timeInfo) => {
                                        const originInfo = origins[timeInfo.originIndex - 1];
                                        const originName = originInfo
                                            ? getShortName(originInfo.name)
                                            : `출발지 ${timeInfo.originIndex}`;
                                        return (
                                            <span
                                                key={timeInfo.originIndex}
                                                className="px-2 py-1 bg-white/10 rounded-lg text-xs text-white/70"
                                            >
                                                {originName} → {timeInfo.minutes}분
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 최대 소요시간 */}
                            <div className="text-right">
                                <div className={`text-2xl font-bold ${index === selectedIndex
                                        ? 'text-[var(--theme-primary)]'
                                        : 'text-white/80'
                                    }`}>
                                    {candidate.maxTime}분
                                </div>
                                <div className="text-xs text-white/40">최대</div>
                            </div>
                        </div>

                        {/* 선택 표시 */}
                        {index === selectedIndex && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-[var(--theme-primary)] rounded-full flex items-center justify-center"
                            >
                                <span className="text-white text-sm">✓</span>
                            </motion.div>
                        )}
                    </motion.button>
                ))}
            </div>

            {/* 선택된 후보 정보 요약 */}
            {selectedCandidate && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-[var(--theme-primary)]/10 rounded-xl border border-[var(--theme-primary)]/30"
                >
                    <p className="text-white/80 text-sm text-center">
                        <span className="font-bold text-white">{selectedCandidate.station.name}</span>에서 만나면
                        모두 <span className="font-bold text-[var(--theme-primary)]">{selectedCandidate.maxTime}분</span> 이내로 도착해요!
                    </p>
                </motion.div>
            )}

            {/* 확인 버튼 */}
            <Button
                onClick={onConfirm}
                size="lg"
                className="w-full"
            >
                🍽️ 이 지점으로 정하기
            </Button>
        </motion.div>
    );
}

export default MidpointStep;
